import { DesignerTemplate, EditorElement, TemplatePage } from '../types';

let _counter = 0;
function uid(): string {
  _counter++;
  return `tpl-${_counter}-${Math.random().toString(36).slice(2, 8)}`;
}

function el(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: uid(), type, name: name ?? type, props, styles, children };
}

// ── Premium building blocks ─────────────────────────────────────────

function premiumNav(brand: string, links: string[], style: 'dark' | 'light' | 'glass' = 'dark') {
  const bg = style === 'dark' ? '#000000' : style === 'glass' ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const fg = style === 'light' ? '#111' : '#ffffff';
  const linkColor = style === 'light' ? '#555' : 'rgba(255,255,255,0.6)';
  const border = style === 'dark' ? '1px solid rgba(255,255,255,0.06)' : style === 'glass' ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0f0f0';
  return el('navbar', { brand }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', width: '100%', backgroundColor: bg, borderBottom: border, backdropFilter: style === 'glass' ? 'blur(20px)' : undefined }, mobile: { padding: '16px 24px' } }, [
    el('link', { text: brand, href: '/' }, { desktop: { fontSize: '18px', fontWeight: '700', color: fg, letterSpacing: '0.08em', textTransform: 'uppercase' as any, textDecoration: 'none', cursor: 'pointer' } }),
    el('container', {}, { desktop: { display: 'flex', gap: '36px', alignItems: 'center' } }, links.map(l =>
      el('link', { text: l, href: '/' + l.toLowerCase().replace(/\s+/g, '-') }, { desktop: { fontSize: '13px', color: linkColor, textDecoration: 'none', fontWeight: '500', letterSpacing: '0.02em' } })
    )),
  ], 'Navigation');
}

function premiumFoot(brand: string, style: 'dark' | 'minimal' = 'dark') {
  const bg = style === 'dark' ? '#000' : '#fafafa';
  const fg = style === 'dark' ? '#444' : '#999';
  return el('footer', {}, { desktop: { padding: '60px', backgroundColor: bg, textAlign: 'center', width: '100%', borderTop: style === 'dark' ? '1px solid #111' : '1px solid #eee' } }, [
    el('text', { text: `© 2026 ${brand}. All rights reserved.` }, { desktop: { color: fg, fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
  ], 'Footer');
}

function splitHero(heading: string, sub: string, cta: string, imgUrl: string, opts: { bg?: string; accent?: string; reverse?: boolean; overlay?: string } = {}) {
  const bg = opts.bg || '#000';
  const accent = opts.accent || '#fff';
  return el('section', {}, { desktop: { display: 'grid', gridTemplateColumns: opts.reverse ? '1fr 1fr' : '1fr 1fr', minHeight: '90vh', backgroundColor: bg }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
    el('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', order: opts.reverse ? '1' : '0' }, mobile: { padding: '60px 24px' } }, [
      el('heading', { text: heading, level: 'h1' }, { desktop: { fontSize: '54px', fontWeight: '700', color: accent, lineHeight: '1.08', letterSpacing: '-0.03em', marginBottom: '24px' }, mobile: { fontSize: '34px' } }),
      el('text', { text: sub }, { desktop: { fontSize: '17px', color: accent === '#fff' ? 'rgba(255,255,255,0.55)' : '#666', lineHeight: '1.7', marginBottom: '40px', maxWidth: '420px' } }),
      el('button', { text: cta, href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: accent === '#fff' ? '#fff' : '#111', color: accent === '#fff' ? '#000' : '#fff', borderRadius: '0px', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any, width: 'fit-content' } }),
    ]),
    el('container', {}, { desktop: { position: 'relative', overflow: 'hidden', order: opts.reverse ? '0' : '1' } }, [
      el('image', { src: imgUrl, alt: 'Hero' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }),
    ]),
  ], 'Hero');
}

function fullBleedHero(heading: string, sub: string, cta: string, imgUrl: string, opts: { overlay?: string; align?: 'center' | 'left' } = {}) {
  const align = opts.align || 'center';
  return el('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: align === 'center' ? 'center' : 'flex-start', backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } }, [
    el('container', {}, { desktop: { position: 'absolute', inset: '0', backgroundColor: opts.overlay || 'rgba(0,0,0,0.55)' } }),
    el('container', {}, { desktop: { position: 'relative', zIndex: '1', padding: align === 'left' ? '0 60px' : '0 40px', textAlign: align, maxWidth: align === 'left' ? '700px' : '900px' }, mobile: { padding: '0 24px' } }, [
      el('heading', { text: heading, level: 'h1' }, { desktop: { fontSize: align === 'center' ? '68px' : '58px', fontWeight: '700', color: '#fff', lineHeight: '1.06', letterSpacing: '-0.03em', marginBottom: '24px' }, mobile: { fontSize: '36px' } }),
      el('text', { text: sub }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', marginBottom: '40px', maxWidth: '600px', margin: align === 'center' ? '0 auto 40px' : '0 0 40px 0' } }),
      el('button', { text: cta, href: '#' }, { desktop: { padding: '18px 44px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
    ]),
  ], 'Hero');
}

function imageTextRow(heading: string, text: string, imgUrl: string, opts: { bg?: string; fg?: string; reverse?: boolean; accent?: string } = {}) {
  const bg = opts.bg || '#fff';
  const fg = opts.fg || '#111';
  return el('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: bg, minHeight: '500px' }, mobile: { gridTemplateColumns: '1fr' } }, [
    el('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', order: opts.reverse ? '1' : '0' }, mobile: { padding: '48px 24px' } }, [
      el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '38px', fontWeight: '700', color: fg, letterSpacing: '-0.02em', marginBottom: '20px', lineHeight: '1.15' } }),
      el('text', { text }, { desktop: { fontSize: '16px', color: fg === '#111' ? '#666' : 'rgba(255,255,255,0.6)', lineHeight: '1.8', maxWidth: '440px' } }),
    ]),
    el('container', {}, { desktop: { overflow: 'hidden', order: opts.reverse ? '0' : '1' } }, [
      el('image', { src: imgUrl, alt: heading }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
    ]),
  ], heading);
}

function premiumFeatures(title: string, sub: string, features: { title: string; desc: string }[], opts: { bg?: string; fg?: string; accent?: string; cols?: number } = {}) {
  const bg = opts.bg || '#0a0a0a';
  const fg = opts.fg || '#fff';
  const cardBg = bg === '#0a0a0a' ? '#111' : bg === '#fff' || bg === '#ffffff' ? '#f7f7f7' : '#1a1a1a';
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: bg } }, [
    el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', marginBottom: '64px' } }, [
      el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: fg, letterSpacing: '-0.02em', marginBottom: '16px' } }),
      el('text', { text: sub }, { desktop: { fontSize: '17px', color: fg === '#fff' ? 'rgba(255,255,255,0.5)' : '#888', maxWidth: '500px', lineHeight: '1.6' } }),
    ]),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${opts.cols || 3}, 1fr)`, gap: '20px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, features.map(f =>
      el('card', {}, { desktop: { padding: '40px', backgroundColor: cardBg, borderRadius: '12px', border: bg === '#0a0a0a' ? '1px solid #1a1a1a' : 'none' } }, [
        el('heading', { text: f.title, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: fg, marginBottom: '12px', letterSpacing: '-0.01em' } }),
        el('text', { text: f.desc }, { desktop: { color: fg === '#fff' ? 'rgba(255,255,255,0.45)' : '#888', fontSize: '14px', lineHeight: '1.7' } }),
      ])
    )),
  ], 'Features');
}

function premiumStats(stats: { value: string; label: string }[], opts: { bg?: string; fg?: string; border?: boolean } = {}) {
  const bg = opts.bg || '#000';
  const fg = opts.fg || '#fff';
  return el('section', {}, { desktop: { padding: '80px 60px', backgroundColor: bg, borderTop: opts.border ? '1px solid rgba(255,255,255,0.06)' : undefined, borderBottom: opts.border ? '1px solid rgba(255,255,255,0.06)' : undefined } }, [
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: '40px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' } }, stats.map(s =>
      el('container', {}, { desktop: {} }, [
        el('heading', { text: s.value, level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '700', color: fg, marginBottom: '8px', letterSpacing: '-0.03em' } }),
        el('text', { text: s.label }, { desktop: { fontSize: '11px', color: fg === '#fff' ? 'rgba(255,255,255,0.35)' : '#999', textTransform: 'uppercase' as any, letterSpacing: '0.12em', fontWeight: '600' } }),
      ])
    )),
  ], 'Stats');
}

function premiumTestimonials(items: { quote: string; name: string; role: string }[], opts: { bg?: string; fg?: string } = {}) {
  const bg = opts.bg || '#000';
  const fg = opts.fg || '#fff';
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: bg } }, [
    el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
      el('heading', { text: 'Client Testimonials', level: 'h2' }, { desktop: { fontSize: '14px', fontWeight: '600', color: fg === '#fff' ? 'rgba(255,255,255,0.35)' : '#999', textTransform: 'uppercase' as any, letterSpacing: '0.12em', marginBottom: '56px' } }),
      el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: '32px' }, mobile: { gridTemplateColumns: '1fr' } }, items.map(t =>
        el('card', {}, { desktop: { padding: '40px', backgroundColor: bg === '#000' ? '#0a0a0a' : bg === '#fff' || bg === '#ffffff' ? '#f7f7f7' : '#111', borderRadius: '12px', border: bg === '#000' ? '1px solid #1a1a1a' : 'none' } }, [
          el('text', { text: `"${t.quote}"` }, { desktop: { fontSize: '16px', color: fg === '#fff' ? 'rgba(255,255,255,0.7)' : '#444', lineHeight: '1.7', marginBottom: '24px' } }),
          el('text', { text: t.name }, { desktop: { fontSize: '14px', fontWeight: '700', color: fg } }),
          el('text', { text: t.role }, { desktop: { fontSize: '12px', color: fg === '#fff' ? 'rgba(255,255,255,0.3)' : '#aaa', marginTop: '2px' } }),
        ])
      )),
    ]),
  ], 'Testimonials');
}

function premiumCTA(heading: string, sub: string, btn: string, opts: { bg?: string; accent?: string } = {}) {
  const bg = opts.bg || '#fff';
  const fg = bg === '#fff' || bg === '#ffffff' ? '#000' : '#fff';
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: bg, textAlign: 'center' } }, [
    el('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto' } }, [
      el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '46px', fontWeight: '700', color: fg, letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: '1.1' } }),
      el('text', { text: sub }, { desktop: { fontSize: '16px', color: fg === '#fff' ? 'rgba(255,255,255,0.5)' : '#777', marginBottom: '36px', lineHeight: '1.6' } }),
      el('button', { text: btn, href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: fg, color: bg, borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
    ]),
  ], 'CTA');
}

function premiumPricing(plans: { name: string; price: string; features: string; popular?: boolean }[], opts: { bg?: string; fg?: string } = {}) {
  const bg = opts.bg || '#0a0a0a';
  const fg = opts.fg || '#fff';
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: bg } }, [
    el('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto' } }, [
      el('heading', { text: 'Pricing', level: 'h2' }, { desktop: { fontSize: '14px', fontWeight: '600', color: fg === '#fff' ? 'rgba(255,255,255,0.35)' : '#999', textTransform: 'uppercase' as any, letterSpacing: '0.12em', marginBottom: '56px' } }),
      el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: '16px' }, mobile: { gridTemplateColumns: '1fr' } }, plans.map(p =>
        el('card', {}, { desktop: { padding: '44px', borderRadius: '12px', border: p.popular ? '1px solid rgba(255,255,255,0.15)' : `1px solid ${bg === '#0a0a0a' ? '#1a1a1a' : '#e8e8e8'}`, backgroundColor: p.popular ? (bg === '#0a0a0a' ? '#111' : '#f0f0f0') : 'transparent' } }, [
          ...(p.popular ? [el('badge', { text: 'POPULAR' }, { desktop: { padding: '4px 12px', backgroundColor: '#fff', color: '#000', borderRadius: '2px', fontSize: '9px', fontWeight: '700', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.1em' } })] : []),
          el('heading', { text: p.name, level: 'h3' }, { desktop: { fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: fg, letterSpacing: '0.02em' } }),
          el('heading', { text: p.price, level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: fg, marginBottom: '24px', letterSpacing: '-0.03em' } }),
          el('text', { text: p.features }, { desktop: { fontSize: '13px', color: fg === '#fff' ? 'rgba(255,255,255,0.4)' : '#888', lineHeight: '2.2', whiteSpace: 'pre-line', marginBottom: '32px' } }),
          el('button', { text: 'Get Started', href: '#' }, { desktop: { padding: '14px 28px', backgroundColor: p.popular ? '#fff' : 'transparent', color: p.popular ? '#000' : fg, borderRadius: '0', fontSize: '12px', fontWeight: '600', border: p.popular ? 'none' : `1px solid ${fg === '#fff' ? 'rgba(255,255,255,0.2)' : '#ddd'}`, width: '100%', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
        ])
      )),
    ]),
  ], 'Pricing');
}

function premiumContact(opts: { bg?: string; fg?: string } = {}) {
  const bg = opts.bg || '#000';
  const fg = opts.fg || '#fff';
  const inputBg = bg === '#000' ? '#0a0a0a' : '#f5f5f5';
  const inputBorder = bg === '#000' ? '#1a1a1a' : '#e0e0e0';
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: bg } }, [
    el('container', {}, { desktop: { maxWidth: '560px', margin: '0 auto' } }, [
      el('heading', { text: 'Get In Touch', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: fg, marginBottom: '40px', letterSpacing: '-0.02em' } }),
      el('form', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
        el('input', { placeholder: 'Full Name', label: '', inputType: 'text' }, { desktop: { padding: '16px', borderRadius: '0', border: `1px solid ${inputBorder}`, fontSize: '14px', width: '100%', backgroundColor: inputBg, color: fg } }),
        el('input', { placeholder: 'Email Address', label: '', inputType: 'email' }, { desktop: { padding: '16px', borderRadius: '0', border: `1px solid ${inputBorder}`, fontSize: '14px', width: '100%', backgroundColor: inputBg, color: fg } }),
        el('textarea', { placeholder: 'Your message…', label: '' }, { desktop: { padding: '16px', borderRadius: '0', border: `1px solid ${inputBorder}`, fontSize: '14px', width: '100%', minHeight: '140px', backgroundColor: inputBg, color: fg } }),
        el('button', { text: 'Send', href: '#' }, { desktop: { padding: '18px 32px', backgroundColor: fg, color: bg, borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
      ]),
    ]),
  ], 'Contact');
}

function imageGallery(title: string, images: { src: string; alt: string }[], opts: { bg?: string; cols?: number } = {}) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: opts.bg || '#000' } }, [
    el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
      el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as any, letterSpacing: '0.12em', marginBottom: '48px' } }),
      el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${opts.cols || 3}, 1fr)`, gap: '8px' }, mobile: { gridTemplateColumns: '1fr' } }, images.map(img =>
        el('image', { src: img.src, alt: img.alt }, { desktop: { width: '100%', height: '320px', objectFit: 'cover', display: 'block' } })
      )),
    ]),
  ], title);
}

function makeTemplate(id: string, name: string, desc: string, category: string, elements: EditorElement[], pages?: TemplatePage[]): DesignerTemplate {
  return { id, name, description: desc, category, elements, pages };
}

// ── Cinematic animation presets ──────────────────────────────────

function withAnim(element: EditorElement, anim: EditorElement['animations']): EditorElement {
  return { ...element, animations: anim };
}

const ANIM_FADE_UP = { type: 'fadeInUp' as const, duration: 0.8, delay: 0, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
const ANIM_FADE_LEFT = { type: 'fadeInLeft' as const, duration: 0.9, delay: 0.1, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
const ANIM_FADE_RIGHT = { type: 'fadeInRight' as const, duration: 0.9, delay: 0.1, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
const ANIM_SCALE_IN = { type: 'scaleIn' as const, duration: 1, delay: 0.2, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
const ANIM_BLUR_IN = { type: 'blurIn' as const, duration: 1.2, delay: 0, trigger: 'onView' as const };
const ANIM_REVEAL = { type: 'reveal' as const, duration: 0.8, delay: 0, trigger: 'onScroll' as const };
const ANIM_PARALLAX = { type: 'parallax' as const, duration: 0, delay: 0, trigger: 'onScroll' as const, scrollParallax: '0.3' };
const ANIM_TILT = { type: 'tiltIn' as const, duration: 1, delay: 0.15, trigger: 'onView' as const, perspective: '1200px', rotateY: '8deg' };
const ANIM_STAGGER_1 = { type: 'fadeInUp' as const, duration: 0.6, delay: 0.1, trigger: 'onView' as const, stagger: 0.08 };
const ANIM_STAGGER_2 = { type: 'fadeInUp' as const, duration: 0.6, delay: 0.2, trigger: 'onView' as const, stagger: 0.08 };
const ANIM_STAGGER_3 = { type: 'fadeInUp' as const, duration: 0.6, delay: 0.3, trigger: 'onView' as const, stagger: 0.08 };
const ANIM_FLOAT = { type: 'float' as const, duration: 3, delay: 0, trigger: 'onLoad' as const, loop: true };
const ANIM_GLOW = { type: 'glow' as const, duration: 2, delay: 0, trigger: 'onLoad' as const, loop: true };
const ANIM_TYPEWRITER = { type: 'typewriter' as const, duration: 2, delay: 0.5, trigger: 'onView' as const };

// ── Premium page builders with animations ────────────────────────

function cinematicHero(heading: string, sub: string, cta: string, imgUrl: string, opts: { bg?: string; gradient?: string; badge?: string } = {}) {
  const bg = opts.bg || '#000';
  return withAnim(el('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: bg } }, [
    el('container', {}, { desktop: { position: 'absolute', inset: '0', zIndex: '0' } }, [
      withAnim(el('image', { src: imgUrl, alt: 'Hero' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', opacity: '0.4' } }), ANIM_SCALE_IN),
    ]),
    opts.gradient ? el('container', {}, { desktop: { position: 'absolute', inset: '0', background: opts.gradient, zIndex: '1' } }) : el('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)', zIndex: '1' } }),
    el('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '900px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
      ...(opts.badge ? [withAnim(el('badge', { text: opts.badge }, { desktop: { padding: '8px 20px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderRadius: '2px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '28px', letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.08)' } }), ANIM_FADE_UP)] : []),
      withAnim(el('heading', { text: heading, level: 'h1' }, { desktop: { fontSize: '76px', fontWeight: '700', color: '#fff', lineHeight: '1.02', letterSpacing: '-0.04em', marginBottom: '24px' }, mobile: { fontSize: '42px' } }), ANIM_BLUR_IN),
      withAnim(el('text', { text: sub }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.7', marginBottom: '44px', maxWidth: '560px', margin: '0 auto 44px' } }), { ...ANIM_FADE_UP, delay: 0.3 }),
      withAnim(el('container', {}, { desktop: { display: 'flex', gap: '14px', justifyContent: 'center' } }, [
        el('button', { text: cta, href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
        el('button', { text: 'Learn More', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: 'transparent', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
      ]), { ...ANIM_FADE_UP, delay: 0.5 }),
    ]),
  ], 'Hero'), ANIM_REVEAL);
}

function cinematicAbout(heading: string, sub: string, imgUrl: string, values: { title: string; desc: string }[], opts: { bg?: string } = {}) {
  const bg = opts.bg || '#0a0a0a';
  return el('section', {}, { desktop: { backgroundColor: bg } }, [
    withAnim(el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '600px' }, mobile: { gridTemplateColumns: '1fr' } }, [
      el('container', {}, { desktop: { padding: '100px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '60px 24px' } }, [
        withAnim(el('text', { text: 'ABOUT US' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '20px', fontWeight: '700' } }), ANIM_FADE_UP),
        withAnim(el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '24px' } }), ANIM_FADE_LEFT),
        withAnim(el('text', { text: sub }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', maxWidth: '440px' } }), { ...ANIM_FADE_UP, delay: 0.2 }),
      ]),
      withAnim(el('container', {}, { desktop: { overflow: 'hidden' } }, [
        el('image', { src: imgUrl, alt: 'About' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ]), ANIM_TILT),
    ]), ANIM_REVEAL),
    withAnim(el('container', {}, { desktop: { padding: '80px 60px', maxWidth: '1200px', margin: '0 auto' } }, [
      el('heading', { text: 'Our Values', level: 'h3' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' as any, marginBottom: '40px', fontWeight: '700' } }),
      el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${values.length}, 1fr)`, gap: '24px' }, mobile: { gridTemplateColumns: '1fr' } }, values.map((v, i) =>
        withAnim(el('card', {}, { desktop: { padding: '32px', backgroundColor: '#111', borderRadius: '8px', border: '1px solid #1a1a1a' } }, [
          el('heading', { text: v.title, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '10px' } }),
          el('text', { text: v.desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
        ]), { ...ANIM_FADE_UP, delay: i * 0.1 })
      )),
    ]), ANIM_REVEAL),
  ], 'About');
}

function cinematicServices(title: string, services: { name: string; desc: string; imgUrl: string }[], opts: { bg?: string } = {}) {
  const bg = opts.bg || '#000';
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: bg } }, [
    withAnim(el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', marginBottom: '72px' } }, [
      el('text', { text: 'WHAT WE DO' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.1' } }),
    ]), ANIM_FADE_UP),
    el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2px' } }, services.map((s, i) =>
      withAnim(el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '400px', backgroundColor: '#0a0a0a', overflow: 'hidden' }, mobile: { gridTemplateColumns: '1fr' } }, [
        el('container', {}, { desktop: { padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', order: i % 2 === 0 ? '0' : '1' }, mobile: { padding: '40px 24px', order: '0' } }, [
          el('heading', { text: s.name, level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '16px', letterSpacing: '-0.02em' } }),
          el('text', { text: s.desc }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.8' } }),
        ]),
        el('container', {}, { desktop: { overflow: 'hidden', order: i % 2 === 0 ? '1' : '0' }, mobile: { order: '1' } }, [
          withAnim(el('image', { src: s.imgUrl, alt: s.name }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }), ANIM_SCALE_IN),
        ]),
      ]), { ...ANIM_FADE_UP, delay: i * 0.15 })
    )),
  ], 'Services');
}

function cinematicPortfolio(title: string, projects: { name: string; category: string; imgUrl: string }[], opts: { bg?: string } = {}) {
  const bg = opts.bg || '#0a0a0a';
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: bg } }, [
    withAnim(el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', marginBottom: '64px' } }, [
      el('text', { text: 'PORTFOLIO' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' } }),
    ]), ANIM_FADE_UP),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, projects.map((p, i) =>
      withAnim(el('card', {}, { desktop: { borderRadius: '8px', overflow: 'hidden', backgroundColor: '#111', border: '1px solid #1a1a1a', position: 'relative' } }, [
        el('image', { src: p.imgUrl, alt: p.name }, { desktop: { width: '100%', height: '300px', objectFit: 'cover' } }),
        el('container', {}, { desktop: { padding: '24px' } }, [
          el('text', { text: p.category }, { desktop: { fontSize: '9px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' as any, marginBottom: '8px', fontWeight: '700' } }),
          el('heading', { text: p.name, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff' } }),
        ]),
      ]), { ...ANIM_FADE_UP, delay: i * 0.1 })
    )),
  ], 'Portfolio');
}

// ── Auto 5-page generator ────────────────────────────────────────
// Creates standardized 5-page structure for any template

function contactHeroSection(title: string) {
  return withAnim(el('section', {}, { desktop: { padding: '160px 60px 40px', textAlign: 'center', backgroundColor: '#000' } }, [
    el('heading', { text: title, level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em' } }),
    el('text', { text: 'We\'d love to hear from you. Get in touch and let\'s start a conversation.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginTop: '16px', maxWidth: '460px', margin: '16px auto 0' } }),
  ], 'Contact Hero'), ANIM_BLUR_IN);
}

interface PageConfig {
  brand: string;
  links: string[];
  homeElements: EditorElement[];
  aboutHeading: string;
  aboutDesc: string;
  aboutImg: string;
  aboutValues: { title: string; desc: string }[];
  servicesTitle: string;
  services: { name: string; desc: string; imgUrl: string }[];
  page4: { name: string; slug: string; elements: EditorElement[] };
}

function autoPages(cfg: PageConfig): TemplatePage[] {
  const nav = premiumNav(cfg.brand, cfg.links, 'dark');
  const foot = premiumFoot(cfg.brand);
  return [
    { name: 'Home', slug: '/', elements: [nav, ...cfg.homeElements, foot] },
    { name: 'About', slug: '/about', elements: [
      nav,
      cinematicAbout(cfg.aboutHeading, cfg.aboutDesc, cfg.aboutImg, cfg.aboutValues),
      withAnim(premiumStats([{ value: '10+', label: 'Years Experience' }, { value: '500+', label: 'Happy Clients' }, { value: '98%', label: 'Satisfaction' }, { value: '25+', label: 'Awards Won' }], { border: true }), ANIM_FADE_UP),
      withAnim(imageTextRow('Our Mission', 'We believe in delivering exceptional results through innovation, dedication, and a relentless pursuit of excellence. Every project we undertake reflects our commitment to quality and our passion for making a real difference.', cfg.aboutImg, { bg: '#000', fg: '#fff' }), ANIM_REVEAL),
      withAnim(premiumTestimonials([
        { quote: 'Working with ' + cfg.brand + ' transformed our business. Their expertise and professionalism exceeded all expectations.', name: 'Alex Thompson', role: 'CEO, Innovate Co' },
        { quote: 'The team delivered outstanding results on time and on budget. Highly recommended for any serious project.', name: 'Sarah Mitchell', role: 'Director, Growth Labs' },
        { quote: 'Exceptional quality and attention to detail. They truly understand what modern businesses need.', name: 'James Chen', role: 'Founder, NextGen' },
      ]), ANIM_FADE_UP),
      withAnim(premiumCTA('Join Our Journey', 'We\'re always looking for talented people and exciting partnerships.', 'Get in Touch', { bg: '#0a0a0a' }), ANIM_FADE_UP),
      foot,
    ]},
    { name: 'Services', slug: '/services', elements: [
      nav,
      withAnim(el('section', {}, { desktop: { padding: '160px 60px 80px', textAlign: 'center', backgroundColor: '#000' } }, [
        el('text', { text: 'WHAT WE DO' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
        el('heading', { text: cfg.servicesTitle, level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' } }),
        el('text', { text: 'Comprehensive solutions designed to elevate your business and drive measurable growth.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', maxWidth: '560px', margin: '0 auto' } }),
      ], 'Services Hero'), ANIM_BLUR_IN),
      cinematicServices(cfg.servicesTitle, cfg.services),
      withAnim(premiumFeatures('Why Choose Us', 'What sets us apart from the competition.', [
        { title: 'Expert Team', desc: 'Seasoned professionals with deep industry expertise and proven track records.' },
        { title: 'Tailored Approach', desc: 'Every solution is custom-built to match your unique goals and challenges.' },
        { title: 'Results-Driven', desc: 'We measure success by the tangible outcomes we deliver for our clients.' },
        { title: 'Ongoing Support', desc: 'Long-term partnership with dedicated support at every stage.' },
      ], { cols: 4 }), ANIM_FADE_UP),
      withAnim(premiumPricing([
        { name: 'Starter', price: '$49/mo', features: 'Core features included\nEmail support\nBasic analytics\nUp to 5 users' },
        { name: 'Professional', price: '$99/mo', features: 'Everything in Starter\nPriority support\nAdvanced analytics\nUnlimited users\nCustom branding', popular: true },
        { name: 'Enterprise', price: 'Custom', features: 'Everything in Pro\nDedicated manager\nSLA guarantee\nAPI access\nCustom integrations' },
      ]), ANIM_FADE_UP),
      withAnim(premiumCTA('Ready to Get Started?', 'Let\'s discuss how we can help you achieve your goals.', 'Get in Touch', { bg: '#0a0a0a' }), ANIM_FADE_UP),
      foot,
    ]},
    { name: cfg.page4.name, slug: cfg.page4.slug, elements: [nav, ...cfg.page4.elements, foot] },
    { name: 'Contact', slug: '/contact', elements: [
      nav,
      contactHeroSection('Get In Touch'),
      withAnim(premiumFeatures('Why Reach Out', 'We\'re here to help with any enquiry.', [
        { title: 'Free Consultation', desc: 'Book a no-obligation call to discuss your needs and explore solutions.' },
        { title: 'Quick Response', desc: 'We aim to respond to all enquiries within 24 hours.' },
        { title: 'Flexible Options', desc: 'We offer tailored packages to suit budgets of all sizes.' },
      ]), ANIM_FADE_UP),
      withAnim(premiumContact(), ANIM_FADE_UP),
      withAnim(el('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#000', textAlign: 'center' } }, [
        el('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto' } }, [
          el('heading', { text: 'Visit Us', level: 'h3' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as any, letterSpacing: '0.12em', marginBottom: '24px' } }),
          el('text', { text: '123 Business Street, Suite 100\nLondon, EC2A 1NT', }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8', whiteSpace: 'pre-line', marginBottom: '16px' } }),
          el('text', { text: 'hello@' + cfg.brand.toLowerCase().replace(/[^a-z]/g, '') + '.com  |  +44 20 7123 4567' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)' } }),
        ]),
      ], 'Location'), ANIM_FADE_UP),
      foot,
    ]},
  ];
}

//  ALL 50 PREMIUM TEMPLATES — $15K+ QUALITY
// ═══════════════════════════════════════════════════════════════════

export const TEMPLATES: DesignerTemplate[] = [

  // ─── STARTER (2) ─────────────────────────────────────────────────
  makeTemplate('blank', 'Blank Canvas', 'Start from scratch with a clean slate', 'Starter', [
    el('section', {}, { desktop: { padding: '120px 60px', minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' } }, [
      el('heading', { text: 'Start Building', level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em' } }),
    ], 'Hero Section'),
  ], [
    { name: 'Home', slug: '/', elements: [
      premiumNav('Brand', ['About', 'Services', 'Portfolio', 'Contact'], 'dark'),
      cinematicHero('Start Building\nSomething Great', 'A clean canvas ready for your vision.', 'Get Started', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1920&h=1080&fit=crop'),
      premiumFoot('Brand'),
    ]},
    { name: 'About', slug: '/about', elements: [
      premiumNav('Brand', ['About', 'Services', 'Portfolio', 'Contact'], 'dark'),
      cinematicAbout('About Us', 'Tell your story here.', 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=900&fit=crop', [
        { title: 'Our Mission', desc: 'Describe your mission and vision.' },
        { title: 'Our Values', desc: 'Share what drives your team.' },
        { title: 'Our Story', desc: 'How it all began.' },
      ]),
      premiumFoot('Brand'),
    ]},
    { name: 'Services', slug: '/services', elements: [
      premiumNav('Brand', ['About', 'Services', 'Portfolio', 'Contact'], 'dark'),
      withAnim(premiumFeatures('Our Services', 'What we offer.', [
        { title: 'Service One', desc: 'Describe your first service offering.' },
        { title: 'Service Two', desc: 'Describe your second service offering.' },
        { title: 'Service Three', desc: 'Describe your third service offering.' },
      ]), ANIM_FADE_UP),
      premiumFoot('Brand'),
    ]},
    { name: 'Portfolio', slug: '/portfolio', elements: [
      premiumNav('Brand', ['About', 'Services', 'Portfolio', 'Contact'], 'dark'),
      cinematicPortfolio('Our Work', [
        { name: 'Project One', category: 'Design', imgUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop' },
        { name: 'Project Two', category: 'Development', imgUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=800&h=500&fit=crop' },
      ]),
      premiumFoot('Brand'),
    ]},
    { name: 'Contact', slug: '/contact', elements: [
      premiumNav('Brand', ['About', 'Services', 'Portfolio', 'Contact'], 'dark'),
      contactHeroSection('Contact Us'),
      withAnim(premiumContact(), ANIM_FADE_UP),
      premiumFoot('Brand'),
    ]},
  ]),

  makeTemplate('minimal-starter', 'Minimal Starter', 'Ultra-clean dark starter with hero image', 'Starter', [
    premiumNav('Brand', ['About', 'Work', 'Contact'], 'dark'),
    splitHero('Design Without\nCompromise', 'A refined starting point for brands that demand excellence.', 'Get Started', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=900&fit=crop'),
    premiumFoot('Brand'),
  ], autoPages({
    brand: 'Brand', links: ['About', 'Work', 'Services', 'Contact'],
    homeElements: [
      splitHero('Design Without\nCompromise', 'A refined starting point for brands that demand excellence.', 'Get Started', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=900&fit=crop'),
      withAnim(premiumFeatures('What We Do', 'Crafted with precision.', [
        { title: 'Design', desc: 'Beautiful, intuitive design that captivates your audience.' },
        { title: 'Development', desc: 'Clean, performant code built to last.' },
        { title: 'Strategy', desc: 'Data-driven decisions for measurable growth.' },
      ]), ANIM_FADE_UP),
    ],
    aboutHeading: 'Crafted with\nPurpose', aboutDesc: 'We believe in the power of minimalism to create lasting impressions.',
    aboutImg: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Simplicity', desc: 'Less is more. Every element earns its place.' }, { title: 'Quality', desc: 'Meticulous attention to detail in everything.' }, { title: 'Impact', desc: 'Design that drives real business results.' }],
    servicesTitle: 'Our Services',
    services: [
      { name: 'Brand Identity', desc: 'Complete visual identity systems that define your presence.', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop' },
      { name: 'Web Design', desc: 'Pixel-perfect responsive websites built for conversion.', imgUrl: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=800&h=600&fit=crop' },
      { name: 'Digital Strategy', desc: 'Data-driven growth plans tailored to your goals.', imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Work', slug: '/work', elements: [
      cinematicPortfolio('Selected Work', [
        { name: 'Project Alpha', category: 'Brand', imgUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop' },
        { name: 'Project Beta', category: 'Web', imgUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=500&fit=crop' },
      ]),
    ]},
  })),

  // ─── BUSINESS (6) ────────────────────────────────────────────────
  // business-landing, corporate, consulting already have 5 pages (kept as-is)
  makeTemplate('business-landing', 'Business Landing', '5-page cinematic enterprise platform with parallax & 3D reveals', 'Business', [
    premiumNav('Vertex', ['Solutions', 'Platform', 'Pricing', 'Contact'], 'dark'),
    cinematicHero('We Build the\nFuture of Work', 'Enterprise solutions that scale with ambition. From startup to IPO.', 'Request Demo', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop', { badge: 'TRUSTED BY 500+ ENTERPRISES', gradient: 'radial-gradient(ellipse at 30% 80%, rgba(0,50,100,0.2) 0%, transparent 60%)' }),
    premiumStats([{ value: '500+', label: 'Enterprise Clients' }, { value: '99.9%', label: 'Uptime SLA' }, { value: '$2.4B', label: 'Revenue Enabled' }, { value: '45', label: 'Countries' }], { border: true }),
    premiumFoot('Vertex'),
  ], [
    { name: 'Home', slug: '/', elements: [
      premiumNav('Vertex', ['Solutions', 'Platform', 'Pricing', 'Contact'], 'dark'),
      cinematicHero('We Build the\nFuture of Work', 'Enterprise solutions that scale with ambition. From startup to IPO.', 'Request Demo', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop', { badge: 'TRUSTED BY 500+ ENTERPRISES', gradient: 'radial-gradient(ellipse at 30% 80%, rgba(0,50,100,0.2) 0%, transparent 60%)' }),
      withAnim(premiumStats([{ value: '500+', label: 'Enterprise Clients' }, { value: '99.9%', label: 'Uptime SLA' }, { value: '$2.4B', label: 'Revenue Enabled' }, { value: '45', label: 'Countries' }], { border: true }), ANIM_FADE_UP),
      withAnim(premiumFeatures('Platform Capabilities', 'Everything your enterprise needs to operate at scale.', [
        { title: 'Cloud Infrastructure', desc: 'Auto-scaling architecture built for millions of concurrent users.' },
        { title: 'AI-Powered Analytics', desc: 'Real-time insights with machine learning at the core.' },
        { title: 'Zero Trust Security', desc: 'SOC2 Type II, ISO 27001, and GDPR compliant from day one.' },
      ]), ANIM_REVEAL),
      withAnim(premiumTestimonials([
        { quote: 'Vertex transformed our entire digital infrastructure in under 6 months.', name: 'Sarah Chen', role: 'CTO, TechVault Inc' },
        { quote: 'Reduced operational costs by 40% in the first quarter.', name: 'James Walker', role: 'CEO, NovaBridge' },
        { quote: 'Enterprise support that is genuinely world-class.', name: 'Maria Santos', role: 'VP Engineering, Axiom' },
      ]), ANIM_FADE_UP),
      premiumCTA('Ready to Scale?', 'Join 500+ enterprises already transforming their operations.', 'Book a Demo'),
      premiumFoot('Vertex'),
    ]},
    { name: 'About', slug: '/about', elements: [
      premiumNav('Vertex', ['Solutions', 'Platform', 'Pricing', 'Contact'], 'dark'),
      cinematicAbout('Built by Engineers\nfor Engineers', 'Founded in 2018, Vertex powers mission-critical infrastructure for the world\'s most ambitious companies.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop', [
        { title: 'Innovation First', desc: 'We push boundaries to deliver solutions that don\'t just meet expectations — they redefine them.' },
        { title: 'Radical Transparency', desc: 'Open communication, honest pricing, and clear reporting at every level.' },
        { title: 'Customer Obsessed', desc: 'Every decision starts and ends with our customers\' success.' },
      ]),
      withAnim(premiumStats([{ value: '250+', label: 'Engineers' }, { value: '8', label: 'Global Offices' }, { value: '$140M', label: 'Series C Funding' }]), ANIM_FADE_UP),
      premiumFoot('Vertex'),
    ]},
    { name: 'Solutions', slug: '/solutions', elements: [
      premiumNav('Vertex', ['Solutions', 'Platform', 'Pricing', 'Contact'], 'dark'),
      cinematicServices('Enterprise Solutions', [
        { name: 'Cloud Infrastructure', desc: 'Auto-scaling, multi-region architecture with 99.999% uptime. Deploy globally in minutes.', imgUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop' },
        { name: 'AI Analytics Suite', desc: 'Transform raw data into actionable intelligence with our ML-powered dashboards.', imgUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop' },
        { name: 'Security & Compliance', desc: 'Zero-trust architecture with SOC2, ISO 27001, and GDPR built in from day one.', imgUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop' },
      ]),
      premiumCTA('See It in Action', 'Schedule a personalised demo with our solutions team.', 'Book Demo', { bg: '#0a0a0a' }),
      premiumFoot('Vertex'),
    ]},
    { name: 'Pricing', slug: '/pricing', elements: [
      premiumNav('Vertex', ['Solutions', 'Platform', 'Pricing', 'Contact'], 'dark'),
      withAnim(el('section', {}, { desktop: { padding: '160px 60px 80px', textAlign: 'center', backgroundColor: '#000' } }, [
        el('heading', { text: 'Simple, Transparent\nPricing', level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.08', marginBottom: '20px' } }),
        el('text', { text: 'No hidden fees. No surprises. Scale with confidence.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', maxWidth: '460px', margin: '0 auto' } }),
      ], 'Pricing Hero'), ANIM_BLUR_IN),
      withAnim(premiumPricing([
        { name: 'Starter', price: '$299/mo', features: '10 users\n50GB storage\nBasic analytics\nEmail support' },
        { name: 'Business', price: '$999/mo', features: '100 users\n500GB storage\nAdvanced analytics\nPriority support\nSSO integration', popular: true },
        { name: 'Enterprise', price: 'Custom', features: 'Unlimited users\nUnlimited storage\nCustom analytics\n24/7 dedicated support\nSLA guarantee\nDedicated CSM' },
      ]), ANIM_FADE_UP),
      premiumFoot('Vertex'),
    ]},
    { name: 'Contact', slug: '/contact', elements: [
      premiumNav('Vertex', ['Solutions', 'Platform', 'Pricing', 'Contact'], 'dark'),
      contactHeroSection('Let\'s Talk'),
      withAnim(premiumContact(), ANIM_FADE_UP),
      premiumFoot('Vertex'),
    ]},
  ]),

  makeTemplate('corporate', 'Corporate Enterprise', '5-page cinematic corporate with 3D transforms & blur reveals', 'Business', [
    premiumNav('Meridian', ['Solutions', 'Industries', 'Resources', 'Contact'], 'dark'),
    cinematicHero('Driving Digital\nTransformation', 'Trusted by Fortune 500 companies to deliver mission-critical solutions at scale.', 'Schedule Briefing', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop', { badge: 'FORTUNE 500 TRUSTED' }),
    premiumFoot('Meridian Corporation'),
  ], [
    { name: 'Home', slug: '/', elements: [
      premiumNav('Meridian', ['Solutions', 'Industries', 'Resources', 'Contact'], 'dark'),
      cinematicHero('Driving Digital\nTransformation', 'Trusted by Fortune 500 companies to deliver mission-critical solutions at scale.', 'Schedule Briefing', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop', { badge: 'FORTUNE 500 TRUSTED' }),
      withAnim(premiumStats([{ value: '$8.2B', label: 'Revenue Generated' }, { value: '380+', label: 'Enterprise Clients' }, { value: '45', label: 'Markets' }]), ANIM_FADE_UP),
      withAnim(imageTextRow('Cloud-Native\nInfrastructure', 'Scalable, secure cloud solutions tailored for enterprise workloads with 99.999% uptime guarantee.', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop'), ANIM_TILT),
      premiumCTA('Ready for Transformation?', 'Join 380+ enterprises already changing the game.', 'Schedule Briefing'),
      premiumFoot('Meridian Corporation'),
    ]},
    { name: 'Industries', slug: '/industries', elements: [
      premiumNav('Meridian', ['Solutions', 'Industries', 'Resources', 'Contact'], 'dark'),
      cinematicServices('Industries We Serve', [
        { name: 'Financial Services', desc: 'Regulatory-compliant digital transformation for banks, insurers, and asset managers.', imgUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop' },
        { name: 'Healthcare & Life Sciences', desc: 'HIPAA-compliant platforms accelerating drug discovery and patient outcomes.', imgUrl: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=600&fit=crop' },
        { name: 'Manufacturing & Supply Chain', desc: 'IoT-enabled smart factories with predictive maintenance and real-time logistics.', imgUrl: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&h=600&fit=crop' },
      ]),
      premiumFoot('Meridian Corporation'),
    ]},
    { name: 'Case Studies', slug: '/case-studies', elements: [
      premiumNav('Meridian', ['Solutions', 'Industries', 'Resources', 'Contact'], 'dark'),
      cinematicPortfolio('Featured Case Studies', [
        { name: 'Global Bank Digital Overhaul', category: 'Financial Services', imgUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=500&fit=crop' },
        { name: 'Healthcare Data Platform', category: 'Life Sciences', imgUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=500&fit=crop' },
        { name: 'Supply Chain AI', category: 'Manufacturing', imgUrl: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&h=500&fit=crop' },
        { name: 'Retail Transformation', category: 'E-commerce', imgUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=500&fit=crop' },
      ]),
      premiumFoot('Meridian Corporation'),
    ]},
    { name: 'About', slug: '/about', elements: [
      premiumNav('Meridian', ['Solutions', 'Industries', 'Resources', 'Contact'], 'dark'),
      cinematicAbout('Transforming Industries\nSince 2008', 'We partner with the world\'s most ambitious enterprises to solve complex digital challenges at unprecedented scale.', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=900&fit=crop', [
        { title: 'Global Reach', desc: 'Operating across 45 markets with deep local expertise.' },
        { title: 'Innovation Lab', desc: 'Dedicated R&D exploring AI, quantum computing, and edge technologies.' },
        { title: 'Sustainability', desc: 'Carbon-neutral operations with net-zero commitment by 2030.' },
      ]),
      premiumFoot('Meridian Corporation'),
    ]},
    { name: 'Contact', slug: '/contact', elements: [
      premiumNav('Meridian', ['Solutions', 'Industries', 'Resources', 'Contact'], 'dark'),
      contactHeroSection('Connect With Us'),
      withAnim(premiumContact(), ANIM_FADE_UP),
      premiumFoot('Meridian Corporation'),
    ]},
  ]),

  makeTemplate('consulting', 'Consulting Firm', '5-page cinematic consultancy with parallax & staggered reveals', 'Business', [
    premiumNav('Stratton & Co', ['Expertise', 'Case Studies', 'Team', 'Contact'], 'dark'),
    cinematicHero('Strategy That\nDelivers Results', 'Management consulting for the world\'s most ambitious organisations since 1987.', 'Schedule Consultation', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop', { badge: 'EST. 1987' }),
    premiumFoot('Stratton & Co'),
  ], [
    { name: 'Home', slug: '/', elements: [
      premiumNav('Stratton & Co', ['Expertise', 'Case Studies', 'Team', 'Contact'], 'dark'),
      cinematicHero('Strategy That\nDelivers Results', 'Management consulting for the world\'s most ambitious organisations since 1987.', 'Schedule Consultation', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop', { badge: 'EST. 1987' }),
      withAnim(premiumStats([{ value: '40%', label: 'Avg Revenue Growth' }, { value: '200+', label: 'Engagements' }, { value: '$12B', label: 'Value Created' }]), ANIM_FADE_UP),
      withAnim(premiumFeatures('Areas of Expertise', 'Deep domain knowledge across critical business functions.', [
        { title: 'Strategic Advisory', desc: 'Board-level guidance for transformative growth initiatives and market entry.' },
        { title: 'Operational Excellence', desc: 'Streamlining processes to maximise efficiency, margins, and throughput.' },
        { title: 'M&A Advisory', desc: 'End-to-end support for mergers, acquisitions, and corporate restructuring.' },
      ]), ANIM_REVEAL),
      premiumCTA('Start a Conversation', 'Let us understand your challenges. Book a confidential briefing.', 'Book Consultation'),
      premiumFoot('Stratton & Co'),
    ]},
    { name: 'Expertise', slug: '/expertise', elements: [
      premiumNav('Stratton & Co', ['Expertise', 'Case Studies', 'Team', 'Contact'], 'dark'),
      cinematicServices('Our Expertise', [
        { name: 'Strategy & Growth', desc: 'Market analysis, competitive positioning, and growth roadmaps for ambitious boards.', imgUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop' },
        { name: 'Operations & Performance', desc: 'Lean operations, supply chain optimisation, and margin improvement programmes.', imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop' },
        { name: 'Mergers & Acquisitions', desc: 'Due diligence, integration planning, and post-merger value creation.', imgUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop' },
      ]),
      premiumFoot('Stratton & Co'),
    ]},
    { name: 'Case Studies', slug: '/case-studies', elements: [
      premiumNav('Stratton & Co', ['Expertise', 'Case Studies', 'Team', 'Contact'], 'dark'),
      cinematicPortfolio('Select Case Studies', [
        { name: '£2.4B Acquisition Advisory', category: 'M&A', imgUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop' },
        { name: 'Digital Transformation Programme', category: 'Strategy', imgUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=500&fit=crop' },
        { name: 'Operational Turnaround', category: 'Operations', imgUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=500&fit=crop' },
        { name: 'IPO Preparation & Execution', category: 'Strategy', imgUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop' },
      ]),
      premiumFoot('Stratton & Co'),
    ]},
    { name: 'Team', slug: '/team', elements: [
      premiumNav('Stratton & Co', ['Expertise', 'Case Studies', 'Team', 'Contact'], 'dark'),
      cinematicAbout('Our Leadership\nTeam', 'Partners with an average of 25 years\' experience across strategy, finance, and operations.', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=900&fit=crop', [
        { title: 'Global Perspective', desc: 'Partners educated at Oxford, Harvard, INSEAD, and Stanford.' },
        { title: 'Industry Depth', desc: 'Sector-specialist teams in technology, healthcare, financial services, and energy.' },
        { title: 'Proven Track Record', desc: '$12B in value created across 200+ engagements.' },
      ]),
      premiumFoot('Stratton & Co'),
    ]},
    { name: 'Contact', slug: '/contact', elements: [
      premiumNav('Stratton & Co', ['Expertise', 'Case Studies', 'Team', 'Contact'], 'dark'),
      contactHeroSection('Begin a\nConversation'),
      withAnim(premiumContact(), ANIM_FADE_UP),
      premiumFoot('Stratton & Co'),
    ]},
  ]),

  makeTemplate('startup', 'Startup Launch', 'Bold product launch page with waitlist', 'Business', [
    premiumNav('Launchpad', ['Features', 'Pricing', 'Blog'], 'dark'),
    el('section', {}, { desktop: { padding: '160px 60px 120px', textAlign: 'center', background: 'linear-gradient(180deg, #000 0%, #0a0a1a 100%)' }, mobile: { padding: '100px 24px 80px' } }, [
      el('badge', { text: 'NOW IN BETA' }, { desktop: { padding: '6px 16px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '2px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '28px', letterSpacing: '0.12em' } }),
      el('heading', { text: 'Ship 10x Faster\nThan Ever Before', level: 'h1' }, { desktop: { fontSize: '64px', fontWeight: '700', color: '#fff', letterSpacing: '-0.04em', lineHeight: '1.05', marginBottom: '24px' }, mobile: { fontSize: '38px' } }),
      el('text', { text: 'The all-in-one platform for modern startups. From idea to scale in weeks, not months.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.45)', marginBottom: '40px', maxWidth: '520px', margin: '0 auto 40px', lineHeight: '1.6' } }),
      el('button', { text: 'Join the Waitlist', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em' } }),
    ], 'Hero'),
    premiumFoot('Launchpad'),
  ], autoPages({
    brand: 'Launchpad', links: ['Features', 'Pricing', 'About', 'Contact'],
    homeElements: [
      el('section', {}, { desktop: { padding: '160px 60px 120px', textAlign: 'center', background: 'linear-gradient(180deg, #000 0%, #0a0a1a 100%)' }, mobile: { padding: '100px 24px 80px' } }, [
        el('badge', { text: 'NOW IN BETA' }, { desktop: { padding: '6px 16px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '2px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '28px', letterSpacing: '0.12em' } }),
        el('heading', { text: 'Ship 10x Faster\nThan Ever Before', level: 'h1' }, { desktop: { fontSize: '64px', fontWeight: '700', color: '#fff', letterSpacing: '-0.04em', lineHeight: '1.05', marginBottom: '24px' }, mobile: { fontSize: '38px' } }),
        el('text', { text: 'The all-in-one platform for modern startups.', level: 'h1' } as any, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.45)', marginBottom: '40px', maxWidth: '520px', margin: '0 auto 40px' } }),
        el('button', { text: 'Join the Waitlist', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em' } }),
      ], 'Hero'),
      withAnim(premiumFeatures('Built for Speed', 'Everything you need, nothing you don\'t.', [
        { title: 'Deploy Instantly', desc: 'Push to production in seconds with zero-config CI/CD.' },
        { title: 'Team Collaboration', desc: 'Real-time editing with inline comments and version control.' },
        { title: 'Analytics Dashboard', desc: 'Track every metric that matters from day one.' },
      ]), ANIM_FADE_UP),
    ],
    aboutHeading: 'Built by Founders\nfor Founders', aboutDesc: 'We know the pain of building products. That\'s why we made Launchpad.',
    aboutImg: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Speed', desc: 'Move fast, ship faster.' }, { title: 'Simplicity', desc: 'Complex problems, simple solutions.' }, { title: 'Community', desc: 'Built with and for our users.' }],
    servicesTitle: 'Platform Features',
    services: [
      { name: 'CI/CD Pipeline', desc: 'Zero-config deployments with automatic rollbacks and preview environments.', imgUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop' },
      { name: 'Team Workspace', desc: 'Real-time collaboration with permissions, comments, and version history.', imgUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop' },
      { name: 'Analytics & Monitoring', desc: 'Full-stack observability with custom dashboards and alerting.', imgUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Pricing', slug: '/pricing', elements: [
      withAnim(premiumPricing([
        { name: 'Indie', price: '$0/mo', features: '1 project\n5GB storage\nCommunity support' },
        { name: 'Startup', price: '$49/mo', features: '10 projects\n100GB storage\nPriority support\nCustom domains', popular: true },
        { name: 'Scale', price: '$199/mo', features: 'Unlimited projects\n1TB storage\n24/7 support\nSSO & SAML' },
      ]), ANIM_FADE_UP),
    ]},
  })),

  makeTemplate('saas', 'SaaS Product', 'Modern dark SaaS product page', 'Business', [
    premiumNav('Flowline', ['Features', 'Pricing', 'Docs', 'Blog'], 'dark'),
    splitHero('Workflow\nAutomation\nRedefined', 'Connect your tools. Automate your processes. Scale without limits.', 'Start Free Trial', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=900&fit=crop'),
    premiumFoot('Flowline'),
  ], autoPages({
    brand: 'Flowline', links: ['Features', 'Pricing', 'About', 'Contact'],
    homeElements: [
      splitHero('Workflow\nAutomation\nRedefined', 'Connect your tools. Automate your processes. Scale without limits.', 'Start Free Trial', 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=900&fit=crop'),
      withAnim(premiumStats([{ value: '50K+', label: 'Teams' }, { value: '10M+', label: 'Automations' }, { value: '99.99%', label: 'Uptime' }], { border: true }), ANIM_FADE_UP),
      withAnim(premiumFeatures('Everything You Need', 'A complete automation platform.', [
        { title: 'Visual Builder', desc: 'Drag-and-drop to create complex automations without code.' },
        { title: 'Real-time Sync', desc: 'Instant data sync across 200+ connected applications.' },
        { title: 'Enterprise API', desc: 'RESTful APIs with SDKs in 8 languages.' },
      ]), ANIM_REVEAL),
    ],
    aboutHeading: 'Automation for\nEveryone', aboutDesc: 'We believe every team deserves powerful automation without the complexity.',
    aboutImg: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'No-Code First', desc: 'Anyone can build powerful automations.' }, { title: 'Reliability', desc: '99.99% uptime guaranteed.' }, { title: 'Open Ecosystem', desc: '200+ integrations and growing.' }],
    servicesTitle: 'Platform Features',
    services: [
      { name: 'Workflow Builder', desc: 'Visual drag-and-drop interface for building complex automations.', imgUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop' },
      { name: 'Integrations Hub', desc: '200+ pre-built connectors for your favourite tools and services.', imgUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop' },
      { name: 'Analytics Dashboard', desc: 'Track automation performance with real-time metrics and insights.', imgUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Pricing', slug: '/pricing', elements: [
      withAnim(premiumPricing([
        { name: 'Starter', price: '$9/mo', features: '1,000 API calls\n5 team members\nEmail support' },
        { name: 'Pro', price: '$49/mo', features: '50,000 API calls\n25 members\nPriority support', popular: true },
        { name: 'Enterprise', price: 'Custom', features: 'Unlimited calls\nUnlimited team\n24/7 support\nSLA guarantee' },
      ]), ANIM_FADE_UP),
    ]},
  })),

  makeTemplate('fintech', 'FinTech Platform', 'Trust-focused dark financial platform', 'Business', [
    premiumNav('VaultPay', ['Products', 'Security', 'Developers', 'Company'], 'dark'),
    fullBleedHero('Payments\nInfrastructure\nfor the Internet', 'Millions of businesses use VaultPay to accept payments globally.', 'Get API Keys', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,10,0.8)' }),
    premiumFoot('VaultPay'),
  ], autoPages({
    brand: 'VaultPay', links: ['Products', 'Security', 'Developers', 'Contact'],
    homeElements: [
      fullBleedHero('Payments\nInfrastructure\nfor the Internet', 'Millions of businesses use VaultPay to accept payments globally.', 'Get API Keys', 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,10,0.8)' }),
      withAnim(premiumStats([{ value: '$640B+', label: 'Processed' }, { value: '99.999%', label: 'Uptime' }, { value: '195+', label: 'Countries' }, { value: '135+', label: 'Currencies' }], { border: true }), ANIM_FADE_UP),
      withAnim(premiumFeatures('Global Payment Solutions', 'One integration. Every payment method.', [
        { title: 'Online Payments', desc: 'Accept cards, wallets, and bank transfers in 135+ currencies.' },
        { title: 'Fraud Prevention', desc: 'ML-powered fraud detection with 99.5% accuracy.' },
        { title: 'Instant Payouts', desc: 'Send funds to any bank account globally in real-time.' },
      ]), ANIM_REVEAL),
    ],
    aboutHeading: 'Building the\nFinancial Internet', aboutDesc: 'We\'re making money movement as easy as sending an email.',
    aboutImg: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Security First', desc: 'PCI DSS Level 1 certified with zero breaches.' }, { title: 'Global Scale', desc: 'Processing $640B+ annually across 195 countries.' }, { title: 'Developer Love', desc: 'APIs designed by developers, for developers.' }],
    servicesTitle: 'Our Products',
    services: [
      { name: 'Payment Processing', desc: 'Accept every payment method with a single API integration.', imgUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop' },
      { name: 'Fraud Shield', desc: 'AI-powered fraud detection that blocks threats in real-time.', imgUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop' },
      { name: 'Global Payouts', desc: 'Send money to bank accounts in 195+ countries instantly.', imgUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Developers', slug: '/developers', elements: [
      withAnim(premiumFeatures('Developer Tools', 'Everything you need to integrate payments.', [
        { title: 'REST API', desc: 'Clean, well-documented APIs with comprehensive SDKs.' },
        { title: 'Webhooks', desc: 'Real-time event notifications for every transaction state.' },
        { title: 'Sandbox', desc: 'Full testing environment with simulated transactions.' },
      ]), ANIM_FADE_UP),
    ]},
  })),

  // ─── REAL ESTATE (3) ─────────────────────────────────────────────
  makeTemplate('real-estate', 'Real Estate Agency', 'Luxury property listings with full-bleed imagery', 'Real Estate', [
    premiumNav('Prestige', ['Listings', 'Sell', 'About', 'Contact'], 'dark'),
    fullBleedHero('Find Your\nDream Home', 'Luxury properties in the world\'s most desirable locations.', 'Browse Listings', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.4)' }),
    premiumFoot('Prestige Properties'),
  ], autoPages({
    brand: 'Prestige', links: ['Listings', 'Sell', 'About', 'Contact'],
    homeElements: [
      fullBleedHero('Find Your\nDream Home', 'Luxury properties in the world\'s most desirable locations.', 'Browse Listings', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.4)' }),
      withAnim(premiumStats([{ value: '2,400+', label: 'Properties Sold' }, { value: '$1.8B', label: 'Total Sales' }, { value: '15+', label: 'Years' }, { value: '98%', label: 'Satisfaction' }]), ANIM_FADE_UP),
      withAnim(premiumTestimonials([
        { quote: 'Prestige found us our dream home in under 3 weeks. Exceptional service.', name: 'The Hendersons', role: 'Homeowners' },
        { quote: 'Professional, knowledgeable, and genuinely passionate about what they do.', name: 'David & Sarah K.', role: 'First-time Buyers' },
      ]), ANIM_FADE_UP),
    ],
    aboutHeading: 'Luxury Real Estate\nSince 2009', aboutDesc: 'We specialise in premium residential and commercial properties in the world\'s most sought-after locations.',
    aboutImg: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Local Expertise', desc: 'Deep knowledge of every neighbourhood we serve.' }, { title: 'White Glove Service', desc: 'Dedicated agents guiding you through every step.' }, { title: 'Results Driven', desc: '98% satisfaction rate across 2,400+ transactions.' }],
    servicesTitle: 'Our Services',
    services: [
      { name: 'Property Sales', desc: 'Marketing and selling premium properties with unmatched expertise.', imgUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop' },
      { name: 'Property Management', desc: 'Full-service management for landlords and investment portfolios.', imgUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop' },
      { name: 'Investment Advisory', desc: 'Data-driven investment strategies for residential and commercial assets.', imgUrl: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Listings', slug: '/listings', elements: [
      imageGallery('Featured Properties', [
        { src: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop', alt: 'Modern Villa' },
        { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', alt: 'Penthouse' },
        { src: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop', alt: 'Estate' },
        { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', alt: 'Contemporary Home' },
        { src: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&h=400&fit=crop', alt: 'City Apartment' },
        { src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&h=400&fit=crop', alt: 'Waterfront' },
      ]),
    ]},
  })),

  makeTemplate('real-estate-commercial', 'Commercial Real Estate', 'Enterprise dark commercial property', 'Real Estate', [
    premiumNav('Atlas CRE', ['Portfolio', 'Services', 'Markets', 'Contact'], 'dark'),
    splitHero('Commercial\nReal Estate\nRedefined', 'Institutional-grade investment, development, and management across global markets.', 'View Portfolio', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=900&fit=crop'),
    premiumFoot('Atlas CRE'),
  ], autoPages({
    brand: 'Atlas CRE', links: ['Portfolio', 'Services', 'Markets', 'Contact'],
    homeElements: [
      splitHero('Commercial\nReal Estate\nRedefined', 'Institutional-grade investment across global markets.', 'View Portfolio', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=900&fit=crop'),
      withAnim(premiumStats([{ value: '$4.2B', label: 'AUM' }, { value: '120+', label: 'Properties' }, { value: '8', label: 'Markets' }], { border: true }), ANIM_FADE_UP),
      withAnim(premiumFeatures('Asset Classes', 'Diversified portfolio across premium sectors.', [
        { title: 'Office', desc: 'Grade-A CBD office towers with blue-chip tenant profiles.' },
        { title: 'Industrial & Logistics', desc: 'Strategic distribution centres and manufacturing facilities.' },
        { title: 'Retail & Mixed-Use', desc: 'High-street retail and integrated mixed-use developments.' },
      ]), ANIM_REVEAL),
    ],
    aboutHeading: 'Institutional Excellence\nSince 1998', aboutDesc: 'Atlas CRE manages $4.2B in commercial real estate across 8 global markets.',
    aboutImg: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Fiduciary Duty', desc: 'Investor interests at the centre of every decision.' }, { title: 'Market Intelligence', desc: 'Proprietary data analytics driving informed investment.' }, { title: 'Sustainability', desc: 'LEED-certified properties across our portfolio.' }],
    servicesTitle: 'Our Services',
    services: [
      { name: 'Investment Management', desc: 'Institutional-grade investment strategies with strong risk-adjusted returns.', imgUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop' },
      { name: 'Development', desc: 'Ground-up development of landmark commercial properties.', imgUrl: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&h=600&fit=crop' },
      { name: 'Asset Management', desc: 'Maximising value through strategic repositioning and active management.', imgUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Portfolio', slug: '/portfolio', elements: [
      cinematicPortfolio('Featured Properties', [
        { name: 'One Meridian Tower', category: 'Office', imgUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop' },
        { name: 'Pacific Logistics Hub', category: 'Industrial', imgUrl: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?w=800&h=500&fit=crop' },
        { name: 'The Exchange', category: 'Mixed-Use', imgUrl: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&h=500&fit=crop' },
        { name: 'Gateway Retail Centre', category: 'Retail', imgUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=500&fit=crop' },
      ]),
    ]},
  })),

  makeTemplate('real-estate-agent', 'Real Estate Agent', 'Personal agent brand', 'Real Estate', [
    premiumNav('James Taylor', ['Listings', 'About', 'Testimonials', 'Contact'], 'dark'),
    splitHero('Your Trusted\nProperty Advisor', 'Award-winning real estate agent specialising in luxury residential properties.', 'Schedule Viewing', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=900&fit=crop'),
    premiumFoot('James Taylor Estates'),
  ], autoPages({
    brand: 'James Taylor', links: ['Listings', 'About', 'Testimonials', 'Contact'],
    homeElements: [
      splitHero('Your Trusted\nProperty Advisor', 'Award-winning real estate agent specialising in luxury residential properties.', 'Schedule Viewing', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&h=900&fit=crop'),
      withAnim(premiumStats([{ value: '300+', label: 'Properties Sold' }, { value: '$450M', label: 'Sales Volume' }, { value: '#1', label: 'Agent 2025' }]), ANIM_FADE_UP),
      withAnim(premiumTestimonials([
        { quote: 'James made selling our home an absolute breeze. Highly recommended.', name: 'The Parkers', role: 'Vendors' },
        { quote: 'Found us the perfect family home in a competitive market.', name: 'Sarah & Tom', role: 'Buyers' },
      ]), ANIM_FADE_UP),
    ],
    aboutHeading: 'Personal.\nProfessional.\nPassionate.', aboutDesc: 'With 15 years in luxury real estate, I bring unmatched local knowledge and dedication.',
    aboutImg: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Market Knowledge', desc: 'Deep understanding of every neighbourhood and micro-market.' }, { title: 'Negotiation', desc: 'Track record of securing above-asking-price offers.' }, { title: 'Client Care', desc: 'Available 7 days a week for my clients.' }],
    servicesTitle: 'How I Help',
    services: [
      { name: 'Selling Your Home', desc: 'Strategic marketing, professional staging, and expert negotiation.', imgUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop' },
      { name: 'Finding Your Home', desc: 'Access to exclusive off-market listings and priority viewings.', imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop' },
      { name: 'Property Valuation', desc: 'Accurate, data-driven valuations backed by deep market experience.', imgUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Testimonials', slug: '/testimonials', elements: [
      withAnim(premiumTestimonials([
        { quote: 'James made selling our home an absolute breeze.', name: 'The Parkers', role: 'Vendors' },
        { quote: 'Found us the perfect family home in a competitive market.', name: 'Sarah & Tom', role: 'Buyers' },
        { quote: 'Professional, responsive, and genuinely cares about his clients.', name: 'Mark D.', role: 'Investor' },
      ]), ANIM_FADE_UP),
    ]},
  })),

  // ─── FITNESS (3) ─────────────────────────────────────────────────
  makeTemplate('gym', 'Gym & Fitness', 'High-energy dark gym landing', 'Fitness', [
    premiumNav('Ironclad', ['Classes', 'Trainers', 'Membership', 'Contact'], 'dark'),
    fullBleedHero('Forge Your\nStrongest Self', 'Premium training facility with world-class coaches and cutting-edge equipment.', 'Start Free Trial', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.5)' }),
    premiumFoot('Ironclad Fitness'),
  ], autoPages({
    brand: 'Ironclad', links: ['Classes', 'Trainers', 'Membership', 'Contact'],
    homeElements: [
      fullBleedHero('Forge Your\nStrongest Self', 'Premium training facility with world-class coaches.', 'Start Free Trial', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.5)' }),
      withAnim(premiumStats([{ value: '5,000+', label: 'Members' }, { value: '50+', label: 'Classes Weekly' }, { value: '20+', label: 'Expert Trainers' }], { border: true }), ANIM_FADE_UP),
      withAnim(premiumFeatures('What We Offer', 'Everything for your fitness journey.', [
        { title: 'Strength Training', desc: 'Olympic platforms, competition-grade equipment, and free weights.' },
        { title: 'HIIT & Cardio', desc: 'High-intensity classes that torch calories and build endurance.' },
        { title: 'Recovery Zone', desc: 'Saunas, cold plunges, and recovery tools for optimal performance.' },
      ]), ANIM_REVEAL),
    ],
    aboutHeading: 'More Than\na Gym', aboutDesc: 'Founded in 2015, Ironclad is a community of athletes pushing limits.',
    aboutImg: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Community', desc: 'A supportive environment where everyone belongs.' }, { title: 'Excellence', desc: 'World-class facilities and coaching standards.' }, { title: 'Results', desc: 'Science-backed training that delivers.' }],
    servicesTitle: 'Our Classes',
    services: [
      { name: 'Strength & Power', desc: 'Barbell training, powerlifting, and functional strength programming.', imgUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop' },
      { name: 'HIIT Sessions', desc: 'High-intensity interval training for maximum calorie burn.', imgUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop' },
      { name: 'Yoga & Mobility', desc: 'Flexibility, recovery, and mindfulness for balanced fitness.', imgUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Membership', slug: '/membership', elements: [
      withAnim(premiumPricing([
        { name: 'Basic', price: '£39/mo', features: 'Gym access\nOpen gym hours\nLocker room' },
        { name: 'Premium', price: '£69/mo', features: 'All classes\nGym access\nRecovery zone\nGuest passes', popular: true },
        { name: 'Elite', price: '£99/mo', features: 'Everything\nPersonal training\n24/7 access\nNutrition coaching' },
      ]), ANIM_FADE_UP),
    ]},
  })),

  makeTemplate('yoga', 'Yoga Studio', 'Serene dark yoga and mindfulness', 'Fitness', [
    premiumNav('Lotus Flow', ['Classes', 'Teachers', 'Schedule', 'Join'], 'dark'),
    fullBleedHero('Find Your\nInner Peace', 'A sanctuary for body, mind, and soul in the heart of the city.', 'Book a Class', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.45)' }),
    premiumFoot('Lotus Flow'),
  ], autoPages({
    brand: 'Lotus Flow', links: ['Classes', 'Teachers', 'Schedule', 'Contact'],
    homeElements: [
      fullBleedHero('Find Your\nInner Peace', 'A sanctuary for body, mind, and soul.', 'Book a Class', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.45)' }),
      withAnim(premiumFeatures('Our Practice', 'Yoga for every body and every level.', [
        { title: 'Vinyasa Flow', desc: 'Dynamic, breath-linked movement for strength and flexibility.' },
        { title: 'Yin Yoga', desc: 'Deep, meditative stretching for fascia release and relaxation.' },
        { title: 'Meditation', desc: 'Guided mindfulness sessions for clarity and inner calm.' },
      ]), ANIM_FADE_UP),
    ],
    aboutHeading: 'A Space for\nStillness', aboutDesc: 'Lotus Flow was created to bring authentic yoga to modern life.',
    aboutImg: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Authenticity', desc: 'Traditional yoga lineage with modern accessibility.' }, { title: 'Inclusivity', desc: 'A welcoming space for every body, every level.' }, { title: 'Mindfulness', desc: 'Beyond the mat — yoga as a way of life.' }],
    servicesTitle: 'Our Classes',
    services: [
      { name: 'Vinyasa Flow', desc: 'Dynamic sequences linking breath to movement.', imgUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop' },
      { name: 'Restorative Yoga', desc: 'Gentle, supported poses for deep rest and healing.', imgUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop' },
      { name: 'Teacher Training', desc: '200-hour YTT certification with experienced mentors.', imgUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Schedule', slug: '/schedule', elements: [
      withAnim(premiumFeatures('Weekly Schedule', 'Classes every day, morning to evening.', [
        { title: 'Morning Flow', desc: '6:30 AM — Energising vinyasa to start your day with intention.' },
        { title: 'Lunch Yin', desc: '12:30 PM — Midday reset with deep, meditative stretching.' },
        { title: 'Evening Restore', desc: '7:00 PM — Wind down with restorative yoga and guided relaxation.' },
        { title: 'Weekend Workshop', desc: '10:00 AM Saturday — Deep-dive themed workshops.' },
      ], { cols: 2 }), ANIM_FADE_UP),
    ]},
  })),

  makeTemplate('personal-trainer', 'Personal Trainer', 'Individual dark fitness coaching brand', 'Fitness', [
    premiumNav('Coach Mike', ['Programs', 'Results', 'About', 'Book'], 'dark'),
    splitHero('Transform\nYour Body.\nTransform\nYour Life.', 'Certified personal trainer specialising in body recomposition and athletic performance.', 'Book Free Consult', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=900&fit=crop'),
    premiumFoot('Coach Mike Fitness'),
  ], autoPages({
    brand: 'Coach Mike', links: ['Programs', 'Results', 'About', 'Contact'],
    homeElements: [
      splitHero('Transform\nYour Body.\nTransform\nYour Life.', 'Certified personal trainer specialising in body recomposition.', 'Book Free Consult', 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=900&fit=crop'),
      withAnim(premiumStats([{ value: '500+', label: 'Clients Trained' }, { value: '12+', label: 'Years Experience' }, { value: '100%', label: 'Commitment' }]), ANIM_FADE_UP),
      withAnim(premiumTestimonials([
        { quote: 'Lost 30lbs in 4 months. Mike changed my life.', name: 'Jessica T.', role: 'Client' },
        { quote: 'Best investment I\'ve ever made in myself.', name: 'David R.', role: 'Client' },
      ]), ANIM_FADE_UP),
    ],
    aboutHeading: 'Your Goals.\nMy Mission.', aboutDesc: '12 years of experience transforming lives through evidence-based fitness coaching.',
    aboutImg: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Science-Based', desc: 'Evidence-backed programming for real results.' }, { title: 'Accountability', desc: 'Weekly check-ins and progress tracking.' }, { title: 'Lifestyle', desc: 'Sustainable fitness habits, not quick fixes.' }],
    servicesTitle: 'My Programs',
    services: [
      { name: '1-on-1 Coaching', desc: 'Personalised training sessions tailored to your goals.', imgUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop' },
      { name: 'Online Coaching', desc: 'Custom programs with video guidance and weekly check-ins.', imgUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop' },
      { name: 'Nutrition Planning', desc: 'Macro-based meal plans designed for your lifestyle.', imgUrl: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Results', slug: '/results', elements: [
      withAnim(premiumTestimonials([
        { quote: 'Lost 30lbs in 4 months. Mike changed my life completely.', name: 'Jessica T.', role: 'Body Recomp Client' },
        { quote: 'Best investment I\'ve ever made in myself. Incredible coaching.', name: 'David R.', role: 'Strength Client' },
        { quote: 'Went from couch to half marathon in 6 months.', name: 'Emma L.', role: 'Endurance Client' },
      ]), ANIM_FADE_UP),
      withAnim(premiumStats([{ value: '500+', label: 'Clients Trained' }, { value: '30lbs', label: 'Avg Fat Loss' }, { value: '4.9★', label: 'Google Rating' }]), ANIM_FADE_UP),
    ]},
  })),

  // ─── LEGAL (3) ───────────────────────────────────────────────────
  makeTemplate('law-firm', 'Law Firm', 'Authoritative dark full-service law firm', 'Legal', [
    premiumNav('Blackwell & Hart', ['Practice Areas', 'Team', 'Clients', 'Contact'], 'dark'),
    splitHero('Justice.\nIntegrity.\nExcellence.', 'Full-service commercial law firm with a century-long legacy of legal distinction.', 'Book Consultation', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=900&fit=crop'),
    premiumFoot('Blackwell & Hart LLP'),
  ], autoPages({
    brand: 'Blackwell & Hart', links: ['Practice Areas', 'Team', 'Clients', 'Contact'],
    homeElements: [
      splitHero('Justice.\nIntegrity.\nExcellence.', 'Full-service commercial law firm with a century-long legacy.', 'Book Consultation', 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=900&fit=crop'),
      withAnim(premiumStats([{ value: '100+', label: 'Years' }, { value: '200+', label: 'Lawyers' }, { value: '95%', label: 'Success Rate' }], { border: true }), ANIM_FADE_UP),
      withAnim(premiumFeatures('Practice Areas', 'Comprehensive legal expertise.', [
        { title: 'Corporate & M&A', desc: 'Advising on the most complex cross-border transactions and restructurings.' },
        { title: 'Litigation', desc: 'Fierce, strategic advocacy in high-stakes commercial disputes.' },
        { title: 'Real Estate', desc: 'Full-spectrum property law for institutional and private clients.' },
      ]), ANIM_REVEAL),
    ],
    aboutHeading: 'A Century of\nLegal Excellence', aboutDesc: 'Founded in 1920, Blackwell & Hart has been at the forefront of commercial law.',
    aboutImg: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Integrity', desc: 'Unwavering ethical standards in all we do.' }, { title: 'Excellence', desc: 'Consistently ranked in top-tier legal directories.' }, { title: 'Client Focus', desc: 'Understanding your business as well as the law.' }],
    servicesTitle: 'Practice Areas',
    services: [
      { name: 'Corporate & M&A', desc: 'Cross-border transactions, IPOs, and corporate restructuring.', imgUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop' },
      { name: 'Dispute Resolution', desc: 'High-stakes litigation, arbitration, and mediation.', imgUrl: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&h=600&fit=crop' },
      { name: 'Real Estate', desc: 'Commercial and residential property transactions and planning.', imgUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Our Team', slug: '/team', elements: [
      cinematicAbout('Our Partners', '200+ lawyers across 5 offices delivering exceptional legal counsel.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=900&fit=crop', [
        { title: 'Sir Robert Blackwell QC', desc: 'Senior Partner. 40 years in corporate law. Queen\'s Counsel.' },
        { title: 'Elizabeth Hart', desc: 'Managing Partner. Litigation specialist. Ranked Band 1 Chambers.' },
        { title: 'James Chen', desc: 'Head of M&A. Former Goldman Sachs. $50B+ in completed transactions.' },
      ]),
    ]},
  })),

  makeTemplate('corporate-law', 'Corporate Law', 'Sleek dark corporate legal advisory', 'Legal', [
    premiumNav('Lexington', ['Services', 'Sectors', 'Team', 'Contact'], 'dark'),
    splitHero('Commercial Law\nfor Ambitious\nBusinesses', 'Strategic legal counsel for startups, scale-ups, and established enterprises.', 'Arrange a Call', 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1200&h=900&fit=crop'),
    premiumFoot('Lexington Legal'),
  ], autoPages({
    brand: 'Lexington', links: ['Services', 'Sectors', 'Team', 'Contact'],
    homeElements: [
      splitHero('Commercial Law\nfor Ambitious\nBusinesses', 'Strategic legal counsel for startups, scale-ups, and enterprises.', 'Arrange a Call', 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1200&h=900&fit=crop'),
      withAnim(premiumFeatures('Our Services', 'Full-spectrum commercial legal support.', [
        { title: 'Company Formation', desc: 'Structuring, incorporation, and shareholders\' agreements.' },
        { title: 'Contracts', desc: 'Drafting and negotiating commercial agreements that protect your interests.' },
        { title: 'Employment Law', desc: 'HR compliance, tribunal defence, and senior exit negotiations.' },
        { title: 'IP Protection', desc: 'Patents, trademarks, trade secrets, and licensing agreements.' },
      ], { cols: 2 }), ANIM_REVEAL),
    ],
    aboutHeading: 'Modern Law\nfor Modern Business', aboutDesc: 'We combine legal rigour with commercial pragmatism to drive business success.',
    aboutImg: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Pragmatic', desc: 'Business-first advice, not legal jargon.' }, { title: 'Responsive', desc: 'Same-day responses on all urgent matters.' }, { title: 'Transparent', desc: 'Fixed fees wherever possible — no surprises.' }],
    servicesTitle: 'Our Expertise',
    services: [
      { name: 'Company & Commercial', desc: 'Structuring, formation, and ongoing corporate governance.', imgUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop' },
      { name: 'Employment Law', desc: 'HR compliance, contracts, and tribunal representation.', imgUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=600&fit=crop' },
      { name: 'Intellectual Property', desc: 'Protecting your most valuable intangible assets.', imgUrl: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Sectors', slug: '/sectors', elements: [
      withAnim(premiumFeatures('Sectors We Serve', 'Industry-specific legal expertise.', [
        { title: 'Technology', desc: 'SaaS agreements, data protection, and IP strategy.' },
        { title: 'Financial Services', desc: 'FCA compliance, fintech licensing, and fund structuring.' },
        { title: 'Healthcare', desc: 'CQC compliance, clinical negligence, and partnerships.' },
      ]), ANIM_FADE_UP),
    ]},
  })),

  makeTemplate('family-law', 'Family Law', 'Compassionate yet professional family practice', 'Legal', [
    premiumNav('Grace Law', ['Services', 'Process', 'Team', 'Contact'], 'dark'),
    splitHero('Navigating Life\'s\nMost Difficult\nMoments', 'Compassionate, expert family law advice when you need it most.', 'Book Consultation', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=900&fit=crop'),
    premiumFoot('Grace Family Law'),
  ], autoPages({
    brand: 'Grace Law', links: ['Services', 'Process', 'Team', 'Contact'],
    homeElements: [
      splitHero('Navigating Life\'s\nMost Difficult\nMoments', 'Compassionate, expert family law advice when you need it most.', 'Book Consultation', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=900&fit=crop'),
      withAnim(premiumFeatures('How We Help', 'Tailored support through every stage of family matters.', [
        { title: 'Divorce & Separation', desc: 'Guiding you through the process with dignity and care.' },
        { title: 'Child Custody', desc: 'Putting children\'s wellbeing at the centre of every decision.' },
        { title: 'Financial Settlements', desc: 'Fair division of assets, pensions, and maintenance.' },
        { title: 'Mediation', desc: 'Resolving disputes without the stress of court.' },
      ], { cols: 2 }), ANIM_REVEAL),
      withAnim(premiumTestimonials([
        { quote: 'They handled my divorce with incredible sensitivity.', name: 'Claire Thornton', role: 'Client' },
        { quote: 'I felt supported every step of the way.', name: 'Mark Davidson', role: 'Client' },
      ]), ANIM_FADE_UP),
    ],
    aboutHeading: 'Compassion Meets\nExpertise', aboutDesc: 'We understand that family matters are deeply personal. We treat every case with the sensitivity it deserves.',
    aboutImg: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Empathy', desc: 'We listen first, advise second.' }, { title: 'Discretion', desc: 'Complete confidentiality guaranteed.' }, { title: 'Resolution', desc: 'Focused on outcomes, not conflict.' }],
    servicesTitle: 'Our Services',
    services: [
      { name: 'Divorce & Separation', desc: 'Full legal support through all stages of divorce proceedings.', imgUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop' },
      { name: 'Children & Custody', desc: 'Contact orders, residency disputes, and international custody.', imgUrl: 'https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=800&h=600&fit=crop' },
      { name: 'Mediation', desc: 'Alternative dispute resolution saving time, cost, and emotional toll.', imgUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Our Process', slug: '/process', elements: [
      withAnim(premiumFeatures('How It Works', 'A clear, supportive process from start to finish.', [
        { title: '1. Free Consultation', desc: 'A confidential 30-minute discussion to understand your situation.' },
        { title: '2. Strategy & Advice', desc: 'Clear, honest advice on your options and likely outcomes.' },
        { title: '3. Representation', desc: 'Expert legal representation in negotiations, mediation, or court.' },
        { title: '4. Resolution', desc: 'Achieving the best possible outcome for you and your family.' },
      ], { cols: 2 }), ANIM_FADE_UP),
    ]},
  })),

  // For brevity, remaining templates use autoPages helper for consistent 5-page structure

  // ─── WEDDING (3) ─────────────────────────────────────────────────
  makeTemplate('wedding-planner', 'Wedding Planner', 'Elegant wedding planning with real photography', 'Wedding', [
    premiumNav('Bliss & Co', ['Services', 'Portfolio', 'About', 'Enquire'], 'dark'),
    fullBleedHero('Your Perfect Day,\nPerfected', 'Bespoke wedding planning for discerning couples.', 'Start Planning', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.35)' }),
    premiumFoot('Bliss & Co'),
  ], autoPages({
    brand: 'Bliss & Co', links: ['Services', 'Portfolio', 'About', 'Enquire'],
    homeElements: [
      fullBleedHero('Your Perfect Day,\nPerfected', 'Bespoke wedding planning for discerning couples.', 'Start Planning', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.35)' }),
      imageGallery('Recent Celebrations', [
        { src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=400&fit=crop', alt: 'Wedding 1' },
        { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop', alt: 'Wedding 2' },
        { src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&h=400&fit=crop', alt: 'Wedding 3' },
      ]),
      withAnim(premiumTestimonials([
        { quote: 'Bliss & Co turned our vision into the most magical day.', name: 'Emily & James', role: 'Married June 2025' },
        { quote: 'Absolutely flawless from start to finish.', name: 'Priya & Raj', role: 'Married September 2025' },
      ]), ANIM_FADE_UP),
    ],
    aboutHeading: 'Creating Magical\nMoments Since 2012', aboutDesc: 'Every wedding we plan is as unique as the love story behind it.',
    aboutImg: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Bespoke', desc: 'Every detail tailored to your unique vision.' }, { title: 'Flawless', desc: 'Meticulous planning for a stress-free day.' }, { title: 'Trusted', desc: '500+ couples trust us with their biggest day.' }],
    servicesTitle: 'Our Services',
    services: [
      { name: 'Full Planning', desc: 'Every detail handled — from venue sourcing to farewell sparklers.', imgUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop' },
      { name: 'Day Coordination', desc: 'Seamless execution so you can enjoy every moment.', imgUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=600&fit=crop' },
      { name: 'Destination Weddings', desc: 'Dream celebrations in extraordinary locations worldwide.', imgUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Portfolio', slug: '/portfolio', elements: [
      imageGallery('Our Weddings', [
        { src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=400&fit=crop', alt: 'Wedding 1' },
        { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop', alt: 'Wedding 2' },
        { src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=600&h=400&fit=crop', alt: 'Wedding 3' },
        { src: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop', alt: 'Wedding 4' },
        { src: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=600&h=400&fit=crop', alt: 'Wedding 5' },
        { src: 'https://images.unsplash.com/photo-1478146059778-acee8c3f1578?w=600&h=400&fit=crop', alt: 'Wedding 6' },
      ]),
    ]},
  })),

  makeTemplate('wedding-venue', 'Wedding Venue', 'Stunning venue showcase', 'Wedding', [
    premiumNav('Ashford Manor', ['The Venue', 'Weddings', 'Events', 'Contact'], 'dark'),
    fullBleedHero('Where Love\nStories Begin', 'A Grade II listed manor house set in 200 acres of English parkland.', 'Check Availability', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.3)' }),
    premiumFoot('Ashford Manor'),
  ], autoPages({
    brand: 'Ashford Manor', links: ['The Venue', 'Weddings', 'Events', 'Contact'],
    homeElements: [
      fullBleedHero('Where Love\nStories Begin', 'A Grade II listed manor house in 200 acres of parkland.', 'Check Availability', 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.3)' }),
      withAnim(premiumStats([{ value: '500+', label: 'Weddings' }, { value: '1764', label: 'Established' }, { value: '200', label: 'Acres' }]), ANIM_FADE_UP),
      imageGallery('The Venue', [
        { src: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=400&fit=crop', alt: 'Venue 1' },
        { src: 'https://images.unsplash.com/photo-1478146059778-acee8c3f1578?w=600&h=400&fit=crop', alt: 'Venue 2' },
        { src: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&h=400&fit=crop', alt: 'Venue 3' },
      ]),
    ],
    aboutHeading: 'A Heritage of\nCelebration', aboutDesc: 'Ashford Manor has hosted celebrations for over 250 years.',
    aboutImg: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Heritage', desc: 'Grade II listed with 260 years of history.' }, { title: 'Exclusivity', desc: 'Only one wedding per weekend.' }, { title: 'Service', desc: 'Dedicated wedding coordinator included.' }],
    servicesTitle: 'What We Offer',
    services: [
      { name: 'Ceremony Spaces', desc: 'Orangery, chapel, and lakeside outdoor ceremony options.', imgUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop' },
      { name: 'Grand Ballroom', desc: 'Chandelier-lit reception hall seating up to 250 guests.', imgUrl: 'https://images.unsplash.com/photo-1478146059778-acee8c3f1578?w=800&h=600&fit=crop' },
      { name: 'Luxury Suites', desc: '24 individually designed bedrooms for your wedding party.', imgUrl: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Events', slug: '/events', elements: [
      withAnim(premiumFeatures('Corporate & Private Events', 'Beyond weddings — a venue for every occasion.', [
        { title: 'Corporate Retreats', desc: 'Inspiring surroundings for team building and strategic planning.' },
        { title: 'Private Celebrations', desc: 'Birthdays, anniversaries, and milestone events.' },
        { title: 'Seasonal Events', desc: 'Christmas parties, summer fêtes, and seasonal dinners.' },
      ]), ANIM_FADE_UP),
    ]},
  })),

  makeTemplate('wedding-photography', 'Wedding Photography', 'Visual-first dark photography portfolio', 'Wedding', [
    premiumNav('Olivia Hart', ['Portfolio', 'About', 'Packages', 'Book'], 'dark'),
    fullBleedHero('Moments\nWorth Keeping', 'Documentary wedding photography that tells your unique story.', 'View Portfolio', 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.4)' }),
    premiumFoot('Olivia Hart Photography'),
  ], autoPages({
    brand: 'Olivia Hart', links: ['Portfolio', 'About', 'Packages', 'Book'],
    homeElements: [
      fullBleedHero('Moments\nWorth Keeping', 'Documentary wedding photography that tells your unique story.', 'View Portfolio', 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.4)' }),
      imageGallery('Selected Works', [
        { src: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&h=400&fit=crop', alt: 'Photo 1' },
        { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop', alt: 'Photo 2' },
        { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop', alt: 'Photo 3' },
        { src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=400&fit=crop', alt: 'Photo 4' },
      ]),
      withAnim(premiumTestimonials([
        { quote: 'Olivia captured moments we didn\'t even know happened. Pure artistry.', name: 'Hannah & Chris', role: 'Married May 2025' },
      ]), ANIM_FADE_UP),
    ],
    aboutHeading: 'Telling Love\nStories', aboutDesc: 'Documentary-style photographer capturing the raw, beautiful reality of your day.',
    aboutImg: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&h=900&fit=crop',
    aboutValues: [{ title: 'Documentary Style', desc: 'Natural, unposed moments that tell your real story.' }, { title: 'Artistic Vision', desc: 'Fine-art editing with timeless, elegant tones.' }, { title: 'Full Day Coverage', desc: 'Every moment from preparation to last dance.' }],
    servicesTitle: 'How I Work',
    services: [
      { name: 'Wedding Photography', desc: 'Full-day documentary coverage of your wedding celebration.', imgUrl: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&h=600&fit=crop' },
      { name: 'Engagement Shoots', desc: 'Relaxed pre-wedding session to capture your connection.', imgUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop' },
      { name: 'Album Design', desc: 'Handcrafted Italian leather albums and fine-art prints.', imgUrl: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&h=600&fit=crop' },
    ],
    page4: { name: 'Packages', slug: '/packages', elements: [
      withAnim(premiumPricing([
        { name: 'Essential', price: '£2,500', features: '8 hours\n500+ edited images\nOnline gallery\nFull print rights' },
        { name: 'Premium', price: '£3,800', features: '12 hours\n800+ edited images\nEngagement shoot\nAlbum design\nSecond shooter', popular: true },
      ]), ANIM_FADE_UP),
    ]},
  })),

  // ─── REMAINING TEMPLATES — All with 5 pages via autoPages ───────

  // RESTAURANT
  makeTemplate('fine-dining', 'Fine Dining', 'Elegant restaurant with full-bleed food photography', 'Restaurant', [
    premiumNav('La Maison', ['Menu', 'Wine', 'Private Dining', 'Reserve'], 'dark'),
    fullBleedHero('La Maison', 'Two Michelin stars. Seasonal French cuisine.', 'Reserve a Table', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.45)' }),
    premiumFoot('La Maison'),
  ], autoPages({ brand: 'La Maison', links: ['Menu', 'Wine', 'Private Dining', 'Reserve'], homeElements: [fullBleedHero('La Maison', 'Two Michelin stars. Seasonal French cuisine in Mayfair.', 'Reserve a Table', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.45)' }), withAnim(imageTextRow('Seasonal\nTasting Menu', 'Seven courses showcasing the finest British produce through classical French technique.', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop'), ANIM_TILT), withAnim(imageTextRow('The Wine\nCellar', 'Over 800 labels curated by our head sommelier.', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop', { reverse: true }), ANIM_TILT)], aboutHeading: 'A Culinary\nLegacy', aboutDesc: 'La Maison has been a beacon of French gastronomy in London since 1998.', aboutImg: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Seasonality', desc: 'Menus change daily based on the finest available produce.' }, { title: 'Craft', desc: 'Every dish is a work of art, perfected over decades.' }, { title: 'Hospitality', desc: 'Warm, attentive service without pretension.' }], servicesTitle: 'Dining Experiences', services: [{ name: 'Tasting Menu', desc: 'Seven-course gastronomic journey through seasonal British produce.', imgUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop' }, { name: 'Wine Pairing', desc: 'Sommelier-selected wines to complement every course.', imgUrl: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop' }, { name: 'Private Dining', desc: 'Intimate 24-seat private dining room for special occasions.', imgUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop' }], page4: { name: 'Menu', slug: '/menu', elements: [withAnim(premiumFeatures('Current Menu', 'Seasonal dishes crafted daily.', [{ title: 'Amuse-Bouche', desc: 'Foie gras parfait, Sauternes jelly, brioche.' }, { title: 'First Course', desc: 'Cornish crab, avocado mousse, pink grapefruit.' }, { title: 'Main Course', desc: 'Aged Hereford beef, truffle pomme purée, red wine jus.' }]), ANIM_FADE_UP)] } })),

  makeTemplate('cafe', 'Artisan Café', 'Warm specialty coffee house', 'Restaurant', [
    premiumNav('Alchemy', ['Menu', 'Our Story', 'Locations', 'Order'], 'dark'),
    splitHero('Coffee,\nElevated', 'Specialty single-origin coffee roasted in-house daily.', 'Order Online', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=900&fit=crop'),
    premiumFoot('Alchemy Coffee'),
  ], autoPages({ brand: 'Alchemy', links: ['Menu', 'Our Story', 'Locations', 'Order'], homeElements: [splitHero('Coffee,\nElevated', 'Specialty single-origin coffee roasted in-house daily.', 'Order Online', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=900&fit=crop'), withAnim(imageTextRow('Single Origin\nRoasting', 'Direct trade relationships with farms in Ethiopia, Colombia, and Guatemala.', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop'), ANIM_TILT)], aboutHeading: 'Craft Coffee\nSince 2016', aboutDesc: 'Born from a passion for exceptional coffee and community.', aboutImg: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Direct Trade', desc: 'Relationships with farmers, not brokers.' }, { title: 'Fresh Roasted', desc: 'Micro-batches roasted every morning.' }, { title: 'Community', desc: 'More than a café — a gathering place.' }], servicesTitle: 'What We Serve', services: [{ name: 'Specialty Coffee', desc: 'Pour-over, espresso, and cold brew from single-origin beans.', imgUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop' }, { name: 'Brunch Menu', desc: 'House-baked sourdough, seasonal plates, and artisanal pastries.', imgUrl: 'https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=800&h=600&fit=crop' }, { name: 'Catering', desc: 'Coffee carts and catering for events and offices.', imgUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop' }], page4: { name: 'Locations', slug: '/locations', elements: [withAnim(premiumFeatures('Our Locations', 'Find us across the city.', [{ title: 'Shoreditch', desc: '42 Redchurch Street — Our flagship, open 7 days.' }, { title: 'Soho', desc: '15 Beak Street — Espresso bar and takeaway.' }, { title: 'Kings Cross', desc: 'Coal Drops Yard — Full café and bakery.' }]), ANIM_FADE_UP)] } })),

  makeTemplate('food-delivery', 'Food Delivery', 'Modern dark delivery app landing', 'Restaurant', [
    premiumNav('FreshBite', ['Menu', 'How It Works', 'For Restaurants', 'Download'], 'dark'),
    splitHero('Restaurant\nFood, Delivered\nin 25 Minutes', 'No surge pricing. No hidden fees. Great food from local restaurants.', 'Order Now', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=900&fit=crop'),
    premiumFoot('FreshBite'),
  ], autoPages({ brand: 'FreshBite', links: ['Menu', 'How It Works', 'Partners', 'Contact'], homeElements: [splitHero('Restaurant\nFood, Delivered\nin 25 Minutes', 'No surge pricing. No hidden fees.', 'Order Now', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=900&fit=crop'), withAnim(premiumStats([{ value: '500+', label: 'Restaurants' }, { value: '25min', label: 'Avg Delivery' }, { value: '4.9★', label: 'App Rating' }], { border: true }), ANIM_FADE_UP), withAnim(premiumFeatures('Why FreshBite?', 'Delivery done differently.', [{ title: 'No Surge Pricing', desc: 'Fixed delivery fees regardless of time or demand.' }, { title: 'Live Tracking', desc: 'Watch your order from kitchen to doorstep.' }, { title: 'Zero Waste', desc: 'Eco-friendly packaging on every order.' }]), ANIM_REVEAL)], aboutHeading: 'Delivery Done\nDifferently', aboutDesc: 'We believe great food delivery shouldn\'t come with hidden costs.', aboutImg: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Fair Pricing', desc: 'No surge fees, ever.' }, { title: 'Eco-First', desc: 'Carbon-neutral delivery fleet.' }, { title: 'Local Love', desc: 'Supporting independent restaurants.' }], servicesTitle: 'How It Works', services: [{ name: 'Browse & Order', desc: 'Explore menus from 500+ local restaurants and order in seconds.', imgUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=600&fit=crop' }, { name: 'Real-Time Tracking', desc: 'GPS tracking from kitchen preparation to your doorstep.', imgUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop' }, { name: 'For Restaurants', desc: 'Partner with us to reach thousands of new customers.', imgUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop' }], page4: { name: 'For Restaurants', slug: '/partners', elements: [withAnim(premiumFeatures('Partner With Us', 'Grow your restaurant business.', [{ title: 'Increased Orders', desc: 'Average 40% increase in orders within the first month.' }, { title: 'No Upfront Costs', desc: 'Commission-based model with no setup fees.' }, { title: 'Marketing Support', desc: 'Featured placements and promotional campaigns.' }]), ANIM_FADE_UP)] } })),

  // HEALTHCARE
  makeTemplate('medical-practice', 'Medical Practice', 'Professional dark healthcare', 'Healthcare', [
    premiumNav('Wellspring', ['Services', 'Doctors', 'Book', 'Portal'], 'dark'),
    splitHero('Your Health,\nOur Priority', 'Comprehensive family healthcare with compassion and expertise.', 'Book Appointment', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=900&fit=crop'),
    premiumFoot('Wellspring Medical'),
  ], autoPages({ brand: 'Wellspring', links: ['Services', 'Doctors', 'Book', 'Contact'], homeElements: [splitHero('Your Health,\nOur Priority', 'Comprehensive family healthcare with compassion and expertise.', 'Book Appointment', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=900&fit=crop'), withAnim(premiumFeatures('Our Services', 'Complete healthcare under one roof.', [{ title: 'General Practice', desc: 'Check-ups, vaccinations, screenings, and preventive care.' }, { title: 'Specialist Referrals', desc: 'Fast-track referrals to leading consultants.' }, { title: 'Mental Health', desc: 'Confidential counselling and psychiatric support.' }, { title: 'Diagnostics', desc: 'On-site blood tests, MRI, ultrasound, and screening.' }], { cols: 2 }), ANIM_REVEAL)], aboutHeading: 'Caring for\nCommunities', aboutDesc: 'Wellspring Medical has been providing compassionate healthcare for over 20 years.', aboutImg: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Patient First', desc: 'Your wellbeing drives every decision.' }, { title: 'Evidence Based', desc: 'Latest clinical guidelines and research.' }, { title: 'Accessible', desc: 'Same-day appointments and online booking.' }], servicesTitle: 'Healthcare Services', services: [{ name: 'General Practice', desc: 'Routine and urgent primary care for all ages.', imgUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop' }, { name: 'Specialist Care', desc: 'In-house dermatology, cardiology, and endocrinology.', imgUrl: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=600&fit=crop' }, { name: 'Diagnostics', desc: 'Comprehensive testing and imaging on-site.', imgUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop' }], page4: { name: 'Our Doctors', slug: '/doctors', elements: [cinematicAbout('Our Medical Team', 'Experienced, compassionate doctors dedicated to your health.', 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=900&fit=crop', [{ title: 'Dr Sarah Mitchell', desc: 'GP Principal. 20+ years experience in family medicine.' }, { title: 'Dr James Park', desc: 'Specialist in cardiology and preventive health.' }, { title: 'Dr Amara Singh', desc: 'Mental health lead. CBT and psychiatry.' }])] } })),

  makeTemplate('dental', 'Dental Practice', 'Modern cosmetic dentistry', 'Healthcare', [
    premiumNav('Bright Smile', ['Treatments', 'Team', 'Gallery', 'Book'], 'dark'),
    splitHero('A Smile\nYou\'ll Love', 'Advanced cosmetic and general dentistry in a state-of-the-art environment.', 'Book Free Consultation', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&h=900&fit=crop'),
    premiumFoot('Bright Smile Dental'),
  ], autoPages({ brand: 'Bright Smile', links: ['Treatments', 'Team', 'Gallery', 'Book'], homeElements: [splitHero('A Smile\nYou\'ll Love', 'Advanced cosmetic and general dentistry.', 'Book Free Consultation', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&h=900&fit=crop'), withAnim(premiumFeatures('Treatments', 'Comprehensive dental care.', [{ title: 'Teeth Whitening', desc: 'Professional Zoom whitening for a dazzling smile.' }, { title: 'Invisalign', desc: 'Invisible aligners that straighten teeth discreetly.' }, { title: 'Dental Implants', desc: 'Permanent, natural-looking replacements.' }]), ANIM_REVEAL), withAnim(premiumTestimonials([{ quote: 'Completely transformed my confidence.', name: 'Jessica Park', role: 'Invisalign Patient' }]), ANIM_FADE_UP)], aboutHeading: 'Smile With\nConfidence', aboutDesc: 'State-of-the-art cosmetic dentistry with a gentle, caring approach.', aboutImg: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Gentle Care', desc: 'Anxious patients welcome. Sedation available.' }, { title: 'Latest Technology', desc: '3D scanning, digital impressions, laser dentistry.' }, { title: 'Results Driven', desc: 'Thousands of smile transformations completed.' }], servicesTitle: 'Our Treatments', services: [{ name: 'Cosmetic Dentistry', desc: 'Veneers, bonding, and complete smile makeovers.', imgUrl: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=800&h=600&fit=crop' }, { name: 'Orthodontics', desc: 'Invisalign, fixed braces, and retention solutions.', imgUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop' }, { name: 'General Dentistry', desc: 'Check-ups, fillings, hygiene, and preventive care.', imgUrl: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=800&h=600&fit=crop' }], page4: { name: 'Gallery', slug: '/gallery', elements: [imageGallery('Smile Transformations', [{ src: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop', alt: 'Before After 1' }, { src: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop', alt: 'Treatment 2' }, { src: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=600&h=400&fit=crop', alt: 'Team 3' }])] } })),

  // EDUCATION
  makeTemplate('online-course', 'Online Course', 'Dark e-learning platform', 'Education', [
    premiumNav('SkillForge', ['Courses', 'Instructors', 'Pricing', 'Login'], 'dark'),
    el('section', {}, { desktop: { padding: '160px 60px 120px', textAlign: 'center', backgroundColor: '#000' } }, [
      el('heading', { text: 'Learn Without\nLimits', level: 'h1' }, { desktop: { fontSize: '68px', fontWeight: '700', color: '#fff', letterSpacing: '-0.04em', lineHeight: '1.05', marginBottom: '24px' } }),
      el('text', { text: 'Master new skills with expert-led courses.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.45)', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' } }),
      el('button', { text: 'Browse Courses', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#7c3aed', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none' } }),
    ], 'Hero'),
    premiumFoot('SkillForge'),
  ], autoPages({ brand: 'SkillForge', links: ['Courses', 'Instructors', 'Pricing', 'Contact'], homeElements: [el('section', {}, { desktop: { padding: '160px 60px 120px', textAlign: 'center', backgroundColor: '#000' } }, [el('heading', { text: 'Learn Without\nLimits', level: 'h1' }, { desktop: { fontSize: '68px', fontWeight: '700', color: '#fff', letterSpacing: '-0.04em', lineHeight: '1.05', marginBottom: '24px' } }), el('text', { text: 'Master new skills with expert-led courses.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.45)', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' } }), el('button', { text: 'Browse Courses', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#7c3aed', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none' } })], 'Hero'), withAnim(premiumStats([{ value: '50K+', label: 'Students' }, { value: '200+', label: 'Courses' }, { value: '4.8★', label: 'Rating' }], { border: true }), ANIM_FADE_UP), withAnim(premiumFeatures('Popular Categories', 'Industry-leading curriculum.', [{ title: 'Web Development', desc: 'React, Node.js, TypeScript, and full-stack engineering.' }, { title: 'Design', desc: 'UI/UX, Figma, brand identity, and visual communication.' }, { title: 'Data Science', desc: 'Python, ML, deep learning, and statistical modelling.' }]), ANIM_REVEAL)], aboutHeading: 'Education for\nthe Future', aboutDesc: 'SkillForge empowers learners with industry-relevant skills.', aboutImg: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Expert Instructors', desc: 'Learn from industry professionals.' }, { title: 'Hands-On', desc: 'Real projects, not just theory.' }, { title: 'Career Ready', desc: 'Skills employers actually want.' }], servicesTitle: 'Learning Paths', services: [{ name: 'Web Development', desc: 'From HTML basics to React architecture.', imgUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop' }, { name: 'Data Science', desc: 'Python, ML, and AI fundamentals to advanced.', imgUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop' }, { name: 'UX Design', desc: 'Research, wireframing, prototyping, and testing.', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop' }], page4: { name: 'Pricing', slug: '/pricing', elements: [withAnim(premiumPricing([{ name: 'Free', price: '$0', features: '5 free courses\nCommunity forum\nBasic certificate' }, { name: 'Pro', price: '$19/mo', features: 'All courses\nProject files\nVerified certificate\nMentor support', popular: true }, { name: 'Teams', price: '$49/seat', features: 'Everything in Pro\nTeam analytics\nCustom paths\nSSO' }]), ANIM_FADE_UP)] } })),

  makeTemplate('university', 'University', 'Academic institution', 'Education', [
    premiumNav('Westfield', ['Programs', 'Research', 'Campus', 'Apply'], 'dark'),
    fullBleedHero('Shape\nthe Future', 'World-class education and groundbreaking research since 1892.', 'Apply Now', 'https://images.unsplash.com/photo-1562774053-701939374585?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,10,0.6)' }),
    premiumFoot('Westfield University'),
  ], autoPages({ brand: 'Westfield', links: ['Programs', 'Research', 'Campus', 'Apply'], homeElements: [fullBleedHero('Shape\nthe Future', 'World-class education since 1892.', 'Apply Now', 'https://images.unsplash.com/photo-1562774053-701939374585?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,10,0.6)' }), withAnim(premiumStats([{ value: '#12', label: 'National Ranking' }, { value: '35K', label: 'Students' }, { value: '98%', label: 'Employment' }]), ANIM_FADE_UP), withAnim(premiumFeatures('Schools & Faculties', 'Excellence across every discipline.', [{ title: 'Engineering', desc: 'AI, quantum computing, and sustainable energy research.' }, { title: 'Business School', desc: 'Triple-accredited MBA and executive education.' }, { title: 'Medicine', desc: 'Training next-generation healthcare professionals.' }]), ANIM_REVEAL)], aboutHeading: 'A Legacy of\nDiscovery', aboutDesc: 'For over 130 years, Westfield has been a beacon of academic excellence.', aboutImg: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Research Excellence', desc: 'World-leading research across 40+ disciplines.' }, { title: 'Global Community', desc: 'Students from 150+ countries.' }, { title: 'Innovation', desc: 'Spin-out companies generating $2B+ annually.' }], servicesTitle: 'Academic Programs', services: [{ name: 'Undergraduate', desc: '200+ programmes across sciences, arts, and engineering.', imgUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop' }, { name: 'Postgraduate', desc: 'Master\'s and doctoral programmes with world-class supervision.', imgUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop' }, { name: 'Executive Education', desc: 'Short courses and custom programmes for professionals.', imgUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=800&h=600&fit=crop' }], page4: { name: 'Campus', slug: '/campus', elements: [imageGallery('Campus Life', [{ src: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&h=400&fit=crop', alt: 'Campus 1' }, { src: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop', alt: 'Campus 2' }, { src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=400&fit=crop', alt: 'Campus 3' }])] } })),

  // CREATIVE (4)
  makeTemplate('portfolio-minimal', 'Minimal Portfolio', 'Ultra-clean dark creative portfolio', 'Creative', [
    premiumNav('Jane Doe', ['Work', 'About', 'Contact'], 'dark'),
    el('section', {}, { desktop: { padding: '160px 60px', backgroundColor: '#000' } }, [el('container', {}, { desktop: { maxWidth: '800px' } }, [el('text', { text: 'DESIGNER & DEVELOPER' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: '20px' } }), el('heading', { text: 'Creating Digital\nExperiences\nThat Matter', level: 'h1' }, { desktop: { fontSize: '64px', fontWeight: '700', color: '#fff', letterSpacing: '-0.04em', lineHeight: '1.05' } })])], 'Hero'),
    premiumFoot('Jane Doe'),
  ], autoPages({ brand: 'Jane Doe', links: ['Work', 'About', 'Services', 'Contact'], homeElements: [el('section', {}, { desktop: { padding: '160px 60px', backgroundColor: '#000' } }, [el('container', {}, { desktop: { maxWidth: '800px' } }, [el('text', { text: 'DESIGNER & DEVELOPER' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: '20px' } }), el('heading', { text: 'Creating Digital\nExperiences\nThat Matter', level: 'h1' }, { desktop: { fontSize: '64px', fontWeight: '700', color: '#fff', letterSpacing: '-0.04em', lineHeight: '1.05' } })])], 'Hero'), imageGallery('Selected Work', [{ src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop', alt: 'Project 1' }, { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop', alt: 'Project 2' }, { src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop', alt: 'Project 3' }, { src: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=600&h=400&fit=crop', alt: 'Project 4' }], { cols: 2 })], aboutHeading: 'Design-Led\nDeveloper', aboutDesc: 'I create digital experiences that are both beautiful and functional.', aboutImg: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Design Thinking', desc: 'User-centred approach to every project.' }, { title: 'Clean Code', desc: 'Performant, accessible, and maintainable.' }, { title: 'Results', desc: 'Measurable impact on business goals.' }], servicesTitle: 'What I Do', services: [{ name: 'UI/UX Design', desc: 'User research, wireframing, and high-fidelity prototypes.', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop' }, { name: 'Front-End Dev', desc: 'React, TypeScript, and modern web technologies.', imgUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop' }, { name: 'Brand Identity', desc: 'Logo design, visual systems, and brand guidelines.', imgUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop' }], page4: { name: 'Work', slug: '/work', elements: [cinematicPortfolio('All Projects', [{ name: 'E-commerce Redesign', category: 'UI/UX', imgUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop' }, { name: 'SaaS Dashboard', category: 'Development', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop' }, { name: 'Brand Identity', category: 'Branding', imgUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=500&fit=crop' }, { name: 'Mobile App', category: 'UI/UX', imgUrl: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=800&h=500&fit=crop' }])] } })),

  makeTemplate('photography', 'Photography Studio', 'Dark visual-first photography', 'Creative', [premiumNav('Lens & Light', ['Portfolio', 'Services', 'About', 'Book'], 'dark'), fullBleedHero('Capturing\nLight', 'Professional photography for brands and commercial campaigns.', 'View Portfolio', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.4)' }), premiumFoot('Lens & Light Studio')], autoPages({ brand: 'Lens & Light', links: ['Portfolio', 'Services', 'About', 'Book'], homeElements: [fullBleedHero('Capturing\nLight', 'Professional photography for brands and campaigns.', 'View Portfolio', 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.4)' }), imageGallery('Recent Work', [{ src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', alt: 'Photo 1' }, { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop', alt: 'Photo 2' }, { src: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=600&h=400&fit=crop', alt: 'Photo 3' }, { src: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&h=400&fit=crop', alt: 'Photo 4' }])], aboutHeading: 'The Art of\nSeeing', aboutDesc: 'Award-winning photography studio specialising in commercial and editorial work.', aboutImg: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Vision', desc: 'Finding extraordinary in the ordinary.' }, { title: 'Craft', desc: 'Meticulous attention to light and composition.' }, { title: 'Story', desc: 'Every image tells a narrative.' }], servicesTitle: 'Photography Services', services: [{ name: 'Commercial', desc: 'Product, food, and architectural photography.', imgUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop' }, { name: 'Editorial', desc: 'Fashion, lifestyle, and portrait photography.', imgUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop' }, { name: 'Events', desc: 'Corporate events, conferences, and celebrations.', imgUrl: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&h=600&fit=crop' }], page4: { name: 'Pricing', slug: '/pricing', elements: [withAnim(premiumPricing([{ name: 'Half Day', price: '£800', features: '4 hours\n100+ edited images\nOnline gallery\nCommercial licence' }, { name: 'Full Day', price: '£1,500', features: '8 hours\n300+ images\nFull commercial rights\nRush delivery', popular: true }]), ANIM_FADE_UP)] } })),

  makeTemplate('design-agency', 'Design Agency', 'Bold dark creative agency', 'Creative', [premiumNav('PIXEL.', ['Work', 'Services', 'About', 'Contact'], 'dark'), el('section', {}, { desktop: { padding: '180px 60px', backgroundColor: '#000' } }, [el('container', {}, { desktop: { maxWidth: '1000px' } }, [el('heading', { text: 'We design brands\npeople love.', level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '700', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.04em' } }), el('button', { text: 'Start a Project', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', marginTop: '48px', letterSpacing: '0.08em', textTransform: 'uppercase' as any } })])], 'Hero'), premiumFoot('PIXEL.')], autoPages({ brand: 'PIXEL.', links: ['Work', 'Services', 'About', 'Contact'], homeElements: [el('section', {}, { desktop: { padding: '180px 60px', backgroundColor: '#000' } }, [el('container', {}, { desktop: { maxWidth: '1000px' } }, [el('heading', { text: 'We design brands\npeople love.', level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '700', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.04em' } }), el('button', { text: 'Start a Project', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', marginTop: '48px', letterSpacing: '0.08em', textTransform: 'uppercase' as any } })])], 'Hero'), imageGallery('Case Studies', [{ src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop', alt: 'Case 1' }, { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop', alt: 'Case 2' }, { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop', alt: 'Case 3' }])], aboutHeading: 'Design That\nMoves People', aboutDesc: 'PIXEL. is a creative studio obsessed with craft, beauty, and impact.', aboutImg: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Craft', desc: 'Obsessive attention to every pixel.' }, { title: 'Strategy', desc: 'Design driven by business goals.' }, { title: 'Culture', desc: 'Brands that resonate with people.' }], servicesTitle: 'What We Do', services: [{ name: 'Brand Identity', desc: 'Logo, visual systems, and brand guidelines.', imgUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop' }, { name: 'Web Design', desc: 'Award-winning websites that convert.', imgUrl: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=800&h=600&fit=crop' }, { name: 'Motion Design', desc: 'Animation, video, and interactive experiences.', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop' }], page4: { name: 'Work', slug: '/work', elements: [cinematicPortfolio('Selected Work', [{ name: 'Rebrand for TechCorp', category: 'Branding', imgUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=500&fit=crop' }, { name: 'E-commerce Platform', category: 'Web', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop' }, { name: 'Product Launch', category: 'Campaign', imgUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=500&fit=crop' }, { name: 'App Design', category: 'UI/UX', imgUrl: 'https://images.unsplash.com/photo-1545235617-9465d2a55698?w=800&h=500&fit=crop' }])] } })),

  makeTemplate('architect', 'Architecture Firm', 'Minimalist dark architecture', 'Creative', [premiumNav('ARCO', ['Projects', 'Practice', 'Journal', 'Contact'], 'dark'), fullBleedHero('Designing Spaces\nThat Inspire', 'Architecture, interior, and landscape design.', 'View Projects', 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.45)', align: 'left' }), premiumFoot('ARCO Studio')], autoPages({ brand: 'ARCO', links: ['Projects', 'Practice', 'Journal', 'Contact'], homeElements: [fullBleedHero('Designing Spaces\nThat Inspire', 'Architecture, interior, and landscape design.', 'View Projects', 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.45)', align: 'left' }), imageGallery('Selected Projects', [{ src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', alt: 'Project 1' }, { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop', alt: 'Project 2' }, { src: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&h=400&fit=crop', alt: 'Project 3' }])], aboutHeading: 'Form Follows\nIntention', aboutDesc: 'ARCO creates architecture that enhances how people live and work.', aboutImg: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Context', desc: 'Buildings that respond to their environment.' }, { title: 'Sustainability', desc: 'Carbon-neutral design as standard.' }, { title: 'Craft', desc: 'Material honesty and construction excellence.' }], servicesTitle: 'Our Practice', services: [{ name: 'Architecture', desc: 'Residential, commercial, and cultural buildings.', imgUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&fit=crop' }, { name: 'Interior Design', desc: 'Spaces that feel as good as they look.', imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop' }, { name: 'Urban Planning', desc: 'Master plans for communities and developments.', imgUrl: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&h=600&fit=crop' }], page4: { name: 'Projects', slug: '/projects', elements: [cinematicPortfolio('All Projects', [{ name: 'Cliffside Residence', category: 'Residential', imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop' }, { name: 'Innovation Tower', category: 'Commercial', imgUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop' }, { name: 'Gallery of Light', category: 'Cultural', imgUrl: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=800&h=500&fit=crop' }, { name: 'Waterfront Masterplan', category: 'Urban', imgUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop' }])] } })),

  // E-COMMERCE (3)
  makeTemplate('fashion', 'Fashion Store', 'High-end dark fashion e-commerce', 'E-commerce', [premiumNav('MAISON', ['New In', 'Women', 'Men', 'Sale'], 'dark'), fullBleedHero('Spring/Summer\n2026', 'Discover the new collection. Designed in London, made in Italy.', 'Shop Now', 'https://images.unsplash.com/photo-1558171813-01a0f0e2e8d3?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.3)' }), premiumFoot('MAISON')], autoPages({ brand: 'MAISON', links: ['New In', 'Collections', 'About', 'Contact'], homeElements: [fullBleedHero('Spring/Summer\n2026', 'Designed in London, made in Italy.', 'Shop Now', 'https://images.unsplash.com/photo-1558171813-01a0f0e2e8d3?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.3)' }), imageGallery('New Arrivals', [{ src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop', alt: 'Fashion 1' }, { src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=400&fit=crop', alt: 'Fashion 2' }, { src: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop', alt: 'Fashion 3' }])], aboutHeading: 'The House\nof MAISON', aboutDesc: 'Founded in London, MAISON creates timeless luxury for the modern wardrobe.', aboutImg: 'https://images.unsplash.com/photo-1558171813-01a0f0e2e8d3?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Craftsmanship', desc: 'Handmade in Italy with the finest materials.' }, { title: 'Sustainability', desc: 'Ethical production, organic fabrics.' }, { title: 'Timelessness', desc: 'Pieces designed to last beyond seasons.' }], servicesTitle: 'Collections', services: [{ name: 'Women\'s Collection', desc: 'Elegant silhouettes crafted from premium Italian fabrics.', imgUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=600&fit=crop' }, { name: 'Men\'s Collection', desc: 'Refined essentials and tailored sophistication.', imgUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop' }, { name: 'Accessories', desc: 'Leather goods, jewellery, and finishing touches.', imgUrl: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop' }], page4: { name: 'Lookbook', slug: '/lookbook', elements: [imageGallery('SS26 Lookbook', [{ src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop', alt: 'Look 1' }, { src: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&h=400&fit=crop', alt: 'Look 2' }, { src: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop', alt: 'Look 3' }, { src: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=400&fit=crop', alt: 'Look 4' }, { src: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop', alt: 'Look 5' }, { src: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop', alt: 'Look 6' }])] } })),

  makeTemplate('jewelry', 'Jewellery Brand', 'Luxury dark jewellery', 'E-commerce', [premiumNav('AURUM', ['Collections', 'Bespoke', 'Our Story', 'Stockists'], 'dark'), splitHero('Timeless\nElegance', 'Handcrafted fine jewellery using ethically sourced precious metals.', 'View Collection', 'https://images.unsplash.com/photo-1515562141589-67f0d9e27e99?w=1200&h=900&fit=crop'), premiumFoot('AURUM')], autoPages({ brand: 'AURUM', links: ['Collections', 'Bespoke', 'Our Story', 'Contact'], homeElements: [splitHero('Timeless\nElegance', 'Handcrafted fine jewellery using ethically sourced metals.', 'View Collection', 'https://images.unsplash.com/photo-1515562141589-67f0d9e27e99?w=1200&h=900&fit=crop'), imageGallery('Collections', [{ src: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=400&fit=crop', alt: 'Ring' }, { src: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=600&h=400&fit=crop', alt: 'Necklace' }, { src: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=400&fit=crop', alt: 'Bracelet' }])], aboutHeading: 'Crafted by\nHand Since 1965', aboutDesc: 'Three generations of master artisans creating heirloom jewellery.', aboutImg: 'https://images.unsplash.com/photo-1515562141589-67f0d9e27e99?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Ethically Sourced', desc: 'Every gemstone traceable to its origin.' }, { title: 'Handcrafted', desc: 'Made in our London atelier.' }, { title: 'Lifetime Warranty', desc: 'Every piece guaranteed for life.' }], servicesTitle: 'Our Craft', services: [{ name: 'Fine Jewellery', desc: 'Rings, necklaces, and earrings in gold and platinum.', imgUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&h=600&fit=crop' }, { name: 'Bespoke Design', desc: 'Commission a one-of-a-kind piece designed just for you.', imgUrl: 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&h=600&fit=crop' }, { name: 'Restoration', desc: 'Expert repair and restoration of heirloom jewellery.', imgUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&h=600&fit=crop' }], page4: { name: 'Bespoke', slug: '/bespoke', elements: [withAnim(premiumFeatures('Bespoke Process', 'From concept to creation.', [{ title: '1. Consultation', desc: 'Discuss your vision, style, and budget.' }, { title: '2. Design', desc: 'Hand-drawn sketches and 3D renders for approval.' }, { title: '3. Creation', desc: 'Master artisans handcraft your unique piece.' }]), ANIM_FADE_UP)] } })),

  makeTemplate('tech-store', 'Tech Store', 'Dark modern electronics', 'E-commerce', [premiumNav('TechVault', ['Products', 'Deals', 'Support', 'Cart'], 'dark'), splitHero('Next-Gen\nTech, Today', 'Latest gadgets curated for enthusiasts. Priced for everyone.', 'Shop Deals', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&h=900&fit=crop'), premiumFoot('TechVault')], autoPages({ brand: 'TechVault', links: ['Products', 'Deals', 'Support', 'Contact'], homeElements: [splitHero('Next-Gen\nTech, Today', 'Latest gadgets curated for enthusiasts.', 'Shop Deals', 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&h=900&fit=crop'), withAnim(premiumFeatures('Top Categories', 'Thousands of products.', [{ title: 'Smartphones', desc: 'Latest flagships from Apple, Samsung, Google.' }, { title: 'Laptops', desc: 'MacBooks, ThinkPads, and gaming powerhouses.' }, { title: 'Audio', desc: 'Headphones, speakers, and studio equipment.' }]), ANIM_REVEAL)], aboutHeading: 'Tech for\nEveryone', aboutDesc: 'TechVault curates the best technology at the best prices.', aboutImg: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Price Match', desc: 'Found it cheaper? We\'ll match it.' }, { title: 'Fast Shipping', desc: 'Next-day delivery on all orders.' }, { title: 'Expert Support', desc: 'Tech specialists available 7 days a week.' }], servicesTitle: 'Shop by Category', services: [{ name: 'Smartphones & Tablets', desc: 'Latest devices from all major manufacturers.', imgUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=600&fit=crop' }, { name: 'Computing', desc: 'Laptops, desktops, and accessories.', imgUrl: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop' }, { name: 'Audio & Wearables', desc: 'Headphones, speakers, and smartwatches.', imgUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop' }], page4: { name: 'Deals', slug: '/deals', elements: [withAnim(premiumFeatures('Current Deals', 'Limited-time offers.', [{ title: 'iPhone 17 Pro', desc: 'Save £200 on the latest Apple flagship.' }, { title: 'MacBook Air M4', desc: '£100 off the ultra-thin powerhouse.' }, { title: 'Sony WH-1000XM6', desc: '30% off premium noise-cancelling headphones.' }]), ANIM_FADE_UP)] } })),

  // AGENCY (3)
  makeTemplate('marketing-agency', 'Marketing Agency', 'Results-driven dark marketing', 'Agency', [premiumNav('Ignite', ['Services', 'Work', 'Results', 'Contact'], 'dark'), el('section', {}, { desktop: { padding: '180px 60px', backgroundColor: '#000' } }, [el('container', {}, { desktop: { maxWidth: '900px' } }, [el('heading', { text: 'Growth.\nAmplified.', level: 'h1' }, { desktop: { fontSize: '80px', fontWeight: '700', color: '#fff', lineHeight: '1.02', letterSpacing: '-0.04em' } }), el('button', { text: 'Get Your Free Audit', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#dc2626', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', marginTop: '40px' } })])], 'Hero'), premiumFoot('Ignite Digital')], autoPages({ brand: 'Ignite', links: ['Services', 'Work', 'Results', 'Contact'], homeElements: [el('section', {}, { desktop: { padding: '180px 60px', backgroundColor: '#000' } }, [el('container', {}, { desktop: { maxWidth: '900px' } }, [el('heading', { text: 'Growth.\nAmplified.', level: 'h1' }, { desktop: { fontSize: '80px', fontWeight: '700', color: '#fff', lineHeight: '1.02', letterSpacing: '-0.04em' } }), el('text', { text: 'Data-driven marketing that delivers measurable ROI.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.4)', marginTop: '28px' } }), el('button', { text: 'Get Your Free Audit', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#dc2626', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', marginTop: '40px' } })])], 'Hero'), withAnim(premiumStats([{ value: '300%', label: 'Avg ROI' }, { value: '150+', label: 'Clients' }, { value: '$50M+', label: 'Revenue Generated' }], { border: true }), ANIM_FADE_UP)], aboutHeading: 'Results Over\nEverything', aboutDesc: 'Ignite is a performance marketing agency obsessed with ROI.', aboutImg: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Data-Driven', desc: 'Every decision backed by analytics.' }, { title: 'Transparent', desc: 'Real-time dashboards and honest reporting.' }, { title: 'Performance', desc: 'We only win when you win.' }], servicesTitle: 'Our Services', services: [{ name: 'SEO & Content', desc: 'Organic growth strategies that compound over time.', imgUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&h=600&fit=crop' }, { name: 'Paid Media', desc: 'Google, Meta, TikTok campaigns optimised for ROAS.', imgUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop' }, { name: 'Email Marketing', desc: 'Automated sequences that nurture and convert.', imgUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop' }], page4: { name: 'Results', slug: '/results', elements: [withAnim(premiumTestimonials([{ quote: 'Ignite tripled our organic traffic in 6 months.', name: 'Laura Chen', role: 'CMO, CloudBase' }, { quote: 'Best marketing investment we\'ve ever made.', name: 'David Okafor', role: 'Founder, NovaTech' }]), ANIM_FADE_UP), withAnim(premiumStats([{ value: '300%', label: 'Avg ROI' }, { value: '150+', label: 'Clients' }, { value: '$50M+', label: 'Revenue' }]), ANIM_FADE_UP)] } })),

  makeTemplate('web-agency', 'Web Design Agency', 'Premium dark web design studio', 'Agency', [premiumNav('Studio Zero', ['Work', 'Services', 'Process', 'Contact'], 'dark'), el('section', {}, { desktop: { padding: '180px 60px', backgroundColor: '#000' } }, [el('container', {}, { desktop: { maxWidth: '1000px' } }, [el('heading', { text: 'We build websites\nthat convert.', level: 'h1' }, { desktop: { fontSize: '68px', fontWeight: '700', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.04em' } }), el('button', { text: 'View Our Work', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', marginTop: '48px', letterSpacing: '0.08em', textTransform: 'uppercase' as any } })])], 'Hero'), premiumFoot('Studio Zero')], autoPages({ brand: 'Studio Zero', links: ['Work', 'Services', 'Process', 'Contact'], homeElements: [el('section', {}, { desktop: { padding: '180px 60px', backgroundColor: '#000' } }, [el('container', {}, { desktop: { maxWidth: '1000px' } }, [el('heading', { text: 'We build websites\nthat convert.', level: 'h1' }, { desktop: { fontSize: '68px', fontWeight: '700', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.04em' } }), el('button', { text: 'View Our Work', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', marginTop: '48px', letterSpacing: '0.08em', textTransform: 'uppercase' as any } })])], 'Hero'), imageGallery('Selected Projects', [{ src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', alt: 'Web 1' }, { src: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop', alt: 'Web 2' }, { src: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop', alt: 'Web 3' }])], aboutHeading: 'Design-Led\nDevelopment', aboutDesc: 'We create websites that look incredible and perform even better.', aboutImg: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Conversion', desc: 'Design optimised for results.' }, { title: 'Performance', desc: '95+ Lighthouse scores as standard.' }, { title: 'Partnership', desc: 'Long-term relationships, not projects.' }], servicesTitle: 'Our Services', services: [{ name: 'Web Design', desc: 'Pixel-perfect responsive websites built for conversion.', imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop' }, { name: 'E-commerce', desc: 'High-converting online stores on Shopify and custom platforms.', imgUrl: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=600&fit=crop' }, { name: 'Web Applications', desc: 'Custom SaaS products and internal tools.', imgUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop' }], page4: { name: 'Process', slug: '/process', elements: [withAnim(premiumFeatures('Our Process', 'Three phases. One extraordinary outcome.', [{ title: '01 — Discover', desc: 'Deep-dive into your brand, audience, and objectives.' }, { title: '02 — Design', desc: 'Pixel-perfect mockups with unlimited revisions.' }, { title: '03 — Develop', desc: 'Clean, performant code scoring 95+ Lighthouse.' }]), ANIM_FADE_UP)] } })),

  makeTemplate('pr-agency', 'PR & Communications', 'Elegant dark PR firm', 'Agency', [premiumNav('Whitmore', ['Services', 'Clients', 'Press', 'Contact'], 'dark'), splitHero('Shaping\nPerception', 'Strategic communications for global brands.', 'Enquire', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=900&fit=crop'), premiumFoot('Whitmore PR')], autoPages({ brand: 'Whitmore', links: ['Services', 'Clients', 'Press', 'Contact'], homeElements: [splitHero('Shaping\nPerception', 'Strategic communications for global brands and startups.', 'Enquire', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=900&fit=crop'), withAnim(premiumFeatures('Our Expertise', 'Comprehensive communications strategy.', [{ title: 'Media Relations', desc: 'Securing features in Vogue, Forbes, and The Times.' }, { title: 'Crisis Management', desc: 'Protecting reputations when stakes are highest.' }, { title: 'Brand Storytelling', desc: 'Compelling narratives that resonate and endure.' }]), ANIM_REVEAL), withAnim(premiumTestimonials([{ quote: 'Whitmore secured us features in Vogue, Forbes, and The Times.', name: 'Alexandra Moore', role: 'CEO, Lumière Beauty' }]), ANIM_FADE_UP)], aboutHeading: 'The Power of\nNarrative', aboutDesc: 'For 25 years, Whitmore has shaped perception for the world\'s leading brands.', aboutImg: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Relationships', desc: 'Deep media relationships built over decades.' }, { title: 'Strategy', desc: 'Insight-driven campaigns that cut through noise.' }, { title: 'Results', desc: 'Measurable impact on brand perception.' }], servicesTitle: 'Our Services', services: [{ name: 'Media Relations', desc: 'Press strategy, media training, and placement.', imgUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=600&fit=crop' }, { name: 'Crisis Communications', desc: 'Rapid response and reputation protection.', imgUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop' }, { name: 'Content Strategy', desc: 'Thought leadership, social media, and branded content.', imgUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop' }], page4: { name: 'Press', slug: '/press', elements: [withAnim(premiumFeatures('Recent Coverage', 'Our clients in the press.', [{ title: 'Forbes — "Top 10 Brands to Watch"', desc: 'Client feature on innovative brand strategies.' }, { title: 'Vogue — "The Future of Fashion"', desc: 'Major spread on sustainable fashion client.' }, { title: 'Financial Times — "Tech Disruptors"', desc: 'In-depth profile of fintech client.' }]), ANIM_FADE_UP)] } })),

  // TECHNOLOGY (2)
  makeTemplate('ai-company', 'AI & Machine Learning', 'Dark cutting-edge AI company', 'Technology', [premiumNav('NeuralArc', ['Products', 'Research', 'Careers', 'Contact'], 'dark'), el('section', {}, { desktop: { padding: '180px 60px', backgroundColor: '#000', position: 'relative', overflow: 'hidden' } }, [el('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)' } }), el('container', {}, { desktop: { position: 'relative', maxWidth: '900px' } }, [el('heading', { text: 'Intelligence.\nAmplified.', level: 'h1' }, { desktop: { fontSize: '76px', fontWeight: '700', color: '#fff', lineHeight: '1.02', letterSpacing: '-0.04em' } }), el('button', { text: 'Request Demo', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', marginTop: '40px' } })])], 'Hero'), premiumFoot('NeuralArc AI')], autoPages({ brand: 'NeuralArc', links: ['Products', 'Research', 'Careers', 'Contact'], homeElements: [el('section', {}, { desktop: { padding: '180px 60px', backgroundColor: '#000', position: 'relative', overflow: 'hidden' } }, [el('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.08) 0%, transparent 70%)' } }), el('container', {}, { desktop: { position: 'relative', maxWidth: '900px' } }, [el('heading', { text: 'Intelligence.\nAmplified.', level: 'h1' }, { desktop: { fontSize: '76px', fontWeight: '700', color: '#fff', lineHeight: '1.02', letterSpacing: '-0.04em' } }), el('text', { text: 'Enterprise AI solutions that transform operations.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.4)', marginTop: '28px' } }), el('button', { text: 'Request Demo', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', marginTop: '40px' } })])], 'Hero'), withAnim(premiumStats([{ value: '10B+', label: 'Parameters' }, { value: '99.7%', label: 'Accuracy' }, { value: '50ms', label: 'Latency' }], { border: true }), ANIM_FADE_UP)], aboutHeading: 'Pioneering\nIntelligence', aboutDesc: 'NeuralArc builds AI systems that understand, reason, and act.', aboutImg: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Research', desc: 'Publishing peer-reviewed papers at top conferences.' }, { title: 'Responsible AI', desc: 'Ethical AI development as a core principle.' }, { title: 'Scale', desc: 'Models trained on 10B+ parameters.' }], servicesTitle: 'Our Products', services: [{ name: 'NLP Suite', desc: 'Document analysis, summarization, and generation in 40+ languages.', imgUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop' }, { name: 'Computer Vision', desc: 'Real-time image recognition and video analysis.', imgUrl: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&h=600&fit=crop' }, { name: 'Predictive Analytics', desc: 'Forecasting models that drive better decisions.', imgUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop' }], page4: { name: 'Research', slug: '/research', elements: [withAnim(premiumFeatures('Latest Research', 'Pushing the boundaries of AI.', [{ title: 'Foundation Models', desc: 'Training 100B parameter models for general reasoning.' }, { title: 'Multimodal AI', desc: 'Combining text, image, and audio understanding.' }, { title: 'AI Safety', desc: 'Alignment research and interpretability studies.' }]), ANIM_FADE_UP)] } })),

  makeTemplate('cybersecurity', 'Cybersecurity', 'Dark trust-focused security', 'Technology', [premiumNav('ShieldOps', ['Solutions', 'Threat Intel', 'Resources', 'Contact'], 'dark'), splitHero('Your Digital\nFortress', 'Comprehensive cybersecurity protecting critical assets. 24/7/365.', 'Get Protected', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=900&fit=crop'), premiumFoot('ShieldOps Security')], autoPages({ brand: 'ShieldOps', links: ['Solutions', 'Threat Intel', 'Resources', 'Contact'], homeElements: [splitHero('Your Digital\nFortress', 'Comprehensive cybersecurity. 24/7/365 monitoring.', 'Get Protected', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=900&fit=crop'), withAnim(premiumStats([{ value: '0', label: 'Breaches' }, { value: '500+', label: 'Clients' }, { value: '10M+', label: 'Threats Blocked Daily' }], { border: true }), ANIM_FADE_UP), withAnim(premiumFeatures('Security Solutions', 'Multi-layered protection.', [{ title: 'Threat Detection', desc: '24/7 SOC monitoring with AI-powered identification.' }, { title: 'Incident Response', desc: 'Rapid containment, forensics, and recovery.' }, { title: 'Compliance', desc: 'SOC2, GDPR, HIPAA, PCI-DSS, ISO 27001.' }]), ANIM_REVEAL)], aboutHeading: 'Defending the\nDigital World', aboutDesc: 'ShieldOps has protected over 500 organizations from cyber threats.', aboutImg: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Zero Breaches', desc: 'Perfect track record across all clients.' }, { title: '24/7 SOC', desc: 'Round-the-clock security operations centre.' }, { title: 'Certified', desc: 'CREST, CHECK, and ISO 27001 certified.' }], servicesTitle: 'Our Solutions', services: [{ name: 'Managed Detection', desc: '24/7 monitoring, threat hunting, and response.', imgUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop' }, { name: 'Penetration Testing', desc: 'Comprehensive security assessments and red teaming.', imgUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop' }, { name: 'Security Training', desc: 'Phishing simulation and awareness programmes.', imgUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop' }], page4: { name: 'Threat Intel', slug: '/threat-intel', elements: [withAnim(premiumFeatures('Threat Landscape', 'Current intelligence.', [{ title: 'Ransomware Trends', desc: 'Ransomware attacks up 150% this quarter.' }, { title: 'Phishing Evolution', desc: 'AI-generated phishing now 40% of attacks.' }, { title: 'Zero-Day Watch', desc: 'Active monitoring for emerging vulnerabilities.' }]), ANIM_FADE_UP)] } })),

  // HOSPITALITY (3)
  makeTemplate('hotel', 'Luxury Hotel', 'Five-star dark hotel', 'Hospitality', [premiumNav('The Grand', ['Rooms', 'Dining', 'Spa', 'Book'], 'dark'), fullBleedHero('An Unforgettable\nStay', 'Five-star luxury in Mayfair since 1892.', 'Book Your Stay', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.35)' }), premiumFoot('The Grand Hotel')], autoPages({ brand: 'The Grand', links: ['Rooms', 'Dining', 'Spa', 'Book'], homeElements: [fullBleedHero('An Unforgettable\nStay', 'Five-star luxury in Mayfair since 1892.', 'Book Your Stay', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.35)' }), withAnim(imageTextRow('Luxury\nSuites', 'Elegantly appointed rooms with panoramic views and butler service.', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop'), ANIM_TILT), withAnim(imageTextRow('The Restaurant', 'Two Michelin-starred dining with seasonal British cuisine.', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop', { reverse: true }), ANIM_TILT)], aboutHeading: 'A Legacy of\nLuxury', aboutDesc: 'The Grand has welcomed discerning guests for over 130 years.', aboutImg: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Heritage', desc: 'Grade I listed landmark since 1892.' }, { title: 'Service', desc: 'Dedicated butler for every suite.' }, { title: 'Location', desc: 'Heart of Mayfair, steps from Hyde Park.' }], servicesTitle: 'Experiences', services: [{ name: 'Rooms & Suites', desc: 'Elegantly appointed accommodations with city views.', imgUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=600&fit=crop' }, { name: 'Fine Dining', desc: 'Two Michelin-starred restaurant and cocktail lounge.', imgUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop' }, { name: 'Wellness Spa', desc: 'Full-service spa with indoor pool and hammam.', imgUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=800&h=600&fit=crop' }], page4: { name: 'Rooms', slug: '/rooms', elements: [withAnim(premiumPricing([{ name: 'Classic Room', price: '£450/night', features: 'King bed\nCity view\nBreakfast included\n24hr room service' }, { name: 'Grand Suite', price: '£1,200/night', features: 'Living room\nPanoramic view\nButler service\nSpa access\nBreakfast', popular: true }, { name: 'Royal Penthouse', price: '£3,500/night', features: 'Private terrace\n360° view\nDedicated butler\nChauffeured car\nSpa & dining' }]), ANIM_FADE_UP)] } })),

  makeTemplate('spa-retreat', 'Spa & Retreat', 'Tranquil dark wellness', 'Hospitality', [premiumNav('Tranquil Waters', ['Treatments', 'Packages', 'Facilities', 'Book'], 'dark'), fullBleedHero('Escape.\nRestore.\nRenew.', 'A sanctuary in 40 acres of English countryside.', 'Book Retreat', 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.35)' }), premiumFoot('Tranquil Waters')], autoPages({ brand: 'Tranquil Waters', links: ['Treatments', 'Packages', 'Facilities', 'Book'], homeElements: [fullBleedHero('Escape.\nRestore.\nRenew.', 'A sanctuary in 40 acres of countryside.', 'Book Retreat', 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.35)' }), withAnim(premiumFeatures('Treatments', 'Restorative therapies for body and mind.', [{ title: 'Massage', desc: 'Swedish, deep tissue, hot stone, and aromatherapy.' }, { title: 'Facials', desc: 'Anti-ageing and rejuvenation using organic botanicals.' }, { title: 'Hydrotherapy', desc: 'Thermal pools, ice plunge, and sauna circuit.' }]), ANIM_REVEAL)], aboutHeading: 'A Place of\nStillness', aboutDesc: 'Nestled in the English countryside, a sanctuary dedicated to wellbeing.', aboutImg: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Holistic', desc: 'Mind, body, and spirit in harmony.' }, { title: 'Natural', desc: 'Organic products sourced from local botanicals.' }, { title: 'Exclusive', desc: 'Limited guest numbers for ultimate tranquility.' }], servicesTitle: 'Our Treatments', services: [{ name: 'Body Treatments', desc: 'Massage, body wraps, and exfoliation rituals.', imgUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6e?w=800&h=600&fit=crop' }, { name: 'Facial Therapies', desc: 'Advanced skincare using organic British ingredients.', imgUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop' }, { name: 'Wellness Programs', desc: 'Multi-day retreats for deep restoration and renewal.', imgUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop' }], page4: { name: 'Packages', slug: '/packages', elements: [withAnim(premiumPricing([{ name: 'Day Spa', price: '£150', features: '1 treatment\nPool & sauna\nLunch included' }, { name: 'Weekend', price: '£550', features: '2 nights\n3 treatments\nFull board\nAll facilities', popular: true }, { name: 'Week Retreat', price: '£1,800', features: '7 nights\nDaily treatments\nYoga & meditation\nNutrition plan' }]), ANIM_FADE_UP)] } })),

  makeTemplate('event-venue', 'Event Venue', 'Dark premium event spaces', 'Hospitality', [premiumNav('The Forum', ['Spaces', 'Events', 'Catering', 'Book'], 'dark'), fullBleedHero('Where Ideas\nCome Together', 'Premium event spaces for conferences and celebrations.', 'View Spaces', 'https://images.unsplash.com/photo-1540575467063-178a50e2fd60?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.5)' }), premiumFoot('The Forum Events')], autoPages({ brand: 'The Forum', links: ['Spaces', 'Events', 'Catering', 'Book'], homeElements: [fullBleedHero('Where Ideas\nCome Together', 'Premium event spaces in central London.', 'View Spaces', 'https://images.unsplash.com/photo-1540575467063-178a50e2fd60?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.5)' }), withAnim(premiumFeatures('Our Spaces', 'Versatile venues for every occasion.', [{ title: 'Grand Hall', desc: '500-capacity venue for conferences and galas.' }, { title: 'Boardroom Suite', desc: 'Executive meeting rooms for 10-30 attendees.' }, { title: 'Garden Terrace', desc: 'Outdoor space for summer receptions.' }]), ANIM_REVEAL), withAnim(premiumStats([{ value: '1,000+', label: 'Events' }, { value: '4.9★', label: 'Rating' }, { value: '10+', label: 'Venues' }]), ANIM_FADE_UP)], aboutHeading: 'Creating\nExperiences', aboutDesc: 'The Forum has hosted London\'s most prestigious events since 2005.', aboutImg: 'https://images.unsplash.com/photo-1540575467063-178a50e2fd60?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Versatility', desc: 'Spaces that adapt to any event format.' }, { title: 'Technology', desc: 'State-of-the-art AV and event tech.' }, { title: 'Service', desc: 'Dedicated event managers for every booking.' }], servicesTitle: 'Event Types', services: [{ name: 'Conferences', desc: 'Full-service conference venues with AV and catering.', imgUrl: 'https://images.unsplash.com/photo-1540575467063-178a50e2fd60?w=800&h=600&fit=crop' }, { name: 'Private Events', desc: 'Weddings, parties, and milestone celebrations.', imgUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=600&fit=crop' }, { name: 'Corporate', desc: 'Team building, away days, and product launches.', imgUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop' }], page4: { name: 'Catering', slug: '/catering', elements: [withAnim(premiumFeatures('Catering Menus', 'Food that impresses.', [{ title: 'Canapé Reception', desc: 'Elegant bite-size treats for drinks receptions.' }, { title: 'Seated Dinner', desc: 'Three-course fine dining for formal events.' }, { title: 'Buffet', desc: 'Casual, generous spreads for social events.' }]), ANIM_FADE_UP)] } })),

  // NONPROFIT (2)
  makeTemplate('charity', 'Charity & Nonprofit', 'Impact-driven dark charity', 'Nonprofit', [premiumNav('HopeForward', ['Our Work', 'Impact', 'Get Involved', 'Donate'], 'dark'), fullBleedHero('Building\nBrighter Futures', 'Empowering communities through education and healthcare.', 'Donate Now', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.45)' }), premiumFoot('HopeForward Foundation')], autoPages({ brand: 'HopeForward', links: ['Our Work', 'Impact', 'Get Involved', 'Donate'], homeElements: [fullBleedHero('Building\nBrighter Futures', 'Empowering communities across 45 countries.', 'Donate Now', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.45)' }), withAnim(premiumStats([{ value: '2M+', label: 'Lives Impacted' }, { value: '45', label: 'Countries' }, { value: '95p', label: 'Per £1 to Programs' }]), ANIM_FADE_UP), withAnim(imageTextRow('Education\nPrograms', 'Building schools and providing scholarships worldwide.', 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop'), ANIM_TILT)], aboutHeading: 'Hope in\nAction', aboutDesc: 'Since 2005, we\'ve been empowering communities to build brighter futures.', aboutImg: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Transparency', desc: '95p of every £1 goes directly to programs.' }, { title: 'Community-Led', desc: 'Programs designed with local communities.' }, { title: 'Sustainable', desc: 'Building long-term capacity, not dependency.' }], servicesTitle: 'Our Programs', services: [{ name: 'Education', desc: 'Building schools and training teachers in underserved communities.', imgUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop' }, { name: 'Clean Water', desc: 'Installing wells and purification systems for safe drinking water.', imgUrl: 'https://images.unsplash.com/photo-1541544537156-7627a7a4aa1c?w=800&h=600&fit=crop' }, { name: 'Healthcare', desc: 'Mobile clinics and community health workers in remote areas.', imgUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=600&fit=crop' }], page4: { name: 'Get Involved', slug: '/get-involved', elements: [withAnim(premiumFeatures('How You Can Help', 'Every action makes a difference.', [{ title: 'Donate', desc: 'Monthly or one-time donations that fund vital programs.' }, { title: 'Volunteer', desc: 'Join our overseas and local volunteer programs.' }, { title: 'Fundraise', desc: 'Start your own fundraiser with our toolkit.' }]), ANIM_FADE_UP)] } })),

  makeTemplate('environmental', 'Environmental NGO', 'Dark climate action', 'Nonprofit', [premiumNav('GreenEarth', ['Campaigns', 'Research', 'Take Action', 'Donate'], 'dark'), fullBleedHero('Protect\nOur Planet', 'Frontline action on climate change and ocean pollution.', 'Take Action', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,20,0,0.5)' }), premiumFoot('GreenEarth International')], autoPages({ brand: 'GreenEarth', links: ['Campaigns', 'Research', 'Take Action', 'Donate'], homeElements: [fullBleedHero('Protect\nOur Planet', 'Frontline action on climate change.', 'Take Action', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,20,0,0.5)' }), withAnim(premiumStats([{ value: '500K', label: 'Acres Protected' }, { value: '1.2M', label: 'Trees Planted' }, { value: '100+', label: 'Species Saved' }]), ANIM_FADE_UP), withAnim(premiumFeatures('Our Campaigns', 'Direct action where it matters.', [{ title: 'Zero Deforestation', desc: 'Ending illegal logging and protecting forests.' }, { title: 'Ocean Cleanup', desc: 'Removing plastic and restoring marine ecosystems.' }, { title: 'Clean Energy', desc: 'Campaigning for 100% renewable energy by 2035.' }]), ANIM_REVEAL)], aboutHeading: 'Defending\nNature', aboutDesc: 'GreenEarth has been on the frontlines of environmental protection since 1990.', aboutImg: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Science-Based', desc: 'Evidence-driven campaigns and policy.' }, { title: 'Direct Action', desc: 'On-the-ground protection of critical ecosystems.' }, { title: 'Global Network', desc: 'Offices in 40 countries worldwide.' }], servicesTitle: 'Our Work', services: [{ name: 'Forest Protection', desc: 'Preserving ancient forests and biodiversity hotspots.', imgUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop' }, { name: 'Ocean Conservation', desc: 'Plastic removal and marine protected areas.', imgUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop' }, { name: 'Climate Advocacy', desc: 'Policy campaigns for rapid decarbonisation.', imgUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&h=600&fit=crop' }], page4: { name: 'Research', slug: '/research', elements: [withAnim(premiumFeatures('Latest Research', 'Peer-reviewed science driving our campaigns.', [{ title: 'Amazon Deforestation Report', desc: 'New data shows 40% increase in illegal logging.' }, { title: 'Ocean Plastic Study', desc: 'Microplastics found in 90% of tested fish species.' }, { title: 'Renewable Energy Roadmap', desc: 'How the UK can reach net-zero by 2035.' }]), ANIM_FADE_UP)] } })),

  // PROFESSIONAL (3)
  makeTemplate('accounting', 'Accounting Firm', 'Professional dark accounting', 'Professional', [premiumNav('Carter & Blake', ['Services', 'Industries', 'Team', 'Contact'], 'dark'), splitHero('Numbers You\nCan Trust', 'Chartered accountants providing strategic financial guidance.', 'Book Consultation', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=900&fit=crop'), premiumFoot('Carter & Blake')], autoPages({ brand: 'Carter & Blake', links: ['Services', 'Industries', 'Team', 'Contact'], homeElements: [splitHero('Numbers You\nCan Trust', 'Chartered accountants providing clarity and guidance.', 'Book Consultation', 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=900&fit=crop'), withAnim(premiumFeatures('Our Services', 'Comprehensive financial expertise.', [{ title: 'Tax Planning', desc: 'Strategic advice to minimise liability legally.' }, { title: 'Audit & Assurance', desc: 'Independent audits for stakeholder confidence.' }, { title: 'Advisory', desc: 'Business planning and growth strategy.' }]), ANIM_REVEAL)], aboutHeading: 'Trusted Since\n1982', aboutDesc: 'Three generations of chartered accountants serving businesses of all sizes.', aboutImg: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Integrity', desc: 'Transparent, honest financial advice.' }, { title: 'Expertise', desc: 'Chartered with decades of experience.' }, { title: 'Proactive', desc: 'Tax-saving advice before you ask.' }], servicesTitle: 'Our Services', services: [{ name: 'Tax & Compliance', desc: 'Corporation tax, VAT, and personal tax returns.', imgUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop' }, { name: 'Audit', desc: 'Statutory audits and internal audit services.', imgUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop' }, { name: 'Business Advisory', desc: 'Cash flow forecasting, business planning, and M&A support.', imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop' }], page4: { name: 'Industries', slug: '/industries', elements: [withAnim(premiumFeatures('Industries We Serve', 'Sector-specific expertise.', [{ title: 'Technology', desc: 'R&D tax credits, SaaS metrics, and startup advisory.' }, { title: 'Property', desc: 'Capital gains, stamp duty, and portfolio structuring.' }, { title: 'Healthcare', desc: 'CQC compliance, NHS contracts, and practice accounts.' }]), ANIM_FADE_UP)] } })),

  makeTemplate('recruitment', 'Recruitment Agency', 'Dark talent acquisition', 'Professional', [premiumNav('TalentBridge', ['Employers', 'Candidates', 'Sectors', 'About'], 'dark'), splitHero('Connecting Talent\nwith Opportunity', 'Specialist recruitment across technology, finance, and engineering.', 'Post a Job', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=900&fit=crop'), premiumFoot('TalentBridge')], autoPages({ brand: 'TalentBridge', links: ['Employers', 'Candidates', 'Sectors', 'Contact'], homeElements: [splitHero('Connecting Talent\nwith Opportunity', 'Specialist recruitment globally.', 'Post a Job', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=900&fit=crop'), withAnim(premiumStats([{ value: '10K+', label: 'Placements' }, { value: '500+', label: 'Partners' }, { value: '92%', label: 'Retention' }], { border: true }), ANIM_FADE_UP)], aboutHeading: 'Building Teams\nThat Win', aboutDesc: 'TalentBridge connects exceptional people with exceptional companies.', aboutImg: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Deep Networks', desc: 'Access to passive candidates others can\'t reach.' }, { title: 'Speed', desc: 'Average time-to-fill of 21 days.' }, { title: 'Quality', desc: '92% first-year retention rate.' }], servicesTitle: 'How We Help', services: [{ name: 'Permanent Recruitment', desc: 'End-to-end hiring for critical roles.', imgUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop' }, { name: 'Contract Staffing', desc: 'Flexible talent for project-based needs.', imgUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop' }, { name: 'Executive Search', desc: 'C-suite and board-level appointments.', imgUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop' }], page4: { name: 'Sectors', slug: '/sectors', elements: [withAnim(premiumFeatures('Our Sectors', 'Deep industry expertise.', [{ title: 'Technology', desc: 'Engineers, data scientists, PMs, and CTOs.' }, { title: 'Finance', desc: 'Analysts, traders, and compliance professionals.' }, { title: 'Engineering', desc: 'Civil, mechanical, and renewable energy.' }]), ANIM_FADE_UP)] } })),

  makeTemplate('insurance', 'Insurance Broker', 'Dark trust-focused insurance', 'Professional', [premiumNav('SecureShield', ['Personal', 'Business', 'Claims', 'Contact'], 'dark'), splitHero('Protection You\nCan Rely On', 'Independent insurance advice tailored to your needs.', 'Get a Quote', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=900&fit=crop'), premiumFoot('SecureShield')], autoPages({ brand: 'SecureShield', links: ['Personal', 'Business', 'Claims', 'Contact'], homeElements: [splitHero('Protection You\nCan Rely On', 'Independent insurance advice.', 'Get a Quote', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=900&fit=crop'), withAnim(premiumFeatures('Our Cover', 'Comprehensive protection.', [{ title: 'Home Insurance', desc: 'Buildings and contents for peace of mind.' }, { title: 'Business Insurance', desc: 'Liability, property, cyber, and professional indemnity.' }, { title: 'Life Insurance', desc: 'Protecting your family\'s financial future.' }]), ANIM_REVEAL), withAnim(premiumTestimonials([{ quote: 'Saved us £3,000 on our business insurance.', name: 'Peter Walsh', role: 'MD, Walsh Engineering' }]), ANIM_FADE_UP)], aboutHeading: 'Independent\nAdvice You Trust', aboutDesc: 'SecureShield has been protecting families and businesses since 1995.', aboutImg: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Independent', desc: 'We compare the whole market for the best deal.' }, { title: 'Personal', desc: 'Dedicated advisor who knows your situation.' }, { title: 'Claims Support', desc: 'We fight your corner when you need to claim.' }], servicesTitle: 'Insurance Products', services: [{ name: 'Personal Insurance', desc: 'Home, car, travel, and life insurance.', imgUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop' }, { name: 'Business Insurance', desc: 'Comprehensive cover for businesses of all sizes.', imgUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop' }, { name: 'Specialist Cover', desc: 'High-value, landlord, and niche industry insurance.', imgUrl: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&h=600&fit=crop' }], page4: { name: 'Claims', slug: '/claims', elements: [withAnim(premiumFeatures('Claims Process', 'We make claiming easy.', [{ title: '1. Report', desc: 'Call or submit online 24/7.' }, { title: '2. We Handle It', desc: 'Your dedicated advisor manages the entire process.' }, { title: '3. Resolution', desc: 'Fast, fair settlement of your claim.' }]), ANIM_FADE_UP)] } })),

  // LIFESTYLE (3)
  makeTemplate('travel', 'Travel & Tourism', 'Inspirational dark travel', 'Lifestyle', [premiumNav('Wanderlust', ['Destinations', 'Trips', 'About', 'Book'], 'dark'), fullBleedHero('Adventure\nAwaits', 'Curated travel to breathtaking destinations.', 'Explore Trips', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.3)' }), premiumFoot('Wanderlust Journeys')], autoPages({ brand: 'Wanderlust', links: ['Destinations', 'Trips', 'About', 'Book'], homeElements: [fullBleedHero('Adventure\nAwaits', 'Curated travel to breathtaking destinations.', 'Explore Trips', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.3)' }), imageGallery('Popular Destinations', [{ src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', alt: 'Mountains' }, { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop', alt: 'Beach' }, { src: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop', alt: 'City' }])], aboutHeading: 'Travel With\nPurpose', aboutDesc: 'Creating transformative travel experiences since 2010.', aboutImg: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Expert Guides', desc: 'Local guides with deep cultural knowledge.' }, { title: 'Small Groups', desc: 'Intimate groups of 12 or fewer.' }, { title: 'Responsible', desc: 'Carbon-offset and community-positive travel.' }], servicesTitle: 'Trip Types', services: [{ name: 'Adventure Travel', desc: 'Trekking, diving, and wildlife expeditions.', imgUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop' }, { name: 'Cultural Immersion', desc: 'Deep-dive into local traditions and heritage.', imgUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop' }, { name: 'Luxury Escapes', desc: 'Five-star resorts and private experiences.', imgUrl: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&h=600&fit=crop' }], page4: { name: 'Destinations', slug: '/destinations', elements: [imageGallery('All Destinations', [{ src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', alt: 'Alps' }, { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&h=400&fit=crop', alt: 'Maldives' }, { src: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop', alt: 'Paris' }, { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop', alt: 'Patagonia' }, { src: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600&h=400&fit=crop', alt: 'Safari' }, { src: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&h=400&fit=crop', alt: 'Bali' }])] } })),

  makeTemplate('beauty-salon', 'Beauty Salon', 'Luxury dark beauty salon', 'Lifestyle', [premiumNav('Velvet', ['Services', 'Gallery', 'Team', 'Book'], 'dark'), splitHero('Beauty.\nElevated.', 'Premium beauty treatments in a design-led setting.', 'Book Appointment', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=900&fit=crop'), premiumFoot('Velvet Beauty')], autoPages({ brand: 'Velvet', links: ['Services', 'Gallery', 'Team', 'Book'], homeElements: [splitHero('Beauty.\nElevated.', 'Premium beauty treatments in a luxurious setting.', 'Book Appointment', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=900&fit=crop'), withAnim(premiumFeatures('Our Services', 'Comprehensive beauty and wellness.', [{ title: 'Hair Styling', desc: 'Cut, colour, balayage by award-winning stylists.' }, { title: 'Beauty', desc: 'Facials, lash lifts, microblading, and skin treatments.' }, { title: 'Nail Art', desc: 'Gel manicures, pedicures, and luxury hand rituals.' }]), ANIM_REVEAL), imageGallery('Our Work', [{ src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop', alt: 'Style 1' }, { src: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop', alt: 'Style 2' }, { src: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&h=400&fit=crop', alt: 'Style 3' }])], aboutHeading: 'Where Beauty\nMeets Art', aboutDesc: 'Velvet is a luxury beauty destination for those who appreciate excellence.', aboutImg: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Luxury', desc: 'Premium products and a stunning environment.' }, { title: 'Expertise', desc: 'Award-winning stylists and therapists.' }, { title: 'Relaxation', desc: 'A true escape from the everyday.' }], servicesTitle: 'Treatments', services: [{ name: 'Hair Services', desc: 'Precision cuts, luxury colour, and transformative treatments.', imgUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=600&fit=crop' }, { name: 'Skin & Beauty', desc: 'Advanced facials, lash extensions, and microblading.', imgUrl: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop' }, { name: 'Bridal Packages', desc: 'Complete wedding day beauty for you and your party.', imgUrl: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=800&h=600&fit=crop' }], page4: { name: 'Gallery', slug: '/gallery', elements: [imageGallery('Our Portfolio', [{ src: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&h=400&fit=crop', alt: 'Hair 1' }, { src: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&h=400&fit=crop', alt: 'Beauty 2' }, { src: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=600&h=400&fit=crop', alt: 'Bridal 3' }, { src: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop', alt: 'Salon 4' }])] } })),

  makeTemplate('pet-services', 'Pet Services', 'Dark premium pet care', 'Lifestyle', [premiumNav('Pawsome', ['Services', 'About', 'Gallery', 'Book'], 'dark'), splitHero('Happy Pets,\nHappy People', 'Premium pet grooming, daycare, and boarding.', 'Book Now', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=900&fit=crop'), premiumFoot('Pawsome')], autoPages({ brand: 'Pawsome', links: ['Services', 'About', 'Gallery', 'Book'], homeElements: [splitHero('Happy Pets,\nHappy People', 'Premium grooming, daycare, and boarding.', 'Book Now', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=900&fit=crop'), withAnim(premiumFeatures('Our Services', 'Everything your pet deserves.', [{ title: 'Grooming', desc: 'Full grooming, breed cuts, baths, and spa treatments.' }, { title: 'Daycare', desc: 'Supervised play and socialisation with webcam access.' }, { title: 'Boarding', desc: 'Luxury overnight suites with 24/7 vet care.' }]), ANIM_REVEAL), withAnim(premiumTestimonials([{ quote: 'Our dog loves Pawsome. Best decision we ever made!', name: 'Sarah & Tom', role: 'Pet Parents' }]), ANIM_FADE_UP)], aboutHeading: 'Because They\nDeserve the Best', aboutDesc: 'Pawsome provides premium pet care with genuine love and expertise.', aboutImg: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Safety', desc: 'Fully insured with 24/7 vet access.' }, { title: 'Love', desc: 'Genuine animal lovers on every shift.' }, { title: 'Quality', desc: 'Premium products and state-of-the-art facilities.' }], servicesTitle: 'Pet Services', services: [{ name: 'Grooming Salon', desc: 'Full-service grooming for all breeds.', imgUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop' }, { name: 'Daycare & Socialisation', desc: 'Supervised play in purpose-built facilities.', imgUrl: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop' }, { name: 'Luxury Boarding', desc: 'Home-from-home overnight care.', imgUrl: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=800&h=600&fit=crop' }], page4: { name: 'Gallery', slug: '/gallery', elements: [imageGallery('Happy Pets', [{ src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop', alt: 'Dog 1' }, { src: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop', alt: 'Dogs 2' }, { src: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=600&h=400&fit=crop', alt: 'Cat 3' }])] } })),

  // ENTERTAINMENT (2)
  makeTemplate('music-artist', 'Music Artist', 'Dark artist portfolio', 'Entertainment', [premiumNav('NOVA', ['Music', 'Tour', 'Videos', 'Merch'], 'dark'), fullBleedHero('MIDNIGHT\nFREQUENCIES', 'New album out now. Stream everywhere.', 'Listen Now', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.5)' }), premiumFoot('NOVA')], autoPages({ brand: 'NOVA', links: ['Music', 'Tour', 'Videos', 'Merch'], homeElements: [fullBleedHero('MIDNIGHT\nFREQUENCIES', 'New album out now. Stream everywhere.', 'Listen Now', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920&h=1080&fit=crop', { overlay: 'rgba(0,0,0,0.5)' }), imageGallery('Discography', [{ src: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=600&fit=crop', alt: 'Album 1' }, { src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=600&fit=crop', alt: 'Album 2' }, { src: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&h=600&fit=crop', alt: 'Album 3' }]), premiumCTA('World Tour 2026', 'Tickets on sale — 30 cities, 15 countries.', 'Get Tickets', { bg: '#0a0a0a' })], aboutHeading: 'The Sound\nof NOVA', aboutDesc: 'Blending electronic, indie, and cinematic soundscapes since 2018.', aboutImg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Authentic', desc: 'Every note written and produced by NOVA.' }, { title: 'Visual', desc: 'Music paired with striking visual storytelling.' }, { title: 'Live', desc: 'Immersive live performances with custom visuals.' }], servicesTitle: 'Latest Releases', services: [{ name: 'Midnight Frequencies', desc: '12-track album exploring connection and solitude.', imgUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop' }, { name: 'Echoes EP', desc: '5-track EP of ambient electronic experiments.', imgUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop' }, { name: 'Live at Red Rocks', desc: 'Full concert recording from the iconic venue.', imgUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop' }], page4: { name: 'Tour', slug: '/tour', elements: [withAnim(premiumFeatures('Tour Dates 2026', '30 cities. 15 countries.', [{ title: 'London — O2 Arena', desc: 'March 15, 2026 — SOLD OUT' }, { title: 'New York — MSG', desc: 'April 22, 2026 — On Sale Now' }, { title: 'Tokyo — Budokan', desc: 'May 10, 2026 — On Sale Now' }, { title: 'Berlin — Mercedes Arena', desc: 'June 5, 2026 — On Sale Now' }], { cols: 2 }), ANIM_FADE_UP)] } })),

  makeTemplate('podcast', 'Podcast', 'Dark podcast landing', 'Entertainment', [premiumNav('The Deep Dive', ['Episodes', 'About', 'Subscribe', 'Contact'], 'dark'), splitHero('Conversations\nThat Matter', 'Weekly long-form interviews with brilliant minds.', 'Listen Now', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=900&fit=crop'), premiumFoot('The Deep Dive')], autoPages({ brand: 'The Deep Dive', links: ['Episodes', 'About', 'Subscribe', 'Contact'], homeElements: [splitHero('Conversations\nThat Matter', 'Weekly long-form interviews with brilliant minds.', 'Listen Now', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=900&fit=crop'), withAnim(premiumStats([{ value: '2M+', label: 'Downloads' }, { value: '200+', label: 'Episodes' }, { value: '4.9★', label: 'Apple Podcasts' }], { border: true }), ANIM_FADE_UP), withAnim(premiumFeatures('Recent Episodes', 'New every Thursday.', [{ title: 'Ep 203: The Future of AI', desc: 'With Prof. Sarah Chen on consciousness and machine intelligence.' }, { title: 'Ep 202: Building in Public', desc: 'Founder stories from side project to $100M ARR.' }, { title: 'Ep 201: Climate Solutions', desc: 'Real innovations making a measurable impact.' }]), ANIM_REVEAL)], aboutHeading: 'Going Deeper\nSince 2019', aboutDesc: 'The Deep Dive explores the ideas and people shaping our future.', aboutImg: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=900&fit=crop', aboutValues: [{ title: 'Depth', desc: 'Long-form conversations that go beyond surface.' }, { title: 'Quality', desc: 'Research-backed questions and professional production.' }, { title: 'Community', desc: '100K+ engaged listeners worldwide.' }], servicesTitle: 'Popular Series', services: [{ name: 'Tech & Innovation', desc: 'Conversations with founders, engineers, and futurists.', imgUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=600&fit=crop' }, { name: 'Science & Research', desc: 'Making cutting-edge research accessible to everyone.', imgUrl: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=800&h=600&fit=crop' }, { name: 'Culture & Society', desc: 'Exploring the forces shaping modern culture.', imgUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop' }], page4: { name: 'Episodes', slug: '/episodes', elements: [withAnim(premiumFeatures('All Episodes', 'Browse our complete archive.', [{ title: 'Ep 203: The Future of AI', desc: 'Prof. Sarah Chen on consciousness and alignment.' }, { title: 'Ep 202: Building in Public', desc: 'From bootstrapped side project to $100M ARR.' }, { title: 'Ep 201: Climate Solutions', desc: 'Real innovations making measurable impact.' }, { title: 'Ep 200: Special Anniversary', desc: '200 episodes of deep conversations.' }], { cols: 2 }), ANIM_FADE_UP)] } })),
];

import { TEMPLATES_V2, TEMPLATE_CATEGORIES_V2 } from './templatesV2';
import { TEMPLATES_V3, TEMPLATE_CATEGORIES_V3 } from './templatesV3';
import { TEMPLATES_V4 } from './templatesV4';
import { TEMPLATES_V5 } from './templatesV5';

export const ALL_TEMPLATES: DesignerTemplate[] = [...TEMPLATES, ...TEMPLATES_V2, ...TEMPLATES_V3, ...TEMPLATES_V4, ...TEMPLATES_V5];

// ─── Template Categories for Marketplace ────────────────────────
export const TEMPLATE_CATEGORIES = [
  'All', 'Starter', 'Business', 'Real Estate', 'Fitness', 'Legal', 'Wedding',
  'Restaurant', 'Healthcare', 'Education', 'Creative', 'E-commerce', 'Agency',
  'Technology', 'Hospitality', 'Nonprofit', 'Professional', 'Lifestyle', 'Entertainment',
  'Finance', 'Health',
  ...TEMPLATE_CATEGORIES_V2.filter(c => !['Entertainment', 'Professional', 'Healthcare', 'Fitness', 'Nonprofit'].includes(c)),
  ...TEMPLATE_CATEGORIES_V3.filter(c => !TEMPLATE_CATEGORIES_V2.includes(c) && !['Creative', 'Technology', 'Real Estate', 'Fitness', 'Restaurant', 'Agency', 'Healthcare', 'Education'].includes(c)),
];
