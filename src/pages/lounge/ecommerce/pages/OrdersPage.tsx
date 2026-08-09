/**
 * Orders — reads ecommerce_orders, the table the storefront embed and
 * pay page actually write to. (It read site_orders for a while, which
 * meant storefront orders never appeared here at all.)
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, Search, Download, X, MapPin, Mail, Phone, PackageCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

interface OrderItem { product_id?: string; name: string; price: number; qty: number; line_total: number; image?: string | null }
interface Order {
  id: string; order_number: string | null;
  customer_email: string | null; customer_name: string | null; customer_phone: string | null;
  shipping_address: { line1?: string; line2?: string; city?: string; postal_code?: string; country?: string } | null;
  status: string; payment_status: string; payment_provider: string;
  items: OrderItem[]; subtotal: number; shipping_cost: number; tax_amount: number;
  total: number; currency: string; created_at: string;
}

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'awaiting', label: 'Awaiting payment' },
  { id: 'fulfilled', label: 'Fulfilled' },
] as const;

const PAY_CHIP: Record<string, string> = {
  paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  awaiting_payment: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25',
  unpaid: 'bg-muted text-muted-foreground border-border/40',
};
const payLabel = (p: string) => p === 'awaiting_payment' ? 'awaiting' : (p || 'unpaid');

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('all');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<Order | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('ecommerce_orders').select('*')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(500);
      setOrders((data as unknown as Order[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const counts = useMemo(() => ({
    all: orders.length,
    paid: orders.filter(o => o.payment_status === 'paid').length,
    awaiting: orders.filter(o => o.payment_status === 'awaiting_payment').length,
    fulfilled: orders.filter(o => o.status === 'fulfilled').length,
  }), [orders]);

  const filtered = orders.filter(o => {
    if (tab === 'paid' && o.payment_status !== 'paid') return false;
    if (tab === 'awaiting' && o.payment_status !== 'awaiting_payment') return false;
    if (tab === 'fulfilled' && o.status !== 'fulfilled') return false;
    if (search) {
      const q = search.toLowerCase();
      const hay = `${o.customer_email || ''} ${o.customer_name || ''} ${o.order_number || ''} ${o.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const money = (n: number, c = 'GBP') => new Intl.NumberFormat('en-GB', { style: 'currency', currency: c || 'GBP' }).format(Number(n || 0));
  const ref = (o: Order) => `#${o.order_number || o.id.slice(0, 8)}`;

  const exportCsv = () => {
    if (!filtered.length) { toast.info('Nothing to export in this view'); return; }
    const head = ['ref', 'date', 'customer', 'email', 'phone', 'status', 'payment', 'items', 'subtotal', 'shipping', 'tax', 'total', 'currency'];
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map(o => [
      ref(o), new Date(o.created_at).toISOString(), o.customer_name, o.customer_email, o.customer_phone,
      o.status, o.payment_status,
      (o.items || []).map(i => `${i.qty}x ${i.name}`).join('; '),
      o.subtotal, o.shipping_cost, o.tax_amount, o.total, o.currency,
    ].map(cell).join(','));
    const blob = new Blob([[head.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success(`Exported ${filtered.length} order${filtered.length === 1 ? '' : 's'}`);
  };

  const markFulfilled = async (o: Order) => {
    const { error } = await supabase.from('ecommerce_orders').update({ status: 'fulfilled' }).eq('id', o.id);
    if (error) { toast.error(error.message); return; }
    setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status: 'fulfilled' } : x));
    setOpen(prev => prev && prev.id === o.id ? { ...prev, status: 'fulfilled' } : prev);
    toast.success(`${ref(o)} marked as fulfilled`);
  };

  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Orders']}
        title="Orders"
        description="Every order placed through your storefront, with the customer's contact and delivery details."
        actions={
          <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
        }
      />
      <PageBody>
        <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
          {/* tabs with honest counts */}
          <div className="flex items-center gap-0.5 px-2 pt-2 border-b border-border/40 overflow-x-auto">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'h-9 px-3 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5',
                  tab === t.id ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                )}
              >
                {t.label}
                <span className="text-[10px] font-semibold tabular-nums text-muted-foreground/70">{counts[t.id]}</span>
              </button>
            ))}
          </div>
          <div className="p-2 border-b border-border/40">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name, email or order ref"
                className="h-9 pl-9 rounded-lg text-[13px] bg-background/60 border-border/40" />
            </div>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={ShoppingBag}
                title={orders.length === 0 ? 'No orders yet' : 'No orders match'}
                description={orders.length === 0
                  ? 'When customers buy through your storefront embed, orders arrive here with contact and delivery details attached.'
                  : 'Try clearing the search or switching tabs.'}
              />
            </div>
          ) : (
            <>
              {/* desktop header */}
              <div className="hidden md:grid grid-cols-[110px_minmax(0,1fr)_110px_110px_100px_110px] gap-4 px-5 py-2.5 bg-muted/30 border-b border-border/40 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                <span>Order</span><span>Customer</span><span>Payment</span><span>Status</span><span>Date</span><span className="text-right">Total</span>
              </div>
              <div className="divide-y divide-border/30">
                {filtered.map(o => (
                  <button
                    key={o.id}
                    onClick={() => setOpen(o)}
                    className="w-full text-left hover:bg-muted/30 transition-colors
                      grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 px-4 py-3
                      md:grid-cols-[110px_minmax(0,1fr)_110px_110px_100px_110px] md:gap-4 md:px-5 md:items-center"
                  >
                    {/* mobile: two-line card · desktop: table row */}
                    <span className="text-[13px] font-semibold tabular-nums md:order-none">{ref(o)}</span>
                    <span className="text-[13px] font-semibold tabular-nums text-right md:hidden">{money(o.total, o.currency)}</span>
                    <div className="min-w-0 col-span-2 md:col-span-1">
                      <p className="text-[12.5px] truncate">{o.customer_name || o.customer_email || 'Guest'}</p>
                      <p className="text-[11px] text-muted-foreground truncate md:hidden">
                        {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        {' · '}{(o.items || []).reduce((s, i) => s + (i.qty || 0), 0)} item{(o.items || []).reduce((s, i) => s + (i.qty || 0), 0) === 1 ? '' : 's'}
                      </p>
                      {o.customer_name && <p className="hidden md:block text-[11px] text-muted-foreground truncate">{o.customer_email}</p>}
                    </div>
                    <div className="col-span-2 md:col-span-1 flex md:block gap-1.5">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium border', PAY_CHIP[o.payment_status] || PAY_CHIP.unpaid)}>
                        {payLabel(o.payment_status)}
                      </span>
                      {o.status !== 'paid' && (
                        <span className={cn('md:hidden inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium border',
                          o.status === 'fulfilled' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25' : 'bg-muted text-muted-foreground border-border/40')}>
                          {o.status || 'pending'}
                        </span>
                      )}
                    </div>
                    <span className={cn('hidden md:inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium border w-fit',
                      o.status === 'fulfilled' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/25' : 'bg-muted text-muted-foreground border-border/40')}>
                      {o.status || 'pending'}
                    </span>
                    <span className="hidden md:block text-[12px] text-muted-foreground tabular-nums">
                      {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="hidden md:block text-[13px] font-semibold tabular-nums text-right">{money(o.total, o.currency)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </PageBody>

      {/* ── order detail: right drawer on desktop, bottom sheet on mobile ── */}
      {open && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]" onClick={() => setOpen(null)} />
          <div className="absolute bg-background border-border/50 shadow-2xl flex flex-col
            inset-x-0 bottom-0 max-h-[88vh] rounded-t-2xl border-t
            sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[440px] sm:max-h-none sm:rounded-none sm:border-l">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 shrink-0">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Order</p>
                <p className="text-[16px] font-display font-bold tracking-tight">{ref(open)}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-medium border', PAY_CHIP[open.payment_status] || PAY_CHIP.unpaid)}>
                  {payLabel(open.payment_status)}
                </span>
                <button className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center" onClick={() => setOpen(null)} aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* items */}
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">Items</p>
                <div className="space-y-2.5">
                  {(open.items || []).map((it, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-lg bg-muted/60 border border-border/30 overflow-hidden shrink-0">
                        {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-medium truncate">{it.name}</p>
                        <p className="text-[11px] text-muted-foreground tabular-nums">{money(it.price, open.currency)} × {it.qty}</p>
                      </div>
                      <p className="text-[12.5px] font-semibold tabular-nums">{money(it.line_total, open.currency)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5 text-[12.5px]">
                  <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="tabular-nums">{money(open.subtotal, open.currency)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span className="tabular-nums">{Number(open.shipping_cost) > 0 ? money(open.shipping_cost, open.currency) : 'Free'}</span></div>
                  {Number(open.tax_amount) > 0 && <div className="flex justify-between text-muted-foreground"><span>Tax</span><span className="tabular-nums">{money(open.tax_amount, open.currency)}</span></div>}
                  <div className="flex justify-between font-semibold text-[14px] pt-1.5 border-t border-border/40"><span>Total</span><span className="tabular-nums">{money(open.total, open.currency)}</span></div>
                </div>
              </div>

              {/* customer */}
              <div>
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2">Customer</p>
                <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-2 text-[12.5px]">
                  {open.customer_name && <p className="font-medium">{open.customer_name}</p>}
                  {open.customer_email && (
                    <a href={`mailto:${open.customer_email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                      <Mail className="h-3.5 w-3.5" /> {open.customer_email}
                    </a>
                  )}
                  {open.customer_phone && (
                    <p className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {open.customer_phone}</p>
                  )}
                  {open.shipping_address?.line1 && (
                    <p className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        {open.shipping_address.line1}{open.shipping_address.line2 ? `, ${open.shipping_address.line2}` : ''},{' '}
                        {open.shipping_address.city}, {open.shipping_address.postal_code}, {open.shipping_address.country}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Placed {new Date(open.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                {' · '}provider: {open.payment_provider || 'none'}
              </p>
            </div>

            <div className="px-5 py-4 border-t border-border/40 shrink-0">
              {open.status === 'fulfilled' ? (
                <div className="flex items-center justify-center gap-2 text-[12.5px] text-sky-600 dark:text-sky-400 font-medium">
                  <PackageCheck className="h-4 w-4" /> Fulfilled
                </div>
              ) : (
                <Button className="w-full h-10 rounded-xl text-[13px]" onClick={() => markFulfilled(open)}>
                  <PackageCheck className="h-4 w-4 mr-2" /> Mark as fulfilled
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
