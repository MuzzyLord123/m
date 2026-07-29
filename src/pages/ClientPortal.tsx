import { Link } from "react-router-dom";
import {
  ArrowRight,
  Upload,
  MessageSquare,
  Eye,
  Shield,
  Lock,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  Laptop,
  Calendar,
  Wrench,
  Check,
  Layers,
  BarChart3,
  Globe,
  Key
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell } from "@/components/marketing/Matrix";
import { CapabilityCell } from "@/components/marketing/ServiceSeries";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * The Quooro Lounge portal, presented as an instrument panel spec: what the
 * platform does, what clients see, how the team runs it, what updates cost,
 * and the security posture — hairlines and ledgers throughout.
 */

const clientFeatures = [
  {
    icon: Eye,
    title: "Website Preview Access",
    description: "View your website in development with secure, private preview links. Track status and progress in real-time."
  },
  {
    icon: Layers,
    title: "App Project Tracking",
    description: "Monitor custom app development with milestones, status updates, and direct access to preview and production URLs."
  },
  {
    icon: Upload,
    title: "Asset Centre",
    description: "Upload images, documents, and content directly to your projects. No email attachments or file-sharing hassles."
  },
  {
    icon: MessageSquare,
    title: "Team Communication",
    description: "Chat directly with your dedicated project team. All conversations are stored securely in one place."
  },
  {
    icon: FileText,
    title: "Content Requests",
    description: "Submit content updates, schedule changes, and track request progress through completion."
  },
  {
    icon: BarChart3,
    title: "SEO & Marketing Insights",
    description: "Access SEO analysis, view ad campaigns, social media schedules, and your unified marketing calendar."
  }
];

const platformCapabilities = [
  {
    icon: Globe,
    title: "Website Management",
    description: "Full visibility into your website status, preview access, SSL status, and version history.",
    features: ["Live preview links", "Status tracking", "SSL monitoring", "Domain management"]
  },
  {
    icon: Layers,
    title: "App & Dashboard Projects",
    description: "Track custom application development from concept to launch with milestone visibility.",
    features: ["Project milestones", "Feature tracking", "Preview & production URLs", "Development notes"]
  },
  {
    icon: BarChart3,
    title: "Marketing Hub",
    description: "Unified view of all marketing activities across social media, ads, and content.",
    features: ["Ad campaign tracking", "Social media scheduling", "Content calendar", "SEO insights"]
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite team members with role-based access to manage different aspects of your account.",
    features: ["Role-based permissions", "Team invitations", "Activity tracking", "Secure access"]
  }
];

const securityFeatures = [
  { icon: Lock, title: "Two-Factor Authentication", description: "Required 2FA for all account access" },
  { icon: Shield, title: "256-bit Encryption", description: "Enterprise-grade data protection" },
  { icon: Key, title: "Role-Based Access", description: "Granular permission controls" },
  { icon: Eye, title: "Private Previews", description: "No public links or exposure" }
];

const teamFeatures = [
  {
    icon: Users,
    title: "Controlled Account Management",
    description: "Structured client management with role-based access and organised project workflows."
  },
  {
    icon: Lock,
    title: "Secure Messaging",
    description: "All client communications are encrypted and stored securely for compliance and reference."
  },
  {
    icon: CheckCircle2,
    title: "Enquiry Handling",
    description: "Systematic processing of new enquiries, quotes, and project requests with full audit trails."
  },
  {
    icon: Laptop,
    title: "Preview Management",
    description: "Generate and control secure preview links for each client without exposing development work publicly."
  }
];

const benefits = [
  {
    title: "Complete Visibility",
    description: "Track every aspect of your projects from initial enquiry through to launch and beyond.",
    icon: Eye
  },
  {
    title: "Faster Turnaround",
    description: "No more waiting for emails or searching for files. Everything you need is in one secure place.",
    icon: Clock
  },
  {
    title: "Team Collaboration",
    description: "Invite colleagues with specific roles to manage different aspects of your digital presence.",
    icon: Users
  },
  {
    title: "Enterprise Security",
    description: "Your data is protected with 2FA, encryption, and role-based access at every level.",
    icon: Shield
  }
];

const perEdit = [
  { name: "Minor Text Changes", note: "Typo fixes, small content updates" },
  { name: "Content Updates", note: "New sections, image swaps, layout tweaks" },
  { name: "Feature Additions", note: "New pages, forms, integrations" },
];

const monthly = [
  { name: "Essential Care", note: "2 content updates, security monitoring" },
  { name: "Growth Plan", note: "5 updates, priority support, analytics" },
  { name: "Premium Support", note: "Unlimited updates, same-day response" },
];

const faqs = [
  {
    q: "How do I access my client portal?",
    a: "Once your project begins, you'll receive a secure login link via email. Simply click the link, set your password, and you'll have instant access to your dedicated Quooro Lounge portal."
  },
  {
    q: "Who can use the customer login?",
    a: "The customer login is available for anyone waiting for a live preview of their website, not just clients who have purchased a site. If you've enquired and we're preparing a preview for you, you'll receive login access to view it securely through the portal."
  },
  {
    q: "Do you make website updates for free?",
    a: "No, we don't make updates to websites without a charge. Website changes are either billed on a per-edit basis or covered under a monthly management plan. This ensures quality work and fair pricing for all updates, whether it's a small text change or a larger feature addition."
  },
  {
    q: "Is my data secure in the portal?",
    a: "Absolutely. We use 256-bit encryption for all data transfers and storage. Your files, messages, and project details are protected with enterprise-grade security protocols."
  },
  {
    q: "Can I access the portal on mobile devices?",
    a: "Yes! The client portal is fully responsive and works seamlessly on smartphones, tablets, and desktop computers. Access your project anytime, anywhere."
  },
  {
    q: "Who can see my uploaded files and messages?",
    a: "Only you and your assigned project team can access your portal. We use role-based access control to ensure your content remains private and secure."
  },
  {
    q: "How do live previews work?",
    a: "Your website preview is hosted on a secure, private URL accessible only through your portal. No public links are ever shared, protecting your development work from competitors or premature exposure."
  },
  {
    q: "What file types can I upload?",
    a: "You can upload images (JPG, PNG, WebP, SVG), documents (PDF, Word, Excel), and various other file types. Our system supports files up to 50MB each."
  },
  {
    q: "Can I reset my password if I forget it?",
    a: "Yes, simply click 'Forgot Password' on the login page, enter your email, and you'll receive a secure reset link within minutes."
  },
  {
    q: "Is there a limit to how many files I can upload?",
    a: "There's no strict limit on the number of files. We provide generous storage for all project assets to ensure you can share everything needed for your website."
  }
];

export default function ClientPortal() {
  return (
    <Layout>
      <PageHero
        eyebrow="The Lounge"
        index="34"
        crumbs={[{ label: "Home", href: "/" }, { label: "Client portal" }]}
        title="Your project,"
        highlight="on instruments"
        body="A secure portal where you watch your build progress, upload assets, message the team and see your previews — all in one place."
        actions={
          <>
            <Magnetic className="inline-block w-full sm:w-auto">
              <Button variant="premium" size="xl" asChild className="group w-full sm:w-auto">
                <Link to="/get-started">
                  Get started
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
            <Link to="/customer-login" className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground sm:justify-start">
              <span className="link-underline">Existing client login</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </>
        }
        aside={
          <PageHeroFacts
            facts={[
              { value: "2FA", label: "On every account" },
              { value: "256-bit", label: "Encryption" },
              { value: "24/7", label: "Portal access" },
            ]}
          />
        }
      />

      {/* Platform capabilities */}
      <section className="section-padding">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">The platform</span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
              Four instruments,
              <span className="block text-primary">one panel.</span>
            </h2>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 sm:grid-cols-2 xl:grid-cols-4">
            {platformCapabilities.map((cap, i) => (
              <CapabilityCell key={cap.title} index={i} {...cap} />
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* What clients see */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Inside your account</span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
              What you see
              <span className="block text-primary">when you log in.</span>
            </h2>
          </Reveal>

          <Matrix cols={3}>
            {clientFeatures.map((feature, i) => (
              <MatrixCell key={feature.title} icon={feature.icon} index={i} title={feature.title}>
                {feature.description}
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* Security strip */}
      <div className="border-y border-border/60">
        <div className="container-tight">
          <RevealGroup className="grid grid-cols-2 lg:grid-cols-4">
            {securityFeatures.map((item, i) => (
              <RevealItem
                key={item.title}
                className={`flex items-start gap-3.5 border-border/60 px-2 py-6 sm:px-4 ${i > 0 ? "lg:border-l" : ""} ${i % 2 === 1 ? "border-l lg:border-l" : ""}`}
              >
                <item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium tracking-tight">{item.title}</p>
                  <p className="mt-0.5 text-xs font-light text-muted-foreground">{item.description}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </div>

      {/* How the team runs it */}
      <section className="section-padding">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Behind the counter</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                How your project
                <span className="block text-primary">is run.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                The same platform powers our side of the work — organised, audited and private.
              </p>
            </div>
          </Reveal>

          <Matrix cols={4}>
            {teamFeatures.map((feature, i) => (
              <MatrixCell key={feature.title} icon={feature.icon} index={i} title={feature.title}>
                {feature.description}
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* Benefits */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Why it matters</span>
            </div>
            <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
              What the portal
              <span className="block text-primary">buys you.</span>
            </h2>
          </Reveal>

          <Matrix cols={4}>
            {benefits.map((benefit, i) => (
              <MatrixCell key={benefit.title} icon={benefit.icon} index={i} title={benefit.title}>
                {benefit.description}
              </MatrixCell>
            ))}
          </Matrix>
        </div>
      </section>

      {/* Update pricing */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="mb-10">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-8 bg-primary" />
              <span className="eyebrow">Transparent pricing</span>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Website update
                <span className="block text-primary">options.</span>
              </h2>
              <p className="max-w-sm text-sm font-light text-muted-foreground">
                Occasional changes or ongoing support — both priced to the work, in writing.
              </p>
            </div>
          </Reveal>

          <RevealGroup className="grid grid-cols-1 border-l border-t border-border/60 md:grid-cols-2">
            <RevealItem className="group relative overflow-hidden border-b border-r border-border/60 p-7 transition-colors duration-500 hover:bg-foreground/[0.02] sm:p-8">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 motion-reduce:transition-none"
              />
              <div className="mb-6 flex items-center justify-between">
                <Wrench className="h-5 w-5 text-primary" strokeWidth={1.5} />
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">01</span>
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight">Per-Edit Pricing</h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                Perfect for occasional updates when you don&rsquo;t need ongoing support.
              </p>
              <div className="mt-5 border-t border-border/60">
                {perEdit.map((row) => (
                  <div key={row.name} className="flex items-baseline justify-between gap-6 border-b border-border/40 py-3 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium">{row.name}</p>
                      <p className="text-xs font-light text-muted-foreground">{row.note}</p>
                    </div>
                    <span className="mono-label text-primary">Quoted</span>
                  </div>
                ))}
              </div>
              <ul className="mt-5 space-y-2">
                {["Pay only when you need changes", "No monthly commitment", "Quick turnaround on requests"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-light text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
                    {item}
                  </li>
                ))}
              </ul>
            </RevealItem>

            <RevealItem className="group relative overflow-hidden border-b border-r border-border/60 p-7 transition-colors duration-500 hover:bg-foreground/[0.02] sm:p-8">
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-primary" />
              <div className="mb-6 flex items-center justify-between">
                <Calendar className="h-5 w-5 text-primary" strokeWidth={1.5} />
                <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-primary">
                  Best value
                </span>
              </div>
              <h3 className="font-display text-xl font-semibold tracking-tight">Monthly Management</h3>
              <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                Comprehensive website care with priority support and regular updates.
              </p>
              <div className="mt-5 border-t border-border/60">
                {monthly.map((row) => (
                  <div key={row.name} className="flex items-baseline justify-between gap-6 border-b border-border/40 py-3 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium">{row.name}</p>
                      <p className="text-xs font-light text-muted-foreground">{row.note}</p>
                    </div>
                    <span className="mono-label text-primary">Quoted</span>
                  </div>
                ))}
              </div>
              <ul className="mt-5 space-y-2">
                {["Priority support & faster turnaround", "Regular security & performance checks", "Discounted rates on additional work"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-light text-muted-foreground">
                    <Check className="h-3.5 w-3.5 text-primary" strokeWidth={2.2} />
                    {item}
                  </li>
                ))}
              </ul>
            </RevealItem>
          </RevealGroup>

          <Reveal className="mt-8">
            <Link to="/get-started" className="link-underline text-sm text-muted-foreground transition-colors hover:text-foreground">
              Not sure which fits? Discuss your requirements
            </Link>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Access &amp; security</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Portal
                <span className="block text-primary">questions.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                Everything you need to know about portal access and security.
              </p>
            </Reveal>
            <Reveal className="lg:col-span-8">
              <Accordion type="single" collapsible className="border-t border-border/60">
                {faqs.map((item, index) => (
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
                        {item.q}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pl-8 text-sm font-light leading-relaxed text-muted-foreground">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                See your project
                <span className="block text-primary">the way we do.</span>
              </h2>
              <p className="mt-4 max-w-md text-[15px] font-light leading-relaxed text-muted-foreground">
                A premium, secure, and transparent website development experience — from enquiry
                to launch.
              </p>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Get started
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Link to="/customer-login" className="link-underline self-center text-sm text-muted-foreground transition-colors hover:text-foreground">
                Existing client login
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
