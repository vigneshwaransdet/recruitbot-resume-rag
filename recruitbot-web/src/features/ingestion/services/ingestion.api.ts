import { AxiosError } from 'axios';
import apiClient from '@/lib/api/client';
import type { IngestResumeResponse, ApiErrorBody } from '../types/api.types';

/** Optional callback that reports 0–100 upload progress. */
export type UploadProgressHandler = (percent: number) => void;

/**
 * Normalized error thrown by the ingestion API so the UI can show a
 * stable message and (optionally) branch on the backend errorCode.
 */
export class IngestionApiError extends Error {
  readonly errorCode?: string;
  readonly status?: number;
  readonly isNetworkError: boolean;

  constructor(message: string, opts: { errorCode?: string; status?: number; isNetworkError?: boolean } = {}) {
    super(message);
    this.name = 'IngestionApiError';
    this.errorCode = opts.errorCode;
    this.status = opts.status;
    this.isNetworkError = opts.isNetworkError ?? false;
  }
}

export const ingestionApi = {
  /**
   * Upload a resume PDF through the full ingestion pipeline.
   *
   * POST /v1/resume/ingest as multipart/form-data with field name "file".
   * Reports transfer progress via onProgress (upload phase only — the
   * server-side pipeline time is not reflected in this percentage).
   */
  async ingestResume(
    file: File,
    onProgress?: UploadProgressHandler
  ): Promise<IngestResumeResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post<IngestResumeResponse>(
        '/v1/resume/ingest',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (evt) => {
            if (!onProgress) return;
            const total = evt.total ?? file.size;
            if (total > 0) {
              onProgress(Math.round((evt.loaded / total) * 100));
            }
          },
        }
      );
      return response.data;
    } catch (err) {
      throw normalizeError(err);
    }
  },
};

/** Convert any Axios/unknown failure into a stable IngestionApiError. */
function normalizeError(err: unknown): IngestionApiError {
  if (err instanceof AxiosError) {
    // No response => network / timeout / CORS.
    if (!err.response) {
      return new IngestionApiError(
        'Network error. Check your connection and that the backend is running.',
        { errorCode: 'NETWORK_ERROR', isNetworkError: true }
      );
    }
    const status = err.response.status;
    const body = err.response.data as ApiErrorBody | undefined;
    const message = body?.message || defaultMessageForStatus(status);
    return new IngestionApiError(message, { errorCode: body?.errorCode, status });
  }
  return new IngestionApiError('Unexpected error during ingestion.');
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'The upload was rejected. Please check the file and try again.';
    case 413:
      return 'File is too large. Maximum 5MB allowed.';
    case 415:
      return 'Unsupported file type. Only PDF allowed.';
    case 500:
      return 'Server error during ingestion. Please try again later.';
    default:
      return 'Resume ingestion failed. Please try again.';
  }
}
