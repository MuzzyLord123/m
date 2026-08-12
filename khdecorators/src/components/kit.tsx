import Link from 'next/link'
import Image from 'next/image'
import type { ReactNode } from 'react'
import type { Photo } from '@content/types'
import { ArrowIcon, TickIcon } from './icons'

/**
 * The small pieces the pages are built from: tick lists, cards, photographs,
 * numbered steps. Ordinary components for an ordinary — and familiar — trade
 * website, which is the whole point of this revision.
 */

/* ------------------------------------------------------------------ *
 * Tick list
 * ------------------------------------------------------------------ */

/**
 * A list with gold ticks. The familiar "what's included" device, and it earns its
 * place: a customer scanning a list of what they get reads a tick faster than a
 * dash.
 *
 * The tick is `aria-hidden` and the list is a real `<ul>`, so a screen reader
 * gets the list semantics without hearing "tick" fifteen times.
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
 * A photograph, in a frame, with an optional caption.
 *
 * This replaces the annotated-photograph component from the previous build — the
 * one with leader lines running from markers on the image out to technical labels
 * in the margin. It was the most distinctive thing on the site and it was also
 * the reason the site read as an engineering drawing. A decorator's photograph
 * wants to be looked at, not annotated.
 *
 * While a slot is empty it renders as a ruled frame carrying the brief for the
 * shot we are waiting on. Never a stock photograph, never a generated one.
 */
export function WorkPhoto({
  photo,
  /** Shown beneath the frame. One line describing the work. */
  caption,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  priority = false,
  /** Held whether the slot is full or empty, so nothing moves when it is filled. */
  ratio = '4 / 3',
  className,
}: {
  photo: Photo
  caption?: string
  sizes?: string
  priority?: boolean
  ratio?: string
  className?: string
}) {
  const hasImage = Boolean(photo.src && photo.width && photo.height)

  return (
    <figure className={className}>
      <div
        className={`kh-photo ${hasImage ? '' : 'kh-photo--empty'}`}
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
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-5">
            <div className="kh-well max-w-[30rem] rounded-[--radius-chip] border border-edge px-4 py-3 text-center">
              <p className="annotation text-gold">Photograph to come</p>
              <p className="mt-2 line-clamp-3 text-sm text-paper-dim">{photo.brief}</p>
            </div>
          </div>
        )}
      </div>

      {caption ? <figcaption className="mt-3 text-sm text-paper-dim">{caption}</figcaption> : null}
    </figure>
  )
}

/* ------------------------------------------------------------------ *
 * Cards
 * ------------------------------------------------------------------ */

/**
 * A service card: icon, name, one line, and a "more" affordance.
 *
 * The whole card is the link. The `<a>` wraps the heading and stretches over the
 * card with `after:absolute after:inset-0`, so the hit area is the full card
 * without nesting one interactive element inside another.
 */
export function ServiceCard({
  href,
  name,
  summary,
  icon: Icon,
  /** e.g. "Sprayed" — the one fact that distinguishes this from the next trade. */
  tag,
}: {
  href: string
  name: string
  summary: string
  icon: (props: { className?: string }) => ReactNode
  tag?: string
}) {
  return (
    <div className="kh-card kh-card--link group flex flex-col p-6">
      <Icon className="size-8 text-gold" />

      <h3 className="display-xs mt-5">
        <Link
          href={href}
          prefetch={false}
          className="after:absolute after:inset-0 focus-visible:outline-none"
        >
          {name}
        </Link>
      </h3>

      <p className="mt-3 grow text-paper-dim">{summary}</p>

      <div className="mt-5 flex items-center justify-between gap-4">
        {tag ? <span className="annotation text-paper-faint">{tag}</span> : <span />}
        <ArrowIcon className="size-4 shrink-0 text-gold transition-transform duration-150 group-hover:translate-x-1" />
      </div>
    </div>
  )
}

/** A trust point: icon, short claim, one line of substance. */
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
    <div className="kh-card p-6">
      <Icon className="size-7 text-gold" />
      <h3 className="display-xs mt-4">{title}</h3>
      <p className="mt-2 text-paper-dim">{body}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Steps
 * ------------------------------------------------------------------ */

/**
 * One numbered step.
 *
 * `title` is optional: the preparation lists on /spraying are single sentences
 * with no heading of their own, and an empty `<h3>` in the middle of an ordered
 * list is both untidy markup and a confusing thing for a screen reader to meet.
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
    <li className="kh-card flex gap-5 p-6">
      <span className="kh-step" aria-hidden="true">
        {number}
      </span>
      <div className="min-w-0">
        {title ? <h3 className="display-xs">{title}</h3> : null}
        <p className={`text-paper-dim ${title ? 'mt-2' : ''}`}>{body}</p>
        {note ? <p className="annotation mt-3 text-gold">{note}</p> : null}
      </div>
    </li>
  )
}
