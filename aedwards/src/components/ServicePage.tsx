import type { ReactNode } from 'react'
import Link from 'next/link'
import { PALETTE_ORDER, type FieldColour } from '@content/fields'
import { otherServices, paletteFor, type Service } from '@content/services'
import { reviewsForService, sourceLabel, yellRating } from '@content/reviews'
import { business, phone } from '@content/site'
import { Field } from './Field'
import { Ground } from './Ground'
import { Rating } from './Rating'
import { Reveal } from './Reveal'
import { RevealAtLoad } from './RevealAtLoad'
import { ReviewBlock } from './ReviewBlock'
import { ServiceStructuredData } from './ServiceStructuredData'

/**
 * One service page, built from content/services.ts.
 *
 * Same field system as the home page, so a service page is not a different
 * kind of page — it is the same page about a narrower thing. Each one starts
 * at a different point in the palette, so five pages generated from one
 * component still open on five different colours.
 *
 * The shape is deliberately proof-led rather than pitch-led: what the job is,
 * what it covers, the part people underestimate, then the reviews that are
 * actually about that work. Where there are none, the page says so and sends
 * you to the archive — it does not reach for a review that was about a
 * different job, which is the whole reason reviews carry service tags derived
 * from what they evidence rather than from their wording.
 */

type Section = { label?: string; tall?: boolean; node: ReactNode }

export function ServicePage({ service }: { service: Service }) {
  const proof = reviewsForService(service.slug)
  const others = otherServices(service.slug)

  const sections: Section[] = [
    /* 1 ─────────────────────────────────────────────────────── the job ─── */
    {
      label: service.label,
      node: (
        <>
          <RevealAtLoad>
            <h1 className="t-display max-w-[15ch]">{service.headline}</h1>
          </RevealAtLoad>
          <p className="t-line mt-[clamp(1.5rem,4vh,2.5rem)] max-w-[26ch]">{service.lead}</p>
          <a
            href={phone.href}
            className="t-phone tap mt-[clamp(2rem,6vh,3.5rem)] tabular-nums"
          >
            {phone.display}
          </a>
          <p className="mono-sm mt-4">
            {business.knownAs} Edwards · {business.town}, {business.county}
          </p>
        </>
      ),
    },

    /* 2 ───────────────────────────────────────────────────── the scope ─── */
    {
      label: 'What it covers',
      node: (
        <Reveal>
          <ul className="t-list flex flex-col gap-[0.35em]">
            {service.involves.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Reveal>
      ),
    },

    /* 3 ──────────────────────────────────────────────────── the detail ─── */
    {
      label: 'Worth knowing',
      node: (
        <>
          <Reveal>
            <h2 className="t-display max-w-[15ch]">{service.detail.headline}</h2>
          </Reveal>
          <div className="mt-[clamp(2rem,5vh,3rem)] flex flex-col gap-5">
            {service.detail.body.map((paragraph) => (
              <p key={paragraph} className="mono max-w-[46ch]">
                {paragraph}
              </p>
            ))}
          </div>
        </>
      ),
    },

    /* 4 ───────────────────────────────────────────────────── the proof ─── */
    ...(proof.length > 0
      ? proof.map(
          (review): Section => ({
            label: `Review · ${sourceLabel[review.source]}`,
            node: <ReviewBlock review={review} />,
          }),
        )
      : [
          {
            label: 'The reviews',
            node: (
              <>
                <Reveal>
                  <h2 className="t-display max-w-[15ch]">
                    Nobody has reviewed this job by name yet.
                  </h2>
                </Reveal>
                <p className="mono mt-8 max-w-[46ch]">
                  There are {yellRating.count} ratings across all of the work, and none of
                  them names this one specifically. Rather than borrow one that was about
                  something else, here is the lot.
                </p>
                <Rating className="mt-[clamp(2rem,5vh,3rem)]" />
                <Link
                  href="/reviews"
                  className="mono-label tap mt-[clamp(2rem,5vh,3rem)] gap-3 underline underline-offset-[6px]"
                >
                  Read all the reviews
                  <span aria-hidden="true">→</span>
                </Link>
              </>
            ),
          } satisfies Section,
        ]),

    /* 5 ──────────────────────────────────────────────────── call Andy ─── */
    {
      label: 'Get in touch',
      // Taller than a short phone screen once the other four services are on
      // it, and mandatory snap across an over-tall field strands the bottom.
      tall: true,
      node: (
        <>
          <Reveal>
            <h2 className="t-display">Call {business.knownAs}.</h2>
          </Reveal>
          <a
            href={phone.href}
            className="t-phone-max tap mt-[clamp(1.5rem,4vh,2.5rem)] tabular-nums"
          >
            {phone.display}
          </a>
          <p className="mono mt-6 max-w-[40ch]">
            Ring or text. If I am up a ladder I will call you back.
          </p>

          <p className="mono-label mt-[clamp(2.5rem,7vh,4rem)]">The rest of the work</p>
          <ul className="mt-4 flex flex-col">
            {others.map((other) => (
              <li key={other.slug}>
                <Link
                  href={`/${other.slug}`}
                  className="mono tap gap-3 underline-offset-[6px] hover:underline focus-visible:underline"
                >
                  {other.name}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ),
    },
  ]

  const palette: FieldColour[] = paletteFor(service, sections.length)

  return (
    <>
      <Ground colour={palette[0] ?? PALETTE_ORDER[0]} />
      <ServiceStructuredData service={service} />
      {sections.map((section, i) => (
        <Field
          key={i}
          colour={palette[i]}
          next={palette[i + 1] ?? null}
          label={section.label}
          tall={section.tall}
        >
          {section.node}
        </Field>
      ))}
    </>
  )
}
