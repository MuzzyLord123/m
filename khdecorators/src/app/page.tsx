import type { Metadata } from 'next'
import Link from 'next/link'
import { Annotated } from '@/components/Annotated'
import { CallLink, EmailLink } from '@/components/CallLink'
import { Drawn } from '@/components/Drawn'
import { EnquiryForm } from '@/components/EnquiryForm'
import { GridRules } from '@/components/GridRules'
import { Needed } from '@/components/Needed'
import { ReviewList, ReviewsPending } from '@/components/Reviews'
import { Section } from '@/components/Section'
import { PageShell } from '@/components/Shell'
import { Spec } from '@/components/Spec'
import { fill, pageMetadata } from '@/lib/metadata'
import { areas } from '@content/areas'
import { home } from '@content/home'
import { processSteps } from '@content/process'
import { homeReviews } from '@content/reviews'
import { serviceRows } from '@content/services'
import { email, homeSections, phone, region, town } from '@content/site'
import { isPlaceholder } from '@content/types'

export const metadata: Metadata = pageMetadata({
  // The old title was "Home". This one names the trade and the town, because those
  // are the words somebody reads in a search result before deciding to click.
  title: 'Painters & decorators in {town} | KH Painting and Decorating',
  description:
    'Painter, decorator and spray finisher in {town} and across the north west. UPVC, garage doors, render and kitchen doors sprayed. Dustless sanding, so you can stay in the house. Ring Kenny on 07538 869832.',
  path: '/',
})

export default function HomePage() {
  const reviews = homeReviews()

  return (
    <PageShell rail={homeSections}>
      {/* ============================================================ *
          Hero
          ============================================================ */}
      <Drawn className="relative border-b border-rule py-14 md:py-20">
        <GridRules />

        {/*
          Title block, then a full-width figure beneath it. The figure runs the whole
          measure rather than sitting in a side column because the annotated callouts
          need a gutter on each side to live in — see the container-query note in
          Annotated.tsx. It also puts the primary CTA above the fold on a laptop,
          which on paid traffic is the point of the page.
        */}
        <div className="relative lg:grid lg:grid-cols-12 lg:gap-x-6">
          <div className="lg:col-span-8">
            <h1 className="display">{fill(home.hero.h1)}</h1>
            <p className="measure mt-8 text-lg leading-relaxed">{fill(home.hero.lede)}</p>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
              <Link href="#quote" className="kh-btn">
                {home.hero.ctaPrimary}
              </Link>
              <CallLink className="kh-btn-ghost" from="hero">
                {home.hero.ctaSecondary} — {phone.label}
              </CallLink>
            </div>
          </div>

          {/* `content-start`, or the grid row stretches to match the h1 block's height
              and spreads three one-line facts over 300px. */}
          <ul className="mt-10 grid content-start gap-x-8 gap-y-2 sm:grid-cols-3 lg:col-span-4 lg:mt-0 lg:grid-cols-1 lg:gap-y-3">
            {home.hero.facts.map((fact) => (
              <li key={fact} className="annotation border-t border-rule pt-3 leading-relaxed">
                {fact}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-14">
          <Annotated
            photo={home.hero.photo}
            callouts={home.hero.callouts}
            sizes="(min-width: 1280px) 1100px, 100vw"
            priority
            ratio="16 / 7"
          />
        </div>
      </Drawn>

      {/* ============================================================ *
          01 — What I do and where
          ============================================================ */}
      <Section number="01" id="what" title={fill(home.what.heading)} flush>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-6">
          <div className="space-y-5 lg:col-span-7">
            {home.what.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="measure">
                {fill(paragraph)}
              </p>
            ))}
          </div>
          <div className="lg:col-span-5">
            <Spec rows={home.what.spec.map((r) => ({ ...r, value: fill(r.value) }))} />
          </div>
        </div>
      </Section>

      {/* ============================================================ *
          02 — The two differentiators. Spraying first.
          ============================================================ */}
      <Section
        number="02"
        id="specialist"
        title={home.specialist.heading}
        standfirst={home.specialist.standfirst}
        grid={false}
      >
        <div className="space-y-16 md:space-y-24">
          {home.specialist.items.map((item) => (
            <article key={item.number} className="grid gap-8 lg:grid-cols-12 lg:gap-x-6">
              <div className="lg:col-span-5">
                <div className="annotation-lg text-gold">{item.number}</div>
                <h3 className="display-sm mt-3">{item.name}</h3>
                <div className="mt-5 space-y-4">
                  {item.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="measure">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <p className="mt-6">
                  <Link href={item.href} className="link link-hover-target annotation-lg text-gold">
                    {item.linkLabel} <span aria-hidden="true">→</span>
                  </Link>
                </p>
              </div>

              <div className="lg:col-span-7">
                <Annotated
                  photo={item.photo}
                  callouts={item.callouts}
                  sizes="(min-width: 1024px) 52vw, 100vw"
                  ratio="4 / 3"
                />
              </div>
            </article>
          ))}
        </div>
      </Section>

      {/* ============================================================ *
          03 — Everything I do, as a table
          ============================================================ */}
      <Section
        number="03"
        id="services"
        title={home.services.heading}
        standfirst={home.services.standfirst}
      >
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-edge">
              <th scope="col" className="annotation py-3 pr-4">
                Service
              </th>
              <th scope="col" className="annotation hidden py-3 pr-4 sm:table-cell">
                What it covers
              </th>
              <th scope="col" className="annotation py-3">
                Application
              </th>
            </tr>
          </thead>
          <tbody>
            {serviceRows.map((row) => (
              <tr key={row.name} className="border-b border-rule">
                <th scope="row" className="w-[36%] py-4 pr-4 align-top font-normal">
                  <Link href={row.href} className="link link-hover-target">
                    {row.name}
                  </Link>
                  <span className="mt-2 block text-sm text-paper-dim sm:hidden">{row.summary}</span>
                </th>
                <td className="hidden py-4 pr-4 align-top text-paper-dim sm:table-cell">
                  {row.summary}
                </td>
                <td className="annotation w-[24%] py-4 align-top">{row.application}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ============================================================ *
          04 — How a job runs
          ============================================================ */}
      <Section
        number="04"
        id="process"
        title={home.process.heading}
        standfirst={home.process.standfirst}
      >
        <ol className="border-t border-rule">
          {processSteps.map((step) => (
            <li
              key={step.number}
              className="grid gap-x-6 gap-y-2 border-b border-rule py-6 md:grid-cols-12"
            >
              <div className="annotation md:col-span-1">{step.number}</div>
              <h3 className="display-xs md:col-span-3">{step.title}</h3>
              <p className="text-paper-dim md:col-span-5">{step.body}</p>
              {/* 3 columns, not 2: tracked uppercase needs the room, and at 2 the
                  longest note wrapped to three lines against the page edge. */}
              <p className="annotation md:col-span-3 md:text-right">{step.note}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ============================================================ *
          05 — Reviews
          ============================================================ */}
      <Section
        number="05"
        id="reviews"
        title={home.reviews.heading}
        standfirst={home.reviews.standfirst}
      >
        {reviews.length > 0 ? (
          <>
            <ReviewList reviews={reviews} />
            <p className="mt-8">
              <Link href="/reviews" className="link link-hover-target annotation-lg text-gold">
                {home.reviews.allLabel} <span aria-hidden="true">→</span>
              </Link>
            </p>
          </>
        ) : (
          <ReviewsPending />
        )}
      </Section>

      {/* ============================================================ *
          06 — Where I work
          ============================================================ */}
      <Section number="06" id="areas" title={home.areas.heading}>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-6">
          <div className="space-y-5 lg:col-span-7">
            {areas.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="measure">
                {fill(paragraph)}
              </p>
            ))}
          </div>

          <div className="lg:col-span-5">
            {areas.towns.length > 0 ? (
              <>
                <ul className="grid grid-cols-2 gap-x-6 border-t border-rule">
                  {areas.towns.map((place) => (
                    <li key={place} className="border-b border-rule py-3">
                      {place}
                    </li>
                  ))}
                </ul>
                <p className="annotation mt-4 leading-relaxed">{areas.note}</p>
              </>
            ) : (
              <Needed token="areas.towns" inline={false} />
            )}
          </div>
        </div>
      </Section>

      {/* ============================================================ *
          07 — Request a quote
          ============================================================ */}
      <Section number="07" id="quote" title={home.quote.heading} standfirst={home.quote.standfirst}>
        <EnquiryForm from="home" />
      </Section>

      {/* ============================================================ *
          08 — Contact
          ============================================================ */}
      <Section
        number="08"
        id="contact"
        title={home.contact.heading}
        standfirst={home.contact.standfirst}
      >
        <dl className="grid grid-cols-1 gap-x-6 border-t border-rule sm:grid-cols-3">
          <div className="border-b border-rule py-5 sm:border-b-0">
            <dt className="annotation">Phone</dt>
            <dd className="mt-2">
              <CallLink
                className="display-xs text-gold underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-gold-lift hover:decoration-2"
                from="home-contact"
              />
            </dd>
          </div>
          <div className="border-b border-rule py-5 sm:border-b-0">
            <dt className="annotation">Email</dt>
            <dd className="mt-2">
              <EmailLink className="link link-hover-target" from="home-contact">
                {email}
              </EmailLink>
            </dd>
          </div>
          <div className="py-5">
            <dt className="annotation">Area</dt>
            <dd className="mt-2">
              {isPlaceholder(town) ? (
                <>
                  <Needed token="{{TOWN}}" /> and {region}
                </>
              ) : (
                <>
                  {town} and {region}
                </>
              )}
            </dd>
          </div>
        </dl>
      </Section>
    </PageShell>
  )
}
