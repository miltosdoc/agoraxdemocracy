/**
 * Deliberation Pipeline Walkthrough
 * 
 * Interactive demo showing the complete flow from proposal submission
 * through LLM validation, sortition, amendments, debate, and voting.
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
  Edit3, BarChart3, Shield
} from 'lucide-react';

// ─── Step Data ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, name: 'Υποβολή', icon: FileText, label: 'Proposal' },
  { id: 2, name: 'Έλεγχος', icon: CheckCircle, label: 'LLM Validation' },
  { id: 3, name: 'Κλήρωση', icon: Users, label: 'Sortition' },
  { id: 4, name: 'Διόρθωση', icon: Edit3, label: 'Amendments' },
  { id: 5, name: 'Συζήτηση', icon: MessageSquare, label: 'Debate' },
  { id: 6, name: 'Ψήφος', icon: Vote, label: 'Voting' },
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
          <div className="flex items-center gap-2 text-yellow-600 font-medium">
            <span className="w-16 text-xs">20-90:</span>
            <span>Αξιολόγηση από κληρωτό σώμα ← Εδώ</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <span className="w-16 text-xs">&gt;90:</span>
            <span>Αυτόματη έγκριση</span>
          </div>
        </div>
      </div>
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Σχόλιο Αξιολόγησης</label>
        <p className="text-sm text-muted-foreground">
          Η πρόταση είναι καλά δομημένη με σαφές ερώτημα και συγκεκριμένη λύση. 
          Περιλαμβάνει μετρήσιμους στόχους (30% μείωση CO2) και χρονοδιάγραμμα (έως 2030). 
          Θα ωφελούνταν από περισσότερες λεπτομέρειες για χρηματοδότηση και υλοποίηση.
        </p>
      </div>
    </div>
  );
}

// ─── Step 3: Sortition ──────────────────────────────────────────────────────

function StepSortition() {
  const [score, setScore] = useState([50]);
  
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-700">Κληρωτό Σώμα</span>
        </div>
        <p className="text-sm text-muted-foreground">
          12 πολίτες επιλέχθηκαν τυχαία για να αξιολογήσουν αυτή την πρόταση. 
          Κάθε μέλος έχει 7 ημέρες για να υποβάλει τον βαθμό του.
        </p>
        <div className="mt-3 flex gap-2">
          {['Μ.Π.', 'Α.Κ.', 'Γ.Σ.', 'Ε.Ν.', 'Δ.Λ.', 'Ι.Θ.'].map((name, i) => (
            <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${i < 3 ? 'bg-blue-600 text-white' : 'bg-muted text-muted-foreground'}`}>
              {name}
            </div>
          ))}
          <span className="text-xs text-muted-foreground flex items-center">+6 ακόμη</span>
        </div>
        <div className="mt-2 text-sm">
          <span className="text-blue-600 font-medium">3/12</span> έχουν απαντήσει
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Ο Βαθμός Σας</label>
        <div className="flex items-center gap-4 mb-3">
          <Slider value={score} max={100} step={1} className="flex-1" />
          <span className="text-2xl font-bold w-16 text-center">{score[0]}</span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div>&lt;20: Επιστροφή · 20-90: Κληρωτό σώμα · &gt;90: Αυτόματη έγκριση</div>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Σχόλια (προαιρετικά)</label>
        <Textarea placeholder="Παρέχετε εποικοδομητικά σχόλια..." className="min-h-[60px] text-sm" />
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Παρόμοιες Προτάσεις</label>
        <div className="space-y-2 text-sm">
          <div className="p-2 bg-background rounded border flex items-center justify-between">
            <span>Βελτίωση ποδηλατοδρόμων στο κέντρο</span>
            <Badge variant="secondary">ψηφοφορία</Badge>
          </div>
          <div className="p-2 bg-background rounded border flex items-center justify-between">
            <span>Δωρεάν εισιτήρια για μαθητές</span>
            <Badge variant="outline">διαβούλευση</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Amendments ─────────────────────────────────────────────────────

function StepAmendments() {
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
        <div className="flex items-center gap-2 mb-2">
          <Edit3 className="w-5 h-5 text-yellow-600" />
          <span className="font-semibold text-yellow-700">Διευκρινιστικές Προτάσεις</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Οι διευκρινιστικές προτάσεις που ψηφίστηκαν «Υπέρ» ενσωματώνονται στην αρχική πρόταση 
          πριν από την τελική ψηφοφορία. Η αρχική πρόταση μετασχηματίζεται με βάση τις αποδεκτές αλλαγές.
        </p>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium">Αποδεκτές Διευκρινιστικές Προτάσεις</span>
          <Badge variant="default" className="bg-green-600">2 αποδεκτές</Badge>
        </div>
        <div className="space-y-3">
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Από: Γ.Σ.</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">✓ Αποδεκτή</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Να συμπεριληφθούν και σταθμοί φόρτισης ηλεκτρικών οχημάτων σε δημόσιους χώρους.
            </p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-600">✓ 8 υπέρ</span>
              <span className="text-red-600">✗ 2 κατά</span>
            </div>
          </div>
          <div className="p-3 bg-green-50 rounded border border-green-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">Από: Ε.Ν.</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">✓ Αποδεκτή</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Προσθήκη προγράμματος εκπαίδευσης οδηγών για ασφαλή οδήγηση ηλεκτρικών λεωφορείων.
            </p>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="text-green-600">✓ 5 υπέρ</span>
              <span className="text-red-600">✗ 1 κατά</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-700">Τελική Πρόταση για Ψηφοφορία</span>
        </div>
        <div className="p-3 bg-white rounded border text-sm space-y-2">
          <p><strong>Αρχική λύση:</strong> Εισαγωγή ηλεκτρικών λεωφορείων και επέκταση του δικτύου ποδηλατοδρόμων με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030.</p>
          <div className="border-l-2 border-green-500 pl-3 text-green-700">
            <p>[Βελτίωση] Να συμπεριληφθούν και σταθμοί φόρτισης ηλεκτρικών οχημάτων σε δημόσιους χώρους.</p>
          </div>
          <div className="border-l-2 border-green-500 pl-3 text-green-700">
            <p>[Προσθήκη] Προσθήκη προγράμματος εκπαίδευσης οδηγών για ασφαλή οδήγηση ηλεκτρικών λεωφορείων.</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Νέα Διευκρινιστική Πρόταση</label>
        <div className="flex gap-2 mb-2">
          <Button variant="outline" size="sm">Βελτίωση</Button>
          <Button variant="outline" size="sm">Προσθήκη</Button>
          <Button variant="outline" size="sm">Αφαίρεση</Button>
        </div>
        <Textarea placeholder="Γράψτε τη διευκρινιστική πρότασή σας..." className="min-h-[60px] text-sm" />
      </div>
    </div>
  );
}

// ─── Step 5: Debate ─────────────────────────────────────────────────────────

function StepDebate() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pro Arguments */}
        <div className="space-y-3">
          <h4 className="font-semibold text-green-600 flex items-center">
            <ThumbsUp className="mr-2 h-4 w-4" />
            Υπέρ (3)
          </h4>
          <div className="p-3 bg-background rounded border">
            <p className="text-sm mb-2">Μείωση ρύπανσης και βελτίωση ποιότητας ζωής για τους κατοίκους.</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Μ.Π. · 12 υπέρ · 1 κατά</span>
            </div>
          </div>
          <div className="p-3 bg-background rounded border">
            <p className="text-sm mb-2">Σύμφωνα με μελέτη ΕΣΔΥ, μείωση 15% ρύπανσης σε πόλεις με ηλεκτρικά λεωφορεία.</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Α.Κ. · 8 υπέρ · 0 κατά</span>
            </div>
          </div>
        </div>
        
        {/* Con Arguments */}
        <div className="space-y-3">
          <h4 className="font-semibold text-red-600 flex items-center">
            <ThumbsDown className="mr-2 h-4 w-4" />
            Κατά (2)
          </h4>
          <div className="p-3 bg-background rounded border">
            <p className="text-sm mb-2">Υψηλό αρχικό κόστος επένδυσης χωρίς σαφή πηγή χρηματοδότησης.</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Γ.Σ. · 3 υπέρ · 5 κατά</span>
            </div>
          </div>
          <div className="p-3 bg-background rounded border">
            <p className="text-sm mb-2">Χρειάζεται πρώτα βελτίωση του υπάρχοντος δικτύου πριν επένδυση σε νέα τεχνολογία.</p>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>Δ.Λ. · 4 υπέρ · 2 κατά</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">Νέο Όρισμα</label>
        <div className="flex gap-2 mb-2">
          <Button variant="default" size="sm" className="bg-green-600">Υπέρ</Button>
          <Button variant="outline" size="sm" className="text-red-600">Κατά</Button>
        </div>
        <Textarea placeholder="Γράψτε το όρισμά σας..." className="min-h-[60px] text-sm" />
      </div>
    </div>
  );
}

// ─── Step 6: Voting ─────────────────────────────────────────────────────────

function StepVoting() {
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
          <span className="font-semibold text-green-700">Ψηφοφορία Ανοιχτή</span>
        </div>
        <p className="text-sm text-muted-foreground">
          Η ψηφοφορία θα ολοκληρωθεί σε 3 ημέρες. Κάθε μέλος της κοινότητας έχει δικαίωμα ψήφου.
        </p>
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
      
      {voteType === 'ranking' && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <label className="text-sm font-medium mb-3 block">Κατάταξη Προτάσεων</label>
          <div className="space-y-2">
            {[
              { rank: 1, text: 'Ηλεκτρικά λεωφορεία + ποδηλατόδρομοι', votes: 412 },
              { rank: 2, text: 'Δωρεάν εισιτήρια για μαθητές', votes: 287 },
              { rank: 3, text: 'Βελτίωση ποδηλατοδρόμων στο κέντρο', votes: 198 },
            ].map(item => (
              <div key={item.rank} className="p-3 bg-background rounded border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                    {item.rank}
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
                <span className="text-sm font-medium">{item.votes} ψήφοι</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {voteType === 'multiple' && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <label className="text-sm font-medium mb-3 block">Επιλέξτε Όσες Επιλογές Θέλετε</label>
          <div className="space-y-2">
            {[
              { text: 'Ηλεκτρικά λεωφορεία', checked: true },
              { text: 'Ποδηλατόδρομοι', checked: true },
              { text: 'Σταθμοί φόρτισης', checked: false },
              { text: 'Εκπαίδευση οδηγών', checked: true },
            ].map((item, i) => (
              <div key={i} className="p-3 bg-background rounded border flex items-center gap-3">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                  item.checked ? 'bg-primary border-primary' : 'border-muted'
                }`}>
                  {item.checked && <div className="w-2 h-2 bg-primary-foreground rounded-sm" />}
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {voteType === 'survey' && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <label className="text-sm font-medium mb-3 block">Δημοσκόπηση - Πολλαπλές Ερωτήσεις</label>
          <div className="space-y-4">
            <div className="p-3 bg-background rounded border">
              <p className="text-sm font-medium mb-2">1. Πόσο σημαντική είναι η μείωση ρύπανσης;</p>
              <div className="flex gap-2">
                {['Κρίσιμη', 'Σημαντική', 'Μέτρια', 'Ασήμαντη'].map(opt => (
                  <Button key={opt} variant="outline" size="sm" className="text-xs">{opt}</Button>
                ))}
              </div>
            </div>
            <div className="p-3 bg-background rounded border">
              <p className="text-sm font-medium mb-2">2. Ποιο είναι το πιο σημαντικό μέτρο;</p>
              <div className="flex flex-col gap-2">
                {['Ηλεκτρικά λεωφορεία', 'Ποδηλατόδρομοι', 'Σταθμοί φόρτισης', 'Εκπαίδευση'].map(opt => (
                  <div key={opt} className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-muted" />
                    <span className="text-sm">{opt}</span>
                  </div>
                ))}
              </div>
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

// ─── Main Walkthrough Component ─────────────────────────────────────────────

export default function DeliberationWalkthrough() {
  const [activeStep, setActiveStep] = useState(1);
  
  const renderStep = (step: number) => {
    switch (step) {
      case 1: return <StepProposal />;
      case 2: return <StepValidation />;
      case 3: return <StepSortition />;
      case 4: return <StepAmendments />;
      case 5: return <StepDebate />;
      case 6: return <StepVoting />;
      default: return null;
    }
  };
  
  const currentStep = STEPS.find(s => s.id === activeStep);
  const StepIcon = currentStep?.icon || FileText;

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Ροή Διαβούλευσης</h1>
        <p className="text-muted-foreground">
          Πλήρης διαδικασία από την υποβολή πρότασης μέχρι την τελική ψηφοφορία.
        </p>
      </div>
      
      {/* Step Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = step.id === activeStep;
            const isCompleted = step.id < activeStep;
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <button
                  onClick={() => setActiveStep(step.id)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-primary/10' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive ? 'bg-primary text-primary-foreground' : 
                    isCompleted ? 'bg-green-100 text-green-600' : 'bg-muted'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium">{step.name}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${
                    step.id < activeStep ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Step Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <StepIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>{currentStep?.name}</CardTitle>
              <CardDescription>{currentStep?.label}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderStep(activeStep)}
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button 
          variant="outline" 
          disabled={activeStep === 1}
          onClick={() => setActiveStep(activeStep - 1)}
        >
          ← Προηγούμενο
        </Button>
        <span className="flex items-center text-sm text-muted-foreground">
          Βήμα {activeStep} από {STEPS.length}
        </span>
        <Button 
          disabled={activeStep === STEPS.length}
          onClick={() => setActiveStep(activeStep + 1)}
        >
          Επόμενο →
        </Button>
      </div>
      
      {/* Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Σύνοψη Διαδικασίας
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>Η πρόταση αξιολογείται από LLM με 5 κριτήρια</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Κληρωτό σώμα 12 πολιτών αξιολογεί την πρόταση</span>
            </div>
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-yellow-600" />
              <span>Η κοινότητα υποβάλλει διευκρινιστικές προτάσεις</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              <span>Δημόσια συζήτηση με ορίσματα υπέρ/κατά</span>
            </div>
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-green-600" />
              <span>Τελική ψηφοφορία με διαφανή αποτελέσματα</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}