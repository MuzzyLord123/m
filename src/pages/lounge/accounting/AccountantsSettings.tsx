import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Copy, Trash2, CheckCircle2, Clock, XCircle, Mail, Send, Loader2, KeyRound, Eye, EyeOff, RefreshCw, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Invite {
  id: string; email: string; token: string; status: string;
  expires_at: string; accepted_at: string | null; created_at: string;
}
interface Member {
  id: string; user_id: string; role: string; created_at: string;
}
interface EmailAcct {
  id: string; email_address: string; display_name: string | null; provider: string; is_active: boolean | null;
}

export default function AccountantsSettings({ orgId }: { orgId: string }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [accts, setAccts] = useState<EmailAcct[]>([]);
  const [selectedAcct, setSelectedAcct] = useState<string>('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  // Direct login creation
  const [mode, setMode] = useState<'invite' | 'direct'>('invite');
  const [dName, setDName] = useState('');
  const [dLoginId, setDLoginId] = useState('');
  const [dPass, setDPass] = useState('');
  const [dPass2, setDPass2] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showPass2, setShowPass2] = useState(false);
  const [creating, setCreating] = useState(false);

  // Strict password rules — all must be green to enable creation.
  const pwChecks = {
    length: dPass.length >= 12,
    upper: /[A-Z]/.test(dPass),
    lower: /[a-z]/.test(dPass),
    number: /\d/.test(dPass),
    special: /[^A-Za-z0-9]/.test(dPass),
    noSpace: dPass.length > 0 && !/\s/.test(dPass),
  };
  const pwAllGood = Object.values(pwChecks).every(Boolean);
  const pwMatch = dPass.length > 0 && dPass === dPass2;
  const idValid = /^[a-zA-Z0-9._-]{3,}$/.test(dLoginId.trim());

  function genPassword() {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnpqrstuvwxyz';
    const nums = '23456789';
    const special = '!@#$%^&*?';
    const all = upper + lower + nums + special;
    const arr = new Uint32Array(16);
    crypto.getRandomValues(arr);
    // Guarantee at least one of each class
    let out = upper[arr[0] % upper.length] + lower[arr[1] % lower.length] +
              nums[arr[2] % nums.length] + special[arr[3] % special.length];
    for (let i = 4; i < arr.length; i++) out += all[arr[i] % all.length];
    setDPass(out);
    setDPass2(out);
    setShowPass(true);
    setShowPass2(true);
  }

  async function createDirectLogin() {
    if (!idValid) { toast.error('Login ID: letters, numbers, . _ - (min 3 chars)'); return; }
    if (!pwAllGood) { toast.error('Password must meet all requirements'); return; }
    if (!pwMatch) { toast.error('Passwords do not match'); return; }
    // Internal email format used by auth — accountant only ever sees the Login ID
    const authEmail = `${dLoginId.trim().toLowerCase()}@acct.quooro.app`;
    setCreating(true);
    const { data, error } = await supabase.functions.invoke('acc-create-accountant-login', {
      body: { orgId, email: authEmail, password: dPass, fullName: dName.trim() || null },
    });
    setCreating(false);
    // supabase.functions.invoke surfaces a generic "non-2xx" error and hides the body.
    // Extract the real message from the response context when possible.
    let realErr: string | null = (data as any)?.error ?? null;
    if (!realErr && error) {
      try {
        const resp = (error as any)?.context;
        if (resp && typeof resp.json === 'function') {
          const body = await resp.json();
          realErr = body?.error ?? null;
        } else if (resp && typeof resp.text === 'function') {
          const t = await resp.text();
          try { realErr = JSON.parse(t)?.error ?? t; } catch { realErr = t; }
        }
      } catch { /* ignore */ }
      realErr = realErr || error.message;
    }
    if (realErr) {
      console.error('[create accountant login]', realErr);
      toast.error(realErr);
      return;
    }
    toast.success(`Login created. Share Login ID "${dLoginId}" and the password with your accountant.`);
    setDName(''); setDLoginId(''); setDPass(''); setDPass2(''); setShowPass(false); setShowPass2(false);
    load();
  }

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    const [{ data: inv }, { data: mem }, { data: ea }] = await Promise.all([
      (supabase as any).from('acc_accountant_invites')
        .select('id, email, token, status, expires_at, accepted_at, created_at')
        .eq('org_id', orgId).order('created_at', { ascending: false }),
      (supabase as any).from('acc_org_members')
        .select('id, user_id, role, created_at')
        .eq('org_id', orgId).eq('role', 'accountant'),
      user ? (supabase as any).from('email_accounts')
        .select('id, email_address, display_name, provider, is_active')
        .eq('user_id', user.id).order('email_address') : Promise.resolve({ data: [] }),
    ]);
    setInvites(inv || []);
    setMembers(mem || []);
    const sendable = (ea || []).filter((a: EmailAcct) => ['google', 'microsoft', 'outlook'].includes(a.provider));
    setAccts(sendable);
    if (!selectedAcct && sendable[0]) setSelectedAcct(sendable[0].id);
  }
  useEffect(() => { load(); }, [orgId]);


  async function createInvite() {
    if (!email.trim() || !email.includes('@')) { toast.error('Valid email required'); return; }
    setBusy(true);
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any).from('acc_accountant_invites').insert({
      org_id: orgId, email: email.trim().toLowerCase(), token, invited_by: user?.id,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setEmail('');
    toast.success('Invite created');
    load();
  }

  function inviteLink(token: string) {
    return `${window.location.origin}/accountant/accept/${token}`;
  }

  async function copyLink(token: string) {
    await navigator.clipboard.writeText(inviteLink(token));
    toast.success('Link copied');
  }

  async function revoke(id: string) {
    const { error } = await (supabase as any).from('acc_accountant_invites')
      .update({ status: 'revoked' }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Invite revoked');
    load();
  }

  async function removeMember(id: string) {
    if (!confirm('Remove accountant access?')) return;
    const { error } = await (supabase as any).from('acc_org_members').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Access removed');
    load();
  }

  async function sendInviteEmail(inviteId: string) {
    if (!selectedAcct) { toast.error('Connect an email account first (Office → Email)'); return; }
    setSending(inviteId);
    const { data, error } = await supabase.functions.invoke('acc-send-invite-email', {
      body: { inviteId, accountId: selectedAcct },
    });
    setSending(null);
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error || error?.message || 'Send failed');
      return;
    }
    toast.success('Invite email sent');
  }


  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2"><Users className="h-4 w-4" /> Accountant access</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Invite an external accountant to log into a dedicated portal for this organization only.
          They will see nothing else in Quooro, just your accounting app.
        </p>
      </div>

      <div className="rounded-[10px] border border-border/60 bg-card p-4">
        <div className="flex gap-1 p-1 bg-muted/30 rounded-lg mb-4 w-fit">
          <button
            type="button"
            onClick={() => setMode('invite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${mode === 'invite' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Mail className="h-3 w-3 inline mr-1.5" /> Send invite link
          </button>
          <button
            type="button"
            onClick={() => setMode('direct')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${mode === 'direct' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <KeyRound className="h-3 w-3 inline mr-1.5" /> Create login
          </button>
        </div>

        {mode === 'invite' ? (
          <>
            <Label className="text-xs">Invite by email</Label>
            <div className="flex gap-2 mt-1.5">
              <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="accountant@firm.co.uk"
                type="email" className="h-9 rounded-lg text-sm flex-1" />
              <Button onClick={createInvite} disabled={busy} className="h-9 rounded-lg gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Create invite
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              Invite expires in 14 days. Accountant signs in at <span className="font-mono">/accountant</span>.
            </p>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Full name (optional)</Label>
              <Input value={dName} onChange={e => setDName(e.target.value)} placeholder="Jane Smith"
                className="h-9 rounded-lg text-sm mt-1.5" />
            </div>
            <div>
              <Label className="text-xs">Login ID</Label>
              <Input value={dLoginId}
                onChange={e => setDLoginId(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
                placeholder="jane.smith"
                autoCapitalize="none" spellCheck={false}
                className="h-9 rounded-lg text-sm mt-1.5 font-mono" />
              <p className="text-[10px] text-muted-foreground mt-1">
                Letters, numbers, dot, underscore, hyphen. No spaces. Min 3 characters.
              </p>
            </div>
            <div>
              <Label className="text-xs">Password</Label>
              <div className="flex gap-2 mt-1.5">
                <div className="relative flex-1">
                  <Input value={dPass} onChange={e => setDPass(e.target.value)}
                    type={showPass ? 'text' : 'password'} placeholder="Meet every requirement below"
                    autoCapitalize="none" spellCheck={false}
                    className="h-9 rounded-lg text-sm pr-9" />
                  <button type="button" onClick={() => setShowPass(s => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <Button type="button" variant="outline" onClick={genPassword}
                  className="h-9 rounded-lg gap-1.5 text-xs">
                  <RefreshCw className="h-3 w-3" /> Generate
                </Button>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                {[
                  { ok: pwChecks.length, label: 'At least 12 characters' },
                  { ok: pwChecks.upper, label: 'One uppercase letter' },
                  { ok: pwChecks.lower, label: 'One lowercase letter' },
                  { ok: pwChecks.number, label: 'One number' },
                  { ok: pwChecks.special, label: 'One special character' },
                  { ok: pwChecks.noSpace, label: 'No spaces' },
                ].map((r) => (
                  <li key={r.label} className={`flex items-center gap-1.5 text-[10px] ${r.ok ? 'text-ok' : 'text-muted-foreground'}`}>
                    {r.ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3 opacity-50" />}
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Label className="text-xs">Retype password</Label>
              <div className="relative mt-1.5">
                <Input value={dPass2} onChange={e => setDPass2(e.target.value)}
                  type={showPass2 ? 'text' : 'password'} placeholder="Retype the password"
                  autoCapitalize="none" spellCheck={false}
                  className="h-9 rounded-lg text-sm pr-9" />
                <button type="button" onClick={() => setShowPass2(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass2 ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              {dPass2.length > 0 && (
                <p className={`mt-1 flex items-center gap-1.5 text-[10px] ${pwMatch ? 'text-ok' : 'text-destructive'}`}>
                  {pwMatch ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {pwMatch ? 'Passwords match' : 'Passwords do not match'}
                </p>
              )}
            </div>
            <Button onClick={createDirectLogin}
              disabled={creating || !idValid || !pwAllGood || !pwMatch}
              className="w-full h-9 rounded-lg gap-1.5">
              {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
              Create accountant login
            </Button>
            <p className="text-[10px] text-muted-foreground">
              Creates the login instantly. Share the Login ID and password securely with your accountant. They sign in at <span className="font-mono">/accountant</span>. If the Login ID already exists, its password will be reset.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-[10px] border border-border/60 bg-card p-4">
        <Label className="text-xs flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Send invite emails from</Label>
        {accts.length === 0 ? (
          <p className="text-[11px] text-muted-foreground mt-2">
            No connected email accounts. Connect one in <span className="font-mono">Office → Email</span> (Google or Microsoft) to send invites directly from your inbox. You can still share the invite link manually.
          </p>
        ) : (
          <div className="mt-1.5">
            <Select value={selectedAcct} onValueChange={setSelectedAcct}>
              <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue placeholder="Choose account" /></SelectTrigger>
              <SelectContent>
                {accts.map(a => (
                  <SelectItem key={a.id} value={a.id} className="text-xs">
                    {a.display_name ? `${a.display_name} · ` : ''}{a.email_address}
                    <span className="ml-2 text-[10px] uppercase text-muted-foreground">{a.provider}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Emails to accountants are sent from this address using your connected account.
            </p>
          </div>
        )}
      </div>


      {/* Active accountants */}
      <section className="rounded-[10px] border border-border/60 bg-card overflow-hidden">
        <header className="px-5 py-3 border-b border-border/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Active accountants ({members.length})
        </header>
        {members.length === 0 ? (
          <div className="p-6 text-center text-[11px] text-muted-foreground">No accountants have accepted yet.</div>
        ) : (
          <div className="divide-y divide-border/60">
            {members.map(m => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-2.5 text-xs">
                <CheckCircle2 className="h-3.5 w-3.5 text-ok" />
                <span className="flex-1 font-mono text-[11px]">{m.user_id.slice(0, 12)}…</span>
                <span className="text-[10px] text-muted-foreground">since {new Date(m.created_at).toLocaleDateString('en-GB')}</span>
                <Button size="sm" variant="ghost" onClick={() => removeMember(m.id)} className="h-7 w-7 p-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>


      {/* Invites */}
      <section className="rounded-[10px] border border-border/60 bg-card overflow-hidden">
        <header className="px-5 py-3 border-b border-border/60 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Invites ({invites.length})
        </header>
        {invites.length === 0 ? (
          <div className="p-6 text-center text-[11px] text-muted-foreground">No invites yet.</div>
        ) : (
          <div className="divide-y divide-border/60">
            {invites.map(i => (
              <div key={i.id} className="flex items-center gap-3 px-5 py-2.5 text-xs">
                {i.status === 'accepted' && <CheckCircle2 className="h-3.5 w-3.5 text-ok" />}
                {i.status === 'pending' && <Clock className="h-3.5 w-3.5 text-attend" />}
                {(i.status === 'revoked' || i.status === 'expired') && <XCircle className="h-3.5 w-3.5 text-risk" />}
                <span className="flex-1">{i.email}</span>
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{i.status}</span>
                {i.status === 'pending' && (
                  <>
                    <Button size="sm" variant="outline" onClick={() => sendInviteEmail(i.id)}
                      disabled={!selectedAcct || sending === i.id}
                      className="h-7 rounded-lg text-[10px] gap-1">
                      {sending === i.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Email
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyLink(i.token)} className="h-7 rounded-lg text-[10px] gap-1">
                      <Copy className="h-3 w-3" /> Copy link
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => revoke(i.id)} className="h-7 w-7 p-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
