import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

interface Order {
  id: string; order_number: string | null; customer_email: string | null; customer_name: string | null;
  status: string; total_amount: number; currency: string; created_at: string;
}

const TABS: { id: string; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unfulfilled', label: 'Unfulfilled' },
  { id: 'paid', label: 'Paid' },
  { id: 'refunded', label: 'Refunded' },
];

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('site_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setOrders((data as any) || []);
      setLoading(false);
    })();
  }, [user]);

  const filtered = orders.filter(o => {
    if (tab === 'paid' && o.status !== 'paid') return false;
    if (tab === 'unfulfilled' && !['pending', 'processing'].includes(o.status || '')) return false;
    if (tab === 'refunded' && o.status !== 'refunded') return false;
    if (search && !((o.customer_email || '').includes(search.toLowerCase()) || (o.order_number || '').includes(search))) return false;
    return true;
  });

  const money = (n: number, c = 'GBP') => new Intl.NumberFormat('en-GB', { style: 'currency', currency: c }).format(n);

  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Orders']}
        title="Orders"
        actions={
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export
          </Button>
        }
      />
      <PageBody>
        <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
          <div className="flex items-center gap-0.5 px-2 pt-2 border-b border-border/50">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`h-8 px-3 rounded-md text-[13px] font-medium transition-colors ${
                  tab === t.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >{t.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 p-2 border-b border-border/50">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order number or email" className="h-8 pl-8 rounded-md text-[13px] bg-background border-border/50" />
            </div>
            <Button variant="outline" size="sm" className="h-8 rounded-md text-xs"><Filter className="h-3.5 w-3.5 mr-1.5" /> Filter</Button>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-md bg-muted/40 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={ShoppingBag}
                title={orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
                description={orders.length === 0
                  ? 'When customers buy through your storefront or embed script, their orders will show up here with fulfilment status and totals.'
                  : 'Try clearing your search or switching tabs.'}
              />
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[100px_1fr_120px_120px_120px] gap-4 px-4 py-2.5 bg-muted/30 border-b border-border/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <span>Order</span>
                <span>Customer</span>
                <span>Status</span>
                <span>Date</span>
                <span className="text-right">Total</span>
              </div>
              <div className="divide-y divide-border/50">
                {filtered.map(o => (
                  <div key={o.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[100px_1fr_120px_120px_120px] gap-4 items-center px-4 py-3 hover:bg-muted/30 transition-colors">
                    <span className="text-[13px] font-semibold tabular-nums">#{o.order_number || o.id.slice(0, 8)}</span>
                    <div className="min-w-0 hidden md:block">
                      <p className="text-[13px] truncate">{o.customer_name || o.customer_email || 'Guest'}</p>
                      {o.customer_name && <p className="text-[11px] text-muted-foreground truncate">{o.customer_email}</p>}
                    </div>
                    <div className="hidden md:block">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border ${
                        o.status === 'paid'      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25' :
                        o.status === 'pending'   ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25' :
                        o.status === 'refunded'  ? 'bg-red-500/10 text-red-600 border-red-500/25' :
                        'bg-muted text-muted-foreground border-border/40'
                      }`}>{o.status || 'pending'}</span>
                    </div>
                    <span className="hidden md:block text-[12px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
                    <span className="text-[13px] font-semibold tabular-nums md:text-right">{money(Number(o.total_amount || 0), o.currency)}</span>
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
