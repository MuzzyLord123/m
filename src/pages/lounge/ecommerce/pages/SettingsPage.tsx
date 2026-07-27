import { useEffect, useState } from 'react';
import { Save, Store, Truck, Receipt, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { PageHeader, PageBody } from '../shared/PageChrome';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

type Settings = {
  store_name: string;
  contact_email: string | null;
  support_url: string | null;
  currency: string;
  timezone: string;
  brand_color: string;
  checkout_accent: string;
  logo_url: string | null;
  shipping_enabled: boolean;
  shipping_flat_rate: number;
  shipping_free_over: number | null;
  tax_enabled: boolean;
  tax_rate: number;
  tax_inclusive: boolean;
};

const DEFAULTS: Settings = {
  store_name: 'My Store', contact_email: '', support_url: '',
  currency: 'GBP', timezone: 'Europe/London',
  brand_color: '#111111', checkout_accent: '#111111', logo_url: '',
  shipping_enabled: true, shipping_flat_rate: 0, shipping_free_over: null,
  tax_enabled: false, tax_rate: 0, tax_inclusive: false,
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [s, setS] = useState<Settings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('ecommerce_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) setS({ ...DEFAULTS, ...data } as Settings);
      setLoading(false);
    })();
  }, [user]);

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS(prev => ({ ...prev, [k]: v }));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('ecommerce_settings').upsert({
      user_id: user.id, ...s,
    }, { onConflict: 'user_id' });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success('Settings saved');
  };

  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Settings']}
        title="Store settings"
        description="Configure your storefront basics, brand identity, shipping, and tax. Applied across your product cards, embed widget, and checkout."
        actions={
          <Button size="sm" onClick={save} disabled={saving || loading} className="h-9 rounded-xl px-4">
            <Save className="h-3.5 w-3.5 mr-1.5" /> {saving ? 'Saving…' : 'Save changes'}
          </Button>
        }
      />
      <PageBody>
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-border/40 border-t-brand rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card icon={Store} title="Store profile" desc="How your store shows up to customers.">
              <Field label="Store name">
                <Input value={s.store_name} onChange={e => set('store_name', e.target.value)} />
              </Field>
              <Field label="Contact email">
                <Input type="email" value={s.contact_email ?? ''} onChange={e => set('contact_email', e.target.value)} placeholder="orders@yourbrand.com" />
              </Field>
              <Field label="Support URL">
                <Input value={s.support_url ?? ''} onChange={e => set('support_url', e.target.value)} placeholder="https://yourbrand.com/help" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Currency">
                  <Select value={s.currency} onValueChange={v => set('currency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['GBP','USD','EUR','AUD','CAD','JPY','AED','CHF','SEK','NOK'].map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Timezone">
                  <Input value={s.timezone} onChange={e => set('timezone', e.target.value)} />
                </Field>
              </div>
            </Card>

            <Card icon={Palette} title="Brand" desc="Colors used across your storefront and embed widget.">
              <Field label="Brand color">
                <ColorRow value={s.brand_color} onChange={v => set('brand_color', v)} />
              </Field>
              <Field label="Checkout accent">
                <ColorRow value={s.checkout_accent} onChange={v => set('checkout_accent', v)} />
              </Field>
              <Field label="Logo URL">
                <Input value={s.logo_url ?? ''} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
              </Field>
            </Card>

            <Card icon={Truck} title="Shipping" desc="Simple shipping rate applied at checkout.">
              <RowSwitch label="Charge shipping" checked={s.shipping_enabled} onChange={v => set('shipping_enabled', v)} />
              <Field label="Flat rate">
                <Input type="number" step="0.01" min={0} value={s.shipping_flat_rate}
                  onChange={e => set('shipping_flat_rate', Number(e.target.value) || 0)}
                  disabled={!s.shipping_enabled} />
              </Field>
              <Field label="Free shipping over (leave empty to disable)">
                <Input type="number" step="0.01" min={0} value={s.shipping_free_over ?? ''}
                  onChange={e => set('shipping_free_over', e.target.value === '' ? null : Number(e.target.value))}
                  disabled={!s.shipping_enabled} />
              </Field>
            </Card>

            <Card icon={Receipt} title="Tax" desc="Simple flat-rate tax. For multi-jurisdiction tax, connect Stripe Tax on the Payments page.">
              <RowSwitch label="Charge tax" checked={s.tax_enabled} onChange={v => set('tax_enabled', v)} />
              <Field label="Tax rate (%)">
                <Input type="number" step="0.01" min={0} max={100} value={s.tax_rate}
                  onChange={e => set('tax_rate', Number(e.target.value) || 0)}
                  disabled={!s.tax_enabled} />
              </Field>
              <RowSwitch label="Prices include tax" checked={s.tax_inclusive} onChange={v => set('tax_inclusive', v)} disabled={!s.tax_enabled} />
            </Card>
          </div>
        )}
      </PageBody>
    </>
  );
}

function Card({ icon: Icon, title, desc, children }: any) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-sm p-5 space-y-4 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand/[0.04] rounded-full blur-[60px] pointer-events-none" />
      <div className="relative flex items-start gap-3">
        <div className="h-9 w-9 rounded-xl bg-brand/10 border border-brand/15 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-brand" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[14px] font-semibold tracking-tight">{title}</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
        </div>
      </div>
      <div className="relative space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

function RowSwitch({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-[13px] text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}

function ColorRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={e => onChange(e.target.value)}
        className="w-14 h-9 rounded-lg border border-border/40 bg-transparent cursor-pointer p-1" />
      <Input value={value} onChange={e => onChange(e.target.value)} className="font-mono text-xs" />
    </div>
  );
}
