import {
  User,
  InsertUser,
  Poll,
  InsertPoll,
  InsertPollOption,
  InsertVote,
  RankingVote,
  InsertComment,
  PollOption,
  Vote,
  Comment,
  PollWithOptions,
  PollNotification,
  InsertPollNotification,
  users,
  polls,
  pollOptions,
  votes,
  comments,
  pollNotifications,
  pollQuestions,
  pollAnswers,
  pollUserResponses,
  accountActivity,
  InsertPollQuestion,
  InsertPollAnswer,
  InsertPollUserResponse,
  InsertAccountActivity,
  PollQuestion,
  PollAnswer,
  PollUserResponse,
  SelectAccountActivity,
  PollWithQuestions,
  PollQuestionWithAnswers,
  Community,
  InsertCommunity,
  CommunityMember,
  InsertCommunityMember,
  Proposal,
  InsertProposal,
  ProposalAmendment,
  InsertProposalAmendment,
  SortitionBody,
  InsertSortitionBody,
  SortitionMember,
  InsertSortitionMember,
  DebateArgument,
  InsertDebateArgument,
  ProposalSupport,
  InsertProposalSupport,
  ProposalVote,
  ProposalVoteChoice,
  communities,
  communityMembers,
  proposals,
  proposalAmendments,
  sortitionBodies,
  sortitionMembers,
  debateArguments,
  proposalSupport,
  proposalVotes
} from "@shared/schema";

export interface ProposalVoteResults {
  yes: number;
  no: number;
  abstain: number;
  total: number;       // yes + no + abstain
  participants: number; // distinct voters (== total since one vote per user)
  participationPct: number; // participants / community member count, in [0,1]
  passes: boolean;
  meetsQuorum: boolean;
  minParticipationPct: number; // community threshold in [0,1]
}
import { deriveGeoRegion, normalizeRegionName } from "./utils/geo-region-detector";
import { reverseGeocode } from "./utils/reverse-geocoding";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, or, desc, asc, inArray, sql, isNull, not, count, gt, gte } from "drizzle-orm";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

// Filter type for fetching polls
interface PollFilters {
  status?: string;
  category?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
  userId?: number;
  locationScope?: string; // "global" or "geofenced"
  locationCountry?: string; // Country name for filtering
  locationRegion?: string; // Region name for filtering
  locationCity?: string; // City/Municipality name for filtering
  search?: string; // Search term for poll title/description
  communityId?: number; // Filter polls by specific community
}

// Results type
interface PollResult {
  pollId: number;
  optionId: number;
  optionText: string;
  voteCount: number;
  percentage: number;
}

// Comments with user info
interface CommentWithUser extends Comment {
  user: {
    name: string;
    username: string;
  };
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByProviderId(providerId: string, provider: string): Promise<User | undefined>;
  getUserByVoterHash(voterHash: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLocation(userId: number, locationData: {
    // Display names
    city?: string,
    region?: string,
    country?: string,
    // Standardized IDs
    city_id?: string,
    region_id?: string,
    country_id?: string,
    // Duplicate fields for clarity in API
    city_display?: string,
    region_display?: string,
    country_display?: string,
    // Coordinates
    latitude?: string,
    longitude?: string,
    locationConfirmed?: boolean,
    locationVerified?: boolean
  }): Promise<User>;

  verifyUserLocation(userId: number, verified: boolean): Promise<User>;
  updateUser(userId: number, updates: Partial<User>): Promise<User>;

  // User deletion methods
  deleteUser(userId: number, deletePolls: boolean): Promise<boolean>;

  // Poll methods
  createPoll(poll: InsertPoll, options: InsertPollOption[]): Promise<Poll>;
  getPolls(filters?: PollFilters): Promise<{ polls: PollWithOptions[], total: number }>;
  getUserPolls(userId: number): Promise<PollWithOptions[]>;
  getParticipatedPolls(userId: number): Promise<PollWithOptions[]>;
  getPoll(id: number, userId?: number): Promise<PollWithOptions | undefined>;
  updatePoll(id: number, updates: Partial<Poll>): Promise<Poll>;
  extendPollDuration(id: number, newEndDate: Date): Promise<Poll>;
  deletePoll(id: number): Promise<boolean>;

  // Survey Poll methods
  createSurveyPoll(poll: InsertPoll, questions: InsertPollQuestion[], answers: { questionId: number; answers: InsertPollAnswer[] }[]): Promise<Poll>;
  getSurveyPoll(id: number, userId?: number): Promise<PollWithQuestions | undefined>;
  updateSurveyStructure(id: number, updates: Partial<Poll>, questions: InsertPollQuestion[], answers: { questionId: number; answers: InsertPollAnswer[] }[]): Promise<Poll>;
  updateSurveyMetadata(id: number, updates: Partial<Poll>): Promise<Poll>;

  // Survey Response methods
  createSurveyResponse(responses: InsertPollUserResponse[]): Promise<PollUserResponse[]>;
  getSurveyResults(pollId: number): Promise<{ questionId: number; answerResults: { answerId: number; answerText: string; count: number; percentage: number }[] }[]>;
  hasUserRespondedToSurvey(pollId: number, userId: number): Promise<boolean>;
  hasAnyResponses(pollId: number): Promise<boolean>;

  // Vote methods
  createVote(vote: InsertVote | RankingVote): Promise<Vote>;
  hasUserVoted(pollId: number, userId: number): Promise<boolean>;
  getPollResults(pollId: number): Promise<PollResult[]>;
  getPollParticipantCount(pollId: number): Promise<number>;
  canEditVote(pollId: number, userId: number): Promise<boolean>;

  // Comment methods
  createComment(comment: InsertComment): Promise<Comment>;
  getPollComments(pollId: number): Promise<CommentWithUser[]>;


  // Notification methods
  createPollNotification(notification: InsertPollNotification): Promise<PollNotification>;
  getUserNotifications(userId: number): Promise<(PollNotification & { poll: Poll & { community?: { id: number; name: string } | null } })[]>;
  markNotificationAsRead(notificationId: number): Promise<PollNotification>;

  // Session store
  sessionStore: session.SessionStore;

  // Analytics methods
  getAnalyticsOverview(): Promise<{
    totalUsers: number;
    totalPolls: number;
    totalVotes: number;
    totalComments: number;
    activePolls: number;
    popularCategories: { category: string; count: number }[];
  }>;
  getPollPopularityStats(): Promise<{
    id: number;
    title: string;
    votes: number;
    comments: number;
    category: string;
    createdAt: string;
  }[]>;
  getActivityTrends(): Promise<{
    date: string;
    polls: number;
    votes: number;
    comments: number;
  }[]>;
  getUsagePatterns(): Promise<{
    hourlyActivity: { hour: number; activity: number }[];
    dailyActivity: { day: string; activity: number }[];
  }>;

  // Device fingerprinting and IP tracking methods
  checkDuplicateAccounts(deviceFingerprint: string, ip: string): Promise<number>;
  createAccountActivity(activity: InsertAccountActivity): Promise<void>;
  updateUserLoginInfo(userId: number, data: { lastLoginIp: string }): Promise<User>;
  getUserAccountActivity(userId: number): Promise<SelectAccountActivity[]>;
  getAllUsersWithAccountInfo(filters?: { status?: string, search?: string }): Promise<User[]>;
  updateAccountStatus(userId: number, status: string): Promise<User>;

  // ─── Demopolis: Community methods ──────────────────────────────────────────
  createCommunity(community: InsertCommunity): Promise<Community>;
  getCommunity(id: number): Promise<Community | undefined>;
  getCommunities(userId?: number): Promise<Community[]>;
  updateCommunity(id: number, updates: Partial<Community>): Promise<Community>;
  deleteCommunity(id: number): Promise<boolean>;
  getCommunityMembers(communityId: number): Promise<CommunityMember[]>;
  addCommunityMember(communityId: number, userId: number, role?: string): Promise<CommunityMember>;
  removeCommunityMember(communityId: number, userId: number): Promise<boolean>;
  updateMemberRole(communityId: number, userId: number, role: string): Promise<CommunityMember>;
  isCommunityMember(communityId: number, userId: number): Promise<boolean>;
  getCommunityMemberRole(communityId: number, userId: number): Promise<string | undefined>;

  // ─── Demopolis: Proposal methods ───────────────────────────────────────────
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  getProposal(id: number): Promise<Proposal | undefined>;
  getProposals(communityId: number, filters?: { status?: string; category?: string }): Promise<Proposal[]>;
  updateProposal(id: number, updates: Partial<Proposal>): Promise<Proposal>;
  transitionProposalState(id: number, newState: string): Promise<Proposal>;

  // ─── Demopolis: Amendment methods ──────────────────────────────────────────
  createAmendment(amendment: InsertProposalAmendment): Promise<ProposalAmendment>;
  getAmendment(id: number): Promise<ProposalAmendment | undefined>;
  getAmendments(proposalId: number): Promise<ProposalAmendment[]>;
  updateAmendment(id: number, updates: Partial<ProposalAmendment>): Promise<ProposalAmendment>;
  countAmendmentsForProposal(proposalId: number): Promise<number>;

  // ─── Demopolis: Sortition methods ──────────────────────────────────────────
  createSortitionBody(body: InsertSortitionBody): Promise<SortitionBody>;
  getSortitionBody(id: number): Promise<SortitionBody | undefined>;
  getSortitionMembers(bodyId: number): Promise<SortitionMember[]>;
  addSortitionMember(bodyId: number, userId: number): Promise<SortitionMember>;
  removeSortitionMember(bodyId: number, userId: number): Promise<boolean>;
  updateSortitionMember(bodyId: number, userId: number, updates: Partial<SortitionMember>): Promise<SortitionMember>;
  completeSortitionBody(id: number): Promise<SortitionBody>;

  // ─── Demopolis: Debate methods ─────────────────────────────────────────────
  createDebateArgument(argument: InsertDebateArgument): Promise<DebateArgument>;
  getDebateArguments(proposalId: number): Promise<DebateArgument[]>;
  supportDebateArgument(argumentId: number, userId: number): Promise<DebateArgument>;
  opposeDebateArgument(argumentId: number, userId: number): Promise<DebateArgument>;

  // ─── Demopolis: Proposal Support methods ───────────────────────────────────
  createProposalSupport(proposalId: number, userId: number, type: string): Promise<ProposalSupport>;
  removeProposalSupport(proposalId: number, userId: number, type: string): Promise<boolean>;
  getProposalSupport(proposalId: number): Promise<{ support: number; oppose: number }>;
  getAllProposals(limit?: number): Promise<Proposal[]>;

  // ─── Demopolis: Proposal Final Vote methods ────────────────────────────────
  castProposalVote(proposalId: number, userId: number, choice: ProposalVoteChoice): Promise<ProposalVote>;
  getUserProposalVote(proposalId: number, userId: number): Promise<ProposalVote | undefined>;
  getProposalVoteResults(proposalId: number): Promise<ProposalVoteResults>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`);
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(sql`LOWER(${users.email}) = LOWER(${email})`);
    return user;
  }

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

  async getUserByVoterHash(voterHash: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.govgrVoterHash, voterHash));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserLocation(userId: number, locationData: {
    city?: string,
    region?: string,
    country?: string,
    city_id?: string,
    region_id?: string,
    country_id?: string,
    city_display?: string,
    region_display?: string,
    country_display?: string,
    latitude?: string,
    longitude?: string,
    locationConfirmed?: boolean,
    locationVerified?: boolean
  }): Promise<User> {
    console.log(`[Storage] Updating user location with data:`, JSON.stringify(locationData, null, 2));

    // Extract standardized location data
    const updateData: any = {
      // Standard location ID fields 
      city_id: locationData.city_id,
      region_id: locationData.region_id,
      country_id: locationData.country_id,

      // Legacy location display fields (should still be set for backward compatibility)
      city: locationData.city_display || locationData.city,
      region: locationData.region_display || locationData.region,
      country: locationData.country_display || locationData.country,

      // Coordinates
      latitude: locationData.latitude,
      longitude: locationData.longitude
    };

    // Handle location confirmation
    updateData.locationConfirmed = locationData.locationConfirmed !== undefined
      ? locationData.locationConfirmed
      : (updateData.city_id && updateData.region_id && updateData.country_id ? true :
        (updateData.city && updateData.region && updateData.country ? true : undefined));

    // If coordinates are being updated, reset verification status
    if (locationData.latitude !== undefined || locationData.longitude !== undefined) {
      // GPS location detection is considered verified by default
      // Manual entries need explicit verification
      updateData.locationVerified = locationData.locationVerified !== undefined
        ? locationData.locationVerified
        : false;
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log(`[Storage] Final update data:`, JSON.stringify(updateData, null, 2));

    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async verifyUserLocation(userId: number, verified: boolean): Promise<User> {
    console.log(`[Storage] Verifying user location: ${verified}`);

    const [user] = await db
      .update(users)
      .set({ locationVerified: verified })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // Poll methods
  async createPoll(poll: InsertPoll, options: { text: string; order: number }[]): Promise<Poll> {
    console.log("In storage.createPoll with poll:", JSON.stringify(poll, null, 2));
    console.log("Options:", JSON.stringify(options, null, 2));

    // Convert date strings to Date objects if they are strings
    if (typeof poll.startDate === 'string') {
      poll.startDate = new Date(poll.startDate);
    }
    if (typeof poll.endDate === 'string') {
      poll.endDate = new Date(poll.endDate);
    }

    // For global polls, ensure coordinate fields are properly handled
    if (poll.locationScope === 'global') {
      // Set empty coordinates to null to avoid numeric conversion errors
      poll.centerLat = null;
      poll.centerLng = null;
      poll.radiusKm = null;
    } else if (poll.locationScope === 'geofenced') {
      // Ensure coordinates are valid numbers
      if (poll.centerLat && typeof poll.centerLat === 'string' && poll.centerLat.trim() === '') {
        poll.centerLat = null;
      }
      if (poll.centerLng && typeof poll.centerLng === 'string' && poll.centerLng.trim() === '') {
        poll.centerLng = null;
      }
    }

    try {
      // Get location information if this is a geofenced poll with coordinates
      let locationData = null;
      if (poll.locationScope === 'geofenced' && poll.centerLat && poll.centerLng) {
        console.log(`Attempting to get location data for coordinates: ${poll.centerLat}, ${poll.centerLng}`);
        locationData = await reverseGeocode(poll.centerLat, poll.centerLng);
        console.log("Reverse geocoding result:", locationData);
      }

      // Start a transaction
      return await db.transaction(async (tx) => {
        console.log("Starting transaction to create poll");

        // Get the geoRegion field
        const geoRegion = deriveGeoRegion(
          poll.centerLat,
          poll.centerLng,
          poll.locationRegion,
          poll.region
        );

        // Prepare poll data with location information if available
        const pollData: any = {
          ...poll,
          isActive: true,
          geoRegion
        };

        // Add location data from reverse geocoding if available
        if (locationData) {
          // Set both standardized ID fields and display names
          pollData.locationCity = locationData.city;
          pollData.locationRegion = locationData.region;
          pollData.locationCountry = locationData.country;

          // Set standardized location IDs
          pollData.locationCityId = locationData.cityId;
          pollData.locationRegionId = locationData.regionId;
          pollData.locationCountryId = locationData.countryId;

          // Set legacy fields for backward compatibility
          pollData.city = locationData.city;
          pollData.region = locationData.region;
          pollData.country = locationData.country;

          console.log("Adding location data to poll:", JSON.stringify({
            locationCity: pollData.locationCity,
            locationRegion: pollData.locationRegion,
            locationCountry: pollData.locationCountry,
            geoRegion: pollData.geoRegion
          }, null, 2));
        }

        // Create poll with all data
        const [newPoll] = await tx
          .insert(polls)
          .values(pollData)
          .returning();

        console.log("Created poll:", JSON.stringify(newPoll, null, 2));

        // Create options
        await Promise.all(
          options.map((option, index) =>
            tx.insert(pollOptions).values({
              pollId: newPoll.id,
              text: option.text,
              order: option.order || index
            })
          )
        );

        console.log("Created options for poll");
        return newPoll;
      });
    } catch (error) {
      console.error("Error in createPoll transaction:", error);
      throw error;
    }
  }

  async getPolls(filters: PollFilters = {}): Promise<{ polls: PollWithOptions[], total: number }> {
    try {
      const {
        status,
        category,
        sort,
        page = 1,
        pageSize = 9,
        userId,
        locationScope,
        locationCountry,
        locationRegion,
        locationCity,
        search,
        communityId
      } = filters;

      // Build query
      let query = db.select().from(polls);
      const conditions = [];

      // Apply filters
      if (status === 'active') {
        // A poll is active if isActive is true AND endDate is in the future
        conditions.push(and(
          eq(polls.isActive, true),
          sql`${polls.endDate} > NOW()`
        ));
      } else if (status === 'completed') {
        // A poll is completed if isActive is false OR endDate has passed
        conditions.push(or(
          eq(polls.isActive, false),
          sql`${polls.endDate} <= NOW()`
        ));
      }

      if (category) {
        conditions.push(eq(polls.category, category));
      }

      // Apply location scope filter if provided
      if (locationScope) {
        console.log(`Filtering by location scope: ${locationScope}`);
        conditions.push(eq(polls.locationScope, locationScope));
      }

      // Server-side filtering by standardized geoRegion field
      if (locationRegion) {
        const normalizedRegion = normalizeRegionName(locationRegion);
        if (normalizedRegion) {
          console.log(`Filtering by normalized geoRegion: ${normalizedRegion}`);
          conditions.push(eq(polls.geoRegion, normalizedRegion));
        } else {
          console.log(`Could not normalize region: ${locationRegion}, using legacy filtering`);
          // Legacy fallback - this might cause inconsistent results
          conditions.push(sql`LOWER(${polls.locationRegion}) LIKE LOWER(${`%${locationRegion}%`})`);
        }
      }

      // Legacy filters for country and city (still applied as substring matches)
      if (locationCountry) {
        console.log(`Filtering by country: ${locationCountry}`);
        conditions.push(sql`LOWER(${polls.locationCountry}) LIKE LOWER(${`%${locationCountry}%`})`);
      }

      if (locationCity) {
        console.log(`Filtering by city: ${locationCity}`);
        conditions.push(sql`LOWER(${polls.locationCity}) LIKE LOWER(${`%${locationCity}%`})`);
      }

      // Apply search term if provided
      if (search) {
        conditions.push(
          sql`(${polls.title} ILIKE ${`%${search}%`} OR ${polls.description} ILIKE ${`%${search}%`})`
        );
      }

      // Filter by specific group if communityId is provided
      if (communityId) {
        conditions.push(eq(polls.communityId, communityId));
      }

      // Community-based access control: Filter polls based on user's community memberships
      if (userId) {
        // For authenticated users, fetch their community IDs
        const userCommunityIds = await db
          .select({ communityId: communityMembers.communityId })
          .from(communityMembers)
          .where(eq(communityMembers.userId, userId));

        const communityIds = userCommunityIds.map(g => g.communityId);

        if (communityIds.length > 0) {
          // Show public polls (communityId IS NULL) OR polls from user's communities
          conditions.push(
            or(
              isNull(polls.communityId),
              inArray(polls.communityId, communityIds)
            )
          );
        } else {
          conditions.push(isNull(polls.communityId));
        }
      } else {
        // For anonymous users, show only public polls (communityId IS NULL)
        conditions.push(isNull(polls.communityId));
      }

      // Apply conditions if any exist
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      // Get total count first
      const baseQuery = db.select({ count: sql<number>`count(*)` }).from(polls);
      const countConditions = [];

      if (status === 'active') {
        // A poll is active if isActive is true AND endDate is in the future
        countConditions.push(and(
          eq(polls.isActive, true),
          sql`${polls.endDate} > NOW()`
        ));
      } else if (status === 'completed') {
        // A poll is completed if isActive is false OR endDate has passed
        countConditions.push(or(
          eq(polls.isActive, false),
          sql`${polls.endDate} <= NOW()`
        ));
      }

      if (category) {
        countConditions.push(eq(polls.category, category));
      }

      // Apply location scope filter to count query too
      if (locationScope) {
        countConditions.push(eq(polls.locationScope, locationScope));
      }

      // Server-side filtering by standardized geoRegion field (for count query)
      if (locationRegion) {
        const normalizedRegion = normalizeRegionName(locationRegion);
        if (normalizedRegion) {
          console.log(`Count query: filtering by normalized geoRegion: ${normalizedRegion}`);
          countConditions.push(eq(polls.geoRegion, normalizedRegion));
        } else {
          console.log(`Count query: could not normalize region: ${locationRegion}, using legacy filtering`);
          // Legacy fallback - this might cause inconsistent results
          countConditions.push(sql`LOWER(${polls.locationRegion}) LIKE LOWER(${`%${locationRegion}%`})`);
        }
      }

      // Legacy filters for country and city (still applied as substring matches)
      if (locationCountry) {
        console.log(`Count query: filtering by country: ${locationCountry}`);
        countConditions.push(sql`LOWER(${polls.locationCountry}) LIKE LOWER(${`%${locationCountry}%`})`);
      }

      if (locationCity) {
        console.log(`Count query: filtering by city: ${locationCity}`);
        countConditions.push(sql`LOWER(${polls.locationCity}) LIKE LOWER(${`%${locationCity}%`})`);
      }

      // Apply search term to count query
      if (search) {
        countConditions.push(
          sql`(${polls.title} ILIKE ${`%${search}%`} OR ${polls.description} ILIKE ${`%${search}%`})`
        );
      }

      // Filter by specific group if communityId is provided (for count query)
      if (communityId) {
        countConditions.push(eq(polls.communityId, communityId));
      }

      // Community-based access control for count query: Filter polls based on user's community memberships
      if (userId) {
        // For authenticated users, fetch their community IDs
        const userCommunityIds = await db
          .select({ communityId: communityMembers.communityId })
          .from(communityMembers)
          .where(eq(communityMembers.userId, userId));

        const communityIds = userCommunityIds.map(g => g.communityId);

        if (communityIds.length > 0) {
          // Show public polls (communityId IS NULL) OR polls from user's communities
          countConditions.push(
            or(
              isNull(polls.communityId),
              inArray(polls.communityId, communityIds)
            )
          );
        } else {
          countConditions.push(isNull(polls.communityId));
        }
      } else {
        // For anonymous users, show only public polls (communityId IS NULL)
        countConditions.push(isNull(polls.communityId));
      }

      let countQuery = baseQuery;
      if (countConditions.length > 0) {
        countQuery = countQuery.where(and(...countConditions));
      }

      const [{ count: totalCount }] = await countQuery as { count: number }[];

      // Apply sorting
      if (sort === 'newest') {
        query = query.orderBy(desc(polls.createdAt));
      } else if (sort === 'oldest') {
        query = query.orderBy(asc(polls.createdAt));
      } else if (sort === 'endingSoon') {
        query = query
          .orderBy(eq(polls.isActive, true), desc) // Active polls first
          .orderBy(asc(polls.endDate)); // Then by end date
      } else {
        query = query.orderBy(desc(polls.createdAt));
      }

      // Apply pagination
      const offset = (page - 1) * pageSize;
      query = query.limit(pageSize).offset(offset);

      // Execute query
      const resultsPolls = await query;

      // Enrich polls with options and creator info
      const enrichedPolls = await Promise.all(
        resultsPolls.map(poll => this.enrichPoll(poll, userId))
      );

      return {
        polls: enrichedPolls,
        total: totalCount
      };
    } catch (error) {
      console.error('Error in getPolls:', error);
      throw error;
    }
  }

  async getUserPolls(userId: number): Promise<PollWithOptions[]> {
    const userPolls = await db
      .select()
      .from(polls)
      .where(eq(polls.creatorId, userId))
      .orderBy(desc(polls.createdAt));

    return Promise.all(userPolls.map(poll => this.enrichPoll(poll, userId)));
  }

  async getParticipatedPolls(userId: number): Promise<PollWithOptions[]> {
    // Get poll IDs where user has voted using a subquery
    const participatedPolls = await db
      .select()
      .from(polls)
      .where(
        inArray(
          polls.id,
          db.select({ pollId: votes.pollId })
            .from(votes)
            .where(eq(votes.userId, userId))
            .groupBy(votes.pollId)
        )
      )
      .orderBy(desc(polls.createdAt));

    return Promise.all(participatedPolls.map(poll => this.enrichPoll(poll, userId)));
  }

  async getPoll(id: number, userId?: number): Promise<PollWithOptions | undefined> {
    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, id));

    if (!poll) return undefined;

    // SECURITY: Community membership access control
    if (poll.communityId) {
      // If poll belongs to a community, check membership
      if (!userId) {
        // Anonymous users cannot see community-only polls
        return undefined;
      }

      const isMember = await this.isGroupMember(poll.communityId, userId);
      if (!isMember) {
        // User is not a member of this community
        return undefined;
      }
    }

    return this.enrichPoll(poll, userId);
  }

  async updatePoll(id: number, updates: Partial<Poll>): Promise<Poll> {
    console.log("Updating poll with updates:", JSON.stringify(updates, null, 2));

    // Handle location scope changes and coordinate updates
    if (updates.locationScope === 'global') {
      // For global polls, ensure coordinate fields are set to null
      updates = {
        ...updates,
        centerLat: null,
        centerLng: null,
        radiusKm: null,
        // Clear location data
        locationCity: null,
        locationRegion: null,
        locationCountry: null,
        locationCityId: null,
        locationRegionId: null,
        locationCountryId: null,
        city: null,
        region: null,
        country: null,
        geoRegion: null
      };
    } else if (updates.locationScope === 'geofenced') {
      // Handle empty string coordinates 
      if (updates.centerLat && typeof updates.centerLat === 'string' && updates.centerLat.trim() === '') {
        updates.centerLat = null;
      }
      if (updates.centerLng && typeof updates.centerLng === 'string' && updates.centerLng.trim() === '') {
        updates.centerLng = null;
      }

      // If updating a poll with valid coordinates, get location data
      if (updates.centerLat && updates.centerLng) {
        console.log(`Fetching location data for poll update with coordinates: ${updates.centerLat}, ${updates.centerLng}`);
        const locationData = await reverseGeocode(updates.centerLat, updates.centerLng);

        if (locationData) {
          console.log("Reverse geocoding result for poll update:", locationData);

          // Add location data to updates
          updates = {
            ...updates,
            // Set standardized location fields
            locationCity: locationData.city,
            locationRegion: locationData.region,
            locationCountry: locationData.country,

            // Set standardized location IDs
            locationCityId: locationData.cityId,
            locationRegionId: locationData.regionId,
            locationCountryId: locationData.countryId,

            // Set legacy fields for backward compatibility
            city: locationData.city,
            region: locationData.region,
            country: locationData.country,

            // Set standardized geographic region
            geoRegion: deriveGeoRegion(
              updates.centerLat,
              updates.centerLng,
              locationData.region,
              locationData.region
            )
          };
        }
      }
    }

    const [updatedPoll] = await db
      .update(polls)
      .set(updates)
      .where(eq(polls.id, id))
      .returning();

    if (!updatedPoll) {
      throw new Error("Poll not found");
    }

    return updatedPoll;
  }

  async extendPollDuration(id: number, newEndDate: Date): Promise<Poll> {
    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, id));

    if (!poll) {
      throw new Error("Poll not found");
    }

    const currentEndDate = new Date(poll.endDate);
    if (newEndDate.getTime() <= currentEndDate.getTime()) {
      throw new Error("New end date must be after current end date");
    }

    const [updatedPoll] = await db
      .update(polls)
      .set({ endDate: newEndDate })
      .where(eq(polls.id, id))
      .returning();

    return updatedPoll;
  }

  async deletePoll(id: number): Promise<boolean> {
    try {
      // Use a transaction to delete all related data
      return await db.transaction(async (tx) => {
        // Delete comments first (foreign key constraint)
        await tx
          .delete(comments)
          .where(eq(comments.pollId, id));

        // Delete votes (foreign key constraint)
        await tx
          .delete(votes)
          .where(eq(votes.pollId, id));

        // Delete poll options (foreign key constraint)
        await tx
          .delete(pollOptions)
          .where(eq(pollOptions.pollId, id));

        // Delete survey poll responses if any
        await tx
          .delete(pollUserResponses)
          .where(eq(pollUserResponses.pollId, id));

        // Get all question IDs for this poll
        const questionIds = await tx
          .select({ id: pollQuestions.id })
          .from(pollQuestions)
          .where(eq(pollQuestions.pollId, id));

        // Delete all answers for these questions
        if (questionIds.length > 0) {
          await tx
            .delete(pollAnswers)
            .where(inArray(
              pollAnswers.questionId,
              questionIds.map(q => q.id)
            ));
        }

        // Delete all questions
        await tx
          .delete(pollQuestions)
          .where(eq(pollQuestions.pollId, id));

        // Finally delete the poll
        const result = await tx
          .delete(polls)
          .where(eq(polls.id, id));

        return true;
      });
    } catch (error) {
      console.error('Error deleting poll:', error);
      return false;
    }
  }

  // Survey Poll methods
  async createSurveyPoll(poll: InsertPoll, questions: InsertPollQuestion[], answers: { questionId: number; answers: InsertPollAnswer[] }[]): Promise<Poll> {
    console.log("Creating survey poll with:", JSON.stringify(poll, null, 2));

    // Convert date strings to Date objects if they are strings
    if (typeof poll.startDate === 'string') {
      poll.startDate = new Date(poll.startDate);
    }
    if (typeof poll.endDate === 'string') {
      poll.endDate = new Date(poll.endDate);
    }

    try {
      // Start a transaction
      return await db.transaction(async (tx) => {
        // Derive the standardized geographic region if not provided
        const geoRegion = poll.geoRegion || deriveGeoRegion(
          poll.centerLat,
          poll.centerLng,
          poll.locationRegion,
          poll.region
        );

        // Set default location fields for Greece if coordinates are within Greece
        // and location fields are not already set
        const pollWithLocationData = { ...poll };

        // If we have coordinates but missing location data, set defaults
        if (poll.centerLat && poll.centerLng) {
          // Default country for our app's scope
          if (!poll.locationCountry) {
            pollWithLocationData.locationCountry = "Greece";
          }

          // If we detected a region from coordinates, set locationRegion
          if (geoRegion && !poll.locationRegion) {
            // Convert standardized region to display name
            const regionDisplayMap: Record<string, string> = {
              'attica': 'Attica',
              'aegean': 'Aegean',
              'macedonia-and-thrace': 'Macedonia and Thrace',
              'central-macedonia': 'Central Macedonia',
              'western-macedonia': 'Western Macedonia'
            };

            pollWithLocationData.locationRegion = regionDisplayMap[geoRegion] || geoRegion;
          }
        }

        // Create poll first with geoRegion and improved location data
        const [newPoll] = await tx
          .insert(polls)
          .values({
            ...pollWithLocationData,
            isActive: true,
            pollType: "surveyPoll", // Set survey poll type
            geoRegion
          })
          .returning();

        console.log("Created survey poll:", JSON.stringify(newPoll, null, 2));

        // Create top-level questions
        const createdQuestions: Record<number, number> = {}; // Map temporary IDs to real database IDs

        for (const question of questions) {
          // Destructure to remove id, parentId, and parentAnswerId from the data
          const { id: tempId, parentId, parentAnswerId, ...questionData } = question;

          // Insert the question without the temporary ID
          const [insertedQuestion] = await tx
            .insert(pollQuestions)
            .values({
              ...questionData,
              pollId: newPoll.id,
            })
            .returning();

          // Store the mapping from temp ID to real ID
          if (tempId !== undefined) {
            createdQuestions[tempId] = insertedQuestion.id;
          }
        }

        console.log("Created questions with ID mapping:", createdQuestions);

        // Update parent references for questions
        for (const question of questions) {
          if (question.parentId && question.parentAnswerId) {
            const realQuestionId = createdQuestions[question.id];
            const realParentId = createdQuestions[question.parentId];

            // Find the real answer ID (will be set in the next step)
            // For now, we just note that this question has a parent
            if (realQuestionId && realParentId) {
              await tx
                .update(pollQuestions)
                .set({
                  parentId: realParentId,
                  // parentAnswerId will be set later
                })
                .where(eq(pollQuestions.id, realQuestionId));
            }
          }
        }

        // Create all answers and track their IDs
        const createdAnswers: Record<number, number> = {}; // Map temporary answer IDs to real IDs

        for (const { questionId, answers: questionAnswers } of answers) {
          const realQuestionId = createdQuestions[questionId];

          if (!realQuestionId) {
            console.error(`Question ID ${questionId} not found in created questions map`);
            continue;
          }

          for (const answer of questionAnswers) {
            const tempAnswerId = answer.id; // Temporary ID for reference

            const [insertedAnswer] = await tx
              .insert(pollAnswers)
              .values({
                questionId: realQuestionId,
                text: answer.text,
                order: answer.order
              })
              .returning();

            createdAnswers[tempAnswerId] = insertedAnswer.id;
          }
        }

        console.log("Created answers with ID mapping:", createdAnswers);

        // Now update parent answer IDs for questions that have them
        for (const question of questions) {
          if (question.parentId && question.parentAnswerId) {
            const realQuestionId = createdQuestions[question.id];
            const realParentAnswerId = createdAnswers[question.parentAnswerId];

            if (realQuestionId && realParentAnswerId) {
              await tx
                .update(pollQuestions)
                .set({
                  parentAnswerId: realParentAnswerId
                })
                .where(eq(pollQuestions.id, realQuestionId));
            }
          }
        }

        return newPoll;
      });
    } catch (error) {
      console.error("Error in createSurveyPoll transaction:", error);
      throw error;
    }
  }

  async getSurveyPoll(id: number, userId?: number): Promise<PollWithQuestions | undefined> {
    // Get the poll first
    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, id));

    if (!poll) return undefined;

    // SECURITY: Community membership access control
    if (poll.communityId) {
      // If poll belongs to a community, check membership
      if (!userId) {
        // Anonymous users cannot see community-only polls
        return undefined;
      }

      const isMember = await this.isGroupMember(poll.communityId, userId);
      if (!isMember) {
        // User is not a member of this community
        return undefined;
      }
    }

    // Check if it's a survey poll
    if (poll.pollType !== "surveyPoll") {
      throw new Error("This poll is not a survey poll");
    }

    // Get user info
    const [creator] = await db
      .select()
      .from(users)
      .where(eq(users.id, poll.creatorId));

    // Get all questions for this poll
    const questions = await db
      .select()
      .from(pollQuestions)
      .where(eq(pollQuestions.pollId, id))
      .orderBy(asc(pollQuestions.order));

    // Get all answers for all questions
    const questionIds = questions.map(q => q.id);
    const allAnswers = await db
      .select()
      .from(pollAnswers)
      .where(inArray(pollAnswers.questionId, questionIds))
      .orderBy(asc(pollAnswers.order));

    // Organize answers by question ID
    const answersByQuestion: Record<number, PollAnswer[]> = {};
    for (const answer of allAnswers) {
      if (!answersByQuestion[answer.questionId]) {
        answersByQuestion[answer.questionId] = [];
      }
      answersByQuestion[answer.questionId].push(answer);
    }

    // Build question hierarchy
    const topLevelQuestions: PollQuestionWithAnswers[] = [];
    const questionMap: Record<number, PollQuestionWithAnswers> = {};

    // First pass: create all question objects with their answers
    for (const question of questions) {
      const questionWithAnswers: PollQuestionWithAnswers = {
        ...question,
        answers: answersByQuestion[question.id] || [],
        childQuestions: []
      };

      questionMap[question.id] = questionWithAnswers;

      // If no parent, it's a top-level question
      if (!question.parentId) {
        topLevelQuestions.push(questionWithAnswers);
      }
    }

    // Second pass: establish parent-child relationships
    for (const question of questions) {
      if (question.parentId && questionMap[question.parentId]) {
        // Add this question as a child of its parent
        questionMap[question.parentId].childQuestions.push(questionMap[question.id]);
      }
    }

    // Check if user has voted
    let userVoted = false;
    if (userId) {
      const [response] = await db
        .select()
        .from(pollUserResponses)
        .where(and(
          eq(pollUserResponses.pollId, id),
          eq(pollUserResponses.userId, userId)
        ))
        .limit(1);

      userVoted = !!response;
    }

    // Get vote count (number of unique users who have responded)
    const [voteCountResult] = await db
      .select({ count: sql<number>`count(distinct ${pollUserResponses.userId})` })
      .from(pollUserResponses)
      .where(eq(pollUserResponses.pollId, id)) as { count: number }[];

    // Check if poll is still active
    const now = new Date();
    const endDate = new Date(poll.endDate);

    let isActive = poll.isActive;
    if (isActive && endDate < now) {
      // Update poll to inactive
      await db
        .update(polls)
        .set({ isActive: false })
        .where(eq(polls.id, id));

      isActive = false;
    }

    return {
      ...poll,
      isActive,
      questions: topLevelQuestions,
      creator: creator || {
        id: poll.creatorId,
        username: "unknown",
        name: "Άγνωστος",
        email: "",
        password: ""
      },
      voteCount: voteCountResult.count,
      userVoted
    };
  }

  async updateSurveyStructure(id: number, updates: Partial<Poll>, questions: InsertPollQuestion[], answers: { questionId: number; answers: InsertPollAnswer[] }[]): Promise<Poll> {
    try {
      // Check if there are any responses
      const hasResponses = await this.hasAnyResponses(id);

      // Block structural updates if responses exist
      if (hasResponses) {
        throw new Error("Cannot modify survey structure after responses have been submitted");
      }

      return await db.transaction(async (tx) => {
        // Update the poll basic info
        const [updatedPoll] = await tx
          .update(polls)
          .set(updates)
          .where(eq(polls.id, id))
          .returning();

        if (!updatedPoll) {
          throw new Error("Poll not found");
        }

        // First get existing questions to know what to delete
        const existingQuestions = await tx
          .select({ id: pollQuestions.id })
          .from(pollQuestions)
          .where(eq(pollQuestions.pollId, id));

        const existingQuestionIds = existingQuestions.map(q => q.id);

        // Delete existing answers for these questions
        if (existingQuestionIds.length > 0) {
          await tx
            .delete(pollAnswers)
            .where(inArray(pollAnswers.questionId, existingQuestionIds));
        }

        // Delete existing questions
        await tx
          .delete(pollQuestions)
          .where(eq(pollQuestions.pollId, id));

        // Same logic as create - first add questions
        const createdQuestions: Record<number, number> = {};

        for (const question of questions) {
          // Destructure to remove id, parentId, and parentAnswerId from the data
          const { id: tempId, parentId, parentAnswerId, ...questionData } = question;

          const [insertedQuestion] = await tx
            .insert(pollQuestions)
            .values({
              ...questionData,
              pollId: updatedPoll.id,
            })
            .returning();

          if (tempId !== undefined) {
            createdQuestions[tempId] = insertedQuestion.id;
          }
        }

        // Then add answers
        const createdAnswers: Record<number, number> = {};

        for (const { questionId, answers: questionAnswers } of answers) {
          const realQuestionId = createdQuestions[questionId];

          if (!realQuestionId) continue;

          for (const answer of questionAnswers) {
            const tempAnswerId = answer.id;

            const [insertedAnswer] = await tx
              .insert(pollAnswers)
              .values({
                questionId: realQuestionId,
                text: answer.text,
                order: answer.order
              })
              .returning();

            createdAnswers[tempAnswerId] = insertedAnswer.id;
          }
        }

        // Finally update parent relationships
        for (const question of questions) {
          if (question.parentId && question.parentAnswerId) {
            const realQuestionId = createdQuestions[question.id];
            const realParentId = createdQuestions[question.parentId];
            const realParentAnswerId = createdAnswers[question.parentAnswerId];

            if (realQuestionId && realParentId && realParentAnswerId) {
              await tx
                .update(pollQuestions)
                .set({
                  parentId: realParentId,
                  parentAnswerId: realParentAnswerId
                })
                .where(eq(pollQuestions.id, realQuestionId));
            }
          }
        }

        return updatedPoll;
      });
    } catch (error) {
      console.error("Error in updateSurveyStructure transaction:", error);
      throw error;
    }
  }

  async updateSurveyMetadata(id: number, updates: Partial<Poll>): Promise<Poll> {
    const [updatedPoll] = await db
      .update(polls)
      .set(updates)
      .where(eq(polls.id, id))
      .returning();

    if (!updatedPoll) {
      throw new Error("Poll not found");
    }

    return updatedPoll;
  }

  // Survey Response methods
  async createSurveyResponse(responses: InsertPollUserResponse[]): Promise<PollUserResponse[]> {
    try {
      const createdResponses: PollUserResponse[] = [];

      // Use a transaction to ensure all responses are created or none
      await db.transaction(async (tx) => {
        for (const response of responses) {
          const [createdResponse] = await tx
            .insert(pollUserResponses)
            .values(response)
            .returning();

          createdResponses.push(createdResponse);
        }
      });

      return createdResponses;
    } catch (error) {
      console.error("Error creating survey responses:", error);
      throw error;
    }
  }

  async getSurveyResults(pollId: number): Promise<{ questionId: number; answerResults: { answerId: number; answerText: string; count: number; percentage: number }[] }[]> {
    try {
      // Get all questions for this poll
      const questions = await db
        .select()
        .from(pollQuestions)
        .where(eq(pollQuestions.pollId, pollId));

      // Get all answers for these questions
      const questionIds = questions.map(q => q.id);
      const answers = await db
        .select()
        .from(pollAnswers)
        .where(inArray(pollAnswers.questionId, questionIds));

      // Get response counts for each answer
      const results: { questionId: number; answerResults: { answerId: number; answerText: string; count: number; percentage: number }[] }[] = [];

      for (const question of questions) {
        // Get this question's answers
        const questionAnswers = answers.filter(a => a.questionId === question.id);

        if (question.questionType === "singleChoice" || question.questionType === "multipleChoice") {
          // For single and multiple choice, count responses per answer
          const answerResults: { answerId: number; answerText: string; count: number; percentage: number }[] = [];

          // Get total responses for this question
          const [{ count: totalResponses }] = await db
            .select({ count: sql<number>`count(distinct ${pollUserResponses.userId})::int` })
            .from(pollUserResponses)
            .where(and(
              eq(pollUserResponses.pollId, pollId),
              eq(pollUserResponses.questionId, question.id)
            )) as { count: number }[];

          for (const answer of questionAnswers) {
            // Get count for this answer - COUNT DISTINCT users, not total records
            // This is critical for multiple choice where one user can select multiple answers
            // Check both answerId field AND answerValue field (for legacy data stored as JSON arrays)
            const [{ count }] = await db
              .select({ count: sql<number>`count(distinct user_id)::int` })
              .from(pollUserResponses)
              .where(and(
                eq(pollUserResponses.pollId, pollId),
                eq(pollUserResponses.questionId, question.id),
                sql`(answer_id = ${answer.id} OR answer_value::jsonb @> ${JSON.stringify([answer.id])}::jsonb)`
              )) as { count: number }[];

            // Calculate percentage
            const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0;

            answerResults.push({
              answerId: answer.id,
              answerText: answer.text,
              count: Number(count), // Ensure it's a number
              percentage: Math.round(percentage * 100) / 100 // Round to 2 decimal places
            });
          }

          results.push({ questionId: question.id, answerResults });

        } else if (question.questionType === "ordering") {
          // For ordering questions, we need to analyze the JSON value
          const answerResults: { answerId: number; answerText: string; count: number; percentage: number }[] = [];

          // Get all responses for this question
          const responses = await db
            .select()
            .from(pollUserResponses)
            .where(and(
              eq(pollUserResponses.pollId, pollId),
              eq(pollUserResponses.questionId, question.id)
            ));

          // Count positions for each answer
          const answerPositions: Record<number, number[]> = {};

          questionAnswers.forEach(answer => {
            answerPositions[answer.id] = [];
          });

          // Process each response
          responses.forEach(response => {
            if (response.answerValue && typeof response.answerValue === 'object') {
              // answerValue contains ordered answer IDs
              const ordering = response.answerValue as number[];

              ordering.forEach((answerId, index) => {
                if (answerPositions[answerId]) {
                  answerPositions[answerId].push(index + 1);
                }
              });
            }
          });

          // Calculate average position for each answer
          for (const answer of questionAnswers) {
            const positions = answerPositions[answer.id] || [];
            const count = positions.length;

            // Calculate average position
            const avg = count > 0
              ? positions.reduce((sum, pos) => sum + pos, 0) / count
              : 0;

            // Calculate a percentage where 100% means always first position
            // 0% means always last position
            const maxPosition = questionAnswers.length;
            const percentage = count > 0
              ? ((maxPosition - (avg - 1)) / maxPosition) * 100
              : 0;

            answerResults.push({
              answerId: answer.id,
              answerText: answer.text,
              count,
              percentage: Math.round(percentage * 100) / 100
            });
          }

          // Sort by average position (highest percentage first)
          answerResults.sort((a, b) => b.percentage - a.percentage);

          results.push({ questionId: question.id, answerResults });
        }
      }

      return results;
    } catch (error) {
      console.error("Error getting survey results:", error);
      throw error;
    }
  }

  async hasUserRespondedToSurvey(pollId: number, userId: number): Promise<boolean> {
    const [response] = await db
      .select()
      .from(pollUserResponses)
      .where(and(
        eq(pollUserResponses.pollId, pollId),
        eq(pollUserResponses.userId, userId)
      ))
      .limit(1);

    return !!response;
  }

  async hasAnyResponses(pollId: number): Promise<boolean> {
    const [response] = await db
      .select()
      .from(pollUserResponses)
      .where(eq(pollUserResponses.pollId, pollId))
      .limit(1);

    return !!response;
  }

  // Vote methods
  async createVote(vote: InsertVote | RankingVote): Promise<Vote> {
    // Check if it's a ranking vote with orderedOptionIds
    if ('orderedOptionIds' in vote && vote.orderedOptionIds && vote.orderedOptionIds.length > 0) {
      const { pollId, userId, orderedOptionIds, comment } = vote;

      // Get the poll to check its type
      const poll = await this.getPoll(pollId);
      if (!poll || poll.pollType !== 'ranking') {
        throw new Error("Cannot submit ranking vote for a non-ranking poll");
      }

      // For ranking polls, we store the first option ID in optionId for compatibility
      // and the full ordering in comment as JSON
      const rankVote: InsertVote = {
        pollId,
        userId,
        optionId: orderedOptionIds[0], // First choice becomes the primary vote
        comment: comment || JSON.stringify(orderedOptionIds) // Store ordered IDs
      };

      const [newVote] = await db
        .insert(votes)
        .values(rankVote)
        .returning();

      return newVote;
    } else {
      // Regular single-choice vote
      const [newVote] = await db
        .insert(votes)
        .values(vote as InsertVote)
        .returning();

      return newVote;
    }
  }

  async hasUserVoted(pollId: number, userId: number): Promise<boolean> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(
        and(
          eq(votes.pollId, pollId),
          eq(votes.userId, userId)
        )
      );

    return !!vote;
  }

  async getPollParticipantCount(pollId: number): Promise<number> {
    // Count unique users who have voted in this poll
    const [result] = await db
      .select({
        count: sql<number>`COUNT(DISTINCT ${votes.userId})`
      })
      .from(votes)
      .where(eq(votes.pollId, pollId));

    return Number(result?.count || 0);
  }

  async canEditVote(pollId: number, userId: number): Promise<boolean> {
    // Find the vote by poll and user
    const [userVote] = await db
      .select({
        createdAt: votes.createdAt
      })
      .from(votes)
      .where(
        and(
          eq(votes.pollId, pollId),
          eq(votes.userId, userId)
        )
      );

    // If no vote found, they can't edit
    if (!userVote) {
      return false;
    }

    // Check if vote was created within last 60 minutes
    const voteTime = new Date(userVote.createdAt);
    const currentTime = new Date();
    const timeDifferenceMinutes = (currentTime.getTime() - voteTime.getTime()) / (1000 * 60);

    return timeDifferenceMinutes <= 60; // Can edit if less than 60 minutes
  }

  async getPollResults(pollId: number): Promise<PollResult[]> {
    // Get the poll first to determine its type
    const [poll] = await db
      .select()
      .from(polls)
      .where(eq(polls.id, pollId));

    if (!poll) {
      throw new Error("Poll not found");
    }

    // We need to get all options for the poll
    const options = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, pollId))
      .orderBy(asc(pollOptions.order));

    // Count total votes for the poll
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(votes)
      .where(eq(votes.pollId, pollId)) as { total: number }[];

    // Check if this is a ranking poll
    if (poll.pollType === 'ranking') {
      // For ranking polls, we need to process the rankings stored in the comments
      // Get all votes for this poll
      const pollVotes = await db
        .select()
        .from(votes)
        .where(eq(votes.pollId, pollId));

      // Initialize ranking stats for each option
      const rankStats: Record<number, {
        totalPoints: number,
        firstPlaceVotes: number,
        averageRank: number,
        ranks: Record<number, number> // Store count of each rank position
      }> = {};

      options.forEach(opt => {
        rankStats[opt.id] = {
          totalPoints: 0,
          firstPlaceVotes: 0,
          averageRank: 0,
          ranks: {}
        };

        // Initialize rank counts
        for (let i = 1; i <= options.length; i++) {
          rankStats[opt.id].ranks[i] = 0;
        }
      });

      // Process each vote to extract the ranking data
      pollVotes.forEach(vote => {
        try {
          // The ordered IDs are stored as a JSON string in the comment field for ranking polls
          if (vote.comment && vote.comment.startsWith('[') && vote.comment.endsWith(']')) {
            const orderedIds = JSON.parse(vote.comment) as number[];

            // Calculate points and positions
            orderedIds.forEach((optionId, index) => {
              const rank = index + 1;
              // Record first place votes
              if (rank === 1) {
                rankStats[optionId].firstPlaceVotes++;
              }

              // The lower the rank (closer to 1), the more points it gets
              const points = options.length - index;
              rankStats[optionId].totalPoints += points;

              // Increment the count for this rank position
              rankStats[optionId].ranks[rank]++;
            });
          }
        } catch (error) {
          console.error("Error parsing ranking vote:", error);
        }
      });

      // Calculate average ranks and prepare results
      const results = options.map(option => {
        const stats = rankStats[option.id];
        const voteCount = Object.values(stats.ranks).reduce((sum, count) => sum + count, 0);

        // Calculate average rank (weighted)
        let totalRankWeight = 0;
        for (let rank = 1; rank <= options.length; rank++) {
          totalRankWeight += rank * stats.ranks[rank];
        }
        stats.averageRank = voteCount > 0 ? totalRankWeight / voteCount : 0;

        // Calculate percentage based on points
        const maxPossiblePoints = total * options.length;
        const percentage = maxPossiblePoints > 0 ? (stats.totalPoints / maxPossiblePoints) * 100 : 0;

        return {
          pollId,
          optionId: option.id,
          optionText: option.text,
          voteCount: total, // Total number of votes (each voter ranks all options)
          percentage,
          isRanking: true,
          rankingStats: {
            totalPoints: stats.totalPoints,
            firstPlaceVotes: stats.firstPlaceVotes,
            averageRank: stats.averageRank.toFixed(2),
            rankDistribution: stats.ranks
          }
        };
      });

      // Sort by total points (highest first)
      return results.sort((a, b) => b.rankingStats.totalPoints - a.rankingStats.totalPoints);
    } else {
      // For regular (non-ranking) polls, continue with the original logic
      const results = await Promise.all(options.map(async (option) => {
        const [{ voteCount }] = await db
          .select({ voteCount: sql<number>`count(*)` })
          .from(votes)
          .where(
            and(
              eq(votes.pollId, pollId),
              eq(votes.optionId, option.id)
            )
          ) as { voteCount: number }[];

        const percentage = total > 0 ? (voteCount / total) * 100 : 0;

        return {
          pollId,
          optionId: option.id,
          optionText: option.text,
          voteCount,
          percentage
        };
      }));

      return results;
    }
  }

  // Comment methods
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values(comment)
      .returning();

    return newComment;
  }

  async getPollComments(pollId: number): Promise<CommentWithUser[]> {
    // Get comments with user info using a join
    const commentsWithUser = await db
      .select({
        id: comments.id,
        pollId: comments.pollId,
        userId: comments.userId,
        text: comments.text,
        createdAt: comments.createdAt,
        u_name: users.name,
        u_username: users.username
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.pollId, pollId))
      .orderBy(desc(comments.createdAt));

    return commentsWithUser.map(c => ({
      id: c.id,
      pollId: c.pollId,
      userId: c.userId,
      text: c.text,
      createdAt: c.createdAt,
      user: {
        name: c.u_name,
        username: c.u_username
      }
    })) as CommentWithUser[];
  }
  async getUserNotifications(userId: number): Promise<(PollNotification & { poll: Poll & { community?: { id: number; name: string } | null } })[]> {
    // Get unread notifications with poll details
    const notifications = await db
      .select({
        id: pollNotifications.id,
        userId: pollNotifications.userId,
        pollId: pollNotifications.pollId,
        read: pollNotifications.read,
        createdAt: pollNotifications.createdAt,
        p_id: polls.id,
        p_title: polls.title,
        p_description: polls.description,
        p_category: polls.category,
        p_creatorId: polls.creatorId,
        p_startDate: polls.startDate,
        p_endDate: polls.endDate,
        p_isActive: polls.isActive,
        p_allowExtension: polls.allowExtension,
        p_createdAt: polls.createdAt,
        p_visibility: polls.visibility,
        p_showResults: polls.showResults,
        p_allowComments: polls.allowComments,
        p_requireVerification: polls.requireVerification,
        p_pollType: polls.pollType,
        p_locationScope: polls.locationScope,
        p_communityMode: polls.communityMode,
        p_centerLat: polls.centerLat,
        p_centerLng: polls.centerLng,
        p_radiusKm: polls.radiusKm,
        p_city: polls.city,
        p_region: polls.region,
        p_country: polls.country,
        p_locationCity: polls.locationCity,
        p_locationRegion: polls.locationRegion,
        p_locationCountry: polls.locationCountry,
        p_locationCityId: polls.locationCityId,
        p_locationRegionId: polls.locationRegionId,
        p_locationCountryId: polls.locationCountryId,
        p_geoRegion: polls.geoRegion
      })
      .from(pollNotifications)
      .innerJoin(polls, eq(pollNotifications.pollId, polls.id))
      .where(and(
        eq(pollNotifications.userId, userId),
        eq(pollNotifications.read, false)
      ))
      .orderBy(desc(pollNotifications.createdAt));

    return notifications.map(n => ({
      id: n.id,
      userId: n.userId,
      pollId: n.pollId,
      read: n.read,
      createdAt: n.createdAt,
      poll: {
        id: n.p_id,
        title: n.p_title,
        description: n.p_description,
        category: n.p_category,
        creatorId: n.p_creatorId,
        startDate: n.p_startDate,
        endDate: n.p_endDate,
        isActive: n.p_isActive,
        allowExtension: n.p_allowExtension,
        createdAt: n.p_createdAt,
        visibility: n.p_visibility,
        showResults: n.p_showResults,
        allowComments: n.p_allowComments,
        requireVerification: n.p_requireVerification,
        pollType: n.p_pollType,
        locationScope: n.p_locationScope,
        communityMode: n.p_communityMode,
        centerLat: n.p_centerLat,
        centerLng: n.p_centerLng,
        radiusKm: n.p_radiusKm,
        city: n.p_city,
        region: n.p_region,
        country: n.p_country,
        locationCity: n.p_locationCity,
        locationRegion: n.p_locationRegion,
        locationCountry: n.p_locationCountry,
        locationCityId: n.p_locationCityId,
        locationRegionId: n.p_locationRegionId,
        locationCountryId: n.p_locationCountryId,
        geoRegion: n.p_geoRegion
      }
    }));
  }

  async markNotificationAsRead(notificationId: number): Promise<PollNotification> {
    const [updatedNotification] = await db
      .update(pollNotifications)
      .set({ read: true })
      .where(eq(pollNotifications.id, notificationId))
      .returning();

    if (!updatedNotification) {
      throw new Error("Notification not found");
    }

    return updatedNotification;
  }

  // Helper methods
  private async enrichPoll(poll: Poll, userId?: number): Promise<PollWithOptions> {
    // Get options
    const options = await db
      .select()
      .from(pollOptions)
      .where(eq(pollOptions.pollId, poll.id))
      .orderBy(asc(pollOptions.order));

    // Handle community mode or get creator
    let safeCreator;

    if (poll.communityMode) {
      // For community mode, use a generic "Community" creator
      safeCreator = {
        id: 0, // Using 0 as a special ID for community
        username: "community",
        password: "",
        name: "Κοινότητα",
        email: ""
      };
    } else {
      // Get the actual creator
      const [creator] = await db
        .select()
        .from(users)
        .where(eq(users.id, poll.creatorId));

      // If no creator is found (should not happen), provide a default
      safeCreator = creator || {
        id: poll.creatorId,
        username: "unknown",
        password: "",
        name: "Άγνωστος",
        email: ""
      };
    }

    // Get vote count based on poll type
    let voteCount: number;

    if (poll.pollType === 'surveyPoll') {
      // For survey polls, count unique users who responded
      const [{ count }] = await db
        .select({ count: sql<number>`count(DISTINCT ${pollUserResponses.userId})` })
        .from(pollUserResponses)
        .where(eq(pollUserResponses.pollId, poll.id)) as { count: number }[];
      voteCount = count;
    } else {
      // For standard polls, count from votes table
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(votes)
        .where(eq(votes.pollId, poll.id)) as { count: number }[];
      voteCount = count;
    }

    // Check if user has voted
    const userVoted = userId ? await this.hasUserVoted(poll.id, userId) : false;

    // Check if poll is still active (end date not passed)
    const now = new Date();
    const endDate = new Date(poll.endDate);

    if (poll.isActive && endDate < now) {
      // Update poll to inactive
      await db
        .update(polls)
        .set({ isActive: false })
        .where(eq(polls.id, poll.id));

      poll.isActive = false;
    }

    return {
      ...poll,
      options,
      creator: safeCreator,
      voteCount,
      userVoted
    };
  }

  /**
   * Delete a user account with options to either delete their polls or transfer them to community
   * @param userId - The ID of the user to delete
   * @param deletePolls - Whether to delete the user's polls (true) or transfer to community (false)
   * @returns Promise resolving to true if deletion was successful
   */
  async deleteUser(userId: number, deletePolls: boolean): Promise<boolean> {
    try {
      // Start a transaction to ensure data integrity
      return await db.transaction(async (tx) => {
        // 1. First handle polls based on user's choice
        if (deletePolls) {
          // Delete all user's polls and related data

          // Get all polls created by this user
          const userPolls = await tx
            .select({ id: polls.id })
            .from(polls)
            .where(eq(polls.creatorId, userId));

          const pollIds = userPolls.map(poll => poll.id);

          if (pollIds.length > 0) {
            // Delete all poll user responses for these polls
            await tx
              .delete(pollUserResponses)
              .where(inArray(pollUserResponses.pollId, pollIds));

            // Delete all poll answers and questions for these polls
            const questions = await tx
              .select({ id: pollQuestions.id })
              .from(pollQuestions)
              .where(inArray(pollQuestions.pollId, pollIds));

            const questionIds = questions.map(q => q.id);

            if (questionIds.length > 0) {
              await tx
                .delete(pollAnswers)
                .where(inArray(pollAnswers.questionId, questionIds));

              await tx
                .delete(pollQuestions)
                .where(inArray(pollQuestions.pollId, pollIds));
            }

            // Delete all votes for these polls
            await tx
              .delete(votes)
              .where(inArray(votes.pollId, pollIds));

            // Delete all comments for these polls
            await tx
              .delete(comments)
              .where(inArray(comments.pollId, pollIds));

            // Delete all poll options for these polls
            await tx
              .delete(pollOptions)
              .where(inArray(pollOptions.pollId, pollIds));

            // Finally delete the polls themselves
            await tx
              .delete(polls)
              .where(inArray(polls.id, pollIds));
          }
        } else {
          // Transfer polls to community mode
          await tx
            .update(polls)
            .set({
              communityMode: true,
              // We keep the creatorId as-is to maintain relationships
              // but the communityMode flag will hide the creator's identity
            })
            .where(eq(polls.creatorId, userId));
        }

        // 2. Delete all user votes (regardless of poll ownership)
        await tx
          .delete(votes)
          .where(eq(votes.userId, userId));

        // 3. Delete all user comments (regardless of poll ownership)
        await tx
          .delete(comments)
          .where(eq(comments.userId, userId));

        // 4. Delete all user poll responses
        await tx
          .delete(pollUserResponses)
          .where(eq(pollUserResponses.userId, userId));

        // 5. Finally delete the user
        await tx
          .delete(users)
          .where(eq(users.id, userId));

        return true;
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Analytics methods implementation
  async getAnalyticsOverview() {
    try {
      const [totalUsers] = await db.select({ count: count() }).from(users);
      const [totalPolls] = await db.select({ count: count() }).from(polls);

      // Count votes from both regular polls (votes table) and survey polls (pollUserResponses table)
      const [regularVotes] = await db.select({ count: count() }).from(votes);
      const [surveyVotes] = await db
        .select({ count: sql<number>`count(DISTINCT ${pollUserResponses.userId})` })
        .from(pollUserResponses);
      // PostgreSQL count returns bigint as string, so convert to numbers before adding
      const totalVotes = Number(regularVotes?.count ?? 0) + Number(surveyVotes?.count ?? 0);

      const [totalComments] = await db.select({ count: count() }).from(comments);

      // Count active polls that haven't expired yet
      const [activePolls] = await db
        .select({ count: count() })
        .from(polls)
        .where(
          and(
            eq(polls.isActive, true),
            sql`${polls.endDate} > NOW()`
          )
        );

      // New users in last 7 and 30 days
      // Query account_activity table for registration events
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const newUsers7DaysResult = await db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM account_activity
        WHERE action = 'registration' AND timestamp >= ${sevenDaysAgo}
      `);
      const newUsers7Days = { count: Number(newUsers7DaysResult.rows[0]?.count ?? 0) };

      const newUsers30DaysResult = await db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM account_activity
        WHERE action = 'registration' AND timestamp >= ${thirtyDaysAgo}
      `);
      const newUsers30Days = { count: Number(newUsers30DaysResult.rows[0]?.count ?? 0) };

      // Active users in last 7 and 30 days (users who voted or commented)
      const activeUsers7DaysResult = await db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM (
          SELECT user_id FROM votes WHERE created_at >= ${sevenDaysAgo}
          UNION
          SELECT user_id FROM comments WHERE created_at >= ${sevenDaysAgo}
          UNION
          SELECT user_id FROM poll_user_responses WHERE created_at >= ${sevenDaysAgo}
        ) active_users
      `);
      const activeUsers7Days = Number(activeUsers7DaysResult.rows[0]?.count ?? 0);

      const activeUsers30DaysResult = await db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM (
          SELECT user_id FROM votes WHERE created_at >= ${thirtyDaysAgo}
          UNION
          SELECT user_id FROM comments WHERE created_at >= ${thirtyDaysAgo}
          UNION
          SELECT user_id FROM poll_user_responses WHERE created_at >= ${thirtyDaysAgo}
        ) active_users
      `);
      const activeUsers30Days = Number(activeUsers30DaysResult.rows[0]?.count ?? 0);

      // Participation rate (% of users who have voted at least once)
      const usersWhoVotedResult = await db.execute(sql`
        SELECT COUNT(DISTINCT user_id) as count
        FROM (
          SELECT user_id FROM votes
          UNION
          SELECT user_id FROM poll_user_responses
        ) voters
      `);
      const usersWhoVoted = Number(usersWhoVotedResult.rows[0]?.count ?? 0);
      const participationRate = Number(totalUsers.count) > 0
        ? Math.round((usersWhoVoted / Number(totalUsers.count)) * 100)
        : 0;

      // Average votes per poll
      const avgVotesPerPoll = Number(totalPolls.count) > 0
        ? Math.round((totalVotes / Number(totalPolls.count)) * 10) / 10
        : 0;

      // Average comments per poll
      const avgCommentsPerPoll = Number(totalPolls.count) > 0
        ? Math.round((Number(totalComments.count) / Number(totalPolls.count)) * 10) / 10
        : 0;

      const popularCategories = await db
        .select({
          category: polls.category,
          count: count()
        })
        .from(polls)
        .groupBy(polls.category)
        .orderBy(desc(count()))
        .limit(5);

      return {
        totalUsers: totalUsers.count,
        totalPolls: totalPolls.count,
        totalVotes,
        totalComments: totalComments.count,
        activePolls: activePolls.count,
        newUsers7Days: newUsers7Days.count,
        newUsers30Days: newUsers30Days.count,
        activeUsers7Days,
        activeUsers30Days,
        participationRate,
        avgVotesPerPoll,
        avgCommentsPerPoll,
        popularCategories
      };
    } catch (error) {
      console.error("Error fetching analytics overview:", error);
      throw error;
    }
  }

  async getPollPopularityStats() {
    try {
      // Get vote counts separately
      const voteCountsSubquery = db
        .select({
          pollId: votes.pollId,
          voteCount: count(votes.id).as('voteCount')
        })
        .from(votes)
        .groupBy(votes.pollId)
        .as('voteCounts');

      // Get comment counts separately  
      const commentCountsSubquery = db
        .select({
          pollId: comments.pollId,
          commentCount: count(comments.id).as('commentCount')
        })
        .from(comments)
        .groupBy(comments.pollId)
        .as('commentCounts');

      const popularPolls = await db
        .select({
          id: polls.id,
          title: polls.title,
          category: polls.category,
          createdAt: polls.createdAt,
          votes: sql<number>`COALESCE(${voteCountsSubquery.voteCount}, 0)`.as('votes'),
          comments: sql<number>`COALESCE(${commentCountsSubquery.commentCount}, 0)`.as('comments')
        })
        .from(polls)
        .leftJoin(voteCountsSubquery, eq(polls.id, voteCountsSubquery.pollId))
        .leftJoin(commentCountsSubquery, eq(polls.id, commentCountsSubquery.pollId))
        .orderBy(desc(sql<number>`COALESCE(${voteCountsSubquery.voteCount}, 0)`))
        .limit(10);

      return popularPolls.map(poll => ({
        ...poll,
        createdAt: poll.createdAt.toISOString()
      }));
    } catch (error) {
      console.error("Error fetching poll popularity stats:", error);
      throw error;
    }
  }

  async getActivityTrends() {
    try {
      const trends = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(CASE WHEN table_name = 'polls' THEN 1 END) as polls,
          COUNT(CASE WHEN table_name = 'votes' THEN 1 END) as votes,
          COUNT(CASE WHEN table_name = 'comments' THEN 1 END) as comments
        FROM (
          SELECT created_at, 'polls' as table_name FROM polls WHERE created_at >= NOW() - INTERVAL '30 days'
          UNION ALL
          SELECT created_at, 'votes' as table_name FROM votes WHERE created_at >= NOW() - INTERVAL '30 days'
          UNION ALL
          SELECT created_at, 'comments' as table_name FROM comments WHERE created_at >= NOW() - INTERVAL '30 days'
        ) activities
        GROUP BY DATE(created_at)
        ORDER BY date ASC
        LIMIT 30
      `);

      return trends.rows.map((row: any) => ({
        date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : row.date,
        polls: parseInt(row.polls),
        votes: parseInt(row.votes),
        comments: parseInt(row.comments)
      }));
    } catch (error) {
      console.error("Error fetching activity trends:", error);
      throw error;
    }
  }

  async getUsagePatterns() {
    try {
      const hourlyActivity = await db.execute(sql`
        SELECT 
          EXTRACT(HOUR FROM created_at) as hour,
          COUNT(*) as activity
        FROM (
          SELECT created_at FROM polls WHERE created_at >= NOW() - INTERVAL '30 days'
          UNION ALL
          SELECT created_at FROM votes WHERE created_at >= NOW() - INTERVAL '30 days'
          UNION ALL
          SELECT created_at FROM comments WHERE created_at >= NOW() - INTERVAL '30 days'
        ) activities
        GROUP BY EXTRACT(HOUR FROM created_at)
        ORDER BY hour
      `);

      const dailyActivity = await db.execute(sql`
        SELECT 
          TO_CHAR(created_at, 'Day') as day,
          COUNT(*) as activity
        FROM (
          SELECT created_at FROM polls WHERE created_at >= NOW() - INTERVAL '30 days'
          UNION ALL
          SELECT created_at FROM votes WHERE created_at >= NOW() - INTERVAL '30 days'
          UNION ALL
          SELECT created_at FROM comments WHERE created_at >= NOW() - INTERVAL '30 days'
        ) activities
        GROUP BY TO_CHAR(created_at, 'Day'), EXTRACT(DOW FROM created_at)
        ORDER BY EXTRACT(DOW FROM created_at)
      `);

      return {
        hourlyActivity: hourlyActivity.rows.map((row: any) => ({
          hour: parseInt(row.hour),
          activity: parseInt(row.activity)
        })),
        dailyActivity: dailyActivity.rows.map((row: any) => ({
          day: row.day.trim(),
          activity: parseInt(row.activity)
        }))
      };
    } catch (error) {
      console.error("Error fetching usage patterns:", error);
      throw error;
    }
  }

  async checkDuplicateAccounts(deviceFingerprint: string, ip: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(
        and(
          eq(users.deviceFingerprint, deviceFingerprint),
          eq(users.registrationIp, ip)
        )
      );
    return result.count;
  }

  async createAccountActivity(activity: InsertAccountActivity): Promise<void> {
    await db
      .insert(accountActivity)
      .values(activity);
  }

  async updateUserLoginInfo(userId: number, data: { lastLoginIp: string }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ lastLoginIp: data.lastLoginIp })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getUserAccountActivity(userId: number): Promise<SelectAccountActivity[]> {
    const activities = await db
      .select()
      .from(accountActivity)
      .where(eq(accountActivity.userId, userId))
      .orderBy(desc(accountActivity.timestamp));

    return activities;
  }

  async getAllUsersWithAccountInfo(filters?: { status?: string, search?: string }): Promise<User[]> {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(users.accountStatus, filters.status));
    }

    if (filters?.search) {
      conditions.push(
        or(
          sql`LOWER(${users.username}) LIKE LOWER(${`%${filters.search}%`})`,
          sql`LOWER(${users.email}) LIKE LOWER(${`%${filters.search}%`})`,
          sql`LOWER(${users.name}) LIKE LOWER(${`%${filters.search}%`})`
        )
      );
    }

    const query = conditions.length > 0
      ? db.select().from(users).where(and(...conditions))
      : db.select().from(users);

    return await query;
  }

  async updateAccountStatus(userId: number, status: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ accountStatus: status })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  // ─── Demopolis: Community methods ──────────────────────────────────────────

  async createCommunity(insertCommunity: InsertCommunity): Promise<Community> {
    const [community] = await db
      .insert(communities)
      .values(insertCommunity)
      .returning();
    return community;
  }

  async getCommunity(id: number): Promise<Community | undefined> {
    const [community] = await db.select().from(communities).where(eq(communities.id, id));
    return community;
  }

  async getCommunities(userId?: number): Promise<Community[]> {
    if (userId) {
      // Get communities the user is a member of
      const memberships = await db
        .select({ communityId: communityMembers.communityId })
        .from(communityMembers)
        .where(eq(communityMembers.userId, userId));
      
      if (memberships.length === 0) return [];
      
      return await db
        .select()
        .from(communities)
        .where(inArray(communities.id, memberships.map(m => m.communityId)));
    }
    return await db.select().from(communities);
  }

  async updateCommunity(id: number, updates: Partial<Community>): Promise<Community> {
    const [community] = await db
      .update(communities)
      .set(updates)
      .where(eq(communities.id, id))
      .returning();
    if (!community) throw new Error("Community not found");
    return community;
  }

  async deleteCommunity(id: number): Promise<boolean> {
    const result = await db.delete(communities).where(eq(communities.id, id));
    return true;
  }

  async getCommunityMembers(communityId: number): Promise<CommunityMember[]> {
    return await db
      .select()
      .from(communityMembers)
      .where(eq(communityMembers.communityId, communityId));
  }

  async addCommunityMember(communityId: number, userId: number, role?: string): Promise<CommunityMember> {
    const [member] = await db
      .insert(communityMembers)
      .values({ communityId, userId, role: role || 'member' })
      .returning();
    return member;
  }

  async removeCommunityMember(communityId: number, userId: number): Promise<boolean> {
    await db
      .delete(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
    return true;
  }

  async updateMemberRole(communityId: number, userId: number, role: string): Promise<CommunityMember> {
    const [member] = await db
      .update(communityMembers)
      .set({ role })
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)))
      .returning();
    if (!member) throw new Error("Community member not found");
    return member;
  }

  async isCommunityMember(communityId: number, userId: number): Promise<boolean> {
    const [member] = await db
      .select()
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
    return !!member;
  }

  async getCommunityMemberRole(communityId: number, userId: number): Promise<string | undefined> {
    const [member] = await db
      .select()
      .from(communityMembers)
      .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));
    return member?.role;
  }

  // ─── Demopolis: Proposal methods ───────────────────────────────────────────

  async createProposal(insertProposal: InsertProposal): Promise<Proposal> {
    const [proposal] = await db
      .insert(proposals)
      .values(insertProposal)
      .returning();
    return proposal;
  }

  async getProposal(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal;
  }

  async getProposals(communityId: number, filters?: { status?: string; category?: string }): Promise<Proposal[]> {
    const conditions = [eq(proposals.communityId, communityId)];
    if (filters?.status) conditions.push(eq(proposals.status, filters.status));
    if (filters?.category) conditions.push(eq(proposals.category, filters.category));
    
    return await db
      .select()
      .from(proposals)
      .where(and(...conditions))
      .orderBy(desc(proposals.createdAt));
  }

  async updateProposal(id: number, updates: Partial<Proposal>): Promise<Proposal> {
    const [proposal] = await db
      .update(proposals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposals.id, id))
      .returning();
    if (!proposal) throw new Error("Proposal not found");
    return proposal;
  }

  async transitionProposalState(id: number, newState: string): Promise<Proposal> {
    return this.updateProposal(id, { status: newState });
  }

  // ─── Demopolis: Amendment methods ──────────────────────────────────────────

  async createAmendment(insertAmendment: InsertProposalAmendment): Promise<ProposalAmendment> {
    const [amendment] = await db
      .insert(proposalAmendments)
      .values(insertAmendment)
      .returning();
    return amendment;
  }

  async getAmendment(id: number): Promise<ProposalAmendment | undefined> {
    const [amendment] = await db.select().from(proposalAmendments).where(eq(proposalAmendments.id, id));
    return amendment;
  }

  async getAmendments(proposalId: number): Promise<ProposalAmendment[]> {
    return await db
      .select()
      .from(proposalAmendments)
      .where(eq(proposalAmendments.proposalId, proposalId));
  }

  async updateAmendment(id: number, updates: Partial<ProposalAmendment>): Promise<ProposalAmendment> {
    const [amendment] = await db
      .update(proposalAmendments)
      .set(updates)
      .where(eq(proposalAmendments.id, id))
      .returning();
    if (!amendment) throw new Error("Amendment not found");
    return amendment;
  }

  async countAmendmentsForProposal(proposalId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(proposalAmendments)
      .where(eq(proposalAmendments.proposalId, proposalId));
    return result[0]?.count ?? 0;
  }

  // ─── Demopolis: Sortition methods ──────────────────────────────────────────

  async createSortitionBody(insertBody: InsertSortitionBody): Promise<SortitionBody> {
    const [body] = await db
      .insert(sortitionBodies)
      .values(insertBody)
      .returning();
    return body;
  }

  async getSortitionBody(id: number): Promise<SortitionBody | undefined> {
    const [body] = await db.select().from(sortitionBodies).where(eq(sortitionBodies.id, id));
    return body;
  }

  async getSortitionMembers(bodyId: number): Promise<SortitionMember[]> {
    return await db
      .select()
      .from(sortitionMembers)
      .where(eq(sortitionMembers.bodyId, bodyId));
  }

  async addSortitionMember(bodyId: number, userId: number): Promise<SortitionMember> {
    const [member] = await db
      .insert(sortitionMembers)
      .values({ bodyId, userId })
      .returning();
    return member;
  }

  async removeSortitionMember(bodyId: number, userId: number): Promise<boolean> {
    await db
      .delete(sortitionMembers)
      .where(and(eq(sortitionMembers.bodyId, bodyId), eq(sortitionMembers.userId, userId)));
    return true;
  }

  async updateSortitionMember(bodyId: number, userId: number, updates: Partial<SortitionMember>): Promise<SortitionMember> {
    const [member] = await db
      .update(sortitionMembers)
      .set(updates)
      .where(and(eq(sortitionMembers.bodyId, bodyId), eq(sortitionMembers.userId, userId)))
      .returning();
    if (!member) throw new Error("Sortition member not found");
    return member;
  }

  async completeSortitionBody(id: number): Promise<SortitionBody> {
    const [body] = await db
      .update(sortitionBodies)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(sortitionBodies.id, id))
      .returning();
    if (!body) throw new Error("Sortition body not found");
    return body;
  }

  // ─── Demopolis: Debate methods ─────────────────────────────────────────────

  async createDebateArgument(insertArgument: InsertDebateArgument): Promise<DebateArgument> {
    const [argument] = await db
      .insert(debateArguments)
      .values(insertArgument)
      .returning();
    return argument;
  }

  async getDebateArguments(proposalId: number): Promise<DebateArgument[]> {
    return await db
      .select()
      .from(debateArguments)
      .where(eq(debateArguments.proposalId, proposalId));
  }

  async supportDebateArgument(argumentId: number, userId: number): Promise<DebateArgument> {
    const [argument] = await db
      .update(debateArguments)
      .set({ supportCount: sql`${debateArguments.supportCount} + 1` })
      .where(eq(debateArguments.id, argumentId))
      .returning();
    if (!argument) throw new Error("Debate argument not found");
    return argument;
  }

  async opposeDebateArgument(argumentId: number, userId: number): Promise<DebateArgument> {
    const [argument] = await db
      .update(debateArguments)
      .set({ oppositionCount: sql`${debateArguments.oppositionCount} + 1` })
      .where(eq(debateArguments.id, argumentId))
      .returning();
    if (!argument) throw new Error("Debate argument not found");
    return argument;
  }

  // ─── Demopolis: Proposal Support methods ───────────────────────────────────

  async createProposalSupport(proposalId: number, userId: number, type: string): Promise<ProposalSupport> {
    const [support] = await db
      .insert(proposalSupport)
      .values({ proposalId, userId, type })
      .returning();
    return support;
  }

  async removeProposalSupport(proposalId: number, userId: number, type: string): Promise<boolean> {
    await db
      .delete(proposalSupport)
      .where(and(
        eq(proposalSupport.proposalId, proposalId),
        eq(proposalSupport.userId, userId),
        eq(proposalSupport.type, type)
      ));
    return true;
  }

  async getAllProposals(limit?: number): Promise<Proposal[]> {
    const query = db.select().from(proposals).orderBy(desc(proposals.createdAt));
    if (limit) return await query.limit(limit);
    return await query;
  }

  async getProposalSupport(proposalId: number, userId?: number): Promise<{ support: number; oppose: number; userVote?: string | null }> {
    const supports = await db
      .select()
      .from(proposalSupport)
      .where(eq(proposalSupport.proposalId, proposalId));

    const result: { support: number; oppose: number; userVote?: string | null } = {
      support: supports.filter(s => s.type === 'support').length,
      oppose: supports.filter(s => s.type === 'oppose').length,
    };

    if (userId) {
      const userVote = supports.find(s => s.userId === userId);
      result.userVote = userVote?.type ?? null;
    }

    return result;
  }

  // ─── Demopolis: Proposal Final Vote methods ──────────────────────────────

  async castProposalVote(
    proposalId: number,
    userId: number,
    choice: ProposalVoteChoice,
  ): Promise<ProposalVote> {
    const [vote] = await db
      .insert(proposalVotes)
      .values({ proposalId, userId, choice })
      .onConflictDoUpdate({
        target: [proposalVotes.proposalId, proposalVotes.userId],
        set: { choice, castAt: sql`now()` },
      })
      .returning();
    return vote;
  }

  async getUserProposalVote(proposalId: number, userId: number): Promise<ProposalVote | undefined> {
    const [vote] = await db
      .select()
      .from(proposalVotes)
      .where(and(eq(proposalVotes.proposalId, proposalId), eq(proposalVotes.userId, userId)))
      .limit(1);
    return vote;
  }

  async getProposalVoteResults(proposalId: number): Promise<ProposalVoteResults> {
    const proposal = await this.getProposal(proposalId);
    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    const votes = await db
      .select()
      .from(proposalVotes)
      .where(eq(proposalVotes.proposalId, proposalId));

    const yes = votes.filter(v => v.choice === 'yes').length;
    const no = votes.filter(v => v.choice === 'no').length;
    const abstain = votes.filter(v => v.choice === 'abstain').length;
    const total = yes + no + abstain;

    const [{ memberCount }] = await db
      .select({ memberCount: count() })
      .from(communityMembers)
      .where(eq(communityMembers.communityId, proposal.communityId));

    const community = await this.getCommunity(proposal.communityId);
    const minParticipationPct = parseFloat(community?.minParticipationPct ?? '0') || 0;
    const participationPct = memberCount > 0 ? total / memberCount : 0;
    const meetsQuorum = participationPct >= minParticipationPct;
    const passes = meetsQuorum && yes > no;

    return {
      yes,
      no,
      abstain,
      total,
      participants: total,
      participationPct,
      passes,
      meetsQuorum,
      minParticipationPct,
    };
  }
}

export const storage = new DatabaseStorage();
