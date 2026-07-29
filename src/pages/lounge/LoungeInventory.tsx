import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Package, AlertTriangle, TrendingUp, DollarSign,
  RefreshCw, Boxes, ArrowLeft,
  Search, Plus, X, Edit3, Trash2, Check,
  Shuffle, Clock, Hash, SlidersHorizontal, Minus,
  Copy, MoreHorizontal, Pencil,
  LayoutGrid, List, ArrowUpDown, Building2, ChevronLeft,
} from 'lucide-react';
import { SubscriptionPaywall } from '@/components/lounge/SubscriptionPaywall';
import { InventorySplash } from '@/components/splash/InventorySplash';
import { ExitSplash } from '@/components/splash/ExitSplash';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
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
import {
  PageHeader, StatusBadge, ConfirmDialog, EmptyState, SkeletonLedger,
  type Tone,
} from '@/components/platform';
import { cn } from '@/lib/utils';

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

/* Stock status resolves to the platform's status vocabulary — no hex maps. */
const STOCK_STATUS: Record<string, { label: string; tone: Tone }> = {
  ok: { label: 'In stock', tone: 'ok' },
  low: { label: 'Low stock', tone: 'attend' },
  zero: { label: 'Out of stock', tone: 'risk' },
};

const TONE_TEXT: Record<string, string> = { ok: 'text-ok', attend: 'text-attend', risk: 'text-risk' };
const TONE_BG: Record<string, string> = { ok: 'bg-ok/10', attend: 'bg-attend/10', risk: 'bg-risk/10' };
const TONE_DOT: Record<string, string> = { ok: 'bg-ok', attend: 'bg-attend', risk: 'bg-risk' };

const UNITS = ['pieces', 'kg', 'g', 'liters', 'ml', 'boxes', 'pairs', 'sets', 'meters', 'feet'];

/* Shared field recipe at the instrument's compact scale */
const FIELD_SM =
  'w-full h-8 rounded-md border border-border/60 bg-foreground/[0.03] px-2.5 text-[11px] text-foreground outline-none transition-colors duration-150 focus:border-primary/60 placeholder:text-muted-foreground/60';
const LABEL_SM =
  'font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground block mb-1';

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
   DASHBOARD VIEW — Company cards
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
    <div className="mx-auto min-h-[80vh] max-w-[1280px] space-y-5 px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Inventory"
        title="Inventory"
        description={`${companies.length} ${companies.length === 1 ? 'company' : 'companies'}`}
        actions={
          <Button
            onClick={() => setShowNewDialog(true)}
            size="sm"
            className="h-8 rounded-lg px-3 text-xs"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> New company
          </Button>
        }
      />

      {/* ─── Controls ─── */}
      {companies.length > 0 && (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[160px] max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search companies"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-foreground/[0.03] py-2 pl-9 pr-3 text-xs text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground/60 focus:border-primary/60"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteAllDialog(true)}
              className="h-8 px-3 text-xs text-risk hover:text-risk"
            >
              <Trash2 className="mr-1.5 h-3 w-3" /> Delete all
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center overflow-hidden rounded-md border border-border/60">
              <button
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                className={cn('p-1.5 transition-colors duration-150', viewMode === 'grid' ? 'bg-foreground/[0.06] text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                aria-label="List view"
                className={cn('p-1.5 transition-colors duration-150', viewMode === 'list' ? 'bg-foreground/[0.06] text-foreground' : 'text-muted-foreground hover:text-foreground')}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1.5 text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground">
                  <ArrowUpDown className="h-3 w-3" />
                  <span className="hidden sm:inline">{sortBy === 'updated' ? 'Last edited' : sortBy === 'created' ? 'Date created' : 'Name'}</span>
                  <span className="sm:hidden">Sort</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px]">
                <DropdownMenuItem onClick={() => setSortBy('updated')} className="text-xs">Last edited</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('created')} className="text-xs">Date created</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')} className="text-xs">Name</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* ─── Company Cards ─── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
              <div className="aspect-[16/10] animate-pulse bg-foreground/[0.04]" />
              <div className="space-y-2 p-3.5">
                <div className="h-3.5 w-2/3 animate-pulse rounded bg-foreground/[0.06]" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-foreground/[0.05]" />
              </div>
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          title="No companies yet"
          body="Add a company to start managing its inventory."
          action={{ label: 'Add company', onClick: () => setShowNewDialog(true) }}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          compact
          title="No companies match your search"
          body={`Nothing found for "${searchQuery}".`}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} onOpen={() => onOpenCompany(company.id)} onDelete={() => handleDelete(company.id)} />
          ))}
        </div>
      ) : (
        <div className="rounded-[10px] border border-border/60 bg-card">
          {filtered.map((company) => (
            <CompanyListItem key={company.id} company={company} onOpen={() => onOpenCompany(company.id)} onDelete={() => handleDelete(company.id)} />
          ))}
        </div>
      )}

      {/* ─── New Company Dialog ─── */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">New company</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <Label className={LABEL_SM}>Company name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Warehouse London" autoFocus
                className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className={LABEL_SM}>Address</Label>
              <Input value={newAddress} onChange={e => setNewAddress(e.target.value)} placeholder="123 Main St, London"
                className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className={LABEL_SM}>Description</Label>
              <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Optional description…" rows={2}
                className="resize-none text-sm" />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="outline" size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={() => setShowNewDialog(false)}>Cancel</Button>
            <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? 'Creating' : 'Create company'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete All Dialog ─── */}
      <ConfirmDialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
        title="Delete all companies?"
        consequence="This permanently deletes every company and its products. It cannot be undone."
        confirmLabel="Delete all"
        onConfirm={handleDeleteAll}
        loading={deletingAll}
      />
    </div>
  );
}

/* ─── Company Card (Grid) ─── */
function CompanyCard({ company, onOpen, onDelete }: { company: Company; onOpen: () => void; onDelete: () => void }) {
  const lowStock = (company.low_stock_count || 0) > 0;

  return (
    <div className="group relative overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:border-border">
      {/* Thumbnail area */}
      <button type="button" onClick={onOpen} aria-label={`Open ${company.name}`} className="relative block aspect-[16/10] w-full overflow-hidden bg-sunken">
        <div className="flex h-full w-full items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Building2 className="h-8 w-8 text-foreground/10" />
            <div className="grid grid-cols-3 gap-1 opacity-20">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`${i < 3 ? 'w-8 h-5' : 'w-8 h-4'} rounded-sm bg-foreground/30`} />
              ))}
            </div>
          </div>
        </div>

        {/* Stats overlay */}
        <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
          <span className="rounded-md border border-border/60 bg-card/95 px-2 py-0.5 text-[10px] tabular-nums text-muted-foreground">
            {company.product_count || 0} SKUs
          </span>
          {lowStock && (
            <span className="rounded-md border border-border/60 bg-card/95 px-2 py-0.5 text-[10px] tabular-nums text-attend">
              {company.low_stock_count} low
            </span>
          )}
        </div>
      </button>

      {/* More menu */}
      <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <button aria-label="Company actions" className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card/95 transition-colors duration-150 hover:bg-card">
              <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]">
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onOpen(); }} className="text-xs">
              <Pencil className="mr-2 h-3 w-3" /> Open
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }} className="text-xs text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-3 w-3" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Info */}
      <div className="space-y-1.5 p-3.5">
        <p className="truncate text-[13px] font-medium leading-tight text-foreground">{company.name}</p>
        <div className="flex items-center gap-2">
          <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', lowStock ? 'bg-attend' : 'bg-ok')} />
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {timeAgo(company.updated_at)}
          </span>
          {company.address && (
            <>
              <span className="text-[11px] text-muted-foreground/60">·</span>
              <span className="truncate text-[11px] text-muted-foreground">{company.address}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Company List Item ─── */
function CompanyListItem({ company, onOpen, onDelete }: { company: Company; onOpen: () => void; onDelete: () => void }) {
  return (
    <div onClick={onOpen} className="group flex cursor-pointer items-center gap-4 border-t border-border/60 px-4 py-3 transition-colors duration-150 first:border-t-0 hover:bg-foreground/[0.025]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-sunken">
        <Building2 className="h-4 w-4 text-muted-foreground/60" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-foreground">{company.name}</p>
        <p className="text-[11px] text-muted-foreground">{company.product_count || 0} products · Edited {timeAgo(company.updated_at)}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onOpen(); }} className="h-7 px-2 text-muted-foreground hover:text-foreground" aria-label="Open company">
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-7 px-2 text-risk/70 hover:text-risk" aria-label="Delete company">
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
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

  const statPills: { label: string; value: string; tone: Tone }[] = [
    { label: 'SKUs', value: String(stats.totalSkus), tone: 'neutral' },
    { label: 'Value', value: formatCurrency(stats.totalValue), tone: 'ok' },
    { label: 'Low', value: String(stats.lowStockCount), tone: stats.lowStockCount > 0 ? 'attend' : 'neutral' },
    { label: 'Out', value: String(stats.zeroStockCount), tone: stats.zeroStockCount > 0 ? 'risk' : 'neutral' },
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

  const statPill = (s: { label: string; value: string; tone: Tone }) => (
    <div key={s.label} className="flex shrink-0 items-center gap-1.5 rounded-md border border-border/60 bg-sunken px-2 py-0.5">
      <span aria-hidden className={cn('h-1.5 w-1.5 rounded-full', s.tone === 'neutral' ? 'bg-muted-foreground/50' : TONE_DOT[s.tone])} />
      <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{s.label}</span>
      <span className={cn('text-[10px] font-semibold tabular-nums', s.tone === 'neutral' ? 'text-foreground' : TONE_TEXT[s.tone])}>{s.value}</span>
    </div>
  );

  /* ─── Shared: Product List Items ─── */
  const renderProductList = () => (
    <div className="scrollbar-hide flex-1 overflow-y-auto">
      {loading ? (
        <SkeletonLedger rows={6} />
      ) : filtered.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
          <Package className="mb-1.5 h-5 w-5" />
          <span className="text-[10px]">No products found</span>
          {products.length === 0 && (
            <button onClick={() => setShowAddModal(true)} className="mt-2 text-[10px] text-primary hover:underline">Add your first product</button>
          )}
        </div>
      ) : (
        filtered.map(p => {
          const status = getStockStatus(p.totalQty || 0, p.reorder_level);
          const sc = STOCK_STATUS[status];
          return (
            <button key={p.id} onClick={() => handleSelectProduct(p.id)}
              className={cn(
                'w-full border-b border-border/60 px-3 py-2.5 text-left transition-colors duration-150',
                selectedId === p.id ? 'bg-foreground/[0.05]' : 'hover:bg-foreground/[0.025]',
              )}>
              <div className="flex items-start gap-2.5">
                <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold', TONE_BG[sc.tone], TONE_TEXT[sc.tone])}>
                  {getInitials(p)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-[11px] font-medium text-foreground">{p.name}</span>
                    <span aria-hidden className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[sc.tone])} title={sc.label} />
                  </div>
                  <span className="block truncate font-mono text-[9px] text-muted-foreground">{p.sku}</span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className={cn('text-[9px] font-semibold tabular-nums', TONE_TEXT[sc.tone])}>{p.totalQty ?? 0} {p.unit}</span>
                    {p.category_name && <span className="text-[8px] text-muted-foreground">{p.category_name}</span>}
                    <span className="ml-auto text-[8px] tabular-nums text-muted-foreground/70">{formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}</span>
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
      <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
        <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
        <span className="text-[13px] font-medium">Select a product</span>
        <span className="mt-1 text-[10px] text-muted-foreground/70">Choose from the list to view details</span>
      </div>
    );
    const selTone = STOCK_STATUS[getStockStatus(selected.totalQty || 0, selected.reorder_level)];
    return (
      <div className="space-y-4 p-4 sm:space-y-5 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-xs font-semibold sm:h-12 sm:w-12 sm:text-sm', TONE_BG[selTone.tone], TONE_TEXT[selTone.tone])}>
              {getInitials(selected)}
            </div>
            <div className="min-w-0 flex-1">
              {editing ? (
                <input value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded border border-border/60 bg-foreground/[0.03] px-2 py-1 text-[13px] font-semibold text-foreground outline-none transition-colors duration-150 focus:border-primary/60 sm:text-[14px]" />
              ) : (
                <h2 className="truncate text-[14px] font-semibold text-foreground sm:text-[16px]">{selected.name}</h2>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusBadge tone={selTone.tone} label={selTone.label} className="text-[10px]" />
                <button onClick={() => { navigator.clipboard.writeText(selected.sku); toast.success('SKU copied'); }}
                  className="flex items-center gap-1 font-mono text-[9px] text-muted-foreground transition-colors duration-150 hover:text-foreground">
                  <Hash className="h-2.5 w-2.5" />{selected.sku} <Copy className="h-2.5 w-2.5" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {editing ? (
              <>
                <button onClick={saveEdit} disabled={saving} className="flex h-7 items-center gap-1 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105 disabled:opacity-50">
                  <Check className="h-3 w-3" /> {saving ? 'Saving' : 'Save'}
                </button>
                <button onClick={() => setEditing(false)} className="h-7 rounded-md px-2.5 text-[10px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06]">Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => { setEditing(true); setEditForm(selected); }} aria-label="Edit product" className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
                  <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => deleteProduct(selected.id)} aria-label="Delete product" className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
                  <Trash2 className="h-3.5 w-3.5 text-risk" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stock Level & Quick Adjust */}
        <div className="rounded-[10px] border border-border/60 bg-card p-3 sm:p-4">
          <span className="mb-3 block font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Stock management</span>
          <div className="mb-3 flex items-center gap-4">
            <div>
              <span className={cn('text-[24px] font-semibold tabular-nums sm:text-[28px]', TONE_TEXT[selTone.tone])}>
                {selected.totalQty ?? 0}
              </span>
              <span className="ml-1 text-[11px] text-muted-foreground">{selected.unit}</span>
            </div>
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-sunken">
                <div
                  className={cn('h-full rounded-full transition-all duration-200', TONE_DOT[selTone.tone])}
                  style={{ width: `${Math.min(100, ((selected.totalQty || 0) / Math.max(selected.reorder_level * 3, 1)) * 100)}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between">
                <span className="text-[8px] tabular-nums text-muted-foreground">0</span>
                <span className="text-[8px] tabular-nums text-attend">Reorder: {selected.reorder_level}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {[+10, +50, -10, -50].map(n => (
              <button key={n} onClick={() => setAdjustQty(String(n))}
                className={cn(
                  'h-7 rounded-md border border-border/60 bg-sunken px-2.5 text-[10px] font-medium tabular-nums transition-colors duration-150 hover:border-border',
                  n > 0 ? 'text-ok' : 'text-risk',
                )}>
                {n > 0 ? '+' : ''}{n}
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <input type="number" placeholder="Qty" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
              className="h-7 w-16 rounded-md border border-border/60 bg-foreground/[0.03] px-2 text-[10px] tabular-nums text-foreground outline-none transition-colors duration-150 focus:border-primary/60" />
            <select value={adjustReason} onChange={e => setAdjustReason(e.target.value)}
              className="h-7 min-w-[90px] flex-1 rounded-md border border-border/60 bg-foreground/[0.03] px-1.5 text-[10px] text-foreground outline-none">
              <option value="correction">Correction</option>
              <option value="sale">Sale</option>
              <option value="purchase">Purchase</option>
              <option value="return">Return</option>
              <option value="damaged">Damaged</option>
              <option value="count">Count</option>
            </select>
            <button onClick={adjustStock} disabled={!adjustQty || adjusting}
              className="flex h-7 items-center gap-1 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105 disabled:opacity-30">
              <Check className="h-3 w-3" /> {adjusting ? 'Adjusting' : 'Adjust'}
            </button>
          </div>
        </div>

        {/* Product Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <DollarSign className="h-3.5 w-3.5" />, label: 'Cost price', value: formatCurrency(selected.cost_price), field: 'cost_price', isNum: true },
            { icon: <TrendingUp className="h-3.5 w-3.5" />, label: 'Selling price', value: formatCurrency(selected.selling_price), field: 'selling_price', isNum: true },
            { icon: <Package className="h-3.5 w-3.5" />, label: 'Unit', value: selected.unit, field: 'unit' },
            { icon: <AlertTriangle className="h-3.5 w-3.5" />, label: 'Reorder level', value: String(selected.reorder_level), field: 'reorder_level', isNum: true },
            { icon: <Shuffle className="h-3.5 w-3.5" />, label: 'Supplier', value: selected.supplier_name, field: 'supplier_name' },
            { icon: <Hash className="h-3.5 w-3.5" />, label: 'Barcode', value: selected.barcode, field: null },
          ].map(item => (
            <div key={item.label} className="rounded-lg border border-border/60 bg-card p-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-muted-foreground/70">{item.icon}</span>
                <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{item.label}</span>
              </div>
              {editing && item.field ? (
                <input type={item.isNum ? 'number' : 'text'} value={(editForm as any)[item.field] ?? ''}
                  onChange={e => setEditForm(f => ({ ...f, [item.field!]: item.isNum ? Number(e.target.value) : e.target.value }))}
                  className="w-full rounded border border-border/60 bg-foreground/[0.03] px-2 py-1 text-[11px] text-foreground outline-none transition-colors duration-150 focus:border-primary/60" />
              ) : (
                <span className="block truncate text-[11px] tabular-nums text-ink-2">
                  {item.value || <span className="text-muted-foreground/50">Not set</span>}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Profit Margin */}
        {selected.selling_price > 0 && selected.cost_price > 0 && (
          <div className="rounded-[10px] border border-border/60 bg-card p-3">
            <span className="mb-2 block font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Profit margin</span>
            <div className="flex items-center gap-4">
              <span className="text-[14px] font-semibold tabular-nums text-ok">
                {((1 - selected.cost_price / selected.selling_price) * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {formatCurrency(selected.selling_price - selected.cost_price)} profit per unit
              </span>
            </div>
          </div>
        )}

        {/* Description */}
        {(selected.description || editing) && (
          <div className="rounded-[10px] border border-border/60 bg-card p-3">
            <span className="mb-2 block font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Description</span>
            {editing ? (
              <textarea value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={3} className="w-full resize-none rounded-md border border-border/60 bg-foreground/[0.03] px-2.5 py-1.5 text-[11px] text-foreground outline-none transition-colors duration-150 focus:border-primary/60" />
            ) : (
              <p className="text-[11px] leading-relaxed text-ink-2">{selected.description}</p>
            )}
          </div>
        )}

        {/* Mobile: Activity link */}
        {isMobile && (
          <button onClick={() => setMobileView('activity')}
            className="flex w-full items-center justify-between rounded-[10px] border border-border/60 bg-card px-3 py-2.5 text-[11px] font-medium text-ink-2 transition-colors duration-150 hover:bg-foreground/[0.025]">
            <span className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-muted-foreground" /> View activity ({selectedMovements.length})</span>
            <ChevronLeft className="h-3.5 w-3.5 rotate-180 text-muted-foreground" />
          </button>
        )}

        <div className="flex items-center gap-4 pt-2">
          <span className="flex items-center gap-1 font-mono text-[9px] tabular-nums text-muted-foreground/70">
            <Clock className="h-2.5 w-2.5" /> Created {format(new Date(selected.created_at), 'dd MMM yyyy')}
          </span>
          <span className="flex items-center gap-1 font-mono text-[9px] tabular-nums text-muted-foreground/70">
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
          <div className="flex shrink-0 items-center gap-0 border-b border-border/60 px-3 pt-2">
            <span className="border-b-2 border-primary px-2 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground">Activity</span>
          </div>
          <div className="scrollbar-hide flex-1 space-y-2 overflow-y-auto p-3">
            {selectedMovements.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
                <Clock className="mb-1.5 h-5 w-5" />
                <span className="text-[10px]">No stock movements yet</span>
              </div>
            ) : (
              selectedMovements.map(m => (
                <div key={m.id} className="rounded-lg border border-border/60 bg-card p-2.5">
                  <div className="flex items-center gap-2">
                    <div className={cn('flex h-6 w-6 items-center justify-center rounded-md', m.quantity > 0 ? 'bg-ok/10' : 'bg-risk/10')}>
                      {m.quantity > 0 ? <Plus className="h-3 w-3 text-ok" /> : <Minus className="h-3 w-3 text-risk" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-medium text-foreground">
                        {m.movement_type === 'adjustment' ? 'Stock adjustment' : m.movement_type}
                      </span>
                      <span className="block text-[9px] tabular-nums text-muted-foreground">
                        {m.reason || 'No reason'} · {m.quantity > 0 ? '+' : ''}{m.quantity}
                      </span>
                    </div>
                    <span className="shrink-0 text-[8px] tabular-nums text-muted-foreground/70">
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {m.notes && <p className="mt-1 pl-8 text-[9px] text-muted-foreground">{m.notes}</p>}
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
          <Clock className="mb-2 h-8 w-8 text-muted-foreground/40" />
          <span className="text-[10px]">Select a product to view activity</span>
        </div>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background text-[12px] text-foreground">
      {/* ─── Top Bar ─── */}
      <div className="flex h-11 shrink-0 select-none items-center justify-between border-b border-border/60 bg-card px-2 sm:px-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <button onClick={isMobile ? handleMobileBack : onBack} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]" title="Back">
            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <div className="flex min-w-0 items-center gap-1.5">
            <Boxes className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate text-[11px] font-semibold tracking-wide text-foreground">{companyName || 'Inventory'}</span>
          </div>
          {isMobile && mobileView !== 'list' && (
            <span className="shrink-0 text-[9px] text-muted-foreground">/ {mobileView === 'detail' ? 'Detail' : 'Activity'}</span>
          )}
          <div className="mx-1 hidden h-4 w-px bg-border sm:block" />
          <div className="hidden items-center gap-1.5 sm:flex">
            {statPills.map(statPill)}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setShowAddModal(true); setNewForm(f => ({ ...f, sku: generateSKU() })); }}
            className="flex h-7 items-center gap-1 rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105 sm:px-2.5"
          >
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add product</span>
          </button>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <button onClick={loadAll} className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]" title="Refresh">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={cn(
              'flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors duration-150 sm:px-2.5',
              showFilters ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground',
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Filters</span>
          </button>
        </div>
      </div>

      {/* ─── Mobile Stat Pills ─── */}
      {isMobile && (
        <div className="scrollbar-hide flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border/60 bg-card px-2 py-1.5">
          {statPills.map(statPill)}
        </div>
      )}

      {/* ─── Filter Bar ─── */}
      {showFilters && (
        <div className="shrink-0 border-b border-border/60 bg-sunken">
          <div className="flex flex-wrap items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Status</span>
            <div className="flex flex-wrap items-center gap-1">
              <button onClick={() => setStatusFilter(null)} className={cn('rounded px-2 py-0.5 text-[10px] font-medium transition-colors duration-150', !statusFilter ? 'bg-foreground/[0.08] text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground')}>All</button>
              {Object.entries(STOCK_STATUS).map(([key, cfg]) => (
                <button key={key} onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                  className={cn(
                    'rounded border px-2 py-0.5 text-[10px] font-medium transition-colors duration-150',
                    statusFilter === key
                      ? cn(TONE_BG[cfg.tone], TONE_TEXT[cfg.tone], 'border-border/60')
                      : 'border-transparent text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                  )}
                >{cfg.label}</button>
              ))}
            </div>
            {categories.length > 0 && (
              <>
                <div className="hidden h-4 w-px bg-border sm:block" />
                <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Category</span>
                <div className="flex flex-wrap items-center gap-1">
                  <button onClick={() => setCategoryFilter(null)} className={cn('rounded px-2 py-0.5 text-[10px] font-medium transition-colors duration-150', !categoryFilter ? 'bg-foreground/[0.08] text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground')}>All</button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => setCategoryFilter(categoryFilter === c.id ? null : c.id)}
                      className={cn('rounded px-2 py-0.5 text-[10px] font-medium transition-colors duration-150', categoryFilter === c.id ? 'bg-foreground/[0.08] text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground')}
                    >{c.name}</button>
                  ))}
                </div>
              </>
            )}
            {(statusFilter || categoryFilter) && (
              <button onClick={() => { setStatusFilter(null); setCategoryFilter(null); }} className="ml-auto text-[10px] text-risk transition-colors duration-150 hover:text-risk/80">Clear all</button>
            )}
          </div>
        </div>
      )}

      {/* ─── Content: Mobile stacked vs Desktop 3-pane ─── */}
      {isMobile ? (
        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          {mobileView === 'list' && (
            <>
              <div className="shrink-0 border-b border-border/60 p-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.03] px-2 py-1.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input type="text" placeholder="Search products…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>}
                </div>
                <div className="mt-1.5 flex items-center justify-between px-1">
                  <span className="text-[9px] font-medium tabular-nums text-muted-foreground">{filtered.length} products</span>
                </div>
              </div>
              {renderProductList()}
            </>
          )}
          {mobileView === 'detail' && (
            <div className="scrollbar-hide flex-1 overflow-y-auto bg-background">
              {renderProductDetail()}
            </div>
          )}
          {mobileView === 'activity' && (
            <div className="flex flex-1 flex-col overflow-hidden bg-background">
              {renderActivity()}
            </div>
          )}
        </div>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* Left: Product List */}
          <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
            <div className="flex h-full flex-col bg-background">
              <div className="shrink-0 border-b border-border/60 p-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.03] px-2 py-1.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input type="text" placeholder="Search products…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>}
                </div>
                <div className="mt-1.5 flex items-center justify-between px-1">
                  <span className="text-[9px] font-medium tabular-nums text-muted-foreground">{filtered.length} products</span>
                </div>
              </div>
              {renderProductList()}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-border transition-colors duration-150 hover:bg-primary" />

          {/* Center: Product Detail */}
          <ResizablePanel defaultSize={44}>
            <div className="scrollbar-hide h-full overflow-y-auto bg-background">
              {renderProductDetail()}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-border transition-colors duration-150 hover:bg-primary" />

          {/* Right: Activity */}
          <ResizablePanel defaultSize={28} minSize={18} maxSize={35}>
            <div className="flex h-full flex-col bg-background">
              {renderActivity()}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      {/* ─── Add Product Modal ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 sm:items-center" onClick={() => setShowAddModal(false)}>
          <div
            className="max-h-[85vh] w-full space-y-4 overflow-y-auto rounded-t-xl border border-border/60 bg-card p-4 sm:max-w-lg sm:rounded-xl sm:p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-foreground">Add product</h3>
              <button onClick={() => setShowAddModal(false)} aria-label="Close" className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06]"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL_SM}>Product name</label>
                <input value={newForm.name} onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Blue Widget Pro"
                  className={FIELD_SM} />
              </div>
              <div>
                <label className={LABEL_SM}>SKU</label>
                <div className="flex gap-1">
                  <input value={newForm.sku} onChange={e => setNewForm(f => ({ ...f, sku: e.target.value }))}
                    className={cn(FIELD_SM, 'flex-1 font-mono')} />
                  <button onClick={() => setNewForm(f => ({ ...f, sku: generateSKU() }))} aria-label="Generate SKU" className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-foreground/[0.03] transition-colors duration-150 hover:bg-foreground/[0.06]">
                    <Shuffle className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              </div>
              <div>
                <label className={LABEL_SM}>Unit</label>
                <select value={newForm.unit} onChange={e => setNewForm(f => ({ ...f, unit: e.target.value }))}
                  className={cn(FIELD_SM, 'px-2')}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL_SM}>Cost price</label>
                <input type="number" step="0.01" value={newForm.cost_price} onChange={e => setNewForm(f => ({ ...f, cost_price: Number(e.target.value) }))}
                  className={cn(FIELD_SM, 'tabular-nums')} />
              </div>
              <div>
                <label className={LABEL_SM}>Selling price</label>
                <input type="number" step="0.01" value={newForm.selling_price} onChange={e => setNewForm(f => ({ ...f, selling_price: Number(e.target.value) }))}
                  className={cn(FIELD_SM, 'tabular-nums')} />
              </div>
              <div>
                <label className={LABEL_SM}>Reorder level</label>
                <input type="number" value={newForm.reorder_level} onChange={e => setNewForm(f => ({ ...f, reorder_level: Number(e.target.value) }))}
                  className={cn(FIELD_SM, 'tabular-nums')} />
              </div>
              <div>
                <label className={LABEL_SM}>Reorder qty</label>
                <input type="number" value={newForm.reorder_qty} onChange={e => setNewForm(f => ({ ...f, reorder_qty: Number(e.target.value) }))}
                  className={cn(FIELD_SM, 'tabular-nums')} />
              </div>
              <div>
                <label className={LABEL_SM}>Supplier</label>
                <input value={newForm.supplier_name} onChange={e => setNewForm(f => ({ ...f, supplier_name: e.target.value }))} placeholder="Supplier name"
                  className={FIELD_SM} />
              </div>
              <div>
                <label className={LABEL_SM}>Supplier contact</label>
                <input value={newForm.supplier_contact} onChange={e => setNewForm(f => ({ ...f, supplier_contact: e.target.value }))} placeholder="Email or phone"
                  className={FIELD_SM} />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL_SM}>Description</label>
                <textarea value={newForm.description} onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder="Optional description..."
                  className="w-full resize-none rounded-md border border-border/60 bg-foreground/[0.03] px-2.5 py-1.5 text-[11px] text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground/60 focus:border-primary/60" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddModal(false)} className="h-8 rounded-md px-4 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06]">Cancel</button>
              <button onClick={addProduct} disabled={savingNew || !newForm.name.trim()}
                className="flex h-8 items-center gap-1 rounded-md bg-primary px-4 text-[11px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105 disabled:opacity-30">
                <Plus className="h-3 w-3" /> {savingNew ? 'Adding' : 'Add product'}
              </button>
            </div>
          </div>
        </div>
      )}
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
