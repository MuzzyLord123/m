"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, X } from "@phosphor-icons/react/dist/ssr";
import { blurTone } from "@/lib/images";
import { CTA_HREF, CTA_LABEL } from "@/config/site";
import type { Project } from "@/data/projects";

/**
 * Custom lightbox — built here rather than pulled in, so it carries the brand
 * rather than a library's defaults.
 *
 * Every photograph in the project is mounted at once with only the active one
 * visible, so stepping to a neighbour never waits on a fetch. Arrow keys step,
 * Escape and a backdrop click close, focus is trapped and returned.
 */
export function Lightbox({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const count = project?.images.length ?? 0;

  const step = useCallback(
    (direction: number) => {
      if (count === 0) return;
      setIndex((current) => (current + direction + count) % count);
    },
    [count],
  );

  useEffect(() => {
    setIndex(0);
  }, [project?.slug]);

  useEffect(() => {
    if (!project) return;

    const root = document.documentElement;
    const previous = root.style.overflow;
    const restoreFocus = document.activeElement as HTMLElement | null;
    root.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      } else if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        /* `|| active === dialogRef.current` matters: focus is put on the dialog
           container on open, and the container is neither first nor last. Without
           it, the very first Shift+Tab after opening is not intercepted and focus
           walks backwards out of the dialog into the page behind — which is still
           scroll-locked, so the visitor is tabbing through content they cannot
           see. The mobile menu already guards this; the lightbox did not. */
        if (event.shiftKey && (active === first || active === dialogRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const timer = window.setTimeout(() => dialogRef.current?.focus(), 40);

    return () => {
      root.style.overflow = previous;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timer);
      restoreFocus?.focus?.();
    };
  }, [project, onClose, step]);

  return (
    <AnimatePresence>
      {project && (
        <m.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.24 }}
        >
          <button
            type="button"
            aria-label="Close gallery"
            onClick={onClose}
            className="absolute inset-0 cursor-zoom-out bg-ink/88 backdrop-blur-[3px]"
          />

          <m.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${project.title}, ${project.area}`}
            tabIndex={-1}
            initial={reduced ? false : { scale: 0.985, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={reduced ? undefined : { scale: 0.985, y: 10 }}
            transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 grid max-h-full w-full max-w-6xl gap-5 outline-none lg:grid-cols-[1.6fr_0.75fr] lg:items-start"
          >
            {/* Stage — all frames mounted, only the active one shown */}
            <div className="relative aspect-[3/2] w-full overflow-hidden rounded-[4px] bg-plaster">
              {project.images.map((image, position) => (
                <m.div
                  key={image.src}
                  className="absolute inset-0"
                  animate={{ opacity: position === index ? 1 : 0 }}
                  transition={{ duration: reduced ? 0 : 0.22 }}
                  aria-hidden={position !== index}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 70vw, 100vw"
                    placeholder="blur"
                    blurDataURL={blurTone(image.tone)}
                    className="object-cover"
                  />
                </m.div>
              ))}

              {count > 1 && (
                <>
                  <StageButton side="left" label="Previous photograph" onClick={() => step(-1)}>
                    <ArrowLeft weight="light" className="size-5" />
                  </StageButton>
                  <StageButton side="right" label="Next photograph" onClick={() => step(1)}>
                    <ArrowRight weight="light" className="size-5" />
                  </StageButton>
                </>
              )}
            </div>

            {/* Caption panel */}
            <div className="rounded-[4px] bg-paper p-6 lg:p-7">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[0.75rem] font-semibold tracking-[0.14em] text-ink-mute uppercase">
                  {project.area}
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close gallery"
                  className="-mt-1 -mr-1 grid size-9 shrink-0 place-items-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-plaster hover:text-ink"
                >
                  <X weight="light" className="size-5" />
                </button>
              </div>

              <h2 className="mt-3 font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
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
                  <dt className="text-ink-mute">Photograph</dt>
                  <dd className="mt-0.5 font-semibold text-ink tabular-nums">
                    {index + 1} of {count}
                  </dd>
                </div>
              </dl>

              <Link
                href={CTA_HREF}
                className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-accent px-6 text-[0.9375rem] font-semibold whitespace-nowrap text-white transition-[background-color,transform] duration-200 hover:bg-accent-deep active:translate-y-px active:scale-[0.98]"
              >
                {CTA_LABEL}
              </Link>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

function StageButton({
  side,
  label,
  onClick,
  children,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-paper/92 text-ink shadow-lift transition-transform duration-200 hover:scale-105 active:scale-95 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      {children}
    </button>
  );
}
