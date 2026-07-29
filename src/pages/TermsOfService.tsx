import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { motion } from "framer-motion";
import { FileText, CreditCard, Shield, AlertCircle, Scale, Clock } from "lucide-react";

const sections = [
  {
    icon: FileText,
    title: "1. Service Agreement",
    content: `**1.1 Acceptance of Terms**
By engaging Quooro Ltd ("we", "us", "our") for web development or digital marketing services, you ("the Client") agree to be bound by these Terms of Service.

**1.2 Service Description**
We provide custom website design and development, digital marketing services, and related consulting. Each project is governed by a specific proposal or statement of work that forms part of this agreement.

**1.3 Project Scope**
The scope of work is defined in your project proposal. Any changes to scope may result in additional fees and timeline adjustments, which will be communicated in writing before implementation.

**1.4 Client Responsibilities**
The Client agrees to:
• Provide all necessary content, branding materials, and feedback in a timely manner
• Designate a single point of contact for project communications
• Review and approve deliverables within the agreed timeframes
• Ensure they have rights to all materials provided to us`
  },
  {
    icon: CreditCard,
    title: "2. Payment Terms",
    content: `**2.1 Pricing**
All prices are quoted in GBP and are exclusive of VAT unless otherwise stated. VAT will be added at the prevailing rate where applicable. Pricing is customised for each project based on scope and requirements.

**2.2 Payment Schedule**
• **Starter Package**: Payment schedule agreed upon project acceptance
• **Growth Package**: Staged payments as agreed in proposal
• **Professional Package**: Milestone-based payments as per proposal
• **Enterprise & Custom Elite**: Payment schedule as per individual proposal

**2.3 Payment Methods**
We accept bank transfer (BACS), credit/debit cards via Stripe, and PayPal. Payment instructions are included on all invoices.

**2.4 Late Payment**
Invoices are due within 14 days of issue. Late payments may incur:
• Interest at 8% above the Bank of England base rate
• Suspension of work until payment is received
• Statutory late payment compensation

**2.5 Refunds**
Our preview-first model means you see your site before payment. Deposits are non-refundable once design work has commenced, except where we fail to deliver as agreed.`
  },
  {
    icon: Shield,
    title: "3. Intellectual Property",
    content: `**3.1 Ownership Transfer**
Upon full payment, you receive complete ownership of:
• All custom code written specifically for your project
• Design files and assets created for your project
• Content created by us on your behalf

**3.2 Retained Rights**
We retain the right to:
• Use general techniques, skills, and knowledge gained during the project
• Showcase completed work in our portfolio (unless agreed otherwise in writing)
• Use third-party libraries and frameworks under their respective licences

**3.3 Client Materials**
You warrant that all materials you provide (logos, images, text) are either owned by you or you have the necessary rights/licences to use them.

**3.4 Third-Party Components**
Your website may include third-party software, fonts, or images. These remain subject to their original licences, which we will provide documentation for.`
  },
  {
    icon: AlertCircle,
    title: "4. Liability Limitations",
    content: `**4.1 Service Warranty**
We warrant that all work will be performed with reasonable skill and care in accordance with industry standards.

**4.2 Limitation of Liability**
To the maximum extent permitted by law:
• Our total liability is limited to the fees paid for the specific service
• We are not liable for indirect, consequential, or incidental damages
• We are not liable for loss of profits, data, or business opportunities

**4.3 Exclusions**
We are not liable for:
• Delays caused by late provision of client materials or feedback
• Issues arising from third-party services or hosting providers
• Security breaches resulting from client actions or negligence
• Business losses due to website downtime

**4.4 Force Majeure**
Neither party shall be liable for delays or failures in performance resulting from circumstances beyond reasonable control, including natural disasters, war, or pandemic.`
  },
  {
    icon: Scale,
    title: "5. Dispute Resolution",
    content: `**5.1 Governing Law**
These Terms are governed by the laws of England and Wales.

**5.2 Informal Resolution**
Both parties agree to attempt to resolve any disputes through good-faith negotiation before pursuing formal proceedings.

**5.3 Mediation**
If negotiation fails, disputes may be referred to mediation through a mutually agreed mediator before court proceedings.

**5.4 Jurisdiction**
The courts of England and Wales shall have exclusive jurisdiction over any disputes arising from these Terms.

**5.5 Severability**
If any provision of these Terms is found unenforceable, the remaining provisions shall continue in full force and effect.`
  },
  {
    icon: Clock,
    title: "6. Project Delivery & Termination",
    content: `**6.1 Delivery Timelines**
Estimated delivery dates are provided in good faith but are subject to:
• Timely provision of client materials and feedback
• Scope remaining unchanged
• Availability of third-party services

**6.2 Delays**
If the project is delayed due to client actions (e.g., late feedback), we may adjust the timeline and, for delays exceeding 30 days, charge a resumption fee.

**6.3 Client Termination**
You may terminate at any time, but:
• Deposits are non-refundable
• Payment is due for all work completed to date
• We will provide all completed work files

**6.4 Our Right to Terminate**
We may terminate if:
• Payment is not received within 30 days of the due date
• The Client breaches any material term of this agreement
• The Client engages in abusive or unreasonable behaviour

**6.5 Post-Termination**
Upon termination, both parties shall return any confidential information and materials belonging to the other party.`
  }
];

export default function TermsOfService() {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <PageHero
          eyebrow="Legal"
          index="53"
          crumbs={[{ label: "Home", href: "/" }, { label: "Terms of service" }]}
          title="Terms of"
          highlight="service"
          body="The agreement that governs projects and platform use."
        />

        {/* Introduction */}
        <section className="py-12 border-b border-border">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-3xl mx-auto"
            >
              <p className="text-lg text-muted-foreground leading-relaxed">
                These Terms of Service ("Terms") govern your use of services provided by Quooro Ltd, a company registered in England and Wales. Please read these Terms carefully before engaging our services. By proceeding with a project, you acknowledge that you have read, understood, and agree to be bound by these Terms.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Terms Sections */}
        <section className="py-16">
          <div className="container-tight">
            <div className="max-w-3xl mx-auto space-y-12">
              {sections.map((section, index) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-border/60 bg-background p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center border border-primary/25 bg-primary/[0.06]">
                      <section.icon className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-2xl font-display font-semibold text-foreground">
                      {section.title}
                    </h2>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16 bg-secondary/30">
          <div className="container-tight">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl"
            >
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                Questions About Our Terms?
              </h2>
              <p className="text-muted-foreground mb-2">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <p className="text-muted-foreground">
                Email:{" "}
                <a href="mailto:legal@quooro.com" className="text-primary hover:underline">
                  legal@quooro.com
                </a>
              </p>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
