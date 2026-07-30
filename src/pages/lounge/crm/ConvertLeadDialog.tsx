import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Loader2, RefreshCw, UserPlus, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { EntityType, LifecycleStage } from './useCRMData';

/**
 * Convert a company lead into the next stage of the relationship without
 * leaving the CRM. Leads arrive as companies; once they agree to a live
 * preview or a website they become a contact, and for admins, a client
 * account in the same pass. Everything runs through the endpoints those
 * flows already use: crm_contacts for the person, the create-client
 * function for the account, and crm_set_lifecycle_stage for the move.
 */

const ACCOUNT_TYPES = [
  { value: 'live_preview', label: 'Live preview', hint: 'Seeing a preview before they commit' },
  { value: 'paid_client', label: 'Paid client', hint: 'Full portal access' },
  { value: 'business_management', label: 'Business management', hint: 'Managed account' },
  { value: 'viewer_only', label: 'Viewer only', hint: 'Read access' },
];

const WEBSITE_STATUS = [
  { value: 'design', label: 'In design' },
  { value: 'development', label: 'In development' },
  { value: 'live', label: 'Live' },
];

function generatePassword(): string {
  const words = ['harbour', 'quarry', 'lantern', 'meadow', 'summit', 'anchor', 'copper', 'willow'];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  return `${w.charAt(0).toUpperCase()}${w.slice(1)}-${n}!`;
}

export function ConvertLeadDialog({
  open,
  onOpenChange,
  company,
  stages,
  isAdmin,
  onConverted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** The company record being converted. */
  company: any;
  stages: LifecycleStage[];
  isAdmin: boolean;
  onConverted: (result: { contactId?: string }) => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [moveStageId, setMoveStageId] = useState<string>('');

  const [alsoClient, setAlsoClient] = useState(false);
  const [password, setPassword] = useState(generatePassword());
  const [accountType, setAccountType] = useState('live_preview');
  const [plan, setPlan] = useState('');
  const [websiteStatus, setWebsiteStatus] = useState('design');
  const [previewUrl, setPreviewUrl] = useState('');

  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ contact: boolean; account: boolean; customerId?: string } | null>(null);

  // Prefill from the company each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setFullName(company?.name || '');
    setEmail(company?.email || '');
    setPhone(company?.phone || '');
    setJobTitle('');
    setPassword(generatePassword());
    setAlsoClient(false);
    setAccountType('live_preview');
    setPlan('');
    setWebsiteStatus('design');
    setPreviewUrl('');
    setDone(null);
    // Default the stage move to the first customer-category stage if there is one.
    const won = stages.find(s => s.category === 'customer') || stages.find(s => /won|client|customer/i.test(s.slug));
    setMoveStageId(won?.id ?? '');
  }, [open, company, stages]);

  const canConvert = useMemo(() => {
    if (!fullName.trim()) return false;
    if (alsoClient && (!email.trim() || password.trim().length < 6)) return false;
    return true;
  }, [fullName, alsoClient, email, password]);

  async function convert() {
    if (!canConvert || !company?.id) return;
    setBusy(true);

    // 1) The person. Linked to the company so the relationship stays whole.
    const { data: contact, error: contactErr } = await supabase
      .from('crm_contacts')
      .insert({
        org_id: company.org_id,
        owner_id: company.owner_id ?? user?.id ?? null,
        company_id: company.id,
        full_name: fullName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        job_title: jobTitle.trim() || null,
        relationship_type: ['customer'],
        lifecycle_stage_id: moveStageId || company.lifecycle_stage_id || null,
        source: 'converted_from_company',
      } as any)
      .select('id')
      .single();

    if (contactErr) {
      setBusy(false);
      toast({ title: 'Conversion failed', description: contactErr.message, variant: 'destructive' });
      return;
    }

    let accountCreated = false;
    let customerId: string | undefined;

    // 2) The account, when asked for. Same function the team dashboard uses.
    if (alsoClient) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-client`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            email: email.trim(),
            password,
            fullName: fullName.trim(),
            company: company.name || undefined,
            phone: phone.trim() || undefined,
            plan: plan || undefined,
            websiteStatus,
            previewUrl: previewUrl.trim() || undefined,
            accountType,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast({ title: 'Contact created, account was not', description: json.error || 'The account could not be created.', variant: 'destructive' });
        } else {
          accountCreated = true;
          customerId = json.customerId;
        }
      } catch (e: any) {
        toast({ title: 'Contact created, account was not', description: e?.message || 'The account could not be created.', variant: 'destructive' });
      }
    }

    // 3) Mark the company converted and log it where the team will see it.
    const relationship = Array.isArray(company.relationship_type) ? company.relationship_type : [];
    const nextRelationship = Array.from(new Set([...relationship.filter((r: string) => r !== 'lead'), 'customer']));
    await supabase.from('crm_companies').update({ relationship_type: nextRelationship } as any).eq('id', company.id);

    if (moveStageId && moveStageId !== company.lifecycle_stage_id) {
      await supabase.rpc('crm_set_lifecycle_stage' as any, {
        _entity_type: 'company',
        _entity_id: company.id,
        _new_stage_id: moveStageId,
        _note: accountCreated
          ? `Converted to a contact and a client account${customerId ? ` (${customerId})` : ''}.`
          : 'Converted to a contact.',
      } as any);
    }

    await supabase.from('crm_communications').insert({
      org_id: company.org_id,
      owner_id: user?.id ?? null,
      kind: 'note' as any,
      direction: 'internal' as any,
      subject: 'Lead converted',
      body: accountCreated
        ? `Converted to contact ${fullName.trim()} and a client account was created${customerId ? ` (${customerId})` : ''}.`
        : `Converted to contact ${fullName.trim()}.`,
      occurred_at: new Date().toISOString(),
      company_id: company.id,
    } as any);

    setBusy(false);
    setDone({ contact: true, account: accountCreated, customerId });
    onConverted({ contactId: (contact as any)?.id });
  }

  const label = 'font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em]';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!busy) onOpenChange(v); }}>
      <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert lead</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ok/10 text-ok">
              <Check className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold">{fullName}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Contact created under {company?.name}
                {done.account ? ` and their account is live${done.customerId ? ` (${done.customerId})` : ''}.` : '.'}
              </p>
            </div>
            {done.account && (
              <div className="w-full rounded-[10px] border border-border/60 px-3.5 py-3 text-left">
                <span className={label}>Sign in details to pass on</span>
                <p className="mt-1 font-mono text-[12px]">{email}</p>
                <p className="font-mono text-[12px]">{password}</p>
              </div>
            )}
            <Button className="h-10 w-full rounded-[11px] text-xs" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="flex items-center gap-2 rounded-[10px] border border-border/60 bg-sunken/50 px-3 py-2.5 text-[12.5px]">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate font-medium">{company?.name || 'This company'}</span>
              <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              <UserPlus className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="text-muted-foreground">Contact{alsoClient ? ' and client' : ''}</span>
            </p>

            <div>
              <span className={label}>Contact name</span>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Who you have been speaking to" className="mt-1.5 h-10" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className={label}>Email</span>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@business.co.uk" className="mt-1.5 h-10" />
              </div>
              <div>
                <span className={label}>Phone</span>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5 h-10" />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className={label}>Job title</span>
                <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Owner" className="mt-1.5 h-10" />
              </div>
              <div>
                <span className={label}>Move stage to</span>
                <Select value={moveStageId} onValueChange={setMoveStageId}>
                  <SelectTrigger className="mt-1.5 h-10"><SelectValue placeholder="Keep current stage" /></SelectTrigger>
                  <SelectContent>
                    {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isAdmin && (
              <div className={cn('rounded-[10px] border p-3.5 transition-colors', alsoClient ? 'border-primary/40 bg-primary/[0.03]' : 'border-border/60')}>
                <label className="flex items-start justify-between gap-3">
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium">Also create their client account</span>
                    <span className="mt-0.5 block text-[11.5px] text-muted-foreground">
                      Provisions the Lounge login now, so you never leave the CRM to onboard them.
                    </span>
                  </span>
                  <Switch checked={alsoClient} onCheckedChange={setAlsoClient} />
                </label>

                {alsoClient && (
                  <div className="mt-3.5 space-y-3 border-t border-border/60 pt-3.5">
                    <div>
                      <span className={label}>Temporary password</span>
                      <div className="mt-1.5 flex gap-2">
                        <Input value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 font-mono text-xs" />
                        <Button
                          type="button" variant="outline" size="icon"
                          className="h-10 w-10 shrink-0"
                          onClick={() => setPassword(generatePassword())}
                          aria-label="Generate a new password"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <span className={label}>Account type</span>
                        <Select value={accountType} onValueChange={setAccountType}>
                          <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ACCOUNT_TYPES.map(a => (
                              <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <span className={label}>Website status</span>
                        <Select value={websiteStatus} onValueChange={setWebsiteStatus}>
                          <SelectTrigger className="mt-1.5 h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {WEBSITE_STATUS.map(w => <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <span className={label}>Plan</span>
                        <Input value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="Growth" className="mt-1.5 h-10" />
                      </div>
                      <div>
                        <span className={label}>Preview URL</span>
                        <Input value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} placeholder="https://" className="mt-1.5 h-10" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button variant="outline" className="h-10 rounded-[11px] text-xs" disabled={busy} onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="h-10 gap-1.5 rounded-[11px] text-xs" disabled={busy || !canConvert} onClick={convert}>
                {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {alsoClient ? 'Convert to contact and client' : 'Convert to contact'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
