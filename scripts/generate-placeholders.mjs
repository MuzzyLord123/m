/**
 * Generates solid-tone placeholder photography so the layout is real from day
 * one — correct aspect ratios, correct file paths, zero layout shift. Every
 * image here is a stand-in for a real photograph of the client's work and is
 * replaced file-for-file without touching a component.
 *
 * Writes minimal PNGs directly (deflate + CRC) so the repo needs no image
 * dependency. Run: node scripts/generate-placeholders.mjs
 */
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/**
 * Two-tone image: a base wall colour with a subtly lighter upper band, so a
 * placeholder reads as a room rather than a flat swatch.
 */
function png(width, height, hex) {
  const base = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const lift = base.map((v) => Math.min(255, Math.round(v + 14)));
  const shade = base.map((v) => Math.max(0, Math.round(v - 12)));
  const horizon = Math.round(height * 0.62);

  const raw = Buffer.alloc((width * 3 + 1) * height);
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filter: none
    const tone = y < horizon ? lift : y > height * 0.9 ? shade : base;
    for (let x = 0; x < width; x++) {
      raw[offset++] = tone[0];
      raw[offset++] = tone[1];
      raw[offset++] = tone[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const RATIOS = {
  "4:5": [1200, 1500],
  "16:9": [1600, 900],
  "1:1": [1200, 1200],
  "3:2": [1500, 1000],
  "3:4": [1200, 1600],
};

/** Decorating tones — plausible finished-room colours, not UI colours. */
const TONES = [
  "#d9d6cd", "#c3ccc9", "#b9ae9f", "#cfd3d8", "#c8bcb4",
  "#aab3a4", "#d5c9b6", "#b4bcc4", "#c9b8ad", "#bfc7bd",
  "#d2cabf", "#adb6b8", "#c6cbd0", "#bdb0a4", "#cfd6d2",
];

function emit(path, ratio, toneIndex) {
  const [w, h] = RATIOS[ratio];
  const file = join(root, "public", path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, png(w, h, TONES[toneIndex % TONES.length]));
}

let tone = 0;

// Hero and about-page imagery
emit("work/hero.png", "3:2", tone++);
emit("work/about-portrait.png", "4:5", tone++);
emit("work/video-poster.png", "16:9", tone++);

// 12 gallery projects: a lead image plus two detail shots each
const PROJECT_RATIOS = [
  "4:5", "16:9", "1:1", "3:4", "16:9", "4:5",
  "1:1", "3:2", "4:5", "16:9", "3:4", "1:1",
];
PROJECT_RATIOS.forEach((ratio, index) => {
  const n = index + 1;
  emit(`work/project-${n}-01.png`, ratio, tone++);
  emit(`work/project-${n}-02.png`, "3:2", tone++);
  emit(`work/project-${n}-03.png`, "3:2", tone++);
});

// Before/after pairs
for (const n of [1, 2]) {
  emit(`work/ba-${n}-before.png`, "3:2", tone++);
  emit(`work/ba-${n}-after.png`, "3:2", tone++);
}

// Social feed squares
for (let n = 1; n <= 6; n++) emit(`social/post-${n}.png`, "1:1", tone++);

console.log("[placeholders] written to public/work and public/social");
