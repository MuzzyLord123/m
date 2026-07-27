import { useState, useEffect, useRef, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ExitSplashProps {
  moduleName: string;
  onComplete: () => void;
  duration?: number;
}

const STEPS = [
  "Saving state",
  "Closing connections",
  "Cleaning up",
];

export const ExitSplash = forwardRef<HTMLDivElement, ExitSplashProps>(function ExitSplash({ moduleName, onComplete, duration = 1800 }, _ref) {
  const [visible, setVisible] = useState(true);
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min(1, elapsed / duration);
      // Ease-out cubic for smooth deceleration
      setProgress(1 - Math.pow(1 - p, 3));

      if (elapsed < duration) {
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  useEffect(() => {
    const stepDelay = duration / (STEPS.length + 1);
    const timers: ReturnType<typeof setTimeout>[] = [];

    STEPS.forEach((_, i) => {
      timers.push(setTimeout(() => setStepIndex(i + 1), stepDelay * (i + 1)));
    });

    timers.push(setTimeout(() => setVisible(false), duration));

    return () => timers.forEach(clearTimeout);
  }, [duration]);

  const handleExitComplete = () => {
    if (!visible) onComplete();
  };

  return (
    <AnimatePresence onExitComplete={handleExitComplete}>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed inset-0 z-[300] flex items-center justify-center"
          style={{ background: "#000000" }}
        >
          {/* Subtle radial vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,255,255,0.02) 0%, transparent 70%)",
            }}
          />

          <div className="relative flex flex-col items-center">
            {/* Spinner ring — Apple-style */}
            <motion.div
              className="relative mb-10"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <svg width="48" height="48" viewBox="0 0 48 48">
                {/* Track */}
                <circle
                  cx="24" cy="24" r="20"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="2.5"
                />
                {/* Progress arc */}
                <motion.circle
                  cx="24" cy="24" r="20"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 20}`}
                  strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress)}`}
                  style={{
                    transform: "rotate(-90deg)",
                    transformOrigin: "center",
                  }}
                />
              </svg>
            </motion.div>

            {/* Title */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-[15px] font-medium tracking-[-0.01em] text-center mb-2"
              style={{
                color: "rgba(255,255,255,0.85)",
                fontFamily: "-apple-system, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif",
              }}
            >
              Closing {moduleName}
            </motion.p>

            {/* Active step */}
            <div className="h-5 flex items-center justify-center">
              <AnimatePresence mode="wait">
                {stepIndex > 0 && stepIndex <= STEPS.length && (
                  <motion.p
                    key={stepIndex}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="text-[12px] font-normal"
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      fontFamily: "-apple-system, 'SF Pro Text', system-ui, sans-serif",
                    }}
                  >
                    {STEPS[stepIndex - 1]}…
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
