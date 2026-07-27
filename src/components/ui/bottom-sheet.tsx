import { ReactNode, useCallback, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  /** Height as percentage of viewport: 'auto' | 'half' | 'full' */
  height?: 'auto' | 'half' | 'full';
  className?: string;
  showHandle?: boolean;
}

export function BottomSheet({
  open,
  onClose,
  children,
  title,
  height = 'auto',
  className,
  showHandle = true,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  const maxHeight =
    height === 'full' ? '95vh' : height === 'half' ? '50vh' : '80vh';

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.1}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-[61] rounded-t-2xl bg-card border-t border-border shadow-2xl overflow-hidden',
              className
            )}
            style={{
              maxHeight,
              paddingBottom: 'env(safe-area-inset-bottom, 16px)',
            }}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            {/* Header */}
            {title && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">{title}</h3>
                <button
                  onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: `calc(${maxHeight} - 80px)` }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
