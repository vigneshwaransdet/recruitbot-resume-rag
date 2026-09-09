import { useCallback } from 'react';
import { useSearchStore } from '@/lib/stores/search.store';

/**
 * use-hybrid-weights
 *
 * Keeps the BM25 and vector weights complementary (sum = 100). Changing one
 * slider updates the other; presets set both atomically.
 */
export function useHybridWeights() {
  const bm25Weight = useSearchStore((s) => s.bm25Weight);
  const vectorWeight = useSearchStore((s) => s.vectorWeight);
  const setWeights = useSearchStore((s) => s.setWeights);

  const handleBm25Change = useCallback(
    (value: number) => setWeights(value, 100 - value),
    [setWeights]
  );

  const handleVectorChange = useCallback(
    (value: number) => setWeights(100 - value, value),
    [setWeights]
  );

  const applyPreset = useCallback(
    (bm25: number, vector: number) => setWeights(bm25, vector),
    [setWeights]
  );

  return { bm25Weight, vectorWeight, handleBm25Change, handleVectorChange, applyPreset };
}
