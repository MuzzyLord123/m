import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Package, AlertTriangle, TrendingUp, DollarSign, MapPin,
  ClipboardList, BarChart3, RefreshCw, Boxes, ArrowLeft,
  Search, Plus, X, Edit3, Trash2, Check, Loader2,
  Shuffle, Clock, Hash, SlidersHorizontal, Minus,
  Copy, MoreHorizontal, Pencil, FolderOpen,
  LayoutGrid, List, ArrowUpDown, Building2, ChevronLeft,
} from 'lucide-react';
import { SubscriptionPaywall } from '@/components/lounge/SubscriptionPaywall';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { InventorySplash } from '@/components/splash/InventorySplash';
import { ExitSplash } from '@/components/splash/ExitSplash';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

/* ─── Types ─── */
interface Company {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  address: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  product_count?: number;
  total_value?: number;
  low_stock_count?: number;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  category_id?: string | null;
  company_id?: string | null;
  unit: string;
  reorder_level: number;
  reorder_qty: number;
  cost_price: number;
  selling_price: number;
  supplier_name?: string | null;
  supplier_contact?: string | null;
  lead_time_days?: number | null;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  totalQty?: number;
  category_name?: string | null;
}

interface Category { id: string; name: string; }
interface Location { id: string; name: string; is_default: boolean; address?: string | null; }

interface StockMovement {
  id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  reason?: string | null;
  notes?: string | null;
  created_at: string;
  inv_products?: { name: string; sku: string } | null;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'updated' | 'created' | 'name';

const STOCK_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ok: { label: 'In Stock', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  low: { label: 'Low Stock', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  zero: { label: 'Out of Stock', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const UNITS = ['pieces', 'kg', 'g', 'liters', 'ml', 'boxes', 'pairs', 'sets', 'meters', 'feet'];

function generateSKU(): string {
  return 'SKU-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

function getStockStatus(totalQty: number, reorderLevel: number): string {
  if (totalQty === 0) return 'zero';
  if (totalQty <= reorderLevel) return 'low';
  return 'ok';
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT — Dashboard + Full-screen
   ═══════════════════════════════════════════════════════ */
function LoungeInventoryInner() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Which company is open (null = dashboard view)
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [showExitSplash, setShowExitSplash] = useState(false);
  const [pendingCompanyId, setPendingCompanyId] = useState<string | null>(null);

  const handleOpenCompany = useCallback((id: string) => {
    setPendingCompanyId(id);
    setShowSplash(true);
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
    setActiveCompanyId(pendingCompanyId);
    setPendingCompanyId(null);
  }, [pendingCompanyId]);

  const handleCloseCompany = useCallback(() => {
    setShowExitSplash(true);
  }, []);

  if (showExitSplash) {
    return <ExitSplash moduleName="Inventory" onComplete={() => { setShowExitSplash(false); setActiveCompanyId(null); }} />;
  }

  if (showSplash) {
    return <InventorySplash onComplete={handleSplashComplete} />;
  }

  if (activeCompanyId) {
    return (
      <InventoryFullScreen
        companyId={activeCompanyId}
        userId={user?.id || ''}
        onBack={handleCloseCompany}
      />
    );
  }

  return (
    <InventoryDashboard
      userId={user?.id || ''}
      onOpenCompany={handleOpenCompany}
    />
  );
}

/* ═══════════════════════════════════════════════════════
   DASHBOARD VIEW — Company cards (like website designer)
   ═══════════════════════════════════════════════════════ */
function InventoryDashboard({ userId, onOpenCompany }: { userId: string; onOpenCompany: (id: string) => void }) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [creating, setCreating] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const loadCompanies = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    // Load companies
    const { data: comps } = await supabase
      .from('inv_companies')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (comps) {
      // Load product stats per company
      const { data: prods } = await supabase
        .from('inv_products')
        .select('id, company_id, cost_price, reorder_level, inv_stock_levels(quantity)')
        .eq('user_id', userId)
        .eq('is_active', true);

      const enriched = (comps as any[]).map(c => {
        const companyProds = (prods || []).filter((p: any) => p.company_id === c.id);
        let totalValue = 0;
        let lowStockCount = 0;
        companyProds.forEach((p: any) => {
          const qty = (p.inv_stock_levels || []).reduce((s: number, l: any) => s + (l.quantity || 0), 0);
          totalValue += (p.cost_price || 0) * qty;
          if (qty <= p.reorder_level) lowStockCount++;
        });
        return { ...c, product_count: companyProds.length, total_value: totalValue, low_stock_count: lowStockCount };
      });
      setCompanies(enriched);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => { loadCompanies(); }, [loadCompanies]);

  const handleCreate = async () => {
    if (!newName.trim() || !userId) return;
    setCreating(true);
    const { data, error } = await supabase
      .from('inv_companies')
      .insert({ user_id: userId, name: newName.trim(), description: newDesc.trim() || null, address: newAddress.trim() || null })
      .select()
      .single();
    setCreating(false);
    if (!error && data) {
      setShowNewDialog(false);
      setNewName('');
      setNewDesc('');
      setNewAddress('');
      toast.success(`"${newName.trim()}" created`);
      loadCompanies();
    } else {
      toast.error('Failed to create company');
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('inv_companies').delete().eq('id', id);
    if (!error) {
      setCompanies(prev => prev.filter(c => c.id !== id));
      toast.success('Company deleted');
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    const ids = companies.map(c => c.id);
    const { error } = await supabase.from('inv_companies').delete().in('id', ids);
    if (!error) {
      setCompanies([]);
      toast.success('All companies deleted');
    }
    setDeletingAll(false);
    setShowDeleteAllDialog(false);
  };

  const sorted = [...companies].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const filtered = sorted.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-[80vh] p-4 md:p-6 lg:p-8 space-y-6">
      <LoungePageHeader
        title="Inventory Dashboard"
        description={`${companies.length} ${companies.length === 1 ? 'company' : 'companies'}`}
        icon={Package}
        badge="Pro"
        actions={
          <Button
            onClick={() => setShowNewDialog(true)}
            size="sm"
            className="text-xs h-8 px-4"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> New Company
          </Button>
        }
      />

      {/* ─── Controls ─── */}
      {companies.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]" />
              <input
                type="text"
                placeholder="Search companies…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#555] focus:outline-none focus:border-[#444] transition-colors"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAllDialog(true)}
              className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-xs h-8 px-3"
            >
              <Trash2 className="w-3 h-3 mr-1.5" /> Delete All
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-md overflow-hidden">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-[#555] hover:text-[#888]'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-[#555] hover:text-[#888]'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-[#777] hover:text-white bg-[#1a1a1a] border border-[#2a2a2a] rounded-md transition-colors">
                  <ArrowUpDown className="w-3 h-3" />
                  <span className="hidden sm:inline">{sortBy === 'updated' ? 'Last edited' : sortBy === 'created' ? 'Date created' : 'Name'}</span>
                  <span className="sm:hidden">Sort</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] min-w-[140px]">
                <DropdownMenuItem onClick={() => setSortBy('updated')} className="text-white/80 text-xs focus:bg-white/5 focus:text-white">Last edited</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('created')} className="text-white/80 text-xs focus:bg-white/5 focus:text-white">Date created</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')} className="text-white/80 text-xs focus:bg-white/5 focus:text-white">Name</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* ─── Company Cards ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-[#333] border-t-white/70 rounded-full animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
            <FolderOpen className="w-6 h-6 text-[#555]" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-white/80 text-sm font-medium">No companies yet</p>
            <p className="text-[#666] text-xs">Add a company to start managing inventory</p>
          </div>
          <Button onClick={() => setShowNewDialog(true)} className="bg-white text-black hover:bg-white/90 font-medium text-xs h-8 px-4">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Company
          </Button>
        </motion.div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#666] text-xs">No companies match "{searchQuery}"</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((company, i) => (
              <CompanyCard key={company.id} company={company} index={i} onOpen={() => onOpenCompany(company.id)} onDelete={() => handleDelete(company.id)} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-1">
          <AnimatePresence mode="popLayout">
            {filtered.map((company, i) => (
              <CompanyListItem key={company.id} company={company} index={i} onOpen={() => onOpenCompany(company.id)} onDelete={() => handleDelete(company.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ─── New Company Dialog ─── */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="bg-[#161616] border-[#2a2a2a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-base">New Company</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[#aaa] text-xs">Company Name *</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Warehouse London" autoFocus
                className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-[#555] text-sm h-9 focus:border-[#444]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#aaa] text-xs">Address</Label>
              <Input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="123 Main St, London"
                className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-[#555] text-sm h-9 focus:border-[#444]" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#aaa] text-xs">Description</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional description…" rows={2}
                className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-[#555] text-sm focus:border-[#444] resize-none" />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setShowNewDialog(false)} className="text-[#888] hover:text-white hover:bg-white/5 text-xs">Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="bg-white text-black hover:bg-white/90 font-medium text-xs h-9 px-5">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
              Create Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete All Dialog ─── */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="bg-[#161616] border-[#2a2a2a] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white text-base">Delete All Companies?</DialogTitle>
          </DialogHeader>
          <p className="text-[#888] text-xs">This will permanently delete all companies and their associated products. This action cannot be undone.</p>
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setShowDeleteAllDialog(false)} className="text-[#888] hover:text-white text-xs">Cancel</Button>
            <Button onClick={handleDeleteAll} disabled={deletingAll} variant="destructive" className="text-xs">
              {deletingAll ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />} Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Company Card (Grid) ─── */
function CompanyCard({ company, index, onOpen, onDelete }: { company: Company; index: number; onOpen: () => void; onDelete: () => void }) {
  const statusColor = (company.low_stock_count || 0) > 0 ? '#fbbf24' : '#34d399';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: index * 0.03, duration: 0.2 }}>
      <div className="group relative bg-[#141414] border border-[#222] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-all duration-200">
        {/* Thumbnail area */}
        <div className="relative aspect-[16/10] bg-[#0e0e0e] overflow-hidden">
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111] to-[#0a0a0a]">
            <div className="flex flex-col items-center gap-3">
              <Building2 className="w-8 h-8 text-white/10" />
              <div className="grid grid-cols-3 gap-1 opacity-20">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`${i < 3 ? 'w-8 h-5' : 'w-8 h-4'} bg-white/30 rounded-sm`} />
                ))}
              </div>
            </div>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2">
            <Button onClick={(e) => { e.stopPropagation(); onOpen(); }} className="bg-white text-black hover:bg-white/90 font-medium text-xs h-8 px-4 shadow-xl">
              <Pencil className="w-3 h-3 mr-1.5" /> View Inventory
            </Button>
          </div>

          {/* Stats overlay */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
            <Badge className="bg-black/50 backdrop-blur-sm text-white/70 border-white/10 text-[10px] font-normal px-2 py-0 h-5">
              {company.product_count || 0} SKUs
            </Badge>
            {(company.low_stock_count || 0) > 0 && (
              <Badge className="bg-amber-500/20 backdrop-blur-sm text-amber-400 border-amber-500/20 text-[10px] font-normal px-2 py-0 h-5">
                {company.low_stock_count} low
              </Badge>
            )}
          </div>

          {/* More menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <button className="w-7 h-7 rounded-md bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors">
                  <MoreHorizontal className="w-3.5 h-3.5 text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] min-w-[140px]">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onOpen(); }} className="text-white/80 text-xs focus:bg-white/5 focus:text-white">
                  <Pencil className="w-3 h-3 mr-2" /> Open
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 text-xs focus:bg-red-500/10 focus:text-red-400">
                  <Trash2 className="w-3 h-3 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-white text-[13px] font-medium truncate leading-tight">{company.name}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <button className="shrink-0 text-[#555] hover:text-[#999] transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] min-w-[140px]">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onOpen(); }} className="text-white/80 text-xs focus:bg-white/5 focus:text-white">
                  <Pencil className="w-3 h-3 mr-2" /> Open
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 text-xs focus:bg-red-500/10 focus:text-red-400">
                  <Trash2 className="w-3 h-3 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-[#555] text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(company.updated_at)}
            </span>
            {company.address && (
              <>
                <span className="text-[#444] text-[11px]">·</span>
                <span className="text-[#555] text-[11px] truncate">{company.address}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Company List Item ─── */
function CompanyListItem({ company, index, onOpen, onDelete }: { company: Company; index: number; onOpen: () => void; onDelete: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: index * 0.02 }}>
      <div onClick={onOpen} className="group flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-[#2a2a2a] cursor-pointer transition-all">
        <div className="w-10 h-10 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-[#333]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-medium truncate">{company.name}</p>
          <p className="text-[#555] text-[11px]">{company.product_count || 0} products · Edited {timeAgo(company.updated_at)}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onOpen(); }} className="h-7 px-2 text-[#888] hover:text-white hover:bg-white/5">
            <Pencil className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-7 px-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   FULL-SCREEN INVENTORY VIEW (3-pane, no sidebar)
   ═══════════════════════════════════════════════════════ */
function InventoryFullScreen({ companyId, userId, onBack }: { companyId: string; userId: string; onBack: () => void }) {
  const isMobile = useIsMobile();
  const [companyName, setCompanyName] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ multi_location_enabled: false, currency: 'GBP' });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('correction');
  const [adjusting, setAdjusting] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail' | 'activity'>('list');

  const [newForm, setNewForm] = useState({
    name: '', sku: generateSKU(), barcode: '', description: '',
    category_id: '', unit: 'pieces', reorder_level: 5, reorder_qty: 10,
    cost_price: 0, selling_price: 0, supplier_name: '', supplier_contact: '', lead_time_days: 0,
  });
  const [savingNew, setSavingNew] = useState(false);

  useEffect(() => {
    if (userId) { loadAll(); loadSettings(); }
  }, [userId, companyId]);

  const loadSettings = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase.from('inv_settings').select('*').eq('user_id', userId).maybeSingle();
    if (data) setSettings(data);
    else {
      await supabase.from('inv_settings').insert({ user_id: userId });
      const { data: loc } = await supabase.from('inv_locations').select('id').eq('user_id', userId).limit(1).maybeSingle();
      if (!loc) await supabase.from('inv_locations').insert({ user_id: userId, name: 'Main Warehouse', is_default: true, is_active: true });
    }
  }, [userId]);

  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [compRes, prodsRes, catsRes, locsRes, movsRes] = await Promise.all([
      supabase.from('inv_companies').select('name').eq('id', companyId).single(),
      supabase.from('inv_products').select('*, inv_categories(name), inv_stock_levels(quantity)').eq('user_id', userId).eq('company_id', companyId).eq('is_active', true).order('name'),
      supabase.from('inv_categories').select('*').eq('user_id', userId).order('name'),
      supabase.from('inv_locations').select('*').eq('user_id', userId).eq('is_active', true),
      supabase.from('inv_stock_movements').select('*, inv_products(name, sku)').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    ]);

    if (compRes.data) setCompanyName(compRes.data.name);
    if (prodsRes.data) {
      setProducts(prodsRes.data.map((p: any) => ({
        ...p,
        category_name: p.inv_categories?.name,
        totalQty: (p.inv_stock_levels || []).reduce((s: number, l: any) => s + (l.quantity || 0), 0),
      })));
    }
    setCategories(catsRes.data || []);
    setLocations(locsRes.data || []);
    setMovements((movsRes.data || []) as StockMovement[]);
    setLoading(false);
  }, [userId, companyId]);

  const selected = useMemo(() => products.find(p => p.id === selectedId) || null, [products, selectedId]);
  const selectedMovements = useMemo(() => selectedId ? movements.filter(m => m.product_id === selectedId) : [], [movements, selectedId]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (statusFilter) result = result.filter(p => getStockStatus(p.totalQty || 0, p.reorder_level) === statusFilter);
    if (categoryFilter) result = result.filter(p => p.category_id === categoryFilter);
    return result;
  }, [products, searchQuery, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    let totalValue = 0, lowStockCount = 0, zeroStockCount = 0;
    products.forEach(p => {
      const qty = p.totalQty || 0;
      totalValue += (p.cost_price || 0) * qty;
      if (qty === 0) zeroStockCount++;
      else if (qty <= p.reorder_level) lowStockCount++;
    });
    return { totalSkus: products.length, totalValue, lowStockCount, zeroStockCount };
  }, [products]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: settings.currency }).format(val);

  const deleteProduct = async (id: string) => {
    await supabase.from('inv_products').update({ is_active: false }).eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast.success('Product removed');
  };

  const saveEdit = async () => {
    if (!selectedId || !userId) return;
    setSaving(true);
    const { error } = await supabase.from('inv_products').update({
      name: editForm.name, sku: editForm.sku, description: editForm.description,
      cost_price: editForm.cost_price, selling_price: editForm.selling_price,
      reorder_level: editForm.reorder_level, reorder_qty: editForm.reorder_qty,
      supplier_name: editForm.supplier_name, supplier_contact: editForm.supplier_contact,
      unit: editForm.unit,
    }).eq('id', selectedId);
    setSaving(false);
    if (!error) { setEditing(false); toast.success('Product updated'); loadAll(); }
    else toast.error('Failed to save');
  };

  const addProduct = async () => {
    if (!userId || !newForm.name.trim() || !newForm.sku.trim()) return;
    setSavingNew(true);
    const { data: newProd, error } = await supabase.from('inv_products').insert({
      user_id: userId, company_id: companyId, name: newForm.name.trim(), sku: newForm.sku.trim(),
      barcode: newForm.barcode || null, description: newForm.description || null,
      category_id: newForm.category_id || null, unit: newForm.unit,
      reorder_level: newForm.reorder_level, reorder_qty: newForm.reorder_qty,
      cost_price: newForm.cost_price, selling_price: newForm.selling_price,
      supplier_name: newForm.supplier_name || null, supplier_contact: newForm.supplier_contact || null,
      lead_time_days: newForm.lead_time_days || null,
    }).select().single();
    if (newProd) {
      const defLoc = locations.find(l => l.is_default) || locations[0];
      if (defLoc) await supabase.from('inv_stock_levels').insert({ product_id: newProd.id, location_id: defLoc.id, quantity: 0 });
    }
    setSavingNew(false);
    if (!error) {
      setShowAddModal(false);
      setNewForm({ name: '', sku: generateSKU(), barcode: '', description: '', category_id: '', unit: 'pieces', reorder_level: 5, reorder_qty: 10, cost_price: 0, selling_price: 0, supplier_name: '', supplier_contact: '', lead_time_days: 0 });
      toast.success('Product added');
      loadAll();
    } else toast.error(error.message);
  };

  const adjustStock = async () => {
    if (!selected || !userId || !adjustQty) return;
    setAdjusting(true);
    const qty = parseInt(adjustQty);
    if (isNaN(qty)) { setAdjusting(false); return; }
    const defLoc = locations.find(l => l.is_default) || locations[0];
    if (!defLoc) { setAdjusting(false); return; }
    await supabase.from('inv_stock_movements').insert({
      product_id: selected.id, location_id: defLoc.id, user_id: userId,
      movement_type: 'adjustment', quantity: qty, reason: adjustReason,
    });
    const { data: existing } = await supabase.from('inv_stock_levels').select('*').eq('product_id', selected.id).eq('location_id', defLoc.id).maybeSingle();
    if (existing) {
      await supabase.from('inv_stock_levels').update({ quantity: Math.max(0, (existing.quantity || 0) + qty) }).eq('id', existing.id);
    } else {
      await supabase.from('inv_stock_levels').insert({ product_id: selected.id, location_id: defLoc.id, quantity: Math.max(0, qty) });
    }
    setAdjusting(false);
    setAdjustQty('');
    toast.success(`Stock adjusted by ${qty > 0 ? '+' : ''}${qty}`);
    loadAll();
  };

  const getInitials = (p: Product) => p.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  const statPills = [
    { label: 'SKUs', value: String(stats.totalSkus), color: '#60a5fa' },
    { label: 'Value', value: formatCurrency(stats.totalValue), color: '#34d399' },
    { label: 'Low', value: String(stats.lowStockCount), color: '#fbbf24', urgent: stats.lowStockCount > 0 },
    { label: 'Out', value: String(stats.zeroStockCount), color: '#ef4444', urgent: stats.zeroStockCount > 0 },
  ];

  // Mobile: tap product goes to detail
  const handleSelectProduct = (id: string) => {
    setSelectedId(id);
    setEditing(false);
    if (isMobile) setMobileView('detail');
  };

  const handleMobileBack = () => {
    if (mobileView === 'activity') setMobileView('detail');
    else if (mobileView === 'detail') setMobileView('list');
    else onBack();
  };

  /* ─── Shared: Product List Items ─── */
  const renderProductList = () => (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="h-4 w-4 animate-spin text-[#555]" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-[#555]">
          <Package className="h-5 w-5 mb-1.5" />
          <span className="text-[10px]">No products found</span>
          {products.length === 0 && (
            <button onClick={() => setShowAddModal(true)} className="mt-2 text-[10px] text-[#0073E6] hover:underline">Add your first product</button>
          )}
        </div>
      ) : (
        filtered.map(p => {
          const status = getStockStatus(p.totalQty || 0, p.reorder_level);
          const sc = STOCK_STATUS_CONFIG[status];
          return (
            <button key={p.id} onClick={() => handleSelectProduct(p.id)}
              className={`w-full text-left px-3 py-2.5 transition-colors border-b ${selectedId === p.id ? 'bg-[#1e1e1e] border-[#333]' : 'border-[#1a1a1a] hover:bg-[#1a1a1a]'}`}>
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5" style={{ backgroundColor: sc.bg, color: sc.color }}>
                  {getInitials(p)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-[#ddd] truncate">{p.name}</span>
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sc.color }} title={sc.label} />
                  </div>
                  <span className="text-[9px] text-[#666] truncate block">{p.sku}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold tabular-nums" style={{ color: sc.color }}>{p.totalQty ?? 0} {p.unit}</span>
                    {p.category_name && <span className="text-[8px] text-[#555]">{p.category_name}</span>}
                    <span className="text-[8px] text-[#444] ml-auto tabular-nums">{formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })
      )}
    </div>
  );

  /* ─── Shared: Product Detail Content ─── */
  const renderProductDetail = () => {
    if (!selected) return (
      <div className="flex flex-col items-center justify-center h-full text-[#555]">
        <Package className="h-10 w-10 mb-3 text-[#333]" />
        <span className="text-[13px] font-medium text-[#555]">Select a product</span>
        <span className="text-[10px] text-[#444] mt-1">Choose from the list to view details</span>
      </div>
    );
    return (
      <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
              style={{ backgroundColor: STOCK_STATUS_CONFIG[getStockStatus(selected.totalQty || 0, selected.reorder_level)].bg, color: STOCK_STATUS_CONFIG[getStockStatus(selected.totalQty || 0, selected.reorder_level)].color }}>
              {getInitials(selected)}
            </div>
            <div className="min-w-0 flex-1">
              {editing ? (
                <input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 text-[13px] sm:text-[14px] font-semibold text-white outline-none focus:border-[#0073E6] w-full" />
              ) : (
                <h2 className="text-[14px] sm:text-[16px] font-semibold text-white truncate">{selected.name}</h2>
              )}
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[9px] font-medium border px-1.5 py-0 rounded"
                  style={{ backgroundColor: STOCK_STATUS_CONFIG[getStockStatus(selected.totalQty || 0, selected.reorder_level)].bg, color: STOCK_STATUS_CONFIG[getStockStatus(selected.totalQty || 0, selected.reorder_level)].color, borderColor: `${STOCK_STATUS_CONFIG[getStockStatus(selected.totalQty || 0, selected.reorder_level)].color}30` }}>
                  {STOCK_STATUS_CONFIG[getStockStatus(selected.totalQty || 0, selected.reorder_level)].label}
                </span>
                <button onClick={() => { navigator.clipboard.writeText(selected.sku); toast.success('SKU copied'); }}
                  className="flex items-center gap-1 text-[9px] text-[#666] hover:text-[#aaa] transition-colors">
                  <Hash className="h-2.5 w-2.5" />{selected.sku} <Copy className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {editing ? (
              <>
                <button onClick={saveEdit} disabled={saving} className="h-7 px-3 rounded-md text-[10px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] flex items-center gap-1 disabled:opacity-50">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
                </button>
                <button onClick={() => setEditing(false)} className="h-7 px-2.5 rounded-md text-[10px] font-medium text-[#888] hover:bg-[#333]">Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => { setEditing(true); setEditForm(selected); }} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333]">
                  <Edit3 className="h-3.5 w-3.5 text-[#888]" />
                </button>
                <button onClick={() => deleteProduct(selected.id)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333]">
                  <Trash2 className="h-3.5 w-3.5 text-[#ef4444]" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stock Level & Quick Adjust */}
        <div className="rounded-xl p-3 sm:p-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <span className="text-[9px] font-medium text-[#666] uppercase tracking-wider block mb-3">Stock Management</span>
          <div className="flex items-center gap-4 mb-3">
            <div>
              <span className="text-[24px] sm:text-[28px] font-bold tabular-nums" style={{ color: STOCK_STATUS_CONFIG[getStockStatus(selected.totalQty || 0, selected.reorder_level)].color }}>
                {selected.totalQty ?? 0}
              </span>
              <span className="text-[11px] text-[#666] ml-1">{selected.unit}</span>
            </div>
            <div className="flex-1">
              <div className="h-2 rounded-full bg-[#222] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(100, ((selected.totalQty || 0) / Math.max(selected.reorder_level * 3, 1)) * 100)}%`,
                  backgroundColor: STOCK_STATUS_CONFIG[getStockStatus(selected.totalQty || 0, selected.reorder_level)].color,
                }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] text-[#555]">0</span>
                <span className="text-[8px] text-[#fbbf24]">Reorder: {selected.reorder_level}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {[+10, +50, -10, -50].map(n => (
              <button key={n} onClick={() => setAdjustQty(String(n))}
                className="h-7 px-2.5 rounded-md text-[10px] font-medium transition-colors"
                style={{ backgroundColor: '#252525', color: n > 0 ? '#34d399' : '#ef4444', border: '1px solid #333' }}>
                {n > 0 ? '+' : ''}{n}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <input type="number" placeholder="Qty" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
              className="w-16 h-7 bg-[#252525] border border-[#333] rounded-md px-2 text-[10px] text-white outline-none focus:border-[#0073E6] tabular-nums" />
            <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
              className="h-7 bg-[#252525] border border-[#333] rounded-md px-1.5 text-[10px] text-[#ccc] outline-none flex-1 min-w-[90px]">
              <option value="correction">Correction</option>
              <option value="sale">Sale</option>
              <option value="purchase">Purchase</option>
              <option value="return">Return</option>
              <option value="damaged">Damaged</option>
              <option value="count">Count</option>
            </select>
            <button onClick={adjustStock} disabled={!adjustQty || adjusting}
              className="h-7 px-3 rounded-md text-[10px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] disabled:opacity-30 flex items-center gap-1">
              {adjusting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Adjust
            </button>
          </div>
        </div>

        {/* Product Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <DollarSign className="h-3.5 w-3.5" />, label: 'Cost Price', value: formatCurrency(selected.cost_price), field: 'cost_price', isNum: true },
            { icon: <TrendingUp className="h-3.5 w-3.5" />, label: 'Selling Price', value: formatCurrency(selected.selling_price), field: 'selling_price', isNum: true },
            { icon: <Package className="h-3.5 w-3.5" />, label: 'Unit', value: selected.unit, field: 'unit' },
            { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Reorder Level', value: String(selected.reorder_level), field: 'reorder_level', isNum: true },
            { icon: <Shuffle className="h-3.5 w-3.5" />, label: 'Supplier', value: selected.supplier_name, field: 'supplier_name' },
            { icon: <Hash className="h-3.5 w-3.5" />, label: 'Barcode', value: selected.barcode, field: null },
          ].map(item => (
            <div key={item.label} className="rounded-lg p-2.5" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[#555]">{item.icon}</span>
                <span className="text-[9px] text-[#666] font-medium uppercase tracking-wider">{item.label}</span>
              </div>
              {editing && item.field ? (
                <input type={item.isNum ? 'number' : 'text'} value={(editForm as any)[item.field] ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, [item.field!]: item.isNum ? Number(e.target.value) : e.target.value }))}
                  className="bg-[#252525] border border-[#333] rounded px-2 py-1 text-[11px] text-white outline-none w-full focus:border-[#0073E6]" />
              ) : (
                <span className="text-[11px] text-[#ccc] block truncate">
                  {item.value || <span className="text-[#444] italic">Not set</span>}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Profit Margin */}
        {selected.selling_price > 0 && selected.cost_price > 0 && (
          <div className="rounded-xl p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <span className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-2">Profit Margin</span>
            <div className="flex items-center gap-4">
              <span className="text-[14px] font-bold text-[#34d399]">
                {((1 - selected.cost_price / selected.selling_price) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-[#888]">
                {formatCurrency(selected.selling_price - selected.cost_price)} profit per unit
              </span>
            </div>
          </div>
        )}

        {/* Description */}
        {(selected.description || editing) && (
          <div className="rounded-xl p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <span className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-2">Description</span>
            {editing ? (
              <textarea value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={3} className="w-full bg-[#252525] border border-[#333] rounded-md px-2.5 py-1.5 text-[11px] text-white outline-none resize-none focus:border-[#0073E6]" />
            ) : (
              <p className="text-[11px] text-[#aaa]">{selected.description}</p>
            )}
          </div>
        )}

        {/* Mobile: Activity link */}
        {isMobile && (
          <button onClick={() => setMobileView('activity')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[11px] font-medium text-[#ccc] hover:bg-[#1e1e1e] transition-colors"
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-[#666]" /> View Activity ({selectedMovements.length})</span>
            <ChevronLeft className="h-3.5 w-3.5 text-[#555] rotate-180" />
          </button>
        )}

        <div className="flex items-center gap-4 pt-2">
          <span className="text-[9px] text-[#444] flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" /> Created {format(new Date(selected.created_at), 'dd MMM yyyy')}
          </span>
          <span className="text-[9px] text-[#444] flex items-center gap-1">
            <RefreshCw className="h-2.5 w-2.5" /> Updated {formatDistanceToNow(new Date(selected.updated_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    );
  };

  /* ─── Shared: Activity Panel Content ─── */
  const renderActivity = () => (
    <>
      {selected ? (
        <>
          <div className="flex items-center gap-0 px-3 pt-2 shrink-0" style={{ borderBottom: '1px solid #222' }}>
            <span className="text-[10px] font-semibold text-white pb-2 border-b-2 border-[#0073E6] px-2">Activity</span>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2">
            {selectedMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-[#555]">
                <Clock className="h-5 w-5 mb-1.5" />
                <span className="text-[10px]">No stock movements yet</span>
              </div>
            ) : (
              selectedMovements.map(m => (
                <div key={m.id} className="rounded-lg p-2.5" style={{ backgroundColor: '#1e1e1e', border: '1px solid #252525' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{
                      backgroundColor: m.quantity > 0 ? 'rgba(52,211,153,0.12)' : 'rgba(239,68,68,0.12)',
                    }}>
                      {m.quantity > 0 ? <Plus className="h-3 w-3 text-[#34d399]" /> : <Minus className="h-3 w-3 text-[#ef4444]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-medium text-[#ccc]">
                        {m.movement_type === 'adjustment' ? 'Stock Adjustment' : m.movement_type}
                      </span>
                      <span className="text-[9px] text-[#666] block">
                        {m.reason || 'No reason'} · {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                    </div>
                    <span className="text-[8px] text-[#555] tabular-nums shrink-0">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {m.notes && <p className="text-[9px] text-[#555] mt-1 pl-8">{m.notes}</p>}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-[#555]">
          <Clock className="h-8 w-8 mb-2 text-[#333]" />
          <span className="text-[10px]">Select a product to view activity</span>
        </div>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ backgroundColor: '#111', color: '#e0e0e0', fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: '12px' }}>
      {/* ─── Top Bar ─── */}
      <div className="h-11 flex items-center justify-between px-2 sm:px-3 shrink-0 select-none" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button onClick={isMobile ? handleMobileBack : onBack} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors shrink-0" title="Back">
            <ArrowLeft className="h-3.5 w-3.5 text-[#999]" />
          </button>
          <div className="w-[1px] h-4 bg-[#333] hidden sm:block" />
          <div className="flex items-center gap-1.5 min-w-0">
            <Boxes className="h-3.5 w-3.5 text-[#0073E6] shrink-0" />
            <span className="text-[11px] font-semibold text-[#ccc] tracking-wide truncate">{companyName || 'Inventory'}</span>
          </div>
          {isMobile && mobileView !== 'list' && (
            <span className="text-[9px] text-[#666] shrink-0">/ {mobileView === 'detail' ? 'Detail' : 'Activity'}</span>
          )}
          <div className="w-[1px] h-4 bg-[#333] mx-1 hidden sm:block" />
          <div className="hidden sm:flex items-center gap-1.5">
            {statPills.map(s => (
              <div key={s.label} className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ backgroundColor: '#252525', border: '1px solid #2a2a2a' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[9px] font-medium" style={{ color: '#888' }}>{s.label}</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowAddModal(true); setNewForm(f => ({ ...f, sku: generateSKU() })); }}
            className="h-7 px-2 sm:px-2.5 flex items-center gap-1 rounded-md text-[11px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add Product</span>
          </button>
          <div className="w-[1px] h-4 bg-[#333] hidden sm:block" />
          <button onClick={loadAll} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors" title="Refresh">
            <RefreshCw className="h-3.5 w-3.5 text-[#666]" />
          </button>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`h-7 px-2 sm:px-2.5 flex items-center gap-1 rounded-md text-[11px] font-medium transition-colors ${showFilters ? 'bg-[#0073E6]/20 text-[#60a5fa]' : 'text-[#888] hover:text-[#ccc] hover:bg-[#333]'}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* ─── Mobile Stat Pills ─── */}
      {isMobile && (
        <div className="flex items-center gap-1.5 px-2 py-1.5 overflow-x-auto scrollbar-hide shrink-0" style={{ backgroundColor: '#161616', borderBottom: '1px solid #222' }}>
          {statPills.map(s => (
            <div key={s.label} className="flex items-center gap-1 px-2 py-0.5 rounded-md shrink-0" style={{ backgroundColor: '#252525', border: '1px solid #2a2a2a' }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[9px] font-medium" style={{ color: '#888' }}>{s.label}</span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* ─── Filter Bar ─── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden shrink-0" style={{ backgroundColor: '#161616', borderBottom: '1px solid #2a2a2a' }}>
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 flex-wrap">
              <span className="text-[10px] font-medium text-[#666] uppercase tracking-wider">Status:</span>
              <div className="flex items-center gap-1 flex-wrap">
                <button onClick={() => setStatusFilter(null)} className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${!statusFilter ? 'bg-[#333] text-white' : 'text-[#777] hover:text-white hover:bg-[#2a2a2a]'}`}>All</button>
                {Object.entries(STOCK_STATUS_CONFIG).map(([key, cfg]) => (
                  <button key={key} onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                    className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                    style={{ backgroundColor: statusFilter === key ? cfg.bg : 'transparent', color: statusFilter === key ? cfg.color : '#777', border: statusFilter === key ? `1px solid ${cfg.color}30` : '1px solid transparent' }}
                  >{cfg.label}</button>
                ))}
              </div>
              {categories.length > 0 && (
                <>
                  <div className="w-[1px] h-4 bg-[#333] hidden sm:block" />
                  <span className="text-[10px] font-medium text-[#666] uppercase tracking-wider">Category:</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    <button onClick={() => setCategoryFilter(null)} className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${!categoryFilter ? 'bg-[#333] text-white' : 'text-[#777] hover:text-white hover:bg-[#2a2a2a]'}`}>All</button>
                    {categories.map(c => (
                      <button key={c.id} onClick={() => setCategoryFilter(categoryFilter === c.id ? null : c.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${categoryFilter === c.id ? 'bg-[#333] text-white' : 'text-[#777] hover:text-white hover:bg-[#2a2a2a]'}`}
                      >{c.name}</button>
                    ))}
                  </div>
                </>
              )}
              {(statusFilter || categoryFilter) && (
                <button onClick={() => { setStatusFilter(null); setCategoryFilter(null); }} className="ml-auto text-[10px] text-[#ef4444] hover:text-[#f87171]">Clear all</button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Content: Mobile stacked vs Desktop 3-pane ─── */}
      {isMobile ? (
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#141414' }}>
          {mobileView === 'list' && (
            <>
              <div className="p-2 shrink-0" style={{ borderBottom: '1px solid #222' }}>
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                  <Search className="h-3.5 w-3.5 text-[#555]" />
                  <input type="text" placeholder="Search products…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent text-[11px] text-[#ccc] placeholder:text-[#555] outline-none flex-1" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="hover:text-white text-[#555]"><X className="h-3 w-3" /></button>}
                </div>
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <span className="text-[9px] text-[#555] font-medium">{filtered.length} products</span>
                </div>
              </div>
              {renderProductList()}
            </>
          )}
          {mobileView === 'detail' && (
            <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ backgroundColor: '#111' }}>
              {renderProductDetail()}
            </div>
          )}
          {mobileView === 'activity' && (
            <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#141414' }}>
              {renderActivity()}
            </div>
          )}
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left: Product List */}
          <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
            <div className="h-full flex flex-col" style={{ backgroundColor: '#141414' }}>
              <div className="p-2 shrink-0" style={{ borderBottom: '1px solid #222' }}>
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                  <Search className="h-3.5 w-3.5 text-[#555]" />
                  <input type="text" placeholder="Search products…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="bg-transparent text-[11px] text-[#ccc] placeholder:text-[#555] outline-none flex-1" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="hover:text-white text-[#555]"><X className="h-3 w-3" /></button>}
                </div>
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <span className="text-[9px] text-[#555] font-medium">{filtered.length} products</span>
                </div>
              </div>
              {renderProductList()}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-[1px] bg-[#2a2a2a] hover:bg-[#0073E6] transition-colors" />

          {/* Center: Product Detail */}
          <ResizablePanel defaultSize={44}>
            <div className="h-full overflow-y-auto scrollbar-hide" style={{ backgroundColor: '#111' }}>
              {renderProductDetail()}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-[1px] bg-[#2a2a2a] hover:bg-[#0073E6] transition-colors" />

          {/* Right: Activity */}
          <ResizablePanel defaultSize={28} minSize={18} maxSize={35}>
            <div className="h-full flex flex-col" style={{ backgroundColor: '#141414' }}>
              {renderActivity()}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      {/* ─── Add Product Modal ─── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60" onClick={() => setShowAddModal(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0, y: isMobile ? 20 : 0 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: isMobile ? 20 : 0 }}
              className="w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-xl sm:rounded-xl p-4 sm:p-5 space-y-4"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-white">Add Product</h3>
                <button onClick={() => setShowAddModal(false)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#333]"><X className="h-3.5 w-3.5 text-[#888]" /></button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Product Name *</label>
                  <input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Blue Widget Pro"
                    className="w-full h-8 bg-[#252525] border border-[#333] rounded-md px-2.5 text-[11px] text-white outline-none focus:border-[#0073E6]" />
                </div>
                <div>
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">SKU *</label>
                  <div className="flex gap-1">
                    <input value={newForm.sku} onChange={e => setNewForm(f => ({ ...f, sku: e.target.value }))}
                      className="flex-1 h-8 bg-[#252525] border border-[#333] rounded-md px-2.5 text-[11px] text-white outline-none focus:border-[#0073E6]" />
                    <button onClick={() => setNewForm(f => ({ ...f, sku: generateSKU() }))} className="h-8 w-8 flex items-center justify-center rounded-md bg-[#252525] border border-[#333] hover:bg-[#333]">
                      <Shuffle className="h-3 w-3 text-[#888]" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Unit</label>
                  <select value={newForm.unit} onChange={e => setNewForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full h-8 bg-[#252525] border border-[#333] rounded-md px-2 text-[11px] text-[#ccc] outline-none">
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Cost Price</label>
                  <input type="number" step="0.01" value={newForm.cost_price} onChange={e => setNewForm(f => ({ ...f, cost_price: Number(e.target.value) }))}
                    className="w-full h-8 bg-[#252525] border border-[#333] rounded-md px-2.5 text-[11px] text-white outline-none focus:border-[#0073E6]" />
                </div>
                <div>
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Selling Price</label>
                  <input type="number" step="0.01" value={newForm.selling_price} onChange={e => setNewForm(f => ({ ...f, selling_price: Number(e.target.value) }))}
                    className="w-full h-8 bg-[#252525] border border-[#333] rounded-md px-2.5 text-[11px] text-white outline-none focus:border-[#0073E6]" />
                </div>
                <div>
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Reorder Level</label>
                  <input type="number" value={newForm.reorder_level} onChange={e => setNewForm(f => ({ ...f, reorder_level: Number(e.target.value) }))}
                    className="w-full h-8 bg-[#252525] border border-[#333] rounded-md px-2.5 text-[11px] text-white outline-none focus:border-[#0073E6]" />
                </div>
                <div>
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Reorder Qty</label>
                  <input type="number" value={newForm.reorder_qty} onChange={e => setNewForm(f => ({ ...f, reorder_qty: Number(e.target.value) }))}
                    className="w-full h-8 bg-[#252525] border border-[#333] rounded-md px-2.5 text-[11px] text-white outline-none focus:border-[#0073E6]" />
                </div>
                <div>
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Supplier</label>
                  <input value={newForm.supplier_name} onChange={e => setNewForm(f => ({ ...f, supplier_name: e.target.value }))} placeholder="Supplier name"
                    className="w-full h-8 bg-[#252525] border border-[#333] rounded-md px-2.5 text-[11px] text-white outline-none focus:border-[#0073E6]" />
                </div>
                <div>
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Supplier Contact</label>
                  <input value={newForm.supplier_contact} onChange={e => setNewForm(f => ({ ...f, supplier_contact: e.target.value }))} placeholder="Email or phone"
                    className="w-full h-8 bg-[#252525] border border-[#333] rounded-md px-2.5 text-[11px] text-white outline-none focus:border-[#0073E6]" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Description</label>
                  <textarea value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional description..."
                    className="w-full bg-[#252525] border border-[#333] rounded-md px-2.5 py-1.5 text-[11px] text-white outline-none resize-none focus:border-[#0073E6]" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowAddModal(false)} className="h-8 px-4 rounded-md text-[11px] font-medium text-[#888] hover:bg-[#333]">Cancel</button>
                <button onClick={addProduct} disabled={savingNew || !newForm.name.trim()}
                  className="h-8 px-4 rounded-md text-[11px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] disabled:opacity-30 flex items-center gap-1">
                  {savingNew ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Add Product
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Export ─── */
export default function LoungeInventory() {
  return (
    <SubscriptionPaywall
      featureKey="inventory"
      featureDescription="Track stock levels, manage products, run stock counts, and generate reports — all in one place."
      icon={Package}
    >
      <LoungeInventoryInner />
    </SubscriptionPaywall>
  );
}
