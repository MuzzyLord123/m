import { useState, useEffect } from 'react';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Phone, Mail, Globe, MapPin,
  Star, Building2, Clock, MessageSquare, Edit3, Trash2, Check,
  Send, TrendingUp, FileText, RefreshCw,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  AvatarID, EmptyState, RelativeTime, StatusBadge, StatusDot, type Tone,
} from '@/components/platform';

/* ─── Types ─── */
interface Lead {
  id: string;
  business_name: string | null;
  personal_name: string | null;
  contact_name: string | null;
  is_personal: boolean | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  location_city: string | null;
  location_postcode: string | null;
  google_rating: number | null;
  review_count: number | null;
  category: string | null;
  source: string | null;
  status: string | null;
  assigned_to: string | null;
  last_contacted_at: string | null;
  tags: any;
  converted_client_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  lead_id: string;
  content: string;
  author_id: string;
  created_at: string;
}

interface StatusHistoryEntry {
  id: string;
  old_status: string | null;
  new_status: string;
  changed_at: string;
  changed_by: string;
}

interface FullScreenLeadViewProps {
  lead: Lead;
  leads: Lead[];
  onBack: () => void;
  onLeadChange: (lead: Lead) => void;
  onUpdate: () => void;
  onDelete?: (id: string) => void;
}

/* Every pipeline status resolves to the platform's muted tone vocabulary —
   same map and labels as LoungeCRM/AdminLeadManagement. */
const STATUS_CONFIG: Record<string, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'neutral' },
  contacted: { label: 'Contacted', tone: 'neutral' },
  engaged: { label: 'Engaged', tone: 'accent' },
  live_preview_wanted: { label: 'Preview wanted', tone: 'attend' },
  converted: { label: 'Converted', tone: 'ok' },
  lost: { label: 'Lost', tone: 'risk' },
  do_not_contact: { label: 'Do not contact', tone: 'neutral' },
};

/* Tone → token classes for the active stage chip. */
const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok', attend: 'text-attend', risk: 'text-risk',
  neutral: 'text-ink-2', accent: 'text-primary',
};
const TONE_BG: Record<Tone, string> = {
  ok: 'bg-ok/10', attend: 'bg-attend/10', risk: 'bg-risk/10',
  neutral: 'bg-foreground/[0.06]', accent: 'bg-primary/12',
};

const PIPELINE_ORDER = ['new', 'contacted', 'engaged', 'live_preview_wanted', 'converted', 'lost', 'do_not_contact'];

/* Compact field recipe for the instrument surface */
const FIELD_SM =
  'w-full rounded-md border border-border/60 bg-foreground/[0.03] px-2 py-1 text-[11px] text-foreground outline-none transition-colors duration-150 focus:border-primary/60 placeholder:text-muted-foreground/60';
const LABEL_SM =
  'font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground';

const iconBtn =
  'flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]';

export function FullScreenLeadView({ lead, leads, onBack, onLeadChange, onUpdate, onDelete }: FullScreenLeadViewProps) {
  const { user } = useAuth();
  const [editedLead, setEditedLead] = useState<Lead>(lead);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const currentIndex = leads.findIndex(l => l.id === lead.id);
  const canGoPrev = currentIndex > 0;
  const canGoNext = currentIndex < leads.length - 1;

  useEffect(() => {
    setEditedLead(lead);
    setEditing(false);
    setNotes([]);
    setStatusHistory([]);
    fetchDetails(lead.id);
  }, [lead.id]);

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && canGoPrev) onLeadChange(leads[currentIndex - 1]);
      if (e.key === 'ArrowRight' && canGoNext) onLeadChange(leads[currentIndex + 1]);
      if (e.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentIndex, canGoPrev, canGoNext]);

  const fetchDetails = async (id: string) => {
    const [notesRes, historyRes] = await Promise.all([
      supabase.from('lead_notes').select('*').eq('lead_id', id).order('created_at', { ascending: false }),
      supabase.from('lead_status_history').select('*').eq('lead_id', id).order('changed_at', { ascending: false }),
    ]);
    if (notesRes.data) setNotes(notesRes.data as Note[]);
    if (historyRes.data) setStatusHistory(historyRes.data as StatusHistoryEntry[]);
  };

  const getDisplayName = (c: Lead) => c.business_name || c.personal_name || c.contact_name || 'Unnamed';
  const statusMeta = (status: string | null | undefined) =>
    STATUS_CONFIG[status || 'new'] || STATUS_CONFIG.new;

  const updateStatus = async (newStatus: string) => {
    if (!user) return;
    await supabase.from('leads').update({ status: newStatus as any }).eq('id', lead.id);
    await supabase.from('lead_status_history').insert({
      lead_id: lead.id,
      old_status: lead.status as any,
      new_status: newStatus as any,
      changed_by: user.id,
    });
    setEditedLead(prev => ({ ...prev, status: newStatus }));
    onUpdate();
    fetchDetails(lead.id);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('leads').update({
      business_name: editedLead.business_name,
      contact_name: editedLead.contact_name,
      email: editedLead.email,
      phone: editedLead.phone,
      website_url: editedLead.website_url,
      category: editedLead.category,
      location_city: editedLead.location_city,
      location_postcode: editedLead.location_postcode,
      updated_at: new Date().toISOString(),
    } as any).eq('id', lead.id);
    setSaving(false);
    if (!error) {
      setEditing(false);
      toast.success('Lead updated');
      onUpdate();
    } else {
      toast.error('Failed to save');
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !user) return;
    setSavingNote(true);
    const { error } = await supabase.from('lead_notes').insert({
      lead_id: lead.id, content: newNote.trim(), author_id: user.id,
    });
    setSavingNote(false);
    if (!error) {
      setNewNote('');
      fetchDetails(lead.id);
      toast.success('Note added');
    }
  };

  const handleDelete = async () => {
    await supabase.from('leads').delete().eq('id', lead.id);
    toast.success('Lead deleted');
    onDelete?.(lead.id);
    onBack();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background text-foreground">
      {/* ── Top bar ── */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border/60 bg-card px-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back" className={iconBtn}>
            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex items-center gap-2">
            <AvatarID name={getDisplayName(lead)} email={lead.email} size="md" />
            <div>
              <span className="text-[12px] font-semibold text-foreground">{getDisplayName(lead)}</span>
              {lead.category && <span className="-mt-0.5 block text-[9px] text-muted-foreground">{lead.category}</span>}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{currentIndex + 1} of {leads.length}</span>
          <button
            onClick={() => canGoPrev && onLeadChange(leads[currentIndex - 1])}
            disabled={!canGoPrev}
            aria-label="Previous lead"
            className={cn(iconBtn, 'disabled:opacity-30')}
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => canGoNext && onLeadChange(leads[currentIndex + 1])}
            disabled={!canGoNext}
            aria-label="Next lead"
            className={cn(iconBtn, 'disabled:opacity-30')}
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="flex h-7 items-center gap-1 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105 disabled:opacity-50">
                <Check className="h-3 w-3" /> {saving ? 'Saving…' : 'Save'}
              </button>
              <button onClick={() => { setEditing(false); setEditedLead(lead); }} className="h-7 rounded-md px-2.5 text-[10px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06]">Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} aria-label="Edit lead" className={iconBtn}>
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button onClick={handleDelete} aria-label="Delete lead" className={iconBtn}>
                <Trash2 className="h-3.5 w-3.5 text-risk" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {isMobile && (
        <div className="flex shrink-0 items-center border-b border-border/60 bg-card">
          {(['details', 'activity'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'h-9 flex-1 text-[11px] font-medium transition-colors duration-150',
                activeTab === tab ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground',
              )}
            >
              {tab === 'details' ? 'Details' : 'Activity'}
            </button>
          ))}
        </div>
      )}
      <div className={cn('flex flex-1 overflow-hidden', isMobile && 'flex-col')}>
        {/* Left: Details */}
        <div className={cn(isMobile && activeTab !== 'details' && 'hidden', 'scrollbar-hide flex-1 space-y-4 overflow-y-auto p-4 sm:space-y-5 sm:p-6')}>
          {/* Pipeline stage */}
          <div className="rounded-[10px] border border-border/60 bg-card p-3">
            <span className={cn(LABEL_SM, 'mb-2 block')}>Pipeline stage</span>
            <div className="scrollbar-hide flex items-center gap-1.5 overflow-x-auto pb-1">
              {PIPELINE_ORDER.map((stage, i) => {
                const sc = STATUS_CONFIG[stage];
                const isActive = (editedLead.status || 'new') === stage;
                const isPast = PIPELINE_ORDER.indexOf(editedLead.status || 'new') > i;
                return (
                  <button
                    key={stage}
                    onClick={() => updateStatus(stage)}
                    className={cn(
                      'flex h-8 min-w-[56px] flex-1 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2 text-[9px] font-medium transition-colors duration-150',
                      isActive
                        ? cn(TONE_BG[sc.tone], TONE_TEXT[sc.tone], 'border-border/60')
                        : isPast
                          ? 'border-transparent bg-foreground/[0.03] text-ink-2'
                          : 'border-transparent bg-sunken text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {isActive && <StatusDot tone={sc.tone} />}
                    {sc.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact info grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[
              { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', value: editedLead.email, field: 'email' },
              { icon: <Phone className="h-3.5 w-3.5" />, label: 'Phone', value: editedLead.phone, field: 'phone' },
              { icon: <Globe className="h-3.5 w-3.5" />, label: 'Website', value: editedLead.website_url, field: 'website_url' },
              { icon: <Building2 className="h-3.5 w-3.5" />, label: 'Category', value: editedLead.category, field: 'category' },
              { icon: <MapPin className="h-3.5 w-3.5" />, label: 'City', value: editedLead.location_city, field: 'location_city' },
              { icon: <Star className="h-3.5 w-3.5" />, label: 'Rating', value: lead.google_rating ? `${lead.google_rating} of 5 (${lead.review_count || 0} reviews)` : null, field: null },
            ].map(item => (
              <div key={item.label} className="rounded-lg border border-border/60 bg-card p-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <span className="text-muted-foreground/70">{item.icon}</span>
                  <span className={LABEL_SM}>{item.label}</span>
                </div>
                {editing && item.field ? (
                  <input
                    value={(editedLead as any)[item.field] || ''}
                    onChange={e => setEditedLead(prev => ({ ...prev, [item.field!]: e.target.value }))}
                    className={FIELD_SM}
                  />
                ) : (
                  <span className="block truncate text-[12px] text-ink-2">
                    {item.value || <span className="text-[10px] text-muted-foreground/50">Not set</span>}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Business name edit */}
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={cn(LABEL_SM, 'mb-1 block')}>Business name</label>
                <input
                  value={editedLead.business_name || ''}
                  onChange={e => setEditedLead(prev => ({ ...prev, business_name: e.target.value }))}
                  className={FIELD_SM}
                />
              </div>
              <div>
                <label className={cn(LABEL_SM, 'mb-1 block')}>Contact name</label>
                <input
                  value={editedLead.contact_name || ''}
                  onChange={e => setEditedLead(prev => ({ ...prev, contact_name: e.target.value }))}
                  className={FIELD_SM}
                />
              </div>
              <div>
                <label className={cn(LABEL_SM, 'mb-1 block')}>Postcode</label>
                <input
                  value={editedLead.location_postcode || ''}
                  onChange={e => setEditedLead(prev => ({ ...prev, location_postcode: e.target.value }))}
                  className={FIELD_SM}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {lead.tags && Array.isArray(lead.tags) && lead.tags.length > 0 && (
            <div className="rounded-[10px] border border-border/60 bg-card p-3">
              <span className={cn(LABEL_SM, 'mb-2 block')}>Tags</span>
              <div className="flex flex-wrap gap-1">
                {(lead.tags as string[]).map((tag, i) => (
                  <span key={i} className="rounded-md border border-border/60 bg-sunken px-2 py-0.5 text-[9px] font-medium text-ink-2">
                    {String(tag)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground/70">
              <Clock className="h-2.5 w-2.5" /> Created {format(new Date(lead.created_at), 'd MMM yyyy')}
            </span>
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground/70">
              <RefreshCw className="h-2.5 w-2.5" /> Updated <RelativeTime date={lead.updated_at} className="text-[9px] text-muted-foreground/70" />
            </span>
            {lead.last_contacted_at && (
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground/70">
                <MessageSquare className="h-2.5 w-2.5" /> Contacted <RelativeTime date={lead.last_contacted_at} className="text-[9px] text-muted-foreground/70" />
              </span>
            )}
          </div>
        </div>

        {/* Right: Activity panel */}
        <div className={cn(
          isMobile ? (activeTab !== 'activity' ? 'hidden' : 'flex-1') : 'w-[340px] border-l border-border/60',
          'flex shrink-0 flex-col bg-sunken',
        )}>
          <div className="flex shrink-0 items-center border-b border-border/60 px-3 pt-2">
            <span className="border-b-2 border-primary px-2 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground">Activity</span>
          </div>

          {/* Note input */}
          <div className="shrink-0 border-b border-border/60 p-3">
            <div className="overflow-hidden rounded-lg border border-border/60 bg-card transition-colors duration-150 focus-within:border-primary/60">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add a note…"
                rows={3}
                className="w-full resize-none bg-transparent p-2.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60"
              />
              <div className="flex items-center justify-end p-1.5 pt-0">
                <button
                  onClick={addNote}
                  disabled={!newNote.trim() || savingNote}
                  className="flex h-6 items-center gap-1 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105 disabled:opacity-30"
                >
                  <Send className="h-3 w-3" />
                  {savingNote ? 'Adding…' : 'Add note'}
                </button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto p-3">
            {notes.map(note => (
              <div key={note.id} className="rounded-lg border border-border/60 bg-card p-3">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <FileText className="h-3 w-3 text-primary" />
                  <span className={LABEL_SM}>Note</span>
                  <RelativeTime date={note.created_at} className="ml-auto text-[9px]" />
                </div>
                <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-ink-2">{note.content}</p>
              </div>
            ))}
            {statusHistory.map(h => (
              <div key={h.id} className="flex items-start gap-2 py-1.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-foreground/[0.06]">
                  <TrendingUp className="h-2.5 w-2.5 text-muted-foreground" />
                </div>
                <div>
                  <span className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
                    Status changed from
                    <StatusBadge tone={statusMeta(h.old_status).tone} label={statusMeta(h.old_status).label} className="text-[10px]" />
                    to
                    <StatusBadge tone={statusMeta(h.new_status).tone} label={statusMeta(h.new_status).label} className="text-[10px]" />
                  </span>
                  <RelativeTime date={h.changed_at} className="mt-0.5 block text-[9px]" />
                </div>
              </div>
            ))}
            {notes.length === 0 && statusHistory.length === 0 && (
              <EmptyState
                compact
                title="No activity yet"
                body="Notes and stage changes will appear here."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
