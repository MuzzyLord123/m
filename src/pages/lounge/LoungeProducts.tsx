import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Copy, Eye, EyeOff,
  Package, Tag, Image as ImageIcon, Star, Archive, ChevronDown, Upload,
  Grid3X3, List, ArrowUpDown, DollarSign, Box, Layers, ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'draft': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'archived': return 'bg-muted text-muted-foreground border-border';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Section header — used identically across every E-commerce page */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="h-9 w-9 rounded-lg bg-foreground/[0.04] border border-border/40 flex items-center justify-center shrink-0">
              <Package className="h-4 w-4 text-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground/80 mb-0.5">
                <span>E-commerce</span>
                <span className="text-muted-foreground/40">/</span>
                <span className="text-foreground/70">Products</span>
              </div>
              <h1 className="text-[17px] font-semibold tracking-tight leading-none">Products</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => { setCategoryDialogOpen(true); setEditingCategory({ name: '', slug: '', description: '' }); }}
            >
              <Tag className="w-3.5 h-3.5 mr-1.5" /> New category
            </Button>
            <Button
              size="sm"
              className="h-8 rounded-lg text-xs"
              onClick={() => { setProductDialogOpen(true); setEditingProduct(EMPTY_PRODUCT); setIsEditing(false); }}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> Add product
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats — restrained, no coloured icon tiles, one accent only where it matters */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total products', value: stats.total, hint: 'in catalog' },
            { label: 'Active', value: stats.active, hint: 'visible to customers' },
            { label: 'Drafts', value: stats.draft, hint: 'not yet published' },
            { label: 'Featured', value: stats.featured, hint: 'promoted' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl border border-border/40 bg-card/40 p-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-semibold tabular-nums mt-1.5 tracking-tight">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-1">{stat.hint}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
          <TabsList className="h-9 bg-muted/50 p-0.5 rounded-lg">
            <TabsTrigger value="products" className="h-8 rounded-md text-xs data-[state=active]:bg-background">
              <Package className="w-3.5 h-3.5 mr-1.5" /> Products
              <span className="ml-1.5 text-[10px] text-muted-foreground tabular-nums">{stats.total}</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="h-8 rounded-md text-xs data-[state=active]:bg-background">
              <Tag className="w-3.5 h-3.5 mr-1.5" /> Categories
              <span className="ml-1.5 text-[10px] text-muted-foreground tabular-nums">{categories.length}</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="h-8 rounded-md text-xs data-[state=active]:bg-background">
              <ShoppingCart className="w-3.5 h-3.5 mr-1.5" /> Orders
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4 mt-0">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, SKU or tag…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-lg text-sm bg-background border-border/50"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] h-9 rounded-lg text-xs bg-background border-border/50">
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
                <SelectTrigger className="w-[160px] h-9 rounded-lg text-xs bg-background border-border/50">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">All categories</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex gap-0.5 border border-border/50 rounded-lg p-0.5 bg-background">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-md ${viewMode === 'grid' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-md ${viewMode === 'list' ? 'bg-muted' : ''}`}
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Product Grid/List */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1,2,3,4,5,6,7,8].map(i => (
                  <div key={i} className="rounded-xl border border-border/40 bg-card/30 overflow-hidden">
                    <div className="aspect-square bg-muted/50 animate-pulse" />
                    <div className="p-3.5 space-y-2">
                      <div className="h-3.5 rounded bg-muted/50 animate-pulse w-3/4" />
                      <div className="h-3 rounded bg-muted/50 animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/50 bg-card/20 py-20 px-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-foreground/[0.04] border border-border/40 mx-auto flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold tracking-tight">
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' ? 'No products match your filters' : 'No products yet'}
                </h3>
                <p className="text-[13px] text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Try clearing your filters or searching for something else.'
                    : 'Add your first product to start building your catalog. Products will appear on your storefront and be available through the embed script.'}
                </p>
                <Button
                  size="sm"
                  className="mt-5 h-9 rounded-lg text-xs"
                  onClick={() => { setProductDialogOpen(true); setEditingProduct(EMPTY_PRODUCT); setIsEditing(false); }}
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add your first product
                </Button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map(product => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="group rounded-xl border border-border/40 bg-card/40 hover:border-border hover:bg-card/70 hover:shadow-sm transition-all overflow-hidden flex flex-col">
                        {/* Image */}
                        <div className="relative aspect-square bg-muted/40 overflow-hidden">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-8 h-8 text-muted-foreground/25" />
                            </div>
                          )}
                          {/* Restrained status: dot + label chip */}
                          <div className="absolute top-2 left-2 flex gap-1.5">
                            <span className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-background/85 backdrop-blur-md border border-border/40 text-foreground">
                              <span className={`h-1.5 w-1.5 rounded-full ${
                                product.status === 'active' ? 'bg-emerald-500' :
                                product.status === 'draft' ? 'bg-amber-500' :
                                'bg-muted-foreground/40'
                              }`} />
                              {product.status}
                            </span>
                            {product.is_featured && (
                              <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-background/85 backdrop-blur-md border border-border/40 text-foreground">
                                <Star className="w-2.5 h-2.5 fill-current" />
                              </span>
                            )}
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="h-7 w-7 rounded-md bg-background/85 backdrop-blur-md border border-border/40 hover:bg-background">
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem onClick={() => { setEditingProduct(product); setIsEditing(true); setProductDialogOpen(true); }} className="text-xs">
                                  <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => duplicateProduct(product)} className="text-xs">
                                  <Copy className="w-3.5 h-3.5 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleFeatured(product)} className="text-xs">
                                  <Star className="w-3.5 h-3.5 mr-2" /> {product.is_featured ? 'Unfeature' : 'Feature'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toggleStatus(product)} className="text-xs">
                                  {product.status === 'active' ? <EyeOff className="w-3.5 h-3.5 mr-2" /> : <Eye className="w-3.5 h-3.5 mr-2" />}
                                  {product.status === 'active' ? 'Set draft' : 'Publish'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { setActiveProductId(product.id); fetchVariants(product.id); setVariantDialogOpen(true); }} className="text-xs">
                                  <Layers className="w-3.5 h-3.5 mr-2" /> Variants
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-xs text-destructive" onClick={() => deleteProduct(product.id)}>
                                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {/* Body */}
                        <div className="p-3.5 space-y-2 flex-1 flex flex-col">
                          <div className="min-w-0">
                            <h3 className="font-medium text-[13px] truncate leading-tight">{product.name}</h3>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {getCategoryName(product.category_id) || 'Uncategorised'}
                              {product.sku && <span className="text-muted-foreground/60"> · {product.sku}</span>}
                            </p>
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-auto">
                            <span className="font-semibold text-[15px] tabular-nums tracking-tight">{formatPrice(product.price, product.currency)}</span>
                            {product.compare_at_price ? (
                              <span className="text-[11px] text-muted-foreground line-through tabular-nums">{formatPrice(product.compare_at_price, product.currency)}</span>
                            ) : null}
                            {product.track_inventory && (
                              <span className={`ml-auto text-[10px] tabular-nums ${product.inventory_count > 0 ? 'text-muted-foreground' : 'text-red-500'}`}>
                                {product.inventory_count > 0 ? `${product.inventory_count} in stock` : 'Out of stock'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="rounded-xl border border-border/40 bg-card/30 overflow-hidden divide-y divide-border/40">
                {/* Table header */}
                <div className="hidden md:grid grid-cols-[1fr_120px_120px_100px_40px] gap-4 px-4 py-2.5 bg-muted/30 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <div>Product</div>
                  <div>Status</div>
                  <div className="text-right">Inventory</div>
                  <div className="text-right">Price</div>
                  <div />
                </div>
                {filteredProducts.map(product => (
                  <div key={product.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_120px_100px_40px] gap-4 px-4 py-3 items-center hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-md bg-muted/50 overflow-hidden shrink-0 border border-border/30">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground/30" /></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-medium text-[13px] truncate">{product.name}</h3>
                          {product.is_featured && <Star className="w-3 h-3 text-foreground fill-current shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {getCategoryName(product.category_id) || 'Uncategorised'}
                          {product.sku && ` · ${product.sku}`}
                        </p>
                      </div>
                    </div>
                    <div className="hidden md:flex items-center">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-foreground">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          product.status === 'active' ? 'bg-emerald-500' :
                          product.status === 'draft' ? 'bg-amber-500' :
                          'bg-muted-foreground/40'
                        }`} />
                        {product.status}
                      </span>
                    </div>
                    <div className="hidden md:block text-right text-[12px] tabular-nums">
                      {product.track_inventory
                        ? <span className={product.inventory_count > 0 ? 'text-foreground' : 'text-red-500'}>{product.inventory_count}</span>
                        : <span className="text-muted-foreground/60">—</span>}
                    </div>
                    <div className="hidden md:block text-right font-semibold text-[13px] tabular-nums">{formatPrice(product.price, product.currency)}</div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md"><MoreHorizontal className="w-4 h-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => { setEditingProduct(product); setIsEditing(true); setProductDialogOpen(true); }} className="text-xs"><Edit className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateProduct(product)} className="text-xs"><Copy className="w-3.5 h-3.5 mr-2" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleStatus(product)} className="text-xs">
                          {product.status === 'active' ? <><EyeOff className="w-3.5 h-3.5 mr-2" /> Set draft</> : <><Eye className="w-3.5 h-3.5 mr-2" /> Publish</>}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setActiveProductId(product.id); fetchVariants(product.id); setVariantDialogOpen(true); }} className="text-xs">
                          <Layers className="w-3.5 h-3.5 mr-2" /> Variants
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs text-destructive" onClick={() => deleteProduct(product.id)}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-4 mt-0">
            {categories.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/50 bg-card/20 py-20 px-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-foreground/[0.04] border border-border/40 mx-auto flex items-center justify-center mb-4">
                  <Tag className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold tracking-tight">No categories yet</h3>
                <p className="text-[13px] text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
                  Categories group related products together so customers can browse a specific collection on your storefront.
                </p>
                <Button size="sm" className="mt-5 h-9 rounded-lg text-xs" onClick={() => setCategoryDialogOpen(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Create your first category
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map(cat => {
                  const count = products.filter(p => p.category_id === cat.id).length;
                  return (
                    <div key={cat.id} className="group rounded-xl border border-border/40 bg-card/40 hover:border-border hover:bg-card/70 transition-all p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-[14px] tracking-tight truncate">{cat.name}</h3>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">/{cat.slug}</p>
                          {cat.description && <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2 leading-relaxed">{cat.description}</p>}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => { setEditingCategory(cat); setCategoryDialogOpen(true); }} className="text-xs"><Edit className="w-3.5 h-3.5 mr-2" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-xs text-destructive" onClick={() => deleteCategory(cat.id)}><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="tabular-nums">{count} {count === 1 ? 'product' : 'products'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4 mt-0">
            <OrdersPanel userId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>


      {/* Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Product' : 'Add Product'}</DialogTitle>
            <DialogDescription>Fill in the product details below</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Info</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <Label>Product Name *</Label>
                  <Input value={editingProduct.name || ''} onChange={e => setEditingProduct(p => ({ ...p, name: e.target.value, slug: slugify(e.target.value) }))} placeholder="e.g. Classic T-Shirt" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Label>Slug</Label>
                  <Input value={editingProduct.slug || ''} onChange={e => setEditingProduct(p => ({ ...p, slug: e.target.value }))} placeholder="classic-t-shirt" />
                </div>
              </div>
              <div>
                <Label>Short Description</Label>
                <Input value={editingProduct.short_description || ''} onChange={e => setEditingProduct(p => ({ ...p, short_description: e.target.value }))} placeholder="Brief summary" />
              </div>
              <div>
                <Label>Full Description</Label>
                <Textarea value={editingProduct.description || ''} onChange={e => setEditingProduct(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Detailed product description..." />
              </div>
            </div>

            <Separator />

            {/* Pricing */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pricing</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label>Price *</Label>
                  <Input type="number" step="0.01" value={editingProduct.price || ''} onChange={e => setEditingProduct(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div>
                  <Label>Compare At</Label>
                  <Input type="number" step="0.01" value={editingProduct.compare_at_price || ''} onChange={e => setEditingProduct(p => ({ ...p, compare_at_price: parseFloat(e.target.value) || null }))} />
                </div>
                <div>
                  <Label>Cost Price</Label>
                  <Input type="number" step="0.01" value={editingProduct.cost_price || ''} onChange={e => setEditingProduct(p => ({ ...p, cost_price: parseFloat(e.target.value) || null }))} />
                </div>
                <div>
                  <Label>Currency</Label>
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
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Organization</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={editingProduct.category_id || 'none'} onValueChange={v => setEditingProduct(p => ({ ...p, category_id: v === 'none' ? null : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Website</Label>
                  <Select value={editingProduct.site_id || 'none'} onValueChange={v => setEditingProduct(p => ({ ...p, site_id: v === 'none' ? null : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Sites</SelectItem>
                      {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.site_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
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
                    <Label>Featured</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={editingProduct.is_digital || false} onCheckedChange={v => setEditingProduct(p => ({ ...p, is_digital: v }))} />
                    <Label>Digital</Label>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Inventory */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Inventory & Shipping</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label>SKU</Label>
                  <Input value={editingProduct.sku || ''} onChange={e => setEditingProduct(p => ({ ...p, sku: e.target.value }))} />
                </div>
                <div>
                  <Label>Barcode</Label>
                  <Input value={editingProduct.barcode || ''} onChange={e => setEditingProduct(p => ({ ...p, barcode: e.target.value }))} />
                </div>
                <div>
                  <Label>Weight</Label>
                  <Input type="number" step="0.1" value={editingProduct.weight || ''} onChange={e => setEditingProduct(p => ({ ...p, weight: parseFloat(e.target.value) || null }))} />
                </div>
                <div>
                  <Label>Weight Unit</Label>
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
                <Label>Track Inventory</Label>
                {editingProduct.track_inventory && (
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Stock:</Label>
                    <Input type="number" className="w-20 h-8" value={editingProduct.inventory_count || 0} onChange={e => setEditingProduct(p => ({ ...p, inventory_count: parseInt(e.target.value) || 0 }))} />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Images */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Images</h4>
              <div className="flex gap-2">
                <Input value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} placeholder="Paste image URL..." className="flex-1" onKeyDown={e => e.key === 'Enter' && addImage()} />
                <Button variant="outline" size="sm" onClick={addImage}><Plus className="w-4 h-4" /></Button>
              </div>
              {(editingProduct.images || []).length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {(editingProduct.images || []).map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Tags */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tags</h4>
              <div className="flex gap-2">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag..." className="flex-1" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                <Button variant="outline" size="sm" onClick={addTag}><Plus className="w-4 h-4" /></Button>
              </div>
              {(editingProduct.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {(editingProduct.tags || []).map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} <Trash2 className="w-2.5 h-2.5" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveProduct} disabled={saving || !editingProduct.name}>{saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory.id ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>Organize your products with categories</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={editingCategory.name || ''} onChange={e => setEditingCategory(c => ({ ...c, name: e.target.value, slug: slugify(e.target.value) }))} placeholder="e.g. Electronics" />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={editingCategory.slug || ''} onChange={e => setEditingCategory(c => ({ ...c, slug: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={editingCategory.description || ''} onChange={e => setEditingCategory(c => ({ ...c, description: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input value={editingCategory.image_url || ''} onChange={e => setEditingCategory(c => ({ ...c, image_url: e.target.value }))} placeholder="https://..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={saveCategory} disabled={saving || !editingCategory.name}>{saving ? 'Saving...' : editingCategory.id ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Variants Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Product Variants</DialogTitle>
            <DialogDescription>Add sizes, colors, or other options</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing variants */}
            {variants.length > 0 && (
              <div className="space-y-2">
                {variants.map(v => (
                  <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border border-border/40">
                    <div>
                      <p className="text-sm font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {v.price !== null && formatPrice(v.price, 'GBP')} {v.sku && `· SKU: ${v.sku}`} · Stock: {v.inventory_count}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteVariant(v.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {/* Add variant form */}
            <div className="space-y-2 p-3 rounded-lg border border-dashed">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Add Variant</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Name *</Label>
                  <Input value={editingVariant.name || ''} onChange={e => setEditingVariant(v => ({ ...v, name: e.target.value }))} placeholder="e.g. Large / Red" className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">SKU</Label>
                  <Input value={editingVariant.sku || ''} onChange={e => setEditingVariant(v => ({ ...v, sku: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Price Override</Label>
                  <Input type="number" step="0.01" value={editingVariant.price || ''} onChange={e => setEditingVariant(v => ({ ...v, price: parseFloat(e.target.value) || null }))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Stock</Label>
                  <Input type="number" value={editingVariant.inventory_count || 0} onChange={e => setEditingVariant(v => ({ ...v, inventory_count: parseInt(e.target.value) || 0 }))} className="h-8 text-sm" />
                </div>
              </div>
              <Button size="sm" className="w-full" onClick={saveVariant} disabled={saving || !editingVariant.name}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Variant
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

  if (loading) return <div className="h-32 rounded-xl bg-muted animate-pulse" />;

  if (orders.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingCart className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-semibold">No orders yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Orders from your website will appear here</p>
        </CardContent>
      </Card>
    );
  }

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-500/10 text-amber-600',
      paid: 'bg-emerald-500/10 text-emerald-600',
      processing: 'bg-blue-500/10 text-blue-600',
      shipped: 'bg-purple-500/10 text-purple-600',
      delivered: 'bg-green-500/10 text-green-700',
      cancelled: 'bg-red-500/10 text-red-600',
      refunded: 'bg-muted text-muted-foreground',
    };
    return <Badge variant="outline" className={`text-[10px] ${colors[status] || ''}`}>{status}</Badge>;
  };

  return (
    <div className="space-y-2">
      {orders.map(order => (
        <Card key={order.id} className="border-border/40">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-semibold text-sm">{order.order_number}</span>
                {statusBadge(order.status)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{order.customer_email} · {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <p className="font-bold">{new Intl.NumberFormat('en-GB', { style: 'currency', currency: order.currency || 'GBP' }).format(order.total)}</p>
              <p className="text-xs text-muted-foreground">{(order.items as any[])?.length || 0} items</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
