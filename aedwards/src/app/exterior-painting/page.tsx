import { ServicePage } from '@/components/ServicePage'
import { service, serviceMetadata } from '@/lib/service-page'

export const metadata = serviceMetadata('exterior-painting')

export default function Page() {
  return <ServicePage service={service('exterior-painting')} />
}
