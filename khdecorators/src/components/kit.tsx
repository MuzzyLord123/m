import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Photo } from '@content/types'
import { ArrowIcon, TickIcon } from './icons'

/**
 * The small pieces the pages are built from.
 */

/* ------------------------------------------------------------------ *
 * Tick list
 * ------------------------------------------------------------------ */

/**
 * A list with gold ticks. The tick is `aria-hidden` and the list is a real
 * `<ul>`, so a screen reader gets the list without hearing "tick" every line.
 */
export function TickList({
  items,
  className,
  tone = 'body',
}: {
  items: readonly string[]
  className?: string
  tone?: 'body' | 'dim'
}) {
  return (
    <ul className={`kh-ticks ${className ?? ''}`}>
      {items.map((item) => (
        <li key={item}>
          <TickIcon className="mt-1 size-5 text-gold" />
          <span className={tone === 'dim' ? 'text-paper-dim' : undefined}>{item}</span>
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ *
 * Photograph
 * ------------------------------------------------------------------ */

/**
 * One of Kenny's photographs in a gilt mount — the keyline sits inside the
 * picture, the way a gilt slip sits inside a frame. The frame uncovers and the
 * picture settles as it scrolls in.
 *
 * While a slot is empty it renders as masking paper with the brief for the shot
 * on a label. Never a stock photograph, never a generated one.
 */
export function WorkPhoto({
  photo,
  caption,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  priority = false,
  ratio = '4 / 3',
  /** Where the crop should hold when the frame is a different shape. */
  focus = 'center',
  reveal = true,
  className,
}: {
  photo: Photo
  caption?: string
  sizes?: string
  priority?: boolean
  ratio?: string
  focus?: string
  reveal?: boolean
  className?: string
}) {
  const hasImage = Boolean(photo.src && photo.width && photo.height)

  return (
    <figure className={className}>
      <div
        className={`kh-photo ${hasImage ? '' : 'kh-photo--empty'} ${reveal && !priority ? 'kh-photo-reveal' : ''}`}
        style={{ aspectRatio: ratio }}
      >
        {hasImage ? (
          <Image
            src={photo.src as string}
            alt={photo.alt ?? ''}
            width={photo.width as number}
            height={photo.height as number}
            sizes={sizes}
            priority={priority}
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: focus }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-5">
            <div className="kh-well max-w-[30rem] border border-edge px-4 py-3 text-center">
              <p className="annotation text-gold">Photograph to come</p>
              <p className="mt-2 line-clamp-3 text-sm text-paper-dim">{photo.brief}</p>
            </div>
          </div>
        )}
      </div>

      {caption ? (
        <figcaption className="annotation mt-4 flex items-center gap-3 text-paper-faint">
          <span aria-hidden="true" className="h-px w-6 bg-gold-deep" />
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

/* ------------------------------------------------------------------ *
 * Cards
 * ------------------------------------------------------------------ */

/**
 * A service. With a photograph it is a picture card — his work on top, the trade
 * beneath; without one it is a lacquered card with the trade's own icon.
 *
 * The whole card is the link: the `<a>` wraps the heading and stretches over the
 * card with `after:absolute`, so nothing interactive is nested inside anything
 * else. A soft light follows the pointer across it on a desktop.
 */
export function ServiceCard({
  href,
  name,
  summary,
  icon: Icon,
  tag,
  photo,
  focus,
}: {
  href: string
  name: string
  summary: string
  icon: (props: { className?: string }) => ReactNode
  tag?: string
  photo?: Photo
  focus?: string
}) {
  const pictured = Boolean(photo?.src)

  return (
    <div className="kh-card kh-card--link kh-spot group flex flex-col overflow-hidden">
      {pictured && photo ? (
        <div className="kh-photo kh-photo-hover aspect-[4/3] rounded-none">
          <Image
            src={photo.src as string}
            alt={photo.alt ?? ''}
            width={photo.width as number}
            height={photo.height as number}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 92vw"
            className="absolute inset-0 size-full object-cover"
            style={{ objectPosition: focus ?? 'center' }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 z-[1] h-1/2 bg-linear-to-t from-satin to-transparent"
          />
        </div>
      ) : null}

      {/* Not positioned, deliberately: the stretched link below has to resolve
          against the CARD, or the hit area shrinks to this block. */}
      <div className="flex grow flex-col p-6 md:p-7">
        {pictured ? null : <Icon className="size-9 text-gold" />}
        {tag ? (
          <p className={`annotation text-gold ${pictured ? '' : 'mt-6'}`}>{tag}</p>
        ) : null}

        <h3 className="display-xs mt-3">
          <Link
            href={href}
            prefetch={false}
            className="after:absolute after:inset-0 after:z-[4] focus-visible:outline-none"
          >
            {name}
          </Link>
        </h3>

        <p className="mt-3 grow text-paper-dim">{summary}</p>

        <span className="annotation mt-6 inline-flex items-center gap-2.5 text-paper">
          See the work
          <ArrowIcon className="size-4 text-gold transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-x-1.5" />
        </span>
      </div>
    </div>
  )
}

/** A trust point: the trade's icon in a gilt lozenge, a short claim, one line. */
export function TrustCard({
  title,
  body,
  icon: Icon,
}: {
  title: string
  body: string
  icon: (props: { className?: string }) => ReactNode
}) {
  return (
    <div className="relative">
      <span className="grid size-14 place-items-center border border-gold-deep/70 bg-matt/40">
        <Icon className="size-7 text-gold" />
      </span>
      <h3 className="display-xs mt-6">{title}</h3>
      <p className="mt-2.5 text-paper-dim">{body}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Before and after
 * ------------------------------------------------------------------ */

/**
 * The same wall twice, hung side by side as a pair of plates — before on the
 * left, after on the right, a gilt joint between them. A diptych rather than a
 * drag-to-compare slider on purpose: both states are visible at once, at any
 * width, with nothing to work out, and it cannot be mistaken for the slider on
 * the other site in this portfolio.
 */
export function Diptych({
  title,
  before,
  after,
}: {
  title: string
  before: Photo & { caption?: string }
  after: Photo & { caption?: string }
}) {
  return (
    <figure>
      <div className="relative grid grid-cols-2 gap-2 md:gap-3">
        {[
          { label: 'Before', photo: before },
          { label: 'After', photo: after },
        ].map(({ label, photo }) => (
          <div key={label} className="kh-photo kh-photo-reveal aspect-square">
            <Image
              src={photo.src as string}
              alt={photo.alt ?? ''}
              width={photo.width as number}
              height={photo.height as number}
              sizes="(min-width: 1024px) 25vw, 46vw"
              className="absolute inset-0 size-full object-cover"
            />
            <span className="annotation absolute top-3 left-3 z-[3] bg-matt/85 px-2.5 py-1.5 text-gold md:top-5 md:left-5">
              {label}
            </span>
          </div>
        ))}
        {/* The gilt joint. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-6 left-1/2 w-px -translate-x-1/2 bg-linear-to-b from-transparent via-gold to-transparent"
        />
      </div>
      <figcaption className="mt-5">
        <span className="display-xs block">{title}</span>
        <span className="annotation mt-2 block text-paper-faint">
          {before.caption?.replace(/^Before:\s*/, '')} → {after.caption?.replace(/^After:\s*/, '')}
        </span>
      </figcaption>
    </figure>
  )
}

/* ------------------------------------------------------------------ *
 * Steps
 * ------------------------------------------------------------------ */

/**
 * One numbered step. The numeral is set huge in the narrowest cut of the face,
 * outlined in gilt — decoration, so it is hidden from assistive tech; the
 * number is carried by the ordered list itself.
 */
export function Step({
  number,
  title,
  body,
  note,
}: {
  number: string
  title?: string
  body: string
  note?: string
}) {
  return (
    <li className="relative grid grid-cols-[4.5rem_minmax(0,1fr)] gap-5 border-t border-rule pt-7 md:grid-cols-[6rem_minmax(0,1fr)] md:gap-7">
      <span
        aria-hidden="true"
        className="numeral text-[4.5rem] text-transparent [-webkit-text-stroke:1px_var(--color-gold)] md:text-[6rem]"
      >
        {number}
      </span>
      <div className="min-w-0 pt-1">
        {title ? <h3 className="display-xs">{title}</h3> : null}
        <p className={`text-paper-dim ${title ? 'mt-2.5' : ''}`}>{body}</p>
        {note ? <p className="annotation mt-4 text-gold">{note}</p> : null}
      </div>
    </li>
  )
}
