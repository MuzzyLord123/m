"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, CaretDown, Clock, MapPin, Phone } from "@phosphor-icons/react/dist/ssr";
import { Wordmark } from "@/components/brand/Wordmark";
import { CTA_HREF, CTA_LABEL, site } from "@/config/site";
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

      {/* 1 — utility strip */}
      <div className="nav-utility border-b border-ink/8 bg-plaster/80 backdrop-blur-sm">
        <div className="shell flex h-[2.375rem] items-center justify-between text-[0.8125rem]">
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
                const isServices = link.href === "/services";

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
        className="mega-panel absolute inset-x-0 top-full border-b border-hairline bg-paper/97 backdrop-blur-md shadow-[0_28px_60px_-30px_rgb(60_60_50/0.4)]"
      >
        <div className="shell grid grid-cols-[1.5fr_1fr] gap-12 py-10">
          <div>
            <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
              What we do
            </p>
            <div className="tape-line mt-3" aria-hidden="true" />

            <ul className="mt-6 grid grid-cols-2 gap-x-8 gap-y-1">
              {services.map((service, index) => (
                <li
                  key={service.id}
                  className="mega-item"
                  style={{ transitionDelay: `${0.04 + index * 0.03}s` }}
                >
                  <Link
                    href={`/services#${service.id}`}
                    className="group flex items-start gap-3 rounded-[4px] px-3 py-3 transition-colors duration-200 hover:bg-accent-wash/60"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-accent opacity-40 transition-opacity duration-200 group-hover:opacity-100"
                    />
                    <span>
                      <span className="block font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
                        {service.title}
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] leading-relaxed text-ink-mute">
                        {service.summary}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recent work, with a real photograph — not another column of links */}
          {lead && (
            <div className="mega-item" style={{ transitionDelay: "0.16s" }}>
              <p className="text-[0.75rem] font-semibold tracking-[0.16em] text-ink-mute uppercase">
                Recent work
              </p>
              <div className="tape-line mt-3" aria-hidden="true" />

              <Link href="/work" className="group mt-6 block">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[4px] bg-plaster">
                  <Image
                    src={lead.images[0].src}
                    alt=""
                    fill
                    sizes="30vw"
                    placeholder="blur"
                    blurDataURL={blurTone(lead.images[0].tone)}
                    className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </div>
                <p className="mt-3.5 font-display text-[1.0625rem] font-semibold tracking-[-0.02em] text-ink">
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
      </div>
    </div>
  );
}
