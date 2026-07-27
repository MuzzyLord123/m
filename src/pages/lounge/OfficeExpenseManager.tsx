import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Receipt, Plus, Search, Filter, Download, Upload,
  Calendar, DollarSign, CreditCard, FileText, Check, X, Clock,
  TrendingUp, ArrowUpRight, Tag, Building2, Users, Briefcase,
  MoreHorizontal, Eye, ChevronDown, AlertCircle, CheckCircle2,
  Wallet, PieChart, BarChart3, Trash2, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type ExpenseStatus = 'pending' | 'approved' | 'rejected' | 'reimbursed';
type TabId = 'all' | 'pending' | 'approved' | 'reports';

interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: string;
  categoryColor: string;
  vendor: string;
  date: string;
  status: ExpenseStatus;
  receipt: boolean;
  project?: string;
  notes?: string;
}

const STATUS_CONFIG: Record<ExpenseStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: Clock },
  approved: { label: 'Approved', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-500/10', icon: X },
  reimbursed: { label: 'Reimbursed', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Check },
};

const CATEGORY_COLORS: Record<string, string> = { Travel: '#6366f1', Software: '#06b6d4', Meals: '#10b981', Office: '#f59e0b', Marketing: '#ec4899', Other: '#94a3b8' };

export default function OfficeExpenseManager() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [search, setSearch] = useState('');
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newExp, setNewExp] = useState({ title: '', amount: '', category: 'Other', vendor: '', project: '', notes: '' });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from DB
  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('expenses').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) {
      setExpenses(data.map((e: any) => ({
        id: e.id, title: e.title, amount: Number(e.amount), currency: e.currency || '£',
        category: e.category, categoryColor: e.category_color || CATEGORY_COLORS[e.category] || '#94a3b8',
        vendor: e.vendor || 'Unknown', date: e.expense_date,
        status: e.status as ExpenseStatus, receipt: e.has_receipt || false,
        project: e.project || undefined, notes: e.notes || undefined,
      })));
    }
  }, [user]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image or PDF of your receipt');
      return;
    }
    setUploading(true);
    toast.info('Scanning receipt with AI…');
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => { resolve((reader.result as string).split(',')[1]); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const { data, error } = await supabase.functions.invoke('parse-receipt', {
        body: { imageBase64: base64, mimeType: file.type },
      });
      if (error) throw error;
      if (data?.success && data.data) {
        const parsed = data.data;
        setNewExp({ title: parsed.title || '', amount: parsed.amount?.toString() || '', category: parsed.category || 'Other', vendor: parsed.vendor || '', project: '', notes: parsed.notes || '' });
        setShowAdd(true);
        toast.success('Receipt scanned! Review and confirm the details below.');
      } else {
        toast.error(data?.error || 'Could not read receipt');
      }
    } catch (err) {
      console.error('Receipt upload error:', err);
      toast.error('Failed to process receipt. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addExpense = async () => {
    if (!newExp.title.trim() || !newExp.amount || !user) return;
    const catColor = CATEGORY_COLORS[newExp.category] || '#94a3b8';
    const { data, error } = await supabase.from('expenses').insert({
      user_id: user.id, title: newExp.title, amount: parseFloat(newExp.amount) || 0,
      category: newExp.category, category_color: catColor, vendor: newExp.vendor || 'Unknown',
      project: newExp.project || '', notes: newExp.notes || '', status: 'pending',
    } as any).select().single();

    if (error) { toast.error('Failed to add expense'); return; }

    const exp: Expense = {
      id: data.id, title: newExp.title, amount: parseFloat(newExp.amount) || 0,
      currency: '£', category: newExp.category, categoryColor: catColor,
      vendor: newExp.vendor || 'Unknown', date: new Date().toISOString().split('T')[0],
      status: 'pending', receipt: false, project: newExp.project || undefined, notes: newExp.notes || undefined,
    };
    setExpenses(prev => [exp, ...prev]);
    setNewExp({ title: '', amount: '', category: 'Other', vendor: '', project: '', notes: '' });
    setShowAdd(false);
    toast.success('Expense added');
  };

  const deleteExpense = async (id: string) => {
    await supabase.from('expenses').delete().eq('id', id);
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const updateStatus = async (id: string, status: ExpenseStatus) => {
    await supabase.from('expenses').update({ status } as any).eq('id', id);
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status } : e));
  };

  const filtered = expenses.filter(e => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.vendor.toLowerCase().includes(search.toLowerCase())) return false;
    if (activeTab === 'pending') return e.status === 'pending';
    if (activeTab === 'approved') return e.status === 'approved' || e.status === 'reimbursed';
    return true;
  });

  const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
  const totalReimbursed = expenses.filter(e => e.status === 'reimbursed').reduce((s, e) => s + e.amount, 0);

  const categorySums = expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>);
  const CATEGORIES_PIE = Object.entries(categorySums).map(([name, value]) => ({ name, value, color: CATEGORY_COLORS[name] || '#94a3b8' }));
  const MONTHLY_DATA = [{ month: 'Current', amount: expenses.reduce((s, e) => s + e.amount, 0) }];

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-x-hidden overflow-y-hidden">
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3 overflow-hidden">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40 shrink-0" />
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
          <Receipt className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight whitespace-nowrap">Expense Manager</span>
        <div className="flex-1 min-w-0" />
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleReceiptUpload} />
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-xs shrink-0" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{uploading ? 'Scanning…' : 'Upload Receipt'}</span>
        </Button>
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0 shadow-sm shrink-0" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">New Expense</span>
        </Button>
      </header>

      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            {[
              { label: 'This Month', value: `£${(totalPending + totalApproved + totalReimbursed).toLocaleString()}`, icon: Wallet, color: '#10b981' },
              { label: 'Pending', value: `£${totalPending.toLocaleString()}`, sub: `${expenses.filter(e => e.status === 'pending').length} expenses`, icon: Clock, color: '#f59e0b' },
              { label: 'Approved', value: `£${totalApproved.toLocaleString()}`, sub: 'Ready to reimburse', icon: CheckCircle2, color: '#10b981' },
              { label: 'Reimbursed', value: `£${totalReimbursed.toLocaleString()}`, sub: 'Completed', icon: CreditCard, color: '#6366f1' },
            ].map((card, i) => (
              <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="relative group p-3 sm:p-5 rounded-2xl bg-card/60 border border-border/20 overflow-hidden">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${card.color}15` }}>
                  <card.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={{ color: card.color }} />
                </div>
                <div className="text-base sm:text-[22px] font-bold text-foreground tracking-tight">{card.value}</div>
                <div className="text-[9px] sm:text-[10px] text-muted-foreground/50 mt-0.5">{card.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="lg:col-span-2 rounded-2xl bg-card/60 border border-border/20 p-3 sm:p-5">
              <h3 className="text-[13px] font-bold text-foreground mb-1">Monthly Spending Trend</h3>
              <p className="text-[10px] text-muted-foreground/50 mb-4">Current overview</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={MONTHLY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `£${v / 1000}k`} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl bg-card/60 border border-border/20 p-3 sm:p-5">
              <h3 className="text-[13px] font-bold text-foreground mb-1">By Category</h3>
              <p className="text-[10px] text-muted-foreground/50 mb-3">Expense distribution</p>
              {CATEGORIES_PIE.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={140}>
                    <RPieChart>
                      <Pie data={CATEGORIES_PIE} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                        {CATEGORIES_PIE.map(entry => <Cell key={entry.name} fill={entry.color} stroke="none" />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
                    </RPieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1 mt-2">
                    {CATEGORIES_PIE.map(c => (
                      <div key={c.name} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-sm" style={{ background: c.color }} />
                        <span className="text-[10px] text-muted-foreground flex-1">{c.name}</span>
                        <span className="text-[10px] font-semibold text-foreground">£{c.value.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-[11px] text-muted-foreground/40 text-center py-6">No expenses yet</p>
              )}
            </motion.div>
          </div>

          {/* Tabs & Expense Table */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-0.5 bg-muted/40 rounded-xl p-0.5 border border-border/20">
                {([
                  { id: 'all' as TabId, label: 'All Expenses' },
                  { id: 'pending' as TabId, label: 'Pending' },
                  { id: 'approved' as TabId, label: 'Approved' },
                  { id: 'reports' as TabId, label: 'Reports' },
                ]).map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={cn("px-3 py-2 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap",
                      activeTab === tab.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                    )}>{tab.label}</button>
                ))}
              </div>
              <div className="flex-1" />
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses…" className="h-8 pl-7 text-[11px] bg-card/50 border-border/20 rounded-xl w-full" />
              </div>
            </div>

            <AnimatePresence>
              {showAdd && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 p-3 sm:p-5 rounded-2xl bg-card/50 border border-border/20 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input value={newExp.title} onChange={e => setNewExp(p => ({ ...p, title: e.target.value }))} placeholder="Expense title" className="h-10 rounded-xl text-sm" />
                    <Input value={newExp.amount} onChange={e => setNewExp(p => ({ ...p, amount: e.target.value }))} placeholder="Amount (£)" type="number" className="h-10 rounded-xl text-sm" />
                    <Input value={newExp.vendor} onChange={e => setNewExp(p => ({ ...p, vendor: e.target.value }))} placeholder="Vendor" className="h-10 rounded-xl text-sm" />
                    <select value={newExp.category} onChange={e => setNewExp(p => ({ ...p, category: e.target.value }))} className="h-10 rounded-xl text-sm bg-background border border-border px-3">
                      {['Travel', 'Software', 'Meals', 'Office', 'Marketing', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <Input value={newExp.project} onChange={e => setNewExp(p => ({ ...p, project: e.target.value }))} placeholder="Project (optional)" className="h-10 rounded-xl text-sm" />
                    <Input value={newExp.notes} onChange={e => setNewExp(p => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className="h-10 rounded-xl text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="h-8 rounded-xl text-xs" onClick={addExpense}><Check className="h-3 w-3 mr-1" /> Add Expense</Button>
                    <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs" onClick={() => setShowAdd(false)}>Cancel</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="rounded-2xl border border-border/20 bg-card/40 overflow-hidden">
              <div className="hidden sm:grid grid-cols-[1fr_100px_120px_100px_100px_120px] gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/20">
                {['Expense', 'Amount', 'Category', 'Date', 'Status', 'Actions'].map(h => (
                  <span key={h} className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">{h}</span>
                ))}
              </div>
              <div className="sm:hidden flex items-center gap-3 px-3 py-2.5 bg-muted/30 border-b border-border/20">
                {['Expense', 'Amount', 'Category', 'Date'].map(h => (
                  <span key={h} className={cn("text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider", h === 'Expense' ? 'flex-1' : 'shrink-0')}>{h}</span>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Receipt className="h-10 w-10 text-muted-foreground/15 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground/40">No expenses yet</p>
                  <p className="text-xs text-muted-foreground/30 mt-1">Click "New Expense" to add your first entry</p>
                </div>
              ) : (
              <div className="divide-y divide-border/10">
                {filtered.map((exp, i) => {
                  const sc = STATUS_CONFIG[exp.status];
                  return (
                    <motion.div key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                      <div className="hidden sm:grid grid-cols-[1fr_100px_120px_100px_100px_120px] gap-2 px-4 py-3 hover:bg-accent/30 transition-colors group items-center">
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-foreground truncate">{exp.title}</div>
                          <div className="text-[9px] text-muted-foreground/40 truncate">{exp.vendor}{exp.project && ` · ${exp.project}`}</div>
                        </div>
                        <div className="text-[12px] font-bold text-foreground">{exp.currency}{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        <div className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full" style={{ background: exp.categoryColor }} />
                          <span className="text-[10px] text-muted-foreground">{exp.category}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground/60">{new Date(exp.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        <div className={cn("flex items-center gap-1 px-2 py-0.5 rounded-md w-fit text-[9px] font-semibold", sc.bg, sc.color)}>
                          <sc.icon className="h-2.5 w-2.5" />{sc.label}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {exp.status === 'pending' && <button onClick={() => updateStatus(exp.id, 'approved')} className="h-6 px-2 rounded-md hover:bg-emerald-500/10 text-[9px] text-emerald-600 font-medium">Approve</button>}
                          {exp.status === 'approved' && <button onClick={() => updateStatus(exp.id, 'reimbursed')} className="h-6 px-2 rounded-md hover:bg-blue-500/10 text-[9px] text-blue-600 font-medium">Reimburse</button>}
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => deleteExpense(exp.id)}><Trash2 className="h-3 w-3 text-muted-foreground" /></Button>
                        </div>
                      </div>
                      <div className="sm:hidden px-3 py-3 active:bg-accent/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold text-foreground truncate">{exp.title}</div>
                            <div className="text-[9px] text-muted-foreground/40 truncate">{exp.vendor}</div>
                          </div>
                          <div className="text-[11px] font-bold text-foreground shrink-0">{exp.currency}{exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                          <div className="flex items-center gap-1 shrink-0">
                            <div className="h-2 w-2 rounded-full" style={{ background: exp.categoryColor }} />
                            <span className="text-[9px] text-muted-foreground">{exp.category}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground/60 shrink-0">{new Date(exp.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className={cn("flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-semibold", sc.bg, sc.color)}>
                            <sc.icon className="h-2 w-2" />{sc.label}
                          </div>
                          <div className="flex-1" />
                          {exp.status === 'pending' && <button onClick={() => updateStatus(exp.id, 'approved')} className="text-[9px] text-emerald-600 font-medium px-2 py-1 rounded-md active:bg-emerald-500/10">Approve</button>}
                          {exp.status === 'approved' && <button onClick={() => updateStatus(exp.id, 'reimbursed')} className="text-[9px] text-blue-600 font-medium px-2 py-1 rounded-md active:bg-blue-500/10">Reimburse</button>}
                          <button onClick={() => deleteExpense(exp.id)} className="h-7 w-7 rounded-md flex items-center justify-center active:bg-accent"><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
