import { DesignerTemplate, EditorElement, TemplatePage } from '../types';

let _c3 = 0;
function uid(): string {
  _c3++;
  return `tv3-${_c3}-${Math.random().toString(36).slice(2, 8)}`;
}

function el(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: uid(), type, name: name ?? type, props, styles, children };
}

// ── Animation presets ────────────────────────────────────────────
const ANIM_FADE_UP = { type: 'fadeInUp' as const, duration: 0.8, delay: 0, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
const ANIM_BLUR_IN = { type: 'blurIn' as const, duration: 1.2, delay: 0, trigger: 'onView' as const };
const ANIM_SCALE_IN = { type: 'scaleIn' as const, duration: 1, delay: 0.2, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };
const ANIM_REVEAL = { type: 'reveal' as const, duration: 0.8, delay: 0, trigger: 'onScroll' as const };
const ANIM_FADE_LEFT = { type: 'fadeInLeft' as const, duration: 0.9, delay: 0.1, trigger: 'onView' as const, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' };

function withAnim(element: EditorElement, anim: EditorElement['animations']): EditorElement {
  return { ...element, animations: anim };
}

// ── Shared building blocks ───────────────────────────────────────

function nav3(brand: string, links: string[], style: 'dark' | 'glass' | 'cream' = 'dark') {
  const bg = style === 'dark' ? '#000' : style === 'glass' ? 'rgba(0,0,0,0.6)' : '#FAF7F2';
  const fg = style === 'cream' ? '#2C2416' : '#fff';
  const linkColor = style === 'cream' ? '#8B7355' : 'rgba(255,255,255,0.55)';
  const border = style === 'cream' ? '1px solid #E8E0D4' : '1px solid rgba(255,255,255,0.06)';
  return el('navbar', { brand }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '22px 64px', width: '100%', backgroundColor: bg, borderBottom: border, backdropFilter: style === 'glass' ? 'blur(24px)' : undefined, position: style === 'glass' ? 'fixed' as any : undefined, top: style === 'glass' ? '0' : undefined, left: style === 'glass' ? '0' : undefined, right: style === 'glass' ? '0' : undefined, zIndex: style === 'glass' ? '100' : undefined }, mobile: { padding: '16px 24px' } }, [
    el('link', { text: brand, href: '/' }, { desktop: { fontSize: '17px', fontWeight: '700', color: fg, letterSpacing: '0.1em', textTransform: 'uppercase' as any, textDecoration: 'none' } }),
    el('container', {}, { desktop: { display: 'flex', gap: '36px', alignItems: 'center' }, mobile: { display: 'none' } }, links.map(l =>
      el('link', { text: l, href: `/${l.toLowerCase().replace(/\s+/g, '-')}` }, { desktop: { fontSize: '12px', color: linkColor, textDecoration: 'none', fontWeight: '500', letterSpacing: '0.04em', textTransform: 'uppercase' as any } })
    )),
  ], 'Navigation');
}

function foot3(brand: string, style: 'dark' | 'cream' = 'dark') {
  const bg = style === 'cream' ? '#2C2416' : '#000';
  const fg = style === 'cream' ? 'rgba(255,255,255,0.4)' : '#333';
  return el('footer', {}, { desktop: { padding: '64px', backgroundColor: bg, textAlign: 'center', width: '100%', borderTop: style === 'cream' ? 'none' : '1px solid #111' } }, [
    el('text', { text: `© 2026 ${brand}. All rights reserved.` }, { desktop: { color: fg, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
  ], 'Footer');
}

function heroSplit(heading: string, sub: string, cta: string, imgUrl: string, opts: { bg?: string; fg?: string; accent?: string; reverse?: boolean; badge?: string; ctaStyle?: 'filled' | 'outline' } = {}) {
  const bg = opts.bg || '#000';
  const fg = opts.fg || '#fff';
  const subColor = fg === '#fff' ? 'rgba(255,255,255,0.5)' : '#777';
  const ctaBg = opts.ctaStyle === 'outline' ? 'transparent' : (fg === '#fff' ? '#fff' : '#111');
  const ctaFg = opts.ctaStyle === 'outline' ? fg : (fg === '#fff' ? '#000' : '#fff');
  const ctaBorder = opts.ctaStyle === 'outline' ? `1px solid ${fg === '#fff' ? 'rgba(255,255,255,0.2)' : '#ccc'}` : 'none';
  return el('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '92vh', backgroundColor: bg }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
    el('container', {}, { desktop: { padding: '100px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', order: opts.reverse ? '1' : '0' }, mobile: { padding: '60px 24px' } }, [
      ...(opts.badge ? [withAnim(el('badge', { text: opts.badge }, { desktop: { padding: '6px 16px', backgroundColor: fg === '#fff' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', color: subColor, borderRadius: '2px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '24px', letterSpacing: '0.12em', border: fg === '#fff' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)' } }), ANIM_FADE_UP)] : []),
      withAnim(el('heading', { text: heading, level: 'h1' }, { desktop: { fontSize: '58px', fontWeight: '700', color: fg, lineHeight: '1.05', letterSpacing: '-0.035em', marginBottom: '24px' }, mobile: { fontSize: '36px' } }), ANIM_BLUR_IN),
      withAnim(el('text', { text: sub }, { desktop: { fontSize: '16px', color: subColor, lineHeight: '1.75', marginBottom: '40px', maxWidth: '420px' } }), { ...ANIM_FADE_UP, delay: 0.2 }),
      withAnim(el('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
        el('button', { text: cta, href: '#' }, { desktop: { padding: '17px 40px', backgroundColor: ctaBg, color: ctaFg, borderRadius: '0', fontSize: '12px', fontWeight: '600', border: ctaBorder, letterSpacing: '0.08em', textTransform: 'uppercase' as any, width: 'fit-content' } }),
      ]), { ...ANIM_FADE_UP, delay: 0.4 }),
    ]),
    el('container', {}, { desktop: { position: 'relative', overflow: 'hidden', order: opts.reverse ? '0' : '1' } }, [
      withAnim(el('image', { src: imgUrl, alt: 'Hero' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }), ANIM_SCALE_IN),
    ]),
  ], 'Hero');
}

function heroFull(heading: string, sub: string, cta: string, imgUrl: string, opts: { overlay?: string; gradient?: string; badge?: string } = {}) {
  return el('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', overflow: 'hidden' } }, [
    el('container', {}, { desktop: { position: 'absolute', inset: '0', backgroundColor: opts.overlay || 'rgba(0,0,0,0.5)', background: opts.gradient } }),
    el('container', {}, { desktop: { position: 'relative', zIndex: '1', textAlign: 'center', maxWidth: '860px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
      ...(opts.badge ? [withAnim(el('badge', { text: opts.badge }, { desktop: { padding: '8px 20px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderRadius: '2px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '28px', letterSpacing: '0.15em', border: '1px solid rgba(255,255,255,0.08)' } }), ANIM_FADE_UP)] : []),
      withAnim(el('heading', { text: heading, level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '700', color: '#fff', lineHeight: '1.04', letterSpacing: '-0.04em', marginBottom: '24px' }, mobile: { fontSize: '40px' } }), ANIM_BLUR_IN),
      withAnim(el('text', { text: sub }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.7', marginBottom: '44px', maxWidth: '560px', margin: '0 auto 44px' } }), { ...ANIM_FADE_UP, delay: 0.3 }),
      withAnim(el('container', {}, { desktop: { display: 'flex', gap: '14px', justifyContent: 'center' } }, [
        el('button', { text: cta, href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '12px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
        el('button', { text: 'Learn More', href: '/about' }, { desktop: { padding: '18px 48px', backgroundColor: 'transparent', color: '#fff', borderRadius: '0', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
      ]), { ...ANIM_FADE_UP, delay: 0.5 }),
    ]),
  ], 'Hero');
}

function features3(title: string, sub: string, items: { title: string; desc: string; icon?: string }[], opts: { bg?: string; fg?: string; cols?: number } = {}) {
  const bg = opts.bg || '#0a0a0a';
  const fg = opts.fg || '#fff';
  const cardBg = bg === '#0a0a0a' || bg === '#000' ? '#111' : bg === '#FAF7F2' ? '#fff' : '#f5f5f5';
  const subColor = fg === '#fff' ? 'rgba(255,255,255,0.45)' : '#888';
  const cardBorder = bg === '#0a0a0a' || bg === '#000' ? '1px solid #1a1a1a' : '1px solid #e8e0d4';
  return el('section', {}, { desktop: { padding: '120px 64px', backgroundColor: bg, width: '100%' }, mobile: { padding: '64px 24px' } }, [
    withAnim(el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', marginBottom: '64px' } }, [
      el('text', { text: title.toUpperCase() }, { desktop: { fontSize: '10px', color: subColor, letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: sub, level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: fg, letterSpacing: '-0.025em', lineHeight: '1.1', maxWidth: '600px' } }),
    ]), ANIM_FADE_UP),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${opts.cols || 3}, 1fr)`, gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } }, items.map((item, i) =>
      withAnim(el('card', {}, { desktop: { padding: '40px', backgroundColor: cardBg, borderRadius: '12px', border: cardBorder } }, [
        ...(item.icon ? [el('text', { text: item.icon }, { desktop: { fontSize: '28px', marginBottom: '20px' } })] : []),
        el('heading', { text: item.title, level: 'h3' }, { desktop: { fontSize: '17px', fontWeight: '700', color: fg, marginBottom: '10px' } }),
        el('text', { text: item.desc }, { desktop: { color: subColor, fontSize: '14px', lineHeight: '1.7' } }),
      ]), { ...ANIM_FADE_UP, delay: i * 0.08 })
    )),
  ], 'Features');
}

function stats3(items: { value: string; label: string }[], opts: { bg?: string; fg?: string } = {}) {
  const bg = opts.bg || '#000';
  const fg = opts.fg || '#fff';
  return withAnim(el('section', {}, { desktop: { padding: '80px 64px', backgroundColor: bg, borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '60px 24px' } }, [
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '40px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center', width: '100%' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, items.map(s =>
      el('container', {}, { desktop: {} }, [
        el('heading', { text: s.value, level: 'h2' }, { desktop: { fontSize: '50px', fontWeight: '700', color: fg, marginBottom: '8px', letterSpacing: '-0.03em' } }),
        el('text', { text: s.label }, { desktop: { fontSize: '11px', color: fg === '#fff' ? 'rgba(255,255,255,0.3)' : '#999', textTransform: 'uppercase' as any, letterSpacing: '0.12em', fontWeight: '600' } }),
      ])
    )),
  ], 'Stats'), ANIM_FADE_UP);
}

function testimonials3(items: { quote: string; name: string; role: string }[], opts: { bg?: string; fg?: string; title?: string } = {}) {
  const bg = opts.bg || '#0a0a0a';
  const fg = opts.fg || '#fff';
  const cardBg = bg === '#0a0a0a' ? '#111' : '#f7f7f7';
  return el('section', {}, { desktop: { padding: '120px 64px', backgroundColor: bg, width: '100%' }, mobile: { padding: '64px 24px' } }, [
    withAnim(el('heading', { text: opts.title || 'Client Testimonials', level: 'h2' }, { desktop: { fontSize: '11px', fontWeight: '700', color: fg === '#fff' ? 'rgba(255,255,255,0.3)' : '#999', textTransform: 'uppercase' as any, letterSpacing: '0.15em', marginBottom: '56px', maxWidth: '1200px', margin: '0 auto 56px' } }), ANIM_FADE_UP),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } }, items.map((t, i) =>
      withAnim(el('card', {}, { desktop: { padding: '40px', backgroundColor: cardBg, borderRadius: '12px', border: bg === '#0a0a0a' ? '1px solid #1a1a1a' : 'none' } }, [
        el('text', { text: `"${t.quote}"` }, { desktop: { fontSize: '15px', color: fg === '#fff' ? 'rgba(255,255,255,0.65)' : '#555', lineHeight: '1.75', marginBottom: '24px' } }),
        el('text', { text: t.name }, { desktop: { fontSize: '14px', fontWeight: '700', color: fg } }),
        el('text', { text: t.role }, { desktop: { fontSize: '12px', color: fg === '#fff' ? 'rgba(255,255,255,0.3)' : '#aaa', marginTop: '2px' } }),
      ]), { ...ANIM_FADE_UP, delay: i * 0.1 })
    )),
  ], 'Testimonials');
}

function cta3(heading: string, sub: string, btn: string, opts: { bg?: string; fg?: string } = {}) {
  const bg = opts.bg || '#000';
  const fg = opts.fg || '#fff';
  return withAnim(el('section', {}, { desktop: { padding: '120px 64px', backgroundColor: bg, textAlign: 'center', width: '100%' }, mobile: { padding: '80px 24px' } }, [
    el('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto' } }, [
      el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '46px', fontWeight: '700', color: fg, letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: '1.1' }, mobile: { fontSize: '30px' } }),
      el('text', { text: sub }, { desktop: { fontSize: '16px', color: fg === '#fff' ? 'rgba(255,255,255,0.45)' : '#777', marginBottom: '40px', lineHeight: '1.7' } }),
      el('button', { text: btn, href: '/contact' }, { desktop: { padding: '18px 48px', backgroundColor: fg, color: bg, borderRadius: '0', fontSize: '12px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
    ]),
  ], 'CTA'), ANIM_FADE_UP);
}

function contact3(opts: { bg?: string; fg?: string } = {}) {
  const bg = opts.bg || '#000';
  const fg = opts.fg || '#fff';
  const inputBg = bg === '#000' ? '#0a0a0a' : '#f5f5f5';
  const inputBorder = bg === '#000' ? '#1a1a1a' : '#e0e0e0';
  return el('section', {}, { desktop: { padding: '120px 64px', backgroundColor: bg, width: '100%' }, mobile: { padding: '64px 24px' } }, [
    el('container', {}, { desktop: { maxWidth: '560px', margin: '0 auto' } }, [
      withAnim(el('heading', { text: 'Get In Touch', level: 'h2' }, { desktop: { fontSize: '38px', fontWeight: '700', color: fg, marginBottom: '40px', letterSpacing: '-0.02em' } }), ANIM_FADE_UP),
      el('form', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
        el('input', { placeholder: 'Full Name', inputType: 'text' }, { desktop: { padding: '16px', borderRadius: '0', border: `1px solid ${inputBorder}`, fontSize: '14px', width: '100%', backgroundColor: inputBg, color: fg } }),
        el('input', { placeholder: 'Email Address', inputType: 'email' }, { desktop: { padding: '16px', borderRadius: '0', border: `1px solid ${inputBorder}`, fontSize: '14px', width: '100%', backgroundColor: inputBg, color: fg } }),
        el('input', { placeholder: 'Phone Number', inputType: 'tel' }, { desktop: { padding: '16px', borderRadius: '0', border: `1px solid ${inputBorder}`, fontSize: '14px', width: '100%', backgroundColor: inputBg, color: fg } }),
        el('textarea', { placeholder: 'Your message…' }, { desktop: { padding: '16px', borderRadius: '0', border: `1px solid ${inputBorder}`, fontSize: '14px', width: '100%', minHeight: '140px', backgroundColor: inputBg, color: fg } }),
        el('button', { text: 'Send Message', href: '#' }, { desktop: { padding: '18px 32px', backgroundColor: fg, color: bg, borderRadius: '0', fontSize: '12px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
      ]),
    ]),
  ], 'Contact');
}

function about3(heading: string, desc: string, imgUrl: string, values: { title: string; desc: string }[], opts: { bg?: string; fg?: string } = {}) {
  const bg = opts.bg || '#0a0a0a';
  const fg = opts.fg || '#fff';
  const subColor = fg === '#fff' ? 'rgba(255,255,255,0.45)' : '#777';
  const cardBg = bg === '#0a0a0a' ? '#111' : '#f5f5f5';
  return el('section', {}, { desktop: { backgroundColor: bg, width: '100%' } }, [
    withAnim(el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '600px' }, mobile: { gridTemplateColumns: '1fr' } }, [
      el('container', {}, { desktop: { padding: '100px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '60px 24px' } }, [
        el('text', { text: 'ABOUT US' }, { desktop: { fontSize: '10px', color: subColor, letterSpacing: '0.2em', marginBottom: '20px', fontWeight: '700' } }),
        withAnim(el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: fg, letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '24px' } }), ANIM_FADE_LEFT),
        el('text', { text: desc }, { desktop: { fontSize: '16px', color: subColor, lineHeight: '1.8', maxWidth: '440px' } }),
      ]),
      withAnim(el('container', {}, { desktop: { overflow: 'hidden' } }, [
        el('image', { src: imgUrl, alt: 'About' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ]), ANIM_SCALE_IN),
    ]), ANIM_REVEAL),
    el('container', {}, { desktop: { padding: '80px 64px', maxWidth: '1200px', margin: '0 auto' } }, [
      el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${values.length}, 1fr)`, gap: '24px' }, mobile: { gridTemplateColumns: '1fr' } }, values.map((v, i) =>
        withAnim(el('card', {}, { desktop: { padding: '32px', backgroundColor: cardBg, borderRadius: '8px', border: bg === '#0a0a0a' ? '1px solid #1a1a1a' : 'none' } }, [
          el('heading', { text: v.title, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '700', color: fg, marginBottom: '10px' } }),
          el('text', { text: v.desc }, { desktop: { fontSize: '13px', color: subColor, lineHeight: '1.7' } }),
        ]), { ...ANIM_FADE_UP, delay: i * 0.1 })
      )),
    ]),
  ], 'About');
}

function services3(title: string, services: { name: string; desc: string; imgUrl: string }[], opts: { bg?: string; fg?: string } = {}) {
  const bg = opts.bg || '#000';
  const fg = opts.fg || '#fff';
  const subColor = fg === '#fff' ? 'rgba(255,255,255,0.45)' : '#777';
  return el('section', {}, { desktop: { padding: '120px 64px', backgroundColor: bg, width: '100%' }, mobile: { padding: '64px 24px' } }, [
    withAnim(el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', marginBottom: '72px' } }, [
      el('text', { text: 'WHAT WE OFFER' }, { desktop: { fontSize: '10px', color: subColor, letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: fg, letterSpacing: '-0.03em', lineHeight: '1.1' } }),
    ]), ANIM_FADE_UP),
    el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2px' } }, services.map((s, i) =>
      withAnim(el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '400px', backgroundColor: bg === '#000' ? '#0a0a0a' : '#f5f5f5', overflow: 'hidden' }, mobile: { gridTemplateColumns: '1fr' } }, [
        el('container', {}, { desktop: { padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center', order: i % 2 === 0 ? '0' : '1' }, mobile: { padding: '40px 24px', order: '0' } }, [
          el('heading', { text: s.name, level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: fg, marginBottom: '16px', letterSpacing: '-0.02em' } }),
          el('text', { text: s.desc }, { desktop: { fontSize: '15px', color: subColor, lineHeight: '1.8' } }),
        ]),
        el('container', {}, { desktop: { overflow: 'hidden', order: i % 2 === 0 ? '1' : '0' }, mobile: { order: '1' } }, [
          withAnim(el('image', { src: s.imgUrl, alt: s.name }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }), ANIM_SCALE_IN),
        ]),
      ]), { ...ANIM_FADE_UP, delay: i * 0.15 })
    )),
  ], 'Services');
}

function gallery3(title: string, images: { src: string; alt: string }[], opts: { bg?: string; cols?: number } = {}) {
  const bg = opts.bg || '#000';
  return el('section', {}, { desktop: { padding: '120px 64px', backgroundColor: bg, width: '100%' }, mobile: { padding: '64px 24px' } }, [
    withAnim(el('heading', { text: title }, { desktop: { fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as any, letterSpacing: '0.15em', marginBottom: '48px', maxWidth: '1200px', margin: '0 auto 48px' } }), ANIM_FADE_UP),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${opts.cols || 3}, 1fr)`, gap: '8px', maxWidth: '1200px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, images.map((img, i) =>
      withAnim(el('image', { src: img.src, alt: img.alt }, { desktop: { width: '100%', height: '320px', objectFit: 'cover', display: 'block' } }), { ...ANIM_FADE_UP, delay: i * 0.06 })
    )),
  ], 'Gallery');
}

function pricing3(plans: { name: string; price: string; period?: string; features: string; popular?: boolean }[], opts: { bg?: string; fg?: string } = {}) {
  const bg = opts.bg || '#0a0a0a';
  const fg = opts.fg || '#fff';
  return el('section', {}, { desktop: { padding: '120px 64px', backgroundColor: bg, width: '100%' }, mobile: { padding: '64px 24px' } }, [
    withAnim(el('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', marginBottom: '64px', textAlign: 'center' } }, [
      el('text', { text: 'PRICING' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
      el('heading', { text: 'Choose Your Plan', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: fg, letterSpacing: '-0.025em' } }),
    ]), ANIM_FADE_UP),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${plans.length}, 1fr)`, gap: '16px', maxWidth: '1100px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } }, plans.map((p, i) =>
      withAnim(el('card', {}, { desktop: { padding: '44px', borderRadius: '12px', border: p.popular ? '1px solid rgba(255,255,255,0.15)' : '1px solid #1a1a1a', backgroundColor: p.popular ? '#111' : 'transparent' } }, [
        ...(p.popular ? [el('badge', { text: 'MOST POPULAR' }, { desktop: { padding: '4px 12px', backgroundColor: '#fff', color: '#000', borderRadius: '2px', fontSize: '9px', fontWeight: '700', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.1em' } })] : []),
        el('heading', { text: p.name, level: 'h3' }, { desktop: { fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: fg, letterSpacing: '0.02em' } }),
        el('heading', { text: p.price, level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: fg, marginBottom: '4px', letterSpacing: '-0.03em' } }),
        ...(p.period ? [el('text', { text: p.period }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '24px' } })] : [el('spacer', {}, { desktop: { height: '24px' } })]),
        el('text', { text: p.features }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '2.2', whiteSpace: 'pre-line', marginBottom: '32px' } }),
        el('button', { text: 'Get Started', href: '/contact' }, { desktop: { padding: '14px 28px', backgroundColor: p.popular ? '#fff' : 'transparent', color: p.popular ? '#000' : fg, borderRadius: '0', fontSize: '12px', fontWeight: '600', border: p.popular ? 'none' : '1px solid rgba(255,255,255,0.2)', width: '100%', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
      ]), { ...ANIM_FADE_UP, delay: i * 0.1 })
    )),
  ], 'Pricing');
}

function contactHero3(title: string, sub: string, opts: { bg?: string; fg?: string } = {}) {
  const bg = opts.bg || '#000';
  const fg = opts.fg || '#fff';
  return withAnim(el('section', {}, { desktop: { padding: '160px 64px 40px', textAlign: 'center', backgroundColor: bg, width: '100%' } }, [
    el('heading', { text: title, level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: fg, letterSpacing: '-0.03em' }, mobile: { fontSize: '34px' } }),
    el('text', { text: sub }, { desktop: { fontSize: '17px', color: fg === '#fff' ? 'rgba(255,255,255,0.45)' : '#777', marginTop: '16px', maxWidth: '480px', margin: '16px auto 0' } }),
  ], 'Contact Hero'), ANIM_BLUR_IN);
}

// ── Page generators ──────────────────────────────────────────────

function buildPages(cfg: {
  brand: string;
  navStyle?: 'dark' | 'glass' | 'cream';
  footStyle?: 'dark' | 'cream';
  links: string[];
  home: EditorElement[];
  aboutHeading: string; aboutDesc: string; aboutImg: string;
  aboutValues: { title: string; desc: string }[];
  servicesTitle: string;
  services: { name: string; desc: string; imgUrl: string }[];
  page4: { name: string; slug: string; elements: EditorElement[] };
  contactTitle?: string; contactSub?: string;
}): TemplatePage[] {
  const n = nav3(cfg.brand, cfg.links, cfg.navStyle || 'dark');
  const f = foot3(cfg.brand, cfg.footStyle || 'dark');
  return [
    { name: 'Home', slug: '/', elements: [n, ...cfg.home, f] },
    { name: 'About', slug: '/about', elements: [
      n,
      about3(cfg.aboutHeading, cfg.aboutDesc, cfg.aboutImg, cfg.aboutValues),
      stats3([{ value: '10+', label: 'Years' }, { value: '500+', label: 'Clients' }, { value: '98%', label: 'Satisfaction' }, { value: '25+', label: 'Awards' }]),
      testimonials3([
        { quote: `Working with ${cfg.brand} has been transformative. Their expertise and attention to detail are unmatched.`, name: 'Alex Thompson', role: 'CEO, Innovate Co' },
        { quote: 'Exceptional quality and professionalism. They delivered beyond our highest expectations.', name: 'Sarah Mitchell', role: 'Director, Growth Labs' },
        { quote: 'A trusted partner who truly understands our vision. Highly recommended for any project.', name: 'James Chen', role: 'Founder, NextGen' },
      ]),
      cta3('Join Our Journey', 'We\'re always looking for talented people and exciting partnerships.', 'Get in Touch'),
      f,
    ]},
    { name: 'Services', slug: '/services', elements: [
      n,
      withAnim(el('section', {}, { desktop: { padding: '160px 64px 80px', textAlign: 'center', backgroundColor: cfg.navStyle === 'cream' ? '#FAF7F2' : '#000', width: '100%' }, mobile: { padding: '100px 24px 60px' } }, [
        el('text', { text: 'WHAT WE OFFER' }, { desktop: { fontSize: '10px', color: cfg.navStyle === 'cream' ? '#8B7355' : 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
        el('heading', { text: cfg.servicesTitle, level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: cfg.navStyle === 'cream' ? '#2C2416' : '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '34px' } }),
        el('text', { text: 'Comprehensive solutions designed to elevate your business and drive measurable growth.' }, { desktop: { fontSize: '17px', color: cfg.navStyle === 'cream' ? '#8B7355' : 'rgba(255,255,255,0.45)', maxWidth: '560px', margin: '0 auto' } }),
      ], 'Services Hero'), ANIM_BLUR_IN),
      services3(cfg.servicesTitle, cfg.services),
      features3('Why Choose Us', 'What sets us apart from the competition.', [
        { title: 'Expert Team', desc: 'Seasoned professionals with deep industry expertise and proven track records.' },
        { title: 'Tailored Approach', desc: 'Every solution is custom-built to match your unique goals and challenges.' },
        { title: 'Results-Driven', desc: 'We measure success by the tangible outcomes we deliver.' },
        { title: 'Ongoing Support', desc: 'Long-term partnership with dedicated support at every stage.' },
      ], { cols: 4 }),
      pricing3([
        { name: 'Starter', price: '$49', period: 'per month', features: 'Core features included\nEmail support\nBasic analytics\nUp to 5 users' },
        { name: 'Professional', price: '$99', period: 'per month', features: 'Everything in Starter\nPriority support\nAdvanced analytics\nUnlimited users\nCustom branding', popular: true },
        { name: 'Enterprise', price: 'Custom', features: 'Everything in Pro\nDedicated manager\nSLA guarantee\nAPI access\nCustom integrations' },
      ]),
      cta3('Ready to Get Started?', 'Let\'s discuss how we can help you achieve your goals.', 'Get in Touch'),
      f,
    ]},
    { name: cfg.page4.name, slug: cfg.page4.slug, elements: [n, ...cfg.page4.elements, f] },
    { name: 'Contact', slug: '/contact', elements: [
      n,
      contactHero3(cfg.contactTitle || 'Get In Touch', cfg.contactSub || 'We\'d love to hear from you. Reach out and let\'s start a conversation.'),
      features3('Why Reach Out', 'We make it easy to connect.', [
        { title: 'Free Consultation', desc: 'Book a no-obligation call to discuss your needs and explore solutions.' },
        { title: 'Quick Response', desc: 'We aim to respond to all enquiries within 24 hours.' },
        { title: 'Flexible Options', desc: 'We offer tailored packages to suit budgets of all sizes.' },
      ]),
      contact3(),
      withAnim(el('section', {}, { desktop: { padding: '80px 64px', backgroundColor: cfg.navStyle === 'cream' ? '#FAF7F2' : '#000', textAlign: 'center', width: '100%' } }, [
        el('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto' } }, [
          el('heading', { text: 'Visit Us', level: 'h3' }, { desktop: { fontSize: '14px', fontWeight: '600', color: cfg.navStyle === 'cream' ? '#8B7355' : 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as any, letterSpacing: '0.12em', marginBottom: '24px' } }),
          el('text', { text: '123 Business Street, Suite 100\nLondon, EC2A 1NT' }, { desktop: { fontSize: '16px', color: cfg.navStyle === 'cream' ? '#5A4632' : 'rgba(255,255,255,0.6)', lineHeight: '1.8', whiteSpace: 'pre-line', marginBottom: '16px' } }),
          el('text', { text: 'hello@' + cfg.brand.toLowerCase().replace(/[^a-z]/g, '') + '.com  |  +44 20 7123 4567' }, { desktop: { fontSize: '14px', color: cfg.navStyle === 'cream' ? '#8B7355' : 'rgba(255,255,255,0.4)' } }),
        ]),
      ], 'Location'), ANIM_FADE_UP),
      f,
    ]},
  ];
}

// ═══════════════════════════════════════════════════════════════════
// 10 PREMIUM INDUSTRY TEMPLATES — OPUS QUALITY
// ═══════════════════════════════════════════════════════════════════

export const TEMPLATES_V3: DesignerTemplate[] = [

  // ─── 1. LUXURY INTERIOR DESIGN ──────────────────────────────────
  {
    id: 'tpl-v3-interior', name: 'Interior Design Studio', description: 'Luxurious dark interior design portfolio with project showcase', category: 'Creative',
    elements: [nav3('ATELIER', ['Projects', 'Services', 'About', 'Contact']), heroSplit('Spaces That\nInspire Living', 'Bespoke interior design for residences, boutique hotels, and commercial spaces.', 'View Projects', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=900&fit=crop', { badge: 'LUXURY INTERIORS' }), foot3('ATELIER')],
    pages: buildPages({
      brand: 'ATELIER', links: ['Projects', 'Services', 'About', 'Contact'],
      home: [
        heroSplit('Spaces That\nInspire Living', 'Bespoke interior design for residences, boutique hotels, and commercial spaces.', 'View Projects', 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&h=900&fit=crop', { badge: 'LUXURY INTERIORS' }),
        stats3([{ value: '200+', label: 'Projects' }, { value: '15', label: 'Years' }, { value: '12', label: 'Awards' }, { value: '100%', label: 'Bespoke' }]),
        features3('Our Expertise', 'Design that transforms how you experience space.', [
          { title: 'Residential Design', desc: 'Complete home transformations from concept to final styling, curated for your lifestyle.', icon: '🏠' },
          { title: 'Hospitality Design', desc: 'Boutique hotel and restaurant interiors that create unforgettable guest experiences.', icon: '✨' },
          { title: 'Commercial Spaces', desc: 'Office environments that elevate productivity and reflect brand identity.', icon: '🏢' },
        ]),
        testimonials3([
          { quote: 'ATELIER completely transformed our home. Every detail was considered with extraordinary care and taste.', name: 'Victoria Ashworth', role: 'Private Residence, Knightsbridge' },
          { quote: 'The hotel lobby they designed for us has become an Instagram destination in its own right.', name: 'Marcus Chen', role: 'GM, The Mayfair Collection' },
          { quote: 'Working with ATELIER was a masterclass in collaboration. They listened, interpreted, and exceeded.', name: 'Isabelle Laurent', role: 'Founder, Lumière Café' },
        ]),
        cta3('Let\'s Create\nSomething Beautiful', 'Every project begins with a conversation. Tell us about your space.', 'Start a Project'),
      ],
      aboutHeading: 'Where Form\nMeets Function', aboutDesc: 'ATELIER is an award-winning interior design studio creating sophisticated spaces that balance beauty with livability.',
      aboutImg: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&h=900&fit=crop',
      aboutValues: [{ title: 'Bespoke', desc: 'Every project is unique — we never repeat a design.' }, { title: 'Detail', desc: 'From doorknobs to drapery, every element is considered.' }, { title: 'Timeless', desc: 'Spaces that feel relevant today and decades from now.' }],
      servicesTitle: 'Our Services',
      services: [
        { name: 'Full Interior Design', desc: 'Complete design from space planning and concept development through to installation and final styling.', imgUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&h=600&fit=crop' },
        { name: 'Furniture Curation', desc: 'Sourcing and commissioning bespoke furniture from artisan makers and luxury brands worldwide.', imgUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop' },
        { name: 'Renovation Management', desc: 'Full project management of structural renovations, working with trusted contractors and craftspeople.', imgUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop' },
      ],
      page4: { name: 'Projects', slug: '/projects', elements: [
        gallery3('Recent Projects', [
          { src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&h=400&fit=crop', alt: 'Modern Living' },
          { src: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=600&h=400&fit=crop', alt: 'Penthouse Suite' },
          { src: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop', alt: 'Lounge Design' },
          { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop', alt: 'Kitchen' },
          { src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=400&fit=crop', alt: 'Bathroom' },
          { src: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&h=400&fit=crop', alt: 'Bedroom' },
        ]),
      ] },
    }),
  },

  // ─── 2. CYBERSECURITY FIRM ──────────────────────────────────────
  {
    id: 'tpl-v3-cybersec', name: 'Cybersecurity Firm', description: 'Dark high-tech cybersecurity company with trust signals', category: 'Technology',
    elements: [nav3('SENTINEL', ['Solutions', 'Industries', 'About', 'Contact'], 'glass'), heroFull('Defend Your\nDigital Future', 'Enterprise-grade cybersecurity for organisations that can\'t afford to be breached.', 'Get Protected', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&h=1080&fit=crop', { badge: 'ZERO-TRUST SECURITY', gradient: 'linear-gradient(180deg, rgba(0,20,40,0.7) 0%, rgba(0,0,0,0.9) 100%)' }), foot3('SENTINEL')],
    pages: buildPages({
      brand: 'SENTINEL', navStyle: 'glass', links: ['Solutions', 'Industries', 'About', 'Contact'],
      home: [
        heroFull('Defend Your\nDigital Future', 'Enterprise-grade cybersecurity for organisations that can\'t afford to be breached.', 'Get Protected', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1920&h=1080&fit=crop', { badge: 'ZERO-TRUST SECURITY', gradient: 'linear-gradient(180deg, rgba(0,20,40,0.7) 0%, rgba(0,0,0,0.9) 100%)' }),
        stats3([{ value: '99.97%', label: 'Uptime SLA' }, { value: '0', label: 'Breaches' }, { value: '500+', label: 'Enterprises' }, { value: '24/7', label: 'SOC' }]),
        features3('Solutions', 'Comprehensive protection across your entire attack surface.', [
          { title: 'Threat Detection & Response', desc: 'AI-powered SOC monitoring with sub-60-second response times and automated containment.', icon: '🛡️' },
          { title: 'Penetration Testing', desc: 'Offensive security assessments that find vulnerabilities before attackers do.', icon: '🔍' },
          { title: 'Cloud Security', desc: 'Secure your AWS, Azure, and GCP infrastructure with zero-trust architecture.', icon: '☁️' },
          { title: 'Compliance & GRC', desc: 'SOC 2, ISO 27001, GDPR, and HIPAA compliance programmes from audit to certification.', icon: '📋' },
        ], { cols: 2 }),
        testimonials3([
          { quote: 'SENTINEL identified 47 critical vulnerabilities in our first assessment. They\'ve been our security partner for 6 years since.', name: 'James Harrington', role: 'CTO, FinanceHub' },
          { quote: 'Their 24/7 SOC gave us the confidence to scale globally knowing our infrastructure was protected.', name: 'Dr. Sarah Kim', role: 'CISO, MedTech Global' },
        ]),
        cta3('Don\'t Wait for\na Breach', 'Get a free security assessment and discover your risk exposure today.', 'Request Assessment'),
      ],
      aboutHeading: 'Security Is\nNot Optional', aboutDesc: 'SENTINEL was founded by former intelligence and military cybersecurity professionals who believe every organisation deserves enterprise-grade protection.',
      aboutImg: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=900&fit=crop',
      aboutValues: [{ title: 'Proactive', desc: 'We find threats before they find you.' }, { title: 'Transparent', desc: 'Clear reporting, no jargon, no hidden findings.' }, { title: 'Relentless', desc: 'Our SOC never sleeps so you can.' }],
      servicesTitle: 'Our Solutions',
      services: [
        { name: 'Managed Detection & Response', desc: '24/7 SOC-as-a-Service with AI-powered threat hunting, SIEM management, and instant incident response.', imgUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop' },
        { name: 'Red Team Operations', desc: 'Advanced adversary simulation including social engineering, physical security, and full-scope penetration testing.', imgUrl: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=800&h=600&fit=crop' },
        { name: 'Security Architecture', desc: 'Design and implement zero-trust network architecture, identity management, and secure DevOps pipelines.', imgUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop' },
      ],
      page4: { name: 'Industries', slug: '/industries', elements: [
        features3('Industries', 'Sector-specific security expertise.', [
          { title: 'Financial Services', desc: 'PCI DSS, SOX compliance, and fraud prevention for banks, fintechs, and insurance.' },
          { title: 'Healthcare', desc: 'HIPAA compliance, medical device security, and patient data protection.' },
          { title: 'Government & Defence', desc: 'Classified network security, ITAR compliance, and critical infrastructure protection.' },
          { title: 'Technology & SaaS', desc: 'Application security, CI/CD pipeline hardening, and cloud-native protection.' },
        ], { cols: 2 }),
      ] },
    }),
  },

  // ─── 3. LUXURY REAL ESTATE AGENCY ───────────────────────────────
  {
    id: 'tpl-v3-luxury-realestate', name: 'Luxury Real Estate', description: 'Premium dark property agency with cinematic listings', category: 'Real Estate',
    elements: [nav3('MAISON', ['Properties', 'Services', 'About', 'Contact'], 'glass'), heroFull('Exceptional\nProperties', 'Curating the world\'s most extraordinary residences for discerning buyers.', 'View Collection', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&h=1080&fit=crop', { badge: 'EST. 2008', overlay: 'rgba(0,0,0,0.35)' }), foot3('MAISON')],
    pages: buildPages({
      brand: 'MAISON', navStyle: 'glass', links: ['Properties', 'Services', 'About', 'Contact'],
      home: [
        heroFull('Exceptional\nProperties', 'Curating the world\'s most extraordinary residences for discerning buyers.', 'View Collection', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&h=1080&fit=crop', { badge: 'EST. 2008', overlay: 'rgba(0,0,0,0.35)' }),
        stats3([{ value: '$2.4B+', label: 'Sales Volume' }, { value: '150+', label: 'Properties Sold' }, { value: '28', label: 'Countries' }, { value: '15+', label: 'Years' }]),
        gallery3('Featured Properties', [
          { src: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop', alt: 'Modern Villa' },
          { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', alt: 'Penthouse' },
          { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', alt: 'Country Estate' },
        ]),
        testimonials3([
          { quote: 'MAISON found us a property that wasn\'t even on the market. Their network is unparalleled.', name: 'Alexander Rothwell', role: 'Buyer, Monaco' },
          { quote: 'Discretion, expertise, and an extraordinary eye for value. Simply the best in the business.', name: 'Helena Strauss', role: 'Seller, Zürich' },
        ]),
        cta3('Your Dream\nResidence Awaits', 'Private viewings available for qualified buyers. Contact our acquisitions team.', 'Enquire Privately'),
      ],
      aboutHeading: 'Where Luxury\nMeets Legacy', aboutDesc: 'MAISON represents the pinnacle of luxury real estate. We connect extraordinary properties with extraordinary people across 28 countries.',
      aboutImg: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&h=900&fit=crop',
      aboutValues: [{ title: 'Discretion', desc: 'Absolute confidentiality in every transaction.' }, { title: 'Global Network', desc: 'Access to off-market properties worldwide.' }, { title: 'White-Glove Service', desc: 'Concierge-level support from search to settlement.' }],
      servicesTitle: 'Our Services',
      services: [
        { name: 'Property Acquisition', desc: 'Our acquisitions team sources properties globally, including exclusive off-market opportunities for qualified buyers.', imgUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop' },
        { name: 'Sales & Marketing', desc: 'Cinematic photography, architectural videography, and targeted marketing to ultra-high-net-worth audiences.', imgUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop' },
        { name: 'Property Management', desc: 'Complete management for international portfolios including maintenance, staffing, and concierge services.', imgUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop' },
      ],
      page4: { name: 'Properties', slug: '/properties', elements: [
        gallery3('Current Collection', [
          { src: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=400&fit=crop', alt: 'Malibu Villa' },
          { src: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop', alt: 'London Penthouse' },
          { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop', alt: 'Tuscan Estate' },
          { src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop', alt: 'Manhattan Loft' },
          { src: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&h=400&fit=crop', alt: 'Côte d\'Azur' },
          { src: 'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?w=600&h=400&fit=crop', alt: 'Swiss Chalet' },
        ]),
      ] },
      contactTitle: 'Private Enquiries', contactSub: 'All enquiries are handled with absolute discretion. Our team will respond within 24 hours.',
    }),
  },

  // ─── 4. FINTECH / SAAS STARTUP ──────────────────────────────────
  {
    id: 'tpl-v3-fintech', name: 'Fintech SaaS', description: 'Modern dark fintech platform with pricing and feature showcase', category: 'Technology',
    elements: [nav3('PAYSYNC', ['Features', 'Pricing', 'About', 'Contact']), heroSplit('Payments.\nSimplified.', 'One API for global payments, subscriptions, and financial infrastructure.', 'Start Building', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop', { badge: 'SERIES B — $48M RAISED' }), foot3('PAYSYNC')],
    pages: buildPages({
      brand: 'PAYSYNC', links: ['Features', 'Pricing', 'About', 'Contact'],
      home: [
        heroSplit('Payments.\nSimplified.', 'One API for global payments, subscriptions, and financial infrastructure. Process $1B+ with 99.99% uptime.', 'Start Building', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop', { badge: 'SERIES B — $48M RAISED' }),
        stats3([{ value: '$12B+', label: 'Processed' }, { value: '99.99%', label: 'Uptime' }, { value: '140+', label: 'Countries' }, { value: '10K+', label: 'Businesses' }]),
        features3('Platform', 'Everything you need to accept and manage money globally.', [
          { title: 'Global Payments', desc: 'Accept cards, wallets, bank transfers, and crypto in 140+ countries with local acquiring.', icon: '💳' },
          { title: 'Subscription Billing', desc: 'Automated recurring billing with dunning, proration, and usage-based pricing.', icon: '🔄' },
          { title: 'Financial Reports', desc: 'Real-time dashboards, reconciliation, and automated accounting integrations.', icon: '📊' },
          { title: 'Fraud Prevention', desc: 'ML-powered fraud detection with custom rules, 3DS, and chargeback management.', icon: '🔒' },
        ], { cols: 2 }),
        testimonials3([
          { quote: 'PAYSYNC cut our payment processing costs by 34% and our integration time from months to days.', name: 'Daniel Park', role: 'CTO, CloudScale' },
          { quote: 'The subscription billing engine handled our pivot to usage-based pricing seamlessly.', name: 'Amara Johnson', role: 'VP Product, DataFlow' },
          { quote: 'Finally, a payment platform that actually works internationally without the headaches.', name: 'Luca Rossi', role: 'CEO, EuroShip' },
        ]),
        cta3('Start Processing\nin Minutes', 'Free sandbox access. No credit card required. Go live when you\'re ready.', 'Get API Keys'),
      ],
      aboutHeading: 'Building the\nFinancial Layer', aboutDesc: 'PAYSYNC is building the financial infrastructure that powers the next generation of internet businesses. Backed by Sequoia, a16z, and Stripe.',
      aboutImg: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=900&fit=crop',
      aboutValues: [{ title: 'Developer-First', desc: 'Beautiful APIs, comprehensive docs, and SDKs for every major language.' }, { title: 'Enterprise-Ready', desc: 'SOC 2 Type II, PCI Level 1, and dedicated support for scale.' }, { title: 'Global by Default', desc: 'Local acquiring, multi-currency, and tax compliance built-in.' }],
      servicesTitle: 'Platform Features',
      services: [
        { name: 'Payment Processing', desc: 'Card-present, online, and mobile payments with intelligent routing across 50+ acquirers for optimal approval rates.', imgUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop' },
        { name: 'Subscription Engine', desc: 'Flexible billing models — flat-rate, tiered, per-seat, usage-based — with automated invoicing and revenue recovery.', imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop' },
        { name: 'Financial Reporting', desc: 'Real-time revenue analytics, automated reconciliation, and seamless integrations with QuickBooks, Xero, and NetSuite.', imgUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop' },
      ],
      page4: { name: 'Pricing', slug: '/pricing', elements: [
        pricing3([
          { name: 'Startup', price: '2.9% + 30¢', period: 'per transaction', features: 'Standard checkout\nBasic fraud protection\nEmail support\n5 team members\nBasic analytics' },
          { name: 'Growth', price: '2.4% + 25¢', period: 'per transaction', features: 'Custom checkout\nAdvanced fraud AI\nPriority support\nUnlimited team\nAdvanced analytics\nSubscription billing', popular: true },
          { name: 'Enterprise', price: 'Custom', period: 'volume pricing', features: 'Dedicated infrastructure\nCustom fraud rules\nDedicated CSM\nSLA guarantees\nMulti-entity support\nCustom integrations' },
        ]),
      ] },
    }),
  },

  // ─── 5. ARCHITECTURE FIRM ───────────────────────────────────────
  {
    id: 'tpl-v3-architecture', name: 'Architecture Firm', description: 'Minimalist dark architecture portfolio with cinematic project gallery', category: 'Creative',
    elements: [nav3('HORIZON', ['Projects', 'Practice', 'About', 'Contact']), heroSplit('Architecture\nThat Endures', 'Award-winning design rooted in context, craft, and sustainability.', 'View Projects', 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=900&fit=crop', { badge: 'RIBA GOLD MEDAL 2025' }), foot3('HORIZON')],
    pages: buildPages({
      brand: 'HORIZON', links: ['Projects', 'Practice', 'About', 'Contact'],
      home: [
        heroSplit('Architecture\nThat Endures', 'Award-winning design rooted in context, craft, and sustainability.', 'View Projects', 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=1200&h=900&fit=crop', { badge: 'RIBA GOLD MEDAL 2025' }),
        gallery3('Selected Works', [
          { src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&h=400&fit=crop', alt: 'Cultural Centre' },
          { src: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&h=400&fit=crop', alt: 'Waterfront Tower' },
          { src: 'https://images.unsplash.com/photo-1431576901776-e539bd916ba2?w=600&h=400&fit=crop', alt: 'Residential Complex' },
        ]),
        stats3([{ value: '75+', label: 'Projects' }, { value: '18', label: 'Awards' }, { value: '12', label: 'Countries' }, { value: '35', label: 'Team Members' }]),
        features3('Practice Areas', 'Design expertise across scales and typologies.', [
          { title: 'Cultural & Civic', desc: 'Museums, libraries, and public buildings that enrich community life.', icon: '🏛️' },
          { title: 'Residential', desc: 'Homes and housing that respond to how people actually live today.', icon: '🏡' },
          { title: 'Commercial', desc: 'Offices, retail, and mixed-use developments that create value.', icon: '🏗️' },
        ]),
        cta3('Let\'s Build\nSomething Lasting', 'We\'re always interested in new challenges. Tell us about your project.', 'Start a Conversation'),
      ],
      aboutHeading: 'Design With\nPurpose', aboutDesc: 'HORIZON is an international architecture practice founded on the belief that great design improves lives. Every project is an opportunity to create something meaningful.',
      aboutImg: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=1200&h=900&fit=crop',
      aboutValues: [{ title: 'Context', desc: 'Every building is a response to its place and people.' }, { title: 'Sustainability', desc: 'Net-zero design as a standard, not an add-on.' }, { title: 'Craft', desc: 'Obsessive attention to materiality and detail.' }],
      servicesTitle: 'Our Practice',
      services: [
        { name: 'Architecture', desc: 'Full-service architectural design from feasibility through to construction administration and post-occupancy evaluation.', imgUrl: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&h=600&fit=crop' },
        { name: 'Urban Design', desc: 'Masterplanning, public realm strategy, and placemaking for cities and communities.', imgUrl: 'https://images.unsplash.com/photo-1431576901776-e539bd916ba2?w=800&h=600&fit=crop' },
        { name: 'Interior Architecture', desc: 'Interior spatial design that extends the architectural concept into every detail of the user experience.', imgUrl: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800&h=600&fit=crop' },
      ],
      page4: { name: 'Projects', slug: '/projects', elements: [
        gallery3('All Projects', [
          { src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&h=400&fit=crop', alt: 'Oslo Cultural Centre' },
          { src: 'https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=600&h=400&fit=crop', alt: 'Lisbon Tower' },
          { src: 'https://images.unsplash.com/photo-1431576901776-e539bd916ba2?w=600&h=400&fit=crop', alt: 'Berlin Housing' },
          { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop', alt: 'Tokyo Office' },
          { src: 'https://images.unsplash.com/photo-1448630360428-65456885c650?w=600&h=400&fit=crop', alt: 'London Museum' },
          { src: 'https://images.unsplash.com/photo-1464938050520-ef2571e0e6d7?w=600&h=400&fit=crop', alt: 'Copenhagen School' },
        ]),
      ] },
    }),
  },

  // ─── 6. PREMIUM GYM / FITNESS CLUB ─────────────────────────────
  {
    id: 'tpl-v3-gym', name: 'Premium Fitness Club', description: 'Dark aggressive gym with class schedules and membership tiers', category: 'Fitness',
    elements: [nav3('APEX', ['Classes', 'Membership', 'Trainers', 'Contact']), heroFull('Push Beyond\nYour Limits', 'Premium training facilities, world-class coaches, and a community that pushes you further.', 'Join Now', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop', { badge: 'LONDON • DUBAI • NEW YORK' }), foot3('APEX')],
    pages: buildPages({
      brand: 'APEX', links: ['Classes', 'Membership', 'Trainers', 'Contact'],
      home: [
        heroFull('Push Beyond\nYour Limits', 'Premium training facilities, world-class coaches, and a community that pushes you further.', 'Join Now', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop', { badge: 'LONDON • DUBAI • NEW YORK' }),
        stats3([{ value: '5K+', label: 'Members' }, { value: '120+', label: 'Classes/Week' }, { value: '40+', label: 'Coaches' }, { value: '3', label: 'Locations' }]),
        features3('Training Programs', 'Something for every goal.', [
          { title: 'Strength & Power', desc: 'Olympic lifting, powerlifting, and progressive overload programs for serious strength gains.', icon: '🏋️' },
          { title: 'HIIT & Conditioning', desc: 'High-intensity interval training that burns fat, builds endurance, and transforms your fitness.', icon: '⚡' },
          { title: 'Yoga & Recovery', desc: 'Vinyasa, hot yoga, and dedicated recovery sessions to keep your body performing at its peak.', icon: '🧘' },
          { title: '1-on-1 Coaching', desc: 'Personalised programming and nutrition guidance with certified performance coaches.', icon: '🎯' },
        ], { cols: 2 }),
        testimonials3([
          { quote: 'APEX completely transformed my relationship with fitness. The coaches, community, and facilities are world-class.', name: 'Ryan Mitchell', role: 'Member since 2022' },
          { quote: 'I\'ve trained at gyms across 15 countries. APEX is, without question, the best I\'ve experienced.', name: 'Lena Kovacs', role: 'Professional Athlete' },
        ]),
        cta3('Your Best Self\nStarts Here', 'Book a free trial session and experience APEX for yourself.', 'Book Free Trial'),
      ],
      aboutHeading: 'More Than\na Gym', aboutDesc: 'APEX is a performance community for people who take their fitness seriously. We provide the environment, expertise, and accountability to help you exceed your goals.',
      aboutImg: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=900&fit=crop',
      aboutValues: [{ title: 'Excellence', desc: 'Every detail designed for peak performance.' }, { title: 'Community', desc: 'Train alongside people who push you to be better.' }, { title: 'Science-Backed', desc: 'Evidence-based programming and nutrition.' }],
      servicesTitle: 'Classes & Programs',
      services: [
        { name: 'Group Classes', desc: 'Over 120 weekly classes including HIIT, boxing, spin, yoga, strength circuits, and more.', imgUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop' },
        { name: 'Personal Training', desc: 'Fully customised training programs and nutrition coaching with certified performance coaches.', imgUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop' },
        { name: 'Recovery & Wellness', desc: 'Cryotherapy, infrared sauna, sports massage, and dedicated stretching zones.', imgUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop' },
      ],
      page4: { name: 'Membership', slug: '/membership', elements: [
        pricing3([
          { name: 'Essential', price: '£79', period: '/month', features: 'Full gym access\nGroup classes\nLocker & towels\nMember app\nStandard hours' },
          { name: 'Performance', price: '£129', period: '/month', features: 'Everything in Essential\n24/7 access\n2 PT sessions/month\nRecovery zone\nGuest passes\nNutrition consultation', popular: true },
          { name: 'Elite', price: '£249', period: '/month', features: 'Everything in Performance\nUnlimited PT\nCryotherapy\nPrivate locker\nAll locations\nPriority booking' },
        ]),
      ] },
    }),
  },

  // ─── 7. LUXURY RESTAURANT ───────────────────────────────────────
  {
    id: 'tpl-v3-restaurant', name: 'Fine Dining Restaurant', description: 'Elegant dark fine dining with menu showcase and reservations', category: 'Restaurant',
    elements: [nav3('NŌMA', ['Menu', 'Experience', 'About', 'Reserve']), heroFull('A Culinary\nJourney', 'Two Michelin stars. Seasonal tasting menus celebrating the finest British produce.', 'Reserve a Table', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop', { badge: '★★ MICHELIN' }), foot3('NŌMA')],
    pages: buildPages({
      brand: 'NŌMA', links: ['Menu', 'Experience', 'About', 'Reserve'],
      home: [
        heroFull('A Culinary\nJourney', 'Two Michelin stars. Seasonal tasting menus celebrating the finest British produce.', 'Reserve a Table', 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&h=1080&fit=crop', { badge: '★★ MICHELIN' }),
        features3('The Menu', 'Our tasting menus change with the seasons.', [
          { title: 'The Garden Menu', desc: 'A 12-course vegetable-forward journey through the British garden. Celebrating produce at its peak.', icon: '🌿' },
          { title: 'The Sea Menu', desc: '10 courses of sustainably sourced seafood from the British coastline, paired with coastal botanicals.', icon: '🦪' },
          { title: 'The Land Menu', desc: 'Heritage breed meats and game, foraged accompaniments, and ancient grain preparations.', icon: '🥩' },
        ]),
        gallery3('The Experience', [
          { src: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop', alt: 'Dish 1' },
          { src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop', alt: 'Dish 2' },
          { src: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop', alt: 'Dish 3' },
        ]),
        testimonials3([
          { quote: 'The most extraordinary dining experience of my life. Every course was a revelation.', name: 'The Guardian', role: '★★★★★' },
          { quote: 'NŌMA redefines what British cuisine can be. This is destination dining at its finest.', name: 'Financial Times', role: 'Top 10 Restaurants' },
        ], { title: 'Press' }),
        cta3('An Evening\nto Remember', 'Reservations open 60 days in advance. Private dining available for parties of 8–16.', 'Reserve Now'),
      ],
      aboutHeading: 'Rooted in\nthe Land', aboutDesc: 'NŌMA is the vision of Chef James Whitfield — a celebration of British terroir, seasonality, and the craft of cooking at its highest expression.',
      aboutImg: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=900&fit=crop',
      aboutValues: [{ title: 'Seasonal', desc: 'Our menu changes completely four times a year.' }, { title: 'Sustainable', desc: 'Zero-waste kitchen, local sourcing within 50 miles.' }, { title: 'Craft', desc: 'Techniques refined over decades of fine dining.' }],
      servicesTitle: 'Dining Experiences',
      services: [
        { name: 'Tasting Menu', desc: 'Our signature 12-course tasting menu with optional sommelier wine pairing. Allow 3.5 hours.', imgUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop' },
        { name: 'Private Dining', desc: 'Exclusive dining in our vaulted cellar for 8–16 guests with a bespoke menu consultation.', imgUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&h=600&fit=crop' },
        { name: 'Chef\'s Table', desc: 'Sit at the pass and watch the kitchen in action. 4 seats, available Friday and Saturday only.', imgUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop' },
      ],
      page4: { name: 'Menu', slug: '/menu', elements: [
        features3('Current Season', 'Spring 2026 — The Garden Awakens', [
          { title: 'Amuse-Bouche', desc: 'Jersey Royal, wild garlic, smoked trout roe' },
          { title: 'First Course', desc: 'Heritage beetroot, goat curd, hazelnut' },
          { title: 'Fish Course', desc: 'Cornish turbot, samphire, brown butter' },
          { title: 'Main Course', desc: 'Herdwick lamb, spring alliums, anchovy jus' },
          { title: 'Pre-Dessert', desc: 'Elderflower granita, cucumber, verbena' },
          { title: 'Dessert', desc: 'Rhubarb, custard, ginger crumble' },
        ], { cols: 3 }),
      ] },
      contactTitle: 'Reserve a Table', contactSub: 'Dinner service: Wednesday–Saturday, 6:30pm & 8:45pm sittings. Reservations essential.',
    }),
  },

  // ─── 8. CREATIVE / BRANDING AGENCY ─────────────────────────────
  {
    id: 'tpl-v3-branding', name: 'Branding Agency', description: 'Bold dark creative agency with portfolio grid and case studies', category: 'Agency',
    elements: [nav3('MONOLITH', ['Work', 'Services', 'About', 'Contact']), heroSplit('We Build\nBrands That\nMove Culture', 'Strategic branding and creative direction for ambitious companies.', 'See Our Work', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=900&fit=crop', { badge: 'AGENCY OF THE YEAR 2025' }), foot3('MONOLITH')],
    pages: buildPages({
      brand: 'MONOLITH', links: ['Work', 'Services', 'About', 'Contact'],
      home: [
        heroSplit('We Build\nBrands That\nMove Culture', 'Strategic branding and creative direction for ambitious companies.', 'See Our Work', 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=1200&h=900&fit=crop', { badge: 'AGENCY OF THE YEAR 2025' }),
        stats3([{ value: '200+', label: 'Brands Built' }, { value: '15', label: 'Awards' }, { value: '8', label: 'Years' }, { value: '32', label: 'Creatives' }]),
        gallery3('Selected Work', [
          { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop', alt: 'Branding Project' },
          { src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop', alt: 'Identity System' },
          { src: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&h=400&fit=crop', alt: 'Campaign' },
        ]),
        features3('Capabilities', 'Full-spectrum brand building.', [
          { title: 'Brand Strategy', desc: 'Positioning, architecture, naming, and brand platform development that gives you a competitive edge.', icon: '🧭' },
          { title: 'Visual Identity', desc: 'Logo systems, typography, colour, and comprehensive brand guidelines built for scale.', icon: '🎨' },
          { title: 'Digital Experience', desc: 'Websites, apps, and digital products that bring your brand to life across every touchpoint.', icon: '💻' },
          { title: 'Campaign & Content', desc: 'Launch campaigns, social content, and ongoing creative direction that builds momentum.', icon: '📣' },
        ], { cols: 2 }),
        testimonials3([
          { quote: 'MONOLITH didn\'t just redesign our brand — they redefined how we think about ourselves. Revenue up 340%.', name: 'Kate Aldridge', role: 'CEO, Luminary' },
          { quote: 'The most strategic, creative, and execution-obsessed agency we\'ve ever worked with.', name: 'Tom Ishikawa', role: 'CMO, Parallax' },
        ]),
        cta3('Let\'s Make\nSomething Iconic', 'We take on 6 new brand projects per quarter. Tell us yours.', 'Start a Project'),
      ],
      aboutHeading: 'Culture-First\nCreativity', aboutDesc: 'MONOLITH is a brand consultancy for companies that want to matter. We combine strategic rigour with creative bravery to build brands that move culture.',
      aboutImg: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=1200&h=900&fit=crop',
      aboutValues: [{ title: 'Strategic', desc: 'Every creative decision backed by research and insight.' }, { title: 'Brave', desc: 'We don\'t do safe. Safe is invisible.' }, { title: 'Obsessive', desc: 'We sweat the details until the work is undeniable.' }],
      servicesTitle: 'What We Do',
      services: [
        { name: 'Brand Strategy & Positioning', desc: 'Deep research, competitive analysis, and strategic frameworks that give your brand an unfair advantage in market.', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop' },
        { name: 'Visual Identity Systems', desc: 'Comprehensive identity design — logo, typography, colour, illustration, photography direction — built to scale globally.', imgUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop' },
        { name: 'Digital Product Design', desc: 'End-to-end UX/UI design and front-end development for websites, applications, and digital platforms.', imgUrl: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=800&h=600&fit=crop' },
      ],
      page4: { name: 'Work', slug: '/work', elements: [
        gallery3('Case Studies', [
          { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop', alt: 'Luminary Rebrand' },
          { src: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop', alt: 'Parallax Identity' },
          { src: 'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&h=400&fit=crop', alt: 'Vantage Campaign' },
          { src: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&h=400&fit=crop', alt: 'Nova Digital' },
          { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop', alt: 'Flux Systems' },
          { src: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=400&fit=crop', alt: 'Meridian Launch' },
        ]),
      ] },
    }),
  },

  // ─── 9. PRIVATE MEDICAL CLINIC ─────────────────────────────────
  {
    id: 'tpl-v3-clinic', name: 'Private Medical Clinic', description: 'Premium dark medical clinic with treatment pages and booking', category: 'Healthcare',
    elements: [nav3('HARLEY CLINIC', ['Treatments', 'Specialists', 'About', 'Book']), heroSplit('World-Class\nPrivate Healthcare', 'Consultant-led care with same-week appointments and state-of-the-art diagnostics.', 'Book Appointment', 'https://images.unsplash.com/photo-1519494026894-2b28dcc11e44?w=1200&h=900&fit=crop', { badge: 'CQC OUTSTANDING' }), foot3('HARLEY CLINIC')],
    pages: buildPages({
      brand: 'HARLEY CLINIC', links: ['Treatments', 'Specialists', 'About', 'Book'],
      home: [
        heroSplit('World-Class\nPrivate Healthcare', 'Consultant-led care with same-week appointments and state-of-the-art diagnostics.', 'Book Appointment', 'https://images.unsplash.com/photo-1519494026894-2b28dcc11e44?w=1200&h=900&fit=crop', { badge: 'CQC OUTSTANDING' }),
        stats3([{ value: '50+', label: 'Consultants' }, { value: '30K+', label: 'Patients' }, { value: '98%', label: 'Satisfaction' }, { value: '24h', label: 'Results' }]),
        features3('Specialties', 'Expert care across every major medical discipline.', [
          { title: 'Orthopaedics', desc: 'Joint replacement, sports injuries, and musculoskeletal conditions treated by leading surgeons.', icon: '🦴' },
          { title: 'Cardiology', desc: 'Advanced cardiac diagnostics, interventional procedures, and ongoing heart health management.', icon: '❤️' },
          { title: 'Dermatology', desc: 'Medical dermatology, skin cancer screening, and advanced cosmetic treatments.', icon: '✨' },
          { title: 'Diagnostics', desc: 'MRI, CT, ultrasound, and full-body health screening with results in 24 hours.', icon: '🔬' },
        ], { cols: 2 }),
        testimonials3([
          { quote: 'From referral to surgery in 8 days. The care was exceptional at every stage.', name: 'Richard Clarke', role: 'Knee Replacement Patient' },
          { quote: 'The health screening was thorough, efficient, and genuinely reassuring. Worth every penny.', name: 'Amanda Foster', role: 'Executive Health Check' },
          { quote: 'Professor Williams is simply the best cardiologist I\'ve encountered in 30 years of medicine.', name: 'Dr. Sarah Hughes', role: 'Referring GP' },
        ]),
        cta3('Your Health\nDeserves the Best', 'Same-week appointments available. Self-pay and all major insurers accepted.', 'Book Now'),
      ],
      aboutHeading: 'Excellence\nin Healthcare', aboutDesc: 'The Harley Clinic brings together 50+ leading consultants across every major medical specialty, supported by state-of-the-art diagnostic technology and CQC-outstanding nursing care.',
      aboutImg: 'https://images.unsplash.com/photo-1519494026894-2b28dcc11e44?w=1200&h=900&fit=crop',
      aboutValues: [{ title: 'Consultant-Led', desc: 'You see the consultant, not a registrar. Every time.' }, { title: 'Fast Access', desc: 'Most patients seen within 48 hours of referral.' }, { title: 'Transparent', desc: 'Fixed-price packages. No surprises.' }],
      servicesTitle: 'Treatments',
      services: [
        { name: 'Surgical Procedures', desc: 'Day-case and inpatient surgery across orthopaedics, general surgery, gynaecology, and ENT.', imgUrl: 'https://images.unsplash.com/photo-1519494026894-2b28dcc11e44?w=800&h=600&fit=crop' },
        { name: 'Health Screening', desc: 'Comprehensive executive health checks including bloods, cardiac assessment, imaging, and lifestyle coaching.', imgUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=600&fit=crop' },
        { name: 'Cosmetic & Aesthetic', desc: 'Non-surgical aesthetics, dermal fillers, and surgical cosmetic procedures by accredited specialists.', imgUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=600&fit=crop' },
      ],
      page4: { name: 'Specialists', slug: '/specialists', elements: [
        features3('Our Team', 'Leading consultants across every specialty.', [
          { title: 'Prof. James Williams', desc: 'Consultant Cardiologist — 25 years experience. Special interest in interventional cardiology.' },
          { title: 'Ms. Katherine Lin', desc: 'Consultant Orthopaedic Surgeon — Specialist in hip and knee replacement.' },
          { title: 'Dr. Emma Richardson', desc: 'Consultant Dermatologist — Expert in skin cancer, acne, and cosmetic dermatology.' },
          { title: 'Mr. David Okonkwo', desc: 'Consultant General Surgeon — Specialist in laparoscopic and bariatric surgery.' },
        ], { cols: 2 }),
      ] },
      contactTitle: 'Book an Appointment', contactSub: 'Self-referral accepted. Most patients seen within 48 hours.',
    }),
  },

  // ─── 10. E-LEARNING PLATFORM ───────────────────────────────────
  {
    id: 'tpl-v3-elearning', name: 'E-Learning Platform', description: 'Modern dark online education platform with course catalog and pricing', category: 'Education',
    elements: [nav3('PRAXIS', ['Courses', 'Pricing', 'About', 'Contact']), heroSplit('Master New\nSkills Online', 'Expert-led courses in design, development, and business — learn at your own pace.', 'Browse Courses', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=900&fit=crop', { badge: '50,000+ STUDENTS' }), foot3('PRAXIS')],
    pages: buildPages({
      brand: 'PRAXIS', links: ['Courses', 'Pricing', 'About', 'Contact'],
      home: [
        heroSplit('Master New\nSkills Online', 'Expert-led courses in design, development, and business — learn at your own pace.', 'Browse Courses', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=900&fit=crop', { badge: '50,000+ STUDENTS' }),
        stats3([{ value: '200+', label: 'Courses' }, { value: '50K+', label: 'Students' }, { value: '4.9★', label: 'Rating' }, { value: '100+', label: 'Instructors' }]),
        features3('Popular Categories', 'Courses designed by industry professionals for real-world application.', [
          { title: 'Product Design', desc: 'UI/UX, Figma mastery, design systems, and user research — from beginner to expert.', icon: '🎨' },
          { title: 'Web Development', desc: 'React, Node.js, Python, and full-stack engineering with hands-on projects.', icon: '💻' },
          { title: 'Business & Marketing', desc: 'Growth marketing, analytics, product management, and startup fundamentals.', icon: '📈' },
          { title: 'Data Science & AI', desc: 'Machine learning, data analysis, Python for data science, and AI applications.', icon: '🤖' },
        ], { cols: 2 }),
        testimonials3([
          { quote: 'PRAXIS courses are genuinely the best I\'ve found online. The project-based approach actually teaches you to build things.', name: 'Maya Chen', role: 'Junior Designer → Senior at Stripe' },
          { quote: 'I switched careers from marketing to engineering using PRAXIS. The curriculum is incredibly well-structured.', name: 'Alex Rivera', role: 'Now Software Engineer at Shopify' },
          { quote: 'The community and mentorship sets PRAXIS apart. It\'s not just videos — it\'s an actual learning experience.', name: 'Priya Sharma', role: 'Product Manager, Google' },
        ]),
        cta3('Start Learning\nToday', '7-day free trial. Cancel anytime. Access every course in our library.', 'Start Free Trial'),
      ],
      aboutHeading: 'Education\nThat Works', aboutDesc: 'PRAXIS was built by educators and practitioners who believe online learning should be rigorous, practical, and accessible. Every course is designed to get you hired.',
      aboutImg: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&h=900&fit=crop',
      aboutValues: [{ title: 'Project-Based', desc: 'Learn by building real projects, not watching lectures.' }, { title: 'Expert Instructors', desc: 'Every instructor works in the field they teach.' }, { title: 'Career Outcomes', desc: '87% of completers report a career advancement within 6 months.' }],
      servicesTitle: 'Learning Paths',
      services: [
        { name: 'Design Career Path', desc: '6-month structured programme covering UI/UX fundamentals, advanced prototyping, design systems, and portfolio building.', imgUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop' },
        { name: 'Engineering Career Path', desc: 'Full-stack web development from HTML/CSS through React, Node.js, databases, and deployment.', imgUrl: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop' },
        { name: 'Business Career Path', desc: 'Product management, growth marketing, data analytics, and startup strategy.', imgUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop' },
      ],
      page4: { name: 'Pricing', slug: '/pricing', elements: [
        pricing3([
          { name: 'Monthly', price: '£29', period: '/month', features: 'Full course library\nProject feedback\nCommunity access\nMobile app\nCertificates' },
          { name: 'Annual', price: '£199', period: '/year (save 43%)', features: 'Everything in Monthly\nCareer coaching\nPriority support\nOffline downloads\nTeam features\nExclusive workshops', popular: true },
          { name: 'Enterprise', price: 'Custom', period: 'per seat pricing', features: 'Custom learning paths\nAdmin dashboard\nSSO & LMS integration\nDedicated CSM\nAPI access\nCustom content' },
        ]),
      ] },
    }),
  },
];

export const TEMPLATE_CATEGORIES_V3 = ['Creative', 'Technology', 'Real Estate', 'Fitness', 'Restaurant', 'Agency', 'Healthcare', 'Education'];
