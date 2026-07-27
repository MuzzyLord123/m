import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Star, TrendingUp, Users, ArrowUpRight, Quote, ArrowRight } from "lucide-react";
import { ParallaxBackground } from "@/components/ParallaxImage";
import heroWorkspace from "@/assets/hero-workspace.jpg";

const stories = [
  {
    client: "TechStart Solutions",
    industry: "Tech Consultancy",
    tier: "Enterprise",
    image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&h=400&fit=crop",
    quote: "Quooro transformed our online presence completely. The design is clean, professional, and exactly what we needed to stand out.",
    author: "James C.",
    role: "Director",
    results: [
      { metric: "Design Quality", value: "Excellent" },
      { metric: "Client Feedback", value: "Very Positive" },
      { metric: "Page Load", value: "Under 2s" },
    ],
  },
  {
    client: "Bloom & Grow Florists",
    industry: "E-commerce",
    tier: "Professional",
    image: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=400&fit=crop",
    quote: "From a basic website to a full e-commerce platform — the transformation was incredible. Our customers love shopping with us online now.",
    author: "Sarah M.",
    role: "Owner",
    results: [
      { metric: "Customer Experience", value: "Improved" },
      { metric: "Easy to Manage", value: "Yes" },
      { metric: "Mobile Friendly", value: "100%" },
    ],
  },
  {
    client: "Urban Fitness Studio",
    industry: "Health & Fitness",
    tier: "Growth",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop",
    quote: "The booking system they integrated is seamless. Our members love the user experience, and it's made our admin so much easier.",
    author: "Mike T.",
    role: "Founder",
    results: [
      { metric: "Booking System", value: "Works Great" },
      { metric: "Member Feedback", value: "Positive" },
      { metric: "Time Saved", value: "Hours/week" },
    ],
  },
  {
    client: "Hartley Legal",
    industry: "Legal Services",
    tier: "Professional",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop",
    quote: "Professional, modern, and exactly what we needed. The site positions us perfectly in the market and clients find us easily.",
    author: "Amanda H.",
    role: "Managing Partner",
    results: [
      { metric: "Professional Look", value: "Achieved" },
      { metric: "Easy Navigation", value: "Yes" },
      { metric: "Client Trust", value: "Increased" },
    ],
  },
  {
    client: "Artisan Coffee Co.",
    industry: "Hospitality",
    tier: "Starter",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop",
    quote: "Started with a simple site and it delivered beyond expectations. Perfect for getting our brand online quickly and professionally.",
    author: "Tom R.",
    role: "Owner",
    results: [
      { metric: "Brand Presence", value: "Established" },
      { metric: "Local Visibility", value: "Improved" },
      { metric: "Delivery Time", value: "5 days" },
    ],
  },
  {
    client: "NextGen Accounting",
    industry: "Financial Services",
    tier: "Enterprise",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop",
    quote: "The custom client portal has made our processes so much smoother. Secure, efficient, and our clients appreciate the transparency.",
    author: "David P.",
    role: "Director",
    results: [
      { metric: "Client Satisfaction", value: "High" },
      { metric: "Secure Portal", value: "Yes" },
      { metric: "Easy to Use", value: "Very" },
    ],
  },
];

const testimonials = [
  {
    quote: "Best investment we've made in years. The ROI was visible within the first month.",
    author: "Rebecca Stone",
    company: "Stone Properties",
    rating: 5,
  },
  {
    quote: "They didn't just build a website, they built us a business asset.",
    author: "Marcus Lee",
    company: "Lee Innovations",
    rating: 5,
  },
  {
    quote: "Responsive, professional, and truly understood our vision from day one.",
    author: "Emily Carter",
    company: "Carter Design Studio",
    rating: 5,
  },
];

export default function SuccessStories() {
  return (
    <Layout>
      {/* Hero with Parallax Premium Image */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <ParallaxBackground
          src={heroWorkspace}
          alt="Premium workspace"
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
              <Star className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Success Stories</span>
            </motion.div>
            <motion.h1 
              className="text-4xl md:text-6xl font-display font-bold mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Real Results, <span className="text-gradient">Real Businesses</span>
            </motion.h1>
            <motion.p 
              className="text-xl text-muted-foreground mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              See how we've helped businesses across industries achieve their digital goals.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="py-12 relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] via-primary/[0.05] to-primary/[0.02]" />
        <div className="container-tight relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Projects Completed", color: "from-blue-500 to-indigo-500" },
              { value: "98%", label: "Client Satisfaction", color: "from-purple-500 to-pink-500" },
              { value: "250%", label: "Avg. Traffic Growth", color: "from-teal-500 to-emerald-500" },
              { value: "4.9/5", label: "Average Rating", color: "from-amber-500 to-orange-500" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label} 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className={`text-3xl font-display font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Studies */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Featured Case Studies
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Detailed success stories from clients across all our service tiers.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8">
            {stories.map((story, index) => (
              <motion.div
                key={story.client}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card overflow-hidden group hover:shadow-premium hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={story.image}
                    alt={story.client}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                  <div className="absolute bottom-4 left-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                      {story.tier}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium glass">
                      {story.industry}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-display font-semibold mb-3">{story.client}</h3>
                  <blockquote className="text-muted-foreground mb-4 italic">
                    "{story.quote}"
                  </blockquote>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{story.author}</div>
                      <div className="text-sm text-muted-foreground">{story.role}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                    {story.results.map((result) => (
                      <div key={result.metric} className="text-center">
                        <div className="text-lg font-display font-bold text-primary">{result.value}</div>
                        <div className="text-xs text-muted-foreground">{result.metric}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Testimonials */}
      <section className="py-20 bg-card/50">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold mb-4">What Clients Say</h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <p className="text-muted-foreground mb-4">"{testimonial.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.company}</div>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-12 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Be Our Next Success Story?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Join hundreds of businesses that have transformed their digital presence with Quooro.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="premium" size="lg" asChild>
                <Link to="/get-started">Start Your Project <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/portfolio">View Portfolio</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
