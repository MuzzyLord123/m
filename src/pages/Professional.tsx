import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, FileText, TrendingUp, Rss, Settings, Zap, Search, ArrowRight, Shield } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
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
      <section className="section-padding pt-32 overflow-hidden">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">For Businesses Ready to Scale</span>
              </div>
              <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
              <h1 className="heading-xl mb-6">
                Growth <span className="text-gradient">Site</span>
              </h1>
              <div className="text-5xl font-display font-bold text-gradient mb-4">Tailored Pricing</div>
              <p className="body-lg mb-4">
                For businesses ready to scale. More pages, advanced features, 
                and everything you need to grow your online presence.
              </p>
              <p className="text-muted-foreground mb-8">
                Lead capture, content hub, and performance optimisation included.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="premium" size="xl" asChild>
                  <Link to="/get-started">Book a Strategy Call <ArrowRight className="w-4 h-4" /></Link>
                </Button>
                <Button variant="glass" size="xl" asChild>
                  <Link to="/packages">Compare Packages</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative"
            >
              <div className="rounded-3xl liquid-glass-card border border-border/50 p-8">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm font-medium text-primary">2-3 Week Delivery</span>
                </div>
                <h3 className="font-display font-bold text-2xl mb-6">Key Features:</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "6-10 pages",
                    "Lead capture",
                    "Blog setup",
                    "Advanced SEO",
                    "Performance optimised",
                    "CMS included",
                    "Automation",
                    "Full support",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
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
              <span>UK-based support</span>
            </div>
            <div className="flex items-center gap-2 liquid-glass-pill px-4 py-2">
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
            className="text-center mb-12"
          >
            <h2 className="heading-md mb-4">
              Built for <span className="text-gradient">Growth</span>
            </h2>
            <p className="body-md max-w-2xl mx-auto">
              Everything you need to scale your online presence and capture more leads.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl liquid-glass-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
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
            className="text-center mb-12"
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
                className="flex items-center gap-3 p-3 rounded-lg liquid-glass-card border border-border/50"
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
            className="p-8 md:p-12 rounded-3xl liquid-glass-card border border-border/50"
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
        <div className="container-tight text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl liquid-glass-card border border-border/50"
          >
            <h2 className="heading-md mb-4">
              Ready to <span className="text-gradient">Scale?</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl mx-auto">
              Get a website built for growth with lead capture, content hub, 
              and everything you need to scale.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
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