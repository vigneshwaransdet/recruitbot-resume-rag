import { AlertTriangle, Sparkles } from 'lucide-react';
import type { SearchMode, SearchResult } from '@/types/search.types';
import { getModeMeta } from '@/lib/utils/constants';
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
  /** Whether this run used the full AI pipeline (Hybrid): dedupe + re-rank + summaries. */
  aiPipeline?: boolean;
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
 *
 * Only Hybrid (aiPipeline) shows the dedup indicator, re-rank reasons and
 * summaries. Vector/BM25 show each engine's own relevance order.
 */
export function ResultsList({
  results,
  searchType,
  durationMs,
  degraded,
  warnings,
  aiPipeline = false,
  showSummary = true,
}: ResultsListProps) {
  const openCandidateModal = useUiStore((s) => s.openCandidateModal);
  const meta = getModeMeta(searchType);

  // Deduplication evidence (Hybrid only): results matched by BOTH engines.
  const mergedCount = aiPipeline
    ? results.filter((r) => r.sources && r.sources.length > 1).length
    : 0;

  return (
    <div className="w-full">
      <ResultSummary
        count={results.length}
        searchType={searchType}
        durationMs={durationMs}
        mergedCount={mergedCount}
      />

      {/* AI-ranked indicator (Hybrid only) — re-ranking is always on there. */}
      {aiPipeline && !degraded && (
        <div className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] text-primary">
          <Sparkles size={12} />
          AI-ranked by relevance
        </div>
      )}

      {/* Non-AI modes: honest note about ordering. */}
      {!aiPipeline && results.length > 0 && (
        <div className="mb-3 text-[11px] text-text-muted">
          Ordered by {meta.name} relevance. Switch to <b>Hybrid</b> for AI
          re-ranking, deduplication and summaries.
        </div>
      )}

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
              showRerank={aiPipeline}
              showSummary={aiPipeline && showSummary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
