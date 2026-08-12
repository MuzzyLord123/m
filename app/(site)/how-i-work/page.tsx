import type { Metadata } from 'next'
import { pageMeta } from '@/content/site'
import { pageHeaders } from '@/content/pages'
import { PageHeader } from '@/components/PageHeader'
import { Preparation } from '@/components/sections/Preparation'
import { HowItRuns } from '@/components/sections/HowItRuns'

export const metadata: Metadata = {
  title: pageMeta['/how-i-work'].title,
  description: pageMeta['/how-i-work'].description,
  alternates: { canonical: '/how-i-work' },
}

/**
 * The differentiator page: why the preparation decides how long a finish
 * lasts, then the four steps a job runs through.
 */
export default function HowIWorkPage() {
  return (
    <>
      <PageHeader copy={pageHeaders['/how-i-work']} />
      <Preparation />
      <HowItRuns />
    </>
  )
}
