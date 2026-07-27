import { EditorElement } from '../types';
import { SectionBlock, SectionCategory } from './sectionBlocks';

let _sc7 = 0;
function sid(): string { _sc7++; return `sv7-${_sc7}-${Math.random().toString(36).slice(2, 7)}`; }
function s(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: sid(), type, name: name ?? type, props, styles, children };
}
function anim(el: EditorElement, a: EditorElement['animations']): EditorElement { return { ...el, animations: a }; }
function hover(el: EditorElement, h: EditorElement['hoverStyles']): EditorElement { return { ...el, hoverStyles: h }; }

const FU = (d = 0) => ({ type: 'fadeInUp' as const, duration: 0.8, delay: d, trigger: 'onView' as const, easing: 'cubic-bezier(0.16,1,0.3,1)' });
const BI = (d = 0) => ({ type: 'blurIn' as const, duration: 1.2, delay: d, trigger: 'onView' as const });
const SI = (d = 0) => ({ type: 'scaleIn' as const, duration: 1, delay: d, trigger: 'onView' as const, easing: 'cubic-bezier(0.16,1,0.3,1)' });
const FL = (d = 0) => ({ type: 'fadeInLeft' as const, duration: 0.9, delay: d, trigger: 'onView' as const });
const FR = (d = 0) => ({ type: 'fadeInRight' as const, duration: 0.9, delay: d, trigger: 'onView' as const });
const FD = (d = 0) => ({ type: 'fadeInDown' as const, duration: 0.8, delay: d, trigger: 'onView' as const });
const EL = (d = 0) => ({ type: 'elastic' as const, duration: 1.2, delay: d, trigger: 'onView' as const });

// ─── helpers ──────────────────────────────────────────────────────
const pill = (text: string, bg = 'rgba(99,102,241,0.12)', fg = 'rgba(165,148,255,0.9)') =>
  s('text', { text }, { desktop: { display: 'inline-block', fontSize: '11px', letterSpacing: '0.22em', fontWeight: '700', color: fg, backgroundColor: bg, padding: '6px 20px', borderRadius: '100px', marginBottom: '24px', textTransform: 'uppercase' } });

const gText = (text: string, size = '72px', grad = 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.3) 100%)') =>
  s('heading', { text, level: 'h1' }, { desktop: { fontSize: size, fontWeight: '800', letterSpacing: '-0.045em', lineHeight: '1.02', background: grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '28px' } as any, mobile: { fontSize: `calc(${size} * 0.55)` } });

const body = (text: string, maxW = '560px') =>
  s('text', { text }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.42)', lineHeight: '1.8', maxWidth: maxW, marginBottom: '40px' } });

const bodyDark = (text: string, maxW = '560px') =>
  s('text', { text }, { desktop: { fontSize: '18px', color: 'rgba(0,0,0,0.5)', lineHeight: '1.8', maxWidth: maxW, marginBottom: '40px' } });

const cta = (text: string, bg = 'linear-gradient(135deg, #6366f1, #8b5cf6)') =>
  hover(s('button', { text, href: '#' }, { desktop: { padding: '18px 48px', background: bg, color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: 'none', letterSpacing: '0.02em', boxShadow: '0 4px 24px rgba(99,102,241,0.3)' } }), { transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(99,102,241,0.45)' });

const ctaGhost = (text: string) =>
  hover(s('button', { text, href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' } }), { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' });

const ctaDark = (text: string, bg = 'linear-gradient(135deg, #111, #000)') =>
  hover(s('button', { text, href: '#' }, { desktop: { padding: '18px 48px', background: bg, color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: 'none' } }), { transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' });

const orb = (w: string, gradient: string, top: string, left: string, blur = '100px') =>
  s('container', {}, { desktop: { position: 'absolute', width: w, height: w, borderRadius: '50%', background: gradient, top, left, filter: `blur(${blur})`, pointerEvents: 'none', opacity: '0.6' } });

const gridOverlay = () =>
  s('container', {}, { desktop: { position: 'absolute', inset: '0', backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' } });

const noise = () =>
  s('container', {}, { desktop: { position: 'absolute', inset: '0', opacity: '0.03', backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', pointerEvents: 'none' } });


// ══════════════════════════════════════════════════════════════════
//  V7 HEROES — 15 Ultra-Premium Animated Hero Sections
// ══════════════════════════════════════════════════════════════════

export const PREMIUM_SECTION_BLOCKS_V7: SectionBlock[] = [

  // ─── 1. PRISMATIC GLOW HERO ──────────────────────────────────
  {
    id: 'v7-hero-prismatic', name: 'Prismatic Glow Hero', category: 'Heroes' as SectionCategory,
    description: 'Full-screen hero with animated prismatic light beams, frosted glass cards and staggered reveals',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(160deg, #030014 0%, #0a0520 30%, #120a30 60%, #030014 100%)' } }, [
      // Prismatic beams
      s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'conic-gradient(from 180deg at 50% 50%, rgba(168,85,247,0.08) 0deg, rgba(59,130,246,0.06) 60deg, rgba(236,72,153,0.08) 120deg, rgba(16,185,129,0.05) 180deg, rgba(245,158,11,0.06) 240deg, rgba(168,85,247,0.08) 300deg, rgba(59,130,246,0.06) 360deg)', animation: 'spin 30s linear infinite', filter: 'blur(80px)' } }),
      orb('500px', 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)', '-10%', '60%', '120px'),
      orb('400px', 'radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%)', '50%', '-5%', '100px'),
      noise(),
      gridOverlay(),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '880px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        anim(pill('✦ INTRODUCING V7'), BI()),
        anim(gText('The Future of\nDigital Design', '84px', 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 50%, #a0f0ed 100%)'), BI(0.15)),
        anim(body('Build breathtaking digital experiences with our AI-powered platform. From concept to launch in hours, not months.'), FU(0.3)),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '64px' } }, [
          cta('Get Started Free'),
          ctaGhost('Live Demo →'),
        ]), FU(0.45)),
        // Floating glass stat cards
        anim(s('container', {}, { desktop: { display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' } }, [
          hover(s('container', {}, { desktop: { padding: '20px 32px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', textAlign: 'center' } }, [
            s('heading', { text: '50K+', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '800', color: '#a78bfa', marginBottom: '4px' } }),
            s('text', { text: 'Active Users' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' } }),
          ]), { transform: 'translateY(-4px)', borderColor: 'rgba(167,139,250,0.3)' }),
          hover(s('container', {}, { desktop: { padding: '20px 32px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', textAlign: 'center' } }, [
            s('heading', { text: '99.9%', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '800', color: '#60a5fa', marginBottom: '4px' } }),
            s('text', { text: 'Uptime SLA' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' } }),
          ]), { transform: 'translateY(-4px)', borderColor: 'rgba(96,165,250,0.3)' }),
          hover(s('container', {}, { desktop: { padding: '20px 32px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', textAlign: 'center' } }, [
            s('heading', { text: '4.9★', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '800', color: '#34d399', marginBottom: '4px' } }),
            s('text', { text: 'User Rating' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase' } }),
          ]), { transform: 'translateY(-4px)', borderColor: 'rgba(52,211,153,0.3)' }),
        ]), SI(0.6)),
      ]),
    ], 'Prismatic Glow Hero')],
  },

  // ─── 2. NOIR CINEMATIC HERO ──────────────────────────────────
  {
    id: 'v7-hero-noir', name: 'Noir Cinematic Hero', category: 'Heroes' as SectionCategory,
    description: 'Dramatic dark cinematic hero with spotlight effect, grain texture and theatrical typography',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: '#000', padding: '0 80px' }, mobile: { padding: '0 24px' } }, [
      // Spotlight
      s('container', {}, { desktop: { position: 'absolute', top: '-20%', right: '10%', width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)', pointerEvents: 'none' } }),
      noise(),
      // Vertical line accent
      s('container', {}, { desktop: { position: 'absolute', left: '80px', top: '15%', bottom: '15%', width: '1px', background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.1), transparent)', pointerEvents: 'none' }, mobile: { display: 'none' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', maxWidth: '700px' } }, [
        anim(s('text', { text: '01' }, { desktop: { fontSize: '120px', fontWeight: '900', color: 'rgba(255,255,255,0.03)', lineHeight: '1', marginBottom: '-30px', fontFamily: 'serif' } }), FD()),
        anim(s('text', { text: 'LUXURY · REIMAGINED' }, { desktop: { fontSize: '11px', letterSpacing: '0.35em', color: 'rgba(255,255,255,0.3)', marginBottom: '28px', fontWeight: '500' } }), FU(0.1)),
        anim(s('heading', { text: 'Where Vision\nMeets Precision', level: 'h1' }, { desktop: { fontSize: '78px', fontWeight: '200', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.03em', marginBottom: '32px', fontFamily: 'serif' } as any, mobile: { fontSize: '42px' } }), BI(0.2)),
        anim(s('container', {}, { desktop: { width: '60px', height: '1px', background: 'rgba(255,255,255,0.2)', marginBottom: '32px' } }), FU(0.35)),
        anim(body('Crafting unparalleled digital experiences through meticulous attention to detail and bold creative vision.', '480px'), FU(0.4)),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '20px', alignItems: 'center' } }, [
          hover(s('button', { text: 'Explore Collection', href: '#' }, { desktop: { padding: '20px 52px', background: '#fff', color: '#000', borderRadius: '0', fontSize: '12px', fontWeight: '700', border: 'none', letterSpacing: '0.15em', textTransform: 'uppercase' } }), { background: 'rgba(255,255,255,0.9)' }),
          hover(s('button', { text: 'View Lookbook →', href: '#' }, { desktop: { padding: '20px 32px', background: 'transparent', color: 'rgba(255,255,255,0.5)', border: 'none', fontSize: '13px', fontWeight: '500', letterSpacing: '0.05em' } }), { color: '#fff' }),
        ]), FU(0.55)),
      ]),
      // Right side - large number
      anim(s('text', { text: '2026' }, { desktop: { position: 'absolute', right: '60px', bottom: '80px', fontSize: '180px', fontWeight: '100', color: 'rgba(255,255,255,0.02)', lineHeight: '1', fontFamily: 'serif', pointerEvents: 'none' }, mobile: { display: 'none' } }), SI(0.6)),
    ], 'Noir Cinematic Hero')],
  },

  // ─── 3. NEON GRID HERO ───────────────────────────────────────
  {
    id: 'v7-hero-neon-grid', name: 'Neon Grid Hero', category: 'Heroes' as SectionCategory,
    description: 'Cyberpunk-inspired hero with animated neon grid lines, glowing accents and futuristic typography',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(180deg, #000 0%, #0a0a1a 50%, #000 100%)' } }, [
      // Grid floor perspective
      s('container', {}, { desktop: { position: 'absolute', bottom: '0', left: '0', right: '0', height: '50%', backgroundImage: 'linear-gradient(rgba(0,255,157,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,157,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px', transform: 'perspective(500px) rotateX(60deg)', transformOrigin: 'bottom', pointerEvents: 'none' } }),
      // Neon glow lines
      s('container', {}, { desktop: { position: 'absolute', top: '30%', left: '0', right: '0', height: '1px', background: 'linear-gradient(90deg, transparent 5%, rgba(0,255,157,0.3) 20%, rgba(0,255,157,0.6) 50%, rgba(0,255,157,0.3) 80%, transparent 95%)', boxShadow: '0 0 20px rgba(0,255,157,0.2), 0 0 60px rgba(0,255,157,0.1)', pointerEvents: 'none' } }),
      orb('300px', 'radial-gradient(circle, rgba(0,255,157,0.08), transparent)', '20%', '70%', '80px'),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '900px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        anim(pill('◈ SYSTEM ONLINE', 'rgba(0,255,157,0.1)', 'rgba(0,255,157,0.8)'), FD()),
        anim(gText('ENTER THE\nNEXT ERA', '88px', 'linear-gradient(180deg, #fff 20%, rgba(0,255,157,0.7) 100%)'), BI(0.15)),
        anim(body('A quantum leap in digital platform technology. Zero latency. Infinite scale. Unmatched precision.'), FU(0.3)),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '16px', justifyContent: 'center' } }, [
          hover(s('button', { text: 'Initialize →', href: '#' }, { desktop: { padding: '18px 48px', background: 'rgba(0,255,157,0.1)', color: '#00ff9d', borderRadius: '4px', fontSize: '14px', fontWeight: '700', border: '1px solid rgba(0,255,157,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace' } }), { background: 'rgba(0,255,157,0.2)', boxShadow: '0 0 30px rgba(0,255,157,0.15)' }),
          ctaGhost('Documentation'),
        ]), FU(0.45)),
      ]),
    ], 'Neon Grid Hero')],
  },

  // ─── 4. MARBLE ELEGANCE HERO ─────────────────────────────────
  {
    id: 'v7-hero-marble', name: 'Marble Elegance Hero', category: 'Heroes' as SectionCategory,
    description: 'Sophisticated light-mode hero with marble texture, serif typography and refined gold accents',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'linear-gradient(145deg, #faf9f6 0%, #f5f0eb 50%, #faf9f6 100%)', padding: '0 100px' }, mobile: { padding: '60px 24px', minHeight: 'auto' } }, [
      // Marble-style overlay
      s('container', {}, { desktop: { position: 'absolute', inset: '0', opacity: '0.04', backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'400\' height=\'400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'m\'%3E%3CfeTurbulence baseFrequency=\'0.02\' numOctaves=\'6\' type=\'fractalNoise\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23m)\'/%3E%3C/svg%3E")', pointerEvents: 'none' } }),
      // Gold accent line
      s('container', {}, { desktop: { position: 'absolute', top: '0', left: '50%', width: '1px', height: '120px', background: 'linear-gradient(180deg, #c9a96e, transparent)', pointerEvents: 'none' } }),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', maxWidth: '1300px', margin: '0 auto', position: 'relative', zIndex: '2' }, mobile: { gridTemplateColumns: '1fr' } }, [
        s('container', {}, { desktop: {} }, [
          anim(s('text', { text: 'EST. 2024' }, { desktop: { fontSize: '11px', letterSpacing: '0.35em', color: '#c9a96e', marginBottom: '28px', fontWeight: '600' } }), FU()),
          anim(s('heading', { text: 'Timeless\nElegance,\nModern Craft', level: 'h1' }, { desktop: { fontSize: '68px', fontWeight: '300', color: '#1a1a1a', lineHeight: '1.1', letterSpacing: '-0.02em', marginBottom: '32px', fontFamily: 'serif' } as any, mobile: { fontSize: '40px' } }), FL(0.15)),
          anim(s('container', {}, { desktop: { width: '80px', height: '1px', background: '#c9a96e', marginBottom: '32px' } }), FU(0.3)),
          anim(bodyDark('Where classical beauty meets contemporary precision. We create digital experiences that endure.'), FU(0.35)),
          anim(s('container', {}, { desktop: { display: 'flex', gap: '20px' } }, [
            ctaDark('Discover More'),
            hover(s('button', { text: 'Our Story →', href: '#' }, { desktop: { padding: '18px 32px', background: 'transparent', color: '#1a1a1a', border: 'none', fontSize: '14px', fontWeight: '500', textDecoration: 'underline', textUnderlineOffset: '6px' } }), { color: '#c9a96e' }),
          ]), FU(0.45)),
        ]),
        // Right side - image placeholder
        anim(s('container', {}, { desktop: { aspectRatio: '3/4', background: 'linear-gradient(135deg, #e8ddd1, #d4c5b3)', borderRadius: '4px', position: 'relative', overflow: 'hidden' } }, [
          s('container', {}, { desktop: { position: 'absolute', inset: '0', border: '1px solid rgba(201,169,110,0.2)' } }),
          s('text', { text: '✦' }, { desktop: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '48px', color: 'rgba(201,169,110,0.3)' } }),
        ]), SI(0.3)),
      ]),
    ], 'Marble Elegance Hero')],
  },

  // ─── 5. SPLIT REVEAL HERO ────────────────────────────────────
  {
    id: 'v7-hero-split-reveal', name: 'Split Reveal Hero', category: 'Heroes' as SectionCategory,
    description: 'Diagonal split-screen hero with opposing slide animations and strong contrast',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
      // Left dark panel
      anim(s('container', {}, { desktop: { background: '#000', display: 'flex', alignItems: 'center', padding: '80px 60px', position: 'relative' }, mobile: { padding: '60px 24px' } }, [
        s('container', {}, { desktop: { position: 'absolute', top: '0', right: '0', bottom: '0', width: '100px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.03))', pointerEvents: 'none' } }),
        s('container', {}, { desktop: { maxWidth: '480px' } }, [
          anim(pill('NEW RELEASE'), FU(0.2)),
          anim(s('heading', { text: 'Bold Ideas\nDeserve Bold\nExecution', level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '800', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.04em', marginBottom: '24px' } as any, mobile: { fontSize: '36px' } }), FL(0.3)),
          anim(body('Transform your vision into reality with tools designed for ambitious creators who refuse to compromise.', '400px'), FU(0.4)),
          anim(cta('Start Building'), FU(0.5)),
        ]),
      ]), FL()),
      // Right light panel
      anim(s('container', {}, { desktop: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 60px', position: 'relative' }, mobile: { padding: '80px 24px' } }, [
        // Decorative circles
        s('container', {}, { desktop: { position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', top: '10%', right: '-10%', pointerEvents: 'none' } }),
        s('container', {}, { desktop: { position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', bottom: '15%', left: '-5%', pointerEvents: 'none' } }),
        s('container', {}, { desktop: { textAlign: 'center', position: 'relative', zIndex: '2' } }, [
          anim(s('text', { text: '✦' }, { desktop: { fontSize: '80px', color: 'rgba(255,255,255,0.2)', marginBottom: '24px' } }), EL(0.4)),
          anim(s('heading', { text: 'Design.\nBuild.\nLaunch.', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', lineHeight: '1.2', letterSpacing: '-0.03em' } as any }), SI(0.5)),
        ]),
      ]), FR()),
    ], 'Split Reveal Hero')],
  },

  // ─── 6. FLOATING DASHBOARD HERO ──────────────────────────────
  {
    id: 'v7-hero-dashboard', name: 'Floating Dashboard Hero', category: 'Heroes' as SectionCategory,
    description: 'SaaS hero with text on left and floating dashboard mockup with glassmorphism UI cards',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'linear-gradient(160deg, #0f0f1a 0%, #0a0a14 100%)', padding: '0 60px' }, mobile: { padding: '60px 24px', minHeight: 'auto' } }, [
      orb('600px', 'radial-gradient(circle, rgba(59,130,246,0.1), transparent 70%)', '10%', '55%', '120px'),
      gridOverlay(),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '60px', alignItems: 'center', maxWidth: '1300px', margin: '0 auto', position: 'relative', zIndex: '2' }, mobile: { gridTemplateColumns: '1fr' } }, [
        // Left text
        s('container', {}, { desktop: {} }, [
          anim(pill('🚀 LAUNCHING TODAY', 'rgba(59,130,246,0.12)', 'rgba(96,165,250,0.9)'), FU()),
          anim(gText('Your Business\nCommand Center', '62px', 'linear-gradient(135deg, #fff 40%, rgba(96,165,250,0.6) 100%)'), FL(0.15)),
          anim(body('One dashboard to monitor, analyze, and optimize every aspect of your digital operations in real-time.'), FU(0.3)),
          anim(s('container', {}, { desktop: { display: 'flex', gap: '16px' } }, [
            cta('Try For Free', 'linear-gradient(135deg, #3b82f6, #2563eb)'),
            ctaGhost('See Pricing'),
          ]), FU(0.45)),
          // Trust logos
          anim(s('container', {}, { desktop: { marginTop: '48px' } }, [
            s('text', { text: 'Trusted by 2,000+ companies' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' } }),
            s('container', {}, { desktop: { display: 'flex', gap: '24px', opacity: '0.25' } }, [
              s('text', { text: 'ACME' }, { desktop: { fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em' } }),
              s('text', { text: 'GLOBEX' }, { desktop: { fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em' } }),
              s('text', { text: 'APEX' }, { desktop: { fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em' } }),
              s('text', { text: 'NEXUS' }, { desktop: { fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em' } }),
            ]),
          ]), FU(0.55)),
        ]),
        // Right - floating dashboard
        anim(s('container', {}, { desktop: { position: 'relative', perspective: '1200px' } }, [
          hover(s('container', {}, { desktop: { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', transform: 'rotateY(-8deg) rotateX(4deg)', boxShadow: '0 32px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05)' } }, [
            // Dashboard header
            s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' } }, [
              s('text', { text: 'Analytics Overview' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.8)' } }),
              s('text', { text: 'Live ●' }, { desktop: { fontSize: '11px', color: '#22c55e', fontWeight: '600' } }),
            ]),
            // Stat cards row
            s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' } }, [
              s('container', {}, { desktop: { padding: '16px', background: 'rgba(59,130,246,0.08)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.12)' } }, [
                s('text', { text: '$48.2K' }, { desktop: { fontSize: '20px', fontWeight: '800', color: '#60a5fa', marginBottom: '4px' } }),
                s('text', { text: 'Revenue' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' } }),
              ]),
              s('container', {}, { desktop: { padding: '16px', background: 'rgba(34,197,94,0.08)', borderRadius: '12px', border: '1px solid rgba(34,197,94,0.12)' } }, [
                s('text', { text: '+24.5%' }, { desktop: { fontSize: '20px', fontWeight: '800', color: '#4ade80', marginBottom: '4px' } }),
                s('text', { text: 'Growth' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' } }),
              ]),
              s('container', {}, { desktop: { padding: '16px', background: 'rgba(168,85,247,0.08)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.12)' } }, [
                s('text', { text: '12.4K' }, { desktop: { fontSize: '20px', fontWeight: '800', color: '#c084fc', marginBottom: '4px' } }),
                s('text', { text: 'Users' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' } }),
              ]),
            ]),
            // Chart placeholder
            s('container', {}, { desktop: { height: '140px', background: 'linear-gradient(180deg, rgba(59,130,246,0.06), rgba(59,130,246,0.02))', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-end', padding: '0 12px 12px', gap: '4px' } }, [
              s('container', {}, { desktop: { flex: '1', height: '40%', background: 'linear-gradient(180deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))', borderRadius: '4px 4px 0 0' } }),
              s('container', {}, { desktop: { flex: '1', height: '65%', background: 'linear-gradient(180deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))', borderRadius: '4px 4px 0 0' } }),
              s('container', {}, { desktop: { flex: '1', height: '50%', background: 'linear-gradient(180deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))', borderRadius: '4px 4px 0 0' } }),
              s('container', {}, { desktop: { flex: '1', height: '85%', background: 'linear-gradient(180deg, rgba(59,130,246,0.4), rgba(59,130,246,0.15))', borderRadius: '4px 4px 0 0' } }),
              s('container', {}, { desktop: { flex: '1', height: '70%', background: 'linear-gradient(180deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))', borderRadius: '4px 4px 0 0' } }),
              s('container', {}, { desktop: { flex: '1', height: '90%', background: 'linear-gradient(180deg, rgba(59,130,246,0.5), rgba(59,130,246,0.2))', borderRadius: '4px 4px 0 0' } }),
              s('container', {}, { desktop: { flex: '1', height: '55%', background: 'linear-gradient(180deg, rgba(59,130,246,0.3), rgba(59,130,246,0.1))', borderRadius: '4px 4px 0 0' } }),
            ]),
          ]), { transform: 'rotateY(-4deg) rotateX(2deg)' }),
        ]), FR(0.2)),
      ]),
    ], 'Floating Dashboard Hero')],
  },

  // ─── 7. GRADIENT WAVE HERO ───────────────────────────────────
  {
    id: 'v7-hero-gradient-wave', name: 'Gradient Wave Hero', category: 'Heroes' as SectionCategory,
    description: 'Energetic hero with layered gradient waves, bold geometric shapes and modern typography',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)' } }, [
      // Wave layers
      s('container', {}, { desktop: { position: 'absolute', bottom: '0', left: '0', right: '0', height: '40%', background: 'linear-gradient(180deg, transparent 0%, rgba(99,102,241,0.08) 100%)', clipPath: 'ellipse(80% 100% at 50% 100%)', pointerEvents: 'none' } }),
      s('container', {}, { desktop: { position: 'absolute', bottom: '0', left: '0', right: '0', height: '30%', background: 'linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.06) 100%)', clipPath: 'ellipse(70% 100% at 60% 100%)', pointerEvents: 'none' } }),
      // Floating shapes
      orb('200px', 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.1))', '15%', '8%', '0'),
      orb('120px', 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(249,115,22,0.08))', '60%', '85%', '0'),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '860px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        anim(pill('⚡ SUPERCHARGED'), FD()),
        anim(gText('Build at the\nSpeed of Thought', '80px', 'linear-gradient(135deg, #fff 20%, #c4b5fd 60%, #f9a8d4 100%)'), BI(0.15)),
        anim(body('From zero to production in record time. Our platform eliminates bottlenecks so you can focus on what matters.'), FU(0.3)),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '16px', justifyContent: 'center' } }, [
          cta('Launch Now', 'linear-gradient(135deg, #8b5cf6, #ec4899)'),
          ctaGhost('Watch Demo'),
        ]), FU(0.45)),
      ]),
    ], 'Gradient Wave Hero')],
  },

  // ─── 8. MINIMAL SWISS HERO ───────────────────────────────────
  {
    id: 'v7-hero-swiss', name: 'Minimal Swiss Hero', category: 'Heroes' as SectionCategory,
    description: 'Ultra-clean Swiss design with strict grid, bold oversized type and disciplined whitespace',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', background: '#fafafa', padding: '0 80px' }, mobile: { padding: '60px 24px', minHeight: 'auto' } }, [
      // Grid lines
      s('container', {}, { desktop: { position: 'absolute', inset: '0', backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '80px 80px', pointerEvents: 'none' } }),
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: '2' } }, [
        anim(s('text', { text: 'Digital Studio' }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#999', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '48px' } }), FU()),
        anim(s('heading', { text: 'We design\nexperiences that\npeople love.', level: 'h1' }, { desktop: { fontSize: '80px', fontWeight: '900', color: '#111', lineHeight: '1.05', letterSpacing: '-0.04em', marginBottom: '48px' } as any, mobile: { fontSize: '38px' } }), FL(0.15)),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '80px', alignItems: 'flex-end' } }, [
          bodyDark('Award-winning digital studio crafting beautiful, functional products for forward-thinking brands.', '400px'),
          hover(s('button', { text: 'View Work →', href: '#' }, { desktop: { padding: '20px 52px', background: '#111', color: '#fff', borderRadius: '100px', fontSize: '14px', fontWeight: '600', border: 'none', whiteSpace: 'nowrap' } }), { background: '#333', transform: 'translateY(-2px)' }),
        ]), FU(0.35)),
        // Bottom info row
        anim(s('container', {}, { desktop: { marginTop: '80px', display: 'flex', gap: '60px', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '32px' } }, [
          s('container', {}, { desktop: {} }, [
            s('text', { text: '150+' }, { desktop: { fontSize: '32px', fontWeight: '900', color: '#111', marginBottom: '4px' } }),
            s('text', { text: 'Projects Delivered' }, { desktop: { fontSize: '12px', color: '#888', letterSpacing: '0.05em' } }),
          ]),
          s('container', {}, { desktop: {} }, [
            s('text', { text: '98%' }, { desktop: { fontSize: '32px', fontWeight: '900', color: '#111', marginBottom: '4px' } }),
            s('text', { text: 'Client Satisfaction' }, { desktop: { fontSize: '12px', color: '#888', letterSpacing: '0.05em' } }),
          ]),
          s('container', {}, { desktop: {} }, [
            s('text', { text: '12' }, { desktop: { fontSize: '32px', fontWeight: '900', color: '#111', marginBottom: '4px' } }),
            s('text', { text: 'Industry Awards' }, { desktop: { fontSize: '12px', color: '#888', letterSpacing: '0.05em' } }),
          ]),
        ]), FU(0.5)),
      ]),
    ], 'Minimal Swiss Hero')],
  },

  // ─── 9. AURORA BOREALIS HERO ─────────────────────────────────
  {
    id: 'v7-hero-aurora', name: 'Aurora Borealis Hero', category: 'Heroes' as SectionCategory,
    description: 'Ethereal hero with layered aurora color bands, subtle particle texture and dreamy gradient text',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#050510' } }, [
      // Aurora bands
      s('container', {}, { desktop: { position: 'absolute', top: '10%', left: '-10%', width: '120%', height: '30%', background: 'linear-gradient(90deg, transparent 5%, rgba(34,211,238,0.06) 20%, rgba(52,211,153,0.08) 40%, rgba(168,85,247,0.06) 60%, rgba(236,72,153,0.04) 80%, transparent 95%)', filter: 'blur(60px)', transform: 'rotate(-5deg)', animation: 'pulse 6s ease-in-out infinite', pointerEvents: 'none' } }),
      s('container', {}, { desktop: { position: 'absolute', top: '25%', left: '-5%', width: '110%', height: '20%', background: 'linear-gradient(90deg, transparent 10%, rgba(59,130,246,0.05) 30%, rgba(139,92,246,0.06) 50%, rgba(16,185,129,0.04) 70%, transparent 90%)', filter: 'blur(40px)', transform: 'rotate(-3deg)', animation: 'pulse 8s ease-in-out 2s infinite', pointerEvents: 'none' } }),
      noise(),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '820px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        anim(pill('ETHEREAL DESIGN', 'rgba(34,211,238,0.1)', 'rgba(34,211,238,0.8)'), BI()),
        anim(gText('Where Light\nMeets Code', '80px', 'linear-gradient(135deg, rgba(34,211,238,0.9) 0%, rgba(168,85,247,0.8) 50%, rgba(236,72,153,0.7) 100%)'), BI(0.2)),
        anim(body('Crafting luminous digital experiences that captivate, convert, and leave lasting impressions.'), FU(0.35)),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '16px', justifyContent: 'center' } }, [
          hover(s('button', { text: 'Begin Journey', href: '#' }, { desktop: { padding: '18px 48px', background: 'linear-gradient(135deg, rgba(34,211,238,0.15), rgba(168,85,247,0.15))', color: '#fff', borderRadius: '100px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(34,211,238,0.2)', backdropFilter: 'blur(12px)' } }), { background: 'linear-gradient(135deg, rgba(34,211,238,0.25), rgba(168,85,247,0.25))', boxShadow: '0 0 30px rgba(34,211,238,0.15)' }),
          ctaGhost('Learn More'),
        ]), FU(0.45)),
      ]),
    ], 'Aurora Borealis Hero')],
  },

  // ─── 10. BRUTALIST HERO ──────────────────────────────────────
  {
    id: 'v7-hero-brutalist', name: 'Brutalist Hero', category: 'Heroes' as SectionCategory,
    description: 'Raw brutalist design with oversized type, harsh borders, monospace text and anti-design aesthetic',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', background: '#f0efe9', padding: '0 60px', borderBottom: '4px solid #111' }, mobile: { padding: '60px 24px', minHeight: 'auto' } }, [
      // Corner markers
      s('text', { text: '001' }, { desktop: { position: 'absolute', top: '24px', left: '24px', fontSize: '11px', fontFamily: 'monospace', color: '#999' } }),
      s('text', { text: '©2026' }, { desktop: { position: 'absolute', top: '24px', right: '24px', fontSize: '11px', fontFamily: 'monospace', color: '#999' } }),
      s('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: '2' } }, [
        anim(s('heading', { text: 'WE\nMAKE\nTHINGS.', level: 'h1' }, { desktop: { fontSize: '120px', fontWeight: '900', color: '#111', lineHeight: '0.95', letterSpacing: '-0.06em', marginBottom: '40px', textTransform: 'uppercase' } as any, mobile: { fontSize: '56px' } }), FL()),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '40px', alignItems: 'flex-start', borderTop: '2px solid #111', paddingTop: '24px' } }, [
          s('text', { text: 'We are a digital studio that believes in raw honesty, functional beauty, and work that speaks for itself. No fluff. No trends. Just good work.' }, { desktop: { fontSize: '16px', color: '#444', lineHeight: '1.7', maxWidth: '400px', fontFamily: 'monospace' } }),
          s('container', {}, { desktop: { display: 'flex', gap: '12px', flexDirection: 'column' } }, [
            hover(s('button', { text: '[ENTER SITE]', href: '#' }, { desktop: { padding: '16px 40px', background: '#111', color: '#f0efe9', borderRadius: '0', fontSize: '13px', fontWeight: '700', border: 'none', fontFamily: 'monospace', letterSpacing: '0.1em' } }), { background: '#333' }),
            hover(s('button', { text: '[VIEW WORK]', href: '#' }, { desktop: { padding: '16px 40px', background: 'transparent', color: '#111', borderRadius: '0', fontSize: '13px', fontWeight: '700', border: '2px solid #111', fontFamily: 'monospace', letterSpacing: '0.1em' } }), { background: '#111', color: '#f0efe9' }),
          ]),
        ]), FU(0.3)),
      ]),
    ], 'Brutalist Hero')],
  },

  // ─── 11. GLASS MORPHISM HERO ─────────────────────────────────
  {
    id: 'v7-hero-glass', name: 'Glassmorphism Hero', category: 'Heroes' as SectionCategory,
    description: 'Premium glassmorphism hero with frosted panels, colorful orbs, and elegant layering',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 50%, #16213e 100%)' } }, [
      // Color orbs behind glass
      orb('400px', 'radial-gradient(circle, rgba(236,72,153,0.25), transparent 70%)', '10%', '15%', '80px'),
      orb('350px', 'radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%)', '50%', '65%', '80px'),
      orb('300px', 'radial-gradient(circle, rgba(34,211,238,0.2), transparent 70%)', '65%', '20%', '60px'),
      // Main glass panel
      anim(hover(s('container', {}, { desktop: { position: 'relative', zIndex: '2', maxWidth: '680px', padding: '64px 56px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '32px', textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }, mobile: { padding: '40px 24px', margin: '0 16px' } }, [
        anim(pill('✦ PREMIUM', 'rgba(255,255,255,0.06)', 'rgba(255,255,255,0.5)'), FD()),
        anim(gText('Crystal Clear\nDesign System', '64px', 'linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.4) 100%)'), BI(0.15)),
        anim(body('Transparent, beautiful, and functional. Our glassmorphic design system brings depth and elegance to every interface.', '480px'), FU(0.3)),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center' } }, [
          cta('Get Started'),
          ctaGhost('Documentation'),
        ]), FU(0.45)),
      ]), { transform: 'translateY(-4px)', boxShadow: '0 40px 100px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)' }), SI(0.1)),
    ], 'Glassmorphism Hero')],
  },

  // ─── 12. MAGAZINE COVER HERO ─────────────────────────────────
  {
    id: 'v7-hero-magazine', name: 'Magazine Cover Hero', category: 'Heroes' as SectionCategory,
    description: 'Editorial magazine cover layout with oversized display text wrapping around a central image',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f5f0', overflow: 'hidden', padding: '80px' }, mobile: { padding: '60px 24px', minHeight: 'auto' } }, [
      // Decorative border
      s('container', {}, { desktop: { position: 'absolute', inset: '24px', border: '1px solid rgba(0,0,0,0.06)', pointerEvents: 'none' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' } }, [
        anim(s('text', { text: 'ISSUE №12 — MARCH 2026' }, { desktop: { fontSize: '11px', letterSpacing: '0.3em', color: '#999', marginBottom: '40px', fontWeight: '500' } }), FU()),
        anim(s('heading', { text: 'DEFINING', level: 'h1' }, { desktop: { fontSize: '140px', fontWeight: '100', color: '#1a1a1a', lineHeight: '0.9', letterSpacing: '-0.04em', fontFamily: 'serif' } as any, mobile: { fontSize: '60px' } }), FL(0.1)),
        // Central image
        anim(s('container', {}, { desktop: { width: '280px', height: '380px', background: 'linear-gradient(135deg, #d4c5b3, #e8ddd1)', borderRadius: '4px', margin: '-20px auto -20px', position: 'relative', zIndex: '3' } }, [
          s('text', { text: '✦' }, { desktop: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '40px', color: 'rgba(0,0,0,0.08)' } }),
        ]), SI(0.2)),
        anim(s('heading', { text: 'EXCELLENCE', level: 'h1' }, { desktop: { fontSize: '140px', fontWeight: '100', color: '#1a1a1a', lineHeight: '0.9', letterSpacing: '-0.04em', fontFamily: 'serif' } as any, mobile: { fontSize: '60px' } }), FR(0.1)),
        anim(s('container', {}, { desktop: { marginTop: '48px' } }, [
          bodyDark('The definitive guide to crafting world-class digital experiences in the modern age.', '500px'),
          s('container', {}, { desktop: { display: 'flex', gap: '20px', justifyContent: 'center' } }, [
            ctaDark('Read Now'),
            hover(s('button', { text: 'Subscribe', href: '#' }, { desktop: { padding: '18px 48px', background: 'transparent', color: '#1a1a1a', borderRadius: '0', fontSize: '14px', fontWeight: '600', border: '1px solid #1a1a1a' } }), { background: '#1a1a1a', color: '#f8f5f0' }),
          ]),
        ]), FU(0.35)),
      ]),
    ], 'Magazine Cover Hero')],
  },

  // ─── 13. COSMIC DARK HERO ────────────────────────────────────
  {
    id: 'v7-hero-cosmic', name: 'Cosmic Dark Hero', category: 'Heroes' as SectionCategory,
    description: 'Deep space inspired hero with star-field dots, nebula gradients and cosmic typography',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'radial-gradient(ellipse 100% 100% at 50% 30%, #0a0a2e 0%, #030308 50%, #000 100%)' } }, [
      // Star field
      s('container', {}, { desktop: { position: 'absolute', inset: '0', backgroundImage: 'radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.4) 0%, transparent 100%), radial-gradient(1px 1px at 30% 60%, rgba(255,255,255,0.3) 0%, transparent 100%), radial-gradient(1px 1px at 50% 10%, rgba(255,255,255,0.5) 0%, transparent 100%), radial-gradient(1px 1px at 70% 80%, rgba(255,255,255,0.3) 0%, transparent 100%), radial-gradient(1px 1px at 90% 40%, rgba(255,255,255,0.4) 0%, transparent 100%), radial-gradient(1px 1px at 15% 85%, rgba(255,255,255,0.2) 0%, transparent 100%), radial-gradient(1px 1px at 85% 15%, rgba(255,255,255,0.3) 0%, transparent 100%), radial-gradient(1px 1px at 45% 45%, rgba(255,255,255,0.4) 0%, transparent 100%)', pointerEvents: 'none' } }),
      // Nebula
      orb('600px', 'radial-gradient(circle, rgba(99,102,241,0.08), rgba(168,85,247,0.04), transparent)', '20%', '30%', '100px'),
      orb('400px', 'radial-gradient(circle, rgba(236,72,153,0.06), transparent)', '50%', '60%', '80px'),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '880px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        anim(s('text', { text: '· · · ✦ · · ·' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.15)', marginBottom: '32px', letterSpacing: '0.3em' } }), BI()),
        anim(gText('Beyond the\nHorizon', '88px', 'linear-gradient(180deg, #fff 20%, rgba(165,148,255,0.5) 80%)'), BI(0.15)),
        anim(body('Explore infinite possibilities in a universe of design. Where every pixel tells a story and every interaction leaves a mark.'), FU(0.3)),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '16px', justifyContent: 'center' } }, [
          cta('Explore Now', 'linear-gradient(135deg, #6366f1, #a855f7)'),
          ctaGhost('Star Map →'),
        ]), FU(0.45)),
      ]),
    ], 'Cosmic Dark Hero')],
  },

  // ─── 14. ARCHITECTURAL HERO ──────────────────────────────────
  {
    id: 'v7-hero-architectural', name: 'Architectural Hero', category: 'Heroes' as SectionCategory,
    description: 'Clean architectural layout with strong vertical rhythm, ruled lines and precision spacing',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#fff', overflow: 'hidden' }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
      // Left content
      s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px', borderRight: '1px solid rgba(0,0,0,0.06)' }, mobile: { padding: '60px 24px', borderRight: 'none', borderBottom: '1px solid rgba(0,0,0,0.06)' } }, [
        anim(s('text', { text: 'ARCHITECTURE + DESIGN' }, { desktop: { fontSize: '10px', letterSpacing: '0.3em', color: '#aaa', marginBottom: '48px', fontWeight: '600' } }), FU()),
        anim(s('heading', { text: 'Building\nTomorrow,\nToday.', level: 'h1' }, { desktop: { fontSize: '64px', fontWeight: '300', color: '#111', lineHeight: '1.1', letterSpacing: '-0.02em', marginBottom: '40px' } as any, mobile: { fontSize: '40px' } }), FL(0.15)),
        anim(s('container', {}, { desktop: { width: '40px', height: '40px', borderLeft: '2px solid #111', borderBottom: '2px solid #111', marginBottom: '32px' } }), FU(0.25)),
        anim(bodyDark('We create structures that inspire. Digital spaces that breathe. Interfaces that endure the test of time.', '400px'), FU(0.3)),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '20px' } }, [
          ctaDark('Our Work'),
          hover(s('button', { text: 'Contact', href: '#' }, { desktop: { padding: '18px 40px', background: 'transparent', color: '#111', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: '1px solid #ddd' } }), { borderColor: '#111' }),
        ]), FU(0.4)),
      ]),
      // Right visual
      anim(s('container', {}, { desktop: { background: 'linear-gradient(135deg, #f5f5f0, #e8e8e0)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }, mobile: { minHeight: '400px' } }, [
        // Grid overlay
        s('container', {}, { desktop: { position: 'absolute', inset: '0', backgroundImage: 'linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' } }),
        s('container', {}, { desktop: { width: '200px', height: '200px', border: '1px solid rgba(0,0,0,0.08)', position: 'relative' } }, [
          s('container', {}, { desktop: { position: 'absolute', top: '-30px', left: '-30px', width: '60px', height: '60px', background: '#111' } }),
          s('container', {}, { desktop: { position: 'absolute', bottom: '-20px', right: '-20px', width: '100px', height: '100px', border: '1px solid rgba(0,0,0,0.08)' } }),
        ]),
      ]), FR(0.2)),
    ], 'Architectural Hero')],
  },

  // ─── 15. GRADIENT MESH HERO ──────────────────────────────────
  {
    id: 'v7-hero-mesh', name: 'Gradient Mesh Hero', category: 'Heroes' as SectionCategory,
    description: 'Vibrant gradient mesh background with centered content, animated badges and premium feel',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)' } }, [
      // Mesh overlay
      s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(0,0,0,0.1) 0%, transparent 60%)', pointerEvents: 'none' } }),
      noise(),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '800px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        anim(hover(s('container', {}, { desktop: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '32px' } }, [
          s('text', { text: '🎉' }, { desktop: { fontSize: '14px' } }),
          s('text', { text: 'Just launched our V7 platform' }, { desktop: { fontSize: '13px', color: '#fff', fontWeight: '500' } }),
          s('text', { text: '→' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.7)' } }),
        ]), { background: 'rgba(255,255,255,0.2)' }), FD()),
        anim(s('heading', { text: 'Make Something\nWonderful', level: 'h1' }, { desktop: { fontSize: '80px', fontWeight: '800', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.045em', marginBottom: '24px', textShadow: '0 2px 40px rgba(0,0,0,0.15)' } as any, mobile: { fontSize: '42px' } }), BI(0.15)),
        anim(s('text', { text: 'The creative platform for teams who want to move fast, think big, and build products that people actually love.' }, { desktop: { fontSize: '19px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.75', maxWidth: '560px', margin: '0 auto 44px' } }), FU(0.3)),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '14px', justifyContent: 'center' } }, [
          hover(s('button', { text: 'Start Free', href: '#' }, { desktop: { padding: '18px 48px', background: '#fff', color: '#764ba2', borderRadius: '12px', fontSize: '15px', fontWeight: '700', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.15)' } }), { transform: 'translateY(-2px)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }),
          hover(s('button', { text: 'Talk to Sales', href: '#' }, { desktop: { padding: '18px 48px', background: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(12px)' } }), { background: 'rgba(255,255,255,0.25)' }),
        ]), FU(0.45)),
        // Bottom social proof
        anim(s('container', {}, { desktop: { marginTop: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' } }, [
          s('container', {}, { desktop: { display: 'flex' } }, [
            s('container', {}, { desktop: { width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)' } }),
            s('container', {}, { desktop: { width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', marginLeft: '-8px' } }),
            s('container', {}, { desktop: { width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', marginLeft: '-8px' } }),
            s('container', {}, { desktop: { width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', marginLeft: '-8px' } }),
          ]),
          s('text', { text: 'Join 10,000+ creators worldwide' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' } }),
        ]), FU(0.6)),
      ]),
    ], 'Gradient Mesh Hero')],
  },

  // ══════════════════════════════════════════════════════════════════
  // PREMIUM NAVBARS V7
  // ══════════════════════════════════════════════════════════════════

  // 1. EDITORIAL SERIF NAVBAR — Magazine-style with elegant serif typography
  {
    id: 'v7-editorial-nav', name: '📰 Editorial Serif Navbar', category: 'Navbars' as SectionCategory,
    description: 'Magazine-style navbar with elegant serif typography and editorial feel',
    elements: [anim(s('navbar', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 64px', backgroundColor: '#0a0a0a', borderBottom: '1px solid rgba(255,255,255,0.05)' }, mobile: { padding: '16px 24px' } }, [
      s('text', { text: 'The Chronicle' }, { desktop: { fontSize: '22px', fontWeight: '400', color: '#fff', fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.01em', fontStyle: 'italic' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '40px', alignItems: 'center' } }, [
        ...'Editorial,Culture,Design,Archive,About'.split(',').map(t =>
          hover(s('link', { text: t, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: '400', fontFamily: 'Georgia, "Times New Roman", serif', textDecoration: 'none', transition: 'color 0.3s, letter-spacing 0.3s', letterSpacing: '0.04em' } }), { color: '#fff', letterSpacing: '0.08em' })
        ),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '16px', alignItems: 'center' } }, [
        hover(s('button', { text: 'Subscribe', href: '#' }, { desktop: { padding: '10px 28px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', borderRadius: '0', fontSize: '12px', fontWeight: '400', border: '1px solid rgba(255,255,255,0.15)', fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '0.1em', textTransform: 'uppercase' as any, transition: 'all 0.3s' } }), { borderColor: '#fff', color: '#fff' }),
      ]),
    ]), FD())],
  },

  // 2. MONOSPACE TECH NAVBAR — Developer/hacker aesthetic with monospace font
  {
    id: 'v7-monospace-nav', name: '⌨️ Monospace Tech Navbar', category: 'Navbars' as SectionCategory,
    description: 'Developer-aesthetic navbar with monospace typography and terminal vibes',
    elements: [anim(s('navbar', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 56px', backgroundColor: '#030303', borderBottom: '1px solid rgba(0,255,136,0.08)' }, mobile: { padding: '14px 20px' } }, [
      s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
        s('text', { text: '>' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#00ff88', fontFamily: '"JetBrains Mono", "Fira Code", monospace' } }),
        s('text', { text: 'devstack' }, { desktop: { fontSize: '15px', fontWeight: '600', color: '#fff', fontFamily: '"JetBrains Mono", "Fira Code", monospace', letterSpacing: '-0.02em' } }),
        s('text', { text: '.io' }, { desktop: { fontSize: '15px', fontWeight: '400', color: 'rgba(0,255,136,0.6)', fontFamily: '"JetBrains Mono", "Fira Code", monospace' } }),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '32px', alignItems: 'center' } }, [
        ...'docs,api,pricing,changelog,blog'.split(',').map(t =>
          hover(s('link', { text: `/${t}`, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '400', fontFamily: '"JetBrains Mono", "Fira Code", monospace', textDecoration: 'none', transition: 'color 0.2s' } }), { color: '#00ff88' })
        ),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '12px', alignItems: 'center' } }, [
        hover(s('button', { text: '$ login', href: '#' }, { desktop: { padding: '8px 20px', backgroundColor: 'rgba(0,255,136,0.06)', color: 'rgba(0,255,136,0.8)', borderRadius: '4px', fontSize: '13px', fontWeight: '500', border: '1px solid rgba(0,255,136,0.15)', fontFamily: '"JetBrains Mono", "Fira Code", monospace', transition: 'all 0.2s' } }), { backgroundColor: 'rgba(0,255,136,0.12)', borderColor: 'rgba(0,255,136,0.3)' }),
        s('button', { text: '→ deploy', href: '#' }, { desktop: { padding: '8px 24px', backgroundColor: '#00ff88', color: '#000', borderRadius: '4px', fontSize: '13px', fontWeight: '600', border: 'none', fontFamily: '"JetBrains Mono", "Fira Code", monospace' } }),
      ]),
    ]), FD())],
  },

  // 3. LUXURY BRAND NAVBAR — Ultra-minimal with wide letter-spacing and gold accent
  {
    id: 'v7-luxury-nav', name: '💎 Luxury Brand Navbar', category: 'Navbars' as SectionCategory,
    description: 'Ultra-minimal luxury navbar with wide tracking and gold accents',
    elements: [anim(s('navbar', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 80px', backgroundColor: '#050505', borderBottom: '1px solid rgba(212,175,55,0.08)' }, mobile: { padding: '20px 24px' } }, [
      s('text', { text: 'M A I S O N' }, { desktop: { fontSize: '14px', fontWeight: '300', color: '#d4af37', letterSpacing: '0.35em', fontFamily: '"Didot", "Playfair Display", Georgia, serif' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '48px', alignItems: 'center' } }, [
        ...'Collections,Atelier,Heritage,Boutiques,Journal'.split(',').map(t =>
          hover(s('link', { text: t.toUpperCase(), href: '#' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.35)', fontWeight: '400', letterSpacing: '0.25em', textDecoration: 'none', transition: 'color 0.4s' } }), { color: '#d4af37' })
        ),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '20px', alignItems: 'center' } }, [
        hover(s('link', { text: 'ENQUIRE', href: '#' }, { desktop: { fontSize: '10px', color: 'rgba(212,175,55,0.6)', fontWeight: '400', letterSpacing: '0.2em', textDecoration: 'none', transition: 'color 0.3s', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '2px' } }), { color: '#d4af37', borderBottomColor: '#d4af37' }),
      ]),
    ]), FD())],
  },

  // 4. GRADIENT PILL NAVBAR — Floating pill with gradient border and modern sans
  {
    id: 'v7-gradient-pill-nav', name: '🌈 Gradient Pill Navbar', category: 'Navbars' as SectionCategory,
    description: 'Floating pill navbar with gradient border glow and modern typography',
    elements: [anim(s('navbar', {}, { desktop: { position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', width: '88%', maxWidth: '1100px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', backgroundColor: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(24px)', borderRadius: '100px', border: '1px solid transparent', backgroundClip: 'padding-box', boxShadow: '0 0 0 1px rgba(99,102,241,0.15), 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)', zIndex: '1000' }, mobile: { padding: '12px 20px', width: '94%' } }, [
      s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '10px' } }, [
        s('container', {}, { desktop: { width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
          s('text', { text: 'N' }, { desktop: { fontSize: '14px', fontWeight: '800', color: '#fff' } }),
        ]),
        s('text', { text: 'Nexus' }, { desktop: { fontSize: '17px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' } }),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '28px', alignItems: 'center' } }, [
        ...'Features,Templates,Pricing,Resources'.split(',').map(t =>
          hover(s('link', { text: t, href: '#' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '500', textDecoration: 'none', transition: 'color 0.25s' } }), { color: '#fff' })
        ),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '10px', alignItems: 'center' } }, [
        hover(s('button', { text: 'Log In', href: '#' }, { desktop: { padding: '8px 18px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', borderRadius: '100px', fontSize: '13px', fontWeight: '500', border: 'none', transition: 'color 0.2s' } }), { color: '#fff' }),
        s('button', { text: 'Get Started', href: '#' }, { desktop: { padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '100px', fontSize: '13px', fontWeight: '600', border: 'none', boxShadow: '0 4px 15px rgba(99,102,241,0.3)' } }),
      ]),
    ]), FD())],
  },

  // 5. SPLIT TONE NAVBAR — Half dark / half accent with diagonal cut
  {
    id: 'v7-split-tone-nav', name: '🎭 Split Tone Navbar', category: 'Navbars' as SectionCategory,
    description: 'Bold split-tone navbar with contrasting halves and geometric accent',
    elements: [anim(s('navbar', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }, mobile: {} }, [
      s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '40px', padding: '22px 60px', flex: '1' }, mobile: { padding: '16px 24px' } }, [
        s('text', { text: 'CONSTRUCT' }, { desktop: { fontSize: '16px', fontWeight: '900', color: '#fff', letterSpacing: '0.12em' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '32px' } }, [
          ...'Studio,Projects,Process,Awards'.split(',').map(t =>
            hover(s('link', { text: t, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: '500', textDecoration: 'none', transition: 'color 0.3s' } }), { color: '#fff' })
          ),
        ]),
      ]),
      s('container', {}, { desktop: { display: 'flex', alignItems: 'center', padding: '22px 60px', backgroundColor: '#ff4d00', clipPath: 'polygon(24px 0, 100% 0, 100% 100%, 0 100%)' }, mobile: { padding: '16px 24px', clipPath: 'none' } }, [
        hover(s('button', { text: 'START A PROJECT →', href: '#' }, { desktop: { padding: '0', backgroundColor: 'transparent', color: '#000', borderRadius: '0', fontSize: '12px', fontWeight: '800', border: 'none', letterSpacing: '0.1em', transition: 'letter-spacing 0.3s' } }), { letterSpacing: '0.15em' }),
      ]),
    ]), FD())],
  },

  // 6. BRUTALIST UPPERCASE NAVBAR — Raw, bold, no-frills typography
  {
    id: 'v7-brutalist-nav', name: '🏗️ Brutalist Uppercase Navbar', category: 'Navbars' as SectionCategory,
    description: 'Raw brutalist navbar with bold uppercase type and stark contrast',
    elements: [anim(s('navbar', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 60px', backgroundColor: '#fff', borderBottom: '3px solid #000' }, mobile: { padding: '16px 20px' } }, [
      s('text', { text: 'ATELIER™' }, { desktop: { fontSize: '24px', fontWeight: '900', color: '#000', letterSpacing: '-0.03em', lineHeight: '1' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '36px', alignItems: 'center' } }, [
        ...'WORK,ABOUT,SERVICES,CONTACT'.split(',').map(t =>
          hover(s('link', { text: t, href: '#' }, { desktop: { fontSize: '12px', color: '#000', fontWeight: '700', letterSpacing: '0.08em', textDecoration: 'none', borderBottom: '2px solid transparent', paddingBottom: '4px', transition: 'border-color 0.2s' } }), { borderBottomColor: '#000' })
        ),
      ]),
      s('button', { text: 'HIRE US', href: '#' }, { desktop: { padding: '14px 32px', backgroundColor: '#000', color: '#fff', borderRadius: '0', fontSize: '12px', fontWeight: '800', border: 'none', letterSpacing: '0.1em' } }),
    ]), FD())],
  },

  // 7. NEON GLOW NAVBAR — Cyberpunk-inspired with neon accents
  {
    id: 'v7-neon-nav', name: '💜 Neon Glow Navbar', category: 'Navbars' as SectionCategory,
    description: 'Cyberpunk-style navbar with neon glow effects and electric typography',
    elements: [anim(s('navbar', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 56px', backgroundColor: 'rgba(5,0,15,0.95)', borderBottom: '1px solid rgba(139,92,246,0.15)', boxShadow: '0 4px 30px rgba(139,92,246,0.05)' }, mobile: { padding: '14px 20px' } }, [
      s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '10px' } }, [
        s('text', { text: '◈' }, { desktop: { fontSize: '24px', color: '#a855f7', textShadow: '0 0 20px rgba(168,85,247,0.5), 0 0 40px rgba(168,85,247,0.2)' } }),
        s('text', { text: 'SYNTHWAVE' }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '0.15em', textShadow: '0 0 10px rgba(255,255,255,0.1)' } }),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '36px', alignItems: 'center' } }, [
        ...'Explore,Create,Gallery,Community'.split(',').map(t =>
          hover(s('link', { text: t, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', textDecoration: 'none', transition: 'all 0.3s', letterSpacing: '0.03em' } }), { color: '#a855f7', textShadow: '0 0 8px rgba(168,85,247,0.4)' })
        ),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '12px', alignItems: 'center' } }, [
        hover(s('button', { text: 'Sign In', href: '#' }, { desktop: { padding: '9px 22px', backgroundColor: 'transparent', color: 'rgba(168,85,247,0.7)', borderRadius: '6px', fontSize: '13px', fontWeight: '500', border: '1px solid rgba(168,85,247,0.2)', transition: 'all 0.3s' } }), { borderColor: 'rgba(168,85,247,0.5)', color: '#a855f7' }),
        s('button', { text: 'Launch App', href: '#' }, { desktop: { padding: '9px 26px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: '600', border: 'none', boxShadow: '0 4px 20px rgba(124,58,237,0.35), 0 0 40px rgba(168,85,247,0.1)' } }),
      ]),
    ]), FD())],
  },

  // 8. CLEAN GEOMETRIC NAVBAR — Modern SaaS with geometric logo mark
  {
    id: 'v7-geometric-nav', name: '⬡ Clean Geometric Navbar', category: 'Navbars' as SectionCategory,
    description: 'Modern SaaS navbar with geometric logo, clean sans-serif type, and subtle hover states',
    elements: [anim(s('navbar', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', backgroundColor: '#fafafa', borderBottom: '1px solid #eee' }, mobile: { padding: '14px 20px' } }, [
      s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
        s('container', {}, { desktop: { width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, #111 0%, #333 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
          s('text', { text: 'A' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff' } }),
        ]),
        s('text', { text: 'Artifact' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#111', letterSpacing: '-0.02em' } }),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '32px', alignItems: 'center' } }, [
        ...'Product,Solutions,Customers,Pricing,Docs'.split(',').map(t =>
          hover(s('link', { text: t, href: '#' }, { desktop: { fontSize: '14px', color: '#666', fontWeight: '500', textDecoration: 'none', transition: 'color 0.2s' } }), { color: '#111' })
        ),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '12px', alignItems: 'center' } }, [
        hover(s('button', { text: 'Sign In', href: '#' }, { desktop: { padding: '9px 20px', backgroundColor: 'transparent', color: '#333', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: 'none', transition: 'background 0.2s' } }), { backgroundColor: '#f0f0f0' }),
        s('button', { text: 'Start Free', href: '#' }, { desktop: { padding: '9px 24px', backgroundColor: '#111', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none' } }),
      ]),
    ]), FD())],
  },
];
