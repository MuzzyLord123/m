import type { Metadata } from 'next'
import Link from 'next/link'
import { Band } from '@/components/Band'
import { CallLink } from '@/components/CallLink'
import { Drawn } from '@/components/Drawn'
import { EnquiryForm } from '@/components/EnquiryForm'
import { SprayServiceBlock } from '@/components/SprayServiceBlock'
import { ArrowIcon, PhoneIcon, SprayGunIcon } from '@/components/icons'
import { Step, WorkPhoto } from '@/components/kit'
import { pageMetadata } from '@/lib/metadata'
import { phone } from '@content/site'
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
      {/* Hero and the question index */}
      <section className="relative">
        <Drawn className="mx-auto max-w-[78rem] px-5 pt-14 pb-16 md:px-8 md:pt-20 md:pb-20">
          <div className="kh-reveal grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="annotation flex items-center gap-2 text-gold">
                <SprayGunIcon className="size-5" />
                Spray finishing
              </p>

              <h1 className="display mt-4">
                Sprayed finishes on the surfaces a brush cannot do properly
              </h1>

              <p className="measure mt-6 text-lg leading-relaxed text-paper-dim">
                {sprayIntro.lede}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <CallLink className="kh-btn gap-2" from="spraying-hero">
                  <PhoneIcon className="size-4" />
                  Ring Kenny — {phone.label}
                </CallLink>
                <Link href="#quote" className="kh-btn-ghost">
                  Get a free quote
                </Link>
              </div>
            </div>

            <WorkPhoto
              photo={sprayHeroPhoto}
              sizes="(min-width: 1024px) 46vw, 100vw"
              priority
              ratio="4 / 3"
            />
          </div>

          {/* Whatever ad brought them, their question is in the first screen. */}
          <nav aria-label="Questions answered on this page" className="kh-reveal mt-14">
            <p className="annotation text-gold">Straight to your question</p>
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {sprayServices.map((service) => (
                <li key={service.slug}>
                  <Link
                    href={`#${service.slug}`}
                    className="kh-card kh-card--link group flex items-center justify-between gap-4 p-5"
                  >
                    <span className="font-medium">{service.question}</span>
                    <ArrowIcon className="size-4 shrink-0 rotate-90 text-gold transition-transform duration-150 group-hover:translate-y-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Drawn>
      </section>

      {/* Why spraying at all */}
      <Band tone="well" eyebrow="Why spray" title="Why spray rather than brush" divider>
        <div className="grid gap-5 md:grid-cols-3">
          {sprayIntro.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="kh-card p-6 text-paper-dim">
              {paragraph}
            </p>
          ))}
        </div>
      </Band>

      {/* The four services */}
      {sprayServices.map((service, i) => (
        <SprayServiceBlock key={service.slug} service={service} index={i} />
      ))}

      {/* How a spray job runs */}
      <Band
        eyebrow="How it works"
        title="How a spray job runs"
        standfirst="Six steps, and the long one is the masking rather than the spraying."
        divider
      >
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {sprayProcess.map((step) => (
            <Step key={step.number} number={step.number} title={step.title} body={step.body} />
          ))}
        </ol>
      </Band>

      {/* Quote */}
      <Band
        id="quote"
        tone="well"
        eyebrow="Free quote"
        title="Ask about spraying"
        standfirst="Tell me what it is and roughly where you are. Spraying cannot be quoted off a photograph — I need to see what the existing coating is doing and what needs masking — but I can tell you on the phone whether it is worth me coming out."
        divider
      >
        <div className="max-w-[42rem]">
          <EnquiryForm from="spraying" />
        </div>
      </Band>
    </>
  )
}
