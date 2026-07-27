import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionPaywall } from '@/components/lounge/SubscriptionPaywall';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import {
  Workflow, Clock, Key, Activity, Plus, Trash2, Copy, Eye,
  EyeOff, CheckCircle2, XCircle, Loader2, BarChart3, Timer,
  RefreshCw, Zap, CalendarClock, Shield,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

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

  const statCards = [
    { label: 'Total Runs', value: totalRuns, icon: Activity, color: 'text-rose-500' },
    { label: 'Success Rate', value: `${successRate}%`, icon: CheckCircle2, color: 'text-emerald-500' },
    { label: 'Failed', value: failedRuns, icon: XCircle, color: 'text-red-500' },
    { label: 'Avg Duration', value: `${(avgDuration / 1000).toFixed(1)}s`, icon: Timer, color: 'text-amber-500' },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <LoungePageHeader
        title="Advanced Automations"
        description="Scheduled workflows, API keys, and detailed execution history"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/40">
              <CardContent className="p-4">
                <card.icon className={`w-4 h-4 ${card.color} mb-2`} />
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="runs" className="space-y-4">
        <div className="overflow-x-auto">
        <TabsList className="w-max bg-muted/50">
          <TabsTrigger value="runs">Run History</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>
        </div>

        {/* Runs Tab */}
        <TabsContent value="runs" className="space-y-4">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {runs.map(run => (
                <Card key={run.id} className="border-border/40">
                  <CardContent className="p-3 flex items-center gap-3">
                    {run.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    ) : run.status === 'failed' ? (
                      <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{run.trigger_type || 'manual'}</Badge>
                        <Badge variant={run.status === 'completed' ? 'default' : 'destructive'} className="text-[10px]">
                          {run.status}
                        </Badge>
                      </div>
                      {run.error_message && (
                        <p className="text-[11px] text-red-400 mt-1 truncate">{run.error_message}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-muted-foreground">{run.duration_ms ? `${(run.duration_ms / 1000).toFixed(1)}s` : '—'}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(run.created_at), { addSuffix: true })}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {runs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-12">No automation runs yet.</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Schedule workflows to run automatically</p>
            <Button size="sm" onClick={() => setShowNewSchedule(!showNewSchedule)}>
              <Plus className="w-4 h-4 mr-1" /> New Schedule
            </Button>
          </div>

          {showNewSchedule && (
            <Card className="border-border/40">
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Schedule Name</Label>
                    <Input value={newSchedule.name} onChange={e => setNewSchedule(p => ({ ...p, name: e.target.value }))} placeholder="Daily digest" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Cron Expression</Label>
                    <Select value={newSchedule.cron} onValueChange={v => setNewSchedule(p => ({ ...p, cron: v }))}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0 9 * * *">Daily at 9am</SelectItem>
                        <SelectItem value="0 9 * * 1">Weekly on Monday</SelectItem>
                        <SelectItem value="0 9 1 * *">Monthly (1st)</SelectItem>
                        <SelectItem value="0 */6 * * *">Every 6 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" onClick={createSchedule}>Create Schedule</Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {schedules.map(s => (
              <Card key={s.id} className="border-border/40">
                <CardContent className="p-3 flex items-center gap-3">
                  <CalendarClock className={`w-4 h-4 ${s.is_active ? 'text-emerald-500' : 'text-muted-foreground'} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.schedule_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      <code className="bg-muted/50 px-1 py-0.5 rounded text-[10px]">{s.cron_expression}</code>
                      {' · '}{s.run_count} runs
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleSchedule(s.id, s.is_active)}>
                      {s.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteSchedule(s.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {schedules.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No schedules configured.</p>
            )}
          </div>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api-keys" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Personal API keys for external integrations</p>
            <Button size="sm" onClick={() => setShowNewKey(!showNewKey)}>
              <Plus className="w-4 h-4 mr-1" /> New Key
            </Button>
          </div>

          {showNewKey && (
            <Card className="border-border/40">
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label className="text-xs">Key Name</Label>
                  <Input value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. Zapier Integration" className="mt-1" />
                </div>
                <Button size="sm" onClick={createAPIKey} disabled={creatingKey}>
                  {creatingKey ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Key className="w-4 h-4 mr-1" />}
                  Generate Key
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {apiKeys.map(key => (
              <Card key={key.id} className="border-border/40">
                <CardContent className="p-3 flex items-center gap-3">
                  <Shield className={`w-4 h-4 ${key.is_active ? 'text-emerald-500' : 'text-muted-foreground'} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{key.key_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      <code className="bg-muted/50 px-1 py-0.5 rounded text-[10px]">{key.key_prefix}••••••••</code>
                      {' · '}{key.usage_count} uses · {key.rate_limit}/min limit
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteAPIKey(key.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {apiKeys.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No API keys created yet.</p>
            )}
          </div>
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
