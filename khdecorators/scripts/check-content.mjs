/**
 * The launch gate.
 *
 *   npm run check:content   — report what is still outstanding, exit 0
 *   npm run check:launch    — the same, but exit 1 if anything BLOCKING is outstanding
 *
 * `check:launch` is the last thing to run before DNS is pointed at this build. It
 * exists because the two most expensive mistakes available on this project are silent
 * ones: launching with `{{TOWN}}` sitting in nine page titles, and launching with the
 * Google Ads conversion labels unset so every enquiry goes unrecorded and the smart
 * bidding starves.
 *
 * It reads the content files as text rather than importing them, so it needs no build
 * step, no TypeScript and no dependencies.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const strict = process.argv.includes('--strict')

const problems = []
const warnings = []
const notes = []

/* ------------------------------------------------------------------ *
 * 1. Placeholders left in the content
 * ------------------------------------------------------------------ */

const contentDir = join(root, 'content')
const contentFiles = readdirSync(contentDir).filter((f) => f.endsWith('.ts'))

/** Tokens that stop the site going live. Everything else is a warning. */
const BLOCKING_TOKENS = ['{{TOWN}}']

const found = new Map()

/**
 * needed.ts is the register — it names every token on purpose — and types.ts documents
 * the convention. Scanning them would report the index as if it were the problem.
 */
const NOT_SCANNED_FOR_TOKENS = new Set(['needed.ts', 'types.ts'])

for (const file of contentFiles) {
  if (NOT_SCANNED_FOR_TOKENS.has(file)) continue
  const text = readFileSync(join(contentDir, file), 'utf8')
  for (const match of text.matchAll(/\{\{[A-Z0-9_]+\}\}/g)) {
    const token = match[0]
    if (!found.has(token)) found.set(token, new Set())
    found.get(token).add(file)
  }
}

for (const [token, files] of found) {
  const where = [...files].join(', ')
  if (BLOCKING_TOKENS.includes(token)) {
    problems.push(`${token} is still a placeholder (${where}). It goes in every page title.`)
  } else {
    warnings.push(`${token} not confirmed yet (${where}).`)
  }
}

/* ------------------------------------------------------------------ *
 * 2. The reviews
 * ------------------------------------------------------------------ */

const reviewsSrc = readFileSync(join(contentDir, 'reviews.ts'), 'utf8')

// Count entries in the exported array rather than trusting a comment: an object
// literal with a `quote:` key inside the `reviews` array is a real review.
const reviewsArray = reviewsSrc.match(/export const reviews: Review\[\] = \[([\s\S]*?)\n\]/)
const reviewBody = reviewsArray ? reviewsArray[1] : ''
// Strip block and line comments so the documented template does not count.
const reviewBodyLive = reviewBody.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
const reviewCount = (reviewBodyLive.match(/\bquote:/g) ?? []).length

if (reviewCount === 0) {
  problems.push(
    'No reviews have been transcribed. They exist on Yell, Google and the old site — ' +
      'see the instructions at the top of content/reviews.ts. Do not write them.',
  )
} else {
  notes.push(`${reviewCount} review${reviewCount === 1 ? '' : 's'} transcribed.`)

  // Verbatim means verbatim, but the 30-word limit is ours to keep.
  for (const match of reviewBodyLive.matchAll(/quote:\s*(['"`])([\s\S]*?)\1/g)) {
    const words = match[2].trim().split(/\s+/).length
    if (words > 30) {
      warnings.push(`A review excerpt is ${words} words. The limit is 30 — trim from the ends.`)
    }
  }

  // An unsourced quote must not carry a date or a link, or it is being dressed up.
  const entries = reviewBodyLive.split(/\},\s*\{/)
  for (const entry of entries) {
    if (/source:\s*'unsourced'/.test(entry)) {
      if (/date:\s*'/.test(entry)) {
        problems.push('An unsourced review has a date on it. Unsourced reviews get no date.')
      }
      if (/url:\s*'/.test(entry)) {
        problems.push('An unsourced review has a link on it. Unsourced reviews get no link.')
      }
    }
  }
}

/* ------------------------------------------------------------------ *
 * 3. Service area
 * ------------------------------------------------------------------ */

const areasSrc = readFileSync(join(contentDir, 'areas.ts'), 'utf8')
if (/towns:\s*\[\s*\]\s*as string\[\]/.test(areasSrc)) {
  problems.push(
    'No towns in the service area (content/areas.ts). Needed for local search and to stop ' +
      'Ads paying for clicks from places Kenny would turn down.',
  )
}

/* ------------------------------------------------------------------ *
 * 4. Ads conversion labels and enquiry delivery
 * ------------------------------------------------------------------ */

const ADS_VARS = [
  'NEXT_PUBLIC_ADS_CONVERSION_FORM',
  'NEXT_PUBLIC_ADS_CONVERSION_CALL',
  'NEXT_PUBLIC_ADS_CONVERSION_EMAIL',
]

for (const name of ADS_VARS) {
  if (!process.env[name]) {
    problems.push(
      `${name} is not set. Copy it from the EXISTING conversion action in Google Ads — ` +
        'do not create a new one. See ADS-MIGRATION.md §2.',
    )
  }
}

for (const name of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']) {
  if (!process.env[name]) {
    problems.push(`${name} is not set, so the enquiry form cannot deliver. See LAUNCH.md §4.`)
  }
}

if (!process.env.NEXT_PUBLIC_SITE_URL) {
  warnings.push('NEXT_PUBLIC_SITE_URL is not set. Canonicals and the sitemap will use the default.')
}

if (!process.env.NEXT_PUBLIC_GA4_ID) {
  warnings.push(
    'NEXT_PUBLIC_GA4_ID is not set. No behaviour analytics; Ads tracking is unaffected.',
  )
}

/* ------------------------------------------------------------------ *
 * 5. The Ads tag itself — the one thing that must never go missing
 * ------------------------------------------------------------------ */

const conversionsSrc = readFileSync(join(root, 'src/lib/conversions.ts'), 'utf8')
if (!conversionsSrc.includes('AW-11172797357')) {
  problems.push(
    'The Google Ads tag AW-11172797357 is missing from src/lib/conversions.ts. ' +
      'It is live on the current site. Losing it stops all conversion tracking.',
  )
}

/* ------------------------------------------------------------------ *
 * 6. Photographs
 * ------------------------------------------------------------------ */

const workDir = join(root, 'public/work')
const photoCount = existsSync(workDir)
  ? readdirSync(workDir).filter((f) => /\.(jpe?g|png|avif|webp)$/i.test(f)).length
  : 0

if (photoCount === 0) {
  warnings.push(
    'No photographs in public/work. Every image slot renders as a marked empty frame. ' +
      'Spray photographs matter most — /spraying cannot carry the annotated device without them.',
  )
} else {
  notes.push(`${photoCount} photograph${photoCount === 1 ? '' : 's'} in public/work.`)
}

/* ------------------------------------------------------------------ *
 * 7. Things that must never come back
 * ------------------------------------------------------------------ */

const srcFiles = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else if (/\.(tsx?|css)$/.test(entry.name)) srcFiles.push(full)
  }
}
walk(join(root, 'src'))
walk(contentDir)

/**
 * The four things this rebuild exists to remove. If any of them reappears in a later
 * change, the launch check fails rather than a reviewer having to spot it.
 *
 * Patterns are written to match USE, not discussion: several of these are named in the
 * comments explaining why they are banned, and a check that flags its own rationale
 * gets switched off within a week.
 */
const FORBIDDEN = [
  [
    // A URL, not the word. `//lh3.googleusercontent.com/...`, `src="https://...`
    /\/\/[a-z0-9.-]*googleusercontent\.com/i,
    'A hotlink to googleusercontent.com. Those are Google-hosted resized copies — export the originals.',
  ],
  [/\/\/docs\.google\.com\/forms/i, 'A Google Form. Removing it was the point of this rebuild.'],
  [
    // A JSON-LD key, not the word in a sentence.
    /['"]?aggregateRating['"]?\s*:/,
    'aggregateRating in the structured data. Third-party ratings marked up as first-party risks a manual action.',
  ],
  [/rmdecorsolutions/i, "A link to another decorator's website, as on the old About page."],
]

/** Drop block comments and whole-line `//` or `*` comments before testing. */
const stripComments = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\*|\/\/)/.test(line))
    .join('\n')

for (const file of srcFiles) {
  const code = stripComments(readFileSync(file, 'utf8'))
  for (const [pattern, message] of FORBIDDEN) {
    if (pattern.test(code)) {
      problems.push(`${file.replace(root + '/', '')}: ${message}`)
    }
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const line = '─'.repeat(72)

console.log(`\n${line}\nKH Painting and Decorating — ${strict ? 'LAUNCH CHECK' : 'content check'}\n${line}`)

if (notes.length > 0) {
  console.log('\nDone:')
  for (const note of notes) console.log(`  ✓ ${note}`)
}

if (warnings.length > 0) {
  console.log('\nOutstanding, but the site is honest without them:')
  for (const warning of warnings) console.log(`  · ${warning}`)
}

if (problems.length > 0) {
  console.log('\nMUST be resolved before launch:')
  for (const problem of problems) console.log(`  ✗ ${problem}`)
}

console.log(`\n${line}`)

if (problems.length === 0) {
  console.log('No blocking items. Clear to launch.\n')
  process.exit(0)
}

console.log(
  `${problems.length} blocking item${problems.length === 1 ? '' : 's'}. ` +
    'See CONTENT-NEEDED.md, ADS-MIGRATION.md and LAUNCH.md.\n',
)

process.exit(strict ? 1 : 0)
