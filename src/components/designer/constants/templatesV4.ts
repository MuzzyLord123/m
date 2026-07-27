import { DesignerTemplate, EditorElement, TemplatePage } from '../types';

let _c4 = 0;
function uid(): string { _c4++; return `tv4-${_c4}-${Math.random().toString(36).slice(2, 8)}`; }
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

function nav4(brand: string, links: string[], style: 'dark' | 'glass' | 'gradient' = 'dark') {
  const bg = style === 'dark' ? '#000' : style === 'glass' ? 'rgba(0,0,0,0.5)' : 'linear-gradient(90deg, #000, #0a0a0a)';
  return el('navbar', { brand }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 64px', width: '100%', backgroundColor: style !== 'gradient' ? bg as string : '#000', background: style === 'gradient' ? bg : undefined, borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: style === 'glass' ? 'blur(24px)' : undefined, position: style === 'glass' ? 'fixed' as any : undefined, top: style === 'glass' ? '0' : undefined, zIndex: style === 'glass' ? '100' : undefined }, mobile: { padding: '16px 24px' } }, [
    el('link', { text: brand, href: '/' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase' as any, textDecoration: 'none' } }),
    el('container', {}, { desktop: { display: 'flex', gap: '36px', alignItems: 'center' }, mobile: { display: 'none' } }, links.map(l =>
      el('link', { text: l, href: `/${l.toLowerCase().replace(/\s+/g, '-')}` }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.55)', textDecoration: 'none', fontWeight: '500', letterSpacing: '0.04em', textTransform: 'uppercase' as any } })
    )),
  ], 'Navigation');
}

function foot4(brand: string, cols?: { title: string; links: string[] }[]) {
  const colData = cols || [
    { title: 'Company', links: ['About', 'Careers', 'Press', 'Blog'] },
    { title: 'Services', links: ['Design', 'Development', 'Consulting', 'Support'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'Cookies'] },
  ];
  return el('footer', {}, { desktop: { padding: '80px 60px 40px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.06)', width: '100%' }, mobile: { padding: '60px 24px 40px' } }, [
    el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: `2fr ${colData.map(() => '1fr').join(' ')}`, gap: '48px', maxWidth: '1200px', margin: '0 auto 48px' }, mobile: { gridTemplateColumns: '1fr' } }, [
      el('container', {}, { desktop: {} }, [
        el('heading', { text: brand, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.08em', marginBottom: '16px' } }),
        el('text', { text: 'Premium digital experiences crafted with precision and passion.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.7', maxWidth: '280px' } }),
      ]),
      ...colData.map(col => el('container', {}, { desktop: {} }, [
        el('heading', { text: col.title, level: 'h4' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', marginBottom: '20px', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
        ...col.links.map(link => el('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: '12px' } })),
      ])),
    ]),
    el('container', {}, { desktop: { borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px', textAlign: 'center', maxWidth: '1200px', margin: '0 auto' } }, [
      el('text', { text: `© 2026 ${brand}. All rights reserved.` }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.06em' } }),
    ]),
  ], 'Footer');
}

function heroAurora(heading: string, sub: string, cta: string, opts: { badge?: string; gradient?: string } = {}) {
  return el('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: '#000' } }, [
    el('container', {}, { desktop: { position: 'absolute', inset: '0', background: opts.gradient || 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(236,72,153,0.08) 0%, transparent 60%)' } }),
    el('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '900px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
      ...(opts.badge ? [a(el('text', { text: opts.badge }, { desktop: { padding: '8px 20px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.5)', borderRadius: '4px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '28px', letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.06)' } }), A_FADE)] : []),
      a(el('heading', { text: heading, level: 'h1' }, { desktop: { fontSize: '80px', fontWeight: '800', color: '#fff', lineHeight: '1.0', letterSpacing: '-0.045em', marginBottom: '28px' }, mobile: { fontSize: '42px' } }), A_BLUR),
      a(el('text', { text: sub }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.75', marginBottom: '44px', maxWidth: '560px', margin: '0 auto 44px' } }), { ...A_FADE, delay: 0.3 }),
      a(el('container', {}, { desktop: { display: 'flex', gap: '14px', justifyContent: 'center' } }, [
        el('button', { text: cta, href: '#' }, { desktop: { padding: '18px 44px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none' } }),
        el('button', { text: 'Learn More', href: '/about' }, { desktop: { padding: '18px 44px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.08)' } }),
      ]), { ...A_FADE, delay: 0.5 }),
    ]),
  ], 'Hero');
}

function heroSplit4(heading: string, sub: string, cta: string, imgUrl: string, opts: { bg?: string; reverse?: boolean; badge?: string; accent?: string } = {}) {
  const bg = opts.bg || '#000';
  return el('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '92vh', backgroundColor: bg }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
    el('container', {}, { desktop: { padding: '100px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', order: opts.reverse ? '1' : '0' }, mobile: { padding: '60px 24px' } }, [
      ...(opts.badge ? [a(el('text', { text: opts.badge }, { desktop: { padding: '6px 16px', backgroundColor: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', borderRadius: '3px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '24px', letterSpacing: '0.12em', border: '1px solid rgba(255,255,255,0.06)' } }), A_FADE)] : []),
      a(el('heading', { text: heading, level: 'h1' }, { desktop: { fontSize: '60px', fontWeight: '700', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.035em', marginBottom: '24px' }, mobile: { fontSize: '36px' } }), A_BLUR),
      a(el('text', { text: sub }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.75', marginBottom: '40px', maxWidth: '420px' } }), { ...A_FADE, delay: 0.2 }),
      a(el('button', { text: cta, href: '#' }, { desktop: { padding: '17px 40px', backgroundColor: opts.accent || '#fff', color: opts.accent ? '#fff' : '#000', borderRadius: '0', fontSize: '12px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any, width: 'fit-content' } }), { ...A_FADE, delay: 0.4 }),
    ]),
    el('container', {}, { desktop: { position: 'relative', overflow: 'hidden', order: opts.reverse ? '0' : '1' } }, [
      a(el('image', { src: imgUrl, alt: 'Hero' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }), A_SCALE),
    ]),
  ], 'Hero');
}

function bentoFeatures(title: string, sub: string, items: { icon: string; title: string; desc: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto 64px', textAlign: 'center' } }, [
      el('text', { text: 'FEATURES' }, { desktop: { fontSize: '11px', color: 'rgba(99,102,241,0.8)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' } }),
      el('text', { text: sub }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', maxWidth: '560px', margin: '0 auto' } }),
    ]), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, items.map((item, i) =>
      a(el('card', {}, { desktop: { padding: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' } }, [
        el('text', { text: item.icon }, { desktop: { fontSize: '32px', marginBottom: '20px' } }),
        el('heading', { text: item.title, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
        el('text', { text: item.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
      ]), { ...A_FADE, delay: i * 0.1 })
    )),
  ], 'Features');
}

function statsRow(items: { value: string; label: string }[]) {
  return el('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', width: '100%' } }, [
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '40px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, items.map((item, i) =>
      a(el('container', {}, { desktop: {} }, [
        el('heading', { text: item.value, level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '8px', letterSpacing: '-0.03em' } }),
        el('text', { text: item.label }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as any, letterSpacing: '0.1em', fontWeight: '600' } }),
      ]), { ...A_FADE, delay: i * 0.1 })
    )),
  ], 'Stats');
}

function testimonials4(items: { quote: string; name: string; role: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('text', { text: 'TESTIMONIALS' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', marginBottom: '56px', fontWeight: '700', maxWidth: '1200px', margin: '0 auto 56px' } }), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: '24px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, items.map((t, i) =>
      a(el('card', {}, { desktop: { padding: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' } }, [
        el('text', { text: `"${t.quote}"` }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.7', marginBottom: '28px', fontStyle: 'italic' } }),
        el('text', { text: t.name }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#fff' } }),
        el('text', { text: t.role }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' } }),
      ]), { ...A_FADE, delay: i * 0.12 })
    )),
  ], 'Testimonials');
}

function ctaSection(heading: string, sub: string, btn: string) {
  return el('section', {}, { desktop: { padding: '140px 60px', background: 'linear-gradient(135deg, #0a0a0a 0%, #1e1b4b 50%, #0a0a0a 100%)', textAlign: 'center', width: '100%', position: 'relative', overflow: 'hidden' }, mobile: { padding: '80px 24px' } }, [
    el('container', {}, { desktop: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 60%)', borderRadius: '50%' } }),
    a(el('container', {}, { desktop: { position: 'relative', zIndex: '1', maxWidth: '600px', margin: '0 auto' } }, [
      el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: '1.1' } }),
      el('text', { text: sub }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginBottom: '40px', lineHeight: '1.7' } }),
      el('button', { text: btn, href: '/contact' }, { desktop: { padding: '18px 48px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', boxShadow: '0 0 40px rgba(99,102,241,0.25)' } }),
    ]), A_BLUR),
  ], 'CTA');
}

function servicesGrid(title: string, services: { name: string; desc: string; icon: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto 72px' } }, [
      el('text', { text: 'SERVICES' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em' } }),
    ]), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, services.map((s, i) =>
      a(el('card', {}, { desktop: { padding: '48px', backgroundColor: '#0a0a0a', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '16px' } }, [
        el('text', { text: s.icon }, { desktop: { fontSize: '36px' } }),
        el('heading', { text: s.name, level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' } }),
        el('text', { text: s.desc }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
      ]), { ...A_FADE, delay: i * 0.1 })
    )),
  ], 'Services');
}

function aboutSection(heading: string, desc: string, imgUrl: string, values: { title: string; desc: string }[]) {
  return el('section', {}, { desktop: { backgroundColor: '#0a0a0a', width: '100%' } }, [
    a(el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '600px' }, mobile: { gridTemplateColumns: '1fr' } }, [
      el('container', {}, { desktop: { padding: '100px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '60px 24px' } }, [
        a(el('text', { text: 'ABOUT US' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', marginBottom: '20px', fontWeight: '700' } }), A_FADE),
        a(el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '24px' } }), A_LEFT),
        a(el('text', { text: desc }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.8', maxWidth: '440px' } }), { ...A_FADE, delay: 0.2 }),
      ]),
      el('container', {}, { desktop: { overflow: 'hidden' } }, [
        a(el('image', { src: imgUrl, alt: 'About' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }), A_SCALE),
      ]),
    ]), A_FADE),
    a(el('container', {}, { desktop: { padding: '80px 60px', maxWidth: '1200px', margin: '0 auto' } }, [
      el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${values.length}, 1fr)`, gap: '24px' }, mobile: { gridTemplateColumns: '1fr' } }, values.map((v, i) =>
        a(el('card', {}, { desktop: { padding: '32px', backgroundColor: '#111', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' } }, [
          el('heading', { text: v.title, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '10px' } }),
          el('text', { text: v.desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
        ]), { ...A_FADE, delay: i * 0.1 })
      )),
    ]), A_FADE),
  ], 'About');
}

function gallerySection(title: string, images: { src: string; alt: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('text', { text: title.toUpperCase() }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.15em', marginBottom: '48px', fontWeight: '700', maxWidth: '1200px', margin: '0 auto 48px' } }), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(images.length, 3)}, 1fr)`, gap: '12px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, images.map((img, i) =>
      a(el('image', { src: img.src, alt: img.alt }, { desktop: { width: '100%', height: '340px', objectFit: 'cover', display: 'block', borderRadius: '12px' } }), { ...A_SCALE, delay: i * 0.08 })
    )),
  ], title);
}

function contactSection() {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr', gap: '48px' } }, [
      el('container', {}, { desktop: {} }, [
        a(el('heading', { text: 'Get In Touch', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '24px' } }), A_LEFT),
        a(el('text', { text: 'We\'d love to hear about your project. Send us a message and we\'ll get back to you within 24 hours.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.8', marginBottom: '40px' } }), { ...A_FADE, delay: 0.1 }),
        a(el('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
          el('text', { text: '📧  hello@studio.com' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.5)' } }),
          el('text', { text: '📱  +44 20 7123 4567' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.5)' } }),
          el('text', { text: '📍  123 Design Street, London EC2A 1NT' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.5)' } }),
        ]), { ...A_FADE, delay: 0.2 }),
      ]),
      a(el('form', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
        el('input', { placeholder: 'Full Name', inputType: 'text' }, { desktop: { padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '14px', color: '#fff' } }),
        el('input', { placeholder: 'Email Address', inputType: 'email' }, { desktop: { padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '14px', color: '#fff' } }),
        el('input', { placeholder: 'Subject', inputType: 'text' }, { desktop: { padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '14px', color: '#fff' } }),
        el('textarea', { placeholder: 'Your message...' }, { desktop: { padding: '16px 20px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '14px', color: '#fff', minHeight: '140px' } }),
        el('button', { text: 'Send Message', href: '#' }, { desktop: { padding: '18px 32px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: 'none' } }),
      ]), A_RIGHT),
    ]),
  ], 'Contact');
}

function pricingSection(plans: { name: string; price: string; desc: string; features: string; popular?: boolean }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', background: 'linear-gradient(180deg, #0a0a0a 0%, #000 100%)', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { textAlign: 'center', marginBottom: '64px' } }, [
      el('text', { text: 'PRICING' }, { desktop: { fontSize: '11px', color: 'rgba(99,102,241,0.8)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: 'Choose Your Plan', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
    ]), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: '20px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, plans.map((p, i) =>
      a(el('card', {}, { desktop: { padding: '44px', borderRadius: '20px', border: p.popular ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)', backgroundColor: p.popular ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)', transform: p.popular ? 'scale(1.04)' : 'none' } }, [
        ...(p.popular ? [el('text', { text: 'MOST POPULAR' }, { desktop: { padding: '4px 14px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '4px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.1em' } })] : []),
        el('heading', { text: p.name, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
        el('text', { text: p.desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', marginBottom: '24px' } }),
        el('heading', { text: p.price, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '32px', letterSpacing: '-0.03em' } }),
        el('text', { text: p.features }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '2.4', whiteSpace: 'pre-line', marginBottom: '36px' } }),
        el('button', { text: p.popular ? 'Get Started' : 'Choose Plan', href: '#' }, { desktop: { padding: '16px 32px', background: p.popular ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent', color: p.popular ? '#fff' : 'rgba(255,255,255,0.7)', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.1)', width: '100%' } }),
      ]), { ...A_FADE, delay: i * 0.1 })
    )),
  ], 'Pricing');
}

function faqSection(items: { q: string; a: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { maxWidth: '720px', margin: '0 auto' } }, [
      el('heading', { text: 'Frequently Asked Questions', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '56px', textAlign: 'center' } }),
      ...items.map((item, i) => a(el('container', {}, { desktop: { padding: '28px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } }, [
        el('heading', { text: item.q, level: 'h4' }, { desktop: { fontSize: '17px', fontWeight: '600', color: '#fff', marginBottom: '12px' } }),
        el('text', { text: item.a }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
      ]), { ...A_FADE, delay: i * 0.08 })),
    ]), A_FADE),
  ], 'FAQ');
}

function processSection(steps: { step: string; title: string; desc: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    a(el('container', {}, { desktop: { textAlign: 'center', marginBottom: '80px' } }, [
      el('text', { text: 'OUR PROCESS' }, { desktop: { fontSize: '11px', color: 'rgba(99,102,241,0.8)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: 'How We Work', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
    ]), A_FADE),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${steps.length}, 1fr)`, gap: '24px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, steps.map((s, i) =>
      a(el('card', {}, { desktop: { padding: '40px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' } }, [
        el('text', { text: s.step }, { desktop: { fontSize: '48px', fontWeight: '800', color: 'rgba(99,102,241,0.3)', marginBottom: '16px' } }),
        el('heading', { text: s.title, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
        el('text', { text: s.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
      ]), { ...A_FADE, delay: i * 0.12 })
    )),
  ], 'Process');
}

// ── TEMPLATE BUILDER ────────────────────────────────────────────

interface T4Config {
  brand: string;
  links: string[];
  homeElements: EditorElement[];
  aboutHeading: string; aboutDesc: string; aboutImg: string; aboutValues: { title: string; desc: string }[];
  servicesTitle: string; services: { name: string; desc: string; icon: string }[];
  page4: { name: string; slug: string; elements: EditorElement[] };
  page5: { name: string; slug: string; elements: EditorElement[] };
  page6: { name: string; slug: string; elements: EditorElement[] };
}

function build7Pages(cfg: T4Config): TemplatePage[] {
  const n = nav4(cfg.brand, cfg.links);
  const f = foot4(cfg.brand);
  return [
    { name: 'Home', slug: '/', elements: [n, ...cfg.homeElements, f] },
    { name: 'About', slug: '/about', elements: [
      n,
      aboutSection(cfg.aboutHeading, cfg.aboutDesc, cfg.aboutImg, cfg.aboutValues),
      statsRow([{ value: '12+', label: 'Years Experience' }, { value: '500+', label: 'Clients Served' }, { value: '98%', label: 'Satisfaction Rate' }, { value: '50+', label: 'Awards Won' }]),
      testimonials4([
        { quote: 'Absolutely exceptional. They exceeded every expectation and delivered a product we\'re proud of.', name: 'Alex Thompson', role: 'CEO, InnovateCo' },
        { quote: 'The level of craft and attention to detail is unmatched. Our conversion rates increased 200%.', name: 'Sarah Chen', role: 'VP Marketing, GrowthLabs' },
        { quote: 'Working with this team transformed our digital presence. Highly recommended.', name: 'James Okonkwo', role: 'Founder, NextWave' },
      ]),
      ctaSection('Join Our Story', 'We\'re always looking for ambitious partners and talented people.', 'Get In Touch'),
      f,
    ]},
    { name: 'Services', slug: '/services', elements: [
      n,
      a(el('section', {}, { desktop: { padding: '160px 60px 80px', textAlign: 'center', backgroundColor: '#000' } }, [
        el('text', { text: 'WHAT WE DO' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
        el('heading', { text: cfg.servicesTitle, level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' } }),
        el('text', { text: 'Comprehensive solutions designed to drive measurable results.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', maxWidth: '560px', margin: '0 auto' } }),
      ], 'Services Hero'), A_BLUR),
      servicesGrid(cfg.servicesTitle, cfg.services),
      processSection([
        { step: '01', title: 'Discovery', desc: 'Deep dive into your goals, audience, and market landscape.' },
        { step: '02', title: 'Strategy', desc: 'Craft a tailored roadmap aligned with your business objectives.' },
        { step: '03', title: 'Creation', desc: 'Design and build with obsessive attention to every detail.' },
        { step: '04', title: 'Launch', desc: 'Deploy, monitor, and continuously optimize for performance.' },
      ]),
      pricingSection([
        { name: 'Starter', price: '$49/mo', desc: 'For individuals and small projects', features: 'Core features included\nEmail support\nBasic analytics\nUp to 5 users', popular: false },
        { name: 'Professional', price: '$99/mo', desc: 'For growing teams', features: 'Everything in Starter\nPriority support\nAdvanced analytics\nUnlimited users\nCustom branding', popular: true },
        { name: 'Enterprise', price: 'Custom', desc: 'For large organisations', features: 'Everything in Pro\nDedicated manager\nSLA guarantee\nAPI access\nCustom integrations', popular: false },
      ]),
      ctaSection('Ready to Get Started?', 'Let\'s discuss how we can help achieve your goals.', 'Schedule a Call'),
      f,
    ]},
    { name: cfg.page4.name, slug: cfg.page4.slug, elements: [n, ...cfg.page4.elements, f] },
    { name: cfg.page5.name, slug: cfg.page5.slug, elements: [n, ...cfg.page5.elements, f] },
    { name: cfg.page6.name, slug: cfg.page6.slug, elements: [n, ...cfg.page6.elements, f] },
    { name: 'Contact', slug: '/contact', elements: [
      n,
      a(el('section', {}, { desktop: { padding: '160px 60px 40px', textAlign: 'center', backgroundColor: '#000' } }, [
        el('heading', { text: 'Let\'s Talk', level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' } }),
        el('text', { text: 'We\'d love to hear about your project. Get in touch and let\'s start something great.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', marginTop: '16px', maxWidth: '460px', margin: '16px auto 0' } }),
      ], 'Contact Hero'), A_BLUR),
      contactSection(),
      faqSection([
        { q: 'What\'s your typical timeline?', a: 'Most projects are delivered within 6-12 weeks, depending on scope and complexity.' },
        { q: 'Do you offer ongoing support?', a: 'Yes — all packages include post-launch support, and we offer retainer plans for continuous improvement.' },
        { q: 'What\'s your pricing structure?', a: 'We offer both fixed-price projects and monthly retainers. Every engagement starts with a free consultation.' },
        { q: 'Can you work with our existing systems?', a: 'Absolutely. We specialise in integrating with and enhancing existing tech stacks.' },
      ]),
      f,
    ]},
  ];
}

function mk(id: string, name: string, desc: string, category: string, homeEl: EditorElement[], pages: TemplatePage[]): DesignerTemplate {
  return { id, name, description: desc, category, elements: homeEl, pages };
}

// ═══════════════════════════════════════════════════════════════════
//  10 ULTRA-PREMIUM TEMPLATES — $10K+ QUALITY, 7 PAGES EACH
// ═══════════════════════════════════════════════════════════════════

const homeNav = (brand: string, links: string[]) => nav4(brand, links);
const homeFoot = (brand: string) => foot4(brand);

export const TEMPLATES_V4: DesignerTemplate[] = [

  // 1. VENTURE CAPITAL / STARTUP FUND
  (() => {
    const brand = 'HORIZON VC';
    const links = ['Portfolio', 'About', 'Thesis', 'Team', 'Contact'];
    const homeEls = [
      heroAurora('Backing the\nBoldest Founders', 'We invest in visionary teams building the future of technology. $2B deployed across 120+ companies.', 'Apply for Funding', { badge: 'SERIES A — GROWTH', gradient: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(99,102,241,0.15) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(59,130,246,0.1) 0%, transparent 60%)' }),
      statsRow([{ value: '$2B+', label: 'Capital Deployed' }, { value: '120+', label: 'Portfolio Companies' }, { value: '18', label: 'Unicorns Created' }, { value: '92%', label: 'Follow-On Rate' }]),
      bentoFeatures('Investment Thesis', 'We back companies at the intersection of technology and transformation.', [
        { icon: '🤖', title: 'Artificial Intelligence', desc: 'Foundation models, vertical AI agents, and infrastructure powering the next wave of intelligence.' },
        { icon: '🔐', title: 'Cybersecurity', desc: 'Zero-trust architectures, identity platforms, and threat intelligence for the modern enterprise.' },
        { icon: '🌱', title: 'Climate Tech', desc: 'Carbon capture, clean energy, and sustainable infrastructure at planetary scale.' },
      ]),
      gallerySection('Featured Portfolio', [
        { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', alt: 'DataStream AI' },
        { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop', alt: 'NeuralPath' },
        { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', alt: 'CloudScale' },
      ]),
      ctaSection('Have a Groundbreaking Idea?', 'We review every application. Founders who challenge conventional thinking get our attention.', 'Apply Now'),
    ];
    return mk('vc-fund', 'Venture Capital Fund', 'Premium dark VC/investment fund with aurora gradients', 'Finance', [homeNav(brand, links), ...homeEls, homeFoot(brand)], build7Pages({
      brand, links, homeElements: homeEls,
      aboutHeading: 'Conviction-Led\nInvesting', aboutDesc: 'Founded in 2018, Horizon VC has backed 120+ companies across AI, cybersecurity, and climate tech. Our partners bring decades of operating experience.', aboutImg: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Founder-First', desc: 'We\'re operators first, investors second. Every partner has built and scaled companies.' }, { title: 'Long-Term View', desc: 'We back companies for decades, not quarters. Patient capital, persistent support.' }, { title: 'Global Network', desc: 'Access to 500+ LPs, advisors, and portfolio companies across 30 countries.' }],
      servicesTitle: 'How We Help', services: [{ name: 'Capital & Strategy', desc: 'Series A through growth rounds with strategic guidance from experienced operators.', icon: '💰' }, { name: 'Talent Network', desc: 'Access to our vetted network of executives, engineers, and advisors.', icon: '👥' }, { name: 'Go-to-Market', desc: 'Customer introductions, partnership brokering, and market expansion playbooks.', icon: '🚀' }, { name: 'Platform Support', desc: 'CFO services, legal resources, and technical infrastructure guidance.', icon: '🛠️' }],
      page4: { name: 'Portfolio', slug: '/portfolio', elements: [gallerySection('Portfolio Companies', [{ src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', alt: 'DataStream AI' }, { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop', alt: 'NeuralPath' }, { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', alt: 'CloudScale' }, { src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', alt: 'QuantumSecure' }, { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop', alt: 'GreenGrid' }, { src: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&h=400&fit=crop', alt: 'Synthwave' }])] },
      page5: { name: 'Thesis', slug: '/thesis', elements: [bentoFeatures('Our Investment Thesis', 'We seek outsized returns by investing in technology shifts that reshape entire industries.', [{ icon: '🧠', title: 'AI Infrastructure', desc: 'Compute, training frameworks, and inference engines powering the AI revolution.' }, { icon: '🏗️', title: 'Developer Tools', desc: 'Platforms that 10x developer productivity and accelerate software delivery.' }, { icon: '🌍', title: 'Decarbonisation', desc: 'Technologies enabling the transition to a net-zero global economy.' }])] },
      page6: { name: 'Team', slug: '/team', elements: [el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [a(el('heading', { text: 'Our Partners', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '64px' } }), A_FADE), el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1000px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [{ name: 'Elena Volkov', role: 'Managing Partner', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&crop=face' }, { name: 'Marcus Wei', role: 'General Partner', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face' }, { name: 'Amara Obi', role: 'Partner, Climate', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=500&fit=crop&crop=face' }].map((p, i) => a(el('card', {}, { desktop: { borderRadius: '16px', overflow: 'hidden' } }, [el('image', { src: p.img, alt: p.name }, { desktop: { width: '100%', height: '360px', objectFit: 'cover' } }), el('container', {}, { desktop: { padding: '20px' } }, [el('heading', { text: p.name, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }), el('text', { text: p.role }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)' } })])]), { ...A_FADE, delay: i * 0.1 })))], 'Team')] },
    }));
  })(),

  // 2. LUXURY HOTEL
  (() => {
    const brand = 'THE PALISADE';
    const links = ['Rooms', 'Experience', 'Dining', 'Gallery', 'Reserve'];
    const homeEls = [
      heroSplit4('Where Luxury\nMeets Serenity', 'An intimate collection of suites perched above the Mediterranean. Michelin-starred dining, private beaches, and bespoke experiences.', 'Reserve Your Stay', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=900&fit=crop', { badge: 'MEMBER OF LEADING HOTELS OF THE WORLD' }),
      statsRow([{ value: '5★', label: 'Rating' }, { value: '42', label: 'Suites' }, { value: '2', label: 'Michelin Stars' }, { value: '#1', label: 'in Mediterranean' }]),
      bentoFeatures('The Experience', 'Every detail curated for extraordinary moments.', [
        { icon: '🏖️', title: 'Private Beach', desc: 'Your own stretch of pristine coastline with dedicated butler service and premium amenities.' },
        { icon: '🍽️', title: 'Michelin Dining', desc: 'Two restaurants helmed by award-winning chefs using locally sourced seasonal ingredients.' },
        { icon: '🧖', title: 'Wellness Sanctuary', desc: 'A 2,000sqm spa with hammam, hydrotherapy pools, and personalised wellness programmes.' },
      ]),
      testimonials4([
        { quote: 'The most extraordinary hotel experience of our lives. Every moment was pure magic.', name: 'Lord & Lady Ashworth', role: 'Private Guests' },
        { quote: 'Impeccable service, breathtaking views, and culinary excellence. We return every year.', name: 'Yuki Tanaka', role: 'Travel Editor, Condé Nast' },
      ]),
      ctaSection('Begin Your Journey', 'Limited availability. Book your bespoke Mediterranean escape today.', 'Reserve Now'),
    ];
    return mk('luxury-hotel', 'Luxury Hotel & Resort', 'Ultra-premium dark hotel with split hero', 'Hospitality', [homeNav(brand, links), ...homeEls, homeFoot(brand)], build7Pages({
      brand, links, homeElements: homeEls,
      aboutHeading: 'A Legacy of\nElegance', aboutDesc: 'Since 1962, The Palisade has set the standard for Mediterranean luxury. Perched on dramatic clifftops, our intimate retreat offers 42 individually designed suites.', aboutImg: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Heritage', desc: 'Six decades of legendary hospitality and timeless elegance.' }, { title: 'Privacy', desc: 'Discreet, personalised service for discerning guests.' }, { title: 'Sustainability', desc: 'Carbon-neutral operations powered by renewable energy.' }],
      servicesTitle: 'Our Experiences', services: [{ name: 'Signature Suites', desc: 'From 65sqm to the 280sqm Royal Penthouse, each suite offers panoramic sea views and curated art collections.', icon: '🛏️' }, { name: 'Culinary Journey', desc: 'From our 2-star Michelin restaurant to sunset cocktails on the terrace, every meal is a celebration.', icon: '🍷' }, { name: 'Wellness & Spa', desc: 'Ancient hammam rituals, modern treatments, and a state-of-the-art fitness centre with ocean views.', icon: '💆' }, { name: 'Private Experiences', desc: 'Yacht excursions, helicopter tours, and exclusive cultural experiences tailored to your interests.', icon: '⛵' }],
      page4: { name: 'Rooms', slug: '/rooms', elements: [gallerySection('Suites & Rooms', [{ src: 'https://images.unsplash.com/photo-1590490360182-c33d953c4f18?w=600&h=400&fit=crop', alt: 'Ocean Suite' }, { src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop', alt: 'Cliff Suite' }, { src: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop', alt: 'Royal Penthouse' }])] },
      page5: { name: 'Dining', slug: '/dining', elements: [gallerySection('Restaurants & Bars', [{ src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop', alt: 'Fine Dining' }, { src: 'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=600&h=400&fit=crop', alt: 'Terrace Bar' }, { src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop', alt: 'Pool Bar' }])] },
      page6: { name: 'Gallery', slug: '/gallery', elements: [gallerySection('The Palisade', [{ src: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&h=400&fit=crop', alt: 'Exterior' }, { src: 'https://images.unsplash.com/photo-1590490360182-c33d953c4f18?w=600&h=400&fit=crop', alt: 'Pool' }, { src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&h=400&fit=crop', alt: 'Suite' }, { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop', alt: 'Restaurant' }, { src: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&h=400&fit=crop', alt: 'Spa' }, { src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop', alt: 'Bar' }])] },
    }));
  })(),

  // 3. AI / SAAS PLATFORM
  (() => {
    const brand = 'NEURAL';
    const links = ['Features', 'Pricing', 'Docs', 'Blog', 'Contact'];
    const homeEls = [
      heroAurora('The AI Platform\nfor Modern Teams', 'Ship intelligent products 10x faster. Neural combines state-of-the-art models with production-grade infrastructure.', 'Start Building Free', { badge: 'NOW WITH GPT-5 & GEMINI 3', gradient: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(59,130,246,0.15) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(99,102,241,0.1) 0%, transparent 60%)' }),
      el('section', {}, { desktop: { padding: '60px 60px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', width: '100%' } }, [a(el('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', textAlign: 'center' } }, [el('text', { text: 'TRUSTED BY ENGINEERING TEAMS AT' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.15em', marginBottom: '32px', fontWeight: '600' } }), el('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '64px', flexWrap: 'wrap' } }, ['Stripe', 'Vercel', 'Linear', 'Notion', 'Figma', 'Supabase'].map(n => el('text', { text: n }, { desktop: { fontSize: '18px', fontWeight: '700', color: 'rgba(255,255,255,0.1)', letterSpacing: '0.04em' } })))]), A_FADE)]),
      bentoFeatures('Built for Scale', 'Every feature designed for production workloads.', [
        { icon: '⚡', title: 'Sub-50ms Inference', desc: 'Globally distributed edge inference with automatic model routing and load balancing.' },
        { icon: '🔗', title: 'Unified API', desc: 'One API for GPT-5, Gemini 3, Claude, and 20+ models. Switch providers with a single line.' },
        { icon: '📊', title: 'Observability', desc: 'Real-time dashboards, cost tracking, and quality metrics for every model call.' },
        { icon: '🔒', title: 'Enterprise Security', desc: 'SOC 2 Type II, HIPAA compliant, with data residency controls and audit logging.' },
        { icon: '🧪', title: 'Experimentation', desc: 'A/B test prompts, models, and configurations with statistical significance tracking.' },
        { icon: '🤝', title: 'Team Collaboration', desc: 'Shared prompt libraries, version control, and review workflows for AI teams.' },
      ]),
      statsRow([{ value: '<50ms', label: 'Avg Latency' }, { value: '99.99%', label: 'Uptime SLA' }, { value: '2M+', label: 'API Calls/Day' }, { value: '150+', label: 'Countries' }]),
      ctaSection('Start Building with AI', 'Free tier includes 10K API calls/month. No credit card required.', 'Get API Key'),
    ];
    return mk('ai-saas', 'AI SaaS Platform', 'Modern dark AI/ML platform with aurora hero', 'Technology', [homeNav(brand, links), ...homeEls, homeFoot(brand)], build7Pages({
      brand, links, homeElements: homeEls,
      aboutHeading: 'Making AI\nAccessible', aboutDesc: 'Neural was founded to eliminate the complexity of shipping AI products. Our platform abstracts infrastructure so teams can focus on building intelligent experiences.', aboutImg: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Developer-First', desc: 'Every decision optimises for developer experience and productivity.' }, { title: 'Open Standards', desc: 'Built on open protocols. No vendor lock-in, ever.' }, { title: 'Responsible AI', desc: 'Safety guardrails, bias detection, and ethical AI practices built into every layer.' }],
      servicesTitle: 'Platform Features', services: [{ name: 'Model Gateway', desc: 'Route between 20+ AI models with a single API. Automatic fallback, caching, and rate limiting.', icon: '🔗' }, { name: 'Prompt Studio', desc: 'Visual prompt engineering with version control, testing, and collaboration features.', icon: '✏️' }, { name: 'Monitoring Suite', desc: 'Real-time dashboards for latency, cost, quality scores, and anomaly detection.', icon: '📊' }, { name: 'Deployment Engine', desc: 'One-click model deployment to edge locations worldwide with auto-scaling.', icon: '🚀' }],
      page4: { name: 'Pricing', slug: '/pricing', elements: [pricingSection([{ name: 'Free', price: '$0', desc: '10K API calls/month', features: '10K API calls/month\nAll models\nCommunity support\nBasic analytics', popular: false }, { name: 'Pro', price: '$79/mo', desc: 'For growing teams', features: '500K API calls/month\nPriority routing\nAdvanced analytics\nTeam collaboration\nPrompt Studio', popular: true }, { name: 'Enterprise', price: 'Custom', desc: 'Unlimited scale', features: 'Unlimited API calls\nDedicated infrastructure\nSLA guarantee\nSOC 2 / HIPAA\nCustom models\n24/7 support', popular: false }])] },
      page5: { name: 'Docs', slug: '/docs', elements: [bentoFeatures('Documentation', 'Everything you need to get started.', [{ icon: '📚', title: 'Quick Start', desc: 'Get your first API call running in under 5 minutes with our step-by-step guide.' }, { icon: '🔧', title: 'API Reference', desc: 'Complete reference for all endpoints, parameters, and response formats.' }, { icon: '💡', title: 'Examples', desc: 'Production-ready code examples in Python, TypeScript, Go, and Rust.' }])] },
      page6: { name: 'Blog', slug: '/blog', elements: [gallerySection('Latest Posts', [{ src: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop', alt: 'AI Trends 2026' }, { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', alt: 'Scaling AI Inference' }, { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop', alt: 'Building RAG Systems' }])] },
    }));
  })(),

  // 4. LAW FIRM
  (() => {
    const brand = 'ALDRIDGE & COLE';
    const links = ['Practice', 'Team', 'Cases', 'Insights', 'Contact'];
    const homeEls = [
      heroSplit4('Precision.\nPrinciple.\nResults.', 'A leading international law firm advising FTSE 100 corporations, sovereign wealth funds, and high-net-worth individuals on their most complex legal challenges.', 'Schedule Consultation', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=900&fit=crop', { badge: 'CHAMBERS & PARTNERS — BAND 1' }),
      statsRow([{ value: '85+', label: 'Years Established' }, { value: '340', label: 'Legal Professionals' }, { value: '£12B+', label: 'Deals Advised' }, { value: '25', label: 'Global Offices' }]),
      servicesGrid('Practice Areas', [
        { name: 'Corporate M&A', desc: 'Cross-border mergers, acquisitions, and restructuring for the world\'s most complex transactions.', icon: '🏛️' },
        { name: 'Litigation & Dispute', desc: 'High-stakes commercial litigation and international arbitration with a proven track record.', icon: '⚖️' },
        { name: 'Private Equity', desc: 'Fund formation, portfolio company governance, and exit strategy across all sectors.', icon: '💼' },
        { name: 'Real Estate', desc: 'Major development projects, commercial leasing, and cross-border property transactions.', icon: '🏗️' },
      ]),
      ctaSection('How Can We Help?', 'Our partners are available for confidential consultations on your most pressing legal matters.', 'Contact Us'),
    ];
    return mk('law-firm', 'International Law Firm', 'Premium dark law firm with authority', 'Professional', [homeNav(brand, links), ...homeEls, homeFoot(brand)], build7Pages({
      brand, links, homeElements: homeEls,
      aboutHeading: 'Eight Decades of\nLegal Excellence', aboutDesc: 'Founded in London in 1938, Aldridge & Cole has grown into a global practice with 340 professionals across 25 offices. We advise on the transactions and disputes that shape industries.', aboutImg: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Integrity', desc: 'Unwavering commitment to ethical practice and client confidentiality.' }, { title: 'Excellence', desc: 'Consistently ranked Band 1 by Chambers and tier 1 by Legal 500.' }, { title: 'Innovation', desc: 'Pioneering legal tech adoption for faster, more efficient client outcomes.' }],
      servicesTitle: 'Practice Areas', services: [{ name: 'Corporate M&A', desc: 'Advising on transformative transactions across technology, healthcare, and financial services.', icon: '🏛️' }, { name: 'Litigation', desc: 'Complex commercial disputes, class actions, and international arbitration.', icon: '⚖️' }, { name: 'Private Equity', desc: 'Fund formation, co-investments, and portfolio company matters.', icon: '💼' }, { name: 'Regulatory', desc: 'FCA, SEC, and cross-jurisdictional regulatory compliance and investigations.', icon: '📋' }],
      page4: { name: 'Cases', slug: '/cases', elements: [gallerySection('Notable Cases', [{ src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop', alt: 'Tech Acquisition' }, { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop', alt: 'Fund Formation' }, { src: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=600&h=400&fit=crop', alt: 'Cross-Border Merger' }])] },
      page5: { name: 'Insights', slug: '/insights', elements: [gallerySection('Latest Insights', [{ src: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=400&fit=crop', alt: 'Regulatory Update' }, { src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop', alt: 'Market Analysis' }, { src: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop', alt: 'Case Study' }])] },
      page6: { name: 'Team', slug: '/team', elements: [el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' } }, [a(el('heading', { text: 'Our Partners', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', marginBottom: '64px' } }), A_FADE), el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [{ name: 'Sir Richard Aldridge', role: 'Senior Partner' }, { name: 'Catherine Cole QC', role: 'Managing Partner' }, { name: 'Raj Patel', role: 'Head of M&A' }, { name: 'Dr. Eva Schmidt', role: 'Head of Litigation' }].map((p, i) => a(el('card', {}, { desktop: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' } }, [el('heading', { text: p.name, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }), el('text', { text: p.role }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)' } })]), { ...A_FADE, delay: i * 0.1 })))], 'Team')] },
    }));
  })(),

  // 5. FITNESS / GYM
  (() => {
    const brand = 'FORGE';
    const links = ['Programs', 'Coaches', 'Membership', 'Results', 'Contact'];
    const homeEls = [
      heroSplit4('Transform\nYour Body.\nTransform\nYour Life.', 'Elite personal training and group fitness in a state-of-the-art facility. Science-backed programs. Real results.', 'Start Your Transformation', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=900&fit=crop', { badge: 'VOTED #1 GYM IN THE CITY' }),
      statsRow([{ value: '5,000+', label: 'Members' }, { value: '50+', label: 'Expert Coaches' }, { value: '95%', label: 'Goal Achievement' }, { value: '12', label: 'Locations' }]),
      servicesGrid('Training Programs', [
        { name: 'Strength & Power', desc: 'Progressive overload programming with certified strength coaches. From beginners to competitive powerlifters.', icon: '🏋️' },
        { name: 'HIIT & Conditioning', desc: 'High-intensity interval training designed to maximise fat loss and improve cardiovascular performance.', icon: '🔥' },
        { name: '1-on-1 Coaching', desc: 'Personalised training plans with dedicated coaches, nutrition guidance, and weekly progress tracking.', icon: '🎯' },
        { name: 'Recovery & Mobility', desc: 'Sports massage, cryotherapy, infrared sauna, and structured mobility programming.', icon: '🧘' },
      ]),
      ctaSection('Your First Week Is Free', 'Experience Forge with zero commitment. Full access to all facilities, classes, and amenities.', 'Claim Free Week'),
    ];
    return mk('fitness-gym', 'Premium Fitness & Gym', 'Bold dark gym/fitness with energy', 'Health', [homeNav(brand, links), ...homeEls, homeFoot(brand)], build7Pages({
      brand, links, homeElements: homeEls,
      aboutHeading: 'Built for Those\nWho Show Up', aboutDesc: 'Forge was founded on a simple belief: everyone deserves access to world-class training. Our facilities combine cutting-edge equipment with expert coaching.', aboutImg: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Science-Backed', desc: 'Every program designed by exercise physiologists and sports scientists.' }, { title: 'Community', desc: 'A supportive community that celebrates every milestone.' }, { title: 'Results', desc: '95% of members achieve their primary goal within 12 months.' }],
      servicesTitle: 'Programs', services: [{ name: 'Strength Training', desc: 'Progressive overload programming for all levels.', icon: '🏋️' }, { name: 'Group Classes', desc: 'HIIT, boxing, yoga, and 30+ weekly classes.', icon: '👥' }, { name: 'Personal Training', desc: 'Dedicated coach, custom program, nutrition plan.', icon: '🎯' }, { name: 'Recovery Suite', desc: 'Cryotherapy, sauna, massage, and mobility lab.', icon: '❄️' }],
      page4: { name: 'Membership', slug: '/membership', elements: [pricingSection([{ name: 'Essential', price: '£49/mo', desc: 'Gym access only', features: 'Full gym access\nLocker room\nBasic app\nFree WiFi', popular: false }, { name: 'Premium', price: '£89/mo', desc: 'Most popular', features: 'Everything in Essential\nUnlimited classes\nRecovery suite\n2 PT sessions/month\nNutrition coaching', popular: true }, { name: 'Elite', price: '£149/mo', desc: 'The complete package', features: 'Everything in Premium\nUnlimited PT sessions\nPriority booking\nGuest passes\nExclusive events', popular: false }])] },
      page5: { name: 'Results', slug: '/results', elements: [testimonials4([{ quote: 'Lost 20kg in 6 months and gained confidence I never knew I had. Forge changed my life.', name: 'Tom Richards', role: 'Member since 2024' }, { quote: 'The coaching quality is exceptional. I hit my first 200kg deadlift after 8 months.', name: 'Priya Sharma', role: 'Powerlifting Programme' }, { quote: 'The group classes are addictive. The energy and community keep me coming back every day.', name: 'Jake Morrison', role: 'HIIT Programme' }])] },
      page6: { name: 'Coaches', slug: '/coaches', elements: [el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' } }, [a(el('heading', { text: 'Our Coaches', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', marginBottom: '64px' } }), A_FADE), el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1000px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [{ name: 'Coach Mike Thompson', role: 'Head of Strength', img: 'https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=400&h=500&fit=crop' }, { name: 'Coach Lisa Park', role: 'HIIT & Conditioning', img: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=500&fit=crop' }, { name: 'Coach David Osei', role: 'Personal Training', img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=500&fit=crop' }].map((c, i) => a(el('card', {}, { desktop: { borderRadius: '16px', overflow: 'hidden' } }, [el('image', { src: c.img, alt: c.name }, { desktop: { width: '100%', height: '360px', objectFit: 'cover' } }), el('container', {}, { desktop: { padding: '20px' } }, [el('heading', { text: c.name, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }), el('text', { text: c.role }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)' } })])]), { ...A_FADE, delay: i * 0.1 })))], 'Coaches')] },
    }));
  })(),

  // 6. REAL ESTATE AGENCY
  (() => {
    const brand = 'MAYFAIR ESTATES';
    const links = ['Properties', 'Services', 'About', 'Journal', 'Contact'];
    const homeEls = [
      heroSplit4('London\'s Most\nExclusive Properties', 'Specialist agents for prime central London. From Mayfair penthouses to Chelsea townhouses, we represent the finest residences in the capital.', 'View Properties', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=900&fit=crop', { badge: 'PRIME CENTRAL LONDON SPECIALISTS', reverse: true }),
      statsRow([{ value: '£2B+', label: 'Property Sold' }, { value: '500+', label: 'Properties Listed' }, { value: '30+', label: 'Years Experience' }, { value: '#1', label: 'in Prime London' }]),
      gallerySection('Featured Properties', [
        { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', alt: 'Mayfair Penthouse' },
        { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', alt: 'Chelsea Townhouse' },
        { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop', alt: 'Kensington Mansion' },
      ]),
      ctaSection('Find Your Perfect Home', 'Schedule a private viewing with one of our specialist agents.', 'Book Viewing'),
    ];
    return mk('real-estate', 'Luxury Real Estate', 'Premium dark real estate with property showcase', 'Real Estate', [homeNav(brand, links), ...homeEls, homeFoot(brand)], build7Pages({
      brand, links, homeElements: homeEls,
      aboutHeading: 'Three Decades of\nPrime London', aboutDesc: 'Mayfair Estates has been the trusted advisor for discerning buyers and sellers in prime central London since 1992.', aboutImg: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Discretion', desc: 'Off-market transactions and confidential representation.' }, { title: 'Expertise', desc: 'Unrivalled knowledge of London\'s prime property market.' }, { title: 'Network', desc: 'Global UHNWI buyer network across 40+ countries.' }],
      servicesTitle: 'Our Services', services: [{ name: 'Sales', desc: 'Expert marketing and negotiation for prime London properties from £2M to £50M+.', icon: '🏠' }, { name: 'Acquisitions', desc: 'Bespoke property search including off-market and pre-market opportunities.', icon: '🔍' }, { name: 'Lettings', desc: 'Premium rental management for landlords and corporate tenants.', icon: '🔑' }, { name: 'Advisory', desc: 'Investment strategy, portfolio analysis, and market intelligence.', icon: '📊' }],
      page4: { name: 'Properties', slug: '/properties', elements: [gallerySection('Current Listings', [{ src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', alt: 'Mayfair' }, { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', alt: 'Chelsea' }, { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop', alt: 'Kensington' }, { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop', alt: 'Belgravia' }, { src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop', alt: 'Knightsbridge' }, { src: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=400&fit=crop', alt: 'Holland Park' }])] },
      page5: { name: 'Journal', slug: '/journal', elements: [gallerySection('Property Journal', [{ src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', alt: 'Market Report' }, { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop', alt: 'Investment Guide' }, { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', alt: 'Interior Trends' }])] },
      page6: { name: 'Valuation', slug: '/valuation', elements: [contactSection()] },
    }));
  })(),

  // 7. MUSIC ARTIST
  (() => {
    const brand = 'KIRA NOVA';
    const links = ['Music', 'Tour', 'Videos', 'Shop', 'Contact'];
    const homeEls = [
      heroAurora('KIRA\nNOVA', 'Multi-platinum recording artist. New album "ECLIPSE" out now. World tour 2026 — tickets selling fast.', 'Listen Now', { badge: 'NEW ALBUM — ECLIPSE', gradient: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(236,72,153,0.15) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 20% 80%, rgba(168,85,247,0.1) 0%, transparent 60%)' }),
      statsRow([{ value: '2B+', label: 'Global Streams' }, { value: '4x', label: 'Platinum Albums' }, { value: '45', label: 'Countries Toured' }, { value: '12', label: 'Awards' }]),
      gallerySection('Latest Music Videos', [
        { src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop', alt: 'Eclipse MV' },
        { src: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop', alt: 'Midnight Run MV' },
        { src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop', alt: 'Neon Dreams MV' },
      ]),
      ctaSection('World Tour 2026', 'Experience ECLIPSE live. 45 cities. 6 continents. Tickets on sale now.', 'Get Tickets'),
    ];
    return mk('music-artist', 'Music Artist', 'Cinematic dark artist portfolio with pink gradients', 'Creative', [homeNav(brand, links), ...homeEls, homeFoot(brand)], build7Pages({
      brand, links, homeElements: homeEls,
      aboutHeading: 'The Voice of\na Generation', aboutDesc: 'From bedroom demos to sold-out arenas, Kira Nova has redefined pop music with genre-blending artistry and raw emotional storytelling.', aboutImg: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Authenticity', desc: 'Writes and produces every track. No ghost-writers, no compromises.' }, { title: 'Innovation', desc: 'Pioneering immersive concerts with AR and spatial audio technology.' }, { title: 'Impact', desc: 'Foundation supporting music education in underserved communities.' }],
      servicesTitle: 'Discography', services: [{ name: 'ECLIPSE (2026)', desc: '14-track album blending electronic pop with orchestral arrangements. Debuted #1 in 32 countries.', icon: '🌑' }, { name: 'VELOCITY (2024)', desc: 'The record that broke streaming records. 4x Platinum, 3 Grammys.', icon: '⚡' }, { name: 'GENESIS (2022)', desc: 'Debut album that introduced the world to a new kind of pop. 2x Platinum.', icon: '✨' }, { name: 'MIDNIGHT EP (2021)', desc: '6-track EP produced entirely during lockdown. Raw, intimate, unforgettable.', icon: '🌙' }],
      page4: { name: 'Tour', slug: '/tour', elements: [bentoFeatures('World Tour 2026 — ECLIPSE', 'See Kira live in your city.', [{ icon: '🇬🇧', title: 'London — O2 Arena', desc: 'March 15-16 • SOLD OUT' }, { icon: '🇺🇸', title: 'New York — MSG', desc: 'April 8-9 • Limited Tickets' }, { icon: '🇯🇵', title: 'Tokyo — Tokyo Dome', desc: 'May 22 • On Sale Now' }])] },
      page5: { name: 'Videos', slug: '/videos', elements: [gallerySection('Music Videos', [{ src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop', alt: 'Eclipse' }, { src: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=400&fit=crop', alt: 'Midnight Run' }, { src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop', alt: 'Neon Dreams' }, { src: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop', alt: 'Velocity' }, { src: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=600&h=400&fit=crop', alt: 'Genesis' }, { src: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&h=400&fit=crop', alt: 'Live at Wembley' }])] },
      page6: { name: 'Shop', slug: '/shop', elements: [gallerySection('Merchandise', [{ src: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600&h=400&fit=crop', alt: 'Tour Tee' }, { src: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=400&fit=crop', alt: 'Hoodie' }, { src: 'https://images.unsplash.com/photo-1588117305388-c2631a279f82?w=600&h=400&fit=crop', alt: 'Vinyl' }])] },
    }));
  })(),

  // 8. ARCHITECTURE STUDIO
  (() => {
    const brand = 'MONOLITH';
    const links = ['Projects', 'Practice', 'Process', 'Awards', 'Contact'];
    const homeEls = [
      heroSplit4('Architecture\nWithout\nCompromise', 'Award-winning design studio creating buildings that define skylines and shape communities. RIBA Gold Medal 2025.', 'View Projects', 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=900&fit=crop', { badge: 'RIBA GOLD MEDAL 2025' }),
      statsRow([{ value: '200+', label: 'Projects Built' }, { value: '35', label: 'Countries' }, { value: '28', label: 'Awards' }, { value: '£8B', label: 'Project Value' }]),
      gallerySection('Selected Projects', [
        { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop', alt: 'Skyline Tower' },
        { src: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&h=400&fit=crop', alt: 'Cultural Centre' },
        { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', alt: 'Lakeside Villa' },
      ]),
      ctaSection('Let\'s Build Something Extraordinary', 'From concept to completion, we bring architectural vision to life.', 'Start a Project'),
    ];
    return mk('architecture-studio', 'Architecture Studio', 'Minimal dark architecture with bold typography', 'Creative', [homeNav(brand, links), ...homeEls, homeFoot(brand)], build7Pages({
      brand, links, homeElements: homeEls,
      aboutHeading: 'Form Follows\nConviction', aboutDesc: 'Monolith is an internationally acclaimed architecture practice founded on the belief that buildings should serve people, enhance communities, and respect the planet.', aboutImg: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Context', desc: 'Every building responds to its unique cultural and environmental context.' }, { title: 'Sustainability', desc: 'Net-zero carbon as standard. Passive design principles in every project.' }, { title: 'Materiality', desc: 'Honest use of materials that age gracefully and tell their own story.' }],
      servicesTitle: 'Our Practice', services: [{ name: 'Architecture', desc: 'Residential, commercial, cultural, and mixed-use buildings at every scale.', icon: '🏛️' }, { name: 'Interior Design', desc: 'Spatial design that complements and enhances our architectural vision.', icon: '🎨' }, { name: 'Urban Planning', desc: 'Masterplans for new communities, regeneration projects, and public spaces.', icon: '🗺️' }, { name: 'Landscape', desc: 'Integrated landscape design that blurs the boundary between building and nature.', icon: '🌿' }],
      page4: { name: 'Projects', slug: '/projects', elements: [gallerySection('All Projects', [{ src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop', alt: 'Tower' }, { src: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&h=400&fit=crop', alt: 'Museum' }, { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', alt: 'Villa' }, { src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop', alt: 'Apartments' }, { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop', alt: 'Office' }, { src: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop', alt: 'School' }])] },
      page5: { name: 'Process', slug: '/process', elements: [processSection([{ step: '01', title: 'Brief & Vision', desc: 'Understanding your ambitions, constraints, and the spirit of the project.' }, { step: '02', title: 'Concept Design', desc: 'Exploring architectural ideas through sketches, models, and digital visualisations.' }, { step: '03', title: 'Technical Design', desc: 'Detailed drawings, specifications, and coordination with engineering consultants.' }, { step: '04', title: 'Construction', desc: 'On-site supervision ensuring the built reality matches the design vision.' }])] },
      page6: { name: 'Awards', slug: '/awards', elements: [bentoFeatures('Awards & Recognition', 'Recognised by the world\'s most prestigious institutions.', [{ icon: '🏆', title: 'RIBA Gold Medal 2025', desc: 'The highest honour for British architecture.' }, { icon: '🌍', title: 'Pritzker Prize Finalist', desc: 'Shortlisted for architecture\'s most prestigious award.' }, { icon: '🌱', title: 'BREEAM Outstanding', desc: 'Multiple projects achieving the highest sustainability rating.' }])] },
    }));
  })(),

  // 9. MEDICAL / HEALTHCARE
  (() => {
    const brand = 'VITALIS';
    const links = ['Specialties', 'Physicians', 'Patients', 'Research', 'Contact'];
    const homeEls = [
      heroSplit4('World-Class\nHealthcare,\nPersonalised', 'Combining cutting-edge medical science with compassionate, patient-centred care. Ranked among the top 10 private hospitals globally.', 'Book Appointment', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=900&fit=crop', { badge: 'TOP 10 PRIVATE HOSPITAL — NEWSWEEK 2026' }),
      statsRow([{ value: '50+', label: 'Specialties' }, { value: '300', label: 'Physicians' }, { value: '98.7%', label: 'Patient Satisfaction' }, { value: '#7', label: 'World Ranking' }]),
      servicesGrid('Medical Specialties', [
        { name: 'Cardiology', desc: 'Advanced cardiac surgery, interventional cardiology, and comprehensive heart failure management.', icon: '❤️' },
        { name: 'Oncology', desc: 'Precision medicine, immunotherapy, and personalised cancer treatment plans.', icon: '🔬' },
        { name: 'Neuroscience', desc: 'Neurosurgery, stroke treatment, and neurodegenerative disease management.', icon: '🧠' },
        { name: 'Orthopaedics', desc: 'Joint replacement, sports medicine, and minimally invasive spine surgery.', icon: '🦴' },
      ]),
      ctaSection('Your Health, Our Priority', 'Schedule a consultation with one of our world-renowned specialists.', 'Book Consultation'),
    ];
    return mk('healthcare', 'Healthcare & Medical', 'Clean dark medical/hospital with trust signals', 'Health', [homeNav(brand, links), ...homeEls, homeFoot(brand)], build7Pages({
      brand, links, homeElements: homeEls,
      aboutHeading: 'Pioneering\nMedical Excellence', aboutDesc: 'Vitalis was established to deliver healthcare at the highest international standard. Our 300+ physicians represent the finest medical talent in the world.', aboutImg: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Excellence', desc: 'Every physician is a recognised leader in their specialty.' }, { title: 'Innovation', desc: 'Early adopter of robotics, genomics, and AI diagnostics.' }, { title: 'Compassion', desc: 'Patient-centred care with multilingual concierge services.' }],
      servicesTitle: 'Medical Services', services: [{ name: 'Diagnostic Centre', desc: 'State-of-the-art imaging, laboratory, and genetic testing.', icon: '🔍' }, { name: 'Surgical Excellence', desc: 'Robotic surgery, minimally invasive techniques, and same-day procedures.', icon: '🏥' }, { name: 'Rehabilitation', desc: 'Comprehensive recovery programs with physiotherapy and occupational therapy.', icon: '💪' }, { name: 'Wellness', desc: 'Executive health checks, preventive medicine, and longevity programs.', icon: '🌿' }],
      page4: { name: 'Physicians', slug: '/physicians', elements: [el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' } }, [a(el('heading', { text: 'Our Physicians', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', marginBottom: '64px' } }), A_FADE), el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1000px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [{ name: 'Prof. Sarah Mitchell', role: 'Head of Cardiology' }, { name: 'Dr. James Park', role: 'Chief Oncologist' }, { name: 'Prof. Amira Hassan', role: 'Director of Neuroscience' }].map((p, i) => a(el('card', {}, { desktop: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' } }, [el('heading', { text: p.name, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }), el('text', { text: p.role }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)' } })]), { ...A_FADE, delay: i * 0.1 })))], 'Physicians')] },
      page5: { name: 'Patients', slug: '/patients', elements: [faqSection([{ q: 'How do I book an appointment?', a: 'You can book online, by phone, or through our patient app. Same-day appointments available for urgent cases.' }, { q: 'Do you accept insurance?', a: 'We accept all major international insurance providers. Our billing team can verify coverage before your visit.' }, { q: 'What languages do you support?', a: 'Our staff speaks 25+ languages with dedicated translators available for all consultations.' }])] },
      page6: { name: 'Research', slug: '/research', elements: [bentoFeatures('Research & Innovation', 'Advancing medical science through clinical trials and research partnerships.', [{ icon: '🧬', title: 'Genomics Lab', desc: 'Personalised treatment plans based on genetic profiling and biomarker analysis.' }, { icon: '🤖', title: 'AI Diagnostics', desc: 'Machine learning models improving diagnostic accuracy by 40%.' }, { icon: '💊', title: 'Clinical Trials', desc: '150+ active clinical trials across oncology, cardiology, and neuroscience.' }])] },
    }));
  })(),

  // 10. DIGITAL AGENCY
  (() => {
    const brand = 'KINETIC';
    const links = ['Work', 'Services', 'About', 'Careers', 'Contact'];
    const homeEls = [
      heroAurora('We Build Digital\nProducts That\nMove Markets', 'Strategy. Design. Engineering. A full-service digital agency for ambitious brands ready to lead their industry.', 'Start a Project', { badge: 'AWWWARDS — AGENCY OF THE YEAR', gradient: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(34,197,94,0.1) 0%, transparent 70%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(59,130,246,0.08) 0%, transparent 60%)' }),
      el('section', {}, { desktop: { padding: '60px 60px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', width: '100%' } }, [a(el('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', textAlign: 'center' } }, [el('text', { text: 'TRUSTED BY INDUSTRY LEADERS' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.15em', marginBottom: '32px', fontWeight: '600' } }), el('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '64px', flexWrap: 'wrap' } }, ['Nike', 'Airbnb', 'Spotify', 'Tesla', 'Netflix'].map(n => el('text', { text: n }, { desktop: { fontSize: '20px', fontWeight: '700', color: 'rgba(255,255,255,0.1)', letterSpacing: '0.04em' } })))]), A_FADE)]),
      statsRow([{ value: '200+', label: 'Projects Shipped' }, { value: '$500M+', label: 'Client Revenue Generated' }, { value: '98%', label: 'Client Retention' }, { value: '15', label: 'Awwwards' }]),
      servicesGrid('What We Do', [
        { name: 'Product Strategy', desc: 'Market research, user insights, and strategic roadmaps that align business goals with user needs.', icon: '🎯' },
        { name: 'UX/UI Design', desc: 'Research-driven design systems, prototypes, and interfaces that users love and businesses rely on.', icon: '🎨' },
        { name: 'Engineering', desc: 'Full-stack development with React, Node, and cloud-native architectures built for scale.', icon: '⚙️' },
        { name: 'Growth & Analytics', desc: 'Conversion optimization, A/B testing, and data-driven growth strategies that deliver ROI.', icon: '📈' },
      ]),
      gallerySection('Selected Work', [
        { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop', alt: 'Nike Digital' },
        { src: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600&h=400&fit=crop', alt: 'Fintech App' },
        { src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop', alt: 'Brand System' },
      ]),
      ctaSection('Let\'s Build Something\nThat Matters', 'We partner with ambitious brands to create digital products that change industries.', 'Get in Touch'),
    ];
    return mk('digital-agency', 'Digital Agency — Premium', 'Full-service dark digital agency with green accents', 'Agency', [homeNav(brand, links), ...homeEls, homeFoot(brand)], build7Pages({
      brand, links, homeElements: homeEls,
      aboutHeading: 'Craft at Scale,\nImpact at Speed', aboutDesc: 'Kinetic is a 75-person digital agency with studios in London, New York, and Tokyo. We combine strategic thinking with world-class execution to build products that move markets.', aboutImg: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Craft', desc: 'Obsessive attention to detail in every pixel, line of code, and user interaction.' }, { title: 'Impact', desc: 'We measure success by the business outcomes we drive, not the hours we bill.' }, { title: 'Culture', desc: 'Diverse, ambitious team united by a shared passion for building great things.' }],
      servicesTitle: 'Our Services', services: [{ name: 'Strategy', desc: 'Brand positioning, market analysis, and digital transformation roadmaps.', icon: '🎯' }, { name: 'Design', desc: 'UX research, UI design, design systems, and brand identity.', icon: '🎨' }, { name: 'Engineering', desc: 'Web apps, mobile apps, APIs, and cloud infrastructure.', icon: '⚙️' }, { name: 'Growth', desc: 'SEO, performance marketing, CRO, and analytics.', icon: '📈' }],
      page4: { name: 'Work', slug: '/work', elements: [gallerySection('Case Studies', [{ src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop', alt: 'Nike Digital' }, { src: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600&h=400&fit=crop', alt: 'Fintech App' }, { src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop', alt: 'Brand System' }, { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop', alt: 'SaaS Platform' }, { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', alt: 'Analytics Dashboard' }, { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', alt: 'E-commerce' }])] },
      page5: { name: 'Careers', slug: '/careers', elements: [bentoFeatures('Join Our Team', 'We\'re always looking for talented people who care about craft.', [{ icon: '🎨', title: 'Product Designer', desc: 'London • Full-time • Shape products used by millions.' }, { icon: '⚙️', title: 'Senior Engineer', desc: 'Remote • Full-time • Build scalable systems for global brands.' }, { icon: '📊', title: 'Growth Strategist', desc: 'New York • Full-time • Drive measurable business outcomes.' }])] },
      page6: { name: 'Blog', slug: '/blog', elements: [gallerySection('Latest Articles', [{ src: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=600&h=400&fit=crop', alt: 'Design Systems' }, { src: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop', alt: 'Team Culture' }, { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop', alt: 'AI in Design' }])] },
    }));
  })(),
];
