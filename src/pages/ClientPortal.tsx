import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Upload, 
  MessageSquare, 
  Eye, 
  Shield, 
  Lock, 
  Users, 
  FileText,
  Bell,
  Clock,
  CheckCircle2,
  Sparkles,
  Laptop,
  Building2,
  PoundSterling,
  Calendar,
  Wrench,
  Check,
  Layers,
  Database,
  Settings,
  BarChart3,
  Globe,
  Key
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { Button } from "@/components/ui/button";
import { ScrollSection, StaggeredScrollSection, ScrollItem } from "@/components/ScrollSection";

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
    items: ["Live preview links", "Status tracking", "SSL monitoring", "Domain management"]
  },
  {
    icon: Layers,
    title: "App & Dashboard Projects",
    description: "Track custom application development from concept to launch with milestone visibility.",
    items: ["Project milestones", "Feature tracking", "Preview & production URLs", "Development notes"]
  },
  {
    icon: BarChart3,
    title: "Marketing Hub",
    description: "Unified view of all marketing activities across social media, ads, and content.",
    items: ["Ad campaign tracking", "Social media scheduling", "Content calendar", "SEO insights"]
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Invite team members with role-based access to manage different aspects of your account.",
    items: ["Role-based permissions", "Team invitations", "Activity tracking", "Secure access"]
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

export default function ClientPortal() {
  return (
    <Layout>
      {/* Hero Section */}
      <PageHero
        eyebrow="Platform"
        index="05"
        crumbs={[{ label: "Home", href: "/" }, { label: "Client portal" }]}
        title="Your business."
        highlight="One dashboard."
        body="Every client gets a private operations dashboard — where the work, files, data and conversation live."
        actions={
          <>
            <Button variant="premium" size="xl" asChild className="group w-full sm:w-auto">
              <Link to="/get-started">
                Get started
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
            <Link to="/packages" className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground sm:justify-start">
              <span className="link-underline">View packages</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </>
        }
      />

      {/* Platform Capabilities - New Section */}
      <section className="section-padding">
        <div className="container-tight">
          <ScrollSection direction="up" className="mb-16">
            <span className="text-primary text-sm font-semibold tracking-wider uppercase mb-4 block">
              Platform Capabilities
            </span>
            <h2 className="heading-lg mb-4">
              Everything Your Business <span className="text-gradient">Needs</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto">
              A unified hub that replaces scattered emails, file shares, and endless back-and-forth with structured, secure operations.
            </p>
          </ScrollSection>

          <div className="grid md:grid-cols-2 gap-0 border-l border-t border-border/60">
            {platformCapabilities.map((capability, index) => (
              <ScrollSection key={capability.title} direction={index % 2 === 0 ? "left" : "right"}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="p-8 border-b border-r border-border/60 h-full"
                >
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center shrink-0">
                      <capability.icon className="w-7 h-7 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-xl mb-2">{capability.title}</h3>
                      <p className="text-muted-foreground text-sm">{capability.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {capability.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </ScrollSection>
            ))}
          </div>
        </div>
      </section>

      {/* Security First Section */}
      <section className="section-padding liquid-glass">
        <div className="container-tight">
          <ScrollSection direction="up" className="mb-16">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Enterprise Security</span>
            </div>
            <h2 className="heading-lg mb-4">
              Built for <span className="text-gradient">Security</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto">
              Unlike traditional agency workflows with scattered emails and shared links, 
              the Quooro platform enforces security at every level.
            </p>
          </ScrollSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-border/60 mb-12">
            {securityFeatures.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="p-6 border-b border-r border-border/60"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 mx-auto">
                  <feature.icon className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>

          <ScrollSection direction="up" delay={0.2}>
            <div className="p-8 rounded-2xl liquid-glass-subtle max-w-3xl mx-auto text-center">
              <h3 className="font-semibold mb-4">Why This Matters</h3>
              <p className="text-muted-foreground mb-6">
                Many agencies share preview links via email, expose development work publicly, 
                and communicate through scattered channels. This creates security risks and inefficiencies.
              </p>
              <p className="text-muted-foreground">
                Quooro's platform ensures your development process, business data, and communications 
                remain private and protected — the way enterprise systems should work.
              </p>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Client Portal Features */}
      <section className="section-padding">
        <div className="container-tight">
          <ScrollSection direction="up" className="mb-16">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">For Clients</span>
            </div>
            <h2 className="heading-lg mb-4">
              Your Digital <span className="text-gradient">Command Centre</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto">
              Everything you need to collaborate with our team, track projects, and manage your digital presence in one secure location.
            </p>
          </ScrollSection>

          <StaggeredScrollSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-border/60">
            {clientFeatures.map((feature) => (
              <ScrollItem key={feature.title}>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group p-6 border-b border-r border-border/60 h-full"
                >
                  <div className="mb-5 flex h-10 w-10 items-center justify-center border border-primary bg-primary transition-transform duration-500 group-hover:scale-110">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </motion.div>
              </ScrollItem>
            ))}
          </StaggeredScrollSection>
        </div>
      </section>

      {/* Team Dashboard Section */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <ScrollSection direction="left">
              <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Internal Operations</span>
              </div>
              <h2 className="heading-lg mb-4">
                Professional Team <span className="text-gradient">Dashboard</span>
              </h2>
              <p className="body-lg mb-6">
                Our internal team dashboard enables controlled account management, secure messaging, 
                and structured handling of enquiries, previews, and live websites.
              </p>
              <p className="body-md text-muted-foreground mb-8">
                Live previews are shared exclusively through the portal, ensuring a professional, 
                secure, and premium experience without the need for public links or email sharing.
              </p>
              <div className="space-y-4">
                {teamFeatures.map((feature, index) => (
                  <motion.div 
                    key={feature.title}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-xl liquid-glass-subtle"
                  >
                    <div className="w-10 h-10 rounded-lg border border-border/60 flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollSection>

            <ScrollSection direction="right">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-radial from-primary/10 via-transparent to-transparent rounded-3xl" />
                <div className="p-8 border border-border/60 bg-background border border-primary/20">
                  <div className="space-y-6">
                    {/* Mock Dashboard Preview */}
                    <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                      <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                        <Lock className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Secure Portal</p>
                        <p className="text-xs text-muted-foreground">End-to-end encryption</p>
                      </div>
                      <div className="ml-auto">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg liquid-glass-subtle">
                        <span className="text-sm">Active Projects</span>
                        <span className="text-sm font-bold text-primary">24</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg liquid-glass-subtle">
                        <span className="text-sm">Pending Reviews</span>
                        <span className="text-sm font-bold text-primary">8</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg liquid-glass-subtle">
                        <span className="text-sm">Messages Today</span>
                        <span className="text-sm font-bold text-primary">156</span>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg liquid-glass-subtle">
                        <span className="text-sm">Files Uploaded</span>
                        <span className="text-sm font-bold text-primary">2.4k</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border/50 text-center">
                      <p className="text-xs text-muted-foreground">Real-time sync across all devices</p>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="section-padding liquid-glass">
        <div className="container-tight">
          <ScrollSection direction="up" className="mb-16">
            <h2 className="heading-lg mb-4">
              Why This <span className="text-gradient">Matters</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto">
              This system allows us to deliver a higher level of service, faster turnaround times, 
              and complete visibility for our clients.
            </p>
          </ScrollSection>

          <StaggeredScrollSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-l border-t border-border/60">
            {benefits.map((benefit) => (
              <ScrollItem key={benefit.title}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02, transition: { duration: 0.3 } }}
                  className="p-6 border-b border-r border-border/60 h-full"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 mx-auto">
                    <benefit.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground text-sm">{benefit.description}</p>
                </motion.div>
              </ScrollItem>
            ))}
          </StaggeredScrollSection>
        </div>
      </section>

      {/* Pricing Breakdown Section */}
      <section className="section-padding">
        <div className="container-tight">
          <ScrollSection direction="up" className="mb-16">
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
              <PoundSterling className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Transparent Pricing</span>
            </div>
            <h2 className="heading-lg mb-4">
              Website Update <span className="text-gradient">Options</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto">
              Choose the update model that works best for your business. Whether you need occasional changes or ongoing support, we've got you covered.
            </p>
          </ScrollSection>

          <div className="grid md:grid-cols-2 gap-0 border-l border-t border-border/60 max-w-4xl mx-auto">
            {/* Per-Edit Pricing */}
            <ScrollSection direction="left">
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="p-8 border-b border-r border-border/60 h-full"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                  <Wrench className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-2xl mb-2">Per-Edit Pricing</h3>
                <p className="text-muted-foreground mb-6">
                  Perfect for occasional updates when you don't need ongoing support.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="p-4 rounded-xl liquid-glass-subtle">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Minor Text Changes</span>
                      <span className="font-bold text-primary">Custom Quote</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Typo fixes, small content updates</p>
                  </div>
                  <div className="p-4 rounded-xl liquid-glass-subtle">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Content Updates</span>
                      <span className="font-bold text-primary">Custom Quote</span>
                    </div>
                    <p className="text-xs text-muted-foreground">New sections, image swaps, layout tweaks</p>
                  </div>
                  <div className="p-4 rounded-xl liquid-glass-subtle">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Feature Additions</span>
                      <span className="font-bold text-primary">Custom Quote</span>
                    </div>
                    <p className="text-xs text-muted-foreground">New pages, forms, integrations</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Pay only when you need changes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>No monthly commitment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Quick turnaround on requests</span>
                  </div>
                </div>
              </motion.div>
            </ScrollSection>

            {/* Monthly Management */}
            <ScrollSection direction="right">
              <motion.div
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="p-8 border border-primary/30 bg-background h-full relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                  Best Value
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                  <Calendar className="w-7 h-7 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-2xl mb-2">Monthly Management</h3>
                <p className="text-muted-foreground mb-6">
                  Comprehensive website care with priority support and regular updates.
                </p>
                
                <div className="space-y-4 mb-8">
                  <div className="p-4 rounded-xl liquid-glass-subtle">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Essential Care</span>
                      <span className="font-bold text-primary">Custom Quote</span>
                    </div>
                    <p className="text-xs text-muted-foreground">2 content updates, security monitoring</p>
                  </div>
                  <div className="p-4 rounded-xl liquid-glass-subtle border border-primary/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Growth Plan</span>
                      <span className="font-bold text-primary">Custom Quote</span>
                    </div>
                    <p className="text-xs text-muted-foreground">5 updates, priority support, analytics</p>
                  </div>
                  <div className="p-4 rounded-xl liquid-glass-subtle">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium">Premium Support</span>
                      <span className="font-bold text-primary">Custom Quote</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Unlimited updates, same-day response</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Priority support & faster turnaround</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Regular security & performance checks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" />
                    <span>Discounted rates on additional work</span>
                  </div>
                </div>
              </motion.div>
            </ScrollSection>
          </div>

          <ScrollSection direction="up" delay={0.3} className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              Not sure which option is right for you? Let's chat about your needs.
            </p>
            <Button variant="outline" size="lg" asChild>
              <Link to="/get-started">
                Discuss Your Requirements <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </ScrollSection>
        </div>
      </section>

      {/* Security Assurance */}
      <section className="section-padding">
        <div className="container-tight">
          <ScrollSection direction="scale">
            <div className="p-8 md:p-12 border border-border/60 bg-background border border-primary/20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6 mx-auto">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="heading-md mb-4">
                Protecting Your <span className="text-gradient">Investment</span>
              </h2>
              <p className="body-lg max-w-3xl mx-auto mb-8">
                All data is encrypted, access is controlled, and your development work remains private. 
                We protect the integrity of your website and our development process at every step.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-subtle text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>256-bit Encryption</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-subtle text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Role-Based Access</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-subtle text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Secure File Storage</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-subtle text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Private Preview Links</span>
                </div>
              </div>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding liquid-glass">
        <div className="container-tight">
          <ScrollSection direction="up" className="mb-12">
            <h2 className="heading-lg mb-4">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto">
              Everything you need to know about portal access and security.
            </p>
          </ScrollSection>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
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
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="p-6 border border-border/60 bg-background"
              >
                <h3 className="font-display font-semibold text-lg mb-2">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-tight">
          <ScrollSection direction="up">
            <h2 className="heading-lg mb-4">
              Ready to Experience the <span className="text-gradient">Difference?</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto mb-8">
              Join our clients who enjoy a premium, secure, and transparent website development experience.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="premium" size="xl" asChild>
                <Link to="/get-started">
                  Get Started <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/customer-login">Existing Client Login</Link>
              </Button>
            </div>
          </ScrollSection>
        </div>
      </section>
    </Layout>
  );
}
