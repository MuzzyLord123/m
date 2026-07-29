import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, FileText, BarChart, Rss, Settings, Users, ArrowRight, Shield, Zap, Palette } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";

const features = [
  { icon: FileText, title: "2-5 Pages", description: "Home, About, Services, Contact & more" },
  { icon: Palette, title: "Bespoke Layout", description: "Custom design — no templates" },
  { icon: Settings, title: "CMS Access", description: "Easy content updates without developer help" },
  { icon: BarChart, title: "Conversion-Focused", description: "Built to turn visitors into customers" },
  { icon: Rss, title: "On-Page SEO", description: "Optimised for search engines" },
  { icon: Users, title: "Mobile & Desktop", description: "Perfect on every device" },
];

const included = [
  "2-5 custom-designed pages",
  "Bespoke layout (no templates)",
  "Conversion-focused structure",
  "On-page SEO optimisation",
  "CMS access for easy edits",
  "Mobile & desktop optimised",
  "Contact form with email integration",
  "Social media integration",
  "Google Analytics setup",
  "SSL certificate",
  "Complete code ownership",
  "UK-based support",
];

const pageStructure = [
  { name: "Home", desc: "Hero section, services overview, testimonials, CTA" },
  { name: "About", desc: "Your story, team, values, why customers choose you" },
  { name: "Services", desc: "What you offer with clear descriptions" },
  { name: "Gallery/Portfolio", desc: "Show off your work (optional)" },
  { name: "Contact", desc: "Form, map, contact details, social links" },
];

export default function Growth() {
  return (
    <Layout>
      {/* Hero */}
      <PageHero
        eyebrow="Packages"
        index="22"
        crumbs={[{ label: "Home", href: "/" }, { label: "Business site" }]}
        title="The Business"
        highlight="site"
        body="For businesses ready to look established — more pages, more structure, and a CMS you can run yourself."
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
              <span>1-2 week delivery</span>
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
              Built for <span className="text-gradient">Credibility</span>
            </h2>
            <p className="body-md max-w-2xl">
              Everything you need to look professional and win more business.
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
                <h3 className="font-display font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Complete List */}
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
                Everything <span className="text-gradient">Included</span>
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
                Why <span className="text-gradient">Business Site?</span>
              </h2>
              <div className="space-y-6">
                <p className="text-muted-foreground">
                  The Business Site is perfect for local businesses that need more than a simple 
                  one-pager but don't need complex e-commerce or custom apps.
                </p>
                <ul className="space-y-3">
                  {[
                    "Look as professional as the big competitors",
                    "Update content yourself with the CMS",
                    "Get found on Google with proper SEO",
                    "Convert more visitors into enquiries",
                    "Works perfectly on mobile and desktop",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <ArrowRight className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="p-6 border border-primary/30 bg-background">
                  <h4 className="font-display font-semibold mb-2">Need More?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    If you need 6-10 pages, a blog, or lead capture automation, 
                    our Growth Site package has you covered.
                  </p>
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/professional">View Growth Site</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
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
              Ready to Look <span className="text-gradient">Professional?</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl">
              Get a website that makes you look as good as your work. 
              Bespoke design, no templates, no fuss.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="premium" size="xl" asChild>
                <Link to="/get-started">Request a Quote <ArrowRight className="w-4 h-4" /></Link>
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