-- Seed demo proposals across all deliberation stages
-- Run: psql -U meditalks -d agorax -f seed-proposals.sql

-- Stage 1: draft (author still editing)
INSERT INTO proposals (community_id, author_id, question, solution, status, category, created_at, updated_at)
VALUES (
  1, 1,
  'Πώς μπορούμε να βελτιώσουμε τη δημόσια συγκοινωνία στην Αθήνα;',
  'Εισαγωγή ηλεκτρικών λεωφορείων, επέκταση του μετρό, και δωρεάν εισιτήρια για νέους κάτω των 25 ετών.',
  'draft', 'Δημόσια Διοίκηση',
  NOW() - INTERVAL '30 days',
  NOW() - INTERVAL '29 days'
);

-- Stage 2: review (submitted for LLM validation)
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

-- Stage 3: author_review (author reviewing amendments)
INSERT INTO proposals (community_id, author_id, question, solution, status, llm_score, category, created_at, updated_at)
VALUES (
  3, 3,
  'Πώς μπορούμε να βελτιώσουμε την εκπαίδευση στις περιοχές με χαμηλό εισόδημα;',
  'Δωρεάν πρόσβαση σε ψηφιακά εκπαιδευτικά υλικά, επιδόματα για σχολικά βιβλία, και προγράμματα mentoring από εθελοντές.',
  'author_review', 92, 'Εξαιρετική πρόταση με κοινωνική διάσταση. Σαφής ερώτημα και πρακτικές λύσεις.',
  'Παιδεία',
  NOW() - INTERVAL '20 days',
  NOW() - INTERVAL '18 days'
);

-- Stage 4: community_signal (community voting on rejected amendments)
INSERT INTO proposals (community_id, author_id, question, solution, status, llm_score, category, created_at, updated_at)
VALUES (
  1, 4,
  'Πώς μπορούμε να προστατεύσουμε τα ιστορικά μνημεία της Αθήνας;',
  'Ψηφιακή τεκμηρίωση μνημείων, αυστηρότερος έλεγχος οικοδομικών αδειών κοντά σε αρχαιολογικούς χώρους, και πρόγραμμα εθελοντικής φροντίδας.',
  'community_signal', 88, 'Ισχυρή πρόταση με πολιτισμική σημασία. Προτείνεται προσθήκη προϋπολογισμού.',
  'Πολιτισμός',
  NOW() - INTERVAL '15 days',
  NOW() - INTERVAL '12 days'
);

-- Stage 5: sortition_synthesis (sortition body composing final text)
INSERT INTO proposals (community_id, author_id, question, solution, status, llm_score, category, created_at, updated_at)
VALUES (
  2, 5,
  'Πώς μπορούμε να προωθήσουμε τις ανανεώσιμες πηγές ενέργειας;',
  'Ενίσχυση φωτοβολταϊκών σε δημόσια κτίρια, κίνητρα για οικιακά φωτοβολταϊκά, και δημιουργία green jobs.',
  'sortition_synthesis', 90, 'Πολύ ισχυρή πρόταση με περιβαλλοντική και οικονομική διάσταση.',
  'Ενέργεια',
  NOW() - INTERVAL '10 days',
  NOW() - INTERVAL '8 days'
);

-- Stage 6: voting (final community vote)
INSERT INTO proposals (community_id, author_id, question, solution, final_text, status, llm_score, sortition_avg_score, category, created_at, updated_at)
VALUES (
  3, 6,
  'Πώς μπορούμε να βελτιώσουμε την υγεία των πολιτών;',
  'Δωρεάν προληπτικοί έλεγχοι, προγράμματα άσκησης σε δημόσιους χώρους, και εκπαίδευση για υγιεινή διατροφή.',
  'Τελικό κείμενο από το κληρωτό σώμα: Εισαγωγή δωρεάν προληπτικών ελέγχων για όλους τους πολίτες άνω των 40 ετών, δημιουργία προγραμμάτων άσκησης σε δημόσιους χώρους με εθελοντές προπονητές, και εκστρατεία εκπαίδευσης για υγιεινή διατροφή στα σχολεία και τα δημόσια κτίρια.',
  'voting', 95, 'Εξαιρετική πρόταση με ευρεία κοινωνική επίδραση.', 8.5,
  'Υγεία',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '3 days'
);

-- Stage 7: decided (vote completed)
INSERT INTO proposals (community_id, author_id, question, solution, final_text, status, llm_score, sortition_avg_score, category, created_at, updated_at)
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

-- Verify the seed
SELECT id, community_id, status, question, category FROM proposals ORDER BY id;
