import type { LucideIcon } from 'lucide-react';

interface EnhancementToggleProps {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}

/**
 * EnhancementToggle — a labelled on/off switch for an AI pipeline stage.
 * Styled like the search-mode cards for a consistent sidebar look.
 */
export function EnhancementToggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: EnhancementToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={[
        'flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors',
        disabled ? 'cursor-not-allowed opacity-50' : '',
        checked
          ? 'border-primary/30 bg-primary/[0.10]'
          : 'border-white/[0.07] bg-bg-card hover:border-white/[0.15]',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md',
          checked ? 'bg-primary/20 text-primary' : 'bg-white/[0.06] text-text-muted',
        ].join(' ')}
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text-primary">{label}</span>
        <span className="block truncate text-xs text-text-muted">{description}</span>
      </span>
      {/* Switch track */}
      <span
        className={[
          'relative h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-white/15',
        ].join(' ')}
        aria-hidden="true"
      >
        <span
          className={[
            'absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5',
          ].join(' ')}
        />
      </span>
    </button>
  );
}
