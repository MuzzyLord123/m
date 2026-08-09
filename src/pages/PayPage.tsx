/**
 * Quooro Pay — the customer-facing payment page.
 *
 * A shopper checks out on a merchant's own website (via the embed), and the
 * order handoff lands here: a Quooro E-commerce branded page that shows the
 * order plainly and takes payment. Stripe when the store has connected it;
 * an honest order-confirmed receipt when it hasn't. Public route — customers
 * are not Quooro users.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Lock, ShieldCheck, CheckCircle2, ArrowLeft, AlertCircle, Store, CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store-checkout`;

interface OrderItem { product_id: string; name: string; price: number; qty: number; line_total: number; image?: string | null }
interface PayOrder {
  id: string; status: string; payment_status: string; payment_provider: string;
  customer_email: string | null; customer_name: string | null;
  items: OrderItem[]; currency: string;
  subtotal: number; shipping_cost: number; tax_amount: number; total: number;
  store_name: string | null; accent: string | null; success_url: string | null;
}

type Stage = 'loading' | 'ready' | 'redirecting' | 'paid' | 'confirmed' | 'cancelled' | 'error';

export default function PayPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [params] = useSearchParams();
  const returnUrl = params.get('return');
  const cameBackPaid = params.get('paid') === '1';
  const cameBackCancelled = params.get('cancelled') === '1';

  const [order, setOrder] = useState<PayOrder | null>(null);
  const [stage, setStage] = useState<Stage>('loading');
  const [error, setError] = useState<string>('');
  const confirmedOnce = useRef(false);

  const money = useCallback((v: number) => {
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: order?.currency || 'GBP' }).format(v); }
    catch { return `${order?.currency || 'GBP'} ${Number(v).toFixed(2)}`; }
  }, [order?.currency]);

  /* Return-to-store carries the order id so the embed can clear the bag
     and greet the customer. */
  const backToStore = useMemo(() => {
    if (!returnUrl) return null;
    const sep = returnUrl.includes('?') ? '&' : '?';
    return `${returnUrl}${sep}q_order=${sessionId}`;
  }, [returnUrl, sessionId]);

  useEffect(() => {
    if (!sessionId) { setStage('error'); setError('No order reference.'); return; }
    (async () => {
      try {
        const r = await fetch(`${FUNCTIONS_URL}/${sessionId}`);
        const d = await r.json();
        if (!d?.session) throw new Error(d?.error || 'Order not found');
        const o: PayOrder = d.session;
        setOrder(o);

        if (o.payment_status === 'paid') { setStage('paid'); return; }

        if (cameBackPaid) {
          // Back from Stripe — verify server-side before saying anything.
          const vr = await fetch(`${FUNCTIONS_URL}/verify`, {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
          const vd = await vr.json();
          if (vd?.paid) { setOrder(vd.order); setStage('paid'); return; }
          setStage('cancelled'); return;
        }
        if (cameBackCancelled) { setStage('cancelled'); return; }

        if (o.payment_provider === 'stripe') { setStage('ready'); return; }

        // Manual / none: the customer already pressed "Place order" on the
        // store's site — confirm now and show the receipt, no second click.
        if (!confirmedOnce.current) {
          confirmedOnce.current = true;
          await fetch(`${FUNCTIONS_URL}/confirm`, {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          });
        }
        setStage('confirmed');
      } catch (e) {
        setStage('error');
        setError(e instanceof Error ? e.message : 'Could not load this order.');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const pay = async () => {
    if (!sessionId) return;
    setStage('redirecting');
    try {
      const r = await fetch(`${FUNCTIONS_URL}/stripe-session`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, return_url: returnUrl || undefined }),
      });
      const d = await r.json();
      if (!d?.url) throw new Error(d?.error || 'Could not start the payment.');
      window.location.href = d.url;
    } catch (e) {
      setStage('ready');
      setError(e instanceof Error ? e.message : 'Could not start the payment.');
    }
  };

  const storeName = order?.store_name || 'Order';
  const done = stage === 'paid' || stage === 'confirmed';

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans">
      {/* the lounge's ambient brand glows */}
      <div className="absolute top-0 right-0 w-[560px] h-[560px] bg-brand/[0.06] rounded-full blur-[140px] pointer-events-none -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-brand/[0.05] rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

      {/* top bar */}
      <header className="relative h-14 border-b border-border/40 bg-card/60 backdrop-blur-xl flex items-center px-4 sm:px-6 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-bold tracking-tight text-[15px]">Quooro</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-semibold uppercase tracking-[0.14em] shrink-0">
            Pay
          </span>
        </div>
        <div className="hidden sm:block h-4 w-px bg-border/40" />
        <div className="hidden sm:flex items-center gap-2 text-[13px] text-muted-foreground min-w-0">
          <Store className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{storeName}</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span className="hidden sm:inline">Secure checkout</span>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {stage === 'loading' && (
          <div className="py-32 flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-border/40 border-t-brand rounded-full animate-spin" />
            <p className="text-[13px] text-muted-foreground">Loading your order…</p>
          </div>
        )}

        {stage === 'error' && (
          <div className="max-w-md mx-auto py-24 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h1 className="text-[20px] font-display font-bold tracking-tight">We couldn't find that order</h1>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{error}</p>
            {backToStore && (
              <Button variant="outline" className="mt-6 rounded-xl" asChild>
                <a href={backToStore}><ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to the store</a>
              </Button>
            )}
          </div>
        )}

        {order && stage !== 'loading' && stage !== 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]"
          >
            {/* ── order summary ── */}
            <section className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden h-fit">
              <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your order</p>
                  <p className="text-[15px] font-display font-bold tracking-tight mt-0.5">{storeName}</p>
                </div>
                <span className="text-[10px] font-mono text-muted-foreground/70 uppercase tracking-wider">
                  Ref {String(order.id).slice(0, 8)}
                </span>
              </div>
              <ul className="divide-y divide-border/30 px-6">
                {order.items.map((it, i) => (
                  <li key={i} className="py-4 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-muted/60 border border-border/30 overflow-hidden shrink-0">
                      {it.image && <img src={it.image} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-medium leading-snug truncate">{it.name}</p>
                      <p className="text-[12px] text-muted-foreground mt-0.5 tabular-nums">
                        {money(Number(it.price))} × {it.qty}
                      </p>
                    </div>
                    <p className="text-[13.5px] font-semibold tabular-nums shrink-0">{money(Number(it.line_total))}</p>
                  </li>
                ))}
              </ul>
              <div className="px-6 py-4 border-t border-border/40 space-y-2">
                <Row label="Subtotal" value={money(Number(order.subtotal))} />
                {Number(order.shipping_cost) > 0
                  ? <Row label="Shipping" value={money(Number(order.shipping_cost))} />
                  : <Row label="Shipping" value="Free" />}
                {Number(order.tax_amount) > 0 && <Row label="Tax" value={money(Number(order.tax_amount))} />}
                <div className="flex items-baseline justify-between pt-2 border-t border-border/40">
                  <span className="text-[13px] font-semibold">Total</span>
                  <span className="text-[22px] font-display font-bold tabular-nums tracking-[-0.02em]">
                    {money(Number(order.total))}
                  </span>
                </div>
              </div>
            </section>

            {/* ── payment / receipt panel ── */}
            <section className="space-y-4">
              {done ? (
                <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-7 relative overflow-hidden">
                  <div className="absolute -top-10 -right-8 w-40 h-40 bg-emerald-500/[0.07] rounded-full blur-[60px] pointer-events-none" />
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-4">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <h1 className="text-[20px] font-display font-bold tracking-tight">
                      {stage === 'paid' ? 'Payment received' : 'Order placed'}
                    </h1>
                    <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                      {stage === 'paid'
                        ? <>Thank you{order.customer_name ? `, ${order.customer_name.split(' ')[0]}` : ''}. Your payment of <strong className="text-foreground">{money(Number(order.total))}</strong> has gone through{order.customer_email ? <> — a confirmation is on its way to <strong className="text-foreground">{order.customer_email}</strong></> : ''}.</>
                        : <>Thank you{order.customer_name ? `, ${order.customer_name.split(' ')[0]}` : ''}. {storeName} has your order and will email {order.customer_email ? <strong className="text-foreground">{order.customer_email}</strong> : 'you'} to confirm it and arrange payment.</>}
                    </p>
                    <div className="mt-5 rounded-xl border border-border/40 bg-muted/30 px-4 py-3 flex items-center justify-between">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Order ref</span>
                      <span className="text-[13px] font-mono font-semibold">{String(order.id).slice(0, 8)}</span>
                    </div>
                    {(backToStore || order.success_url) && (
                      <Button className="w-full mt-5 h-11 rounded-xl text-[13px] font-semibold" asChild>
                        <a href={backToStore || order.success_url!}>
                          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Return to {storeName}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-7 relative overflow-hidden">
                  <div className="absolute -top-10 -right-8 w-40 h-40 bg-brand/[0.07] rounded-full blur-[60px] pointer-events-none" />
                  <div className="relative">
                    <div className="h-12 w-12 rounded-2xl bg-brand/10 border border-brand/25 flex items-center justify-center mb-4">
                      <CreditCard className="h-6 w-6 text-brand" />
                    </div>
                    <h1 className="text-[20px] font-display font-bold tracking-tight">
                      {stage === 'cancelled' ? 'Payment not completed' : 'Complete your payment'}
                    </h1>
                    <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                      {stage === 'cancelled'
                        ? 'No payment was taken and your bag is untouched. You can try again whenever you’re ready.'
                        : <>You’re paying <strong className="text-foreground">{storeName}</strong>{order.customer_email ? <> as <strong className="text-foreground">{order.customer_email}</strong></> : ''}. Card details are entered on Stripe’s secure page — they never touch this site.</>}
                    </p>
                    {error && stage === 'ready' && (
                      <p className="text-[12px] text-red-500 mt-3">{error}</p>
                    )}
                    <Button
                      onClick={pay}
                      disabled={stage === 'redirecting'}
                      className="w-full mt-5 h-12 rounded-xl text-[14px] font-semibold shadow-glow-sm"
                    >
                      {stage === 'redirecting'
                        ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Opening secure payment…</span>
                        : <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Pay {money(Number(order.total))}</span>}
                    </Button>
                    <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Payments processed by Stripe. {storeName} never sees your card.
                    </div>
                  </div>
                </div>
              )}

              {backToStore && !done && (
                <a
                  href={backToStore.replace(/([?&])q_order=[^&]*/, '$1').replace(/[?&]$/, '')}
                  className="block text-center text-[12px] text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  ← Back to {storeName}
                </a>
              )}

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60 pt-2">
                Powered by <span className="font-display font-bold text-muted-foreground">Quooro</span> E-commerce
              </div>
            </section>
          </motion.div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
