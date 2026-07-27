export interface PDFBlock {
  id: string;
  type: 'title' | 'subtitle' | 'paragraph' | 'heading' | 'list' | 'table' | 'menu-item' | 'menu-item-image' | 'divider' | 'spacer' | 'image-text' | 'two-column' | 'callout' | 'header' | 'footer' | 'step' | 'image';
  content: string;
  content2?: string;
  content3?: string; // image URL for menu-item-image
  items?: string[];
  imageUrl?: string; // for image blocks
  tableHeaders?: string[];
  tableRows?: string[][];
  style?: {
    fontSize?: number;
    bold?: boolean;
    italic?: boolean;
    color?: string;
    align?: 'left' | 'center' | 'right';
    bgColor?: string;
    borderColor?: string;
  };
}

export interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  blocks: PDFBlock[];
  pageSettings?: {
    orientation?: 'portrait' | 'landscape';
    margin?: number;
  };
}

let _bid = 0;
const bid = () => `b-${++_bid}`;

export const PDF_TEMPLATE_CATEGORIES = [
  { id: 'restaurant', name: 'Restaurant & Menu', icon: '🍽️', color: '#f59e0b' },
  { id: 'business', name: 'Business & Office', icon: '💼', color: '#3b82f6' },
  { id: 'education', name: 'Education & Tutorial', icon: '📚', color: '#8b5cf6' },
  { id: 'general', name: 'General Purpose', icon: '📄', color: '#10b981' },
  { id: 'creative', name: 'Creative & Portfolio', icon: '🎨', color: '#ec4899' },
];

export const PDF_TEMPLATES: PDFTemplate[] = [
  // ─── Restaurant & Menu ───
  {
    id: 'restaurant-menu',
    name: 'Restaurant Menu',
    description: 'Professional restaurant menu with items, descriptions & prices',
    category: 'restaurant',
    icon: '🍽️',
    color: '#f59e0b',
    blocks: [
      { id: bid(), type: 'title', content: 'The Grand Kitchen', style: { align: 'center', fontSize: 28, color: '#1a1a1a' } },
      { id: bid(), type: 'subtitle', content: 'Fine Dining Experience · Est. 2020', style: { align: 'center', color: '#666666' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🥗 Starters', style: { color: '#b45309' } },
      { id: bid(), type: 'menu-item', content: 'Caesar Salad', content2: '$14.50', items: ['Crisp romaine, shaved parmesan, house-made croutons, classic Caesar dressing'] },
      { id: bid(), type: 'menu-item', content: 'Truffle Mushroom Soup', content2: '$12.00', items: ['Wild mushroom blend, truffle oil, toasted sourdough'] },
      { id: bid(), type: 'menu-item', content: 'Bruschetta Trio', content2: '$16.00', items: ['Classic tomato basil, roasted pepper hummus, smoked salmon'] },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🥩 Main Courses', style: { color: '#b45309' } },
      { id: bid(), type: 'menu-item', content: 'Grilled Ribeye Steak', content2: '$38.00', items: ['12oz prime cut, roasted garlic butter, seasonal vegetables, truffle mash'] },
      { id: bid(), type: 'menu-item', content: 'Pan-Seared Salmon', content2: '$32.00', items: ['Atlantic salmon, lemon dill sauce, asparagus, wild rice'] },
      { id: bid(), type: 'menu-item', content: 'Lobster Linguine', content2: '$36.00', items: ['Fresh lobster tail, cherry tomatoes, basil, white wine cream sauce'] },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🍰 Desserts', style: { color: '#b45309' } },
      { id: bid(), type: 'menu-item', content: 'Tiramisu', content2: '$11.00', items: ['Classic Italian, mascarpone, espresso-soaked ladyfingers'] },
      { id: bid(), type: 'menu-item', content: 'Crème Brûlée', content2: '$10.00', items: ['Madagascar vanilla, caramelized sugar crust'] },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'footer', content: 'All prices include tax · Gratuity not included · Please inform us of any allergies', style: { align: 'center', color: '#999999' } },
    ],
  },
  {
    id: 'cafe-menu',
    name: 'Café & Coffee Menu',
    description: 'Modern café menu for beverages and light bites',
    category: 'restaurant',
    icon: '☕',
    color: '#92400e',
    blocks: [
      { id: bid(), type: 'title', content: 'Brew & Bean', style: { align: 'center', fontSize: 26 } },
      { id: bid(), type: 'subtitle', content: 'Specialty Coffee · Artisan Bakes', style: { align: 'center', color: '#78716c' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '☕ Hot Beverages', style: { color: '#78350f' } },
      { id: bid(), type: 'menu-item', content: 'Espresso', content2: '$3.50', items: ['Single or double shot, rich crema'] },
      { id: bid(), type: 'menu-item', content: 'Flat White', content2: '$5.00', items: ['Velvety steamed milk, double shot'] },
      { id: bid(), type: 'menu-item', content: 'Matcha Latte', content2: '$5.50', items: ['Ceremonial grade matcha, oat milk'] },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🥐 Pastries', style: { color: '#78350f' } },
      { id: bid(), type: 'menu-item', content: 'Croissant', content2: '$4.00', items: ['Butter, almond, or chocolate'] },
      { id: bid(), type: 'menu-item', content: 'Banana Bread', content2: '$4.50', items: ['Walnut & cinnamon, served warm'] },
      { id: bid(), type: 'footer', content: 'Ask about dairy-free & gluten-free options', style: { align: 'center', color: '#999' } },
    ],
  },
  // Bistro Menu with image placeholders
  {
    id: 'bistro-menu',
    name: 'Bistro Menu with Photos',
    description: 'Elegant bistro menu with food photography placeholders',
    category: 'restaurant',
    icon: '📸',
    color: '#7c3aed',
    blocks: [
      { id: bid(), type: 'title', content: 'Le Petit Bistro', style: { align: 'center', fontSize: 30, color: '#1a1a1a' } },
      { id: bid(), type: 'subtitle', content: 'Farm to Table · French-Inspired Cuisine', style: { align: 'center', color: '#78716c' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🥂 Chef\'s Selection', style: { color: '#6d28d9' } },
      { id: bid(), type: 'menu-item-image', content: 'Duck Confit', content2: '$34.00', content3: '', items: ['Slow-cooked duck leg, crispy skin, potato gratin, cherry jus, micro herbs'] },
      { id: bid(), type: 'menu-item-image', content: 'Seared Scallops', content2: '$38.00', content3: '', items: ['Pan-seared diver scallops, cauliflower purée, pancetta, brown butter'] },
      { id: bid(), type: 'menu-item-image', content: 'Wagyu Tartare', content2: '$28.00', content3: '', items: ['Hand-cut A5 wagyu, quail egg, capers, shallots, sourdough crisps'] },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🍝 Handmade Pasta', style: { color: '#6d28d9' } },
      { id: bid(), type: 'menu-item-image', content: 'Truffle Tagliatelle', content2: '$26.00', content3: '', items: ['Fresh egg pasta, black truffle shavings, parmesan cream, wild mushrooms'] },
      { id: bid(), type: 'menu-item-image', content: 'Lobster Ravioli', content2: '$32.00', content3: '', items: ['Maine lobster filling, saffron bisque, chive oil, micro basil'] },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'footer', content: 'Upload your own food photography to showcase each dish · Allergen info available on request', style: { align: 'center', color: '#999999' } },
    ],
  },
  // Cocktail & Bar Menu
  {
    id: 'cocktail-menu',
    name: 'Cocktail & Bar Menu',
    description: 'Stylish bar menu with signature cocktails',
    category: 'restaurant',
    icon: '🍸',
    color: '#dc2626',
    blocks: [
      { id: bid(), type: 'title', content: 'The Velvet Lounge', style: { align: 'center', fontSize: 28, color: '#1c1917' } },
      { id: bid(), type: 'subtitle', content: 'Craft Cocktails · Fine Spirits · Wine', style: { align: 'center', color: '#78716c' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🍸 Signature Cocktails', style: { color: '#dc2626' } },
      { id: bid(), type: 'menu-item-image', content: 'Velvet Negroni', content2: '$18.00', content3: '', items: ['Barrel-aged gin, Campari, sweet vermouth, orange twist, smoke infusion'] },
      { id: bid(), type: 'menu-item-image', content: 'Sakura Sour', content2: '$16.00', content3: '', items: ['Japanese whisky, cherry blossom syrup, lemon, egg white, plum bitters'] },
      { id: bid(), type: 'menu-item-image', content: 'Espresso Martini Royale', content2: '$20.00', content3: '', items: ['Grey Goose vodka, fresh espresso, coffee liqueur, vanilla, gold leaf'] },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🥃 Premium Spirits', style: { color: '#dc2626' } },
      { id: bid(), type: 'menu-item', content: 'Macallan 18yr', content2: '$45.00', items: ['Single malt, Speyside, sherry cask matured'] },
      { id: bid(), type: 'menu-item', content: 'Clase Azul Reposado', content2: '$38.00', items: ['Tequila, aged 8 months, hints of vanilla & caramel'] },
      { id: bid(), type: 'menu-item', content: 'Hibiki Harmony', content2: '$28.00', items: ['Japanese blended whisky, honey & orange peel notes'] },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'footer', content: 'Please drink responsibly · All prices include service', style: { align: 'center', color: '#999999' } },
    ],
  },
  // Bakery & Dessert Menu
  {
    id: 'bakery-menu',
    name: 'Bakery & Dessert Menu',
    description: 'Artisan bakery showcase with photos',
    category: 'restaurant',
    icon: '🧁',
    color: '#ec4899',
    blocks: [
      { id: bid(), type: 'title', content: 'Sugar & Bloom', style: { align: 'center', fontSize: 28, color: '#831843' } },
      { id: bid(), type: 'subtitle', content: 'Artisan Pâtisserie & Boulangerie', style: { align: 'center', color: '#9f1239' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🎂 Signature Cakes', style: { color: '#be185d' } },
      { id: bid(), type: 'menu-item-image', content: 'Opera Cake', content2: '$12.00', content3: '', items: ['Almond sponge, coffee buttercream, chocolate ganache, gold leaf'] },
      { id: bid(), type: 'menu-item-image', content: 'Raspberry Millefeuille', content2: '$14.00', content3: '', items: ['Crispy puff pastry, vanilla diplomat cream, fresh raspberries, caramel glaze'] },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🥐 Viennoiserie', style: { color: '#be185d' } },
      { id: bid(), type: 'menu-item-image', content: 'Pain au Chocolat', content2: '$5.50', content3: '', items: ['Buttery laminated dough, Valrhona dark chocolate, flaky golden crust'] },
      { id: bid(), type: 'menu-item-image', content: 'Almond Croissant', content2: '$6.00', content3: '', items: ['Twice-baked, frangipane filling, toasted almond flakes, powdered sugar'] },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🍫 Petit Fours & Bonbons', style: { color: '#be185d' } },
      { id: bid(), type: 'menu-item', content: 'Macaron Selection (6pc)', content2: '$16.00', items: ['Rotating seasonal flavors: pistachio, lavender, passion fruit, salted caramel, matcha, rose'] },
      { id: bid(), type: 'menu-item', content: 'Chocolate Truffle Box (12pc)', content2: '$28.00', items: ['Hand-rolled, single-origin dark, milk & white chocolate, gift-boxed'] },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'callout', content: '🎁 Custom cakes & wedding orders available — ask for our bespoke patisserie brochure', style: { bgColor: '#fdf2f8', borderColor: '#ec4899' } },
      { id: bid(), type: 'footer', content: 'All items baked fresh daily · Gluten-free options marked with (GF)', style: { align: 'center', color: '#999999' } },
    ],
  },
  // Sushi & Japanese Menu
  {
    id: 'sushi-menu',
    name: 'Sushi & Japanese Menu',
    description: 'Premium omakase-style menu with photos',
    category: 'restaurant',
    icon: '🍣',
    color: '#0f766e',
    blocks: [
      { id: bid(), type: 'title', content: '鮨 OMAKASE', style: { align: 'center', fontSize: 30, color: '#0f172a' } },
      { id: bid(), type: 'subtitle', content: 'Authentic Japanese · Premium Sushi & Sashimi', style: { align: 'center', color: '#64748b' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🍱 Nigiri Selection', style: { color: '#0f766e' } },
      { id: bid(), type: 'menu-item-image', content: 'Otoro (Bluefin Tuna Belly)', content2: '$18.00', content3: '', items: ['Premium fatty tuna, melt-in-mouth texture, aged soy, fresh wasabi'] },
      { id: bid(), type: 'menu-item-image', content: 'A5 Wagyu Nigiri', content2: '$22.00', content3: '', items: ['Torched Japanese wagyu, truffle salt, ponzu gel, gold leaf'] },
      { id: bid(), type: 'menu-item-image', content: 'Uni (Sea Urchin)', content2: '$16.00', content3: '', items: ['Hokkaido uni, shiso leaf, yuzu zest, seasoned rice'] },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🥢 Signature Rolls', style: { color: '#0f766e' } },
      { id: bid(), type: 'menu-item-image', content: 'Dragon Roll', content2: '$24.00', content3: '', items: ['Tempura prawn, avocado, unagi glaze, tobiko, black sesame'] },
      { id: bid(), type: 'menu-item-image', content: 'Rainbow Sashimi Roll', content2: '$22.00', content3: '', items: ['Tuna, salmon, yellowtail, avocado, cucumber, spicy mayo'] },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '🍶 Sake Pairing', style: { color: '#0f766e' } },
      { id: bid(), type: 'menu-item', content: 'Dassai 23 Junmai Daiginjo', content2: '$32.00', items: ['Yamaguchi, floral & fruity, rice polished to 23%'] },
      { id: bid(), type: 'menu-item', content: 'Hakkaisan Tokubetsu', content2: '$18.00', items: ['Niigata, clean & crisp, excellent with sashimi'] },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'callout', content: '🐟 All fish is flown in daily from Tsukiji Market, Tokyo. Omakase tasting menu available (Chef\'s choice, 12 courses — $120pp)', style: { bgColor: '#f0fdfa', borderColor: '#0f766e' } },
      { id: bid(), type: 'footer', content: 'Prices per piece unless stated · Please inform your server of any allergies', style: { align: 'center', color: '#999999' } },
    ],
  },

  // ─── Business & Office ───
  {
    id: 'business-proposal',
    name: 'Business Proposal',
    description: 'Professional proposal template with sections and tables',
    category: 'business',
    icon: '📊',
    color: '#3b82f6',
    blocks: [
      { id: bid(), type: 'title', content: 'Business Proposal', style: { align: 'center', fontSize: 28, color: '#1e3a5f' } },
      { id: bid(), type: 'subtitle', content: 'Prepared for: [Client Name]\nDate: February 2026', style: { align: 'center', color: '#64748b' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: 'Executive Summary' },
      { id: bid(), type: 'paragraph', content: 'We are pleased to present this proposal outlining our recommended approach and solutions for your project. Our team brings extensive experience and a proven track record of delivering exceptional results within agreed timelines and budgets.' },
      { id: bid(), type: 'heading', content: 'Scope of Work' },
      { id: bid(), type: 'list', content: '', items: ['Phase 1: Discovery & Research (2 weeks)', 'Phase 2: Strategy & Planning (1 week)', 'Phase 3: Design & Development (4 weeks)', 'Phase 4: Testing & Launch (1 week)', 'Phase 5: Post-launch Support (ongoing)'] },
      { id: bid(), type: 'heading', content: 'Pricing' },
      { id: bid(), type: 'table', content: '', tableHeaders: ['Service', 'Details', 'Price'], tableRows: [['Discovery & Research', 'Stakeholder interviews, market analysis', '$5,000'], ['Design', 'UI/UX design, prototyping', '$12,000'], ['Development', 'Full-stack implementation', '$25,000'], ['Testing & QA', 'Comprehensive quality assurance', '$4,000'], ['Total', '', '$46,000']] },
      { id: bid(), type: 'heading', content: 'Timeline' },
      { id: bid(), type: 'paragraph', content: 'The estimated project duration is 8 weeks from the date of acceptance. A detailed Gantt chart will be provided upon project kickoff.' },
      { id: bid(), type: 'heading', content: 'Terms & Conditions' },
      { id: bid(), type: 'paragraph', content: '50% deposit required upon acceptance. Remaining 50% due upon project completion. This proposal is valid for 30 days from the date above.' },
      { id: bid(), type: 'footer', content: 'Confidential — [Your Company Name] © 2026', style: { align: 'center', color: '#94a3b8' } },
    ],
  },
  {
    id: 'invoice-template',
    name: 'Invoice',
    description: 'Clean professional invoice for billing clients',
    category: 'business',
    icon: '🧾',
    color: '#0ea5e9',
    blocks: [
      { id: bid(), type: 'header', content: 'INVOICE', style: { align: 'right', fontSize: 32, color: '#1e3a5f', bold: true } },
      { id: bid(), type: 'two-column', content: '[Your Company Name]\n123 Business Ave\nCity, State 12345\ninfo@company.com', content2: 'Invoice #: INV-2026-001\nDate: Feb 23, 2026\nDue Date: Mar 23, 2026\nPayment Terms: Net 30' },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'subtitle', content: 'Bill To:', style: { color: '#64748b' } },
      { id: bid(), type: 'paragraph', content: '[Client Name]\n[Client Address]\n[Client City, State ZIP]\n[Client Email]' },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'table', content: '', tableHeaders: ['Description', 'Qty', 'Rate', 'Amount'], tableRows: [['Web Design Services', '1', '$5,000', '$5,000'], ['Frontend Development', '40 hrs', '$150/hr', '$6,000'], ['Backend Integration', '20 hrs', '$175/hr', '$3,500'], ['Project Management', '1', '$2,000', '$2,000']] },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'callout', content: 'Subtotal: $16,500\nTax (8%): $1,320\n\nTotal Due: $17,820', style: { align: 'right', bold: true, bgColor: '#f0f9ff' } },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'paragraph', content: 'Payment Methods: Bank Transfer, Credit Card, PayPal\nBank: First National Bank | Account: 1234567890 | Routing: 021000021', style: { color: '#64748b' } },
      { id: bid(), type: 'footer', content: 'Thank you for your business!', style: { align: 'center', color: '#94a3b8' } },
    ],
  },
  {
    id: 'meeting-minutes',
    name: 'Meeting Minutes',
    description: 'Structured meeting notes with action items',
    category: 'business',
    icon: '📝',
    color: '#6366f1',
    blocks: [
      { id: bid(), type: 'title', content: 'Meeting Minutes', style: { fontSize: 26 } },
      { id: bid(), type: 'two-column', content: 'Date: February 23, 2026\nTime: 10:00 AM – 11:30 AM\nLocation: Conference Room A', content2: 'Chair: [Name]\nNote Taker: [Name]\nAttendees: [Names]' },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '1. Welcome & Roll Call' },
      { id: bid(), type: 'paragraph', content: 'The meeting was called to order at 10:00 AM. All attendees were present.' },
      { id: bid(), type: 'heading', content: '2. Review of Previous Minutes' },
      { id: bid(), type: 'paragraph', content: 'Minutes from the previous meeting were reviewed and approved without amendments.' },
      { id: bid(), type: 'heading', content: '3. Discussion Items' },
      { id: bid(), type: 'list', content: '', items: ['Q1 performance review — exceeded targets by 12%', 'New product launch timeline — confirmed for April 2026', 'Budget allocation for Q2 — pending finance approval', 'Team restructuring proposal — to be discussed at next meeting'] },
      { id: bid(), type: 'heading', content: '4. Action Items' },
      { id: bid(), type: 'table', content: '', tableHeaders: ['Action', 'Owner', 'Due Date', 'Status'], tableRows: [['Prepare Q2 budget report', 'J. Smith', 'Mar 1, 2026', 'Pending'], ['Draft product launch plan', 'A. Johnson', 'Mar 5, 2026', 'In Progress'], ['Schedule team workshops', 'M. Davis', 'Mar 10, 2026', 'Not Started']] },
      { id: bid(), type: 'heading', content: '5. Next Meeting' },
      { id: bid(), type: 'paragraph', content: 'March 2, 2026 at 10:00 AM in Conference Room A' },
      { id: bid(), type: 'footer', content: 'Minutes approved by: ________________  Date: ________________', style: { align: 'center' } },
    ],
  },
  {
    id: 'company-report',
    name: 'Company Report',
    description: 'Annual or quarterly business report template',
    category: 'business',
    icon: '📈',
    color: '#059669',
    blocks: [
      { id: bid(), type: 'title', content: 'Annual Report 2025', style: { align: 'center', fontSize: 30, color: '#0f172a' } },
      { id: bid(), type: 'subtitle', content: '[Company Name]\nFiscal Year: January – December 2025', style: { align: 'center', color: '#64748b' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: 'CEO Letter' },
      { id: bid(), type: 'paragraph', content: 'Dear Stakeholders,\n\nI am pleased to share that 2025 has been a remarkable year for our organization. We achieved record revenue growth of 23% year-over-year while expanding our team to over 200 talented professionals.' },
      { id: bid(), type: 'heading', content: 'Financial Highlights' },
      { id: bid(), type: 'table', content: '', tableHeaders: ['Metric', '2024', '2025', 'Growth'], tableRows: [['Revenue', '$12.4M', '$15.3M', '+23%'], ['Net Profit', '$2.1M', '$3.2M', '+52%'], ['Customers', '1,200', '1,850', '+54%'], ['Employees', '145', '210', '+45%']] },
      { id: bid(), type: 'heading', content: 'Key Achievements' },
      { id: bid(), type: 'list', content: '', items: ['Launched 3 new product lines generating $2.8M in revenue', 'Expanded to 5 new international markets', 'Achieved 98.5% customer satisfaction score', 'Reduced operational costs by 15% through automation'] },
      { id: bid(), type: 'heading', content: 'Looking Ahead' },
      { id: bid(), type: 'paragraph', content: 'In 2026, we plan to invest heavily in AI-driven solutions, expand our Asia-Pacific operations, and launch our enterprise platform. Our target revenue is $20M with continued profitability growth.' },
      { id: bid(), type: 'footer', content: '[Company Name] · Annual Report 2025 · Confidential', style: { align: 'center', color: '#94a3b8' } },
    ],
  },

  // ─── Education & Tutorial ───
  {
    id: 'tutorial-guide',
    name: 'Tutorial Guide',
    description: 'Step-by-step tutorial with numbered steps and tips',
    category: 'education',
    icon: '📖',
    color: '#8b5cf6',
    blocks: [
      { id: bid(), type: 'title', content: 'Getting Started Guide', style: { align: 'center', fontSize: 28, color: '#4c1d95' } },
      { id: bid(), type: 'subtitle', content: 'A step-by-step tutorial for new users', style: { align: 'center', color: '#7c3aed' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'callout', content: '💡 This guide will walk you through the complete setup process. Estimated time: 15 minutes.', style: { bgColor: '#f5f3ff', borderColor: '#8b5cf6' } },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'step', content: 'Step 1: Create Your Account', content2: 'Visit our website and click "Sign Up". Fill in your name, email address, and create a secure password. You\'ll receive a verification email — click the link to activate your account.' },
      { id: bid(), type: 'step', content: 'Step 2: Configure Your Workspace', content2: 'Once logged in, navigate to Settings > Workspace. Here you can customize your workspace name, invite team members, and set your timezone preferences.' },
      { id: bid(), type: 'step', content: 'Step 3: Create Your First Project', content2: 'Click the "+ New Project" button on the dashboard. Choose a template or start from scratch. Give your project a descriptive name and set the target completion date.' },
      { id: bid(), type: 'step', content: 'Step 4: Add Content & Collaborate', content2: 'Use the editor to add text, images, and media. Share the project with team members using the "Invite" button. Real-time collaboration is supported out of the box.' },
      { id: bid(), type: 'step', content: 'Step 5: Review & Publish', content2: 'Preview your work using the "Preview" button. Make final adjustments, then click "Publish" to make your project live. You can always edit and republish later.' },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'callout', content: '🎉 Congratulations! You\'ve completed the setup. Visit our Help Center for advanced tutorials and tips.', style: { bgColor: '#ecfdf5', borderColor: '#10b981' } },
      { id: bid(), type: 'footer', content: 'Need help? Contact support@example.com', style: { align: 'center', color: '#94a3b8' } },
    ],
  },
  {
    id: 'course-syllabus',
    name: 'Course Syllabus',
    description: 'Academic course outline with schedule and objectives',
    category: 'education',
    icon: '🎓',
    color: '#7c3aed',
    blocks: [
      { id: bid(), type: 'title', content: 'Course Syllabus', style: { align: 'center', fontSize: 26 } },
      { id: bid(), type: 'subtitle', content: 'Introduction to Data Science — Spring 2026\nInstructor: Dr. Jane Smith | Office: Room 305', style: { align: 'center', color: '#64748b' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: 'Course Description' },
      { id: bid(), type: 'paragraph', content: 'This course provides a comprehensive introduction to data science concepts, tools, and methodologies. Students will learn Python programming, statistical analysis, machine learning fundamentals, and data visualization.' },
      { id: bid(), type: 'heading', content: 'Learning Objectives' },
      { id: bid(), type: 'list', content: '', items: ['Understand core data science principles and workflows', 'Proficiency in Python for data analysis (Pandas, NumPy)', 'Apply statistical methods to real-world datasets', 'Build and evaluate basic machine learning models', 'Create effective data visualizations and reports'] },
      { id: bid(), type: 'heading', content: 'Course Schedule' },
      { id: bid(), type: 'table', content: '', tableHeaders: ['Week', 'Topic', 'Assignment'], tableRows: [['1-2', 'Python Fundamentals', 'Lab 1'], ['3-4', 'Data Wrangling with Pandas', 'Lab 2'], ['5-6', 'Statistical Analysis', 'Midterm Project'], ['7-8', 'Machine Learning Basics', 'Lab 3'], ['9-10', 'Data Visualization', 'Lab 4'], ['11-12', 'Final Project Presentations', 'Final Report']] },
      { id: bid(), type: 'heading', content: 'Grading' },
      { id: bid(), type: 'table', content: '', tableHeaders: ['Component', 'Weight'], tableRows: [['Labs & Homework', '30%'], ['Midterm Project', '20%'], ['Participation', '10%'], ['Final Project', '40%']] },
      { id: bid(), type: 'footer', content: 'University of Technology · Department of Computer Science', style: { align: 'center', color: '#94a3b8' } },
    ],
  },

  // ─── General Purpose ───
  {
    id: 'blank-doc',
    name: 'Blank Document',
    description: 'Start with a clean slate',
    category: 'general',
    icon: '📄',
    color: '#64748b',
    blocks: [
      { id: bid(), type: 'title', content: 'Document Title', style: { fontSize: 26 } },
      { id: bid(), type: 'paragraph', content: 'Start typing your content here...' },
    ],
  },
  {
    id: 'letter-template',
    name: 'Formal Letter',
    description: 'Professional letter format with header and footer',
    category: 'general',
    icon: '✉️',
    color: '#475569',
    blocks: [
      { id: bid(), type: 'paragraph', content: '[Your Name]\n[Your Address]\n[City, State ZIP]\n[Your Email]\n[Date]' },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'paragraph', content: '[Recipient Name]\n[Recipient Title]\n[Company Name]\n[Address]\n[City, State ZIP]' },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'paragraph', content: 'Dear [Recipient Name],' },
      { id: bid(), type: 'paragraph', content: 'I am writing to [purpose of the letter]. I would like to bring to your attention [main topic].' },
      { id: bid(), type: 'paragraph', content: 'In the body of this letter, I will elaborate on [key points]. Please find the relevant details outlined below for your consideration.' },
      { id: bid(), type: 'paragraph', content: 'I appreciate your time and attention to this matter. Please do not hesitate to contact me if you require any additional information or have questions.' },
      { id: bid(), type: 'paragraph', content: 'Sincerely,\n\n\n[Your Name]\n[Your Title]' },
    ],
  },
  {
    id: 'checklist-template',
    name: 'Checklist',
    description: 'Printable checklist with categories',
    category: 'general',
    icon: '✅',
    color: '#16a34a',
    blocks: [
      { id: bid(), type: 'title', content: 'Project Checklist', style: { fontSize: 26 } },
      { id: bid(), type: 'subtitle', content: 'Project: [Name] | Due: [Date]', style: { color: '#64748b' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: '📋 Planning Phase' },
      { id: bid(), type: 'list', content: '', items: ['☐ Define project scope and objectives', '☐ Identify stakeholders and team members', '☐ Create project timeline', '☐ Set budget and resource allocation', '☐ Risk assessment completed'] },
      { id: bid(), type: 'heading', content: '🔨 Execution Phase' },
      { id: bid(), type: 'list', content: '', items: ['☐ Kick-off meeting conducted', '☐ Phase 1 deliverables completed', '☐ Phase 2 deliverables completed', '☐ Quality review passed', '☐ Client feedback incorporated'] },
      { id: bid(), type: 'heading', content: '🚀 Launch Phase' },
      { id: bid(), type: 'list', content: '', items: ['☐ Final testing completed', '☐ Documentation prepared', '☐ Training materials delivered', '☐ Go-live approval obtained', '☐ Post-launch monitoring set up'] },
      { id: bid(), type: 'footer', content: 'Last updated: ________________', style: { align: 'right', color: '#94a3b8' } },
    ],
  },

  // ─── Creative & Portfolio ───
  {
    id: 'portfolio-resume',
    name: 'Professional Resume',
    description: 'Clean modern resume / CV template',
    category: 'creative',
    icon: '👤',
    color: '#ec4899',
    blocks: [
      { id: bid(), type: 'title', content: 'John Doe', style: { align: 'center', fontSize: 30 } },
      { id: bid(), type: 'subtitle', content: 'Senior Software Engineer\njohn.doe@email.com · +1 (555) 123-4567 · linkedin.com/in/johndoe', style: { align: 'center', color: '#64748b' } },
      { id: bid(), type: 'divider', content: '' },
      { id: bid(), type: 'heading', content: 'Professional Summary' },
      { id: bid(), type: 'paragraph', content: 'Results-driven software engineer with 8+ years of experience building scalable web applications. Expert in React, TypeScript, Node.js, and cloud architecture. Proven track record of leading teams and delivering high-impact products.' },
      { id: bid(), type: 'heading', content: 'Experience' },
      { id: bid(), type: 'paragraph', content: 'Senior Software Engineer — TechCorp Inc.\nJan 2022 – Present', style: { bold: true } },
      { id: bid(), type: 'list', content: '', items: ['Led team of 8 engineers in rebuilding the core platform', 'Reduced page load times by 60% through performance optimization', 'Implemented CI/CD pipeline reducing deployment time by 75%'] },
      { id: bid(), type: 'paragraph', content: 'Software Engineer — StartupXYZ\nJun 2018 – Dec 2021', style: { bold: true } },
      { id: bid(), type: 'list', content: '', items: ['Built real-time collaboration features serving 50K+ users', 'Designed and implemented RESTful API architecture', 'Mentored 3 junior developers'] },
      { id: bid(), type: 'heading', content: 'Education' },
      { id: bid(), type: 'paragraph', content: 'B.S. Computer Science — MIT (2018)\nGPA: 3.8/4.0 | Dean\'s List' },
      { id: bid(), type: 'heading', content: 'Skills' },
      { id: bid(), type: 'paragraph', content: 'React · TypeScript · Node.js · Python · PostgreSQL · AWS · Docker · GraphQL · Git · Agile/Scrum' },
    ],
  },
  {
    id: 'event-flyer',
    name: 'Event Flyer',
    description: 'Eye-catching event announcement template',
    category: 'creative',
    icon: '🎪',
    color: '#f43f5e',
    blocks: [
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'title', content: '🎉 Annual Tech Conference 2026', style: { align: 'center', fontSize: 30, color: '#be123c' } },
      { id: bid(), type: 'subtitle', content: 'Innovation · Collaboration · Growth', style: { align: 'center', color: '#f43f5e' } },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'callout', content: '📅 March 15-17, 2026\n📍 Grand Convention Center, San Francisco\n🎟️ Early Bird Tickets: $199 (Regular $349)', style: { align: 'center', bgColor: '#fff1f2', borderColor: '#f43f5e' } },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'heading', content: 'What to Expect', style: { align: 'center' } },
      { id: bid(), type: 'list', content: '', items: ['50+ industry-leading speakers', '20+ hands-on workshops', 'Networking with 2,000+ professionals', 'Startup pitch competition', 'Career fair with top tech companies'] },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'heading', content: 'Featured Speakers', style: { align: 'center' } },
      { id: bid(), type: 'two-column', content: '👩‍💻 Sarah Chen\nCEO, FutureTech\n"AI in 2026"', content2: '👨‍🔬 Dr. James Park\nCTO, CloudScale\n"Edge Computing Revolution"' },
      { id: bid(), type: 'spacer', content: '' },
      { id: bid(), type: 'callout', content: '🔗 Register now at techconf2026.com\nUse code EARLY2026 for 20% off!', style: { align: 'center', bgColor: '#ecfdf5', borderColor: '#10b981' } },
      { id: bid(), type: 'footer', content: 'Follow us: @techconf2026 | #TechConf2026', style: { align: 'center', color: '#94a3b8' } },
    ],
  },
];
