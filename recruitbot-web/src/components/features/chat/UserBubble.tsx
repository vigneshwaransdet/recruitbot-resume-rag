import { motion } from 'framer-motion';
import { formatTime } from '@/lib/utils/formatters';

interface UserBubbleProps {
  text: string;
  timestamp: Date;
}

/**
 * UserBubble — right-aligned gradient bubble for the recruiter's query.
 */
export function UserBubble({ text, timestamp }: UserBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex justify-end"
    >
      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-white">
        <p className="whitespace-pre-wrap break-words text-sm">{text}</p>
        <div className="mt-1 text-right text-[10px] opacity-70">
          {formatTime(timestamp)}
        </div>
      </div>
    </motion.div>
  );
}
