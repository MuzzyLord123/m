import { useState, useEffect, useCallback } from "react";

interface SitePreloaderProps {
  onComplete: () => void;
  minDuration?: number;
  maxDuration?: number;
}

export function SitePreloader({
  onComplete,
  minDuration = 1600,
  maxDuration = 4000,
}: SitePreloaderProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(10);

  const completeLoading = useCallback(() => {
    setLoadingProgress(100);

    setTimeout(() => {
      setIsLoading(false);
      onComplete();
    }, 280);
  }, [onComplete]);

  useEffect(() => {
    const duration = Math.max(minDuration, Math.min(maxDuration, 2200));
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, (elapsed / duration) * 100);
      setLoadingProgress(Math.max(10, progress));
    }, 50);

    const finishTimeout = setTimeout(() => {
      clearInterval(progressInterval);
      completeLoading();
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(finishTimeout);
    };
  }, [completeLoading, minDuration, maxDuration]);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      <div className="relative flex flex-col items-center justify-center">
        <div className="absolute -inset-10 rounded-full bg-primary/25 blur-3xl pulse" />

        <h1
          className="relative z-10 text-5xl sm:text-6xl font-display font-semibold tracking-tight text-foreground"
          style={{ textShadow: "0 0 24px hsl(var(--primary) / 0.45)" }}
        >
          Quooro
        </h1>
      </div>

      <div className="mt-10 w-60 sm:w-72 h-1.5 bg-muted border border-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-primary rounded-full transition-[width] duration-100 ease-out"
          style={{ width: `${loadingProgress}%` }}
        />
      </div>

      <p className="mt-4 text-sm text-muted-foreground">Loading experience...</p>
    </div>
  );
}
