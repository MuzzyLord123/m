import { motion, useScroll, useTransform } from "framer-motion";
import * as Icons from "lucide-react";
import { Check } from "lucide-react";
import { useRef } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HOME_PROCESS_DEFAULTS, type HomeProcessContent } from "@/lib/siteContentSchemas";
import { EditableField } from "@/components/marketing/EditableField";

const NARDO_ACCENT = "from-zinc-500 to-zinc-700";

function getIcon(name: string) {
  const I = (Icons as any)[name];
  return I || Icons.Sparkles;
}


export function ProcessSection() {
  const { data } = useSiteContent<HomeProcessContent>("home_process", HOME_PROCESS_DEFAULTS);
  const processSteps = data.steps.map(s => ({ ...s, accent: NARDO_ACCENT }));
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.85], ["0%", "100%"]);

  return (
    <section ref={sectionRef} className="section-padding overflow-hidden relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 40% at 50% 50%, hsl(var(--primary) / 0.03) 0%, transparent 70%)',
      }} />

      <div className="container-tight relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 md:mb-20"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary text-xs sm:text-sm font-semibold tracking-wider uppercase mb-3 block"
          >
            <EditableField sectionKey="home_process" field="eyebrow" value={data.eyebrow} label="Eyebrow">{data.eyebrow}</EditableField>
          </motion.span>
          <h2 className="heading-lg mb-3 sm:mb-4">
            <EditableField sectionKey="home_process" field="title" value={data.title} label="Title">{data.title}</EditableField>{" "}
            <span className="text-gradient"><EditableField sectionKey="home_process" field="titleHighlight" value={data.titleHighlight} label="Title highlight">{data.titleHighlight}</EditableField></span>
          </h2>
          <p className="body-lg max-w-2xl mx-auto">
            <EditableField sectionKey="home_process" field="subtitle" value={data.subtitle} label="Subtitle" kind="textarea">{data.subtitle}</EditableField>
          </p>
        </motion.div>

        {/* Process Steps with animated timeline */}
        <div className="relative">
          {/* Animated vertical line — desktop only */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2">
            <div className="w-full h-full bg-border/20" />
            <motion.div
              className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary via-primary to-primary/30"
              style={{ height: lineHeight }}
            />
          </div>

          <div className="space-y-6 sm:space-y-8 lg:space-y-0">
            {processSteps.map((step, index) => { const StepIcon = getIcon(step.icon); return (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.7,
                  delay: 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className={`relative lg:grid lg:grid-cols-2 lg:gap-12 xl:gap-20 ${
                  index % 2 === 0 ? "" : "lg:direction-rtl"
                }`}
              >
                {/* Timeline node — desktop */}
                <div className="hidden lg:flex absolute left-1/2 top-8 -translate-x-1/2 z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center text-white font-bold shadow-xl`}
                    style={{
                      boxShadow: `0 8px 32px hsl(var(--primary) / 0.2), 0 0 0 4px hsl(var(--background))`,
                    }}
                  >
                    <span className="text-lg font-display">{step.step}</span>
                  </motion.div>
                </div>

                {/* Content card */}
                <div
                  className={`lg:py-8 ${
                    index % 2 === 0 ? "lg:pr-12 xl:pr-20 lg:text-right" : "lg:col-start-2 lg:pl-12 xl:pl-20 lg:text-left"
                  }`}
                  style={{ direction: "ltr" }}
                >
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="liquid-glass-card p-5 sm:p-6 lg:p-8 rounded-2xl border border-border/50 hover:border-primary/20 transition-all duration-500 group relative overflow-hidden"
                  >
                    {/* Gradient accent bar */}
                    <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${step.accent} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

                    {/* Hover glow */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.accent} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none`} />

                    {/* Mobile step number */}
                    <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4 lg:hidden">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.accent} flex items-center justify-center text-white font-bold text-sm shadow-lg`}>
                        {step.step}
                      </div>
                      <h3 className="font-display font-bold text-lg sm:text-xl">{step.title}</h3>
                    </div>

                    {/* Desktop header */}
                    <div className={`hidden lg:flex items-center gap-4 mb-5 ${
                      index % 2 === 0 ? "justify-end" : "justify-start"
                    }`}>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.accent} bg-opacity-10 flex items-center justify-center text-primary ${
                        index % 2 === 0 ? "order-2" : ""
                      }`}
                        style={{ backgroundColor: 'hsl(var(--primary) / 0.08)' }}
                      >
                        <StepIcon className="w-6 h-6" />
                      </div>
                      <h3 className="font-display font-bold text-xl xl:text-2xl">{step.title}</h3>
                    </div>

                    <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Details — pill tags */}
                    <div className={`flex flex-wrap gap-2 ${
                      index % 2 === 0 ? "lg:justify-end" : "lg:justify-start"
                    }`}>
                      {step.details.map((detail) => (
                        <span
                          key={detail}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors duration-300"
                          style={{
                            backgroundColor: 'hsl(var(--muted) / 0.5)',
                            border: '1px solid hsl(var(--border) / 0.3)',
                          }}
                        >
                          <Check className="w-3 h-3 text-primary flex-shrink-0" />
                          <span className="text-muted-foreground">{detail}</span>
                        </span>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Empty column for alternating layout */}
                {index % 2 === 0 ? <div className="hidden lg:block" /> : null}
              </motion.div>
            );})}
          </div>

          {/* Terminal node */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: "spring" }}
            className="hidden lg:flex justify-center mt-8"
          >
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg"
              style={{ boxShadow: '0 0 20px hsl(var(--primary) / 0.3)' }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
