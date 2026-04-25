/**
 * Seed script for AgoraX demo data.
 *
 * Creates: communities, users, proposals, sortition bodies, amendments, debates.
 * Run with: npx tsx server/seed-demo.ts
 */

import { db } from './db';
import {
  users,
  communities,
  communityMembers,
  proposals,
  proposalAmendments,
  debateArguments,
  sortitionBodies,
  sortitionMembers,
  adminActions,
} from '../shared/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('🌱 Seeding demo data...\n');

  // ─── Users ────────────────────────────────────────────────────────────────
  const [user1] = await db
    .insert(users)
    .values({
      username: 'demo_admin',
      name: 'Δημοκράτης Παπαδόπουλος',
      email: 'demo@agorax.gr',
      password: '$2b$10$dummyhash',
      isAdmin: true,
    })
    .returning();

  const [user2] = await db
    .insert(users)
    .values({
      username: 'demo_citizen1',
      name: 'Μαρία Κωνσταντίνου',
      email: 'maria@demo.gr',
      password: '$2b$10$dummyhash',
    })
    .returning();

  const [user3] = await db
    .insert(users)
    .values({
      username: 'demo_citizen2',
      name: 'Γιώργος Δημητρίου',
      email: 'giorgos@demo.gr',
      password: '$2b$10$dummyhash',
    })
    .returning();

  console.log(`  ✅ 3 users created`);

  // ─── Communities ──────────────────────────────────────────────────────────
  const [community1] = await db
    .insert(communities)
    .values({
      name: 'Δήμος Αθηναίων',
      description: 'Η κοινότητα του Δήμου Αθηναίων για συμμετοχική διακυβέρνηση',
      type: 'managed',
      governanceModel: 'hybrid',
      creatorId: user1.id,
      sortitionSize: 20,
      sortitionResponseHours: 72,
      democracyScore: '72',
      createdAt: new Date(),
    })
    .returning();

  const [community2] = await db
    .insert(communities)
    .values({
      name: 'Περιφέρεια Αττικής',
      description: 'Συμμετοχική πλατφόρμα για την Περιφέρεια Αττικής',
      type: 'managed',
      governanceModel: 'hybrid',
      creatorId: user1.id,
      sortitionSize: 30,
      sortitionResponseHours: 72,
      democracyScore: '85',
      createdAt: new Date(),
    })
    .returning();

  const [community3] = await db
    .insert(communities)
    .values({
      name: 'Πολίτες για το Περιβάλλον',
      description: 'Αυτόνομη κοινότητα πολιτών για περιβαλλοντικά θέματα',
      type: 'autonomous',
      governanceModel: 'no_admin',
      creatorId: user2.id,
      sortitionSize: 10,
      sortitionResponseHours: 48,
      democracyScore: '58',
      createdAt: new Date(),
    })
    .returning();

  console.log(`  ✅ 3 communities created`);

  // ─── Community Members ────────────────────────────────────────────────────
  await db.insert(communityMembers).values([
    { communityId: community1.id, userId: user1.id, role: 'founder', joinedAt: new Date() },
    { communityId: community1.id, userId: user2.id, role: 'member', joinedAt: new Date() },
    { communityId: community1.id, userId: user3.id, role: 'member', joinedAt: new Date() },
    { communityId: community2.id, userId: user1.id, role: 'founder', joinedAt: new Date() },
    { communityId: community2.id, userId: user2.id, role: 'member', joinedAt: new Date() },
    { communityId: community3.id, userId: user2.id, role: 'founder', joinedAt: new Date() },
    { communityId: community3.id, userId: user3.id, role: 'member', joinedAt: new Date() },
  ]);

  console.log(`  ✅ 7 community memberships created`);

  // ─── Proposals ────────────────────────────────────────────────────────────
  const [proposal1] = await db
    .insert(proposals)
    .values({
      communityId: community1.id,
      authorId: user2.id,
      question: 'Εγκατάσταση ηλεκτρικών σταθμών φόρτισης σε δημόσιους χώρους',
      solution: 'Ο Δήμος Αθηναίων θα εγκαταστήσει 50 ηλεκτρικούς σταθμούς φόρτισης σε κεντρικές περιοχές της Αθήνας έως το 2027.',
      status: 'community_signal',
      llmScore: '72',
      llmFeedback: 'Η πρόταση είναι καλά δομημένη με σαφή στόχο και χρονοδιάγραμμα. Προτείνεται να προστεθούν λεπτομέρειες για τη χρηματοδότηση και τις τοποθεσίες.',
      llmValidatedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    })
    .returning();

  const [proposal2] = await db
    .insert(proposals)
    .values({
      communityId: community1.id,
      authorId: user3.id,
      question: 'Δημιουργία ποδηλατοδρόμων στη Θεσσαλονίκη',
      solution: 'Δημιουργία δικτύου 120 χλμ ποδηλατοδρόμων στη Θεσσαλονίκη με προϋπολογισμό 15 εκατ. ευρώ.',
      status: 'sortition_synthesis',
      llmScore: '85',
      llmFeedback: 'Εξαιρετικά τεκμηριωμένη πρόταση με συγκεκριμένο προϋπολογισμό και έκταση. Απαιτείται επιπλέον τεκμηρίωση για τις πηγές χρηματοδότησης.',
      llmValidatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    })
    .returning();

  const [proposal3] = await db
    .insert(proposals)
    .values({
      communityId: community2.id,
      authorId: user2.id,
      question: 'Μείωση των αέριων ρύπων στην Αττική',
      solution: 'Εισαγωγή ζώνης χαμηλών εκπομπών στην Αττική με σταδιακή εφαρμογή 2025-2030.',
      status: 'decided',
      llmScore: '92',
      llmFeedback: 'Υψηλής ποιότητας πρόταση με σαφές χρονοδιάγραμμα και μετρήσιμους στόχους.',
      llmValidatedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    })
    .returning();

  const [proposal4] = await db
    .insert(proposals)
    .values({
      communityId: community3.id,
      authorId: user3.id,
      question: 'Προστασία των υγροτόπων της Μεσογαίας',
      solution: 'Δημιουργία προστατευόμενης περιοχής NATURA 2000 για τα υγρότοπα της Μεσογαίας με πρόγραμμα παρακολούθησης βιοποικιλότητας.',
      status: 'voting',
      llmScore: '68',
      llmFeedback: 'Η πρόταση έχει περιβαλλοντική αξία αλλά χρειάζεται περισσότερη τεκμηρίωση για τις οικονομικές επιπτώσεις στους κατοίκους της περιοχής.',
      llmValidatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    })
    .returning();

  console.log(`  ✅ 4 proposals created`);

  // ─── Amendments ───────────────────────────────────────────────────────────
  await db.insert(proposalAmendments).values([
    {
      proposalId: proposal1.id,
      authorId: user3.id,
      type: 'improvement',
      text: 'Πρόταση επέκτασης: Να συμπεριληφθούν και σταθμοί φόρτισης σε προαστιακούς σταθμούς.',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      proposalId: proposal2.id,
      authorId: user2.id,
      type: 'improvement',
      text: 'Πρόταση τροποποίησης: Να προστεθεί πρόγραμμα εκπαίδευσης ποδηλασίας για παιδιά σχολείων.',
      status: 'accepted',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log(`  ✅ 2 amendments created`);

  // ─── Debate Arguments ─────────────────────────────────────────────────────
  await db.insert(debateArguments).values([
    {
      proposalId: proposal4.id,
      authorId: user2.id,
      side: 'for',
      text: 'Η προστασία των υγροτόπων είναι κρίσιμη για τη βιοποικιλότητα και την προσαρμογή στην κλιματική αλλαγή.',
      supportCount: 12,
      oppositionCount: 3,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      proposalId: proposal4.id,
      authorId: user3.id,
      side: 'against',
      text: 'Η δημιουργία προστατευόμενης περιοχής μπορεί να περιορίσει την οικονομική δραστηριότητα των κατοίκων.',
      supportCount: 5,
      oppositionCount: 8,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log(`  ✅ 2 debate arguments created`);

  // ─── Sortition Bodies ─────────────────────────────────────────────────────
  const [sortition1] = await db
    .insert(sortitionBodies)
    .values({
      communityId: community1.id,
      purpose: 'scoring',
      proposalId: proposal2.id,
      size: 5,
      responseHours: 72,
      status: 'active',
      selectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    })
    .returning();

  await db.insert(sortitionMembers).values([
    { bodyId: sortition1.id, userId: user1.id, responded: true, score: '7', scoredAt: new Date() },
    { bodyId: sortition1.id, userId: user2.id, responded: false },
    { bodyId: sortition1.id, userId: user3.id, responded: true, score: '9', scoredAt: new Date() },
  ]);

  console.log(`  ✅ 1 sortition body with 3 members created`);

  // ─── Admin Actions ────────────────────────────────────────────────────────
  await db.insert(adminActions).values([
    {
      userId: user1.id,
      communityId: community1.id,
      actionType: 'manage_membership',
      targetId: community1.id,
      details: JSON.stringify({ name: 'Δήμος Αθηναίων' }),
      timestamp: new Date(),
    },
    {
      userId: user1.id,
      communityId: community2.id,
      actionType: 'moderate_proposal',
      targetId: proposal3.id,
      details: JSON.stringify({ reason: 'Υψηλή ποιότητα πρότασης' }),
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log(`  ✅ 2 admin actions logged`);

  console.log('\n✅ Demo data seeded successfully!\n');
  console.log('Demo credentials:');
  console.log('  Admin: demo_admin / (any password)');
  console.log('  Citizen: demo_citizen1 / (any password)');
  console.log('  Citizen: demo_citizen2 / (any password)');
  console.log('\nCommunities:');
  console.log(`  - Δήμος Αθηναίων (ID: ${community1.id})`);
  console.log(`  - Περιφέρεια Αττικής (ID: ${community2.id})`);
  console.log(`  - Πολίτες για το Περιβάλλον (ID: ${community3.id})`);

  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});