/**
 * Community Dashboard Page
 * 
 * Displays community overview, active proposals, sortition bodies,
 * and democracy score.
 */

import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Users, FileText, Vote, Shield, Merge } from 'lucide-react';
import { api } from '@/lib/api';
import { useTranslation } from '@/hooks/use-translation';

interface Community {
  id: number;
  name: string;
  description: string;
  governanceModel: string;
  memberCount: number;
  democracyScore: number;
  mergedInto: number | null;
}

interface Proposal {
  id: number;
  title: string;
  state: string;
  authorName: string;
  createdAt: string;
}

export default function CommunityDashboardPage() {
  const params = useParams();
  const communityId = params.id;
  const { t } = useTranslation();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMergeDialog, setShowMergeDialog] = useState(false);
  const [targetCommunityId, setTargetCommunityId] = useState<number | null>(null);
  const [allCommunities, setAllCommunities] = useState<Community[]>([]);
  const [merging, setMerging] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [mergeSuccess, setMergeSuccess] = useState(false);

 useEffect(() => {
    if (!communityId) return;

    Promise.all([
      api.get(`/api/communities/${communityId}`),
      api.get(`/api/communities/${communityId}/proposals`),
      api.get(`/api/communities`),
    ]).then(([commResp, propResp, allResp]) => {
      setCommunity(commResp.data as Community);
      setProposals(propResp.data as Proposal[]);
      setAllCommunities(allResp.data as Community[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [communityId]);

  const handleMerge = async () => {
    if (!targetCommunityId || !communityId) return;
    setMerging(true);
    setMergeError(null);
    try {
      const resp = await api.post(`/api/communities/${communityId}/merge`, {
        targetCommunityId,
      });
      setMergeSuccess(true);
      setTimeout(() => {
        setShowMergeDialog(false);
        setMergeSuccess(false);
        window.location.href = `/communities/${targetCommunityId}`;
      }, 2000);
    } catch (error: any) {
      setMergeError(error.response?.data?.message || 'Merge failed');
    }
    setMerging(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex items-center justify-center flex-grow min-h-[50vh]">{t('common.loading')}</div>
        <Footer />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="flex items-center justify-center flex-grow min-h-[50vh]">{t('community.not_found')}</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container mx-auto py-6 px-4 max-w-4xl flex-grow">
      <Button variant="ghost" className="mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('common.back')}
      </Button>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {community.name}
            <Badge variant="secondary">{community.governanceModel}</Badge>
          </CardTitle>
          <CardDescription>{community.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span>{community.memberCount} {t('community.members')}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span>{proposals.length} {t('community.proposals')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Vote className="w-4 h-4 text-muted-foreground" />
              <span>{t('community.active_votes')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span>{t('community.democracy_score')}</span>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>{t('community.democracy_score')}</span>
              <span>{community.democracyScore}/100</span>
            </div>
            <Progress value={community.democracyScore} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="proposals">
        <TabsList>
          <TabsTrigger value="proposals">{t('community.tab_proposals')}</TabsTrigger>
          <TabsTrigger value="sortition">{t('community.tab_sortition')}</TabsTrigger>
          <TabsTrigger value="members">{t('community.tab_members')}</TabsTrigger>
          <TabsTrigger value="merge">{t('community.tab_merge')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="proposals">
          <Card>
            <CardHeader>
              <CardTitle>{t('community.tab_proposals')}</CardTitle>
            </CardHeader>
            <CardContent>
              {proposals.length === 0 ? (
                <p className="text-muted-foreground">{t('community.no_proposals')}</p>
              ) : (
                <div className="space-y-2">
                  {proposals.map((proposal) => (
                    <div key={proposal.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{proposal.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {t('common.by')} {proposal.authorName} · {new Date(proposal.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant={
                        proposal.state === 'voting' ? 'default' :
                        proposal.state === 'deliberation' ? 'secondary' :
                        'outline'
                      }>
                        {proposal.state}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sortition">
          <Card>
            <CardHeader>
              <CardTitle>{t('community.sortition_bodies')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('community.no_sortition_bodies')}</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>{t('community.tab_members')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('community.members_coming_soon')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="merge">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Merge className="w-5 h-5" />
                {t('community.merge_title')}
              </CardTitle>
              <CardDescription>{t('community.merge_description')}</CardDescription>
            </CardHeader>
            <CardContent>
              {community?.mergedInto ? (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm">{t('community.already_merged')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('community.select_target')}</span>
                    <select
                      value={targetCommunityId || ''}
                      onChange={(e) => setTargetCommunityId(parseInt(e.target.value))}
                      className="border rounded px-3 py-1 text-sm"
                    >
                      <option value="">{t('community.choose_community')}</option>
                      {allCommunities
                        .filter(c => c.id !== community?.id && !c.mergedInto)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>• {t('community.merge_members')}</p>
                    <p>• {t('community.merge_proposals')}</p>
                    <p>• {t('community.merge_archived')}</p>
                  </div>
                  <Button
                    onClick={handleMerge}
                    disabled={!targetCommunityId || merging}
                    className="w-full"
                  >
                    {merging ? t('common.loading') : t('community.merge_button')}
                  </Button>
                  {mergeError && (
                    <p className="text-sm text-destructive">{mergeError}</p>
                  )}
                  {mergeSuccess && (
                    <p className="text-sm text-green-600">{t('community.merge_success')}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
      <Footer />
    </div>
  );
}
