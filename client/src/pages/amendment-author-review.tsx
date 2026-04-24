/**
 * Author Amendment Review Page
 * 
 * The proposal author reviews submitted amendments, accepting or rejecting each
 * with a brief justification. Rejected amendments go to community signal phase.
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { ArrowLeft, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface Amendment {
  id: number;
  authorId: number;
  type: string;
  text: string;
  authorDecision: 'accepted' | 'rejected' | null;
  authorReason: string | null;
  llmScore: number | null;
  createdAt: string;
}

export default function AmendmentAuthorReview() {
  const [location] = useLocation();
  const proposalId = parseInt(location.split('/').pop() || '0');
  
  const [amendments, setAmendments] = useState<Amendment[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Record<number, boolean>>({});
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAmendments();
  }, [proposalId]);

  async function loadAmendments() {
    try {
      const res = await api.get(`/api/proposals/${proposalId}/amendments`);
      setAmendments(res.data);
    } catch (e) {
      setError('Failed to load amendments');
    } finally {
      setLoading(false);
    }
  }

  async function reviewAmendment(amendmentId: number, decision: 'accepted' | 'rejected') {
    if (decision === 'rejected' && !reasons[amendmentId]?.trim()) {
      return; // Require reason for rejection
    }
    
    setReviewing(prev => ({ ...prev, [amendmentId]: true }));
    
    try {
      await api.post(`/api/amendments/${amendmentId}/review`, {
        decision,
        reason: decision === 'rejected' ? reasons[amendmentId] : undefined,
      });
      
      setAmendments(prev => prev.map(a => 
        a.id === amendmentId 
          ? { ...a, authorDecision: decision, authorReason: decision === 'rejected' ? reasons[amendmentId] : null }
          : a
      ));
    } catch (e) {
      setError('Failed to review amendment');
    } finally {
      setReviewing(prev => ({ ...prev, [amendmentId]: false }));
    }
  }

  const allReviewed = amendments.length > 0 && amendments.every(a => a.authorDecision !== null);
  const acceptedCount = amendments.filter(a => a.authorDecision === 'accepted').length;
  const rejectedCount = amendments.filter(a => a.authorDecision === 'rejected').length;

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
        <h1 className="text-2xl font-bold">Κρίση Τροπολογιών</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Είστε ο Πρωτεύων Επιμελητής</CardTitle>
          <CardDescription>
            Αποδεχτείτε ή απορρίψτε κάθε τροπολογία. Οι απορριφθείσες θα πάνε στην κοινότητα για ψήφο.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 text-sm">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              ✓ {acceptedCount} αποδεκτές
            </Badge>
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              ✗ {rejectedCount} απορριφθείσες
            </Badge>
            <Badge variant="secondary">
              {amendments.length - acceptedCount - rejectedCount} εκκρεμείς
            </Badge>
          </div>
        </CardContent>
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
            Δεν υπάρχουν τροπολογίες για αυτή την πρόταση.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {amendments.map(amendment => (
            <Card key={amendment.id} className={
              amendment.authorDecision === 'accepted' ? 'border-green-200 bg-green-50' :
              amendment.authorDecision === 'rejected' ? 'border-red-200 bg-red-50' :
              'border-muted'
            }>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{amendment.type}</Badge>
                    <span className="text-sm text-muted-foreground">
                      από χρήστη #{amendment.authorId}
                    </span>
                  </div>
                  {amendment.authorDecision && (
                    <div className="flex items-center gap-1">
                      {amendment.authorDecision === 'accepted' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm font-medium">
                        {amendment.authorDecision === 'accepted' ? 'Αποδεκτή' : 'Απορριφθείσα'}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-3">{amendment.text}</p>
                
                {amendment.authorDecision === 'rejected' && amendment.authorReason && (
                  <div className="p-2 bg-white rounded border text-xs text-muted-foreground mb-3">
                    <strong>Αιτιολόγηση:</strong> {amendment.authorReason}
                  </div>
                )}
                
                {amendment.authorDecision === null && (
                  <>
                    <Textarea
                      placeholder="Αιτιολόγηση (απαιτείται για απόρριψη)..."
                      className="min-h-[40px] text-sm mb-3"
                      value={reasons[amendment.id] || ''}
                      onChange={e => setReasons(prev => ({ ...prev, [amendment.id]: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700 flex-1"
                        onClick={() => reviewAmendment(amendment.id, 'accepted')}
                        disabled={reviewing[amendment.id]}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" /> Αποδοχή
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => reviewAmendment(amendment.id, 'rejected')}
                        disabled={reviewing[amendment.id] || !reasons[amendment.id]?.trim()}
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Απόρριψη
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}

          {allReviewed && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="font-medium text-green-700">Ολοκληρώθηκε η κρίση</p>
              <p className="text-sm text-green-600 mt-1">
                Οι απορριφθείσες τροπολογίες θα πάνε στην κοινότητα για ψήφο.
              </p>
            </div>
          )}
        </div>
      )}
      </div>
      <Footer />
    </div>
  );
}
