import { type ReactNode } from 'react';
import { Phone, Mail, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarID } from '../AvatarID';
import { StatusBadge, statusTone, type Tone } from '../StatusDot';
import { Money } from '../RelativeTime';

/**
 * The record header: everything at a glance, and instant actions.
 * tel:/mailto:/https anchors — the phone's own dialler and mail app are
 * the integration. Rendered as real links so long-press menus work.
 */
export function RecordHeader({
  name,
  company,
  meta,
  stage,
  stageTone,
  stageLabel,
  value,
  phone,
  email,
  website,
  right,
  className,
}: {
  name: string;
  company?: string | null;
  meta?: string | null;
  stage?: string | null;
  stageTone?: Tone;
  stageLabel?: string;
  value?: number | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  right?: ReactNode;
  className?: string;
}) {
  const site = website
    ? /^https?:\/\//i.test(website)
      ? website
      : `https://${website}`
    : null;

  const act =
    'flex h-11 flex-1 items-center justify-center gap-2 rounded-[11px] border border-border/60 text-[12.5px] text-ink-2 transition-colors duration-150 hover:border-primary/40 hover:text-foreground';

  return (
    <header className={cn('border-b border-border/60', className)}>
      <div className="flex items-start gap-3 px-4 pt-4">
        <AvatarID name={name} email={email} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[19px] font-semibold tracking-[-0.02em]">
            {name}
          </h1>
          {(company || meta) && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {[company, meta].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        {right}
      </div>
      <div className="flex items-center justify-between px-4 pb-3 pt-3">
        {stage ? (
          <StatusBadge status={stage} tone={stageTone ?? statusTone(stage)} label={stageLabel} />
        ) : (
          <span />
        )}
        {value != null && value > 0 && <Money value={value} whole className="font-mono text-[15px]" />}
      </div>
      {(phone || email || site) && (
        <div className="flex gap-2 px-4 pb-4">
          {phone && (
            <a href={`tel:${phone.replace(/\s+/g, '')}`} className={act}>
              <Phone className="h-[15px] w-[15px]" /> Call
            </a>
          )}
          {email && (
            <a href={`mailto:${email}`} className={act}>
              <Mail className="h-[15px] w-[15px]" /> Email
            </a>
          )}
          {site && (
            <a href={site} target="_blank" rel="noopener noreferrer" className={act}>
              <Globe className="h-[15px] w-[15px]" /> Site
            </a>
          )}
        </div>
      )}
    </header>
  );
}

/**
 * The composed timeline: whatever the data already holds — notes, stage
 * changes, imports, calls — as one dot-rail ledger, newest first.
 */
export interface TimelineEvent {
  id: string;
  text: ReactNode;
  when: string;
  tone?: Tone;
}

export function RecordTimeline({
  events,
  empty = 'Nothing here yet. Notes and stage changes will appear as they happen.',
  className,
}: {
  events: TimelineEvent[];
  empty?: string;
  className?: string;
}) {
  if (!events.length) {
    return <p className={cn('px-4 py-6 text-[12.5px] text-muted-foreground', className)}>{empty}</p>;
  }
  return (
    <ol className={cn('px-4 py-3', className)}>
      {events.map((e, i) => (
        <li key={e.id} className="relative flex gap-3 py-2">
          {i < events.length - 1 && (
            <span aria-hidden className="absolute bottom-[-8px] left-[2.5px] top-[22px] w-px bg-border" />
          )}
          <span
            className={cn(
              'mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full',
              e.tone === 'ok' && 'bg-ok',
              e.tone === 'attend' && 'bg-attend',
              e.tone === 'risk' && 'bg-risk',
              e.tone === 'accent' && 'bg-primary',
              (!e.tone || e.tone === 'neutral') && 'bg-muted-foreground/50',
            )}
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] leading-snug">{e.text}</p>
            <span className="mt-0.5 block font-mono text-[9.5px] tabular-nums text-muted-foreground">
              {e.when}
            </span>
          </div>
        </li>
      ))}
    </ol>
  );
}
