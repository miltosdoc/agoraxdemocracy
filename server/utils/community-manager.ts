/**
 * Community Manager
 *
 * Lifecycle helpers for the autonomous ↔ managed split.
 *
 * Autonomous communities have no admin team (no_admin governance, empty
 * adminIds). Managed communities are run by an admin team — the array on
 * `adminIds` is the authoritative list, and the matching members get
 * `role = 'admin'` for legacy callers that still inspect the role column.
 *
 * Both transitions are gated behind explicit calls because in production
 * they only fire after a successful proposal vote (autonomous→managed)
 * or a successful admin vote (managed→autonomous). The vote logic itself
 * lives in routes.ts; this module just executes the resulting flip.
 */

import { db } from '../db';
import {
  communities,
  communityMembers,
  type Community,
  type CommunityMember,
} from '@shared/schema';
import { COMMUNITY_TYPES, type CommunityType } from '@shared/community-settings';
import { and, eq, inArray } from 'drizzle-orm';

export interface CommunityWithMemberSummary {
  community: Community;
  members: CommunityMember[];
  adminIds: number[];
}

class CommunityManagerError extends Error {
  constructor(message: string, public readonly code: 'not_found' | 'invalid_type' | 'invalid_input') {
    super(message);
    this.name = 'CommunityManagerError';
  }
}

export { CommunityManagerError };

function parseAdminIds(raw: unknown): number[] {
  if (Array.isArray(raw)) {
    return raw.filter((n): n is number => typeof n === 'number' && Number.isFinite(n));
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Read a community's adminIds JSONB column. Tolerates both real arrays
 * (Drizzle parses jsonb into JS) and the stringified default Postgres
 * uses when columns default to '[]'::jsonb.
 */
export function getAdminIds(community: Pick<Community, 'adminIds'>): number[] {
  return parseAdminIds(community.adminIds);
}

/**
 * Create a community and immediately add the creator as the first member.
 *
 * For managed communities the creator is granted admin role + landed on the
 * adminIds list. For autonomous communities the role is plain `member` and
 * adminIds stays empty — by construction there are no admins.
 */
export async function createCommunity(
  name: string,
  description: string | null,
  type: CommunityType,
  creatorId: number,
  options: { isGeneral?: boolean } = {},
): Promise<Community> {
  if (!name.trim()) {
    throw new CommunityManagerError('Community name is required', 'invalid_input');
  }
  if (!(COMMUNITY_TYPES as readonly string[]).includes(type)) {
    throw new CommunityManagerError(`Invalid community type: ${String(type)}`, 'invalid_type');
  }

  const adminIds = type === 'managed' ? [creatorId] : [];
  const governanceModel = type === 'managed' ? 'admin_team' : 'no_admin';

  const [community] = await db
    .insert(communities)
    .values({
      name: name.trim(),
      description: description ?? null,
      type,
      governanceModel,
      creatorId,
      adminIds,
      isGeneral: options.isGeneral === true,
    })
    .returning();

  await db.insert(communityMembers).values({
    communityId: community.id,
    userId: creatorId,
    role: type === 'managed' ? 'admin' : 'founder',
  });

  return community;
}

/**
 * Promote an autonomous community to managed governance.
 *
 * Caller is expected to have already verified the underlying vote passed.
 * `adminIds` overwrites whatever was on the row; members in the list are
 * promoted to role='admin', everyone else is demoted to role='member'.
 * Throws if the community is missing or already managed.
 */
export async function transitionToManaged(
  communityId: number,
  adminIds: number[],
): Promise<Community> {
  if (adminIds.length === 0) {
    throw new CommunityManagerError(
      'transitionToManaged requires at least one admin',
      'invalid_input',
    );
  }

  const community = await getCommunityRow(communityId);
  if (community.type === 'managed') {
    throw new CommunityManagerError(
      `Community ${communityId} is already managed`,
      'invalid_type',
    );
  }

  const cleaned = Array.from(new Set(adminIds.filter(n => Number.isFinite(n))));

  const [updated] = await db
    .update(communities)
    .set({ type: 'managed', governanceModel: 'admin_team', adminIds: cleaned })
    .where(eq(communities.id, communityId))
    .returning();

  // Sync member roles. Demote first, then promote — running the queries the
  // other way round would clobber the freshly-promoted admins on the demote
  // pass. Members not in `cleaned` keep their existing role.
  await db
    .update(communityMembers)
    .set({ role: 'member' })
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.role, 'admin')));
  await db
    .update(communityMembers)
    .set({ role: 'admin' })
    .where(and(eq(communityMembers.communityId, communityId), inArray(communityMembers.userId, cleaned)));

  return updated;
}

/**
 * Demote a managed community back to autonomous governance.
 * Clears adminIds and resets all admins to plain members.
 */
export async function transitionToAutonomous(communityId: number): Promise<Community> {
  const community = await getCommunityRow(communityId);
  if (community.type === 'autonomous') {
    throw new CommunityManagerError(
      `Community ${communityId} is already autonomous`,
      'invalid_type',
    );
  }

  const [updated] = await db
    .update(communities)
    .set({ type: 'autonomous', governanceModel: 'no_admin', adminIds: [] })
    .where(eq(communities.id, communityId))
    .returning();

  await db
    .update(communityMembers)
    .set({ role: 'member' })
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.role, 'admin')));

  return updated;
}

/**
 * Add a user to the community. Idempotent — a duplicate (community, user)
 * pair is treated as a no-op rather than an error so registration flows
 * can call this without first checking membership.
 */
export async function addMember(communityId: number, userId: number): Promise<CommunityMember> {
  const [existing] = await db
    .select()
    .from(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
  if (existing) return existing;

  const community = await getCommunityRow(communityId);
  const adminIds = getAdminIds(community);
  const role = adminIds.includes(userId) ? 'admin' : 'member';

  const [member] = await db
    .insert(communityMembers)
    .values({ communityId, userId, role })
    .returning();
  return member;
}

/**
 * Remove a user from the community. If the user was on adminIds, they are
 * also dropped from that list — leaving stale ids would silently re-promote
 * them next time `addMember` runs.
 */
export async function removeMember(communityId: number, userId: number): Promise<void> {
  const community = await getCommunityRow(communityId);
  const adminIds = getAdminIds(community);
  if (adminIds.includes(userId)) {
    const next = adminIds.filter(id => id !== userId);
    await db.update(communities).set({ adminIds: next }).where(eq(communities.id, communityId));
  }

  await db
    .delete(communityMembers)
    .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
}

/**
 * Fetch a community along with its members and admin list. Returns null
 * when the community does not exist (callers can map to 404).
 */
export async function getCommunity(communityId: number): Promise<CommunityWithMemberSummary | null> {
  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.id, communityId));
  if (!community) return null;

  const members = await db
    .select()
    .from(communityMembers)
    .where(eq(communityMembers.communityId, communityId));

  return {
    community,
    members,
    adminIds: getAdminIds(community),
  };
}

/**
 * Find the General community — the catch-all instance-wide community where
 * every new user is auto-enrolled. Returns null if it has not been seeded.
 */
export async function getGeneralCommunity(): Promise<Community | null> {
  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.isGeneral, true));
  return community ?? null;
}

async function getCommunityRow(communityId: number): Promise<Community> {
  const [community] = await db
    .select()
    .from(communities)
    .where(eq(communities.id, communityId));
  if (!community) {
    throw new CommunityManagerError(`Community ${communityId} not found`, 'not_found');
  }
  return community;
}
