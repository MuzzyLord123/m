import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/motion/Magnetic";
import { SplitText } from "@/components/motion/SplitText";
import { LineDraw, DrawPath, DrawPoint } from "@/components/motion/LineDraw";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HOME_HERO_DEFAULTS, type HomeHeroContent } from "@/lib/siteContentSchemas";
import { EditableField } from "@/components/marketing/EditableField";
import { getIcon } from "@/lib/marketingIcons";

/**
 * The hero, third iteration: a typographic poster.
 *
 * The split-with-globe layout read well on desktop but was designed
 * desktop-first — on a phone it stacked a full-viewport WebGL sphere under the
 * copy, which was both the page's biggest performance cost and its least
 * designed moment. The globe now lives back down in Reach at a size it earns;
 * the hero is carried by the two things that survive every viewport: enormous
 * type and light.
 *
 * Mobile is the primary composition. The headline is sized in vw so it fills a
 * phone edge-to-edge, the aurora replaces the globe as the living layer at
 * near-zero cost, and nothing in the first viewport runs WebGL — three.js is
 * not even fetched until the visitor scrolls to Reach.
 *
 * Every text binding (EditableField section/field pairs) is unchanged, so the
 * admin editor keeps working.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Studio coordinates — the drafting-sheet furniture. */
const STUDIO_COORDS = "52.13° N · 3.78° W";

function RotatingWord({ words }: { words: string[] }) {
  const list = words.length ? words : ["Ambitious Brands"];
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (list.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % list.length), 3400);
    return () => clearInterval(timer);
  }, [list.length]);

  const longest = list.reduce((a, b) => (b.length > a.length ? b : a), list[0]);

  return (
    <span className="relative inline-block overflow-hidden align-bottom text-primary">
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
      {/* ── Living layers, cheapest first ─────────────────────────── */}
      <div className="hero-aurora" aria-hidden />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground) / 0.028) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground) / 0.028) 1px, transparent 1px)
          `,
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 20%, black 8%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 20%, black 8%, transparent 80%)",
        }}
      />

      {/* Film grain. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        }}
      />

      {/* Full-bleed orbital arcs drawing themselves behind the type. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 overflow-hidden" aria-hidden>
        <LineDraw viewBox="0 0 1440 620" className="mx-auto h-auto w-full min-w-[900px]">
          <DrawPath
            d="M -40 470 Q 720 110 1480 400"
            stroke="hsl(var(--foreground))"
            opacity={0.13}
            duration={1.7}
          />
          <DrawPath
            d="M -40 560 Q 720 300 1480 520"
            stroke="hsl(var(--foreground))"
            opacity={0.08}
            dashed
            at={0.3}
          />
          <DrawPath
            d="M 880 216 Q 1120 150 1372 260"
            stroke="hsl(var(--primary))"
            strokeWidth={1.3}
            opacity={0.85}
            at={0.7}
            duration={0.9}
          />
          <DrawPoint cx={880} cy={216} r={3} fill="hsl(var(--primary))" ring at={0.65} />
          <DrawPoint cx={1372} cy={260} r={2.5} fill="hsl(var(--foreground))" at={1.5} />
        </LineDraw>
      </div>

      {/* Vertical furniture on wide screens. */}
      <p
        className="mono-label pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 select-none xl:block"
        style={{ writingMode: "vertical-rl" }}
        aria-hidden
      >
        EST. WALES · UNITED KINGDOM
      </p>

      {/* ── Content ───────────────────────────────────────────────── */}
      <div className="container-tight relative z-10 pb-14 pt-24 sm:pb-16 sm:pt-28 lg:pt-32">
        {/* Drafting-sheet header row. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mb-10 flex items-center justify-between gap-4 border-b border-border/60 pb-4 sm:mb-14"
        >
          <span className="mono-label">{STUDIO_COORDS}</span>
          <span className="mono-label hidden sm:block">
            <EditableField sectionKey="home_hero" field="eyebrow" value={content.eyebrow} label="Eyebrow">
              {content.eyebrow}
            </EditableField>
          </span>
          <span className="mono-label text-primary">The studio</span>
        </motion.div>

        {/* ── The poster ──────────────────────────────────────────── */}
        <h1>
          <span className="block font-display font-semibold uppercase leading-[0.92] tracking-[-0.03em] text-[clamp(3.3rem,14.5vw,8.5rem)]">
            <EditableField
              sectionKey="home_hero"
              field="titleLine1"
              value={content.titleLine1}
              label="Title line 1"
            >
              <SplitText text={content.titleLine1} as="span" className="block" stagger={0.09} />
            </EditableField>
          </span>

          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
            className="mt-5 block sm:mt-7"
          >
            <span className="mono-label block text-[11px] sm:text-xs">
              <EditableField
                sectionKey="home_hero"
                field="titleLine2Prefix"
                value={content.titleLine2Prefix}
                label="Title prefix"
              >
                {content.titleLine2Prefix}
              </EditableField>
            </span>
            <span className="mt-1.5 block font-display font-semibold leading-[1.02] tracking-[-0.03em] text-[clamp(2rem,8.6vw,4.6rem)]">
              <span aria-hidden>
                <RotatingWord words={rotating} />
              </span>
              <span className="sr-only">{rotating[0]}</span>
            </span>
          </motion.span>
        </h1>

        {/* ── Standfirst + actions ────────────────────────────────── */}
        <div className="mt-10 grid gap-10 sm:mt-14 lg:grid-cols-12 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.62, ease: EASE }}
            className="lg:col-span-6"
          >
            <p className="max-w-xl text-[15px] font-light leading-relaxed text-muted-foreground sm:text-lg">
              <EditableField
                sectionKey="home_hero"
                field="subtitle"
                value={content.subtitle}
                label="Subtitle"
                kind="textarea"
              >
                {content.subtitle}
              </EditableField>
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
              <Magnetic className="inline-block">
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
              </Magnetic>

              <Link
                to={content.secondaryCtaHref}
                className="group inline-flex items-center justify-center gap-2 py-2 text-sm font-medium text-foreground/75 transition-colors hover:text-foreground sm:justify-start"
              >
                <span className="link-underline">
                  <EditableField
                    sectionKey="home_hero"
                    field="secondaryCtaLabel"
                    value={content.secondaryCtaLabel}
                    label="Secondary button"
                  >
                    {content.secondaryCtaLabel}
                  </EditableField>
                </span>
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          {/* Credentials — plain, checkable claims only. */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.74 }}
            className="grid grid-cols-1 content-end gap-x-6 gap-y-3 border-t border-border/60 pt-6 sm:grid-cols-2 lg:col-span-6 lg:border-t-0 lg:pt-0"
          >
            {badges.map((badge) => (
              <li
                key={badge.label}
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground"
              >
                <badge.icon className="h-3.5 w-3.5 text-primary" />
                <span>{badge.label}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* ── Numbers — the glass instrument panel ────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.85, ease: EASE }}
          className="relative mt-14 sm:mt-16"
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

        {/* Scroll cue. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-12 flex items-center gap-3 sm:mt-14"
          aria-hidden
        >
          <span className="scroll-cue" />
          <span className="mono-label">Scroll</span>
        </motion.div>
      </div>
    </section>
  );
}
