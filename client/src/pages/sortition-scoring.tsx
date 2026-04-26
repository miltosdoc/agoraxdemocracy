/**
 * Sortition Scoring Interface
 * 
 * Interface for sortition body members to score proposals.
 * Members see the proposal, similar proposals, and submit their score.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import Footer from '@/components/layout/footer';
import { api } from '@/lib/api';
import { useTranslation } from '@/hooks/use-translation';

interface SortitionAssignment {
  id: number;
  proposalId: number;
  proposalQuestion: string;
  proposalSolution: string;
  responseDeadline: string;
  similarProposals: Array<{
    id: number;
    question: string;
    state: string;
  }>;
}

export default function SortitionScoringPage() {
  const [location] = useLocation();
  const assignmentId = location.split('/').pop();
  const { t } = useTranslation();
  
  const [assignment, setAssignment] = useState<SortitionAssignment | null>(null);
  const [score, setScore] = useState(50);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;

    // DEMO MODE: Use mock data when backend is unavailable
    api.get<SortitionAssignment>(`/api/sortition/assignments/${assignmentId}`)
      .then(resp => {
        setAssignment(resp.data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to demo data
        setAssignment({
          id: 1,
          proposalId: 1,
          proposalQuestion: 'Πώς μπορούμε να βελτιώσουμε τη δημόσια συγκοινωνία στην περιοχή μας;',
          proposalSolution: 'Εισαγωγή ηλεκτρικών λεωφορείων και επέκταση του δικτύου ποδηλατοδρόμων με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030.',
          responseDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          similarProposals: [
            { id: 2, question: 'Βελτίωση ποδηλατοδρόμων στο κέντρο', state: 'voting' },
            { id: 3, question: 'Δωρεάν εισιτήρια για μαθητές', state: 'deliberation' },
          ],
        });
        setLoading(false);
      });
  }, [assignmentId]);

  const handleSubmit = async () => {
    if (!assignmentId) return;
    
    setSubmitting(true);
    try {
      await api.post(`/api/sortition/assignments/${assignmentId}/score`, {
        score,
        feedback,
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">{t('general.loading')}</div>;
  }

  if (!assignment) {
    return <div className="flex items-center justify-center min-h-[50vh]">{t('sortition.scoring.assignmentNotFound')}</div>;
  }

  const timeRemaining = new Date(assignment.responseDeadline).getTime() - Date.now();
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));

  if (submitted) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              {t('sortition.scoring.scoreSubmitted')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{t('sortition.scoring.scoreRecorded')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('sortition.scoring.proposalReview')}</span>
            <Badge variant={hoursRemaining < 24 ? 'destructive' : 'secondary'}>
              <Clock className="w-3 h-3 mr-1" />
              {t('sortition.scoring.hoursRemaining', { hours: hoursRemaining })}
            </Badge>
          </CardTitle>
          <CardDescription>
            {t('sortition.scoring.description')}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('sortition.scoring.proposal')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('proposal.question')}</h4>
              <p>{assignment.proposalQuestion}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('sortition.scoring.proposedSolution')}</h4>
              <p>{assignment.proposalSolution}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {assignment.similarProposals.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">{t('sortition.scoring.similarProposals')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignment.similarProposals.map((p) => (
                <div key={p.id} className="p-3 border rounded">
                  <div className="font-medium text-sm">{p.question}</div>
                  <Badge variant="outline" className="mt-1">{p.state}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('sortition.scoring.yourEvaluation')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">{t('sortition.scoring.qualityScore')}</label>
                <span className="text-sm font-mono">{score}/100</span>
              </div>
              <Slider
                value={[score]}
                onValueChange={([v]) => setScore(v)}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{t('sortition.scoring.returnToAuthor')}</span>
                <span>{t('sortition.scoring.sortitionReview')}</span>
                <span>{t('sortition.scoring.autoApprove')}</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{t('sortition.scoring.feedbackOptional')}</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={t('sortition.scoring.feedbackPlaceholder')}
                rows={4}
              />
            </div>

            <div className="p-4 bg-muted rounded">
              <h4 className="text-sm font-medium mb-2">{t('sortition.scoring.scoringGuidelines')}</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>{t('sortition.scoring.guidelineLow')}</li>
                <li>{t('sortition.scoring.guidelineMid')}</li>
                <li>{t('sortition.scoring.guidelineHigh')}</li>
              </ul>
            </div>

            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? t('sortition.scoring.submitting') : t('sortition.scoring.submitScore')}
            </Button>
          </div>
        </CardContent>
      </Card>
      <Footer />
    </div>
  );
}
