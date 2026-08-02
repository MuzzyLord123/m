import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { identityFor } from './officeIdentity';

/**
 * The app's mark: a solid tile of the app's own colour with the glyph
 * knocked out in white, the way real product icons are pressed - a
 * Word square, an Excel square. The faint top highlight and inner
 * hairline are what make it read as a manufactured object instead of
 * an icon sitting in a tinted box.
 *
 * This is the only component in Office allowed to paint an app colour.
 * Everything around it stays neutral chrome, which is precisely why
 * twenty-five colours read as one product line rather than a paintbox.
 */
export function AppTile({ id, icon: Icon, size = 32, className }: {
  id: string;
  icon: LucideIcon;
  size?: number;
  className?: string;
}) {
  const { hue } = identityFor(id);
  const glyph = Math.round(size * 0.54);
  return (
    <span
      aria-hidden
      className={cn('flex shrink-0 items-center justify-center text-white', className)}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(5, Math.round(size * 0.24)),
        background: `hsl(${hue})`,
        boxShadow: 'inset 0 1px 0 hsl(0 0% 100% / 0.16), inset 0 0 0 1px hsl(0 0% 100% / 0.06)',
      }}
    >
      <Icon style={{ width: glyph, height: glyph }} strokeWidth={size < 26 ? 2.2 : 1.9} />
    </span>
  );
}

export default AppTile;
