import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Briefcase, Plus, Trash2, Clock, DollarSign, CheckCircle2,
  AlertCircle, Search, Users, Calendar, Play, Pause, Check, X,
  MapPin, Bell, Video, Phone, Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { StatusBadge, type Tone } from '@/components/platform';
import { useReminders } from '@/hooks/useReminders';

type JobStatus = 'pending' | 'in_progress' | 'completed' | 'invoiced' | 'cancelled';
type ViewTab = 'jobs' | 'meetings' | 'overview';

interface Job {
  id: string; title: string; client: string; status: JobStatus; priority: 'low' | 'medium' | 'high' | 'urgent';
  price: number; paid: number; assignee: string; dueDate: string; description: string; createdAt: Date;
}

interface Meeting {
  id: string; title: string; attendees: string[]; date: string; time: string; duration: string;
  location: string; type: 'in_person' | 'video' | 'phone'; status: 'upcoming' | 'completed' | 'cancelled';
  agenda: string; reminder: boolean; reminderMinutes: number;
}

const STATUS_CONFIG: Record<JobStatus, { label: string; tone: Tone; icon: any }> = {
  pending: { label: 'Pending', tone: 'attend', icon: Clock },
  in_progress: { label: 'In progress', tone: 'accent', icon: Play },
  completed: { label: 'Completed', tone: 'ok', icon: CheckCircle2 },
  invoiced: { label: 'Invoiced', tone: 'ok', icon: DollarSign },
  cancelled: { label: 'Cancelled', tone: 'risk', icon: AlertCircle },
};

const PRIORITY_TONES: Record<'low' | 'medium' | 'high' | 'urgent', Tone> = { low: 'neutral', medium: 'attend', high: 'attend', urgent: 'risk' };
const MEETING_TYPE_ICONS = { in_person: MapPin, video: Video, phone: Phone };

export default function OfficeOperations() {
  const navigate = useNavigate();
  const { addReminder } = useReminders();
  const [tab, setTab] = useState<ViewTab>('jobs');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'all'>('all');

  const [jobs, setJobs] = useState<Job[]>([]);

  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [showAddJob, setShowAddJob] = useState(false);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', client: '', price: '', assignee: '', dueDate: '', description: '' });
  const [newMeeting, setNewMeeting] = useState({ title: '', attendees: '', date: '', time: '', duration: '30min', location: '', type: 'video' as Meeting['type'], agenda: '', reminder: true, reminderMinutes: '15' });

  const addJob = () => {
    if (!newJob.title.trim() || !newJob.client.trim()) { toast.error('Fill in title and client'); return; }
    const job: Job = {
      id: Date.now().toString(), title: newJob.title, client: newJob.client,
      status: 'pending', priority: 'medium', price: parseFloat(newJob.price) || 0,
      paid: 0, assignee: newJob.assignee || 'Unassigned', dueDate: newJob.dueDate || '',
      description: newJob.description, createdAt: new Date(),
    };
    setJobs(prev => [job, ...prev]);
    setNewJob({ title: '', client: '', price: '', assignee: '', dueDate: '', description: '' });
    setShowAddJob(false);
    toast.success('Job created');
  };

  const addMeeting = () => {
    if (!newMeeting.title.trim() || !newMeeting.date || !newMeeting.time) { toast.error('Fill in title, date and time'); return; }
    const meeting: Meeting = {
      id: Date.now().toString(),
      title: newMeeting.title,
      attendees: newMeeting.attendees.split(',').map(a => a.trim()).filter(Boolean),
      date: newMeeting.date,
      time: newMeeting.time,
      duration: newMeeting.duration,
      location: newMeeting.location || (newMeeting.type === 'video' ? 'Video Call' : 'TBD'),
      type: newMeeting.type,
      status: 'upcoming',
      agenda: newMeeting.agenda,
      reminder: newMeeting.reminder,
      reminderMinutes: parseInt(newMeeting.reminderMinutes) || 15,
    };
    setMeetings(prev => [meeting, ...prev]);

    // Schedule reminder
    if (newMeeting.reminder) {
      const meetingTime = new Date(`${newMeeting.date}T${newMeeting.time}`);
      const reminderTime = new Date(meetingTime.getTime() - (parseInt(newMeeting.reminderMinutes) || 15) * 60000);
      addReminder({
        id: meeting.id,
        title: `Meeting: ${newMeeting.title}`,
        message: `Starting ${newMeeting.duration === '15min' ? 'in 15 minutes' : `in ${parseInt(newMeeting.reminderMinutes)} minutes`} · ${meeting.location}`,
        triggerAt: reminderTime,
        type: 'meeting',
        route: '/lounge/office/operations',
      });
    }

    setNewMeeting({ title: '', attendees: '', date: '', time: '', duration: '30min', location: '', type: 'video', agenda: '', reminder: true, reminderMinutes: '15' });
    setShowAddMeeting(false);
    toast.success('Meeting scheduled' + (newMeeting.reminder ? ' with reminder' : ''));
  };

  const cancelMeeting = (id: string) => {
    setMeetings(prev => prev.map(m => m.id === id ? { ...m, status: 'cancelled' as const } : m));
    toast.success('Meeting cancelled');
  };

  const updateStatus = (id: string, status: JobStatus) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
    toast.success(`Status updated to ${STATUS_CONFIG[status].label}`);
  };

  const deleteJob = (id: string) => { setJobs(prev => prev.filter(j => j.id !== id)); toast.success('Job deleted'); };

  const filteredJobs = jobs
    .filter(j => filterStatus === 'all' || j.status === filterStatus)
    .filter(j => j.title.toLowerCase().includes(search.toLowerCase()) || j.client.toLowerCase().includes(search.toLowerCase()));

  const totalRevenue = jobs.filter(j => j.status === 'completed' || j.status === 'invoiced').reduce((s, j) => s + j.price, 0);
  const totalPaid = jobs.reduce((s, j) => s + j.paid, 0);
  const activeJobs = jobs.filter(j => j.status === 'in_progress').length;
  const pendingJobs = jobs.filter(j => j.status === 'pending').length;
  const upcomingMeetings = meetings.filter(m => m.status === 'upcoming').length;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 h-[52px] border-b border-border/60 bg-background flex items-center px-3 sm:px-5 gap-2 sm:gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-lg text-xs shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Office</span>
        </Button>
        <div className="h-4 w-px bg-border/60" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Operations</span>
        <div className="flex-1" />
        {tab === 'meetings' ? (
          <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={() => setShowAddMeeting(true)}>
            <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline"> New meeting</span>
          </Button>
        ) : (
          <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={() => setShowAddJob(true)}>
            <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline"> New job</span>
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <div className="pb-3 pt-5">
            <h1 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">Operations</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Track jobs, meetings, revenue and team workload.</p>
          </div>

          {/* Position ledger */}
          <div className="mb-4 overflow-hidden rounded-[10px] border border-border/60 bg-card">
            <div className="grid grid-cols-1 gap-px bg-border/60 sm:grid-cols-2 md:grid-cols-5">
              {[
                { label: 'Active jobs', value: String(activeJobs) },
                { label: 'Pending', value: String(pendingJobs) },
                { label: 'Meetings', value: String(upcomingMeetings) },
                { label: 'Revenue', value: `£${totalRevenue.toLocaleString()}` },
                { label: 'Collected', value: `£${totalPaid.toLocaleString()}` },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between gap-3 bg-card px-4 py-3">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{s.label}</span>
                  <span className="font-mono text-[15px] font-medium tabular-nums text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex w-fit items-center gap-0.5 rounded-lg border border-border/60 bg-sunken p-0.5">
            {(['jobs', 'meetings', 'overview'] as ViewTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-1.5 rounded-md text-[11px] font-medium capitalize transition-colors duration-150", tab === t ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {t === 'meetings' ? `Meetings (${upcomingMeetings})` : t}
              </button>
            ))}
          </div>

          {/* ─── Jobs Tab ─── */}
          {tab === 'jobs' && (
            <div className="pb-10">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…" className="w-full sm:max-w-xs h-9 rounded-lg bg-card border-border/60 text-sm" />
                <div className="flex gap-1 overflow-x-auto scrollbar-none">
                  {(['all', 'pending', 'in_progress', 'completed', 'invoiced', 'cancelled'] as (JobStatus | 'all')[]).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} className={cn("whitespace-nowrap rounded-md border px-3 py-1.5 text-[10.5px] font-medium transition-colors duration-150", filterStatus === s ? "border-primary bg-primary text-primary-foreground" : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground")}>
                      {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {showAddJob && (
                  <div className="mb-4 space-y-3 rounded-[10px] border border-border/60 bg-card p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input value={newJob.title} onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))} placeholder="Job title" className="h-10 rounded-lg text-sm" />
                      <Input value={newJob.client} onChange={e => setNewJob(p => ({ ...p, client: e.target.value }))} placeholder="Client name" className="h-10 rounded-lg text-sm" />
                      <Input value={newJob.price} onChange={e => setNewJob(p => ({ ...p, price: e.target.value }))} placeholder="Price (£)" type="number" className="h-10 rounded-lg text-sm" />
                      <Input value={newJob.assignee} onChange={e => setNewJob(p => ({ ...p, assignee: e.target.value }))} placeholder="Assignee" className="h-10 rounded-lg text-sm" />
                      <Input value={newJob.dueDate} onChange={e => setNewJob(p => ({ ...p, dueDate: e.target.value }))} type="date" className="h-10 rounded-lg text-sm" />
                      <Input value={newJob.description} onChange={e => setNewJob(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="h-10 rounded-lg text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 rounded-lg text-xs" onClick={addJob}><Check className="h-3 w-3 mr-1" /> Create</Button>
                      <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setShowAddJob(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

              <div className="space-y-2">
                {filteredJobs.map(job => {
                  const sc = STATUS_CONFIG[job.status];
                  const progress = job.price > 0 ? (job.paid / job.price) * 100 : 0;
                  return (
                    <div key={job.id}
                      className="group rounded-[10px] border border-border/60 bg-card p-4 transition-colors duration-150 hover:border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-semibold text-foreground truncate">{job.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground">{job.client}</span>
                            <StatusBadge tone={sc.tone} label={sc.label} className="text-[10px]" />
                            <StatusBadge tone={PRIORITY_TONES[job.priority]} label={job.priority} className="text-[10px] capitalize" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[12px] font-medium tabular-nums text-foreground">£{job.price.toLocaleString()}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {job.status === 'pending' && <button onClick={() => updateStatus(job.id, 'in_progress')} className="h-7 rounded-md px-2 text-[10.5px] text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground">Start</button>}
                            {job.status === 'in_progress' && <button onClick={() => updateStatus(job.id, 'completed')} className="h-7 rounded-md px-2 text-[10.5px] text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground">Complete</button>}
                            {job.status === 'completed' && <button onClick={() => updateStatus(job.id, 'invoiced')} className="h-7 rounded-md px-2 text-[10.5px] text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground">Invoice</button>}
                            <button onClick={() => deleteJob(job.id)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-risk/10">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.assignee}</span>
                        {job.dueDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {job.dueDate}</span>}
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                          <span className="font-mono tabular-nums">£{job.paid.toLocaleString()} / £{job.price.toLocaleString()}</span>
                          <div className="h-1 w-20 overflow-hidden rounded-full bg-sunken">
                            <div className="h-full rounded-full bg-primary/70" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Meetings Tab ─── */}
          {tab === 'meetings' && (
            <div className="pb-10">
              {/* Add meeting form */}
              {showAddMeeting && (
                  <div
                    className="mb-4 space-y-4 rounded-[10px] border border-border/60 bg-card p-4">
                    <h3 className="flex items-center gap-2 text-[13px] font-[550] tracking-[-0.01em] text-foreground">
                      <Calendar className="h-4 w-4 text-muted-foreground" /> Schedule meeting
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input value={newMeeting.title} onChange={e => setNewMeeting(p => ({ ...p, title: e.target.value }))} placeholder="Meeting title" className="h-10 rounded-lg text-sm" />
                      <Input value={newMeeting.attendees} onChange={e => setNewMeeting(p => ({ ...p, attendees: e.target.value }))} placeholder="Attendees (comma separated)" className="h-10 rounded-lg text-sm" />
                      <Input value={newMeeting.date} onChange={e => setNewMeeting(p => ({ ...p, date: e.target.value }))} type="date" className="h-10 rounded-lg text-sm" />
                      <Input value={newMeeting.time} onChange={e => setNewMeeting(p => ({ ...p, time: e.target.value }))} type="time" className="h-10 rounded-lg text-sm" />
                      <Select value={newMeeting.duration} onValueChange={v => setNewMeeting(p => ({ ...p, duration: v }))}>
                        <SelectTrigger className="h-10 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15min">15 minutes</SelectItem>
                          <SelectItem value="30min">30 minutes</SelectItem>
                          <SelectItem value="45min">45 minutes</SelectItem>
                          <SelectItem value="1h">1 hour</SelectItem>
                          <SelectItem value="1.5h">1.5 hours</SelectItem>
                          <SelectItem value="2h">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={newMeeting.type} onValueChange={v => setNewMeeting(p => ({ ...p, type: v as Meeting['type'] }))}>
                        <SelectTrigger className="h-10 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video call</SelectItem>
                          <SelectItem value="phone">Phone call</SelectItem>
                          <SelectItem value="in_person">In person</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input value={newMeeting.location} onChange={e => setNewMeeting(p => ({ ...p, location: e.target.value }))} placeholder="Location or link" className="h-10 rounded-lg text-sm" />
                    </div>
                    <Textarea value={newMeeting.agenda} onChange={e => setNewMeeting(p => ({ ...p, agenda: e.target.value }))} placeholder="Agenda (optional)" className="rounded-lg text-sm min-h-[60px]" />

                    {/* Reminder settings */}
                    <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-sunken p-3">
                      <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="flex items-center gap-2 flex-1">
                        <Switch checked={newMeeting.reminder} onCheckedChange={v => setNewMeeting(p => ({ ...p, reminder: v }))} />
                        <Label className="text-[11px] font-medium text-muted-foreground">Set reminder</Label>
                      </div>
                      {newMeeting.reminder && (
                        <Select value={newMeeting.reminderMinutes} onValueChange={v => setNewMeeting(p => ({ ...p, reminderMinutes: v }))}>
                          <SelectTrigger className="h-8 w-32 rounded-lg text-[11px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 min before</SelectItem>
                            <SelectItem value="10">10 min before</SelectItem>
                            <SelectItem value="15">15 min before</SelectItem>
                            <SelectItem value="30">30 min before</SelectItem>
                            <SelectItem value="60">1 hour before</SelectItem>
                            <SelectItem value="1440">1 day before</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 rounded-lg text-xs" onClick={addMeeting}><Check className="h-3 w-3 mr-1" /> Schedule</Button>
                      <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setShowAddMeeting(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

              <div className="space-y-3">
                {meetings.sort((a, b) => a.date.localeCompare(b.date)).map((m, i) => {
                  const TypeIcon = MEETING_TYPE_ICONS[m.type];
                  return (
                    <div key={m.id}
                      className="group rounded-[10px] border border-border/60 bg-card p-4 transition-colors duration-150 hover:border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-sunken">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="text-[13px] font-semibold text-foreground">{m.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{m.type === 'video' ? 'Video' : m.type === 'phone' ? 'Phone' : 'In person'}</span>
                              {m.reminder && <span className="flex items-center gap-0.5 font-mono text-[10px] tabular-nums text-muted-foreground"><Bell className="h-2.5 w-2.5" /> {m.reminderMinutes}min</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusBadge
                            tone={m.status === 'upcoming' ? 'accent' : m.status === 'completed' ? 'ok' : 'risk'}
                            label={m.status}
                            className="text-[10.5px] capitalize"
                          />
                          {m.status === 'upcoming' && (
                            <button onClick={() => cancelMeeting(m.id)} className="flex h-7 w-7 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-risk/10 group-hover:opacity-100">
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{m.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.time} ({m.duration})</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{m.attendees.length} attendees</span>
                      </div>
                      {m.agenda && <p className="mt-2 text-[11px] text-muted-foreground">{m.agenda}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Overview Tab ─── */}
          {tab === 'overview' && (
            <div className="pb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-[10px] border border-border/60 bg-card p-4">
                <h3 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Pipeline summary</h3>
                <div className="space-y-3">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const count = jobs.filter(j => j.status === key).length;
                    const pct = jobs.length > 0 ? (count / jobs.length) * 100 : 0;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="w-24 text-[11px] font-medium text-foreground">{cfg.label}</span>
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
                          <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-6 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-[10px] border border-border/60 bg-card p-4">
                <h3 className="mb-4 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Revenue breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">Total pipeline value</span>
                    <p className="font-mono text-xl font-medium tabular-nums text-foreground">£{jobs.reduce((s, j) => s + j.price, 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">Completed revenue</span>
                    <p className="font-mono text-lg font-medium tabular-nums text-foreground">£{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">Outstanding</span>
                    <p className="font-mono text-lg font-medium tabular-nums text-foreground">£{(jobs.reduce((s, j) => s + j.price, 0) - totalPaid).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
