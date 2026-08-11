'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';

import type { ProjectImage } from '@/lib/projects';
import { SHOW_PLACEHOLDERS } from '@content/site';

/**
 * Full-viewport photograph with the headline set in a solid plate across the
 * foot of it.
 *
 * The plate is there for a reason: type laid straight over a photograph is
 * legible until the day somebody swaps in a photograph of a white kitchen in
 * full sun. A solid block of night keeps the contrast fixed whatever the
 * picture behind it, and it is how a magazine would set it anyway.
 *
 * The only movement is one slow parallax on the photograph — 8% of travel,
 * driven by scroll position rather than state, so it costs nothing per frame.
 */
export function Hero({
  image,
  eyebrow,
  heading,
  lede,
}: {
  image?: ProjectImage;
  eyebrow: string;
  heading: string;
  lede?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '8%']);

  // With no photograph to fill it, a full-viewport hero is just a void. Set the
  // opening as type instead — it is a serif and it can carry a page on its own.
  if (!image?.src && !SHOW_PLACEHOLDERS) {
    return (
      <div data-tone="night" className="gutter-x pt-24 pb-20 md:pt-32 md:pb-28">
        <hr className="hairline max-w-24" />
        <p className="eyebrow mt-6">{eyebrow}</p>
        <h1 className="mt-6 max-w-[16ch] text-[clamp(2.75rem,8.5vw,7rem)]">{heading}</h1>
        {lede ? (
          <p className="secondary mt-10 max-w-[54ch] text-lg leading-[1.7]">{lede}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-tone="night"
      className="relative flex min-h-[calc(100svh-4rem)] flex-col justify-end overflow-hidden"
    >
      {image?.src ? (
        <motion.div className="absolute inset-0 -z-10" style={reduced ? undefined : { y }}>
          <Image
            src={image.src}
            alt={image.alt ?? ''}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      ) : (
        <div
          data-needed="photographs"
          className="absolute inset-0 -z-10 flex items-center justify-center border-b border-dashed border-slate p-8"
        >
          <p className="secondary max-w-[40ch] text-center text-sm leading-relaxed">
            {image?.needs ??
              'The hero photograph goes here: one exceptional hand-painted kitchen, full width, at original resolution from the Wix media manager.'}
          </p>
        </div>
      )}

      <div className="gutter-x border-t border-t-brass/55 bg-night pt-10 pb-14">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-5 max-w-[18ch] text-[clamp(2.5rem,7.5vw,6rem)]">{heading}</h1>
        {lede ? (
          <p className="secondary mt-8 max-w-[52ch] text-lg leading-[1.7]">{lede}</p>
        ) : null}
      </div>
    </div>
  );
}
