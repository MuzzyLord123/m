import { DesignerTemplate, EditorElement, TemplatePage } from '../types';

let _c5 = 0;
function uid(): string { _c5++; return `tv5-${_c5}-${Math.random().toString(36).slice(2, 8)}`; }
function el(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: uid(), type, name: name ?? type, props, styles, children };
}

const A_FADE = { type: 'fadeInUp' as const, duration: 0.8, delay: 0, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
const A_BLUR = { type: 'blurIn' as const, duration: 1.2, delay: 0, trigger: 'onView' as const };
const A_SCALE = { type: 'scaleIn' as const, duration: 1, delay: 0.2, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
const A_LEFT = { type: 'fadeInLeft' as const, duration: 0.9, delay: 0.1, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
const A_RIGHT = { type: 'fadeInRight' as const, duration: 0.9, delay: 0.1, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };

function a(element: EditorElement, anim: EditorElement['animations']): EditorElement { return { ...element, animations: anim }; }

// ── SHARED BUILDING BLOCKS ──────────────────────────────────────

function nav5(brand: string, links: string[], accent: string = '#6366f1') {
  return el('navbar', { brand }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 64px', width: '100%', backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky' as any, top: '0', zIndex: '100' }, mobile: { padding: '16px 24px' } }, [
    el('link', { text: brand, href: '/' }, { desktop: { fontSize: '17px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' as any, textDecoration: 'none' } }),
    el('container', {}, { desktop: { display: 'flex', gap: '36px', alignItems: 'center' }, mobile: { display: 'none' } }, [
      ...links.map(l => el('link', { text: l, href: `/${l.toLowerCase().replace(/\s+/g, '-')}` }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: '500', letterSpacing: '0.04em', textTransform: 'uppercase' as any } })),
      el('button', { text: 'Get Started', href: '/contact' }, { desktop: { padding: '10px 24px', background: accent, color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: '700', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
    ]),
  ], 'Navigation');
}

function foot5(brand: string, cols?: { title: string; links: string[] }[]) {
  const colData = cols || [
    { title: 'Company', links: ['About', 'Careers', 'Press', 'Blog'] },
    { title: 'Services', links: ['Design', 'Development', 'Consulting', 'Support'] },
    { title: 'Resources', links: ['Documentation', 'Guides', 'FAQ', 'Community'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
  ];
  return el('footer', {}, { desktop: { padding: '100px 60px 40px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)', width: '100%' }, mobile: { padding: '60px 24px 40px' } }, [
    el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: `2fr ${colData.map(() => '1fr').join(' ')}`, gap: '48px', maxWidth: '1200px', margin: '0 auto 60px' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [
      el('container', {}, { desktop: {} }, [
        el('heading', { text: brand, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.08em', marginBottom: '16px' } }),
        el('text', { text: 'Premium digital experiences crafted with precision, passion, and purpose.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.25)', lineHeight: '1.7', maxWidth: '280px', marginBottom: '24px' } }),
        el('container', {}, { desktop: { display: 'flex', gap: '12px' } }, ['Twitter', 'LinkedIn', 'Instagram'].map(s =>
          el('link', { text: s.charAt(0), href: '#' }, { desktop: { width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontWeight: '700', textDecoration: 'none' } })
        )),
      ]),
      ...colData.map(col => el('container', {}, { desktop: {} }, [
        el('heading', { text: col.title, level: 'h4' }, { desktop: { fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.45)', marginBottom: '20px', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
        ...col.links.map(link => el('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none', marginBottom: '12px', lineHeight: '1.6' } })),
      ])),
    ]),
    el('container', {}, { desktop: { borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '28px', display: 'flex', justifyContent: 'space-between', maxWidth: '1200px', margin: '0 auto' }, mobile: { flexDirection: 'column', gap: '8px' } }, [
      el('text', { text: `© 2026 ${brand}. All rights reserved.` }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.06em' } }),
      el('text', { text: 'Designed with precision.' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.08)' } }),
    ]),
  ], 'Footer');
}

// ── SECTION BUILDERS ────────────────────────────────────────────

function heroCinematic(heading: string, sub: string, cta1: string, cta2: string, opts: { badge?: string; gradient: string; accent: string }) {
  return el('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#000' } }, [
    el('container', {}, { desktop: { position: 'absolute', inset: '0', background: opts.gradient, opacity: '0.6' } }),
    el('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.02) 0%, transparent 50%), radial-gradient(circle at 70% 30%, rgba(255,255,255,0.015) 0%, transparent 40%)' } }),
    el('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '960px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
      ...(opts.badge ? [a(el('text', { text: opts.badge }, { desktop: { padding: '8px 24px', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', borderRadius: '100px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '32px', letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.06)' } }), A_FADE)] : []),
      a(el('heading', { text: heading, level: 'h1' }, { desktop: { fontSize: '84px', fontWeight: '800', color: '#fff', lineHeight: '1.0', letterSpacing: '-0.045em', marginBottom: '28px' }, mobile: { fontSize: '44px' } }), A_BLUR),
      a(el('text', { text: sub }, { desktop: { fontSize: '19px', color: 'rgba(255,255,255,0.42)', lineHeight: '1.75', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' } }), { ...A_FADE, delay: 0.3 }),
      a(el('container', {}, { desktop: { display: 'flex', gap: '16px', justifyContent: 'center' } }, [
        el('button', { text: cta1, href: '/contact' }, { desktop: { padding: '18px 48px', background: opts.accent, color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', boxShadow: `0 0 40px ${opts.accent}40` } }),
        el('button', { text: cta2, href: '/about' }, { desktop: { padding: '18px 48px', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.7)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.08)' } }),
      ]), { ...A_FADE, delay: 0.5 }),
    ]),
  ], 'Hero');
}

function heroSplit5(heading: string, sub: string, cta: string, imgUrl: string, opts: { reverse?: boolean; badge?: string; accent?: string; overlay?: string }) {
  return el('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '92vh', backgroundColor: '#000' }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
    el('container', {}, { desktop: { padding: '120px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', order: opts.reverse ? '1' : '0' }, mobile: { padding: '60px 24px' } }, [
      ...(opts.badge ? [a(el('text', { text: opts.badge }, { desktop: { padding: '6px 18px', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.4)', borderRadius: '100px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '28px', letterSpacing: '0.12em', border: '1px solid rgba(255,255,255,0.06)' } }), A_FADE)] : []),
      a(el('heading', { text: heading, level: 'h1' }, { desktop: { fontSize: '64px', fontWeight: '800', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.04em', marginBottom: '24px' }, mobile: { fontSize: '38px' } }), A_BLUR),
      a(el('text', { text: sub }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.42)', lineHeight: '1.75', marginBottom: '40px', maxWidth: '440px' } }), { ...A_FADE, delay: 0.2 }),
      a(el('button', { text: cta, href: '/contact' }, { desktop: { padding: '18px 44px', backgroundColor: opts.accent || '#fff', color: opts.accent ? '#fff' : '#000', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none', width: 'fit-content', letterSpacing: '0.04em' } }), { ...A_FADE, delay: 0.4 }),
    ]),
    el('container', {}, { desktop: { position: 'relative', overflow: 'hidden', order: opts.reverse ? '0' : '1' } }, [
      a(el('image', { src: imgUrl, alt: 'Hero' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }), A_SCALE),
      ...(opts.overlay ? [el('container', {}, { desktop: { position: 'absolute', inset: '0', background: opts.overlay } })] : []),
    ]),
  ], 'Hero');
}

function statsSection(items: { value: string; label: string }[], opts: { bg?: string; accent?: string } = {}) {
  return el('section', {}, { desktop: { padding: '80px 60px', backgroundColor: opts.bg || '#000', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', width: '100%' } }, [
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '40px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, items.map((item, i) =>
      a(el('container', {}, { desktop: {} }, [
        el('heading', { text: item.value, level: 'h3' }, { desktop: { fontSize: '52px', fontWeight: '800', color: opts.accent || '#fff', marginBottom: '8px', letterSpacing: '-0.03em' } }),
        el('text', { text: item.label }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as any, letterSpacing: '0.1em', fontWeight: '600' } }),
      ]), { ...A_FADE, delay: i * 0.1 })
    )),
  ], 'Stats');
}

function bentoGrid(title: string, sub: string, items: { icon: string; title: string; desc: string }[], opts: { accent?: string; cols?: number } = {}) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto 64px', textAlign: 'center' } }, [
      el('text', { text: 'FEATURES' }, { desktop: { fontSize: '11px', color: opts.accent || 'rgba(99,102,241,0.8)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '50px', fontWeight: '800', color: '#fff', letterSpacing: '-0.035em', marginBottom: '16px', lineHeight: '1.1' } }),
      el('text', { text: sub }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.38)', maxWidth: '560px', margin: '0 auto', lineHeight: '1.7' } }),
    ]), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${opts.cols || 3}, 1fr)`, gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, items.map((item, i) =>
      a(el('card', {}, { desktop: { padding: '44px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' } }, [
        el('text', { text: item.icon }, { desktop: { fontSize: '36px', marginBottom: '20px' } }),
        el('heading', { text: item.title, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px', letterSpacing: '-0.01em' } }),
        el('text', { text: item.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.38)', lineHeight: '1.75' } }),
      ]), { ...A_FADE, delay: i * 0.1 })
    )),
  ], 'Features');
}

function testimonials5(title: string, items: { quote: string; name: string; role: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#050505', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { textAlign: 'center', marginBottom: '64px' } }, [
      el('text', { text: 'TESTIMONIALS' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '16px' } }),
      el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
    ]), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: '20px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, items.map((t, i) =>
      a(el('card', {}, { desktop: { padding: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' } }, [
        el('text', { text: '★★★★★' }, { desktop: { fontSize: '14px', color: '#f59e0b', marginBottom: '20px', letterSpacing: '4px' } }),
        el('text', { text: `"${t.quote}"` }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginBottom: '28px', fontStyle: 'italic' } }),
        el('text', { text: t.name }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#fff' } }),
        el('text', { text: t.role }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.28)', marginTop: '4px' } }),
      ]), { ...A_FADE, delay: i * 0.12 })
    )),
  ], 'Testimonials');
}

function ctaBanner(heading: string, sub: string, btn: string, accent: string) {
  return el('section', {}, { desktop: { padding: '140px 60px', background: `linear-gradient(135deg, #0a0a0a 0%, ${accent}15 50%, #0a0a0a 100%)`, textAlign: 'center', width: '100%', position: 'relative', overflow: 'hidden' }, mobile: { padding: '80px 24px' } }, [
    el('container', {}, { desktop: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: `radial-gradient(circle, ${accent}15 0%, transparent 60%)`, borderRadius: '50%' } }),
    a(el('container', {}, { desktop: { position: 'relative', zIndex: '1', maxWidth: '640px', margin: '0 auto' } }, [
      el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '800', color: '#fff', letterSpacing: '-0.035em', marginBottom: '20px', lineHeight: '1.1' } }),
      el('text', { text: sub }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.42)', marginBottom: '44px', lineHeight: '1.7' } }),
      el('button', { text: btn, href: '/contact' }, { desktop: { padding: '18px 52px', background: accent, color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', boxShadow: `0 0 50px ${accent}30` } }),
    ]), A_BLUR),
  ], 'CTA');
}

function servicesSection(title: string, sub: string, services: { name: string; desc: string; icon: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto 72px' } }, [
      el('text', { text: 'SERVICES' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '50px', fontWeight: '800', color: '#fff', letterSpacing: '-0.035em', marginBottom: '16px' } }),
      el('text', { text: sub }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.38)', maxWidth: '500px', lineHeight: '1.7' } }),
    ]), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, services.map((s, i) =>
      a(el('card', {}, { desktop: { padding: '48px', backgroundColor: '#0a0a0a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px' } }, [
        el('text', { text: s.icon }, { desktop: { fontSize: '36px' } }),
        el('heading', { text: s.name, level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' } }),
        el('text', { text: s.desc }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.38)', lineHeight: '1.75' } }),
      ]), { ...A_FADE, delay: i * 0.1 })
    )),
  ], 'Services');
}

function aboutPage(heading: string, desc: string, imgUrl: string, values: { title: string; desc: string }[]) {
  return el('section', {}, { desktop: { backgroundColor: '#050505', width: '100%' } }, [
    el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '600px' }, mobile: { gridTemplateColumns: '1fr' } }, [
      el('container', {}, { desktop: { padding: '100px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '60px 24px' } }, [
        a(el('text', { text: 'ABOUT US' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', marginBottom: '20px', fontWeight: '700' } }), A_FADE),
        a(el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.035em', lineHeight: '1.1', marginBottom: '24px' } }), A_LEFT),
        a(el('text', { text: desc }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.42)', lineHeight: '1.8', maxWidth: '440px' } }), { ...A_FADE, delay: 0.2 }),
      ]),
      el('container', {}, { desktop: { overflow: 'hidden' } }, [
        a(el('image', { src: imgUrl, alt: 'About' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }), A_SCALE),
      ]),
    ]),
    a(el('container', {}, { desktop: { padding: '80px 60px', maxWidth: '1200px', margin: '0 auto' } }, [
      el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${values.length}, 1fr)`, gap: '24px' }, mobile: { gridTemplateColumns: '1fr' } }, values.map((v, i) =>
        a(el('card', {}, { desktop: { padding: '36px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' } }, [
          el('heading', { text: v.title, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '10px' } }),
          el('text', { text: v.desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.38)', lineHeight: '1.7' } }),
        ]), { ...A_FADE, delay: i * 0.1 })
      )),
    ]), A_FADE),
  ], 'About');
}

function galleryGrid(title: string, images: { src: string; alt: string }[], cols: number = 3) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('text', { text: title.toUpperCase() }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', marginBottom: '48px', fontWeight: '700', maxWidth: '1200px', margin: '0 auto 48px' } }), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, images.map((img, i) =>
      a(el('image', { src: img.src, alt: img.alt }, { desktop: { width: '100%', height: '340px', objectFit: 'cover', display: 'block', borderRadius: '12px' } }), { ...A_SCALE, delay: i * 0.08 })
    )),
  ], title);
}

function contactPage() {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#050505', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr', gap: '48px' } }, [
      el('container', {}, { desktop: {} }, [
        a(el('heading', { text: 'Get In Touch', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '24px' } }), A_LEFT),
        a(el('text', { text: 'We\'d love to hear about your project. Send us a message and we\'ll respond within 24 hours.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8', marginBottom: '40px' } }), { ...A_FADE, delay: 0.1 }),
        a(el('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
          el('text', { text: '📧  hello@company.com' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.45)' } }),
          el('text', { text: '📱  +1 (555) 123-4567' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.45)' } }),
          el('text', { text: '📍  350 Fifth Ave, New York, NY 10118' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.45)' } }),
        ]), { ...A_FADE, delay: 0.2 }),
      ]),
      a(el('form', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
        el('input', { placeholder: 'Full Name', inputType: 'text' }, { desktop: { padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '14px', color: '#fff' } }),
        el('input', { placeholder: 'Email Address', inputType: 'email' }, { desktop: { padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '14px', color: '#fff' } }),
        el('input', { placeholder: 'Subject', inputType: 'text' }, { desktop: { padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '14px', color: '#fff' } }),
        el('textarea', { placeholder: 'Your message...' }, { desktop: { padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', fontSize: '14px', color: '#fff', minHeight: '140px' } }),
        el('button', { text: 'Send Message', href: '#' }, { desktop: { padding: '18px 36px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: 'none' } }),
      ]), A_RIGHT),
    ]),
  ], 'Contact');
}

function pricingPage(plans: { name: string; price: string; desc: string; features: string; popular?: boolean }[], accent: string = '#6366f1') {
  return el('section', {}, { desktop: { padding: '120px 60px', background: 'linear-gradient(180deg, #0a0a0a 0%, #000 100%)', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { textAlign: 'center', marginBottom: '64px' } }, [
      el('text', { text: 'PRICING' }, { desktop: { fontSize: '11px', color: accent, letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: 'Simple, Transparent Pricing', level: 'h2' }, { desktop: { fontSize: '50px', fontWeight: '800', color: '#fff', letterSpacing: '-0.035em' } }),
      el('text', { text: 'No hidden fees. Cancel anytime.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.38)', marginTop: '12px' } }),
    ]), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: '20px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, plans.map((p, i) =>
      a(el('card', {}, { desktop: { padding: '48px', borderRadius: '20px', border: p.popular ? `1px solid ${accent}40` : '1px solid rgba(255,255,255,0.05)', backgroundColor: p.popular ? `${accent}08` : 'rgba(255,255,255,0.02)', transform: p.popular ? 'scale(1.04)' : 'none' } }, [
        ...(p.popular ? [el('text', { text: 'MOST POPULAR' }, { desktop: { padding: '4px 14px', background: accent, color: '#fff', borderRadius: '100px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.1em' } })] : []),
        el('heading', { text: p.name, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
        el('text', { text: p.desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.32)', marginBottom: '24px' } }),
        el('heading', { text: p.price, level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '800', color: '#fff', marginBottom: '32px', letterSpacing: '-0.03em' } }),
        el('text', { text: p.features }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: '2.4', whiteSpace: 'pre-line', marginBottom: '36px' } }),
        el('button', { text: p.popular ? 'Get Started' : 'Choose Plan', href: '/contact' }, { desktop: { padding: '16px 32px', background: p.popular ? accent : 'transparent', color: p.popular ? '#fff' : 'rgba(255,255,255,0.65)', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.08)', width: '100%' } }),
      ]), { ...A_FADE, delay: i * 0.1 })
    )),
  ], 'Pricing');
}

function faqPage(items: { q: string; a: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#050505', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { maxWidth: '740px', margin: '0 auto' } }, [
      el('heading', { text: 'Frequently Asked Questions', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '56px', textAlign: 'center' } }),
      ...items.map((item, i) => a(el('container', {}, { desktop: { padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' } }, [
        el('heading', { text: item.q, level: 'h4' }, { desktop: { fontSize: '17px', fontWeight: '600', color: '#fff', marginBottom: '12px' } }),
        el('text', { text: item.a }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.38)', lineHeight: '1.7' } }),
      ]), { ...A_FADE, delay: i * 0.08 })),
    ]), A_FADE),
  ], 'FAQ');
}

function processTimeline(steps: { step: string; title: string; desc: string }[], accent: string = 'rgba(99,102,241,0.3)') {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { textAlign: 'center', marginBottom: '80px' } }, [
      el('text', { text: 'OUR PROCESS' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: 'How We Work', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
    ]), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: '24px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, steps.map((s, i) =>
      a(el('card', {}, { desktop: { padding: '44px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' } }, [
        el('text', { text: s.step }, { desktop: { fontSize: '48px', fontWeight: '800', color: accent, marginBottom: '16px' } }),
        el('heading', { text: s.title, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
        el('text', { text: s.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.38)', lineHeight: '1.7' } }),
      ]), { ...A_FADE, delay: i * 0.12 })
    )),
  ], 'Process');
}

function teamGrid(members: { name: string; role: string; img: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { textAlign: 'center', marginBottom: '64px' } }, [
      el('text', { text: 'OUR TEAM' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '16px' } }),
      el('heading', { text: 'Meet the People Behind the Work', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
    ]), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(members.length, 4)}, 1fr)`, gap: '20px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, members.map((p, i) =>
      a(el('card', {}, { desktop: { borderRadius: '16px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' } }, [
        el('image', { src: p.img, alt: p.name }, { desktop: { width: '100%', height: '300px', objectFit: 'cover' } }),
        el('container', {}, { desktop: { padding: '20px 24px' } }, [
          el('heading', { text: p.name, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
          el('text', { text: p.role }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.32)' } }),
        ]),
      ]), { ...A_FADE, delay: i * 0.1 })
    )),
  ], 'Team');
}

function logoBanner(names: string[]) {
  return el('section', {}, { desktop: { padding: '60px 60px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', width: '100%' } }, [
    a(el('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', textAlign: 'center' } }, [
      el('text', { text: 'TRUSTED BY INDUSTRY LEADERS' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.15em', marginBottom: '32px', fontWeight: '600' } }),
      el('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '64px', flexWrap: 'wrap' } }, names.map(n =>
        el('text', { text: n }, { desktop: { fontSize: '18px', fontWeight: '700', color: 'rgba(255,255,255,0.08)', letterSpacing: '0.04em' } })
      )),
    ]), A_FADE),
  ], 'Logos');
}

function blogSection(posts: { title: string; excerpt: string; img: string; date: string; category: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto 64px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }, mobile: { flexDirection: 'column', gap: '16px' } }, [
      el('container', {}, { desktop: {} }, [
        el('text', { text: 'INSIGHTS' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '12px' } }),
        el('heading', { text: 'Latest from our Blog', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
      ]),
      el('button', { text: 'View All →', href: '/blog' }, { desktop: { padding: '12px 28px', backgroundColor: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.5)', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.06)' } }),
    ]), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(posts.length, 3)}, 1fr)`, gap: '20px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, posts.map((p, i) =>
      a(el('card', {}, { desktop: { borderRadius: '16px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' } }, [
        el('image', { src: p.img, alt: p.title }, { desktop: { width: '100%', height: '220px', objectFit: 'cover' } }),
        el('container', {}, { desktop: { padding: '28px' } }, [
          el('container', {}, { desktop: { display: 'flex', gap: '12px', marginBottom: '14px' } }, [
            el('text', { text: p.category }, { desktop: { padding: '4px 10px', backgroundColor: 'rgba(99,102,241,0.1)', color: 'rgba(99,102,241,0.8)', borderRadius: '4px', fontSize: '10px', fontWeight: '700', letterSpacing: '0.06em' } }),
            el('text', { text: p.date }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.2)' } }),
          ]),
          el('heading', { text: p.title, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '10px', letterSpacing: '-0.01em', lineHeight: '1.4' } }),
          el('text', { text: p.excerpt }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.65' } }),
        ]),
      ]), { ...A_FADE, delay: i * 0.1 })
    )),
  ], 'Blog');
}

function careersSection(roles: { title: string; department: string; location: string; type: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto' } }, [
      el('container', {}, { desktop: { textAlign: 'center', marginBottom: '64px' } }, [
        el('text', { text: 'CAREERS' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '16px' } }),
        el('heading', { text: 'Join Our Team', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' } }),
        el('text', { text: 'We\'re always looking for exceptional people to shape the future with us.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.38)', lineHeight: '1.7' } }),
      ]),
      ...roles.map((r, i) => a(el('card', {}, { desktop: { padding: '28px 32px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }, mobile: { flexDirection: 'column', gap: '12px', alignItems: 'flex-start' } }, [
        el('container', {}, { desktop: {} }, [
          el('heading', { text: r.title, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
          el('text', { text: `${r.department} · ${r.location} · ${r.type}` }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.32)' } }),
        ]),
        el('button', { text: 'Apply →', href: '/contact' }, { desktop: { padding: '10px 24px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.6)', borderRadius: '8px', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.06)' } }),
      ]), { ...A_FADE, delay: i * 0.08 })),
    ]), A_FADE),
  ], 'Careers');
}

function caseStudySection(cases: { title: string; desc: string; result: string; img: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#050505', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { textAlign: 'center', marginBottom: '64px' } }, [
      el('text', { text: 'CASE STUDIES' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em', fontWeight: '700', marginBottom: '16px' } }),
      el('heading', { text: 'Results That Speak', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
    ]), A_FADE),
    el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' } }, cases.map((c, i) =>
      a(el('card', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', borderRadius: '20px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }, mobile: { gridTemplateColumns: '1fr' } }, [
        el('image', { src: c.img, alt: c.title }, { desktop: { width: '100%', height: '380px', objectFit: 'cover' } }),
        el('container', {}, { desktop: { padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'center' } }, [
          el('heading', { text: c.title, level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '16px', letterSpacing: '-0.02em' } }),
          el('text', { text: c.desc }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '24px' } }),
          el('text', { text: c.result }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#6366f1', padding: '10px 20px', backgroundColor: 'rgba(99,102,241,0.08)', borderRadius: '8px', display: 'inline-block' } }),
        ]),
      ]), { ...A_FADE, delay: i * 0.15 })
    )),
  ], 'Case Studies');
}

function pageHero(title: string, sub: string) {
  return a(el('section', {}, { desktop: { padding: '160px 60px 80px', textAlign: 'center', backgroundColor: '#000' } }, [
    el('heading', { text: title, level: 'h1' }, { desktop: { fontSize: '60px', fontWeight: '800', color: '#fff', letterSpacing: '-0.04em', marginBottom: '16px' } }),
    el('text', { text: sub }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.38)', maxWidth: '540px', margin: '0 auto', lineHeight: '1.7' } }),
  ], 'Page Hero'), A_BLUR);
}

// ═══════════════════════════════════════════════════════════════════
//  5 ULTRA-PREMIUM TEMPLATES — 10 PAGES EACH
// ═══════════════════════════════════════════════════════════════════

export const TEMPLATES_V5: DesignerTemplate[] = [

  // ── 1. FINTECH SAAS ──────────────────────────────────────────
  (() => {
    const brand = 'VAULTPAY';
    const accent = '#10b981';
    const links = ['Features', 'Solutions', 'Pricing', 'About', 'Blog', 'Careers', 'Case Studies', 'FAQ', 'Contact'];
    const n = nav5(brand, links, accent);
    const f = foot5(brand, [
      { title: 'Product', links: ['Features', 'Pricing', 'Security', 'API Docs'] },
      { title: 'Solutions', links: ['Enterprise', 'Startups', 'Freelancers', 'Agencies'] },
      { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
      { title: 'Legal', links: ['Privacy', 'Terms', 'Compliance'] },
    ]);

    const home: EditorElement[] = [
      heroCinematic('The Future of\nBusiness Payments', 'Move money globally in milliseconds. Enterprise-grade infrastructure trusted by 25,000+ companies worldwide.', 'Start Free Trial', 'Watch Demo', { badge: 'SOC 2 TYPE II CERTIFIED · PCI DSS COMPLIANT', gradient: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(16,185,129,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(6,182,212,0.08) 0%, transparent 60%)', accent }),
      logoBanner(['Stripe', 'Shopify', 'Square', 'Plaid', 'Brex', 'Ramp']),
      statsSection([{ value: '$180B+', label: 'Processed Annually' }, { value: '25K+', label: 'Active Companies' }, { value: '99.99%', label: 'Uptime SLA' }, { value: '190+', label: 'Countries Supported' }]),
      bentoGrid('Built for Modern Finance', 'Everything you need to manage payments, treasury, and compliance in one platform.', [
        { icon: '⚡', title: 'Instant Settlements', desc: 'Real-time settlement across 40+ currencies with zero-fee domestic transfers and competitive FX rates.' },
        { icon: '🔐', title: 'Bank-Grade Security', desc: 'SOC 2 Type II certified with end-to-end encryption, multi-factor auth, and fraud detection AI.' },
        { icon: '📊', title: 'Smart Analytics', desc: 'Real-time dashboards, predictive cash flow modeling, and automated reconciliation.' },
        { icon: '🔗', title: 'Seamless Integrations', desc: 'Connect with 200+ accounting, ERP, and banking platforms via our REST and GraphQL APIs.' },
        { icon: '🌍', title: 'Global Coverage', desc: 'Accept and send payments in 190+ countries with local payment method support.' },
        { icon: '🤖', title: 'AI-Powered Compliance', desc: 'Automated KYC/AML screening, sanctions checking, and regulatory reporting.' },
      ]),
      testimonials5('What CFOs Are Saying', [
        { quote: 'VaultPay cut our payment processing costs by 62% and eliminated reconciliation headaches completely.', name: 'Sarah Mitchell', role: 'CFO, TechCorp Global' },
        { quote: 'The real-time treasury view alone is worth 10x the price. Game-changing for our cash management.', name: 'James Park', role: 'VP Finance, ScaleUp Inc' },
        { quote: 'We migrated from three legacy providers to VaultPay in two weeks. Flawless transition.', name: 'Priya Sharma', role: 'Head of Payments, MegaRetail' },
      ]),
      ctaBanner('Ready to Transform Your Payments?', 'Join 25,000+ companies using VaultPay to move money smarter, faster, and cheaper.', 'Start Free Trial', accent),
    ];

    const pages: TemplatePage[] = [
      { name: 'Home', slug: '/', elements: [n, ...home, f] },
      { name: 'Features', slug: '/features', elements: [n, pageHero('Platform Features', 'Enterprise-grade tools designed for modern financial operations.'), bentoGrid('Core Platform', 'Everything you need, nothing you don\'t.', [
        { icon: '💳', title: 'Payment Processing', desc: 'Accept cards, bank transfers, wallets, and local methods across 190+ countries.' },
        { icon: '🏦', title: 'Treasury Management', desc: 'Multi-currency accounts, automated sweeping, and intelligent cash positioning.' },
        { icon: '📱', title: 'Mobile SDK', desc: 'Beautiful, PCI-compliant checkout experiences for iOS, Android, and React Native.' },
        { icon: '🔄', title: 'Recurring Billing', desc: 'Flexible subscription management with smart retry logic and dunning automation.' },
        { icon: '📈', title: 'Revenue Recognition', desc: 'Automated ASC 606 compliant revenue recognition and deferred revenue tracking.' },
        { icon: '🛡️', title: 'Fraud Prevention', desc: 'ML-powered fraud scoring, velocity checks, and customizable rule engine.' },
      ]), processTimeline([{ step: '01', title: 'Integrate', desc: 'Add our SDK in under 10 minutes with comprehensive documentation.' }, { step: '02', title: 'Configure', desc: 'Set up payment methods, currencies, and compliance rules.' }, { step: '03', title: 'Launch', desc: 'Go live with full monitoring, alerts, and 24/7 support.' }, { step: '04', title: 'Scale', desc: 'Grow globally with automatic compliance and infrastructure scaling.' }], 'rgba(16,185,129,0.3)'), ctaBanner('Start Building Today', 'Free sandbox with full API access. No credit card required.', 'Create Free Account', accent), f] },
      { name: 'Solutions', slug: '/solutions', elements: [n, pageHero('Solutions', 'Tailored payment infrastructure for every stage of growth.'), servicesSection('For Every Business', 'From startups to Fortune 500, we scale with you.', [
        { name: 'Enterprise', desc: 'Custom pricing, dedicated support, SLA guarantees, and bespoke integrations for large-scale operations.', icon: '🏢' },
        { name: 'Growth Stage', desc: 'Automated billing, multi-entity support, and advanced analytics for scaling companies.', icon: '🚀' },
        { name: 'Startups', desc: 'Zero-to-one payment setup with founder-friendly pricing and migration assistance.', icon: '💡' },
        { name: 'Marketplaces', desc: 'Split payments, managed payouts, 1099-K reporting, and multi-party settlements.', icon: '🏪' },
      ]), statsSection([{ value: '62%', label: 'Cost Reduction' }, { value: '3x', label: 'Faster Settlement' }, { value: '99.99%', label: 'Uptime' }, { value: '24/7', label: 'Support' }], { accent }), ctaBanner('Find Your Solution', 'Talk to our team about the best plan for your business needs.', 'Schedule Demo', accent), f] },
      { name: 'Pricing', slug: '/pricing', elements: [n, pageHero('Pricing', 'Transparent pricing that scales with your business.'), pricingPage([
        { name: 'Startup', price: '$0/mo', desc: 'For early-stage companies', features: 'Up to $50K monthly volume\n2.9% + 30¢ per transaction\nBasic analytics\nEmail support\nStandard payouts', popular: false },
        { name: 'Growth', price: '$199/mo', desc: 'For scaling businesses', features: 'Up to $2M monthly volume\n2.4% + 25¢ per transaction\nAdvanced analytics\nPriority support\nSame-day payouts\nMulti-currency', popular: true },
        { name: 'Enterprise', price: 'Custom', desc: 'For large organisations', features: 'Unlimited volume\nCustom rates\nDedicated manager\n99.99% SLA\nCustom integrations\nSOC 2 reports', popular: false },
      ], accent), faqPage([
        { q: 'Is there a free trial?', a: 'Yes, the Startup plan is free forever with no credit card required. Upgrade as you grow.' },
        { q: 'Can I switch plans?', a: 'Absolutely. Upgrade or downgrade anytime. Changes take effect immediately with prorated billing.' },
        { q: 'What payment methods do you support?', a: 'Cards (Visa, MC, Amex), ACH, SEPA, wire transfers, and 50+ local payment methods globally.' },
      ]), f] },
      { name: 'About', slug: '/about', elements: [n, aboutPage('Reimagining Global\nPayment Infrastructure', 'Founded in 2021 by ex-Stripe and ex-Goldman engineers, VaultPay is on a mission to make financial infrastructure accessible to every business on the planet.', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=900&fit=crop', [{ title: 'Mission-Driven', desc: 'We believe every business deserves world-class financial tools.' }, { title: 'Security-First', desc: 'SOC 2, PCI DSS, and ISO 27001 certified from day one.' }, { title: 'Customer-Obsessed', desc: 'Our NPS is 82 — among the highest in enterprise SaaS.' }]), statsSection([{ value: '350+', label: 'Team Members' }, { value: '$180B', label: 'Processed' }, { value: '4', label: 'Global Offices' }, { value: '82', label: 'NPS Score' }], { accent }), ctaBanner('Our Mission', 'To build the most reliable, accessible, and intelligent payment infrastructure on earth.', 'Learn More', accent), f] },
      { name: 'Blog', slug: '/blog', elements: [n, pageHero('Blog', 'Insights on payments, fintech, and financial operations.'), blogSection([
        { title: 'The Future of Cross-Border Payments in 2026', excerpt: 'How real-time settlement networks are eliminating the friction of international commerce.', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', date: 'Mar 15, 2026', category: 'Fintech' },
        { title: 'SOC 2 Compliance: A Founder\'s Guide', excerpt: 'Everything you need to know about achieving and maintaining SOC 2 certification.', img: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&h=400&fit=crop', date: 'Mar 12, 2026', category: 'Security' },
        { title: 'Building a Treasury Function from Scratch', excerpt: 'Practical steps for startups ready to professionalise their cash management.', img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', date: 'Mar 8, 2026', category: 'Treasury' },
      ]), ctaBanner('Subscribe to Our Newsletter', 'Get weekly insights on payments, compliance, and fintech trends.', 'Subscribe', accent), f] },
      { name: 'Careers', slug: '/careers', elements: [n, pageHero('Careers', 'Build the financial infrastructure of tomorrow.'), statsSection([{ value: '350+', label: 'Team Size' }, { value: '42', label: 'Countries' }, { value: '100%', label: 'Remote-Friendly' }, { value: '4.8★', label: 'Glassdoor' }], { accent }), careersSection([
        { title: 'Senior Backend Engineer', department: 'Engineering', location: 'Remote', type: 'Full-time' },
        { title: 'Product Designer', department: 'Design', location: 'New York / Remote', type: 'Full-time' },
        { title: 'Head of Compliance', department: 'Legal', location: 'London', type: 'Full-time' },
        { title: 'Solutions Architect', department: 'Sales', location: 'San Francisco', type: 'Full-time' },
        { title: 'Developer Advocate', department: 'Marketing', location: 'Remote', type: 'Full-time' },
      ]), ctaBanner('Don\'t See Your Role?', 'We\'re always looking for exceptional talent. Send us your CV.', 'Get In Touch', accent), f] },
      { name: 'Case Studies', slug: '/case-studies', elements: [n, pageHero('Case Studies', 'Real results from real customers.'), caseStudySection([
        { title: 'TechCorp Global', desc: 'How TechCorp reduced payment costs by 62% and eliminated manual reconciliation across 14 entities.', result: '62% cost reduction · 3 day implementation', img: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=500&fit=crop' },
        { title: 'MegaRetail', desc: 'Scaling from 1,000 to 100,000 daily transactions with zero downtime during peak holiday season.', result: '100x scale · 99.99% uptime · $4.2M saved', img: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&h=500&fit=crop' },
      ]), testimonials5('More Success Stories', [
        { quote: 'The migration was seamless. Our team was up and running in two days.', name: 'Alex Rivera', role: 'CTO, FastShip' },
        { quote: 'VaultPay\'s compliance tools saved us from hiring three additional compliance officers.', name: 'Nina Okonkwo', role: 'Head of Finance, GlobalPay' },
        { quote: 'Best developer experience I\'ve seen in fintech. The docs are exceptional.', name: 'Tom Zheng', role: 'Lead Engineer, PayFlow' },
      ]), f] },
      { name: 'FAQ', slug: '/faq', elements: [n, pageHero('FAQ', 'Everything you need to know about VaultPay.'), faqPage([
        { q: 'How long does integration take?', a: 'Most teams are live within 1-3 days. Our SDK and comprehensive docs make integration straightforward.' },
        { q: 'Is VaultPay PCI compliant?', a: 'Yes, we are PCI DSS Level 1 certified — the highest level of security certification in the payments industry.' },
        { q: 'What currencies do you support?', a: 'We support 40+ currencies for processing and 140+ currencies for cross-border transfers.' },
        { q: 'Do you offer sandbox testing?', a: 'Yes, our sandbox environment mirrors production with test cards, bank accounts, and webhooks.' },
        { q: 'What\'s your uptime guarantee?', a: 'We guarantee 99.99% uptime in our SLA, backed by financial credits.' },
        { q: 'Can I migrate from another provider?', a: 'Yes, we offer free assisted migration from Stripe, Adyen, Braintree, and other major providers.' },
      ]), ctaBanner('Still Have Questions?', 'Our team is here to help. Get in touch for a personalised walkthrough.', 'Contact Us', accent), f] },
      { name: 'Contact', slug: '/contact', elements: [n, pageHero('Contact Us', 'We\'d love to hear from you.'), contactPage(), ctaBanner('Enterprise Enquiries', 'For custom pricing, SLA, and dedicated account management.', 'Schedule a Call', accent), f] },
    ];

    return { id: 'fintech-saas-v5', name: 'Fintech SaaS Platform', description: 'Ultra-premium fintech platform with 10 pages — payments, treasury, compliance', category: 'Finance', elements: pages[0].elements, pages };
  })(),

  // ── 2. LUXURY ARCHITECTURE FIRM ──────────────────────────────
  (() => {
    const brand = 'ATELIER NOIR';
    const accent = 'linear-gradient(135deg, #d4a574, #c4956a)';
    const accentSolid = '#d4a574';
    const links = ['Portfolio', 'Services', 'About', 'Process', 'Awards', 'Journal', 'Careers', 'FAQ', 'Contact'];
    const n = nav5(brand, links, accentSolid);
    const f = foot5(brand, [
      { title: 'Studio', links: ['Portfolio', 'Services', 'Process', 'Awards'] },
      { title: 'Insight', links: ['Journal', 'Press', 'Publications'] },
      { title: 'Connect', links: ['Contact', 'Careers', 'Collaboration'] },
      { title: 'Legal', links: ['Privacy', 'Terms', 'Impressum'] },
    ]);

    const home: EditorElement[] = [
      heroSplit5('Architecture\nThat Transcends', 'Award-winning residential and cultural architecture. We design spaces that challenge convention and inspire wonder.', 'View Our Work', 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=900&fit=crop', { badge: 'AIA GOLD MEDAL 2025', accent: accentSolid }),
      logoBanner(['Architectural Digest', 'Dezeen', 'Wallpaper*', 'Dwell', 'Frame']),
      statsSection([{ value: '200+', label: 'Projects Completed' }, { value: '14', label: 'International Awards' }, { value: '8', label: 'Countries' }, { value: '32', label: 'Years of Practice' }], { accent: accentSolid }),
      galleryGrid('Selected Works', [
        { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', alt: 'Villa Serena' },
        { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', alt: 'Oceanfront Residence' },
        { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop', alt: 'The Glass Pavilion' },
      ]),
      bentoGrid('Our Philosophy', 'Every line, material, and space serves a purpose.', [
        { icon: '◻️', title: 'Minimalist Form', desc: 'We believe in the power of restraint — designs that breathe with generous proportions and clean geometry.' },
        { icon: '🌿', title: 'Biophilic Design', desc: 'Integrating nature into every project through living walls, natural materials, and passive ventilation.' },
        { icon: '♻️', title: 'Sustainable Practice', desc: 'Net-zero carbon design, recycled materials, and LEED Platinum certification on every project.' },
      ], { accent: accentSolid }),
      testimonials5('Client Voices', [
        { quote: 'They didn\'t just design a house — they designed a feeling. Every room tells a story.', name: 'Isabella Rossi', role: 'Private Client, Milan' },
        { quote: 'Atelier Noir understood our vision for the museum before we could articulate it ourselves.', name: 'Dr. Henrik Andersen', role: 'Director, Nordic Art Foundation' },
      ]),
      ctaBanner('Begin Your Vision', 'Every great space starts with a conversation. Let\'s design something extraordinary.', 'Start a Project', accentSolid),
    ];

    const pages: TemplatePage[] = [
      { name: 'Home', slug: '/', elements: [n, ...home, f] },
      { name: 'Portfolio', slug: '/portfolio', elements: [n, pageHero('Portfolio', 'A curated selection of our most significant works.'), galleryGrid('Residential', [
        { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', alt: 'Villa Serena' },
        { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', alt: 'Cliffside Estate' },
        { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop', alt: 'Glass Pavilion' },
      ]), galleryGrid('Cultural & Commercial', [
        { src: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop', alt: 'Nordic Art Museum' },
        { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop', alt: 'Corporate HQ' },
        { src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&h=400&fit=crop', alt: 'Cultural Centre' },
      ]), ctaBanner('Commission a Project', 'We take on a limited number of projects each year to ensure exceptional quality.', 'Enquire', accentSolid), f] },
      { name: 'Services', slug: '/services', elements: [n, pageHero('Services', 'End-to-end architectural excellence.'), servicesSection('What We Do', 'From concept to completion, we handle every detail.', [
        { name: 'Architectural Design', desc: 'Full-service residential and commercial architecture from schematic design through construction administration.', icon: '📐' },
        { name: 'Interior Architecture', desc: 'Cohesive interior environments that harmonise with the architectural language of each project.', icon: '🏠' },
        { name: 'Master Planning', desc: 'Large-scale urban and campus planning that considers community, ecology, and long-term sustainability.', icon: '🗺️' },
        { name: 'Renovation & Restoration', desc: 'Sensitive renovation of historic structures and adaptive reuse of existing buildings.', icon: '🏛️' },
      ]), processTimeline([{ step: '01', title: 'Vision', desc: 'Deep listening sessions to understand your aspirations, lifestyle, and aesthetic sensibility.' }, { step: '02', title: 'Concept', desc: 'Schematic explorations in sketches, models, and 3D renderings.' }, { step: '03', title: 'Development', desc: 'Technical drawings, material selection, and engineering coordination.' }, { step: '04', title: 'Realisation', desc: 'Construction oversight ensuring every detail matches the design intent.' }], `${accentSolid}50`), f] },
      { name: 'About', slug: '/about', elements: [n, aboutPage('Three Decades of\nDesign Excellence', 'Founded in 1994 in Copenhagen, Atelier Noir has grown into an internationally recognised practice with studios in Copenhagen, New York, and Tokyo.', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=900&fit=crop', [{ title: 'Design Integrity', desc: 'Every project reflects an uncompromising commitment to craft and innovation.' }, { title: 'Collaboration', desc: 'We work as one team with clients, engineers, and craftspeople.' }, { title: 'Legacy', desc: 'Designing buildings that will inspire for generations.' }]), teamGrid([
        { name: 'Lars Nordström', role: 'Founding Principal', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face' },
        { name: 'Yuki Sato', role: 'Design Director, Tokyo', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face' },
        { name: 'Marcus Cole', role: 'Partner, New York', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face' },
        { name: 'Sofia Almeida', role: 'Head of Sustainability', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face' },
      ]), f] },
      { name: 'Process', slug: '/process', elements: [n, pageHero('Our Process', 'A rigorous yet intuitive approach to design.'), processTimeline([{ step: '01', title: 'Discovery & Brief', desc: 'Site visits, stakeholder interviews, and programme analysis to establish a clear design brief.' }, { step: '02', title: 'Concept Design', desc: 'Multiple design directions explored through physical models, sketches, and digital visualisations.' }, { step: '03', title: 'Design Development', desc: 'Detailed drawings, material specifications, and coordination with structural and MEP engineers.' }, { step: '04', title: 'Documentation', desc: 'Complete construction documents, tender packages, and contractor selection support.' }, { step: '05', title: 'Construction', desc: 'Regular site inspections and quality assurance throughout the build process.' }], `${accentSolid}50`), caseStudySection([{ title: 'Villa Serena, Amalfi Coast', desc: 'A 800sqm cliff-edge residence that merges seamlessly with the Mediterranean landscape through cantilevered terraces and retractable glass walls.', result: 'AIA Honor Award · Architectural Digest Best Homes 2025', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop' }]), f] },
      { name: 'Awards', slug: '/awards', elements: [n, pageHero('Awards & Recognition', 'Recognised by the world\'s most prestigious architectural institutions.'), el('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
        el('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto' } }, [
          ...['AIA Gold Medal 2025', 'RIBA International Prize 2024', 'Dezeen Awards — Studio of the Year 2024', 'Pritzker Prize Shortlist 2023', 'Mies van der Rohe Award 2023', 'A+D Best Residential 2022'].map((award, i) =>
            a(el('container', {}, { desktop: { padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
              el('heading', { text: award, level: 'h4' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff' } }),
              el('text', { text: '🏆' }, { desktop: { fontSize: '24px' } }),
            ]), { ...A_FADE, delay: i * 0.08 })
          ),
        ]),
      ], 'Awards'), f] },
      { name: 'Journal', slug: '/journal', elements: [n, pageHero('Journal', 'Thoughts on architecture, design, and the built environment.'), blogSection([
        { title: 'The Role of Light in Residential Design', excerpt: 'How natural light shapes our experience of space and why it should drive every design decision.', img: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop', date: 'Mar 18, 2026', category: 'Design' },
        { title: 'Sustainable Materials: Beyond Bamboo', excerpt: 'Exploring innovative sustainable materials that offer beauty without compromising the planet.', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', date: 'Mar 10, 2026', category: 'Sustainability' },
        { title: 'Why We Still Make Physical Models', excerpt: 'In an age of VR and 3D rendering, physical models remain our most powerful design tool.', img: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=400&fit=crop', date: 'Feb 28, 2026', category: 'Process' },
      ]), f] },
      { name: 'Careers', slug: '/careers', elements: [n, pageHero('Join Our Studio', 'We\'re looking for talented architects and designers who share our values.'), careersSection([
        { title: 'Senior Architect', department: 'Design', location: 'Copenhagen', type: 'Full-time' },
        { title: 'Interior Designer', department: 'Interiors', location: 'New York', type: 'Full-time' },
        { title: 'Sustainability Consultant', department: 'Research', location: 'Remote', type: 'Full-time' },
        { title: 'Junior Architect', department: 'Design', location: 'Tokyo', type: 'Full-time' },
      ]), ctaBanner('Open Applications', 'Don\'t see a listed role? We\'re always interested in hearing from exceptional talent.', 'Send Your Portfolio', accentSolid), f] },
      { name: 'FAQ', slug: '/faq', elements: [n, pageHero('FAQ', 'Common questions about working with Atelier Noir.'), faqPage([
        { q: 'What is your design fee structure?', a: 'We typically charge a percentage of construction cost, ranging from 8-15% depending on scope and complexity.' },
        { q: 'How long does a typical project take?', a: 'Residential projects take 12-24 months from concept to completion. Larger cultural projects can take 3-5 years.' },
        { q: 'Do you work internationally?', a: 'Yes, we have completed projects across 8 countries and maintain studios in Copenhagen, New York, and Tokyo.' },
        { q: 'What size projects do you take on?', a: 'We work across scales — from intimate residential renovations to large cultural institutions.' },
        { q: 'Do you handle interior design?', a: 'Yes, our interior architecture team works hand-in-hand with the architecture team for cohesive results.' },
      ]), f] },
      { name: 'Contact', slug: '/contact', elements: [n, pageHero('Get In Touch', 'Let\'s discuss your next project.'), contactPage(), f] },
    ];

    return { id: 'architecture-v5', name: 'Luxury Architecture Firm', description: 'Award-winning architecture studio with portfolio, awards, journal — 10 pages', category: 'Creative', elements: pages[0].elements, pages };
  })(),

  // ── 3. HEALTH & WELLNESS SPA ──────────────────────────────────
  (() => {
    const brand = 'SERENOVA';
    const accent = '#8b5cf6';
    const links = ['Treatments', 'Membership', 'About', 'Wellness', 'Gallery', 'Retreat', 'Team', 'FAQ', 'Book'];
    const n = nav5(brand, links, accent);
    const f = foot5(brand, [
      { title: 'Experience', links: ['Treatments', 'Membership', 'Retreats', 'Gift Cards'] },
      { title: 'Wellness', links: ['Journal', 'Recipes', 'Meditation', 'Workshops'] },
      { title: 'About', links: ['Our Story', 'Team', 'Sustainability', 'Press'] },
      { title: 'Visit', links: ['Hours', 'Directions', 'Parking', 'Contact'] },
    ]);

    const home: EditorElement[] = [
      heroCinematic('Find Your\nInner Stillness', 'A sanctuary for mind, body, and spirit. Experience transformative wellness in a setting of extraordinary natural beauty.', 'Book a Treatment', 'Explore Retreats', { badge: 'VOTED #1 DESTINATION SPA 2025', gradient: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(139,92,246,0.1) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(168,85,247,0.06) 0%, transparent 60%)', accent }),
      statsSection([{ value: '15K+', label: 'Guests Annually' }, { value: '98%', label: 'Return Rate' }, { value: '50+', label: 'Treatments' }, { value: '4.9★', label: 'Rating' }]),
      bentoGrid('The Serenova Experience', 'Holistic wellness programmes designed by world-leading practitioners.', [
        { icon: '🧖', title: 'Signature Treatments', desc: 'Bespoke facials, deep-tissue massage, and ancient Ayurvedic rituals using organic products.' },
        { icon: '🧘', title: 'Mindfulness & Yoga', desc: 'Daily guided meditation, vinyasa flow, and sound healing sessions in our ocean-view studio.' },
        { icon: '🍃', title: 'Hydrotherapy Circuit', desc: 'Finnish sauna, Japanese onsen, cold plunge pools, and a Himalayan salt cave.' },
        { icon: '🥗', title: 'Nourishment', desc: 'Plant-forward cuisine crafted by our Michelin-trained chef using ingredients from our organic garden.' },
        { icon: '🌅', title: 'Nature Immersion', desc: 'Forest bathing, coastal walks, and sunrise meditation on our private clifftop terrace.' },
        { icon: '💤', title: 'Sleep Optimisation', desc: 'Scientifically designed sleep programmes, temperature-controlled suites, and circadian lighting.' },
      ]),
      testimonials5('Guest Experiences', [
        { quote: 'Three days at Serenova changed my relationship with stress entirely. I\'ve never felt so deeply rested.', name: 'Olivia Chen', role: 'Author & Wellness Advocate' },
        { quote: 'The hydrotherapy circuit is genuinely world-class. Better than anything I\'ve experienced in Japan or Scandinavia.', name: 'Dr. James Nakamura', role: 'Integrative Medicine Physician' },
        { quote: 'My annual retreat here is non-negotiable. It\'s the foundation of my entire year\'s wellbeing.', name: 'Amara Osei', role: 'CEO, MindfulTech' },
      ]),
      ctaBanner('Begin Your Journey to Wellness', 'Limited availability. Book your transformative experience today.', 'Reserve Now', accent),
    ];

    const pages: TemplatePage[] = [
      { name: 'Home', slug: '/', elements: [n, ...home, f] },
      { name: 'Treatments', slug: '/treatments', elements: [n, pageHero('Treatments', 'A curated menu of transformative experiences.'), servicesSection('Our Treatment Menu', 'Each treatment is personalised to your needs by our expert practitioners.', [
        { name: 'Deep Tissue Restoration', desc: 'An intensive 90-minute full-body treatment targeting chronic tension and muscular imbalances. Uses heated volcanic stones and therapeutic-grade essential oils.', icon: '💆' },
        { name: 'Signature Facial Journey', desc: 'A 75-minute multi-sensory facial using our proprietary botanical formulations. Includes LED therapy, gua sha sculpting, and cryo-globes.', icon: '✨' },
        { name: 'Ayurvedic Abhyanga', desc: 'Ancient Indian oil massage technique tailored to your dosha. 60 minutes of rhythmic, meditative bodywork using warm herbal oils.', icon: '🕉️' },
        { name: 'Sound Healing Immersion', desc: 'A 60-minute vibrational therapy session using Tibetan singing bowls, crystal bowls, and tuning forks in our dedicated sound chamber.', icon: '🔔' },
        { name: 'Hydrotherapy Journey', desc: '2-hour self-guided circuit through Finnish sauna, Japanese onsen, cold plunge, steam room, and salt cave.', icon: '🌊' },
        { name: 'Forest Bathing Experience', desc: 'A guided 90-minute shinrin-yoku session through our private ancient woodland with mindfulness practices.', icon: '🌲' },
      ]), pricingPage([
        { name: 'Single Session', price: '$189', desc: 'Individual treatment', features: '60-minute treatment\nRobe & slippers\nHerbal tea service\nRelaxation lounge access', popular: false },
        { name: 'Half-Day Ritual', price: '$449', desc: 'The complete experience', features: '2 signature treatments\nHydrotherapy circuit\nOrganic lunch\nAll-day lounge access\nAmenity kit', popular: true },
        { name: 'Full-Day Immersion', price: '$749', desc: 'Total transformation', features: '3 treatments of choice\nAll facilities access\n3-course organic dining\nYoga & meditation class\nTake-home products', popular: false },
      ], accent), f] },
      { name: 'Membership', slug: '/membership', elements: [n, pageHero('Membership', 'Exclusive access for devoted wellness seekers.'), pricingPage([
        { name: 'Serenity', price: '$299/mo', desc: 'Essential wellness', features: '2 treatments per month\nUnlimited hydrotherapy\nYoga class access\n10% retail discount\nPriority booking', popular: false },
        { name: 'Harmony', price: '$499/mo', desc: 'Complete wellness', features: '4 treatments per month\nUnlimited facilities\nAll classes included\n20% retail discount\nGuest passes (2/mo)\nAnnual retreat discount', popular: true },
        { name: 'Transcendence', price: '$899/mo', desc: 'Ultimate experience', features: 'Unlimited treatments\nPrivate wellness suite\nPersonal wellness coach\n30% retail discount\n1 free retreat/year\nVIP concierge', popular: false },
      ], accent), testimonials5('Member Stories', [
        { quote: 'The Harmony membership has transformed my weekly routine. I look forward to my visits like nothing else.', name: 'Katherine Leigh', role: 'Harmony Member, 3 Years' },
        { quote: 'Worth every penny. The private wellness suite and personal coach have been life-changing.', name: 'David Okonkwo', role: 'Transcendence Member' },
      ]), f] },
      { name: 'About', slug: '/about', elements: [n, aboutPage('A Vision Born\nFrom Stillness', 'Founded in 2018 by wellness visionary Dr. Aria Kimura, Serenova was created to be the world\'s most holistic destination spa — a place where ancient wisdom meets modern science.', 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=1200&h=900&fit=crop', [{ title: 'Holistic Philosophy', desc: 'We treat the whole person — mind, body, and spirit — not just symptoms.' }, { title: 'Science-Backed', desc: 'Every programme is developed with input from doctors, neuroscientists, and traditional healers.' }, { title: 'Sustainable Luxury', desc: 'Zero-waste operations, organic products, and carbon-neutral facilities.' }]), statsSection([{ value: '50+', label: 'Expert Practitioners' }, { value: '15K', label: 'Annual Guests' }, { value: '98%', label: 'Satisfaction' }, { value: '#1', label: 'Destination Spa' }], { accent }), f] },
      { name: 'Wellness', slug: '/wellness', elements: [n, pageHero('Wellness Journal', 'Insights for a more balanced, mindful life.'), blogSection([
        { title: 'The Science of Cold Water Immersion', excerpt: 'Why cold plunges are the most powerful tool for nervous system regulation and longevity.', img: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop', date: 'Mar 20, 2026', category: 'Science' },
        { title: 'Morning Rituals for Inner Peace', excerpt: 'Our practitioners share their personal morning routines for starting each day with clarity and calm.', img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop', date: 'Mar 14, 2026', category: 'Mindfulness' },
        { title: 'Seasonal Eating: Spring Edition', excerpt: 'Chef Laurent shares recipes using spring ingredients from our organic garden.', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop', date: 'Mar 8, 2026', category: 'Nutrition' },
      ]), f] },
      { name: 'Gallery', slug: '/gallery', elements: [n, pageHero('Gallery', 'A visual tour of our sanctuary.'), galleryGrid('The Spaces', [
        { src: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=600&h=400&fit=crop', alt: 'Entrance' },
        { src: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop', alt: 'Treatment Room' },
        { src: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&h=400&fit=crop', alt: 'Yoga Studio' },
        { src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop', alt: 'Pool' },
        { src: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop', alt: 'Restaurant' },
        { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop', alt: 'Garden' },
      ]), f] },
      { name: 'Retreats', slug: '/retreat', elements: [n, pageHero('Wellness Retreats', 'Multi-day immersive programmes for deep transformation.'), servicesSection('Retreat Programmes', 'Intensive multi-day wellness journeys.', [
        { name: '3-Day Reset', desc: 'A weekend programme focused on stress reduction, sleep restoration, and digital detox. Includes 6 treatments, all meals, and guided activities.', icon: '🌅' },
        { name: '5-Day Deep Dive', desc: 'A comprehensive mid-week retreat with personalised wellness assessment, daily treatments, fitness coaching, and nutritional counselling.', icon: '🌊' },
        { name: '7-Day Transformation', desc: 'Our flagship retreat. A full week of immersive wellness including health screening, bespoke treatment plan, private chef, and follow-up coaching.', icon: '🦋' },
        { name: 'Corporate Wellness', desc: 'Tailored group programmes for executive teams. Includes team workshops, individual treatments, and wellness strategy sessions.', icon: '🏢' },
      ]), ctaBanner('Reserve Your Retreat', 'Limited to 12 guests per session for an intimate experience.', 'Enquire Now', accent), f] },
      { name: 'Team', slug: '/team', elements: [n, pageHero('Our Practitioners', 'World-class expertise across every discipline.'), teamGrid([
        { name: 'Dr. Aria Kimura', role: 'Founder & Wellness Director', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face' },
        { name: 'Laurent Dubois', role: 'Executive Chef', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face' },
        { name: 'Maya Andersson', role: 'Head of Bodywork', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face' },
        { name: 'Kenji Tanaka', role: 'Yoga & Meditation Lead', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face' },
      ]), f] },
      { name: 'FAQ', slug: '/faq', elements: [n, pageHero('FAQ', 'Everything you need to plan your visit.'), faqPage([
        { q: 'What should I bring?', a: 'Just yourself. We provide robes, slippers, towels, and a full range of organic bath and body products.' },
        { q: 'Are treatments suitable for pregnancy?', a: 'Yes, we offer a dedicated prenatal treatment menu. Please inform us at booking so we can tailor your experience.' },
        { q: 'Can I visit for just the day?', a: 'Yes, day passes include access to all hydrotherapy facilities, fitness centre, and relaxation lounges.' },
        { q: 'Do you cater to dietary requirements?', a: 'Absolutely. Our kitchen accommodates all dietary needs including vegan, gluten-free, and allergy-specific menus.' },
        { q: 'Is there parking?', a: 'Free valet parking is available for all guests. Electric vehicle charging stations are also provided.' },
      ]), ctaBanner('Ready to Visit?', 'Book your experience online or call our concierge team.', 'Book Now', accent), f] },
      { name: 'Contact', slug: '/book', elements: [n, pageHero('Book Your Experience', 'We\'re here to help you plan the perfect visit.'), contactPage(), f] },
    ];

    return { id: 'wellness-spa-v5', name: 'Luxury Wellness Spa', description: 'Premium spa & wellness destination with treatments, retreats, membership — 10 pages', category: 'Health', elements: pages[0].elements, pages };
  })(),

  // ── 4. CREATIVE AGENCY ──────────────────────────────────────
  (() => {
    const brand = 'PRISMATIC';
    const accent = '#f43f5e';
    const links = ['Work', 'Services', 'About', 'Process', 'Careers', 'Journal', 'Case Studies', 'FAQ', 'Contact'];
    const n = nav5(brand, links, accent);
    const f = foot5(brand, [
      { title: 'Studio', links: ['Work', 'Services', 'Process', 'Case Studies'] },
      { title: 'Culture', links: ['About', 'Careers', 'Values', 'Diversity'] },
      { title: 'Insights', links: ['Journal', 'Podcast', 'Events'] },
      { title: 'Legal', links: ['Privacy', 'Terms'] },
    ]);

    const home: EditorElement[] = [
      heroCinematic('We Make Brands\nImpossible to Ignore', 'Award-winning creative agency specialising in brand identity, digital experience, and campaign strategy for the world\'s most ambitious companies.', 'Start a Project', 'View Our Work', { badge: 'CANNES LIONS 2025 — AGENCY OF THE YEAR', gradient: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(244,63,94,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(251,146,60,0.06) 0%, transparent 60%)', accent }),
      logoBanner(['Nike', 'Spotify', 'Airbnb', 'Tesla', 'Apple', 'Google']),
      galleryGrid('Selected Work', [
        { src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop', alt: 'Nike Rebrand' },
        { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop', alt: 'Spotify Campaign' },
        { src: 'https://images.unsplash.com/photo-1561070791-36c11767b26a?w=600&h=400&fit=crop', alt: 'Tesla Digital' },
      ]),
      statsSection([{ value: '300+', label: 'Projects Delivered' }, { value: '47', label: 'Industry Awards' }, { value: '92%', label: 'Client Retention' }, { value: '6', label: 'Global Studios' }]),
      bentoGrid('What We Do', 'End-to-end creative services that transform brands and drive culture.', [
        { icon: '🎨', title: 'Brand Identity', desc: 'Strategic brand positioning, visual identity systems, naming, and brand architecture for lasting impact.' },
        { icon: '💻', title: 'Digital Experience', desc: 'Immersive websites, interactive installations, and digital products that push creative boundaries.' },
        { icon: '📱', title: 'Campaign Strategy', desc: 'Integrated campaigns across digital, social, OOH, and experiential that generate cultural conversations.' },
      ]),
      testimonials5('Client Voices', [
        { quote: 'Prismatic didn\'t just rebrand us — they redefined what our category could be. Revenue up 340%.', name: 'Elena Volkov', role: 'CMO, Velocity' },
        { quote: 'The most creatively fearless agency we\'ve ever worked with. They pushed us in the best ways.', name: 'Marcus Thompson', role: 'VP Brand, Nexus' },
        { quote: 'Their campaign went viral organically. 2.8 billion impressions without a single paid placement.', name: 'Yuki Tanaka', role: 'Global Marketing Lead, Orbit' },
      ]),
      ctaBanner('Let\'s Create Something Legendary', 'We take on 12 new clients per year. Start the conversation today.', 'Start a Project', accent),
    ];

    const pages: TemplatePage[] = [
      { name: 'Home', slug: '/', elements: [n, ...home, f] },
      { name: 'Work', slug: '/work', elements: [n, pageHero('Our Work', 'A selection of brand-defining projects.'), galleryGrid('Brand Identity', [
        { src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop', alt: 'Nike' },
        { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop', alt: 'Spotify' },
        { src: 'https://images.unsplash.com/photo-1561070791-36c11767b26a?w=600&h=400&fit=crop', alt: 'Tesla' },
      ]), galleryGrid('Digital & Campaign', [
        { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', alt: 'Digital Platform' },
        { src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop', alt: 'Campaign' },
        { src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', alt: 'Experience' },
      ]), ctaBanner('Have a Brief?', 'We\'d love to hear about your next project.', 'Get In Touch', accent), f] },
      { name: 'Services', slug: '/services', elements: [n, pageHero('Services', 'Creative solutions across every touchpoint.'), servicesSection('Our Capabilities', 'Full-spectrum creative services.', [
        { name: 'Brand Strategy', desc: 'Market research, competitive analysis, brand positioning, architecture, and go-to-market strategy.', icon: '🎯' },
        { name: 'Visual Identity', desc: 'Logo design, typography, color systems, illustration, iconography, and comprehensive brand guidelines.', icon: '✏️' },
        { name: 'Digital Design', desc: 'Websites, apps, digital products, interactive installations, and immersive experiences.', icon: '🖥️' },
        { name: 'Campaign & Content', desc: 'Integrated campaigns, social content, video production, photography, and copywriting.', icon: '📸' },
        { name: 'Motion & 3D', desc: 'Animation, motion graphics, 3D visualization, AR/VR experiences, and generative art.', icon: '🎬' },
        { name: 'Environmental Design', desc: 'Retail environments, exhibition design, wayfinding, and spatial branding.', icon: '🏗️' },
      ]), f] },
      { name: 'About', slug: '/about', elements: [n, aboutPage('Creative Rebels\nSince 2012', 'Founded in a Brooklyn loft by three friends who believed advertising could be art. Today, Prismatic is a 200-person global creative force.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop', [{ title: 'Creative Fearlessness', desc: 'We\'d rather make something that matters than something that\'s safe.' }, { title: 'Cultural Fluency', desc: 'We don\'t just follow culture — we help shape it.' }, { title: 'Results-Driven', desc: 'Beautiful work that moves metrics. Creativity with commercial intent.' }]), teamGrid([
        { name: 'Maya Chen', role: 'Co-Founder & Chief Creative', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face' },
        { name: 'James Okonkwo', role: 'Co-Founder & Strategy Lead', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face' },
        { name: 'Sofia Reyes', role: 'Co-Founder & Managing Director', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face' },
        { name: 'Alex Petrov', role: 'Head of Digital', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face' },
      ]), f] },
      { name: 'Process', slug: '/process', elements: [n, pageHero('Our Process', 'How we transform a brief into a brand.'), processTimeline([{ step: '01', title: 'Immersion', desc: 'We dive deep into your world — your customers, competitors, culture, and category.' }, { step: '02', title: 'Strategy', desc: 'We define the strategic territory — positioning, messaging, and creative direction.' }, { step: '03', title: 'Creation', desc: 'Concept development, design exploration, and iterative prototyping.' }, { step: '04', title: 'Refinement', desc: 'Testing, client feedback, and meticulous craft to bring the vision to perfection.' }, { step: '05', title: 'Launch', desc: 'Coordinated rollout across all channels with measurement and optimisation.' }], `${accent}50`), f] },
      { name: 'Careers', slug: '/careers', elements: [n, pageHero('Join the Team', 'We\'re building the most creatively ambitious agency on earth.'), statsSection([{ value: '200+', label: 'Team Size' }, { value: '6', label: 'Studios' }, { value: '42', label: 'Nationalities' }, { value: '4.9★', label: 'Glassdoor' }]), careersSection([
        { title: 'Senior Art Director', department: 'Creative', location: 'New York', type: 'Full-time' },
        { title: 'UX/UI Designer', department: 'Digital', location: 'London', type: 'Full-time' },
        { title: 'Strategy Director', department: 'Strategy', location: 'Brooklyn', type: 'Full-time' },
        { title: 'Motion Designer', department: 'Creative', location: 'Los Angeles / Remote', type: 'Full-time' },
        { title: 'Copywriter', department: 'Creative', location: 'Tokyo', type: 'Full-time' },
        { title: 'Account Director', department: 'Client Services', location: 'London', type: 'Full-time' },
      ]), ctaBanner('No Perfect Role?', 'Send us your portfolio. Great talent gets noticed regardless.', 'Open Application', accent), f] },
      { name: 'Journal', slug: '/journal', elements: [n, pageHero('Journal', 'Ideas, opinions, and behind-the-scenes.'), blogSection([
        { title: 'Why Brand Guidelines Are Dead', excerpt: 'How living brand systems are replacing static PDFs and why your brand needs one.', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop', date: 'Mar 19, 2026', category: 'Branding' },
        { title: 'The AI Creative Director', excerpt: 'How we\'re using generative AI as a collaborative tool — not a replacement — in our creative process.', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop', date: 'Mar 11, 2026', category: 'Technology' },
        { title: 'Behind the Campaign: Orbit', excerpt: 'How a single tweet turned into a global movement — the making of our most viral work.', img: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop', date: 'Mar 3, 2026', category: 'Case Study' },
      ]), f] },
      { name: 'Case Studies', slug: '/case-studies', elements: [n, pageHero('Case Studies', 'Deep dives into our most impactful work.'), caseStudySection([
        { title: 'Velocity — Complete Brand Overhaul', desc: 'A radical rebrand that repositioned a legacy fintech as the category\'s most desirable brand, increasing awareness by 280%.', result: '280% brand awareness increase · Cannes Grand Prix', img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=500&fit=crop' },
        { title: 'Orbit — The 2.8 Billion Campaign', desc: 'An organic social campaign that generated 2.8 billion impressions without paid media, becoming a cultural phenomenon.', result: '2.8B impressions · 0 paid media spend · 89% positive sentiment', img: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop' },
      ]), statsSection([{ value: '47', label: 'Awards Won' }, { value: '340%', label: 'Avg Revenue Lift' }, { value: '92%', label: 'Client Retention' }, { value: '12', label: 'New Clients/Year' }]), f] },
      { name: 'FAQ', slug: '/faq', elements: [n, pageHero('FAQ', 'Answers to common questions about working with us.'), faqPage([
        { q: 'What\'s your minimum project budget?', a: 'Our typical project starts at $75K. We believe in investing adequately to create work that truly moves the needle.' },
        { q: 'How long does a branding project take?', a: 'A comprehensive brand identity takes 8-16 weeks. Campaigns typically run 6-12 weeks from brief to launch.' },
        { q: 'Do you work with startups?', a: 'Yes, about 30% of our clients are venture-backed startups. We offer streamlined packages for earlier-stage companies.' },
        { q: 'What makes Prismatic different?', a: 'We combine the creative ambition of an indie studio with the strategic rigour of a consultancy. We don\'t just make pretty things — we make things that work.' },
      ]), f] },
      { name: 'Contact', slug: '/contact', elements: [n, pageHero('Start a Conversation', 'Tell us about your ambitions.'), contactPage(), ctaBanner('Prefer a Call?', 'Schedule a 30-minute discovery call with our new business team.', 'Book a Call', accent), f] },
    ];

    return { id: 'creative-agency-v5', name: 'Creative Agency', description: 'Award-winning creative agency with work, case studies, careers — 10 pages', category: 'Agency', elements: pages[0].elements, pages };
  })(),

  // ── 5. PREMIUM E-LEARNING PLATFORM ──────────────────────────
  (() => {
    const brand = 'LUMINEX';
    const accent = '#3b82f6';
    const links = ['Courses', 'Pricing', 'About', 'Instructors', 'Blog', 'Enterprise', 'Community', 'FAQ', 'Contact'];
    const n = nav5(brand, links, accent);
    const f = foot5(brand, [
      { title: 'Learn', links: ['Courses', 'Paths', 'Certifications', 'Free Resources'] },
      { title: 'Business', links: ['Enterprise', 'Teams', 'Partnerships', 'API'] },
      { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
      { title: 'Support', links: ['Help Centre', 'Community', 'FAQ', 'Contact'] },
    ]);

    const home: EditorElement[] = [
      heroCinematic('Learn From the\nWorld\'s Best', 'Master in-demand skills with courses designed and taught by industry leaders from Google, Meta, OpenAI, and Stanford.', 'Start Learning Free', 'View Courses', { badge: '500K+ LEARNERS · 4.9★ AVERAGE RATING', gradient: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(59,130,246,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(99,102,241,0.08) 0%, transparent 60%)', accent }),
      logoBanner(['Google', 'Meta', 'OpenAI', 'Stanford', 'MIT', 'NASA']),
      statsSection([{ value: '500K+', label: 'Active Learners' }, { value: '1,200+', label: 'Expert-Led Courses' }, { value: '4.9★', label: 'Average Rating' }, { value: '94%', label: 'Completion Rate' }]),
      bentoGrid('Why Luminex?', 'Not just another learning platform — a complete career transformation engine.', [
        { icon: '🎓', title: 'Expert Instructors', desc: 'Learn from practitioners at the top of their field — not academics teaching from textbooks.' },
        { icon: '🛤️', title: 'Career Paths', desc: 'Structured learning journeys from beginner to expert, mapped to real-world job requirements.' },
        { icon: '🏆', title: 'Industry Certifications', desc: 'Earn certificates recognised by Fortune 500 companies and leading tech firms.' },
        { icon: '👥', title: 'Community', desc: 'Join 500K+ learners in study groups, mentorship circles, and networking events.' },
        { icon: '🤖', title: 'AI-Powered Learning', desc: 'Adaptive curriculum that personalises to your pace, style, and goals.' },
        { icon: '💼', title: 'Job Placement', desc: 'Exclusive job board and hiring partnerships with 200+ companies worldwide.' },
      ]),
      testimonials5('Learner Success Stories', [
        { quote: 'I went from junior developer to senior engineer at Google in 18 months, largely thanks to Luminex courses.', name: 'Priya Sharma', role: 'Senior Engineer, Google' },
        { quote: 'The AI/ML career path was the best investment I\'ve ever made. Landed a $250K role at OpenAI.', name: 'Marcus Johnson', role: 'ML Engineer, OpenAI' },
        { quote: 'As a career switcher, Luminex gave me the structured path I needed. Now I lead a design team at Figma.', name: 'Elena Kim', role: 'Design Lead, Figma' },
      ]),
      ctaBanner('Start Your Transformation', 'Join 500K+ learners. First course free, no credit card required.', 'Get Started Free', accent),
    ];

    const pages: TemplatePage[] = [
      { name: 'Home', slug: '/', elements: [n, ...home, f] },
      { name: 'Courses', slug: '/courses', elements: [n, pageHero('Course Library', 'Over 1,200 expert-led courses across 40+ categories.'), bentoGrid('Popular Categories', 'Explore our most in-demand learning tracks.', [
        { icon: '💻', title: 'Software Engineering', desc: 'Full-stack development, system design, algorithms, cloud architecture, and DevOps.' },
        { icon: '🤖', title: 'AI & Machine Learning', desc: 'Deep learning, NLP, computer vision, MLOps, and generative AI applications.' },
        { icon: '🎨', title: 'Product Design', desc: 'UX research, UI design, design systems, prototyping, and accessibility.' },
        { icon: '📊', title: 'Data Science', desc: 'Statistical analysis, data engineering, visualisation, and business intelligence.' },
        { icon: '📱', title: 'Mobile Development', desc: 'iOS, Android, React Native, Flutter, and cross-platform app development.' },
        { icon: '🔐', title: 'Cybersecurity', desc: 'Ethical hacking, security architecture, compliance, and incident response.' },
      ], { cols: 3 }), statsSection([{ value: '1,200+', label: 'Courses' }, { value: '40+', label: 'Categories' }, { value: '300+', label: 'Instructors' }, { value: 'New', label: 'Courses Weekly' }], { accent }), ctaBanner('Can\'t Decide?', 'Take our 2-minute skill assessment to get a personalised learning plan.', 'Start Assessment', accent), f] },
      { name: 'Pricing', slug: '/pricing', elements: [n, pageHero('Pricing', 'Invest in your future.'), pricingPage([
        { name: 'Free', price: '$0', desc: 'Start learning today', features: '5 free courses\nCommunity access\nBasic certificates\nMobile app', popular: false },
        { name: 'Pro', price: '$29/mo', desc: 'Unlimited learning', features: 'All 1,200+ courses\nIndustry certifications\nAI study assistant\nOffline downloads\nPriority support\nMentor access', popular: true },
        { name: 'Teams', price: '$19/user', desc: 'For organisations', features: 'Everything in Pro\nTeam analytics\nAdmin dashboard\nCustom learning paths\nSSO integration\nDedicated CSM', popular: false },
      ], accent), faqPage([
        { q: 'Can I try before I subscribe?', a: 'Yes! 5 complete courses are free forever. No credit card required to start.' },
        { q: 'Do certificates have value?', a: 'Our certificates are recognised by 200+ companies including Google, Meta, and Amazon for hiring decisions.' },
        { q: 'Can I switch plans?', a: 'Yes, upgrade or downgrade anytime. Annual plans get 2 months free.' },
      ]), f] },
      { name: 'About', slug: '/about', elements: [n, aboutPage('Democratising\nWorld-Class Education', 'Founded in 2020 by Stanford and MIT educators who believed the world\'s best education shouldn\'t be locked behind six-figure tuition fees.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop', [{ title: 'Access for All', desc: 'Quality education regardless of geography, background, or budget.' }, { title: 'Practitioner-Led', desc: 'Every course taught by someone who\'s done the work, not just studied it.' }, { title: 'Outcome-Focused', desc: 'We measure success by career outcomes, not course completions.' }]), statsSection([{ value: '500K+', label: 'Learners' }, { value: '190+', label: 'Countries' }, { value: '$8.2B', label: 'Salary Impact' }, { value: '94%', label: 'Would Recommend' }], { accent }), f] },
      { name: 'Instructors', slug: '/instructors', elements: [n, pageHero('Our Instructors', 'Learn from the people building the future.'), teamGrid([
        { name: 'Dr. Sarah Chen', role: 'AI/ML · Ex-Google Brain', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face' },
        { name: 'James Williams', role: 'Full-Stack · Ex-Meta', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face' },
        { name: 'Yuki Sato', role: 'Product Design · Ex-Apple', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face' },
        { name: 'Alex Rivera', role: 'Cybersecurity · Ex-NSA', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop&crop=face' },
      ]), ctaBanner('Become an Instructor', 'Share your expertise with 500K+ learners. Competitive revenue share.', 'Apply to Teach', accent), f] },
      { name: 'Blog', slug: '/blog', elements: [n, pageHero('Blog', 'Insights on learning, technology, and career growth.'), blogSection([
        { title: 'The Skills That Will Matter in 2027', excerpt: 'Our analysis of 10M job postings reveals the skills that will be most valuable in the next 18 months.', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', date: 'Mar 20, 2026', category: 'Careers' },
        { title: 'How AI is Personalising Education', excerpt: 'Inside our adaptive learning engine and how it\'s achieving 94% completion rates.', img: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop', date: 'Mar 15, 2026', category: 'Technology' },
        { title: 'From Bootcamp to $200K: 5 Stories', excerpt: 'Real learners who transformed their careers through structured online education.', img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop', date: 'Mar 9, 2026', category: 'Success Stories' },
      ]), f] },
      { name: 'Enterprise', slug: '/enterprise', elements: [n, pageHero('Luminex for Enterprise', 'Upskill your entire organisation.'), bentoGrid('Enterprise Features', 'Everything teams need to learn at scale.', [
        { icon: '📊', title: 'Learning Analytics', desc: 'Track engagement, completion, and skill progression across your entire organisation.' },
        { icon: '🛤️', title: 'Custom Paths', desc: 'Build custom learning journeys aligned with your company\'s technology stack and growth goals.' },
        { icon: '🔐', title: 'SSO & Security', desc: 'SAML SSO, SCIM provisioning, and SOC 2 compliance for enterprise security requirements.' },
        { icon: '👤', title: 'Dedicated CSM', desc: 'A dedicated customer success manager to optimise your team\'s learning outcomes.' },
      ], { cols: 2 }), statsSection([{ value: '2,000+', label: 'Companies' }, { value: '40%', label: 'Faster Onboarding' }, { value: '3.2x', label: 'ROI on Training' }, { value: '94%', label: 'Employee Satisfaction' }], { accent }), ctaBanner('Scale Your Team\'s Skills', 'Book a demo to see how Luminex can transform your organisation\'s learning.', 'Request Demo', accent), f] },
      { name: 'Community', slug: '/community', elements: [n, pageHero('Community', 'Learn together. Grow together.'), bentoGrid('Community Features', 'More than courses — a global learning community.', [
        { icon: '💬', title: 'Study Groups', desc: 'Join cohort-based study groups with peers at your level working through the same material.' },
        { icon: '🧑‍🏫', title: 'Mentorship', desc: 'Connect with experienced professionals for 1:1 guidance on career and skill development.' },
        { icon: '🎤', title: 'Live Events', desc: 'Weekly live sessions, AMAs with instructors, hackathons, and networking events.' },
        { icon: '🏅', title: 'Challenges', desc: 'Monthly skill challenges with prizes, peer review, and portfolio-worthy projects.' },
      ], { cols: 2 }), statsSection([{ value: '500K+', label: 'Members' }, { value: '50K+', label: 'Study Groups' }, { value: '1,200+', label: 'Mentors' }, { value: '190+', label: 'Countries' }]), f] },
      { name: 'FAQ', slug: '/faq', elements: [n, pageHero('FAQ', 'Answers to your questions.'), faqPage([
        { q: 'How are Luminex courses different from YouTube tutorials?', a: 'Our courses are structured career paths with projects, peer review, mentorship, and industry-recognised certifications — not standalone videos.' },
        { q: 'Can I learn at my own pace?', a: 'Yes, all courses are self-paced with lifetime access. Our AI adapts the curriculum to your schedule and learning speed.' },
        { q: 'Do employers recognise Luminex certificates?', a: 'Yes, 200+ companies including Google, Meta, and Amazon accept our certifications in their hiring processes.' },
        { q: 'What if I\'m a complete beginner?', a: 'We have dedicated beginner paths in every category. No prior experience needed — just curiosity and commitment.' },
        { q: 'Is there a refund policy?', a: 'Yes, 30-day money-back guarantee on all paid plans. No questions asked.' },
        { q: 'Can I download courses for offline viewing?', a: 'Yes, Pro and Teams subscribers can download any course for offline learning on our mobile app.' },
      ]), ctaBanner('Still Have Questions?', 'Our support team is available 24/7 via chat, email, or phone.', 'Contact Support', accent), f] },
      { name: 'Contact', slug: '/contact', elements: [n, pageHero('Contact Us', 'We\'re here to help.'), contactPage(), f] },
    ];

    return { id: 'elearning-v5', name: 'E-Learning Platform', description: 'Premium online education platform with courses, instructors, enterprise — 10 pages', category: 'Education', elements: pages[0].elements, pages };
  })(),

];
