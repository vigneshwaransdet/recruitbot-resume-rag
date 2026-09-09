/**
 * Maps backend ingestion error codes (from the resume-rag-backend error
 * catalog) to friendly, recruiter-facing messages for the UI (Phase 8).
 *
 * Backend codes (verified):
 *   FILE_REQUIRED            400  missing file
 *   INVALID_FILE_TYPE        415  not a PDF
 *   FILE_TOO_LARGE           413  over the size limit
 *   RESUME_EXTRACTION_FAILED 422  PDF text could not be extracted
 *   RESUME_PARSE_FAILED      422  parsing to structured fields failed
 *   EMBEDDING_FAILED         502  Mistral embedding step failed
 *   INGESTION_FAILED         500  MongoDB store / pipeline failure
 */

/** A user-facing error plus whether retrying is likely to help. */
export interface FriendlyError {
  title: string;
  message: string;
  retryable: boolean;
}

const ERROR_MAP: Record<string, FriendlyError> = {
  FILE_REQUIRED: {
    title: 'No file received',
    message: 'The server did not receive a file. Please select a PDF and try again.',
    retryable: true,
  },
  INVALID_FILE_TYPE: {
    title: 'Unsupported file type',
    message: 'Only PDF files are allowed. Please choose a PDF resume.',
    retryable: false,
  },
  FILE_TOO_LARGE: {
    title: 'File too large',
    message: 'The resume exceeds the 5MB limit. Please upload a smaller PDF.',
    retryable: false,
  },
  RESUME_EXTRACTION_FAILED: {
    title: 'PDF extraction failed',
    message:
      "We couldn't read text from this PDF. It may be scanned or image-only. Try a text-based PDF.",
    retryable: false,
  },
  RESUME_PARSE_FAILED: {
    title: 'Resume parsing failed',
    message:
      "We couldn't structure this resume. Please check the file, or try a different resume.",
    retryable: true,
  },
  EMBEDDING_FAILED: {
    title: 'Embedding generation failed',
    message:
      'The embedding service is temporarily unavailable. Please try again in a moment.',
    retryable: true,
  },
  INGESTION_FAILED: {
    title: 'Storage failed',
    message:
      'The resume could not be saved to the database. Please try again in a moment.',
    retryable: true,
  },
  NETWORK_ERROR: {
    title: 'Network error',
    message:
      'Could not reach the server. Check your connection and that the backend is running.',
    retryable: true,
  },
};

const FALLBACK_ERROR: FriendlyError = {
  title: 'Ingestion failed',
  message: 'Something went wrong during ingestion. Please try again.',
  retryable: true,
};

/**
 * Resolve a friendly error from a backend error code (or the synthetic
 * NETWORK_ERROR). Falls back to a generic retryable message. An optional
 * server message can override the body copy when present and useful.
 */
export function friendlyError(
  code: string | undefined,
  serverMessage?: string
): FriendlyError {
  const base = (code && ERROR_MAP[code]) || FALLBACK_ERROR;
  // Prefer the curated copy; only fall back to the raw server message when
  // we have no mapping for the code at all.
  if (!code || !ERROR_MAP[code]) {
    return {
      ...base,
      message: serverMessage?.trim() || base.message,
    };
  }
  return base;
}
