import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Star, Quote, TrendingUp, Eye, Cake, Scale, ShoppingBag, Rocket, Dumbbell, Camera } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const clientStories = [
  {
    name: "Sarah M.",
    business: "Artisan Bakery",
    icon: Cake,
    tier: "Starter → Professional",
    previewType: "Free Preview",
    journey: "Started with a free Starter preview for a simple 2-page site. Loved the quality so much, upgraded to Professional for the full package.",
    quote: "The free preview was my 'aha' moment. Seeing my bakery brought to life professionally — with no commitment — made the decision easy.",
    result: "Completely satisfied with the design",
    rating: 5
  },
  {
    name: "James T.",
    business: "Legal Consulting",
    icon: Scale,
    tier: "Growth",
    previewType: "Free Preview",
    journey: "Needed a professional 5-page site for his law practice. The free preview demonstrated exactly what he'd receive.",
    quote: "As a lawyer, I appreciate transparency. The preview process showed me exactly what I was paying for — no surprises, no hidden costs.",
    result: "Professional look we wanted",
    rating: 5
  },
  {
    name: "Emily C.",
    business: "Fashion Boutique",
    icon: ShoppingBag,
    tier: "Professional",
    previewType: "Fast-Track Preview",
    journey: "Required a full e-commerce site quickly for seasonal launch. Paid for Fast-Track preview and was impressed by the speed.",
    quote: "The preview fee was credited to my final purchase. I essentially got to test-drive my entire store before committing.",
    result: "Beautiful online store",
    rating: 5
  },
  {
    name: "Marcus W.",
    business: "Tech Consultancy",
    icon: Rocket,
    tier: "Enterprise",
    previewType: "Fast-Track Preview",
    journey: "Needed a professional multi-page platform. The Fast-Track preview demonstrated all key functionality.",
    quote: "Seeing our requirements brought to life in just 7 days convinced our team. The preview process was worth every penny.",
    result: "Exactly what we envisioned",
    rating: 5
  },
  {
    name: "Rebecca F.",
    business: "Fitness Studio",
    icon: Dumbbell,
    tier: "Starter",
    previewType: "Free Preview",
    journey: "Solo fitness instructor needing a simple booking page. Free preview delivered exactly what was promised.",
    quote: "I was skeptical of 'free' — but they delivered a beautiful preview in one week. Now I have a professional site I'm proud of.",
    result: "Modern and clean design",
    rating: 5
  },
  {
    name: "David P.",
    business: "Photography Studio",
    icon: Camera,
    tier: "Growth → Enterprise",
    previewType: "Free Preview",
    journey: "Started with Growth preview for portfolio site. Loved it so much, upgraded for more features.",
    quote: "The free preview process built complete trust. When we needed to scale, there was no question who we'd work with.",
    result: "Stunning portfolio showcase",
    rating: 5
  }
];

const stats = [
  { value: "94%", label: "Convert to Purchase" },
  { value: "67%", label: "Upgrade Tier" },
  { value: "100%", label: "Would Recommend" },
  { value: "4.9/5", label: "Average Rating" }
];

export default function PreviewStories() {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding pt-32">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill mb-6">
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Client Stories</span>
            </div>
            <h1 className="heading-xl mb-6">
              Preview <span className="text-gradient">Success Stories</span>
            </h1>
            <p className="body-lg">
              Real businesses who experienced our preview process. From free previews to Fast-Track, 
              see how our transparent approach builds lasting partnerships.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-primary/[0.05] to-primary/[0.02]" />
        <div className="container-tight relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="text-3xl md:text-4xl font-display font-bold text-gradient mb-2 transition-transform duration-300 group-hover:scale-110">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Client Stories */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="grid md:grid-cols-2 gap-8">
            {clientStories.map((story, index) => (
              <motion.div
                key={story.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl border border-border bg-card"
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <story.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-lg">{story.name}</h3>
                    <p className="text-sm text-muted-foreground">{story.business}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    story.previewType === "Free Preview"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-primary/20 text-primary"
                  }`}>
                    {story.previewType}
                  </span>
                </div>

                {/* Journey Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">{story.tier}</span>
                </div>

                {/* Journey Description */}
                <p className="text-sm text-muted-foreground mb-4">{story.journey}</p>

                {/* Quote */}
                <div className="relative p-4 rounded-xl bg-muted/30 mb-4">
                  <Quote className="absolute top-2 left-2 w-4 h-4 text-primary/30" />
                  <p className="text-sm italic pl-4">{story.quote}</p>
                </div>

                {/* Result */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary">{story.result}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(story.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upgrade Journey */}
      <section className="section-padding bg-card">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="heading-md mb-4">
              The <span className="text-gradient">Upgrade Journey</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto">
              67% of our preview clients upgrade to a higher tier after seeing the quality we deliver.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Start with Free Preview",
                description: "Get a Starter or Growth tier preview completely free. See our quality with zero risk."
              },
              {
                step: "2",
                title: "Love What You See",
                description: "Experience the professional quality and attention to detail we bring to every project."
              },
              {
                step: "3",
                title: "Scale With Confidence",
                description: "Upgrade to a higher tier knowing exactly what level of quality to expect."
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-tight text-center">
          <h2 className="heading-md mb-6">
            Write Your <span className="text-gradient">Success Story</span>
          </h2>
          <p className="body-lg max-w-2xl mx-auto mb-8">
            Join hundreds of businesses who started with a preview and never looked back.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="premium" size="xl" asChild>
              <Link to="/get-started">
                Get Your Free Preview <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/preview-portfolio">View Preview Portfolio</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
