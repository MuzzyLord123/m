/**
 * Compiles a site with the real publish pipeline, serves the output, and
 * drives it in a browser: does the form actually submit, does the honeypot
 * work, do errors surface, do anchors scroll?
 *
 * The element rendering now comes from the shared compiler in
 * supabase/functions/_shared/site, so this exercises exactly the code the
 * editor's own export runs.
 */
import { readFileSync } from 'node:fs';
import http from 'node:http';
import { transformSync } from '/home/user/m/node_modules/esbuild/lib/main.js';
import { chromium } from '/home/user/m/node_modules/playwright-core/index.mjs';

const SHARED = '/home/user/m/supabase/functions/_shared/site';
const strip = f => readFileSync(`${SHARED}/${f}`, 'utf8')
  .replace(/^import .*$/gm, '').replace(/^export /gm, '');
const exporterJs = transformSync(
  strip('cssCompiler.ts') + '\n' + strip('jsGenerator.ts') + '\n' + strip('htmlExporter.ts') +
  '\nmodule.exports = { generateBodyHTML, buildCSS, generateJS };',
  { loader: 'ts', format: 'cjs', target: 'es2022' }).code;
const em = { exports: {} };
new Function('module', 'exports', 'require', exporterJs)(em, em.exports, () => ({}));
const { generateBodyHTML, buildCSS, generateJS } = em.exports;

let deploySrc = readFileSync('/home/user/m/supabase/functions/deploy-site/index.ts', 'utf8')
  .replace(/^import .*$/gm, '');
const a = deploySrc.indexOf('serve(async (req)'), b = deploySrc.indexOf('// ─── Types ─');
deploySrc = deploySrc.slice(0, a) + deploySrc.slice(b);
const deployJs = transformSync(deploySrc, { loader: 'ts', format: 'cjs', target: 'es2022' }).code;
const m = { exports: {} };
new Function('module', 'exports', 'require', 'crypto', 'generateBodyHTML', 'buildCSS', 'generateJS',
  deployJs + '\nmodule.exports={compilePages};')
  (m, m.exports, () => ({}), globalThis.crypto, generateBodyHTML, buildCSS, generateJS);

const SITE_ID = '11111111-2222-3333-4444-555555555555';
const SUPA = 'https://ref.supabase.co';
const PAGES = [{
  page_name: 'Home', slug: '', is_homepage: true,
  seo_title: 'Rhondda Bakery', seo_description: 'Bread, daily.',
  page_settings: {},
  elements: [
    { id: 'l1', type: 'link', props: { text: 'Jump to order', href: '#order' } },
    { id: 'spacer', type: 'section', children: [{ id: 'tall', type: 'text', props: { text: 'x' }, styles: { desktop: { height: '1500px', display: 'block' } } }] },
    { id: 'sec', type: 'section', props: { anchorId: 'order' }, children: [
      { id: 'h', type: 'heading', props: { level: 'h2', text: 'Place an order' } },
      { id: 'form1', type: 'form', props: { name: 'Order form', successMessage: 'Order received — we will call you.' }, children: [
        { id: 'i1', type: 'input', props: { label: 'Full name', inputType: 'text', required: true } },
        { id: 'i2', type: 'input', props: { label: 'Email', inputType: 'email', required: true } },
        { id: 't1', type: 'textarea', props: { label: 'Your order' } },
        { id: 's1', type: 'select', props: { label: 'Collection day', options: ['Friday', 'Saturday'] } },
        { id: 'c1', type: 'checkbox', props: { label: 'Extras', options: ['Bara brith', 'Welsh cakes'] } },
        { id: 'r1', type: 'radio', props: { label: 'Loaf size', options: ['Small', 'Large'] } },
        { id: 'c2', type: 'checkbox', props: { text: 'Text me when ready' } },
        { id: 'b1', type: 'button', props: { text: 'Send order' } },
      ]},
    ]},
  ],
}];

const out = m.exports.compilePages(PAGES, 'Rhondda Bakery', 'http://127.0.0.1:8931', SITE_ID, SUPA);
const files = {
  '/': out.pageFiles.find(p => p.filename === 'index.html').html,
  '/index.html': out.pageFiles.find(p => p.filename === 'index.html').html,
  '/styles.css': out.sharedCSS,
  '/script.js': out.sharedJS,
};
const ctype = p => p.endsWith('.css') ? 'text/css' : p.endsWith('.js') ? 'application/javascript' : 'text/html; charset=utf-8';
const server = http.createServer((req, res) => {
  const path = req.url.split('?')[0];
  const body = files[path];
  if (body === undefined) { res.writeHead(404); res.end('nope'); return; }
  res.writeHead(200, { 'Content-Type': ctype(path) });
  res.end(body);
});
await new Promise(r => server.listen(8931, '127.0.0.1', r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
let pass = 0, fail = 0;
const check = (n, c, d) => { if (c) { pass++; console.log('PASS  ' + n); } else { fail++; console.log('FAIL  ' + n + (d ? `\n        ${d}` : '')); } };

// ── 1. happy path ──
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  let captured = null;
  await ctx.route(`${SUPA}/functions/v1/site-form-submit`, async route => {
    captured = JSON.parse(route.request().postData() || '{}');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
  });
  await page.goto('http://127.0.0.1:8931/', { waitUntil: 'networkidle' });

  await page.fill('input[name="full_name"]', 'Sioned Price');
  await page.fill('input[name="email"]', 'sioned@bakery.wales');
  await page.fill('textarea[name="your_order"]', 'Six bara brith, Friday.');
  await page.selectOption('select[name="collection_day"]', 'Saturday');
  // tick both extras, to prove a multi-answer group survives the trip
  await page.check('input[name="extras"][value="Bara brith"]');
  await page.check('input[name="extras"][value="Welsh cakes"]');
  await page.check('input[name="loaf_size"][value="Large"]');
  await page.check('input[name="text_me_when_ready"]');
  await page.click('button');
  await page.waitForTimeout(700);

  console.log('── submitting a real form ──');
  check('the browser sent a submission', !!captured);
  check('site id travels with it', captured?.siteId === SITE_ID);
  check('form name travels with it', captured?.formName === 'Order form');
  check('fields keyed by their visible labels',
    captured?.fields?.['Full name'] === 'Sioned Price' && captured?.fields?.['Email'] === 'sioned@bakery.wales',
    JSON.stringify(captured?.fields));
  check('textarea captured', captured?.fields?.['Your order'] === 'Six bara brith, Friday.');
  check('honeypot sent empty', captured?.company_website === '');
  check('honeypot NOT in the field payload', !('company_website' in (captured?.fields || {})));
  check('dropdown answer captured', captured?.fields?.['Collection day'] === 'Saturday',
    JSON.stringify(captured?.fields?.['Collection day']));
  check('multi-tick group arrives as one labelled answer',
    captured?.fields?.['Extras'] === 'Bara brith, Welsh cakes',
    JSON.stringify(captured?.fields?.['Extras']));
  check('radio answer captured', captured?.fields?.['Loaf size'] === 'Large');
  check('lone tick box captured under its own wording',
    captured?.fields?.['Text me when ready'] === 'Text me when ready',
    JSON.stringify(captured?.fields));
  check('no raw field slugs leaked as labels',
    !Object.keys(captured?.fields || {}).some(k => k.includes('_')),
    Object.keys(captured?.fields || {}).join(' | '));

  const status = await page.textContent('.quooro-form-status');
  check('success message shown to the visitor', /Order received/.test(status || ''), `got: ${status}`);
  const nameVal = await page.inputValue('input[name="full_name"]');
  check('form cleared after success', nameVal === '');
  check('no page errors', errs.length === 0, errs[0]);
  await ctx.close();
}

// ── 2. required-field validation stops an empty submit ──
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  let called = false;
  await ctx.route(`${SUPA}/functions/v1/site-form-submit`, async route => {
    called = true; await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('http://127.0.0.1:8931/', { waitUntil: 'networkidle' });
  await page.click('button');
  await page.waitForTimeout(500);
  console.log('\n── validation ──');
  check('empty required form is not sent', !called);
  await ctx.close();
}

// ── 3. server error is surfaced, not swallowed ──
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await ctx.route(`${SUPA}/functions/v1/site-form-submit`, async route =>
    route.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: 'Too many submissions. Please try again shortly.' }) }));
  await page.goto('http://127.0.0.1:8931/', { waitUntil: 'networkidle' });
  await page.fill('input[name="full_name"]', 'Bot');
  await page.fill('input[name="email"]', 'b@b.com');
  await page.click('button');
  await page.waitForTimeout(700);
  const status = await page.textContent('.quooro-form-status');
  console.log('\n── failure is visible ──');
  check('rate-limit message reaches the visitor', /Too many submissions/.test(status || ''), `got: ${status}`);
  const disabled = await page.getAttribute('button', 'disabled');
  check('button re-enabled after failure', disabled === null);
  await ctx.close();
}

// ── 4. honeypot is invisible to a real visitor ──
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8931/', { waitUntil: 'networkidle' });
  console.log('\n── honeypot + anchors ──');
  const box = await page.locator('input[name="company_website"]').boundingBox();
  check('honeypot is off-screen', !box || box.x < -1000, JSON.stringify(box));
  const visible = await page.locator('input[name="company_website"]').isVisible();
  check('honeypot still submittable (not display:none)', visible === true);

  const before = await page.evaluate(() => window.scrollY);
  await page.click('a[href="#order"]');
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => window.scrollY);
  check('in-page anchor actually scrolls', after > before + 200, `before ${before}, after ${after}`);
}

await browser.close();
server.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
