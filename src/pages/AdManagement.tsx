import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Target, TrendingUp, BarChart3, Check, MousePointer, RefreshCw, Zap, LineChart, CheckCircle, ArrowRight } from "lucide-react";
import { ParallaxBackground } from "@/components/ParallaxImage";
import { PricingCard3D } from "@/components/Card3D";
import adManagement from "@/assets/ad-management.webp";

const services = [
  {
    icon: Target,
    title: "PPC Campaigns",
    description: "Strategic pay-per-click advertising across Google, Bing, and social platforms with precise audience targeting.",
    features: ["Keyword research & optimization", "Ad copy A/B testing", "Landing page optimization", "Quality score improvement"],
  },
  {
    icon: TrendingUp,
    title: "Social Media Advertising",
    description: "Engaging ad campaigns across Facebook, Instagram, LinkedIn, TikTok, and Twitter to reach your ideal customers.",
    features: ["Audience segmentation", "Creative ad design", "Retargeting campaigns", "Lookalike audiences"],
  },
  {
    icon: BarChart3,
    title: "Google Ads Management",
    description: "Full-service Google Ads management including Search, Display, Shopping, and YouTube campaigns.",
    features: ["Campaign structure optimization", "Bid strategy management", "Conversion tracking", "Performance reporting"],
  },
  {
    icon: RefreshCw,
    title: "Retargeting Strategies",
    description: "Re-engage visitors who've shown interest with strategic remarketing across multiple platforms.",
    features: ["Pixel implementation", "Custom audience creation", "Dynamic product ads", "Cross-platform retargeting"],
  },
  {
    icon: MousePointer,
    title: "Conversion Optimization",
    description: "Maximize your ad spend ROI with data-driven optimization and conversion rate improvements.",
    features: ["Funnel analysis", "CTA optimization", "Form optimization", "Heat map analysis"],
  },
  {
    icon: LineChart,
    title: "Analytics & Reporting",
    description: "Comprehensive reporting with actionable insights to continuously improve campaign performance.",
    features: ["Custom dashboards", "ROI tracking", "Attribution modeling", "Monthly strategy reviews"],
  },
];

const packages = [
  {
    name: "Starter Ads",
    price: "Tailored",
    period: "",
    adSpend: "For smaller budgets",
    features: ["1 platform management", "Basic campaign setup", "Weekly optimization", "Monthly reporting"],
  },
  {
    name: "Growth Ads",
    price: "Tailored",
    period: "",
    adSpend: "For growing businesses",
    features: ["3 platform management", "Advanced targeting", "Bi-weekly optimization", "Bi-weekly reporting"],
    popular: true,
  },
  {
    name: "Professional Ads",
    price: "Tailored",
    period: "",
    adSpend: "For scaling businesses",
    features: ["All platforms", "Full funnel strategy", "Weekly optimization", "Weekly reporting + calls"],
  },
  {
    name: "Enterprise Ads",
    price: "Custom",
    period: "",
    adSpend: "Unlimited ad spend",
    features: ["Dedicated team", "Custom integrations", "Daily optimization", "Real-time dashboards"],
  },
];

export default function AdManagement() {
  return (
    <Layout>
      {/* Hero with Parallax */}
      <PageHero
        eyebrow="Marketing"
        index="11"
        crumbs={[{ label: "Home", href: "/" }, { label: "Ad management" }]}
        title="Ads that earn"
        highlight="their budget"
        body="PPC and paid social with the spend, targeting and results reported to you like an owner, not a spectator."
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

      {/* Services Grid */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Comprehensive Ad Services
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              From campaign setup to optimization, we handle every aspect of your digital advertising.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-border/60">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-r border-border/60 p-8 group hover:border-primary/50 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Zap className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 bg-card/50">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ad Management Packages
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Choose the package that fits your advertising budget and goals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-border/60">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`border-b border-r border-border/60 p-6 relative ${pkg.popular ? 'border-primary' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-display font-semibold mb-2">{pkg.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-display font-bold">{pkg.price}</span>
                  <span className="text-muted-foreground">{pkg.period}</span>
                </div>
                <p className="text-sm text-primary mb-4">{pkg.adSpend}</p>
                <ul className="space-y-2 mb-6">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary" strokeWidth={2.5} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={pkg.popular ? "hero" : "outline"} className="w-full" asChild>
                  <Link to="/get-started">Get Started</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-border/60 bg-background p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Scale Your Advertising?
            </h2>
            <p className="text-muted-foreground max-w-2xl mb-8">
              Let's create high-converting ad campaigns that drive real results for your business.
            </p>
            <Button variant="premium" size="lg" asChild>
              <Link to="/get-started">Start Your Campaign <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
