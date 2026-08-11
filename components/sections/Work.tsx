import dynamic from 'next/dynamic'
import { galleryCopy, jobs } from '@/content/gallery'
import { swatchHex } from '@/lib/swatches'
import { Tape } from '../Tape'
import { RollerReveal } from '../RollerReveal'
import { GalleryDesktop } from '../gallery/GalleryDesktop'
import { GalleryMobile } from '../gallery/GalleryMobile'

/**
 * The draggable divider is the one component that pulls in the animation
 * library. It is below the fold, so its chunk loads after hydration rather
 * than competing with the fonts for bandwidth on first paint. It still renders
 * on the server, so it is there with JavaScript switched off — just not
 * draggable.
 */
const BeforeAfter = dynamic(() =>
  import('../gallery/BeforeAfter').then((m) => m.BeforeAfter),
)

/**
 * Recent work. Tape label 3 of 4.
 *
 * The first job with a before-and-after pair gets the draggable comparison at
 * full width; the rest fall into the grid (desktop) or the carousel (mobile).
 */
export function Work() {
  const pair = jobs.find((j) => j.beforeAfter !== null)

  return (
    <section id="work" aria-labelledby="work-heading" className="bg-paper">
      <div className="mx-auto w-full max-w-[1240px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid grid-cols-12 gap-x-8 gap-y-6">
          <div className="col-span-12 md:col-span-6 md:col-start-1">
            <Tape>{galleryCopy.eyebrow}</Tape>
            <h2 id="work-heading" className="mt-6 text-[clamp(1.9rem,4.4vw,3.1rem)] text-ink">
              {galleryCopy.heading}
            </h2>
          </div>
          <div className="col-span-12 self-end md:col-span-5 md:col-start-8">
            <p className="max-w-[46ch] font-body text-ink-soft">{galleryCopy.body}</p>
            {jobs.every((j) => j.photo.src === null) ? (
              <p className="mt-4 max-w-[46ch] border-l-4 border-orange pl-4 font-body text-[0.95rem] text-ink">
                {galleryCopy.awaitingNote}
              </p>
            ) : null}
          </div>
        </div>

        {pair?.beforeAfter ? (
          <div className="mt-12">
            <RollerReveal colour={swatchHex[pair.swatch]}>
              <BeforeAfter
                before={pair.beforeAfter.before}
                after={pair.beforeAfter.after}
                swatch={pair.swatch}
                label="Before and after"
                className="aspect-[16/10] w-full md:aspect-[21/9]"
              />
            </RollerReveal>
            <p className="mt-3 font-body text-[0.85rem] text-ink-soft">
              Drag the handle, or use the arrow keys, to see the same wall before and after.
            </p>
          </div>
        ) : null}

        <div className="mt-10 md:mt-14">
          <GalleryDesktop jobs={jobs} />
          <GalleryMobile jobs={jobs} />
        </div>
      </div>
    </section>
  )
}
