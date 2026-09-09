import { SearchX } from 'lucide-react';

/**
 * EmptyState — shown when a search returns no candidates.
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/[0.06] text-text-muted">
        <SearchX size={22} />
      </span>
      <p className="text-sm font-medium text-text-primary">No candidates found</p>
      <p className="text-xs text-text-muted">
        Try a different query, adjust the mode, or upload more resumes.
      </p>
    </div>
  );
}
