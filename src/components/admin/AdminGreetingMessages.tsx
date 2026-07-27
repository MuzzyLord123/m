import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Save, Search, MessageCircle, Sparkles } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ClientRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  company: string | null;
  avatar_url: string | null;
  customer_id: string | null;
  greeting_id: string | null;
  message: string;
  enabled: boolean;
  greetingName: string;
  dirty?: boolean;
  saving?: boolean;
}

const TEMPLATES: { label: string; build: (name: string) => string }[] = [
  {
    label: 'Live preview ready',
    build: (n) => `Hi ${n}, thank you for choosing Quooro — we're delighted to let you know your live preview is ready! Head to the Website section and click the link to view your site.`,
  },
  {
    label: 'Welcome onboard',
    build: (n) => `Welcome to Quooro, ${n}! We're thrilled to have you on the team. Take a look around your dashboard and let us know if you need anything at all.`,
  },
  {
    label: 'Preview updated',
    build: (n) => `Hi ${n}, we've just pushed a fresh update to your live preview. Jump into the Website section to see the latest changes and let us know your thoughts.`,
  },
  {
    label: 'Awaiting your feedback',
    build: (n) => `Hey ${n}, your preview is looking great! Whenever you have a moment, please review it and share any tweaks you'd like — we'll turn them around fast.`,
  },
  {
    label: 'Ready to launch',
    build: (n) => `Hi ${n}, congratulations — your site is ready to go live! Give it a final look in the Website section and we'll launch as soon as you give us the green light.`,
  },
];

export default function AdminGreetingMessages() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      // Customer profiles only (role = 'user')
      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'user');
      const userIds = (roleRows ?? []).map((r: any) => r.user_id);
      if (!userIds.length) { if (active) { setRows([]); setLoading(false); } return; }

      const [{ data: profiles }, { data: greetings }] = await Promise.all([
        supabase.from('profiles').select('user_id,email,full_name,company,avatar_url,customer_id').in('user_id', userIds),
        (supabase as any).from('greeting_messages').select('id,user_id,message,enabled').in('user_id', userIds),
      ]);

      const greetMap = new Map<string, any>((greetings ?? []).map((g: any) => [g.user_id, g]));
      const merged: ClientRow[] = (profiles ?? []).map((p: any) => {
        const g = greetMap.get(p.user_id);
        return {
          user_id: p.user_id,
          email: p.email,
          full_name: p.full_name,
          company: p.company,
          avatar_url: p.avatar_url,
          customer_id: p.customer_id,
          greeting_id: g?.id ?? null,
          message: g?.message ?? '',
          enabled: g?.enabled ?? false,
          greetingName: ((p.full_name || '').split(' ')[0]) || '',
        };
      }).sort((a, b) => (a.full_name || a.email || '').localeCompare(b.full_name || b.email || ''));

      if (active) { setRows(merged); setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      (r.full_name || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.company || '').toLowerCase().includes(q) ||
      (r.customer_id || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  function updateRow(userId: string, patch: Partial<ClientRow>) {
    setRows(prev => prev.map(r => r.user_id === userId ? { ...r, ...patch } : r));
  }

  async function persist(row: ClientRow, overrides?: Partial<ClientRow>) {
    const next = { ...row, ...overrides };
    updateRow(row.user_id, { saving: true });
    const { data: u } = await supabase.auth.getUser();
    const payload: any = {
      user_id: row.user_id,
      message: next.message ?? '',
      enabled: next.enabled,
      updated_by: u.user?.id ?? null,
    };
    if (!row.greeting_id) payload.created_by = u.user?.id ?? null;

    const { data, error } = await (supabase as any)
      .from('greeting_messages')
      .upsert(payload, { onConflict: 'user_id' })
      .select('id')
      .maybeSingle();

    if (error) {
      toast.error('Failed to save greeting');
      updateRow(row.user_id, { saving: false });
      return;
    }
    updateRow(row.user_id, {
      saving: false,
      dirty: false,
      greeting_id: data?.id ?? row.greeting_id,
      ...overrides,
    });
    toast.success('Greeting saved');
  }

  async function toggleEnabled(row: ClientRow, enabled: boolean) {
    updateRow(row.user_id, { enabled });
    await persist(row, { enabled });
  }

  function applyTemplate(row: ClientRow, idx: number) {
    const name = (row.greetingName || (row.full_name || '').split(' ')[0] || 'there').trim() || 'there';
    updateRow(row.user_id, { message: TEMPLATES[idx].build(name), dirty: true });
  }

  const initials = (r: ClientRow) =>
    (r.full_name || r.email || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-brand" /> Greeting Messages
          </h1>
          <p className="text-sm text-muted-foreground">Personal welcome shown on each customer's dashboard. Toggle on to show, off to hide.</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search by name, email, company…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading client accounts…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground border border-dashed border-border rounded-2xl">
          No client accounts found.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(row => (
            <div key={row.user_id} className={cn(
              'rounded-2xl border border-border/50 bg-card/60 backdrop-blur p-4 transition-colors',
              row.enabled && 'border-brand/40 bg-brand/[0.04]'
            )}>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex items-start gap-3 lg:w-64 shrink-0">
                  <Avatar className="h-10 w-10 border border-border/50">
                    <AvatarImage src={row.avatar_url ?? undefined} />
                    <AvatarFallback>{initials(row)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{row.full_name || 'Unnamed'}</div>
                    <div className="text-xs text-muted-foreground truncate">{row.email}</div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {row.customer_id && <Badge variant="outline" className="text-[10px]">{row.customer_id}</Badge>}
                      {row.company && <Badge variant="secondary" className="text-[10px]">{row.company}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <Textarea
                    value={row.message}
                    onChange={e => updateRow(row.user_id, { message: e.target.value, dirty: true })}
                    placeholder="Write a personal welcome message for this client…"
                    className="min-h-[88px] resize-y"
                  />
                  <div className="flex flex-wrap items-center gap-2 justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Input
                        value={row.greetingName}
                        onChange={e => updateRow(row.user_id, { greetingName: e.target.value })}
                        placeholder="Name to use"
                        className="h-8 w-40 text-xs"
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5">
                            <Sparkles className="h-3.5 w-3.5" /> Use template
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-72">
                          <DropdownMenuLabel className="text-xs">Insert a preset</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {TEMPLATES.map((t, i) => (
                            <DropdownMenuItem key={t.label} onClick={() => applyTemplate(row, i)} className="flex-col items-start gap-0.5 py-2">
                              <span className="text-xs font-medium">{t.label}</span>
                              <span className="text-[11px] text-muted-foreground line-clamp-2">
                                {t.build(row.greetingName || (row.full_name || '').split(' ')[0] || 'there')}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{row.enabled ? 'Visible to client' : 'Hidden'}</span>
                        <Switch checked={row.enabled} onCheckedChange={v => toggleEnabled(row, v)} disabled={row.saving} />
                      </div>
                      <Button
                        size="sm"
                        onClick={() => persist(row)}
                        disabled={!row.dirty || row.saving}
                        className="h-8 gap-1.5"
                      >
                        {row.saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
