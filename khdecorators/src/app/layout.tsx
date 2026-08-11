import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { Analytics } from '@/components/Analytics'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { JsonLd } from '@/components/JsonLd'
import { businessSchema, siteSchema } from '@/lib/schema'
import { siteUrl } from '@content/site'
import './globals.css'

/**
 * Geist Sans, self-hosted.
 *
 * One family across the whole site. Hierarchy comes from size, weight and tracking —
 * there is no second face to reach for, and `--font-*` is reset in globals.css so
 * Tailwind does not offer one either.
 *
 * The `geist` package wraps `next/font/local` around the woff2 files, so the font is
 * served from this origin with an immutable fingerprinted URL. No request to Google
 * Fonts: it is a third-party connection on the critical path, and font latency is LCP
 * latency on a site that is mostly type.
 */

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
  themeColor: '#f6f7f5',
  // Zooming stays available. Capping it is an accessibility failure and the site is
  // held to 100 on that.
  initialScale: 1,
  width: 'device-width',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={GeistSans.variable}>
      <body className="bg-paper text-ink antialiased">
        <a
          href="#main"
          className="annotation-lg sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:border focus:border-signal focus:bg-paper focus:px-4 focus:py-3 focus:text-signal"
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
