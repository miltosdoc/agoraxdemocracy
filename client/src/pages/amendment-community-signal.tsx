/**
 * Community Signal Page
 * 
 * Community members vote ⬆️ (disagree with author's rejection) or 
 * ⬇️ (agree with author's rejection) on rejected amendments.
 * Amendments exceeding the community threshold are flagged for sortition.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ArrowLeft, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface RejectedAmendment {
  id: number;
  authorId: number;
  type: string;
  text: string;
  authorReason: string | null;
  rejectionUpvotes: number;
  rejectionDownvotes: number;
  llmScore: number | null;
  createdAt: string;
}

interface CommunitySignal {
  amendmentId: number;
  upvotes: number;
  downvotes: number;
  netScore: number;
  totalVotes: number;
  ratio: number;
  flagged: boolean;
  threshold: number;
}

export default function AmendmentCommunitySignal() {
  const [location] = useLocation();
  const proposalId = parseInt(location.split('/').pop()?.replace('/signals', '') || '0');
  
  const [amendments, setAmendments] = useState<RejectedAmendment[]>([]);
  const [signals, setSignals] = useState<CommunitySignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<Record<number, boolean>>({});
  const [userVotes, setUserVotes] = useState<Record<number, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [proposalId]);

  async function loadData() {
    try {
      const [amendmentsRes, signalsRes] = await Promise.all([
        api.get(`/api/proposals/${proposalId}/amendments`),
        api.get(`/api/proposals/${proposalId}/amendments/signals`),
      ]);
      setAmendments(amendmentsRes.data.filter((a: any) => a.authorDecision === 'rejected'));
      setSignals(signalsRes.data);
    } catch (e) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function castVote(amendmentId: number, vote: 1 | -1) {
    setVoting(prev => ({ ...prev, [amendmentId]: true }));
    
    try {
      await api.post(`/api/amendments/${amendmentId}/rejection-vote`, { vote });
      setUserVotes(prev => ({ ...prev, [amendmentId]: vote }));
      await loadData(); // Refresh data
    } catch (e) {
      setError('Failed to cast vote');
    } finally {
      setVoting(prev => ({ ...prev, [amendmentId]: false }));
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container mx-auto py-6 px-4 max-w-3xl flex-grow">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-6 px-4 max-w-3xl flex-grow">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Πίσω
        </Button>
        <h1 className="text-2xl font-bold">Κρίση Κοινότητας</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-600" />
            Ψηφίστε τις Απορριφθείσες Τροπολογίες
          </CardTitle>
          <CardDescription>
            Ο συγγραφέας απέρριψε αυτές τις τροπολογίες. Ψηφίστε:
            <br />
            <span className="text-green-600 font-medium">⬆️ Διαφωνώ με την απόρριψη</span> ή
            <span className="text-red-600 font-medium"> ⬇️ Συμφωνώ με την απόρριψη</span>
          </CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {amendments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Δεν υπάρχουν απορριφθείσες τροπολογίες για ψήφο.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {amendments.map(amendment => {
            const signal = signals.find(s => s.amendmentId === amendment.id);
            const netScore = (signal?.netScore ?? 0);
            const totalVotes = (signal?.totalVotes ?? 0);
            const ratio = (signal?.ratio ?? 0);
            const flagged = signal?.flagged ?? false;
            const userVote = userVotes[amendment.id];

            return (
              <Card key={amendment.id} className={
                flagged ? 'border-green-300 bg-green-50' : 'border-muted'
              }>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{amendment.type}</Badge>
                      <span className="text-sm text-muted-foreground">
                        από χρήστη #{amendment.authorId}
                      </span>
                    </div>
                    {flagged && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Σημειώθηκε για κληρωτό σώμα
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3">{amendment.text}</p>
                  
                  {amendment.authorReason && (
                    <div className="p-2 bg-white rounded border text-xs text-muted-foreground mb-3">
                      <strong>Αιτιολόγηση συγγραφέα:</strong> {amendment.authorReason}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant={userVote === 1 ? "default" : "outline"}
                        className={userVote === 1 ? "bg-green-600" : ""}
                        onClick={() => castVote(amendment.id, 1)}
                        disabled={voting[amendment.id]}
                      >
                        ⬆️ Διαφωνώ ({amendment.rejectionUpvotes + (userVote === 1 ? 1 : 0)})
                      </Button>
                      <Button 
                        size="sm" 
                        variant={userVote === -1 ? "default" : "outline"}
                        className={userVote === -1 ? "bg-red-600 text-white" : "text-red-600"}
                        onClick={() => castVote(amendment.id, -1)}
                        disabled={voting[amendment.id]}
                      >
                        ⬇️ Συμφωνώ ({amendment.rejectionDownvotes + (userVote === -1 ? 1 : 0)})
                      </Button>
                    </div>
                    <div className="text-sm">
                      <span className={`font-medium ${flagged ? 'text-green-600' : 'text-muted-foreground'}`}>
                        Net: {netScore > 0 ? '+' : ''}{netScore} ({(ratio * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </div>
      <Footer />
    </div>
  );
}
