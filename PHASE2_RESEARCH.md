# Phase 2 Research: Backend — Storage & Routes

## Purpose
This document gathers all necessary information for implementing Phase 2 of the AgoraX merge plan: extending the storage interface and API routes to support Demopolis deliberation features (communities, proposals, sortition, amendments, debate).

---

## 1. Current AgoraX Architecture

### Storage Layer Pattern (`server/storage.ts`)
- **Interface**: `IStorage` defines ~42 typed methods
- **Implementation**: `PostgresStorage` class implements `IStorage` using Drizzle ORM
- **Pattern**: Each entity has CRUD methods + specialized queries
- **Naming**: `get<Entity>`, `create<Entity>`, `update<Entity>`, `delete<Entity>`, `get<Entity>By<X>`
- **Types**: All methods use Drizzle-generated types from `shared/schema.ts`
- **Query building**: Uses Drizzle `eq`, `and`, `or`, `desc`, `asc`, `inArray`, `sql` operators
- **DB access**: Direct `db.select()` / `db.insert()` / `db.update()` / `db.delete()` calls

### Route Pattern (`server/routes.ts`)
- **Framework**: Express.js with async route handlers
- **Validation**: Zod schemas imported from `shared/schema.ts`
- **Auth**: `req.session.user` checked for authentication
- **Error handling**: `formatValidationErrors()` helper for Zod errors
- **Response**: JSON responses via `res.json()`, redirects via `res.redirect()`
- **Authorization**: Per-route checks (e.g., `if (req.session.user.id !== poll.userId)`)

### Existing IStorage Methods (Reference)
```
User: getUser, getUserByUsername, getUserByEmail, getUserByProviderId, getUserByVoterHash,
      createUser, updateUserLocation, updateUser, deleteUser
Poll: createPoll, getPolls, getUserPolls, getParticipatedPolls, getPoll, updatePoll, deletePoll
Survey: createSurveyPoll, getSurveyPoll, updateSurveyStructure, updateSurveyMetadata
Vote: createVote, getPollResults, getPollParticipantCount
Comment: createComment, getPollComments
Group: createGroup, getGroup, getUserGroups, addGroupMember, removeGroupMember, deleteGroup
Notification: createPollNotification, getUserNotifications
Analytics: getAnalyticsOverview, getPollPopularityStats, getActivityTrends, getUsagePatterns
Account: createAccountActivity, updateUserLoginInfo, getUserAccountActivity, getAllUsersWithAccountInfo, updateAccountStatus
Survey Response: createSurveyResponse, getSurveyResults
```

---

## 2. Helios Server Reference Patterns

### Project Structure (Django/Python → Translate to Express/TS)
```
helios/                    # Core election app
├── models.py              # Data models (Election, Voter, CastVote, Trustee)
├── views.py               # API handlers (2097 lines)
├── urls.py                # Route definitions
├── tasks.py               # Celery async tasks (vote verification, email)
├── workflows/             # State machine (homomorphic tallying)
├── crypto/                # Cryptographic operations
├── datatypes/             # Custom data types (LDObjectField)
├── forms.py               # Input validation
├── security.py            # Auth decorators (@election_view, @election_admin)
└── utils.py               # Helper functions
```

### Key Patterns to Adapt

#### A. State Machine via Timestamps (Helios)
Helios tracks election lifecycle using nullable timestamp fields rather than an explicit state enum:
```python
# Helios Election model
frozen_at = DateTimeField(null=True)        # Registration closed
voting_started_at = DateTimeField(null=True) # Voting began
voting_ended_at = DateTimeField(null=True)   # Voting ended
tallying_started_at = DateTimeField(null=True)
tallying_finished_at = DateTimeField(null=True)
result_released_at = DateTimeField(null=True)
```

**For AgoraX**: Use an explicit `state` column (VARCHAR) for proposals — cleaner for our multi-stage deliberation pipeline:
```typescript
// Proposed for proposals table
state: 'submitted' | 'validating' | 'valid' | 'returned' | 'rejected' |
       'scoring' | 'under_review' | 'amendments' | 'debate' | 'voting' | 'resolved'
```

#### B. Auth Decorators (Helios) → Middleware (Express)
```python
# Helios pattern
@election_admin(frozen=False)
def one_election_edit(request, election):
    # Only admins can edit, only when not frozen
```

**For AgoraX**: Use per-route auth checks (already the pattern):
```typescript
// Existing AgoraX pattern
if (req.session.user.id !== poll.userId) {
  return res.status(403).json({ error: "Unauthorized" });
}
```

#### C. Async Task Queue (Helios Celery) → Background Processing
```python
# Helios pattern
@shared_task
def cast_vote_verify_and_store(cast_vote_id, status_update_message=None, **kwargs):
    cast_vote = CastVote.objects.get(id=cast_vote_id)
    result = cast_vote.verify_and_store()
    if result:
        signals.vote_cast.send(sender=election, ...)
```

**For AgoraX**: LLM validation will need async processing. Options:
- **Simple**: `setImmediate()` / `Promise.resolve().then()` for fire-and-forget
- **Queue**: BullMQ (Redis-based) for proper job queuing
- **Cron**: Periodic worker that processes pending validations

#### D. Eligibility System (Helios) → Community Membership
```python
# Helios: JSON-based eligibility constraints
eligibility = [{'auth_system': 'google', 'constraint': [{'host': 'university.edu'}]}]
```

**For AgoraX**: Community membership table handles this — `community_members` with roles (member/admin/founder).

---

## 3. Sortition Research

### Real-World Sortition Systems

#### Athenian Democracy (Historical)
- **Kleroteria**: Bronze tablets with citizen names, selected by dice (apostolia)
- **Key principle**: Every eligible citizen had equal probability of selection
- **Term limits**: Could only serve once in lifetime for most positions

#### Modern Citizen Assemblies
- **Irish Abortion Referendum (2016)**: 100 citizens, stratified random sampling (age, gender, region, education)
- **Canadian Climate Assembly (2019)**: 165 citizens, proportional stratification
- **Paris Climate Assembly (2019-2020)**: 150 citizens, sortition with demographic quotas

### Algorithmic Approaches

#### A. Simple Random Sampling
```typescript
function simpleRandomSelect(pool: number[], size: number): number[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, size);
}
```
- **Pros**: Simple, fast, cryptographically fair
- **Cons**: No demographic guarantees, can produce unrepresentative samples

#### B. Stratified Random Sampling
```typescript
interface StratificationGroup {
  field: string;       // e.g., 'age_group', 'region'
  value: string;       // e.g., '25-34', 'Attica'
  target_count: number; // How many to select from this stratum
}
```
- **Pros**: Demographic representativeness
- **Cons**: Requires population data, more complex
- **Best for**: Large communities where representativeness matters

#### C. Activity-Weighted Selection
```typescript
interface UserActivity {
  userId: number;
  score: number; // Weight based on participation history
}

function weightedRandomSelect(pool: UserActivity[], size: number): number[] {
  // Cumulative distribution function sampling
  const total = pool.reduce((sum, u) => sum + u.score, 0);
  // ... weighted selection algorithm
}
```
- **Pros**: Rewards active participants, reduces free-riding
- **Cons**: Can create participation inequality over time
- **Best for**: Communities that want to incentivize engagement

### Implementation Recommendation for AgoraX

**Start with simple random sampling**, add stratification later:

```typescript
// server/utils/sortition.ts
export interface SortitionConfig {
  size: number;                    // Absolute number or percentage
  size_type: 'absolute' | 'percentage';
  purpose: 'validity' | 'scoring' | 'conflict' | 'promotion';
  timeout_hours: number;          // e.g., 72 hours to respond
  replacement_enabled: boolean;   // Auto-replace non-responders
  self_exclusion: boolean;        // Members can opt out
}

export interface SortitionBody {
  id: number;
  community_id: number;
  config: SortitionConfig;
  members: SortitionMember[];
  created_at: Date;
  expires_at: Date;
  completed_at: Date | null;
}
```

### Replacement Member Logic
```typescript
async function handleTimeout(body: SortitionBody): Promise<void> {
  const nonResponders = await getNonResponders(body.id);
  const replacements = await selectReplacements(
    body.community_id,
    nonResponders.length,
    exclude: [...body.members.map(m => m.user_id), ...nonResponders.map(r => r.user_id)]
  );
  // Assign replacements, notify both groups
}
```

---

## 4. LLM Validation Service Research

### Tiered Scoring Architecture

```
                    ┌─────────────┐
                    │  Proposal   │
                    │  Submitted  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  LLM Scores │
                    │  0-100%     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
      ┌───────▼──────┐ ┌──▼──────┐ ┌───▼──────┐
      │ Score < 20%  │ │ 20-90%  │ │ Score >90│
      │ RETURN to    │ │ SORTITION│ │ AUTO-    │
      │ author with  │ │ REVIEW   │ │ APPROVE  │
      │ feedback     │ │ BODY     │ │ → scoring│
      └──────────────┘ └──────────┘ └──────────┘
```

### Prompt Engineering for Proposal Validation

```typescript
// server/utils/llm-validator.ts
const VALIDATION_PROMPT = `
You are evaluating a citizen proposal for a democratic deliberation platform.
Score the proposal on a scale of 0-100 based on:

1. **Relevance** (30%): Does it address a real community concern?
2. **Clarity** (25%): Is the problem and proposed solution clearly stated?
3. **Appropriateness** (25%): Is it within the community's scope? Not offensive, not spam?
4. **Actionability** (20%): Is the proposed solution feasible and specific?

Return ONLY a JSON object:
{
  "score": 75,
  "feedback": "Specific feedback for the author...",
  "category": "infrastructure|social|economic|environmental|other",
  "flags": ["spam", "offensive", "duplicate", "out_of_scope"]
}
`;
```

### Async Validation Pattern

```typescript
// Option 1: Fire-and-forget with status updates
async function validateProposal(proposalId: number): Promise<void> {
  // Update status
  await storage.updateProposal(proposalId, { state: 'validating' });
  
  // Queue async validation
  queueLLMValidation(proposalId);
}

async function queueLLMValidation(proposalId: number): Promise<void> {
  const proposal = await storage.getProposal(proposalId);
  const response = await callLLM(VALIDATION_PROMPT, proposal);
  const result = JSON.parse(response);
  
  // Apply tiered logic
  if (result.score < 20) {
    await storage.updateProposal(proposalId, {
      state: 'returned',
      llm_score: result.score,
      llm_feedback: result.feedback
    });
    await notifyAuthor(proposal.author_id, result.feedback);
  } else if (result.score > 90) {
    await storage.updateProposal(proposalId, {
      state: 'scoring',
      llm_score: result.score
    });
  } else {
    await storage.updateProposal(proposalId, {
      state: 'under_review',
      llm_score: result.score
    });
    await createSortitionBody(proposal.community_id, {
      purpose: 'validity',
      proposal_id: proposalId
    });
  }
}
```

### Configurable LLM Backend

```typescript
// server/utils/llm-client.ts
interface LLMBackend {
  call(prompt: string, options?: LLMOptions): Promise<string>;
}

class OllamaBackend implements LLMBackend {
  constructor(private baseUrl: string, private model: string) {}
  async call(prompt: string) { /* call Ollama API */ }
}

class OpenRouterBackend implements LLMBackend {
  constructor(private apiKey: string, private model: string) {}
  async call(prompt: string) { /* call OpenRouter API */ }
}

// Config-driven selection
const llmClient: LLMBackend = config.llm.backend === 'ollama'
  ? new OllamaBackend(config.llm.ollama_url, config.llm.ollama_model)
  : new OpenRouterBackend(config.llm.openrouter_key, config.llm.openrouter_model);
```

---

## 5. Decidim Reference (Ruby on Rails)

### Architecture
- **Modular gems**: `decidim-proposals`, `decidim-sortition`, `decidim-participatory-budgets`, etc.
- **Each gem**: Independent Rails engine with models, controllers, views
- **7,753 commits, 1.7k stars** — mature, production-tested platform

### Relevant Features for AgoraX
- **Proposals**: Full lifecycle (draft → published → under review → accepted/rejected)
- **Proposal categories**: Taxonomy-based organization
- **Amendments**: "Join proposal" feature (merge similar proposals)
- **Sortition**: Random selection with demographic quotas
- **Participatory budgets**: Budget allocation through deliberation
- **Initiatives**: Citizen petitions with signature collection

### Patterns to Borrow
- Proposal state machine with explicit transitions
- Category/tag system for proposals
- Author attribution with edit history
- Support/oppose tracking (likes/dislikes)
- Notification system for state changes

---

## 6. Loomio Reference (Decision-Making Platform)

### Architecture
- **Decision types**: Consensus, majority vote, discussion-only
- **Decision tree**: Visual representation of consensus building
- **Objection handling**: Structured way to raise and resolve objections

### Relevant for AgoraX
- Structured debate with for/against arguments
- Consensus tracking (support/oppose/abstain/objection)
- Decision visualization

---

## 7. Proposed IStorage Extensions

Based on the schema tables added in Phase 1, here are the methods needed:

### Community Methods
```typescript
// IStorage interface additions
createCommunity(community: InsertCommunity): Promise<Community>;
getCommunity(id: number): Promise<Community | undefined>;
getCommunityBySlug(slug: string): Promise<Community | undefined>;
updateCommunity(id: number, updates: Partial<Community>): Promise<Community>;
deleteCommunity(id: number): Promise<boolean>;
getCommunitiesByUser(userId: number): Promise<Community[]>;
getCommunityMembers(communityId: number): Promise<CommunityMember[]>;
addCommunityMember(member: InsertCommunityMember): Promise<CommunityMember>;
removeCommunityMember(communityId: number, userId: number): Promise<boolean>;
updateMemberRole(communityId: number, userId: number, role: string): Promise<CommunityMember>;
```

### Proposal Methods
```typescript
createProposal(proposal: InsertProposal): Promise<Proposal>;
getProposal(id: number): Promise<Proposal | undefined>;
getProposals(communityId: number, filters?: ProposalFilters): Promise<Proposal[]>;
updateProposal(id: number, updates: Partial<Proposal>): Promise<Proposal>;
getProposalsByUser(userId: number): Promise<Proposal[]>;
getProposalWithDetails(id: number): Promise<ProposalDetail | undefined>; // Full view with amendments, arguments
transitionProposalState(id: number, newState: string): Promise<Proposal>; // State machine
```

### Amendment Methods
```typescript
createAmendment(amendment: InsertProposalAmendment): Promise<ProposalAmendment>;
getAmendments(proposalId: number): Promise<ProposalAmendment[]>;
getAmendment(id: number): Promise<ProposalAmendment | undefined>;
updateAmendment(id: number, updates: Partial<ProposalAmendment>): Promise<ProposalAmendment>;
```

### Sortition Methods
```typescript
createSortitionBody(body: InsertSortitionBody): Promise<SortitionBody>;
getSortitionBody(id: number): Promise<SortitionBody | undefined>;
getSortitionMembers(bodyId: number): Promise<SortitionMember[]>;
addSortitionMembers(bodyId: number, members: InsertSortitionMember[]): Promise<SortitionMember[]>;
removeSortitionMember(bodyId: number, userId: number): Promise<boolean>;
selectSortitionMembers(communityId: number, config: SortitionConfig): Promise<number[]>; // Algorithm
completeSortitionBody(bodyId: number, result: any): Promise<SortitionBody>;
```

### Debate Argument Methods
```typescript
createArgument(argument: InsertDebateArgument): Promise<DebateArgument>;
getArguments(proposalId: number, side?: 'for' | 'against'): Promise<DebateArgument[]>;
getArgument(id: number): Promise<DebateArgument | undefined>;
updateArgumentSupport(argumentId: number, userId: number, support: number): Promise<DebateArgument>;
```

### Proposal Support Methods
```typescript
createSupport(support: InsertProposalSupport): Promise<ProposalSupport>;
getSupport(proposalId: number): Promise<{ support_count: number; oppose_count: number }>;
getUserSupport(proposalId: number, userId: number): Promise<ProposalSupport | undefined>;
updateUserSupport(proposalId: number, userId: number, type: 'support' | 'oppose'): Promise<ProposalSupport>;
```

---

## 8. Proposed API Route Structure

```
/api/communities                          GET     List all communities
/api/communities                          POST    Create community
/api/communities/:id                      GET     Community details
/api/communities/:id                      PATCH   Update community
/api/communities/:id/members              GET     List members
/api/communities/:id/members              POST    Add member
/api/communities/:id/members/:userId      DELETE  Remove member
/api/communities/:id/proposals            GET     List proposals
/api/communities/:id/proposals            POST    Submit proposal
/api/proposals/:id                        GET     Proposal details
/api/proposals/:id                        PATCH   Update proposal (author only)
/api/proposals/:id/validate               POST    Trigger LLM validation
/api/proposals/:id/amendments             GET     List amendments
/api/proposals/:id/amendments             POST    Submit amendment
/api/proposals/:id/arguments              GET     List debate arguments
/api/proposals/:id/arguments              POST    Add argument
/api/proposals/:id/support                GET     Support stats
/api/proposals/:id/support                POST    Support/oppose proposal
/api/sortition/:id                        GET     Sortition body details
/api/sortition/:id/members                GET     List members
/api/sortition/:id/complete               POST    Complete sortition (member action)
/api/sortition/:id/self-exclude           POST    Member opts out
```

---

## 9. State Machine Design

### Proposal State Transitions
```
submitted → validating → valid → scoring → under_review → amendments → debate → voting → resolved
                              ↘ returned → submitted (author revises)
                              ↘ rejected (final)

submitted → validating → under_review (20-90% score) → scoring → ...
                              ↘ returned (<20% score)
                              ↦ scoring (>90% score, auto-approve)
```

### Transition Rules
```typescript
interface StateTransition {
  from: string;
  to: string;
  trigger: 'author' | 'system' | 'sortition' | 'admin';
  condition?: (proposal: Proposal) => boolean;
  side_effect?: (proposal: Proposal) => Promise<void>;
}

const TRANSITIONS: StateTransition[] = [
  { from: 'submitted', to: 'validating', trigger: 'system',
    side_effect: async (p) => queueLLMValidation(p.id) },
  { from: 'validating', to: 'valid', trigger: 'system',
    condition: (p) => p.llm_score! > 90 },
  { from: 'validating', to: 'returned', trigger: 'system',
    condition: (p) => p.llm_score! < 20,
    side_effect: async (p) => notifyAuthor(p.author_id, p.llm_feedback!) },
  { from: 'validating', to: 'under_review', trigger: 'system',
    condition: (p) => p.llm_score! >= 20 && p.llm_score! <= 90,
    side_effect: async (p) => createSortitionBody(p.community_id, { purpose: 'validity', proposal_id: p.id }) },
  // ... more transitions
];
```

---

## 10. Implementation Order Recommendation

### Phase 2.1: Storage Interface (Foundation)
1. Add all IStorage interface methods
2. Implement PostgresStorage methods
3. Test with Drizzle queries

### Phase 2.2: Community Routes
1. Community CRUD endpoints
2. Membership management
3. Authorization checks (community admin/member)

### Phase 2.3: Proposal Routes
1. Proposal submission endpoint
2. Proposal listing with filters
3. State transition endpoint
4. Proposal detail view (with amendments, arguments)

### Phase 2.4: Amendment & Debate Routes
1. Amendment submission
2. Debate argument submission
3. Support/oppose tracking

### Phase 2.5: Sortition Routes
1. Sortition body creation (triggered by state machine)
2. Member selection algorithm
3. Member scoring interface
4. Completion handling

---

## 11. Open Questions for Phase 2

1. **LLM Backend**: Ollama local vs. OpenRouter cloud? Configurable?
2. **Sortition Size**: Fixed per community or per-purpose?
3. **State Machine**: Strict transitions or flexible?
4. **Amendment Merge**: AI-assisted or manual author decision?
5. **Notification System**: Email, in-app, or both?
6. **Migration**: How to migrate existing `groups` to `communities`?
7. **Authorization**: Per-route checks or middleware-based?

---

## 12. References

- **Helios Server**: https://github.com/benadida/helios-server (cloned to `~/.hermes/helios-ref/`)
- **Decidim**: https://github.com/decidim/decidim (Ruby on Rails, 1.7k stars)
- **Loomio**: https://github.com/loomio/loomio (Decision-making platform)
- **Demopolis Specs**: `~/.hermes/demopolis/Draft/docs/` (Greek design documents)
- **AgoraX Codebase**: `~/.hermes/agorax-build/`
