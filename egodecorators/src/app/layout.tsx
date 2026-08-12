import type { Metadata } from 'next';
import { Syne, Familjen_Grotesk } from 'next/font/google';

import './globals.css';
import { site } from '@content/site';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { businessSchema, jsonLd } from '@/lib/schema';
import { REVEAL_SCRIPT } from '@/lib/reveal-script';

/**
 * Two families, self-hosted by next/font so nothing is requested from Google at
 * runtime. Both are variable, so a single file per family covers every weight
 * the site uses: Syne 700–800 for display, Familjen Grotesk 400–500 for
 * everything else. There is no third face and there will not be one.
 */
const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

const familjen = Familjen_Grotesk({
  subsets: ['latin'],
  variable: '--font-familjen',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'Painters & decorators in Neston | Ego Decorators',
    template: '%s | Ego Decorators',
  },
  description:
    'Family-run painters and decorators in Neston, covering Cheshire, the Wirral and Flintshire. We repair rotten windows, soffits and fascias before we paint them.',
  alternates: { canonical: '/' },
  openGraph: {
    siteName: 'Ego Decorators',
    locale: 'en_GB',
    type: 'website',
  },
  formatDetection: { telephone: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${syne.variable} ${familjen.variable}`}>
      <head>
        {/* Seam draw + scroll reveals. See src/lib/reveal-script.ts for why this
            is inline script rather than a component. */}
        <script dangerouslySetInnerHTML={{ __html: REVEAL_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(businessSchema()) }}
        />
      </head>
      <body>
        {/*
          The seam. One fixed element, the full height of the viewport, at dead
          centre — painted white and composited with `difference`, so it comes
          out black over the paper bands and white over the ink ones without
          having to be told which it is crossing. That is what makes it a single
          unbroken line down the whole page rather than a set of segments that
          have to agree with each other.
        */}
        <div className="seam hidden md:block" aria-hidden="true" />

        <a
          href="#main"
          className="link-seam sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:p-3"
        >
          Skip to content
        </a>

        <Nav />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
