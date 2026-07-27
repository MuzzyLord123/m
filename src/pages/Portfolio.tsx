import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ExternalLink, TrendingUp, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";

const projects = [
  { tier: "Starter", title: "Local Cafe Landing", result: "+150% online orders", color: "primary", slug: "local-cafe-landing" },
  { tier: "Growth", title: "Consulting Firm", result: "+200% leads", color: "primary", slug: "consulting-firm" },
  { tier: "Professional", title: "Fashion E-commerce", result: "+£50K monthly sales", color: "primary", slug: "fashion-ecommerce" },
  { tier: "Enterprise", title: "SaaS Platform", result: "10K+ active users", color: "primary", slug: "saas-platform" },
  { tier: "Custom Elite", title: "Healthcare Portal", result: "500K patients served", color: "gold", slug: "healthcare-portal" },
  { tier: "Starter", title: "Freelancer Portfolio", result: "+300% inquiries", color: "primary", slug: "freelancer-portfolio" },
];

export default function Portfolio() {
  return (
    <Layout>
      <section className="section-padding pt-32">
        <div className="container-tight">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-3xl mx-auto mb-16">
            <h1 className="heading-xl mb-6">Our <span className="text-gradient">Portfolio</span></h1>
            <p className="body-lg">Real results from real clients across all pricing tiers.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, i) => (
              <Link to={`/portfolio/${project.slug}`} key={i}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group rounded-2xl liquid-glass-card overflow-hidden transition-all duration-300 relative"
                  style={{ border: '1px solid hsl(var(--border) / 0.5)' }}
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
                    <span className={`text-6xl font-display font-bold relative z-10 ${project.color === "gold" ? "text-gradient-gold" : "text-gradient"} transition-transform duration-500 group-hover:scale-110`}>{project.tier[0]}</span>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="flex items-center gap-2 text-white font-display font-bold text-sm">
                        View Project <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <span className="text-xs font-medium text-primary liquid-glass-pill px-2 py-1 inline-block">{project.tier}</span>
                    <h3 className="font-display font-bold text-xl mt-3 mb-2">{project.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground"><TrendingUp className="w-4 h-4 text-primary" />{project.result}</div>
                  </div>
                  {/* Hover border glow */}
                  <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ boxShadow: 'inset 0 0 0 1px hsl(var(--primary) / 0.3)' }} />
                </motion.div>
              </Link>
            ))}
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }}
            className="text-center mt-12 p-8 rounded-3xl liquid-glass-card border border-border/50"
          >
            <h3 className="font-display font-bold text-2xl mb-4">Ready to Create Your Success Story?</h3>
            <p className="text-muted-foreground mb-6">Join our growing list of satisfied clients.</p>
            <Button variant="premium" size="xl" asChild><Link to="/get-started">Start Your Project <ArrowRight className="w-4 h-4" /></Link></Button>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
