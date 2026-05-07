/**
 * State Machine Integration Tests
 * 
 * Tests for the proposal state machine transitions and side effects.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  canTransition,
  getNextStates,
  transitionProposal,
  triggerSideEffects,
  ProposalState,
} from '../../server/utils/proposal-state-machine';
import { enqueueStructureProposal, enqueueNotification, enqueueCreateSortition, enqueueRecalculateScore } from '../../server/utils/job-queue';

function createMockStorage() {
  return {
    updateProposal: vi.fn(async (id: number, updates: Record<string, unknown>) => ({
      id,
      communityId: 1,
      authorId: 42,
      question: 'Test question',
      solution: 'Test solution',
      status: updates.status,
    })),
  };
}

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
    expect(canTransition('draft', 'review')).toBe(true);
  });

  it('should allow review → author_review', () => {
    expect(canTransition('review', 'author_review')).toBe(true);
  });

  it('should allow review → draft (return for revision)', () => {
    expect(canTransition('review', 'draft')).toBe(true);
  });

  it('should allow author_review → community_signal', () => {
    expect(canTransition('author_review', 'community_signal')).toBe(true);
  });

  it('should allow community_signal → sortition_synthesis', () => {
    expect(canTransition('community_signal', 'sortition_synthesis')).toBe(true);
  });

  it('should allow sortition_synthesis → voting', () => {
    expect(canTransition('sortition_synthesis', 'voting')).toBe(true);
  });

  it('should allow voting → decided', () => {
    expect(canTransition('voting', 'decided')).toBe(true);
  });

  it('should allow any state → archived', () => {
    expect(canTransition('draft', 'archived')).toBe(true);
    expect(canTransition('review', 'archived')).toBe(true);
    expect(canTransition('author_review', 'archived')).toBe(true);
    expect(canTransition('community_signal', 'archived')).toBe(true);
    expect(canTransition('sortition_synthesis', 'archived')).toBe(true);
    expect(canTransition('voting', 'archived')).toBe(true);
  });

  it('should reject invalid transitions', () => {
    expect(canTransition('draft', 'voting')).toBe(false);
    expect(canTransition('draft', 'decided')).toBe(false);
    expect(canTransition('voting', 'review')).toBe(false);
    expect(canTransition('decided', 'voting')).toBe(false);
    expect(canTransition('archived', 'draft')).toBe(false);
  });
});

// ─── Valid Next States Tests ─────────────────────────────────────────────────

describe('State Machine - Valid Next States', () => {
  it('should return correct next states for draft', () => {
    expect(getNextStates('draft')).toEqual(['review', 'archived']);
  });

  it('should return correct next states for review', () => {
    expect(getNextStates('review')).toEqual(['author_review', 'draft', 'voting', 'archived']);
  });

  it('should allow review → voting (auto-approve fast path)', () => {
    expect(canTransition('review', 'voting')).toBe(true);
  });

  it('should return correct next states for author_review', () => {
    expect(getNextStates('author_review')).toEqual(['community_signal', 'archived']);
  });

  it('should return correct next states for voting', () => {
    expect(getNextStates('voting')).toEqual(['decided', 'archived']);
  });

  it('should return correct next states for decided', () => {
    expect(getNextStates('decided')).toEqual([]);
  });

  it('should return no next states for archived', () => {
    expect(getNextStates('archived')).toEqual([]);
  });
});

// ─── Transition Function Tests ───────────────────────────────────────────────

describe('State Machine - Transition Execution', () => {
  it('updates proposal state through storage', async () => {
    const storage = createMockStorage();
    const proposal = {
      id: 1,
      communityId: 1,
      authorId: 42,
      question: 'Test question',
      solution: 'Test solution',
      status: 'draft' as ProposalState,
    };

    const updated = await transitionProposal(proposal as any, 'review', storage as any);

    expect(storage.updateProposal).toHaveBeenCalledWith(1, { status: 'review' });
    expect(updated.status).toBe('review');
  });

  it('rejects invalid transition execution', async () => {
    const storage = createMockStorage();
    const proposal = {
      id: 1,
      communityId: 1,
      authorId: 42,
      question: 'Test question',
      solution: 'Test solution',
      status: 'draft' as ProposalState,
    };

    await expect(transitionProposal(proposal as any, 'voting', storage as any)).rejects.toThrow(
      'Invalid transition: draft → voting',
    );
    expect(storage.updateProposal).not.toHaveBeenCalled();
  });
});

describe('State Machine - Side Effects', () => {
  const mockProposal = {
    id: 1,
    communityId: 1,
    authorId: 42,
    question: 'Test question',
    solution: 'Test solution',
    status: 'draft' as ProposalState,
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

  it('should create sortition body on community_signal → sortition_synthesis', async () => {
    await triggerSideEffects('community_signal', 'sortition_synthesis', mockProposal);

    expect(enqueueCreateSortition).toHaveBeenCalledWith(
      mockProposal.communityId,
      12,
      mockProposal.id,
      'text_synthesis',
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

  it('should recalculate democracy score on sortition_synthesis → voting', async () => {
    await triggerSideEffects('sortition_synthesis', 'voting', mockProposal);

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
