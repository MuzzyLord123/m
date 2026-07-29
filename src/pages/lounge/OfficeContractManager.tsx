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
  sent: { label: 'Sent', color: 'text-attend', bg: 'bg-attend/10', icon: Send },
  negotiating: { label: 'Negotiating', color: 'text-attend', bg: 'bg-attend/10', icon: RefreshCw },
  signed: { label: 'Signed', color: 'text-ok', bg: 'bg-ok/10', icon: CheckCircle2 },
  active: { label: 'Active', color: 'text-ok', bg: 'bg-ok/10', icon: Shield },
  expiring: { label: 'Expiring soon', color: 'text-attend', bg: 'bg-attend/10', icon: AlertCircle },
  expired: { label: 'Expired', color: 'text-risk', bg: 'bg-risk/10', icon: XCircle },
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
      <header className="shrink-0 h-[52px] border-b border-border/60 bg-background flex items-center px-3 sm:px-5 gap-2 sm:gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-lg text-xs shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Office</span>
        </Button>
        <div className="h-4 w-px bg-border/60" />
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Contract manager</span>
        <div className="flex-1" />
        <Button size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" /> New contract</Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-5 sm:space-y-6">
          {/* Position ledger */}
          <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
            <div className="grid grid-cols-1 gap-px bg-border/60 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Active contract value', value: `£${(totalValue / 1000).toFixed(0)}k` },
                { label: 'Total contracts', value: `${contracts.length}` },
                { label: 'Awaiting signature', value: `${pendingCount}` },
                { label: 'Expiring soon', value: `${expiringCount}` },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between gap-3 bg-card px-4 py-3">
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.13em] text-muted-foreground">{s.label}</span>
                  <span className="font-mono text-[15px] font-medium tabular-nums text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Value Trend */}
          <div
            className="rounded-[10px] bg-card border border-border/60 p-4">
            <h3 className="text-[13px] font-[550] tracking-[-0.01em] text-foreground mb-1">Contract value trend</h3>
            <p className="text-[10px] text-muted-foreground mb-4">Total active contract value over time</p>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={VALUE_TREND}>
                <defs>
                  <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `£${v / 1000}k`} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '10px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#gradValue)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Filter + Search */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-sunken p-0.5 scrollbar-none">
              {([
                { id: 'all' as FilterTab, label: 'All' },
                { id: 'active' as FilterTab, label: 'Active' },
                { id: 'pending' as FilterTab, label: 'Pending' },
                { id: 'expiring' as FilterTab, label: 'Expiring' },
                { id: 'archived' as FilterTab, label: 'Archived' },
              ]).map(t => (
                <button key={t.id} onClick={() => setFilterTab(t.id)}
                  className={cn("px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors duration-150",
                    filterTab === t.id ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}>{t.label}</button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contracts…" className="h-8 pl-7 text-[11px] bg-card border-border/60 rounded-lg w-full" />
            </div>
          </div>

          {/* Add Form */}
          {showAdd && (
            <div className="p-5 rounded-[10px] bg-card border border-border/60 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input value={newContract.title} onChange={e => setNewContract(p => ({ ...p, title: e.target.value }))} placeholder="Contract title" className="h-10 rounded-lg text-sm" />
                <Input value={newContract.client} onChange={e => setNewContract(p => ({ ...p, client: e.target.value }))} placeholder="Client name" className="h-10 rounded-lg text-sm" />
                <select value={newContract.type} onChange={e => setNewContract(p => ({ ...p, type: e.target.value }))} className="h-10 rounded-lg text-sm bg-background border border-border px-3">
                  {['Service Agreement', 'SaaS License', 'NDA', 'Project Contract', 'Support Agreement', 'Retainer', 'DPA', 'Lease'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <Input value={newContract.value} onChange={e => setNewContract(p => ({ ...p, value: e.target.value }))} placeholder="Value (£)" type="number" className="h-10 rounded-lg text-sm" />
                <Input value={newContract.startDate} onChange={e => setNewContract(p => ({ ...p, startDate: e.target.value }))} type="date" className="h-10 rounded-lg text-sm" />
                <Input value={newContract.endDate} onChange={e => setNewContract(p => ({ ...p, endDate: e.target.value }))} type="date" className="h-10 rounded-lg text-sm" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-8 rounded-lg text-xs" onClick={addContract}><CheckCircle2 className="h-3 w-3 mr-1" /> Create</Button>
                <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Contract Cards */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileSignature className="h-10 w-10 text-muted-foreground/15 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No contracts yet</p>
              <p className="text-xs text-muted-foreground mt-1">Choose "New contract" to create your first one</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {filtered.map((contract, i) => {
              const sc = STATUS_CONFIG[contract.status];
              const daysLeft = contract.endDate ? Math.max(0, Math.floor((new Date(contract.endDate).getTime() - Date.now()) / 86400000)) : null;
              return (
                <div key={contract.id}
                  className="group rounded-[10px] border border-border/60 bg-card p-4 transition-colors duration-150 hover:border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate text-[13px] font-[550] text-foreground">{contract.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground">{contract.client}</span>
                        <span className="text-[9px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{contract.type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("flex items-center gap-1 text-[10px]", sc.color)}>
                        <sc.icon className="h-2.5 w-2.5" />{sc.label}
                      </div>
                      <button onClick={() => deleteContract(contract.id)} className="h-7 w-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-risk/10 transition-colors duration-150">
                        <Trash2 className="h-3 w-3 text-muted-foreground" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    {contract.value > 0 && (
                      <div>
                        <div className="font-mono text-[15px] font-medium tabular-nums text-foreground">£{contract.value.toLocaleString()}</div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">Contract value</div>
                      </div>
                    )}
                    {daysLeft !== null && contract.status !== 'expired' && contract.status !== 'cancelled' && (
                      <div>
                        <div className={cn("font-mono text-[15px] font-medium tabular-nums", daysLeft < 30 ? 'text-attend' : 'text-foreground')}>{daysLeft}</div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground">Days left</div>
                      </div>
                    )}
                  </div>

                  {/* Status actions */}
                  <div className="flex items-center gap-1.5 mb-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {contract.status === 'draft' && <button onClick={() => updateContractStatus(contract.id, 'sent')} className="rounded-md px-2 py-1 text-[9.5px] font-medium text-foreground hover:bg-foreground/[0.05]">Send</button>}
                    {contract.status === 'sent' && <button onClick={() => updateContractStatus(contract.id, 'signed')} className="text-[9px] px-2 py-1 rounded-md bg-ok/10 text-ok font-medium hover:bg-ok/20">Mark signed</button>}
                    {contract.status === 'signed' && <button onClick={() => updateContractStatus(contract.id, 'active')} className="text-[9px] px-2 py-1 rounded-md bg-ok/10 text-ok font-medium hover:bg-ok/20">Activate</button>}
                    {(contract.status === 'active' || contract.status === 'expiring') && <button onClick={() => updateContractStatus(contract.id, 'expired')} className="text-[9px] px-2 py-1 rounded-md bg-risk/10 text-risk font-medium hover:bg-risk/20">Expire</button>}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {contract.tags.map(t => (
                        <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-md bg-muted/50 text-muted-foreground font-medium">{t}</span>
                      ))}
                    </div>
                    <span className="text-[9px] text-muted-foreground">{contract.lastActivity}</span>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
