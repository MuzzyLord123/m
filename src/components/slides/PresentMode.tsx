import { useEffect, useRef, useState, useCallback } from 'react';
import { Slide } from './types';
import { ScaledSlide } from './ScaledSlide';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PresentModeProps {
  slides: Slide[];
  startIndex: number;
  onExit: () => void;
}

const transitions = {
  none: { initial: {}, animate: {}, exit: {} },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  slide: { initial: { x: '100%', opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: '-100%', opacity: 0 } },
  zoom: { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 1.2, opacity: 0 } },
  flip: { initial: { rotateY: 90, opacity: 0 }, animate: { rotateY: 0, opacity: 1 }, exit: { rotateY: -90, opacity: 0 } },
  blur: { initial: { filter: 'blur(20px)', opacity: 0 }, animate: { filter: 'blur(0px)', opacity: 1 }, exit: { filter: 'blur(20px)', opacity: 0 } },
};

export function PresentMode({ slides, startIndex, onExit }: PresentModeProps) {
  const [current, setCurrent] = useState(startIndex);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [showHUD, setShowHUD] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const cursorTimer = useRef<ReturnType<typeof setTimeout>>();
  const startTime = useRef(Date.now());

  const goNext = useCallback(() => setCurrent(c => Math.min(c + 1, slides.length - 1)), [slides.length]);
  const goPrev = useCallback(() => setCurrent(c => Math.max(c - 1, 0)), []);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const el = document.documentElement;
    el.requestFullscreen?.().catch(() => {});

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onExit(); return; }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown') goNext();
      if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') goPrev();
      if (e.key === 'Home') setCurrent(0);
      if (e.key === 'End') setCurrent(slides.length - 1);
      if (e.key === 'h' || e.key === 'H') setShowHUD(h => !h);
      // Number keys for quick jump
      const num = parseInt(e.key);
      if (!isNaN(num) && num >= 1 && num <= slides.length) setCurrent(num - 1);
    };

    const handleFsChange = () => { if (!document.fullscreenElement) onExit(); };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('fullscreenchange', handleFsChange);
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [goNext, goPrev, onExit, slides.length]);

  // Hide cursor
  useEffect(() => {
    const handleMouseMove = () => {
      setCursorVisible(true);
      if (cursorTimer.current) clearTimeout(cursorTimer.current);
      cursorTimer.current = setTimeout(() => setCursorVisible(false), 2500);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => { window.removeEventListener('mousemove', handleMouseMove); if (cursorTimer.current) clearTimeout(cursorTimer.current); };
  }, []);

  const slide = slides[current];
  if (!slide) return null;

  const t = slide.transition || 'fade';
  const trans = transitions[t] || transitions.fade;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div
      className={cn("fixed inset-0 z-[99999] bg-black flex items-center justify-center", !cursorVisible && "cursor-none")}
      onClick={goNext}
      tabIndex={0}
      autoFocus
      style={{ perspective: '1200px' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={trans.initial}
          animate={trans.animate}
          exit={trans.exit}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full h-full"
        >
          <ScaledSlide slide={slide} className="w-full h-full" />
        </motion.div>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/5">
        <motion.div className="h-full bg-gradient-to-r from-orange-500 to-rose-500" animate={{ width: `${((current + 1) / slides.length) * 100}%` }} transition={{ duration: 0.3 }} />
      </div>

      {/* HUD */}
      <div className={cn(
        "absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6 transition-opacity duration-500",
        cursorVisible ? "opacity-100" : "opacity-0"
      )}>
        {showHUD && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-4 bg-black/60 backdrop-blur-xl rounded-2xl px-5 py-2.5 border border-white/10">
            {/* Slide thumbnails */}
            <div className="flex gap-1.5">
              {slides.map((s, i) => (
                <button key={s.id} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                  className={cn("w-12 h-7 rounded-md overflow-hidden border-2 transition-all", i === current ? "border-orange-500 shadow-lg shadow-orange-500/30" : "border-white/10 opacity-50 hover:opacity-80")}>
                  <ScaledSlide slide={s} className="w-full h-full" />
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-white/20" />
            <span className="text-white/60 text-xs font-mono tabular-nums">{mins}:{secs.toString().padStart(2, '0')}</span>
          </motion.div>
        )}
      </div>

      {/* Slide counter */}
      <div className={cn(
        "absolute bottom-4 right-4 text-white/30 text-[10px] font-mono tabular-nums transition-opacity duration-500",
        cursorVisible ? "opacity-100" : "opacity-0"
      )}>
        {current + 1} / {slides.length}
      </div>

      {/* Controls hint */}
      <div className={cn(
        "absolute top-4 right-4 text-white/20 text-[9px] font-medium transition-opacity duration-500 space-y-0.5 text-right",
        cursorVisible ? "opacity-100" : "opacity-0"
      )}>
        <div>ESC to exit • H for HUD</div>
        <div>← → to navigate</div>
      </div>
    </div>
  );
}
