# AgoraX Frontend i18n Audit Report

**Generated:** April 25, 2026  
**Scope:** `client/src/` — all hardcoded user-facing strings (Greek & English)  
**Existing i18n system:** `client/src/i18n.ts` — simple key→Greek translation map, no multi-language support yet

---

## Executive Summary

| Metric | Count |
|--------|-------|
| **Files audited** | 21 |
| **Files with hardcoded Greek strings** | 17 |
| **Files with hardcoded English strings** | 12 |
| **Total hardcoded Greek strings** | ~180 |
| **Total hardcoded English strings** | ~65 |
| **Files already using `t()` function** | 8 |
| **Files with NO i18n at all** | 11 |

### Key Findings

1. **Mixed approach**: Some files use `t()` from `@/i18n`, others have raw Greek/English inline — inconsistent.
2. **No multi-language support**: `i18n.ts` is a single `key→Greek` map. It returns the English key as fallback. Not a proper i18n library (no locale switching, no pluralization, no interpolation).
3. **Heavy Greek content**: Pages like `faq.tsx`, `how-it-works.tsx`, `terms.tsx`, `privacy.tsx`, `deliberation-walkthrough.tsx` contain **large paragraphs** of Greek legal/informational text — these will need a different strategy (e.g., markdown-based translations or CMS).
4. **Demo/fallback data**: Several pages contain Greek strings inside mock data objects (e.g., `proposal-detail.tsx` line 69, `sortition-scoring.tsx` line 57-63).

---

## Detailed File-by-File Audit

---

### 1. `client/src/pages/home-page.tsx`

**i18n usage:** ❌ None — all strings hardcoded  
**Greek strings:** 22 | **English strings:** 0 | **Total:** 22

| Line | String | Type |
|------|--------|------|
| 33 | `'Σχέδιο'` | Greek (status label) |
| 34 | `'Έλεγχος'` | Greek (status label) |
| 35 | `'Ανασκόπηση'` | Greek (status label) |
| 36 | `'Συμβουλή'` | Greek (status label) |
| 37 | `'Σύνθεση'` | Greek (status label) |
| 38 | `'Ψηφοφορία'` | Greek (status label) |
| 39 | `'Απόφαση'` | Greek (status label) |
| 52 | `Δημιουργήστε τη Δημοκρατία του Αύριο` | Greek (heading) |
| 55 | `Πλατφόρμα διαβούλευσης και συμμετοχικής διακυβέρνησης.` | Greek (description) |
| 56 | `Υποβάλετε προτάσεις, συζητάτε με την κοινότητα, και αποφασίζετε μαζί.` | Greek (description) |
| 63 | `Υπόβαλε Πρόταση` | Greek (button) |
| 67 | `Δημιούργησε Κοινότητα` | Greek (button) |
| 73 | `Σύνδεση` | Greek (button) |
| 77 | `Πώς Λειτουργεί` | Greek (button) |
| 101 | `Κοινότητες` | Greek (label) |
| 112 | `Προτάσεις` | Greek (label) |
| 123 | `Ενεργές Διαβουλεύσεις` | Greek (label) |
| 140 | `Κοινότητες` | Greek (heading) |
| 144 | `Δεν υπάρχουν κοινότητες ακόμα.` | Greek (empty state) |
| 147 | `Δημιούργησε Κοινότητα` | Greek (button) |
| 160 | `Κοινότητες` | Greek (heading) |
| 162 | `Όλες οι κοινότητες` | Greek (link) |
| 179 | `μέλη` | Greek (label) |
| 185 | `Βαθμός Δημοκρατίας` | Greek (label) |
| 207 | `Πρόσφατες Προτάσεις` | Greek (heading) |
| 211 | `Δεν υπάρχουν προτάσεις ακόμα.` | Greek (empty state) |
| 214 | `Υπόβαλε Πρόταση` | Greek (button) |
| 227 | `Πρόσφατες Προτάσεις` | Greek (heading) |
| 245 | `` `Κοινότητα #${proposal.communityId}` `` | Greek (label) |
| 266 | `Υπόβαλε Πρόταση` | Greek (step title) |
| 267 | `Δημιούργησε μια πρόταση πολιτικής και υποβέ την στην κοινότητα σου.` | Greek (step desc) |
| 271 | `Διαβούλευση` | Greek (step title) |
| 272 | `Η κοινότητα συζητά, προτείνει τροποποιήσεις, και ψηφίζει για τις ιδέες.` | Greek (step desc) |
| 276 | `Τελική Απόφαση` | Greek (step title) |
| 277 | `Το σώμα κλήρωσης συνθέτει την τελική πρόταση και η κοινότητα ψηφίζει.` | Greek (step desc) |
| 284 | `Πώς Λειτουργεί` | Greek (heading) |
| 285 | `Τρία βήματα για συμμετοχική διακυβέρνηση` | Greek (description) |
| 294 | `` Βήμα {index + 1} `` | Greek (label) |
| 313 | `Έτοιμος να συμμετάσχεις;` | Greek (heading) |
| 314 | `Γίνε μέρος της πλατφόρμας και συνεισφέρεις στη διαμόρφωση πολιτικής.` | Greek (description) |
| 319 | `Υπόβαλε Πρόταση` | Greek (button) |
| 324 | `Σύνδεση` | Greek (button) |
| 327 | `Μάθε Περισσότερα` | Greek (button) |

---

### 2. `client/src/pages/how-it-works.tsx`

**i18n usage:** ⚠️ Partial — uses `t()` for page title only, rest hardcoded  
**Greek strings:** 25 | **English strings:** 0 | **Total:** 25

| Line | String | Type |
|------|--------|------|
| 21 | `Πώς λειτουργεί το AgoraX` | Greek (heading) |
| 23 | `Το AgoraX είναι μια πλατφόρμα ψηφιακής δημοκρατίας που επιτρέπει...` | Greek (paragraph) |
| 32 | `Δημιουργία` | Greek (section title) |
| 33 | `Εγγραφείτε και δημιουργήστε νέες ψηφοφορίες...` | Greek (description) |
| 41 | `Συμμετοχή` | Greek (section title) |
| 42 | `Ψηφίστε σε ανοιχτές ψηφοφορίες...` | Greek (description) |
| 50 | `Αποτελέσματα` | Greek (section title) |
| 51 | `Δείτε τα αποτελέσματα...` | Greek (description) |
| 57 | `Διαδικασία Ψηφοφορίας` | Greek (heading) |
| 60 | `Δημιουργία λογαριασμού` | Greek (list item) |
| 61 | `Εγγραφείτε στην πλατφόρμα...` | Greek (description) |
| 64 | `Περιήγηση στις ενεργές ψηφοφορίες` | Greek (list item) |
| 65 | `Εξερευνήστε τις τρέχουσες...` | Greek (description) |
| 68 | `Συμμετοχή σε ψηφοφορία` | Greek (list item) |
| 69 | `Επιλέξτε μια ψηφοφορία...` | Greek (description) |
| 72 | `Παρακολούθηση αποτελεσμάτων` | Greek (list item) |
| 73 | `Μετά την ολοκλήρωση...` | Greek (description) |
| 79 | `Δημιουργία Ψηφοφορίας` | Greek (heading) |
| 81-88 | Multiple Greek list items | Greek (instructions) |
| 94 | `Ασφάλεια και Διαφάνεια` | Greek (heading) |
| 96-101 | Multiple Greek list items | Greek (security info) |
| 107 | `Χρειάζεστε Βοήθεια;` | Greek (heading) |
| 109-111 | Greek text with links | Greek (help text) |

---

### 3. `client/src/pages/faq.tsx`

**i18n usage:** ⚠️ Partial — uses `t()` for page title only  
**Greek strings:** 25 | **English strings:** 0 | **Total:** 25

All 10 FAQ questions and answers are in Greek (lines 33-147), plus footer section (lines 151-169). These are **long-form content paragraphs** requiring special handling.

---

### 4. `client/src/pages/auth-page.tsx`

**i18n usage:** ✅ Mostly — uses `t()` for form labels, buttons  
**Greek strings:** 4 | **English strings:** 0 | **Total:** 4

| Line | String | Type |
|------|--------|------|
| 111 | `Καλωσορίσατε στην πλατφόρμα διαβούλευσης και συμμετοχικής διακυβέρνησης` | Greek (hero heading) |
| 114 | `Η AgoraX είναι μια πλατφόρμα για διαβούλευση...` | Greek (hero description) |
| 128 | `Υποβάλετε προτάσεις` | Greek (feature title) |
| 129 | `Προτείνετε ιδέες και λύσεις...` | Greek (feature desc) |
| 139 | `Διαβουλεύεστε με την κοινότητα` | Greek (feature title) |
| 140 | `Τροπολογίες, συζήτηση και κριτική...` | Greek (feature desc) |
| 153 | `Κληρωτά σώματα αποφασίζουν` | Greek (feature title) |
| 154 | `Τυχαία επιλεγμένοι πολίτες...` | Greek (feature desc) |
| 334 | `Όνομα Επώνυμο` | Greek (placeholder) |

---

### 5. `client/src/pages/community-dashboard.tsx`

**i18n usage:** ❌ None  
**Greek strings:** 0 | **English strings:** 17 | **Total:** 17

| Line | String | Type |
|------|--------|------|
| 62 | `Loading...` | English (loading) |
| 72 | `Community not found` | English (error) |
| 84 | `Back` | English (button) |
| 99 | `members` | English (label) |
| 103 | `proposals` | English (label) |
| 107 | `Active votes` | English (label) |
| 111 | `Democracy Score` | English (label) |
| 117 | `Democracy Score` | English (label) |
| 127 | `Proposals` | English (tab) |
| 128 | `Sortition` | English (tab) |
| 129 | `Members` | English (tab) |
| 135 | `Proposals` | English (card title) |
| 139 | `No proposals yet` | English (empty state) |
| 147 | `by` | English (label) |
| 168 | `Sortition Bodies` | English (card title) |
| 171 | `No active sortition bodies` | English (empty state) |
| 179 | `Members` | English (card title) |
| 182 | `Member list coming soon` | English (placeholder) |

---

### 6. `client/src/pages/proposal-detail.tsx`

**i18n usage:** ❌ None  
**Greek strings:** 4 (in demo data) | **English strings:** 20 | **Total:** 24

| Line | String | Type |
|------|--------|------|
| 69 | `Πώς μπορούμε να βελτιώσουμε...` | Greek (demo data) |
| 70 | `Εισαγωγή ηλεκτρικών λεωφορείων...` | Greek (demo data) |
| 72 | `Δημοκράτης Παπαδόπουλος` | Greek (demo data) |
| 74 | `Πολίτες Αθήνας` | Greek (demo data) |
| 96 | `Loading...` | English (loading) |
| 100 | `Proposal not found` | English (error) |
| 113 | `Back` | English (button) |
| 122 | `by` | English (label) |
| 137 | `Proposed Solution` | English (label) |
| 142 | `Final Text (Sortition Synthesis)` | English (label) |
| 149 | `LLM Validation` | English (label) |
| 152 | `Score:` | English (label) |
| 169 | `Debate` | English (tab) |
| 173 | `Sortition` | English (tab) |
| 177 | `Vote` | English (tab) |
| 188 | `Sortition Review` | English (card title) |
| 192-196 | Multiple English status messages | English (status text) |
| 205 | `Voting` | English (card title) |
| 210 | `This proposal is currently open for voting...` | English (description) |
| 222 | `Support` | English (button) |
| 232 | `Oppose` | English (button) |
| 238 | `Your vote has been recorded` | English (message) |
| 270 | `Total votes:` | English (label) |
| 276 | `This proposal has been decided.` | English (message) |
| 310 | `Voting not yet open. Current status:` | English (message) |

---

### 7. `client/src/pages/sortition-scoring.tsx`

**i18n usage:** ❌ None  
**Greek strings:** 2 (demo data) | **English strings:** 20 | **Total:** 22

| Line | String | Type |
|------|--------|------|
| 57 | `Πώς μπορούμε να βελτιώσουμε...` | Greek (demo data) |
| 58 | `Εισαγωγή ηλεκτρικών λεωφορείων...` | Greek (demo data) |
| 61 | `Βελτίωση ποδηλατοδρόμων στο κέντρο` | Greek (demo data) |
| 62 | `Δωρεάν εισιτήρια για μαθητές` | Greek (demo data) |
| 86 | `Loading...` | English (loading) |
| 90 | `Assignment not found` | English (error) |
| 103 | `Score Submitted` | English (card title) |
| 107 | `Your score has been recorded...` | English (message) |
| 119 | `Proposal Review` | English (card title) |
| 122 | `{hoursRemaining}h remaining` | English (badge) |
| 126 | `You have been selected by sortition...` | English (description) |
| 134 | `Proposal` | English (card title) |
| 139 | `Question` | English (label) |
| 143 | `Proposed Solution` | English (label) |
| 153 | `Similar Proposals` | English (card title) |
| 170 | `Your Evaluation` | English (card title) |
| 176 | `Quality Score` | English (label) |
| 186-188 | `Return to author` / `Sortition review` / `Auto-approve` | English (labels) |
| 193 | `Feedback (optional)` | English (label) |
| 197 | `Provide constructive feedback...` | English (placeholder) |
| 203-208 | `Scoring Guidelines` + list items | English (guidelines) |
| 212 | `Submitting...` / `Submit Score` | English (button) |

---

### 8. `client/src/pages/sortition-synthesis.tsx`

**i18n usage:** ❌ None  
**Greek strings:** 12 | **English strings:** 4 | **Total:** 16

| Line | String | Type |
|------|--------|------|
| 102 | `Τελικό Κείμενο Υποβλήθηκε` | Greek (success title) |
| 104 | `Το κληρωτό σώμα ολοκλήρωσε...` | Greek (success message) |
| 116 | `Πίσω` | Greek (button) |
| 118 | `Σύνθεση Κληρωτού Σώματος` | Greek (heading) |
| 125 | `Συνθέστε την Τελική Εκδοχή` | Greek (card title) |
| 128 | `Χρησιμοποιήστε την πρόταση...` | Greek (description) |
| 129 | `Κοινότητα:` | Greek (label) |
| 146 | `Πρόταση Συγγραφέα (με αποδεκτές τροπολογίες)` | Greek (card title) |
| 161 | `Σημειωμένες Τροπολογίες (από κοινότητα)` | Greek (card title) |
| 177 | `Αιτιολόγηση συγγραφέα:` | Greek (label) |
| 190 | `Τελικό Κείμενο` | Greek (card title) |
| 192 | `Συνθέστε την τελική εκδοχή εδώ...` | Greek (description) |
| 214 | `Υποβολή...` | Greek (button loading) |
| 218 | `Υποβολή Τελικού Κειμένου` | Greek (button) |
| 63 | `Failed to load sortition input` | English (error) |
| 71 | `Final text cannot be empty` | English (error) |
| 80 | `Failed to save final text` | English (error) |
| 171 | `Net:` | English (label) |

---

### 9. `client/src/pages/deliberation-walkthrough.tsx`

**i18n usage:** ❌ None  
**Greek strings:** ~60 | **English strings:** 6 | **Total:** ~66

**This is the most string-heavy file.** Contains the entire 6-step deliberation walkthrough with extensive Greek text. Key locations:

| Line Range | Description | Count |
|------------|-------------|-------|
| 32-38 | `STEPS` array: `Υποβολή`, `Έλεγχος`, `Συγγραφέας`, `Κοινότητα`, `Κλήρωση`, `Ψήφος` | 6 Greek |
| 46-68 | Step 1 (Proposal): labels, demo data, buttons | ~7 Greek |
| 72-130 | Step 2 (Validation): evaluation scores, labels | ~15 Greek |
| 134-211 | Step 3 (Author Review): amendment review UI | ~15 Greek |
| 215-306 | Step 4 (Community Signal): voting UI | ~10 Greek |
| 310-360 | Step 5 (Sortition Synthesis): text composition | ~7 Greek |
| 364-477 | Step 6 (Ratification Vote): vote types, results | ~10 Greek |
| 502-606 | Main layout: navigation, summary | ~6 Greek |

---

### 10. `client/src/pages/amendment-community-signal.tsx`

**i18n usage:** ❌ None  
**Greek strings:** 10 | **English strings:** 3 | **Total:** 13

| Line | String | Type |
|------|--------|------|
| 106 | `Πίσω` | Greek (button) |
| 108 | `Κρίση Κοινότητας` | Greek (heading) |
| 115 | `Ψηφίστε τις Απορριφθείσες Τροπολογίες` | Greek (card title) |
| 118-121 | Greek description text | Greek (description) |
| 136 | `Δεν υπάρχουν απορριφθείσες τροπολογίες για ψήφο.` | Greek (empty state) |
| 158 | `από χρήστη #` | Greek (label) |
| 164 | `Σημειώθηκε για κληρωτό σώμα` | Greek (badge) |
| 174 | `Αιτιολόγηση συγγραφέα:` | Greek (label) |
| 187 | `⬆️ Διαφωνώ` | Greek (button) |
| 196 | `⬇️ Συμφωνώ` | Greek (button) |
| 66 | `Failed to load data` | English (error) |
| 80 | `Failed to cast vote` | English (error) |
| 201 | `Net:` | English (label) |

---

### 11. `client/src/pages/amendment-author-review.tsx`

**i18n usage:** ❌ None  
**Greek strings:** 13 | **English strings:** 3 | **Total:** 16

| Line | String | Type |
|------|--------|------|
| 104 | `Πίσω` | Greek (button) |
| 106 | `Κρίση Τροπολογιών` | Greek (heading) |
| 111 | `Είστε ο Πρωτεύων Επιμελητής` | Greek (card title) |
| 113 | `Αποδεχτείτε ή απορρίψτε...` | Greek (description) |
| 119 | `αποδεκτές` | Greek (badge) |
| 122 | `απορριφθείσες` | Greek (badge) |
| 125 | `εκκρεμείς` | Greek (badge) |
| 141 | `Δεν υπάρχουν τροπολογίες...` | Greek (empty state) |
| 157 | `από χρήστη #` | Greek (label) |
| 168 | `Αποδεκτή` / `Απορριφθείσα` | Greek (status) |
| 179 | `Αιτιολόγηση:` | Greek (label) |
| 186 | `Αιτιολόγηση (απαιτείται για απόρριψη)...` | Greek (placeholder) |
| 198 | `Αποδοχή` | Greek (button) |
| 207 | `Απόρριψη` | Greek (button) |
| 219 | `Ολοκληρώθηκε η κρίση` | Greek (message) |
| 221 | `Οι απορριφθείσες τροπολογίες θα πάνε...` | Greek (message) |
| 49 | `Failed to load amendments` | English (error) |
| 74 | `Failed to review amendment` | English (error) |
| 85 | `Failed to cast vote` | English (error) |

---

### 12. `client/src/pages/analytics-dashboard.tsx`

**i18n usage:** ✅ Full — all strings use `t()`  
**Greek strings:** 0 | **English strings:** 0 (all via `t()`)  
**Total hardcoded:** 0 ✅

Note: Chart tooltip formatters and date formatting use hardcoded patterns but these are structural, not user-facing text.

---

### 13. `client/src/pages/profile-page.tsx`

**i18n usage:** ✅ Full — all strings use `t()`  
**Greek strings:** 0 | **English strings:** 0 (all via `t()`)  
**Total hardcoded:** 0 ✅

---

### 14. `client/src/pages/terms.tsx`

**i18n usage:** ⚠️ Partial — title uses `t()`, all content is hardcoded Greek  
**Greek strings:** ~20 | **English strings:** 0 | **Total:** ~20

All legal text sections (lines 17-106) are in Greek. This is **long-form legal content** that likely needs document-level translation rather than string-level keys.

---

### 15. `client/src/pages/privacy.tsx`

**i18n usage:** ⚠️ Partial — title uses `t()`, all content is hardcoded Greek  
**Greek strings:** ~25 | **English strings:** 0 | **Total:** ~25

Similar to terms.tsx — all legal text (lines 17-161) is in Greek. **Long-form legal content** requiring document-level translation.

---

### 16. `client/src/components/layout/header.tsx`

**i18n usage:** ⚠️ Mixed — most strings use `t()`, but some are hardcoded  
**Greek strings:** 3 | **English strings:** 0 | **Total:** 3

| Line | String | Type |
|------|--------|------|
| 159 | `Διαδικασία` | Greek (button label) |
| 349 | `Κοινότητες` | Greek (menu item) |
| 356 | `Υπόβαλε Πρόταση` | Greek (menu item) |
| 364 | `Διαδικασία Διαβούλευσης` | Greek (menu item) |

---

### 17. `client/src/components/layout/bottom-nav.tsx`

**i18n usage:** ✅ Full — all strings use `t()`  
**Greek strings:** 0 | **English strings:** 0  
**Total hardcoded:** 0 ✅

---

### 18. `client/src/components/community/community-list.tsx`

**i18n usage:** ❌ None  
**Greek strings:** 8 | **English strings:** 0 | **Total:** 8

| Line | String | Type |
|------|--------|------|
| 60 | `Κοινότητες` | Greek (heading) |
| 64 | `Δημιουργία Κοινότητας` | Greek (button) |
| 72 | `Δεν υπάρχουν κοινότητες ακόμα.` | Greek (empty state) |
| 74 | `Δημιούργησε Κοινότητα` | Greek (button) |
| 86 | `Διαχειριζόμενη` / `Αυτόνομη` | Greek (badge) |
| 95 | `μέλη` | Greek (label) |
| 100 | `Βαθμός:` | Greek (label) |
| 105 | `Προβολή Κοινότητας` | Greek (button) |

---

### 19. `client/src/components/community/community-form.tsx`

**i18n usage:** ❌ None  
**Greek strings:** 14 | **English strings:** 1 | **Total:** 15

| Line | String | Type |
|------|--------|------|
| 46 | `Δημιουργία Κοινότητας` | Greek (card title) |
| 48 | `Δημιουργήστε μια νέα κοινότητα...` | Greek (description) |
| 54 | `Όνομα *` | Greek (label) |
| 59 | `π.χ. Πολίτες Αθήνας` | Greek (placeholder) |
| 65 | `Περιγραφή` | Greek (label) |
| 70 | `Περιγράψτε την κοινότητα...` | Greek (placeholder) |
| 76 | `Τύπος` | Greek (label) |
| 82 | `Αυτόνομη` | Greek (select option) |
| 83 | `Διαχειριζόμενη` | Greek (select option) |
| 89 | `Μοντέλο Διακυβέρνησης` | Greek (label) |
| 95 | `Χωρίς Διαχειριστές` | Greek (select option) |
| 96 | `Ομάδα Διαχειριστών` | Greek (select option) |
| 97 | `Υβριδικό` | Greek (select option) |
| 108 | `Δημιουργία...` / `Δημιουργία Κοινότητας` | Greek (button) |
| 111 | `Ακύρωση` | Greek (button) |
| 38 | `Failed to create community` | English (error) |

---

### 20. `client/src/components/proposal/proposal-form.tsx`

**i18n usage:** ❌ None  
**Greek strings:** 16 | **English strings:** 1 | **Total:** 17

| Line | String | Type |
|------|--------|------|
| 24 | `Εκπαίδευση` | Greek (category) |
| 25 | `Υγεία` | Greek (category) |
| 26 | `Υποδομές` | Greek (category) |
| 27 | `Περιβάλλον` | Greek (category) |
| 28 | `Οικονομία` | Greek (category) |
| 29 | `Διακυβέρνηση` | Greek (category) |
| 30 | `Άλλο` | Greek (category) |
| 74 | `Υπόβαλε Πρόταση` | Greek (card title) |
| 76 | `Υποβάλετε μια πρόταση για την κοινότητά σας...` | Greek (description) |
| 90 | `Ερώτημα` | Greek (label) |
| 94 | `Ποιο πρόβλημα θέλετε να λύσετε;` | Greek (placeholder) |
| 101 | `Περιγράψτε το πρόβλημα ή το ζήτημα...` | Greek (helper text) |
| 107 | `Λύση` | Greek (label) |
| 111 | `Ποια είναι η προτεινόμενη λύση;` | Greek (placeholder) |
| 118 | `Περιγράψτε την προτεινόμενη λύση...` | Greek (helper text) |
| 123 | `Κατηγορία` | Greek (label) |
| 129 | `Επιλέξτε κατηγορία` | Greek (placeholder) |
| 143 | `Ακύρωση` | Greek (button) |
| 149 | `Υποβολή...` | Greek (button loading) |
| 152 | `Υποβολή Προβουλευματος` | Greek (button) |
| 59 | `Failed to create proposal` | English (error) |

---

### 21. `client/src/components/debate/debate-arguments.tsx`

**i18n usage:** ❌ None  
**Greek strings:** 0 | **English strings:** 2 | **Total:** 2

| Line | String | Type |
|------|--------|------|
| 21 | `Debate Arguments` | English (card title) |
| 26 | `Debate arguments for this proposal will appear here...` | English (placeholder) |

---

### 22. `client/src/components/poll/vote-modal.tsx`

**i18n usage:** ✅ Full — all strings use `t()`  
**Greek strings:** 0 | **English strings:** 0  
**Total hardcoded:** 0 ✅

---

### 23. `client/src/components/user/verify-govgr-modal.tsx`

**i18n usage:** ❌ None  
**Greek strings:** ~30 | **English strings:** 0 | **Total:** ~30

| Line Range | Description | Count |
|------------|-------------|-------|
| 49-60 | Rejection reason labels (10 Greek strings) | 10 |
| 68 | `Παρακαλώ επιλέξτε ένα αρχείο PDF` | 1 |
| 85 | `Η επαλήθευση απέτυχε` | 1 |
| 97-99 | Toast: `Επιτυχία` / `Η ταυτότητα επαληθεύτηκε επιτυχώς` | 2 |
| 105 | `Παρουσιάστηκε σφάλμα κατά την επαλήθευση` | 1 |
| 116-117 | Toast: `Σφάλμα` / `Παρακαλώ επιλέξτε ένα αρχείο PDF` | 2 |
| 124-125 | Toast: `Σφάλμα` / `Το μέγεθος του αρχείου...` | 2 |
| 160 | `Επαλήθευση Ταυτότητας Gov.gr` | 1 |
| 163 | `Επαληθεύστε τον λογαριασμό σας...` | 1 |
| 171-173 | `Εφάπαξ Επαλήθευση` + description | 2 |
| 181-203 | Step instructions (all Greek) | ~8 |
| 223-226 | Upload step (all Greek) | 3 |
| 235-236 | `Κλικ για επιλογή PDF` / `ή σύρετε το αρχείο εδώ` | 2 |
| 259 | `Πίσω` | 1 |
| 269 | `Επαλήθευση...` | 1 |
| 274 | `Επαλήθευση Ταυτότητας` | 1 |
| 288 | `Επιτυχής Επαλήθευση!` | 1 |
| 289 | `Ο λογαριασμός σας πιστοποιήθηκε...` | 1 |
| 295 | `Όνομα στο Gov.gr:` | 1 |
| 306 | `Η Επαλήθευση Απέτυχε` | 1 |
| 312 | `Αιτία Απόρριψης` | 1 |
| 323 | `Προσπάθεια Ξανά` | 1 |
| 326 | `Κλείσιμο` | 1 |
| 209 | `Ακύρωση` | 1 |
| 212 | `Έναρξη Επαλήθευσης` | 1 |

---

## Summary Statistics

| File | Greek | English | Total | i18n Status |
|------|-------|---------|-------|-------------|
| `pages/home-page.tsx` | 22 | 0 | 22 | ❌ None |
| `pages/how-it-works.tsx` | 25 | 0 | 25 | ⚠️ Partial |
| `pages/faq.tsx` | 25 | 0 | 25 | ⚠️ Partial |
| `pages/auth-page.tsx` | 4 | 0 | 4 | ⚠️ Partial |
| `pages/community-dashboard.tsx` | 0 | 17 | 17 | ❌ None |
| `pages/proposal-detail.tsx` | 4 | 20 | 24 | ❌ None |
| `pages/sortition-scoring.tsx` | 4 | 20 | 24 | ❌ None |
| `pages/sortition-synthesis.tsx` | 12 | 4 | 16 | ❌ None |
| `pages/deliberation-walkthrough.tsx` | ~60 | 6 | ~66 | ❌ None |
| `pages/amendment-community-signal.tsx` | 10 | 3 | 13 | ❌ None |
| `pages/amendment-author-review.tsx` | 13 | 3 | 16 | ❌ None |
| `pages/analytics-dashboard.tsx` | 0 | 0 | 0 | ✅ Full |
| `pages/profile-page.tsx` | 0 | 0 | 0 | ✅ Full |
| `pages/terms.tsx` | ~20 | 0 | ~20 | ⚠️ Partial |
| `pages/privacy.tsx` | ~25 | 0 | ~25 | ⚠️ Partial |
| `components/layout/header.tsx` | 3 | 0 | 3 | ⚠️ Partial |
| `components/layout/bottom-nav.tsx` | 0 | 0 | 0 | ✅ Full |
| `components/community/community-list.tsx` | 8 | 0 | 8 | ❌ None |
| `components/community/community-form.tsx` | 14 | 1 | 15 | ❌ None |
| `components/proposal/proposal-form.tsx` | 16 | 1 | 17 | ❌ None |
| `components/debate/debate-arguments.tsx` | 0 | 2 | 2 | ❌ None |
| `components/poll/vote-modal.tsx` | 0 | 0 | 0 | ✅ Full |
| `components/user/verify-govgr-modal.tsx` | ~30 | 0 | ~30 | ❌ None |
| **TOTALS** | **~295** | **~77** | **~372** | |

---

## Recommendations

### Priority 1: Upgrade i18n infrastructure
- Replace the current `i18n.ts` key→single-translation map with a proper i18n library (e.g., `react-i18next` or `intl-messageformat`)
- Support multiple locales (el-GR, en-US) with locale switching
- Support interpolation, pluralization, and rich text

### Priority 2: Migrate high-traffic pages (short strings)
Files with the most bang-for-buck migration effort:
1. `home-page.tsx` (22 strings, high visibility)
2. `community-form.tsx` (15 strings, form UI)
3. `proposal-form.tsx` (17 strings, form UI)
4. `header.tsx` (3 remaining hardcoded strings)
5. `verify-govgr-modal.tsx` (30 strings, critical flow)

### Priority 3: Handle long-form content pages
Pages with large blocks of Greek text need a different strategy:
- `terms.tsx` / `privacy.tsx` — Legal documents, consider separate translated markdown files
- `faq.tsx` — Q&A content, consider CMS or JSON-based translations
- `how-it-works.tsx` — Instructional content, similar approach
- `deliberation-walkthrough.tsx` — Demo/walkthrough with ~66 strings, heavy Greek

### Priority 4: Standardize English-only pages
- `community-dashboard.tsx`, `proposal-detail.tsx`, `sortition-scoring.tsx` — all English, need Greek translations added via i18n keys
- `debate-arguments.tsx` — minimal, 2 English strings

### Priority 5: Demo/mock data
Several files contain Greek strings inside mock data objects used as API fallbacks. These should either be:
- Removed (if no longer needed for demo mode)
- Extracted to a separate demo data file with i18n support
