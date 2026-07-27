import { useEffect, useRef, useState, useCallback } from "react";
import quooroLogo from "@/assets/quooro-logo.png";

interface SplashScreenProps {
  onComplete: () => void;
}

const SPLASH_DISPLAY_MS = 1500;
const SPLASH_EXIT_MS = 500;

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [isExiting, setIsExiting] = useState(false);
  const hasCompletedRef = useRef(false);

  const completeSplash = useCallback(() => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const exitTimer = window.setTimeout(() => {
      setIsExiting(true);
    }, SPLASH_DISPLAY_MS);

    const fallbackCompleteTimer = window.setTimeout(() => {
      completeSplash();
    }, SPLASH_DISPLAY_MS + SPLASH_EXIT_MS + 80);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(fallbackCompleteTimer);
    };
  }, [completeSplash]);

  return (
    <div
      role="status"
      aria-live="polite"
      onTransitionEnd={(event) => {
        if (event.target === event.currentTarget && isExiting) {
          completeSplash();
        }
      }}
      className={`fixed inset-0 z-[99999] flex items-center justify-center bg-background transition-opacity duration-500 ease-out ${
        isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div
        className={`flex flex-col items-center gap-6 transition-transform duration-500 ease-out ${
          isExiting ? "scale-105" : "scale-100"
        }`}
      >
        <img
          src={quooroLogo}
          alt="Quooro"
          className="h-10 sm:h-14 md:h-16 w-auto dark:brightness-0 dark:invert"
        />

        <div className="flex gap-1" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="splash-dot w-2 h-2 rounded-full bg-primary"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        .splash-dot {
          animation: splash-dot-pulse 0.85s ease-in-out infinite;
        }

        @keyframes splash-dot-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
