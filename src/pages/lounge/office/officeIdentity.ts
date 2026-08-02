/**
 * Quooro Office identity.
 *
 * What makes a suite look manufactured rather than generated is where
 * the colour lives. Microsoft's suite is colourful, but only the app
 * marks themselves carry it - Word's blue, Excel's green - as solid,
 * deep, printed pigments, while every surface around them stays neutral
 * chrome. The moment colour leaks into card backgrounds, borders and
 * glows, the whole thing reads as decoration.
 *
 * So: every app owns one deep solid colour, stated as a raw HSL triplet.
 * It is used in exactly one place - the app's icon tile (see AppTile) -
 * and nowhere else. Hues are grouped by what the app is for, so the
 * suite files by family: documents in blues, money in greens, build in
 * warm tones, thinking tools in violets, utilities in slate. Lightness
 * sits at 32-54% so a white glyph prints cleanly on every tile.
 */

export interface OfficeIdentity {
  /** HSL triplet, no wrapper: "214 58% 44%". */
  hue: string;
  /** What the app is for, in the family it belongs to. */
  family: 'Documents' | 'Money' | 'Communicate' | 'Build' | 'Think' | 'Run' | 'Utilities';
}

export const OFFICE_IDENTITY: Record<string, OfficeIdentity> = {
  // Documents - blues, the paper end of the suite
  docs: { hue: '214 58% 44%', family: 'Documents' },
  notes: { hue: '224 50% 50%', family: 'Documents' },
  files: { hue: '201 65% 42%', family: 'Documents' },
  pdf: { hue: '4 62% 47%', family: 'Documents' },
  wiki: { hue: '188 55% 37%', family: 'Documents' },

  // Money - greens, because they all end in a number
  sheets: { hue: '150 50% 34%', family: 'Money' },
  invoices: { hue: '160 48% 36%', family: 'Money' },
  accounting: { hue: '142 42% 38%', family: 'Money' },
  expenses: { hue: '168 45% 34%', family: 'Money' },
  'time-tracker': { hue: '174 48% 32%', family: 'Money' },
  profitability: { hue: '156 54% 30%', family: 'Money' },

  // Communicate - the outside world reaching in
  mail: { hue: '206 58% 44%', family: 'Communicate' },
  calendar: { hue: '198 52% 40%', family: 'Communicate' },
  bookings: { hue: '192 50% 38%', family: 'Communicate' },
  'team-comms': { hue: '212 46% 46%', family: 'Communicate' },

  // Build - warm, the making end
  design: { hue: '22 78% 46%', family: 'Build' },
  slides: { hue: '10 64% 47%', family: 'Build' },
  whiteboard: { hue: '32 72% 43%', family: 'Build' },
  ecommerce: { hue: '38 70% 41%', family: 'Build' },

  // Think - violets, for shaping and deciding
  analytics: { hue: '262 46% 52%', family: 'Think' },
  forms: { hue: '272 44% 50%', family: 'Think' },
  polls: { hue: '286 40% 48%', family: 'Think' },

  // Run - the business itself
  operations: { hue: '246 44% 54%', family: 'Run' },
  hr: { hue: '330 48% 46%', family: 'Run' },
  contracts: { hue: '344 52% 45%', family: 'Run' },
  tasks: { hue: '236 46% 54%', family: 'Run' },
  inventory: { hue: '260 40% 50%', family: 'Run' },

  // Utilities - slate, deliberately quiet
  passwords: { hue: '210 12% 44%', family: 'Utilities' },
};

const FALLBACK: OfficeIdentity = { hue: '17 80% 44%', family: 'Utilities' };

export const identityFor = (id: string): OfficeIdentity => OFFICE_IDENTITY[id] || FALLBACK;

/** The app's colour as a paintable value - for the icon tile only. */
export function accentOf(id: string) {
  return `hsl(${identityFor(id).hue})`;
}

export const OFFICE_FAMILIES = [
  'Documents', 'Money', 'Communicate', 'Build', 'Think', 'Run', 'Utilities',
] as const;
