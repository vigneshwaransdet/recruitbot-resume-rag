import type { SearchMode } from '@/types/search.types';
import { getModeMeta } from '@/lib/utils/constants';
import { formatScore } from '@/lib/utils/formatters';

interface ScorePillProps {
  score: number;
  searchType: SearchMode;
}

/**
 * ScorePill — coloured score chip. Colour + label depend on the search mode.
 */
export function ScorePill({ score, searchType }: ScorePillProps) {
  const meta = getModeMeta(searchType);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}
      title={meta.scoreLabel}
    >
      {formatScore(score)}
      <span className="font-normal opacity-70">{meta.scoreLabel}</span>
    </span>
  );
}
