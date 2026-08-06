/**
 * Bakes the share-card background: the hero photograph with the scrim already
 * burnt into it.
 *
 *   node scripts/make-og-bg.mjs
 *
 * The scrim used to be a gradient <div> inside the next/og component, and it
 * silently did nothing — twice. Satori ignores the `background` shorthand for
 * gradients, and it does not honour `inset: 0`, so the overlay collapsed to
 * zero size and the type sat unreadable on a brightly lit kitchen. Rather than
 * keep guessing at which subset of CSS the renderer supports, the gradient is
 * composited here with sharp, where it either works or throws.
 *
 * Re-run this if work/hero.jpg is ever replaced.
 */
import sharp from "sharp";

const W = 1200;
const H = 630;
const SRC = "public/work/hero.jpg";
const OUT = "public/brand/og-bg.jpg";

const photo = await sharp(SRC).resize(W, H, { fit: "cover", position: "attention" }).toBuffer();

/* Dark at the left where the logo and headline sit, opening up on the right so
   the work is still visible. Matches --color-paper (#0c0c0e). */
const scrim = Buffer.from(
  `<svg width="${W}" height="${H}">
     <defs>
       <linearGradient id="s" x1="0" y1="0" x2="1" y2="0.15">
         <stop offset="0%"   stop-color="#0c0c0e" stop-opacity="0.985"/>
         <stop offset="42%"  stop-color="#0c0c0e" stop-opacity="0.94"/>
         <stop offset="70%"  stop-color="#0c0c0e" stop-opacity="0.62"/>
         <stop offset="100%" stop-color="#0c0c0e" stop-opacity="0.28"/>
       </linearGradient>
     </defs>
     <rect width="${W}" height="${H}" fill="url(#s)"/>
   </svg>`,
);

await sharp(photo).composite([{ input: scrim }]).jpeg({ quality: 88 }).toFile(OUT);

const { channels } = await sharp(OUT).stats();
const left = await sharp(OUT).extract({ left: 0, top: 0, width: 420, height: H }).stats();
console.log(`wrote ${OUT}`);
console.log(
  `mean luminance overall ${Math.round(channels[0].mean)}, left third ${Math.round(left.channels[0].mean)}`,
);
if (left.channels[0].mean > 70) {
  console.error("Left third is too bright for white type — deepen the scrim.");
  process.exitCode = 1;
}
