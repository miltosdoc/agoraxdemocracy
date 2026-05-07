/**
 * NextActionPanel — shows the next step for a proposal based on its lifecycle state.
 * Uses the STATUS_MAP from proposal-status.ts to determine action text and buttons.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, AlertCircle, CheckCircle2, Clock, Zap } from 'lucide-react';
import { getStatusForProposal, STATUS_MAP } from '@/lib/proposal-status';
import { useTranslation } from '@/hooks/use-translation';
import type { ProposalState } from '@shared/proposal-lifecycle';

interface NextActionPanelProps {
  status: string;
  proposalId: number;
  userIsAuthor?: boolean;
}

const ACTION_ICONS: Record<string, typeof ArrowRight> = {
  draft: Zap,
  review: Clock,
  author_review: AlertCircle,
  community_signal: ArrowRight,
  sortition_synthesis: Clock,
  voting: ArrowRight,
  decided: CheckCircle2,
  archived: AlertCircle,
};

export default function NextActionPanel({ status, proposalId, userIsAuthor }: NextActionPanelProps) {
  const { t } = useTranslation();
  const entry = getStatusForProposal({ status });
  const Icon = ACTION_ICONS[status] || ArrowRight;

  // Map status to workspace i18n key
  const actionKey = `workspace.action.${status}`;

  return (
    <Card className="border-l-4 border-l-primary/30">
      <CardContent className="py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">{t('workspace.nextAction')}</p>
              <p className="text-base font-medium">{t(actionKey) || entry.nextAction}</p>
            </div>
          </div>
          {status === 'draft' && userIsAuthor && (
            <Button size="sm" asChild>
              <a href={`/proposals/${proposalId}/submit`}>
                {t('workspace.action.draftButton')}
              </a>
            </Button>
          )}
          {status === 'author_review' && userIsAuthor && (
            <Button size="sm" asChild>
              <a href={`/proposals/${proposalId}/amendments/review`}>
                {t('workspace.action.authorReviewButton')}
              </a>
            </Button>
          )}
          {status === 'community_signal' && (
            <Button size="sm" asChild>
              <a href={`/proposals/${proposalId}/amendments/signal`}>
                {t('workspace.action.communitySignalButton')}
              </a>
            </Button>
          )}
          {status === 'sortition_synthesis' && (
            <Button size="sm" variant="outline" asChild>
              <a href={`/proposals/${proposalId}`}>
                {t('workspace.action.sortitionSynthesisButton')}
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
