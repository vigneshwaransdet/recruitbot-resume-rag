import { useCallback, useRef } from 'react';
import { useIngestionStore } from '../stores/ingestion.store';
import { ingestionApi, IngestionApiError } from '../services/ingestion.api';
import { validateResumeFile } from '../utils/fileValidation';
import { IN_FLIGHT_STAGES } from '../config/stages';
import type { IngestionResult } from '../types/ingestion.types';

/**
 * useIngestion (Phase 4 + Phase 5)
 *
 * Orchestrates the ingestion flow on top of the Zustand store. Components
 * call selectFile / upload / reset and read state via the store; the hook
 * keeps all side effects (validation + API call + progress + stage cadence)
 * in one place.
 */
export function useIngestion() {
  const selectedFile = useIngestionStore((s) => s.selectedFile);
  const status = useIngestionStore((s) => s.status);
  const progress = useIngestionStore((s) => s.progress);
  const stage = useIngestionStore((s) => s.stage);
  const result = useIngestionStore((s) => s.result);
  const error = useIngestionStore((s) => s.error);
  const errorCode = useIngestionStore((s) => s.errorCode);
  const validationError = useIngestionStore((s) => s.validationError);

  const setSelectedFile = useIngestionStore((s) => s.setSelectedFile);
  const setStatus = useIngestionStore((s) => s.setStatus);
  const setProgress = useIngestionStore((s) => s.setProgress);
  const setStage = useIngestionStore((s) => s.setStage);
  const setResult = useIngestionStore((s) => s.setResult);
  const setError = useIngestionStore((s) => s.setError);
  const setValidationError = useIngestionStore((s) => s.setValidationError);
  const resetStore = useIngestionStore((s) => s.reset);

  // Interval id for the post-upload stage cadence.
  const cadenceRef = useRef<number | null>(null);

  const stopCadence = useCallback(() => {
    if (cadenceRef.current !== null) {
      window.clearInterval(cadenceRef.current);
      cadenceRef.current = null;
    }
  }, []);

  /**
   * After the bytes are uploaded, the backend runs extract -> parse ->
   * embed -> store as one synchronous call without streaming progress.
   * We advance the visible stage on a timed cadence so the stepper reflects
   * plausible pipeline movement. It stops before "completed"; the real
   * completion is set by setResult when the response arrives.
   */
  const startStageCadence = useCallback(() => {
    stopCadence();
    // Stages after "upload", excluding the terminal "completed".
    const serverStages = IN_FLIGHT_STAGES.filter((s) => s !== 'upload');
    let i = 0;
    setStage(serverStages[0] ?? 'processing');
    cadenceRef.current = window.setInterval(() => {
      i += 1;
      if (i >= serverStages.length) {
        // Hold on the last non-terminal stage until the response resolves.
        stopCadence();
        return;
      }
      setStage(serverStages[i]);
    }, 900);
  }, [setStage, stopCadence]);

  /**
   * Validate + record a picked file. Invalid files produce a non-destructive
   * validation message (Phase 7) rather than the terminal error state.
   */
  const selectFile = useCallback(
    (file: File) => {
      const validation = validateResumeFile(file);
      if (!validation.valid) {
        setSelectedFile(null);
        setValidationError(validation.message ?? 'Invalid file');
        return;
      }
      // Valid file: setSelectedFile clears prior validation/error state.
      setSelectedFile(file);
    },
    [setSelectedFile, setValidationError]
  );

  /** Upload the currently selected file through the ingestion pipeline. */
  const upload = useCallback(async () => {
    const validation = validateResumeFile(selectedFile);
    if (!validation.valid || !selectedFile) {
      setValidationError(validation.message ?? 'Please select a file');
      return;
    }

    setValidationError(null);
    setStatus('uploading');
    setStage('upload');
    setProgress(0);
    setError(null);

    try {
      const response = await ingestionApi.ingestResume(selectedFile, (percent) => {
        setProgress(percent);
        if (percent >= 100) {
          // Bytes fully sent — move into the server-side pipeline view.
          setStatus('processing');
          startStageCadence();
        }
      });

      stopCadence();
      const mapped: IngestionResult = {
        resumeId: response.resumeId,
        fileName: selectedFile.name,
        name: response.data.name,
        role: response.data.role,
        company: response.data.company,
        totalExperience: response.data.totalExperience,
        skillsCount: response.data.skillsCount,
        embeddingModel: response.data.embeddingModel,
        embeddingDimension: response.data.embeddingDimension,
        totalMs: response.timings?.totalMs,
        vectorSearchReady: true,
        raw: response as unknown as Record<string, unknown>,
      };
      setResult(mapped);
    } catch (err) {
      stopCadence();
      if (err instanceof IngestionApiError) {
        setError(err.message, err.errorCode ?? null);
      } else {
        setError('Resume ingestion failed. Please try again.');
      }
    }
  }, [
    selectedFile,
    setStatus,
    setStage,
    setProgress,
    setError,
    setResult,
    setValidationError,
    startStageCadence,
    stopCadence,
  ]);

  const reset = useCallback(() => {
    stopCadence();
    resetStore();
  }, [resetStore, stopCadence]);

  /** Retry the upload with the currently selected file (Phase 8). */
  const retry = useCallback(() => {
    setError(null);
    void upload();
  }, [setError, upload]);

  return {
    // state
    selectedFile,
    status,
    progress,
    stage,
    result,
    error,
    errorCode,
    validationError,
    // actions
    selectFile,
    upload,
    retry,
    reset,
  };
}
