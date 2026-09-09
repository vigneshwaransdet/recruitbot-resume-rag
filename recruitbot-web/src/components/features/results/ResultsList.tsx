import { AlertTriangle } from 'lucide-react';
import type { SearchMode, SearchResult } from '@/types/search.types';
import { ResultSummary } from './ResultSummary';
import { ResultCard } from './ResultCard';
import { EmptyState } from './EmptyState';
import { useUiStore } from '@/lib/stores/ui.store';

interface ResultsListProps {
  results: SearchResult[];
  searchType: SearchMode;
  durationMs: number;
  degraded?: boolean;
  warnings?: string[];
  showRerank?: boolean;
  showSummary?: boolean;
}

/** Human-readable note for a degraded pipeline run. */
function degradedNote(warnings?: string[]): string {
  const w = warnings ?? [];
  const rerank = w.includes('LLM_RERANK_FAILED');
  const summary = w.includes('SUMMARIZATION_FAILED');
  if (rerank && summary)
    return 'AI re-ranking and summaries were temporarily unavailable — showing best-effort ranked results.';
  if (rerank) return 'AI re-ranking was temporarily unavailable — showing best-effort ranked results.';
  if (summary) return 'AI summaries were temporarily unavailable for this search.';
  return 'Some enhancements were temporarily unavailable for this search.';
}

/**
 * ResultsList — summary header + optional degraded notice + ranked result
 * cards, rendered inside a bot bubble. Falls back to EmptyState when empty.
 * Clicking a card opens the candidate modal.
 */
export function ResultsList({
  results,
  searchType,
  durationMs,
  degraded,
  warnings,
  showRerank = true,
  showSummary = true,
}: ResultsListProps) {
  const openCandidateModal = useUiStore((s) => s.openCandidateModal);

  // Deduplication evidence: results matched by BOTH engines were merged.
  const mergedCount = results.filter(
    (r) => r.sources && r.sources.length > 1
  ).length;

  return (
    <div className="w-full">
      <ResultSummary
        count={results.length}
        searchType={searchType}
        durationMs={durationMs}
        mergedCount={mergedCount}
      />

      {degraded && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {degradedNote(warnings)}
        </div>
      )}

      {results.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {results.map((result, i) => (
            <ResultCard
              key={result.resumeId}
              result={result}
              rank={i + 1}
              searchType={searchType}
              onSelect={openCandidateModal}
              showRerank={showRerank}
              showSummary={showSummary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
