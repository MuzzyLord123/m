import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Loader2, LogIn } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountantLogin() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) nav('/accountant/dashboard', { replace: true });
    });
  }, [nav]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    nav('/accountant/dashboard', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[10px] border border-border/60 bg-card p-8">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border/60 bg-sunken">
          <Calculator className="h-5 w-5 text-muted-foreground" />
        </div>
        <span className="mb-1 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Accountant portal</span>
        <h1 className="text-[19px] font-semibold tracking-[-0.015em]">Sign in</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Sign in to access your client's accounting.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required className="mt-1.5 h-10 rounded-lg" />
          </div>
          <div>
            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required className="mt-1.5 h-10 rounded-lg" />
          </div>
          <Button type="submit" disabled={busy} className="w-full h-10 rounded-lg gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Sign in
          </Button>
        </form>
        <p className="text-[11px] text-muted-foreground mt-6 text-center">
          Need access? Ask the company using Quooro to send you an invite link.
        </p>
      </div>
    </div>
  );
}
