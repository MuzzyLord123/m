import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, Play, Pause, Square, Plus, Search, Filter,
  Calendar, Users, Briefcase, Tag, BarChart3, TrendingUp,
  ChevronDown, MoreHorizontal, Edit3, Trash2, ArrowUpRight,
  Timer, Target, Zap, CheckCircle2, AlertCircle, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TimeEntry {
  id: string;
  task: string;
  project: string;
  projectColor: string;
  client?: string;
  tags: string[];
  startTime: string;
  duration: number;
  billable: boolean;
  rate?: number;
  notes?: string;
}

export default function OfficeTimeTracker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerTask, setTimerTask] = useState('');
  const [timerProject, setTimerProject] = useState('');
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [showManual, setShowManual] = useState(false);
  const [newEntry, setNewEntry] = useState({ task: '', project: '', duration: '', billable: true, rate: '' });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load entries from DB
  const fetchEntries = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('time_entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) {
      setEntries(data.map((e: any) => ({
        id: e.id, task: e.task, project: e.project, projectColor: e.project_color || '#6366f1',
        client: e.client || '', tags: e.tags || [],
        startTime: new Date(e.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: e.duration_minutes, billable: e.billable, rate: Number(e.rate) || undefined, notes: e.notes || '',
      })));
    }
  }, [user]);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning]);

  const formatTimer = (secs: number) => {
    const h = Math.floor(secs / 3600).toString().padStart(2, '0');
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const stopTimer = async () => {
    if (elapsed > 0 && timerTask.trim() && user) {
      const dur = Math.round(elapsed / 60);
      const { data, error } = await supabase.from('time_entries').insert({
        user_id: user.id, task: timerTask, project: timerProject || 'Unassigned',
        project_color: '#6366f1', duration_minutes: dur, billable: true, rate: 100,
      } as any).select().single();
      
      if (!error && data) {
        const entry: TimeEntry = {
          id: data.id, task: timerTask, project: timerProject || 'Unassigned',
          projectColor: '#6366f1', tags: [], startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: dur, billable: true, rate: 100,
        };
        setEntries(prev => [entry, ...prev]);
        toast.success('Time entry saved');
      }
    }
    setIsRunning(false);
    setElapsed(0);
    setTimerTask('');
    setTimerProject('');
  };

  const addManualEntry = async () => {
    if (!newEntry.task.trim() || !newEntry.duration || !user) return;
    const dur = parseInt(newEntry.duration) || 0;
    const rate = newEntry.billable ? (parseInt(newEntry.rate) || 100) : 0;
    
    const { data, error } = await supabase.from('time_entries').insert({
      user_id: user.id, task: newEntry.task, project: newEntry.project || 'Unassigned',
      project_color: '#10b981', duration_minutes: dur, billable: newEntry.billable, rate,
    } as any).select().single();

    if (!error && data) {
      const entry: TimeEntry = {
        id: data.id, task: newEntry.task, project: newEntry.project || 'Unassigned',
        projectColor: '#10b981', tags: [], startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: dur, billable: newEntry.billable, rate: newEntry.billable ? rate : undefined,
      };
      setEntries(prev => [entry, ...prev]);
      toast.success('Entry added');
    }
    setNewEntry({ task: '', project: '', duration: '', billable: true, rate: '' });
    setShowManual(false);
  };

  const deleteEntry = async (id: string) => {
    await supabase.from('time_entries').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const totalBillable = entries.filter(e => e.billable).reduce((s, e) => s + e.duration, 0);
  const totalNonBillable = entries.filter(e => !e.billable).reduce((s, e) => s + e.duration, 0);
  const totalRevenue = entries.filter(e => e.billable && e.rate).reduce((s, e) => s + (e.duration / 60) * (e.rate || 0), 0);
  const utilization = (totalBillable + totalNonBillable) > 0 ? Math.round((totalBillable / (totalBillable + totalNonBillable)) * 100) : 0;

  const WEEKLY_DATA = [{ day: 'Today', billable: totalBillable / 60, nonBillable: totalNonBillable / 60 }];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 h-[52px] border-b border-border/60 bg-card flex items-center px-5 gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-lg text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Office</span>
        </Button>
        <div className="h-4 w-px bg-border/60" />
        <div className="h-7 w-7 rounded-lg bg-foreground/[0.04] flex items-center justify-center">
          <Clock className="h-3.5 w-3.5 text-ink-2" strokeWidth={1.7} />
        </div>
        <span className="text-sm font-semibold tracking-tight">Time Tracker</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs"><BarChart3 className="h-3.5 w-3.5" /> Reports</Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
          {/* Live Timer */}
          <div
            className="rounded-[10px] border border-border/60 bg-card p-5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex gap-2 flex-1 min-w-0">
              <Input value={timerTask} onChange={e => setTimerTask(e.target.value)} placeholder="What are you working on?" className="flex-1 h-11 text-sm border-border/60 rounded-lg font-medium min-w-0" />
              <Input value={timerProject} onChange={e => setTimerProject(e.target.value)} placeholder="Project" className="w-28 sm:w-48 h-11 text-[12px] border-border/60 rounded-lg shrink-0" />
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className={cn("text-[28px] font-mono font-medium tabular-nums tracking-tight w-32 sm:w-36 text-center transition-colors duration-150", isRunning ? "text-foreground" : "text-muted-foreground/50")}>
                {formatTimer(elapsed)}
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="icon" aria-label={isRunning ? 'Pause timer' : 'Start timer'} className="h-11 w-11 rounded-[10px]" onClick={() => { if (isRunning) { stopTimer(); } else { setIsRunning(true); } }}>
                  {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                {elapsed > 0 && !isRunning && (
                  <Button variant="outline" size="icon" aria-label="Reset" className="h-11 w-11 rounded-[10px]" onClick={() => setElapsed(0)}>
                    <Square className="h-4 w-4" />
                  </Button>
                )}
              </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {[
              { label: 'Billable hours', value: `${Math.floor(totalBillable / 60)}h ${totalBillable % 60}m` },
              { label: 'Non-billable', value: `${Math.floor(totalNonBillable / 60)}h ${totalNonBillable % 60}m` },
              { label: 'Estimated revenue', value: `£${Math.round(totalRevenue).toLocaleString()}` },
              { label: 'Utilisation', value: `${utilization}%` },
            ].map((s) => (
              <div key={s.label}
                className="p-4 rounded-[10px] bg-card border border-border/60">
                <span className="block font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-1.5">{s.label}</span>
                <div className="font-mono text-[19px] font-medium tabular-nums text-foreground tracking-tight">{s.value}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div
              className="xl:col-span-2 rounded-[10px] bg-card border border-border/60 p-5">
              <h3 className="text-[13px] font-[550] text-foreground mb-1">Weekly hours</h3>
              <p className="text-[10.5px] text-muted-foreground mb-4">Billable vs non-billable breakdown</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={WEEKLY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}h`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '11px' }} />
                  <Bar dataKey="billable" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} name="Billable" />
                  <Bar dataKey="nonBillable" stackId="a" fill="hsl(var(--muted-foreground) / 0.35)" radius={[4, 4, 0, 0]} name="Non-billable" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div
              className="rounded-[10px] bg-card border border-border/60 p-5">
              <h3 className="text-[13px] font-[550] text-foreground mb-4">Project summary</h3>
              {entries.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-6">Track time to see the project breakdown</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(entries.reduce((acc, e) => { acc[e.project] = (acc[e.project] || 0) + e.duration; return acc; }, {} as Record<string, number>)).map(([name, mins]) => (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11.5px] font-medium text-foreground truncate max-w-[130px]">{name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">{Math.floor(mins / 60)}h {mins % 60}m</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Time Entries Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-[550] text-foreground">Time entries</h3>
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1.5 rounded-lg" onClick={() => setShowManual(true)}><Plus className="h-3 w-3" /> Manual entry</Button>
            </div>

            {showManual && (
              <div className="mb-4 p-4 rounded-[10px] bg-card border border-border/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Input value={newEntry.task} onChange={e => setNewEntry(p => ({ ...p, task: e.target.value }))} placeholder="Task description" className="h-9 rounded-lg border-border/60 text-sm" />
                  <Input value={newEntry.project} onChange={e => setNewEntry(p => ({ ...p, project: e.target.value }))} placeholder="Project" className="h-9 rounded-lg border-border/60 text-sm" />
                  <Input value={newEntry.duration} onChange={e => setNewEntry(p => ({ ...p, duration: e.target.value }))} placeholder="Duration (mins)" type="number" className="h-9 rounded-lg border-border/60 text-sm" />
                  <Input value={newEntry.rate} onChange={e => setNewEntry(p => ({ ...p, rate: e.target.value }))} placeholder="Rate £/hr" type="number" className="h-9 rounded-lg border-border/60 text-sm" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 rounded-lg text-xs" onClick={addManualEntry}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                  <Button variant="ghost" size="sm" className="h-7 rounded-lg text-xs" onClick={() => setShowManual(false)}>Cancel</Button>
                </div>
              </div>
            )}

            <div className="rounded-[10px] border border-border/60 bg-card overflow-hidden">
              {entries.length === 0 ? (
                <div className="py-14 text-center">
                  <span aria-hidden className="mx-auto mb-4 block h-px w-8 bg-primary" />
                  <p className="font-display text-[15px] font-semibold tracking-[-0.02em] text-foreground">No time entries yet</p>
                  <p className="text-xs text-muted-foreground mt-1.5">Start the timer or add a manual entry.</p>
                </div>
              ) : (
              <div className="divide-y divide-border/60">
              {entries.map((entry) => (
                <div key={entry.id}
                  className="flex h-11 items-center gap-4 px-4 hover:bg-foreground/[0.025] transition-colors duration-150 group">
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 bg-foreground/[0.04]">
                    <Briefcase className="h-3.5 w-3.5 text-ink-2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-[450] text-foreground truncate">{entry.task}</div>
                    <span className="text-[10px] text-muted-foreground">{entry.project}</span>
                  </div>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground shrink-0">{entry.startTime}</span>
                  <span className="font-mono text-[12px] font-medium text-foreground tabular-nums shrink-0 w-16 text-right">{Math.floor(entry.duration / 60)}h {entry.duration % 60}m</span>
                  <div className={cn("font-mono text-[10px] font-medium tabular-nums shrink-0 w-20 text-right",
                    entry.billable ? "text-ok" : "text-muted-foreground"
                  )}>
                    {entry.billable ? `£${Math.round((entry.duration / 60) * (entry.rate || 0))}` : 'Non-billable'}
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <Button variant="ghost" size="icon" aria-label="Delete entry" className="h-6 w-6 rounded-md" onClick={() => deleteEntry(entry.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
