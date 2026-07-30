import { useCallback, useEffect, useState } from 'react';
import { Loader2, StickyNote, Trash2, GitBranch } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SkeletonLedger, StatusDot, statusTone } from '@/components/platform';
import type { EntityType, LifecycleStage } from './useCRMData';

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

/** A stage move, read from the same history the timeline uses. */
interface StageEvent {
  id: string;
  to_stage_id: string | null;
  from_stage_id: string | null;
  note: string | null;
  created_at: string;
}

type Entry =
  | { kind: 'note'; at: string; note: Note }
  | { kind: 'stage'; at: string; stage: StageEvent };

export function NotesPanel({ entityType, entityId, orgId, stages = [] }: {
  entityType: EntityType;
  entityId: string;
  orgId: string | null;
  /** Lifecycle stages, so stage moves can be named in the activity list. */
  stages?: LifecycleStage[];
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [stageEvents, setStageEvents] = useState<StageEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  // Notes and stage moves are loaded together: a lead's written record
  // and how it progressed belong in one stream, and both also appear on
  // the record timeline (crm_timeline reads the same two sources).
  const load = useCallback(async () => {
    setLoading(true);
    const field = FIELD_FOR[entityType];
    const [noteRes, stageRes] = await Promise.all([
      supabase
        .from('crm_communications')
        .select('id, body, subject, occurred_at, owner_id')
        .eq('kind', 'note' as any)
        .eq(field, entityId)
        .order('occurred_at', { ascending: false })
        .limit(100),
      supabase
        .from('crm_lifecycle_history' as any)
        .select('id, to_stage_id, from_stage_id, note, created_at')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);
    setNotes((noteRes.data as any) || []);
    setStageEvents((stageRes.data as any) || []);
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

  // One stream, newest first.
  const entries: Entry[] = [
    ...notes.map(n => ({ kind: 'note' as const, at: n.occurred_at, note: n })),
    ...stageEvents.map(s => ({ kind: 'stage' as const, at: s.created_at, stage: s })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const stageName = (id: string | null) => (id ? stages.find(s => s.id === id)?.name ?? null : null);
  const stageSlug = (id: string | null) => (id ? stages.find(s => s.id === id)?.slug ?? null : null);

  return (
    <div>
      <label className="font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em] flex items-center gap-1.5">
        <StickyNote className="h-3 w-3" /> Notes and activity
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
          <SkeletonLedger rows={2} className="rounded-md border border-border/60" />
        ) : entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing logged yet. Notes you add and stage changes both appear here.</p>
        ) : (
          <ul className="space-y-1.5">
            {entries.map(e => {
              if (e.kind === 'note') {
                const n = e.note;
                return (
                  <li key={`n-${n.id}`} className="group rounded-md border border-border/60 bg-background/50 p-2.5">
                    <p className="text-sm whitespace-pre-wrap text-ink-2">{n.body}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{formatDistanceToNow(new Date(n.occurred_at), { addSuffix: true })}</span>
                      <button
                        onClick={() => removeNote(n.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                        title="Delete note"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </li>
                );
              }
              const s = e.stage;
              const to = stageName(s.to_stage_id);
              const from = stageName(s.from_stage_id);
              const slug = stageSlug(s.to_stage_id);
              return (
                <li key={`s-${s.id}`} className="rounded-md border border-dashed border-border/60 p-2.5">
                  <p className="flex items-center gap-2 text-sm text-ink-2">
                    <GitBranch className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span>
                      Stage moved{from ? ` from ${from}` : ''} to{' '}
                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        {slug && <StatusDot tone={statusTone(slug)} />}
                        {to ?? 'no stage'}
                      </span>
                    </span>
                  </p>
                  {s.note && <p className="mt-1 whitespace-pre-wrap pl-5 text-[13px] text-muted-foreground">{s.note}</p>}
                  <span className="mt-1.5 block pl-5 font-mono text-[10px] tabular-nums text-muted-foreground">
                    {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
