import { useEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import * as Icons from "lucide-react";
import { ArrowRight, Shield, Heart, Zap, Check, Star, Award, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroParticleField } from "./HeroParticleField";
import { useSiteContent } from "@/hooks/useSiteContent";
import { HOME_HERO_DEFAULTS, type HomeHeroContent } from "@/lib/siteContentSchemas";
import { EditableField } from "@/components/marketing/EditableField";

import site01 from "@/assets/hero-screenshots/site-01.jpg";
import site02 from "@/assets/hero-screenshots/site-02.jpg";
import site03 from "@/assets/hero-screenshots/site-03.jpg";
import site04 from "@/assets/hero-screenshots/site-04.jpg";
import site05 from "@/assets/hero-screenshots/site-05.jpg";
import site06 from "@/assets/hero-screenshots/site-06.jpg";
import site07 from "@/assets/hero-screenshots/site-07.jpg";
import site08 from "@/assets/hero-screenshots/site-08.jpg";
import site09 from "@/assets/hero-screenshots/site-09.jpg";
import site10 from "@/assets/hero-screenshots/site-10.jpg";
import site11 from "@/assets/hero-screenshots/site-11.jpg";
import site12 from "@/assets/hero-screenshots/site-12.jpg";
import site13 from "@/assets/hero-screenshots/site-13.jpg";
import site14 from "@/assets/hero-screenshots/site-14.jpg";

const siteImages = [site01, site02, site03, site04, site05, site06, site07, site08, site09, site10, site11, site12, site13, site14];

const desktopPlacements = [
  { left: 2, top: 3, tz: -60, rotX: 8, rotY: -12, rotZ: -6, s: 0.72, bob: 0, dur: 5.2 },
  { left: 25, top: 2, tz: 40, rotX: -5, rotY: 8, rotZ: 3, s: 0.85, bob: 1, dur: 4.6 },
  { left: 55, top: 1, tz: -30, rotX: 6, rotY: -6, rotZ: -2, s: 0.78, bob: 2, dur: 5.8 },
  { left: 80, top: 4, tz: 60, rotX: -8, rotY: 10, rotZ: 4, s: 0.82, bob: 3, dur: 4.4 },
  { left: -2, top: 28, tz: 20, rotX: 4, rotY: -15, rotZ: -8, s: 0.75, bob: 2, dur: 5.5 },
  { left: 1, top: 58, tz: -40, rotX: -6, rotY: -10, rotZ: 5, s: 0.70, bob: 0, dur: 6.0 },
  { left: 82, top: 30, tz: 50, rotX: -4, rotY: 14, rotZ: 6, s: 0.80, bob: 1, dur: 4.8 },
  { left: 85, top: 60, tz: -20, rotX: 7, rotY: 8, rotZ: -3, s: 0.73, bob: 3, dur: 5.3 },
  { left: 3, top: 78, tz: 30, rotX: -10, rotY: -8, rotZ: 4, s: 0.76, bob: 1, dur: 5.0 },
  { left: 22, top: 82, tz: -50, rotX: 5, rotY: 12, rotZ: -5, s: 0.68, bob: 2, dur: 5.7 },
  { left: 45, top: 80, tz: 70, rotX: -3, rotY: -5, rotZ: 2, s: 0.88, bob: 0, dur: 4.3 },
  { left: 68, top: 78, tz: -10, rotX: 8, rotY: 6, rotZ: -4, s: 0.74, bob: 3, dur: 5.4 },
  { left: 15, top: 40, tz: -70, rotX: -7, rotY: -12, rotZ: 3, s: 0.65, bob: 2, dur: 6.2 },
  { left: 72, top: 48, tz: 45, rotX: 5, rotY: 10, rotZ: -5, s: 0.77, bob: 0, dur: 4.9 },
];

// Mobile: only 6 cards, anchored to far left/right edges so the center stays clean and editorial.
const mobilePlacements = [
  { left: -20, top: 4, tz: -40, rotX: 10, rotY: -14, rotZ: -8, s: 0.42, bob: 0, dur: 5.4 },
  { left: 74, top: 6, tz: 30, rotX: -6, rotY: 12, rotZ: 5, s: 0.40, bob: 1, dur: 4.9 },
  { left: -22, top: 44, tz: -25, rotX: -8, rotY: -10, rotZ: 6, s: 0.38, bob: 2, dur: 5.7 },
  { left: 76, top: 46, tz: 35, rotX: 6, rotY: 9, rotZ: -4, s: 0.40, bob: 3, dur: 5.0 },
  { left: -18, top: 84, tz: 25, rotX: -9, rotY: -7, rotZ: 4, s: 0.42, bob: 0, dur: 5.5 },
  { left: 74, top: 86, tz: -20, rotX: 8, rotY: 11, rotZ: -5, s: 0.40, bob: 2, dur: 4.8 },
];



function getIcon(name: string) {
  const C = (Icons as any)[name];
  return (C as React.ComponentType<{ className?: string; style?: React.CSSProperties }>) || Icons.Sparkles;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check, { passive: true });
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

// Ambient floating particles with varied shapes
function AmbientParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      dur: 8 + Math.random() * 14,
      delay: Math.random() * 5,
      opacity: 0.06 + Math.random() * 0.15,
      type: i % 5 === 0 ? 'ring' : 'dot',
    })), []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.type === 'dot' ? 'hsl(var(--primary))' : 'transparent',
            border: p.type === 'ring' ? '1px solid hsl(var(--primary))' : 'none',
            opacity: p.opacity,
            animation: `particleDrift${p.id % 3} ${p.dur}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// Rotating word component — serif italic for editorial luxury
function RotatingWord({ words }: { words: string[] }) {
  const list = words.length ? words : ["Digital Leaders"];
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setIndex(i => (i + 1) % list.length), 3200);
    return () => clearInterval(timer);
  }, [list.length]);

  return (
    <span className="inline-block relative align-baseline">
      {list.map((word, i) => (
        <motion.span
          key={word}
          className="font-serif italic font-normal text-gradient-gold"
          initial={false}
          animate={{
            opacity: i === index ? 1 : 0,
            y: i === index ? 0 : 14,
            filter: i === index ? 'blur(0px)' : 'blur(6px)',
            position: i === index ? 'relative' as const : 'absolute' as const,
          }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ left: 0, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function FloatingScreenshotHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsLayerRef = useRef<HTMLDivElement>(null);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [exploded, setExploded] = useState(false);
  const rafRef = useRef<number>(0);
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const isMobile = useIsMobile();
  const { data: content } = useSiteContent<HomeHeroContent>("home_hero", HOME_HERO_DEFAULTS);
  const trustSignals = (content.badges ?? HOME_HERO_DEFAULTS.badges).map(b => ({
    icon: getIcon(b.icon),
    text: b.label,
  }));

  const placements = isMobile ? mobilePlacements : desktopPlacements;
  const cardW = isMobile ? 130 : 240;
  const cardH = isMobile ? 84 : 155;
  const mobileBaseOpacity = 0.32;

  useEffect(() => {
    const timer = setTimeout(() => setExploded(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    let active = true;

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      targetPos.current = {
        x: ((e.clientX - cx) / rect.width) * 30,
        y: ((e.clientY - cy) / rect.height) * 30,
      };
    };

    const lerp = () => {
      if (!active) return;
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.06;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.06;
      if (cardsLayerRef.current) {
        cardsLayerRef.current.style.transform = `translate3d(${currentPos.current.x}px, ${currentPos.current.y}px, 0)`;
      }
      rafRef.current = requestAnimationFrame(lerp);
    };

    rafRef.current = requestAnimationFrame(lerp);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      active = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [isMobile]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background"
      style={{ perspective: "1400px" }}
    >
      {/* Vignette base — deepens the edges for theatre lighting */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 30%, hsl(var(--background)) 100%)",
        zIndex: 2,
      }} />

      {/* Mobile-only stronger center vignette — keeps the headline area clean */}
      <div className="absolute inset-0 pointer-events-none sm:hidden" style={{
        background: "radial-gradient(ellipse 75% 50% at 50% 50%, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 35%, transparent 75%)",
        zIndex: 4,
      }} />

      {/* Refined ambient glows — gold-tinted center, cool blue periphery */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 45% 35% at 50% 50%, hsl(var(--gold) / 0.06) 0%, transparent 65%)",
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 70% 50% at 25% 75%, hsl(var(--primary) / 0.04) 0%, transparent 55%)",
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 55% 35% at 80% 25%, hsl(var(--gold) / 0.03) 0%, transparent 60%)",
      }} />

      <HeroParticleField />
      <AmbientParticles />

      {/* Refined grid lines */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(hsl(var(--foreground) / 0.015) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--foreground) / 0.015) 1px, transparent 1px)
        `,
        backgroundSize: '96px 96px',
        maskImage: 'radial-gradient(ellipse 60% 55% at 50% 50%, black, transparent)',
      }} />

      {/* Fine grain — premium film texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay" style={{
        backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        zIndex: 3,
      }} />

      {/* Floating screenshot cards */}
      <div
        ref={cardsLayerRef}
        className="absolute inset-0 pointer-events-none"
        style={{ transformStyle: "preserve-3d", willChange: "transform" }}
      >
        {placements.map((card, i) => {
          const isHovered = hoveredCard === i;
          const someHovered = hoveredCard !== null;
          const centerLeft = 50;
          const centerTop = 50;

          return (
            <div
              key={i}
              className="absolute pointer-events-auto"
              style={{
                left: exploded ? `${card.left}%` : `${centerLeft}%`,
                top: exploded ? `${card.top}%` : `${centerTop}%`,
                width: cardW,
                height: cardH,
                transformStyle: "preserve-3d",
                transform: exploded
                  ? `perspective(1400px) translateZ(${isHovered ? card.tz + 100 : card.tz}px) rotateX(${card.rotX}deg) rotateY(${card.rotY}deg) rotateZ(${card.rotZ}deg) scale(${isHovered ? 1.18 : card.s})`
                  : `perspective(1400px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg) scale(0)`,
                opacity: exploded
                  ? isMobile ? mobileBaseOpacity : someHovered ? isHovered ? 1 : 0.35 : 0.85
                  : 0,
                transition: exploded
                  ? `left 1s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s, top 1s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.05}s, transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.05}s, opacity 0.8s cubic-bezier(0.25, 0.1, 0.25, 1), box-shadow 0.3s ease, filter 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)`
                  : `left 0s, top 0s, transform 0.1s, opacity 0.1s`,
                filter: !isMobile && someHovered && !isHovered ? "blur(3px) brightness(0.55) saturate(0.6)" : "blur(0px) brightness(1) saturate(1)",
                zIndex: isHovered ? 100 : 10 + Math.round((card.tz + 100) / 20),
                cursor: isMobile ? "default" : "pointer",
                animation: exploded ? `heroFloat${card.bob} ${card.dur}s ease-in-out ${card.bob * 0.4}s infinite` : "none",
              }}
              onMouseEnter={isMobile ? undefined : () => setHoveredCard(i)}
              onMouseLeave={isMobile ? undefined : () => setHoveredCard(null)}
            >
              <div
                className="relative w-full h-full rounded-lg sm:rounded-xl overflow-hidden"
                style={{
                  background: "hsl(var(--card))",
                  border: isHovered ? "1.5px solid hsl(var(--primary) / 0.7)" : "1px solid hsl(var(--border) / 0.25)",
                  boxShadow: isHovered
                    ? "0 0 50px hsl(var(--primary) / 0.35), 0 25px 70px hsl(var(--foreground) / 0.2), 0 0 0 1px hsl(var(--primary) / 0.15)"
                    : "0 8px 30px hsl(var(--foreground) / 0.1), 0 2px 8px hsl(var(--foreground) / 0.05)",
                  transition: "box-shadow 0.3s ease, border-color 0.3s ease",
                }}
              >
                <div className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 sm:py-1.5 bg-muted/50">
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ background: "#EF4444aa" }} />
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ background: "#EAB308aa" }} />
                  <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ background: "#22C55Eaa" }} />
                  <span className="ml-1 sm:ml-1.5 h-2 sm:h-2.5 rounded flex-1 bg-muted/60" style={{ maxWidth: isMobile ? 50 : 100 }} />
                </div>
                <img
                  src={siteImages[i % siteImages.length]}
                  alt={`Website design ${i + 1}`}
                  loading="lazy"
                  className="w-full h-[calc(100%-20px)] sm:h-[calc(100%-24px)] object-cover object-top"
                  style={{
                    filter: isHovered ? "brightness(1.15) saturate(1.1)" : "brightness(0.85)",
                    transition: "filter 0.25s ease",
                  }}
                />
                {isHovered && !isMobile && (
                  <div className="absolute inset-0 pointer-events-none" style={{
                    background: "linear-gradient(115deg, transparent 20%, hsl(var(--primary) / 0.12) 45%, transparent 65%)",
                    animation: "sheenSweep 0.7s ease forwards",
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Central Content */}
      <div className="relative z-20 text-center px-6 sm:px-4 max-w-4xl mx-auto pointer-events-auto py-20 sm:py-0">
        <div className="absolute -inset-4 sm:-inset-6 rounded-3xl bg-transparent -z-10" />

        {/* Announcement badge with shimmer */}
        {/* Editorial kicker — minimal nardo-grey, premium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-3 mb-7 sm:mb-9"
        >
          <span className="hidden sm:block h-px w-10" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--foreground) / 0.25))' }} />
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full relative overflow-hidden"
            style={{
              backgroundColor: 'hsl(var(--foreground) / 0.04)',
              border: '1px solid hsl(var(--foreground) / 0.12)',
              boxShadow: 'inset 0 1px 0 hsl(var(--foreground) / 0.05)',
            }}>
            <Sparkles className="w-3 h-3 text-foreground/55" />
            <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.22em] relative z-10 text-foreground/65">
              <EditableField sectionKey="home_hero" field="eyebrow" value={content.eyebrow} label="Eyebrow">{content.eyebrow}</EditableField>
            </span>
          </span>
          <span className="hidden sm:block h-px w-10" style={{ background: 'linear-gradient(90deg, hsl(var(--foreground) / 0.25), transparent)' }} />
        </motion.div>


        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 sm:mb-7 font-display font-semibold leading-[1.02] sm:leading-[0.98] text-[2.15rem] sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem]"
          style={{ letterSpacing: '-0.035em' }}
        >
          <span className="block"><EditableField sectionKey="home_hero" field="titleLine1" value={content.titleLine1} label="Title line 1">{content.titleLine1}</EditableField></span>
          <span className="block text-foreground/70 font-serif italic font-normal text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl mt-2 sm:mt-1">
            <EditableField sectionKey="home_hero" field="titleLine2Prefix" value={content.titleLine2Prefix} label="Title prefix">{content.titleLine2Prefix}</EditableField>{" "}
            <RotatingWord words={content.rotatingWords} />
          </span>
        </motion.h1>

        {/* Refined editorial rule */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-6 sm:mb-8 h-px w-24 origin-center"
          style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--gold) / 0.6), transparent)' }}
        />

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.95, ease: [0.22, 1, 0.36, 1] }}
          className="text-sm sm:text-lg md:text-xl text-foreground/65 max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 leading-relaxed font-light"
        >
          <EditableField sectionKey="home_hero" field="subtitle" value={content.subtitle} label="Subtitle" kind="textarea">{content.subtitle}</EditableField>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center"
        >
          <Button variant="premium" size="xl" asChild className="w-full sm:w-auto group">
            <Link to={!content.primaryCtaHref || content.primaryCtaHref === "/sign-in" ? "/get-started" : content.primaryCtaHref}>
              <EditableField sectionKey="home_hero" field="primaryCtaLabel" value={content.primaryCtaLabel} label="Primary button">{content.primaryCtaLabel}</EditableField>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="glass" size="xl" asChild className="w-full sm:w-auto">
            <Link to={content.secondaryCtaHref}>
              <EditableField sectionKey="home_hero" field="secondaryCtaLabel" value={content.secondaryCtaLabel} label="Secondary button">{content.secondaryCtaLabel}</EditableField>
            </Link>
          </Button>
        </motion.div>


        {/* Trust Badges - minimal, refined */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.4 }}
          className="mt-10 sm:mt-14 hidden md:flex flex-wrap gap-x-8 gap-y-3 justify-center items-center"
        >
          {trustSignals.map((signal, index) => (
            <motion.div
              key={signal.text}
              className="flex items-center gap-2 text-[11px] sm:text-xs uppercase tracking-[0.18em] text-foreground/55 hover:text-foreground/90 transition-colors duration-500 cursor-default group"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.5 + index * 0.08 }}
            >
              <signal.icon className="w-3.5 h-3.5 transition-colors duration-500 group-hover:text-[hsl(var(--gold))]"
                style={{ color: 'hsl(var(--gold) / 0.7)' }} />
              <span className="font-medium">{signal.text}</span>
              {index < trustSignals.length - 1 && (
                <span className="hidden lg:inline-block w-px h-3 ml-8" style={{ background: 'hsl(var(--foreground) / 0.12)' }} />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Animated stats counter band */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
          className="mt-8 sm:mt-10 hidden md:grid grid-cols-4 gap-3 sm:gap-6 max-w-xl mx-auto"
        >
          {(content.stats ?? HOME_HERO_DEFAULTS.stats).map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 2.0 + i * 0.1 }}
              className="text-center group cursor-default"
            >
              <span className="text-lg sm:text-xl font-bold text-gradient block transition-transform duration-300 group-hover:scale-110">{stat.value}</span>
              <span className="text-[9px] sm:text-xs text-muted-foreground/60 uppercase tracking-wider font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="mt-10 sm:mt-14 hidden md:flex flex-col items-center gap-2"
        >
          <span className="text-[10px] sm:text-xs text-muted-foreground/50 uppercase tracking-widest font-medium">Scroll to explore</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="w-5 h-8 rounded-full flex items-start justify-center pt-1.5"
            style={{ border: '1px solid hsl(var(--border) / 0.3)' }}
          >
            <motion.div 
              className="w-1 h-2 rounded-full"
              style={{ backgroundColor: 'hsl(var(--primary) / 0.4)' }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        @keyframes heroFloat0 {
          0%, 100% { transform: translateY(0px) rotateY(0deg) rotateX(0deg); }
          25% { transform: translateY(-12px) rotateY(1.5deg) rotateX(0.5deg); }
          50% { transform: translateY(-18px) rotateY(3deg) rotateX(1deg); }
          75% { transform: translateY(-8px) rotateY(1deg) rotateX(0.3deg); }
        }
        @keyframes heroFloat1 {
          0%, 100% { transform: translateY(0px) rotateY(0deg) rotateX(0deg); }
          30% { transform: translateY(-15px) rotateY(-2deg) rotateX(-0.5deg); }
          60% { transform: translateY(-10px) rotateY(-3.5deg) rotateX(-1deg); }
          80% { transform: translateY(-20px) rotateY(-1.5deg) rotateX(-0.3deg); }
        }
        @keyframes heroFloat2 {
          0%, 100% { transform: translateY(0px) rotateY(0deg) rotateX(0deg); }
          20% { transform: translateY(-8px) rotateY(2deg) rotateX(0.8deg); }
          55% { transform: translateY(-22px) rotateY(4deg) rotateX(1.2deg); }
          85% { transform: translateY(-5px) rotateY(1deg) rotateX(0.2deg); }
        }
        @keyframes heroFloat3 {
          0%, 100% { transform: translateY(0px) rotateY(0deg) rotateX(0deg); }
          35% { transform: translateY(-14px) rotateY(-1.5deg) rotateX(-0.6deg); }
          65% { transform: translateY(-20px) rotateY(-2.5deg) rotateX(-0.8deg); }
          90% { transform: translateY(-6px) rotateY(-0.5deg) rotateX(-0.2deg); }
        }
        @keyframes sheenSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes badgeShimmer {
          0%, 100% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
        }
        @keyframes particleDrift0 {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-30px) translateX(15px); }
          66% { transform: translateY(-10px) translateX(-10px); }
        }
        @keyframes particleDrift1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          40% { transform: translateY(-20px) translateX(-20px); }
          70% { transform: translateY(-35px) translateX(8px); }
        }
        @keyframes particleDrift2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          25% { transform: translateY(-15px) translateX(25px); }
          55% { transform: translateY(-28px) translateX(-12px); }
        }
        .hero-pulse {
          animation: gradientPulse 3s ease-in-out infinite;
        }
        @keyframes gradientPulse {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
      `}</style>
    </section>
  );
}
