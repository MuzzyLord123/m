import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Smartphone, Lock, Search, Share2, BarChart3, Zap, 
  Palette, Code, Database, Shield, Globe, Headphones,
  CheckCircle, X, ArrowRight
} from "lucide-react";

const allFeatures = [
  {
    icon: Smartphone,
    title: "Responsive Design",
    description: "Every site looks perfect on desktop, tablet, and mobile devices.",
    tiers: ["starter", "growth", "professional", "enterprise", "elite"],
  },
  {
    icon: Lock,
    title: "SSL Certificate",
    description: "Free SSL encryption to keep your site and visitors secure.",
    tiers: ["starter", "growth", "professional", "enterprise", "elite"],
  },
  {
    icon: Search,
    title: "Basic SEO",
    description: "Meta tags, sitemap, and search engine optimization fundamentals.",
    tiers: ["starter", "growth", "professional", "enterprise", "elite"],
  },
  {
    icon: Share2,
    title: "Social Integration",
    description: "Connect your social media profiles and enable sharing.",
    tiers: ["starter", "growth", "professional", "enterprise", "elite"],
  },
  {
    icon: BarChart3,
    title: "Google Analytics",
    description: "Track visitor behavior and site performance.",
    tiers: ["growth", "professional", "enterprise", "elite"],
  },
  {
    icon: Code,
    title: "CMS Integration",
    description: "Content management system for easy updates.",
    tiers: ["growth", "professional", "enterprise", "elite"],
  },
  {
    icon: Palette,
    title: "Custom Design",
    description: "Unique design tailored to your brand identity.",
    tiers: ["professional", "enterprise", "elite"],
  },
  {
    icon: Zap,
    title: "Performance Optimization",
    description: "Lightning-fast loading speeds and Core Web Vitals optimization.",
    tiers: ["professional", "enterprise", "elite"],
  },
  {
    icon: Database,
    title: "E-commerce Ready",
    description: "Online store functionality with payment processing.",
    tiers: ["professional", "enterprise", "elite"],
  },
  {
    icon: Shield,
    title: "Advanced Security",
    description: "Enhanced security protocols and regular security audits.",
    tiers: ["enterprise", "elite"],
  },
  {
    icon: Globe,
    title: "API Connections",
    description: "Integration with third-party services and custom APIs.",
    tiers: ["enterprise", "elite"],
  },
  {
    icon: Headphones,
    title: "Priority Support",
    description: "Dedicated support with faster response times.",
    tiers: ["enterprise", "elite"],
  },
];

const tierDetails = [
  { id: "starter", name: "Starter", price: "Tailored" },
  { id: "growth", name: "Growth", price: "Tailored" },
  { id: "professional", name: "Professional", price: "Tailored" },
  { id: "enterprise", name: "Enterprise", price: "Custom" },
  { id: "elite", name: "Custom Elite", price: "Bespoke" },
];

export default function Features() {
  return (
    <Layout>
      {/* Hero with Parallax Image */}
      <section className="relative overflow-hidden border-b border-border/60 pb-16 pt-24 sm:pb-20 sm:pt-28">
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
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Feature Breakdown</span>
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-6xl font-display font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Everything <span className="text-gradient">Included</span> in Your Site
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Comprehensive breakdown of what you get with each tier.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container-tight">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
            {allFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -6, transition: { duration: 0.3 } }}
                className="glass-card p-6 group relative overflow-hidden"
              >
                {/* Hover gradient fill */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex items-start gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                    <div className="flex gap-1">
                      {tierDetails.map((tier) => (
                        <div
                          key={tier.id}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            feature.tiers.includes(tier.id)
                              ? 'bg-primary/20 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                          title={tier.name}
                        >
                          {feature.tiers.includes(tier.id) ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <X className="w-3 h-3" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-card/50">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Feature Comparison
            </h2>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-display">Feature</th>
                  {tierDetails.map((tier) => (
                    <th key={tier.id} className="text-center p-4">
                      <div className="font-display font-semibold">{tier.name}</div>
                      <div className="text-sm text-primary">{tier.price}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature) => (
                  <tr key={feature.title} className="border-b border-border/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <feature.icon className="w-5 h-5 text-muted-foreground" />
                        <span className="font-medium">{feature.title}</span>
                      </div>
                    </td>
                    {tierDetails.map((tier) => (
                      <td key={tier.id} className="text-center p-4">
                        {feature.tiers.includes(tier.id) ? (
                          <CheckCircle className="w-5 h-5 text-primary mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
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
              Find the Perfect Tier for You
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Not sure which tier is right? Let's discuss your needs and find the best fit.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="lg" asChild>
                <Link to="/get-started">Get Started <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/packages">View Packages</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
