import { AlertOctagon, RefreshCw } from 'lucide-react';

interface SearchErrorProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

/**
 * SearchError — professional error card shown inside a bot bubble when a
 * search fails. Offers a one-click retry of the same query.
 */
export function SearchError({ title, message, onRetry }: SearchErrorProps) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
      <div className="flex items-start gap-2">
        <AlertOctagon size={16} className="mt-0.5 shrink-0 text-red-300" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">{title}</p>
          <p className="mt-0.5 text-xs text-text-muted">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-gradient-to-r from-primary to-accent px-2.5 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
            >
              <RefreshCw size={12} />
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
