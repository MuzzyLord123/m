import type { Metadata } from 'next'
import { pageMeta } from '@/content/site'
import { pageHeaders } from '@/content/pages'
import { PageHeader } from '@/components/PageHeader'
import { Work } from '@/components/sections/Work'

export const metadata: Metadata = {
  title: pageMeta['/recent-work'].title,
  description: pageMeta['/recent-work'].description,
  alternates: { canonical: '/recent-work' },
}

/**
 * The gallery, the before-and-after slider, and the full set of Google
 * reviews behind their dialog. The section drops its own heading because the
 * masthead already carries it.
 */
export default function RecentWorkPage() {
  return (
    <>
      <PageHeader copy={pageHeaders['/recent-work']} />
      <Work showHead={false} />
    </>
  )
}
