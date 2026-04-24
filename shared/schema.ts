import { pgTable, text, serial, integer, boolean, timestamp, primaryKey, jsonb, uniqueIndex, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"), // Made optional for social logins
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  providerId: text("provider_id"), // ID from the provider (Google, etc.)
  provider: text("provider"), // 'google', 'facebook', 'twitter'
  profilePicture: text("profile_picture"), // URL to profile picture

  // Geographic coordinates (only keeping GPS-based location)
  latitude: text("latitude"),
  longitude: text("longitude"),

  // Flag for confirmed location
  locationConfirmed: boolean("location_confirmed").default(false),

  // Flag for verified location (when manually entered)
  locationVerified: boolean("location_verified").default(false),

  // Admin role
  isAdmin: boolean("is_admin").notNull().default(false),

  // Device fingerprinting and IP tracking
  deviceFingerprint: text("device_fingerprint"),
  registrationIp: text("registration_ip"),
  lastLoginIp: text("last_login_ip"),
  accountFlags: jsonb("account_flags"),
  accountStatus: text("account_status").default("active"),

  // Gov.gr Identity Verification
  govgrVerified: boolean("govgr_verified").default(false),
  govgrVerifiedAt: timestamp("govgr_verified_at"),
  govgrVoterHash: text("govgr_voter_hash"), // SHA256(AFM + SALT)
});

export const polls = pgTable("polls", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  allowExtension: boolean("allow_extension").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  visibility: text("visibility").notNull().default("public"),
  showResults: boolean("show_results").notNull().default(false),
  allowComments: boolean("allow_comments").notNull().default(true),
  requireVerification: boolean("require_verification").notNull().default(false),
  pollType: text("poll_type").notNull().default("singleChoice"),
  locationScope: text("location_scope").notNull().default("global"), // "global" or "geofenced"
  communityMode: boolean("community_mode").notNull().default(false), // Indicates if creator name is hidden with "community"

  // Geofencing coordinates
  centerLat: text("center_lat"), // Decimal latitude for geofencing
  centerLng: text("center_lng"), // Decimal longitude for geofencing
  radiusKm: integer("radius_km"), // Radius in kilometers for geofencing

  // Location filter data (extracted during reverse geocoding)
  city: text("city"), // City/municipality name for legacy compatibility
  region: text("region"), // Region/state name for legacy compatibility  
  country: text("country"), // Country name for legacy compatibility

  // Standardized location IDs
  locationCity: text("location_city"), // City/municipality name for filtering
  locationRegion: text("location_region"), // Region/state name for filtering
  locationCountry: text("location_country"), // Country name for filtering

  // Standardized location IDs
  locationCityId: text("location_city_id"), // City/municipality ID for hierarchical location
  locationRegionId: text("location_region_id"), // Region/state ID for hierarchical location
  locationCountryId: text("location_country_id"), // Country ID for hierarchical location

  // Standardized geographic region (for more robust filtering)
  geoRegion: text("geo_region"), // Normalized geographic region name derived from coordinates

  // Community visibility
  communityId: integer("community_id").references(() => communities.id, { onDelete: "set null" }), // If set, poll is only visible to community members
});

export const pollOptions = pgTable("poll_options", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id),
  text: text("text").notNull(),
  order: integer("order").notNull(),
});

export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id),
  userId: integer("user_id").notNull().references(() => users.id),
  optionId: integer("option_id").notNull().references(() => pollOptions.id),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id),
  userId: integer("user_id").notNull().references(() => users.id),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Poll notifications for community members
export const pollNotifications = pgTable("poll_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  pollId: integer("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  pollNotificationUnique: uniqueIndex('poll_notification_unique').on(table.userId, table.pollId),
}));

// Account activity tracking
export const accountActivity = pgTable("account_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  deviceFingerprint: text("device_fingerprint"),
  ipAddress: text("ip_address"),
  action: text("action").notNull(),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Gov.gr Ballot Votes (for verified voting via Solemn Declaration)
export const ballotVotes = pgTable("ballot_votes", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id, { onDelete: "cascade" }),
  voterHash: text("voter_hash").notNull(), // SHA256(AFM + SALT) - never store raw AFM
  fileHash: text("file_hash").notNull().unique(), // SHA256 of PDF - prevents duplicate uploads
  voteChoice: text("vote_choice").notNull(),
  signerName: text("signer_name"), // Certificate signer for audit trail
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  pollVoterUnique: uniqueIndex('ballot_poll_voter_unique').on(table.pollId, table.voterHash),
}));

// Survey Poll Tables (Δημοσκοπική Ψηφοφορία)
export const pollQuestions = pgTable("poll_questions", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id),
  text: text("text").notNull(),
  questionType: text("question_type").notNull(), // "singleChoice", "multipleChoice", "ordering"
  order: integer("order").notNull(),
  parentId: integer("parent_id"), // Self-reference for nested questions
  parentAnswerId: integer("parent_answer_id"), // Which answer triggers this question
  required: boolean("required").notNull().default(true),
});

export const pollAnswers = pgTable("poll_answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => pollQuestions.id),
  text: text("text").notNull(),
  order: integer("order").notNull(),
});

export const pollUserResponses = pgTable("poll_user_responses", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => polls.id),
  questionId: integer("question_id").notNull().references(() => pollQuestions.id),
  userId: integer("user_id").notNull().references(() => users.id),
  answerId: integer("answer_id").references(() => pollAnswers.id), // can be null for ordering type
  answerValue: jsonb("answer_value"), // For ordering or multiple choice responses
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Groups (Ομάδες) ─────────────────────────────────────────────────────────

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => ({
  groupMemberUnique: uniqueIndex("group_member_unique").on(table.groupId, table.userId),
}));

// ─── Demopolis: Communities (Κοινότητες) ─────────────────────────────────────

export const communities = pgTable("communities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("autonomous"), // 'autonomous' | 'managed'
  governanceModel: text("governance_model").default("no_admin"), // 'no_admin' | 'admin_team' | 'hybrid'
  creatorId: integer("creator_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),

  // Deliberation parameters (per-community config)
  maxConcurrentVotes: integer("max_concurrent_votes").default(-1), // -1 = unlimited
  minParticipationPct: numeric("min_participation_pct").default("0"),
  sortitionSize: integer("sortition_size").default(20),
  sortitionMode: text("sortition_mode").default("absolute"), // 'absolute' | 'percentage'
  sortitionResponseHours: integer("sortition_response_hours").default(72),

  // Amendment parameters (per-community config)
  amendmentThreshold: numeric("amendment_threshold").default("0.5"), // upvote ratio to flag rejected amendments
  maxAmendmentsPerProposal: integer("max_amendments_per_proposal").default(-1), // -1 = unlimited

  // Verification settings
  requireGovgrVerification: boolean("require_govgr_verification").default(false),

  // Democracy score (computed, shows how democratic the community governance is)
  democracyScore: numeric("democracy_score"),
});

export const communityMembers = pgTable("community_members", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull().references(() => communities.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("member"), // 'member' | 'admin' | 'founder'
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => ({
  communityMemberUnique: uniqueIndex('community_member_unique').on(table.communityId, table.userId),
}));

// ─── Demopolis: Proposals (Προβουλεύματα) ────────────────────────────────────

export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull().references(() => communities.id),
  authorId: integer("author_id").notNull().references(() => users.id),

  // Core content (Προβούλευμα = question + solution)
  question: text("question").notNull(),       // Το Ερώτημα
  solution: text("solution").notNull(),       // Η Απάντηση/Λύση
  finalText: text("final_text"),              // Τελικό κείμενο από κληρωτό σώμα (null until synthesis)

  // State machine
  status: text("status").notNull().default("submitted"),
  // 'submitted' → 'validating' → 'valid' | 'returned' | 'rejected'
  //   → 'scoring' → 'under_review' → 'amendments' → 'debate' → 'voting' → 'resolved'

  // LLM validation
  llmScore: numeric("llm_score"),              // 0-100 score from LLM validation
  llmFeedback: text("llm_feedback"),            // Explanation for low scores
  llmValidatedAt: timestamp("llm_validated_at"),
  llmValidationRound: integer("llm_validation_round").default(1), // for appeals

  // Sortition scoring
  sortitionAvgScore: numeric("sortition_avg_score"), // weighted avg from sortition body
  sortitionRank: integer("sortition_rank"),       // rank among proposals in same cycle

  // Metadata
  category: text("category"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Demopolis: Amendments (Αντιπροτάσεις & Βελτιώσεις) ──────────────────────

export const proposalAmendments = pgTable("proposal_amendments", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => users.id),

  type: text("type").notNull(), // 'improvement' (βελτίωση) | 'counter_proposal' (αντιπρόταση)

  // Content
  text: text("text").notNull(),

  // Author review (Κρίση συγγραφέα)
  authorDecision: text("author_decision"), // 'accepted' | 'rejected' | null (not yet reviewed)
  authorReason: text("author_reason"),     // Author's justification for rejection

  // Community signal (Κρίση κοινότητας — votes on rejected amendments)
  rejectionUpvotes: integer("rejection_upvotes").default(0),  // ⬆️ disagree with rejection
  rejectionDownvotes: integer("rejection_downvotes").default(0), // ⬇️ agree with rejection

  // Status (legacy field, kept for backward compatibility)
  status: text("status").default("pending"), // 'pending' | 'accepted' | 'rejected' | 'under_review'
  authorVeto: boolean("author_veto").default(false), // original author vetoed this amendment

  // LLM validation
  llmScore: numeric("llm_score"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Demopolis: Amendment Rejection Votes (Κρίση κοινότητας) ─────────────────

export const amendmentRejectionVotes = pgTable("amendment_rejection_votes", {
  id: serial("id").primaryKey(),
  amendmentId: integer("amendment_id").notNull().references(() => proposalAmendments.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  vote: integer("vote").notNull(), // +1 (disagree with rejection) or -1 (agree with rejection)
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  amendmentVoteUnique: uniqueIndex('amendment_vote_unique').on(table.amendmentId, table.userId),
}));

// ─── Demopolis: Sortition Bodies (Κληρωτά Σώματα) ────────────────────────────

export const sortitionBodies = pgTable("sortition_bodies", {
  id: serial("id").primaryKey(),
  communityId: integer("community_id").notNull().references(() => communities.id),
  purpose: text("purpose").notNull(), // 'validity_check' | 'scoring' | 'conflict_resolution' | 'vote_promotion'
  proposalId: integer("proposal_id").references(() => proposals.id), // NULL if not tied to specific proposal

  size: integer("size").notNull(),           // target number of members
  responseHours: integer("response_hours").default(72),

  status: text("status").default("selecting"), // 'selecting' | 'active' | 'completed' | 'timeout'

  selectedAt: timestamp("selected_at"),
  completedAt: timestamp("completed_at"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sortitionMembers = pgTable("sortition_members", {
  id: serial("id").primaryKey(),
  bodyId: integer("body_id").notNull().references(() => sortitionBodies.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  responded: boolean("responded").default(false),
  score: numeric("score"),                    // individual score (0-10 or 0-100)
  scoredAt: timestamp("scored_at"),
}, (table) => ({
  sortitionMemberUnique: uniqueIndex('sortition_member_unique').on(table.bodyId, table.userId),
}));

// ─── Demopolis: Debate Arguments (Διάλογος) ──────────────────────────────────

export const debateArguments = pgTable("debate_arguments", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  authorId: integer("author_id").notNull().references(() => users.id),

  side: text("side").notNull(),   // 'for' | 'against'
  text: text("text").notNull(),

  // Support mechanism (likes/dislikes from consultation.md)
  supportCount: integer("support_count").default(0),
  oppositionCount: integer("opposition_count").default(0),

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Demopolis: Proposal Support (Συγκέντρωση Υποστήριξης) ───────────────────

export const proposalSupport = pgTable("proposal_support", {
  id: serial("id").primaryKey(),
  proposalId: integer("proposal_id").notNull().references(() => proposals.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // 'support' | 'oppose'
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  proposalSupportUnique: uniqueIndex('proposal_support_unique').on(table.proposalId, table.userId, table.type),
}));

// ─── Admin Action Log ───────────────────────────────────────────────────────

export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  communityId: integer("community_id").references(() => communities.id),
  actionType: text("action_type").notNull(), // 'delete_comment' | 'ban_user' | 'override_sortition_timeout' | 'manage_membership' | 'moderate_proposal'
  targetId: integer("target_id"),
  details: jsonb("details"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// ─── Job Queue ──────────────────────────────────────────────────────────────

export const jobs = pgTable("jobs", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'structure_proposal' | 'send_notification' | 'create_sortition' | 'recalculate_score' | 'cleanup_expired'
  payload: jsonb("payload").notNull(),
  status: text("status").notNull().default("pending"), // 'pending' | 'processing' | 'completed' | 'failed'
  priority: text("priority").notNull().default("normal"), // 'low' | 'normal' | 'high'
  result: jsonb("result"),
  error: text("error"),
  retryCount: integer("retry_count").notNull().default(0),
  maxRetries: integer("max_retries").notNull().default(3),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  polls: many(polls),
  votes: many(votes),
  comments: many(comments),
  accountActivity: many(accountActivity),
  communityMemberships: many(communityMembers),
  proposals: many(proposals),
  proposalAmendments: many(proposalAmendments),
  debateArguments: many(debateArguments),
  proposalSupport: many(proposalSupport),
  sortitionMemberships: many(sortitionMembers),
  adminActions: many(adminActions),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
  creator: one(users, {
    fields: [polls.creatorId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [polls.communityId],
    references: [communities.id],
  }),
  options: many(pollOptions),
  votes: many(votes),
  comments: many(comments),
  notifications: many(pollNotifications),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  poll: one(polls, {
    fields: [votes.pollId],
    references: [polls.id],
  }),
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  option: one(pollOptions, {
    fields: [votes.optionId],
    references: [pollOptions.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  poll: one(polls, {
    fields: [comments.pollId],
    references: [polls.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const pollNotificationsRelations = relations(pollNotifications, ({ one }) => ({
  user: one(users, {
    fields: [pollNotifications.userId],
    references: [users.id],
  }),
  poll: one(polls, {
    fields: [pollNotifications.pollId],
    references: [polls.id],
  }),
}));

export const accountActivityRelations = relations(accountActivity, ({ one }) => ({
  user: one(users, {
    fields: [accountActivity.userId],
    references: [users.id],
  }),
}));

export const ballotVotesRelations = relations(ballotVotes, ({ one }) => ({
  poll: one(polls, {
    fields: [ballotVotes.pollId],
    references: [polls.id],
  }),
}));

export const pollQuestionsRelations = relations(pollQuestions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollQuestions.pollId],
    references: [polls.id],
  }),
  parentQuestion: one(pollQuestions, {
    fields: [pollQuestions.parentId],
    references: [pollQuestions.id],
  }),
  parentAnswer: one(pollAnswers, {
    fields: [pollQuestions.parentAnswerId],
    references: [pollAnswers.id],
  }),
  answers: many(pollAnswers),
  responses: many(pollUserResponses),
  childQuestions: many(pollQuestions, { relationName: "childToParent" }),
}));

export const pollAnswersRelations = relations(pollAnswers, ({ one, many }) => ({
  question: one(pollQuestions, {
    fields: [pollAnswers.questionId],
    references: [pollQuestions.id],
  }),
  responses: many(pollUserResponses),
  childQuestions: many(pollQuestions, { relationName: "answerToQuestion" }),
}));

export const pollUserResponsesRelations = relations(pollUserResponses, ({ one }) => ({
  poll: one(polls, {
    fields: [pollUserResponses.pollId],
    references: [polls.id],
  }),
  question: one(pollQuestions, {
    fields: [pollUserResponses.questionId],
    references: [pollQuestions.id],
  }),
  user: one(users, {
    fields: [pollUserResponses.userId],
    references: [users.id],
  }),
  answer: one(pollAnswers, {
    fields: [pollUserResponses.answerId],
    references: [pollAnswers.id],
  }),
}));

// ─── Demopolis Relations ─────────────────────────────────────────────────────

export const communitiesRelations = relations(communities, ({ one, many }) => ({
  creator: one(users, {
    fields: [communities.creatorId],
    references: [users.id],
  }),
  members: many(communityMembers),
  proposals: many(proposals),
  sortitionBodies: many(sortitionBodies),
  adminActions: many(adminActions),
}));

export const communityMembersRelations = relations(communityMembers, ({ one }) => ({
  community: one(communities, {
    fields: [communityMembers.communityId],
    references: [communities.id],
  }),
  user: one(users, {
    fields: [communityMembers.userId],
    references: [users.id],
  }),
}));

export const proposalsRelations = relations(proposals, ({ one, many }) => ({
  community: one(communities, {
    fields: [proposals.communityId],
    references: [communities.id],
  }),
  author: one(users, {
    fields: [proposals.authorId],
    references: [users.id],
  }),
  amendments: many(proposalAmendments),
  debateArguments: many(debateArguments),
  support: many(proposalSupport),
  sortitionBodies: many(sortitionBodies),
}));

export const proposalAmendmentsRelations = relations(proposalAmendments, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalAmendments.proposalId],
    references: [proposals.id],
  }),
  author: one(users, {
    fields: [proposalAmendments.authorId],
    references: [users.id],
  }),
}));

export const sortitionBodiesRelations = relations(sortitionBodies, ({ one, many }) => ({
  community: one(communities, {
    fields: [sortitionBodies.communityId],
    references: [communities.id],
  }),
  proposal: one(proposals, {
    fields: [sortitionBodies.proposalId],
    references: [proposals.id],
  }),
  members: many(sortitionMembers),
}));

export const sortitionMembersRelations = relations(sortitionMembers, ({ one }) => ({
  body: one(sortitionBodies, {
    fields: [sortitionMembers.bodyId],
    references: [sortitionBodies.id],
  }),
  user: one(users, {
    fields: [sortitionMembers.userId],
    references: [users.id],
  }),
}));

export const debateArgumentsRelations = relations(debateArguments, ({ one }) => ({
  proposal: one(proposals, {
    fields: [debateArguments.proposalId],
    references: [proposals.id],
  }),
  author: one(users, {
    fields: [debateArguments.authorId],
    references: [users.id],
  }),
}));

export const proposalSupportRelations = relations(proposalSupport, ({ one }) => ({
  proposal: one(proposals, {
    fields: [proposalSupport.proposalId],
    references: [proposals.id],
  }),
  user: one(users, {
    fields: [proposalSupport.userId],
    references: [users.id],
  }),
}));

export const adminActionsRelations = relations(adminActions, ({ one }) => ({
  user: one(users, {
    fields: [adminActions.userId],
    references: [users.id],
  }),
  community: one(communities, {
    fields: [adminActions.communityId],
    references: [communities.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPollNotificationSchema = createInsertSchema(pollNotifications).omit({ id: true, createdAt: true });
export const insertAccountActivitySchema = createInsertSchema(accountActivity).omit({ id: true, timestamp: true });
export const insertPollSchema = createInsertSchema(polls)
  .omit({ id: true, createdAt: true })
  .extend({
    // We store dates as strings in the form and transform them to Date when submitting
    startDate: z.union([
      z.string().transform(str => {
        const date = new Date(str);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid start date format');
        }
        return date;
      }),
      z.date()
    ]),
    endDate: z.union([
      z.string().transform(str => {
        const date = new Date(str);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid end date format');
        }
        return date;
      }),
      z.date()
    ]),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  });
export const insertPollOptionSchema = createInsertSchema(pollOptions).omit({ id: true });
export const insertVoteSchema = createInsertSchema(votes).omit({ id: true, createdAt: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, createdAt: true });

// Extended vote schema for ranking polls with JSON answerValue
export const rankingVoteSchema = z.object({
  pollId: z.number(),
  userId: z.number(),
  orderedOptionIds: z.array(z.number()),
  optionId: z.number().optional(), // Still needed for database compatibility
  comment: z.string().optional(),
});

// Survey Poll Insert Schemas
export const insertPollQuestionSchema = createInsertSchema(pollQuestions).omit({ id: true });
export const insertPollAnswerSchema = createInsertSchema(pollAnswers).omit({ id: true });
export const insertPollUserResponseSchema = createInsertSchema(pollUserResponses).omit({ id: true, createdAt: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true, createdAt: true });
export const insertGroupMemberSchema = createInsertSchema(groupMembers).omit({ id: true, joinedAt: true });

// Demopolis Insert Schemas
export const insertCommunitySchema = createInsertSchema(communities).omit({ id: true, createdAt: true });
export const insertCommunityMemberSchema = createInsertSchema(communityMembers).omit({ id: true, joinedAt: true });
export const insertProposalSchema = createInsertSchema(proposals).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProposalAmendmentSchema = createInsertSchema(proposalAmendments).omit({ id: true, createdAt: true });
export const insertSortitionBodySchema = createInsertSchema(sortitionBodies).omit({ id: true, createdAt: true });
export const insertSortitionMemberSchema = createInsertSchema(sortitionMembers).omit({ id: true });
export const insertDebateArgumentSchema = createInsertSchema(debateArguments).omit({ id: true, createdAt: true });
export const insertProposalSupportSchema = createInsertSchema(proposalSupport).omit({ id: true, createdAt: true });
export const insertAdminActionSchema = createInsertSchema(adminActions).omit({ id: true, timestamp: true });

// Poll with options schema for creation
export const createPollSchema = z.object({
  poll: insertPollSchema.extend({
    // Make these optional so they can be removed after processing
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    // Only global or geofenced location scopes are now supported
    locationScope: z.enum(["global", "geofenced"]).default("global"),
    // Geofencing fields
    centerLat: z.string().optional(),
    centerLng: z.string().optional(),
    radiusKm: z.number().optional()
  }).superRefine((data, ctx) => {
    // Validate geofencing fields when locationScope is "geofenced"
    if (data.locationScope === "geofenced") {
      if (!data.centerLat) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Latitude is required for geofenced polls",
          path: ["centerLat"]
        });
      } else if (isNaN(parseFloat(data.centerLat))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Latitude must be a valid number",
          path: ["centerLat"]
        });
      }

      if (!data.centerLng) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Longitude is required for geofenced polls",
          path: ["centerLng"]
        });
      } else if (isNaN(parseFloat(data.centerLng))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Longitude must be a valid number",
          path: ["centerLng"]
        });
      }

      if (data.radiusKm === undefined || data.radiusKm === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Radius is required for geofenced polls",
          path: ["radiusKm"]
        });
      } else if (data.radiusKm <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Radius must be greater than 0",
          path: ["radiusKm"]
        });
      } else if (data.radiusKm > 1000) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Radius cannot exceed 1000 km",
          path: ["radiusKm"]
        });
      }
    }
  }),
  options: z.array(z.object({
    text: z.string().min(1),
    order: z.number(),
  })),
  // Allow for holding these values outside the poll object during form processing
  startTime: z.string().optional(),
  endTime: z.string().optional()
});

// Survey poll schema for creation
export const createSurveyPollSchema = z.object({
  poll: insertPollSchema.extend({
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    pollType: z.literal("surveyPoll"),
    // Only global or geofenced location scopes are now supported - matching createPollSchema
    locationScope: z.enum(["global", "geofenced"]).default("global"),
    // Geofencing fields from createPollSchema are reused
  }),
  questions: z.array(z.object({
    id: z.number().optional(), // Frontend temp ID for mapping
    text: z.string().min(1, { message: "Το κείμενο της ερώτησης είναι υποχρεωτικό" }),
    questionType: z.enum(["singleChoice", "multipleChoice", "ordering"], {
      errorMap: () => ({ message: "Ο τύπος της ερώτησης είναι υποχρεωτικός" })
    }),
    required: z.boolean().default(true),
    order: z.number(),
    parentId: z.number().optional(),
    parentAnswerId: z.number().optional(),
    answers: z.array(z.object({
      id: z.number().optional(), // Frontend temp ID for React keys
      text: z.string().min(1, { message: "Το κείμενο της απάντησης είναι υποχρεωτικό" }),
      order: z.number(),
    })).min(2, { message: "Χρειάζονται τουλάχιστον δύο επιλογές απάντησης" }),
  })).min(1, { message: "Χρειάζεται τουλάχιστον μια ερώτηση" }),
  // Allow for holding these values outside the poll object during form processing
  startTime: z.string().optional(),
  endTime: z.string().optional()
});

// Extended schemas with validations
export const registerUserSchema = insertUserSchema.extend({
  password: z.string().min(8, { message: "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες" }),
  email: z.string().email({ message: "Εισάγετε έγκυρη διεύθυνση email" }),
  name: z.string().min(2, { message: "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες" }),
  returnTo: z.string().optional(), // Add returnTo field for redirection after authentication
  deviceFingerprint: z.string().optional(),
});

export const loginUserSchema = z.object({
  username: z.string().min(1, { message: "Το όνομα χρήστη είναι υποχρεωτικό" }),
  password: z.string().min(1, { message: "Ο κωδικός είναι υποχρεωτικός" }),
  returnTo: z.string().optional(), // Add returnTo field for redirection after authentication
  deviceFingerprint: z.string().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPollNotification = z.infer<typeof insertPollNotificationSchema>;
export type InsertAccountActivity = z.infer<typeof insertAccountActivitySchema>;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type InsertPollOption = z.infer<typeof insertPollOptionSchema>;
export type InsertVote = z.infer<typeof insertVoteSchema>;
export type RankingVote = z.infer<typeof rankingVoteSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type InsertPollQuestion = z.infer<typeof insertPollQuestionSchema>;
export type InsertPollAnswer = z.infer<typeof insertPollAnswerSchema>;
export type InsertPollUserResponse = z.infer<typeof insertPollUserResponseSchema>;
export type CreatePoll = z.infer<typeof createPollSchema>;
export type CreateSurveyPoll = z.infer<typeof createSurveyPollSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type User = typeof users.$inferSelect;
export type PollNotification = typeof pollNotifications.$inferSelect;
export type SelectAccountActivity = typeof accountActivity.$inferSelect;
export type Poll = typeof polls.$inferSelect;
export type PollOption = typeof pollOptions.$inferSelect;
export type Vote = typeof votes.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type PollQuestion = typeof pollQuestions.$inferSelect;
export type PollAnswer = typeof pollAnswers.$inferSelect;
export type PollUserResponse = typeof pollUserResponses.$inferSelect;
export type BallotVote = typeof ballotVotes.$inferSelect;

// Demopolis Types
export type Community = typeof communities.$inferSelect;
export type CommunityMember = typeof communityMembers.$inferSelect;
export type Proposal = typeof proposals.$inferSelect;
export type ProposalAmendment = typeof proposalAmendments.$inferSelect;
export type SortitionBody = typeof sortitionBodies.$inferSelect;
export type SortitionMember = typeof sortitionMembers.$inferSelect;
export type DebateArgument = typeof debateArguments.$inferSelect;
export type ProposalSupport = typeof proposalSupport.$inferSelect;
export type AdminAction = typeof adminActions.$inferSelect;

// Demopolis Insert Types
export type InsertCommunity = z.infer<typeof insertCommunitySchema>;
export type InsertCommunityMember = z.infer<typeof insertCommunityMemberSchema>;
export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type InsertProposalAmendment = z.infer<typeof insertProposalAmendmentSchema>;
export type InsertSortitionBody = z.infer<typeof insertSortitionBodySchema>;
export type InsertSortitionMember = z.infer<typeof insertSortitionMemberSchema>;
export type InsertDebateArgument = z.infer<typeof insertDebateArgumentSchema>;
export type InsertProposalSupport = z.infer<typeof insertProposalSupportSchema>;
export type InsertAdminAction = z.infer<typeof insertAdminActionSchema>;

// Safe user type without sensitive fields (password, providerId, provider, etc.)
export type SafeUser = Pick<User, 'id' | 'username' | 'name' | 'email' | 'profilePicture'>;

// Extended types
export type PollWithOptions = Poll & {
  options: PollOption[];
  creator: User;
  voteCount: number;
  userVoted?: boolean;
  community?: Community;
};

// Survey poll extended types
export type PollQuestionWithAnswers = PollQuestion & {
  answers: PollAnswer[];
  childQuestions?: PollQuestionWithAnswers[];
};

export type PollWithQuestions = Poll & {
  questions: PollQuestionWithAnswers[];
  creator: User;
  voteCount: number;
  userVoted?: boolean;
};

// Demopolis extended types
export type CommunityWithMembers = Community & {
  members: (CommunityMember & { user: SafeUser })[];
  creator: SafeUser;
  memberCount: number;
};

export type ProposalDetail = Proposal & {
  author: SafeUser;
  community: Community;
  amendments: ProposalAmendment[];
  debateArguments: DebateArgument[];
  supportCount: number;
  opposeCount: number;
};

// Interface for ranking poll results
export interface RankingStats {
  totalPoints: number;
  firstPlaceVotes: number;
  averageRank: string;
  rankDistribution: Record<number, number>;
}

// Interface for poll results with optional ranking stats
export interface PollResult {
  pollId: number;
  optionId: number;
  optionText: string;
  voteCount: number;
  percentage: number;
  isRanking?: boolean;
  rankingStats?: RankingStats;
}
