import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Check, X, ArrowRight, Phone, Mail, Shield, Zap, Heart } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { PricingCard3D } from "@/components/Card3D";
import pricingAbstract from "@/assets/pricing-abstract.jpg";

const websitePackages = [
  {
    name: "Starter Site",
    price: "Tailored Pricing",
    timeline: "Days, not weeks",
    description: "Perfect for pubs, tradesmen & local services",
    features: {
      pages: "1-2 pages",
      responsive: true,
      contactForm: true,
      basicSeo: true,
      googleMaps: true,
      fastLoading: true,
      callToAction: true,
      ownership: true,
    },
    href: "/starter",
    popular: false,
    cta: "Get Started",
  },
  {
    name: "Business Site",
    price: "Tailored Pricing",
    timeline: "1-2 weeks",
    description: "For growing local businesses that want more credibility",
    features: {
      pages: "2-5 pages",
      responsive: true,
      contactForm: true,
      basicSeo: true,
      cms: true,
      customDesign: true,
      conversionFocused: true,
      ownership: true,
    },
    href: "/growth",
    popular: true,
    cta: "Request a Quote",
  },
  {
    name: "Growth Site",
    price: "Tailored Pricing",
    timeline: "2-3 weeks",
    description: "For businesses ready to scale",
    features: {
      pages: "6-10 pages",
      responsive: true,
      contactForm: true,
      advancedSeo: true,
      cms: true,
      leadCapture: true,
      blog: true,
      performance: true,
    },
    href: "/professional",
    popular: false,
    cta: "Book a Strategy Call",
  },
  {
    name: "Enterprise & Custom",
    price: "Custom Pricing",
    timeline: "Tailored to you",
    description: "Complex or large-scale websites",
    features: {
      pages: "Unlimited",
      webApps: true,
      apiIntegration: true,
      multiLocation: true,
      crm: true,
      booking: true,
      longTermSupport: true,
      dedicated: true,
    },
    href: "/get-started",
    popular: false,
    isEnterprise: true,
    cta: "Contact Us",
  },
];

const featureLabels: Record<string, string> = {
  pages: "Number of Pages",
  responsive: "Mobile-First Design",
  contactForm: "Contact Form",
  basicSeo: "Basic SEO Setup",
  advancedSeo: "Advanced SEO",
  googleMaps: "Google Maps Integration",
  fastLoading: "Fast-Loading Build",
  callToAction: "Clear Call-to-Actions",
  cms: "CMS for Easy Edits",
  customDesign: "Bespoke Layout",
  conversionFocused: "Conversion-Focused",
  leadCapture: "Lead Capture & Automation",
  blog: "Blog / Content Hub",
  performance: "Performance Optimised",
  webApps: "Web Apps & Custom Functionality",
  apiIntegration: "CRM, Booking & API Integrations",
  multiLocation: "Multi-Location Support",
  crm: "CRM Integration",
  booking: "Booking Systems",
  longTermSupport: "Long-Term Development",
  dedicated: "Dedicated Support",
  ownership: "Full Code Ownership",
};

const trustSignals = [
  { icon: Shield, text: "No hidden fees" },
  { icon: Heart, text: "UK-based support" },
  { icon: Zap, text: "Built to convert, not just look good" },
];

export default function Pricing() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);
  const imageOpacity = useTransform(scrollYProgress, [0, 0.5], [0.4, 0.15]);

  return (
    <Layout>
      {/* Hero with Parallax Premium Image */}
      <section ref={heroRef} className="section-padding pt-32 relative overflow-hidden">
        <motion.div 
          className="absolute top-20 right-0 w-1/2 h-[600px] pointer-events-none"
          style={{ y: imageY, scale: imageScale, opacity: imageOpacity }}
        >
          <img 
            src={pricingAbstract} 
            alt="Premium pricing tiers" 
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-background/30 to-background" />
        </motion.div>
        <div className="container-tight relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <motion.h1 
              className="heading-xl mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Clear Pricing, <span className="text-gradient">No Nonsense</span>
            </motion.h1>
            <motion.p 
              className="body-lg mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Professional websites for businesses — serving clients locally, nationwide, and worldwide. 
              Transparent pricing that works for startups, SMEs, and enterprises alike.
            </motion.p>
            <motion.div 
              className="flex flex-wrap gap-6 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {trustSignals.map((signal, index) => (
                <motion.div 
                  key={signal.text} 
                  className="flex items-center gap-2 text-sm text-muted-foreground liquid-glass-pill px-4 py-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <signal.icon className="w-4 h-4 text-primary" />
                  <span>{signal.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Website Packages */}
      <section className="section-padding pt-8">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-md mb-3">
              Website <span className="text-gradient">Packages</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Choose the perfect plan for your business — all include free design preview before you commit.</p>
          </motion.div>

          {/* 3D Cards Layout */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {websitePackages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <PricingCard3D
                  isPopular={pkg.popular}
                  isEnterprise={pkg.isEnterprise}
                  className="h-full"
                >
                  <div className="flex flex-col h-full">
                    {pkg.popular && (
                      <div className="inline-block px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold mb-4 w-fit whitespace-nowrap">
                        Most Popular
                      </div>
                    )}
                    
                    <h3 className="font-display font-bold text-xl mb-2">{pkg.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>
                    
                    <div className={`text-2xl sm:text-3xl font-bold mb-2 ${pkg.isEnterprise ? "text-muted-foreground" : "text-gradient"}`}>
                      {pkg.price}
                    </div>
                    <div className="text-sm text-muted-foreground mb-6">{pkg.timeline}</div>
                    
                    <ul className="space-y-2 mb-6 flex-1">
                      {Object.entries(pkg.features).slice(0, 6).map(([key, value]) => (
                        <li key={key} className="flex items-center gap-2 text-sm">
                          {typeof value === "boolean" ? (
                            value ? (
                              <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            ) : (
                              <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                            )
                          ) : (
                            <Check className="w-4 h-4 text-primary flex-shrink-0" />
                          )}
                          <span className="text-muted-foreground">
                            {typeof value === "string" ? value : featureLabels[key]}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      variant={pkg.popular ? "premium" : "glass"}
                      className="w-full mt-auto"
                      asChild
                    >
                      <Link to={pkg.href}>{pkg.cta}</Link>
                    </Button>
                  </div>
                </PricingCard3D>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Section */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl liquid-glass-card border border-border/50"
          >
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="heading-md mb-4">
                  Need Something <span className="text-gradient">More Complex?</span>
                </h2>
                <p className="body-md mb-6">
                  For web apps, custom functionality, CRM integrations, booking systems, 
                  or multi-location platforms — we tailor everything to your business.
                </p>
                <ul className="space-y-3 mb-6">
                  {[
                    "Complex or large-scale websites",
                    "Web apps & custom functionality",
                    "CRM, booking, or API integrations",
                    "Multi-location or high-traffic platforms",
                    "Long-term development & support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center lg:text-right">
                <p className="text-sm text-muted-foreground mb-4">Custom pricing — tailored to your business</p>
                <Button variant="premium" size="xl" asChild>
                  <Link to="/get-started">
                    Contact Us for More Information <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding">
        <div className="container-tight">
          <h2 className="heading-md text-center mb-12">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {[
              {
                q: "Do I own the code and design?",
                a: "Yes, 100%. You receive complete ownership of all code, design files, and assets. No vendor lock-in.",
              },
              {
                q: "What's included in the price?",
                a: "All packages include mobile-responsive design, contact forms, basic SEO, SSL certificate setup, and hosting migration assistance.",
              },
              {
                q: "How fast can you deliver?",
                a: "Starter sites can be ready in days. Business sites typically take 1-2 weeks. We focus on quality and speed.",
              },
              {
                q: "Are there any hidden fees?",
                a: "No hidden fees, ever. The price you see is the price you pay. Hosting and domain are separate ongoing costs.",
              },
              {
                q: "Do you offer ongoing support?",
                a: "Yes, we offer maintenance packages for all tiers. We're UK-based and here when you need us.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl liquid-glass-card border border-border/50"
              >
                <h3 className="font-display font-semibold text-lg mb-2">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-tight text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl liquid-glass-card border border-border/50"
          >
            <h2 className="heading-md mb-4">
              Ready to Get <span className="text-gradient">Started?</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl mx-auto">
              Get a professional website that works as hard as you do. 
              No jargon, no fuss — just results.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="premium" size="xl" asChild>
                <Link to="/get-started">
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/portfolio">View Our Work</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}