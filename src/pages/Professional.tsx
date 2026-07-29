import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, FileText, TrendingUp, Rss, Settings, Zap, Search, ArrowRight, Shield } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";

const features = [
  { icon: FileText, title: "6-10 Pages", description: "Comprehensive site with room to grow" },
  { icon: Settings, title: "Advanced UX", description: "Thoughtful page structure and user flows" },
  { icon: Zap, title: "Lead Capture", description: "Automation setup to capture and nurture leads" },
  { icon: Rss, title: "Blog / Content Hub", description: "Establish authority with regular content" },
  { icon: Search, title: "Advanced SEO", description: "Deep optimisation for search rankings" },
  { icon: TrendingUp, title: "Performance", description: "Speed optimised for better conversions" },
];

const included = [
  "6-10 custom-designed pages",
  "Advanced UX & page structure",
  "Lead capture & automation setup",
  "Blog or content hub",
  "Performance optimisation",
  "Advanced on-page SEO",
  "CMS with full training",
  "Contact forms with automation",
  "Social media integration",
  "Google Analytics & tracking",
  "SSL certificate",
  "Complete code ownership",
  "UK-based support",
  "Mobile-responsive design",
  "60-day post-launch support",
];

export default function Professional() {
  return (
    <Layout>
      {/* Hero */}
      <PageHero
        eyebrow="Packages"
        index="23"
        crumbs={[{ label: "Home", href: "/" }, { label: "Growth site" }]}
        title="The Growth"
        highlight="site"
        body="Custom design and deeper integrations for businesses whose website has to carry real weight."
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
              <span>UK-based support</span>
            </div>
            <div className="flex items-center gap-2 border border-border/60 px-4 py-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>Built to convert</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="heading-md mb-4">
              Built for <span className="text-gradient">Growth</span>
            </h2>
            <p className="body-md max-w-2xl">
              Everything you need to scale your online presence and capture more leads.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-border/60">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 border-b border-r border-border/60 transition-colors duration-300 hover:bg-foreground/[0.02]"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center border border-primary/25 bg-primary/[0.06]">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Full Feature List */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="heading-md mb-4">
              Everything <span className="text-gradient">Included</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {included.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-lg border border-border/60 bg-background"
              >
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-sm">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Need More Section */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-t border-border/60 pt-12"
          >
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="heading-md mb-4">
                  Need Something <span className="text-gradient">More Complex?</span>
                </h2>
                <p className="body-md mb-6">
                  For web apps, e-commerce, custom integrations, or enterprise-scale platforms, 
                  we offer custom solutions tailored to your specific needs.
                </p>
                <ul className="space-y-3">
                  {[
                    "Web apps & custom functionality",
                    "E-commerce & booking systems",
                    "CRM & API integrations",
                    "Multi-location platforms",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="text-center lg:text-right">
                <p className="text-sm text-muted-foreground mb-4">Custom pricing — tailored to your business</p>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/get-started">Contact Us to Discuss</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border-t border-border/60 pt-12"
          >
            <h2 className="heading-md mb-4">
              Ready to <span className="text-gradient">Scale?</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl">
              Get a website built for growth with lead capture, content hub, 
              and everything you need to scale.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="premium" size="xl" asChild>
                <Link to="/get-started">Book a Strategy Call <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/portfolio">View Examples</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}