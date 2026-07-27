import { ReactNode, useRef, useCallback, useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useTouch';
import { Check, Trash2 } from 'lucide-react';

interface SwipeAction {
  icon: ReactNode;
  label: string;
  color: string;
  onAction: () => void;
}

interface SwipeableCardProps {
  children: ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  className?: string;
  onClick?: () => void;
}

export function SwipeableCard({
  children,
  leftAction,
  rightAction,
  className,
  onClick,
}: SwipeableCardProps) {
  const [offset, setOffset] = useState(0);
  const threshold = 80;

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (info.offset.x > threshold && leftAction) {
        haptic(50);
        leftAction.onAction();
      } else if (info.offset.x < -threshold && rightAction) {
        haptic(100);
        rightAction.onAction();
      }
      setOffset(0);
    },
    [leftAction, rightAction, threshold]
  );

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Left action reveal */}
      {leftAction && offset > 20 && (
        <div
          className="absolute inset-y-0 left-0 flex items-center px-4 rounded-l-lg"
          style={{ backgroundColor: leftAction.color, width: Math.min(offset, 120) }}
        >
          <div className="flex items-center gap-1.5 text-white text-xs font-medium">
            {leftAction.icon}
            <span>{leftAction.label}</span>
          </div>
        </div>
      )}

      {/* Right action reveal */}
      {rightAction && offset < -20 && (
        <div
          className="absolute inset-y-0 right-0 flex items-center justify-end px-4 rounded-r-lg"
          style={{ backgroundColor: rightAction.color, width: Math.min(Math.abs(offset), 120) }}
        >
          <div className="flex items-center gap-1.5 text-white text-xs font-medium">
            <span>{rightAction.label}</span>
            {rightAction.icon}
          </div>
        </div>
      )}

      {/* Card content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: rightAction ? -120 : 0, right: leftAction ? 120 : 0 }}
        dragElastic={0.15}
        onDrag={(_, info) => setOffset(info.offset.x)}
        onDragEnd={handleDragEnd}
        onClick={onClick}
        className={cn(
          'relative bg-card border border-border p-4 rounded-lg touch-target cursor-pointer active:bg-accent/30 transition-colors',
          className
        )}
        style={{ x: offset, touchAction: 'pan-y' }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Converts table data to a mobile card list */
interface MobileDataCardProps {
  children: ReactNode;
  className?: string;
}

export function MobileDataCard({ children, className }: MobileDataCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-4 touch-target space-y-2',
        className
      )}
    >
      {children}
    </div>
  );
}

export function MobileDataLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
      {children}
    </span>
  );
}

export function MobileDataValue({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('text-sm font-medium text-foreground', className)}>
      {children}
    </span>
  );
}
