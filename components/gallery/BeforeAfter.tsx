'use client'

import { useCallback, useRef } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
} from 'motion/react'
import type { Photo, SwatchKey } from '@/content/types'
import { PhotoSlot } from '../PhotoSlot'

/**
 * Before / after with a draggable divider.
 *
 * The position lives in a MotionValue, so dragging never triggers a React
 * render — the clip path and the handle transform are driven straight from it.
 * The aria-valuenow attribute is written directly to the DOM node for the same
 * reason.
 *
 * Keyboard: the handle is a slider. Arrows nudge 2%, shift-arrows 10%,
 * Home and End jump to either end.
 */
export function BeforeAfter({
  before,
  after,
  swatch,
  label,
  className = '',
}: {
  before: Photo
  after: Photo
  swatch: SwatchKey
  label: string
  className?: string
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const handleRef = useRef<HTMLDivElement | null>(null)
  const pct = useMotionValue(50)

  const clip = useMotionTemplate`inset(0 0 0 ${pct}%)`
  const left = useMotionTemplate`${pct}%`

  useMotionValueEvent(pct, 'change', (v) => {
    handleRef.current?.setAttribute('aria-valuenow', String(Math.round(v)))
  })

  const setFromClientX = useCallback(
    (clientX: number) => {
      const box = wrapRef.current?.getBoundingClientRect()
      if (!box || box.width === 0) return
      const next = ((clientX - box.left) / box.width) * 100
      pct.set(Math.min(100, Math.max(0, next)))
    },
    [pct],
  )

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    setFromClientX(e.clientX)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 0) return
    setFromClientX(e.clientX)
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2
    const current = pct.get()
    let next: number | null = null
    if (e.key === 'ArrowLeft') next = current - step
    if (e.key === 'ArrowRight') next = current + step
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = 100
    if (next === null) return
    e.preventDefault()
    pct.set(Math.min(100, Math.max(0, next)))
  }

  return (
    <div
      ref={wrapRef}
      className={`relative touch-none overflow-hidden select-none ${className}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
    >
      {/* before sits underneath, full width */}
      <div className="absolute inset-0">
        <PhotoSlot
          photo={before}
          swatch={swatch}
          className="h-full w-full"
          sizes="(min-width: 768px) 60vw, 100vw"
          label="Before"
        />
      </div>

      {/* after is clipped from the left, so the divider wipes between them */}
      <motion.div className="absolute inset-0" style={{ clipPath: clip }}>
        <PhotoSlot
          photo={after}
          swatch="black"
          className="h-full w-full"
          sizes="(min-width: 768px) 60vw, 100vw"
          label="After"
          labelSide="right"
        />
      </motion.div>

      {/* the divider */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 z-10 w-[3px] bg-chalk"
        style={{ left, x: '-1.5px' }}
        aria-hidden
      />

      <motion.div
        ref={handleRef}
        role="slider"
        tabIndex={0}
        aria-label={`${label}. Drag or use the arrow keys to compare before and after.`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={50}
        aria-valuetext="Half before, half after"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className="absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 cursor-ew-resize items-center justify-center bg-chalk"
        style={{ left, x: '-22px' }}
      >
        <span aria-hidden className="block h-4 w-[2px] bg-ink" />
        <span aria-hidden className="mx-1.5 block h-6 w-[2px] bg-ink" />
        <span aria-hidden className="block h-4 w-[2px] bg-ink" />
      </motion.div>
    </div>
  )
}
