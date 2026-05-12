/**
 * User Repository
 *
 * Handles all user-related database operations: CRUD, authentication,
 * Gov.gr verification, account activity tracking, location verification,
 * and duplicate account detection.
 */

import { db } from '../db';
import { users, accountActivity, type User, type InsertUser, type InsertAccountActivity, type SelectAccountActivity } from '../../shared/schema';
import { eq, and, ilike, desc, sql } from 'drizzle-orm';

export class UserRepository {

  /** Get user by ID. */
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  /** Get user by username (case-insensitive). */
  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`);
    return user;
  }

  /** Get user by email (case-insensitive). */
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user;
  }

  /** Get user by OAuth provider ID. */
  async getUserByProviderId(providerId: string, provider: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.providerId, providerId),
        eq(users.provider, provider)
      ));
    return user;
  }

  /** Get user by Gov.gr voter hash. */
  async getUserByVoterHash(voterHash: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.govgrVoterHash, voterHash));
    return user;
  }

  /** Create a new user. */
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  /** Update user location data. */
  async updateUserLocation(userId: number, locationData: {
    latitude?: string;
    longitude?: string;
    locationConfirmed?: boolean;
    locationVerified?: boolean;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set(locationData)
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  /** Verify user location. */
  async verifyUserLocation(userId: number, verified: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ locationVerified: verified })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  /** Update user fields. */
  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  /** Delete a user and optionally their polls. */
  async deleteUser(userId: number, deletePolls: boolean): Promise<boolean> {
    // TODO: Implement with transaction for data integrity
    await db.delete(users).where(eq(users.id, userId));
    return true;
  }

  /** Check for duplicate accounts by device fingerprint and IP. */
  async checkDuplicateAccounts(deviceFingerprint: string, ip: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        eq(users.deviceFingerprint, deviceFingerprint),
        eq(users.registrationIp, ip)
      ));
    return result[0]?.count || 0;
  }

  /** Create an account activity record. */
  async createAccountActivity(activity: InsertAccountActivity): Promise<void> {
    await db.insert(accountActivity).values(activity);
  }

  /** Update user login info (IP, timestamp). */
  async updateUserLoginInfo(userId: number, data: { lastLoginIp: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ lastLoginIp: data.lastLoginIp, lastLoginAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

  /** Get user account activity history. */
  async getUserAccountActivity(userId: number): Promise<SelectAccountActivity[]> {
    return await db
      .select()
      .from(accountActivity)
      .where(eq(accountActivity.userId, userId))
      .orderBy(desc(accountActivity.timestamp));
  }

  /** Get all users with optional filters. */
  async getAllUsersWithAccountInfo(filters?: { status?: string; search?: string }): Promise<User[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(users.accountStatus, filters.status));
    }
    if (filters?.search) {
      conditions.push(ilike(users.username, `%${filters.search}%`));
    }
    return await db
      .select()
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(users.createdAt));
  }

  /** Update account status (active, suspended, etc.). */
  async updateAccountStatus(userId: number, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ accountStatus: status })
      .where(eq(users.id, userId))
      .returning();
    if (!user) throw new Error("User not found");
    return user;
  }

}

