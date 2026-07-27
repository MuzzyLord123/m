import { EditorElement } from '../types';
import { SectionBlock, SectionCategory } from './sectionBlocks';

let _sc6 = 0;
function sid(): string { _sc6++; return `sv6-${_sc6}-${Math.random().toString(36).slice(2, 7)}`; }
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
const SD = (d = 0) => ({ type: 'slideUp' as const, duration: 0.7, delay: d, trigger: 'onView' as const });
const RI = (d = 0) => ({ type: 'rotateIn' as const, duration: 1, delay: d, trigger: 'onView' as const });
const EL = (d = 0) => ({ type: 'elastic' as const, duration: 1.2, delay: d, trigger: 'onView' as const });
const FD = (d = 0) => ({ type: 'fadeInDown' as const, duration: 0.8, delay: d, trigger: 'onView' as const });

// ── helpers ──
const pill = (text: string, color = 'rgba(99,102,241,0.15)', textColor = 'rgba(147,130,255,0.9)') =>
  s('text', { text }, { desktop: { display: 'inline-block', fontSize: '11px', letterSpacing: '0.2em', fontWeight: '700', color: textColor, backgroundColor: color, padding: '6px 18px', borderRadius: '100px', marginBottom: '20px' } });

const gradientText = (text: string, size = '64px', gradient = 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.35) 100%)') =>
  s('heading', { text, level: 'h2' }, { desktop: { fontSize: size, fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1.05', background: gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '24px' } as any, mobile: { fontSize: `calc(${size} * 0.6)` } });

const body = (text: string) =>
  s('text', { text }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.75', maxWidth: '540px' } });

const glassBg = (extra = {}): any => ({ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', backdropFilter: 'blur(20px)', ...extra });

export const PREMIUM_SECTION_BLOCKS_V6: SectionBlock[] = [

  // ══════════════════════════════════════════════
  // 1. TRANSLUCENT FLOATING NAVBAR
  // ══════════════════════════════════════════════
  {
    id: 'v6-glass-navbar', name: '✨ Translucent Glass Navbar', category: 'Navbars' as SectionCategory,
    description: 'Floating glassmorphic navbar with blur backdrop and animated links',
    elements: [anim(s('navbar', {}, { desktop: { position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', width: '92%', maxWidth: '1200px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 32px', backgroundColor: 'rgba(10,10,10,0.65)', backdropFilter: 'blur(24px) saturate(180%)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', zIndex: '1000', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }, mobile: { padding: '12px 20px', width: '95%' } }, [
      s('text', { text: 'STUDIO' }, { desktop: { fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '0.15em' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '32px', alignItems: 'center' } }, [
        ...'Products,Solutions,Pricing,Company'.split(',').map(t =>
          hover(s('link', { text: t, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontWeight: '500', transition: 'color 0.3s' } }), { color: '#fff' })
        ),
      ]),
      s('button', { text: 'Get Started', href: '#' }, { desktop: { padding: '10px 24px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none' } }),
    ]), FD())],
  },

  // 2. DARK MEGA NAVBAR
  {
    id: 'v6-mega-navbar', name: '🔮 Premium Dark Navbar', category: 'Navbars' as SectionCategory,
    description: 'Ultra-dark navbar with animated accent line and brand glow',
    elements: [anim(s('navbar', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 60px', backgroundColor: 'rgba(5,5,5,0.95)', borderBottom: '1px solid rgba(255,255,255,0.04)', position: 'relative' }, mobile: { padding: '16px 24px' } }, [
      s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
        s('text', { text: '◆' }, { desktop: { fontSize: '22px', color: '#6366f1' } }),
        s('text', { text: 'MERIDIAN' }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#fff', letterSpacing: '0.18em' } }),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '40px', alignItems: 'center' } }, [
        ...'Features,Integrations,Pricing,Resources'.split(',').map(t =>
          hover(s('link', { text: t, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', transition: 'all 0.3s', position: 'relative' } }), { color: '#fff' })
        ),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
        hover(s('button', { text: 'Sign In', href: '#' }, { desktop: { padding: '10px 20px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', borderRadius: '8px', fontSize: '13px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.08)' } }), { borderColor: 'rgba(255,255,255,0.2)', color: '#fff' }),
        s('button', { text: 'Start Free', href: '#' }, { desktop: { padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none' } }),
      ]),
    ]), FD())],
  },

  // 3. TRANSLUCENT LIGHT NAVBAR
  {
    id: 'v6-light-glass-nav', name: '🌿 Frosted Light Navbar', category: 'Navbars' as SectionCategory,
    description: 'Light translucent navbar with frosted glass and warm tones',
    elements: [anim(s('navbar', {}, { desktop: { position: 'fixed', top: '12px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '1100px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 28px', backgroundColor: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(20px) saturate(150%)', borderRadius: '14px', border: '1px solid rgba(0,0,0,0.06)', zIndex: '1000', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }, mobile: { padding: '10px 16px' } }, [
      s('text', { text: 'flora' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#1a1a1a', fontStyle: 'italic' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '28px' } }, [
        ...'Shop,About,Journal,Contact'.split(',').map(t =>
          hover(s('link', { text: t, href: '#' }, { desktop: { fontSize: '14px', color: '#555', fontWeight: '500', transition: 'color 0.3s' } }), { color: '#000' })
        ),
      ]),
      s('button', { text: 'Shop Now', href: '#' }, { desktop: { padding: '10px 24px', backgroundColor: '#1a1a1a', color: '#fff', borderRadius: '100px', fontSize: '13px', fontWeight: '600', border: 'none' } }),
    ]), FD())],
  },

  // 4. PARALLAX DEPTH HERO
  {
    id: 'v6-parallax-hero', name: '🌌 Parallax Depth Hero', category: 'Heroes' as SectionCategory,
    description: 'Multi-layer parallax hero with floating orbs and depth perception',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden', background: 'linear-gradient(180deg, #050510 0%, #0a0a1a 40%, #0f0f24 100%)' } }, [
      // Floating orbs
      s('container', {}, { desktop: { position: 'absolute', top: '10%', left: '15%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%)', filter: 'blur(60px)', animation: 'float 6s ease-in-out infinite' } }),
      s('container', {}, { desktop: { position: 'absolute', bottom: '15%', right: '10%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)', filter: 'blur(50px)', animation: 'float 8s ease-in-out infinite reverse' } }),
      s('container', {}, { desktop: { position: 'absolute', top: '40%', right: '30%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.1), transparent 70%)', filter: 'blur(40px)', animation: 'float 7s ease-in-out infinite 1s' } }),
      // Content
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', maxWidth: '800px', padding: '0 60px', margin: '0 auto', textAlign: 'center' }, mobile: { padding: '0 24px' } }, [
        anim(pill('INFINITE POSSIBILITIES'), FU()),
        anim(gradientText('Create Without\nBoundaries', '88px', 'linear-gradient(180deg, #e0e7ff 0%, rgba(147,130,255,0.5) 100%)'), BI()),
        anim(body('Experience the next evolution of digital creation. Where imagination meets infinite computational power.'), FU(0.3)),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '48px' } }, [
          s('button', { text: 'Enter the Future', href: '#' }, { desktop: { padding: '20px 48px', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '700', border: 'none', boxShadow: '0 0 40px rgba(99,102,241,0.3)' } }),
          s('button', { text: 'Explore →', href: '#' }, { desktop: { padding: '20px 48px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', borderRadius: '12px', fontSize: '15px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.1)' } }),
        ]), FU(0.5)),
      ]),
    ])],
  },

  // 5. EDITORIAL SPLIT HERO
  {
    id: 'v6-editorial-hero', name: '📰 Editorial Split Hero', category: 'Heroes' as SectionCategory,
    description: 'Magazine-style split layout with oversized typography',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh', backgroundColor: '#0a0a0a' }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
      s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 80px', gap: '32px' }, mobile: { padding: '60px 24px' } }, [
        anim(s('text', { text: 'Issue 47 — Spring 2026' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: '500' } }), FU()),
        anim(s('heading', { text: 'The Art of\nDigital\nCraftsmanship', level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '200', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.03em', fontFamily: "'Georgia', serif" } as any, mobile: { fontSize: '42px' } }), FL()),
        anim(s('container', {}, { desktop: { width: '60px', height: '1px', backgroundColor: 'rgba(255,255,255,0.2)' } }), FU(0.3)),
        anim(s('text', { text: 'We explore the intersection of technology and design, where every pixel carries intention and every interaction tells a story.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8', maxWidth: '400px' } }), FU(0.4)),
        anim(s('button', { text: 'Read the Story', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: 'transparent', color: '#fff', borderRadius: '0', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', alignSelf: 'flex-start' } }), FU(0.5)),
      ]),
      anim(s('container', {}, { desktop: { backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800)', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '100vh' }, mobile: { minHeight: '50vh' } }), FR()),
    ])],
  },

  // 6. ANIMATED STATS COUNTER BAR
  {
    id: 'v6-stats-bar', name: '📊 Animated Stats Bar', category: 'Stats' as SectionCategory,
    description: 'Horizontal animated counter stats with gradient accents',
    elements: [s('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#050505', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' } }, [
        ...([['10M+', 'Active Users', '#6366f1'], ['99.9%', 'Uptime SLA', '#22d3ee'], ['150+', 'Countries', '#f59e0b'], ['4.9/5', 'Rating', '#ec4899']] as [string, string, string][]).map(([num, label, color], i) =>
          anim(s('container', {}, { desktop: { textAlign: 'center', padding: '32px 0' } }, [
            s('heading', { text: num, level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '800', background: `linear-gradient(135deg, ${color}, ${color}88)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px', letterSpacing: '-0.03em' } as any }),
            s('text', { text: label }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', letterSpacing: '0.05em' } }),
          ]), EL(i * 0.15)),
        ),
      ]),
    ])],
  },

  // 7. FLOATING CARD GRID FEATURES
  {
    id: 'v6-floating-features', name: '🃏 Floating Card Features', category: 'Features' as SectionCategory,
    description: 'Cards with 3D hover lift effect and gradient borders',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#08080c' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { textAlign: 'center', maxWidth: '700px', margin: '0 auto 72px' } }, [
        pill('FEATURES'),
        gradientText('Powerful by Design'),
        body('Every feature is crafted with obsessive attention to detail and performance.'),
      ]), BI()),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...([['🚀', 'Blazing Speed', 'Edge-optimized delivery with 50ms global response times.'], ['🔒', 'Enterprise Security', 'SOC2 compliant with end-to-end encryption.'], ['⚡', 'Real-time Sync', 'Instant collaboration across all devices.'], ['🎨', 'Design System', 'Built-in tokens, variants, and theming.'], ['📊', 'Deep Analytics', 'Actionable insights with AI-powered reports.'], ['🔌', 'Integrations', '200+ native integrations, plus custom API.']] as [string, string, string][]).map(([icon, title, desc], i) =>
          anim(hover(s('card', {}, { desktop: { padding: '40px 32px', ...glassBg(), transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)', cursor: 'pointer' } }, [
            s('text', { text: icon }, { desktop: { fontSize: '32px', marginBottom: '20px' } }),
            s('heading', { text: title, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
            s('text', { text: desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
          ]), { transform: 'translateY(-8px)', boxShadow: '0 20px 60px rgba(99,102,241,0.15)', borderColor: 'rgba(99,102,241,0.2)' }), SD(i * 0.1)),
        ),
      ]),
    ])],
  },

  // 8. CINEMATIC TESTIMONIAL CAROUSEL
  {
    id: 'v6-cinema-testimonials', name: '🎬 Cinematic Testimonials', category: 'Testimonials' as SectionCategory,
    description: 'Large-format testimonial with cinematic gradient backdrop',
    elements: [s('section', {}, { desktop: { padding: '140px 60px', background: 'linear-gradient(180deg, #0a0a0a, #0f0a1a, #0a0a0a)', position: 'relative', overflow: 'hidden' }, mobile: { padding: '80px 24px' } }, [
      s('container', {}, { desktop: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)', filter: 'blur(80px)' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', maxWidth: '800px', margin: '0 auto', textAlign: 'center' } }, [
        anim(s('text', { text: '★★★★★' }, { desktop: { fontSize: '24px', marginBottom: '40px', color: '#f59e0b' } }), SI()),
        anim(s('heading', { text: '"This platform completely transformed how our team approaches design. The results speak for themselves — 3x faster delivery, zero compromise on quality."', level: 'h2' }, { desktop: { fontSize: '32px', fontWeight: '400', color: 'rgba(255,255,255,0.85)', lineHeight: '1.5', letterSpacing: '-0.01em', fontFamily: "'Georgia', serif", marginBottom: '48px' } as any, mobile: { fontSize: '22px' } }), BI()),
        anim(s('container', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' } }, [
          s('container', {}, { desktop: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' } }),
          s('container', {}, { desktop: {} }, [
            s('text', { text: 'Sarah Chen' }, { desktop: { fontSize: '15px', fontWeight: '600', color: '#fff' } }),
            s('text', { text: 'VP of Design, Stripe' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }),
          ]),
        ]), FU(0.4)),
      ]),
    ])],
  },

  // 9. GRADIENT PRICING CARDS
  {
    id: 'v6-gradient-pricing', name: '💎 Gradient Pricing Cards', category: 'Pricing' as SectionCategory,
    description: 'Three-tier pricing with popular plan highlighted by gradient border',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#08080c' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { textAlign: 'center', maxWidth: '600px', margin: '0 auto 72px' } }, [
        pill('PRICING'),
        gradientText('Simple, Transparent Pricing'),
        body('No hidden fees. Start free, scale when ready.'),
      ]), FU()),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1100px', margin: '0 auto', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', gap: '20px' } }, [
        // Starter
        anim(s('card', {}, { desktop: { padding: '48px 36px', ...glassBg(), textAlign: 'center' } }, [
          s('text', { text: 'Starter' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: '0.1em', marginBottom: '16px' } }),
          s('heading', { text: '$0', level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '4px' } }),
          s('text', { text: '/month' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' } }),
          ...['5 Projects', '1GB Storage', 'Community Support', 'Basic Analytics'].map(f =>
            s('text', { text: `✓  ${f}` }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', padding: '8px 0', textAlign: 'left' } })
          ),
          s('button', { text: 'Get Started', href: '#' }, { desktop: { width: '100%', padding: '14px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.08)', marginTop: '32px' } }),
        ]), FU(0)),
        // Pro (highlighted)
        anim(s('card', {}, { desktop: { padding: '56px 36px', background: 'linear-gradient(180deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))', borderRadius: '24px', border: '1px solid rgba(99,102,241,0.25)', textAlign: 'center', boxShadow: '0 0 60px rgba(99,102,241,0.1)', position: 'relative' } }, [
          s('text', { text: 'MOST POPULAR' }, { desktop: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: '700', color: '#fff', backgroundColor: '#6366f1', padding: '4px 16px', borderRadius: '100px', letterSpacing: '0.15em' } }),
          s('text', { text: 'Pro' }, { desktop: { fontSize: '14px', color: 'rgba(147,130,255,0.9)', fontWeight: '600', letterSpacing: '0.1em', marginBottom: '16px' } }),
          s('heading', { text: '$29', level: 'h3' }, { desktop: { fontSize: '56px', fontWeight: '800', color: '#fff', marginBottom: '4px' } }),
          s('text', { text: '/month' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' } }),
          ...['Unlimited Projects', '100GB Storage', 'Priority Support', 'Advanced Analytics', 'Custom Domains', 'Team Collaboration'].map(f =>
            s('text', { text: `✓  ${f}` }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)', padding: '8px 0', textAlign: 'left' } })
          ),
          s('button', { text: 'Start Pro Trial', href: '#' }, { desktop: { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '700', border: 'none', marginTop: '32px', boxShadow: '0 4px 24px rgba(99,102,241,0.3)' } }),
        ]), SI(0.1)),
        // Enterprise
        anim(s('card', {}, { desktop: { padding: '48px 36px', ...glassBg(), textAlign: 'center' } }, [
          s('text', { text: 'Enterprise' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', letterSpacing: '0.1em', marginBottom: '16px' } }),
          s('heading', { text: 'Custom', level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '4px' } }),
          s('text', { text: 'tailored plan' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' } }),
          ...['Everything in Pro', 'Unlimited Storage', 'Dedicated Manager', 'Custom Integrations', 'SLA Guarantee', 'White Label'].map(f =>
            s('text', { text: `✓  ${f}` }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', padding: '8px 0', textAlign: 'left' } })
          ),
          s('button', { text: 'Contact Sales', href: '#' }, { desktop: { width: '100%', padding: '14px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.08)', marginTop: '32px' } }),
        ]), FU(0.2)),
      ]),
    ])],
  },

  // 10. LOGO CLOUD MARQUEE
  {
    id: 'v6-logo-marquee', name: '🏢 Animated Logo Marquee', category: 'Logos' as SectionCategory,
    description: 'Infinite scrolling logo cloud with subtle gradient fade edges',
    elements: [s('section', {}, { desktop: { padding: '60px 0', backgroundColor: '#050505', overflow: 'hidden', position: 'relative' } }, [
      anim(s('text', { text: 'TRUSTED BY THE WORLD\'S BEST TEAMS' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', textAlign: 'center', marginBottom: '40px', fontWeight: '600' } }), FU()),
      s('container', {}, { desktop: { display: 'flex', gap: '60px', animation: 'scroll 20s linear infinite', whiteSpace: 'nowrap' } as any }, [
        ...'Google,Apple,Meta,Amazon,Microsoft,Stripe,Spotify,Airbnb,Netflix,Tesla,Figma,Notion'.split(',').map(brand =>
          s('text', { text: brand }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.15)', fontWeight: '700', letterSpacing: '0.05em', flexShrink: '0' } as any })
        ),
      ]),
    ])],
  },

  // 11. TIMELINE SECTION
  {
    id: 'v6-vertical-timeline', name: '📅 Animated Timeline', category: 'Content' as SectionCategory,
    description: 'Vertical timeline with alternating animated cards and connecting line',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', position: 'relative' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { textAlign: 'center', maxWidth: '600px', margin: '0 auto 80px' } }, [
        pill('OUR JOURNEY'),
        gradientText('Milestones'),
      ]), FU()),
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto', position: 'relative', paddingLeft: '40px', borderLeft: '2px solid rgba(99,102,241,0.15)' } }, [
        ...([['2020', 'Founded', 'Started with a vision to democratize digital creation.'], ['2021', 'Series A', 'Raised $12M to accelerate product development.'], ['2022', '100K Users', 'Crossed six-figure user milestone globally.'], ['2023', 'Enterprise Launch', 'Introduced enterprise-grade security and collaboration.'], ['2024', 'AI Integration', 'Launched AI-powered design assistant.']] as [string, string, string][]).map(([year, title, desc], i) =>
          anim(s('container', {}, { desktop: { position: 'relative', padding: '0 0 48px 40px' } }, [
            s('container', {}, { desktop: { position: 'absolute', left: '-49px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#6366f1', border: '3px solid #0a0a0a', boxShadow: '0 0 20px rgba(99,102,241,0.4)' } }),
            s('text', { text: year }, { desktop: { fontSize: '12px', color: '#6366f1', fontWeight: '700', letterSpacing: '0.1em', marginBottom: '8px' } }),
            s('heading', { text: title, level: 'h3' }, { desktop: { fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
            s('text', { text: desc }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
          ]), FL(i * 0.15)),
        ),
      ]),
    ])],
  },

  // 12. SPLIT CTA WITH IMAGE
  {
    id: 'v6-split-cta', name: '🎯 Split Image CTA', category: 'CTA' as SectionCategory,
    description: 'Two-column CTA with image and glassmorphic content panel',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#0a0a0a', minHeight: '600px' }, mobile: { gridTemplateColumns: '1fr' } }, [
      anim(s('container', {}, { desktop: { backgroundImage: 'url(https://images.unsplash.com/photo-1551434678-e076c223a692?w=800)', backgroundSize: 'cover', backgroundPosition: 'center', minHeight: '500px' }, mobile: { minHeight: '300px' } }), FL()),
      anim(s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', gap: '24px' }, mobile: { padding: '48px 24px' } }, [
        pill('GET STARTED TODAY'),
        gradientText('Ready to Build\nSomething Great?', '48px'),
        body('Join thousands of teams already creating amazing digital experiences.'),
        s('container', {}, { desktop: { display: 'flex', gap: '12px', marginTop: '16px' } }, [
          s('button', { text: 'Start Free Trial', href: '#' }, { desktop: { padding: '16px 36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '700', border: 'none' } }),
          s('button', { text: 'Talk to Sales', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', borderRadius: '10px', fontSize: '14px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.1)' } }),
        ]),
      ]), FR()),
    ])],
  },

  // 13. TEAM GRID
  {
    id: 'v6-team-grid', name: '👥 Premium Team Grid', category: 'Team' as SectionCategory,
    description: 'Team member cards with hover reveal and social links',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#08080c' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { textAlign: 'center', maxWidth: '600px', margin: '0 auto 72px' } }, [
        pill('OUR TEAM'),
        gradientText('Meet the People Behind the Product'),
      ]), FU()),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)' } }, [
        ...([['Alex Rivera', 'CEO & Co-founder', 'photo-1507003211169-0a1dd7228f2d'], ['Maya Chen', 'CTO', 'photo-1494790108377-be9c29b29330'], ['James Park', 'Head of Design', 'photo-1472099645785-5658abf4ff4e'], ['Sofia Torres', 'VP Engineering', 'photo-1438761681033-6461ffad8d80']] as [string, string, string][]).map(([name, role, img], i) =>
          anim(hover(s('card', {}, { desktop: { borderRadius: '16px', overflow: 'hidden', ...glassBg({ padding: '0' }), transition: 'all 0.4s' } }, [
            s('image', { src: `https://images.unsplash.com/${img}?w=400&h=500&fit=crop`, alt: name }, { desktop: { width: '100%', height: '280px', objectFit: 'cover' } }),
            s('container', {}, { desktop: { padding: '24px' } }, [
              s('heading', { text: name, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
              s('text', { text: role }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }),
            ]),
          ]), { transform: 'translateY(-4px)', borderColor: 'rgba(99,102,241,0.2)' }), FU(i * 0.1)),
        ),
      ]),
    ])],
  },

  // 14. FAQ ACCORDION
  {
    id: 'v6-faq-accordion', name: '❓ Premium FAQ Accordion', category: 'FAQ' as SectionCategory,
    description: 'Clean expandable FAQ with plus icons and gradient accents',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '80px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr', gap: '40px' } }, [
        s('container', {}, { desktop: {} }, [
          pill('FAQ'),
          gradientText('Questions?\nAnswers.', '48px'),
          body('Everything you need to know about our platform.'),
        ]),
        s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '0' } }, [
          ...([['How does the free trial work?', 'You get full access to all Pro features for 14 days. No credit card required.'], ['Can I cancel anytime?', 'Yes, you can cancel your subscription at any time. No questions asked, no hidden fees.'], ['Do you offer refunds?', 'We offer a 30-day money-back guarantee on all plans.'], ['Is my data secure?', 'We use enterprise-grade encryption and are SOC2 Type II certified.'], ['Can I export my data?', 'Absolutely. You own your data and can export it anytime in multiple formats.']] as [string, string][]).map(([q, a], i) =>
            anim(s('container', {}, { desktop: { padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } }, [
              s('heading', { text: q, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '8px', cursor: 'pointer' } }),
              s('text', { text: a }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
            ]), FU(i * 0.1)),
          ),
        ]),
      ]), FU()),
    ])],
  },

  // 15. IMAGE GALLERY MASONRY
  {
    id: 'v6-masonry-gallery', name: '🖼️ Masonry Image Gallery', category: 'Gallery' as SectionCategory,
    description: 'Asymmetric masonry grid with hover zoom and overlay',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#050505' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { textAlign: 'center', maxWidth: '600px', margin: '0 auto 72px' } }, [
        pill('GALLERY'),
        gradientText('Our Work'),
      ]), FU()),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '200px', gap: '12px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr 1fr', gridAutoRows: '160px' } }, [
        ...([['photo-1618005182384-a83a8bd57fbe', '2', '2'], ['photo-1551434678-e076c223a692', '1', '1'], ['photo-1497366216548-37526070297c', '1', '1'], ['photo-1460925895917-afdab827c52f', '1', '2'], ['photo-1504384308090-c894fdcc538d', '2', '1'], ['photo-1498050108023-c5249f4df085', '1', '1']] as [string, string, string][]).map(([img, colSpan, rowSpan], i) =>
          anim(hover(s('image', { src: `https://images.unsplash.com/${img}?w=600`, alt: 'Gallery' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}`, cursor: 'pointer', transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)' } }), { transform: 'scale(1.03)', filter: 'brightness(1.1)' }), SI(i * 0.1)),
        ),
      ]),
    ])],
  },

  // 16. NEWSLETTER CTA
  {
    id: 'v6-newsletter-cta', name: '📧 Newsletter Signup CTA', category: 'CTA' as SectionCategory,
    description: 'Centered newsletter form with radial gradient glow',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', background: 'linear-gradient(180deg, #0a0a0a, #0d0d1a, #0a0a0a)', position: 'relative', overflow: 'hidden' }, mobile: { padding: '80px 24px' } }, [
      s('container', {}, { desktop: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.08), transparent 70%)', filter: 'blur(60px)' } }),
      anim(s('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '560px', margin: '0 auto' } }, [
        s('text', { text: '📬' }, { desktop: { fontSize: '40px', marginBottom: '24px' } }),
        gradientText('Stay in the Loop', '44px'),
        body('Get weekly insights on design, development, and the future of digital creation. No spam, ever.'),
        s('container', {}, { desktop: { display: 'flex', gap: '10px', marginTop: '36px', maxWidth: '460px', margin: '36px auto 0' }, mobile: { flexDirection: 'column' } }, [
          s('input', { placeholder: 'Enter your email', type: 'email' }, { desktop: { flex: '1', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '14px' } }),
          s('button', { text: 'Subscribe', href: '#' }, { desktop: { padding: '16px 32px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '700', border: 'none', whiteSpace: 'nowrap' } as any }),
        ]),
        s('text', { text: 'Join 25,000+ subscribers. Unsubscribe anytime.' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '16px' } }),
      ]), BI()),
    ])],
  },

  // 17. BLOG CARDS GRID
  {
    id: 'v6-blog-grid', name: '📝 Premium Blog Grid', category: 'Blog' as SectionCategory,
    description: 'Three-column blog post cards with category tags and dates',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#08080c' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: '1200px', margin: '0 auto 64px' }, mobile: { flexDirection: 'column', gap: '20px' } }, [
        s('container', {}, { desktop: {} }, [
          pill('BLOG'),
          gradientText('Latest Insights', '48px'),
        ]),
        hover(s('button', { text: 'View All Posts →', href: '#' }, { desktop: { padding: '12px 28px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', borderRadius: '8px', fontSize: '13px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.08)', transition: 'all 0.3s' } }), { borderColor: 'rgba(255,255,255,0.15)', color: '#fff' }),
      ]), FU()),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...([['The Future of AI in Design', 'AI', 'Mar 15, 2026', 'photo-1677442136019-21780ecad995'], ['Building Scalable Systems', 'Engineering', 'Mar 10, 2026', 'photo-1558494949-ef010cbdcc31'], ['Design Principles That Last', 'Design', 'Mar 5, 2026', 'photo-1613909207039-6b173b755cc1']] as [string, string, string, string][]).map(([title, cat, date, img], i) =>
          anim(hover(s('card', {}, { desktop: { borderRadius: '16px', overflow: 'hidden', ...glassBg({ padding: '0' }), transition: 'all 0.4s', cursor: 'pointer' } }, [
            s('image', { src: `https://images.unsplash.com/${img}?w=600&h=340&fit=crop`, alt: title }, { desktop: { width: '100%', height: '220px', objectFit: 'cover' } }),
            s('container', {}, { desktop: { padding: '28px' } }, [
              s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px' } }, [
                s('text', { text: cat }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '0.1em', textTransform: 'uppercase' } as any }),
                s('text', { text: date }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' } }),
              ]),
              s('heading', { text: title, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', lineHeight: '1.3', marginBottom: '12px' } }),
              s('text', { text: 'Explore the latest trends and insights shaping the future of digital creation...' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
            ]),
          ]), { transform: 'translateY(-4px)', borderColor: 'rgba(99,102,241,0.15)' }), FU(i * 0.15)),
        ),
      ]),
    ])],
  },

  // 18. MEGA FOOTER
  {
    id: 'v6-mega-footer', name: '🦶 Premium Mega Footer', category: 'Footers' as SectionCategory,
    description: 'Five-column footer with newsletter, social, and sitemap',
    elements: [s('footer', {}, { desktop: { padding: '80px 60px 40px', backgroundColor: '#050505', borderTop: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '60px 24px 32px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '48px', maxWidth: '1200px', margin: '0 auto 60px' }, mobile: { gridTemplateColumns: '1fr 1fr', gap: '32px' } }, [
        anim(s('container', {}, { desktop: {} }, [
          s('text', { text: 'STUDIO' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.15em', marginBottom: '16px' } }),
          s('text', { text: 'Building the future of digital creation. Empowering teams to create, ship, and scale beautiful products.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7', marginBottom: '24px', maxWidth: '280px' } }),
          s('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
            ...['𝕏', 'in', 'f', '◻'].map(icon =>
              hover(s('text', { text: icon }, { desktop: { width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', fontSize: '14px', cursor: 'pointer', transition: 'all 0.3s', border: '1px solid rgba(255,255,255,0.06)' } }), { backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1', borderColor: 'rgba(99,102,241,0.2)' })
            ),
          ]),
        ]), FU()),
        ...([['Product', 'Features,Pricing,Integrations,Changelog'], ['Company', 'About,Careers,Press,Contact'], ['Resources', 'Blog,Docs,Help Center,API'], ['Legal', 'Privacy,Terms,Security,Cookies']] as [string, string][]).map(([heading, links], i) =>
          anim(s('container', {}, { desktop: {} }, [
            s('text', { text: heading }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', marginBottom: '20px', textTransform: 'uppercase' } as any }),
            ...links.split(',').map(link =>
              hover(s('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '14px', color: 'rgba(255,255,255,0.35)', padding: '6px 0', transition: 'color 0.3s' } }), { color: '#fff' })
            ),
          ]), FU(0.1 + i * 0.08)),
        ),
      ]),
      s('container', {}, { desktop: { borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }, mobile: { flexDirection: 'column', gap: '12px', textAlign: 'center' } }, [
        s('text', { text: '© 2026 Studio. All rights reserved.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.25)' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '24px' } }, [
          ...'Privacy Policy,Terms,Cookies'.split(',').map(t =>
            hover(s('link', { text: t, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.25)', transition: 'color 0.3s' } }), { color: 'rgba(255,255,255,0.5)' })
          ),
        ]),
      ]),
    ])],
  },

  // 19. PROCESS STEPS
  {
    id: 'v6-process-steps', name: '🔄 Animated Process Steps', category: 'Content' as SectionCategory,
    description: 'Horizontal numbered process flow with connecting lines',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { textAlign: 'center', maxWidth: '600px', margin: '0 auto 72px' } }, [
        pill('HOW IT WORKS'),
        gradientText('Simple 4-Step Process'),
      ]), FU()),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', maxWidth: '1100px', margin: '0 auto', position: 'relative' }, mobile: { gridTemplateColumns: '1fr', gap: '40px' } }, [
        ...([['01', 'Design', 'Start with our intuitive visual editor.'], ['02', 'Build', 'Add interactions, animations, and logic.'], ['03', 'Test', 'Preview across all devices instantly.'], ['04', 'Launch', 'One-click publish to your domain.']] as [string, string, string][]).map(([num, title, desc], i) =>
          anim(s('container', {}, { desktop: { textAlign: 'center', position: 'relative' } }, [
            s('text', { text: num }, { desktop: { fontSize: '64px', fontWeight: '900', background: 'linear-gradient(180deg, rgba(99,102,241,0.2), rgba(99,102,241,0.03))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '16px', lineHeight: '1' } as any }),
            s('heading', { text: title, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '10px' } }),
            s('text', { text: desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
          ]), SD(i * 0.15)),
        ),
      ]),
    ])],
  },

  // 20. COMPARISON TABLE
  {
    id: 'v6-comparison-table', name: '⚖️ Feature Comparison', category: 'Pricing' as SectionCategory,
    description: 'Clean comparison table showing feature availability across plans',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#08080c' }, mobile: { padding: '60px 24px', overflowX: 'auto' } as any }, [
      anim(s('container', {}, { desktop: { textAlign: 'center', maxWidth: '600px', margin: '0 auto 72px' } }, [
        pill('COMPARE PLANS'),
        gradientText('Feature Comparison'),
      ]), FU()),
      anim(s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', ...glassBg({ padding: '0', overflow: 'hidden' }) } }, [
        // Header row
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' } }, [
          s('text', { text: 'Feature' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em' } }),
          s('text', { text: 'Starter' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textAlign: 'center' } }),
          s('text', { text: 'Pro' }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#6366f1', letterSpacing: '0.1em', textAlign: 'center' } }),
          s('text', { text: 'Enterprise' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textAlign: 'center' } }),
        ]),
        // Rows
        ...([['Projects', '5', 'Unlimited', 'Unlimited'], ['Storage', '1 GB', '100 GB', 'Unlimited'], ['Team Members', '1', '10', 'Unlimited'], ['Custom Domains', '—', '✓', '✓'], ['Analytics', 'Basic', 'Advanced', 'Enterprise'], ['Priority Support', '—', '✓', '✓'], ['API Access', '—', '✓', '✓'], ['White Label', '—', '—', '✓']] as [string, string, string, string][]).map(([feature, s1, s2, s3]) =>
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '16px 32px', borderBottom: '1px solid rgba(255,255,255,0.03)' } }, [
            s('text', { text: feature }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' } }),
            ...[s1, s2, s3].map(val =>
              s('text', { text: val }, { desktop: { fontSize: '14px', color: val === '✓' ? '#22c55e' : val === '—' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.45)', textAlign: 'center', fontWeight: val === '✓' ? '700' : '400' } })
            ),
          ]),
        ),
      ]), SI()),
    ])],
  },

  // 21. PORTFOLIO SHOWCASE
  {
    id: 'v6-portfolio-showcase', name: '💼 Portfolio Showcase', category: 'Portfolio' as SectionCategory,
    description: 'Full-width portfolio cases with large images and project details',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { textAlign: 'center', maxWidth: '600px', margin: '0 auto 72px' } }, [
        pill('PORTFOLIO'),
        gradientText('Selected Work'),
      ]), FU()),
      s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '1200px', margin: '0 auto' } }, [
        ...([['Aether App Redesign', 'Mobile • UX/UI • 2026', 'photo-1618005182384-a83a8bd57fbe'], ['Meridian Dashboard', 'SaaS • Design System • 2025', 'photo-1460925895917-afdab827c52f'], ['Nova Brand Identity', 'Branding • Strategy • 2025', 'photo-1613909207039-6b173b755cc1']] as [string, string, string][]).map(([title, tags, img], i) =>
          anim(hover(s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0', borderRadius: '20px', overflow: 'hidden', ...glassBg({ padding: '0' }), transition: 'all 0.5s', cursor: 'pointer' }, mobile: { gridTemplateColumns: '1fr' } }, [
            s('image', { src: `https://images.unsplash.com/${img}?w=800&h=500&fit=crop`, alt: title }, { desktop: { width: '100%', height: '360px', objectFit: 'cover' }, mobile: { height: '240px' } }),
            s('container', {}, { desktop: { padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } }, [
              s('text', { text: tags }, { desktop: { fontSize: '12px', color: '#6366f1', letterSpacing: '0.1em', fontWeight: '600', marginBottom: '16px' } }),
              s('heading', { text: title, level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '16px', letterSpacing: '-0.02em' } }),
              hover(s('text', { text: 'View Project →' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', transition: 'color 0.3s' } }), { color: '#6366f1' }),
            ]),
          ]), { borderColor: 'rgba(99,102,241,0.2)', transform: 'translateY(-2px)' }), i % 2 === 0 ? FL(i * 0.1) : FR(i * 0.1)),
        ),
      ]),
    ])],
  },

  // 22. CONTACT FORM SPLIT
  {
    id: 'v6-contact-split', name: '📞 Split Contact Section', category: 'Contact' as SectionCategory,
    description: 'Two-column contact with info and glassmorphic form',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#08080c' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '80px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr', gap: '48px' } }, [
        anim(s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center' } }, [
          pill('CONTACT'),
          gradientText('Let\'s Talk', '52px'),
          body('Have a project in mind? We\'d love to hear from you.'),
          s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '40px' } }, [
            ...([['📧', 'hello@studio.com'], ['📱', '+1 (555) 000-0000'], ['📍', 'San Francisco, CA']] as [string, string][]).map(([icon, info]) =>
              s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '16px' } }, [
                s('text', { text: icon }, { desktop: { fontSize: '20px' } }),
                s('text', { text: info }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.5)' } }),
              ])
            ),
          ]),
        ]), FL()),
        anim(s('container', {}, { desktop: { ...glassBg({ padding: '48px' }) } }, [
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }, mobile: { gridTemplateColumns: '1fr' } }, [
            s('input', { placeholder: 'First name', type: 'text' }, { desktop: { padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' } }),
            s('input', { placeholder: 'Last name', type: 'text' }, { desktop: { padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' } }),
          ]),
          s('input', { placeholder: 'Email', type: 'email' }, { desktop: { width: '100%', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '14px', marginBottom: '16px' } }),
          s('textarea', { placeholder: 'Tell us about your project...' }, { desktop: { width: '100%', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.03)', color: '#fff', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', fontSize: '14px', minHeight: '140px', resize: 'vertical', marginBottom: '24px' } as any }),
          s('button', { text: 'Send Message', href: '#' }, { desktop: { width: '100%', padding: '18px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '15px', fontWeight: '700', border: 'none' } }),
        ]), FR()),
      ]),
    ])],
  },

  // 23. ABOUT SECTION
  {
    id: 'v6-about-story', name: '📖 Brand Story About', category: 'About' as SectionCategory,
    description: 'Narrative about section with large pull-quote and side image',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '700px', backgroundColor: '#0a0a0a' }, mobile: { gridTemplateColumns: '1fr' } }, [
      anim(s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px', gap: '28px' }, mobile: { padding: '60px 24px' } }, [
        pill('ABOUT US'),
        s('heading', { text: '"We believe design is the bridge between technology and humanity."', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '300', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4', letterSpacing: '-0.01em', fontFamily: "'Georgia', serif" } as any, mobile: { fontSize: '26px' } }),
        s('container', {}, { desktop: { width: '60px', height: '2px', background: 'linear-gradient(90deg, #6366f1, transparent)' } }),
        s('text', { text: 'Founded in 2020, we set out to make professional-grade design accessible to everyone. Today, over 10 million creators worldwide use our platform to bring their visions to life.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8', maxWidth: '480px' } }),
        s('text', { text: '— Alex Rivera, CEO & Co-founder' }, { desktop: { fontSize: '14px', color: 'rgba(99,102,241,0.7)', fontWeight: '500', fontStyle: 'italic' } }),
      ]), FL()),
      anim(s('container', {}, { desktop: { backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=800)', backgroundSize: 'cover', backgroundPosition: 'center' }, mobile: { minHeight: '400px' } }), FR()),
    ])],
  },

  // 24. BANNER CTA
  {
    id: 'v6-banner-cta', name: '🎉 Animated Banner CTA', category: 'Banners' as SectionCategory,
    description: 'Full-width gradient banner with animated glow and call to action',
    elements: [anim(s('section', {}, { desktop: { padding: '80px 60px', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4338ca 60%, #6366f1 100%)', position: 'relative', overflow: 'hidden', borderRadius: '24px', margin: '0 40px' }, mobile: { padding: '60px 24px', margin: '0 16px', borderRadius: '16px' } }, [
      s('container', {}, { desktop: { position: 'absolute', top: '-50%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: '1100px', margin: '0 auto' }, mobile: { flexDirection: 'column', textAlign: 'center', gap: '32px' } }, [
        s('container', {}, { desktop: { maxWidth: '600px' } }, [
          s('heading', { text: 'Start Building for Free Today', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '12px' } }),
          s('text', { text: 'No credit card required. Full access to all features for 14 days.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.6' } }),
        ]),
        s('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
          hover(s('button', { text: 'Get Started Free', href: '#' }, { desktop: { padding: '18px 40px', backgroundColor: '#fff', color: '#4338ca', borderRadius: '10px', fontSize: '15px', fontWeight: '700', border: 'none', transition: 'all 0.3s' } }), { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }),
          hover(s('button', { text: 'Learn More', href: '#' }, { desktop: { padding: '18px 40px', backgroundColor: 'transparent', color: '#fff', borderRadius: '10px', fontSize: '15px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.3)', transition: 'all 0.3s' } }), { backgroundColor: 'rgba(255,255,255,0.1)' }),
        ]),
      ]),
    ]), SI())],
  },

  // 25. APP DOWNLOAD CTA
  {
    id: 'v6-app-download', name: '📱 App Download Section', category: 'CTA' as SectionCategory,
    description: 'App showcase with phone mockup frame and store badges',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', padding: '120px 60px', backgroundColor: '#050510', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', padding: '60px 24px', gap: '48px' } }, [
      anim(s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '24px' } }, [
        pill('MOBILE APP'),
        gradientText('Take It\nAnywhere', '56px'),
        body('Access your projects, collaborate with your team, and make edits on the go. Available on iOS and Android.'),
        s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' } }, [
          ...(['✓ Offline-first — work without internet', '✓ Real-time sync across all devices', '✓ Touch-optimized design tools', '✓ Push notifications for team updates']).map(f =>
            s('text', { text: f }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' } })
          ),
        ]),
        s('container', {}, { desktop: { display: 'flex', gap: '12px', marginTop: '24px' } }, [
          s('button', { text: '▶  App Store', href: '#' }, { desktop: { padding: '16px 32px', backgroundColor: '#fff', color: '#000', borderRadius: '10px', fontSize: '14px', fontWeight: '700', border: 'none' } }),
          s('button', { text: '▶  Google Play', href: '#' }, { desktop: { padding: '16px 32px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.08)' } }),
        ]),
      ]), FL()),
      anim(s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', alignItems: 'center' } }, [
        s('container', {}, { desktop: { width: '280px', height: '560px', borderRadius: '40px', border: '4px solid rgba(255,255,255,0.1)', background: 'linear-gradient(180deg, rgba(99,102,241,0.15), rgba(139,92,246,0.05))', boxShadow: '0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)', overflow: 'hidden', position: 'relative', padding: '16px' } }, [
          s('container', {}, { desktop: { width: '100%', height: '100%', borderRadius: '28px', backgroundImage: 'url(https://images.unsplash.com/photo-1551434678-e076c223a692?w=400)', backgroundSize: 'cover', backgroundPosition: 'center' } }),
        ]),
      ]), RI()),
    ])],
  },
];
