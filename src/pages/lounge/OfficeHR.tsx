import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Trash2, Mail, Phone, MapPin, Calendar, Search, Building, UserCheck, Briefcase, Shield, TrendingUp, X, ChevronRight, Star, DollarSign, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OfficeModuleBand } from '@/pages/lounge/office/ModuleShell';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Panel, PanelHeader, StatusBadge, AvatarID, SkeletonLedger, EmptyState,
  type Tone,
} from '@/components/platform';

type Department = 'engineering' | 'design' | 'marketing' | 'sales' | 'operations' | 'hr' | 'finance' | 'legal';
type EmployeeStatus = 'active' | 'on_leave' | 'probation' | 'offboarded';
type Tab = 'directory' | 'time_off' | 'org' | 'performance' | 'payroll' | 'recruitment';

interface Employee {
  id: string; name: string; role: string; department: Department; email: string; phone: string;
  location: string; startDate: string; status: EmployeeStatus; avatar: string;
  salary: number; manager: string; skills: string[]; performance: number;
  leaveBalance: { vacation: number; sick: number; personal: number };
  emergencyContact: string; employeeId: string;
}

interface TimeOffRequest {
  id: string; employeeId: string; employee: string; type: 'vacation' | 'sick' | 'personal' | 'parental' | 'bereavement';
  startDate: string; endDate: string; status: 'pending' | 'approved' | 'denied'; days: number; reason: string;
}

interface PerformanceReview {
  id: string; employeeId: string; employee: string; period: string; rating: number;
  goals: { title: string; status: 'on_track' | 'at_risk' | 'completed' }[];
  feedback: string; reviewer: string; date: string;
}

interface Candidate {
  id: string; name: string; role: string; department: Department; stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  appliedDate: string; email: string; rating: number; notes: string;
}

const DEPARTMENTS: Department[] = ['engineering', 'design', 'marketing', 'sales', 'operations', 'hr', 'finance', 'legal'];

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; tone: Tone }> = {
  active: { label: 'Active', tone: 'ok' },
  on_leave: { label: 'On leave', tone: 'attend' },
  probation: { label: 'Probation', tone: 'neutral' },
  offboarded: { label: 'Offboarded', tone: 'risk' },
};

/** Performance figure tone: quiet thresholds, no bars of many colours. */
const perfTone = (p: number) => (p >= 90 ? 'text-ok' : p >= 75 ? 'text-attend' : 'text-risk');

export default function OfficeHR() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('directory');
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterDept, setFilterDept] = useState<Department | 'all'>('all');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timeOff, setTimeOff] = useState<TimeOffRequest[]>([]);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);

  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', department: 'engineering' as Department, email: '', phone: '', location: '', salary: '' });

  // ── Load data from DB ──
  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [empRes, toRes, revRes, candRes] = await Promise.all([
        supabase.from('hr_employees').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('hr_time_off_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('hr_performance_reviews').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('hr_candidates').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);

      if (empRes.data) {
        setEmployees(empRes.data.map((e: any) => ({
          id: e.id, name: e.name, role: e.role, department: e.department as Department,
          email: e.email, phone: e.phone || '', location: e.location || '',
          startDate: e.start_date, status: e.status as EmployeeStatus,
          avatar: e.avatar || e.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
          salary: Number(e.salary) || 0, manager: e.manager || 'TBD',
          skills: e.skills || [], performance: Number(e.performance) || 0,
          leaveBalance: { vacation: e.leave_vacation || 25, sick: e.leave_sick || 10, personal: e.leave_personal || 3 },
          emergencyContact: e.emergency_contact || 'Not set', employeeId: e.employee_id,
        })));
      }

      if (toRes.data) {
        setTimeOff(toRes.data.map((r: any) => ({
          id: r.id, employeeId: r.employee_id || '', employee: r.employee_name,
          type: r.type, startDate: r.start_date, endDate: r.end_date,
          status: r.status, days: r.days, reason: r.reason || '',
        })));
      }

      if (revRes.data) {
        setReviews(revRes.data.map((r: any) => ({
          id: r.id, employeeId: r.employee_id || '', employee: r.employee_name,
          period: r.period, rating: Number(r.rating), goals: r.goals || [],
          feedback: r.feedback || '', reviewer: r.reviewer, date: r.review_date,
        })));
      }

      if (candRes.data) {
        setCandidates(candRes.data.map((c: any) => ({
          id: c.id, name: c.name, role: c.role, department: c.department as Department,
          stage: c.stage as Candidate['stage'], appliedDate: c.applied_date,
          email: c.email || '', rating: Number(c.rating), notes: c.notes || '',
        })));
      }
    } catch (err) {
      console.error('HR fetch error:', err);
      toast.error('Failed to load HR data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── CRUD ──
  const approveRequest = async (id: string) => {
    const { error } = await supabase.from('hr_time_off_requests').update({ status: 'approved' } as any).eq('id', id);
    if (error) { toast.error('Failed'); return; }
    setTimeOff(p => p.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    toast.success('Leave approved');
  };

  const denyRequest = async (id: string) => {
    const { error } = await supabase.from('hr_time_off_requests').update({ status: 'denied' } as any).eq('id', id);
    if (error) { toast.error('Failed'); return; }
    setTimeOff(p => p.map(r => r.id === id ? { ...r, status: 'denied' } : r));
    toast.success('Leave denied');
  };

  const addEmployee = async () => {
    if (!user || !newEmployee.name || !newEmployee.role || !newEmployee.email) { toast.error('Fill required fields'); return; }
    const employeeId = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
    const avatar = newEmployee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const { data, error } = await supabase.from('hr_employees').insert({
      user_id: user.id, employee_id: employeeId, name: newEmployee.name, role: newEmployee.role,
      department: newEmployee.department, email: newEmployee.email, phone: newEmployee.phone,
      location: newEmployee.location, salary: parseInt(newEmployee.salary) || 0, avatar, status: 'probation',
    } as any).select().single();

    if (error) { toast.error('Failed to add employee'); return; }

    const emp: Employee = {
      id: data.id, employeeId, name: newEmployee.name, role: newEmployee.role,
      department: newEmployee.department, email: newEmployee.email, phone: newEmployee.phone,
      location: newEmployee.location, startDate: new Date().toISOString().split('T')[0],
      status: 'probation', avatar, salary: parseInt(newEmployee.salary) || 0,
      manager: 'TBD', skills: [], performance: 0,
      leaveBalance: { vacation: 25, sick: 10, personal: 3 }, emergencyContact: 'Not set',
    };
    setEmployees(p => [emp, ...p]);
    setNewEmployee({ name: '', role: '', department: 'engineering', email: '', phone: '', location: '', salary: '' });
    setShowAddEmployee(false);
    toast.success('Employee added');
  };

  const deleteEmployee = async (id: string) => {
    const { error } = await supabase.from('hr_employees').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setEmployees(p => p.filter(e => e.id !== id));
    toast.success('Employee removed');
  };

  const advanceCandidate = async (id: string, nextStage: Candidate['stage']) => {
    const { error } = await supabase.from('hr_candidates').update({ stage: nextStage } as any).eq('id', id);
    if (error) { toast.error('Failed'); return; }
    setCandidates(p => p.map(x => x.id === id ? { ...x, stage: nextStage } : x));
    toast.success(`Moved to ${nextStage}`);
  };

  const filtered = employees.filter(e => {
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase()) || e.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'all' || e.department === filterDept;
    return matchSearch && matchDept;
  });

  const deptGroups = DEPARTMENTS.map(dept => ({ dept, members: filtered.filter(e => e.department === dept) })).filter(g => g.members.length > 0);

  const totalSalary = employees.reduce((s, e) => s + e.salary, 0);
  const avgPerformance = employees.filter(e => e.performance > 0).length > 0 ? Math.round(employees.filter(e => e.performance > 0).reduce((s, e) => s + e.performance, 0) / employees.filter(e => e.performance > 0).length) : 0;
  const pendingLeave = timeOff.filter(r => r.status === 'pending').length;
  const openPositions = candidates.filter(c => c.stage !== 'hired' && c.stage !== 'rejected').length;

  const STAGE_TONES: Record<string, Tone> = { applied: 'neutral', screening: 'attend', interview: 'accent', offer: 'attend', hired: 'ok', rejected: 'risk' };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <OfficeModuleBand appId="hr" icon={Users} title="HR">
        <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs shrink-0" onClick={() => setShowAddEmployee(true)}>
          <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline"> Add employee</span>
        </Button>
      </OfficeModuleBand>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-10">
          {/* People ledger */}
          <Panel className="mb-4 mt-4 overflow-hidden sm:mt-5">
            <div className="grid grid-cols-1 gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {[
                { label: 'Headcount', value: String(employees.length), sub: `${employees.filter(e => e.status === 'active').length} active` },
                { label: 'On leave', value: String(employees.filter(e => e.status === 'on_leave').length), sub: `${pendingLeave} pending` },
                { label: 'Avg rating', value: `${avgPerformance}%`, sub: 'Performance' },
                { label: 'Open roles', value: String(openPositions), sub: 'Recruiting' },
                { label: 'Departments', value: String(DEPARTMENTS.length), sub: 'Teams' },
                { label: 'Monthly payroll', value: `£${Math.round(totalSalary / 12).toLocaleString()}`, sub: `£${totalSalary.toLocaleString()}/yr` },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between gap-3 bg-card px-4 py-3">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{s.label}</span>
                  <span className="text-right">
                    <span className="block font-mono text-[15px] font-medium tabular-nums leading-tight text-foreground">{s.value}</span>
                    <span className="block font-mono text-[10px] tabular-nums text-muted-foreground">{s.sub}</span>
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          {/* Tabs */}
          <div className="mb-4 flex w-fit max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-sunken p-0.5 scrollbar-none">
            {([
              { key: 'directory' as Tab, label: 'Directory', icon: Users },
              { key: 'time_off' as Tab, label: 'Leave', icon: Calendar },
              { key: 'performance' as Tab, label: 'Performance', icon: TrendingUp },
              { key: 'recruitment' as Tab, label: 'Recruitment', icon: Briefcase },
              { key: 'payroll' as Tab, label: 'Payroll', icon: DollarSign },
              { key: 'org' as Tab, label: 'Org chart', icon: Building },
            ]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn("flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors duration-150",
                  tab === t.key ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <t.icon className="h-3 w-3" /> {t.label}
              </button>
            ))}
          </div>

          {/* ═══ DIRECTORY TAB ═══ */}
          {tab === 'directory' && (
            <div className="pb-10">
              <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:max-w-xs sm:flex-1">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, role or ID…" className="h-9 rounded-lg border-border/60 bg-card pl-9 text-sm" />
                </div>
                <div className="flex max-w-full flex-wrap gap-1 overflow-x-auto scrollbar-none">
                  <button onClick={() => setFilterDept('all')} className={cn("rounded-md border px-2.5 py-1 text-[10.5px] font-medium transition-colors duration-150", filterDept === 'all' ? "border-primary bg-primary text-primary-foreground" : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground")}>All</button>
                  {DEPARTMENTS.map(dept => (
                    <button key={dept} onClick={() => setFilterDept(dept)}
                      className={cn("rounded-md border px-2.5 py-1 text-[10.5px] font-medium capitalize transition-colors duration-150",
                        filterDept === dept ? "border-primary bg-primary text-primary-foreground" : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground")}>
                      {dept}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <Panel><SkeletonLedger rows={6} /></Panel>
              ) : deptGroups.length === 0 ? (
                <EmptyState title="No employees yet" body="Add your first employee to start the directory." action={{ label: 'Add employee', onClick: () => setShowAddEmployee(true) }} />
              ) : (
                deptGroups.map(({ dept, members }) => (
                  <div key={dept} className="mb-6">
                    <h3 className="mb-2 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {dept} <span className="tabular-nums">({members.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {members.map(emp => {
                        const sc = STATUS_CONFIG[emp.status];
                        return (
                          <div key={emp.id}
                            onClick={() => setSelectedEmployee(emp)}
                            className="group cursor-pointer rounded-[10px] border border-border/60 bg-card p-4 transition-colors duration-150 hover:border-border">
                            <div className="mb-3 flex items-center gap-3">
                              <AvatarID name={emp.name} size="lg" />
                              <div className="min-w-0 flex-1">
                                <span className="block truncate text-[12.5px] font-[550] text-foreground">{emp.name}</span>
                                <span className="block truncate text-[11px] text-muted-foreground">{emp.role}</span>
                              </div>
                              <StatusBadge tone={sc.tone} label={sc.label} className="shrink-0 text-[10px]" />
                            </div>
                            <div className="space-y-1.5 text-[11px] text-muted-foreground">
                              <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{emp.email}</span></div>
                              <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" />{emp.location || 'Not set'}</div>
                              <div className="flex items-center gap-1.5"><Shield className="h-3 w-3 shrink-0" /><span className="font-mono tabular-nums">{emp.employeeId}</span></div>
                            </div>
                            {emp.performance > 0 && (
                              <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
                                <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">Performance</span>
                                <span className={cn("font-mono text-[11px] font-medium tabular-nums", perfTone(emp.performance))}>{emp.performance}%</span>
                              </div>
                            )}
                            {emp.skills.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {emp.skills.slice(0, 3).map(s => (
                                  <span key={s} className="rounded border border-border/60 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">{s}</span>
                                ))}
                                {emp.skills.length > 3 && <span className="text-[9px] tabular-nums text-muted-foreground">+{emp.skills.length - 3}</span>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ═══ LEAVE TAB ═══ */}
          {tab === 'time_off' && (
            <div className="pb-10">
              <Panel className="mb-4 overflow-hidden">
                <div className="grid grid-cols-1 gap-px bg-border/60 md:grid-cols-3">
                  {[
                    { label: 'Pending requests', value: pendingLeave },
                    { label: 'Approved this month', value: timeOff.filter(r => r.status === 'approved').length },
                    { label: 'Total days off (month)', value: timeOff.filter(r => r.status === 'approved').reduce((s, r) => s + r.days, 0) },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between gap-3 bg-card px-4 py-3">
                      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{s.label}</span>
                      <span className="font-mono text-[15px] font-medium tabular-nums text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              {timeOff.length === 0 ? (
                <EmptyState title="No leave requests" body="Requests your team submits will land here for approval." />
              ) : (
                <Panel>
                  <PanelHeader label="Leave requests" />
                  {timeOff.map(req => (
                    <div key={req.id} className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
                      <div className="flex items-center gap-3">
                        <AvatarID name={req.employee} size="lg" />
                        <div>
                          <h3 className="text-[13px] font-[450] text-foreground">{req.employee}</h3>
                          <span className="text-[11px] capitalize text-muted-foreground">{req.type} leave · {req.days} day(s)</span>
                          <span className="block font-mono text-[10.5px] tabular-nums text-muted-foreground">{req.startDate} to {req.endDate}</span>
                          {req.reason && <span className="mt-0.5 block text-[11px] text-muted-foreground">"{req.reason}"</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={req.status} className="capitalize" />
                        {req.status === 'pending' && (
                          <div className="flex gap-1">
                            <Button size="sm" className="h-7 rounded-md px-3 text-[10.5px]" onClick={() => approveRequest(req.id)}>Approve</Button>
                            <Button size="sm" variant="outline" className="h-7 rounded-md px-3 text-[10.5px]" onClick={() => denyRequest(req.id)}>Deny</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </Panel>
              )}
            </div>
          )}

          {/* ═══ PERFORMANCE TAB ═══ */}
          {tab === 'performance' && (
            <div className="pb-10">
              <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Panel>
                  <PanelHeader label="Team performance" />
                  <div className="space-y-2.5 p-4">
                    {employees.filter(e => e.performance > 0).sort((a, b) => b.performance - a.performance).map(emp => (
                      <div key={emp.id} className="flex items-center gap-3">
                        <AvatarID name={emp.name} size="md" />
                        <span className="w-28 truncate text-[11.5px] font-medium text-foreground">{emp.name}</span>
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
                          <div className="h-full rounded-full bg-primary/70" style={{ width: `${emp.performance}%` }} />
                        </div>
                        <span className={cn("w-10 text-right font-mono text-[11px] font-medium tabular-nums", perfTone(emp.performance))}>{emp.performance}%</span>
                      </div>
                    ))}
                    {employees.filter(e => e.performance > 0).length === 0 && (
                      <p className="py-4 text-center text-[11px] text-muted-foreground">No performance data yet</p>
                    )}
                  </div>
                </Panel>
                <Panel>
                  <PanelHeader label="Department averages" />
                  <div className="space-y-2.5 p-4">
                    {DEPARTMENTS.map(dept => {
                      const deptEmps = employees.filter(e => e.department === dept && e.performance > 0);
                      if (deptEmps.length === 0) return null;
                      const avg = Math.round(deptEmps.reduce((s, e) => s + e.performance, 0) / deptEmps.length);
                      return (
                        <div key={dept} className="flex items-center gap-3">
                          <span className="w-24 text-[11.5px] font-medium capitalize text-foreground">{dept}</span>
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-sunken">
                            <div className="h-full rounded-full bg-primary/70" style={{ width: `${avg}%` }} />
                          </div>
                          <span className={cn("w-10 text-right font-mono text-[11px] font-medium tabular-nums", perfTone(avg))}>{avg}%</span>
                        </div>
                      );
                    })}
                  </div>
                </Panel>
              </div>

              {reviews.length === 0 ? (
                <EmptyState title="No reviews yet" body="Performance reviews will appear here once recorded." compact />
              ) : (
                <Panel>
                  <PanelHeader label="Recent reviews" />
                  {reviews.map(review => (
                    <div key={review.id} className="border-t border-border/60 px-4 py-3 first:border-t-0">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AvatarID name={review.employee} size="lg" />
                          <div>
                            <h4 className="text-[13px] font-[450] text-foreground">{review.employee}</h4>
                            <span className="text-[11px] text-muted-foreground">{review.period} · Reviewed by {review.reviewer}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={cn("font-mono text-lg font-medium tabular-nums", perfTone(review.rating))}>{review.rating}</span>
                          <span className="block font-mono text-[10px] text-muted-foreground">/100</span>
                        </div>
                      </div>
                      <p className="mb-2 text-[11.5px] text-muted-foreground">"{review.feedback}"</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {review.goals.map((g: any) => (
                          <StatusBadge
                            key={g.title}
                            tone={g.status === 'completed' ? 'ok' : g.status === 'on_track' ? 'accent' : 'risk'}
                            label={g.title}
                            className="text-[10.5px]"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </Panel>
              )}
            </div>
          )}

          {/* ═══ RECRUITMENT TAB ═══ */}
          {tab === 'recruitment' && (
            <div className="pb-10">
              <Panel className="mb-4 overflow-hidden">
                <div className="grid grid-cols-2 gap-px bg-border/60 md:grid-cols-5">
                  {['applied', 'screening', 'interview', 'offer', 'hired'].map(stage => {
                    const count = candidates.filter(c => c.stage === stage).length;
                    return (
                      <div key={stage} className="flex items-center justify-between gap-2 bg-card px-4 py-3">
                        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{stage}</span>
                        <span className="font-mono text-[15px] font-medium tabular-nums text-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </Panel>
              {candidates.length === 0 ? (
                <EmptyState title="No candidates yet" body="Candidates you add will move through the pipeline here." />
              ) : (
                <Panel>
                  <PanelHeader label="Pipeline" />
                  {candidates.map(c => (
                    <div key={c.id} className="group border-t border-border/60 px-4 py-2.5 first:border-t-0">
                      <div className="flex items-center gap-3">
                        <AvatarID name={c.name} size="lg" />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-[12.5px] font-[450] text-foreground">{c.name}</h4>
                          <span className="text-[11px] text-muted-foreground">{c.role} · {c.department}</span>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn("h-3 w-3", i < c.rating ? "fill-gold text-gold" : "text-border")} />
                          ))}
                        </div>
                        <StatusBadge tone={STAGE_TONES[c.stage]} label={c.stage} className="shrink-0 capitalize" />
                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {c.stage !== 'hired' && c.stage !== 'rejected' && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[10.5px]"
                              onClick={() => {
                                const stages: Candidate['stage'][] = ['applied', 'screening', 'interview', 'offer', 'hired'];
                                const next = stages[stages.indexOf(c.stage) + 1];
                                if (next) advanceCandidate(c.id, next);
                              }}>
                              Advance <ChevronRight className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {c.notes && <p className="ml-12 mt-1 text-[11px] text-muted-foreground">"{c.notes}"</p>}
                    </div>
                  ))}
                </Panel>
              )}
            </div>
          )}

          {/* ═══ PAYROLL TAB ═══ */}
          {tab === 'payroll' && (
            <div className="pb-10">
              <Panel className="mb-4 overflow-hidden">
                <div className="grid grid-cols-1 gap-px bg-border/60 md:grid-cols-3">
                  {[
                    { label: 'Annual payroll', value: `£${totalSalary.toLocaleString()}` },
                    { label: 'Monthly cost', value: `£${Math.round(totalSalary / 12).toLocaleString()}` },
                    { label: 'Avg salary', value: employees.length > 0 ? `£${Math.round(totalSalary / employees.length).toLocaleString()}` : '£0' },
                  ].map(s => (
                    <div key={s.label} className="flex items-center justify-between gap-3 bg-card px-4 py-3">
                      <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{s.label}</span>
                      <span className="font-mono text-[15px] font-medium tabular-nums text-foreground">{s.value}</span>
                    </div>
                  ))}
                </div>
              </Panel>
              {employees.length === 0 ? (
                <EmptyState title="No employees yet" body="Payroll figures appear once you add employees." />
              ) : (
                <Panel className="overflow-hidden">
                  <div className="overflow-x-auto">
                  <div className="min-w-[480px]">
                  <div className="grid grid-cols-5 gap-0 border-b border-border/60 bg-sunken p-3 font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    <span>Employee</span><span>Department</span><span>Role</span><span className="text-right">Annual salary</span><span className="text-right">Monthly</span>
                  </div>
                  {employees.sort((a, b) => b.salary - a.salary).map(emp => (
                    <div key={emp.id} className="grid h-10 grid-cols-5 items-center gap-0 border-b border-border/60 px-3 text-[12px] transition-colors duration-150 last:border-b-0 hover:bg-foreground/[0.025]">
                      <div className="flex items-center gap-2">
                        <AvatarID name={emp.name} size="sm" />
                        <span className="truncate font-medium text-foreground">{emp.name}</span>
                      </div>
                      <span className="flex items-center capitalize text-muted-foreground">{emp.department}</span>
                      <span className="flex items-center truncate text-muted-foreground">{emp.role}</span>
                      <span className="flex items-center justify-end text-right font-mono font-medium tabular-nums text-foreground">£{emp.salary.toLocaleString()}</span>
                      <span className="flex items-center justify-end text-right font-mono tabular-nums text-muted-foreground">£{Math.round(emp.salary / 12).toLocaleString()}</span>
                    </div>
                  ))}
                  </div>
                  </div>
                </Panel>
              )}
            </div>
          )}

          {/* ═══ ORG CHART TAB ═══ */}
          {tab === 'org' && (
            <div className="pb-10">
              <div className="flex flex-col items-center gap-5">
                <div className="w-48 rounded-[10px] border border-border/60 bg-card p-4 text-center">
                  <AvatarID name="Chief Executive" size="xl" className="mx-auto mb-2" />
                  <span className="block text-[12.5px] font-[550] text-foreground">Chief executive</span>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.13em] text-muted-foreground">Leadership</span>
                </div>
                <div className="h-6 w-px bg-border" />
                <div className="grid w-full max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
                  {DEPARTMENTS.map(dept => {
                    const deptEmps = employees.filter(e => e.department === dept);
                    return (
                      <div key={dept} className="overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:border-border">
                        <div className="border-b border-border/60 bg-sunken p-3 text-center">
                          <span className="block font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-foreground">{dept}</span>
                          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{deptEmps.length} members</span>
                        </div>
                        <div className="space-y-0.5 p-2">
                          {deptEmps.map(emp => (
                            <div key={emp.id} className="flex cursor-pointer items-center gap-2 rounded-md p-1.5 transition-colors duration-150 hover:bg-foreground/[0.025]" onClick={() => setSelectedEmployee(emp)}>
                              <AvatarID name={emp.name} size="sm" />
                              <div className="min-w-0 flex-1">
                                <span className="block truncate text-[11px] font-medium text-foreground">{emp.name}</span>
                                <span className="block truncate text-[9.5px] text-muted-foreground">{emp.role}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ EMPLOYEE DETAIL DRAWER ═══ */}
      {selectedEmployee && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setSelectedEmployee(null)} />
          <div className="fixed bottom-0 right-0 top-0 z-[61] w-full max-w-lg overflow-auto border-l border-border/60 bg-background">
              <div className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">Employee profile</h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSelectedEmployee(null)}><X className="h-4 w-4" /></Button>
                </div>
                {(() => {
                  const emp = selectedEmployee;
                  const sc = STATUS_CONFIG[emp.status];
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <AvatarID name={emp.name} size="xl" />
                        <div>
                          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">{emp.name}</h3>
                          <span className="text-[12px] text-muted-foreground">{emp.role} · {emp.department}</span>
                          <div className="mt-1 flex items-center gap-2">
                            <StatusBadge tone={sc.tone} label={sc.label} className="text-[10.5px]" />
                            <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{emp.employeeId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Email', value: emp.email, icon: Mail },
                          { label: 'Phone', value: emp.phone || 'Not set', icon: Phone },
                          { label: 'Location', value: emp.location || 'Not set', icon: MapPin },
                          { label: 'Start date', value: emp.startDate, icon: Calendar },
                          { label: 'Manager', value: emp.manager, icon: UserCheck },
                          { label: 'Salary', value: `£${emp.salary.toLocaleString()}/yr`, icon: DollarSign },
                        ].map(f => (
                          <div key={f.label} className="rounded-lg border border-border/60 bg-card p-3">
                            <div className="mb-1 flex items-center gap-1.5">
                              <f.icon className="h-3 w-3 text-muted-foreground" />
                              <span className="font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{f.label}</span>
                            </div>
                            <span className={cn("text-[11.5px] font-medium text-foreground", (f.label === 'Salary' || f.label === 'Start date') && 'font-mono tabular-nums')}>{f.value}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Skills and expertise</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {emp.skills.length > 0 ? emp.skills.map(s => (
                            <span key={s} className="rounded-md border border-border/60 px-2 py-0.5 text-[10.5px] font-medium text-foreground">{s}</span>
                          )) : <span className="text-[10.5px] text-muted-foreground">No skills added</span>}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Leave balance</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(emp.leaveBalance).map(([type, days]) => (
                            <div key={type} className="rounded-lg border border-border/60 bg-card p-3 text-center">
                              <span className="block font-mono text-[15px] font-medium tabular-nums text-foreground">{days}</span>
                              <span className="font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{type}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {emp.performance > 0 && (
                        <div>
                          <h4 className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Performance</h4>
                          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-4">
                            <span className={cn("font-mono text-xl font-medium tabular-nums", perfTone(emp.performance))}>{emp.performance}%</span>
                            <span className="font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">Last review</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Emergency contact</h4>
                        <p className="text-[11.5px] text-muted-foreground">{emp.emergencyContact}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="h-9 flex-1 rounded-lg text-[11.5px]"><Edit className="mr-1 h-3 w-3" /> Edit profile</Button>
                        <Button variant="outline" size="sm" className="h-9 rounded-lg text-[11.5px] text-risk" onClick={() => { deleteEmployee(emp.id); setSelectedEmployee(null); }}>
                          <Trash2 className="mr-1 h-3 w-3" /> Remove
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
          </div>
        </>
      )}

      {/* ═══ ADD EMPLOYEE MODAL ═══ */}
      {showAddEmployee && (
        <>
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setShowAddEmployee(false)} />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-xl border border-border/60 bg-background p-6 shadow-card">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">Add employee</h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setShowAddEmployee(false)}><X className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-3">
                  <Input placeholder="Full name (required)" value={newEmployee.name} onChange={e => setNewEmployee(p => ({ ...p, name: e.target.value }))} className="h-10 rounded-lg" />
                  <Input placeholder="Role or title (required)" value={newEmployee.role} onChange={e => setNewEmployee(p => ({ ...p, role: e.target.value }))} className="h-10 rounded-lg" />
                  <select value={newEmployee.department} onChange={e => setNewEmployee(p => ({ ...p, department: e.target.value as Department }))}
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground">
                    {DEPARTMENTS.map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                  </select>
                  <Input placeholder="Email (required)" type="email" value={newEmployee.email} onChange={e => setNewEmployee(p => ({ ...p, email: e.target.value }))} className="h-10 rounded-lg" />
                  <Input placeholder="Phone" value={newEmployee.phone} onChange={e => setNewEmployee(p => ({ ...p, phone: e.target.value }))} className="h-10 rounded-lg" />
                  <Input placeholder="Location" value={newEmployee.location} onChange={e => setNewEmployee(p => ({ ...p, location: e.target.value }))} className="h-10 rounded-lg" />
                  <Input placeholder="Annual salary (£)" type="number" value={newEmployee.salary} onChange={e => setNewEmployee(p => ({ ...p, salary: e.target.value }))} className="h-10 rounded-lg" />
                  <Button className="h-10 w-full rounded-lg" onClick={addEmployee}>Add employee</Button>
                </div>
              </div>
          </div>
        </>
      )}
    </div>
  );
}
