import { EditorElement } from '../types';
import { SectionBlock, SectionCategory } from './sectionBlocks';

let _sc4 = 0;
function sid(): string { _sc4++; return `sv4-${_sc4}-${Math.random().toString(36).slice(2, 7)}`; }
function s(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: sid(), type, name: name ?? type, props, styles, children };
}

export const PREMIUM_SECTION_BLOCKS_V4: SectionBlock[] = [
  // 1. BEFORE/AFTER SLIDER
  {
    id: 'v4-before-after', name: 'Before / After Slider', category: 'Interactive' as SectionCategory, description: 'Image comparison with drag handle',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%', textAlign: 'center' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'See the Difference', level: 'h2' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fff', marginBottom: '48px', letterSpacing: '-0.02em' } }),
      s('before-after', { beforeImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop', afterImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop&sat=-100' }, { desktop: { width: '100%', maxWidth: '900px', height: '500px', margin: '0 auto', borderRadius: '12px', overflow: 'hidden' } }),
    ])],
  },

  // 2. SCROLL COUNTER
  {
    id: 'v4-scroll-counter', name: 'Scroll Counter Stats', category: 'Stats' as SectionCategory, description: 'Animated number counters',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'Our Impact', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '64px' } }),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', maxWidth: '1000px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [
        ...[{ val: '2,500+', label: 'Projects Delivered' }, { val: '98%', label: 'Client Satisfaction' }, { val: '$50M+', label: 'Revenue Generated' }, { val: '15', label: 'Years Experience' }].map(item =>
          s('container', {}, { desktop: { textAlign: 'center' } }, [
            s('animated-counter', { endValue: item.val, label: item.label }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '8px' } }),
          ])
        ),
      ]),
    ])],
  },

  // 3. MARQUEE TICKER
  {
    id: 'v4-marquee', name: 'Logo Marquee Ticker', category: 'Logos' as SectionCategory, description: 'Smooth scrolling logo band',
    elements: [s('section', {}, { desktop: { padding: '40px 0', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', width: '100%', overflow: 'hidden' } }, [
      s('container', {}, { desktop: { display: 'flex', gap: '80px', alignItems: 'center', animation: 'marquee 20s linear infinite', whiteSpace: 'nowrap' } }, [
        ...['Google', 'Microsoft', 'Apple', 'Amazon', 'Netflix', 'Spotify', 'Stripe', 'Figma', 'Notion', 'Linear'].map(name =>
          s('text', { text: name }, { desktop: { fontSize: '18px', fontWeight: '700', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.06em', textTransform: 'uppercase' as any } })
        ),
      ]),
    ])],
  },

  // 4. SPLIT SCREEN CTA
  {
    id: 'v4-split-cta', name: 'Split Screen CTA', category: 'CTA' as SectionCategory, description: 'Two-column contrasting call to action',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '60vh', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { padding: '80px 60px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }, mobile: { padding: '60px 24px' } }, [
        s('heading', { text: 'For Individuals', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#000', marginBottom: '16px' } }),
        s('text', { text: 'Start for free. Upgrade when you need more power.' }, { desktop: { fontSize: '16px', color: '#666', marginBottom: '32px' } }),
        s('button', { text: 'Get Started Free', href: '#' }, { desktop: { padding: '14px 32px', backgroundColor: '#000', color: '#fff', border: 'none', borderRadius: '0', fontSize: '13px', fontWeight: '600', letterSpacing: '0.06em' } }),
      ]),
      s('container', {}, { desktop: { padding: '80px 60px', backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }, mobile: { padding: '60px 24px' } }, [
        s('heading', { text: 'For Teams', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', marginBottom: '16px' } }),
        s('text', { text: 'Collaborate at scale with advanced team features.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.6)', marginBottom: '32px' } }),
        s('button', { text: 'Contact Sales', href: '#' }, { desktop: { padding: '14px 32px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '0', fontSize: '13px', fontWeight: '600', letterSpacing: '0.06em' } }),
      ]),
    ])],
  },

  // 5. VIDEO HERO
  {
    id: 'v4-video-hero', name: 'Video Background Hero', category: 'Heroes' as SectionCategory, description: 'Full-bleed background video hero',
    elements: [s('section', {}, { desktop: { position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000', width: '100%' } }, [
      s('video-background', { videoUrl: '', overlay: 'rgba(0,0,0,0.6)' }, { desktop: { position: 'absolute', inset: '0', width: '100%', height: '100%' } }),
      s('container', {}, { desktop: { position: 'relative', zIndex: '2', textAlign: 'center', maxWidth: '800px', padding: '0 40px' }, mobile: { padding: '0 24px' } }, [
        s('heading', { text: 'Cinematic\nExperience', level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '700', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.04em', marginBottom: '24px' }, mobile: { fontSize: '40px' } }),
        s('text', { text: 'Immerse yourself in a visual journey that captivates and inspires.' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.7)', marginBottom: '40px' } }),
        s('button', { text: 'Watch Film', href: '#' }, { desktop: { padding: '16px 40px', backgroundColor: 'transparent', color: '#fff', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '0', fontSize: '13px', fontWeight: '600', letterSpacing: '0.08em' } }),
      ]),
    ])],
  },

  // 6. ACCORDION FAQ
  {
    id: 'v4-faq-accordion', name: 'FAQ Accordion', category: 'FAQ' as SectionCategory, description: 'Expandable Q&A with smooth styling',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'Frequently Asked Questions', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '60px' } }),
      s('container', {}, { desktop: { maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' } }, [
        ...[
          { q: 'How does your pricing work?', a: 'We offer transparent pricing with no hidden fees. Choose monthly or annual billing.' },
          { q: 'Can I cancel anytime?', a: 'Yes! Cancel anytime with no penalties. We believe our product should speak for itself.' },
          { q: 'Do you offer a free trial?', a: 'Absolutely. Start with a 14-day free trial — no credit card required.' },
          { q: 'What support do you provide?', a: 'Premium support via email, chat, and video calls. Average response time under 2 hours.' },
        ].map(item =>
          s('container', {}, { desktop: { padding: '20px 24px', backgroundColor: '#111', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' } }, [
            s('heading', { text: item.q, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
            s('text', { text: item.a }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' } }),
          ])
        ),
      ]),
    ])],
  },

  // 7. TIMELINE
  {
    id: 'v4-timeline', name: 'Vertical Timeline', category: 'Content' as SectionCategory, description: 'Timeline with alternating cards',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'Our Journey', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '64px' } }),
      s('container', {}, { desktop: { maxWidth: '700px', margin: '0 auto', position: 'relative', paddingLeft: '40px', width: '100%' } }, [
        s('divider', {}, { desktop: { position: 'absolute', left: '12px', top: '0', bottom: '0', width: '2px', height: '100%', backgroundColor: 'rgba(255,255,255,0.1)' } }),
        ...[
          { year: '2020', title: 'Founded', desc: 'Started with a vision to change the industry.' },
          { year: '2021', title: 'First 100 Clients', desc: 'Rapid growth through word-of-mouth and quality.' },
          { year: '2023', title: 'Series A', desc: 'Raised $15M to accelerate product development.' },
          { year: '2026', title: 'Global Expansion', desc: 'Now serving clients in 30+ countries worldwide.' },
        ].map(item =>
          s('container', {}, { desktop: { position: 'relative', paddingBottom: '40px', paddingLeft: '24px' } }, [
            s('container', {}, { desktop: { position: 'absolute', left: '-34px', top: '4px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: '#0073E6', border: '3px solid #000' } }),
            s('text', { text: item.year }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#0073E6', marginBottom: '4px', letterSpacing: '0.06em' } }),
            s('heading', { text: item.title, level: 'h4' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '4px' } }),
            s('text', { text: item.desc }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' } }),
          ])
        ),
      ]),
    ])],
  },

  // 8. PROCESS STEPS
  {
    id: 'v4-process-steps', name: 'Process Steps', category: 'Features' as SectionCategory, description: 'Numbered horizontal process flow',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'How It Works', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '64px' } }),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', maxWidth: '1100px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [
        ...[
          { num: '01', title: 'Discovery', desc: 'We learn about your goals, brand, and audience.' },
          { num: '02', title: 'Strategy', desc: 'Create a tailored roadmap for success.' },
          { num: '03', title: 'Execute', desc: 'Our team brings the strategy to life.' },
          { num: '04', title: 'Optimise', desc: 'Continuous improvement based on data.' },
        ].map(step =>
          s('container', {}, { desktop: { textAlign: 'center' } }, [
            s('text', { text: step.num }, { desktop: { fontSize: '48px', fontWeight: '800', color: 'rgba(0,115,230,0.2)', marginBottom: '16px', fontFamily: "'JetBrains Mono', monospace" } }),
            s('heading', { text: step.title, level: 'h4' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
            s('text', { text: step.desc }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6' } }),
          ])
        ),
      ]),
    ])],
  },

  // 9. BLOG GRID
  {
    id: 'v4-blog-grid', name: 'Blog Post Grid', category: 'Blog' as SectionCategory, description: '3-column blog cards with categories',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'Latest Articles', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '48px' } }),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...[
          { img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop', cat: 'Strategy', title: 'The Future of Digital Marketing', date: 'Mar 15, 2026' },
          { img: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop', cat: 'Culture', title: 'Building Remote Teams That Thrive', date: 'Mar 10, 2026' },
          { img: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=600&h=400&fit=crop', cat: 'Technology', title: 'AI Tools Every Business Needs', date: 'Mar 5, 2026' },
        ].map(post =>
          s('container', {}, { desktop: { backgroundColor: '#111', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' } }, [
            s('image', { src: post.img, alt: post.title }, { desktop: { width: '100%', height: '200px', objectFit: 'cover', display: 'block' } }),
            s('container', {}, { desktop: { padding: '24px' } }, [
              s('text', { text: post.cat }, { desktop: { fontSize: '11px', fontWeight: '700', color: '#0073E6', textTransform: 'uppercase' as any, letterSpacing: '0.06em', marginBottom: '8px' } }),
              s('heading', { text: post.title, level: 'h4' }, { desktop: { fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '8px', lineHeight: '1.3' } }),
              s('text', { text: post.date }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.4)' } }),
            ]),
          ])
        ),
      ]),
    ])],
  },

  // 10. APP DOWNLOAD
  {
    id: 'v4-app-download', name: 'App Download CTA', category: 'CTA' as SectionCategory, description: 'Phone mockup with store badges',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '70vh', backgroundColor: '#000', width: '100%', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { padding: '80px 60px' }, mobile: { padding: '60px 24px' } }, [
        s('text', { text: 'DOWNLOAD THE APP' }, { desktop: { fontSize: '12px', fontWeight: '700', color: '#0073E6', letterSpacing: '0.1em', marginBottom: '16px' } }),
        s('heading', { text: 'Everything\nIn Your Pocket', level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '700', color: '#fff', lineHeight: '1.1', marginBottom: '20px', letterSpacing: '-0.02em' }, mobile: { fontSize: '32px' } }),
        s('text', { text: 'Manage your projects, communicate with your team, and track progress — all from your phone.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.7', marginBottom: '36px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '12px' } }, [
          s('button', { text: '▶ App Store', href: '#' }, { desktop: { padding: '12px 24px', backgroundColor: '#fff', color: '#000', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none' } }),
          s('button', { text: '▶ Google Play', href: '#' }, { desktop: { padding: '12px 24px', backgroundColor: 'transparent', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: '1px solid rgba(255,255,255,0.2)' } }),
        ]),
      ]),
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', padding: '60px' } }, [
        s('container', {}, { desktop: { width: '280px', height: '560px', borderRadius: '40px', background: 'linear-gradient(180deg, #111 0%, #1a1a1a 100%)', border: '3px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
          s('text', { text: '📱' }, { desktop: { fontSize: '64px' } }),
        ]),
      ]),
    ])],
  },

  // 11. NEWSLETTER
  {
    id: 'v4-newsletter', name: 'Newsletter Signup', category: 'CTA' as SectionCategory, description: 'Centered newsletter signup section',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%', textAlign: 'center' }, mobile: { padding: '60px 24px' } }, [
      s('container', {}, { desktop: { maxWidth: '600px', margin: '0 auto', width: '100%' } }, [
        s('text', { text: '📬' }, { desktop: { fontSize: '40px', marginBottom: '16px' } }),
        s('heading', { text: 'Stay in the Loop', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', marginBottom: '12px' } }),
        s('text', { text: 'Get the latest insights, tips, and updates delivered to your inbox weekly.' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginBottom: '32px' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '8px', maxWidth: '440px', margin: '0 auto' }, mobile: { flexDirection: 'column' } }, [
          s('input', { placeholder: 'Enter your email', inputType: 'email' }, { desktop: { flex: '1', padding: '14px 16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', color: '#fff', fontSize: '14px' } }),
          s('button', { text: 'Subscribe', href: '#' }, { desktop: { padding: '14px 28px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none' } }),
        ]),
      ]),
    ])],
  },

  // 12. PRICING TOGGLE
  {
    id: 'v4-pricing-toggle', name: 'Pricing with Toggle', category: 'Pricing' as SectionCategory, description: 'Monthly/yearly pricing cards',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'Simple, Transparent Pricing', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '48px' } }),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', maxWidth: '1100px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...[
          { plan: 'Starter', price: '$19', features: ['5 Projects', '10GB Storage', 'Email Support'] },
          { plan: 'Professional', price: '$49', features: ['Unlimited Projects', '100GB Storage', 'Priority Support', 'Analytics', 'Custom Domain'], popular: true },
          { plan: 'Enterprise', price: '$99', features: ['Everything in Pro', 'Dedicated Manager', 'SLA Guarantee', 'API Access', 'SSO'] },
        ].map(tier =>
          s('container', {}, { desktop: { padding: '40px 32px', backgroundColor: tier.popular ? '#0a0a0a' : '#111', borderRadius: '16px', border: tier.popular ? '2px solid #0073E6' : '1px solid rgba(255,255,255,0.06)', textAlign: 'center', position: 'relative' } }, [
            ...(tier.popular ? [s('text', { text: 'MOST POPULAR' }, { desktop: { fontSize: '10px', fontWeight: '700', color: '#0073E6', letterSpacing: '0.1em', marginBottom: '16px' } })] : []),
            s('heading', { text: tier.plan, level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '600', color: '#fff', marginBottom: '8px' } }),
            s('heading', { text: tier.price, level: 'h2' }, { desktop: { fontSize: '48px', fontWeight: '800', color: '#fff', marginBottom: '4px' } }),
            s('text', { text: 'per month' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '24px' } }),
            ...tier.features.map(f => s('text', { text: `✓ ${f}` }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.6)', marginBottom: '8px' } })),
            s('button', { text: 'Get Started', href: '#' }, { desktop: { marginTop: '24px', padding: '14px 32px', backgroundColor: tier.popular ? '#0073E6' : 'transparent', color: '#fff', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: tier.popular ? 'none' : '1px solid rgba(255,255,255,0.2)', width: '100%' } }),
          ])
        ),
      ]),
    ])],
  },

  // 13. TEAM GRID
  {
    id: 'v4-team-grid', name: 'Team Grid Cards', category: 'Team' as SectionCategory, description: 'Team members with hover effects',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'Meet the Team', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '48px' } }),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', maxWidth: '1200px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [
        ...[
          { name: 'Alex Chen', role: 'CEO & Founder', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' },
          { name: 'Sarah Park', role: 'CTO', img: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop' },
          { name: 'Marcus Cole', role: 'Head of Design', img: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop' },
          { name: 'Lisa Wong', role: 'VP Marketing', img: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop' },
        ].map(person =>
          s('container', {}, { desktop: { textAlign: 'center' } }, [
            s('image', { src: person.img, alt: person.name }, { desktop: { width: '100%', height: '280px', objectFit: 'cover', borderRadius: '12px', display: 'block', marginBottom: '16px' } }),
            s('heading', { text: person.name, level: 'h4' }, { desktop: { fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '4px' } }),
            s('text', { text: person.role }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.4)' } }),
          ])
        ),
      ]),
    ])],
  },

  // 14. FEATURE COMPARISON
  {
    id: 'v4-feature-comparison', name: 'Feature Comparison Table', category: 'Comparison' as SectionCategory, description: 'Detailed feature comparison grid',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'Compare Plans', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '48px' } }),
      s('comparison-table', { headers: ['Feature', 'Free', 'Pro', 'Enterprise'], rows: [['Storage', '1GB', '100GB', 'Unlimited'], ['Users', '1', '10', 'Unlimited'], ['API Access', '—', '✓', '✓'], ['Analytics', '—', '✓', '✓'], ['Priority Support', '—', '—', '✓'], ['Custom Domain', '—', '✓', '✓'], ['SSO', '—', '—', '✓']] }, { desktop: { width: '100%', maxWidth: '900px', margin: '0 auto' } }),
    ])],
  },

  // 15. SOCIAL PROOF BAR
  {
    id: 'v4-social-proof', name: 'Social Proof Bar', category: 'Testimonials' as SectionCategory, description: 'Compact reviews/ratings strip',
    elements: [s('section', {}, { desktop: { padding: '40px 60px', backgroundColor: '#000', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', width: '100%' }, mobile: { padding: '24px' } }, [
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '48px', flexWrap: 'wrap' }, mobile: { gap: '24px' } }, [
        s('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          s('text', { text: '★★★★★' }, { desktop: { fontSize: '16px', color: '#fbbf24' } }),
          s('text', { text: '4.9/5 on Trustpilot' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' } }),
        ]),
        s('text', { text: '|' }, { desktop: { color: 'rgba(255,255,255,0.1)', fontSize: '20px' } }),
        s('text', { text: '10,000+ happy customers' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' } }),
        s('text', { text: '|' }, { desktop: { color: 'rgba(255,255,255,0.1)', fontSize: '20px' } }),
        s('text', { text: 'Used by Fortune 500 companies' }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: '500' } }),
      ]),
    ])],
  },

  // 16. MEGA FOOTER
  {
    id: 'v4-mega-footer', name: 'Mega Footer', category: 'Footers' as SectionCategory, description: '5-column footer with newsletter and social',
    elements: [s('footer', {}, { desktop: { padding: '80px 60px 40px', backgroundColor: '#000', width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)' }, mobile: { padding: '60px 24px 32px' } }, [
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '40px', marginBottom: '60px' }, mobile: { gridTemplateColumns: '1fr 1fr' } }, [
        s('container', {}, { desktop: {} }, [
          s('heading', { text: 'BRAND', level: 'h3' }, { desktop: { fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '0.1em', marginBottom: '16px' } }),
          s('text', { text: 'Building the future of digital experiences with premium tools and design.' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.4)', lineHeight: '1.7', marginBottom: '24px', maxWidth: '300px' } }),
          s('container', {}, { desktop: { display: 'flex', gap: '8px' } }, [
            s('input', { placeholder: 'Your email', inputType: 'email' }, { desktop: { padding: '10px 12px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', color: '#fff', fontSize: '12px', width: '180px' } }),
            s('button', { text: '→', href: '#' }, { desktop: { padding: '10px 16px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '0', fontSize: '14px', fontWeight: '700' } }),
          ]),
        ]),
        ...['Product', 'Company', 'Resources', 'Legal'].map(title =>
          s('container', {}, { desktop: {} }, [
            s('text', { text: title }, { desktop: { fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' as any, letterSpacing: '0.08em', marginBottom: '16px' } }),
            ...(title === 'Product' ? ['Features', 'Pricing', 'Changelog', 'Integrations'] :
               title === 'Company' ? ['About', 'Careers', 'Blog', 'Press'] :
               title === 'Resources' ? ['Documentation', 'Help Center', 'Community', 'API'] :
               ['Privacy', 'Terms', 'Cookies', 'Licenses']).map(link =>
              s('link', { text: link, href: '#' }, { desktop: { display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', marginBottom: '10px' } })
            ),
          ])
        ),
      ]),
      s('divider', {}, { desktop: { height: '1px', width: '100%', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '24px' } }),
      s('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, mobile: { flexDirection: 'column', gap: '12px', textAlign: 'center' } }, [
        s('text', { text: '© 2026 Brand. All rights reserved.' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.3)' } }),
        s('container', {}, { desktop: { display: 'flex', gap: '16px' } }, [
          ...['Twitter', 'LinkedIn', 'GitHub', 'YouTube'].map(social =>
            s('link', { text: social, href: '#' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none' } })
          ),
        ]),
      ]),
    ])],
  },

  // 17. IMAGE MOSAIC
  {
    id: 'v4-image-mosaic', name: 'Image Mosaic Gallery', category: 'Gallery' as SectionCategory, description: 'Asymmetric image grid layout',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'Gallery', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '48px' } }),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 250px)', gap: '12px', maxWidth: '1200px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(3, 200px)' } }, [
        s('image', { src: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', alt: '1' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', gridColumn: 'span 2', gridRow: 'span 2' } }),
        s('image', { src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop', alt: '2' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' } }),
        s('image', { src: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=300&fit=crop', alt: '3' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' } }),
        s('image', { src: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop', alt: '4' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' } }),
        s('image', { src: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop', alt: '5' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' } }),
      ]),
    ])],
  },

  // 18. MAP + CONTACT
  {
    id: 'v4-map-contact', name: 'Map + Contact Form', category: 'Contact' as SectionCategory, description: 'Split map and form layout',
    elements: [s('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '70vh', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } }, [
      s('container', {}, { desktop: { backgroundColor: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' } }, [
        s('container', {}, { desktop: { width: '100%', height: '100%', minHeight: '400px', borderRadius: '8px', backgroundColor: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
          s('text', { text: '🗺️ Map Embed' }, { desktop: { fontSize: '20px', color: 'rgba(255,255,255,0.3)' } }),
        ]),
      ]),
      s('container', {}, { desktop: { padding: '80px 60px', backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', justifyContent: 'center' }, mobile: { padding: '60px 24px' } }, [
        s('heading', { text: 'Get in Touch', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', marginBottom: '32px' } }),
        s('form', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '16px' } }, [
          s('input', { placeholder: 'Name', inputType: 'text' }, { desktop: { padding: '14px 16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', color: '#fff', fontSize: '14px', width: '100%' } }),
          s('input', { placeholder: 'Email', inputType: 'email' }, { desktop: { padding: '14px 16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', color: '#fff', fontSize: '14px', width: '100%' } }),
          s('textarea', { placeholder: 'Message' }, { desktop: { padding: '14px 16px', backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0', color: '#fff', fontSize: '14px', width: '100%', minHeight: '120px' } }),
          s('button', { text: 'Send Message', href: '#' }, { desktop: { padding: '16px', backgroundColor: '#fff', color: '#000', borderRadius: '0', fontSize: '13px', fontWeight: '600', border: 'none', letterSpacing: '0.06em' } }),
        ]),
      ]),
    ])],
  },

  // 19. TABBED CONTENT
  {
    id: 'v4-tabbed-content', name: 'Tabbed Content', category: 'Content' as SectionCategory, description: 'Tab switcher with content panels',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#0a0a0a', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'Explore Our Platform', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '48px' } }),
      s('container', {}, { desktop: { maxWidth: '900px', margin: '0 auto', width: '100%' } }, [
        s('container', {}, { desktop: { display: 'flex', gap: '0', borderBottom: '2px solid rgba(255,255,255,0.06)', marginBottom: '32px' } }, [
          ...['Design', 'Develop', 'Deploy'].map((tab, i) =>
            s('text', { text: tab }, { desktop: { padding: '12px 24px', fontSize: '14px', fontWeight: '600', color: i === 0 ? '#0073E6' : 'rgba(255,255,255,0.4)', borderBottom: i === 0 ? '2px solid #0073E6' : 'none', cursor: 'pointer' } })
          ),
        ]),
        s('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'center' }, mobile: { gridTemplateColumns: '1fr' } }, [
          s('container', {}, { desktop: {} }, [
            s('heading', { text: 'Visual Design Tools', level: 'h3' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '16px' } }),
            s('text', { text: 'Create stunning interfaces with our intuitive drag-and-drop editor. No coding required — just pure visual creativity.' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.7', marginBottom: '24px' } }),
            s('button', { text: 'Learn More →', href: '#' }, { desktop: { padding: '0', backgroundColor: 'transparent', color: '#0073E6', border: 'none', fontSize: '14px', fontWeight: '600' } }),
          ]),
          s('container', {}, { desktop: { height: '300px', backgroundColor: '#111', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' } }, [
            s('text', { text: '🎨' }, { desktop: { fontSize: '48px' } }),
          ]),
        ]),
      ]),
    ])],
  },

  // 20. TESTIMONIAL MASONRY
  {
    id: 'v4-testimonial-masonry', name: 'Masonry Testimonials', category: 'Testimonials' as SectionCategory, description: 'Varied-height testimonial cards',
    elements: [s('section', {}, { desktop: { padding: '100px 60px', backgroundColor: '#000', width: '100%' }, mobile: { padding: '60px 24px' } }, [
      s('heading', { text: 'Loved by Thousands', level: 'h2' }, { desktop: { fontSize: '42px', fontWeight: '700', color: '#fff', textAlign: 'center', marginBottom: '48px' } }),
      s('grid', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '1100px', margin: '0 auto', width: '100%' }, mobile: { gridTemplateColumns: '1fr' } }, [
        ...[
          { quote: 'Absolutely incredible product. It transformed how our entire team works together. The design tools are world-class.', name: 'Sarah Chen', role: 'Head of Design, Acme' },
          { quote: 'Best investment we made this year.', name: 'Mike Johnson', role: 'CEO, StartupCo' },
          { quote: 'We switched from three separate tools. This does everything and does it beautifully. Our workflow has never been smoother.', name: 'Emma Williams', role: 'PM, TechCorp' },
          { quote: 'Stunning design. Intuitive UX. Fast support.', name: 'David Lee', role: 'Founder, Design Lab' },
          { quote: 'The attention to detail is remarkable. Every feature feels thoughtfully designed and polished to perfection.', name: 'Lisa Park', role: 'CTO, CloudBase' },
          { quote: 'Game changer for our agency.', name: 'Tom Wright', role: 'Agency Owner' },
        ].map(t =>
          s('container', {}, { desktop: { padding: '28px', backgroundColor: '#111', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' } }, [
            s('text', { text: '★★★★★' }, { desktop: { fontSize: '12px', color: '#fbbf24', marginBottom: '12px' } }),
            s('text', { text: `"${t.quote}"` }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.7', marginBottom: '16px', fontStyle: 'italic' } }),
            s('text', { text: t.name }, { desktop: { fontSize: '13px', fontWeight: '600', color: '#fff' } }),
            s('text', { text: t.role }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.4)' } }),
          ])
        ),
      ]),
    ])],
  },
];
