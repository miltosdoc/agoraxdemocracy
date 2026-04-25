-- AgoraX Demo Data Seed
-- Creates sample users, communities, and proposals for frontend demo

-- Demo Users
INSERT INTO users (id, username, name, email, password) VALUES
  (1, 'miltos', 'Μιλτιάδης Τριανταφύλλου', 'miltos@agorax.gr', '$2b$10$demo'),
  (2, 'elena', 'Ελένα Παπαδοπούλου', 'elena@agorax.gr', '$2b$10$demo'),
  (3, 'giorgos', 'Γιώργος Νικολάου', 'giorgos@agorax.gr', '$2b$10$demo'),
  (4, 'maria', 'Μαρία Κωνσταντίνου', 'maria@agorax.gr', '$2b$10$demo'),
  (5, 'kostas', 'Κώστας Αλεβίζος', 'kostas@agorax.gr', '$2b$10$demo')
ON CONFLICT DO NOTHING;

-- Demo Communities
INSERT INTO communities (id, name, description, type, governance_model, creator_id, created_at, sortition_size, democracy_score) VALUES
  (1, 'Δήμος Αθηναίων', 'Η ψηφιακή κοινότητα των Αθηναίων πολιτών για συμμετοχική διακυβέρνηση', 'managed', 'admin_founded', 1, NOW() - interval '30 days', 15, 72.5),
  (2, 'Περιβάλλον & Κλίμα', 'Κοινότητα για περιβαλλοντικές πολιτικές και κλιματική δράση', 'autonomous', 'no_admin', 2, NOW() - interval '25 days', 10, 85.0),
  (3, 'Εκπαίδευση Αύριο', 'Συζήτηση για το μέλλον της εκπαίδευσης στην Ελλάδα', 'hybrid', 'admin_guided', 4, NOW() - interval '20 days', 12, 67.3)
ON CONFLICT DO NOTHING;

-- Community Members
INSERT INTO community_members (community_id, user_id, role, joined_at) VALUES
  (1, 1, 'founder', NOW() - interval '30 days'),
  (1, 2, 'member', NOW() - interval '28 days'),
  (1, 3, 'member', NOW() - interval '25 days'),
  (1, 4, 'admin', NOW() - interval '20 days'),
  (1, 5, 'member', NOW() - interval '15 days'),
  (2, 2, 'founder', NOW() - interval '25 days'),
  (2, 1, 'member', NOW() - interval '20 days'),
  (2, 3, 'member', NOW() - interval '18 days'),
  (2, 5, 'member', NOW() - interval '12 days'),
  (3, 4, 'founder', NOW() - interval '20 days'),
  (3, 1, 'member', NOW() - interval '15 days'),
  (3, 2, 'member', NOW() - interval '12 days'),
  (3, 3, 'admin', NOW() - interval '10 days')
ON CONFLICT DO NOTHING;

-- Demo Proposals
INSERT INTO proposals (id, community_id, author_id, question, solution, status, created_at) VALUES
  (1, 1, 1, 'Πώς μπορούμε να μειώσουμε την κυκλοφοριακή συμφόρηση στο κέντρο της Αθήνας;',
   'Να δημιουργηθεί ζώνη χαμηλών εκπομπών (LEZ) στο ιστορικό κέντρο, με δωρεάν δημόσια συγκοινωνία εντός της ζώνης και παροίνωση ηλεκτρικών οχημάτων.', 'sortition_synthesis', NOW() - interval '15 days'),
  (2, 2, 2, 'Ποια μέτρα πρέπει να ληφθούν για την προστασία των δασών από τις πυρκαγιές;',
   'Δημιουργία ζωνών αντιπυρικής προστασίας, εγκατάσταση συστημάτων έγκαιρης προειδοποίησης, και εθελοντικά δασικά συνεργεία σε κάθε δήμο.', 'voting', NOW() - interval '10 days'),
  (3, 1, 3, 'Θα πρέπει η Αθήνα να υιοθετήσει σύστημα ποδηλατοδρόμων τύπου Βόρειας Ευρώπης;',
   'Δίκτυο προστατευμένων ποδηλατοδρόμων σε 5 κύριους άξονες, με δυνατότητα σύνδεσης με Μετρό/Τράμ και σύστημα bike-sharing 2000 ποδηλάτων.', 'author_review', NOW() - interval '7 days'),
  (4, 3, 4, 'Πώς μπορούμε να εκσυγχρονίσουμε το σύστημα δευτεροβάθμιας εκπαίδευσης;',
   'Εισαγωγή ψηφιακών εργαλείων σε κάθε τάξη, μετεκπαίδευση εκπαιδευτικών, και αναμόρφωση του συστήματος αξιολόγησης.', 'review', NOW() - interval '3 days'),
  (5, 2, 5, 'Αξίζει η επένδυση σε αιολική ενέργεια στα νησιά του Αιγαίου;',
   'Εγκατάσταση μικρών αιολικών πάρκων σε 15 νησιά με στόχο την ενεργειακή αυτονομία και την εξαγωγή πλεονάσματος.', 'community_signal', NOW() - interval '5 days')
ON CONFLICT DO NOTHING;

-- Debate arguments on proposal 2 (in voting state)
INSERT INTO debate_arguments (proposal_id, author_id, side, text, support_count, opposition_count, created_at) VALUES
  (2, 1, 'for', 'Η πρόληψη είναι πιο οικονομικά αποδοτική από την κατάσβεση. Κάθε ευρώ σε πρόληψη εξοικονομεί 10 ευρώ σε καταστροφές.', 7, 0, NOW() - interval '8 days'),
  (2, 3, 'against', 'Τα εθελοντικά συνεργεία δεν μπορούν να αντικαταστήσουν τους επαγγελματίες πυροσβέστες. Χρειαζόμαστε περισσότερες προσλήψεις.', 4, 2, NOW() - interval '7 days'),
  (2, 5, 'for', 'Η τεχνολογία έγκαιρης προειδοποίησης έχει αποδειχθεί αποτελεσματική σε Καλιφόρνια και Αυστραλία. Ας την εφαρμόσουμε και εδώ.', 12, 1, NOW() - interval '6 days')
ON CONFLICT DO NOTHING;

-- Proposal support
INSERT INTO proposal_support (proposal_id, user_id, type) VALUES
  (1, 2, 'support'), (1, 3, 'support'), (1, 5, 'support'),
  (2, 1, 'support'), (2, 3, 'support'), (2, 4, 'support'), (2, 5, 'support'),
  (3, 1, 'oppose'), (3, 4, 'support'),
  (5, 1, 'support'), (5, 3, 'support')
ON CONFLICT DO NOTHING;

-- Fix sequences
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));
SELECT setval('communities_id_seq', (SELECT COALESCE(MAX(id), 1) FROM communities));
SELECT setval('proposals_id_seq', (SELECT COALESCE(MAX(id), 1) FROM proposals));
SELECT setval('community_members_id_seq', (SELECT COALESCE(MAX(id), 1) FROM community_members));
SELECT setval('debate_arguments_id_seq', (SELECT COALESCE(MAX(id), 1) FROM debate_arguments));
