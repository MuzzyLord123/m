import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Eye, TrendingUp, Users, Star, Wrench, Camera, Cake, Dumbbell, ShoppingBag, Rocket } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const previewExamples = [
  {
    tier: "Starter",
    business: "Local Plumber",
    previewDelivery: "5 days",
    outcome: "Converted to live site",
    pages: 2,
    result: "Thrilled with the design",
    icon: Wrench,
    testimonial: "The free preview convinced me immediately. Professional quality without any risk — exactly what I needed."
  },
  {
    tier: "Starter",
    business: "Freelance Photographer",
    previewDelivery: "6 days",
    outcome: "Converted to live site",
    pages: 2,
    result: "Loved the final result",
    icon: Camera,
    testimonial: "I could see exactly what I was getting before committing. The design captured my style perfectly."
  },
  {
    tier: "Growth",
    business: "Boutique Bakery",
    previewDelivery: "6 days",
    outcome: "Upgraded to Professional",
    pages: 5,
    result: "Exceeded expectations",
    icon: Cake,
    testimonial: "Started with Growth preview, loved it so much we went Professional. Couldn't be happier with the quality."
  },
  {
    tier: "Growth",
    business: "Fitness Studio",
    previewDelivery: "7 days",
    outcome: "Converted to live site",
    pages: 5,
    result: "Modern and professional",
    icon: Dumbbell,
    testimonial: "The preview process was transparent and the quality exceeded expectations. Highly recommend."
  },
  {
    tier: "Professional",
    business: "Fashion Boutique",
    previewDelivery: "5 days (fast-track)",
    outcome: "Converted to live site",
    pages: 10,
    result: "Beautiful e-commerce site",
    icon: ShoppingBag,
    testimonial: "The fast-track preview fee was worth every penny. My customers love the new shopping experience."
  },
  {
    tier: "Enterprise",
    business: "Tech Consultancy",
    previewDelivery: "7 days (fast-track)",
    outcome: "Ongoing partnership",
    pages: 15,
    result: "Professional and scalable",
    icon: Rocket,
    testimonial: "Complex requirements handled perfectly. The team understood our vision from day one."
  }
];

const stats = [
  { value: "94%", label: "Preview to Purchase Rate" },
  { value: "500+", label: "Previews Delivered" },
  { value: "1 Week", label: "Average Preview Time" },
  { value: "100%", label: "Client Satisfaction" }
];

export default function PreviewPortfolio() {
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
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Preview Portfolio</span>
            </div>
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="heading-xl mb-6">
              See Our <span className="text-gradient">Preview Work</span>
            </h1>
            <p className="body-lg">
              Browse real examples of previews that became successful live sites. 
              Every preview is hand-coded by our professional team - no templates, no shortcuts.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-primary/[0.05] to-primary/[0.02]" />
        <div className="container-tight relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="text-3xl md:text-4xl font-display font-bold text-gradient mb-2 transition-transform duration-300 group-hover:scale-110">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview Examples */}
      <section className="section-padding">
        <div className="container-tight">
          <h2 className="heading-md text-center mb-12">
            Previews That <span className="text-gradient">Converted</span>
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {previewExamples.map((example, index) => (
              <motion.div
                key={example.business}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <example.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    example.tier === "Starter" || example.tier === "Growth"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-primary/20 text-primary"
                  }`}>
                    {example.tier === "Starter" || example.tier === "Growth" 
                      ? "Free Preview" 
                      : "Fast-Track"}
                  </span>
                </div>

                <h3 className="font-display font-bold text-lg mb-1">{example.business}</h3>
                <p className="text-sm text-muted-foreground mb-4">{example.tier} Tier • {example.pages} Pages</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Eye className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">Preview: {example.previewDelivery}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{example.result}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Star className="w-4 h-4 text-primary" />
                    <span className="text-muted-foreground">{example.outcome}</span>
                  </div>
                </div>

                <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary pl-3">
                  "{example.testimonial}"
                </blockquote>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto"
          >
            <h2 className="heading-md mb-6">
              Ready to See Your <span className="text-gradient">Preview?</span>
            </h2>
            <p className="body-lg mb-8">
              Join hundreds of satisfied clients who saw their vision come to life before committing.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="premium" size="xl" asChild>
                <Link to="/get-started">
                  Get Your Free Preview <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/preview-process">Learn The Process</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
