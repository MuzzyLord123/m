import type { Job } from '@/content/gallery'
import { PhotoSlot } from '../PhotoSlot'

/**
 * Mobile gallery: a full-width snap carousel, one job per viewport, caption
 * underneath. Native momentum scrolling, no arrows, no JavaScript.
 *
 * Not a shrunken version of the desktop grid — a different build for a
 * different thumb.
 */
export function GalleryMobile({ jobs }: { jobs: Job[] }) {
  return (
    <ul
      className="snap-rail -mx-5 flex gap-3 overflow-x-auto px-5 pb-1 md:hidden"
      aria-label="Recent jobs, scroll sideways"
      tabIndex={0}
    >
      {jobs.map((job) => (
        <li key={job.id} className="w-[84vw] shrink-0">
          <PhotoSlot
            photo={job.photo}
            swatch={job.swatch}
            className="aspect-[4/3] w-full"
            sizes="84vw"
          />
          {job.caption ? (
            <div className="pt-3">
              <p className="font-body text-[0.95rem] font-semibold text-ink">{job.caption}</p>
              <p className="mt-0.5 font-body text-[0.85rem] text-ink-soft">
                {[job.place, job.finish].filter(Boolean).join(' · ')}
              </p>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
