/**
 * Products page — Shopify-style admin table.
 * Data-dense, checkbox per row, image thumbnail, name, status pill, inventory, price.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Package, Plus, Search, MoreHorizontal, Edit, Trash2, Copy, Eye, EyeOff,
  Star, Image as ImageIcon, Filter, Download, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';
import { ProductImageUploader } from '../shared/ProductImageUploader';

type ProductStatus = 'active' | 'draft' | 'archived';
interface Product {
  id: string; name: string; slug: string; price: number; compare_at_price: number | null;
  currency: string; sku: string | null; status: ProductStatus; is_featured: boolean;
  images: string[]; track_inventory: boolean; inventory_count: number; category_id: string | null;
  description: string | null;
}

const TABS: { id: 'all' | ProductStatus; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'draft', label: 'Draft' },
  { id: 'archived', label: 'Archived' },
];

const EMPTY: Partial<Product> = {
  name: '', slug: '', price: 0, compare_at_price: null, currency: 'GBP', sku: '',
  status: 'draft', is_featured: false, images: [], track_inventory: false,
  inventory_count: 0, description: '',
};

export default function ProductsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | ProductStatus>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Product>>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase.from('products').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    setProducts((data as unknown as Product[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p => {
    if (tab !== 'all' && p.status !== tab) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.sku || '').toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: products.length,
    active: products.filter(p => p.status === 'active').length,
    draft: products.filter(p => p.status === 'draft').length,
    archived: products.filter(p => p.status === 'archived').length,
  };

  const money = (n: number, c = 'GBP') =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: c }).format(n);

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? new Set(filtered.map(p => p.id)) : new Set());
  };
  const toggleOne = (id: string, checked: boolean) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const openNew  = () => { setEditing(EMPTY); setEditorOpen(true); };
  const openEdit = (p: Product) => { setEditing(p); setEditorOpen(true); };

  async function save() {
    if (!editing.name?.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    setSaving(true);
    const slug = (editing.slug || editing.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const payload = {
      user_id: user!.id,
      name: editing.name!.trim(),
      slug,
      price: Number(editing.price) || 0,
      compare_at_price: editing.compare_at_price ? Number(editing.compare_at_price) : null,
      currency: editing.currency || 'GBP',
      sku: editing.sku || null,
      status: editing.status || 'draft',
      is_featured: !!editing.is_featured,
      images: editing.images || [],
      track_inventory: !!editing.track_inventory,
      inventory_count: Number(editing.inventory_count) || 0,
      description: editing.description || null,
    };
    const { error } = editing.id
      ? await supabase.from('products').update(payload).eq('id', editing.id)
      : await supabase.from('products').insert(payload as any);
    setSaving(false);
    if (error) { toast({ title: 'Save failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: editing.id ? 'Product updated' : 'Product added' });
    setEditorOpen(false);
    load();
  }

  async function del(id: string) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    toast({ title: 'Product deleted' });
    load();
  }

  const selectedCount = selected.size;

  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Products']}
        title="Products"
        actions={
          <>
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs hidden sm:flex">
              <Download className="h-3.5 w-3.5 mr-1.5" /> Export
            </Button>
            <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs hidden sm:flex">
              <Upload className="h-3.5 w-3.5 mr-1.5" /> Import
            </Button>
            <Button size="sm" className="h-8 rounded-lg text-xs bg-foreground text-background hover:bg-foreground/90" onClick={openNew}>
              <Plus className="h-3.5 w-3.5 mr-1.5" /> Add product
            </Button>
          </>
        }
      />
      <PageBody>
        <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
          {/* Tabs bar (Shopify's All / Active / Draft / Archived) */}
          <div className="flex items-center gap-0.5 px-2 pt-2 border-b border-border/50 overflow-x-auto scrollbar-hide">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`h-8 px-3 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                  tab === t.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {t.label}
                <span className="ml-1.5 text-[11px] text-muted-foreground/70 tabular-nums">{counts[t.id]}</span>
              </button>
            ))}
            <button className="h-8 w-8 rounded-md text-muted-foreground hover:bg-muted/60 flex items-center justify-center ml-1" aria-label="Save view">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-2 p-2 border-b border-border/50">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search products"
                className="h-8 pl-8 rounded-md text-[13px] bg-background border-border/50"
              />
            </div>
            <Button variant="outline" size="sm" className="h-8 rounded-md text-xs">
              <Filter className="h-3.5 w-3.5 mr-1.5" /> Filter
            </Button>
          </div>

          {/* Bulk-action bar (appears when rows are selected) */}
          {selectedCount > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 border-b border-border/50 bg-muted/40">
              <span className="text-[12px] font-medium">{selectedCount} selected</span>
              <div className="h-4 w-px bg-border/60" />
              <button className="text-[12px] hover:underline">Set as active</button>
              <button className="text-[12px] hover:underline">Set as draft</button>
              <button className="text-[12px] hover:underline text-red-500">Delete</button>
              <div className="flex-1" />
              <button className="text-[12px] text-muted-foreground hover:text-foreground" onClick={() => setSelected(new Set())}>Clear</button>
            </div>
          )}

          {/* Table */}
          {loading ? (
            <div className="divide-y divide-border/50">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="grid grid-cols-[40px_44px_1fr_100px_120px_100px_40px] gap-4 items-center px-4 py-3">
                  <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                  <div className="h-11 w-11 rounded-md bg-muted animate-pulse" />
                  <div className="h-3.5 rounded bg-muted animate-pulse w-2/3" />
                  <div className="h-5 rounded bg-muted animate-pulse w-16" />
                  <div className="h-3.5 rounded bg-muted animate-pulse w-20" />
                  <div className="h-3.5 rounded bg-muted animate-pulse w-14" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Package}
                title={search || tab !== 'all' ? 'No products match your filters' : 'Add your first product'}
                description={search || tab !== 'all'
                  ? 'Try clearing your filters or searching for something else.'
                  : 'Start building your catalog. Products can be sold on your storefront, through the embed script, or via a shared checkout link.'}
                primaryAction={search || tab !== 'all' ? undefined : { label: 'Add product', onClick: openNew }}
              />
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[40px_44px_minmax(0,1fr)_120px_140px_120px_40px] gap-4 items-center px-4 py-2.5 bg-muted/30 border-b border-border/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <Checkbox
                  checked={selectedCount === filtered.length && filtered.length > 0}
                  onCheckedChange={v => toggleAll(!!v)}
                  aria-label="Select all"
                />
                <span />
                <span>Product</span>
                <span>Status</span>
                <span>Inventory</span>
                <span className="text-right">Price</span>
                <span />
              </div>

              <div className="divide-y divide-border/50">
                {filtered.map(p => {
                  const isSelected = selected.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`grid grid-cols-[40px_44px_minmax(0,1fr)_auto] md:grid-cols-[40px_44px_minmax(0,1fr)_120px_140px_120px_40px] gap-4 items-center px-4 py-3 hover:bg-muted/30 transition-colors ${
                        isSelected ? 'bg-emerald-500/[0.04]' : ''
                      }`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={v => toggleOne(p.id, !!v)}
                        aria-label={`Select ${p.name}`}
                      />
                      <div className="h-11 w-11 rounded-md bg-muted/50 overflow-hidden border border-border/40 shrink-0">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <button
                        className="text-left min-w-0"
                        onClick={() => openEdit(p)}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px] font-medium truncate group-hover:underline">{p.name}</span>
                          {p.is_featured && <Star className="h-3 w-3 text-amber-500 fill-current shrink-0" />}
                        </div>
                        {p.sku && <p className="text-[11px] text-muted-foreground truncate">SKU: {p.sku}</p>}
                      </button>
                      <div className="hidden md:flex items-center">
                        <StatusPill status={p.status} />
                      </div>
                      <div className="hidden md:block text-[12px] tabular-nums">
                        {p.track_inventory ? (
                          <span className={p.inventory_count > 0 ? 'text-foreground' : 'text-red-500'}>
                            {p.inventory_count > 0 ? `${p.inventory_count} in stock` : 'Out of stock'}
                          </span>
                        ) : <span className="text-muted-foreground/60">Not tracked</span>}
                      </div>
                      <div className="hidden md:block text-right text-[13px] font-semibold tabular-nums">{money(p.price, p.currency)}</div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => openEdit(p)} className="text-xs"><Edit className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-xs"><Copy className="h-3.5 w-3.5 mr-2" /> Duplicate</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => del(p.id)} className="text-xs text-red-500"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </PageBody>

      {/* Product editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Edit product' : 'Add product'}</DialogTitle>
            <DialogDescription>Product details, pricing, and inventory tracking.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div>
              <Label htmlFor="name" className="text-xs">Title</Label>
              <Input id="name" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} placeholder="Short sleeve t-shirt" />
            </div>
            <div>
              <Label htmlFor="desc" className="text-xs">Description</Label>
              <Textarea id="desc" value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price" className="text-xs">Price</Label>
                <Input id="price" type="number" step="0.01" value={editing.price || 0} onChange={e => setEditing({ ...editing, price: Number(e.target.value) })} />
              </div>
              <div>
                <Label htmlFor="compare" className="text-xs">Compare-at price</Label>
                <Input id="compare" type="number" step="0.01" value={editing.compare_at_price || ''} onChange={e => setEditing({ ...editing, compare_at_price: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div>
                <Label htmlFor="sku" className="text-xs">SKU</Label>
                <Input id="sku" value={editing.sku || ''} onChange={e => setEditing({ ...editing, sku: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="stock" className="text-xs">Inventory</Label>
                <Input id="stock" type="number" value={editing.inventory_count || 0} onChange={e => setEditing({ ...editing, inventory_count: Number(e.target.value) })} />
              </div>
            </div>
            <ProductImageUploader
              userId={user?.id}
              images={editing.images || []}
              onChange={(imgs) => setEditing({ ...editing, images: imgs })}
            />

            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div>
                <Label className="text-xs">Track inventory</Label>
                <p className="text-[11px] text-muted-foreground">Show stock counts and out-of-stock state</p>
              </div>
              <Switch checked={!!editing.track_inventory} onCheckedChange={v => setEditing({ ...editing, track_inventory: v })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div>
                <Label className="text-xs">Status</Label>
                <p className="text-[11px] text-muted-foreground">Draft is hidden from customers</p>
              </div>
              <div className="flex gap-1">
                {(['draft','active','archived'] as ProductStatus[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setEditing({ ...editing, status: s })}
                    className={`h-7 px-2.5 rounded-md text-[11px] font-medium ${
                      editing.status === s ? 'bg-foreground text-background' : 'bg-muted text-foreground'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : (editing.id ? 'Save changes' : 'Add product')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatusPill({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, { label: string; cls: string }> = {
    active:   { label: 'Active',   cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25' },
    draft:    { label: 'Draft',    cls: 'bg-muted text-muted-foreground border-border/50' },
    archived: { label: 'Archived', cls: 'bg-muted/60 text-muted-foreground/70 border-border/40' },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${m.cls}`}>
      {m.label}
    </span>
  );
}
