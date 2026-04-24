/**
 * Proposal State Machine
 * 
 * Implements the 5-state proposal lifecycle aligned with Demopolis deliberation cycle:
 * draft → review → deliberation → voting → decided
 * 
 * Plus an 'archived' state for proposals that are closed without reaching a decision.
 * 
 * State transitions are validated — invalid transitions throw an error.
 * This ensures proposals follow the deliberation cycle strictly.
 */

import type { Proposal, InsertProposal } from '@shared/schema';
import type { IStorage } from '../storage';
import { enqueueStructureProposal, enqueueNotification, enqueueCreateSortition, enqueueRecalculateScore } from './job-queue';
import { validateProposal } from './proposal-structuring';
import { createSortitionBody } from './sortition';
import { saveMergedProposal } from './amendment-merger';

// ─── State Definitions ──────────────────────────────────────────────────────

export type ProposalState = 
  | 'draft'        // Author is still editing
  | 'review'       // Submitted for LLM structuring + sortition review
  | 'deliberation' // Open for amendments, debate arguments, community discussion
  | 'voting'       // Final vote — no more amendments or debate
  | 'decided'      // Vote completed, outcome recorded
  | 'archived';    // Closed without reaching decision

// ─── Valid Transitions ──────────────────────────────────────────────────────
// 
// The state machine enforces a strict deliberation cycle:
// 
// draft → review (author submits for structuring)
// review → deliberation (LLM/sortition approves structure)
// review → draft (LLM/sortition returns for revision)
// deliberation → voting (debate period ends, time to vote)
// deliberation → archived (author withdraws, or admin closes)
// voting → decided (vote completes)
// voting → archived (vote times out without quorum)
// any → archived (admin can archive at any time)
//
// Note: No backward transitions from voting → deliberation.
// Once voting starts, the proposal is locked.

const VALID_TRANSITIONS: Record<ProposalState, ProposalState[]> = {
  draft: ['review', 'archived'],
  review: ['deliberation', 'draft', 'archived'],
  deliberation: ['voting', 'archived'],
  voting: ['decided', 'archived'],
  decided: [],  // Terminal state — no transitions out
  archived: [], // Terminal state — no transitions out
};

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Check if a state transition is valid.
 */
export function canTransition(from: ProposalState, to: ProposalState): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get all valid next states from the current state.
 */
export function getNextStates(current: ProposalState): ProposalState[] {
  return VALID_TRANSITIONS[current] || [];
}

/**
 * Validate and execute a state transition.
 * 
 * Throws an error if the transition is invalid.
 * Returns the updated proposal on success.
 */
export async function transitionProposal(
  proposal: Proposal,
  newState: ProposalState,
  storage: IStorage,
): Promise<Proposal> {
  if (!canTransition(proposal.status as ProposalState, newState)) {
    throw new Error(
      `Invalid transition: ${proposal.status} → ${newState}. ` +
      `Valid transitions from ${proposal.status}: ${getNextStates(proposal.status as ProposalState).join(', ')}`
    );
  }

  const updates: Partial<Proposal> = {
    status: newState,
    updatedAt: new Date(),
  };

  // Set state-specific timestamps
  if (newState === 'review') {
    updates.reviewStartedAt = new Date();
  }
  if (newState === 'deliberation') {
    updates.deliberationStartedAt = new Date();
  }
  if (newState === 'voting') {
    updates.votingStartedAt = new Date();
  }
  if (newState === 'decided') {
    updates.decidedAt = new Date();
  }
  if (newState === 'archived') {
    updates.archivedAt = new Date();
  }

  return await storage.updateProposal(proposal.id, updates);
}

/**
 * Get a human-readable description of a proposal state.
 * Used for UI display and notifications.
 */
export function getStateDescription(state: ProposalState): string {
  const descriptions: Record<ProposalState, string> = {
    draft: 'Under author revision',
    review: 'Being structured by LLM and reviewed by sortition panel',
    deliberation: 'Open for amendments and community debate',
    voting: 'Final vote in progress',
    decided: 'Decision reached',
    archived: 'Closed without decision',
  };
  return descriptions[state];
}

/**
 * Check if a proposal is in a terminal state (no further transitions possible).
 */
export function isTerminalState(state: ProposalState): boolean {
  return state === 'decided' || state === 'archived';
}

/**
 * Check if a proposal can still be edited by the author.
 * Only drafts can be edited.
 */
export function isEditable(state: ProposalState): boolean {
  return state === 'draft';
}

/**
 * Check if amendments can be submitted.
 * Only during deliberation phase.
 */
export function canAmend(state: ProposalState): boolean {
  return state === 'deliberation';
}

/**
 * Check if debate arguments can be added.
 * Only during deliberation phase.
 */
export function canDebate(state: ProposalState): boolean {
  return state === 'deliberation';
}

/**
 * Check if voting is active.
 */
export function isVoting(state: ProposalState): boolean {
  return state === 'voting';
}

// ─── Side Effects ───────────────────────────────────────────────────────────

/**
 * Trigger side effects for a state transition.
 * 
 * Each transition can trigger background jobs:
 * - draft → review: LLM validation job
 * - review → deliberation: create sortition body for scoring
 * - review → draft: notify author of return
 * - deliberation → voting: open voting phase
 */
export async function triggerSideEffects(
  fromState: ProposalState,
  toState: ProposalState,
  proposal: Proposal,
): Promise<void> {
  const transition = `${fromState}->${toState}`;
  
  switch (transition) {
    case 'draft->review':
      // Queue LLM validation job
      await enqueueStructureProposal(proposal.id, proposal.question, proposal.solution);
      break;
    
    case 'review->deliberation':
      // Create sortition body for scoring (use community's default size)
      await enqueueCreateSortition(proposal.communityId, 20);
      break;
    
    case 'review->draft':
      // Notify author that proposal was returned for revision
      await enqueueNotification(proposal.authorId, 'proposal_returned', 'Your proposal has been returned for revision');
      break;
    
    case 'deliberation->voting':
      // Merge accepted amendments into proposal text before voting opens
      await saveMergedProposal(proposal.id);
      // Recalculate democracy score when voting opens
      await enqueueRecalculateScore(proposal.communityId);
      break;
    
    default:
      // No side effects for other transitions
      break;
  }
}

export { VALID_TRANSITIONS };
