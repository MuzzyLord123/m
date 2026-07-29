import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Loader2, ShieldCheck } from 'lucide-react';
import { SkeletonForm } from '@/components/platform';
import { toast } from 'sonner';

interface InviteInfo {
  id: string; email: string; status: string; expires_at: string; org_id: string;
  org_name?: string;
}

export default function AccountantAccept() {
  const { token } = useParams<{ token: string }>();
  const nav = useNavigate();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { data: inv } = await (supabase as any)
        .from('acc_accountant_invites')
        .select('id, email, status, expires_at, org_id')
        .eq('token', token)
        .maybeSingle();
      if (!inv) { setError('Invite not found or has been revoked.'); setLoading(false); return; }
      if (inv.status !== 'pending') { setError(`This invite is ${inv.status}.`); setLoading(false); return; }
      if (new Date(inv.expires_at).getTime() < Date.now()) { setError('This invite has expired.'); setLoading(false); return; }
      const { data: org } = await (supabase as any)
        .from('acc_organizations').select('name').eq('id', inv.org_id).maybeSingle();
      setInvite({ ...inv, org_name: org?.name || 'Organization' });
      setLoading(false);
    })();
  }, [token]);

  async function acceptWithSession() {
    setBusy(true);
    const { error } = await supabase.functions.invoke('acc-accept-invite', { body: { token } });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Access granted');
    nav('/accountant/dashboard', { replace: true });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!invite) return;
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: invite.email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/accountant/accept/${token}`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: invite.email, password });
        if (error) throw error;
      }
      // Wait a beat for session, then accept.
      await new Promise(r => setTimeout(r, 300));
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        toast.info('Check your email to confirm, then click the invite link again.');
        setBusy(false);
        return;
      }
      await acceptWithSession();
    } catch (err: any) {
      toast.error(err.message || 'Failed');
      setBusy(false);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center p-6"><div className="w-full max-w-md overflow-hidden rounded-[10px] border border-border/60 bg-card"><SkeletonForm fields={2} className="p-6" /></div></div>;
  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-[17px] font-semibold tracking-[-0.015em]">Invite unavailable</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    </div>
  );
  if (!invite) return null;

  const alreadyRightUser = session?.user?.email?.toLowerCase() === invite.email.toLowerCase();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-[10px] border border-border/60 bg-card p-8">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg border border-border/60 bg-sunken">
          <ShieldCheck className="h-5 w-5 text-muted-foreground" />
        </div>
        <h1 className="text-[19px] font-semibold tracking-[-0.015em]">Accountant invite</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-1">
          <span className="font-semibold text-foreground">{invite.org_name}</span> has invited you to manage their accounting on Quooro.
        </p>
        <p className="text-xs text-muted-foreground mb-6">Invite for <span className="font-mono">{invite.email}</span></p>

        {alreadyRightUser ? (
          <Button onClick={acceptWithSession} disabled={busy} className="w-full h-10 rounded-lg gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            Accept and open portal
          </Button>
        ) : (
          <>
            <div className="mb-4 flex gap-1 rounded-lg border border-border/60 bg-sunken p-1">
              {(['signup','signin'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`h-8 flex-1 rounded-md text-xs font-medium transition-colors duration-150 ${mode===m?'bg-card text-foreground':'text-muted-foreground hover:text-foreground'}`}>
                  {m === 'signup' ? 'Create account' : 'I already have one'}
                </button>
              ))}
            </div>
            <form onSubmit={submit} className="space-y-3">
              {mode === 'signup' && (
                <div>
                  <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Your name</Label>
                  <Input value={fullName} onChange={e => setFullName(e.target.value)} required className="mt-1.5 h-10 rounded-lg" />
                </div>
              )}
              <div>
                <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Password</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required minLength={6} className="mt-1.5 h-10 rounded-lg" />
              </div>
              <Button type="submit" disabled={busy} className="w-full h-10 rounded-lg gap-2">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {mode === 'signup' ? 'Create account and accept' : 'Sign in and accept'}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
