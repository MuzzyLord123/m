import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Plus, Search, Edit2, Trash2, ArrowLeft, Play, Pause,
  Clock, MoreVertical, Activity, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, ArrowRight, Filter, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ─── Trigger & Action definitions ───

const TRIGGER_EVENTS = [
  { value: 'lead_status_changed', label: 'Lead status changed', category: 'Leads', description: 'Fires when a lead moves to a new status' },
  { value: 'lead_created', label: 'New lead created', category: 'Leads', description: 'Fires when a new lead is added' },
  { value: 'deal_stage_changed', label: 'Deal stage changed', category: 'CRM', description: 'Fires when a deal moves stages' },
  { value: 'deal_won', label: 'Deal won', category: 'CRM', description: 'Fires when a deal is marked as won' },
  { value: 'deal_lost', label: 'Deal lost', category: 'CRM', description: 'Fires when a deal is marked as lost' },
  { value: 'invoice_paid', label: 'Invoice paid', category: 'Billing', description: 'Fires when an invoice is marked as paid' },
  { value: 'invoice_overdue', label: 'Invoice overdue', category: 'Billing', description: 'Fires when an invoice passes its due date' },
  { value: 'asset_uploaded', label: 'Asset uploaded', category: 'Assets', description: 'Fires when a client uploads an asset' },
  { value: 'ticket_created', label: 'Support ticket created', category: 'Support', description: 'Fires when a new ticket is submitted' },
  { value: 'ticket_resolved', label: 'Ticket resolved', category: 'Support', description: 'Fires when a ticket is resolved' },
  { value: 'content_request_submitted', label: 'Content request submitted', category: 'Content', description: 'Fires when a content request is created' },
  { value: 'client_created', label: 'New client account created', category: 'Clients', description: 'Fires when a new client is onboarded' },
  { value: 'project_status_changed', label: 'Project status changed', category: 'Projects', description: 'Fires when a project changes status' },
  { value: 'message_received', label: 'Message received', category: 'Messages', description: 'Fires when a new message comes in' },
  { value: 'onboarding_step_completed', label: 'Onboarding step completed', category: 'Onboarding', description: 'Fires when an onboarding step finishes' },
];

const ACTION_TYPES = [
  { value: 'create_project', label: 'Create project', category: 'Projects', description: 'Automatically create a new app project' },
  { value: 'send_notification', label: 'Send notification', category: 'Notifications', description: 'Send a notification to a team member' },
  { value: 'update_status', label: 'Update status', category: 'General', description: 'Change the status of a record' },
  { value: 'assign_team_member', label: 'Assign team member', category: 'Team', description: 'Auto-assign to a team member' },
  { value: 'create_task', label: 'Create task', category: 'Tasks', description: 'Create a new task or to-do' },
  { value: 'send_email', label: 'Send email', category: 'Email', description: 'Trigger an email notification' },
  { value: 'create_invoice', label: 'Create invoice', category: 'Billing', description: 'Auto-generate an invoice' },
  { value: 'update_deal', label: 'Update deal', category: 'CRM', description: 'Modify a CRM deal' },
  { value: 'log_activity', label: 'Log activity', category: 'Audit', description: 'Write an entry to the audit log' },
  { value: 'webhook', label: 'Call webhook', category: 'Integration', description: 'POST data to an external URL' },
  { value: 'start_onboarding', label: 'Start onboarding flow', category: 'Onboarding', description: 'Begin client onboarding process' },
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

export default function AdminAutomationRules() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<RuleLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'rules' | 'logs'>('rules');

  // Editor
  const [editing, setEditing] = useState(false);
  const [editRule, setEditRule] = useState<Partial<AutomationRule>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AutomationRule | null>(null);

  useEffect(() => { fetchRules(); fetchLogs(); }, []);

  const fetchRules = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('automation_rules')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setRules((data as AutomationRule[]) || []);
    setLoading(false);
  };

  const fetchLogs = async () => {
    const { data } = await supabase
      .from('automation_rule_logs')
      .select('*')
      .order('executed_at', { ascending: false })
      .limit(100);
    if (data) setLogs(data as RuleLog[]);
  };

  const filteredRules = rules.filter(r =>
    !searchTerm ||
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.trigger_event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.action_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startNew = () => {
    setEditRule({
      name: '',
      description: '',
      is_active: true,
      trigger_event: '',
      trigger_config: {},
      conditions: [],
      action_type: '',
      action_config: {},
    });
    setEditing(true);
  };

  const startEdit = (rule: AutomationRule) => {
    setEditRule({ ...rule });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editRule.name?.trim()) { toast.error('Name is required'); return; }
    if (!editRule.trigger_event) { toast.error('Select a trigger event'); return; }
    if (!editRule.action_type) { toast.error('Select an action'); return; }
    setSaving(true);

    const payload = {
      name: editRule.name!.trim(),
      description: editRule.description || null,
      is_active: editRule.is_active ?? true,
      trigger_event: editRule.trigger_event!,
      trigger_config: editRule.trigger_config || {},
      conditions: editRule.conditions || [],
      action_type: editRule.action_type!,
      action_config: editRule.action_config || {},
    };

    if (editRule.id) {
      const { error } = await supabase.from('automation_rules').update(payload).eq('id', editRule.id);
      if (error) toast.error('Failed to update rule'); else { toast.success('Rule updated'); setEditing(false); fetchRules(); }
    } else {
      const { error } = await supabase.from('automation_rules').insert({ ...payload, created_by: user!.id });
      if (error) toast.error('Failed to create rule'); else { toast.success('Rule created'); setEditing(false); fetchRules(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('automation_rules').delete().eq('id', deleteTarget.id);
    if (error) toast.error('Failed to delete'); else { toast.success('Rule deleted'); setDeleteTarget(null); fetchRules(); }
  };

  const toggleActive = async (rule: AutomationRule) => {
    const { error } = await supabase.from('automation_rules').update({ is_active: !rule.is_active }).eq('id', rule.id);
    if (error) toast.error('Failed to toggle'); else fetchRules();
  };

  const getTriggerLabel = (val: string) => TRIGGER_EVENTS.find(t => t.value === val)?.label || val;
  const getActionLabel = (val: string) => ACTION_TYPES.find(a => a.value === val)?.label || val;
  const getTriggerCategory = (val: string) => TRIGGER_EVENTS.find(t => t.value === val)?.category || '';
  const getActionCategory = (val: string) => ACTION_TYPES.find(a => a.value === val)?.category || '';

  const stats = {
    total: rules.length,
    active: rules.filter(r => r.is_active).length,
    inactive: rules.filter(r => !r.is_active).length,
    totalExecutions: rules.reduce((acc, r) => acc + r.trigger_count, 0),
  };

  // ─── Editor View ───
  if (editing) {
    return (
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : editRule.id ? 'Update Rule' : 'Create Rule'}
          </Button>
        </div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="rounded-[12px] border-border/60 shadow-none">
            <CardHeader><CardTitle className="text-[14px] font-semibold tracking-[-0.01em]">Rule Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Rule Name</Label>
                <Input
                  placeholder="e.g. Auto-create project when lead engaged"
                  value={editRule.name || ''}
                  onChange={e => setEditRule(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Description (optional)</Label>
                <Textarea
                  placeholder="What does this rule do?"
                  value={editRule.description || ''}
                  onChange={e => setEditRule(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[60px]"
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={editRule.is_active ?? true}
                  onCheckedChange={v => setEditRule(prev => ({ ...prev, is_active: v }))}
                />
                <Label className="text-sm">Active</Label>
              </div>
            </CardContent>
          </Card>

          {/* IF - Trigger */}
          <Card className="rounded-[12px] border-border/60 shadow-none border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold tracking-[-0.01em] flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-sunken flex items-center justify-center text-ink-2 font-mono text-[10px] font-semibold">IF</span>
                When this happens…
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={editRule.trigger_event || ''}
                onValueChange={v => setEditRule(prev => ({ ...prev, trigger_event: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select a trigger event..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    TRIGGER_EVENTS.reduce<Record<string, typeof TRIGGER_EVENTS>>((acc, t) => {
                      (acc[t.category] = acc[t.category] || []).push(t);
                      return acc;
                    }, {})
                  ).map(([cat, triggers]) => (
                    <div key={cat}>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{cat}</div>
                      {triggers.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          <div className="flex flex-col">
                            <span>{t.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {editRule.trigger_event && (
                <p className="text-xs text-muted-foreground">
                  {TRIGGER_EVENTS.find(t => t.value === editRule.trigger_event)?.description}
                </p>
              )}

              {/* Condition: trigger_config for status-based triggers */}
              {editRule.trigger_event === 'lead_status_changed' && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <Label className="text-xs">When status becomes</Label>
                  <Select
                    value={(editRule.trigger_config as any)?.to_status || 'any'}
                    onValueChange={v => setEditRule(prev => ({ ...prev, trigger_config: { ...(prev.trigger_config || {}), to_status: v } }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any status</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="engaged">Engaged</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="proposal_sent">Proposal Sent</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editRule.trigger_event === 'deal_stage_changed' && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <Label className="text-xs">When stage becomes</Label>
                  <Select
                    value={(editRule.trigger_config as any)?.to_stage || 'any'}
                    onValueChange={v => setEditRule(prev => ({ ...prev, trigger_config: { ...(prev.trigger_config || {}), to_stage: v } }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any stage</SelectItem>
                      <SelectItem value="discovery">Discovery</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="negotiation">Negotiation</SelectItem>
                      <SelectItem value="closed_won">Closed Won</SelectItem>
                      <SelectItem value="closed_lost">Closed Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          {/* THEN - Action */}
          <Card className="rounded-[12px] border-border/60 shadow-none border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-[14px] font-semibold tracking-[-0.01em] flex items-center gap-2">
                <span className="h-6 w-6 rounded-md bg-sunken flex items-center justify-center text-ink-2 font-mono text-[10px] font-semibold">DO</span>
                Then do this…
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={editRule.action_type || ''}
                onValueChange={v => setEditRule(prev => ({ ...prev, action_type: v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select an action..." /></SelectTrigger>
                <SelectContent>
                  {Object.entries(
                    ACTION_TYPES.reduce<Record<string, typeof ACTION_TYPES>>((acc, a) => {
                      (acc[a.category] = acc[a.category] || []).push(a);
                      return acc;
                    }, {})
                  ).map(([cat, actions]) => (
                    <div key={cat}>
                      <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{cat}</div>
                      {actions.map(a => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {editRule.action_type && (
                <p className="text-xs text-muted-foreground">
                  {ACTION_TYPES.find(a => a.value === editRule.action_type)?.description}
                </p>
              )}

              {/* Webhook config */}
              {editRule.action_type === 'webhook' && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <Label className="text-xs">Webhook URL</Label>
                  <Input
                    placeholder="https://hooks.zapier.com/..."
                    value={(editRule.action_config as any)?.url || ''}
                    onChange={e => setEditRule(prev => ({ ...prev, action_config: { ...(prev.action_config || {}), url: e.target.value } }))}
                  />
                </div>
              )}

              {/* Send notification config */}
              {editRule.action_type === 'send_notification' && (
                <div className="space-y-1.5 pt-2 border-t border-border/50">
                  <Label className="text-xs">Notification message</Label>
                  <Input
                    placeholder="e.g. New asset uploaded by {{client_name}}"
                    value={(editRule.action_config as any)?.message || ''}
                    onChange={e => setEditRule(prev => ({ ...prev, action_config: { ...(prev.action_config || {}), message: e.target.value } }))}
                  />
                  <p className="text-[10px] text-muted-foreground">Use {'{{variable}}'} for dynamic values</p>
                </div>
              )}

              {/* Send email config */}
              {editRule.action_type === 'send_email' && (
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Recipient email</Label>
                    <Input
                      placeholder="dev@company.com"
                      value={(editRule.action_config as any)?.to_email || ''}
                      onChange={e => setEditRule(prev => ({ ...prev, action_config: { ...(prev.action_config || {}), to_email: e.target.value } }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Subject</Label>
                    <Input
                      placeholder="e.g. New asset uploaded"
                      value={(editRule.action_config as any)?.subject || ''}
                      onChange={e => setEditRule(prev => ({ ...prev, action_config: { ...(prev.action_config || {}), subject: e.target.value } }))}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // ─── Main List ───
  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" /> Automation Rules
          </h1>
          <p className="text-sm text-muted-foreground mt-1">If this, then that — automate your platform workflows</p>
        </div>
        <Button onClick={startNew} className="gap-2">
          <Plus className="w-4 h-4" /> New Rule
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Rules', value: stats.total, icon: Zap },
          { label: 'Active', value: stats.active, icon: Play },
          { label: 'Inactive', value: stats.inactive, icon: Pause },
          { label: 'Executions', value: stats.totalExecutions, icon: Activity },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="font-display text-[22px] font-semibold tabular-nums tracking-[-0.02em]">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeView} onValueChange={v => setActiveView(v as any)}>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <TabsList>
            <TabsTrigger value="rules" className="gap-1.5"><Zap className="w-3.5 h-3.5" /> Rules</TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5"><Activity className="w-3.5 h-3.5" /> Execution Log</TabsTrigger>
          </TabsList>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search rules..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 w-full sm:w-[250px]" />
          </div>
        </div>

        <TabsContent value="rules" className="mt-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-5 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3" />
                    <div className="h-3 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRules.length === 0 ? (
            <Card className="rounded-[12px] border-border/60 shadow-none">
              <CardContent className="py-16 text-center">
                <Zap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No automation rules yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Create your first "if this, then that" rule</p>
                <Button onClick={startNew} className="mt-4 gap-2"><Plus className="w-4 h-4" /> Create Rule</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredRules.map((rule, idx) => (
                  <motion.div
                    key={rule.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Card className={`group transition-all hover:border-primary/20 ${!rule.is_active ? 'opacity-60' : ''}`}>
                      <CardContent className="py-4 px-5">
                        <div className="flex items-center gap-4">
                          {/* Toggle */}
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleActive(rule)}
                            className="shrink-0"
                          />

                          {/* Rule info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm truncate">{rule.name}</p>
                              {!rule.is_active && <Badge variant="outline" className="text-[10px]">Paused</Badge>}
                            </div>
                            {/* IF → THEN flow */}
                            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                              <Badge variant="outline" className="text-[10px] bg-foreground/[0.06] text-ink-2 border-border/60 gap-1">
                                IF <span className="font-normal">{getTriggerLabel(rule.trigger_event)}</span>
                              </Badge>
                              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                              <Badge variant="outline" className="text-[10px] bg-ok/10 text-ok border-ok/20 gap-1">
                                DO <span className="font-normal">{getActionLabel(rule.action_type)}</span>
                              </Badge>
                            </div>
                            {rule.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{rule.description}</p>
                            )}
                          </div>

                          {/* Meta */}
                          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0 text-right">
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Activity className="w-3 h-3" /> {rule.trigger_count} runs
                            </span>
                            {rule.last_triggered_at && (
                              <span className="text-[10px] text-muted-foreground/60">
                                Last: {format(new Date(rule.last_triggered_at), 'MMM d, HH:mm')}
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem onClick={() => startEdit(rule)}>
                                <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toggleActive(rule)}>
                                {rule.is_active ? <Pause className="w-3.5 h-3.5 mr-2" /> : <Play className="w-3.5 h-3.5 mr-2" />}
                                {rule.is_active ? 'Pause' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(rule)}>
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          {logs.length === 0 ? (
            <Card className="rounded-[12px] border-border/60 shadow-none">
              <CardContent className="py-16 text-center">
                <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No executions yet</p>
                <p className="text-sm text-muted-foreground/60 mt-1">Rule execution history will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {logs.map(log => {
                const rule = rules.find(r => r.id === log.rule_id);
                return (
                  <Card key={log.id}>
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {log.status === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-ok shrink-0" />
                        ) : log.status === 'error' ? (
                          <XCircle className="w-4 h-4 text-destructive shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-attend shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{rule?.name || 'Deleted rule'}</p>
                          {log.error_message && <p className="text-xs text-destructive mt-0.5">{log.error_message}</p>}
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {format(new Date(log.executed_at), 'MMM d, HH:mm:ss')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Rule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteTarget?.name}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
