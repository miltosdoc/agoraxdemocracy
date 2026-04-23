/**
 * Sortition Timeout & Completion
 * 
 * Handles timeout checking, member replacement, and completion logic
 * for sortition bodies.
 */

import { db } from '../db';
import { sortitionBodies, sortitionMembers } from '@shared/schema';
import { eq, and, isNull, lte, gte, avg } from 'drizzle-orm';
import { logAdminAction } from './admin-action-logger';

// ─── Timeout Checking ───────────────────────────────────────────────────────

/**
 * Check if a sortition body has passed its response deadline.
 */
export async function checkSortitionTimeout(bodyId: number): Promise<boolean> {
  const [body] = await db
    .select()
    .from(sortitionBodies)
    .where(eq(sortitionBodies.id, bodyId))
    .limit(1);

  if (!body) return false;
  
  return new Date() > body.responseDeadline;
}

/**
 * Get the number of members who have not yet responded.
 */
export async function getNonRespondingCount(bodyId: number): Promise<number> {
  const members = await db
    .select()
    .from(sortitionMembers)
    .where(and(
      eq(sortitionMembers.bodyId, bodyId),
      isNull(sortitionMembers.score)
    ));
  
  return members.length;
}

// ─── Member Replacement ─────────────────────────────────────────────────────

/**
 * Replace non-responding members with backups from the community.
 * 
 * @param bodyId - The sortition body ID
 * @param communityId - The community ID (for finding backup members)
 * @param maxReplacements - Maximum number of replacements (default: 5)
 * @returns Number of replacements made
 */
export async function replaceNonRespondingMembers(
  bodyId: number,
  communityId: number,
  maxReplacements: number = 5,
): Promise<number> {
  // Get non-responding members
  const nonResponding = await db
    .select()
    .from(sortitionMembers)
    .where(and(
      eq(sortitionMembers.bodyId, bodyId),
      isNull(sortitionMembers.score)
    ));

  if (nonResponding.length === 0) return 0;

  const toReplace = Math.min(nonResponding.length, maxReplacements);
  let replaced = 0;

  for (let i = 0; i < toReplace; i++) {
    // Remove the non-responding member
    await db
      .delete(sortitionMembers)
      .where(eq(sortitionMembers.id, nonResponding[i].id));

    // Find a backup member (community member not already in this body)
    const backup = await findBackupMember(communityId, bodyId);
    
    if (backup) {
      await db.insert(sortitionMembers).values({
        bodyId,
        userId: backup.userId,
        score: null,
        assignedAt: new Date(),
      });
      replaced++;
    }
  }

  return replaced;
}

/**
 * Find a backup member from the community who is not already in this sortition body.
 */
async function findBackupMember(communityId: number, bodyId: number): Promise<{ userId: number } | null> {
  // This would query community_members table to find eligible backups
  // For now, return null — implement when community_members table exists
  return null;
}

// ─── Completion ─────────────────────────────────────────────────────────────

/**
 * Complete a sortition body by calculating the average score.
 * 
 * @param bodyId - The sortition body ID
 * @returns The calculated average score, or null if no scores exist
 */
export async function completeSortitionBody(bodyId: number): Promise<number | null> {
  const members = await db
    .select({ score: sortitionMembers.score })
    .from(sortitionMembers)
    .where(and(
      eq(sortitionMembers.bodyId, bodyId),
      sortitionMembers.score.isNotNull()
    ));

  if (members.length === 0 || !members[0]?.score) {
    return null;
  }

  const scores = members
    .map(m => m.score!)
    .filter(s => s !== null);

  if (scores.length === 0) return null;

  const average = scores.reduce((sum, s) => sum + s, 0) / scores.length;

  // Update the sortition body with the result
  await db
    .update(sortitionBodies)
    .set({
      averageScore: average,
      completedAt: new Date(),
    })
    .where(eq(sortitionBodies.id, bodyId));

  return average;
}

// ─── Admin Override ─────────────────────────────────────────────────────────

/**
 * Admin override: extend the response deadline for a sortition body.
 * 
 * @param bodyId - The sortition body ID
 * @param newDeadline - The new deadline
 * @param adminUserId - The admin who made the override
 * @param reason - Reason for the override
 */
export async function overrideSortitionDeadline(
  bodyId: number,
  newDeadline: Date,
  adminUserId: number,
  reason: string,
): Promise<void> {
  await db
    .update(sortitionBodies)
    .set({ responseDeadline: newDeadline })
    .where(eq(sortitionBodies.id, bodyId));

  await logAdminAction(
    adminUserId,
    null,
    'override_sortition_timeout',
    bodyId,
    { newDeadline: newDeadline.toISOString(), reason },
  );
}
