import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ChatBot } from "@/components/ChatBot";
import { MobileStickyCTA } from "@/components/MobileStickyCTA";
import { SkipToContent } from "@/components/SkipToContent";
import { useMarketingPageTracker } from "@/hooks/useMarketingPageTracker";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const normalizedPath = location.pathname.replace(/\/+$/, "") || "/";
  const isHomePage = normalizedPath === "/";
  useMarketingPageTracker();

  // The wrapper uses `overflow-x-clip`, not `overflow-x-hidden`.
  // `overflow-x: hidden` forces the computed `overflow-y` to `auto`, which turns
  // this div into a scroll container and silently kills `position: sticky` for
  // everything inside it — which is what stopped the pinned platform section on
  // the homepage from pinning. `overflow-x: clip` trims the same overflow without
  // creating the container.
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-clip">
      <SkipToContent />

      <Navbar />

      {/* The homepage drops the top padding so the hero runs underneath the
          floating nav capsule — glass with nothing behind it is just a grey
          box. HomeHero carries its own pt-24/28/32, which clears the capsule.
          Every other page keeps the offset, since their heroes assume it. */}
      <main id="main-content" className={isHomePage ? "flex-1" : "flex-1 pt-20"}>
        {children}
      </main>

      <Footer />
      <ChatBot />

      {isHomePage && <MobileStickyCTA />}
    </div>
  );
}
