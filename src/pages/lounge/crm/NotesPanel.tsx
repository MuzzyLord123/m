import { useCallback, useEffect, useState } from 'react';
import { Loader2, StickyNote, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { EntityType } from './useCRMData';

const FIELD_FOR: Record<EntityType, 'company_id' | 'contact_id' | 'opportunity_id'> = {
  company: 'company_id', contact: 'contact_id', opportunity: 'opportunity_id',
};

interface Note {
  id: string;
  body: string | null;
  subject: string | null;
  occurred_at: string;
  owner_id: string | null;
}

export function NotesPanel({ entityType, entityId, orgId }: { entityType: EntityType; entityId: string; orgId: string | null }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const field = FIELD_FOR[entityType];
    const { data } = await supabase
      .from('crm_communications')
      .select('id, body, subject, occurred_at, owner_id')
      .eq('kind', 'note' as any)
      .eq(field, entityId)
      .order('occurred_at', { ascending: false })
      .limit(100);
    setNotes((data as any) || []);
    setLoading(false);
  }, [entityType, entityId]);

  useEffect(() => { load(); }, [load]);

  async function addNote() {
    if (!draft.trim()) return;
    if (!orgId) { toast({ title: 'Missing organisation context', variant: 'destructive' }); return; }
    setSaving(true);
    const field = FIELD_FOR[entityType];
    const { error } = await supabase.from('crm_communications').insert({
      org_id: orgId,
      owner_id: user?.id ?? null,
      kind: 'note' as any,
      direction: 'internal' as any,
      body: draft.trim(),
      occurred_at: new Date().toISOString(),
      [field]: entityId,
    } as any);
    setSaving(false);
    if (error) { toast({ title: 'Failed to save note', description: error.message, variant: 'destructive' }); return; }
    setDraft('');
    load();
  }

  async function removeNote(id: string) {
    const { error } = await supabase.from('crm_communications').delete().eq('id', id);
    if (error) { toast({ title: 'Delete failed', description: error.message, variant: 'destructive' }); return; }
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <StickyNote className="h-3 w-3" /> Notes
      </label>
      <div className="mt-1.5 space-y-2">
        <Textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={2}
          placeholder="Add a note about this lead…"
          className="text-sm resize-none"
        />
        <div className="flex justify-end">
          <Button size="sm" className="h-7 text-xs" onClick={addNote} disabled={saving || !draft.trim()}>
            {saving && <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />}
            Add note
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-3"><Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" /></div>
        ) : notes.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No notes yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {notes.map(n => (
              <li key={n.id} className="group rounded-md border border-border bg-background/50 p-2.5">
                <p className="text-sm whitespace-pre-wrap text-foreground/90">{n.body}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(n.occurred_at), { addSuffix: true })}</span>
                  <button
                    onClick={() => removeNote(n.id)}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    title="Delete note"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
