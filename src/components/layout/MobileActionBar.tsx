"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Phone } from "@phosphor-icons/react/dist/ssr";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";

/**
 * The single most important lead-gen element on mobile: Call and Get a Free
 * Quote, permanently in thumb reach. It drops away while the visitor is
 * reading down the page and returns the moment they scroll back up.
 *
 * THE ONE SCROLL LISTENER ON THE SITE, and a deliberate exception to the rule
 * banning them. Scroll *direction* cannot be derived from a scroll-driven
 * animation or an IntersectionObserver — a timeline knows position, not which
 * way you are going. The alternatives were dropping the behaviour or keeping
 * the animation library in the shell, and the library costs every page ~40KB
 * on the critical path.
 *
 * The handler is passive, reads one cached number, and touches nothing but a
 * data attribute; the movement itself is a CSS transition on the compositor.
 * It never reads layout, so it cannot thrash.
 */
export function MobileActionBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let previous = window.scrollY;
    let frame = 0;

    const onScroll = () => {
      if (frame) return; // coalesce to one update per frame
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const current = window.scrollY;
        const delta = current - previous;
        previous = current;
        const bar = barRef.current;
        if (!bar) return;

        if (current < 140) bar.dataset.hidden = "false";
        else if (delta > 5) bar.dataset.hidden = "true";
        else if (delta < -5) bar.dataset.hidden = "false";
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  /**
   * Publishes this bar's height as --action-bar-h on the root.
   *
   * Anything that has to sit ON TOP of the bar needs to know how tall it is,
   * and the honest answer is "whatever its content came out as" — it changes
   * with the safe-area inset, with the text, and with the font. The privacy
   * sheet used a hand-written 5.75rem and was 23px out on a 412px handset,
   * which showed as a dead band of nothing between the two.
   *
   * A measured value also handles the wide breakpoint for free: the bar is
   * lg:hidden, so above 1024px it has no box at all and this reports 0px, which
   * is exactly the offset a bottom-anchored panel wants there.
   */
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const publish = () => {
      const height = bar.getBoundingClientRect().height;
      document.documentElement.style.setProperty("--action-bar-h", `${Math.round(height)}px`);
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(bar);
    /* The breakpoint changes whether the bar has a box at all, and a
       display:none element stops firing resize entries — so the viewport is
       watched too. */
    window.addEventListener("resize", publish);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", publish);
      document.documentElement.style.removeProperty("--action-bar-h");
    };
  }, []);

  return (
    <div
      ref={barRef}
      data-hidden="false"
      data-mobile-action-bar
      className="action-bar fixed inset-x-0 bottom-0 z-[80] lg:hidden"
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
            className="inline-flex h-12 flex-[1.35] items-center justify-center rounded-full bg-accent text-[0.9375rem] font-semibold whitespace-nowrap text-on-accent shadow-accent transition-transform duration-200 active:scale-[0.98]"
          >
            {CTA_LABEL}
          </Link>
        </div>
      </div>
    </div>
  );
}
