/**
 * Proposal Detail Page — Full workspace with tabs:
 * Overview, Debate, Amendments, Sortition, Votes
 * 
 * Integrates: NextActionPanel, DebatePanel, AmendmentsPanel,
 * SortitionPanel, VotePanel
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, Vote, Users, FileText, Eye } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import AppShell from '@/components/layout/AppShell';
import LifecycleStepper from '@/components/ui/LifecycleStepper';
import NextActionPanel from '@/components/proposal/NextActionPanel';
import { DebatePanel } from '@/components/debate/DebatePanel';
import { AmendmentsPanel } from '@/components/proposal/AmendmentsPanel';
import { SortitionPanel } from '@/components/proposal/SortitionPanel';
import VotePanel from '@/components/voting/VotePanel';
import { getStatusForProposal } from '@/lib/proposal-status';
import { useTranslation, getStatusLabel } from '@/hooks/use-translation';

interface Proposal {
  id: number;
  question: string;
  solution: string;
  status: string;
  authorId: number;
  authorName?: string;
  communityId: number;
  communityName?: string;
  createdAt: string;
  llmScore?: string | null;
  llmFeedback?: string | null;
  finalText?: string | null;
  category?: string;
}

export default function ProposalDetailPage() {
  const [location] = useLocation();
  const proposalId = location.split('/').pop();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!proposalId) return;

    api.get<Proposal>(`/api/proposals/${proposalId}`)
      .then(resp => setProposal(resp.data))
      .catch(() => {
        // Fallback to demo data
        setProposal({
          id: parseInt(proposalId) || 1,
          question: 'Πώς μπορούμε να βελτιώσουμε τη δημόσια συγκοινωνία;',
          solution: 'Εισαγωγή ηλεκτρικών λεωφορείων και επέκταση ποδηλατοδρόμων.',
          status: 'voting',
          authorId: 1,
          authorName: 'Δημοκράτης Παπαδόπουλος',
          communityId: 1,
          communityName: 'Πολίτες Αθήνας',
          createdAt: new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));
  }, [proposalId]);

  const handleFinalize = async () => {
    if (!proposalId || finalizing) return;
    setFinalizing(true);
    try {
      const resp = await api.post<{ proposal: Proposal }>(`/api/proposals/${proposalId}/finalize`);
      setProposal(resp.data.proposal);
    } catch (error) {
      setVoteError(error instanceof ApiError ? error.message : t('proposal.finalizeFailed'));
    } finally {
      setFinalizing(false);
    }
  };

  const handleProposalAdvanced = (newStatus: string) => {
    if (proposal) {
      setProposal({ ...proposal, status: newStatus });
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[40vh]">{t('general.loading')}</div>
      </AppShell>
    );
  }

  if (!proposal) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[40vh]">{t('proposal.notFound')}</div>
      </AppShell>
    );
  }

  const userIsAuthor = !!user && user.id === proposal.authorId;
  const isVoting = proposal.status === 'voting';

  return (
    <AppShell breadcrumb={[
      { label: t('home.proposals'), href: '/proposals' },
      { label: proposal.question.length > 60 ? proposal.question.slice(0, 60) + '…' : proposal.question },
    ]}>
      <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('general.back')}
      </Button>

      {/* Next Action Panel */}
      <div className="mb-4">
        <NextActionPanel
          status={proposal.status}
          proposalId={proposal.id}
          userIsAuthor={userIsAuthor}
        />
      </div>

      {/* Lifecycle Stepper */}
      <Card className="mb-4">
        <CardContent className="py-4">
          <LifecycleStepper status={proposal.status} />
        </CardContent>
      </Card>

      {/* Proposal Content */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl mb-2">{proposal.question}</CardTitle>
              <CardDescription>
                {t('proposal.by')} {proposal.authorName || t('proposal.userWithId', { id: proposal.authorId })} · {new Date(proposal.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge className={getStatusForProposal(proposal).color} variant="outline" style={{ whiteSpace: 'nowrap' }}>
              <span className="mr-1">{getStatusForProposal(proposal).icon}</span>
              {getStatusLabel(proposal.status, t)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h4 className="text-sm font-medium text-muted-foreground">{t('proposal.proposedSolution')}</h4>
            <p className="whitespace-pre-wrap">{proposal.solution}</p>

            {proposal.finalText && (
              <div className="mt-4 p-4 bg-muted rounded">
                <h4 className="text-sm font-medium mb-2">{t('proposal.finalTextSortition')}</h4>
                <p className="whitespace-pre-wrap">{proposal.finalText}</p>
              </div>
            )}

            {proposal.llmScore && (
              <div className="mt-4 p-4 bg-muted rounded">
                <h4 className="text-sm font-medium mb-2">{t('proposal.llmValidation')}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('proposal.score')}</span>
                    <span className="ml-2 font-medium">{proposal.llmScore}/100</span>
                  </div>
                </div>
                {proposal.llmFeedback && (
                  <p className="text-sm mt-2 text-muted-foreground">{proposal.llmFeedback}</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Overview, Debate, Amendments, Sortition, Votes */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">
            <Eye className="w-4 h-4 mr-1" />
            {t('workspace.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="debate">
            <MessageSquare className="w-4 h-4 mr-1" />
            {t('workspace.tabs.debate')}
          </TabsTrigger>
          <TabsTrigger value="amendments">
            <FileText className="w-4 h-4 mr-1" />
            {t('workspace.tabs.amendments')}
          </TabsTrigger>
          <TabsTrigger value="sortition">
            <Users className="w-4 h-4 mr-1" />
            {t('workspace.tabs.sortition')}
          </TabsTrigger>
          <TabsTrigger value="votes">
            <Vote className="w-4 h-4 mr-1" />
            {t('workspace.tabs.votes')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>{t('workspace.tabs.overview')}</CardTitle>
              <CardDescription>
                {t('proposal.proposedSolution')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('proposal.questionLabel') || 'Ερώτημα'}</h4>
                  <p className="whitespace-pre-wrap">{proposal.question}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('proposal.proposedSolution')}</h4>
                  <p className="whitespace-pre-wrap">{proposal.solution}</p>
                </div>
                {proposal.finalText && (
                  <div className="p-4 bg-muted rounded">
                    <h4 className="text-sm font-medium mb-2">{t('proposal.finalTextSortition')}</h4>
                    <p className="whitespace-pre-wrap">{proposal.finalText}</p>
                  </div>
                )}
                {proposal.category && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">{t('proposal.category') || 'Κατηγορία'}</h4>
                    <Badge variant="secondary">{proposal.category}</Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debate">
          <DebatePanel proposalId={proposal.id} />
        </TabsContent>

        <TabsContent value="amendments">
          <AmendmentsPanel
            proposalId={proposal.id}
            proposalStatus={proposal.status}
            userIsAuthor={userIsAuthor}
          />
        </TabsContent>

        <TabsContent value="sortition">
          <SortitionPanel
            proposalId={proposal.id}
            proposalStatus={proposal.status}
          />
        </TabsContent>

        <TabsContent value="votes">
          <VotePanel
            proposalId={proposal.id}
            proposalStatus={proposal.status}
            proposalAuthorId={proposal.authorId}
            onProposalAdvanced={handleProposalAdvanced}
          />
          {voteError && (
            <div className="mt-2 text-red-600 text-sm text-center">{voteError}</div>
          )}
          {userIsAuthor && isVoting && (
            <div className="mt-4 flex justify-center">
              <Button onClick={handleFinalize} disabled={finalizing}>
                {finalizing ? t('general.loading') : t('proposal.finalize')}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
