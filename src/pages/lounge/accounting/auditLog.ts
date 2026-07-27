// Small helper to log every time a ledger report is recalculated on the client.
// Rows land in public.acc_report_recalcs and stream into the Audit Trail view.
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export async function logRecalc(
  orgId: string,
  reportName: string,
  params: Record<string, any>,
  startedAtMs: number,
  rowCount?: number,
) {
  if (!orgId || !reportName) return;
  try {
    const { data: userRes } = await supabase.auth.getUser();
    await db.from('acc_report_recalcs').insert({
      org_id: orgId,
      report_name: reportName,
      params,
      row_count: rowCount ?? null,
      duration_ms: Math.max(0, Math.round(performance.now() - startedAtMs)),
      computed_by: userRes?.user?.id ?? null,
    });
  } catch {
    // logging must never break the UI
  }
}

/** Convenience wrapper: times an async fn, logs, and returns the result. */
export async function withRecalcLog<T>(
  orgId: string,
  reportName: string,
  params: Record<string, any>,
  fn: () => Promise<T>,
  countRows?: (r: T) => number,
): Promise<T> {
  const t0 = performance.now();
  const result = await fn();
  logRecalc(orgId, reportName, params, t0, countRows ? countRows(result) : undefined);
  return result;
}
