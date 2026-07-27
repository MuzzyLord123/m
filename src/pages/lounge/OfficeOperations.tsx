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
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
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

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: '#f59e0b', icon: Clock },
  in_progress: { label: 'In Progress', color: '#3b82f6', icon: Play },
  completed: { label: 'Completed', color: '#10b981', icon: CheckCircle2 },
  invoiced: { label: 'Invoiced', color: '#8b5cf6', icon: DollarSign },
  cancelled: { label: 'Cancelled', color: '#ef4444', icon: AlertCircle },
};

const PRIORITY_COLORS = { low: '#94a3b8', medium: '#f59e0b', high: '#f97316', urgent: '#ef4444' };
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
        message: `Starting ${newMeeting.duration === '15min' ? 'in 15 minutes' : `in ${parseInt(newMeeting.reminderMinutes)} minutes`} — ${meeting.location}`,
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
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <Briefcase className="h-4 w-4 text-orange-500" />
        <span className="text-sm font-semibold tracking-tight">Operations</span>
        <div className="flex-1" />
        {tab === 'meetings' ? (
          <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => setShowAddMeeting(true)}>
            <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline"> New Meeting</span>
          </Button>
        ) : (
          <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => setShowAddJob(true)}>
            <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline"> New Job</span>
          </Button>
        )}
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-4">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Operations Manager</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Track jobs, meetings, revenue, and team workload.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'Active Jobs', value: activeJobs, icon: Play, color: '#3b82f6' },
              { label: 'Pending', value: pendingJobs, icon: Clock, color: '#f59e0b' },
              { label: 'Meetings', value: upcomingMeetings, icon: Calendar, color: '#06b6d4' },
              { label: 'Revenue', value: `£${totalRevenue.toLocaleString()}`, icon: DollarSign, color: '#10b981' },
              { label: 'Collected', value: `£${totalPaid.toLocaleString()}`, icon: CheckCircle2, color: '#8b5cf6' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl bg-card/50 border border-border/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">{s.label}</span>
                </div>
                <span className="text-xl font-bold text-foreground">{s.value}</span>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-6 bg-muted/30 p-0.5 rounded-xl w-fit">
            {(['jobs', 'meetings', 'overview'] as ViewTab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-lg text-[11px] font-semibold capitalize transition-all", tab === t ? "bg-background shadow-sm text-foreground" : "text-muted-foreground/60 hover:text-foreground")}>
                {t === 'meetings' ? `Meetings (${upcomingMeetings})` : t}
              </button>
            ))}
          </div>

          {/* ─── Jobs Tab ─── */}
          {tab === 'jobs' && (
            <div className="pb-10">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search jobs…" className="w-full sm:max-w-xs h-9 rounded-xl bg-card/50 border-border/30 text-sm" />
                <div className="flex gap-1 overflow-x-auto scrollbar-none">
                  {(['all', 'pending', 'in_progress', 'completed', 'invoiced', 'cancelled'] as (JobStatus | 'all')[]).map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all", filterStatus === s ? "bg-primary text-primary-foreground" : "bg-muted/40 text-muted-foreground/60 hover:text-foreground")}>
                      {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {showAddJob && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 p-5 rounded-2xl bg-card/50 border border-border/20 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input value={newJob.title} onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))} placeholder="Job title" className="h-10 rounded-xl text-sm" />
                      <Input value={newJob.client} onChange={e => setNewJob(p => ({ ...p, client: e.target.value }))} placeholder="Client name" className="h-10 rounded-xl text-sm" />
                      <Input value={newJob.price} onChange={e => setNewJob(p => ({ ...p, price: e.target.value }))} placeholder="Price (£)" type="number" className="h-10 rounded-xl text-sm" />
                      <Input value={newJob.assignee} onChange={e => setNewJob(p => ({ ...p, assignee: e.target.value }))} placeholder="Assignee" className="h-10 rounded-xl text-sm" />
                      <Input value={newJob.dueDate} onChange={e => setNewJob(p => ({ ...p, dueDate: e.target.value }))} type="date" className="h-10 rounded-xl text-sm" />
                      <Input value={newJob.description} onChange={e => setNewJob(p => ({ ...p, description: e.target.value }))} placeholder="Description" className="h-10 rounded-xl text-sm" />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="h-8 rounded-xl text-xs" onClick={addJob}><Check className="h-3 w-3 mr-1" /> Create</Button>
                      <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs" onClick={() => setShowAddJob(false)}>Cancel</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                {filteredJobs.map(job => {
                  const sc = STATUS_CONFIG[job.status];
                  const progress = job.price > 0 ? (job.paid / job.price) * 100 : 0;
                  return (
                    <motion.div key={job.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="group p-5 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[13px] font-semibold text-foreground truncate">{job.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-muted-foreground/50">{job.client}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${sc.color}15`, color: sc.color }}>{sc.label}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${PRIORITY_COLORS[job.priority]}15`, color: PRIORITY_COLORS[job.priority] }}>{job.priority}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-bold text-foreground">£{job.price.toLocaleString()}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {job.status === 'pending' && <button onClick={() => updateStatus(job.id, 'in_progress')} className="h-7 px-2 rounded-lg hover:bg-accent text-[10px] text-muted-foreground">Start</button>}
                            {job.status === 'in_progress' && <button onClick={() => updateStatus(job.id, 'completed')} className="h-7 px-2 rounded-lg hover:bg-accent text-[10px] text-muted-foreground">Complete</button>}
                            {job.status === 'completed' && <button onClick={() => updateStatus(job.id, 'invoiced')} className="h-7 px-2 rounded-lg hover:bg-accent text-[10px] text-muted-foreground">Invoice</button>}
                            <button onClick={() => deleteJob(job.id)} className="h-7 w-7 rounded-lg hover:bg-destructive/20 flex items-center justify-center">
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-[10px] text-muted-foreground/40">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.assignee}</span>
                        {job.dueDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Due {job.dueDate}</span>}
                        <div className="flex-1" />
                        <div className="flex items-center gap-2">
                          <span>£{job.paid.toLocaleString()} / £{job.price.toLocaleString()}</span>
                          <div className="w-20 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                            <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${progress}%` }} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Meetings Tab ─── */}
          {tab === 'meetings' && (
            <div className="pb-10">
              {/* Add meeting form */}
              <AnimatePresence>
                {showAddMeeting && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                    className="mb-6 p-5 rounded-2xl bg-card/50 border border-border/20 space-y-4">
                    <h3 className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" /> Schedule Meeting
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input value={newMeeting.title} onChange={e => setNewMeeting(p => ({ ...p, title: e.target.value }))} placeholder="Meeting title" className="h-10 rounded-xl text-sm" />
                      <Input value={newMeeting.attendees} onChange={e => setNewMeeting(p => ({ ...p, attendees: e.target.value }))} placeholder="Attendees (comma separated)" className="h-10 rounded-xl text-sm" />
                      <Input value={newMeeting.date} onChange={e => setNewMeeting(p => ({ ...p, date: e.target.value }))} type="date" className="h-10 rounded-xl text-sm" />
                      <Input value={newMeeting.time} onChange={e => setNewMeeting(p => ({ ...p, time: e.target.value }))} type="time" className="h-10 rounded-xl text-sm" />
                      <Select value={newMeeting.duration} onValueChange={v => setNewMeeting(p => ({ ...p, duration: v }))}>
                        <SelectTrigger className="h-10 rounded-xl text-sm"><SelectValue /></SelectTrigger>
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
                        <SelectTrigger className="h-10 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video Call</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                          <SelectItem value="in_person">In Person</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input value={newMeeting.location} onChange={e => setNewMeeting(p => ({ ...p, location: e.target.value }))} placeholder="Location / Link" className="h-10 rounded-xl text-sm" />
                    </div>
                    <Textarea value={newMeeting.agenda} onChange={e => setNewMeeting(p => ({ ...p, agenda: e.target.value }))} placeholder="Agenda (optional)" className="rounded-xl text-sm min-h-[60px]" />

                    {/* Reminder settings */}
                    <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30 border border-border/15">
                      <Bell className="h-4 w-4 text-primary/70 shrink-0" />
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
                      <Button size="sm" className="h-8 rounded-xl text-xs" onClick={addMeeting}><Check className="h-3 w-3 mr-1" /> Schedule</Button>
                      <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs" onClick={() => setShowAddMeeting(false)}>Cancel</Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-3">
                {meetings.sort((a, b) => a.date.localeCompare(b.date)).map((m, i) => {
                  const TypeIcon = MEETING_TYPE_ICONS[m.type];
                  return (
                    <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                      className="group p-5 rounded-2xl bg-card/50 border border-border/20 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl flex items-center justify-center bg-primary/10">
                            <TypeIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-[13px] font-semibold text-foreground">{m.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground/50">{m.type === 'video' ? '📹 Video' : m.type === 'phone' ? '📞 Phone' : '📍 In Person'}</span>
                              {m.reminder && <span className="text-[10px] text-primary/60 flex items-center gap-0.5"><Bell className="h-2.5 w-2.5" /> {m.reminderMinutes}min</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium",
                            m.status === 'upcoming' ? "bg-primary/10 text-primary" : m.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-destructive/10 text-destructive")}>
                            {m.status}
                          </span>
                          {m.status === 'upcoming' && (
                            <button onClick={() => cancelMeeting(m.id)} className="h-7 w-7 rounded-lg hover:bg-destructive/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground/50">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{m.date}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{m.time} ({m.duration})</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{m.attendees.length} attendees</span>
                      </div>
                      {m.agenda && <p className="text-[11px] text-muted-foreground/40 mt-2 italic">{m.agenda}</p>}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── Overview Tab ─── */}
          {tab === 'overview' && (
            <div className="pb-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-card/50 border border-border/20">
                <h3 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-4">Pipeline Summary</h3>
                <div className="space-y-3">
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
                    const count = jobs.filter(j => j.status === key).length;
                    const pct = jobs.length > 0 ? (count / jobs.length) * 100 : 0;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-[11px] font-medium w-24" style={{ color: cfg.color }}>{cfg.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground/50 w-6 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="p-6 rounded-2xl bg-card/50 border border-border/20">
                <h3 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-4">Revenue Breakdown</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-muted-foreground/50">Total Pipeline Value</span>
                    <p className="text-2xl font-bold text-foreground">£{jobs.reduce((s, j) => s + j.price, 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground/50">Completed Revenue</span>
                    <p className="text-lg font-semibold text-foreground">£{totalRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground/50">Outstanding</span>
                    <p className="text-lg font-semibold text-foreground">£{(jobs.reduce((s, j) => s + j.price, 0) - totalPaid).toLocaleString()}</p>
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
