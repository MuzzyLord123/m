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
      <div className="w-full max-w-md rounded-2xl border border-border/30 bg-card/60 backdrop-blur-xl p-8">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4">
          <Calculator className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Accountant Portal</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Sign in to access your client's accounting.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
              required className="mt-1.5 h-10 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs">Password</Label>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
              required className="mt-1.5 h-10 rounded-xl" />
          </div>
          <Button type="submit" disabled={busy} className="w-full h-10 rounded-xl gap-2">
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
