import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, HelpCircle, MessageSquare } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    title: "About Free Previews",
    questions: [
      {
        q: "What exactly is included in a free preview?",
        a: "A free preview is a fully functional, custom-coded website matching your requirements. For sites under 5 pages (Starter and Growth tiers), we build a complete preview including responsive design, contact forms, and your branding - all at no cost."
      },
      {
        q: "Is the free preview really completely free?",
        a: "Yes, 100% free with no hidden costs. There's no credit card required, no obligation to purchase. If you don't like the preview, you simply walk away."
      },
      {
        q: "Why do you offer free previews?",
        a: "We're confident in our quality. Free previews demonstrate our capabilities and build trust. 94% of our preview clients convert to purchases because they can see exactly what they're getting."
      },
      {
        q: "How long does a free preview take?",
        a: "Free previews for sites under 5 pages are delivered within 1 week. You'll receive daily updates throughout the development process."
      }
    ]
  },
  {
    title: "About Fast-Track Previews",
    questions: [
      {
        q: "Why do larger sites require a preview fee?",
        a: "Complex sites (10+ pages) require 40+ hours of professional development. The preview fee ensures fair compensation for our team's time and demonstrates serious commitment from both parties."
      },
      {
        q: "Is the preview fee refundable?",
        a: "Preview fees are non-refundable as they compensate for completed development work. However, if you proceed with the purchase, the full preview fee is credited toward your final invoice."
      },
      {
        q: "How fast is Fast-Track delivery?",
        a: "Fast-Track previews are delivered in 3-5 days for Professional tier and 5-7 days for Enterprise tier, compared to the standard 1-week timeline."
      },
      {
        q: "What's included in Fast-Track that isn't in free previews?",
        a: "Fast-Track previews include: priority queue, senior developer assignment, more revision rounds, complex functionality demonstrations, and daily progress updates. The accelerated timeline ensures you can make decisions faster."
      }
    ]
  },
  {
    title: "Preview vs Final Site",
    questions: [
      {
        q: "Is the preview site the same as the final site?",
        a: "The preview is a fully functional representation of your final site. After approval, we finalize it with your feedback, add any remaining content, perform final testing, and deploy to your hosting."
      },
      {
        q: "Can I make changes after seeing the preview?",
        a: "Yes! Free previews include 1 round of minor revisions. Paid Fast-Track previews include 2 rounds. Major scope changes beyond original requirements may incur additional costs."
      },
      {
        q: "Who owns the preview code?",
        a: "Until purchase, the preview code is our intellectual property. Upon purchase, you receive 100% ownership of all code, designs, and assets with no ongoing fees or licenses."
      },
      {
        q: "What if I want to use a different company after seeing the preview?",
        a: "For free previews, there's no obligation. For paid previews, the fee covers our development time and is non-refundable. You may not use our preview code or designs without purchasing."
      }
    ]
  },
  {
    title: "Timeline & Revisions",
    questions: [
      {
        q: "What counts as a 'revision'?",
        a: "A revision round includes: color/font adjustments, minor layout tweaks, text corrections, and image swaps. Major structural changes or new features are considered scope changes, not revisions."
      },
      {
        q: "How many revision rounds do I get?",
        a: "Free previews: 1 round of minor revisions. Fast-Track previews: 2 rounds. Additional revision rounds can be purchased if needed."
      },
      {
        q: "What if I miss the feedback deadline?",
        a: "We hold your preview for 14 days awaiting feedback. After 14 days, we'll reach out. After 30 days of no response, the project is archived (but can be reactivated)."
      },
      {
        q: "Can I speed up my free preview to Fast-Track?",
        a: "Yes! If you initially qualify for a free preview but want faster delivery, you can upgrade to Fast-Track by paying the relevant preview fee."
      }
    ]
  },
  {
    title: "After the Preview",
    questions: [
      {
        q: "How long is my preview available to view?",
        a: "Your preview link remains active for 30 days. If you need more time to make a decision, let us know and we can extend this."
      },
      {
        q: "Can I share the preview with others?",
        a: "Absolutely! We encourage you to share with stakeholders, partners, or anyone whose opinion matters. The more confident you are, the better."
      },
      {
        q: "What happens after I approve the preview?",
        a: "We'll finalize the site with any feedback, add remaining content, perform comprehensive testing, set up hosting, and provide training materials. Typical finalization takes 1-2 weeks."
      },
      {
        q: "Do you offer ongoing support after the site goes live?",
        a: "Yes! All tiers include initial support. We also offer monthly maintenance packages for ongoing updates, security patches, and content changes."
      }
    ]
  }
];

export default function PreviewFAQ() {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding pt-32">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px] mb-6">
              <HelpCircle className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Preview FAQ</span>
            </div>
            <div className="mb-6 flex items-center gap-3"><span className="h-px w-8 bg-primary" /></div>
            <h1 className="heading-xl mb-6">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p className="body-lg">
              Everything you need to know about our preview process, pricing, timelines, and what to expect.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Sections */}
      <section className="section-padding pt-8">
        <div className="container-tight">
          <div className="max-w-4xl mx-auto space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <h2 className="heading-sm mb-6 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {categoryIndex + 1}
                  </span>
                  {category.title}
                </h2>
                <Accordion type="single" collapsible className="space-y-4">
                  {category.questions.map((item, index) => (
                    <AccordionItem
                      key={index}
                      value={`${categoryIndex}-${index}`}
                      className="border border-border rounded-xl px-6 bg-card"
                    >
                      <AccordionTrigger className="text-left hover:no-underline py-4">
                        <span className="font-medium pr-4">{item.q}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4 text-muted-foreground">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Have Questions */}
      <section className="section-padding bg-card">
        <div className="container-tight">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 md:p-12 rounded-3xl border border-primary/30 bg-gradient-card text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            <h2 className="heading-md mb-4">
              Still Have <span className="text-gradient">Questions?</span>
            </h2>
            <p className="body-lg max-w-2xl mx-auto mb-8">
              We're here to help. Reach out and we'll get back to you within 24 hours.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="premium" size="xl" asChild>
                <Link to="/get-started">
                  Contact Us <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="glass" size="xl" asChild>
                <Link to="/preview-process">View Process</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-tight text-center">
          <h2 className="heading-md mb-6">
            Ready to Get <span className="text-gradient">Started?</span>
          </h2>
          <p className="body-lg max-w-2xl mx-auto mb-8">
            Now that you know how it works, start your preview journey today.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button variant="premium" size="xl" asChild>
              <Link to="/get-started">
                Get Your Free Preview <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="glass" size="xl" asChild>
              <Link to="/preview-pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
