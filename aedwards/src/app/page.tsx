import type { ReactNode } from 'react'
import Link from 'next/link'
import { PALETTE, type FieldColour } from '@content/fields'
import { confirmedTowns } from '@content/areas'
import {
  area,
  argument,
  contact,
  exterior,
  interior,
  intro,
  photographs,
  record,
} from '@content/copy'
import { hasPhotos } from '@content/photos'
import {
  reviewById,
  reviewsTranscribed,
  sourceLabel,
  yellRating,
  type Review,
} from '@content/reviews'
import { business, confirmedCredentials, longevity, phone } from '@content/site'
import { DELIVERY_CONFIGURED } from '@/lib/enquiry'
import { EnquiryForm } from '@/components/EnquiryForm'
import { Field } from '@/components/Field'
import { Ground } from '@/components/Ground'
import { Pending } from '@/components/Pending'
import { PhotoStrip } from '@/components/PhotoStrip'
import { Rating } from '@/components/Rating'
import { Reveal } from '@/components/Reveal'
import { RevealAtLoad } from '@/components/RevealAtLoad'
import { ReviewBlock } from '@/components/ReviewBlock'
import { StructuredData } from '@/components/StructuredData'

/**
 * The home page is a sequence of full-viewport colour fields, one idea each,
 * and the page repaints itself as you move down it.
 *
 * Three of the eleven fields are a single review and nothing else. That is the
 * structure, not a decorative choice: this business's whole asset is 34 ratings
 * averaging 4.9 over a decade, and a site where the proof is a testimonial
 * strip near the bottom would be the wrong site. Take the reviews out of this
 * page and there is nothing left standing — which is the test.
 */

function mustReview(id: string): Review {
  const review = reviewById(id)
  if (!review) {
    throw new Error(
      `The home page composes review "${id}", which is not in content/reviews.ts. ` +
        `Either put it back or compose a different one — do not ship an empty field.`,
    )
  }
  return review
}

type Section = {
  colour: FieldColour
  label?: string
  id?: string
  tall?: boolean
  node: ReactNode
}

export default function HomePage() {
  const darren = mustReview('yell-darrenj-427')
  const andM = mustReview('yell-andm-6')
  const lightning = mustReview('yell-lightning')

  const allTranscribed = reviewsTranscribed >= yellRating.count
  const archiveLink = allTranscribed ? `all ${yellRating.count} reviews` : 'the reviews'

  const sections: Section[] = [
    /* 1 ───────────────────────────────────────────────── deep green ─────── */
    {
      colour: PALETTE.f1,
      label: intro.label,
      node: (
        <>
          {/* Above the fold, so the reveal is CSS on load rather than an
              observer — see RevealAtLoad. This headline is the largest thing on
              the site and it should not be waiting for a bundle. */}
          <RevealAtLoad>
            <h1 className="t-name">{intro.name}</h1>
          </RevealAtLoad>
          <p className="t-line mt-[clamp(1.5rem,4vh,2.5rem)]">{intro.line}</p>
          <Rating className="mt-[clamp(2.5rem,7vh,4rem)]" />
          <a
            href={phone.href}
            className="t-phone tap mt-[clamp(2rem,5vh,3rem)] tabular-nums"
          >
            {phone.display}
          </a>
        </>
      ),
    },

    /* 2 ───────────────────────────────────────────────────── stone ─────── */
    {
      colour: PALETTE.f2,
      label: argument.label,
      node: (
        <>
          <Reveal>
            <p className="t-display max-w-[16ch]">{argument.sentence}</p>
          </Reveal>
          {/* Also the site's index of the service pages — there is no menu, so
              this list is how you get to them. Each row is its own tap target
              with room around it, which is why they are not set as a tight
              list on a phone. */}
          <ul className="mono mt-[clamp(2rem,6vh,3.5rem)] grid max-w-[42rem] gap-x-8 sm:grid-cols-2">
            {argument.services.map((service) => (
              <li key={service.label}>
                <Link
                  href={`/${service.slug}`}
                  className="tap gap-3 underline-offset-[6px] hover:underline focus-visible:underline"
                >
                  {service.label}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ),
    },

    /* 3 ─────────────────────────────────────────────── aubergine ─────── */
    {
      colour: PALETTE.f3,
      label: `Review · ${sourceLabel[darren.source]}`,
      node: <ReviewBlock review={darren} />,
    },

    /* 4 ────────────────────────────────────────── pale duck egg ─────── */
    {
      colour: PALETTE.f4,
      label: interior.label,
      node: (
        <>
          <Reveal>
            <h2 className="t-display">{interior.headline}</h2>
          </Reveal>
          <ul className="mono mt-[clamp(2.5rem,7vh,4rem)] grid max-w-[42rem] gap-x-8 gap-y-1 sm:grid-cols-2">
            {interior.work.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {/* His own description of himself, one plain sentence. No logo, no
              colour names, nothing implying an endorsement. */}
          <p className="mono mt-10">{interior.farrowAndBall}</p>
        </>
      ),
    },

    /* 5 ────────────────────────────────────────────── near black ─────── */
    {
      colour: PALETTE.f5,
      label: `Review · ${sourceLabel[andM.source]}`,
      node: <ReviewBlock review={andM} />,
    },

    /* 6 ───────────────────────────────────────────────────── stone ─────── */
    {
      colour: PALETTE.f2,
      label: exterior.label,
      node: (
        <>
          <Reveal>
            <h2 className="t-display max-w-[14ch]">{exterior.headline}</h2>
          </Reveal>
          <p className="mono mt-8 max-w-[46ch]">{exterior.note}</p>
          <ul className="mono mt-[clamp(2rem,5vh,3rem)] grid max-w-[42rem] gap-x-8 gap-y-1 sm:grid-cols-2">
            {exterior.work.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ),
    },

    /* 7 ─────────────────────────────────────────────── burnt red ─────── */
    {
      colour: PALETTE.f6,
      label: `Review · ${sourceLabel[lightning.source]}`,
      node: <ReviewBlock review={lightning} />,
    },

    /* 8 ───────────────────────────────────────────────── deep green ─────── */
    {
      colour: PALETTE.f1,
      label: record.label,
      id: 'record',
      node: (
        <>
          <Reveal>
            <h2 className="t-display max-w-[14ch]">{record.headline}</h2>
          </Reveal>

          <ul className="mono mt-[clamp(2.5rem,7vh,4rem)]">
            <li>{longevity}</li>
            <li>
              <span className="tabular-nums">{yellRating.breakdown.five}</span> of{' '}
              <span className="tabular-nums">{yellRating.count}</span> ratings at five stars
            </li>
            {/* Only credentials somebody has confirmed are current. An expired
                insurance line on a website is worse than no line. */}
            {confirmedCredentials.map((credential) => (
              <li key={credential.id}>{credential.label}</li>
            ))}
          </ul>

          <Pending id="insurance-cscs" />

          <Link
            href="/reviews"
            className="mono-label tap mt-[clamp(2.5rem,7vh,4rem)] gap-3 underline underline-offset-[6px]"
          >
            {archiveLink}
            <span aria-hidden="true">→</span>
          </Link>
        </>
      ),
    },

    /* 9 ────────────────────────────────────────── pale duck egg ─────── */
    {
      colour: PALETTE.f4,
      label: area.label,
      node: (
        <>
          <Reveal>
            <h2 className="t-display max-w-[14ch]">{area.headline}</h2>
          </Reveal>
          <p className="mono mt-[clamp(2rem,5vh,3rem)]">
            {business.town}, {business.county}. {business.areaStatement}.
          </p>
          {confirmedTowns.length > 0 ? (
            <ul className="mono mt-8 grid max-w-[42rem] gap-x-8 gap-y-1 sm:grid-cols-2">
              {confirmedTowns.map((town) => (
                <li key={town.name}>{town.name}</li>
              ))}
            </ul>
          ) : (
            <p className="mono mt-8 max-w-[46ch]">{area.pendingTownsNote}</p>
          )}
          <Pending id="service-towns" />
        </>
      ),
    },

    /* 10 ──────────────────────────────────────────────────── stone ─────── */
    /* Cut entirely until Andy's originals arrive. The site is designed to
       stand up with no photography at all, so an empty gallery is not a hole
       in it — see content/photos.ts. */
    ...(hasPhotos
      ? [
          {
            colour: PALETTE.f2,
            label: photographs.label,
            node: (
              <>
                <Reveal>
                  <h2 className="t-display">{photographs.headline}</h2>
                </Reveal>
                <div className="mt-[clamp(2.5rem,7vh,4rem)]">
                  <PhotoStrip />
                </div>
              </>
            ),
          } satisfies Section,
        ]
      : []),

    /* 11 ─────────────────────────────────────────────── near black ─────── */
    {
      colour: PALETTE.f5,
      label: contact.label,
      id: 'call',
      // Taller than the viewport once the form is on it. Mandatory snap on a
      // section the screen cannot hold strands whatever is below the fold.
      tall: true,
      node: (
        <>
          <Reveal>
            <h2 className="t-display">{contact.headline}</h2>
          </Reveal>
          <a
            href={phone.href}
            className="t-phone-max tap mt-[clamp(1.5rem,4vh,2.5rem)] tabular-nums"
          >
            {phone.display}
          </a>
          <p className="mono mt-8 max-w-[40ch]">{contact.line}</p>

          <div className="mt-[clamp(3rem,9vh,5rem)]">
            {DELIVERY_CONFIGURED ? (
              <EnquiryForm />
            ) : (
              <>
                {/* No email address on file, so there is nowhere to deliver an
                    enquiry. A form that quietly drops them would be worse than
                    no form — see src/lib/enquiry.ts. The number is already the
                    largest thing on this field; it is not repeated here. */}
                <p className="mono max-w-[40ch]">{contact.form.unconfigured}</p>
                <Pending id="email" />
              </>
            )}
          </div>

          <p className="mono-sm mt-[clamp(3rem,9vh,5rem)]">
            <Link href="/leave-a-review" className="tap underline underline-offset-[6px]">
              Had a job done? Leave a review →
            </Link>
          </p>
        </>
      ),
    },
  ]

  return (
    <>
      <Ground colour={sections[0].colour} />
      <StructuredData />
      {sections.map((section, i) => (
        <Field
          key={`${section.colour.key}-${i}`}
          colour={section.colour}
          next={sections[i + 1]?.colour ?? null}
          label={section.label}
          id={section.id}
          tall={section.tall}
        >
          {section.node}
        </Field>
      ))}
    </>
  )
}
