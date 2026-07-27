import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  UserPlus, Settings, Mail, ClipboardList, Image, Calendar,
  CheckCircle2, Clock, AlertTriangle, ArrowRight, Loader2,
  Sparkles, RefreshCw, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';

interface OnboardingRecord {
  id: string;
  deal_id: string | null;
  client_name: string;
  client_email: string | null;
  company_name: string | null;
  status: string;
  account_created: boolean;
  account_created_at: string | null;
  portal_configured: boolean;
  portal_configured_at: string | null;
  welcome_sent: boolean;
  welcome_sent_at: string | null;
  info_checklist_sent: boolean;
  info_checklist_sent_at: string | null;
  assets_requested: boolean;
  assets_requested_at: string | null;
  timeline_generated: boolean;
  timeline_generated_at: string | null;
  checklist_items: any[];
  timeline_data: any;
  onboarding_notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

const STEPS = [
  { key: 'account_created', label: 'Account Created', icon: UserPlus, description: 'Client account provisioned in the system' },
  { key: 'portal_configured', label: 'Portal Configured', icon: Settings, description: 'Customer portal modules activated' },
  { key: 'welcome_sent', label: 'Welcome Sequence', icon: Mail, description: 'Welcome email drip initiated' },
  { key: 'info_checklist_sent', label: 'Info Checklist', icon: ClipboardList, description: 'Required information checklist sent' },
  { key: 'assets_requested', label: 'Assets Requested', icon: Image, description: 'Creative assets request dispatched' },
  { key: 'timeline_generated', label: 'Timeline Generated', icon: Calendar, description: 'Project timeline auto-generated' },
] as const;

export function ClientOnboardingEngine() {
  const { user } = useAuth();
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('client_onboarding')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setRecords(data as unknown as OnboardingRecord[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  const getProgress = (record: OnboardingRecord) => {
    const completed = STEPS.filter(s => record[s.key as keyof OnboardingRecord]).length;
    return Math.round((completed / STEPS.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const triggerOnboarding = async (record: OnboardingRecord) => {
    setRunningId(record.id);
    try {
      // Simulate step-by-step execution
      const updates: Record<string, any> = {};
      const now = new Date().toISOString();

      for (const step of STEPS) {
        if (!record[step.key as keyof OnboardingRecord]) {
          updates[step.key] = true;
          updates[`${step.key}_at`] = now;
          await new Promise(r => setTimeout(r, 400));
        }
      }

      // Generate checklist items if not present
      if (!record.checklist_items?.length) {
        updates.checklist_items = [
          { id: 'brand-guidelines', label: 'Brand Guidelines', required: true, completed: false },
          { id: 'content-copy', label: 'Website Copy & Content', required: true, completed: false },
          { id: 'domain-access', label: 'Domain & DNS Access', required: true, completed: false },
          { id: 'social-accounts', label: 'Social Media Access', required: false, completed: false },
          { id: 'analytics', label: 'Analytics Access', required: false, completed: false },
          { id: 'hosting', label: 'Hosting Details', required: true, completed: false },
          { id: 'competitors', label: 'Competitor Websites', required: false, completed: false },
          { id: 'audience', label: 'Target Audience Profile', required: true, completed: false },
          { id: 'legal', label: 'Privacy Policy & Terms', required: true, completed: false },
        ];
      }

      updates.status = 'active';
      updates.completed_at = now;

      const { error } = await supabase
        .from('client_onboarding')
        .update(updates)
        .eq('id', record.id);

      if (error) throw error;
      toast.success('Onboarding flow completed successfully');
      fetchRecords();
    } catch (err: any) {
      toast.error(err.message || 'Onboarding flow failed');
    } finally {
      setRunningId(null);
    }
  };

  const toggleChecklistItem = async (recordId: string, itemId: string) => {
    const record = records.find(r => r.id === recordId);
    if (!record) return;
    const items = [...(record.checklist_items || [])];
    const idx = items.findIndex((i: any) => i.id === itemId);
    if (idx >= 0) {
      items[idx] = { ...items[idx], completed: !items[idx].completed };
      await supabase.from('client_onboarding').update({ checklist_items: items as any }).eq('id', recordId);
      setRecords(prev => prev.map(r => r.id === recordId ? { ...r, checklist_items: items } : r));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Client Onboarding</h2>
          <p className="text-xs text-muted-foreground">Automated onboarding flows triggered by deal closures</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {records.length} {records.length === 1 ? 'client' : 'clients'}
        </Badge>
      </div>

      {records.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-xl">
          <UserPlus className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">No onboarding records yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Close a deal in CRM to trigger automatic onboarding
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-3">
            {records.map(record => {
              const progress = getProgress(record);
              const isExpanded = expandedId === record.id;
              const isRunning = runningId === record.id;

              return (
                <div key={record.id} className="border border-border rounded-xl bg-card overflow-hidden">
                  {/* Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">{record.client_name}</h3>
                        <Badge className={`text-[10px] px-1.5 py-0 border ${getStatusColor(record.status)}`}>
                          {record.status}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {record.company_name || 'No company'} • {new Date(record.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24">
                        <Progress value={progress} className="h-1.5" />
                        <p className="text-[10px] text-muted-foreground text-right mt-0.5">{progress}%</p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {/* Steps */}
                      <div className="p-4 space-y-2">
                        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Onboarding Steps</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {STEPS.map(step => {
                            const done = record[step.key as keyof OnboardingRecord];
                            const StepIcon = step.icon;
                            const timestamp = record[`${step.key}_at` as keyof OnboardingRecord];
                            return (
                              <div
                                key={step.key}
                                className={`flex items-start gap-2 p-2.5 rounded-lg border transition-colors ${
                                  done
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : 'bg-muted/20 border-border/50'
                                }`}
                              >
                                <div className={`p-1 rounded ${done ? 'bg-emerald-500/10' : 'bg-muted/50'}`}>
                                  {done
                                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    : <StepIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                  }
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-medium">{step.label}</p>
                                  <p className="text-[9px] text-muted-foreground">{step.description}</p>
                                  {done && timestamp && (
                                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                                      ✓ {new Date(timestamp as string).toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Checklist */}
                      {record.checklist_items?.length > 0 && (
                        <div className="border-t border-border p-4">
                          <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Required Information ({(record.checklist_items as any[]).filter((i: any) => i.completed).length}/{record.checklist_items.length})
                          </h4>
                          <div className="space-y-1.5">
                            {(record.checklist_items as any[]).map((item: any) => (
                              <label
                                key={item.id}
                                className="flex items-center gap-2 p-1.5 rounded hover:bg-accent/30 cursor-pointer"
                              >
                                <Checkbox
                                  checked={item.completed}
                                  onCheckedChange={() => toggleChecklistItem(record.id, item.id)}
                                />
                                <span className={`text-xs ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                                  {item.label}
                                </span>
                                {item.required && !item.completed && (
                                  <Badge variant="outline" className="text-[9px] px-1 py-0 border-amber-500/30 text-amber-600">
                                    Required
                                  </Badge>
                                )}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="border-t border-border p-3 flex items-center gap-2">
                        {progress < 100 && (
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5"
                            onClick={() => triggerOnboarding(record)}
                            disabled={isRunning}
                          >
                            {isRunning ? (
                              <><Loader2 className="h-3 w-3 animate-spin" /> Running...</>
                            ) : (
                              <><Sparkles className="h-3 w-3" /> Run Onboarding Flow</>
                            )}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5"
                          onClick={() => fetchRecords()}
                        >
                          <RefreshCw className="h-3 w-3" /> Refresh
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}