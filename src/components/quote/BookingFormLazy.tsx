"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

/**
 * The booking flow sits well below the fold, behind its own heading, and it
 * pulls in a date picker and a second form runtime. Loading it with the page
 * put that weight on the critical path of a visitor who mostly came to use the
 * quote form at the top.
 *
 * It is fetched when the reader gets near it instead. The placeholder matches
 * the real form's shape, so nothing moves when it arrives.
 */
const BookingForm = dynamic(() => import("./BookingForm").then((m) => m.BookingForm), {
  ssr: false,
  loading: () => <BookingSkeleton />,
});

export function BookingFormLazy() {
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
      // Start fetching a screen early so it is ready by the time it is reached.
      { rootMargin: "600px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{near ? <BookingForm /> : <BookingSkeleton />}</div>;
}

/** Matches the booking form's layout so its arrival shifts nothing. */
function BookingSkeleton() {
  return (
    <div aria-hidden="true" className="grid animate-pulse gap-8 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-10">
      <div>
        <div className="h-4 w-20 rounded-full bg-plaster" />
        <div className="mt-2 h-3 w-48 rounded-full bg-plaster" />
        <div className="mt-3 rounded-[4px] border border-hairline p-4">
          <div className="mx-auto h-6 w-32 rounded-full bg-plaster" />
          <div className="mt-4 grid grid-cols-7 gap-1.5">
            {Array.from({ length: 42 }).map((_, index) => (
              <div key={index} className="aspect-square rounded-full bg-plaster/70" />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-6">
        <div className="h-4 w-40 rounded-full bg-plaster" />
        <div className="flex gap-2.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-11 w-28 rounded-full bg-plaster" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="grid gap-2">
            <div className="h-4 w-28 rounded-full bg-plaster" />
            <div className="h-12 rounded-[8px] bg-plaster" />
          </div>
        ))}
        <div className="h-13 w-52 rounded-full bg-plaster" />
      </div>
    </div>
  );
}
