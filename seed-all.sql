-- Seed all demo data for AgoraX - FIXED VERSION
-- Run: psql -U meditalks -d agorax -f seed-all.sql

-- ═══════════════════════════════════════════════════════════════════════════
-- USERS (already seeded, skip if exists)
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- COMMUNITIES
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO communities (name, description, type, governance_model, creator_id, sortition_size, sortition_response_hours, democracy_score, amendment_threshold, max_amendments_per_proposal) VALUES
('Πολίτες Αθηνών', 'Κοινότητα πολιτών της Αθήνας για τοπικά θέματα', 'autonomous', 'no_admin', 1, 20, 72, 72, 0.5, -1),
('Περιβάλλον & Βιωσιμότητα', 'Θέματα περιβάλλοντος και βιώσιμης ανάπτυξης', 'autonomous', 'no_admin', 2, 15, 48, 65, 0.5, -1),
('Εκπαίδευση & Νεολαία', 'Θέματα εκπαίδευσης και νεολαίας', 'autonomous', 'no_admin', 3, 10, 48, 58, 0.5, -1),
('Τεχνολογία & Καινοτομία', 'Ψηφιακός μετασχηματισμός και τεχνολογία', 'managed', 'hybrid', 4, 25, 72, 80, 0.5, -1),
('Υγεία & Κοινωνική Προστασία', 'Θέματα δημόσιας υγείας και κοινωνικής πολιτικής', 'managed', 'hybrid', 5, 20, 72, 75, 0.5, -1),
('Πολιτισμός & Αθλητισμός', 'Πολιτιστικές και αθλητικές δραστηριότητες', 'autonomous', 'no_admin', 6, 10, 48, 55, 0.5, -1);

-- Add members to communities
INSERT INTO community_members (community_id, user_id, role) VALUES
(1, 1, 'admin'), (1, 2, 'member'), (1, 3, 'member'), (1, 4, 'member'), (1, 5, 'member'),
(2, 2, 'admin'), (2, 6, 'member'), (2, 7, 'member'),
(3, 3, 'admin'), (3, 8, 'member'), (3, 9, 'member'),
(4, 4, 'admin'), (4, 10, 'member'),
(5, 5, 'admin'), (5, 11, 'member'),
(6, 6, 'admin'), (6, 7, 'member'), (6, 8, 'member');

-- ═══════════════════════════════════════════════════════════════════════════
-- PROPOSALS - ALL 7 STAGES
-- ═══════════════════════════════════════════════════════════════════════════

-- Stage 1: DRAFT (author still editing)
INSERT INTO proposals (community_id, author_id, question, solution, status, category, created_at, updated_at)
VALUES (
  1, 1,
  'Πώς μπορούμε να βελτιώσουμε τη δημόσια συγκοινωνία στην Αθήνα;',
  'Εισαγωγή ηλεκτρικών λεωφορείων, επέκταση του μετρό, και δωρεάν εισιτήρια για νέους κάτω των 25 ετών.',
  'draft', 'Δημόσια Διοίκηση',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '29 days'
);

-- Stage 2: REVIEW (submitted for LLM validation)
INSERT INTO proposals (community_id, author_id, question, solution, status, llm_score, llm_feedback, category, created_at, updated_at)
VALUES (
  2, 2,
  'Πώς μπορούμε να μειώσουμε τα πλαστικά στη θάλασσα;',
  'Απαγόρευση μονοχρήστων πλαστικών, κίνητρα για ανακύκλωση, και πρόγραμμα καθαρισμού παραλιών.',
  'review', 85, 'Ισχυρή πρόταση με σαφή ερώτημα και λύση. Προτείνεται περαιτέρω αναλυτική περιγραφή του προγράμματος καθαρισμού.',
  'Περιβάλλον',
  NOW() - INTERVAL '25 days',
  NOW() - INTERVAL '24 days'
);

-- Stage 3: AUTHOR_REVIEW (author reviewing amendments)
INSERT INTO proposals (community_id, author_id, question, solution, status, llm_score, llm_feedback, category, created_at, updated_at)
VALUES (
  3, 3,
  'Πώς μπορούμε να βελτιώσουμε την εκπαίδευση στις περιοχές με χαμηλό εισόδημα;',
  'Δωρεάν πρόσβαση σε ψηφιακά εκπαιδευτικά υλικά, επιδόματα για σχολικά βιβλία, και προγράμματα mentoring από εθελοντές.',
  'author_review', 92, 'Εξαιρετική πρόταση με κοινωνική διάσταση. Σαφής ερώτημα και πρακτικές λύσεις.',
  'Παιδεία',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '18 days'
);

-- Stage 4: COMMUNITY_SIGNAL (community voting on rejected amendments)
INSERT INTO proposals (community_id, author_id, question, solution, status, llm_score, llm_feedback, category, created_at, updated_at)
VALUES (
  1, 4,
  'Πώς μπορούμε να προστατεύσουμε τα ιστορικά μνημεία της Αθήνας;',
  'Ψηφιακή τεκμηρίωση μνημείων, αυστηρότερος έλεγχος οικοδομικών αδειών κοντά σε αρχαιολογικούς χώρους, και πρόγραμμα εθελοντικής φροντίδας.',
  'community_signal', 88, 'Ισχυρή πρόταση με πολιτισμική σημασία. Προτείνεται προσθήκη προϋπολογισμού.',
  'Πολιτισμός',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '12 days'
);

-- Stage 5: SORTITION_SYNTHESIS (sortition body composing final text)
INSERT INTO proposals (community_id, author_id, question, solution, status, llm_score, llm_feedback, category, created_at, updated_at)
VALUES (
  2, 5,
  'Πώς μπορούμε να προωθήσουμε τις ανανεώσιμες πηγές ενέργειας;',
  'Ενίσχυση φωτοβολταϊκών σε δημόσια κτίρια, κίνητρα για οικιακά φωτοβολταϊκά, και δημιουργία green jobs.',
  'sortition_synthesis', 90, 'Πολύ ισχυρή πρόταση με περιβαλλοντική και οικονομική διάσταση.',
  'Ενέργεια',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '8 days'
);

-- Stage 6: VOTING (final community vote)
INSERT INTO proposals (community_id, author_id, question, solution, final_text, status, llm_score, llm_feedback, sortition_avg_score, category, created_at, updated_at)
VALUES (
  5, 6,
  'Πώς μπορούμε να βελτιώσουμε την υγεία των πολιτών;',
  'Δωρεάν προληπτικοί έλεγχοι, προγράμματα άσκησης σε δημόσιους χώρους, και εκπαίδευση για υγιεινή διατροφή.',
  'Τελικό κείμενο από το κληρωτό σώμα: Εισαγωγή δωρεάν προληπτικών ελέγχων για όλους τους πολίτες άνω των 40 ετών, δημιουργία προγραμμάτων άσκησης σε δημόσιους χώρους με εθελοντές προπονητές, και εκστρατεία εκπαίδευσης για υγιεινή διατροφή στα σχολεία και τα δημόσια κτίρια.',
  'voting', 95, 'Εξαιρετική πρόταση με ευρεία κοινωνική επίδραση.', 8.5,
  'Υγεία',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 days'
);

-- Stage 7: DECIDED (vote completed)
INSERT INTO proposals (community_id, author_id, question, solution, final_text, status, llm_score, llm_feedback, sortition_avg_score, category, created_at, updated_at)
VALUES (
  1, 7,
  'Πώς μπορούμε να ενισχύσουμε τη συμμετοχική δημοκρατία;',
  'Δημιουργία πλατφόρμας ψηφιακής διαβούλευσης, τακτικά δημοψηφίσματα σε τοπικό επίπεδο, και εκπαίδευση πολιτών.',
  'Τελικό κείμενο από το κληρωτό σώμα: Εισαγωγή πλατφόρμας ψηφιακής διαβούλευσης για όλους τους πολίτες, τακτικά δημοψηφίσματα σε τοπικό επίπεδο κάθε έτος, και πρόγραμμα εκπαίδευσης πολιτών στα σχολεία και τα δημόσια κτίρια. Η υλοποίηση θα γίνει σε φάσεις με αρχικό προϋπολογισμό 500.000€.',
  'decided', 97, 'Ιδανική πρόταση με σαφή στόχους και πρακτική υλοποίηση.', 9.2,
  'Δημοκρατία',
  NOW() - INTERVAL '60 days',
  NOW() - INTERVAL '2 days'
);

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════════

SELECT '── USERS ──' as info;
SELECT id, username, name FROM users ORDER BY id;

SELECT '── COMMUNITIES ──' as info;
SELECT id, name, type, governance_model, democracy_score FROM communities ORDER BY id;

SELECT '── PROPOSALS ──' as info;
SELECT id, community_id, status, LEFT(question, 40) as question, category FROM proposals ORDER BY id;
