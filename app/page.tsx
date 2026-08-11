import { DesktopNav } from '@/components/nav/DesktopNav'
import { MobileCallBar, MobileTopBar } from '@/components/nav/MobileBars'
import { Hero } from '@/components/sections/Hero'
import { Services } from '@/components/sections/Services'
import { Preparation } from '@/components/sections/Preparation'
import { Finishes } from '@/components/sections/Finishes'
import { HowItRuns } from '@/components/sections/HowItRuns'
import { Work } from '@/components/sections/Work'
import { Areas } from '@/components/sections/Areas'
import { Contact } from '@/components/sections/Contact'
import { Footer } from '@/components/Footer'
import { StructuredData } from '@/components/StructuredData'

/**
 * One page, one job: make the phone ring.
 *
 * The order is a conversion sequence, not a sitemap — what he does, why his
 * preparation matters, information worth reading, how a job actually runs,
 * proof, where he works, then the phone number again.
 */
export default function HomePage() {
  return (
    <>
      <StructuredData />
      <DesktopNav />
      <MobileTopBar />

      <main id="main">
        <Hero />
        <Services />
        <Preparation />
        <Finishes />
        <HowItRuns />
        <Work />
        <Areas />
        <Contact />
      </main>

      <Footer />
      <MobileCallBar />
    </>
  )
}
