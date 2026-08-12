import type { Metadata } from 'next'
import { pageMeta } from '@/content/site'
import { pageHeaders } from '@/content/pages'
import { PageHeader } from '@/components/PageHeader'
import { Areas } from '@/components/sections/Areas'
import { Contact } from '@/components/sections/Contact'

export const metadata: Metadata = {
  title: pageMeta['/contact'].title,
  description: pageMeta['/contact'].description,
  alternates: { canonical: '/contact' },
}

/**
 * Where he works, then the phone number and the form. The contact section
 * drops its own heading — the masthead is already saying "ring me and tell me
 * what needs painting", and saying it twice on one page helps nobody.
 */
export default function ContactPage() {
  return (
    <>
      <PageHeader copy={pageHeaders['/contact']} />
      <Areas />
      <Contact showHead={false} />
    </>
  )
}
