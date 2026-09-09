/**
 * Shared type definitions for the retrieval module.
 *
 * Retrieval reads the documents produced by ingestion (the `resume_rag`
 * collection) and never mutates them during a normal search.
 */

/**
 * Result of the retrieval readiness check (Phase 1).
 */
export interface ReadinessResult {
  ready: boolean;
  collection?: string;
  resumeCount?: number;
  resumesWithEmbedding?: number;
  embeddingModel?: string;
  embeddingDimension?: number;
  reason?: string;
}

/**
 * Structured search filters accepted by search endpoints.
 */
export interface SearchFilters {
  minYearsExperience?: number;
}

/**
 * Normalized candidate shape shared across BM25, vector and hybrid
 * search paths. Every search method returns candidates in this shape so
 * the merge/dedupe/re-rank stages can treat them uniformly.
 */
export interface SearchCandidate {
  resumeId: string;
  name?: string | null;
  role?: string | null;
  company?: string | null;
  totalExperience?: number | null;
  skills?: string[];
  matchedSkills?: string[];
  snippet?: string;
  bm25Score?: number;
  vectorScore?: number;
  sources: SearchSource[];
}

export type SearchSource = "bm25" | "vector";

/**
 * A single result produced by the LLM re-ranker.
 */
export interface RerankResult {
  resumeId: string;
  rank: number;
  relevanceScore: number;
  reason?: string;
}

/**
 * Options accepted by the end-to-end search pipeline (Phase 13/14).
 */
export interface SearchOptions {
  bm25TopK?: number;
  vectorTopK?: number;
  rerankTopN?: number;
  finalTopK?: number;
  summarize?: boolean;
  summaryStyle?: "short" | "detailed";
}

/**
 * Component-level timings recorded across the retrieval pipeline.
 */
export interface ComponentTimings {
  embeddingMs?: number;
  bm25Ms?: number;
  vectorMs?: number;
  rerankMs?: number;
  summarizeMs?: number;
  totalMs?: number;
}
