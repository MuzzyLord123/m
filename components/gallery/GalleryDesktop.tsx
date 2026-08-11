'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react/dist/ssr'
import type { Job } from '@/content/gallery'
import { PhotoSlot } from '../PhotoSlot'

/**
 * Desktop gallery: a 12-column grid of deliberately mismatched cells. Hovering
 * a finished job slides a caption strip up over the bottom of the image;
 * clicking opens it in a native <dialog>.
 *
 * No lightbox library. <dialog showModal> gives focus trapping, Escape to
 * close and focus restoration for free; the only thing added by hand is
 * closing on a backdrop click.
 *
 * Cells with no photograph yet are plain blocks — there is nothing to open.
 */

/**
 * Mismatched on purpose: no row of three equal cards anywhere.
 *
 * Widths and heights are set in grid tracks rather than aspect ratios, so the
 * cells interlock instead of leaving a hole at the end of each row. Dense flow
 * backfills anything the pattern leaves behind, which means the layout still
 * holds together whether there are four jobs on here or fourteen.
 */
const cells = [
  'col-span-7 row-span-3',
  'col-span-5 row-span-5',
  'col-span-4 row-span-5',
  'col-span-3 row-span-5',
  'col-span-5 row-span-3',
  'col-span-12 row-span-3',
]

export function GalleryDesktop({ jobs }: { jobs: Job[] }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [open, setOpen] = useState<Job | null>(null)

  const close = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <>
      <ul className="hidden auto-rows-[92px] grid-flow-row-dense grid-cols-12 gap-4 md:grid">
        {jobs.map((job, i) => {
          const cell = cells[i % cells.length]
          const ready = job.photo.src !== null

          return (
            <li key={job.id} className={cell}>
              {ready ? (
                <button
                  type="button"
                  onClick={() => setOpen(job)}
                  className="group relative block h-full w-full overflow-hidden text-left"
                >
                  <PhotoSlot
                    photo={job.photo}
                    swatch={job.swatch}
                    className="h-full w-full"
                    sizes="(min-width: 1240px) 40vw, 50vw"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full bg-ink/92 px-4 py-3 text-chalk transition-transform duration-300 ease-[var(--ease-bleed)] group-hover:translate-y-0 group-focus-visible:translate-y-0">
                    <span className="block font-body text-[0.95rem] font-semibold">
                      {job.caption}
                    </span>
                    <span className="mt-0.5 block font-body text-[0.82rem] text-chalk/80">
                      {[job.place, job.finish].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
              ) : (
                <PhotoSlot
                  photo={job.photo}
                  swatch={job.swatch}
                  className="h-full w-full"
                  sizes="(min-width: 1240px) 40vw, 50vw"
                />
              )}
            </li>
          )
        })}
      </ul>

      <dialog
        ref={dialogRef}
        className="job-dialog"
        aria-label={open?.caption ?? 'Job photograph'}
        onClose={() => setOpen(null)}
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        {open ? (
          <div className="flex max-h-[100dvh] w-[min(94vw,1100px)] flex-col">
            <div className="flex items-start justify-between gap-6 bg-ink px-5 py-4">
              <div>
                <p className="font-body text-[1rem] font-semibold text-chalk">{open.caption}</p>
                <p className="mt-0.5 font-body text-[0.85rem] text-chalk/80">
                  {[open.place, open.finish].filter(Boolean).join(' · ')}
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                className="shrink-0 bg-orange-deep p-2.5 text-chalk"
                aria-label="Close"
              >
                <X size={20} weight="regular" strokeWidth={1.5} aria-hidden />
              </button>
            </div>
            <PhotoSlot
              photo={open.photo}
              swatch={open.swatch}
              className="max-h-[78dvh] w-full"
              sizes="94vw"
            />
          </div>
        ) : null}
      </dialog>
    </>
  )
}
