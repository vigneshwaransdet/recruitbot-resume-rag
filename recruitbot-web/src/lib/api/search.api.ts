import apiClient from './client';
import type {
  SearchMode,
  SearchRequest,
  SearchResponse,
  SearchResult,
  SearchSource,
} from '@/types/search.types';

/**
 * Search API — each UI mode maps to its TRUE backend behaviour so the mode
 * selector is honest:
 *
 *   Vector → POST /v1/search/vector   (semantic only; native similarity order)
 *   BM25   → POST /v1/search/bm25      (keyword only; native BM25 order)
 *   Hybrid → POST /v1/search           (full AI pipeline:
 *                                       BM25 + vector → merge + dedupe →
 *                                       LLM re-rank → optional summaries)
 *
 * Only Hybrid runs the AI pipeline (re-rank / dedupe / summaries). Vector
 * and BM25 are pure single-engine searches shown in their own relevance
 * order. The response carries `aiPipeline` so the UI can label honestly.
 */

interface RawRow {
  rank?: number;
  resumeId: string;
  name?: string | null;
  role?: string | null;
  company?: string | null;
  totalExperience?: number | null;
  skills?: string[];
  matchedSkills?: string[];
  sources?: string[];
  relevanceScore?: number;
  vectorScore?: number;
  bm25Score?: number;
  score?: number;
  reason?: string;
  summary?: string;
  snippet?: string;
  content?: string;
}

function normalizeSources(raw: string[] | undefined): SearchSource[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const valid = raw.filter((s): s is SearchSource => s === 'bm25' || s === 'vector');
  return valid.length ? valid : undefined;
}

function normalizeRow(row: RawRow, mode: SearchMode): SearchResult {
  // Score source depends on the endpoint that produced the row.
  const score =
    mode === 'hybrid'
      ? row.relevanceScore ?? row.score ?? 0
      : mode === 'vector'
        ? row.vectorScore ?? row.score ?? 0
        : row.score ?? row.bm25Score ?? 0;

  // Single-engine modes: provenance is exactly that one engine.
  const sources: SearchSource[] | undefined =
    mode === 'hybrid'
      ? normalizeSources(row.sources)
      : mode === 'vector'
        ? ['vector']
        : ['bm25'];

  return {
    resumeId: String(row.resumeId),
    name: (row.name && row.name.trim()) || 'Unnamed candidate',
    role: row.role ?? undefined,
    company: row.company ?? undefined,
    score,
    experienceYears:
      typeof row.totalExperience === 'number' ? row.totalExperience : undefined,
    skills: Array.isArray(row.skills)
      ? row.skills
      : Array.isArray(row.matchedSkills)
        ? row.matchedSkills
        : undefined,
    sources,
    reason: row.reason,
    summary: row.summary,
    content: row.snippet ?? row.content,
  };
}

export const searchApi = {
  async search(params: SearchRequest): Promise<SearchResponse> {
    const started = performance.now();

    let path: string;
    let body: Record<string, unknown>;

    if (params.mode === 'hybrid') {
      path = '/v1/search';
      body = {
        query: params.query,
        options: {
          finalTopK: params.topK,
          summarize: params.summarize !== false,
          summaryStyle: 'short',
        },
      };
    } else if (params.mode === 'vector') {
      path = '/v1/search/vector';
      body = { query: params.query, topK: params.topK };
    } else {
      path = '/v1/search/bm25';
      body = { query: params.query, topK: params.topK };
    }

    const response = await apiClient.post(path, body);
    const data = response.data as {
      results?: RawRow[];
      degraded?: boolean;
      warnings?: string[];
      timings?: { totalMs?: number };
    };

    const rawResults = Array.isArray(data.results) ? data.results : [];
    const results = rawResults.map((r) => normalizeRow(r, params.mode));

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
      aiPipeline: params.mode === 'hybrid',
    };
  },
};

export type { SearchMode };
