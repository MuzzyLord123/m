"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { blurTone } from "@/lib/images";

/**
 * Video façade. Nothing at all is fetched from YouTube until someone presses
 * play — no iframe, no script, no cookie, no weight on the page. On click the
 * youtube-nocookie player is injected in place of the poster.
 *
 * The play control is a paint blob rather than a rounded rectangle, because
 * every other affordance on this site is either a pill or a 4px card and this
 * one should read as a mark left by a brush.
 */
export function VideoFacade({
  id,
  title,
  poster,
  tone,
  caption,
  className = "",
}: {
  id: string;
  title: string;
  poster: string;
  tone: string;
  caption?: string;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();

  return (
    <figure className={className}>
      <div className="relative aspect-video w-full overflow-hidden rounded-[4px] bg-plaster">
        {playing ? (
          <iframe
            title={title}
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 h-full w-full cursor-pointer"
            aria-label={`Play video: ${title}`}
          >
            <Image
              src={poster}
              alt=""
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              placeholder="blur"
              blurDataURL={blurTone(tone)}
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
            />

            {/* Scrim so the title and control hold contrast over any frame */}
            <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" />

            <span className="absolute inset-0 grid place-items-center">
              <motion.svg
                viewBox="0 0 96 96"
                className="h-24 w-24 drop-shadow-[0_10px_28px_rgb(20_20_20/0.35)]"
                aria-hidden="true"
                initial={false}
                whileHover={reduced ? undefined : { scale: 1.06, rotate: -4 }}
                whileTap={reduced ? undefined : { scale: 0.96 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* A blob, not a circle — paint does not land in perfect rounds */}
                <path
                  d="M48 4c14 0 27 6.5 35 18.5 7.5 11.5 8.5 27 2.5 39.5-6 12.5-19 22-33.5 24-14 2-29.5-3-38.5-13.5C4 61.5 1.5 45 6 31.5 10.5 18 23 8 34 5.5 38.5 4.5 43.5 4 48 4Z"
                  fill="var(--color-accent)"
                />
                <path d="M40 33.5 65 48 40 62.5Z" fill="#fff" />
              </motion.svg>
            </span>

            <span className="absolute inset-x-0 bottom-0 p-6 text-left">
              <span className="block font-display text-[1.25rem] leading-tight font-semibold tracking-[-0.02em] text-white">
                {title}
              </span>
              <span className="mt-1 block text-[0.8125rem] text-white/75">
                Nothing loads from YouTube until you press play
              </span>
            </span>
          </button>
        )}
      </div>

      {caption && (
        <figcaption className="mt-3 text-[0.875rem] leading-relaxed text-ink-mute">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
