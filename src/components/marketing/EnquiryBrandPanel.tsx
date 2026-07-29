import { Check } from "lucide-react";
import { LineDraw, DrawPath, DrawPoint } from "@/components/motion/LineDraw";

/**
 * The enquiry counterpart to the auth pages' brand panel — same material
 * (aurora, drafting grid, drawn arc, coords), but the centrepiece is a live
 * intake ledger: the five steps as an instrument, with completed steps
 * checked in ember and the current one lit. Purely presentational; the
 * wizard passes `step` down and nothing flows back.
 */
export function EnquiryBrandPanel({
  step,
  steps,
  submitted = false,
}: {
  step: number;
  steps: { title: string; subtitle: string }[];
  submitted?: boolean;
}) {
  return (
    <aside
      className="relative hidden overflow-hidden border-r border-border/60 lg:flex lg:h-screen lg:flex-col lg:justify-between lg:p-12 xl:p-14"
      aria-hidden
    >
      <div className="hero-aurora" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.028) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground) / 0.028) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 90% 80% at 40% 30%, black 8%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 40% 30%, black 8%, transparent 80%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-[16%] overflow-hidden">
        <LineDraw viewBox="0 0 900 420" className="h-auto w-full min-w-[640px]">
          <DrawPath d="M -30 330 Q 450 60 930 280" stroke="hsl(var(--foreground))" opacity={0.13} duration={1.6} />
          <DrawPath d="M 480 150 Q 650 96 840 176" stroke="hsl(var(--primary))" strokeWidth={1.3} opacity={0.85} at={0.7} duration={0.9} />
          <DrawPoint cx={480} cy={150} r={3} fill="hsl(var(--primary))" ring at={0.65} />
          <DrawPoint cx={840} cy={176} r={2.5} fill="hsl(var(--foreground))" at={1.5} />
        </LineDraw>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <span className="mono-label">52.13° N · 3.78° W</span>
        <span className="mono-label text-primary">Project enquiry</span>
      </div>

      <div className="relative z-10">
        <p className="font-display font-semibold uppercase leading-[0.95] tracking-[-0.03em] text-[clamp(2.2rem,3.6vw,3.6rem)]">
          {submitted ? (
            <>
              Received,
              <span className="block text-primary">in full.</span>
            </>
          ) : (
            <>
              Let&rsquo;s scope
              <span className="block text-primary">your build.</span>
            </>
          )}
        </p>

        {/* The intake ledger */}
        <ol className="mt-9 max-w-sm border-t border-border/60">
          {steps.map((s, i) => {
            const n = i + 1;
            const done = submitted || step > n;
            const active = !submitted && step === n;
            return (
              <li
                key={s.title}
                className={`flex items-center gap-4 border-b border-border/60 py-3.5 transition-opacity duration-500 ${
                  done || active ? "opacity-100" : "opacity-45"
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center border font-mono text-[10px] tabular-nums transition-colors duration-500 ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : active
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-3 w-3" strokeWidth={3} /> : String(n).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm font-medium tracking-tight ${
                      active ? "text-foreground" : done ? "text-foreground/80" : "text-muted-foreground"
                    }`}
                  >
                    {s.title}
                  </span>
                  {active && (
                    <span className="block font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
                      In progress
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="mt-7 max-w-sm text-sm font-light leading-relaxed text-muted-foreground">
          {submitted
            ? "Your enquiry is with the studio. We reply within 24 hours."
            : "Five short steps, saved as you go. A free preview of your actual site follows — you pay nothing until you approve it."}
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-border/60 pt-6">
        <span className="mono-label">EST. Wales · United Kingdom</span>
        <span className="mono-label">Free preview · No obligation</span>
      </div>
    </aside>
  );
}
