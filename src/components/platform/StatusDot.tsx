import { cn } from '@/lib/utils';

/**
 * The single status vocabulary for the whole platform: four muted tones,
 * rendered as dot + label. This replaces every per-screen rainbow map —
 * the raw status string from the database is passed through `statusTone`
 * and never assigned an ad-hoc colour again.
 */
export type Tone = 'ok' | 'attend' | 'risk' | 'neutral' | 'accent';

const TONE_DOT: Record<Tone, string> = {
  ok: 'bg-ok',
  attend: 'bg-attend',
  risk: 'bg-risk',
  neutral: 'bg-muted-foreground/50',
  accent: 'bg-primary',
};

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok',
  attend: 'text-attend',
  risk: 'text-risk',
  neutral: 'text-muted-foreground',
  accent: 'text-primary',
};

/** Canonical mapping from the status strings already in the database. */
const TONE_MAP: Record<string, Tone> = {
  // generic lifecycle
  live: 'ok', active: 'ok', delivered: 'ok', completed: 'ok', complete: 'ok',
  done: 'ok', paid: 'ok', approved: 'ok', published: 'ok', connected: 'ok',
  verified: 'ok', won: 'ok', resolved: 'ok', success: 'ok', posted: 'ok',
  reconciled: 'ok', matched: 'ok',
  // needs attention / in review
  review: 'attend', awaiting_feedback: 'attend', awaiting: 'attend',
  pending: 'attend', waiting: 'attend', due: 'attend', trial: 'attend',
  overdue_soon: 'attend', unpaid: 'attend', open: 'attend', invited: 'attend',
  qualified: 'attend', proposal: 'attend', negotiation: 'attend',
  // risk
  overdue: 'risk', failed: 'risk', error: 'risk', blocked: 'risk',
  cancelled: 'risk', canceled: 'risk', rejected: 'risk', lost: 'risk',
  urgent: 'risk', suspended: 'risk', void: 'risk', disputed: 'risk',
  // in motion (accent = the one live thing)
  in_progress: 'accent', development: 'accent', building: 'accent',
  testing: 'accent', deploying: 'accent', syncing: 'accent',
  // quiet
  draft: 'neutral', design: 'neutral', new: 'neutral', queued: 'neutral',
  archived: 'neutral', inactive: 'neutral', closed: 'neutral',
  not_published: 'neutral', contacted: 'neutral', engaged: 'neutral',
  unmatched: 'neutral', ignored: 'neutral',
};

export function statusTone(status: string | null | undefined): Tone {
  if (!status) return 'neutral';
  return TONE_MAP[status.toLowerCase().replace(/[\s-]+/g, '_')] ?? 'neutral';
}

/** Human label from a raw status string: 'awaiting_feedback' → 'Awaiting feedback'. */
export function statusLabel(status: string | null | undefined): string {
  if (!status) return '';
  const s = status.replace(/[_-]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function StatusDot({ tone, className }: { tone: Tone; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone], className)}
    />
  );
}

/**
 * Dot + label. `status` is the raw database string; tone and label are
 * derived unless overridden.
 */
export function StatusBadge({
  status,
  tone,
  label,
  className,
}: {
  status?: string | null;
  tone?: Tone;
  label?: string;
  className?: string;
}) {
  const t = tone ?? statusTone(status);
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs', TONE_TEXT[t], className)}>
      <StatusDot tone={t} />
      {label ?? statusLabel(status)}
    </span>
  );
}
