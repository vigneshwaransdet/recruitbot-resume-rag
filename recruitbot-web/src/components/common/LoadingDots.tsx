/**
 * LoadingDots — three staggered bouncing dots used as a typing indicator.
 */
export function LoadingDots() {
  return (
    <span className="flex items-center gap-1" aria-label="Searching" role="status">
      <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-dot-bounce" />
      <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-dot-bounce [animation-delay:0.15s]" />
      <span className="h-1.5 w-1.5 rounded-full bg-text-muted animate-dot-bounce [animation-delay:0.3s]" />
    </span>
  );
}
