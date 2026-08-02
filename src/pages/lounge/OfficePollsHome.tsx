import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RelativeTime, SkeletonLedger } from '@/components/platform';
import { OfficeModuleBand, OfficeContent, OfficeEmpty } from '@/pages/lounge/office/ModuleShell';
import { AppTile } from '@/pages/lounge/office/AppTile';

/**
 * The polls lobby. Reads the same table the polls workspace reads -
 * real questions, real states - or says honestly that there are none.
 */

interface PollRow { id: string; question: string; is_active: boolean; created_at: string }

const LABEL = 'text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground/90';

export default function OfficePollsHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [polls, setPolls] = useState<PollRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from('office_polls').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setPolls(((data as any[]) || []).map(p => ({ id: p.id, question: p.question, is_active: p.is_active, created_at: p.created_at })));
      setLoading(false);
    })();
  }, [user]);

  const open = polls.filter(p => p.is_active);
  const closed = polls.filter(p => !p.is_active);

  const List = ({ title, rows }: { title: string; rows: PollRow[] }) => (
    <section className="mt-6 first:mt-0">
      <div className="mb-2.5 flex items-baseline gap-2 px-1">
        <h2 className="text-[13.5px] font-semibold tracking-[-0.01em]">{title}</h2>
        <span className="text-[11.5px] tabular-nums text-muted-foreground">{rows.length}</span>
      </div>
      <div className="overflow-hidden rounded-[14px] border border-border/40 bg-card">
        <ul className="divide-y divide-border/30">
          {rows.map(p => (
            <li key={p.id}>
              <button
                onClick={() => navigate('/lounge/office/polls')}
                className="group flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-foreground/[0.03]"
              >
                <AppTile id="polls" icon={BarChart3} size={26} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{p.question}</span>
                  <span className={LABEL}>{p.is_active ? 'Open' : 'Closed'}</span>
                </span>
                <RelativeTime date={p.created_at} className="shrink-0" />
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      <OfficeModuleBand appId="polls" icon={BarChart3} title="Polls" context={polls.length ? `${open.length} open` : undefined}>
        <Button size="sm" className="h-8 gap-1.5 rounded-[8px] text-xs" onClick={() => navigate('/lounge/office/polls-create')}>
          <Plus className="h-3.5 w-3.5" /> New poll
        </Button>
      </OfficeModuleBand>
      <OfficeContent>
        {loading ? (
          <div className="overflow-hidden rounded-[14px] border border-border/40 bg-card"><SkeletonLedger rows={4} /></div>
        ) : polls.length === 0 ? (
          <OfficeEmpty
            title="No polls yet"
            body="Ask the first question with New poll - votes and results live here and in your team channels."
          />
        ) : (
          <>
            {open.length > 0 && <List title="Open" rows={open} />}
            {closed.length > 0 && <List title="Closed" rows={closed} />}
          </>
        )}
      </OfficeContent>
    </div>
  );
}
