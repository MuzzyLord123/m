/**
 * WCAG contrast audit over every text/background pair the design system
 * actually uses, including the semi-transparent whites laid over the accent.
 *
 *   node scripts/contrast-audit.mjs
 *
 * AA is 4.5:1 for body text and 3:1 for large text (>=18.66px bold or >=24px).
 * Anything that fails here is a real failure on the page, not a theoretical one.
 */

const TOKENS = {
  paper: "#fafaf8",
  plaster: "#edede9",
  plasterDeep: "#e2e2dd",
  ink: "#141414",
  inkSoft: "#4b4b47",
  inkMute: "#6a6a64",
  accent: "#1d4fd8",
  accentDeep: "#1740b0",
  accentInk: "#12308a",
  accentWash: "#eaeffc",
  white: "#ffffff",
};

function toRgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}

/** Flatten a translucent foreground onto its background first. */
function blend(hex, alpha, backgroundHex) {
  const fg = toRgb(hex);
  const bg = toRgb(backgroundHex);
  return fg.map((channel, i) => Math.round(channel * alpha + bg[i] * (1 - alpha)));
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(foreground, background) {
  const a = luminance(Array.isArray(foreground) ? foreground : toRgb(foreground));
  const b = luminance(Array.isArray(background) ? background : toRgb(background));
  const [light, dark] = a > b ? [a, b] : [b, a];
  return (light + 0.05) / (dark + 0.05);
}

/** [label, foreground, background, minimum] */
const PAIRS = [
  ["body copy — ink-soft on paper", TOKENS.inkSoft, TOKENS.paper, 4.5],
  ["body copy — ink-soft on plaster", TOKENS.inkSoft, TOKENS.plaster, 4.5],
  ["headings — ink on paper", TOKENS.ink, TOKENS.paper, 4.5],
  ["headings — ink on plaster", TOKENS.ink, TOKENS.plaster, 4.5],
  ["small print — ink-mute on paper", TOKENS.inkMute, TOKENS.paper, 4.5],
  ["small print — ink-mute on plaster", TOKENS.inkMute, TOKENS.plaster, 4.5],
  // plaster-deep carries no text anywhere on the site (it is a swatch block, a
  // strip of masking tape and an image placeholder), so it is not audited here.
  ["wordmark 'The' — ink/70 on paper", blend(TOKENS.ink, 0.7, TOKENS.paper), TOKENS.paper, 4.5],
  ["wordmark 'The' — ink/70 on plaster", blend(TOKENS.ink, 0.7, TOKENS.plaster), TOKENS.plaster, 4.5],
  ["wordmark 'The' — white/80 on accent", blend(TOKENS.white, 0.8, TOKENS.accent), TOKENS.accent, 4.5],
  ["links — accent on paper", TOKENS.accent, TOKENS.paper, 4.5],
  ["links — accent on plaster", TOKENS.accent, TOKENS.plaster, 4.5],
  ["chip text — accent-ink on accent-wash", TOKENS.accentInk, TOKENS.accentWash, 4.5],
  ["error text — accent-ink on paper", TOKENS.accentInk, TOKENS.paper, 4.5],
  ["error text — accent-ink on accent-wash", TOKENS.accentInk, TOKENS.accentWash, 4.5],
  ["primary button — white on accent", TOKENS.white, TOKENS.accent, 4.5],
  ["primary button hover — white on accent-deep", TOKENS.white, TOKENS.accentDeep, 4.5],
  ["CTA band body — white/85 on accent", blend(TOKENS.white, 0.85, TOKENS.accent), TOKENS.accent, 4.5],
  ["CTA band eyebrow — white/80 on accent", blend(TOKENS.white, 0.8, TOKENS.accent), TOKENS.accent, 4.5],
  ["menu socials — white/80 on accent", blend(TOKENS.white, 0.8, TOKENS.accent), TOKENS.accent, 4.5],
  ["menu contact — white/90 on accent", blend(TOKENS.white, 0.9, TOKENS.accent), TOKENS.accent, 4.5],
  ["menu numerals — white/80 on accent", blend(TOKENS.white, 0.8, TOKENS.accent), TOKENS.accent, 4.5],
  ["white pill on accent — accent-ink on white", TOKENS.accentInk, TOKENS.white, 4.5],
  ["scrim caption — white/75 on ink/90 over photo", blend(TOKENS.white, 0.75, "#232323"), "#232323", 4.5],
  ["gallery overlay — white/85 on ink/92", blend(TOKENS.white, 0.85, "#252525"), "#252525", 4.5],
];

let failures = 0;
for (const [label, fg, bg, minimum] of PAIRS) {
  const value = ratio(fg, bg);
  const pass = value >= minimum;
  if (!pass) failures += 1;
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${value.toFixed(2)}:1  (min ${minimum})  ${label}`,
  );
}

console.log(`\n${PAIRS.length - failures}/${PAIRS.length} pairs pass.`);
if (failures > 0) process.exitCode = 1;
