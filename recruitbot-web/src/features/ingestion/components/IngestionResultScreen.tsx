import { CheckCircle2, Sparkles, Database, Search, RotateCcw } from 'lucide-react';
import type { IngestionResult } from '../types/ingestion.types';

interface IngestionResultScreenProps {
  result: IngestionResult;
  onReset: () => void;
}

/**
 * IngestionResultScreen (Phase 6)
 *
 * Success screen shown after a resume is fully ingested. Presents the
 * completion checklist (uploaded, embedding generated, stored, vector
 * search ready) plus the parsed summary returned by the backend.
 */
export function IngestionResultScreen({ result, onReset }: IngestionResultScreenProps) {
  const checklist = [
    {
      icon: CheckCircle2,
      label: 'Resume uploaded successfully',
      done: true,
    },
    {
      icon: Sparkles,
      label: result.embeddingDimension
        ? `Embedding generated (${result.embeddingDimension}-dim${
            result.embeddingModel ? ` · ${result.embeddingModel}` : ''
          })`
        : 'Embedding generated successfully',
      done: true,
    },
    {
      icon: Database,
      label: 'MongoDB ingestion completed',
      done: true,
    },
    {
      icon: Search,
      label: 'Vector search ready',
      done: !!result.vectorSearchReady,
    },
  ];

  const details: { label: string; value: string }[] = [];
  if (result.name) details.push({ label: 'Candidate', value: result.name });
  if (result.role) details.push({ label: 'Role', value: result.role });
  if (result.company) details.push({ label: 'Company', value: result.company });
  if (typeof result.totalExperience === 'number') {
    details.push({
      label: 'Experience',
      value: `${result.totalExperience} yr${result.totalExperience === 1 ? '' : 's'}`,
    });
  }
  if (typeof result.skillsCount === 'number') {
    details.push({ label: 'Skills parsed', value: String(result.skillsCount) });
  }
  if (result.resumeId) details.push({ label: 'Resume ID', value: result.resumeId });
  if (typeof result.totalMs === 'number') {
    details.push({ label: 'Processed in', value: `${result.totalMs} ms` });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Success banner */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-score-hybrid/30 bg-score-hybrid/10 p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-score-hybrid/20 text-score-hybrid">
          <CheckCircle2 size={26} />
        </span>
        <div>
          <p className="text-base font-semibold text-text-primary">Ingestion complete</p>
          <p className="mt-1 text-xs text-text-muted">
            {result.name ? `${result.name} · ` : ''}
            {result.fileName}
          </p>
        </div>
      </div>

      {/* Completion checklist */}
      <ul className="flex flex-col gap-2" aria-label="Ingestion results">
        {checklist.map(({ icon: Icon, label, done }) => (
          <li
            key={label}
            className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-bg-card px-3 py-2.5"
          >
            <span
              className={[
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                done
                  ? 'bg-score-hybrid/15 text-score-hybrid'
                  : 'bg-white/10 text-text-muted',
              ].join(' ')}
              aria-hidden="true"
            >
              <Icon size={15} />
            </span>
            <span className="text-sm text-text-primary">{label}</span>
          </li>
        ))}
      </ul>

      {/* Parsed summary */}
      {details.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-white/[0.07] bg-bg-card p-4">
          {details.map(({ label, value }) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs uppercase tracking-wide text-text-muted">{label}</dt>
              <dd className="mt-0.5 truncate text-sm text-text-primary" title={value}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Action */}
      <button
        type="button"
        onClick={onReset}
        aria-label="Upload another resume"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-bg-card px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-primary/60"
      >
        <RotateCcw size={16} />
        Upload another
      </button>
    </div>
  );
}
