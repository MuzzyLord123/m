import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Database, Lock, Users, Globe, Code, Settings, Shield, Headphones, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";

const capabilities = [
  { icon: Database, title: "Custom Databases", description: "Tailored database architecture for your needs" },
  { icon: Code, title: "Web Apps", description: "Custom web applications and platforms" },
  { icon: Users, title: "CRM Integration", description: "Connect to your existing business systems" },
  { icon: Lock, title: "Booking Systems", description: "Online booking and scheduling" },
  { icon: Globe, title: "Multi-Location", description: "Support for multiple locations or regions" },
  { icon: Headphones, title: "Dedicated Support", description: "Long-term development and support" },
];

const projectTypes = [
  "Complex or large-scale websites",
  "Web apps & custom functionality",
  "CRM, booking, or API integrations",
  "Multi-location or high-traffic platforms",
  "E-commerce with custom requirements",
  "Long-term development & support",
];

export default function Enterprise() {
  return (
    <Layout>
      {/* Hero */}
      <PageHero
        eyebrow="Packages"
        index="24"
        crumbs={[{ label: "Home", href: "/" }, { label: "Enterprise" }]}
        title="Enterprise"
        highlight="builds"
        body="Complex platforms, integrations and multi-site estates — scoped properly and delivered in stages."
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
      <section className="py-8 border-y border-border/60">
        <div className="container-tight">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 border border-border/60 px-4 py-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>No hidden fees</span>
            </div>
            <div className="flex items-center gap-2 border border-border/60 px-4 py-2">
              <Check className="w-4 h-4 text-primary" />
              <span>UK-based team</span>
            </div>
            <div className="flex items-center gap-2 border border-border/60 px-4 py-2">
              <Lock className="w-4 h-4 text-primary" />
              <span>Full code ownership</span>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="heading-md mb-4">
              What We Can <span className="text-gradient">Build</span>
            </h2>
            <p className="body-md max-w-2xl">
              From custom web applications to enterprise platforms — 
              we build solutions tailored to your specific needs.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-border/60">
            {capabilities.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 border-b border-r border-border/60 transition-colors duration-300 hover:bg-foreground/[0.02]"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center border border-primary/25 bg-primary/[0.06]">
                  <item.icon className="w-6 h-6 text-primary" />
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="heading-md mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-0 border-l border-t border-border/60">
            {[
              { step: "1", title: "Discovery", desc: "We discuss your requirements and goals" },
              { step: "2", title: "Proposal", desc: "You receive a tailored quote and timeline" },
              { step: "3", title: "Build", desc: "We develop your custom solution" },
              { step: "4", title: "Launch", desc: "Your platform goes live with full support" },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <div className="p-6 border-b border-r border-border/60 text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg font-bold text-primary-foreground">{item.step}</span>
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 border border-primary/30 bg-background text-center"
          >
            <h2 className="heading-md mb-4">
              Let's Discuss Your <span className="text-gradient">Project</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl">
              Every enterprise project is unique. Get in touch to discuss your requirements 
              and receive a tailored proposal.
            </p>
            <Button variant="premium" size="xl" asChild>
              <Link to="/get-started">
                Contact Us for More Information <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}