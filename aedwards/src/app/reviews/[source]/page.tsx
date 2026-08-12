import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { presentSources, sourceLabel, type ReviewSource } from '@content/reviews'
import { ReviewsArchive } from '@/components/ReviewsArchive'

/**
 * The archive filtered to one source. One prerendered page per source that
 * actually has reviews in it — currently just /reviews/yell.
 *
 * These are noindex with a canonical pointing back at /reviews. They are a
 * filtered view of the same reviews, and asking a search engine to rank two
 * near-identical pages against each other is how a small honest site starts
 * competing with itself.
 */

export const dynamicParams = false

export function generateStaticParams() {
  return presentSources.map((source) => ({ source }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ source: string }>
}): Promise<Metadata> {
  const { source } = await params
  const label = sourceLabel[source as ReviewSource] ?? source

  return {
    title: `Reviews on ${label}`,
    description: `Reviews of A Edwards Decorating left on ${label}, excerpted and linked to the original.`,
    alternates: { canonical: '/reviews' },
    robots: { index: false, follow: true },
  }
}

export default async function FilteredReviewsPage({
  params,
}: {
  params: Promise<{ source: string }>
}) {
  const { source } = await params
  if (!presentSources.includes(source as ReviewSource)) notFound()

  return <ReviewsArchive source={source as ReviewSource} />
}
