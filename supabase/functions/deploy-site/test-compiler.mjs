/**
 * Runs the REAL deploy-site compiler against a realistic page tree and
 * asserts on the HTML it produces. No Deno needed: the Deno-only bits
 * (imports, serve handler) are stripped, the rest is transpiled and
 * evaluated, then the pure compiler functions are exercised directly.
 */
import { readFileSync } from 'node:fs';
import { transformSync } from '/home/user/m/node_modules/esbuild/lib/main.js';

const SRC = '/home/user/m/supabase/functions/deploy-site/index.ts';
let src = readFileSync(SRC, 'utf8');

// Drop the Deno import lines and the serve(...) handler; keep every helper.
src = src.replace(/^import .*$/gm, '');
const serveStart = src.indexOf('serve(async (req)');
const typesStart = src.indexOf('// ─── Types ─');
if (serveStart === -1 || typesStart === -1) throw new Error('could not locate serve handler / helpers boundary');
src = src.slice(0, serveStart) + src.slice(typesStart);

const js = transformSync(src, { loader: 'ts', format: 'cjs', target: 'es2022' }).code;
const module_ = { exports: {} };
const fn = new Function('module', 'exports', 'require', 'crypto', js + '\nmodule.exports = { compilePages, elementToHTML, resolveHref, escapeAttr, safeURL, generateBasicJS, minifyCSS, minifyJS, intrinsicPx };');
fn(module_, module_.exports, () => ({}), globalThis.crypto);
const { compilePages, resolveHref, escapeAttr, safeURL, minifyCSS } = module_.exports;

// ── a page tree that exercises the things that used to be broken ──
const PAGES = [
  {
    page_name: 'Home', slug: '', is_homepage: true,
    seo_title: 'Caerphilly Dental', seo_description: 'A dental practice in Caerphilly.',
    page_settings: { og_image_url: '/social.jpg', lang: 'en-GB' },
    elements: [
      { id: 'nav1', type: 'navbar', children: [
        { id: 'l1', type: 'link', props: { text: 'Pricing', href: '#pricing' } },
        { id: 'l2', type: 'link', props: { text: 'Contact', href: '#contact' } },
        { id: 'l3', type: 'link', props: { text: 'Find us', href: 'https://maps.example.com', newTab: true } },
      ]},
      { id: 'sec1', type: 'section', props: { anchorId: 'pricing' }, children: [
        { id: 'h1', type: 'heading', props: { level: 'h1', text: 'Straight talk about teeth' } },
        { id: 'img1', type: 'image', props: { src: '/team.jpg', alt: 'Our team say "hello"' } },
        { id: 'img2', type: 'image', props: { src: 'javascript:alert(1)', alt: 'bad' } },
      ]},
      { id: 'form1', type: 'form', props: { name: 'Book an appointment', successMessage: 'We will ring you back.' }, children: [
        { id: 'i1', type: 'input', props: { label: 'Full name', inputType: 'text', required: true } },
        { id: 'i2', type: 'input', props: { label: 'Email', inputType: 'email', required: true } },
        { id: 't1', type: 'textarea', props: { label: 'What do you need?' } },
        { id: 's1', type: 'select', props: { label: 'Which practice', options: ['Caerphilly', 'Bargoed'], required: true } },
        { id: 'c1', type: 'checkbox', props: { label: 'Which days suit you', options: ['Monday', 'Tuesday'] } },
        { id: 'c2', type: 'checkbox', props: { text: 'Send me reminders' } },
        { id: 'r1', type: 'radio', props: { label: 'Preferred contact', options: ['Phone', 'Email'] } },
        { id: 'b1', type: 'button', props: { text: 'Request a call' } },
      ]},
      { id: 'img3', type: 'image', props: { src: '/surgery.jpg', alt: 'Reception', width: 640, height: 360 } },
    ],
  },
  {
    page_name: 'Contact', slug: 'contact', is_homepage: false,
    page_settings: {}, elements: [{ id: 'h2', type: 'heading', props: { level: 'h2', text: 'Contact' } }],
  },
  {
    page_name: 'Staff only', slug: 'staff', is_homepage: false,
    page_settings: { no_index: true }, elements: [],
  },
];

const ORIGIN = 'https://caerphilly-dental.wales';
const SITE_ID = '11111111-2222-3333-4444-555555555555';
const out = compilePages(PAGES, 'Caerphilly Dental', ORIGIN, SITE_ID, 'https://ref.supabase.co');

const home = out.pageFiles.find(p => p.filename === 'index.html').html;
const sitemap = out.extraFiles.find(f => f.path === 'sitemap.xml').content;
const robots = out.extraFiles.find(f => f.path === 'robots.txt').content;
const notFound = out.extraFiles.find(f => f.path === '404.html');

let pass = 0, fail = 0;
const check = (name, cond, detail) => {
  if (cond) { pass++; console.log('PASS '.padEnd(6) + name); }
  else { fail++; console.log('FAIL '.padEnd(6) + name + (detail ? `\n         ${detail}` : '')); }
};

console.log('── SEO head ──');
check('canonical points at the real address', home.includes(`<link rel="canonical" href="${ORIGIN}/">`));
check('og:title present', home.includes('<meta property="og:title" content="Caerphilly Dental">'));
check('og:image made absolute', home.includes(`<meta property="og:image" content="${ORIGIN}/social.jpg">`));
check('twitter card is large image', home.includes('name="twitter:card" content="summary_large_image"'));
check('lang honoured', home.includes('<html lang="en-GB">'));
check('indexable by default', home.includes('content="index, follow"'));

console.log('\n── sitemap / robots / 404 ──');
check('sitemap has correct namespace', sitemap.includes('http://www.sitemaps.org/schemas/sitemap/0.9'));
check('sitemap lists homepage at root', sitemap.includes(`<loc>${ORIGIN}/</loc>`));
check('sitemap lists contact page', sitemap.includes(`<loc>${ORIGIN}/contact.html</loc>`));
check('sitemap EXCLUDES noindex page', !sitemap.includes('staff.html'), 'staff.html leaked into sitemap');
check('robots disallows the noindex page', robots.includes('Disallow: /staff.html'));
check('robots points at the sitemap', robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`));
check('404 page emitted', !!notFound && notFound.content.includes("That page isn't here"));

console.log('\n── the anchor bug ──');
const slugs = new Set(['contact', 'staff']);
check('#pricing stays an in-page anchor', resolveHref('#pricing', slugs) === '#pricing',
  `got ${resolveHref('#pricing', slugs)}`);
check('#contact becomes a page link', resolveHref('#contact', slugs) === 'contact.html',
  `got ${resolveHref('#contact', slugs)}`);
check('rendered nav keeps #pricing', home.includes('href="#pricing"'));
check('rendered nav routes #contact', home.includes('href="contact.html"'));
check('anchor target id survives', home.includes('id="pricing"'));

console.log('\n── escaping / URL safety ──');
check('quote in alt text is escaped', home.includes('alt="Our team say &quot;hello&quot;"'),
  'alt attribute would have broken the tag');
check('javascript: src is stripped', !home.includes('javascript:alert'));
check('escapeAttr handles single quotes', escapeAttr("it's") === 'it&#39;s');
check('safeURL blocks javascript:', safeURL('javascript:alert(1)') === '');
check('safeURL allows mailto:', safeURL('mailto:a@b.com') === 'mailto:a@b.com');
check('safeURL allows data: images only when asked', safeURL('data:image/png;base64,AAA', true) !== '' && safeURL('data:text/html,x', true) === '');
check('external link gets noopener', home.includes('rel="noopener noreferrer"'));

console.log('\n── forms ──');
check('form marked for the handler', home.includes('data-quooro-form'));
check('form carries its name', home.includes('data-form-name="Book an appointment"'));
check('success message carried through', home.includes('data-success="We will ring you back."'));
check('honeypot present', home.includes('name="company_website"'));
check('status region present', home.includes('quooro-form-status'));
check('inputs get names', home.includes('name="full_name"') && home.includes('name="email"'));
check('inputs get aria-labels', home.includes('aria-label="Full name"'));
check('required carried through', home.includes('required'));
check('textarea named', home.includes('name="what_do_you_need"'));

console.log('\n── runtime script ──');
check('script posts to site-form-submit', out.sharedJS.includes('/functions/v1/site-form-submit'));
check('script carries the site id', out.sharedJS.includes(SITE_ID));
check('script guards in-page anchors by id', out.sharedJS.includes('getElementById'));
check('honeypot excluded from payload', out.sharedJS.includes("key === 'company_website'"));
check('css hides the honeypot', out.sharedCSS.includes('.quooro-hp'));
check('reduced motion respected', out.sharedCSS.includes('prefers-reduced-motion'));

console.log('\n── choices (select / checkbox / radio) ──');
check('select renders as a select', /<select class="el-s1"[^>]*name="which_practice"/.test(home),
  'select fell back to a div and its answer would be lost');
check('select carries its options', home.includes('<option value="Caerphilly">Caerphilly</option>'));
check('select has a placeholder option', home.includes('<option value="">Choose…</option>'));
check('select honours required', /<select[^>]*required/.test(home));
check('checkbox group renders a fieldset', home.includes('quooro-choice-group') && home.includes('<legend>Which days suit you</legend>'));
check('checkbox group options are real inputs',
  /<input type="checkbox" name="which_days_suit_you" value="Monday"/.test(home));
check('group controls carry the group label',
  /data-field-label="Which days suit you"/.test(home),
  'without this the inbox would say which_days_suit_you');
check('lone checkbox renders with its own text',
  /<input type="checkbox" name="send_me_reminders" value="Send me reminders"/.test(home));
check('radio group renders radios', /<input type="radio" name="preferred_contact" value="Phone"/.test(home));
check('choice CSS shipped', out.sharedCSS.includes('.quooro-choice'));

console.log('\n── images ──');
check('intrinsic width emitted', home.includes('width="640"'), 'no width means the page jumps as images load');
check('intrinsic height emitted', home.includes('height="360"'));
check('no dimensions invented when unknown', !/team\.jpg" alt="[^"]*" loading="lazy" decoding="async" width=/.test(home));

console.log('\n── minification ──');
check('css has no newlines', !out.sharedCSS.includes('\n'));
check('css banner comment removed', !out.sharedCSS.includes('Auto-generated'));
check('css still valid-ish', out.sharedCSS.includes('.quooro-hp{') && out.sharedCSS.includes('box-sizing:border-box'));
check('js comments stripped', !out.sharedJS.includes('// Smooth scrolling'));
check('js still functional', out.sharedJS.includes('site-form-submit') && out.sharedJS.includes('addEventListener'));
// the reason minifyCSS walks the string instead of running regexes
check('quotes protect their contents',
  minifyCSS('a{content:"x  /* not a comment */  y";color:red}') ===
  'a{content:"x  /* not a comment */  y";color:red}',
  minifyCSS('a{content:"x  /* not a comment */  y";color:red}'));
check('media queries survive', minifyCSS('@media (max-width: 480px) {\n  .a {\n  color: red;\n  }\n}')
  === '@media (max-width:480px){.a{color:red}}',
  minifyCSS('@media (max-width: 480px) {\n  .a {\n  color: red;\n  }\n}'));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) {
  console.log('\n───── homepage HTML ─────\n' + home);
  process.exit(1);
}
