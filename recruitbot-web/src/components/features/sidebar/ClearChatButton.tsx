import { X } from 'lucide-react';
import { useChatStore } from '@/lib/stores/chat.store';

/**
 * ClearChatButton — clears the chat thread. The welcome message is
 * re-seeded by the chat page when the thread becomes empty (Phase 12/15).
 */
export function ClearChatButton() {
  const clearMessages = useChatStore((s) => s.clearMessages);

  return (
    <button
      type="button"
      onClick={clearMessages}
      aria-label="Clear chat"
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/[0.12] bg-bg-card px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:border-red-400/40 hover:text-red-300"
    >
      <X size={15} />
      Clear chat
    </button>
  );
}
