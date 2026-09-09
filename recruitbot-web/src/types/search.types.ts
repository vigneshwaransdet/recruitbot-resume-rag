/**
 * Search types.
 *
 * The UI uses 'vector' | 'bm25' | 'hybrid' as the mode. The backend's
 * mode-specific routes are /v1/search/vector, /v1/search/bm25,
 * /v1/search/hybrid, plus a full pipeline at /v1/search. The API layer
 * (search.api.ts) maps the UI mode to the correct route/body.
 */
export type SearchMode = 'vector' | 'bm25' | 'hybrid';

export interface SearchRequest {
  query: string;
  mode: SearchMode;
  topK: number;
  /** Hybrid weighting (0–1). Only meaningful for hybrid mode. */
  bm25Weight?: number;
  vectorWeight?: number;
  /** Request AI fit summaries from the backend pipeline. */
  summarize?: boolean;
}

/**
 * Normalized result row used by the UI, unified across the different
 * backend response shapes (bm25 / vector / full pipeline).
 */
/** Which retrieval strategies surfaced a candidate (dedup provenance). */
export type SearchSource = 'bm25' | 'vector';

export interface SearchResult {
  resumeId: string;
  name: string;
  role?: string;
  company?: string;
  email?: string;
  phoneNumber?: string;
  /** Relevance score (0–1 for vector/hybrid/pipeline; raw for bm25). */
  score: number;
  experienceYears?: number;
  skills?: string[];
  /** Which sources found this candidate — evidence of deduplication merge. */
  sources?: SearchSource[];
  /** LLM re-rank justification. */
  reason?: string;
  /** LLM candidate-fit summary (markdown). */
  summary?: string;
  /** Resume snippet (only from mode-specific routes, not the pipeline). */
  content?: string;
}

/** Normalized search response for the UI. */
export interface SearchResponse {
  query: string;
  mode: SearchMode;
  topK: number;
  resultCount: number;
  durationMs: number;
  results: SearchResult[];
  degraded?: boolean;
  warnings?: string[];
}
