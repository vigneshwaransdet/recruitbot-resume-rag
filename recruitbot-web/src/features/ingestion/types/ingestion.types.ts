/**
 * Ingestion feature type definitions.
 *
 * These describe the resume ingestion flow consumed by the frontend.
 * The backend exposes the full pipeline at POST /v1/resume/ingest
 * (multipart/form-data, field name "file").
 */

/** High-level status of an in-progress or completed ingestion. */
export type IngestionStatus =
  | 'idle'
  | 'uploading'
  | 'processing'
  | 'success'
  | 'error';

/**
 * Ordered stages surfaced in the progress UI (Phase 5). These mirror the
 * backend pipeline: upload -> extract -> parse -> embed -> store.
 */
export type IngestionStage =
  | 'upload'
  | 'processing'
  | 'parsing'
  | 'embedding'
  | 'storage'
  | 'completed';

/** The selected file plus derived display metadata. */
export interface SelectedFile {
  file: File;
  name: string;
  sizeBytes: number;
}

/**
 * Normalized success payload rendered on the result screen (Phase 6).
 * Field names are intentionally loose because the exact backend shape is
 * reconciled in Phase 3 when the API is wired.
 */
export interface IngestionResult {
  resumeId?: string;
  fileName?: string;
  name?: string | null;
  role?: string | null;
  company?: string | null;
  totalExperience?: number | null;
  skillsCount?: number;
  embeddingModel?: string;
  embeddingDimension?: number;
  totalMs?: number;
  vectorSearchReady?: boolean;
  raw?: Record<string, unknown>;
}

/** Validation outcome for a candidate file before upload (Phase 7). */
export interface FileValidationResult {
  valid: boolean;
  message?: string;
}
