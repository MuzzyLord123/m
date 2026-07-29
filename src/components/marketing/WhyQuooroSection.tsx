import { Check, Minus, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HOME_WHY_DEFAULTS, type HomeWhyContent } from "@/lib/siteContentSchemas";
import { EditableField } from "@/components/marketing/EditableField";
import { getIcon } from "@/lib/marketingIcons";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/motion/Magnetic";

/**
 * The differentiators and the comparison, rebuilt as a spec sheet.
 *
 * Was four rounded glass cards over a striped, rounded, centred table. Zebra
 * striping plus rounded corners plus a centred heading is the default table of
 * every generated marketing page. A spec sheet — flush hairlines, mono column
 * headers, tabular alignment, no fill — reads as something written by people who
 * expect it to be checked.
 */

const comparisonRows = [
  { feature: "Custom design & development", quooro: true, freelancer: "Sometimes", agency: true },
  { feature: "Client operations dashboard", quooro: true, freelancer: false, agency: false },
  { feature: "Ongoing management included", quooro: true, freelancer: false, agency: "Extra cost" },
  { feature: "Full code ownership", quooro: true, freelancer: true, agency: "Varies" },
  { feature: "Enterprise security (2FA, RBAC)", quooro: true, freelancer: false, agency: "Sometimes" },
  { feature: "25+ built-in business tools", quooro: true, freelancer: false, agency: false },
  { feature: "Free preview before commitment", quooro: true, freelancer: false, agency: false },
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
    <span className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
      <Minus className="h-3 w-3 text-muted-foreground/50" aria-hidden />
      {value}
    </span>
  );
}

export function WhyQuooroSection() {
  const { data } = useSiteContent<HomeWhyContent>("home_why", HOME_WHY_DEFAULTS);

  return (
    <section className="section-padding relative border-t border-border/60">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 45% at 80% 20%, hsl(var(--primary) / 0.05), transparent 70%)",
        }}
      />

      <div className="container-tight relative z-10">
        <SectionHeading
          className="mb-14 sm:mb-20"
          eyebrow={
            <EditableField sectionKey="home_why" field="eyebrow" value={data.eyebrow} label="Eyebrow">
              {data.eyebrow}
            </EditableField>
          }
          title={
            <span className="block">
              <EditableField sectionKey="home_why" field="title" value={data.title} label="Title">
                {data.title}
              </EditableField>{" "}
              <span className="text-gradient">
                <EditableField sectionKey="home_why" field="titleHighlight" value={data.titleHighlight} label="Title highlight">
                  {data.titleHighlight}
                </EditableField>
              </span>
            </span>
          }
          body={
            <EditableField sectionKey="home_why" field="subtitle" value={data.subtitle} label="Subtitle" kind="textarea">
              {data.subtitle}
            </EditableField>
          }
        />

        {/* Differentiators — a bordered matrix, not four floating cards. */}
        <RevealGroup className="mb-16 grid grid-cols-1 border-l border-t border-border/60 sm:grid-cols-2 lg:grid-cols-4 sm:mb-24">
          {data.differentiators.map((item, i) => {
            const Icon = getIcon(item.icon);
            return (
              <RevealItem
                key={item.title}
                className="group relative overflow-hidden border-b border-r border-border/60 p-7 transition-colors duration-500 hover:bg-foreground/[0.02] sm:p-8"
              >
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-primary transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 motion-reduce:transition-none"
                />
                <div className="mb-7 flex items-center justify-between">
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold tracking-tight sm:text-lg">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm font-light leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </RevealItem>
            );
          })}
        </RevealGroup>

        {/* Comparison — a spec sheet. */}
        <Reveal>
          <div className="mb-6 flex items-baseline justify-between gap-6">
            <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              How we compare
            </h3>
            <span className="mono-label hidden sm:block">Like for like</span>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <thead>
                <tr className="border-y border-border">
                  <th scope="col" className="py-4 pr-4 mono-label font-medium">
                    Capability
                  </th>
                  <th scope="col" className="w-[18%] px-2 py-4 text-center">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                      Quooro
                    </span>
                  </th>
                  <th scope="col" className="w-[18%] px-2 py-4 text-center mono-label font-medium">
                    Freelancer
                  </th>
                  <th scope="col" className="w-[22%] px-2 py-4 text-center mono-label font-medium">
                    Trad. agency
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr
                    key={row.feature}
                    className="border-b border-border/60 transition-colors duration-300 hover:bg-foreground/[0.02]"
                  >
                    <th scope="row" className="py-4 pr-4 text-sm font-normal text-foreground/85">
                      {row.feature}
                    </th>
                    <td className="px-2 py-4 text-center">
                      <CellValue value={row.quooro} emphasis />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <CellValue value={row.freelancer} />
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

        <Reveal className="mt-12">
          <Magnetic className="inline-block">
            <Button variant="premium" size="xl" asChild className="group w-full sm:w-auto">
              <Link to="/get-started">
                Get started free
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </Magnetic>
        </Reveal>
      </div>
    </section>
  );
}
