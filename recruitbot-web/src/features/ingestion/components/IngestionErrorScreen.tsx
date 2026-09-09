import { AlertOctagon, RefreshCw, RotateCcw } from 'lucide-react';
import { friendlyError } from '../utils/errorMessages';

interface IngestionErrorScreenProps {
  /** Stable backend error code (or NETWORK_ERROR). */
  code: string | null;
  /** Raw server/normalized message, used as fallback copy. */
  message: string | null;
  /** Retry the upload with the same file. */
  onRetry: () => void;
  /** Clear everything and start over. */
  onReset: () => void;
}

/**
 * IngestionErrorScreen (Phase 8)
 *
 * Terminal error view shown when ingestion fails at any pipeline stage
 * (extraction / parsing / embedding / storage) or on a network error.
 * Maps the backend error code to friendly copy and offers a retry when the
 * failure is likely transient.
 */
export function IngestionErrorScreen({
  code,
  message,
  onRetry,
  onReset,
}: IngestionErrorScreenProps) {
  const friendly = friendlyError(code ?? undefined, message ?? undefined);

  return (
    <div className="flex flex-col gap-5">
      <div
        role="alert"
        className="flex flex-col items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-300">
          <AlertOctagon size={26} />
        </span>
        <div>
          <p className="text-base font-semibold text-text-primary">{friendly.title}</p>
          <p className="mt-1 text-sm text-text-muted">{friendly.message}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {friendly.retryable && (
          <button
            type="button"
            onClick={onRetry}
            aria-label="Retry upload"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          aria-label="Choose another file"
          className={[
            'flex items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-bg-card px-4 py-2.5 text-sm font-medium text-text-primary transition-colors hover:border-primary/60',
            friendly.retryable ? 'flex-1' : 'w-full',
          ].join(' ')}
        >
          <RotateCcw size={16} />
          Choose another file
        </button>
      </div>
    </div>
  );
}
