import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Search, Package, Edit, Trash2, AlertTriangle,
  Upload, Shuffle, ChevronDown, Filter, RefreshCw
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import StockAdjustmentModal from './StockAdjustmentModal';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  category_id?: string;
  unit: string;
  reorder_level: number;
  reorder_qty: number;
  cost_price: number;
  selling_price: number;
  supplier_name?: string;
  supplier_contact?: string;
  lead_time_days?: number;
  image_url?: string;
  totalQty?: number;
  category_name?: string;
}

interface Category { id: string; name: string; }
interface Location { id: string; name: string; is_default: boolean; }

const UNITS = ['pieces', 'kg', 'g', 'liters', 'ml', 'boxes', 'pairs', 'sets', 'meters', 'feet'];

function generateSKU(): string {
  return 'SKU-' + Math.random().toString(36).substring(2, 7).toUpperCase();
}

export default function InventoryProducts({ onRefreshDashboard, settings }: {
  onRefreshDashboard: () => void;
  settings: any;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'low' | 'zero'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [showAdjust, setShowAdjust] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', sku: generateSKU(), barcode: '', description: '',
    category_id: '', unit: 'pieces', reorder_level: 5, reorder_qty: 10,
    cost_price: 0, selling_price: 0, supplier_name: '', supplier_contact: '',
    lead_time_days: 0
  });

  useEffect(() => { if (user) { load(); } }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [{ data: prods }, { data: cats }, { data: locs }] = await Promise.all([
      supabase.from('inv_products').select(`
        *, inv_categories(name), inv_stock_levels(quantity)
      `).eq('user_id', user.id).eq('is_active', true).order('name'),
      supabase.from('inv_categories').select('*').eq('user_id', user.id).order('name'),
      supabase.from('inv_locations').select('*').eq('user_id', user.id).eq('is_active', true)
    ]);

    if (prods) {
      setProducts(prods.map(p => ({
        ...p,
        category_name: (p as any).inv_categories?.name,
        totalQty: ((p as any).inv_stock_levels || []).reduce((s: number, l: any) => s + (l.quantity || 0), 0)
      })));
    }
    setCategories(cats || []);
    setLocations(locs || []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      name: '', sku: generateSKU(), barcode: '', description: '',
      category_id: '', unit: 'pieces', reorder_level: 5, reorder_qty: 10,
      cost_price: 0, selling_price: 0, supplier_name: '', supplier_contact: '',
      lead_time_days: 0
    });
    setShowModal(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku, barcode: p.barcode || '', description: p.description || '',
      category_id: p.category_id || '', unit: p.unit, reorder_level: p.reorder_level,
      reorder_qty: p.reorder_qty, cost_price: p.cost_price, selling_price: p.selling_price,
      supplier_name: p.supplier_name || '', supplier_contact: p.supplier_contact || '',
      lead_time_days: p.lead_time_days || 0
    });
    setShowModal(true);
  }

  async function addCategory() {
    if (!newCategory.trim() || !user) return;
    const { data } = await supabase.from('inv_categories').insert({
      user_id: user.id, name: newCategory.trim()
    }).select().single();
    if (data) {
      setCategories(prev => [...prev, data]);
      setForm(f => ({ ...f, category_id: data.id }));
      setNewCategory('');
    }
  }

  async function saveProduct() {
    if (!user || !form.name.trim() || !form.sku.trim()) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: form.name.trim(), sku: form.sku.trim(),
        barcode: form.barcode || null, description: form.description || null,
        category_id: form.category_id || null, unit: form.unit,
        reorder_level: form.reorder_level, reorder_qty: form.reorder_qty,
        cost_price: form.cost_price, selling_price: form.selling_price,
        supplier_name: form.supplier_name || null, supplier_contact: form.supplier_contact || null,
        lead_time_days: form.lead_time_days || null
      };
      if (editing) {
        await supabase.from('inv_products').update(payload).eq('id', editing.id);
        toast({ title: 'Product updated' });
      } else {
        const { data: newProd } = await supabase.from('inv_products').insert(payload).select().single();
        // Init stock level in default location
        const defLoc = locations.find(l => l.is_default) || locations[0];
        if (newProd && defLoc) {
          await supabase.from('inv_stock_levels').insert({
            product_id: newProd.id, location_id: defLoc.id, quantity: 0
          });
        }
        toast({ title: 'Product added' });
      }
      setShowModal(false);
      load();
      onRefreshDashboard();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    await supabase.from('inv_products').update({ is_active: false }).eq('id', id);
    toast({ title: 'Product removed' });
    load();
    onRefreshDashboard();
  }

  function getStockStatus(p: Product) {
    if ((p.totalQty || 0) === 0) return 'zero';
    if ((p.totalQty || 0) <= p.reorder_level) return 'low';
    return 'ok';
  }

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || getStockStatus(p) === filterStatus;
    const matchCat = filterCategory === 'all' || p.category_id === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={filterStatus} onValueChange={v => setFilterStatus(v as any)}>
          <SelectTrigger className="h-8 w-28 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ok">In Stock</SelectItem>
            <SelectItem value="low">Low Stock</SelectItem>
            <SelectItem value="zero">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button size="sm" onClick={openAdd} className="h-8 gap-1.5 text-xs ml-auto">
          <Plus className="w-3.5 h-3.5" />Add Product
        </Button>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No products found</p>
          <p className="text-xs text-muted-foreground/60 mb-4">
            {products.length === 0 ? 'Add your first product to get started' : 'Try adjusting your filters'}
          </p>
          {products.length === 0 && (
            <Button size="sm" onClick={openAdd} className="gap-1.5">
              <Plus className="w-3.5 h-3.5" />Add Product
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => {
            const status = getStockStatus(p);
            return (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors">
                <div className={`w-2 h-8 rounded-full flex-shrink-0 ${
                  status === 'zero' ? 'bg-destructive' :
                  status === 'low' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    {p.category_name && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">{p.category_name}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{p.sku} · {p.unit}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-sm font-bold ${
                    status === 'zero' ? 'text-destructive' :
                    status === 'low' ? 'text-amber-500' : 'text-emerald-500'
                  }`}>{p.totalQty ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground">in stock</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                    onClick={() => setShowAdjust(p)}>
                    <Shuffle className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                    onClick={() => openEdit(p)}>
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive"
                    onClick={() => deleteProduct(p.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Product Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs">Product Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Blue Widget Pro" className="h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">SKU / Product Code *</Label>
                <div className="flex gap-1 mt-1">
                  <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    placeholder="SKU-001" className="h-8 text-xs" />
                  <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                    onClick={() => setForm(f => ({ ...f, sku: generateSKU() }))}>
                    <Shuffle className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs">Barcode</Label>
                <Input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))}
                  placeholder="Scan or type..." className="h-8 mt-1 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <div className="flex gap-1 mt-1">
                  <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                    <SelectTrigger className="h-8 text-xs flex-1">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      <div className="p-1 border-t">
                        <div className="flex gap-1">
                          <Input value={newCategory} onChange={e => setNewCategory(e.target.value)}
                            placeholder="New category" className="h-7 text-xs" />
                          <Button size="sm" className="h-7 text-xs px-2" onClick={addCategory}>Add</Button>
                        </div>
                      </div>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Unit</Label>
                <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                  <SelectTrigger className="h-8 text-xs mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="col-span-2">
              <Label className="text-xs">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description..." rows={2} className="mt-1 text-sm resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Reorder Level</Label>
                <Input type="number" value={form.reorder_level}
                  onChange={e => setForm(f => ({ ...f, reorder_level: Number(e.target.value) }))}
                  className="h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Reorder Qty</Label>
                <Input type="number" value={form.reorder_qty}
                  onChange={e => setForm(f => ({ ...f, reorder_qty: Number(e.target.value) }))}
                  className="h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Cost Price</Label>
                <Input type="number" step="0.01" value={form.cost_price}
                  onChange={e => setForm(f => ({ ...f, cost_price: Number(e.target.value) }))}
                  className="h-8 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Selling Price</Label>
                <Input type="number" step="0.01" value={form.selling_price}
                  onChange={e => setForm(f => ({ ...f, selling_price: Number(e.target.value) }))}
                  className="h-8 mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Supplier Name</Label>
                <Input value={form.supplier_name}
                  onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))}
                  placeholder="Supplier name" className="h-8 mt-1 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Supplier Contact</Label>
                <Input value={form.supplier_contact}
                  onChange={e => setForm(f => ({ ...f, supplier_contact: e.target.value }))}
                  placeholder="Email or phone" className="h-8 mt-1 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Lead Time (days)</Label>
                <Input type="number" value={form.lead_time_days}
                  onChange={e => setForm(f => ({ ...f, lead_time_days: Number(e.target.value) }))}
                  className="h-8 mt-1" />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={saveProduct} disabled={saving || !form.name || !form.sku}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Add Product'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Modal */}
      {showAdjust && (
        <StockAdjustmentModal
          product={showAdjust}
          locations={locations}
          onClose={() => setShowAdjust(null)}
          onSaved={() => { load(); onRefreshDashboard(); setShowAdjust(null); }}
        />
      )}
    </div>
  );
}
