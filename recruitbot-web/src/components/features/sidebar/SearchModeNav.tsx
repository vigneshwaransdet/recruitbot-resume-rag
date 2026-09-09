import { Check, Sparkles, Type, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SEARCH_MODES } from '@/lib/utils/constants';
import type { SearchMode } from '@/types/search.types';

const MODE_ICONS: Record<SearchMode, LucideIcon> = {
  vector: Sparkles,
  bm25: Type,
  hybrid: Layers,
};

interface SearchModeNavProps {
  activeMode: SearchMode;
  onChange: (mode: SearchMode) => void;
}

/**
 * SearchModeNav — Vector / BM25 / Hybrid mode cards. The active card is
 * indigo-tinted with a checkmark.
 */
export function SearchModeNav({ activeMode, onChange }: SearchModeNavProps) {
  return (
    <div className="flex flex-col gap-2" role="radiogroup" aria-label="Search mode">
      {SEARCH_MODES.map((mode) => {
        const Icon = MODE_ICONS[mode.key];
        const active = mode.key === activeMode;
        return (
          <button
            key={mode.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(mode.key)}
            className={[
              'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
              active
                ? 'border-indigo-400/30 bg-indigo-500/[0.12]'
                : 'border-white/[0.07] bg-bg-card hover:border-white/[0.15]',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
                active ? 'bg-primary/20 text-primary' : 'bg-white/[0.06] text-text-muted',
              ].join(' ')}
            >
              <Icon size={16} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-text-primary">
                {mode.name}
              </span>
              <span className="block truncate text-xs text-text-muted">
                {mode.description}
              </span>
            </span>
            {active && <Check size={16} className="shrink-0 text-primary" />}
          </button>
        );
      })}
    </div>
  );
}
