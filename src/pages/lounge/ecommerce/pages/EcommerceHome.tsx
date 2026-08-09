/**
 * E-commerce Home — the store's control room.
 *
 * Every number on this page is computed from the merchant's real
 * ecommerce_orders rows (the table the storefront embed writes to) —
 * not sampled, not capped, never invented. An empty store gets a
 * launch checklist instead of a wall of zeroes.
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  ShoppingBag, Package, ArrowRight, ArrowUpRight, Check, Circle,
  CreditCard, Code2, Store, Banknote, Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader, PageBody, StatCard } from '../shared/PageChrome';
import type { EcomPage } from '../EcommerceShell';

interface Props {
  onNavigate: (page: EcomPage) => void;
}

interface OrderRow {
  id: string; total: number; currency: string; status: string;
  payment_status: string; customer_email: string | null; customer_name: string | null;
  created_at: string;
}

export default function EcommerceHome({ onNavigate }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [productCount, setProductCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [settings, setSettings] = useState<{ store_name: string | null; payments_provider: string | null; payments_configured: boolean | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [pAll, pActive, o, s] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'active'),
        supabase.from('ecommerce_orders')
          .select('id,total,currency,status,payment_status,customer_email,customer_name,created_at')
          .eq('user_id', user.id).order('created_at', { ascending: false }).limit(500),
        supabase.from('ecommerce_settings')
          .select('store_name,payments_provider,payments_configured')
          .eq('user_id', user.id).maybeSingle(),
      ]);
      setProductCount(pAll.count || 0);
      setActiveCount(pActive.count || 0);
      setOrders((o.data as OrderRow[]) || []);
      setSettings((s.data as typeof settings) ?? null);
      setLoading(false);
    })();
  }, [user]);

  const cur = orders[0]?.currency || 'GBP';
  const money = (n: number, digits = 0) =>
    new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur, minimumFractionDigits: digits, maximumFractionDigits: digits || 2 }).format(n);

  const derived = useMemo(() => {
    const paid = orders.filter(o => o.payment_status === 'paid');
    const awaiting = orders.filter(o => o.payment_status === 'awaiting_payment');
    const collected = paid.reduce((s, o) => s + Number(o.total || 0), 0);
    const awaitingSum = awaiting.reduce((s, o) => s + Number(o.total || 0), 0);
    const customers = new Set(orders.map(o => o.customer_email).filter(Boolean)).size;
    /* last 14 days of collected revenue, oldest first */
    const days: { label: string; value: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const next = new Date(d); next.setDate(d.getDate() + 1);
      const value = paid
        .filter(o => { const t = new Date(o.created_at).getTime(); return t >= d.getTime() && t < next.getTime(); })
        .reduce((s, o) => s + Number(o.total || 0), 0);
      days.push({ label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), value });
    }
    const max = Math.max(...days.map(d => d.value), 0);
    return { paid, awaiting, collected, awaitingSum, customers, days, max };
  }, [orders]);

  const checklist = [
    {
      done: activeCount > 0,
      label: activeCount > 0 ? `${activeCount} active product${activeCount === 1 ? '' : 's'}` : 'Add your first product',
      hint: activeCount > 0 ? 'Live on your storefront' : 'Products must be set to Active to appear',
      page: 'products' as EcomPage, icon: Package,
    },
    {
      done: !!settings?.store_name,
      label: settings?.store_name ? `Store name: ${settings.store_name}` : 'Name your store',
      hint: settings?.store_name ? 'Shown on your storefront and pay page' : 'Set it in Settings — it heads your storefront',
      page: 'settings' as EcomPage, icon: Store,
    },
    {
      done: settings?.payments_provider === 'stripe' ? !!settings?.payments_configured : settings?.payments_provider === 'manual',
      label: settings?.payments_provider === 'stripe' && settings?.payments_configured
        ? 'Card payments live'
        : settings?.payments_provider === 'manual' ? 'Manual payments active' : 'Set up payments',
      hint: settings?.payments_provider === 'stripe' && settings?.payments_configured
        ? 'Customers pay by card via Stripe'
        : settings?.payments_provider === 'manual' ? 'You arrange payment after each order' : 'Connect Stripe or choose manual',
      page: 'payments' as EcomPage, icon: CreditCard,
    },
    {
      done: orders.length > 0,
      label: orders.length > 0 ? 'First order received' : 'Put your shop on a website',
      hint: orders.length > 0 ? 'The loop works — keep going' : 'Copy the embed script onto any site',
      page: 'embed' as EcomPage, icon: Code2,
    },
  ];
  const remaining = checklist.filter(c => !c.done).length;

  const PAY_CHIP: Record<string, string> = {
    paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
    awaiting_payment: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
    unpaid: 'bg-muted text-muted-foreground border-border/40',
  };

  return (
    <>
      <PageHeader
        title={settings?.store_name || 'Home'}
        description="Your store at a glance — every figure below comes from real orders."
        meta={
          !loading && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
                remaining === 0
                  ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400'
                  : 'border-brand/25 bg-brand/[0.06] text-brand',
              )}>
                <span className={cn('h-1.5 w-1.5 rounded-full', remaining === 0 ? 'bg-emerald-500' : 'bg-brand')} />
                {remaining === 0 ? 'Store fully set up' : `${4 - remaining} of 4 setup steps done`}
              </span>
            </div>
          )
        }
      />
      <PageBody>
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl border border-border/40 bg-card/60 animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* KPIs — full-set numbers, never a sample */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Collected" value={money(derived.collected)} hint={`${derived.paid.length} paid order${derived.paid.length === 1 ? '' : 's'}`} />
              <StatCard label="Awaiting payment" value={money(derived.awaitingSum)} hint={`${derived.awaiting.length} order${derived.awaiting.length === 1 ? '' : 's'} open`} />
              <StatCard label="Orders" value={String(orders.length)} hint="all time" />
              <StatCard label="Customers" value={String(derived.customers)} hint="unique emails" />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4 min-w-0">
                {/* Revenue, last 14 days */}
                <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 relative overflow-hidden">
                  <div className="absolute -top-12 -right-8 w-44 h-44 bg-brand/[0.05] rounded-full blur-[60px] pointer-events-none" />
                  <div className="relative">
                    <div className="flex items-baseline justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.14em]">Collected · last 14 days</p>
                        <p className="text-[22px] font-display font-bold tabular-nums tracking-[-0.02em] mt-1">
                          {money(derived.days.reduce((s, d) => s + d.value, 0), 2)}
                        </p>
                      </div>
                      <button onClick={() => onNavigate('analytics')}
                        className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                        Analytics <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="mt-4 flex items-end gap-[3px] h-24">
                      {derived.days.map((d, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0" title={`${d.label} — ${money(d.value, 2)}`}>
                          <div
                            className={cn('w-full rounded-t-[3px] transition-colors',
                              d.value > 0 ? 'bg-brand/70 group-hover:bg-brand' : 'bg-muted/60')}
                            style={{ height: derived.max > 0 ? `${Math.max(d.value / derived.max * 88, d.value > 0 ? 8 : 3)}px` : '3px' }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="mt-1.5 flex justify-between text-[9.5px] font-mono uppercase tracking-wider text-muted-foreground/60">
                      <span>{derived.days[0]?.label}</span>
                      <span>Today</span>
                    </div>
                    {derived.max === 0 && (
                      <p className="text-[11.5px] text-muted-foreground mt-3">
                        No card payments collected in the last 14 days — this chart fills in as orders are paid.
                      </p>
                    )}
                  </div>
                </div>

                {/* Recent orders */}
                <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/40">
                    <h2 className="text-[13px] font-semibold tracking-tight">Recent orders</h2>
                    <button
                      className="text-[12px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                      onClick={() => onNavigate('orders')}
                    >
                      View all <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                  {orders.length === 0 ? (
                    <div className="py-12 text-center px-6">
                      <ShoppingBag className="h-6 w-6 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-[13px] font-medium">No orders yet</p>
                      <p className="text-[12px] text-muted-foreground mt-1 max-w-sm mx-auto">
                        Orders placed through your storefront embed land here with the customer's contact and delivery details.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30">
                      {orders.slice(0, 6).map(o => (
                        <button
                          key={o.id}
                          onClick={() => onNavigate('orders')}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-lg bg-muted/60 border border-border/30 flex items-center justify-center shrink-0">
                            {o.payment_status === 'paid'
                              ? <Banknote className="h-3.5 w-3.5 text-emerald-500" />
                              : <Clock className="h-3.5 w-3.5 text-amber-500" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium truncate">{o.customer_name || o.customer_email || 'Guest'}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · #{o.id.slice(0, 8)}
                            </p>
                          </div>
                          <span className={cn('hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium border shrink-0',
                            PAY_CHIP[o.payment_status] || PAY_CHIP.unpaid)}>
                            {o.payment_status === 'awaiting_payment' ? 'awaiting' : o.payment_status}
                          </span>
                          <span className="text-[13px] font-semibold tabular-nums shrink-0">
                            {new Intl.NumberFormat('en-GB', { style: 'currency', currency: o.currency || 'GBP' }).format(Number(o.total || 0))}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Launch checklist */}
              <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 h-fit relative overflow-hidden">
                <div className="absolute -top-10 -right-8 w-36 h-36 bg-brand/[0.05] rounded-full blur-[50px] pointer-events-none" />
                <div className="relative">
                  <h2 className="text-[13px] font-semibold tracking-tight">
                    {remaining === 0 ? 'Everything is live' : 'Launch checklist'}
                  </h2>
                  <p className="text-[11.5px] text-muted-foreground mt-0.5">
                    {remaining === 0
                      ? 'All four steps done. Orders, payments and the storefront are running.'
                      : 'Four steps from empty to selling.'}
                  </p>
                  <div className="mt-4 space-y-1.5">
                    {checklist.map((c, i) => (
                      <button
                        key={i}
                        onClick={() => onNavigate(c.page)}
                        className={cn(
                          'w-full flex items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                          c.done ? 'border-border/30 bg-muted/20' : 'border-border/40 hover:border-brand/30 hover:bg-brand/[0.03]',
                        )}
                      >
                        <div className={cn(
                          'h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5',
                          c.done ? 'bg-emerald-500/15 border-emerald-500/30' : 'border-border/60',
                        )}>
                          {c.done
                            ? <Check className="h-3 w-3 text-emerald-500" />
                            : <Circle className="h-2 w-2 text-muted-foreground/40" />}
                        </div>
                        <div className="min-w-0">
                          <p className={cn('text-[12.5px] font-medium leading-snug', c.done && 'text-muted-foreground')}>{c.label}</p>
                          <p className="text-[11px] text-muted-foreground/80 mt-0.5 leading-snug">{c.hint}</p>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 ml-auto shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </PageBody>
    </>
  );
}
