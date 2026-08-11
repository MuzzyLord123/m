import { services } from '@/content/services'
import { swatchHex } from '@/lib/swatches'
import { PhotoSlot } from '../PhotoSlot'
import { RollerReveal } from '../RollerReveal'
import { SectionHead } from '../SectionHead'

/**
 * Four services, each its own full-width band keyed to one swatch colour.
 * The column spans shift band to band so it never settles into a mirrored
 * left-right-left rhythm, and it is never three equal cards.
 */

const layouts = [
  {
    text: 'md:col-span-5 md:col-start-1',
    photo: 'md:col-span-6 md:col-start-7',
    aspect: 'aspect-[4/3]',
  },
  {
    text: 'md:col-span-5 md:col-start-8',
    photo: 'md:col-span-6 md:col-start-1 md:row-start-1',
    aspect: 'aspect-[3/2]',
  },
  {
    text: 'md:col-span-5 md:col-start-2',
    photo: 'md:col-span-5 md:col-start-8',
    aspect: 'aspect-[5/4]',
  },
  {
    text: 'md:col-span-5 md:col-start-7',
    photo: 'md:col-span-6 md:col-start-1 md:row-start-1',
    aspect: 'aspect-[16/10]',
  },
]

export function Services() {
  return (
    <section id="services" aria-labelledby="services-heading" className="bg-paper">
      <div className="mx-auto w-full max-w-[1240px] px-5 pt-16 pb-4 md:px-8 md:pt-24">
        <SectionHead
          eyebrow="What I do"
          heading={<span id="services-heading">Four things, done properly.</span>}
          className="md:max-w-[34ch]"
        />
      </div>

      {services.map((service, i) => {
        const layout = layouts[i % layouts.length]
        const colour = swatchHex[service.swatch]
        const alt = i % 2 === 1

        return (
          <article
            key={service.id}
            id={service.id}
            className={`relative border-t border-ink/12 ${alt ? 'bg-chalk' : 'bg-paper'}`}
          >
            {/* the band's swatch colour, run down the left edge like a paint line */}
            <span
              aria-hidden
              className="absolute inset-y-0 left-0 w-[6px] md:w-[10px]"
              style={{ backgroundColor: colour }}
            />

            <div className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-x-8 gap-y-8 px-5 py-12 pl-8 md:px-8 md:py-20 md:pl-14">
              <div className={`col-span-12 ${layout.text}`}>
                <p
                  className="font-body text-[0.72rem] font-semibold tracking-[0.2em] uppercase"
                  style={{ color: '#4A443C' }}
                >
                  {String(i + 1).padStart(2, '0')} — {service.swatchLabel}
                </p>

                <h3 className="mt-3 text-[clamp(1.65rem,3.4vw,2.4rem)] text-ink">
                  {service.title}
                </h3>

                <span
                  aria-hidden
                  className="swatch-edge mt-5 block h-8 w-24"
                  style={{ backgroundColor: colour }}
                />

                <p className="mt-5 max-w-[52ch] font-body text-ink-soft">{service.body}</p>

                <ul className="mt-6 max-w-[52ch] space-y-2.5 border-l-2 border-ink/15 pl-4">
                  {service.detail.map((d) => (
                    <li key={d} className="font-body text-[0.94rem] text-ink-soft">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`col-span-12 ${layout.photo}`}>
                <RollerReveal colour={colour}>
                  <PhotoSlot
                    photo={service.photo}
                    swatch={service.swatch}
                    className={`${layout.aspect} w-full`}
                    sizes="(min-width: 768px) 50vw, 100vw"
                  />
                </RollerReveal>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}
