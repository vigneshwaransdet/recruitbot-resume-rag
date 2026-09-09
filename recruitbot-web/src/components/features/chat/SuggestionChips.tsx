import { SUGGESTION_CHIPS } from '@/lib/utils/constants';

interface SuggestionChipsProps {
  /** Fire the query (auto-submit). */
  onPick: (query: string) => void;
  disabled?: boolean;
}

/**
 * SuggestionChips — pre-canned query chips shown before the first search.
 * Clicking a chip submits its query immediately.
 */
export function SuggestionChips({ onPick, disabled }: SuggestionChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTION_CHIPS.map((chip) => (
        <button
          key={chip.query}
          type="button"
          disabled={disabled}
          onClick={() => onPick(chip.query)}
          className="flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-bg-card px-3 py-1.5 text-xs text-text-primary transition-colors hover:border-primary/60 disabled:opacity-50"
        >
          <span aria-hidden="true">{chip.emoji}</span>
          {chip.label}
        </button>
      ))}
    </div>
  );
}
