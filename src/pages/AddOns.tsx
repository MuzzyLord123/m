import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Palette, PenTool, Camera, Video, Headphones, Shield, 
  Rocket, RefreshCw, Globe, Mail, CheckCircle, Plus 
} from "lucide-react";
import { ParallaxImage, ParallaxBackground } from "@/components/ParallaxImage";
import aiNeural from "@/assets/ai-neural.webp";
import brandingStudio from "@/assets/branding-studio.webp";

const addOns = [
  {
    category: "Branding & Design",
    items: [
      {
        icon: Palette,
        name: "Logo Design",
        description: "Professional logo with 3 concepts and unlimited revisions",
        includes: ["3 initial concepts", "Unlimited revisions", "All file formats", "Brand guidelines"],
      },
      {
        icon: Palette,
        name: "Brand Identity Package",
        description: "Complete brand identity including logo, colors, typography",
        includes: ["Logo design", "Color palette", "Typography selection", "Brand style guide", "Social media templates"],
      },
    ],
  },
  {
    category: "Content Creation",
    items: [
      {
        icon: PenTool,
        name: "Copywriting",
        description: "Professional website copy that converts",
        includes: ["SEO-optimized copy", "Compelling headlines", "CTAs", "2 revisions included"],
      },
      {
        icon: Camera,
        name: "Photography",
        description: "Professional photography for your brand",
        includes: ["Product shots", "Team photos", "Lifestyle imagery", "Edited high-res files"],
      },
      {
        icon: Video,
        name: "Video Production",
        description: "Professional video content for your site",
        includes: ["Script development", "Professional filming", "Editing & color grading", "Music licensing"],
      },
    ],
  },
  {
    category: "Technical Add-Ons",
    items: [
      {
        icon: Globe,
        name: "Multi-language Support",
        description: "Translate your site to reach global audiences",
        includes: ["Professional translation", "SEO for each language", "Language switcher", "RTL support if needed"],
      },
      {
        icon: Mail,
        name: "Email Setup",
        description: "Professional email configuration for your domain",
        includes: ["Mailbox setup", "SPF/DKIM records", "Email signatures", "Migration assistance"],
      },
      {
        icon: Shield,
        name: "Enhanced Security",
        description: "Additional security measures for your site",
        includes: ["Firewall setup", "Malware scanning", "DDoS protection", "Security monitoring"],
      },
    ],
  },
  {
    category: "Ongoing Services",
    items: [
      {
        icon: Headphones,
        name: "Priority Support",
        description: "Dedicated support with guaranteed response times",
        includes: ["4-hour response time", "Phone support", "Monthly check-ins", "Priority bug fixes"],
      },
      {
        icon: RefreshCw,
        name: "Maintenance Package",
        description: "Keep your site updated and running smoothly",
        includes: ["Security updates", "Plugin updates", "Monthly backups", "Performance monitoring"],
      },
      {
        icon: Rocket,
        name: "Growth Retainer",
        description: "Ongoing development hours for new features",
        includes: ["10 dev hours/month", "Feature requests", "Rollover unused hours", "Priority scheduling"],
      },
    ],
  },
];

const bundles = [
  {
    name: "Launch Bundle",
    savings: "Bundle & Save",
    includes: ["Logo Design", "Copywriting (2 pages)", "Email Setup"],
  },
  {
    name: "Brand Bundle",
    savings: "Most Popular Bundle",
    popular: true,
    includes: ["Brand Identity Package", "Copywriting (3 pages)", "Photography (1 day)"],
  },
  {
    name: "Complete Bundle",
    savings: "Best Value Bundle",
    includes: ["Brand Identity Package", "Copywriting (5 pages)", "Photography (1 day)", "Video (1 min)", "Priority Support (3 months)"],
  },
];

export default function AddOns() {
  return (
    <Layout>
      {/* Hero with AI Visual and Parallax */}
      <PageHero
        eyebrow="Packages"
        index="29"
        crumbs={[{ label: "Home", href: "/" }, { label: "Add-ons" }]}
        title="Add-ons &"
        highlight="extras"
        body="Extra pages, features and services that bolt onto any package when the project calls for them."
      />

      {/* Branding Visual Section with 3D Hover */}
      <section className="py-0">
        <ParallaxImage
          src={brandingStudio}
          alt="Premium branding studio"
          className="h-[50vh] min-h-[400px]"
          enableHover3D={true}
          parallaxSpeed={0.2}
          overlayGradient="bg-gradient-to-r from-background via-background/70 to-transparent"
        >
          <div className="flex items-center h-full">
            <div className="container-tight">
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-lg"
              >
                <motion.p 
                  className="text-primary font-medium mb-2"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  Premium branding
                </motion.p>
                <motion.h2 
                  className="text-3xl md:text-4xl font-display font-bold mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  Elevate Your <span className="text-gradient">Brand Identity</span>
                </motion.h2>
                <motion.p 
                  className="text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  From logo design to complete brand packages, we create visual identities 
                  that resonate with your audience and stand out from the competition.
                </motion.p>
              </motion.div>
            </div>
          </div>
        </ParallaxImage>
      </section>

      {/* Bundles */}
      <section className="py-16 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.2)', borderBottom: '1px solid hsl(var(--border) / 0.2)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-primary/[0.04] to-primary/[0.02]" />
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-display font-bold mb-4">
              Bundle & Save
            </h2>
            <p className="text-muted-foreground">
              Popular combinations at discounted prices.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-0 border-l border-t border-border/60">
            {bundles.map((bundle, index) => (
              <motion.div
                key={bundle.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`border-b border-r border-border/60 p-6 relative ${bundle.popular ? 'border-primary' : ''}`}
              >
                {bundle.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary rounded-full text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <h3 className="text-lg font-display font-semibold mb-2">{bundle.name}</h3>
                <div className="text-xl font-display font-bold mb-1">Custom Pricing</div>
                <div className="text-primary text-sm font-medium mb-4">{bundle.savings}</div>
                <ul className="space-y-2 mb-6">
                  {bundle.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant={bundle.popular ? "hero" : "outline"} className="w-full" asChild>
                  <Link to="/get-started">Add to Project</Link>
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* All Add-Ons */}
      <section className="py-20">
        <div className="container-tight">
          {addOns.map((category, catIndex) => (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: catIndex * 0.1 }}
              className="mb-16 last:mb-0"
            >
              <h2 className="text-2xl font-display font-bold mb-8 text-primary">
                {category.category}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-border/60">
                {category.items.map((item) => (
                  <div key={item.name} className="border-b border-r border-border/60 p-6 group hover:border-primary/50 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <item.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-display font-medium text-primary">Custom Pricing</div>
                      </div>
                    </div>
                    <h3 className="text-lg font-display font-semibold mb-2">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    <ul className="space-y-1">
                      {item.includes.map((inc) => (
                        <li key={inc} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="w-3 h-3 text-primary" />
                          {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
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
              Need Something Custom?
            </h2>
            <p className="text-muted-foreground max-w-2xl mb-8">
              Don't see what you need? Let's discuss your specific requirements.
            </p>
            <Button variant="premium" size="lg" asChild>
              <Link to="/get-started">Contact Us</Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
