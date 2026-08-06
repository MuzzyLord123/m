"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, LazyMotion, domMax, m, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react/dist/ssr";
import { SwatchFilter, type Filter } from "./SwatchFilter";
import { blurTone } from "@/lib/images";
import { CTA_HREF, CTA_LABEL } from "@/config/site";
import { projects, type Project } from "@/data/projects";

/**
 * Mobile gallery (<1024px) — a different composition, not the desktop grid
 * squeezed down.
 *
 * Full-bleed case cards in a vertical feed, each with its title and area laid
 * over a scrim. Filters ride in a sticky swatch strip under the page title.
 * Tapping a card raises a bottom sheet with the photo strip, the detail and
 * the quote CTA; the sheet drags away downwards.
 */
export function GalleryMobile() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<Project | null>(null);

  const shown = filter === "all" ? projects : projects.filter((p) => p.category === filter);

  return (
    /* domMax: the bottom sheet is drag-to-dismiss, and drag is not in the
       root's smaller feature bundle. */
    <LazyMotion features={domMax}>
    <div className="lg:hidden">
      <div className="sticky top-[5.25rem] z-40 bg-paper/95 py-3 backdrop-blur-sm">
        <div className="shell">
          <SwatchFilter value={filter} onChange={setFilter} layout="strip" />
        </div>
      </div>

      <ul className="mt-6 grid gap-10">
        {shown.map((project) => (
          <li
            key={project.slug}
            id={`mobile-${project.slug}`}
            data-slug={project.slug}
            className="scroll-mt-40"
          >
            <button
              type="button"
              onClick={() => setOpen(project)}
              className="block w-full text-left"
            >
              {/* Edge to edge — the photograph is the card */}
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-plaster sm:aspect-[3/2]">
                <Image
                  src={project.images[0].src}
                  alt={project.images[0].alt}
                  fill
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL={blurTone(project.images[0].tone)}
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/45 to-transparent px-5 pt-24 pb-5">
                  <h2 className="font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-white">
                    {project.title}
                  </h2>
                  <p className="mt-1 text-[0.875rem] text-white/80">
                    {project.area} · {project.images.length} photos
                  </p>
                </div>
              </div>
              <p className="shell mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">
                {project.scope}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {shown.length === 0 && (
        <p className="shell mt-12 text-[1.0625rem] text-ink-soft">
          Nothing photographed in that trade yet. Ring and ask — there will be a job we can show
          you.
        </p>
      )}

      <ProjectSheet project={open} onClose={() => setOpen(null)} />
    </div>
    </LazyMotion>
  );
}

function ProjectSheet({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const reduced = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    /* Remembered on open, restored on close. Otherwise closing the sheet drops
       focus back to the top of the document and a keyboard user has to tab all
       the way down the gallery again to reach the card they just came out of. */
    const restoreFocus = document.activeElement as HTMLElement | null;
    root.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      /* The sheet declares aria-modal="true", which tells assistive technology
         that everything behind it is inert — so Tab has to actually stay inside
         it, or the promise is a lie. Without this a keyboard user tabs straight
         out of the "modal" into the gallery behind, which is scroll-locked, so
         they end up moving through content they cannot see. */
      if (event.key !== "Tab" || !sheetRef.current) return;

      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === sheetRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    const timer = window.setTimeout(() => sheetRef.current?.focus(), 40);

    return () => {
      root.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
      restoreFocus?.focus?.();
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project && (
        <div className="fixed inset-0 z-[120]">
          <m.button
            type="button"
            aria-label="Close project"
            onClick={onClose}
            className="absolute inset-0 bg-ink/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          />

          <m.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title}, ${project.area}`}
            tabIndex={-1}
            initial={reduced ? false : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduced ? undefined : { y: "100%" }}
            transition={{ duration: reduced ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
            drag={reduced ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 130 || info.velocity.y > 650) onClose();
            }}
            className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[4px] bg-paper outline-none"
          >
            {/* Drag handle */}
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-paper/95 px-5 pt-3 pb-2 backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-2 mx-auto h-1 w-10 rounded-full bg-ink/15"
              />
              <p className="mt-4 text-[0.75rem] font-semibold tracking-[0.14em] text-ink-mute uppercase">
                {project.area}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close project"
                className="mt-3 grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-plaster"
              >
                <X weight="light" className="size-5" />
              </button>
            </div>

            {/* Photo strip */}
            <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1">
              {project.images.map((image) => (
                <li key={image.src} className="w-[82%] shrink-0 snap-start">
                  <div className="relative aspect-[3/2] overflow-hidden rounded-[4px] bg-plaster">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="82vw"
                      placeholder="blur"
                      blurDataURL={blurTone(image.tone)}
                      className="object-cover"
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <h2 className="font-display text-[1.625rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
                {project.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">
                {project.detail}
              </p>

              <dl className="mt-5 flex gap-8 border-t border-hairline pt-4 text-[0.875rem]">
                <div>
                  <dt className="text-ink-mute">On site</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{project.duration}</dd>
                </div>
                <div>
                  <dt className="text-ink-mute">Where</dt>
                  <dd className="mt-0.5 font-semibold text-ink">{project.area}</dd>
                </div>
              </dl>

              <Link
                href={CTA_HREF}
                className="mt-6 flex h-13 w-full items-center justify-center rounded-full bg-accent px-6 py-4 text-base font-semibold whitespace-nowrap text-white transition-transform duration-200 active:scale-[0.98]"
              >
                {CTA_LABEL}
              </Link>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}
