import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Users, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

interface Customer {
  email: string; name: string | null; total_spent: number; orders: number; last_order: string;
}

export default function CustomersPage() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      // Derive customer list from site_orders (no dedicated customers table yet)
      const { data } = await supabase
        .from('site_orders')
        .select('customer_email, customer_name, total_amount, created_at')
        .eq('user_id', user.id);
      const map = new Map<string, Customer>();
      (data || []).forEach((r: any) => {
        const email = r.customer_email;
        if (!email) return;
        const existing = map.get(email);
        if (existing) {
          existing.total_spent += Number(r.total_amount || 0);
          existing.orders += 1;
          if (r.created_at > existing.last_order) existing.last_order = r.created_at;
        } else {
          map.set(email, {
            email, name: r.customer_name, total_spent: Number(r.total_amount || 0),
            orders: 1, last_order: r.created_at,
          });
        }
      });
      setCustomers(Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent));
      setLoading(false);
    })();
  }, [user]);

  const filtered = customers.filter(c =>
    !search || c.email.toLowerCase().includes(search.toLowerCase()) || (c.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const money = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Customers']}
        title="Customers"
        description="Everyone who has bought from your store. Sorted by lifetime value."
      />
      <PageBody>
        <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
          <div className="p-2 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers" className="h-8 pl-8 rounded-md text-[13px]" />
            </div>
          </div>
          {loading ? (
            <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-14 rounded-md bg-muted/40 animate-pulse" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No customers yet"
                description="Customers appear here as soon as they place an order. You'll see lifetime value, order history, and contact details."
              />
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[minmax(0,1fr)_120px_120px_140px] gap-4 px-4 py-2.5 bg-muted/30 border-b border-border/50 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                <span>Customer</span><span>Orders</span><span className="text-right">Lifetime value</span><span className="text-right">Last order</span>
              </div>
              <div className="divide-y divide-border/50">
                {filtered.map(c => (
                  <div key={c.email} className="grid grid-cols-[1fr_auto] md:grid-cols-[minmax(0,1fr)_120px_120px_140px] gap-4 items-center px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{c.name || c.email}</p>
                      {c.name && <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>}
                    </div>
                    <span className="hidden md:block text-[12px] tabular-nums">{c.orders} {c.orders === 1 ? 'order' : 'orders'}</span>
                    <span className="text-[13px] font-semibold tabular-nums md:text-right">{money(c.total_spent)}</span>
                    <span className="hidden md:block text-[12px] text-muted-foreground text-right">{new Date(c.last_order).toLocaleDateString()}</span>
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
