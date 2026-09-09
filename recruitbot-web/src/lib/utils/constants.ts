import type { SearchMode } from '@/types/search.types';

/** Metadata for each search mode, used by the sidebar nav and topbar badge. */
export interface SearchModeMeta {
  key: SearchMode;
  name: string;
  description: string;
  scoreLabel: string;
  /**
   * Full, static Tailwind class strings (NOT dynamically built) so the
   * JIT compiler can see them. text-... class for score text, badge for
   * the topbar pill.
   */
  scoreTextClass: string;
  badgeClass: string;
}

export const SEARCH_MODES: SearchModeMeta[] = [
  {
    key: 'vector',
    name: 'Vector Search',
    description: 'Semantic similarity',
    scoreLabel: 'Similarity',
    scoreTextClass: 'text-score-vector',
    badgeClass: 'bg-score-vector/20 text-score-vector',
  },
  {
    key: 'bm25',
    name: 'BM25 Keyword',
    description: 'Lexical keyword match',
    scoreLabel: 'BM25 Score',
    scoreTextClass: 'text-score-bm25',
    badgeClass: 'bg-score-bm25/20 text-score-bm25',
  },
  {
    key: 'hybrid',
    name: 'Hybrid',
    description: 'Keyword + semantic',
    scoreLabel: 'Hybrid',
    scoreTextClass: 'text-score-hybrid',
    badgeClass: 'bg-score-hybrid/20 text-score-hybrid',
  },
];

export function getModeMeta(mode: SearchMode): SearchModeMeta {
  return SEARCH_MODES.find((m) => m.key === mode) ?? SEARCH_MODES[0];
}

/** Results-limit options for the sidebar select. */
export const RESULT_LIMIT_OPTIONS = [3, 5, 10, 20];
export const DEFAULT_TOP_K = 5;

/** Pre-canned query chips shown before the first search. */
export interface SuggestionChip {
  emoji: string;
  label: string;
  query: string;
}

export const SUGGESTION_CHIPS: SuggestionChip[] = [
  { emoji: '🔍', label: 'Selenium QA 3 yrs', query: 'Selenium automation engineer 3 years' },
  { emoji: '🐍', label: 'Python ML dev', query: 'Python developer with machine learning' },
  { emoji: '☁️', label: 'Java AWS backend', query: 'Java backend developer AWS cloud' },
  { emoji: '⚡', label: 'Lead QA Cypress', query: 'Lead QA engineer with Cypress and CI/CD' },
];
