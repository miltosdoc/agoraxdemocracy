/**
 * State Machine Integration Tests
 * 
 * Tests for the proposal state machine transitions and side effects.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  transitionState,
  isValidTransition,
  getValidNextStates,
  triggerSideEffects,
  ProposalState,
} from '../../server/utils/proposal-state-machine';
import { enqueueStructureProposal, enqueueNotification, enqueueCreateSortition, enqueueRecalculateScore } from '../../server/utils/job-queue';

// Mock the job queue functions
vi.mock('../../server/utils/job-queue', () => ({
  enqueueStructureProposal: vi.fn().mockResolvedValue('job-123'),
  enqueueNotification: vi.fn().mockResolvedValue('job-456'),
  enqueueCreateSortition: vi.fn().mockResolvedValue('job-789'),
  enqueueRecalculateScore: vi.fn().mockResolvedValue('job-000'),
}));

// ─── Transition Validation Tests ─────────────────────────────────────────────

describe('State Machine - Transition Validation', () => {
  it('should allow draft → review', () => {
    expect(isValidTransition('draft', 'review')).toBe(true);
  });

  it('should allow review → deliberation', () => {
    expect(isValidTransition('review', 'deliberation')).toBe(true);
  });

  it('should allow review → draft (return for revision)', () => {
    expect(isValidTransition('review', 'draft')).toBe(true);
  });

  it('should allow deliberation → voting', () => {
    expect(isValidTransition('deliberation', 'voting')).toBe(true);
  });

  it('should allow voting → decided', () => {
    expect(isValidTransition('voting', 'decided')).toBe(true);
  });

  it('should allow voting → deliberation (extend deliberation)', () => {
    expect(isValidTransition('voting', 'deliberation')).toBe(true);
  });

  it('should allow any state → archived', () => {
    expect(isValidTransition('draft', 'archived')).toBe(true);
    expect(isValidTransition('review', 'archived')).toBe(true);
    expect(isValidTransition('deliberation', 'archived')).toBe(true);
    expect(isValidTransition('voting', 'archived')).toBe(true);
    expect(isValidTransition('decided', 'archived')).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(isValidTransition('draft', 'voting')).toBe(false);
    expect(isValidTransition('draft', 'decided')).toBe(false);
    expect(isValidTransition('voting', 'review')).toBe(false);
    expect(isValidTransition('decided', 'voting')).toBe(false);
    expect(isValidTransition('archived', 'draft')).toBe(false);
  });
});

// ─── Valid Next States Tests ─────────────────────────────────────────────────

describe('State Machine - Valid Next States', () => {
  it('should return correct next states for draft', () => {
    expect(getValidNextStates('draft')).toEqual(['review', 'archived']);
  });

  it('should return correct next states for review', () => {
    expect(getValidNextStates('review')).toEqual(['deliberation', 'draft', 'archived']);
  });

  it('should return correct next states for deliberation', () => {
    expect(getValidNextStates('deliberation')).toEqual(['voting', 'archived']);
  });

  it('should return correct next states for voting', () => {
    expect(getValidNextStates('voting')).toEqual(['decided', 'deliberation', 'archived']);
  });

  it('should return correct next states for decided', () => {
    expect(getValidNextStates('decided')).toEqual(['archived']);
  });

  it('should return no next states for archived', () => {
    expect(getValidNextStates('archived')).toEqual([]);
  });
});

// ─── Transition Function Tests ───────────────────────────────────────────────

describe('State Machine - transitionState()', () => {
  it('should transition from draft to review', () => {
    const result = transitionState('draft', 'review');
    expect(result).toBe('review');
  });

  it('should throw on invalid transition', () => {
    expect(() => transitionState('draft', 'voting')).toThrow('Invalid state transition');
  });

  it('should throw on transition from archived', () => {
    expect(() => transitionState('archived', 'draft')).toThrow('Invalid state transition');
  });
});

// ─── Side Effects Tests ──────────────────────────────────────────────────────

describe('State Machine - Side Effects', () => {
  const mockProposal = {
    id: 1,
    communityId: 1,
    authorId: 42,
    question: 'Test question',
    solution: 'Test solution',
    state: 'draft' as ProposalState,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should queue LLM validation on draft → review', async () => {
    await triggerSideEffects('draft', 'review', mockProposal);

    expect(enqueueStructureProposal).toHaveBeenCalledWith(
      mockProposal.id,
      mockProposal.question,
      mockProposal.solution,
    );
  });

  it('should create sortition body on review → deliberation', async () => {
    await triggerSideEffects('review', 'deliberation', mockProposal);

    expect(enqueueCreateSortition).toHaveBeenCalledWith(
      mockProposal.communityId,
      20,
    );
  });

  it('should notify author on review → draft', async () => {
    await triggerSideEffects('review', 'draft', mockProposal);

    expect(enqueueNotification).toHaveBeenCalledWith(
      mockProposal.authorId,
      'proposal_returned',
      'Your proposal has been returned for revision',
    );
  });

  it('should recalculate democracy score on deliberation → voting', async () => {
    await triggerSideEffects('deliberation', 'voting', mockProposal);

    expect(enqueueRecalculateScore).toHaveBeenCalledWith(mockProposal.communityId);
  });

  it('should not trigger side effects for voting → decided', async () => {
    await triggerSideEffects('voting', 'decided', mockProposal);

    expect(enqueueStructureProposal).not.toHaveBeenCalled();
    expect(enqueueNotification).not.toHaveBeenCalled();
    expect(enqueueCreateSortition).not.toHaveBeenCalled();
    expect(enqueueRecalculateScore).not.toHaveBeenCalled();
  });
});
