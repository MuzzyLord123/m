import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, TrendingUp, FileText, Link2, MapPin, BarChart, CheckCircle, ArrowUpRight, ArrowRight } from "lucide-react";
import { ParallaxBackground } from "@/components/ParallaxImage";
import { PricingCard3D } from "@/components/Card3D";
import seoStrategy from "@/assets/seo-strategy.jpg";

const services = [
  {
    icon: Search,
    title: "Keyword Research",
    description: "In-depth analysis to identify high-value keywords your audience is searching for.",
    features: ["Search volume analysis", "Competition assessment", "Long-tail opportunities", "Keyword mapping"],
  },
  {
    icon: BarChart,
    title: "Competitor Analysis",
    description: "Understand your competition's strategies and find gaps to exploit.",
    features: ["Backlink analysis", "Content gap analysis", "Ranking comparison", "Strategy insights"],
  },
  {
    icon: FileText,
    title: "Content Strategy",
    description: "Data-driven content planning that attracts and converts your target audience.",
    features: ["Content calendar", "Topic clusters", "Content optimization", "Performance tracking"],
  },
  {
    icon: Link2,
    title: "Link Building",
    description: "Quality backlink acquisition to boost your domain authority and rankings.",
    features: ["Outreach campaigns", "Guest posting", "Digital PR", "Link audit & cleanup"],
  },
  {
    icon: MapPin,
    title: "Local SEO",
    description: "Dominate local search results and attract customers in your area.",
    features: ["Google Business Profile", "Local citations", "Review management", "Local content"],
  },
  {
    icon: TrendingUp,
    title: "Technical SEO",
    description: "Optimize your site's foundation for better crawling and indexing.",
    features: ["Site speed optimization", "Mobile optimization", "Schema markup", "Core Web Vitals"],
  },
];

const packages = [
  {
    name: "SEO Starter",
    price: "Custom Quote",
    period: "",
    features: [
      "5 target keywords",
      "Monthly reporting",
      "On-page optimization",
      "Basic link building",
      "Google Business setup",
    ],
  },
  {
    name: "SEO Growth",
    price: "Custom Quote",
    period: "",
    popular: true,
    features: [
      "15 target keywords",
      "Bi-weekly reporting",
      "Full on-page optimization",
      "Content creation (2 posts)",
      "Active link building",
      "Competitor monitoring",
    ],
  },
  {
    name: "SEO Pro",
    price: "Custom Quote",
    period: "",
    features: [
      "30+ target keywords",
      "Weekly reporting",
      "Complete technical SEO",
      "Content creation (4 posts)",
      "Premium link building",
      "Dedicated SEO manager",
    ],
  },
];

const stats = [
  { value: "250%", label: "Average Traffic Increase" },
  { value: "Top 3", label: "Ranking Positions" },
  { value: "400+", label: "Keywords Ranked" },
  { value: "95%", label: "Client Retention" },
];

export default function SeoStrategy() {
  return (
    <Layout>
      {/* Hero with Parallax */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <ParallaxBackground
          src={seoStrategy}
          alt="SEO analytics visualization"
          parallaxSpeed={0.2}
          overlayClassName="bg-gradient-to-b from-background via-background/85 to-background"
        />
        <div className="container-tight relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Search className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">SEO & Digital Strategy</span>
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-6xl font-display font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Dominate <span className="text-gradient">Search Results</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Data-driven SEO strategies that drive organic traffic, improve rankings, and grow your business sustainably.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button variant="premium" size="lg" asChild>
                <Link to="/get-started">Start SEO Campaign <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/portfolio">View Results</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-primary/[0.05] to-primary/[0.02]" />
        <div className="container-tight relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center group"
              >
                <div className="text-3xl md:text-4xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2 transition-transform duration-300 group-hover:scale-110">{stat.value}</div>
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
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Comprehensive SEO Services
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to rank higher and drive more organic traffic.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 group hover:border-primary/50 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{service.title}</h3>
                <p className="text-muted-foreground mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ArrowUpRight className="w-4 h-4 text-primary" />
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
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              SEO Packages
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the package that matches your growth ambitions.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card p-8 relative ${pkg.popular ? 'border-primary' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-display font-semibold mb-2">{pkg.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold">{pkg.price}</span>
                  <span className="text-muted-foreground">{pkg.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={pkg.popular ? "hero" : "outline"} className="w-full" asChild>
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
            className="glass-card p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Rank Higher?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Get a free SEO audit and discover opportunities to grow your organic traffic.
            </p>
            <Button variant="premium" size="lg" asChild>
              <Link to="/get-started">Get Free SEO Audit <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
