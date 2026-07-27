import { EditorElement } from '../types';
import { SectionBlock, SectionCategory } from './sectionBlocks';

let _sc8 = 0;
function sid(): string { _sc8++; return `sv8-${_sc8}-${Math.random().toString(36).slice(2, 7)}`; }
function s(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: sid(), type, name: name ?? type, props, styles, children };
}
function anim(el: EditorElement, a: EditorElement['animations']): EditorElement { return { ...el, animations: a }; }
function hover(el: EditorElement, h: EditorElement['hoverStyles']): EditorElement { return { ...el, hoverStyles: h }; }

const FU = (d = 0) => ({ type: 'fadeInUp' as const, duration: 0.8, delay: d, trigger: 'onView' as const, easing: 'cubic-bezier(0.16,1,0.3,1)' });
const SI = (d = 0) => ({ type: 'scaleIn' as const, duration: 1, delay: d, trigger: 'onView' as const });
const FL = (d = 0) => ({ type: 'fadeInLeft' as const, duration: 0.9, delay: d, trigger: 'onView' as const });
const FR = (d = 0) => ({ type: 'fadeInRight' as const, duration: 0.9, delay: d, trigger: 'onView' as const });

// ── Helpers ─────────────────────────────────────────
const pill = (text: string, bg = 'rgba(99,102,241,0.12)', fg = '#818cf8') =>
  s('text', { text }, { desktop: { display: 'inline-block', fontSize: '11px', letterSpacing: '0.2em', fontWeight: '700', color: fg, backgroundColor: bg, padding: '6px 20px', borderRadius: '100px', marginBottom: '24px', textTransform: 'uppercase' } });

const heading = (text: string, size = '48px', color = '#fff') =>
  s('heading', { text, level: 'h2' }, { desktop: { fontSize: size, fontWeight: '700', letterSpacing: '-0.03em', lineHeight: '1.1', color, marginBottom: '20px' }, mobile: { fontSize: `calc(${size} * 0.6)` } });

const body = (text: string, color = 'rgba(255,255,255,0.5)', maxW = '600px') =>
  s('text', { text }, { desktop: { fontSize: '17px', color, lineHeight: '1.75', maxWidth: maxW, marginBottom: '32px' } });

const cta = (text: string, bg = '#fff', fg = '#000') =>
  hover(s('button', { text, href: '#' }, { desktop: { padding: '16px 40px', backgroundColor: bg, color: fg, borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', letterSpacing: '0.02em' } }), { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' });

const ctaOutline = (text: string, borderColor = 'rgba(255,255,255,0.2)', fg = 'rgba(255,255,255,0.8)') =>
  hover(s('button', { text, href: '#' }, { desktop: { padding: '16px 40px', backgroundColor: 'transparent', color: fg, borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: `1px solid ${borderColor}` } }), { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.4)' });

const avatar = (initials: string, bg = '#334155') =>
  s('container', {}, { desktop: { width: '48px', height: '48px', borderRadius: '50%', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' } }, [
    s('text', { text: initials }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff' } }),
  ]);

const star = (filled = true) =>
  s('text', { text: '★' }, { desktop: { fontSize: '16px', color: filled ? '#fbbf24' : '#374151' } });

const stars = (count = 5) =>
  s('container', {}, { desktop: { display: 'flex', gap: '2px', marginBottom: '16px' } }, Array.from({ length: count }, (_, i) => star(true)));

const dividerLine = (color = 'rgba(255,255,255,0.06)') =>
  s('divider', {}, { desktop: { width: '100%', height: '1px', backgroundColor: color } });

// ══════════════════════════════════════════════════════════════════
//  V8 — 60+ Premium Sections
// ══════════════════════════════════════════════════════════════════

export const PREMIUM_SECTION_BLOCKS_V8: SectionBlock[] = [

  // ─── PRICING ────────────────────────────────────────

  {
    id: 'v8-pricing-gradient', name: '💎 Gradient Pricing 3-Col', category: 'Pricing' as SectionCategory,
    description: 'Three-tier pricing with gradient featured card',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      anim(pill('Pricing'), FU()),
      anim(heading('Simple, transparent pricing', '52px'), FU(0.1)),
      anim(body('No hidden fees. Cancel anytime. Start free and scale as you grow.'), FU(0.2)),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1100px', marginTop: '40px' }, mobile: { gridTemplateColumns: '1fr' } }, [
        // Starter
        anim(hover(s('container', {}, { desktop: { padding: '40px', borderRadius: '16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)' } }, [
          s('text', { text: 'Starter' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' } }),
          s('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' } }, [
            s('heading', { text: '$0', level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff' } }),
            s('text', { text: '/month' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)' } }),
          ]),
          s('text', { text: 'Perfect for side projects' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' } }),
          dividerLine(),
          s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px 0', marginBottom: '24px' } }, [
            s('text', { text: '✓  1 project' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' } }),
            s('text', { text: '✓  5GB storage' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' } }),
            s('text', { text: '✓  Community support' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' } }),
            s('text', { text: '✗  Custom domains' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.2)' } }),
          ]),
          ctaOutline('Get Started'),
        ]), { borderColor: 'rgba(255,255,255,0.15)', transform: 'translateY(-4px)' }), FU(0.3)),
        // Pro (featured)
        anim(hover(s('container', {}, { desktop: { padding: '40px', borderRadius: '16px', background: 'linear-gradient(180deg, #1a1040 0%, #0f0a2e 100%)', border: '1px solid rgba(99,102,241,0.3)', position: 'relative', overflow: 'hidden' } }, [
          s('text', { text: 'MOST POPULAR' }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#818cf8', letterSpacing: '0.15em', backgroundColor: 'rgba(99,102,241,0.15)', padding: '4px 12px', borderRadius: '100px', display: 'inline-block', marginBottom: '16px' } }),
          s('text', { text: 'Pro' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' } }),
          s('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' } }, [
            s('heading', { text: '$29', level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff' } }),
            s('text', { text: '/month' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)' } }),
          ]),
          s('text', { text: 'For growing teams & businesses' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' } }),
          dividerLine('rgba(99,102,241,0.2)'),
          s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px 0', marginBottom: '24px' } }, [
            s('text', { text: '✓  Unlimited projects' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.7)' } }),
            s('text', { text: '✓  100GB storage' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.7)' } }),
            s('text', { text: '✓  Priority support' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.7)' } }),
            s('text', { text: '✓  Custom domains' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.7)' } }),
            s('text', { text: '✓  Analytics dashboard' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.7)' } }),
          ]),
          cta('Start Free Trial', 'linear-gradient(135deg, #6366f1, #8b5cf6)', '#fff'),
        ]), { transform: 'translateY(-4px)', boxShadow: '0 0 40px rgba(99,102,241,0.15)' }), FU(0.4)),
        // Enterprise
        anim(hover(s('container', {}, { desktop: { padding: '40px', borderRadius: '16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)' } }, [
          s('text', { text: 'Enterprise' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' } }),
          s('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' } }, [
            s('heading', { text: '$99', level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff' } }),
            s('text', { text: '/month' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)' } }),
          ]),
          s('text', { text: 'For large organizations' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' } }),
          dividerLine(),
          s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '14px', padding: '24px 0', marginBottom: '24px' } }, [
            s('text', { text: '✓  Everything in Pro' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' } }),
            s('text', { text: '✓  Unlimited storage' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' } }),
            s('text', { text: '✓  24/7 phone support' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' } }),
            s('text', { text: '✓  SLA guarantee' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' } }),
            s('text', { text: '✓  SSO & SAML' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)' } }),
          ]),
          ctaOutline('Contact Sales'),
        ]), { borderColor: 'rgba(255,255,255,0.15)', transform: 'translateY(-4px)' }), FU(0.5)),
      ]),
    ]), FU())],
  },

  {
    id: 'v8-pricing-toggle', name: '🔄 Monthly/Annual Toggle Pricing', category: 'Pricing' as SectionCategory,
    description: 'Pricing with monthly/annual toggle and comparison',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#fff', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      anim(s('text', { text: 'PRICING' }, { desktop: { fontSize: '12px', letterSpacing: '0.2em', fontWeight: '700', color: '#6366f1', marginBottom: '16px', textTransform: 'uppercase', textAlign: 'center' } }), FU()),
      anim(heading('Choose your plan', '48px', '#111'), FU(0.1)),
      anim(body('Start free, upgrade when ready. All plans include a 14-day trial.', '#666', '500px'), FU(0.15)),
      // Toggle
      anim(s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', marginBottom: '60px', marginTop: '16px' } }, [
        s('text', { text: 'Monthly' }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#111' } }),
        s('container', {}, { desktop: { width: '44px', height: '24px', borderRadius: '12px', backgroundColor: '#6366f1', padding: '2px', cursor: 'pointer' } }, [
          s('container', {}, { desktop: { width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#fff', marginLeft: '20px', transition: 'margin 0.2s' } }),
        ]),
        s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          s('text', { text: 'Annual' }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#111' } }),
          s('text', { text: 'Save 20%' }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#059669', backgroundColor: '#d1fae5', padding: '2px 8px', borderRadius: '100px' } }),
        ]),
      ]), FU(0.2)),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0', maxWidth: '1000px', margin: '0 auto', border: '1px solid #e5e7eb', borderRadius: '16px', overflow: 'hidden' }, mobile: { gridTemplateColumns: '1fr' } }, [
        anim(s('container', {}, { desktop: { padding: '40px', borderRight: '1px solid #e5e7eb' } }, [
          s('text', { text: 'Basic' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#111', marginBottom: '8px' } }),
          s('text', { text: 'For individuals' }, { desktop: { fontSize: '14px', color: '#666', marginBottom: '24px' } }),
          s('heading', { text: '$9/mo', level: 'h3' }, { desktop: { fontSize: '36px', fontWeight: '800', color: '#111', marginBottom: '24px' } }),
          s('button', { text: 'Get Started', href: '#' }, { desktop: { width: '100%', padding: '12px', backgroundColor: '#f3f4f6', color: '#111', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', textAlign: 'center' } }),
          s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' } }, [
            s('text', { text: '✓  5 projects' }, { desktop: { fontSize: '14px', color: '#374151' } }),
            s('text', { text: '✓  10GB storage' }, { desktop: { fontSize: '14px', color: '#374151' } }),
            s('text', { text: '✓  Email support' }, { desktop: { fontSize: '14px', color: '#374151' } }),
          ]),
        ]), FU(0.3)),
        anim(s('container', {}, { desktop: { padding: '40px', backgroundColor: '#faf5ff', borderRight: '1px solid #e5e7eb' } }, [
          s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' } }, [
            s('text', { text: 'Pro' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#111' } }),
            s('text', { text: 'Popular' }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#7c3aed', backgroundColor: '#ede9fe', padding: '2px 10px', borderRadius: '100px' } }),
          ]),
          s('text', { text: 'For small teams' }, { desktop: { fontSize: '14px', color: '#666', marginBottom: '24px' } }),
          s('heading', { text: '$29/mo', level: 'h3' }, { desktop: { fontSize: '36px', fontWeight: '800', color: '#111', marginBottom: '24px' } }),
          s('button', { text: 'Start Free Trial', href: '#' }, { desktop: { width: '100%', padding: '12px', backgroundColor: '#7c3aed', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', textAlign: 'center' } }),
          s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' } }, [
            s('text', { text: '✓  Unlimited projects' }, { desktop: { fontSize: '14px', color: '#374151' } }),
            s('text', { text: '✓  100GB storage' }, { desktop: { fontSize: '14px', color: '#374151' } }),
            s('text', { text: '✓  Priority support' }, { desktop: { fontSize: '14px', color: '#374151' } }),
            s('text', { text: '✓  Custom domains' }, { desktop: { fontSize: '14px', color: '#374151' } }),
          ]),
        ]), FU(0.4)),
        anim(s('container', {}, { desktop: { padding: '40px' } }, [
          s('text', { text: 'Enterprise' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#111', marginBottom: '8px' } }),
          s('text', { text: 'For organizations' }, { desktop: { fontSize: '14px', color: '#666', marginBottom: '24px' } }),
          s('heading', { text: 'Custom', level: 'h3' }, { desktop: { fontSize: '36px', fontWeight: '800', color: '#111', marginBottom: '24px' } }),
          s('button', { text: 'Contact Sales', href: '#' }, { desktop: { width: '100%', padding: '12px', backgroundColor: '#f3f4f6', color: '#111', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', textAlign: 'center' } }),
          s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' } }, [
            s('text', { text: '✓  Everything in Pro' }, { desktop: { fontSize: '14px', color: '#374151' } }),
            s('text', { text: '✓  Unlimited storage' }, { desktop: { fontSize: '14px', color: '#374151' } }),
            s('text', { text: '✓  24/7 support' }, { desktop: { fontSize: '14px', color: '#374151' } }),
            s('text', { text: '✓  SSO & audit logs' }, { desktop: { fontSize: '14px', color: '#374151' } }),
          ]),
        ]), FU(0.5)),
      ]),
    ]), FU())],
  },

  // ─── TESTIMONIALS ──────────────────────────────────

  {
    id: 'v8-testimonials-cards', name: '⭐ Testimonial Cards Grid', category: 'Testimonials' as SectionCategory,
    description: 'Three testimonial cards with stars and avatars',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      anim(pill('Testimonials'), FU()),
      anim(heading('Loved by thousands', '48px'), FU(0.1)),
      anim(body('See what our customers are saying about their experience.'), FU(0.2)),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1100px', marginTop: '48px' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...[
          { quote: 'This platform has completely transformed how we build websites. The speed and quality are unmatched.', name: 'Sarah Chen', role: 'CEO, TechFlow', initials: 'SC' },
          { quote: 'We switched from Webflow and haven\'t looked back. The AI features alone save us 20 hours per week.', name: 'Marcus Rivera', role: 'Design Lead, Pixel', initials: 'MR' },
          { quote: 'The template library is incredible. Every design feels premium and the animations are buttery smooth.', name: 'Emma Watson', role: 'Founder, Studio X', initials: 'EW' },
        ].map((t, i) =>
          anim(hover(s('container', {}, { desktop: { padding: '36px', borderRadius: '16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)' } }, [
            stars(5),
            s('text', { text: `"${t.quote}"` }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginBottom: '28px', fontStyle: 'italic' } }),
            s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
              avatar(t.initials, ['#4f46e5', '#7c3aed', '#ec4899'][i]),
              s('container', {}, { desktop: {} }, [
                s('text', { text: t.name }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#fff' } }),
                s('text', { text: t.role }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.35)' } }),
              ]),
            ]),
          ]), { transform: 'translateY(-4px)', borderColor: 'rgba(255,255,255,0.12)' }), FU(0.3 + i * 0.1))
        ),
      ]),
    ]), FU())],
  },

  {
    id: 'v8-testimonial-large', name: '🗣️ Large Featured Testimonial', category: 'Testimonials' as SectionCategory,
    description: 'Single large testimonial with oversized quote',
    elements: [anim(s('section', {}, { desktop: { padding: '140px 80px', backgroundColor: '#f8f9fa', width: '100%', textAlign: 'center' }, mobile: { padding: '60px 20px' } }, [
      anim(s('text', { text: '❝' }, { desktop: { fontSize: '80px', color: '#e5e7eb', lineHeight: '1', marginBottom: '0' } }), SI()),
      anim(s('text', { text: 'The best investment we made this year. Our conversion rate increased by 340% within 3 months of switching.' }, { desktop: { fontSize: '28px', fontWeight: '500', color: '#111', lineHeight: '1.5', maxWidth: '800px', margin: '0 auto 40px', letterSpacing: '-0.01em' } }), FU(0.2)),
      anim(s('container', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' } }, [
        avatar('JD', '#1e293b'),
        s('container', {}, { desktop: { textAlign: 'left' } }, [
          s('text', { text: 'James Davidson' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#111' } }),
          s('text', { text: 'VP of Engineering, Scale AI' }, { desktop: { fontSize: '13px', color: '#666' } }),
        ]),
      ]), FU(0.3)),
    ]), FU())],
  },

  {
    id: 'v8-testimonials-marquee', name: '🎠 Testimonial Marquee', category: 'Testimonials' as SectionCategory,
    description: 'Scrolling testimonial cards in two rows',
    elements: [anim(s('section', {}, { desktop: { padding: '100px 0', backgroundColor: '#0a0a0a', width: '100%', overflow: 'hidden' }, mobile: { padding: '60px 0' } }, [
      s('container', {}, { desktop: { textAlign: 'center', paddingLeft: '60px', paddingRight: '60px', marginBottom: '60px' } }, [
        anim(pill('Wall of Love'), FU()),
        anim(heading('What people are saying', '44px'), FU(0.1)),
      ]),
      // Row 1
      s('container', {}, { desktop: { display: 'flex', gap: '20px', paddingBottom: '20px' } }, [
        ...[
          { q: 'Game-changer for our workflow. Saved us weeks of development time.', n: 'Alex Kim', r: 'CTO, Startup' },
          { q: 'The design quality is on another level. Our clients are amazed.', n: 'Lisa Park', r: 'Creative Director' },
          { q: 'Best tool I\'ve used in 15 years of web development.', n: 'Tom Wright', r: 'Lead Developer' },
          { q: 'Intuitive, powerful, and beautifully designed. 10/10.', n: 'Maya Singh', r: 'UX Designer' },
        ].map((t, i) =>
          anim(s('container', {}, { desktop: { padding: '28px', borderRadius: '12px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)', minWidth: '320px', flexShrink: '0' } }, [
            stars(5),
            s('text', { text: `"${t.q}"` }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.7', marginBottom: '20px' } }),
            s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '10px' } }, [
              avatar(t.n[0], '#334155'),
              s('container', {}, { desktop: {} }, [
                s('text', { text: t.n }, { desktop: { fontSize: '13px', fontWeight: '600', color: '#fff' } }),
                s('text', { text: t.r }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)' } }),
              ]),
            ]),
          ]), FU(0.2 + i * 0.1))
        ),
      ]),
    ]), FU())],
  },

  // ─── TEAM ──────────────────────────────────────────

  {
    id: 'v8-team-grid', name: '👥 Team Grid with Hover', category: 'Team' as SectionCategory,
    description: 'Team members in a grid with social links on hover',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      anim(pill('Our Team'), FU()),
      anim(heading('Meet the people behind the product', '44px'), FU(0.1)),
      anim(body('A diverse team of designers, engineers, and dreamers building the future.'), FU(0.2)),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '1100px', marginTop: '48px' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)' } }, [
        ...[
          { name: 'Alex Morgan', role: 'CEO & Founder', initials: 'AM', bg: '#4f46e5' },
          { name: 'Jordan Lee', role: 'CTO', initials: 'JL', bg: '#7c3aed' },
          { name: 'Sam Chen', role: 'Head of Design', initials: 'SC', bg: '#ec4899' },
          { name: 'Riley Park', role: 'Lead Engineer', initials: 'RP', bg: '#0ea5e9' },
        ].map((m, i) =>
          anim(hover(s('container', {}, { desktop: { borderRadius: '16px', overflow: 'hidden', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } }, [
            s('container', {}, { desktop: { width: '100%', height: '200px', backgroundColor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
              s('text', { text: m.initials }, { desktop: { fontSize: '48px', fontWeight: '800', color: 'rgba(255,255,255,0.3)' } }),
            ]),
            s('container', {}, { desktop: { padding: '24px' } }, [
              s('text', { text: m.name }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
              s('text', { text: m.role }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }),
            ]),
          ]), { transform: 'translateY(-4px)', borderColor: 'rgba(255,255,255,0.12)' }), FU(0.3 + i * 0.1))
        ),
      ]),
    ]), FU())],
  },

  {
    id: 'v8-team-minimal', name: '👤 Minimal Team List', category: 'Team' as SectionCategory,
    description: 'Clean horizontal team list with roles',
    elements: [anim(s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#fff', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      anim(s('text', { text: 'THE TEAM' }, { desktop: { fontSize: '12px', letterSpacing: '0.2em', fontWeight: '700', color: '#6366f1', marginBottom: '16px', textTransform: 'uppercase' } }), FU()),
      anim(heading('People who make it happen', '40px', '#111'), FU(0.1)),
      s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '0', maxWidth: '800px', marginTop: '48px' } }, [
        ...[
          { name: 'Katherine Wells', role: 'Chief Executive Officer' },
          { name: 'David Nakamura', role: 'Chief Technology Officer' },
          { name: 'Priya Sharma', role: 'VP of Design' },
          { name: 'Carlos Rodriguez', role: 'VP of Engineering' },
          { name: 'Nina Petrov', role: 'Head of Product' },
        ].map((m, i) =>
          anim(hover(s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', borderBottom: '1px solid #e5e7eb' } }, [
            s('text', { text: m.name }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#111' } }),
            s('text', { text: m.role }, { desktop: { fontSize: '14px', color: '#666' } }),
          ]), { backgroundColor: '#f9fafb', paddingLeft: '16px', paddingRight: '16px', borderRadius: '8px' }), FU(0.2 + i * 0.08))
        ),
      ]),
    ]), FU())],
  },

  // ─── ABOUT ─────────────────────────────────────────

  {
    id: 'v8-about-split', name: '📖 About Split Layout', category: 'About' as SectionCategory,
    description: 'Company about with stats and mission',
    elements: [anim(s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', minHeight: '80vh', backgroundColor: '#000', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } }, [
      anim(s('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } }, [
        pill('About Us'),
        heading('Building the future of digital experiences', '42px'),
        body('Founded in 2020, we\'ve grown from a small team of 3 to a global company serving over 50,000 businesses worldwide. Our mission is to democratize great design.'),
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px', marginTop: '20px' } }, [
          s('container', {}, { desktop: {} }, [
            s('heading', { text: '50K+', level: 'h3' }, { desktop: { fontSize: '36px', fontWeight: '800', color: '#fff' } }),
            s('text', { text: 'Active users' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }),
          ]),
          s('container', {}, { desktop: {} }, [
            s('heading', { text: '120+', level: 'h3' }, { desktop: { fontSize: '36px', fontWeight: '800', color: '#fff' } }),
            s('text', { text: 'Countries' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }),
          ]),
          s('container', {}, { desktop: {} }, [
            s('heading', { text: '99.9%', level: 'h3' }, { desktop: { fontSize: '36px', fontWeight: '800', color: '#fff' } }),
            s('text', { text: 'Uptime' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }),
          ]),
        ]),
      ]), FL()),
      anim(s('container', {}, { desktop: { backgroundColor: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' } }, [
        s('container', {}, { desktop: { width: '100%', height: '100%', minHeight: '400px', borderRadius: '24px', background: 'linear-gradient(135deg, #1e1b4b, #312e81, #4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
          s('text', { text: '✦' }, { desktop: { fontSize: '80px', color: 'rgba(255,255,255,0.15)' } }),
        ]),
      ]), FR()),
    ]), FU())],
  },

  // ─── STATS ─────────────────────────────────────────

  {
    id: 'v8-stats-counters', name: '📊 Stats Counter Row', category: 'Stats' as SectionCategory,
    description: 'Large number counters with descriptions',
    elements: [anim(s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' } }, [
        ...[
          { num: '10M+', label: 'Active Users', desc: 'Across 120+ countries' },
          { num: '99.9%', label: 'Uptime', desc: 'Enterprise-grade reliability' },
          { num: '500K', label: 'Sites Built', desc: 'And counting every day' },
          { num: '4.9/5', label: 'Rating', desc: 'From 12,000+ reviews' },
        ].map((stat, i) =>
          anim(s('container', {}, { desktop: { padding: '24px' } }, [
            s('heading', { text: stat.num, level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px', background: 'linear-gradient(135deg, #fff, rgba(255,255,255,0.5))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' } as any }),
            s('text', { text: stat.label }, { desktop: { fontSize: '15px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', marginBottom: '4px' } }),
            s('text', { text: stat.desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)' } }),
          ]), FU(0.2 + i * 0.1))
        ),
      ]),
    ]), FU())],
  },

  {
    id: 'v8-stats-cards', name: '📈 Stats Cards Dark', category: 'Stats' as SectionCategory,
    description: 'Stats in individual dark cards with icons',
    elements: [anim(s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)' } }, [
        ...[
          { num: '2.5M', label: 'Downloads', icon: '↓', accent: '#6366f1' },
          { num: '180+', label: 'Integrations', icon: '⚡', accent: '#ec4899' },
          { num: '24/7', label: 'Support', icon: '💬', accent: '#10b981' },
          { num: '$0', label: 'Starting Price', icon: '✨', accent: '#f59e0b' },
        ].map((stat, i) =>
          anim(hover(s('container', {}, { desktop: { padding: '32px', borderRadius: '16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)' } }, [
            s('container', {}, { desktop: { width: '40px', height: '40px', borderRadius: '10px', backgroundColor: `${stat.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' } }, [
              s('text', { text: stat.icon }, { desktop: { fontSize: '18px' } }),
            ]),
            s('heading', { text: stat.num, level: 'h3' }, { desktop: { fontSize: '32px', fontWeight: '800', color: '#fff', marginBottom: '4px' } }),
            s('text', { text: stat.label }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)' } }),
          ]), { borderColor: `${stat.accent}30`, transform: 'translateY(-2px)' }), FU(0.2 + i * 0.1))
        ),
      ]),
    ]), FU())],
  },

  // ─── CTA ───────────────────────────────────────────

  {
    id: 'v8-cta-gradient', name: '🎯 Gradient CTA Banner', category: 'CTA' as SectionCategory,
    description: 'Full-width CTA with vibrant gradient background',
    elements: [anim(s('section', {}, { desktop: { padding: '100px 60px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }, mobile: { padding: '60px 20px' } }, [
      s('container', {}, { desktop: { position: 'absolute', inset: '0', backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)', pointerEvents: 'none' } }),
      anim(heading('Ready to get started?', '52px'), FU()),
      anim(body('Join 50,000+ teams already using our platform. Start free, no credit card required.', 'rgba(255,255,255,0.7)', '550px'), FU(0.1)),
      anim(s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '8px' } }, [
        cta('Start Free Trial', '#fff', '#111'),
        ctaOutline('Talk to Sales', 'rgba(255,255,255,0.3)', '#fff'),
      ]), FU(0.2)),
    ]), FU())],
  },

  {
    id: 'v8-cta-minimal', name: '🎯 Minimal CTA Dark', category: 'CTA' as SectionCategory,
    description: 'Simple dark CTA with single action',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%', textAlign: 'center' }, mobile: { padding: '60px 20px' } }, [
      anim(heading('Start building today', '56px'), FU()),
      anim(body('Free forever for individuals. No credit card required.', 'rgba(255,255,255,0.4)', '450px'), FU(0.1)),
      anim(s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '12px' } }, [
        cta('Get Started — It\'s Free', '#fff', '#000'),
      ]), FU(0.2)),
      anim(s('text', { text: '✓ No credit card  ✓ Free forever  ✓ Cancel anytime' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.25)', marginTop: '24px' } }), FU(0.3)),
    ]), FU())],
  },

  // ─── FAQ ───────────────────────────────────────────

  {
    id: 'v8-faq-clean', name: '❓ FAQ Clean Accordion', category: 'FAQ' as SectionCategory,
    description: 'Clean FAQ section with expandable answers',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      anim(pill('FAQ'), FU()),
      anim(heading('Frequently asked questions', '44px'), FU(0.1)),
      anim(body('Everything you need to know about our platform.'), FU(0.2)),
      s('container', {}, { desktop: { maxWidth: '720px', marginTop: '48px', display: 'flex', flexDirection: 'column', gap: '0' } }, [
        ...[
          { q: 'Is there a free trial?', a: 'Yes! All plans come with a 14-day free trial. No credit card required to get started.' },
          { q: 'Can I cancel anytime?', a: 'Absolutely. You can cancel your subscription at any time from your account settings. No questions asked.' },
          { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.' },
          { q: 'Do you offer custom enterprise plans?', a: 'Yes, we offer custom plans for large organizations. Contact our sales team for a personalized quote.' },
          { q: 'Is my data secure?', a: 'Security is our top priority. We use bank-grade encryption and are SOC 2 Type II certified.' },
        ].map((faq, i) =>
          anim(hover(s('container', {}, { desktop: { padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } }, [
            s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' } }, [
              s('text', { text: faq.q }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#fff' } }),
              s('text', { text: '+' }, { desktop: { fontSize: '20px', color: 'rgba(255,255,255,0.3)', fontWeight: '300' } }),
            ]),
            s('text', { text: faq.a }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginTop: '12px', paddingRight: '40px' } }),
          ]), { backgroundColor: 'rgba(255,255,255,0.02)', paddingLeft: '16px', paddingRight: '16px', borderRadius: '8px' }), FU(0.3 + i * 0.08))
        ),
      ]),
    ]), FU())],
  },

  {
    id: 'v8-faq-two-col', name: '❓ FAQ Two Column', category: 'FAQ' as SectionCategory,
    description: 'FAQ split into two columns for better scanning',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#fff', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      s('container', {}, { desktop: { textAlign: 'center', marginBottom: '60px' } }, [
        anim(s('text', { text: 'FAQ' }, { desktop: { fontSize: '12px', letterSpacing: '0.2em', fontWeight: '700', color: '#6366f1', marginBottom: '16px', textTransform: 'uppercase' } }), FU()),
        anim(heading('Common questions', '44px', '#111'), FU(0.1)),
      ]),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px 60px', maxWidth: '1000px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...[
          { q: 'How does billing work?', a: 'We bill monthly or annually depending on your plan. All charges appear on your payment method on file.' },
          { q: 'Can I switch plans?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect on your next billing cycle.' },
          { q: 'What\'s your refund policy?', a: 'We offer a 30-day money-back guarantee on all plans. No questions asked.' },
          { q: 'Do you offer student discounts?', a: 'Yes! Students get 50% off all plans. Verify your student status to claim the discount.' },
          { q: 'Is there an API?', a: 'Yes, we provide a comprehensive REST API and webhooks for all paid plans.' },
          { q: 'How do I get support?', a: 'Free plans get community support. Paid plans include email and live chat support.' },
        ].map((faq, i) =>
          anim(s('container', {}, { desktop: {} }, [
            s('text', { text: faq.q }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#111', marginBottom: '8px' } }),
            s('text', { text: faq.a }, { desktop: { fontSize: '14px', color: '#666', lineHeight: '1.7' } }),
          ]), FU(0.2 + i * 0.08))
        ),
      ]),
    ]), FU())],
  },

  // ─── FEATURES ──────────────────────────────────────

  {
    id: 'v8-features-bento', name: '🧩 Bento Grid Features', category: 'Features' as SectionCategory,
    description: 'Bento-style grid with mixed card sizes',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      anim(pill('Features'), FU()),
      anim(heading('Everything you need', '48px'), FU(0.1)),
      anim(body('A complete toolkit for building, deploying, and scaling modern websites.'), FU(0.2)),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'auto auto', gap: '16px', maxWidth: '1100px', marginTop: '48px' }, mobile: { gridTemplateColumns: '1fr' } }, [
        // Large card spans 2 cols
        anim(hover(s('container', {}, { desktop: { padding: '40px', borderRadius: '16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)', gridColumn: 'span 2', minHeight: '240px' } }, [
          s('text', { text: '⚡' }, { desktop: { fontSize: '32px', marginBottom: '20px' } }),
          s('heading', { text: 'Lightning Fast Performance', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
          s('text', { text: 'Built on cutting-edge infrastructure with global CDN. Average load time under 100ms for a seamless user experience.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', maxWidth: '500px' } }),
        ]), { borderColor: 'rgba(255,255,255,0.12)' }), FU(0.3)),
        // Regular card
        anim(hover(s('container', {}, { desktop: { padding: '40px', borderRadius: '16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)', minHeight: '240px' } }, [
          s('text', { text: '🎨' }, { desktop: { fontSize: '32px', marginBottom: '20px' } }),
          s('heading', { text: 'Design System', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
          s('text', { text: 'Consistent, beautiful components with design tokens.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
        ]), { borderColor: 'rgba(255,255,255,0.12)' }), FU(0.4)),
        // Regular card
        anim(hover(s('container', {}, { desktop: { padding: '40px', borderRadius: '16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)', minHeight: '240px' } }, [
          s('text', { text: '🔒' }, { desktop: { fontSize: '32px', marginBottom: '20px' } }),
          s('heading', { text: 'Enterprise Security', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
          s('text', { text: 'SOC 2, GDPR compliant. End-to-end encryption.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
        ]), { borderColor: 'rgba(255,255,255,0.12)' }), FU(0.5)),
        // Large card spans 2 cols
        anim(hover(s('container', {}, { desktop: { padding: '40px', borderRadius: '16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)', gridColumn: 'span 2', minHeight: '240px' } }, [
          s('text', { text: '🤖' }, { desktop: { fontSize: '32px', marginBottom: '20px' } }),
          s('heading', { text: 'AI-Powered Workflows', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
          s('text', { text: 'Let AI handle the repetitive tasks. Smart suggestions, auto-layouts, and intelligent content generation at your fingertips.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', maxWidth: '500px' } }),
        ]), { borderColor: 'rgba(255,255,255,0.12)' }), FU(0.6)),
      ]),
    ]), FU())],
  },

  {
    id: 'v8-features-icon-grid', name: '🔷 Icon Feature Grid 6-up', category: 'Features' as SectionCategory,
    description: 'Clean 3x2 feature grid with icons',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#fff', width: '100%', textAlign: 'center' }, mobile: { padding: '60px 20px' } }, [
      anim(s('text', { text: 'FEATURES' }, { desktop: { fontSize: '12px', letterSpacing: '0.2em', fontWeight: '700', color: '#6366f1', marginBottom: '16px', textTransform: 'uppercase' } }), FU()),
      anim(heading('Why teams choose us', '44px', '#111'), FU(0.1)),
      anim(body('Powerful features designed for modern teams who ship fast.', '#666'), FU(0.2)),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '48px 40px', maxWidth: '1000px', margin: '48px auto 0', textAlign: 'left' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...[
          { icon: '🚀', title: 'Ship Faster', desc: 'Deploy in seconds with zero-config builds and instant rollbacks.' },
          { icon: '🔗', title: 'Integrations', desc: 'Connect with 200+ tools including Slack, GitHub, and Figma.' },
          { icon: '📊', title: 'Analytics', desc: 'Real-time insights with custom dashboards and reports.' },
          { icon: '🛡️', title: 'Security', desc: 'Bank-grade encryption with automatic backups.' },
          { icon: '🌍', title: 'Global CDN', desc: 'Content delivered from 200+ edge locations worldwide.' },
          { icon: '🎯', title: 'A/B Testing', desc: 'Built-in experimentation tools to optimize conversions.' },
        ].map((f, i) =>
          anim(s('container', {}, { desktop: {} }, [
            s('container', {}, { desktop: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' } }, [
              s('text', { text: f.icon }, { desktop: { fontSize: '22px' } }),
            ]),
            s('text', { text: f.title }, { desktop: { fontSize: '17px', fontWeight: '700', color: '#111', marginBottom: '8px' } }),
            s('text', { text: f.desc }, { desktop: { fontSize: '14px', color: '#666', lineHeight: '1.7' } }),
          ]), FU(0.3 + i * 0.08))
        ),
      ]),
    ]), FU())],
  },

  // ─── LOGOS ─────────────────────────────────────────

  {
    id: 'v8-logos-strip', name: '🏢 Logo Strip Minimal', category: 'Logos' as SectionCategory,
    description: 'Clean logo strip with trust message',
    elements: [anim(s('section', {}, { desktop: { padding: '60px', backgroundColor: '#0a0a0a', width: '100%', textAlign: 'center' }, mobile: { padding: '40px 20px' } }, [
      anim(s('text', { text: 'Trusted by 10,000+ companies worldwide' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: '600', marginBottom: '36px' } }), FU()),
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '60px', flexWrap: 'wrap', opacity: '0.3' } }, [
        ...['GOOGLE', 'STRIPE', 'NOTION', 'FIGMA', 'LINEAR', 'VERCEL'].map(name =>
          anim(s('text', { text: name }, { desktop: { fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '0.15em' } }), FU(0.1))
        ),
      ]),
    ]), FU())],
  },

  // ─── CONTACT ───────────────────────────────────────

  {
    id: 'v8-contact-split', name: '📬 Contact Split Form', category: 'Contact' as SectionCategory,
    description: 'Contact section with form and info',
    elements: [anim(s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', backgroundColor: '#0a0a0a', width: '100%', minHeight: '80vh' }, mobile: { gridTemplateColumns: '1fr' } }, [
      anim(s('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } }, [
        pill('Contact'),
        heading('Let\'s build something great together', '40px'),
        body('Have a project in mind? We\'d love to hear about it. Drop us a line and we\'ll get back to you within 24 hours.'),
        s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '16px' } }, [
          s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
            s('text', { text: '📧' }, { desktop: { fontSize: '18px' } }),
            s('text', { text: 'hello@company.com' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.6)' } }),
          ]),
          s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
            s('text', { text: '📍' }, { desktop: { fontSize: '18px' } }),
            s('text', { text: 'San Francisco, CA' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.6)' } }),
          ]),
          s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '12px' } }, [
            s('text', { text: '📞' }, { desktop: { fontSize: '18px' } }),
            s('text', { text: '+1 (555) 000-0000' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.6)' } }),
          ]),
        ]),
      ]), FL()),
      anim(s('container', {}, { desktop: { padding: '80px 60px', backgroundColor: '#111', display: 'flex', flexDirection: 'column', justifyContent: 'center' } }, [
        s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' } }, [
            s('input', { placeholder: 'First name', inputType: 'text' }, { desktop: { width: '100%', padding: '14px 16px', backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '14px' } }),
            s('input', { placeholder: 'Last name', inputType: 'text' }, { desktop: { width: '100%', padding: '14px 16px', backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '14px' } }),
          ]),
          s('input', { placeholder: 'Email address', inputType: 'email' }, { desktop: { width: '100%', padding: '14px 16px', backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '14px' } }),
          s('textarea', { placeholder: 'Tell us about your project...' }, { desktop: { width: '100%', padding: '14px 16px', backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '14px', minHeight: '140px', resize: 'vertical' } }),
          cta('Send Message', '#fff', '#000'),
        ]),
      ]), FR()),
    ]), FU())],
  },

  // ─── BLOG ──────────────────────────────────────────

  {
    id: 'v8-blog-cards', name: '📝 Blog Card Grid', category: 'Blog' as SectionCategory,
    description: 'Blog post cards in a 3-column grid',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      anim(s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' } }, [
        s('container', {}, { desktop: {} }, [
          pill('Blog'),
          heading('Latest articles', '40px'),
        ]),
        ctaOutline('View All Posts →'),
      ]), FU()),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1100px' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...[
          { title: 'The Future of Web Design in 2026', date: 'Mar 15, 2026', tag: 'Design', color: '#6366f1', read: '5 min read' },
          { title: 'How AI is Reshaping the Creative Process', date: 'Mar 10, 2026', tag: 'AI', color: '#ec4899', read: '8 min read' },
          { title: 'Building Performant Websites at Scale', date: 'Mar 5, 2026', tag: 'Engineering', color: '#10b981', read: '6 min read' },
        ].map((post, i) =>
          anim(hover(s('container', {}, { desktop: { borderRadius: '16px', overflow: 'hidden', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)' } }, [
            s('container', {}, { desktop: { width: '100%', height: '200px', background: `linear-gradient(135deg, ${post.color}20, ${post.color}05)`, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
              s('text', { text: '📄' }, { desktop: { fontSize: '48px', opacity: '0.3' } }),
            ]),
            s('container', {}, { desktop: { padding: '24px' } }, [
              s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' } }, [
                s('text', { text: post.tag }, { desktop: { fontSize: '11px', fontWeight: '700', color: post.color, backgroundColor: `${post.color}15`, padding: '3px 10px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.08em' } }),
                s('text', { text: post.read }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' } }),
              ]),
              s('heading', { text: post.title, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', lineHeight: '1.4', marginBottom: '8px' } }),
              s('text', { text: post.date }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)' } }),
            ]),
          ]), { transform: 'translateY(-4px)', borderColor: 'rgba(255,255,255,0.12)' }), FU(0.3 + i * 0.1))
        ),
      ]),
    ]), FU())],
  },

  // ─── COMPARISON ────────────────────────────────────

  {
    id: 'v8-comparison-table', name: '⚖️ Feature Comparison Table', category: 'Comparison' as SectionCategory,
    description: 'Side-by-side plan comparison table',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#fff', width: '100%', textAlign: 'center' }, mobile: { padding: '60px 20px' } }, [
      anim(heading('Compare plans', '44px', '#111'), FU()),
      anim(body('Find the perfect plan for your needs.', '#666', '500px'), FU(0.1)),
      s('container', {}, { desktop: { maxWidth: '900px', margin: '48px auto 0', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb' } }, [
        // Header row
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '200px 1fr 1fr 1fr', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' } }, [
          s('container', {}, { desktop: { padding: '20px 24px' } }),
          s('container', {}, { desktop: { padding: '20px 24px', textAlign: 'center' } }, [
            s('text', { text: 'Starter' }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#111' } }),
          ]),
          s('container', {}, { desktop: { padding: '20px 24px', textAlign: 'center', backgroundColor: '#ede9fe' } }, [
            s('text', { text: 'Pro' }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#7c3aed' } }),
          ]),
          s('container', {}, { desktop: { padding: '20px 24px', textAlign: 'center' } }, [
            s('text', { text: 'Enterprise' }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#111' } }),
          ]),
        ]),
        // Feature rows
        ...[
          { feature: 'Projects', s: '3', p: 'Unlimited', e: 'Unlimited' },
          { feature: 'Storage', s: '5GB', p: '100GB', e: 'Unlimited' },
          { feature: 'Custom domains', s: '✗', p: '✓', e: '✓' },
          { feature: 'Analytics', s: 'Basic', p: 'Advanced', e: 'Enterprise' },
          { feature: 'Support', s: 'Email', p: 'Priority', e: '24/7 Phone' },
          { feature: 'SSO/SAML', s: '✗', p: '✗', e: '✓' },
        ].map((row, i) =>
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '200px 1fr 1fr 1fr', borderBottom: i < 5 ? '1px solid #f3f4f6' : 'none' } }, [
            s('container', {}, { desktop: { padding: '14px 24px' } }, [
              s('text', { text: row.feature }, { desktop: { fontSize: '14px', fontWeight: '500', color: '#374151' } }),
            ]),
            s('container', {}, { desktop: { padding: '14px 24px', textAlign: 'center' } }, [
              s('text', { text: row.s }, { desktop: { fontSize: '14px', color: row.s === '✗' ? '#d1d5db' : '#374151' } }),
            ]),
            s('container', {}, { desktop: { padding: '14px 24px', textAlign: 'center', backgroundColor: '#faf5ff' } }, [
              s('text', { text: row.p }, { desktop: { fontSize: '14px', color: row.p === '✗' ? '#d1d5db' : '#374151', fontWeight: '500' } }),
            ]),
            s('container', {}, { desktop: { padding: '14px 24px', textAlign: 'center' } }, [
              s('text', { text: row.e }, { desktop: { fontSize: '14px', color: row.e === '✗' ? '#d1d5db' : '#374151' } }),
            ]),
          ])
        ),
      ]),
    ]), FU())],
  },

  // ─── GALLERY ───────────────────────────────────────

  {
    id: 'v8-gallery-masonry', name: '🖼️ Masonry Gallery', category: 'Gallery' as SectionCategory,
    description: 'Masonry-style image gallery grid',
    elements: [anim(s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      anim(pill('Gallery'), FU()),
      anim(heading('Our work speaks for itself', '44px'), FU(0.1)),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '1100px', marginTop: '48px' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)' } }, [
        ...[
          { h: '280px', bg: 'linear-gradient(135deg, #4f46e5, #7c3aed)' },
          { h: '200px', bg: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
          { h: '320px', bg: 'linear-gradient(135deg, #10b981, #059669)' },
          { h: '320px', bg: 'linear-gradient(135deg, #f59e0b, #d97706)' },
          { h: '200px', bg: 'linear-gradient(135deg, #0ea5e9, #0284c7)' },
          { h: '280px', bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
        ].map((item, i) =>
          anim(hover(s('container', {}, { desktop: { borderRadius: '12px', overflow: 'hidden', height: item.h, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
            s('text', { text: '✦' }, { desktop: { fontSize: '32px', color: 'rgba(255,255,255,0.2)' } }),
          ]), { transform: 'scale(1.03)' }), SI(0.2 + i * 0.08))
        ),
      ]),
    ]), FU())],
  },

  // ─── BANNERS ───────────────────────────────────────

  {
    id: 'v8-banner-announcement', name: '📢 Announcement Banner', category: 'Banners' as SectionCategory,
    description: 'Top announcement bar with link',
    elements: [s('container', {}, { desktop: { padding: '12px 24px', background: 'linear-gradient(90deg, #4f46e5, #7c3aed)', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' } }, [
      s('text', { text: '🎉  We just raised $50M Series B!' }, { desktop: { fontSize: '13px', fontWeight: '600', color: '#fff' } }),
      s('link', { text: 'Read more →', href: '#' }, { desktop: { fontSize: '13px', fontWeight: '700', color: '#fff', textDecoration: 'underline', textUnderlineOffset: '2px' } }),
    ])],
  },

  {
    id: 'v8-banner-cookie', name: '🍪 Cookie Consent Banner', category: 'Banners' as SectionCategory,
    description: 'GDPR cookie consent bar',
    elements: [s('container', {}, { desktop: { padding: '16px 40px', backgroundColor: '#111', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' } }, [
      s('text', { text: '🍪 We use cookies to improve your experience. By continuing, you agree to our Privacy Policy.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '8px' } }, [
        s('button', { text: 'Accept All', href: '#' }, { desktop: { padding: '8px 20px', backgroundColor: '#fff', color: '#000', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: 'none' } }),
        s('button', { text: 'Manage', href: '#' }, { desktop: { padding: '8px 20px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)' } }),
      ]),
    ])],
  },

  // ─── CONTENT ───────────────────────────────────────

  {
    id: 'v8-content-split-image', name: '📸 Content Split Image', category: 'Content' as SectionCategory,
    description: 'Content block with image and text side by side',
    elements: [anim(s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', padding: '120px 60px', backgroundColor: '#fff', width: '100%', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', padding: '60px 20px' } }, [
      anim(s('container', {}, { desktop: {} }, [
        s('text', { text: 'HOW IT WORKS' }, { desktop: { fontSize: '12px', letterSpacing: '0.2em', fontWeight: '700', color: '#6366f1', marginBottom: '16px', textTransform: 'uppercase' } }),
        heading('Design, build, and launch in minutes', '36px', '#111'),
        body('Our intuitive drag-and-drop editor makes it easy to create stunning websites without any coding knowledge.', '#666'),
        s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
          s('container', {}, { desktop: { display: 'flex', alignItems: 'flex-start', gap: '16px' } }, [
            s('container', {}, { desktop: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' } }, [
              s('text', { text: '1' }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#7c3aed' } }),
            ]),
            s('container', {}, { desktop: {} }, [
              s('text', { text: 'Choose a template' }, { desktop: { fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '4px' } }),
              s('text', { text: 'Browse 200+ professional templates and pick one that fits.' }, { desktop: { fontSize: '14px', color: '#666', lineHeight: '1.6' } }),
            ]),
          ]),
          s('container', {}, { desktop: { display: 'flex', alignItems: 'flex-start', gap: '16px' } }, [
            s('container', {}, { desktop: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' } }, [
              s('text', { text: '2' }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#7c3aed' } }),
            ]),
            s('container', {}, { desktop: {} }, [
              s('text', { text: 'Customize everything' }, { desktop: { fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '4px' } }),
              s('text', { text: 'Edit content, colors, fonts, and layout to match your brand.' }, { desktop: { fontSize: '14px', color: '#666', lineHeight: '1.6' } }),
            ]),
          ]),
          s('container', {}, { desktop: { display: 'flex', alignItems: 'flex-start', gap: '16px' } }, [
            s('container', {}, { desktop: { width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: '0' } }, [
              s('text', { text: '3' }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#7c3aed' } }),
            ]),
            s('container', {}, { desktop: {} }, [
              s('text', { text: 'Publish instantly' }, { desktop: { fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '4px' } }),
              s('text', { text: 'Go live with one click. Custom domain included.' }, { desktop: { fontSize: '14px', color: '#666', lineHeight: '1.6' } }),
            ]),
          ]),
        ]),
      ]), FL()),
      anim(s('container', {}, { desktop: { borderRadius: '24px', overflow: 'hidden', height: '500px', background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
        s('text', { text: '✦' }, { desktop: { fontSize: '80px', color: 'rgba(99,102,241,0.2)' } }),
      ]), FR()),
    ]), FU())],
  },

  // ─── NEWSLETTER ────────────────────────────────────

  {
    id: 'v8-newsletter', name: '📧 Newsletter Signup', category: 'CTA' as SectionCategory,
    description: 'Email signup with inline form',
    elements: [anim(s('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#111', width: '100%', textAlign: 'center' }, mobile: { padding: '60px 20px' } }, [
      anim(heading('Stay in the loop', '36px'), FU()),
      anim(body('Get the latest updates, tips, and product news delivered to your inbox weekly.', 'rgba(255,255,255,0.4)', '500px'), FU(0.1)),
      anim(s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '12px', maxWidth: '480px', margin: '0 auto' } }, [
        s('input', { placeholder: 'Enter your email', inputType: 'email' }, { desktop: { flex: '1', padding: '14px 16px', backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '14px' } }),
        cta('Subscribe', '#fff', '#000'),
      ]), FU(0.2)),
      anim(s('text', { text: 'No spam. Unsubscribe anytime.' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.2)', marginTop: '16px' } }), FU(0.3)),
    ]), FU())],
  },

  // ─── FOOTERS ───────────────────────────────────────

  {
    id: 'v8-footer-mega', name: '🦶 Mega Footer 4-Column', category: 'Footers' as SectionCategory,
    description: 'Comprehensive footer with columns and social links',
    elements: [s('footer', {}, { desktop: { padding: '80px 60px 40px', backgroundColor: '#0a0a0a', width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '60px 20px 40px' } }, [
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '60px', maxWidth: '1100px', marginBottom: '60px' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [
        s('container', {}, { desktop: {} }, [
          s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', marginBottom: '16px' } }),
          s('text', { text: 'Building the future of the web, one pixel at a time. Trusted by 50,000+ teams worldwide.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7', maxWidth: '300px', marginBottom: '24px' } }),
          s('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
            ...['𝕏', 'in', 'GH', 'YT'].map(icon =>
              hover(s('container', {}, { desktop: { width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } }, [
                s('text', { text: icon }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)' } }),
              ]), { backgroundColor: 'rgba(255,255,255,0.1)' })
            ),
          ]),
        ]),
        ...[
          { title: 'Product', links: ['Features', 'Pricing', 'Changelog', 'Roadmap', 'API Docs'] },
          { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press', 'Partners'] },
          { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies', 'License', 'Security'] },
        ].map(col =>
          s('container', {}, { desktop: {} }, [
            s('text', { text: col.title }, { desktop: { fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: '20px', letterSpacing: '0.05em', textTransform: 'uppercase' } }),
            ...col.links.map(link =>
              hover(s('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '14px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', marginBottom: '12px' } }), { color: 'rgba(255,255,255,0.7)' })
            ),
          ])
        ),
      ]),
      dividerLine(),
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px' }, mobile: { flexDirection: 'column', gap: '12px' } }, [
        s('text', { text: '© 2026 Brand. All rights reserved.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.2)' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '24px' } }, [
          ...['Privacy', 'Terms', 'Cookies'].map(link =>
            hover(s('link', { text: link, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.2)', textDecoration: 'none' } }), { color: 'rgba(255,255,255,0.5)' })
          ),
        ]),
      ]),
    ])],
  },

  {
    id: 'v8-footer-simple', name: '🦶 Simple Footer', category: 'Footers' as SectionCategory,
    description: 'Minimal centered footer',
    elements: [s('footer', {}, { desktop: { padding: '40px 60px', backgroundColor: '#000', width: '100%', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' } }, [
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '24px' } }, [
        ...['Home', 'About', 'Services', 'Blog', 'Contact'].map(link =>
          hover(s('link', { text: link, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontWeight: '500' } }), { color: '#fff' })
        ),
      ]),
      s('text', { text: '© 2026 Company. All rights reserved.' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.05em' } }),
    ])],
  },

  // ─── PORTFOLIO ─────────────────────────────────────

  {
    id: 'v8-portfolio-showcase', name: '🎨 Portfolio Showcase', category: 'Portfolio' as SectionCategory,
    description: 'Project showcase with large cards',
    elements: [anim(s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      anim(pill('Work'), FU()),
      anim(heading('Selected projects', '48px'), FU(0.1)),
      s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px', marginTop: '48px' } }, [
        ...[
          { title: 'Nebula Dashboard', desc: 'A real-time analytics platform for enterprise teams', tag: 'SaaS', color: '#6366f1', year: '2026' },
          { title: 'Artisan Commerce', desc: 'Luxury e-commerce experience for artisan goods', tag: 'E-commerce', color: '#ec4899', year: '2025' },
        ].map((project, i) =>
          anim(hover(s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.06)', minHeight: '360px' }, mobile: { gridTemplateColumns: '1fr' } }, [
            s('container', {}, { desktop: { background: `linear-gradient(135deg, ${project.color}30, ${project.color}08)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' } }, [
              s('text', { text: '✦' }, { desktop: { fontSize: '64px', color: `${project.color}30` } }),
            ]),
            s('container', {}, { desktop: { padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } }, [
              s('container', {}, { desktop: { display: 'flex', gap: '8px', marginBottom: '20px' } }, [
                s('text', { text: project.tag }, { desktop: { fontSize: '11px', fontWeight: '700', color: project.color, backgroundColor: `${project.color}15`, padding: '4px 12px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.08em' } }),
                s('text', { text: project.year }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', padding: '4px 12px', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.06)' } }),
              ]),
              s('heading', { text: project.title, level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
              s('text', { text: project.desc }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '28px' } }),
              ctaOutline('View Case Study →'),
            ]),
          ]), { borderColor: 'rgba(255,255,255,0.12)', transform: 'translateY(-4px)' }), FU(0.3 + i * 0.15))
        ),
      ]),
    ]), FU())],
  },

  // ─── HERO VARIATIONS ───────────────────────────────

  {
    id: 'v8-hero-centered-dark', name: '🌑 Centered Dark Hero', category: 'Heroes' as SectionCategory,
    description: 'Centered hero with gradient text and dual CTAs',
    elements: [anim(s('section', {}, { desktop: { padding: '160px 60px 120px', backgroundColor: '#000', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }, mobile: { padding: '100px 20px 80px' } }, [
      s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'radial-gradient(circle at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)', pointerEvents: 'none' } }),
      anim(pill('Introducing V2.0'), FU()),
      anim(s('heading', { text: 'Build websites\nthat convert', level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '800', letterSpacing: '-0.04em', lineHeight: '1.05', background: 'linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.4) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '28px', maxWidth: '800px', margin: '0 auto 28px' } as any, mobile: { fontSize: '40px' } }), FU(0.1)),
      anim(body('The most powerful visual website builder. Design, build, and launch stunning sites in minutes — no code required.', 'rgba(255,255,255,0.4)', '580px'), FU(0.2)),
      anim(s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '16px' } }, [
        cta('Start Building — Free', '#fff', '#000'),
        ctaOutline('Watch Demo'),
      ]), FU(0.3)),
    ]), FU())],
  },

  {
    id: 'v8-hero-split-light', name: '☀️ Split Hero Light', category: 'Heroes' as SectionCategory,
    description: 'Clean light hero with image placeholder',
    elements: [anim(s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', padding: '120px 60px', backgroundColor: '#fff', width: '100%', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', padding: '80px 20px' } }, [
      anim(s('container', {}, { desktop: {} }, [
        s('text', { text: 'FOR MODERN TEAMS' }, { desktop: { fontSize: '12px', letterSpacing: '0.2em', fontWeight: '700', color: '#6366f1', marginBottom: '20px', textTransform: 'uppercase' } }),
        heading('The smarter way to build online', '48px', '#111'),
        body('Combine the power of AI with intuitive design tools. Ship beautiful websites 10x faster than traditional methods.', '#555'),
        s('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
          cta('Get Started', '#111', '#fff'),
          ctaOutline('Learn More', '#d1d5db', '#333'),
        ]),
      ]), FL()),
      anim(s('container', {}, { desktop: { borderRadius: '24px', overflow: 'hidden', height: '480px', background: 'linear-gradient(135deg, #e0e7ff, #ede9fe)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.08)' } }, [
        s('text', { text: '✦' }, { desktop: { fontSize: '80px', color: 'rgba(99,102,241,0.15)' } }),
      ]), FR()),
    ]), FU())],
  },

  // ─── ECOMMERCE ─────────────────────────────────────

  {
    id: 'v8-product-showcase', name: '🛍️ Product Showcase Cards', category: 'Ecommerce' as SectionCategory,
    description: 'E-commerce product cards with prices',
    elements: [anim(s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#fff', width: '100%' }, mobile: { padding: '60px 20px' } }, [
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px' } }, [
        heading('New Arrivals', '36px', '#111'),
        s('link', { text: 'View All →', href: '#' }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#6366f1', textDecoration: 'none' } }),
      ]),
      s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)' } }, [
        ...[
          { name: 'Minimal Chair', price: '$299', tag: 'New', color: '#f3f4f6' },
          { name: 'Desk Lamp', price: '$149', tag: 'Sale', color: '#fef3c7' },
          { name: 'Ceramic Vase', price: '$89', tag: '', color: '#ecfdf5' },
          { name: 'Wall Clock', price: '$129', tag: 'New', color: '#ede9fe' },
        ].map((p, i) =>
          anim(hover(s('container', {}, { desktop: { borderRadius: '16px', overflow: 'hidden', border: '1px solid #e5e7eb' } }, [
            s('container', {}, { desktop: { width: '100%', height: '240px', backgroundColor: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' } }, [
              s('text', { text: '✦' }, { desktop: { fontSize: '48px', color: 'rgba(0,0,0,0.06)' } }),
              ...(p.tag ? [s('text', { text: p.tag }, { desktop: { position: 'absolute', top: '12px', left: '12px', fontSize: '10px', fontWeight: '700', color: p.tag === 'Sale' ? '#dc2626' : '#111', backgroundColor: p.tag === 'Sale' ? '#fee2e2' : '#fff', padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.05em' } })] : []),
            ]),
            s('container', {}, { desktop: { padding: '16px' } }, [
              s('text', { text: p.name }, { desktop: { fontSize: '15px', fontWeight: '600', color: '#111', marginBottom: '4px' } }),
              s('text', { text: p.price }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#111' } }),
            ]),
          ]), { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }), FU(0.2 + i * 0.1))
        ),
      ]),
    ]), FU())],
  },

];
