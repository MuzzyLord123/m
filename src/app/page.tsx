import type { Metadata } from "next";
import { Hero } from "@/components/home/Hero";
import { ServicesOverview } from "@/components/home/ServicesOverview";
import { FeaturedWork } from "@/components/home/FeaturedWork";
import { BeforeAfterMoment } from "@/components/home/BeforeAfterMoment";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Testimonials } from "@/components/home/Testimonials";
import { SocialFeed } from "@/components/home/SocialFeed";
import { ServiceArea } from "@/components/home/ServiceArea";
import { FinalCta } from "@/components/home/FinalCta";
import { RollerPass } from "@/components/motion/RollerPass";
import { TradeMarquee } from "@/components/motion/TradeMarquee";
import { site } from "@/config/site";
import { testimonials } from "@/data/testimonials";

export const metadata: Metadata = {
  title: `${site.name} — Painter & Decorator in ${site.town}`,
  description: `Interior and exterior decorating across ${site.serviceArea}. ${site.years} years of flawless finishes, a written price within 48 hours and a ${site.facts.guarantee.toLowerCase()}.`,
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <ServicesOverview />

      {/* The band that ties the trades above to the work below, and the third
          orange plane in the page's rhythm. It drifts on the reader's own
          scroll rather than a timer — see TradeMarquee.tsx. */}
      <TradeMarquee />

      <FeaturedWork />

      {/* Roller pass on the three boundaries that carry the most weight */}
      <RollerPass>
        <BeforeAfterMoment />
      </RollerPass>

      <HowItWorks />

      {/* Renders nothing while there are no real testimonials, so the roller
          pass is conditional too — an empty band on an absent section is a
          stray stripe across the page. */}
      {testimonials.length > 0 && (
        <RollerPass>
          <Testimonials />
        </RollerPass>
      )}

      <SocialFeed />
      <ServiceArea />
      <FinalCta />
    </>
  );
}
