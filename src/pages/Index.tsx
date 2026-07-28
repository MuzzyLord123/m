import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Database,
  FileText,
  Globe,
  Layers,
  Lock,
  MessageSquare,
  Monitor,
  Palette,
  Rocket,
  Settings,
  Shield,
  Smartphone,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ScrollSection, StaggeredScrollSection, ScrollItem } from "@/components/ScrollSection";
import { ProcessSection } from "@/components/marketing/ProcessSection";
import { WhyQuooroSection } from "@/components/marketing/WhyQuooroSection";
import { ParallaxImage } from "@/components/ParallaxImage";
import { HomeHero } from "@/components/marketing/HomeHero";
import { EditableField } from "@/components/marketing/EditableField";
import { useHomepageHeader } from "@/hooks/useHomepageHeader";

import heroWorkspace from "@/assets/hero-workspace.jpg";

// What We Do - 5 Pillars with color accents
const whatWeDo = [
  {
    icon: Monitor,
    title: "Websites",
    description: "High-performance marketing websites built for conversion and scale.",
    gradient: "from-foreground/5 to-foreground/10",
    iconBg: "from-primary/16 to-primary/[0.06]",
  },
  {
    icon: Layers,
    title: "Apps & Dashboards",
    description: "Custom-built applications, internal tools, and dashboards tailored to how your business operates.",
    gradient: "from-foreground/5 to-foreground/10",
    iconBg: "from-primary/16 to-primary/[0.06]",
  },
  {
    icon: Database,
    title: "Digital Operations Platform",
    description: "A secure client dashboard where your business, data, assets, and communication live.",
    gradient: "from-foreground/5 to-foreground/10",
    iconBg: "from-primary/16 to-primary/[0.06]",
  },
  {
    icon: FileText,
    title: "Quooro Office",
    description: "An enterprise productivity suite with 25+ tools — Docs, Sheets, Invoices, Tasks, and more.",
    href: "/quooro-office",
    gradient: "from-foreground/5 to-foreground/10",
    iconBg: "from-primary/16 to-primary/[0.06]",
  },
  {
    icon: Settings,
    title: "Ongoing Management",
    description: "We don't disappear after launch — we manage, support, and evolve your systems.",
    gradient: "from-foreground/5 to-foreground/10",
    iconBg: "from-primary/16 to-primary/[0.06]",
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
  { title: "Homepage Design", description: "Full homepage concept tailored to your brand", color: "from-primary/16 to-primary/[0.06]" },
  { title: "Up to 2 Additional Pages", description: "Key pages to demonstrate site structure", color: "from-primary/16 to-primary/[0.06]" },
  { title: "Mobile-Responsive Preview", description: "See how it looks on all devices", color: "from-primary/16 to-primary/[0.06]" }
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
    color: "from-primary/16 to-primary/[0.06]",
  },
  {
    icon: MessageSquare,
    title: "Social Media",
    description: "Complete platform management across all major networks",
    color: "from-primary/16 to-primary/[0.06]",
  },
  {
    icon: BarChart3,
    title: "Ad Management",
    description: "PPC campaigns, social ads, and conversion optimisation",
    color: "from-primary/16 to-primary/[0.06]",
  },
  {
    icon: Palette,
    title: "Content Creation",
    description: "Professional photography, video, and copywriting",
    color: "from-primary/16 to-primary/[0.06]",
  },
  {
    icon: TrendingUp,
    title: "SEO & Strategy",
    description: "Keyword research, competitor analysis, and growth tactics",
    color: "from-primary/16 to-primary/[0.06]",
  },
  {
    icon: Users,
    title: "Account Management",
    description: "Complete digital presence and reputation oversight",
    color: "from-primary/16 to-primary/[0.06]",
  }
];

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
      {/* Hero — type left, live globe right. The badges and stats that used to be
          duplicated here for mobile now live inside the hero at every width. */}
      <HomeHero />

      {/* What We Do — editorial index */}
      <section id="section-what-we-do" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 0%, hsl(var(--foreground) / 0.025), transparent 70%)' }} />

        <div className="container-tight relative z-10 max-w-5xl">
          <ScrollSection direction="up" className="text-center mb-12 sm:mb-16">
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
                    <span className="font-mono text-foreground/60 text-[11px] sm:text-xs tabular-nums tracking-[0.2em] order-1 sm:order-none">
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


      {/* How far we work — the globe that used to sit here is now the hero, so
          this section carries its weight in type instead of repeating the asset.
          The old "Worldwide" card claimed clients across the globe and 24/7
          support across time zones; neither is true of a Wales studio of this
          size, so the copy now describes reach rather than asserting a roster. */}
      <section id="section-global-reach" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 100%, hsl(var(--foreground) / 0.03), transparent 70%)' }} />

        <div className="container-tight relative z-10">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <ScrollSection direction="up" className="lg:col-span-5">
              <span className="eyebrow">
                <EditableField sectionKey="home_global_reach" field="eyebrow" value={hGlobal.eyebrow} label="Eyebrow">{hGlobal.eyebrow}</EditableField>
              </span>
              <h2 className="heading-lg mb-4">
                <EditableField sectionKey="home_global_reach" field="titlePrefix" value={hGlobal.titlePrefix} label="Title">{hGlobal.titlePrefix}</EditableField>{" "}
                <span className="text-gradient"><EditableField sectionKey="home_global_reach" field="titleHighlight" value={hGlobal.titleHighlight} label="Title highlight">{hGlobal.titleHighlight}</EditableField></span>
              </h2>
              <p className="body-md max-w-md">
                <EditableField sectionKey="home_global_reach" field="subtitle" value={hGlobal.subtitle} label="Subtitle" kind="textarea">{hGlobal.subtitle}</EditableField>
              </p>
              <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Studio: Wales, UK · Remote by default
              </p>
            </ScrollSection>

            <div className="lg:col-span-7">
              {[
                {
                  icon: Smartphone,
                  title: "Local",
                  desc: "Work that has to earn its place in a specific town. Local search, local proof, and a site that loads on a phone with two bars of signal.",
                },
                {
                  icon: TrendingUp,
                  title: "Nationwide",
                  desc: "Multi-location businesses, multi-branch content, and structures that stay tidy as the estate grows rather than being rebuilt at every stage.",
                },
                {
                  icon: Globe,
                  title: "Beyond the UK",
                  desc: "The platform is not geographically limited — multilingual content, multi-currency billing and international hosting are all supported when a project calls for them.",
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group grid grid-cols-[auto_1fr] items-start gap-5 border-t border-border/60 py-7 last:border-b sm:gap-7 sm:py-8"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border/70 transition-colors duration-500 group-hover:border-primary/40">
                    <item.icon className="h-5 w-5 text-primary" strokeWidth={1.6} />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{item.title}</h3>
                    <p className="mt-2 max-w-xl text-sm font-light leading-relaxed text-muted-foreground sm:text-[15px]">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Customer Dashboard Section */}
      <section id="section-dashboard" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--foreground) / 0.025), transparent 70%)' }} />

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
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/16 to-primary/[0.06] border border-primary/25 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" strokeWidth={2.4} />
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
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary/16 to-primary/[0.06] border border-primary/25 flex items-center justify-center">
                      <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-primary" strokeWidth={1.6} />
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
                      { icon: Monitor, title: "Website Management", desc: "Preview, status & updates", color: "from-primary/16 to-primary/[0.06]" },
                      { icon: Layers, title: "App Projects", desc: "Track milestones & progress", color: "from-primary/16 to-primary/[0.06]" },
                      { icon: Upload, title: "Asset Centre", desc: "Upload & manage files", color: "from-primary/16 to-primary/[0.06]" },
                      { icon: MessageSquare, title: "Team Messages", desc: "Direct communication", color: "from-primary/16 to-primary/[0.06]" },
                      { icon: BarChart3, title: "SEO & Marketing", desc: "Analytics & campaigns", color: "from-primary/16 to-primary/[0.06]" },
                    ].map((item, index) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        className="flex items-center gap-3 sm:gap-4 p-2 sm:p-3 rounded-xl liquid-glass-subtle"
                      >
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} border border-primary/25 flex items-center justify-center flex-shrink-0`}>
                          <item.icon className="w-4 h-4 text-primary" strokeWidth={1.7} />
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


      {/* Free Previews Section */}
      <section id="section-free-previews" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--foreground) / 0.03), transparent 70%)' }} />

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
                    <div className={`absolute top-0 left-0 right-0 h-px bg-primary/40`} />
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${item.color} border border-primary/25 flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
                      <Check className="w-5 h-5 sm:w-6 sm:h-6 text-primary" strokeWidth={2} />
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
                    { num: "1", text: "Optional paid preview expansion:", desc: "Pay a non-refundable fee per additional page to protect developer time", color: "from-primary/16 to-primary/[0.06]" },
                    { num: "2", text: "Deposit required:", desc: "Secure your project slot with a deposit", color: "from-primary/16 to-primary/[0.06]" },
                    { num: "3", text: "Staged payments:", desc: "Remaining balance paid after each key milestone", color: "from-primary/16 to-primary/[0.06]" },
                  ].map((step) => (
                    <div key={step.num} className="flex items-start gap-2 sm:gap-3">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br ${step.color} border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <span className="font-mono text-[10px] sm:text-xs font-semibold text-primary">{step.num}</span>
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


      {/* Apps & Dashboards Section */}
      <section id="section-apps" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 100%, hsl(var(--foreground) / 0.03), transparent 70%)' }} />

        <div className="container-tight relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
            <ScrollSection direction="left" className="order-2 lg:order-1">
              <ParallaxImage
                src={heroWorkspace}
                alt="Custom application development"
                className="rounded-2xl sm:rounded-3xl h-[280px] sm:h-[350px] md:h-[450px] shadow-2xl"
                imgClassName="[filter:saturate(0.5)_sepia(0.16)_contrast(1.04)_brightness(0.96)]"
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

      {/* A full-bleed stock render used to sit here — a violet-lit laptop showing
          an invented "Welcome / About Us" website, with the section heading laid
          over the busy half of the image so half the sentence was unreadable.
          Wrong palette, wrong claim, wrong legibility. The statement it was
          carrying is worth keeping, so it is now carried by type. */}
      <section className="relative overflow-hidden border-y border-border/60 py-20 sm:py-24 lg:py-28">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 50% 60% at 15% 50%, hsl(var(--primary) / 0.08), transparent 70%)' }}
        />
        <div className="container-tight relative z-10">
          <ScrollSection direction="up">
            <div className="grid gap-8 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-5">
                <div className="mb-6 flex items-center gap-3">
                  <span className="h-px w-8 bg-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px]">
                    Infrastructure that scales
                  </span>
                </div>
                <h2 className="heading-lg">
                  Built for <span className="text-gradient">Growth</span>
                </h2>
              </div>
              <div className="lg:col-span-7 lg:pt-2">
                <p className="max-w-xl text-lg font-light leading-relaxed text-foreground/80 sm:text-xl md:text-2xl">
                  Every system is built to hold up under load and to keep making sense
                  as the business changes shape around it.
                </p>
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Services Grid */}
      <section className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, hsl(var(--foreground) / 0.025), transparent 70%)' }} />

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
                  <div className={`absolute top-0 left-0 right-0 h-px bg-primary/30 group-hover:bg-primary/70 transition-colors`} />
                  {/* Hover glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500 pointer-events-none`} />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${service.color} border border-primary/25 flex items-center justify-center transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                        <service.icon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-primary" strokeWidth={1.5} />
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

      {/* The testimonial carousel that sat here quoted six named people at six
          named companies. None of them exist. Removed rather than restyled —
          see PLACEHOLDERS.md P2 for what real quotes would need. */}

      {/* CTA Section */}
      <section id="section-cta" className="section-padding relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 50% at 50% 100%, hsl(var(--foreground) / 0.03), transparent 70%)' }} />

        <div className="container-tight relative z-10">
          <ScrollSection direction="up">
            {/* One panel where the ember owns the whole surface. The old block
                was hardcoded navy (hsl(220 25% 8%)) with rgba white overlays, so
                it ignored the theme entirely and read as a different brand. This
                is drawn from --primary, so it flips with the mode. */}
            <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-14 text-primary-foreground sm:px-12 sm:py-20 lg:px-20">
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.09]"
                style={{
                  backgroundImage: `
                    linear-gradient(hsl(var(--primary-foreground) / 0.5) 1px, transparent 1px),
                    linear-gradient(90deg, hsl(var(--primary-foreground) / 0.5) 1px, transparent 1px)
                  `,
                  backgroundSize: '44px 44px',
                  maskImage: 'radial-gradient(ellipse 60% 90% at 100% 0%, black, transparent 72%)',
                  WebkitMaskImage: 'radial-gradient(ellipse 60% 90% at 100% 0%, black, transparent 72%)',
                }}
              />

              <div className="relative z-10 max-w-3xl">
                <div className="mb-7 flex items-center gap-3">
                  <span className="h-px w-8 bg-primary-foreground/50" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary-foreground sm:text-[11px]">
                    <EditableField sectionKey="home_cta" field="eyebrow" value={hCta.eyebrow} label="Eyebrow">{hCta.eyebrow}</EditableField>
                  </span>
                </div>

                <h2 className="heading-lg mb-5">
                  <EditableField sectionKey="home_cta" field="titlePrefix" value={hCta.titlePrefix} label="Title">{hCta.titlePrefix}</EditableField>{" "}
                  <span className="text-primary-foreground/70">
                    <EditableField sectionKey="home_cta" field="titleHighlight" value={hCta.titleHighlight} label="Title highlight">{hCta.titleHighlight}</EditableField>
                  </span>
                </h2>

                <p className="max-w-xl text-sm font-light leading-relaxed text-primary-foreground/80 sm:text-base md:text-lg">
                  <EditableField sectionKey="home_cta" field="subtitle" value={hCta.subtitle} label="Subtitle" kind="textarea">{hCta.subtitle}</EditableField>
                </p>

                <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                  <Button
                    size="xl"
                    asChild
                    className="group w-full bg-primary-foreground font-semibold text-primary shadow-lg hover:bg-primary-foreground/90 sm:w-auto"
                  >
                    <Link to="/get-started">
                      Request a Free Preview
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                  {/* Was "View Our Work" → /portfolio. The portfolio entries are
                      design studies, not client work (PLACEHOLDERS.md P1), so the
                      homepage no longer sends buyers there expecting a roster. */}
                  <Link
                    to="/features"
                    className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary-foreground/85 transition-colors hover:text-primary-foreground"
                  >
                    <span className="relative">
                      See what&rsquo;s included
                      <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-primary-foreground transition-transform duration-300 group-hover:scale-x-100" />
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>

                <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-primary-foreground/20 pt-7">
                  {["No commitment", "Full ownership", "UK-based team"].map((text) => (
                    <li key={text} className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-primary-foreground">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                      <span>{text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>
    </Layout>
  );
}
