import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QuickActions } from './QuickActions';
import { ChatBot } from '@/components/ChatBot';

/**
 * Floating dock that holds the Chatbot (top) and QuickActions (bottom).
 * Hides off the right edge when idle; slides in on hover/touch near edge.
 */
export function FloatingDock() {
  const [revealed, setRevealed] = useState(false);
  const [idle, setIdle] = useState(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);

  const panelOpen = chatOpen || quickActionsOpen;

  const startIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (!panelOpen) setIdle(true);
    }, 3500);
  }, [panelOpen]);

  // Show on mount for 4s, then hide
  useEffect(() => {
    const t = setTimeout(() => {
      if (!panelOpen) setIdle(true);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  // Force visible when panels open
  useEffect(() => {
    if (panelOpen) {
      setIdle(false);
      setRevealed(true);
    }
  }, [panelOpen]);

  // Mouse near right edge + bottom reveals dock
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const nearRight = window.innerWidth - e.clientX < 90;
      const nearBottom = window.innerHeight - e.clientY < 250;
      if (nearRight && nearBottom) {
        setRevealed(true);
        setIdle(false);
        startIdleTimer();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [startIdleTimer]);

  // Listen for chatbot open events
  useEffect(() => {
    const handler = () => {
      setChatOpen(true);
      setIdle(false);
      setRevealed(true);
    };
    window.addEventListener('openChatbot', handler);
    return () => window.removeEventListener('openChatbot', handler);
  }, []);

  const isVisible = panelOpen || revealed || !idle;

  return (
    <motion.div
      className="fixed right-0 bottom-6 z-40 flex flex-col items-end pr-4"
      initial={{ x: 0 }}
      animate={{ x: isVisible ? 0 : 56 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onMouseEnter={() => {
        setRevealed(true);
        setIdle(false);
        startIdleTimer();
      }}
      onMouseLeave={() => {
        if (!panelOpen) {
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
          idleTimerRef.current = setTimeout(() => {
            setRevealed(false);
            setIdle(true);
          }, 1500);
        }
      }}
      onTouchStart={() => {
        setRevealed(true);
        setIdle(false);
        startIdleTimer();
      }}
    >
      {/* Peek tab when hidden */}
      <AnimatePresence>
        {!isVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute -left-2 bottom-4 h-20 w-2 cursor-pointer rounded-l-full bg-foreground/20"
            onClick={() => {
              setRevealed(true);
              setIdle(false);
              startIdleTimer();
            }}
          />
        )}
      </AnimatePresence>

      {/* Single quiet cluster: hairline surface holding both triggers */}
      <div className="flex flex-col items-center gap-2 rounded-full border border-border/60 bg-card p-1.5">
        {/* Chatbot button + window */}
        <ChatBot
          isEmbedded
          isOpen={chatOpen}
          onToggle={() => setChatOpen(prev => !prev)}
        />

        {/* Quick Actions button + menu */}
        <QuickActions
          isEmbedded
          isOpen={quickActionsOpen}
          onToggle={() => setQuickActionsOpen(prev => !prev)}
        />
      </div>
    </motion.div>
  );
}
