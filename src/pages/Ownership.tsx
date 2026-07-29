import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Key, FileCode, Server, GraduationCap, Shield, RefreshCw, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";

const ownershipBenefits = [
  {
    icon: FileCode,
    title: "Complete Code Ownership",
    description: "You own 100% of the code we create. No licensing fees, no restrictions, no strings attached.",
    details: [
      "Full source code delivered",
      "No recurring licensing fees",
      "Freedom to modify and extend",
      "Resale rights included",
    ],
  },
  {
    icon: Key,
    title: "No Vendor Lock-in",
    description: "Your site runs on standard technologies. Host it anywhere, modify it anytime.",
    details: [
      "Standard web technologies",
      "Host with any provider",
      "No proprietary systems",
      "Easy migration support",
    ],
  },
  {
    icon: GraduationCap,
    title: "Training Materials",
    description: "Comprehensive documentation and training to manage your site independently.",
    details: [
      "Video tutorials",
      "Written documentation",
      "CMS training sessions",
      "Ongoing reference materials",
    ],
  },
  {
    icon: Server,
    title: "Hosting Migration Assistance",
    description: "We help you set up hosting and transfer everything smoothly.",
    details: [
      "Hosting recommendations",
      "Domain transfer support",
      "Email setup assistance",
      "Post-launch verification",
    ],
  },
];

const comparison = [
  {
    feature: "Code Ownership",
    us: "100% yours forever",
    agency: "Often retained by agency",
    template: "Limited - template licensed",
  },
  {
    feature: "Hosting Freedom",
    us: "Host anywhere",
    agency: "May require their hosting",
    template: "Platform dependent",
  },
  {
    feature: "Modification Rights",
    us: "Unlimited",
    agency: "May require their approval",
    template: "Template restrictions",
  },
  {
    feature: "Resale Rights",
    us: "Full rights included",
    agency: "Usually prohibited",
    template: "Never allowed",
  },
  {
    feature: "Exit Cost",
    us: "Zero - Walk away anytime",
    agency: "Expensive buyout fees",
    template: "Platform lock-in",
  },
];

const deliverables = [
  "Complete source code files",
  "Design files (if applicable)",
  "Asset library and images",
  "Documentation package",
  "Video training library",
  "Hosting setup guide",
  "Domain configuration guide",
  "SSL certificate setup",
  "Email configuration",
  "Analytics access",
  "CMS credentials",
  "Third-party integration access",
];

export default function Ownership() {
  return (
    <Layout>
      {/* Hero */}
      <PageHero
        eyebrow="Company"
        index="32"
        crumbs={[{ label: "Home", href: "/" }, { label: "Ownership" }]}
        title="You own"
        highlight="everything"
        body="Code, design, content, accounts — every asset we build for you is yours, in writing."
      />

      {/* Key Promise */}
      <section className="py-12 border-y border-border bg-primary/5">
        <div className="container-tight">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-center">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-primary" />
              <span className="text-xl font-display font-semibold">100% Code Ownership</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-border" />
            <div className="flex items-center gap-3">
              <RefreshCw className="w-8 h-8 text-primary" />
              <span className="text-xl font-display font-semibold">Zero Lock-in</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-border" />
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-primary" />
              <span className="text-xl font-display font-semibold">Full Training Included</span>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              What Ownership Means
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Every site we build becomes your permanent business asset.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-0 border-l border-t border-border/60">
            {ownershipBenefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-r border-border/60 p-8 group hover:border-primary/50 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground mb-4">{benefit.description}</p>
                <ul className="space-y-2">
                  {benefit.details.map((detail) => (
                    <li key={detail} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-20 bg-card/50">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ownership Comparison
            </h2>
            <p className="text-muted-foreground">
              See how our ownership model compares to alternatives.
            </p>
          </motion.div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-display">Feature</th>
                  <th className="text-center p-4 font-display text-primary">Quooro</th>
                  <th className="text-center p-4 font-display text-muted-foreground">Typical Agency</th>
                  <th className="text-center p-4 font-display text-muted-foreground">Template Builders</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="p-4 font-medium">{row.feature}</td>
                    <td className="p-4 text-center">
                      <span className="inline-flex items-center gap-2 text-primary">
                        <CheckCircle className="w-4 h-4" />
                        {row.us}
                      </span>
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        {row.agency}
                      </span>
                    </td>
                    <td className="p-4 text-center text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        {row.template}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Deliverables */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              What You Receive
            </h2>
            <p className="text-muted-foreground">
              Complete deliverables package with every project.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {deliverables.map((item, index) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="glass p-4 rounded-xl flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card/50">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-border/60 bg-background p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Own Your Website?
            </h2>
            <p className="text-muted-foreground max-w-2xl mb-8">
              Build a website that's truly yours - no strings, no lock-in, just complete ownership.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="lg" asChild>
                <Link to="/get-started">Start Your Project <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/packages">View Packages</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
