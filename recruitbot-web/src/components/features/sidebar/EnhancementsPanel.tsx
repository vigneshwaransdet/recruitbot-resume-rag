import { ListOrdered, FileText } from 'lucide-react';
import { EnhancementToggle } from './EnhancementToggle';
import { useSearchStore } from '@/lib/stores/search.store';

/**
 * EnhancementsPanel — sidebar section for the AI pipeline enhancements
 * (re-ranking and summarization), shown alongside the search modes.
 *
 * - Summarize toggles the backend `summarize` option (real behaviour).
 * - Re-ranking toggles whether the LLM relevance score + reason are shown
 *   on results (the backend pipeline always re-ranks).
 */
export function EnhancementsPanel() {
  const rerankEnabled = useSearchStore((s) => s.rerankEnabled);
  const summarizeEnabled = useSearchStore((s) => s.summarizeEnabled);
  const setRerankEnabled = useSearchStore((s) => s.setRerankEnabled);
  const setSummarizeEnabled = useSearchStore((s) => s.setSummarizeEnabled);

  return (
    <div className="flex flex-col gap-2">
      <EnhancementToggle
        icon={ListOrdered}
        label="Re-ranking"
        description="AI relevance ordering"
        checked={rerankEnabled}
        onChange={setRerankEnabled}
      />
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
