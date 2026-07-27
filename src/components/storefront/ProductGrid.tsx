import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStorefront } from '@/contexts/StorefrontContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, ShoppingCart, Eye, Star, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  images: any[];
  status: string;
  is_featured: boolean | null;
  tags: string[] | null;
  category_id: string | null;
  inventory_count: number | null;
  track_inventory: boolean | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export function ProductGrid({ siteId }: { siteId: string }) {
  const { addToCart, setCartOpen } = useStorefront();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [quickView, setQuickView] = useState<Product | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [prodRes, catRes] = await Promise.all([
        supabase.from('products').select('*').eq('status', 'active').order('sort_order'),
        supabase.from('product_categories').select('id, name, slug'),
      ]);
      if (prodRes.data) {
        // Filter by site_id if products have it
        const filtered = siteId ? prodRes.data.filter((p: any) => !p.site_id || p.site_id === siteId) : prodRes.data;
        setProducts(filtered as Product[]);
      }
      if (catRes.data) setCategories(catRes.data as Category[]);
      setLoading(false);
    };
    fetchData();
  }, [siteId]);

  const filtered = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCat = !activeCategory || p.category_id === activeCategory;
    return matchesSearch && matchesCat;
  });

  const formatPrice = (amount: number, currency = 'GBP') =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount);

  const handleAddToCart = (product: Product) => {
    addToCart({
      product_id: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0]?.url,
      currency: product.currency,
    });
    toast({ title: 'Added to cart', description: product.name });
    setCartOpen(true);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-muted animate-pulse rounded-xl h-72" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <Button variant={activeCategory === null ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(null)}>
              All
            </Button>
            {categories.map(cat => (
              <Button key={cat.id} variant={activeCategory === cat.id ? 'default' : 'outline'} size="sm" onClick={() => setActiveCategory(cat.id)}>
                {cat.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Filter className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(product => (
            <div key={product.id} className="group bg-card rounded-xl border overflow-hidden hover:shadow-lg transition-shadow">
              {/* Image */}
              <div className="relative aspect-square bg-muted overflow-hidden">
                {product.images?.[0]?.url ? (
                  <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-4xl font-bold">
                    {product.name[0]}
                  </div>
                )}
                {product.is_featured && (
                  <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                    <Star className="h-3 w-3 mr-1" /> Featured
                  </Badge>
                )}
                {product.compare_at_price && product.compare_at_price > product.price && (
                  <Badge variant="destructive" className="absolute top-2 right-2">
                    {Math.round((1 - product.price / product.compare_at_price) * 100)}% OFF
                  </Badge>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Button variant="secondary" size="sm" onClick={() => setQuickView(product)}>
                    <Eye className="h-4 w-4 mr-1" /> Quick View
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="p-3 space-y-2">
                <h3 className="font-medium text-sm truncate">{product.name}</h3>
                {product.short_description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{product.short_description}</p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bold text-base">{formatPrice(product.price, product.currency)}</span>
                    {product.compare_at_price && product.compare_at_price > product.price && (
                      <span className="text-xs text-muted-foreground line-through">{formatPrice(product.compare_at_price, product.currency)}</span>
                    )}
                  </div>
                </div>
                <Button size="sm" className="w-full" onClick={() => handleAddToCart(product)} disabled={product.track_inventory && (product.inventory_count || 0) <= 0}>
                  <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                  {product.track_inventory && (product.inventory_count || 0) <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick View Dialog */}
      <Dialog open={!!quickView} onOpenChange={() => setQuickView(null)}>
        {quickView && (
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{quickView.name}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                {quickView.images?.[0]?.url ? (
                  <img src={quickView.images[0].url} alt={quickView.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/30 text-6xl font-bold">{quickView.name[0]}</div>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{formatPrice(quickView.price, quickView.currency)}</span>
                  {quickView.compare_at_price && quickView.compare_at_price > quickView.price && (
                    <span className="text-muted-foreground line-through">{formatPrice(quickView.compare_at_price, quickView.currency)}</span>
                  )}
                </div>
                {quickView.description && (
                  <p className="text-sm text-muted-foreground">{quickView.description}</p>
                )}
                {quickView.tags && quickView.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {quickView.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
                  </div>
                )}
                <Button className="w-full" onClick={() => { handleAddToCart(quickView); setQuickView(null); }}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
