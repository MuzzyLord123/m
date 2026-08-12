/**
 * Accessibility and pre-flight audit.
 *
 *   node scripts/audit.mjs [baseUrl]
 *
 * Runs axe-core over every page at a phone width and a desktop width, checks the things
 * the brief calls grounds for rejection, and exits non-zero if anything fails. The
 * accessibility target on this project is 100, not "no serious issues".
 *
 * Needs the site running (`npm run build && npm start`). Set CHROMIUM_PATH to use a
 * Chromium already on the machine instead of downloading one.
 */
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { chromium } from 'playwright'

const require = createRequire(import.meta.url)
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8')

const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '')

const PAGES = [
  '/',
  '/spraying',
  '/dustless-sanding',
  '/interior-decoration',
  '/exterior-decoration',
  '/wallpaper-hanging',
  '/reviews',
  '/about',
  '/contact',
  '/leave-a-review',
  '/contact/sent',
  '/contact/incomplete',
  '/contact/problem',
]

const VIEWPORTS = [
  ['phone', { width: 390, height: 844 }],
  ['desktop', { width: 1440, height: 1000 }],
]

const failures = []
const notes = []

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)

for (const [vpName, viewport] of VIEWPORTS) {
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()

  for (const path of PAGES) {
    const response = await page.goto(base + path, { waitUntil: 'networkidle' })

    if (!response || response.status() !== 200) {
      failures.push(`${path} returned ${response ? response.status() : 'no response'}`)
      continue
    }

    // Let the reveals finish, so nothing is audited mid-transition.
    await page.waitForTimeout(700)

    await page.addScriptTag({ content: axeSource })
    const results = await page.evaluate(async () => {
      // @ts-expect-error injected
      return await window.axe.run(document, {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
        },
      })
    })

    for (const violation of results.violations) {
      failures.push(
        `${vpName} ${path}: [${violation.impact}] ${violation.id} — ${violation.help} ` +
          `(${violation.nodes.length} node${violation.nodes.length === 1 ? '' : 's'})`,
      )
    }

    /* ---- Checks specific to this brief ------------------------------ */

    if (vpName === 'desktop') {
      const checks = await page.evaluate(() => {
        const titleText = document.title
        const html = document.documentElement.outerHTML
        return {
          title: titleText,
          h1Count: document.querySelectorAll('h1').length,
          // §10: no embedded third-party form, no hotlinked Google-hosted images.
          hasIframe: document.querySelectorAll('iframe').length,
          hasGoogleUserContent: /googleusercontent\.com/.test(html),
          hasAggregateRating: /aggregateRating/.test(html),
          // The number must be a real tel: link, identical everywhere.
          telHrefs: [...document.querySelectorAll('a[href^="tel:"]')].map((a) =>
            a.getAttribute('href'),
          ),
          // Images must carry alt text and explicit dimensions.
          badImages: [...document.querySelectorAll('img')].filter(
            (img) => !img.getAttribute('alt') || !img.getAttribute('width'),
          ).length,
        }
      })

      if (checks.h1Count !== 1) {
        failures.push(`${path}: ${checks.h1Count} <h1> elements, expected exactly 1`)
      }
      if (checks.hasIframe > 0) {
        failures.push(`${path}: an <iframe> — no embedded third-party forms or widgets`)
      }
      if (checks.hasGoogleUserContent) {
        failures.push(`${path}: references googleusercontent.com`)
      }
      if (checks.hasAggregateRating) {
        failures.push(`${path}: aggregateRating in the markup`)
      }
      if (checks.badImages > 0) {
        failures.push(`${path}: ${checks.badImages} image(s) missing alt or width`)
      }

      const wrongTel = checks.telHrefs.filter((h) => h !== 'tel:+447538869832')
      if (wrongTel.length > 0) {
        failures.push(`${path}: unexpected tel: link(s) ${wrongTel.join(', ')}`)
      }

      // Every indexable page must name a service and a place.
      const indexable = !['/contact/sent', '/contact/incomplete', '/contact/problem'].includes(path)
      if (indexable) {
        const hasPlace = /\{\{TOWN\}\}|in [A-Z]/.test(checks.title)
        if (!hasPlace) failures.push(`${path}: title names no place — "${checks.title}"`)
        if (!/KH Painting and Decorating/.test(checks.title)) {
          failures.push(`${path}: title has no business name — "${checks.title}"`)
        }
      }
    }
  }

  await context.close()
}

/* ---- Reduced motion: content must still be visible ----------------- */

{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  })
  const page = await context.newPage()
  await page.goto(base + '/', { waitUntil: 'networkidle' })

  const hidden = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.callout-label, .grid-rule, .callout-dot')]
    return els.filter((el) => Number(getComputedStyle(el).opacity) === 0).length
  })

  if (hidden > 0) {
    failures.push(
      `prefers-reduced-motion: ${hidden} revealed element(s) still at opacity 0. ` +
        'Reveals must render in place, not stay hidden.',
    )
  } else {
    notes.push('prefers-reduced-motion: everything renders in place')
  }

  await context.close()
}

await browser.close()

/* ---- Report -------------------------------------------------------- */

const line = '─'.repeat(72)
console.log(`\n${line}\nKH Painting and Decorating — audit\n${line}`)

for (const note of notes) console.log(`  ✓ ${note}`)

if (failures.length === 0) {
  console.log(`  ✓ ${PAGES.length} pages × ${VIEWPORTS.length} widths — no violations`)
  console.log(`\n${line}\nClean.\n`)
  process.exit(0)
}

console.log('\nFailures:')
for (const failure of failures) console.log(`  ✗ ${failure}`)
console.log(`\n${line}\n${failures.length} failure(s).\n`)
process.exit(1)
