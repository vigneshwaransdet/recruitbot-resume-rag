import apiClient from './client';
import type {
  SearchMode,
  SearchRequest,
  SearchResponse,
  SearchResult,
  SearchSource,
} from '@/types/search.types';

/**
 * Search API.
 *
 * All UI modes run the backend's FULL pipeline (POST /v1/search):
 *   embed -> BM25 + vector (parallel) -> merge + dedupe -> LLM re-rank
 *   -> optional summaries -> ranked results.
 *
 * This is intentional for the enhanced app: re-ranking, deduplication and
 * summarization are the headline features, so every search surfaces them.
 * The selected UI mode still drives badge colour / labelling.
 *
 * Pipeline response row shape (verified live):
 *   { rank, resumeId, name, role, company, totalExperience, skills[],
 *     sources[], relevanceScore, reason, summary }
 */

interface PipelineRow {
  rank?: number;
  resumeId: string;
  name?: string | null;
  role?: string | null;
  company?: string | null;
  totalExperience?: number | null;
  skills?: string[];
  sources?: string[];
  relevanceScore?: number;
  reason?: string;
  summary?: string;
  // mode-specific route fallbacks
  score?: number;
  vectorScore?: number;
  bm25Score?: number;
  snippet?: string;
  content?: string;
}

function normalizeSources(raw: string[] | undefined): SearchSource[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const valid = raw.filter((s): s is SearchSource => s === 'bm25' || s === 'vector');
  return valid.length ? valid : undefined;
}

function normalizeRow(row: PipelineRow): SearchResult {
  const score =
    row.relevanceScore ??
    row.vectorScore ??
    row.bm25Score ??
    row.score ??
    0;

  return {
    resumeId: String(row.resumeId),
    name: (row.name && row.name.trim()) || 'Unnamed candidate',
    role: row.role ?? undefined,
    company: row.company ?? undefined,
    score,
    experienceYears:
      typeof row.totalExperience === 'number' ? row.totalExperience : undefined,
    skills: Array.isArray(row.skills) ? row.skills : undefined,
    sources: normalizeSources(row.sources),
    reason: row.reason,
    summary: row.summary,
    content: row.snippet ?? row.content,
  };
}

export const searchApi = {
  async search(params: SearchRequest): Promise<SearchResponse> {
    const started = performance.now();

    // Full pipeline for every mode so re-rank + dedupe surface. Summaries
    // are requested only when the Summarize enhancement is enabled.
    const body = {
      query: params.query,
      options: {
        finalTopK: params.topK,
        summarize: params.summarize !== false,
        summaryStyle: 'short',
      },
    };

    const response = await apiClient.post('/v1/search', body);
    const data = response.data as {
      results?: PipelineRow[];
      degraded?: boolean;
      warnings?: string[];
      timings?: { totalMs?: number };
    };

    const rawResults = Array.isArray(data.results) ? data.results : [];
    const results = rawResults.map(normalizeRow);

    const durationMs =
      typeof data.timings?.totalMs === 'number'
        ? data.timings.totalMs
        : Math.round(performance.now() - started);

    return {
      query: params.query,
      mode: params.mode,
      topK: params.topK,
      resultCount: results.length,
      durationMs,
      results,
      degraded: data.degraded,
      warnings: data.warnings,
    };
  },
};

// Keep SearchMode import referenced for consumers that build requests.
export type { SearchMode };
