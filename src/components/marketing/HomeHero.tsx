import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeferredGlobe3D } from "@/components/DeferredGlobe3D";
import { HeroScrub } from "@/components/motion/Scrub";
import { OrbitHeroRings } from "@/components/marketing/OrbitalMotif";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HOME_HERO_DEFAULTS, type HomeHeroContent } from "@/lib/siteContentSchemas";
import { EditableField } from "@/components/marketing/EditableField";
import { getIcon } from "@/lib/marketingIcons";

/**
 * Night Shift homepage hero.
 *
 * Replaces FloatingScreenshotHero, which built its authority out of fourteen
 * website screenshots the studio confirmed are not real client work, arranged as
 * a 3D card cloud. That is a fabricated portfolio, so it is gone rather than
 * restyled — and with it the centred-headline-over-two-pills layout, the
 * blue/gold ambient wash, 35 JS-animated particles, a second particle canvas and
 * a mousemove rAF loop.
 *
 * What replaces it is the one asset on this site that is genuinely the studio's
 * own: the globe. It is live WebGL, it marks the real studio location in Wales,
 * and it earns the right-hand half of an asymmetric split. Everything else is
 * type.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Studio coordinates — the same point the globe marks. */
const STUDIO_COORDS = "52.13° N, 3.78° W";

function RotatingWord({ words }: { words: string[] }) {
  const list = words.length ? words : ["Ambitious Brands"];
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (list.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % list.length), 3400);
    return () => clearInterval(timer);
  }, [list.length]);

  // The invisible copy of the longest word reserves the width, so the line never
  // reflows as the words swap. Without it the whole headline twitches on a timer.
  const longest = list.reduce((a, b) => (b.length > a.length ? b : a), list[0]);

  return (
    <span
      className="relative inline-block overflow-hidden align-bottom text-primary"
      style={{ verticalAlign: "bottom" }}
    >
      <span aria-hidden className="invisible block whitespace-nowrap">
        {longest}
      </span>
      <AnimatePresence initial={false}>
        <motion.span
          key={list[index]}
          className="absolute left-0 top-0 whitespace-nowrap"
          initial={reduce ? { opacity: 0 } : { y: "105%" }}
          animate={reduce ? { opacity: 1 } : { y: "0%" }}
          exit={reduce ? { opacity: 0 } : { y: "-105%" }}
          transition={{ duration: reduce ? 0.3 : 0.6, ease: EASE }}
        >
          {list[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export function HomeHero() {
  const { data: content } = useSiteContent<HomeHeroContent>("home_hero", HOME_HERO_DEFAULTS);

  const badges = (content.badges ?? HOME_HERO_DEFAULTS.badges).map((b) => ({
    icon: getIcon(b.icon),
    label: b.label,
  }));
  const stats = content.stats ?? HOME_HERO_DEFAULTS.stats;
  const rotating = content.rotatingWords?.length
    ? content.rotatingWords
    : HOME_HERO_DEFAULTS.rotatingWords;

  return (
    <section className="relative overflow-hidden bg-background">
      {/* One ember bloom, weighted to the globe side. Not six. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 45% 55% at 78% 38%, hsl(var(--primary) / 0.13) 0%, transparent 68%)",
        }}
      />

      {/* Structural grid — reads as drafting paper, not as decoration. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground) / 0.028) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground) / 0.028) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse 80% 70% at 60% 40%, black 10%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 70% at 60% 40%, black 10%, transparent 78%)",
        }}
      />

      {/* Film grain — the only texture layer left. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />

      <div className="container-tight relative z-10 pb-16 pt-24 sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* ── Type column ─────────────────────────────────────────── */}
          <div className="lg:col-span-7">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE }}
              className="mb-7 flex items-center gap-3"
            >
              <span className="h-px w-8 bg-primary" />
              <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground sm:text-[11px]">
                <EditableField
                  sectionKey="home_hero"
                  field="eyebrow"
                  value={content.eyebrow}
                  label="Eyebrow"
                >
                  {content.eyebrow}
                </EditableField>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.08, ease: EASE }}
              className="font-display font-semibold leading-[0.96] tracking-[-0.04em] text-[clamp(2.4rem,6vw,3.9rem)]"
            >
              <span className="block">
                <EditableField
                  sectionKey="home_hero"
                  field="titleLine1"
                  value={content.titleLine1}
                  label="Title line 1"
                >
                  {content.titleLine1}
                </EditableField>
              </span>
              <span className="mt-1 block text-foreground/55">
                <EditableField
                  sectionKey="home_hero"
                  field="titleLine2Prefix"
                  value={content.titleLine2Prefix}
                  label="Title prefix"
                >
                  {content.titleLine2Prefix}
                </EditableField>{" "}
                {/* The visual word rotates on a timer; screen readers get one
                    stable sentence instead of a caption that rewrites itself. */}
                <span aria-hidden>
                  <RotatingWord words={rotating} />
                </span>
                <span className="sr-only">{rotating[0]}</span>
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: EASE }}
              className="mt-7 max-w-xl text-[15px] font-light leading-relaxed text-muted-foreground sm:text-lg"
            >
              <EditableField
                sectionKey="home_hero"
                field="subtitle"
                value={content.subtitle}
                label="Subtitle"
                kind="textarea"
              >
                {content.subtitle}
              </EditableField>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.26, ease: EASE }}
              className="mt-9 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center"
            >
              <Button variant="premium" size="xl" asChild className="group w-full sm:w-auto">
                <Link
                  to={
                    !content.primaryCtaHref || content.primaryCtaHref === "/sign-in"
                      ? "/get-started"
                      : content.primaryCtaHref
                  }
                >
                  <EditableField
                    sectionKey="home_hero"
                    field="primaryCtaLabel"
                    value={content.primaryCtaLabel}
                    label="Primary button"
                  >
                    {content.primaryCtaLabel}
                  </EditableField>
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>

              {/* Secondary is a link, not a second button. One button per view
                  means the primary action is unmistakable. */}
              <Link
                to={content.secondaryCtaHref}
                className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground sm:justify-start"
              >
                <span className="relative">
                  <EditableField
                    sectionKey="home_hero"
                    field="secondaryCtaLabel"
                    value={content.secondaryCtaLabel}
                    label="Secondary button"
                  >
                    {content.secondaryCtaLabel}
                  </EditableField>
                  <span className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-300 group-hover:scale-x-100" />
                </span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {/* Credentials — plain, checkable claims only. */}
            <motion.ul
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.9, delay: 0.4 }}
              className="mt-12 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-border/60 pt-7 sm:grid-cols-2"
            >
              {badges.map((badge) => (
                <li
                  key={badge.label}
                  className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
                >
                  <badge.icon className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
                  <span>{badge.label}</span>
                </li>
              ))}
            </motion.ul>
          </div>

          {/* ── Globe column ────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, delay: 0.2, ease: EASE }}
            className="lg:col-span-5"
          >
            <HeroScrub className="mx-auto w-full max-w-[340px] sm:max-w-[420px] lg:max-w-none">
              <div className="relative aspect-square">
                {/* Ember bloom sitting behind the sphere, not around the section. */}
                <div
                  className="pointer-events-none absolute inset-[8%] rounded-full blur-3xl"
                  style={{ background: "hsl(var(--primary) / 0.16)" }}
                />
                {/* Orbital linework framing the sphere — drawn on load, behind
                    the canvas, oversized so the arcs swing past the box. */}
                <OrbitHeroRings className="pointer-events-none absolute -inset-[12%] h-auto w-[124%]" />
                <DeferredGlobe3D />
              </div>

              <div className="mt-5 flex items-center justify-center gap-3 lg:justify-start">
                <span className="h-px w-6 shrink-0 bg-border" />
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {STUDIO_COORDS} — the studio
                  <span> · drag to spin</span>
                </p>
              </div>
            </HeroScrub>
          </motion.div>
        </div>

        {/* ── Numbers — one glass instrument panel ─────────────────────
            The pane floats over its own ember wash so the glass has something
            to refract at every width (the reference failure mode is glass over
            flat background, which reads as a grey box). This is the hero's one
            glass surface; the nav capsule above it is the other. */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
          className="relative mt-16 sm:mt-20"
        >
          <div
            className="pointer-events-none absolute -inset-x-8 -inset-y-10"
            style={{
              background:
                "radial-gradient(ellipse 55% 90% at 22% 100%, hsl(var(--primary) / 0.14) 0%, transparent 65%)",
            }}
          />
          <dl className="glass-panel relative grid grid-cols-2 rounded-3xl px-2 py-1 sm:grid-cols-4 sm:px-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={`px-4 py-5 sm:px-6 sm:py-7 ${i % 2 === 1 ? "border-l border-border/60" : ""} ${i >= 2 ? "border-t border-border/60 sm:border-t-0" : ""} ${i >= 1 ? "sm:border-l sm:border-border/60" : "sm:border-l-0"}`}
              >
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                    {stat.value}
                  </span>
                  <span className="mt-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </section>
  );
}
