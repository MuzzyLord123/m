import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Shield, Heart, ArrowRight, Share2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";
import { ParallaxBackground } from "@/components/ParallaxImage";
import { PricingCard3D } from "@/components/Card3D";
import socialMedia from "@/assets/social-media.webp";

const packages = [
  { 
    name: "Starter", 
    price: "Tailored", 
    period: "", 
    features: [
      "2 platforms", 
      "8 posts monthly", 
      "Basic engagement", 
      "Monthly reporting"
    ] 
  },
  { 
    name: "Growth", 
    price: "Tailored", 
    period: "", 
    features: [
      "3 platforms", 
      "16 posts monthly", 
      "Community management", 
      "Ad spend management"
    ], 
    popular: true 
  },
  { 
    name: "Professional", 
    price: "Tailored", 
    period: "", 
    features: [
      "5 platforms", 
      "30 posts monthly", 
      "Full ad management", 
      "Influencer outreach"
    ] 
  },
  { 
    name: "Enterprise", 
    price: "Custom", 
    period: "", 
    features: [
      "All platforms", 
      "Unlimited posts", 
      "Complete management", 
      "Tailored to you"
    ],
    isEnterprise: true
  },
];

export default function SocialMedia() {
  return (
    <Layout>
      {/* Hero with Parallax */}
      <PageHero
        eyebrow="Marketing"
        index="10"
        crumbs={[{ label: "Home", href: "/" }, { label: "Social media" }]}
        title="Social media,"
        highlight="run properly"
        body="Planned, posted and answered every week — presence that compounds instead of a feed that goes quiet."
        actions={
          <>
            <Button variant="premium" size="xl" asChild className="group w-full sm:w-auto">
              <Link to="/get-started">
                Get started
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Link to="/packages" className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground sm:justify-start">
              <span className="link-underline">View packages</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </>
        }
      />

      {/* CTA */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-t border-border/60 pt-12"
          >
            <h2 className="heading-md mb-4">
              Bundle with Your <span className="text-gradient">Website</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl">
              Combine any website package with social media management and receive 15% off the total monthly fee.
            </p>
            <Button variant="premium" size="xl" asChild>
              <Link to="/get-started">
                Get Custom Quote <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}