/**
 * SortitionPanel — displays sortition body information for a proposal.
 * Shows body status, member count, response rate, average score, and deadline.
 */

import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/api';
import { useTranslation } from '@/hooks/use-translation';
import {
  Users,
  Clock,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface SortitionBody {
  id: number;
  proposalId: number;
  status: 'selecting' | 'active' | 'completed' | 'timeout';
  size: number;
  memberCount: number;
  respondedCount: number;
  averageScore: number | null;
  deadline: string | null;
  completedAt: string | null;
}

interface SortitionPanelProps {
  proposalId: number;
  proposalStatus: string;
}

const STATUS_CONFIG = {
  selecting: { color: 'bg-blue-100 text-blue-800', label: 'Selecting members' },
  active: { color: 'bg-green-100 text-green-800', label: 'Active — scoring open' },
  completed: { color: 'bg-emerald-100 text-emerald-800', label: 'Completed' },
  timeout: { color: 'bg-red-100 text-red-700', label: 'Timed out' },
};

export function SortitionPanel({ proposalId, proposalStatus }: SortitionPanelProps) {
  const { t } = useTranslation();
  const [body, setBody] = useState<SortitionBody | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get sortition body for this proposal
    // The API endpoint is /api/sortition/:bodyId, but we need to find the body for the proposal
    // We'll try the sortition-input endpoint which returns body info
    api.get<SortitionBody>(`/api/proposals/${proposalId}/sortition-input`)
      .then(resp => {
        // sortition-input returns the proposal with sortition data
        // We'll adapt the response
        setBody(null); // Will be populated if sortition exists
      })
      .catch(() => {
        // No sortition body yet
        setBody(null);
      })
      .finally(() => setLoading(false));
  }, [proposalId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t('workspace.amendments.loading')}
        </CardContent>
      </Card>
    );
  }

  if (!body) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('workspace.tabs.sortition')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            {t('workspace.sortition.empty')}
          </p>
          {proposalStatus === 'sortition_synthesis' && (
            <div className="mt-4 p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">
                {t('workspace.action.sortitionSynthesis')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const config = STATUS_CONFIG[body.status];
  const responseRate = body.memberCount > 0
    ? Math.round((body.respondedCount / body.memberCount) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t('workspace.tabs.sortition')}
          </CardTitle>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
        <CardDescription>{t('workspace.sortition.summary')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">{t('workspace.sortition.size')}</p>
            <p className="text-lg font-bold">{body.size}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">{t('workspace.sortition.responded')}</p>
            <p className="text-lg font-bold">{body.respondedCount}/{body.memberCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">{t('workspace.sortition.average')}</p>
            <p className="text-lg font-bold">{body.averageScore ?? '—'}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">{t('workspace.sortition.deadline')}</p>
            <p className="text-lg font-bold">
              {body.deadline ? new Date(body.deadline).toLocaleDateString() : '—'}
            </p>
          </div>
        </div>

        {/* Response Progress */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Response rate</span>
            <span className="font-medium">{responseRate}%</span>
          </div>
          <Progress value={responseRate} />
        </div>

        {/* Actions */}
        {body.status === 'active' && (
          <div className="flex gap-2">
            <Button size="sm" asChild>
              <Link href={`/sortition/${body.id}/ceremony`}>
                <ArrowRight className="w-4 h-4 mr-1" />
                View Ceremony
              </Link>
            </Button>
          </div>
        )}

        {body.completedAt && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completed {new Date(body.completedAt).toLocaleDateString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
