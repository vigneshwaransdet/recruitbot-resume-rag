import { Check, Loader2 } from 'lucide-react';
import { INGESTION_STAGES, stageIndex } from '../config/stages';
import type { IngestionStage } from '../types/ingestion.types';

interface IngestionProgressProps {
  /** The current pipeline stage. */
  currentStage: IngestionStage;
  /** When true, the active stage shows a spinner (request still in flight). */
  active?: boolean;
}

/**
 * IngestionProgress (Phase 5)
 *
 * Vertical stepper visualising the ingestion pipeline:
 *   Upload -> PDF Processing -> Resume Parsing -> Embedding Generation
 *   -> MongoDB Storage -> Completed
 *
 * Each stage renders as done (check), active (spinner), or pending (dot).
 * The stage value is driven by the ingestion store; the timed cadence that
 * advances it lives in useIngestion.
 */
export function IngestionProgress({ currentStage, active = true }: IngestionProgressProps) {
  const currentIndex = stageIndex(currentStage);

  return (
    <ol className="flex flex-col gap-1" aria-label="Ingestion progress">
      {INGESTION_STAGES.map((stage, index) => {
        const isDone = index < currentIndex;
        const isActive = index === currentIndex;
        const isPending = index > currentIndex;
        const isLast = index === INGESTION_STAGES.length - 1;

        return (
          <li key={stage.key} className="flex gap-3">
            {/* Marker + connector rail */}
            <div className="flex flex-col items-center">
              <span
                className={[
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs transition-colors',
                  isDone
                    ? 'border-score-hybrid/40 bg-score-hybrid/20 text-score-hybrid'
                    : isActive
                      ? 'border-primary/50 bg-primary/20 text-primary'
                      : 'border-white/[0.12] bg-bg-card text-text-muted',
                ].join(' ')}
                aria-hidden="true"
              >
                {isDone ? (
                  <Check size={14} />
                ) : isActive && active ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              {!isLast && (
                <span
                  className={[
                    'my-1 w-px flex-1',
                    index < currentIndex ? 'bg-score-hybrid/40' : 'bg-white/[0.12]',
                  ].join(' ')}
                  aria-hidden="true"
                />
              )}
            </div>

            {/* Labels */}
            <div className={isLast ? 'pb-0' : 'pb-3'}>
              <p
                className={[
                  'text-sm font-medium transition-colors',
                  isPending ? 'text-text-muted' : 'text-text-primary',
                ].join(' ')}
              >
                {stage.label}
              </p>
              <p className="text-xs text-text-muted">{stage.description}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
