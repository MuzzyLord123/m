import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, Eye, MessageSquare, Star, Users, Globe, Clock, CheckCircle, ArrowRight } from "lucide-react";

const services = [
  {
    icon: Eye,
    title: "Digital Presence Oversight",
    description: "Complete monitoring and management of your online presence across all platforms and channels.",
    features: ["24/7 brand monitoring", "Competitor tracking", "Industry trend analysis", "Crisis detection"],
  },
  {
    icon: Shield,
    title: "Reputation Management",
    description: "Protect and enhance your brand reputation with proactive monitoring and response strategies.",
    features: ["Review monitoring", "Negative content mitigation", "Positive PR amplification", "Brand sentiment tracking"],
  },
  {
    icon: MessageSquare,
    title: "Review Responses",
    description: "Professional, timely responses to customer reviews across all major platforms.",
    features: ["Google reviews", "Trustpilot management", "Social media reviews", "Industry-specific platforms"],
  },
  {
    icon: Star,
    title: "Brand Monitoring",
    description: "Real-time tracking of brand mentions, sentiment, and online conversations about your business.",
    features: ["Social listening", "News monitoring", "Forum tracking", "Influencer mentions"],
  },
  {
    icon: Users,
    title: "Community Management",
    description: "Build and nurture engaged online communities around your brand.",
    features: ["Community guidelines", "Member engagement", "Conflict resolution", "Growth strategies"],
  },
  {
    icon: Globe,
    title: "Multi-Platform Management",
    description: "Unified management of your presence across all digital touchpoints.",
    features: ["Website monitoring", "Social profiles", "Directory listings", "Third-party mentions"],
  },
];

const packages = [
  {
    name: "Essential",
    price: "Custom Quote",
    period: "",
    features: [
      "Basic monitoring",
      "Weekly reports",
      "Review responses (up to 20)",
      "1 platform management",
      "Email support",
    ],
  },
  {
    name: "Professional",
    price: "Custom Quote",
    period: "",
    popular: true,
    features: [
      "Full monitoring suite",
      "Bi-weekly reports",
      "Unlimited review responses",
      "3 platform management",
      "Reputation repair",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom Quote",
    period: "",
    features: [
      "24/7 monitoring",
      "Real-time dashboards",
      "Crisis management",
      "All platforms",
      "Dedicated manager",
      "Custom integrations",
    ],
  },
];

export default function AccountManagement() {
  return (
    <Layout>
      {/* Hero */}
      <PageHero
        eyebrow="Marketing"
        index="14"
        crumbs={[{ label: "Home", href: "/" }, { label: "Account management" }]}
        title="One team on"
        highlight="the whole estate"
        body="Your digital presence looked after end to end — sites, listings, campaigns and reputation in one pair of hands."
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

      {/* Stats */}
      <section className="py-16 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-primary/[0.05] to-primary/[0.02]" />
        <div className="container-tight relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "24/7", label: "Monitoring", color: "from-blue-500 to-indigo-500" },
              { value: "100%", label: "Response Rate", color: "from-emerald-500 to-teal-500" },
              { value: "<2hrs", label: "Response Time", color: "from-purple-500 to-pink-500" },
              { value: "500+", label: "Brands Protected", color: "from-amber-500 to-orange-500" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className={`text-3xl md:text-4xl font-display font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2 transition-transform duration-300 group-hover:scale-110`}>{stat.value}</div>
                <div className="text-muted-foreground text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Complete Account Management
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Everything you need to maintain a stellar online presence and protect your brand reputation.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-border/60">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-r border-border/60 p-8 group hover:border-primary/50 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20 bg-card/50">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Account Management Packages
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-0 border-l border-t border-border/60">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`border-b border-r border-border/60 p-8 relative ${pkg.popular ? 'border-primary' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-xs font-semibold text-primary-foreground">
                    Recommended
                  </div>
                )}
                <h3 className="text-xl font-display font-semibold mb-2">{pkg.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{pkg.price}</span>
                  <span className="text-muted-foreground">{pkg.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={pkg.popular ? "hero" : "glass"} className="w-full" asChild>
                  <Link to="/get-started">Get Started</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-border/60 bg-background p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Protect Your Online Reputation
            </h2>
            <p className="text-muted-foreground max-w-2xl mb-8">
              Don't let negative reviews or unmanaged accounts hurt your business. Let us handle your digital presence.
            </p>
            <Button variant="premium" size="lg" asChild>
              <Link to="/get-started">Start Today <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
