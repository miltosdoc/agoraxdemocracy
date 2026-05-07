import { ProposalState } from '@shared/proposal-lifecycle';
import { ORDERED_STATES, STATUS_MAP } from '@/lib/proposal-status';
import { useTranslation } from '@/hooks/use-translation';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface LifecycleStepperProps {
  status: string;
  interactive?: boolean;
}

const VISIBLE_STATES: ProposalState[] = ORDERED_STATES.filter((s) => s !== 'archived');

export default function LifecycleStepper({ status, interactive = true }: LifecycleStepperProps) {
  const { locale } = useTranslation();

  const currentIndex = VISIBLE_STATES.indexOf(status as ProposalState);
  const isArchived = status === 'archived';

  return (
    <div className="w-full" data-testid="lifecycle-stepper">
      {/* Horizontal — desktop */}
      <ol className="hidden md:flex items-center justify-between gap-2 w-full">
        {VISIBLE_STATES.map((state, idx) => {
          const entry = STATUS_MAP[state];
          const label = locale === 'el' ? entry.greekLabel : entry.englishLabel;
          const isCompleted = !isArchived && currentIndex > idx;
          const isCurrent = !isArchived && currentIndex === idx;
          const isFuture = isArchived || currentIndex < idx;

          return (
            <li key={state} className="flex items-center flex-1 min-w-0">
              <div className="flex flex-col items-center text-center min-w-0">
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && interactive && 'bg-primary/10 border-primary text-primary ring-4 ring-primary/20',
                    isCurrent && !interactive && 'bg-primary/10 border-primary text-primary',
                    isFuture && 'bg-background border-muted text-muted-foreground',
                  )}
                  data-testid={`stepper-circle-${state}`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    'mt-1.5 text-xs leading-tight px-1 truncate max-w-[7rem]',
                    isCurrent && 'font-semibold text-foreground',
                    isCompleted && 'text-foreground',
                    isFuture && 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
              {idx < VISIBLE_STATES.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 -mt-6',
                    isCompleted ? 'bg-primary' : 'bg-muted',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      {/* Vertical — mobile */}
      <ol className="md:hidden space-y-2">
        {VISIBLE_STATES.map((state, idx) => {
          const entry = STATUS_MAP[state];
          const label = locale === 'el' ? entry.greekLabel : entry.englishLabel;
          const isCompleted = !isArchived && currentIndex > idx;
          const isCurrent = !isArchived && currentIndex === idx;
          const isFuture = isArchived || currentIndex < idx;
          const isLast = idx === VISIBLE_STATES.length - 1;

          return (
            <li key={state} className="flex gap-3 items-start">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors flex-shrink-0',
                    isCompleted && 'bg-primary border-primary text-primary-foreground',
                    isCurrent && 'bg-primary/10 border-primary text-primary',
                    isFuture && 'bg-background border-muted text-muted-foreground',
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      'w-0.5 flex-1 min-h-6 mt-1',
                      isCompleted ? 'bg-primary' : 'bg-muted',
                    )}
                  />
                )}
              </div>
              <div className="flex-1 pt-1 pb-3">
                <span
                  className={cn(
                    'text-sm',
                    isCurrent && 'font-semibold text-foreground',
                    isCompleted && 'text-foreground',
                    isFuture && 'text-muted-foreground',
                  )}
                >
                  {entry.icon} {label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {isArchived && (
        <div className="mt-3 text-center text-xs text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1.5">
          {STATUS_MAP.archived.icon} {locale === 'el' ? STATUS_MAP.archived.greekLabel : STATUS_MAP.archived.englishLabel}
        </div>
      )}
    </div>
  );
}
