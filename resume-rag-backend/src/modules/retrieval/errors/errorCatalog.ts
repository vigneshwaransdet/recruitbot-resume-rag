import { AppError } from "../../../middleware/errorHandler";

/**
 * Canonical retrieval error catalog.
 *
 * Single source of truth for stable retrieval error codes, HTTP statuses
 * and default messages, mirroring the ingestion catalog pattern so
 * responses never drift across endpoints.
 */

export interface ErrorDefinition {
  status: number;
  code: string;
  message: string;
}

export const RetrievalErrors = {
  INVALID_SEARCH_QUERY: {
    status: 400,
    code: "INVALID_SEARCH_QUERY",
    message: "Search query is required",
  },
  QUERY_TOO_LONG: {
    status: 400,
    code: "QUERY_TOO_LONG",
    message: "Search query exceeds the maximum allowed length",
  },
  INVALID_FILTER: {
    status: 400,
    code: "INVALID_FILTER",
    message: "One or more filters are invalid",
  },
  INVALID_OPTIONS: {
    status: 400,
    code: "INVALID_OPTIONS",
    message: "One or more options are invalid",
  },
  EMBEDDING_INPUT_REQUIRED: {
    status: 400,
    code: "EMBEDDING_INPUT_REQUIRED",
    message: "input text is required to generate an embedding",
  },
  CANDIDATES_REQUIRED: {
    status: 400,
    code: "CANDIDATES_REQUIRED",
    message: "A non-empty candidates array is required",
  },
  CANDIDATE_REQUIRED: {
    status: 400,
    code: "CANDIDATE_REQUIRED",
    message: "A candidate object is required",
  },
  PAYLOAD_TOO_LARGE: {
    status: 413,
    code: "PAYLOAD_TOO_LARGE",
    message: "Request payload is too large",
  },
  EMBEDDING_FAILED: {
    status: 502,
    code: "EMBEDDING_FAILED",
    message: "Mistral embedding failed",
  },
  BM25_FAILED: {
    status: 502,
    code: "BM25_FAILED",
    message: "BM25 / Atlas Search failed",
  },
  VECTOR_FAILED: {
    status: 502,
    code: "VECTOR_FAILED",
    message: "Vector search failed",
  },
  LLM_RERANK_FAILED: {
    status: 502,
    code: "LLM_RERANK_FAILED",
    message: "LLM re-ranking failed",
  },
  SEARCH_UNAVAILABLE: {
    status: 503,
    code: "SEARCH_UNAVAILABLE",
    message: "No retrieval strategy is currently available",
  },
} as const satisfies Record<string, ErrorDefinition>;

export type RetrievalErrorKey = keyof typeof RetrievalErrors;

/**
 * Build an AppError from the retrieval catalog. An optional message
 * override lets a call site add context while keeping the canonical
 * code/status.
 */
export function retrievalError(
  key: RetrievalErrorKey,
  messageOverride?: string
): AppError {
  const def = RetrievalErrors[key];
  return new AppError(def.status, def.code, messageOverride ?? def.message);
}
