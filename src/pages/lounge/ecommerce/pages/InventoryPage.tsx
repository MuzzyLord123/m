import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Boxes, Search, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

export default function InventoryPage() {
  const { user } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, sku, inventory_count, track_inventory, images')
        .eq('user_id', user.id)
        .eq('track_inventory', true)
        .order('inventory_count', { ascending: true });
      setRows(data || []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = rows.filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.sku || '').toLowerCase().includes(search.toLowerCase())
  );

  const lowCount = rows.filter(r => (r.inventory_count || 0) <= 5).length;

  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Products', 'Inventory']}
        title="Inventory"
        description="Track stock levels for every product with inventory tracking enabled."
        meta={lowCount > 0 ? (
          <div className="inline-flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[12px] text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            {lowCount} {lowCount === 1 ? 'product' : 'products'} low on stock
          </div>
        ) : null}
      />
      <PageBody>
        <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or SKU" className="h-8 pl-8 rounded-md text-[13px]" />
            </div>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-md bg-muted/40 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Boxes}
                title="Nothing to track yet"
                description="Enable inventory tracking on a product to see and manage stock levels here."
              />
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[minmax(0,1fr)_140px_140px] gap-4 px-4 py-2.5 bg-muted/30 border-b border-border/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <span>Product</span><span>SKU</span><span className="text-right">Available</span>
              </div>
              <div className="divide-y divide-border/50">
                {filtered.map(r => (
                  <div key={r.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_140px_140px] gap-4 items-center px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{r.name}</p>
                    </div>
                    <span className="hidden md:block text-[12px] text-muted-foreground font-mono">{r.sku || '—'}</span>
                    <span className={`text-[13px] font-semibold tabular-nums md:text-right ${(r.inventory_count || 0) <= 0 ? 'text-red-500' : (r.inventory_count || 0) <= 5 ? 'text-amber-500' : ''}`}>
                      {r.inventory_count || 0} in stock
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </PageBody>
    </>
  );
}
