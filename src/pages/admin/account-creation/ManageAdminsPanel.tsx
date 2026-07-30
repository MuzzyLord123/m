import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus, Loader2, Crown, Shield, PhoneCall, Radio, Activity, Trash2, FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePlatformOwner } from '@/hooks/usePlatformOwner';
import { cn } from '@/lib/utils';
import {
  AvatarID, Panel, PanelHeader, EmptyState, SkeletonLedger, RelativeTime, StatusBadge,
} from '@/components/platform';
import { ALL_TEAM_NAV_ITEMS } from '@/components/layout/TeamSidebar';

/**
 * Manage admins, rebuilt as the owners' control room. The ledger shows
 * every admin with real sign-in and calling figures (owner_admin_stats);
 * opening one gives the owners full control: which Team tabs they see
 * (enforced live by the sidebar), what they may do, their comms group
 * membership, and their recent calls with transcripts. Non-owner admins
 * see the ledger only.
 */

interface AdminStat {
  user_id: string;
  email: string;
  full_name: string | null;
  is_owner: boolean;
  last_sign_in_at: string | null;
  created_at: string;
  calls_today: number;
  calls_week: number;
  calls_total: number;
  avg_duration_seconds: number | null;
  connected: number;
  no_answer: number;
  companies_assigned: number;
  contacts_assigned: number;
  conversions: number;
}

const fmtDur = (s: number | null) => (s == null ? '–' : `${Math.floor(Number(s) / 60)}:${String(Number(s) % 60).padStart(2, '0')}`);
const LABEL = 'font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em]';

export default function ManageAdminsPanel() {
  const { toast } = useToast();
  const { isOwner } = usePlatformOwner();
  const [stats, setStats] = useState<AdminStat[]>([]);
  const [basicAdmins, setBasicAdmins] = useState<{ user_id: string; email: string | null; full_name: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [seg, setSeg] = useState<'admins' | 'feed'>('admins');
  const [feed, setFeed] = useState<any[]>([]);
  const [openAdmin, setOpenAdmin] = useState<AdminStat | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });

  const load = useCallback(async () => {
    if (isOwner) {
      const [s, f] = await Promise.all([
        supabase.rpc('owner_admin_stats' as any),
        supabase.rpc('owner_call_feed' as any, { _limit: 40 } as any),
      ]);
      setStats(((s.data as any[]) || []) as AdminStat[]);
      setFeed((f.data as any[]) || []);
    } else {
      // Non-owners see the roster only, from the same sources as before.
      const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
      const ids = ((roles as any[]) || []).map(r => r.user_id);
      const { data: profs } = await supabase.from('profiles').select('user_id, email, full_name').in('user_id', ids);
      setBasicAdmins(((profs as any[]) || []) as any);
    }
    setLoading(false);
  }, [isOwner]);

  useEffect(() => { load(); }, [load]);

  async function createAdmin() {
    if (!form.email || !form.password) {
      toast({ title: 'Missing fields', description: 'Email and password required', variant: 'destructive' });
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('create-admin-account', {
      body: { action: 'create', ...form },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast({ title: 'Failed to create admin', description: (data as any)?.error || error?.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Admin created', description: `${form.email} now has Quooro Team and CRM access.` });
    setForm({ email: '', password: '', fullName: '' });
    setCreateOpen(false);
    load();
  }

  async function revoke(userId: string, name: string) {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('create-admin-account', {
      body: { action: 'revoke', userId },
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast({ title: 'Failed to revoke', description: (data as any)?.error || error?.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Admin revoked', description: `${name} no longer has team access.` });
    setOpenAdmin(null);
    load();
  }

  const totals = useMemo(() => ({
    callsToday: stats.reduce((s, a) => s + Number(a.calls_today || 0), 0),
    callsWeek: stats.reduce((s, a) => s + Number(a.calls_week || 0), 0),
  }), [stats]);

  const seg2 = (on: boolean) =>
    cn('h-9 rounded-lg px-4 text-xs transition-colors', on ? 'bg-foreground/[0.06] font-medium text-foreground' : 'text-muted-foreground hover:text-foreground');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={LABEL}>Team control</p>
          <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Manage admins</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {isOwner
              ? 'Full control of every sub admin: access, comms groups and live activity.'
              : 'The admin roster. Owners control access and activity.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <div className="flex gap-1 rounded-[11px] border border-border/60 p-1">
              <button type="button" className={seg2(seg === 'admins')} onClick={() => setSeg('admins')}>Admins</button>
              <button type="button" className={seg2(seg === 'feed')} onClick={() => setSeg('feed')}>Live feed</button>
            </div>
          )}
          <Button size="sm" className="h-9 gap-1.5 rounded-lg text-xs" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> New admin
          </Button>
        </div>
      </div>

      {isOwner && !loading && (
        <div className="grid grid-cols-3 divide-x divide-border/60 rounded-[10px] border border-border/60 bg-card">
          {[
            { label: 'Admins', value: stats.length },
            { label: 'Team calls today', value: totals.callsToday },
            { label: 'Team calls this week', value: totals.callsWeek },
          ].map(t => (
            <div key={t.label} className="px-4 py-3">
              <p className={LABEL}>{t.label}</p>
              <p className="mt-0.5 font-mono text-[16px] font-semibold tabular-nums">{t.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <Panel><SkeletonLedger rows={3} /></Panel>
      ) : !isOwner ? (
        <Panel>
          <PanelHeader label={`${basicAdmins.length} admins`} />
          <ul className="divide-y divide-border/60">
            {basicAdmins.map(a => (
              <li key={a.user_id} className="flex items-center gap-3 px-4 py-3">
                <AvatarID name={a.full_name} email={a.email} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium">{a.full_name || a.email}</p>
                  <p className="truncate font-mono text-[10.5px] text-muted-foreground">{a.email}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      ) : seg === 'feed' ? (
        <Panel>
          <PanelHeader label="Live activity" />
          {feed.length === 0 ? (
            <EmptyState compact title="Quiet so far" body="Sign-ins and calls appear here as your admins work." />
          ) : (
            <ul className="divide-y divide-border/60">
              {feed.map((c: any) => (
                <li key={c.call_id} className="flex min-h-[48px] items-center gap-3 px-4 py-2.5">
                  <AvatarID name={c.admin_name} email={c.admin_email} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-[13px]">
                    <span className="font-medium">{(c.admin_name || c.admin_email).split(' ')[0]}</span>
                    <span className="text-muted-foreground"> called </span>
                    <span className="font-medium">{c.entity_name || c.phone}</span>
                    {c.outcome && <span className="text-muted-foreground"> · {c.outcome.replace(/_/g, ' ')}</span>}
                  </span>
                  {c.transcript && <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">{fmtDur(c.duration_seconds)}</span>
                  <RelativeTime date={c.started_at} className="w-20 shrink-0 text-right" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : (
        <Panel>
          <PanelHeader label={`${stats.length} admins`} />
          <ul className="divide-y divide-border/60">
            {stats.map(a => (
              <li key={a.user_id}>
                <button
                  type="button"
                  onClick={() => setOpenAdmin(a)}
                  className="flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.025]"
                >
                  <AvatarID name={a.full_name} email={a.email} />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-[13.5px] font-medium">
                      <span className="truncate">{a.full_name || a.email}</span>
                      {a.is_owner && (
                        <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.13em] text-attend">
                          <Crown className="h-3 w-3" /> Owner
                        </span>
                      )}
                    </p>
                    <p className="truncate font-mono text-[10.5px] text-muted-foreground">
                      {a.email} · {a.last_sign_in_at ? <>signed in <RelativeTime date={a.last_sign_in_at} /></> : 'never signed in'}
                    </p>
                  </div>
                  <div className="hidden shrink-0 gap-5 text-right sm:flex">
                    {[
                      ['Calls wk', a.calls_week],
                      ['Total', a.calls_total],
                      ['Avg', fmtDur(a.avg_duration_seconds)],
                      ['Converted', a.conversions],
                    ].map(([k, v]) => (
                      <div key={k as string}>
                        <p className="font-mono text-[8.5px] uppercase tracking-[0.13em] text-muted-foreground">{k}</p>
                        <p className="font-mono text-[13px] font-medium tabular-nums">{v as any}</p>
                      </div>
                    ))}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* Create admin */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create admin account</DialogTitle>
            <DialogDescription>Grants Quooro Team and full CRM access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <span className={LABEL}>Full name</span>
              <Input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} className="mt-1.5 h-10" />
            </div>
            <div>
              <span className={LABEL}>Email</span>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1.5 h-10" />
            </div>
            <div>
              <span className={LABEL}>Temporary password</span>
              <Input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="mt-1.5 h-10 font-mono text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)} disabled={busy}>Cancel</Button>
            <Button onClick={createAdmin} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create admin
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Per-admin control room */}
      {openAdmin && (
        <AdminControlSheet
          admin={openAdmin}
          onClose={() => setOpenAdmin(null)}
          onRevoke={revoke}
          busy={busy}
        />
      )}
    </div>
  );
}

/** Owner control over one admin: access, comms groups, activity. */
function AdminControlSheet({ admin, onClose, onRevoke, busy }: {
  admin: AdminStat;
  onClose: () => void;
  onRevoke: (userId: string, name: string) => void;
  busy: boolean;
}) {
  const { toast } = useToast();
  const [tab, setTab] = useState<'access' | 'comms' | 'activity'>('access');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [canCreate, setCanCreate] = useState(true);
  const [savingAccess, setSavingAccess] = useState(false);
  const [channels, setChannels] = useState<any[]>([]);
  const [membership, setMembership] = useState<Set<string>>(new Set());
  const [calls, setCalls] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [ctrl, ch, mem, feed] = await Promise.all([
        supabase.from('admin_controls' as any).select('*').eq('user_id', admin.user_id).maybeSingle(),
        supabase.from('comm_channels' as any).select('id, name, slug').eq('is_archived', false).order('name'),
        supabase.from('comm_channel_members' as any).select('channel_id').eq('user_id', admin.user_id),
        supabase.rpc('owner_call_feed' as any, { _limit: 80 } as any),
      ]);
      if (cancelled) return;
      const row = ctrl.data as any;
      setHidden(new Set(((row?.hidden_tabs as string[]) || [])));
      setCanCreate(row ? row.can_create_accounts !== false : true);
      setChannels((ch.data as any[]) || []);
      setMembership(new Set(((mem.data as any[]) || []).map(m => m.channel_id)));
      setCalls((((feed.data as any[]) || []) as any[]).filter(c => c.admin_id === admin.user_id).slice(0, 12));
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [admin.user_id]);

  async function saveAccess(nextHidden: Set<string>, nextCanCreate: boolean) {
    setSavingAccess(true);
    const { error } = await supabase.from('admin_controls' as any).upsert({
      user_id: admin.user_id,
      hidden_tabs: Array.from(nextHidden),
      can_create_accounts: nextCanCreate,
      updated_at: new Date().toISOString(),
    } as any);
    setSavingAccess(false);
    if (error) toast({ title: 'Not saved', description: error.message, variant: 'destructive' });
  }

  function toggleTab(id: string) {
    const next = new Set(hidden);
    if (next.has(id)) next.delete(id); else next.add(id);
    setHidden(next);
    saveAccess(next, canCreate);
  }

  async function toggleChannel(channelId: string) {
    const joining = !membership.has(channelId);
    const { error } = await supabase.rpc('owner_set_channel_member' as any, {
      _channel_id: channelId, _user_id: admin.user_id, _member: joining,
    } as any);
    if (error) { toast({ title: 'Not updated', description: error.message, variant: 'destructive' }); return; }
    setMembership(prev => {
      const next = new Set(prev);
      if (joining) next.add(channelId); else next.delete(channelId);
      return next;
    });
  }

  const seg3 = (on: boolean) =>
    cn('h-9 flex-1 rounded-lg text-xs transition-colors', on ? 'bg-foreground/[0.06] font-medium text-foreground' : 'text-muted-foreground hover:text-foreground');

  return (
    <Dialog open onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="flex h-[min(680px,92dvh)] max-w-lg flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <AvatarID name={admin.full_name} email={admin.email} />
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex items-center gap-2 text-[15px]">
                <span className="truncate">{admin.full_name || admin.email}</span>
                {admin.is_owner && <Crown className="h-3.5 w-3.5 shrink-0 text-attend" />}
              </DialogTitle>
              <p className="truncate font-mono text-[10.5px] text-muted-foreground">{admin.email}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-1 border-b border-border/60 px-4 py-2">
          <button type="button" className={seg3(tab === 'access')} onClick={() => setTab('access')}>Access</button>
          <button type="button" className={seg3(tab === 'comms')} onClick={() => setTab('comms')}>Comms groups</button>
          <button type="button" className={seg3(tab === 'activity')} onClick={() => setTab('activity')}>Activity</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!loaded ? (
            <SkeletonLedger rows={4} />
          ) : admin.is_owner && tab === 'access' ? (
            <EmptyState compact title="Owners are immune" body="Owner accounts always see everything. Controls apply to sub admins." />
          ) : tab === 'access' ? (
            <div className="space-y-4">
              <label className="flex items-center justify-between gap-3 rounded-[10px] border border-border/60 px-3.5 py-3">
                <span>
                  <span className="block text-[13px] font-medium">Can create accounts</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">Client and admin provisioning in Account Creation.</span>
                </span>
                <Switch
                  checked={canCreate}
                  onCheckedChange={(v) => { setCanCreate(v); saveAccess(hidden, v); }}
                  disabled={savingAccess}
                />
              </label>
              <div>
                <span className={LABEL}>Visible team tabs</span>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Untick a tab to remove it from their sidebar. Applies on their next load.</p>
                <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                  {ALL_TEAM_NAV_ITEMS.map(item => (
                    <label key={item.id} className="flex min-h-[36px] items-center gap-2 text-[12.5px]">
                      <Checkbox
                        checked={!hidden.has(item.id)}
                        onCheckedChange={() => toggleTab(item.id)}
                      />
                      <span className={cn('truncate', hidden.has(item.id) && 'text-muted-foreground line-through')}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="border-t border-border/60 pt-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="h-9 gap-1.5 rounded-lg text-xs text-risk hover:bg-risk/[0.06]">
                      <Trash2 className="h-3.5 w-3.5" /> Revoke admin access
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke admin access?</AlertDialogTitle>
                      <AlertDialogDescription>
                        {admin.full_name || admin.email} loses Quooro Team and CRM access. Their account is not deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onRevoke(admin.user_id, admin.full_name || admin.email)} disabled={busy}>
                        Revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ) : tab === 'comms' ? (
            channels.length === 0 ? (
              <EmptyState
                compact
                title="No comms groups yet"
                body="Create a group in Team Comms and you can place admins into it from here."
              />
            ) : (
              <div className="space-y-1">
                {channels.map(ch => (
                  <label key={ch.id} className="flex min-h-[44px] items-center justify-between gap-3 rounded-lg border border-border/60 px-3.5">
                    <span className="flex min-w-0 items-center gap-2 text-[13px]">
                      <Radio className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{ch.name}</span>
                    </span>
                    <Switch checked={membership.has(ch.id)} onCheckedChange={() => toggleChannel(ch.id)} />
                  </label>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {[
                  ['Last signed in', admin.last_sign_in_at ? new Date(admin.last_sign_in_at).toLocaleString('en-GB') : 'Never'],
                  ['Calls today', admin.calls_today],
                  ['Calls this week', admin.calls_week],
                  ['All time', admin.calls_total],
                  ['Avg call', fmtDur(admin.avg_duration_seconds)],
                  ['Conversions', admin.conversions],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-[10px] border border-border/60 px-3 py-2.5">
                    <p className={LABEL}>{k}</p>
                    <p className="mt-0.5 font-mono text-[13px] font-medium tabular-nums">{v as any}</p>
                  </div>
                ))}
              </div>
              <div>
                <span className={cn(LABEL, 'flex items-center gap-1.5')}><Activity className="h-3 w-3" /> Recent calls</span>
                {calls.length === 0 ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">No calls logged yet.</p>
                ) : (
                  <ul className="mt-1.5 divide-y divide-border/60 rounded-[10px] border border-border/60">
                    {calls.map((c: any) => (
                      <li key={c.call_id} className="flex items-center gap-2.5 px-3 py-2">
                        <PhoneCall className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate text-[12.5px]">{c.entity_name || c.phone}</span>
                        {c.outcome && <span className="shrink-0 text-[10.5px] text-muted-foreground">{c.outcome.replace(/_/g, ' ')}</span>}
                        <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground">{fmtDur(c.duration_seconds)}</span>
                        <RelativeTime date={c.started_at} className="shrink-0" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-border/60 px-5 py-3">
          <p className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
            <Shield className="h-3 w-3" /> Changes apply immediately and only owners can make them
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
