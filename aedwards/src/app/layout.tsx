import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, DM_Mono } from 'next/font/google'
import './globals.css'
import { PALETTE } from '@content/fields'
import { SITE_URL, business } from '@content/site'
import { Repaint } from '@/components/Repaint'
import { TopStrip } from '@/components/TopStrip'

/**
 * Two families, self-hosted by next/font. That mono against that display IS the
 * brand — there is no logo, and "A Edwards Decorating" set in Bricolage 800 is
 * where the identity starts and stops.
 */

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bricolage',
})

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
  variable: '--font-dm-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `Painter & decorator in Flint | ${business.name}`,
    template: `%s | ${business.name}`,
  },
  description:
    `${business.knownAs} Edwards is a painter and decorator in ${business.town}, ${business.county}. ` +
    'Interior and exterior, domestic and commercial, across north-east Wales and the Chester area.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: business.name,
    url: SITE_URL,
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  // The page repaints as you scroll; the browser chrome takes the first field.
  themeColor: PALETTE.f1.bg,
  colorScheme: 'only light',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${bricolage.variable} ${dmMono.variable}`}>
      <head>
        {/*
          Without JavaScript the clip reveals never run, so the type they are
          hiding would stay hidden. This puts it back. The page then sits at
          whichever colour the server rendered — every foreground/background
          pair on this site clears 7:1, so a page that never repaints is a
          perfectly readable page.
        */}
        <noscript>
          <style>{`[data-clip]{clip-path:none!important;opacity:1!important}`}</style>
        </noscript>
      </head>
      <body className="antialiased">
        <Repaint />
        <TopStrip />
        <main id="main">{children}</main>
      </body>
    </html>
  )
}
