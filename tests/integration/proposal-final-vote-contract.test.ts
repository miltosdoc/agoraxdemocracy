/**
 * Proposal final ratification vote contract tests.
 *
 * The final vote must be modelled as a distinct table from proposal_support so
 * that "I like this idea" (deliberation) and "I ratify this binding decision"
 * (final vote) are not the same record. These tests pin the contract: schema,
 * storage methods, validation, and route surface.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  castProposalVoteSchema,
  proposalVoteChoiceSchema,
  proposalVotes,
} from '../../shared/schema';

const storageSource = readFileSync(resolve(process.cwd(), 'server/storage.ts'), 'utf8');
const routesSource = readFileSync(resolve(process.cwd(), 'server/routes.ts'), 'utf8');
const migrationSource = readFileSync(
  resolve(process.cwd(), 'migrations/0004_proposal_final_votes.sql'),
  'utf8',
);

describe('proposal final vote schema', () => {
  it('exists as its own table named proposal_votes', () => {
    expect(proposalVotes).toBeDefined();
  });

  it('accepts only yes/no/abstain choices', () => {
    expect(proposalVoteChoiceSchema.safeParse('yes').success).toBe(true);
    expect(proposalVoteChoiceSchema.safeParse('no').success).toBe(true);
    expect(proposalVoteChoiceSchema.safeParse('abstain').success).toBe(true);

    for (const invalid of ['support', 'oppose', 'maybe', '', 'YES']) {
      expect(proposalVoteChoiceSchema.safeParse(invalid).success).toBe(false);
    }
  });

  it('validates the cast-vote request body', () => {
    expect(castProposalVoteSchema.safeParse({ choice: 'yes' }).success).toBe(true);
    expect(castProposalVoteSchema.safeParse({ choice: 'support' }).success).toBe(false);
    expect(castProposalVoteSchema.safeParse({}).success).toBe(false);
  });
});

describe('proposal final vote migration', () => {
  it('creates proposal_votes with one row per (proposal, user)', () => {
    expect(migrationSource).toMatch(/CREATE TABLE IF NOT EXISTS "proposal_votes"/);
    expect(migrationSource).toMatch(/CREATE UNIQUE INDEX IF NOT EXISTS "proposal_vote_unique"\s+ON "proposal_votes" \("proposal_id", "user_id"\)/);
  });

  it('constrains choice at the database level', () => {
    expect(migrationSource).toMatch(/CHECK \("choice" IN \('yes','no','abstain'\)\)/);
  });
});

describe('proposal final vote storage contract', () => {
  it('exposes castProposalVote, getUserProposalVote, getProposalVoteResults in IStorage', () => {
    expect(storageSource).toMatch(/castProposalVote\(proposalId: number, userId: number, choice: ProposalVoteChoice\): Promise<ProposalVote>;/);
    expect(storageSource).toMatch(/getUserProposalVote\(proposalId: number, userId: number\): Promise<ProposalVote \| undefined>;/);
    expect(storageSource).toMatch(/getProposalVoteResults\(proposalId: number\): Promise<ProposalVoteResults>;/);
  });

  it('upserts on (proposalId, userId) so a user only ever has one final vote', () => {
    expect(storageSource).toMatch(/onConflictDoUpdate\(\{[\s\S]*?target: \[proposalVotes\.proposalId, proposalVotes\.userId\]/);
  });

  it('computes participation against community member count and threshold', () => {
    expect(storageSource).toMatch(/minParticipationPct/);
    expect(storageSource).toMatch(/const meetsQuorum = participationPct >= minParticipationPct/);
  });
});

describe('proposal final vote route contract', () => {
  it('exposes POST /api/proposals/:id/vote, GET /api/proposals/:id/vote-results, POST /api/proposals/:id/finalize', () => {
    expect(routesSource).toMatch(/app\.post\("\/api\/proposals\/:id\/vote"/);
    expect(routesSource).toMatch(/app\.get\("\/api\/proposals\/:id\/vote-results"/);
    expect(routesSource).toMatch(/app\.post\("\/api\/proposals\/:id\/finalize"/);
  });

  it('refuses votes outside the voting lifecycle phase', () => {
    expect(routesSource).toMatch(/proposal\.status !== 'voting'/);
  });

  it('refuses votes from non-members of the community', () => {
    expect(routesSource).toMatch(/Only community members may cast a final vote/);
  });

  it('finalize transitions to decided on quorum, archived otherwise', () => {
    expect(routesSource).toMatch(/results\.meetsQuorum \? 'decided' : 'archived'/);
  });
});
