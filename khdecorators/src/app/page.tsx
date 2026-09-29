import type { Metadata } from 'next'
import Link from 'next/link'
import { Band, Gilded } from '@/components/Band'
import { CallLink, EmailLink } from '@/components/CallLink'
import { EnquiryForm } from '@/components/EnquiryForm'
import { Gallery } from '@/components/Gallery'
import { Hero } from '@/components/Hero'
import { Needed } from '@/components/Needed'
import { PullQuote, ReviewList } from '@/components/Reviews'
import { ArrowIcon, SERVICE_ICONS } from '@/components/icons'
import { Diptych, ServiceCard, Step, TickList, TrustCard, WorkPhoto } from '@/components/kit'
import { fill, pageMetadata, place } from '@/lib/metadata'
import { areas } from '@content/areas'
import { home } from '@content/home'
import { pairs, photos } from '@content/photos'
import { processSteps } from '@content/process'
import { reviews, sourcedReviews } from '@content/reviews'
import { serviceRows } from '@content/services'
import { email, region, town } from '@content/site'
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
 * The home page, in the order a customer reads a decorator's site: the work,
 * why him, what he does, the proof, how it runs, and how to get a price.
 */
export default function HomePage() {
  // The town goes in the first sentence once it is confirmed. Until then the
  // sentence says what the old site already says — the north west — rather than
  // printing a placeholder at the top of the page.
  const lede = isPlaceholder(town)
    ? 'I’m Kenny. I paint and decorate houses across the north west of England, and I spray the things a brush cannot do properly — UPVC, garage doors, render and kitchen doors.'
    : fill(home.hero.lede)

  const featured = sourcedReviews()
  const pull = featured.find((r) => r.name === 'Jonny Harrop') ?? featured[0]
  const threeUp = featured.filter((r) => r !== pull).slice(0, 3)
  const pictured = serviceRows.filter((row) => row.photo)
  const plain = serviceRows.filter((row) => !row.photo)

  return (
    <>
      <Hero
        size="full"
        photo={home.hero.photo}
        focus="55% 45%"
        eyebrow="KH Painting & Decorating · North West England"
        title={`Painter, decorator and spray finisher in ${place()}`}
        gild="spray finisher"
        lede={lede}
        facts={home.hero.facts}
        plaque={photos.mockTudor.caption}
        from="hero"
      />

      {/* ============================================================ *
          Why people ring him — four promises, straight under the fold
          ============================================================ */}
      <section aria-labelledby="trust-heading" className="relative border-b border-rule bg-satin/60">
        <div className="shell py-16 md:py-20">
          <h2 id="trust-heading" className="sr-only">
            Why people ring Kenny
          </h2>
          <ul className="kh-reveal grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {home.trust.map((item) => (
              <li key={item.title}>
                <TrustCard title={item.title} body={item.body} icon={SERVICE_ICONS[item.icon]} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ============================================================ *
          The two specialisms
          ============================================================ */}
      <Band
        id="specialist"
        eyebrow="Specialist work"
        title={home.specialist.heading}
        gild="don’t do"
        standfirst={home.specialist.standfirst}
      >
        <div className="space-y-20 md:space-y-28">
          {home.specialist.items.map((item, i) => (
            <article
              key={item.name}
              className="grid grid-cols-[minmax(0,1fr)] items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-16"
            >
              <WorkPhoto
                photo={item.photo}
                ratio="5 / 4"
                sizes="(min-width: 1024px) 52vw, 100vw"
                caption={'caption' in item.photo ? String(item.photo.caption) : undefined}
                className={i % 2 === 1 ? 'lg:order-2' : undefined}
              />
              <div>
                <p aria-hidden="true" className="numeral gilt text-[5.5rem] md:text-[7rem]">
                  {item.number}
                </p>
                <h3 className="display-sm mt-4">{item.name}</h3>
                <div className="mt-6 space-y-4 text-paper-dim">
                  {item.body.map((paragraph) => (
                    <p key={paragraph.slice(0, 24)} className="measure">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <TickList className="mt-8" items={item.callouts.map((c) => c.label)} />
                <p className="mt-10">
                  <Link href={item.href} className="kh-btn-ghost whitespace-normal text-left">
                    {item.linkLabel}
                    <ArrowIcon className="size-4 text-gold" />
                  </Link>
                </p>
              </div>
            </article>
          ))}
        </div>
      </Band>

      {/* ============================================================ *
          Before and after — the masking, and what it buys
          ============================================================ */}
      <Band
        id="before-after"
        tone="well"
        divider
        eyebrow="Before and after"
        title="The masking is the job"
        gild="the job"
        standfirst="Two of mine, photographed mid-job and again at the end. The first is what the preparation for spraying actually looks like: every window wrapped, the repairs patched in, the ground sheeted."
      >
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-10">
          {pairs.map((pair) => (
            <Diptych key={pair.title} title={pair.title} before={pair.before} after={pair.after} />
          ))}
        </div>
      </Band>

      {/* ============================================================ *
          One review, large — the office repaint finished early
          ============================================================ */}
      {pull ? <PullQuote review={pull} /> : null}

      {/* ============================================================ *
          Services
          ============================================================ */}
      <Band
        id="services"
        eyebrow="What I do"
        title={home.services.heading}
        gild="for you"
        standfirst={home.services.standfirst}
        align="centre"
      >
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pictured.map((row) => (
            <li key={row.name} className="flex">
              <ServiceCard
                href={row.href}
                name={row.name}
                summary={row.summary}
                tag={row.application}
                icon={SERVICE_ICONS[row.icon]}
                photo={row.photo}
                focus={row.photo?.focus}
              />
            </li>
          ))}
        </ul>
        {plain.length > 0 ? (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plain.map((row) => (
              <li key={row.name} className="flex">
                <ServiceCard
                  href={row.href}
                  name={row.name}
                  summary={row.summary}
                  tag={row.application}
                  icon={SERVICE_ICONS[row.icon]}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </Band>

      {/* ============================================================ *
          Recent work
          ============================================================ */}
      <Band
        id="work"
        tone="well"
        eyebrow="My own photographs"
        title={home.work.heading}
        gild="work"
        standfirst="Every photograph on this site is one of my jobs. No stock photography, no borrowed pictures — tap any of them to see it larger."
        divider
      >
        <Gallery items={[...home.work.items]} />
        <p className="mt-12 flex flex-wrap items-center gap-4">
          <Link href="/gallery" className="kh-btn-ghost">
            Every photograph
            <ArrowIcon className="size-4 text-gold" />
          </Link>
          <Link href="#quote" className="kh-btn">
            {home.work.allLabel}
          </Link>
        </p>
      </Band>

      {/* ============================================================ *
          Reviews
          ============================================================ */}
      <Band
        id="reviews"
        eyebrow="Reviews"
        title={home.reviews.heading}
        gild="customers say"
        standfirst={`${reviews.length} reviews, quoted exactly as they were written, with the names as they were published.`}
        align="centre"
      >
        <ReviewList reviews={threeUp} layout="grid" />
        <p className="mt-12 text-center">
          <Link href="/reviews" className="kh-btn-ghost">
            {home.reviews.allLabel}
            <ArrowIcon className="size-4 text-gold" />
          </Link>
        </p>
      </Band>

      {/* ============================================================ *
          How a job runs
          ============================================================ */}
      <Band
        id="process"
        tone="satin"
        eyebrow="How it works"
        title={home.process.heading}
        gild="start to finish"
        standfirst={home.process.standfirst}
        divider
      >
        <ol className="grid gap-x-14 gap-y-10 md:grid-cols-2">
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
          About Kenny, and where he works
          ============================================================ */}
      <Band id="about" eyebrow="About Kenny" title={fill(home.what.heading)} gild="and where">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          <div>
            <div className="space-y-5 text-lg leading-relaxed text-paper-dim">
              {home.what.body.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="measure">
                  {isPlaceholder(town) ? paragraph.replace(' working out of {town}', '') : fill(paragraph)}
                </p>
              ))}
            </div>

            <div className="mt-10">
              <h3 className="annotation text-gold">Where I work</h3>
              {areas.towns.length > 0 ? (
                <>
                  <ul className="mt-5 flex flex-wrap gap-2">
                    {areas.towns.map((name) => (
                      <li key={name} className="kh-pill">
                        {name}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-sm text-paper-faint">{areas.note}</p>
                </>
              ) : (
                <p className="mt-4 text-paper-dim">
                  Across {region}. <Needed token="areas.towns" />
                </p>
              )}
            </div>
          </div>

          <div className="kh-card p-7 md:p-9">
            <h3 className="annotation text-gold">The facts</h3>
            <dl className="mt-6">
              {home.what.spec.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(0,8.5rem)_minmax(0,1fr)] items-baseline gap-4 border-b border-rule py-4 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <dt className="annotation">{row.label}</dt>
                  <dd className="font-medium">
                    {isPlaceholder(fill(row.value)) ? <Needed token={fill(row.value)} /> : fill(row.value)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-8">
              <Link href="/about" className="link link-hover-target">
                More about how I work
              </Link>
            </p>
          </div>
        </div>
      </Band>

      {/* ============================================================ *
          Free quote
          ============================================================ */}
      <section id="quote" className="kh-well relative scroll-mt-32 overflow-hidden">
        <div className="kh-moulding" />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_85%_0%,rgb(201_162_39/0.1),transparent_65%)]"
        />
        <div className="shell relative py-20 md:py-28">
          <div className="kh-reveal grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-20">
            <div>
              <p className="kh-eyebrow annotation">No obligation</p>
              <h2 className="display-sm mt-5">
                <Gilded text={home.quote.heading} gild="free quote" />
              </h2>
              <p className="measure mt-6 text-lg leading-relaxed text-paper-dim">
                {home.quote.standfirst}
              </p>

              <div className="mt-12 border-t border-rule pt-8">
                <p className="annotation">Or ring me</p>
                <p className="mt-3">
                  <CallLink
                    className="gilt display inline-block transition-opacity duration-300 hover:opacity-85"
                    from="home-quote"
                  />
                </p>
                <p className="mt-4">
                  <EmailLink className="link link-hover-target" from="home-quote">
                    {email}
                  </EmailLink>
                </p>
              </div>
            </div>

            <div className="kh-card p-6 md:p-8">
              <EnquiryForm from="home" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
