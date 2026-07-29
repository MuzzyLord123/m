import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, Video, Palette, PenTool, BookOpen, Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import { ParallaxBackground } from "@/components/ParallaxImage";
import brandingStudio from "@/assets/branding-studio.webp";

const services = [
  {
    icon: Camera,
    title: "Professional Photography",
    description: "High-quality product, lifestyle, and brand photography that captures your essence.",
    price: "Pricing tailored to your project",
    features: ["Product photography", "Lifestyle shoots", "Team headshots", "Event coverage", "Post-processing included"],
  },
  {
    icon: Video,
    title: "Video Production",
    description: "Engaging video content from concept to final edit, optimized for all platforms.",
    price: "Pricing tailored to your project",
    features: ["Brand videos", "Product demos", "Testimonials", "Social media clips", "Animation & motion graphics"],
  },
  {
    icon: Palette,
    title: "Graphic Design",
    description: "Stunning visuals that communicate your brand message effectively.",
    price: "Pricing tailored to your project",
    features: ["Social media graphics", "Infographics", "Presentations", "Print materials", "Digital ads"],
  },
  {
    icon: PenTool,
    title: "Copywriting",
    description: "Compelling copy that converts visitors into customers.",
    price: "Pricing tailored to your project",
    features: ["Website copy", "Blog posts", "Email campaigns", "Ad copy", "Brand messaging"],
  },
  {
    icon: BookOpen,
    title: "Brand Storytelling",
    description: "Craft your unique brand narrative that resonates with your audience.",
    price: "Pricing tailored to your project",
    features: ["Brand story development", "Mission & vision", "Voice & tone guidelines", "Content strategy", "Brand book creation"],
  },
  {
    icon: Sparkles,
    title: "Social Content",
    description: "Platform-optimized content designed to engage and grow your following.",
    price: "Pricing tailored to your project",
    features: ["Content calendars", "Platform-specific content", "Trending formats", "Hashtag strategy", "Engagement optimization"],
  },
];

const packages = [
  {
    name: "Content Starter",
    price: "Tailored",
    period: "",
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
    period: "",
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
    period: "",
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
  { step: "01", title: "Discovery", description: "Understand your brand, goals, and target audience" },
  { step: "02", title: "Strategy", description: "Develop content strategy aligned with objectives" },
  { step: "03", title: "Creation", description: "Produce high-quality content across formats" },
  { step: "04", title: "Review", description: "Refine based on your feedback" },
  { step: "05", title: "Deliver", description: "Optimized content ready for publishing" },
];

export default function ContentCreation() {
  return (
    <Layout>
      {/* Hero with Parallax Premium Image */}
      <PageHero
        eyebrow="Marketing"
        index="12"
        crumbs={[{ label: "Home", href: "/" }, { label: "Content creation" }]}
        title="Content built"
        highlight="to publish"
        body="Photography, video and copywriting produced for your brand — assets you own and reuse everywhere."
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

      {/* Services Grid */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Full-Service Content Creation
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Everything you need to tell your brand story across every channel.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-border/60">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="border-b border-r border-border/60 p-8 group hover:border-primary/50 transition-all"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <service.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-semibold mb-2">{service.title}</h3>
                <p className="text-primary font-semibold mb-3">{service.price}</p>
                <p className="text-muted-foreground mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-card/50">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Our Creative Process
            </h2>
          </motion.div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            {process.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex-1 relative"
              >
                <div className="text-center">
                  <div className="text-5xl font-display font-bold text-primary/20 mb-2">{item.step}</div>
                  <h3 className="text-lg font-display font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {index < process.length - 1 && (
                  <div className="hidden md:block absolute top-6 right-0 translate-x-1/2">
                    <ArrowRight className="w-6 h-6 text-primary/30" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Monthly Content Packages
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Consistent, high-quality content delivered monthly.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-0 border-l border-t border-border/60">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`border-b border-r border-border/60 p-8 relative ${pkg.popular ? 'border-primary' : ''}`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-xs font-semibold text-primary-foreground">
                    Best Value
                  </div>
                )}
                <h3 className="text-xl font-display font-semibold mb-2">{pkg.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-display font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{pkg.price}</span>
                  <span className="text-muted-foreground">{pkg.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button variant={pkg.popular ? "hero" : "glass"} className="w-full" asChild>
                  <Link to="/get-started">Get Started</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-card/50">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="border border-border/60 bg-background p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Let's Create Something Amazing
            </h2>
            <p className="text-muted-foreground max-w-2xl mb-8">
              Ready to elevate your brand with professional content? Let's discuss your vision.
            </p>
            <Button variant="premium" size="lg" asChild>
              <Link to="/get-started">Start Your Project <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
