import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Gift, Zap, Info, Shield, Heart } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const previewTiers = [
  {
    name: "Free Preview",
    price: "Free",
    pages: "Up to 5 Pages",
    timeline: "1 Week",
    description: "Perfect for Starter & Business sites",
    icon: Gift,
    features: [
      "Fully functional preview site",
      "Mobile responsive design",
      "Custom coded — no templates",
      "Professional design concepts",
      "1 week delivery",
      "No obligation to purchase",
      "Full transparency throughout"
    ],
    eligible: ["Starter Site", "Business Site"],
    cta: "Get Free Preview",
    popular: true,
    variant: "hero" as const
  },
  {
    name: "Growth Preview",
    price: "Deposit Required",
    pages: "6-10 Pages",
    timeline: "3-5 Days",
    description: "For Growth site projects",
    icon: Zap,
    features: [
      "Priority development queue",
      "Senior developer assigned",
      "Accelerated 3-5 day delivery",
      "Advanced functionality demo",
      "Lead capture preview",
      "Fee credited on purchase",
      "Dedicated project manager"
    ],
    eligible: ["Growth Site"],
    cta: "Start Preview",
    variant: "outline" as const
  },
  {
    name: "Enterprise Preview",
    price: "Custom",
    pages: "Complex projects",
    timeline: "Variable",
    description: "For enterprise & custom builds",
    icon: Zap,
    features: [
      "Bespoke preview scope",
      "Full dedicated team",
      "Custom timeline agreed",
      "Complex functionality demo",
      "Advanced integrations",
      "Fee credited on purchase",
      "White-glove service"
    ],
    eligible: ["Enterprise & Custom"],
    cta: "Contact Us to Discuss",
    variant: "outline" as const
  }
];

const faqItems = [
  {
    q: "Is the preview fee separate from the final site cost?",
    a: "For paid previews (Growth and Enterprise), the preview fee is credited toward your final purchase. If you buy the site, you effectively got the preview free."
  },
  {
    q: "Why charge for larger site previews?",
    a: "Complex sites require significant professional development time. The upfront fee ensures fair compensation while demonstrating serious commitment from both parties."
  },
  {
    q: "What if I don't like the preview?",
    a: "For free previews, there's no obligation — you simply walk away. For paid previews, we offer revision rounds to address concerns."
  },
  {
    q: "Can I get a refund on the preview fee?",
    a: "Preview fees are non-refundable as they compensate our team for custom development work. However, the fee is credited if you proceed with the full site purchase."
  }
];

export default function PreviewPricing() {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding pt-32">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
              <Gift className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Preview Pricing</span>
            </div>
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="heading-xl mb-6">
              See Before You <span className="text-gradient">Buy</span>
            </h1>
            <p className="body-lg">
              Free previews for smaller sites, fair pricing for complex builds. 
              All paid preview fees are credited toward your final purchase.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-8 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-primary/[0.04] to-primary/[0.02]" />
        <div className="container-tight relative z-10">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 liquid-glass-pill px-4 py-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>No hidden fees</span>
            </div>
            <div className="flex items-center gap-2 liquid-glass-pill px-4 py-2">
              <Heart className="w-4 h-4 text-primary" />
              <span>UK-based support</span>
            </div>
            <div className="flex items-center gap-2 liquid-glass-pill px-4 py-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Preview fee credited on purchase</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="grid md:grid-cols-3 gap-6">
            {previewTiers.map((tier, index) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                  tier.popular
                    ? "border-primary bg-primary/5 scale-105"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    Most Popular
                  </div>
                )}

                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <tier.icon className="w-6 h-6 text-primary" />
                </div>

                <h3 className="font-display font-bold text-lg mb-1">{tier.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{tier.description}</p>

                <div className="text-3xl font-bold mb-1 text-gradient">
                  {tier.price}
                </div>
                <p className="text-sm text-muted-foreground mb-1">{tier.pages}</p>
                <p className="text-sm text-primary font-medium mb-6">{tier.timeline} delivery</p>

                <ul className="space-y-2 mb-6">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mb-6 p-3 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-1">Eligible for:</p>
                  {tier.eligible.map((t) => (
                    <span key={t} className="text-xs font-medium text-primary block">{t}</span>
                  ))}
                </div>

                <Button variant={tier.variant} className="w-full" asChild>
                  <Link to="/get-started">{tier.cta}</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Credit Explanation */}
      <section className="section-padding bg-card">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl border border-primary/30 bg-gradient-card"
          >
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Info className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="heading-sm mb-4">
                  How Preview <span className="text-gradient">Credits Work</span>
                </h3>
                <p className="body-md mb-4">
                  When you pay for a preview and decide to proceed with the full site purchase, 
                  your preview fee is <strong>fully credited</strong> toward the final invoice.
                </p>
                <p className="text-muted-foreground">
                  <strong>Example:</strong> You pay a deposit for a Growth preview. 
                  If you proceed with the full Growth Site, the deposit is credited toward your final invoice. 
                  The preview was effectively free.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding">
        <div className="container-tight">
          <h2 className="heading-md text-center mb-12">
            Preview Pricing <span className="text-gradient">FAQ</span>
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card"
              >
                <h3 className="font-display font-bold text-lg mb-2">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card">
        <div className="container-tight text-center">
          <h2 className="heading-md mb-6">
            Ready to See Your <span className="text-gradient">Vision?</span>
          </h2>
          <p className="body-lg max-w-2xl mx-auto mb-8">
            Start with a free preview for smaller sites, or get in touch to discuss complex builds.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="premium" size="xl" asChild>
              <Link to="/get-started">
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/packages">View All Packages</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
