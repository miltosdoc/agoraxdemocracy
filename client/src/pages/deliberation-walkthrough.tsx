/**
 * Deliberation Walkthrough v2
 * 
 * Revised 6-step flow based on author-as-editor model:
 * 
 * 1. Submission (Proposal Submission)
 * 2. Validation (LLM Validation)
 * 3. Author Review (accepts/rejects amendments)
 * 4. Community Signal (⬆️/⬇️ on rejected amendments)
 * 5. Sortition Synthesis (composes final text)
 * 6. Ratification Vote
 */

import { useState } from 'react';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
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
import { useTranslation } from '@/hooks/use-translation';

// ─── Step Data ──────────────────────────────────────────────────────────────

function useStepData() {
  const { t } = useTranslation();
  return [
    { id: 1, name: t('walkthrough.step1_name'), icon: FileText, label: 'Proposal' },
    { id: 2, name: t('walkthrough.step2_name'), icon: CheckCircle, label: 'LLM Validation' },
    { id: 3, name: t('walkthrough.step3_name'), icon: Edit3, label: 'Author Review' },
    { id: 4, name: t('walkthrough.step4_name'), icon: TrendingUp, label: 'Community Signal' },
    { id: 5, name: t('walkthrough.step5_name'), icon: Users, label: 'Sortition Synthesis' },
    { id: 6, name: t('walkthrough.step6_name'), icon: Vote, label: 'Ratification' },
  ];
}

// ─── Step 1: Proposal Submission ────────────────────────────────────────────

function StepProposal() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">{t('proposal.question_label')} *</label>
        <div className="p-3 bg-background rounded border text-sm">
          Πώς μπορούμε να βελτιώσουμε τη δημόσια συγκοινωνία στην περιοχή μας;
        </div>
      </div>
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">{t('proposal.solution_label')} *</label>
        <div className="p-3 bg-background rounded border text-sm">
          Εισαγωγή ηλεκτρικών λεωφορείων και επέκταση του δικτύου ποδηλατοδρόμων με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030.
        </div>
      </div>
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">{t('proposal.category_label')}</label>
        <Badge variant="secondary">{t('proposal.category_infrastructure')}</Badge>
      </div>
      <div className="flex justify-end">
        <Button className="bg-green-600 hover:bg-green-700">
          {t('walkthrough.submit_proposal')} <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: LLM Validation ─────────────────────────────────────────────────

function StepValidation() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-700">{t('walkthrough.validation_complete')}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">{t('walkthrough.score_structure')}:</span>
            <span className="ml-2 font-medium">8/10</span>
          </div>
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">{t('walkthrough.score_specificity')}:</span>
            <span className="ml-2 font-medium">7/10</span>
          </div>
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">{t('walkthrough.score_feasibility')}:</span>
            <span className="ml-2 font-medium">8/10</span>
          </div>
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">{t('walkthrough.score_completeness')}:</span>
            <span className="ml-2 font-medium">7/10</span>
          </div>
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">{t('walkthrough.score_transparency')}:</span>
            <span className="ml-2 font-medium">8/10</span>
          </div>
          <div className="p-2 bg-white rounded">
            <span className="text-muted-foreground">{t('proposal.category_label')}:</span>
            <span className="ml-2 font-medium">{t('proposal.category_infrastructure')}</span>
          </div>
        </div>
      </div>
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">{t('walkthrough.total_score')}</span>
          <span className="text-2xl font-bold text-green-600">78/100</span>
        </div>
        <Progress value={78} className="h-3" />
        <div className="mt-3 text-sm space-y-1">
          <div className="flex items-center gap-2 text-red-600">
            <span className="w-16 text-xs">&lt;20:</span>
            <span>{t('walkthrough.threshold_return')}</span>
          </div>
          <div className="flex items-center gap-2 text-yellow-600">
            <span className="w-16 text-xs">20-90:</span>
            <span>{t('walkthrough.threshold_sortition')}</span>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <span className="w-16 text-xs">&gt;90:</span>
            <span>{t('walkthrough.threshold_auto')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Author Review ──────────────────────────────────────────────────

function StepAuthorReview() {
  const { t } = useTranslation();
  const [reviewed, setReviewed] = useState(0);
  
  const amendments = [
    { id: 1, author: 'Γ.Σ.', type: t('walkthrough.amendment_improvement'), text: 'Να συμπεριληφθούν και σταθμοί φόρτισης ηλεκτρικών οχημάτων σε δημόσιους χώρους.', reviewed: true, decision: 'accepted' },
    { id: 2, author: 'Ε.Ν.', type: t('walkthrough.amendment_addition'), text: 'Προσθήκη προγράμματος εκπαίδευσης οδηγών για ασφαλή οδήγηση ηλεκτρικών λεωφορείων.', reviewed: true, decision: 'rejected', reason: 'Εκτός πεδίου της πρότασης — αφορά προσωπικό, όχι υποδομές.' },
    { id: 3, author: 'Δ.Λ.', type: t('walkthrough.amendment_counter'), text: 'Αντί για ηλεκτρικά λεωφορεία, να επενδυθεί σε δωρεάν εισιτήρια για μαθητές.', reviewed: false, decision: null },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Edit3 className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-700">{t('walkthrough.author_review')}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('walkthrough.author_review_description')}
        </p>
        <div className="mt-2 text-sm">
          <span className="text-blue-600 font-medium">{reviewed}/{amendments.length}</span> {t('walkthrough.reviewed_count')}
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
              <span className="text-sm font-medium">{t('common.from')}: {amendment.author}</span>
              <Badge variant="outline">{amendment.type}</Badge>
            </div>
            {amendment.reviewed && (
              <Badge variant={amendment.decision === 'accepted' ? 'default' : 'secondary'} className={
                amendment.decision === 'accepted' ? 'bg-green-600' : ''
              }>
                {amendment.decision === 'accepted' ? `✓ ${t('walkthrough.accepted')}` : `✗ ${t('walkthrough.rejected')}`}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mb-3">{amendment.text}</p>
          
          {amendment.reviewed && amendment.decision === 'rejected' && amendment.reason && (
            <div className="p-2 bg-white rounded border text-xs text-muted-foreground mb-3">
              <strong>{t('walkthrough.justification')}:</strong> {amendment.reason}
            </div>
          )}
          
          {!amendment.reviewed && (
            <div className="space-y-2">
              <Textarea placeholder={t('walkthrough.justification_placeholder')} className="min-h-[40px] text-sm" />
              <div className="flex gap-2">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => setReviewed(r => r + 1)}>
                  ✓ {t('walkthrough.accept')}
                </Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setReviewed(r => r + 1)}>
                  ✗ {t('walkthrough.reject')}
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
      
      <div className="flex justify-end">
        <Button className="bg-blue-600 hover:bg-blue-700" disabled={reviewed < amendments.length}>
          {t('walkthrough.complete_review')} <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 4: Community Signal ───────────────────────────────────────────────

function StepCommunitySignal() {
  const { t } = useTranslation();
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
          <span className="font-semibold text-yellow-700">{t('walkthrough.community_signal')}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('walkthrough.community_signal_description')}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t('walkthrough.community_threshold')}
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
                <span className="text-sm font-medium">{t('common.from')}: {amendment.author}</span>
              </div>
              {flagged && (
                <Badge className="bg-green-600">✓ {t('walkthrough.flagged_for_sortition')}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{amendment.text}</p>
            <div className="p-2 bg-white rounded border text-xs text-muted-foreground mb-3">
              <strong>{t('walkthrough.author_justification')}:</strong> {amendment.authorReason}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant={userUpvoted ? "default" : "outline"}
                  className={userUpvoted ? "bg-green-600" : ""}
                  onClick={() => userUpvoted ? setUpvoted(upvoted.filter(id => id !== amendment.id)) : setUpvoted([...upvoted, amendment.id])}
                >
                  ⬆️ {t('walkthrough.disagree_rejection')} ({amendment.upvotes + (userUpvoted ? 1 : 0)})
                </Button>
                <Button size="sm" variant="outline" className="text-red-600">
                  ⬇️ {t('walkthrough.agree_rejection')} ({amendment.downvotes})
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
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-purple-50 border-purple-200">
        <div className="flex items-center gap-2 mb-2">
          <PenTool className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-purple-700">{t('walkthrough.sortition_synthesis')}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('walkthrough.sortition_synthesis_description')}
        </p>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">{t('walkthrough.author_proposal_accepted')}</label>
        <div className="p-3 bg-background rounded border text-sm space-y-2">
          <p>Εισαγωγή ηλεκτρικών λεωφορείων και επέκταση του δικτύου ποδηλατοδρόμων με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030.</p>
          <div className="border-l-2 border-green-500 pl-3 text-green-700 text-xs">
            [{t('walkthrough.accepted')}] Να συμπεριληφθούν και σταθμοί φόρτισης ηλεκτρικών οχημάτων σε δημόσιους χώρους.
          </div>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
        <label className="text-sm font-medium mb-2 block">{t('walkthrough.flagged_amendments_community')}</label>
        <div className="p-3 bg-white rounded border text-sm">
          <p className="text-muted-foreground">
            «Να ληφθούν υπόψη και οι ανάγκες ατόμων με αναπηρία στο δίκτυο ποδηλατοδρόμων.»
          </p>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">{t('walkthrough.final_text_compose')}</label>
        <Textarea 
          className="min-h-[120px] text-sm"
          defaultValue="Εισαγωγή ηλεκτρικών λεωφορείων, επέκταση του δικτύου ποδηλατοδρόμων (με προσβασιμότητα για άτομα με αναπηρία), και εγκατάσταση σταθμών φόρτισης σε δημόσιους χώρους, με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030."
        />
      </div>
      
      <div className="flex justify-end">
        <Button className="bg-purple-600 hover:bg-purple-700">
          {t('walkthrough.submit_final_text')} <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 6: Ratification Vote ──────────────────────────────────────────────

function StepRatificationVote() {
  const { t } = useTranslation();
  const [voteType, setVoteType] = useState('yes_no');
  
  const voteTypes = [
    { id: 'yes_no', name: t('walkthrough.vote_yes_no'), icon: Vote, desc: t('walkthrough.vote_yes_no_desc') },
    { id: 'ranking', name: t('walkthrough.vote_ranking'), icon: BarChart3, desc: t('walkthrough.vote_ranking_desc') },
    { id: 'multiple', name: t('walkthrough.vote_multiple'), icon: CheckCircle, desc: t('walkthrough.vote_multiple_desc') },
    { id: 'survey', name: t('walkthrough.vote_survey'), icon: MessageSquare, desc: t('walkthrough.vote_survey_desc') },
  ];

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-green-50 border-green-200">
        <div className="flex items-center gap-2 mb-2">
          <Vote className="w-5 h-5 text-green-600" />
          <span className="font-semibold text-green-700">{t('walkthrough.ratification_vote')}</span>
        </div>
        <p className="text-sm text-muted-foreground">
          {t('walkthrough.ratification_description')}
        </p>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-2 block">{t('walkthrough.final_text')}</label>
        <div className="p-3 bg-background rounded border text-sm">
          Εισαγωγή ηλεκτρικών λεωφορείων, επέκταση του δικτύου ποδηλατοδρόμων (με προσβασιμότητα για άτομα με αναπηρία), και εγκατάσταση σταθμών φόρτισης σε δημόσιους χώρους, με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030.
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <label className="text-sm font-medium mb-3 block">{t('walkthrough.vote_type')}</label>
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
            <span className="font-medium">{t('walkthrough.results')}</span>
            <Badge variant="secondary">1,247 {t('walkthrough.votes')}</Badge>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-green-600 font-medium">{t('walkthrough.for')}</span>
                <span className="font-bold">65%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-4">
                <div className="bg-green-600 h-4 rounded-full transition-all" style={{ width: '65%' }} />
              </div>
              <span className="text-xs text-muted-foreground">810 {t('walkthrough.votes')}</span>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-red-600 font-medium">{t('walkthrough.against')}</span>
                <span className="font-bold">35%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-4">
                <div className="bg-red-600 h-4 rounded-full transition-all" style={{ width: '35%' }} />
              </div>
              <span className="text-xs text-muted-foreground">437 {t('walkthrough.votes')}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium">{t('walkthrough.your_vote')}</span>
          <Clock className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex gap-3">
          <Button className="flex-1 bg-green-600 hover:bg-green-700">
            <ThumbsUp className="mr-2 w-4 h-4" /> {t('walkthrough.for')}
          </Button>
          <Button variant="outline" className="flex-1 text-red-600">
            <ThumbsDown className="mr-2 w-4 h-4" /> {t('walkthrough.against')}
          </Button>
        </div>
      </div>
      
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium">{t('walkthrough.security')}</span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• {t('walkthrough.security_one_vote')}</li>
          <li>• {t('walkthrough.security_public_results')}</li>
          <li>• {t('walkthrough.security_encrypted')}</li>
        </ul>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function DeliberationWalkthrough() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const STEPS = useStepData();
  
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
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-grow flex items-start justify-center py-6">
      <Card className="w-full max-w-4xl mx-auto">

        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            {currentStepData?.name}
          </CardTitle>
          <CardDescription>
            {currentStep === 1 && t('walkthrough.step1_desc')}
            {currentStep === 2 && t('walkthrough.step2_desc')}
            {currentStep === 3 && t('walkthrough.step3_desc')}
            {currentStep === 4 && t('walkthrough.step4_desc')}
            {currentStep === 5 && t('walkthrough.step5_desc')}
            {currentStep === 6 && t('walkthrough.step6_desc')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {STEPS.map(step => {
              const StepIcon = step.icon;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    currentStep === step.id
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step.id
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <StepIcon className="w-3.5 h-3.5" />
                  {step.name}
                </button>
              );
            })}
          </div>

          {/* Step content */}
          {StepComponent && <StepComponent />}
        </CardContent>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(s => Math.max(1, s - 1))}
            disabled={currentStep === 1}
          >
            ← {t('walkthrough.previous')}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t('walkthrough.step')} {currentStep} {t('walkthrough.of')} {STEPS.length}
          </span>
          <Button
            onClick={() => setCurrentStep(s => Math.min(STEPS.length, s + 1))}
            disabled={currentStep === STEPS.length}
          >
            {t('walkthrough.next')} →
          </Button>
        </div>

        {/* Process Summary */}
        <div className="px-6 pb-6">
          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">{t('walkthrough.process_summary')}</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {STEPS.map((step, i) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.id} className={`flex items-center gap-2 p-2 rounded ${
                    currentStep === step.id ? 'bg-primary/10' : ''
                  }`}>
                    <StepIcon className={`w-4 h-4 ${currentStep === step.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={currentStep === step.id ? 'font-medium' : 'text-muted-foreground'}>
                      {i === 0 && t('walkthrough.summary_submit')}
                      {i === 1 && t('walkthrough.summary_validate')}
                      {i === 2 && t('walkthrough.summary_author')}
                      {i === 3 && t('walkthrough.summary_community')}
                      {i === 4 && t('walkthrough.summary_sortition')}
                      {i === 5 && t('walkthrough.summary_ratify')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
      </div>
      <Footer />
    </div>
  );
}
