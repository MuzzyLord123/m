import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, Plus, CheckCircle, AlertTriangle, Search, Save, XCircle } from 'lucide-react';

interface CountSession {
  id: string;
  name: string;
  status: 'draft' | 'in_progress' | 'finalized';
  started_at: string;
  finalized_at?: string;
  notes?: string;
}

interface CountItem {
  id: string;
  count_id: string;
  product_id: string;
  expected_qty: number;
  counted_qty: number | null;
  discrepancy: number;
  product?: { name: string; sku: string; unit: string };
}

export default function InventoryStockCount({ onRefreshDashboard, settings }: {
  onRefreshDashboard: () => void;
  settings: any;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<CountSession[]>([]);
  const [activeSession, setActiveSession] = useState<CountSession | null>(null);
  const [countItems, setCountItems] = useState<CountItem[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('Stock Count ' + new Date().toLocaleDateString());
  const [newNotes, setNewNotes] = useState('');
  const [newLocationId, setNewLocationId] = useState('');
  const [searchSku, setSearchSku] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (user) load(); }, [user]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const [{ data: sess }, { data: prods }, { data: locs }] = await Promise.all([
      supabase.from('inv_stock_counts').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).limit(10),
      supabase.from('inv_products').select('id, name, sku, unit').eq('user_id', user.id).eq('is_active', true),
      supabase.from('inv_locations').select('*').eq('user_id', user.id).eq('is_active', true)
    ]);
    setSessions((sess || []) as CountSession[]);
    setProducts(prods || []);
    setLocations(locs || []);
    if (!newLocationId && locs && locs.length > 0) {
      setNewLocationId(locs.find(l => l.is_default)?.id || locs[0].id);
    }
    setLoading(false);
  }

  async function startSession() {
    if (!user) return;
    setSaving(true);
    try {
      const { data: sess } = await supabase.from('inv_stock_counts').insert({
        user_id: user.id,
        name: newName,
        notes: newNotes || null,
        location_id: newLocationId || null,
        status: 'in_progress'
      }).select().single();

      if (sess) {
        // Load expected quantities from stock levels
        const { data: stockLevels } = await supabase
          .from('inv_stock_levels')
          .select('product_id, quantity')
          .eq('location_id', newLocationId);

        const items = (products || []).map(p => {
          const level = stockLevels?.find(l => l.product_id === p.id);
          return {
            count_id: sess.id,
            product_id: p.id,
            expected_qty: level?.quantity || 0,
            counted_qty: null
          };
        });

        if (items.length > 0) {
          await supabase.from('inv_stock_count_items').insert(items);
        }

        setActiveSession(sess as CountSession);
        setShowNew(false);
        loadItems(sess.id);
        load();
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function loadItems(sessionId: string) {
    const { data } = await supabase
      .from('inv_stock_count_items')
      .select(`*, inv_products(name, sku, unit)`)
      .eq('count_id', sessionId)
      .order('inv_products(name)');
    setCountItems((data || []).map(d => ({
      ...d,
      product: (d as any).inv_products
    })) as CountItem[]);
  }

  async function updateCounted(itemId: string, val: number) {
    setCountItems(prev => prev.map(i => i.id === itemId ? { ...i, counted_qty: val, discrepancy: val - i.expected_qty } : i));
    await supabase.from('inv_stock_count_items').update({ counted_qty: val }).eq('id', itemId);
  }

  async function finalizeSession() {
    if (!activeSession || !user) return;
    setSaving(true);
    try {
      // For each item with a discrepancy, create a movement and update stock
      const discrepancies = countItems.filter(i => i.counted_qty !== null && i.discrepancy !== 0);

      for (const item of discrepancies) {
        const diff = item.discrepancy;
        await supabase.from('inv_stock_movements').insert({
          product_id: item.product_id,
          location_id: activeSession ? (activeSession as any).location_id : null,
          movement_type: 'adjustment',
          quantity: Math.abs(diff),
          reason: 'correction',
          notes: `Stock count: ${activeSession.name}`,
          user_id: user.id
        });

        // Update stock level
        await supabase.from('inv_stock_levels')
          .update({ quantity: item.counted_qty, last_counted_at: new Date().toISOString() })
          .eq('product_id', item.product_id);
      }

      await supabase.from('inv_stock_counts').update({
        status: 'finalized',
        finalized_at: new Date().toISOString()
      }).eq('id', activeSession.id);

      toast({ title: 'Stock count finalized', description: `${discrepancies.length} adjustment(s) applied` });
      setActiveSession(null);
      setCountItems([]);
      load();
      onRefreshDashboard();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  const filteredItems = searchSku
    ? countItems.filter(i =>
        i.product?.name.toLowerCase().includes(searchSku.toLowerCase()) ||
        i.product?.sku.toLowerCase().includes(searchSku.toLowerCase())
      )
    : countItems;

  const countedItems = countItems.filter(i => i.counted_qty !== null).length;
  const discrepancyItems = countItems.filter(i => i.counted_qty !== null && i.discrepancy !== 0).length;

  return (
    <div className="space-y-4">
      {activeSession ? (
        <>
          {/* Active Count Session */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{activeSession.name}</h3>
              <p className="text-xs text-muted-foreground">
                {countedItems}/{countItems.length} counted · {discrepancyItems} discrepancies
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs"
                onClick={() => { setActiveSession(null); setCountItems([]); }}>
                <XCircle className="w-3.5 h-3.5 mr-1" />Exit
              </Button>
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={finalizeSession} disabled={saving}>
                <CheckCircle className="w-3.5 h-3.5" />Finalize
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${countItems.length > 0 ? (countedItems / countItems.length) * 100 : 0}%` }}
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={searchSku}
              onChange={e => setSearchSku(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            {filteredItems.map(item => (
              <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                item.counted_qty === null ? 'border-border bg-card' :
                item.discrepancy === 0 ? 'border-emerald-500/30 bg-emerald-500/5' :
                'border-amber-500/30 bg-amber-500/5'
              }`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.product?.name}</p>
                  <p className="text-xs text-muted-foreground">{item.product?.sku} · Expected: {item.expected_qty}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.counted_qty !== null && item.discrepancy !== 0 && (
                    <Badge variant="outline" className={`text-xs ${
                      item.discrepancy > 0 ? 'text-emerald-500 border-emerald-500/50' : 'text-destructive border-destructive/50'
                    }`}>
                      {item.discrepancy > 0 ? '+' : ''}{item.discrepancy}
                    </Badge>
                  )}
                  <Input
                    type="number"
                    min={0}
                    value={item.counted_qty ?? ''}
                    onChange={e => updateCounted(item.id, Number(e.target.value))}
                    placeholder="Count"
                    className="h-8 w-20 text-sm text-center"
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Stock Count Sessions</p>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setShowNew(true)}>
              <Plus className="w-3.5 h-3.5" />New Count
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <ClipboardList className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No stock counts yet</p>
              <p className="text-xs text-muted-foreground/60 mb-3">Start a count to reconcile your inventory</p>
              <Button size="sm" onClick={() => setShowNew(true)} className="gap-1.5">
                <Plus className="w-3.5 h-3.5" />Start Stock Count
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.started_at).toLocaleDateString()}
                      {s.finalized_at ? ` · Finalized ${new Date(s.finalized_at).toLocaleDateString()}` : ''}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${
                    s.status === 'finalized' ? 'text-emerald-500 border-emerald-500/50' :
                    s.status === 'in_progress' ? 'text-primary border-primary/50' :
                    'text-muted-foreground'
                  }`}>
                    {s.status.replace('_', ' ')}
                  </Badge>
                  {s.status === 'in_progress' && (
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => { setActiveSession(s); loadItems(s.id); }}>
                      Resume
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Stock Count</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Session Name</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} className="h-8 mt-1" />
            </div>
            {locations.length > 0 && (
              <div>
                <Label className="text-xs">Location</Label>
                <Select value={newLocationId} onValueChange={setNewLocationId}>
                  <SelectTrigger className="h-8 mt-1">
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)}
                rows={2} className="mt-1 text-xs resize-none" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button className="flex-1" onClick={startSession} disabled={saving}>
                {saving ? 'Starting...' : 'Start Count'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
