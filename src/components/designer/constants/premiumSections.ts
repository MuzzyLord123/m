import { EditorElement } from '../types';
import { SectionBlock, SectionCategory } from './sectionBlocks';

let _pc = 0;
function pid(): string {
  _pc++;
  return `prem-${_pc}-${Math.random().toString(36).slice(2, 7)}`;
}

function p(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: pid(), type, name: name ?? type, props, styles, children };
}

// ════════════════════════════════════════════════════════════════════
//  SAAS / STARTUP HEROES
// ════════════════════════════════════════════════════════════════════

const SAAS_HEROES: SectionBlock[] = [
  {
    id: 'hero-saas-gradient', name: 'SaaS — Gradient Glow', category: 'Heroes',
    description: 'Dark hero with radial gradient glow, badge, and dual CTAs — Linear/Vercel style',
    elements: [p('section', {}, { desktop: { minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '80px 24px' }, mobile: { minHeight: '80vh', padding: '60px 20px' } }, [
      // Radial glow
      p('container', {}, { desktop: { position: 'absolute', width: '800px', height: '800px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }, mobile: { width: '400px', height: '400px' } }),
      p('container', {}, { desktop: { maxWidth: '800px', position: 'relative', zIndex: '1' } }, [
        // Badge
        p('badge', { text: '✨ Now in Public Beta' }, { desktop: { display: 'inline-flex', padding: '6px 16px', borderRadius: '100px', fontSize: '12px', fontWeight: '500', color: '#a78bfa', backgroundColor: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', marginBottom: '24px', letterSpacing: '0.02em' } }),
        p('heading', { text: 'Build products\npeople love', level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '700', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.04em', marginBottom: '24px', whiteSpace: 'pre-line' }, mobile: { fontSize: '40px' } }),
        p('text', { text: 'The all-in-one platform for modern teams. Ship faster, iterate smarter, and scale with confidence.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', maxWidth: '560px', margin: '0 auto 40px', fontWeight: '400' }, mobile: { fontSize: '16px' } }),
        p('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' } }, [
          p('button', { text: 'Start for Free →' }, { desktop: { padding: '14px 32px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none' } }),
          p('button', { text: 'Watch Demo' }, { desktop: { padding: '14px 32px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.7)', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.15)' } }),
        ]),
      ]),
    ], 'SaaS Hero')],
  },
  {
    id: 'hero-saas-product', name: 'SaaS — Product Screenshot', category: 'Heroes',
    description: 'Hero with centered product mockup, trust logos below',
    elements: [p('section', {}, { desktop: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#09090b', padding: '120px 24px 80px', textAlign: 'center', gap: '48px' }, mobile: { padding: '80px 20px 60px', minHeight: 'auto' } }, [
      p('container', {}, { desktop: { maxWidth: '720px' } }, [
        p('heading', { text: 'The modern stack\nfor building web apps', level: 'h1' }, { desktop: { fontSize: '64px', fontWeight: '700', color: '#fafafa', lineHeight: '1.08', letterSpacing: '-0.035em', marginBottom: '20px', whiteSpace: 'pre-line' }, mobile: { fontSize: '36px' } }),
        p('text', { text: 'Everything you need to go from zero to production. Database, auth, storage, and edge functions — all in one.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '36px' }, mobile: { fontSize: '15px' } }),
        p('button', { text: 'Get Started — It\'s Free' }, { desktop: { padding: '16px 40px', backgroundColor: '#fff', color: '#000', borderRadius: '10px', fontSize: '15px', fontWeight: '600', border: 'none' } }),
      ]),
      // Product mockup placeholder
      p('container', {}, { desktop: { width: '100%', maxWidth: '1000px', aspectRatio: '16/9', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }, mobile: { aspectRatio: '4/3' } }, [
        p('text', { text: '[ Product Screenshot ]' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.15)' } }),
      ]),
      // Trust logos
      p('container', {}, { desktop: { display: 'flex', gap: '48px', alignItems: 'center', opacity: '0.3' }, mobile: { gap: '24px', flexWrap: 'wrap', justifyContent: 'center' } }, [
        p('text', { text: 'STRIPE' }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '0.15em' } }),
        p('text', { text: 'VERCEL' }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '0.15em' } }),
        p('text', { text: 'LINEAR' }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '0.15em' } }),
        p('text', { text: 'NOTION' }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '0.15em' } }),
        p('text', { text: 'FIGMA' }, { desktop: { fontSize: '14px', fontWeight: '700', color: '#fff', letterSpacing: '0.15em' } }),
      ]),
    ], 'SaaS Product Hero')],
  },
  {
    id: 'hero-saas-split-video', name: 'SaaS — Split with Video', category: 'Heroes',
    description: 'Two-column hero: copy left, video/animation placeholder right',
    elements: [p('section', {}, { desktop: { minHeight: '90vh', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', backgroundColor: '#000', padding: '0 80px', gap: '80px' }, mobile: { gridTemplateColumns: '1fr', padding: '80px 24px', gap: '40px', minHeight: 'auto' } }, [
      p('container', {}, { desktop: {} }, [
        p('text', { text: 'FOR DEVELOPERS' }, { desktop: { fontSize: '11px', fontWeight: '600', color: '#6366f1', letterSpacing: '0.15em', marginBottom: '16px', textTransform: 'uppercase' as any } }),
        p('heading', { text: 'Ship code,\nnot infrastructure', level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.03em', marginBottom: '24px', whiteSpace: 'pre-line' }, mobile: { fontSize: '36px' } }),
        p('text', { text: 'Focus on building amazing products. We handle the servers, scaling, and infrastructure so you don\'t have to.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.45)', lineHeight: '1.7', marginBottom: '40px' } }),
        p('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
          p('button', { text: 'Deploy Now' }, { desktop: { padding: '14px 28px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none' } }),
          p('button', { text: 'Read Docs' }, { desktop: { padding: '14px 28px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', borderRadius: '8px', fontSize: '14px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.12)' } }),
        ]),
      ]),
      p('container', {}, { desktop: { width: '100%', aspectRatio: '1', backgroundColor: 'rgba(99,102,241,0.05)', borderRadius: '24px', border: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
        p('text', { text: '▶ Video / Animation' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.15)' } }),
      ]),
    ], 'Split Hero')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  SAAS FEATURE SECTIONS
// ════════════════════════════════════════════════════════════════════

function featureCard(icon: string, title: string, desc: string) {
  return p('card', {}, { desktop: { padding: '32px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' } }, [
    p('text', { text: icon }, { desktop: { fontSize: '28px', marginBottom: '16px' } }),
    p('heading', { text: title, level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
    p('text', { text: desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
  ]);
}

const SAAS_FEATURES: SectionBlock[] = [
  {
    id: 'feat-bento-grid', name: 'Bento Grid — SaaS', category: 'Features',
    description: 'Asymmetric bento-style feature grid like Linear/Vercel',
    elements: [p('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 20px' } }, [
      p('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        p('text', { text: 'FEATURES' }, { desktop: { fontSize: '11px', fontWeight: '600', color: '#6366f1', letterSpacing: '0.15em', textTransform: 'uppercase' as any, marginBottom: '12px' } }),
        p('heading', { text: 'Everything you need to ship', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '64px', lineHeight: '1.1' }, mobile: { fontSize: '32px', marginBottom: '40px' } }),
        p('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }, mobile: { gridTemplateColumns: '1fr', gap: '12px' } }, [
          // Large card spanning 2 cols
          p('card', {}, { desktop: { padding: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', gridColumn: 'span 2' }, mobile: { gridColumn: 'span 1' } }, [
            p('text', { text: '⚡' }, { desktop: { fontSize: '32px', marginBottom: '20px' } }),
            p('heading', { text: 'Lightning Fast Deployments', level: 'h3' }, { desktop: { fontSize: '22px', fontWeight: '600', color: '#fff', marginBottom: '12px' } }),
            p('text', { text: 'Push to deploy in under 10 seconds. Every commit triggers an instant preview, and production is always one click away.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', maxWidth: '480px' } }),
          ]),
          featureCard('🔒', 'Enterprise Security', 'SOC 2 compliant with encryption at rest and in transit.'),
          featureCard('📊', 'Real-time Analytics', 'Monitor performance metrics as they happen with live dashboards.'),
          featureCard('🔌', 'API First', 'Every feature is accessible via our comprehensive REST and GraphQL APIs.'),
          // Large card spanning 2 cols
          p('card', {}, { desktop: { padding: '40px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', gridColumn: 'span 2' }, mobile: { gridColumn: 'span 1' } }, [
            p('text', { text: '🌍' }, { desktop: { fontSize: '32px', marginBottom: '20px' } }),
            p('heading', { text: 'Global Edge Network', level: 'h3' }, { desktop: { fontSize: '22px', fontWeight: '600', color: '#fff', marginBottom: '12px' } }),
            p('text', { text: 'Serve your users from 200+ edge locations worldwide. Automatic SSL, DDoS protection, and smart routing included.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', maxWidth: '480px' } }),
          ]),
        ]),
      ]),
    ], 'Bento Features')],
  },
  {
    id: 'feat-icon-grid-4', name: 'Icon Grid — 4 Column', category: 'Features',
    description: 'Clean four-column feature grid with icons and descriptions',
    elements: [p('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#09090b' }, mobile: { padding: '60px 20px' } }, [
      p('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', textAlign: 'center' } }, [
        p('heading', { text: 'Why teams choose us', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fafafa', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '30px' } }),
        p('text', { text: 'Everything you need, nothing you don\'t.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', marginBottom: '64px' } }),
        p('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', textAlign: 'left' }, mobile: { gridTemplateColumns: '1fr 1fr', gap: '20px' } }, [
          featureCard('🚀', 'Fast Setup', 'Get started in minutes with zero config.'),
          featureCard('🎯', 'Type Safe', 'End-to-end TypeScript. Catch bugs early.'),
          featureCard('🔄', 'Auto Scaling', 'Scales to millions without manual intervention.'),
          featureCard('🧩', 'Integrations', '200+ native integrations with tools you love.'),
          featureCard('📱', 'Mobile Ready', 'Responsive by default. Works on any device.'),
          featureCard('🔐', 'Auth Built In', 'Social login, MFA, and SSO out of the box.'),
          featureCard('💾', 'Database', 'Postgres with real-time subscriptions built in.'),
          featureCard('📧', 'Notifications', 'Email, push, and in-app notifications in one API.'),
        ]),
      ]),
    ], 'Feature Grid')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  AGENCY / PORTFOLIO
// ════════════════════════════════════════════════════════════════════

const AGENCY_HEROES: SectionBlock[] = [
  {
    id: 'hero-agency-fullscreen', name: 'Agency — Full Screen Statement', category: 'Heroes',
    description: 'Bold full-screen hero with massive typography and scroll indicator',
    elements: [p('section', {}, { desktop: { minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: '#0a0a0a', padding: '0 80px', position: 'relative' }, mobile: { padding: '0 24px' } }, [
      p('container', {}, { desktop: { maxWidth: '1200px' } }, [
        p('heading', { text: 'We design\nexperiences that\nmove people.', level: 'h1' }, { desktop: { fontSize: '86px', fontWeight: '600', color: '#fff', lineHeight: '1.02', letterSpacing: '-0.04em', whiteSpace: 'pre-line' }, mobile: { fontSize: '42px' } }),
        p('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '60px' }, mobile: { flexDirection: 'column', gap: '24px', marginTop: '40px' } }, [
          p('text', { text: 'A creative studio specializing in brand identity,\ndigital design, and immersive experiences.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', whiteSpace: 'pre-line' } }),
          p('button', { text: 'View Our Work →' }, { desktop: { padding: '16px 36px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.04em' } }),
        ]),
      ]),
      // Scroll indicator
      p('text', { text: 'SCROLL' }, { desktop: { position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: '500', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em' } }),
    ], 'Agency Hero')],
  },
  {
    id: 'hero-agency-reel', name: 'Agency — Showreel Hero', category: 'Heroes',
    description: 'Centered play button with background video placeholder',
    elements: [p('section', {}, { desktop: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', position: 'relative', textAlign: 'center' }, mobile: { padding: '80px 24px' } }, [
      p('container', {}, { desktop: { position: 'relative', zIndex: '1' } }, [
        p('text', { text: 'CREATIVE STUDIO' }, { desktop: { fontSize: '11px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '24px' } }),
        p('heading', { text: 'Stories worth telling.', level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '600', color: '#fff', letterSpacing: '-0.04em', marginBottom: '40px' }, mobile: { fontSize: '40px' } }),
        p('container', {}, { desktop: { width: '80px', height: '80px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', cursor: 'pointer' } }, [
          p('text', { text: '▶' }, { desktop: { fontSize: '24px', color: '#fff', marginLeft: '4px' } }),
        ]),
        p('text', { text: 'Watch Showreel — 2:30' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '16px', letterSpacing: '0.05em' } }),
      ]),
    ], 'Showreel Hero')],
  },
];

const AGENCY_SECTIONS: SectionBlock[] = [
  {
    id: 'portfolio-case-study', name: 'Case Study — Split Layout', category: 'Portfolio',
    description: 'Case study showcase with image and project details side by side',
    elements: [p('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '80vh', backgroundColor: '#0a0a0a' }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
      p('container', {}, { desktop: { backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', aspectRatio: '4/3' } }, [
        p('text', { text: '[ Project Image ]' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.1)' } }),
      ]),
      p('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px' }, mobile: { padding: '40px 24px' } }, [
        p('text', { text: 'CASE STUDY' }, { desktop: { fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', marginBottom: '16px' } }),
        p('heading', { text: 'Redesigning the digital\nexperience for Nike', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '600', color: '#fff', letterSpacing: '-0.03em', lineHeight: '1.15', marginBottom: '20px', whiteSpace: 'pre-line' }, mobile: { fontSize: '28px' } }),
        p('text', { text: 'A complete digital transformation spanning web, mobile, and in-store kiosks. Increased conversion by 340% and reduced bounce rate by 60%.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '32px' } }),
        p('container', {}, { desktop: { display: 'flex', gap: '48px' } }, [
          p('container', {}, { desktop: {} }, [
            p('text', { text: '+340%' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff' } }),
            p('text', { text: 'Conversion' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' } }),
          ]),
          p('container', {}, { desktop: {} }, [
            p('text', { text: '-60%' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff' } }),
            p('text', { text: 'Bounce Rate' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em' } }),
          ]),
        ]),
        p('button', { text: 'View Project →' }, { desktop: { padding: '14px 28px', backgroundColor: 'transparent', color: '#fff', borderRadius: '0', fontSize: '12px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.15)', marginTop: '32px', alignSelf: 'flex-start', letterSpacing: '0.04em' } }),
      ]),
    ], 'Case Study')],
  },
  {
    id: 'agency-services-list', name: 'Services — Numbered List', category: 'Content',
    description: 'Agency services listed with large numbers and descriptions',
    elements: [p('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 24px' } }, [
      p('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto' } }, [
        p('heading', { text: 'What we do', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '600', color: '#fff', letterSpacing: '-0.03em', marginBottom: '64px' }, mobile: { fontSize: '32px', marginBottom: '40px' } }),
        ...[
          { num: '01', title: 'Brand Strategy', desc: 'We uncover your brand\'s DNA and craft strategies that resonate with your audience.' },
          { num: '02', title: 'Digital Design', desc: 'From websites to apps, we create beautiful, functional digital experiences.' },
          { num: '03', title: 'Motion & Video', desc: 'Bringing brands to life through animation, film, and interactive media.' },
          { num: '04', title: 'Development', desc: 'Pixel-perfect front-end and robust back-end engineering for scale.' },
        ].map(item =>
          p('container', {}, { desktop: { display: 'flex', gap: '40px', padding: '32px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }, mobile: { gap: '20px' } }, [
            p('text', { text: item.num }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.2)', minWidth: '40px' } }),
            p('container', {}, { desktop: { flex: '1' } }, [
              p('heading', { text: item.title, level: 'h3' }, { desktop: { fontSize: '24px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
              p('text', { text: item.desc }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
            ]),
          ])
        ),
      ]),
    ], 'Services List')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  E-COMMERCE / PRODUCT SECTIONS
// ════════════════════════════════════════════════════════════════════

const ECOM_PREMIUM: SectionBlock[] = [
  {
    id: 'hero-ecom-product-launch', name: 'Product Launch — Hero', category: 'Heroes',
    description: 'Centered product with dramatic lighting and launch CTA',
    elements: [p('section', {}, { desktop: { minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', textAlign: 'center', padding: '80px 24px', position: 'relative', overflow: 'hidden' }, mobile: { minHeight: '80vh', padding: '60px 20px' } }, [
      p('container', {}, { desktop: { position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' } }),
      p('container', {}, { desktop: { position: 'relative', zIndex: '1', maxWidth: '640px' } }, [
        p('text', { text: 'INTRODUCING' }, { desktop: { fontSize: '11px', fontWeight: '600', color: '#fbbf24', letterSpacing: '0.2em', marginBottom: '20px' } }),
        p('heading', { text: 'The Future of\nEveryday Design', level: 'h1' }, { desktop: { fontSize: '64px', fontWeight: '700', color: '#fff', lineHeight: '1.08', letterSpacing: '-0.04em', marginBottom: '20px', whiteSpace: 'pre-line' }, mobile: { fontSize: '38px' } }),
        p('text', { text: 'Meticulously crafted. Obsessively detailed. Available now.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', marginBottom: '40px' } }),
        p('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center' } }, [
          p('button', { text: 'Shop Now — $299' }, { desktop: { padding: '16px 36px', backgroundColor: '#fbbf24', color: '#000', borderRadius: '10px', fontSize: '14px', fontWeight: '700', border: 'none' } }),
          p('button', { text: 'Learn More' }, { desktop: { padding: '16px 36px', backgroundColor: 'transparent', color: 'rgba(255,255,255,0.6)', borderRadius: '10px', fontSize: '14px', fontWeight: '500', border: '1px solid rgba(255,255,255,0.12)' } }),
        ]),
      ]),
    ], 'Product Launch')],
  },
  {
    id: 'ecom-product-features', name: 'Product Benefits — Icons', category: 'Features',
    description: 'Product USPs with icons in a clean horizontal layout',
    elements: [p('section', {}, { desktop: { padding: '80px', backgroundColor: '#0a0a0a', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '40px 20px' } }, [
      p('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', textAlign: 'center' }, mobile: { gridTemplateColumns: '1fr 1fr', gap: '24px' } }, [
        ...[
          { icon: '🚚', text: 'Free Shipping', sub: 'On orders over $50' },
          { icon: '↩️', text: '30-Day Returns', sub: 'No questions asked' },
          { icon: '🛡️', text: '2-Year Warranty', sub: 'Full coverage included' },
          { icon: '💬', text: '24/7 Support', sub: 'Always here for you' },
        ].map(item =>
          p('container', {}, { desktop: {} }, [
            p('text', { text: item.icon }, { desktop: { fontSize: '28px', marginBottom: '12px' } }),
            p('text', { text: item.text }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#fff', marginBottom: '4px' } }),
            p('text', { text: item.sub }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.35)' } }),
          ])
        ),
      ]),
    ], 'Product Benefits')],
  },
  {
    id: 'ecom-comparison', name: 'Product Comparison Table', category: 'Comparison',
    description: 'Clean comparison table for product tiers or features',
    elements: [p('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 20px' } }, [
      p('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', textAlign: 'center' } }, [
        p('heading', { text: 'Compare Plans', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '48px' }, mobile: { fontSize: '30px' } }),
        // Header row
        p('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.1)', padding: '16px 0' } }, [
          p('text', { text: '' }, { desktop: {} }),
          p('text', { text: 'Starter' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)' } }),
          p('text', { text: 'Pro' }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#fff' } }),
          p('text', { text: 'Enterprise' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)' } }),
        ]),
        // Feature rows
        ...['Storage', 'Users', 'API Calls', 'Support', 'Custom Domain'].map(feat =>
          p('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0', borderBottom: '1px solid rgba(255,255,255,0.04)', padding: '14px 0', textAlign: 'center' } }, [
            p('text', { text: feat }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', textAlign: 'left' } }),
            p('text', { text: '✓' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)' } }),
            p('text', { text: '✓' }, { desktop: { fontSize: '14px', color: '#6366f1' } }),
            p('text', { text: '✓' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.3)' } }),
          ])
        ),
      ]),
    ], 'Comparison')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  CREATIVE / EDITORIAL SECTIONS
// ════════════════════════════════════════════════════════════════════

const CREATIVE_SECTIONS: SectionBlock[] = [
  {
    id: 'hero-editorial-bold', name: 'Editorial — Bold Type', category: 'Heroes',
    description: 'Magazine-style hero with oversized typography and asymmetric layout',
    elements: [p('section', {}, { desktop: { minHeight: '100vh', display: 'grid', gridTemplateColumns: '3fr 2fr', backgroundColor: '#0a0a0a', position: 'relative' }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
      p('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px' }, mobile: { padding: '60px 24px 20px' } }, [
        p('heading', { text: 'THE\nART OF\nLESS.', level: 'h1' }, { desktop: { fontSize: '96px', fontWeight: '800', color: '#fff', lineHeight: '0.95', letterSpacing: '-0.05em', whiteSpace: 'pre-line' }, mobile: { fontSize: '56px' } }),
        p('container', {}, { desktop: { marginTop: '48px', maxWidth: '360px' } }, [
          p('text', { text: 'Minimalism isn\'t about having less. It\'s about making room for what matters.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7' } }),
          p('text', { text: 'Read the Essay →' }, { desktop: { fontSize: '13px', fontWeight: '600', color: '#fff', marginTop: '24px', cursor: 'pointer', letterSpacing: '0.03em' } }),
        ]),
      ]),
      p('container', {}, { desktop: { backgroundColor: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
        p('text', { text: '[ Editorial Image ]' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.08)' } }),
      ]),
    ], 'Editorial Hero')],
  },
  {
    id: 'creative-marquee-text', name: 'Marquee — Scrolling Text', category: 'Animated',
    description: 'Continuous scrolling text band — great for branding statements',
    elements: [p('section', {}, { desktop: { padding: '40px 0', backgroundColor: '#000', overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' } }, [
      p('marquee', { text: 'DESIGN • DEVELOP • DEPLOY • CREATE • INNOVATE • BUILD • DESIGN • DEVELOP • DEPLOY • CREATE • INNOVATE • BUILD •' }, { desktop: { fontSize: '48px', fontWeight: '800', color: 'rgba(255,255,255,0.06)', letterSpacing: '0.02em', whiteSpace: 'nowrap' }, mobile: { fontSize: '28px' } }),
    ], 'Marquee')],
  },
  {
    id: 'creative-split-reveal', name: 'Split Reveal — Two Tone', category: 'Content',
    description: 'Half black, half white section with contrasting text',
    elements: [p('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '70vh' }, mobile: { gridTemplateColumns: '1fr', minHeight: 'auto' } }, [
      p('container', {}, { desktop: { backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }, mobile: { padding: '60px 24px' } }, [
        p('heading', { text: 'Think\ndifferent.', level: 'h2' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', letterSpacing: '-0.04em', lineHeight: '1.05', whiteSpace: 'pre-line' }, mobile: { fontSize: '36px' } }),
      ]),
      p('container', {}, { desktop: { backgroundColor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px' }, mobile: { padding: '60px 24px' } }, [
        p('text', { text: 'We believe the best work happens at the intersection of creativity and technology. Every project is an opportunity to push boundaries and redefine what\'s possible.' }, { desktop: { fontSize: '18px', color: 'rgba(0,0,0,0.6)', lineHeight: '1.8', maxWidth: '400px' } }),
      ]),
    ], 'Split Reveal')],
  },
  {
    id: 'creative-text-wall', name: 'Text Wall — Statement', category: 'Content',
    description: 'Full-width oversized text for impact statements',
    elements: [p('section', {}, { desktop: { padding: '160px 80px', backgroundColor: '#000', textAlign: 'center' }, mobile: { padding: '80px 24px' } }, [
      p('heading', { text: 'We don\'t follow trends.\nWe set them.', level: 'h2' }, { desktop: { fontSize: '72px', fontWeight: '700', color: '#fff', letterSpacing: '-0.04em', lineHeight: '1.1', maxWidth: '900px', margin: '0 auto', whiteSpace: 'pre-line' }, mobile: { fontSize: '36px' } }),
    ], 'Statement')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  PREMIUM PRICING
// ════════════════════════════════════════════════════════════════════

const PREMIUM_PRICING: SectionBlock[] = [
  {
    id: 'pricing-gradient-cards', name: 'Pricing — Gradient Cards', category: 'Pricing',
    description: 'Three-tier pricing with highlighted pro card and gradient border',
    elements: [p('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000', textAlign: 'center' }, mobile: { padding: '60px 20px' } }, [
      p('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto' } }, [
        p('heading', { text: 'Simple, transparent pricing', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '30px' } }),
        p('text', { text: 'No hidden fees. No surprises. Cancel anytime.' }, { desktop: { fontSize: '17px', color: 'rgba(255,255,255,0.4)', marginBottom: '64px' } }),
        p('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'stretch' }, mobile: { gridTemplateColumns: '1fr', gap: '16px' } }, [
          // Starter
          p('card', {}, { desktop: { padding: '40px 32px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' } }, [
            p('text', { text: 'Starter' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' } }),
            p('heading', { text: '$0', level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
            p('text', { text: '/month' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '24px' } }),
            p('text', { text: 'Perfect for side projects and experimentation.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6', marginBottom: '24px' } }),
            p('button', { text: 'Get Started' }, { desktop: { width: '100%', padding: '12px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' } }),
          ]),
          // Pro — highlighted
          p('card', {}, { desktop: { padding: '40px 32px', backgroundColor: 'rgba(99,102,241,0.06)', borderRadius: '16px', border: '1px solid rgba(99,102,241,0.3)', textAlign: 'left', position: 'relative' } }, [
            p('badge', { text: 'POPULAR' }, { desktop: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: '100px', fontSize: '10px', fontWeight: '700', color: '#fff', backgroundColor: '#6366f1', letterSpacing: '0.1em' } }),
            p('text', { text: 'Pro' }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#a78bfa', marginBottom: '8px' } }),
            p('heading', { text: '$29', level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
            p('text', { text: '/month' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '24px' } }),
            p('text', { text: 'For professionals and growing teams.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6', marginBottom: '24px' } }),
            p('button', { text: 'Start Free Trial' }, { desktop: { width: '100%', padding: '12px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none', textAlign: 'center' } }),
          ]),
          // Enterprise
          p('card', {}, { desktop: { padding: '40px 32px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' } }, [
            p('text', { text: 'Enterprise' }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' } }),
            p('heading', { text: 'Custom', level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', marginBottom: '4px' } }),
            p('text', { text: 'pricing' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginBottom: '24px' } }),
            p('text', { text: 'For organizations with advanced needs.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6', marginBottom: '24px' } }),
            p('button', { text: 'Contact Sales' }, { desktop: { width: '100%', padding: '12px', backgroundColor: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' } }),
          ]),
        ]),
      ]),
    ], 'Pricing Cards')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  PREMIUM TESTIMONIALS
// ════════════════════════════════════════════════════════════════════

const PREMIUM_TESTIMONIALS: SectionBlock[] = [
  {
    id: 'testimonial-large-quote', name: 'Testimonial — Large Quote', category: 'Testimonials',
    description: 'Full-width centered testimonial with large quote and avatar',
    elements: [p('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000', textAlign: 'center' }, mobile: { padding: '60px 24px' } }, [
      p('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto' } }, [
        p('text', { text: '"' }, { desktop: { fontSize: '120px', fontWeight: '700', color: 'rgba(99,102,241,0.2)', lineHeight: '0.5', marginBottom: '20px' } }),
        p('text', { text: 'This product completely transformed how our team works. We shipped 3x faster and our customers couldn\'t be happier.' }, { desktop: { fontSize: '28px', fontWeight: '500', color: '#fff', lineHeight: '1.5', letterSpacing: '-0.02em', marginBottom: '32px' }, mobile: { fontSize: '20px' } }),
        p('container', {}, { desktop: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' } }, [
          p('container', {}, { desktop: { width: '44px', height: '44px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)' } }),
          p('container', {}, { desktop: { textAlign: 'left' } }, [
            p('text', { text: 'Sarah Chen' }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#fff' } }),
            p('text', { text: 'VP of Engineering, Acme Inc' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.4)' } }),
          ]),
        ]),
      ]),
    ], 'Large Quote')],
  },
  {
    id: 'testimonial-card-grid', name: 'Testimonials — Card Wall', category: 'Testimonials',
    description: 'Masonry-style testimonial cards from multiple users',
    elements: [p('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#09090b' }, mobile: { padding: '60px 20px' } }, [
      p('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', textAlign: 'center' } }, [
        p('heading', { text: 'Loved by thousands', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fafafa', letterSpacing: '-0.03em', marginBottom: '48px' }, mobile: { fontSize: '30px' } }),
        p('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }, mobile: { gridTemplateColumns: '1fr', gap: '12px' } }, [
          ...[
            { quote: 'Absolutely incredible product. Saved us hundreds of hours.', name: 'Alex Rivera', role: 'CTO, Startup' },
            { quote: 'The best investment our team has made this year. Period.', name: 'Jamie Park', role: 'PM, Scale-up' },
            { quote: 'Intuitive, fast, and beautiful. Everything just works.', name: 'Morgan Lee', role: 'Designer, Agency' },
            { quote: 'We migrated from 3 different tools to this one. No regrets.', name: 'Taylor Kim', role: 'Founder, SaaS' },
            { quote: 'Customer support is world-class. They truly care.', name: 'Casey Wu', role: 'Ops Lead' },
            { quote: 'Finally a product that delivers on its promises.', name: 'Jordan Smith', role: 'VP Eng' },
          ].map(t =>
            p('card', {}, { desktop: { padding: '28px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left' } }, [
              p('text', { text: `"${t.quote}"` }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', marginBottom: '16px' } }),
              p('text', { text: t.name }, { desktop: { fontSize: '13px', fontWeight: '600', color: '#fff' } }),
              p('text', { text: t.role }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.3)' } }),
            ])
          ),
        ]),
      ]),
    ], 'Testimonial Wall')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  PREMIUM CTA SECTIONS
// ════════════════════════════════════════════════════════════════════

const PREMIUM_CTA: SectionBlock[] = [
  {
    id: 'cta-glow-card', name: 'CTA — Glowing Card', category: 'CTA',
    description: 'Centered CTA card with gradient border glow effect',
    elements: [p('section', {}, { desktop: { padding: '120px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 20px' } }, [
      p('card', {}, { desktop: { maxWidth: '700px', margin: '0 auto', padding: '64px', borderRadius: '20px', backgroundColor: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.15)', textAlign: 'center', boxShadow: '0 0 80px rgba(99,102,241,0.08)' }, mobile: { padding: '40px 24px' } }, [
        p('heading', { text: 'Ready to get started?', level: 'h2' }, { desktop: { fontSize: '40px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '16px' }, mobile: { fontSize: '28px' } }),
        p('text', { text: 'Join 10,000+ teams already building with us. Free to start, no credit card required.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '32px' } }),
        p('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center' } }, [
          p('button', { text: 'Start Building →' }, { desktop: { padding: '14px 32px', backgroundColor: '#6366f1', color: '#fff', borderRadius: '10px', fontSize: '14px', fontWeight: '600', border: 'none' } }),
        ]),
      ]),
    ], 'Glow CTA')],
  },
  {
    id: 'cta-newsletter-minimal', name: 'Newsletter — Minimal', category: 'CTA',
    description: 'Clean email signup with inline input and button',
    elements: [p('section', {}, { desktop: { padding: '100px 80px', backgroundColor: '#09090b', textAlign: 'center' }, mobile: { padding: '60px 20px' } }, [
      p('container', {}, { desktop: { maxWidth: '520px', margin: '0 auto' } }, [
        p('heading', { text: 'Stay in the loop', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '600', color: '#fff', letterSpacing: '-0.02em', marginBottom: '12px' } }),
        p('text', { text: 'Get product updates and insights delivered weekly.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' } }),
        p('container', {}, { desktop: { display: 'flex', gap: '8px' }, mobile: { flexDirection: 'column' } }, [
          p('input', { placeholder: 'Enter your email' }, { desktop: { flex: '1', padding: '14px 16px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px' } }),
          p('button', { text: 'Subscribe' }, { desktop: { padding: '14px 24px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', whiteSpace: 'nowrap' } }),
        ]),
      ]),
    ], 'Newsletter')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  PREMIUM STATS
// ════════════════════════════════════════════════════════════════════

const PREMIUM_STATS: SectionBlock[] = [
  {
    id: 'stats-large-numbers', name: 'Stats — Large Numbers', category: 'Stats',
    description: 'Impact stats with oversized numbers and subtle labels',
    elements: [p('section', {}, { desktop: { padding: '100px 80px', backgroundColor: '#000' }, mobile: { padding: '60px 20px' } }, [
      p('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', textAlign: 'center' }, mobile: { gridTemplateColumns: '1fr 1fr', gap: '32px' } }, [
        ...[
          { num: '10M+', label: 'Users worldwide' },
          { num: '99.9%', label: 'Uptime SLA' },
          { num: '150+', label: 'Countries served' },
          { num: '<50ms', label: 'Avg response time' },
        ].map(stat =>
          p('container', {}, { desktop: {} }, [
            p('heading', { text: stat.num, level: 'h3' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '4px' }, mobile: { fontSize: '32px' } }),
            p('text', { text: stat.label }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.02em' } }),
          ])
        ),
      ]),
    ], 'Stats Bar')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  PREMIUM FOOTERS
// ════════════════════════════════════════════════════════════════════

const PREMIUM_FOOTERS: SectionBlock[] = [
  {
    id: 'footer-saas-full', name: 'Footer — SaaS Full', category: 'Footers',
    description: 'Complete SaaS footer with 4 link columns and newsletter',
    elements: [p('footer', {}, { desktop: { padding: '80px 80px 40px', backgroundColor: '#09090b', borderTop: '1px solid rgba(255,255,255,0.04)' }, mobile: { padding: '40px 24px 24px' } }, [
      p('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto' } }, [
        p('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '48px', marginBottom: '64px' }, mobile: { gridTemplateColumns: '1fr 1fr', gap: '32px' } }, [
          // Brand column
          p('container', {}, { desktop: {} }, [
            p('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '18px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', marginBottom: '12px' } }),
            p('text', { text: 'Building the future of web development, one deploy at a time.' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.35)', lineHeight: '1.6', maxWidth: '280px' } }),
          ]),
          // Link columns
          ...['Product', 'Company', 'Resources', 'Legal'].map(col =>
            p('container', {}, { desktop: {} }, [
              p('text', { text: col }, { desktop: { fontSize: '12px', fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: '16px', letterSpacing: '0.05em' } }),
              ...(col === 'Product' ? ['Features', 'Pricing', 'Changelog', 'API'] :
                  col === 'Company' ? ['About', 'Blog', 'Careers', 'Press'] :
                  col === 'Resources' ? ['Docs', 'Guides', 'Support', 'Status'] :
                  ['Privacy', 'Terms', 'Security', 'GDPR']
              ).map(link =>
                p('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.3)', textDecoration: 'none', marginBottom: '10px' } })
              ),
            ])
          ),
        ]),
        // Bottom bar
        p('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)' }, mobile: { flexDirection: 'column', gap: '12px' } }, [
          p('text', { text: '© 2025 Brand. All rights reserved.' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.25)' } }),
          p('container', {}, { desktop: { display: 'flex', gap: '20px' } }, [
            p('text', { text: 'Twitter' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' } }),
            p('text', { text: 'GitHub' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' } }),
            p('text', { text: 'Discord' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' } }),
          ]),
        ]),
      ]),
    ], 'SaaS Footer')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  ANIMATED / INTERACTIVE PREMIUM SECTIONS
// ════════════════════════════════════════════════════════════════════

const ANIMATED_PREMIUM: SectionBlock[] = [
  {
    id: 'animated-gradient-hero', name: 'Animated — Gradient Mesh Hero', category: 'Animated',
    description: 'Hero with animated gradient background and floating elements',
    elements: [p('section', {}, { desktop: { minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', padding: '80px 24px' }, mobile: { minHeight: '80vh', padding: '60px 20px' } }, [
      // Floating orbs
      p('container', {}, { desktop: { position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', top: '10%', left: '10%', filter: 'blur(40px)', pointerEvents: 'none' } }),
      p('container', {}, { desktop: { position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)', bottom: '10%', right: '15%', filter: 'blur(40px)', pointerEvents: 'none' } }),
      p('container', {}, { desktop: { position: 'relative', zIndex: '1', maxWidth: '700px' } }, [
        p('heading', { text: 'Where ideas\nbecome reality', level: 'h1' }, { desktop: { fontSize: '68px', fontWeight: '700', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.04em', marginBottom: '24px', whiteSpace: 'pre-line' }, mobile: { fontSize: '38px' } }),
        p('text', { text: 'A creative platform that empowers teams to design, build, and launch exceptional digital experiences.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '40px' } }),
        p('button', { text: 'Explore Platform →' }, { desktop: { padding: '16px 36px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', color: '#fff', borderRadius: '10px', fontSize: '15px', fontWeight: '600', border: 'none' } }),
      ]),
    ], 'Gradient Mesh Hero')],
  },
  {
    id: 'animated-counter-stats', name: 'Animated — Counter Stats', category: 'Animated',
    description: 'Stats with animated counting numbers on scroll',
    elements: [p('section', {}, { desktop: { padding: '100px 80px', background: 'linear-gradient(180deg, #000 0%, #0a0a1a 100%)' }, mobile: { padding: '60px 20px' } }, [
      p('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', textAlign: 'center' } }, [
        p('heading', { text: 'Trusted by the best', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', letterSpacing: '-0.02em', marginBottom: '48px' }, mobile: { fontSize: '28px' } }),
        p('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }, mobile: { gridTemplateColumns: '1fr', gap: '32px' } }, [
          ...[
            { num: '2.5M+', label: 'Websites Built', color: '#8b5cf6' },
            { num: '50K+', label: 'Active Teams', color: '#3b82f6' },
            { num: '99.99%', label: 'Uptime Guaranteed', color: '#10b981' },
          ].map(stat =>
            p('animated-counter', { value: stat.num }, { desktop: { padding: '40px', borderRadius: '16px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' } }, [
              p('heading', { text: stat.num, level: 'h3' }, { desktop: { fontSize: '52px', fontWeight: '700', color: stat.color, letterSpacing: '-0.03em', marginBottom: '8px' }, mobile: { fontSize: '36px' } }),
              p('text', { text: stat.label }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)' } }),
            ])
          ),
        ]),
      ]),
    ], 'Counter Stats')],
  },
  {
    id: 'animated-glassmorphism-cards', name: 'Animated — Glass Cards', category: 'Animated',
    description: 'Glassmorphism feature cards with hover effects',
    elements: [p('section', {}, { desktop: { padding: '120px 80px', background: 'linear-gradient(135deg, #0c0c1d 0%, #1a1a2e 100%)', position: 'relative', overflow: 'hidden' }, mobile: { padding: '60px 20px' } }, [
      // Background elements
      p('container', {}, { desktop: { position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)', top: '-10%', right: '-5%', pointerEvents: 'none' } }),
      p('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: '1' } }, [
        p('heading', { text: 'Built for the modern web', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', letterSpacing: '-0.03em', marginBottom: '48px', textAlign: 'center' }, mobile: { fontSize: '30px' } }),
        p('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }, mobile: { gridTemplateColumns: '1fr', gap: '16px' } }, [
          ...[
            { icon: '⚡', title: 'Edge Computing', desc: 'Deploy serverless functions to 200+ global edge locations.' },
            { icon: '🔮', title: 'AI Powered', desc: 'Built-in AI features to supercharge your development workflow.' },
            { icon: '🎨', title: 'Design System', desc: 'A comprehensive component library with Tailwind integration.' },
          ].map(card =>
            p('glassmorphism-card', {}, { desktop: { padding: '36px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', transition: 'transform 0.3s ease, border-color 0.3s ease' } }, [
              p('text', { text: card.icon }, { desktop: { fontSize: '32px', marginBottom: '20px' } }),
              p('heading', { text: card.title, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '12px' } }),
              p('text', { text: card.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.6' } }),
            ])
          ),
        ]),
      ]),
    ], 'Glass Cards')],
  },
];

// ════════════════════════════════════════════════════════════════════
//  EXPORT ALL PREMIUM SECTIONS
// ════════════════════════════════════════════════════════════════════

export const PREMIUM_SECTION_BLOCKS: SectionBlock[] = [
  ...SAAS_HEROES,
  ...SAAS_FEATURES,
  ...AGENCY_HEROES,
  ...AGENCY_SECTIONS,
  ...ECOM_PREMIUM,
  ...CREATIVE_SECTIONS,
  ...PREMIUM_PRICING,
  ...PREMIUM_TESTIMONIALS,
  ...PREMIUM_CTA,
  ...PREMIUM_STATS,
  ...PREMIUM_FOOTERS,
  ...ANIMATED_PREMIUM,
];
