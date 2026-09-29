import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ServicePageView } from '@/components/ServicePageView'
import { pageMetadata } from '@/lib/metadata'
import { servicePageBySlug } from '@content/services'

/** Slug unchanged from the old site. Indexed — see LAUNCH.md §2. */
const service = servicePageBySlug('wallpaper-hanging')

export const metadata: Metadata = service
  ? pageMetadata({
      title: service.title,
      description: service.description,
      path: '/wallpaper-hanging',
    })
  : {}

export default function WallpaperHangingPage() {
  if (!service) notFound()
  return <ServicePageView service={service} />
}
