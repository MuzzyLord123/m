/**
 * Quooro Office identity.
 *
 * A suite is a family of products, not one product repeated: Docs and
 * Accounting should not look like the same tool wearing a different
 * icon. Every app therefore owns a hue, and that hue is the only place
 * colour enters the interface - the tile, the app's own header rule,
 * its active states. Everything else stays the platform's dark ground
 * and hairlines, so twenty-five colours read as one suite rather than
 * a paintbox.
 *
 * Hues are grouped by what the app is for, so the wall reads by family
 * before it reads by name: documents in blues, money in greens, build
 * and design in warm tones, thinking tools in violets, utilities in
 * slate. Each is stated as a raw HSL triplet so it can be used at any
 * opacity without a second variable.
 */

export interface OfficeIdentity {
  /** HSL triplet, no wrapper: "212 72% 56%". */
  hue: string;
  /** What the app is for, in the family it belongs to. */
  family: 'Documents' | 'Money' | 'Build' | 'Think' | 'Run' | 'Utilities';
}

export const OFFICE_IDENTITY: Record<string, OfficeIdentity> = {
  // Documents - blues, the paper end of the suite
  docs: { hue: '212 72% 56%', family: 'Documents' },
  notes: { hue: '224 62% 60%', family: 'Documents' },
  files: { hue: '199 76% 52%', family: 'Documents' },
  pdf: { hue: '4 68% 56%', family: 'Documents' },
  wiki: { hue: '188 60% 46%', family: 'Documents' },

  // Money - greens, because they all end in a number
  sheets: { hue: '150 52% 44%', family: 'Money' },
  invoices: { hue: '160 58% 42%', family: 'Money' },
  accounting: { hue: '142 46% 46%', family: 'Money' },
  expenses: { hue: '168 48% 44%', family: 'Money' },
  'time-tracker': { hue: '174 52% 42%', family: 'Money' },

  // Build - warm, the making end
  design: { hue: '22 84% 54%', family: 'Build' },
  slides: { hue: '14 78% 56%', family: 'Build' },
  whiteboard: { hue: '32 82% 52%', family: 'Build' },
  ecommerce: { hue: '38 76% 50%', family: 'Build' },

  // Think - violets, for shaping and deciding
  analytics: { hue: '262 62% 62%', family: 'Think' },
  forms: { hue: '272 56% 60%', family: 'Think' },
  polls: { hue: '286 52% 58%', family: 'Think' },
  sticky: { hue: '300 48% 58%', family: 'Think' },

  // Run - the business itself
  operations: { hue: '246 58% 62%', family: 'Run' },
  hr: { hue: '330 56% 58%', family: 'Run' },
  contracts: { hue: '344 58% 56%', family: 'Run' },
  tasks: { hue: '236 56% 62%', family: 'Run' },

  // Utilities - slate, deliberately quiet
  passwords: { hue: '210 14% 56%', family: 'Utilities' },
  calculator: { hue: '215 12% 52%', family: 'Utilities' },
  pomodoro: { hue: '206 16% 54%', family: 'Utilities' },
};

const FALLBACK: OfficeIdentity = { hue: '17 88% 45%', family: 'Utilities' };

export const identityFor = (id: string): OfficeIdentity => OFFICE_IDENTITY[id] || FALLBACK;

/** The tile: a wash of the app's own hue, never a flat fill. */
export function tileStyle(id: string) {
  const { hue } = identityFor(id);
  return {
    background: `linear-gradient(155deg, hsl(${hue} / 0.16), hsl(${hue} / 0.04) 62%, transparent)`,
    borderColor: `hsl(${hue} / 0.28)`,
  } as const;
}

export function glyphStyle(id: string) {
  const { hue } = identityFor(id);
  return {
    background: `hsl(${hue} / 0.14)`,
    color: `hsl(${hue})`,
    boxShadow: `inset 0 0 0 1px hsl(${hue} / 0.3)`,
  } as const;
}

export function accentOf(id: string) {
  return `hsl(${identityFor(id).hue})`;
}

export const OFFICE_FAMILIES = [
  'Documents', 'Money', 'Build', 'Think', 'Run', 'Utilities',
] as const;
