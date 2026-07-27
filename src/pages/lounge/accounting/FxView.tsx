import { useEffect, useState, useCallback } from 'react';
import { Plus, Loader2, Globe, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FxRate {
  id: string;
  rate_date: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  source: string | null;
}

const COMMON = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'SEK', 'NOK', 'DKK'];

export default function FxView({ orgId, baseCurrency }: { orgId: string; baseCurrency: string }) {
  const { user } = useAuth();
  const [rates, setRates] = useState<FxRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    rate_date: new Date().toISOString().slice(0, 10),
    from_currency: 'USD',
    to_currency: baseCurrency,
    rate: '',
  });
  const [revalDate, setRevalDate] = useState(new Date().toISOString().slice(0, 10));
  const [revaluing, setRevaluing] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from('acc_fx_rates').select('*').eq('org_id', orgId)
      .order('rate_date', { ascending: false }).limit(200);
    setRates(data || []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setForm(f => ({ ...f, to_currency: baseCurrency })); }, [baseCurrency]);

  async function addRate() {
    const rate = parseFloat(form.rate);
    if (!rate || rate <= 0) { toast.error('Enter a valid rate'); return; }
    if (form.from_currency === form.to_currency) { toast.error('Currencies must differ'); return; }
    const { error } = await (supabase as any).from('acc_fx_rates').insert({
      org_id: orgId,
      rate_date: form.rate_date,
      from_currency: form.from_currency.toUpperCase(),
      to_currency: form.to_currency.toUpperCase(),
      rate,
      source: 'manual',
      created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('FX rate saved');
    setShowAdd(false);
    setForm(f => ({ ...f, rate: '' }));
    load();
  }

  async function deleteRate(id: string) {
    if (!confirm('Delete this rate?')) return;
    const { error } = await (supabase as any).from('acc_fx_rates').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    load();
  }

  async function revalue() {
    if (!user) return;
    setRevaluing(true);
    const { data, error } = await (supabase as any).rpc('acc_post_fx_revaluation', {
      _org_id: orgId, _as_of: revalDate, _user_id: user.id,
    });
    setRevaluing(false);
    if (error) { toast.error(error.message); return; }
    toast.success('FX revaluation posted');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-4 w-4 text-brand" /> Multi-currency & FX
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Base currency <span className="font-semibold text-foreground">{baseCurrency}</span> · Record exchange rates and post period-end revaluations.
          </p>
        </div>
        <Button size="sm" className="h-8 rounded-xl text-xs gap-1.5" onClick={() => setShowAdd(true)}>
          <Plus className="h-3.5 w-3.5" /> Add rate
        </Button>
      </div>

      {/* Revaluation card */}
      <div className="p-4 rounded-2xl bg-card/60 border border-border/20">
        <h3 className="text-[13px] font-bold mb-1">FX Revaluation</h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          Revalues open foreign-currency invoices and bills against your base currency using the latest rate on the chosen date.
          Posts a balanced journal to <span className="font-semibold">4920 FX Gains</span> / <span className="font-semibold">6920 FX Losses</span>.
        </p>
        <div className="flex items-end gap-2">
          <div>
            <Label className="text-[10px]">As of</Label>
            <Input type="date" value={revalDate} onChange={e => setRevalDate(e.target.value)} className="h-9 w-[160px] rounded-xl mt-1" />
          </div>
          <Button size="sm" className="h-9 rounded-xl text-xs gap-1.5" disabled={revaluing} onClick={revalue}>
            {revaluing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            Post revaluation
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="p-4 rounded-2xl bg-card/60 border border-border/20">
          <h3 className="text-[13px] font-bold mb-3">New exchange rate</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 items-end">
            <div>
              <Label className="text-[10px]">Date</Label>
              <Input type="date" value={form.rate_date} onChange={e => setForm({ ...form, rate_date: e.target.value })} className="h-9 rounded-xl mt-1" />
            </div>
            <div>
              <Label className="text-[10px]">From</Label>
              <Input value={form.from_currency} onChange={e => setForm({ ...form, from_currency: e.target.value.toUpperCase() })} maxLength={3} className="h-9 rounded-xl mt-1 uppercase" />
            </div>
            <div>
              <Label className="text-[10px]">To</Label>
              <Input value={form.to_currency} onChange={e => setForm({ ...form, to_currency: e.target.value.toUpperCase() })} maxLength={3} className="h-9 rounded-xl mt-1 uppercase" />
            </div>
            <div>
              <Label className="text-[10px]">Rate (1 {form.from_currency || '—'} = ? {form.to_currency || '—'})</Label>
              <Input type="number" step="0.00000001" value={form.rate} onChange={e => setForm({ ...form, rate: e.target.value })} className="h-9 rounded-xl mt-1 tabular-nums" placeholder="0.00" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" className="h-9 rounded-xl text-xs flex-1" onClick={addRate}>Save</Button>
              <Button size="sm" variant="ghost" className="h-9 rounded-xl text-xs" onClick={() => setShowAdd(false)}>Cancel</Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mt-3">
            <span className="text-[10px] text-muted-foreground self-center mr-1">Quick pick:</span>
            {COMMON.filter(c => c !== baseCurrency).map(c => (
              <button key={c} onClick={() => setForm({ ...form, from_currency: c, to_currency: baseCurrency })}
                className="text-[10px] px-2 py-0.5 rounded-md bg-muted/40 hover:bg-muted/70 transition">
                {c}→{baseCurrency}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Rates table */}
      <div className="rounded-2xl bg-card/60 border border-border/20 overflow-hidden">
        <div className="grid grid-cols-[100px_80px_80px_1fr_100px_40px] text-[10px] uppercase tracking-wider text-muted-foreground px-4 py-2 border-b border-border/20 bg-muted/20">
          <span>Date</span><span>From</span><span>To</span><span>Rate</span><span>Source</span><span></span>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : rates.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No exchange rates yet.</p>
        ) : (
          rates.map(r => (
            <div key={r.id} className="grid grid-cols-[100px_80px_80px_1fr_100px_40px] items-center px-4 py-2 text-xs border-b border-border/10 last:border-0 hover:bg-muted/10">
              <span className="tabular-nums text-muted-foreground">{new Date(r.rate_date).toLocaleDateString('en-GB')}</span>
              <span className="font-semibold">{r.from_currency}</span>
              <span className="font-semibold">{r.to_currency}</span>
              <span className="tabular-nums">{Number(r.rate).toFixed(6)}</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{r.source || 'manual'}</span>
              <button onClick={() => deleteRate(r.id)} className="text-muted-foreground hover:text-red-500 transition">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
