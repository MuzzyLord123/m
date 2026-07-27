import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TypingIndicatorProps {
  className?: string;
}

const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
  ({ className }, ref) => {
    return (
      <div ref={ref} className={cn('flex items-center gap-1', className)}>
        <motion.div
          className="w-2 h-2 rounded-full bg-muted-foreground/50"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-muted-foreground/50"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="w-2 h-2 rounded-full bg-muted-foreground/50"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
      </div>
    );
  }
);

TypingIndicator.displayName = 'TypingIndicator';

export { TypingIndicator };
