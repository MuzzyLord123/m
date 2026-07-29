import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Layers, MousePointerClick, Palette, Code2, Smartphone, Globe,
  Sparkles, Zap, Eye, LayoutGrid, PenTool, Boxes, ArrowRight,
  Monitor, Tablet, CheckCircle, Play
} from "lucide-react";

const heroFeatures = [
  { icon: MousePointerClick, label: "Drag & Drop" },
  { icon: Palette, label: "Visual Styling" },
  { icon: Code2, label: "Clean Export" },
  { icon: Smartphone, label: "Responsive" },
];

const capabilities = [
  {
    icon: LayoutGrid,
    title: "Section-Based Building",
    description: "Start from 35+ professionally designed section blocks — heroes, features, testimonials, pricing tables, and more. Each section is fully customizable.",
  },
  {
    icon: PenTool,
    title: "Precision Design Tools",
    description: "Fine-tune every element with granular controls for typography, spacing, colors, borders, shadows, and 3D transforms.",
  },
  {
    icon: Sparkles,
    title: "Animation Engine",
    description: "35+ animation presets with 6 trigger modes, spring physics, and complex easing curves. Create scroll-driven, hover-activated, and load-triggered motion.",
  },
  {
    icon: Boxes,
    title: "Component Library",
    description: "Save and reuse your own components across projects. Build once, deploy everywhere with consistent branding.",
  },
  {
    icon: Smartphone,
    title: "Responsive Breakpoints",
    description: "Design for desktop, tablet, and mobile with breakpoint-specific style overrides. Every element adapts perfectly to any screen.",
  },
  {
    icon: Code2,
    title: "Production-Ready Export",
    description: "Export clean HTML, CSS, and JavaScript. Your designs become deployable code without any lock-in.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Choose a Template",
    description: "Start from a professionally designed template or build from scratch using section blocks.",
  },
  {
    step: "02",
    title: "Design Visually",
    description: "Drag, drop, and style every element with real-time preview. No code required.",
  },
  {
    step: "03",
    title: "Add Interactions",
    description: "Apply animations, hover effects, and scroll triggers to bring your design to life.",
  },
  {
    step: "04",
    title: "Publish or Export",
    description: "Go live instantly or export clean production code for your own hosting.",
  },
];

export default function WorkshopLanding() {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
        <div className="container-tight relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Layers className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">The Workshop</span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Build Websites{" "}
              <span className="text-gradient">Visually</span>
            </motion.h1>

            <motion.p
              className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              A professional-grade website builder built into your Quooro dashboard.
              Drag, drop, style, animate — then publish or export clean code.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row gap-4 mb-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button variant="hero" size="lg" asChild>
                <Link to="/get-started">
                  Start Building
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/workshop/features">
                  <Eye className="w-4 h-4 mr-2" />
                  Explore Features
                </Link>
              </Button>
            </motion.div>

            {/* Hero feature pills */}
            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              {heroFeatures.map((f, i) => (
                <motion.div
                  key={f.label}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 text-sm text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                >
                  <f.icon className="w-4 h-4 text-primary" />
                  {f.label}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Visual Preview Mockup */}
      <section className="py-16">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative rounded-2xl border border-border/50 bg-card overflow-hidden shadow-2xl shadow-black/10"
          >
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-muted/30">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-destructive/40" />
                <div className="w-3 h-3 rounded-full bg-primary/40" />
                <div className="w-3 h-3 rounded-full bg-accent-foreground/30" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 rounded-md bg-background/50 text-xs text-muted-foreground font-mono">
                  workshop.quooro.com
                </div>
              </div>
            </div>
            {/* Editor mockup */}
            <div className="flex h-[400px] md:h-[500px]">
              {/* Left panel */}
              <div className="w-16 md:w-56 border-r border-border/30 bg-muted/10 p-3 hidden sm:block">
                <div className="space-y-2">
                  {["Layers", "Components", "Sections", "Assets", "Pages"].map((label, i) => (
                    <div key={label} className="flex items-center gap-2 px-2 py-2 rounded-md text-xs text-muted-foreground hover:bg-muted/30 transition-colors">
                      <div className="w-4 h-4 rounded bg-primary/10" />
                      <span className="hidden md:inline">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Canvas */}
              <div className="flex-1 flex items-center justify-center bg-background/50 relative">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Play className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-muted-foreground text-sm">Visual Editor Canvas</p>
                </div>
                {/* Floating elements */}
                <motion.div
                  className="absolute top-8 right-8 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  1440 × 900
                </motion.div>
              </div>
              {/* Right panel */}
              <div className="w-16 md:w-56 border-l border-border/30 bg-muted/10 p-3 hidden sm:block">
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground px-2">Style</p>
                  {["Background", "Typography", "Spacing", "Border", "Shadow"].map((label) => (
                    <div key={label} className="flex items-center justify-between px-2 py-1.5 text-xs text-muted-foreground">
                      <span className="hidden md:inline">{label}</span>
                      <div className="w-12 h-5 rounded bg-muted/40" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Capabilities */}
      <section className="py-24">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Professional Tools, <span className="text-gradient">Zero Complexity</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to design, build, and launch — without writing a single line of code.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card p-6 group hover:border-primary/20 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <cap.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{cap.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Device Preview */}
      <section className="py-24 bg-card/50">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              Design for Every Screen
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time responsive previews let you perfect your design across desktop, tablet, and mobile.
            </p>
          </motion.div>

          <div className="flex items-end justify-center gap-6 md:gap-10">
            {[
              { icon: Monitor, label: "Desktop", w: "w-64 md:w-80", h: "h-44 md:h-52" },
              { icon: Tablet, label: "Tablet", w: "w-36 md:w-44", h: "h-48 md:h-56" },
              { icon: Smartphone, label: "Mobile", w: "w-20 md:w-24", h: "h-40 md:h-48" },
            ].map((device, i) => (
              <motion.div
                key={device.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className={`${device.w} ${device.h} rounded-xl border-2 border-border/50 bg-background flex items-center justify-center mb-3`}>
                  <device.icon className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <span className="text-xs text-muted-foreground">{device.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-24">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
              From Idea to Live Site
            </h2>
            <p className="text-lg text-muted-foreground">Four steps. Zero code.</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="glass-card p-6 h-full">
                  <span className="text-4xl font-display font-bold text-primary/20 mb-4 block">{step.step}</span>
                  <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 md:p-16 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Build?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Get access to the Workshop as part of your Quooro dashboard. Start designing today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/get-started">Get Started</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/workshop/guide">Read the Guide</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}