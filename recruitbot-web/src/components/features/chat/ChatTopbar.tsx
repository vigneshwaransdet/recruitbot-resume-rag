import { Menu } from 'lucide-react';
import { useSearchStore } from '@/lib/stores/search.store';
import { useUiStore } from '@/lib/stores/ui.store';
import { getModeMeta } from '@/lib/utils/constants';

/**
 * ChatTopbar — mini brand + active-mode sub-label on the left, and a
 * colour-coded mode badge on the right. On mobile it also shows a hamburger
 * that opens the sidebar drawer.
 */
export function ChatTopbar() {
  const searchType = useSearchStore((s) => s.searchType);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const modeMeta = getModeMeta(searchType);

  return (
    <header className="flex items-center justify-between gap-2 border-b border-white/[0.07] bg-bg-surface px-4 py-4 md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Open menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-white/[0.08] hover:text-text-primary md:hidden"
        >
          <Menu size={18} />
        </button>

        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-[11px] font-bold text-white">
          RB
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">RecruitBot</p>
          <p className="truncate text-xs text-text-muted">
            {modeMeta.name} · {modeMeta.description}
          </p>
        </div>
      </div>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${modeMeta.badgeClass}`}
      >
        {modeMeta.name}
      </span>
    </header>
  );
}
