import { useMemo } from 'react';
import { useUiStore } from '@/lib/stores/ui.store';
import { useSearchStore } from '@/lib/stores/search.store';
import type { SearchResult } from '@/types/search.types';

/**
 * use-candidate-modal
 *
 * Resolves the candidate to show in the modal.
 *
 * NOTE: the backend has no GET /candidate/:id route, so instead of fetching
 * a full profile we render from the SearchResult already in the store (the
 * data returned by the search). This keeps the modal fully functional with
 * real data. When a detail endpoint exists, swap this resolution for a fetch
 * without changing the modal component.
 */
export function useCandidateModal() {
  const candidateModalId = useUiStore((s) => s.candidateModalId);
  const closeCandidateModal = useUiStore((s) => s.closeCandidateModal);
  const results = useSearchStore((s) => s.results);

  const candidate: SearchResult | null = useMemo(() => {
    if (!candidateModalId) return null;
    return results.find((r) => r.resumeId === candidateModalId) ?? null;
  }, [candidateModalId, results]);

  return {
    isOpen: candidateModalId !== null,
    candidate,
    closeModal: closeCandidateModal,
  };
}
