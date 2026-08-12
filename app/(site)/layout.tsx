import { DesktopNav } from '@/components/nav/DesktopNav'
import { MobileCallBar, MobileTopBar } from '@/components/nav/MobileBars'
import { Footer } from '@/components/Footer'
import { StructuredData } from '@/components/StructuredData'

/**
 * Chrome shared by the five public pages.
 *
 * It is a route group rather than the root layout so the /enquiry/* pages —
 * where the form lands with JavaScript switched off — stay stripped back to the
 * logotype, the message and the phone number. Nothing to navigate away into at
 * the moment somebody has just got in touch.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <StructuredData />
      <DesktopNav />
      <MobileTopBar />
      <main id="main">{children}</main>
      <Footer />
      <MobileCallBar />
    </>
  )
}
