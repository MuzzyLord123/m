import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Layers, MousePointerClick, Type, Image, Box, Grid3X3,
  Paintbrush, Move, RotateCw, Maximize2, Minimize2, AlignCenter,
  Wand2, Sparkles, Zap, Timer, Eye, EyeOff,
  Code2, FileCode, Download, Share2, Globe, Rocket,
  Smartphone, Tablet, Monitor, ArrowRight, CheckCircle,
  PenTool, Palette, SlidersHorizontal, Boxes, LayoutGrid
} from "lucide-react";

const featureCategories = [
  {
    title: "Canvas & Elements",
    description: "The building blocks of every design",
    icon: Layers,
    features: [
      { icon: MousePointerClick, name: "Drag & Drop", description: "Place and arrange elements with intuitive drag-and-drop" },
      { icon: Type, name: "Rich Typography", description: "Full control over fonts, weights, line heights, and letter spacing" },
      { icon: Image, name: "Media Handling", description: "Upload, position, and style images with filters and overlays" },
      { icon: Box, name: "Container System", description: "Flexible containers with auto-layout, flexbox, and grid" },
      { icon: Grid3X3, name: "Smart Grid", description: "CSS Grid layouts with visual handles for rows and columns" },
      { icon: AlignCenter, name: "Alignment Tools", description: "Snap-to-grid, smart guides, and multi-element alignment" },
    ],
  },
  {
    title: "Design & Styling",
    description: "Pixel-perfect visual control",
    icon: Paintbrush,
    features: [
      { icon: Palette, name: "Color System", description: "HSL color picker with gradients, opacity, and saved palettes" },
      { icon: SlidersHorizontal, name: "Spacing Controls", description: "Margin, padding, and gap with visual handles and precise input" },
      { icon: PenTool, name: "Borders & Radius", description: "Per-corner radius, border styles, and outline controls" },
      { icon: Move, name: "Transforms", description: "3D rotateX/Y/Z, perspective, scale, and translate" },
      { icon: Eye, name: "Filters & Effects", description: "Blur, brightness, contrast, saturate, and backdrop filters" },
      { icon: Maximize2, name: "Responsive Overrides", description: "Per-breakpoint style adjustments for desktop, tablet, and mobile" },
    ],
  },
  {
    title: "Animations & Interactions",
    description: "Motion that delights users",
    icon: Sparkles,
    features: [
      { icon: Zap, name: "35+ Presets", description: "Fade, slide, scale, rotate, blur, bounce, and more" },
      { icon: Timer, name: "6 Trigger Modes", description: "onLoad, onScroll, onView, onHover, onClick, and stagger" },
      { icon: RotateCw, name: "Spring Physics", description: "Spring, bounce, and elastic easing curves for natural motion" },
      { icon: Wand2, name: "Hover Effects", description: "3D tilt, lift, glow, and color-shift micro-interactions" },
      { icon: Minimize2, name: "Scroll Animations", description: "Parallax, reveal, and progress-based scroll effects" },
      { icon: EyeOff, name: "Stagger Children", description: "Sequenced animations across child elements with custom delays" },
    ],
  },
  {
    title: "Templates & Components",
    description: "Start fast, stay consistent",
    icon: Boxes,
    features: [
      { icon: LayoutGrid, name: "Section Blocks", description: "35+ pre-designed sections: heroes, features, pricing, testimonials" },
      { icon: Boxes, name: "Component Library", description: "Save and reuse your own custom components" },
      { icon: Globe, name: "Template Marketplace", description: "Full-page templates for common website types" },
      { icon: Layers, name: "Multi-Page Sites", description: "Create and manage multiple pages with shared navigation" },
      { icon: Share2, name: "Global Styles", description: "Site-wide color, font, and spacing tokens" },
      { icon: Rocket, name: "AI Generation", description: "Generate sections and layouts with natural language prompts" },
    ],
  },
  {
    title: "Export & Deploy",
    description: "Your code, your control",
    icon: Code2,
    features: [
      { icon: FileCode, name: "HTML Export", description: "Clean, semantic HTML with embedded styles" },
      { icon: Code2, name: "CSS Export", description: "Organized CSS with custom properties and media queries" },
      { icon: Download, name: "ZIP Download", description: "Complete project bundle ready for deployment" },
      { icon: Globe, name: "One-Click Publish", description: "Deploy directly from the Workshop to a live URL" },
      { icon: Smartphone, name: "Responsive Output", description: "Exported code includes all breakpoint styles" },
      { icon: CheckCircle, name: "No Lock-In", description: "Standard code that works anywhere — no dependencies" },
    ],
  },
];

export default function WorkshopFeatures() {
  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
        <div className="container-tight relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Feature Breakdown</span>
            </motion.div>
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Every Tool You <span className="text-gradient">Need</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              A comprehensive look at everything the Workshop puts at your fingertips.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Feature Categories */}
      {featureCategories.map((category, catIndex) => (
        <section
          key={category.title}
          className={`py-20 ${catIndex % 2 === 1 ? "bg-card/50" : ""}`}
        >
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <category.icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl md:text-3xl font-display font-bold">{category.title}</h2>
              </div>
              <p className="text-muted-foreground ml-[52px]">{category.description}</p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {category.features.map((feature, i) => (
                <motion.div
                  key={feature.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-4 p-5 rounded-xl border border-border/50 bg-background hover:border-primary/20 transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.name}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="py-24">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              See It in Action
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              The best way to understand the Workshop is to try it. Get started with your Quooro dashboard today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/get-started">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
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