import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Building2, LogOut, ChevronRight } from 'lucide-react';
import { SkeletonLedger } from '@/components/platform';
import { toast } from 'sonner';

interface OrgRow {
  id: string; name: string; base_currency: string;
}

export default function AccountantDashboard() {
  const nav = useNavigate();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { nav('/accountant', { replace: true }); return; }
      setEmail(user.email || '');
      // Fetch orgs where the user is an accountant member.
      const { data: mem } = await (supabase as any)
        .from('acc_org_members').select('org_id, role').eq('user_id', user.id).eq('role', 'accountant');
      const ids = (mem || []).map((m: any) => m.org_id);
      if (!ids.length) { setOrgs([]); setLoading(false); return; }
      const { data: os } = await (supabase as any)
        .from('acc_organizations').select('id, name, base_currency').in('id', ids).order('name');
      setOrgs(os || []);
      setLoading(false);
    })();
  }, [nav]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success('Signed out');
    nav('/accountant', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <div>
            <div className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Accountant portal</div>
            <div className="font-mono text-[10px] text-muted-foreground">{email}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={signOut} className="ml-auto h-8 gap-1.5 text-xs">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <h1 className="mb-0.5 text-[17px] font-semibold tracking-[-0.015em]">Your client organizations</h1>
        <p className="mb-5 text-[13px] text-muted-foreground">Choose an organization to open its accounting.</p>

        {loading ? (
          <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card"><SkeletonLedger rows={3} /></div>
        ) : orgs.length === 0 ? (
          <div className="rounded-[10px] border border-border/60 bg-card p-10 text-center">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <h2 className="text-sm font-[550]">No client access yet</h2>
            <p className="text-xs text-muted-foreground mt-1">
              You'll see organizations here after accepting an invite.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orgs.map(o => (
              <button key={o.id} onClick={() => nav(`/accountant/org/${o.id}`)}
                className="group rounded-[10px] border border-border/60 bg-card p-4 text-left transition-colors duration-150 hover:border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-sunken">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-[13px] font-[550]">{o.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{o.base_currency}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
