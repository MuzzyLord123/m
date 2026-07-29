import { cn } from '@/lib/utils';

/**
 * The platform's identity mark: initials in brand tones with a
 * deterministic tone per name, photo when one exists. No gradients,
 * no icon eggs.
 */
const TONES = [
  'bg-primary/12 text-primary',
  'bg-gold/15 text-[hsl(var(--gold))]',
  'bg-foreground/8 text-ink-2',
] as const;

const SIZES = {
  sm: 'h-6 w-6 text-[9px]',
  md: 'h-7 w-7 text-[10px]',
  lg: 'h-9 w-9 text-xs',
  xl: 'h-12 w-12 text-sm',
} as const;

export function initialsOf(name: string | null | undefined, email?: string | null): string {
  const source = (name || '').trim() || (email || '').split('@')[0];
  if (!source) return '·';
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function toneOf(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

export function AvatarID({
  name,
  email,
  src,
  size = 'md',
  className,
}: {
  name?: string | null;
  email?: string | null;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const label = name || email || '';
  if (src) {
    return (
      <img
        src={src}
        alt={label}
        className={cn('shrink-0 rounded-full object-cover', SIZES[size], className)}
      />
    );
  }
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        'flex shrink-0 select-none items-center justify-center rounded-full font-semibold tracking-[0.02em]',
        SIZES[size],
        toneOf(label || 'q'),
        className,
      )}
    >
      {initialsOf(name, email)}
    </span>
  );
}
