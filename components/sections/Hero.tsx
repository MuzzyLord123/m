import { ArrowDown } from '@phosphor-icons/react/dist/ssr'
import { hero } from '@/content/hero'
import { PhotoSlot } from '../PhotoSlot'
import { CallLink } from '../CallLink'
import { Tape } from '../Tape'
import { HeroParallax } from '../HeroParallax'
import { showPhotoBriefs } from '@/lib/env'

/**
 * Full-bleed photo field, with a hard green block sitting off-centre left.
 * Nothing is centred. The phone number is the largest interactive element on
 * the page and it is above the fold on every screen size.
 */
export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden bg-swatch-black">
      <HeroParallax>
        <PhotoSlot
          photo={hero.photo}
          swatch="black"
          priority
          sizes="100vw"
          className="h-full w-full"
          label={null}
        />
      </HeroParallax>

      {/* the photo field is labelled here rather than inside the slot, so the
          label stays on screen while the layer underneath it drifts */}
      {hero.photo.src === null ? (
        <div className="pointer-events-none absolute right-5 bottom-5 z-10 max-w-[min(92vw,30rem)] text-right md:right-8 md:bottom-8">
          <span className="inline-block bg-chalk px-3 py-1.5 font-body text-[0.68rem] font-semibold tracking-[0.18em] text-ink uppercase">
            Photograph to come
          </span>
          {showPhotoBriefs ? (
            <p className="mt-2 bg-paper px-3 py-2 text-left text-[0.82rem] leading-snug text-ink">
              <span className="font-semibold">Shot needed:</span> {hero.photo.brief}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-[1240px] px-5 pt-10 pb-24 md:grid md:min-h-[86svh] md:grid-cols-12 md:items-center md:px-8 md:pt-16 md:pb-28">
        <div className="bg-green px-6 py-9 text-chalk md:col-span-7 md:col-start-1 md:px-11 md:py-14">
          <Tape>{hero.tape}</Tape>

          <h1 className="mt-6 text-[clamp(2.5rem,7.6vw,4.6rem)] text-chalk">{hero.heading}</h1>

          <p className="mt-5 max-w-[46ch] font-body text-[1.05rem] text-chalk/90 md:text-[1.15rem]">
            {hero.sub}
          </p>

          <div className="mt-8">
            <CallLink variant="slab" label={hero.callLabel} />
          </div>

          <a
            href="#work"
            className="stroke-link mt-7 inline-flex items-center gap-2 font-body text-[0.98rem] font-medium text-chalk"
            style={{ backgroundImage: 'linear-gradient(#FFFDF8, #FFFDF8)' }}
          >
            {hero.secondary}
            <ArrowDown size={17} weight="regular" strokeWidth={1.5} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  )
}
