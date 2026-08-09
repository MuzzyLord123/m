"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, CaretDown, Clock, Lock, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand/Wordmark";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";
import { NOT_BUILT_LABEL, isBuilt, previewMode } from "@/config/preview";
import { primaryNav } from "@/lib/nav";
import { services } from "@/data/services";
import { featuredProjects } from "@/data/projects";
import { blurTone } from "@/lib/images";

/**
 * Desktop navigation (≥1024px).
 *
 * Three tiers, in the way a large firm's site is organised:
 *
 *   1. A utility strip — where we cover, when we answer, how to ring us. It
 *      gives its height back to the page as you scroll, on the same scroll
 *      timeline as the condense below.
 *   2. The main bar. At rest transparent over the hero; across the first 80px
 *      it condenses — height down, paper background up behind a light blur, a
 *      hairline and tinted shadow arriving. Interpolated from scroll position
 *      itself, so it tracks the reader's hand rather than snapping.
 *   3. A mega-menu under Services, carrying the six trades and a real
 *      photograph of recent work rather than a list of links.
 *
 * The panel opens on hover and on focus, closes on Escape, on click outside and
 * on leaving the whole header — so it is usable by pointer, keyboard and
 * screen reader alike. The trigger is a real button with aria-expanded.
 */
export function DesktopNav() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef(0);
  const [open, setOpen] = useState(false);

  /* The data-condensed fallback lives in NavSentinel, mounted once by
     SiteHeader. It used to be duplicated here as well: two IntersectionObservers
     writing the same attribute on <html>, watching different sentinels with
     different root margins, so they could disagree and the last one to fire
     won. This one also sat inside a subtree hidden below 1024px, where its
     sentinel has no layout box, so it could not speak for the mobile bar it was
     still setting the attribute for. One observer, at the header level. */

  // Escape closes, and so does a click anywhere outside the header.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  // A short grace period, so crossing the gap to the panel does not close it.
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), 140);
  };
  const cancelClose = () => window.clearTimeout(closeTimer.current);

  const lead = featuredProjects[0];

  return (
    <div ref={headerRef} className="relative hidden lg:block" onMouseLeave={scheduleClose}>

      {/* 1 — utility strip. In preview mode it carries the explanation for the
             greyed items instead, which is the one place on a desktop layout
             where a note like that belongs: already at the top, already quiet,
             and it gives its height back on scroll like everything else. */}
      <div
        className={`nav-utility border-b backdrop-blur-sm ${
          previewMode ? "border-accent/25 bg-accent-wash" : "border-ink/8 bg-plaster/80"
        }`}
      >
        <div className="shell flex h-[2.375rem] items-center justify-between text-[0.8125rem]">
          {previewMode ? (
            <>
              <p className="flex items-center gap-2 text-ink-soft">
                <Lock weight="light" className="size-4 text-accent" />
                <span className="font-medium text-accent">Preview</span>
                <span className="text-ink-mute">
                  — the home page and both galleries are built. The greyed pages are part of the
                  full site build, which has not been submitted to build yet.
                </span>
              </p>
              {/* Hidden until 1280px. The preview sentence is long, and at
                  exactly 1024 the two halves of this strip met with no gap at
                  all — measured, not guessed. The message is the reason the
                  strip is here in preview mode, so the service area is what
                  gives way. */}
              <p className="hidden items-center gap-2 text-ink-mute xl:flex">
                <MapPin weight="light" className="size-4 text-accent" />
                {site.serviceArea}
              </p>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 text-ink-soft">
                <MapPin weight="light" className="size-4 text-accent" />
                Covering {site.serviceArea}
              </p>
              <div className="flex items-center gap-6 text-ink-soft">
                <span className="flex items-center gap-2">
                  <Clock weight="light" className="size-4 text-accent" />
                  {site.hours[0].days}, {site.hours[0].time}
                </span>
                <span aria-hidden="true" className="h-3 w-px bg-ink/15" />
                <span>{site.facts.responseTime}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2 — main bar */}
      <div className="nav-shell relative">
        <div
          aria-hidden="true"
          className="nav-chrome pointer-events-none absolute inset-x-0 bottom-0 h-px bg-hairline"
        />
        <div
          aria-hidden="true"
          className="nav-rule pointer-events-none absolute inset-x-0 bottom-0 h-[2px] bg-accent"
        />

        <nav aria-label="Primary" className="shell flex h-full items-center">
          {/* A real grid, not three floating clusters. The mark sits in its own
              column, the pages sit immediately beside it behind a hairline so
              they read as one navigation block rather than drifting in the
              middle of the bar, and the actions are pinned right. */}
          <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-7">
            <Wordmark />

            <ul className="flex items-center gap-8 border-l border-hairline pl-7">
              {primaryNav.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                const built = isBuilt(link.href);
                /* No mega-menu on a page that is not built — a panel of links
                   into a locked page is worse than the greyed word alone. */
                const isServices = link.href === "/services" && built;

                if (!built) {
                  return (
                    <li key={link.href} className="relative">
                      <span
                        title={NOT_BUILT_LABEL}
                        aria-disabled="true"
                        className="nav-label flex cursor-not-allowed items-center gap-2 py-1 text-[0.9375rem] font-medium text-ink-mute/55 select-none"
                      >
                        {link.label}
                        <Lock weight="light" aria-hidden="true" className="size-3.5" />
                        <span className="sr-only">— {NOT_BUILT_LABEL}</span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={link.href} className="relative">
                    {isServices ? (
                      <span
                        className="nav-link relative inline-flex items-center"
                        data-active={active || open}
                        onMouseEnter={() => {
                          cancelClose();
                          setOpen(true);
                        }}
                      >
                        <Link
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          /* Active is carried by COLOUR AND WEIGHT, not a rule beneath.
                             The painted underline that used to live here read as
                             decoration on a bar that needed structure. */
                          className={`nav-label block py-1 text-[0.9375rem] transition-colors duration-200 ${
                            active
                              ? "font-semibold text-accent"
                              : "font-medium text-ink-soft hover:text-ink"
                          }`}
                        >
                          {link.label}
                        </Link>
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-controls="services-mega"
                          aria-label={open ? "Close services menu" : "Open services menu"}
                          /* No open-on-focus: focus would open the panel and the
                             visitor's Enter would then immediately close it
                             again. Pointer users get hover, keyboard users get
                             Enter or Space — the standard disclosure pattern. */
                          onClick={() => setOpen((v) => !v)}
                          className="ml-1 grid size-5 place-items-center rounded-full text-ink-mute transition-colors duration-200 hover:text-accent"
                        >
                          <CaretDown
                            weight="light"
                            className={`size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                              open ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </span>
                    ) : (
                      <span className="nav-link relative inline-block" data-active={active}>
                        <Link
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                          onFocus={scheduleClose}
                          /* Active is carried by COLOUR AND WEIGHT, not a rule beneath.
                             The painted underline that used to live here read as
                             decoration on a bar that needed structure. */
                          className={`nav-label block py-1 text-[0.9375rem] transition-colors duration-200 ${
                            active
                              ? "font-semibold text-accent"
                              : "font-medium text-ink-soft hover:text-ink"
                          }`}
                        >
                          {link.label}
                        </Link>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-end gap-6">
              <a
                href={`tel:${site.phoneHref}`}
                className="group inline-flex h-11 items-center gap-2.5 rounded-full border border-hairline px-5 text-[0.9375rem] font-medium text-ink transition-[border-color,background-color,color] duration-200 hover:border-accent/50 hover:bg-accent-wash"
              >
                <Phone
                  weight="light"
                  className="size-[1.15rem] text-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-12"
                />
                {site.phone}
              </a>

              <Link
                href={CTA_HREF}
                className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-6 text-[0.9375rem] font-medium whitespace-nowrap text-on-accent shadow-accent transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-accent-bright active:translate-y-px active:scale-[0.98]"
              >
                {CTA_LABEL}
              </Link>
            </div>
          </div>
        </nav>
      </div>

      {/* 3 — mega panel */}
      <div
        id="services-mega"
        data-open={open}
        onMouseEnter={cancelClose}
        className="mega-panel absolute inset-x-0 top-full overflow-hidden border-b border-hairline"
      >
        {/* An orange wash bled in from the top-left corner, so the panel opens
            as a lit surface rather than a black box. Painted, not bordered:
            nothing it does can move the layout. */}
        <div className="mega-wash" aria-hidden="true" />

        <div className="shell relative grid grid-cols-[1.6fr_1fr] pt-8 pb-9">
          <div className="pr-14">
            <div className="mega-item flex items-baseline justify-between">
              <p className="eyebrow text-accent">
                What we do
              </p>
              <p className="eyebrow text-ink-mute uppercase tabular-nums">
                {services.length} trades
              </p>
            </div>
            <div className="tape-line mt-3" aria-hidden="true" />

            {/* A ruled two-column table, not a bulleted list. Every row carries
                its own index, a rail that fills from the top on hover and a
                wash that wipes in behind it — the same gesture the section
                rules use, at menu scale. */}
            <ul className="mt-1 grid grid-cols-2 gap-x-10">
              {services.map((service, index) => (
                <li
                  key={service.id}
                  className="mega-item border-b border-hairline/60"
                  style={{ transitionDelay: `${0.05 + index * 0.035}s` }}
                >
                  <Link href={`/services#${service.id}`} className="mega-row group">
                    <span className="mega-row-rail" aria-hidden="true" />
                    <span className="mega-row-wash" aria-hidden="true" />
                    <span className="relative z-1 flex items-start gap-4">
                      <span className="mt-[0.3rem] shrink-0 figures text-[0.6875rem] font-semibold text-ink-mute transition-colors duration-300 group-hover:text-accent">
                        0{index + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5 font-display text-[1.0625rem] leading-tight font-semibold tracking-[-0.02em] text-ink">
                          {service.title}
                          <ArrowRight
                            weight="bold"
                            aria-hidden="true"
                            className="size-3.5 -translate-x-1 text-accent opacity-0 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0 group-hover:opacity-100"
                          />
                        </span>
                        <span className="mt-1 block text-[0.8125rem] leading-relaxed text-ink-mute">
                          {service.summary}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent work, with a real photograph — not another column of links */}
          {lead && (
            <div
              className="mega-item border-l border-hairline pl-14"
              style={{ transitionDelay: "0.18s" }}
            >
              <div className="flex items-baseline justify-between">
                <p className="eyebrow text-accent">
                  Recent work
                </p>
                <p className="eyebrow text-ink-mute">
                  {site.town}
                </p>
              </div>
              <div className="tape-line mt-3" aria-hidden="true" />

              <Link href="/work" className="card-edge group mt-6 block">
                {/* 16/10, not 4/3. The taller crop pushed the photograph
                    column past the list beside it and left an inch of dead
                    black under the trades — the two columns now finish within
                    a few pixels of each other. */}
                <div className="relative aspect-[16/10] overflow-hidden rounded-[4px] bg-plaster">
                  <Image
                    src={lead.images[0].src}
                    alt=""
                    fill
                    sizes="30vw"
                    placeholder="blur"
                    blurDataURL={blurTone(lead.images[0].tone)}
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
                  />
                  {/* Foot of the frame darkened so the caption beneath reads as
                      part of the card rather than floating off it. */}
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-scrim/60 to-transparent"
                  />
                </div>
                <p className="mt-3.5 font-display text-[1.0625rem] leading-tight font-semibold tracking-[-0.02em] text-ink">
                  {lead.title}
                </p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-ink-mute">{lead.scope}</p>
                <span className="mt-3 inline-flex items-center gap-2 text-[0.875rem] font-medium text-accent">
                  See all {featuredProjects.length > 0 ? "projects" : "work"}
                  <ArrowRight
                    weight="light"
                    className="size-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Foot rail. The panel used to end in an inch and a half of empty black
            under the left column, because the photograph column is taller than
            the list beside it. This is what a firm would put there: the three
            facts a customer is actually weighing, and the way through to the
            full page. */}
        <div
          className="mega-item relative border-t border-hairline bg-accent-wash/50"
          style={{ transitionDelay: "0.24s" }}
        >
          <div className="shell flex h-[3.25rem] items-center justify-between text-[0.8125rem]">
            <ul className="flex items-center gap-7 text-ink-soft">
              {[site.facts.insurance, site.facts.guarantee, site.facts.responseTime].map((fact) => (
                <li key={fact} className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="size-1 rounded-full bg-accent" />
                  {fact}
                </li>
              ))}
            </ul>
            <Link
              href="/services"
              className="group inline-flex items-center gap-2 font-medium text-ink transition-colors duration-200 hover:text-accent"
            >
              All {services.length} services in detail
              <ArrowRight
                weight="light"
                className="size-4 text-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
