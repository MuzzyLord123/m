// One-click "send my accounts off to be assessed" flow.
// - Runs readiness checks against live ledger
// - Lets the customer pick period + target (in-app accountant OR email)
// - Builds a single PDF pack and either notifies the accountant or emails it
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, CheckCircle2, AlertTriangle, Send, Mail, UserCheck, Download, FileText, ShieldCheck, FileSpreadsheet, FileArchive, XCircle, Clock,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { buildAssessmentPack, buildAssessmentXlsx, buildAssessmentZip, checkReadiness, blobToBase64, type Readiness } from './assessmentPack';

const db = supabase as any;

interface Props {
  open: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
  currency: string;
}

function iso(d: Date) { return d.toISOString().slice(0, 10); }

/** Sensible default periods a non-accountant will recognise. */
function periodPresets(): Array<{ key: string; label: string; from: string; to: string }> {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const startOfQuarter = new Date(y, Math.floor(m / 3) * 3, 1);
  const lastQEnd = new Date(startOfQuarter.getFullYear(), startOfQuarter.getMonth(), 0);
  const lastQStart = new Date(lastQEnd.getFullYear(), lastQEnd.getMonth() - 2, 1);

  const ytdFrom = new Date(y, 0, 1);
  const prevYearFrom = new Date(y - 1, 0, 1);
  const prevYearTo = new Date(y - 1, 11, 31);

  return [
    { key: 'lastQuarter', label: `Last completed quarter (${iso(lastQStart)} → ${iso(lastQEnd)})`, from: iso(lastQStart), to: iso(lastQEnd) },
    { key: 'ytd', label: `Year to date (${iso(ytdFrom)} → today)`, from: iso(ytdFrom), to: iso(now) },
    { key: 'prevYear', label: `Previous full year (${y - 1})`, from: iso(prevYearFrom), to: iso(prevYearTo) },
  ];
}

export default function SubmitForAssessment({ open, onClose, orgId, orgName, currency }: Props) {
  const presets = useMemo(periodPresets, []);
  const [presetKey, setPresetKey] = useState(presets[0].key);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const [target, setTarget] = useState<'accountant' | 'email'>('accountant');
  const [format, setFormat] = useState<'pdf' | 'xlsx' | 'zip'>('pdf');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [sendingAccountId, setSendingAccountId] = useState<string>('');

  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [emailAccounts, setEmailAccounts] = useState<any[]>([]);
  const [accountantMembers, setAccountantMembers] = useState<any[]>([]);

  type StepState = 'idle' | 'active' | 'done' | 'error';
  type Step = { key: string; label: string; state: StepState; detail?: string };
  const [steps, setSteps] = useState<Step[]>([]);
  const [failure, setFailure] = useState<{ title: string; detail?: string; hint?: string; status?: number } | null>(null);
  const [success, setSuccess] = useState<{ title: string; detail: string } | null>(null);

  function initSteps() {
    const base: Step[] = [
      { key: 'build', label: 'Building accountant pack', state: 'idle' },
      { key: 'local', label: 'Saving copy to your device', state: 'idle' },
    ];
    if (target === 'email') {
      base.push({ key: 'upload', label: 'Uploading to sending account', state: 'idle' });
      base.push({ key: 'send', label: `Delivering to ${email || 'recipient'}`, state: 'idle' });
    } else {
      base.push({ key: 'lock', label: 'Locking period for review', state: 'idle' });
      base.push({ key: 'notify', label: 'Notifying your accountant', state: 'idle' });
    }
    setSteps(base);
  }
  function markStep(key: string, state: StepState, detail?: string) {
    setSteps(prev => prev.map(s => s.key === key ? { ...s, state, detail } : s));
  }


  const period = useMemo(() => {
    if (useCustom && customFrom && customTo) return { from: customFrom, to: customTo };
    const p = presets.find(p => p.key === presetKey)!;
    return { from: p.from, to: p.to };
  }, [useCustom, customFrom, customTo, presetKey, presets]);

  // Refresh check whenever the period changes
  useEffect(() => {
    if (!open || !orgId) return;
    let cancelled = false;
    setChecking(true);
    checkReadiness(orgId, period.from, period.to)
      .then(r => { if (!cancelled) setReadiness(r); })
      .catch(() => { if (!cancelled) setReadiness(null); })
      .finally(() => { if (!cancelled) setChecking(false); });
    return () => { cancelled = true; };
  }, [open, orgId, period.from, period.to]);

  // Load email accounts (for email path) and accountant members (for in-app path)
  useEffect(() => {
    if (!open || !orgId) return;
    (async () => {
      const [{ data: ea }, { data: mem }] = await Promise.all([
        db.from('email_accounts').select('id, email_address, display_name, provider, is_active').eq('is_active', true),
        db.from('acc_org_members').select('user_id, role').eq('org_id', orgId).eq('role', 'accountant'),
      ]);
      setEmailAccounts(ea || []);
      setSendingAccountId((ea || [])[0]?.id || '');
      setAccountantMembers(mem || []);
    })();
  }, [open, orgId]);

  async function handleSubmit() {
    if (target === 'email' && !/^[^@]+@[^@]+\.[^@]+$/.test(email.trim())) {
      toast.error('Enter a valid email address'); return;
    }
    if (target === 'email' && !sendingAccountId) {
      toast.error('Connect an email account first (Settings → Email) to send from your address'); return;
    }
    if (target === 'accountant' && accountantMembers.length === 0) {
      toast.error('No accountant is linked to this organisation yet. Invite one first.'); return;
    }
    if (readiness && !readiness.ok) {
      const proceed = window.confirm(
        'Your books have unresolved items. Send anyway?\n\n' +
        readiness.checks.filter(c => !c.ok).map(c => `• ${c.label}${c.detail ? `: ${c.detail}` : ''}`).join('\n'),
      );
      if (!proceed) return;
    }

    setSubmitting(true);
    setFailure(null);
    setSuccess(null);
    initSteps();
    try {
      markStep('build', 'active');
      const meta = { orgName, currency, from: period.from, to: period.to };
      const stem = `accountant-pack-${orgName.replace(/\s+/g, '-').toLowerCase()}-${period.from}-to-${period.to}`;
      let blob: Blob;
      let filename: string;
      let contentType: string;
      try {
        if (format === 'xlsx') {
          blob = await buildAssessmentXlsx(orgId, meta);
          filename = `${stem}.xlsx`;
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else if (format === 'zip') {
          blob = await buildAssessmentZip(orgId, meta);
          filename = `${stem}.zip`;
          contentType = 'application/zip';
        } else {
          blob = await buildAssessmentPack(orgId, meta);
          filename = `${stem}.pdf`;
          contentType = 'application/pdf';
        }
      } catch (buildErr: any) {
        markStep('build', 'error', buildErr?.message);
        setFailure({ title: 'Could not build the pack', detail: buildErr?.message, hint: 'Check that your ledger data loaded and try again.' });
        setSubmitting(false); return;
      }
      const sizeKB = Math.round(blob.size / 1024);
      markStep('build', 'done', `${filename} • ${sizeKB.toLocaleString()} KB`);

      markStep('local', 'active');
      const base64 = await blobToBase64(blob);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      markStep('local', 'done', 'Downloaded');

      if (target === 'email') {
        markStep('upload', 'active');
      } else {
        markStep('lock', 'active');
      }

      const { data, error } = await supabase.functions.invoke('acc-submit-assessment', {
        body: {
          orgId,
          target,
          period,
          note: note.trim() || null,
          email: target === 'email' ? email.trim() : null,
          sendingAccountId: target === 'email' ? sendingAccountId : null,
          filename,
          contentType,
          attachmentBase64: base64,
          pdfBase64: format === 'pdf' ? base64 : null,
          summary: readiness ? readiness.checks.map(c => ({ label: c.label, ok: c.ok, detail: c.detail ?? null })) : [],
        },
      });

      const payload = (data as any) || {};
      if (error || payload.error) {
        const failStepKey = target === 'email' ? 'send' : 'notify';
        markStep(target === 'email' ? 'upload' : 'lock', 'done');
        markStep(failStepKey, 'error', payload.error || error?.message);
        setFailure({
          title: payload.error || error?.message || 'Delivery failed',
          detail: payload.detail,
          hint: payload.hint,
          status: payload.status,
        });
        toast.error(payload.error || error?.message || 'Delivery failed');
        setSubmitting(false);
        return;
      }

      if (target === 'email') {
        markStep('upload', 'done');
        markStep('send', 'done', `Delivered via ${payload.via || 'email'}`);
        setSuccess({
          title: 'Pack delivered',
          detail: `Sent from ${payload.from || 'your account'} to ${payload.recipient || email}. A copy was downloaded to your device.`,
        });
        toast.success(`Pack emailed to ${email}`);
      } else {
        markStep('lock', 'done', payload.periodLocked ? 'Period locked' : undefined);
        markStep('notify', 'done', `${payload.notified || 0} accountant(s) notified`);
        setSuccess({
          title: 'Sent for assessment',
          detail: `${payload.notified || 0} accountant(s) notified. Period ${period.from} → ${period.to} is now locked for review.`,
        });
        toast.success('Pack sent to your accountant.');
      }
    } catch (e: any) {
      setFailure({ title: "That didn't go through. Check the details and try again.", detail: e?.message });
      toast.error(e?.message || "That didn't go through. Check the details and try again.");
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <Dialog open={open} onOpenChange={(o) => !o && !submitting && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-sunken">
              <Send className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>Send my accounts to be assessed</DialogTitle>
              <DialogDescription>We'll build a full accountant-ready pack and hand it off in one click.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {/* Period */}
          <section>
            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">1. Period</Label>
            <div className="mt-2 space-y-2">
              <Select
                value={useCustom ? 'custom' : presetKey}
                onValueChange={v => { if (v === 'custom') setUseCustom(true); else { setUseCustom(false); setPresetKey(v); } }}
              >
                <SelectTrigger className="h-10 rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {presets.map(p => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
                  <SelectItem value="custom">Custom range…</SelectItem>
                </SelectContent>
              </Select>
              {useCustom && (
                <div className="grid grid-cols-2 gap-2">
                  <Input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="h-10 rounded-lg" />
                  <Input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="h-10 rounded-lg" />
                </div>
              )}
            </div>
          </section>

          {/* Readiness */}
          <section>
            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">2. Readiness check</Label>
            <div className="mt-2 rounded-[10px] border border-border/60 bg-card p-3">
              {checking ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Running automated checks on your books…
                </div>
              ) : readiness ? (
                <div className="space-y-1.5">
                  {readiness.checks.map(c => (
                    <div key={c.key} className="flex items-center gap-2 text-xs">
                      {c.ok
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-ok shrink-0" />
                        : <AlertTriangle className="h-3.5 w-3.5 text-attend shrink-0" />}
                      <span className={cn('flex-1', !c.ok && 'text-attend')}>{c.label}</span>
                      {c.detail && <span className="text-[10px] text-muted-foreground">{c.detail}</span>}
                    </div>
                  ))}
                  {readiness.ok && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-ok">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Everything looks good. Ready to send.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">Unable to load checks.</div>
              )}
            </div>
          </section>

          {/* Target */}
          <section>
            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">3. Who receives it?</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTarget('accountant')}
                className={cn(
                  'text-left rounded-[10px] border p-3 transition-colors duration-150',
                  target === 'accountant' ? 'border-primary bg-primary/[0.04]' : 'border-border/60 bg-card hover:border-border',
                )}
              >
                <UserCheck className="mb-1.5 h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-[550]">My invited accountant</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Locks this period read-only and notifies them inside Quooro.
                </div>
                {accountantMembers.length > 0 && (
                  <div className="mt-1 text-[10px] text-ok">{accountantMembers.length} accountant(s) linked</div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setTarget('email')}
                className={cn(
                  'text-left rounded-[10px] border p-3 transition-colors duration-150',
                  target === 'email' ? 'border-primary bg-primary/[0.04]' : 'border-border/60 bg-card hover:border-border',
                )}
              >
                <Mail className="mb-1.5 h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-[550]">Email the PDF pack</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Send to any accountant or HMRC agent, attached as a PDF.
                </div>
              </button>
            </div>

            {target === 'email' && (
              <div className="mt-3 space-y-2">
                <div>
                  <Label className="text-xs">Recipient email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="accountant@example.com" className="mt-1 h-10 rounded-lg" />
                </div>
                {emailAccounts.length > 0 ? (
                  <div>
                    <Label className="text-xs">Send from</Label>
                    <Select value={sendingAccountId} onValueChange={setSendingAccountId}>
                      <SelectTrigger className="mt-1 h-10 rounded-lg"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {emailAccounts.map(a => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.display_name ? `${a.display_name} <${a.email_address}>` : a.email_address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="rounded-lg border border-attend/30 bg-attend/5 p-3 text-[11px] text-attend">
                    Connect a Gmail or Microsoft account under <span className="font-mono">Settings → Email</span> so the pack is sent from your address. You'll still get a local copy downloaded.
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Format */}
          <section>
            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">4. Pack format</Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {([
                { key: 'pdf' as const, label: 'PDF', icon: FileText, hint: 'Signed-off report pack' },
                { key: 'xlsx' as const, label: 'Excel', icon: FileSpreadsheet, hint: 'Editable workbook' },
                { key: 'zip' as const, label: 'ZIP bundle', icon: FileArchive, hint: 'PDF + Excel' },
              ]).map(f => (
                <button key={f.key} type="button" onClick={() => setFormat(f.key)}
                  className={cn(
                    'text-left rounded-[10px] border p-2.5 transition-colors duration-150',
                    format === f.key ? 'border-primary bg-primary/[0.04]' : 'border-border/60 bg-card hover:border-border',
                  )}>
                  <f.icon className="mb-1 h-4 w-4 text-muted-foreground" />
                  <div className="text-xs font-[550]">{f.label}</div>
                  <div className="text-[10px] text-muted-foreground">{f.hint}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Note */}
          <section>
            <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">5. Anything to add? (optional)</Label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="e.g. Please review the entertaining expenses in Sept."
              className="mt-2 rounded-lg" />
          </section>

          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-sunken p-3 text-[11px] text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ok" />
            <div>
              The pack is built server-side from your live ledger. Numbers reconcile: trial balance debits equal credits, and the pack matches what you see in Reports.
            </div>
          </div>

          {/* Delivery status */}
          {(steps.length > 0 || failure || success) && (
            <section>
              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Delivery status</Label>
              <div className="mt-2 space-y-2 rounded-[10px] border border-border/60 bg-card p-3">
                {steps.map(s => (
                  <div key={s.key} className="flex items-center gap-2 text-xs">
                    {s.state === 'done' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-ok" />}
                    {s.state === 'active' && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />}
                    {s.state === 'idle' && <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                    {s.state === 'error' && <XCircle className="h-3.5 w-3.5 shrink-0 text-risk" />}
                    <span className={cn('flex-1', s.state === 'idle' && 'text-muted-foreground', s.state === 'error' && 'font-medium text-risk')}>
                      {s.label}
                    </span>
                    {s.detail && <span className="text-[10px] text-muted-foreground">{s.detail}</span>}
                  </div>
                ))}
                {failure && (
                  <div className="mt-2 space-y-1.5 rounded-lg border border-risk/30 bg-risk/5 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-risk">
                      <XCircle className="h-3.5 w-3.5" /> {failure.title}
                      {failure.status ? <span className="font-mono text-[10px] tabular-nums text-risk/70">HTTP {failure.status}</span> : null}
                    </div>
                    {failure.hint && <div className="text-[11px] text-risk/90">{failure.hint}</div>}
                    {failure.detail && (
                      <details className="text-[10px] text-muted-foreground">
                        <summary className="cursor-pointer">Technical details</summary>
                        <pre className="mt-1 whitespace-pre-wrap break-all font-mono">{failure.detail}</pre>
                      </details>
                    )}
                  </div>
                )}
                {success && (
                  <div className="mt-2 rounded-lg border border-ok/30 bg-ok/5 p-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-ok">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {success.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-ok/90">{success.detail}</div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <DialogFooter className="gap-2 mt-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            {success ? 'Close' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || checking}
            className="gap-1.5"
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            {failure ? 'Retry' : success ? 'Send again' : target === 'email' ? 'Build pack and email' : 'Send to my accountant'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
