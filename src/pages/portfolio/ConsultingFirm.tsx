import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { BarChart3, Users, Target, PieChart } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const services = [
  { icon: Target, title: "Business Strategy", desc: "Market analysis, competitive positioning, and growth roadmaps" },
  { icon: BarChart3, title: "Operations", desc: "Process optimisation, efficiency audits, and workflow design" },
  { icon: PieChart, title: "Financial Advisory", desc: "Budgeting, forecasting, and investment strategy" },
  { icon: Users, title: "HR & Talent", desc: "Recruitment strategy, culture development, and retention" },
];

const stats = [
  { value: "200+", label: "Clients Served" },
  { value: "£50M+", label: "Revenue Generated" },
  { value: "15+", label: "Years Experience" },
  { value: "98%", label: "Client Retention" },
];

const team = [
  { name: "David Chen", role: "Managing Director", initials: "DC" },
  { name: "Sarah Williams", role: "Strategy Lead", initials: "SW" },
  { name: "Michael Okafor", role: "Operations Director", initials: "MO" },
  { name: "Rebecca Lane", role: "Financial Advisor", initials: "RL" },
];

const testimonials = [
  { name: "Robert Hayes", company: "TechScale Ltd", text: "Pinnacle transformed our operations. Revenue up 200% in 12 months." },
  { name: "Amanda Foster", company: "GreenBuild Co", text: "Their strategic insight helped us secure our Series B funding." },
];

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

export default function ConsultingFirm() {
  return (
    <Layout>
      <div className="bg-muted/50 border-b border-border/30 py-2 px-4 text-sm">
        <span className="text-muted-foreground">This is a Quooro showcase project — </span>
        <Link to="/portfolio" className="text-brand hover:underline font-medium">Back to Portfolio</Link>
        <Badge variant="secondary" className="ml-2 text-xs">Growth</Badge>
      </div>

      {/* Hero */}
      <section className="bg-foreground dark:bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--brand)/0.15),transparent_70%)]" />
        <div className="container-tight py-24 md:py-32 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp}>
              <Badge className="mb-6 text-xs bg-brand text-brand-foreground">Pinnacle Consulting Group</Badge>
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display text-5xl md:text-7xl font-bold mb-6 text-background dark:text-foreground leading-[0.95] tracking-tight">
              Strategic Growth,<br />Measurable Results
            </motion.h1>
            <motion.p variants={fadeUp} className="text-lg md:text-xl max-w-xl mb-8 text-muted-foreground">
              We partner with ambitious businesses to unlock their full potential through data-driven strategy and expert guidance.
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button size="xl" className="rounded-lg font-bold bg-brand text-brand-foreground hover:bg-brand/90">
                Book a Consultation
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-brand">
        <div className="container-tight py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="font-display text-3xl md:text-4xl font-bold text-brand-foreground">{s.value}</div>
              <div className="text-sm mt-1 text-brand-foreground/70">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container-tight">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">Our Services</h2>
          <motion.div className="grid sm:grid-cols-2 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {services.map((s, i) => (
              <motion.div key={i} variants={fadeUp}
                className="rounded-xl p-8 border border-border/50 bg-card hover:-translate-y-1 transition-all duration-200 hover:shadow-lg">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-brand/10">
                  <s.icon className="w-6 h-6 text-brand" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 px-4 bg-background">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold text-center mb-12 tracking-tight">Leadership Team</h2>
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {team.map((t, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center font-display font-bold text-xl text-brand-foreground bg-foreground/80 dark:bg-card">
                  {t.initials}
                </div>
                <h4 className="font-display font-bold">{t.name}</h4>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold text-center mb-12 tracking-tight">Client Testimonials</h2>
          <motion.div className="grid md:grid-cols-2 gap-6" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeUp}
                className="rounded-xl p-8 bg-card border border-border/50">
                <p className="text-lg mb-4 italic text-foreground/80">"{t.text}"</p>
                <p className="font-display font-bold">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.company}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Built by Quooro */}
      <section className="py-16 px-4 border-t border-border/30 bg-foreground dark:bg-card">
        <div className="container-tight text-center">
          <p className="text-sm font-medium mb-2 text-brand">Built by Quooro</p>
          <p className="font-display text-2xl font-bold mb-2 text-background dark:text-foreground">+200% Leads Generated</p>
          <p className="mb-6 text-muted-foreground">Real results from a Growth package website.</p>
          <Button variant="hero" size="lg" asChild><Link to="/get-started">Start Your Project</Link></Button>
        </div>
      </section>
    </Layout>
  );
}
