"use client";

import { useCallback, useRef } from "react";
import Image from "next/image";
import { m, useMotionTemplate, useMotionValue, useTransform } from "motion/react";
import { blurTone } from "@/lib/images";
import type { ProjectImage } from "@/data/projects";

/**
 * Before/after slider.
 *
 * The divider is a masked paint edge with a roller grip. Position is a motion
 * value driving a clip-path — the dragged value never touches React state, so
 * there is no re-render per pointer move. Pointer and keyboard both operable;
 * arrows nudge, shift-arrows jump, Home/End go to the ends.
 */
export function BeforeAfter({
  before,
  after,
  label,
  className = "",
}: {
  before: ProjectImage;
  after: ProjectImage;
  label: string;
  className?: string;
}) {
  const position = useMotionValue(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const clipRight = useTransform(position, (value) => 100 - value);
  const clipPath = useMotionTemplate`inset(0 ${clipRight}% 0 0)`;
  const left = useMotionTemplate`${position}%`;

  const set = useCallback(
    (value: number) => {
      const clamped = Math.min(100, Math.max(0, value));
      position.set(clamped);
      handleRef.current?.setAttribute("aria-valuenow", String(Math.round(clamped)));
    },
    [position],
  );

  const fromPointer = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      set(((clientX - rect.left) / rect.width) * 100);
    },
    [set],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 10 : 2;
    const current = position.get();
    const moves: Record<string, number> = {
      ArrowLeft: current - step,
      ArrowRight: current + step,
      Home: 0,
      End: 100,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    set(moves[event.key]);
  };

  return (
    <div
      ref={containerRef}
      className={`relative touch-none overflow-hidden rounded-[4px] bg-plaster select-none ${className}`}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        fromPointer(event.clientX);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event.clientX);
      }}
    >
      {/* After — the finished job sits underneath and is always complete */}
      <Image
        src={after.src}
        alt={after.alt}
        width={1500}
        height={1000}
        sizes="(min-width: 1024px) 60vw, 100vw"
        placeholder="blur"
        blurDataURL={blurTone(after.tone)}
        className="h-full w-full object-cover"
      />

      {/* Before — clipped back as the divider is dragged */}
      <m.div style={{ clipPath }} className="absolute inset-0">
        <Image
          src={before.src}
          alt={before.alt}
          width={1500}
          height={1000}
          sizes="(min-width: 1024px) 60vw, 100vw"
          placeholder="blur"
          blurDataURL={blurTone(before.tone)}
          className="h-full w-full object-cover"
        />
      </m.div>

      <Tag className="left-4" text="Before" />
      <Tag className="right-4" text="After" />

      {/* Divider — a masked tape edge with a roller grip */}
      <m.div
        ref={handleRef}
        role="slider"
        tabIndex={0}
        aria-label={`Before and after: ${label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={50}
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        style={{ left }}
        className="absolute inset-y-0 z-10 -ml-5 w-10 cursor-ew-resize"
      >
        <div className="absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-paper shadow-[0_0_0_1px_rgb(60_60_50/0.18)]" />
        <div className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-paper shadow-lift">
          {/* Roller grip — three ribs, drawn in the icon system's weight */}
          <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true" fill="none">
            <path
              d="M7 5 3.5 10 7 15M13 5l3.5 5-3.5 5"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </m.div>
    </div>
  );
}

function Tag({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span
      className={`pointer-events-none absolute bottom-4 z-10 rounded-full bg-ink/85 px-3 py-1 text-[0.6875rem] font-semibold tracking-[0.12em] text-white uppercase backdrop-blur-[2px] ${className}`}
    >
      {text}
    </span>
  );
}
