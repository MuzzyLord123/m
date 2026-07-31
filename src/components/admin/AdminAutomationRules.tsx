import { useEffect, useMemo, useState } from 'react';
import {
  Zap, Plus, Search, Loader2, Check, Trash2, Pencil, Activity,
  ArrowRight, Pause, Play, AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Panel, PanelHeader, EmptyState, SkeletonLedger, RelativeTime,
} from '@/components/platform';

/**
 * Automation.
 *
 * A rule is one sentence - when this happens, do that - so it is written
 * as one on the page rather than buried in a card. The ledger reads as
 * sentences you can scan, each carrying whether it is running, how many
 * times it has fired and when it last did, because a rule that has never
 * fired is the thing worth noticing.
 *
 * Runs are kept separately and honestly: a failed run shows its error
 * rather than a tidy status word.
 */

const TRIGGER_EVENTS = [
  { value: 'lead_status_changed', label: 'a lead changes status', category: 'Business relationships', description: 'Fires when a lead moves to a new status' },
  { value: 'lead_created', label: 'a new lead arrives', category: 'Business relationships', description: 'Fires when a new lead is added' },
  { value: 'deal_stage_changed', label: 'a deal changes stage', category: 'CRM', description: 'Fires when a deal moves stages' },
  { value: 'deal_won', label: 'a deal is won', category: 'CRM', description: 'Fires when a deal is marked as won' },
  { value: 'deal_lost', label: 'a deal is lost', category: 'CRM', description: 'Fires when a deal is marked as lost' },
  { value: 'invoice_paid', label: 'an invoice is paid', category: 'Billing', description: 'Fires when an invoice is marked as paid' },
  { value: 'invoice_overdue', label: 'an invoice goes overdue', category: 'Billing', description: 'Fires when an invoice passes its due date' },
  { value: 'asset_uploaded', label: 'a client uploads an asset', category: 'Assets', description: 'Fires when a client uploads an asset' },
  { value: 'ticket_created', label: 'a ticket is raised', category: 'Support', description: 'Fires when a new ticket is submitted' },
  { value: 'ticket_resolved', label: 'a ticket is resolved', category: 'Support', description: 'Fires when a ticket is resolved' },
  { value: 'content_request_submitted', label: 'a content request comes in', category: 'Content', description: 'Fires when a content request is created' },
  { value: 'client_created', label: 'a client account is created', category: 'Clients', description: 'Fires when a new client is onboarded' },
  { value: 'project_status_changed', label: 'a project changes status', category: 'Projects', description: 'Fires when a project changes status' },
  { value: 'message_received', label: 'a message arrives', category: 'Messages', description: 'Fires when a new message comes in' },
  { value: 'onboarding_step_completed', label: 'an onboarding step finishes', category: 'Onboarding', description: 'Fires when an onboarding step finishes' },
];

const ACTION_TYPES = [
  { value: 'create_project', label: 'create a project', category: 'Projects', description: 'Automatically create a new app project' },
  { value: 'send_notification', label: 'send a notification', category: 'Notifications', description: 'Send a notification to a team member' },
  { value: 'update_status', label: 'update the status', category: 'General', description: 'Change the status of a record' },
  { value: 'assign_team_member', label: 'assign a team member', category: 'Team', description: 'Auto-assign to a team member' },
  { value: 'create_task', label: 'create a task', category: 'Tasks', description: 'Create a new task or to-do' },
  { value: 'send_email', label: 'send an email', category: 'Email', description: 'Trigger an email notification' },
  { value: 'create_invoice', label: 'raise an invoice', category: 'Billing', description: 'Auto-generate an invoice' },
  { value: 'update_deal', label: 'update the deal', category: 'CRM', description: 'Modify a CRM deal' },
  { value: 'log_activity', label: 'log it to the audit trail', category: 'Audit', description: 'Write an entry to the audit log' },
  { value: 'webhook', label: 'call a webhook', category: 'Integration', description: 'POST data to an external URL' },
  { value: 'start_onboarding', label: 'start onboarding', category: 'Onboarding', description: 'Begin client onboarding process' },
];

interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  trigger_event: string;
  trigger_config: Record<string, any>;
  conditions: any[];
  action_type: string;
  action_config: Record<string, any>;
  last_triggered_at: string | null;
  trigger_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface RuleLog {
  id: string;
  rule_id: string;
  trigger_data: Record<string, any>;
  action_result: Record<string, any>;
  status: string;
  error_message: string | null;
  executed_at: string;
}

const KICKER = 'font-mono text-[9px] font-medium uppercase tracking-[0.16em] text-muted-foreground';

const triggerOf = (v: string) => TRIGGER_EVENTS.find(t => t.value === v);
const actionOf = (v: string) => ACTION_TYPES.find(a => a.value === v);

function grouped<T extends { category: string }>(list: T[]) {
  const map = new Map<string, T[]>();
  list.forEach(i => { map.set(i.category, [...(map.get(i.category) || []), i]); });
  return [...map.entries()];
}

export default function AdminAutomationRules() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<RuleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'rules' | 'runs'>('rules');

  const [editing, setEditing] = useState(false);
  const [editRule, setEditRule] = useState<Partial<AutomationRule>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AutomationRule | null>(null);

  const fetchRules = async () => {
    const { data } = await supabase.from('automation_rules')
      .select('*').order('created_at', { ascending: false });
    setRules(((data as any[]) || []) as AutomationRule[]);
    setLoading(false);
  };

  const fetchLogs = async () => {
    const { data } = await supabase.from('automation_rule_logs')
      .select('*').order('executed_at', { ascending: false }).limit(100);
    setLogs(((data as any[]) || []) as RuleLog[]);
  };

  useEffect(() => { fetchRules(); fetchLogs(); }, []);

  async function save() {
    if (!editRule.name?.trim()) { toast.error('The rule needs a name'); return; }
    if (!editRule.trigger_event) { toast.error('Choose what starts it'); return; }
    if (!editRule.action_type) { toast.error('Choose what it does'); return; }
    setSaving(true);
    const payload = {
      name: editRule.name.trim(),
      description: editRule.description || null,
      is_active: editRule.is_active ?? true,
      trigger_event: editRule.trigger_event,
      trigger_config: editRule.trigger_config || {},
      conditions: editRule.conditions || [],
      action_type: editRule.action_type,
      action_config: editRule.action_config || {},
    };
    const { error } = editRule.id
      ? await supabase.from('automation_rules').update(payload as any).eq('id', editRule.id)
      : await supabase.from('automation_rules').insert({ ...payload, created_by: user!.id } as any);
    setSaving(false);
    if (error) { toast.error(editRule.id ? 'The rule did not save' : 'The rule was not created'); return; }
    toast.success(editRule.id ? 'Rule saved' : 'Rule created');
    setEditing(false);
    fetchRules();
  }

  async function toggleActive(rule: AutomationRule) {
    const { error } = await supabase.from('automation_rules')
      .update({ is_active: !rule.is_active } as any).eq('id', rule.id);
    if (error) { toast.error('That did not change'); return; }
    setRules(prev => prev.map(r => (r.id === rule.id ? { ...r, is_active: !r.is_active } : r)));
  }

  const figures = useMemo(() => ({
    total: rules.length,
    running: rules.filter(r => r.is_active).length,
    fired: rules.reduce((a, r) => a + (r.trigger_count || 0), 0),
    silent: rules.filter(r => r.is_active && !r.trigger_count).length,
    failures: logs.filter(l => l.status !== 'success').length,
  }), [rules, logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rules;
    return rules.filter(r =>
      r.name.toLowerCase().includes(q)
      || (r.description || '').toLowerCase().includes(q)
      || (triggerOf(r.trigger_event)?.label || '').toLowerCase().includes(q)
      || (actionOf(r.action_type)?.label || '').toLowerCase().includes(q));
  }, [rules, search]);

  const ruleName = (id: string) => rules.find(r => r.id === id)?.name || 'A removed rule';

  if (loading) return <div className="p-4 sm:p-6"><SkeletonLedger rows={7} /></div>;

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-5 sm:px-6 sm:pt-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className={KICKER}>Automation</p>
            <h1 className="mt-1.5 font-display text-[26px] font-semibold leading-none tracking-[-0.02em] sm:text-[32px]">
              Rules
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
              Work the platform does on its own. Each rule is one sentence: when something happens, do this.
            </p>
          </div>
          <Button
            size="sm" className="h-9 gap-1.5 rounded-[10px] text-xs"
            onClick={() => { setEditRule({ is_active: true }); setEditing(true); }}
          >
            <Plus className="h-3.5 w-3.5" /> New rule
          </Button>
        </header>

        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[12px] border border-border/60 bg-border/60 sm:grid-cols-4">
          {[
            { label: 'Running', value: String(figures.running), meta: `${figures.total} rules in total`, tone: 'ok' as const },
            { label: 'Times fired', value: figures.fired.toLocaleString(), meta: 'Since each was made', tone: 'primary' as const },
            { label: 'Never fired', value: String(figures.silent), meta: figures.silent ? 'Running but idle' : 'All are earning their keep', tone: figures.silent ? ('attend' as const) : undefined },
            { label: 'Failed runs', value: String(figures.failures), meta: 'In the last 100 runs', tone: figures.failures ? ('risk' as const) : undefined },
          ].map(f => (
            <div key={f.label} className="bg-card px-4 py-3.5">
              <p className={KICKER}>{f.label}</p>
              <p className={cn(
                'mt-1.5 font-display text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums',
                f.tone === 'ok' && 'text-ok', f.tone === 'primary' && 'text-primary',
                f.tone === 'attend' && 'text-attend', f.tone === 'risk' && 'text-risk',
              )}>{f.value}</p>
              <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{f.meta}</p>
            </div>
          ))}
        </div>

        <div className="-mx-4 mt-5 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex min-w-max items-center gap-1 rounded-[12px] border border-border/60 bg-sunken/40 p-1.5">
            {([
              { key: 'rules', label: 'Rules', icon: Zap },
              { key: 'runs', label: 'Runs', icon: Activity },
            ] as const).map(t => (
              <button
                key={t.key}
                type="button"
                onClick={() => setView(t.key)}
                className={cn(
                  'flex h-10 shrink-0 items-center gap-2 rounded-[9px] px-3.5 text-[12.5px] font-medium transition-colors',
                  view === t.key ? 'border border-border/70 bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            ))}
          </div>
          {view === 'rules' && (
            <div className="relative ml-auto">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rules"
                className="h-9 w-[170px] rounded-[10px] pl-8 text-[12.5px] sm:w-[220px]"
              />
            </div>
          )}
        </div>

        <div className="mt-4">
          {view === 'rules' ? (
            <Panel>
              <PanelHeader label={`${filtered.length} rules`} />
              {filtered.length === 0 ? (
                <EmptyState
                  compact
                  title={search ? 'Nothing matches' : 'No rules yet'}
                  body={search ? 'Try a different word.' : 'A rule saves you doing the same thing twice. Start with one.'}
                />
              ) : (
                <ul className="divide-y divide-border/60">
                  {filtered.map(r => {
                    const t = triggerOf(r.trigger_event);
                    const a = actionOf(r.action_type);
                    return (
                      <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:flex-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleActive(r)}
                          title={r.is_active ? 'Pause this rule' : 'Start this rule'}
                          className={cn(
                            'flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border transition-colors',
                            r.is_active ? 'border-ok/40 bg-ok/[0.08] text-ok' : 'border-border/60 text-muted-foreground',
                          )}
                        >
                          {r.is_active ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13.5px] font-medium">{r.name}</p>
                          {/* The rule as a sentence, which is what it is. */}
                          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11.5px] leading-snug text-muted-foreground">
                            <span className="font-mono text-[9px] uppercase tracking-[0.12em]">When</span>
                            <span className="text-foreground/80">{t?.label || r.trigger_event}</span>
                            <ArrowRight className="h-3 w-3 shrink-0 opacity-60" />
                            <span className="text-foreground/80">{a?.label || r.action_type}</span>
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-mono text-[12px] font-medium tabular-nums">
                            {(r.trigger_count || 0).toLocaleString()}
                          </p>
                          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
                            {r.trigger_count === 1 ? 'time' : 'times'}
                          </p>
                        </div>

                        <span className="w-24 shrink-0 text-right text-[11px] text-muted-foreground">
                          {r.last_triggered_at ? <RelativeTime date={r.last_triggered_at} /> : 'Never fired'}
                        </span>

                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0"
                            onClick={() => { setEditRule({ ...r }); setEditing(true); }}
                            aria-label="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="sm" className="h-8 w-8 rounded-lg p-0 text-risk"
                            onClick={() => setDeleteTarget(r)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          ) : (
            <Panel>
              <PanelHeader label={`${logs.length} recent runs`}>
                {figures.failures > 0 && (
                  <span className="flex items-center gap-1.5 text-[11px] text-risk">
                    <AlertCircle className="h-3 w-3" /> {figures.failures} failed
                  </span>
                )}
              </PanelHeader>
              {logs.length === 0 ? (
                <EmptyState compact title="Nothing has run yet" body="Every time a rule fires it is recorded here, with what it did." />
              ) : (
                <div className="max-h-[560px] overflow-y-auto">
                  <ul className="divide-y divide-border/60">
                    {logs.map(l => {
                      const ok = l.status === 'success';
                      return (
                        <li key={l.id} className="flex items-start gap-3 px-4 py-2.5">
                          <span aria-hidden className={cn('mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full', ok ? 'bg-ok' : 'bg-risk')} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-medium">{ruleName(l.rule_id)}</p>
                            <p className={cn('mt-0.5 truncate text-[11px]', ok ? 'text-muted-foreground' : 'text-risk')}>
                              {ok
                                ? (Object.keys(l.action_result || {}).length
                                  ? JSON.stringify(l.action_result).slice(0, 110)
                                  : 'Ran without incident')
                                : (l.error_message || 'Failed without a reason given')}
                            </p>
                          </div>
                          <RelativeTime date={l.executed_at} className="shrink-0" />
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </Panel>
          )}
        </div>
      </div>

      {/* Writing the sentence */}
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editRule.id ? 'Edit rule' : 'New rule'}</DialogTitle>
            <DialogDescription className="text-[12.5px]">
              When something happens, do this. Both halves are required.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5">
            <div>
              <label className={KICKER}>Name</label>
              <Input
                value={editRule.name || ''}
                onChange={(e) => setEditRule(p => ({ ...p, name: e.target.value }))}
                placeholder="Raise an invoice when a deal is won"
                className="mt-1.5 h-10 text-[13px]"
                autoFocus
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={KICKER}>When</label>
                <Select
                  value={editRule.trigger_event || ''}
                  onValueChange={(v) => setEditRule(p => ({ ...p, trigger_event: v }))}
                >
                  <SelectTrigger className="mt-1.5 h-10 text-[13px]"><SelectValue placeholder="Choose what starts it" /></SelectTrigger>
                  <SelectContent>
                    {grouped(TRIGGER_EVENTS).map(([cat, items]) => (
                      <SelectGroup key={cat}>
                        <SelectLabel className="font-mono text-[9px] uppercase tracking-[0.14em]">{cat}</SelectLabel>
                        {items.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className={KICKER}>Then</label>
                <Select
                  value={editRule.action_type || ''}
                  onValueChange={(v) => setEditRule(p => ({ ...p, action_type: v }))}
                >
                  <SelectTrigger className="mt-1.5 h-10 text-[13px]"><SelectValue placeholder="Choose what it does" /></SelectTrigger>
                  <SelectContent>
                    {grouped(ACTION_TYPES).map(([cat, items]) => (
                      <SelectGroup key={cat}>
                        <SelectLabel className="font-mono text-[9px] uppercase tracking-[0.14em]">{cat}</SelectLabel>
                        {items.map(i => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* The sentence read back, so it can be checked before saving. */}
            {editRule.trigger_event && editRule.action_type && (
              <p className="flex flex-wrap items-center gap-1.5 rounded-[10px] border border-border/60 bg-sunken/40 px-3 py-2.5 text-[12.5px]">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">When</span>
                {triggerOf(editRule.trigger_event)?.label}
                <ArrowRight className="h-3 w-3 opacity-60" />
                {actionOf(editRule.action_type)?.label}
              </p>
            )}

            <div>
              <label className={KICKER}>Notes (optional)</label>
              <Textarea
                value={editRule.description || ''}
                onChange={(e) => setEditRule(p => ({ ...p, description: e.target.value }))}
                placeholder="Why this exists, for whoever reads it next"
                className="mt-1.5 min-h-[64px] text-[13px]"
              />
            </div>

            <label className="flex items-center justify-between rounded-[10px] border border-border/60 px-3.5 py-2.5">
              <span className="text-[12.5px]">Start it running as soon as it is saved</span>
              <Switch
                checked={editRule.is_active ?? true}
                onCheckedChange={(v) => setEditRule(p => ({ ...p, is_active: v }))}
              />
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" className="h-10 rounded-[10px]" onClick={() => setEditing(false)}>Cancel</Button>
            <Button className="h-10 gap-2 rounded-[10px]" disabled={saving} onClick={save}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {editRule.id ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              It stops running immediately. Everything it has already done stays as it is.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const { error } = await supabase.from('automation_rules').delete().eq('id', deleteTarget!.id);
                if (error) { toast.error('It was not deleted'); return; }
                toast.success('Rule deleted');
                setDeleteTarget(null);
                fetchRules();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollArea>
  );
}
