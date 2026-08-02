import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { identityFor } from './officeIdentity';

/**
 * The app's mark: a graphite squircle with the glyph drawn in a
 * whisper of the app's own hue.
 *
 * Loud solid tiles read as a toy; no colour at all reads as a wireframe.
 * The premium register sits between: the surface is neutral - a quiet
 * lift off the page with a pressed highlight - and identity arrives
 * only through the ink of the glyph, desaturated to the point of
 * suggestion. Twenty-five of these sit together like a set of
 * instruments rather than a bag of sweets.
 *
 * This is still the only component in Office allowed to reference an
 * app's colour.
 */
export function AppTile({ id, icon: Icon, size = 32, className }: {
  id: string;
  icon: LucideIcon;
  size?: number;
  className?: string;
}) {
  const { hue } = identityFor(id);
  const [h, s] = hue.split(' ');
  const sat = Math.min(parseInt(s, 10) || 0, 34);
  const glyph = Math.round(size * 0.5);
  return (
    <span
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center', className)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(6, Math.round(size * 0.28)),
        background: 'linear-gradient(180deg, hsl(var(--foreground) / 0.085), hsl(var(--foreground) / 0.04))',
        boxShadow: 'inset 0 1px 0 hsl(var(--foreground) / 0.07), inset 0 0 0 1px hsl(var(--foreground) / 0.06)',
        color: `hsl(${h} ${sat}% var(--office-glyph-l, 70%))`,
      }}
    >
      <Icon style={{ width: glyph, height: glyph }} strokeWidth={size < 26 ? 2 : 1.7} />
    </span>
  );
}

export default AppTile;
