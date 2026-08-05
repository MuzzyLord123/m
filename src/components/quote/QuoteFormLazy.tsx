"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/**
 * The quote flow embedded on the contact page sits below the contact details
 * and the map, so its form runtime does not belong on that page's critical
 * path. On /quote itself the form is the page, and is loaded eagerly.
 *
 * Fetched a screen early, behind a placeholder of the same shape.
 */
const QuoteForm = dynamic(() => import("./QuoteForm").then((m) => m.QuoteForm), {
  ssr: false,
  loading: () => <QuoteSkeleton />,
});

export function QuoteFormLazy() {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{near ? <QuoteForm /> : <QuoteSkeleton />}</div>;
}

/** Matches the gauge, step heading and swatch grid so nothing moves. */
function QuoteSkeleton() {
  return (
    <div aria-hidden="true" className="animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-[34px] w-[30px] shrink-0 rounded-[4px] bg-plaster" />
        <div className="h-2.5 flex-1 rounded-full bg-plaster" />
        <div className="h-4 w-12 rounded-full bg-plaster" />
      </div>
      <div className="mt-3 hidden gap-6 sm:flex">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-3 w-20 rounded-full bg-plaster" />
        ))}
      </div>
      <div className="mt-10 h-3 w-40 rounded-full bg-plaster" />
      <div className="mt-5 h-8 w-64 rounded-full bg-plaster" />
      <div className="mt-3 h-4 w-full max-w-md rounded-full bg-plaster" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-[4px] border border-hairline">
            <div className="h-16 w-full bg-plaster" />
            <div className="px-4 py-3.5">
              <div className="h-4 w-28 rounded-full bg-plaster" />
              <div className="mt-2 h-3 w-36 rounded-full bg-plaster" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 flex gap-3 border-t border-hairline pt-6">
        <div className="h-12 w-36 rounded-full bg-plaster" />
        <div className="h-12 w-32 rounded-full bg-plaster" />
      </div>
    </div>
  );
}
