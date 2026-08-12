import type { Metadata } from 'next'
import { yellRating } from '@content/reviews'
import { ReviewsArchive } from '@/components/ReviewsArchive'

/**
 * The whole archive. Statically prerendered — see ReviewsArchive for why the
 * source filter is a set of real pages rather than a query string.
 */

export const metadata: Metadata = {
  title: 'Reviews',
  description: `Every review of A Edwards Decorating, excerpted and linked to the original. ${yellRating.average} from ${yellRating.count} ratings on Yell.`,
  alternates: { canonical: '/reviews' },
}

export default function ReviewsPage() {
  return <ReviewsArchive source="all" />
}
