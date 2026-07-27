import { useState, useEffect, useMemo, useCallback } from 'react';
import { decryptPiiFields } from '@/lib/piiDecrypt';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, Users, Phone, Mail, Globe, MapPin, Star,
  Search, Plus, Upload, Download,
  ExternalLink, UserPlus, Check,
  MessageSquare, Clock, X, TrendingUp, Building2,
  Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  RefreshCw, SlidersHorizontal, Maximize2, Loader2,
  List, KanbanSquare, Handshake, LineChart, FileText,
  Edit3, Send, BarChart3, ArrowLeft,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import LeadImportDialog from './LeadImportDialog';
import LeadDetailDialog from './LeadDetailDialog';
import { FullScreenLeadView } from '@/components/crm/FullScreenLeadView';
import { useCRMDeals, type CRMDeal } from '@/hooks/useCRMDeals';
import { DealPipelineBoard } from '@/components/crm/DealPipeline';
import { DealForecast } from '@/components/crm/DealForecast';
import { DealDialog } from '@/components/crm/DealDialog';
import { useProposals, type Proposal } from '@/hooks/useProposals';
import { ProposalList } from '@/components/crm/ProposalList';
import { ProposalEditor } from '@/components/crm/ProposalEditor';
import { useIsMobile } from '@/hooks/use-mobile';

/* ─── Types ─── */
export interface Lead {
  id: string;
  business_name: string | null;
  personal_name: string | null;
  contact_name: string | null;
  is_personal: boolean;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  location_city: string | null;
  location_postcode: string | null;
  google_rating: number | null;
  review_count: number;
  category: string | null;
  source: 'google_maps' | 'manual' | 'csv_import' | 'html_import' | 'json_import';
  status: 'new' | 'contacted' | 'engaged' | 'live_preview_wanted' | 'converted' | 'lost' | 'do_not_contact';
  assigned_to: string | null;
  last_contacted_at: string | null;
  tags: string[];
  converted_client_id: string | null;
  enquiry_id?: string | null;
  enquiry_data?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface LeadNote {
  id: string;
  lead_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
}

export interface AdminUser {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface StatusHistory {
  id: string;
  lead_id: string;
  old_status: string | null;
  new_status: string;
  changed_by: string;
  changed_at: string;
}

type ViewMode = 'list' | 'kanban' | 'deals' | 'forecast' | 'proposals';
type SortOption = 'updated' | 'created' | 'name' | 'status';

/* ─── Constants ─── */
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  contacted: { label: 'Contacted', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
  engaged: { label: 'Engaged', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  live_preview_wanted: { label: 'Preview Wanted', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)' },
  converted: { label: 'Converted', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  lost: { label: 'Lost', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  do_not_contact: { label: 'Do Not Contact', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const SOURCE_CONFIG: Record<string, { label: string; icon: string }> = {
  google_maps: { label: 'Google Maps', icon: '🗺️' },
  manual: { label: 'Manual', icon: '✏️' },
  csv_import: { label: 'CSV Import', icon: '📊' },
  html_import: { label: 'HTML Import', icon: '📄' },
  json_import: { label: 'JSON Import', icon: '📋' },
};

const PIPELINE_ORDER = ['new', 'contacted', 'engaged', 'live_preview_wanted', 'converted', 'lost', 'do_not_contact'];

export const leadStatusConfig = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, { label: v.label, color: `text-[${v.color}]`, bgColor: `bg-[${v.bg}]` }])
) as Record<Lead['status'], { label: string; color: string; bgColor: string }>;

export const sourceLabels: Record<Lead['source'], string> = {
  google_maps: 'Google Maps',
  manual: 'Manual Entry',
  csv_import: 'CSV Import',
  html_import: 'HTML Import',
  json_import: 'JSON Import',
};

const LEADS_PER_PAGE = 50;

export default function AdminLeadManagement() {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Data
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  // UI
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fullScreenLead, setFullScreenLead] = useState<Lead | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [mobileTab, setMobileTab] = useState<'details' | 'activity'>('details');

  // Detail panel
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});

  // Deals
  const { deals, loading: dealsLoading, createDeal, updateDeal, deleteDeal: deleteDealFn, analytics: dealAnalytics } = useCRMDeals();
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<CRMDeal | null>(null);
  const [defaultDealStage, setDefaultDealStage] = useState<string | undefined>();

  // Proposals
  const { proposals, loading: proposalsLoading, createFromTemplate, updateProposal, deleteProposal, sendProposal } = useProposals();
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // Derived
  const selected = useMemo(() => leads.find(l => l.id === selectedId) || null, [leads, selectedId]);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('leads').select('*', { count: 'exact' });

    if (statusFilter) query = query.eq('status', statusFilter as Lead['status']);
    if (searchTerm) {
      query = query.or(`business_name.ilike.%${searchTerm}%,personal_name.ilike.%${searchTerm}%,contact_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,location_city.ilike.%${searchTerm}%`);
    }

    const sortField = sortBy === 'name' ? 'business_name' : sortBy === 'status' ? 'status' : sortBy === 'created' ? 'created_at' : 'updated_at';
    const from = (currentPage - 1) * LEADS_PER_PAGE;
    const to = from + LEADS_PER_PAGE - 1;

    const { data, error, count } = await query
      .order(sortField, { ascending: sortBy === 'name' })
      .range(from, to);

    if (!error) {
      const decrypted = await decryptPiiFields((data || []) as any[], ['phone', 'email']);
      setLeads(decrypted.map((lead: any) => ({ ...lead, tags: (lead.tags as string[] | null) || [] })));
      if (count !== null) setTotalCount(count);
    }
    setLoading(false);
  }, [currentPage, statusFilter, searchTerm, sortBy]);

  // Fetch admin users
  const fetchAdminUsers = useCallback(async () => {
    const { data } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (data) {
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name, email').in('user_id', data.map(r => r.user_id));
      setAdminUsers(profiles || []);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { fetchAdminUsers(); }, [fetchAdminUsers]);
  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchTerm]);

  // Fetch details for selected
  useEffect(() => {
    if (!selectedId) { setNotes([]); setStatusHistory([]); return; }
    const fetchDetails = async () => {
      const [notesRes, historyRes] = await Promise.all([
        supabase.from('lead_notes').select('*').eq('lead_id', selectedId).order('created_at', { ascending: false }),
        supabase.from('lead_status_history').select('*').eq('lead_id', selectedId).order('changed_at', { ascending: false }),
      ]);
      if (notesRes.data) setNotes(notesRes.data as LeadNote[]);
      if (historyRes.data) setStatusHistory(historyRes.data as StatusHistory[]);
    };
    fetchDetails();
  }, [selectedId]);

  // Stats
  const stats = useMemo(() => ({
    total: totalCount,
    new: leads.filter(l => l.status === 'new').length,
    engaged: leads.filter(l => l.status === 'engaged').length,
    converted: leads.filter(l => l.status === 'converted').length,
  }), [leads, totalCount]);

  // Kanban data
  const kanbanData = useMemo(() => {
    const map: Record<string, Lead[]> = {};
    PIPELINE_ORDER.forEach(s => { map[s] = []; });
    leads.forEach(c => {
      const s = c.status || 'new';
      if (map[s]) map[s].push(c);
      else if (map['new']) map['new'].push(c);
    });
    return map;
  }, [leads]);

  // Pagination
  const totalPages = Math.ceil(totalCount / LEADS_PER_PAGE);

  // Helpers
  const getDisplayName = (c: Lead) => c.business_name || c.personal_name || c.contact_name || 'Unnamed';
  const getInitials = (c: Lead) => getDisplayName(c).split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

  // Actions
  const updateStatus = async (id: string, newStatus: string) => {
    const contact = leads.find(c => c.id === id);
    if (!contact || !user) return;
    await supabase.from('leads').update({ status: newStatus as any }).eq('id', id);
    await supabase.from('lead_status_history').insert({
      lead_id: id, old_status: contact.status as any, new_status: newStatus as any, changed_by: user.id,
    });
    setLeads(prev => prev.map(c => c.id === id ? { ...c, status: newStatus as Lead['status'] } : c));
    if (selectedId === id) {
      const { data } = await supabase.from('lead_status_history').select('*').eq('lead_id', id).order('changed_at', { ascending: false });
      if (data) setStatusHistory(data as StatusHistory[]);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !selectedId || !user) return;
    setSavingNote(true);
    const { error } = await supabase.from('lead_notes').insert({ lead_id: selectedId, content: newNote.trim(), author_id: user.id });
    if (!error) {
      setNewNote('');
      const { data } = await supabase.from('lead_notes').select('*').eq('lead_id', selectedId).order('created_at', { ascending: false });
      if (data) setNotes(data as LeadNote[]);
      toast.success('Note added');
    }
    setSavingNote(false);
  };

  const deleteContact = async (id: string) => {
    await supabase.from('leads').delete().eq('id', id);
    setLeads(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast.success('Lead deleted');
  };

  const saveEdit = async () => {
    if (!selectedId) return;
    const { error } = await supabase.from('leads').update({
      business_name: editForm.business_name, contact_name: editForm.contact_name,
      email: editForm.email, phone: editForm.phone, website_url: editForm.website_url,
      category: editForm.category, location_city: editForm.location_city,
      updated_at: new Date().toISOString(),
    } as any).eq('id', selectedId);
    if (!error) {
      setLeads(prev => prev.map(c => c.id === selectedId ? { ...c, ...editForm } : c));
      setEditingContact(false);
      toast.success('Lead updated');
    }
  };

  // CSV Export
  const exportCSV = () => {
    const headers = ['business_name', 'personal_name', 'contact_name', 'email', 'phone', 'website_url', 'category', 'location_city', 'location_postcode', 'status', 'source', 'google_rating', 'review_count', 'created_at', 'updated_at'];
    const rows = leads.map(c => headers.map(h => {
      const val = (c as any)[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${leads.length} leads`);
  };

  // Mobile: when selecting a contact on mobile, show detail
  const handleSelectContact = (id: string) => {
    setSelectedId(id);
    setEditingContact(false);
    setMobileTab('details');
  };

  // Mobile detail/activity content (shared between mobile and desktop)
  const renderContactDetail = () => {
    if (!selected) return null;
    const sc = STATUS_CONFIG[selected.status || 'new'] || STATUS_CONFIG.new;
    return (
      <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shrink-0"
              style={{ backgroundColor: sc.bg, color: sc.color }}
            >
              {getInitials(selected)}
            </div>
            <div className="min-w-0">
              {editingContact ? (
                <input
                  value={editForm.business_name || editForm.personal_name || ''}
                  onChange={e => setEditForm(f => ({ ...f, business_name: e.target.value }))}
                  className="bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 text-[13px] sm:text-[14px] font-semibold text-white outline-none focus:border-[#0073E6] w-full"
                />
              ) : (
                <h2 className="text-[14px] sm:text-[16px] font-semibold text-white truncate">{getDisplayName(selected)}</h2>
              )}
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  className="text-[9px] font-medium border px-1.5 py-0"
                  style={{ backgroundColor: sc.bg, color: sc.color, borderColor: `${sc.color}30` }}
                >
                  {sc.label}
                </Badge>
                {selected.source && (
                  <span className="text-[9px] text-[#666]">
                    {(SOURCE_CONFIG[selected.source] || { icon: '📋', label: selected.source }).icon}{' '}
                    {(SOURCE_CONFIG[selected.source] || { label: selected.source }).label}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {editingContact ? (
              <>
                <button onClick={saveEdit} className="h-7 px-3 rounded-md text-[10px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors flex items-center gap-1">
                  <Check className="h-3 w-3" /> Save
                </button>
                <button onClick={() => setEditingContact(false)} className="h-7 px-2.5 rounded-md text-[10px] font-medium text-[#888] hover:bg-[#333] transition-colors">
                  Cancel
                </button>
              </>
            ) : (
              <>
                {!isMobile && (
                  <button onClick={() => setFullScreenLead(selected)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors" title="Open full screen">
                    <Maximize2 className="h-3.5 w-3.5 text-[#0073E6]" />
                  </button>
                )}
                <button onClick={() => { setEditingContact(true); setEditForm(selected); }} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors">
                  <Edit3 className="h-3.5 w-3.5 text-[#888]" />
                </button>
                <button onClick={() => deleteContact(selected.id)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors">
                  <Trash2 className="h-3.5 w-3.5 text-[#ef4444]" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pipeline Stage */}
        <div className="rounded-xl p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
          <span className="text-[9px] font-medium text-[#666] uppercase tracking-wider block mb-2">Pipeline Stage</span>
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_ORDER.map((stage, i) => {
              const stc = STATUS_CONFIG[stage];
              const isActive = selected.status === stage;
              const isPast = PIPELINE_ORDER.indexOf(selected.status || 'new') > i;
              return (
                <button
                  key={stage}
                  onClick={() => updateStatus(selected.id, stage)}
                  className="h-7 px-2.5 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  style={{
                    backgroundColor: isActive ? stc.bg : isPast ? `${stc.color}08` : '#222',
                    color: isActive ? stc.color : isPast ? `${stc.color}80` : '#888',
                    border: isActive ? `1px solid ${stc.color}40` : '1px solid transparent',
                  }}
                >
                  {isActive && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stc.color }} />}
                  {stc.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact Info Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {[
            { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', value: selected.email, field: 'email' },
            { icon: <Phone className="h-3.5 w-3.5" />, label: 'Phone', value: selected.phone, field: 'phone' },
            { icon: <Globe className="h-3.5 w-3.5" />, label: 'Website', value: selected.website_url, field: 'website_url' },
            { icon: <Building2 className="h-3.5 w-3.5" />, label: 'Category', value: selected.category, field: 'category' },
            { icon: <MapPin className="h-3.5 w-3.5" />, label: 'Location', value: [selected.location_city, selected.location_postcode].filter(Boolean).join(', '), field: 'location_city' },
            { icon: <Star className="h-3.5 w-3.5" />, label: 'Rating', value: selected.google_rating ? `${selected.google_rating} ★ (${selected.review_count || 0} reviews)` : null, field: null },
          ].map(item => (
            <div key={item.label} className="rounded-lg p-2.5" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[#555]">{item.icon}</span>
                <span className="text-[9px] text-[#666] font-medium uppercase tracking-wider">{item.label}</span>
              </div>
              {editingContact && item.field ? (
                <input
                  value={(editForm as any)[item.field] || ''}
                  onChange={e => setEditForm(f => ({ ...f, [item.field!]: e.target.value }))}
                  className="bg-[#252525] border border-[#333] rounded px-2 py-1 text-[11px] text-white outline-none w-full focus:border-[#0073E6]"
                />
              ) : (
                <span className="text-[11px] text-[#ccc] block truncate">
                  {item.value || <span className="text-[#444] italic">Not set</span>}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Tags */}
        {selected.tags && Array.isArray(selected.tags) && selected.tags.length > 0 && (
          <div className="rounded-xl p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <span className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-2">Tags</span>
            <div className="flex flex-wrap gap-1">
              {(selected.tags as string[]).map((tag, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md text-[9px] font-medium bg-[#252525] text-[#aaa] border border-[#333]">
                  {String(tag)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex items-center gap-3 sm:gap-4 pt-2 flex-wrap">
          <span className="text-[9px] text-[#444] flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" /> Created {format(new Date(selected.created_at), 'dd MMM yyyy')}
          </span>
          <span className="text-[9px] text-[#444] flex items-center gap-1">
            <RefreshCw className="h-2.5 w-2.5" /> Updated {formatDistanceToNow(new Date(selected.updated_at), { addSuffix: true })}
          </span>
          {selected.last_contacted_at && (
            <span className="text-[9px] text-[#444] flex items-center gap-1">
              <MessageSquare className="h-2.5 w-2.5" /> Contacted {formatDistanceToNow(new Date(selected.last_contacted_at), { addSuffix: true })}
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderActivityPanel = () => {
    if (!selected) return null;
    return (
      <div className="flex flex-col h-full">
        {!isMobile && (
          <div className="flex items-center gap-0 px-3 pt-2 shrink-0" style={{ borderBottom: '1px solid #222' }}>
            <span className="text-[10px] font-semibold text-white pb-2 border-b-2 border-[#0073E6] px-2">Activity</span>
          </div>
        )}

        {/* Note input */}
        <div className="p-3 shrink-0" style={{ borderBottom: '1px solid #222' }}>
          <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Add a note…"
              rows={2}
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
    );
  };

  /* ─── Render ─── */
  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden lg:rounded-xl lg:border lg:border-[#2a2a2a]"
      style={{ backgroundColor: '#111', color: '#e0e0e0', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}
    >
      {/* ── Top Bar ── */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 shrink-0 lg:rounded-t-xl" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        {/* Left: Title + Stats */}
        <div className="flex items-center gap-2 mr-auto">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-[#0073E6]" />
            <span className="text-[11px] font-semibold text-[#ccc] tracking-wide">CRM</span>
          </div>
          <div className="w-[1px] h-4 bg-[#333]" />
          <div className="hidden lg:flex items-center gap-1.5">
            {[
              { label: 'Total', value: stats.total, color: '#888' },
              { label: 'New', value: stats.new, color: '#60a5fa' },
              { label: 'Engaged', value: stats.engaged, color: '#34d399' },
              { label: 'Converted', value: stats.converted, color: '#22c55e' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ backgroundColor: '#252525', border: '1px solid #2a2a2a' }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[9px] font-medium" style={{ color: '#888' }}>{s.label}</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Center: View toggle */}
        <div className="flex items-center gap-0.5 sm:gap-1 rounded-lg p-0.5 overflow-x-auto scrollbar-hide" style={{ backgroundColor: '#252525', border: '1px solid #2a2a2a' }}>
          {[
            { key: 'list' as ViewMode, icon: <List className="h-3 w-3" />, label: 'Contacts' },
            { key: 'kanban' as ViewMode, icon: <KanbanSquare className="h-3 w-3" />, label: 'Pipeline' },
            { key: 'deals' as ViewMode, icon: <Handshake className="h-3 w-3" />, label: 'Deals' },
            { key: 'forecast' as ViewMode, icon: <LineChart className="h-3 w-3" />, label: 'Forecast' },
            { key: 'proposals' as ViewMode, icon: <FileText className="h-3 w-3" />, label: 'Proposals' },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => { setViewMode(v.key); if (isMobile) setSelectedId(null); }}
              className={`h-6 px-1.5 sm:px-2.5 flex items-center gap-1 rounded-md text-[10px] font-medium transition-all shrink-0 ${
                viewMode === v.key
                  ? 'bg-[#0073E6] text-white shadow-sm shadow-blue-500/20'
                  : 'text-[#888] hover:text-[#ccc] hover:bg-[#333]'
              }`}
            >
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button onClick={exportCSV} className="hidden sm:flex h-7 px-2 items-center gap-1 rounded-md text-[11px] font-medium text-[#888] hover:text-[#ccc] hover:bg-[#333] transition-colors">
            <Download className="h-3.5 w-3.5" /> <span className="hidden xl:inline">Export</span>
          </button>
          <button onClick={() => setShowImportDialog(true)} className="hidden sm:flex h-7 px-2 items-center gap-1 rounded-md text-[11px] font-medium text-[#888] hover:text-[#ccc] hover:bg-[#333] transition-colors">
            <Upload className="h-3.5 w-3.5" /> <span className="hidden xl:inline">Import</span>
          </button>
          <button onClick={() => { setSelectedLead(null); setShowDetailDialog(true); }} className="h-7 px-2 sm:px-3 flex items-center gap-1 sm:gap-1.5 rounded-md text-[11px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors whitespace-nowrap">
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add Contact</span>
          </button>
          <div className="hidden sm:block w-[1px] h-4 bg-[#333]" />
          <button onClick={fetchLeads} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors">
            <RefreshCw className="h-3.5 w-3.5 text-[#666]" />
          </button>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={`h-7 px-2 flex items-center gap-1 rounded-md text-[11px] font-medium transition-colors ${showFilters ? 'bg-[#0073E6]/20 text-[#60a5fa]' : 'text-[#888] hover:text-[#ccc] hover:bg-[#333]'}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile stats row */}
      <div className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 overflow-x-auto scrollbar-hide shrink-0" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        {[
          { label: 'Total', value: stats.total, color: '#888' },
          { label: 'New', value: stats.new, color: '#60a5fa' },
          { label: 'Engaged', value: stats.engaged, color: '#34d399' },
          { label: 'Converted', value: stats.converted, color: '#22c55e' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1 px-2 py-0.5 rounded-md shrink-0" style={{ backgroundColor: '#252525', border: '1px solid #2a2a2a' }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-[9px] font-medium" style={{ color: '#888' }}>{s.label}</span>
            <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.value.toLocaleString()}</span>
          </div>
        ))}
      </div>

      {/* ── Filter Bar ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden shrink-0"
            style={{ backgroundColor: '#161616', borderBottom: '1px solid #2a2a2a' }}
          >
            <div className="flex items-center gap-3 px-4 py-2 overflow-x-auto scrollbar-hide">
              <span className="text-[10px] font-medium text-[#666] uppercase tracking-wider shrink-0">Status:</span>
              <div className="flex items-center gap-1 flex-nowrap">
                <button
                  onClick={() => setStatusFilter(null)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0 ${!statusFilter ? 'bg-[#333] text-white' : 'text-[#777] hover:text-white hover:bg-[#2a2a2a]'}`}
                >All</button>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                    className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors shrink-0"
                    style={{
                      backgroundColor: statusFilter === key ? cfg.bg : 'transparent',
                      color: statusFilter === key ? cfg.color : '#777',
                      border: statusFilter === key ? `1px solid ${cfg.color}30` : '1px solid transparent',
                    }}
                  >{cfg.label}</button>
                ))}
              </div>
              {statusFilter && (
                <button onClick={() => setStatusFilter(null)} className="ml-auto text-[10px] text-[#ef4444] hover:text-[#f87171] shrink-0">
                  Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Content ── */}
      {viewMode === 'deals' ? (
        <div className="flex-1 flex flex-col min-h-0">
          <DealPipelineBoard
            deals={deals}
            onUpdateDeal={(id, updates) => updateDeal(id, updates)}
            onSelectDeal={(deal) => { setSelectedDeal(deal); setDealDialogOpen(true); }}
            onCreateDeal={(stage) => { setSelectedDeal(null); setDefaultDealStage(stage); setDealDialogOpen(true); }}
          />
        </div>
      ) : viewMode === 'forecast' ? (
        <div className="flex-1 flex flex-col min-h-0">
          <DealForecast analytics={dealAnalytics} deals={deals} />
        </div>
      ) : viewMode === 'proposals' ? (
        <div className="flex-1 flex flex-col min-h-0">
          {selectedProposal ? (
            <ProposalEditor
              proposal={selectedProposal}
              onUpdate={(id, updates) => { updateProposal(id, updates); setSelectedProposal(prev => prev ? { ...prev, ...updates } : null); }}
              onSend={(id) => { sendProposal(id); setSelectedProposal(prev => prev ? { ...prev, status: 'sent', sent_at: new Date().toISOString() } : null); }}
              onDelete={(id) => { deleteProposal(id); setSelectedProposal(null); }}
              onBack={() => setSelectedProposal(null)}
            />
          ) : (
            <ProposalList
              proposals={proposals}
              loading={proposalsLoading}
              onSelect={setSelectedProposal}
              onCreateFromTemplate={async (type) => {
                const p = await createFromTemplate(type);
                if (p) setSelectedProposal(p);
              }}
              onDelete={deleteProposal}
              onSend={sendProposal}
            />
          )}
        </div>
      ) : isMobile ? (
        /* ── Mobile: Single-view with back navigation ── */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {selectedId && selected ? (
            <>
              {/* Mobile back header */}
              <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
                <button onClick={() => setSelectedId(null)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors">
                  <ArrowLeft className="h-4 w-4 text-[#999]" />
                </button>
                <span className="text-[12px] font-semibold text-[#ddd] truncate flex-1">{getDisplayName(selected)}</span>
              </div>
              {/* Mobile tabs: Details / Activity */}
              <div className="flex items-center shrink-0" style={{ backgroundColor: '#161616', borderBottom: '1px solid #2a2a2a' }}>
                {(['details', 'activity'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setMobileTab(tab)}
                    className={`flex-1 h-9 text-[11px] font-semibold transition-colors ${
                      mobileTab === tab
                        ? 'text-white border-b-2 border-[#0073E6]'
                        : 'text-[#666]'
                    }`}
                  >
                    {tab === 'details' ? 'Details' : 'Activity'}
                  </button>
                ))}
              </div>
              <div
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{ backgroundColor: '#111', WebkitOverflowScrolling: 'touch' }}
              >
                {mobileTab === 'details' ? renderContactDetail() : renderActivityPanel()}
              </div>
            </>
          ) : (
            /* Mobile contact list */
            <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: '#141414' }}>
              {/* Search */}
              <div className="p-2 shrink-0" style={{ borderBottom: '1px solid #222' }}>
                <div className="flex items-center gap-1.5 px-2 py-2 rounded-lg" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                  <Search className="h-4 w-4 text-[#555]" />
                  <input
                    type="text"
                    placeholder="Search contacts…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-transparent text-[12px] text-[#ccc] placeholder:text-[#555] outline-none flex-1"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="hover:text-white text-[#555]">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <span className="text-[10px] text-[#555] font-medium">{totalCount} contacts</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-[10px] text-[#666] outline-none cursor-pointer"
                  >
                    <option value="updated">Last Updated</option>
                    <option value="created">Created</option>
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>

              <div
                className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-4 w-4 animate-spin text-[#555]" />
                  </div>
                ) : leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-[#555]">
                    <Users className="h-5 w-5 mb-1.5" />
                    <span className="text-[10px]">No contacts found</span>
                  </div>
                ) : (
                  leads.map(c => {
                    const sc = STATUS_CONFIG[c.status || 'new'] || STATUS_CONFIG.new;
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSelectContact(c.id)}
                        className="w-full text-left px-3 py-3 transition-colors border-b border-[#1a1a1a] hover:bg-[#1a1a1a] active:bg-[#222]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                            style={{ backgroundColor: sc.bg, color: sc.color }}
                          >
                            {getInitials(c)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[12px] font-medium text-[#ddd] truncate">{getDisplayName(c)}</span>
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sc.color }} />
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {c.category && <span className="text-[10px] text-[#666] truncate">{c.category}</span>}
                              <span className="text-[9px] text-[#444] ml-auto tabular-nums">
                                {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-[#444] shrink-0" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="h-10 flex items-center justify-between px-3 shrink-0" style={{ borderTop: '1px solid #222' }}>
                  <span className="text-[10px] text-[#555] tabular-nums">Page {currentPage}/{totalPages}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#333] disabled:opacity-30"><ChevronLeft className="h-4 w-4 text-[#999]" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-7 w-7 flex items-center justify-center rounded hover:bg-[#333] disabled:opacity-30"><ChevronRight className="h-4 w-4 text-[#999]" /></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Desktop: 3-panel ResizablePanelGroup ── */
        <ResizablePanelGroup direction="horizontal" className="flex-1">
          {/* ── Left: Contact List ── */}
          <ResizablePanel defaultSize={28} minSize={20} maxSize={40}>
            <div className="h-full flex flex-col" style={{ backgroundColor: '#141414' }}>
              {/* Search */}
              <div className="p-2 shrink-0" style={{ borderBottom: '1px solid #222' }}>
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                  <Search className="h-3.5 w-3.5 text-[#555]" />
                  <input
                    type="text"
                    placeholder="Search contacts…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="bg-transparent text-[11px] text-[#ccc] placeholder:text-[#555] outline-none flex-1"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="hover:text-white text-[#555]">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1.5 px-1">
                  <span className="text-[9px] text-[#555] font-medium">{totalCount} contacts</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="bg-transparent text-[9px] text-[#666] outline-none cursor-pointer"
                  >
                    <option value="updated">Last Updated</option>
                    <option value="created">Created</option>
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-4 w-4 animate-spin text-[#555]" />
                  </div>
                ) : leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-[#555]">
                    <Users className="h-5 w-5 mb-1.5" />
                    <span className="text-[10px]">No contacts found</span>
                  </div>
                ) : viewMode === 'list' ? (
                  leads.map(c => {
                    const sc = STATUS_CONFIG[c.status || 'new'] || STATUS_CONFIG.new;
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedId(c.id); setEditingContact(false); }}
                        onDoubleClick={() => setFullScreenLead(c)}
                        className={`w-full text-left px-3 py-2.5 transition-colors border-b ${
                          selectedId === c.id
                            ? 'bg-[#1e1e1e] border-[#333]'
                            : 'border-[#1a1a1a] hover:bg-[#1a1a1a]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                            style={{ backgroundColor: sc.bg, color: sc.color }}
                          >
                            {getInitials(c)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium text-[#ddd] truncate">{getDisplayName(c)}</span>
                              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sc.color }} title={sc.label} />
                            </div>
                            {c.category && <span className="text-[9px] text-[#666] truncate block">{c.category}</span>}
                            <div className="flex items-center gap-2 mt-0.5">
                              {c.email && <Mail className="h-2.5 w-2.5 text-[#555]" />}
                              {c.phone && <Phone className="h-2.5 w-2.5 text-[#555]" />}
                              {c.location_city && (
                                <span className="text-[8px] text-[#555] flex items-center gap-0.5">
                                  <MapPin className="h-2 w-2" />{c.location_city}
                                </span>
                              )}
                              <span className="text-[8px] text-[#444] ml-auto tabular-nums">
                                {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  /* Kanban mini-view in left panel */
                  <div className="p-2 space-y-3">
                    {PIPELINE_ORDER.map(stage => {
                      const sc = STATUS_CONFIG[stage];
                      const items = kanbanData[stage] || [];
                      return (
                        <div key={stage}>
                          <div className="flex items-center gap-1.5 mb-1.5 px-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />
                            <span className="text-[10px] font-semibold" style={{ color: sc.color }}>{sc.label}</span>
                            <span className="text-[9px] text-[#555] ml-auto">{items.length}</span>
                          </div>
                          <div className="space-y-0.5">
                            {items.slice(0, 5).map(c => (
                              <button
                                key={c.id}
                                onClick={() => { setSelectedId(c.id); setEditingContact(false); }}
                                className={`w-full text-left px-2 py-1.5 rounded-md text-[10px] transition-colors ${
                                  selectedId === c.id ? 'bg-[#252525] text-white' : 'text-[#999] hover:bg-[#1e1e1e] hover:text-[#ccc]'
                                }`}
                              >
                                {getDisplayName(c)}
                              </button>
                            ))}
                            {items.length > 5 && (
                              <span className="text-[9px] text-[#555] px-2">+{items.length - 5} more</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="h-9 flex items-center justify-between px-3 shrink-0" style={{ borderTop: '1px solid #222' }}>
                  <span className="text-[9px] text-[#555] tabular-nums">Pg {currentPage}/{totalPages}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#333] disabled:opacity-30"><ChevronsLeft className="h-3 w-3 text-[#999]" /></button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#333] disabled:opacity-30"><ChevronLeft className="h-3 w-3 text-[#999]" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#333] disabled:opacity-30"><ChevronRight className="h-3 w-3 text-[#999]" /></button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#333] disabled:opacity-30"><ChevronsRight className="h-3 w-3 text-[#999]" /></button>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-[1px] bg-[#2a2a2a] hover:bg-[#0073E6] transition-colors" />

          {/* ── Center: Contact Detail ── */}
          <ResizablePanel defaultSize={44}>
            <div className="h-full overflow-y-auto scrollbar-hide" style={{ backgroundColor: '#111' }}>
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-full text-[#555]">
                  <Target className="h-10 w-10 mb-3 text-[#333]" />
                  <span className="text-[13px] font-medium text-[#555]">Select a contact</span>
                  <span className="text-[10px] text-[#444] mt-1">Choose from the list to view details</span>
                </div>
              ) : renderContactDetail()}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-[1px] bg-[#2a2a2a] hover:bg-[#0073E6] transition-colors" />

          {/* ── Right: Activity & Notes ── */}
          <ResizablePanel defaultSize={28} minSize={18} maxSize={35}>
            <div className="h-full flex flex-col" style={{ backgroundColor: '#141414' }}>
              {selected ? renderActivityPanel() : (
                <div className="flex flex-col items-center justify-center h-full text-[#555]">
                  <BarChart3 className="h-8 w-8 mb-2 text-[#333]" />
                  <span className="text-[10px]">Select a contact to view activity</span>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      {/* Deal Dialog */}
      <DealDialog
        open={dealDialogOpen}
        onClose={() => { setDealDialogOpen(false); setSelectedDeal(null); setDefaultDealStage(undefined); }}
        deal={selectedDeal}
        defaultStage={defaultDealStage}
        onSave={async (data) => {
          if (selectedDeal) await updateDeal(selectedDeal.id, data);
          else await createDeal(data);
        }}
        onDelete={deleteDealFn}
      />

      {/* Import Dialog */}
      <LeadImportDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={fetchLeads}
      />

      {/* Detail Dialog (for Add) */}
      <LeadDetailDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        lead={selectedLead}
        leads={leads}
        adminUsers={adminUsers}
        onLeadChange={(lead) => setSelectedLead(lead)}
        onUpdate={fetchLeads}
      />

      {/* Full-screen Lead View */}
      <AnimatePresence>
        {fullScreenLead && (
          <FullScreenLeadView
            lead={fullScreenLead as any}
            leads={leads as any}
            onBack={() => setFullScreenLead(null)}
            onLeadChange={(l) => setFullScreenLead(l as unknown as Lead)}
            onUpdate={fetchLeads}
            onDelete={(id) => { setFullScreenLead(null); fetchLeads(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
