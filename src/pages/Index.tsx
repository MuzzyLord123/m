import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Check,
  Database,
  FileText,
  Globe,
  Layers,
  MessageSquare,
  Monitor,
  Palette,
  Settings,
  Smartphone,
  TrendingUp,
  Users,
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ProcessSection } from "@/components/marketing/ProcessSection";
import { WhyQuooroSection } from "@/components/marketing/WhyQuooroSection";
import { HomeHero } from "@/components/marketing/HomeHero";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { IndexList } from "@/components/marketing/IndexList";
import { EditableField } from "@/components/marketing/EditableField";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Marquee } from "@/components/motion/Marquee";
import { StickySequence, type SequenceStep } from "@/components/motion/StickySequence";
import { SplitText } from "@/components/motion/SplitText";
import { WordReveal, Drift } from "@/components/motion/Scrub";
import { OrbitDivider } from "@/components/marketing/OrbitalMotif";
import { DeferredGlobe3D } from "@/components/DeferredGlobe3D";
import { useHomepageHeader } from "@/hooks/useHomepageHeader";

/**
 * The homepage.
 *
 * The previous version ran the same block six times: centred eyebrow, centred
 * heading with one accent word, centred paragraph, then a grid of rounded glass
 * cards. Recolouring that leaves a recoloured template. This version varies the
 * structure section to section — an index of rows, a pinned scroll sequence, a
 * full-bleed statement, a bordered matrix, a ladder — so the page has a shape
 * you could recognise from across a room with the text blurred out.
 *
 * Data access is untouched: same `useHomepageHeader` keys, same `EditableField`
 * section/field pairs, same routes.
 */

const practice = [
  {
    icon: Monitor,
    title: "Websites",
    description:
      "Marketing sites built to load fast, rank, and convert — not to win awards for loading spinners.",
  },
  {
    icon: Layers,
    title: "Apps & Dashboards",
    description:
      "Custom applications, internal tools and dashboards shaped around how the business actually runs.",
  },
  {
    icon: Database,
    title: "Digital Operations Platform",
    description:
      "A private client dashboard where the work, the files, the data and the conversation all live.",
  },
  {
    icon: FileText,
    title: "Quooro Office",
    description:
      "A productivity suite with 25+ tools built in — docs, sheets, invoices, tasks, and the rest.",
    href: "/quooro-office",
  },
  {
    icon: Settings,
    title: "Ongoing Management",
    description:
      "We don't disappear at launch. The system is maintained, monitored and moved forward.",
  },
];

/** Capability ticker. What we do — never who has bought it. */
const capabilities = [
  "Websites",
  "Web applications",
  "Client dashboards",
  "Internal tools",
  "E-commerce",
  "SEO",
  "Paid media",
  "Hosting & maintenance",
  "Brand systems",
  "Integrations",
];

const platformSteps: SequenceStep[] = [
  {
    id: "sites",
    label: "Websites",
    meta: "Live status",
    title: "Every site, with its status attached",
    body: "Preview links, deploy state and change history in one list, so nobody has to ask where a build got to.",
  },
  {
    id: "projects",
    label: "Projects",
    meta: "Milestones",
    title: "Projects that show their working",
    body: "Milestones, owners and dates, updated as the work moves rather than written up afterwards.",
  },
  {
    id: "assets",
    label: "Assets",
    meta: "Storage",
    title: "One place the files actually stay",
    body: "Logos, copy, photography and contracts, versioned and permissioned instead of scattered across inboxes.",
  },
  {
    id: "messages",
    label: "Messages",
    meta: "Direct",
    title: "Talk to the people building it",
    body: "Threaded conversation attached to the project it belongs to. No ticket queue, no account manager relay.",
  },
  {
    id: "insight",
    label: "Insight",
    meta: "Analytics",
    title: "Search and campaign numbers in the same room",
    body: "Rankings, traffic and ad performance next to the work that moved them, so the connection is visible.",
  },
];

const preview = [
  {
    title: "Homepage design",
    body: "A full homepage concept built to your brand, not a template with your logo dropped in.",
  },
  {
    title: "Up to two further pages",
    body: "Enough structure to judge how the whole site will behave, not just how the front door looks.",
  },
  {
    title: "Responsive across devices",
    body: "Checked at phone, tablet and desktop widths before you see it.",
  },
];

const terms = [
  {
    label: "Extra preview pages",
    body: "A non-refundable fee per additional page, which protects developer time on work that may not proceed.",
  },
  { label: "Deposit", body: "Secures the project slot and the start date." },
  {
    label: "Staged payments",
    body: "The balance is split across milestones, paid as each one is signed off.",
  },
];

const services = [
  { icon: Globe, title: "Web Development", description: "Landing pages through to enterprise platforms." },
  { icon: MessageSquare, title: "Social Media", description: "Day-to-day management across the major networks." },
  { icon: BarChart3, title: "Ad Management", description: "PPC, paid social, and conversion work." },
  { icon: Palette, title: "Content Creation", description: "Photography, video and copywriting." },
  { icon: TrendingUp, title: "SEO & Strategy", description: "Keyword research, competitor analysis, growth planning." },
  { icon: Users, title: "Account Management", description: "Oversight of the whole digital presence." },
];

const appExamples = [
  "Client portals",
  "Internal dashboards",
  "Inventory systems",
  "Databases",
  "Workflow tools",
  "Management systems",
  "MVPs and complex platforms",
];

const reach = [
  {
    icon: Smartphone,
    title: "Local",
    body: "Work that has to earn its place in a specific town. Local search, local proof, and a site that loads on a phone with two bars of signal.",
  },
  {
    icon: TrendingUp,
    title: "Nationwide",
    body: "Multi-location businesses, multi-branch content, and structures that stay tidy as the estate grows rather than being rebuilt at every stage.",
  },
  {
    icon: Globe,
    title: "Beyond the UK",
    body: "The platform is not geographically limited — multilingual content, multi-currency billing and international hosting are supported when a project calls for them.",
  },
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
      <HomeHero />

      {/* ── Capability ticker ────────────────────────────────────────────
          A rhythm break between the hero and the first section. Full bleed,
          hairlines top and bottom, running slowly. */}
      <div className="border-y border-border/60 bg-background py-5 sm:py-7">
        <Marquee items={capabilities} speed={54} />
      </div>

      {/* ── 01 The practice ──────────────────────────────────────────────
          Was a centred header over a rounded panel of five rounded rows.
          Now a split header over a hover index. */}
      <section id="section-what-we-do" className="section-padding relative">
        <div className="container-tight">
          <OrbitDivider className="mb-10 h-auto w-full sm:mb-14" />
          <SectionHeading
            className="mb-14 sm:mb-20"
            eyebrow={
              <EditableField sectionKey="home_what_we_do" field="eyebrow" value={hWhatWeDo.eyebrow} label="Eyebrow">
                {hWhatWeDo.eyebrow}
              </EditableField>
            }
            title={
              <span className="block">
                <EditableField sectionKey="home_what_we_do" field="titlePrefix" value={hWhatWeDo.titlePrefix} label="Title">
                  {hWhatWeDo.titlePrefix}
                </EditableField>{" "}
                <span className="text-gradient">
                  <EditableField sectionKey="home_what_we_do" field="titleHighlight" value={hWhatWeDo.titleHighlight} label="Title highlight">
                    {hWhatWeDo.titleHighlight}
                  </EditableField>
                </span>
              </span>
            }
            body={
              <EditableField sectionKey="home_what_we_do" field="subtitle" value={hWhatWeDo.subtitle} label="Subtitle" kind="textarea">
                {hWhatWeDo.subtitle}
              </EditableField>
            }
          />

          <IndexList entries={practice} />
        </div>
      </section>

      {/* ── 02 The platform ──────────────────────────────────────────────
          The page's one pinned moment. Was a split with a mocked-up dashboard
          card; the mock did the work of a screenshot without being one. */}
      <section id="section-dashboard" className="section-padding relative border-t border-border/60">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 45% 40% at 20% 30%, hsl(var(--primary) / 0.06), transparent 70%)" }}
        />
        <div className="container-tight relative z-10">
          <StickySequence
            steps={platformSteps}
            eyebrow={
              <EditableField sectionKey="home_dashboard" field="eyebrow" value={hDashboard.eyebrow} label="Eyebrow">
                {hDashboard.eyebrow}
              </EditableField>
            }
            heading={
              <>
                <EditableField sectionKey="home_dashboard" field="titlePrefix" value={hDashboard.titlePrefix} label="Title">
                  {hDashboard.titlePrefix}
                </EditableField>{" "}
                <span className="text-gradient">
                  <EditableField sectionKey="home_dashboard" field="titleHighlight" value={hDashboard.titleHighlight} label="Title highlight">
                    {hDashboard.titleHighlight}
                  </EditableField>
                </span>
              </>
            }
            intro={
              <EditableField sectionKey="home_dashboard" field="subtitle" value={hDashboard.subtitle} label="Subtitle" kind="textarea">
                {hDashboard.subtitle}
              </EditableField>
            }
          />

          <Reveal className="mt-14 flex justify-start">
            <Magnetic>
              <Button variant="outline" size="lg" asChild>
                <Link to="/client-portal">
                  See how the dashboard works <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      {/* ── 03 Reach ─────────────────────────────────────────────────────
          The globe that used to anchor this section is now the hero, so the
          section carries itself in type. */}
      <section id="section-global-reach" className="relative overflow-hidden border-y border-border/60 bg-background">
        <div className="section-padding container-tight">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal className="relative lg:col-span-5">
              <span className="eyebrow relative">
                <EditableField sectionKey="home_global_reach" field="eyebrow" value={hGlobal.eyebrow} label="Eyebrow">
                  {hGlobal.eyebrow}
                </EditableField>
              </span>
              <h2 className="display-lg mb-6">
                <EditableField sectionKey="home_global_reach" field="titlePrefix" value={hGlobal.titlePrefix} label="Title">
                  {hGlobal.titlePrefix}
                </EditableField>
                <span className="block text-primary">
                  <EditableField sectionKey="home_global_reach" field="titleHighlight" value={hGlobal.titleHighlight} label="Title highlight">
                    {hGlobal.titleHighlight}
                  </EditableField>
                </span>
              </h2>
              <p className="body-md max-w-md">
                <EditableField sectionKey="home_global_reach" field="subtitle" value={hGlobal.subtitle} label="Subtitle" kind="textarea">
                  {hGlobal.subtitle}
                </EditableField>
              </p>
              <p className="mono-label mt-8">Studio: Wales, UK · Remote by default</p>

              {/* The globe, home again — moved out of the hero and back to the
                  section that is actually about place. At this size it earns
                  its keep, and because it sits below the fold, DeferredGlobe3D
                  means phones never fetch three.js unless the visitor scrolls
                  here. Drift gives the wrapper a slow parallax against the
                  copy; the component internals stay untouched. */}
              <Drift travel={24} className="mx-auto mt-10 w-full max-w-[300px] sm:max-w-[360px] lg:mx-0">
                <div className="relative aspect-square">
                  <div
                    className="pointer-events-none absolute inset-[8%] rounded-full blur-3xl"
                    style={{ background: "hsl(var(--primary) / 0.15)" }}
                  />
                  <DeferredGlobe3D />
                </div>
                <p className="mono-label mt-4 text-center lg:text-left">
                  52.13° N, 3.78° W · drag to spin
                </p>
              </Drift>
            </Reveal>

            <RevealGroup className="lg:col-span-7">
              {reach.map((item) => (
                <RevealItem
                  key={item.title}
                  className="group grid grid-cols-[auto_1fr] items-start gap-5 border-t border-border/60 py-7 last:border-b sm:gap-7 sm:py-8"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-border transition-colors duration-500 group-hover:border-primary/50">
                    <item.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  </span>
                  <span>
                    <span className="block font-display text-xl font-semibold tracking-tight sm:text-2xl">
                      {item.title}
                    </span>
                    <span className="mt-2 block max-w-xl text-sm font-light leading-relaxed text-muted-foreground sm:text-[15px]">
                      {item.body}
                    </span>
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── 04 Free preview ──────────────────────────────────────────────
          Was three centred glass cards plus a rounded terms box. Now a
          two-column ladder: what you get on the left, what it costs on the
          right, hairline-separated. */}
      <section id="section-free-previews" className="section-padding relative">
        <div className="container-tight">
          <SectionHeading
            className="mb-14 sm:mb-20"
            eyebrow={
              <EditableField sectionKey="home_free_previews" field="eyebrow" value={hFreePreviews.eyebrow} label="Eyebrow">
                {hFreePreviews.eyebrow}
              </EditableField>
            }
            title={
              <span className="block">
                <EditableField sectionKey="home_free_previews" field="titlePrefix" value={hFreePreviews.titlePrefix} label="Title">
                  {hFreePreviews.titlePrefix}
                </EditableField>{" "}
                <span className="text-gradient">
                  <EditableField sectionKey="home_free_previews" field="titleHighlight" value={hFreePreviews.titleHighlight} label="Title highlight">
                    {hFreePreviews.titleHighlight}
                  </EditableField>
                </span>
              </span>
            }
            body={
              <EditableField sectionKey="home_free_previews" field="subtitle" value={hFreePreviews.subtitle} label="Subtitle" kind="textarea">
                {hFreePreviews.subtitle}
              </EditableField>
            }
          />

          <div className="grid gap-x-16 gap-y-14 lg:grid-cols-2">
            <RevealGroup>
              <p className="mono-label mb-6">Included, at no cost</p>
              {preview.map((item, i) => (
                <RevealItem
                  key={item.title}
                  className="grid grid-cols-[auto_1fr] gap-5 border-t border-border/60 py-6 last:border-b"
                >
                  <span className="font-mono text-[11px] tabular-nums text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block font-display text-lg font-semibold tracking-tight sm:text-xl">
                      {item.title}
                    </span>
                    <span className="mt-1.5 block text-sm font-light leading-relaxed text-muted-foreground">
                      {item.body}
                    </span>
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>

            <RevealGroup>
              <p className="mono-label mb-6">If it goes ahead</p>
              {terms.map((item) => (
                <RevealItem key={item.label} className="border-t border-border/60 py-6 last:border-b">
                  <span className="block font-display text-lg font-semibold tracking-tight sm:text-xl">
                    {item.label}
                  </span>
                  <span className="mt-1.5 block text-sm font-light leading-relaxed text-muted-foreground">
                    {item.body}
                  </span>
                </RevealItem>
              ))}

              <Reveal className="mt-10">
                <Magnetic className="inline-block">
                  <Button variant="premium" size="xl" asChild className="group w-full sm:w-auto">
                    <Link to="/get-started">
                      Request a free preview
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </Magnetic>
              </Reveal>
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* ── 05 Apps ──────────────────────────────────────────────────────
          Was a stock iMac render beside a wall of pills. Now the examples are
          the visual: a bordered matrix with no card chrome at all. */}
      <section id="section-apps" className="section-padding relative border-t border-border/60">
        <div className="container-tight">
          <SectionHeading
            className="mb-14 sm:mb-20"
            eyebrow={
              <EditableField sectionKey="home_apps" field="eyebrow" value={hApps.eyebrow} label="Eyebrow">
                {hApps.eyebrow}
              </EditableField>
            }
            title={
              <span className="block">
                <EditableField sectionKey="home_apps" field="titlePrefix" value={hApps.titlePrefix} label="Title">
                  {hApps.titlePrefix}
                </EditableField>{" "}
                <span className="text-gradient">
                  <EditableField sectionKey="home_apps" field="titleHighlight" value={hApps.titleHighlight} label="Title highlight">
                    {hApps.titleHighlight}
                  </EditableField>
                </span>
              </span>
            }
            body={
              <EditableField sectionKey="home_apps" field="subtitle" value={hApps.subtitle} label="Subtitle" kind="textarea">
                {hApps.subtitle}
              </EditableField>
            }
            action={
              <Magnetic className="inline-block">
                <Button variant="outline" size="lg" asChild>
                  <Link to="/apps-dashboards">
                    Explore app development <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Magnetic>
            }
          />

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 sm:grid-cols-2 lg:grid-cols-4">
            {appExamples.map((example, i) => (
              <RevealItem
                key={example}
                className="group relative border-b border-r border-border/60 px-6 py-10 transition-colors duration-500 hover:bg-foreground/[0.02]"
              >
                <span className="mono-label block text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-3 block font-display text-lg font-medium tracking-tight sm:text-xl">
                  {example}
                </span>
              </RevealItem>
            ))}
            <RevealItem className="border-b border-r border-border/60 px-6 py-10">
              <span className="block text-sm font-light italic leading-relaxed text-muted-foreground">
                From single-purpose tools to systems that take months to build — the
                structure is planned for the second year, not just the launch.
              </span>
            </RevealItem>
          </RevealGroup>
        </div>
      </section>

      <ProcessSection />

      <WhyQuooroSection />

      {/* ── Statement ────────────────────────────────────────────────────
          The one oversized line on the page. */}
      <section className="relative overflow-hidden border-y border-border/60 py-24 sm:py-28 lg:py-36">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse 55% 70% at 12% 50%, hsl(var(--primary) / 0.09), transparent 70%)" }}
        />
        <div className="container-tight relative z-10">
          <p className="mono-label mb-8">Infrastructure that scales</p>
          {/* Scrub 2 of 2: each word's opacity rides the scroll, so the
              sentence arrives at reading pace. */}
          <WordReveal
            className="display-xl max-w-5xl"
            text="Built to hold up under load, and to keep making sense as the business changes shape around it."
          />
        </div>
      </section>

      {/* ── 06 Services ──────────────────────────────────────────────────
          Was six rounded glass cards in a 3×2 grid with white-on-gradient
          icons. Now a bordered matrix sharing hairlines — same information,
          none of the card chrome. */}
      <section className="section-padding relative">
        <div className="container-tight">
          <SectionHeading
            className="mb-14 sm:mb-20"
            eyebrow={
              <EditableField sectionKey="home_services" field="eyebrow" value={hServices.eyebrow} label="Eyebrow">
                {hServices.eyebrow}
              </EditableField>
            }
            title={
              <span className="block">
                <EditableField sectionKey="home_services" field="titlePrefix" value={hServices.titlePrefix} label="Title">
                  {hServices.titlePrefix}
                </EditableField>{" "}
                <span className="text-gradient">
                  <EditableField sectionKey="home_services" field="titleHighlight" value={hServices.titleHighlight} label="Title highlight">
                    {hServices.titleHighlight}
                  </EditableField>
                </span>
              </span>
            }
            body={
              <EditableField sectionKey="home_services" field="subtitle" value={hServices.subtitle} label="Subtitle" kind="textarea">
                {hServices.subtitle}
              </EditableField>
            }
            action={
              <Magnetic className="inline-block">
                <Button variant="outline" size="lg" asChild>
                  <Link to="/features">
                    View all services <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </Magnetic>
            }
          />

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <RevealItem
                key={service.title}
                className="group relative overflow-hidden border-b border-r border-border/60 p-8 transition-colors duration-500 hover:bg-foreground/[0.02] sm:p-10"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 motion-reduce:transition-none"
                />
                <div className="mb-8 flex items-center justify-between">
                  <service.icon className="h-6 w-6 text-primary" strokeWidth={1.4} />
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                  {service.description}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ── Positioning ──────────────────────────────────────────────────*/}
      <section className="section-padding relative border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-7">
              <h2 className="heading-lg">
                <EditableField sectionKey="home_built_for" field="titlePrefix" value={hBuiltFor.titlePrefix} label="Title">
                  {hBuiltFor.titlePrefix}
                </EditableField>{" "}
                <span className="text-gradient">
                  <EditableField sectionKey="home_built_for" field="titleHighlight" value={hBuiltFor.titleHighlight} label="Title highlight">
                    {hBuiltFor.titleHighlight}
                  </EditableField>
                </span>
              </h2>
            </Reveal>
            <Reveal from="right" className="lg:col-span-5 lg:pt-2">
              <p className="body-md">
                <EditableField sectionKey="home_built_for" field="subtitle" value={hBuiltFor.subtitle} label="Subtitle" kind="textarea">
                  {hBuiltFor.subtitle}
                </EditableField>
              </p>
              <RevealGroup className="mt-8 grid grid-cols-2 gap-x-8 gap-y-4">
                {["Secure", "Scalable", "Managed", "Built to grow"].map((text) => (
                  <RevealItem key={text} className="flex items-center gap-3 border-b border-border/60 pb-4">
                    <span className="h-1 w-1 rounded-full bg-primary" />
                    <span className="text-sm font-medium">{text}</span>
                  </RevealItem>
                ))}
              </RevealGroup>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Close ────────────────────────────────────────────────────────*/}
      <section id="section-cta" className="relative overflow-hidden bg-primary text-primary-foreground">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.09]"
          style={{
            backgroundImage: `
              linear-gradient(hsl(var(--primary-foreground) / 0.5) 1px, transparent 1px),
              linear-gradient(90deg, hsl(var(--primary-foreground) / 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 60% 90% at 100% 0%, black, transparent 72%)",
            WebkitMaskImage: "radial-gradient(ellipse 60% 90% at 100% 0%, black, transparent 72%)",
          }}
        />

        <div className="container-tight relative z-10 py-24 sm:py-28 lg:py-36">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">
              <Reveal>
                <div className="mb-7 flex items-center gap-3">
                  <span className="h-px w-8 bg-primary-foreground/50" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-primary-foreground sm:text-[11px]">
                    <EditableField sectionKey="home_cta" field="eyebrow" value={hCta.eyebrow} label="Eyebrow">
                      {hCta.eyebrow}
                    </EditableField>
                  </span>
                </div>
              </Reveal>

              <h2 className="display-xl">
                <EditableField sectionKey="home_cta" field="titlePrefix" value={hCta.titlePrefix} label="Title">
                  {hCta.titlePrefix}
                </EditableField>{" "}
                <span className="text-primary-foreground/75">
                  <EditableField sectionKey="home_cta" field="titleHighlight" value={hCta.titleHighlight} label="Title highlight">
                    {hCta.titleHighlight}
                  </EditableField>
                </span>
              </h2>
            </div>

            <Reveal from="right" className="flex flex-col justify-end lg:col-span-5">
              <p className="max-w-md text-base font-light leading-relaxed text-primary-foreground/85 sm:text-lg">
                <EditableField sectionKey="home_cta" field="subtitle" value={hCta.subtitle} label="Subtitle" kind="textarea">
                  {hCta.subtitle}
                </EditableField>
              </p>

              <div className="mt-9 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
                <Magnetic className="inline-block">
                  <Button
                    size="xl"
                    asChild
                    className="group w-full bg-primary-foreground font-semibold text-primary shadow-lg hover:bg-primary-foreground/90 sm:w-auto"
                  >
                    <Link to="/get-started">
                      Request a free preview
                      <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </Magnetic>
                <Link
                  to="/features"
                  className="group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap py-2 text-sm font-medium text-primary-foreground transition-colors hover:text-primary-foreground"
                >
                  <span className="link-underline">See what&rsquo;s included</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </div>

              <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-primary-foreground/25 pt-7">
                {["No commitment", "Full ownership", "UK-based team"].map((text) => (
                  <li
                    key={text}
                    className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-primary-foreground"
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={2.2} />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>
    </Layout>
  );
}
