import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Clock, Calendar, ArrowRight, Rocket, Shield, Check } from "lucide-react";

const timelines = [
  {
    tier: "Starter Site",
    price: "Custom Pricing",
    duration: "Days, not weeks",
    pages: "1-2 Pages",
    color: "from-green-500 to-emerald-500",
    phases: [
      { name: "Chat", duration: "Day 1", description: "Tell us about your business and requirements" },
      { name: "Design & Build", duration: "Day 2-4", description: "Custom design and responsive build" },
      { name: "Review & Launch", duration: "Day 5-7", description: "Your feedback, refinements, and go-live" },
    ],
  },
  {
    tier: "Business Site",
    price: "Custom Pricing",
    duration: "1-2 Weeks",
    pages: "2-5 Pages",
    color: "from-primary to-cyan-400",
    phases: [
      { name: "Discovery", duration: "Day 1-2", description: "In-depth consultation and content planning" },
      { name: "Design Phase", duration: "Day 3-6", description: "Custom design mockups and approval" },
      { name: "Development", duration: "Day 7-10", description: "Full build with CMS integration" },
      { name: "Launch", duration: "Day 11-14", description: "Testing, training, and go-live" },
    ],
  },
  {
    tier: "Growth Site",
    price: "Custom Pricing",
    duration: "2-3 Weeks",
    pages: "6-10 Pages",
    color: "from-blue-500 to-cyan-500",
    phases: [
      { name: "Strategy", duration: "Week 1", description: "Requirements, content strategy, UX planning" },
      { name: "Design", duration: "Week 2", description: "Custom design system, all page mockups" },
      { name: "Development", duration: "Week 2-3", description: "Advanced features, blog, lead capture" },
      { name: "Launch", duration: "Week 3", description: "Performance optimisation, testing, training" },
    ],
  },
  {
    tier: "Enterprise & Custom",
    price: "Custom Pricing",
    duration: "Tailored to you",
    pages: "Unlimited",
    color: "from-purple-500 to-pink-500",
    phases: [
      { name: "Discovery", duration: "Variable", description: "Requirements, architecture, planning" },
      { name: "Proposal", duration: "Variable", description: "Custom quote and timeline" },
      { name: "Development", duration: "Variable", description: "Phased build with regular updates" },
      { name: "Launch & Support", duration: "Ongoing", description: "Deployment and partnership" },
    ],
  },
];

export default function Timelines() {
  return (
    <Layout>
      {/* Hero */}
      <PageHero
        eyebrow="Company"
        index="31"
        crumbs={[{ label: "Home", href: "/" }, { label: "Timelines" }]}
        title="Know exactly when"
        highlight="to expect it"
        body="Honest delivery windows for every tier — what happens in each week and what we need from you."
      />

      {/* Trust Signals */}
      <section className="py-8 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-primary/[0.04] to-primary/[0.02]" />
        <div className="container-tight relative z-10">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 border border-border/60 px-4 py-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>No hidden fees</span>
            </div>
            <div className="flex items-center gap-2 border border-border/60 px-4 py-2">
              <Check className="w-4 h-4 text-primary" />
              <span>UK-based support</span>
            </div>
            <div className="flex items-center gap-2 border border-border/60 px-4 py-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Clear timelines</span>
            </div>
          </div>
        </div>
      </section>

      {/* All Timelines */}
      <section className="py-20">
        <div className="container-tight">
          <div className="space-y-12">
            {timelines.map((timeline, index) => (
              <motion.div
                key={timeline.tier}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="border border-border/60 bg-background p-8 group hover:border-primary/50 transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${timeline.color} flex items-center justify-center`}>
                      <Rocket className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-display font-bold">{timeline.tier}</h3>
                      <p className="text-muted-foreground">{timeline.pages} • {timeline.price}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full glass">
                    <Calendar className="w-5 h-5 text-primary" />
                    <span className="font-display font-semibold text-lg">{timeline.duration}</span>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-6">
                    {timeline.phases.map((phase) => (
                      <div key={phase.name} className="relative pl-12">
                        <div className="absolute left-2 top-1 w-4 h-4 rounded-full bg-primary" />
                        <div className="glass p-4 rounded-xl">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                            <h4 className="font-display font-semibold">{phase.name}</h4>
                            <span className="text-sm text-primary font-medium">{phase.duration}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{phase.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border flex justify-end">
                  <Button variant="outline" asChild>
                    <Link to={timeline.tier === "Enterprise & Custom" ? "/enterprise" : `/${timeline.tier.toLowerCase().replace(' site', '').replace(' ', '-')}`}>
                      View {timeline.tier} Details
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card/50">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-border/60 bg-background p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground max-w-2xl mb-8">
              Choose your package and let's get your project on the timeline.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="lg" asChild>
                <Link to="/get-started">Get Started <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/packages">Compare Packages</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
