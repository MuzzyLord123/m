import { Link } from "react-router-dom";
import { Camera, Video, Palette, PenTool, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import {
  ServiceStrip,
  ServiceRail,
  ServicePlans,
  CapabilityCell,
  SeriesHeading,
  type ServicePlan,
} from "@/components/marketing/ServiceSeries";
import { LadderRow } from "@/components/marketing/Matrix";
import { Reveal, RevealGroup } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";

/** Service 03 — content production: capability matrix, plans, process ladder. */

const services = [
  {
    icon: Camera,
    title: "Professional Photography",
    description: "High-quality product, lifestyle, and brand photography that captures your essence.",
    features: ["Product photography", "Lifestyle shoots", "Team headshots", "Event coverage", "Post-processing included"],
  },
  {
    icon: Video,
    title: "Video Production",
    description: "Engaging video content from concept to final edit, optimized for all platforms.",
    features: ["Brand videos", "Product demos", "Testimonials", "Social media clips", "Animation & motion graphics"],
  },
  {
    icon: Palette,
    title: "Graphic Design",
    description: "Stunning visuals that communicate your brand message effectively.",
    features: ["Social media graphics", "Infographics", "Presentations", "Print materials", "Digital ads"],
  },
  {
    icon: PenTool,
    title: "Copywriting",
    description: "Compelling copy that converts visitors into customers.",
    features: ["Website copy", "Blog posts", "Email campaigns", "Ad copy", "Brand messaging"],
  },
  {
    icon: BookOpen,
    title: "Brand Storytelling",
    description: "Craft your unique brand narrative that resonates with your audience.",
    features: ["Brand story development", "Mission & vision", "Voice & tone guidelines", "Content strategy", "Brand book creation"],
  },
  {
    icon: Sparkles,
    title: "Social Content",
    description: "Platform-optimized content designed to engage and grow your following.",
    features: ["Content calendars", "Platform-specific content", "Trending formats", "Hashtag strategy", "Engagement optimization"],
  },
];

const plans: ServicePlan[] = [
  {
    name: "Content Starter",
    price: "Tailored",
    features: [
      "8 social media graphics",
      "2 blog posts",
      "Basic photography (1 session)",
      "Copy editing",
      "Monthly content calendar",
    ],
  },
  {
    name: "Content Growth",
    price: "Tailored",
    popular: true,
    features: [
      "20 social media graphics",
      "4 blog posts",
      "Video content (2 per month)",
      "Photography (2 sessions)",
      "Full copywriting",
      "Weekly content calendar",
    ],
  },
  {
    name: "Content Pro",
    price: "Tailored",
    features: [
      "Unlimited graphics",
      "8 blog posts",
      "Video production (4 per month)",
      "Unlimited photography",
      "Brand storytelling",
      "Dedicated creative team",
    ],
  },
];

const process = [
  { title: "Discovery", description: "Understand your brand, goals, and target audience" },
  { title: "Strategy", description: "Develop content strategy aligned with objectives" },
  { title: "Creation", description: "Produce high-quality content across formats" },
  { title: "Review", description: "Refine based on your feedback" },
  { title: "Deliver", description: "Optimized content ready for publishing" },
];

export default function ContentCreation() {
  return (
    <Layout>
      <PageHero
        eyebrow="The practice"
        index="03"
        crumbs={[{ label: "Home", href: "/" }, { label: "Services" }, { label: "Content creation" }]}
        title="Content built"
        highlight="to publish"
        body="Photography, video and copywriting produced for your brand — assets you own and reuse everywhere."
        actions={
          <>
            <Magnetic className="inline-block w-full sm:w-auto">
              <Button variant="premium" size="xl" asChild className="group w-full sm:w-auto">
                <Link to="/get-started">
                  Get started
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
            <Link to="/packages" className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground sm:justify-start">
              <span className="link-underline">View packages</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </>
        }
        aside={
          <PageHeroFacts
            facts={[
              { value: "06", label: "Formats" },
              { value: "03", label: "Monthly plans" },
              { value: "Yours", label: "Every asset" },
            ]}
          />
        }
      />

      <ServiceStrip current="03" />

      {/* Capabilities */}
      <section className="section-padding">
        <div className="container-tight">
          <SeriesHeading
            eyebrow="The formats"
            title="Everything a brand"
            accent="publishes."
            standfirst="Six formats, one voice — produced for your brand and owned outright."
          />
          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <CapabilityCell key={service.title} index={i} {...service} />
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Plans */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <SeriesHeading
            eyebrow="The plans"
            title="Monthly content"
            accent="packages."
            standfirst="A steady drumbeat of content, scaled to how much your brand needs to say."
          />
          <ServicePlans plans={plans} cta="Get a quote" />
        </div>
      </section>

      {/* Process */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Five stages</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                From brief
                <span className="block text-primary">to published.</span>
              </h2>
            </Reveal>
            <RevealGroup className="lg:col-span-8">
              {process.map((item, i) => (
                <LadderRow key={item.title} index={i} title={item.title}>
                  {item.description}
                </LadderRow>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Ready to tell
                <span className="block text-primary">your story?</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Content that sounds like you, looks like you, and belongs to you.
              </p>
            </div>
            <Magnetic className="inline-block">
              <Button variant="premium" size="xl" asChild className="group">
                <Link to="/get-started">
                  Start creating
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>

      <ServiceRail current="03" />
    </Layout>
  );
}
