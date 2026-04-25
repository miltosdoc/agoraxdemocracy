/**
 * Proposal State Machine v2
 * 
 * Implements the revised deliberation cycle with author-as-editor model:
 * 
 * draft → review → author_review → community_signal → sortition_synthesis → voting → decided
 * 
 * Plus an 'archived' state for proposals that are closed without reaching a decision.
 * 
 * State transitions are validated — invalid transitions throw an error.
 * This ensures proposals follow the deliberation cycle strictly.
 */

import type { Proposal } from '@shared/schema';
import type { IStorage } from '../storage';
import {
  PROPOSAL_STATE_DESCRIPTIONS,
  VALID_PROPOSAL_TRANSITIONS,
  assertProposalState,
  canTransitionProposal,
  getNextProposalStates,
  isTerminalProposalState,
  type ProposalState,
} from '@shared/proposal-lifecycle';
import { enqueueStructureProposal, enqueueNotification, enqueueCreateSortition, enqueueRecalculateScore } from './job-queue';

export type { ProposalState } from '@shared/proposal-lifecycle';

// ─── Valid Transitions ──────────────────────────────────────────────────────
// 
// The state machine enforces a strict deliberation cycle:
// 
// draft → review (author submits for LLM validation)
// review → author_review (LLM validates, amendments can now be submitted)
// review → draft (LLM returns for revision)
// review → archived (LLM rejects outright)
// author_review → community_signal (author finishes reviewing all amendments)
// author_review → archived (author withdraws)
// community_signal → sortition_synthesis (signal period ends, flagged amendments identified)
// community_signal → archived (no amendments to flag, goes straight to voting)
// sortition_synthesis → voting (sortition body submits final text)
// sortition_synthesis → author_review (sortition returns for revision)
// voting → decided (vote completes)
// voting → archived (vote times out without quorum)
// any → archived (admin can archive at any time)
//
// Note: No backward transitions from voting → sortition_synthesis.
// Once voting starts, the proposal is locked.

const VALID_TRANSITIONS = VALID_PROPOSAL_TRANSITIONS;

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Check if a state transition is valid.
 */
export function canTransition(from: ProposalState, to: ProposalState): boolean {
  return canTransitionProposal(from, to);
}

/**
 * Get all valid next states from the current state.
 */
export function getNextStates(current: ProposalState): ProposalState[] {
  return [...getNextProposalStates(current)];
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
  const currentState = assertProposalState(proposal.status);

  if (!canTransition(currentState, newState)) {
    throw new Error(
      `Invalid transition: ${proposal.status} → ${newState}. ` +
      `Valid transitions from ${proposal.status}: ${getNextStates(currentState).join(', ')}`
    );
  }

  return await storage.updateProposal(proposal.id, { status: newState });
}

/**
 * Get a human-readable description of a proposal state.
 * Used for UI display and notifications.
 */
export function getStateDescription(state: ProposalState): string {
  return PROPOSAL_STATE_DESCRIPTIONS[state];
}

/**
 * Check if a proposal is in a terminal state (no further transitions possible).
 */
export function isTerminalState(state: ProposalState): boolean {
  return isTerminalProposalState(state);
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
 * During review and author_review phases.
 */
export function canAmend(state: ProposalState): boolean {
  return state === 'review' || state === 'author_review';
}

/**
 * Check if the author can review amendments.
 */
export function canAuthorReview(state: ProposalState): boolean {
  return state === 'author_review';
}

/**
 * Check if community can vote on rejected amendments.
 */
export function canCommunitySignal(state: ProposalState): boolean {
  return state === 'community_signal';
}

/**
 * Check if sortition body can compose final text.
 */
export function canSortitionSynthesize(state: ProposalState): boolean {
  return state === 'sortition_synthesis';
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
 * - review → author_review: notify author to review amendments
 * - review → draft: notify author of return
 * - author_review → community_signal: open community voting on rejected amendments
 * - community_signal → sortition_synthesis: create sortition body for synthesis
 * - sortition_synthesis → voting: open voting phase
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
    
    case 'review->author_review':
      // Notify author to review submitted amendments
      await enqueueNotification(proposal.authorId, 'amendments_ready', 'Amendments are ready for your review');
      break;
    
    case 'review->draft':
      // Notify author that proposal was returned for revision
      await enqueueNotification(proposal.authorId, 'proposal_returned', 'Your proposal has been returned for revision');
      break;
    
    case 'author_review->community_signal':
      // Open community voting on rejected amendments
      await enqueueNotification(proposal.authorId, 'community_signal_open', 'Community is now voting on your rejected amendments');
      break;
    
    case 'community_signal->sortition_synthesis':
      // Create sortition body for text synthesis
      await enqueueCreateSortition(proposal.communityId, 12, proposal.id, 'text_synthesis');
      break;
    
    case 'sortition_synthesis->voting':
      // Recalculate democracy score when voting opens
      await enqueueRecalculateScore(proposal.communityId);
      break;
    
    default:
      // No side effects for other transitions
      break;
  }
}

export { VALID_TRANSITIONS };