import { motion } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HOME_WHY_DEFAULTS, type HomeWhyContent } from "@/lib/siteContentSchemas";
import { EditableField } from "@/components/marketing/EditableField";
import { getIcon } from "@/lib/marketingIcons";

const NARDO_ACCENT = "from-zinc-500 to-zinc-700";



const comparisonRows = [
  { feature: "Custom design & development", quooro: true, freelancer: "Sometimes", agency: true },
  { feature: "Client operations dashboard", quooro: true, freelancer: false, agency: false },
  { feature: "Ongoing management included", quooro: true, freelancer: false, agency: "Extra cost" },
  { feature: "Full code ownership", quooro: true, freelancer: true, agency: "Varies" },
  { feature: "Enterprise security (2FA, RBAC)", quooro: true, freelancer: false, agency: "Sometimes" },
  { feature: "25+ built-in business tools", quooro: true, freelancer: false, agency: false },
  { feature: "Free preview before commitment", quooro: true, freelancer: false, agency: false },
];

function CellValue({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-4 h-4 text-emerald-500 mx-auto" />;
  if (value === false) return <X className="w-4 h-4 text-muted-foreground/30 mx-auto" />;
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

export function WhyQuooroSection() {
  const { data } = useSiteContent<HomeWhyContent>("home_why", HOME_WHY_DEFAULTS);
  const differentiators = data.differentiators.map(d => ({ ...d, accent: NARDO_ACCENT }));

  return (
    <section className="section-padding relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 30%, hsl(var(--primary) / 0.04) 0%, transparent 70%)',
      }} />

      <div className="container-tight relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="text-primary text-xs sm:text-sm font-semibold tracking-wider uppercase mb-3 block">
            <EditableField sectionKey="home_why" field="eyebrow" value={data.eyebrow} label="Eyebrow">{data.eyebrow}</EditableField>
          </span>
          <h2 className="heading-lg mb-4">
            <EditableField sectionKey="home_why" field="title" value={data.title} label="Title">{data.title}</EditableField>{" "}
            <span className="text-gradient"><EditableField sectionKey="home_why" field="titleHighlight" value={data.titleHighlight} label="Title highlight">{data.titleHighlight}</EditableField></span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            <EditableField sectionKey="home_why" field="subtitle" value={data.subtitle} label="Subtitle" kind="textarea">{data.subtitle}</EditableField>
          </p>
        </motion.div>

        {/* Differentiator cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16 sm:mb-20">
          {differentiators.map((item, index) => {
            const Icon = getIcon(item.icon);
            return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6 }}
              className="p-5 sm:p-6 rounded-2xl liquid-glass-card h-full relative overflow-hidden group"
            >
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.accent} opacity-50 group-hover:opacity-100 transition-opacity`} />
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display font-bold text-base sm:text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </motion.div>
            );
          })}

        </div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h3 className="text-center font-display font-bold text-lg sm:text-xl mb-6 sm:mb-8">
            How We <span className="text-gradient">Compare</span>
          </h3>

          <div className="overflow-x-auto">
            <div className="min-w-[600px] rounded-2xl overflow-hidden" style={{
              border: '1px solid hsl(var(--border) / 0.3)',
            }}>
              {/* Header row */}
              <div className="grid grid-cols-4 gap-0" style={{ backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
                <div className="p-3 sm:p-4 text-xs sm:text-sm font-semibold text-muted-foreground">Feature</div>
                <div className="p-3 sm:p-4 text-center">
                  <span className="text-xs sm:text-sm font-bold text-primary">Quooro</span>
                </div>
                <div className="p-3 sm:p-4 text-center">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Freelancer</span>
                </div>
                <div className="p-3 sm:p-4 text-center">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Trad. Agency</span>
                </div>
              </div>

              {/* Data rows */}
              {comparisonRows.map((row, i) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-4 gap-0 transition-colors"
                  style={{
                    borderTop: '1px solid hsl(var(--border) / 0.15)',
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'hsl(var(--muted) / 0.1)',
                  }}
                >
                  <div className="p-3 sm:p-4 text-xs sm:text-sm text-muted-foreground">{row.feature}</div>
                  <div className="p-3 sm:p-4 text-center flex items-center justify-center">
                    <CellValue value={row.quooro} />
                  </div>
                  <div className="p-3 sm:p-4 text-center flex items-center justify-center">
                    <CellValue value={row.freelancer} />
                  </div>
                  <div className="p-3 sm:p-4 text-center flex items-center justify-center">
                    <CellValue value={row.agency} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-10 sm:mt-12"
        >
          <Button variant="hero" size="xl" asChild className="w-full sm:w-auto group">
            <Link to="/get-started">
              Get Started Free <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
