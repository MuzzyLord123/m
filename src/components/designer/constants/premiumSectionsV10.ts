import { EditorElement } from '../types';

// ═══════════════════════════════════════════════════════════════
// V10 — Enterprise Sections: 25 new ultra-premium sections
// Styles: Noise textures, duotone, split-screen kinetics,
//         editorial grids, neo-brutalist accents, liquid glass
// ═══════════════════════════════════════════════════════════════

let _c = 0;
function sid(): string { _c++; return `v10-${_c}-${Math.random().toString(36).slice(2,7)}`; }

function s(type: EditorElement['type'], props: Record<string,unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: sid(), type, name: name ?? type, props, styles, children };
}

function anim(el: EditorElement, animation: Record<string,unknown>): EditorElement {
  return { ...el, props: { ...el.props, animation } };
}

const FU = () => ({ type: 'fadeUp' as const, duration: 0.6, delay: 0, easing: 'cubic-bezier(0.16,1,0.3,1)' });
const SR = () => ({ type: 'slideRight' as const, duration: 0.7, delay: 0.15, easing: 'cubic-bezier(0.16,1,0.3,1)' });
const SL = () => ({ type: 'slideLeft' as const, duration: 0.7, delay: 0.15, easing: 'cubic-bezier(0.16,1,0.3,1)' });

type SectionCategory =
  | 'Navbars' | 'Heroes' | 'Features' | 'Content' | 'CTA'
  | 'Testimonials' | 'Pricing' | 'FAQ' | 'Team' | 'Stats'
  | 'Gallery' | 'Logos' | 'Contact' | 'Footers' | 'Blog'
  | 'Ecommerce' | 'Forms' | 'Banners'
  | 'Portfolio' | 'About' | 'Comparison' | 'Error' | 'Animated'
  | 'Interactive' | 'Product Pages';

interface SectionBlock { id: string; name: string; category: SectionCategory; description: string; thumbnail?: string; elements: EditorElement[]; }

export const PREMIUM_SECTION_BLOCKS_V10: SectionBlock[] = [

  // ═══════ 1. HERO — Cinematic Duotone ═══════
  {
    id: 'v10-hero-duotone', name: '🎬 Cinematic Duotone Hero', category: 'Heroes',
    description: 'Full-bleed duotone hero with split diagonal overlay and editorial type',
    elements: [anim(s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'flex-end', background: '#050505', overflow: 'hidden' } }, [
      s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'linear-gradient(135deg, #1a0533 0%, #050505 40%, #0a1628 100%)' } }),
      s('container', {}, { desktop: { position: 'absolute', top: '0', right: '0', width: '55%', height: '100%', background: 'linear-gradient(180deg, rgba(139,92,246,0.08) 0%, rgba(6,182,212,0.05) 100%)', clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0% 100%)' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '1', padding: '120px 80px', maxWidth: '800px' }, mobile: { padding: '60px 24px' } }, [
        s('text', { text: '01' }, { desktop: { fontSize: '200px', fontWeight: '900', color: 'rgba(255,255,255,0.02)', position: 'absolute', top: '-40px', left: '-20px', letterSpacing: '-0.05em', lineHeight: '1', pointerEvents: 'none' } }),
        s('text', { text: 'DIGITAL STUDIO' }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#8b5cf6', letterSpacing: '0.2em', marginBottom: '32px' } }),
        s('heading', { text: 'Where Vision\nMeets Precision', level: 'h1' }, { desktop: { fontSize: '82px', fontWeight: '800', color: '#fff', lineHeight: '0.95', letterSpacing: '-0.04em', marginBottom: '32px' }, mobile: { fontSize: '44px' } }),
        s('text', { text: 'We craft digital experiences at the intersection of art and engineering. Every pixel intentional, every interaction meaningful.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8', marginBottom: '48px', maxWidth: '480px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '16px', alignItems: 'center' } }, [
          s('button', { text: 'Explore Work', href: '#' }, { desktop: { padding: '20px 48px', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: '#fff', borderRadius: '0', fontSize: '12px', fontWeight: '700', border: 'none', letterSpacing: '0.12em', textTransform: 'uppercase' as any } }),
          s('text', { text: '↓ Scroll to discover' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em' } }),
        ]),
      ]),
    ], 'Cinematic Duotone Hero'), FU())],
  },

  // ═══════ 2. HERO — Editorial Masthead ═══════
  {
    id: 'v10-hero-editorial', name: '📰 Editorial Masthead Hero', category: 'Heroes',
    description: 'Magazine-style hero with oversized serif type and rule lines',
    elements: [anim(s('section', {}, { desktop: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#faf9f6', padding: '100px 80px', position: 'relative' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { position: 'absolute', top: '40px', left: '80px', right: '80px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e0ddd5' }, mobile: { left: '24px', right: '24px' } }, [
        s('text', { text: 'THE JOURNAL' }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '0.2em', paddingBottom: '16px' } }),
        s('text', { text: 'ISSUE NO. 47 — 2026' }, { desktop: { fontSize: '10px', fontWeight: '500', color: '#999', letterSpacing: '0.15em', paddingBottom: '16px' } }),
      ]),
      s('container', {}, { desktop: { maxWidth: '1000px' } }, [
        s('heading', { text: 'The Art of\nDigital Craft', level: 'h1' }, { desktop: { fontSize: '96px', fontWeight: '300', color: '#1a1a1a', lineHeight: '1.0', letterSpacing: '-0.03em', marginBottom: '40px', fontFamily: 'Georgia, serif' }, mobile: { fontSize: '48px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '60px', alignItems: 'flex-start', borderTop: '2px solid #1a1a1a', paddingTop: '32px' } }, [
          s('text', { text: 'We believe in the power of restraint. In a world overflowing with noise, the most impactful designs are those that communicate with precision and grace.' }, { desktop: { fontSize: '17px', color: '#555', lineHeight: '1.8', maxWidth: '400px', fontFamily: 'Georgia, serif', fontStyle: 'italic' } }),
          s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
            s('button', { text: 'Read the Story →', href: '#' }, { desktop: { padding: '16px 0', backgroundColor: 'transparent', color: '#1a1a1a', border: 'none', fontSize: '14px', fontWeight: '600', letterSpacing: '0.04em', textAlign: 'left', borderBottom: '2px solid #1a1a1a', width: 'fit-content' } }),
            s('text', { text: '7 min read' }, { desktop: { fontSize: '11px', color: '#999', letterSpacing: '0.1em' } }),
          ]),
        ]),
      ]),
    ], 'Editorial Masthead Hero'), FU())],
  },

  // ═══════ 3. HERO — Noise Texture ═══════
  {
    id: 'v10-hero-noise', name: '📡 Noise Texture Hero', category: 'Heroes',
    description: 'Textured background with grain overlay and stark monochrome type',
    elements: [anim(s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', overflow: 'hidden' } }, [
      s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.02) 1px, rgba(255,255,255,0.02) 2px)', pointerEvents: 'none' } }),
      s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'radial-gradient(circle at 30% 70%, rgba(34,211,238,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(168,85,247,0.04) 0%, transparent 50%)', pointerEvents: 'none' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '1', textAlign: 'center', maxWidth: '1000px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '40px' } }, [
          s('container', {}, { desktop: { width: '60px', height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', marginTop: '8px' } }),
          s('text', { text: 'ENTERPRISE PLATFORM' }, { desktop: { fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.3em' } }),
          s('container', {}, { desktop: { width: '60px', height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', marginTop: '8px' } }),
        ]),
        s('heading', { text: 'INFRASTRUCTURE\nFOR THE FUTURE', level: 'h1' }, { desktop: { fontSize: '88px', fontWeight: '900', color: '#fff', lineHeight: '0.95', letterSpacing: '-0.02em', marginBottom: '32px', textTransform: 'uppercase' as any }, mobile: { fontSize: '42px' } }),
        s('text', { text: 'Deploy globally. Scale infinitely. Build with confidence on the platform trusted by the world\'s most ambitious teams.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.8', marginBottom: '56px', maxWidth: '540px', margin: '0 auto 56px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '1px', justifyContent: 'center' } }, [
          s('button', { text: 'GET STARTED', href: '#' }, { desktop: { padding: '20px 48px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '11px', fontWeight: '800', border: 'none', letterSpacing: '0.15em' } }),
          s('button', { text: 'DOCUMENTATION', href: '#' }, { desktop: { padding: '20px 48px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', borderRadius: '0', fontSize: '11px', fontWeight: '700', border: 'none', letterSpacing: '0.15em' } }),
        ]),
      ]),
    ], 'Noise Texture Hero'), FU())],
  },

  // ═══════ 4. FEATURES — Bento Asymmetric Grid ═══════
  {
    id: 'v10-features-bento-asym', name: '🧱 Bento Asymmetric Grid', category: 'Features',
    description: 'Asymmetric bento grid with glassmorphic cards and accent borders',
    elements: [s('section', {}, { desktop: { backgroundColor: '#0a0a0a', padding: '120px 60px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '64px' } }, [
          s('container', {}, { desktop: {} }, [
            s('text', { text: 'CAPABILITIES' }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#22d3ee', letterSpacing: '0.2em', marginBottom: '12px' } }),
            s('heading', { text: 'Built for\nModern Teams', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em' }, mobile: { fontSize: '36px' } }),
          ]),
          s('text', { text: 'Everything you need to ship faster,\ncollaborate better, and scale with confidence.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', textAlign: 'right' }, mobile: { display: 'none' } }),
        ]),
        // Bento grid
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: '2px' }, mobile: { gridTemplateColumns: '1fr' } }, [
          // Large card spanning 2 cols
          s('container', {}, { desktop: { gridColumn: 'span 2', background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.04))', border: '1px solid rgba(255,255,255,0.06)', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }, mobile: { gridColumn: 'span 1' } }, [
            s('container', {}, { desktop: { width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' } }, [
              s('text', { text: '⚡' }, { desktop: { fontSize: '20px' } }),
            ]),
            s('container', {}, { desktop: {} }, [
              s('heading', { text: 'Real-Time Collaboration', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '12px', letterSpacing: '-0.02em' } }),
              s('text', { text: 'Work together in real-time with multiplayer cursors, live comments, and instant syncing across your entire team.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
            ]),
          ]),
          // Tall card
          s('container', {}, { desktop: { gridRow: 'span 2', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } }, [
            s('text', { text: '99.99%' }, { desktop: { fontSize: '56px', fontWeight: '800', background: 'linear-gradient(180deg, #fff, rgba(255,255,255,0.3))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em', marginBottom: '8px' } }),
            s('heading', { text: 'Uptime SLA', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '16px' } }),
            s('text', { text: 'Enterprise-grade reliability backed by our industry-leading SLA. Your applications stay online, always.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7' } }),
          ]),
          // Two smaller cards
          s('container', {}, { desktop: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '36px' } }, [
            s('text', { text: '🔒' }, { desktop: { fontSize: '28px', marginBottom: '20px' } }),
            s('heading', { text: 'SOC 2 Compliant', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
            s('text', { text: 'Enterprise security with end-to-end encryption and compliance certifications.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6' } }),
          ]),
          s('container', {}, { desktop: { background: 'linear-gradient(135deg, rgba(34,211,238,0.06), rgba(16,185,129,0.04))', border: '1px solid rgba(255,255,255,0.06)', padding: '36px' } }, [
            s('text', { text: '🌍' }, { desktop: { fontSize: '28px', marginBottom: '20px' } }),
            s('heading', { text: 'Global Edge CDN', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
            s('text', { text: '300+ edge locations worldwide for sub-50ms response times anywhere.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6' } }),
          ]),
        ]),
      ]),
    ], 'Bento Asymmetric Features')],
  },

  // ═══════ 5. FEATURES — Numbered Stack ═══════
  {
    id: 'v10-features-numbered', name: '🔢 Numbered Feature Stack', category: 'Features',
    description: 'Vertically stacked features with oversized step numbers and rule lines',
    elements: [s('section', {}, { desktop: { backgroundColor: '#faf9f6', padding: '120px 80px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto' } }, [
        s('text', { text: 'HOW IT WORKS' }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#999', letterSpacing: '0.25em', marginBottom: '16px' } }),
        s('heading', { text: 'Three Steps to\nTransform Your Workflow', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '300', color: '#1a1a1a', lineHeight: '1.15', letterSpacing: '-0.02em', marginBottom: '80px', fontFamily: 'Georgia, serif' }, mobile: { fontSize: '32px', marginBottom: '48px' } }),
        ...[
          { num: '01', title: 'Connect Your Stack', desc: 'Import existing projects, connect your repositories, and sync your team in under 60 seconds. Zero migration friction.' },
          { num: '02', title: 'Design & Iterate', desc: 'Use our visual canvas to create production-ready designs. Every component is responsive, accessible, and performance-optimized.' },
          { num: '03', title: 'Deploy & Scale', desc: 'One-click deployment to global infrastructure. Auto-scaling, edge caching, and real-time analytics included from day one.' },
        ].map((item, i) =>
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '80px 1fr', gap: '40px', paddingBottom: i < 2 ? '48px' : '0', marginBottom: i < 2 ? '48px' : '0', borderBottom: i < 2 ? '1px solid #e0ddd5' : 'none' }, mobile: { gridTemplateColumns: '1fr', gap: '16px' } }, [
            s('text', { text: item.num }, { desktop: { fontSize: '48px', fontWeight: '200', color: '#ccc', fontFamily: 'Georgia, serif', lineHeight: '1' } }),
            s('container', {}, { desktop: {} }, [
              s('heading', { text: item.title, level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '600', color: '#1a1a1a', marginBottom: '12px', letterSpacing: '-0.01em' } }),
              s('text', { text: item.desc }, { desktop: { fontSize: '16px', color: '#777', lineHeight: '1.8' } }),
            ]),
          ])
        ),
      ]),
    ], 'Numbered Feature Stack')],
  },

  // ═══════ 6. STATS — Floating Metric Cards ═══════
  {
    id: 'v10-stats-floating', name: '📊 Floating Metric Cards', category: 'Stats',
    description: 'Elevated stat cards with gradient backgrounds and micro-labels',
    elements: [anim(s('section', {}, { desktop: { backgroundColor: '#0a0a0a', padding: '100px 60px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' } }, [
        s('heading', { text: 'Trusted by Industry Leaders', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '32px' } }),
        s('text', { text: 'The numbers speak for themselves.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.35)' } }),
      ]),
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' } },
        [
          { val: '10M+', label: 'API Requests / Day', grad: 'linear-gradient(135deg, rgba(139,92,246,0.12), rgba(139,92,246,0.03))' },
          { val: '99.99%', label: 'Uptime Guarantee', grad: 'linear-gradient(135deg, rgba(34,211,238,0.12), rgba(34,211,238,0.03))' },
          { val: '2,400+', label: 'Enterprise Clients', grad: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.03))' },
          { val: '<50ms', label: 'Global Latency', grad: 'linear-gradient(135deg, rgba(251,146,60,0.12), rgba(251,146,60,0.03))' },
        ].map(stat =>
          s('container', {}, { desktop: { background: stat.grad, border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '40px 32px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' } }, [
            s('text', { text: stat.val }, { desktop: { fontSize: '42px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' }, mobile: { fontSize: '32px' } }),
            s('text', { text: stat.label }, { desktop: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
          ])
        ),
      ),
    ], 'Floating Metric Cards'), FU())],
  },

  // ═══════ 7. CTA — Split Screen ═══════
  {
    id: 'v10-cta-split', name: '🎯 Split Screen CTA', category: 'CTA',
    description: 'Dramatic black/white split with contrasting CTA buttons',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '500px' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { backgroundColor: '#000', padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
        s('heading', { text: 'For Startups', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' } }),
        s('text', { text: 'Free tier with everything you need to validate, launch, and grow your product.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '32px', maxWidth: '360px' } }),
        s('button', { text: 'Start Free →', href: '#' }, { desktop: { padding: '18px 40px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '700', border: 'none', letterSpacing: '0.08em', width: 'fit-content' } }),
      ]),
      s('container', {}, { desktop: { backgroundColor: '#faf9f6', padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
        s('heading', { text: 'For Enterprise', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '-0.03em', marginBottom: '16px' } }),
        s('text', { text: 'Custom infrastructure, dedicated support, and SLAs designed for mission-critical applications.' }, { desktop: { fontSize: '16px', color: '#777', lineHeight: '1.7', marginBottom: '32px', maxWidth: '360px' } }),
        s('button', { text: 'Contact Sales →', href: '#' }, { desktop: { padding: '18px 40px', backgroundColor: '#1a1a1a', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '700', border: 'none', letterSpacing: '0.08em', width: 'fit-content' } }),
      ]),
    ], 'Split Screen CTA')],
  },

  // ═══════ 8. TESTIMONIALS — Editorial Quote ═══════
  {
    id: 'v10-testimonial-editorial', name: '💬 Editorial Quote Block', category: 'Testimonials',
    description: 'Large serif pull-quote with attribution line and decorative rule',
    elements: [s('section', {}, { desktop: { backgroundColor: '#faf9f6', padding: '120px 80px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto', textAlign: 'center' } }, [
        s('text', { text: '❝' }, { desktop: { fontSize: '72px', color: '#ddd', lineHeight: '1', marginBottom: '24px' } }),
        s('text', { text: 'This platform didn\'t just improve our workflow — it fundamentally changed how we think about building products. The attention to detail is extraordinary.' }, { desktop: { fontSize: '28px', fontWeight: '300', color: '#1a1a1a', lineHeight: '1.6', fontFamily: 'Georgia, serif', fontStyle: 'italic', marginBottom: '40px' }, mobile: { fontSize: '20px' } }),
        s('container', {}, { desktop: { width: '40px', height: '2px', backgroundColor: '#1a1a1a', margin: '0 auto 24px' } }),
        s('text', { text: 'Sarah Chen' }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#1a1a1a', letterSpacing: '0.06em', marginBottom: '4px' } }),
        s('text', { text: 'VP of Engineering, Stripe' }, { desktop: { fontSize: '12px', color: '#999', letterSpacing: '0.08em' } }),
      ]),
    ], 'Editorial Quote')],
  },

  // ═══════ 9. PRICING — Minimal Tiers ═══════
  {
    id: 'v10-pricing-minimal', name: '💎 Minimal Pricing Tiers', category: 'Pricing',
    description: 'Clean three-column pricing with accent border on featured plan',
    elements: [s('section', {}, { desktop: { backgroundColor: '#0a0a0a', padding: '120px 60px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' } }, [
        s('heading', { text: 'Simple, Transparent Pricing', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '32px' } }),
        s('text', { text: 'Start free. Scale as you grow. No surprises.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)' } }),
      ]),
      s('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }, mobile: { gridTemplateColumns: '1fr', gap: '16px' } },
        [
          { name: 'Starter', price: '$0', period: '/month', desc: 'For individuals and small projects', features: ['1 Project', '10GB Storage', 'Community Support', 'Basic Analytics'], featured: false },
          { name: 'Pro', price: '$49', period: '/month', desc: 'For growing teams and businesses', features: ['Unlimited Projects', '100GB Storage', 'Priority Support', 'Advanced Analytics', 'Custom Domains', 'Team Collaboration'], featured: true },
          { name: 'Enterprise', price: 'Custom', period: '', desc: 'For organizations at scale', features: ['Everything in Pro', 'Dedicated Infrastructure', '24/7 Phone Support', 'SLA Guarantee', 'SSO & SAML', 'Custom Integrations'], featured: false },
        ].map(plan =>
          s('container', {}, { desktop: { background: plan.featured ? 'linear-gradient(180deg, rgba(139,92,246,0.08), rgba(0,0,0,0))' : 'rgba(255,255,255,0.02)', border: plan.featured ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)', padding: '48px 36px', display: 'flex', flexDirection: 'column' } }, [
            plan.featured ? s('text', { text: 'MOST POPULAR' }, { desktop: { fontSize: '9px', fontWeight: '800', color: '#8b5cf6', letterSpacing: '0.2em', marginBottom: '16px' } }) : s('container', {}, { desktop: { height: '20px' } }),
            s('heading', { text: plan.name, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
            s('text', { text: plan.desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '24px' } }),
            s('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' } }, [
              s('text', { text: plan.price }, { desktop: { fontSize: '44px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
              s('text', { text: plan.period }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)' } }),
            ]),
            ...plan.features.map(f =>
              s('container', {}, { desktop: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' } }, [
                s('text', { text: '✓' }, { desktop: { fontSize: '13px', color: plan.featured ? '#8b5cf6' : '#22d3ee' } }),
                s('text', { text: f }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.55)' } }),
              ])
            ),
            s('button', { text: plan.price === 'Custom' ? 'Contact Sales' : 'Get Started', href: '#' }, { desktop: { padding: '16px', backgroundColor: plan.featured ? '#8b5cf6' : 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '700', border: plan.featured ? 'none' : '1px solid rgba(255,255,255,0.1)', width: '100%', marginTop: 'auto', letterSpacing: '0.06em' } }),
          ])
        ),
      ),
    ], 'Minimal Pricing')],
  },

  // ═══════ 10. LOGOS — Minimal Trust Bar ═══════
  {
    id: 'v10-logos-trust', name: '🏢 Minimal Trust Bar', category: 'Logos',
    description: 'Clean logo cloud with subtle label and monochrome treatment',
    elements: [s('section', {}, { desktop: { backgroundColor: '#000', padding: '60px 80px', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '40px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', textAlign: 'center' } }, [
        s('text', { text: 'TRUSTED BY TEAMS AT' }, { desktop: { fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.25em', marginBottom: '32px' } }),
        s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '56px', alignItems: 'center', flexWrap: 'wrap', opacity: '0.3' }, mobile: { gap: '32px' } },
          ['Stripe', 'Vercel', 'Linear', 'Notion', 'Figma', 'GitHub'].map(name =>
            s('text', { text: name }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '0.04em' } })
          ),
        ),
      ]),
    ], 'Trust Bar')],
  },

  // ═══════ 11. CONTENT — Split Image + Metrics ═══════
  {
    id: 'v10-content-split-metrics', name: '📈 Split Content + Metrics', category: 'Content',
    description: 'Image left with stacked metrics and body text on right',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '600px', backgroundColor: '#0a0a0a' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { overflow: 'hidden' } }, [
        s('image', { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', alt: 'Office' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }),
      ]),
      s('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
        s('text', { text: 'WHY US' }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#22d3ee', letterSpacing: '0.2em', marginBottom: '20px' } }),
        s('heading', { text: 'Results That\nCompound', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '24px' }, mobile: { fontSize: '32px' } }),
        s('text', { text: 'We don\'t just build — we architect for growth. Every decision is optimized for long-term compounding returns.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '40px' } }),
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' } },
          [
            { val: '3.2x', label: 'Revenue Growth' },
            { val: '67%', label: 'Cost Reduction' },
            { val: '< 1hr', label: 'Deploy Time' },
            { val: '4.9★', label: 'Client Rating' },
          ].map(m =>
            s('container', {}, { desktop: { borderLeft: '2px solid rgba(255,255,255,0.08)', paddingLeft: '16px' } }, [
              s('text', { text: m.val }, { desktop: { fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' } }),
              s('text', { text: m.label }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
            ])
          ),
        ),
      ]),
    ], 'Split Content + Metrics')],
  },

  // ═══════ 12. TEAM — Minimal Portrait Grid ═══════
  {
    id: 'v10-team-portraits', name: '👥 Minimal Portrait Grid', category: 'Team',
    description: 'Clean team grid with grayscale portraits and hover reveal',
    elements: [s('section', {}, { desktop: { backgroundColor: '#faf9f6', padding: '120px 60px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' } }, [
        s('text', { text: 'THE TEAM' }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#999', letterSpacing: '0.25em', marginBottom: '12px' } }),
        s('heading', { text: 'Meet the People\nBehind the Product', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '300', color: '#1a1a1a', lineHeight: '1.15', fontFamily: 'Georgia, serif' }, mobile: { fontSize: '32px' } }),
      ]),
      s('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' } },
        [
          { name: 'Alex Rivera', role: 'CEO & Founder', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
          { name: 'Jordan Lee', role: 'CTO', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400' },
          { name: 'Sam Patel', role: 'Head of Design', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400' },
          { name: 'Casey Kim', role: 'Head of Product', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400' },
        ].map(p =>
          s('container', {}, { desktop: { textAlign: 'center' } }, [
            s('image', { src: p.img, alt: p.name }, { desktop: { width: '100%', aspectRatio: '3/4', objectFit: 'cover', filter: 'grayscale(100%)', marginBottom: '16px' } }),
            s('text', { text: p.name }, { desktop: { fontSize: '15px', fontWeight: '600', color: '#1a1a1a', marginBottom: '4px' } }),
            s('text', { text: p.role }, { desktop: { fontSize: '12px', color: '#999', letterSpacing: '0.04em' } }),
          ])
        ),
      ),
    ], 'Team Portraits')],
  },

  // ═══════ 13. FAQ — Minimal Accordion ═══════
  {
    id: 'v10-faq-minimal', name: '❓ Minimal FAQ', category: 'FAQ',
    description: 'Clean Q&A list with rule dividers and compact typography',
    elements: [s('section', {}, { desktop: { backgroundColor: '#0a0a0a', padding: '120px 80px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '700px', margin: '0 auto' } }, [
        s('heading', { text: 'Frequently Asked Questions', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '56px' }, mobile: { fontSize: '28px' } }),
        ...[
          { q: 'How does the free tier work?', a: 'Start building immediately with no credit card required. The free tier includes 1 project, 10GB storage, and community support — forever free.' },
          { q: 'Can I migrate from my current platform?', a: 'Yes. We offer one-click migration tools for all major platforms including WordPress, Webflow, and custom codebases. Our team handles the heavy lifting.' },
          { q: 'What kind of support is included?', a: 'Free plans include community support. Pro plans include priority email support with < 4hr response times. Enterprise gets 24/7 phone and dedicated account management.' },
          { q: 'Is there a contract or commitment?', a: 'No contracts, no commitments. All plans are month-to-month and you can cancel anytime. We earn your business every month.' },
          { q: 'How does pricing scale with usage?', a: 'We use transparent usage-based pricing above plan limits. You\'ll always see your current usage in the dashboard and receive alerts before approaching limits.' },
        ].map((faq, i) =>
          s('container', {}, { desktop: { paddingBottom: '28px', marginBottom: '28px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.06)' : 'none' } }, [
            s('heading', { text: faq.q, level: 'h3' }, { desktop: { fontSize: '17px', fontWeight: '600', color: '#fff', marginBottom: '12px' } }),
            s('text', { text: faq.a }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
          ])
        ),
      ]),
    ], 'Minimal FAQ')],
  },

  // ═══════ 14. GALLERY — Masonry Grid ═══════
  {
    id: 'v10-gallery-masonry', name: '🖼️ Masonry Portfolio Gallery', category: 'Gallery',
    description: 'Asymmetric masonry grid with hover overlays',
    elements: [s('section', {}, { desktop: { backgroundColor: '#0a0a0a', padding: '100px 60px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '56px' } }, [
        s('heading', { text: 'Selected Work', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em' }, mobile: { fontSize: '32px' } }),
      ]),
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }, mobile: { gridTemplateColumns: '1fr 1fr', gap: '4px' } }, [
        s('image', { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600', alt: 'Project 1' }, { desktop: { width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' } }),
        s('image', { src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600', alt: 'Project 2' }, { desktop: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' } }),
        s('image', { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600', alt: 'Project 3' }, { desktop: { width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' } }),
        s('image', { src: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600', alt: 'Project 4' }, { desktop: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' } }),
        s('image', { src: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=600', alt: 'Project 5' }, { desktop: { width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' } }),
        s('image', { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600', alt: 'Project 6' }, { desktop: { width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' } }),
      ]),
    ], 'Masonry Gallery')],
  },

  // ═══════ 15. CONTACT — Minimal Two-Column ═══════
  {
    id: 'v10-contact-minimal', name: '📬 Minimal Contact Split', category: 'Contact',
    description: 'Two-column contact with left info and right form placeholder',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '600px' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { backgroundColor: '#000', padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
        s('text', { text: 'GET IN TOUCH' }, { desktop: { fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.25em', marginBottom: '20px' } }),
        s('heading', { text: 'Let\'s Build\nSomething Great', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '32px' }, mobile: { fontSize: '32px' } }),
        s('text', { text: 'hello@studio.com' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' } }),
        s('text', { text: '+44 20 7946 0958' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' } }),
        s('text', { text: '123 Design Street\nLondon, EC1A 1BB\nUnited Kingdom' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.25)', lineHeight: '1.8', whiteSpace: 'pre-line' } }),
      ]),
      s('container', {}, { desktop: { backgroundColor: '#111', padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '20px' }, mobile: { padding: '48px 24px' } }, [
        s('container', {}, { desktop: { borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' } }, [
          s('text', { text: 'Name' }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' as any, marginBottom: '8px' } }),
          s('text', { text: 'Your full name' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.15)' } }),
        ]),
        s('container', {}, { desktop: { borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' } }, [
          s('text', { text: 'Email' }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' as any, marginBottom: '8px' } }),
          s('text', { text: 'you@company.com' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.15)' } }),
        ]),
        s('container', {}, { desktop: { borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' } }, [
          s('text', { text: 'Message' }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' as any, marginBottom: '8px' } }),
          s('text', { text: 'Tell us about your project...' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.15)' } }),
        ]),
        s('button', { text: 'Send Message', href: '#' }, { desktop: { padding: '18px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '700', border: 'none', letterSpacing: '0.08em', width: '100%', marginTop: '12px' } }),
      ]),
    ], 'Contact Split')],
  },

  // ═══════ 16. FOOTER — Mega Footer ═══════
  {
    id: 'v10-footer-mega', name: '🦶 Mega Footer', category: 'Footers',
    description: 'Enterprise mega footer with multi-column links and newsletter',
    elements: [s('footer', {}, { desktop: { backgroundColor: '#050505', padding: '80px 60px 40px', borderTop: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '48px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '48px', marginBottom: '60px' }, mobile: { gridTemplateColumns: '1fr 1fr', gap: '32px' } }, [
        s('container', {}, { desktop: {}, mobile: { gridColumn: 'span 2' } }, [
          s('heading', { text: 'PLATFORM', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', marginBottom: '16px' } }),
          s('text', { text: 'Building the future of digital infrastructure. Start free, scale infinitely.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.7', maxWidth: '280px', marginBottom: '24px' } }),
          s('container', {}, { desktop: { display: 'flex', gap: '1px' } }, [
            s('container', {}, { desktop: { padding: '12px 20px', backgroundColor: 'rgba(255,255,255,0.04)', flex: '1' } }, [
              s('text', { text: 'your@email.com' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.2)' } }),
            ]),
            s('button', { text: '→', href: '#' }, { desktop: { padding: '12px 20px', backgroundColor: '#fff', color: '#000', border: 'none', fontSize: '14px', fontWeight: '700' } }),
          ]),
        ]),
        ...['Product', 'Company', 'Resources', 'Legal'].map(col =>
          s('container', {}, { desktop: {} }, [
            s('text', { text: col.toUpperCase() }, { desktop: { fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '20px' } }),
            ...['Overview', 'Features', 'Pricing', 'Changelog'].map(link =>
              s('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', marginBottom: '12px' } })
            ),
          ])
        ),
      ]),
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, mobile: { flexDirection: 'column', gap: '12px' } }, [
        s('text', { text: '© 2026 Platform Inc. All rights reserved.' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.2)' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '24px' } }, [
          s('link', { text: 'Privacy', href: '#' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' } }),
          s('link', { text: 'Terms', href: '#' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' } }),
          s('link', { text: 'Status', href: '#' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' } }),
        ]),
      ]),
    ], 'Mega Footer')],
  },

  // ═══════ 17. NAVBAR — Glassmorphic Floating ═══════
  {
    id: 'v10-nav-glass', name: '🔮 Glassmorphic Floating Nav', category: 'Navbars',
    description: 'Floating glassmorphic navbar with pill-shaped container',
    elements: [s('navbar', { brand: 'Brand' }, { desktop: { display: 'flex', justifyContent: 'center', padding: '20px 60px', width: '100%', backgroundColor: 'transparent', position: 'relative' }, mobile: { padding: '16px 20px' } }, [
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1100px', width: '100%', padding: '12px 32px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '100px' } }, [
        s('heading', { text: 'STUDIO', level: 'h3' }, { desktop: { fontSize: '14px', fontWeight: '800', color: '#fff', letterSpacing: '0.12em' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '32px', alignItems: 'center' }, mobile: { display: 'none' } },
          ['About', 'Work', 'Services', 'Contact'].map(l =>
            s('link', { text: l, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: '500' } })
          ),
        ),
        s('button', { text: 'Get Started', href: '#' }, { desktop: { padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: '#fff', borderRadius: '100px', fontSize: '12px', fontWeight: '600', border: 'none' } }),
      ]),
    ], 'Glass Nav')],
  },

  // ═══════ 18. BLOG — Magazine Layout ═══════
  {
    id: 'v10-blog-magazine', name: '📖 Magazine Blog Layout', category: 'Blog',
    description: 'Editorial blog grid with featured article and sidebar',
    elements: [s('section', {}, { desktop: { backgroundColor: '#faf9f6', padding: '100px 60px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto' } }, [
        s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px', borderBottom: '2px solid #1a1a1a', paddingBottom: '20px' } }, [
          s('heading', { text: 'Latest Articles', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '300', color: '#1a1a1a', fontFamily: 'Georgia, serif' } }),
          s('text', { text: 'View Archive →' }, { desktop: { fontSize: '13px', fontWeight: '600', color: '#1a1a1a' } }),
        ]),
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }, mobile: { gridTemplateColumns: '1fr' } }, [
          // Featured
          s('container', {}, { desktop: {} }, [
            s('image', { src: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800', alt: 'Featured' }, { desktop: { width: '100%', aspectRatio: '16/10', objectFit: 'cover', marginBottom: '24px' } }),
            s('text', { text: 'FEATURED • MARCH 2026' }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#999', letterSpacing: '0.2em', marginBottom: '12px' } }),
            s('heading', { text: 'The Architecture of Modern\nDesign Systems', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '300', color: '#1a1a1a', fontFamily: 'Georgia, serif', lineHeight: '1.3', marginBottom: '12px' } }),
            s('text', { text: 'How the world\'s best teams are building reusable component libraries that scale across products, platforms, and teams.' }, { desktop: { fontSize: '15px', color: '#777', lineHeight: '1.7' } }),
          ]),
          // Sidebar list
          s('container', {}, { desktop: { borderLeft: '1px solid #e0ddd5', paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }, mobile: { borderLeft: 'none', paddingLeft: '0' } },
            [
              { date: 'Mar 18', title: 'Designing for Accessibility in 2026' },
              { date: 'Mar 12', title: 'The Rise of Edge Computing' },
              { date: 'Mar 5', title: 'Building with AI: Practical Patterns' },
              { date: 'Feb 28', title: 'Performance Budgets That Work' },
            ].map(post =>
              s('container', {}, { desktop: { paddingBottom: '24px', borderBottom: '1px solid #e0ddd5' } }, [
                s('text', { text: post.date.toUpperCase() }, { desktop: { fontSize: '10px', fontWeight: '600', color: '#bbb', letterSpacing: '0.1em', marginBottom: '8px' } }),
                s('heading', { text: post.title, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#1a1a1a', lineHeight: '1.4' } }),
              ])
            ),
          ),
        ]),
      ]),
    ], 'Magazine Blog')],
  },

  // ═══════ 19. ABOUT — Vision Statement ═══════
  {
    id: 'v10-about-vision', name: '🌟 Vision Statement', category: 'About',
    description: 'Dramatic vision/mission section with oversized number accents',
    elements: [s('section', {}, { desktop: { backgroundColor: '#000', padding: '140px 80px', position: 'relative' }, mobile: { padding: '80px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px' }, mobile: { gridTemplateColumns: '1fr', gap: '48px' } }, [
        s('container', {}, { desktop: {} }, [
          s('text', { text: 'OUR VISION' }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#8b5cf6', letterSpacing: '0.25em', marginBottom: '20px' } }),
          s('heading', { text: 'To Democratize\nDigital Excellence', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '24px' }, mobile: { fontSize: '32px' } }),
          s('text', { text: 'We believe that extraordinary digital experiences shouldn\'t be reserved for companies with unlimited budgets. Our platform levels the playing field.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8' } }),
        ]),
        s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '32px' } },
          [
            { num: '2019', label: 'Founded', desc: 'Started with a simple idea: make professional design accessible to everyone.' },
            { num: '50+', label: 'Team Members', desc: 'A globally distributed team of designers, engineers, and product thinkers.' },
            { num: '120+', label: 'Countries', desc: 'Serving customers and creators in over 120 countries worldwide.' },
          ].map(item =>
            s('container', {}, { desktop: { borderLeft: '2px solid rgba(139,92,246,0.3)', paddingLeft: '24px' } }, [
              s('text', { text: item.num }, { desktop: { fontSize: '32px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em', marginBottom: '4px' } }),
              s('text', { text: item.label }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#8b5cf6', letterSpacing: '0.12em', textTransform: 'uppercase' as any, marginBottom: '8px' } }),
              s('text', { text: item.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6' } }),
            ])
          ),
        ),
      ]),
    ], 'Vision Statement')],
  },

  // ═══════ 20. BANNER — Announcement Strip ═══════
  {
    id: 'v10-banner-announcement', name: '📢 Announcement Strip', category: 'Banners',
    description: 'Gradient announcement banner with dismiss feel and CTA link',
    elements: [s('section', {}, { desktop: { background: 'linear-gradient(90deg, #8b5cf6, #3b82f6, #06b6d4)', padding: '12px 40px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }, mobile: { padding: '10px 16px', flexWrap: 'wrap' } }, [
      s('text', { text: '🎉' }, { desktop: { fontSize: '14px' } }),
      s('text', { text: 'Version 3.0 is here — Introducing AI-powered design generation.' }, { desktop: { fontSize: '13px', fontWeight: '600', color: '#fff' } }),
      s('link', { text: 'Learn more →', href: '#' }, { desktop: { fontSize: '13px', fontWeight: '700', color: '#fff', textDecoration: 'underline', textUnderlineOffset: '3px' } }),
    ], 'Announcement Banner')],
  },

  // ═══════ 21. COMPARISON — Feature Matrix ═══════
  {
    id: 'v10-comparison-matrix', name: '⚖️ Feature Comparison Matrix', category: 'Comparison',
    description: 'Clean comparison table with check/cross indicators',
    elements: [s('section', {}, { desktop: { backgroundColor: '#0a0a0a', padding: '120px 60px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', textAlign: 'center', marginBottom: '56px' } }, [
        s('heading', { text: 'Why Choose Us', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' } }),
        s('text', { text: 'See how we compare to the alternatives.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.35)' } }),
      ]),
      s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto' } }, [
        // Header row
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1px', marginBottom: '2px' } }, [
          s('container', {}, { desktop: { padding: '16px 20px' } }),
          s('text', { text: 'Us' }, { desktop: { padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '800', color: '#8b5cf6', letterSpacing: '0.06em', backgroundColor: 'rgba(139,92,246,0.06)' } }),
          s('text', { text: 'Alt A' }, { desktop: { padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' } }),
          s('text', { text: 'Alt B' }, { desktop: { padding: '16px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', backgroundColor: 'rgba(255,255,255,0.02)' } }),
        ]),
        ...[
          { feature: 'AI Generation', us: true, a: false, b: false },
          { feature: 'Visual Editor', us: true, a: true, b: false },
          { feature: 'Custom Code Export', us: true, a: false, b: true },
          { feature: 'Team Collaboration', us: true, a: true, b: true },
          { feature: 'Edge Deployment', us: true, a: false, b: false },
          { feature: 'Free Tier', us: true, a: true, b: false },
        ].map(row =>
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '1px', marginBottom: '1px' } }, [
            s('text', { text: row.feature }, { desktop: { padding: '14px 20px', fontSize: '14px', color: 'rgba(255,255,255,0.6)', backgroundColor: 'rgba(255,255,255,0.02)' } }),
            s('text', { text: row.us ? '✓' : '—' }, { desktop: { padding: '14px', textAlign: 'center', fontSize: '16px', color: row.us ? '#8b5cf6' : 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(139,92,246,0.03)', fontWeight: '700' } }),
            s('text', { text: row.a ? '✓' : '—' }, { desktop: { padding: '14px', textAlign: 'center', fontSize: '16px', color: row.a ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' } }),
            s('text', { text: row.b ? '✓' : '—' }, { desktop: { padding: '14px', textAlign: 'center', fontSize: '16px', color: row.b ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.02)' } }),
          ])
        ),
      ]),
    ], 'Comparison Matrix')],
  },

  // ═══════ 22. CTA — Newsletter ═══════
  {
    id: 'v10-cta-newsletter', name: '📧 Newsletter CTA', category: 'CTA',
    description: 'Centered newsletter signup with gradient accent',
    elements: [s('section', {}, { desktop: { backgroundColor: '#0a0a0a', padding: '120px 60px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto', textAlign: 'center' } }, [
        s('text', { text: '✦' }, { desktop: { fontSize: '24px', color: '#8b5cf6', marginBottom: '24px' } }),
        s('heading', { text: 'Stay in the Loop', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' } }),
        s('text', { text: 'Join 15,000+ designers and developers who get our weekly insights on building better digital products.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '36px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '1px', maxWidth: '440px', margin: '0 auto' } }, [
          s('container', {}, { desktop: { flex: '1', padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRight: 'none' } }, [
            s('text', { text: 'you@email.com' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.2)' } }),
          ]),
          s('button', { text: 'Subscribe', href: '#' }, { desktop: { padding: '16px 32px', background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '700', letterSpacing: '0.06em' } }),
        ]),
        s('text', { text: 'No spam. Unsubscribe anytime.' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)', marginTop: '16px' } }),
      ]),
    ], 'Newsletter CTA')],
  },

  // ═══════ 23. PORTFOLIO — Case Study Card ═══════
  {
    id: 'v10-portfolio-case-study', name: '💼 Case Study Showcase', category: 'Portfolio',
    description: 'Full-width case study card with metrics and image',
    elements: [s('section', {}, { desktop: { backgroundColor: '#000', padding: '100px 60px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        s('text', { text: 'CASE STUDY' }, { desktop: { fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.25em', marginBottom: '48px' } }),
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '60px', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', gap: '32px' } }, [
          s('container', {}, { desktop: {} }, [
            s('text', { text: 'FINTECH' }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#22d3ee', letterSpacing: '0.15em', marginBottom: '16px' } }),
            s('heading', { text: 'How Acme Payments Reduced Checkout Abandonment by 42%', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', lineHeight: '1.15', letterSpacing: '-0.02em', marginBottom: '20px' }, mobile: { fontSize: '28px' } }),
            s('text', { text: 'By redesigning their entire checkout flow with our platform, Acme achieved record conversion rates within 90 days of launch.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '32px' } }),
            s('container', {}, { desktop: { display: 'flex', gap: '32px', marginBottom: '32px' } },
              [
                { val: '42%', label: 'Less Abandonment' },
                { val: '3.1x', label: 'ROI in 90 Days' },
                { val: '98%', label: 'Client Satisfaction' },
              ].map(m =>
                s('container', {}, { desktop: {} }, [
                  s('text', { text: m.val }, { desktop: { fontSize: '28px', fontWeight: '800', color: '#fff', letterSpacing: '-0.02em' } }),
                  s('text', { text: m.label }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
                ])
              ),
            ),
            s('button', { text: 'Read Full Case Study →', href: '#' }, { desktop: { padding: '16px 0', backgroundColor: 'transparent', color: '#fff', border: 'none', fontSize: '14px', fontWeight: '600', borderBottom: '2px solid rgba(255,255,255,0.2)', width: 'fit-content' } }),
          ]),
          s('container', {}, { desktop: { borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' } }, [
            s('image', { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800', alt: 'Case Study' }, { desktop: { width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' } }),
          ]),
        ]),
      ]),
    ], 'Case Study')],
  },

  // ═══════ 24. INTERACTIVE — Tabbed Feature Showcase ═══════
  {
    id: 'v10-interactive-tabs', name: '🖱️ Tabbed Feature Showcase', category: 'Interactive',
    description: 'Feature tabs with visual content area — designed for interaction building',
    elements: [s('section', {}, { desktop: { backgroundColor: '#0a0a0a', padding: '120px 60px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', textAlign: 'center', marginBottom: '48px' } }, [
        s('heading', { text: 'Everything You Need', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '32px' } }),
        s('text', { text: 'A complete platform for building, launching, and scaling digital products.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)' } }),
      ]),
      s('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto' } }, [
        // Tab buttons
        s('container', {}, { desktop: { display: 'flex', gap: '2px', marginBottom: '2px', justifyContent: 'center' } },
          ['Design', 'Develop', 'Deploy', 'Analyze'].map((tab, i) =>
            s('button', { text: tab, href: '#' }, { desktop: { padding: '14px 32px', backgroundColor: i === 0 ? 'rgba(139,92,246,0.1)' : 'rgba(255,255,255,0.03)', color: i === 0 ? '#8b5cf6' : 'rgba(255,255,255,0.4)', border: i === 0 ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(255,255,255,0.06)', fontSize: '13px', fontWeight: '600', letterSpacing: '0.04em', borderRadius: '0' } })
          ),
        ),
        // Tab content area
        s('container', {}, { desktop: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '60px', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
          s('container', {}, { desktop: { textAlign: 'center', maxWidth: '500px' } }, [
            s('text', { text: '🎨' }, { desktop: { fontSize: '48px', marginBottom: '24px' } }),
            s('heading', { text: 'Visual Design Studio', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '16px' } }),
            s('text', { text: 'Drag, drop, and design with our powerful visual editor. Real-time preview, component library, and one-click responsive layouts.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
          ]),
        ]),
      ]),
    ], 'Tabbed Features')],
  },

  // ═══════ 25. HERO — Gradient Orb ═══════
  {
    id: 'v10-hero-orb', name: '🔵 Gradient Orb Hero', category: 'Heroes',
    description: 'Massive floating gradient orb behind centered hero content',
    elements: [anim(s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', overflow: 'hidden' } }, [
      // The orb
      s('container', {}, { desktop: { position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.25) 0%, rgba(59,130,246,0.15) 40%, rgba(6,182,212,0.05) 70%, transparent 100%)', filter: 'blur(80px)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' }, mobile: { width: '400px', height: '400px' } }),
      // Content
      s('container', {}, { desktop: { position: 'relative', zIndex: '1', textAlign: 'center', maxWidth: '800px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        s('text', { text: 'INTRODUCING' }, { desktop: { fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.3em', marginBottom: '28px' } }),
        s('heading', { text: 'The Next Chapter\nin Digital Design', level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '800', color: '#fff', lineHeight: '1.0', letterSpacing: '-0.04em', marginBottom: '28px', background: 'linear-gradient(180deg, #fff 30%, rgba(255,255,255,0.5) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }, mobile: { fontSize: '40px' } }),
        s('text', { text: 'A unified platform where design, code, and deployment converge into a single seamless experience.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '48px', maxWidth: '550px', margin: '0 auto 48px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '16px', justifyContent: 'center' } }, [
          s('button', { text: 'Start Building', href: '#' }, { desktop: { padding: '20px 48px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '700', border: 'none', boxShadow: '0 8px 32px rgba(139,92,246,0.25)' } }),
          s('button', { text: 'See Examples', href: '#' }, { desktop: { padding: '20px 48px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)' } }),
        ]),
      ]),
    ], 'Gradient Orb Hero'), FU())],
  },
];
