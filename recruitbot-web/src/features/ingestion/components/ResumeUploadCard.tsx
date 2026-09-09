import { AlertTriangle } from 'lucide-react';
import { UploadDropzone } from './UploadDropzone';
import { UploadButton } from './UploadButton';
import { UploadProgress } from './UploadProgress';
import { IngestionProgress } from './IngestionProgress';
import { IngestionResultScreen } from './IngestionResultScreen';
import { IngestionErrorScreen } from './IngestionErrorScreen';
import { useIngestion } from '../hooks/useIngestion';

/**
 * ResumeUploadCard
 *
 * Composition of the upload UI (dropzone + button + progress) with inline
 * validation and dedicated success / error screens.
 *
 * State lives in the Zustand ingestion store, accessed through the
 * useIngestion hook. This card is presentational and delegates selection,
 * upload, retry and reset to the hook.
 */
function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-lg rounded-2xl border border-white/[0.07] bg-bg-surface p-6">
      <header className="mb-5">
        <h2 className="text-lg font-semibold text-text-primary">Upload a resume</h2>
        <p className="mt-1 text-sm text-text-muted">
          Add a candidate PDF to make it searchable in RecruitBot.
        </p>
      </header>
      {children}
    </div>
  );
}

export function ResumeUploadCard() {
  const {
    selectedFile,
    status,
    progress,
    stage,
    result,
    error,
    errorCode,
    validationError,
    selectFile,
    upload,
    retry,
    reset,
  } = useIngestion();

  const isUploading = status === 'uploading';
  const isProcessing = status === 'processing';
  const isBusy = isUploading || isProcessing;
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const canUpload = !!selectedFile && !isBusy;

  // Terminal success: dedicated result screen.
  if (isSuccess && result) {
    return (
      <CardShell>
        <IngestionResultScreen result={result} onReset={reset} />
      </CardShell>
    );
  }

  // Terminal error: dedicated error screen with retry.
  if (isError && error) {
    return (
      <CardShell>
        <IngestionErrorScreen
          code={errorCode}
          message={error}
          onRetry={retry}
          onReset={reset}
        />
      </CardShell>
    );
  }

  return (
    <CardShell>
      <UploadDropzone
        selectedFile={selectedFile}
        onFileSelected={selectFile}
        disabled={isBusy}
      />

      {/* Validation message (non-destructive, Phase 7) */}
      {validationError && !isBusy && (
        <div
          role="alert"
          className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-300"
        >
          <AlertTriangle size={16} />
          {validationError}
        </div>
      )}

      {/* Upload transfer progress */}
      {isUploading && (
        <div className="mt-4">
          <UploadProgress value={progress} label="Uploading resume" />
        </div>
      )}

      {/* Server-side pipeline stepper */}
      {isProcessing && (
        <div className="mt-4 rounded-lg border border-white/[0.08] bg-bg-card p-4">
          <IngestionProgress currentStage={stage} active />
        </div>
      )}

      {/* Action */}
      <div className="mt-5 flex items-center gap-3">
        <UploadButton onUpload={upload} isUploading={isBusy} disabled={!canUpload} />
      </div>
    </CardShell>
  );
}
