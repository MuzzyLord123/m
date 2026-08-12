/**
 * Pre-flight check. Start the site first (npm run build && npm start), then:
 *
 *   npm run audit
 *
 * It runs axe over every page on desktop and mobile, then checks the things
 * this site is not allowed to get wrong: one h1 per page, no skipped heading
 * levels, the phone number formatted identically everywhere, structured data
 * that does not invent facts, no banned marketing phrases, a mobile menu that
 * works from the keyboard, the before/after handle, both form paths (with and
 * without JavaScript), and every page still being readable with JavaScript
 * switched off.
 */

import { chromium } from 'playwright'
import AxeBuilder from '@axe-core/playwright'

const BASE = process.env.AUDIT_URL || 'http://localhost:3000'
// Uses whatever Chromium Playwright has installed; set CHROME_PATH to override.
const browser = await chromium.launch(
  process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {},
)

let failures = 0
const log = (ok, msg) => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`)
}

const PAGES = ['/', '/what-i-do', '/how-i-work', '/recent-work', '/contact']
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
const BANNED = [
  'transform your space', 'elevate your home', 'we pride ourselves',
  'bespoke solutions', 'your vision', 'unparalleled',
  'attention to detail is second to none', "in today's world",
  'peace of mind guaranteed', "let's bring your vision", 'lorem ipsum',
  'years of experience', 'fully insured', 'city & guilds', 'family run',
  'drywall', 'sidewalk', 'molding',
]

const settle = async (page) => {
  const h = await page.evaluate(() => document.body.scrollHeight)
  for (let y = 0; y < h; y += 600) {
    await page.evaluate((y) => window.scrollTo(0, y), y)
    await page.waitForTimeout(90)
  }
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForTimeout(250)
}

// ---- every page, both viewports ------------------------------------------
for (const [name, viewport, isMobile] of [
  ['desktop', { width: 1440, height: 900 }, false],
  ['mobile', { width: 390, height: 844 }, true],
]) {
  const ctx = await browser.newContext({ viewport, isMobile, hasTouch: isMobile })
  const page = await ctx.newPage()

  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' })
    await settle(page)

    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
    log(results.violations.length === 0, `axe ${name} ${path}: ${results.violations.length} violations`)
    for (const v of results.violations) {
      console.log(`   [${v.impact}] ${v.id} — ${v.help}`)
      for (const n of v.nodes.slice(0, 3)) console.log(`      ${n.target.join(' ')}`)
    }

    const h1s = await page.$$eval('h1', (n) => n.map((e) => e.textContent.trim()))
    log(h1s.length === 1, `${name} ${path}: exactly one h1 (${h1s.length}) ${JSON.stringify(h1s)}`)

    const order = await page.$$eval('h1,h2,h3,h4', (ns) => ns.map((e) => Number(e.tagName[1])))
    let skip = null
    for (let i = 1; i < order.length; i++) if (order[i] - order[i - 1] > 1) skip = `${order[i - 1]}->${order[i]}`
    log(skip === null, `${name} ${path}: no heading level skipped${skip ? ` (${skip})` : ''}`)

    if (name === 'desktop') {
      const tapes = await page.$$eval('.tape', (n) => n.length)
      log(tapes <= 4, `${path}: masking-tape labels ${tapes} (max 4)`)

      const body = (await page.$eval('body', (e) => e.innerText)).toLowerCase()
      const hits = BANNED.filter((b) => body.includes(b))
      log(hits.length === 0, `${path}: no banned phrases${hits.length ? `: ${hits.join(', ')}` : ''}`)

      const tel = await page.$$eval('a[href^="tel:"]', (n) => n.map((e) => e.getAttribute('href')))
      log(tel.length > 0 && tel.every((t) => t === 'tel:+447951320566'),
        `${path}: ${tel.length} tel: links, all +447951320566`)
      const shown = await page.$$eval('a[href^="tel:"]', (n) =>
        n.map((e) => e.textContent.replace(/\s+/g, ' ').trim()))
      log(shown.every((t) => t.includes('07951 320566')), `${path}: phone rendered identically`)

      const canonical = await page.$eval('link[rel="canonical"]', (e) => new URL(e.href).pathname)
      log(canonical === path, `${path}: canonical is ${canonical}`)

      const title = await page.title()
      log(title.length > 0 && title.length <= 70, `${path}: title ${title.length} chars — ${title}`)
      const desc = await page.$eval('meta[name="description"]', (e) => e.content)
      log(desc.length <= 160, `${path}: description ${desc.length} chars`)
    }
  }
  await ctx.close()
}

// ---- navigation ----------------------------------------------------------
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto(BASE + '/', { waitUntil: 'networkidle' })

const navLinks = await page.$$eval('nav[aria-label="Main"] ul a', (n) =>
  n.map((e) => new URL(e.href).pathname))
log(navLinks.length === 5, `desktop menu has 5 pages (${navLinks.length}): ${navLinks.join(' ')}`)
log(PAGES.every((p) => navLinks.includes(p)), 'desktop menu covers every page')

for (const path of PAGES) {
  const res = await ctx.request.get(BASE + path)
  log(res.ok(), `${path} -> ${res.status()}`)
}

const sitemap = await (await ctx.request.get(BASE + '/sitemap.xml')).text()
log(PAGES.every((p) => sitemap.includes(p === '/' ? '<loc>' : p)), 'sitemap lists all 5 pages')

const ld = await page.$eval('script[type="application/ld+json"]', (e) => JSON.parse(e.textContent))
log(ld['@type'] === 'HousePainter', 'JSON-LD @type HousePainter')
log(!('aggregateRating' in ld) && !('address' in ld) && !('priceRange' in ld) &&
  !('openingHours' in ld) && !('review' in ld),
  `JSON-LD omits guessed fields (${Object.keys(ld).join(', ')})`)

// ---- mobile menu ---------------------------------------------------------
const mctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
const mp = await mctx.newPage()
await mp.goto(BASE + '/', { waitUntil: 'networkidle' })

const burger = mp.locator('header button[aria-expanded]').first()
log((await burger.count()) > 0, 'burger present on handheld')
log((await burger.getAttribute('aria-expanded')) === 'false', 'burger reports collapsed when shut')

// the phone must be reachable before the menu is ever opened
const barTel = await mp.$$eval('nav[aria-label="Call"] a[href^="tel:"]', (n) => n.length)
log(barTel === 1, 'call bar is present without opening the menu')

await burger.click()
await mp.waitForTimeout(600)
log(await mp.$eval('dialog.menu-dialog', (d) => d.open), 'menu opens')
log((await burger.getAttribute('aria-expanded')) === 'true', 'burger reports expanded when open')

const menuAxe = await new AxeBuilder({ page: mp }).withTags(AXE_TAGS).analyze()
log(menuAxe.violations.length === 0, `axe with menu open: ${menuAxe.violations.length} violations`)
for (const v of menuAxe.violations) console.log(`   [${v.impact}] ${v.id} — ${v.help}`)

const menuLinks = await mp.$$eval('dialog.menu-dialog nav a', (n) => n.map((e) => new URL(e.href).pathname))
log(menuLinks.length === 5, `mobile menu has 5 pages (${menuLinks.length}): ${menuLinks.join(' ')}`)
log(PAGES.every((p) => menuLinks.includes(p)), 'mobile menu covers every page')
log(await mp.evaluate(() => document.querySelector('dialog.menu-dialog')?.contains(document.activeElement)),
  'focus is trapped inside the open menu')
const menuTel = await mp.$$eval('dialog.menu-dialog a[href^="tel:"]', (n) => n.length)
log(menuTel >= 1, 'phone number is in the menu too')

await mp.keyboard.press('Escape')
await mp.waitForTimeout(400)
log(!(await mp.$eval('dialog.menu-dialog', (d) => d.open)), 'Escape closes the menu')

await burger.click()
await mp.waitForTimeout(500)
await mp.locator('dialog.menu-dialog nav a[href$="/contact"]').first().click()
await mp.waitForTimeout(1200)
log(mp.url().endsWith('/contact'), `menu link navigates (${mp.url()})`)
log(!(await mp.$eval('dialog.menu-dialog', (d) => d.open)), 'menu closes itself after navigating')
await mctx.close()

// ---- reviews dialog, on /recent-work -------------------------------------
await page.goto(BASE + '/recent-work', { waitUntil: 'networkidle' })
const reviewsBtn = page.locator('button', { hasText: 'Read the reviews' }).first()
log((await reviewsBtn.count()) > 0, 'reviews trigger present')
await reviewsBtn.scrollIntoViewIfNeeded()
await reviewsBtn.click()
await page.waitForTimeout(400)
log(await page.$eval('dialog.sheet-dialog', (d) => d.open), 'reviews dialog opens')

// axe only scans what is visible, so the dialog has to be open for this to mean anything
const dlgAxe = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()
log(dlgAxe.violations.length === 0, `axe with reviews dialog open: ${dlgAxe.violations.length} violations`)
for (const v of dlgAxe.violations) console.log(`   [${v.impact}] ${v.id} — ${v.help}`)

const quoted = await page.$$eval('dialog.sheet-dialog blockquote', (n) => n.length)
log(quoted === 6, `dialog quotes all 6 reviews (found ${quoted})`)
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
log(!(await page.$eval('dialog.sheet-dialog', (d) => d.open)), 'Escape closes the reviews dialog')

const proof = await page.$eval('body', (e) => e.innerText)
log(!/\b(5\.0|4\.9|rated\s+\d|\d+\s*\+?\s*(happy\s+)?(customers|reviews)\b)/i.test(proof),
  'no aggregate rating or review-count claim in the copy')

// ---- before/after handle -------------------------------------------------
const handle = await page.$('[role="slider"]')
log(handle !== null, 'before/after slider present')
if (handle) {
  await handle.focus()
  const before = await handle.getAttribute('aria-valuenow')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(120)
  log(before !== (await handle.getAttribute('aria-valuenow')), 'arrow keys move the divider')
  await page.keyboard.press('Home')
  await page.waitForTimeout(120)
  log((await handle.getAttribute('aria-valuenow')) === '0', 'Home jumps to 0')
}

// ---- form: JavaScript path ----------------------------------------------
await page.goto(BASE + '/contact', { waitUntil: 'networkidle' })
await page.fill('#enquiry-name', 'Test Person')
await page.fill('#enquiry-phone', '01978 000000')
await page.fill('#enquiry-work', 'Hall, stairs and landing')
await page.fill('#enquiry-timescale', 'Next month')
await page.waitForTimeout(3200) // clear the time trap
await page.click('button[type="submit"]')
await page.waitForTimeout(1200)
log(await page.$$eval('body', (b) => b[0].innerText.includes('Got it.')), 'form success state replaces the form')
log((await page.$$eval('a[href^="tel:"]', (n) => n.length)) > 0, 'phone number still present after success')

// ---- form: no-JavaScript path -------------------------------------------
const post = (form) => ctx.request.post(BASE + '/api/enquiry', { form, maxRedirects: 0 })
const base = { name: 'No JS', phone: '01978 111111', work: 'Two bedrooms', timescale: 'Soon', company: '', t: '' }

let r = await post(base)
log(r.status() === 303 && (r.headers()['location'] || '').includes('/enquiry/sent'),
  `no-JS POST redirects 303 to /enquiry/sent (${r.status()})`)
r = await post({ ...base, company: 'Acme SEO' })
log(r.status() === 303, `honeypot submission answered like a real one (${r.status()})`)
r = await post({ ...base, t: String(Date.now()) })
log(r.status() === 303, `time-trap submission answered like a real one (${r.status()})`)
r = await post({ ...base, name: '', phone: '' })
log(r.status() === 303 && (r.headers()['location'] || '').includes('/enquiry/problem'),
  `empty submission goes to /enquiry/problem (${r.status()})`)

for (const p of ['/robots.txt', '/sitemap.xml', '/opengraph-image', '/icon', '/enquiry/sent', '/enquiry/problem']) {
  const res = await ctx.request.get(BASE + p)
  log(res.ok(), `${p} -> ${res.status()}`)
}

// ---- with JavaScript switched off ---------------------------------------
const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
const nj = await noJs.newPage()
for (const path of PAGES) {
  await nj.goto(BASE + path, { waitUntil: 'domcontentloaded' })
  const covered = await nj.$$eval('[data-roller]', (ns) =>
    ns.filter((n) => getComputedStyle(n).display !== 'none').length)
  log(covered === 0, `JS off ${path}: ${covered} roller covers still visible (want 0)`)
  const tel = await nj.$$eval('a[href^="tel:"]', (n) => n.length)
  log(tel > 0, `JS off ${path}: ${tel} tel: links present`)
  const links = await nj.$$eval('a[href^="/"]', (n) => n.length)
  log(links > 0, `JS off ${path}: ${links} internal links still navigable`)
}

await browser.close()
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
