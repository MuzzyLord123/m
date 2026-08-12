import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { homeCopy } from '@/content/pages'
import { confirmedAreas, suggestedAreas } from '@/content/areas'
import { AreaSketch } from '../AreaSketch'
import { CallLink } from '../CallLink'

/**
 * How the home page finishes: where he works, and the phone number again.
 *
 * The full "where I work" section, with the confirm list and the radius
 * sketch, lives on /contact — this is the short version with a way through
 * to it.
 */
export function HomeClose() {
  const areas = [...confirmedAreas, ...suggestedAreas.filter((a) => a.confirmed)]

  return (
    <section aria-labelledby="home-close" className="bg-green text-chalk">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-12 items-center gap-x-8 gap-y-10 px-5 py-16 md:px-8 md:py-24">
        <div className="col-span-12 md:col-span-6">
          <p className="flex items-center gap-3 font-body text-[0.72rem] font-semibold tracking-[0.2em] text-chalk/85 uppercase">
            <span aria-hidden className="inline-block h-[7px] w-9 shrink-0 bg-chalk" />
            {homeCopy.closeEyebrow}
          </p>

          <h2 id="home-close" className="mt-4 text-[clamp(1.8rem,4vw,2.8rem)] text-chalk">
            {homeCopy.closeHeading}
          </h2>

          <p className="mt-5 max-w-[46ch] font-body text-chalk/90">{homeCopy.closeBody}</p>

          <ul className="mt-7 flex flex-wrap gap-2.5">
            {areas.map((a) => (
              <li
                key={a.name}
                className="border-2 border-chalk px-3.5 py-1.5 font-body text-[0.92rem] font-semibold text-chalk"
              >
                {a.name}
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <CallLink variant="slab" />
          </div>

          <Link
            href="/contact"
            className="stroke-link mt-7 inline-flex items-center gap-2 font-body font-semibold text-chalk"
            style={{ backgroundImage: 'linear-gradient(#FFFDF8, #FFFDF8)' }}
          >
            {homeCopy.closeLink}
            <ArrowRight size={17} weight="regular" strokeWidth={1.5} aria-hidden />
          </Link>
        </div>

        <div className="col-span-12 md:col-span-5 md:col-start-8">
          <AreaSketch tone="chalk" className="w-full max-w-[420px]" />
        </div>
      </div>
    </section>
  )
}
