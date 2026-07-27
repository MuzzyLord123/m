import { DesignerTemplate, EditorElement, TemplatePage } from '../types';

let _c2 = 0;
function uid(): string {
  _c2++;
  return `tv2-${_c2}-${Math.random().toString(36).slice(2, 8)}`;
}

function el(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: uid(), type, name: name ?? type, props, styles, children };
}

// ── Building blocks ──────────────────────────────────────────

function nav(brand: string, links: string[]) {
  return el('navbar', { brand }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', width: '100%', backgroundColor: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '16px 24px' } }, [
    el('link', { text: brand, href: '/' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' as any, textDecoration: 'none' } }),
    el('container', {}, { desktop: { display: 'flex', gap: '32px', alignItems: 'center' }, mobile: { display: 'none' } }, links.map(l =>
      el('link', { text: l, href: `/${l.toLowerCase().replace(/\s+/g, '-')}` }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: '500' } })
    )),
  ], 'Navigation');
}

function foot(brand: string) {
  return el('footer', {}, { desktop: { padding: '60px', backgroundColor: '#000', textAlign: 'center', width: '100%', borderTop: '1px solid #111' } }, [
    el('text', { text: `© 2026 ${brand}. All rights reserved.` }, { desktop: { color: '#444', fontSize: '12px', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
  ], 'Footer');
}

function hero(heading: string, sub: string, cta: string, imgUrl: string) {
  return el('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '90vh', backgroundColor: '#000' }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
    el('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '60px 24px' } }, [
      el('heading', { text: heading, level: 'h1' }, { desktop: { fontSize: '54px', fontWeight: '700', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.03em', marginBottom: '24px' }, mobile: { fontSize: '34px' } }),
      el('text', { text: sub }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.7', marginBottom: '40px', maxWidth: '420px' } }),
      el('button', { text: cta, href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any, width: 'fit-content' } }),
    ]),
    el('container', {}, { desktop: { position: 'relative', overflow: 'hidden' } }, [
      el('image', { src: imgUrl, alt: 'Hero' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }),
    ]),
  ], 'Hero');
}

function fullHero(heading: string, sub: string, cta: string, imgUrl: string) {
  return el('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: `url(${imgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } }, [
    el('container', {}, { desktop: { position: 'absolute', inset: '0', backgroundColor: 'rgba(0,0,0,0.55)' } }),
    el('container', {}, { desktop: { position: 'relative', zIndex: '1', padding: '0 40px', textAlign: 'center', maxWidth: '900px' }, mobile: { padding: '0 24px' } }, [
      el('heading', { text: heading, level: 'h1' }, { desktop: { fontSize: '68px', fontWeight: '700', color: '#fff', lineHeight: '1.06', letterSpacing: '-0.03em', marginBottom: '24px' }, mobile: { fontSize: '36px' } }),
      el('text', { text: sub }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' } }),
      el('button', { text: cta, href: '#' }, { desktop: { padding: '18px 44px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
    ]),
  ], 'Hero');
}

function features(title: string, items: { title: string; desc: string; icon?: string }[]) {
  return el('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '64px', letterSpacing: '-0.02em' }, mobile: { fontSize: '28px', marginBottom: '40px' } }),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: '40px', maxWidth: '1200px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } },
      items.map(item => el('container', {}, { desktop: { padding: '32px', backgroundColor: '#111', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' } }, [
        el('text', { text: item.icon || '◆' }, { desktop: { fontSize: '24px', marginBottom: '16px', color: '#fff' } }),
        el('heading', { text: item.title, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
        el('text', { text: item.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' } }),
      ]))
    ),
  ], 'Features');
}

function stats(items: { value: string; label: string }[]) {
  return el('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${items.length}, 1fr)`, gap: '40px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center', width: '100%' }, mobile: { gridTemplateColumns: '1fr 1fr' } },
      items.map(item => el('container', {}, { desktop: {} }, [
        el('heading', { text: item.value, level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
        el('text', { text: item.label }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' as any, letterSpacing: '0.06em' } }),
      ]))
    ),
  ], 'Stats');
}

function testimonials(items: { quote: string; name: string; role: string }[]) {
  return el('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    el('heading', { text: 'What People Say', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '60px' }, mobile: { fontSize: '28px' } }),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(items.length, 3)}, 1fr)`, gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } },
      items.map(item => el('container', {}, { desktop: { padding: '32px', backgroundColor: '#111', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' } }, [
        el('text', { text: `"${item.quote}"` }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', marginBottom: '20px', fontStyle: 'italic' } }),
        el('text', { text: item.name }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#fff' } }),
        el('text', { text: item.role }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.4)' } }),
      ]))
    ),
  ], 'Testimonials');
}

function ctaSection(heading: string, sub: string, btnText: string) {
  return el('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000', textAlign: 'center', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', marginBottom: '20px', letterSpacing: '-0.02em' }, mobile: { fontSize: '28px' } }),
    el('text', { text: sub }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.5)', marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' } }),
    el('button', { text: btnText, href: '#' }, { desktop: { padding: '16px 40px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
  ], 'CTA');
}

function gallery(title: string, images: { src: string; alt: string }[]) {
  return el('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    el('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '48px' } }),
    el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${Math.min(images.length, 3)}, 1fr)`, gap: '16px', maxWidth: '1200px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr 1fr' } },
      images.map(img => el('image', { src: img.src, alt: img.alt }, { desktop: { width: '100%', height: '280px', objectFit: 'cover', borderRadius: '8px', display: 'block' } }))
    ),
  ], 'Gallery');
}

function contactSection(heading: string) {
  return el('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
    el('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto', width: '100%' } }, [
      el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '40px' } }),
      el('form', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
        el('input', { placeholder: 'Your Name', inputType: 'text' }, { desktop: { padding: '14px 16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', color: '#fff', fontSize: '14px', width: '100%' } }),
        el('input', { placeholder: 'Email Address', inputType: 'email' }, { desktop: { padding: '14px 16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', color: '#fff', fontSize: '14px', width: '100%' } }),
        el('textarea', { placeholder: 'Your Message' }, { desktop: { padding: '14px 16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', color: '#fff', fontSize: '14px', width: '100%', minHeight: '140px' } }),
        el('button', { text: 'Send Message', href: '#' }, { desktop: { padding: '16px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
      ]),
    ]),
  ], 'Contact');
}

function aboutSection(heading: string, desc: string, imgUrl: string) {
  return el('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', minHeight: '70vh', backgroundColor: '#000', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } }, [
    el('container', {}, { desktop: { position: 'relative', overflow: 'hidden' } }, [
      el('image', { src: imgUrl, alt: 'About' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }),
    ]),
    el('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '60px 24px' } }, [
      el('heading', { text: heading, level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.02em', marginBottom: '24px' }, mobile: { fontSize: '32px' } }),
      el('text', { text: desc }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.7' } }),
    ]),
  ], 'About');
}

// ── Template builder ─────────────────────────────────────────

function makePages(brand: string, links: string[], homeEls: EditorElement[], aboutImg: string, aboutDesc: string, servicesTitle: string, serviceItems: { title: string; desc: string; icon?: string }[], galleryImages: { src: string; alt: string }[]): TemplatePage[] {
  return [
    { name: 'Home', slug: '/', elements: [nav(brand, links), ...homeEls, foot(brand)] },
    { name: 'About', slug: '/about', elements: [
      nav(brand, links),
      aboutSection(`About\n${brand}`, aboutDesc, aboutImg),
      stats([{ value: '10+', label: 'Years' }, { value: '500+', label: 'Clients' }, { value: '98%', label: 'Satisfaction' }, { value: '25+', label: 'Awards' }]),
      features('Our Values', [
        { title: 'Excellence', desc: 'We hold ourselves to the highest standards in everything we do.', icon: '★' },
        { title: 'Innovation', desc: 'Constantly pushing boundaries to find better solutions.', icon: '◉' },
        { title: 'Integrity', desc: 'Honest, transparent, and committed to doing what\'s right.', icon: '◆' },
      ]),
      testimonials([
        { quote: `${brand} exceeded all our expectations. Their team is professional, creative, and delivers on time.`, name: 'Alex Morgan', role: 'CEO, Innovate Corp' },
        { quote: 'Outstanding results and brilliant communication throughout. Would recommend without hesitation.', name: 'Sarah James', role: 'Marketing Director, Stellar' },
        { quote: 'A trusted partner who truly understands our vision and brings it to life beautifully.', name: 'David Chen', role: 'Founder, NexGen' },
      ]),
      ctaSection('Join Our Story', `Discover why hundreds of clients trust ${brand} with their most important projects.`, 'Get in Touch'),
      foot(brand),
    ]},
    { name: 'Services', slug: '/services', elements: [
      nav(brand, links),
      el('section', {}, { desktop: { padding: '160px 60px 80px', textAlign: 'center', backgroundColor: '#000', width: '100%' }, mobile: { padding: '100px 24px 60px' } }, [
        el('text', { text: 'WHAT WE DO' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
        el('heading', { text: servicesTitle, level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '34px' } }),
        el('text', { text: 'Comprehensive solutions tailored to your unique needs.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', maxWidth: '500px', margin: '0 auto' } }),
      ], 'Services Hero'),
      features(servicesTitle, serviceItems),
      stats([{ value: '1000+', label: 'Projects Completed' }, { value: '99%', label: 'Client Satisfaction' }, { value: '24/7', label: 'Support' }]),
      el('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
        el('heading', { text: 'Our Process', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '60px' } }),
        el('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [
          { num: '01', title: 'Discovery', desc: 'Understanding your goals, challenges, and vision.' },
          { num: '02', title: 'Strategy', desc: 'Developing a tailored plan for success.' },
          { num: '03', title: 'Execution', desc: 'Bringing the plan to life with precision.' },
          { num: '04', title: 'Delivery', desc: 'Reviewing, refining, and launching.' },
        ].map(step => el('container', {}, { desktop: { padding: '32px', backgroundColor: '#111', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' } }, [
          el('text', { text: step.num }, { desktop: { fontSize: '32px', fontWeight: '700', color: 'rgba(255,255,255,0.1)', marginBottom: '12px' } }),
          el('heading', { text: step.title, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
          el('text', { text: step.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' } }),
        ]))),
      ], 'Process'),
      ctaSection('Ready to Start?', `Let ${brand} help you achieve your goals.`, 'Get Started'),
      foot(brand),
    ]},
    { name: 'Gallery', slug: '/gallery', elements: [
      nav(brand, links),
      el('section', {}, { desktop: { padding: '160px 60px 60px', textAlign: 'center', backgroundColor: '#000', width: '100%' }, mobile: { padding: '100px 24px 40px' } }, [
        el('text', { text: 'PORTFOLIO' }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '16px', fontWeight: '700' } }),
        el('heading', { text: 'Our Work', level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '34px' } }),
        el('text', { text: 'A showcase of our finest projects and proudest achievements.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', maxWidth: '500px', margin: '0 auto' } }),
      ], 'Gallery Hero'),
      gallery('Featured Work', galleryImages),
      testimonials([
        { quote: 'The quality of work speaks for itself. Absolutely stunning results every single time.', name: 'Rachel Kim', role: 'Creative Director' },
        { quote: 'They have a rare ability to translate complex ideas into beautiful, functional solutions.', name: 'Marcus Bell', role: 'Product Manager' },
      ]),
      ctaSection('Have a Project in Mind?', 'We\'d love to hear about it. Let\'s create something amazing together.', 'Start a Project'),
      foot(brand),
    ]},
    { name: 'Contact', slug: '/contact', elements: [
      nav(brand, links),
      el('section', {}, { desktop: { padding: '160px 60px 40px', textAlign: 'center', backgroundColor: '#000', width: '100%' }, mobile: { padding: '100px 24px 40px' } }, [
        el('heading', { text: 'Get in Touch', level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em' }, mobile: { fontSize: '34px' } }),
        el('text', { text: 'We\'d love to hear from you. Fill out the form below and we\'ll get back to you within 24 hours.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginTop: '16px', maxWidth: '500px', margin: '16px auto 0' } }),
      ], 'Contact Hero'),
      features('How We Can Help', [
        { title: 'Free Consultation', desc: 'No-obligation call to discuss your needs and explore solutions.', icon: '📞' },
        { title: 'Quick Turnaround', desc: 'We respond to all enquiries within 24 hours.', icon: '⚡' },
        { title: 'Flexible Solutions', desc: 'Tailored packages to suit budgets of all sizes.', icon: '🎯' },
      ]),
      contactSection('Send Us a Message'),
      el('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#000', textAlign: 'center', width: '100%' }, mobile: { padding: '40px 24px' } }, [
        el('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto' } }, [
          el('heading', { text: 'Visit Us', level: 'h3' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as any, letterSpacing: '0.12em', marginBottom: '24px' } }),
          el('text', { text: '123 Business Street, Suite 100\nLondon, EC2A 1NT' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.8', whiteSpace: 'pre-line', marginBottom: '16px' } }),
          el('text', { text: 'hello@' + brand.toLowerCase().replace(/[^a-z]/g, '') + '.com  |  +44 20 7123 4567' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)' } }),
        ]),
      ], 'Location'),
      foot(brand),
    ]},
  ];
}

// ══════════════════════════════════════════════════════════════
//  TEMPLATES
// ══════════════════════════════════════════════════════════════

export const TEMPLATES_V2: DesignerTemplate[] = [
  // 1. AUTOMOTIVE
  {
    id: 'tpl-automotive', name: 'Automotive Dealership', description: 'Premium car showroom with vehicle showcase', category: 'Automotive',
    elements: [nav('AutoHaus', ['Inventory', 'Services', 'Finance', 'Contact']), hero('Drive Your\nDream', 'Luxury vehicles. Competitive finance. Exceptional service.', 'View Inventory', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=900&fit=crop'), foot('AutoHaus')],
    pages: makePages('AutoHaus', ['Inventory', 'Services', 'Finance', 'Contact'],
      [hero('Drive Your\nDream', 'Luxury vehicles. Competitive finance. Exceptional service.', 'View Inventory', 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=900&fit=crop'),
       stats([{ value: '500+', label: 'Vehicles' }, { value: '15', label: 'Years' }, { value: '4.9★', label: 'Rating' }]),
       features('Why Choose Us', [{ title: 'Premium Selection', desc: 'Handpicked luxury and performance vehicles.', icon: '🏎️' }, { title: 'Finance Options', desc: 'Flexible payments tailored to your budget.', icon: '💳' }, { title: 'Full Service', desc: 'In-house maintenance and warranty programs.', icon: '🔧' }])],
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=900&fit=crop', 'AutoHaus has been delivering exceptional automotive experiences for over 15 years.',
      'Our Services', [{ title: 'New Vehicles', desc: 'Latest models from premium manufacturers.', icon: '✨' }, { title: 'Pre-Owned', desc: 'Certified pre-owned with full history.', icon: '🔍' }, { title: 'Finance', desc: 'Competitive rates and flexible terms.', icon: '📊' }],
      [{ src: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop', alt: 'Car 1' }, { src: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop', alt: 'Car 2' }, { src: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&h=400&fit=crop', alt: 'Car 3' }]
    ),
  },

  // 2. PODCAST
  {
    id: 'tpl-podcast', name: 'Podcast', description: 'Dark cinematic podcast with episode showcase', category: 'Entertainment',
    elements: [nav('UNFILTERED', ['Episodes', 'Guests', 'About', 'Listen']), hero('Conversations\nThat Matter', 'Weekly deep dives with the world\'s most interesting minds.', 'Latest Episode', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=900&fit=crop'), foot('UNFILTERED')],
    pages: makePages('UNFILTERED', ['Episodes', 'Guests', 'About', 'Listen'],
      [hero('Conversations\nThat Matter', 'Weekly deep dives with the world\'s most interesting minds.', 'Latest Episode', 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=900&fit=crop'),
       stats([{ value: '200+', label: 'Episodes' }, { value: '1M+', label: 'Downloads' }, { value: '50+', label: 'Countries' }]),
       features('Listen On', [{ title: 'Apple Podcasts', desc: 'Subscribe and never miss an episode.', icon: '🎧' }, { title: 'Spotify', desc: 'Stream all episodes for free.', icon: '🎵' }, { title: 'YouTube', desc: 'Watch the video versions.', icon: '📺' }])],
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1200&h=900&fit=crop', 'UNFILTERED is a podcast that strips away the small talk to get to what really matters.',
      'Recent Guests', [{ title: 'Tech Founders', desc: 'Behind-the-scenes with Silicon Valley\'s boldest.', icon: '💡' }, { title: 'Authors', desc: 'The stories behind bestselling books.', icon: '📚' }, { title: 'Athletes', desc: 'Peak performance and mental resilience.', icon: '🏆' }],
      [{ src: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&h=400&fit=crop', alt: 'Studio' }, { src: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&h=400&fit=crop', alt: 'Mic' }, { src: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop', alt: 'Setup' }]
    ),
  },

  // 3. CONSULTING
  {
    id: 'tpl-consulting', name: 'Consulting Firm', description: 'Premium dark consulting with case studies', category: 'Professional',
    elements: [nav('Apex Advisory', ['Services', 'Case Studies', 'Team', 'Contact']), hero('Strategic Growth\nPartners', 'Management consulting for ambitious organisations.', 'Book Discovery Call', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=900&fit=crop'), foot('Apex Advisory')],
    pages: makePages('Apex Advisory', ['Services', 'Case Studies', 'Team', 'Contact'],
      [hero('Strategic Growth\nPartners', 'Management consulting for ambitious organisations.', 'Book Discovery Call', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=900&fit=crop'),
       stats([{ value: '$2B+', label: 'Revenue Generated' }, { value: '150+', label: 'Projects' }, { value: '35', label: 'Industries' }]),
       testimonials([{ quote: 'Apex transformed our go-to-market strategy. Revenue up 340%.', name: 'Sarah Chen', role: 'CEO, TechScale' }, { quote: 'The most impactful consulting engagement in our history.', name: 'James Wright', role: 'COO, Global Retail' }])],
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=900&fit=crop', 'Apex Advisory delivers transformational strategy and operational excellence.',
      'Our Practice Areas', [{ title: 'Growth Strategy', desc: 'Market entry, M&A, and revenue acceleration.', icon: '📈' }, { title: 'Operations', desc: 'Process optimisation and digital transformation.', icon: '⚙️' }, { title: 'People & Culture', desc: 'Leadership development and org design.', icon: '👥' }],
      [{ src: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop', alt: 'Strategy' }, { src: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop', alt: 'Team' }, { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', alt: 'Data' }]
    ),
  },

  // 4. VETERINARY
  {
    id: 'tpl-veterinary', name: 'Veterinary Clinic', description: 'Warm dark veterinary with emergency CTA', category: 'Healthcare',
    elements: [nav('PawCare Vets', ['Services', 'Team', 'Emergency', 'Book']), hero('Compassionate\nPet Healthcare', 'Expert veterinary care for your beloved companions.', 'Book Appointment', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=900&fit=crop'), foot('PawCare Vets')],
    pages: makePages('PawCare Vets', ['Services', 'Team', 'Emergency', 'Book'],
      [hero('Compassionate\nPet Healthcare', 'Expert veterinary care for your beloved companions.', 'Book Appointment', 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=900&fit=crop'),
       ctaSection('🚨 Emergency? Call Now', 'Our emergency team is available 24/7 for urgent cases.', 'Call Emergency Line'),
       features('Our Services', [{ title: 'Wellness Exams', desc: 'Comprehensive health checks and vaccinations.', icon: '🩺' }, { title: 'Surgery', desc: 'Advanced surgical procedures with full anaesthesia.', icon: '🏥' }, { title: 'Dental Care', desc: 'Professional cleanings and oral surgery.', icon: '🦷' }])],
      'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=900&fit=crop', 'PawCare has been providing exceptional veterinary care for over 20 years.',
      'Veterinary Services', [{ title: 'Preventive Care', desc: 'Regular check-ups, vaccinations, and parasite prevention.', icon: '💉' }, { title: 'Diagnostic Lab', desc: 'In-house blood work, X-rays, and ultrasound.', icon: '🔬' }, { title: 'Emergency Care', desc: '24/7 emergency treatment for critical conditions.', icon: '🚑' }],
      [{ src: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=400&fit=crop', alt: 'Dogs' }, { src: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=600&h=400&fit=crop', alt: 'Cat' }, { src: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop', alt: 'Puppy' }]
    ),
  },

  // 5. CAFE
  {
    id: 'tpl-cafe', name: 'Coffee Shop', description: 'Warm artisan cafe with menu display', category: 'Food & Drink',
    elements: [nav('Brew & Co', ['Menu', 'Our Story', 'Locations', 'Order']), fullHero('Crafted\nWith Care', 'Specialty coffee roasted in-house daily.', 'View Menu', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&h=1080&fit=crop'), foot('Brew & Co')],
    pages: makePages('Brew & Co', ['Menu', 'Our Story', 'Locations', 'Order'],
      [fullHero('Crafted\nWith Care', 'Specialty coffee roasted in-house daily.', 'View Menu', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1920&h=1080&fit=crop'),
       features('Our Offerings', [{ title: 'Single Origin', desc: 'Ethically sourced beans from around the world.', icon: '☕' }, { title: 'Fresh Pastries', desc: 'Baked in-house every morning by our pastry chef.', icon: '🥐' }, { title: 'Signature Blends', desc: 'Unique house blends you won\'t find anywhere else.', icon: '✨' }]),
       gallery('Our Space', [{ src: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop', alt: 'Interior' }, { src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop', alt: 'Coffee' }, { src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop', alt: 'Latte Art' }])],
      'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1200&h=900&fit=crop', 'Brew & Co started with a simple mission: serve the best coffee in town.',
      'Menu Highlights', [{ title: 'Espresso Bar', desc: 'Classic espresso drinks crafted with precision.', icon: '☕' }, { title: 'Pour Over', desc: 'Hand-poured single origins to order.', icon: '🫖' }, { title: 'Cold Brew', desc: '24-hour steeped cold brew on tap.', icon: '🧊' }],
      [{ src: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop', alt: 'Coffee' }, { src: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=400&fit=crop', alt: 'Latte' }, { src: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&h=400&fit=crop', alt: 'Beans' }]
    ),
  },

  // 6. NONPROFIT
  {
    id: 'tpl-nonprofit', name: 'Nonprofit Organisation', description: 'Impact-driven dark nonprofit with donation CTA', category: 'Nonprofit',
    elements: [nav('HopeForward', ['Mission', 'Programs', 'Impact', 'Donate']), fullHero('Building a\nBetter Tomorrow', 'Empowering communities through education and opportunity.', 'Donate Now', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&h=1080&fit=crop'), foot('HopeForward')],
    pages: makePages('HopeForward', ['Mission', 'Programs', 'Impact', 'Donate'],
      [fullHero('Building a\nBetter Tomorrow', 'Empowering communities through education and opportunity.', 'Donate Now', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1920&h=1080&fit=crop'),
       stats([{ value: '50K+', label: 'Lives Changed' }, { value: '12', label: 'Countries' }, { value: '95%', label: 'To Programs' }]),
       features('Our Programs', [{ title: 'Education', desc: 'Building schools and training teachers in underserved areas.', icon: '📚' }, { title: 'Clean Water', desc: 'Installing wells and water purification systems.', icon: '💧' }, { title: 'Healthcare', desc: 'Mobile clinics bringing care to remote communities.', icon: '❤️' }])],
      'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=900&fit=crop', 'HopeForward believes every person deserves access to education, clean water, and healthcare.',
      'How We Help', [{ title: 'Direct Aid', desc: 'On-the-ground support where it\'s needed most.', icon: '🤝' }, { title: 'Capacity Building', desc: 'Training local leaders for lasting impact.', icon: '🌱' }, { title: 'Advocacy', desc: 'Driving policy change at national and international levels.', icon: '📢' }],
      [{ src: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop', alt: 'Community' }, { src: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=600&h=400&fit=crop', alt: 'Volunteer' }, { src: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop', alt: 'Impact' }]
    ),
  },

  // 7. CONSTRUCTION
  {
    id: 'tpl-construction', name: 'Construction Company', description: 'Bold dark construction with project gallery', category: 'Trade',
    elements: [nav('IronBuild', ['Projects', 'Services', 'About', 'Quote']), hero('Building\nExcellence', 'Commercial and residential construction, delivered on time.', 'Get a Quote', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=900&fit=crop'), foot('IronBuild')],
    pages: makePages('IronBuild', ['Projects', 'Services', 'About', 'Quote'],
      [hero('Building\nExcellence', 'Commercial and residential construction, delivered on time.', 'Get a Quote', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=900&fit=crop'),
       stats([{ value: '200+', label: 'Projects' }, { value: '25', label: 'Years' }, { value: '100%', label: 'Insured' }]),
       gallery('Recent Projects', [{ src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop', alt: 'Site' }, { src: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop', alt: 'Build' }, { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop', alt: 'Complete' }])],
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=900&fit=crop', 'IronBuild has been constructing landmark projects for 25 years.',
      'Our Services', [{ title: 'Commercial', desc: 'Office buildings, retail spaces, and warehouses.', icon: '🏢' }, { title: 'Residential', desc: 'Custom homes, renovations, and extensions.', icon: '🏠' }, { title: 'Civil', desc: 'Roads, bridges, and infrastructure projects.', icon: '🌉' }],
      [{ src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop', alt: 'Build 1' }, { src: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&h=400&fit=crop', alt: 'Build 2' }, { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop', alt: 'Build 3' }]
    ),
  },

  // 8. CLEANING SERVICES
  {
    id: 'tpl-cleaning', name: 'Cleaning Services', description: 'Fresh dark cleaning with pricing packages', category: 'Trade',
    elements: [nav('SparkClean', ['Services', 'Pricing', 'Reviews', 'Book']), hero('Spotless.\nEvery Time.', 'Professional cleaning for homes and businesses.', 'Get a Quote', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=900&fit=crop'), foot('SparkClean')],
    pages: makePages('SparkClean', ['Services', 'Pricing', 'Reviews', 'Book'],
      [hero('Spotless.\nEvery Time.', 'Professional cleaning for homes and businesses.', 'Get a Quote', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=900&fit=crop'),
       features('Our Services', [{ title: 'Residential', desc: 'Regular home cleaning and deep cleans.', icon: '🏠' }, { title: 'Commercial', desc: 'Office and retail space cleaning.', icon: '🏢' }, { title: 'Specialist', desc: 'End of tenancy, post-construction, and carpet cleaning.', icon: '✨' }]),
       testimonials([{ quote: 'Our office has never looked better. Reliable and thorough every week.', name: 'Emma Taylor', role: 'Office Manager' }, { quote: 'Brilliant end of tenancy clean. Got our full deposit back!', name: 'Mark Davies', role: 'Tenant' }])],
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=900&fit=crop', 'SparkClean delivers reliable, eco-friendly cleaning with a 100% satisfaction guarantee.',
      'Cleaning Packages', [{ title: 'Standard Clean', desc: 'Regular maintenance clean for homes and offices.', icon: '🧹' }, { title: 'Deep Clean', desc: 'Intensive top-to-bottom cleaning.', icon: '🧽' }, { title: 'Move In/Out', desc: 'Complete property clean for transitions.', icon: '📦' }],
      [{ src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600&h=400&fit=crop', alt: 'Clean 1' }, { src: 'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=600&h=400&fit=crop', alt: 'Clean 2' }, { src: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=600&h=400&fit=crop', alt: 'Clean 3' }]
    ),
  },

  // 9. DENTAL
  {
    id: 'tpl-dental', name: 'Dental Practice', description: 'Premium dark dental with treatment cards', category: 'Healthcare',
    elements: [nav('BrightSmile', ['Treatments', 'Team', 'Smile Gallery', 'Book']), hero('Your Best\nSmile Starts Here', 'Advanced cosmetic and general dentistry.', 'Book Appointment', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&h=900&fit=crop'), foot('BrightSmile')],
    pages: makePages('BrightSmile', ['Treatments', 'Team', 'Smile Gallery', 'Book'],
      [hero('Your Best\nSmile Starts Here', 'Advanced cosmetic and general dentistry.', 'Book Appointment', 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&h=900&fit=crop'),
       features('Treatments', [{ title: 'Invisalign', desc: 'Clear aligners for a straighter smile.', icon: '😁' }, { title: 'Whitening', desc: 'Professional whitening for dramatic results.', icon: '✨' }, { title: 'Implants', desc: 'Permanent tooth replacement solutions.', icon: '🦷' }, { title: 'Veneers', desc: 'Custom porcelain veneers for a perfect smile.', icon: '💎' }]),
       stats([{ value: '15K+', label: 'Patients' }, { value: '20', label: 'Years' }, { value: '4.9★', label: 'Rating' }])],
      'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1200&h=900&fit=crop', 'BrightSmile Dental provides state-of-the-art dental care in a comfortable, modern environment.',
      'Our Treatments', [{ title: 'General Dentistry', desc: 'Check-ups, fillings, and preventive care.', icon: '🩺' }, { title: 'Cosmetic', desc: 'Whitening, veneers, and smile makeovers.', icon: '💫' }, { title: 'Orthodontics', desc: 'Braces and clear aligners for all ages.', icon: '📐' }],
      [{ src: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop', alt: 'Dental 1' }, { src: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop', alt: 'Dental 2' }, { src: 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&h=400&fit=crop', alt: 'Dental 3' }]
    ),
  },

  // 10. FLORIST
  {
    id: 'tpl-florist', name: 'Florist & Gift Shop', description: 'Elegant dark florist with product showcase', category: 'Retail',
    elements: [nav('Bloom', ['Shop', 'Occasions', 'Delivery', 'Contact']), hero('Flowers.\nArranged\nWith Love.', 'Handcrafted bouquets for every occasion.', 'Shop Now', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&h=900&fit=crop'), foot('Bloom')],
    pages: makePages('Bloom', ['Shop', 'Occasions', 'Delivery', 'Contact'],
      [hero('Flowers.\nArranged\nWith Love.', 'Handcrafted bouquets for every occasion.', 'Shop Now', 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&h=900&fit=crop'),
       features('By Occasion', [{ title: 'Weddings', desc: 'Bespoke bridal bouquets and venue floristry.', icon: '💐' }, { title: 'Sympathy', desc: 'Thoughtful tributes and funeral flowers.', icon: '🕊️' }, { title: 'Celebrations', desc: 'Birthdays, anniversaries, and thank you.', icon: '🎉' }]),
       gallery('Our Arrangements', [{ src: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=400&fit=crop', alt: 'Bouquet 1' }, { src: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600&h=400&fit=crop', alt: 'Bouquet 2' }, { src: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&h=400&fit=crop', alt: 'Bouquet 3' }])],
      'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&h=900&fit=crop', 'Bloom creates stunning floral arrangements using the freshest seasonal flowers.',
      'Our Collections', [{ title: 'Seasonal', desc: 'Fresh arrangements featuring seasonal blooms.', icon: '🌸' }, { title: 'Luxury', desc: 'Premium roses, orchids, and exotic flowers.', icon: '🌹' }, { title: 'Plants', desc: 'Indoor plants and succulent arrangements.', icon: '🪴' }],
      [{ src: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=400&fit=crop', alt: 'Flowers 1' }, { src: 'https://images.unsplash.com/photo-1490750967868-88aa4f44baee?w=600&h=400&fit=crop', alt: 'Flowers 2' }, { src: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&h=400&fit=crop', alt: 'Flowers 3' }]
    ),
  },

  // 11. PERSONAL TRAINER
  {
    id: 'tpl-personal-trainer', name: 'Personal Trainer', description: 'Bold dark fitness with transformation gallery', category: 'Fitness',
    elements: [nav('FORGE', ['Programs', 'Transformations', 'About', 'Book']), fullHero('Transform\nYour Body', 'Elite personal training. Real results.', 'Start Your Journey', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop'), foot('FORGE')],
    pages: makePages('FORGE', ['Programs', 'Transformations', 'About', 'Book'],
      [fullHero('Transform\nYour Body', 'Elite personal training. Real results.', 'Start Your Journey', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop'),
       stats([{ value: '500+', label: 'Clients' }, { value: '10K+', label: 'Sessions' }, { value: '100%', label: 'Commitment' }]),
       features('Programs', [{ title: 'Strength', desc: '12-week progressive strength building program.', icon: '💪' }, { title: 'Fat Loss', desc: 'Nutrition-backed fat loss transformation.', icon: '🔥' }, { title: 'Athletic', desc: 'Sport-specific conditioning and performance.', icon: '⚡' }])],
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=900&fit=crop', 'FORGE Fitness delivers results-driven personal training with a proven methodology.',
      'Training Programs', [{ title: '1-on-1 Training', desc: 'Fully customised training and nutrition plans.', icon: '🎯' }, { title: 'Small Group', desc: '4-person group sessions for motivation and value.', icon: '👥' }, { title: 'Online Coaching', desc: 'Remote coaching with app-based tracking.', icon: '📱' }],
      [{ src: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop', alt: 'Gym' }, { src: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&h=400&fit=crop', alt: 'Training' }, { src: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=400&fit=crop', alt: 'Workout' }]
    ),
  },

  // 12. WEDDING PLANNER
  {
    id: 'tpl-wedding', name: 'Wedding Planner', description: 'Elegant dark wedding planning with portfolio', category: 'Events',
    elements: [nav('Eternité', ['Services', 'Portfolio', 'About', 'Enquire']), hero('Your Dream\nWedding, Designed', 'Luxury wedding planning for unforgettable celebrations.', 'Start Planning', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=900&fit=crop'), foot('Eternité')],
    pages: makePages('Eternité', ['Services', 'Portfolio', 'About', 'Enquire'],
      [hero('Your Dream\nWedding, Designed', 'Luxury wedding planning for unforgettable celebrations.', 'Start Planning', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=900&fit=crop'),
       stats([{ value: '300+', label: 'Weddings' }, { value: '15', label: 'Years' }, { value: '5★', label: 'Reviews' }]),
       testimonials([{ quote: 'Our wedding was absolute perfection. We couldn\'t have done it without Eternité.', name: 'Sophie & Tom', role: 'London Wedding' }])],
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=900&fit=crop', 'Eternité creates bespoke wedding experiences that reflect your unique love story.',
      'Our Packages', [{ title: 'Full Planning', desc: 'From engagement to honeymoon — we handle everything.', icon: '💍' }, { title: 'Partial Planning', desc: 'Support where you need it most.', icon: '📋' }, { title: 'Day Coordination', desc: 'Seamless on-the-day management.', icon: '🎪' }],
      [{ src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop', alt: 'Wedding 1' }, { src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&h=400&fit=crop', alt: 'Wedding 2' }, { src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&h=400&fit=crop', alt: 'Wedding 3' }]
    ),
  },
];

export const TEMPLATE_CATEGORIES_V2 = ['Automotive', 'Entertainment', 'Professional', 'Healthcare', 'Food & Drink', 'Nonprofit', 'Trade', 'Retail', 'Fitness', 'Events'];
