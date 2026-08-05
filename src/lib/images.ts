/**
 * Blur placeholders. Every image on the site declares its dimensions and a
 * blur-up tone, so nothing reflows once the photograph arrives — CLS stays flat
 * even on a cold cache over 3G.
 */
export function blurTone(hex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="${hex}"/></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export const ASPECT = {
  "4:5": "aspect-[4/5]",
  "16:9": "aspect-[16/9]",
  "1:1": "aspect-square",
  "3:2": "aspect-[3/2]",
  "3:4": "aspect-[3/4]",
  "4:3": "aspect-[4/3]",
} as const;

export type AspectRatio = keyof typeof ASPECT;
