import { useSearchStore } from '@/lib/stores/search.store';
import { RESULT_LIMIT_OPTIONS } from '@/lib/utils/constants';

/**
 * ResultsLimitSelect — "Show top N results" selector wired to the store.
 */
export function ResultsLimitSelect() {
  const topK = useSearchStore((s) => s.topK);
  const setTopK = useSearchStore((s) => s.setTopK);

  return (
    <label className="flex items-center gap-2 text-sm text-text-muted">
      <span className="shrink-0">Show top</span>
      <select
        value={topK}
        onChange={(e) => setTopK(Number(e.target.value))}
        aria-label="Number of results to show"
        className="flex-1 rounded-md border border-white/[0.1] bg-bg-card px-2 py-1.5 text-sm text-text-primary focus:border-primary/60 focus:outline-none"
      >
        {RESULT_LIMIT_OPTIONS.map((n) => (
          <option key={n} value={n} className="bg-bg-card">
            {n} results
          </option>
        ))}
      </select>
    </label>
  );
}
