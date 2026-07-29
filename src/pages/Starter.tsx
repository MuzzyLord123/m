import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Clock, Smartphone, Mail, Search, Shield, ArrowRight, Zap, MapPin, Phone } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Smartphone, title: "Mobile-First Design", description: "Perfect display on all devices and screen sizes" },
  { icon: Zap, title: "Fast-Loading Build", description: "Lightning-fast loading speeds that keep visitors engaged" },
  { icon: Phone, title: "Clear Call-to-Actions", description: "Calls, bookings, and enquiries made easy" },
  { icon: Mail, title: "Contact Form", description: "Professional contact form with email notifications" },
  { icon: MapPin, title: "Google Maps", description: "Help customers find you with integrated maps" },
  { icon: Search, title: "Basic SEO Setup", description: "On-page optimisation to help you get found" },
];

const included = [
  "1-2 professionally designed pages",
  "Mobile-first, fast-loading build",
  "Clear call-to-actions (calls, bookings, enquiries)",
  "Contact form with email integration",
  "Google Maps integration",
  "Basic SEO setup",
  "Social media link integration",
  "SSL certificate setup",
  "Complete source code ownership",
  "Launch-ready in days, not weeks",
];

const perfectFor = [
  "Pubs & restaurants",
  "Tradesmen & contractors",
  "Local services",
  "Small retail shops",
  "Personal portfolios",
  "Event announcements",
];

export default function Starter() {
  return (
    <Layout>
      {/* Hero */}
      <PageHero
        eyebrow="Packages"
        index="21"
        crumbs={[{ label: "Home", href: "/" }, { label: "Starter site" }]}
        title="The Starter"
        highlight="site"
        body="A fast, focused site that gets a local business found and contacted — live in days, not months."
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

      {/* Features Grid */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="heading-md mb-4">
              Everything You Need to <span className="text-gradient">Get Found</span>
            </h2>
            <p className="body-md max-w-2xl">
              A professional web presence that works as hard as you do.
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
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 border border-border/60 bg-background"
            >
              <h2 className="heading-md mb-8">
                Complete <span className="text-gradient">Package</span>
              </h2>
              <ul className="space-y-4">
                {included.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="heading-md mb-8">
                Perfect <span className="text-gradient">For</span>
              </h2>
              <ul className="space-y-4 mb-8">
                {perfectFor.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <ArrowRight className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="p-6 border border-primary/30 bg-background">
                <h4 className="font-display font-semibold mb-2">Need More Pages?</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Growing business? Our Business Site package includes up to 5 pages 
                  with CMS access for easy updates.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/growth">View Business Site</Link>
                </Button>
              </div>
            </motion.div>
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
              Simple <span className="text-gradient">Process</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-0 border-l border-t border-border/60">
            {[
              { step: "1", title: "Chat", desc: "Tell us about your business and what you need" },
              { step: "2", title: "Design", desc: "We create your custom site design" },
              { step: "3", title: "Review", desc: "You provide feedback and we refine" },
              { step: "4", title: "Launch", desc: "Your site goes live in days" },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 border-b border-r border-border/60"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center border border-primary bg-primary">
                  <span className="text-2xl font-display font-bold text-primary-foreground">{item.step}</span>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
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
            className="border-t border-border/60 pt-12"
          >
            <h2 className="heading-md mb-4">
              Ready to Get <span className="text-gradient">Online?</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl">
              Get a professional website that works as hard as you do. 
              No hidden fees, UK-based support.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="premium" size="xl" asChild>
                <Link to="/get-started">Get Started <ArrowRight className="w-4 h-4" /></Link>
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