import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingBag, RefreshCw, Plus, Trash2, Link2, ExternalLink, Copy, Check, FileText, Tag, Search, LayoutTemplate } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { useEditor } from './EditorContext';
import { PRODUCT_PAGE_TEMPLATES } from './constants/productPageTemplates';

interface SiteProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  images: any[];
  status: string;
  category: string | null;
  tags: string[];
  inventory_count: number | null;
  inv_product_id: string | null;
}

interface InvProduct {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  cost_price: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
}

export function ProductsPanel({ siteId }: { siteId?: string }) {
  const { dispatch } = useEditor();
  const [products, setProducts] = useState<SiteProduct[]>([]);
  const [invProducts, setInvProducts] = useState<InvProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [showEdit, setShowEdit] = useState<SiteProduct | null>(null);
  const [showSnippet, setShowSnippet] = useState(false);
  const [showPageTemplates, setShowPageTemplates] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedInv, setSelectedInv] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const loadProducts = useCallback(async () => {
    if (!siteId) return;
    const { data } = await supabase.from('site_products').select('*').eq('site_id', siteId).order('sort_order');
    if (data) setProducts(data as SiteProduct[]);
    setLoading(false);
  }, [siteId]);

  const loadInventory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('inv_products')
      .select('id, name, sku, selling_price, cost_price, description, image_url, is_active')
      .eq('user_id', user.id).eq('is_active', true).order('name');
    if (data) setInvProducts(data as InvProduct[]);
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filteredProducts = products.filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    return true;
  });

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[];

  const syncFromInventory = async () => {
    if (!siteId || selectedInv.size === 0) return;
    setSyncing(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSyncing(false); return; }
    const toSync = invProducts.filter(p => selectedInv.has(p.id));
    const existingInvIds = new Set(products.filter(p => p.inv_product_id).map(p => p.inv_product_id));
    const newProducts = toSync.filter(p => !existingInvIds.has(p.id)).map(p => ({
      site_id: siteId, user_id: user.id, inv_product_id: p.id, name: p.name,
      slug: p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      description: p.description, price: p.selling_price, currency: 'GBP',
      images: p.image_url ? [{ url: p.image_url }] : [], status: 'active',
    }));
    if (newProducts.length > 0) {
      const { error } = await supabase.from('site_products').insert(newProducts as any);
      if (error) toast({ title: 'Sync error', description: error.message, variant: 'destructive' });
      else toast({ title: `${newProducts.length} products synced` });
    } else {
      toast({ title: 'All selected products already synced' });
    }
    await loadProducts(); setSyncing(false); setShowSync(false); setSelectedInv(new Set());
  };

  const deleteProduct = async (id: string) => {
    await supabase.from('site_products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Product removed' });
  };

  const updateProduct = async (product: SiteProduct, updates: Partial<SiteProduct>) => {
    const { error } = await supabase.from('site_products').update(updates as any).eq('id', product.id);
    if (!error) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, ...updates } : p));
      if (showEdit?.id === product.id) setShowEdit({ ...showEdit, ...updates } as SiteProduct);
      toast({ title: 'Product updated' });
    }
  };

  const insertProductPage = (templateId: string, product?: SiteProduct) => {
    const template = PRODUCT_PAGE_TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const elements = JSON.parse(JSON.stringify(template.elements));
    // Replace placeholder text with product data if available
    if (product) {
      const replaceText = (els: any[]) => {
        for (const el of els) {
          if (el.props?.text) {
            el.props.text = el.props.text
              .replace(/\$PRODUCT_NAME/g, product.name)
              .replace(/\$PRODUCT_PRICE/g, formatPrice(product.price, product.currency))
              // An unwritten description leaves an empty space to fill, not
              // invented marketing copy. "Premium quality product with
              // exceptional craftsmanship" was being published onto real
              // shops about real products nobody had described yet.
              .replace(/\$PRODUCT_DESC/g, product.description || '')
              .replace(/\$COMPARE_PRICE/g, product.compare_at_price ? formatPrice(product.compare_at_price, product.currency) : '');
          }
          if (el.props?.src && product.images?.[0]?.url) {
            el.props.src = product.images[0].url;
          }
          if (el.children?.length) replaceText(el.children);
        }
      };
      replaceText(elements);
    }
    // Regenerate IDs
    const reId = (els: any[]) => {
      for (const el of els) {
        el.id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        if (el.children?.length) reId(el.children);
      }
    };
    reId(elements);
    for (const el of elements) {
      dispatch({ type: 'ADD_ELEMENT', payload: { element: el, parentId: null } });
    }
    toast({ title: `${template.name} added to canvas` });
    setShowPageTemplates(false);
  };

  const formatPrice = (amt: number, cur = 'GBP') =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur }).format(amt);

  const generateSnippet = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    return `<!-- Quooro Store Embed -->
<div id="quooro-store" data-site-id="${siteId}"></div>
<script>
(function(){
  var s=document.createElement('script');
  s.src='https://${projectId}.supabase.co/functions/v1/ecommerce-embed?site_id=${siteId}';
  s.async=true;
  document.head.appendChild(s);
})();
</script>

<!-- Buy Now Button -->
<button class="quooro-buy-now" data-product-id="PRODUCT_ID" data-site-id="${siteId}">Buy Now</button>

<!-- Cart Button -->
<div class="quooro-cart-button" data-site-id="${siteId}"></div>

<script>
document.querySelectorAll('.quooro-buy-now').forEach(function(btn){
  btn.addEventListener('click',function(){
    var pid=this.getAttribute('data-product-id');
    var sid=this.getAttribute('data-site-id');
    fetch('https://${projectId}.supabase.co/functions/v1/create-product-checkout',{
      method:'POST',
      headers:{'Content-Type':'application/json','apikey':'${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}'},
      body:JSON.stringify({site_id:sid,items:[{product_id:pid,quantity:1}]})
    }).then(r=>r.json()).then(d=>{if(d.url)window.open(d.url,'_blank');});
  });
});
</script>`;
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(generateSnippet());
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (!siteId) return <div className="flex items-center justify-center h-full text-[11px] text-[hsl(var(--studio-ink-3))]">No site loaded</div>;

  return (
    <div className="h-full flex flex-col" style={{ color: 'hsl(var(--studio-ink-2))' }}>
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: '1px solid hsl(var(--studio-line))' }}>
        <div className="flex items-center gap-1.5">
          <ShoppingBag className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--studio-ink-2))]">Products</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setShowPageTemplates(true)}>
            <LayoutTemplate className="h-3 w-3 mr-1" /> Pages
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setShowSnippet(true)}>
            <ExternalLink className="h-3 w-3 mr-1" /> Embed
          </Button>
          <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => { loadInventory(); setShowSync(true); }}>
            <RefreshCw className="h-3 w-3 mr-1" /> Sync
          </Button>
        </div>
      </div>

      {/* Search & filter */}
      {products.length > 0 && (
        <div className="flex gap-1.5 px-2 py-1.5" style={{ borderBottom: '1px solid hsl(var(--studio-line))' }}>
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[hsl(var(--studio-ink-3))]" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." className="h-7 text-[11px] pl-7" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }} />
          </div>
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-7 w-24 text-[10px]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}><Tag className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-3 text-[11px] text-[hsl(var(--studio-ink-3))]">Loading</div>
        ) : products.length === 0 ? (
          <div className="p-4 text-center">
            <ShoppingBag className="h-8 w-8 mx-auto text-[hsl(var(--studio-hover))] mb-2" />
            <p className="text-[11px] text-[hsl(var(--studio-ink-3))] mb-2">No products on this site</p>
            <p className="text-[10px] text-[hsl(var(--studio-ink-3))] mb-3">Sync from inventory or add product page templates</p>
            <div className="flex gap-2 justify-center">
              <Button size="sm" className="h-7 text-[11px]" onClick={() => { loadInventory(); setShowSync(true); }}>
                <Link2 className="h-3 w-3 mr-1" /> Sync Inventory
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setShowPageTemplates(true)}>
                <LayoutTemplate className="h-3 w-3 mr-1" /> Page Templates
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredProducts.map(product => (
              <div key={product.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 group">
                <div className="w-8 h-8 rounded bg-[hsl(var(--studio-raised))] overflow-hidden shrink-0">
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[hsl(var(--studio-hover))] text-[10px] font-bold">{product.name[0]}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowEdit(product)}>
                  <p className="text-[11px] font-medium truncate">{product.name}</p>
                  <p className="text-[10px] text-emerald-400">{formatPrice(product.price, product.currency)}</p>
                </div>
                {product.inv_product_id && (
                  <Badge variant="outline" className="text-[8px] h-3.5 shrink-0" style={{ borderColor: 'hsl(var(--studio-accent))', color: 'hsl(var(--studio-accent))' }}>synced</Badge>
                )}
                <Badge variant="outline" className="text-[9px] h-4 shrink-0" style={{
                  borderColor: product.status === 'active' ? 'hsl(var(--studio-ok))' : 'hsl(var(--studio-ink-3))',
                  color: product.status === 'active' ? 'hsl(var(--studio-ok))' : 'hsl(var(--studio-ink-2))',
                }}>{product.status}</Badge>
                <button onClick={() => insertProductPage('product-hero-1', product)} className="opacity-0 group-hover:opacity-100 text-[hsl(var(--studio-ink-3))] hover:text-emerald-400 p-0.5" title="Add product page">
                  <FileText className="h-3 w-3" />
                </button>
                <button onClick={() => deleteProduct(product.id)} className="opacity-0 group-hover:opacity-100 text-[hsl(var(--studio-ink-3))] hover:text-red-400 p-0.5">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Product Page Templates Dialog */}
      <Dialog open={showPageTemplates} onOpenChange={setShowPageTemplates}>
        <DialogContent className="max-w-[90vw] sm:max-w-md" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))', maxHeight: '85vh' }}>
          <DialogHeader><DialogTitle className="text-sm">Product Page Templates</DialogTitle></DialogHeader>
          <p className="text-[10px] text-[hsl(var(--studio-ink-2))] -mt-1">Click to add to canvas. Auto-fills with product data.</p>
          <ScrollArea className="max-h-[60vh]">
            <div className="grid grid-cols-2 gap-2 p-1">
              {PRODUCT_PAGE_TEMPLATES.map(template => (
                <button key={template.id} onClick={() => insertProductPage(template.id, products[0])}
                  className="flex flex-col gap-1.5 p-2.5 rounded-lg hover:bg-white/5 text-left transition-colors" style={{ border: '1px solid hsl(var(--studio-line))' }}>
                  <div className="w-full h-14 rounded flex items-center justify-center text-2xl" style={{ backgroundColor: 'hsl(var(--studio-raised))' }}>
                    {template.icon}
                  </div>
                  <span className="text-[10px] font-medium leading-tight">{template.name}</span>
                  <span className="text-[9px] text-[hsl(var(--studio-ink-3))] leading-tight">{template.description}</span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Sync from Inventory Dialog */}
      <Dialog open={showSync} onOpenChange={setShowSync}>
        <DialogContent className="sm:max-w-md" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}>
          <DialogHeader><DialogTitle className="text-sm">Sync from Inventory</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[300px]">
            {invProducts.length === 0 ? (
              <p className="text-[11px] text-[hsl(var(--studio-ink-3))] text-center py-4">No inventory products found</p>
            ) : (
              <div className="space-y-1 p-1">
                {invProducts.map(ip => {
                  const alreadySynced = products.some(p => p.inv_product_id === ip.id);
                  return (
                    <label key={ip.id} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/5" style={alreadySynced ? { opacity: 0.5 } : {}}>
                      <input type="checkbox" disabled={alreadySynced} checked={selectedInv.has(ip.id) || alreadySynced}
                        onChange={e => { const s = new Set(selectedInv); e.target.checked ? s.add(ip.id) : s.delete(ip.id); setSelectedInv(s); }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium truncate">{ip.name}</p>
                        <p className="text-[10px] text-[hsl(var(--studio-ink-3))]">SKU: {ip.sku} • {formatPrice(ip.selling_price)}</p>
                      </div>
                      {alreadySynced && <Badge variant="outline" className="text-[8px] h-3.5">synced</Badge>}
                    </label>
                  );
                })}
              </div>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button size="sm" onClick={syncFromInventory} disabled={syncing || selectedInv.size === 0}>
              {syncing ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Link2 className="h-3 w-3 mr-1" />}
              Sync {selectedInv.size} Products
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!showEdit} onOpenChange={() => setShowEdit(null)}>
        {showEdit && (
          <DialogContent className="sm:max-w-md" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}>
            <DialogHeader><DialogTitle className="text-sm">Edit Product</DialogTitle></DialogHeader>
            <ScrollArea className="max-h-[400px]">
              <div className="space-y-3 pr-2">
                <div>
                  <label className="text-[11px] text-[hsl(var(--studio-ink-2))] mb-1 block">Name</label>
                  <Input defaultValue={showEdit.name} onBlur={e => updateProduct(showEdit, { name: e.target.value })} className="h-8 text-[12px]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }} />
                </div>
                <div>
                  <label className="text-[11px] text-[hsl(var(--studio-ink-2))] mb-1 block">Description</label>
                  <Textarea defaultValue={showEdit.description || ''} onBlur={e => updateProduct(showEdit, { description: e.target.value })} rows={3} className="text-[12px]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-[hsl(var(--studio-ink-2))] mb-1 block">Price</label>
                    <Input type="number" defaultValue={showEdit.price} onBlur={e => updateProduct(showEdit, { price: Number(e.target.value) })} className="h-8 text-[12px]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }} />
                  </div>
                  <div>
                    <label className="text-[11px] text-[hsl(var(--studio-ink-2))] mb-1 block">Compare Price</label>
                    <Input type="number" defaultValue={showEdit.compare_at_price || ''} onBlur={e => updateProduct(showEdit, { compare_at_price: Number(e.target.value) || null })} className="h-8 text-[12px]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }} />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-[hsl(var(--studio-ink-2))] mb-1 block">Status</label>
                  <Select value={showEdit.status} onValueChange={v => updateProduct(showEdit, { status: v })}>
                    <SelectTrigger className="h-8 text-[12px]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] text-[hsl(var(--studio-ink-2))] mb-1 block">Image URL</label>
                  <Input defaultValue={showEdit.images?.[0]?.url || ''} onBlur={e => updateProduct(showEdit, { images: e.target.value ? [{ url: e.target.value }] : [] } as any)} className="h-8 text-[12px]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }} />
                </div>
                <div>
                  <label className="text-[11px] text-[hsl(var(--studio-ink-2))] mb-1 block">Category</label>
                  <Input defaultValue={showEdit.category || ''} onBlur={e => updateProduct(showEdit, { category: e.target.value || null })} className="h-8 text-[12px]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }} />
                </div>
                {showEdit.inv_product_id && (
                  <div className="p-2 rounded text-[10px] text-[hsl(var(--studio-ink-2))]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))' }}>
                    <span className="text-emerald-400">●</span> Linked to inventory product
                  </div>
                )}
              </div>
            </ScrollArea>
            <DialogFooter>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-[10px]" onClick={() => insertProductPage('product-hero-1', showEdit)}>
                  <FileText className="h-3 w-3 mr-1" /> Add Page
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowEdit(null)}>Done</Button>
              </div>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Embed Snippet Dialog */}
      <Dialog open={showSnippet} onOpenChange={setShowSnippet}>
        <DialogContent className="sm:max-w-lg" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}>
          <DialogHeader><DialogTitle className="text-sm">Embed Store on External Site</DialogTitle></DialogHeader>
          <p className="text-[11px] text-[hsl(var(--studio-ink-2))] mb-2">Copy this code into your exported site's HTML. Orders will appear in your dashboard.</p>
          <div className="relative">
            <pre className="text-[10px] p-3 rounded overflow-auto max-h-[250px]" style={{ backgroundColor: 'hsl(var(--studio-sunken))', color: 'hsl(var(--studio-ink-2))', border: '1px solid hsl(var(--studio-line))' }}>{generateSnippet()}</pre>
            <Button size="sm" variant="ghost" className="absolute top-2 right-2 h-6 text-[10px]" onClick={copySnippet}>
              {copied ? <Check className="h-3 w-3 mr-1 text-green-400" /> : <Copy className="h-3 w-3 mr-1" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="space-y-2 mt-2">
            <div className="text-[10px] text-[hsl(var(--studio-ink-3))]">
              <strong className="text-[hsl(var(--studio-ink-2))]">Product IDs:</strong>
              {products.map(p => (
                <div key={p.id} className="flex items-center gap-1 mt-1">
                  <code className="px-1 py-0.5 rounded text-[9px]" style={{ backgroundColor: 'hsl(var(--studio-raised))' }}>{p.id}</code>
                  <span className="text-[hsl(var(--studio-ink-2))]">— {p.name}</span>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
