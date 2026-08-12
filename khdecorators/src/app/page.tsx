import type { Metadata } from 'next'
import Link from 'next/link'
import { Band } from '@/components/Band'
import { CallLink, EmailLink } from '@/components/CallLink'
import { Drawn } from '@/components/Drawn'
import { EnquiryForm } from '@/components/EnquiryForm'
import { Needed } from '@/components/Needed'
import { ReviewList, ReviewsPending } from '@/components/Reviews'
import { ArrowIcon, BrushDivider, PhoneIcon, SERVICE_ICONS, TickIcon } from '@/components/icons'
import { ServiceCard, Step, TickList, TrustCard, WorkPhoto } from '@/components/kit'
import { fill, pageMetadata } from '@/lib/metadata'
import { areas } from '@content/areas'
import { home } from '@content/home'
import { processSteps } from '@content/process'
import { homeReviews } from '@content/reviews'
import { serviceRows } from '@content/services'
import { email, phone, region, town } from '@content/site'
import { isPlaceholder } from '@content/types'

export const metadata: Metadata = pageMetadata({
  // The old site's title was "Home". This one names the trade and the town,
  // because those are the words somebody reads in a search result.
  title: 'Painters & decorators in {town} | KH Painting and Decorating',
  description:
    'Painter, decorator and spray finisher in {town} and across the north west. UPVC, garage doors, render and kitchen doors sprayed. Dustless sanding, so you can stay in the house. Ring Kenny on 07538 869832.',
  path: '/',
})

/**
 * The home page, in the shape a painter and decorator's website actually takes:
 * hero, reasons to trust him, services as cards, the two things he does that the
 * competition does not, recent work, how a job runs, what customers said, where he
 * works, and a free-quote form.
 *
 * The previous version was this same content arranged as a numbered specification
 * document with an exposed 12-column grid. It was more interesting to look at and
 * it was the wrong thing: a customer looking for a decorator wants to recognise
 * the page, not admire it.
 */
export default function HomePage() {
  const reviews = homeReviews()

  return (
    <>
      {/* ============================================================ *
          Hero
          ============================================================ */}
      <section className="relative overflow-hidden">
        <Drawn className="mx-auto max-w-[78rem] px-5 pt-14 pb-16 md:px-8 md:pt-20 md:pb-24">
          <div className="kh-reveal grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="annotation text-gold">
                {isPlaceholder(town) ? 'Painter & decorator' : `Painter & decorator in ${town}`}
              </p>

              <h1 className="display mt-4">{fill(home.hero.h1)}</h1>

              <p className="measure mt-6 text-lg leading-relaxed text-paper-dim">
                {fill(home.hero.lede)}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="#quote" className="kh-btn">
                  {home.hero.ctaPrimary}
                </Link>
                <CallLink className="kh-btn-ghost gap-2" from="hero">
                  <PhoneIcon className="size-4" />
                  {home.hero.ctaSecondary} — {phone.label}
                </CallLink>
              </div>

              <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
                {home.hero.facts.map((fact) => (
                  <li key={fact} className="flex items-center gap-2">
                    <TickIcon className="size-4 shrink-0 text-gold" />
                    <span className="annotation">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            <WorkPhoto
              photo={home.hero.photo}
              sizes="(min-width: 1024px) 46vw, 100vw"
              priority
              ratio="4 / 3"
            />
          </div>
        </Drawn>
      </section>

      {/* ============================================================ *
          Why people ring me
          ============================================================ */}
      <Band
        tone="well"
        eyebrow="Why people ring me"
        title="What you get when Kenny does the job"
        align="centre"
        divider
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {home.trust.map((item) => (
            <TrustCard
              key={item.title}
              title={item.title}
              body={item.body}
              icon={SERVICE_ICONS[item.icon]}
            />
          ))}
        </div>
      </Band>

      {/* ============================================================ *
          Services
          ============================================================ */}
      <Band
        id="services"
        eyebrow="What I do"
        title={home.services.heading}
        standfirst={home.services.standfirst}
        align="centre"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {serviceRows.map((row) => (
            <ServiceCard
              key={row.name}
              href={row.href}
              name={row.name}
              summary={row.summary}
              tag={row.application}
              icon={SERVICE_ICONS[row.icon]}
            />
          ))}
        </div>
      </Band>

      {/* ============================================================ *
          The two specialisms
          ============================================================ */}
      <Band
        id="specialist"
        tone="well"
        eyebrow="Specialist work"
        title={home.specialist.heading}
        standfirst={home.specialist.standfirst}
        align="centre"
        divider
      >
        <div className="space-y-16 md:space-y-20">
          {home.specialist.items.map((item, i) => (
            <article key={item.name} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              {/* The second one puts the photograph on the left, so two feature
                  blocks in a row do not read as a repeated template. */}
              <div className={i % 2 === 1 ? 'lg:order-2' : undefined}>
                <h3 className="display-sm">{item.name}</h3>
                <div className="mt-5 space-y-4 text-paper-dim">
                  {item.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="measure">
                      {paragraph}
                    </p>
                  ))}
                </div>

                <TickList className="mt-7" items={item.callouts.map((c) => c.label)} />

                <p className="mt-8">
                  <Link
                    href={item.href}
                    className="kh-btn-ghost inline-flex gap-2 text-[0.9375rem]"
                  >
                    {item.linkLabel}
                    <ArrowIcon className="size-4" />
                  </Link>
                </p>
              </div>

              <WorkPhoto photo={item.photo} sizes="(min-width: 1024px) 46vw, 100vw" ratio="4 / 3" />
            </article>
          ))}
        </div>
      </Band>

      {/* ============================================================ *
          Recent work
          ============================================================ */}
      <Band
        id="work"
        eyebrow="My own photographs"
        title={home.work.heading}
        standfirst={home.work.standfirst}
        align="centre"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {home.work.items.map((photo, i) => (
            <WorkPhoto
              key={photo.brief.slice(0, 24)}
              photo={photo}
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
              ratio="4 / 3"
              priority={i === 0 ? false : undefined}
            />
          ))}
        </div>
      </Band>

      {/* ============================================================ *
          About, in short
          ============================================================ */}
      <Band tone="well" eyebrow="About Kenny" title={fill(home.what.heading)} divider>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-5 text-paper-dim">
            {home.what.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="measure">
                {fill(paragraph)}
              </p>
            ))}
          </div>

          {/*
            The facts, as a plain definition list rather than the "specification
            table" this used to be. Same information, and it no longer looks like a
            datasheet. Rows still holding an unconfirmed value show a marked gap.
          */}
          <div className="kh-card p-6 md:p-8">
            <h3 className="annotation text-gold">The facts</h3>
            <dl className="mt-5 space-y-4">
              {home.what.spec.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] items-baseline gap-4 border-b border-rule pb-4 last:border-b-0 last:pb-0"
                >
                  <dt className="annotation">{row.label}</dt>
                  <dd className="font-medium">
                    {isPlaceholder(row.value) ? <Needed token={row.value} /> : fill(row.value)}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-6">
              <Link href="/about" className="link link-hover-target">
                More about how I work
              </Link>
            </p>
          </div>
        </div>
      </Band>

      {/* ============================================================ *
          How a job runs
          ============================================================ */}
      <Band
        id="process"
        eyebrow="How it works"
        title={home.process.heading}
        standfirst={home.process.standfirst}
        align="centre"
      >
        <ol className="grid gap-5 md:grid-cols-2">
          {processSteps.map((step) => (
            <Step
              key={step.number}
              number={step.number}
              title={step.title}
              body={step.body}
              note={step.note}
            />
          ))}
        </ol>
      </Band>

      {/* ============================================================ *
          Reviews
          ============================================================ */}
      <Band
        id="reviews"
        tone="well"
        eyebrow="Reviews"
        title={home.reviews.heading}
        standfirst={home.reviews.standfirst}
        align="centre"
        divider
      >
        {reviews.length > 0 ? (
          <>
            <ReviewList reviews={reviews} layout="grid" />
            <p className="mt-10 text-center">
              <Link href="/reviews" className="kh-btn-ghost inline-flex gap-2">
                {home.reviews.allLabel}
                <ArrowIcon className="size-4" />
              </Link>
            </p>
          </>
        ) : (
          <ReviewsPending />
        )}
      </Band>

      {/* ============================================================ *
          Where I work
          ============================================================ */}
      <Band id="areas" eyebrow="Areas covered" title={home.areas.heading}>
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-5 text-paper-dim">
            {areas.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="measure">
                {fill(paragraph)}
              </p>
            ))}
          </div>

          <div>
            {areas.towns.length > 0 ? (
              <>
                <ul className="flex flex-wrap gap-2">
                  {areas.towns.map((place) => (
                    <li key={place} className="kh-pill">
                      {place}
                    </li>
                  ))}
                </ul>
                <p className="annotation mt-5 leading-relaxed">{areas.note}</p>
              </>
            ) : (
              <Needed token="areas.towns" inline={false} />
            )}
          </div>
        </div>
      </Band>

      {/* ============================================================ *
          Free quote
          ============================================================ */}
      <section id="quote" className="kh-well scroll-mt-24">
        <div className="mx-auto max-w-[78rem] px-5 md:px-8">
          <BrushDivider />
        </div>
        <Drawn className="mx-auto max-w-[78rem] px-5 py-16 md:px-8 md:py-24">
          <div className="kh-reveal grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16">
            <div>
              <p className="annotation text-gold">No obligation</p>
              <h2 className="display-sm mt-3">{home.quote.heading}</h2>
              <p className="measure mt-5 text-lg leading-relaxed text-paper-dim">
                {home.quote.standfirst}
              </p>

              <dl className="mt-10 space-y-6">
                <div>
                  <dt className="annotation">Phone</dt>
                  <dd className="mt-2">
                    <CallLink
                      className="display-xs text-gold underline decoration-1 underline-offset-4 transition-colors duration-150 hover:text-gold-lift hover:decoration-2"
                      from="home-quote"
                    />
                  </dd>
                </div>
                <div>
                  <dt className="annotation">Email</dt>
                  <dd className="mt-2">
                    <EmailLink className="link link-hover-target" from="home-quote">
                      {email}
                    </EmailLink>
                  </dd>
                </div>
                <div>
                  <dt className="annotation">Area</dt>
                  <dd className="mt-2 text-paper-dim">
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
            </div>

            <EnquiryForm from="home" />
          </div>
        </Drawn>
      </section>
    </>
  )
}
