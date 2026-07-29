// Audit Trail — every ledger change + every report recalculation, in real time.
// - Left column: change log from public.acc_audit_log (populated by acc_log_change trigger).
// - Right column: report recalc log from public.acc_report_recalcs.
// Both panels stream via Realtime.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { History, RefreshCw, FileText, Plus, Pencil, Trash2, Clock, Timer, Loader2, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

const db = supabase as any;

interface Props {
  open: boolean;
  onClose: () => void;
  orgId: string;
  orgName: string;
}

interface AuditRow {
  id: string;
  actor_id: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | string;
  entity_type: string;
  entity_id: string | null;
  before_state: any;
  after_state: any;
  created_at: string;
}

interface RecalcRow {
  id: string;
  report_name: string;
  params: any;
  row_count: number | null;
  duration_ms: number | null;
  computed_by: string | null;
  computed_at: string;
}

const ACTION_META: Record<string, { icon: any; color: string; label: string }> = {
  INSERT: { icon: Plus,   color: 'text-ok', label: 'Created' },
  UPDATE: { icon: Pencil, color: 'text-attend',    label: 'Updated' },
  DELETE: { icon: Trash2, color: 'text-risk',     label: 'Deleted' },
};

const ENTITY_LABEL: Record<string, string> = {
  acc_journal_entries: 'Journal',
  acc_journal_lines: 'Journal line',
  acc_ar_invoices: 'Sales invoice',
  acc_ar_invoice_lines: 'Invoice line',
  acc_ar_payments: 'Customer payment',
  acc_ap_bills: 'Bill',
  acc_ap_bill_lines: 'Bill line',
  acc_ap_payments: 'Supplier payment',
  acc_bank_transactions: 'Bank line',
  acc_bank_reconciliations: 'Bank reconciliation',
  acc_fixed_assets: 'Fixed asset',
  acc_depreciation_runs: 'Depreciation run',
  acc_vat_returns: 'VAT return',
  acc_accounting_periods: 'Accounting period',
  acc_chart_of_accounts: 'Ledger account',
  acc_customers: 'Customer',
  acc_suppliers: 'Supplier',
};

/** Best-effort human summary of what changed. */
function summarise(row: AuditRow): string {
  const state = row.after_state || row.before_state || {};
  const bits: string[] = [];
  const num = state.invoice_number || state.bill_number || state.reference || state.code;
  if (num) bits.push(`#${num}`);
  const amt = state.total ?? state.amount ?? state.total_amount;
  if (typeof amt === 'number') bits.push(new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amt));
  if (state.status) bits.push(String(state.status));
  if (state.description && bits.length === 0) bits.push(String(state.description).slice(0, 40));
  return bits.join(' · ');
}

/** For UPDATE rows: which columns actually changed (skip noisy timestamps). */
function changedFields(row: AuditRow): string[] {
  if (row.action !== 'UPDATE' || !row.before_state || !row.after_state) return [];
  const ignore = new Set(['updated_at', 'last_updated_at']);
  const out: string[] = [];
  for (const k of Object.keys(row.after_state)) {
    if (ignore.has(k)) continue;
    if (JSON.stringify(row.before_state[k]) !== JSON.stringify(row.after_state[k])) out.push(k);
  }
  return out.slice(0, 6);
}

export default function AuditTrailView({ open, onClose, orgId, orgName }: Props) {
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [recalcs, setRecalcs] = useState<RecalcRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [{ data: a }, { data: r }] = await Promise.all([
      db.from('acc_audit_log')
        .select('id, actor_id, action, entity_type, entity_id, before_state, after_state, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(250),
      db.from('acc_report_recalcs')
        .select('id, report_name, params, row_count, duration_ms, computed_by, computed_at')
        .eq('org_id', orgId)
        .order('computed_at', { ascending: false })
        .limit(100),
    ]);
    setAudit((a || []) as AuditRow[]);
    setRecalcs((r || []) as RecalcRow[]);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  // Realtime
  useEffect(() => {
    if (!open || !orgId) return;
    const ch = supabase.channel(`acc-audit-${orgId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'acc_audit_log', filter: `org_id=eq.${orgId}` },
        (p) => setAudit(prev => [p.new as AuditRow, ...prev].slice(0, 250)))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'acc_report_recalcs', filter: `org_id=eq.${orgId}` },
        (p) => setRecalcs(prev => [p.new as RecalcRow, ...prev].slice(0, 100)))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, orgId]);

  const filtered = useMemo(() => {
    return audit.filter(r => {
      if (entityFilter !== 'all' && r.entity_type !== entityFilter) return false;
      if (actionFilter !== 'all' && r.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${r.entity_type} ${JSON.stringify(r.after_state || r.before_state || {})}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [audit, entityFilter, actionFilter, search]);

  const entityOptions = useMemo(() => {
    const set = new Set(audit.map(a => a.entity_type));
    return Array.from(set).sort();
  }, [audit]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-sunken">
              <History className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle>Audit trail · {orgName}</DialogTitle>
              <DialogDescription>Every ledger change and every report recalculation, in real time.</DialogDescription>
            </div>
            <Button size="sm" variant="ghost" className="ml-auto" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 flex-1 overflow-hidden">
          {/* --- Ledger changes --- */}
          <div className="flex flex-col rounded-[10px] border border-border/60 bg-card overflow-hidden">
            <div className="p-3 border-b border-border/60 space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm font-bold flex-1">Ledger changes</div>
                <Badge variant="secondary" className="text-[10px]">{filtered.length}</Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="relative">
                  <Filter className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" className="h-8 pl-8 rounded-lg text-xs" />
                </div>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All entities</SelectItem>
                    {entityOptions.map(e => (
                      <SelectItem key={e} value={e}>{ENTITY_LABEL[e] || e}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="h-8 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    <SelectItem value="INSERT">Created</SelectItem>
                    <SelectItem value="UPDATE">Updated</SelectItem>
                    <SelectItem value="DELETE">Deleted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {filtered.length === 0 && !loading && (
                <div className="p-8 text-center text-xs text-muted-foreground">No ledger changes recorded yet.</div>
              )}
              {filtered.map(row => {
                const meta = ACTION_META[row.action] || ACTION_META.UPDATE;
                const Icon = meta.icon;
                const fields = changedFields(row);
                return (
                  <div key={row.id} className="p-3 hover:bg-foreground/[0.025]">
                    <div className="flex items-start gap-2.5">
                      <div className={cn('h-7 w-7 rounded-lg bg-muted/60 flex items-center justify-center shrink-0', meta.color)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn('text-xs font-bold', meta.color)}>{meta.label}</span>
                          <span className="text-xs">{ENTITY_LABEL[row.entity_type] || row.entity_type}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        {summarise(row) && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{summarise(row)}</div>
                        )}
                        {fields.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {fields.map(f => (
                              <span key={f} className="rounded border border-border/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* --- Report recalculations --- */}
          <div className="flex flex-col rounded-[10px] border border-border/60 bg-card overflow-hidden">
            <div className="p-3 border-b border-border/60 flex items-center gap-2">
              <Timer className="h-4 w-4 text-attend" />
              <div className="text-sm font-bold flex-1">Report recalculations</div>
              <Badge variant="secondary" className="text-[10px]">{recalcs.length}</Badge>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-border/60">
              {recalcs.length === 0 && !loading && (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No recalculations yet. Open a report to record one.
                </div>
              )}
              {recalcs.map(r => (
                <div key={r.id} className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">{r.report_name}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {formatDistanceToNow(new Date(r.computed_at), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                    {r.duration_ms != null && <span className="font-mono">{r.duration_ms} ms</span>}
                    {r.row_count != null && <span>· {r.row_count.toLocaleString()} rows</span>}
                    {r.params && Object.entries(r.params).slice(0, 3).map(([k, v]) => (
                      <span key={k} className="font-mono bg-muted/60 px-1.5 py-0.5 rounded">
                        {k}={String(v)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
