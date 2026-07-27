import { EditorElement } from '../types';

// ═══════════════════════════════════════════════════════════════
// V9 — Ultra-Premium Sections: 55+ new sections
// Features: Glass morphism, advanced gradients, micro-interactions
// ═══════════════════════════════════════════════════════════════

let _c = 0;
function sid(): string { _c++; return `v9-${_c}-${Math.random().toString(36).slice(2,7)}`; }

function s(type: EditorElement['type'], props: Record<string,unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: sid(), type, name: name ?? type, props, styles, children };
}

function anim(el: EditorElement, animation: Record<string,unknown>): EditorElement {
  return { ...el, props: { ...el.props, animation } };
}

const FU = () => ({ type: 'fadeUp' as const, duration: 0.6, delay: 0, easing: 'cubic-bezier(0.16,1,0.3,1)' });
const FD = () => ({ type: 'fadeDown' as const, duration: 0.5, delay: 0.1, easing: 'cubic-bezier(0.16,1,0.3,1)' });
const SL = () => ({ type: 'slideLeft' as const, duration: 0.7, delay: 0.2, easing: 'cubic-bezier(0.16,1,0.3,1)' });

type SectionCategory =
  | 'Navbars' | 'Heroes' | 'Features' | 'Content' | 'CTA'
  | 'Testimonials' | 'Pricing' | 'FAQ' | 'Team' | 'Stats'
  | 'Gallery' | 'Logos' | 'Contact' | 'Footers' | 'Blog'
  | 'Ecommerce' | 'Forms' | 'Banners'
  | 'Portfolio' | 'About' | 'Comparison' | 'Error' | 'Animated'
  | 'Interactive' | 'Product Pages';

interface SectionBlock { id: string; name: string; category: SectionCategory; description: string; thumbnail?: string; elements: EditorElement[]; }

export const PREMIUM_SECTION_BLOCKS_V9: SectionBlock[] = [
  // ══════════════════════════ HEROES ══════════════════════════
  {
    id: 'v9-hero-aurora', name: '🌌 Aurora Gradient Hero', category: 'Heroes',
    description: 'Mesmerizing aurora borealis gradient with floating particles effect',
    elements: [anim(s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1117 25%, #161b22 50%, #0a192f 75%, #0d1117 100%)', overflow: 'hidden' } }, [
      s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120,119,198,0.15), transparent), radial-gradient(ellipse 60% 40% at 70% 110%, rgba(33,150,243,0.1), transparent), radial-gradient(ellipse 50% 30% at 20% 60%, rgba(139,92,246,0.08), transparent)', pointerEvents: 'none' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '1', textAlign: 'center', maxWidth: '900px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        s('badge', { text: 'INTRODUCING V2.0' }, { desktop: { padding: '8px 20px', background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(33,150,243,0.15))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '100px', fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', display: 'inline-block', marginBottom: '32px', letterSpacing: '0.12em', backdropFilter: 'blur(12px)' } }),
        s('heading', { text: 'Build the Future\nof Digital Experience', level: 'h1' }, { desktop: { fontSize: '76px', fontWeight: '700', color: '#ffffff', lineHeight: '1.04', letterSpacing: '-0.04em', marginBottom: '28px', background: 'linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }, mobile: { fontSize: '42px' } }),
        s('text', { text: 'Create stunning digital products with our next-generation platform. Powered by AI, designed for humans, built for scale.' }, { desktop: { fontSize: '19px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.8', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '16px', justifyContent: 'center' } }, [
          s('button', { text: 'Start Building — Free', href: '#' }, { desktop: { padding: '18px 40px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: 'none', boxShadow: '0 8px 32px rgba(139,92,246,0.3)' } }),
          s('button', { text: 'Watch Demo', href: '#' }, { desktop: { padding: '18px 40px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)' } }),
        ]),
      ]),
    ], 'Aurora Hero'), FU())],
  },
  {
    id: 'v9-hero-mesh', name: '🔮 Mesh Gradient Hero', category: 'Heroes',
    description: 'Vivid mesh gradient with glassmorphic card overlay',
    elements: [anim(s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', background: '#000000', overflow: 'hidden' } }, [
      s('container', {}, { desktop: { position: 'absolute', top: '-50%', left: '-25%', width: '150%', height: '200%', background: 'conic-gradient(from 180deg at 50% 50%, #1a1a2e 0deg, #16213e 72deg, #0f3460 144deg, #533483 216deg, #1a1a2e 288deg, #16213e 360deg)', opacity: '0.4', filter: 'blur(100px)' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '1', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', maxWidth: '1200px', margin: '0 auto', padding: '0 60px', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', padding: '60px 24px', gap: '40px' } }, [
        s('container', {}, { desktop: {} }, [
          s('text', { text: 'FOR DEVELOPERS & DESIGNERS' }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#8b5cf6', letterSpacing: '0.15em', marginBottom: '20px' } }),
          s('heading', { text: 'Ship Products\n10x Faster', level: 'h1' }, { desktop: { fontSize: '64px', fontWeight: '800', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.03em', marginBottom: '24px' }, mobile: { fontSize: '40px' } }),
          s('text', { text: 'The all-in-one platform for modern teams. Design, develop, and deploy in record time.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '40px' } }),
          s('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
            s('button', { text: 'Get Started', href: '#' }, { desktop: { padding: '16px 36px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: 'none' } }),
            s('button', { text: 'View Pricing', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)' } }),
          ]),
        ]),
        s('container', {}, { desktop: { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '40px', boxShadow: '0 24px 80px rgba(0,0,0,0.4)' } }, [
          s('container', {}, { desktop: { display: 'flex', gap: '12px', marginBottom: '20px' } }, [
            s('container', {}, { desktop: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' } }),
            s('container', {}, { desktop: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' } }),
            s('container', {}, { desktop: { width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28c840' } }),
          ]),
          s('text', { text: '// Your next project starts here\nimport { create } from \'@platform/core\'\n\nconst app = create({\n  name: \'My App\',\n  theme: \'dark\',\n  deploy: \'auto\'\n})\n\napp.launch() // 🚀' }, { desktop: { fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8', whiteSpace: 'pre-wrap' } }),
        ]),
      ]),
    ], 'Mesh Hero'), FU())],
  },
  {
    id: 'v9-hero-minimal-bold', name: '⚡ Minimal Bold Hero', category: 'Heroes',
    description: 'Ultra-clean hero with massive typography and subtle gradient',
    elements: [anim(s('section', {}, { desktop: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: '80px 60px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { textAlign: 'center', maxWidth: '1000px' } }, [
        s('heading', { text: 'We design\nexperiences that\nmatter.', level: 'h1' }, { desktop: { fontSize: '88px', fontWeight: '700', color: '#fff', lineHeight: '1.02', letterSpacing: '-0.04em', marginBottom: '40px' }, mobile: { fontSize: '44px' } }),
        s('text', { text: 'Strategy · Design · Technology' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '48px' } }),
        s('container', {}, { desktop: { width: '1px', height: '80px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 auto' } }),
      ]),
    ], 'Minimal Bold Hero'), FU())],
  },
  {
    id: 'v9-hero-video-bg', name: '🎬 Video Background Hero', category: 'Heroes',
    description: 'Cinematic hero with video placeholder and overlay controls',
    elements: [anim(s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'flex-end', backgroundImage: 'url(https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&h=1080&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' } }, [
      s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '1', width: '100%', padding: '80px 80px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }, mobile: { padding: '40px 24px', flexDirection: 'column', gap: '32px' } }, [
        s('container', {}, { desktop: { maxWidth: '600px' } }, [
          s('heading', { text: 'Stories That\nMove People', level: 'h1' }, { desktop: { fontSize: '68px', fontWeight: '700', color: '#fff', lineHeight: '1.04', letterSpacing: '-0.03em', marginBottom: '20px' }, mobile: { fontSize: '40px' } }),
          s('text', { text: 'Award-winning creative studio specializing in brand storytelling and digital experiences.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.7' } }),
        ]),
        s('button', { text: '▶  PLAY REEL', href: '#' }, { desktop: { padding: '20px 40px', backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '100px', fontSize: '13px', fontWeight: '700', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)', letterSpacing: '0.1em' } }),
      ]),
    ], 'Video Hero'), FU())],
  },

  // ══════════════════════════ FEATURES ══════════════════════════
  {
    id: 'v9-features-icon-grid', name: '🏗️ Icon Feature Grid', category: 'Features',
    description: '6-column icon grid with glassmorphic cards and hover states',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { textAlign: 'center', maxWidth: '700px', margin: '0 auto 64px' } }, [
        s('badge', { text: 'FEATURES' }, { desktop: { padding: '6px 16px', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', borderRadius: '100px', fontSize: '11px', fontWeight: '700', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.1em', border: '1px solid rgba(59,130,246,0.2)' } }),
        s('heading', { text: 'Everything You Need\nto Ship Faster', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '20px' }, mobile: { fontSize: '32px' } }),
        s('text', { text: 'Built-in tools that eliminate complexity and let you focus on what matters.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' } }),
      ]),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...['⚡ Lightning Fast', '🔒 Enterprise Security', '📊 Real-time Analytics', '🎨 Visual Editor', '🔄 Auto Scaling', '🌍 Global CDN'].map((title, i) => {
          const [icon, ...rest] = title.split(' ');
          const name = rest.join(' ');
          const descs = ['Sub-millisecond response times with edge-optimized infrastructure.', 'SOC2 compliant with end-to-end encryption and role-based access.', 'Track performance metrics with interactive dashboards.', 'Build and customize without writing a single line of code.', 'Automatically scale resources based on traffic patterns.', 'Deliver content from 200+ edge locations worldwide.'];
          return s('container', {}, { desktop: { padding: '36px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', transition: 'all 0.3s ease' } }, [
            s('text', { text: icon }, { desktop: { fontSize: '32px', marginBottom: '16px' } }),
            s('heading', { text: name, level: 'h3' }, { desktop: { fontSize: '17px', fontWeight: '600', color: '#fff', marginBottom: '10px' } }),
            s('text', { text: descs[i] }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
          ]);
        }),
      ]),
    ], 'Feature Grid'), FU())],
  },
  {
    id: 'v9-features-bento', name: '📦 Bento Feature Box', category: 'Features',
    description: 'Asymmetric bento grid with mixed content blocks and gradients',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#0a0a0a' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        s('container', {}, { desktop: { marginBottom: '64px' } }, [
          s('heading', { text: 'Powerful Features\nDesigned for Scale', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em' }, mobile: { fontSize: '34px' } }),
        ]),
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }, mobile: { gridTemplateColumns: '1fr' } }, [
          s('container', {}, { desktop: { background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '20px', padding: '48px', minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } }, [
            s('text', { text: '⚡' }, { desktop: { fontSize: '40px', marginBottom: '20px' } }),
            s('heading', { text: 'AI-Powered Workflows', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
            s('text', { text: 'Automate repetitive tasks with intelligent workflows that learn from your patterns and optimize over time.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' } }),
          ]),
          s('container', {}, { desktop: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } }, [
            s('text', { text: '🔐' }, { desktop: { fontSize: '40px', marginBottom: '20px' } }),
            s('heading', { text: 'Zero-Trust Security', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
            s('text', { text: 'Every request is verified. Every connection is encrypted.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' } }),
          ]),
        ]),
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px' }, mobile: { gridTemplateColumns: '1fr' } }, [
          ...['📊 Analytics Dashboard|Track every metric in real-time with beautiful visualizations.', '🌐 Edge Network|200+ global edge locations for sub-50ms latency worldwide.', '🔄 Live Collaboration|Real-time co-editing with presence indicators and comments.'].map(item => {
            const [title, desc] = item.split('|');
            return s('container', {}, { desktop: { background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '36px' } }, [
              s('heading', { text: title, level: 'h3' }, { desktop: { fontSize: '17px', fontWeight: '600', color: '#fff', marginBottom: '10px' } }),
              s('text', { text: desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
            ]);
          }),
        ]),
      ]),
    ], 'Bento Features'), FU())],
  },
  {
    id: 'v9-features-alternating', name: '↔️ Alternating Features', category: 'Features',
    description: 'Left-right alternating feature blocks with images',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '80px' } }, [
        ...[
          { title: 'Instant Deployment', desc: 'Push to production in seconds with zero-downtime deployments and automatic rollbacks.', img: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop' },
          { title: 'Visual Collaboration', desc: 'Design together in real-time with multiplayer editing, comments, and version history.', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop' },
          { title: 'Analytics & Insights', desc: 'Understand your users with powerful analytics, heatmaps, and session recordings.', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop' },
        ].map((f, i) =>
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr' } }, [
            ...(i % 2 === 0 ? [
              s('container', {}, { desktop: {} }, [
                s('heading', { text: f.title, level: 'h3' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', lineHeight: '1.15', letterSpacing: '-0.02em', marginBottom: '16px' }, mobile: { fontSize: '28px' } }),
                s('text', { text: f.desc }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' } }),
              ]),
              s('image', { src: f.img, alt: f.title }, { desktop: { width: '100%', borderRadius: '16px', aspectRatio: '3/2', objectFit: 'cover' } }),
            ] : [
              s('image', { src: f.img, alt: f.title }, { desktop: { width: '100%', borderRadius: '16px', aspectRatio: '3/2', objectFit: 'cover' } }),
              s('container', {}, { desktop: {} }, [
                s('heading', { text: f.title, level: 'h3' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', lineHeight: '1.15', letterSpacing: '-0.02em', marginBottom: '16px' }, mobile: { fontSize: '28px' } }),
                s('text', { text: f.desc }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' } }),
              ]),
            ]),
          ])
        ),
      ]),
    ], 'Alternating Features'), FU())],
  },

  // ══════════════════════════ PRICING ══════════════════════════
  {
    id: 'v9-pricing-gradient', name: '💎 Gradient Pricing Cards', category: 'Pricing',
    description: 'Three-tier pricing with gradient borders and popular badge',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { textAlign: 'center', maxWidth: '700px', margin: '0 auto 64px' } }, [
        s('heading', { text: 'Simple, Transparent\nPricing', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '32px' } }),
        s('text', { text: 'No hidden fees. No surprises. Start free and scale as you grow.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' } }),
      ]),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...[
          { name: 'Starter', price: '$0', period: '/month', desc: 'Perfect for side projects', features: ['1 project', '1GB storage', 'Community support', 'Basic analytics'], cta: 'Start Free', featured: false },
          { name: 'Pro', price: '$29', period: '/month', desc: 'For growing teams', features: ['Unlimited projects', '50GB storage', 'Priority support', 'Advanced analytics', 'Custom domains', 'Team collaboration'], cta: 'Get Started', featured: true },
          { name: 'Enterprise', price: 'Custom', period: '', desc: 'For large organizations', features: ['Everything in Pro', 'Unlimited storage', 'Dedicated support', 'SSO & SAML', 'SLA guarantee', 'Custom integrations'], cta: 'Contact Sales', featured: false },
        ].map(plan =>
          s('container', {}, { desktop: { padding: '40px', background: plan.featured ? 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.05))' : 'rgba(255,255,255,0.02)', border: plan.featured ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', display: 'flex', flexDirection: 'column', position: 'relative' } }, [
            ...(plan.featured ? [s('badge', { text: 'MOST POPULAR' }, { desktop: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', borderRadius: '100px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.08em' } })] : []),
            s('heading', { text: plan.name, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '12px' } }),
            s('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' } }, [
              s('heading', { text: plan.price, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
              s('text', { text: plan.period }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.35)' } }),
            ]),
            s('text', { text: plan.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' } }),
            s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px', flex: '1' } }, plan.features.map(f =>
              s('text', { text: `✓  ${f}` }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.55)' } })
            )),
            s('button', { text: plan.cta, href: '#' }, { desktop: { padding: '14px 28px', background: plan.featured ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: plan.featured ? 'none' : '1px solid rgba(255,255,255,0.1)', textAlign: 'center', width: '100%' } }),
          ])
        ),
      ]),
    ], 'Pricing Cards'), FU())],
  },

  // ══════════════════════════ TESTIMONIALS ══════════════════════════
  {
    id: 'v9-testimonial-cards', name: '💬 Testimonial Cards', category: 'Testimonials',
    description: 'Three testimonial cards with avatars and star ratings',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#0a0a0a' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { textAlign: 'center', maxWidth: '600px', margin: '0 auto 64px' } }, [
        s('heading', { text: 'Loved by Thousands', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '32px' } }),
        s('text', { text: 'See what our customers have to say about their experience.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' } }),
      ]),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...[
          { quote: '"This platform has completely transformed how we build products. The speed is unbelievable."', name: 'Sarah Chen', role: 'CTO, TechCorp', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face' },
          { quote: '"We shipped our entire product in 2 weeks instead of 6 months. Game changer."', name: 'Marcus Johnson', role: 'Founder, StartupXYZ', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
          { quote: '"The best developer experience I\'ve ever had. Nothing else comes close."', name: 'Emily Park', role: 'Lead Dev, DesignCo', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face' },
        ].map(t =>
          s('container', {}, { desktop: { padding: '36px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' } }, [
            s('text', { text: '★★★★★' }, { desktop: { fontSize: '14px', color: '#f59e0b', marginBottom: '16px', letterSpacing: '2px' } }),
            s('text', { text: t.quote }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.7', marginBottom: '24px', fontStyle: 'italic' } }),
            s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
              s('image', { src: t.avatar, alt: t.name }, { desktop: { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' } }),
              s('container', {}, { desktop: {} }, [
                s('text', { text: t.name }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#fff' } }),
                s('text', { text: t.role }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.35)' } }),
              ]),
            ]),
          ])
        ),
      ]),
    ], 'Testimonials'), FU())],
  },
  {
    id: 'v9-testimonial-marquee', name: '🎠 Testimonial Marquee', category: 'Testimonials',
    description: 'Scrolling marquee of testimonial quotes with soft gradient edges',
    elements: [anim(s('section', {}, { desktop: { padding: '100px 0', backgroundColor: '#000', overflow: 'hidden' } }, [
      s('container', {}, { desktop: { textAlign: 'center', maxWidth: '600px', margin: '0 auto 48px', padding: '0 40px' } }, [
        s('heading', { text: 'What People Are Saying', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em' }, mobile: { fontSize: '30px' } }),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '20px', padding: '0 20px' } }, [
        ...['"Incredible speed"', '"Best in class"', '"Simply amazing"', '"Revolutionary tool"', '"10x productivity"', '"Must have"'].map(q =>
          s('container', {}, { desktop: { padding: '24px 32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', whiteSpace: 'nowrap', flexShrink: '0' } }, [
            s('text', { text: q }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic' } }),
          ])
        ),
      ]),
    ], 'Testimonial Marquee'), FU())],
  },

  // ══════════════════════════ CTA ══════════════════════════
  {
    id: 'v9-cta-gradient-box', name: '🚀 Gradient CTA Box', category: 'CTA',
    description: 'Centered CTA with gradient border and glow effect',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto', textAlign: 'center', padding: '80px 60px', background: 'linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.04))', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '24px', position: 'relative', overflow: 'hidden' }, mobile: { padding: '48px 24px' } }, [
        s('container', {}, { desktop: { position: 'absolute', top: '-100px', left: '50%', transform: 'translateX(-50%)', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)', pointerEvents: 'none' } }),
        s('heading', { text: 'Ready to Get\nStarted?', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '20px', position: 'relative' }, mobile: { fontSize: '34px' } }),
        s('text', { text: 'Join thousands of teams shipping products faster than ever before.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '40px', position: 'relative' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center', position: 'relative' } }, [
          s('button', { text: 'Start Free Trial', href: '#' }, { desktop: { padding: '16px 36px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: 'none', boxShadow: '0 8px 32px rgba(139,92,246,0.3)' } }),
          s('button', { text: 'Talk to Sales', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)' } }),
        ]),
      ]),
    ], 'Gradient CTA'), FU())],
  },
  {
    id: 'v9-cta-fullwidth', name: '📢 Full-Width CTA Banner', category: 'CTA',
    description: 'Edge-to-edge CTA with split text and action area',
    elements: [anim(s('section', {}, { desktop: { padding: '80px', background: 'linear-gradient(135deg, #1a1a2e, #16213e)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '48px 24px' } }, [
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }, mobile: { flexDirection: 'column', gap: '32px', textAlign: 'center' } }, [
        s('container', {}, { desktop: { maxWidth: '500px' } }, [
          s('heading', { text: 'Start building today', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', lineHeight: '1.15', letterSpacing: '-0.02em', marginBottom: '12px' }, mobile: { fontSize: '30px' } }),
          s('text', { text: 'No credit card required. Free plan available forever.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' } }),
        ]),
        s('button', { text: 'Get Started — It\'s Free', href: '#' }, { desktop: { padding: '18px 44px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: '#fff', borderRadius: '12px', fontSize: '16px', fontWeight: '600', border: 'none', boxShadow: '0 8px 24px rgba(139,92,246,0.25)' } }),
      ]),
    ], 'Full-Width CTA'), FU())],
  },

  // ══════════════════════════ FAQ ══════════════════════════
  {
    id: 'v9-faq-minimal', name: '❓ Minimal FAQ', category: 'FAQ',
    description: 'Clean FAQ section with divider-separated questions',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto' } }, [
        s('heading', { text: 'Frequently Asked\nQuestions', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '64px' }, mobile: { fontSize: '32px' } }),
        s('container', {}, { desktop: { display: 'flex', flexDirection: 'column' } }, [
          ...['What is included in the free plan?|The free plan includes 1 project, 1GB storage, community support, and basic analytics. No credit card required.', 'Can I upgrade or downgrade anytime?|Yes, you can change your plan at any time. When upgrading, you\'ll be charged the prorated difference. When downgrading, your new rate takes effect at the next billing cycle.', 'Do you offer custom enterprise plans?|Absolutely. We work with enterprise teams to create custom plans that include dedicated support, SLA guarantees, SSO integration, and custom feature development.', 'How does billing work?|We offer monthly and annual billing. Annual plans save you 20%. All plans are billed in USD and include all taxes where applicable.', 'What happens to my data if I cancel?|Your data remains accessible for 30 days after cancellation. You can export all your data at any time. After 30 days, data is permanently deleted.'].map((item, i) => {
            const [q, a] = item.split('|');
            return s('container', {}, { desktop: { padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } }, [
              s('heading', { text: q, level: 'h3' }, { desktop: { fontSize: '17px', fontWeight: '600', color: '#fff', marginBottom: '10px' } }),
              s('text', { text: a }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' } }),
            ]);
          }),
        ]),
      ]),
    ], 'FAQ'), FU())],
  },

  // ══════════════════════════ STATS ══════════════════════════
  {
    id: 'v9-stats-large', name: '📈 Large Stats Row', category: 'Stats',
    description: 'Bold statistics with large numbers and subtle descriptions',
    elements: [anim(s('section', {}, { desktop: { padding: '100px 80px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' } }, [
        ...[{ num: '10M+', label: 'Requests/day' }, { num: '99.99%', label: 'Uptime SLA' }, { num: '200+', label: 'Edge locations' }, { num: '<50ms', label: 'Avg latency' }].map(s_ =>
          s('container', {}, { desktop: {} }, [
            s('heading', { text: s_.num, level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px', background: 'linear-gradient(180deg, #fff, rgba(255,255,255,0.6))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }, mobile: { fontSize: '36px' } }),
            s('text', { text: s_.label }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' } }),
          ])
        ),
      ]),
    ], 'Stats Row'), FU())],
  },

  // ══════════════════════════ LOGOS ══════════════════════════
  {
    id: 'v9-logos-strip', name: '🏢 Logo Trust Strip', category: 'Logos',
    description: 'Minimal logo trust bar with faded company names',
    elements: [anim(s('section', {}, { desktop: { padding: '60px 80px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '40px 24px' } }, [
      s('container', {}, { desktop: { textAlign: 'center', marginBottom: '32px' } }, [
        s('text', { text: 'TRUSTED BY INDUSTRY LEADERS' }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em' } }),
      ]),
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '60px', flexWrap: 'wrap', opacity: '0.3' }, mobile: { gap: '32px' } }, [
        ...['Stripe', 'Vercel', 'Linear', 'Notion', 'Figma', 'Shopify'].map(name =>
          s('text', { text: name }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '0.05em' } })
        ),
      ]),
    ], 'Logo Strip'), FU())],
  },

  // ══════════════════════════ CONTENT ══════════════════════════
  {
    id: 'v9-content-split-image', name: '📝 Split Content + Image', category: 'Content',
    description: 'Two-column content with image and rich text',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#0a0a0a' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr', gap: '40px' } }, [
        s('container', {}, { desktop: {} }, [
          s('badge', { text: 'OUR STORY' }, { desktop: { padding: '6px 16px', backgroundColor: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '100px', fontSize: '11px', fontWeight: '700', display: 'inline-block', marginBottom: '24px', letterSpacing: '0.1em', border: '1px solid rgba(16,185,129,0.2)' } }),
          s('heading', { text: 'Built by Developers,\nfor Developers', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '20px' }, mobile: { fontSize: '30px' } }),
          s('text', { text: 'We started as a team of frustrated developers tired of slow, complex tooling. So we built the platform we wished existed — fast, intuitive, and powerful.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', marginBottom: '16px' } }),
          s('text', { text: 'Today, over 10,000 teams trust us to ship their most important products.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8' } }),
        ]),
        s('image', { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=500&fit=crop', alt: 'Team' }, { desktop: { width: '100%', borderRadius: '20px', aspectRatio: '6/5', objectFit: 'cover' } }),
      ]),
    ], 'Split Content'), FU())],
  },

  // ══════════════════════════ CONTACT ══════════════════════════
  {
    id: 'v9-contact-split', name: '📬 Split Contact Form', category: 'Contact',
    description: 'Contact section with info on left and form on right',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr', gap: '48px' } }, [
        s('container', {}, { desktop: {} }, [
          s('heading', { text: 'Get in Touch', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '20px' }, mobile: { fontSize: '32px' } }),
          s('text', { text: 'We\'d love to hear from you. Send us a message and we\'ll respond as soon as possible.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '40px' } }),
          s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
            ...['📧  hello@company.com', '📱  +1 (555) 000-0000', '📍  San Francisco, CA'].map(info =>
              s('text', { text: info }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.55)' } })
            ),
          ]),
        ]),
        s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' } }, [
            s('input', { placeholder: 'First name' }, { desktop: { padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '14px' } }),
            s('input', { placeholder: 'Last name' }, { desktop: { padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '14px' } }),
          ]),
          s('input', { placeholder: 'Email address' }, { desktop: { padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '14px' } }),
          s('textarea', { placeholder: 'Your message...' }, { desktop: { padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '14px', minHeight: '140px' } }),
          s('button', { text: 'Send Message', href: '#' }, { desktop: { padding: '16px 36px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', borderRadius: '10px', fontSize: '15px', fontWeight: '600', border: 'none', textAlign: 'center' } }),
        ]),
      ]),
    ], 'Contact Form'), FU())],
  },

  // ══════════════════════════ FOOTERS ══════════════════════════
  {
    id: 'v9-footer-modern', name: '🔻 Modern Footer', category: 'Footers',
    description: '4-column footer with logo, links, newsletter, and social',
    elements: [anim(s('footer', {}, { desktop: { padding: '80px 80px 40px', backgroundColor: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '48px 24px 32px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '60px', maxWidth: '1200px', margin: '0 auto 60px' }, mobile: { gridTemplateColumns: '1fr', gap: '32px' } }, [
        s('container', {}, { desktop: {} }, [
          s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', marginBottom: '16px' } }),
          s('text', { text: 'Building the future of digital experiences. Ship faster, scale effortlessly.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', maxWidth: '300px', marginBottom: '20px' } }),
          s('container', {}, { desktop: { display: 'flex', gap: '16px' } }, [
            ...['𝕏', 'in', 'GH'].map(icon =>
              s('text', { text: icon }, { desktop: { width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '700' } })
            ),
          ]),
        ]),
        ...['Product|Features\nPricing\nChangelog\nRoadmap', 'Company|About\nBlog\nCareers\nPress', 'Legal|Privacy\nTerms\nSecurity\nCookies'].map(col => {
          const [title, ...links] = col.split('|');
          return s('container', {}, { desktop: {} }, [
            s('text', { text: title }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' } }),
            ...links[0].split('\n').map(link =>
              s('link', { text: link, href: '#' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', display: 'block', marginBottom: '10px' } })
            ),
          ]);
        }),
      ]),
      s('container', {}, { desktop: { borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }, mobile: { flexDirection: 'column', gap: '12px', textAlign: 'center' } }, [
        s('text', { text: '© 2026 Brand. All rights reserved.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.25)' } }),
        s('text', { text: 'Status: All systems operational ●' }, { desktop: { fontSize: '13px', color: 'rgba(16,185,129,0.6)' } }),
      ]),
    ], 'Footer'), FU())],
  },

  // ══════════════════════════ GALLERY ══════════════════════════
  {
    id: 'v9-gallery-masonry', name: '🖼️ Masonry Gallery', category: 'Gallery',
    description: 'Pinterest-style masonry image grid with hover overlays',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { textAlign: 'center', marginBottom: '48px' } }, [
        s('heading', { text: 'Our Work', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em' }, mobile: { fontSize: '32px' } }),
      ]),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...['photo-1618005182384-a83a8bd57fbe', 'photo-1497366216548-37526070297c', 'photo-1486406146926-c627a92ad1ab', 'photo-1558494949-ef010cbdcc31', 'photo-1522071820081-009f0129c71c', 'photo-1551288049-bebda4e38f71'].map((id, i) =>
          s('container', {}, { desktop: { borderRadius: '12px', overflow: 'hidden', position: 'relative' } }, [
            s('image', { src: `https://images.unsplash.com/${id}?w=600&h=${[400, 500, 350, 450, 380, 420][i]}&fit=crop`, alt: 'Gallery' }, { desktop: { width: '100%', display: 'block', objectFit: 'cover' } }),
          ])
        ),
      ]),
    ], 'Masonry Gallery'), FU())],
  },

  // ══════════════════════════ TEAM ══════════════════════════
  {
    id: 'v9-team-grid', name: '👥 Team Grid', category: 'Team',
    description: 'Clean team grid with photos, names and roles',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#0a0a0a' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { textAlign: 'center', maxWidth: '600px', margin: '0 auto 64px' } }, [
        s('heading', { text: 'Meet the Team', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '32px' } }),
        s('text', { text: 'The talented people behind the product.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)' } }),
      ]),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' } }, [
        ...[
          { name: 'Alex Rivera', role: 'CEO & Co-founder', img: 'photo-1507003211169-0a1dd7228f2d' },
          { name: 'Sarah Chen', role: 'CTO', img: 'photo-1494790108377-be9c29b29330' },
          { name: 'James Wilson', role: 'Head of Design', img: 'photo-1472099645785-5658abf4ff4e' },
          { name: 'Emily Park', role: 'Head of Engineering', img: 'photo-1438761681033-6461ffad8d80' },
        ].map(m =>
          s('container', {}, { desktop: { textAlign: 'center' } }, [
            s('image', { src: `https://images.unsplash.com/${m.img}?w=300&h=300&fit=crop&crop=face`, alt: m.name }, { desktop: { width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '16px', marginBottom: '16px' } }),
            s('heading', { text: m.name, level: 'h3' }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' } }),
            s('text', { text: m.role }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }),
          ])
        ),
      ]),
    ], 'Team Grid'), FU())],
  },

  // ══════════════════════════ BLOG ══════════════════════════
  {
    id: 'v9-blog-cards', name: '📰 Blog Card Grid', category: 'Blog',
    description: 'Three-column blog cards with images, dates and excerpts',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: '1200px', margin: '0 auto 48px' }, mobile: { flexDirection: 'column', gap: '16px' } }, [
        s('heading', { text: 'Latest Articles', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em' }, mobile: { fontSize: '30px' } }),
        s('link', { text: 'View all articles →', href: '#' }, { desktop: { fontSize: '14px', color: '#3b82f6', textDecoration: 'none', fontWeight: '500' } }),
      ]),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...[
          { title: 'The Future of Web Development', date: 'Mar 15, 2026', img: 'photo-1558494949-ef010cbdcc31', excerpt: 'Exploring how AI and new frameworks are reshaping modern web development.' },
          { title: 'Building Scalable Design Systems', date: 'Mar 10, 2026', img: 'photo-1618005182384-a83a8bd57fbe', excerpt: 'A deep dive into creating and maintaining design systems that scale.' },
          { title: 'Performance Optimization Guide', date: 'Mar 5, 2026', img: 'photo-1551288049-bebda4e38f71', excerpt: 'Practical techniques for achieving sub-second page load times.' },
        ].map(post =>
          s('container', {}, { desktop: { borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' } }, [
            s('image', { src: `https://images.unsplash.com/${post.img}?w=600&h=340&fit=crop`, alt: post.title }, { desktop: { width: '100%', aspectRatio: '16/9', objectFit: 'cover' } }),
            s('container', {}, { desktop: { padding: '24px' } }, [
              s('text', { text: post.date }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' } }),
              s('heading', { text: post.title, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', lineHeight: '1.3', marginBottom: '8px' } }),
              s('text', { text: post.excerpt }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
            ]),
          ])
        ),
      ]),
    ], 'Blog Cards'), FU())],
  },

  // ══════════════════════════ NAVBARS ══════════════════════════
  {
    id: 'v9-nav-glass', name: '🧊 Glassmorphic Navbar', category: 'Navbars',
    description: 'Floating glass navbar with blur backdrop and gradient accent',
    elements: [anim(s('navbar', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', margin: '16px 40px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }, mobile: { margin: '8px 16px', padding: '12px 20px' } }, [
      s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '32px', alignItems: 'center' }, mobile: { display: 'none' } }, [
        ...['Home', 'Features', 'Pricing', 'About'].map(l =>
          s('link', { text: l, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: '500' } })
        ),
        s('button', { text: 'Get Started', href: '#' }, { desktop: { padding: '10px 24px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', borderRadius: '10px', fontSize: '13px', fontWeight: '600', border: 'none' } }),
      ]),
    ], 'Glass Navbar'), FU())],
  },
  {
    id: 'v9-nav-underline', name: '━ Underline Navbar', category: 'Navbars',
    description: 'Clean navbar with active underline indicator',
    elements: [anim(s('navbar', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px', height: '72px', backgroundColor: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '0 20px', height: '60px' } }, [
      s('heading', { text: 'Brand.', level: 'h3' }, { desktop: { fontSize: '22px', fontWeight: '700', color: '#fff' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '0', height: '100%', alignItems: 'center' }, mobile: { display: 'none' } }, [
        ...['Home', 'About', 'Work', 'Blog', 'Contact'].map((l, i) =>
          s('link', { text: l, href: '#' }, { desktop: { fontSize: '13px', color: i === 0 ? '#fff' : 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: '500', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', borderBottom: i === 0 ? '2px solid #fff' : '2px solid transparent' } })
        ),
      ]),
      s('button', { text: 'Contact', href: '#' }, { desktop: { padding: '10px 24px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none' } }),
    ], 'Underline Nav'), FU())],
  },

  // ══════════════════════════ PORTFOLIO ══════════════════════════
  {
    id: 'v9-portfolio-showcase', name: '🎨 Portfolio Showcase', category: 'Portfolio',
    description: 'Full-width portfolio case study cards with large images',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        s('container', {}, { desktop: { marginBottom: '64px' } }, [
          s('heading', { text: 'Selected Work', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em' }, mobile: { fontSize: '34px' } }),
        ]),
        s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '32px' } }, [
          ...[
            { title: 'Rebranding TechCorp', tag: 'BRANDING', img: 'photo-1618005182384-a83a8bd57fbe' },
            { title: 'E-Commerce Platform', tag: 'WEB DESIGN', img: 'photo-1486406146926-c627a92ad1ab' },
          ].map(p =>
            s('container', {}, { desktop: { borderRadius: '20px', overflow: 'hidden', position: 'relative' } }, [
              s('image', { src: `https://images.unsplash.com/${p.img}?w=1200&h=600&fit=crop`, alt: p.title }, { desktop: { width: '100%', aspectRatio: '2/1', objectFit: 'cover', display: 'block' } }),
              s('container', {}, { desktop: { position: 'absolute', bottom: '0', left: '0', right: '0', padding: '40px', background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' } }, [
                s('badge', { text: p.tag }, { desktop: { padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: '4px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '8px', letterSpacing: '0.1em' } }),
                s('heading', { text: p.title, level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff' } }),
              ]),
            ])
          ),
        ]),
      ]),
    ], 'Portfolio'), FU())],
  },

  // ══════════════════════════ BANNERS ══════════════════════════
  {
    id: 'v9-banner-announcement', name: '📣 Announcement Banner', category: 'Banners',
    description: 'Top-of-page announcement bar with gradient background',
    elements: [anim(s('container', {}, { desktop: { padding: '12px 40px', background: 'linear-gradient(90deg, #8b5cf6, #3b82f6, #8b5cf6)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }, mobile: { padding: '10px 20px' } }, [
      s('text', { text: '🎉 Introducing v3.0 — the biggest update ever.' }, { desktop: { fontSize: '13px', color: '#fff', fontWeight: '500' } }),
      s('link', { text: 'Learn more →', href: '#' }, { desktop: { fontSize: '13px', color: '#fff', fontWeight: '700', textDecoration: 'underline' } }),
    ], 'Announcement Banner'), FU())],
  },

  // ══════════════════════════ FORMS ══════════════════════════
  {
    id: 'v9-form-newsletter', name: '✉️ Newsletter Signup', category: 'Forms',
    description: 'Compact newsletter signup with inline input and button',
    elements: [anim(s('section', {}, { desktop: { padding: '80px', backgroundColor: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '48px 24px' } }, [
      s('container', {}, { desktop: { textAlign: 'center', maxWidth: '500px', margin: '0 auto' } }, [
        s('heading', { text: 'Stay Updated', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '12px' } }),
        s('text', { text: 'Get the latest news and updates delivered to your inbox.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '28px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '8px' }, mobile: { flexDirection: 'column' } }, [
          s('input', { placeholder: 'Enter your email' }, { desktop: { flex: '1', padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '14px' } }),
          s('button', { text: 'Subscribe', href: '#' }, { desktop: { padding: '14px 28px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: 'none', whiteSpace: 'nowrap' } }),
        ]),
      ]),
    ], 'Newsletter'), FU())],
  },

  // ══════════════════════════ COMPARISON ══════════════════════════
  {
    id: 'v9-comparison-table', name: '⚖️ Feature Comparison', category: 'Comparison',
    description: 'Side-by-side feature comparison table with checkmarks',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { textAlign: 'center', maxWidth: '600px', margin: '0 auto 64px' } }, [
        s('heading', { text: 'Compare Plans', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '32px' } }),
      ]),
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto' } }, [
        // Header row
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' } }, [
          s('text', { text: 'Feature' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em' } }),
          s('text', { text: 'Free' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' } }),
          s('text', { text: 'Pro' }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#8b5cf6', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' } }),
          s('text', { text: 'Enterprise' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em' } }),
        ]),
        // Data rows
        ...['Projects|1|∞|∞', 'Storage|1GB|50GB|∞', 'Team members|1|10|∞', 'Custom domains|—|✓|✓', 'Priority support|—|✓|✓', 'SSO & SAML|—|—|✓', 'SLA guarantee|—|—|✓'].map(row => {
          const [feature, ...values] = row.split('|');
          return s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)' } }, [
            s('text', { text: feature }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' } }),
            ...values.map(v =>
              s('text', { text: v }, { desktop: { fontSize: '14px', color: v === '✓' ? '#10b981' : v === '—' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)', textAlign: 'center', fontWeight: v === '✓' ? '700' : '400' } })
            ),
          ]);
        }),
      ]),
    ], 'Feature Comparison'), FU())],
  },

  // ══════════════════════════ ABOUT ══════════════════════════
  {
    id: 'v9-about-mission', name: '🎯 Mission Statement', category: 'About',
    description: 'Clean mission statement with large quote and supporting text',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#0a0a0a' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', textAlign: 'center' } }, [
        s('text', { text: 'OUR MISSION' }, { desktop: { fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: '32px' } }),
        s('heading', { text: '"We believe great software should be accessible to everyone, not just those with unlimited budgets and large teams."', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '500', color: '#fff', lineHeight: '1.4', letterSpacing: '-0.01em', fontStyle: 'italic', marginBottom: '40px' }, mobile: { fontSize: '24px' } }),
        s('container', {}, { desktop: { width: '60px', height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '0 auto 40px' } }),
        s('text', { text: 'Founded in 2024, we set out to democratize software development. Today, our platform empowers over 10,000 teams across 120 countries to build and ship products that were previously only possible for large engineering organizations.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.8', maxWidth: '700px', margin: '0 auto' } }),
      ]),
    ], 'Mission Statement'), FU())],
  },

  // ══════════════════════════ ANIMATED ══════════════════════════
  {
    id: 'v9-animated-counter', name: '🔢 Animated Counter Section', category: 'Animated',
    description: 'Counter stats with animated number reveal and gradient underlines',
    elements: [anim(s('section', {}, { desktop: { padding: '100px 80px', background: 'linear-gradient(180deg, #000 0%, #0a0a1a 100%)' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' } }, [
        ...[{ num: '2.5M', label: 'Active Users', color: '#8b5cf6' }, { num: '99.9%', label: 'Satisfaction Rate', color: '#3b82f6' }, { num: '150+', label: 'Countries', color: '#10b981' }, { num: '24/7', label: 'Expert Support', color: '#f59e0b' }].map(s_ =>
          s('container', {}, { desktop: { textAlign: 'center' } }, [
            s('heading', { text: s_.num, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px' }, mobile: { fontSize: '32px' } }),
            s('container', {}, { desktop: { width: '40px', height: '3px', background: s_.color, margin: '0 auto 12px', borderRadius: '2px' } }),
            s('text', { text: s_.label }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: '500' } }),
          ])
        ),
      ]),
    ], 'Counter Stats'), FU())],
  },
];
