-- AgoraX Demo Seed Data (v2 — matches actual schema)
-- Creates a complete demo environment with users, communities, proposals, amendments, and sortition bodies

-- ═══════════════════════════════════════════════════════════════════════════════
-- USERS
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO users (id, username, email, password, name, is_admin, account_status) VALUES
  (1, 'dimitris', 'admin@agorax.gr', '\$2b\$10\$dummyhash', 'Δημήτρης Παπαδόπουλος', true, 'active'),
  (2, 'eleni', 'eleni@agorax.gr', '\$2b\$10\$dummyhash', 'Ελένη Κωνσταντίνου', false, 'active'),
  (3, 'giannis', 'giannis@agorax.gr', '\$2b\$10\$dummyhash', 'Γιάννης Δημητρίου', false, 'active'),
  (4, 'maria', 'maria@agorax.gr', '\$2b\$10\$dummyhash', 'Μαρία Αλεξίου', false, 'active'),
  (5, 'nikos', 'nikos@agorax.gr', '\$2b\$10\$dummyhash', 'Νίκος Σταύρου', false, 'active'),
  (6, 'sotiris', 'sotiris@agorax.gr', '\$2b\$10\$dummyhash', 'Σωτήρης Παπανδρέου', false, 'active'),
  (7, 'katerina', 'katerina@agorax.gr', '\$2b\$10\$dummyhash', 'Κατερίνα Μιχαήλ', false, 'active'),
  (8, 'andreas', 'andreas@agorax.gr', '\$2b\$10\$dummyhash', 'Ανδρέας Θεοδώρου', false, 'active'),
  (9, 'christina', 'christina@agorax.gr', '\$2b\$10\$dummyhash', 'Χριστίνα Ιωάννου', false, 'active'),
  (10, 'pavlos', 'pavlos@agorax.gr', '\$2b\$10\$dummyhash', 'Παύλος Νικολάου', false, 'active');

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMMUNITIES
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO communities (id, name, description, type, governance_model, creator_id, amendment_threshold, max_amendments_per_proposal, created_at) VALUES
  (1, 'Πολίτες Αθηνών', 'Κοινότητα πολιτών της Αθήνας για τοπικά θέματα', 'autonomous', 'no_admin', 1, 0.5, -1, NOW()),
  (2, 'Περιβάλλον & Βιωσιμότητα', 'Θέματα περιβάλλοντος και βιώσιμης ανάπτυξης', 'autonomous', 'no_admin', 1, 0.6, 10, NOW()),
  (3, 'Εκπαίδευση & Νεολαία', 'Θέματα εκπαίδευσης και νεολαίας', 'autonomous', 'no_admin', 1, 0.4, -1, NOW());

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMMUNITY MEMBERS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Athens citizens community (all users)
INSERT INTO community_members (community_id, user_id, joined_at) VALUES
  (1, 1, NOW()), (1, 2, NOW()), (1, 3, NOW()), (1, 4, NOW()), (1, 5, NOW()),
  (1, 6, NOW()), (1, 7, NOW()), (1, 8, NOW()), (1, 9, NOW()), (1, 10, NOW());

-- Environment community (subset)
INSERT INTO community_members (community_id, user_id, joined_at) VALUES
  (2, 1, NOW()), (2, 3, NOW()), (2, 4, NOW()), (2, 5, NOW()), (2, 7, NOW()), (2, 9, NOW());

-- Education community (subset)
INSERT INTO community_members (community_id, user_id, joined_at) VALUES
  (3, 1, NOW()), (3, 2, NOW()), (3, 6, NOW()), (3, 8, NOW()), (3, 10, NOW());

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROPOSALS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Proposal 1: In author_review state (has amendments waiting for author review)
INSERT INTO proposals (id, community_id, author_id, question, solution, category, status, created_at, updated_at) VALUES
  (1, 1, 3,
   'Δημιουργία ποδηλατοδρόμων στην κεντρική Αθήνα',
   'Πρόταση για τη δημιουργία ενός δικτύου ποδηλατοδρόμων που θα συνδέουν τα κύρια σημεία της κεντρικής Αθήνας, συμπεριλαμβανομένων των πλατειών Ομονοίας, Συντάγματος, και Εξάρχειας. Ο προϋπολογισμός εκτιμάται στα 2.5 εκατομμύρια ευρώ με διάρκεια υλοποίησης 18 μήνες.',
   'Μεταφορές',
   'author_review',
   NOW() - INTERVAL '10 days',
   NOW() - INTERVAL '5 days');

-- Proposal 2: In community_signal state (author has reviewed, community voting on rejected amendments)
INSERT INTO proposals (id, community_id, author_id, question, solution, category, status, created_at, updated_at) VALUES
  (2, 1, 4,
   'Εγκατάσταση ηλιακών πάνελ σε δημόσια κτίρια',
   'Πρόταση για την εγκατάσταση φωτοβολταϊκών πάνελ σε όλα τα δημόσια κτίρια της Αθήνας (σχολεία, νοσοκομεία, δημαρχεία). Αναμενόμενη μείωση ενεργειακού κόστους κατά 30% και μείωση CO2 κατά 500 τόνους ετησίως.',
   'Περιβάλλον',
   'community_signal',
   NOW() - INTERVAL '15 days',
   NOW() - INTERVAL '3 days');

-- Proposal 3: In sortition_synthesis state (community signal done, waiting for sortition body)
INSERT INTO proposals (id, community_id, author_id, question, solution, category, status, created_at, updated_at) VALUES
  (3, 2, 5,
   'Δημόσιες βιβλιοθήκες 24ωρες',
   'Μετατροπή 5 δημόσιων βιβλιοθηκών σε 24ωρους χώρους γνώσης με δωρεάν Wi-Fi, εργαστήρια, και χώρους μελέτης. Προϋπολογισμός: 800.000 ευρώ ετησίως για λειτουργία.',
   'Εκπαίδευση',
   'sortition_synthesis',
   NOW() - INTERVAL '20 days',
   NOW() - INTERVAL '1 day');

-- Proposal 4: In voting state (sortition done, community ratification)
INSERT INTO proposals (id, community_id, author_id, question, solution, category, status, final_text, created_at, updated_at) VALUES
  (4, 1, 6,
   'Δωρεάν δημόσια συγκοινωνία για νέους κάτω των 25',
   'Δωρεάν πρόσβαση στη δημόσια συγκοινωνία (ΗΣΑΠ, ΚΤΕΛ, τραμ) για όλους τους νέους κάτω των 25 ετών στην Αττική. Προϋπολογισμός: 15 εκατομμύρια ευρώ ετησίως.',
   'Μεταφορές',
   'voting',
   'Δωρεάν πρόσβαση στη δημόσια συγκοινωνία (ΗΣΑΠ, ΚΤΕΛ, τραμ) για όλους τους νέους κάτω των 25 ετών στην Αττική. Το μέτρο θα εφαρμόζεται σταδιακά σε 3 φάσεις: Φάση 1 (ΗΣΑΠ), Φάση 2 (τραμ), Φάση 3 (ΚΤΕΛ). Προϋπολογισμός: 15 εκατομμύρια ευρώ ετησίως.',
   NOW() - INTERVAL '30 days',
   NOW());

-- Proposal 5: In decided state (completed)
INSERT INTO proposals (id, community_id, author_id, question, solution, category, status, final_text, created_at, updated_at) VALUES
  (5, 1, 7,
   'Πράσινες στέγες σε δημόσια σχολεία',
   'Εγκατάσταση πρασίνου στις στέγες όλων των δημόσιων σχολείων της Αθήνας. Βελτίωση θερμομόνωσης, μείωση θερμοκρασίας, και εκπαιδευτικά προγράμματα.',
   'Περιβάλλον',
   'decided',
   'Εγκατάσταση πρασίνου στις στέγες όλων των δημόσιων σχολείων της Αθήνας. Το πρόγραμμα θα ξεκινήσει με 20 σχολεία πιλοτικά και θα επεκταθεί σταδιακά.',
   NOW() - INTERVAL '60 days',
   NOW());

-- ═══════════════════════════════════════════════════════════════════════════════
-- AMENDMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Proposal 1 amendments (author_review state — some reviewed, some pending)
INSERT INTO proposal_amendments (id, proposal_id, author_id, type, text, status, llm_score, author_decision, author_reason, rejection_upvotes, rejection_downvotes, created_at) VALUES
  (1, 1, 4, 'addition', 'Προσθήκη ποδηλατοδρόμου κατά μήκος της Λεωφόρου Βασιλίσσης Σοφίας', 'pending', 0.85, 'accepted', NULL, 0, 0, NOW() - INTERVAL '8 days'),
  (2, 1, 5, 'modification', 'Αλλαγή προϋπολογισμού από 2.5M σε 3.2M ευρώ λόγω κόστους υλικών', 'pending', 0.72, 'rejected', 'Ο προϋπολογισμός των 2.5M είναι ρεαλιστικός με βάση τις μελέτες. Τα 3.2M υπερβαίνουν τα διαθέσιμα κονδύλια.', 3, 1, NOW() - INTERVAL '7 days'),
  (3, 1, 7, 'addition', 'Προσθήκη σταθμών ενοικίασης ποδηλάτων σε κάθε σταθμό μετρό', 'pending', 0.91, NULL, NULL, 0, 0, NOW() - INTERVAL '6 days'),
  (4, 1, 8, 'modification', 'Μείωση διάρκειας υλοποίησης από 18 σε 12 μήνες', 'pending', 0.45, NULL, NULL, 0, 0, NOW() - INTERVAL '5 days');

-- Proposal 2 amendments (community_signal state — all reviewed by author)
INSERT INTO proposal_amendments (id, proposal_id, author_id, type, text, status, llm_score, author_decision, author_reason, rejection_upvotes, rejection_downvotes, created_at) VALUES
  (5, 2, 3, 'addition', 'Προσθήκη συστημάτων αποθήκευσης ενέργειας (batteries) για νυχτερινή χρήση', 'pending', 0.88, 'rejected', 'Τα batteries αυξάνουν το κόστος κατά 40% και δεν είναι απαραίτητα για το αρχικό στάδιο.', 5, 2, NOW() - INTERVAL '10 days'),
  (6, 2, 5, 'modification', 'Επέκταση σε ιδιωτικά κτίρια >1000m² με κίνητρα φορολογίας', 'pending', 0.67, 'rejected', 'Η πρόταση αφορά δημόσια κτίρια. Τα ιδιωτικά κτίρια είναι ξεχωριστό θέμα.', 2, 4, NOW() - INTERVAL '9 days'),
  (7, 2, 7, 'addition', 'Δημιουργία πλατφόρμας παρακολούθησης παραγωγής ενέργειας σε πραγματικό χρόνο', 'pending', 0.93, 'accepted', NULL, 0, 0, NOW() - INTERVAL '8 days');

-- Proposal 3 amendments (sortition_synthesis state — all reviewed, signals calculated)
INSERT INTO proposal_amendments (id, proposal_id, author_id, type, text, status, llm_score, author_decision, author_reason, rejection_upvotes, rejection_downvotes, created_at) VALUES
  (8, 3, 3, 'modification', 'Αύξηση από 5 σε 10 βιβλιοθήκες για καλύτερη κάλυψη', 'pending', 0.79, 'rejected', 'Ο προϋπολογισμός δεν καλύπτει 10 βιβλιοθήκες. Τα 5 είναι το ρεαλιστικό μέγιστο.', 4, 1, NOW() - INTERVAL '15 days'),
  (9, 3, 9, 'addition', 'Προσθήκη ψηφιακών εργαστηρίων με υπολογιστές και εκτυπωτές 3D', 'pending', 0.82, 'rejected', 'Τα ψηφιακά εργαστήρια απαιτούν ξεχωριστό προϋπολογισμό και προσωπικό.', 1, 3, NOW() - INTERVAL '14 days');

-- ═══════════════════════════════════════════════════════════════════════════════
-- AMENDMENT REJECTION VOTES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Votes on amendment 2 (rejected by author, community disagrees)
INSERT INTO amendment_rejection_votes (amendment_id, user_id, vote, created_at) VALUES
  (2, 4, 1, NOW() - INTERVAL '4 days'),
  (2, 5, 1, NOW() - INTERVAL '4 days'),
  (2, 7, 1, NOW() - INTERVAL '3 days'),
  (2, 8, -1, NOW() - INTERVAL '3 days');

-- Votes on amendment 5 (rejected by author, community strongly disagrees)
INSERT INTO amendment_rejection_votes (amendment_id, user_id, vote, created_at) VALUES
  (5, 3, 1, NOW() - INTERVAL '2 days'),
  (5, 4, 1, NOW() - INTERVAL '2 days'),
  (5, 5, 1, NOW() - INTERVAL '2 days'),
  (5, 7, 1, NOW() - INTERVAL '1 day'),
  (5, 9, 1, NOW() - INTERVAL '1 day'),
  (5, 6, -1, NOW() - INTERVAL '1 day'),
  (5, 8, -1, NOW() - INTERVAL '12 hours');

-- Votes on amendment 8 (rejected by author, community disagrees)
INSERT INTO amendment_rejection_votes (amendment_id, user_id, vote, created_at) VALUES
  (8, 3, 1, NOW() - INTERVAL '10 days'),
  (8, 4, 1, NOW() - INTERVAL '10 days'),
  (8, 5, 1, NOW() - INTERVAL '9 days'),
  (8, 7, 1, NOW() - INTERVAL '9 days'),
  (8, 9, -1, NOW() - INTERVAL '8 days');

-- ═══════════════════════════════════════════════════════════════════════════════
-- SORTITION BODIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Sortition body for proposal 3 (sortition_synthesis state)
INSERT INTO sortition_bodies (id, community_id, purpose, proposal_id, size, response_hours, status, selected_at, created_at) VALUES
  (1, 2, 'Σύνθεση τελικού κειμένου πρότασης #3: Δημόσιες βιβλιοθήκες 24ωρες', 3, 5, 72, 'active', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days');

-- Sortition members for proposal 3
INSERT INTO sortition_members (body_id, user_id, responded, score, scored_at) VALUES
  (1, 3, false, NULL, NULL),
  (1, 4, false, NULL, NULL),
  (1, 5, false, NULL, NULL),
  (1, 7, false, NULL, NULL),
  (1, 9, false, NULL, NULL);

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROPOSAL SUPPORT (votes on proposals)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Support for proposal 4 (voting state)
INSERT INTO proposal_support (proposal_id, user_id, type, created_at) VALUES
  (4, 1, 'support', NOW() - INTERVAL '1 day'),
  (4, 2, 'support', NOW() - INTERVAL '1 day'),
  (4, 3, 'oppose', NOW() - INTERVAL '1 day'),
  (4, 5, 'support', NOW() - INTERVAL '12 hours'),
  (4, 6, 'support', NOW() - INTERVAL '12 hours'),
  (4, 7, 'oppose', NOW() - INTERVAL '6 hours'),
  (4, 8, 'support', NOW() - INTERVAL '6 hours'),
  (4, 9, 'support', NOW() - INTERVAL '3 hours'),
  (4, 10, 'oppose', NOW() - INTERVAL '1 hour');

-- ═══════════════════════════════════════════════════════════════════════════════
-- POLL (for testing existing poll functionality)
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO polls (id, title, description, category, creator_id, start_date, end_date, is_active, poll_type, location_scope, created_at) VALUES
  (1, 'Προτίμηση για πάρκινγκ', 'Ποιο είδος πάρκινγκ προτιμάτε για την περιοχή σας;', 'Τοπικά θέματα', 1,
   NOW() - INTERVAL '3 days',
   NOW() + INTERVAL '7 days',
   true,
   'singleChoice',
   'global',
   NOW() - INTERVAL '3 days');

-- ═══════════════════════════════════════════════════════════════════════════════
-- SUMMARY
-- ═══════════════════════════════════════════════════════════════════════════════
-- 10 users (1 admin, 9 members)
-- 3 communities (Athens citizens, Environment, Education)
-- 5 proposals across all states:
--   - Proposal 1: author_review (4 amendments, 2 reviewed)
--   - Proposal 2: community_signal (3 amendments, all reviewed, 2 rejected with votes)
--   - Proposal 3: sortition_synthesis (2 amendments, sortition body active)
--   - Proposal 4: voting (9 votes, 6 support / 3 oppose)
--   - Proposal 5: decided (completed)
-- 1 active poll
-- 16 amendment rejection votes
-- 1 sortition body with 5 members

-- Reset sequences after seeding to prevent PK conflicts on new signups
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('communities_id_seq', (SELECT MAX(id) FROM communities));
SELECT setval('proposals_id_seq', (SELECT MAX(id) FROM proposals));
SELECT setval('polls_id_seq', (SELECT MAX(id) FROM polls));

