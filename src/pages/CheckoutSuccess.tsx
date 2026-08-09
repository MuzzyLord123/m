/**
 * Quooro Pay — the receipt a buyer lands on after paying.
 *
 * Reached from Stripe's success redirect on the site-builder checkout
 * (create-product-checkout). Until this page existed, that redirect pointed
 * at a route that was not in the router, so every buyer who completed a
 * payment on that path was shown the not-found screen.
 *
 * Landing here is NOT treated as proof of payment. The session id sits in a
 * URL anyone can retype, so the page asks the edge function to confirm the
 * charge against Stripe server-side, and only renders a receipt for what
 * Stripe itself calls paid. Public route — buyers are not Quooro users.
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-product-checkout`;

interface OrderItem { product_id: string; name: string; price: number; quantity: number }
interface SuccessOrder {
  order_number: string;
  status: string;
  total: number;
  currency: string;
  items: OrderItem[];
  customer_email: string | null;
}

type Stage = 'verifying' | 'paid' | 'pending' | 'error';

export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');

  const [order, setOrder] = useState<SuccessOrder | null>(null);
  const [stage, setStage] = useState<Stage>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) { setStage('error'); setError('No payment reference in this link.'); return; }
    (async () => {
      try {
        const r = await fetch(FUNCTIONS_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: 'verify', session_id: sessionId }),
        });
        const d = await r.json();
        if (d?.error) throw new Error(d.error);
        setOrder(d.order ?? null);
        // Stripe can still be settling when the buyer beats the webhook back.
        // "Pending" is the honest word for that; claiming paid would not be.
        setStage(d?.paid ? 'paid' : 'pending');
      } catch (e) {
        setStage('error');
        // A network failure surfaces as the browser's own "Failed to fetch",
        // which means nothing to someone who has just paid for something.
        // Anything we did not write ourselves gets a sentence instead.
        const raw = e instanceof Error ? e.message : '';
        const isNetwork = !raw || /failed to fetch|networkerror|load failed/i.test(raw);
        setError(
          isNetwork
            ? "We couldn't reach the payment service just now. Your payment has not been affected — please refresh in a moment."
            : raw,
        );
      }
    })();
  }, [sessionId]);

  const money = (v: number) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: order?.currency || 'GBP',
      }).format(v);
    } catch {
      return `${order?.currency || 'GBP'} ${Number(v).toFixed(2)}`;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 w-[560px] h-[560px] bg-brand/[0.06] rounded-full blur-[140px] pointer-events-none -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-brand/[0.05] rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

      <header className="relative h-14 border-b border-border/40 bg-card/60 backdrop-blur-xl flex items-center px-4 sm:px-6 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display font-bold tracking-tight text-[15px]">Quooro</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-semibold uppercase tracking-[0.14em] shrink-0">
            Pay
          </span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span className="hidden sm:inline">Secure checkout</span>
        </div>
      </header>

      <main className="relative max-w-lg mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {stage === 'verifying' && (
          <div className="py-28 flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-border/40 border-t-brand rounded-full animate-spin" />
            <p className="text-[13px] text-muted-foreground">Confirming your payment…</p>
          </div>
        )}

        {stage === 'error' && (
          <div className="py-20 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h1 className="text-[20px] font-display font-bold tracking-tight">We couldn't confirm that payment</h1>
            <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">{error}</p>
            <p className="text-[12px] text-muted-foreground/70 mt-4 leading-relaxed">
              If money has left your account, nothing is lost — keep this page's
              link and contact the store, and they can find the payment.
            </p>
          </div>
        )}

        {(stage === 'paid' || stage === 'pending') && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-7 relative overflow-hidden"
          >
            <div
              className={`absolute -top-10 -right-8 w-40 h-40 rounded-full blur-[60px] pointer-events-none ${
                stage === 'paid' ? 'bg-emerald-500/[0.07]' : 'bg-amber-500/[0.07]'
              }`}
            />
            <div className="relative">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-4 border ${
                  stage === 'paid'
                    ? 'bg-emerald-500/10 border-emerald-500/25'
                    : 'bg-amber-500/10 border-amber-500/25'
                }`}
              >
                {stage === 'paid'
                  ? <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  : <Clock className="h-6 w-6 text-amber-500" />}
              </div>

              <h1 className="text-[20px] font-display font-bold tracking-tight">
                {stage === 'paid' ? 'Payment received' : 'Payment still processing'}
              </h1>

              <p className="text-[13px] text-muted-foreground mt-2 leading-relaxed">
                {stage === 'paid' ? (
                  <>
                    Thank you. Your payment
                    {order ? <> of <strong className="text-foreground">{money(Number(order.total))}</strong></> : null}
                    {' '}has gone through
                    {order?.customer_email
                      ? <> — a confirmation is on its way to <strong className="text-foreground">{order.customer_email}</strong></>
                      : null}.
                  </>
                ) : (
                  <>
                    Your bank hasn't finished confirming this one yet. That is
                    normal and it usually settles within a minute or two —
                    refresh this page shortly. Do not pay again.
                  </>
                )}
              </p>

              {order && (
                <>
                  <div className="mt-5 rounded-xl border border-border/40 bg-muted/30 px-4 py-3 flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Order ref</span>
                    <span className="text-[13px] font-mono font-semibold">{order.order_number}</span>
                  </div>

                  {order.items?.length > 0 && (
                    <ul className="mt-4 divide-y divide-border/30 border-t border-border/30">
                      {order.items.map((it, i) => (
                        <li key={i} className="py-3 flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium leading-snug truncate">{it.name}</p>
                            <p className="text-[12px] text-muted-foreground mt-0.5 tabular-nums">
                              {money(Number(it.price))} × {it.quantity}
                            </p>
                          </div>
                          <p className="text-[13px] font-semibold tabular-nums shrink-0">
                            {money(Number(it.price) * Number(it.quantity))}
                          </p>
                        </li>
                      ))}
                      <li className="py-3 flex items-baseline justify-between">
                        <span className="text-[13px] font-semibold">Total</span>
                        <span className="text-[20px] font-display font-bold tabular-nums tracking-[-0.02em]">
                          {money(Number(order.total))}
                        </span>
                      </li>
                    </ul>
                  )}
                </>
              )}

              <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/60">
                Powered by <span className="font-display font-bold text-muted-foreground">Quooro</span> E-commerce
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
