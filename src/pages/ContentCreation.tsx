import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Camera, Video, Palette, PenTool, BookOpen, Sparkles, CheckCircle, ArrowRight } from "lucide-react";
import { ParallaxBackground } from "@/components/ParallaxImage";
import brandingStudio from "@/assets/branding-studio.jpg";

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
      <section className="pt-32 pb-20 relative overflow-hidden">
        <ParallaxBackground
          src={brandingStudio}
          alt="Premium creative studio"
          parallaxSpeed={0.2}
          overlayClassName="bg-gradient-to-b from-background via-background/85 to-background"
        />
        <div className="container-tight relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Content Creation</span>
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-6xl font-display font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Creative <span className="text-gradient">Content</span> That Captivates
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              Professional photography, video production, graphic design, copywriting, and brand storytelling to elevate your brand.
            </motion.p>
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button variant="premium" size="lg" asChild>
                <Link to="/get-started">Start Creating <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/portfolio">View Portfolio</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Full-Service Content Creation
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to tell your brand story across every channel.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-8 group hover:border-primary/50 transition-all"
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
            className="text-center mb-16"
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
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Monthly Content Packages
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Consistent, high-quality content delivered monthly.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {packages.map((pkg, index) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card p-8 relative ${pkg.popular ? 'border-primary' : ''}`}
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
            className="glass-card p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Let's Create Something Amazing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
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
