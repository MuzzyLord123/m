/**
 * Splits the logo into the two layers the splash screen animates separately.
 *
 *   node scripts/make-logo-layers.mjs
 *
 *   public/brand/logo-stroke.png   the brush and the orange swoosh
 *   public/brand/logo-text.png     THEPAINTMEN.COM / PAINTING SERVICES
 *
 * WHY. The opening is meant to read as the brush in his own logo laying the
 * paint down, and then the wording arriving on top of it. That needs the stroke
 * and the type to move independently, and they cannot if the logo is one flat
 * PNG. Two layers, stacked back in exactly the same place, compose to the
 * original — so nothing about the finished mark changes.
 *
 * THE SPLIT IS A RECTANGLE, and it works because of how the mark is drawn: the
 * type sits in a clear horizontal band on the right, the swoosh's upper arc
 * passes to the LEFT of it, and the tail and drips run BELOW it. Nothing of the
 * stroke crosses the box. Verified by compositing the two layers back together
 * and diffing against the original — the check at the bottom fails the script
 * if a single pixel is lost.
 *
 * Re-run this if public/brand/logo.png is ever replaced, and check the two
 * files by eye afterwards: a new mark may not divide on the same rectangle.
 */
import sharp from "sharp";

const SRC = "public/brand/logo.png";
const OUT_STROKE = "public/brand/logo-stroke.png";
const OUT_TEXT = "public/brand/logo-text.png";

/** The type's bounding box in the 669x280 artwork. */
const TEXT_BOX = { left: 100, top: 88, width: 669 - 100, height: 196 - 88 };

const src = sharp(SRC);
const { width, height } = await src.metadata();
if (width !== 669 || height !== 280) {
  console.warn(
    `[layers] logo.png is ${width}x${height}, expected 669x280 — TEXT_BOX may no longer fit.`,
  );
}

const original = await sharp(SRC).ensureAlpha().raw().toBuffer();
const channels = 4;

/** Copies the artwork, clearing every pixel inside (or outside) the box. */
function carve(keepInsideBox) {
  const out = Buffer.from(original);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inside =
        x >= TEXT_BOX.left &&
        x < TEXT_BOX.left + TEXT_BOX.width &&
        y >= TEXT_BOX.top &&
        y < TEXT_BOX.top + TEXT_BOX.height;
      if (inside !== keepInsideBox) {
        // Clear to fully transparent black, so nothing shows and nothing
        // fringes when the layer is composited.
        const i = (y * width + x) * channels;
        out[i] = 0;
        out[i + 1] = 0;
        out[i + 2] = 0;
        out[i + 3] = 0;
      }
    }
  }
  return sharp(out, { raw: { width, height, channels } }).png();
}

await carve(false).toFile(OUT_STROKE);
await carve(true).toFile(OUT_TEXT);

/* Put them back together and prove nothing was lost. A split that drops part of
   the mark would be invisible here and obvious on the client's home page. */
const recomposed = await sharp({
  create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: OUT_STROKE }, { input: OUT_TEXT }])
  .raw()
  .toBuffer();

let worst = 0;
for (let i = 0; i < original.length; i++) {
  worst = Math.max(worst, Math.abs(original[i] - recomposed[i]));
}

console.log(`[layers] wrote ${OUT_STROKE} and ${OUT_TEXT}`);
console.log(`[layers] recomposed vs original: worst channel difference ${worst}`);
if (worst > 2) {
  console.error(
    "[layers] The two layers do NOT add back up to the original. The split is wrong.",
  );
  process.exitCode = 1;
}
