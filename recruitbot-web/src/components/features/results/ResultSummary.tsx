import { Link2 } from 'lucide-react';
import type { SearchMode } from '@/types/search.types';
import { getModeMeta } from '@/lib/utils/constants';
import { formatDuration } from '@/lib/utils/formatters';

interface ResultSummaryProps {
  count: number;
  searchType: SearchMode;
  durationMs: number;
  /** How many results were found by BOTH engines and merged (dedup). */
  mergedCount?: number;
}

/**
 * ResultSummary — results header:
 *   "Found N candidates · Hybrid · 3.7 s"
 * plus an explicit Deduplicated indicator when candidates were matched by
 * both keyword and semantic search and merged into single results.
 */
export function ResultSummary({
  count,
  searchType,
  durationMs,
  mergedCount = 0,
}: ResultSummaryProps) {
  const meta = getModeMeta(searchType);
  return (
    <div className="mb-3 flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
        <span>
          Found <span className="font-semibold text-text-primary">{count}</span>{' '}
          candidate{count === 1 ? '' : 's'}
        </span>
        <span aria-hidden="true">·</span>
        <span className={`rounded-full px-2 py-0.5 font-medium ${meta.badgeClass}`}>
          {meta.name}
        </span>
        <span aria-hidden="true">·</span>
        <span>{formatDuration(durationMs)}</span>
      </div>

      {mergedCount > 0 && (
        <div className="inline-flex w-fit items-center gap-1.5 rounded-md border border-score-hybrid/30 bg-score-hybrid/10 px-2 py-1 text-[11px] text-score-hybrid">
          <Link2 size={12} />
          <span>
            Deduplicated —{' '}
            <span className="font-semibold">{mergedCount}</span>{' '}
            candidate{mergedCount === 1 ? '' : 's'} matched by both keyword + semantic
            search (merged)
          </span>
        </div>
      )}
    </div>
  );
}
