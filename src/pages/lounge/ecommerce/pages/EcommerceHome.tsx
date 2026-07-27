import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingBag, Package, DollarSign, Users, TrendingUp, ArrowRight,
} from 'lucide-react';
import { PageHeader, PageBody, StatCard } from '../shared/PageChrome';
import type { EcomPage } from '../EcommerceShell';

interface Props {
  onNavigate: (page: EcomPage) => void;
}

export default function EcommerceHome({ onNavigate }: Props) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    customers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, o] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('site_orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      ]);
      const orders = o.data || [];
      setStats({
        products: p.count || 0,
        orders: orders.length,
        revenue: orders.reduce((sum: number, row: any) => sum + Number(row.total_amount || 0), 0),
        customers: new Set(orders.map((r: any) => r.customer_email).filter(Boolean)).size,
      });
      setRecentOrders(orders);
    })();
  }, [user]);

  const money = (n: number) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(n);

  return (
    <>
      <PageHeader
        title="Home"
        description="Your store at a glance. Track sales, monitor inventory, and jump into whatever needs attention."
      />
      <PageBody>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Products" value={String(stats.products)} hint="in catalog" />
          <StatCard label="Total orders" value={String(stats.orders)} hint="all time" />
          <StatCard label="Revenue" value={money(stats.revenue)} hint="from orders" />
          <StatCard label="Customers" value={String(stats.customers)} hint="unique buyers" />
        </div>

        {/* Recent orders */}
        <div className="rounded-xl border border-border/50 bg-background overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <h2 className="text-[13px] font-semibold tracking-tight">Recent orders</h2>
            <button
              className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1"
              onClick={() => onNavigate('orders')}
            >
              View all <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-[12px] text-muted-foreground">No orders yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recentOrders.map(o => (
                <button
                  key={o.id}
                  onClick={() => onNavigate('orders')}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">#{o.order_number || o.id.slice(0, 8)}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{o.customer_email || 'Guest'} · {new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium border ${
                    o.status === 'paid'      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                    o.status === 'pending'   ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                    'bg-muted text-muted-foreground border-border/40'
                  }`}>{o.status || 'pending'}</span>
                  <span className="text-[13px] font-semibold tabular-nums">{money(Number(o.total_amount || 0))}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick tiles */}
        <div>
          <h2 className="text-[13px] font-semibold tracking-tight mb-3 px-1">Get started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <QuickTile
              icon={Package}
              title="Add your first product"
              description="Add products with images, prices and inventory tracking."
              onClick={() => onNavigate('products')}
            />
            <QuickTile
              icon={Users}
              title="Import customers"
              description="Bring customer records over from your existing store."
              onClick={() => onNavigate('customers')}
            />
            <QuickTile
              icon={TrendingUp}
              title="Set up analytics"
              description="Track sales, sessions, and conversion in real time."
              onClick={() => onNavigate('analytics')}
            />
          </div>
        </div>
      </PageBody>
    </>
  );
}

function QuickTile({ icon: Icon, title, description, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="text-left group rounded-xl border border-border/50 bg-background p-4 hover:border-emerald-500/40 hover:shadow-sm transition-all"
    >
      <div className="h-9 w-9 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center mb-3 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-colors">
        <Icon className="h-4 w-4 text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
      </div>
      <p className="text-[13px] font-semibold tracking-tight">{title}</p>
      <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{description}</p>
    </button>
  );
}
