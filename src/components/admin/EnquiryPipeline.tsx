import { useMemo } from 'react';
import { cn } from '@/lib/utils';

/**
 * The enquiry pipeline, read off the enquiries themselves.
 *
 * Every number here is counted from rows that exist - no targets, no
 * conversion rates against invented baselines, no sparkline of made-up
 * history. Where the data has nothing to say (nobody filled in a
 * budget), the block says so instead of drawing an empty chart.
 */

export interface PipelineEnquiry {
  status: string;
  created_at: string;
  selected_package: string | null;
  budget: string | null;
  timeline: string | null;
  how_did_you_hear: string | null;
  company: string | null;
}

const LABEL = 'text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground/90';

const STAGES: Array<{ key: string; label: string; bar: string }> = [
  { key: 'new', label: 'New', bar: 'bg-attend' },
  { key: 'contacted', label: 'Contacted', bar: 'bg-ink-2' },
  { key: 'in-progress', label: 'In progress', bar: 'bg-primary' },
  { key: 'completed', label: 'Completed', bar: 'bg-ok' },
  { key: 'closed', label: 'Closed', bar: 'bg-muted-foreground/40' },
];

function tally(rows: PipelineEnquiry[], pick: (r: PipelineEnquiry) => string | null | undefined) {
  const map = new Map<string, number>();
  rows.forEach(r => {
    const raw = (pick(r) || '').trim();
    if (!raw) return;
    map.set(raw, (map.get(raw) || 0) + 1);
  });
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

/** A ranked breakdown, or an honest line when the field is unfilled. */
function Breakdown({ title, rows, total, empty }: {
  title: string;
  rows: Array<[string, number]>;
  total: number;
  empty: string;
}) {
  return (
    <section className="overflow-hidden rounded-[12px] border border-border/40 bg-card">
      <div className="border-b border-border/40 px-3.5 py-2">
        <p className={LABEL}>{title}</p>
      </div>
      {rows.length === 0 ? (
        <p className="px-3.5 py-6 text-center text-[12px] leading-relaxed text-muted-foreground">{empty}</p>
      ) : (
        <ul className="divide-y divide-border/30">
          {rows.slice(0, 6).map(([name, n]) => (
            <li key={name} className="px-3.5 py-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[12.5px]">{name}</span>
                <span className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
                  {n}
                  <span className="ml-1.5 text-[11px] opacity-70">{Math.round((n / total) * 100)}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-[3px] overflow-hidden rounded-full bg-foreground/[0.06]">
                <div className="h-full rounded-full bg-primary/70" style={{ width: `${(n / total) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function EnquiryPipeline({ enquiries, totalCount }: {
  enquiries: PipelineEnquiry[];
  totalCount: number;
}) {
  const m = useMemo(() => {
    const now = Date.now();
    const within = (days: number) =>
      enquiries.filter(e => now - new Date(e.created_at).getTime() <= days * 86400e3).length;

    const stages = STAGES.map(s => ({
      ...s,
      n: enquiries.filter(e => (e.status || '').toLowerCase() === s.key).length,
    }));
    const open = enquiries.filter(e => ['new', 'contacted', 'in-progress'].includes((e.status || '').toLowerCase()));

    // How long the oldest unanswered enquiry has been sitting. The number
    // that actually costs money.
    const oldestOpen = open.reduce<number | null>((acc, e) => {
      const age = Math.floor((now - new Date(e.created_at).getTime()) / 86400e3);
      return acc === null || age > acc ? age : acc;
    }, null);

    return {
      stages,
      open: open.length,
      week: within(7),
      month: within(30),
      oldestOpen,
      packages: tally(enquiries, e => e.selected_package),
      budgets: tally(enquiries, e => e.budget),
      sources: tally(enquiries, e => e.how_did_you_hear),
      timelines: tally(enquiries, e => e.timeline),
      loaded: enquiries.length,
    };
  }, [enquiries]);

  const peak = Math.max(1, ...m.stages.map(s => s.n));

  return (
    <div className="h-full overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
      {/* The position, in four numbers that mean something. */}
      <section className="overflow-hidden rounded-[12px] border border-border/40 bg-card">
        <div className="grid grid-cols-2 gap-px bg-border/40 lg:grid-cols-4">
          {[
            ['Open enquiries', String(m.open), 'Awaiting a reply or in progress'],
            ['Last 7 days', String(m.week), 'Arrived this week'],
            ['Last 30 days', String(m.month), 'Arrived this month'],
            ['Oldest waiting', m.oldestOpen === null ? '—' : `${m.oldestOpen}d`,
              m.oldestOpen === null ? 'Nothing open' : 'Longest an open enquiry has waited'],
          ].map(([label, value, sub], i) => (
            <div key={label} className="bg-card px-3.5 py-3">
              <p className={LABEL}>{label}</p>
              <p className={cn(
                'mt-1 font-display text-[20px] font-semibold tabular-nums leading-none tracking-[-0.02em]',
                i === 3 && m.oldestOpen !== null && m.oldestOpen >= 7 && 'text-risk',
                i === 3 && m.oldestOpen !== null && m.oldestOpen < 3 && 'text-ok',
              )}>
                {value}
              </p>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* The funnel, as bars rather than a decorative chart. */}
      <section className="mt-3 overflow-hidden rounded-[12px] border border-border/40 bg-card">
        <div className="flex items-baseline justify-between border-b border-border/40 px-3.5 py-2">
          <p className={LABEL}>Pipeline</p>
          <span className="text-[11px] text-muted-foreground">
            {totalCount > m.loaded ? `${m.loaded} of ${totalCount} loaded` : `${m.loaded} ${m.loaded === 1 ? 'enquiry' : 'enquiries'}`}
          </span>
        </div>
        <ul className="divide-y divide-border/30">
          {m.stages.map(s => (
            <li key={s.key} className="flex items-center gap-3 px-3.5 py-2.5">
              <span className="w-24 shrink-0 truncate text-[12.5px]">{s.label}</span>
              <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/[0.05]">
                <span className={cn('block h-full rounded-full', s.bar)} style={{ width: `${(s.n / peak) * 100}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right text-[12.5px] font-medium tabular-nums">{s.n}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* What people are asking for, and where they came from. */}
      <div className="mt-3 grid gap-3 lg:grid-cols-2 xl:grid-cols-4">
        <Breakdown title="Packages requested" rows={m.packages} total={m.loaded}
          empty="No package was chosen on any enquiry yet." />
        <Breakdown title="Budgets stated" rows={m.budgets} total={m.loaded}
          empty="Nobody has stated a budget yet." />
        <Breakdown title="How they found us" rows={m.sources} total={m.loaded}
          empty="The source field is unanswered on every enquiry so far." />
        <Breakdown title="Timelines" rows={m.timelines} total={m.loaded}
          empty="No timeline has been given yet." />
      </div>

      <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted-foreground">
        Counted from the enquiries themselves. Breakdowns ignore blank answers, so
        a share is a share of the people who answered that question — not of every
        enquiry.
      </p>
    </div>
  );
}

export default EnquiryPipeline;
