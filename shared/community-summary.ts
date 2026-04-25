import type { Community, Proposal } from './schema';

export type CommunityUserRole = 'founder' | 'admin' | 'member' | string | undefined;

export interface CommunitySummaryPermissions {
  canManageSettings: boolean;
}

export interface CommunityProposalSummary {
  id: number;
  question: string;
  status: string;
  authorId: number;
  authorLabel: string;
  createdAt: string;
}

export interface CommunitySummary {
  community: Community;
  memberCount: number;
  currentUserRole?: string;
  canManageSettings: boolean;
  proposals: CommunityProposalSummary[];
}

export function getCommunitySummaryPermissions(role: CommunityUserRole): CommunitySummaryPermissions {
  return { canManageSettings: role === 'founder' || role === 'admin' };
}

export function mapProposalToCommunitySummary(proposal: Pick<Proposal, 'id' | 'question' | 'status' | 'authorId' | 'createdAt'>): CommunityProposalSummary {
  return {
    id: proposal.id,
    question: proposal.question,
    status: proposal.status,
    authorId: proposal.authorId,
    authorLabel: `User #${proposal.authorId}`,
    createdAt: proposal.createdAt instanceof Date ? proposal.createdAt.toISOString() : String(proposal.createdAt),
  };
}

export function buildCommunitySummary(
  community: Community,
  proposals: Pick<Proposal, 'id' | 'question' | 'status' | 'authorId' | 'createdAt'>[],
  memberCount: number,
  currentUserRole?: string,
): CommunitySummary {
  const permissions = getCommunitySummaryPermissions(currentUserRole);

  return {
    community,
    memberCount,
    currentUserRole,
    canManageSettings: permissions.canManageSettings,
    proposals: proposals.map(mapProposalToCommunitySummary),
  };
}
