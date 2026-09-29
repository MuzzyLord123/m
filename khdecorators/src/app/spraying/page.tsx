import type { Metadata } from 'next'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { Band } from '@/components/Band'
import { Hero } from '@/components/Hero'
import { QuoteBand } from '@/components/QuoteBand'
import { SprayServiceBlock } from '@/components/SprayServiceBlock'
import { ArrowIcon } from '@/components/icons'
import { Diptych, Step } from '@/components/kit'
import { pageMetadata } from '@/lib/metadata'
import { pairs } from '@content/photos'
import { sprayHeroPhoto, sprayIntro, sprayProcess, sprayServices } from '@content/spraying'

export const metadata: Metadata = pageMetadata({
  /*
   * The brief gives this title as "UPVC, garage door & exterior spraying | KH
   * Painting and Decorating" but also states, as grounds for rejection, that no
   * title may lack a place. The second rule is the stricter one and the one that
   * matters for the local searches Kenny is bidding on, so the town is in.
   */
  title: 'UPVC, garage door & exterior spraying in {town} | KH Painting and Decorating',
  description:
    'Spray finishing in {town} and across the north west. UPVC windows and doors, garage doors, render, cladding, kitchen doors and furniture. Degreased, keyed, primed, two coats. Ring Kenny on 07538 869832.',
  path: '/spraying',
})

/**
 * The money page.
 *
 * Spraying is the thing Kenny does that the competition round here mostly does
 * not, "UPVC spraying" and "garage door spraying" have real search volume and thin
 * competition, and on the old site it was one line of body text.
 *
 * The question index sits above the fold. Somebody arriving from an ad for "UPVC
 * spraying" sees their own question in the first screen and one tap takes them to
 * the answer. That is the conversion mechanism on this page — not the hero
 * photograph and not the button.
 */
export default function SprayingPage() {
  return (
    <>
      <Hero
        photo={sprayHeroPhoto}
        eyebrow="Spray finishing"
        title="Sprayed finishes on the surfaces a brush cannot do properly"
        gild="Sprayed finishes"
        lede={sprayIntro.lede}
        plaque={'caption' in sprayHeroPhoto ? String(sprayHeroPhoto.caption) : undefined}
        from="spraying-hero"
      >
        {/* Whatever ad brought them, their question is in the first screen and
            one tap takes them to the answer. */}
        <nav aria-label="Questions answered on this page" className="hero-in mt-10" style={{ '--i': 5 } as CSSProperties}>
          <p className="annotation text-gold">Straight to your question</p>
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {sprayServices.map((service, i) => (
              <li key={service.slug}>
                <Link
                  href={`#${service.slug}`}
                  className="group flex items-center gap-4 border border-rule bg-matt/60 px-4 py-3.5 transition-colors duration-300 hover:border-gold-deep hover:bg-satin-hot/80"
                >
                  <span className="numeral gilt text-[1.75rem]" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="grow text-[0.9375rem] font-medium leading-snug">{service.question}</span>
                  <ArrowIcon className="size-4 shrink-0 rotate-90 text-gold transition-transform duration-300 group-hover:translate-y-1" />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Hero>

      {/* Why spraying at all */}
      <Band tone="well" eyebrow="Why spray" title="Why spray rather than brush" gild="spray" divider>
        <div className="grid gap-6 md:grid-cols-3">
          {sprayIntro.body.map((paragraph, i) => (
            <div key={paragraph.slice(0, 24)} className="kh-card p-7">
              <span aria-hidden="true" className="numeral gilt text-[3rem]">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="mt-4 text-paper-dim">{paragraph}</p>
            </div>
          ))}
        </div>
      </Band>

      {/* The proof: masking, and what it buys */}
      <Band
        eyebrow="Before and after"
        title="The masking is the job"
        gild="the job"
        standfirst="Two of mine, photographed mid-job and again at the end. Every window wrapped, the repairs patched in, the ground sheeted — and then the finish that preparation pays for."
      >
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-10">
          {pairs.map((pair) => (
            <Diptych key={pair.title} title={pair.title} before={pair.before} after={pair.after} />
          ))}
        </div>
      </Band>

      {/* The four services */}
      {sprayServices.map((service, i) => (
        <SprayServiceBlock key={service.slug} service={service} index={i} />
      ))}

      {/* How a spray job runs */}
      <Band
        tone="satin"
        eyebrow="How it works"
        title="How a spray job runs"
        gild="spray job"
        standfirst="Six steps, and the long one is the masking rather than the spraying."
        divider
      >
        <ol className="grid gap-x-14 gap-y-10 md:grid-cols-2">
          {sprayProcess.map((step) => (
            <Step key={step.number} number={step.number} title={step.title} body={step.body} />
          ))}
        </ol>
      </Band>

      {/* Quote */}
      <QuoteBand
        from="spraying"
        title="Ask about spraying"
        gild="spraying"
        standfirst="Tell me what it is and roughly where you are. Spraying cannot be quoted off a photograph — I need to see what the existing coating is doing and what needs masking — but I can tell you on the phone whether it is worth me coming out."
      />
    </>
  )
}
