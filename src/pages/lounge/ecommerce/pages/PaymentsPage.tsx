import { useEffect, useState } from 'react';
import { CreditCard, Check, AlertCircle, ExternalLink, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PageHeader, PageBody } from '../shared/PageChrome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type Provider = 'none' | 'stripe' | 'paddle' | 'manual';

interface Payload {
  payments_provider: Provider;
  payments_test_mode: boolean;
  payments_configured: boolean;
  checkout_success_url: string | null;
  checkout_cancel_url: string | null;
}

const OPTIONS: { id: Provider; name: string; blurb: string; badge?: string }[] = [
  { id: 'stripe', name: 'Stripe',   blurb: 'Cards, Apple Pay, Google Pay. Best for global card acceptance.', badge: 'Recommended' },
  { id: 'paddle', name: 'Paddle',   blurb: 'Merchant of record — Paddle handles VAT, sales tax and compliance.' },
  { id: 'manual', name: 'Manual',   blurb: 'Take orders online, invoice or capture payment offline.' },
  { id: 'none',   name: 'Disabled', blurb: 'Storefront runs in browse-only mode. No checkout is possible.' },
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

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('ecommerce_settings')
        .select('payments_provider,payments_test_mode,payments_configured,checkout_success_url,checkout_cancel_url')
        .eq('user_id', user.id).maybeSingle();
      if (data) setPayload({ ...payload, ...data } as Payload);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const set = <K extends keyof Payload>(k: K, v: Payload[K]) => setPayload(p => ({ ...p, [k]: v }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('ecommerce_settings').upsert({
      user_id: user.id, ...payload,
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Payment settings saved');
  };

  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Payments']}
        title="Payments"
        description="Choose how customers pay for orders placed through your storefront and embed widget."
        actions={
          <Button size="sm" onClick={save} disabled={saving || loading} className="h-9 rounded-xl px-4">
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? 'Saving…' : 'Save'}
          </Button>
        }
      />
      <PageBody>
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-border/40 border-t-brand rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
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
                    <div className="relative flex items-start gap-3">
                      <div className={cn(
                        'h-10 w-10 rounded-xl border flex items-center justify-center shrink-0',
                        active ? 'bg-brand/15 border-brand/25 text-brand' : 'bg-muted/40 border-border/40 text-muted-foreground'
                      )}>
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[14px] font-semibold tracking-tight">{o.name}</h3>
                          {o.badge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand border border-brand/20 font-semibold uppercase tracking-wider">
                              {o.badge}
                            </span>
                          )}
                          {active && (
                            <span className="ml-auto inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold uppercase tracking-wider">
                              <Check className="h-2.5 w-2.5" /> Selected
                            </span>
                          )}
                        </div>
                        <p className="text-[12.5px] text-muted-foreground mt-1 leading-relaxed">{o.blurb}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 space-y-4 mt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-[14px] font-semibold tracking-tight">Checkout configuration</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Where customers land after a successful or cancelled payment.</p>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-[12px]">Test mode</Label>
                  <Switch checked={payload.payments_test_mode} onCheckedChange={v => set('payments_test_mode', v)} />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Success URL</Label>
                  <Input value={payload.checkout_success_url ?? ''} onChange={e => set('checkout_success_url', e.target.value)} placeholder="https://yourbrand.com/thanks" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cancel URL</Label>
                  <Input value={payload.checkout_cancel_url ?? ''} onChange={e => set('checkout_cancel_url', e.target.value)} placeholder="https://yourbrand.com/cart" />
                </div>
              </div>

              {payload.payments_provider === 'stripe' && !payload.payments_configured && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="text-[12.5px] leading-relaxed">
                    <p className="font-semibold text-foreground">Connect Stripe to accept live payments</p>
                    <p className="text-muted-foreground mt-1">
                      Add your Stripe secret key as an environment secret. Once connected we'll flip Payments to configured and enable real checkout.
                    </p>
                    <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-brand hover:underline">
                      Get your API keys <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {payload.payments_provider === 'manual' && (
                <div className="flex items-start gap-3 rounded-xl border border-brand/20 bg-brand/[0.04] p-4">
                  <Check className="h-4 w-4 text-brand shrink-0 mt-0.5" />
                  <div className="text-[12.5px] leading-relaxed">
                    <p className="font-semibold text-foreground">Manual mode active</p>
                    <p className="text-muted-foreground mt-1">
                      Orders will be captured and appear in the Orders tab. Follow up with the customer to arrange payment — bank transfer, invoice, in-person, or your preferred method.
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
