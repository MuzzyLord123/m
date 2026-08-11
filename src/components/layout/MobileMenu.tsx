"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Clock, EnvelopeSimple, Lock, Phone } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand/Wordmark";
import { CTA_HREF, CTA_LABEL, site, socialLinks } from "@/config/site";
import { NOT_BUILT_LABEL, isBuilt, previewMode } from "@/config/preview";
import { primaryNav } from "@/lib/nav";
import { featuredProjects } from "@/data/projects";
import { blurTone } from "@/lib/images";
import Image from "next/image";

const menuLinks = [...primaryNav, { href: "/contact", label: "Contact" }];

/**
 * Mobile navigation (<1024px).
 *
 * The toggle is three brush strokes that morph into an X. Opening slides the
 * panel down over the page and the oversized links stagger up from below.
 * Closing reverses it. Scroll is locked, focus is trapped, Escape exits.
 *
 * IT SLIDES RATHER THAN FLOODING. The panel used to arrive as a clip-path
 * circle expanding out of the toggle, which is where the "screen behind flashes
 * for a split second and looks glitched" report came from — see the note on
 * .flood-panel in globals.css for why the geometry made that unavoidable. The
 * stagger was cut back at the same time: the first row now starts at 0.12s
 * instead of 0.18s and steps 40ms instead of 60ms, so the last of seven lands
 * around 0.36s rather than 0.54s. The old timing left the covered panel empty
 * for a beat before anything appeared in it, which read as a second stall right
 * after the first.
 *
 * THE PANEL IS DARK, not orange. It was a full-strength accent plane with
 * near-black type on it, which measured at 6.2:1 and still read badly: a whole
 * screen of saturated orange behind text is tiring in a way a contrast ratio
 * does not describe, and the client said as much. Ground and ink now match the
 * rest of the site — --color-paper under --color-ink, about 18:1 — and the
 * orange went back to being an accent: the corner washes, the rail on the
 * current page, and the CTA pill. Every small size went up one step at the same
 * time, since nothing here is read at leisure.
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

      /* The close toggle lives in the header row, a SIBLING of the panel, so
         querying the panel alone left it out of the cycle: a keyboard user
         could open the menu but never tab to the visible X, and only Escape
         got them out. It is prepended rather than appended because it sits
         above the links on screen, and a focus order that disagrees with the
         reading order is its own bug. */
      const inPanel = [
        ...panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ];
      const focusable = toggleRef.current ? [toggleRef.current, ...inPanel] : inPanel;
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
        {/* The full-colour mark, open or closed. It used to swap to a near-black
            knockout while the menu was open, which only existed because the
            panel was orange and the real mark would have been orange on orange. */}
        <Wordmark />
        <BrushToggle ref={toggleRef} open={open} onClick={() => setOpen((v) => !v)} />
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
               anything smaller than a large phone.

               100lvh, NOT 100dvh, and that is the fix for "scrolling the menu
               fast shows the page behind it at the bottom".
               dvh is the DYNAMIC viewport: it means "however tall the viewport
               is right now, with whatever browser chrome is currently showing".
               A fast flick is exactly what makes Android hide its address bar,
               and while that bar animates away the visible area grows before a
               position: fixed element is resized to match — so for those frames
               the panel is the old, shorter height and there is a live strip of
               the page underneath it at the bottom of the screen.
               lvh is the LARGE viewport: the height with the chrome retracted,
               which is the biggest the visible area can ever be. Sizing to that
               means the panel is already tall enough before the bar starts
               moving, so there is no moment where it is too short. The cost is
               that while the address bar IS showing, the panel overhangs the
               bottom by the height of that bar — which is invisible, because
               what overhangs is more of the same near-black surface. */
            className="flood-panel fixed inset-0 z-[95] flex min-h-[100lvh] flex-col overflow-y-auto overscroll-contain outline-none"
          >
            {/* Reserves the bar's height. It blurs rather than covers: the
                panel's ground is a gradient, so an opaque band would have to
                match it exactly and would show as a seam the moment either
                changed. Blurring what passes underneath and fading out at the
                bottom edge keeps the wordmark legible with nothing to match.
                Inside the panel, so the flood still clips the two as one. */}
            <div
              className="sticky top-0 z-10 h-[5.25rem] shrink-0 backdrop-blur-md [mask-image:linear-gradient(to_bottom,#000_62%,transparent_100%)]"
              aria-hidden="true"
            />

            <nav aria-label="Mobile" className="shell flex flex-col pb-5">
              <p
                className="flood-item flex items-center justify-between pb-3 eyebrow text-ink-soft"
                style={{ transitionDelay: "0.08s" }}
              >
                <span>Menu</span>
                <span>{site.years} years · {site.town}</span>
              </p>

              {previewMode && (
                <p
                  className="flood-item mb-4 flex items-start gap-2.5 rounded-[4px] border border-ink/20 bg-ink/6 px-3.5 py-3 text-[0.875rem] leading-snug text-ink"
                  style={{ transitionDelay: "0.10s" }}
                >
                  <Lock weight="light" aria-hidden="true" className="mt-px size-4 shrink-0" />
                  <span>
                    This is a preview. Home and both galleries are built. The greyed pages are
                    part of the full site build, which has not been submitted to build yet.
                  </span>
                </p>
              )}

              <ul className="border-t border-ink/14">
                {menuLinks.map((link, index) => {
                  /* Home is "/" and would otherwise match every path under it,
                     so it is compared exactly. */
                  const current =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname === link.href || pathname.startsWith(`${link.href}/`);

                  if (!isBuilt(link.href)) {
                    return (
                      <li
                        key={link.href}
                        className="flood-line overflow-hidden border-b border-ink/14"
                      >
                        <span
                          aria-disabled="true"
                          style={{ transitionDelay: `${0.12 + index * 0.04}s` }}
                          className="flood-row relative flex cursor-not-allowed items-center gap-4 py-3.5 pl-3.5 select-none [@media(max-height:700px)]:py-2.5"
                        >
                          <span className="figures w-6 shrink-0 self-start pt-[0.85rem] text-[0.75rem] font-semibold text-ink-mute">
                            0{index + 1}
                          </span>
                          <span className="flex-1 font-display text-[1.875rem] leading-[1.15] font-semibold tracking-[-0.035em] text-ink-mute [@media(min-height:760px)]:text-[2.25rem]">
                            {link.label}
                          </span>
                          <span className="flex shrink-0 items-center gap-1.5 text-[0.75rem] text-ink-mute">
                            <Lock weight="light" aria-hidden="true" className="size-4" />
                            <span className="sr-only">{NOT_BUILT_LABEL}</span>
                          </span>
                        </span>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={link.href}
                      /* Clips its own link, so each line rises out of the rule
                         above it instead of fading in on the spot. */
                      className="flood-line overflow-hidden border-b border-ink/14"
                    >
                      <Link
                        href={link.href}
                        aria-current={current ? "page" : undefined}
                        style={{ transitionDelay: `${0.12 + index * 0.04}s` }}
                        /* Steps down on short handsets so the whole menu still
                           lands inside one screen where it can. */
                        className="flood-row group relative flex items-center gap-4 py-3.5 pl-3.5 [@media(max-height:700px)]:py-2.5"
                      >
                        {/* The rail is the pressed state; on the current page it
                            is simply already there. Six entries is enough that
                            "which page am I on" stops being obvious. */}
                        <span
                          className={`flood-rail${current ? " flood-rail-on" : ""}`}
                          aria-hidden="true"
                        />
                        <span className="figures w-6 shrink-0 self-start pt-[0.85rem] text-[0.75rem] font-semibold text-ink-soft">
                          0{index + 1}
                        </span>
                        <span
                          /* The current page is set in the serif italic — the
                             site's emphasis voice, used here for exactly what
                             it means. NOT bolded with it: Instrument Serif
                             ships one weight, and a utility that forces 600
                             onto it gets a synthesised faux-bold, which is the
                             most obviously wrong thing this typeface can do. */
                          className={`flex-1 font-display text-[1.875rem] leading-[1.15] font-semibold tracking-[-0.035em] text-ink [@media(min-height:760px)]:text-[2.25rem] ${
                            current ? "italic" : ""
                          }`}
                        >
                          {link.label}
                        </span>
                        <ArrowUpRight
                          weight="bold"
                          aria-hidden="true"
                          className="size-5 shrink-0 text-ink-soft transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-active:translate-x-1 group-active:-translate-y-1"
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Recent work, thumb-scrollable — the menu shows the work rather
                than only naming it. */}
            <div
              className="flood-item shrink-0"
              style={{ transitionDelay: "0.24s" }}
            >
              <div className="shell flex items-baseline justify-between">
                <p className="eyebrow text-ink-soft">
                  Recent work
                </p>
                <Link
                  href="/work"
                  className="inline-flex items-center gap-1 eyebrow text-ink-soft"
                >
                  All work
                  <ArrowUpRight weight="bold" aria-hidden="true" className="size-3" />
                </Link>
              </div>
              {/* scrollPaddingInline, not just paddingInline. Snap points align
                  an item's edge to the SNAPPORT edge, which ignores padding —
                  so the browser snapped on load and dragged the first thumbnail
                  20px off the left gutter, out of line with every other row in
                  the menu. The scroll padding is what the snapport reads. */}
              <ul style={{ paddingInline: "1.25rem", scrollPaddingInline: "1.25rem" }}
                className="mt-3 flex snap-x gap-3 overflow-x-auto overscroll-x-contain pb-1">
                {featuredProjects.slice(0, 5).map((project) => (
                  <li key={project.slug} className="w-[42vw] max-w-[11rem] shrink-0 snap-start">
                    <Link href={`/work#${project.slug}`} className="block">
                      <div className="relative aspect-[4/3] overflow-hidden rounded-[4px] bg-plaster">
                        <Image
                          src={project.images[0].src}
                          alt=""
                          fill
                          sizes="42vw"
                          placeholder="blur"
                          blurDataURL={blurTone(project.images[0].tone)}
                          className="object-cover"
                        />
                        {/* A hairline in the menu's own ink, so the photographs
                            sit ON the orange rather than punching holes in it. */}
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 rounded-[4px] ring-1 ring-ink/12 ring-inset"
                        />
                      </div>
                      <p className="mt-2 text-[0.875rem] leading-snug font-medium text-ink-soft">
                        {project.title}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Everything below sits in thumb reach. */}
            <div
              style={{ transitionDelay: "0.32s" }}
              className="flood-item shell mt-auto shrink-0 pt-7 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            >
              <div className="mb-6 h-px w-full bg-ink/14" aria-hidden="true" />

              <Link
                href={CTA_HREF}
                /* text-on-accent, NEVER text-ink. This is an orange pill, and
                   near-white on #f26522 is 2.9:1 — the single pairing the
                   colour system exists to forbid. It got here by a careless
                   find-and-replace when the panel went dark: the rule that
                   swapped text-on-accent to text-ink ran after the one that had
                   just correctly set this button to text-on-accent, and undid
                   it. Anything on the orange takes on-accent. */
                className="group mb-6 flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-accent text-base font-semibold whitespace-nowrap text-on-accent transition-transform duration-200 active:scale-[0.98]"
              >
                {CTA_LABEL}
                <ArrowUpRight
                  weight="bold"
                  aria-hidden="true"
                  className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-active:translate-x-1 group-active:-translate-y-1"
                />
              </Link>

              <div className="grid gap-3 text-ink-soft">
                <a href={`tel:${site.phoneHref}`} className="flex items-center gap-3 text-[1.0625rem]">
                  <Phone weight="light" className="size-[1.15rem] shrink-0" />
                  {site.phone}
                </a>
                <a
                  href={`mailto:${site.email}`}
                  className="flex items-center gap-3 text-[1.0625rem]"
                >
                  <EnvelopeSimple weight="light" className="size-[1.15rem] shrink-0" />
                  {site.email}
                </a>
                <p className="flex items-center gap-3 text-[1.0625rem]">
                  <Clock weight="light" className="size-[1.15rem] shrink-0" />
                  {site.hours[0].days}, {site.hours[0].time}
                </p>
              </div>

              {socialLinks.length > 0 && (
                <div className="mt-6 flex gap-5 text-[0.875rem] tracking-wide text-ink-soft uppercase">
                  {socialLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      {link.label} <ArrowUpRight weight="light" className="size-3.5" />
                    </a>
                  ))}
                </div>
              )}
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
  ref,
}: {
  open: boolean;
  onClick: () => void;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  /* One colour in both states. There used to be an `onDark` switch that painted
     the bars near-black once the menu opened, because the panel underneath was
     orange. The panel is a dark ground now, so near-black bars on it would be
     the X disappearing at exactly the moment someone needs to find it. */
  const bar = "toggle-bar absolute left-0 h-[2.5px] rounded-full origin-center bg-ink";

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
