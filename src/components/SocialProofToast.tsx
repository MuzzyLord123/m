import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";

const businesses = [
  "A London startup",
  "A Manchester agency",
  "A Birmingham restaurant",
  "A Leeds consultancy",
  "A Glasgow retailer",
  "A Bristol tech company",
  "A Edinburgh hotel",
  "A Cardiff law firm",
];

export function SocialProofToast() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentBusiness, setCurrentBusiness] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check reduced motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Toast lifecycle: show → auto-hide after 5s → cycle to next after 45s
  useEffect(() => {
    if (prefersReducedMotion) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Initial delay
    timers.push(setTimeout(() => setIsVisible(true), 10000));

    // Cycle every 45s
    const cycleInterval = setInterval(() => {
      setIsVisible(false);
      const t = setTimeout(() => {
        setCurrentBusiness(prev => (prev + 1) % businesses.length);
        setIsVisible(true);
      }, 500);
      timers.push(t);
    }, 45000);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(cycleInterval);
    };
  }, [prefersReducedMotion]);

  // Auto-hide 5s after becoming visible
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => setIsVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [isVisible]);

  if (prefersReducedMotion) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: -100, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
          className="fixed bottom-24 sm:bottom-6 left-4 z-40 max-w-xs hidden sm:block"
          style={{
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-card/95 backdrop-blur-xl border border-border/50 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {businesses[currentBusiness]}
              </p>
              <p className="text-xs text-muted-foreground">
                just requested a quote
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
