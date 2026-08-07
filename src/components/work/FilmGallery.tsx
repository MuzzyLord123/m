"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, LazyMotion, domMax, m, useReducedMotion } from "motion/react";
import { Play, X } from "@phosphor-icons/react/dist/ssr";
import { blurTone } from "@/lib/images";
import { youTubePoster } from "@/lib/youtube";
import { films, filmSlots, showFilmSlots, type Film } from "@/data/films";

/**
 * A film's poster, with the one failure YouTube's thumbnails actually have.
 *
 * maxresdefault.jpg is the 1280x720 frame and it is what you want — but YouTube
 * only generates it above a resolution threshold, so an older or phone-shot
 * upload simply does not have one and the request 404s. hqdefault.jpg is
 * generated for every video ever uploaded, so it is the fallback. Without this
 * the film would show a broken frame, and only for the videos most likely to be
 * the client's own phone footage.
 *
 * Only films using YouTube's frame can fail this way; a hand-picked poster from
 * public/work is served straight through.
 */
function FilmPoster({
  film,
  sizes,
  className = "object-cover",
}: {
  film: Film;
  sizes: string;
  className?: string;
}) {
  const [src, setSrc] = useState(film.poster);

  return (
    <Image
      src={src}
      alt=""
      fill
      sizes={sizes}
      placeholder="blur"
      blurDataURL={blurTone(film.tone)}
      onError={() => {
        if (film.posterFromYouTube) setSrc(youTubePoster(film.id, "hq"));
      }}
      className={className}
    />
  );
}

/**
 * The film gallery — two separately designed treatments, exactly as the
 * photographs have, rather than one layout squeezed to fit.
 *
 *   DESKTOP (>=1024px): a projection room. One large stage on the left running
 *   the selected film, a queue of the rest down the right. Selecting swaps the
 *   stage without a page change, so a visitor can work through six films
 *   without ever losing the layout.
 *
 *   MOBILE (<1024px): full-bleed cards in a vertical feed, thumb-sized play
 *   targets, and a tap raises the same drag-to-dismiss bottom sheet the
 *   photographs use — so the two galleries feel like one site.
 *
 * THE VISITOR'S BROWSER NEVER TALKS TO GOOGLE until someone presses play. The
 * iframe is mounted on demand and only at youtube-nocookie.com; the poster is
 * either one of the client's own photographs or the film's own frame fetched
 * BY THE SERVER through next/image and re-served from this domain. Adding a
 * film needs nothing but its URL without giving that up.
 */
export function FilmGallery() {
  if (films.length === 0) return showFilmSlots ? <FilmSlots /> : null;

  return (
    <LazyMotion features={domMax}>
      <FilmGalleryDesktop />
      <FilmGalleryMobile />
    </LazyMotion>
  );
}

/* -------------------------------------------------------------------- slots */

/**
 * The gallery's shape, with the films not in it yet.
 *
 * Same grid as the real thing at both breakpoints — a wide lead over a pair on
 * desktop, a stacked feed on a phone — so what is signed off here is what
 * arrives when the links are pasted in. Every slot states plainly that it is
 * waiting for one, and the play control is an outline rather than the filled
 * orange blob, so no part of this can be mistaken for a film that failed to
 * load. See filmSlots in src/data/films.ts for how to turn them off.
 */
function FilmSlots() {
  return (
    <div className="shell">
      <ul className="grid gap-6 lg:grid-cols-2">
        {filmSlots.map((slot, index) => (
          <li
            key={slot.slot}
            className={index === 0 ? "lg:col-span-2" : undefined}
          >
            {/* 4:3 on a phone, 16:9 above it. A video-shaped box is only 219px
                tall at 390px wide, which put the play control straight through
                the middle of the caption. The taller crop is the room the two
                need to sit clear of each other. */}
            <div
              className={`relative aspect-[4/3] w-full overflow-hidden rounded-[4px] border border-dashed border-hairline bg-plaster sm:aspect-video ${
                index === 0 ? "lg:aspect-[16/9]" : ""
              }`}
            >
              <Image
                src={slot.poster}
                alt=""
                fill
                sizes={index === 0 ? "(min-width: 1024px) 88vw, 100vw" : "(min-width: 1024px) 44vw, 100vw"}
                placeholder="blur"
                blurDataURL={blurTone(slot.tone)}
                /* Desaturated and dimmed, so a slot never reads as finished
                   work. The photograph is only here to show the frame. */
                className="object-cover opacity-25 grayscale"
              />

              {/* Sits above the caption rather than through it. */}
              <span
                aria-hidden="true"
                className="absolute top-[38%] left-1/2 grid size-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-dashed border-ink-mute text-ink-mute lg:top-1/2 lg:size-20"
              >
                <Play weight="light" className="ml-0.5 size-7 lg:size-8" />
              </span>

              <span className="absolute top-4 left-4 rounded-full border border-hairline bg-paper/85 px-3 py-1 eyebrow text-ink-mute backdrop-blur-[2px]">
                Slot {slot.slot} · awaiting link
              </span>

              {/* A scrim under the words, so they hold whatever the photograph
                  behind them is doing. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 block h-2/3 bg-gradient-to-t from-paper via-paper/80 to-transparent"
              />
              <span className="absolute inset-x-0 bottom-0 block p-5 lg:p-7">
                <span className="block font-display text-[1.25rem] leading-tight font-semibold tracking-[-0.025em] text-ink lg:text-[1.5rem]">
                  {slot.title}
                </span>
                <span className="measure mt-2 block text-[0.9375rem] leading-relaxed text-ink-soft">
                  {slot.summary}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ desktop */

function FilmGalleryDesktop() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(false);
  const film = films[active];

  // Changing film puts the stage back to its poster — never autoplay something
  // the visitor has not asked for.
  function select(index: number) {
    setActive(index);
    setPlaying(false);
  }

  return (
    <div className="shell max-lg:hidden">
      <div className="grid gap-6 lg:grid-cols-[1.75fr_1fr] lg:items-start">
        {/* Stage */}
        <div>
          <div className="relative aspect-video w-full overflow-hidden rounded-[4px] bg-plaster-deep shadow-lift-deep">
            {playing ? (
              <iframe
                title={film.title}
                src={`https://www.youtube-nocookie.com/embed/${film.id}?autoplay=1&rel=0&modestbranding=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                /* A dark ground and colour-scheme on the FRAME itself. An
                   iframe paints its own background before its document loads,
                   and the browser's blocked-or-failed placeholder is light
                   grey — so a slow YouTube, an ad-blocker or a corporate proxy
                   puts a white rectangle in the middle of a near-black page.
                   The wrapper's background cannot help; it is underneath. */
                style={{ colorScheme: "dark", backgroundColor: "var(--color-plaster-deep)" }}
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                aria-label={`Play ${film.title}`}
                className="group absolute inset-0 block cursor-pointer"
              >
                <FilmPoster
                  film={film}
                  sizes="(min-width: 1024px) 62vw, 100vw"
                  className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/25 to-scrim/10" />
                <PlayBlob />
                <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-7">
                  <span className="block max-w-2xl text-left">
                    <span className="block font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.025em] text-white">
                      {film.title}
                    </span>
                    <span className="mt-2 block text-[0.9375rem] leading-relaxed text-white/80">
                      {film.summary}
                    </span>
                  </span>
                  {film.duration && (
                    <span className="shrink-0 rounded-full bg-scrim/70 px-3 py-1 eyebrow text-white uppercase backdrop-blur-[2px]">
                      {film.duration}
                    </span>
                  )}
                </span>
              </button>
            )}
          </div>

          {/* Once playing, the title moves out from under the player. */}
          {playing && (
            <div className="mt-5">
              <h3 className="font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
                {film.title}
              </h3>
              <p className="measure mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
                {film.summary}
              </p>
            </div>
          )}
        </div>

        {/* Queue */}
        <div>
          <p className="eyebrow text-ink-mute">
            {films.length} film{films.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-4 grid gap-2.5" aria-label="More films">
            {films.map((item, index) => {
              const current = index === active;
              return (
                <li key={`${item.id}-${index}`}>
                  <button
                    type="button"
                    onClick={() => select(index)}
                    aria-current={current ? "true" : undefined}
                    className={`group flex w-full items-center gap-4 rounded-[4px] p-2.5 text-left transition-colors duration-200 ${
                      current ? "bg-accent-wash" : "hover:bg-plaster"
                    }`}
                  >
                    <span className="relative aspect-video w-28 shrink-0 overflow-hidden rounded-[4px] bg-plaster-deep">
                      <FilmPoster film={item} sizes="112px" />
                      {current && <span className="absolute inset-0 ring-2 ring-accent ring-inset" />}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={`block truncate text-[0.9375rem] font-semibold ${
                          current ? "text-accent" : "text-ink"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] text-ink-mute">
                        {item.area}
                        {item.duration ? ` · ${item.duration}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- mobile */

function FilmGalleryMobile() {
  const [open, setOpen] = useState<Film | null>(null);

  return (
    <div className="lg:hidden">
      <ul className="grid gap-8">
        {films.map((film, index) => (
          <li key={`${film.id}-${index}`}>
            <button
              type="button"
              onClick={() => setOpen(film)}
              className="block w-full text-left"
              aria-label={`Play ${film.title}`}
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-plaster-deep sm:aspect-video">
                <FilmPoster film={film} sizes="100vw" />
                <span className="absolute inset-0 bg-gradient-to-t from-scrim/90 via-scrim/35 to-transparent" />
                <PlayBlob />
                {film.duration && (
                  <span className="absolute top-4 right-4 rounded-full bg-scrim/70 px-2.5 py-1 eyebrow text-white uppercase backdrop-blur-[2px]">
                    {film.duration}
                  </span>
                )}
                <span className="absolute inset-x-0 bottom-0 px-5 pb-5">
                  <span className="block font-display text-[1.375rem] leading-tight font-semibold tracking-[-0.025em] text-white">
                    {film.title}
                  </span>
                  <span className="mt-1 block text-[0.8125rem] text-white/80">{film.area}</span>
                </span>
              </div>
              <p className="shell mt-4 text-[0.9375rem] leading-relaxed text-ink-soft">
                {film.summary}
              </p>
            </button>
          </li>
        ))}
      </ul>

      <FilmSheet film={open} onClose={() => setOpen(null)} />
    </div>
  );
}

/**
 * The mobile player, in the same drag-to-dismiss sheet the photographs use.
 * Escape closes, focus is trapped and restored, scroll is locked while open.
 */
function FilmSheet({ film, onClose }: { film: Film | null; onClose: () => void }) {
  const reduced = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!film) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    const restoreFocus = document.activeElement as HTMLElement | null;
    root.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;

      const focusable = sheetRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;

      if (event.shiftKey && (activeEl === first || activeEl === sheetRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
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
  }, [film, onClose]);

  return (
    <AnimatePresence>
      {film && (
        <div className="fixed inset-0 z-[120]">
          <m.button
            type="button"
            aria-label="Close film"
            onClick={onClose}
            className="absolute inset-0 bg-scrim/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
          />

          <m.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={film.title}
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
            className="absolute inset-x-0 bottom-0 max-h-[92dvh] overflow-y-auto overscroll-contain rounded-t-[4px] bg-paper outline-none"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-paper/95 px-5 pt-3 pb-2 backdrop-blur-sm">
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-2 mx-auto h-1 w-10 rounded-full bg-ink/20"
              />
              <p className="mt-4 eyebrow text-ink-mute">
                {film.area}
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close film"
                className="mt-3 grid size-11 shrink-0 place-items-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-plaster"
              >
                <X weight="light" className="size-5" />
              </button>
            </div>

            {/* The player is mounted only now — opening the sheet IS the
                consent to load it, which is why there is no second tap. */}
            <div className="relative aspect-video w-full bg-plaster-deep">
              <iframe
                title={film.title}
                src={`https://www.youtube-nocookie.com/embed/${film.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                /* A dark ground and colour-scheme on the FRAME itself. An
                   iframe paints its own background before its document loads,
                   and the browser's blocked-or-failed placeholder is light
                   grey — so a slow YouTube, an ad-blocker or a corporate proxy
                   puts a white rectangle in the middle of a near-black page.
                   The wrapper's background cannot help; it is underneath. */
                style={{ colorScheme: "dark", backgroundColor: "var(--color-plaster-deep)" }}
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>

            <div className="px-5 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <h2 className="font-display text-[1.5rem] leading-tight font-semibold tracking-[-0.025em] text-ink">
                {film.title}
              </h2>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft">{film.summary}</p>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * The play control. A brush blob rather than a rounded rectangle, matching
 * VideoFacade — every other affordance here is a pill or a 4px card, and this
 * one should read as a mark left by a brush.
 */
function PlayBlob() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-1/2 left-1/2 grid size-[4.5rem] -translate-x-1/2 -translate-y-1/2 place-items-center bg-accent text-on-accent transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 lg:size-20"
      style={{
        borderRadius: "62% 38% 46% 54% / 54% 46% 54% 46%",
      }}
    >
      <Play weight="fill" className="ml-0.5 size-7 lg:size-8" />
    </span>
  );
}
