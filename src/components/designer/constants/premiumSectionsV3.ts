import { EditorElement } from '../types';
import { SectionBlock } from './sectionBlocks';

let _p3 = 0;
function p3id(): string {
  _p3++;
  return `p3-${_p3}-${Math.random().toString(36).slice(2, 7)}`;
}

function el(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: p3id(), type, name: name ?? type, props, styles, children };
}

// ════════════════════════════════════════════════════════════════════
//  V3 HEROES — Animated, Interactive, World-Class
// ════════════════════════════════════════════════════════════════════

const V3_HEROES: SectionBlock[] = [
  {
    id: 'v3-hero-cinematic-split', name: 'Cinematic Split — Video + Text', category: 'Heroes',
    description: 'Diagonal split hero with video background on one side and animated text reveal',
    elements: [el('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', minHeight: '100vh', backgroundColor: '#000', overflow: 'hidden', position: 'relative' }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
      // Left - Content
      el('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '120px 80px 120px 100px', position: 'relative', zIndex: '2' }, mobile: { padding: '80px 24px 40px' } }, [
        el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' } }, [
          el('container', {}, { desktop: { width: '48px', height: '1px', backgroundColor: '#6366f1' } }),
          el('text', { text: 'DIGITAL EXPERIENCE STUDIO' }, { desktop: { fontSize: '11px', fontWeight: '600', color: '#6366f1', letterSpacing: '0.2em' } }),
        ]),
        el('heading', { text: 'We craft digital\nexperiences that\ndefine brands', level: 'h1' }, { desktop: { fontSize: '64px', fontWeight: '700', color: '#fff', lineHeight: '1.04', letterSpacing: '-0.04em', marginBottom: '32px', whiteSpace: 'pre-line' }, mobile: { fontSize: '38px' } }),
        el('text', { text: 'Award-winning studio specializing in brand identity, web design, and immersive digital experiences for forward-thinking companies.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8', maxWidth: '440px', marginBottom: '48px' } }),
        el('container', {}, { desktop: { display: 'flex', gap: '16px', alignItems: 'center' } }, [
          el('button', { text: 'View Our Work' }, { desktop: { padding: '18px 40px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '12px', fontSize: '14px', fontWeight: '600', border: 'none', boxShadow: '0 8px 32px rgba(99,102,241,0.3)' } }),
          el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' } }, [
            el('container', {}, { desktop: { width: '48px', height: '48px', borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
              el('text', { text: '▶' }, { desktop: { fontSize: '12px', color: '#fff', marginLeft: '2px' } }),
            ]),
            el('text', { text: 'Watch Reel' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' } }),
          ]),
        ]),
        // Stats row
        el('container', {}, { desktop: { display: 'flex', gap: '48px', marginTop: '80px', paddingTop: '40px', borderTop: '1px solid rgba(255,255,255,0.06)' }, mobile: { gap: '24px', marginTop: '40px' } }, [
          el('container', {}, { desktop: {} }, [
            el('heading', { text: '200+', level: 'h3' }, { desktop: { fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
            el('text', { text: 'Projects Delivered' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' } }),
          ]),
          el('container', {}, { desktop: {} }, [
            el('heading', { text: '98%', level: 'h3' }, { desktop: { fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
            el('text', { text: 'Client Satisfaction' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' } }),
          ]),
          el('container', {}, { desktop: {} }, [
            el('heading', { text: '15+', level: 'h3' }, { desktop: { fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
            el('text', { text: 'Industry Awards' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' } }),
          ]),
        ]),
      ]),
      // Right - Image with overlay
      el('container', {}, { desktop: { position: 'relative', overflow: 'hidden' }, mobile: { height: '400px' } }, [
        el('image', { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=1400&fit=crop', alt: 'Creative Studio' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
        el('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'linear-gradient(90deg, #000 0%, transparent 40%)' } }),
      ]),
    ], 'Cinematic Split Hero')],
  },
  {
    id: 'v3-hero-3d-parallax', name: '3D Parallax — Layered Depth', category: 'Heroes',
    description: 'Multi-layered hero with depth effect and floating UI cards',
    elements: [el('section', {}, { desktop: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(165deg, #020617 0%, #0f172a 40%, #1e1b4b 100%)', position: 'relative', overflow: 'hidden', padding: '80px 24px', textAlign: 'center' }, mobile: { minHeight: '90vh', padding: '60px 20px' } }, [
      // Grid pattern overlay
      el('container', {}, { desktop: { position: 'absolute', inset: '0', backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)', backgroundSize: '40px 40px', pointerEvents: 'none' } }),
      // Gradient orbs
      el('container', {}, { desktop: { position: 'absolute', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)', top: '-20%', right: '-15%', filter: 'blur(80px)', pointerEvents: 'none' } }),
      el('container', {}, { desktop: { position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 60%)', bottom: '-10%', left: '-10%', filter: 'blur(60px)', pointerEvents: 'none' } }),
      // Content
      el('container', {}, { desktop: { position: 'relative', zIndex: '1', maxWidth: '900px' } }, [
        el('container', {}, { desktop: { display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', borderRadius: '100px', backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', marginBottom: '40px' } }, [
          el('container', {}, { desktop: { width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#4ade80' } }),
          el('text', { text: 'Now in Public Beta — Join 10,000+ early adopters' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: '500' } }),
        ]),
        el('heading', { text: 'The platform that\nscales with your\nambition', level: 'h1' }, { desktop: { fontSize: '76px', fontWeight: '700', color: '#fff', lineHeight: '1.02', letterSpacing: '-0.045em', marginBottom: '28px', whiteSpace: 'pre-line' }, mobile: { fontSize: '40px' } }),
        el('text', { text: 'From idea to production in minutes. Build, deploy, and scale applications with our intelligent infrastructure platform.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.75', maxWidth: '560px', margin: '0 auto 48px' }, mobile: { fontSize: '16px' } }),
        el('container', {}, { desktop: { display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' } }, [
          el('button', { text: 'Start Building — It\'s Free' }, { desktop: { padding: '16px 40px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: 'none', boxShadow: '0 0 40px rgba(99,102,241,0.25), 0 4px 16px rgba(0,0,0,0.2)' } }),
          el('button', { text: 'Book a Demo →' }, { desktop: { padding: '16px 40px', backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', borderRadius: '12px', fontSize: '15px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' } }),
        ]),
        // Browser mockup
        el('container', {}, { desktop: { marginTop: '80px', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }, mobile: { marginTop: '40px' } }, [
          el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' } }, [
            el('container', {}, { desktop: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' } }),
            el('container', {}, { desktop: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' } }),
            el('container', {}, { desktop: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' } }),
          ]),
          el('image', { src: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=600&fit=crop', alt: 'Dashboard' }, { desktop: { width: '100%', height: '400px', objectFit: 'cover' }, mobile: { height: '200px' } }),
        ]),
      ]),
      // Floating cards
      el('container', {}, { desktop: { position: 'absolute', top: '15%', left: '5%', padding: '16px 20px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', transform: 'rotate(-6deg)' }, mobile: { display: 'none' } }, [
        el('text', { text: '🚀 Deploy in 30s' }, { desktop: { fontSize: '13px', color: '#fff', fontWeight: '600' } }),
      ]),
      el('container', {}, { desktop: { position: 'absolute', bottom: '20%', right: '5%', padding: '16px 20px', borderRadius: '14px', backgroundColor: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.08)', transform: 'rotate(4deg)' }, mobile: { display: 'none' } }, [
        el('text', { text: '⚡ 99.99% Uptime' }, { desktop: { fontSize: '13px', color: '#fff', fontWeight: '600' } }),
      ]),
    ], '3D Parallax Hero')],
  },
  {
    id: 'v3-hero-editorial', name: 'Editorial — Magazine Style', category: 'Heroes',
    description: 'Striking editorial layout with oversized typography and asymmetric composition',
    elements: [el('section', {}, { desktop: { minHeight: '100vh', backgroundColor: '#fafaf9', display: 'flex', alignItems: 'center', padding: '80px 80px', position: 'relative', overflow: 'hidden' }, mobile: { padding: '60px 24px', minHeight: 'auto' } }, [
      el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', maxWidth: '1400px', width: '100%', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', gap: '40px' } }, [
        el('container', {}, { desktop: {} }, [
          el('text', { text: '01' }, { desktop: { fontSize: '120px', fontWeight: '200', color: '#e5e5e5', lineHeight: '1', marginBottom: '-20px', fontFamily: "'Georgia', serif" } }),
          el('heading', { text: 'Where vision\nmeets craft', level: 'h1' }, { desktop: { fontSize: '68px', fontWeight: '400', color: '#171717', lineHeight: '1.05', letterSpacing: '-0.04em', marginBottom: '32px', whiteSpace: 'pre-line', fontFamily: "'Georgia', serif" }, mobile: { fontSize: '42px' } }),
          el('text', { text: 'We are a collective of designers, developers, and strategists who believe in the power of thoughtful design to transform businesses and inspire people.' }, { desktop: { fontSize: '16px', color: '#737373', lineHeight: '1.8', maxWidth: '420px', marginBottom: '48px' } }),
          el('container', {}, { desktop: { display: 'flex', gap: '16px' } }, [
            el('button', { text: 'Our Work' }, { desktop: { padding: '16px 40px', backgroundColor: '#171717', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '500', border: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' as any } }),
            el('button', { text: 'About Us →' }, { desktop: { padding: '16px 40px', backgroundColor: 'transparent', color: '#171717', borderRadius: '0', fontSize: '13px', fontWeight: '500', border: '1px solid #d4d4d4', letterSpacing: '0.1em', textTransform: 'uppercase' as any } }),
          ]),
        ]),
        el('container', {}, { desktop: { position: 'relative' } }, [
          el('image', { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=1000&fit=crop', alt: 'Editorial' }, { desktop: { width: '100%', height: '600px', objectFit: 'cover' } }),
          el('container', {}, { desktop: { position: 'absolute', bottom: '-30px', left: '-30px', padding: '28px 32px', backgroundColor: '#171717' }, mobile: { position: 'relative', bottom: 'auto', left: 'auto' } }, [
            el('text', { text: 'ESTABLISHED' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.15em', marginBottom: '4px' } }),
            el('heading', { text: '2019', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '300', color: '#fff', fontFamily: "'Georgia', serif" } }),
          ]),
        ]),
      ]),
    ], 'Editorial Hero')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  V3 FEATURES — Bento, Cards, Animated
// ════════════════════════════════════════════════════════════════════

const V3_FEATURES: SectionBlock[] = [
  {
    id: 'v3-features-bento-animated', name: 'Bento Grid — Animated Cards', category: 'Features',
    description: 'Modern bento grid layout with glassmorphic feature cards and gradient accents',
    elements: [el('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000', position: 'relative', overflow: 'hidden' }, mobile: { padding: '60px 24px' } }, [
      el('container', {}, { desktop: { position: 'absolute', width: '1000px', height: '1000px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents: 'none' } }),
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: '1' } }, [
        el('container', {}, { desktop: { textAlign: 'center', marginBottom: '72px' } }, [
          el('badge', { text: 'FEATURES' }, { desktop: { display: 'inline-flex', padding: '6px 16px', borderRadius: '100px', fontSize: '11px', fontWeight: '600', color: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)', marginBottom: '20px', letterSpacing: '0.12em' } }),
          el('heading', { text: 'Everything you need.\nNothing you don\'t.', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.035em', marginBottom: '20px', whiteSpace: 'pre-line' }, mobile: { fontSize: '32px' } }),
          el('text', { text: 'A carefully curated set of tools that work together seamlessly.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', maxWidth: '480px', margin: '0 auto' } }),
        ]),
        // Bento Grid
        el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'auto auto', gap: '16px' }, mobile: { gridTemplateColumns: '1fr' } }, [
          // Large card
          el('container', {}, { desktop: { gridColumn: 'span 2', padding: '40px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }, mobile: { gridColumn: 'span 1' } }, [
            el('container', {}, { desktop: { width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', fontSize: '20px' } }, [
              el('text', { text: '⚡' }, { desktop: { fontSize: '20px' } }),
            ]),
            el('container', {}, { desktop: {} }, [
              el('heading', { text: 'Lightning Fast Performance', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '12px', letterSpacing: '-0.02em' } }),
              el('text', { text: 'Built on edge infrastructure with sub-50ms response times globally. Your users experience instant interactions regardless of location.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7' } }),
            ]),
          ]),
          // Small card 1
          el('container', {}, { desktop: { padding: '40px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' } }, [
            el('container', {}, { desktop: { width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #ec4899, #f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' } }, [
              el('text', { text: '🎨' }, { desktop: { fontSize: '20px' } }),
            ]),
            el('heading', { text: 'Beautiful by Default', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
            el('text', { text: 'Every component is designed with pixel-perfect attention to detail.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7' } }),
          ]),
          // Small card 2
          el('container', {}, { desktop: { padding: '40px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' } }, [
            el('container', {}, { desktop: { width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' } }, [
              el('text', { text: '🔒' }, { desktop: { fontSize: '20px' } }),
            ]),
            el('heading', { text: 'Enterprise Security', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
            el('text', { text: 'SOC 2 compliant with end-to-end encryption and advanced access controls.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7' } }),
          ]),
          // Large card right
          el('container', {}, { desktop: { gridColumn: 'span 2', padding: '40px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.04))', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '280px' }, mobile: { gridColumn: 'span 1' } }, [
            el('heading', { text: 'AI-Powered Workflows', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '12px' } }),
            el('text', { text: 'Let AI handle the repetitive work. Our intelligent automation learns your patterns and suggests optimizations that save hours every week.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', maxWidth: '500px' } }),
            el('container', {}, { desktop: { display: 'flex', gap: '24px', marginTop: '24px' } }, [
              el('container', {}, { desktop: {} }, [
                el('heading', { text: '10x', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#8b5cf6' } }),
                el('text', { text: 'Faster workflows' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' } }),
              ]),
              el('container', {}, { desktop: {} }, [
                el('heading', { text: '40hrs', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#8b5cf6' } }),
                el('text', { text: 'Saved per month' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' } }),
              ]),
            ]),
          ]),
        ]),
      ]),
    ], 'Bento Features')],
  },
  {
    id: 'v3-features-icon-grid', name: 'Icon Grid — Minimal Cards', category: 'Features',
    description: 'Clean 3-column grid with icon boxes and hover-ready styling',
    elements: [el('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#fafaf9' }, mobile: { padding: '60px 24px' } }, [
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        el('container', {}, { desktop: { textAlign: 'center', marginBottom: '72px' } }, [
          el('text', { text: 'WHY CHOOSE US' }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '0.15em', marginBottom: '16px' } }),
          el('heading', { text: 'Built for modern teams', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '600', color: '#171717', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '30px' } }),
          el('text', { text: 'Everything you need to build, ship, and iterate — all in one place.' }, { desktop: { fontSize: '17px', color: '#737373', maxWidth: '500px', margin: '0 auto' } }),
        ]),
        el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }, mobile: { gridTemplateColumns: '1fr' } }, [
          ...['Analytics', 'Collaboration', 'Automation', 'Integrations', 'Security', 'Support'].map((title, i) => {
            const icons = ['📊', '👥', '⚙️', '🔗', '🛡️', '💬'];
            const descriptions = [
              'Deep insights into user behavior with real-time dashboards.',
              'Work together seamlessly with built-in team tools.',
              'Automate repetitive tasks and focus on what matters.',
              'Connect with 200+ tools you already use daily.',
              'Enterprise-grade security with SOC 2 compliance.',
              'Get help from our team of experts, any time.',
            ];
            return el('container', {}, { desktop: { padding: '36px', borderRadius: '16px', backgroundColor: '#fff', border: '1px solid #f0f0f0', transition: 'all 0.3s ease' } }, [
              el('container', {}, { desktop: { width: '52px', height: '52px', borderRadius: '14px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '22px' } }, [
                el('text', { text: icons[i] }, { desktop: { fontSize: '22px' } }),
              ]),
              el('heading', { text: title, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#171717', marginBottom: '8px' } }),
              el('text', { text: descriptions[i] }, { desktop: { fontSize: '14px', color: '#737373', lineHeight: '1.7' } }),
            ]);
          }),
        ]),
      ]),
    ], 'Icon Grid Features')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  V3 TESTIMONIALS — Social Proof
// ════════════════════════════════════════════════════════════════════

const V3_TESTIMONIALS: SectionBlock[] = [
  {
    id: 'v3-testimonials-masonry', name: 'Masonry — Social Proof Wall', category: 'Testimonials',
    description: 'Masonry-style testimonial grid with varied card heights and avatar badges',
    elements: [el('section', {}, { desktop: { padding: '120px 80px', background: 'linear-gradient(180deg, #000 0%, #0a0a0a 100%)', position: 'relative', overflow: 'hidden' }, mobile: { padding: '60px 24px' } }, [
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        el('container', {}, { desktop: { textAlign: 'center', marginBottom: '72px' } }, [
          el('heading', { text: 'Loved by thousands\nof teams worldwide', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.03em', marginBottom: '16px', whiteSpace: 'pre-line' }, mobile: { fontSize: '30px' } }),
          el('text', { text: 'Don\'t just take our word for it — hear from our customers.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)' } }),
        ]),
        el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }, mobile: { gridTemplateColumns: '1fr' } }, [
          ...[
            { quote: 'This platform completely transformed how we build products. The speed improvement alone paid for itself in the first week.', name: 'Sarah Chen', role: 'CTO, Meridian' },
            { quote: 'Finally, a tool that gets out of the way and lets us focus on building great products.', name: 'James Miller', role: 'Lead Engineer, Flux' },
            { quote: 'We went from idea to production in 3 days. Previously that took us 3 months. The ROI is unreal.', name: 'Emily Zhang', role: 'Founder, Nexus AI' },
            { quote: 'The developer experience is unmatched. Hot reload, instant deployments, and a team that actually listens to feedback.', name: 'Marcus Johnson', role: 'VP Engineering, Scale' },
            { quote: 'After evaluating 15+ tools, this was the clear winner. Nothing else comes close.', name: 'Priya Patel', role: 'Product Lead, Orbit' },
            { quote: 'Our team productivity jumped 4x after switching. The AI features are genuinely useful, not just marketing fluff.', name: 'David Kim', role: 'CEO, Quantum Labs' },
          ].map((t) =>
            el('container', {}, { desktop: { padding: '28px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } }, [
              el('container', {}, { desktop: { display: 'flex', gap: '2px', marginBottom: '16px' } }, [
                ...Array(5).fill(null).map(() => el('text', { text: '★' }, { desktop: { fontSize: '14px', color: '#f59e0b' } })),
              ]),
              el('text', { text: `"${t.quote}"` }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginBottom: '20px', fontStyle: 'italic' } }),
              el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
                el('container', {}, { desktop: { width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
                  el('text', { text: t.name[0] }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#fff' } }),
                ]),
                el('container', {}, { desktop: {} }, [
                  el('text', { text: t.name }, { desktop: { fontSize: '13px', fontWeight: '600', color: '#fff' } }),
                  el('text', { text: t.role }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)' } }),
                ]),
              ]),
            ])
          ),
        ]),
      ]),
    ], 'Masonry Testimonials')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  V3 PRICING — Glassmorphic & Animated
// ════════════════════════════════════════════════════════════════════

const V3_PRICING: SectionBlock[] = [
  {
    id: 'v3-pricing-gradient-cards', name: 'Gradient Cards — Premium Pricing', category: 'Pricing',
    description: 'Three-tier pricing with gradient highlighted popular plan',
    elements: [el('section', {}, { desktop: { padding: '120px 80px', background: 'linear-gradient(180deg, #0a0a0a 0%, #000 100%)', position: 'relative', overflow: 'hidden' }, mobile: { padding: '60px 24px' } }, [
      el('container', {}, { desktop: { position: 'absolute', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)', top: '30%', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' } }),
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: '1' } }, [
        el('container', {}, { desktop: { textAlign: 'center', marginBottom: '64px' } }, [
          el('heading', { text: 'Simple, transparent pricing', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '30px' } }),
          el('text', { text: 'Start free. Upgrade when you need to. Cancel anytime.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)' } }),
        ]),
        el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', gap: '16px' } }, [
          // Starter
          el('container', {}, { desktop: { padding: '40px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' } }, [
            el('text', { text: 'Starter' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', letterSpacing: '0.05em' } }),
            el('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' } }, [
              el('heading', { text: '$0', level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff' } }),
              el('text', { text: '/month' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)' } }),
            ]),
            el('text', { text: 'Perfect for personal projects and experimentation.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.6', marginBottom: '32px' } }),
            el('button', { text: 'Get Started Free' }, { desktop: { width: '100%', padding: '14px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '32px' } }),
            ...['3 projects', '1GB storage', 'Community support', 'Basic analytics'].map(f =>
              el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' } }, [
                el('text', { text: '✓' }, { desktop: { fontSize: '14px', color: '#4ade80' } }),
                el('text', { text: f }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)' } }),
              ])
            ),
          ]),
          // Pro - Featured
          el('container', {}, { desktop: { padding: '40px', borderRadius: '20px', background: 'linear-gradient(180deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.06) 100%)', border: '1px solid rgba(99,102,241,0.2)', position: 'relative', height: '100%' } }, [
            el('container', {}, { desktop: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: '100px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontSize: '11px', fontWeight: '700', color: '#fff', letterSpacing: '0.05em' } }, [
              el('text', { text: 'MOST POPULAR' }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#fff' } }),
            ]),
            el('text', { text: 'Pro' }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#a78bfa', marginBottom: '16px', letterSpacing: '0.05em' } }),
            el('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' } }, [
              el('heading', { text: '$29', level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff' } }),
              el('text', { text: '/month' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)' } }),
            ]),
            el('text', { text: 'For growing teams who need more power and flexibility.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6', marginBottom: '32px' } }),
            el('button', { text: 'Start Free Trial' }, { desktop: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.3)', marginBottom: '32px' } }),
            ...['Unlimited projects', '100GB storage', 'Priority support', 'Advanced analytics', 'Custom domains', 'API access'].map(f =>
              el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' } }, [
                el('text', { text: '✓' }, { desktop: { fontSize: '14px', color: '#8b5cf6' } }),
                el('text', { text: f }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' } }),
              ])
            ),
          ]),
          // Enterprise
          el('container', {}, { desktop: { padding: '40px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', height: '100%' } }, [
            el('text', { text: 'Enterprise' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', letterSpacing: '0.05em' } }),
            el('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' } }, [
              el('heading', { text: 'Custom', level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff' } }),
            ]),
            el('text', { text: 'Tailored solutions for large organizations with custom needs.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.6', marginBottom: '32px' } }),
            el('button', { text: 'Contact Sales' }, { desktop: { width: '100%', padding: '14px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '32px' } }),
            ...['Everything in Pro', 'Unlimited storage', 'Dedicated support', 'SSO & SAML', 'Custom SLA', 'On-premise option'].map(f =>
              el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' } }, [
                el('text', { text: '✓' }, { desktop: { fontSize: '14px', color: '#4ade80' } }),
                el('text', { text: f }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)' } }),
              ])
            ),
          ]),
        ]),
      ]),
    ], 'Gradient Pricing')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  V3 CTA — Conversion Focused
// ════════════════════════════════════════════════════════════════════

const V3_CTA: SectionBlock[] = [
  {
    id: 'v3-cta-gradient-banner', name: 'Gradient Banner — Full Width CTA', category: 'CTA',
    description: 'Full-width gradient CTA with floating shapes and strong call to action',
    elements: [el('section', {}, { desktop: { padding: '100px 80px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)', position: 'relative', overflow: 'hidden', textAlign: 'center' }, mobile: { padding: '60px 24px' } }, [
      el('container', {}, { desktop: { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)', top: '-100px', right: '-100px', pointerEvents: 'none' } }),
      el('container', {}, { desktop: { position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.03)', bottom: '-80px', left: '-80px', pointerEvents: 'none' } }),
      el('container', {}, { desktop: { position: 'relative', zIndex: '1', maxWidth: '700px', margin: '0 auto' } }, [
        el('heading', { text: 'Ready to get started?', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.03em', marginBottom: '20px' }, mobile: { fontSize: '32px' } }),
        el('text', { text: 'Join thousands of teams already building with us. Start free, no credit card required.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.7', marginBottom: '40px' } }),
        el('container', {}, { desktop: { display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' } }, [
          el('button', { text: 'Start Free Trial' }, { desktop: { padding: '18px 44px', backgroundColor: '#fff', color: '#4f46e5', borderRadius: '12px', fontSize: '15px', fontWeight: '700', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } }),
          el('button', { text: 'Schedule Demo' }, { desktop: { padding: '18px 44px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '12px', fontSize: '15px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)' } }),
        ]),
      ]),
    ], 'Gradient CTA')],
  },
  {
    id: 'v3-cta-dark-minimal', name: 'Dark Minimal — Centered CTA', category: 'CTA',
    description: 'Ultra-clean dark CTA with minimal design and strong typography',
    elements: [el('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000', textAlign: 'center' }, mobile: { padding: '80px 24px' } }, [
      el('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto' } }, [
        el('heading', { text: 'Start building today.', level: 'h2' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', letterSpacing: '-0.04em', marginBottom: '24px' }, mobile: { fontSize: '34px' } }),
        el('text', { text: 'Free to start. No credit card needed.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.35)', marginBottom: '40px' } }),
        el('container', {}, { desktop: { display: 'inline-flex', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' } }, [
          el('input', { placeholder: 'Enter your email', inputType: 'email' }, { desktop: { padding: '16px 24px', backgroundColor: 'rgba(255,255,255,0.04)', border: 'none', color: '#fff', fontSize: '14px', width: '300px', outline: 'none' }, mobile: { width: '200px' } }),
          el('button', { text: 'Get Started →' }, { desktop: { padding: '16px 28px', backgroundColor: '#fff', color: '#000', border: 'none', fontSize: '14px', fontWeight: '600' } }),
        ]),
      ]),
    ], 'Dark Minimal CTA')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  V3 STATS — Animated Counters
// ════════════════════════════════════════════════════════════════════

const V3_STATS: SectionBlock[] = [
  {
    id: 'v3-stats-gradient-cards', name: 'Gradient Stats — Animated Numbers', category: 'Stats',
    description: 'Large animated stat numbers with gradient accents on dark background',
    elements: [el('section', {}, { desktop: { padding: '100px 80px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '60px 24px' } }, [
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', textAlign: 'center' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' } }, [
        ...[
          { number: '500K+', label: 'Active Users', color: '#6366f1' },
          { number: '99.9%', label: 'Uptime SLA', color: '#10b981' },
          { number: '150+', label: 'Countries Served', color: '#ec4899' },
          { number: '$2.1B', label: 'Revenue Processed', color: '#f59e0b' },
        ].map(stat =>
          el('container', {}, { desktop: {} }, [
            el('heading', { text: stat.number, level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '700', color: stat.color, marginBottom: '8px', letterSpacing: '-0.02em' }, mobile: { fontSize: '32px' } }),
            el('text', { text: stat.label }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', fontWeight: '500' } }),
          ])
        ),
      ]),
    ], 'Gradient Stats')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  V3 FAQ — Interactive Accordions
// ════════════════════════════════════════════════════════════════════

const V3_FAQ: SectionBlock[] = [
  {
    id: 'v3-faq-split-layout', name: 'Split FAQ — Title + Accordions', category: 'FAQ',
    description: 'Two-column layout with section info left and FAQ items right',
    elements: [el('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '80px' }, mobile: { gridTemplateColumns: '1fr', gap: '40px' } }, [
        el('container', {}, { desktop: { position: 'sticky', top: '120px', alignSelf: 'start' } }, [
          el('text', { text: 'FAQ' }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '0.15em', marginBottom: '16px' } }),
          el('heading', { text: 'Frequently asked\nquestions', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '20px', whiteSpace: 'pre-line' }, mobile: { fontSize: '28px' } }),
          el('text', { text: 'Can\'t find what you\'re looking for? Reach out to our support team.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7', marginBottom: '24px' } }),
          el('button', { text: 'Contact Support →' }, { desktop: { padding: '12px 28px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)' } }),
        ]),
        el('container', {}, { desktop: {} }, [
          ...[
            { q: 'How does the free plan work?', a: 'Our free plan includes everything you need to get started. You get 3 projects, 1GB of storage, and access to our community support. No credit card required.' },
            { q: 'Can I upgrade or downgrade at any time?', a: 'Yes! You can change your plan at any time. When upgrading, you\'ll be prorated for the remainder of your billing cycle. Downgrades take effect at the next billing period.' },
            { q: 'Is my data secure?', a: 'Absolutely. We\'re SOC 2 Type II compliant and all data is encrypted at rest and in transit. We also support SSO and SAML for enterprise customers.' },
            { q: 'Do you offer refunds?', a: 'We offer a 30-day money-back guarantee on all paid plans. If you\'re not satisfied, contact us for a full refund within the first 30 days.' },
            { q: 'Can I use my own custom domain?', a: 'Yes, custom domains are available on Pro and Enterprise plans. You can connect any domain you own and we handle SSL certificates automatically.' },
          ].map((faq, i) =>
            el('container', {}, { desktop: { padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } }, [
              el('heading', { text: faq.q, level: 'h3' }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '12px', cursor: 'pointer' } }),
              el('text', { text: faq.a }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
            ])
          ),
        ]),
      ]),
    ], 'Split FAQ')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  V3 FOOTERS — Modern & Complete
// ════════════════════════════════════════════════════════════════════

const V3_FOOTERS: SectionBlock[] = [
  {
    id: 'v3-footer-mega', name: 'Mega Footer — Full Links Grid', category: 'Footers',
    description: 'Comprehensive footer with logo, link columns, newsletter, and legal',
    elements: [el('section', {}, { desktop: { padding: '80px 80px 40px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '60px 24px 32px' } }, [
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr', gap: '48px', marginBottom: '60px' }, mobile: { gridTemplateColumns: '1fr 1fr', gap: '32px' } }, [
          // Brand column
          el('container', {}, { desktop: {} }, [
            el('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', marginBottom: '16px' } }),
            el('text', { text: 'Building the future of digital experiences, one pixel at a time.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7', marginBottom: '20px', maxWidth: '260px' } }),
            el('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
              ...['𝕏', 'in', 'gh', 'yt'].map(icon =>
                el('container', {}, { desktop: { width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } }, [
                  el('text', { text: icon }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '700' } }),
                ])
              ),
            ]),
          ]),
          // Product column
          el('container', {}, { desktop: {} }, [
            el('text', { text: 'Product' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' as any } }),
            ...['Features', 'Integrations', 'Pricing', 'Changelog', 'Roadmap'].map(link =>
              el('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '14px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: '10px' } })
            ),
          ]),
          // Company column
          el('container', {}, { desktop: {} }, [
            el('text', { text: 'Company' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' as any } }),
            ...['About', 'Blog', 'Careers', 'Press', 'Contact'].map(link =>
              el('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '14px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: '10px' } })
            ),
          ]),
          // Legal column
          el('container', {}, { desktop: {} }, [
            el('text', { text: 'Legal' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' as any } }),
            ...['Privacy', 'Terms', 'Security', 'Cookies', 'GDPR'].map(link =>
              el('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '14px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: '10px' } })
            ),
          ]),
          // Newsletter
          el('container', {}, { desktop: {} }, [
            el('text', { text: 'Stay Updated' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', marginBottom: '16px', textTransform: 'uppercase' as any } }),
            el('text', { text: 'Get the latest news and updates delivered to your inbox.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.6', marginBottom: '16px' } }),
            el('container', {}, { desktop: { display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' } }, [
              el('input', { placeholder: 'your@email.com', inputType: 'email' }, { desktop: { flex: '1', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.04)', border: 'none', color: '#fff', fontSize: '13px' } }),
              el('button', { text: '→' }, { desktop: { padding: '10px 16px', backgroundColor: '#6366f1', color: '#fff', border: 'none', fontWeight: '700' } }),
            ]),
          ]),
        ]),
        // Bottom bar
        el('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.06)' }, mobile: { flexDirection: 'column', gap: '12px', textAlign: 'center' } }, [
          el('text', { text: '© 2026 Brand. All rights reserved.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.25)' } }),
          el('container', {}, { desktop: { display: 'flex', gap: '24px' } }, [
            el('link', { text: 'Privacy Policy', href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' } }),
            el('link', { text: 'Terms of Service', href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' } }),
          ]),
        ]),
      ]),
    ], 'Mega Footer')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  V3 LOGOS — Trust Bars
// ════════════════════════════════════════════════════════════════════

const V3_LOGOS: SectionBlock[] = [
  {
    id: 'v3-logos-dark-bar', name: 'Logo Bar — Dark Minimal', category: 'Logos',
    description: 'Clean logo bar with "trusted by" header and company names',
    elements: [el('section', {}, { desktop: { padding: '60px 80px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '40px 24px' } }, [
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center' } }, [
        el('text', { text: 'TRUSTED BY INDUSTRY LEADERS' }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', marginBottom: '40px' } }),
        el('container', {}, { desktop: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '56px', flexWrap: 'wrap', opacity: '0.4' } }, [
          ...['STRIPE', 'VERCEL', 'NOTION', 'LINEAR', 'FIGMA', 'SLACK'].map(brand =>
            el('text', { text: brand }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', letterSpacing: '0.12em' } })
          ),
        ]),
      ]),
    ], 'Dark Logo Bar')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  V3 CONTENT — About / Blog / Portfolio
// ════════════════════════════════════════════════════════════════════

const V3_CONTENT: SectionBlock[] = [
  {
    id: 'v3-content-image-text-split', name: 'Image + Text — About Section', category: 'Content',
    description: 'Clean split layout with large image and about text',
    elements: [el('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', gap: '40px' } }, [
        el('container', {}, { desktop: { borderRadius: '20px', overflow: 'hidden' } }, [
          el('image', { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=1000&fit=crop', alt: 'About' }, { desktop: { width: '100%', height: '500px', objectFit: 'cover' } }),
        ]),
        el('container', {}, { desktop: {} }, [
          el('text', { text: 'ABOUT US' }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '0.15em', marginBottom: '16px' } }),
          el('heading', { text: 'We believe great design\nis transformative', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '24px', whiteSpace: 'pre-line' }, mobile: { fontSize: '28px' } }),
          el('text', { text: 'Founded in 2019, we\'ve grown from a small team of passionate designers to a global studio of 50+ creatives, engineers, and strategists.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8', marginBottom: '16px' } }),
          el('text', { text: 'Our mission is simple: to help ambitious companies build digital experiences that their customers love and their competitors envy.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8', marginBottom: '32px' } }),
          el('container', {}, { desktop: { display: 'flex', gap: '40px' } }, [
            el('container', {}, { desktop: {} }, [
              el('heading', { text: '50+', level: 'h3' }, { desktop: { fontSize: '32px', fontWeight: '700', color: '#6366f1' } }),
              el('text', { text: 'Team Members' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' } }),
            ]),
            el('container', {}, { desktop: {} }, [
              el('heading', { text: '12', level: 'h3' }, { desktop: { fontSize: '32px', fontWeight: '700', color: '#6366f1' } }),
              el('text', { text: 'Countries' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' } }),
            ]),
          ]),
        ]),
      ]),
    ], 'About Section')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  V3 CONTACT
// ════════════════════════════════════════════════════════════════════

const V3_CONTACT: SectionBlock[] = [
  {
    id: 'v3-contact-split-form', name: 'Split Contact — Info + Form', category: 'Contact',
    description: 'Two-column contact with info left and form right',
    elements: [el('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '80px' }, mobile: { gridTemplateColumns: '1fr', gap: '40px' } }, [
        el('container', {}, { desktop: {} }, [
          el('text', { text: 'CONTACT' }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#6366f1', letterSpacing: '0.15em', marginBottom: '16px' } }),
          el('heading', { text: 'Let\'s build\nsomething great', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '24px', whiteSpace: 'pre-line' }, mobile: { fontSize: '30px' } }),
          el('text', { text: 'Have a project in mind? We\'d love to hear about it. Drop us a line and we\'ll get back within 24 hours.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8', marginBottom: '40px' } }),
          ...[
            { label: 'Email', value: 'hello@brand.com' },
            { label: 'Phone', value: '+1 (555) 123-4567' },
            { label: 'Office', value: '123 Design St, San Francisco, CA' },
          ].map(info =>
            el('container', {}, { desktop: { marginBottom: '20px' } }, [
              el('text', { text: info.label }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', marginBottom: '4px', textTransform: 'uppercase' as any } }),
              el('text', { text: info.value }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.6)' } }),
            ])
          ),
        ]),
        el('container', {}, { desktop: { padding: '40px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } }, [
          el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }, mobile: { gridTemplateColumns: '1fr' } }, [
            el('input', { placeholder: 'First name', inputType: 'text', label: '' }, { desktop: { padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '14px', width: '100%' } }),
            el('input', { placeholder: 'Last name', inputType: 'text', label: '' }, { desktop: { padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '14px', width: '100%' } }),
          ]),
          el('input', { placeholder: 'your@email.com', inputType: 'email', label: '' }, { desktop: { padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '14px', width: '100%', marginBottom: '16px' } }),
          el('textarea', { placeholder: 'Tell us about your project...', label: '' }, { desktop: { padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '14px', width: '100%', minHeight: '140px', resize: 'vertical', marginBottom: '20px' } }),
          el('button', { text: 'Send Message →' }, { desktop: { width: '100%', padding: '16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '15px', fontWeight: '600', border: 'none', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' } }),
        ]),
      ]),
    ], 'Contact Split')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  EXPORT ALL V3
// ════════════════════════════════════════════════════════════════════

export const PREMIUM_SECTION_BLOCKS_V3: SectionBlock[] = [
  ...V3_HEROES,
  ...V3_FEATURES,
  ...V3_TESTIMONIALS,
  ...V3_PRICING,
  ...V3_CTA,
  ...V3_STATS,
  ...V3_FAQ,
  ...V3_FOOTERS,
  ...V3_LOGOS,
  ...V3_CONTENT,
  ...V3_CONTACT,
];
