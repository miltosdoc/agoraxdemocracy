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
import { ArrowLeft, FileText, MessageSquare, Vote, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { DebateArguments } from '@/components/debate/debate-arguments';

interface Proposal {
  id: number;
  question: string;
  solution: string;
  state: string;
  authorId: number;
  authorName: string;
  communityId: number;
  communityName: string;
  createdAt: string;
  structuredData?: {
    problem: string;
    solution: string;
    evidence: string[];
    suggestedCategory: string;
    qualityScore: number;
  };
}

export default function ProposalDetailPage() {
  const [location] = useLocation();
  const proposalId = location.split('/').pop();
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!proposalId) return;

    // DEMO MODE: Use mock data when backend is unavailable
    api.get(`/api/proposals/${proposalId}`)
      .then(resp => {
        setProposal(resp.data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback to demo data
        setProposal({
          id: 1,
          question: 'Πώς μπορούμε να βελτιώσουμε τη δημόσια συγκοινωνία στην περιοχή μας;',
          solution: 'Εισαγωγή ηλεκτρικών λεωφορείων και επέκταση του δικτύου ποδηλατοδρόμων με στόχο μείωση των εκπομπών CO2 κατά 30% έως το 2030.',
          state: 'deliberation',
          authorId: 1,
          authorName: 'Δημοκράτης Παπαδόπουλος',
          communityId: 1,
          communityName: 'Πολίτες Αθήνας',
          createdAt: new Date().toISOString(),
          structuredData: {
            problem: 'Υπερφόρτωση οδικού δικτύου και ρύπανση',
            solution: 'Ηλεκτρικά λεωφορεία + ποδηλατόδρομοι',
            evidence: ['Μελέτη ΕΣΔΥ 2024: 15% μείωση ρύπανσης σε πόλεις με ηλεκτρικά λεωφορεία', 'Δεδομένα ΕΛΣΤΑΤ: 40% μετακινήσεων <5km'],
            suggestedCategory: 'infrastructure',
            qualityScore: 78,
          },
        });
        setLoading(false);
      });
  }, [proposalId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]">Loading...</div>;
  }

  if (!proposal) {
    return <div className="flex items-center justify-center min-h-[50vh]">Proposal not found</div>;
  }

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
                by {proposal.authorName} · {new Date(proposal.createdAt).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge variant={
              proposal.state === 'voting' ? 'default' :
              proposal.state === 'deliberation' ? 'secondary' :
              proposal.state === 'decided' ? 'outline' :
              'outline'
            }>
              {proposal.state}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <h4>Proposed Solution</h4>
            <p>{proposal.solution}</p>
            
            {proposal.structuredData && (
              <div className="mt-4 p-4 bg-muted rounded">
                <h4 className="text-sm font-medium mb-2">LLM Analysis</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2">{proposal.structuredData.suggestedCategory}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Quality Score:</span>
                    <span className="ml-2">{proposal.structuredData.qualityScore}/100</span>
                  </div>
                </div>
                {proposal.structuredData.evidence.length > 0 && (
                  <div className="mt-2">
                    <span className="text-muted-foreground text-sm">Evidence:</span>
                    <ul className="text-sm mt-1">
                      {proposal.structuredData.evidence.map((e, i) => (
                        <li key={i}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="debate">
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
                {proposal.state === 'deliberation' 
                  ? 'Sortition body is currently reviewing this proposal.'
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
              {proposal.state === 'voting' ? (
                <div className="space-y-4">
                  <p>This proposal is currently open for voting.</p>
                  <Button>Cast Your Vote</Button>
                </div>
              ) : proposal.state === 'decided' ? (
                <div>
                  <p className="mb-2">This proposal has been decided.</p>
                  <div className="p-4 bg-muted rounded">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Yes</span>
                      <span>65%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full" style={{ width: '65%' }} />
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span>No</span>
                      <span>35%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Voting not yet open.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
