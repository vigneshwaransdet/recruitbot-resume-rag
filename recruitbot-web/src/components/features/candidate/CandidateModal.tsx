import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Star } from 'lucide-react';
import { useCandidateModal } from '@/hooks/use-candidate-modal';
import { useSearchStore } from '@/lib/stores/search.store';
import { getModeMeta } from '@/lib/utils/constants';
import { formatScore } from '@/lib/utils/formatters';
import { ModalHeader } from './ModalHeader';
import { ContactSection } from './ContactSection';
import { SkillsSection } from './SkillsSection';

/**
 * CandidateModal (Phase 14)
 *
 * Full candidate profile overlay. Rendered from the SearchResult in the
 * store (no /candidate/:id backend route — see use-candidate-modal).
 *
 * Accessibility: closes on Escape / overlay click, restores focus to the
 * previously focused element, and traps Tab focus inside the dialog while open.
 */
export function CandidateModal() {
  const { isOpen, candidate, closeModal } = useCandidateModal();
  const searchType = useSearchStore((s) => s.searchType);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Escape to close + basic focus trap; lock body scroll while open.
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', onKeyDown);
    // Move focus into the dialog.
    const t = window.setTimeout(() => dialogRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(t);
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, closeModal]);

  return (
    <AnimatePresence>
      {isOpen && candidate && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={closeModal}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Profile for ${candidate.name}`}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="max-h-[88vh] w-full max-w-[640px] overflow-y-auto rounded-2xl border border-white/[0.08] bg-bg-surface shadow-2xl focus:outline-none"
          >
            <ModalHeader
              name={candidate.name}
              subtitle={candidate.role}
              onClose={closeModal}
            />

            <div className="flex flex-col gap-5 p-6">
              {/* Score + experience quick facts */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${getModeMeta(searchType).badgeClass}`}
                >
                  <Star size={12} />
                  {formatScore(candidate.score)} {getModeMeta(searchType).scoreLabel}
                </span>
                {candidate.experienceYears != null && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-xs text-text-muted">
                    <Briefcase size={12} />
                    {candidate.experienceYears} yr
                    {candidate.experienceYears === 1 ? '' : 's'} experience
                  </span>
                )}
              </div>

              {/* Deduplication provenance */}
              {candidate.sources && candidate.sources.length > 0 && (
                <p className="text-xs text-text-muted">
                  Matched by{' '}
                  <span className="text-text-primary">
                    {candidate.sources.length > 1
                      ? 'keyword + semantic search (merged)'
                      : candidate.sources[0] === 'bm25'
                        ? 'keyword search'
                        : 'semantic search'}
                  </span>
                </p>
              )}

              <ContactSection
                email={candidate.email}
                phoneNumber={candidate.phoneNumber}
              />

              <SkillsSection skills={candidate.skills} />

              {/* Why this candidate (re-rank reason) */}
              {candidate.reason && (
                <section>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">
                    Why this candidate
                  </h3>
                  <p className="text-sm leading-relaxed text-text-primary">
                    {candidate.reason}
                  </p>
                </section>
              )}

              {/* Fit summary (LLM) */}
              {candidate.summary && (
                <section>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">
                    Fit summary
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
                    {candidate.summary.replace(/\*\*/g, '').replace(/^[-*]\s*/gm, '• ')}
                  </p>
                </section>
              )}

              {/* Resume excerpt (mode-specific routes only) */}
              {candidate.content && (
                <section>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">
                    Resume excerpt
                  </h3>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-muted">
                    {candidate.content}
                  </p>
                </section>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
