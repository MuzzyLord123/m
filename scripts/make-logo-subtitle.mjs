/**
 * Rewrites the line under the wordmark in the client's logo.
 *
 *   node scripts/make-logo-subtitle.mjs ["NEW TEXT"]
 *
 * The logo arrived as a flattened PNG — swoosh, wordmark and strapline baked
 * into one raster with no layers and no vector source. So changing the
 * strapline means erasing those pixels and drawing new ones.
 *
 * WHAT MAKES THAT SAFE HERE. The strapline sits in its own clear rectangle:
 * x 186–584, y 148–192 contains 3,954 opaque pixels and ZERO saturated-orange
 * ones, measured before anything was touched. Nothing of the swoosh or the
 * wordmark passes through it, so clearing it to transparent removes the old
 * line and nothing else. If the artwork is ever replaced, re-measure before
 * trusting these numbers.
 *
 * IDEMPOTENT, AND REVERSIBLE. It always reads logo-original.png — created from
 * logo.png on first run and never written to again — so running it twice, or
 * with different text, gives the same result as running it once. Delete
 * logo.png and re-run to get back to a known state; keep logo-original.png to
 * get the client's untouched artwork back.
 *
 * MATCHING THE ORIGINAL. Sampled off the old strapline: cap height 22px,
 * baseline y=180, centred on x=383 (the wordmark's centre, not the image's),
 * and a metallic fade that runs #ceced2 at ~96% alpha down to white at ~50% —
 * it gets brighter and thinner towards the baseline, which is what reads as
 * brushed metal. The face is Instrument Sans, already a dependency of this
 * site: the original is an unidentified geometric sans with no source file, and
 * a near-match that is IN the project beats a guess that has to be licensed.
 * Tracking and size are fitted to the target width rather than fixed, so a
 * longer or shorter phrase stays inside the lockup.
 */
import sharp from "sharp";
import fs from "node:fs";
import { launchBrowser } from "./browser.mjs";

const TEXT = process.argv[2] ?? "DECORATING DONE PROPERLY";

const SRC = "public/brand/logo-original.png";
const OUT = "public/brand/logo.png";

/* The clear rectangle, and the type metrics, both measured off the original. */
const ERASE = { left: 186, top: 148, width: 399, height: 45 };
const CAP_HEIGHT = 22; // px, from cap top y=158 to baseline y=180
const BASELINE = 180;
const CENTRE = 385;
const MAX_WIDTH = 396; // keeps the line inside the cleared box, x 186-584
const SS = 4; // supersample, then downscale — the edges are 22px tall

if (!fs.existsSync(SRC)) {
  fs.copyFileSync(OUT, SRC);
  console.log(`kept the untouched artwork as ${SRC}`);
}

const FONT = "node_modules/@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2";
if (!fs.existsSync(FONT)) throw new Error(`font not found: ${FONT} — run npm install`);
const fontData = fs.readFileSync(FONT).toString("base64");

const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1600, height: 400 }, deviceScaleFactor: 1 });

/**
 * Renders the line at `size`/`tracking` and reports the ink box, so the fit
 * below is measured rather than guessed. Cap height is measured off a capital
 * H rather than derived from the font size — the ratio differs per face, and
 * getting it wrong is the difference between a lockup and a near miss.
 */
async function measure(size, tracking) {
  return page.evaluate(
    async ({ text, size, tracking, fontData }) => {
      if (!document.getElementById("f")) {
        const s = document.createElement("style");
        s.id = "f";
        s.textContent = `@font-face{font-family:IS;src:url(data:font/woff2;base64,${fontData}) format('woff2');font-weight:100 800;font-display:block}
          html,body{margin:0;background:transparent}
          #t{position:absolute;left:40px;top:40px;font-family:IS;white-space:pre;color:#fff}`;
        document.head.appendChild(s);
        const d = document.createElement("div");
        d.id = "t";
        document.body.appendChild(d);
        await document.fonts.load("400 100px IS");
        await document.fonts.ready;
      }
      const t = document.getElementById("t");
      t.style.fontSize = size + "px";
      t.style.letterSpacing = tracking + "em";
      t.style.fontWeight = "400";
      t.textContent = text;
      const w = t.getBoundingClientRect().width;
      t.textContent = "H";
      const cap = t.getBoundingClientRect().height; // line box, not cap
      // Cap height properly: measure the painted rows of an H on a canvas.
      const c = document.createElement("canvas");
      c.width = Math.ceil(size * 2);
      c.height = Math.ceil(size * 2);
      const g = c.getContext("2d");
      g.font = `400 ${size}px IS`;
      g.textBaseline = "alphabetic";
      g.fillStyle = "#fff";
      g.fillText("H", 5, size * 1.5);
      const d2 = g.getImageData(0, 0, c.width, c.height).data;
      let top = -1, bot = -1;
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          if (d2[(y * c.width + x) * 4 + 3] > 20) {
            if (top < 0) top = y;
            bot = y;
            break;
          }
        }
      }
      t.textContent = text;
      return { width: w, capHeight: bot - top + 1, lineBox: cap };
    },
    { text: TEXT, size, tracking, fontData },
  );
}

/* Fit, in that order: tracking first, then size.
   The old strapline was 17 characters at wide tracking. A longer phrase cannot
   keep both, and of the two it is the TRACKING that has to give first — a
   strapline set a little smaller still reads as the same lockup, whereas one
   set tight enough to fit at the old size stops looking like a strapline at
   all. TRACKING_FLOOR is where a spaced capital line stops reading as spaced;
   below it, size gives instead. Negative tracking is never acceptable here. */
const TRACKING_OPEN = 0.18;
const TRACKING_FLOOR = 0.055;

let size = 30;
for (let i = 0; i < 12; i++) {
  const m = await measure(size, TRACKING_OPEN);
  const err = CAP_HEIGHT / m.capHeight;
  if (Math.abs(1 - err) < 0.005) break;
  size *= err;
}
let tracking = TRACKING_OPEN;
for (let i = 0; i < 40 && tracking > TRACKING_FLOOR; i++) {
  const m = await measure(size, tracking);
  if (m.width <= MAX_WIDTH) break;
  tracking = Math.max(TRACKING_FLOOR, tracking - 0.005);
}
for (let i = 0; i < 40; i++) {
  const m = await measure(size, tracking);
  if (m.width <= MAX_WIDTH) break;
  size *= Math.max(0.97, MAX_WIDTH / m.width);
}
const fitted = await measure(size, tracking);
console.log(
  `fitted: size ${size.toFixed(2)}px, tracking ${tracking.toFixed(3)}em -> ` +
    `${fitted.width.toFixed(1)}px wide, cap height ${fitted.capHeight}px (target ${CAP_HEIGHT})`,
);
if (fitted.width > MAX_WIDTH + 1) {
  console.log(`WARNING: still ${Math.round(fitted.width)}px wide, over the ${MAX_WIDTH}px the lockup allows`);
}

/* Paint it at 4x with the metallic fade, on transparent. background-clip:text
   so the gradient is the ink itself rather than a box behind it. */
const strip = await page.evaluate(
  async ({ text, size, tracking, fontData, ss, cap }) => {
    document.getElementById("t")?.remove();
    const s = document.createElement("style");
    s.textContent = `@font-face{font-family:IS2;src:url(data:font/woff2;base64,${fontData}) format('woff2');font-weight:100 800;font-display:block}`;
    document.head.appendChild(s);
    await document.fonts.load(`400 ${size * ss}px IS2`);
    await document.fonts.ready;
    const d = document.createElement("div");
    d.id = "paint";
    d.textContent = text;
    Object.assign(d.style, {
      position: "absolute",
      left: "0px",
      top: "0px",
      fontFamily: "IS2",
      fontWeight: "400",
      fontSize: `${size * ss}px`,
      letterSpacing: `${tracking}em`,
      lineHeight: `${cap * ss * 2}px`,
      whiteSpace: "pre",
      /* Brighter and thinner towards the baseline — sampled off the original,
         which runs #ceced2 at ~96% alpha down to white at ~50%. */
      backgroundImage:
        "linear-gradient(to bottom, rgba(206,206,210,0.97) 0%, rgba(214,214,219,0.92) 45%," +
        " rgba(236,234,240,0.72) 74%, rgba(255,255,255,0.5) 100%)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    });
    document.body.appendChild(d);
    const r = d.getBoundingClientRect();
    return { w: Math.ceil(r.width), h: Math.ceil(r.height) };
  },
  { text: TEXT, size, tracking, fontData, ss: SS, cap: CAP_HEIGHT },
);

const shot = await page.locator("#paint").screenshot({ omitBackground: true });
await browser.close();

/* Trim to the ink, so placement is driven by the glyphs and not by whatever
   leading the line box happened to carry. */
const trimmed = await sharp(shot).trim({ threshold: 1 }).toBuffer();
const meta = await sharp(trimmed).metadata();
const targetW = Math.round(meta.width / SS);
const targetH = Math.round(meta.height / SS);
const line = await sharp(trimmed).resize(targetW, targetH, { fit: "fill", kernel: "lanczos3" }).toBuffer();

/* The trimmed strip starts at the cap top and ends at the baseline-ish bottom
   of the descender-free, all-caps line, so its top sits CAP_HEIGHT above the
   baseline. */
const left = Math.round(CENTRE - targetW / 2);
const top = Math.round(BASELINE - CAP_HEIGHT);

/* Clear the old line, then lay the new one in. `dest-out` with a solid rect
   punches the rectangle to transparent without touching anything outside it. */
const cleared = await sharp(SRC)
  .ensureAlpha()
  .composite([
    {
      input: {
        create: { width: ERASE.width, height: ERASE.height, channels: 4, background: "#000" },
      },
      left: ERASE.left,
      top: ERASE.top,
      blend: "dest-out",
    },
  ])
  .png()
  .toBuffer();

await sharp(cleared)
  .composite([{ input: line, left, top }])
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`"${TEXT}"  ->  ${OUT}`);
console.log(`   placed ${targetW}x${targetH}px at x=${left}, y=${top} (baseline ${BASELINE}, centre ${CENTRE})`);
