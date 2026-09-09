import { Request, Response, NextFunction } from "express";
import { RetrievalValidationService } from "../services/RetrievalValidationService";
import { EmbeddingService } from "../../../shared/services/EmbeddingService";
import { env } from "../../../config/env";
import { retrievalError } from "../errors/errorCatalog";
import { SearchService } from "../services/SearchService";
import { LLMService } from "../services/LLMService";
import { SearchFilters } from "../types/retrieval.types";
import { logStructured } from "../../../shared/logging/structuredLogger";

const validationService = new RetrievalValidationService();
const embeddingService = new EmbeddingService();
const searchService = new SearchService();
const llmService = new LLMService();

/** Maximum length for a query / embedding input string. */
const MAX_QUERY_LENGTH = 4000;
/** Hard cap on how many candidates a single search may return. */
const MAX_TOP_K = 100;

/**
 * Validate + normalize the `query` field from a search body.
 * Throws a controlled error for missing/empty/oversized queries.
 */
function requireQuery(raw: unknown): string {
  const query = typeof raw === "string" ? raw.trim() : "";
  if (!query) {
    throw retrievalError("INVALID_SEARCH_QUERY");
  }
  if (query.length > MAX_QUERY_LENGTH) {
    throw retrievalError("QUERY_TOO_LONG");
  }
  return query;
}

/**
 * Clamp a requested topK into [1, MAX_TOP_K], defaulting when absent.
 */
function normalizeTopK(raw: unknown, fallback: number): number {
  const n = typeof raw === "number" ? Math.floor(raw) : NaN;
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, MAX_TOP_K);
}

/**
 * Validate structured filters. Currently supports minYearsExperience.
 */
function normalizeFilters(raw: unknown): SearchFilters | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (typeof raw !== "object") {
    throw retrievalError("INVALID_FILTER");
  }
  const obj = raw as Record<string, unknown>;
  const filters: SearchFilters = {};
  if (obj.minYearsExperience !== undefined) {
    const v = obj.minYearsExperience;
    if (typeof v !== "number" || Number.isNaN(v) || v < 0) {
      throw retrievalError(
        "INVALID_FILTER",
        "minYearsExperience must be a non-negative number"
      );
    }
    filters.minYearsExperience = v;
  }
  return filters;
}

/**
 * Validate + fill the end-to-end search options with defaults and caps.
 */
function normalizeOptions(raw: unknown): Required<import("../types/retrieval.types").SearchOptions> {
  const obj =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const style = obj.summaryStyle;
  if (style !== undefined && style !== "short" && style !== "detailed") {
    throw retrievalError(
      "INVALID_OPTIONS",
      "summaryStyle must be 'short' or 'detailed'"
    );
  }

  return {
    bm25TopK: normalizeTopK(obj.bm25TopK, env.retrievalDefaultTopK),
    vectorTopK: normalizeTopK(obj.vectorTopK, env.retrievalDefaultTopK),
    rerankTopN: normalizeTopK(obj.rerankTopN, env.rerankDefaultTopN),
    finalTopK: normalizeTopK(obj.finalTopK, 5),
    summarize: obj.summarize === true,
    summaryStyle: style === "detailed" ? "detailed" : "short",
  };
}

/**
 * retrievalController
 *
 * HTTP handlers for the retrieval module. Per-phase handlers are added
 * in their respective phases (readiness, embeddings, bm25, vector,
 * hybrid, rerank, summarize, search).
 */
export const retrievalController = {
  /**
   * GET /v1/search/readiness (Phase 1)
   */
  async readiness(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await validationService.checkReadiness();
      res.status(result.ready ? 200 : 503).json(result);
    } catch (_err) {
      // A DB connection/availability problem is a readiness failure, not
      // an unexpected 500. Return the documented not-ready contract.
      res.status(503).json({
        ready: false,
        reason: "Database is not reachable",
      });
    }
  },

  /**
   * POST /v1/embeddings (Phase 3)
   *
   * Generates a Mistral embedding for a recruiter search query on demand
   * using the same EmbeddingService proven during ingestion. No resume
   * embedding is regenerated here.
   */
  async embeddings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = (req.body ?? {}) as { model?: unknown; input?: unknown };
      const input = typeof body.input === "string" ? body.input.trim() : "";

      if (!input) {
        throw retrievalError("EMBEDDING_INPUT_REQUIRED");
      }
      if (input.length > MAX_QUERY_LENGTH) {
        throw retrievalError("QUERY_TOO_LONG");
      }

      const embedding = await embeddingService.generateEmbedding(input);

      res.status(200).json({
        embedding,
        model: env.mistralEmbedModel,
        dimension: embedding.length,
      });
    } catch (err) {
      if ((err as { code?: string }).code === "EMBEDDING_FAILED") {
        next(retrievalError("EMBEDDING_FAILED", (err as Error).message));
        return;
      }
      next(err);
    }
  },

  /**
   * POST /v1/search/bm25 (Phase 5)
   *
   * Lexical (BM25) search over resume text and structured metadata via
   * MongoDB Atlas Search. Does NOT call the LLM. Results are sorted by
   * BM25 relevance and can be filtered by minYearsExperience.
   */
  async bm25(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = (req.body ?? {}) as {
        query?: unknown;
        topK?: unknown;
        filters?: unknown;
      };

      const query = requireQuery(body.query);
      const topK = normalizeTopK(body.topK, env.retrievalDefaultTopK);
      const filters = normalizeFilters(body.filters);

      const candidates = await searchService.bm25Search(query, filters, topK);

      res.status(200).json({
        mode: "bm25",
        query,
        count: candidates.length,
        results: candidates.map((c) => ({
          resumeId: c.resumeId,
          name: c.name,
          role: c.role,
          score: c.bm25Score,
          matchedSkills: c.matchedSkills,
        })),
      });
    } catch (err) {
      if ((err as { code?: string }).code === "EMBEDDING_FAILED") {
        next(retrievalError("EMBEDDING_FAILED", (err as Error).message));
        return;
      }
      next(err);
    }
  },

  /**
   * POST /v1/search/vector (Phase 6)
   *
   * Semantic search. Embeds the query on demand and runs Atlas Vector
   * Search (cosine ANN) against the stored resume embeddings. Can be
   * filtered by minYearsExperience.
   */
  async vector(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = (req.body ?? {}) as {
        query?: unknown;
        topK?: unknown;
        filters?: unknown;
      };

      const query = requireQuery(body.query);
      const topK = normalizeTopK(body.topK, env.retrievalDefaultTopK);
      const filters = normalizeFilters(body.filters);

      const { candidates } = await searchService.vectorSearch(
        query,
        filters,
        topK
      );

      res.status(200).json({
        mode: "vector",
        query,
        count: candidates.length,
        results: candidates.map((c) => ({
          resumeId: c.resumeId,
          name: c.name,
          role: c.role,
          vectorScore: c.vectorScore,
        })),
      });
    } catch (err) {
      if ((err as { code?: string }).code === "EMBEDDING_FAILED") {
        next(retrievalError("EMBEDDING_FAILED", (err as Error).message));
        return;
      }
      next(err);
    }
  },

  /**
   * POST /v1/search/hybrid (Phase 8)
   *
   * Runs BM25 and vector search independently/in parallel and returns
   * BOTH ranked lists (a debug view). Scores are kept separate — no
   * single merged score is computed here.
   */
  async hybrid(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = (req.body ?? {}) as {
        query?: unknown;
        topK?: unknown;
        filters?: unknown;
      };

      const query = requireQuery(body.query);
      const topK = normalizeTopK(body.topK, env.retrievalDefaultTopK);
      const filters = normalizeFilters(body.filters);

      const { bm25, vector, timings } = await searchService.hybridSearch(
        query,
        filters,
        { bm25TopK: topK, vectorTopK: topK }
      );

      res.status(200).json({
        mode: "hybrid-debug",
        query,
        bm25: bm25.map((c) => ({
          resumeId: c.resumeId,
          name: c.name,
          score: c.bm25Score,
        })),
        vector: vector.map((c) => ({
          resumeId: c.resumeId,
          name: c.name,
          score: c.vectorScore,
        })),
        timings,
      });
    } catch (err) {
      if ((err as { code?: string }).code === "EMBEDDING_FAILED") {
        next(retrievalError("EMBEDDING_FAILED", (err as Error).message));
        return;
      }
      next(err);
    }
  },

  /**
   * POST /v1/search/rerank (Phase 11)
   *
   * Re-ranks a supplied set of candidates with the Groq LLM. The LLM is
   * the final authority on ordering, but returned ids are validated to
   * be a subset of the input so no candidate can be hallucinated.
   *
   * Body: { query, candidates: [{ resumeId, snippet?, ... }], topK? }
   */
  async rerank(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = (req.body ?? {}) as {
        query?: unknown;
        candidates?: unknown;
        topK?: unknown;
      };

      const query = requireQuery(body.query);

      if (!Array.isArray(body.candidates) || body.candidates.length === 0) {
        throw retrievalError("CANDIDATES_REQUIRED");
      }

      // Validate + normalize candidate entries.
      const candidates = body.candidates.map((raw, i) => {
        if (typeof raw !== "object" || raw === null) {
          throw retrievalError(
            "CANDIDATES_REQUIRED",
            `Candidate at index ${i} is not an object`
          );
        }
        const obj = raw as Record<string, unknown>;
        const resumeId = typeof obj.resumeId === "string" ? obj.resumeId : "";
        if (!resumeId) {
          throw retrievalError(
            "CANDIDATES_REQUIRED",
            `Candidate at index ${i} is missing resumeId`
          );
        }
        return {
          resumeId,
          snippet: typeof obj.snippet === "string" ? obj.snippet : undefined,
          name: typeof obj.name === "string" ? obj.name : undefined,
          role: typeof obj.role === "string" ? obj.role : undefined,
          skills: Array.isArray(obj.skills)
            ? (obj.skills.filter((s) => typeof s === "string") as string[])
            : undefined,
        };
      });

      const topK = normalizeTopK(body.topK, env.rerankDefaultTopN);

      const results = await llmService.rerankCandidates(
        query,
        candidates,
        topK
      );

      res.status(200).json({
        results,
        model: env.groqModel,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (
        code === "LLM_REQUEST_FAILED" ||
        code === "LLM_INVALID_OUTPUT" ||
        code === "LLM_CONFIG_MISSING"
      ) {
        next(retrievalError("LLM_RERANK_FAILED", (err as Error).message));
        return;
      }
      next(err);
    }
  },

  /**
   * POST /v1/search/summarize (Phase 12)
   *
   * Generates an optional candidate-fit summary grounded strictly in the
   * supplied candidate data. Style ("short" | "detailed") and maxTokens
   * are honored.
   *
   * Body: { query, candidate: { resumeId, snippet?, ... }, style?, maxTokens? }
   */
  async summarize(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = (req.body ?? {}) as {
        query?: unknown;
        candidate?: unknown;
        style?: unknown;
        maxTokens?: unknown;
      };

      const query = requireQuery(body.query);

      if (typeof body.candidate !== "object" || body.candidate === null) {
        throw retrievalError("CANDIDATE_REQUIRED");
      }
      const c = body.candidate as Record<string, unknown>;
      const resumeId = typeof c.resumeId === "string" ? c.resumeId : "";
      if (!resumeId) {
        throw retrievalError("CANDIDATE_REQUIRED", "candidate.resumeId is required");
      }

      const style =
        body.style === "detailed" ? "detailed" : ("short" as "short" | "detailed");
      const maxTokens =
        typeof body.maxTokens === "number" && body.maxTokens > 0
          ? body.maxTokens
          : undefined;

      const summary = await llmService.summarizeCandidateFit(
        query,
        {
          resumeId,
          snippet: typeof c.snippet === "string" ? c.snippet : undefined,
          name: typeof c.name === "string" ? c.name : undefined,
          role: typeof c.role === "string" ? c.role : undefined,
          skills: Array.isArray(c.skills)
            ? (c.skills.filter((s) => typeof s === "string") as string[])
            : undefined,
        },
        { style, maxTokens }
      );

      res.status(200).json({
        resumeId,
        summary,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (
        code === "LLM_REQUEST_FAILED" ||
        code === "LLM_INVALID_OUTPUT" ||
        code === "LLM_CONFIG_MISSING"
      ) {
        // Summarization failure is a controlled 502, but note that in the
        // end-to-end pipeline it must NOT remove ranked results.
        next(retrievalError("LLM_RERANK_FAILED", (err as Error).message));
        return;
      }
      next(err);
    }
  },

  /**
   * POST /v1/search (Phase 13/14)
   *
   * Full synchronous pipeline: embed → BM25 + vector (parallel) → merge →
   * dedupe → LLM re-rank → optional summaries → final ranked results.
   * Degrades gracefully (Phase 15) rather than failing unnecessarily.
   *
   * Body: { query, filters?, options? }
   */
  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = (req.body ?? {}) as {
        query?: unknown;
        filters?: unknown;
        options?: unknown;
      };

      const query = requireQuery(body.query);
      const filters = normalizeFilters(body.filters);
      const options = normalizeOptions(body.options);

      const result = await searchService.endToEndSearch(query, filters, options);

      // Structured log with per-component timings (Phase 16). Only safe,
      // summarised fields are logged — never the query text, secrets or
      // full resume payloads.
      logStructured({
        level: result.degraded ? "warn" : "info",
        requestId: req.requestId,
        endpoint: "/v1/search",
        method: "POST",
        statusCode: 200,
        resultCount: result.results.length,
        degraded: result.degraded,
        warnings: result.warnings,
        componentTimings: {
          embeddingMs: result.timings.embeddingMs ?? 0,
          bm25Ms: result.timings.bm25Ms ?? 0,
          vectorMs: result.timings.vectorMs ?? 0,
          rerankMs: result.timings.rerankMs ?? 0,
          summarizeMs: result.timings.summarizeMs ?? 0,
        },
        totalMs: result.timings.totalMs,
      });

      res.status(200).json({
        query,
        results: result.results,
        degraded: result.degraded,
        warnings: result.warnings,
        ...(result.vectorFallback ? { vectorFallback: true } : {}),
        ...(result.bm25Fallback ? { bm25Fallback: true } : {}),
        timings: result.timings,
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "SEARCH_UNAVAILABLE") {
        res.status(503).json({
          success: false,
          requestId: req.requestId,
          errorCode: "SEARCH_UNAVAILABLE",
          message: "No retrieval strategy is currently available",
        });
        return;
      }
      if (code === "EMBEDDING_FAILED") {
        next(retrievalError("EMBEDDING_FAILED", (err as Error).message));
        return;
      }
      next(err);
    }
  },
};
