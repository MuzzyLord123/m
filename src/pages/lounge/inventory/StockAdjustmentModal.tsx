import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const REASONS = [
  { value: 'purchase', label: 'Purchase / Stock In' },
  { value: 'sale', label: 'Sale / Stock Out' },
  { value: 'return', label: 'Customer Return' },
  { value: 'damaged', label: 'Damaged / Written Off' },
  { value: 'lost', label: 'Lost / Theft' },
  { value: 'correction', label: 'Stock Correction' },
];

export default function StockAdjustmentModal({ product, locations, onClose, onSaved }: {
  product: any;
  locations: any[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [locationId, setLocationId] = useState(locations.find(l => l.is_default)?.id || locations[0]?.id || '');
  const [reason, setReason] = useState('purchase');
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [currentStock, setCurrentStock] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (locationId) loadCurrentStock();
  }, [locationId]);

  async function loadCurrentStock() {
    const { data } = await supabase
      .from('inv_stock_levels')
      .select('quantity')
      .eq('product_id', product.id)
      .eq('location_id', locationId)
      .maybeSingle();
    setCurrentStock(data?.quantity || 0);
  }

  const isOutbound = ['sale', 'damaged', 'lost'].includes(reason);
  const movementType = isOutbound ? 'out' : 'in';
  const newStock = isOutbound ? currentStock - qty : currentStock + qty;

  async function save() {
    if (!user || qty <= 0) return;
    setSaving(true);
    try {
      // Upsert stock level
      const { data: existing } = await supabase
        .from('inv_stock_levels')
        .select('id')
        .eq('product_id', product.id)
        .eq('location_id', locationId)
        .maybeSingle();

      if (existing) {
        await supabase.from('inv_stock_levels')
          .update({ quantity: Math.max(0, newStock), updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase.from('inv_stock_levels').insert({
          product_id: product.id,
          location_id: locationId,
          quantity: Math.max(0, newStock)
        });
      }

      // Record movement
      await supabase.from('inv_stock_movements').insert({
        product_id: product.id,
        location_id: locationId,
        movement_type: movementType,
        quantity: qty,
        reason,
        reference: reference || null,
        notes: notes || null,
        user_id: user.id
      });

      toast({ title: 'Stock adjusted successfully' });
      onSaved();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust Stock — {product.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          {locations.length > 1 && (
            <div>
              <Label className="text-xs">Location</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="h-8 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="text-xs">Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-8 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Quantity</Label>
            <Input type="number" min={1} value={qty}
              onChange={e => setQty(Math.max(1, Number(e.target.value)))}
              className="h-8 mt-1" />
          </div>
          <div>
            <Label className="text-xs">Reference # (optional)</Label>
            <Input value={reference} onChange={e => setReference(e.target.value)}
              placeholder="Invoice / PO number" className="h-8 mt-1 text-xs" />
          </div>
          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} className="mt-1 text-xs resize-none" placeholder="Optional notes..." />
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current stock</span>
              <span className="font-medium">{currentStock} {product.unit}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{isOutbound ? 'Removing' : 'Adding'}</span>
              <span className={`font-medium ${isOutbound ? 'text-destructive' : 'text-emerald-500'}`}>
                {isOutbound ? '-' : '+'}{qty}
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-1 mt-1">
              <span className="text-muted-foreground font-medium">New stock</span>
              <span className={`font-bold ${newStock <= 0 ? 'text-destructive' : 'text-foreground'}`}>
                {Math.max(0, newStock)} {product.unit}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={save} disabled={saving || qty <= 0}>
              {saving ? 'Saving...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
