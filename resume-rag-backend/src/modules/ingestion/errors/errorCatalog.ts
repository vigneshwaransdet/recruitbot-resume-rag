import { AppError } from "../../../middleware/errorHandler";

/**
 * Canonical ingestion error catalog (Phase 14).
 *
 * Single source of truth for stable error codes, HTTP statuses and
 * default messages across all ingestion endpoints. This mirrors the
 * architecture document's error table so responses never drift.
 *
 * | Case              | HTTP | Error Code                |
 * |-------------------|-----:|---------------------------|
 * | Missing file      | 400  | FILE_REQUIRED             |
 * | Invalid file      | 415  | INVALID_FILE_TYPE         |
 * | Oversize file     | 413  | FILE_TOO_LARGE            |
 * | Empty resume      | 422  | RESUME_EXTRACTION_FAILED  |
 * | Parse failure     | 422  | RESUME_PARSE_FAILED       |
 * | Embedding failure | 502  | EMBEDDING_FAILED          |
 * | MongoDB failure   | 500  | INGESTION_FAILED          |
 */

export interface ErrorDefinition {
  status: number;
  code: string;
  message: string;
}

export const IngestionErrors = {
  FILE_REQUIRED: {
    status: 400,
    code: "FILE_REQUIRED",
    message: "Resume PDF is required",
  },
  INVALID_FILE_TYPE: {
    status: 415,
    code: "INVALID_FILE_TYPE",
    message: "Only PDF files are allowed",
  },
  FILE_TOO_LARGE: {
    status: 413,
    code: "FILE_TOO_LARGE",
    message: "Resume exceeds maximum upload size",
  },
  RESUME_EXTRACTION_FAILED: {
    status: 422,
    code: "RESUME_EXTRACTION_FAILED",
    message: "Resume extraction failed",
  },
  RESUME_PARSE_FAILED: {
    status: 422,
    code: "RESUME_PARSE_FAILED",
    message: "Resume parsing failed",
  },
  EMBEDDING_FAILED: {
    status: 502,
    code: "EMBEDDING_FAILED",
    message: "Mistral embedding failed",
  },
  INGESTION_FAILED: {
    status: 500,
    code: "INGESTION_FAILED",
    message: "Resume ingestion failed",
  },
  // Supporting validation errors for JSON-body endpoints.
  RAW_TEXT_REQUIRED: {
    status: 400,
    code: "RAW_TEXT_REQUIRED",
    message: "rawText is required in the request body",
  },
  EMBEDDING_INPUT_REQUIRED: {
    status: 400,
    code: "EMBEDDING_INPUT_REQUIRED",
    message: "Provide rawText (and/or name/role/skills) to embed",
  },
  FILE_NAME_REQUIRED: {
    status: 400,
    code: "FILE_NAME_REQUIRED",
    message: "fileName is required",
  },
  EMBEDDING_REQUIRED: {
    status: 400,
    code: "EMBEDDING_REQUIRED",
    message: "A non-empty embedding array is required",
  },
} as const satisfies Record<string, ErrorDefinition>;

export type IngestionErrorKey = keyof typeof IngestionErrors;

/**
 * Build an AppError from the catalog. An optional message override lets
 * a call site add context while keeping the canonical code/status.
 */
export function ingestionError(
  key: IngestionErrorKey,
  messageOverride?: string
): AppError {
  const def = IngestionErrors[key];
  return new AppError(def.status, def.code, messageOverride ?? def.message);
}
