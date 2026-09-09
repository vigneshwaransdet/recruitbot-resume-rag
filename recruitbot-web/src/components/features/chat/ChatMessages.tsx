import { useEffect, useRef } from 'react';
import { useChatStore } from '@/lib/stores/chat.store';
import { useSearchStore } from '@/lib/stores/search.store';
import { UserBubble } from './UserBubble';
import { BotBubble } from './BotBubble';
import { LoadingDots } from '@/components/common/LoadingDots';

/**
 * ChatMessages — scrollable thread of user/bot bubbles. Auto-scrolls to the
 * newest message and shows a typing indicator while a search is running.
 */
export function ChatMessages() {
  const messages = useChatStore((s) => s.messages);
  const isSearching = useSearchStore((s) => s.isSearching);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSearching]);

  return (
    <div
      className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6"
      aria-live="polite"
      aria-atomic="false"
    >
      {messages.map((m) =>
        m.type === 'user' ? (
          <UserBubble key={m.id} text={m.text ?? ''} timestamp={m.timestamp} />
        ) : (
          <BotBubble
            key={m.id}
            timestamp={m.isWelcome ? undefined : m.timestamp}
            wide
          >
            {m.content ?? m.text}
          </BotBubble>
        )
      )}

      {isSearching && (
        <BotBubble>
          <span className="flex items-center gap-2 text-text-muted">
            <LoadingDots />
            <span className="text-xs">Searching &amp; ranking candidates…</span>
          </span>
        </BotBubble>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
