import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageCircle, 
  Phone, 
  Clock, 
  Calendar, 
  ChevronDown, 
  Bot,
  HelpCircle,
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
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-block px-4 py-2 rounded-full liquid-glass-pill text-primary text-sm font-medium mb-6"
            >
              Customer Support
            </motion.span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              How Can We <span className="text-gradient">Help You?</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get answers instantly with our AI assistant, browse FAQs, or speak directly with our team
            </p>
          </motion.div>

          {/* Support Options Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {/* AI Chatbot */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-8 text-center hover:shadow-premium hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-3">
                AI Customer Support
              </h3>
              <p className="text-muted-foreground mb-6">
                Chat with our dedicated AI assistant for instant answers about pricing, services, timelines, and more. Available 24/7.
              </p>
              <Button variant="premium" onClick={openChatbot} className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat Now
              </Button>
            </motion.div>

            {/* Phone Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-8 text-center hover:shadow-premium hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                <Phone className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-3">
                Call Us Directly
              </h3>
              <p className="text-muted-foreground mb-4">
                Speak to a real person for complex questions or to discuss your project in detail.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                <Clock className="w-4 h-4" />
                <span>Available 5PM - 9PM Daily</span>
              </div>
              <Button variant="outline" className="w-full" asChild>
                <a href="tel:07739346789">
                  <Phone className="w-4 h-4 mr-2" />
                  07739 346789
                </a>
              </Button>
            </motion.div>

            {/* Book Callback */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-8 text-center hover:shadow-premium hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground mb-3">
                Request a Callback
              </h3>
              <p className="text-muted-foreground mb-6">
                Can't reach us? Book a callback and an agent will contact you within 24 hours.
              </p>
              <Button variant="secondary" className="w-full" asChild>
                <a href="#callback-form">
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Callback
                </a>
              </Button>
            </motion.div>
          </div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-20"
          >
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <HelpCircle className="w-6 h-6 text-primary" />
                <h2 className="text-3xl font-display font-bold text-foreground">
                  Frequently Asked Questions
                </h2>
              </div>
              <p className="text-muted-foreground">
                Quick answers to common questions
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem 
                    key={index} 
                    value={`item-${index}`}
                    className="glass-card px-6 border-none"
                  >
                    <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for?
              </p>
              <Button variant="outline" onClick={openChatbot}>
                <Bot className="w-4 h-4 mr-2" />
                Ask Our AI Assistant
              </Button>
            </div>
          </motion.div>

          {/* Security & Data Protection Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-20"
          >
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="w-6 h-6 text-primary" />
                <h2 className="text-3xl font-display font-bold text-foreground">
                  Security & Data Protection
                </h2>
              </div>
              <p className="text-muted-foreground">
                Learn how we protect your data and comply with UK GDPR
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem 
                  value="privacy-policy"
                  className="glass-card px-6 border-none"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                    <div className="flex items-center gap-3">
                      <Lock className="w-5 h-5 text-primary" />
                      <span>Privacy Policy</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="mb-4">
                      Our Privacy Policy explains how we collect, use, store, and protect your personal data in compliance with UK GDPR and the Data Protection Act 2018.
                    </p>
                    <ul className="space-y-2 mb-4 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Data collection disclosure and lawful basis
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Your rights: Access, Erasure, and Object
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Data retention policy and deletion requests
                      </li>
                    </ul>
                    <Link 
                      to="/privacy-policy" 
                      className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                    >
                      Read Full Privacy Policy →
                    </Link>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="cookie-policy"
                  className="glass-card px-6 border-none"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                    <div className="flex items-center gap-3">
                      <Cookie className="w-5 h-5 text-primary" />
                      <span>Cookie Policy</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="mb-4">
                      Our Cookie Policy explains what cookies we use, why we use them, and how you can manage your preferences.
                    </p>
                    <ul className="space-y-2 mb-4 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Essential, Analytics, and Marketing cookies explained
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Accept All or Reject All with equal ease
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Manage preferences at any time
                      </li>
                    </ul>
                    <Link 
                      to="/cookie-policy" 
                      className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                    >
                      Read Full Cookie Policy →
                    </Link>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="trust-center"
                  className="glass-card px-6 border-none"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-primary" />
                      <span>Trust Center</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="mb-4">
                      Our Trust Center details the technical safeguards we use to protect your data, including encryption, access controls, and incident response.
                    </p>
                    <ul className="space-y-2 mb-4 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        AES-256 encryption at rest, TLS 1.3 in transit
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Multi-Factor Authentication for all admin access
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        72-hour breach notification protocol
                      </li>
                    </ul>
                    <Link 
                      to="/trust-center" 
                      className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                    >
                      Visit Trust Center →
                    </Link>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem 
                  value="terms-of-service"
                  className="glass-card px-6 border-none"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <span>Terms of Service</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    <p className="mb-4">
                      Our Terms of Service outline the agreement between you and Echelon Sites Ltd when using our services.
                    </p>
                    <ul className="space-y-2 mb-4 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Service agreements and project scope
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Payment terms and refund policy
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Intellectual property and liability
                      </li>
                    </ul>
                    <Link 
                      to="/terms-of-service" 
                      className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                    >
                      Read Terms of Service →
                    </Link>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </motion.div>

          {/* Callback Form Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            id="callback-form"
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-10">
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                Request a Callback
              </h2>
              <p className="text-muted-foreground">
                Fill out the form below and an agent will contact you within 24 hours
              </p>
            </div>

            {submitted ? (
              <div className="glass-card p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                  Callback Requested!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Thank you for reaching out. One of our team members will call you within 24 hours.
                </p>
                <Button variant="outline" onClick={() => setSubmitted(false)}>
                  Submit Another Request
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCallbackSubmit} className="glass-card p-8 space-y-6">
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

                <p className="text-sm text-muted-foreground text-center">
                  Need immediate help? Call us at{" "}
                  <a href="tel:07739346789" className="text-primary hover:underline">
                    07739 346789
                  </a>{" "}
                  (5PM - 9PM)
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
