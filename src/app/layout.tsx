import type { Metadata, Viewport } from "next";
import { body, bodyItalic, display, displayItalic, mono } from "./fonts";
import { site } from "@/config/site";
import { previewMode } from "@/config/preview";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { ScrollPaintLevel } from "@/components/layout/ScrollPaintLevel";
import { ChatLauncher } from "@/components/chat/ChatLauncher";
import { StructuredData } from "@/components/seo/StructuredData";
import { SPLASH_GUARD, Splash } from "@/components/brand/Splash";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Painter & Decorator in ${site.town}`,
    template: `%s — ${site.name}`,
  },
  description: `Interior and exterior decorating across ${site.serviceArea}. ${site.years} years of flawless finishes. Free quotes back within 48 hours.`,
  openGraph: {
    type: "website",
    locale: "en_GB",
    siteName: site.name,
    /* Deliberately no `url` here. Metadata is inherited, so a url set at the
       root becomes og:url on EVERY page — meaning a share of /work resolved to
       the home page and the link the customer clicked was not the page they
       were sent. Each page carries its own alternates.canonical, which is what
       identifies it; an absent og:url makes a crawler fall back to the URL it
       fetched, which is correct. */
  },
  /* A half-built site must never be indexed. Preview mode flips this for every
     page at once — it is inherited — so a preview that gets shared around
     cannot end up in Google under the client's name. */
  robots: previewMode ? { index: false, follow: false } : { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  /* All three were wrong for a dark site and all three are visible on a phone.
     themeColor was the old paper white, so Safari and Chrome drew a near-white
     address bar around a near-black page. colorScheme said light while
     globals.css says dark, so form controls and scrollbars rendered for the
     wrong theme. And without viewportFit the page never extends under the
     notch, which means every env(safe-area-inset-*) resolves to 0px — the
     bottom padding on the sticky action bar and the flood menu was doing
     nothing on any notched iPhone. */
  themeColor: "#0c0c0e",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-GB"
      className={`${display.variable} ${displayItalic.variable} ${body.variable} ${bodyItalic.variable} ${mono.variable}`}
    >
      <head>
        {/* Reveals start at opacity 0 and are brought in by an observer. If the
            JavaScript never arrives — blocked, or simply a failed request — this
            is what stops the page rendering as a header above empty space. */}
        <noscript>
          <style>{`.reveal{opacity:1!important;transform:none!important;transition:none!important}`}</style>
        </noscript>
        {/* Marks the splash as seen BEFORE first paint, so a second page view in
            the same session never flashes it. As a module this would run after
            paint and the splash would appear and then vanish, which is worse
            than not having one. See Splash.tsx. */}
        <script dangerouslySetInnerHTML={{ __html: SPLASH_GUARD }} />
      </head>
      <body className="bg-paper text-ink antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Splash />
        <ScrollPaintLevel />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <MobileActionBar />
        <ChatLauncher />
        <StructuredData />
        <div className="roller-grain" aria-hidden="true" />
      </body>
    </html>
  );
}
