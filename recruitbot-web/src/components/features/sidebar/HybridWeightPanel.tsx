import { useHybridWeights } from '@/hooks/use-hybrid-weights';

const PRESETS: { label: string; bm25: number; vector: number }[] = [
  { label: '50/50', bm25: 50, vector: 50 },
  { label: '70/30', bm25: 70, vector: 30 },
  { label: '30/70', bm25: 30, vector: 70 },
];

/**
 * HybridWeightPanel — complementary BM25 / vector sliders (sum = 100) plus
 * preset pills. Rendered only when hybrid mode is active (the parent
 * animates its mount/unmount).
 */
export function HybridWeightPanel() {
  const { bm25Weight, vectorWeight, handleBm25Change, handleVectorChange, applyPreset } =
    useHybridWeights();

  return (
    <div className="rounded-lg border border-white/[0.07] bg-bg-card p-3">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">
        Search Weights
      </p>

      {/* BM25 slider */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-text-muted">BM25 (keyword)</span>
          <span className="font-semibold text-score-bm25">{bm25Weight}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={bm25Weight}
          onChange={(e) => handleBm25Change(Number(e.target.value))}
          aria-label="BM25 weight"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-score-bm25"
        />
      </div>

      {/* Vector slider */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="text-text-muted">Vector (semantic)</span>
          <span className="font-semibold text-score-vector">{vectorWeight}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={vectorWeight}
          onChange={(e) => handleVectorChange(Number(e.target.value))}
          aria-label="Vector weight"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-score-vector"
        />
      </div>

      {/* Preset pills */}
      <div className="flex gap-2">
        {PRESETS.map((p) => {
          const active = bm25Weight === p.bm25 && vectorWeight === p.vector;
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p.bm25, p.vector)}
              aria-pressed={active}
              className={[
                'flex-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-white/[0.1] bg-bg-surface text-text-muted hover:border-white/[0.2]',
              ].join(' ')}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
