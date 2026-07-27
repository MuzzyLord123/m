import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, TrendingDown, Package, AlertTriangle, Download } from 'lucide-react';

export default function InventoryReports({ settings }: { settings: any }) {
  const { user } = useAuth();
  const [report, setReport] = useState<'valuation' | 'movements' | 'low-stock'>('valuation');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => { if (user) loadReport(); }, [user, report, dateRange]);

  const currency = settings?.currency || 'USD';
  const fmt = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(v);

  async function loadReport() {
    if (!user) return;
    setLoading(true);
    try {
      if (report === 'valuation') {
        const { data: products } = await supabase
          .from('inv_products')
          .select(`id, name, sku, cost_price, selling_price, unit, inv_categories(name), inv_stock_levels(quantity)`)
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name');

        setData((products || []).map(p => {
          const qty = ((p as any).inv_stock_levels || []).reduce((s: number, l: any) => s + l.quantity, 0);
          return {
            name: p.name, sku: p.sku, unit: p.unit,
            category: (p as any).inv_categories?.name || 'Uncategorised',
            qty, costValue: qty * p.cost_price, sellValue: qty * p.selling_price,
            costPrice: p.cost_price, sellingPrice: p.selling_price
          };
        }));
      } else if (report === 'movements') {
        const since = new Date();
        since.setDate(since.getDate() - Number(dateRange));
        const { data: movements } = await supabase
          .from('inv_stock_movements')
          .select(`*, inv_products(name, sku)`)
          .eq('user_id', user.id)
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false });
        setData(movements || []);
      } else if (report === 'low-stock') {
        const { data: products } = await supabase
          .from('inv_products')
          .select(`id, name, sku, unit, reorder_level, reorder_qty, supplier_name, inv_stock_levels(quantity)`)
          .eq('user_id', user.id)
          .eq('is_active', true);

        const lowStock = (products || []).map(p => {
          const qty = ((p as any).inv_stock_levels || []).reduce((s: number, l: any) => s + l.quantity, 0);
          return { ...p, qty };
        }).filter(p => p.qty <= (p as any).reorder_level).sort((a, b) => a.qty - b.qty);

        setData(lowStock);
      }
    } finally {
      setLoading(false);
    }
  }

  function exportCSV() {
    let csv = '';
    if (report === 'valuation') {
      csv = 'Name,SKU,Category,Qty,Unit,Cost Price,Selling Price,Cost Value,Sell Value\n';
      data.forEach(r => {
        csv += `"${r.name}","${r.sku}","${r.category}",${r.qty},"${r.unit}",${r.costPrice},${r.sellingPrice},${r.costValue},${r.sellValue}\n`;
      });
    } else if (report === 'movements') {
      csv = 'Date,Product,SKU,Type,Qty,Reason,Reference\n';
      data.forEach(r => {
        csv += `"${new Date(r.created_at).toLocaleDateString()}","${r.inv_products?.name}","${r.inv_products?.sku}","${r.movement_type}",${r.quantity},"${r.reason || ''}","${r.reference || ''}"\n`;
      });
    } else {
      csv = 'Name,SKU,Unit,Current Stock,Reorder Level,Reorder Qty,Supplier\n';
      data.forEach(r => {
        csv += `"${r.name}","${r.sku}","${r.unit}",${r.qty},${r.reorder_level},${r.reorder_qty},"${r.supplier_name || ''}"\n`;
      });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  const totalCostValue = report === 'valuation' ? data.reduce((s, r) => s + r.costValue, 0) : 0;
  const totalSellValue = report === 'valuation' ? data.reduce((s, r) => s + r.sellValue, 0) : 0;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <Select value={report} onValueChange={v => setReport(v as any)}>
          <SelectTrigger className="h-8 w-40 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="valuation">Stock Valuation</SelectItem>
            <SelectItem value="movements">Stock Movements</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
          </SelectContent>
        </Select>
        {report === 'movements' && (
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-8 w-28 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs ml-auto" onClick={exportCSV} disabled={data.length === 0}>
          <Download className="w-3.5 h-3.5" />Export CSV
        </Button>
      </div>

      {/* Valuation Summary */}
      {report === 'valuation' && !loading && data.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total Cost Value</p>
            <p className="text-lg font-bold text-foreground">{fmt(totalCostValue)}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Total Sell Value</p>
            <p className="text-lg font-bold text-emerald-500">{fmt(totalSellValue)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No data for this report</p>
        </div>
      ) : report === 'valuation' ? (
        <div className="space-y-1.5">
          <div className="grid grid-cols-5 gap-2 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="col-span-2">Product</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Cost Val</span>
            <span className="text-right">Sell Val</span>
          </div>
          {data.map((r, i) => (
            <div key={i} className="grid grid-cols-5 gap-2 px-3 py-2 rounded-lg border border-border bg-card text-xs">
              <div className="col-span-2">
                <p className="font-medium text-foreground truncate">{r.name}</p>
                <p className="text-muted-foreground">{r.sku}</p>
              </div>
              <p className="text-right text-foreground self-center">{r.qty} {r.unit}</p>
              <p className="text-right text-foreground self-center">{fmt(r.costValue)}</p>
              <p className="text-right text-emerald-500 self-center font-medium">{fmt(r.sellValue)}</p>
            </div>
          ))}
        </div>
      ) : report === 'movements' ? (
        <div className="space-y-1.5">
          {data.map((m, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-card">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                m.movement_type === 'in' ? 'bg-emerald-500' :
                m.movement_type === 'out' ? 'bg-destructive' :
                m.movement_type === 'transfer' ? 'bg-primary' : 'bg-amber-500'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{m.inv_products?.name}</p>
                <p className="text-[10px] text-muted-foreground">{m.reason} · {new Date(m.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-xs font-bold flex-shrink-0 ${
                m.movement_type === 'in' ? 'text-emerald-500' : 'text-destructive'
              }`}>
                {m.movement_type === 'in' ? '+' : '-'}{Math.abs(m.quantity)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {data.map((p, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{p.name}</p>
                <p className="text-[10px] text-muted-foreground">{p.sku} · Reorder at: {p.reorder_level} · Order: {p.reorder_qty}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${p.qty === 0 ? 'text-destructive' : 'text-amber-500'}`}>{p.qty}</p>
                <p className="text-[10px] text-muted-foreground">{p.unit}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
