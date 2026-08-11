import type { Metadata, Viewport } from 'next';
import { Fraunces, Newsreader } from 'next/font/google';

import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { RevealObserver } from '@/components/RevealObserver';
import { businessSchema, jsonLd } from '@/lib/schema';
import { site } from '@content/site';
import { home } from '@content/copy/home';

import './globals.css';

/**
 * Both faces are self-hosted by next/font — no request leaves the page for a
 * font, and there is no layout shift while one loads.
 *
 * Fraunces is the display face: high optical size, soft axis low, wonk off.
 * Those axes are set in globals.css so a heading can never arrive at the
 * default settings by accident.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
});

const newsreader = Newsreader({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: home.meta.title,
  description: home.meta.description,
  alternates: { canonical: '/' },
  // Carried across from the Wix head so Search Console access survives the move.
  verification: { google: site.googleSiteVerification },
  // Note what is NOT here: format-detection telephone=no. Wix set it, and it
  // stopped phone numbers being tappable. The number is a real tel: link now.
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: site.name,
    url: site.url,
    title: home.meta.title,
    description: home.meta.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor: '#101518',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${newsreader.variable}`}>
      <body className="bg-night text-linen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:border focus:border-brass focus:bg-night focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main">{children}</main>
        <Footer />
        <RevealObserver />
        <script
          type="application/ld+json"
          // Static, built from content/. No user input reaches this.
          dangerouslySetInnerHTML={{ __html: jsonLd(businessSchema()) }}
        />
      </body>
    </html>
  );
}
