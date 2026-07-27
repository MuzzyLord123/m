import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useRef } from "react";
import { 
  ArrowRight, 
  Check, 
  Zap, 
  Shield, 
  Clock, 
  Code2, 
  TrendingUp,
  Users,
  Globe,
  Palette,
  BarChart3,
  MessageSquare,
  Heart,
  Rocket,
  Target,
  Sparkles,
  Lock,
  Upload,
  Eye,
  FileText,
  Database,
  Layers,
  Settings,
  Monitor,
  Smartphone
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ScrollSection, StaggeredScrollSection, ScrollItem } from "@/components/ScrollSection";
import { ProcessSection } from "@/components/marketing/ProcessSection";
import { WhyQuooroSection } from "@/components/marketing/WhyQuooroSection";
import { ParallaxImage, ParallaxBackground } from "@/components/ParallaxImage";
import { TestimonialCarousel } from "@/components/TestimonialCarousel";
import { FloatingScreenshotHero } from "@/components/marketing/FloatingScreenshotHero";
import { EditableField } from "@/components/marketing/EditableField";
import { useHomepageHeader } from "@/hooks/useHomepageHeader";

import { lazy, Suspense } from "react";
const Globe3D = lazy(() => import("@/components/Globe3D").then(m => ({ default: m.Globe3D })));

import heroWorkspace from "@/assets/hero-workspace.jpg";
import codeTransform from "@/assets/code-transform.webp";

// What We Do - 5 Pillars with color accents
const whatWeDo = [
  {
    icon: Monitor,
    title: "Websites",
    description: "High-performance marketing websites built for conversion and scale.",
    gradient: "from-foreground/5 to-foreground/10",
    iconBg: "from-foreground/90 to-foreground/60",
  },
  {
    icon: Layers,
    title: "Apps & Dashboards",
    description: "Custom-built applications, internal tools, and dashboards tailored to how your business operates.",
    gradient: "from-foreground/5 to-foreground/10",
    iconBg: "from-foreground/90 to-foreground/60",
  },
  {
    icon: Database,
    title: "Digital Operations Platform",
    description: "A secure client dashboard where your business, data, assets, and communication live.",
    gradient: "from-foreground/5 to-foreground/10",
    iconBg: "from-foreground/90 to-foreground/60",
  },
  {
    icon: FileText,
    title: "Quooro Office",
    description: "An enterprise productivity suite with 25+ tools — Docs, Sheets, Invoices, Tasks, and more.",
    href: "/quooro-office",
    gradient: "from-foreground/5 to-foreground/10",
    iconBg: "from-foreground/90 to-foreground/60",
  },
  {
    icon: Settings,
    title: "Ongoing Management",
    description: "We don't disappear after launch — we manage, support, and evolve your systems.",
    gradient: "from-foreground/5 to-foreground/10",
    iconBg: "from-foreground/90 to-foreground/60",
  }
];

// Dashboard Features
const dashboardFeatures = [
  "Website management & preview access",
  "App project tracking & milestones",
  "Asset & file storage",
  "Direct messaging with developers",
  "Content requests & approvals",
  "SEO insights & analytics",
  "Ad & social media management",
  "Marketing calendar visibility",
  "Secure access with 2FA",
  "Role-based team permissions"
];

// Free Preview Structure
const freePreviewIncludes = [
  { title: "Homepage Design", description: "Full homepage concept tailored to your brand", color: "from-foreground/90 to-foreground/60" },
  { title: "Up to 2 Additional Pages", description: "Key pages to demonstrate site structure", color: "from-foreground/90 to-foreground/60" },
  { title: "Mobile-Responsive Preview", description: "See how it looks on all devices", color: "from-foreground/90 to-foreground/60" }
];

// App Examples
const appExamples = [
  "Client portals",
  "Internal dashboards",
  "Inventory systems",
  "Databases",
  "Workflow tools",
  "Management systems",
  "MVPs and complex platforms"
];

const services = [
  {
    icon: Globe,
    title: "Web Development",
    description: "Custom-built websites from landing pages to enterprise platforms",
    color: "from-foreground/90 to-foreground/60",
  },
  {
    icon: MessageSquare,
    title: "Social Media",
    description: "Complete platform management across all major networks",
    color: "from-foreground/90 to-foreground/60",
  },
  {
    icon: BarChart3,
    title: "Ad Management",
    description: "PPC campaigns, social ads, and conversion optimisation",
    color: "from-foreground/90 to-foreground/60",
  },
  {
    icon: Palette,
    title: "Content Creation",
    description: "Professional photography, video, and copywriting",
    color: "from-foreground/90 to-foreground/60",
  },
  {
    icon: TrendingUp,
    title: "SEO & Strategy",
    description: "Keyword research, competitor analysis, and growth tactics",
    color: "from-foreground/90 to-foreground/60",
  },
  {
    icon: Users,
    title: "Account Management",
    description: "Complete digital presence and reputation oversight",
    color: "from-foreground/90 to-foreground/60",
  }
];

const trustSignals = [
  { icon: Shield, text: "Enterprise-grade security" },
  { icon: Heart, text: "UK-based team" },
  { icon: Zap, text: "Built for scale" },
  { icon: Check, text: "Full ownership" },
];

// Lightweight CSS-only floating orb — no JS animation overhead
function FloatingOrb({ className, delay = 0 }: { className: string; delay?: number }) {
  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        animation: `floatingOrb 8s ease-in-out ${delay}s infinite`,
        willChange: 'transform, opacity',
        contain: 'layout style paint',
      }}
    />
  );
}

export default function Index() {
  const hWhatWeDo = useHomepageHeader("home_what_we_do").data;
  const hGlobal = useHomepageHeader("home_global_reach").data;
  const hDashboard = useHomepageHeader("home_dashboard").data;
  const hFreePreviews = useHomepageHeader("home_free_previews").data;
  const hApps = useHomepageHeader("home_apps").data;
  const hServices = useHomepageHeader("home_services").data;
  const hBuiltFor = useHomepageHeader("home_built_for").data;
  const hCta = useHomepageHeader("home_cta").data;

  return (
    <Layout>
      {/* Hero Section - 3D Floating Screenshots */}
      <FloatingScreenshotHero />

      {/* Mobile-only trust badges + stats (shown between hero screens and What We Do) */}
      <div className="md:hidden px-4 pt-8 pb-2">
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {[
            { icon: Shield, text: "Enterprise-grade security" },
            { icon: Heart, text: "UK-based team" },
            { icon: Zap, text: "Built for scale" },
            { icon: Check, text: "Full ownership" },
          ].map((signal, index) => (
            <motion.div
              key={signal.text}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] text-foreground/80"
              style={{
                backgroundColor: 'hsl(var(--muted) / 0.4)',
                border: '1px solid hsl(var(--border) / 0.3)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <signal.icon className="w-3 h-3 text-primary" />
              <span>{signal.text}</span>
            </motion.div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto">
          {[
            { value: "UK", label: "Based" },
            { value: "25+", label: "Tools" },
            { value: "100%", label: "Ownership" },
            { value: "Free", label: "Preview" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
              className="text-center"
            >
              <span className="text-lg font-bold text-gradient block">{stat.value}</span>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Elegant gradient divider */}
      <div className="relative h-24 sm:h-32 overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--primary) / 0.03) 40%, hsl(var(--primary) / 0.06) 60%, hsl(var(--background)) 100%)',
        }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 sm:w-32 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), transparent)' }} />
        </div>
      </div>

      {/* What We Do — editorial Apple-style index */}
      <section id="section-what-we-do" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, hsl(var(--foreground) / 0.025), transparent 70%)' }} />

        <div className="container-tight relative z-10 max-w-5xl">
          <ScrollSection direction="up" className="text-center mb-16 sm:mb-24">
            <span className="eyebrow">
              <EditableField sectionKey="home_what_we_do" field="eyebrow" value={hWhatWeDo.eyebrow} label="Eyebrow">{hWhatWeDo.eyebrow}</EditableField>
            </span>
            <h2 className="heading-lg mb-5">
              <EditableField sectionKey="home_what_we_do" field="titlePrefix" value={hWhatWeDo.titlePrefix} label="Title">{hWhatWeDo.titlePrefix}</EditableField>{" "}
              <span className="text-gradient"><EditableField sectionKey="home_what_we_do" field="titleHighlight" value={hWhatWeDo.titleHighlight} label="Title highlight">{hWhatWeDo.titleHighlight}</EditableField></span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mx-auto font-light">
              <EditableField sectionKey="home_what_we_do" field="subtitle" value={hWhatWeDo.subtitle} label="Subtitle" kind="textarea">{hWhatWeDo.subtitle}</EditableField>
            </p>
          </ScrollSection>

          <div
            className="rounded-[28px] overflow-hidden"
            style={{
              border: '1px solid hsl(var(--foreground) / 0.07)',
              background: 'linear-gradient(180deg, hsl(var(--foreground) / 0.015), hsl(var(--foreground) / 0.005))',
              backdropFilter: 'blur(8px)',
            }}
          >
            {whatWeDo.map((item, idx) => {
              const number = String(idx + 1).padStart(2, '0');
              const isLast = idx === whatWeDo.length - 1;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.7, delay: idx * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative"
                  style={!isLast ? { borderBottom: '1px solid hsl(var(--foreground) / 0.06)' } : undefined}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.025), transparent)' }}
                  />

                  <div className="relative flex flex-col items-center text-center gap-3 px-5 py-8 sm:grid sm:grid-cols-[72px_56px_1fr_40px] sm:items-center sm:text-left sm:gap-8 sm:px-10 sm:py-9">
                    <span className="font-serif italic text-foreground/30 text-base sm:text-2xl tabular-nums tracking-tight order-1 sm:order-none">
                      {number}
                    </span>

                    <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-[1.04] order-2 sm:order-none"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--foreground) / 0.06), hsl(var(--foreground) / 0.02))',
                        border: '1px solid hsl(var(--foreground) / 0.08)',
                      }}
                    >
                      <item.icon className="w-5 h-5 text-foreground/75" strokeWidth={1.5} />
                    </div>

                    <div className="min-w-0 order-3 sm:order-none sm:col-start-3">
                      <h3 className="font-display font-semibold text-xl sm:text-2xl lg:text-[1.7rem] leading-tight tracking-tight mb-1.5 transition-transform duration-500 sm:group-hover:translate-x-0.5">
                        {item.title}
                      </h3>
                      <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed max-w-md sm:max-w-2xl mx-auto sm:mx-0 font-light">
                        {item.description}
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-2 group-hover:translate-x-0"
                      style={{ border: '1px solid hsl(var(--foreground) / 0.12)' }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-foreground/60">
                        <path d="M3 6h6m0 0L6 3m3 3L6 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>


      {/* Minimal accent divider */}
      <div className="relative h-16 sm:h-24 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-8 sm:w-16 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--border) / 0.4))' }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(var(--primary) / 0.3)' }} />
            <div className="w-8 sm:w-16 h-px" style={{ background: 'linear-gradient(90deg, hsl(var(--border) / 0.4), transparent)' }} />
          </div>
        </div>
      </div>

      {/* Global Reach Section with 3D Globe */}
      <section id="section-global-reach" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 100%, hsl(var(--foreground) / 0.03), transparent 70%)' }} />
        <FloatingOrb className="w-72 h-72 bg-gradient-to-br from-foreground/5 to-foreground/10 blur-3xl -bottom-20 -right-20" delay={1} />
        <FloatingOrb className="w-56 h-56 bg-gradient-to-br from-foreground/5 to-foreground/10 blur-3xl top-10 -left-10" delay={3} />

        <div className="container mx-auto px-4 relative z-10">
          <ScrollSection direction="up" className="text-center mb-8 sm:mb-12">
            <span className="eyebrow">
              <EditableField sectionKey="home_global_reach" field="eyebrow" value={hGlobal.eyebrow} label="Eyebrow">{hGlobal.eyebrow}</EditableField>
            </span>
            <h2 className="heading-lg mb-3 sm:mb-4">
              <EditableField sectionKey="home_global_reach" field="titlePrefix" value={hGlobal.titlePrefix} label="Title">{hGlobal.titlePrefix}</EditableField>{" "}
              <span className="text-gradient"><EditableField sectionKey="home_global_reach" field="titleHighlight" value={hGlobal.titleHighlight} label="Title highlight">{hGlobal.titleHighlight}</EditableField></span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              <EditableField sectionKey="home_global_reach" field="subtitle" value={hGlobal.subtitle} label="Subtitle" kind="textarea">{hGlobal.subtitle}</EditableField>
            </p>
          </ScrollSection>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
            {/* 3D Globe */}
            <ScrollSection direction="left">
              <div className="flex flex-col items-center">
                <div className="relative aspect-square max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg w-full">
                  <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent rounded-full blur-3xl" />
                  <Suspense fallback={<div className="w-full h-full rounded-full bg-muted/20 animate-pulse" />}>
                    <Globe3D />
                  </Suspense>
                </div>
                
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5, duration: 0.6 }}
                  className="text-center text-xs sm:text-sm lg:text-base text-white/80 mt-4 sm:mt-6 px-3 py-1.5 sm:px-4 sm:py-2 bg-black/50 backdrop-blur-sm rounded-full"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
                >
                  Drag to explore • Touch & swipe on mobile
                </motion.p>
              </div>
            </ScrollSection>

            {/* Reach Cards with colorful accents */}
            <ScrollSection direction="right">
              <div className="space-y-4 sm:space-y-6">
                {[
                  { icon: Smartphone, title: "Local", color: "from-foreground/90 to-foreground/60", desc: "We understand local markets. Whether you're a startup in London or an established business in Manchester, we build systems that connect you with customers in your community." },
                  { icon: TrendingUp, title: "Nationwide", color: "from-foreground/90 to-foreground/60", desc: "Expanding across the UK? We create scalable solutions that grow with your business, with multi-location support and national strategies." },
                  { icon: Globe, title: "Worldwide", color: "from-foreground/90 to-foreground/60", desc: "No borders, no limits. We serve clients across the globe with multilingual platforms, international systems, and 24/7 support across time zones." },
                ].map((item, idx) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 * (idx + 1) }}
                    className="liquid-glass-card p-4 sm:p-6 relative overflow-hidden premium-hover premium-shimmer"
                  >
                    <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${item.color}`} />
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shrink-0`}>
                        <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 sm:mb-2">{item.title}</h3>
                        <p className="text-sm sm:text-base text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollSection>
          </div>
          
          {/* Stats Section — colorful */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-12">
            {[
              { value: "UK", label: "Based Team", color: "from-foreground/90 to-foreground/60" },
              { value: "25+", label: "Built-in Tools", color: "from-foreground/90 to-foreground/60" },
              { value: "Full", label: "Ownership", color: "from-foreground/90 to-foreground/60" },
              { value: "Free", label: "Preview First", color: "from-foreground/90 to-foreground/60" },
            ].map((stat) => (
              <div key={stat.label} className="text-center p-4 sm:p-6 rounded-2xl liquid-glass-subtle relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-[0.06] pointer-events-none`} />
                <span className={`text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent block`}>{stat.value}</span>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote divider */}
      <div className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, hsl(var(--background)), hsl(var(--primary) / 0.02), hsl(var(--background)))' }} />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-lg sm:text-2xl md:text-3xl font-display font-bold">
              Your Team. Your Vision. <span className="text-gradient">Our Platform.</span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Customer Dashboard Section */}
      <section id="section-dashboard" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--foreground) / 0.025), transparent 70%)' }} />
        <FloatingOrb className="w-80 h-80 bg-gradient-to-br from-foreground/5 to-foreground/10 blur-3xl -top-32 right-0" delay={2} />

        <div className="container-tight relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <ScrollSection direction="left">
              <span className="eyebrow">
                <EditableField sectionKey="home_dashboard" field="eyebrow" value={hDashboard.eyebrow} label="Eyebrow">{hDashboard.eyebrow}</EditableField>
              </span>
              <h2 className="heading-lg mb-4 sm:mb-6">
                <EditableField sectionKey="home_dashboard" field="titlePrefix" value={hDashboard.titlePrefix} label="Title">{hDashboard.titlePrefix}</EditableField>{" "}
                <span className="text-gradient"><EditableField sectionKey="home_dashboard" field="titleHighlight" value={hDashboard.titleHighlight} label="Title highlight">{hDashboard.titleHighlight}</EditableField></span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                <EditableField sectionKey="home_dashboard" field="subtitle" value={hDashboard.subtitle} label="Subtitle" kind="textarea">{hDashboard.subtitle}</EditableField>
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8">
                {dashboardFeatures.map((feature, index) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-2 sm:gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-foreground/90 to-foreground/60 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground">{feature}</span>
                  </motion.div>
                ))}
              </div>

              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/client-portal">
                  See How the Dashboard Works <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </ScrollSection>

            <ScrollSection direction="right">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-foreground/5 via-foreground/5 to-foreground/10 rounded-3xl blur-2xl" />
                <div className="relative p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl liquid-glass-card border border-primary/20">
                  <div className="flex items-center gap-2 sm:gap-3 pb-4 sm:pb-6 border-b border-border/50 mb-4 sm:mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-foreground/90 to-foreground/60 flex items-center justify-center">
                      <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">Quooro Dashboard</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Digital operations hub</p>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span className="text-xs text-muted-foreground hidden sm:inline">Secure</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 sm:space-y-4">
                    {[
                      { icon: Monitor, title: "Website Management", desc: "Preview, status & updates", color: "from-foreground/90 to-foreground/60" },
                      { icon: Layers, title: "App Projects", desc: "Track milestones & progress", color: "from-foreground/90 to-foreground/60" },
                      { icon: Upload, title: "Asset Centre", desc: "Upload & manage files", color: "from-foreground/90 to-foreground/60" },
                      { icon: MessageSquare, title: "Team Messages", desc: "Direct communication", color: "from-foreground/90 to-foreground/60" },
                      { icon: BarChart3, title: "SEO & Marketing", desc: "Analytics & campaigns", color: "from-foreground/90 to-foreground/60" },
                    ].map((item, index) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-xl liquid-glass-subtle"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0`}>
                          <item.icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                      Secure • Scalable • Built for growth
                    </p>
                  </div>
                </div>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* Minimal divider */}
      <div className="relative h-12 sm:h-16 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-24 sm:w-40 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--border) / 0.3), transparent)' }} />
        </div>
      </div>

      {/* Free Previews Section */}
      <section id="section-free-previews" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--foreground) / 0.03), transparent 70%)' }} />
        <FloatingOrb className="w-60 h-60 bg-gradient-to-br from-foreground/5 to-foreground/10 blur-3xl bottom-0 left-10" delay={1.5} />

        <div className="container-tight relative z-10">
          <div className="max-w-4xl mx-auto text-center px-4">
            <ScrollSection direction="up">
              <span className="eyebrow">
                <EditableField sectionKey="home_free_previews" field="eyebrow" value={hFreePreviews.eyebrow} label="Eyebrow">{hFreePreviews.eyebrow}</EditableField>
              </span>
              <h2 className="heading-lg mb-4 sm:mb-6">
                <EditableField sectionKey="home_free_previews" field="titlePrefix" value={hFreePreviews.titlePrefix} label="Title">{hFreePreviews.titlePrefix}</EditableField>{" "}
                <span className="text-gradient"><EditableField sectionKey="home_free_previews" field="titleHighlight" value={hFreePreviews.titleHighlight} label="Title highlight">{hFreePreviews.titleHighlight}</EditableField></span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-8 sm:mb-12 leading-relaxed max-w-2xl mx-auto">
                <EditableField sectionKey="home_free_previews" field="subtitle" value={hFreePreviews.subtitle} label="Subtitle" kind="textarea">{hFreePreviews.subtitle}</EditableField>
              </p>
            </ScrollSection>

            <StaggeredScrollSection className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {freePreviewIncludes.map((item) => (
                <ScrollItem key={item.title}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="p-4 sm:p-6 rounded-2xl liquid-glass-card h-full relative overflow-hidden"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`} />
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">{item.title}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
                  </motion.div>
                </ScrollItem>
              ))}
            </StaggeredScrollSection>

            <ScrollSection direction="up" delay={0.2}>
              <div className="p-4 sm:p-6 md:p-8 rounded-2xl liquid-glass-subtle max-w-2xl mx-auto mb-6 sm:mb-8">
                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Project Payment Structure</h3>
                <div className="space-y-2 sm:space-y-3 text-left">
                  {[
                    { num: "1", text: "Optional paid preview expansion:", desc: "Pay a non-refundable fee per additional page to protect developer time", color: "from-foreground/90 to-foreground/60" },
                    { num: "2", text: "Deposit required:", desc: "Secure your project slot with a deposit", color: "from-foreground/90 to-foreground/60" },
                    { num: "3", text: "Staged payments:", desc: "Remaining balance paid after each key milestone", color: "from-foreground/90 to-foreground/60" },
                  ].map((step) => (
                    <div key={step.num} className="flex items-start gap-2 sm:gap-3">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <span className="text-[10px] sm:text-xs font-bold text-white">{step.num}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        <strong className="text-foreground">{step.text}</strong> {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="premium" size="xl" asChild className="w-full sm:w-auto">
                <Link to="/get-started">
                  Request a Free Preview <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* Minimal divider */}
      <div className="relative h-12 sm:h-16 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-8 sm:w-16 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--border) / 0.4))' }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(var(--primary) / 0.3)' }} />
            <div className="w-8 sm:w-16 h-px" style={{ background: 'linear-gradient(90deg, hsl(var(--border) / 0.4), transparent)' }} />
          </div>
        </div>
      </div>

      {/* Apps & Dashboards Section */}
      <section id="section-apps" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 100%, hsl(var(--foreground) / 0.03), transparent 70%)' }} />
        <FloatingOrb className="w-72 h-72 bg-gradient-to-br from-foreground/5 to-foreground/10 blur-3xl -top-20 right-20" delay={0.5} />

        <div className="container-tight relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <ScrollSection direction="left" className="order-2 lg:order-1">
              <ParallaxImage
                src={heroWorkspace}
                alt="Custom application development"
                className="rounded-2xl sm:rounded-3xl h-[280px] sm:h-[350px] md:h-[450px] shadow-2xl"
                enableHover3D={false}
                parallaxSpeed={0.15}
                overlayGradient="bg-gradient-to-t from-background/90 via-background/20 to-transparent"
              >
                <div className="flex flex-col justify-end h-full p-4 sm:p-6 md:p-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                  >
                    <p className="text-xs sm:text-sm font-medium text-primary mb-1">Modern development tooling</p>
                    <p className="text-base sm:text-lg md:text-xl font-display font-semibold">Experienced system design</p>
                  </motion.div>
                </div>
              </ParallaxImage>
            </ScrollSection>

            <ScrollSection direction="right" className="order-1 lg:order-2">
              <span className="eyebrow">
                <EditableField sectionKey="home_apps" field="eyebrow" value={hApps.eyebrow} label="Eyebrow">{hApps.eyebrow}</EditableField>
              </span>
              <h2 className="heading-lg mb-4 sm:mb-6">
                <EditableField sectionKey="home_apps" field="titlePrefix" value={hApps.titlePrefix} label="Title">{hApps.titlePrefix}</EditableField>{" "}
                <span className="text-gradient"><EditableField sectionKey="home_apps" field="titleHighlight" value={hApps.titleHighlight} label="Title highlight">{hApps.titleHighlight}</EditableField></span>
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-6 sm:mb-8 leading-relaxed">
                <EditableField sectionKey="home_apps" field="subtitle" value={hApps.subtitle} label="Subtitle" kind="textarea">{hApps.subtitle}</EditableField>
              </p>

              <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                {appExamples.map((example, index) => {
                  const colors = ["from-foreground/5 to-foreground/10", "from-foreground/5 to-foreground/10", "from-foreground/5 to-foreground/10", "from-foreground/5 to-foreground/10", "from-foreground/5 to-foreground/10", "from-foreground/5 to-foreground/10", "from-foreground/5 to-foreground/10"];
                  return (
                    <motion.span
                      key={example}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.05 }}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r ${colors[index % colors.length]} border border-border/30 text-xs sm:text-sm`}
                    >
                      {example}
                    </motion.span>
                  );
                })}
              </div>

              <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 italic">
                From simple applications to systems that take months or years to develop — we build with scalability in mind.
              </p>

              <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
                <Link to="/apps-dashboards">
                  Explore App Development <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* Our Process Section */}
      <ProcessSection />

      {/* Why Quooro — Differentiator Section */}
      <WhyQuooroSection />

      {/* Code to Design Visual with Parallax */}
      <section className="py-0 relative">
        <ParallaxImage
          src={codeTransform}
          alt="Code transforming into beautiful systems"
          className="h-[50vh] sm:h-[60vh] min-h-[350px] sm:min-h-[500px] bg-background"
          imgClassName="object-contain object-right sm:object-cover"
          enableHover3D={false}
          parallaxSpeed={0.25}
          overlayGradient="bg-gradient-to-r from-background via-background/60 to-transparent"
        >
          <div className="flex items-center h-full">
            <div className="container-tight">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-lg px-4"
              >
                <motion.p 
                  className="text-primary font-medium mb-1 sm:mb-2 text-sm sm:text-base"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  Infrastructure that scales
                </motion.p>
                <motion.h2 
                  className="heading-lg mb-3 sm:mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  Built for <span className="text-gradient">Growth</span>
                </motion.h2>
                <motion.p 
                  className="body-md text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  Every system we build is crafted to deliver exceptional performance and user experiences, 
                  designed to grow with your business.
                </motion.p>
              </motion.div>
            </div>
          </div>
        </ParallaxImage>
      </section>

      {/* Services Grid */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--foreground) / 0.025), transparent 70%)' }} />
        <FloatingOrb className="w-64 h-64 bg-gradient-to-br from-foreground/5 to-foreground/10 blur-3xl top-10 -left-20" delay={1} />
        <FloatingOrb className="w-48 h-48 bg-gradient-to-br from-foreground/5 to-foreground/10 blur-3xl bottom-10 right-10" delay={2.5} />

        <div className="container-tight relative z-10">
          <ScrollSection direction="up" className="text-center mb-8 sm:mb-12 md:mb-16">
            <span className="eyebrow">
              <EditableField sectionKey="home_services" field="eyebrow" value={hServices.eyebrow} label="Eyebrow">{hServices.eyebrow}</EditableField>
            </span>
            <h2 className="heading-lg mb-3 sm:mb-4">
              <EditableField sectionKey="home_services" field="titlePrefix" value={hServices.titlePrefix} label="Title">{hServices.titlePrefix}</EditableField>{" "}
              <span className="text-gradient"><EditableField sectionKey="home_services" field="titleHighlight" value={hServices.titleHighlight} label="Title highlight">{hServices.titleHighlight}</EditableField></span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              <EditableField sectionKey="home_services" field="subtitle" value={hServices.subtitle} label="Subtitle" kind="textarea">{hServices.subtitle}</EditableField>
            </p>
          </ScrollSection>

          <StaggeredScrollSection className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8" staggerDelay={0.1}>
            {services.map((service, idx) => (
              <ScrollItem key={service.title}>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group p-4 sm:p-6 md:p-8 rounded-2xl liquid-glass-card h-full relative overflow-hidden"
                >
                  {/* Top gradient bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${service.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                  {/* Hover glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none`} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                        <service.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-base sm:text-lg md:text-xl">{service.title}</h3>
                      </div>
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{service.description}</p>
                  </div>
                </motion.div>
              </ScrollItem>
            ))}
          </StaggeredScrollSection>

          <ScrollSection direction="up" delay={0.3} className="text-center mt-8 sm:mt-12">
            <Button variant="outline" size="lg" asChild className="w-full sm:w-auto">
              <Link to="/features">
                View All Services <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </ScrollSection>
        </div>
      </section>

      {/* Built for Businesses That Want More */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--foreground) / 0.03), transparent 70%)' }} />
        <FloatingOrb className="w-56 h-56 bg-gradient-to-br from-foreground/5 to-foreground/10 blur-3xl top-20 right-20" delay={0} />

        <div className="container-tight relative z-10">
          <ScrollSection direction="up" className="text-center max-w-3xl mx-auto px-4">
            <h2 className="heading-lg mb-4 sm:mb-6">
              <EditableField sectionKey="home_built_for" field="titlePrefix" value={hBuiltFor.titlePrefix} label="Title">{hBuiltFor.titlePrefix}</EditableField>{" "}
              <span className="text-gradient"><EditableField sectionKey="home_built_for" field="titleHighlight" value={hBuiltFor.titleHighlight} label="Title highlight">{hBuiltFor.titleHighlight}</EditableField></span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground mb-8 sm:mb-12 leading-relaxed">
              <EditableField sectionKey="home_built_for" field="subtitle" value={hBuiltFor.subtitle} label="Subtitle" kind="textarea">{hBuiltFor.subtitle}</EditableField>
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-8 sm:mb-12">
              {[
                { text: "Secure", color: "from-foreground/5 to-foreground/10 border-border/40", icon: Shield },
                { text: "Scalable", color: "from-foreground/5 to-foreground/10 border-border/40", icon: TrendingUp },
                { text: "Managed", color: "from-foreground/5 to-foreground/10 border-border/40", icon: Settings },
                { text: "Built to grow", color: "from-foreground/5 to-foreground/10 border-border/40", icon: Rocket },
              ].map((item, index) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r ${item.color} border group hover:scale-105 transition-transform duration-300`}
                >
                  <item.icon className="w-3.5 h-3.5 text-primary/70 group-hover:text-primary transition-colors" />
                  <span className="font-medium text-sm sm:text-base">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <TestimonialCarousel />

      {/* CTA Section */}
      <section id="section-cta" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 100%, hsl(var(--foreground) / 0.03), transparent 70%)' }} />
        <FloatingOrb className="w-80 h-80 bg-gradient-to-br from-foreground/5 to-foreground/10 blur-3xl -bottom-20 left-1/4" delay={1} />

        <div className="container-tight relative z-10">
          <ScrollSection direction="scale">
            <div
              className="p-4 sm:p-8 md:p-12 lg:p-16 rounded-2xl sm:rounded-3xl relative overflow-hidden border border-white/10"
              style={{ background: 'linear-gradient(135deg, hsl(220 25% 8%) 0%, hsl(220 22% 12%) 50%, hsl(220 20% 16%) 100%)' }}
            >
              {/* Animated mesh overlay */}
              <div className="absolute inset-0 pointer-events-none rounded-2xl sm:rounded-3xl overflow-hidden">
                <div className="absolute inset-0" style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 50%),
                    radial-gradient(circle at 80% 70%, rgba(255,255,255,0.06) 0%, transparent 50%)
                  `,
                }} />
              </div>
              
              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 sm:mb-8"
                  style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <Sparkles className="w-3.5 h-3.5 text-white/80" />
                  <span className="text-xs sm:text-sm font-medium text-white/80">
                    <EditableField sectionKey="home_cta" field="eyebrow" value={hCta.eyebrow} label="Eyebrow">{hCta.eyebrow}</EditableField>
                  </span>
                </motion.div>

                <motion.h2 
                  className="heading-lg mb-4 sm:mb-6 text-white"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <EditableField sectionKey="home_cta" field="titlePrefix" value={hCta.titlePrefix} label="Title">{hCta.titlePrefix}</EditableField>{" "}
                  <span className="text-primary"><EditableField sectionKey="home_cta" field="titleHighlight" value={hCta.titleHighlight} label="Title highlight">{hCta.titleHighlight}</EditableField></span>
                </motion.h2>
                <motion.p 
                  className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10 leading-relaxed"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <EditableField sectionKey="home_cta" field="subtitle" value={hCta.subtitle} label="Subtitle" kind="textarea">{hCta.subtitle}</EditableField>
                </motion.p>
                <motion.div 
                  className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <Button size="xl" asChild className="w-full sm:w-auto bg-white text-primary hover:bg-white/90 font-semibold shadow-lg group">
                    <Link to="/get-started">
                      Request a Free Preview <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  <Button size="xl" asChild className="w-full sm:w-auto bg-white/15 text-white border border-white/30 hover:bg-white/25 font-semibold backdrop-blur-sm">
                    <Link to="/portfolio">View Our Work</Link>
                  </Button>
                </motion.div>

                {/* Bottom trust row */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                  className="mt-8 sm:mt-10 flex flex-wrap gap-4 sm:gap-6 justify-center"
                >
                  {["No commitment", "Full ownership", "UK-based team"].map((text) => (
                    <div key={text} className="flex items-center gap-1.5 text-white/60 text-xs sm:text-sm">
                      <Check className="w-3.5 h-3.5" />
                      <span>{text}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>
    </Layout>
  );
}
