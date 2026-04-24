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
import { ArrowLeft, FileText, MessageSquare, Vote, Users, ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { DebateArguments } from '@/components/debate/debate-arguments';

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

interface SupportCounts {
  support: number;
  oppose: number;
  userVote?: string | null;
}

export default function ProposalDetailPage() {
  const [location] = useLocation();
  const proposalId = location.split('/').pop();
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [support, setSupport] = useState<SupportCounts>({ support: 0, oppose: 0 });
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(false);

  useEffect(() => {
    if (!proposalId) return;

    Promise.all([
      api.get(`/api/proposals/${proposalId}`),
      api.get(`/api/proposals/${proposalId}/support`).catch(() => ({ data: { support: 0, oppose: 0 } })),
    ]).then(([proposalResp, supportResp]) => {
      setProposal(proposalResp.data);
      setSupport(supportResp.data);
      if (supportResp.data.userVote) {
        setVoted(true);
      }
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
      setSupport({ support: 65, oppose: 35 });
      setLoading(false);
    });
  }, [proposalId]);

  const handleVote = async (type: 'support' | 'oppose') => {
    if (!proposalId || voting) return;
    setVoting(true);
    try {
      const resp = await api.post(`/api/proposals/${proposalId}/support`, { type });
      setSupport(resp.data);
      setVoted(true);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
    setVoting(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  if (!proposal) {
    return <div className="flex items-center justify-center min-h-[50vh]">Proposal not found</div>;
  }

  const totalVotes = support.support + support.oppose;
  const supportPercent = totalVotes > 0 ? Math.round((support.support / totalVotes) * 100) : 0;
  const opposePercent = totalVotes > 0 ? Math.round((support.oppose / totalVotes) * 100) : 0;
  const isVoting = proposal.status === 'voting';
  const isDecided = proposal.status === 'decided';

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl mb-2">{proposal.question}</CardTitle>
              <CardDescription>
                by {proposal.authorName || `User #${proposal.authorId}`} · {new Date(proposal.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant={
              proposal.status === 'voting' ? 'default' :
              proposal.status === 'decided' ? 'outline' :
              proposal.status === 'sortition_synthesis' ? 'secondary' :
              'outline'
            }>
              {proposal.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h4 className="text-sm font-medium text-muted-foreground">Proposed Solution</h4>
            <p className="whitespace-pre-wrap">{proposal.solution}</p>
            
            {proposal.finalText && (
              <div className="mt-4 p-4 bg-muted rounded">
                <h4 className="text-sm font-medium mb-2">Final Text (Sortition Synthesis)</h4>
                <p className="whitespace-pre-wrap">{proposal.finalText}</p>
              </div>
            )}

            {proposal.llmScore && (
              <div className="mt-4 p-4 bg-muted rounded">
                <h4 className="text-sm font-medium mb-2">LLM Validation</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Score:</span>
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
            Debate
          </TabsTrigger>
          <TabsTrigger value="sortition">
            <Users className="w-4 h-4 mr-1" />
            Sortition
          </TabsTrigger>
          <TabsTrigger value="vote">
            <Vote className="w-4 h-4 mr-1" />
            Vote
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="debate">
          <DebateArguments proposalId={proposal.id} />
        </TabsContent>
        
        <TabsContent value="sortition">
          <Card>
            <CardHeader>
              <CardTitle>Sortition Review</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {proposal.status === 'sortition_synthesis' 
                  ? 'Sortition body is currently reviewing this proposal.'
                  : proposal.status === 'voting'
                  ? 'Sortition review completed. Final text is ready for voting.'
                  : 'Sortition review not yet started.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="vote">
          <Card>
            <CardHeader>
              <CardTitle>Voting</CardTitle>
            </CardHeader>
            <CardContent>
              {isVoting ? (
                <div className="space-y-6">
                  <p className="text-muted-foreground">This proposal is currently open for voting. Cast your vote below.</p>
                  
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
                        Support
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="gap-2 border-red-500 text-red-600 hover:bg-red-50"
                        onClick={() => handleVote('oppose')}
                        disabled={voting}
                      >
                        <ThumbsDown className="w-5 h-5" />
                        Oppose
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span>Your vote has been recorded</span>
                    </div>
                  )}

                  <div className="p-4 bg-muted rounded">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        Support ({support.support})
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
                        Oppose ({support.oppose})
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
                      Total votes: {totalVotes}
                    </div>
                  </div>
                </div>
              ) : isDecided ? (
                <div>
                  <p className="mb-4 text-muted-foreground">This proposal has been decided.</p>
                  <div className="p-4 bg-muted rounded">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-4 h-4 text-green-600" />
                        Support ({support.support})
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
                        Oppose ({support.oppose})
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
                      Total votes: {totalVotes}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Voting not yet open. Current status: {proposal.status}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
