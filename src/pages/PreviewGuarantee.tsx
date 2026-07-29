import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Shield, 
  RefreshCw, 
  Clock, 
  FileCheck, 
  MessageSquare,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const guarantees = [
  {
    icon: Shield,
    title: "Quality Assurance",
    description: "Every preview passes 8 rigorous quality checkpoints. We don't deliver until it meets our exacting standards."
  },
  {
    icon: RefreshCw,
    title: "Revision Policy",
    description: "Free previews include 1 round of minor revisions. Paid previews include 2 rounds to ensure you're satisfied."
  },
  {
    icon: Clock,
    title: "On-Time Delivery",
    description: "We commit to our timelines. If we're late, you receive a 10% discount on your final purchase."
  },
  {
    icon: FileCheck,
    title: "Full Transparency",
    description: "You receive daily updates during development. No surprises, no hidden costs, no fine print."
  }
];

const whatHappens = [
  {
    scenario: "You Love the Preview",
    icon: CheckCircle,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    steps: [
      "Approve the preview and confirm your order",
      "For paid previews, fee is credited to final invoice",
      "We finalize the site with your feedback",
      "Full handover with training and documentation"
    ]
  },
  {
    scenario: "You Want Changes",
    icon: RefreshCw,
    color: "text-primary",
    bgColor: "bg-primary/10",
    steps: [
      "Provide detailed feedback on what to adjust",
      "We implement agreed revisions (1-2 rounds)",
      "Review updated preview",
      "Proceed when satisfied"
    ]
  },
  {
    scenario: "You Don't Want to Proceed",
    icon: AlertCircle,
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    steps: [
      "No obligation for free previews - walk away anytime",
      "For paid previews, fee is non-refundable",
      "We archive your files for 90 days",
      "You can return anytime to reconsider"
    ]
  }
];

const revisionDetails = [
  {
    tier: "Free Previews",
    description: "Starter & Growth tiers",
    revisions: "1 round",
    includes: ["Color/font adjustments", "Minor layout tweaks", "Text corrections", "Image swaps"]
  },
  {
    tier: "Paid Previews",
    description: "Professional & Enterprise",
    revisions: "2 rounds",
    includes: ["All minor revisions", "Layout restructuring", "Feature adjustments", "Extended functionality tweaks"]
  }
];

export default function PreviewGuarantee() {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding pt-32">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Our Guarantee</span>
            </div>
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="heading-xl mb-6">
              Our Preview <span className="text-gradient">Guarantee</span>
            </h1>
            <p className="body-lg">
              We stand behind every preview we create. Quality assurance, transparent policies, 
              and fair revision terms - because your satisfaction is our priority.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Core Guarantees */}
      <section className="section-padding pt-8">
        <div className="container-tight">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {guarantees.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-border/50 bg-card text-center group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 relative z-10">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2 relative z-10">{item.title}</h3>
                <p className="text-sm text-muted-foreground relative z-10">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Happens Section */}
      <section className="section-padding bg-card">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-md mb-4">
              After Your <span className="text-gradient">Preview</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto">
              Clear paths forward whether you love it, want changes, or decide not to proceed.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {whatHappens.map((scenario, index) => (
              <motion.div
                key={scenario.scenario}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-background"
              >
                <div className={`w-12 h-12 rounded-xl ${scenario.bgColor} flex items-center justify-center mb-4`}>
                  <scenario.icon className={`w-6 h-6 ${scenario.color}`} />
                </div>
                <h3 className="font-display font-bold text-lg mb-4">{scenario.scenario}</h3>
                <ol className="space-y-3">
                  {scenario.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <span className={`w-5 h-5 rounded-full ${scenario.bgColor} flex items-center justify-center flex-shrink-0 text-xs font-bold ${scenario.color}`}>
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Revision Policy */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-md mb-4">
              Revision <span className="text-gradient">Policy</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto">
              We want you to be satisfied. Here's what revisions include at each level.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {revisionDetails.map((tier, index) => (
              <motion.div
                key={tier.tier}
                initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl border border-border bg-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-display font-bold text-lg">{tier.tier}</h3>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {tier.revisions}
                  </span>
                </div>
                <ul className="space-y-2">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ownership Rights */}
      <section className="section-padding bg-card">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl border border-primary/30 bg-gradient-card"
          >
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <FileCheck className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="heading-sm mb-4">
                  Ownership <span className="text-gradient">Rights</span>
                </h3>
                <p className="body-md mb-4">
                  When you purchase the final site, you receive <strong>100% ownership</strong> of all code, 
                  design assets, and content. No vendor lock-in, no recurring license fees.
                </p>
                <p className="text-muted-foreground">
                  For previews where you don't proceed: the preview code remains our property, 
                  but we'll never use your branding or content for other clients.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-tight text-center">
          <h2 className="heading-md mb-6">
            Confident in Our <span className="text-gradient">Quality?</span>
          </h2>
          <p className="body-lg max-w-2xl mx-auto mb-8">
            Start your preview journey with complete confidence in our process and guarantees.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="premium" size="xl" asChild>
              <Link to="/get-started">
                Get Your Preview <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/preview-faq">More Questions?</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
