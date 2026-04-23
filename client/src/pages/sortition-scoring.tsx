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
import { api } from '@/lib/api';

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
  const [, params] = useLocation();
  const assignmentId = new URLSearchParams(params).get('id');
  
  const [assignment, setAssignment] = useState<SortitionAssignment | null>(null);
  const [score, setScore] = useState(50);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!assignmentId) return;
    
    api.get(`/api/sortition/assignments/${assignmentId}`)
      .then(resp => {
        setAssignment(resp.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  if (!assignment) {
    return <div className="flex items-center justify-center min-h-[50vh]">Assignment not found</div>;
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
              Score Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your score has been recorded. Thank you for participating in the deliberation process.</p>
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
            <span>Proposal Review</span>
            <Badge variant={hoursRemaining < 24 ? 'destructive' : 'secondary'}>
              <Clock className="w-3 h-3 mr-1" />
              {hoursRemaining}h remaining
            </Badge>
          </CardTitle>
          <CardDescription>
            You have been selected by sortition to review this proposal.
            Please evaluate it carefully and provide your score.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Proposal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Question</h4>
              <p>{assignment.proposalQuestion}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Proposed Solution</h4>
              <p>{assignment.proposalSolution}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {assignment.similarProposals.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Similar Proposals</CardTitle>
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
          <CardTitle>Your Evaluation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">Quality Score</label>
                <span className="text-sm font-mono">{score}/100</span>
              </div>
              <Slider
                value={[score]}
                onValueChange={([v]) => setScore(v)}
                max={100}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Return to author</span>
                <span>Sortition review</span>
                <span>Auto-approve</span>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Feedback (optional)</label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide constructive feedback on this proposal..."
                rows={4}
              />
            </div>

            <div className="p-4 bg-muted rounded">
              <h4 className="text-sm font-medium mb-2">Scoring Guidelines</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><strong>&lt;20:</strong> Proposal should be returned to author for revision</li>
                <li><strong>20-90:</strong> Proposal needs sortition panel review</li>
                <li><strong>&gt;90:</strong> Proposal is well-structured and ready for deliberation</li>
              </ul>
            </div>

            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Score'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
