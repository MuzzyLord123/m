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

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-x-hidden">
      <SkipToContent />

      <Navbar />

      <main id="main-content" className="flex-1 pt-20">
        {children}
      </main>

      <Footer />
      <ChatBot />

      {isHomePage && <MobileStickyCTA />}
    </div>
  );
}
