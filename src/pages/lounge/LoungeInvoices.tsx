import { useEffect, useMemo, useState } from 'react';
import { Download, ChevronRight, ReceiptText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  PageHeader, Panel, EmptyState, SkeletonLedger, StatusBadge,
} from '@/components/platform';
import { BottomSheet } from '@/components/platform/crm';
import { type InvoiceDesign, normaliseDesign, formatMoney } from '@/lib/invoiceDesign';
import { downloadInvoicePdf } from '@/lib/invoiceDoc';

/**
 * Quooro Invoices: every invoice addressed to the signed-in client, in
 * the studio design the issuer chose. Built phone-first - the list is a
 * ledger of tappable rows, the invoice itself opens as a crisp document
 * sheet with a one-tap PDF download. Data comes from the my_invoices
 * rpc; nothing here is invented and drafts never appear.
 */

interface InvoiceLine {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  line_total: number;
}

interface ClientInvoice {
  invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string | null;
  subtotal: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  currency: string;
  status: string;
  notes: string | null;
  customer_name: string;
  posted_at: string | null;
  lines: InvoiceLine[];
}

function invoiceTone(inv: ClientInvoice): { label: string; tone: 'ok' | 'attend' | 'risk' | 'neutral' } {
  if (inv.status === 'paid') return { label: 'Paid', tone: 'ok' };
  if (inv.status === 'void') return { label: 'Void', tone: 'neutral' };
  const overdue = inv.due_date && new Date(inv.due_date) < new Date() && inv.amount_paid < inv.total;
  if (overdue) return { label: 'Overdue', tone: 'risk' };
  if (inv.amount_paid > 0) return { label: 'Part paid', tone: 'attend' };
  return { label: 'Awaiting payment', tone: 'attend' };
}

const fmtDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

export default function LoungeInvoices() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [design, setDesign] = useState<InvoiceDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [openInv, setOpenInv] = useState<ClientInvoice | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [inv, d] = await Promise.all([
        supabase.rpc('my_invoices' as any),
        supabase.rpc('issuer_invoice_design' as any),
      ]);
      if (cancelled) return;
      if (inv.error) setFailed(true);
      else setInvoices(((inv.data as any[]) || []).map(r => ({ ...r, lines: Array.isArray(r.lines) ? r.lines : [] })));
      setDesign(normaliseDesign(d.data));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const summary = useMemo(() => {
    const billed = invoices.filter(i => i.status !== 'void').reduce((s, i) => s + Number(i.total || 0), 0);
    const paid = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
    return { billed, paid, outstanding: Math.max(0, billed - paid) };
  }, [invoices]);

  const currency = invoices[0]?.currency || 'GBP';

  function download(inv: ClientInvoice) {
    downloadInvoicePdf({
      invoiceNumber: inv.invoice_number,
      issueDate: inv.invoice_date,
      dueDate: inv.due_date,
      billToName: inv.customer_name,
      lines: inv.lines.map(l => ({
        description: l.description,
        quantity: Number(l.quantity),
        unit_price: Number(l.unit_price),
        tax_rate: Number(l.tax_rate),
      })),
      notes: inv.notes,
      currency: inv.currency,
      status: inv.status,
      amountPaid: Number(inv.amount_paid || 0),
    }, design ?? normaliseDesign(null));
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-[960px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-5 w-40 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-3.5 w-64 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-6 rounded-[10px] border border-border/60">
          <SkeletonLedger rows={4} />
        </div>
      </div>
    );
  }

  const accent = design?.accent ?? '#C2410C';
  const tone = openInv ? invoiceTone(openInv) : null;

  return (
    <div className="mx-auto max-w-[960px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Client portal"
        title="Invoices"
        description="Every invoice on your account, with the full document and PDF download"
      />

      {/* Position strip - only when there is anything to total */}
      {invoices.length > 0 && (
        <div className="mt-5 grid grid-cols-3 divide-x divide-border/60 rounded-[10px] border border-border/60 bg-card">
          {[
            { label: 'Billed', value: summary.billed, cls: '' },
            { label: 'Paid', value: summary.paid, cls: 'text-ok' },
            { label: 'Outstanding', value: summary.outstanding, cls: summary.outstanding > 0 ? 'text-attend' : '' },
          ].map(s => (
            <div key={s.label} className="px-4 py-3">
              <p className="font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{s.label}</p>
              <p className={cn('mt-0.5 font-mono text-[15px] font-semibold tabular-nums', s.cls)}>
                {formatMoney(s.value, currency)}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5">
        {failed ? (
          <Panel>
            <EmptyState title="Your invoices did not load" body="Refresh to try again. If this keeps happening, message the studio." />
          </Panel>
        ) : invoices.length === 0 ? (
          <Panel>
            <EmptyState
              title="No invoices yet"
              body="When the studio issues an invoice to your account it appears here with the full document and a PDF download."
            />
          </Panel>
        ) : (
          <Panel>
            <ul className="divide-y divide-border/60">
              {invoices.map(inv => {
                const t = invoiceTone(inv);
                return (
                  <li key={inv.invoice_id}>
                    <button
                      type="button"
                      onClick={() => setOpenInv(inv)}
                      className="flex min-h-[56px] w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-foreground/[0.025]"
                    >
                      <span
                        aria-hidden
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-border/60 bg-sunken"
                      >
                        <ReceiptText className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="truncate font-mono text-[12.5px] font-medium tabular-nums">{inv.invoice_number}</span>
                          <StatusBadge tone={t.tone} label={t.label} />
                        </span>
                        <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                          Issued {fmtDate(inv.invoice_date)}
                          {inv.due_date && ` · due ${fmtDate(inv.due_date)}`}
                        </span>
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-mono text-[13.5px] font-semibold tabular-nums">
                          {formatMoney(Number(inv.total), inv.currency)}
                        </span>
                        {Number(inv.amount_paid) > 0 && Number(inv.amount_paid) < Number(inv.total) && (
                          <span className="block font-mono text-[10px] tabular-nums text-muted-foreground">
                            {formatMoney(Number(inv.total) - Number(inv.amount_paid), inv.currency)} left
                          </span>
                        )}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </Panel>
        )}
      </div>

      {/* The invoice document, in the issuer's design */}
      <BottomSheet
        open={!!openInv}
        onOpenChange={(v) => { if (!v) setOpenInv(null); }}
        kicker="Invoice"
        title={openInv?.invoice_number ?? ''}
        tall
        footer={openInv ? (
          <button
            type="button"
            onClick={() => download(openInv)}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[11px] bg-primary text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-105"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
        ) : undefined}
      >
        {openInv && tone && (
          <div className={cn('overflow-hidden rounded-[12px] border border-border/60 bg-white text-neutral-900',
            design?.font === 'times' ? 'font-serif' : design?.font === 'courier' ? 'font-mono' : 'font-sans')}>
            {/* Document header */}
            <div className="px-5 pt-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold leading-tight">
                    {design?.headerCaps ? (design.companyLines[0] || 'Invoice').toUpperCase() : design?.companyLines[0] || 'Invoice'}
                  </p>
                  {design?.companyLines.slice(1).map((l, i) => (
                    <p key={i} className="text-[10px] leading-snug text-neutral-500">{l}</p>
                  ))}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[15px] font-bold" style={{ color: accent }}>INVOICE</p>
                  <p className="font-mono text-[10.5px] tabular-nums text-neutral-500">{openInv.invoice_number}</p>
                </div>
              </div>
              <div aria-hidden className="mt-3 h-[2.5px] w-full" style={{ backgroundColor: accent }} />
            </div>

            {/* Bill to + dates */}
            <div className="flex items-start justify-between gap-4 px-5 pt-4">
              <div className="min-w-0">
                <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Billed to</p>
                <p className="mt-0.5 truncate text-[13px] font-semibold">{openInv.customer_name}</p>
              </div>
              <div className="shrink-0 text-right text-[10.5px] leading-relaxed text-neutral-500">
                <p>Issued {fmtDate(openInv.invoice_date)}</p>
                {openInv.due_date && <p className="font-semibold text-neutral-700">Due {fmtDate(openInv.due_date)}</p>}
                <p className="font-semibold uppercase" style={{ color: tone.tone === 'ok' ? '#3E7C4F' : tone.tone === 'risk' ? '#B3341F' : accent }}>
                  {tone.label}
                </p>
              </div>
            </div>

            {/* Lines */}
            <div className="mt-4 px-5">
              <div className="border-y border-neutral-200 py-1.5 text-[8.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                <div className="flex justify-between"><span>Description</span><span>Amount</span></div>
              </div>
              <ul className="divide-y divide-neutral-100">
                {openInv.lines.map((l, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-medium">{l.description}</span>
                      <span className="block font-mono text-[10px] tabular-nums text-neutral-500">
                        {Number(l.quantity)} × {formatMoney(Number(l.unit_price), openInv.currency)}
                        {Number(l.tax_rate) > 0 && ` · VAT ${Math.round(Number(l.tax_rate) * 100)}%`}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[12px] font-semibold tabular-nums">
                      {formatMoney(Number(l.line_total ?? Number(l.quantity) * Number(l.unit_price)), openInv.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Totals */}
            <div className="mt-1 px-5 pb-5">
              <div className="ml-auto max-w-[240px] space-y-1 text-[11px]">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span><span className="font-mono tabular-nums">{formatMoney(Number(openInv.subtotal), openInv.currency)}</span>
                </div>
                {Number(openInv.tax_total) > 0 && (
                  <div className="flex justify-between text-neutral-500">
                    <span>VAT</span><span className="font-mono tabular-nums">{formatMoney(Number(openInv.tax_total), openInv.currency)}</span>
                  </div>
                )}
                {Number(openInv.amount_paid) > 0 && (
                  <div className="flex justify-between text-neutral-500">
                    <span>Paid</span><span className="font-mono tabular-nums">-{formatMoney(Number(openInv.amount_paid), openInv.currency)}</span>
                  </div>
                )}
                <div className="border-t pt-1.5" style={{ borderColor: accent }}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[11px] font-bold">{Number(openInv.amount_paid) > 0 ? 'Balance due' : 'Total due'}</span>
                    <span className="font-mono text-[16px] font-bold tabular-nums" style={{ color: accent }}>
                      {formatMoney(Math.max(0, Number(openInv.total) - Number(openInv.amount_paid)), openInv.currency)}
                    </span>
                  </div>
                </div>
              </div>

              {openInv.notes && (
                <p className="mt-4 border-t border-neutral-200 pt-3 text-[10.5px] leading-relaxed text-neutral-500">{openInv.notes}</p>
              )}

              {design && design.paymentLines.some(s => s.trim()) && (
                <div className="mt-4 rounded-lg bg-neutral-100 p-3">
                  <p className="text-[8.5px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Payment</p>
                  {design.paymentLines.filter(s => s.trim()).map((l, i) => (
                    <p key={i} className="mt-0.5 text-[10.5px] text-neutral-700">{l}</p>
                  ))}
                </div>
              )}

              {design?.footerText && (
                <p className="mt-4 border-t border-neutral-200 pt-2.5 text-center text-[9.5px] font-medium text-neutral-400">
                  {design.footerText}
                </p>
              )}
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
