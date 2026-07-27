import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Check, 
  Shield, 
  Lock, 
  Github, 
  FileCode2, 
  Download, 
  Key,
  FileText,
  Building2,
  Server,
  Monitor,
  Smartphone,
  Database,
  Layers,
  Package,
  RefreshCw,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  FileArchive
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HandoverChecklist } from "@/components/handover/HandoverChecklist";
import { generateHandoverAgreementPDF } from "@/lib/handoverPdfGenerator";

// Handover methods
const handoverMethods = [
  {
    icon: Github,
    title: "GitHub Repository Transfer",
    description: "Our preferred and most secure method. We transfer the complete repository to your GitHub account with full version history.",
    recommended: true,
    features: [
      "Complete version control history preserved",
      "All branches and commits transferred",
      "Secure encrypted transfer via GitHub",
      "Immediate access to all project files",
      "Documentation and README included",
      "CI/CD workflows (if applicable)"
    ]
  },
  {
    icon: FileArchive,
    title: "Encrypted File Package",
    description: "For clients without GitHub, we provide a secure encrypted archive containing all source files, assets, and documentation.",
    recommended: false,
    features: [
      "AES-256 encrypted ZIP archive",
      "Password delivered separately",
      "Complete source code included",
      "All assets and media files",
      "Database exports (where applicable)",
      "Deployment documentation"
    ]
  }
];

// What's included in handover by project type
const projectTypeHandovers = [
  {
    icon: Monitor,
    title: "Websites",
    description: "Marketing sites, landing pages, corporate websites",
    includes: [
      "Complete source code (HTML/CSS/JS or React)",
      "All design assets (images, fonts, icons)",
      "Content management setup documentation",
      "SEO configuration files (robots.txt, sitemap)",
      "SSL certificate details",
      "Hosting credentials and access",
      "Domain transfer assistance",
      "Analytics access (GA4, etc.)"
    ]
  },
  {
    icon: Smartphone,
    title: "Web Applications",
    description: "Custom dashboards, portals, PWAs",
    includes: [
      "Full application source code",
      "Frontend and backend codebases",
      "API documentation",
      "Environment configuration files",
      "Database schema and migrations",
      "Authentication system documentation",
      "Third-party integration keys",
      "Deployment scripts and CI/CD"
    ]
  },
  {
    icon: Database,
    title: "Dashboards & Admin Panels",
    description: "CRM systems, inventory management, reporting tools",
    includes: [
      "Complete dashboard source code",
      "Database exports and schema",
      "User role configurations",
      "Report templates and queries",
      "Integration credentials",
      "Admin documentation",
      "Backup procedures",
      "Security audit report"
    ]
  },
  {
    icon: Layers,
    title: "Custom Systems",
    description: "Booking systems, e-commerce, API platforms",
    includes: [
      "Full system architecture documentation",
      "All microservices source code",
      "API specifications (OpenAPI/Swagger)",
      "Database instances or exports",
      "Message queue configurations",
      "Load balancer settings",
      "Monitoring dashboards access",
      "Incident response procedures"
    ]
  }
];

// Ownership rights
const ownershipRights = [
  {
    title: "Full Source Code Ownership",
    description: "You own 100% of the code we write for your project. No licensing fees, no restrictions.",
    icon: FileCode2
  },
  {
    title: "No Vendor Lock-in",
    description: "Take your project to any developer, agency, or maintain it in-house. We provide everything you need.",
    icon: Lock
  },
  {
    title: "Intellectual Property Transfer",
    description: "All custom designs, code, and assets are transferred to you upon final payment.",
    icon: Key
  },
  {
    title: "Third-Party Licenses Documented",
    description: "We clearly document any open-source or third-party licenses used in your project.",
    icon: FileText
  }
];

// Handover process steps
const handoverSteps = [
  {
    step: "01",
    title: "Project Completion Sign-off",
    description: "Final review meeting to confirm all deliverables meet requirements. Both parties sign off on completion.",
    timing: "1-2 days"
  },
  {
    step: "02",
    title: "Documentation Package",
    description: "We prepare comprehensive documentation including technical specs, admin guides, and maintenance procedures.",
    timing: "2-3 days"
  },
  {
    step: "03",
    title: "Credentials & Access Transfer",
    description: "Secure transfer of all credentials, API keys, and service access. We use encrypted channels for sensitive data.",
    timing: "1 day"
  },
  {
    step: "04",
    title: "Repository Transfer",
    description: "GitHub repository transfer or encrypted file delivery. You gain full control of all source code.",
    timing: "Same day"
  },
  {
    step: "05",
    title: "Knowledge Transfer Session",
    description: "Live walkthrough of the system architecture, codebase, and maintenance procedures with your team.",
    timing: "1-2 hours"
  },
  {
    step: "06",
    title: "Support Transition",
    description: "30-day post-handover support period to address any questions or issues as you take ownership.",
    timing: "30 days"
  }
];

// Agreement points
const agreementPoints = [
  {
    category: "Ownership Transfer",
    points: [
      "Full intellectual property rights transfer upon final payment",
      "No royalties, licensing fees, or ongoing charges for code usage",
      "Right to modify, redistribute, or resell the delivered work",
      "Transfer of all domain registrations to your account"
    ]
  },
  {
    category: "Deliverables Guarantee",
    points: [
      "Complete and functional source code as per specifications",
      "All design files in editable formats (Figma, PSD, AI)",
      "Database schemas, migrations, and seed data where applicable",
      "Comprehensive documentation and user guides"
    ]
  },
  {
    category: "Post-Handover Support",
    points: [
      "30-day bug-fix warranty for issues in delivered code",
      "Email support for handover-related questions",
      "One free knowledge transfer session (video call)",
      "Optional ongoing maintenance packages available"
    ]
  },
  {
    category: "Confidentiality",
    points: [
      "Mutual NDA covering all project details",
      "Secure deletion of our copies after handover (on request)",
      "No portfolio usage without written consent",
      "Compliance with data protection regulations (GDPR)"
    ]
  }
];

// Security measures
const securityMeasures = [
  {
    icon: Shield,
    title: "Encrypted Transfers",
    description: "All file transfers use AES-256 encryption. Credentials are shared via secure, time-limited links."
  },
  {
    icon: Lock,
    title: "Access Revocation",
    description: "We immediately revoke our access to all systems upon handover completion."
  },
  {
    icon: CheckCircle2,
    title: "Audit Trail",
    description: "Complete log of all access and changes made during the project for your records."
  },
  {
    icon: AlertCircle,
    title: "Vulnerability Report",
    description: "Security assessment summary and recommendations for ongoing maintenance."
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Handover() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="section-padding pt-32">
        <div className="container-tight">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill mb-6">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Complete Project Handover</span>
            </motion.div>
            
            <motion.h1 variants={fadeUp} className="heading-xl mb-6">
              Full Ownership, <span className="text-gradient">No Lock-in</span>
            </motion.h1>
            
            <motion.p variants={fadeUp} className="body-lg mb-8">
              We believe you should own what you pay for. Every project we deliver comes with 
              complete source code, full documentation, and a seamless handover process. 
              Your digital assets are truly yours.
            </motion.p>

            <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-4">
              <Button variant="premium" size="lg" asChild>
                <Link to="/get-started">
                  Start Your Project <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="lg" asChild>
                <Link to="/ownership">Learn About Ownership</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="py-8 border-y border-border/50 liquid-glass">
        <div className="container-tight">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            {[
              { icon: Github, text: "GitHub Repository Transfer" },
              { icon: Shield, text: "AES-256 Encryption" },
              { icon: FileCode2, text: "100% Code Ownership" },
              { icon: Lock, text: "No Vendor Lock-in" }
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 liquid-glass-pill px-4 py-2">
                <item.icon className="w-4 h-4 text-primary" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Handover Methods */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="heading-md mb-4">
              How We <span className="text-gradient">Deliver</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="body-md max-w-2xl mx-auto">
              Choose the handover method that works best for your team and infrastructure.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {handoverMethods.map((method, index) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`p-8 rounded-3xl liquid-glass-card border ${
                  method.recommended ? "border-primary/50" : "border-border/50"
                } relative overflow-visible`}
              >
                {method.recommended && (
                  <div className="absolute -top-3 left-8 px-3 py-1 bg-gradient-primary rounded-full text-xs font-medium text-primary-foreground z-10">
                    Recommended
                  </div>
                )}
                <div className="w-14 h-14 rounded-2xl liquid-glass-pill flex items-center justify-center mb-6 mt-2">
                  <method.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-2xl mb-3">{method.title}</h3>
                <p className="text-muted-foreground mb-6">{method.description}</p>
                <ul className="space-y-3">
                  {method.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Type Handovers */}
      <section className="section-padding relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container-tight">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="heading-md mb-4">
              What's Included by <span className="text-gradient">Project Type</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="body-md max-w-2xl mx-auto">
              Every project type has specific deliverables tailored to its requirements.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {projectTypeHandovers.map((type, index) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl liquid-glass-card border border-border/50"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl liquid-glass-pill flex items-center justify-center flex-shrink-0">
                    <type.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl">{type.title}</h3>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
                <ul className="grid grid-cols-1 gap-2">
                  {type.includes.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ownership Rights */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="heading-md mb-4">
              Your <span className="text-gradient">Ownership Rights</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="body-md max-w-2xl mx-auto">
              Crystal clear ownership from day one. No fine print, no surprises.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ownershipRights.map((right, index) => (
              <motion.div
                key={right.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl liquid-glass-card border border-border/50 text-center"
              >
                <div className="w-14 h-14 rounded-2xl liquid-glass-pill flex items-center justify-center mx-auto mb-4">
                  <right.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{right.title}</h3>
                <p className="text-sm text-muted-foreground">{right.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Handover Process Timeline */}
      <section className="section-padding relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container-tight">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="heading-md mb-4">
              The Handover <span className="text-gradient">Process</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="body-md max-w-2xl mx-auto">
              A structured, secure process ensuring nothing is missed.
            </motion.p>
          </motion.div>

          <div className="relative">
            {/* Vertical line */}
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

            <div className="space-y-8">
              {handoverSteps.map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative md:grid md:grid-cols-2 md:gap-12 ${
                    index % 2 === 0 ? "" : "md:direction-rtl"
                  }`}
                >
                  {/* Timeline dot */}
                  <div className="hidden md:flex absolute left-1/2 top-6 -translate-x-1/2 z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg">
                      {step.step}
                    </div>
                  </div>

                  <div
                    className={`md:py-4 ${
                      index % 2 === 0 ? "md:pr-12 md:text-right" : "md:col-start-2 md:pl-12 md:text-left"
                    }`}
                    style={{ direction: "ltr" }}
                  >
                    <div className="p-6 rounded-2xl liquid-glass-card border border-border/50">
                      {/* Mobile step number */}
                      <div className="flex items-center gap-3 mb-3 md:hidden">
                        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xs">
                          {step.step}
                        </div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {step.timing}
                        </span>
                      </div>

                      <div className={`hidden md:flex items-center gap-3 mb-3 ${
                        index % 2 === 0 ? "justify-end" : "justify-start"
                      }`}>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {step.timing}
                        </span>
                      </div>

                      <h3 className="font-display font-bold text-xl mb-2">{step.title}</h3>
                      <p className="text-muted-foreground text-sm">{step.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Agreement Points */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="heading-md mb-4">
              Handover <span className="text-gradient">Agreement</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="body-md max-w-2xl mx-auto">
              Our standard handover agreement covers everything. Here's what's included.
            </motion.p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="multiple" className="space-y-4">
              {agreementPoints.map((section, index) => (
                <AccordionItem 
                  key={section.category} 
                  value={section.category}
                  className="liquid-glass-card border border-border/50 rounded-2xl px-6 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="hover:no-underline py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-display font-semibold text-lg">{section.category}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <ul className="space-y-3 pl-11">
                      {section.points.map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="section-padding relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container-tight">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="heading-md mb-4">
              Security <span className="text-gradient">Measures</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="body-md max-w-2xl mx-auto">
              We take security seriously throughout the handover process.
            </motion.p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {securityMeasures.map((measure, index) => (
              <motion.div
                key={measure.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl liquid-glass-card border border-border/50"
              >
                <div className="w-12 h-12 rounded-xl liquid-glass-pill flex items-center justify-center mb-4">
                  <measure.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{measure.title}</h3>
                <p className="text-sm text-muted-foreground">{measure.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* GitHub Section */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill mb-6">
                <Github className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Preferred Method</span>
              </div>
              <h2 className="heading-md mb-4">
                Why We Use <span className="text-gradient">GitHub</span>
              </h2>
              <p className="body-md mb-6">
                GitHub is the industry standard for code hosting and version control. By transferring 
                your project via GitHub, you get a secure, encrypted handover with complete history 
                and the ability to collaborate with any developer worldwide.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "Industry-standard encryption and security",
                  "Complete version history preserved",
                  "Easy collaboration with future developers",
                  "Built-in issue tracking and documentation",
                  "Seamless integration with CI/CD pipelines"
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted-foreground">
                <strong>Don't have GitHub?</strong> We can help you set up an account or provide 
                an alternative encrypted file delivery.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="p-8 rounded-3xl liquid-glass-card border border-border/50">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-foreground flex items-center justify-center">
                    <Github className="w-10 h-10 text-background" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl">Repository Transfer</h3>
                    <p className="text-sm text-muted-foreground">Secure ownership transfer</p>
                  </div>
                </div>

                <div className="space-y-4 border-t border-border/50 pt-6">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Transfer Status</span>
                    <span className="flex items-center gap-2 text-sm text-green-500">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Commits</span>
                    <span className="text-sm text-muted-foreground">247 commits transferred</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Branches</span>
                    <span className="text-sm text-muted-foreground">main, staging, develop</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-medium">Documentation</span>
                    <span className="text-sm text-muted-foreground">README, CHANGELOG included</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container-tight">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="heading-md mb-4">
              Handover <span className="text-gradient">FAQs</span>
            </motion.h2>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              {[
                {
                  q: "When does the handover happen?",
                  a: "Handover begins immediately after final payment and project sign-off. The complete process typically takes 5-7 business days, including documentation preparation and knowledge transfer."
                },
                {
                  q: "What if I don't use GitHub?",
                  a: "No problem! We can deliver your project as an AES-256 encrypted archive. We'll send the files and password separately for security. We can also help you set up a GitHub account if you'd like to use it going forward."
                },
                {
                  q: "Can I hire my own developers to maintain the project?",
                  a: "Absolutely. You own the code completely. You can hire any developer, agency, or build an in-house team. Our documentation is designed to make onboarding new developers straightforward."
                },
                {
                  q: "What about ongoing hosting and domains?",
                  a: "We transfer all hosting credentials and domain registrations to your accounts. You'll have full control over your infrastructure. We also provide documentation on how to manage these services."
                },
                {
                  q: "Do you provide training?",
                  a: "Yes! Every handover includes a knowledge transfer session where we walk through the system architecture, codebase, and maintenance procedures. Additional training sessions can be arranged as needed."
                },
                {
                  q: "What if I find bugs after handover?",
                  a: "We provide a 30-day warranty for bugs in the delivered code. Issues that arise from changes you make are not covered, but we're happy to assist at our standard hourly rate."
                }
              ].map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="liquid-glass-card border border-border/50 rounded-2xl px-6 data-[state=open]:border-primary/30"
                >
                  <AccordionTrigger className="hover:no-underline py-6 text-left">
                    <span className="font-display font-semibold">{faq.q}</span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <p className="text-muted-foreground">{faq.a}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Interactive Handover Checklist */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="heading-md mb-4">
              Track Your <span className="text-gradient">Handover Progress</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="body-md max-w-2xl mx-auto">
              Use this interactive checklist to track your project handover in real-time. 
              Your progress is saved automatically.
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <HandoverChecklist />
          </motion.div>
        </div>
      </section>

      {/* Download Agreement Section */}
      <section className="section-padding relative overflow-hidden" style={{ borderTop: '1px solid hsl(var(--border) / 0.15)' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl liquid-glass-card border border-border/50"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-14 h-14 rounded-2xl liquid-glass-pill flex items-center justify-center mb-6">
                  <FileText className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-display font-bold text-2xl lg:text-3xl mb-4">
                  Download Handover Agreement
                </h3>
                <p className="text-muted-foreground mb-6">
                  Review our complete handover agreement before starting your project. 
                  This document outlines ownership transfer, deliverables, post-handover 
                  support, and confidentiality terms.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Full ownership transfer terms",
                    "Deliverables guarantee",
                    "30-day support warranty",
                    "Confidentiality & security measures"
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="premium" 
                  size="lg"
                  onClick={() => generateHandoverAgreementPDF()}
                  className="gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download PDF Agreement
                </Button>
              </div>
              <div className="hidden md:block">
                <div className="p-8 rounded-2xl bg-muted/50 border border-border/50">
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                    <div className="h-3 bg-muted rounded w-4/5"></div>
                    <div className="h-6 mt-6"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-6 mt-6"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-4/5"></div>
                    <div className="h-3 bg-muted rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl liquid-glass-card border border-primary/30 text-center"
          >
            <h2 className="heading-md mb-4">
              Ready to Get <span className="text-gradient">Started</span>?
            </h2>
            <p className="body-lg mb-8 max-w-2xl mx-auto">
              Build your project with confidence knowing you'll own everything at the end. 
              No lock-in, no surprises — just clean, well-documented code that's truly yours.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button variant="premium" size="xl" asChild>
                <Link to="/get-started">
                  Start Your Project <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/packages">View Our Packages</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
