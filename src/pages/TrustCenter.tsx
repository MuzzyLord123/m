import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Shield, Lock, Key, AlertTriangle, Server, CheckCircle2, Mail, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { z } from "zod";

const securityMeasures = [
  {
    icon: Lock,
    title: "Encryption",
    description: "Industry-standard encryption protects your data at all times",
    details: [
      "Data encrypted at rest using AES-256 encryption",
      "All data transmitted via TLS 1.3 protocol",
      "End-to-end encryption for sensitive communications",
      "Secure key management with regular rotation"
    ]
  },
  {
    icon: Shield,
    title: "HSTS Enforced",
    description: "HTTP Strict Transport Security prevents attacks",
    details: [
      "HSTS headers enforced on all pages",
      "Prevents man-in-the-middle attacks",
      "Automatic HTTPS redirection",
      "HSTS preload list submission"
    ]
  },
  {
    icon: Key,
    title: "Access Control",
    description: "Strict authentication for all administrative access",
    details: [
      "Multi-Factor Authentication (MFA) mandatory for all admin access",
      "Role-based access control (RBAC)",
      "Regular access reviews and audits",
      "Automatic session timeout policies"
    ]
  },
  {
    icon: AlertTriangle,
    title: "Incident Response",
    description: "Rapid response protocol for security events",
    details: [
      "72-hour breach notification protocol",
      "Dedicated incident response team",
      "Regular incident response drills",
      "Transparent communication policy"
    ]
  }
];

const subProcessors = [
  { name: "Netlify", purpose: "Hosting & Infrastructure", location: "Global" },
  { name: "Supabase", purpose: "Database & Authentication", location: "EU/US" },
  { name: "Stripe", purpose: "Payment Processing", location: "US (PCI-DSS Compliant)" },
  { name: "Cloudflare", purpose: "CDN & DDoS Protection", location: "Global" },
  { name: "Google Analytics", purpose: "Website Analytics (with consent)", location: "US" },
];

const certifications = [
  "UK GDPR Compliant",
  "ICO Registered",
  "PCI-DSS Compliant (via Stripe)",
  "SOC 2 Infrastructure",
];

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(255, "Email must be less than 255 characters"),
  company: z.string().trim().max(100, "Company name must be less than 100 characters").optional(),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message must be less than 2000 characters"),
});

export default function TrustCenter() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const validated = contactSchema.parse(formData);
      
      // Simulate form submission (in production, this would go to an API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      toast.success("Your security enquiry has been submitted. We'll respond within 48 hours.");
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast.error("Failed to submit. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative py-24 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl pointer-events-none" />
          <div className="container-tight relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass-pill text-primary mb-6">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Enterprise-Grade Security</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6">
                Trust Center
              </h1>
              <p className="text-xl text-muted-foreground">
                Your security is our priority. Learn about the technical safeguards we use to protect your data in 2026.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Security Overview */}
        <section className="py-12 border-b border-border">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {certifications.map((cert, index) => (
                  <motion.div
                    key={cert}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">{cert}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Security Measures */}
        <section className="py-16">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                Technical Safeguards
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We implement comprehensive security measures to protect your data and maintain your trust.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {securityMeasures.map((measure, index) => (
                <motion.div
                  key={measure.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors duration-300"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <measure.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-semibold text-foreground">
                        {measure.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{measure.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {measure.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Sub-Processors */}
        <section className="py-16 bg-secondary/30">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-4xl mx-auto"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Server className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-semibold text-foreground">
                  Trusted Sub-Processors
                </h2>
              </div>
              
              <p className="text-muted-foreground mb-6">
                We work with carefully vetted third-party providers who meet our strict security standards. Each sub-processor has been assessed for security, privacy, and compliance.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-4 px-4 font-medium text-foreground">Provider</th>
                      <th className="text-left py-4 px-4 font-medium text-foreground">Purpose</th>
                      <th className="text-left py-4 px-4 font-medium text-foreground">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subProcessors.map((processor) => (
                      <tr key={processor.name} className="border-b border-border/50 last:border-0">
                        <td className="py-4 px-4 font-medium text-foreground">{processor.name}</td>
                        <td className="py-4 px-4 text-muted-foreground">{processor.purpose}</td>
                        <td className="py-4 px-4 text-muted-foreground">{processor.location}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Data Protection Notice */}
        <section className="py-16">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20">
                <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                  Form Data Security
                </h2>
                <p className="text-muted-foreground mb-4">
                  All data submitted through our enquiry forms and contact forms is:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>Encrypted in transit using TLS 1.3</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>Encrypted at rest using AES-256</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>Stored on secure, UK GDPR-compliant servers</span>
                  </li>
                  <li className="flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>Accessible only to authorised personnel with MFA</span>
                  </li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  For more information about how we handle your data, please read our{" "}
                  <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Security Contact Form */}
        <section className="py-16 border-t border-border" id="security-contact">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-10">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                  <h2 className="text-3xl font-display font-bold text-foreground">
                    Security Enquiries
                  </h2>
                </div>
                <p className="text-muted-foreground">
                  Have questions about our security practices? Need documentation for your security review? Contact our team.
                </p>
              </div>

              {submitted ? (
                <div className="glass-card p-12 text-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-4">
                    Enquiry Submitted!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Thank you for your security enquiry. Our team will respond within 48 business hours.
                  </p>
                  <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", company: "", subject: "", message: "" }); }}>
                    Submit Another Enquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Your Name *
                      </label>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Smith"
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Email Address *
                      </label>
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@company.com"
                        className={errors.email ? "border-destructive" : ""}
                      />
                      {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Company (Optional)
                    </label>
                    <Input
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      placeholder="Your Company Ltd"
                      className={errors.company ? "border-destructive" : ""}
                    />
                    {errors.company && <p className="text-sm text-destructive mt-1">{errors.company}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Subject *
                    </label>
                    <Input
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="e.g., Security Documentation Request"
                      className={errors.subject ? "border-destructive" : ""}
                    />
                    {errors.subject && <p className="text-sm text-destructive mt-1">{errors.subject}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Message *
                    </label>
                    <Textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Describe your security enquiry or documentation needs..."
                      rows={5}
                      className={errors.message ? "border-destructive" : ""}
                    />
                    {errors.message && <p className="text-sm text-destructive mt-1">{errors.message}</p>}
                  </div>

                  <Button type="submit" variant="premium" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Security Enquiry
                      </>
                    )}
                  </Button>

                  <p className="text-sm text-muted-foreground text-center">
                    For urgent security matters, email us directly at{" "}
                    <a href="mailto:security@quooro.com" className="text-primary hover:underline">
                      security@quooro.com
                    </a>
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
