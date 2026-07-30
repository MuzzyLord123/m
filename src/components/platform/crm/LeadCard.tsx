import { useRef, useState, type ReactNode } from 'react';
import { Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarID } from '../AvatarID';
import { StatusDot, statusLabel, statusTone, type Tone } from '../StatusDot';
import { RelativeTime, Money } from '../RelativeTime';

/**
 * The mobile lead card: name, company, stage dot, value, last activity —
 * one thumb, 44px+ target. Optional swipe-left reveals a single action
 * (call by default) driven entirely by an existing handler; no swipe
 * handler means a plain tap card. Presentation only.
 */
export interface LeadCardData {
  id: string;
  name: string;
  company?: string | null;
  stage?: string | null;
  stageTone?: Tone;
  value?: number | null;
  lastActivity?: string | Date | null;
  email?: string | null;
  phone?: string | null;
}

export function LeadCard({
  lead,
  onOpen,
  onSwipeAction,
  swipeLabel = 'Call',
  swipeIcon,
  selected = false,
}: {
  lead: LeadCardData;
  onOpen: (lead: LeadCardData) => void;
  /** Existing action only (e.g. tel: link trigger). Enables swipe-left. */
  onSwipeAction?: (lead: LeadCardData) => void;
  swipeLabel?: string;
  swipeIcon?: ReactNode;
  selected?: boolean;
}) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const REVEAL = 84;

  const onTouchStart = (e: React.TouchEvent) => {
    if (!onSwipeAction) return;
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!onSwipeAction || !start.current) return;
    const ddx = e.touches[0].clientX - start.current.x;
    const ddy = e.touches[0].clientY - start.current.y;
    if (Math.abs(ddy) > Math.abs(ddx)) return; // vertical scroll wins
    setDx(Math.max(-REVEAL, Math.min(0, ddx)));
  };
  const onTouchEnd = () => {
    if (!onSwipeAction) return;
    setDx((d) => (d < -REVEAL / 2 ? -REVEAL : 0));
    start.current = null;
  };

  return (
    <div className="relative overflow-hidden border-b border-border/60">
      {onSwipeAction && (
        <button
          type="button"
          onClick={() => {
            setDx(0);
            onSwipeAction(lead);
          }}
          className="absolute inset-y-0 right-0 flex w-[84px] flex-col items-center justify-center gap-1 bg-primary text-[10px] font-semibold text-primary-foreground"
          tabIndex={dx === -REVEAL ? 0 : -1}
          aria-hidden={dx !== -REVEAL}
        >
          {swipeIcon ?? <Phone className="h-4 w-4" />}
          {swipeLabel}
        </button>
      )}
      <button
        type="button"
        onClick={() => (dx === 0 ? onOpen(lead) : setDx(0))}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateX(${dx}px)` }}
        className={cn(
          'flex min-h-[64px] w-full items-center gap-3 bg-background px-4 py-3 text-left transition-transform duration-150 ease-out',
          selected && 'bg-primary/[0.05]',
        )}
      >
        <AvatarID name={lead.name} email={lead.email} size="lg" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-medium tracking-[-0.01em] text-foreground">
            {lead.name}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-muted-foreground">
            <StatusDot tone={lead.stageTone ?? statusTone(lead.stage)} />
            {[lead.company, statusLabel(lead.stage)].filter(Boolean).join(' · ')}
          </span>
        </span>
        <span className="shrink-0 text-right">
          {lead.value != null && lead.value > 0 && (
            <Money value={lead.value} whole className="block font-mono text-xs" />
          )}
          {lead.lastActivity && <RelativeTime date={lead.lastActivity} className="mt-0.5 block" />}
        </span>
      </button>
    </div>
  );
}
