#!/usr/bin/env node
/**
 * Pull every photograph off the live Google Site, at full resolution.
 *
 *   node scripts/import-live-photos.mjs [start-url] [out-dir]
 *   node scripts/import-live-photos.mjs https://www.khdecorators.uk/ _import
 *
 * Crawls the site from the start URL (same host only), finds every image on
 * every page — including the ones Google Sites only mentions inside script
 * blocks, which is where carousels keep theirs — and downloads each one at the
 * largest size Google will serve. Output is a STAGING folder for choosing from,
 * not the published site: pick the keepers, give them descriptive names in
 * public/work/, then delete the folder.
 *
 * WHY FULL RESOLUTION IS NOT THE URL ON THE PAGE. Google Sites links its images
 * at a display size (`=w1280`, sometimes smaller). The size is a suffix, so
 * stripping it and asking for `=s0` gets the file as uploaded. Several variants
 * are tried and the largest that decodes wins.
 *
 * WHAT HAPPENS TO EACH FILE ON THE WAY THROUGH
 *   - The EXIF orientation is applied to the pixels, so nothing arrives sideways.
 *   - ALL metadata is dropped. These are phone photographs of customers' houses,
 *     and a phone photograph can carry the GPS position it was taken at. That
 *     must not be republished, so it is not kept at all.
 *   - Colour is converted to sRGB, so an iPhone's Display P3 does not arrive
 *     looking washed out once the profile is gone.
 *   - The long edge is capped at 2560px. That is more than any screen here will
 *     request (next/image makes the smaller sizes on demand), and an 8MB phone
 *     original in the repository buys nothing but a slower clone.
 *
 * Also writes manifest.json (every image, its pixel size, which pages it was on,
 * its alt text on the old site) and pages/*.txt (each page's visible text), so
 * the photographs can be matched to the work they show.
 *
 * Node 22+, for the global fetch. Needs sharp, which Next already installs.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const START = process.argv[2] ?? 'https://www.khdecorators.uk/'
const OUT = path.resolve(process.argv[3] ?? '_import')
const MAX_EDGE = 2560
// Below this on the long edge it is an icon, a favicon or a social badge.
const MIN_EDGE = 160
const MAX_PAGES = 40
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'

const startUrl = new URL(START)
const bareHost = (h) => h.replace(/^www\./, '')
const sameSite = (u) => bareHost(u.hostname) === bareHost(startUrl.hostname)

/** Google Sites escapes URLs inside its inline JSON. Undo the common ones. */
const unescape = (s) =>
  s
    .replace(/\\u003d/gi, '=')
    .replace(/\\u0026/gi, '&')
    .replace(/\\u002f/gi, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')

const GOOGLE_IMAGE = /https:\/\/lh\d\.googleusercontent\.com\/[^\s"'()<>\\,]+/g

/** The size suffix is everything after the last `=` in the path. */
const baseOf = (u) => u.replace(/=[^/=]*$/, '')

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, 'accept-language': 'en-GB,en;q=0.9' },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return { html: await res.text(), finalUrl: res.url }
}

async function fetchImage(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow' })
    if (!res.ok) return null
    const type = res.headers.get('content-type') ?? ''
    if (!type.startsWith('image/') && !type.startsWith('application/octet-stream')) return null
    return Buffer.from(await res.arrayBuffer())
  } catch {
    return null
  }
}

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/h[1-6]|\/li|\/section|\/a)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&#x27;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&pound;/g, '£')
    .replace(/&amp;/g, '&')
    .replace(/[ \t\f\v]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

// ---------------------------------------------------------------------------
// 1. Crawl
// ---------------------------------------------------------------------------

const queue = [startUrl.href]
const visited = new Set()
const pages = []

while (queue.length > 0 && pages.length < MAX_PAGES) {
  const url = queue.shift()
  const key = url.replace(/[#?].*$/, '').replace(/\/$/, '')
  if (visited.has(key)) continue
  visited.add(key)

  let page
  try {
    page = await fetchPage(url)
  } catch (error) {
    console.warn(`  skip page ${url}: ${error.message}`)
    continue
  }
  const raw = unescape(page.html)

  for (const match of raw.matchAll(/href="([^"#]+)/g)) {
    try {
      const next = new URL(match[1], page.finalUrl)
      if (!sameSite(next)) continue
      if (/\.(jpe?g|png|gif|webp|pdf|zip)$/i.test(next.pathname)) continue
      queue.push(next.origin + next.pathname)
    } catch {
      // not a URL
    }
  }

  const tags = []
  for (const match of raw.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0]
    const src = /\b(?:data-src|src)="([^"]+)"/i.exec(tag)?.[1]
    const alt = /\balt="([^"]*)"/i.exec(tag)?.[1] ?? ''
    if (src) tags.push({ src, alt })
  }

  const found = new Set([...raw.matchAll(GOOGLE_IMAGE)].map((m) => m[0]))
  // Images hosted anywhere else, if the site uses any.
  for (const t of tags) {
    if (/^https?:\/\//.test(t.src) && !/googleusercontent/.test(t.src)) found.add(t.src)
  }

  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(raw)?.[1]?.trim() ?? ''
  pages.push({ url: page.finalUrl, title, text: visibleText(raw), tags, images: [...found] })
  console.log(`page ${pages.length}: ${page.finalUrl}  (${found.size} image URLs)`)
}

// ---------------------------------------------------------------------------
// 2. Group every URL by the image it points at, in order of first appearance
// ---------------------------------------------------------------------------

const images = new Map()
for (const page of pages) {
  for (const url of page.images) {
    const base = /googleusercontent/.test(url) ? baseOf(url) : url
    if (!images.has(base)) images.set(base, { pages: new Set(), alts: new Set(), linkedAs: url })
    images.get(base).pages.add(page.url)
  }
  for (const tag of page.tags) {
    const src = unescape(tag.src)
    const base = /googleusercontent/.test(src) ? baseOf(src) : src
    if (tag.alt.trim()) images.get(base)?.alts.add(tag.alt.trim())
  }
}
console.log(`\n${images.size} distinct images across ${pages.length} pages\n`)

// ---------------------------------------------------------------------------
// 3. Download each at the largest size available, clean it, write it
// ---------------------------------------------------------------------------

await mkdir(path.join(OUT, 'pages'), { recursive: true })

const manifest = []
const skipped = []
const kept = []
let n = 0

/** Mean absolute difference between two same-length greyscale buffers, 0–255. */
const meanDifference = (a, b) => {
  let sum = 0
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i])
  return sum / a.length
}

for (const [base, info] of images) {
  const variants = /googleusercontent/.test(base)
    ? [`${base}=s0`, `${base}=w16383-h16383`, `${base}=d`, info.linkedAs]
    : [base]

  let best = null
  for (const url of variants) {
    const buffer = await fetchImage(url)
    if (!buffer) continue
    let meta
    try {
      meta = await sharp(buffer).metadata()
    } catch {
      continue
    }
    // Orientations 5–8 are rotated a quarter turn: the stored width is the height.
    const turned = (meta.orientation ?? 1) >= 5
    const width = turned ? meta.height : meta.width
    const height = turned ? meta.width : meta.height
    if (!best || width * height > best.width * best.height) {
      best = { buffer, width, height, format: meta.format, hasAlpha: meta.hasAlpha, via: url }
    }
  }

  if (!best) {
    skipped.push({ source: base, reason: 'could not be downloaded' })
    continue
  }
  if (Math.max(best.width, best.height) < MIN_EDGE) {
    skipped.push({ source: base, reason: `too small (${best.width}x${best.height})` })
    continue
  }

  // Keep a PNG only when it really uses its transparency — a logo, not a photo.
  const transparent = best.hasAlpha && !(await sharp(best.buffer).stats()).isOpaque

  let pipeline = sharp(best.buffer)
    .rotate()
    .resize(MAX_EDGE, MAX_EDGE, { fit: 'inside', withoutEnlargement: true })
    .toColourspace('srgb')
  pipeline = transparent
    ? pipeline.png({ compressionLevel: 9 })
    : pipeline.flatten({ background: '#000000' }).jpeg({ quality: 86, mozjpeg: true })
  const { data, info: out } = await pipeline.toBuffer({ resolveWithObject: true })

  // The same photograph uploaded twice under two URLs is one photograph — often
  // at two different sizes, so an exact hash will not catch it. Compare a 16px
  // greyscale thumbnail with a tolerance instead, and only between frames of the
  // same shape: a portrait and a landscape can never be the same picture.
  const tiny = await sharp(data).resize(16, 16, { fit: 'fill' }).greyscale().raw().toBuffer()
  const aspect = out.width / out.height
  const twin = kept.find(
    (k) => Math.abs(k.aspect - aspect) < 0.02 && meanDifference(k.tiny, tiny) < 6,
  )
  if (twin) {
    const entry = manifest.find((m) => m.file === twin.file)
    for (const p of info.pages) if (!entry.pages.includes(p)) entry.pages.push(p)
    skipped.push({ source: base, reason: `duplicate of ${twin.file}` })
    continue
  }

  const file = `kh-${String(++n).padStart(2, '0')}.${transparent ? 'png' : 'jpg'}`
  await writeFile(path.join(OUT, file), data)
  kept.push({ file, aspect, tiny })
  manifest.push({
    file,
    width: out.width,
    height: out.height,
    kb: Math.round(data.length / 1024),
    original: { width: best.width, height: best.height, format: best.format },
    pages: [...info.pages],
    altOnOldSite: [...info.alts],
    source: best.via,
  })
  console.log(
    `${file}  ${out.width}x${out.height}  (${best.width}x${best.height} ${best.format})  ${Math.round(data.length / 1024)}KB`,
  )
}

// ---------------------------------------------------------------------------
// 4. The record
// ---------------------------------------------------------------------------

for (const page of pages) {
  const slug = new URL(page.url).pathname.replace(/^\/|\/$/g, '').replace(/\//g, '_') || 'home'
  const onPage = manifest.filter((m) => m.pages.includes(page.url)).map((m) => m.file)
  await writeFile(
    path.join(OUT, 'pages', `${slug}.txt`),
    `${page.url}\n${page.title}\nImages: ${onPage.join(', ') || 'none'}\n\n${page.text}\n`,
  )
}

await writeFile(
  path.join(OUT, 'manifest.json'),
  `${JSON.stringify({ start: START, fetched: new Date().toISOString(), pages: pages.map((p) => p.url), images: manifest, skipped }, null, 2)}\n`,
)

console.log(`\n${manifest.length} photographs written to ${OUT}, ${skipped.length} skipped.`)
if (manifest.length === 0) process.exitCode = 1
