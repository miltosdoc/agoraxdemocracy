/**
 * Deliberation Walkthrough v2
 * 
 * Revised 6-step flow based on author-as-editor model:
 * 
 * 1. Υποβολή (Proposal Submission)
 * 2. Έλεγχος (LLM Validation)
 * 3. Κρίση Συγγραφέα (Author Review — accepts/rejects amendments)
 * 4. Κρίση Κοινότητας (Community Signal — ⬆️/⬇️ on rejected amendments)
 * 5. Σύνθεση Κληρωτού Σώματος (Sortition Synthesis — composes final text)
 * 6. Επικυρωτική Ψηφοφορία (Ratification Vote)
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, CheckCircle, Users, MessageSquare, Vote, 
  ArrowRight, Clock, AlertCircle, ThumbsUp, ThumbsDown,
  Edit3, BarChart3, Shield, PenTool, TrendingUp, Check
} from 'lucide-react';

// ─── Step Data ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, name: 'Υποβολή', icon: FileText, label: 'Proposal' },
  { id: 2, name: 'Έλεγχος', icon: CheckCircle, label: 'LLM Validation' },
  { id: 3, name: 'Συγγραφέας', icon: Edit3, label: 'Author Review' },
  { id: 4, name: 'Κοινότητα', icon: TrendingUp, label: 'Community Signal' },
  { id: 5, name: 'Κλήρωση', icon: Users, label: 'Sortition Synthesis' },
  { id: 6, name: 'Ψήφος', icon: Vote, label: 'Ratification' },
];

// ─── Step 1: Proposal Submission ────────────────────────────────────────────

function StepProposal() {
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Ερώτημα *</label>
        <div className="p-3 bg-background rounded border text-sm">
          Πώς μπορούμε να βελτιώσουμε τη δημόσια συγκοινωνία στην περιοχή μας;
        </div>
      </div>
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Λύση *</label>
        <div className="p-3 bg-background rounded border text-sm">
          Εισαγωγή ηλεκτρικών λεωφορείων και επέκταση του δικτύου ποδηλατοδρόμων με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030.
        </div>
      </div>
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Κατηγορία</label>
        <Badge variant="secondary">Υποδομές</Badge>
      </div>
      <div className="flex justify-end">
        <Button className="bg-green-600 hover:bg-green-700">
          Υποβολή Προβουλευματος <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: LLM Validation ─────────────────────────────────────────────────

function StepValidation() {
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-700">Αξιολόγηση Ολοκληρώθηκε</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">Δομή:</span>
            <span className="ml-2 font-medium">8/10</span>
          </div>
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">Συγκεκριμενότητα:</span>
            <span className="ml-2 font-medium">7/10</span>
          </div>
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">Εφικτότητα:</span>
            <span className="ml-2 font-medium">8/10</span>
          </div>
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">Πληρότητα:</span>
            <span className="ml-2 font-medium">7/10</span>
          </div>
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">Διαύγεια:</span>
            <span className="ml-2 font-medium">8/10</span>
          </div>
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">Κατηγορία:</span>
            <span className="ml-2 font-medium">Υποδομές</span>
          </div>
        </div>
      </div>
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Συνολικός Βαθμός</span>
          <span className="text-2xl font-bold text-green-600">78/100</span>
        </div>
        <Progress value={78} className="h-3" />
        <div className="mt-3 text-sm space-y-1">
          <div className="flex items-center gap-2 text-red-600">
            <span className="w-16 text-xs">&lt;20:</span>
            <span>Επιστροφή στον συγγραφέα</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-600">
            <span className="w-16 text-xs">20-90:</span>
            <span>Συνέχεια με κληρωτό σώμα</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <span className="w-16 text-xs">&gt;90:</span>
            <span>Αυτόματη έγκριση</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Author Review ──────────────────────────────────────────────────

function StepAuthorReview() {
  const [reviewed, setReviewed] = useState(0);
  
  const amendments = [
    { id: 1, author: 'Γ.Σ.', type: 'βελτίωση', text: 'Να συμπεριληφθούν και σταθμοί φόρτισης ηλεκτρικών οχημάτων σε δημόσιους χώρους.', reviewed: true, decision: 'accepted' },
    { id: 2, author: 'Ε.Ν.', type: 'προσθήκη', text: 'Προσθήκη προγράμματος εκπαίδευσης οδηγών για ασφαλή οδήγηση ηλεκτρικών λεωφορείων.', reviewed: true, decision: 'rejected', reason: 'Εκτός πεδίου της πρότασης — αφορά προσωπικό, όχι υποδομές.' },
    { id: 3, author: 'Δ.Λ.', type: 'αντιπρόταση', text: 'Αντί για ηλεκτρικά λεωφορεία, να επενδυθεί σε δωρεάν εισιτήρια για μαθητές.', reviewed: false, decision: null },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Edit3 className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-700">Κρίση Συγγραφέα</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Είστε ο πρωτεύων επιμελητής. Αποδεχτείτε ή απορρίψτε κάθε τροπολογία με σύντομη αιτιολόγηση.
          Οι απορριφθείσες θα πάνε στην κοινότητα για ψήφο.
        </p>
        <div className="mt-2 text-sm">
          <span className="text-blue-600 font-medium">{reviewed}/{amendments.length}</span> έχουν εξεταστεί
        </div>
      </div>
      
      {amendments.map((amendment, i) => (
        <div key={amendment.id} className={`p-4 border rounded-lg ${
          amendment.reviewed 
            ? amendment.decision === 'accepted' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
            : 'bg-muted/30'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Από: {amendment.author}</span>
              <Badge variant="outline">{amendment.type}</Badge>
            </div>
            {amendment.reviewed && (
              <Badge variant={amendment.decision === 'accepted' ? 'default' : 'secondary'} className={
                amendment.decision === 'accepted' ? 'bg-green-600' : ''
              }>
                {amendment.decision === 'accepted' ? '✓ Αποδεκτή' : '✗ Απορριφθείσα'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{amendment.text}</p>
          
          {amendment.reviewed && amendment.decision === 'rejected' && amendment.reason && (
            <div className="p-2 bg-white rounded border text-xs text-muted-foreground mb-3">
              <strong>Αιτιολόγηση:</strong> {amendment.reason}
            </div>
          )}
          
          {!amendment.reviewed && (
            <div className="space-y-2">
              <Textarea placeholder="Αιτιολόγηση (απαιτείται για απόρριψη)..." className="min-h-[40px] text-sm" />
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => setReviewed(r => r + 1)}>
                  ✓ Αποδοχή
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setReviewed(r => r + 1)}>
                  ✗ Απόρριψη
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700" disabled={reviewed < amendments.length}>
          Ολοκλήρωση Κρίσης <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Community Signal ───────────────────────────────────────────────

function StepCommunitySignal() {
  const [upvoted, setUpvoted] = useState<number[]>([]);
  
  const rejectedAmendments = [
    { 
      id: 2, 
      author: 'Ε.Ν.', 
      text: 'Προσθήκη προγράμματος εκπαίδευσης οδηγών για ασφαλή οδήγηση ηλεκτρικών λεωφορείων.',
      authorReason: 'Εκτός πεδίου της πρότασης — αφορά προσωπικό, όχι υποδομές.',
      upvotes: 12, 
      downvotes: 3,
      threshold: 0.5,
    },
    { 
      id: 4, 
      author: 'Ι.Θ.', 
      text: 'Να ληφθούν υπόψη και οι ανάγκες ατόμων με αναπηρία στο δίκτυο ποδηλατοδρόμων.',
      authorReason: 'Πολύ γενικό — δεν προτείνει συγκεκριμένο μέτρο.',
      upvotes: 2, 
      downvotes: 8,
      threshold: 0.5,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-yellow-600" />
          <span className="font-semibold text-yellow-700">Κρίση Κοινότητας</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Ο συγγραφέας απέρριψε αυτές τις τροπολογίες. Ψηφίστε:
          <br />
          <span className="text-green-600 font-medium">⬆️ Διαφωνώ με την απόρριψη</span> ή
          <span className="text-red-600 font-medium"> ⬇️ Συμφωνώ με την απόρριψη</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Όριο κοινότητας: 50% θετικό net score → η τροπολογία πηγαίνει στο κληρωτό σώμα
        </p>
      </div>
      
      {rejectedAmendments.map(amendment => {
        const netScore = amendment.upvotes - amendment.downvotes;
        const totalVotes = amendment.upvotes + amendment.downvotes;
        const ratio = totalVotes > 0 ? netScore / totalVotes : 0;
        const flagged = ratio >= amendment.threshold && totalVotes >= 3;
        const userUpvoted = upvoted.includes(amendment.id);

        return (
          <div key={amendment.id} className={`p-4 border rounded-lg ${
            flagged ? 'bg-green-50 border-green-300' : 'bg-muted/30'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Από: {amendment.author}</span>
              </div>
              {flagged && (
                <Badge className="bg-green-600">✓ Σημειώθηκε για κληρωτό σώμα</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{amendment.text}</p>
            <div className="p-2 bg-white rounded border text-xs text-muted-foreground mb-3">
              <strong>Αιτιολόγηση συγγραφέα:</strong> {amendment.authorReason}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={userUpvoted ? "default" : "outline"}
                  className={userUpvoted ? "bg-green-600" : ""}
                  onClick={() => userUpvoted ? setUpvoted(upvoted.filter(id => id !== amendment.id)) : setUpvoted([...upvoted, amendment.id])}
                >
                  ⬆️ Διαφωνώ ({amendment.upvotes + (userUpvoted ? 1 : 0)})
                </Button>
                <Button size="sm" variant="outline" className="text-red-600">
                  ⬇️ Συμφωνώ ({amendment.downvotes})
                </Button>
              </div>
              <div className="text-sm">
                <span className={`font-medium ${flagged ? 'text-green-600' : 'text-muted-foreground'}`}>
                  Net: {netScore > 0 ? '+' : ''}{netScore} ({(ratio * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 5: Sortition Synthesis ────────────────────────────────────────────

function StepSortitionSynthesis() {
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <PenTool className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-purple-700">Σύνθεση Κληρωτού Σώματος</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Είστε μέλος του κληρωτού σώματος. Συνθέστε την τελική εκδοχή χρησιμοποιώντας:
          την πρόταση του συγγραφέα (με αποδεκτές τροπολογίες) και τις σημειωμένες τροπολογίες.
        </p>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Πρόταση Συγγραφέα (με αποδεκτές τροπολογίες)</label>
        <div className="p-3 bg-background rounded border text-sm space-y-2">
          <p>Εισαγωγή ηλεκτρικών λεωφορείων και επέκταση του δικτύου ποδηλατοδρόμων με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030.</p>
          <div className="border-l-2 border-green-500 pl-3 text-green-700 text-xs">
            [Αποδεκτή] Να συμπεριληφθούν και σταθμοί φόρτισης ηλεκτρικών οχημάτων σε δημόσιους χώρους.
          </div>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
        <label className="text-sm font-medium mb-2 block">Σημειωμένες Τροπολογίες (από κοινότητα)</label>
        <div className="p-3 bg-white rounded border text-sm">
          <p className="text-muted-foreground">
            «Να ληφθούν υπόψη και οι ανάγκες ατόμων με αναπηρία στο δίκτυο ποδηλατοδρόμων.»
            <br />
            <span className="text-xs">(Net score: +9, 75% — από: Ι.Θ.)</span>
          </p>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Τελικό Κείμενο (συνθέστε εδώ)</label>
        <Textarea 
          className="min-h-[120px] text-sm"
          defaultValue="Εισαγωγή ηλεκτρικών λεωφορείων, επέκταση του δικτύου ποδηλατοδρόμων (με προσβασιμότητα για άτομα με αναπηρία), και εγκατάσταση σταθμών φόρτισης σε δημόσιους χώρους, με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030."
        />
      </div>
      
      <div className="flex justify-end">
        <Button className="bg-purple-600 hover:bg-purple-700">
          Υποβολή Τελικού Κειμένου <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 6: Ratification Vote ──────────────────────────────────────────────

function StepRatificationVote() {
  const [voteType, setVoteType] = useState('yes_no');
  
  const voteTypes = [
    { id: 'yes_no', name: 'Ναι/Όχι', icon: Vote, desc: 'Απλή ψηφοφορία υπέρ/κατά' },
    { id: 'ranking', name: 'Κατάταξη', icon: BarChart3, desc: 'Κατάταξη προτάσεων κατά προτίμηση' },
    { id: 'multiple', name: 'Πολλαπλή Επιλογή', icon: CheckCircle, desc: 'Επιλογή πολλαπλών επιλογών' },
    { id: 'survey', name: 'Δημοσκόπηση', icon: MessageSquare, desc: 'Πολλαπλές ερωτήσεις με κλιμάκωση' },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <Vote className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-700">Επικυρωτική Ψηφοφορία</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Η κοινότητα εγκρίνει ή απορρίπτει το τελικό κείμενο που συνέθεσε το κληρωτό σώμα.
        </p>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Τελικό Κείμενο</label>
        <div className="p-3 bg-background rounded border text-sm">
          Εισαγωγή ηλεκτρικών λεωφορείων, επέκταση του δικτύου ποδηλατοδρόμων (με προσβασιμότητα για άτομα με αναπηρία), και εγκατάσταση σταθμών φόρτισης σε δημόσιους χώρους, με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030.
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-3 block">Τύπος Ψηφοφορίας</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {voteTypes.map(type => {
            const Icon = type.icon;
            const isActive = voteType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setVoteType(type.id)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  isActive ? 'border-green-500 bg-green-50' : 'border-transparent bg-background hover:border-muted'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${isActive ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div className="text-sm font-medium">{type.name}</div>
                <div className="text-xs text-muted-foreground">{type.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
      
      {voteType === 'yes_no' && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <span className="font-medium">Αποτελέσματα</span>
            <Badge variant="secondary">1,247 ψήφοι</Badge>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600 font-medium">Υπέρ</span>
                <span className="font-bold">65%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-4">
                <div className="bg-green-600 h-4 rounded-full transition-all" style={{ width: '65%' }} />
              </div>
              <span className="text-xs text-muted-foreground">810 ψήφοι</span>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-600 font-medium">Κατά</span>
                <span className="font-bold">35%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-4">
                <div className="bg-red-600 h-4 rounded-full transition-all" style={{ width: '35%' }} />
              </div>
              <span className="text-xs text-muted-foreground">437 ψήφοι</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium">Η Ψήφος Σας</span>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 bg-green-600 hover:bg-green-700">
            <ThumbsUp className="mr-2 w-4 h-4" /> Υπέρ
          </Button>
          <Button variant="outline" className="flex-1 text-red-600">
            <ThumbsDown className="mr-2 w-4 h-4" /> Κατά
          </Button>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">Ασφάλεια</span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Κάθε χρήστης ψηφίζει μία φορά</li>
          <li>• Τα αποτελέσματα είναι δημόσια και διαφανή</li>
          <li>• Κρυπτογραφημένη αποθήκευση ψήφων</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DeliberationWalkthrough() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const StepComponent = {
    1: StepProposal,
    2: StepValidation,
    3: StepAuthorReview,
    4: StepCommunitySignal,
    5: StepSortitionSynthesis,
    6: StepRatificationVote,
  }[currentStep];
  
  const currentStepData = STEPS.find(s => s.id === currentStep);
  const Icon = currentStepData?.icon || FileText;
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Ροή Διαβούλευσης</CardTitle>
        <CardDescription>
          Πλήρης διαδικασία από την υποβολή πρότασης μέχρι την επικυρωτική ψηφοφορία.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step Navigation */}
        <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            
            return (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors min-w-[80px] ${
                    isActive ? 'bg-primary/10' : isCompleted ? 'bg-green-50' : ''
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-primary text-primary-foreground' : 
                    isCompleted ? 'bg-green-600 text-white' : 'bg-muted'
                  }`}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-medium">{step.name}</span>
                </button>
                
                {index < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 mx-1 ${
                    isCompleted ? 'bg-green-600' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Step Content */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold">{currentStepData?.name}</h3>
              <p className="text-sm text-muted-foreground">{currentStepData?.label}</p>
            </div>
          </div>
          
          <StepComponent />
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            ← Προηγούμενο
          </Button>
          <span className="text-sm text-muted-foreground">
            Βήμα {currentStep} από {STEPS.length}
          </span>
          <Button
            onClick={() => setCurrentStep(Math.min(STEPS.length, currentStep + 1))}
            disabled={currentStep === STEPS.length}
          >
            Επόμενο →
          </Button>
        </div>
        
        {/* Process Summary */}
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-2">Σύνοψη Διαδικασίας</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Ο συγγραφέας καταθέτει πρόταση</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Η πρόταση αξιολογείται από LLM</span>
            </div>
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              <span>Ο συγγραφέας κρίνει τις τροπολογίες</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>Η κοινότητα ψηφίζει ⬆️/⬇️ τις απορριφθείσες</span>
            </div>
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4" />
              <span>Το κληρωτό σώμα συνθέτει την τελική εκδοχή</span>
            </div>
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4" />
              <span>Η κοινότητα εγκρίνει ή απορρίπτει</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}