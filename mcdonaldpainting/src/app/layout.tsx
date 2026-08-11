import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans, Schibsted_Grotesk } from 'next/font/google';

import { Analytics } from '@/components/Analytics';
import { Footer } from '@/components/Footer';
import { Nav } from '@/components/Nav';
import { RevealObserver } from '@/components/RevealObserver';
import { businessSchema, jsonLd } from '@/lib/schema';
import { home } from '@content/copy/home';
import { site } from '@content/site';

import './globals.css';

/**
 * Two families, no third.
 *
 * Schibsted Grotesk carries the display type — a monumental grotesque set in
 * sentence case, which reads institutional rather than loud. IBM Plex Sans
 * carries everything else, including every figure on the site: it has proper
 * tabular numerals, which is the reason it is here and not something else.
 *
 * Both self-hosted and preloaded by next/font. No request leaves the page for
 * a font.
 *
 * display: 'optional', not 'swap'. This one is worth explaining, because
 * 'swap' is the usual answer.
 *
 * next/font generates a metric-adjusted fallback for each family, which fixes
 * the vertical metrics and the average character width. What it cannot fix is
 * per-glyph width, and at the size the page titles are set — 4.5rem — a few
 * percent of accumulated difference is enough to move a word onto another line
 * when the real font arrives. Measured on a throttled connection that swap cost
 * 0.19 of Cumulative Layout Shift on /programmed-maintenance: the heading
 * re-wrapped and took the entire page down with it, under the reader's thumb.
 *
 * With 'optional' the browser uses whichever font it has at first paint and
 * never swaps, so the layout cannot move. Both files are preloaded, so on any
 * normal connection they arrive inside the block period and are used; on a slow
 * first visit the page renders in the adjusted fallback and the real faces are
 * cached for every visit after it. Stability first — this is a site people read
 * on a phone on a site.
 */
const schibsted = Schibsted_Grotesk({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-schibsted',
  weight: ['700', '800'],
});

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'optional',
  variable: '--font-plex',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: home.meta.title,
  description: home.meta.description,
  alternates: { canonical: '/' },
  applicationName: site.name,
  // Carried across from the current site's head so the Search Console property
  // survives the move. MIGRATION.md §3.
  verification: { google: site.googleSiteVerification },
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: site.name,
    url: '/',
    title: home.meta.title,
    description: home.meta.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  themeColor: '#14181B',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${schibsted.variable} ${plex.variable}`}>
      <head>
        {/* With JavaScript off the reveal observer never runs, so the initial
            states of every animated element are stripped and the page arrives
            complete. Nothing on this site depends on JavaScript to be read. */}
        <noscript>
          <style>{`.reveal-type,.reveal-rule,.reveal-figure,.reveal-plate,.data-cell::before,.data-cell>dt,.data-cell>dd{clip-path:none!important;transform:none!important;opacity:1!important}.reveal-scrim{opacity:.55!important}`}</style>
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLd(businessSchema())}
        />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:bg-hivis focus:px-4 focus:py-2.5 focus:text-graphite"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <RevealObserver />
        <Analytics />
      </body>
    </html>
  );
}
