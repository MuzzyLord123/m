import { EditorElement } from '../types';

let _pp = 0;
function pid(): string { return `pp-${++_pp}-${Math.random().toString(36).slice(2, 7)}`; }
function el(type: EditorElement['type'], props: Record<string, unknown>, styles: EditorElement['styles'], children: EditorElement[] = [], name?: string): EditorElement {
  return { id: pid(), type, name: name ?? type, props, styles, children };
}

export interface ProductPageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  elements: EditorElement[];
}

// ═══════════════════════════════════════════════════════════════
// 1. LUXURY PRODUCT HERO — Split image + details
// ═══════════════════════════════════════════════════════════════
const luxuryHero = (): EditorElement[] => [
  el('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '85vh', backgroundColor: '#0a0a0a' } }, [
    el('container', {}, { desktop: { position: 'relative', overflow: 'hidden' } }, [
      el('image', { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&h=1100&fit=crop', alt: 'Product' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
    ]),
    el('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px', gap: '24px' } }, [
      el('text', { text: 'NEW ARRIVAL' }, { desktop: { fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', fontWeight: '600' } }),
      el('heading', { text: '$PRODUCT_NAME', level: 'h1' }, { desktop: { fontSize: '48px', fontWeight: '300', color: '#fff', lineHeight: '1.15', letterSpacing: '-0.02em' } }),
      el('text', { text: '$PRODUCT_DESC' }, { desktop: { fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', maxWidth: '420px' } }),
      el('container', {}, { desktop: { display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '8px' } }, [
        el('text', { text: '$PRODUCT_PRICE' }, { desktop: { fontSize: '32px', fontWeight: '600', color: '#fff' } }),
        el('text', { text: '$COMPARE_PRICE' }, { desktop: { fontSize: '18px', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through' } }),
      ]),
      el('container', {}, { desktop: { display: 'flex', gap: '12px', marginTop: '24px' } }, [
        el('button', { text: 'Add to Cart', href: '#' }, { desktop: { padding: '16px 48px', backgroundColor: '#fff', color: '#000', border: 'none', fontSize: '13px', fontWeight: '600', letterSpacing: '0.05em', cursor: 'pointer' } }),
        el('button', { text: 'Buy Now', href: '#' }, { desktop: { padding: '16px 48px', backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', fontSize: '13px', fontWeight: '600', letterSpacing: '0.05em', cursor: 'pointer' } }),
      ]),
      el('container', {}, { desktop: { display: 'flex', gap: '32px', marginTop: '40px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.08)' } }, [
        el('container', {}, { desktop: {} }, [
          el('text', { text: '🚚' }, { desktop: { fontSize: '18px' } }),
          el('text', { text: 'Free Shipping' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' } }),
        ]),
        el('container', {}, { desktop: {} }, [
          el('text', { text: '↩️' }, { desktop: { fontSize: '18px' } }),
          el('text', { text: '30-Day Returns' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' } }),
        ]),
        el('container', {}, { desktop: {} }, [
          el('text', { text: '🔒' }, { desktop: { fontSize: '18px' } }),
          el('text', { text: 'Secure Checkout' }, { desktop: { fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' } }),
        ]),
      ]),
    ]),
  ], 'Luxury Product Hero'),
];

// ═══════════════════════════════════════════════════════════════
// 2. MINIMAL PRODUCT CARD — Clean centered layout
// ═══════════════════════════════════════════════════════════════
const minimalCard = (): EditorElement[] => [
  el('section', {}, { desktop: { padding: '100px 40px', backgroundColor: '#fafafa', display: 'flex', justifyContent: 'center' } }, [
    el('container', {}, { desktop: { maxWidth: '500px', textAlign: 'center' } }, [
      el('container', {}, { desktop: { width: '100%', aspectRatio: '1/1', borderRadius: '20px', overflow: 'hidden', backgroundColor: '#f0f0f0', marginBottom: '32px' } }, [
        el('image', { src: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop', alt: 'Product' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ]),
      el('text', { text: 'FEATURED' }, { desktop: { fontSize: '10px', letterSpacing: '0.2em', color: '#999', fontWeight: '600', marginBottom: '8px' } }),
      el('heading', { text: '$PRODUCT_NAME', level: 'h2' }, { desktop: { fontSize: '28px', fontWeight: '600', color: '#111', marginBottom: '12px' } }),
      el('text', { text: '$PRODUCT_DESC' }, { desktop: { fontSize: '14px', color: '#666', lineHeight: '1.6', marginBottom: '20px' } }),
      el('text', { text: '$PRODUCT_PRICE' }, { desktop: { fontSize: '24px', fontWeight: '700', color: '#111', marginBottom: '24px' } }),
      el('button', { text: 'Add to Cart', href: '#' }, { desktop: { padding: '14px 56px', backgroundColor: '#111', color: '#fff', border: 'none', borderRadius: '50px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' } }),
    ]),
  ], 'Minimal Product Card'),
];

// ═══════════════════════════════════════════════════════════════
// 3. FASHION EDITORIAL — Full-bleed dramatic
// ═══════════════════════════════════════════════════════════════
const fashionEditorial = (): EditorElement[] => [
  el('section', {}, { desktop: { position: 'relative', minHeight: '100vh', overflow: 'hidden', backgroundColor: '#000' } }, [
    el('image', { src: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&h=1000&fit=crop', alt: 'Product' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: '0', opacity: '0.6' } }),
    el('container', {}, { desktop: { position: 'relative', zIndex: '2', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', minHeight: '100vh', padding: '80px 60px' } }, [
      el('text', { text: 'SS26 COLLECTION' }, { desktop: { fontSize: '11px', letterSpacing: '0.3em', color: 'rgba(255,255,255,0.6)', fontWeight: '500' } }),
      el('heading', { text: '$PRODUCT_NAME', level: 'h1' }, { desktop: { fontSize: '72px', fontWeight: '200', color: '#fff', lineHeight: '1.05', letterSpacing: '-0.03em', marginTop: '12px' } }),
      el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '24px', marginTop: '32px' } }, [
        el('text', { text: '$PRODUCT_PRICE' }, { desktop: { fontSize: '28px', fontWeight: '300', color: '#fff' } }),
        el('button', { text: 'Shop Now →', href: '#' }, { desktop: { padding: '14px 40px', backgroundColor: '#fff', color: '#000', border: 'none', fontSize: '12px', fontWeight: '600', letterSpacing: '0.1em', cursor: 'pointer' } }),
      ]),
    ]),
  ], 'Fashion Editorial'),
];

// ═══════════════════════════════════════════════════════════════
// 4. TECH PRODUCT — Gradient + specs grid
// ═══════════════════════════════════════════════════════════════
const techProduct = (): EditorElement[] => [
  el('section', {}, { desktop: { padding: '100px 60px', background: 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)' } }, [
    el('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', textAlign: 'center' } }, [
      el('text', { text: 'INTRODUCING' }, { desktop: { fontSize: '11px', letterSpacing: '0.3em', color: '#6366f1', fontWeight: '600' } }),
      el('heading', { text: '$PRODUCT_NAME', level: 'h1' }, { desktop: { fontSize: '56px', fontWeight: '700', color: '#fff', marginTop: '16px', letterSpacing: '-0.03em' } }),
      el('text', { text: '$PRODUCT_DESC' }, { desktop: { fontSize: '16px', color: 'rgba(255,255,255,0.5)', marginTop: '16px', maxWidth: '560px', margin: '16px auto 0' } }),
      el('container', {}, { desktop: { width: '80%', maxWidth: '700px', margin: '48px auto', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 0 80px rgba(99,102,241,0.15)' } }, [
        el('image', { src: 'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=1000&h=600&fit=crop', alt: 'Product' }, { desktop: { width: '100%', height: 'auto' } }),
      ]),
      el('text', { text: '$PRODUCT_PRICE' }, { desktop: { fontSize: '36px', fontWeight: '600', color: '#fff', marginBottom: '24px' } }),
      el('container', {}, { desktop: { display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '60px' } }, [
        el('button', { text: 'Buy Now', href: '#' }, { desktop: { padding: '16px 48px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' } }),
        el('button', { text: 'Learn More', href: '#' }, { desktop: { padding: '16px 48px', backgroundColor: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' } }),
      ]),
      el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '16px', overflow: 'hidden' } }, [
        ...[{ label: 'Battery', value: '72 Hours' }, { label: 'Display', value: '6.7" OLED' }, { label: 'Storage', value: '256 GB' }, { label: 'Camera', value: '108 MP' }].map(spec =>
          el('container', {}, { desktop: { padding: '32px 20px', backgroundColor: '#1a1a2e', textAlign: 'center' } }, [
            el('text', { text: spec.value }, { desktop: { fontSize: '22px', fontWeight: '700', color: '#fff' } }),
            el('text', { text: spec.label }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' } }),
          ])
        ),
      ]),
    ]),
  ], 'Tech Product Showcase'),
];

// ═══════════════════════════════════════════════════════════════
// 5. PRODUCT GALLERY — Multi-image grid
// ═══════════════════════════════════════════════════════════════
const productGallery = (): EditorElement[] => [
  el('section', {}, { desktop: { padding: '80px 40px', backgroundColor: '#111' } }, [
    el('container', {}, { desktop: { maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', alignItems: 'start' } }, [
      el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' } }, [
        ...[
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=600&h=600&fit=crop',
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&h=600&fit=crop',
        ].map((url, i) =>
          el('container', {}, { desktop: { borderRadius: '12px', overflow: 'hidden', aspectRatio: '1/1', cursor: 'pointer', ...(i === 0 ? { gridColumn: 'span 2', aspectRatio: '2/1' } : {}) } }, [
            el('image', { src: url, alt: `View ${i + 1}` }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
          ])
        ),
      ]),
      el('container', {}, { desktop: { position: 'sticky', top: '100px', padding: '0 20px' } }, [
        el('text', { text: 'BESTSELLER' }, { desktop: { fontSize: '10px', letterSpacing: '0.2em', color: '#f59e0b', fontWeight: '600', marginBottom: '12px' } }),
        el('heading', { text: '$PRODUCT_NAME', level: 'h1' }, { desktop: { fontSize: '36px', fontWeight: '600', color: '#fff', marginBottom: '12px' } }),
        el('container', {}, { desktop: { display: 'flex', gap: '4px', marginBottom: '16px' } }, [
          ...[1, 2, 3, 4, 5].map(() => el('text', { text: '★' }, { desktop: { fontSize: '14px', color: '#f59e0b' } })),
          el('text', { text: '(128 reviews)' }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '8px' } }),
        ]),
        el('text', { text: '$PRODUCT_DESC' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7', marginBottom: '24px' } }),
        el('text', { text: '$PRODUCT_PRICE' }, { desktop: { fontSize: '28px', fontWeight: '700', color: '#fff', marginBottom: '24px' } }),
        el('button', { text: 'Add to Cart', href: '#' }, { desktop: { width: '100%', padding: '16px', backgroundColor: '#fff', color: '#000', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginBottom: '12px' } }),
        el('button', { text: 'Buy Now — Express Checkout', href: '#' }, { desktop: { width: '100%', padding: '16px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' } }),
      ]),
    ]),
  ], 'Product Gallery'),
];

// ═══════════════════════════════════════════════════════════════
// 6. FOOD/BEVERAGE PRODUCT — Warm aesthetic
// ═══════════════════════════════════════════════════════════════
const foodProduct = (): EditorElement[] => [
  el('section', {}, { desktop: { display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '80vh', backgroundColor: '#1a1410' } }, [
    el('container', {}, { desktop: { display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 60px' } }, [
      el('text', { text: 'ARTISAN CRAFTED' }, { desktop: { fontSize: '10px', letterSpacing: '0.3em', color: '#d97706', fontWeight: '600' } }),
      el('heading', { text: '$PRODUCT_NAME', level: 'h1' }, { desktop: { fontSize: '44px', fontWeight: '700', color: '#fef3c7', lineHeight: '1.2', marginTop: '12px' } }),
      el('text', { text: '$PRODUCT_DESC' }, { desktop: { fontSize: '15px', color: 'rgba(254,243,199,0.5)', lineHeight: '1.7', marginTop: '20px', maxWidth: '400px' } }),
      el('container', {}, { desktop: { display: 'flex', gap: '24px', marginTop: '32px' } }, [
        ...[{ label: 'Origin', value: 'Colombia' }, { label: 'Roast', value: 'Medium' }, { label: 'Notes', value: 'Chocolate, Citrus' }].map(item =>
          el('container', {}, { desktop: {} }, [
            el('text', { text: item.value }, { desktop: { fontSize: '14px', fontWeight: '600', color: '#fef3c7' } }),
            el('text', { text: item.label }, { desktop: { fontSize: '10px', color: 'rgba(254,243,199,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' } }),
          ])
        ),
      ]),
      el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '16px', marginTop: '40px' } }, [
        el('text', { text: '$PRODUCT_PRICE' }, { desktop: { fontSize: '28px', fontWeight: '600', color: '#fef3c7' } }),
        el('button', { text: 'Order Now', href: '#' }, { desktop: { padding: '14px 40px', backgroundColor: '#d97706', color: '#1a1410', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' } }),
      ]),
    ]),
    el('container', {}, { desktop: { position: 'relative', overflow: 'hidden' } }, [
      el('image', { src: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=900&h=1000&fit=crop', alt: 'Product' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
    ]),
  ], 'Food Product'),
];

// ═══════════════════════════════════════════════════════════════
// 7. BEAUTY/COSMETICS — Soft gradient
// ═══════════════════════════════════════════════════════════════
const beautyProduct = (): EditorElement[] => [
  el('section', {}, { desktop: { padding: '100px 40px', background: 'linear-gradient(180deg, #1a0f1e 0%, #0f0a12 100%)', textAlign: 'center' } }, [
    el('container', {}, { desktop: { maxWidth: '800px', margin: '0 auto' } }, [
      el('text', { text: 'LUXURY SKINCARE' }, { desktop: { fontSize: '10px', letterSpacing: '0.3em', color: '#c084fc', fontWeight: '600' } }),
      el('heading', { text: '$PRODUCT_NAME', level: 'h1' }, { desktop: { fontSize: '48px', fontWeight: '300', color: '#f5f0ff', marginTop: '12px', letterSpacing: '-0.02em' } }),
      el('text', { text: '$PRODUCT_DESC' }, { desktop: { fontSize: '15px', color: 'rgba(245,240,255,0.4)', lineHeight: '1.7', marginTop: '16px', maxWidth: '480px', margin: '16px auto 0' } }),
      el('container', {}, { desktop: { width: '320px', height: '320px', borderRadius: '50%', overflow: 'hidden', margin: '48px auto', boxShadow: '0 0 120px rgba(192,132,252,0.15)' } }, [
        el('image', { src: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600&h=600&fit=crop', alt: 'Product' }, { desktop: { width: '100%', height: '100%', objectFit: 'cover' } }),
      ]),
      el('container', {}, { desktop: { display: 'flex', gap: '32px', justifyContent: 'center', marginBottom: '32px' } }, [
        ...[{ icon: '🌿', text: 'Natural' }, { icon: '🐰', text: 'Cruelty Free' }, { icon: '♻️', text: 'Sustainable' }].map(item =>
          el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '6px' } }, [
            el('text', { text: item.icon }, { desktop: { fontSize: '16px' } }),
            el('text', { text: item.text }, { desktop: { fontSize: '11px', color: 'rgba(245,240,255,0.5)' } }),
          ])
        ),
      ]),
      el('text', { text: '$PRODUCT_PRICE' }, { desktop: { fontSize: '32px', fontWeight: '600', color: '#f5f0ff', marginBottom: '24px' } }),
      el('button', { text: 'Add to Bag', href: '#' }, { desktop: { padding: '16px 56px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#fff', border: 'none', borderRadius: '50px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' } }),
    ]),
  ], 'Beauty Product'),
];

// ═══════════════════════════════════════════════════════════════
// 8. SUBSCRIPTION BOX — Feature-rich
// ═══════════════════════════════════════════════════════════════
const subscriptionBox = (): EditorElement[] => [
  el('section', {}, { desktop: { padding: '100px 40px', backgroundColor: '#0a0a0a' } }, [
    el('container', {}, { desktop: { maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '60px', alignItems: 'center' } }, [
      el('container', {}, { desktop: { position: 'relative' } }, [
        el('container', {}, { desktop: { borderRadius: '24px', overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' } }, [
          el('image', { src: 'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=900&h=700&fit=crop', alt: 'Box' }, { desktop: { width: '100%', height: 'auto' } }),
        ]),
        el('container', {}, { desktop: { position: 'absolute', bottom: '-16px', right: '-16px', padding: '16px 24px', backgroundColor: '#22c55e', borderRadius: '12px', color: '#fff' } }, [
          el('text', { text: 'From $PRODUCT_PRICE/mo' }, { desktop: { fontSize: '14px', fontWeight: '700' } }),
        ]),
      ]),
      el('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '20px' } }, [
        el('text', { text: 'SUBSCRIPTION' }, { desktop: { fontSize: '10px', letterSpacing: '0.3em', color: '#22c55e', fontWeight: '600' } }),
        el('heading', { text: '$PRODUCT_NAME', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', lineHeight: '1.2' } }),
        el('text', { text: '$PRODUCT_DESC' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.7' } }),
        el('container', {}, { desktop: { display: 'flex', flexDirection: 'column', gap: '12px' } }, [
          ...[' Curated premium items monthly', ' Free shipping worldwide', ' Cancel anytime', ' Member-exclusive discounts'].map(item =>
            el('container', {}, { desktop: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
              el('text', { text: '✓' }, { desktop: { fontSize: '14px', color: '#22c55e', fontWeight: '700' } }),
              el('text', { text: item }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.6)' } }),
            ])
          ),
        ]),
        el('container', {}, { desktop: { display: 'flex', gap: '8px', marginTop: '8px' } }, [
          ...[{ label: 'Monthly', price: '$PRODUCT_PRICE', popular: false }, { label: 'Quarterly', price: '$PRODUCT_PRICE', popular: true }, { label: 'Annual', price: '$PRODUCT_PRICE', popular: false }].map(plan =>
            el('container', {}, { desktop: { flex: '1', padding: '16px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', border: plan.popular ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.1)', backgroundColor: plan.popular ? 'rgba(34,197,94,0.05)' : 'transparent' } }, [
              el('text', { text: plan.label }, { desktop: { fontSize: '11px', color: plan.popular ? '#22c55e' : 'rgba(255,255,255,0.5)', fontWeight: '600' } }),
              el('text', { text: plan.price }, { desktop: { fontSize: '18px', fontWeight: '700', color: '#fff', marginTop: '4px' } }),
            ])
          ),
        ]),
        el('button', { text: 'Subscribe Now', href: '#' }, { desktop: { padding: '16px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' } }),
      ]),
    ]),
  ], 'Subscription Box'),
];

// ═══════════════════════════════════════════════════════════════
// 9. PRODUCT COMPARISON — Side by side
// ═══════════════════════════════════════════════════════════════
const productComparison = (): EditorElement[] => [
  el('section', {}, { desktop: { padding: '80px 40px', backgroundColor: '#0f0f0f' } }, [
    el('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto', textAlign: 'center' } }, [
      el('heading', { text: 'Choose Your $PRODUCT_NAME', level: 'h2' }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', marginBottom: '48px' } }),
      el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
        ...[
          { name: 'Essential', price: '$49', features: ['Core features', '1 year warranty', 'Standard support'], color: 'rgba(255,255,255,0.06)' },
          { name: 'Professional', price: '$99', features: ['All Essential features', '3 year warranty', 'Priority support', 'Premium materials'], color: 'rgba(99,102,241,0.08)' },
          { name: 'Elite', price: '$199', features: ['All Pro features', 'Lifetime warranty', '24/7 VIP support', 'Custom engraving', 'Gift box'], color: 'rgba(255,255,255,0.06)' },
        ].map((tier, i) =>
          el('container', {}, { desktop: { padding: '40px 24px', borderRadius: '16px', backgroundColor: tier.color, border: i === 1 ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(255,255,255,0.06)', position: 'relative' } }, [
            ...(i === 1 ? [el('text', { text: 'MOST POPULAR' }, { desktop: { position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', letterSpacing: '0.15em', color: '#fff', backgroundColor: '#6366f1', padding: '4px 12px', borderRadius: '20px', fontWeight: '700' } })] : []),
            el('text', { text: tier.name }, { desktop: { fontSize: '14px', fontWeight: '600', color: 'rgba(255,255,255,0.7)' } }),
            el('text', { text: tier.price }, { desktop: { fontSize: '36px', fontWeight: '700', color: '#fff', margin: '12px 0 20px' } }),
            ...tier.features.map(f =>
              el('text', { text: `✓  ${f}` }, { desktop: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'left', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } })
            ),
            el('button', { text: i === 1 ? 'Buy Now' : 'Select', href: '#' }, { desktop: { width: '100%', padding: '12px', backgroundColor: i === 1 ? '#6366f1' : 'transparent', color: '#fff', border: i === 1 ? 'none' : '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginTop: '24px' } }),
          ])
        ),
      ]),
    ]),
  ], 'Product Comparison'),
];

// ═══════════════════════════════════════════════════════════════
// 10. PRODUCT REVIEWS — Social proof section
// ═══════════════════════════════════════════════════════════════
const productReviews = (): EditorElement[] => [
  el('section', {}, { desktop: { padding: '80px 40px', backgroundColor: '#0a0a0a' } }, [
    el('container', {}, { desktop: { maxWidth: '1000px', margin: '0 auto' } }, [
      el('container', {}, { desktop: { textAlign: 'center', marginBottom: '48px' } }, [
        el('container', {}, { desktop: { display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '12px' } }, [
          ...[1, 2, 3, 4, 5].map(() => el('text', { text: '★' }, { desktop: { fontSize: '24px', color: '#f59e0b' } })),
        ]),
        el('text', { text: '4.9 out of 5 based on 2,847 reviews' }, { desktop: { fontSize: '14px', color: 'rgba(255,255,255,0.5)' } }),
      ]),
      el('container', {}, { desktop: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' } }, [
        ...[
          { name: 'Sarah M.', rating: 5, text: 'Absolutely love this product. Quality is outstanding and it exceeded all my expectations. Would buy again in a heartbeat.', date: '2 days ago' },
          { name: 'James K.', rating: 5, text: 'Best purchase I\'ve made this year. The attention to detail is remarkable. Shipping was fast and packaging was premium.', date: '1 week ago' },
          { name: 'Emma L.', rating: 4, text: 'Great quality and beautiful design. Only giving 4 stars because delivery took a bit longer than expected. Product itself is perfect.', date: '2 weeks ago' },
        ].map(review =>
          el('container', {}, { desktop: { padding: '24px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } }, [
            el('container', {}, { desktop: { display: 'flex', gap: '2px', marginBottom: '12px' } }, [
              ...[1, 2, 3, 4, 5].map((_, i) => el('text', { text: '★' }, { desktop: { fontSize: '12px', color: i < review.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)' } })),
            ]),
            el('text', { text: `"${review.text}"` }, { desktop: { fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', fontStyle: 'italic', marginBottom: '16px' } }),
            el('container', {}, { desktop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' } }, [
              el('text', { text: review.name }, { desktop: { fontSize: '12px', fontWeight: '600', color: '#fff' } }),
              el('text', { text: review.date }, { desktop: { fontSize: '10px', color: 'rgba(255,255,255,0.3)' } }),
            ]),
          ])
        ),
      ]),
    ]),
  ], 'Product Reviews'),
];

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL TEMPLATES
// ═══════════════════════════════════════════════════════════════
export const PRODUCT_PAGE_TEMPLATES: ProductPageTemplate[] = [
  { id: 'product-hero-1', name: 'Luxury Split Hero', description: 'Full-height split layout with image and details side by side', icon: '👔', elements: luxuryHero() },
  { id: 'product-card-1', name: 'Minimal Card', description: 'Clean centered product card with round CTA', icon: '🎧', elements: minimalCard() },
  { id: 'product-editorial-1', name: 'Fashion Editorial', description: 'Full-bleed dramatic hero with overlay text', icon: '👗', elements: fashionEditorial() },
  { id: 'product-tech-1', name: 'Tech Showcase', description: 'Gradient hero with specs grid for electronics', icon: '📱', elements: techProduct() },
  { id: 'product-gallery-1', name: 'Multi-Image Gallery', description: 'Product gallery with sticky details sidebar', icon: '👟', elements: productGallery() },
  { id: 'product-food-1', name: 'Artisan Food', description: 'Warm split layout for food & beverage brands', icon: '☕', elements: foodProduct() },
  { id: 'product-beauty-1', name: 'Beauty & Cosmetics', description: 'Soft gradient layout with circular product image', icon: '💄', elements: beautyProduct() },
  { id: 'product-sub-1', name: 'Subscription Box', description: 'Feature-rich box layout with pricing tiers', icon: '📦', elements: subscriptionBox() },
  { id: 'product-compare-1', name: 'Product Comparison', description: '3-tier comparison cards for product variants', icon: '⚖️', elements: productComparison() },
  { id: 'product-reviews-1', name: 'Product Reviews', description: 'Social proof section with star ratings', icon: '⭐', elements: productReviews() },
];
