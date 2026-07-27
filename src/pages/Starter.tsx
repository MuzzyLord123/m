import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Clock, Smartphone, Mail, Search, Shield, ArrowRight, Zap, MapPin, Phone } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
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
      <section className="section-padding pt-32 overflow-hidden">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill mb-6">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Launch-Ready in Days</span>
              </div>
              <h1 className="heading-xl mb-6">
                Starter <span className="text-gradient">Site</span>
              </h1>
              <div className="text-5xl font-display font-bold text-gradient mb-4">Tailored Pricing</div>
              <p className="body-lg mb-4">
                Perfect for pubs, tradesmen & local services. Professional 1-2 page websites 
                that get you found and get you customers.
              </p>
              <p className="text-muted-foreground mb-8">
                Mobile-first, fast-loading, and built to convert — not just look good.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button variant="premium" size="xl" asChild>
                  <Link to="/get-started">Get Started <ArrowRight className="w-4 h-4" /></Link>
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
              <div className="aspect-[4/3] rounded-3xl liquid-glass-card border border-border/50 p-8 flex flex-col justify-center">
                <h3 className="font-display font-bold text-2xl mb-6">What's Included:</h3>
                <ul className="space-y-3">
                  {included.slice(0, 6).map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-primary">+ more included</p>
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

      {/* Features Grid */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-md mb-4">
              Everything You Need to <span className="text-gradient">Get Found</span>
            </h2>
            <p className="body-md max-w-2xl mx-auto">
              A professional web presence that works as hard as you do.
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
          <div className="grid lg:grid-cols-2 gap-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl liquid-glass-card border border-border/50"
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

              <div className="p-6 rounded-2xl liquid-glass-card border border-primary/30">
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
            className="text-center mb-12"
          >
            <h2 className="heading-md mb-4">
              Simple <span className="text-gradient">Process</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-8">
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
                className="text-center p-6 rounded-2xl liquid-glass-card border border-border/50"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
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
        <div className="container-tight text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl liquid-glass-card border border-border/50"
          >
            <h2 className="heading-md mb-4">
              Ready to Get <span className="text-gradient">Online?</span>
            </h2>
            <p className="body-lg mb-8 max-w-2xl mx-auto">
              Get a professional website that works as hard as you do. 
              No hidden fees, UK-based support.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="premium" size="xl" asChild>
                <Link to="/get-started">Get Started <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/portfolio">View Examples</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}