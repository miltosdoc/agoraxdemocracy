/**
 * Amendment Merger
 *
 * Two responsibilities:
 *
 * 1. Detect overlap between amendments targeting the same proposal so the
 *    author can review groups of duplicates instead of identical text twice.
 *    Pure similarity helpers live in `amendment-similarity.ts`; this module
 *    glues them to the database.
 *
 * 2. Merge accepted amendments back into the proposal text. The author flow
 *    in `amendment-processor.ts` writes to `authorDecision`; we read from
 *    that as the source of truth and treat the legacy `status` column as a
 *    fallback only.
 */

import { db } from '../db';
import { proposalAmendments, proposals } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import {
  DEFAULT_SIMILARITY_THRESHOLD,
  groupDuplicates,
  type DuplicateGroup,
} from './amendment-similarity';

export interface MergedProposal {
  originalQuestion: string;
  originalSolution: string;
  mergedQuestion: string;
  mergedSolution: string;
  acceptedAmendments: AmendmentSummary[];
  rejectedAmendments: AmendmentSummary[];
  counterProposals: AmendmentSummary[];
}

export interface AmendmentSummary {
  id: number;
  type: string;
  text: string;
  authorId: number;
  decision: 'accepted' | 'rejected' | 'pending';
}

export type { DuplicateGroup } from './amendment-similarity';
export { DEFAULT_SIMILARITY_THRESHOLD } from './amendment-similarity';

function effectiveDecision(a: { authorDecision: string | null; status: string | null }): 'accepted' | 'rejected' | 'pending' {
  if (a.authorDecision === 'accepted' || a.authorDecision === 'rejected') return a.authorDecision;
  if (a.status === 'accepted' || a.status === 'rejected') return a.status;
  return 'pending';
}

/**
 * Find groups of amendments on the same proposal whose normalized word sets
 * exceed the similarity threshold. Used to flag duplicates for the author
 * before they review each amendment one by one.
 */
export async function findDuplicateAmendments(
  proposalId: number,
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD,
): Promise<DuplicateGroup[]> {
  const amendments = await db.query.proposalAmendments.findMany({
    where: eq(proposalAmendments.proposalId, proposalId),
  });

  return groupDuplicates(
    amendments.map(a => ({ id: a.id, type: a.type, text: a.text })),
    threshold,
  );
}

/**
 * Merge accepted amendments into the proposal text.
 *
 * Reads `authorDecision` first and falls back to legacy `status`.
 * Counter-proposals are tracked separately so they can be presented as
 * competing options instead of inlined into the solution.
 */
export async function mergeAmendments(proposalId: number): Promise<MergedProposal> {
  const proposal = await db.query.proposals.findFirst({
    where: eq(proposals.id, proposalId),
  });

  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found`);
  }

  const amendments = await db.query.proposalAmendments.findMany({
    where: eq(proposalAmendments.proposalId, proposalId),
  });

  const decorated = amendments.map(a => ({
    raw: a,
    decision: effectiveDecision(a),
  }));

  const accepted = decorated.filter(d => d.decision === 'accepted');
  const rejected = decorated.filter(d => d.decision === 'rejected');
  const counterProposals = accepted.filter(d => d.raw.type === 'counter_proposal');

  let mergedQuestion = proposal.question;
  let mergedSolution = proposal.solution;

  for (const { raw } of accepted) {
    if (raw.type === 'counter_proposal') continue;

    if (raw.type === 'improvement') {
      mergedSolution += `\n\n[Βελτίωση] ${raw.text}`;
    } else if (raw.type === 'addition') {
      mergedSolution += `\n\n[Προσθήκη] ${raw.text}`;
    } else if (raw.type === 'removal') {
      mergedSolution += `\n\n[Αφαίρεση] ${raw.text}`;
    }
  }

  const summarize = (entry: { raw: typeof amendments[number]; decision: 'accepted' | 'rejected' | 'pending' }): AmendmentSummary => ({
    id: entry.raw.id,
    type: entry.raw.type,
    text: entry.raw.text,
    authorId: entry.raw.authorId,
    decision: entry.decision,
  });

  return {
    originalQuestion: proposal.question,
    originalSolution: proposal.solution,
    mergedQuestion,
    mergedSolution,
    acceptedAmendments: accepted.map(summarize),
    rejectedAmendments: rejected.map(summarize),
    counterProposals: counterProposals.map(summarize),
  };
}

/**
 * Generate the final voting text from merged proposal.
 *
 * If there are counter-proposals, presents them as competing options.
 * Otherwise, presents the merged proposal as a single yes/no vote.
 */
export function generateVotingText(merged: MergedProposal): {
  question: string;
  options: string[];
  hasCounterProposals: boolean;
} {
  if (merged.counterProposals.length > 0) {
    const options = [
      merged.mergedSolution,
      ...merged.counterProposals.map(cp => cp.text),
    ];
    return {
      question: merged.mergedQuestion,
      options,
      hasCounterProposals: true,
    };
  }

  return {
    question: merged.mergedQuestion,
    options: [merged.mergedSolution],
    hasCounterProposals: false,
  };
}

/**
 * Save merged proposal text back to the database.
 * Called when transitioning from deliberation → voting.
 */
export async function saveMergedProposal(proposalId: number): Promise<void> {
  const merged = await mergeAmendments(proposalId);

  await db.update(proposals)
    .set({
      question: merged.mergedQuestion,
      solution: merged.mergedSolution,
      updatedAt: new Date(),
    })
    .where(eq(proposals.id, proposalId));
}
