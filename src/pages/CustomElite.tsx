import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Crown, Infinity, Users, Rocket, Brain, Shield, Sparkles, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";

const capabilities = [
  { icon: Infinity, title: "Unlimited Scope", description: "No restrictions on site size or complexity" },
  { icon: Brain, title: "Custom Applications", description: "Web apps, SaaS platforms, portals" },
  { icon: Users, title: "Dedicated Team", description: "Your own development team throughout" },
  { icon: Rocket, title: "Bespoke Functionality", description: "Features built specifically for you" },
  { icon: Shield, title: "Enterprise Security", description: "Maximum security protocols" },
  { icon: Sparkles, title: "Ongoing Support", description: "Long-term development partnership" },
];

const projectTypes = [
  "Complex or large-scale websites",
  "Web apps & custom functionality",
  "SaaS platforms and portals",
  "CRM, booking, or API integrations",
  "Multi-location or high-traffic platforms",
  "Long-term development & support",
];

export default function CustomElite() {
  return (
    <Layout>
      {/* Hero */}
      <PageHero
        eyebrow="Packages"
        index="25"
        crumbs={[{ label: "Home", href: "/" }, { label: "Custom Elite" }]}
        title="Custom"
        highlight="Elite"
        body="Fully bespoke systems for one-of-a-kind requirements — designed and engineered from a blank page."
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

      {/* Trust Signals */}
      <section className="py-8 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-primary/[0.04] to-primary/[0.02]" />
        <div className="container-tight">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" />
              <span>No hidden fees</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-gold" />
              <span>UK-based team</span>
            </div>
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-gold" />
              <span>Full code ownership</span>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="section-padding bg-card">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="heading-md mb-4">
              Unlimited <span className="text-gradient-gold">Capabilities</span>
            </h2>
            <p className="body-md max-w-2xl">
              We build exactly what your organisation needs, with no limitations.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {capabilities.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-gold/30 bg-background hover:border-gold/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="heading-md mb-6">
                How It <span className="text-gradient-gold">Works</span>
              </h2>
              <p className="body-md mb-8">
                Every Custom Elite project starts with a conversation to understand 
                your vision and requirements.
              </p>
              <div className="space-y-6">
                {[
                  { step: "1", title: "Discovery Call", desc: "Understand your requirements and vision" },
                  { step: "2", title: "Technical Proposal", desc: "Architecture, timeline, and pricing" },
                  { step: "3", title: "Team Assembly", desc: "Dedicated team assigned to your project" },
                  { step: "4", title: "Agile Development", desc: "Iterative building with regular reviews" },
                  { step: "5", title: "Launch & Support", desc: "Deployment and ongoing partnership" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-gold-foreground">{item.step}</span>
                    </div>
                    <div>
                      <h4 className="font-semibold">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-gradient-card border border-border"
            >
              <h3 className="font-display font-bold text-xl mb-6">Elite Benefits:</h3>
              <ul className="space-y-4">
                {[
                  "Dedicated project manager",
                  "Direct access to development team",
                  "Priority support",
                  "Flexible timeline and scope",
                  "Complete IP ownership",
                  "Source code and documentation",
                  "Training and knowledge transfer",
                  "Ongoing maintenance options",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-gold flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-3xl border-2 border-gold/30 bg-gradient-card glow-gold text-center"
          >
            <Crown className="w-16 h-16 text-gold mx-auto mb-6" />
            <h2 className="heading-md mb-4">
              Let's Build Something <span className="text-gradient-gold">Extraordinary</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl">
              Get in touch to discuss your vision and receive a custom proposal 
              tailored to your organisation's needs.
            </p>
            <Button variant="gold" size="xl" asChild>
              <Link to="/get-started">
                Contact Us to Discuss <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
