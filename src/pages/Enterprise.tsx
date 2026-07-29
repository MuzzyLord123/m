import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Database, Lock, Users, Globe, Code, Settings, Shield, Headphones, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
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
      <section className="section-padding pt-32 overflow-hidden">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
                <Settings className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Tailored to Your Business</span>
              </div>
              <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
              <h1 className="heading-xl mb-6">
                Enterprise & <span className="text-gradient">Custom Builds</span>
              </h1>
              <div className="text-4xl font-display font-bold text-muted-foreground mb-4">
                Custom Pricing
              </div>
              <p className="text-lg text-muted-foreground mb-4">
                Tailored to your business
              </p>
              <p className="body-lg mb-8">
                For complex websites, web apps, custom integrations, and enterprise-scale platforms. 
                We build exactly what you need.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="premium" size="lg" className="text-sm sm:text-base sm:px-8" asChild>
                  <Link to="/get-started">Contact Us <ArrowRight className="w-4 h-4" /></Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="rounded-3xl liquid-glass-card border border-border/50 p-8">
                <h3 className="font-display font-bold text-2xl mb-6">What We Build:</h3>
                <ul className="space-y-4">
                  {projectTypes.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-8 border-y border-border/50 liquid-glass">
        <div className="container-tight">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 liquid-glass-pill px-4 py-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>No hidden fees</span>
            </div>
            <div className="flex items-center gap-2 liquid-glass-pill px-4 py-2">
              <Check className="w-4 h-4 text-primary" />
              <span>UK-based team</span>
            </div>
            <div className="flex items-center gap-2 liquid-glass-pill px-4 py-2">
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
            className="text-center mb-12"
          >
            <h2 className="heading-md mb-4">
              What We Can <span className="text-gradient">Build</span>
            </h2>
            <p className="body-md max-w-2xl mx-auto">
              From custom web applications to enterprise platforms — 
              we build solutions tailored to your specific needs.
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
                className="p-6 rounded-2xl liquid-glass-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
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
            className="text-center mb-12"
          >
            <h2 className="heading-md mb-4">
              How It <span className="text-gradient">Works</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
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
                <div className="p-6 rounded-2xl liquid-glass-card border border-border/50 text-center">
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
            className="p-8 md:p-12 rounded-3xl liquid-glass-card border border-primary/30 text-center"
          >
            <h2 className="heading-md mb-4">
              Let's Discuss Your <span className="text-gradient">Project</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl mx-auto">
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