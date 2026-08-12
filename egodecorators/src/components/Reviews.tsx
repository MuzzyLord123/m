import { REVIEWS, yellRating, type Review } from '@content/reviews';
import { profiles } from '@content/site';
import { Pending } from '@/components/Pending';
import { SeamLink } from '@/components/SeamLink';
import { cn } from '@/lib/cn';

/**
 * Testimonials.
 *
 * Set in Syne at moderate size, across the seam. No cards, no carousel, no
 * stars, no Yell or Checkatrade logo. The words and who said them, and that is
 * the lot.
 *
 * Attribution is exactly as published. Two of these were left under Yell
 * usernames and they stay as usernames — turning `Jane58539` into "Jane Smith"
 * would be inventing a person, and it is the sort of small dishonesty that the
 * rest of this rebuild exists to clear out.
 */
export function Testimonial({ review, className }: { review: Review; className?: string }) {
  // No verbatim text yet: say so rather than paraphrasing. A paraphrase set in
  // quotation marks is a fabricated review.
  if (!review.quote) {
    return (
      <div className={className}>
        <Pending id="review-quotes" label={`Review — ${review.name}, ${review.source}`} />
        <p className="meta mt-3">Roughly, and not for publication: {review.gist}</p>
      </div>
    );
  }

  return (
    <figure className={cn('m-0', className)}>
      <blockquote className="display-sm cross-seam max-w-[24ch] text-balance">
        {review.quote}
      </blockquote>
      <figcaption className="meta mt-5">
        {review.name} ·{' '}
        {review.source === 'Yell' ? (
          <SeamLink href={profiles.yell.href} external className="meta">
            {review.source}
          </SeamLink>
        ) : (
          review.source
        )}
        {review.date ? ` · ${review.date}` : ''}
      </figcaption>
    </figure>
  );
}

/**
 * The Yell rating, in plain text, with its source and the date it was read.
 *
 * It is never marked up as aggregateRating. Google's policy is explicit that a
 * business may not mark up ratings collected on someone else's platform as its
 * own review data, and the penalty for getting it wrong is losing rich results
 * altogether. Plain text costs nothing and carries the same information.
 *
 * Renders nothing at all until somebody has actually opened the listing and
 * read it.
 */
export function RatingLine({ className }: { className?: string }) {
  if (!yellRating) return null;

  return (
    <p className={cn('meta', className)}>
      {yellRating.score} out of 5 from {yellRating.count} reviews on Yell, read on{' '}
      {yellRating.readOn}
    </p>
  );
}

export function reviewsWithQuotes(): Review[] {
  return REVIEWS.filter((r) => r.quote);
}
