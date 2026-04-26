/**
 * Amendment Merger
 * 
 * Merges accepted amendments into the original proposal text.
 * Supports three amendment types:
 * - improvement: Refines existing text (appended as notes)
 * - addition: Adds new content (appended to solution)
 * - removal: Removes content (marked as removed)
 * - counter_proposal: Alternative solution (presented as competing option)
 * 
 * The merged text becomes the final proposal that goes to voting.
 */

import { db } from '../db';
import { proposalAmendments, proposals } from '../../shared/schema';
import { eq } from 'drizzle-orm';

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
  authorName: string;
  status: string | null;
  supportCount: number;
  opposeCount: number;
}

/**
 * Merge accepted amendments into the proposal text.
 * 
 * Process:
 * 1. Fetch all amendments for the proposal
 * 2. Separate by status (accepted, rejected, pending)
 * 3. For accepted amendments:
 *    - improvement: Append as refinement notes
 *    - addition: Append to solution text
 *    - removal: Mark as removed in solution
 *    - counter_proposal: Present as competing option
 * 4. Return merged text and amendment summary
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

  const accepted = amendments.filter(a => a.status === 'accepted');
  const rejected = amendments.filter(a => a.status === 'rejected');
  const pending = amendments.filter(a => a.status === 'pending' || a.status === 'under_review');
  const counterProposals = amendments.filter(a => a.type === 'counter_proposal' && a.status === 'accepted');

  // Start with original text
  let mergedQuestion = proposal.question;
  let mergedSolution = proposal.solution;

  // Process accepted amendments
  for (const amendment of accepted) {
    if (amendment.type === 'improvement') {
      // Append as refinement note
      mergedSolution += `\n\n[Βελτίωση] ${amendment.text}`;
    } else if (amendment.type === 'addition') {
      // Append to solution
      mergedSolution += `\n\n[Προσθήκη] ${amendment.text}`;
    } else if (amendment.type === 'removal') {
      // Mark as removed
      mergedSolution += `\n\n[Αφαίρεση] ${amendment.text}`;
    }
    // counter_proposal handled separately
  }

  // Build summary
  const acceptedSummaries: AmendmentSummary[] = accepted.map(a => ({
    id: a.id,
    type: a.type,
    text: a.text,
    authorName: `User ${a.authorId}`, // TODO: Join with users table
    status: a.status,
    supportCount: 0, // TODO: Count from debate arguments
    opposeCount: 0,
  }));

  const rejectedSummaries: AmendmentSummary[] = rejected.map(a => ({
    id: a.id,
    type: a.type,
    text: a.text,
    authorName: `User ${a.authorId}`,
    status: a.status,
    supportCount: 0,
    opposeCount: 0,
  }));

  const counterSummaries: AmendmentSummary[] = counterProposals.map(a => ({
    id: a.id,
    type: a.type,
    text: a.text,
    authorName: `User ${a.authorId}`,
    status: a.status,
    supportCount: 0,
    opposeCount: 0,
  }));

  return {
    originalQuestion: proposal.question,
    originalSolution: proposal.solution,
    mergedQuestion,
    mergedSolution,
    acceptedAmendments: acceptedSummaries,
    rejectedAmendments: rejectedSummaries,
    counterProposals: counterSummaries,
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
    // Multiple options: original + counter-proposals
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

  // Single option: yes/no on merged proposal
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