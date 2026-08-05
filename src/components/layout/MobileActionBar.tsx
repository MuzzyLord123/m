"use client";

import Link from "next/link";
import { animate, m, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useRef } from "react";
import { Phone } from "@phosphor-icons/react/dist/ssr";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";

/**
 * The single most important lead-gen element on mobile: Call and Get a Free
 * Quote, permanently in thumb reach. It drops away while the visitor is
 * reading down the page and returns the moment they scroll back up.
 *
 * Scroll direction is read from a motion value — no scroll listener, and no
 * continuous value in state.
 */
export function MobileActionBar() {
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();
  const y = useMotionValue(0);
  const previous = useRef(0);
  const hidden = useRef(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const delta = latest - previous.current;
    previous.current = latest;

    const settle = { duration: reduced ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] as const };

    if (latest < 140) {
      if (hidden.current) {
        hidden.current = false;
        animate(y, 0, settle);
      }
      return;
    }
    if (delta > 5 && !hidden.current) {
      hidden.current = true;
      animate(y, 140, settle);
    } else if (delta < -5 && hidden.current) {
      hidden.current = false;
      animate(y, 0, settle);
    }
  });

  return (
    <m.div
      style={{ y }}
      className="fixed inset-x-0 bottom-0 z-[80] lg:hidden"
      data-mobile-action-bar
    >
      <div className="border-t border-hairline bg-paper/95 backdrop-blur-sm">
        <div className="flex items-stretch gap-2.5 px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
          <a
            href={`tel:${site.phoneHref}`}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-ink/25 text-[0.9375rem] font-medium whitespace-nowrap text-ink transition-transform duration-200 active:scale-[0.98]"
          >
            <Phone weight="light" className="size-[1.15rem] text-accent" />
            Call
          </a>
          <Link
            href={CTA_HREF}
            className="inline-flex h-12 flex-[1.35] items-center justify-center rounded-full bg-accent text-[0.9375rem] font-semibold whitespace-nowrap text-white shadow-accent transition-transform duration-200 active:scale-[0.98]"
          >
            {CTA_LABEL}
          </Link>
        </div>
      </div>
    </m.div>
  );
}
