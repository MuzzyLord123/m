import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Plus, Trash2, Mail, Phone, MapPin, Calendar, Search, Building, UserCheck, Clock, Briefcase, Shield, Award, TrendingUp, FileText, X, ChevronRight, Star, BarChart3, Target, Heart, GraduationCap, DollarSign, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

const DEPT_COLORS: Record<Department, string> = {
  engineering: '#3b82f6', design: '#8b5cf6', marketing: '#ec4899', sales: '#f59e0b',
  operations: '#10b981', hr: '#06b6d4', finance: '#f97316', legal: '#64748b'
};

const DEPT_ICONS: Record<Department, string> = {
  engineering: '⚙️', design: '🎨', marketing: '📢', sales: '💰',
  operations: '🔧', hr: '👥', finance: '📊', legal: '⚖️'
};

const STATUS_CONFIG: Record<EmployeeStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: '#10b981' },
  on_leave: { label: 'On Leave', color: '#f59e0b' },
  probation: { label: 'Probation', color: '#3b82f6' },
  offboarded: { label: 'Offboarded', color: '#ef4444' },
};

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

  const deptGroups = Object.keys(DEPT_COLORS).map(dept => ({ dept: dept as Department, members: filtered.filter(e => e.department === dept) })).filter(g => g.members.length > 0);

  const totalSalary = employees.reduce((s, e) => s + e.salary, 0);
  const avgPerformance = employees.filter(e => e.performance > 0).length > 0 ? Math.round(employees.filter(e => e.performance > 0).reduce((s, e) => s + e.performance, 0) / employees.filter(e => e.performance > 0).length) : 0;
  const pendingLeave = timeOff.filter(r => r.status === 'pending').length;
  const openPositions = candidates.filter(c => c.stage !== 'hired' && c.stage !== 'rejected').length;

  const STAGE_COLORS: Record<string, string> = { applied: '#94a3b8', screening: '#f59e0b', interview: '#3b82f6', offer: '#8b5cf6', hired: '#10b981', rejected: '#ef4444' };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 h-[52px] sm:h-[56px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40 hidden sm:block" />
        <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shrink-0">
          <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
        </div>
        <div className="min-w-0">
          <span className="text-xs sm:text-sm font-bold tracking-tight text-foreground truncate block">HR & People</span>
          <span className="text-[9px] text-muted-foreground/40 block -mt-0.5 hidden sm:block">{employees.length} employees · {Object.keys(DEPT_COLORS).length} departments</span>
        </div>
        <div className="flex-1" />
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs shrink-0" onClick={() => setShowAddEmployee(true)}>
          <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline"> Add Employee</span>
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-10">
          {/* Hero Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 pt-4 sm:pt-6 pb-4">
            {[
              { label: 'Headcount', value: employees.length, icon: Users, color: '#3b82f6', sub: `${employees.filter(e => e.status === 'active').length} active` },
              { label: 'On Leave', value: employees.filter(e => e.status === 'on_leave').length, icon: Calendar, color: '#f59e0b', sub: `${pendingLeave} pending` },
              { label: 'Avg. Rating', value: `${avgPerformance}%`, icon: TrendingUp, color: '#10b981', sub: 'Performance' },
              { label: 'Open Roles', value: openPositions, icon: Briefcase, color: '#8b5cf6', sub: 'Recruiting' },
              { label: 'Departments', value: Object.keys(DEPT_COLORS).length, icon: Building, color: '#06b6d4', sub: 'Teams' },
              { label: 'Monthly Payroll', value: `£${Math.round(totalSalary / 12).toLocaleString()}`, icon: DollarSign, color: '#f97316', sub: `£${totalSalary.toLocaleString()}/yr` },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="p-4 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: `${s.color}12` }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                </div>
                <span className="text-xl font-bold text-foreground block">{s.value}</span>
                <span className="text-[9px] text-muted-foreground/40 font-medium uppercase tracking-wider">{s.label}</span>
                <span className="text-[9px] text-muted-foreground/30 block mt-0.5">{s.sub}</span>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 mb-5 bg-muted/30 p-0.5 rounded-xl overflow-x-auto max-w-full scrollbar-none">
            {([
              { key: 'directory' as Tab, label: 'Directory', icon: Users },
              { key: 'time_off' as Tab, label: 'Leave', icon: Calendar },
              { key: 'performance' as Tab, label: 'Performance', icon: TrendingUp },
              { key: 'recruitment' as Tab, label: 'Recruitment', icon: Briefcase },
              { key: 'payroll' as Tab, label: 'Payroll', icon: DollarSign },
              { key: 'org' as Tab, label: 'Org Chart', icon: Building },
            ]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn("px-3 py-2 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap",
                  tab === t.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground/60 hover:text-foreground")}>
                <t.icon className="h-3 w-3" /> {t.label}
              </button>
            ))}
          </div>

          {/* ═══ DIRECTORY TAB ═══ */}
          {tab === 'directory' && (
            <div className="pb-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-5">
                <div className="relative w-full sm:flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, role, or ID…" className="pl-9 h-9 rounded-xl bg-card/50 border-border/30 text-sm" />
                </div>
                <div className="flex gap-1 flex-wrap overflow-x-auto scrollbar-none max-w-full">
                  <button onClick={() => setFilterDept('all')} className={cn("px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all", filterDept === 'all' ? "bg-foreground text-background" : "bg-muted/30 text-muted-foreground/60 hover:text-foreground")}>All</button>
                  {Object.entries(DEPT_COLORS).map(([dept, color]) => (
                    <button key={dept} onClick={() => setFilterDept(dept as Department)}
                      className={cn("px-2.5 py-1 rounded-lg text-[10px] font-medium capitalize transition-all",
                        filterDept === dept ? "text-white" : "text-muted-foreground/60 hover:text-foreground")}
                      style={filterDept === dept ? { background: color } : { background: `${color}10` }}>
                      {DEPT_ICONS[dept as Department]} {dept}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="py-16 text-center text-muted-foreground/40 text-sm">Loading employees…</div>
              ) : deptGroups.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/15 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground/40">No employees yet</p>
                  <p className="text-xs text-muted-foreground/30 mt-1">Click "Add Employee" to get started</p>
                </div>
              ) : (
                deptGroups.map(({ dept, members }) => (
                  <div key={dept} className="mb-8">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: DEPT_COLORS[dept] }}>
                      <span className="text-base">{DEPT_ICONS[dept]}</span> {dept} <span className="text-muted-foreground/30">({members.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {members.map((emp, i) => {
                        const sc = STATUS_CONFIG[emp.status];
                        return (
                          <motion.div key={emp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                            onClick={() => setSelectedEmployee(emp)}
                            className="group p-4 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl" style={{ background: DEPT_COLORS[emp.department] }} />
                            <div className="flex items-center gap-3 mb-3 mt-1">
                              <div className="h-11 w-11 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${DEPT_COLORS[emp.department]}, ${DEPT_COLORS[emp.department]}cc)` }}>
                                {emp.avatar}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[12px] font-bold text-foreground block truncate">{emp.name}</span>
                                <span className="text-[10px] text-muted-foreground/50 block truncate">{emp.role}</span>
                              </div>
                              <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold shrink-0" style={{ background: `${sc.color}15`, color: sc.color }}>{sc.label}</span>
                            </div>
                            <div className="space-y-1.5 text-[10px] text-muted-foreground/40">
                              <div className="flex items-center gap-1.5"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{emp.email}</span></div>
                              <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 shrink-0" />{emp.location || 'Not set'}</div>
                              <div className="flex items-center gap-1.5"><Shield className="h-3 w-3 shrink-0" />{emp.employeeId}</div>
                            </div>
                            {emp.performance > 0 && (
                              <div className="mt-3 pt-3 border-t border-border/10">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] text-muted-foreground/30 font-medium">Performance</span>
                                  <span className="text-[10px] font-bold" style={{ color: emp.performance >= 90 ? '#10b981' : emp.performance >= 75 ? '#f59e0b' : '#ef4444' }}>{emp.performance}%</span>
                                </div>
                                <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${emp.performance}%` }} transition={{ duration: 0.8, delay: 0.2 }}
                                    className="h-full rounded-full" style={{ background: emp.performance >= 90 ? '#10b981' : emp.performance >= 75 ? '#f59e0b' : '#ef4444' }} />
                                </div>
                              </div>
                            )}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {emp.skills.slice(0, 3).map(s => (
                                <span key={s} className="text-[8px] px-1.5 py-0.5 rounded-md bg-muted/30 text-muted-foreground/50 font-medium">{s}</span>
                              ))}
                              {emp.skills.length > 3 && <span className="text-[8px] text-muted-foreground/30">+{emp.skills.length - 3}</span>}
                            </div>
                          </motion.div>
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Pending Requests', value: pendingLeave, color: '#f59e0b' },
                  { label: 'Approved This Month', value: timeOff.filter(r => r.status === 'approved').length, color: '#10b981' },
                  { label: 'Total Days Off (Month)', value: timeOff.filter(r => r.status === 'approved').reduce((s, r) => s + r.days, 0), color: '#3b82f6' },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-2xl bg-card/50 border border-border/20">
                    <span className="text-2xl font-bold block" style={{ color: s.color }}>{s.value}</span>
                    <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
              {timeOff.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground/40 text-sm">No leave requests yet</div>
              ) : (
                <div className="space-y-2">
                  {timeOff.map(req => (
                    <motion.div key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-5 rounded-2xl bg-card/50 border border-border/20 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#06b6d4' }}>
                            {req.employee.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h3 className="text-[13px] font-bold text-foreground">{req.employee}</h3>
                            <span className="text-[10px] text-muted-foreground/50 capitalize">{req.type} leave · {req.days} day(s)</span>
                            <span className="text-[10px] text-muted-foreground/40 block">{req.startDate} → {req.endDate}</span>
                            {req.reason && <span className="text-[10px] text-muted-foreground/30 italic block mt-0.5">"{req.reason}"</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-semibold",
                            req.status === 'approved' ? "bg-green-500/10 text-green-500" : req.status === 'pending' ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/10 text-red-500")}>
                            {req.status}
                          </span>
                          {req.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 px-3 text-[10px] rounded-lg bg-green-600 hover:bg-green-700 text-white" onClick={() => approveRequest(req.id)}>Approve</Button>
                              <Button size="sm" variant="outline" className="h-7 px-3 text-[10px] rounded-lg text-red-500 border-red-500/20 hover:bg-red-500/10" onClick={() => denyRequest(req.id)}>Deny</Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ PERFORMANCE TAB ═══ */}
          {tab === 'performance' && (
            <div className="pb-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="p-5 rounded-2xl bg-card/50 border border-border/20">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-4">Team Performance Distribution</h3>
                  <div className="space-y-3">
                    {employees.filter(e => e.performance > 0).sort((a, b) => b.performance - a.performance).map(emp => (
                      <div key={emp.id} className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0" style={{ background: DEPT_COLORS[emp.department] }}>
                          {emp.avatar}
                        </div>
                        <span className="text-[11px] font-medium text-foreground w-28 truncate">{emp.name}</span>
                        <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${emp.performance}%` }} transition={{ duration: 1 }}
                            className="h-full rounded-full" style={{ background: emp.performance >= 90 ? '#10b981' : emp.performance >= 75 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span className="text-[11px] font-bold w-10 text-right" style={{ color: emp.performance >= 90 ? '#10b981' : emp.performance >= 75 ? '#f59e0b' : '#ef4444' }}>{emp.performance}%</span>
                      </div>
                    ))}
                    {employees.filter(e => e.performance > 0).length === 0 && (
                      <p className="text-[11px] text-muted-foreground/40 text-center py-6">No performance data yet</p>
                    )}
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-card/50 border border-border/20">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-4">Department Averages</h3>
                  <div className="space-y-3">
                    {Object.entries(DEPT_COLORS).map(([dept, color]) => {
                      const deptEmps = employees.filter(e => e.department === dept && e.performance > 0);
                      if (deptEmps.length === 0) return null;
                      const avg = Math.round(deptEmps.reduce((s, e) => s + e.performance, 0) / deptEmps.length);
                      return (
                        <div key={dept} className="flex items-center gap-3">
                          <span className="text-base">{DEPT_ICONS[dept as Department]}</span>
                          <span className="text-[11px] font-medium capitalize text-foreground w-24">{dept}</span>
                          <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${avg}%` }} transition={{ duration: 1 }} className="h-full rounded-full" style={{ background: color }} />
                          </div>
                          <span className="text-[11px] font-bold w-10 text-right" style={{ color }}>{avg}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-3">Recent Reviews</h3>
              {reviews.length === 0 ? (
                <p className="text-[11px] text-muted-foreground/40 text-center py-6">No reviews yet</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map(review => (
                    <motion.div key={review.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="p-5 rounded-2xl bg-card/50 border border-border/20 hover:shadow-lg transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: '#10b981' }}>
                            {review.employee.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <h4 className="text-[13px] font-bold text-foreground">{review.employee}</h4>
                            <span className="text-[10px] text-muted-foreground/40">{review.period} · Reviewed by {review.reviewer}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black" style={{ color: review.rating >= 90 ? '#10b981' : '#f59e0b' }}>{review.rating}</span>
                          <span className="text-[10px] text-muted-foreground/30 block">/100</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground/50 mb-3 italic">"{review.feedback}"</p>
                      <div className="flex flex-wrap gap-2">
                        {review.goals.map((g: any) => (
                          <span key={g.title} className={cn("text-[9px] px-2 py-1 rounded-lg font-medium",
                            g.status === 'completed' ? "bg-green-500/10 text-green-600" : g.status === 'on_track' ? "bg-blue-500/10 text-blue-500" : "bg-red-500/10 text-red-500")}>
                            {g.status === 'completed' ? '✓' : g.status === 'on_track' ? '→' : '⚠'} {g.title}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ RECRUITMENT TAB ═══ */}
          {tab === 'recruitment' && (
            <div className="pb-10">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                {['applied', 'screening', 'interview', 'offer', 'hired'].map(stage => {
                  const count = candidates.filter(c => c.stage === stage).length;
                  return (
                    <div key={stage} className="p-3 rounded-xl bg-card/50 border border-border/20 text-center">
                      <span className="text-lg font-bold block" style={{ color: STAGE_COLORS[stage] }}>{count}</span>
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground/40 font-medium capitalize">{stage}</span>
                    </div>
                  );
                })}
              </div>
              {candidates.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground/40 text-sm">No candidates yet</div>
              ) : (
                <div className="space-y-2">
                  {candidates.map(c => (
                    <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="group p-4 rounded-2xl bg-card/50 border border-border/20 hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: DEPT_COLORS[c.department] }}>
                          {c.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[12px] font-bold text-foreground">{c.name}</h4>
                          <span className="text-[10px] text-muted-foreground/50">{c.role} · {c.department}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn("h-3 w-3", i < c.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />
                          ))}
                        </div>
                        <span className="text-[10px] px-2.5 py-1 rounded-full font-semibold capitalize shrink-0" style={{ background: `${STAGE_COLORS[c.stage]}15`, color: STAGE_COLORS[c.stage] }}>{c.stage}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {c.stage !== 'hired' && c.stage !== 'rejected' && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]"
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
                      {c.notes && <p className="text-[10px] text-muted-foreground/35 mt-2 ml-14 italic">"{c.notes}"</p>}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ PAYROLL TAB ═══ */}
          {tab === 'payroll' && (
            <div className="pb-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                {[
                  { label: 'Annual Payroll', value: `£${totalSalary.toLocaleString()}`, color: '#f97316' },
                  { label: 'Monthly Cost', value: `£${Math.round(totalSalary / 12).toLocaleString()}`, color: '#3b82f6' },
                  { label: 'Avg. Salary', value: employees.length > 0 ? `£${Math.round(totalSalary / employees.length).toLocaleString()}` : '£0', color: '#8b5cf6' },
                ].map(s => (
                  <div key={s.label} className="p-5 rounded-2xl bg-card/50 border border-border/20">
                    <span className="text-2xl font-bold block" style={{ color: s.color }}>{s.value}</span>
                    <span className="text-[10px] text-muted-foreground/40 uppercase tracking-wider font-medium">{s.label}</span>
                  </div>
                ))}
              </div>
              {employees.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground/40 text-sm">No employees yet</div>
              ) : (
                <div className="rounded-2xl bg-card/50 border border-border/20 overflow-hidden">
                  <div className="overflow-x-auto">
                  <div className="min-w-[480px]">
                  <div className="grid grid-cols-5 gap-0 p-3 bg-muted/20 border-b border-border/10 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">
                    <span>Employee</span><span>Department</span><span>Role</span><span className="text-right">Annual Salary</span><span className="text-right">Monthly</span>
                  </div>
                  {employees.sort((a, b) => b.salary - a.salary).map(emp => (
                    <div key={emp.id} className="grid grid-cols-5 gap-0 p-3 border-b border-border/5 hover:bg-muted/10 transition-colors text-[11px]">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: DEPT_COLORS[emp.department] }}>{emp.avatar}</div>
                        <span className="font-medium text-foreground truncate">{emp.name}</span>
                      </div>
                      <span className="text-muted-foreground/50 capitalize flex items-center">{emp.department}</span>
                      <span className="text-muted-foreground/50 flex items-center truncate">{emp.role}</span>
                      <span className="text-foreground font-semibold text-right flex items-center justify-end">£{emp.salary.toLocaleString()}</span>
                      <span className="text-muted-foreground/50 text-right flex items-center justify-end">£{Math.round(emp.salary / 12).toLocaleString()}</span>
                    </div>
                  ))}
                  </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ ORG CHART TAB ═══ */}
          {tab === 'org' && (
            <div className="pb-10">
              <div className="flex flex-col items-center gap-6">
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-5 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 text-center w-48 shadow-lg">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-sm font-bold mx-auto mb-2">CEO</div>
                  <span className="text-[12px] font-bold text-foreground block">Chief Executive</span>
                  <span className="text-[10px] text-muted-foreground/40">Leadership</span>
                </motion.div>
                <div className="w-px h-6 bg-border/30" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                  {Object.entries(DEPT_COLORS).map(([dept, color], i) => {
                    const deptEmps = employees.filter(e => e.department === dept);
                    return (
                      <motion.div key={dept} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="rounded-2xl bg-card/50 border border-border/20 overflow-hidden hover:shadow-xl transition-all">
                        <div className="h-1.5" style={{ background: color }} />
                        <div className="p-4 text-center">
                          <span className="text-2xl block mb-1">{DEPT_ICONS[dept as Department]}</span>
                          <span className="text-[11px] font-bold capitalize text-foreground block">{dept}</span>
                          <span className="text-[10px] text-muted-foreground/40">{deptEmps.length} members</span>
                        </div>
                        <div className="px-3 pb-3 space-y-1">
                          {deptEmps.map(emp => (
                            <div key={emp.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedEmployee(emp)}>
                              <div className="h-6 w-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ background: color }}>{emp.avatar}</div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-medium text-foreground block truncate">{emp.name}</span>
                                <span className="text-[8px] text-muted-foreground/30 truncate block">{emp.role}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ EMPLOYEE DETAIL DRAWER ═══ */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" onClick={() => setSelectedEmployee(null)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-background border-l border-border/30 z-[61] overflow-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground">Employee Profile</h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setSelectedEmployee(null)}><X className="h-4 w-4" /></Button>
                </div>
                {(() => {
                  const emp = selectedEmployee;
                  const sc = STATUS_CONFIG[emp.status];
                  return (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${DEPT_COLORS[emp.department]}, ${DEPT_COLORS[emp.department]}99)` }}>
                          {emp.avatar}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{emp.name}</h3>
                          <span className="text-[12px] text-muted-foreground/50">{emp.role} · {emp.department}</span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: `${sc.color}15`, color: sc.color }}>{sc.label}</span>
                            <span className="text-[10px] text-muted-foreground/30">{emp.employeeId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Email', value: emp.email, icon: Mail },
                          { label: 'Phone', value: emp.phone || 'Not set', icon: Phone },
                          { label: 'Location', value: emp.location || 'Not set', icon: MapPin },
                          { label: 'Start Date', value: emp.startDate, icon: Calendar },
                          { label: 'Manager', value: emp.manager, icon: UserCheck },
                          { label: 'Salary', value: `£${emp.salary.toLocaleString()}/yr`, icon: DollarSign },
                        ].map(f => (
                          <div key={f.label} className="p-3 rounded-xl bg-muted/20 border border-border/10">
                            <div className="flex items-center gap-1.5 mb-1">
                              <f.icon className="h-3 w-3 text-muted-foreground/30" />
                              <span className="text-[9px] text-muted-foreground/30 uppercase tracking-wider font-medium">{f.label}</span>
                            </div>
                            <span className="text-[11px] font-medium text-foreground">{f.value}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Skills & Expertise</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {emp.skills.length > 0 ? emp.skills.map(s => (
                            <span key={s} className="text-[10px] px-2.5 py-1 rounded-lg font-medium" style={{ background: `${DEPT_COLORS[emp.department]}10`, color: DEPT_COLORS[emp.department] }}>{s}</span>
                          )) : <span className="text-[10px] text-muted-foreground/30">No skills added</span>}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Leave Balance</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {Object.entries(emp.leaveBalance).map(([type, days]) => (
                            <div key={type} className="p-3 rounded-xl bg-card/50 border border-border/10 text-center">
                              <span className="text-lg font-bold text-foreground block">{days}</span>
                              <span className="text-[9px] text-muted-foreground/30 capitalize font-medium">{type}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {emp.performance > 0 && (
                        <div>
                          <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Performance</h4>
                          <div className="p-4 rounded-xl bg-card/50 border border-border/10">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-3xl font-black" style={{ color: emp.performance >= 90 ? '#10b981' : '#f59e0b' }}>{emp.performance}%</span>
                              <span className="text-[10px] text-muted-foreground/30">Last Review</span>
                            </div>
                            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${emp.performance}%`, background: emp.performance >= 90 ? '#10b981' : '#f59e0b' }} />
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-2">Emergency Contact</h4>
                        <p className="text-[11px] text-muted-foreground/60">{emp.emergencyContact}</p>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1 h-9 rounded-xl text-[11px]"><Edit className="h-3 w-3 mr-1" /> Edit Profile</Button>
                        <Button variant="outline" size="sm" className="h-9 rounded-xl text-[11px] text-red-500 border-red-500/20 hover:bg-red-500/10" onClick={() => { deleteEmployee(emp.id); setSelectedEmployee(null); }}>
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ═══ ADD EMPLOYEE MODAL ═══ */}
      <AnimatePresence>
        {showAddEmployee && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" onClick={() => setShowAddEmployee(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[61] flex items-center justify-center p-4">
              <div className="bg-background rounded-2xl border border-border/30 shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-foreground">Add New Employee</h2>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setShowAddEmployee(false)}><X className="h-4 w-4" /></Button>
                </div>
                <div className="space-y-3">
                  <Input placeholder="Full Name *" value={newEmployee.name} onChange={e => setNewEmployee(p => ({ ...p, name: e.target.value }))} className="h-10 rounded-xl" />
                  <Input placeholder="Role / Title *" value={newEmployee.role} onChange={e => setNewEmployee(p => ({ ...p, role: e.target.value }))} className="h-10 rounded-xl" />
                  <select value={newEmployee.department} onChange={e => setNewEmployee(p => ({ ...p, department: e.target.value as Department }))}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground">
                    {Object.keys(DEPT_COLORS).map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                  </select>
                  <Input placeholder="Email *" type="email" value={newEmployee.email} onChange={e => setNewEmployee(p => ({ ...p, email: e.target.value }))} className="h-10 rounded-xl" />
                  <Input placeholder="Phone" value={newEmployee.phone} onChange={e => setNewEmployee(p => ({ ...p, phone: e.target.value }))} className="h-10 rounded-xl" />
                  <Input placeholder="Location" value={newEmployee.location} onChange={e => setNewEmployee(p => ({ ...p, location: e.target.value }))} className="h-10 rounded-xl" />
                  <Input placeholder="Annual Salary (£)" type="number" value={newEmployee.salary} onChange={e => setNewEmployee(p => ({ ...p, salary: e.target.value }))} className="h-10 rounded-xl" />
                  <Button className="w-full h-10 rounded-xl" onClick={addEmployee}>Add Employee</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
