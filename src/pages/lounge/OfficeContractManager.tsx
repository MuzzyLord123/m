import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileSignature, Plus, Search, Filter, Download, Trash2,
  Calendar, Users, Building2, AlertCircle, CheckCircle2, Clock,
  Eye, Edit3, MoreHorizontal, Send, Shield, Lock, Unlock,
  ArrowUpRight, TrendingUp, FileText, Hash, Tag, RefreshCw,
  XCircle, Archive, Copy, ExternalLink, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ContractStatus = 'draft' | 'sent' | 'negotiating' | 'signed' | 'active' | 'expiring' | 'expired' | 'cancelled';

interface Contract {
  id: string;
  title: string;
  client: string;
  type: string;
  value: number;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  signers: { name: string; signed: boolean }[];
  lastActivity: string;
  tags: string[];
}

const STATUS_CONFIG: Record<ContractStatus, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: 'Draft', color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Edit3 },
  sent: { label: 'Sent', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: Send },
  negotiating: { label: 'Negotiating', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: RefreshCw },
  signed: { label: 'Signed', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  active: { label: 'Active', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: Shield },
  expiring: { label: 'Expiring Soon', color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertCircle },
  expired: { label: 'Expired', color: 'text-red-500', bg: 'bg-red-500/10', icon: XCircle },
  cancelled: { label: 'Cancelled', color: 'text-muted-foreground', bg: 'bg-muted/30', icon: Archive },
};

type FilterTab = 'all' | 'active' | 'pending' | 'expiring' | 'archived';

const VALUE_TREND = [{ month: 'Current', value: 0 }];

export default function OfficeContractManager() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newContract, setNewContract] = useState({ title: '', client: '', type: 'Service Agreement', value: '', startDate: '', endDate: '' });

  const addContract = () => {
    if (!newContract.title.trim() || !newContract.client.trim()) return;
    const c: Contract = {
      id: Date.now().toString(), title: newContract.title, client: newContract.client,
      type: newContract.type, value: parseFloat(newContract.value) || 0, status: 'draft',
      startDate: newContract.startDate, endDate: newContract.endDate, signers: [],
      lastActivity: 'Just now', tags: [],
    };
    setContracts(prev => [c, ...prev]);
    setNewContract({ title: '', client: '', type: 'Service Agreement', value: '', startDate: '', endDate: '' });
    setShowAdd(false);
  };

  const deleteContract = (id: string) => { setContracts(prev => prev.filter(c => c.id !== id)); };
  const updateContractStatus = (id: string, status: ContractStatus) => { setContracts(prev => prev.map(c => c.id === id ? { ...c, status } : c)); };

  const filtered = contracts.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.client.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTab === 'active') return c.status === 'active' || c.status === 'signed';
    if (filterTab === 'pending') return c.status === 'draft' || c.status === 'sent' || c.status === 'negotiating';
    if (filterTab === 'expiring') return c.status === 'expiring';
    if (filterTab === 'archived') return c.status === 'expired' || c.status === 'cancelled';
    return true;
  });

  const totalValue = contracts.filter(c => c.status === 'active' || c.status === 'signed').reduce((s, c) => s + c.value, 0);
  const pendingCount = contracts.filter(c => ['draft', 'sent', 'negotiating'].includes(c.status)).length;
  const expiringCount = contracts.filter(c => c.status === 'expiring').length;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
          <FileSignature className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold tracking-tight">Contract Manager</span>
        <div className="flex-1" />
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs bg-gradient-to-r from-violet-500 to-purple-700 text-white border-0 shadow-sm" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" /> New Contract</Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Active Contract Value', value: `£${(totalValue / 1000).toFixed(0)}k`, icon: Shield, color: '#8b5cf6' },
              { label: 'Total Contracts', value: `${contracts.length}`, icon: FileSignature, color: '#06b6d4' },
              { label: 'Awaiting Signature', value: `${pendingCount}`, icon: Clock, color: '#f59e0b' },
              { label: 'Expiring Soon', value: `${expiringCount}`, icon: AlertCircle, color: '#ef4444' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="p-5 rounded-2xl bg-card/60 border border-border/20 hover:border-border/40 transition-all">
                <div className="h-8 w-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}15` }}>
                  <s.icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <div className="text-[22px] font-bold text-foreground tracking-tight">{s.value}</div>
                <div className="text-[10px] text-muted-foreground/50 mt-0.5">{s.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Value Trend */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl bg-card/60 border border-border/20 p-5">
            <h3 className="text-[13px] font-bold text-foreground mb-1">Contract Value Trend</h3>
            <p className="text-[10px] text-muted-foreground/50 mb-4">Total active contract value over time</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={VALUE_TREND}>
                <defs>
                  <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `£${v / 1000}k`} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="url(#gradValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Filter + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-0.5 bg-muted/40 rounded-xl p-0.5 border border-border/20 overflow-x-auto scrollbar-none">
              {([
                { id: 'all' as FilterTab, label: 'All' },
                { id: 'active' as FilterTab, label: 'Active' },
                { id: 'pending' as FilterTab, label: 'Pending' },
                { id: 'expiring' as FilterTab, label: 'Expiring' },
                { id: 'archived' as FilterTab, label: 'Archived' },
              ]).map(t => (
                <button key={t.id} onClick={() => setFilterTab(t.id)}
                  className={cn("px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all",
                    filterTab === t.id ? "bg-card shadow-sm text-foreground" : "text-muted-foreground/60 hover:text-foreground"
                  )}>{t.label}</button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/40" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contracts…" className="h-8 pl-7 text-[11px] bg-card/50 border-border/20 rounded-xl w-full" />
            </div>
          </div>

          {/* Add Form */}
          {showAdd && (
            <div className="p-5 rounded-2xl bg-card/50 border border-border/20 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input value={newContract.title} onChange={e => setNewContract(p => ({ ...p, title: e.target.value }))} placeholder="Contract title" className="h-10 rounded-xl text-sm" />
                <Input value={newContract.client} onChange={e => setNewContract(p => ({ ...p, client: e.target.value }))} placeholder="Client name" className="h-10 rounded-xl text-sm" />
                <select value={newContract.type} onChange={e => setNewContract(p => ({ ...p, type: e.target.value }))} className="h-10 rounded-xl text-sm bg-background border border-border px-3">
                  {['Service Agreement', 'SaaS License', 'NDA', 'Project Contract', 'Support Agreement', 'Retainer', 'DPA', 'Lease'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <Input value={newContract.value} onChange={e => setNewContract(p => ({ ...p, value: e.target.value }))} placeholder="Value (£)" type="number" className="h-10 rounded-xl text-sm" />
                <Input value={newContract.startDate} onChange={e => setNewContract(p => ({ ...p, startDate: e.target.value }))} type="date" className="h-10 rounded-xl text-sm" />
                <Input value={newContract.endDate} onChange={e => setNewContract(p => ({ ...p, endDate: e.target.value }))} type="date" className="h-10 rounded-xl text-sm" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 rounded-xl text-xs" onClick={addContract}><CheckCircle2 className="h-3 w-3 mr-1" /> Create</Button>
                <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Contract Cards */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileSignature className="h-10 w-10 text-muted-foreground/15 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground/40">No contracts yet</p>
              <p className="text-xs text-muted-foreground/30 mt-1">Click "New Contract" to create your first one</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map((contract, i) => {
              const sc = STATUS_CONFIG[contract.status];
              const daysLeft = contract.endDate ? Math.max(0, Math.floor((new Date(contract.endDate).getTime() - Date.now()) / 86400000)) : null;
              return (
                <motion.div key={contract.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="group rounded-2xl bg-card/60 border border-border/20 hover:border-border/40 hover:shadow-xl transition-all p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-bold text-foreground truncate">{contract.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-[10px] text-muted-foreground/60">{contract.client}</span>
                        <span className="text-[9px] text-muted-foreground/30">·</span>
                        <span className="text-[10px] text-muted-foreground/40">{contract.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold", sc.bg, sc.color)}>
                        <sc.icon className="h-2.5 w-2.5" />{sc.label}
                      </div>
                      <button onClick={() => deleteContract(contract.id)} className="h-7 w-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all">
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    {contract.value > 0 && (
                      <div>
                        <div className="text-[16px] font-bold text-foreground">£{contract.value.toLocaleString()}</div>
                        <div className="text-[9px] text-muted-foreground/40">Contract Value</div>
                      </div>
                    )}
                    {daysLeft !== null && contract.status !== 'expired' && contract.status !== 'cancelled' && (
                      <div>
                        <div className={cn("text-[16px] font-bold", daysLeft < 30 ? 'text-orange-500' : 'text-foreground')}>{daysLeft}</div>
                        <div className="text-[9px] text-muted-foreground/40">Days left</div>
                      </div>
                    )}
                  </div>

                  {/* Status actions */}
                  <div className="flex items-center gap-1.5 mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {contract.status === 'draft' && <button onClick={() => updateContractStatus(contract.id, 'sent')} className="text-[9px] px-2 py-1 rounded-md bg-blue-500/10 text-blue-600 font-medium hover:bg-blue-500/20">Send</button>}
                    {contract.status === 'sent' && <button onClick={() => updateContractStatus(contract.id, 'signed')} className="text-[9px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-medium hover:bg-emerald-500/20">Mark Signed</button>}
                    {contract.status === 'signed' && <button onClick={() => updateContractStatus(contract.id, 'active')} className="text-[9px] px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-medium hover:bg-emerald-500/20">Activate</button>}
                    {(contract.status === 'active' || contract.status === 'expiring') && <button onClick={() => updateContractStatus(contract.id, 'expired')} className="text-[9px] px-2 py-1 rounded-md bg-red-500/10 text-red-600 font-medium hover:bg-red-500/20">Expire</button>}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {contract.tags.map(t => (
                        <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground/50 font-medium">{t}</span>
                      ))}
                    </div>
                    <span className="text-[9px] text-muted-foreground/35">{contract.lastActivity}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
