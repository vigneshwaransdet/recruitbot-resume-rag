import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Upload, X } from 'lucide-react';
import { BrandAvatar } from '@/components/common/BrandAvatar';
import { SearchModeNav } from '@/components/features/sidebar/SearchModeNav';
import { HybridWeightPanel } from '@/components/features/sidebar/HybridWeightPanel';
import { EnhancementsPanel } from '@/components/features/sidebar/EnhancementsPanel';
import { ResultsLimitSelect } from '@/components/features/sidebar/ResultsLimitSelect';
import { ClearChatButton } from '@/components/features/sidebar/ClearChatButton';
import { useSearchStore } from '@/lib/stores/search.store';
import { useUiStore } from '@/lib/stores/ui.store';
import type { SearchMode } from '@/types/search.types';

function SectionLabel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={`text-xs font-medium uppercase tracking-widest text-text-muted ${className}`}
    >
      {children}
    </p>
  );
}

/** Shared sidebar body used by both the desktop column and mobile drawer. */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const searchType = useSearchStore((s) => s.searchType);
  const setSearchType = useSearchStore((s) => s.setSearchType);

  const handleModeChange = (mode: SearchMode) => {
    setSearchType(mode);
    // On mobile, picking a mode is a natural point to close the drawer —
    // but keep it open for hybrid so the user can tune the weights.
    if (mode !== 'hybrid') onNavigate?.();
  };

  return (
    <>
      <BrandAvatar />

      <div className="flex flex-col gap-2">
        <SectionLabel>Search Mode</SectionLabel>
        <SearchModeNav activeMode={searchType} onChange={handleModeChange} />
      </div>

      <AnimatePresence initial={false}>
        {searchType === 'hybrid' && (
          <motion.div
            key="hybrid-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <HybridWeightPanel />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2">
        <SectionLabel>AI Enhancements</SectionLabel>
        <EnhancementsPanel />
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <SectionLabel>Results limit</SectionLabel>
          <ResultsLimitSelect />
        </div>
        <ClearChatButton />
        <Link
          to="/ingest"
          className="flex items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-bg-card px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:border-primary/60"
        >
          <Upload size={15} />
          Upload resume
        </Link>
        <footer className="pt-1 text-xs text-text-muted">RecruitBot v2.0</footer>
      </div>
    </>
  );
}

/**
 * Sidebar (Phase 11 + Phase D responsive)
 *
 * Desktop (md+): fixed 260px column, always visible.
 * Mobile (<md): slide-out drawer + backdrop, toggled from the topbar
 * hamburger via the ui store's isSidebarOpen.
 */
export function Sidebar() {
  const isSidebarOpen = useUiStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const close = () => setSidebarOpen(false);

  return (
    <>
      {/* Desktop column */}
      <aside className="hidden w-[260px] shrink-0 flex-col gap-4 overflow-y-auto border-r border-white/[0.07] bg-bg-surface p-5 md:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={close}
              aria-hidden="true"
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[280px] max-w-[85vw] flex-col gap-4 overflow-y-auto border-r border-white/[0.07] bg-bg-surface p-5 md:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              role="dialog"
              aria-label="Menu"
            >
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-white/[0.08] hover:text-text-primary"
              >
                <X size={18} />
              </button>
              <SidebarContent onNavigate={close} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
