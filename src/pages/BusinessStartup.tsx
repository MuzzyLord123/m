import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Check, 
  X, 
  Rocket, 
  Phone, 
  Video, 
  Calendar,
  Globe,
  ShoppingCart,
  Search,
  Palette,
  Megaphone,
  TrendingUp,
  Clock,
  Users,
  Target,
  Lightbulb,
  Shield,
  Heart,
  ArrowRight
} from "lucide-react";
import { Card3D } from "@/components/Card3D";

const includedItems = [
  "A 30–45 minute phone or video call",
  "Honest advice tailored to your business idea",
  "Platform recommendations (Web, eCommerce, bookings, ads)",
  "Clear next steps based on your goals and budget",
  "No pressure, no obligation",
];

const notIncludedItems = [
  "Not a generic sales call",
  "Not pre-recorded advice",
  "Not outsourced or scripted",
];

const idealFor = [
  { text: "Starting a business and don't know where to begin", icon: Rocket },
  { text: "Struggling to choose between Shopify, Webflow, or other platforms", icon: Globe },
  { text: "Unsure how Google Business, websites, ads, and branding fit together", icon: Target },
  { text: "Working with a limited budget and want to spend it wisely", icon: TrendingUp },
  { text: "Serious about building something professional from day one", icon: Shield },
];

const planningTopics = [
  { title: "Website or eCommerce Setup", description: "Any platform of your choice for simplicity or alternatively custom builds", icon: ShoppingCart },
  { title: "Google Business Profile", description: "Setup & optimisation for local visibility", icon: Search },
  { title: "Online Systems", description: "Ordering, bookings, or enquiry systems", icon: Calendar },
  { title: "Branding Direction", description: "Logos, visuals, trust signals", icon: Palette },
  { title: "Advertising Options", description: "When it makes sense — and when it doesn't", icon: Megaphone },
  { title: "Scalable Systems", description: "For growth, not quick hacks", icon: TrendingUp },
];

export default function BusinessStartup() {
  return (
    <Layout>
      {/* Hero Section */}
      <PageHero
        eyebrow="Company"
        index="28"
        crumbs={[{ label: "Home", href: "/" }, { label: "Start-up support" }]}
        title="Built for"
        highlight="day one"
        body="Brand, site and systems for new businesses — the digital groundwork done right the first time."
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

      {/* What's Included Section */}
      <section className="py-20 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What the Free Call Is (and Isn't)
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* What's Included */}
            <Card3D className="h-full">
              <div className="border border-border/60 bg-background p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Check className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">What's Included</h3>
                </div>
                <ul className="space-y-4">
                  {includedItems.map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <Check className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </Card3D>

            {/* What It's Not */}
            <Card3D className="h-full">
              <div className="border border-border/60 bg-background p-8 h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                    <X className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">What It's Not</h3>
                </div>
                <ul className="space-y-4">
                  {notIncludedItems.map((item, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <X className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </motion.li>
                  ))}
                </ul>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="mt-8 border border-primary/25 bg-primary/[0.04] p-4"
                >
                  <p className="text-foreground font-medium text-center">
                    You'll speak directly with the person building the systems — not a salesperson.
                  </p>
                </motion.div>
              </div>
            </Card3D>
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
              Ideal Candidates
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Who This Is For
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              This service is ideal if you are:
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {idealFor.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card3D className="h-full">
                    <div className="border border-border/60 bg-background p-6 h-full flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <p className="text-foreground font-medium">{item.text}</p>
                    </div>
                  </Card3D>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What We Can Help You Plan */}
      <section className="py-20 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
              Planning Topics
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What We Can Help You Plan
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              During the call, we can cover:
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {planningTopics.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card3D className="h-full">
                    <div className="border border-border/60 bg-background p-6 h-full">
                      <div className="flex h-11 w-11 items-center justify-center border border-primary/25 bg-primary/[0.06] mb-4">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{topic.title}</h3>
                      <p className="text-muted-foreground">{topic.description}</p>
                    </div>
                  </Card3D>
                </motion.div>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg font-light text-muted-foreground mt-12 max-w-2xl"
          >
            You'll leave with clarity, even if you decide not to move forward.
          </motion.p>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
                Our Philosophy
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Our Approach
              </h2>
            </motion.div>

            <Card3D>
              <div className="border border-primary/30 bg-background p-8 md:p-12">
                <div className="mb-8">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 mb-6"
                  >
                    <Lightbulb className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                    We don't charge for advice.<br />
                    <span className="text-primary">We charge for execution.</span>
                  </h3>
                </div>

                <p className="text-lg text-muted-foreground mb-8">
                  Once the strategy is clear, you're free to:
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 border border-border/40 p-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <X className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <span className="text-foreground font-medium">Walk away with no cost</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 border border-primary/25 bg-primary/[0.04] p-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-foreground font-medium">Move forward when you're ready</span>
                  </motion.div>
                </div>

                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" /> No retainers
                  </span>
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" /> No hidden fees
                  </span>
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" /> No pressure
                  </span>
                </div>
              </div>
            </Card3D>
          </div>
        </div>
      </section>

      {/* Availability Section */}
      <section className="py-20 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
              Scheduling
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Availability
            </h2>
          </motion.div>

          <div className="max-w-2xl mx-auto">
            <Card3D>
              <div className="border border-border/60 bg-background p-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Daily 5pm – 9pm (UK time)</p>
                      <p className="text-muted-foreground text-sm">Flexible evening availability</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Video className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Phone or Video Call</p>
                      <p className="text-muted-foreground text-sm">Your choice of format</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Booking Required</p>
                      <p className="text-muted-foreground text-sm">Limited availability to ensure quality</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card3D>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-background to-background" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 mb-6">
              <Heart className="w-6 h-6 text-primary" />
              <span className="text-primary font-semibold">Start Your Journey</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
              Book Your Free Start-Up Call
            </h2>
            
            <p className="text-lg text-muted-foreground mb-4">
              Limited availability to ensure every call gets proper attention.
            </p>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-block"
            >
              <Button size="lg" asChild className="text-lg px-12 py-8 ">
                <Link to="/get-started">
                  <Calendar className="w-6 h-6 mr-3" />
                  Book a Free Strategy Call
                </Link>
              </Button>
            </motion.div>
            
            <p className="text-muted-foreground mt-4">
              30–45 minutes • No obligation
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
