import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ServicePageView } from '@/components/ServicePageView'
import { pageMetadata } from '@/lib/metadata'
import { servicePageBySlug } from '@content/services'

/**
 * Slug kept exactly as it was on the Google Sites build. It is indexed, and Ads
 * traffic may already be pointing at it — see LAUNCH.md §2.
 */
const service = servicePageBySlug('interior-decoration')

export const metadata: Metadata = service
  ? pageMetadata({
      title: service.title,
      description: service.description,
      path: '/interior-decoration',
    })
  : {}

export default function InteriorDecorationPage() {
  if (!service) notFound()
  return <ServicePageView service={service} />
}
