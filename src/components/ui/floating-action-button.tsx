import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useTouch';

interface FABAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

interface FloatingActionButtonProps {
  actions?: FABAction[];
  /** If single action, just provide onClick */
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
}

export function FloatingActionButton({
  actions,
  onClick,
  icon,
  className,
}: FloatingActionButtonProps) {
  const [expanded, setExpanded] = useState(false);

  const handleMainClick = () => {
    haptic(30);
    if (actions && actions.length > 0) {
      setExpanded(!expanded);
    } else {
      onClick?.();
    }
  };

  return (
    <div className={cn('fixed bottom-20 right-4 z-50 lg:hidden', className)}>
      {/* Sub-actions */}
      <AnimatePresence>
        {expanded && actions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3 items-end mb-2"
          >
            {actions.map((action, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  haptic(20);
                  action.onClick();
                  setExpanded(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-card border border-border shadow-lg text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                <span className="text-xs">{action.label}</span>
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  {action.icon}
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleMainClick}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center transition-transform active:scale-95"
      >
        {expanded ? (
          <X className="w-6 h-6" />
        ) : (
          icon || <Plus className="w-6 h-6" />
        )}
      </motion.button>
    </div>
  );
}
