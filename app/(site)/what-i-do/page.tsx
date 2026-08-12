import type { Metadata } from 'next'
import { pageMeta } from '@/content/site'
import { pageHeaders } from '@/content/pages'
import { PageHeader } from '@/components/PageHeader'
import { Services } from '@/components/sections/Services'
import { Finishes } from '@/components/sections/Finishes'

export const metadata: Metadata = {
  title: pageMeta['/what-i-do'].title,
  description: pageMeta['/what-i-do'].description,
  alternates: { canonical: '/what-i-do' },
}

/**
 * The four services, then the finishes table — what he does, and what you end
 * up choosing between. The services section drops its own heading here because
 * the masthead already says it.
 */
export default function WhatIDoPage() {
  return (
    <>
      <PageHeader copy={pageHeaders['/what-i-do']} />
      <Services showHead={false} />
      <Finishes />
    </>
  )
}
