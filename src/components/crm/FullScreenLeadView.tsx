import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Phone, Mail, Globe, MapPin,
  Star, Building2, Clock, MessageSquare, Edit3, Trash2, Check, X,
  Send, Loader2, TrendingUp, FileText, RefreshCw, ExternalLink,
  UserPlus, Save, Tag, History, Target,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  contacted: { label: 'Contacted', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  engaged: { label: 'Engaged', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  live_preview_wanted: { label: 'Preview Wanted', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  converted: { label: 'Converted', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  lost: { label: 'Lost', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  do_not_contact: { label: 'Do Not Contact', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const PIPELINE_ORDER = ['new', 'contacted', 'engaged', 'live_preview_wanted', 'converted', 'lost', 'do_not_contact'];

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
  const getInitials = (c: Lead) => getDisplayName(c).split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  const sc = STATUS_CONFIG[lead.status || 'new'] || STATUS_CONFIG.new;

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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: '#111', color: '#e0e0e0', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}
    >
      {/* ── Top Bar ── */}
      <div className="h-11 flex items-center justify-between px-3 shrink-0" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors">
            <ArrowLeft className="h-3.5 w-3.5 text-[#999]" />
          </button>
          <div className="w-[1px] h-4 bg-[#333]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-bold" style={{ backgroundColor: sc.bg, color: sc.color }}>
              {getInitials(lead)}
            </div>
            <div>
              <span className="text-[12px] font-semibold text-[#ddd]">{getDisplayName(lead)}</span>
              {lead.category && <span className="text-[9px] text-[#666] block -mt-0.5">{lead.category}</span>}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#666] tabular-nums">{currentIndex + 1} of {leads.length}</span>
          <button
            onClick={() => canGoPrev && onLeadChange(leads[currentIndex - 1])}
            disabled={!canGoPrev}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4 text-[#999]" />
          </button>
          <button
            onClick={() => canGoNext && onLeadChange(leads[currentIndex + 1])}
            disabled={!canGoNext}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4 text-[#999]" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {editing ? (
            <>
              <button onClick={handleSave} disabled={saving} className="h-7 px-3 rounded-md text-[10px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] flex items-center gap-1 disabled:opacity-50">
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
              </button>
              <button onClick={() => { setEditing(false); setEditedLead(lead); }} className="h-7 px-2.5 rounded-md text-[10px] font-medium text-[#888] hover:bg-[#333]">Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333]">
                <Edit3 className="h-3.5 w-3.5 text-[#888]" />
              </button>
              <button onClick={handleDelete} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333]">
                <Trash2 className="h-3.5 w-3.5 text-[#ef4444]" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {isMobile && (
        <div className="flex items-center shrink-0" style={{ backgroundColor: '#161616', borderBottom: '1px solid #2a2a2a' }}>
          {(['details', 'activity'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 h-9 text-[11px] font-semibold transition-colors ${
                activeTab === tab ? 'text-white border-b-2 border-[#0073E6]' : 'text-[#666]'
              }`}
            >
              {tab === 'details' ? 'Details' : 'Activity'}
            </button>
          ))}
        </div>
      )}
      <div className={`flex-1 flex overflow-hidden ${isMobile ? 'flex-col' : ''}`}>
        {/* Left: Details */}
        <div className={`${isMobile && activeTab !== 'details' ? 'hidden' : ''} flex-1 overflow-y-auto scrollbar-hide p-4 sm:p-6 space-y-4 sm:space-y-5`}>
          {/* Pipeline Stage */}
          <div className="rounded-xl p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
            <span className="text-[9px] font-medium text-[#666] uppercase tracking-wider block mb-2">Pipeline Stage</span>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-1">
              {PIPELINE_ORDER.map((stage, i) => {
                const stageConfig = STATUS_CONFIG[stage];
                const isActive = (editedLead.status || 'new') === stage;
                const isPast = PIPELINE_ORDER.indexOf(editedLead.status || 'new') > i;
                return (
                  <button
                    key={stage}
                    onClick={() => updateStatus(stage)}
                    className="flex-1 min-w-[56px] h-8 rounded-md text-[8px] sm:text-[9px] font-medium transition-all flex items-center justify-center gap-1 shrink-0 whitespace-nowrap"
                    style={{
                      backgroundColor: isActive ? stageConfig.bg : isPast ? `${stageConfig.color}08` : '#222',
                      color: isActive ? stageConfig.color : isPast ? `${stageConfig.color}80` : '#555',
                      border: isActive ? `1px solid ${stageConfig.color}40` : '1px solid transparent',
                    }}
                  >
                    {isActive && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stageConfig.color }} />}
                    {stageConfig.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact Info Grid */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {[
              { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', value: editedLead.email, field: 'email' },
              { icon: <Phone className="h-3.5 w-3.5" />, label: 'Phone', value: editedLead.phone, field: 'phone' },
              { icon: <Globe className="h-3.5 w-3.5" />, label: 'Website', value: editedLead.website_url, field: 'website_url' },
              { icon: <Building2 className="h-3.5 w-3.5" />, label: 'Category', value: editedLead.category, field: 'category' },
              { icon: <MapPin className="h-3.5 w-3.5" />, label: 'City', value: editedLead.location_city, field: 'location_city' },
              { icon: <Star className="h-3.5 w-3.5" />, label: 'Rating', value: lead.google_rating ? `${lead.google_rating} ★ (${lead.review_count || 0})` : null, field: null },
            ].map(item => (
              <div key={item.label} className="rounded-lg p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-[#555]">{item.icon}</span>
                  <span className="text-[9px] text-[#666] font-medium uppercase tracking-wider">{item.label}</span>
                </div>
                {editing && item.field ? (
                  <input
                    value={(editedLead as any)[item.field] || ''}
                    onChange={e => setEditedLead(prev => ({ ...prev, [item.field!]: e.target.value }))}
                    className="bg-[#252525] border border-[#333] rounded px-2 py-1 text-[11px] text-white outline-none w-full focus:border-[#0073E6]"
                  />
                ) : (
                  <span className="text-[12px] text-[#ccc] block truncate">
                    {item.value || <span className="text-[#444] italic text-[10px]">Not set</span>}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Business Name edit */}
          {editing && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Business Name</label>
                <input
                  value={editedLead.business_name || ''}
                  onChange={e => setEditedLead(prev => ({ ...prev, business_name: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#0073E6]"
                />
              </div>
              <div>
                <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Contact Name</label>
                <input
                  value={editedLead.contact_name || ''}
                  onChange={e => setEditedLead(prev => ({ ...prev, contact_name: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#0073E6]"
                />
              </div>
              <div>
                <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Postcode</label>
                <input
                  value={editedLead.location_postcode || ''}
                  onChange={e => setEditedLead(prev => ({ ...prev, location_postcode: e.target.value }))}
                  className="w-full bg-[#1a1a1a] border border-[#333] rounded-md px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#0073E6]"
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {lead.tags && Array.isArray(lead.tags) && lead.tags.length > 0 && (
            <div className="rounded-xl p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
              <span className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-2">Tags</span>
              <div className="flex flex-wrap gap-1">
                {(lead.tags as string[]).map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-[#252525] text-[#aaa] border border-[#333]">
                    {String(tag)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="flex items-center gap-4 pt-2">
            <span className="text-[9px] text-[#444] flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" /> Created {format(new Date(lead.created_at), 'dd MMM yyyy')}
            </span>
            <span className="text-[9px] text-[#444] flex items-center gap-1">
              <RefreshCw className="h-2.5 w-2.5" /> Updated {formatDistanceToNow(new Date(lead.updated_at), { addSuffix: true })}
            </span>
            {lead.last_contacted_at && (
              <span className="text-[9px] text-[#444] flex items-center gap-1">
                <MessageSquare className="h-2.5 w-2.5" /> Contacted {formatDistanceToNow(new Date(lead.last_contacted_at), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Right: Activity Panel */}
        <div className={`${isMobile ? (activeTab !== 'activity' ? 'hidden' : 'flex-1') : 'w-[340px]'} flex flex-col shrink-0`} style={{ backgroundColor: '#141414', borderLeft: isMobile ? 'none' : '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-0 px-3 pt-2 shrink-0" style={{ borderBottom: '1px solid #222' }}>
            <span className="text-[10px] font-semibold text-white pb-2 border-b-2 border-[#0073E6] px-2">Activity</span>
          </div>

          {/* Note input */}
          <div className="p-3 shrink-0" style={{ borderBottom: '1px solid #222' }}>
            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add a note…"
                rows={3}
                className="w-full bg-transparent text-[11px] text-[#ccc] placeholder:text-[#555] outline-none p-2.5 resize-none"
              />
              <div className="flex items-center justify-end p-1.5 pt-0">
                <button
                  onClick={addNote}
                  disabled={!newNote.trim() || savingNote}
                  className="h-6 px-3 rounded-md text-[10px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors disabled:opacity-30 flex items-center gap-1"
                >
                  {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Add Note
                </button>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3">
            {notes.map(note => (
              <div key={note.id} className="rounded-lg p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FileText className="h-3 w-3 text-[#0073E6]" />
                  <span className="text-[9px] text-[#666] font-medium">Note</span>
                  <span className="text-[8px] text-[#444] ml-auto tabular-nums">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[11px] text-[#bbb] leading-relaxed whitespace-pre-wrap">{note.content}</p>
              </div>
            ))}
            {statusHistory.map(h => (
              <div key={h.id} className="flex items-start gap-2 py-1.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#252525' }}>
                  <TrendingUp className="h-2.5 w-2.5 text-[#666]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#888]">
                    Status changed from{' '}
                    <span style={{ color: (STATUS_CONFIG[h.old_status || 'new'] || STATUS_CONFIG.new).color }}>
                      {(STATUS_CONFIG[h.old_status || 'new'] || STATUS_CONFIG.new).label}
                    </span>
                    {' → '}
                    <span style={{ color: (STATUS_CONFIG[h.new_status] || STATUS_CONFIG.new).color }}>
                      {(STATUS_CONFIG[h.new_status] || STATUS_CONFIG.new).label}
                    </span>
                  </span>
                  <span className="text-[8px] text-[#444] block mt-0.5 tabular-nums">
                    {formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
            {notes.length === 0 && statusHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-[#555]">
                <MessageSquare className="h-5 w-5 mb-1.5 text-[#333]" />
                <span className="text-[10px]">No activity yet</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}