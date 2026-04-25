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
import { useTranslation, getStatusLabel } from '@/hooks/use-translation';

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

function HeroSection() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTEwIDBoMTB2MTBIMHoiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-50" />
      <div className="relative container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            {t('home.heroTitle')}
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 shadow-lg" onClick={() => navigate('/proposals/new')}>
                  <Plus className="w-5 h-5 mr-2" />
                  {t('home.submitProposal')}
                </Button>
                <Button size="lg" className="border-2 border-white text-white hover:bg-white/10 bg-transparent" onClick={() => navigate('/communities/new')}>
                  <Users className="w-5 h-5 mr-2" />
                  {t('home.createCommunity')}
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 shadow-lg" onClick={() => navigate('/auth?tab=register')}>
                  {t('auth.register')}
                </Button>
                <Button size="lg" className="border-2 border-white text-white hover:bg-white/10 bg-transparent" onClick={() => navigate('/walkthrough')}>
                  <Lightbulb className="w-5 h-5 mr-2" />
                  {t('home.howItWorks')}
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
  const { t } = useTranslation();
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
              <p className="text-sm text-muted-foreground">{t('home.communities')}</p>
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
              <p className="text-sm text-muted-foreground">{t('home.proposals')}</p>
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
              <p className="text-sm text-muted-foreground">{t('home.activeDeliberations')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CommunitiesSection({ communities }: { communities: Community[] }) {
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  if (communities.length === 0) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t('home.communities')}</h2>
          </div>
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">{t('home.noCommunities')}</p>
              <Button onClick={() => navigate('/communities/new')}>
                <Plus className="w-4 h-4 mr-2" />
                {t('home.createCommunity')}
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
          <h2 className="text-2xl font-bold">{t('home.communities')}</h2>
          <Button variant="ghost" onClick={() => navigate('/communities')}>
            {t('home.allCommunities')} <ArrowRight className="w-4 h-4 ml-2" />
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
                    {community.memberCount} {t('community.members')}
                  </span>
                  <Badge variant="outline">{community.type}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span>{t('community.democracyScore')}</span>
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
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  if (proposals.length === 0) {
    return (
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t('home.proposals')}</h2>
          </div>
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">{t('home.noProposals')}</p>
              <Button onClick={() => navigate('/proposals/new')}>
                <Plus className="w-4 h-4 mr-2" />
                {t('home.submitProposal')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  const STATUS_COLOR: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    review: 'bg-blue-100 text-blue-700',
    author_review: 'bg-yellow-100 text-yellow-700',
    community_signal: 'bg-green-100 text-green-700',
    sortition_synthesis: 'bg-purple-100 text-purple-700',
    voting: 'bg-orange-100 text-orange-700',
    decided: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <section className="py-12 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('home.proposals')}</h2>
          <Button variant="ghost" onClick={() => navigate('/proposals/new')}>
            <Plus className="w-4 h-4 mr-2" />
            {t('home.submitProposal')}
          </Button>
        </div>
        <div className="space-y-4">
          {proposals.slice(0, 6).map((proposal) => {
            const color = STATUS_COLOR[proposal.status] || STATUS_COLOR.draft;
            return (
              <Card key={proposal.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/proposals/${proposal.id}`)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{proposal.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {proposal.communityName || `#${proposal.communityId}`}
                        </span>
                      </div>
                    </div>
                    <Badge className={color}>{getStatusLabel(proposal.status, t)}</Badge>
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
  const { t } = useTranslation();
  const steps = [
    {
      icon: FileText,
      title: t('home.step1Title'),
      description: t('home.step1Desc'),
      stepNum: t('home.step1'),
    },
    {
      icon: MessageSquare,
      title: t('home.step2Title'),
      description: t('home.step2Desc'),
      stepNum: t('home.step2'),
    },
    {
      icon: CheckCircle,
      title: t('home.step3Title'),
      description: t('home.step3Desc'),
      stepNum: t('home.step3'),
    },
  ];

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-2">{t('home.howItWorks')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-4">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="text-sm font-medium text-blue-600 mb-1">{step.stepNum}</div>
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
  const { t } = useTranslation();
  const [, navigate] = useLocation();

  return (
    <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-500 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">{t('home.readyTitle')}</h2>
        <p className="text-xl text-blue-100 mb-8">{t('home.readyDesc')}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Button variant="solid" size="lg" onClick={() => navigate('/proposals/new')}>
              <Plus className="w-5 h-5 mr-2" />
              {t('home.submitProposal')}
            </Button>
          ) : (
            <>
              <Button variant="solid" size="lg" onClick={() => navigate('/auth?tab=register')}>
                {t('auth.register')}
              </Button>
              <Button size="lg" className="border-2 border-white text-white hover:bg-white/10 bg-transparent" onClick={() => navigate('/walkthrough')}>
                {t('home.learnMore')}
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
      api.get('/api/communities').catch(() => ({ data: [] as Community[] })),
      api.get('/api/proposals?limit=10').catch(() => ({ data: [] as Proposal[] })),
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
