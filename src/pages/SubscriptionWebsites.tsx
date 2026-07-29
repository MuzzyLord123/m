import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Check, 
  ArrowRight, 
  Zap, 
  Shield, 
  Clock, 
  Users, 
  Building2, 
  Utensils, 
  Scissors, 
  Calendar,
  CreditCard,
  FileCheck,
  Handshake,
  Rocket,
  Globe,
  Server,
  Wrench,
  ChevronRight,
  Star
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Starter Website",
    price: "Custom",
    period: "per month",
    description: "Designed for individuals and very small businesses who need a clean, professional online presence.",
    features: [
      "1–2 page website",
      "Mobile-responsive design",
      "Contact form or enquiry form",
      "Secure hosting",
      "Basic maintenance and updates",
    ],
    bestFor: ["Personal brands", "Tradespeople", "Portfolio or brochure-style websites"],
    icon: Users,
    popular: false,
  },
  {
    name: "Business Website",
    price: "Custom",
    period: "per month",
    description: "A more complete website for growing businesses.",
    features: [
      "Multi-page website",
      "Professional layout tailored to your business",
      "Improved performance and SEO structure",
      "Hosting and ongoing maintenance",
      "Upgrade-ready architecture",
    ],
    bestFor: ["Local businesses", "Service providers", "SMEs needing credibility and scalability"],
    icon: Building2,
    popular: true,
  },
  {
    name: "Booking & Service-Based",
    price: "Custom",
    period: "per month",
    description: "Designed for businesses that require appointment booking or service scheduling.",
    features: [
      "Full business website",
      "Online booking functionality",
      "Integration with third-party booking systems",
      "Hosting, maintenance, and updates",
      "Calendar synchronization",
    ],
    bestFor: ["Salons & barbers", "Fitness & coaching services", "Consultants & service providers"],
    icon: Calendar,
    popular: false,
  },
  {
    name: "Restaurants & Takeaways",
    price: "Custom",
    period: "per month",
    description: "Built specifically for food businesses that need online menus, bookings, or ordering systems.",
    features: [
      "Restaurant or takeaway website",
      "Menu display",
      "Online booking or ordering system",
      "Third-party delivery or booking integration",
      "Hosting and ongoing maintenance",
    ],
    bestFor: ["Restaurants", "Takeaways", "Cafés & food trucks"],
    icon: Utensils,
    popular: false,
  },
];

const whoIsThisFor = [
  { text: "Startups and new businesses", icon: Rocket },
  { text: "Sole traders and local services", icon: Users },
  { text: "Businesses testing a new idea or market", icon: Zap },
  { text: "Restaurants, takeaways, and service-based businesses", icon: Utensils },
  { text: "Anyone who wants a professional website without upfront build costs", icon: Globe },
];

const howItWorks = [
  { step: 1, title: "Choose Your Plan", description: "Select a monthly plan based on the type of website you need." },
  { step: 2, title: "We Design & Launch", description: "We design and launch your website with no upfront build fee." },
  { step: 3, title: "Hosted & Maintained", description: "Your site is hosted and maintained by us throughout." },
  { step: 4, title: "Scale or Own", description: "Upgrade, scale, or purchase the website outright at the end of the contract." },
  { step: 5, title: "Fair Buyout", description: "If you buy, everything you've paid is deducted from the final purchase price." },
];

const hostingIncludes = [
  { title: "Secure Hosting", icon: Shield },
  { title: "Ongoing Maintenance", icon: Wrench },
  { title: "Bug Fixes", icon: FileCheck },
  { title: "Performance Monitoring", icon: Zap },
  { title: "Platform Updates", icon: Server },
];

export default function SubscriptionWebsites() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container-tight relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6"
            >
              <CreditCard className="w-4 h-4" />
              No Upfront Costs
            </motion.div>
            
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Subscription{" "}
              <span className="text-gradient-primary">Websites</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-4 font-medium">
              Get Online Without the Upfront Cost
            </p>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-3xl">
              Launch a fully functional website on a low monthly plan, with the option to purchase 
              and fully own it later. Complete transparency — no hidden fees, no long-term traps.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="premium" size="lg" asChild>
                <Link to="/get-started">
                  Get Started Today
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/support#callback-form">
                  Book a Call
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who This Service Is For */}
      <section className="py-20 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Who This Service Is For
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              This service is ideal for businesses wanting to get online quickly and affordably.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {whoIsThisFor.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium">{item.text}</span>
              </motion.div>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-8 text-muted-foreground"
          >
            If you want a fully bespoke, enterprise-level build from day one, our{" "}
            <Link to="/custom-elite" className="text-primary hover:underline">
              Custom Website Services
            </Link>{" "}
            may be more suitable.
          </motion.p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              How It Works{" "}
              <span className="text-muted-foreground">(Simple & Transparent)</span>
            </h2>
          </motion.div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connection Line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-primary/50 to-transparent hidden md:block" />
            
            <div className="space-y-6">
              {howItWorks.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-6 items-start"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0 relative z-10">
                    {item.step}
                  </div>
                  <div className="flex-1 pt-2">
                    <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-20 bg-muted/30">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Monthly Website Plans
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Choose the plan that best fits your business needs. All plans include hosting and maintenance.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/30"
                    : "bg-background border-border hover:border-primary/20"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Most Popular
                  </div>
                )}

                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                      <plan.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-display font-bold">{plan.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{plan.price}</div>
                    <div className="text-sm text-muted-foreground">{plan.period}</div>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>

                <div className="space-y-2 mb-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">Best for:</p>
                  <div className="flex flex-wrap gap-2">
                    {plan.bestFor.map((item, i) => (
                      <span key={i} className="px-2 py-1 bg-muted rounded-md text-xs">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Third-Party Transparency */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="p-8 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-3">
                    Important: Booking Systems & Third-Party Services
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    All booking, ordering, and scheduling systems used in subscription websites are third-party 
                    services that are securely integrated into your website.
                  </p>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>You can choose any compatible booking or ordering platform, including systems you already use.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>When you purchase your website, the booking system remains fully integrated — you simply continue paying the third-party provider directly.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <ChevronRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>These subscriptions are typically low-cost and flexible.</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-background/50 border border-border">
                    <p className="text-sm font-medium mb-2">Why we take this approach:</p>
                    <p className="text-sm text-muted-foreground">
                      A fully custom-built booking system costs thousands, takes months, and requires a full 
                      development team. By using proven third-party platforms, we deliver faster launches, 
                      lower costs, greater reliability, and full transparency.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Ownership & Buyout */}
      <section className="py-20 bg-muted/30">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
                <Handshake className="w-4 h-4" />
                Fair Ownership
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
                Website Ownership & Buyout Option
              </h2>
              <p className="text-muted-foreground mb-6">
                At the end of your subscription contract, you have the option to purchase the website outright.
              </p>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Clear Purchase Price</p>
                    <p className="text-sm text-muted-foreground">Agreed upfront with no surprises</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Every Payment Counts</p>
                    <p className="text-sm text-muted-foreground">All payments deducted from final price — no double-paying</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Full Ownership Transfer</p>
                    <p className="text-sm text-muted-foreground">All files, assets, and site structure are yours</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl bg-background border border-border"
            >
              <h3 className="text-xl font-display font-bold mb-6">
                Hosting & Maintenance Included
              </h3>
              <p className="text-muted-foreground mb-6">
                All subscription plans include comprehensive hosting and maintenance to ensure your site 
                remains stable, secure, and operational at all times.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {hostingIncludes.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <item.icon className="w-4 h-4 text-primary" />
                    <span>{item.title}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why We're Different */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Why We Offer This Model
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-destructive/5 border border-destructive/20"
            >
              <h3 className="text-lg font-bold mb-4 text-destructive">
                Most Subscription Companies...
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✕</span>
                  Lock clients into long-term contracts
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✕</span>
                  Reuse the same templates endlessly
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✕</span>
                  Never allow real ownership
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-6 rounded-2xl bg-primary/5 border border-primary/20"
            >
              <h3 className="text-lg font-bold mb-4 text-primary">
                We Operate Differently
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  Help businesses get started properly
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  Remain transparent at every stage
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  Offer a clear path from startup to ownership
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  Build long-term relationships, not traps
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              If you want to launch your business online without upfront costs, this service is the fastest 
              and most accessible way to do it. Start small, scale when ready, buy when it makes sense for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="lg" asChild>
                <Link to="/get-started">
                  Get Started Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/support#callback-form">
                  Book a Call Today
                  <Calendar className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
