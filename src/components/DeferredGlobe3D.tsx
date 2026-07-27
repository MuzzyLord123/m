import { lazy, Suspense, useEffect, useRef, useState } from "react";

const Globe3D = lazy(() =>
  import("@/components/Globe3D").then((m) => ({ default: m.Globe3D }))
);

/**
 * Mounts the WebGL globe only once it is close to the viewport.
 *
 * `lazy()` alone does not help here: the globe sits in the landing page's render
 * tree, so React resolves the import during the first commit and the visitor pays
 * for three.js, @react-three/fiber and drei (~1.2MB of JS) before they have
 * scrolled anywhere near it. Holding the element back until an IntersectionObserver
 * fires keeps that off the initial load for everyone who never scrolls that far.
 */
export function DeferredGlobe3D() {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // No IntersectionObserver (or a prerender/crawler context): fall back to
    // mounting so the section is never permanently blank.
    if (typeof IntersectionObserver === "undefined") {
      setShouldMount(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldMount(true);
          observer.disconnect();
        }
      },
      // Start fetching a little before it scrolls in, so the chunk is usually
      // ready by the time the globe is actually on screen.
      { rootMargin: "400px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const placeholder = (
    <div className="w-full h-full rounded-full bg-muted/20 animate-pulse" />
  );

  return (
    <div ref={ref} className="w-full h-full">
      {shouldMount ? (
        <Suspense fallback={placeholder}>
          <Globe3D />
        </Suspense>
      ) : (
        placeholder
      )}
    </div>
  );
}
