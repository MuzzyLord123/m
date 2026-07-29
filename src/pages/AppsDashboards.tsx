import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Check, 
  Layers, 
  Database, 
  Users, 
  BarChart3, 
  Settings, 
  Shield,
  Zap,
  Clock,
  Workflow,
  Monitor,
  Server,
  Lock
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ScrollSection, StaggeredScrollSection, ScrollItem } from "@/components/ScrollSection";
import dashboardImage from "@/assets/dashboard-ui.jpg";

const appTypes = [
  {
    icon: Users,
    title: "Client Portals",
    description: "Secure spaces for clients to access documents, communicate with your team, and track project progress."
  },
  {
    icon: BarChart3,
    title: "Internal Dashboards",
    description: "Real-time data visualisation tools that give your team instant insights into business performance."
  },
  {
    icon: Database,
    title: "Inventory Systems",
    description: "Track stock levels, manage orders, and automate reordering with custom-built inventory management."
  },
  {
    icon: Server,
    title: "Custom Databases",
    description: "Structured data systems designed around your specific business processes and requirements."
  },
  {
    icon: Workflow,
    title: "Workflow Tools",
    description: "Automate repetitive tasks, manage approvals, and streamline operations across your organisation."
  },
  {
    icon: Settings,
    title: "Management Systems",
    description: "Comprehensive platforms for managing projects, resources, teams, and business operations."
  }
];

const complexityLevels = [
  {
    level: "Simple",
    timeline: "2-4 weeks",
    description: "Basic tools, single-purpose applications, simple data management",
    examples: ["Contact forms", "Booking systems", "Basic dashboards"]
  },
  {
    level: "Moderate",
    timeline: "1-3 months",
    description: "Multi-feature applications, integrations, user management",
    examples: ["Client portals", "Inventory trackers", "CRM systems"]
  },
  {
    level: "Complex",
    timeline: "3-12 months",
    description: "Enterprise platforms, custom workflows, extensive integrations",
    examples: ["Full ERP systems", "Multi-tenant SaaS", "Enterprise dashboards"]
  }
];

const benefits = [
  {
    icon: Shield,
    title: "Secure by Design",
    description: "Enterprise-grade security with role-based access, encryption, and audit logging."
  },
  {
    icon: Zap,
    title: "Built for Performance",
    description: "Fast, responsive applications that handle high traffic and complex operations."
  },
  {
    icon: Clock,
    title: "Ongoing Support",
    description: "We don't disappear after launch — continuous maintenance, updates, and improvements."
  },
  {
    icon: Layers,
    title: "Scalable Architecture",
    description: "Systems designed to grow with your business, from startup to enterprise."
  }
];

export default function AppsDashboards() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={dashboardImage} 
            alt="" 
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
        </div>
        <div className="container-tight py-20 md:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
              Beyond Websites
            </span>
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="heading-xl mb-6">
              Custom Apps Built for{" "}
              <span className="text-gradient">How You Work</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              We design and build custom web applications, dashboards, databases, and internal systems 
              for businesses of all sizes — from simple tools to enterprise-level platforms.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button variant="premium" size="xl" asChild>
                <Link to="/get-started">
                  Start Your Project <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/portfolio">View Our Work</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What We Build */}
      <section className="section-padding">
        <div className="container-tight">
          <ScrollSection direction="up" className="text-center mb-16">
            <h2 className="heading-lg mb-4">
              What We <span className="text-gradient">Build</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From simple internal tools to complex enterprise platforms, we create digital systems 
              tailored to your specific business requirements.
            </p>
          </ScrollSection>

          <StaggeredScrollSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {appTypes.map((app) => (
              <ScrollItem key={app.title}>
                <motion.div
                  whileHover={{ y: -8 }}
                  className="p-8 rounded-2xl liquid-glass-card h-full"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                    <app.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-3">{app.title}</h3>
                  <p className="text-muted-foreground">{app.description}</p>
                </motion.div>
              </ScrollItem>
            ))}
          </StaggeredScrollSection>
        </div>
      </section>

      {/* Complexity & Timeline */}
      <section className="section-padding liquid-glass">
        <div className="container-tight">
          <ScrollSection direction="up" className="text-center mb-16">
            <h2 className="heading-lg mb-4">
              Scope & <span className="text-gradient">Timeline</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From simple applications to systems that take months or years to develop — 
              we build with scalability in mind.
            </p>
          </ScrollSection>

          <div className="grid md:grid-cols-3 gap-8">
            {complexityLevels.map((level, index) => (
              <motion.div
                key={level.level}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                whileHover={{ y: -4 }}
                className="p-8 rounded-2xl liquid-glass-card"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold text-xl">{level.level}</h3>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    {level.timeline}
                  </span>
                </div>
                <p className="text-muted-foreground mb-6">{level.description}</p>
                <div className="space-y-2">
                  {level.examples.map((example) => (
                    <div key={example} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{example}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <ScrollSection direction="left">
              <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
                Our Approach
              </span>
              <h2 className="heading-lg mb-6">
                Modern Development.{" "}
                <span className="text-gradient">Experienced Design.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                We combine modern development tooling with years of experience in system design 
                to create applications that are fast, secure, and built to last.
              </p>

              <div className="space-y-6">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{benefit.title}</h3>
                      <p className="text-sm text-muted-foreground">{benefit.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollSection>

            <ScrollSection direction="right">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent rounded-3xl" />
                <div className="p-8 rounded-3xl liquid-glass-card border border-primary/20">
                  <div className="flex items-center gap-3 pb-6 border-b border-border/50 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <Monitor className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">Custom Application</p>
                      <p className="text-sm text-muted-foreground">Built for your business</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {[
                      { label: "User Authentication", status: "Secure" },
                      { label: "Data Management", status: "Encrypted" },
                      { label: "API Integrations", status: "Connected" },
                      { label: "Performance", status: "Optimised" },
                    ].map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 + index * 0.1 }}
                        className="flex items-center justify-between p-4 rounded-xl liquid-glass-subtle"
                      >
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="flex items-center gap-2 text-xs text-green-500">
                          <Lock className="w-3 h-3" />
                          {item.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border/50">
                    <p className="text-xs text-muted-foreground text-center">
                      Scalable • Secure • Supported
                    </p>
                  </div>
                </div>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding liquid-glass">
        <div className="container-tight">
          <ScrollSection direction="scale">
            <div className="p-8 md:p-16 rounded-3xl liquid-glass-card text-center">
              <h2 className="heading-lg mb-6">
                Ready to Build Something <span className="text-gradient">Amazing?</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
                Let's discuss your project requirements. Whether it's a simple internal tool 
                or a complex enterprise platform, we're here to help.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button variant="premium" size="xl" asChild>
                  <Link to="/get-started">
                    Start Your Project <ArrowRight className="w-5 h-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link to="/client-portal">Explore the Platform</Link>
                </Button>
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>
    </Layout>
  );
}
