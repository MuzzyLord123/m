import { ServicePage } from '@/components/ServicePage'
import { service, serviceMetadata } from '@/lib/service-page'

export const metadata = serviceMetadata('wood-finishes')

export default function Page() {
  return <ServicePage service={service('wood-finishes')} />
}
