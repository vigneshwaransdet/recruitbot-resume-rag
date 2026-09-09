import { Loader2, Upload } from 'lucide-react';

interface UploadButtonProps {
  /** Fired when the user commits to uploading the selected file. */
  onUpload: () => void;
  /** Whether an upload is currently in flight. */
  isUploading?: boolean;
  /** Disable when no valid file is selected or upload is in progress. */
  disabled?: boolean;
  label?: string;
}

/**
 * UploadButton
 *
 * Primary action for the ingestion flow. Shows a spinner + "Uploading…"
 * while in flight and is disabled when there is nothing valid to upload.
 */
export function UploadButton({
  onUpload,
  isUploading = false,
  disabled = false,
  label = 'Upload resume',
}: UploadButtonProps) {
  const isDisabled = disabled || isUploading;

  return (
    <button
      type="button"
      onClick={onUpload}
      disabled={isDisabled}
      aria-label={label}
      aria-busy={isUploading}
      className={[
        'flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-all',
        isDisabled
          ? 'cursor-not-allowed bg-white/10 opacity-40'
          : 'bg-gradient-to-r from-primary to-accent hover:opacity-90',
      ].join(' ')}
    >
      {isUploading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          Uploading…
        </>
      ) : (
        <>
          <Upload size={16} />
          {label}
        </>
      )}
    </button>
  );
}
