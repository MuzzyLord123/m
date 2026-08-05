"use client";

import { m, useReducedMotion } from "motion/react";

/**
 * Signature interaction 6 — the paint gauge.
 *
 * Progress through the quote flow is a tin filling with colour and a band of
 * it laid across the track. Not a segmented stepper, not a percentage.
 */
export function PaintGauge({
  step,
  total,
  labels,
}: {
  step: number;
  total: number;
  labels: string[];
}) {
  const reduced = useReducedMotion();
  const progress = Math.min(1, Math.max(0, step / total));
  const ease = { duration: reduced ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] as const };

  return (
    <div>
      <div className="flex items-center gap-4">
        {/* The tin, filling */}
        <svg
          viewBox="0 0 30 34"
          className="h-[34px] w-[30px] shrink-0 overflow-visible"
          aria-hidden="true"
          fill="none"
        >
          <defs>
            <clipPath id="tin-body">
              <path d="M3 8h24v22a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
            </clipPath>
          </defs>

          {/* Paint level rises from the bottom of the tin */}
          <g clipPath="url(#tin-body)">
            <rect x="3" y="8" width="24" height="24" fill="var(--color-plaster)" />
            <m.rect
              x="3"
              width="24"
              height="24"
              fill="var(--color-accent)"
              initial={false}
              animate={{ y: 32 - 24 * progress }}
              transition={ease}
            />
          </g>

          <path
            d="M3 8h24v22a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z"
            stroke="var(--color-ink)"
            strokeWidth="1.5"
          />
          {/* Handle, and the rim it hangs from */}
          <path d="M1.5 8h27" stroke="var(--color-ink)" strokeWidth="1.5" strokeLinecap="round" />
          <path
            d="M6 8V6.5A9 9 0 0 1 24 6.5V8"
            stroke="var(--color-ink)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {/* The track it has been laid across */}
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-plaster">
          <m.div
            className="h-full origin-left rounded-full bg-accent"
            initial={false}
            animate={{ scaleX: progress }}
            transition={ease}
            style={{ width: "100%" }}
          />
        </div>

        <p className="shrink-0 text-[0.8125rem] font-medium text-ink-soft tabular-nums">
          {Math.min(step, total)} of {total}
        </p>
      </div>

      <ol className="mt-3 hidden gap-6 sm:flex">
        {labels.map((label, index) => (
          <li
            key={label}
            aria-current={index === step - 1 ? "step" : undefined}
            className={`text-[0.8125rem] transition-colors duration-300 ${
              index === step - 1 ? "font-medium text-accent" : "text-ink-mute"
            }`}
          >
            {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
