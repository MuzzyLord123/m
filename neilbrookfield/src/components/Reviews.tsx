import { reviews, googleProfileUrl } from '@content/reviews';

/**
 * Three real reviews, set as pull quotes.
 *
 * No stars, no carousel, no count, no score. On the old site all three credits
 * linked to the same Google contributor, so two of them pointed at the wrong
 * person — here there is one link to the business profile, or none at all.
 *
 * Where the exact wording has not been supplied, the quote is left as a frame.
 * A remembered review is a made-up review.
 */
export function Reviews() {
  return (
    <div>
      {/* Staggered down the page rather than lined up three abreast — a row of
          three equal blocks reads as cards, and there are no cards here. */}
      <ul className="grid grid-cols-1 gap-16 lg:grid-cols-12 lg:gap-y-24">
        {reviews.map((review, i) => (
          <li
            key={review.name}
            className={
              [
                'lg:col-span-5 lg:col-start-1',
                'lg:col-span-5 lg:col-start-7',
                'lg:col-span-5 lg:col-start-3',
              ][i % 3]
            }
          >
            <hr className="hairline mb-6 max-w-16" />

            {review.quote ? (
              <blockquote className="font-[family-name:var(--font-display)] text-2xl leading-[1.3] font-light">
                {review.quote}
              </blockquote>
            ) : (
              <div
                data-needed="review-quotes"
                className="border border-dashed border-slate/40 p-6"
              >
                <p className="eyebrow">Review to be set</p>
                <p className="secondary mt-4 text-sm leading-relaxed">
                  {review.covers ??
                    'The wording of this review has not been copied across yet, so it is not reproduced from memory.'}
                </p>
              </div>
            )}

            <p className="eyebrow mt-6">{review.name}</p>
          </li>
        ))}
      </ul>

      {googleProfileUrl ? (
        <a
          href={googleProfileUrl}
          rel="noopener"
          className="eyebrow link-rule mt-12 inline-block"
        >
          Read them on Google
        </a>
      ) : (
        <p data-needed="google-profile" className="eyebrow eyebrow-muted mt-12">
          Link to the Google Business Profile still to come — CONTENT-NEEDED.md · google-profile
        </p>
      )}
    </div>
  );
}
