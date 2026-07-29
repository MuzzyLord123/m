import { Link } from "react-router-dom";
import { Check, Minus, X, Zap, Clock, Shield, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/marketing/PageHero";
import { Matrix, MatrixCell } from "@/components/marketing/Matrix";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";

/**
 * Rebuilt on the system: PageHero opening, the spec-sheet table treatment from
 * the homepage (flush hairlines, mono column heads), and a bordered matrix for
 * the three differentiators.
 *
 * The old standfirst claimed "30% more affordable than typical agencies" — a
 * number nobody can check against anything. Replaced with the three claims
 * that ARE checkable in the table below it.
 */

const comparisons = [
  { feature: "Transparent Pricing", us: true, agency: false },
  { feature: "Delivery Time", us: "1-2 weeks", agency: "4-8 weeks" },
  { feature: "Code Ownership", us: true, agency: false },
  { feature: "Vendor Lock-in", us: false, agency: true },
  { feature: "Hidden Fees", us: false, agency: true },
  { feature: "Direct Communication", us: true, agency: false },
  { feature: "Post-Launch Support", us: "Included", agency: "Extra cost" },
];

function CellValue({ value, emphasis = false }: { value: boolean | string; emphasis?: boolean }) {
  if (value === true) {
    return (
      <Check
        className={emphasis ? "mx-auto h-4 w-4 text-primary" : "mx-auto h-4 w-4 text-foreground/70"}
        strokeWidth={2.4}
        aria-label="Yes"
      />
    );
  }
  if (value === false) {
    return <X className="mx-auto h-4 w-4 text-muted-foreground/40" strokeWidth={2} aria-label="No" />;
  }
  return (
    <span className={`flex items-center justify-center gap-1.5 text-xs ${emphasis ? "font-medium text-foreground" : "text-muted-foreground"}`}>
      {!emphasis && <Minus className="h-3 w-3 text-muted-foreground/50" aria-hidden />}
      {value}
    </span>
  );
}

export default function Comparison() {
  return (
    <Layout>
      <PageHero
        eyebrow="Like for like"
        index="07"
        crumbs={[{ label: "Home", href: "/" }, { label: "Why choose us" }]}
        title="Why choose"
        highlight="Quooro?"
        body="Clear pricing, faster delivery and complete ownership — claims a buyer can check line by line, not slogans."
      />

      <section className="section-padding">
        <div className="container-tight">
          <Reveal>
            <div className="mb-6 flex items-baseline justify-between gap-6">
              <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                Side by side
              </h2>
              <span className="mono-label hidden sm:block">Quooro vs. a typical agency</span>
            </div>

            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[520px] border-collapse text-left">
                <thead>
                  <tr className="border-y border-border">
                    <th scope="col" className="mono-label py-4 pr-4 font-medium">
                      Feature
                    </th>
                    <th scope="col" className="w-[22%] px-2 py-4 text-center">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                        Quooro
                      </span>
                    </th>
                    <th scope="col" className="mono-label w-[26%] px-2 py-4 text-center font-medium">
                      Typical agency
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-border/60 transition-colors duration-300 hover:bg-foreground/[0.02]"
                    >
                      <th scope="row" className="py-4 pr-4 text-sm font-normal text-foreground/85">
                        {row.feature}
                      </th>
                      <td className="px-2 py-4 text-center">
                        <CellValue value={row.us} emphasis />
                      </td>
                      <td className="px-2 py-4 text-center">
                        <CellValue value={row.agency} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <div className="mt-16 sm:mt-20">
            <Matrix cols={3}>
              {[
                { icon: Zap, title: "Priced to be checked", desc: "Every package has its number published. Compare us against any quote you're holding." },
                { icon: Clock, title: "Faster delivery", desc: "Starter sites in days, full projects in weeks — the timelines page shows exactly what to expect." },
                { icon: Shield, title: "Complete ownership", desc: "Your code, your design, your accounts. No strings attached, ever." },
              ].map((item, i) => (
                <MatrixCell key={item.title} icon={item.icon} index={i} title={item.title}>
                  {item.desc}
                </MatrixCell>
              ))}
            </Matrix>
          </div>

          <Reveal className="mt-14">
            <Magnetic className="inline-block">
              <Button variant="premium" size="xl" asChild className="group w-full sm:w-auto">
                <Link to="/get-started">
                  Get started today
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
            </Magnetic>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
}
