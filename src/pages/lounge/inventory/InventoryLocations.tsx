import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MapPin, Plus, Edit, Trash2, Star } from 'lucide-react';

interface Location {
  id: string;
  name: string;
  address?: string;
  manager_name?: string;
  manager_contact?: string;
  is_active: boolean;
  is_default: boolean;
}

export default function InventoryLocations({ settings, onSettingsChange }: {
  settings: any;
  onSettingsChange: () => void;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [multiEnabled, setMultiEnabled] = useState(settings?.multi_location_enabled || false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', manager_name: '', manager_contact: '' });

  useEffect(() => { if (user) load(); }, [user]);
  useEffect(() => { setMultiEnabled(settings?.multi_location_enabled || false); }, [settings]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('inv_locations')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('name');
    setLocations(data || []);
    setLoading(false);
  }

  async function toggleMultiLocation(val: boolean) {
    if (!user) return;
    setMultiEnabled(val);
    await supabase.from('inv_settings').upsert({
      user_id: user.id, multi_location_enabled: val
    }, { onConflict: 'user_id' });

    // Ensure default location exists
    if (val) {
      const hasDefault = locations.some(l => l.is_default);
      if (!hasDefault) {
        await supabase.from('inv_locations').insert({
          user_id: user.id, name: 'Main Warehouse', is_default: true, is_active: true
        });
        load();
      }
    }
    onSettingsChange();
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', address: '', manager_name: '', manager_contact: '' });
    setShowModal(true);
  }

  function openEdit(l: Location) {
    setEditing(l);
    setForm({
      name: l.name, address: l.address || '',
      manager_name: l.manager_name || '', manager_contact: l.manager_contact || ''
    });
    setShowModal(true);
  }

  async function save() {
    if (!user || !form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: form.name.trim(),
        address: form.address || null,
        manager_name: form.manager_name || null,
        manager_contact: form.manager_contact || null,
        is_active: true,
        is_default: locations.length === 0
      };
      if (editing) {
        await supabase.from('inv_locations').update(payload).eq('id', editing.id);
        toast({ title: 'Location updated' });
      } else {
        await supabase.from('inv_locations').insert(payload);
        toast({ title: 'Location added' });
      }
      setShowModal(false);
      load();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function setDefault(id: string) {
    await supabase.from('inv_locations').update({ is_default: false }).eq('user_id', user!.id);
    await supabase.from('inv_locations').update({ is_default: true }).eq('id', id);
    load();
  }

  async function deleteLocation(id: string) {
    await supabase.from('inv_locations').update({ is_active: false }).eq('id', id);
    toast({ title: 'Location removed' });
    load();
  }

  return (
    <div className="space-y-4">
      {/* Multi-location toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
        <div>
          <p className="text-sm font-medium text-foreground">Enable Multiple Locations</p>
          <p className="text-xs text-muted-foreground">Manage stock across warehouses, stores, and vehicles</p>
        </div>
        <Switch checked={multiEnabled} onCheckedChange={toggleMultiLocation} />
      </div>

      {!multiEnabled ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center">
          <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Single location mode</p>
          <p className="text-xs text-muted-foreground/60">All stock tracked under "Main Warehouse"</p>
          <p className="text-xs text-muted-foreground/50 mt-1">Enable multiple locations above to manage warehouses separately</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">{locations.filter(l => l.is_active).length} Location{locations.length !== 1 ? 's' : ''}</p>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={openAdd}>
              <Plus className="w-3.5 h-3.5" />Add Location
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
            </div>
          ) : locations.filter(l => l.is_active).length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <MapPin className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No locations yet</p>
              <Button size="sm" onClick={openAdd} className="mt-3 gap-1.5">
                <Plus className="w-3.5 h-3.5" />Add Location
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {locations.filter(l => l.is_active).map(loc => (
                <div key={loc.id} className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{loc.name}</p>
                        {loc.is_default && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-primary border-primary/50">
                            Default
                          </Badge>
                        )}
                      </div>
                      {loc.address && <p className="text-xs text-muted-foreground truncate">{loc.address}</p>}
                      {loc.manager_name && (
                        <p className="text-xs text-muted-foreground">Manager: {loc.manager_name}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!loc.is_default && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                          onClick={() => setDefault(loc.id)} title="Set as default">
                          <Star className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground"
                        onClick={() => openEdit(loc)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      {!loc.is_default && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70"
                          onClick={() => deleteLocation(loc.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Location' : 'Add Location'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Location Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Main Warehouse, Store Front" className="h-8 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Address</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                placeholder="Physical address" className="h-8 mt-1 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Manager Name</Label>
              <Input value={form.manager_name} onChange={e => setForm(f => ({ ...f, manager_name: e.target.value }))}
                placeholder="Location manager" className="h-8 mt-1 text-xs" />
            </div>
            <div>
              <Label className="text-xs">Manager Contact</Label>
              <Input value={form.manager_contact} onChange={e => setForm(f => ({ ...f, manager_contact: e.target.value }))}
                placeholder="Email or phone" className="h-8 mt-1 text-xs" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1" onClick={save} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
