'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from 'motion/react';

import { cn } from '@/lib/cn';
import type { ProjectImage } from '@/lib/projects';

/**
 * The comparison. This component is the spine of the site: it is on the home
 * page, on every project, and on /repairs.
 *
 * The handle IS the seam — it starts at dead centre, exactly where the page's
 * centre line is, so the line appears to carry straight on through the
 * photograph. Dragging it is dragging the seam.
 *
 * Colour rule: the before side stays grey, the after side is in colour. That is
 * the entire palette logic of the site — the colour you can see is the paint
 * they put on.
 *
 * Performance note: the divider is a MotionValue and nothing about a drag goes
 * through React state. Pointer moves write straight to the motion value, which
 * drives a clip-path and a translate on the compositor. Re-rendering this
 * component on every pointermove would drop frames on exactly the mid-range
 * phones most of this site's visitors are holding.
 */

const EDGE_SNAP = 4; // % — settle to fully before / fully after near the edges
const CENTRE_SNAP = 2; // % — and back onto the page's centre line near the middle
const SETTLE_MS = 200;

function clamp(v: number) {
  return Math.min(100, Math.max(0, v));
}

/** Where the handle comes to rest when you let go of it. */
function settleTarget(v: number) {
  if (v <= EDGE_SNAP) return 0;
  if (v >= 100 - EDGE_SNAP) return 100;
  if (Math.abs(v - 50) <= CENTRE_SNAP) return 50;
  return v;
}

export function Seam({
  before,
  after,
  caption,
  beforeLabel,
  afterLabel,
  priority = false,
  className,
}: {
  before: ProjectImage;
  after: ProjectImage;
  /** What the job was. Metadata type, under the comparison. */
  caption?: string;
  /** What was wrong. */
  beforeLabel: string;
  /** What was done. */
  afterLabel: string;
  priority?: boolean;
  className?: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // The single source of truth for the divider, in per cent.
  const pct = useMotionValue(50);

  /**
   * Where the divider is heading, as opposed to where it currently is.
   *
   * Keyboard steps have to accumulate off this rather than off `pct.get()`.
   * Reading the live value means a held arrow key measures from wherever the
   * last 200ms animation had got to — about a fifth of a step in — so the
   * divider crawls instead of sweeping. Stepping off the target makes each
   * press worth a full 2%, however fast they arrive.
   */
  const target = useRef(50);

  // Clip the (grey) before layer to everything left of the divider.
  //
  // Built in ONE useTransform straight off `pct` rather than as a template over
  // a derived value. Chaining them — useTransform to get 100-v, then
  // useMotionTemplate over that — renders the correct string on mount and then
  // never updates again: the intermediate value does not drive the template.
  // The handle kept tracking while the image sat frozen at 50%, which is a
  // miserable bug to spot by eye because the control still feels alive.
  const beforeClip = useTransform(pct, (v) => `inset(0 ${100 - v}% 0 0)`);
  const handleLeft = useMotionTemplate`${pct}%`;

  /**
   * aria-valuenow has to track the drag, but re-rendering to set an attribute
   * would defeat the point of the motion value. So it is written directly to
   * the DOM node from a subscription instead.
   */
  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;

    const write = (v: number) => {
      const rounded = Math.round(v);
      el.setAttribute('aria-valuenow', String(rounded));
      el.setAttribute(
        'aria-valuetext',
        rounded === 0
          ? 'Showing the photograph before the work'
          : rounded === 100
            ? 'Showing the photograph after the work'
            : `${rounded}% across, from before on the left to after on the right`,
      );
    };

    write(pct.get());
    return pct.on('change', write);
  }, [pct]);

  const setFromClientX = useCallback(
    (clientX: number) => {
      const frame = frameRef.current;
      if (!frame) return;
      const rect = frame.getBoundingClientRect();
      if (rect.width === 0) return;
      // 1:1 with the pointer. No easing, no spring, no smoothing while dragging.
      const next = clamp(((clientX - rect.left) / rect.width) * 100);
      target.current = next;
      pct.set(next);
    },
    [pct],
  );

  const settle = useCallback(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    target.current = settleTarget(pct.get());
    animate(pct, target.current, {
      duration: reduced ? 0 : SETTLE_MS / 1000,
      ease: [0.16, 0.84, 0.28, 1],
    });
  }, [pct]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Ignore right-clicks, and let a real click on a link inside still work.
      if (e.button !== 0) return;
      dragging.current = true;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      setFromClientX(e.clientX);
      handleRef.current?.focus({ preventScroll: true });
    },
    [setFromClientX],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      setFromClientX(e.clientX);
    },
    [setFromClientX],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      dragging.current = false;
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      settle();
    },
    [settle],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 10 : 2;
      const from = target.current;
      let next: number | null = null;

      if (e.key === 'ArrowLeft') next = from - step;
      else if (e.key === 'ArrowRight') next = from + step;
      else if (e.key === 'PageDown') next = from - 10;
      else if (e.key === 'PageUp') next = from + 10;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = 100;

      if (next === null) return;
      e.preventDefault();
      target.current = clamp(next);
      animate(pct, target.current, {
        duration: SETTLE_MS / 1000,
        ease: [0.16, 0.84, 0.28, 1],
      });
    },
    [pct],
  );

  // Without both photographs there is nothing honest to compare, so the frame
  // says what is missing instead of showing something that is not the job.
  if (!before.src || !after.src || !before.alt || !after.alt) {
    return (
      <PendingComparison
        before={before}
        after={after}
        caption={caption}
        beforeLabel={beforeLabel}
        afterLabel={afterLabel}
        className={className}
      />
    );
  }

  const ratio =
    after.width && after.height ? `${after.width} / ${after.height}` : '3 / 2';

  return (
    <figure className={cn('m-0', className)}>
      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative w-full touch-pan-y select-none overflow-hidden bg-black"
        style={{ aspectRatio: ratio }}
      >
        {/* After — underneath, in colour, and the colour arrives with it. */}
        <div className="absolute inset-0">
          <Image
            src={after.src}
            alt={after.alt}
            fill
            sizes="100vw"
            priority={priority}
            className="object-cover"
          />
        </div>

        {/* Before — clipped over the top, and permanently grey. */}
        <motion.div
          className="is-before absolute inset-0"
          style={{ clipPath: beforeClip }}
          aria-hidden="true"
        >
          <Image
            src={before.src}
            alt=""
            fill
            sizes="100vw"
            priority={priority}
            className="object-cover"
          />
        </motion.div>

        {/* The seam, carried on through the photograph. */}
        <motion.div
          className="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-white mix-blend-difference"
          style={{ left: handleLeft, x: '-50%' }}
          aria-hidden="true"
        />

        {/* The handle. A square grip, because nothing on this site is round. */}
        <motion.div
          ref={handleRef}
          role="slider"
          tabIndex={0}
          aria-label={`Drag to compare: ${beforeLabel}, and ${afterLabel}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          className={cn(
            'absolute top-1/2 z-20 h-11 w-11 cursor-ew-resize',
            'border-2 border-black bg-white',
            'flex items-center justify-center',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
          )}
          // Centring is done here rather than with a Tailwind translate: Motion
          // owns the transform on this node and would overwrite the class.
          style={{ left: handleLeft, x: '-50%', y: '-50%' }}
        >
          <span aria-hidden="true" className="font-body text-[13px] leading-none text-black">
            ←→
          </span>
        </motion.div>
      </div>

      {/* Labels, split by the seam: what was wrong, and what was done. */}
      <figcaption className="split mt-4">
        <div data-seam-side="right">
          <p className="meta">Before — {beforeLabel}</p>
        </div>
        <div data-seam-side="left">
          <p className="meta">After — {afterLabel}</p>
        </div>
      </figcaption>

      {caption ? <p className="meta mt-2 px-gutter">{caption}</p> : null}
    </figure>
  );
}

/**
 * The comparison, before there are photographs to put in it.
 *
 * It keeps the shape of the real thing and states exactly which two photographs
 * are missing. It does not fill the space with theme stock, which is how the
 * site this replaces ended up leading with a stranger's photography and alt
 * text that read "Enroll Now".
 */
function PendingComparison({
  before,
  after,
  caption,
  beforeLabel,
  afterLabel,
  className,
}: {
  before: ProjectImage;
  after: ProjectImage;
  caption?: string;
  beforeLabel: string;
  afterLabel: string;
  className?: string;
}) {
  return (
    <figure className={cn('m-0', className)}>
      {/* Shorter than the 3:2 the real comparison will be. It has to hold the
          shape of the thing and say what is missing, without turning every page
          into a screen and a half of empty frame while we wait for Ted's
          photographs. */}
      <div
        className="relative grid w-full grid-cols-2 border border-hair"
        // min-height so the two descriptions are not crushed into a 150px band
        // on a phone. The real comparison takes its height from the photograph.
        style={{ aspectRatio: '2.6 / 1', minHeight: '18rem' }}
      >
        <div className="flex flex-col justify-between gap-6 p-gutter text-right">
          <p className="meta">Before — {beforeLabel}</p>
          <p className="meta max-w-[34ch] justify-self-end normal-case tracking-normal">
            {before.needs ?? 'The view before the work started.'}
          </p>
        </div>

        {/* The seam is still here. It is the only thing in the frame that is. */}
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 bg-black"
        />

        <div className="flex flex-col justify-between gap-6 p-gutter">
          <p className="meta">After — {afterLabel}</p>
          <p className="meta max-w-[34ch] normal-case tracking-normal">
            {after.needs ?? 'The same view, finished.'}
          </p>
        </div>
      </div>

      <figcaption className="meta mt-4 px-gutter">
        {caption ? `${caption} · ` : ''}Photographs to come — see CONTENT-NEEDED.md
      </figcaption>
    </figure>
  );
}
