/**
 * WCAG contrast audit over every text/background pair the design system
 * actually uses, including the semi-transparent inks laid over the accent.
 *
 *   node scripts/contrast-audit.mjs
 *
 * AA is 4.5:1 for body text and 3:1 for large text (>=18.66px bold or >=24px).
 * Anything that fails here is a real failure on the page, not a theoretical one.
 *
 * TOKENS ARE READ FROM globals.css, not copied here. They used to be a
 * duplicated literal, and that literal was never updated when the site was
 * rebranded — so the audit spent two rebrands cheerfully passing 24/24 against
 * Wet Paint Blue on a white page while the site was orange, and then black and
 * orange. A checker that does not read the thing it checks is worse than no
 * checker, because it is trusted.
 */
import fs from "node:fs";

const css = fs.readFileSync("src/app/globals.css", "utf8");

/** Pull a --color-* value straight out of the @theme block. */
function token(name) {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{3,8})`).exec(css);
  if (!match) throw new Error(`--color-${name} not found in globals.css`);
  return match[1];
}

const TOKENS = {
  paper: token("paper"),
  plaster: token("plaster"),
  plasterDeep: token("plaster-deep"),
  ink: token("ink"),
  inkSoft: token("ink-soft"),
  inkMute: token("ink-mute"),
  accent: token("accent"),
  accentBright: token("accent-bright"),
  accentDeep: token("accent-deep"),
  accentInk: token("accent-ink"),
  accentWash: token("accent-wash"),
  onAccent: token("on-accent"),
  scrim: token("scrim"),
  white: "#ffffff",
};

/** Accepts a hex string or an already-resolved [r,g,b], so blends can nest —
    a caption sits on a scrim which itself sits on a photograph. */
function toRgb(hex) {
  if (Array.isArray(hex)) return hex;
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
  // Body and headings on the three surfaces
  ["headings — ink on paper", TOKENS.ink, TOKENS.paper, 4.5],
  ["headings — ink on plaster", TOKENS.ink, TOKENS.plaster, 4.5],
  ["headings — ink on plaster-deep", TOKENS.ink, TOKENS.plasterDeep, 4.5],
  ["body copy — ink-soft on paper", TOKENS.inkSoft, TOKENS.paper, 4.5],
  ["body copy — ink-soft on plaster", TOKENS.inkSoft, TOKENS.plaster, 4.5],
  ["body copy — ink-soft on plaster-deep", TOKENS.inkSoft, TOKENS.plasterDeep, 4.5],
  ["small print — ink-mute on paper", TOKENS.inkMute, TOKENS.paper, 4.5],
  ["small print — ink-mute on plaster", TOKENS.inkMute, TOKENS.plaster, 4.5],

  // The accent as text — the whole point of going dark
  ["links — accent on paper", TOKENS.accent, TOKENS.paper, 4.5],
  ["links — accent on plaster", TOKENS.accent, TOKENS.plaster, 4.5],
  ["links — accent on plaster-deep", TOKENS.accent, TOKENS.plasterDeep, 4.5],
  ["chip text — accent-ink on accent-wash", TOKENS.accentInk, TOKENS.accentWash, 4.5],
  ["error text — accent-ink on paper", TOKENS.accentInk, TOKENS.paper, 4.5],

  // Anything sitting ON the orange takes on-accent, never white
  ["primary button — on-accent on accent", TOKENS.onAccent, TOKENS.accent, 4.5],
  ["primary hover — on-accent on accent-bright", TOKENS.onAccent, TOKENS.accentBright, 4.5],
  // accent-deep carries no text: it is a border and pressed-tint colour only.
  // It reaches 4.22:1 against ink, so hover lifts to accent-bright instead.
  ["hover — on-accent on accent-bright", TOKENS.onAccent, TOKENS.accentBright, 4.5],
  ["flood menu links — on-accent on accent", TOKENS.onAccent, TOKENS.accent, 4.5],
  ["flood menu contact — on-accent/85 on accent", blend(TOKENS.onAccent, 0.85, TOKENS.accent), TOKENS.accent, 4.5],
  ["flood menu numerals — on-accent/85 on accent", blend(TOKENS.onAccent, 0.85, TOKENS.accent), TOKENS.accent, 4.5],
  ["flood menu eyebrow — on-accent/85 on accent", blend(TOKENS.onAccent, 0.85, TOKENS.accent), TOKENS.accent, 4.5],
  ["flood menu CTA — accent on on-accent pill", TOKENS.accent, TOKENS.onAccent, 4.5],

  // The full-bleed orange CTA band. These pairs were NOT audited, and the band
  // shipped as white on orange at 2.9:1 — a straight AA failure on the site's
  // most important call to action. Audited now.
  ["CTA band heading — on-accent on accent", TOKENS.onAccent, TOKENS.accent, 4.5],
  ["CTA band body — on-accent/85 on accent", blend(TOKENS.onAccent, 0.85, TOKENS.accent), TOKENS.accent, 4.5],
  ["CTA band eyebrow — on-accent/85 on accent", blend(TOKENS.onAccent, 0.85, TOKENS.accent), TOKENS.accent, 4.5],
  ["CTA band pill — accent on on-accent", TOKENS.accent, TOKENS.onAccent, 4.5],
  ["chat launcher glyph — on-accent on accent-bright", TOKENS.onAccent, TOKENS.accentBright, 4.5],
  ["guarantee band label — on-accent on accent", TOKENS.onAccent, TOKENS.accent, 4.5],
  ["guarantee band note — on-accent/80 on accent", blend(TOKENS.onAccent, 0.8, TOKENS.accent), TOKENS.accent, 4.5],

  // Text laid over photographs, on the theme-independent scrim
  ["gallery caption — white on scrim/90 over photo", TOKENS.white, blend(TOKENS.scrim, 0.9, "#8b847b"), 4.5],
  ["gallery caption — white/80 on scrim/90", blend(TOKENS.white, 0.8, blend(TOKENS.scrim, 0.9, "#8b847b")), blend(TOKENS.scrim, 0.9, "#8b847b"), 4.5],
  ["hover overlay — white/85 on scrim/92", blend(TOKENS.white, 0.85, blend(TOKENS.scrim, 0.92, "#737070")), blend(TOKENS.scrim, 0.92, "#737070"), 4.5],
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
