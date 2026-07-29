import { LineDraw, DrawPath, DrawPoint } from '@/components/motion/LineDraw';

/**
 * The left-hand brand panel shared by every auth surface (sign-in, sign-up).
 * Pure presentation — no auth logic lives here, which is what makes it safe to
 * share across files in the frozen auth directory. Hidden below lg; the form
 * column is the whole page on phones.
 */
export function AuthBrandPanel({
  headline = ['One secure', 'platform.'],
  body = 'Your websites, projects, files and billing. Signed in once, in one place, encrypted at rest.',
}: {
  headline?: [string, string];
  body?: string;
}) {
  return (
    <aside
      className="relative hidden overflow-hidden border-r border-border/60 lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
      aria-hidden
    >
      <div className="hero-aurora" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground) / 0.028) 1px, transparent 1px),
                            linear-gradient(90deg, hsl(var(--foreground) / 0.028) 1px, transparent 1px)`,
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 90% 80% at 40% 30%, black 8%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 40% 30%, black 8%, transparent 80%)',
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-1/4 overflow-hidden">
        <LineDraw viewBox="0 0 900 420" className="h-auto w-full min-w-[640px]">
          <DrawPath d="M -30 330 Q 450 60 930 280" stroke="hsl(var(--foreground))" opacity={0.13} duration={1.6} />
          <DrawPath d="M -30 400 Q 450 210 930 370" stroke="hsl(var(--foreground))" opacity={0.08} dashed at={0.3} />
          <DrawPath d="M 480 150 Q 650 96 840 176" stroke="hsl(var(--primary))" strokeWidth={1.3} opacity={0.85} at={0.7} duration={0.9} />
          <DrawPoint cx={480} cy={150} r={3} fill="hsl(var(--primary))" ring at={0.65} />
          <DrawPoint cx={840} cy={176} r={2.5} fill="hsl(var(--foreground))" at={1.5} />
        </LineDraw>
      </div>

      <div className="relative z-10 flex items-center justify-between">
        <span className="mono-label">52.13° N · 3.78° W</span>
        <span className="mono-label text-primary">The studio</span>
      </div>

      <div className="relative z-10">
        <p className="font-display font-semibold uppercase leading-[0.95] tracking-[-0.03em] text-[clamp(2.6rem,4.2vw,4.2rem)]">
          {headline[0]}
          <span className="block text-primary">{headline[1]}</span>
        </p>
        <p className="mt-6 max-w-sm text-sm font-light leading-relaxed text-muted-foreground">{body}</p>
      </div>

      <div className="relative z-10 flex items-center justify-between border-t border-border/60 pt-6">
        <span className="mono-label">EST. Wales · United Kingdom</span>
        <span className="mono-label">quooro.com</span>
      </div>
    </aside>
  );
}
