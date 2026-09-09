import { create } from 'zustand';
import type { SearchMode, SearchResult } from '@/types/search.types';
import { DEFAULT_TOP_K } from '@/lib/utils/constants';

interface SearchState {
  searchType: SearchMode;
  bm25Weight: number;
  vectorWeight: number;
  topK: number;
  /** AI enhancement toggles. */
  rerankEnabled: boolean;
  summarizeEnabled: boolean;
  results: SearchResult[];
  isSearching: boolean;
  lastQuery: string;
  setSearchType: (mode: SearchMode) => void;
  setWeights: (bm25: number, vector: number) => void;
  setTopK: (k: number) => void;
  setRerankEnabled: (v: boolean) => void;
  setSummarizeEnabled: (v: boolean) => void;
  setResults: (results: SearchResult[], query: string) => void;
  setSearching: (v: boolean) => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  searchType: 'vector',
  bm25Weight: 50,
  vectorWeight: 50,
  topK: DEFAULT_TOP_K,
  rerankEnabled: true,
  summarizeEnabled: true,
  results: [],
  isSearching: false,
  lastQuery: '',
  setSearchType: (mode) => set({ searchType: mode }),
  setWeights: (bm25, vector) => set({ bm25Weight: bm25, vectorWeight: vector }),
  setTopK: (k) => set({ topK: k }),
  setRerankEnabled: (v) => set({ rerankEnabled: v }),
  setSummarizeEnabled: (v) => set({ summarizeEnabled: v }),
  setResults: (results, query) => set({ results, lastQuery: query }),
  setSearching: (v) => set({ isSearching: v }),
}));
