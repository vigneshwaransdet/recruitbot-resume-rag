import { ResumeRepository } from "../repositories/ResumeRepository";
import { toCandidate } from "../utils/candidateMapper";
import { mergeAndDeduplicate } from "../utils/deduplicate";
import { LLMService } from "./LLMService";
import {
  SearchCandidate,
  SearchFilters,
  SearchOptions,
  ComponentTimings,
} from "../types/retrieval.types";
import { EmbeddingService } from "../../../shared/services/EmbeddingService";

/**
 * A single ranked result in the end-to-end response, joining the LLM
 * ordering back to the full candidate metadata.
 */
export interface EndToEndResult {
  rank: number;
  resumeId: string;
  name?: string | null;
  role?: string | null;
  company?: string | null;
  totalExperience?: number | null;
  skills?: string[];
  sources: SearchCandidate["sources"];
  relevanceScore?: number;
  reason?: string;
  summary?: string;
}

export interface EndToEndResponse {
  results: EndToEndResult[];
  degraded: boolean;
  warnings: string[];
  vectorFallback?: boolean;
  bm25Fallback?: boolean;
  timings: ComponentTimings;
}

/**
 * SearchService (Phase 7+)
 *
 * Service-layer orchestration for retrieval. Each search method returns
 * candidates in the normalized SearchCandidate shape so downstream merge,
 * dedupe and re-rank stages can treat every source uniformly.
 *
 * Phase 5 wires up bm25Search; Phase 6 adds vectorSearch. Hybrid and the
 * end-to-end pipeline arrive in later phases.
 */
export class SearchService {
  constructor(
    private readonly repo: ResumeRepository = new ResumeRepository(),
    private readonly embeddingService: EmbeddingService = new EmbeddingService(),
    private readonly llmService: LLMService = new LLMService()
  ) {}

  /**
   * Lexical BM25 search. Delegates to the repository's Atlas Search
   * pipeline and normalizes each row into a SearchCandidate.
   */
  async bm25Search(
    query: string,
    filters: SearchFilters | undefined,
    topK: number
  ): Promise<SearchCandidate[]> {
    const rows = await this.repo.bm25Search(query, topK, filters);
    return rows.map((row) => toCandidate(row, "bm25", query));
  }

  /**
   * Semantic vector search. Generates the query embedding on demand
   * (reusing the ingestion EmbeddingService) and runs Atlas Vector
   * Search against the stored resume embeddings.
   *
   * Returns both the normalized candidates and the time spent generating
   * the query embedding so callers can record component timings.
   */
  async vectorSearch(
    query: string,
    filters: SearchFilters | undefined,
    topK: number
  ): Promise<{ candidates: SearchCandidate[]; embeddingMs: number }> {
    const embedStart = Date.now();
    const queryVector = await this.embeddingService.generateEmbedding(query);
    const embeddingMs = Date.now() - embedStart;

    const rows = await this.repo.vectorSearch(queryVector, topK, filters);
    const candidates = rows.map((row) => toCandidate(row, "vector", query));
    return { candidates, embeddingMs };
  }

  /**
   * Hybrid (debug) search — Phase 8.
   *
   * Runs the lexical (BM25) and semantic (vector) paths INDEPENDENTLY and
   * in parallel. The query embedding is only needed by the vector path,
   * so BM25 does not wait for it. Scores from the two paths are NOT
   * combined into a single number here; both ranked lists are returned as
   * separate arrays for debugging and exploration.
   *
   * Returns each list plus component timings.
   */
  async hybridSearch(
    query: string,
    filters: SearchFilters | undefined,
    options: { bm25TopK: number; vectorTopK: number }
  ): Promise<{
    bm25: SearchCandidate[];
    vector: SearchCandidate[];
    timings: { bm25Ms: number; embeddingMs: number; vectorMs: number };
  }> {
    // BM25 path (timed independently).
    const bm25Start = Date.now();
    const bm25Promise = this.repo
      .bm25Search(query, options.bm25TopK, filters)
      .then((rows) => ({
        candidates: rows.map((row) => toCandidate(row, "bm25", query)),
        bm25Ms: Date.now() - bm25Start,
      }));

    // Vector path: embed the query, then run vector search (both timed).
    const vectorPromise = (async () => {
      const embedStart = Date.now();
      const queryVector = await this.embeddingService.generateEmbedding(query);
      const embeddingMs = Date.now() - embedStart;

      const vecStart = Date.now();
      const rows = await this.repo.vectorSearch(
        queryVector,
        options.vectorTopK,
        filters
      );
      const vectorMs = Date.now() - vecStart;

      return {
        candidates: rows.map((row) => toCandidate(row, "vector", query)),
        embeddingMs,
        vectorMs,
      };
    })();

    const [bm25Res, vectorRes] = await Promise.all([bm25Promise, vectorPromise]);

    return {
      bm25: bm25Res.candidates,
      vector: vectorRes.candidates,
      timings: {
        bm25Ms: bm25Res.bm25Ms,
        embeddingMs: vectorRes.embeddingMs,
        vectorMs: vectorRes.vectorMs,
      },
    };
  }

  /**
   * Full end-to-end synchronous search (Phase 13/14) with graceful
   * fallbacks (Phase 15).
   *
   * Flow: embed(once) + BM25 in parallel → vector → merge → dedupe →
   * select top N → LLM re-rank → optional summaries → ranked results.
   *
   * Degradation rules:
   *  - vector fails  → BM25 only        (degraded, vectorFallback)
   *  - BM25 fails    → vector only      (degraded, bm25Fallback)
   *  - both fail     → throw SEARCH_UNAVAILABLE (handled by controller)
   *  - re-rank fails → BM25-then-vector ordering (degraded, LLM_RERANK_FAILED)
   *  - summary fails → results without summaries (degraded, SUMMARIZATION_FAILED)
   */
  async endToEndSearch(
    query: string,
    filters: SearchFilters | undefined,
    options: Required<SearchOptions>
  ): Promise<EndToEndResponse> {
    const totalStart = Date.now();
    const timings: ComponentTimings = {};
    const warnings: string[] = [];
    let degraded = false;
    let vectorFallback = false;
    let bm25Fallback = false;

    // --- Retrieval: BM25 + (embed → vector), independent + parallel. ---
    const bm25Start = Date.now();
    const bm25Settled = this.repo
      .bm25Search(query, options.bm25TopK, filters)
      .then((rows) => {
        timings.bm25Ms = Date.now() - bm25Start;
        return rows.map((r) => toCandidate(r, "bm25", query));
      });

    const vectorSettled = (async () => {
      const embedStart = Date.now();
      const queryVector = await this.embeddingService.generateEmbedding(query);
      timings.embeddingMs = Date.now() - embedStart;
      const vecStart = Date.now();
      const rows = await this.repo.vectorSearch(
        queryVector,
        options.vectorTopK,
        filters
      );
      timings.vectorMs = Date.now() - vecStart;
      return rows.map((r) => toCandidate(r, "vector", query));
    })();

    const [bm25R, vectorR] = await Promise.allSettled([
      bm25Settled,
      vectorSettled,
    ]);

    const bm25Candidates =
      bm25R.status === "fulfilled" ? bm25R.value : [];
    const vectorCandidates =
      vectorR.status === "fulfilled" ? vectorR.value : [];

    if (bm25R.status === "rejected") {
      degraded = true;
      bm25Fallback = true;
      warnings.push("BM25_FAILED");
    }
    if (vectorR.status === "rejected") {
      degraded = true;
      vectorFallback = true;
      warnings.push("VECTOR_FAILED");
    }

    // Both strategies failed → no usable results.
    if (bm25R.status === "rejected" && vectorR.status === "rejected") {
      const err = new Error("No retrieval strategy is currently available");
      (err as { code?: string }).code = "SEARCH_UNAVAILABLE";
      throw err;
    }

    // --- Merge + deduplicate into one candidate pool. ---
    const pool = mergeAndDeduplicate(bm25Candidates, vectorCandidates);

    // Candidate lookup for joining rerank ids back to full metadata.
    const byId = new Map(pool.map((c) => [c.resumeId, c]));

    // Select the top N candidates for re-ranking (bm25 first, then vector
    // provenance, then by whatever score is present).
    const rerankPool = this.selectForRerank(pool, options.rerankTopN);

    // --- LLM re-rank (with fallback ordering). ---
    let ordered: EndToEndResult[];
    try {
      const rerankStart = Date.now();
      const reranked = await this.llmService.rerankCandidates(
        query,
        rerankPool.map((c) => ({
          resumeId: c.resumeId,
          snippet: c.snippet,
          name: c.name ?? undefined,
          role: c.role ?? undefined,
          skills: c.skills,
        })),
        options.finalTopK
      );
      timings.rerankMs = Date.now() - rerankStart;

      ordered = reranked.map((r) => {
        const c = byId.get(r.resumeId);
        return this.toResult(c, r.rank, r.relevanceScore, r.reason);
      });
    } catch {
      // Re-rank failed → fall back to BM25 priority, then vector.
      degraded = true;
      warnings.push("LLM_RERANK_FAILED");
      ordered = this.fallbackOrdering(rerankPool, options.finalTopK).map(
        (c, i) => this.toResult(c, i + 1)
      );
    }

    // --- Optional summaries (never fail the whole search). ---
    if (options.summarize && ordered.length > 0) {
      const summarizeStart = Date.now();
      try {
        await Promise.all(
          ordered.map(async (result) => {
            const c = byId.get(result.resumeId);
            const summary = await this.llmService.summarizeCandidateFit(
              query,
              {
                resumeId: result.resumeId,
                snippet: c?.snippet,
                name: c?.name ?? undefined,
                role: c?.role ?? undefined,
                skills: c?.skills,
              },
              { style: options.summaryStyle }
            );
            result.summary = summary;
          })
        );
        timings.summarizeMs = Date.now() - summarizeStart;
      } catch {
        timings.summarizeMs = Date.now() - summarizeStart;
        degraded = true;
        warnings.push("SUMMARIZATION_FAILED");
      }
    } else {
      timings.summarizeMs = 0;
    }

    timings.totalMs = Date.now() - totalStart;

    return {
      results: ordered,
      degraded,
      warnings,
      ...(vectorFallback ? { vectorFallback: true } : {}),
      ...(bm25Fallback ? { bm25Fallback: true } : {}),
      timings,
    };
  }

  /**
   * Pick the candidates that go to the re-ranker. Prefers those found by
   * both sources, then falls back to score, capped at `topN`.
   */
  private selectForRerank(
    pool: SearchCandidate[],
    topN: number
  ): SearchCandidate[] {
    const sorted = [...pool].sort((a, b) => {
      const bySources = b.sources.length - a.sources.length;
      if (bySources !== 0) return bySources;
      return this.bestScore(b) - this.bestScore(a);
    });
    return sorted.slice(0, topN);
  }

  /**
   * Deterministic fallback ordering when the LLM re-ranker is unavailable:
   * BM25-scored candidates first (by BM25 score), then vector-only
   * candidates (by vector score).
   */
  private fallbackOrdering(
    pool: SearchCandidate[],
    finalTopK: number
  ): SearchCandidate[] {
    const bm25First = [...pool].sort((a, b) => {
      const aBm = a.bm25Score ?? -Infinity;
      const bBm = b.bm25Score ?? -Infinity;
      if (aBm !== bBm) return bBm - aBm;
      const aVec = a.vectorScore ?? -Infinity;
      const bVec = b.vectorScore ?? -Infinity;
      return bVec - aVec;
    });
    return bm25First.slice(0, finalTopK);
  }

  private bestScore(c: SearchCandidate): number {
    return Math.max(c.bm25Score ?? 0, c.vectorScore ?? 0);
  }

  private toResult(
    c: SearchCandidate | undefined,
    rank: number,
    relevanceScore?: number,
    reason?: string
  ): EndToEndResult {
    return {
      rank,
      resumeId: c?.resumeId ?? "",
      name: c?.name ?? null,
      role: c?.role ?? null,
      company: c?.company ?? null,
      totalExperience: c?.totalExperience ?? null,
      skills: c?.skills ?? [],
      sources: c?.sources ?? [],
      ...(relevanceScore !== undefined ? { relevanceScore } : {}),
      ...(reason !== undefined ? { reason } : {}),
    };
  }
}
