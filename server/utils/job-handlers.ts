/**
 * Job Handlers Registration
 * 
 * Registers all job type handlers and starts the background worker.
 * Import this module during server startup to wire up the job queue.
 */

import { registerHandler, startWorker, type JobPayload } from './job-queue';
import { handleSortitionCompletion } from './proposal-state-machine';
import { checkSortitionTimeout, completeSortitionBody, replaceNonRespondingMembers } from './sortition-timeout';
import { db } from '../db';
import { sortitionBodies } from '@shared/schema';
import { eq } from 'drizzle-orm';

// ─── Handler: structure_proposal ────────────────────────────────────────────

async function handleStructureProposal(payload: JobPayload): Promise<void> {
  const { proposalId, question, solution } = payload.data;
  console.log(`[job] Structuring proposal ${proposalId}`);
  // TODO: Call LLM to structure the proposal
  // For now, just log — the LLM integration is handled via routes
}

// ─── Handler: send_notification ─────────────────────────────────────────────

async function handleSendNotification(payload: JobPayload): Promise<void> {
  const { userId, type, message } = payload.data;
  console.log(`[job] Notification for user ${userId}: ${type} — ${message}`);
  // TODO: Actually persist to notifications table and push via WebSocket/email
}

// ─── Handler: create_sortition ──────────────────────────────────────────────

async function handleCreateSortition(payload: JobPayload): Promise<void> {
  const { communityId, size, proposalId, purpose } = payload.data;
  console.log(`[job] Creating sortition body: community=${communityId}, size=${size}, purpose=${purpose}`);
  
  const { createSortitionBody } = await import('./sortition');
  const { storage } = await import('../storage');
  
  // createSortitionBody handles selection + DB insert in one call
  const result = await createSortitionBody(
    communityId,
    size,
    storage,
    purpose,
    proposalId ?? undefined,
  );
  
  console.log(`[job] Sortition body ${result.bodyId} created with ${result.selectedCount} members (seed: ${result.seed})`);
}

// ─── Handler: recalculate_score ─────────────────────────────────────────────

async function handleRecalculateScore(payload: JobPayload): Promise<void> {
  const { communityId } = payload.data;
  console.log(`[job] Recalculating democracy score for community ${communityId}`);
  // TODO: Implement score recalculation logic
}

// ─── Handler: cleanup_expired ───────────────────────────────────────────────

async function handleCleanupExpired(payload: JobPayload): Promise<void> {
  console.log('[job] Cleaning up expired sessions/votes');
  // TODO: Implement cleanup logic
}

// ─── Handler: sortition_timeout ─────────────────────────────────────────────

async function handleSortitionTimeout(payload: JobPayload): Promise<void> {
  console.log('[job] Sortition timeout sweep started');
  
  // Query all active sortition bodies
  const activeBodies = await db
    .select()
    .from(sortitionBodies)
    .where(eq(sortitionBodies.status, 'active'));
  
  let processed = 0;
  
  for (const body of activeBodies) {
    const isTimedOut = await checkSortitionTimeout(body.id);
    
    if (isTimedOut) {
      console.log(`[job] Body ${body.id} has timed out`);
      
      // First, try to replace non-responders
      const nonResponding = await replaceNonRespondingMembers(body.id, body.communityId);
      console.log(`[job] Replaced ${nonResponding} non-responding members in body ${body.id}`);
      
      // Then complete the body and handle the proposal transition
      if (body.proposalId) {
        await handleSortitionCompletion(body.id, body.proposalId);
      } else {
        await completeSortitionBody(body.id);
      }
      
      processed++;
    }
  }
  
  console.log(`[job] Sortition timeout sweep complete: ${processed} bodies processed out of ${activeBodies.length}`);
}

// ─── Register all handlers ──────────────────────────────────────────────────

export function registerAllHandlers(): void {
  registerHandler('structure_proposal', handleStructureProposal);
  registerHandler('send_notification', handleSendNotification);
  registerHandler('create_sortition', handleCreateSortition);
  registerHandler('recalculate_score', handleRecalculateScore);
  registerHandler('cleanup_expired', handleCleanupExpired);
  registerHandler('sortition_timeout', handleSortitionTimeout);
  
  console.log('[job-queue] All handlers registered');
}

// ─── Start the worker ───────────────────────────────────────────────────────

/**
 * Start the job queue worker and sortition timeout scheduler.
 * Returns a cleanup function to stop both.
 */
export function startJobQueue(): () => void {
  // Register handlers first
  registerAllHandlers();
  
  // Start the worker (polls every 5 seconds)
  const stopWorker = startWorker(5000);
  
  console.log('[job-queue] Worker started (5s interval)');
  
  return stopWorker;
}
