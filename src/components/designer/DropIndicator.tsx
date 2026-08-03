import { motion } from 'framer-motion';

interface DropIndicatorProps {
  position: 'before' | 'after' | 'inside';
  rect: DOMRect | null;
  canvasRect: DOMRect | null;
}

const POSITION_LABELS: Record<string, string> = {
  before: 'Insert Above',
  after: 'Insert Below',
  inside: 'Drop Inside',
};

export function DropIndicator({ position, rect, canvasRect }: DropIndicatorProps) {
  if (!rect || !canvasRect) return null;

  const left = rect.left - canvasRect.left;
  const width = rect.width;

  if (position === 'inside') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute',
          left: left - 2,
          top: rect.top - canvasRect.top - 2,
          width: width + 4,
          height: rect.height + 4,
          border: '2px dashed hsl(var(--studio-accent))',
          borderRadius: '8px',
          pointerEvents: 'none',
          zIndex: 100,
          backgroundColor: 'hsl(var(--studio-accent) / 0.04)',
        }}
      >
        {/* Pulsing corner rings */}
        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => {
          const isTop = corner.includes('top');
          const isLeft = corner.includes('left');
          return (
            <motion.div
              key={corner}
              animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute',
                [isTop ? 'top' : 'bottom']: -4,
                [isLeft ? 'left' : 'right']: -4,
                width: 8, height: 8,
                borderRadius: '50%',
                backgroundColor: 'hsl(var(--studio-accent) / 0.4)',
              }}
            />
          );
        })}
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: '3px 10px',
            borderRadius: '6px',
            backgroundColor: 'hsl(var(--studio-accent) / 0.9)',
            color: 'hsl(var(--studio-ink))',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 12px hsl(var(--studio-accent) / 0.4)',
          }}
        >
          {POSITION_LABELS[position]}
        </motion.div>
      </motion.div>
    );
  }

  const top = position === 'before'
    ? rect.top - canvasRect.top - 1.5
    : rect.bottom - canvasRect.top - 1.5;

  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.5 }}
      animate={{ opacity: 1, scaleX: 1 }}
      exit={{ opacity: 0, scaleX: 0.5 }}
      style={{
        position: 'absolute',
        left: left,
        top,
        width,
        height: '3px',
        background: 'linear-gradient(90deg, transparent, hsl(var(--studio-accent)), hsl(var(--studio-accent)), transparent)',
        borderRadius: '2px',
        pointerEvents: 'none',
        zIndex: 100,
        boxShadow: '0 0 8px hsl(var(--studio-accent) / 0.5)',
      }}
    >
      {/* End dots */}
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute', left: -3, top: -3, width: 9, height: 9,
          borderRadius: '50%', backgroundColor: 'hsl(var(--studio-accent))',
          boxShadow: '0 0 6px hsl(var(--studio-accent) / 0.6)',
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        style={{
          position: 'absolute', right: -3, top: -3, width: 9, height: 9,
          borderRadius: '50%', backgroundColor: 'hsl(var(--studio-accent))',
          boxShadow: '0 0 6px hsl(var(--studio-accent) / 0.6)',
        }}
      />
      {/* Position label */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: position === 'before' ? -20 : 8,
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: 'hsl(var(--studio-accent) / 0.9)',
          color: 'hsl(var(--studio-ink))',
          fontSize: '8px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {POSITION_LABELS[position]}
      </motion.div>
    </motion.div>
  );
}
