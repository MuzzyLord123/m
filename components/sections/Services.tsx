import type { Service } from '@/content/services'
import { services } from '@/content/services'
import { swatchHex } from '@/lib/swatches'
import { PhotoSlot } from '../PhotoSlot'
import { RollerReveal } from '../RollerReveal'
import { SectionHead } from '../SectionHead'

/**
 * Four services, four different compositions.
 *
 * Not one layout mirrored left and right down the page — that zigzag is the
 * giveaway of a page assembled from a component rather than designed. Each band
 * is laid out on its own terms:
 *
 *   1. split, photo running off the right edge of the screen
 *   2. inset, photo sitting under its own heading rather than beside it
 *   3. split, photo running off the left edge, portrait
 *   4. stacked, text over a letterbox band the full width of the page
 *
 * What they share is the spine: a painted rule across the top in the band's
 * swatch colour, and the number set large in the same colour.
 */

/** Pads a full-bleed cell so its text still starts on the page's content edge. */
const EDGE_LEFT = 'md:pl-[max(2rem,calc((100vw-1240px)/2+2rem))]'
const EDGE_RIGHT = 'md:pr-[max(2rem,calc((100vw-1240px)/2+2rem))]'

export function Services({ showHead = true }: { showHead?: boolean } = {}) {
  // With the section head hidden the page masthead is the h1 directly above,
  // so the band titles step up to h2 rather than leaving a gap at h3.
  const bandLevel = showHead ? 'h3' : 'h2'

  return (
    <section
      id="services"
      aria-labelledby={showHead ? 'services-heading' : undefined}
      aria-label={showHead ? undefined : 'What I do'}
      className="bg-paper"
    >
      {showHead ? (
        <div className="mx-auto w-full max-w-[1240px] px-5 pt-16 pb-6 md:px-8 md:pt-24 md:pb-10">
          <SectionHead
            eyebrow="What I do"
            heading={<span id="services-heading">Four things, done properly.</span>}
            className="md:max-w-[34ch]"
          />
        </div>
      ) : null}

      {services.map((service, i) => {
        const variant = i % 4
        const colour = swatchHex[service.swatch]
        const shell = `relative ${i % 2 === 1 ? 'bg-chalk' : 'bg-paper'}`
        const rule = <span aria-hidden className="block h-[6px] w-full" style={{ backgroundColor: colour }} />

        // 1 — split band, photograph running off the right edge of the screen
        if (variant === 0) {
          return (
            <article key={service.id} id={service.id} className={shell}>
              {rule}
              <div className="md:grid md:grid-cols-2 md:items-stretch">
                <div className={`px-5 py-12 md:py-24 md:pr-14 ${EDGE_LEFT}`}>
                  <Copy service={service} index={i} colour={colour} level={bandLevel} />
                </div>
                <RollerReveal colour={colour} className="md:h-full">
                  <PhotoSlot
                    photo={service.photo}
                    swatch={service.swatch}
                    className="aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-[560px]"
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </RollerReveal>
              </div>
            </article>
          )
        }

        // 2 — inset band, photograph beneath its own heading
        if (variant === 1) {
          return (
            <article key={service.id} id={service.id} className={shell}>
              {rule}
              <div className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-x-8 gap-y-9 px-5 py-12 md:px-8 md:py-24">
                <div className="col-span-12 md:col-span-8">
                  <Heading service={service} index={i} colour={colour} level={bandLevel} />
                </div>
                <div className="col-span-12 md:col-span-6 md:col-start-1">
                  <RollerReveal colour={colour}>
                    <PhotoSlot
                      photo={service.photo}
                      swatch={service.swatch}
                      className="aspect-[16/10] w-full"
                      sizes="(min-width: 768px) 50vw, 100vw"
                    />
                  </RollerReveal>
                </div>
                <div className="col-span-12 md:col-span-5 md:col-start-8 md:self-center">
                  <Body service={service} />
                </div>
              </div>
            </article>
          )
        }

        // 3 — split band, portrait photograph running off the left edge
        if (variant === 2) {
          return (
            <article key={service.id} id={service.id} className={shell}>
              {rule}
              {/* text first in the source so it still reads heading-then-photo
                  when the band stacks on a phone; the photograph is placed back
                  into the left column at md */}
              <div className="md:grid md:grid-cols-[5fr_7fr] md:items-stretch">
                <div
                  className={`px-5 py-12 md:col-start-2 md:row-start-1 md:py-24 md:pl-14 ${EDGE_RIGHT}`}
                >
                  <Copy service={service} index={i} colour={colour} level={bandLevel} />
                </div>
                <RollerReveal colour={colour} className="md:col-start-1 md:row-start-1 md:h-full">
                  <PhotoSlot
                    photo={service.photo}
                    swatch={service.swatch}
                    className="aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-[620px]"
                    sizes="(min-width: 768px) 42vw, 100vw"
                  />
                </RollerReveal>
              </div>
            </article>
          )
        }

        // 4 — stacked band, text over a letterbox the full width of the page
        return (
          <article key={service.id} id={service.id} className={shell}>
            {rule}
            <div className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-x-8 gap-y-10 px-5 py-12 md:px-8 md:pt-24 md:pb-16">
              <div className="col-span-12 md:col-span-6">
                <Heading service={service} index={i} colour={colour} level={bandLevel} />
                <p className="mt-6 max-w-[52ch] font-body text-ink-soft">{service.body}</p>
              </div>
              <div className="col-span-12 md:col-span-4 md:col-start-9 md:self-end">
                <Detail service={service} />
              </div>
            </div>
            <div className="mx-auto w-full max-w-[1240px] px-5 pb-14 md:px-8 md:pb-24">
              <RollerReveal colour={colour}>
                <PhotoSlot
                  photo={service.photo}
                  swatch={service.swatch}
                  className="aspect-[16/9] w-full md:aspect-[24/9]"
                  sizes="(min-width: 1240px) 1176px, 100vw"
                />
              </RollerReveal>
            </div>
          </article>
        )
      })}
    </section>
  )
}

/* ---------------------------------------------------------------------- */

function Heading({
  service,
  index,
  colour,
  level,
}: {
  service: Service
  index: number
  colour: string
  level: 'h2' | 'h3'
}) {
  const Title = level
  return (
    <>
      <p className="flex items-baseline gap-4">
        <span
          aria-hidden
          className="u-display text-[clamp(2.4rem,4.6vw,3.6rem)] leading-none"
          style={{ color: colour, fontWeight: 800 }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="font-body text-[0.72rem] font-semibold tracking-[0.2em] text-ink-soft uppercase">
          {service.swatchLabel}
        </span>
      </p>
      <Title className="mt-4 max-w-[18ch] text-[clamp(1.7rem,3.4vw,2.5rem)] text-ink">
        {service.title}
      </Title>
    </>
  )
}

function Body({ service }: { service: Service }) {
  return (
    <>
      <p className="max-w-[52ch] font-body text-ink-soft">{service.body}</p>
      <Detail service={service} className="mt-6" />
    </>
  )
}

function Detail({ service, className = '' }: { service: Service; className?: string }) {
  return (
    <ul className={`max-w-[52ch] space-y-3 ${className}`}>
      {service.detail.map((d) => (
        <li key={d} className="flex gap-3 font-body text-[0.94rem] text-ink-soft">
          <span aria-hidden className="mt-2.5 h-[3px] w-4 shrink-0 bg-ink/40" />
          {d}
        </li>
      ))}
    </ul>
  )
}

function Copy({
  service,
  index,
  colour,
  level,
}: {
  service: Service
  index: number
  colour: string
  level: 'h2' | 'h3'
}) {
  return (
    <div className="max-w-[36rem]">
      <Heading service={service} index={index} colour={colour} level={level} />
      <p className="mt-5 max-w-[52ch] font-body text-ink-soft">{service.body}</p>
      <Detail service={service} className="mt-7" />
    </div>
  )
}
