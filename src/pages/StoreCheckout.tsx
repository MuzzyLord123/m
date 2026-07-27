import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShoppingBag, Lock, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const FUNCTIONS_URL = `https://ijybotwfiediocoewwux.supabase.co/functions/v1/store-checkout`;
const CART_KEY = 'quooro_cart_v1';

interface CartItem { id: string; qty: number; name?: string; price?: number; currency?: string; image?: string; }
interface Product { id: string; name: string; price: number; currency: string; images: string[]; }

export default function StoreCheckout() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const storeId = params.get('store');
  const sessionId = params.get('session');

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [form, setForm] = useState({
    email: '', name: '', phone: '',
    line1: '', line2: '', city: '', postal_code: '', country: 'GB',
  });

  // Load: either an existing session (via ?session=) or a fresh cart from localStorage
  useEffect(() => {
    (async () => {
      if (sessionId) {
        const r = await fetch(`${FUNCTIONS_URL}/${sessionId}`);
        const d = await r.json();
        if (d.session) {
          setSession(d.session);
          setConfirmed(d.session.status === 'confirmed');
        }
        setLoading(false);
        return;
      }
      if (!storeId) { setLoading(false); return; }
      try {
        const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
        setCart(Array.isArray(raw) ? raw : []);
        // pull authoritative product data
        const ids = (raw as CartItem[]).map(c => c.id);
        if (ids.length) {
          const { data } = await supabase.from('products')
            .select('id,name,price,currency,images')
            .in('id', ids)
            .eq('status', 'active');
          setProducts((data as any) || []);
        }
      } finally { setLoading(false); }
    })();
  }, [storeId, sessionId]);

  const lineItems = useMemo(() => {
    if (session) return session.items;
    return cart.map(c => {
      const p = products.find(x => x.id === c.id);
      if (!p) return null;
      return { product_id: p.id, name: p.name, price: Number(p.price), qty: c.qty, line_total: Number(p.price) * c.qty, image: p.images?.[0] };
    }).filter(Boolean) as any[];
  }, [cart, products, session]);

  const totals = useMemo(() => {
    if (session) return {
      subtotal: Number(session.subtotal), shipping: Number(session.shipping_cost),
      tax: Number(session.tax_amount), total: Number(session.total), currency: session.currency,
    };
    const subtotal = lineItems.reduce((a, i: any) => a + i.line_total, 0);
    return { subtotal, shipping: 0, tax: 0, total: subtotal, currency: (products[0]?.currency || 'GBP') };
  }, [lineItems, session, products]);

  const money = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: totals.currency || 'GBP' }).format(n || 0);

  const updateQty = (id: string, delta: number) => {
    const next = cart.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0);
    setCart(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  async function submit() {
    if (!storeId) return;
    if (!form.email) { toast.error('Email is required'); return; }
    if (!lineItems.length) { toast.error('Your cart is empty'); return; }
    setSubmitting(true);
    try {
      const r = await fetch(`${FUNCTIONS_URL}/session`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          user_id: storeId,
          items: cart.map(c => ({ id: c.id, qty: c.qty })),
          customer: {
            email: form.email, name: form.name, phone: form.phone,
            address: { line1: form.line1, line2: form.line2, city: form.city, postal_code: form.postal_code, country: form.country },
          },
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Checkout failed');
      // Confirm the order right away for manual/none providers
      const confirmR = await fetch(`${FUNCTIONS_URL}/confirm`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ session_id: d.session_id }),
      });
      const cd = await confirmR.json();
      localStorage.removeItem(CART_KEY);
      if (cd.redirect) window.location.href = cd.redirect;
      else navigate(`/checkout?session=${d.session_id}`, { replace: true });
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSubmitting(false); }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-brand" />
      </div>
    );
  }

  if (!storeId && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h1 className="text-lg font-semibold">Nothing to check out</h1>
          <p className="text-sm text-muted-foreground mt-2">Open a store link with your cart to continue.</p>
        </div>
      </div>
    );
  }

  const accent = session?.metadata?.checkout_accent || 'hsl(var(--brand))';
  const storeName = session?.metadata?.store_name || 'Checkout';

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Ambient */}
      <div className="fixed top-0 right-0 w-[560px] h-[560px] bg-brand/[0.05] rounded-full blur-[140px] pointer-events-none -translate-y-1/3 translate-x-1/4" />
      <div className="fixed bottom-0 left-0 w-[420px] h-[420px] bg-brand/[0.04] rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => history.length > 1 ? history.back() : navigate('/')} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Continue shopping
          </button>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" /> Secure checkout
          </div>
        </div>

        <h1 className="text-[26px] font-display font-bold tracking-[-0.02em] mb-6">{confirmed ? 'Order confirmed' : storeName}</h1>

        {confirmed ? (
          <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-8 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center mb-4">
              <Check className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-lg font-semibold tracking-tight">Thank you, {session?.customer_name || session?.customer_email}</h2>
            <p className="text-sm text-muted-foreground mt-1.5">Order {session?.order_number} — {money(Number(session?.total))} {session?.currency}</p>
            <p className="text-xs text-muted-foreground/70 mt-4 max-w-md mx-auto">
              A confirmation has been sent to {session?.customer_email}. The merchant will be in touch about payment and delivery.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Form */}
            <div className="space-y-4">
              <Section title="Contact">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Email" required>
                    <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  </Field>
                  <Field label="Full name">
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field label="Phone">
                    <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </Field>
                </div>
              </Section>

              <Section title="Shipping address">
                <div className="grid gap-3">
                  <Field label="Address line 1">
                    <Input value={form.line1} onChange={e => setForm({ ...form, line1: e.target.value })} />
                  </Field>
                  <Field label="Address line 2">
                    <Input value={form.line2} onChange={e => setForm({ ...form, line2: e.target.value })} />
                  </Field>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="City"><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} /></Field>
                    <Field label="Postal code"><Input value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} /></Field>
                    <Field label="Country"><Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} /></Field>
                  </div>
                </div>
              </Section>

              <Button
                onClick={submit}
                disabled={submitting || !lineItems.length}
                className="w-full h-12 rounded-xl text-sm font-semibold"
                style={{ background: accent, color: 'white' }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Place order · ${money(totals.total)}`}
              </Button>
              <p className="text-[11px] text-muted-foreground/70 text-center">By placing this order you agree to the store's terms.</p>
            </div>

            {/* Summary */}
            <aside className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 h-fit sticky top-6">
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Order summary</h3>
              <div className="space-y-3">
                {lineItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">Your cart is empty.</p>
                ) : lineItems.map((it: any) => (
                  <div key={it.product_id} className="flex gap-3 items-start">
                    <div className="h-14 w-14 rounded-lg bg-muted flex-shrink-0 overflow-hidden border border-border/40">
                      {it.image && <img src={it.image} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium truncate">{it.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {!session ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => updateQty(it.product_id, -1)} className="h-6 w-6 rounded-md border border-border/50 hover:bg-muted text-xs">−</button>
                            <span className="text-xs tabular-nums w-6 text-center">{it.qty}</span>
                            <button onClick={() => updateQty(it.product_id, +1)} className="h-6 w-6 rounded-md border border-border/50 hover:bg-muted text-xs">+</button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Qty {it.qty}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-[13px] font-semibold tabular-nums">{money(it.line_total)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-border/40 space-y-1.5 text-[13px]">
                <Row label="Subtotal" value={money(totals.subtotal)} />
                <Row label="Shipping" value={totals.shipping ? money(totals.shipping) : 'Free'} />
                {totals.tax > 0 && <Row label="Tax" value={money(totals.tax)} />}
                <div className="pt-2 mt-2 border-t border-border/40 flex items-baseline justify-between">
                  <span className="text-[13px] font-semibold">Total</span>
                  <span className="text-[18px] font-display font-bold tabular-nums">{money(totals.total)}</span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5">
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
