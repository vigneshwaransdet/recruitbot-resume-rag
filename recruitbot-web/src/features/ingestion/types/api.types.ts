/**
 * Wire types for the ingestion API, mirroring the resume-rag-backend
 * response for POST /v1/resume/ingest.
 */

/** Per-step timings returned by the backend ingestion pipeline. */
export interface IngestionTimings {
  extractMs: number;
  cleanMs: number;
  parseMs: number;
  embeddingMs: number;
  mongoInsertMs: number;
  totalMs: number;
}

/** Parsed summary returned alongside a successful ingestion. */
export interface IngestionData {
  name: string | null;
  role: string | null;
  company: string | null;
  totalExperience: number | null;
  skillsCount: number;
  embeddingModel: string;
  embeddingDimension: number;
}

/** Success body from POST /v1/resume/ingest (HTTP 201). */
export interface IngestResumeResponse {
  success: true;
  message: string;
  resumeId: string;
  data: IngestionData;
  timings: IngestionTimings;
}

/**
 * Standard error body shape from the backend error handler. Fields are
 * optional because network failures produce no response body at all.
 */
export interface ApiErrorBody {
  success?: false;
  errorCode?: string;
  message?: string;
  requestId?: string;
}
