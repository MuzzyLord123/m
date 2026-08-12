import Link from 'next/link'
import { ArrowRight, Star } from '@phosphor-icons/react/dist/ssr'
import { featuredReviews, reviewsCopy } from '@/content/reviews'
import { homeCopy } from '@/content/pages'

/**
 * Two real reviews on the home page, with the rest a click away on
 * /recent-work rather than duplicated into a second dialog.
 *
 * No JavaScript here at all — the dialog lives on the page the link goes to.
 *
 * Same rule as everywhere else: no overall score, no review count. See
 * /content/reviews.ts.
 */
export function ReviewsTeaser() {
  return (
    <section aria-labelledby="home-reviews" className="bg-chalk">
      <div className="mx-auto grid w-full max-w-[1240px] grid-cols-12 gap-x-8 gap-y-9 px-5 py-16 md:px-8 md:py-24">
        <div className="col-span-12 md:col-span-4">
          <h2 id="home-reviews" className="text-[clamp(1.6rem,3vw,2.3rem)] text-ink">
            {reviewsCopy.heading}
          </h2>
          <p className="mt-4 max-w-[36ch] font-body text-[0.95rem] text-ink-soft">
            {reviewsCopy.standfirst}
          </p>
          <Link
            href="/recent-work"
            className="stroke-link mt-7 inline-flex items-center gap-2 font-body font-semibold text-ink"
          >
            {homeCopy.proofLink}
            <ArrowRight size={17} weight="regular" strokeWidth={1.5} aria-hidden />
          </Link>
        </div>

        <ul className="col-span-12 grid gap-6 md:col-span-7 md:col-start-6 md:grid-cols-2">
          {featuredReviews.map((review) => (
            <li key={review.name} className="border-t-2 border-ink pt-5">
              <span role="img" aria-label={`${review.rating} out of 5`} className="flex gap-0.5 text-ink">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={15}
                    weight={i < review.rating ? 'fill' : 'regular'}
                    strokeWidth={1.5}
                    aria-hidden
                  />
                ))}
              </span>
              <blockquote className="mt-3">
                <p className="max-w-[52ch] font-body text-[0.97rem] text-ink">“{review.body}”</p>
              </blockquote>
              <p className="mt-3 font-body text-[0.8rem] font-semibold tracking-[0.14em] text-ink-soft uppercase">
                {review.name} · {review.source}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
