"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone } from "@phosphor-icons/react/dist/ssr";
import { BrushStroke } from "@/components/brand/BrushStroke";
import { Wordmark } from "@/components/brand/Wordmark";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";
import { primaryNav } from "@/lib/nav";

/**
 * Desktop navigation (≥1024px).
 *
 * At rest it sits transparent over the hero. Across the first 80px of scroll it
 * condenses — height down ~20%, paper background fades up behind a light blur,
 * a hairline and tinted shadow arrive.
 *
 * Where the browser supports scroll-driven animations, all four are interpolated
 * from the scroll position itself (`animation-timeline: scroll()`), so it is a
 * continuous condense that tracks the reader's hand, running on the compositor
 * with nothing on the main thread. Where it does not, the sentinel below toggles
 * `data-condensed` and the same four properties transition — animated over
 * 300ms, not a jump at a threshold.
 *
 * The observer only exists in the fallback case, and observes a 1px sentinel
 * rather than listening to scroll.
 */
export function DesktopNav() {
  const pathname = usePathname();
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Supported browsers do this in CSS; nothing to run.
    if (typeof CSS !== "undefined" && CSS.supports("animation-timeline: scroll()")) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        document.documentElement.dataset.condensed = String(!entry.isIntersecting);
      },
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="absolute top-0 h-px w-px" />

      <div className="nav-shell relative hidden lg:block">
        {/* Hairline + tinted shadow fade in together as the bar condenses. */}
        <div
          aria-hidden="true"
          className="nav-chrome pointer-events-none absolute inset-x-0 bottom-0 h-px bg-hairline shadow-[0_10px_30px_-16px_rgb(60_60_50/0.45)]"
        />

        <nav aria-label="Primary" className="shell flex h-full items-center">
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-8">
            <Wordmark />

            <ul className="flex items-center gap-9">
              {primaryNav.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <li key={link.href}>
                    <span className="nav-link relative inline-block" data-active={active}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className="block px-0.5 py-1 text-[0.9375rem] font-medium text-ink transition-colors duration-200 hover:text-accent"
                      >
                        {link.label}
                      </Link>
                      <BrushStroke
                        colour="var(--color-accent)"
                        className="pointer-events-none absolute -bottom-0.5 left-0 h-[7px] w-full"
                      />
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-end gap-6">
              <a
                href={`tel:${site.phoneHref}`}
                className="group inline-flex items-center gap-2 text-[0.9375rem] font-medium text-ink-soft transition-colors duration-200 hover:text-accent"
              >
                <Phone
                  weight="light"
                  className="size-[1.15rem] text-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-12"
                />
                {site.phone}
              </a>

              <Link
                href={CTA_HREF}
                className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-[0.9375rem] font-medium whitespace-nowrap text-white shadow-accent transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-deep active:translate-y-px active:scale-[0.98]"
              >
                {CTA_LABEL}
              </Link>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
