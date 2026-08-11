import { areasCopy, confirmedAreas, suggestedAreas } from '@/content/areas'
import { reviewMode } from '@/lib/env'
import { AreaSketch } from '../AreaSketch'
import { SectionHead } from '../SectionHead'
import { CallLink } from '../CallLink'

/**
 * Where he works.
 *
 * Only places the client has actually confirmed are published. The suggested
 * villages sit in a separate block that appears in review mode alone, so he can
 * read down it on his phone and tell us which ones he covers. Nothing gets
 * published on his behalf.
 *
 * There are no per-village pages. Ten near-identical pages with the town name
 * swapped is a doorway-page pattern and it is not worth the risk; if location
 * pages are wanted later they get separate, genuinely different content.
 */
export function Areas() {
  const unconfirmed = suggestedAreas.filter((a) => !a.confirmed)

  return (
    <section id="areas" aria-labelledby="areas-heading" className="bg-chalk">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-x-8 gap-y-10 px-5 py-16 md:px-8 md:py-24">
        <div className="col-span-12 md:col-span-6 md:col-start-1">
          <SectionHead
            eyebrow={areasCopy.eyebrow}
            heading={<span id="areas-heading">{areasCopy.heading}</span>}
            intro={<p>{areasCopy.body}</p>}
          />

          <ul className="mt-8 flex flex-wrap gap-2.5">
            {confirmedAreas.map((a) => (
              <li
                key={a.name}
                className="border-2 border-ink px-3.5 py-1.5 font-body text-[0.95rem] font-semibold text-ink"
              >
                {a.name}
              </li>
            ))}
            {suggestedAreas
              .filter((a) => a.confirmed)
              .map((a) => (
                <li
                  key={a.name}
                  className="border-2 border-ink/30 px-3.5 py-1.5 font-body text-[0.95rem] text-ink"
                >
                  {a.name}
                </li>
              ))}
          </ul>

          <div className="mt-9">
            <CallLink variant="block" />
          </div>
        </div>

        <div className="col-span-12 md:col-span-5 md:col-start-8">
          <AreaSketch className="w-full max-w-[460px]" />
        </div>

        {reviewMode && unconfirmed.length > 0 ? (
          <aside className="col-span-12 border-4 border-dashed border-orange-ink p-5 md:col-span-10 md:col-start-1">
            <p className="font-body text-[0.72rem] font-semibold tracking-[0.2em] text-orange-ink uppercase">
              Not published — waiting on you
            </p>
            <p className="mt-3 max-w-[62ch] font-body text-[0.95rem] text-ink">
              These are suggestions, not facts. Tell me which of them you actually cover and they
              go on the site. Anything you do not confirm stays off it.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {unconfirmed.map((a) => (
                <li
                  key={a.name}
                  className="border border-ink/40 px-3 py-1 font-body text-[0.9rem] text-ink-soft"
                >
                  {a.name}
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </section>
  )
}
