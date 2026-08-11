import type { Metadata, Viewport } from 'next'
import { Archivo, Instrument_Sans } from 'next/font/google'
import { business, meta, siteUrl } from '@/content/site'
import './globals.css'

/**
 * Archivo carries the wdth axis, so Archivo Expanded comes out of the same
 * file — see the font-variation-settings rule in globals.css. Self-hosted by
 * next/font; there is no <link> to Google anywhere.
 */
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  display: 'swap',
  variable: '--font-archivo',
})

const instrument = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument',
})

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: meta.title,
  description: meta.description,
  alternates: { canonical: '/' },
  applicationName: business.name,
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: '/',
    siteName: business.name,
    title: meta.title,
    description: meta.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: true },
}

export const viewport: Viewport = {
  themeColor: '#F5F1E8',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${archivo.variable} ${instrument.variable}`}>
      <head>
        {/* With no JavaScript the roller-wipe covers would never pull back, so
            they are removed entirely. The content underneath is already there. */}
        <noscript>
          <style>{`[data-roller]{display:none !important}`}</style>
        </noscript>
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[70] focus:bg-ink focus:px-4 focus:py-2.5 focus:font-body focus:text-chalk"
        >
          Skip to content
        </a>
        {children}
        <div className="grain" aria-hidden />
      </body>
    </html>
  )
}
