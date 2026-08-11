#!/usr/bin/env node
/**
 * Pull the photographs off the live WordPress site.
 *
 *   node scripts/import-gallery.mjs
 *   node scripts/import-gallery.mjs --pages /projects-gallery/,/about-mcdonald-painting-contractors/
 *   node scripts/import-gallery.mjs --dry
 *
 * Why this exists as a script rather than something already done: the machine
 * this site was built on has no route out to the public internet — the network
 * policy answers 403 to mcdonaldpaintingcontractors.co.uk — so nobody here has
 * ever been able to load the gallery. Run this from a normal laptop and it does
 * in twenty seconds what would otherwise be an afternoon of right-clicking.
 *
 * What it does:
 *   1. Fetches the listed pages and finds every image on them, including the
 *      ones only present in `srcset` and in WordPress gallery data attributes.
 *   2. Rewrites every URL to the ORIGINAL upload. WordPress serves resized
 *      copies with a `-1024x768` suffix in the filename; the original is the
 *      same URL with the suffix removed. This design runs photographs full
 *      width, so the resized copy is not good enough.
 *   3. Downloads into public/photographs/gallery/, skipping anything already
 *      there, and skipping the theme furniture (logos, icons, spacers).
 *   4. Writes public/photographs/gallery/manifest.json — filename, pixel size,
 *      byte size, source URL and the alt text the old site used.
 *
 * What it deliberately does NOT do: put photographs on pages. That is a
 * judgement about which image belongs to which job, and it belongs to whoever
 * knows the jobs. The manifest is the worksheet for that ten-minute
 * conversation — see README.md, "Add a site record".
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'photographs', 'gallery');
const ORIGIN = 'https://mcdonaldpaintingcontractors.co.uk';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry');
const pagesArg = args.indexOf('--pages');
const PAGES =
  pagesArg !== -1 && args[pagesArg + 1]
    ? args[pagesArg + 1].split(',')
    : [
        '/projects-gallery/',
        '/',
        '/about-mcdonald-painting-contractors/',
        '/health-safety/',
        '/testimonials/',
      ];

/** Theme furniture, not job photography. */
const SKIP = /(logo|icon|favicon|placeholder|spacer|avatar|cropped|badge|masterslider|blank\.gif)/i;
const IMAGE = /\.(jpe?g|png|webp|avif)$/i;

/** `photo-1024x768.jpg` → `photo.jpg`. The original is what we want. */
function toOriginal(url) {
  return url.replace(/-\d{2,5}x\d{2,5}(?=\.[a-z]{3,4}(?:$|\?))/i, '');
}

function absolute(url) {
  if (url.startsWith('//')) return `https:${url}`;
  if (url.startsWith('/')) return ORIGIN + url;
  return url;
}

/**
 * Every place a WordPress theme hides an image URL: src, srcset, data-src,
 * data-large_image, and the JSON blobs gallery plugins leave in attributes.
 */
function extractImageUrls(html) {
  const found = new Set();

  for (const m of html.matchAll(/(?:src|data-src|data-large_image|data-full-url|href)\s*=\s*["']([^"']+)["']/gi)) {
    if (IMAGE.test(m[1])) found.add(m[1]);
  }
  for (const m of html.matchAll(/srcset\s*=\s*["']([^"']+)["']/gi)) {
    for (const candidate of m[1].split(',')) {
      const url = candidate.trim().split(/\s+/)[0];
      if (url && IMAGE.test(url)) found.add(url);
    }
  }
  // Escaped URLs inside JSON attributes: https:\/\/example.com\/x.jpg
  for (const m of html.matchAll(/https?:\\?\/\\?\/[^"'\s\\]+\.(?:jpe?g|png|webp)/gi)) {
    found.add(m[0].replace(/\\/g, ''));
  }

  return [...found]
    .map(absolute)
    .map(toOriginal)
    .filter((u) => u.includes('mcdonaldpainting') || u.startsWith(ORIGIN))
    .filter((u) => !SKIP.test(u));
}

/** Alt text keyed by filename, so the manifest can carry what the old site said. */
function extractAltText(html) {
  const alts = new Map();
  for (const tag of html.matchAll(/<img[^>]+>/gi)) {
    const src = tag[0].match(/src\s*=\s*["']([^"']+)["']/i)?.[1];
    const alt = tag[0].match(/alt\s*=\s*["']([^"']*)["']/i)?.[1];
    if (src && alt) alts.set(path.basename(toOriginal(absolute(src))), alt.trim());
  }
  return alts;
}

/** Pixel dimensions from the file header. Enough for JPEG, PNG and WebP. */
function dimensions(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const fmt = buf.toString('ascii', 12, 16);
    if (fmt === 'VP8X') return { width: (buf.readUIntLE(24, 3) & 0xffffff) + 1, height: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
    if (fmt === 'VP8 ') return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
    if (fmt === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { width: (b & 0x3fff) + 1, height: ((b >> 14) & 0x3fff) + 1 };
    }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      // SOF0–SOF15, excluding the DHT/JPG/DAC markers that share the range.
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return { width: null, height: null };
}

async function main() {
  console.log(`Reading ${PAGES.length} pages from ${ORIGIN}\n`);

  const urls = new Set();
  const alts = new Map();

  for (const page of PAGES) {
    const target = ORIGIN + page;
    try {
      const res = await fetch(target, {
        headers: { 'user-agent': 'Mozilla/5.0 (migration; own-site image export)' },
      });
      if (!res.ok) {
        console.log(`  ${String(res.status).padEnd(4)} ${page}`);
        continue;
      }
      const html = await res.text();
      const found = extractImageUrls(html);
      found.forEach((u) => urls.add(u));
      extractAltText(html).forEach((v, k) => { if (!alts.has(k)) alts.set(k, v); });
      console.log(`  200  ${page.padEnd(44)} ${found.length} images`);
    } catch (err) {
      console.log(`  ERR  ${page} — ${err.message}`);
      if (err.message.includes('fetch failed')) {
        console.log('       (no route to the site — run this from a normal internet connection)');
      }
    }
  }

  console.log(`\n${urls.size} distinct originals found.`);
  if (dryRun) {
    [...urls].sort().forEach((u) => console.log('  ' + u));
    return;
  }
  if (!urls.size) {
    console.log('Nothing to download. If every line above is an error, the site is unreachable from here.');
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(OUT, { recursive: true });
  const manifest = [];
  let downloaded = 0;
  let skipped = 0;

  for (const url of [...urls].sort()) {
    const name = decodeURIComponent(path.basename(new URL(url).pathname));
    const dest = path.join(OUT, name);

    if (fs.existsSync(dest)) {
      skipped += 1;
    } else {
      try {
        const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (migration)' } });
        if (!res.ok) {
          console.log(`  ${res.status} ${name}`);
          continue;
        }
        fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
        downloaded += 1;
      } catch (err) {
        console.log(`  ERR ${name} — ${err.message}`);
        continue;
      }
    }

    const buf = fs.readFileSync(dest);
    const { width, height } = dimensions(buf);
    manifest.push({
      file: `/photographs/gallery/${name}`,
      width,
      height,
      bytes: buf.length,
      source: url,
      altFromOldSite: alts.get(name) ?? null,
      // Filled in by whoever knows the jobs. See README.md.
      assignedTo: null,
    });
  }

  manifest.sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0));
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

  const small = manifest.filter((m) => (m.width ?? 0) < 1600);
  console.log(`\n${downloaded} downloaded, ${skipped} already present.`);
  console.log(`Manifest: public/photographs/gallery/manifest.json`);
  if (small.length) {
    console.log(
      `\n${small.length} of them are under 1600px wide. This design runs photographs full width,\n` +
        `so those will look soft — get the originals off Sean's phone for anything you intend to\n` +
        `use as a full-bleed site record.`,
    );
  }
  console.log(
    `\nNext: open the manifest, decide which photograph belongs to which job, and paste the\n` +
      `file path, alt text and dimensions into that job's file in content/projects/.`,
  );
}

await main();
