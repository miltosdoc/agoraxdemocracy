/**
 * Job Handlers Registration
 * 
 * Registers all job type handlers and starts the background worker.
 * Import this module during server startup to wire up the job queue.
 */

import { registerHandler, startWorker, type JobPayload } from './job-queue';
import { handleSortitionCompletion, transitionToValidation } from './proposal-state-machine';
import { checkSortitionTimeout, completeSortitionBody, replaceNonRespondingMembers } from './sortition-timeout';
import { db } from '../db';
import { sortitionBodies } from '@shared/schema';
import { eq } from 'drizzle-orm';

// ─── Handler: structure_proposal ────────────────────────────────────────────

/**
 * Handle the `structure_proposal` job.
 *
 * Drives the proposal through LLM validation: scores it, persists the full
 * result to `validation_results`, and routes to the next canonical state
 * (`draft` for return, `author_review` for sortition, `voting` for auto-
 * approve). Notifications and follow-up jobs (sortition body, score recalc)
 * are queued by `transitionToValidation`. Errors propagate so the job queue
 * can retry — failure here leaves the proposal in `review`.
 */
async function handleStructureProposal(payload: JobPayload): Promise<void> {
  const { proposalId } = payload.data as { proposalId: number };
  if (typeof proposalId !== 'number') {
    throw new Error(`structure_proposal: missing or invalid proposalId in payload`);
  }

  console.log(`[job] Validating proposal ${proposalId} via LLM`);
  const outcome = await transitionToValidation(proposalId);
  console.log(
    `[job] Proposal ${proposalId} validated: score=${outcome.score} ` +
    `category=${outcome.category} → ${outcome.toState}`
  );
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
