import type { Metadata, Viewport } from "next";
import { body, bodyItalic, display, displayItalic } from "./fonts";
import { site } from "@/config/site";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { MobileActionBar } from "@/components/layout/MobileActionBar";
import { ScrollPaintLevel } from "@/components/layout/ScrollPaintLevel";
import { ChatLauncher } from "@/components/chat/ChatLauncher";
import { StructuredData } from "@/components/seo/StructuredData";
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
    url: site.url,
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#fafaf8",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${display.variable} ${displayItalic.variable} ${body.variable} ${bodyItalic.variable}`}>
      <body className="bg-paper text-ink antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
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
