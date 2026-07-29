import { useEffect, useState } from 'react';
import { formatDistanceToNowStrict, format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * Relative timestamps everywhere, exact datetime on hover. en-GB exact
 * format; refreshes each minute so "2 min ago" never goes stale.
 */
export function RelativeTime({
  date,
  className,
  addSuffix = true,
}: {
  date: string | number | Date | null | undefined;
  className?: string;
  addSuffix?: boolean;
}) {
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!date) return null;
  const d = new Date(date);
  if (!isValid(d)) return null;

  return (
    <time
      dateTime={d.toISOString()}
      title={format(d, "EEE d MMM yyyy, HH:mm")}
      className={cn('font-mono text-[10.5px] tabular-nums text-muted-foreground', className)}
    >
      {formatDistanceToNowStrict(d, { addSuffix })}
    </time>
  );
}

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' });
const gbpWhole = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
});

/** £ figures: en-GB, tabular. `whole` drops pence for round amounts. */
export function Money({
  value,
  whole = false,
  className,
}: {
  value: number | string | null | undefined;
  whole?: boolean;
  className?: string;
}) {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (n == null || Number.isNaN(n)) return null;
  return (
    <span className={cn('tabular-nums', className)}>
      {(whole && Number.isInteger(n) ? gbpWhole : gbp).format(n)}
    </span>
  );
}
