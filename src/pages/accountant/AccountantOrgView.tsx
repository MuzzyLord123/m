// Accountant-scoped view of a single organization's accounting.
// Reuses the same OfficeAccounting page but wrapped in the accountant shell,
// with the org pre-selected via URL param handling inside OfficeAccounting.
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, Calculator } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import OfficeAccounting from '@/pages/lounge/OfficeAccounting';

export default function AccountantOrgView() {
  const { orgId } = useParams<{ orgId: string }>();
  const nav = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success('Signed out');
    nav('/accountant', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/20 bg-background/70 backdrop-blur-xl sticky top-0 z-20">
        <div className="max-w-full px-5 h-12 flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => nav('/accountant/dashboard')} className="h-8 gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" /> All organizations
          </Button>
          <div className="flex items-center gap-2 ml-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Calculator className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-bold">Accountant Portal</span>
          </div>
          <Button size="sm" variant="ghost" onClick={signOut} className="ml-auto h-8 gap-1.5 text-xs">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </header>
      <div className="flex-1 min-h-0" data-accountant-org={orgId}>
        <OfficeAccounting />
      </div>
    </div>
  );
}
