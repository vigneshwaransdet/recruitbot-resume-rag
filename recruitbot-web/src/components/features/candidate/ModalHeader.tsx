import { X } from 'lucide-react';

interface ModalHeaderProps {
  name: string;
  subtitle?: string;
  onClose: () => void;
}

/**
 * ModalHeader — candidate name + subtitle (role/company) and a close button.
 * Sticky to the top of the scrollable modal body.
 */
export function ModalHeader({ name, subtitle, onClose }: ModalHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/[0.07] bg-bg-surface px-6 py-4">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold text-text-primary">{name}</h2>
        {subtitle && <p className="truncate text-sm text-text-muted">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close candidate profile"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-white/[0.08] hover:text-text-primary"
      >
        <X size={18} />
      </button>
    </header>
  );
}
