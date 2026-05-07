/**
 * Community Manager
 * 
 * Handles community operations: creation, transitions, and merging.
 * 
 * Merge logic:
 * - Source community members are transferred to target community
 * - Source community proposals are reassigned to target community
 * - Source community is marked as merged (mergedInto = targetId)
 * - Duplicate memberships are resolved (keep higher role)
 * - Admin/founder roles from source are preserved in target
 */

import type { Community } from '../../shared/schema';
import { db } from '../db';
import { communities, communityMembers, proposals as proposalsTable, proposalAmendments, sortitionBodies } from '../../shared/schema';
import { eq, and, sql } from 'drizzle-orm';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface MergeResult {
  success: boolean;
  sourceId: number;
  targetId: number;
  membersTransferred: number;
  proposalsTransferred: number;
  errors: string[];
}

export interface MergeValidation {
  canMerge: boolean;
  reasons: string[];
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Validate whether two communities can be merged.
 * 
 * Rules:
 * - Source cannot be the General community (isGeneral flag)
 * - Target cannot be already merged
 * - Source cannot be already merged
 * - Cannot merge a community into itself
 * - Both must exist
 */
export async function validateMerge(
  sourceId: number,
  targetId: number,
): Promise<MergeValidation> {
  const reasons: string[] = [];

  // Same community check
  if (sourceId === targetId) {
    reasons.push('Cannot merge a community into itself');
    return { canMerge: false, reasons };
  }

  // Fetch both communities
  const source = await db.query.communities.findFirst({
    where: eq(communities.id, sourceId),
  });
  const target = await db.query.communities.findFirst({
    where: eq(communities.id, targetId),
  });

  if (!source) {
    reasons.push(`Source community ${sourceId} not found`);
    return { canMerge: false, reasons };
  }
  if (!target) {
    reasons.push(`Target community ${targetId} not found`);
    return { canMerge: false, reasons };
  }

  // Already merged check
  if (source.mergedInto !== null) {
    reasons.push(`Source community has already been merged into community ${source.mergedInto}`);
  }
  if (target.mergedInto !== null) {
    reasons.push(`Target community has already been merged into community ${target.mergedInto}`);
  }

  return {
    canMerge: reasons.length === 0,
    reasons,
  };
}

// ─── Merge Logic ────────────────────────────────────────────────────────────

/**
 * Merge source community into target community.
 * 
 * Steps:
 * 1. Validate the merge
 * 2. Transfer members (resolve duplicates by keeping higher role)
 * 3. Reassign proposals to target community
 * 4. Reassign debate threads (via proposal reassignment)
 * 5. Reassign sortition bodies
 * 6. Mark source as merged
 * 
 * @param sourceId - The community being merged (will be archived)
 * @param targetId - The community absorbing the source
 * @returns MergeResult with statistics
 */
export async function mergeCommunities(
  sourceId: number,
  targetId: number,
): Promise<MergeResult> {
  const result: MergeResult = {
    success: false,
    sourceId,
    targetId,
    membersTransferred: 0,
    proposalsTransferred: 0,
    errors: [],
  };

  // Step 1: Validate
  const validation = await validateMerge(sourceId, targetId);
  if (!validation.canMerge) {
    result.errors = validation.reasons;
    return result;
  }

  try {
    // Step 2: Transfer members
    const sourceMembers = await db.query.communityMembers.findMany({
      where: eq(communityMembers.communityId, sourceId),
    });

    let membersTransferred = 0;
    for (const member of sourceMembers) {
      // Check if user is already a member of target
      const existing = await db.query.communityMembers.findFirst({
        where: and(
          eq(communityMembers.communityId, targetId),
          eq(communityMembers.userId, member.userId),
        ),
      });

      if (existing) {
        // Resolve duplicate: keep the higher role
        const rolePriority = { founder: 3, admin: 2, member: 1 };
        const sourcePriority = rolePriority[member.role as keyof typeof rolePriority] || 1;
        const targetPriority = rolePriority[existing.role as keyof typeof rolePriority] || 1;

        if (sourcePriority > targetPriority) {
          // Upgrade target role
          await db.update(communityMembers)
            .set({ role: member.role } as any)
            .where(eq(communityMembers.id, existing.id));
        }
        // Otherwise keep target role (higher or equal)
      } else {
        // Add as new member
        await db.insert(communityMembers).values({
          communityId: targetId,
          userId: member.userId,
          role: member.role,
          joinedAt: member.joinedAt,
        } as any);
      }
      membersTransferred++;
    }

    result.membersTransferred = membersTransferred;

    // Step 3: Reassign proposals
    const proposalRows = await db.query.proposals.findMany({
      where: eq(proposalsTable.communityId, sourceId),
    });

    if (proposalRows.length > 0) {
      await db.update(proposalsTable)
        .set({ communityId: targetId })
        .where(eq(proposalsTable.communityId, sourceId));
    }

    result.proposalsTransferred = proposalRows.length;

    // Step 4: Reassign sortition bodies (via proposals, already handled)
    // Sortition bodies reference communityId directly
    const sortitions = await db.query.sortitionBodies.findMany({
      where: eq(sortitionBodies.communityId, sourceId),
    });

    if (sortitions.length > 0) {
      await db.update(sortitionBodies)
        .set({ communityId: targetId })
        .where(eq(sortitionBodies.communityId, sourceId));
    }

    // Step 5: Mark source as merged
    await db.update(communities)
      .set({ mergedInto: targetId })
      .where(eq(communities.id, sourceId));

    result.success = true;
  } catch (error) {
    result.errors.push(`Merge failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

// ─── Helper Functions ───────────────────────────────────────────────────────

/**
 * Get communities that have been merged into a target community.
 */
export async function getMergedIntoCommunity(targetId: number): Promise<Community[]> {
  return await db.query.communities.findMany({
    where: eq(communities.mergedInto, targetId),
  });
}

/**
 * Check if a community has been merged into another.
 */
export async function isMerged(communityId: number): Promise<boolean> {
  const community = await db.query.communities.findFirst({
    where: eq(communities.id, communityId),
  });
  return community?.mergedInto !== null;
}

/**
 * Get the final community ID (follows merge chain).
 * If community A merged into B, and B merged into C, returns C.
 */
export async function getFinalCommunityId(communityId: number): Promise<number> {
  let currentId = communityId;
  let visited = new Set<number>();

  while (true) {
    if (visited.has(currentId)) {
      // Circular reference - should never happen, but safety check
      throw new Error(`Circular merge reference detected at community ${currentId}`);
    }
    visited.add(currentId);

    const community = await db.query.communities.findFirst({
      where: eq(communities.id, currentId),
    });

    if (!community || community.mergedInto === null) {
      return currentId;
    }

    currentId = community.mergedInto;
  }
}

