import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ShoppingBag, ArrowRight, Package, CreditCard, Truck, BarChart3,
  Globe, Shield, Zap, RefreshCw, Check, Store, Sparkles, Server,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const offerings = [
  {
    name: "Subscription Websites",
    href: "/subscription-websites",
    icon: Package,
    tag: "Most popular",
    description:
      "Launch a fully managed online store on a low monthly plan. Hosting, updates, and support included — with the option to fully own it later.",
    bullets: [
      "No upfront build cost",
      "Managed hosting & updates",
      "Optional buy-out to fully own",
      "Includes payments, catalog, and checkout",
    ],
  },
  {
    name: "Custom E-commerce Builds",
    href: "/get-started",
    icon: Store,
    description:
      "Bespoke online stores tailored to your brand, catalog structure, and fulfilment workflow — built once, owned outright.",
    bullets: [
      "Custom design & UX",
      "Complex catalog & variants",
      "Integrated with your systems",
      "One-off build, no monthly lock-in",
    ],
  },
  {
    name: "Store Management",
    href: "/account-management",
    icon: Sparkles,
    description:
      "Hands-on management of your storefront — product uploads, promotions, inventory sync, and performance reporting.",
    bullets: [
      "Product & inventory updates",
      "Promotion & campaign setup",
      "Order & customer support flows",
      "Monthly performance reporting",
    ],
  },
];

const features = [
  { icon: CreditCard, title: "Payments built in", copy: "Card, wallet, and buy-now-pay-later options wired end-to-end." },
  { icon: Truck,      title: "Shipping & fulfilment", copy: "Rates, labels, and tracking connected to your carrier of choice." },
  { icon: BarChart3,  title: "Reporting & analytics", copy: "Revenue, cart, and conversion insights in one dashboard." },
  { icon: Shield,     title: "Secure & compliant",    copy: "PCI-conscious checkout, SSL, and hardened hosting by default." },
  { icon: Zap,        title: "Fast by design",        copy: "Optimised for Core Web Vitals so your store loads and converts fast." },
  { icon: RefreshCw,  title: "Ongoing improvements",  copy: "Continuous updates, security patches, and feature rollouts." },
];

export default function Ecommerce() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-center pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

        <div className="container-tight relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <ShoppingBag className="w-4 h-4" />
              E-commerce Services
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              Sell online with a store{" "}
              <span className="text-gradient-primary">that just works</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              From subscription websites to fully custom online stores — we design, build, and manage
              e-commerce experiences that convert, without the technical headaches.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="lg" asChild>
                <Link to="/get-started">
                  Start selling online <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/subscription-websites">
                  View Subscription Websites
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Offerings */}
      <section
        id="offerings"
        className="py-20 relative overflow-hidden"
        style={{ borderTop: "1px solid hsl(var(--border) / 0.15)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container-tight relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Choose your e-commerce path
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Whether you want to start small on a monthly plan or invest in a bespoke store,
              we have an option that fits.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {offerings.map((o, i) => (
              <motion.div
                key={o.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative group"
              >
                <div className="h-full rounded-2xl border border-border/40 bg-card/60 hover:bg-card/80 p-6 transition-colors flex flex-col">
                  {o.tag && (
                    <span className="absolute top-4 right-4 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                      {o.tag}
                    </span>
                  )}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <o.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{o.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{o.description}</p>
                  <ul className="space-y-2 mb-6">
                    {o.bullets.map(b => (
                      <li key={b} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Button variant="glass" className="mt-auto w-full" asChild>
                    <Link to={o.href}>
                      Learn more <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 relative overflow-hidden" style={{ borderTop: "1px solid hsl(var(--border) / 0.15)" }}>
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Everything a modern store needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Payments, shipping, analytics, and security — configured and maintained for you.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border/30 bg-card/50 p-5 hover:bg-card/70 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.copy}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-tight">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-8 md:p-14 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
                Ready to open your online store?
              </h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
                Tell us about your products and we'll recommend the fastest path — from a subscription
                storefront to a full custom build.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="premium" size="lg" asChild>
                  <Link to="/get-started">
                    Get Started <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
                <Button variant="glass" size="lg" asChild>
                  <Link to="/subscription-websites">
                    <Server className="w-4 h-4 mr-2" /> Subscription Websites
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
