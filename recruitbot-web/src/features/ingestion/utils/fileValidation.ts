import type { FileValidationResult } from '../types/ingestion.types';

/** Maximum accepted upload size, mirroring the backend limit (5 MB). */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const MAX_FILE_SIZE_MB = 5;

/** Accepted MIME type for resume uploads. */
const PDF_MIME = 'application/pdf';

/**
 * Stable validation codes so callers can branch without matching on the
 * user-facing copy.
 */
export type FileValidationCode = 'EMPTY' | 'INVALID_TYPE' | 'TOO_LARGE';

/**
 * Canonical validation messages (Phase 7 rules). Kept in one place so the
 * copy stays consistent everywhere it is surfaced.
 */
export const VALIDATION_MESSAGES: Record<FileValidationCode, string> = {
  EMPTY: 'Please select a file',
  INVALID_TYPE: 'Only PDF allowed',
  TOO_LARGE: `Maximum ${MAX_FILE_SIZE_MB}MB allowed`,
};

/** Validation result including the stable code, for richer handling. */
export interface DetailedFileValidationResult extends FileValidationResult {
  code?: FileValidationCode;
}

/**
 * Validate a candidate file before upload:
 * - a file must be present            -> EMPTY
 * - it must be a PDF                  -> INVALID_TYPE
 * - it must not exceed the size limit -> TOO_LARGE
 */
export function validateResumeFile(
  file: File | null | undefined
): DetailedFileValidationResult {
  if (!file) {
    return { valid: false, code: 'EMPTY', message: VALIDATION_MESSAGES.EMPTY };
  }

  const isPdf =
    file.type === PDF_MIME || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return {
      valid: false,
      code: 'INVALID_TYPE',
      message: VALIDATION_MESSAGES.INVALID_TYPE,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      code: 'TOO_LARGE',
      message: VALIDATION_MESSAGES.TOO_LARGE,
    };
  }

  return { valid: true };
}

/** Human-readable file size, e.g. "1.4 MB" / "820 KB". */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
