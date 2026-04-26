/**
 * Proposal Detail Page
 * 
 * Displays full proposal details including structured content,
 * debate arguments, sortition status, and voting results.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, Vote, Users, ThumbsUp, ThumbsDown, MinusCircle, CheckCircle, XCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import Footer from '@/components/layout/footer';
import { DebateArguments } from '@/components/debate/debate-arguments';
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

type VoteChoice = 'yes' | 'no' | 'abstain';

interface VoteResults {
  yes: number;
  no: number;
  abstain: number;
  total: number;
  participants: number;
  participationPct: number;
  passes: boolean;
  meetsQuorum: boolean;
  minParticipationPct: number;
  userVote: VoteChoice | null;
}

const EMPTY_VOTE_RESULTS: VoteResults = {
  yes: 0,
  no: 0,
  abstain: 0,
  total: 0,
  participants: 0,
  participationPct: 0,
  passes: false,
  meetsQuorum: false,
  minParticipationPct: 0,
  userVote: null,
};

export default function ProposalDetailPage() {
  const [location] = useLocation();
  const proposalId = location.split('/').pop();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [voteResults, setVoteResults] = useState<VoteResults>(EMPTY_VOTE_RESULTS);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    if (!proposalId) return;

    Promise.all([
      api.get<Proposal>(`/api/proposals/${proposalId}`),
      api.get<VoteResults>(`/api/proposals/${proposalId}/vote-results`)
        .catch(() => ({ data: EMPTY_VOTE_RESULTS })),
    ]).then(([proposalResp, voteResp]) => {
      setProposal(proposalResp.data);
      setVoteResults(voteResp.data);
      setLoading(false);
    }).catch(() => {
      // Fallback to demo data
      setProposal({
        id: 1,
        question: 'Πώς μπορούμε να βελτιώσουμε τη δημόσια συγκοινωνία στην περιοχή μας;',
        solution: 'Εισαγωγή ηλεκτρικών λεωφορείων και επέκταση του δικτύου ποδηλατοδρόμων με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030.',
        status: 'voting',
        authorId: 1,
        authorName: 'Δημοκράτης Παπαδόπουλος',
        communityId: 1,
        communityName: 'Πολίτες Αθήνας',
        createdAt: new Date().toISOString(),
      });
      setVoteResults(EMPTY_VOTE_RESULTS);
      setLoading(false);
    });
  }, [proposalId]);

  const refreshVoteResults = async () => {
    if (!proposalId) return;
    try {
      const resp = await api.get<VoteResults>(`/api/proposals/${proposalId}/vote-results`);
      setVoteResults(resp.data);
    } catch {
      // Leave existing state in place
    }
  };

  const handleCastVote = async (choice: VoteChoice) => {
    if (!proposalId || voting) return;
    setVoting(true);
    setVoteError(null);
    try {
      await api.post(`/api/proposals/${proposalId}/vote`, { choice });
      await refreshVoteResults();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('proposal.voteFailed');
      setVoteError(message);
    } finally {
      setVoting(false);
    }
  };

  const handleFinalize = async () => {
    if (!proposalId || finalizing) return;
    setFinalizing(true);
    try {
      const resp = await api.post<{ proposal: Proposal; results: VoteResults }>(
        `/api/proposals/${proposalId}/finalize`,
      );
      setProposal(resp.data.proposal);
      setVoteResults({ ...resp.data.results, userVote: voteResults.userVote });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : t('proposal.finalizeFailed');
      setVoteError(message);
    } finally {
      setFinalizing(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">{t('general.loading')}</div>;
  }

  if (!proposal) {
    return <div className="flex items-center justify-center min-h-[50vh]">{t('proposal.notFound')}</div>;
  }

  const decisiveTotal = voteResults.yes + voteResults.no;
  const yesPercent = decisiveTotal > 0 ? Math.round((voteResults.yes / decisiveTotal) * 100) : 0;
  const noPercent = decisiveTotal > 0 ? Math.round((voteResults.no / decisiveTotal) * 100) : 0;
  const participationPercent = Math.round(voteResults.participationPct * 100);
  const quorumPercent = Math.round(voteResults.minParticipationPct * 100);
  const isVoting = proposal.status === 'voting';
  const isDecided = proposal.status === 'decided';
  const isArchived = proposal.status === 'archived';
  const userIsAuthor = !!user && user.id === proposal.authorId;
  const userVoted = voteResults.userVote !== null;

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('general.back')}
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl mb-2">{proposal.question}</CardTitle>
              <CardDescription>
                {t('proposal.by')} {proposal.authorName || t('proposal.userWithId', { id: proposal.authorId })} · {new Date(proposal.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant={
              proposal.status === 'voting' ? 'default' :
              proposal.status === 'decided' ? 'outline' :
              proposal.status === 'sortition_synthesis' ? 'secondary' :
              'outline'
            }>
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

      <Tabs defaultValue="vote">
        <TabsList>
          <TabsTrigger value="debate">
            <MessageSquare className="w-4 h-4 mr-1" />
            {t('proposal.debate')}
          </TabsTrigger>
          <TabsTrigger value="sortition">
            <Users className="w-4 h-4 mr-1" />
            {t('proposal.sortition')}
          </TabsTrigger>
          <TabsTrigger value="vote">
            <Vote className="w-4 h-4 mr-1" />
            {t('general.vote')}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="debate">
          <DebateArguments proposalId={proposal.id} />
        </TabsContent>
        
        <TabsContent value="sortition">
          <Card>
            <CardHeader>
              <CardTitle>{t('proposal.sortitionReview')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {proposal.status === 'sortition_synthesis' 
                  ? t('proposal.sortitionInProgress')
                  : proposal.status === 'voting'
                  ? t('proposal.sortitionCompleted')
                  : t('proposal.sortitionNotStarted')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vote">
          <Card>
            <CardHeader>
              <CardTitle>{t('proposal.voting')}</CardTitle>
            </CardHeader>
            <CardContent>
              {isVoting ? (
                <div className="space-y-6">
                  <p className="text-muted-foreground">{t('proposal.votingOpen')}</p>
                  
                  {!voted ? (
                    <div className="flex gap-4 justify-center">
                      <Button
                        size="lg"
                        variant="outline"
                        className="gap-2 border-green-500 text-green-600 hover:bg-green-50"
                        onClick={() => handleVote('support')}
                        disabled={voting}
                      >
                        <ThumbsUp className="w-5 h-5" />
                        {t('proposal.support')}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="gap-2 border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => handleVote('oppose')}
                        disabled={voting}
                      >
                        <ThumbsDown className="w-5 h-5" />
                        {t('proposal.oppose')}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span>{t('proposal.voteRecorded')}</span>
                    </div>
                  )}

                  <div className="p-4 bg-muted rounded">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        {t('proposal.supportCount', { count: support.support })}
                      </span>
                      <span className="font-medium">{supportPercent}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 mb-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full transition-all" 
                        style={{ width: `${supportPercent}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-4 h-4 text-red-600" />
                        {t('proposal.opposeCount', { count: support.oppose })}
                      </span>
                      <span className="font-medium">{opposePercent}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 mt-1">
                      <div 
                        className="bg-red-500 h-3 rounded-full transition-all" 
                        style={{ width: `${opposePercent}%` }} 
                      />
                    </div>
                    <div className="text-center text-xs text-muted-foreground mt-2">
                      {t('proposal.totalVotes', { count: totalVotes })}
                    </div>
                  </div>
                </div>
              ) : isDecided ? (
                <div>
                  <p className="mb-4 text-muted-foreground">{t('proposal.proposalDecided')}</p>
                  <div className="p-4 bg-muted rounded">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        {t('proposal.supportCount', { count: support.support })}
                      </span>
                      <span className="font-medium">{supportPercent}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 mb-3">
                      <div 
                        className="bg-green-500 h-3 rounded-full" 
                        style={{ width: `${supportPercent}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1">
                        <ThumbsDown className="w-4 h-4 text-red-600" />
                        {t('proposal.opposeCount', { count: support.oppose })}
                      </span>
                      <span className="font-medium">{opposePercent}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-3 mt-1">
                      <div 
                        className="bg-red-500 h-3 rounded-full" 
                        style={{ width: `${opposePercent}%` }} 
                      />
                    </div>
                    <div className="text-center text-xs text-muted-foreground mt-2">
                      {t('proposal.totalVotes', { count: totalVotes })}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">{t('proposal.votingNotOpen', { status: getStatusLabel(proposal.status, t) })}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Footer />
    </div>
  );
}
