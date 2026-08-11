'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Star, X } from '@phosphor-icons/react/dist/ssr'
import { featuredReviews, reviews, reviewsCopy, type Review } from '@/content/reviews'
import { googleProfileUrl } from '@/content/todo'

/**
 * Real Google reviews, in a dialog.
 *
 * Two of them sit on the page so the section says something to somebody who
 * never clicks; the rest are behind the button. Everything is in the markup
 * either way — a closed <dialog> is still in the HTML, so the words are there
 * for search engines and for anyone reading with the dialog shut.
 *
 * Same dialog mechanics as the gallery: native showModal gives focus trapping,
 * Escape and focus restoration for nothing; the only thing added by hand is
 * closing on a backdrop click. No library.
 *
 * Deliberately absent: any overall score. We hold six reviews the client sent
 * us, not his profile's true total, so the site never puts a number on it.
 */
export function Reviews() {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [open, setOpen] = useState(false)

  const close = useCallback(() => dialogRef.current?.close(), [])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open && !el.open) el.showModal()
    if (!open && el.open) el.close()
  }, [open])

  return (
    <>
      <div className="grid grid-cols-12 gap-x-8 gap-y-8">
        <div className="col-span-12 md:col-span-4">
          <h3 className="text-[clamp(1.5rem,2.8vw,2.1rem)] text-ink">{reviewsCopy.heading}</h3>
          <p className="mt-4 max-w-[38ch] font-body text-[0.95rem] text-ink-soft">
            {reviewsCopy.standfirst}
          </p>

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="bleed mt-7 inline-flex items-center gap-3 border-2 border-ink px-6 py-3.5 font-body font-semibold text-ink transition-colors duration-200 hover:text-chalk focus-visible:text-chalk"
            style={{ '--bleed-colour': '#16130F' } as React.CSSProperties}
          >
            {reviewsCopy.openLabel}
            <span aria-hidden className="font-body text-[0.85rem] opacity-70">
              ({reviews.length})
            </span>
          </button>
        </div>

        <ul className="col-span-12 grid gap-6 md:col-span-7 md:col-start-6 md:grid-cols-2">
          {featuredReviews.map((review) => (
            <li key={review.name} className="border-t-2 border-ink pt-5">
              <ReviewBody review={review} />
            </li>
          ))}
        </ul>
      </div>

      <dialog
        ref={dialogRef}
        className="sheet-dialog"
        aria-label={reviewsCopy.dialogTitle}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === dialogRef.current) close()
        }}
      >
        <div className="flex max-h-[92dvh] w-[min(94vw,44rem)] flex-col bg-paper">
          <div className="flex shrink-0 items-start justify-between gap-6 border-b-2 border-ink px-5 py-4 md:px-7">
            <div>
              <h2 className="text-[1.35rem] text-ink">{reviewsCopy.dialogTitle}</h2>
              <p className="mt-1 font-body text-[0.85rem] text-ink-soft">
                {reviewsCopy.standfirst}
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="shrink-0 bg-ink p-2.5 text-chalk"
            >
              <X size={20} weight="regular" strokeWidth={1.5} aria-hidden />
            </button>
          </div>

          {/* scrollable, and focusable so it can be scrolled from the keyboard */}
          <div tabIndex={0} className="grow overflow-y-auto px-5 py-6 md:px-7">
            <ul className="grid gap-7">
              {reviews.map((review) => (
                <li key={review.name} className="border-t-2 border-ink/20 pt-5 first:border-t-0 first:pt-0">
                  <ReviewBody review={review} />
                </li>
              ))}
            </ul>
          </div>

          {googleProfileUrl ? (
            <div className="shrink-0 border-t-2 border-ink px-5 py-4 md:px-7">
              <a
                href={googleProfileUrl}
                rel="noopener nofollow"
                className="stroke-link font-body text-[0.95rem] font-semibold text-ink"
              >
                Read them on Google
              </a>
            </div>
          ) : null}
        </div>
      </dialog>
    </>
  )
}

function ReviewBody({ review }: { review: Review }) {
  return (
    <>
      <Stars rating={review.rating} />
      <blockquote className="mt-3">
        <p className="max-w-[52ch] font-body text-[0.97rem] text-ink">
          “{review.body}
          {review.truncated ? '…' : ''}”
        </p>
      </blockquote>
      <p className="mt-3 font-body text-[0.8rem] font-semibold tracking-[0.14em] text-ink-soft uppercase">
        {review.name} · {review.source}
      </p>
      {review.truncated ? (
        <p className="mt-1.5 font-body text-[0.78rem] text-ink-soft italic">
          Cut short by Google’s “More” link.
        </p>
      ) : null}
    </>
  )
}

/** Ink, not orange — orange is reserved for the phone. */
function Stars({ rating }: { rating: number }) {
  return (
    <span role="img" aria-label={`${rating} out of 5`} className="flex gap-0.5 text-ink">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={15}
          weight={i < rating ? 'fill' : 'regular'}
          strokeWidth={1.5}
          aria-hidden
        />
      ))}
    </span>
  )
}
