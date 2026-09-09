/**
 * StatusDot — small pulsing "online" indicator.
 */
export function StatusDot() {
  return (
    <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-status-pulse rounded-full bg-score-hybrid" />
      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-score-hybrid" />
    </span>
  );
}
