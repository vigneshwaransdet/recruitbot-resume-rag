import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { formatTime } from '@/lib/utils/formatters';

interface BotBubbleProps {
  children: ReactNode;
  timestamp?: Date;
  /** When true, the bubble stretches wider (used for result lists). */
  wide?: boolean;
}

/**
 * BotBubble — left-aligned card bubble for RecruitBot responses. Accepts
 * arbitrary children (plain text or a rich ResultsList).
 */
export function BotBubble({ children, timestamp, wide }: BotBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-start"
    >
      <div className="flex max-w-[85%] items-start gap-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-[10px] font-bold text-white">
          RB
        </span>
        <div
          className={[
            'rounded-2xl rounded-tl-sm bg-bg-card px-4 py-2.5 text-text-primary',
            wide ? 'w-full' : '',
          ].join(' ')}
        >
          <div className="text-sm">{children}</div>
          {timestamp && (
            <div className="mt-1 text-[10px] text-text-muted">{formatTime(timestamp)}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
