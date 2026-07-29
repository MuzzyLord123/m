import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ExternalLink, Palette, Code, Figma, Pen, Star, Mail, ArrowUpRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const projects = [
  { title: "Bloom Skincare", category: "Branding", color: "hsl(340 40% 92%)" },
  { title: "UrbanEats App", category: "UI/UX Design", color: "hsl(30 40% 91%)" },
  { title: "Volta Energy", category: "Web Design", color: "hsl(150 30% 91%)" },
  { title: "NoteSpace", category: "Product Design", color: "hsl(250 30% 93%)" },
  { title: "Craft & Co", category: "Branding", color: "hsl(40 40% 92%)" },
  { title: "FitTrack Pro", category: "Mobile App", color: "hsl(200 30% 92%)" },
];

const skills = [
  "UI/UX Design", "Brand Identity", "Web Design", "Figma", "Framer", "Prototyping",
  "Design Systems", "Illustration", "Motion Design", "Webflow",
];

const testimonials = [
  { name: "Alex Turner", company: "Bloom Skincare", text: "Maya brought our brand to life. Every detail was considered." },
  { name: "Jordan Lee", company: "UrbanEats", text: "Incredibly talented and a joy to work with. Highly recommended!" },
  { name: "Sam Rivera", company: "Volta Energy", text: "The website exceeded all expectations. Professional and creative." },
];

export default function FreelancerPortfolio() {
  return (
    <Layout>
      <div className="bg-muted/50 border-b border-border/50 py-2 px-4 text-sm">
        <span className="text-muted-foreground">This is a Quooro showcase project — </span>
        <Link to="/portfolio" className="text-primary hover:underline font-medium">Back to Portfolio</Link>
        <Badge variant="secondary" className="ml-2 text-xs">Starter</Badge>
      </div>

      {/* Hero */}
      <section className="bg-background">
        <div className="container-tight py-24 md:py-32">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <p className="text-sm font-medium text-muted-foreground mb-4">Maya Chen — Product & Brand Designer</p>
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 text-foreground">
              Design That<br />Speaks
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-md">
              I help startups and small businesses craft beautiful, functional digital experiences.
            </p>
            <div className="flex gap-4">
              <Button size="lg" variant="hero" className="rounded-full">View My Work</Button>
              <Button size="lg" variant="outline" className="rounded-full">Say Hello</Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Projects */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold mb-12 text-foreground">Selected Work</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="group cursor-pointer">
                <div className="aspect-[4/3] rounded-2xl mb-4 relative overflow-hidden" style={{ background: p.color }}>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                    <ArrowUpRight className="w-8 h-8 text-foreground" />
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.category}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-20 px-4 bg-background">
        <div className="container-tight grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl font-bold mb-6 text-foreground">About Me</h2>
            <p className="text-muted-foreground mb-4">
              I'm Maya, a freelance product designer based in London with 6+ years of experience creating brands and digital products for startups.
            </p>
            <p className="text-muted-foreground mb-6">
              My approach blends clean aesthetics with user-centered thinking. I believe great design should feel effortless.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="font-display font-bold text-2xl text-foreground">6+</span> Years Experience
              <span className="font-display font-bold text-2xl text-foreground">40+</span> Projects Delivered
            </div>
          </div>
          <div className="w-full aspect-square rounded-3xl" style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.2))" }}>
            <div className="w-full h-full flex items-center justify-center">
              <Palette className="w-16 h-16 text-primary/40" />
            </div>
          </div>
        </div>
      </section>

      {/* Skills */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container-tight">
          <h2 className="font-display text-2xl font-bold mb-8 text-foreground">Skills & Tools</h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((s, i) => (
              <motion.span key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                className="px-4 py-2 rounded-full text-sm font-medium border border-border bg-background text-foreground">
                {s}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-background">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold mb-12 text-foreground">Kind Words</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-6 border border-border bg-muted/20">
                <p className="text-sm mb-4 italic text-muted-foreground">"{t.text}"</p>
                <p className="font-display font-bold text-sm text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.company}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container-tight text-center max-w-md mx-auto">
          <Mail className="w-8 h-8 mx-auto mb-4 text-primary" />
          <h2 className="font-display text-3xl font-bold mb-3 text-foreground">Let's Work Together</h2>
          <p className="text-muted-foreground mb-6">Have a project in mind? I'd love to hear about it.</p>
          <Button size="lg" variant="hero" className="rounded-full">Get in Touch</Button>
        </div>
      </section>

      {/* Built by Quooro */}
      <section className="py-16 px-4 border-t border-border/50 bg-background">
        <div className="container-tight text-center">
          <p className="text-sm font-medium text-primary mb-2">Built by Quooro</p>
          <p className="font-display text-2xl font-bold mb-2 text-foreground">+300% Inquiries</p>
          <p className="text-muted-foreground mb-6">Real results from a Starter package website.</p>
          <Button variant="hero" size="lg" asChild><Link to="/get-started">Start Your Project</Link></Button>
        </div>
      </section>
    </Layout>
  );
}
