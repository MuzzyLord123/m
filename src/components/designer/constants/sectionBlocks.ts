import { EditorElement } from '../types';
import { PREMIUM_SECTION_BLOCKS } from './premiumSections';
import { PREMIUM_SECTION_BLOCKS_V2 } from './premiumSectionsV2';
import { PREMIUM_SECTION_BLOCKS_V3 } from './premiumSectionsV3';
import { PREMIUM_SECTION_BLOCKS_V4 } from './premiumSectionsV4';
import { PREMIUM_SECTION_BLOCKS_V5 } from './premiumSectionsV5';
import { PREMIUM_SECTION_BLOCKS_V6 } from './premiumSectionsV6';
import { PREMIUM_SECTION_BLOCKS_V7 } from './premiumSectionsV7';
import { PREMIUM_SECTION_BLOCKS_V8 } from './premiumSectionsV8';
import { PREMIUM_SECTION_BLOCKS_V9 } from './premiumSectionsV9';
import { PREMIUM_SECTION_BLOCKS_V10 } from './premiumSectionsV10';
import { PRODUCT_PAGE_TEMPLATES } from './productPageTemplates';

let _sc = 0;
function sid(): string {
  _sc++;
  return `sec-${_sc}-${Math.random().toString(36).slice(2, 7)}`;
}

function s(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: sid(), type, name: name ?? type, props, styles, children };
}

export type SectionCategory =
  | 'Navbars' | 'Heroes' | 'Features' | 'Content' | 'CTA'
  | 'Testimonials' | 'Pricing' | 'FAQ' | 'Team' | 'Stats'
  | 'Gallery' | 'Logos' | 'Contact' | 'Footers' | 'Blog'
  | 'Ecommerce' | 'Forms' | 'Banners'
  | 'Portfolio' | 'About' | 'Comparison' | 'Error' | 'Animated'
  | 'Interactive' | 'Product Pages';

export interface SectionBlock {
  id: string;
  name: string;
  category: SectionCategory;
  description: string;
  thumbnail?: string;
  elements: EditorElement[];
}

// ════════════════════════════════════════════════════════════════════
//  NAVBARS — 10 layouts
// ════════════════════════════════════════════════════════════════════

function navLinks(links: string[], color: string) {
  return links.map(l => s('link', { text: l, href: '#' }, { desktop: { fontSize: '13px', color, textDecoration: 'none', fontWeight: '500', letterSpacing: '0.02em' } }));
}

function navBtn(text: string, style: 'solid' | 'outline' = 'solid') {
  return s('button', { text, href: '#' }, { desktop: { padding: '10px 24px', backgroundColor: style === 'solid' ? '#fff' : 'transparent', color: style === 'solid' ? '#000' : '#fff', borderRadius: '0', fontSize: '12px', fontWeight: '600', border: style === 'outline' ? '1px solid rgba(255,255,255,0.2)' : 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any } });
}

const NAVBARS: SectionBlock[] = [
  {
    id: 'nav-logo-left', name: 'Logo Left — Classic', category: 'Navbars',
    description: 'Logo on left, links center, CTA right',
    elements: [s('navbar', { brand: 'Brand' }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', width: '100%', backgroundColor: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '16px 20px' } }, [
      s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '32px', alignItems: 'center' }, mobile: { display: 'none' } }, navLinks(['Home', 'About', 'Services', 'Work', 'Contact'], 'rgba(255,255,255,0.6)')),
      navBtn('Get Started'),
    ], 'Navigation')],
  },
  {
    id: 'nav-logo-center', name: 'Logo Center — Symmetrical', category: 'Navbars',
    description: 'Logo centered with links on both sides',
    elements: [s('navbar', { brand: 'Brand' }, { desktop: { display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 60px', width: '100%', backgroundColor: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: '48px' }, mobile: { padding: '16px 20px', justifyContent: 'space-between' } }, [
      s('container', {}, { desktop: { display: 'flex', gap: '28px' }, mobile: { display: 'none' } }, navLinks(['Home', 'About', 'Services'], 'rgba(255,255,255,0.6)')),
      s('heading', { text: 'STUDIO', level: 'h3' }, { desktop: { fontSize: '22px', fontWeight: '800', color: '#fff', letterSpacing: '0.12em' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '28px' }, mobile: { display: 'none' } }, navLinks(['Work', 'Blog', 'Contact'], 'rgba(255,255,255,0.6)')),
    ], 'Navigation')],
  },
  {
    id: 'nav-logo-right', name: 'Logo Right — Reversed', category: 'Navbars',
    description: 'Links on left, logo on right side',
    elements: [s('navbar', { brand: 'Brand' }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', width: '100%', backgroundColor: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '16px 20px', flexDirection: 'row-reverse' } }, [
      s('container', {}, { desktop: { display: 'flex', gap: '32px' }, mobile: { display: 'none' } }, navLinks(['About', 'Services', 'Portfolio', 'Contact'], 'rgba(255,255,255,0.6)')),
      s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em' } }),
    ], 'Navigation')],
  },
  {
    id: 'nav-transparent', name: 'Transparent Overlay', category: 'Navbars',
    description: 'Transparent glass navbar with blur backdrop',
    elements: [s('navbar', { brand: 'Brand' }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 60px', width: '100%', backgroundColor: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }, mobile: { padding: '16px 20px' } }, [
      s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', letterSpacing: '0.08em' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '32px', alignItems: 'center' }, mobile: { display: 'none' } }, [...navLinks(['Home', 'Work', 'About', 'Contact'], 'rgba(255,255,255,0.7)'), navBtn('Enquire', 'outline')]),
    ], 'Navigation')],
  },
  {
    id: 'nav-minimal', name: 'Minimal — Logo + Menu', category: 'Navbars',
    description: 'Ultra-clean with only logo and hamburger icon text',
    elements: [s('navbar', { brand: 'Brand' }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 60px', width: '100%', backgroundColor: '#000' }, mobile: { padding: '20px 24px' } }, [
      s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '0.12em' } }),
      s('text', { text: 'MENU' }, { desktop: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em', cursor: 'pointer' } }),
    ], 'Navigation')],
  },
  {
    id: 'nav-mega', name: 'Mega Menu Ready', category: 'Navbars',
    description: 'Full-width navbar with dropdown-ready structure',
    elements: [s('navbar', { brand: 'Brand' }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 60px', width: '100%', backgroundColor: '#000', height: '80px', borderBottom: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '0 20px', height: '64px' } }, [
      s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '0', alignItems: 'center', height: '100%' }, mobile: { display: 'none' } }, ['Products ▾', 'Solutions ▾', 'Resources ▾', 'Pricing'].map(l =>
        s('link', { text: l, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: '500', padding: '0 20px', height: '100%', display: 'flex', alignItems: 'center', borderBottom: '2px solid transparent' } })
      )),
      s('container', {}, { desktop: { display: 'flex', gap: '12px', alignItems: 'center' } }, [navBtn('Sign In', 'outline'), navBtn('Get Started')]),
    ], 'Navigation')],
  },
  {
    id: 'nav-split', name: 'Split — Dark/Light', category: 'Navbars',
    description: 'Half dark, half light split navbar',
    elements: [s('navbar', { brand: 'Brand' }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0', width: '100%', backgroundColor: '#000', height: '72px' }, mobile: { padding: '0 20px', height: '64px' } }, [
      s('container', {}, { desktop: { display: 'flex', alignItems: 'center', height: '100%', padding: '0 40px', backgroundColor: '#000', flex: '1' } }, [
        s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em' } }),
      ]),
      s('container', {}, { desktop: { display: 'flex', alignItems: 'center', height: '100%', padding: '0 40px', backgroundColor: '#111', gap: '28px' }, mobile: { display: 'none' } }, [...navLinks(['Work', 'About', 'Services', 'Contact'], 'rgba(255,255,255,0.6)')]),
    ], 'Navigation')],
  },
  {
    id: 'nav-stacked', name: 'Stacked — Two Rows', category: 'Navbars',
    description: 'Logo row on top, navigation row below',
    elements: [s('section', {}, { desktop: { width: '100%', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', padding: '24px 60px', borderBottom: '1px solid rgba(255,255,255,0.04)' } }, [
        s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '800', color: '#fff', letterSpacing: '0.15em', textAlign: 'center' } }),
      ]),
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '40px', padding: '14px 60px', borderBottom: '1px solid rgba(255,255,255,0.06)' }, mobile: { display: 'none' } }, navLinks(['Home', 'About', 'Services', 'Portfolio', 'Blog', 'Contact'], 'rgba(255,255,255,0.5)')),
    ], 'Navigation')],
  },
  {
    id: 'nav-light', name: 'Light — Clean White', category: 'Navbars',
    description: 'White navbar with dark text, minimal border',
    elements: [s('navbar', { brand: 'Brand' }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', width: '100%', backgroundColor: '#ffffff', borderBottom: '1px solid #f0f0f0' }, mobile: { padding: '16px 20px' } }, [
      s('heading', { text: 'Brand', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#111', letterSpacing: '-0.01em' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '32px', alignItems: 'center' }, mobile: { display: 'none' } }, navLinks(['About', 'Services', 'Work', 'Contact'], '#666')),
      s('button', { text: 'Get Started', href: '#' }, { desktop: { padding: '10px 24px', backgroundColor: '#111', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: '600', border: 'none' } }),
    ], 'Navigation')],
  },
  {
    id: 'nav-bordered', name: 'Bordered — Boxed Logo', category: 'Navbars',
    description: 'Logo inside bordered box with clean layout',
    elements: [s('navbar', { brand: 'Brand' }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 60px', width: '100%', backgroundColor: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '12px 20px' } }, [
      s('container', {}, { desktop: { border: '1px solid rgba(255,255,255,0.15)', padding: '8px 16px', display: 'inline-flex' } }, [
        s('heading', { text: 'BR', level: 'h3' }, { desktop: { fontSize: '14px', fontWeight: '800', color: '#fff', letterSpacing: '0.15em' } }),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '28px', alignItems: 'center' }, mobile: { display: 'none' } }, [...navLinks(['About', 'Work', 'Services', 'Contact'], 'rgba(255,255,255,0.5)'), navBtn('Enquire')]),
    ], 'Navigation')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  HEROES — 15 variants
// ════════════════════════════════════════════════════════════════════

const HEROES: SectionBlock[] = [
  {
    id: 'hero-split-left', name: 'Split — Text Left', category: 'Heroes', description: 'Text on left, image on right, dark bg',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '90vh', backgroundColor: '#000' }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
      s('container', {}, { desktop: { padding: '100px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '60px 24px' } }, [
        s('badge', { text: 'NEW RELEASE' }, { desktop: { padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderRadius: '2px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '24px', letterSpacing: '0.12em' } }),
        s('heading', { text: 'Design Without\nCompromise', level: 'h1' }, { desktop: { fontSize: '58px', fontWeight: '700', color: '#fff', lineHeight: '1.06', letterSpacing: '-0.03em', marginBottom: '24px' }, mobile: { fontSize: '36px' } }),
        s('text', { text: 'Build exceptional digital experiences with precision, speed, and unmatched quality.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '40px', maxWidth: '420px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
          s('button', { text: 'Get Started', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
          s('button', { text: 'Learn More', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: 'transparent', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
        ]),
      ]),
      s('container', {}, { desktop: { overflow: 'hidden' } }, [
        s('image', { src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=900&fit=crop', alt: 'Hero' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ]),
    ], 'Hero')],
  },
  {
    id: 'hero-split-right', name: 'Split — Text Right', category: 'Heroes', description: 'Image on left, text on right',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '90vh', backgroundColor: '#000' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { overflow: 'hidden' } }, [
        s('image', { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=900&fit=crop', alt: 'Hero' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ]),
      s('container', {}, { desktop: { padding: '100px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '60px 24px' } }, [
        s('heading', { text: 'We Build What\nOthers Can\'t', level: 'h1' }, { desktop: { fontSize: '54px', fontWeight: '700', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.03em', marginBottom: '24px' }, mobile: { fontSize: '34px' } }),
        s('text', { text: 'Award-winning digital products crafted with obsessive attention to detail.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '40px', maxWidth: '420px' } }),
        s('button', { text: 'View Our Work', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any, width: 'fit-content' } }),
      ]),
    ], 'Hero')],
  },
  {
    id: 'hero-fullscreen', name: 'Fullscreen — Center', category: 'Heroes', description: 'Full-viewport hero with centered text',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' } }, [
      s('container', {}, { desktop: { position: 'absolute', inset: '0', backgroundColor: 'rgba(0,0,0,0.6)' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '1', textAlign: 'center', maxWidth: '800px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        s('heading', { text: 'Elevate Your\nDigital Presence', level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '700', color: '#fff', lineHeight: '1.04', letterSpacing: '-0.04em', marginBottom: '24px' }, mobile: { fontSize: '40px' } }),
        s('text', { text: 'We create digital experiences that inspire, engage, and convert.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.6)', marginBottom: '40px', lineHeight: '1.7' } }),
        s('button', { text: 'Explore', href: '#' }, { desktop: { padding: '18px 52px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.1em', textTransform: 'uppercase' as any } }),
      ]),
    ], 'Hero')],
  },
  {
    id: 'hero-fullscreen-left', name: 'Fullscreen — Left Align', category: 'Heroes', description: 'Full-viewport with left-aligned copy',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', backgroundImage: 'url(https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' } }, [
      s('container', {}, { desktop: { position: 'absolute', inset: '0', backgroundColor: 'rgba(0,0,0,0.65)' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '1', padding: '0 80px', maxWidth: '700px' }, mobile: { padding: '0 24px' } }, [
        s('heading', { text: 'Strategy That\nDrives Growth', level: 'h1' }, { desktop: { fontSize: '62px', fontWeight: '700', color: '#fff', lineHeight: '1.06', letterSpacing: '-0.03em', marginBottom: '24px' }, mobile: { fontSize: '38px' } }),
        s('text', { text: 'Trusted by industry leaders to deliver results that exceed expectations.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.7', marginBottom: '40px' } }),
        s('button', { text: 'Get Started', href: '#' }, { desktop: { padding: '18px 44px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
      ]),
    ], 'Hero')],
  },
  {
    id: 'hero-gradient', name: 'Gradient — Bold', category: 'Heroes', description: 'Gradient background with large typography',
    elements: [s('section', {}, { desktop: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #000 0%, #0a0a2e 50%, #000 100%)', textAlign: 'center', padding: '80px 40px' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '900px' } }, [
        s('badge', { text: 'INTRODUCING V2.0' }, { desktop: { padding: '6px 16px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '2px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '32px', letterSpacing: '0.12em' } }),
        s('heading', { text: 'The Future of\nDigital Creation', level: 'h1' }, { desktop: { fontSize: '76px', fontWeight: '700', color: '#fff', lineHeight: '1.04', letterSpacing: '-0.04em', marginBottom: '28px' }, mobile: { fontSize: '42px' } }),
        s('text', { text: 'Build, ship, and scale your digital products with unprecedented speed and precision.' }, { desktop: { fontSize: '19px', color: 'rgba(255,255,255,0.45)', marginBottom: '44px', lineHeight: '1.6', maxWidth: '560px', margin: '0 auto 44px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center' } }, [
          s('button', { text: 'Start Free', href: '#' }, { desktop: { padding: '18px 44px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em' } }),
          s('button', { text: 'View Demo', href: '#' }, { desktop: { padding: '18px 44px', backgroundColor: 'transparent', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)', letterSpacing: '0.06em' } }),
        ]),
      ]),
    ], 'Hero')],
  },
  {
    id: 'hero-video-bg', name: 'Video Background', category: 'Heroes', description: 'Hero section with video/image background placeholder',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' } }, [
      s('image', { src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&h=1080&fit=crop', alt: 'Background' }, { desktop: { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover', opacity: '0.4' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '1', textAlign: 'center', maxWidth: '700px' }, mobile: { padding: '0 24px' } }, [
        s('heading', { text: 'IMMERSIVE\nEXPERIENCES', level: 'h1' }, { desktop: { fontSize: '68px', fontWeight: '800', color: '#fff', lineHeight: '1.04', letterSpacing: '-0.02em', marginBottom: '20px' }, mobile: { fontSize: '38px' } }),
        s('text', { text: 'Pushing the boundaries of digital storytelling.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '36px' } }),
        s('button', { text: 'Play Reel', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: 'transparent', color: '#fff', borderRadius: '40px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.25)', letterSpacing: '0.08em' } }),
      ]),
    ], 'Hero')],
  },
  {
    id: 'hero-minimal-text', name: 'Minimal — Text Only', category: 'Heroes', description: 'Pure typographic hero, no imagery',
    elements: [s('section', {}, { desktop: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: '80px 60px', textAlign: 'center' }, mobile: { padding: '60px 24px', minHeight: '60vh' } }, [
      s('container', {}, { desktop: { maxWidth: '800px' } }, [
        s('heading', { text: 'We design\nexperiences that\nmatter.', level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '700', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.04em' }, mobile: { fontSize: '38px' } }),
      ]),
    ], 'Hero')],
  },
  {
    id: 'hero-stacked-image', name: 'Stacked — Image Below', category: 'Heroes', description: 'Text on top, full-width image below',
    elements: [s('section', {}, { desktop: { backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { padding: '120px 60px 60px', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }, mobile: { padding: '80px 24px 40px' } }, [
        s('heading', { text: 'Beautiful Products.\nExceptional Results.', level: 'h1' }, { desktop: { fontSize: '60px', fontWeight: '700', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.03em', marginBottom: '20px' }, mobile: { fontSize: '36px' } }),
        s('text', { text: 'We craft digital experiences that captivate users and drive business growth.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', marginBottom: '36px', lineHeight: '1.6' } }),
        s('button', { text: 'See Our Work', href: '#' }, { desktop: { padding: '16px 40px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
      ]),
      s('container', {}, { desktop: { padding: '0 60px 0', maxWidth: '1200px', margin: '0 auto' }, mobile: { padding: '0 16px' } }, [
        s('image', { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1400&h=700&fit=crop', alt: 'Product' }, { desktop: { width: '100%', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' } }),
      ]),
    ], 'Hero')],
  },
  {
    id: 'hero-asymmetric', name: 'Asymmetric Grid', category: 'Heroes', description: '60/40 split with offset imagery',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '3fr 2fr', minHeight: '85vh', backgroundColor: '#0a0a0a', gap: '0' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { padding: '120px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '60px 24px' } }, [
        s('text', { text: 'DIGITAL AGENCY' }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: '24px', textTransform: 'uppercase' as any } }),
        s('heading', { text: 'Crafting Digital\nMasterpieces\nSince 2015', level: 'h1' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#fff', lineHeight: '1.1', letterSpacing: '-0.03em', marginBottom: '28px' }, mobile: { fontSize: '34px' } }),
        s('text', { text: '200+ projects delivered across 30 countries. We transform ambitious visions into pixel-perfect reality.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', maxWidth: '400px', marginBottom: '40px' } }),
        s('button', { text: 'Start a Project', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '12px', fontWeight: '700', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any, width: 'fit-content' } }),
      ]),
      s('container', {}, { desktop: { overflow: 'hidden', position: 'relative' } }, [
        s('image', { src: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=1000&fit=crop', alt: 'Creative' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ]),
    ], 'Hero')],
  },
  {
    id: 'hero-big-number', name: 'Big Number Hero', category: 'Heroes', description: 'Large statistic as the hero focal point',
    elements: [s('section', {}, { desktop: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', padding: '80px 60px', textAlign: 'center' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '700px' } }, [
        s('heading', { text: '10x', level: 'h1' }, { desktop: { fontSize: '180px', fontWeight: '800', color: '#fff', letterSpacing: '-0.06em', lineHeight: '0.9', marginBottom: '20px' }, mobile: { fontSize: '100px' } }),
        s('heading', { text: 'Faster Development', level: 'h2' }, { desktop: { fontSize: '28px', fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: '-0.02em', marginBottom: '16px' } }),
        s('text', { text: 'Ship products at unprecedented speed without compromising on quality or scalability.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.7', maxWidth: '450px', margin: '0 auto' } }),
      ]),
    ], 'Hero')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  FEATURES — 12 variants
// ════════════════════════════════════════════════════════════════════

function featureGrid(title: string, sub: string, features: { title: string; desc: string }[], opts: { bg?: string; cols?: number; style?: 'cards' | 'minimal' | 'icon' } = {}) {
  const bg = opts.bg || '#0a0a0a';
  const cardBg = bg === '#0a0a0a' ? '#111' : '#f7f7f7';
  const cols = opts.cols || 3;
  return s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: bg } }, [
    s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', marginBottom: '64px' } }, [
      s('heading', { text: title, level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: bg === '#0a0a0a' ? '#fff' : '#111', letterSpacing: '-0.02em', marginBottom: '16px' } }),
      s('text', { text: sub }, { desktop: { fontSize: '17px', color: bg === '#0a0a0a' ? 'rgba(255,255,255,0.45)' : '#888', maxWidth: '500px', lineHeight: '1.6' } }),
    ]),
    s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } },
      features.map(f => s('card', {}, { desktop: { padding: '40px', backgroundColor: cardBg, borderRadius: opts.style === 'minimal' ? '0' : '12px', border: bg === '#0a0a0a' ? '1px solid #1a1a1a' : 'none' } }, [
        s('heading', { text: f.title, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: bg === '#0a0a0a' ? '#fff' : '#111', marginBottom: '12px', letterSpacing: '-0.01em' } }),
        s('text', { text: f.desc }, { desktop: { color: bg === '#0a0a0a' ? 'rgba(255,255,255,0.4)' : '#888', fontSize: '14px', lineHeight: '1.7' } }),
      ]))
    ),
  ], title);
}

const FEATURES: SectionBlock[] = [
  { id: 'feat-3col-dark', name: '3 Column — Dark Cards', category: 'Features', description: 'Three feature cards on dark background',
    elements: [featureGrid('Why Choose Us', 'Everything you need to succeed.', [
      { title: 'Lightning Fast', desc: 'Built for performance from the ground up. Every millisecond counts.' },
      { title: 'Enterprise Security', desc: 'SOC2, GDPR, and ISO 27001 compliant out of the box.' },
      { title: 'Global Scale', desc: 'Edge network across 200+ locations for sub-50ms latency worldwide.' },
    ])] },
  { id: 'feat-2col-dark', name: '2 Column — Dark', category: 'Features', description: 'Two wide feature cards',
    elements: [featureGrid('Core Capabilities', 'Built for teams that demand more.', [
      { title: 'Real-Time Collaboration', desc: 'Edit documents simultaneously with your team. See changes as they happen.' },
      { title: 'Advanced Analytics', desc: 'Track every metric that matters. Custom dashboards and automated reports.' },
    ], { cols: 2 })] },
  { id: 'feat-4col-dark', name: '4 Column — Grid', category: 'Features', description: 'Four feature cards in a grid',
    elements: [featureGrid('Platform Features', 'A complete toolkit for modern teams.', [
      { title: 'API First', desc: 'RESTful APIs with comprehensive documentation and SDKs.' },
      { title: 'Webhooks', desc: 'Real-time event notifications for seamless integrations.' },
      { title: 'SSO & SAML', desc: 'Enterprise-grade authentication for your entire organisation.' },
      { title: '24/7 Support', desc: 'Dedicated support team with guaranteed response times.' },
    ], { cols: 4 })] },
  { id: 'feat-3col-light', name: '3 Column — Light', category: 'Features', description: 'Light background with subtle cards',
    elements: [featureGrid('How It Works', 'Three simple steps to get started.', [
      { title: '1. Connect', desc: 'Link your existing tools and data sources in under 2 minutes.' },
      { title: '2. Configure', desc: 'Set up workflows and automations with our visual builder.' },
      { title: '3. Launch', desc: 'Deploy to production with a single click. Zero downtime guaranteed.' },
    ], { bg: '#fff' })] },
  { id: 'feat-alternating', name: 'Alternating — Image + Text', category: 'Features', description: 'Alternating left/right image-text rows',
    elements: [
      s('section', {}, { desktop: { backgroundColor: '#000' } }, [
        s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '500px' }, mobile: { gridTemplateColumns: '1fr' } }, [
          s('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
            s('heading', { text: 'Visual Workflow Builder', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px', lineHeight: '1.15' } }),
            s('text', { text: 'Drag and drop your way to powerful automations. No code required.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', maxWidth: '400px' } }),
          ]),
          s('container', {}, { desktop: { overflow: 'hidden' } }, [
            s('image', { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop', alt: 'Feature' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
          ]),
        ]),
        s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '500px' }, mobile: { gridTemplateColumns: '1fr' } }, [
          s('container', {}, { desktop: { overflow: 'hidden' } }, [
            s('image', { src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop', alt: 'Feature' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
          ]),
          s('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
            s('heading', { text: 'Powerful Analytics', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px', lineHeight: '1.15' } }),
            s('text', { text: 'Real-time dashboards with custom metrics and automated reporting.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', maxWidth: '400px' } }),
          ]),
        ]),
      ], 'Features'),
    ] },
  { id: 'feat-numbered', name: 'Numbered Steps', category: 'Features', description: 'Feature list with large numbers',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto' } }, [
        s('heading', { text: 'How It Works', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '64px', textAlign: 'center' } }),
        ...['Design', 'Develop', 'Deploy', 'Iterate'].map((step, i) =>
          s('container', {}, { desktop: { display: 'flex', gap: '32px', alignItems: 'flex-start', padding: '32px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } }, [
            s('heading', { text: `0${i + 1}`, level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '800', color: 'rgba(255,255,255,0.08)', letterSpacing: '-0.03em', lineHeight: '1' } }),
            s('container', {}, { desktop: {} }, [
              s('heading', { text: step, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
              s('text', { text: `Step ${i + 1} of our proven process that delivers exceptional results every time.` }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
            ]),
          ])
        ),
      ]),
    ], 'How It Works')] },
];

// ════════════════════════════════════════════════════════════════════
//  CTA, TESTIMONIALS, PRICING, FAQ, STATS, CONTACT, FOOTERS, etc.
// ════════════════════════════════════════════════════════════════════

const CTA_SECTIONS: SectionBlock[] = [
  { id: 'cta-centered-dark', name: 'Centered — Dark', category: 'CTA', description: 'Simple centered CTA on dark background',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', textAlign: 'center' } }, [
      s('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto' } }, [
        s('heading', { text: 'Ready to Get Started?', level: 'h2' }, { desktop: { fontSize: '46px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: '1.1' } }),
        s('text', { text: 'Join thousands of teams already building with us.', }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', marginBottom: '36px', lineHeight: '1.6' } }),
        s('button', { text: 'Start Free Trial', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
      ]),
    ], 'CTA')] },
  { id: 'cta-centered-light', name: 'Centered — Light', category: 'CTA', description: 'White CTA with dark text',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#fff', textAlign: 'center' } }, [
      s('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto' } }, [
        s('heading', { text: 'Let\'s Build Something\nExtraordinary', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#111', letterSpacing: '-0.03em', marginBottom: '20px', lineHeight: '1.1' } }),
        s('text', { text: 'Start your project today. No commitment required.' }, { desktop: { fontSize: '16px', color: '#777', marginBottom: '36px', lineHeight: '1.6' } }),
        s('button', { text: 'Get in Touch', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#111', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
      ]),
    ], 'CTA')] },
  { id: 'cta-split-image', name: 'Split — Image CTA', category: 'CTA', description: 'CTA with image on one side',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '400px', backgroundColor: '#0a0a0a' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
        s('heading', { text: 'Start Your\nJourney Today', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px', lineHeight: '1.15' } }),
        s('text', { text: 'Take the first step towards transforming your business.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px', lineHeight: '1.6' } }),
        s('button', { text: 'Book a Call', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any, width: 'fit-content' } }),
      ]),
      s('container', {}, { desktop: { overflow: 'hidden' } }, [
        s('image', { src: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=500&fit=crop', alt: 'Team' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ]),
    ], 'CTA')] },
  { id: 'cta-banner', name: 'Banner — Inline', category: 'CTA', description: 'Compact inline CTA banner',
    elements: [s('section', {}, { desktop: { padding: '40px 60px', backgroundColor: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }, mobile: { flexDirection: 'column', gap: '20px', padding: '32px 24px', textAlign: 'center' } }, [
      s('heading', { text: 'Ready to transform your business?', level: 'h3' }, { desktop: { fontSize: '22px', fontWeight: '600', color: '#fff', letterSpacing: '-0.01em' } }),
      s('button', { text: 'Contact Us', href: '#' }, { desktop: { padding: '14px 32px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '12px', fontWeight: '700', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
    ], 'CTA')] },
];

const TESTIMONIALS: SectionBlock[] = [
  { id: 'test-3col', name: '3 Column Cards', category: 'Testimonials', description: 'Three testimonial cards in a row',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        s('heading', { text: 'CLIENT TESTIMONIALS', level: 'h2' }, { desktop: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as any, letterSpacing: '0.15em', marginBottom: '56px' } }),
        s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }, mobile: { gridTemplateColumns: '1fr' } }, [
          { q: 'Absolutely transformed our digital presence. The ROI has been incredible.', n: 'Sarah Chen', r: 'CEO, TechVault' },
          { q: 'World-class team that truly understands enterprise needs.', n: 'James Walker', r: 'CTO, NovaBridge' },
          { q: 'The best investment we\'ve made in our business this decade.', n: 'Maria Santos', r: 'Founder, Axiom' },
        ].map(t => s('card', {}, { desktop: { padding: '40px', backgroundColor: '#0a0a0a', borderRadius: '12px', border: '1px solid #1a1a1a' } }, [
          s('text', { text: `"${t.q}"` }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.7', marginBottom: '28px' } }),
          s('text', { text: t.n }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#fff' } }),
          s('text', { text: t.r }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' } }),
        ]))),
      ]),
    ], 'Testimonials')] },
  { id: 'test-large-quote', name: 'Large Single Quote', category: 'Testimonials', description: 'One impactful testimonial with large text',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a', textAlign: 'center' } }, [
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto' } }, [
        s('text', { text: '"' }, { desktop: { fontSize: '100px', fontWeight: '700', color: 'rgba(255,255,255,0.08)', lineHeight: '0.5', marginBottom: '20px' } }),
        s('text', { text: 'Working with this team has been the single best decision for our company. They exceeded every expectation.' }, { desktop: { fontSize: '28px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.5', fontWeight: '500', letterSpacing: '-0.01em', marginBottom: '36px' } }),
        s('text', { text: 'Alexandra Reid' }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#fff' } }),
        s('text', { text: 'Chief Marketing Officer, Horizon Group' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' } }),
      ]),
    ], 'Testimonial')] },
];

const PRICING_SECTIONS: SectionBlock[] = [
  { id: 'pricing-3col', name: '3 Tier — Dark', category: 'Pricing', description: 'Classic three-tier pricing table',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a' } }, [
      s('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', textAlign: 'center', marginBottom: '56px' } }, [
        s('heading', { text: 'Simple, Transparent Pricing', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' } }),
        s('text', { text: 'No hidden fees. Cancel anytime.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        { n: 'Starter', p: '$29', f: '5 projects\n10GB storage\nEmail support', pop: false },
        { n: 'Professional', p: '$79', f: '25 projects\n100GB storage\nPriority support\nAdvanced analytics\nCustom domain', pop: true },
        { n: 'Enterprise', p: '$249', f: 'Unlimited projects\n1TB storage\n24/7 support\nDedicated CSM\nSSO & SAML\nSLA guarantee', pop: false },
      ].map(plan => s('card', {}, { desktop: { padding: '44px', borderRadius: '12px', border: plan.pop ? '1px solid rgba(255,255,255,0.15)' : '1px solid #1a1a1a', backgroundColor: plan.pop ? '#111' : 'transparent', textAlign: 'center' } }, [
        ...(plan.pop ? [s('badge', { text: 'MOST POPULAR' }, { desktop: { padding: '4px 12px', backgroundColor: '#fff', color: '#000', borderRadius: '2px', fontSize: '9px', fontWeight: '700', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.1em' } })] : []),
        s('heading', { text: plan.n, level: 'h3' }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '12px' } }),
        s('heading', { text: plan.p, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', marginBottom: '8px', letterSpacing: '-0.03em' } }),
        s('text', { text: '/month' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '28px' } }),
        s('text', { text: plan.f }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '2.2', whiteSpace: 'pre-line', marginBottom: '32px' } }),
        s('button', { text: 'Get Started', href: '#' }, { desktop: { padding: '14px 28px', backgroundColor: plan.pop ? '#fff' : 'transparent', color: plan.pop ? '#000' : '#fff', borderRadius: '0', fontSize: '12px', fontWeight: '600', border: plan.pop ? 'none' : '1px solid rgba(255,255,255,0.2)', width: '100%', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
      ]))),
    ], 'Pricing')] },
];

const STATS_SECTIONS: SectionBlock[] = [
  { id: 'stats-4col', name: '4 Column Stats', category: 'Stats', description: 'Four statistics in a row',
    elements: [s('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' } }, [
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)' } },
        [{ v: '500+', l: 'Clients' }, { v: '99.9%', l: 'Uptime' }, { v: '$2.4B', l: 'Revenue' }, { v: '45', l: 'Countries' }].map(st =>
          s('container', {}, { desktop: {} }, [
            s('heading', { text: st.v, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', marginBottom: '8px', letterSpacing: '-0.03em' } }),
            s('text', { text: st.l }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as any, letterSpacing: '0.12em', fontWeight: '600' } }),
          ])
        )),
    ], 'Stats')] },
  { id: 'stats-3col-light', name: '3 Column — Light', category: 'Stats', description: 'Stats on white background',
    elements: [s('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#fff', borderTop: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' } }, [
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }, mobile: { gridTemplateColumns: '1fr' } },
        [{ v: '200+', l: 'Projects Delivered' }, { v: '98%', l: 'Client Satisfaction' }, { v: '15+', l: 'Years Experience' }].map(st =>
          s('container', {}, { desktop: {} }, [
            s('heading', { text: st.v, level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '700', color: '#111', marginBottom: '8px', letterSpacing: '-0.03em' } }),
            s('text', { text: st.l }, { desktop: { fontSize: '12px', color: '#999', textTransform: 'uppercase' as any, letterSpacing: '0.1em', fontWeight: '600' } }),
          ])
        )),
    ], 'Stats')] },
];

const FAQ_SECTIONS: SectionBlock[] = [
  { id: 'faq-simple', name: 'Simple FAQ', category: 'FAQ', description: 'Clean FAQ with dividers',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '700px', margin: '0 auto' } }, [
        s('heading', { text: 'Frequently Asked Questions', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '56px', textAlign: 'center' } }),
        ...['What services do you offer?', 'How long does a project take?', 'What is your pricing model?', 'Do you offer ongoing support?', 'How do I get started?'].map(q =>
          s('container', {}, { desktop: { padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
            s('text', { text: q }, { desktop: { fontSize: '16px', color: '#fff', fontWeight: '500' } }),
            s('text', { text: '+' }, { desktop: { fontSize: '20px', color: 'rgba(255,255,255,0.3)' } }),
          ])
        ),
      ]),
    ], 'FAQ')] },
];

const CONTACT_SECTIONS: SectionBlock[] = [
  { id: 'contact-dark', name: 'Contact Form — Dark', category: 'Contact', description: 'Dark themed contact form',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '560px', margin: '0 auto' } }, [
        s('heading', { text: 'Get In Touch', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', marginBottom: '40px', letterSpacing: '-0.02em' } }),
        s('form', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
          s('input', { placeholder: 'Full Name', label: '', inputType: 'text' }, { desktop: { padding: '16px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#0a0a0a', color: '#fff' } }),
          s('input', { placeholder: 'Email Address', label: '', inputType: 'email' }, { desktop: { padding: '16px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#0a0a0a', color: '#fff' } }),
          s('textarea', { placeholder: 'Your message…', label: '' }, { desktop: { padding: '16px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', minHeight: '140px', backgroundColor: '#0a0a0a', color: '#fff' } }),
          s('button', { text: 'Send Message', href: '#' }, { desktop: { padding: '18px 32px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.08em', textTransform: 'uppercase' as any } }),
        ]),
      ]),
    ], 'Contact')] },
  { id: 'contact-split', name: 'Contact — Split Layout', category: 'Contact', description: 'Info on left, form on right',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#000', minHeight: '600px' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
        s('heading', { text: 'Let\'s Talk', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '24px' } }),
        s('text', { text: 'Have a project in mind? We\'d love to hear about it. Drop us a line and we\'ll get back within 24 hours.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '40px' } }),
        s('text', { text: 'hello@studio.com' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' } }),
        s('text', { text: '+44 20 7946 0958' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.7)' } }),
      ]),
      s('container', {}, { desktop: { padding: '80px 60px', backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
        s('form', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
          s('input', { placeholder: 'Name', label: '', inputType: 'text' }, { desktop: { padding: '16px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#111', color: '#fff' } }),
          s('input', { placeholder: 'Email', label: '', inputType: 'email' }, { desktop: { padding: '16px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#111', color: '#fff' } }),
          s('textarea', { placeholder: 'Tell us about your project…', label: '' }, { desktop: { padding: '16px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', minHeight: '120px', backgroundColor: '#111', color: '#fff' } }),
          s('button', { text: 'Submit', href: '#' }, { desktop: { padding: '16px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
        ]),
      ]),
    ], 'Contact')] },
];

const FOOTER_SECTIONS: SectionBlock[] = [
  { id: 'footer-minimal', name: 'Minimal Footer', category: 'Footers', description: 'Single-line minimal footer',
    elements: [s('footer', {}, { desktop: { padding: '40px 60px', backgroundColor: '#000', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' } }, [
      s('text', { text: '© 2026 Brand. All rights reserved.' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.04em' } }),
    ], 'Footer')] },
  { id: 'footer-4col', name: '4 Column Footer', category: 'Footers', description: 'Full footer with columns and links',
    elements: [s('footer', {}, { desktop: { padding: '80px 60px 40px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.06)' } }, [
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '40px', maxWidth: '1200px', margin: '0 auto', marginBottom: '60px' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [
        s('container', {}, { desktop: {} }, [
          s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', marginBottom: '16px' } }),
          s('text', { text: 'Building exceptional digital experiences since 2015.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', lineHeight: '1.6', maxWidth: '240px' } }),
        ]),
        ...['Product', 'Company', 'Legal'].map(col =>
          s('container', {}, { desktop: {} }, [
            s('text', { text: col }, { desktop: { fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: '16px', textTransform: 'uppercase' as any } }),
            ...['Link One', 'Link Two', 'Link Three'].map(link =>
              s('link', { text: link, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', display: 'block', marginBottom: '10px' } })
            ),
          ])
        ),
      ]),
      s('container', {}, { desktop: { borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '24px', textAlign: 'center' } }, [
        s('text', { text: '© 2026 Brand. All rights reserved.' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)' } }),
      ]),
    ], 'Footer')] },
];

const GALLERY_SECTIONS: SectionBlock[] = [
  { id: 'gallery-3col', name: '3 Column Gallery', category: 'Gallery', description: 'Image grid with three columns',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        s('heading', { text: 'OUR WORK', level: 'h2' }, { desktop: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as any, letterSpacing: '0.15em', marginBottom: '48px' } }),
        s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }, mobile: { gridTemplateColumns: '1fr' } },
          ['photo-1618005182384-a83a8bd57fbe', 'photo-1497366216548-37526070297c', 'photo-1558618666-fcd25c85f82e',
           'photo-1460925895917-afdab827c52f', 'photo-1551288049-bebda4e38f71', 'photo-1552664730-d307ca884978'].map(id =>
            s('image', { src: `https://images.unsplash.com/${id}?w=600&h=400&fit=crop`, alt: 'Work' }, { desktop: { width: '100%', height: '280px', objectFit: 'cover', display: 'block' } })
          )),
      ]),
    ], 'Gallery')] },
];

const LOGO_SECTIONS: SectionBlock[] = [
  { id: 'logos-marquee', name: 'Logo Bar — Dark', category: 'Logos', description: 'Trusted-by logo row',
    elements: [s('section', {}, { desktop: { padding: '48px 60px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' } }, [
      s('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '40px' }, mobile: { flexWrap: 'wrap', justifyContent: 'center' } }, [
        s('text', { text: 'TRUSTED BY' }, { desktop: { fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em' } }),
        ...['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta'].map(name =>
          s('text', { text: name }, { desktop: { fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.06em' } })
        ),
      ]),
    ], 'Logo Bar')] },
];

const TEAM_SECTIONS: SectionBlock[] = [
  { id: 'team-grid', name: 'Team Grid', category: 'Team', description: 'Team member cards with photos',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', marginBottom: '56px' } }, [
        s('heading', { text: 'Our Team', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' } }),
        s('text', { text: 'The people behind the work.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)' } },
        [{ n: 'Alex Morgan', r: 'CEO & Founder' }, { n: 'Jordan Lee', r: 'CTO' }, { n: 'Sam Rivera', r: 'Head of Design' }, { n: 'Taylor Kim', r: 'Lead Engineer' }].map((m, i) =>
          s('card', {}, { desktop: { borderRadius: '12px', overflow: 'hidden', backgroundColor: '#111', border: '1px solid #1a1a1a' } }, [
            s('image', { src: `https://images.unsplash.com/photo-${['1507003211169-0a1dd7228f2d', '1472099645785-5658abf4ff4e', '1438761681033-6461ffad8d80', '1500648767791-00dcc994a43e'][i]}?w=400&h=400&fit=crop&crop=face`, alt: m.n }, { desktop: { width: '100%', height: '260px', objectFit: 'cover' } }),
            s('container', {}, { desktop: { padding: '20px' } }, [
              s('text', { text: m.n }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
              s('text', { text: m.r }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.35)' } }),
            ]),
          ])
        )),
    ], 'Team')] },
];

const CONTENT_SECTIONS: SectionBlock[] = [
  { id: 'content-text-center', name: 'Centered Content Block', category: 'Content', description: 'Centered heading and paragraph',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', textAlign: 'center' } }, [
      s('container', {}, { desktop: { maxWidth: '700px', margin: '0 auto' } }, [
        s('text', { text: 'ABOUT US' }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: '20px', textTransform: 'uppercase' as any } }),
        s('heading', { text: 'We believe in the power of great design', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', lineHeight: '1.15', marginBottom: '24px' } }),
        s('text', { text: 'For over a decade, we\'ve been helping ambitious brands create digital experiences that captivate audiences and drive measurable results. Our approach combines strategic thinking with pixel-perfect execution.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.8' } }),
      ]),
    ], 'About')] },
  { id: 'content-image-text', name: 'Image + Text Row', category: 'Content', description: 'Half image, half text',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', backgroundColor: '#000', minHeight: '500px' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
        s('heading', { text: 'Our Approach', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px', lineHeight: '1.15' } }),
        s('text', { text: 'We take a research-driven approach to every project. Understanding your users, your market, and your goals before writing a single line of code.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', maxWidth: '440px' } }),
      ]),
      s('container', {}, { desktop: { overflow: 'hidden' } }, [
        s('image', { src: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop', alt: 'Approach' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ]),
    ], 'Content')] },
];

const BANNER_SECTIONS: SectionBlock[] = [
  { id: 'banner-announcement', name: 'Announcement Banner', category: 'Banners', description: 'Top announcement bar',
    elements: [s('section', {}, { desktop: { padding: '12px 40px', backgroundColor: '#111', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' } }, [
      s('text', { text: '🎉 We just launched v2.0 — Check out what\'s new →' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '500' } }),
    ], 'Banner')] },
  { id: 'banner-promo', name: 'Promotional Banner', category: 'Banners', description: 'Promotional banner with CTA',
    elements: [s('section', {}, { desktop: { padding: '16px 60px', background: 'linear-gradient(90deg, #6366f1, #8b5cf6)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }, mobile: { flexDirection: 'column', padding: '16px 24px', gap: '8px' } }, [
      s('text', { text: 'Limited time: 30% off all plans' }, { desktop: { fontSize: '14px', color: '#fff', fontWeight: '600' } }),
      s('button', { text: 'Claim Offer', href: '#' }, { desktop: { padding: '8px 20px', backgroundColor: '#fff', color: '#6366f1', borderRadius: '4px', fontSize: '12px', fontWeight: '700', border: 'none' } }),
    ], 'Banner')] },
  { id: 'banner-cookie', name: 'Cookie Consent Bar', category: 'Banners', description: 'GDPR cookie consent bottom bar',
    elements: [s('section', {}, { desktop: { padding: '16px 60px', backgroundColor: '#111', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.06)' }, mobile: { flexDirection: 'column', gap: '12px', padding: '16px 24px' } }, [
      s('text', { text: 'We use cookies to enhance your experience. By continuing, you agree to our privacy policy.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.5)' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '8px' } }, [
        s('button', { text: 'Accept All', href: '#' }, { desktop: { padding: '8px 20px', backgroundColor: '#fff', color: '#000', borderRadius: '4px', fontSize: '12px', fontWeight: '600', border: 'none' } }),
        s('button', { text: 'Decline', href: '#' }, { desktop: { padding: '8px 20px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.5)', borderRadius: '4px', fontSize: '12px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.15)' } }),
      ]),
    ], 'Cookie Banner')] },
  { id: 'banner-countdown', name: 'Countdown Timer Banner', category: 'Banners', description: 'Urgency countdown banner',
    elements: [s('section', {}, { desktop: { padding: '20px 60px', background: 'linear-gradient(90deg, #000 0%, #111 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }, mobile: { flexDirection: 'column', gap: '12px', padding: '20px 24px' } }, [
      s('text', { text: '🔥 Flash Sale Ends In:' }, { desktop: { fontSize: '14px', color: '#fff', fontWeight: '600' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
        ...['23h', '47m', '12s'].map(t =>
          s('text', { text: t }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#f59e0b', padding: '4px 10px', backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: '4px' } })
        ),
      ]),
      s('button', { text: 'Shop Now →', href: '#' }, { desktop: { padding: '10px 24px', backgroundColor: '#f59e0b', color: '#000', borderRadius: '4px', fontSize: '12px', fontWeight: '700', border: 'none' } }),
    ], 'Countdown Banner')] },
];

// ════════════════════════════════════════════════════════════════════
//  BLOG SECTIONS
// ════════════════════════════════════════════════════════════════════

const BLOG_SECTIONS: SectionBlock[] = [
  { id: 'blog-3col', name: '3 Column Blog Grid', category: 'Blog', description: 'Blog post cards with images',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', marginBottom: '56px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' } }, [
        s('container', {}, { desktop: {} }, [
          s('heading', { text: 'Latest Articles', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '12px' } }),
          s('text', { text: 'Insights, tutorials, and industry updates.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)' } }),
        ]),
        s('button', { text: 'View All →', href: '#' }, { desktop: { padding: '12px 28px', backgroundColor: 'transparent', color: '#fff', borderRadius: '0', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)', letterSpacing: '0.04em' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } },
        [
          { t: 'The Future of Web Design in 2026', d: 'Exploring emerging trends that will shape the next generation of digital experiences.', img: 'photo-1460925895917-afdab827c52f', cat: 'Design' },
          { t: 'Building Scalable Architecture', d: 'How to design systems that grow with your business.', img: 'photo-1551288049-bebda4e38f71', cat: 'Engineering' },
          { t: 'The ROI of Great UX', d: 'Quantifying the business impact of user-centered design.', img: 'photo-1552664730-d307ca884978', cat: 'Business' },
        ].map(post =>
          s('card', {}, { desktop: { borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' } }, [
            s('image', { src: `https://images.unsplash.com/${post.img}?w=600&h=340&fit=crop`, alt: post.t }, { desktop: { width: '100%', height: '200px', objectFit: 'cover' } }),
            s('container', {}, { desktop: { padding: '28px' } }, [
              s('badge', { text: post.cat }, { desktop: { padding: '4px 10px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderRadius: '2px', fontSize: '9px', fontWeight: '700', display: 'inline-block', marginBottom: '16px', letterSpacing: '0.1em', textTransform: 'uppercase' as any } }),
              s('heading', { text: post.t, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '12px', lineHeight: '1.3', letterSpacing: '-0.01em' } }),
              s('text', { text: post.d }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
            ]),
          ])
        )),
    ], 'Blog')] },
  { id: 'blog-featured', name: 'Featured Article', category: 'Blog', description: 'Large featured blog post with sidebar list',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        s('heading', { text: 'From Our Blog', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '48px' } }),
        s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '24px' }, mobile: { gridTemplateColumns: '1fr' } }, [
          s('card', {}, { desktop: { borderRadius: '12px', overflow: 'hidden', backgroundColor: '#111', border: '1px solid #1a1a1a' } }, [
            s('image', { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=500&fit=crop', alt: 'Featured' }, { desktop: { width: '100%', height: '320px', objectFit: 'cover' } }),
            s('container', {}, { desktop: { padding: '32px' } }, [
              s('badge', { text: 'FEATURED' }, { desktop: { padding: '4px 12px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: '2px', fontSize: '9px', fontWeight: '700', display: 'inline-block', marginBottom: '16px', letterSpacing: '0.12em' } }),
              s('heading', { text: 'How We Redesigned Our Platform for 10x Performance', level: 'h3' }, { desktop: { fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '12px', lineHeight: '1.3' } }),
              s('text', { text: 'A deep dive into the architecture decisions that transformed our product.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' } }),
            ]),
          ]),
          s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '12px' } },
            ['Why Design Systems Matter', 'The Art of Minimalist UI', 'Scaling Your Engineering Team', 'Building a Culture of Innovation'].map(title =>
              s('card', {}, { desktop: { padding: '24px', backgroundColor: '#111', borderRadius: '10px', border: '1px solid #1a1a1a', display: 'flex', gap: '16px', alignItems: 'center' } }, [
                s('container', {}, { desktop: { width: '4px', height: '40px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '2px', flexShrink: '0' } }),
                s('container', {}, { desktop: {} }, [
                  s('text', { text: title }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '4px' } }),
                  s('text', { text: '5 min read' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)' } }),
                ]),
              ])
            )),
        ]),
      ]),
    ], 'Blog')] },
  { id: 'blog-minimal-list', name: 'Minimal Post List', category: 'Blog', description: 'Clean text-only blog post list',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '700px', margin: '0 auto' } }, [
        s('heading', { text: 'Writing', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '56px' } }),
        ...['Rethinking Digital Product Design', 'The Economics of Great UX', 'Building Teams That Ship Fast', 'Why Simple Always Wins', 'The Next Wave of Web Technology'].map((t, i) =>
          s('container', {}, { desktop: { padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
            s('container', {}, { desktop: {} }, [
              s('text', { text: t }, { desktop: { fontSize: '17px', fontWeight: '600', color: '#fff', marginBottom: '4px' } }),
              s('text', { text: `January ${15 + i}, 2026` }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.25)' } }),
            ]),
            s('text', { text: '→' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.3)' } }),
          ])
        ),
      ]),
    ], 'Blog')] },
];

// ════════════════════════════════════════════════════════════════════
//  E-COMMERCE SECTIONS
// ════════════════════════════════════════════════════════════════════

const ECOMMERCE_SECTIONS: SectionBlock[] = [
  { id: 'ecom-product-grid', name: 'Product Grid — 4 Column', category: 'Ecommerce', description: 'Product cards with images and prices',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
        s('heading', { text: 'New Arrivals', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' } }),
        s('button', { text: 'Shop All →', href: '#' }, { desktop: { padding: '12px 28px', backgroundColor: 'transparent', color: '#fff', borderRadius: '0', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)' } },
        [
          { n: 'Minimalist Watch', p: '$249', img: 'photo-1523275335684-37898b6baf30' },
          { n: 'Leather Bag', p: '$189', img: 'photo-1548036328-c9fa89d128fa' },
          { n: 'Ceramic Vase', p: '$79', img: 'photo-1578500494198-246f612d3b3d' },
          { n: 'Desk Lamp', p: '$129', img: 'photo-1507473885765-e6ed057ab3fe' },
        ].map(product =>
          s('card', {}, { desktop: { borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' } }, [
            s('image', { src: `https://images.unsplash.com/${product.img}?w=400&h=400&fit=crop`, alt: product.n }, { desktop: { width: '100%', height: '240px', objectFit: 'cover' } }),
            s('container', {}, { desktop: { padding: '20px' } }, [
              s('text', { text: product.n }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '6px' } }),
              s('text', { text: product.p }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff' } }),
            ]),
          ])
        )),
    ], 'Products')] },
  { id: 'ecom-featured-product', name: 'Featured Product', category: 'Ecommerce', description: 'Large product showcase with details',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '600px', backgroundColor: '#0a0a0a' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { overflow: 'hidden', backgroundColor: '#111' } }, [
        s('image', { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop', alt: 'Product' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ]),
      s('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
        s('badge', { text: 'NEW' }, { desktop: { padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderRadius: '2px', fontSize: '9px', fontWeight: '700', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.12em' } }),
        s('heading', { text: 'The Minimal Watch', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' } }),
        s('text', { text: 'Crafted from premium materials with Swiss movement. Designed for those who appreciate the beauty of simplicity.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '24px', maxWidth: '400px' } }),
        s('heading', { text: '$249', level: 'h3' }, { desktop: { fontSize: '32px', fontWeight: '700', color: '#fff', marginBottom: '32px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
          s('button', { text: 'Add to Cart', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
          s('button', { text: 'Learn More', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: 'transparent', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)', letterSpacing: '0.06em' } }),
        ]),
      ]),
    ], 'Featured Product')] },
  { id: 'ecom-categories', name: 'Category Cards', category: 'Ecommerce', description: 'Shopping category cards with images',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '56px' } }, [
        s('heading', { text: 'Shop by Category', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } },
        [
          { n: 'Accessories', img: 'photo-1523275335684-37898b6baf30' },
          { n: 'Homeware', img: 'photo-1578500494198-246f612d3b3d' },
          { n: 'Lighting', img: 'photo-1507473885765-e6ed057ab3fe' },
        ].map(cat =>
          s('card', {}, { desktop: { borderRadius: '12px', overflow: 'hidden', position: 'relative', height: '320px' } }, [
            s('image', { src: `https://images.unsplash.com/${cat.img}?w=600&h=400&fit=crop`, alt: cat.n }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
            s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)', display: 'flex', alignItems: 'flex-end', padding: '32px' } }, [
              s('heading', { text: cat.n, level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff' } }),
            ]),
          ])
        )),
    ], 'Categories')] },
  // ── Product Grid 3 Column with Cart ──
  { id: 'ecom-grid-3col-cart', name: 'Product Grid — 3 Column + Cart', category: 'Ecommerce', description: 'Products with add-to-cart buttons',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', textAlign: 'center', marginBottom: '48px' } }, [
        s('heading', { text: 'Best Sellers', level: 'h2' }, { desktop: { fontSize: '38px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '12px' } }),
        s('text', { text: 'Our most popular products chosen by customers' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } },
        [
          { n: 'Premium Headphones', p: '£199', img: 'photo-1505740420928-5e560c06d30e' },
          { n: 'Smart Speaker', p: '£89', img: 'photo-1543512214-318c7553f230' },
          { n: 'Wireless Earbuds', p: '£149', img: 'photo-1572569511254-d8f925fe2cbb' },
        ].map(product =>
          s('card', {}, { desktop: { borderRadius: '16px', overflow: 'hidden', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' } }, [
            s('image', { src: `https://images.unsplash.com/${product.img}?w=500&h=500&fit=crop`, alt: product.n }, { desktop: { width: '100%', height: '280px', objectFit: 'cover' } }),
            s('container', {}, { desktop: { padding: '24px' } }, [
              s('text', { text: product.n }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
              s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
                s('text', { text: product.p }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff' } }),
                s('button', { text: 'Add to Cart', href: '#' }, { desktop: { padding: '10px 20px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '12px', fontWeight: '600', border: 'none' } }),
              ]),
            ]),
          ])
        )),
    ], 'Best Sellers')] },
  // ── Product Carousel / Horizontal Scroll ──
  { id: 'ecom-horizontal-scroll', name: 'Product Carousel — Scroll', category: 'Ecommerce', description: 'Horizontally scrollable product row',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
        s('heading', { text: 'Trending Now', level: 'h2' }, { desktop: { fontSize: '34px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' } }),
        s('text', { text: 'Scroll →' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', fontWeight: '500' } }),
      ]),
      s('container', {}, { desktop: { display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '16px', maxWidth: '1200px', margin: '0 auto' } },
        [
          { n: 'Wool Coat', p: '£320', img: 'photo-1539533018447-63fcce2678e3' },
          { n: 'Silk Scarf', p: '£75', img: 'photo-1601924994987-69e26d50dc64' },
          { n: 'Canvas Tote', p: '£55', img: 'photo-1553062407-98eeb64c6a62' },
          { n: 'Sunglasses', p: '£140', img: 'photo-1572635196237-14b3f281503f' },
          { n: 'Chelsea Boots', p: '£210', img: 'photo-1542291026-7eec264c27ff' },
        ].map(product =>
          s('card', {}, { desktop: { minWidth: '220px', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a', flexShrink: '0' } }, [
            s('image', { src: `https://images.unsplash.com/${product.img}?w=300&h=300&fit=crop`, alt: product.n }, { desktop: { width: '100%', height: '200px', objectFit: 'cover' } }),
            s('container', {}, { desktop: { padding: '16px' } }, [
              s('text', { text: product.n }, { desktop: { fontSize: '13px', fontWeight: '600', color: '#fff', marginBottom: '4px' } }),
              s('text', { text: product.p }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#fff' } }),
            ]),
          ])
        )),
    ], 'Trending')] },
  // ── Product with Reviews ──
  { id: 'ecom-product-reviews', name: 'Product Detail + Reviews', category: 'Ecommerce', description: 'Full product page with star ratings',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a' } }, [
      s('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px' }, mobile: { gridTemplateColumns: '1fr' } }, [
        s('container', {}, { desktop: { borderRadius: '16px', overflow: 'hidden' } }, [
          s('image', { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop', alt: 'Product' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
        ]),
        s('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' } }, [
          s('container', {}, { desktop: { display: 'flex', gap: '4px', alignItems: 'center' } }, [
            ...Array(5).fill(null).map(() => s('text', { text: '★' }, { desktop: { fontSize: '16px', color: '#f59e0b' } })),
            s('text', { text: '(128 reviews)' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginLeft: '8px' } }),
          ]),
          s('heading', { text: 'Premium Headphones', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' } }),
          s('text', { text: 'Experience immersive audio with our flagship wireless headphones. Active noise cancellation, 40-hour battery life, and premium comfort.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' } }),
          s('container', {}, { desktop: { display: 'flex', gap: '8px', alignItems: 'baseline' } }, [
            s('heading', { text: '£199', level: 'h3' }, { desktop: { fontSize: '32px', fontWeight: '700', color: '#fff' } }),
            s('text', { text: '£299' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' } }),
            s('badge', { text: 'SAVE 33%' }, { desktop: { padding: '4px 10px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '4px', fontSize: '10px', fontWeight: '700' } }),
          ]),
          s('container', {}, { desktop: { display: 'flex', gap: '8px', marginTop: '8px' } }, [
            ...['Black', 'White', 'Navy'].map(c => s('button', { text: c, href: '#' }, { desktop: { padding: '8px 16px', backgroundColor: '#111', color: 'rgba(255,255,255,0.6)', borderRadius: '6px', fontSize: '12px', fontWeight: '500', border: '1px solid #1a1a1a' } })),
          ]),
          s('container', {}, { desktop: { display: 'flex', gap: '12px', marginTop: '16px' } }, [
            s('button', { text: 'Add to Cart', href: '#' }, { desktop: { padding: '16px 40px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '13px', fontWeight: '700', border: 'none', flex: '1' } }),
            s('button', { text: '♡', href: '#' }, { desktop: { padding: '16px 20px', backgroundColor: '#111', color: '#fff', borderRadius: '8px', fontSize: '18px', border: '1px solid #1a1a1a' } }),
          ]),
        ]),
      ]),
    ], 'Product Detail')] },
  // ── Mini Cart / Cart Summary ──
  { id: 'ecom-cart-summary', name: 'Cart Summary', category: 'Ecommerce', description: 'Shopping cart layout with totals',
    elements: [s('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto' } }, [
        s('heading', { text: 'Your Cart', level: 'h2' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '32px' } }),
        ...[
          { n: 'Minimalist Watch', p: '$249', qty: '1', img: 'photo-1523275335684-37898b6baf30' },
          { n: 'Leather Bag', p: '$189', qty: '2', img: 'photo-1548036328-c9fa89d128fa' },
        ].map(item =>
          s('container', {}, { desktop: { display: 'flex', gap: '16px', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #1a1a1a' } }, [
            s('image', { src: `https://images.unsplash.com/${item.img}?w=80&h=80&fit=crop`, alt: item.n }, { desktop: { width: '64px', height: '64px', borderRadius: '8px', objectFit: 'cover' } }),
            s('container', {}, { desktop: { flex: '1' } }, [
              s('text', { text: item.n }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#fff' } }),
              s('text', { text: `Qty: ${item.qty}` }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' } }),
            ]),
            s('text', { text: item.p }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#fff' } }),
          ])
        ),
        s('container', {}, { desktop: { paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' } }, [
          s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between' } }, [
            s('text', { text: 'Subtotal' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)' } }),
            s('text', { text: '$627' }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#fff' } }),
          ]),
          s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between' } }, [
            s('text', { text: 'Shipping' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)' } }),
            s('text', { text: 'Free' }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#22c55e' } }),
          ]),
          s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1a1a1a', paddingTop: '16px', marginTop: '8px' } }, [
            s('text', { text: 'Total' }, { desktop: { fontSize: '16px', fontWeight: '700', color: '#fff' } }),
            s('text', { text: '$627' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff' } }),
          ]),
        ]),
        s('button', { text: 'Proceed to Checkout', href: '#' }, { desktop: { padding: '18px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', width: '100%', marginTop: '24px' } }),
      ]),
    ], 'Cart')] },
  // ── Product Banner / Sale ──
  { id: 'ecom-sale-banner', name: 'Sale Banner — Full Width', category: 'Ecommerce', description: 'Promotional sale banner with CTA',
    elements: [s('section', {}, { desktop: { padding: '80px 60px', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', textAlign: 'center' } }, [
      s('container', {}, { desktop: { maxWidth: '700px', margin: '0 auto' } }, [
        s('badge', { text: 'LIMITED TIME' }, { desktop: { padding: '6px 14px', backgroundColor: 'rgba(239,68,68,0.15)', color: '#ef4444', borderRadius: '4px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.1em' } }),
        s('heading', { text: 'Winter Sale', level: 'h2' }, { desktop: { fontSize: '56px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' } }),
        s('heading', { text: 'Up to 50% Off Everything', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '500', color: 'rgba(255,255,255,0.6)', marginBottom: '32px' } }),
        s('button', { text: 'Shop the Sale', href: '#' }, { desktop: { padding: '18px 48px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '700', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
      ]),
    ], 'Sale Banner')] },
  // ── Services / Booking Grid ──
  { id: 'ecom-services-booking', name: 'Services — Booking Cards', category: 'Ecommerce', description: 'Service cards with book now buttons',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', textAlign: 'center', marginBottom: '48px' } }, [
        s('heading', { text: 'Our Services', level: 'h2' }, { desktop: { fontSize: '38px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '12px' } }),
        s('text', { text: 'Book your appointment online' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1100px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } },
        [
          { n: 'Haircut & Style', p: '£45', dur: '45 min', img: 'photo-1560066984-138dadb4c035' },
          { n: 'Color Treatment', p: '£85', dur: '90 min', img: 'photo-1522337360788-8b13dee7a37e' },
          { n: 'Beard Trim', p: '£25', dur: '30 min', img: 'photo-1503951914875-452162b0f3f1' },
        ].map(service =>
          s('card', {}, { desktop: { borderRadius: '16px', overflow: 'hidden', backgroundColor: '#0a0a0a', border: '1px solid #1a1a1a' } }, [
            s('image', { src: `https://images.unsplash.com/${service.img}?w=500&h=300&fit=crop`, alt: service.n }, { desktop: { width: '100%', height: '200px', objectFit: 'cover' } }),
            s('container', {}, { desktop: { padding: '24px' } }, [
              s('text', { text: service.n }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '4px' } }),
              s('text', { text: `${service.dur} · ${service.p}` }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' } }),
              s('button', { text: 'Book Now', href: '#' }, { desktop: { padding: '12px 24px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '12px', fontWeight: '600', border: 'none', width: '100%' } }),
            ]),
          ])
        )),
    ], 'Services')] },
  // ── Product List View ──
  { id: 'ecom-product-list', name: 'Product List — Horizontal', category: 'Ecommerce', description: 'Horizontal product list cards',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto' } }, [
        s('heading', { text: 'All Products', level: 'h2' }, { desktop: { fontSize: '32px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '32px' } }),
        ...[
          { n: 'Wireless Mouse', p: '£59', desc: 'Ergonomic design, 3 month battery', img: 'photo-1527864550417-7fd91fc51a46' },
          { n: 'Mechanical Keyboard', p: '£129', desc: 'Cherry MX switches, RGB backlit', img: 'photo-1587829741301-dc798b83add3' },
          { n: 'USB-C Hub', p: '£39', desc: '7 ports, 4K HDMI output', img: 'photo-1625842268584-8f3296236761' },
        ].map(item =>
          s('container', {}, { desktop: { display: 'flex', gap: '20px', alignItems: 'center', padding: '20px', borderRadius: '12px', border: '1px solid #1a1a1a', marginBottom: '12px', backgroundColor: '#0a0a0a' }, mobile: { flexDirection: 'column' } }, [
            s('image', { src: `https://images.unsplash.com/${item.img}?w=160&h=160&fit=crop`, alt: item.n }, { desktop: { width: '120px', height: '120px', borderRadius: '8px', objectFit: 'cover', flexShrink: '0' } }),
            s('container', {}, { desktop: { flex: '1' } }, [
              s('text', { text: item.n }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' } }),
              s('text', { text: item.desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' } }),
              s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
                s('text', { text: item.p }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff' } }),
                s('button', { text: 'Add to Cart', href: '#' }, { desktop: { padding: '10px 20px', backgroundColor: '#fff', color: '#000', borderRadius: '6px', fontSize: '12px', fontWeight: '600', border: 'none' } }),
              ]),
            ]),
          ])
        ),
      ]),
    ], 'Product List')] },
  // ── Checkout Form ──
  { id: 'ecom-checkout', name: 'Checkout Form', category: 'Ecommerce', description: 'Checkout page with billing details',
    elements: [s('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '500px', margin: '0 auto' } }, [
        s('heading', { text: 'Checkout', level: 'h2' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '32px' } }),
        s('form', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
          s('input', { placeholder: 'Email', label: '', inputType: 'email' }, { desktop: { padding: '14px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#0a0a0a', color: '#fff' } }),
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } }, [
            s('input', { placeholder: 'First Name', label: '', inputType: 'text' }, { desktop: { padding: '14px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '14px', backgroundColor: '#0a0a0a', color: '#fff' } }),
            s('input', { placeholder: 'Last Name', label: '', inputType: 'text' }, { desktop: { padding: '14px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '14px', backgroundColor: '#0a0a0a', color: '#fff' } }),
          ]),
          s('input', { placeholder: 'Address', label: '', inputType: 'text' }, { desktop: { padding: '14px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#0a0a0a', color: '#fff' } }),
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' } }, [
            s('input', { placeholder: 'City', label: '', inputType: 'text' }, { desktop: { padding: '14px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '14px', backgroundColor: '#0a0a0a', color: '#fff' } }),
            s('input', { placeholder: 'Postcode', label: '', inputType: 'text' }, { desktop: { padding: '14px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '14px', backgroundColor: '#0a0a0a', color: '#fff' } }),
          ]),
          s('text', { text: 'PAYMENT' }, { desktop: { fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginTop: '16px' } }),
          s('input', { placeholder: 'Card Number', label: '', inputType: 'text' }, { desktop: { padding: '14px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#0a0a0a', color: '#fff' } }),
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } }, [
            s('input', { placeholder: 'MM/YY', label: '', inputType: 'text' }, { desktop: { padding: '14px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '14px', backgroundColor: '#0a0a0a', color: '#fff' } }),
            s('input', { placeholder: 'CVV', label: '', inputType: 'text' }, { desktop: { padding: '14px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '14px', backgroundColor: '#0a0a0a', color: '#fff' } }),
          ]),
          s('button', { text: 'Pay Now — $627', href: '#' }, { desktop: { padding: '18px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none', width: '100%', marginTop: '8px' } }),
        ]),
      ]),
    ], 'Checkout')] },
];

// ════════════════════════════════════════════════════════════════════
//  FORM SECTIONS
// ════════════════════════════════════════════════════════════════════

const FORM_SECTIONS: SectionBlock[] = [
  { id: 'form-newsletter', name: 'Newsletter Signup', category: 'Forms', description: 'Simple email newsletter form',
    elements: [s('section', {}, { desktop: { padding: '80px 60px', backgroundColor: '#0a0a0a', textAlign: 'center' } }, [
      s('container', {}, { desktop: { maxWidth: '500px', margin: '0 auto' } }, [
        s('heading', { text: 'Stay Updated', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '12px' } }),
        s('text', { text: 'Get the latest news and updates delivered to your inbox.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '28px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '8px' }, mobile: { flexDirection: 'column' } }, [
          s('input', { placeholder: 'Enter your email', label: '', inputType: 'email' }, { desktop: { padding: '14px 16px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', flex: '1', backgroundColor: '#111', color: '#fff' } }),
          s('button', { text: 'Subscribe', href: '#' }, { desktop: { padding: '14px 28px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.04em' } }),
        ]),
      ]),
    ], 'Newsletter')] },
  { id: 'form-login', name: 'Login Form', category: 'Forms', description: 'Clean login form with email and password',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', display: 'flex', justifyContent: 'center' } }, [
      s('card', {}, { desktop: { padding: '48px', backgroundColor: '#0a0a0a', borderRadius: '16px', border: '1px solid #1a1a1a', width: '100%', maxWidth: '400px' } }, [
        s('heading', { text: 'Welcome Back', level: 'h2' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '8px', textAlign: 'center' } }),
        s('text', { text: 'Sign in to your account' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px', textAlign: 'center' } }),
        s('form', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
          s('input', { placeholder: 'Email address', label: '', inputType: 'email' }, { desktop: { padding: '14px 16px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#111', color: '#fff' } }),
          s('input', { placeholder: 'Password', label: '', inputType: 'password' }, { desktop: { padding: '14px 16px', borderRadius: '8px', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#111', color: '#fff' } }),
          s('button', { text: 'Sign In', href: '#' }, { desktop: { padding: '14px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', width: '100%' } }),
          s('text', { text: 'Don\'t have an account? Sign up' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', textAlign: 'center' } }),
        ]),
      ]),
    ], 'Login')] },
  { id: 'form-multi-step', name: 'Multi-Step Enquiry', category: 'Forms', description: 'Multi-section enquiry form',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto' } }, [
        s('heading', { text: 'Get a Quote', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '12px' } }),
        s('text', { text: 'Tell us about your project and we\'ll get back to you within 24 hours.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', marginBottom: '40px', lineHeight: '1.6' } }),
        s('form', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }, mobile: { gridTemplateColumns: '1fr' } }, [
            s('input', { placeholder: 'First Name', label: '', inputType: 'text' }, { desktop: { padding: '14px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', backgroundColor: '#0a0a0a', color: '#fff' } }),
            s('input', { placeholder: 'Last Name', label: '', inputType: 'text' }, { desktop: { padding: '14px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', backgroundColor: '#0a0a0a', color: '#fff' } }),
          ]),
          s('input', { placeholder: 'Company Name', label: '', inputType: 'text' }, { desktop: { padding: '14px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#0a0a0a', color: '#fff' } }),
          s('input', { placeholder: 'Email Address', label: '', inputType: 'email' }, { desktop: { padding: '14px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#0a0a0a', color: '#fff' } }),
          s('select', { placeholder: 'Project Budget', options: ['Under $5,000', '$5,000 - $15,000', '$15,000 - $50,000', '$50,000+'], label: '' }, { desktop: { padding: '14px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', backgroundColor: '#0a0a0a', color: '#fff' } }),
          s('textarea', { placeholder: 'Tell us about your project…', label: '' }, { desktop: { padding: '14px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '14px', width: '100%', minHeight: '120px', backgroundColor: '#0a0a0a', color: '#fff' } }),
          s('button', { text: 'Submit Enquiry', href: '#' }, { desktop: { padding: '18px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
        ]),
      ]),
    ], 'Enquiry Form')] },
];

// ════════════════════════════════════════════════════════════════════
//  ADDITIONAL TESTIMONIALS
// ════════════════════════════════════════════════════════════════════

const MORE_TESTIMONIALS: SectionBlock[] = [
  { id: 'test-carousel', name: 'Testimonial — Full Width', category: 'Testimonials', description: 'Full-width centered testimonial',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000', textAlign: 'center' } }, [
      s('container', {}, { desktop: { maxWidth: '700px', margin: '0 auto' } }, [
        s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '32px' } }, [
          ...Array(5).fill(null).map(() => s('text', { text: '★' }, { desktop: { fontSize: '18px', color: '#f59e0b' } })),
        ]),
        s('text', { text: '"This platform has completely revolutionised how we approach our digital strategy. The results speak for themselves — 300% increase in conversions."' }, { desktop: { fontSize: '22px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.6', fontWeight: '500', letterSpacing: '-0.01em', marginBottom: '32px' } }),
        s('image', { src: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face', alt: 'Avatar' }, { desktop: { width: '48px', height: '48px', borderRadius: '50%', margin: '0 auto 12px', objectFit: 'cover' } }),
        s('text', { text: 'David Thompson' }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#fff' } }),
        s('text', { text: 'VP of Marketing, ScaleUp Inc.' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '4px' } }),
      ]),
    ], 'Testimonial')] },
  { id: 'test-logo-row', name: 'Testimonial + Logos', category: 'Testimonials', description: 'Quote with company logos below',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a' } }, [
      s('container', {}, { desktop: { maxWidth: '700px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' } }, [
        s('text', { text: '"' }, { desktop: { fontSize: '80px', fontWeight: '700', color: 'rgba(255,255,255,0.06)', lineHeight: '0.5', marginBottom: '20px' } }),
        s('text', { text: 'The team delivered beyond our wildest expectations. Our platform went from concept to launch in record time.' }, { desktop: { fontSize: '24px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', fontWeight: '500', marginBottom: '28px' } }),
        s('text', { text: '— Lisa Park, CEO at Meridian' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)' } }),
      ]),
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '40px' } }, [
        s('text', { text: 'TRUSTED BY INDUSTRY LEADERS' }, { desktop: { fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textAlign: 'center', marginBottom: '24px' } }),
        s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '48px', alignItems: 'center' } },
          ['Stripe', 'Notion', 'Linear', 'Figma', 'Vercel'].map(name =>
            s('text', { text: name }, { desktop: { fontSize: '15px', fontWeight: '700', color: 'rgba(255,255,255,0.12)', letterSpacing: '0.04em' } })
          )),
      ]),
    ], 'Testimonial')] },
];

// ════════════════════════════════════════════════════════════════════
//  ADDITIONAL PRICING
// ════════════════════════════════════════════════════════════════════

const MORE_PRICING: SectionBlock[] = [
  { id: 'pricing-2col', name: '2 Tier — Comparison', category: 'Pricing', description: 'Two-tier side-by-side pricing',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', textAlign: 'center', marginBottom: '56px' } }, [
        s('heading', { text: 'Choose Your Plan', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' } }),
        s('text', { text: 'Start free, scale as you grow.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '800px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        s('card', {}, { desktop: { padding: '48px', borderRadius: '16px', border: '1px solid #1a1a1a', backgroundColor: 'transparent', textAlign: 'center' } }, [
          s('heading', { text: 'Free', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '16px' } }),
          s('heading', { text: '$0', level: 'h2' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', marginBottom: '8px', letterSpacing: '-0.04em' } }),
          s('text', { text: '/month' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' } }),
          s('text', { text: '3 projects\n1GB storage\nCommunity support\nBasic analytics' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '2.2', whiteSpace: 'pre-line', marginBottom: '32px' } }),
          s('button', { text: 'Get Started', href: '#' }, { desktop: { padding: '14px', backgroundColor: 'transparent', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)', width: '100%' } }),
        ]),
        s('card', {}, { desktop: { padding: '48px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', backgroundColor: '#111', textAlign: 'center' } }, [
          s('badge', { text: 'RECOMMENDED' }, { desktop: { padding: '4px 12px', backgroundColor: '#fff', color: '#000', borderRadius: '4px', fontSize: '9px', fontWeight: '700', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.08em' } }),
          s('heading', { text: 'Pro', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '16px' } }),
          s('heading', { text: '$49', level: 'h2' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', marginBottom: '8px', letterSpacing: '-0.04em' } }),
          s('text', { text: '/month' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '32px' } }),
          s('text', { text: 'Unlimited projects\n100GB storage\nPriority support\nAdvanced analytics\nCustom domain\nAPI access' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '2.2', whiteSpace: 'pre-line', marginBottom: '32px' } }),
          s('button', { text: 'Start Free Trial', href: '#' }, { desktop: { padding: '14px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none', width: '100%' } }),
        ]),
      ]),
    ], 'Pricing')] },
];

// ════════════════════════════════════════════════════════════════════
//  ADDITIONAL CTA SECTIONS
// ════════════════════════════════════════════════════════════════════

const MORE_CTA: SectionBlock[] = [
  { id: 'cta-gradient', name: 'Gradient CTA', category: 'CTA', description: 'Vibrant gradient background CTA',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)', textAlign: 'center' } }, [
      s('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto' } }, [
        s('heading', { text: 'Start Building Today', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px', lineHeight: '1.1' } }),
        s('text', { text: 'No credit card required. Free plan available.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center' } }, [
          s('button', { text: 'Get Started Free', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: '#fff', color: '#6366f1', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none' } }),
          s('button', { text: 'Book a Demo', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: 'transparent', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.3)' } }),
        ]),
      ]),
    ], 'CTA')] },
  { id: 'cta-with-stats', name: 'CTA + Stats', category: 'CTA', description: 'CTA section with supporting statistics',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr', gap: '40px' } }, [
        s('container', {}, { desktop: {} }, [
          s('heading', { text: 'Join 10,000+ Companies Already Growing With Us', level: 'h2' }, { desktop: { fontSize: '38px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '20px', lineHeight: '1.15' } }),
          s('text', { text: 'Start your free trial today. No credit card required.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.45)', marginBottom: '32px', lineHeight: '1.6' } }),
          s('button', { text: 'Start Free Trial', href: '#' }, { desktop: { padding: '16px 36px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em', textTransform: 'uppercase' as any } }),
        ]),
        s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' } },
          [{ v: '10K+', l: 'Active Users' }, { v: '99.9%', l: 'Uptime SLA' }, { v: '4.9/5', l: 'Customer Rating' }, { v: '<2min', l: 'Avg Response' }].map(st =>
            s('card', {}, { desktop: { padding: '28px', backgroundColor: '#0a0a0a', borderRadius: '12px', border: '1px solid #1a1a1a', textAlign: 'center' } }, [
              s('heading', { text: st.v, level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '4px', letterSpacing: '-0.02em' } }),
              s('text', { text: st.l }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as any, letterSpacing: '0.1em', fontWeight: '600' } }),
            ])
          )),
      ]),
    ], 'CTA')] },
];

// ════════════════════════════════════════════════════════════════════
//  ADDITIONAL FOOTERS
// ════════════════════════════════════════════════════════════════════

const MORE_FOOTERS: SectionBlock[] = [
  { id: 'footer-centered', name: 'Centered Footer', category: 'Footers', description: 'Centered footer with social links',
    elements: [s('footer', {}, { desktop: { padding: '60px', backgroundColor: '#000', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' } }, [
      s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', marginBottom: '24px' } }),
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '24px' } },
        ['Twitter', 'LinkedIn', 'Instagram', 'GitHub'].map(name =>
          s('link', { text: name, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' } })
        )),
      s('text', { text: '© 2026 Brand. All rights reserved.' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)' } }),
    ], 'Footer')] },
  { id: 'footer-large', name: 'Large Footer — CTA + Links', category: 'Footers', description: 'Footer with newsletter and link columns',
    elements: [s('footer', {}, { desktop: { padding: '80px 60px 40px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.06)' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '40px', marginBottom: '60px' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [
          s('container', {}, { desktop: {} }, [
            s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', marginBottom: '16px' } }),
            s('text', { text: 'Subscribe to our newsletter' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '12px' } }),
            s('container', {}, { desktop: { display: 'flex', gap: '6px' } }, [
              s('input', { placeholder: 'Email', label: '', inputType: 'email' }, { desktop: { padding: '10px', borderRadius: '0', border: '1px solid #1a1a1a', fontSize: '12px', flex: '1', backgroundColor: '#0a0a0a', color: '#fff' } }),
              s('button', { text: '→', href: '#' }, { desktop: { padding: '10px 16px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '14px', fontWeight: '700', border: 'none' } }),
            ]),
          ]),
          ...['Product', 'Company', 'Resources', 'Legal'].map(col =>
            s('container', {}, { desktop: {} }, [
              s('text', { text: col }, { desktop: { fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: '16px', textTransform: 'uppercase' as any } }),
              ...['Link One', 'Link Two', 'Link Three'].map(link =>
                s('link', { text: link, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', display: 'block', marginBottom: '10px' } })
              ),
            ])
          ),
        ]),
        s('container', {}, { desktop: { borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, mobile: { flexDirection: 'column', gap: '12px' } }, [
          s('text', { text: '© 2026 Brand. All rights reserved.' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.2)' } }),
          s('container', {}, { desktop: { display: 'flex', gap: '16px' } },
            ['Privacy', 'Terms', 'Cookies'].map(name =>
              s('link', { text: name, href: '#' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.25)', textDecoration: 'none' } })
            )),
        ]),
      ]),
    ], 'Footer')] },
];

// ════════════════════════════════════════════════════════════════════
//  MARKETING — Conversion-focused sections
// ════════════════════════════════════════════════════════════════════

const MARKETING_SECTIONS: SectionBlock[] = [
  {
    id: 'mkt-countdown', name: 'Countdown Timer', category: 'Banners',
    description: 'Urgency countdown for launches or sales',
    elements: [s('section', {}, { desktop: { padding: '48px 60px', background: 'linear-gradient(135deg, #dc2626, #b91c1c)', textAlign: 'center' } }, [
      s('text', { text: 'FLASH SALE ENDS IN' }, { desktop: { fontSize: '11px', fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.15em', marginBottom: '16px' } }),
      s('countdown', { label: '', targetDate: '' }, { desktop: { display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '20px' } }),
      s('button', { text: 'Shop Now — 50% Off', href: '#' }, { desktop: { padding: '14px 36px', backgroundColor: '#fff', color: '#dc2626', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none' } }),
    ], 'Countdown')],
  },
  {
    id: 'mkt-newsletter', name: 'Newsletter Signup', category: 'Forms',
    description: 'Email capture with social proof',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#f8fafc', textAlign: 'center' } }, [
      s('container', {}, { desktop: { maxWidth: '560px', margin: '0 auto' } }, [
        s('heading', { text: 'Stay in the Loop', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#1e293b', marginBottom: '12px', letterSpacing: '-0.02em' } }),
        s('text', { text: 'Get weekly insights on design, development, and business growth. Trusted by 25,000+ professionals.' }, { desktop: { fontSize: '16px', color: '#64748b', lineHeight: '1.7', marginBottom: '32px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '8px', marginBottom: '16px' } }, [
          s('input', { placeholder: 'your@email.com', label: '', inputType: 'email' }, { desktop: { flex: '1', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: '#fff' } }),
          s('button', { text: 'Subscribe', href: '#' }, { desktop: { padding: '14px 28px', backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none' } }),
        ]),
        s('text', { text: '✓ No spam · ✓ Unsubscribe anytime · ✓ Free forever' }, { desktop: { fontSize: '12px', color: '#94a3b8' } }),
      ]),
    ], 'Newsletter')],
  },
  {
    id: 'mkt-social-proof', name: 'Social Proof Bar', category: 'Banners',
    description: 'Trust indicators with avatars and ratings',
    elements: [s('section', {}, { desktop: { padding: '40px 60px', backgroundColor: '#fff', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' } }, [
      s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' as any }, mobile: { flexDirection: 'column', gap: '16px' } }, [
        s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          s('text', { text: '⭐⭐⭐⭐⭐' }, { desktop: { fontSize: '16px' } }),
          s('text', { text: '4.9/5 from 2,000+ reviews' }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#1e293b' } }),
        ]),
        s('container', {}, { desktop: { width: '1px', height: '24px', backgroundColor: '#e2e8f0' }, mobile: { display: 'none' } }),
        s('text', { text: 'Trusted by 10,000+ businesses worldwide' }, { desktop: { fontSize: '14px', color: '#64748b' } }),
        s('container', {}, { desktop: { width: '1px', height: '24px', backgroundColor: '#e2e8f0' }, mobile: { display: 'none' } }),
        s('text', { text: '🔒 SOC2 Certified · GDPR Compliant' }, { desktop: { fontSize: '13px', color: '#94a3b8' } }),
      ]),
    ], 'Social Proof')],
  },
  {
    id: 'mkt-comparison', name: 'Comparison Table', category: 'Features',
    description: 'Us vs. competitors feature comparison',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#fff' } }, [
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '48px' } }, [
        s('heading', { text: 'Why Choose Us?', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#1e293b', marginBottom: '12px', letterSpacing: '-0.02em' } }),
        s('text', { text: 'See how we stack up against the competition.' }, { desktop: { fontSize: '16px', color: '#64748b' } }),
      ]),
      s('table', {
        headers: ['Feature', 'Us', 'Competitor A', 'Competitor B'],
        rows: [
          ['Unlimited projects', '✓', '✗', '✓'],
          ['AI-powered design', '✓', '✗', '✗'],
          ['Custom code export', '✓', '✓', '✗'],
          ['24/7 Support', '✓', '✗', '✗'],
          ['Starting price', '£49/mo', '£99/mo', '£79/mo'],
        ]
      }, { desktop: { width: '100%', maxWidth: '800px', margin: '0 auto' } }),
    ], 'Comparison')],
  },
  {
    id: 'mkt-feature-bento', name: 'Bento Grid Features', category: 'Features',
    description: 'Modern bento-style feature grid',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '56px' } }, [
        s('badge', { text: 'FEATURES' }, { desktop: { padding: '6px 14px', backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderRadius: '2px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '20px', letterSpacing: '0.12em' } }),
        s('heading', { text: 'Everything You Need', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'auto auto', gap: '16px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } }, [
        s('card', {}, { desktop: { gridColumn: 'span 2', padding: '48px', backgroundColor: '#111', borderRadius: '16px', border: '1px solid #1a1a1a' } }, [
          s('text', { text: '⚡' }, { desktop: { fontSize: '28px', marginBottom: '16px' } }),
          s('heading', { text: 'Lightning Fast Performance', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
          s('text', { text: 'Built for speed with sub-100ms response times and global CDN distribution.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
        ]),
        s('card', {}, { desktop: { padding: '48px', backgroundColor: '#111', borderRadius: '16px', border: '1px solid #1a1a1a' } }, [
          s('text', { text: '🔒' }, { desktop: { fontSize: '28px', marginBottom: '16px' } }),
          s('heading', { text: 'Enterprise Security', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
          s('text', { text: 'SOC2 compliant with end-to-end encryption.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
        ]),
        s('card', {}, { desktop: { padding: '48px', backgroundColor: '#111', borderRadius: '16px', border: '1px solid #1a1a1a' } }, [
          s('text', { text: '🎨' }, { desktop: { fontSize: '28px', marginBottom: '16px' } }),
          s('heading', { text: 'Visual Builder', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
          s('text', { text: 'Drag-and-drop interface with pixel precision.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
        ]),
        s('card', {}, { desktop: { gridColumn: 'span 2', padding: '48px', backgroundColor: '#111', borderRadius: '16px', border: '1px solid #1a1a1a' } }, [
          s('text', { text: '🤖' }, { desktop: { fontSize: '28px', marginBottom: '16px' } }),
          s('heading', { text: 'AI-Powered Intelligence', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
          s('text', { text: 'Generate layouts, copy, and images with natural language prompts.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
        ]),
      ]),
    ], 'Features')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  STOREFRONT — Live interactive widgets
// ════════════════════════════════════════════════════════════════════

const STOREFRONT_SECTIONS: SectionBlock[] = [
  {
    id: 'sf-product-grid-full', name: 'Live Product Grid', category: 'Ecommerce',
    description: 'Interactive product grid with search, categories & add-to-cart',
    elements: [s('section', {}, { desktop: { padding: '80px 40px', backgroundColor: '#fff' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '40px' } }, [
        s('badge', { text: 'SHOP' }, { desktop: { padding: '6px 16px', backgroundColor: '#000', color: '#fff', borderRadius: '0', fontSize: '10px', fontWeight: '700', letterSpacing: '0.1em', display: 'inline-block', marginBottom: '16px' } }),
        s('heading', { text: 'Our Products', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '800', color: '#000', letterSpacing: '-0.02em' } }),
      ]),
      s('product-grid' as any, { columns: 4, showSearch: true, showCategories: true }, { desktop: { width: '100%' } }, [], 'Product Grid'),
    ], 'Shop')],
  },
  {
    id: 'sf-booking-section', name: 'Booking Section', category: 'Ecommerce',
    description: 'Appointment scheduler with calendar & time slots',
    elements: [s('section', {}, { desktop: { padding: '80px 40px', backgroundColor: '#f9fafb' } }, [
      s('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto', textAlign: 'center', marginBottom: '32px' } }, [
        s('heading', { text: 'Book an Appointment', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '800', color: '#000' } }),
        s('text', { text: 'Choose a date and time that works best for you.' }, { desktop: { fontSize: '16px', color: '#64748b', marginTop: '8px' } }),
      ]),
      s('booking-widget' as any, {}, { desktop: { width: '100%' } }, [], 'Booking Widget'),
    ], 'Booking')],
  },
  {
    id: 'sf-auth-section', name: 'Visitor Login / Signup', category: 'Ecommerce',
    description: 'Authentication section for site visitors',
    elements: [s('section', {}, { desktop: { padding: '80px 40px', backgroundColor: '#fff' } }, [
      s('container', {}, { desktop: { maxWidth: '400px', margin: '0 auto' } }, [
        s('visitor-auth' as any, {}, { desktop: { width: '100%' } }, [], 'Login / Signup'),
      ]),
    ], 'Auth')],
  },
  {
    id: 'sf-dashboard-section', name: 'Customer Dashboard', category: 'Ecommerce',
    description: 'Visitor dashboard for orders, bookings & account management',
    elements: [s('section', {}, { desktop: { padding: '60px 40px', backgroundColor: '#fafafa' } }, [
      s('visitor-dashboard' as any, {}, { desktop: { width: '100%' } }, [], 'Customer Dashboard'),
    ], 'Dashboard')],
  },
  {
    id: 'sf-nav-with-cart', name: 'Navbar + Cart Button', category: 'Navbars',
    description: 'Navigation bar with integrated shopping cart button',
    elements: [s('navbar', { brand: 'Brand' }, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 60px', width: '100%', backgroundColor: '#000', borderBottom: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '16px 20px' } }, [
      s('heading', { text: 'STORE', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em' } }),
      s('container', {}, { desktop: { display: 'flex', gap: '32px', alignItems: 'center' }, mobile: { display: 'none' } }, [
        ...['Home', 'Shop', 'About', 'Contact'].map(l => s('link', { text: l, href: '#' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontWeight: '500' } })),
        s('cart-button' as any, { text: 'Cart' }, { desktop: { padding: '8px 16px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '11px', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase' as any, cursor: 'pointer' } }, [], 'Cart'),
      ]),
    ], 'Store Nav')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  PORTFOLIO SECTIONS
// ════════════════════════════════════════════════════════════════════

const PORTFOLIO_SECTIONS: SectionBlock[] = [
  { id: 'port-masonry', name: 'Masonry Portfolio', category: 'Portfolio', description: 'Masonry-style project showcase grid',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', marginBottom: '56px', textAlign: 'center' } }, [
        s('text', { text: 'SELECTED WORK' }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', marginBottom: '16px', textTransform: 'uppercase' as any } }),
        s('heading', { text: 'Projects That Define Us', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.1' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } },
        [
          { t: 'Brand Redesign', cat: 'BRANDING', img: 'photo-1618005182384-a83a8bd57fbe', h: '400px' },
          { t: 'E-Commerce Platform', cat: 'DEVELOPMENT', img: 'photo-1460925895917-afdab827c52f', h: '300px' },
          { t: 'Mobile App UI', cat: 'DESIGN', img: 'photo-1558618666-fcd25c85f82e', h: '350px' },
          { t: 'Marketing Campaign', cat: 'MARKETING', img: 'photo-1552664730-d307ca884978', h: '320px' },
          { t: 'SaaS Dashboard', cat: 'PRODUCT', img: 'photo-1551288049-bebda4e38f71', h: '380px' },
          { t: 'Corporate Website', cat: 'WEB', img: 'photo-1497366216548-37526070297c', h: '340px' },
        ].map(p =>
          s('card', {}, { desktop: { position: 'relative', overflow: 'hidden', borderRadius: '8px', height: p.h, cursor: 'pointer' } }, [
            s('image', { src: `https://images.unsplash.com/${p.img}?w=600&h=500&fit=crop`, alt: p.t }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s ease' } }),
            s('container', {}, { desktop: { position: 'absolute', inset: '0', background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px' } }, [
              s('text', { text: p.cat }, { desktop: { fontSize: '9px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.12em', marginBottom: '8px' } }),
              s('text', { text: p.t }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff' } }),
            ]),
          ])
        )),
    ], 'Portfolio')] },
  { id: 'port-case-study', name: 'Case Study — Split', category: 'Portfolio', description: 'Featured case study with large image',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '600px', backgroundColor: '#0a0a0a' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { overflow: 'hidden' } }, [
        s('image', { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=700&fit=crop', alt: 'Case Study' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ]),
      s('container', {}, { desktop: { padding: '80px 60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '48px 24px' } }, [
        s('text', { text: 'CASE STUDY' }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#3b82f6', letterSpacing: '0.15em', marginBottom: '20px' } }),
        s('heading', { text: 'How We Increased\nConversions by 340%', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', lineHeight: '1.15', marginBottom: '20px' } }),
        s('text', { text: 'A deep dive into the strategy, design, and development that transformed our client\'s digital presence and drove measurable business results.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '32px', maxWidth: '440px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '40px', marginBottom: '32px' } }, [
          s('container', {}, { desktop: {} }, [
            s('text', { text: '340%' }, { desktop: { fontSize: '32px', fontWeight: '800', color: '#3b82f6' } }),
            s('text', { text: 'Conversion Increase' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.35)' } }),
          ]),
          s('container', {}, { desktop: {} }, [
            s('text', { text: '2.4x' }, { desktop: { fontSize: '32px', fontWeight: '800', color: '#10b981' } }),
            s('text', { text: 'Revenue Growth' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.35)' } }),
          ]),
        ]),
        s('button', { text: 'Read Full Case Study →', href: '#' }, { desktop: { padding: '14px 28px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '12px', fontWeight: '600', border: 'none', letterSpacing: '0.06em', width: 'fit-content' } }),
      ]),
    ], 'Case Study')] },
];

// ════════════════════════════════════════════════════════════════════
//  ABOUT / STORY SECTIONS
// ════════════════════════════════════════════════════════════════════

const ABOUT_SECTIONS: SectionBlock[] = [
  { id: 'about-story-timeline', name: 'Company Timeline', category: 'About', description: 'Visual timeline of company milestones',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' } }, [
        s('heading', { text: 'Our Journey', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' } }),
        s('text', { text: 'From a small startup to a global digital agency.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' } }),
      ]),
      s('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto', position: 'relative', paddingLeft: '40px' } }, [
        s('container', {}, { desktop: { position: 'absolute', left: '14px', top: '0', bottom: '0', width: '2px', background: 'linear-gradient(to bottom, transparent, rgba(59,130,246,0.5), transparent)' } }),
        ...[
          { year: '2018', title: 'Founded', desc: 'Started in a garage with a vision to transform digital experiences.' },
          { year: '2020', title: 'First 100 Clients', desc: 'Reached our first major milestone and expanded the team to 15.' },
          { year: '2022', title: 'Series A', desc: 'Raised $12M to accelerate growth and expand internationally.' },
          { year: '2024', title: 'Global Presence', desc: 'Now serving 500+ clients across 30 countries from 4 offices.' },
        ].map((item, i) =>
          s('container', {}, { desktop: { display: 'flex', gap: '24px', marginBottom: '48px', position: 'relative' } }, [
            s('container', {}, { desktop: { position: 'absolute', left: '-33px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#3b82f6', border: '3px solid #000', boxShadow: '0 0 0 2px #3b82f6' } }),
            s('container', {}, { desktop: {} }, [
              s('text', { text: item.year }, { desktop: { fontSize: '13px', fontWeight: '700', color: '#3b82f6', marginBottom: '8px', letterSpacing: '0.06em' } }),
              s('heading', { text: item.title, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
              s('text', { text: item.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', maxWidth: '500px' } }),
            ]),
          ])
        ),
      ]),
    ], 'Timeline')] },
  { id: 'about-values-grid', name: 'Values — Icon Grid', category: 'About', description: 'Core values with icon boxes',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' } }, [
        s('heading', { text: 'Our Core Values', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' } }),
        s('text', { text: 'The principles that guide every decision we make.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)' } },
        [
          { icon: '🎯', title: 'Precision', desc: 'Every pixel, every interaction, meticulously crafted.' },
          { icon: '🚀', title: 'Innovation', desc: 'Pushing boundaries with cutting-edge technology.' },
          { icon: '🤝', title: 'Integrity', desc: 'Transparent partnerships built on mutual trust.' },
          { icon: '⚡', title: 'Speed', desc: 'Delivering exceptional work in record time.' },
        ].map(v =>
          s('card', {}, { desktop: { padding: '40px 28px', backgroundColor: '#111', borderRadius: '16px', border: '1px solid #1a1a1a', textAlign: 'center', transition: 'border-color 0.3s ease' } }, [
            s('text', { text: v.icon }, { desktop: { fontSize: '36px', marginBottom: '20px' } }),
            s('heading', { text: v.title, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
            s('text', { text: v.desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
          ])
        )),
    ], 'Values')] },
];

// ════════════════════════════════════════════════════════════════════
//  COMPARISON SECTIONS
// ════════════════════════════════════════════════════════════════════

const COMPARISON_SECTIONS: SectionBlock[] = [
  { id: 'comp-before-after', name: 'Before / After Split', category: 'Comparison', description: 'Side-by-side before and after comparison',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', textAlign: 'center', marginBottom: '56px' } }, [
        s('heading', { text: 'The Transformation', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' } }),
        s('text', { text: 'See the difference our work makes.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', maxWidth: '1000px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden' }, mobile: { gridTemplateColumns: '1fr' } }, [
        s('container', {}, { desktop: { position: 'relative' } }, [
          s('image', { src: 'https://images.unsplash.com/photo-1487017159836-4e23ece2e4cf?w=600&h=400&fit=crop', alt: 'Before' }, { desktop: { width: '100%', height: '400px', objectFit: 'cover', filter: 'grayscale(100%)' } }),
          s('text', { text: 'BEFORE' }, { desktop: { position: 'absolute', top: '16px', left: '16px', padding: '6px 14px', backgroundColor: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', borderRadius: '4px' } }),
        ]),
        s('container', {}, { desktop: { position: 'relative' } }, [
          s('image', { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', alt: 'After' }, { desktop: { width: '100%', height: '400px', objectFit: 'cover' } }),
          s('text', { text: 'AFTER' }, { desktop: { position: 'absolute', top: '16px', left: '16px', padding: '6px 14px', backgroundColor: 'rgba(59,130,246,0.9)', color: '#fff', fontSize: '10px', fontWeight: '700', letterSpacing: '0.12em', borderRadius: '4px' } }),
        ]),
      ]),
    ], 'Comparison')] },
  { id: 'comp-feature-table', name: 'Feature Comparison Table', category: 'Comparison', description: 'Detailed feature comparison with checkmarks',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#0a0a0a' } }, [
      s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', textAlign: 'center', marginBottom: '56px' } }, [
        s('heading', { text: 'Compare Plans', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px' } }),
      ]),
      s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', border: '1px solid #1a1a1a' } }, [
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '20px 24px', backgroundColor: '#111', borderBottom: '1px solid #1a1a1a' } }, [
          s('text', { text: 'Feature' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' } }),
          s('text', { text: 'Starter' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textAlign: 'center' } }),
          s('text', { text: 'Pro' }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#3b82f6', textAlign: 'center' } }),
          s('text', { text: 'Enterprise' }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.5)', textAlign: 'center' } }),
        ]),
        ...['Custom Domain', 'SSL Certificate', 'Analytics', 'Priority Support', 'API Access'].map((feature, i) =>
          s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' } }, [
            s('text', { text: feature }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.7)' } }),
            s('text', { text: i < 2 ? '✓' : '—' }, { desktop: { fontSize: '14px', color: i < 2 ? '#10b981' : 'rgba(255,255,255,0.15)', textAlign: 'center' } }),
            s('text', { text: '✓' }, { desktop: { fontSize: '14px', color: '#10b981', textAlign: 'center' } }),
            s('text', { text: '✓' }, { desktop: { fontSize: '14px', color: '#10b981', textAlign: 'center' } }),
          ])
        ),
      ]),
    ], 'Comparison')] },
];

// ════════════════════════════════════════════════════════════════════
//  ANIMATED SECTIONS (Wow Factor)
// ════════════════════════════════════════════════════════════════════

const ANIMATED_SECTIONS: SectionBlock[] = [
  { id: 'anim-gradient-hero', name: 'Gradient Mesh Hero', category: 'Animated', description: 'Hero with animated gradient mesh background',
    elements: [s('section', {}, { desktop: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 25%, #0a1628 50%, #0a0a0a 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' } }, [
      s('container', {}, { desktop: { position: 'absolute', top: '20%', left: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', filter: 'blur(60px)' } }),
      s('container', {}, { desktop: { position: 'absolute', bottom: '10%', right: '15%', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', filter: 'blur(50px)' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '1', maxWidth: '800px' }, mobile: { padding: '0 24px' } }, [
        s('badge', { text: 'NOW IN BETA' }, { desktop: { padding: '8px 20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(236,72,153,0.2))', color: 'rgba(255,255,255,0.7)', borderRadius: '40px', fontSize: '10px', fontWeight: '700', display: 'inline-block', marginBottom: '32px', letterSpacing: '0.12em', border: '1px solid rgba(255,255,255,0.1)' } }),
        s('heading', { text: 'The Next Generation\nof Digital Creation', level: 'h1' }, { desktop: { fontSize: '76px', fontWeight: '800', color: '#fff', lineHeight: '1.02', letterSpacing: '-0.04em', marginBottom: '24px' }, mobile: { fontSize: '42px' } }),
        s('text', { text: 'Build websites, apps, and digital experiences at the speed of thought with AI-powered tools.' }, { desktop: { fontSize: '19px', color: 'rgba(255,255,255,0.4)', marginBottom: '44px', lineHeight: '1.6', maxWidth: '540px', margin: '0 auto 44px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center' } }, [
          s('button', { text: 'Start Building', href: '#' }, { desktop: { padding: '18px 44px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none' } }),
          s('button', { text: 'Watch Demo', href: '#' }, { desktop: { padding: '18px 44px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)' } }),
        ]),
      ]),
    ], 'Hero')] },
  { id: 'anim-stats-counter', name: 'Animated Stats Strip', category: 'Animated', description: 'Large animated counter numbers',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' } }, [
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }, mobile: { gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' } },
        [
          { val: '10K+', label: 'Active Users', color: '#3b82f6' },
          { val: '99.9%', label: 'Uptime SLA', color: '#10b981' },
          { val: '150+', label: 'Countries', color: '#f59e0b' },
          { val: '4.9★', label: 'Rating', color: '#ec4899' },
        ].map(stat =>
          s('container', {}, { desktop: {} }, [
            s('heading', { text: stat.val, level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '800', color: stat.color, letterSpacing: '-0.04em', lineHeight: '1', marginBottom: '12px' } }),
            s('text', { text: stat.label }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', fontWeight: '500' } }),
          ])
        )),
    ], 'Stats')] },
  { id: 'anim-scroll-reveal', name: 'Scroll Reveal — Steps', category: 'Animated', description: 'Steps that reveal on scroll with animations',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', textAlign: 'center', marginBottom: '80px' } }, [
        s('heading', { text: 'How It Works', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' } }),
        s('text', { text: 'Three simple steps to transform your workflow.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)' } }),
      ]),
      ...[
        { num: '01', title: 'Connect Your Data', desc: 'Import from any source — databases, APIs, spreadsheets. Our intelligent connectors handle the rest.', align: 'left' },
        { num: '02', title: 'Design Your Flow', desc: 'Use our visual builder to create powerful workflows without writing a single line of code.', align: 'right' },
        { num: '03', title: 'Deploy & Scale', desc: 'One-click deployment to production. Auto-scaling infrastructure handles millions of events.', align: 'left' },
      ].map((step, i) =>
        s('container', {}, { desktop: { display: 'flex', justifyContent: step.align === 'right' ? 'flex-end' : 'flex-start', maxWidth: '900px', margin: '0 auto', marginBottom: '64px' } }, [
          s('card', {}, { desktop: { padding: '48px', backgroundColor: '#0a0a0a', borderRadius: '20px', border: '1px solid #1a1a1a', maxWidth: '600px', position: 'relative', overflow: 'hidden' } }, [
            s('text', { text: step.num }, { desktop: { fontSize: '120px', fontWeight: '900', color: 'rgba(255,255,255,0.03)', position: 'absolute', top: '-20px', right: '20px', lineHeight: '1', letterSpacing: '-0.06em' } }),
            s('container', {}, { desktop: { position: 'relative', zIndex: '1' } }, [
              s('text', { text: `STEP ${step.num}` }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#3b82f6', letterSpacing: '0.12em', marginBottom: '16px' } }),
              s('heading', { text: step.title, level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '12px', letterSpacing: '-0.01em' } }),
              s('text', { text: step.desc }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7' } }),
            ]),
          ]),
        ])
      ),
    ], 'How It Works')] },
  { id: 'anim-text-reveal-hero', name: 'Text Reveal Hero', category: 'Animated', description: 'Large text with gradient reveal effect',
    elements: [s('section', {}, { desktop: { minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', textAlign: 'center' } }, [
      s('container', {}, { desktop: { maxWidth: '1000px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        s('heading', { text: 'We Don\'t Just Build\nWebsites. We Build\nExperiences.', level: 'h1' }, { desktop: { fontSize: '80px', fontWeight: '800', background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.3) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: '1.06', letterSpacing: '-0.04em' } as any, mobile: { fontSize: '40px' } }),
      ]),
    ], 'Hero')] },
  { id: 'anim-bento-grid', name: 'Bento Grid — Feature Cards', category: 'Animated', description: 'Apple-style bento grid layout for features',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', backgroundColor: '#000' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' } }, [
        s('heading', { text: 'Everything You Need', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridAutoRows: '240px', gap: '12px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr', gridAutoRows: 'auto' } }, [
        s('card', {}, { desktop: { gridColumn: 'span 2', padding: '48px', background: 'linear-gradient(135deg, #111 0%, #1a1a2e 100%)', borderRadius: '20px', border: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' } }, [
          s('heading', { text: 'AI-Powered Generation', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
          s('text', { text: 'Generate entire websites from a single text prompt. Our AI understands your vision.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.45)', maxWidth: '400px' } }),
        ]),
        s('card', {}, { desktop: { padding: '36px', backgroundColor: '#0f172a', borderRadius: '20px', border: '1px solid #1e293b', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } }, [
          s('text', { text: '⚡' }, { desktop: { fontSize: '36px', marginBottom: '16px' } }),
          s('heading', { text: 'Instant Preview', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
          s('text', { text: 'See changes in real-time as you design.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }),
        ]),
        s('card', {}, { desktop: { padding: '36px', backgroundColor: '#111', borderRadius: '20px', border: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } }, [
          s('text', { text: '🎨' }, { desktop: { fontSize: '36px', marginBottom: '16px' } }),
          s('heading', { text: 'Design System', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', marginBottom: '8px' } }),
          s('text', { text: 'Global tokens for consistent branding.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }),
        ]),
        s('card', {}, { desktop: { gridColumn: 'span 2', padding: '48px', background: 'linear-gradient(135deg, #0a1628 0%, #111 100%)', borderRadius: '20px', border: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } }, [
          s('heading', { text: 'Export Production-Ready Code', level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
          s('text', { text: 'Download clean, semantic HTML, CSS, and JavaScript. Deploy anywhere.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.45)', maxWidth: '400px' } }),
        ]),
      ]),
    ], 'Bento Features')] },
  { id: 'anim-floating-cards', name: 'Floating Feature Cards', category: 'Animated', description: 'Cards with depth shadows and hover lift effect',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', background: 'linear-gradient(180deg, #0a0a0a 0%, #111 100%)' } }, [
      s('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '64px' } }, [
        s('heading', { text: 'Why Teams Choose Us', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em' } }),
      ]),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto' }, mobile: { gridTemplateColumns: '1fr' } },
        [
          { icon: '🔒', title: 'Enterprise Security', desc: 'SOC2 Type II certified. Your data is encrypted at rest and in transit.', gradient: 'linear-gradient(135deg, #0f172a, #1e293b)' },
          { icon: '🌍', title: 'Global CDN', desc: '200+ edge locations. Sub-50ms latency for users worldwide.', gradient: 'linear-gradient(135deg, #0a1628, #1a2744)' },
          { icon: '🛠', title: 'Developer First', desc: 'API-first architecture. SDKs for every language. Webhooks for everything.', gradient: 'linear-gradient(135deg, #1a0a2e, #2d1b4e)' },
        ].map(f =>
          s('card', {}, { desktop: { padding: '48px 36px', background: f.gradient, borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', transition: 'transform 0.4s ease, box-shadow 0.4s ease' } }, [
            s('text', { text: f.icon }, { desktop: { fontSize: '40px', marginBottom: '24px' } }),
            s('heading', { text: f.title, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
            s('text', { text: f.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' } }),
          ])
        )),
    ], 'Features')] },
  { id: 'anim-glass-testimonial', name: 'Glassmorphism Testimonial', category: 'Animated', description: 'Frosted glass testimonial card on gradient',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', background: 'linear-gradient(135deg, #0a0a2e 0%, #1a0a3e 50%, #0a1628 100%)', display: 'flex', justifyContent: 'center' } }, [
      s('card', {}, { desktop: { maxWidth: '680px', padding: '56px', backgroundColor: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' } }, [
        s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '28px' } }, [
          ...Array(5).fill(null).map(() => s('text', { text: '★' }, { desktop: { fontSize: '20px', color: '#f59e0b' } })),
        ]),
        s('text', { text: '"This is hands down the best website builder I\'ve ever used. The AI generation is mind-blowing, and the editor gives you total control."' }, { desktop: { fontSize: '20px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', fontWeight: '500', marginBottom: '32px' } }),
        s('container', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' } }, [
          s('image', { src: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face', alt: 'Avatar' }, { desktop: { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.2)' } }),
          s('container', {}, { desktop: { textAlign: 'left' } }, [
            s('text', { text: 'Marcus Chen' }, { desktop: { fontSize: '15px', fontWeight: '700', color: '#fff' } }),
            s('text', { text: 'CTO, Quantum Labs' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.4)' } }),
          ]),
        ]),
      ]),
    ], 'Testimonial')] },
  { id: 'anim-cta-gradient', name: 'Gradient CTA — Full Width', category: 'Animated', description: 'Full-width gradient CTA with glow effect',
    elements: [s('section', {}, { desktop: { padding: '120px 60px', background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 50%, #6366f1 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' } }, [
      s('container', {}, { desktop: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', filter: 'blur(40px)' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '1', maxWidth: '600px', margin: '0 auto' } }, [
        s('heading', { text: 'Start Building\nYour Future Today', level: 'h2' }, { desktop: { fontSize: '52px', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.1', marginBottom: '20px' } }),
        s('text', { text: 'No credit card required. Start free and scale as you grow.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.7)', marginBottom: '36px', lineHeight: '1.6' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center' } }, [
          s('button', { text: 'Get Started Free', href: '#' }, { desktop: { padding: '18px 44px', backgroundColor: '#fff', color: '#1e3a5f', borderRadius: '8px', fontSize: '14px', fontWeight: '700', border: 'none' } }),
          s('button', { text: 'Book a Demo', href: '#' }, { desktop: { padding: '18px 44px', backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.3)' } }),
        ]),
      ]),
    ], 'CTA')] },
];

// ════════════════════════════════════════════════════════════════════
//  ERROR / 404 SECTIONS
// ════════════════════════════════════════════════════════════════════

const ERROR_SECTIONS: SectionBlock[] = [
  { id: 'error-404-minimal', name: '404 — Minimal', category: 'Error', description: 'Clean minimal 404 page',
    elements: [s('section', {}, { desktop: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', textAlign: 'center' } }, [
      s('container', {}, { desktop: { maxWidth: '500px' } }, [
        s('heading', { text: '404', level: 'h1' }, { desktop: { fontSize: '120px', fontWeight: '900', color: 'rgba(255,255,255,0.05)', letterSpacing: '-0.06em', lineHeight: '1', marginBottom: '8px' } }),
        s('heading', { text: 'Page Not Found', level: 'h2' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '16px' } }),
        s('text', { text: 'The page you\'re looking for doesn\'t exist or has been moved.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' } }),
        s('button', { text: 'Go Home', href: '/' }, { desktop: { padding: '14px 36px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em' } }),
      ]),
    ], '404')] },
];

// ════════════════════════════════════════════════════════════════════
//  EXPORT ALL SECTIONS
// ════════════════════════════════════════════════════════════════════

export const ALL_SECTION_BLOCKS: SectionBlock[] = [
  ...NAVBARS,
  ...HEROES,
  ...FEATURES,
  ...CTA_SECTIONS,
  ...MORE_CTA,
  ...TESTIMONIALS,
  ...MORE_TESTIMONIALS,
  ...PRICING_SECTIONS,
  ...MORE_PRICING,
  ...STATS_SECTIONS,
  ...FAQ_SECTIONS,
  ...CONTACT_SECTIONS,
  ...FOOTER_SECTIONS,
  ...MORE_FOOTERS,
  ...GALLERY_SECTIONS,
  ...LOGO_SECTIONS,
  ...TEAM_SECTIONS,
  ...CONTENT_SECTIONS,
  ...BANNER_SECTIONS,
  ...BLOG_SECTIONS,
  ...ECOMMERCE_SECTIONS,
  ...MARKETING_SECTIONS,
  ...STOREFRONT_SECTIONS,
  ...FORM_SECTIONS,
  ...PORTFOLIO_SECTIONS,
  ...ABOUT_SECTIONS,
  ...COMPARISON_SECTIONS,
  ...ANIMATED_SECTIONS,
  ...ERROR_SECTIONS,
  ...PREMIUM_SECTION_BLOCKS,
  ...PREMIUM_SECTION_BLOCKS_V2,
  ...PREMIUM_SECTION_BLOCKS_V3,
  ...PREMIUM_SECTION_BLOCKS_V4,
  ...PREMIUM_SECTION_BLOCKS_V5,
  ...PREMIUM_SECTION_BLOCKS_V6,
  ...PREMIUM_SECTION_BLOCKS_V7,
  ...PREMIUM_SECTION_BLOCKS_V8,
  ...PREMIUM_SECTION_BLOCKS_V9,
  ...PREMIUM_SECTION_BLOCKS_V10,
  // Product page sections from templates
  ...PRODUCT_PAGE_TEMPLATES.map(t => ({
    id: `section-${t.id}`,
    name: `${t.icon} ${t.name}`,
    category: 'Product Pages' as SectionCategory,
    description: t.description,
    elements: t.elements,
  })),
];

export const SECTION_CATEGORIES: SectionCategory[] = [
  'Navbars', 'Heroes', 'Features', 'Content', 'CTA',
  'Testimonials', 'Pricing', 'FAQ', 'Team', 'Stats',
  'Gallery', 'Logos', 'Contact', 'Footers', 'Blog',
  'Ecommerce', 'Forms', 'Banners',
  'Portfolio', 'About', 'Comparison', 'Animated', 'Error',
  'Interactive',
];
