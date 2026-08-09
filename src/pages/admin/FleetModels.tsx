import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, RefreshCw, Zap, Download, Cpu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/*
 * The fleet registry: every model the mesh can call, as data. Adding a
 * model is a row - paste endpoint and secret NAME, pick an adapter, hit
 * Test. The test happens server-side in mesh-fleet, where the secret
 * lives; the key itself never exists in this browser.
 */

type Registry = {
  id: string; display_name: string; adapter: string; endpoint: string; env_key: string;
  cost_class: string; capabilities: string[]; context_window: number | null; max_output: number | null;
  rpm: number | null; rpd: number | null; concurrency: number; is_enabled: boolean;
  verified_at: string | null; limits_source: string; notes: string;
};
type Health = { model_id: string; cooldown_until: string | null; consecutive_failures: number; error_rate: number; median_latency_ms: number | null; parked: boolean };
type Usage = { model_id: string; calls: number; ok_calls: number; tokens_in: number; tokens_out: number; headers_seen: boolean };

const ADAPTERS = ['openai_compatible', 'openrouter', 'google_native', 'ollama', 'generic'] as const;
const CAPS = ['code', 'copy', 'research', 'vision', 'long_context', 'json_mode', 'tools', 'embed', 'qa'] as const;
const COST = { free: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10', local: 'text-sky-400 border-sky-400/30 bg-sky-400/10', subscription: 'text-violet-400 border-violet-400/30 bg-violet-400/10', paid: 'text-amber-400 border-amber-400/30 bg-amber-400/10' } as Record<string, string>;

export default function FleetModels() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Registry[]>([]);
  const [health, setHealth] = useState<Record<string, Health>>({});
  const [usage, setUsage] = useState<Record<string, Usage>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({
    id: '', display_name: '', adapter: 'openai_compatible', endpoint: '', env_key: '',
    cost_class: 'free', capabilities: ['copy'] as string[], context_window: '', max_output: '', rpm: '', rpd: '',
  });

  const load = useCallback(async () => {
    const [r, h, u] = await Promise.all([
      supabase.from('model_registry').select('*').order('cost_class').order('id'),
      supabase.from('model_health').select('*'),
      supabase.from('usage_counters').select('*').eq('date', new Date().toISOString().slice(0, 10)),
    ]);
    setRows((r.data as Registry[]) || []);
    setHealth(Object.fromEntries(((h.data as Health[]) || []).map(x => [x.model_id, x])));
    setUsage(Object.fromEntries(((u.data as Usage[]) || []).map(x => [x.model_id, x])));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const invoke = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('mesh-fleet', { body });
    if (error) throw new Error(error.message);
    return data as Record<string, unknown>;
  }, []);

  const testModel = useCallback(async (id: string) => {
    setBusy(id);
    try {
      const out = await invoke({ action: 'test_model', model_id: id });
      if (out.ok) toast.success(`${id} answered in ${out.latency_ms}ms`, { description: out.rate_limit_headers ? 'Rate-limit headers present — limits are measurable.' : 'No rate-limit headers — budget is counted locally.' });
      else toast.error(`${id}: ${out.error_class}`, { description: String(out.error ?? '').slice(0, 140) });
      await load();
    } catch (e) { toast.error('Test failed', { description: e instanceof Error ? e.message : undefined }); }
    finally { setBusy(null); }
  }, [invoke, load]);

  const verifyAll = useCallback(async () => {
    setBusy('__all__');
    try {
      const out = await invoke({ action: 'verify_registry' });
      const m = (out.matrix as { ok: boolean }[]) || [];
      toast.success(`Verified ${m.filter(x => x.ok).length}/${out.tested} models`, { description: 'Failures keep their last verified state and show why.' });
      await load();
    } catch (e) { toast.error('Verify failed', { description: e instanceof Error ? e.message : undefined }); }
    finally { setBusy(null); }
  }, [invoke, load]);

  const toggleEnabled = useCallback(async (row: Registry) => {
    await supabase.from('model_registry').update({ is_enabled: !row.is_enabled } as never).eq('id', row.id);
    await load();
  }, [load]);

  const saveDraft = useCallback(async () => {
    if (!draft.id || !draft.endpoint && draft.adapter !== 'ollama') { toast.error('Model id and endpoint are required'); return; }
    const row = {
      id: draft.id, display_name: draft.display_name || draft.id, adapter: draft.adapter,
      endpoint: draft.endpoint, env_key: draft.env_key, cost_class: draft.cost_class,
      capabilities: draft.capabilities,
      context_window: draft.context_window ? Number(draft.context_window) : null,
      max_output: draft.max_output ? Number(draft.max_output) : null,
      rpm: draft.rpm ? Number(draft.rpm) : null, rpd: draft.rpd ? Number(draft.rpd) : null,
      limits_source: 'assumed', notes: 'Added from the Fleet screen.',
    };
    const { error } = await supabase.from('model_registry').insert(row as never);
    if (error) { toast.error('Not saved', { description: error.message }); return; }
    toast.success(`${draft.id} added — now Test it`);
    setShowAdd(false);
    setDraft({ ...draft, id: '', display_name: '', endpoint: '', env_key: '' });
    await load();
  }, [draft, load]);

  const importFree = useCallback(async () => {
    setBusy('__import__');
    try {
      const out = await invoke({ action: 'catalogue', provider: 'openrouter' });
      const models = ((out.models as { id: string; name: string; context: number; free: boolean }[]) || []).filter(m => m.free);
      const existing = new Set(rows.map(r => r.id));
      const fresh = models.filter(m => !existing.has(`openrouter/${m.id}`));
      if (!fresh.length) { toast.info('Every free catalogue model is already registered'); return; }
      const { error } = await supabase.from('model_registry').insert(fresh.map(m => ({
        id: `openrouter/${m.id}`, display_name: `${m.name} (free)`, adapter: 'openrouter',
        endpoint: 'https://openrouter.ai/api/v1', env_key: 'OPENROUTER_API_KEY', cost_class: 'free',
        capabilities: ['copy'], context_window: m.context ?? null, limits_source: 'documented',
        notes: 'Imported from the live OpenRouter catalogue.',
      })) as never);
      if (error) throw new Error(error.message);
      toast.success(`Imported ${fresh.length} free models from the live catalogue`);
      await load();
    } catch (e) { toast.error('Import failed', { description: e instanceof Error ? e.message : undefined }); }
    finally { setBusy(null); }
  }, [invoke, rows, load]);

  const grouped = useMemo(() => {
    const g: Record<string, Registry[]> = {};
    rows.forEach(r => { (g[r.cost_class] ??= []).push(r); });
    return g;
  }, [rows]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b0e16] text-slate-200">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-slate-300" onClick={() => navigate('/admin')}>
          <ArrowLeft className="h-4 w-4" /> Admin
        </Button>
        <Cpu className="h-4 w-4 text-emerald-400" />
        <h1 className="text-[15px] font-semibold tracking-tight">Model Fleet</h1>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">registry is the mesh · adding a model is data, not code</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-8 gap-1.5 border-white/15 bg-white/5 px-3 text-xs text-slate-200" disabled={busy !== null} onClick={() => void importFree()}>
          <Download className="h-3.5 w-3.5" /> Import free catalogue
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 border-white/15 bg-white/5 px-3 text-xs text-slate-200" disabled={busy !== null} onClick={() => void verifyAll()}>
          <RefreshCw className={cn('h-3.5 w-3.5', busy === '__all__' && 'animate-spin')} /> Verify registry
        </Button>
        <Button size="sm" className="h-8 gap-1.5 px-3 text-xs" onClick={() => setShowAdd(v => !v)}>
          <Plus className="h-3.5 w-3.5" /> Add model
        </Button>
      </header>

      {showAdd && (
        <div className="border-b border-white/10 bg-white/[0.03] px-5 py-4">
          <div className="grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
            <Input placeholder="id — e.g. groq/llama-3.3-70b" value={draft.id} onChange={e => setDraft({ ...draft, id: e.target.value })} className="col-span-2 h-9 border-white/15 bg-black/30 text-xs" />
            <Input placeholder="Display name" value={draft.display_name} onChange={e => setDraft({ ...draft, display_name: e.target.value })} className="h-9 border-white/15 bg-black/30 text-xs" />
            <select value={draft.adapter} onChange={e => setDraft({ ...draft, adapter: e.target.value })} className="h-9 rounded-md border border-white/15 bg-black/30 px-2 text-xs">
              {ADAPTERS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <Input placeholder="Endpoint base URL" value={draft.endpoint} onChange={e => setDraft({ ...draft, endpoint: e.target.value })} className="col-span-2 h-9 border-white/15 bg-black/30 text-xs" />
            <Input placeholder="Secret NAME (e.g. GROQ_API_KEY)" value={draft.env_key} onChange={e => setDraft({ ...draft, env_key: e.target.value })} className="h-9 border-white/15 bg-black/30 text-xs" />
            <select value={draft.cost_class} onChange={e => setDraft({ ...draft, cost_class: e.target.value })} className="h-9 rounded-md border border-white/15 bg-black/30 px-2 text-xs">
              {['free', 'local', 'subscription', 'paid'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="col-span-2 flex flex-wrap items-center gap-1.5 sm:col-span-4">
              {CAPS.map(c => (
                <button key={c} onClick={() => setDraft(d => ({ ...d, capabilities: d.capabilities.includes(c) ? d.capabilities.filter(x => x !== c) : [...d.capabilities, c] }))}
                  className={cn('rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wide',
                    draft.capabilities.includes(c) ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-white/15 text-slate-400 hover:text-slate-200')}>
                  {c}
                </button>
              ))}
              <div className="flex-1" />
              <Button size="sm" className="h-8 px-4 text-xs" onClick={() => void saveDraft()}>Save, then Test</Button>
            </div>
            <p className="col-span-2 text-[11px] leading-relaxed text-slate-500 sm:col-span-4">
              The secret name refers to a Supabase Edge Function secret. Paste the actual key in
              Supabase → Edge Functions → Secrets; it never enters this page.
            </p>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto px-5 py-4">
        {(['free', 'local', 'subscription', 'paid'] as const).map(cls => grouped[cls]?.length ? (
          <section key={cls} className="mb-6">
            <h2 className="mb-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">{cls} · {grouped[cls].length}</h2>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[900px] text-left text-[12px]">
                <thead className="bg-white/[0.04] font-mono text-[10px] uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Model</th><th className="px-3 py-2">Capabilities</th>
                    <th className="px-3 py-2">Context</th><th className="px-3 py-2">Today</th>
                    <th className="px-3 py-2">Health</th><th className="px-3 py-2">Verified</th>
                    <th className="px-3 py-2">On</th><th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {grouped[cls].map(r => {
                    const h = health[r.id]; const u = usage[r.id];
                    const cooling = h?.cooldown_until && new Date(h.cooldown_until) > new Date();
                    return (
                      <tr key={r.id} className="border-t border-white/5">
                        <td className="px-3 py-2">
                          <div className="font-medium text-slate-100">{r.display_name}</div>
                          <div className="font-mono text-[10px] text-slate-500">{r.id}{r.env_key ? ` · ${r.env_key}` : ''}</div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            {r.capabilities.map(c => <span key={c} className="rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] uppercase text-slate-400">{c}</span>)}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-400">{r.context_window ? `${Math.round(r.context_window / 1024)}k` : '—'}</td>
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-400">
                          {u ? `${u.calls}${r.rpd ? `/${r.rpd}` : ''} calls · ${u.ok_calls} ok` : r.rpd ? `0/${r.rpd}` : '—'}
                          {u && !u.headers_seen && u.calls > 0 && <span className="ml-1 text-[9px] text-slate-600">(counted)</span>}
                          {(() => {
                            /* projection, same formula as the advisor: today's burn
                               per hour against what the cap has left */
                            if (!r.rpd || !u || u.calls === 0 || u.calls >= r.rpd) return null;
                            const hours = Math.max((Date.now() - new Date().setHours(0, 0, 0, 0)) / 3600_000, .25);
                            const burn = u.calls / hours;
                            const minsLeft = ((r.rpd - u.calls) / burn) * 60;
                            const midnight = (new Date().setHours(24, 0, 0, 0) - Date.now()) / 60000;
                            if (minsLeft >= midnight) return null;
                            return <div className="text-[10px] text-amber-300">≈ exhausts in {minsLeft > 90 ? `${Math.round(minsLeft / 60)}h` : `${Math.round(minsLeft)}m`} at this rate</div>;
                          })()}
                        </td>
                        <td className="px-3 py-2">
                          {r.adapter === 'claude_cli_bridge' ? <span className="text-[11px] text-violet-300">bridge lane</span>
                            : h?.parked ? <span className="text-[11px] text-amber-400">parked · quota spent</span>
                            : cooling ? <span className="text-[11px] text-amber-300">cooldown · {Math.max(1, Math.ceil((new Date(h!.cooldown_until!).getTime() - Date.now()) / 60000))}m left</span>
                            : h && h.error_rate > 0.3 ? <span className="text-[11px] text-rose-400">degraded</span>
                            : h ? <span className="text-[11px] text-emerald-400">{h.median_latency_ms ? `${h.median_latency_ms}ms` : 'healthy'}</span>
                            : <span className="text-[11px] text-slate-600">no calls yet</span>}
                          {h && (u?.calls ?? 0) > 0 && r.adapter !== 'claude_cli_bridge' && (
                            <div className="mt-1 h-1 w-20 overflow-hidden rounded bg-white/10">
                              <div className={cn('h-full rounded', h.error_rate > 0.3 ? 'bg-rose-400' : h.error_rate > 0.1 ? 'bg-amber-300' : 'bg-emerald-400')}
                                style={{ width: `${Math.max(6, (1 - h.error_rate) * 100)}%` }} />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {r.verified_at
                            ? <span className={cn('rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase', COST.free)}>{r.limits_source}</span>
                            : <span className="rounded border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase text-slate-500">unverified</span>}
                        </td>
                        <td className="px-3 py-2"><Switch checked={r.is_enabled} onCheckedChange={() => void toggleEnabled(r)} /></td>
                        <td className="px-3 py-2 text-right">
                          {r.adapter !== 'claude_cli_bridge' && (
                            <Button variant="outline" size="sm" className="h-7 gap-1 border-white/15 bg-white/5 px-2.5 text-[11px] text-slate-200" disabled={busy !== null} onClick={() => void testModel(r.id)}>
                              <Zap className={cn('h-3 w-3', busy === r.id && 'animate-pulse')} /> Test
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ) : null)}
        <p className="max-w-3xl pb-8 text-[11px] leading-relaxed text-slate-600">
          Budgets are counted locally on every call and corrected by rate-limit headers where a
          provider sends them; a row marked “(counted)” has no headers and its remaining budget is
          an estimate, never a measurement. Free catalogues churn — run Verify registry monthly.
        </p>
      </div>
    </div>
  );
}
