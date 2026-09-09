import { create } from 'zustand';
import type { ReactNode } from 'react';
import type { Message } from '@/types/chat.types';
import { WelcomeMessage } from '@/components/features/chat/WelcomeMessage';

interface ChatState {
  messages: Message[];
  addUserMessage: (text: string) => void;
  addBotMessage: (content: ReactNode, opts?: { isWelcome?: boolean }) => void;
  clearMessages: () => void;
}

function id(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Build the initial welcome message. Owned by the store so it appears
 * exactly once on load and after clearing (no effect-driven seeding, which
 * double-fired under React 18 StrictMode).
 */
function welcomeMessage(): Message {
  return {
    id: id(),
    type: 'bot',
    content: <WelcomeMessage />,
    timestamp: new Date(),
    isWelcome: true,
  };
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [welcomeMessage()],
  addUserMessage: (text) =>
    set((s) => ({
      messages: [
        ...s.messages,
        { id: id(), type: 'user', text, timestamp: new Date() },
      ],
    })),
  addBotMessage: (content, opts) =>
    set((s) => ({
      messages: [
        ...s.messages,
        {
          id: id(),
          type: 'bot',
          content,
          timestamp: new Date(),
          isWelcome: opts?.isWelcome,
        },
      ],
    })),
  clearMessages: () => set({ messages: [welcomeMessage()] }),
}));
