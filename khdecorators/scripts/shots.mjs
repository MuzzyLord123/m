/**
 * Screenshots, for reviewing the design without a browser to hand.
 *
 * Not part of the build or the launch gate — a development aid. Run the site, then:
 *   node scripts/shots.mjs [baseUrl] [outDir]
 */
import { mkdirSync } from 'node:fs'
import { chromium } from 'playwright'

const base = process.argv[2] ?? 'http://localhost:3210'
const out = process.argv[3] ?? '/tmp/kh-shots'

const PAGES = [
  ['home', '/'],
  ['spraying', '/spraying'],
  ['dustless', '/dustless-sanding'],
  ['interior', '/interior-decoration'],
  ['reviews', '/reviews'],
  ['about', '/about'],
  ['contact', '/contact'],
  ['leave-a-review', '/leave-a-review'],
]

const VIEWPORTS = [
  ['desktop', { width: 1440, height: 1000 }],
  ['mobile', { width: 390, height: 844 }],
]

mkdirSync(out, { recursive: true })

// Use whatever Chromium the machine already has when one is provided, rather than
// downloading a second copy to match the pinned Playwright build.
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)

for (const [vpName, viewport] of VIEWPORTS) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1 })
  const page = await context.newPage()

  for (const [name, path] of PAGES) {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' })
    // Let the reveal transitions land before capturing.
    await page.waitForTimeout(900)
    await page.screenshot({ path: `${out}/${vpName}-${name}.png`, fullPage: true })
    console.log(`${vpName}/${name}`)
  }

  await context.close()
}

await browser.close()
