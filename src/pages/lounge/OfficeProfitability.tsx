import { useCallback, useEffect, useMemo, useState } from 'react';
import { PoundSterling, ChevronRight, ArrowUpDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { SkeletonLedger } from '@/components/platform';
import { OfficeModuleBand, OfficeContent, OfficeEmpty } from '@/pages/lounge/office/ModuleShell';

/**
 * Profitability.
 *
 * Every other tool in the suite answers "what happened". This answers
 * the only question that decides whether the business survives: did
 * that job make money.
 *
 * It invents nothing. Billable time already carries an hourly rate in
 * Time, and expenses already carry a project in Expenses - this reads
 * both, groups them by the project name they share, and does the
 * subtraction nobody was doing. Work with no project tag is gathered
 * honestly under "Untagged" rather than silently dropped, because a
 * margin that quietly omits costs is worse than no margin at all.
 */

interface TimeRow { project: string | null; duration_minutes: number | null; billable: boolean | null; rate: number | null }
interface CostRow { project: string | null; amount: number | null; status: string | null }

interface Job {
  project: string;
  hours: number;
  billableHours: number;
  revenue: number;
  cost: number;
  margin: number;
  marginPct: number | null;
}

type SortKey = 'margin' | 'revenue' | 'cost' | 'hours';

const LABEL = 'text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground/90';
const UNTAGGED = 'Untagged';

const money = (n: number) =>
  `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function OfficeProfitability() {
  const { user } = useAuth();
  const [times, setTimes] = useState<TimeRow[]>([]);
  const [costs, setCosts] = useState<CostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('margin');

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const [t, e] = await Promise.all([
        supabase.from('time_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      setTimes(((t.data as any[]) || []) as TimeRow[]);
      setCosts(((e.data as any[]) || []) as CostRow[]);
      setLoading(false);
    })();
  }, [user]);

  const jobs = useMemo<Job[]>(() => {
    const map = new Map<string, Job>();
    const seed = (name: string): Job => {
      const key = name.trim() || UNTAGGED;
      if (!map.has(key)) {
        map.set(key, { project: key, hours: 0, billableHours: 0, revenue: 0, cost: 0, margin: 0, marginPct: null });
      }
      return map.get(key)!;
    };

    times.forEach(t => {
      const j = seed(t.project || UNTAGGED);
      const hours = (Number(t.duration_minutes) || 0) / 60;
      j.hours += hours;
      if (t.billable) {
        j.billableHours += hours;
        j.revenue += hours * (Number(t.rate) || 0);
      }
    });

    // Rejected expenses never leave the business, so they are not a cost.
    costs.filter(c => c.status !== 'rejected').forEach(c => {
      const j = seed(c.project || UNTAGGED);
      j.cost += Number(c.amount) || 0;
    });

    return [...map.values()].map(j => {
      const margin = j.revenue - j.cost;
      return { ...j, margin, marginPct: j.revenue > 0 ? (margin / j.revenue) * 100 : null };
    });
  }, [times, costs]);

  const sorted = useMemo(() => {
    const by: Record<SortKey, (a: Job, b: Job) => number> = {
      margin: (a, b) => b.margin - a.margin,
      revenue: (a, b) => b.revenue - a.revenue,
      cost: (a, b) => b.cost - a.cost,
      hours: (a, b) => b.hours - a.hours,
    };
    return [...jobs].sort(by[sort]);
  }, [jobs, sort]);

  const total = useMemo(() => sorted.reduce((acc, j) => ({
    hours: acc.hours + j.hours,
    revenue: acc.revenue + j.revenue,
    cost: acc.cost + j.cost,
    margin: acc.margin + j.margin,
  }), { hours: 0, revenue: 0, cost: 0, margin: 0 }), [sorted]);

  const totalPct = total.revenue > 0 ? (total.margin / total.revenue) * 100 : null;

  const cycleSort = useCallback(() => {
    const order: SortKey[] = ['margin', 'revenue', 'cost', 'hours'];
    setSort(s => order[(order.indexOf(s) + 1) % order.length]);
  }, []);

  const COLS = 'grid-cols-[minmax(0,1fr)_84px_96px] sm:grid-cols-[minmax(0,1fr)_84px_112px_112px_112px_84px]';

  const Tone = ({ value }: { value: number }) => (
    <span className={cn('tabular-nums', value > 0 ? 'text-ok' : value < 0 ? 'text-risk' : 'text-muted-foreground')}>
      {value < 0 ? `−${money(Math.abs(value))}` : money(value)}
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      <OfficeModuleBand
        appId="profitability"
        icon={PoundSterling}
        title="Profitability"
        context={jobs.length ? `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'}` : undefined}
      >
        <button
          onClick={cycleSort}
          className="flex h-8 items-center gap-1.5 rounded-[7px] px-2.5 text-[12px] text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.05] hover:text-foreground"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          <span className="capitalize">{sort}</span>
        </button>
      </OfficeModuleBand>

      <OfficeContent wide>
        {loading ? (
          <div className="overflow-hidden rounded-[14px] border border-border/40 bg-card"><SkeletonLedger rows={6} /></div>
        ) : jobs.length === 0 ? (
          <OfficeEmpty
            title="Nothing to measure yet"
            body="Log billable time with an hourly rate in Time, and tag expenses to the same project name in Expenses. This page does the subtraction."
          />
        ) : (
          <>
            {/* The position, stated once. */}
            <section className="overflow-hidden rounded-[14px] border border-border/40 bg-card">
              <div className="grid grid-cols-2 gap-px bg-border/40 sm:grid-cols-4">
                {[
                  ['Billable value', money(total.revenue), `${total.hours.toFixed(1)} hours logged`],
                  ['Costs', money(total.cost), 'Expenses tagged to jobs'],
                  ['Margin', total.margin < 0 ? `−${money(Math.abs(total.margin))}` : money(total.margin), totalPct === null ? 'No billable value yet' : `${totalPct.toFixed(1)}% of billable value`],
                  ['Jobs', String(jobs.length), 'Grouped by project name'],
                ].map(([label, value, sub], i) => (
                  <div key={label} className="bg-card px-4 py-3.5">
                    <p className={LABEL}>{label}</p>
                    <p className={cn(
                      'mt-1 font-display text-[19px] font-semibold tabular-nums leading-none tracking-[-0.02em]',
                      i === 2 && (total.margin > 0 ? 'text-ok' : total.margin < 0 ? 'text-risk' : ''),
                    )}>
                      {value}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{sub}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Job by job. */}
            <section className="mt-6">
              <div className="mb-3 flex items-baseline gap-2.5 px-1">
                <h2 className="text-[13.5px] font-semibold tracking-[-0.01em]">By job</h2>
                <span className="text-[11.5px] text-muted-foreground">Highest {sort} first</span>
              </div>

              <div className="overflow-hidden rounded-[14px] border border-border/40 bg-card">
                <div className={cn('grid gap-3 border-b border-border/40 px-4 py-2', COLS)}>
                  <span className={LABEL}>Job</span>
                  <span className={cn(LABEL, 'text-right')}>Hours</span>
                  <span className={cn(LABEL, 'hidden text-right sm:block')}>Billable</span>
                  <span className={cn(LABEL, 'hidden text-right sm:block')}>Costs</span>
                  <span className={cn(LABEL, 'text-right')}>Margin</span>
                  <span className={cn(LABEL, 'hidden text-right sm:block')}>%</span>
                </div>
                <ul>
                  {sorted.map(j => (
                    <li key={j.project} className="border-b border-border/30 last:border-b-0">
                      <div className={cn('grid items-center gap-3 px-4 py-2.5', COLS)}>
                        <span className="min-w-0">
                          <span className={cn('block truncate text-[13px] font-medium', j.project === UNTAGGED && 'text-muted-foreground')}>
                            {j.project}
                          </span>
                          <span className="block truncate text-[11px] text-muted-foreground sm:hidden">
                            {money(j.revenue)} billable · {money(j.cost)} costs
                          </span>
                        </span>
                        <span className="text-right text-[12.5px] tabular-nums text-muted-foreground">{j.hours.toFixed(1)}</span>
                        <span className="hidden text-right text-[12.5px] tabular-nums text-muted-foreground sm:block">{money(j.revenue)}</span>
                        <span className="hidden text-right text-[12.5px] tabular-nums text-muted-foreground sm:block">{money(j.cost)}</span>
                        <span className="text-right text-[13px] font-medium"><Tone value={j.margin} /></span>
                        <span className={cn(
                          'hidden text-right text-[12.5px] tabular-nums sm:block',
                          j.marginPct === null ? 'text-muted-foreground' : j.marginPct >= 0 ? 'text-ok' : 'text-risk',
                        )}>
                          {j.marginPct === null ? '—' : `${j.marginPct.toFixed(0)}%`}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-3 px-1 text-[11.5px] leading-relaxed text-muted-foreground">
                Billable value is logged hours multiplied by the rate on each time entry — it is what
                the work is worth, not what has been invoiced or paid. Costs are expenses tagged to
                the same project name; rejected expenses are excluded. Time and expenses that carry no
                project appear as {UNTAGGED} so nothing is quietly left out of the total.
              </p>
            </section>
          </>
        )}
      </OfficeContent>
    </div>
  );
}
