import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Building2, LogOut, Loader2, Calculator, ChevronRight } from 'lucide-react';
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
      <header className="border-b border-border/20 bg-background/70 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
            <Calculator className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold">Accountant Portal</div>
            <div className="text-[10px] text-muted-foreground">{email}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={signOut} className="ml-auto h-8 gap-1.5 text-xs">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Your client organizations</h1>
        <p className="text-sm text-muted-foreground mb-6">Choose an organization to open its accounting.</p>

        {loading ? (
          <div className="h-40 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : orgs.length === 0 ? (
          <div className="rounded-2xl border border-border/30 bg-card/40 p-10 text-center">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <h2 className="text-sm font-bold">No client access yet</h2>
            <p className="text-xs text-muted-foreground mt-1">
              You'll see organizations here after accepting an invite.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {orgs.map(o => (
              <button key={o.id} onClick={() => nav(`/accountant/org/${o.id}`)}
                className="text-left rounded-2xl border border-border/30 bg-card/40 hover:bg-card/70 p-5 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold truncate">{o.name}</div>
                    <div className="text-[10px] text-muted-foreground">{o.base_currency}</div>
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
