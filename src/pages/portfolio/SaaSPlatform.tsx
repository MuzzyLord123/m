import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Zap, Shield, BarChart3, Users, Globe, Layers, ArrowRight, Check, Star } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  { icon: Zap, title: "Workflow Automation", desc: "Automate repetitive tasks and boost team productivity by 10x." },
  { icon: BarChart3, title: "Advanced Analytics", desc: "Real-time dashboards with actionable insights across all teams." },
  { icon: Shield, title: "Enterprise Security", desc: "SOC 2 compliant with end-to-end encryption and SSO." },
  { icon: Users, title: "Team Collaboration", desc: "Real-time editing, comments, and shared workspaces." },
  { icon: Globe, title: "Global CDN", desc: "Lightning-fast performance with 99.99% uptime SLA." },
  { icon: Layers, title: "API-First", desc: "RESTful & GraphQL APIs with comprehensive documentation." },
];

const metrics = [
  { value: "10K+", label: "Active Users" },
  { value: "99.99%", label: "Uptime" },
  { value: "50M+", label: "Tasks Completed" },
  { value: "150+", label: "Integrations" },
];

const tiers = [
  { name: "Starter", price: "$29", features: ["5 team members", "10 workflows", "Basic analytics", "Email support"] },
  { name: "Pro", price: "$79", features: ["25 team members", "Unlimited workflows", "Advanced analytics", "Priority support"], popular: true },
  { name: "Enterprise", price: "Custom", features: ["Unlimited members", "Custom integrations", "Dedicated CSM", "SLA guarantee"] },
];

const integrations = ["Slack", "GitHub", "Jira", "Figma", "Notion", "Salesforce", "Stripe", "HubSpot"];

export default function SaaSPlatform() {
  return (
    <Layout>
      <div className="bg-muted/50 border-b border-border/50 py-2 px-4 text-sm">
        <span className="text-muted-foreground">This is a Quooro showcase project — </span>
        <Link to="/portfolio" className="text-primary hover:underline font-medium">Back to Portfolio</Link>
        <Badge variant="secondary" className="ml-2 text-xs">Enterprise</Badge>
      </div>

      {/* Hero */}
      <section style={{ background: "linear-gradient(135deg, hsl(250 40% 8%), hsl(250 50% 15%))" }}>
        <div className="container-tight py-24 md:py-36">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Badge className="mb-6" style={{ background: "hsl(250 80% 65%)", color: "white" }}>FlowStack</Badge>
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 text-white">
              Scale Your<br />Workflow
            </h1>
            <p className="text-lg max-w-xl mb-8" style={{ color: "hsl(250 20% 70%)" }}>
              The all-in-one platform to automate, collaborate, and grow — trusted by 10,000+ teams worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="xl" className="rounded-lg font-bold" style={{ background: "hsl(250 80% 65%)", color: "white" }}>
                Start Free Trial
              </Button>
              <Button size="xl" variant="outline" className="rounded-lg border-white/20 text-white hover:bg-white/10">
                Watch Demo
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section style={{ background: "hsl(250 80% 65%)" }}>
        <div className="container-tight py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {metrics.map((m, i) => (
            <div key={i}>
              <div className="font-display text-3xl font-bold text-white">{m.value}</div>
              <div className="text-sm mt-1" style={{ color: "hsl(250 90% 92%)" }}>{m.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4" style={{ background: "hsl(250 20% 98%)" }}>
        <div className="container-tight">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: "hsl(250 30% 15%)" }}>Everything You Need</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">Powerful features designed for modern teams.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="rounded-xl p-8 bg-white border transition-all duration-300" style={{ borderColor: "hsl(250 15% 90%)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "hsl(250 60% 95%)" }}>
                  <f.icon className="w-6 h-6" style={{ color: "hsl(250 80% 65%)" }} />
                </div>
                <h3 className="font-display font-bold text-lg mb-2" style={{ color: "hsl(250 30% 15%)" }}>{f.title}</h3>
                <p className="text-sm" style={{ color: "hsl(250 10% 50%)" }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 bg-background">
        <div className="container-tight">
          <h2 className="font-display text-3xl font-bold text-center mb-12" style={{ color: "hsl(250 30% 15%)" }}>Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {tiers.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`rounded-xl p-8 border relative ${t.popular ? "border-2 shadow-lg" : ""}`}
                style={{ borderColor: t.popular ? "hsl(250 80% 65%)" : "hsl(250 15% 90%)", background: "white" }}>
                {t.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: "hsl(250 80% 65%)" }}>Most Popular</div>}
                <h3 className="font-display font-bold text-xl mb-1">{t.name}</h3>
                <div className="font-display text-4xl font-bold mb-1" style={{ color: "hsl(250 80% 65%)" }}>{t.price}</div>
                <p className="text-xs text-muted-foreground mb-6">{t.price !== "Custom" ? "/month" : "Contact us"}</p>
                <ul className="space-y-3 mb-8">
                  {t.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4" style={{ color: "hsl(250 80% 65%)" }} />{f}</li>
                  ))}
                </ul>
                <Button className="w-full" variant={t.popular ? "default" : "outline"} style={t.popular ? { background: "hsl(250 80% 65%)" } : {}}>
                  {t.price === "Custom" ? "Contact Sales" : "Get Started"}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-16 px-4" style={{ background: "hsl(250 20% 97%)" }}>
        <div className="container-tight">
          <h2 className="font-display text-2xl font-bold mb-8" style={{ color: "hsl(250 30% 15%)" }}>Integrations</h2>
          <div className="flex flex-wrap gap-4">
            {integrations.map((name, i) => (
              <span key={i} className="px-5 py-2.5 rounded-full text-sm font-medium bg-white border" style={{ borderColor: "hsl(250 15% 88%)" }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Built by Quooro */}
      <section className="py-16 px-4 border-t border-border/50" style={{ background: "hsl(250 40% 8%)" }}>
        <div className="container-tight">
          <p className="text-sm font-medium mb-2" style={{ color: "hsl(250 80% 65%)" }}>Built by Quooro</p>
          <p className="font-display text-2xl font-bold mb-2 text-white">10K+ Active Users</p>
          <p className="mb-6" style={{ color: "hsl(250 20% 60%)" }}>Real results from an Enterprise package website.</p>
          <Button variant="hero" size="lg" asChild><Link to="/get-started">Start Your Project</Link></Button>
        </div>
      </section>
    </Layout>
  );
}
