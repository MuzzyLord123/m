import { Link } from "react-router-dom";
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
  Monitor,
  Smartphone,
  Database,
  Layers,
  AlertCircle,
  CheckCircle2,
  FileArchive
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell } from "@/components/marketing/Matrix";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HandoverChecklist } from "@/components/handover/HandoverChecklist";
import { generateHandoverAgreementPDF } from "@/lib/handoverPdfGenerator";

/**
 * The handover contract as a document a buyer can actually read: methods,
 * per-project-type inventories, the six-step transfer ledger, agreement
 * terms and security measures — all in the drafting-sheet voice. The
 * interactive checklist and the PDF agreement generator are untouched.
 */

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

const handoverSteps = [
  {
    title: "Project Completion Sign-off",
    description: "Final review meeting to confirm all deliverables meet requirements. Both parties sign off on completion.",
    timing: "1-2 days"
  },
  {
    title: "Documentation Package",
    description: "We prepare comprehensive documentation including technical specs, admin guides, and maintenance procedures.",
    timing: "2-3 days"
  },
  {
    title: "Credentials & Access Transfer",
    description: "Secure transfer of all credentials, API keys, and service access. We use encrypted channels for sensitive data.",
    timing: "1 day"
  },
  {
    title: "Repository Transfer",
    description: "GitHub repository transfer or encrypted file delivery. You gain full control of all source code.",
    timing: "Same day"
  },
  {
    title: "Knowledge Transfer Session",
    description: "Live walkthrough of the system architecture, codebase, and maintenance procedures with your team.",
    timing: "1-2 hours"
  },
  {
    title: "Support Transition",
    description: "30-day post-handover support period to address any questions or issues as you take ownership.",
    timing: "30 days"
  }
];

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

const faqs = [
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
];

export default function Handover() {
  return (
    <Layout>
      <PageHero
        eyebrow="The transfer"
        index="33"
        crumbs={[{ label: "Home", href: "/" }, { label: "Handover" }]}
        title="Handover,"
        highlight="in full"
        body="How every asset, credential and line of code transfers to you — securely, documented, and on the record."
        actions={
          <>
            <Magnetic className="inline-block w-full sm:w-auto">
              <Button variant="premium" size="xl" asChild className="group w-full sm:w-auto">
                <Link to="/get-started">
                  Start your project
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
            <Link to="/ownership" className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground sm:justify-start">
              <span className="link-underline">What you own</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </>
        }
        aside={
          <PageHeroFacts
            facts={[
              { value: "06", label: "Transfer steps" },
              { value: "5–7", label: "Business days" },
              { value: "30", label: "Days of support after" },
            ]}
          />
        }
      />

      {/* Transfer methods */}
      <section className="section-padding">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Two routes</span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
              How the code
              <span className="block text-primary">reaches you.</span>
            </h2>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 md:grid-cols-2">
            {handoverMethods.map((method, i) => (
              <RevealItem
                key={method.title}
                className="group relative overflow-hidden border-b border-r border-border/60 p-7 transition-colors duration-500 hover:bg-foreground/[0.02] sm:p-8"
              >
                <span
                  aria-hidden
                  className={`absolute inset-x-0 top-0 h-px origin-left bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none ${
                    method.recommended ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
                <div className="mb-6 flex items-center justify-between">
                  <method.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  {method.recommended ? (
                    <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-primary">
                      Recommended
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-xl font-semibold tracking-tight">{method.title}</h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                  {method.description}
                </p>
                <ul className="mt-5 border-t border-border/60">
                  {method.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 border-b border-border/40 py-2.5 text-sm font-light text-muted-foreground last:border-b-0"
                    >
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.2} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* What's included by project type */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">The inventory</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                What transfers,
                <span className="block text-primary">by project type.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                Eight-line inventories — the exact contents of your handover package.
              </p>
            </div>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 md:grid-cols-2">
            {projectTypeHandovers.map((project, i) => (
              <RevealItem
                key={project.title}
                className="group relative overflow-hidden border-b border-r border-border/60 p-7 transition-colors duration-500 hover:bg-foreground/[0.02] sm:p-8"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 motion-reduce:transition-none"
                />
                <div className="mb-6 flex items-center justify-between">
                  <project.icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-xl font-semibold tracking-tight">{project.title}</h3>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {project.description}
                </p>
                <ol className="mt-5 border-t border-border/60">
                  {project.includes.map((item, j) => (
                    <li
                      key={item}
                      className="flex items-baseline gap-3 border-b border-border/40 py-2 text-sm font-light text-muted-foreground last:border-b-0"
                    >
                      <span className="font-mono text-[10px] tabular-nums text-primary">
                        {String(j + 1).padStart(2, "0")}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Ownership rights */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Your rights</span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
              Ownership,
              <span className="block text-primary">without asterisks.</span>
            </h2>
          </Reveal>

          <Matrix cols={4}>
            {ownershipRights.map((right, i) => (
              <MatrixCell key={right.title} icon={right.icon} index={i} title={right.title}>
                {right.description}
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* The six-step transfer */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Six steps</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                The transfer,
                <span className="block text-primary">step by step.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                From sign-off to support transition — typically 5–7 business days end to end.
              </p>
            </Reveal>
            <RevealGroup className="lg:col-span-8">
              {handoverSteps.map((step, i) => (
                <RevealItem
                  key={step.title}
                  className="grid grid-cols-[auto_1fr_auto] items-baseline gap-x-5 border-t border-border/60 py-6 last:border-b sm:gap-x-8"
                >
                  <span className="font-mono text-[11px] tabular-nums text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="block font-display text-lg font-semibold tracking-tight sm:text-xl">
                      {step.title}
                    </span>
                    <span className="mt-1.5 block text-sm font-light leading-relaxed text-muted-foreground">
                      {step.description}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                    {step.timing}
                  </span>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      {/* Agreement points */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">In the agreement</span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
              Four clauses that
              <span className="block text-primary">protect you.</span>
            </h2>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 sm:grid-cols-2 xl:grid-cols-4">
            {agreementPoints.map((section, i) => (
              <RevealItem key={section.category} className="border-b border-r border-border/60 p-7 sm:p-8">
                <div className="mb-5 flex items-baseline justify-between gap-4">
                  <span className="font-mono text-[11px] tabular-nums text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">{section.category}</h3>
                <ul className="mt-5 border-t border-border/60">
                  {section.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2.5 border-b border-border/40 py-2.5 text-sm font-light text-muted-foreground last:border-b-0"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.2} />
                      {point}
                    </li>
                  ))}
                </ul>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* Security measures */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">During transfer</span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
              Security
              <span className="block text-primary">measures.</span>
            </h2>
          </Reveal>

          <Matrix cols={4}>
            {securityMeasures.map((measure, i) => (
              <MatrixCell key={measure.title} icon={measure.icon} index={i} title={measure.title}>
                {measure.description}
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Straight answers</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Handover
                <span className="block text-primary">questions.</span>
              </h2>
            </Reveal>
            <Reveal className="lg:col-span-8">
              <Accordion type="single" collapsible className="border-t border-border/60">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`faq-${index}`}
                    className="border-b border-border/60"
                  >
                    <AccordionTrigger className="gap-6 py-5 text-left font-display font-medium tracking-tight text-foreground hover:text-primary hover:no-underline">
                      <span className="flex items-baseline gap-4">
                        <span className="font-mono text-[11px] tabular-nums text-primary">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {faq.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pl-8 text-sm font-light leading-relaxed text-muted-foreground">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Interactive handover checklist */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Live tracker</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Track your
                <span className="block text-primary">handover progress.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                Use this interactive checklist during your handover — progress is saved
                automatically.
              </p>
            </div>
          </Reveal>
          <Reveal>
            <HandoverChecklist />
          </Reveal>
        </div>
      </section>

      {/* Download agreement */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <FileText className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="eyebrow">On paper</span>
              </div>
              <h3 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Download the
                <span className="block text-primary">handover agreement.</span>
              </h3>
              <p className="mt-5 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                Review our complete handover agreement before starting your project. This document
                outlines ownership transfer, deliverables, post-handover support, and
                confidentiality terms.
              </p>
              <ul className="mt-6 space-y-2.5">
                {[
                  "Full ownership transfer terms",
                  "Deliverables guarantee",
                  "30-day support warranty",
                  "Confidentiality & security measures"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-light text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                variant="premium"
                size="lg"
                onClick={() => generateHandoverAgreementPDF()}
                className="mt-8 gap-2"
              >
                <Download className="h-5 w-5" />
                Download PDF Agreement
              </Button>
            </div>
            {/* Document motif — hairline page mock in the drafting voice */}
            <div className="hidden md:block" aria-hidden>
              <div className="relative border border-border/60 bg-background p-8">
                <span className="absolute inset-x-0 top-0 h-px bg-primary" />
                <div className="mb-6 flex items-center justify-between">
                  <span className="mono-label">Handover agreement</span>
                  <span className="mono-label text-primary">PDF</span>
                </div>
                <div className="space-y-3">
                  <div className="h-3 w-3/4 bg-foreground/[0.07]" />
                  <div className="h-2 w-full bg-foreground/[0.05]" />
                  <div className="h-2 w-5/6 bg-foreground/[0.05]" />
                  <div className="h-2 w-4/5 bg-foreground/[0.05]" />
                  <div className="h-5" />
                  <div className="h-3 w-2/3 bg-foreground/[0.07]" />
                  <div className="h-2 w-full bg-foreground/[0.05]" />
                  <div className="h-2 w-3/4 bg-foreground/[0.05]" />
                  <div className="h-5" />
                  <div className="h-3 w-1/2 bg-foreground/[0.07]" />
                  <div className="h-2 w-4/5 bg-foreground/[0.05]" />
                  <div className="h-2 w-full bg-foreground/[0.05]" />
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-4">
                  <span className="mono-label">EST. Wales · United Kingdom</span>
                  <span className="mono-label">quooro.com</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Build knowing
                <span className="block text-primary">you'll own it all.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                No lock-in, no surprises — just clean, well-documented code that&rsquo;s truly
                yours.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Start your project
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Link to="/packages" className="link-underline self-center text-sm text-muted-foreground transition-colors hover:text-foreground">
                View our packages
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
