import type { ReactNode } from 'react';

/** A chat message is either a user query or a bot response. */
export type MessageType = 'user' | 'bot';

export interface Message {
  id: string;
  type: MessageType;
  /** Plain text (user messages, or simple bot text). */
  text?: string;
  /** Rich content for bot messages (e.g. a results list). */
  content?: ReactNode;
  timestamp: Date;
  /** Marks the intro/welcome message so it can be treated specially. */
  isWelcome?: boolean;
}
