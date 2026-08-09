import { useEffect, useState } from 'react';
import {
  CreditCard, Check, AlertCircle, ExternalLink, Save, Lock, ShieldCheck,
  Store, ArrowRight, Globe, KeyRound, Unplug,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { TablesInsert } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PageHeader, PageBody } from '../shared/PageChrome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type Provider = 'none' | 'stripe' | 'manual';

interface Payload {
  payments_provider: Provider;
  payments_test_mode: boolean;
  payments_configured: boolean;
  checkout_success_url: string | null;
  checkout_cancel_url: string | null;
}

const OPTIONS: { id: Provider; name: string; blurb: string; badge?: string }[] = [
  { id: 'stripe', name: 'Stripe', blurb: 'Cards, Apple Pay, Google Pay. Customers pay on Stripe’s secure page and the order is marked paid automatically.', badge: 'Recommended' },
  { id: 'manual', name: 'Manual', blurb: 'Take orders online, capture payment offline — bank transfer, invoice or in person. Orders arrive as awaiting payment.' },
  { id: 'none', name: 'Browse only', blurb: 'Orders are still recorded with the customer’s details, but no payment step is offered.' },
];

export default function PaymentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payload, setPayload] = useState<Payload>({
    payments_provider: 'none',
    payments_test_mode: true,
    payments_configured: false,
    checkout_success_url: '',
    checkout_cancel_url: '',
  });
  const [keyInput, setKeyInput] = useState('');
  const [keyMask, setKeyMask] = useState<string | null>(null); // "sk_…1234" when a key is stored

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('ecommerce_settings')
        .select('payments_provider,payments_test_mode,payments_configured,checkout_success_url,checkout_cancel_url,stripe_secret_key')
        .eq('user_id', user.id).maybeSingle();
      if (data) {
        const { stripe_secret_key, ...rest } = data;
        // Every column but one now checks against the generated row type. The
        // database stores payments_provider as free text; the UI only ever
        // writes the three values in OPTIONS, so narrow just that field.
        setPayload(p => ({ ...p, ...rest, payments_provider: rest.payments_provider as Provider }));
        if (stripe_secret_key) {
          setKeyMask(`${stripe_secret_key.slice(0, 7)}…${stripe_secret_key.slice(-4)}`);
        }
      }
      setLoading(false);
    })();
  }, [user]);

  const set = <K extends keyof Payload>(k: K, v: Payload[K]) => setPayload(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const patch: TablesInsert<'ecommerce_settings'> = { user_id: user.id, ...payload };
    const trimmed = keyInput.trim();
    if (trimmed) {
      if (!/^(sk|rk)_(test|live)_/.test(trimmed)) {
        setSaving(false);
        toast.error('That doesn’t look like a Stripe secret key (sk_test_… or sk_live_…)');
        return;
      }
      patch.stripe_secret_key = trimmed;
    }
    const hasKey = !!trimmed || !!keyMask;
    const paymentsConfigured = payload.payments_provider === 'stripe' ? hasKey : payload.payments_provider === 'manual';
    patch.payments_configured = paymentsConfigured;
    const { error } = await supabase.from('ecommerce_settings').upsert(patch, { onConflict: 'user_id' });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (trimmed) {
      setKeyMask(`${trimmed.slice(0, 7)}…${trimmed.slice(-4)}`);
      setKeyInput('');
    }
    setPayload(p => ({ ...p, payments_configured: paymentsConfigured }));
    toast.success('Payment settings saved');
  };

  const disconnect = async () => {
    if (!user) return;
    const { error } = await supabase.from('ecommerce_settings')
      .update({ stripe_secret_key: null, payments_configured: false })
      .eq('user_id', user.id);
    if (error) { toast.error(error.message); return; }
    setKeyMask(null); setKeyInput('');
    setPayload(p => ({ ...p, payments_configured: false }));
    toast.success('Stripe disconnected');
  };

  const stripeLive = payload.payments_provider === 'stripe' && !!keyMask;

  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Payments']}
        title="Payments"
        description="How customers pay for orders placed through your storefront embed. Checkout happens on the Quooro pay page; card details are only ever entered on Stripe."
        actions={
          <Button size="sm" onClick={save} disabled={saving || loading} className="h-9 rounded-xl px-4">
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? 'Saving…' : 'Save'}
          </Button>
        }
        meta={
          <div className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]',
            stripeLive
              ? 'border-emerald-500/25 bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400'
              : payload.payments_provider === 'manual'
                ? 'border-brand/25 bg-brand/[0.06] text-brand'
                : 'border-amber-500/25 bg-amber-500/[0.08] text-amber-600 dark:text-amber-400',
          )}>
            <span className={cn('h-1.5 w-1.5 rounded-full', stripeLive ? 'bg-emerald-500' : payload.payments_provider === 'manual' ? 'bg-brand' : 'bg-amber-500')} />
            {stripeLive ? 'Card payments live' : payload.payments_provider === 'manual' ? 'Manual payments' : 'Payments not set up'}
          </div>
        }
      />
      <PageBody>
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-border/40 border-t-brand rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* the customer's journey, so the merchant knows exactly what ships */}
            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm px-5 py-4 overflow-x-auto">
              <div className="flex items-center gap-3 min-w-max text-[12px]">
                <JourneyStep icon={Globe} title="Your website" sub="Catalogue, bag & checkout form in your site’s own look" />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                <JourneyStep icon={Store} title="Quooro Pay" sub="Branded order summary & receipt" brand />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                <JourneyStep icon={Lock} title="Stripe" sub="Card entry on Stripe’s secure page" />
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                <JourneyStep icon={Check} title="Orders" sub="Marked paid in your Orders page" />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3 mt-4">
              {OPTIONS.map(o => {
                const active = payload.payments_provider === o.id;
                return (
                  <button key={o.id}
                    onClick={() => set('payments_provider', o.id)}
                    className={cn(
                      'relative text-left rounded-2xl border p-5 backdrop-blur-sm transition-all overflow-hidden',
                      active
                        ? 'border-brand/40 bg-brand/[0.06] shadow-[0_0_0_1px_hsl(var(--brand)/0.15)]'
                        : 'border-border/40 bg-card/60 hover:border-border/70'
                    )}>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand/[0.05] rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'h-9 w-9 rounded-xl border flex items-center justify-center shrink-0',
                          active ? 'bg-brand/15 border-brand/25 text-brand' : 'bg-muted/40 border-border/40 text-muted-foreground'
                        )}>
                          <CreditCard className="h-4 w-4" />
                        </div>
                        <h3 className="text-[14px] font-semibold tracking-tight">{o.name}</h3>
                        {o.badge && (
                          <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-semibold uppercase tracking-wider">
                            {o.badge}
                          </span>
                        )}
                        {active && <Check className="h-4 w-4 text-brand ml-auto shrink-0" />}
                      </div>
                      <p className="text-[12px] text-muted-foreground mt-2.5 leading-relaxed">{o.blurb}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stripe connection */}
            {payload.payments_provider === 'stripe' && (
              <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 mt-4 relative overflow-hidden">
                <div className="absolute -top-12 -right-8 w-44 h-44 bg-brand/[0.05] rounded-full blur-[60px] pointer-events-none" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-[14px] font-semibold tracking-tight flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-brand" /> Stripe connection
                      </h3>
                      <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed max-w-xl">
                        Paste your Stripe <strong className="text-foreground">secret key</strong>. It’s stored in your store settings,
                        readable only by you and used server-side to create checkout sessions — it is never sent to your website
                        or shown to customers.
                      </p>
                    </div>
                    {keyMask && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                        <ShieldCheck className="h-3 w-3" /> {keyMask}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    <Input
                      type="password"
                      autoComplete="off"
                      value={keyInput}
                      onChange={e => setKeyInput(e.target.value)}
                      placeholder={keyMask ? 'Paste a new key to replace the connected one' : 'sk_live_…  or  sk_test_…'}
                      className="flex-1 min-w-[260px] font-mono text-[12.5px] h-10 rounded-xl"
                    />
                    {keyMask && (
                      <Button variant="outline" size="sm" className="h-10 rounded-xl text-xs" onClick={disconnect}>
                        <Unplug className="h-3.5 w-3.5 mr-1.5" /> Disconnect
                      </Button>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[11.5px] text-muted-foreground flex-wrap">
                    <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 text-brand hover:underline">
                      Get your API keys <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="inline-flex items-center gap-1.5">
                      <Lock className="h-3 w-3" /> Use an sk_test_ key first — place a test order end to end, then switch to live.
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 space-y-4 mt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[14px] font-semibold tracking-tight">After checkout</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Optional. By default customers are returned to the page they were shopping on.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[12px]">Test mode</Label>
                  <Switch checked={payload.payments_test_mode} onCheckedChange={v => set('payments_test_mode', v)} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Success URL</Label>
                  <Input value={payload.checkout_success_url ?? ''} onChange={e => set('checkout_success_url', e.target.value)} placeholder="https://yourbrand.com/thanks" className="rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cancel URL</Label>
                  <Input value={payload.checkout_cancel_url ?? ''} onChange={e => set('checkout_cancel_url', e.target.value)} placeholder="https://yourbrand.com/cart" className="rounded-xl" />
                </div>
              </div>

              {payload.payments_provider === 'stripe' && !keyMask && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[12.5px] leading-relaxed">
                    <p className="font-semibold text-foreground">No key connected yet</p>
                    <p className="text-muted-foreground mt-1">
                      Until a Stripe key is saved, customers see the order-confirmed flow instead of a card payment —
                      orders still arrive in your Orders page as awaiting payment.
                    </p>
                  </div>
                </div>
              )}

              {payload.payments_provider === 'manual' && (
                <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/[0.04] p-4">
                  <Check className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                  <div className="text-[12.5px] leading-relaxed">
                    <p className="font-semibold text-foreground">Manual mode active</p>
                    <p className="text-muted-foreground mt-1">
                      Orders are captured with the customer’s contact and delivery details and appear in the Orders tab.
                      Follow up to arrange payment — bank transfer, invoice, in person, or your preferred method.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </PageBody>
    </>
  );
}

function JourneyStep({ icon: Icon, title, sub, brand }: { icon: typeof Globe; title: string; sub: string; brand?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className={cn(
        'h-8 w-8 rounded-lg border flex items-center justify-center shrink-0',
        brand ? 'bg-brand/12 border-brand/25 text-brand' : 'bg-muted/40 border-border/40 text-muted-foreground',
      )}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-[12px] font-semibold leading-tight">{title}</p>
        <p className="text-[10.5px] text-muted-foreground leading-tight mt-0.5">{sub}</p>
      </div>
    </div>
  );
}
