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

/**
 * Google escapes URLs inside its inline scripts in three different ways — JSON
 * `=`, JavaScript `\x3d`, and `\/` — plus HTML entities in attributes.
 * Undo all of them so one pattern can find every image wherever it is mentioned.
 */
const unescape = (s) =>
  s
    .replace(/\\u([0-9a-f]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\x([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\\//g, '/')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')

/**
 * Every host Google serves a Sites image from. It has been lh3–lh6 for years,
 * and newer uploads come from hosts like lh7-rt and lh7-us — so any subdomain.
 */
const GOOGLE_IMAGE =
  /https:\/\/[a-z0-9-]+\.(?:googleusercontent|ggpht)\.com\/[^\s"'()<>\\,]+/g

/**
 * The size suffix (`=w1280`, `=s1600-rw`, `=d`) is the last `=` in the path.
 * Newer links can carry a `?key=` instead, and stripping that would break the
 * link, so a URL with a query string is left exactly as it is.
 */
const baseOf = (u) => (u.includes('?') ? u : u.replace(/=[a-z][0-9a-z-]*$/i, ''))

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, 'accept-language': 'en-GB,en;q=0.9' },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return { html: await res.text(), finalUrl: res.url }
}

/**
 * Returns the bytes, or a short reason string when there are none. Sends the
 * site as the referrer: Google's signed `-rt` image links can check it.
 */
async function fetchImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'user-agent': UA, referer: startUrl.href, accept: 'image/*,*/*;q=0.8' },
      redirect: 'follow',
    })
    if (!res.ok) return `HTTP ${res.status}`
    const type = res.headers.get('content-type') ?? ''
    if (!type.startsWith('image/') && !type.startsWith('application/octet-stream')) {
      return `not an image (${type || 'no type'})`
    }
    return Buffer.from(await res.arrayBuffer())
  } catch (error) {
    return `network: ${error.message}`
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

  const found = new Set(
    [...raw.matchAll(GOOGLE_IMAGE)]
      .map((m) => m[0])
      // Sandboxed embed frames live on googleusercontent too; they are not images.
      .filter((u) => !/-embeds\.googleusercontent\.com|\/embeds\//.test(u)),
  )
  // Images hosted anywhere else, if the site uses any.
  for (const t of tags) {
    if (/^https?:\/\//.test(t.src) && !/googleusercontent|ggpht/.test(t.src)) found.add(t.src)
  }

  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(raw)?.[1]?.trim() ?? ''
  pages.push({ url: page.finalUrl, title, text: visibleText(raw), tags, images: [...found] })
  console.log(`page ${pages.length}: ${page.finalUrl}  (${found.size} image URLs)`)

  // What the page is actually made of, so a site that embeds its pictures in
  // some way this script does not expect says so instead of returning nothing.
  const frames = [...raw.matchAll(/<iframe\b[^>]*\bsrc="([^"]+)"/gi)].map((m) => m[1])
  const hosts = new Map()
  for (const m of raw.matchAll(/https?:\/\/([a-z0-9.-]+)\//gi)) {
    hosts.set(m[1], (hosts.get(m[1]) ?? 0) + 1)
  }
  const topHosts = [...hosts].sort((a, b) => b[1] - a[1]).slice(0, 12)
  console.log(`    <img> tags: ${tags.length}   <iframe>s: ${frames.length}   bytes: ${raw.length}`)
  for (const t of tags) console.log(`    img  ${t.src.slice(0, 150)}  alt="${t.alt.slice(0, 60)}"`)
  for (const f of frames) console.log(`    frame ${f.slice(0, 150)}`)
  console.log(`    hosts: ${topHosts.map(([h, c]) => `${h}×${c}`).join('  ')}`)
  for (const u of found) console.log(`    found ${u.slice(0, 150)}`)
  const bg = [...raw.matchAll(/background-image:\s*url\(([^)]+)\)/gi)].map((m) => m[1])
  for (const b of bg.slice(0, 10)) console.log(`    background ${b.slice(0, 150)}`)
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
  const sizeable = /googleusercontent|ggpht/.test(base) && !base.includes('?')
  const variants = sizeable
    ? [`${base}=s0`, `${base}=w16383-h16383`, `${base}=d`, info.linkedAs]
    : [...new Set([info.linkedAs, base])]

  let best = null
  const failures = []
  for (const url of variants) {
    const buffer = await fetchImage(url)
    if (typeof buffer === 'string') {
      failures.push(`${url.slice(-14)} → ${buffer}`)
      continue
    }
    let meta
    try {
      meta = await sharp(buffer).metadata()
    } catch {
      failures.push(`${url.slice(-14)} → undecodable`)
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

  const where = [...info.pages].map((p) => new URL(p).pathname)
  if (!best) {
    skipped.push({ source: base, reason: `could not be downloaded: ${failures.join('; ')}`, pages: where })
    continue
  }
  if (Math.max(best.width, best.height) < MIN_EDGE) {
    skipped.push({ source: base, reason: `too small (${best.width}x${best.height})`, pages: where })
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
for (const s of skipped) {
  console.log(`  skipped …${s.source.slice(-40)} [${(s.pages ?? []).join(' ')}]: ${s.reason}`)
}
// Per page: how many images it mentions, and how many of those arrived.
for (const page of pages) {
  const got = manifest.filter((m) => m.pages.includes(page.url)).length
  console.log(`  ${new URL(page.url).pathname.padEnd(24)} mentions ${page.images.length}, kept ${got}`)
}
// Zero photographs is reported rather than failed: the page text and manifest
// are still worth having, and they are what says where the pictures went.
if (manifest.length === 0) console.warn('WARNING: no photographs were found.')
