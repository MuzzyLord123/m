import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPaywall } from '@/components/lounge/SubscriptionPaywall';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Key, Plus, Trash2, Eye, EyeOff, Zap, CalendarClock, Shield } from 'lucide-react';
import {
  PageHeader, Panel, PanelHeader, StatusBadge, RelativeTime,
  EmptyState, SkeletonLedger, FIELD, FIELD_LABEL,
} from '@/components/platform';

/* ─── Types ─── */
interface AutomationRun {
  id: string;
  workflow_id: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  duration_ms: number | null;
  error_message: string | null;
  trigger_type: string | null;
  created_at: string;
}

interface AutomationSchedule {
  id: string;
  workflow_id: string | null;
  schedule_name: string;
  cron_expression: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
}

interface APIKey {
  id: string;
  key_name: string;
  key_prefix: string;
  is_active: boolean;
  rate_limit: number;
  usage_count: number;
  last_used_at: string | null;
  created_at: string;
}

const TAB_TRIGGER =
  'relative -mb-px gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] text-muted-foreground shadow-none transition-colors duration-150 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none';

function LoungeAutomationsProInner() {
  const { user } = useAuth();
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [schedules, setSchedules] = useState<AutomationSchedule[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewKey, setShowNewKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [showNewSchedule, setShowNewSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ name: '', cron: '0 9 * * 1' });

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [runsRes, schedulesRes, keysRes] = await Promise.all([
        supabase.from('automation_runs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
        supabase.from('automation_schedules').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('api_keys').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      setRuns((runsRes.data as any) || []);
      setSchedules((schedulesRes.data as any) || []);
      setApiKeys((keysRes.data as any) || []);
    } catch {
      toast.error('Failed to load automation data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createAPIKey = async () => {
    if (!user || !newKeyName.trim()) return;
    setCreatingKey(true);
    try {
      const rawKey = `qk_${crypto.randomUUID().replace(/-/g, '')}`;
      const prefix = rawKey.slice(0, 8);
      const encoder = new TextEncoder();
      const data = encoder.encode(rawKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase.from('api_keys').insert({
        user_id: user.id,
        key_name: newKeyName,
        key_prefix: prefix,
        key_hash: keyHash,
      } as any);

      if (error) throw error;

      await navigator.clipboard.writeText(rawKey);
      toast.success('API key created and copied to clipboard. Save it — you won\'t see it again.');
      setNewKeyName('');
      setShowNewKey(false);
      fetchData();
    } catch {
      toast.error('Failed to create API key');
    } finally {
      setCreatingKey(false);
    }
  };

  const deleteAPIKey = async (id: string) => {
    await supabase.from('api_keys').delete().eq('id', id);
    setApiKeys(prev => prev.filter(k => k.id !== id));
    toast.success('API key deleted');
  };

  const createSchedule = async () => {
    if (!user || !newSchedule.name.trim()) return;
    const { error } = await supabase.from('automation_schedules').insert({
      user_id: user.id,
      schedule_name: newSchedule.name,
      cron_expression: newSchedule.cron,
    } as any);
    if (error) { toast.error('Failed to create schedule'); return; }
    toast.success('Schedule created');
    setNewSchedule({ name: '', cron: '0 9 * * 1' });
    setShowNewSchedule(false);
    fetchData();
  };

  const toggleSchedule = async (id: string, active: boolean) => {
    await supabase.from('automation_schedules').update({ is_active: !active } as any).eq('id', id);
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: !active } : s));
  };

  const deleteSchedule = async (id: string) => {
    await supabase.from('automation_schedules').delete().eq('id', id);
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast.success('Schedule deleted');
  };

  // Stats
  const totalRuns = runs.length;
  const successRuns = runs.filter(r => r.status === 'completed').length;
  const failedRuns = runs.filter(r => r.status === 'failed').length;
  const successRate = totalRuns > 0 ? ((successRuns / totalRuns) * 100).toFixed(0) : '0';
  const avgDuration = runs.filter(r => r.duration_ms).reduce((sum, r) => sum + (r.duration_ms || 0), 0) / (runs.filter(r => r.duration_ms).length || 1);

  const stats = [
    { label: 'Runs', value: String(totalRuns) },
    { label: 'Success rate', value: `${successRate}%` },
    { label: 'Failed', value: String(failedRuns) },
    { label: 'Avg duration', value: `${(avgDuration / 1000).toFixed(1)}s` },
  ];

  return (
    <div className="mx-auto max-w-[1024px] space-y-5 px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Automations"
        title="Advanced automations"
        description="Scheduled workflows, API keys and execution history"
      />

      {/* Quiet stat strip */}
      <Panel as="div">
        <div className="grid grid-cols-2 divide-x divide-border/60 lg:grid-cols-4">
          {stats.map(s => (
            <div key={s.label} className="px-4 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{s.value}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Tabs defaultValue="runs" className="space-y-4">
        <div className="flex items-center gap-1 border-b border-border/60">
          <TabsList className="h-auto gap-1 rounded-none border-0 bg-transparent p-0">
            <TabsTrigger value="runs" className={TAB_TRIGGER}>Run history</TabsTrigger>
            <TabsTrigger value="schedules" className={TAB_TRIGGER}>Schedules</TabsTrigger>
            <TabsTrigger value="api-keys" className={TAB_TRIGGER}>API keys</TabsTrigger>
          </TabsList>
        </div>

        {/* Runs Tab */}
        <TabsContent value="runs" className="mt-0">
          <Panel as="div">
            <PanelHeader label="Last 50 runs" />
            {loading ? (
              <SkeletonLedger rows={6} />
            ) : runs.length === 0 ? (
              <EmptyState
                compact
                title="No runs yet"
                body="When a workflow runs, its outcome and timing appear here."
              />
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                {runs.map(run => (
                  <div key={run.id} className="flex items-center gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
                    <StatusBadge status={run.status} className="w-24 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
                        {run.trigger_type || 'manual'}
                      </p>
                      {run.error_message && (
                        <p className="mt-0.5 truncate text-[11.5px] text-risk">{run.error_message}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-[11px] tabular-nums text-ink-2">
                        {run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}
                      </p>
                      <RelativeTime date={run.created_at} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="mt-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">Schedule workflows to run automatically</p>
            <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={() => setShowNewSchedule(!showNewSchedule)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> New schedule
            </Button>
          </div>

          {showNewSchedule && (
            <Panel as="div" className="space-y-3 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className={FIELD_LABEL}>Schedule name</Label>
                  <Input value={newSchedule.name} onChange={e => setNewSchedule(p => ({ ...p, name: e.target.value }))} placeholder="Daily digest" className="mt-1" />
                </div>
                <div>
                  <Label className={FIELD_LABEL}>Frequency</Label>
                  <Select value={newSchedule.cron} onValueChange={v => setNewSchedule(p => ({ ...p, cron: v }))}>
                    <SelectTrigger className={`mt-1.5 ${FIELD}`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0 9 * * *">Daily at 9am</SelectItem>
                      <SelectItem value="0 9 * * 1">Weekly on Monday</SelectItem>
                      <SelectItem value="0 9 1 * *">Monthly (1st)</SelectItem>
                      <SelectItem value="0 */6 * * *">Every 6 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={createSchedule}>Create schedule</Button>
            </Panel>
          )}

          <Panel as="div">
            {loading ? (
              <SkeletonLedger rows={3} />
            ) : schedules.length === 0 ? (
              <EmptyState
                compact
                title="No schedules yet"
                body="Create a schedule to run a workflow on a fixed rhythm."
              />
            ) : (
              schedules.map(s => (
                <div key={s.id} className="flex items-center gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
                  <CalendarClock className={`h-4 w-4 shrink-0 ${s.is_active ? 'text-ok' : 'text-muted-foreground'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-[450] text-foreground">{s.schedule_name}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[10px]">{s.cron_expression}</code>
                      {' · '}<span className="tabular-nums">{s.run_count}</span> runs
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={s.is_active ? 'Pause schedule' : 'Resume schedule'} onClick={() => toggleSchedule(s.id, s.is_active)}>
                      {s.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Delete schedule" onClick={() => deleteSchedule(s.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Panel>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="mt-0 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-muted-foreground">Personal API keys for external integrations</p>
            <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={() => setShowNewKey(!showNewKey)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> New key
            </Button>
          </div>

          {showNewKey && (
            <Panel as="div" className="space-y-3 p-4">
              <div>
                <Label className={FIELD_LABEL}>Key name</Label>
                <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. Zapier Integration" className="mt-1" />
              </div>
              <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={createAPIKey} disabled={creatingKey}>
                <Key className="mr-1 h-3.5 w-3.5" />
                {creatingKey ? 'Generating key' : 'Generate key'}
              </Button>
            </Panel>
          )}

          <Panel as="div">
            {loading ? (
              <SkeletonLedger rows={3} />
            ) : apiKeys.length === 0 ? (
              <EmptyState
                compact
                title="No API keys yet"
                body="Generate a key to connect external tools to your account."
              />
            ) : (
              apiKeys.map(key => (
                <div key={key.id} className="flex items-center gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
                  <Shield className={`h-4 w-4 shrink-0 ${key.is_active ? 'text-ok' : 'text-muted-foreground'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-[450] text-foreground">{key.key_name}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      <code className="rounded bg-sunken px-1 py-0.5 font-mono text-[10px]">{key.key_prefix}••••••••</code>
                      {' · '}<span className="tabular-nums">{key.usage_count}</span> uses · <span className="tabular-nums">{key.rate_limit}</span>/min limit
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Delete API key" onClick={() => deleteAPIKey(key.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function LoungeAutomationsPro() {
  return (
    <SubscriptionPaywall
      featureKey="automations-pro"
      featureDescription="Scheduled automations, webhook integrations, API access, and detailed execution logs."
      icon={Zap}
    >
      <LoungeAutomationsProInner />
    </SubscriptionPaywall>
  );
}
