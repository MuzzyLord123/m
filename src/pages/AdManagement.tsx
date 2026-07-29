import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
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
      <section className="pt-32 pb-20 relative overflow-hidden">
        <ParallaxBackground
          src={adManagement}
          alt="Digital advertising dashboard"
          parallaxSpeed={0.2}
          overlayClassName="bg-gradient-to-b from-background via-background/85 to-background"
        />
        <div className="container-tight relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <motion.div 
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Target className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Ad Management</span>
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-6xl font-display font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Strategic <span className="text-gradient">Advertising</span> That Converts
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Maximize your ROI with data-driven PPC campaigns, social media advertising, and conversion optimization strategies.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button variant="premium" size="lg" asChild>
                <Link to="/get-started">Start Advertising <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/social-media">View Social Media</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Comprehensive Ad Services
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From campaign setup to optimization, we handle every aspect of your digital advertising.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 group hover:border-primary/50 transition-all"
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
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ad Management Packages
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the package that fits your advertising budget and goals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card p-6 relative ${pkg.popular ? 'border-primary' : ''}`}
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
            className="glass-card p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Scale Your Advertising?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
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
