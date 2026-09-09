import { create } from 'zustand';

interface UiState {
  /** Mobile sidebar drawer open state. */
  isSidebarOpen: boolean;
  /** Candidate modal target id (null = closed). */
  candidateModalId: string | null;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openCandidateModal: (id: string) => void;
  closeCandidateModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  candidateModalId: null,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  openCandidateModal: (id) => set({ candidateModalId: id }),
  closeCandidateModal: () => set({ candidateModalId: null }),
}));
