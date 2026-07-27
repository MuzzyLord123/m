import { useState, useEffect, useRef, RefObject } from "react";

export function useInViewport<T extends HTMLElement = HTMLElement>(
  options?: IntersectionObserverInit
): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [isInViewport, setIsInViewport] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: "50px",
        ...options,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [options]);

  return [ref, isInViewport];
}
