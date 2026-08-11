/**
 * Pre-flight check. Start the site first (npm run build && npm start), then:
 *
 *   npm run audit
 *
 * It runs axe on desktop and mobile, then checks the things this site is not
 * allowed to get wrong: one h1, no skipped heading levels, the phone number
 * formatted identically everywhere, structured data that does not invent
 * facts, no banned marketing phrases, the before/after handle working from the
 * keyboard, both form paths (with and without JavaScript), and the page still
 * being readable with JavaScript switched off.
 */

import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const BASE = process.env.AUDIT_URL || 'http://localhost:3000'
// Uses whatever Chromium Playwright has installed; set CHROME_PATH to override.
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
)
let failures = 0
const log = (ok, msg) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`) }

for (const [name, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(2000)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(400)

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze()

  log(results.violations.length === 0, `axe ${name}: ${results.violations.length} violations`)
  for (const v of results.violations) {
    console.log(`   [${v.impact}] ${v.id} — ${v.help}`)
    for (const n of v.nodes.slice(0, 4)) console.log(`      ${n.target.join(' ')} :: ${(n.failureSummary||'').split('\n').slice(1,3).join(' | ')}`)
  }
  await ctx.close()
}

// ---- structure -----------------------------------------------------------
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(BASE + '/', { waitUntil: 'networkidle' })

const h1s = await page.$$eval('h1', (n) => n.map((e) => e.textContent.trim()))
log(h1s.length === 1, `exactly one h1 (found ${h1s.length}): ${JSON.stringify(h1s)}`)

const order = await page.$$eval('h1,h2,h3,h4', (ns) => ns.map((e) => Number(e.tagName[1])))
let skip = null
for (let i = 1; i < order.length; i++) if (order[i] - order[i - 1] > 1) skip = `${order[i-1]}->${order[i]}`
log(skip === null, `no heading level skipped${skip ? ` (${skip})` : ''}`)

const tel = await page.$$eval('a[href^="tel:"]', (n) => n.map((e) => e.getAttribute('href')))
log(tel.length > 0 && tel.every((t) => t === 'tel:+447951320566'), `all ${tel.length} tel: links are +447951320566`)

const phoneText = await page.$$eval('a[href^="tel:"]', (n) => n.map((e) => e.textContent.replace(/\s+/g, ' ').trim()))
log(phoneText.every((t) => t.includes('07951 320566')), `phone rendered identically: ${JSON.stringify([...new Set(phoneText)])}`)

const ld = await page.$eval('script[type="application/ld+json"]', (e) => JSON.parse(e.textContent))
log(ld['@type'] === 'HousePainter', `JSON-LD @type HousePainter`)
log(!('aggregateRating' in ld) && !('address' in ld) && !('priceRange' in ld) && !('openingHours' in ld),
  `JSON-LD omits guessed fields (${Object.keys(ld).join(', ')})`)

const title = await page.title()
log(title === 'Painter & Decorator in Wrexham | F.A.S Painter and Decorator', `title: ${title}`)
const desc = await page.$eval('meta[name="description"]', (e) => e.content)
log(desc.length <= 155 && /Coedpoeth/.test(desc), `description ${desc.length} chars, mentions Coedpoeth`)

const tapes = await page.$$eval('.tape', (n) => n.length)
log(tapes <= 4, `masking-tape labels on the page: ${tapes} (max 4)`)

// banned words
const body = (await page.$eval('body', (e) => e.innerText)).toLowerCase()
const banned = ['transform your space','elevate your home','we pride ourselves','bespoke solutions','your vision','unparalleled','attention to detail is second to none',"in today's world",'peace of mind guaranteed',"let's bring your vision",'lorem ipsum','years of experience','fully insured','city & guilds','family run','5 star','drywall','sidewalk','molding','trim molding']
const hits = banned.filter((b) => body.includes(b))
log(hits.length === 0, `no banned phrases${hits.length ? `: ${hits.join(', ')}` : ''}`)
const emojiInHeadings = await page.$$eval('h1,h2,h3,h4', (ns) => ns.filter((e) => /\p{Extended_Pictographic}/u.test(e.textContent)).length)
log(emojiInHeadings === 0, `no emoji in headings`)

// ---- before/after keyboard ----------------------------------------------
const handle = await page.$('[role="slider"]')
log(handle !== null, 'before/after slider present')
if (handle) {
  await handle.focus()
  const before = await handle.getAttribute('aria-valuenow')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(120)
  const after = await handle.getAttribute('aria-valuenow')
  log(before !== after, `arrow keys move the divider (${before} -> ${after})`)
  await page.keyboard.press('Home')
  await page.waitForTimeout(120)
  log((await handle.getAttribute('aria-valuenow')) === '0', 'Home jumps to 0')
}

// ---- reviews dialog ------------------------------------------------------
const reviewsBtn = page.locator('button', { hasText: 'Read the reviews' }).first()
log((await reviewsBtn.count()) > 0, 'reviews trigger present')
await reviewsBtn.scrollIntoViewIfNeeded()
await reviewsBtn.click()
await page.waitForTimeout(400)
log(await page.$eval('dialog.sheet-dialog', (d) => d.open), 'reviews dialog opens')

// axe only scans what is visible, so the dialog has to be open for this to mean anything
const dlgAxe = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  .analyze()
log(dlgAxe.violations.length === 0, `axe with reviews dialog open: ${dlgAxe.violations.length} violations`)
for (const v of dlgAxe.violations) console.log(`   [${v.impact}] ${v.id} — ${v.help}`)

const quoted = await page.$$eval('dialog.sheet-dialog blockquote', (n) => n.length)
log(quoted === 6, `dialog quotes all 6 reviews (found ${quoted})`)

const focusInside = await page.evaluate(() =>
  document.querySelector('dialog.sheet-dialog')?.contains(document.activeElement),
)
log(focusInside === true, 'focus is trapped inside the open dialog')

await page.keyboard.press('Escape')
await page.waitForTimeout(300)
log(!(await page.$eval('dialog.sheet-dialog', (d) => d.open)), 'Escape closes the reviews dialog')

// no invented social proof anywhere: no overall score, no third-party review markup
const proof = await page.$eval('body', (e) => e.innerText)
const scoreClaim = /\b(5\.0|4\.9|rated\s+\d|\d+\s*\+?\s*(happy\s+)?(customers|reviews)\b)/i.test(proof)
log(!scoreClaim, 'no aggregate rating or review-count claim in the copy')
log(!('aggregateRating' in ld) && !('review' in ld) && !('reviews' in ld),
  'no third-party review markup in JSON-LD')

// ---- form: JS path -------------------------------------------------------
await page.fill('#enquiry-name', 'Test Person')
await page.fill('#enquiry-phone', '01978 000000')
await page.fill('#enquiry-work', 'Hall, stairs and landing')
await page.fill('#enquiry-timescale', 'Next month')
await page.waitForTimeout(3200) // clear the time trap
await page.click('button[type="submit"]')
await page.waitForTimeout(1200)
const success = await page.$$eval('body', (b) => b[0].innerText.includes('Got it.'))
log(success, 'form success state replaces the form')
const successPhone = await page.$$eval('a[href^="tel:"]', (n) => n.length)
log(successPhone > 0, 'phone number still present after success')

// ---- form: no-JS path ----------------------------------------------------
const res = await ctx.request.post(BASE + '/api/enquiry', {
  form: { name: 'No JS', phone: '01978 111111', work: 'Two bedrooms', timescale: 'Soon', company: '', t: '' },
  maxRedirects: 0,
})
log(res.status() === 303 && (res.headers()['location'] || '').includes('/enquiry/sent'),
  `no-JS POST redirects 303 to /enquiry/sent (got ${res.status()} ${res.headers()['location']})`)

const spam = await ctx.request.post(BASE + '/api/enquiry', {
  form: { name: 'Bot', phone: '1', work: 'x', timescale: 'x', company: 'Acme SEO', t: '' },
  maxRedirects: 0,
})
log(spam.status() === 303, `honeypot submission answered like a real one (${spam.status()})`)

const fast = await ctx.request.post(BASE + '/api/enquiry', {
  form: { name: 'Bot', phone: '1', work: 'x', timescale: 'x', company: '', t: String(Date.now()) },
  maxRedirects: 0,
})
log(fast.status() === 303, `time-trap submission answered like a real one (${fast.status()})`)

const missing = await ctx.request.post(BASE + '/api/enquiry', {
  form: { name: '', phone: '', work: '', timescale: '', company: '', t: '' },
  maxRedirects: 0,
})
log(missing.status() === 303 && (missing.headers()['location'] || '').includes('/enquiry/problem'),
  `empty submission goes to /enquiry/problem (${missing.status()})`)

// ---- robots / sitemap ----------------------------------------------------
for (const p of ['/robots.txt', '/sitemap.xml', '/opengraph-image', '/icon', '/enquiry/sent', '/enquiry/problem']) {
  const r = await ctx.request.get(BASE + p)
  log(r.ok(), `${p} -> ${r.status()}`)
}

// ---- no-JS render --------------------------------------------------------
const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } })
const njPage = await noJs.newPage()
await njPage.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
const covered = await njPage.$$eval('[data-roller]', (ns) => ns.filter((n) => getComputedStyle(n).display !== 'none').length)
log(covered === 0, `with JS off, ${covered} roller covers still visible (want 0)`)
const njTel = await njPage.$$eval('a[href^="tel:"]', (n) => n.length)
log(njTel > 0, `with JS off, ${njTel} tel: links present`)
const njText = await njPage.$eval('body', (e) => e.innerText)
log(njText.includes('Paint is the last thing that happens.'), 'with JS off, section copy is readable')

await browser.close()
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
