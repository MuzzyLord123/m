import { useEffect, useMemo, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Boxes, CalendarClock, Send, Lock, CheckCircle2, X, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Account { id: string; code: string; name: string; type: string; }
interface Asset {
  id: string; org_id: string;
  asset_tag: string | null; name: string; category: string | null;
  purchase_date: string; purchase_cost: number; salvage_value: number;
  useful_life_months: number; depreciation_method: 'straight_line'|'reducing_balance';
  reducing_rate_pct: number | null;
  accumulated_depreciation: number;
  last_depreciated_on: string | null;
  status: 'active'|'fully_depreciated'|'disposed';
  disposal_date: string | null; disposal_proceeds: number | null;
  acquisition_entry_id: string | null;
}
interface DeprRun {
  id: string; org_id: string; period_end: string; reference: string | null;
  status: 'draft'|'posted'|'void'; total_amount: number; posted_at: string | null;
}
interface DeprLine { id: string; run_id: string; asset_id: string; amount: number; book_value_before: number; book_value_after: number; }
interface BankAcct { id: string; name: string; coa_account_id: string; }

const money = (n: number, c='GBP') => new Intl.NumberFormat('en-GB', { style: 'currency', currency: c, minimumFractionDigits: 2 }).format(Number(n||0));
const todayISO = () => new Date().toISOString().slice(0,10);
const lastOfMonth = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth()+1, 0).toISOString().slice(0,10); };

export default function FixedAssetsView({ orgId, accounts, currency }: { orgId: string; accounts: Account[]; currency: string }) {
  const [tab, setTab] = useState<'assets'|'runs'>('assets');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [runs, setRuns] = useState<DeprRun[]>([]);
  const [banks, setBanks] = useState<BankAcct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [openRun, setOpenRun] = useState<DeprRun | null>(null);
  const [disposeOpen, setDisposeOpen] = useState<Asset | null>(null);
  const [acquireOpen, setAcquireOpen] = useState<Asset | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    const [a, r, b] = await Promise.all([
      (supabase as any).from('acc_fixed_assets').select('*').eq('org_id', orgId).order('purchase_date', { ascending: false }),
      (supabase as any).from('acc_depreciation_runs').select('*').eq('org_id', orgId).order('period_end', { ascending: false }),
      (supabase as any).from('acc_bank_accounts').select('id,name,coa_account_id').eq('org_id', orgId).order('name'),
    ]);
    setAssets(a.data || []); setRuns(r.data || []); setBanks(b.data || []);
    setLoading(false);
  }, [orgId]);
  useEffect(() => { refresh(); }, [refresh]);

  async function createRun() {
    setBusy('new');
    const { data, error } = await (supabase as any).rpc('acc_create_depreciation_run', { _org_id: orgId, _period_end: lastOfMonth() });
    setBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Depreciation run created');
    await refresh();
    const fresh = (await (supabase as any).from('acc_depreciation_runs').select('*').eq('id', data).maybeSingle()).data;
    setOpenRun(fresh);
  }

  const totals = useMemo(() => {
    const active = assets.filter(a => a.status === 'active');
    const cost = active.reduce((s,a) => s + Number(a.purchase_cost), 0);
    const bv   = active.reduce((s,a) => s + Number(a.purchase_cost) - Number(a.accumulated_depreciation), 0);
    return { count: active.length, cost, bv };
  }, [assets]);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Fixed Assets</h2>
          <p className="text-xs text-muted-foreground">
            {totals.count} active · Cost {money(totals.cost, currency)} · Book value {money(totals.bv, currency)}
          </p>
        </div>
        <div className="flex gap-2">
          {tab === 'assets' && <Button size="sm" className="h-8 rounded-xl gap-1.5 text-xs" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5" /> Add asset</Button>}
          {tab === 'runs' && <Button size="sm" className="h-8 rounded-xl gap-1.5 text-xs" onClick={createRun} disabled={busy === 'new'}>
            {busy === 'new' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />} New depreciation run
          </Button>}
        </div>
      </div>

      <div className="flex gap-1 border-b border-border/30">
        {(['assets','runs'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("px-3 h-8 text-[11px] font-medium border-b-2 transition-colors capitalize",
              tab === t ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {t === 'assets' ? <><Boxes className="h-3 w-3 inline mr-1" />Assets</> : <><TrendingDown className="h-3 w-3 inline mr-1" />Depreciation runs</>}
          </button>
        ))}
      </div>

      {tab === 'assets' ? (
        <AssetsList assets={assets} currency={currency} onAcquire={setAcquireOpen} onDispose={setDisposeOpen} />
      ) : (
        <RunsList runs={runs} currency={currency} onOpen={setOpenRun} />
      )}

      {addOpen && <AddAssetDialog orgId={orgId} accounts={accounts} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); refresh(); }} />}
      {acquireOpen && <AcquireDialog asset={acquireOpen} banks={banks} onClose={() => setAcquireOpen(null)}
        onDone={() => { setAcquireOpen(null); refresh(); }} />}
      {disposeOpen && <DisposeDialog asset={disposeOpen} banks={banks} currency={currency}
        onClose={() => setDisposeOpen(null)} onDone={() => { setDisposeOpen(null); refresh(); }} />}
      {openRun && <RunEditor run={openRun} assets={assets} currency={currency}
        onClose={() => setOpenRun(null)} onChanged={async () => { await refresh(); const fresh = (await (supabase as any).from('acc_depreciation_runs').select('*').eq('id', openRun.id).maybeSingle()).data; setOpenRun(fresh || null); }} />}
    </div>
  );
}

/* -------- Assets -------- */
function AssetsList({ assets, currency, onAcquire, onDispose }: { assets: Asset[]; currency: string; onAcquire: (a: Asset) => void; onDispose: (a: Asset) => void }) {
  if (assets.length === 0) return (
    <div className="rounded-2xl border border-dashed border-border/30 py-16 text-center">
      <Boxes className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">No fixed assets yet</p>
    </div>
  );
  return (
    <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-background/60 text-muted-foreground uppercase tracking-wider text-[10px]">
          <tr>
            <th className="text-left px-4 py-2.5">Asset</th>
            <th className="text-left px-3 py-2.5">Method</th>
            <th className="text-right px-3 py-2.5">Cost</th>
            <th className="text-right px-3 py-2.5">Accum. Depr.</th>
            <th className="text-right px-3 py-2.5">Book value</th>
            <th className="text-left px-3 py-2.5">Status</th>
            <th className="text-right px-4 py-2.5">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/10">
          {assets.map(a => {
            const bv = Number(a.purchase_cost) - Number(a.accumulated_depreciation);
            return (
              <tr key={a.id} className="hover:bg-background/40">
                <td className="px-4 py-2.5">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-[10px] text-muted-foreground">{a.asset_tag || '—'} · {a.category || 'Uncategorised'} · purchased {new Date(a.purchase_date).toLocaleDateString('en-GB')}</div>
                </td>
                <td className="px-3 py-2.5">
                  <span className="capitalize text-[11px]">{a.depreciation_method.replace('_',' ')}</span>
                  <div className="text-[10px] text-muted-foreground">{a.useful_life_months}m life</div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{money(Number(a.purchase_cost), currency)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-amber-500">{money(Number(a.accumulated_depreciation), currency)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{money(bv, currency)}</td>
                <td className="px-3 py-2.5"><AssetStatus s={a.status} /></td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-1.5">
                    {!a.acquisition_entry_id && <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[11px]" onClick={() => onAcquire(a)}>Post acquisition</Button>}
                    {a.status !== 'disposed' && <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[11px]" onClick={() => onDispose(a)}>Dispose</Button>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AssetStatus({ s }: { s: Asset['status'] }) {
  const map = {
    active: { l: 'Active', c: 'bg-emerald-500/15 text-emerald-500' },
    fully_depreciated: { l: 'Fully depreciated', c: 'bg-amber-500/15 text-amber-500' },
    disposed: { l: 'Disposed', c: 'bg-muted text-muted-foreground' },
  }[s];
  return <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium", map.c)}>{map.l}</span>;
}

function AddAssetDialog({ orgId, accounts, onClose, onSaved }: { orgId: string; accounts: Account[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState({
    name: '', asset_tag: '', category: '',
    purchase_date: todayISO(),
    purchase_cost: '', salvage_value: '0',
    useful_life_months: '60',
    depreciation_method: 'straight_line' as 'straight_line'|'reducing_balance',
    reducing_rate_pct: '20',
    asset_account_id: '',
  });
  const assetOptions = accounts.filter(a => a.type === 'asset' && (a.code.startsWith('15') || a.code.startsWith('16')));
  async function save() {
    if (!f.name.trim() || !f.purchase_cost) { toast.error('Name & cost required'); return; }
    const { error } = await (supabase as any).from('acc_fixed_assets').insert({
      org_id: orgId, name: f.name.trim(), asset_tag: f.asset_tag || null, category: f.category || null,
      purchase_date: f.purchase_date,
      purchase_cost: parseFloat(f.purchase_cost),
      salvage_value: parseFloat(f.salvage_value) || 0,
      useful_life_months: parseInt(f.useful_life_months) || 60,
      depreciation_method: f.depreciation_method,
      reducing_rate_pct: f.depreciation_method === 'reducing_balance' ? parseFloat(f.reducing_rate_pct) || null : null,
      asset_account_id: f.asset_account_id || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Asset added'); onSaved();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="text-sm">New fixed asset</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label className="text-[11px]">Name</Label><Input value={f.name} onChange={e => setF({...f, name: e.target.value})} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Asset tag</Label><Input value={f.asset_tag} onChange={e => setF({...f, asset_tag: e.target.value})} placeholder="FA-0001" className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Category</Label><Input value={f.category} onChange={e => setF({...f, category: e.target.value})} placeholder="Equipment" className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Purchase date</Label><Input type="date" value={f.purchase_date} onChange={e => setF({...f, purchase_date: e.target.value})} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Purchase cost</Label><Input type="number" step="0.01" value={f.purchase_cost} onChange={e => setF({...f, purchase_cost: e.target.value})} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Salvage value</Label><Input type="number" step="0.01" value={f.salvage_value} onChange={e => setF({...f, salvage_value: e.target.value})} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Useful life (months)</Label><Input type="number" value={f.useful_life_months} onChange={e => setF({...f, useful_life_months: e.target.value})} className="h-9 rounded-lg mt-1" /></div>
          <div><Label className="text-[11px]">Depreciation method</Label>
            <Select value={f.depreciation_method} onValueChange={(v: any) => setF({...f, depreciation_method: v})}>
              <SelectTrigger className="h-9 rounded-lg mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="straight_line">Straight-line</SelectItem>
                <SelectItem value="reducing_balance">Reducing balance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {f.depreciation_method === 'reducing_balance' && (
            <div><Label className="text-[11px]">Annual rate %</Label><Input type="number" step="0.1" value={f.reducing_rate_pct} onChange={e => setF({...f, reducing_rate_pct: e.target.value})} className="h-9 rounded-lg mt-1" /></div>
          )}
          <div className="col-span-2"><Label className="text-[11px]">Asset account (optional)</Label>
            <Select value={f.asset_account_id} onValueChange={v => setF({...f, asset_account_id: v})}>
              <SelectTrigger className="h-9 rounded-lg mt-1"><SelectValue placeholder="Default 1500 Fixed Assets" /></SelectTrigger>
              <SelectContent>
                {assetOptions.map(a => <SelectItem key={a.id} value={a.id}>{a.code} · {a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-lg text-xs" onClick={save}>Add asset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AcquireDialog({ asset, banks, onClose, onDone }: { asset: Asset; banks: BankAcct[]; onClose: () => void; onDone: () => void }) {
  const [bankId, setBankId] = useState(banks[0]?.id || '');
  const [busy, setBusy] = useState(false);
  async function go() {
    const bank = banks.find(b => b.id === bankId);
    if (!bank) { toast.error('Bank required'); return; }
    setBusy(true);
    const { error } = await (supabase as any).rpc('acc_post_asset_acquisition', { _asset_id: asset.id, _bank_account_id: bank.coa_account_id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Acquisition posted'); onDone();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="text-sm">Post acquisition for {asset.name}</DialogTitle></DialogHeader>
        <div>
          <Label className="text-[11px]">Paid from bank</Label>
          <Select value={bankId} onValueChange={setBankId}>
            <SelectTrigger className="h-9 rounded-lg mt-1"><SelectValue placeholder="Select bank" /></SelectTrigger>
            <SelectContent>
              {banks.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">Add a bank in Banking first.</div>}
              {banks.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-lg text-xs" onClick={go} disabled={busy}>{busy && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Post</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DisposeDialog({ asset, banks, currency, onClose, onDone }: { asset: Asset; banks: BankAcct[]; currency: string; onClose: () => void; onDone: () => void }) {
  const [f, setF] = useState({ disposal_date: todayISO(), proceeds: '0', bank_id: banks[0]?.id || '' });
  const [busy, setBusy] = useState(false);
  const bv = Number(asset.purchase_cost) - Number(asset.accumulated_depreciation);
  const proceeds = parseFloat(f.proceeds) || 0;
  const gainLoss = proceeds - bv;
  async function go() {
    const bank = banks.find(b => b.id === f.bank_id);
    setBusy(true);
    const { error } = await (supabase as any).rpc('acc_dispose_asset', {
      _asset_id: asset.id, _disposal_date: f.disposal_date, _proceeds: proceeds, _bank_account_id: bank?.coa_account_id || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Asset disposed'); onDone();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="text-sm">Dispose asset · {asset.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-[11px]">Date</Label><Input type="date" value={f.disposal_date} onChange={e => setF({...f, disposal_date: e.target.value})} className="h-9 rounded-lg mt-1" /></div>
            <div><Label className="text-[11px]">Proceeds</Label><Input type="number" step="0.01" value={f.proceeds} onChange={e => setF({...f, proceeds: e.target.value})} className="h-9 rounded-lg mt-1" /></div>
          </div>
          {proceeds > 0 && (
            <div>
              <Label className="text-[11px]">Received into bank</Label>
              <Select value={f.bank_id} onValueChange={v => setF({...f, bank_id: v})}>
                <SelectTrigger className="h-9 rounded-lg mt-1"><SelectValue placeholder="Select bank" /></SelectTrigger>
                <SelectContent>{banks.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="rounded-xl bg-background/50 border border-border/30 p-3 text-xs space-y-1">
            <div className="flex justify-between"><span className="text-muted-foreground">Book value</span><span className="tabular-nums">{money(bv, currency)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Proceeds</span><span className="tabular-nums">{money(proceeds, currency)}</span></div>
            <div className={cn("flex justify-between font-semibold", gainLoss >= 0 ? "text-emerald-500" : "text-red-500")}>
              <span>{gainLoss >= 0 ? 'Gain' : 'Loss'}</span><span className="tabular-nums">{money(Math.abs(gainLoss), currency)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="h-8 rounded-lg text-xs" onClick={go} disabled={busy}>{busy && <Loader2 className="h-3 w-3 animate-spin mr-1" />}Post disposal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------- Runs -------- */
function RunsList({ runs, currency, onOpen }: { runs: DeprRun[]; currency: string; onOpen: (r: DeprRun) => void }) {
  if (runs.length === 0) return (
    <div className="rounded-2xl border border-dashed border-border/30 py-16 text-center">
      <TrendingDown className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">No depreciation runs yet</p>
    </div>
  );
  return (
    <div className="rounded-2xl border border-border/30 bg-card/40 overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-background/60 text-muted-foreground uppercase tracking-wider text-[10px]">
          <tr>
            <th className="text-left px-4 py-2.5">Period ending</th>
            <th className="text-right px-3 py-2.5">Total depreciation</th>
            <th className="text-left px-3 py-2.5">Status</th>
            <th className="text-right px-4 py-2.5">Posted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/10">
          {runs.map(r => (
            <tr key={r.id} className="hover:bg-background/40 cursor-pointer" onClick={() => onOpen(r)}>
              <td className="px-4 py-2.5 font-medium">{new Date(r.period_end).toLocaleDateString('en-GB')}</td>
              <td className="px-3 py-2.5 text-right tabular-nums">{money(Number(r.total_amount), currency)}</td>
              <td className="px-3 py-2.5">
                {r.status === 'posted'
                  ? <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-emerald-500/15 text-emerald-500"><Lock className="h-2.5 w-2.5" />Posted</span>
                  : <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground">Draft</span>}
              </td>
              <td className="px-4 py-2.5 text-right text-muted-foreground">{r.posted_at ? new Date(r.posted_at).toLocaleString('en-GB') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RunEditor({ run, assets, currency, onClose, onChanged }: { run: DeprRun; assets: Asset[]; currency: string; onClose: () => void; onChanged: () => Promise<void> }) {
  const [lines, setLines] = useState<DeprLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const map = useMemo(() => Object.fromEntries(assets.map(a => [a.id, a])), [assets]);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('acc_depreciation_lines').select('*').eq('run_id', run.id);
    setLines(data || []);
    setLoading(false);
  }, [run.id]);
  useEffect(() => { load(); }, [load]);

  async function post() {
    setBusy(true);
    const { error } = await (supabase as any).rpc('acc_post_depreciation_run', { _run_id: run.id });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Depreciation posted to ledger');
    onChanged();
  }

  async function removeLine(id: string) {
    if (run.status !== 'draft') return;
    await (supabase as any).from('acc_depreciation_lines').delete().eq('id', id);
    // recalc total
    const { data } = await (supabase as any).from('acc_depreciation_lines').select('amount').eq('run_id', run.id);
    const tot = (data || []).reduce((s: number, r: any) => s + Number(r.amount), 0);
    await (supabase as any).from('acc_depreciation_runs').update({ total_amount: tot }).eq('id', run.id);
    load(); onChanged();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-sm">Depreciation run · {new Date(run.period_end).toLocaleDateString('en-GB')}</DialogTitle>
        </DialogHeader>
        {loading ? <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div> : lines.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No assets due for depreciation this period.</p>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-background/60 text-muted-foreground uppercase tracking-wider text-[10px] sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">Asset</th>
                  <th className="text-right px-2 py-2">Book value before</th>
                  <th className="text-right px-2 py-2">Depreciation</th>
                  <th className="text-right px-2 py-2">Book value after</th>
                  <th className="text-right px-2 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {lines.map(l => (
                  <tr key={l.id}>
                    <td className="px-3 py-1.5 font-medium">{map[l.asset_id]?.name || '—'}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{money(Number(l.book_value_before), currency)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-amber-500 font-semibold">{money(Number(l.amount), currency)}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{money(Number(l.book_value_after), currency)}</td>
                    <td className="px-2 py-1.5 text-right">
                      {run.status === 'draft' && (
                        <button onClick={() => removeLine(l.id)} className="text-muted-foreground hover:text-red-500"><X className="h-3 w-3" /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-background/60 font-semibold">
                <tr>
                  <td className="px-3 py-2 text-[10px] uppercase text-muted-foreground">Total</td>
                  <td></td>
                  <td className="px-2 py-2 text-right tabular-nums text-amber-500">{money(Number(run.total_amount), currency)}</td>
                  <td></td><td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        <DialogFooter className="border-t border-border/20 pt-3">
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs" onClick={onClose}>Close</Button>
          {run.status === 'draft' && lines.length > 0 && (
            <Button size="sm" className="h-8 rounded-lg text-xs gap-1" onClick={post} disabled={busy}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Post to ledger
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
