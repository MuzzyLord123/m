import { useEffect, useMemo, useState } from 'react';
import { Plus, X, Download, Check, Loader2, Bookmark, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  type InvoiceDesign, type InvoiceLineDraft,
  DEFAULT_INVOICE_DESIGN, ACCENT_CHOICES, FONT_CHOICES,
  normaliseDesign, lineTotals, formatMoney,
} from '@/lib/invoiceDesign';
import { downloadInvoicePdf } from '@/lib/invoiceDoc';

/**
 * The Invoice Studio: the Office invoice maker distilled into a small
 * tabbed surface that works one-handed on a phone. Everything is
 * editable - lines, VAT per line, dates, notes, and the whole document
 * design (accent, font, company block, payment block, footer). Presets
 * store reusable line sets; the design persists per user and styles
 * both the export and the client's in-app invoice view.
 */

const VAT_OPTIONS = [
  { value: '0.2', label: '20%' },
  { value: '0.05', label: '5%' },
  { value: '0', label: '0%' },
];

interface Preset { id: string; name: string; lines: InvoiceLineDraft[]; notes: string | null }

export function InvoiceStudio({
  open,
  onOpenChange,
  entityType,
  entityId,
  billToName,
  billToEmail,
  currency = 'GBP',
  defaultLines,
  onGenerated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entityType: 'company' | 'contact' | 'opportunity';
  entityId: string;
  billToName: string;
  billToEmail?: string | null;
  currency?: string;
  defaultLines?: InvoiceLineDraft[];
  onGenerated: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState<'lines' | 'details' | 'design'>('lines');
  const [lines, setLines] = useState<InvoiceLineDraft[]>(
    defaultLines?.length ? defaultLines : [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0.2 }],
  );
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [design, setDesign] = useState<InvoiceDesign>(DEFAULT_INVOICE_DESIGN);
  const [designDirty, setDesignDirty] = useState(false);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  const [saving, setSaving] = useState<'draft' | 'post' | 'design' | null>(null);
  const [created, setCreated] = useState<{ number: string; total: number; status: string } | null>(null);

  const totals = useMemo(() => lineTotals(lines), [lines]);

  // Load the user's stored design and presets when the studio opens.
  useEffect(() => {
    if (!open || !user?.id) return;
    let cancelled = false;
    (async () => {
      const [d, p] = await Promise.all([
        supabase.from('invoice_design' as any).select('design').eq('owner_user_id', user.id).maybeSingle(),
        supabase.from('invoice_presets' as any).select('id, name, lines, notes').order('created_at'),
      ]);
      if (cancelled) return;
      if ((d.data as any)?.design) setDesign(normaliseDesign((d.data as any).design));
      setPresets(((p.data as any[]) || []).map(r => ({ ...r, lines: Array.isArray(r.lines) ? r.lines : [] })));
    })();
    return () => { cancelled = true; };
  }, [open, user?.id]);

  // Reset transient state each time the studio opens for a record.
  useEffect(() => {
    if (!open) return;
    setCreated(null);
    setTab('lines');
    setLines(defaultLines?.length ? defaultLines : [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0.2 }]);
    setDueDate('');
    setNotes('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entityId]);

  const patchLine = (i: number, patch: Partial<InvoiceLineDraft>) =>
    setLines(prev => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i));
  const addLine = () => setLines(prev => [...prev, { description: '', quantity: 1, unit_price: 0, tax_rate: 0.2 }]);

  const patchDesign = (patch: Partial<InvoiceDesign>) => {
    setDesign(prev => ({ ...prev, ...patch }));
    setDesignDirty(true);
  };

  async function saveDesign() {
    if (!user?.id) return;
    setSaving('design');
    const { error } = await supabase.from('invoice_design' as any).upsert({
      owner_user_id: user.id, design, updated_at: new Date().toISOString(),
    } as any);
    setSaving(null);
    if (error) toast({ title: 'Design not saved', description: error.message, variant: 'destructive' });
    else { setDesignDirty(false); toast({ title: 'Design saved', description: 'Every invoice you export now uses this design.' }); }
  }

  async function savePreset() {
    if (!user?.id || !presetName.trim()) return;
    setSavingPreset(true);
    const { data, error } = await supabase.from('invoice_presets' as any).insert({
      owner_user_id: user.id, name: presetName.trim(), lines, notes: notes || null,
    } as any).select('id, name, lines, notes').single();
    setSavingPreset(false);
    if (error) { toast({ title: 'Preset not saved', description: error.message, variant: 'destructive' }); return; }
    setPresets(prev => [...prev, data as any]);
    setPresetName('');
    toast({ title: 'Preset saved', description: `"${(data as any).name}" is ready for one-tap invoicing.` });
  }

  async function deletePreset(id: string) {
    const { error } = await supabase.from('invoice_presets' as any).delete().eq('id', id);
    if (error) { toast({ title: 'Could not delete preset', description: error.message, variant: 'destructive' }); return; }
    setPresets(prev => prev.filter(p => p.id !== id));
  }

  function applyPreset(p: Preset) {
    setLines(p.lines.length ? p.lines : lines);
    if (p.notes) setNotes(p.notes);
    toast({ title: `Preset "${p.name}" applied` });
  }

  const validLines = lines.filter(l => (l.description || '').trim() || l.unit_price > 0);

  function exportPdf(invoiceNumber?: string, status?: string) {
    downloadInvoicePdf({
      invoiceNumber: invoiceNumber || 'DRAFT',
      issueDate: new Date().toISOString(),
      dueDate: dueDate || null,
      billToName,
      billToEmail: billToEmail || undefined,
      lines: validLines,
      notes: notes || null,
      currency,
      status: status || null,
    }, design);
  }

  async function generate(post: boolean) {
    if (validLines.length === 0 || totals.total <= 0) {
      toast({ title: 'Add at least one line', description: 'The invoice needs a line with a value.', variant: 'destructive' });
      return;
    }
    setSaving(post ? 'post' : 'draft');
    const { data, error } = await supabase.rpc('crm_generate_invoice_v2' as any, {
      _entity_type: entityType,
      _entity_id: entityId,
      _lines: validLines,
      _due_date: dueDate || null,
      _notes: notes || null,
      _post: post,
    } as any);
    setSaving(null);
    if (error) {
      toast({ title: 'Invoice not created', description: error.message, variant: 'destructive' });
      return;
    }
    const row = (data as any[])?.[0];
    if (row) setCreated({ number: row.invoice_number, total: Number(row.total), status: row.status });
    toast({
      title: post ? 'Invoice created and posted' : 'Draft invoice created',
      description: row ? `${row.invoice_number} for ${formatMoney(Number(row.total), currency)}.` : undefined,
    });
    onGenerated();
  }

  const label = 'font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em]';
  const seg = (on: boolean) =>
    cn('h-9 flex-1 rounded-lg text-xs transition-colors', on ? 'bg-foreground/[0.06] font-medium text-foreground' : 'text-muted-foreground hover:text-foreground');
  const previewFont = design.font === 'times' ? 'font-serif' : design.font === 'courier' ? 'font-mono' : 'font-sans';

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent className="flex h-[min(720px,92dvh)] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 px-5 py-3.5">
          <DialogTitle className="text-[15px]">Invoice studio</DialogTitle>
          <p className="text-[12px] text-muted-foreground">
            Billed to <span className="font-medium text-foreground">{billToName}</span>. Appears on their Quooro Invoices page and in Office accounting.
          </p>
        </DialogHeader>

        {created ? (
          /* Receipt state: the invoice exists - export or finish. */
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ok/10 text-ok">
              <Check className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold">{created.number}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {formatMoney(created.total, currency)} · {created.status === 'posted' ? 'posted to the ledger' : 'saved as draft'}
              </p>
            </div>
            <div className="flex w-full max-w-xs flex-col gap-2">
              <Button className="h-11 gap-2 rounded-[11px]" onClick={() => exportPdf(created.number, created.status)}>
                <Download className="h-4 w-4" /> Export PDF
              </Button>
              <Button variant="outline" className="h-10 rounded-[11px] text-xs" onClick={() => onOpenChange(false)}>
                Done
              </Button>
            </div>
            <p className="max-w-sm text-[11.5px] leading-relaxed text-muted-foreground">
              The PDF uses your saved design. Attach it to an email or let the client view it in their Lounge.
            </p>
          </div>
        ) : (
          <>
            <div className="flex gap-1 border-b border-border/60 px-4 py-2">
              <button type="button" className={seg(tab === 'lines')} onClick={() => setTab('lines')}>Lines</button>
              <button type="button" className={seg(tab === 'details')} onClick={() => setTab('details')}>Details</button>
              <button type="button" className={seg(tab === 'design')} onClick={() => setTab('design')}>Design</button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {tab === 'lines' && (
                <div className="space-y-4">
                  {/* Presets */}
                  <div>
                    <span className={label}>Presets</span>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {presets.map(p => (
                        <span key={p.id} className="group flex h-8 items-center gap-1.5 rounded-lg border border-border/60 pl-2.5 pr-1.5 text-xs">
                          <button type="button" onClick={() => applyPreset(p)} className="max-w-[140px] truncate transition-colors hover:text-primary">
                            {p.name}
                          </button>
                          <button type="button" aria-label={`Delete preset ${p.name}`} onClick={() => deletePreset(p.id)} className="text-muted-foreground/60 transition-colors hover:text-risk">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                      <span className="flex h-8 items-center gap-1 rounded-lg border border-dashed border-border/60 pl-2 pr-1">
                        <Bookmark className="h-3 w-3 text-muted-foreground" />
                        <input
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && savePreset()}
                          placeholder="Save as preset"
                          className="w-28 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                        />
                        <button
                          type="button"
                          onClick={savePreset}
                          disabled={!presetName.trim() || savingPreset}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
                          aria-label="Save preset"
                        >
                          {savingPreset ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                        </button>
                      </span>
                    </div>
                  </div>

                  {/* Line editor */}
                  <div className="space-y-2.5">
                    {lines.map((l, i) => {
                      const sub = Math.round((l.quantity || 0) * (l.unit_price || 0) * 100) / 100;
                      return (
                        <div key={i} className="rounded-[10px] border border-border/60 p-2.5">
                          <div className="flex items-start gap-2">
                            <Input
                              value={l.description}
                              onChange={(e) => patchLine(i, { description: e.target.value })}
                              placeholder={`Line ${i + 1} description`}
                              className="h-10 flex-1 text-[13px]"
                            />
                            {lines.length > 1 && (
                              <button type="button" aria-label="Remove line" onClick={() => removeLine(i)} className="flex h-10 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-risk">
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="w-16">
                              <span className={label}>Qty</span>
                              <Input
                                inputMode="decimal"
                                value={String(l.quantity)}
                                onChange={(e) => patchLine(i, { quantity: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0 })}
                                className="mt-1 h-10 font-mono text-xs tabular-nums"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className={label}>Unit price</span>
                              <Input
                                inputMode="decimal"
                                value={String(l.unit_price)}
                                onChange={(e) => patchLine(i, { unit_price: Number(e.target.value.replace(/[^0-9.]/g, '')) || 0 })}
                                className="mt-1 h-10 font-mono text-xs tabular-nums"
                              />
                            </div>
                            <div className="w-20">
                              <span className={label}>VAT</span>
                              <Select value={String(l.tax_rate)} onValueChange={(v) => patchLine(i, { tax_rate: Number(v) })}>
                                <SelectTrigger className="mt-1 h-10 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {VAT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="w-20 text-right">
                              <span className={label}>Net</span>
                              <p className="mt-2.5 font-mono text-xs font-medium tabular-nums">{formatMoney(sub, currency)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={addLine}
                      className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-border/60 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add line
                    </button>
                  </div>
                </div>
              )}

              {tab === 'details' && (
                <div className="space-y-4">
                  <div className="rounded-[10px] border border-border/60 px-3.5 py-2.5">
                    <span className={label}>Billed to</span>
                    <p className="mt-1 text-[13px] font-medium">{billToName}</p>
                    {billToEmail && <p className="font-mono text-[11px] text-muted-foreground">{billToEmail}</p>}
                  </div>
                  <div>
                    <span className={label}>Invoice number</span>
                    <p className="mt-1 text-[12.5px] text-muted-foreground">Assigned automatically when you create the invoice (INV-{new Date().getFullYear()}-…).</p>
                  </div>
                  <div>
                    <span className={label}>Due date</span>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="mt-1.5 h-10" />
                    <p className="mt-1 text-[11px] text-muted-foreground">Leave empty for 14 days from today.</p>
                  </div>
                  <div>
                    <span className={label}>Notes on the invoice</span>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Payment terms, project reference, a thank you"
                      className="mt-1.5 min-h-[90px] text-[13px]"
                    />
                  </div>
                </div>
              )}

              {tab === 'design' && (
                <div className="space-y-4">
                  <div>
                    <span className={label}>Accent colour</span>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      {ACCENT_CHOICES.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          title={c.name}
                          onClick={() => patchDesign({ accent: c.hex })}
                          className={cn('h-8 w-8 rounded-full border-2 transition-transform', design.accent === c.hex ? 'scale-110 border-foreground' : 'border-transparent')}
                          style={{ backgroundColor: c.hex }}
                          aria-label={`Accent ${c.name}`}
                        />
                      ))}
                      <Input
                        value={design.accent}
                        onChange={(e) => { const v = e.target.value; patchDesign({ accent: v }); }}
                        className="h-8 w-24 font-mono text-xs"
                        aria-label="Custom accent hex"
                      />
                    </div>
                  </div>
                  <div>
                    <span className={label}>Typeface</span>
                    <div className="mt-1.5 grid grid-cols-3 gap-2">
                      {FONT_CHOICES.map(f => (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => patchDesign({ font: f.value })}
                          className={cn(
                            'rounded-[10px] border px-3 py-2.5 text-left transition-colors',
                            design.font === f.value ? 'border-primary/50 bg-primary/[0.06]' : 'border-border/60 hover:border-primary/30',
                          )}
                        >
                          <span className={cn('block text-[13px]', f.value === 'times' && 'font-serif', f.value === 'courier' && 'font-mono')}>{f.label}</span>
                          <span className="mt-0.5 block text-[10.5px] text-muted-foreground">{f.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className={label}>Company block (one line each)</span>
                    <Textarea
                      value={design.companyLines.join('\n')}
                      onChange={(e) => patchDesign({ companyLines: e.target.value.split('\n').slice(0, 6) })}
                      className="mt-1.5 min-h-[76px] font-mono text-xs"
                    />
                  </div>
                  <div>
                    <span className={label}>Payment instructions (one line each)</span>
                    <Textarea
                      value={design.paymentLines.join('\n')}
                      onChange={(e) => patchDesign({ paymentLines: e.target.value.split('\n').slice(0, 6) })}
                      className="mt-1.5 min-h-[64px] font-mono text-xs"
                      placeholder="Bank, sort code, account, reference"
                    />
                  </div>
                  <div>
                    <span className={label}>Footer line</span>
                    <Input value={design.footerText} onChange={(e) => patchDesign({ footerText: e.target.value })} className="mt-1.5 h-10 text-[13px]" />
                  </div>

                  {/* Live preview */}
                  <div>
                    <span className={label}>Preview</span>
                    <div className={cn('mt-1.5 overflow-hidden rounded-[10px] border border-border/60 bg-white p-4 text-black', previewFont)}>
                      <div className="flex items-start justify-between">
                        <span className="text-[13px] font-bold">{design.headerCaps ? (design.companyLines[0] || 'Company').toUpperCase() : design.companyLines[0] || 'Company'}</span>
                        <span className="text-[13px] font-bold" style={{ color: design.accent }}>INVOICE</span>
                      </div>
                      <div className="mt-2 h-[2px] w-full" style={{ backgroundColor: design.accent }} />
                      <div className="mt-2 flex justify-between text-[10px] text-neutral-500">
                        <span>{billToName}</span>
                        <span className="font-semibold" style={{ color: design.accent }}>{formatMoney(totals.total, currency)}</span>
                      </div>
                      {design.footerText && <p className="mt-2 border-t border-neutral-200 pt-1.5 text-center text-[9px] text-neutral-400">{design.footerText}</p>}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="h-10 w-full rounded-[11px] text-xs"
                    disabled={!designDirty || saving === 'design'}
                    onClick={saveDesign}
                  >
                    {saving === 'design' ? 'Saving design' : designDirty ? 'Save design for every invoice' : 'Design saved'}
                  </Button>
                </div>
              )}
            </div>

            {/* Totals + actions */}
            <div className="shrink-0 border-t border-border/60 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  Net {formatMoney(totals.subtotal, currency)} · VAT {formatMoney(totals.tax, currency)}
                </span>
                <span className="font-mono text-[15px] font-semibold tabular-nums">{formatMoney(totals.total, currency)}</span>
              </div>
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <Button variant="outline" className="h-11 gap-1.5 rounded-[11px] px-2 text-xs" disabled={!!saving || validLines.length === 0} onClick={() => exportPdf()}>
                  <Download className="h-3.5 w-3.5" /> Export PDF
                </Button>
                <Button variant="outline" className="h-11 rounded-[11px] px-2 text-xs" disabled={!!saving} onClick={() => generate(false)}>
                  {saving === 'draft' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save draft'}
                </Button>
                <Button className="h-11 rounded-[11px] px-2 text-xs" disabled={!!saving} onClick={() => generate(true)}>
                  {saving === 'post' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Create and post'}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
