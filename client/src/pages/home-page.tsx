import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, FileText, Vote, Shield, ArrowRight, Plus, Lightbulb, MessageSquare, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface Community {
  id: number;
  name: string;
  description: string;
  type: string;
  governanceModel: string;
  memberCount: number;
  democracyScore: number;
}

interface Proposal {
  id: number;
  title: string;
  status: string;
  communityId: number;
  communityName?: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Σχέδιο', color: 'bg-gray-100 text-gray-700' },
  review: { label: 'Έλεγχος', color: 'bg-blue-100 text-blue-700' },
  author_review: { label: 'Ανασκόπηση', color: 'bg-yellow-100 text-yellow-700' },
  community_signal: { label: 'Συμβουλή', color: 'bg-green-100 text-green-700' },
  sortition_synthesis: { label: 'Σύνθεση', color: 'bg-purple-100 text-purple-700' },
  voting: { label: 'Ψηφοφορία', color: 'bg-orange-100 text-orange-700' },
  decided: { label: 'Απόφαση', color: 'bg-emerald-100 text-emerald-700' },
};

function HeroSection() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTEwIDBoMTB2MTBIMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Δημιουργήστε τη Δημοκρατία του Αύριο
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
            Πλατφόρμα διαβούλευσης και συμμετοχικής διακυβέρνησης.
            Υποβάλετε προτάσεις, συζητάτε με την κοινότητα, και αποφασίζετε μαζί.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 shadow-lg" onClick={() => navigate('/proposals/new')}>
                  <Plus className="w-5 h-5 mr-2" />
                  Νέα Πρόταση
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => navigate('/communities/new')}>
                  <Users className="w-5 h-5 mr-2" />
                  Νέα Κοινότητα
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 shadow-lg" onClick={() => navigate('/auth')}>
                  Σύνδεση
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => navigate('/walkthrough')}>
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Πώς Λειτουργεί
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsBar({ communities, proposals }: { communities: Community[]; proposals: Proposal[] }) {
  const activeDeliberations = proposals.filter(p => p.status !== 'decided' && p.status !== 'draft').length;

  return (
    <div className="container mx-auto px-4 -mt-8 relative z-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{communities.length}</p>
              <p className="text-sm text-muted-foreground">Κοινότητες</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{proposals.length}</p>
              <p className="text-sm text-muted-foreground">Προτάσεις</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-0">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeDeliberations}</p>
              <p className="text-sm text-muted-foreground">Ενεργές Διαβουλεύσεις</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CommunitiesSection({ communities }: { communities: Community[] }) {
  const [, navigate] = useLocation();

  if (communities.length === 0) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Κοινότητες</h2>
          </div>
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">Δεν υπάρχουν κοινότητες ακόμα.</p>
              <Button onClick={() => navigate('/communities/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Δημιούργησε Κοινότητα
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Κοινότητες</h2>
          <Button variant="ghost" onClick={() => navigate('/communities')}>
            Όλες οι κοινότητες <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.slice(0, 6).map((community) => (
            <Card key={community.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/communities/${community.id}`)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{community.name}</CardTitle>
                  <Badge variant="secondary">{community.governanceModel}</Badge>
                </div>
                <CardDescription className="line-clamp-2">{community.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {community.memberCount} μέλη
                  </span>
                  <Badge variant="outline">{community.type}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>Βαθμός Δημοκρατίας</span>
                    <span className="font-medium">{community.democracyScore}%</span>
                  </div>
                  <Progress value={community.democracyScore} className="h-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProposalsSection({ proposals }: { proposals: Proposal[] }) {
  const [, navigate] = useLocation();

  if (proposals.length === 0) {
    return (
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Πρόσφατες Προτάσεις</h2>
          </div>
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">Δεν υπάρχουν προτάσεις ακόμα.</p>
              <Button onClick={() => navigate('/proposals/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Υπόβαλε Πρόταση
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Πρόσφατες Προτάσεις</h2>
          <Button variant="ghost" onClick={() => navigate('/proposals/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Νέα Πρόταση
          </Button>
        </div>
        <div className="space-y-4">
          {proposals.slice(0, 6).map((proposal) => {
            const statusConfig = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.draft;
            return (
              <Card key={proposal.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/proposals/${proposal.id}`)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{proposal.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {proposal.communityName || `Κοινότητα #${proposal.communityId}`}
                        </span>
                        <span>{new Date(proposal.createdAt).toLocaleDateString('el-GR')}</span>
                      </div>
                    </div>
                    <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: FileText,
      title: 'Υπόβαλε Πρόταση',
      description: 'Δημιούργησε μια πρόταση πολιτικής και υποβέ την στην κοινότητα σου.',
    },
    {
      icon: MessageSquare,
      title: 'Διαβούλευση',
      description: 'Η κοινότητα συζητά, προτείνει τροποποιήσεις, και ψηφίζει για τις ιδέες.',
    },
    {
      icon: CheckCircle,
      title: 'Τελική Απόφαση',
      description: 'Το σώμα κλήρωσης συνθέτει την τελική πρόταση και η κοινότητα ψηφίζει.',
    },
  ];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-2">Πώς Λειτουργεί</h2>
        <p className="text-center text-muted-foreground mb-8">Τρία βήματα για συμμετοχική διακυβέρνηση</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-4">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="text-sm font-medium text-blue-600 mb-1">Βήμα {index + 1}</div>
                <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">Έτοιμος να συμμετάσχεις;</h2>
        <p className="text-xl text-blue-100 mb-8">Γίνε μέρος της πλατφόρμας και συνεισφέρεις στη διαμόρφωση πολιτικής.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" onClick={() => navigate('/proposals/new')}>
              <Plus className="w-5 h-5 mr-2" />
              Υπόβαλε Πρόταση
            </Button>
          ) : (
            <>
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50" onClick={() => navigate('/auth')}>
                Σύνδεση
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => navigate('/walkthrough')}>
                Μάθε Περισσότερα
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/api/communities').catch(() => ({ data: [] })),
      api.get('/api/proposals?limit=10').catch(() => ({ data: [] })),
    ]).then(([commResp, propResp]) => {
      setCommunities(commResp.data || []);
      setProposals(propResp.data || []);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex items-center justify-center flex-grow">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <HeroSection />
      <StatsBar communities={communities} proposals={proposals} />
      <main className="flex-grow">
        <CommunitiesSection communities={communities} />
        <ProposalsSection proposals={proposals} />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
