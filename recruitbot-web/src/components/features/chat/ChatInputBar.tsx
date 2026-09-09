import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputBarProps {
  onSubmit: (query: string) => void;
  disabled?: boolean;
}

const MAX_ROWS = 6;

/**
 * ChatInputBar — auto-resizing textarea (1 → 6 lines) with a send button.
 * Enter submits; Shift+Enter inserts a newline. Disabled while searching.
 */
export function ChatInputBar({ onSubmit, disabled }: ChatInputBarProps) {
  const [draft, setDraft] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize: reset height then grow to scrollHeight, capped at MAX_ROWS.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const lineHeight = 20;
    const maxHeight = lineHeight * MAX_ROWS + 20; // + vertical padding
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [draft]);

  const submit = useCallback(() => {
    const q = draft.trim();
    if (!q || disabled) return;
    onSubmit(q);
    setDraft('');
  }, [draft, disabled, onSubmit]);

  return (
    <div className="border-t border-white/[0.07] bg-bg-surface p-4">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          disabled={disabled}
          placeholder="Describe the candidate you're looking for…"
          aria-label="Search query"
          className="max-h-40 flex-1 resize-none rounded-lg border border-white/[0.1] bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary/60 focus:outline-none disabled:opacity-60"
        />
        <button
          type="button"
          onClick={submit}
          disabled={disabled || !draft.trim()}
          aria-label="Send search"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-primary to-accent text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="mt-1.5 text-xs text-text-muted">
        Press Enter to search · Shift+Enter for new line
      </p>
    </div>
  );
}
