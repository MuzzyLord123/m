import { EditorElement } from '../types';
import { SectionBlock } from './sectionBlocks';

let _pv = 0;
function pvid(): string {
  _pv++;
  return `premv2-${_pv}-${Math.random().toString(36).slice(2, 7)}`;
}

function el(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: pvid(), type, name: name ?? type, props, styles, children };
}

// ════════════════════════════════════════════════════════════════════
//  GRADIENT MESH HEROES — Ultra Modern
// ════════════════════════════════════════════════════════════════════

const GRADIENT_MESH_HEROES: SectionBlock[] = [
  {
    id: 'hero-aurora-mesh', name: 'Aurora — Mesh Gradient Hero', category: 'Heroes',
    description: 'Stunning aurora-style mesh gradient hero with floating glass elements',
    elements: [el('section', {}, { desktop: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0a0015 0%, #1a0030 25%, #0d1b2a 50%, #0a192f 75%, #020c1b 100%)', padding: '80px 24px', textAlign: 'center' }, mobile: { minHeight: '90vh', padding: '60px 20px' } }, [
      // Aurora orbs
      el('container', {}, { desktop: { position: 'absolute', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(120,0,255,0.12) 0%, transparent 70%)', top: '-15%', left: '-10%', filter: 'blur(60px)', pointerEvents: 'none' } }),
      el('container', {}, { desktop: { position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,200,255,0.1) 0%, transparent 70%)', bottom: '10%', right: '-5%', filter: 'blur(50px)', pointerEvents: 'none' } }),
      el('container', {}, { desktop: { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,0,128,0.08) 0%, transparent 70%)', top: '40%', left: '50%', transform: 'translateX(-50%)', filter: 'blur(40px)', pointerEvents: 'none' } }),
      // Content
      el('container', {}, { desktop: { position: 'relative', zIndex: '1', maxWidth: '800px' } }, [
        el('badge', { text: '🌟 Next Generation Platform' }, { desktop: { display: 'inline-flex', padding: '8px 20px', borderRadius: '100px', fontSize: '12px', fontWeight: '500', color: '#c4b5fd', backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', marginBottom: '32px', letterSpacing: '0.02em', backdropFilter: 'blur(8px)' } }),
        el('heading', { text: 'Design the future\nwith precision', level: 'h1' }, { desktop: { fontSize: '80px', fontWeight: '700', color: '#ffffff', lineHeight: '1.02', letterSpacing: '-0.045em', marginBottom: '28px', whiteSpace: 'pre-line', background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #93c5fd 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }, mobile: { fontSize: '42px' } }),
        el('text', { text: 'The all-in-one platform that empowers teams to create, collaborate, and ship world-class products at unprecedented speed.' }, { desktop: { fontSize: '19px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', maxWidth: '580px', margin: '0 auto 44px' }, mobile: { fontSize: '16px' } }),
        el('container', {}, { desktop: { display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' } }, [
          el('button', { text: 'Start Building — Free →' }, { desktop: { padding: '16px 36px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: 'none', boxShadow: '0 4px 24px rgba(99,102,241,0.3)' } }),
          el('button', { text: 'Watch Demo' }, { desktop: { padding: '16px 36px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', fontSize: '15px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' } }),
        ]),
      ]),
      // Floating glass cards
      el('container', {}, { desktop: { position: 'absolute', top: '18%', right: '8%', width: '160px', padding: '16px 20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', transform: 'rotate(6deg)', pointerEvents: 'none' }, mobile: { display: 'none' } }, [
        el('text', { text: '↑ 247%' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#4ade80' } }),
        el('text', { text: 'Conversion Rate' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' } }),
      ]),
      el('container', {}, { desktop: { position: 'absolute', bottom: '22%', left: '6%', width: '180px', padding: '16px 20px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)', transform: 'rotate(-4deg)', pointerEvents: 'none' }, mobile: { display: 'none' } }, [
        el('text', { text: '⚡ 50ms' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#60a5fa' } }),
        el('text', { text: 'Avg Response' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginTop: '4px' } }),
      ]),
    ], 'Aurora Hero')],
  },
  {
    id: 'hero-neon-gradient', name: 'Neon — Gradient Glow Hero', category: 'Heroes',
    description: 'Dark hero with neon accent glows and animated gradient text',
    elements: [el('section', {}, { desktop: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '80px 24px' }, mobile: { minHeight: '85vh', padding: '60px 20px' } }, [
      // Neon line accent
      el('container', {}, { desktop: { position: 'absolute', top: '0', left: '50%', transform: 'translateX(-50%)', width: '1px', height: '200px', background: 'linear-gradient(180deg, transparent, #6366f1, transparent)', pointerEvents: 'none' } }),
      el('container', {}, { desktop: { position: 'absolute', width: '1200px', height: '600px', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'radial-gradient(ellipse, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents: 'none' } }),
      el('container', {}, { desktop: { position: 'relative', zIndex: '1', maxWidth: '900px' } }, [
        el('container', {}, { desktop: { display: 'flex', justifyContent: 'center', marginBottom: '40px', gap: '32px', opacity: '0.3' }, mobile: { gap: '16px', flexWrap: 'wrap' } }, [
          el('text', { text: 'STRIPE' }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#fff', letterSpacing: '0.15em' } }),
          el('text', { text: 'VERCEL' }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#fff', letterSpacing: '0.15em' } }),
          el('text', { text: 'LINEAR' }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#fff', letterSpacing: '0.15em' } }),
          el('text', { text: 'NOTION' }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#fff', letterSpacing: '0.15em' } }),
        ]),
        el('heading', { text: 'Build at the\nspeed of thought', level: 'h1' }, { desktop: { fontSize: '88px', fontWeight: '700', color: '#fff', lineHeight: '1', letterSpacing: '-0.05em', marginBottom: '28px', whiteSpace: 'pre-line' }, mobile: { fontSize: '44px' } }),
        el('text', { text: 'The infrastructure platform for the modern web. Go from zero to production in minutes, not months.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', maxWidth: '540px', margin: '0 auto 48px' } }),
        el('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center' } }, [
          el('button', { text: 'Get Started Free' }, { desktop: { padding: '16px 40px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none' } }),
          el('button', { text: 'Talk to Sales →' }, { desktop: { padding: '16px 40px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.1)' } }),
        ]),
      ]),
    ], 'Neon Hero')],
  },
  {
    id: 'hero-split-gradient-img', name: 'Split — Gradient + Image', category: 'Heroes',
    description: 'Two-column hero with gradient left and product image right',
    elements: [el('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)' }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
      el('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '100px 80px' }, mobile: { padding: '80px 24px 40px' } }, [
        el('badge', { text: '🎯 New Release' }, { desktop: { display: 'inline-flex', padding: '6px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', color: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.15)', marginBottom: '28px', width: 'fit-content' } }),
        el('heading', { text: 'The smarter way\nto manage your\nbusiness', level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.035em', marginBottom: '24px', whiteSpace: 'pre-line' }, mobile: { fontSize: '36px' } }),
        el('text', { text: 'Streamline operations, automate workflows, and grow revenue with our all-in-one platform trusted by 50,000+ businesses.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '40px', maxWidth: '440px' } }),
        el('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
          el('button', { text: 'Start Free Trial' }, { desktop: { padding: '14px 28px', background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: 'none', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' } }),
          el('button', { text: 'Book Demo' }, { desktop: { padding: '14px 28px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)', borderRadius: '10px', fontSize: '14px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.1)' } }),
        ]),
        // Trust stats
        el('container', {}, { desktop: { display: 'flex', gap: '36px', marginTop: '48px' }, mobile: { gap: '20px' } }, [
          el('container', {}, { desktop: {} }, [
            el('text', { text: '50K+' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff' } }),
            el('text', { text: 'Active Users' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)' } }),
          ]),
          el('container', {}, { desktop: {} }, [
            el('text', { text: '99.9%' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff' } }),
            el('text', { text: 'Uptime' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)' } }),
          ]),
          el('container', {}, { desktop: {} }, [
            el('text', { text: '4.9★' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff' } }),
            el('text', { text: 'Rating' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)' } }),
          ]),
        ]),
      ]),
      el('container', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', position: 'relative' }, mobile: { padding: '20px 24px 60px' } }, [
        el('container', {}, { desktop: { width: '100%', maxWidth: '500px', aspectRatio: '4/5', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 32px 64px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
          el('text', { text: '[ Product Screenshot ]' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.12)' } }),
        ]),
      ]),
    ], 'Split Gradient Hero')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  ANIMATED FEATURE SECTIONS
// ════════════════════════════════════════════════════════════════════

function glassCard(icon: string, title: string, desc: string, gradient: string) {
  return el('card', {}, { desktop: { padding: '36px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden' } }, [
    // Gradient accent line
    el('container', {}, { desktop: { position: 'absolute', top: '0', left: '0', right: '0', height: '2px', background: gradient } }),
    el('container', {}, { desktop: { width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', marginBottom: '20px', background: `${gradient.replace('linear-gradient', 'linear-gradient').replace(')', ', 0.1)')}`, backdropFilter: 'blur(4px)' } }, [
      el('text', { text: icon }, { desktop: { fontSize: '22px' } }),
    ]),
    el('heading', { text: title, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '10px', letterSpacing: '-0.01em' } }),
    el('text', { text: desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
  ]);
}

const ANIMATED_FEATURES: SectionBlock[] = [
  {
    id: 'feat-gradient-accent-grid', name: 'Features — Gradient Accent Grid', category: 'Features',
    description: 'Feature grid with gradient accent lines and glass cards',
    elements: [el('section', {}, { desktop: { padding: '140px 80px', background: 'linear-gradient(180deg, #050505 0%, #0a0a1a 50%, #050505 100%)' }, mobile: { padding: '60px 20px' } }, [
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center' } }, [
        el('badge', { text: 'FEATURES' }, { desktop: { display: 'inline-flex', padding: '6px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', color: '#818cf8', backgroundColor: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.12)', marginBottom: '20px', letterSpacing: '0.1em' } }),
        el('heading', { text: 'Everything you need\nto ship faster', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff', letterSpacing: '-0.035em', lineHeight: '1.1', marginBottom: '20px', whiteSpace: 'pre-line' }, mobile: { fontSize: '32px' } }),
        el('text', { text: 'Powerful tools that work together seamlessly, so you can focus on what matters most.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', marginBottom: '64px', maxWidth: '520px', margin: '0 auto 64px' } }),
        el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }, mobile: { gridTemplateColumns: '1fr', gap: '12px' } }, [
          glassCard('⚡', 'Lightning Deploys', 'Push to production in seconds. Every commit gets a preview URL.', 'linear-gradient(135deg, #6366f1, #8b5cf6)'),
          glassCard('🔒', 'Enterprise Security', 'SOC 2 Type II compliant with end-to-end encryption and SSO.', 'linear-gradient(135deg, #10b981, #34d399)'),
          glassCard('📊', 'Live Analytics', 'Real-time dashboards with custom metrics and alerting built in.', 'linear-gradient(135deg, #3b82f6, #60a5fa)'),
          glassCard('🌍', 'Global Edge', '200+ edge locations. Your users get <50ms latency worldwide.', 'linear-gradient(135deg, #f59e0b, #fbbf24)'),
          glassCard('🔌', 'Native Integrations', 'Connect with 500+ tools through our API and webhook system.', 'linear-gradient(135deg, #ec4899, #f472b6)'),
          glassCard('🧩', 'Modular Architecture', 'Pick what you need. Every feature works standalone or together.', 'linear-gradient(135deg, #14b8a6, #5eead4)'),
        ]),
      ]),
    ], 'Feature Grid')],
  },
  {
    id: 'feat-split-showcase', name: 'Features — Split Showcase', category: 'Features',
    description: 'Alternating feature sections with image and description side by side',
    elements: [el('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#050505' }, mobile: { padding: '60px 20px' } }, [
      el('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto' } }, [
        // Feature 1
        el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', marginBottom: '120px' }, mobile: { gridTemplateColumns: '1fr', gap: '40px', marginBottom: '60px' } }, [
          el('container', {}, { desktop: {} }, [
            el('text', { text: '01' }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#6366f1', letterSpacing: '0.1em', marginBottom: '16px' } }),
            el('heading', { text: 'Intelligent\nAutomation', level: 'h3' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.15', marginBottom: '16px', whiteSpace: 'pre-line' }, mobile: { fontSize: '28px' } }),
            el('text', { text: 'Automate repetitive tasks with AI-powered workflows. From lead scoring to customer segmentation, let machines handle the heavy lifting.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '24px' } }),
            el('container', {}, { desktop: { display: 'flex', gap: '24px' } }, [
              el('container', {}, { desktop: {} }, [
                el('text', { text: '10x' }, { desktop: { fontSize: '22px', fontWeight: '700', color: '#6366f1' } }),
                el('text', { text: 'Faster' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)' } }),
              ]),
              el('container', {}, { desktop: {} }, [
                el('text', { text: '85%' }, { desktop: { fontSize: '22px', fontWeight: '700', color: '#6366f1' } }),
                el('text', { text: 'Less Manual' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)' } }),
              ]),
            ]),
          ]),
          el('container', {}, { desktop: { aspectRatio: '4/3', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))', border: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
            el('text', { text: '[ Feature Visual ]' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.1)' } }),
          ]),
        ]),
        // Feature 2 — reversed
        el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', gap: '40px' } }, [
          el('container', {}, { desktop: { aspectRatio: '4/3', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))', border: '1px solid rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }, mobile: { order: '2' } }, [
            el('text', { text: '[ Feature Visual ]' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.1)' } }),
          ]),
          el('container', {}, { desktop: {} }, [
            el('text', { text: '02' }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#10b981', letterSpacing: '0.1em', marginBottom: '16px' } }),
            el('heading', { text: 'Real-time\nCollaboration', level: 'h3' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.15', marginBottom: '16px', whiteSpace: 'pre-line' }, mobile: { fontSize: '28px' } }),
            el('text', { text: 'Work together in real-time with your team. See changes as they happen, leave comments, and resolve issues faster.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
          ]),
        ]),
      ]),
    ], 'Split Features')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  PREMIUM TESTIMONIAL SECTIONS
// ════════════════════════════════════════════════════════════════════

const PREMIUM_TESTIMONIALS_V2: SectionBlock[] = [
  {
    id: 'testimonial-gradient-cards', name: 'Testimonials — Gradient Border Cards', category: 'Testimonials',
    description: 'Testimonial cards with gradient borders and avatars',
    elements: [el('section', {}, { desktop: { padding: '140px 80px', background: 'linear-gradient(180deg, #050505, #0a0a1a)' }, mobile: { padding: '60px 20px' } }, [
      el('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', textAlign: 'center' } }, [
        el('badge', { text: '⭐ TESTIMONIALS' }, { desktop: { display: 'inline-flex', padding: '6px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', color: '#fbbf24', backgroundColor: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.12)', marginBottom: '20px', letterSpacing: '0.08em' } }),
        el('heading', { text: 'Loved by 50,000+\nteams worldwide', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '56px', whiteSpace: 'pre-line' }, mobile: { fontSize: '32px' } }),
        el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }, mobile: { gridTemplateColumns: '1fr', gap: '16px' } }, [
          ...[
            { quote: 'This platform cut our development time by 70%. We shipped our entire product in 3 weeks instead of 3 months.', name: 'Sarah Chen', role: 'CTO, Hypergrowth', accent: '#8b5cf6' },
            { quote: 'The best engineering investment we\'ve ever made. Our team is 5x more productive and happier.', name: 'Marcus Johnson', role: 'VP Eng, ScaleAI', accent: '#3b82f6' },
            { quote: 'Switched from 4 different tools to this. Simpler stack, better results, lower costs. No brainer.', name: 'Priya Sharma', role: 'Founder, NexaLabs', accent: '#10b981' },
          ].map(t =>
            el('card', {}, { desktop: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', position: 'relative', overflow: 'hidden' } }, [
              el('container', {}, { desktop: { position: 'absolute', top: '0', left: '0', right: '0', height: '2px', background: `linear-gradient(90deg, ${t.accent}, transparent)` } }),
              el('text', { text: '★★★★★' }, { desktop: { fontSize: '14px', color: '#fbbf24', marginBottom: '16px', letterSpacing: '2px' } }),
              el('text', { text: `"${t.quote}"` }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginBottom: '24px' } }),
              el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
                el('container', {}, { desktop: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: `${t.accent}15`, border: `1px solid ${t.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
                  el('text', { text: t.name[0] }, { desktop: { fontSize: '14px', fontWeight: '600', color: t.accent } }),
                ]),
                el('container', {}, { desktop: {} }, [
                  el('text', { text: t.name }, { desktop: { fontSize: '13px', fontWeight: '600', color: '#fff' } }),
                  el('text', { text: t.role }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.35)' } }),
                ]),
              ]),
            ])
          ),
        ]),
      ]),
    ], 'Testimonials')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  ANIMATED CTA SECTIONS
// ════════════════════════════════════════════════════════════════════

const ANIMATED_CTA_V2: SectionBlock[] = [
  {
    id: 'cta-gradient-mesh', name: 'CTA — Gradient Mesh', category: 'CTA',
    description: 'Full-width CTA with animated gradient mesh background',
    elements: [el('section', {}, { desktop: { padding: '120px 80px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f172a 100%)', textAlign: 'center' }, mobile: { padding: '80px 20px' } }, [
      el('container', {}, { desktop: { position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', top: '-20%', right: '-10%', filter: 'blur(60px)', pointerEvents: 'none' } }),
      el('container', {}, { desktop: { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', bottom: '-15%', left: '-5%', filter: 'blur(40px)', pointerEvents: 'none' } }),
      el('container', {}, { desktop: { maxWidth: '700px', margin: '0 auto', position: 'relative', zIndex: '1' } }, [
        el('heading', { text: 'Ready to transform\nyour workflow?', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff', letterSpacing: '-0.035em', lineHeight: '1.1', marginBottom: '20px', whiteSpace: 'pre-line' }, mobile: { fontSize: '32px' } }),
        el('text', { text: 'Join 50,000+ teams already building with us. Start for free, no credit card required.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '40px' } }),
        el('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' } }, [
          el('button', { text: 'Start Building — Free' }, { desktop: { padding: '16px 36px', backgroundColor: '#fff', color: '#1e1b4b', borderRadius: '12px', fontSize: '15px', fontWeight: '700', border: 'none', boxShadow: '0 4px 20px rgba(255,255,255,0.1)' } }),
          el('button', { text: 'Schedule a Demo' }, { desktop: { padding: '16px 36px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', borderRadius: '12px', fontSize: '15px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' } }),
        ]),
      ]),
    ], 'Gradient CTA')],
  },
  {
    id: 'cta-glowing-border', name: 'CTA — Glowing Border Card', category: 'CTA',
    description: 'Centered card with animated gradient border and glow',
    elements: [el('section', {}, { desktop: { padding: '140px 80px', backgroundColor: '#000' }, mobile: { padding: '80px 20px' } }, [
      el('container', {}, { desktop: { maxWidth: '720px', margin: '0 auto', padding: '72px', borderRadius: '24px', textAlign: 'center', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.04) 100%)', border: '1px solid rgba(99,102,241,0.15)', boxShadow: '0 0 100px rgba(99,102,241,0.08), 0 0 40px rgba(99,102,241,0.04)' }, mobile: { padding: '48px 24px' } }, [
        // Corner glow accents
        el('container', {}, { desktop: { position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', top: '-50px', right: '-50px', pointerEvents: 'none' } }),
        el('text', { text: '🚀' }, { desktop: { fontSize: '40px', marginBottom: '20px' } }),
        el('heading', { text: 'Ship your next big thing', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: '1.15' }, mobile: { fontSize: '28px' } }),
        el('text', { text: 'Everything you need to go from idea to production. Database, auth, storage, and edge functions — all included free.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '36px' } }),
        el('button', { text: 'Get Started Free →' }, { desktop: { padding: '16px 40px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' } }),
        el('text', { text: 'No credit card required · Free forever plan' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '16px' } }),
      ]),
    ], 'Glow CTA')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  PREMIUM PRICING V2
// ════════════════════════════════════════════════════════════════════

const PREMIUM_PRICING_V2: SectionBlock[] = [
  {
    id: 'pricing-glass-cards', name: 'Pricing — Glass Cards', category: 'Pricing',
    description: 'Premium pricing cards with glassmorphism and gradient accents',
    elements: [el('section', {}, { desktop: { padding: '140px 80px', background: 'linear-gradient(180deg, #050505 0%, #0a0a1a 100%)', textAlign: 'center' }, mobile: { padding: '60px 20px' } }, [
      el('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto' } }, [
        el('badge', { text: 'PRICING' }, { desktop: { display: 'inline-flex', padding: '6px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', color: '#10b981', backgroundColor: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', marginBottom: '20px', letterSpacing: '0.08em' } }),
        el('heading', { text: 'Simple, transparent pricing', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '32px' } }),
        el('text', { text: 'Start free. Scale as you grow. No hidden fees, ever.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', marginBottom: '64px' } }),
        el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', gap: '16px' } }, [
          // Free
          el('card', {}, { desktop: { padding: '44px 32px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' } }, [
            el('text', { text: 'Free' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' } }),
            el('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' } }, [
              el('heading', { text: '$0', level: 'h3' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff' } }),
              el('text', { text: '/month' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)' } }),
            ]),
            el('text', { text: 'Perfect for side projects and learning.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6', marginBottom: '28px' } }),
            el('button', { text: 'Get Started Free' }, { desktop: { width: '100%', padding: '14px', backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', marginBottom: '28px' } }),
            ...[
              '3 Projects', '1GB Storage', 'Community Support', 'Basic Analytics',
            ].map(f => el('text', { text: `✓ ${f}` }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' } })),
          ]),
          // Pro — featured
          el('card', {}, { desktop: { padding: '52px 36px', backgroundColor: 'rgba(99,102,241,0.04)', borderRadius: '24px', border: '1px solid rgba(99,102,241,0.2)', textAlign: 'left', position: 'relative', boxShadow: '0 0 60px rgba(99,102,241,0.08)' } }, [
            el('badge', { text: 'MOST POPULAR' }, { desktop: { position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', padding: '6px 20px', borderRadius: '100px', fontSize: '10px', fontWeight: '700', color: '#fff', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', letterSpacing: '0.1em', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' } }),
            el('text', { text: 'Pro' }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#a78bfa', marginBottom: '8px' } }),
            el('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' } }, [
              el('heading', { text: '$29', level: 'h3' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff' } }),
              el('text', { text: '/month' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)' } }),
            ]),
            el('text', { text: 'For professionals and growing teams.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6', marginBottom: '28px' } }),
            el('button', { text: 'Start 14-Day Trial' }, { desktop: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: 'none', textAlign: 'center', marginBottom: '28px', boxShadow: '0 4px 16px rgba(99,102,241,0.2)' } }),
            ...[
              'Unlimited Projects', '100GB Storage', 'Priority Support', 'Advanced Analytics', 'Custom Domains', 'Team Collaboration',
            ].map(f => el('text', { text: `✓ ${f}` }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '10px' } })),
          ]),
          // Enterprise
          el('card', {}, { desktop: { padding: '44px 32px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' } }, [
            el('text', { text: 'Enterprise' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' } }),
            el('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' } }, [
              el('heading', { text: 'Custom', level: 'h3' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff' } }),
            ]),
            el('text', { text: 'For organizations with advanced needs.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6', marginBottom: '28px' } }),
            el('button', { text: 'Contact Sales' }, { desktop: { width: '100%', padding: '14px', backgroundColor: 'rgba(255,255,255,0.04)', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center', marginBottom: '28px' } }),
            ...[
              'Everything in Pro', 'Unlimited Storage', '24/7 Dedicated Support', 'SLA Guarantee', 'SSO & SAML', 'Custom Integrations',
            ].map(f => el('text', { text: `✓ ${f}` }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '10px' } })),
          ]),
        ]),
      ]),
    ], 'Pricing')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  PREMIUM STATS WITH GRADIENTS
// ════════════════════════════════════════════════════════════════════

const PREMIUM_STATS_V2: SectionBlock[] = [
  {
    id: 'stats-gradient-cards', name: 'Stats — Gradient Cards', category: 'Stats',
    description: 'Stats in individual cards with gradient accent backgrounds',
    elements: [el('section', {}, { desktop: { padding: '100px 80px', backgroundColor: '#050505' }, mobile: { padding: '60px 20px' } }, [
      el('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto' } }, [
        el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }, mobile: { gridTemplateColumns: '1fr 1fr', gap: '12px' } }, [
          ...[
            { num: '10M+', label: 'Users worldwide', gradient: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(99,102,241,0.02))', accent: '#818cf8' },
            { num: '99.99%', label: 'Uptime SLA', gradient: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))', accent: '#34d399' },
            { num: '200+', label: 'Edge locations', gradient: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.02))', accent: '#60a5fa' },
            { num: '<50ms', label: 'Avg latency', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(245,158,11,0.02))', accent: '#fbbf24' },
          ].map(stat =>
            el('card', {}, { desktop: { padding: '32px', borderRadius: '16px', textAlign: 'center', background: stat.gradient, border: '1px solid rgba(255,255,255,0.04)' } }, [
              el('heading', { text: stat.num, level: 'h3' }, { desktop: { fontSize: '44px', fontWeight: '700', color: stat.accent, letterSpacing: '-0.03em', marginBottom: '6px' }, mobile: { fontSize: '32px' } }),
              el('text', { text: stat.label }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }),
            ])
          ),
        ]),
      ]),
    ], 'Stats')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  PREMIUM FOOTER V2
// ════════════════════════════════════════════════════════════════════

const PREMIUM_FOOTER_V2: SectionBlock[] = [
  {
    id: 'footer-gradient-modern', name: 'Footer — Modern Gradient', category: 'Footers',
    description: 'Modern footer with gradient background and comprehensive links',
    elements: [el('footer', {}, { desktop: { padding: '80px 80px 40px', background: 'linear-gradient(180deg, #0a0a1a 0%, #050505 100%)', borderTop: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '60px 24px 32px' } }, [
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        // Top: CTA + Newsletter
        el('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '64px', padding: '40px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))', border: '1px solid rgba(99,102,241,0.08)' }, mobile: { flexDirection: 'column', gap: '24px', padding: '28px 20px' } }, [
          el('container', {}, { desktop: {} }, [
            el('heading', { text: 'Stay up to date', level: 'h3' }, { desktop: { fontSize: '22px', fontWeight: '600', color: '#fff', marginBottom: '4px' } }),
            el('text', { text: 'Get product updates and insights delivered weekly.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)' } }),
          ]),
          el('container', {}, { desktop: { display: 'flex', gap: '8px' }, mobile: { width: '100%', flexDirection: 'column' } }, [
            el('input', { placeholder: 'Enter your email' }, { desktop: { padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '14px', width: '260px' }, mobile: { width: '100%' } }),
            el('button', { text: 'Subscribe' }, { desktop: { padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: 'none', whiteSpace: 'nowrap' } }),
          ]),
        ]),
        // Links grid
        el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '48px', marginBottom: '64px' }, mobile: { gridTemplateColumns: '1fr 1fr', gap: '32px' } }, [
          el('container', {}, { desktop: {} }, [
            el('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', marginBottom: '16px' } }),
            el('text', { text: 'Building the infrastructure for the modern web. Trusted by 50,000+ teams worldwide.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.7', maxWidth: '260px' } }),
          ]),
          ...['Product', 'Company', 'Resources', 'Legal'].map(col =>
            el('container', {}, { desktop: {} }, [
              el('text', { text: col }, { desktop: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '18px', letterSpacing: '0.05em' } }),
              ...(col === 'Product' ? ['Features', 'Pricing', 'Changelog', 'API', 'Integrations'] :
                  col === 'Company' ? ['About', 'Blog', 'Careers', 'Press', 'Partners'] :
                  col === 'Resources' ? ['Docs', 'Guides', 'Support', 'Status', 'Community'] :
                  ['Privacy', 'Terms', 'Security', 'GDPR', 'DPA']
              ).map(link =>
                el('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: '10px' } })
              ),
            ])
          ),
        ]),
        // Bottom
        el('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)' }, mobile: { flexDirection: 'column', gap: '12px' } }, [
          el('text', { text: '© 2025 Brand. All rights reserved.' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.2)' } }),
          el('container', {}, { desktop: { display: 'flex', gap: '20px' } }, [
            ...['Twitter', 'GitHub', 'Discord', 'LinkedIn'].map(s =>
              el('text', { text: s }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' } })
            ),
          ]),
        ]),
      ]),
    ], 'Footer')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  ANIMATED CONTENT SECTIONS
// ════════════════════════════════════════════════════════════════════

const ANIMATED_CONTENT_V2: SectionBlock[] = [
  {
    id: 'content-gradient-marquee', name: 'Marquee — Gradient Text Band', category: 'Animated',
    description: 'Oversized scrolling text with gradient color effect',
    elements: [el('section', {}, { desktop: { padding: '60px 0', backgroundColor: '#050505', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' } }, [
      el('marquee', { speed: 40, direction: 'left' }, { desktop: { fontSize: '80px', fontWeight: '800', letterSpacing: '-0.02em', whiteSpace: 'nowrap', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.15), rgba(59,130,246,0.15))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }, mobile: { fontSize: '48px' } }, [
        el('text', { text: 'DESIGN ◆ DEVELOP ◆ DEPLOY ◆ SCALE ◆ INNOVATE ◆ CREATE ◆ DESIGN ◆ DEVELOP ◆ DEPLOY ◆ SCALE ◆ INNOVATE ◆ CREATE ◆' }, { desktop: { background: 'inherit', WebkitBackgroundClip: 'inherit', WebkitTextFillColor: 'inherit' } }),
      ]),
    ], 'Gradient Marquee')],
  },
  {
    id: 'content-logo-cloud-animated', name: 'Logo Cloud — Animated Strip', category: 'Logos',
    description: 'Continuously scrolling logo strip with fade edges',
    elements: [el('section', {}, { desktop: { padding: '60px 0', backgroundColor: '#050505', position: 'relative', overflow: 'hidden' } }, [
      el('container', {}, { desktop: { textAlign: 'center', marginBottom: '32px' } }, [
        el('text', { text: 'TRUSTED BY INDUSTRY LEADERS' }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em' } }),
      ]),
      el('marquee', { speed: 30, direction: 'left', pauseOnHover: true }, { desktop: { display: 'flex', gap: '64px', alignItems: 'center', opacity: '0.3' } }, [
        ...['GOOGLE', 'MICROSOFT', 'STRIPE', 'VERCEL', 'NOTION', 'LINEAR', 'FIGMA', 'SLACK', 'SHOPIFY', 'TWILIO'].map(name =>
          el('text', { text: name }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.12em', whiteSpace: 'nowrap' } })
        ),
      ]),
    ], 'Logo Cloud')],
  },
  {
    id: 'content-bento-showcase', name: 'Bento — Product Showcase', category: 'Features',
    description: 'Asymmetric bento grid highlighting product capabilities',
    elements: [el('section', {}, { desktop: { padding: '140px 80px', background: 'linear-gradient(180deg, #050505, #0a0a1a)' }, mobile: { padding: '60px 20px' } }, [
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        el('container', {}, { desktop: { textAlign: 'center', marginBottom: '64px' } }, [
          el('heading', { text: 'Built for scale', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff', letterSpacing: '-0.035em', marginBottom: '16px' }, mobile: { fontSize: '32px' } }),
          el('text', { text: 'From prototype to millions of users, our platform grows with you.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', maxWidth: '500px', margin: '0 auto' } }),
        ]),
        el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'auto auto', gap: '16px' }, mobile: { gridTemplateColumns: '1fr', gap: '12px' } }, [
          // Large card
          el('card', {}, { desktop: { padding: '40px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(99,102,241,0.02))', border: '1px solid rgba(99,102,241,0.08)', gridColumn: 'span 2', gridRow: 'span 2' }, mobile: { gridColumn: 'span 1', gridRow: 'span 1' } }, [
            el('text', { text: '⚡' }, { desktop: { fontSize: '36px', marginBottom: '24px' } }),
            el('heading', { text: 'Instant Global\nDeployments', level: 'h3' }, { desktop: { fontSize: '32px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', lineHeight: '1.15', marginBottom: '16px', whiteSpace: 'pre-line' }, mobile: { fontSize: '24px' } }),
            el('text', { text: 'Deploy to 200+ edge locations in under 10 seconds. Every commit triggers an instant preview with full SSL and CDN.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', maxWidth: '440px' } }),
            el('container', {}, { desktop: { marginTop: '32px', aspectRatio: '16/9', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
              el('text', { text: '[ Dashboard Preview ]' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.08)' } }),
            ]),
          ]),
          // Small cards
          el('card', {}, { desktop: { padding: '32px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' } }, [
            el('text', { text: '🔒' }, { desktop: { fontSize: '24px', marginBottom: '16px' } }),
            el('heading', { text: 'Enterprise Security', level: 'h4' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
            el('text', { text: 'SOC 2 Type II. E2E encryption. SSO & SAML.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6' } }),
          ]),
          el('card', {}, { desktop: { padding: '32px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' } }, [
            el('text', { text: '📊' }, { desktop: { fontSize: '24px', marginBottom: '16px' } }),
            el('heading', { text: 'Live Analytics', level: 'h4' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
            el('text', { text: 'Real-time dashboards with custom alerting.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6' } }),
          ]),
        ]),
      ]),
    ], 'Bento Showcase')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  PREMIUM FAQ V2
// ════════════════════════════════════════════════════════════════════

const PREMIUM_FAQ_V2: SectionBlock[] = [
  {
    id: 'faq-split-gradient', name: 'FAQ — Split with Gradient', category: 'FAQ',
    description: 'FAQ section with heading on left and questions on right',
    elements: [el('section', {}, { desktop: { padding: '140px 80px', backgroundColor: '#050505' }, mobile: { padding: '60px 20px' } }, [
      el('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '80px' }, mobile: { gridTemplateColumns: '1fr', gap: '40px' } }, [
        el('container', {}, { desktop: { position: 'sticky', top: '120px', alignSelf: 'start' } }, [
          el('badge', { text: 'FAQ' }, { desktop: { display: 'inline-flex', padding: '6px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)', marginBottom: '20px', letterSpacing: '0.08em' } }),
          el('heading', { text: 'Frequently asked\nquestions', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.15', marginBottom: '16px', whiteSpace: 'pre-line' }, mobile: { fontSize: '30px' } }),
          el('text', { text: 'Everything you need to know about our platform. Can\'t find what you\'re looking for? Contact our team.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '24px' } }),
          el('button', { text: 'Contact Support →' }, { desktop: { padding: '12px 24px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', borderRadius: '8px', fontSize: '13px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.1)' } }),
        ]),
        el('container', {}, { desktop: {} }, [
          ...[
            { q: 'How does pricing work?', a: 'We offer a generous free tier for small projects. As your needs grow, upgrade to Pro ($29/mo) or Enterprise for custom pricing. All plans include core features.' },
            { q: 'Can I export my data?', a: 'Absolutely. You own your data. Export everything at any time in standard formats. We never lock you in.' },
            { q: 'What about security?', a: 'We\'re SOC 2 Type II compliant with end-to-end encryption, SSO/SAML support, and automatic backups. Enterprise plans include custom security reviews.' },
            { q: 'How long does setup take?', a: 'Most teams are up and running in under 5 minutes. Our onboarding wizard and templates make it effortless.' },
            { q: 'Do you offer migrations?', a: 'Yes. We provide free migration assistance for Pro and Enterprise plans. Our team will handle the heavy lifting.' },
            { q: 'What integrations do you support?', a: 'We integrate with 500+ tools including Slack, GitHub, Jira, Notion, and more. Our API supports custom integrations too.' },
          ].map((faq, i) =>
            el('container', {}, { desktop: { padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } }, [
              el('heading', { text: faq.q, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '10px' } }),
              el('text', { text: faq.a }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
            ])
          ),
        ]),
      ]),
    ], 'FAQ')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  EXPORT ALL V2 PREMIUM SECTIONS
// ════════════════════════════════════════════════════════════════════

export const PREMIUM_SECTION_BLOCKS_V2: SectionBlock[] = [
  ...GRADIENT_MESH_HEROES,
  ...ANIMATED_FEATURES,
  ...PREMIUM_TESTIMONIALS_V2,
  ...ANIMATED_CTA_V2,
  ...PREMIUM_PRICING_V2,
  ...PREMIUM_STATS_V2,
  ...PREMIUM_FOOTER_V2,
  ...ANIMATED_CONTENT_V2,
  ...PREMIUM_FAQ_V2,
];
