"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Clock, EnvelopeSimple, Phone } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand/Wordmark";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";
import { primaryNav } from "@/lib/nav";
import { featuredProjects } from "@/data/projects";
import { blurTone } from "@/lib/images";
import Image from "next/image";

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

  return (
    <div className="lg:hidden">
      {/* One toggle, not two. The header row sits above the flood panel in the
          same stacking context, so it inverts to white rather than being
          duplicated underneath. */}
      <div
        data-menu-open={open}
        className="mobile-bar shell relative z-[96] flex h-[5.25rem] items-center justify-between"
      >
        <Wordmark onDark={open} />
        <BrushToggle
          ref={toggleRef}
          open={open}
          onDark={open}
          onClick={() => setOpen((v) => !v)}
        />
      </div>

      <>
          <div
            ref={panelRef}
            id="mobile-menu"
            tabIndex={-1}
            /* Mounted at all times so opening and closing are one transition
               run in both directions — but only a dialog while it is open. */
            role={open ? "dialog" : undefined}
            aria-modal={open ? true : undefined}
            aria-label="Menu"
            aria-hidden={!open}
            data-open={open}
            inert={!open}
            /* Scrollable, because the panel is taller than a short handset.
               Five links at display size plus the work strip plus the contact
               block runs past 844px, and the page behind is scroll-locked — so
               without this the hours and the social links are unreachable on
               anything smaller than a large phone. */
            className="flood-panel fixed inset-0 z-[95] flex min-h-[100dvh] flex-col overflow-y-auto overscroll-contain bg-accent outline-none"
          >
            {/* Reserves the bar's height, and sticks so that scrolled content
                passes behind an opaque band rather than through the wordmark.
                Inside the panel, so the flood still clips the two as one. */}
            <div
              className="sticky top-0 h-[5.25rem] shrink-0 bg-accent"
              aria-hidden="true"
            />

            <nav
              aria-label="Mobile"
              className="shell flex flex-col pt-2 pb-5"
            >
              <ul>
                {menuLinks.map((link, index) => (
                  <li
                    key={link.href}
                    style={{ transitionDelay: `${0.2 + index * 0.055}s` }}
                    className="flood-item overflow-hidden border-b border-white/15"
                  >
                    <Link
                      href={link.href}
                      /* Steps down on short handsets so the whole menu still
                         lands inside one screen where it can. */
                      className="flex items-baseline justify-between py-3.5 font-display text-[1.875rem] leading-[1.15] font-semibold tracking-[-0.035em] text-white [@media(min-height:760px)]:py-3.5 [@media(min-height:760px)]:text-[2.25rem] [@media(max-height:700px)]:py-2.5"
                    >
                      {link.label}
                      <span className="font-body text-sm font-normal text-white/80 tabular-nums">
                        0{index + 1}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Recent work, thumb-scrollable — the menu shows the work rather
                than only naming it. */}
            <div
              className="flood-item shrink-0"
              style={{ transitionDelay: "0.36s" }}
            >
              <p className="shell text-[0.6875rem] font-semibold tracking-[0.16em] text-white/70 uppercase">
                Recent work
              </p>
              <ul style={{ paddingInline: "1.25rem" }}
                className="mt-3 flex snap-x gap-3 overflow-x-auto pb-1">
                {featuredProjects.slice(0, 5).map((project) => (
                  <li key={project.slug} className="w-[42vw] max-w-[11rem] shrink-0">
                    <Link href={`/work#${project.slug}`} className="block">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-white/15">
                        <Image
                          src={project.images[0].src}
                          alt=""
                          fill
                          sizes="42vw"
                          placeholder="blur"
                          blurDataURL={blurTone(project.images[0].tone)}
                          className="object-cover"
                        />
                      </div>
                      <p className="mt-2 text-[0.8125rem] leading-snug font-medium text-white/95">
                        {project.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Everything below sits in thumb reach. */}
            <div
              style={{ transitionDelay: "0.46s" }}
              className="flood-item shell mt-auto shrink-0 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
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
            </div>
          </div>
      </>
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
  const bar = `toggle-bar absolute left-0 h-[2.5px] rounded-full origin-center ${
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
        {/* Uneven at rest, an even X when open. Transitions live in
            globals.css so no JavaScript animates them. */}
        <span
          className={bar}
          style={{
            top: 0,
            width: 26,
            transform: open ? "translateY(8px) rotate(45deg)" : "none",
          }}
        />
        <span
          className={bar}
          style={{
            top: 8,
            width: open ? 26 : 17,
            opacity: open ? 0 : 1,
            transform: open ? "scaleX(0)" : "none",
          }}
        />
        <span
          className={bar}
          style={{
            top: 16,
            width: open ? 26 : 22,
            transform: open ? "translateY(-8px) rotate(-45deg)" : "none",
          }}
        />
      </span>
    </button>
  );
}
