import { useState } from 'react';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ACCOUNT_TYPES, AccountTypeKey } from './accountTypes';
import { cn } from '@/lib/utils';

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  company: '',
  phone: '',
  plan: '',
  pageCount: '',
  notes: '',
  websiteStatus: 'design',
  previewUrl: '',
};

export default function CreateAccountWizard() {
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<AccountTypeKey | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [busy, setBusy] = useState(false);

  const selected = ACCOUNT_TYPES.find(t => t.key === type);

  function updateField<K extends keyof typeof form>(key: K, v: string) {
    setForm(f => ({ ...f, [key]: v }));
  }

  async function submit() {
    if (!selected) return;
    if (!form.email || !form.password || !form.fullName) {
      toast({ title: 'Missing fields', description: 'Full name, email and password are required.', variant: 'destructive' });
      return;
    }
    setBusy(true);
    try {
      if (selected.isAdmin) {
        const { data, error } = await supabase.functions.invoke('create-admin-account', {
          body: { action: 'create', email: form.email, password: form.password, fullName: form.fullName },
        });
        if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
        toast({ title: 'Admin created', description: `${form.email} now has admin access.` });
      } else {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-client`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            fullName: form.fullName,
            company: form.company || undefined,
            phone: form.phone || undefined,
            plan: selected.key === 'live_preview' ? 'Preview Only' : (form.plan || undefined),
            pageCount: selected.hideWebsiteFields ? undefined : (form.pageCount || undefined),
            notes: form.notes || undefined,
            websiteStatus: selected.hideWebsiteFields ? undefined : (form.websiteStatus || 'design'),
            previewUrl: selected.hideWebsiteFields ? undefined : (form.previewUrl || undefined),
            accountType: selected.key,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to create account');
        toast({ title: 'Account created', description: `${form.email} — ${selected.label}` });
      }
      setForm({ ...emptyForm });
      setStep(1);
      setType(null);
    } catch (e: any) {
      toast({ title: 'Failed', description: e.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="font-semibold mb-1">Step 1 · Choose account type</h2>
          <p className="text-sm text-muted-foreground mb-4">Pick which kind of account you want to create. This controls what the person sees when they sign in.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {ACCOUNT_TYPES.map(t => {
              const Icon = t.icon;
              const active = type === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setType(t.key)}
                  className={cn(
                    'text-left rounded-xl border p-4 transition-all flex gap-3 items-start hover:border-primary/60',
                    active ? 'border-primary bg-primary/5' : 'border-border bg-card'
                  )}
                >
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium">{t.label}</p>
                      {active && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end pt-4">
            <Button disabled={!type} onClick={() => setStep(2)}>
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {step === 2 && selected && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground">← Change type</button>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm font-medium">{selected.label}</span>
          </div>
          <h2 className="font-semibold">Step 2 · Account details</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Full name *</Label>
              <Input value={form.fullName} onChange={e => updateField('fullName', e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="jane@company.com" />
            </div>
            <div>
              <Label>Temporary password *</Label>
              <Input type="text" value={form.password} onChange={e => updateField('password', e.target.value)} placeholder="Min 8 chars" />
            </div>
            {!selected.isAdmin && (
              <>
                <div>
                  <Label>Company</Label>
                  <Input value={form.company} onChange={e => updateField('company', e.target.value)} />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} />
                </div>
                {!selected.hideWebsiteFields && (
                  <>
                    <div>
                      <Label>Plan</Label>
                      <Input value={form.plan} onChange={e => updateField('plan', e.target.value)} placeholder="e.g. Growth" />
                    </div>
                    <div>
                      <Label>Page count</Label>
                      <Input value={form.pageCount} onChange={e => updateField('pageCount', e.target.value)} />
                    </div>
                    <div>
                      <Label>Website status</Label>
                      <Input value={form.websiteStatus} onChange={e => updateField('websiteStatus', e.target.value)} placeholder="design" />
                    </div>
                    <div>
                      <Label>Preview URL</Label>
                      <Input value={form.previewUrl} onChange={e => updateField('previewUrl', e.target.value)} placeholder="https://..." />
                    </div>
                  </>
                )}
                <div className="sm:col-span-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} rows={3} />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setStep(1)} disabled={busy}>Back</Button>
            <Button onClick={submit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create {selected.label}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
