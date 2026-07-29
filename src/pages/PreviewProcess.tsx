import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  MessageSquare, 
  Palette, 
  Code2, 
  Eye, 
  CheckCircle, 
  Users,
  Clock,
  Zap
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";

const processSteps = [
  {
    day: "Day 1",
    icon: MessageSquare,
    title: "Discovery Call",
    description: "We discuss your vision, goals, and requirements. You share examples you love and we outline the scope.",
    deliverable: "Project brief & scope document"
  },
  {
    day: "Day 2",
    icon: Palette,
    title: "Design Concept",
    description: "Our design team creates mood boards, color palettes, and wireframes based on your brand and preferences.",
    deliverable: "Design direction approval"
  },
  {
    day: "Day 3-5",
    icon: Code2,
    title: "Custom Development",
    description: "Our professional coders hand-build your preview site. No templates - every element crafted specifically for you.",
    deliverable: "Working preview site"
  },
  {
    day: "Day 6",
    icon: Eye,
    title: "Preview Review",
    description: "You receive access to your fully functional preview. Explore every page, test interactions, and gather feedback.",
    deliverable: "Live preview link"
  },
  {
    day: "Day 7",
    icon: CheckCircle,
    title: "Feedback & Decision",
    description: "We discuss your thoughts, answer questions, and if you're satisfied, proceed to finalization.",
    deliverable: "Revision notes or approval"
  }
];

const teamRoles = [
  {
    role: "Project Manager",
    responsibility: "Coordinates your project from start to finish, ensuring deadlines and quality standards are met."
  },
  {
    role: "Lead Designer",
    responsibility: "Creates your visual identity, ensuring brand consistency and modern aesthetics."
  },
  {
    role: "Senior Developer",
    responsibility: "Hand-codes your preview using cutting-edge technologies for performance and reliability."
  },
  {
    role: "QA Specialist",
    responsibility: "Tests every interaction across devices and browsers before your preview is delivered."
  }
];

const qualityCheckpoints = [
  "Mobile responsiveness verification",
  "Cross-browser compatibility testing",
  "Performance optimization check",
  "Accessibility compliance review",
  "Content accuracy validation",
  "Interactive element testing",
  "SEO foundation verification",
  "Security best practices audit"
];

export default function PreviewProcess() {
  return (
    <Layout>
      {/* Hero */}
      <PageHero
        eyebrow="Previews"
        index="42"
        crumbs={[{ label: "Home", href: "/" }, { label: "Preview process" }]}
        title="How we build"
        highlight="your preview"
        body="What happens between your enquiry and the preview landing in your inbox."
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

      {/* Timeline */}
      <section className="section-padding relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.2)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container-tight relative z-10">
          <h2 className="heading-md mb-16">
            7-Day <span className="text-gradient">Preview Timeline</span>
          </h2>

          <div className="relative">
            {/* Timeline Line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20" />

            <div className="space-y-12 lg:space-y-16">
              {processSteps.map((step, index) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex flex-col lg:flex-row items-center gap-8 ${
                    index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                  }`}
                >
                  <div className={`flex-1 ${index % 2 === 0 ? "lg:text-right" : "lg:text-left"}`}>
                    <div className="p-6 rounded-2xl border border-border bg-background">
                      <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
                        {step.day}
                      </div>
                      <h3 className="font-display font-bold text-xl mb-3">{step.title}</h3>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        <span className="text-primary font-medium">{step.deliverable}</span>
                      </div>
                    </div>
                  </div>

                  {/* Center Icon */}
                  <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/25">
                    <step.icon className="w-7 h-7 text-primary-foreground" />
                  </div>

                  <div className="flex-1 hidden lg:block" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team Roles */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="heading-md mb-4">
              Your <span className="text-gradient">Dedicated Team</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto">
              Professional specialists working together to bring your vision to life.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamRoles.map((member, index) => (
              <motion.div
                key={member.role}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card text-center"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center border border-primary/25 bg-primary/[0.06]">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{member.role}</h3>
                <p className="text-sm text-muted-foreground">{member.responsibility}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Checkpoints */}
      <section className="section-padding bg-card">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="heading-md mb-6">
                Quality <span className="text-gradient">Checkpoints</span>
              </h2>
              <p className="body-lg mb-8">
                Every preview passes through 8 rigorous quality checkpoints before delivery. 
                We don't ship until it's perfect.
              </p>
              <Button variant="premium" size="lg" asChild>
                <Link to="/preview-guarantee">
                  See Our Guarantee <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {qualityCheckpoints.map((checkpoint, index) => (
                <div
                  key={checkpoint}
                  className="flex items-center gap-3 p-4 rounded-xl border border-border bg-background"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-primary">{index + 1}</span>
                  </div>
                  <span className="text-sm font-medium">{checkpoint}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Fast-Track Option */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl border border-primary/30 bg-gradient-card"
          >
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Zap className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="heading-sm mb-4">
                  Need It <span className="text-gradient">Faster?</span>
                </h3>
                <p className="body-md mb-0 lg:mb-0">
                  Fast-Track previews for 10+ page sites are delivered in 3-5 days instead of a week. 
                  Our premium service ensures complex builds get priority attention from our senior team.
                </p>
              </div>
              <Button variant="premium" size="lg" asChild className="flex-shrink-0">
                <Link to="/preview-pricing">View Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding bg-card">
        <div className="container-tight">
          <h2 className="heading-md mb-6">
            Ready to Start Your <span className="text-gradient">Preview?</span>
          </h2>
          <p className="body-lg max-w-2xl mx-auto mb-8">
            Experience our professional process firsthand. Free for sites under 5 pages.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="premium" size="xl" asChild>
              <Link to="/get-started">
                Get Your Free Preview <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/preview-faq">Common Questions</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
