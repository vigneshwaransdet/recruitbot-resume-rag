interface UploadProgressProps {
  /** Progress percentage 0–100. */
  value: number;
  /** Optional label shown above the bar. */
  label?: string;
}

/**
 * UploadProgress
 *
 * Thin determinate progress bar for the upload phase. The multi-stage
 * pipeline stepper (extract -> parse -> embed -> store) is built in Phase 5;
 * this bar covers the raw file-transfer progress.
 */
export function UploadProgress({ value, label = 'Uploading' }: UploadProgressProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between text-xs text-text-muted">
        <span>{label}</span>
        <span>{clamped}%</span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-300 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
