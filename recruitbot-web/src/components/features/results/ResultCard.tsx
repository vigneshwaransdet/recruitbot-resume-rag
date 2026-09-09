import { motion } from 'framer-motion';
import { Briefcase, Layers } from 'lucide-react';
import type { SearchMode, SearchResult } from '@/types/search.types';
import { RankBadge } from './RankBadge';
import { ScorePill } from './ScorePill';
import { truncate } from '@/lib/utils/formatters';

interface ResultCardProps {
  result: SearchResult;
  rank: number;
  searchType: SearchMode;
  onSelect: (resumeId: string) => void;
  showRerank?: boolean;
  showSummary?: boolean;
}

/**
 * ResultCard — a single ranked candidate. Surfaces the pipeline outputs:
 * relevance score (re-rank), a "matched by" badge (dedup provenance), the
 * re-rank reason, and a short fit summary. Clicking opens the full profile.
 */
export function ResultCard({
  result,
  rank,
  searchType,
  onSelect,
  showRerank = true,
  showSummary = true,
}: ResultCardProps) {
  const bothSources = result.sources && result.sources.length > 1;

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(result.resumeId)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: (rank - 1) * 0.06 }}
      className="w-full rounded-xl border border-white/[0.07] bg-bg-surface p-4 text-left transition-all hover:border-white/[0.14] hover:shadow-lg"
    >
      {/* Top row: rank + name + score */}
      <div className="flex items-center gap-2.5">
        <RankBadge rank={rank} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-text-primary">
            {result.name}
          </span>
          {result.role && (
            <span className="block truncate text-xs text-text-muted">{result.role}</span>
          )}
        </span>
        {showRerank && <ScorePill score={result.score} searchType={searchType} />}
      </div>

      {/* Meta row: experience + dedup provenance */}
      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
        {result.experienceYears != null && (
          <span className="inline-flex items-center gap-1">
            <Briefcase size={12} />
            {result.experienceYears} yr{result.experienceYears === 1 ? '' : 's'}
          </span>
        )}
        {result.sources && result.sources.length > 0 && (
          <span
            className="inline-flex items-center gap-1"
            title={
              bothSources
                ? 'Matched by both keyword and semantic search (merged)'
                : `Matched by ${result.sources[0]} search`
            }
          >
            <Layers size={12} />
            {bothSources
              ? 'Keyword + Semantic'
              : result.sources[0] === 'bm25'
                ? 'Keyword'
                : 'Semantic'}
          </span>
        )}
      </div>

      {/* Skill chips */}
      {result.skills && result.skills.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {result.skills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Re-rank reason */}
      {showRerank && result.reason && (
        <p className="mt-2.5 text-xs leading-relaxed text-text-muted">
          <span className="font-medium text-text-primary">Why: </span>
          {result.reason}
        </p>
      )}

      {/* Fit summary (LLM) */}
      {showSummary && result.summary && (
        <div className="mt-2.5 rounded-lg border border-white/[0.06] bg-bg-card p-2.5">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-accent">
            Fit summary
          </p>
          <p className="text-xs leading-relaxed text-text-muted">
            {truncate(result.summary.replace(/[*#`]/g, ''), 260)}
          </p>
        </div>
      )}

      <p className="mt-2.5 text-[11px] text-text-muted/70">Click to view full profile →</p>
    </motion.button>
  );
}
