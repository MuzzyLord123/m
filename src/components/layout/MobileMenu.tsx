"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowUpRight, Clock, EnvelopeSimple, Phone } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand/Wordmark";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";
import { primaryNav } from "@/lib/nav";

const FLOOD_ORIGIN = "calc(100% - 2.6rem) 2.55rem";
const menuLinks = [...primaryNav, { href: "/contact", label: "Contact" }];

/**
 * Mobile navigation (<1024px).
 *
 * The toggle is three brush strokes that morph into an X. Opening floods the
 * screen with accent colour from the toggle itself — a clip-path circle
 * expanding out of the button — then the oversized links stagger up from below.
 * Closing reverses the flood. Scroll is locked, focus is trapped, Escape exits.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  // Route change closes the menu.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Scroll lock + Escape + focus trap, all live only while open.
  useEffect(() => {
    if (!open) return;

    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        toggleRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 60);

    return () => {
      root.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [open, close]);

  const flood = reduced ? 0 : 0.5;

  return (
    <div className="lg:hidden">
      {/* One toggle, not two. The header row sits above the flood panel in the
          same stacking context, so it inverts to white rather than being
          duplicated underneath. */}
      <div className="shell relative z-[96] flex h-[4.75rem] items-center justify-between">
        <Wordmark onDark={open} />
        <BrushToggle
          ref={toggleRef}
          open={open}
          onDark={open}
          onClick={() => setOpen((v) => !v)}
        />
      </div>

      <AnimatePresence>
        {open && (
          <m.div
            ref={panelRef}
            id="mobile-menu"
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            initial={{ clipPath: `circle(0px at ${FLOOD_ORIGIN})` }}
            animate={{ clipPath: `circle(150vmax at ${FLOOD_ORIGIN})` }}
            exit={{ clipPath: `circle(0px at ${FLOOD_ORIGIN})` }}
            transition={{ duration: flood, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[95] flex min-h-[100dvh] flex-col bg-accent outline-none"
          >
            <div className="h-[4.75rem] shrink-0" aria-hidden="true" />

            <nav
              aria-label="Mobile"
              className="shell flex flex-1 flex-col justify-center pt-4 pb-6"
            >
              <ul>
                {menuLinks.map((link, index) => (
                  <m.li
                    key={link.href}
                    initial={{ y: reduced ? 0 : 26, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{
                      duration: reduced ? 0 : 0.44,
                      delay: reduced ? 0 : 0.2 + index * 0.055,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="overflow-hidden border-b border-white/15"
                  >
                    <Link
                      href={link.href}
                      className="flex items-baseline justify-between py-3.5 font-display text-[2.75rem] leading-[1.1] font-semibold tracking-[-0.035em] text-white"
                    >
                      {link.label}
                      <span className="font-body text-sm font-normal text-white/80 tabular-nums">
                        0{index + 1}
                      </span>
                    </Link>
                  </m.li>
                ))}
              </ul>
            </nav>

            {/* Everything below sits in thumb reach. */}
            <m.div
              initial={{ y: reduced ? 0 : 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: reduced ? 0 : 0.4,
                delay: reduced ? 0 : 0.42,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="shell shrink-0 pb-[calc(1.75rem+env(safe-area-inset-bottom))]"
            >
              <Link
                href={CTA_HREF}
                className="mb-6 flex h-14 w-full items-center justify-center rounded-full bg-white text-base font-semibold whitespace-nowrap text-accent-ink transition-transform duration-200 active:scale-[0.98]"
              >
                {CTA_LABEL}
              </Link>

              <div className="grid gap-3 text-white/90">
                <a href={`tel:${site.phoneHref}`} className="flex items-center gap-3 text-[0.95rem]">
                  <Phone weight="light" className="size-[1.15rem] shrink-0" />
                  {site.phone}
                </a>
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-center gap-3 text-[0.95rem]"
                >
                  <EnvelopeSimple weight="light" className="size-[1.15rem] shrink-0" />
                  {site.email}
                </a>
                <p className="flex items-center gap-3 text-[0.95rem]">
                  <Clock weight="light" className="size-[1.15rem] shrink-0" />
                  {site.hours[0].days}, {site.hours[0].time}
                </p>
              </div>

              <div className="mt-6 flex gap-5 text-[0.8125rem] tracking-wide text-white/80 uppercase">
                <a
                  href={site.social.instagram}
                  className="inline-flex items-center gap-1"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Instagram <ArrowUpRight weight="light" className="size-3.5" />
                </a>
                <a
                  href={site.social.facebook}
                  className="inline-flex items-center gap-1"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Facebook <ArrowUpRight weight="light" className="size-3.5" />
                </a>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Three brush strokes that morph into an X. Uneven at rest, deliberately. */
function BrushToggle({
  open,
  onClick,
  onDark = false,
  ref,
}: {
  open: boolean;
  onClick: () => void;
  onDark?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  const bar = `absolute left-0 h-[2.5px] rounded-full origin-center ${
    onDark ? "bg-white" : "bg-ink"
  }`;

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls="mobile-menu"
      aria-label={open ? "Close menu" : "Open menu"}
      className="relative z-[96] -mr-2 grid size-11 place-items-center rounded-full transition-transform duration-200 active:scale-[0.94]"
    >
      <span className="relative block h-[18px] w-[26px]">
        <m.span
          className={bar}
          style={{ top: 0 }}
          animate={open ? { width: 26, y: 8, rotate: 45 } : { width: 26, y: 0, rotate: 0 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        />
        <m.span
          className={bar}
          style={{ top: 8 }}
          animate={open ? { width: 26, opacity: 0, scaleX: 0 } : { width: 17, opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        />
        <m.span
          className={bar}
          style={{ top: 16 }}
          animate={open ? { width: 26, y: -8, rotate: -45 } : { width: 22, y: 0, rotate: 0 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
        />
      </span>
    </button>
  );
}
