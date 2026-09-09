import type { CandidateProfile } from '@/types/candidate.types';

/**
 * Candidate API (placeholder for Phase 14).
 *
 * The instructions doc assumes GET /candidate/:id, but the resume-rag-backend
 * does NOT expose that route. Phase 14 will reconcile this — either by adding
 * a backend route or by adapting the modal to build a profile from the search
 * result already in hand. For now this throws a clear, catchable error so the
 * modal can degrade gracefully.
 */
export const candidateApi = {
  async getCandidate(_id: string): Promise<CandidateProfile> {
    throw new Error(
      'Candidate detail endpoint is not available yet (reconciled in Phase 14).'
    );
  },
};
