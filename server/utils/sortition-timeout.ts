/**
 * Sortition Timeout & Completion — STUB
 *
 * This module's previous implementation referenced several columns that do
 * not exist in the current schema (sortition_bodies.responseDeadline,
 * sortition_bodies.averageScore, sortition_members.assignedAt) and called a
 * Drizzle API that has since changed (`score.isNotNull()` instead of
 * `isNotNull(score)`).
 *
 * It is also not imported anywhere yet. Rather than carry broken code, the
 * exports are stubs that throw, preserving the public API for when the
 * scheduler that drives them is wired up. Re-enabling requires:
 *
 *   1. Adding `response_deadline TIMESTAMP` to sortition_bodies (or deriving
 *      it from selectedAt + responseHours)
 *   2. Adding `average_score NUMERIC` to sortition_bodies
 *   3. Adding `assigned_at TIMESTAMP` to sortition_members (or reusing
 *      created-at-equivalent)
 *   4. A scheduler entry-point in server/index.ts (or a job-queue worker)
 *
 * Tracked in ROADMAP §1.7 (notifications + scheduler).
 */

function notImplemented(name: string): never {
  throw new Error(`${name} is not implemented — sortition timeout/replacement pipeline not yet wired (see ROADMAP §1.7)`);
}

export async function checkSortitionTimeout(_bodyId: number): Promise<boolean> {
  notImplemented('checkSortitionTimeout');
}

export async function getNonRespondingCount(_bodyId: number): Promise<number> {
  notImplemented('getNonRespondingCount');
}

export async function replaceNonRespondingMembers(
  _bodyId: number,
  _communityId: number,
  _maxReplacements: number = 5,
): Promise<number> {
  notImplemented('replaceNonRespondingMembers');
}

export async function completeSortitionBody(_bodyId: number): Promise<number | null> {
  notImplemented('completeSortitionBody');
}

export async function overrideSortitionDeadline(
  _bodyId: number,
  _newDeadline: Date,
  _adminUserId: number,
  _reason: string,
): Promise<void> {
  notImplemented('overrideSortitionDeadline');
}
