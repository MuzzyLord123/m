import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import { useToast } from '@/hooks/use-toast';
import {
  Plus, Search, MoreHorizontal, Edit, Trash2, Copy, Eye, EyeOff,
  Package, Tag, Image as ImageIcon, Star,
  Grid3X3, List, Layers, ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  PageHeader, Panel, PanelHeader, StatusBadge, DataTable, type Column,
  EmptyState, SkeletonLedger,
} from '@/components/platform';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  cost_price: number | null;
  currency: string;
  sku: string | null;
  barcode: string | null;
  track_inventory: boolean;
  inventory_count: number;
  weight: number | null;
  weight_unit: string;
  status: string;
  is_featured: boolean;
  is_digital: boolean;
  images: string[];
  tags: string[];
  category_id: string | null;
  site_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price: number | null;
  compare_at_price: number | null;
  inventory_count: number;
  options: Record<string, string>;
  image_url: string | null;
  is_default: boolean;
  sort_order: number;
}

const EMPTY_PRODUCT: Partial<Product> = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  price: 0,
  compare_at_price: null,
  cost_price: null,
  currency: 'GBP',
  sku: '',
  barcode: '',
  track_inventory: false,
  inventory_count: 0,
  weight: null,
  weight_unit: 'kg',
  status: 'draft',
  is_featured: false,
  is_digital: false,
  images: [],
  tags: [],
  category_id: null,
  site_id: null,
};

const TAB_TRIGGER =
  'relative -mb-px gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] text-muted-foreground shadow-none transition-colors duration-150 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none';

const FORM_SECTION_LABEL =
  'font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground';

export default function LoungeProducts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sites, setSites] = useState<{ id: string; site_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>(EMPTY_PRODUCT);
  const [editingCategory, setEditingCategory] = useState<Partial<Category>>({ name: '', slug: '', description: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [editingVariant, setEditingVariant] = useState<Partial<ProductVariant>>({ name: '', price: null, inventory_count: 0, options: {} });
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState('products');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [prodRes, catRes, siteRes] = await Promise.all([
      supabase.from('products').select('*').eq('user_id', user.id).order('sort_order', { ascending: true }),
      supabase.from('product_categories').select('*').eq('user_id', user.id).order('sort_order', { ascending: true }),
      supabase.from('designer_sites').select('id, site_name').eq('user_id', user.id),
    ]);
    if (prodRes.data) setProducts(prodRes.data as unknown as Product[]);
    if (catRes.data) setCategories(catRes.data as unknown as Category[]);
    if (siteRes.data) setSites(siteRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    draft: products.filter(p => p.status === 'draft').length,
    featured: products.filter(p => p.is_featured).length,
  };

  const saveProduct = async () => {
    if (!user || !editingProduct.name) return;
    setSaving(true);
    const slug = editingProduct.slug || slugify(editingProduct.name);
    const payload = {
      ...editingProduct,
      slug,
      user_id: user.id,
      images: editingProduct.images || [],
      tags: editingProduct.tags || [],
    };

    let error;
    if (isEditing && editingProduct.id) {
      const { error: e } = await supabase.from('products').update(payload as any).eq('id', editingProduct.id);
      error = e;
    } else {
      const { error: e } = await supabase.from('products').insert(payload as any);
      error = e;
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isEditing ? 'Product updated' : 'Product created' });
      setProductDialogOpen(false);
      setEditingProduct(EMPTY_PRODUCT);
      setIsEditing(false);
      fetchData();
    }
    setSaving(false);
  };

  const saveCategory = async () => {
    if (!user || !editingCategory.name) return;
    setSaving(true);
    const slug = editingCategory.slug || slugify(editingCategory.name);
    const payload = { ...editingCategory, slug, user_id: user.id };

    let error;
    if (editingCategory.id) {
      const { error: e } = await supabase.from('product_categories').update(payload as any).eq('id', editingCategory.id);
      error = e;
    } else {
      const { error: e } = await supabase.from('product_categories').insert(payload as any);
      error = e;
    }

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingCategory.id ? 'Category updated' : 'Category created' });
      setCategoryDialogOpen(false);
      setEditingCategory({ name: '', slug: '', description: '' });
      fetchData();
    }
    setSaving(false);
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Product deleted' });
      fetchData();
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('product_categories').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Category deleted' });
      fetchData();
    }
  };

  const duplicateProduct = async (product: Product) => {
    if (!user) return;
    const { id, created_at, updated_at, ...rest } = product;
    const { error } = await supabase.from('products').insert({
      ...rest,
      name: `${product.name} (Copy)`,
      slug: `${product.slug}-copy-${Date.now()}`,
      status: 'draft',
      user_id: user.id,
    } as any);
    if (!error) {
      toast({ title: 'Product duplicated' });
      fetchData();
    }
  };

  const toggleStatus = async (product: Product) => {
    const newStatus = product.status === 'active' ? 'draft' : 'active';
    await supabase.from('products').update({ status: newStatus }).eq('id', product.id);
    fetchData();
  };

  const toggleFeatured = async (product: Product) => {
    await supabase.from('products').update({ is_featured: !product.is_featured }).eq('id', product.id);
    fetchData();
  };

  const fetchVariants = async (productId: string) => {
    const { data } = await supabase.from('product_variants').select('*').eq('product_id', productId).order('sort_order');
    if (data) setVariants(data as unknown as ProductVariant[]);
  };

  const saveVariant = async () => {
    if (!activeProductId || !editingVariant.name) return;
    setSaving(true);
    const payload = { ...editingVariant, product_id: activeProductId };
    let error;
    if (editingVariant.id) {
      const { error: e } = await supabase.from('product_variants').update(payload as any).eq('id', editingVariant.id);
      error = e;
    } else {
      const { error: e } = await supabase.from('product_variants').insert(payload as any);
      error = e;
    }
    if (!error) {
      fetchVariants(activeProductId);
      setEditingVariant({ name: '', price: null, inventory_count: 0, options: {} });
    }
    setSaving(false);
  };

  const deleteVariant = async (id: string) => {
    await supabase.from('product_variants').delete().eq('id', id);
    if (activeProductId) fetchVariants(activeProductId);
  };

  const addTag = () => {
    if (tagInput.trim() && editingProduct.tags && !editingProduct.tags.includes(tagInput.trim())) {
      setEditingProduct(prev => ({ ...prev, tags: [...(prev.tags || []), tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setEditingProduct(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }));
  };

  const addImage = () => {
    if (imageUrlInput.trim()) {
      setEditingProduct(prev => ({ ...prev, images: [...(prev.images || []), imageUrlInput.trim()] }));
      setImageUrlInput('');
    }
  };

  const removeImage = (idx: number) => {
    setEditingProduct(prev => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== idx) }));
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(price);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Uncategorized';
    return categories.find(c => c.id === categoryId)?.name || 'Unknown';
  };

  const productMenu = (product: Product) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" aria-label="Product actions">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => { setEditingProduct(product); setIsEditing(true); setProductDialogOpen(true); }} className="text-xs">
          <Edit className="mr-2 h-3.5 w-3.5" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => duplicateProduct(product)} className="text-xs">
          <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleFeatured(product)} className="text-xs">
          <Star className="mr-2 h-3.5 w-3.5" /> {product.is_featured ? 'Unfeature' : 'Feature'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toggleStatus(product)} className="text-xs">
          {product.status === 'active' ? <EyeOff className="mr-2 h-3.5 w-3.5" /> : <Eye className="mr-2 h-3.5 w-3.5" />}
          {product.status === 'active' ? 'Set draft' : 'Publish'}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { setActiveProductId(product.id); fetchVariants(product.id); setVariantDialogOpen(true); }} className="text-xs">
          <Layers className="mr-2 h-3.5 w-3.5" /> Variants
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-xs text-destructive" onClick={() => deleteProduct(product.id)}>
          <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const listColumns: Column<Product>[] = [
    {
      key: 'product',
      header: 'Product',
      sortValue: p => p.name.toLowerCase(),
      render: p => (
        <div className="flex min-w-0 items-center gap-3 py-1.5">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-md border border-border/60 bg-sunken">
            {p.images?.[0] ? (
              <img src={p.images[0]} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground/40" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-[450] text-foreground">{p.name}</span>
              {p.is_featured && <Star className="h-3 w-3 shrink-0 fill-current text-foreground" aria-label="Featured" />}
            </div>
            <p className="truncate text-[11px] text-muted-foreground">
              {getCategoryName(p.category_id) || 'Uncategorised'}
              {p.sku && ` · ${p.sku}`}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      hideBelowMd: true,
      sortValue: p => p.status,
      render: p => <StatusBadge status={p.status} />,
      width: '120px',
    },
    {
      key: 'inventory',
      header: 'Inventory',
      align: 'right',
      mono: true,
      hideBelowMd: true,
      sortValue: p => (p.track_inventory ? p.inventory_count : null),
      render: p =>
        p.track_inventory ? (
          <span className={p.inventory_count > 0 ? 'text-foreground' : 'text-risk'}>{p.inventory_count}</span>
        ) : (
          <span className="text-muted-foreground/60">—</span>
        ),
      width: '110px',
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      mono: true,
      sortValue: p => p.price,
      render: p => <span className="font-medium text-foreground">{formatPrice(p.price, p.currency)}</span>,
      width: '110px',
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: p => productMenu(p),
      width: '48px',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1280px] space-y-5 px-5 py-7 lg:px-8">
        <PageHeader
          kicker="E-commerce"
          title="Products"
          description="Your catalogue, categories and orders"
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => { setCategoryDialogOpen(true); setEditingCategory({ name: '', slug: '', description: '' }); }}
              >
                <Tag className="mr-1.5 h-3.5 w-3.5" /> New category
              </Button>
              <Button
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => { setProductDialogOpen(true); setEditingProduct(EMPTY_PRODUCT); setIsEditing(false); }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Add product
              </Button>
            </>
          }
        />

        {/* Quiet stat strip */}
        <Panel as="div">
          <div className="grid grid-cols-2 divide-x divide-border/60 lg:grid-cols-4">
            {[
              { label: 'Total products', value: stats.total },
              { label: 'Active', value: stats.active },
              { label: 'Drafts', value: stats.draft },
              { label: 'Featured', value: stats.featured },
            ].map(stat => (
              <div key={stat.label} className="px-4 py-3">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <div className="flex items-center gap-1 border-b border-border/60">
            <TabsList className="h-auto gap-1 rounded-none border-0 bg-transparent p-0">
              <TabsTrigger value="products" className={TAB_TRIGGER}>
                <Package className="h-3.5 w-3.5" /> Products
                <span className="text-[10px] tabular-nums text-muted-foreground">{stats.total}</span>
              </TabsTrigger>
              <TabsTrigger value="categories" className={TAB_TRIGGER}>
                <Tag className="h-3.5 w-3.5" /> Categories
                <span className="text-[10px] tabular-nums text-muted-foreground">{categories.length}</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className={TAB_TRIGGER}>
                <ShoppingCart className="h-3.5 w-3.5" /> Orders
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Products Tab */}
          <TabsContent value="products" className="mt-0 space-y-4">
            {/* Filter bar */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU or tag"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-9 rounded-lg border-border/60 bg-background pl-9 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px] rounded-lg border-border/60 bg-background text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All statuses</SelectItem>
                  <SelectItem value="active" className="text-xs">Active</SelectItem>
                  <SelectItem value="draft" className="text-xs">Draft</SelectItem>
                  <SelectItem value="archived" className="text-xs">Archived</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 w-[160px] rounded-lg border-border/60 bg-background text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-0.5 rounded-lg border border-border/60 bg-background p-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-md ${viewMode === 'grid' ? 'bg-sunken' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-md ${viewMode === 'list' ? 'bg-sunken' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Product Grid/List */}
            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
                    <div className="aspect-square animate-pulse bg-foreground/[0.04]" />
                    <div className="space-y-2 p-3.5">
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-foreground/[0.06]" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-foreground/[0.05]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Panel as="div">
                <EmptyState
                  title={searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' ? 'No products match your filters' : 'No products yet'}
                  body={
                    searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                      ? 'Try clearing your filters or searching for something else.'
                      : 'Add your first product to start building your catalogue. Products appear on your storefront and through the embed script.'
                  }
                  action={{
                    label: 'Add product',
                    onClick: () => { setProductDialogOpen(true); setEditingProduct(EMPTY_PRODUCT); setIsEditing(false); },
                  }}
                />
              </Panel>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map(product => (
                  <div key={product.id} className="group flex flex-col overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:border-border">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden bg-sunken">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/25" />
                        </div>
                      )}
                      {/* Status: dot + label chip */}
                      <div className="absolute left-2 top-2 flex gap-1.5">
                        <span className="inline-flex items-center rounded-md border border-border/60 bg-card/95 px-1.5 py-0.5">
                          <StatusBadge status={product.status} className="text-[10px]" />
                        </span>
                        {product.is_featured && (
                          <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-card/95 px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                            <Star className="h-2.5 w-2.5 fill-current" aria-label="Featured" />
                          </span>
                        )}
                      </div>
                      <div className="absolute right-2 top-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                        {productMenu(product)}
                      </div>
                    </div>
                    {/* Body */}
                    <div className="flex flex-1 flex-col space-y-2 p-3.5">
                      <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-medium leading-tight">{product.name}</h3>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {getCategoryName(product.category_id) || 'Uncategorised'}
                          {product.sku && <span className="text-muted-foreground/60"> · {product.sku}</span>}
                        </p>
                      </div>
                      <div className="mt-auto flex items-baseline gap-1.5">
                        <span className="text-[15px] font-semibold tabular-nums tracking-tight">{formatPrice(product.price, product.currency)}</span>
                        {product.compare_at_price ? (
                          <span className="text-[11px] tabular-nums text-muted-foreground line-through">{formatPrice(product.compare_at_price, product.currency)}</span>
                        ) : null}
                        {product.track_inventory && (
                          <span className={`ml-auto text-[10px] tabular-nums ${product.inventory_count > 0 ? 'text-muted-foreground' : 'text-risk'}`}>
                            {product.inventory_count > 0 ? `${product.inventory_count} in stock` : 'Out of stock'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Panel as="div" className="overflow-hidden">
                <DataTable
                  rows={filteredProducts}
                  columns={listColumns}
                  rowKey={p => p.id}
                  aria-label="Products"
                />
              </Panel>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="mt-0 space-y-4">
            {categories.length === 0 ? (
              <Panel as="div">
                <EmptyState
                  title="No categories yet"
                  body="Categories group related products so customers can browse a specific collection on your storefront."
                  action={{ label: 'Create category', onClick: () => setCategoryDialogOpen(true) }}
                />
              </Panel>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map(cat => {
                  const count = products.filter(p => p.category_id === cat.id).length;
                  return (
                    <div key={cat.id} className="group rounded-[10px] border border-border/60 bg-card p-4 transition-colors duration-150 hover:border-border">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[14px] font-medium tracking-tight">{cat.name}</h3>
                          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">/{cat.slug}</p>
                          {cat.description && <p className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">{cat.description}</p>}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md opacity-0 transition-opacity duration-150 group-hover:opacity-100" aria-label="Category actions">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => { setEditingCategory(cat); setCategoryDialogOpen(true); }} className="text-xs"><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs text-destructive" onClick={() => deleteCategory(cat.id)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                        <span className="tabular-nums">{count} {count === 1 ? 'product' : 'products'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-0 space-y-4">
            <OrdersPanel userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>


      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">{isEditing ? 'Edit product' : 'Add product'}</DialogTitle>
            <DialogDescription className="text-[12.5px]">Fill in the product details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className={FORM_SECTION_LABEL}>Basic info</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-xs">Product name</Label>
                  <Input value={editingProduct.name || ''} onChange={e => setEditingProduct(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))} placeholder="e.g. Classic T-Shirt" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label className="text-xs">Slug</Label>
                  <Input value={editingProduct.slug || ''} onChange={e => setEditingProduct(p => ({ ...p, slug: e.target.value }))} placeholder="classic-t-shirt" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Short description</Label>
                <Input value={editingProduct.short_description || ''} onChange={e => setEditingProduct(p => ({ ...p, short_description: e.target.value }))} placeholder="Brief summary" />
              </div>
              <div>
                <Label className="text-xs">Full description</Label>
                <Textarea value={editingProduct.description || ''} onChange={e => setEditingProduct(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Detailed product description..." />
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-3">
              <h4 className={FORM_SECTION_LABEL}>Pricing</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <Label className="text-xs">Price</Label>
                  <Input type="number" step="0.01" value={editingProduct.price || ''} onChange={e => setEditingProduct(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label className="text-xs">Compare at</Label>
                  <Input type="number" step="0.01" value={editingProduct.compare_at_price || ''} onChange={e => setEditingProduct(p => ({ ...p, compare_at_price: parseFloat(e.target.value) || null }))} />
                </div>
                <div>
                  <Label className="text-xs">Cost price</Label>
                  <Input type="number" step="0.01" value={editingProduct.cost_price || ''} onChange={e => setEditingProduct(p => ({ ...p, cost_price: parseFloat(e.target.value) || null }))} />
                </div>
                <div>
                  <Label className="text-xs">Currency</Label>
                  <Select value={editingProduct.currency || 'GBP'} onValueChange={v => setEditingProduct(p => ({ ...p, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <Separator />

            {/* Organization */}
            <div className="space-y-3">
              <h4 className={FORM_SECTION_LABEL}>Organisation</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Category</Label>
                  <Select value={editingProduct.category_id || 'none'} onValueChange={v => setEditingProduct(p => ({ ...p, category_id: v === 'none' ? null : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Website</Label>
                  <Select value={editingProduct.site_id || 'none'} onValueChange={v => setEditingProduct(p => ({ ...p, site_id: v === 'none' ? null : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Sites</SelectItem>
                      {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={editingProduct.status || 'draft'} onValueChange={v => setEditingProduct(p => ({ ...p, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={editingProduct.is_featured || false} onCheckedChange={v => setEditingProduct(p => ({ ...p, is_featured: v }))} />
                    <Label className="text-xs">Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editingProduct.is_digital || false} onCheckedChange={v => setEditingProduct(p => ({ ...p, is_digital: v }))} />
                    <Label className="text-xs">Digital</Label>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Inventory */}
            <div className="space-y-3">
              <h4 className={FORM_SECTION_LABEL}>Inventory and shipping</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <Label className="text-xs">SKU</Label>
                  <Input value={editingProduct.sku || ''} onChange={e => setEditingProduct(p => ({ ...p, sku: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Barcode</Label>
                  <Input value={editingProduct.barcode || ''} onChange={e => setEditingProduct(p => ({ ...p, barcode: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Weight</Label>
                  <Input type="number" step="0.1" value={editingProduct.weight || ''} onChange={e => setEditingProduct(p => ({ ...p, weight: parseFloat(e.target.value) || null }))} />
                </div>
                <div>
                  <Label className="text-xs">Weight unit</Label>
                  <Select value={editingProduct.weight_unit || 'kg'} onValueChange={v => setEditingProduct(p => ({ ...p, weight_unit: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="g">g</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="oz">oz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Switch checked={editingProduct.track_inventory || false} onCheckedChange={v => setEditingProduct(p => ({ ...p, track_inventory: v }))} />
                <Label className="text-xs">Track inventory</Label>
                {editingProduct.track_inventory && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Stock</Label>
                    <Input type="number" className="w-20 h-8" value={editingProduct.inventory_count || 0} onChange={e => setEditingProduct(p => ({ ...p, inventory_count: parseInt(e.target.value) || 0 }))} />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Images */}
            <div className="space-y-3">
              <h4 className={FORM_SECTION_LABEL}>Images</h4>
              <div className="flex gap-2">
                <Input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="Paste image URL..." className="flex-1" onKeyDown={e => e.key === 'Enter' && addImage()} />
                <Button variant="outline" size="sm" onClick={addImage} aria-label="Add image"><Plus className="h-4 w-4" /></Button>
              </div>
              {(editingProduct.images || []).length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {(editingProduct.images || []).map((img, idx) => (
                    <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg bg-sunken">
                      <img src={img} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => removeImage(idx)} aria-label="Remove image" className="absolute right-1 top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-3">
              <h4 className={FORM_SECTION_LABEL}>Tags</h4>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag..." className="flex-1" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <Button variant="outline" size="sm" onClick={addTag} aria-label="Add tag"><Plus className="h-4 w-4" /></Button>
              </div>
              {(editingProduct.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(editingProduct.tags || []).map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer gap-1" onClick={() => removeTag(tag)}>
                      {tag} <Trash2 className="h-2.5 w-2.5" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={saveProduct} disabled={saving || !editingProduct.name}>{saving ? 'Saving' : isEditing ? 'Update product' : 'Create product'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">{editingCategory.id ? 'Edit category' : 'Add category'}</DialogTitle>
            <DialogDescription className="text-[12.5px]">Group related products together</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={editingCategory.name || ''} onChange={e => setEditingCategory(c => ({ ...c, name: e.target.value, slug: slugify(e.target.value) }))} placeholder="e.g. Electronics" />
            </div>
            <div>
              <Label className="text-xs">Slug</Label>
              <Input value={editingCategory.slug || ''} onChange={e => setEditingCategory(c => ({ ...c, slug: e.target.value }))} />
            </div>
            <div>
              <Label className="text-xs">Description</Label>
              <Textarea value={editingCategory.description || ''} onChange={e => setEditingCategory(c => ({ ...c, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label className="text-xs">Image URL</Label>
              <Input value={editingCategory.image_url || ''} onChange={e => setEditingCategory(c => ({ ...c, image_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={saveCategory} disabled={saving || !editingCategory.name}>{saving ? 'Saving' : editingCategory.id ? 'Update category' : 'Create category'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variants Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Product variants</DialogTitle>
            <DialogDescription className="text-[12.5px]">Add sizes, colours or other options</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing variants */}
            {variants.length > 0 && (
              <div className="rounded-lg border border-border/60">
                {variants.map(v => (
                  <div key={v.id} className="flex items-center justify-between border-t border-border/60 px-3 py-2.5 first:border-t-0">
                    <div>
                      <p className="text-[13px] font-medium">{v.name}</p>
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {v.price !== null && formatPrice(v.price, 'GBP')} {v.sku && `· SKU: ${v.sku}`} · Stock: {v.inventory_count}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-risk" aria-label="Delete variant" onClick={() => deleteVariant(v.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {/* Add variant form */}
            <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
              <h4 className={FORM_SECTION_LABEL}>Add variant</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input value={editingVariant.name || ''} onChange={e => setEditingVariant(v => ({ ...v, name: e.target.value }))} placeholder="e.g. Large / Red" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">SKU</Label>
                  <Input value={editingVariant.sku || ''} onChange={e => setEditingVariant(v => ({ ...v, sku: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Price override</Label>
                  <Input type="number" step="0.01" value={editingVariant.price || ''} onChange={e => setEditingVariant(v => ({ ...v, price: parseFloat(e.target.value) || null }))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Stock</Label>
                  <Input type="number" value={editingVariant.inventory_count || 0} onChange={e => setEditingVariant(v => ({ ...v, inventory_count: parseInt(e.target.value) || 0 }))} className="h-8 text-sm" />
                </div>
              </div>
              <Button size="sm" className="h-8 w-full rounded-lg text-xs" onClick={saveVariant} disabled={saving || !editingVariant.name}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add variant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* Orders Panel sub-component */
function OrdersPanel({ userId }: { userId?: string }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.from('site_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (data) setOrders(data);
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <Panel as="div">
        <SkeletonLedger rows={4} />
      </Panel>
    );
  }

  if (orders.length === 0) {
    return (
      <Panel as="div">
        <EmptyState
          title="No orders yet"
          body="Orders from your website will appear here."
        />
      </Panel>
    );
  }

  return (
    <Panel as="div">
      <PanelHeader label="Orders" />
      {orders.map(order => (
        <div key={order.id} className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3 first:border-t-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] font-medium tabular-nums">{order.order_number}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {order.customer_email} · {new Date(order.created_at).toLocaleDateString('en-GB')}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[13px] font-semibold tabular-nums">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: order.currency || 'GBP' }).format(order.total)}</p>
            <p className="text-xs tabular-nums text-muted-foreground">{(order.items as any[])?.length || 0} items</p>
          </div>
        </div>
      ))}
    </Panel>
  );
}
