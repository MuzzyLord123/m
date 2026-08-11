import type { Metadata, Viewport } from 'next'
import { Analytics } from '@/components/Analytics'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { JsonLd } from '@/components/JsonLd'
import { businessSchema, siteSchema } from '@/lib/schema'
import { siteUrl } from '@content/site'
import { archivo } from './fonts'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Painters & decorators | KH Painting and Decorating',
    // Every page sets its own; this only ever applies if one forgets to.
    template: '%s',
  },
  description:
    'Painting, decorating and spray finishing across the north west of England. UPVC, garage doors, render and furniture sprayed. Dustless sanding.',
  formatDetection: { telephone: true },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  // The browser chrome matches the page, so a phone does not show a white bar
  // above a near-black site.
  themeColor: '#12100e',
  colorScheme: 'dark',
  // Zooming stays available. Capping it is an accessibility failure and the site is
  // held to 100 on that.
  initialScale: 1,
  width: 'device-width',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={archivo.variable}>
      <body className="bg-matt text-paper antialiased">
        {/* First focusable node on every page. */}
        <a
          href="#main"
          className="annotation-lg sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-gold focus:px-4 focus:py-3 focus:text-matt"
        >
          Skip to content
        </a>

        <Header />
        <main id="main">{children}</main>
        <Footer />

        <JsonLd data={businessSchema()} />
        <JsonLd data={siteSchema()} />
        <Analytics />
      </body>
    </html>
  )
}
