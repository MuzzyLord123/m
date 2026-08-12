import Link from 'next/link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { services } from '@/content/services'
import { homeCopy } from '@/content/pages'
import { swatchHex } from '@/lib/swatches'
import { SectionHead } from '../SectionHead'

/**
 * The four services on the home page, as a list rather than a grid of cards.
 *
 * The one-liner under each is the first sentence of that service's description
 * in /content/services.ts, so it cannot drift out of step with the page it
 * links to — change the copy in one place and both read the same.
 */
export function ServicesSummary() {
  return (
    <section aria-labelledby="home-services" className="bg-paper">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-x-8 px-5 py-16 md:px-8 md:py-24">
        <SectionHead
          eyebrow={homeCopy.servicesEyebrow}
          heading={<span id="home-services">{homeCopy.servicesHeading}</span>}
          className="col-span-12 md:col-span-6"
        />

        <ol className="col-span-12 mt-10 md:col-span-10 md:col-start-3 md:mt-14">
          {services.map((service, i) => {
            const firstSentence = `${service.body.split('. ')[0]}.`
            return (
              <li key={service.id} className="border-t-2 border-ink/15 first:border-t-0">
                <Link
                  href={`/what-i-do#${service.id}`}
                  className="group flex items-stretch gap-5 py-6"
                >
                  <span
                    aria-hidden
                    className="w-2.5 shrink-0 transition-[width] duration-200 group-hover:w-4"
                    style={{ backgroundColor: swatchHex[service.swatch] }}
                  />
                  <span className="grow">
                    <span className="u-display block text-[clamp(1.25rem,2.4vw,1.6rem)] text-ink">
                      {service.title}
                    </span>
                    <span className="mt-1.5 block max-w-[58ch] font-body text-[0.93rem] text-ink-soft">
                      {firstSentence}
                    </span>
                  </span>
                  <span
                    aria-hidden
                    className="self-center font-body text-[0.72rem] font-semibold tracking-[0.18em] text-ink-soft"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>

        <div className="col-span-12 mt-8 md:col-span-10 md:col-start-3">
          <Link
            href="/what-i-do"
            className="stroke-link inline-flex items-center gap-2 font-body font-semibold text-ink"
          >
            {homeCopy.servicesLink}
            <ArrowRight size={17} weight="regular" strokeWidth={1.5} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
