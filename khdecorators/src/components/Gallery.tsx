'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import type { Photo } from '@content/types'
import { ArrowIcon } from './icons'

export type GalleryItem = Photo & {
  /** One line on the plate beneath the picture: what the job was. Our words. */
  caption: string
}

/**
 * Kenny's photographs, hung.
 *
 * ONE set of markup, two hangs: on a phone it is a rail of framed plates that
 * swipes sideways and snaps; from a tablet up it becomes a masonry wall in which
 * every photograph keeps its own shape. Nothing is rendered twice, so nothing is
 * downloaded twice.
 *
 * Each plate opens the photograph full-screen in a native <dialog>, which brings
 * the focus trap, Escape to close and the inert page behind it for free. Arrow
 * keys and the two buttons move through the set.
 */
export function Gallery({ items, label = 'Recent work' }: { items: GalleryItem[]; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [index, setIndex] = useState<number | null>(null)

  const open = (i: number) => {
    setIndex(i)
    dialog.current?.showModal()
  }
  const close = () => dialog.current?.close()
  const step = useCallback(
    (by: number) => setIndex((i) => (i === null ? i : (i + by + items.length) % items.length)),
    [items.length],
  )

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }
    const onClose = () => setIndex(null)
    el.addEventListener('keydown', onKey)
    el.addEventListener('close', onClose)
    return () => {
      el.removeEventListener('keydown', onKey)
      el.removeEventListener('close', onClose)
    }
  }, [step])

  const current = index === null ? null : items[index]

  return (
    <>
      <ul
        aria-label={label}
        className="kh-rail -mx-[var(--gutter)] flex gap-3 overflow-x-auto px-[var(--gutter)] pb-2 md:mx-0 md:block md:columns-2 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:columns-3"
      >
        {items.map((item, i) => (
          <li
            key={item.src ?? i}
            className="w-[78vw] max-w-[22rem] shrink-0 md:mb-5 md:w-auto md:max-w-none md:break-inside-avoid"
          >
            <button
              type="button"
              onClick={() => open(i)}
              className="group block w-full text-left"
              aria-label={`${item.caption} — open larger`}
            >
              <div
                className="kh-photo kh-photo-reveal aspect-[4/5] md:aspect-(--ar)"
                style={{ '--ar': `${item.width} / ${item.height}` } as CSSProperties}
              >
                <Image
                  src={item.src as string}
                  alt={item.alt ?? ''}
                  width={item.width as number}
                  height={item.height as number}
                  sizes="(min-width: 1024px) 30vw, (min-width: 768px) 46vw, 78vw"
                  className="absolute inset-0 size-full object-cover"
                />
              </div>
              <p className="annotation mt-3.5 flex items-center gap-3 text-paper-faint transition-colors duration-300 group-hover:text-paper">
                <span className="text-gold tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span className="h-px w-5 bg-gold-deep" aria-hidden="true" />
                <span className="truncate">{item.caption}</span>
              </p>
            </button>
          </li>
        ))}
      </ul>

      <p className="annotation mt-5 text-paper-faint md:hidden" aria-hidden="true">
        Swipe for more <span className="text-gold">→</span>
      </p>

      <dialog
        ref={dialog}
        className="kh-lightbox"
        aria-label={current ? current.caption : label}
        onClick={(event) => {
          // A click on the backdrop itself, not on the picture or a control.
          if (event.target === event.currentTarget) close()
        }}
      >
        {current ? (
          <div className="flex h-full flex-col" onClick={(e) => e.target === e.currentTarget && close()}>
            <div className="shell flex items-center justify-between gap-4 py-4">
              <p className="annotation text-paper-dim">
                <span className="text-gold tabular-nums">
                  {String((index ?? 0) + 1).padStart(2, '0')}
                </span>{' '}
                / {String(items.length).padStart(2, '0')}
              </p>
              <button type="button" onClick={close} autoFocus className="kh-btn-ghost min-h-11 px-4">
                Close
              </button>
            </div>

            <div
              className="relative mx-auto w-full grow px-4 md:px-20"
              onClick={(e) => e.target === e.currentTarget && close()}
            >
              <div className="kh-lightbox-img relative size-full">
                <Image
                  key={current.src}
                  src={current.src as string}
                  alt={current.alt ?? ''}
                  fill
                  sizes="100vw"
                  className="object-contain"
                />
              </div>

              {/* Beside the photograph from a tablet up; on a phone they sit
                  under it, where a thumb reaches and nothing is covered. */}
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photograph"
                className="kh-btn-ghost absolute top-1/2 left-5 hidden min-h-12 -translate-y-1/2 px-3 md:inline-flex"
              >
                <ArrowIcon className="size-5 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photograph"
                className="kh-btn-ghost absolute top-1/2 right-5 hidden min-h-12 -translate-y-1/2 px-3 md:inline-flex"
              >
                <ArrowIcon className="size-5" />
              </button>
            </div>

            <div className="shell flex items-center justify-between gap-4 py-5">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous photograph"
                className="kh-btn-ghost min-h-12 px-3 md:hidden"
              >
                <ArrowIcon className="size-5 rotate-180" />
              </button>
              <p className="grow text-center text-paper-dim">{current.caption}</p>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next photograph"
                className="kh-btn-ghost min-h-12 px-3 md:hidden"
              >
                <ArrowIcon className="size-5" />
              </button>
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  )
}
