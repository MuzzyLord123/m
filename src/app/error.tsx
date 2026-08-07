"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowClockwise, Phone } from "@phosphor-icons/react/dist/ssr";
import { site } from "@/config/site";

/**
 * Route-level error boundary.
 *
 * Without this, a thrown render error shows the visitor Next.js's own error
 * screen — in production a bare "Application error: a client-side exception has
 * occurred", which tells a customer nothing and loses the enquiry. This keeps
 * them on the site, gives them the retry that fixes most transient failures,
 * and puts the phone number in front of them for the times it does not.
 *
 * Errors go to the console, which is where a Vercel runtime log picks them up.
 * If the client ever adds Sentry or similar, this is the one place to wire it.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error on", window.location.pathname, error);
  }, [error]);

  return (
    <section className="pt-[8rem] pb-24 lg:pt-[12rem] lg:pb-32">
      <div className="shell max-w-2xl">
        <p className="eyebrow text-ink-mute">
          Something went wrong
        </p>
        <h1 className="mt-5 font-display text-[2.5rem] leading-[1.04] font-semibold tracking-[-0.035em] text-balance text-ink sm:text-[3.25rem]">
          This page did not load.
        </h1>
        <p className="measure mt-6 text-[1.0625rem] leading-relaxed text-ink-soft">
          It is our fault, not yours, and it is usually temporary. Try again — and if it happens
          twice, ring us and we will take the details over the phone.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-13 items-center gap-2 rounded-full bg-accent px-7 text-base font-semibold whitespace-nowrap text-on-accent shadow-accent transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
          >
            <ArrowClockwise weight="light" className="size-[1.15rem]" />
            Try again
          </button>
          <a
            href={`tel:${site.phoneHref}`}
            className="inline-flex h-13 items-center gap-2 rounded-full border border-ink/20 px-6 text-base font-medium whitespace-nowrap text-ink transition-[border-color,color] duration-200 hover:border-accent hover:text-accent"
          >
            <Phone weight="light" className="size-[1.15rem] text-accent" />
            {site.phone}
          </a>
          <Link
            href="/"
            className="inline-flex h-13 items-center px-2 text-base font-medium whitespace-nowrap text-ink-soft underline-offset-4 transition-colors duration-200 hover:text-accent hover:underline"
          >
            Back to the home page
          </Link>
        </div>

        {error.digest && (
          <p className="mt-10 text-[0.8125rem] text-ink-mute">
            Reference <span className="font-mono tabular-nums">{error.digest}</span> — quote this if
            you get in touch.
          </p>
        )}
      </div>
    </section>
  );
}
