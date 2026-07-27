import { EditorElement } from '../types';
import { SectionBlock, SectionCategory } from './sectionBlocks';

let _sc5 = 0;
function sid(): string { _sc5++; return `sv5-${_sc5}-${Math.random().toString(36).slice(2, 7)}`; }
function s(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: sid(), type, name: name ?? type, props, styles, children };
}
function anim(element: EditorElement, animation: EditorElement['animations']): EditorElement {
  return { ...element, animations: animation };
}
const FADE_UP = { type: 'fadeInUp' as const, duration: 0.8, delay: 0, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
const BLUR_IN = { type: 'blurIn' as const, duration: 1.2, delay: 0, trigger: 'onView' as const };
const SCALE_IN = { type: 'scaleIn' as const, duration: 1, delay: 0.2, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };

export const PREMIUM_SECTION_BLOCKS_V5: SectionBlock[] = [

  // 1. GRADIENT AURORA HERO
  {
    id: 'v5-aurora-hero', name: 'Aurora Gradient Hero', category: 'Heroes' as SectionCategory,
    description: 'Cinematic full-screen hero with animated aurora gradient backdrop',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, #0a0a0a 0%, #0d1117 25%, #0a0a0a 50%, #111827 75%, #0a0a0a 100%)' } }, [
      s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(236,72,153,0.08) 0%, transparent 60%), radial-gradient(ellipse 70% 40% at 80% 20%, rgba(59,130,246,0.1) 0%, transparent 60%)', animation: 'pulse 8s ease-in-out infinite' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '900px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        anim(s('text', { text: 'NEXT GENERATION PLATFORM' }, { desktop: { fontSize: '11px', color: 'rgba(147,130,255,0.7)', letterSpacing: '0.25em', marginBottom: '32px', fontWeight: '600' } }), FADE_UP),
        anim(s('heading', { text: 'Build Something\nExtraordinary', level: 'h1' }, { desktop: { fontSize: '82px', fontWeight: '800', color: '#fff', lineHeight: '0.98', letterSpacing: '-0.045em', marginBottom: '28px', background: 'linear-gradient(180deg, #fff 40%, rgba(255,255,255,0.4) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as any, mobile: { fontSize: '44px' } }), BLUR_IN),
        anim(s('text', { text: 'The all-in-one platform that transforms how visionary teams create, collaborate, and ship world-class digital products.' }, { desktop: { fontSize: '19px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.75', marginBottom: '48px', maxWidth: '580px', margin: '0 auto 48px' } }), { ...FADE_UP, delay: 0.3 }),
        anim(s('container', {}, { desktop: { display: 'flex', gap: '16px', justifyContent: 'center' } }, [
          s('button', { text: 'Start Free Trial', href: '#' }, { desktop: { padding: '18px 44px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', letterSpacing: '0.02em' } }),
          s('button', { text: 'Watch Demo', href: '#' }, { desktop: { padding: '18px 44px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' } }),
        ]), { ...FADE_UP, delay: 0.5 }),
      ]),
    ])],
  },

  // 2. BENTO FEATURE GRID
  {
    id: 'v5-bento-features', name: 'Bento Feature Grid', category: 'Features' as SectionCategory,
    description: 'Apple-style asymmetric bento grid with glassmorphic cards',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto 64px', textAlign: 'center' } }, [
        s('text', { text: 'CAPABILITIES' }, { desktop: { fontSize: '11px', color: 'rgba(99,102,241,0.8)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
        s('heading', { text: 'Everything You Need', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
      ]), FADE_UP),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'auto auto', gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        anim(s('card', {}, { desktop: { gridColumn: 'span 2', padding: '48px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } }, [
          s('text', { text: '⚡' }, { desktop: { fontSize: '36px', marginBottom: '20px' } }),
          s('heading', { text: 'Lightning Fast Performance', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
          s('text', { text: 'Sub-millisecond response times with globally distributed edge infrastructure. Your users experience instant interactions.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', maxWidth: '480px' } }),
        ]), { ...FADE_UP, delay: 0 }),
        anim(s('card', {}, { desktop: { padding: '48px', backgroundColor: 'rgba(99,102,241,0.06)', borderRadius: '20px', border: '1px solid rgba(99,102,241,0.12)', minHeight: '280px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } }, [
          s('text', { text: '🔒' }, { desktop: { fontSize: '36px', marginBottom: '20px' } }),
          s('heading', { text: 'Enterprise Security', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '10px' } }),
          s('text', { text: 'SOC 2 Type II certified with end-to-end encryption.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
        ]), { ...FADE_UP, delay: 0.1 }),
        anim(s('card', {}, { desktop: { padding: '48px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', minHeight: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } }, [
          s('text', { text: '🤖' }, { desktop: { fontSize: '36px', marginBottom: '20px' } }),
          s('heading', { text: 'AI-Powered', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '10px' } }),
          s('text', { text: 'Built-in AI that learns your workflow and automates repetitive tasks.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
        ]), { ...FADE_UP, delay: 0.15 }),
        anim(s('card', {}, { desktop: { gridColumn: 'span 2', padding: '48px', background: 'linear-gradient(135deg, rgba(59,130,246,0.06), rgba(99,102,241,0.04))', borderRadius: '20px', border: '1px solid rgba(59,130,246,0.1)', minHeight: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } }, [
          s('text', { text: '🌐' }, { desktop: { fontSize: '36px', marginBottom: '20px' } }),
          s('heading', { text: 'Global Scale Infrastructure', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
          s('text', { text: 'Deploy to 300+ edge locations worldwide with automatic failover and 99.99% uptime guarantee.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' } }),
        ]), { ...FADE_UP, delay: 0.2 }),
      ]),
    ])],
  },

  // 3. EDITORIAL TEXT HERO
  {
    id: 'v5-editorial-hero', name: 'Editorial Text Hero', category: 'Heroes' as SectionCategory,
    description: 'Magazine-style oversized typography hero with no image',
    elements: [s('section', {}, { desktop: { padding: '200px 80px 160px', backgroundColor: '#000', width: '100%', position: 'relative', overflow: 'hidden' }, mobile: { padding: '120px 24px 80px' } }, [
      s('container', {}, { desktop: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: 'radial-gradient(circle, rgba(255,255,255,0.02) 0%, transparent 70%)', borderRadius: '50%' } }),
      s('container', {}, { desktop: { position: 'relative', maxWidth: '1100px' } }, [
        anim(s('text', { text: 'EST. 2024' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3em', marginBottom: '48px', fontWeight: '500' } }), FADE_UP),
        anim(s('heading', { text: 'We Create\nTimeless Digital\nExperiences', level: 'h1' }, { desktop: { fontSize: '96px', fontWeight: '300', color: '#fff', lineHeight: '1.02', letterSpacing: '-0.05em' }, mobile: { fontSize: '48px' } }), BLUR_IN),
        anim(s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '80px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '32px' }, mobile: { flexDirection: 'column', gap: '24px', alignItems: 'flex-start' } }, [
          s('text', { text: 'A design studio crafting premium\ndigital products for global brands.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
          s('button', { text: 'Explore Our Work →', href: '#' }, { desktop: { padding: '16px 0', backgroundColor: 'transparent', color: '#fff', border: 'none', fontSize: '14px', fontWeight: '500', letterSpacing: '0.02em', borderBottom: '1px solid rgba(255,255,255,0.2)' } }),
        ]), { ...FADE_UP, delay: 0.4 }),
      ]),
    ])],
  },

  // 4. GLASSMORPHIC PRICING
  {
    id: 'v5-glass-pricing', name: 'Glassmorphic Pricing', category: 'Pricing' as SectionCategory,
    description: 'Premium glass-effect pricing cards with gradient accents',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', background: 'linear-gradient(180deg, #0a0a0a 0%, #0d1117 100%)', width: '100%', position: 'relative' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)', borderRadius: '50%' } }),
      anim(s('container', {}, { desktop: { textAlign: 'center', marginBottom: '64px', position: 'relative', zIndex: '1' } }, [
        s('text', { text: 'PRICING' }, { desktop: { fontSize: '11px', color: 'rgba(99,102,241,0.8)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
        s('heading', { text: 'Simple, Transparent Pricing', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' } }),
        s('text', { text: 'No hidden fees. No surprises. Cancel anytime.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)' } }),
      ]), FADE_UP),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: '1' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...[
          { name: 'Starter', price: '$29', period: '/month', desc: 'For individuals and small projects', features: '5 Projects\n10GB Storage\nBasic Analytics\nEmail Support\nAPI Access', popular: false },
          { name: 'Pro', price: '$79', period: '/month', desc: 'For growing teams and businesses', features: 'Unlimited Projects\n100GB Storage\nAdvanced Analytics\nPriority Support\nTeam Collaboration\nCustom Domains\nSSL Certificates', popular: true },
          { name: 'Enterprise', price: '$199', period: '/month', desc: 'For large organisations at scale', features: 'Everything in Pro\nUnlimited Storage\nDedicated Manager\nSLA Guarantee\nCustom Integrations\nSOC 2 Compliance\nAdvanced Security', popular: false },
        ].map((p, i) => anim(s('card', {}, { desktop: { padding: '44px', borderRadius: '20px', border: p.popular ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)', backgroundColor: p.popular ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden', transform: p.popular ? 'scale(1.05)' : 'none' } }, [
          ...(p.popular ? [s('container', {}, { desktop: { position: 'absolute', top: '0', left: '0', right: '0', height: '3px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #a78bfa)' } })] : []),
          ...(p.popular ? [s('text', { text: 'MOST POPULAR' }, { desktop: { padding: '4px 14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '4px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.1em' } })] : []),
          s('heading', { text: p.name, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
          s('text', { text: p.desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '24px' } }),
          s('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' } }, [
            s('heading', { text: p.price, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
            s('text', { text: p.period }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.3)' } }),
          ]),
          s('text', { text: p.features }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '2.4', whiteSpace: 'pre-line', marginBottom: '36px' } }),
          s('button', { text: p.popular ? 'Get Started' : 'Choose Plan', href: '#' }, { desktop: { padding: '16px 32px', background: p.popular ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent', color: p.popular ? '#fff' : 'rgba(255,255,255,0.7)', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.1)', width: '100%' } }),
        ]), { ...FADE_UP, delay: i * 0.1 })),
      ]),
    ])],
  },

  // 5. STACKED TESTIMONIALS
  {
    id: 'v5-stacked-testimonials', name: 'Stacked Testimonials', category: 'Testimonials' as SectionCategory,
    description: 'Large quote testimonials in a stacked editorial layout',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', marginBottom: '80px' } }, [
        s('text', { text: 'TESTIMONIALS' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
        s('heading', { text: 'Trusted by Industry Leaders', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em' } }),
      ]), FADE_UP),
      s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0' } }, [
        ...[
          { quote: 'This platform completely transformed how we approach digital product development. The results speak for themselves — 300% increase in conversion rates.', name: 'Victoria Chen', role: 'CTO, Quantum Labs', avatar: 'VC' },
          { quote: 'The attention to detail and level of craft is unmatched. Every interaction feels intentional. Our team productivity doubled within the first month.', name: 'Marcus Rivera', role: 'Head of Design, Apex Studio', avatar: 'MR' },
          { quote: 'We evaluated 15 platforms before choosing this one. It was the clear winner on every metric — performance, flexibility, and developer experience.', name: 'Eleanor Whitfield', role: 'VP Engineering, NovaTech', avatar: 'EW' },
        ].map((t, i) => anim(s('container', {}, { desktop: { padding: '56px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'grid', gridTemplateColumns: '1fr auto', gap: '48px', alignItems: 'start' }, mobile: { gridTemplateColumns: '1fr', gap: '24px' } }, [
          s('container', {}, { desktop: {} }, [
            s('text', { text: `"${t.quote}"` }, { desktop: { fontSize: '22px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.6', letterSpacing: '-0.01em', fontStyle: 'italic' } }),
          ]),
          s('container', {}, { desktop: { textAlign: 'right', minWidth: '180px' }, mobile: { textAlign: 'left' } }, [
            s('container', {}, { desktop: { width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px', marginLeft: 'auto' }, mobile: { marginLeft: '0' } }, [
              s('text', { text: t.avatar }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#fff' } }),
            ]),
            s('text', { text: t.name }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#fff' } }),
            s('text', { text: t.role }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' } }),
          ]),
        ]), { ...FADE_UP, delay: i * 0.15 })),
      ]),
    ])],
  },

  // 6. PROCESS TIMELINE
  {
    id: 'v5-process-timeline', name: 'Process Timeline', category: 'Content' as SectionCategory,
    description: 'Vertical timeline showing step-by-step process with line connector',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { textAlign: 'center', marginBottom: '80px' } }, [
        s('text', { text: 'HOW IT WORKS' }, { desktop: { fontSize: '11px', color: 'rgba(99,102,241,0.8)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
        s('heading', { text: 'From Idea to Launch', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
      ]), FADE_UP),
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto', position: 'relative' } }, [
        s('container', {}, { desktop: { position: 'absolute', left: '24px', top: '0', bottom: '0', width: '1px', background: 'linear-gradient(180deg, rgba(99,102,241,0.3), rgba(99,102,241,0.05))' }, mobile: { left: '16px' } }),
        ...[
          { step: '01', title: 'Discovery & Strategy', desc: 'Deep dive into your vision, audience, and market. We define clear objectives and craft a strategic roadmap for success.' },
          { step: '02', title: 'Design & Prototyping', desc: 'High-fidelity designs and interactive prototypes. We iterate until every detail is perfect and aligned with your brand.' },
          { step: '03', title: 'Development & Testing', desc: 'Clean, performant code built with modern technologies. Rigorous testing ensures reliability across all devices and platforms.' },
          { step: '04', title: 'Launch & Optimize', desc: 'Smooth deployment with monitoring and analytics. We continuously optimize performance based on real user data.' },
        ].map((item, i) => anim(s('container', {}, { desktop: { display: 'flex', gap: '40px', marginBottom: '56px', paddingLeft: '0' }, mobile: { gap: '24px' } }, [
          s('container', {}, { desktop: { width: '48px', height: '48px', minWidth: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: '2', boxShadow: '0 0 24px rgba(99,102,241,0.3)' } }, [
            s('text', { text: item.step }, { desktop: { fontSize: '14px', fontWeight: '800', color: '#fff' } }),
          ]),
          s('container', {}, { desktop: { paddingTop: '8px' } }, [
            s('heading', { text: item.title, level: 'h3' }, { desktop: { fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
            s('text', { text: item.desc }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', maxWidth: '500px' } }),
          ]),
        ]), { ...FADE_UP, delay: i * 0.12 })),
      ]),
    ])],
  },

  // 7. FULL-WIDTH IMAGE DIVIDER
  {
    id: 'v5-image-divider', name: 'Cinematic Image Divider', category: 'Content' as SectionCategory,
    description: 'Full-bleed parallax image with overlaid text',
    elements: [s('section', {}, { desktop: { position: 'relative', height: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', width: '100%' } }, [
      s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 100%)' } }),
      anim(s('container', {}, { desktop: { position: 'relative', zIndex: '1', textAlign: 'center', maxWidth: '700px', padding: '0 40px' } }, [
        s('heading', { text: 'Innovation Starts Here', level: 'h2' }, { desktop: { fontSize: '56px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: '1.1' } }),
        s('text', { text: 'Pushing boundaries. Redefining possibilities.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.6)' } }),
      ]), BLUR_IN),
    ])],
  },

  // 8. METRIC DASHBOARD STATS
  {
    id: 'v5-metric-stats', name: 'Metric Dashboard Stats', category: 'Stats' as SectionCategory,
    description: 'Dashboard-style metrics with glassmorphic cards and gradients',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [
        ...[
          { value: '99.99%', label: 'Uptime SLA', icon: '🟢', accent: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.15)' },
          { value: '<50ms', label: 'Avg Response', icon: '⚡', accent: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.15)' },
          { value: '2M+', label: 'API Requests/Day', icon: '📊', accent: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.15)' },
          { value: '150+', label: 'Countries Served', icon: '🌍', accent: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.15)' },
        ].map((item, i) => anim(s('card', {}, { desktop: { padding: '36px', backgroundColor: item.accent, borderRadius: '16px', border: `1px solid ${item.border}`, textAlign: 'center' } }, [
          s('text', { text: item.icon }, { desktop: { fontSize: '28px', marginBottom: '16px' } }),
          s('heading', { text: item.value, level: 'h3' }, { desktop: { fontSize: '36px', fontWeight: '800', color: '#fff', marginBottom: '8px', letterSpacing: '-0.02em' } }),
          s('text', { text: item.label }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '500', letterSpacing: '0.02em' } }),
        ]), { ...FADE_UP, delay: i * 0.08 })),
      ]),
    ])],
  },

  // 9. TEAM GRID WITH HOVER
  {
    id: 'v5-team-grid', name: 'Premium Team Grid', category: 'Team' as SectionCategory,
    description: 'Elegant team grid with large photos and hover overlays',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto 64px' } }, [
        s('text', { text: 'THE TEAM' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
        s('heading', { text: 'Meet the Minds Behind It', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em' } }),
      ]), FADE_UP),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [
        ...[
          { name: 'Alex Rivera', role: 'CEO & Founder', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face' },
          { name: 'Sarah Chen', role: 'Head of Design', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face' },
          { name: 'James Okonkwo', role: 'Lead Engineer', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop&crop=face' },
          { name: 'Maria Santos', role: 'VP Operations', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face' },
        ].map((person, i) => anim(s('card', {}, { desktop: { borderRadius: '16px', overflow: 'hidden', position: 'relative' } }, [
          s('image', { src: person.img, alt: person.name }, { desktop: { width: '100%', height: '360px', objectFit: 'cover', display: 'block' } }),
          s('container', {}, { desktop: { padding: '20px' } }, [
            s('heading', { text: person.name, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
            s('text', { text: person.role }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)' } }),
          ]),
        ]), { ...FADE_UP, delay: i * 0.1 })),
      ]),
    ])],
  },

  // 10. MEGA FOOTER V2
  {
    id: 'v5-mega-footer', name: 'Premium Mega Footer', category: 'Footers' as SectionCategory,
    description: 'Full-featured footer with newsletter, links, and social icons',
    elements: [s('footer', {}, { desktop: { padding: '80px 60px 40px', backgroundColor: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.06)', width: '100%' }, mobile: { padding: '60px 24px 40px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px', maxWidth: '1200px', margin: '0 auto 64px' }, mobile: { gridTemplateColumns: '1fr' } }, [
        s('container', {}, { desktop: {} }, [
          s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '0.08em', marginBottom: '16px' } }),
          s('text', { text: 'Building the future of digital experiences. Premium tools for visionary teams.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7', marginBottom: '24px', maxWidth: '300px' } }),
          s('container', {}, { desktop: { display: 'flex', gap: '8px' } }, [
            s('input', { placeholder: 'Enter your email', inputType: 'email' }, { desktop: { padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', fontSize: '13px', color: '#fff', flex: '1' } }),
            s('button', { text: 'Subscribe', href: '#' }, { desktop: { padding: '12px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none' } }),
          ]),
        ]),
        ...[
          { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'API Docs'] },
          { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Partners'] },
          { title: 'Legal', links: ['Privacy', 'Terms', 'Cookie Policy', 'GDPR', 'Security'] },
        ].map(col => s('container', {}, { desktop: {} }, [
          s('heading', { text: col.title, level: 'h4' }, { desktop: { fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '20px', letterSpacing: '0.04em' } }),
          ...col.links.map(link => s('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: '12px', lineHeight: '1' } })),
        ])),
      ]),
      s('container', {}, { desktop: { borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }, mobile: { flexDirection: 'column', gap: '16px', textAlign: 'center' } }, [
        s('text', { text: '© 2026 Brand. All rights reserved.' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.2)' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '24px' } }, [
          ...['Twitter', 'LinkedIn', 'GitHub', 'YouTube'].map(social => s('link', { text: social, href: '#' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none' } })),
        ]),
      ]),
    ])],
  },

  // 11. FEATURE SHOWCASE SPLIT
  {
    id: 'v5-feature-showcase', name: 'Feature Showcase Split', category: 'Features' as SectionCategory,
    description: 'Alternating image-text feature sections with gradients',
    elements: [s('section', {}, { desktop: { backgroundColor: '#000', width: '100%' } }, [
      ...[
        { title: 'Intelligent Automation', desc: 'Set up workflows in minutes. Our AI engine learns your patterns and automates repetitive tasks, freeing your team to focus on what matters.', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', accent: 'rgba(99,102,241,0.08)' },
        { title: 'Real-Time Collaboration', desc: 'Work together seamlessly with live cursors, instant syncing, and threaded comments. No more version conflicts or miscommunication.', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop', accent: 'rgba(59,130,246,0.08)' },
      ].map((feature, i) => anim(s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '500px', backgroundColor: feature.accent }, mobile: { gridTemplateColumns: '1fr' } }, [
        s('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', order: i % 2 === 0 ? '0' : '1' }, mobile: { padding: '60px 24px', order: '0' } }, [
          s('text', { text: `0${i + 1}` }, { desktop: { fontSize: '64px', fontWeight: '800', color: 'rgba(255,255,255,0.04)', marginBottom: '12px', letterSpacing: '-0.04em' } }),
          s('heading', { text: feature.title, level: 'h3' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', marginBottom: '20px', letterSpacing: '-0.02em' } }),
          s('text', { text: feature.desc }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.8', maxWidth: '420px' } }),
        ]),
        s('container', {}, { desktop: { overflow: 'hidden', order: i % 2 === 0 ? '1' : '0' }, mobile: { order: '1', height: '300px' } }, [
          s('image', { src: feature.img, alt: feature.title }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
        ]),
      ]), { ...FADE_UP, delay: 0 })),
    ])],
  },

  // 12. NEWSLETTER CTA BANNER
  {
    id: 'v5-newsletter-banner', name: 'Newsletter CTA Banner', category: 'CTA' as SectionCategory,
    description: 'Eye-catching gradient newsletter signup section',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', background: 'linear-gradient(135deg, #0a0a0a 0%, #1e1b4b 50%, #0a0a0a 100%)', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { maxWidth: '640px', margin: '0 auto', textAlign: 'center' } }, [
        s('text', { text: '💌' }, { desktop: { fontSize: '40px', marginBottom: '24px' } }),
        s('heading', { text: 'Stay in the Loop', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' } }),
        s('text', { text: 'Get weekly insights, product updates, and exclusive content delivered to your inbox. No spam, unsubscribe anytime.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '36px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '10px', maxWidth: '480px', margin: '0 auto' }, mobile: { flexDirection: 'column' } }, [
          s('input', { placeholder: 'Enter your email address', inputType: 'email' }, { desktop: { padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', fontSize: '14px', color: '#fff', flex: '1' } }),
          s('button', { text: 'Subscribe', href: '#' }, { desktop: { padding: '16px 32px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: 'none', whiteSpace: 'nowrap' } }),
        ]),
      ]), BLUR_IN),
    ])],
  },

  // 13. LOGO CLOUD
  {
    id: 'v5-logo-cloud', name: 'Trusted By Logo Cloud', category: 'Logos' as SectionCategory,
    description: 'Minimal logo cloud with "trusted by" label',
    elements: [s('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', width: '100%' }, mobile: { padding: '48px 24px' } }, [
      anim(s('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', textAlign: 'center' } }, [
        s('text', { text: 'TRUSTED BY LEADING COMPANIES WORLDWIDE' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', marginBottom: '40px', fontWeight: '600' } }),
        s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '64px', flexWrap: 'wrap', alignItems: 'center' }, mobile: { gap: '32px' } }, [
          ...['Stripe', 'Notion', 'Linear', 'Figma', 'Vercel', 'Supabase'].map(name =>
            s('text', { text: name }, { desktop: { fontSize: '20px', fontWeight: '700', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.04em' } })
          ),
        ]),
      ]), FADE_UP),
    ])],
  },

  // 14. GRADIENT CTA SECTION
  {
    id: 'v5-gradient-cta', name: 'Gradient CTA Section', category: 'CTA' as SectionCategory,
    description: 'Bold gradient call-to-action with glowing button',
    elements: [s('section', {}, { desktop: { padding: '140px 60px', background: 'linear-gradient(135deg, #0a0a0a 0%, #1e1b4b 40%, #312e81 60%, #0a0a0a 100%)', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }, mobile: { padding: '80px 24px' } }, [
      s('container', {}, { desktop: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)', borderRadius: '50%' } }),
      anim(s('container', {}, { desktop: { position: 'relative', zIndex: '1', maxWidth: '640px', margin: '0 auto' } }, [
        s('heading', { text: 'Ready to Build\nSomething Amazing?', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '800', color: '#fff', letterSpacing: '-0.035em', marginBottom: '20px', lineHeight: '1.1' } }),
        s('text', { text: 'Join thousands of teams already using our platform to ship faster and build better.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '40px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '14px', justifyContent: 'center' } }, [
          s('button', { text: 'Get Started Free', href: '#' }, { desktop: { padding: '18px 44px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '15px', fontWeight: '600', border: 'none', boxShadow: '0 0 40px rgba(99,102,241,0.3)' } }),
          s('button', { text: 'Talk to Sales', href: '#' }, { desktop: { padding: '18px 44px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '10px', fontSize: '15px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)' } }),
        ]),
      ]), BLUR_IN),
    ])],
  },

  // 15. FAQ ACCORDION
  {
    id: 'v5-faq-accordion', name: 'FAQ Accordion — Premium', category: 'FAQ' as SectionCategory,
    description: 'Clean FAQ section with expandable items',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      anim(s('container', {}, { desktop: { maxWidth: '720px', margin: '0 auto' } }, [
        s('text', { text: 'FAQ' }, { desktop: { fontSize: '11px', color: 'rgba(99,102,241,0.8)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700', textAlign: 'center' } }),
        s('heading', { text: 'Frequently Asked Questions', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '56px', textAlign: 'center' } }),
        ...[
          { q: 'How does the free trial work?', a: 'Start your 14-day free trial with full access to all features. No credit card required. Cancel anytime during the trial and you won\'t be charged.' },
          { q: 'Can I change my plan later?', a: 'Absolutely. You can upgrade, downgrade, or cancel your plan at any time. Changes take effect at the start of your next billing cycle.' },
          { q: 'Is there a setup fee?', a: 'No setup fees, no hidden costs. You only pay for your chosen plan. Enterprise customers receive dedicated onboarding at no additional charge.' },
          { q: 'What kind of support do you offer?', a: 'All plans include email support. Pro plans get priority support with 4-hour response times. Enterprise plans include a dedicated account manager and 24/7 phone support.' },
          { q: 'Do you offer refunds?', a: 'Yes. If you\'re not satisfied within the first 30 days, we\'ll issue a full refund. No questions asked.' },
        ].map((item, i) => anim(s('container', {}, { desktop: { padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } }, [
          s('heading', { text: item.q, level: 'h4' }, { desktop: { fontSize: '17px', fontWeight: '600', color: '#fff', marginBottom: '12px', cursor: 'pointer' } }),
          s('text', { text: item.a }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
        ]), { ...FADE_UP, delay: i * 0.08 })),
      ]), FADE_UP),
    ])],
  },
];
