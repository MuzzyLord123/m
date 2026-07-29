import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Table2,
  Presentation,
  StickyNote,
  FolderOpen,
  Receipt,
  Users,
  CheckSquare,
  BookOpen,
  BarChart3,
  Shield,
  Zap,
  Clock,
  Lock,
  Sparkles,
  Layers,
  Monitor,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";
import { ScrollSection, StaggeredScrollSection, ScrollItem } from "@/components/ScrollSection";

const officeApps = [
  {
    icon: FileText,
    title: "Docs",
    description: "Rich document editor with formatting, collaboration tools, and export to PDF.",
  },
  {
    icon: Table2,
    title: "Sheets",
    description: "Powerful spreadsheets with formulas, charts, and data analysis capabilities.",
  },
  {
    icon: Presentation,
    title: "Slides",
    description: "Create stunning presentations with themes, animations, and live previews.",
  },
  {
    icon: StickyNote,
    title: "Notes",
    description: "Quick capture notebooks with rich text, checklists, and auto-save.",
  },
  {
    icon: FolderOpen,
    title: "Files",
    description: "Secure file management with folders, tagging, and instant search.",
  },
  {
    icon: Receipt,
    title: "Invoices",
    description: "Professional invoicing with templates, line items, and payment tracking.",
  },
  {
    icon: Users,
    title: "HR",
    description: "Employee management, time tracking, and organisational charts.",
  },
  {
    icon: CheckSquare,
    title: "Tasks",
    description: "Project task boards with assignments, due dates, and priority levels.",
  },
  {
    icon: BookOpen,
    title: "Wiki",
    description: "Internal knowledge base for documentation, SOPs, and team resources.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Business intelligence dashboards with real-time charts and custom reports.",
  },
];

const benefits = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "All data encrypted at rest and in transit with role-based access controls.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built on modern infrastructure for instant load times and real-time sync.",
  },
  {
    icon: Clock,
    title: "Auto-Save Everything",
    description: "Never lose work — every change is automatically saved and versioned.",
  },
  {
    icon: Lock,
    title: "Your Data, Your Control",
    description: "Full data ownership with export capabilities and no vendor lock-in.",
  },
];

export default function QuooroOffice() {
  return (
    <Layout>
      {/* Hero */}
      <PageHero
        eyebrow="Platform"
        index="04"
        crumbs={[{ label: "Home", href: "/" }, { label: "Quooro Office" }]}
        title="Quooro"
        highlight="Office"
        body="A productivity suite with 25+ tools built in — docs, sheets, invoices, tasks, and the rest."
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

      {/* Apps Grid */}
      <section className="section-padding">
        <div className="container-tight">
          <ScrollSection direction="up" className="mb-12 sm:mb-16">
            <h2 className="heading-lg mb-4">
              Everything Your Team <span className="text-gradient">Needs</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Over 25 professional applications designed to replace your scattered tool stack with one unified suite.
            </p>
          </ScrollSection>

          <StaggeredScrollSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-0 border-l border-t border-border/60">
            {officeApps.map((app) => (
              <ScrollItem key={app.title}>
                <motion.div
                  whileHover={{ y: -6, transition: { duration: 0.3 } }}
                  className="p-5 sm:p-6 border-b border-r border-border/60 h-full text-center group relative overflow-hidden"
                >
                  {/* Hover accent */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mx-auto mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 relative z-10">
                    <app.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg mb-2">{app.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{app.description}</p>
                </motion.div>
              </ScrollItem>
            ))}
          </StaggeredScrollSection>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding liquid-glass">
        <div className="container-tight">
          <ScrollSection direction="up" className="mb-12 sm:mb-16">
            <h2 className="heading-lg mb-4">
              Built for <span className="text-gradient">Business</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Not just another productivity suite — Quooro Office is engineered for security, speed, and scale.
            </p>
          </ScrollSection>

          <StaggeredScrollSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-0 border-l border-t border-border/60">
            {benefits.map((item) => (
              <ScrollItem key={item.title}>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="p-6 sm:p-8 border-b border-r border-border/60 h-full text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-5">
                    <item.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-lg sm:text-xl mb-3">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                </motion.div>
              </ScrollItem>
            ))}
          </StaggeredScrollSection>
        </div>
      </section>

      {/* Quick Actions & Workflow */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <ScrollSection direction="left">
              <div>
                <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
                  Seamless Workflow
                </span>
                <h2 className="heading-lg mb-4">
                  One Platform, <span className="text-gradient">Zero Friction</span>
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg mb-6 leading-relaxed">
                  Switch between Docs, Sheets, Tasks, and more without leaving the platform.
                  Quick Actions let you jump to any app instantly — no context switching, no lost tabs.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Instant app switching with Quick Actions FAB",
                    "Unified search across all Office tools",
                    "Auto-save with full version history",
                    "Dark enterprise-glass aesthetic",
                    "Responsive across desktop, tablet, and mobile",
                  ].map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant="premium" size="lg" asChild>
                  <Link to="/get-started">
                    Start Building <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </ScrollSection>

            <ScrollSection direction="right">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { icon: Monitor, label: "Dashboard", color: "from-blue-500/20 to-blue-600/10" },
                  { icon: FileText, label: "Documents", color: "from-emerald-500/20 to-emerald-600/10" },
                  { icon: Table2, label: "Spreadsheets", color: "from-amber-500/20 to-amber-600/10" },
                  { icon: CheckSquare, label: "Task Boards", color: "from-purple-500/20 to-purple-600/10" },
                ].map((item) => (
                  <motion.div
                    key={item.label}
                    whileHover={{ scale: 1.04 }}
                    className={`p-6 sm:p-8 rounded-2xl bg-gradient-to-br ${item.color} border border-border/20 flex flex-col items-center justify-center gap-3 aspect-square`}
                  >
                    <item.icon className="w-8 h-8 text-foreground/80" />
                    <span className="text-sm font-medium text-foreground/70">{item.label}</span>
                  </motion.div>
                ))}
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-tight">
          <ScrollSection direction="up">
            <div className="p-8 sm:p-12 lg:p-16 border border-border/60 bg-background">
              <h2 className="heading-lg mb-4">
                Ready to Streamline Your <span className="text-gradient">Operations?</span>
              </h2>
              <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto mb-8">
                Quooro Office comes included with every Digital Operations Platform subscription. 
                Get started today and consolidate your entire toolkit.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button variant="premium" size="xl" asChild>
                  <Link to="/get-started">
                    Get Started Free <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/packages">View Packages</Link>
                </Button>
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>
    </Layout>
  );
}
