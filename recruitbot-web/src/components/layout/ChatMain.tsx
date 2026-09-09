import { ChatTopbar } from '@/components/features/chat/ChatTopbar';
import { ChatMessages } from '@/components/features/chat/ChatMessages';
import { ChatInputBar } from '@/components/features/chat/ChatInputBar';
import { SuggestionChips } from '@/components/features/chat/SuggestionChips';
import { useChatStore } from '@/lib/stores/chat.store';
import { useSearchStore } from '@/lib/stores/search.store';
import { useSearch } from '@/hooks/use-search';

/**
 * ChatMain (Phase 13)
 *
 * Composes the chat interface and wires real search via use-search. The
 * welcome message is owned by the chat store (seeded on load and after
 * clear), so there is no effect-driven seeding here.
 */
export function ChatMain() {
  const messages = useChatStore((s) => s.messages);
  const isSearching = useSearchStore((s) => s.isSearching);
  const { submitQuery } = useSearch();

  // True once the user has run at least one query.
  const hasUserQuery = messages.some((m) => m.type === 'user');

  return (
    <main className="flex h-full flex-1 flex-col">
      <ChatTopbar />
      <ChatMessages />

      {/* Suggestion chips before the first query */}
      {!hasUserQuery && (
        <div className="px-4 pb-2 md:px-6">
          <SuggestionChips onPick={submitQuery} disabled={isSearching} />
        </div>
      )}

      <ChatInputBar onSubmit={submitQuery} disabled={isSearching} />
    </main>
  );
}
