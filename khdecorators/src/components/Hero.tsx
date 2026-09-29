import Image from 'next/image'
import Link from 'next/link'
import type { CSSProperties, ReactNode } from 'react'
import type { Photo } from '@content/types'
import { phone } from '@content/site'
import { Gilded } from './Band'
import { CallLink } from './CallLink'
import { PhoneIcon, TickIcon } from './icons'

/**
 * The opening of a page: one of Kenny's photographs, full-bleed, in a gilt frame.
 *
 * `full` is the home page — the whole first screen, sliding up under the
 * transparent header. `page` is every other page — a shorter banner, same
 * construction, so the site opens the same way wherever a visitor lands.
 *
 * What moves, once, on load: the photograph eases back from a slight overscale
 * as a camera settles; the gilt frame comes in; the lines rise into place one
 * after another; the light runs across the gilded phrase. All transform and
 * opacity, all stopped under reduced motion. The photograph is the LCP element
 * and is preloaded; nothing about the animation delays it.
 *
 * Without a photograph the hero is plain lacquer with the frame, which is still
 * a finished-looking page rather than an empty slot.
 */
export function Hero({
  size = 'page',
  photo,
  focus = 'center',
  eyebrow,
  title,
  gild,
  lede,
  facts,
  plaque,
  from,
  quoteHref = '#quote',
  children,
}: {
  size?: 'full' | 'page'
  photo?: Photo
  /** object-position for the photograph, e.g. '50% 30%'. */
  focus?: string
  eyebrow: string
  title: string
  /** A phrase inside `title` to lay in gold leaf. */
  gild?: string
  lede?: string
  facts?: readonly string[]
  /** What the photograph shows, on a small plaque. Our words. */
  plaque?: string
  /** Where on the site the call button is, for analytics. */
  from: string
  quoteHref?: string
  children?: ReactNode
}) {
  const full = size === 'full'
  const pictured = Boolean(photo?.src && photo.width && photo.height)
  const line = (i: number) => ({ '--i': i }) as CSSProperties

  return (
    <section
      className={`relative isolate flex flex-col justify-end overflow-hidden ${
        full
          ? '-mt-[var(--header-h)] min-h-[max(100svh,40rem)]'
          : '-mt-[var(--header-h)] min-h-[max(78svh,34rem)] md:min-h-[max(72svh,36rem)]'
      }`}
    >
      {pictured && photo ? (
        <div className="absolute inset-0 -z-10">
          <Image
            src={photo.src as string}
            alt={photo.alt ?? ''}
            fill
            priority
            fetchPriority="high"
            sizes="100vw"
            className="hero-photo object-cover"
            style={{ objectPosition: focus }}
          />
          {/* Two scrims: one from the foot, where the words are, and one from
              the left on a wide screen. Black, not lacquer — a scrim over a
              photograph must never follow the theme. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(to_top,rgb(14_12_10)_0%,rgb(14_12_10/0.86)_28%,rgb(0_0_0/0.35)_62%,rgb(0_0_0/0.55)_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgb(0_0_0/0.72)_0%,rgb(0_0_0/0.35)_45%,transparent_70%)] md:block"
          />
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(70rem_36rem_at_12%_110%,rgb(201_162_39/0.16),transparent_62%)]"
        />
      )}

      {/* The gilt frame, inset from the edge of the screen. */}
      <div
        aria-hidden="true"
        className="hero-frame pointer-events-none absolute inset-2.5 top-[calc(var(--header-h)+0.625rem)] border border-[rgb(241_220_148/0.28)] md:inset-5 md:top-[calc(var(--header-h)+1.25rem)]"
      />

      <div
        className={`shell relative w-full ${full ? 'pt-[calc(var(--header-h)+5rem)] pb-16 md:pb-24' : 'pt-[calc(var(--header-h)+4rem)] pb-14 md:pb-20'}`}
      >
        <div className={full ? 'max-w-[56rem]' : 'max-w-[52rem]'}>
          <p className="hero-in kh-eyebrow annotation" style={line(0)}>
            {eyebrow}
          </p>

          <h1 className={`hero-rise mt-6 ${full ? 'display-hero' : 'display'}`}>
            <Gilded text={title} gild={gild} load />
          </h1>

          {lede ? (
            <p
              className="hero-in measure mt-7 text-[1.0625rem] leading-relaxed text-paper/85 md:text-lg"
              style={line(2)}
            >
              {lede}
            </p>
          ) : null}

          <div className="hero-in mt-9 flex flex-wrap items-center gap-3" style={line(3)}>
            <Link href={quoteHref} className="kh-btn">
              Get a free quote
            </Link>
            <CallLink className="kh-btn-ghost" from={from}>
              <PhoneIcon className="size-4 text-gold" />
              {phone.label}
            </CallLink>
          </div>

          {facts?.length ? (
            <ul className="hero-in mt-9 flex flex-wrap gap-x-7 gap-y-3" style={line(4)}>
              {facts.map((fact) => (
                <li key={fact} className="flex items-center gap-2.5 text-[0.9375rem] text-paper/80">
                  <TickIcon className="size-4 shrink-0 text-gold" />
                  {fact}
                </li>
              ))}
            </ul>
          ) : null}

          {children}
        </div>
      </div>

      {pictured && plaque ? (
        <p
          className="hero-in absolute right-[calc(var(--gutter)+0.5rem)] bottom-10 hidden max-w-[17rem] border-l border-gold-deep pl-4 text-right lg:block"
          style={{ ...line(5), textAlign: 'left' }}
        >
          <span className="annotation block text-gold">The job in the picture</span>
          <span className="mt-1.5 block text-sm leading-snug text-paper/80">{plaque}</span>
        </p>
      ) : null}

      {full ? (
        <span
          aria-hidden="true"
          className="scroll-cue absolute bottom-0 left-1/2 hidden h-12 w-px bg-linear-to-b from-gold to-transparent md:block"
        />
      ) : null}
    </section>
  )
}
