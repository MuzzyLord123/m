'use client';

import Image from 'next/image';
import { useId, useState } from 'react';

/**
 * Before and after, with a divider the reader drags.
 *
 * The control is a real `<input type="range">`, stretched across the plate and
 * made invisible. That one decision is most of the quality here: dragging,
 * touch, click-to-jump, arrow keys, Home and End, screen-reader announcement
 * and the focus ring all arrive for free and all behave the way the operating
 * system says they should. The usual hand-rolled version — a div, a pointerdown
 * listener and some maths — works with a mouse and fails with everything else.
 *
 * The divider is not a decorative seam. It carries a hi-vis marking and the two
 * states are labelled in the site's own label type, so a still screenshot of it
 * still reads as before and after.
 *
 * Without JavaScript the range is inert, so the component renders the after
 * photograph at full width with both labels beneath it and nothing is lost but
 * the interaction.
 */
export function Compare({
  before,
  after,
  ratioClass,
  sizes,
  priority = false,
}: {
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  ratioClass: string;
  sizes: string;
  priority?: boolean;
}) {
  const [position, setPosition] = useState(50);
  const id = useId();

  return (
    <div className="group relative">
      <div className={`relative w-full overflow-hidden bg-steel ${ratioClass}`}>
        {/* After sits underneath, complete. */}
        <Image
          src={after.src}
          alt={after.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />

        {/* Before is clipped to the left of the divider. aria-hidden because the
            alt text of both photographs is announced by the range below —
            reading two long descriptions in a row is worse, not better. */}
        <div
          className="absolute inset-0"
          style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          aria-hidden
        >
          <Image src={before.src} alt="" fill sizes={sizes} className="object-cover" />
        </div>

        {/* The divider. */}
        <div
          className="pointer-events-none absolute inset-y-0 w-[3px] bg-hivis"
          style={{ left: `calc(${position}% - 1.5px)` }}
          aria-hidden
        >
          <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center border-[3px] border-hivis bg-graphite">
            <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden>
              <path
                d="M6 1 1.5 6 6 11M12 1l4.5 5-4.5 5"
                fill="none"
                stroke="#E4FF32"
                strokeWidth="1.6"
              />
            </svg>
          </span>
        </div>

        <span className="t-label pointer-events-none absolute left-4 top-4 bg-[var(--color-navy)]/85 px-2.5 py-1.5 !text-bone">
          Before
        </span>
        <span className="t-label pointer-events-none absolute right-4 top-4 bg-[var(--color-navy)]/85 px-2.5 py-1.5 !text-bone">
          After
        </span>

        <label htmlFor={id} className="sr-only">
          Drag to compare before and after. {before.alt} {after.alt}
        </label>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={position}
          onChange={(e) => setPosition(Number(e.target.value))}
          aria-valuetext={`${position}% before, ${100 - position}% after`}
          className="compare-range absolute inset-0 h-full w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hivis"
        />
      </div>
    </div>
  );
}

/**
 * The no-JavaScript and not-yet-uploaded fallback: both states stacked and
 * labelled. Also what the comparison degrades to on a very narrow screen if the
 * plate is too small for a 44px target to be honest about being draggable.
 */
export function ComparePair({
  before,
  after,
  ratioClass,
  sizes,
}: {
  before: { src: string; alt: string };
  after: { src: string; alt: string };
  ratioClass: string;
  sizes: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-px bg-line">
      {[
        { label: 'Before', image: before },
        { label: 'After', image: after },
      ].map(({ label, image }) => (
        <figure key={label} className="relative">
          <div className={`relative w-full overflow-hidden bg-steel ${ratioClass}`}>
            <Image src={image.src} alt={image.alt} fill sizes={sizes} className="object-cover" />
          </div>
          <figcaption className="t-label absolute left-3 top-3 bg-[var(--color-navy)]/85 px-2.5 py-1.5 !text-bone">
            {label}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
