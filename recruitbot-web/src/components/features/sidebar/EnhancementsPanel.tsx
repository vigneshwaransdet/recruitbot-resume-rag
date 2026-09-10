import { FileText, Sparkles, Layers } from 'lucide-react';
import { EnhancementToggle } from './EnhancementToggle';
import { useSearchStore } from '@/lib/stores/search.store';

/**
 * EnhancementsPanel — AI capabilities of the Hybrid pipeline.
 *
 * This panel is only rendered when Hybrid mode is active (see Sidebar), so
 * every control here applies. Re-ranking and Deduplication are ALWAYS ON
 * (shown as indicators, not switches, since they only improve results).
 * Summarize is a genuine toggle — it's the heaviest/slowest LLM step.
 */
export function EnhancementsPanel() {
  const summarizeEnabled = useSearchStore((s) => s.summarizeEnabled);
  const setSummarizeEnabled = useSearchStore((s) => s.setSummarizeEnabled);

  return (
    <div className="flex flex-col gap-2">
      {/* Always-on capabilities (indicators, not toggles) */}
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-bg-card px-3 py-2 text-xs text-text-muted">
        <Sparkles size={14} className="text-primary" />
        <span className="flex-1">AI re-ranking</span>
        <span className="rounded-full bg-score-hybrid/15 px-1.5 py-0.5 text-[10px] font-medium text-score-hybrid">
          Always on
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-bg-card px-3 py-2 text-xs text-text-muted">
        <Layers size={14} className="text-primary" />
        <span className="flex-1">Deduplication</span>
        <span className="rounded-full bg-score-hybrid/15 px-1.5 py-0.5 text-[10px] font-medium text-score-hybrid">
          Always on
        </span>
      </div>

      {/* Summarize — the one genuine toggle */}
      <EnhancementToggle
        icon={FileText}
        label="Summarize"
        description="AI fit summaries"
        checked={summarizeEnabled}
        onChange={setSummarizeEnabled}
      />
    </div>
  );
}
