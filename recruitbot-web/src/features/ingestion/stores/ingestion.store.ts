import { create } from 'zustand';
import type {
  IngestionResult,
  IngestionStage,
  IngestionStatus,
} from '../types/ingestion.types';

/**
 * Ingestion store (Phase 4 + Phase 5)
 *
 * Single source of truth for the resume upload flow:
 * - selectedFile: the file the user picked (pre-upload)
 * - status: idle | uploading | processing | success | error
 * - progress: 0–100 transfer progress (upload phase only)
 * - stage: current pipeline stage for the progress stepper (Phase 5)
 * - result: normalized success payload (Phase 6 result screen)
 * - error: user-facing error message (Phase 8 error handling)
 *
 * The store holds state only; the API call is orchestrated by the
 * useIngestion hook so the store stays free of side effects.
 */
interface IngestionState {
  selectedFile: File | null;
  status: IngestionStatus;
  progress: number;
  stage: IngestionStage;
  result: IngestionResult | null;
  /** Server / pipeline / network error (Phase 8). Flips status to 'error'. */
  error: string | null;
  /** Stable backend error code (or NETWORK_ERROR) for friendly mapping. */
  errorCode: string | null;
  /**
   * Client-side validation message (Phase 7). Non-destructive: shown inline
   * without moving the flow into the terminal error state.
   */
  validationError: string | null;

  setSelectedFile: (file: File | null) => void;
  setStatus: (status: IngestionStatus) => void;
  setProgress: (progress: number) => void;
  setStage: (stage: IngestionStage) => void;
  setResult: (result: IngestionResult) => void;
  setError: (message: string | null, code?: string | null) => void;
  setValidationError: (message: string | null) => void;
  reset: () => void;
}

const initialState = {
  selectedFile: null as File | null,
  status: 'idle' as IngestionStatus,
  progress: 0,
  stage: 'upload' as IngestionStage,
  result: null as IngestionResult | null,
  error: null as string | null,
  errorCode: null as string | null,
  validationError: null as string | null,
};

export const useIngestionStore = create<IngestionState>((set) => ({
  ...initialState,

  setSelectedFile: (file) =>
    set({
      selectedFile: file,
      status: 'idle',
      progress: 0,
      stage: 'upload',
      error: null,
      errorCode: null,
      validationError: null,
      result: null,
    }),
  setStatus: (status) => set({ status }),
  setProgress: (progress) => set({ progress }),
  setStage: (stage) => set({ stage }),
  setResult: (result) =>
    set({ result, status: 'success', stage: 'completed', error: null }),
  setError: (message, code = null) =>
    set({ error: message, errorCode: code, status: message ? 'error' : 'idle' }),
  setValidationError: (message) => set({ validationError: message }),
  reset: () => set({ ...initialState }),
}));
