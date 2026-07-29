import { Layout } from "@/components/layout/Layout";
import { PageHero } from "@/components/marketing/PageHero";
import { motion } from "framer-motion";
import { Shield, Lock, Eye, Trash2, Mail, Clock } from "lucide-react";

const sections = [
  {
    icon: Eye,
    title: "Data Collection Disclosure",
    content: `We collect the following personal data to provide our services:
    
• **Names**: To personalise communication and identify you as a client
• **Email Addresses**: For project updates, invoices, and essential communications  
• **Phone Numbers**: For urgent project matters and consultation calls
• **IP Addresses**: For security monitoring and preventing fraudulent access
• **Company Information**: Business name, address, and VAT number for invoicing
• **Project Requirements**: Details you provide through our enquiry forms

All data collected through our forms is encrypted using AES-256 encryption at rest and transmitted securely via TLS 1.3.`
  },
  {
    icon: Shield,
    title: "Lawful Basis for Processing",
    content: `We process your personal data based on the following lawful bases under UK GDPR:

• **Contractual Necessity**: Processing required to fulfil our service agreement with you
• **Legitimate Interest**: For business development, improving our services, and fraud prevention
• **Consent**: Where you've explicitly opted-in for marketing communications
• **Legal Obligation**: To comply with tax, accounting, and legal requirements

You may withdraw consent at any time by contacting our Data Protection Officer.`
  },
  {
    icon: Lock,
    title: "Your Rights Under UK GDPR",
    content: `You have the following rights regarding your personal data:

**Right to Access**
Request a copy of all personal data we hold about you. We will respond within 30 days.

**Right to Erasure (Right to be Forgotten)**
Request deletion of your personal data. We will comply unless we have a legal obligation to retain it.

**Right to Object**
Object to processing based on legitimate interest. We will cease processing unless we have compelling legitimate grounds.

**Right to Rectification**
Request correction of inaccurate personal data we hold about you.

**Right to Data Portability**
Receive your data in a structured, machine-readable format.`
  },
  {
    icon: Clock,
    title: "Data Retention Policy",
    content: `We retain personal data only as long as necessary:

• **Active Client Data**: Retained for the duration of our business relationship
• **Enquiry Form Data**: 12 months after last activity if no project proceeds
• **Project Files & Assets**: 24 months after project completion
• **Financial Records**: 7 years as required by UK tax law
• **Marketing Preferences**: Until consent is withdrawn

After these periods, data is securely deleted using industry-standard methods.`
  },
  {
    icon: Trash2,
    title: "Data Deletion Requests",
    content: `To request deletion of your personal data:

1. Email our Data Protection Officer at Support@quooro.com
2. Include your full name and email address used with us
3. Specify what data you wish to have deleted
4. We will process your request within 30 days

Note: Some data may be retained where we have a legal obligation to do so.`
  },
  {
    icon: Mail,
    title: "Contact Our Data Protection Officer",
    content: `For any privacy-related queries or to exercise your rights:

**Data Protection Officer**
Quooro Ltd
Email: Support@quooro.com

**Registered Office**
[Your Registered Address]
Company Registration: [Your Company Number]
ICO Registration: [Your ICO Number]

We aim to respond to all privacy requests within 30 days.`
  }
];

export default function PrivacyPolicy() {
  return (
    <Layout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <PageHero
          eyebrow="Legal"
          index="51"
          crumbs={[{ label: "Home", href: "/" }, { label: "Privacy policy" }]}
          title="Privacy"
          highlight="policy"
          body="What we collect, why, and how it is protected."
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
                Quooro Ltd ("we", "our", "us") is committed to protecting your privacy and ensuring the security of your personal data. This Privacy Policy explains how we collect, use, store, and protect your information in compliance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
              </p>
              <div className="mt-6 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-sm text-foreground">
                  <strong>Data Security Notice:</strong> All data submitted through our website forms is encrypted using AES-256 encryption and transmitted via secure TLS 1.3 connections. Your information is fully protected at all times.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Policy Sections */}
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
                  className="border border-border/60 bg-background p-6 rounded-2xl"
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
      </div>
    </Layout>
  );
}
