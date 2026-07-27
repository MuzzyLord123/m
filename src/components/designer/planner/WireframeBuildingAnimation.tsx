import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutTemplate, Sparkles, Zap } from 'lucide-react';

interface WireframeBuildingAnimationProps {
  pageNames: string[];
  onComplete: () => void;
  progress: string;
  generating: boolean;
}

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 80, scale: 0.6, rotateY: -15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    rotateY: 0,
    transition: {
      delay: 0.3 + i * 0.12,
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  }),
  float: (i: number) => ({
    y: [0, -6, 0],
    transition: {
      delay: i * 0.15,
      duration: 2.5,
      ease: 'easeInOut' as const,
      repeat: Infinity,
    },
  }),
};

const SECTION_VARIANTS = {
  hidden: { width: 0, opacity: 0 },
  visible: (i: number) => ({
    width: '100%',
    opacity: 1,
    transition: {
      delay: 0.1 * i,
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  }),
};

export function WireframeBuildingAnimation({ pageNames, onComplete, progress, generating }: WireframeBuildingAnimationProps) {
  const [phase, setPhase] = useState<'assembling' | 'generating' | 'done'>('assembling');

  useEffect(() => {
    // After cards animate in, move to generating phase
    const timer = setTimeout(() => {
      setPhase('generating');
    }, pageNames.length * 120 + 800);
    return () => clearTimeout(timer);
  }, [pageNames.length]);

  useEffect(() => {
    if (!generating && phase === 'generating') {
      setPhase('done');
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
  }, [generating, phase, onComplete]);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50" style={{ backgroundColor: '#141414' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Status text */}
      <motion.div
        className="mb-10 text-center z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 justify-center mb-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className="h-5 w-5 text-[#a78bfa]" />
          </motion.div>
          <span className="text-sm font-semibold text-[#e0e0e0]">
            {phase === 'assembling' ? 'Building wireframes…' : phase === 'generating' ? 'AI generating layouts…' : 'Complete!'}
          </span>
        </div>
        {progress && (
          <motion.p
            className="text-[11px] text-[#888]"
            key={progress}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {progress}
          </motion.p>
        )}
      </motion.div>

      {/* Animated wireframe cards */}
      <div className="flex gap-4 flex-wrap justify-center max-w-[900px] z-10 perspective-1000">
        {pageNames.map((name, i) => (
          <motion.div
            key={name + i}
            custom={i}
            variants={CARD_VARIANTS}
            initial="hidden"
            animate={phase === 'assembling' ? 'visible' : 'float'}
            className="w-[140px] rounded-lg overflow-hidden"
            style={{
              backgroundColor: '#1e1e1e',
              border: '1px solid #333',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            {/* Mini browser chrome */}
            <div className="flex items-center gap-1 px-2 py-1.5" style={{ borderBottom: '1px solid #2a2a2a' }}>
              <div className="flex gap-0.5">
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#febc2e' }} />
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#28c840' }} />
              </div>
              <span className="text-[7px] font-medium text-[#888] ml-1 truncate flex-1">{name}</span>
            </div>

            {/* Skeleton sections */}
            <div className="p-2 space-y-1.5">
              {[0, 1, 2, 3, 4].map(si => (
                <motion.div
                  key={si}
                  custom={i * 5 + si}
                  variants={SECTION_VARIANTS}
                  initial="hidden"
                  animate="visible"
                  className="rounded-sm"
                  style={{
                    height: si === 0 ? 6 : si === 1 ? 20 : 10,
                    backgroundColor: si === 0 ? 'rgba(74,158,255,0.2)' : si === 1 ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.05)',
                  }}
                />
              ))}
            </div>

            {/* Generating shimmer overlay */}
            <AnimatePresence>
              {phase === 'generating' && (
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.06) 50%, transparent 100%)',
                    backgroundSize: '200% 100%',
                  }}
                >
                  <motion.div
                    className="absolute inset-0"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.1) 50%, transparent 100%)',
                    }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Progress bar */}
      {phase === 'generating' && (
        <motion.div
          className="mt-8 w-64 h-1 rounded-full overflow-hidden z-10"
          style={{ backgroundColor: '#252525' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: '#a78bfa' }}
            initial={{ width: '0%' }}
            animate={{ width: generating ? '85%' : '100%' }}
            transition={{ duration: generating ? 15 : 0.5, ease: generating ? 'linear' : 'easeOut' }}
          />
        </motion.div>
      )}
    </div>
  );
}
