import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  MessageCircle,
  Phone,
  Clock,
  Calendar,
  Bot,
  CheckCircle,
  Shield,
  Lock,
  Cookie,
  FileText
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell } from "@/components/marketing/Matrix";
import { Reveal } from "@/components/motion/Reveal";

const faqs = [
  {
    question: "How long does it take to build my website?",
    answer: "Timelines vary by package: Starter sites are delivered in 48 hours, Growth sites in 1-2 weeks, Professional sites in 3-4 weeks, Enterprise projects in 2-3 months, and Custom Elite projects have variable timelines based on scope."
  },
  {
    question: "What's included in the free preview?",
    answer: "Every client receives a fully functional preview of their website before any payment is required. You'll see exactly what your site will look like and how it functions. If you're not 100% satisfied, you don't pay a penny."
  },
  {
    question: "Do I own my website after it's built?",
    answer: "Absolutely! Once your project is complete and paid for, you own 100% of your website including all code, design assets, and content. We provide full source files and can transfer hosting to your preferred provider."
  },
  {
    question: "What payment options do you offer?",
    answer: "We offer flexible payment options including one-time payments and installment plans for larger projects. Professional and Enterprise packages can be split into 2-3 payments. Contact us to discuss your preferred arrangement."
  },
  {
    question: "Can I make changes after my website is live?",
    answer: "Yes! We offer ongoing support and maintenance packages. Minor text and image updates are often included free of charge for the first month. For larger changes, we offer competitive hourly rates or retainer packages."
  },
  {
    question: "Do you offer social media management?",
    answer: "Yes, we offer comprehensive social media management as an add-on service. We have packages for every budget, from basic management to full-service management including content creation, community engagement, and analytics. Contact us for a custom quote."
  },
  {
    question: "What if I'm not happy with the design?",
    answer: "We offer unlimited revisions during the design phase until you're completely satisfied. Our preview-first approach means you see exactly what you're getting before any payment. If we can't meet your expectations, you pay nothing."
  },
  {
    question: "Do you provide hosting?",
    answer: "We can set up hosting for you on reliable platforms and manage it as part of our maintenance packages, or we can deploy to your existing hosting. First year hosting is often included in Professional and Enterprise packages."
  }
];

const policyItems = [
  {
    value: "privacy-policy",
    icon: Lock,
    title: "Privacy Policy",
    body: "Our Privacy Policy explains how we collect, use, store, and protect your personal data in compliance with UK GDPR and the Data Protection Act 2018.",
    points: [
      "Data collection disclosure and lawful basis",
      "Your rights: Access, Erasure, and Object",
      "Data retention policy and deletion requests",
    ],
    href: "/privacy-policy",
    linkLabel: "Read Full Privacy Policy",
  },
  {
    value: "cookie-policy",
    icon: Cookie,
    title: "Cookie Policy",
    body: "Our Cookie Policy explains what cookies we use, why we use them, and how you can manage your preferences.",
    points: [
      "Essential, Analytics, and Marketing cookies explained",
      "Accept All or Reject All with equal ease",
      "Manage preferences at any time",
    ],
    href: "/cookie-policy",
    linkLabel: "Read Full Cookie Policy",
  },
  {
    value: "trust-center",
    icon: Shield,
    title: "Trust Center",
    body: "Our Trust Center details the technical safeguards we use to protect your data, including encryption, access controls, and incident response.",
    points: [
      "AES-256 encryption at rest, TLS 1.3 in transit",
      "Multi-Factor Authentication for all admin access",
      "72-hour breach notification protocol",
    ],
    href: "/trust-center",
    linkLabel: "Visit Trust Center",
  },
  {
    value: "terms-of-service",
    icon: FileText,
    title: "Terms of Service",
    body: "Our Terms of Service outline the agreement between you and Echelon Sites Ltd when using our services.",
    points: [
      "Service agreements and project scope",
      "Payment terms and refund policy",
      "Intellectual property and liability",
    ],
    href: "/terms-of-service",
    linkLabel: "Read Terms of Service",
  },
];

export default function Support() {
  const [callbackForm, setCallbackForm] = useState({
    name: "",
    phone: "",
    email: "",
    preferredTime: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("enquiries").insert({
        name: callbackForm.name,
        email: callbackForm.email,
        phone: callbackForm.phone,
        notes: `Callback Request - Preferred Time: ${callbackForm.preferredTime}. Message: ${callbackForm.message}`,
        interest: "callback",
        status: "new"
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Callback request submitted! We'll contact you within 24 hours.");
    } catch (error) {
      toast.error("Failed to submit request. Please try again or call us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openChatbot = () => {
    // Trigger the chatbot to open
    const event = new CustomEvent('openChatbot');
    window.dispatchEvent(event);
  };

  return (
    <Layout>
      <PageHero
        eyebrow="Customer support"
        index="09"
        crumbs={[{ label: "Home", href: "/" }, { label: "Support" }]}
        title="How can we"
        highlight="help?"
        body="Get answers instantly with our AI assistant, browse the FAQ, or speak directly with our team."
        aside={
          <PageHeroFacts
            facts={[
              { value: "24/7", label: "AI assistant" },
              { value: "5–9PM", label: "Phone, daily" },
              { value: "24h", label: "Callback window" },
            ]}
          />
        }
      />

      {/* Three routes to a human (or near-human) */}
      <section className="section-padding">
        <div className="container-tight">
          <Matrix cols={3}>
            <MatrixCell icon={Bot} index={0} title="AI customer support">
              Chat with our dedicated AI assistant for instant answers about pricing, services,
              timelines, and more. Available 24/7.
              <div className="mt-6">
                <Button variant="premium" onClick={openChatbot} className="w-full">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Chat now
                </Button>
              </div>
            </MatrixCell>
            <MatrixCell icon={Phone} index={1} title="Call us directly">
              Speak to a real person for complex questions or to discuss your project in detail.
              <span className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Available 5PM – 9PM daily
              </span>
              <div className="mt-6">
                <Button variant="outline" className="w-full" asChild>
                  <a href="tel:07739346789">
                    <Phone className="mr-2 h-4 w-4" />
                    07739 346789
                  </a>
                </Button>
              </div>
            </MatrixCell>
            <MatrixCell icon={Calendar} index={2} title="Request a callback">
              Can&rsquo;t reach us? Book a callback and an agent will contact you within 24 hours.
              <div className="mt-6">
                <Button variant="outline" className="w-full" asChild>
                  <a href="#callback-form">
                    <Calendar className="mr-2 h-4 w-4" />
                    Book callback
                  </a>
                </Button>
              </div>
            </MatrixCell>
          </Matrix>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Straight answers</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Frequently asked
                <span className="block text-primary">questions.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                Quick answers to common questions.
              </p>
              <div className="mt-8 border-t border-border/60 pt-6">
                <p className="mb-4 text-sm font-light text-muted-foreground">
                  Can&rsquo;t find what you&rsquo;re looking for?
                </p>
                <Button variant="outline" onClick={openChatbot}>
                  <Bot className="mr-2 h-4 w-4" />
                  Ask our AI assistant
                </Button>
              </div>
            </Reveal>

            <Reveal className="lg:col-span-8">
              <Accordion type="single" collapsible className="border-t border-border/60">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-b border-border/60"
                  >
                    <AccordionTrigger className="gap-6 py-5 text-left font-display font-medium tracking-tight text-foreground hover:text-primary hover:no-underline">
                      <span className="flex items-baseline gap-4">
                        <span className="font-mono text-[11px] tabular-nums text-primary">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pl-8 text-sm font-light leading-relaxed text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Security & data protection */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal className="lg:col-span-4">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">On the record</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                Security &amp; data
                <span className="block text-primary">protection.</span>
              </h2>
              <p className="mt-6 max-w-sm text-[15px] font-light leading-relaxed text-muted-foreground">
                How we protect your data and comply with UK GDPR.
              </p>
            </Reveal>

            <Reveal className="lg:col-span-8">
              <Accordion type="single" collapsible className="border-t border-border/60">
                {policyItems.map((item) => (
                  <AccordionItem
                    key={item.value}
                    value={item.value}
                    className="border-b border-border/60"
                  >
                    <AccordionTrigger className="gap-6 py-5 text-left font-display font-medium tracking-tight text-foreground hover:text-primary hover:no-underline">
                      <span className="flex items-center gap-4">
                        <item.icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
                        {item.title}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="pl-8 text-sm font-light leading-relaxed text-muted-foreground">
                      <p className="mb-4">{item.body}</p>
                      <ul className="mb-4 space-y-2">
                        {item.points.map((point) => (
                          <li key={point} className="flex items-center gap-2.5">
                            <CheckCircle className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
                            {point}
                          </li>
                        ))}
                      </ul>
                      <Link
                        to={item.href}
                        className="link-underline inline-flex items-center gap-2 text-sm font-medium text-primary"
                      >
                        {item.linkLabel} →
                      </Link>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Callback form — conversion zone, kept calm */}
      <section id="callback-form" className="section-padding scroll-mt-28 border-t border-border/60">
        <div className="container-tight">
          <Reveal className="max-w-2xl">
            <div className="mb-10">
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-8 bg-primary" />
                <span className="eyebrow">Request a callback</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                We&rsquo;ll call you.
              </h2>
              <p className="mt-4 text-[15px] font-light leading-relaxed text-muted-foreground">
                Fill out the form below and an agent will contact you within 24 hours.
              </p>
            </div>

            {submitted ? (
              <div className="relative overflow-hidden border border-border/60 bg-background p-12">
                <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-primary" />
                <div className="mb-6 flex h-14 w-14 items-center justify-center border border-[hsl(var(--success))]/40 bg-[hsl(var(--success))]/10">
                  <CheckCircle className="h-7 w-7 text-[hsl(var(--success))]" strokeWidth={2} />
                </div>
                <h3 className="mb-3 font-display text-2xl font-semibold tracking-tight text-foreground">
                  Callback requested
                </h3>
                <p className="mb-6 text-sm font-light leading-relaxed text-muted-foreground">
                  Thank you for reaching out. One of our team members will call you within 24 hours.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCallbackSubmit} className="space-y-6 border border-border/60 bg-background p-8">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Your Name *
                    </label>
                    <Input
                      required
                      value={callbackForm.name}
                      onChange={(e) => setCallbackForm({ ...callbackForm, name: e.target.value })}
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number *
                    </label>
                    <Input
                      required
                      type="tel"
                      value={callbackForm.phone}
                      onChange={(e) => setCallbackForm({ ...callbackForm, phone: e.target.value })}
                      placeholder="07xxx xxxxxx"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address *
                  </label>
                  <Input
                    required
                    type="email"
                    value={callbackForm.email}
                    onChange={(e) => setCallbackForm({ ...callbackForm, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Preferred Callback Time
                  </label>
                  <Input
                    value={callbackForm.preferredTime}
                    onChange={(e) => setCallbackForm({ ...callbackForm, preferredTime: e.target.value })}
                    placeholder="e.g., Weekdays 5PM-7PM"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    How can we help? (Optional)
                  </label>
                  <Textarea
                    value={callbackForm.message}
                    onChange={(e) => setCallbackForm({ ...callbackForm, message: e.target.value })}
                    placeholder="Tell us briefly what you'd like to discuss..."
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  variant="premium"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Request Callback"}
                </Button>

                <p className="text-sm text-muted-foreground">
                  Need immediate help? Call us at{" "}
                  <a href="tel:07739346789" className="text-primary hover:underline">
                    07739 346789
                  </a>{" "}
                  (5PM - 9PM)
                </p>
              </form>
            )}
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
