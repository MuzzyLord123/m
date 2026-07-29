import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PageHero, PageHeroFacts } from "@/components/marketing/PageHero";
import { PreviewStrip, PreviewRail } from "@/components/marketing/PreviewSeries";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * Preview funnel 05 — sixteen questions in four numbered chapters, set as
 * hairline accordions in the ledger voice (the Support page treatment).
 */

const faqCategories = [
  {
    title: "About Free Previews",
    questions: [
      {
        q: "What exactly is included in a free preview?",
        a: "A free preview is a fully functional, custom-coded website matching your requirements. For sites under 5 pages (Starter and Business tiers), we build a complete preview including responsive design, contact forms, and your branding - all at no cost."
      },
      {
        q: "Is the free preview really completely free?",
        a: "Yes, 100% free with no hidden costs. There's no credit card required, no obligation to purchase. If you don't like the preview, you simply walk away."
      },
      {
        q: "Why do you offer free previews?",
        a: "We're confident in our quality. Free previews demonstrate our capabilities and build trust — when you can see exactly what you're getting, the decision makes itself."
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
        a: "Fast-Track previews are delivered in 3-5 days for Growth tier and 5-7 days for Enterprise tier, compared to the standard 1-week timeline."
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
      <PageHero
        eyebrow="The preview funnel"
        index="46"
        crumbs={[{ label: "Home", href: "/" }, { label: "Preview FAQ" }]}
        title="Preview"
        highlight="questions"
        body="Everything people ask about the free preview, answered straight."
        aside={
          <PageHeroFacts
            facts={[
              { value: "20", label: "Questions answered" },
              { value: "05", label: "Chapters" },
              { value: "£0", label: "To find out yourself" },
            ]}
          />
        }
      />

      <PreviewStrip current="05" />

      {/* FAQ chapters */}
      <section className="section-padding">
        <div className="container-tight">
          <div className="space-y-0">
            {faqCategories.map((category, cIndex) => (
              <Reveal
                key={category.title}
                className="grid gap-8 border-t border-border/60 py-12 first:border-t-0 first:pt-0 sm:py-14 lg:grid-cols-12 lg:gap-16"
              >
                <div className="lg:col-span-4">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="font-mono text-[11px] tabular-nums text-primary">
                      {String(cIndex + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px w-8 bg-primary" />
                  </div>
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] sm:text-3xl">
                    {category.title}
                  </h2>
                </div>
                <div className="lg:col-span-8">
                  <Accordion type="single" collapsible className="border-t border-border/60">
                    {category.questions.map((item, qIndex) => (
                      <AccordionItem
                        key={item.q}
                        value={`${cIndex}-${qIndex}`}
                        className="border-b border-border/60"
                      >
                        <AccordionTrigger className="gap-6 py-5 text-left font-display font-medium tracking-tight text-foreground hover:text-primary hover:no-underline">
                          <span className="flex items-baseline gap-4">
                            <span className="font-mono text-[11px] tabular-nums text-primary">
                              {String(qIndex + 1).padStart(2, "0")}
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
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="section-padding border-t border-border/60">
        <div className="container-tight">
          <Reveal className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-5 flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-primary" strokeWidth={1.5} />
                <span className="eyebrow">Still curious?</span>
              </div>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.03em] sm:text-4xl">
                The fastest answer is
                <span className="block text-primary">a preview of your own.</span>
              </h2>
            </div>
            <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
                <Button variant="premium" size="xl" asChild className="group">
                  <Link to="/get-started">
                    Request a preview
                    <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </Magnetic>
              <Link to="/support" className="link-underline self-center text-sm text-muted-foreground transition-colors hover:text-foreground">
                Ask us directly
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <PreviewRail current="05" />
    </Layout>
  );
}
