import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BookOpen, Layers, MousePointerClick, Palette, Code2, Sparkles,
  LayoutGrid, PenTool, Smartphone, Download, ArrowRight, CheckCircle,
  ChevronRight, Globe, Boxes, Wand2, Eye, Monitor, Tablet
} from "lucide-react";
import { useState } from "react";

const guideSections = [
  {
    id: "getting-started",
    icon: Layers,
    title: "Getting Started",
    steps: [
      {
        title: "Access the Workshop",
        content: "Navigate to your Quooro Lounge dashboard and select 'Workshop' from the sidebar under the Projects section. The Workshop opens in a dedicated full-screen editor environment.",
      },
      {
        title: "Create a New Site",
        content: "Click 'Create New Site' to start fresh, or browse the Template Marketplace to begin with a professionally designed starting point. Give your site a name and optional description.",
      },
      {
        title: "Understanding the Interface",
        content: "The editor is divided into three panels: the left panel contains your layers tree, component library, and page manager. The center is your live canvas. The right panel shows style controls for the selected element.",
      },
    ],
  },
  {
    id: "building",
    icon: MousePointerClick,
    title: "Building Your Site",
    steps: [
      {
        title: "Adding Sections",
        content: "Open the Sections Library from the left panel. Browse 35+ pre-built section blocks organized by type — Hero, Features, Pricing, Testimonials, Contact, Footer, and more. Click or drag a section onto your canvas.",
      },
      {
        title: "Working with Elements",
        content: "Each section contains editable elements (text, images, buttons, containers). Click any element to select it. Double-click text to edit inline. Use the right panel to modify styles, or drag elements to reposition them.",
      },
      {
        title: "Using the Component Library",
        content: "Save any element or group as a reusable component via right-click → 'Save as Component'. Access saved components from the left panel. Components can be reused across pages and sites.",
      },
      {
        title: "Managing Pages",
        content: "Use the Pages panel to create, rename, reorder, and delete pages. Each page has its own URL slug and SEO settings. Set any page as your homepage.",
      },
    ],
  },
  {
    id: "styling",
    icon: Palette,
    title: "Styling & Design",
    steps: [
      {
        title: "Typography",
        content: "Select any text element to access font controls: family, size, weight, line height, letter spacing, text alignment, color, and text decoration. Use the global styles panel to set site-wide font defaults.",
      },
      {
        title: "Colors & Backgrounds",
        content: "Use the HSL color picker to set text, background, and border colors. Create linear or radial gradients. Apply background images with position, size, and overlay controls.",
      },
      {
        title: "Spacing & Layout",
        content: "Control margin, padding, and gap with visual handles or precise numerical input. Use flexbox or CSS Grid for layout. The container system supports auto-layout with alignment and distribution controls.",
      },
      {
        title: "Advanced Effects",
        content: "Apply box shadows, text shadows, backdrop blur, and CSS filters. Use 3D transforms (rotateX/Y/Z with perspective) for creative depth effects. All styles support hover state overrides.",
      },
    ],
  },
  {
    id: "animations",
    icon: Sparkles,
    title: "Animations & Motion",
    steps: [
      {
        title: "Applying Animation Presets",
        content: "Select an element, then open the Animation panel in the right sidebar. Choose from 35+ presets including Fade In, Slide Up, Scale In, Blur In, Bounce, Rotate, and more.",
      },
      {
        title: "Trigger Modes",
        content: "Set when animations fire: onLoad (page load), onView (enters viewport), onScroll (scroll progress), onHover (mouse enter), onClick (user clicks), or stagger (sequential children).",
      },
      {
        title: "Customizing Timing",
        content: "Adjust duration, delay, and easing. Choose from standard curves (ease, ease-in-out) or physics-based options (Spring, Bounce, Elastic) with configurable stiffness and damping.",
      },
      {
        title: "Hover Interactions",
        content: "Enable hover effects like 3D Tilt (element follows mouse position), Lift (subtle elevation), Glow (ambient light), or custom property changes. Each effect has granular intensity controls.",
      },
    ],
  },
  {
    id: "responsive",
    icon: Smartphone,
    title: "Responsive Design",
    steps: [
      {
        title: "Breakpoint Previews",
        content: "Toggle between Desktop (1440px), Tablet (768px), and Mobile (375px) views using the device buttons in the top toolbar. The canvas resizes in real-time to show your layout at each breakpoint.",
      },
      {
        title: "Breakpoint Overrides",
        content: "Any style property can be overridden per breakpoint. Select a smaller breakpoint, modify styles, and those changes only apply at that size. Desktop styles cascade down unless overridden.",
      },
      {
        title: "Responsive Tips",
        content: "Use relative units (%, rem) where possible. Switch multi-column grids to single columns on mobile. Increase touch targets to at least 44px. Preview your site on real devices using the published URL.",
      },
    ],
  },
  {
    id: "publishing",
    icon: Globe,
    title: "Publishing & Export",
    steps: [
      {
        title: "Live Preview",
        content: "Click the Preview button (eye icon) to open a full-screen preview of your site. Navigate between pages and test interactions before publishing.",
      },
      {
        title: "Publishing Your Site",
        content: "Click 'Publish' to make your site live. Each published site gets a unique URL. You can republish at any time to update the live version.",
      },
      {
        title: "Exporting Code",
        content: "Click the Export button to download your site as clean HTML, CSS, and JavaScript. The export includes all pages, assets, responsive styles, and animations. No proprietary dependencies.",
      },
      {
        title: "CSS Preview",
        content: "Use the CSS Preview dialog to inspect the generated CSS for any element before exporting. This helps developers understand and customize the output.",
      },
    ],
  },
];

export default function WorkshopGuide() {
  const [activeSection, setActiveSection] = useState("getting-started");

  return (
    <Layout>
      {/* Hero */}
      <section className="pt-32 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
        <div className="container-tight relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Workshop Guide</span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-display font-bold mb-6">
              Learn the <span className="text-gradient">Workshop</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Step-by-step documentation covering every feature of the visual website builder.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Guide Content */}
      <section className="py-16">
        <div className="container-tight">
          <div className="flex flex-col lg:flex-row gap-10">
            {/* Sidebar Nav */}
            <motion.nav
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-64 shrink-0"
            >
              <div className="lg:sticky lg:top-24 space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 px-3">Contents</p>
                {guideSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${
                      activeSection === section.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <section.icon className="w-4 h-4 shrink-0" />
                    {section.title}
                  </button>
                ))}
              </div>
            </motion.nav>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-16">
              {guideSections.map((section, sIndex) => (
                <motion.div
                  key={section.id}
                  id={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  onViewportEnter={() => setActiveSection(section.id)}
                >
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-display font-bold">{section.title}</h2>
                  </div>

                  <div className="space-y-6">
                    {section.steps.map((step, i) => (
                      <motion.div
                        key={step.title}
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="relative pl-8 border-l-2 border-border/50 pb-6 last:pb-0"
                      >
                        <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        </div>
                        <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                        <p className="text-muted-foreground leading-relaxed">{step.content}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
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
            className="glass-card p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Start Building?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Access the Workshop through your Quooro dashboard and bring your vision to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="lg" asChild>
                <Link to="/get-started">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/workshop">Back to Overview</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}