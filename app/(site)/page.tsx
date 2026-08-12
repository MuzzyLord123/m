import type { Metadata } from 'next'
import { pageMeta } from '@/content/site'
import { Hero } from '@/components/sections/Hero'
import { ServicesSummary } from '@/components/sections/ServicesSummary'
import { ReviewsTeaser } from '@/components/ReviewsTeaser'
import { HomeClose } from '@/components/sections/HomeClose'

export const metadata: Metadata = {
  title: pageMeta['/'].title,
  description: pageMeta['/'].description,
  alternates: { canonical: '/' },
}

/**
 * Home. Still one job: make the phone ring.
 *
 * Hero, the four things he does, two real reviews, then where he works and the
 * number again. Everything here has somewhere deeper to go — the detail lives
 * on the four pages behind it rather than all of it landing at once.
 */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesSummary />
      <ReviewsTeaser />
      <HomeClose />
    </>
  )
}
