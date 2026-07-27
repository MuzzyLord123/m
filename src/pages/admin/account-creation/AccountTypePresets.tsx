import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ACCOUNT_TYPES, AccountTypeKey, FEATURES } from './accountTypes';

interface PresetRow {
  account_type: AccountTypeKey;
  visible_features: string[];
  hidden_features: string[];
  suppress_prompts: boolean;
}

export default function AccountTypePresets() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Record<string, PresetRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [tab, setTab] = useState<AccountTypeKey>('business_management');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('account_type_presets' as any).select('*');
      const map: Record<string, PresetRow> = {};
      (data || []).forEach((r: any) => { map[r.account_type] = r; });
      setRows(map);
      setLoading(false);
    })();
  }, []);

  const current = rows[tab];
  const groups = useMemo(() => {
    const g: Record<string, typeof FEATURES> = {};
    FEATURES.forEach(f => { (g[f.group] ||= []).push(f); });
    return g;
  }, []);

  function toggle(feature: string, on: boolean) {
    setRows(prev => {
      const r = { ...(prev[tab] || { account_type: tab, visible_features: [], hidden_features: [], suppress_prompts: false }) };
      const hidden = new Set(r.hidden_features || []);
      if (on) hidden.delete(feature); else hidden.add(feature);
      r.hidden_features = Array.from(hidden);
      return { ...prev, [tab]: r };
    });
  }

  function togglePrompts(on: boolean) {
    setRows(prev => ({ ...prev, [tab]: { ...(prev[tab] as any), suppress_prompts: !on } }));
  }

  async function save() {
    if (!current) return;
    setSaving(tab);
    const { error } = await supabase.from('account_type_presets' as any).upsert({
      account_type: tab,
      visible_features: current.visible_features || [],
      hidden_features: current.hidden_features || [],
      suppress_prompts: current.suppress_prompts,
      updated_at: new Date().toISOString(),
    });
    setSaving(null);
    if (error) return toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
    toast({ title: 'Preset saved', description: `Updated ${ACCOUNT_TYPES.find(t => t.key === tab)?.label}` });
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-4xl">
      <h2 className="font-semibold mb-1">Account Type Presets</h2>
      <p className="text-sm text-muted-foreground mb-4">Control what each type of account sees when they sign in. Turning a feature off hides it from their sidebar and menus.</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {ACCOUNT_TYPES.filter(t => !t.isAdmin).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border hover:border-primary/40'
            }`}
          >{t.label}</button>
        ))}
      </div>

      {current && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3">
            <div>
              <p className="text-sm font-medium">Show upgrade / preview prompts</p>
              <p className="text-xs text-muted-foreground">When off, banners like "check your live preview" and billing nags are hidden.</p>
            </div>
            <Switch checked={!current.suppress_prompts} onCheckedChange={togglePrompts} />
          </div>

          {Object.entries(groups).map(([group, feats]) => (
            <div key={group}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">{group}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {feats.map(f => {
                  const on = !(current.hidden_features || []).includes(f.key);
                  return (
                    <label key={f.key} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2 hover:bg-muted/30">
                      <span className="text-sm">{f.label}</span>
                      <Switch checked={on} onCheckedChange={(v) => toggle(f.key, v)} />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving === tab}>
              {saving === tab ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save preset
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
