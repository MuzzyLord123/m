import { ServicePage } from '@/components/ServicePage'
import { service, serviceMetadata } from '@/lib/service-page'

export const metadata = serviceMetadata('interior-painting')

export default function Page() {
  return <ServicePage service={service('interior-painting')} />
}
