import { useState, useEffect, useMemo, useCallback } from 'react';
import { decryptPiiFields } from '@/lib/piiDecrypt';
import {
  Target, Users, Phone, Mail, Globe, MapPin, Star,
  Search, Plus, Upload, Download,
  Check,
  MessageSquare, Clock, X, TrendingUp, Building2,
  Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  RefreshCw, SlidersHorizontal, Maximize2,
  List, KanbanSquare, Handshake, LineChart, FileText,
  Edit3, Send, BarChart3, ArrowLeft,
  Map as MapIcon, PenLine, FileCode, FileJson,
  type LucideIcon,
} from 'lucide-react';
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
import { StatusDot, StatusBadge, SkeletonLedger, type Tone } from '@/components/platform';
import { cn } from '@/lib/utils';

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
/* Every pipeline status resolves to the platform's muted tone vocabulary —
   the old per-status hex rainbow is gone. Accent marks the one stage in
   motion; attend marks awaiting-client. */
const STATUS_CONFIG: Record<string, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'neutral' },
  contacted: { label: 'Contacted', tone: 'neutral' },
  engaged: { label: 'Engaged', tone: 'accent' },
  live_preview_wanted: { label: 'Preview wanted', tone: 'attend' },
  converted: { label: 'Converted', tone: 'ok' },
  lost: { label: 'Lost', tone: 'risk' },
  do_not_contact: { label: 'Do not contact', tone: 'neutral' },
};

/* Tone → token classes for tinted initials chips and stage buttons. */
const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok', attend: 'text-attend', risk: 'text-risk',
  neutral: 'text-ink-2', accent: 'text-primary',
};
const TONE_BG: Record<Tone, string> = {
  ok: 'bg-ok/10', attend: 'bg-attend/10', risk: 'bg-risk/10',
  neutral: 'bg-foreground/[0.06]', accent: 'bg-primary/12',
};

const SOURCE_CONFIG: Record<string, { label: string }> = {
  google_maps: { label: 'Google Maps' },
  manual: { label: 'Manual' },
  csv_import: { label: 'CSV import' },
  html_import: { label: 'HTML import' },
  json_import: { label: 'JSON import' },
};

const SOURCE_ICONS: Record<string, LucideIcon> = {
  google_maps: MapIcon,
  manual: PenLine,
  csv_import: BarChart3,
  html_import: FileCode,
  json_import: FileJson,
};

const PIPELINE_ORDER = ['new', 'contacted', 'engaged', 'live_preview_wanted', 'converted', 'lost', 'do_not_contact'];

const statusMeta = (status: string | null | undefined) =>
  STATUS_CONFIG[status || 'new'] || STATUS_CONFIG.new;

/* Static token classes — compiled by Tailwind, consumed by LeadDetailDialog. */
export const leadStatusConfig = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [
    k,
    { label: v.label, color: TONE_TEXT[v.tone], bgColor: cn(TONE_BG[v.tone], TONE_TEXT[v.tone]) },
  ])
) as Record<Lead['status'], { label: string; color: string; bgColor: string }>;

export const sourceLabels: Record<Lead['source'], string> = {
  google_maps: 'Google Maps',
  manual: 'Manual entry',
  csv_import: 'CSV import',
  html_import: 'HTML import',
  json_import: 'JSON import',
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

  /* ─── Small shared bits ─── */
  const statPills = [
    { label: 'Total', value: stats.total, tone: 'neutral' as Tone },
    { label: 'New', value: stats.new, tone: 'neutral' as Tone },
    { label: 'Engaged', value: stats.engaged, tone: 'accent' as Tone },
    { label: 'Converted', value: stats.converted, tone: 'ok' as Tone },
  ];

  const statPill = (s: { label: string; value: number; tone: Tone }) => (
    <div key={s.label} className="flex shrink-0 items-center gap-1.5 rounded-md border border-border/60 bg-sunken px-2 py-0.5">
      <StatusDot tone={s.tone} />
      <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{s.label}</span>
      <span className="text-[10px] font-semibold tabular-nums text-foreground">{s.value.toLocaleString()}</span>
    </div>
  );

  const sourceLine = (source: string) => {
    const Icon = SOURCE_ICONS[source] || FileText;
    const label = (SOURCE_CONFIG[source] || { label: source }).label;
    return (
      <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
        <Icon className="h-2.5 w-2.5" aria-hidden /> {label}
      </span>
    );
  };

  // Mobile detail/activity content (shared between mobile and desktop)
  const renderContactDetail = () => {
    if (!selected) return null;
    const sc = statusMeta(selected.status);
    return (
      <div className="space-y-4 p-4 sm:space-y-5 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-xs font-semibold sm:h-12 sm:w-12 sm:text-sm', TONE_BG[sc.tone], TONE_TEXT[sc.tone])}>
              {getInitials(selected)}
            </div>
            <div className="min-w-0">
              {editingContact ? (
                <input
                  value={editForm.business_name || editForm.personal_name || ''}
                  onChange={e => setEditForm(f => ({ ...f, business_name: e.target.value }))}
                  className="w-full rounded border border-border/60 bg-foreground/[0.03] px-2 py-1 text-[13px] font-semibold text-foreground outline-none transition-colors duration-150 focus:border-primary/60 sm:text-[14px]"
                />
              ) : (
                <h2 className="truncate text-[14px] font-semibold text-foreground sm:text-[16px]">{getDisplayName(selected)}</h2>
              )}
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge tone={sc.tone} label={sc.label} className="text-[10px]" />
                {selected.source && sourceLine(selected.source)}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {editingContact ? (
              <>
                <button onClick={saveEdit} className="flex h-7 items-center gap-1 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105">
                  <Check className="h-3 w-3" /> Save
                </button>
                <button onClick={() => setEditingContact(false)} className="h-7 rounded-md px-2.5 text-[10px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06]">
                  Cancel
                </button>
              </>
            ) : (
              <>
                {!isMobile && (
                  <button onClick={() => setFullScreenLead(selected)} className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]" title="Open full screen">
                    <Maximize2 className="h-3.5 w-3.5 text-primary" />
                  </button>
                )}
                <button onClick={() => { setEditingContact(true); setEditForm(selected); }} aria-label="Edit lead" className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
                  <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={() => deleteContact(selected.id)} aria-label="Delete lead" className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
                  <Trash2 className="h-3.5 w-3.5 text-risk" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Pipeline Stage */}
        <div className="rounded-[10px] border border-border/60 bg-card p-3">
          <span className="mb-2 block font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Pipeline stage</span>
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_ORDER.map((stage, i) => {
              const stc = STATUS_CONFIG[stage];
              const isActive = selected.status === stage;
              const isPast = PIPELINE_ORDER.indexOf(selected.status || 'new') > i;
              return (
                <button
                  key={stage}
                  onClick={() => updateStatus(selected.id, stage)}
                  className={cn(
                    'flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-[10px] font-medium transition-colors duration-150',
                    isActive
                      ? cn(TONE_BG[stc.tone], TONE_TEXT[stc.tone], 'border-border/60')
                      : isPast
                        ? 'border-transparent bg-foreground/[0.03] text-ink-2'
                        : 'border-transparent bg-sunken text-muted-foreground hover:text-foreground',
                  )}
                >
                  {isActive && <StatusDot tone={stc.tone} />}
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
            { icon: <Star className="h-3.5 w-3.5" />, label: 'Rating', value: selected.google_rating ? `${selected.google_rating} of 5 (${selected.review_count || 0} reviews)` : null, field: null },
          ].map(item => (
            <div key={item.label} className="rounded-lg border border-border/60 bg-card p-2.5">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-muted-foreground/70">{item.icon}</span>
                <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{item.label}</span>
              </div>
              {editingContact && item.field ? (
                <input
                  value={(editForm as any)[item.field] || ''}
                  onChange={e => setEditForm(f => ({ ...f, [item.field!]: e.target.value }))}
                  className="w-full rounded border border-border/60 bg-foreground/[0.03] px-2 py-1 text-[11px] text-foreground outline-none transition-colors duration-150 focus:border-primary/60"
                />
              ) : (
                <span className="block truncate text-[11px] text-ink-2">
                  {item.value || <span className="text-muted-foreground/50">Not set</span>}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Tags */}
        {selected.tags && Array.isArray(selected.tags) && selected.tags.length > 0 && (
          <div className="rounded-[10px] border border-border/60 bg-card p-3">
            <span className="mb-2 block font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Tags</span>
            <div className="flex flex-wrap gap-1">
              {(selected.tags as string[]).map((tag, i) => (
                <span key={i} className="rounded-md border border-border/60 bg-sunken px-2 py-0.5 text-[9px] font-medium text-ink-2">
                  {String(tag)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="flex flex-wrap items-center gap-3 pt-2 sm:gap-4">
          <span className="flex items-center gap-1 font-mono text-[9px] tabular-nums text-muted-foreground/70">
            <Clock className="h-2.5 w-2.5" /> Created {format(new Date(selected.created_at), 'dd MMM yyyy')}
          </span>
          <span className="flex items-center gap-1 font-mono text-[9px] tabular-nums text-muted-foreground/70">
            <RefreshCw className="h-2.5 w-2.5" /> Updated {formatDistanceToNow(new Date(selected.updated_at), { addSuffix: true })}
          </span>
          {selected.last_contacted_at && (
            <span className="flex items-center gap-1 font-mono text-[9px] tabular-nums text-muted-foreground/70">
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
      <div className="flex h-full flex-col">
        {!isMobile && (
          <div className="flex shrink-0 items-center gap-0 border-b border-border/60 px-3 pt-2">
            <span className="border-b-2 border-primary px-2 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground">Activity</span>
          </div>
        )}

        {/* Note input */}
        <div className="shrink-0 border-b border-border/60 p-3">
          <div className="overflow-hidden rounded-lg border border-border/60 bg-foreground/[0.02]">
            <textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Add a note…"
              rows={2}
              className="w-full resize-none bg-transparent p-2.5 text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center justify-end p-1.5 pt-0">
              <button
                onClick={addNote}
                disabled={!newNote.trim() || savingNote}
                className="flex h-6 items-center gap-1 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105 disabled:opacity-30"
              >
                <Send className="h-3 w-3" />
                {savingNote ? 'Adding' : 'Add note'}
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
                <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Note</span>
                <span className="ml-auto text-[8px] tabular-nums text-muted-foreground/70">
                  {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-ink-2">{note.content}</p>
            </div>
          ))}
          {statusHistory.map(h => (
            <div key={h.id} className="flex items-start gap-2 py-1.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sunken">
                <TrendingUp className="h-2.5 w-2.5 text-muted-foreground" />
              </div>
              <div>
                <span className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                  Status changed from
                  <StatusBadge tone={statusMeta(h.old_status).tone} label={statusMeta(h.old_status).label} className="text-[10px]" />
                  to
                  <StatusBadge tone={statusMeta(h.new_status).tone} label={statusMeta(h.new_status).label} className="text-[10px]" />
                </span>
                <span className="mt-0.5 block text-[8px] tabular-nums text-muted-foreground/70">
                  {formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          ))}
          {notes.length === 0 && statusHistory.length === 0 && (
            <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="mb-1.5 h-5 w-5 text-muted-foreground/40" />
              <span className="text-[10px]">No activity yet</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ─── Render ─── */
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background text-[12px] text-foreground lg:rounded-[10px] lg:border lg:border-border/60">
      {/* ── Top Bar ── */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border/60 bg-card px-3 py-2 lg:rounded-t-[10px]">
        {/* Left: Title + Stats */}
        <div className="mr-auto flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold tracking-wide text-foreground">CRM</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="hidden items-center gap-1.5 lg:flex">
            {statPills.map(statPill)}
          </div>
        </div>

        {/* Center: View toggle */}
        <div className="scrollbar-hide flex items-center gap-0.5 overflow-x-auto rounded-lg border border-border/60 bg-sunken p-0.5 sm:gap-1">
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
              className={cn(
                'flex h-6 shrink-0 items-center gap-1 rounded-md px-1.5 text-[10px] font-medium transition-colors duration-150 sm:px-2.5',
                viewMode === v.key
                  ? 'bg-card text-foreground'
                  : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
              )}
            >
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5">
          <button onClick={exportCSV} className="hidden h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06] hover:text-foreground sm:flex">
            <Download className="h-3.5 w-3.5" /> <span className="hidden xl:inline">Export</span>
          </button>
          <button onClick={() => setShowImportDialog(true)} className="hidden h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06] hover:text-foreground sm:flex">
            <Upload className="h-3.5 w-3.5" /> <span className="hidden xl:inline">Import</span>
          </button>
          <button onClick={() => { setSelectedLead(null); setShowDetailDialog(true); }} className="flex h-7 items-center gap-1 whitespace-nowrap rounded-md bg-primary px-2 text-[11px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105 sm:gap-1.5 sm:px-3">
            <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add contact</span>
          </button>
          <div className="hidden h-4 w-px bg-border sm:block" />
          <button onClick={fetchLeads} title="Refresh" className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setShowFilters(f => !f)}
            aria-label="Toggle filters"
            className={cn(
              'flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-medium transition-colors duration-150',
              showFilters ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground',
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile stats row */}
      <div className="scrollbar-hide flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border/60 bg-card px-3 py-1.5 lg:hidden">
        {statPills.map(statPill)}
      </div>

      {/* ── Filter Bar ── */}
      {showFilters && (
        <div className="shrink-0 border-b border-border/60 bg-sunken">
          <div className="scrollbar-hide flex items-center gap-3 overflow-x-auto px-4 py-2">
            <span className="shrink-0 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Status</span>
            <div className="flex flex-nowrap items-center gap-1">
              <button
                onClick={() => setStatusFilter(null)}
                className={cn(
                  'shrink-0 rounded px-2 py-0.5 text-[10px] font-medium transition-colors duration-150',
                  !statusFilter ? 'bg-foreground/[0.08] text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                )}
              >All</button>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                  className={cn(
                    'flex shrink-0 items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-medium transition-colors duration-150',
                    statusFilter === key
                      ? cn(TONE_BG[cfg.tone], TONE_TEXT[cfg.tone], 'border-border/60')
                      : 'border-transparent text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                  )}
                ><StatusDot tone={cfg.tone} />{cfg.label}</button>
              ))}
            </div>
            {statusFilter && (
              <button onClick={() => setStatusFilter(null)} className="ml-auto shrink-0 text-[10px] text-risk transition-colors duration-150 hover:text-risk/80">
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      {viewMode === 'deals' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <DealPipelineBoard
            deals={deals}
            onUpdateDeal={(id, updates) => updateDeal(id, updates)}
            onSelectDeal={(deal) => { setSelectedDeal(deal); setDealDialogOpen(true); }}
            onCreateDeal={(stage) => { setSelectedDeal(null); setDefaultDealStage(stage); setDealDialogOpen(true); }}
          />
        </div>
      ) : viewMode === 'forecast' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <DealForecast analytics={dealAnalytics} deals={deals} />
        </div>
      ) : viewMode === 'proposals' ? (
        <div className="flex min-h-0 flex-1 flex-col">
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
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {selectedId && selected ? (
            <>
              {/* Mobile back header */}
              <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-card px-3 py-2">
                <button onClick={() => setSelectedId(null)} aria-label="Back to list" className="flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <span className="flex-1 truncate text-[12px] font-semibold text-foreground">{getDisplayName(selected)}</span>
              </div>
              {/* Mobile tabs: Details / Activity */}
              <div className="flex shrink-0 items-center border-b border-border/60 bg-sunken">
                {(['details', 'activity'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setMobileTab(tab)}
                    className={cn(
                      'h-9 flex-1 text-[11px] font-semibold transition-colors duration-150',
                      mobileTab === tab
                        ? 'border-b-2 border-primary text-foreground'
                        : 'text-muted-foreground',
                    )}
                  >
                    {tab === 'details' ? 'Details' : 'Activity'}
                  </button>
                ))}
              </div>
              <div
                className="flex-1 overflow-y-auto overscroll-contain bg-background"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {mobileTab === 'details' ? renderContactDetail() : renderActivityPanel()}
              </div>
            </>
          ) : (
            /* Mobile contact list */
            <div className="flex min-h-0 flex-1 flex-col bg-background">
              {/* Search */}
              <div className="shrink-0 border-b border-border/60 p-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.03] px-2 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search contacts…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground/60"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} aria-label="Clear search" className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between px-1">
                  <span className="text-[10px] font-medium tabular-nums text-muted-foreground">{totalCount} contacts</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="cursor-pointer bg-transparent text-[10px] text-muted-foreground outline-none"
                  >
                    <option value="updated">Last updated</option>
                    <option value="created">Created</option>
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>

              <div
                className="scrollbar-hide flex-1 overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {loading ? (
                  <SkeletonLedger rows={6} />
                ) : leads.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
                    <Users className="mb-1.5 h-5 w-5" />
                    <span className="text-[10px]">No contacts found</span>
                  </div>
                ) : (
                  leads.map(c => {
                    const sc = statusMeta(c.status);
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSelectContact(c.id)}
                        className="w-full border-b border-border/60 px-3 py-3 text-left transition-colors duration-150 active:bg-foreground/[0.04]"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold', TONE_BG[sc.tone], TONE_TEXT[sc.tone])}>
                            {getInitials(c)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-[12px] font-medium text-foreground">{getDisplayName(c)}</span>
                              <StatusDot tone={sc.tone} />
                            </div>
                            <div className="mt-0.5 flex items-center gap-2">
                              {c.category && <span className="truncate text-[10px] text-muted-foreground">{c.category}</span>}
                              <span className="ml-auto text-[9px] tabular-nums text-muted-foreground/70">
                                {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex h-10 shrink-0 items-center justify-between border-t border-border/60 px-3">
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">Page {currentPage}/{totalPages}</span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous page" className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06] disabled:opacity-30"><ChevronLeft className="h-4 w-4 text-muted-foreground" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next page" className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06] disabled:opacity-30"><ChevronRight className="h-4 w-4 text-muted-foreground" /></button>
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
            <div className="flex h-full flex-col bg-background">
              {/* Search */}
              <div className="shrink-0 border-b border-border/60 p-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.03] px-2 py-1.5">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search contacts…"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} aria-label="Clear search" className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="mt-1.5 flex items-center justify-between px-1">
                  <span className="text-[9px] font-medium tabular-nums text-muted-foreground">{totalCount} contacts</span>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="cursor-pointer bg-transparent text-[9px] text-muted-foreground outline-none"
                  >
                    <option value="updated">Last updated</option>
                    <option value="created">Created</option>
                    <option value="name">Name</option>
                    <option value="status">Status</option>
                  </select>
                </div>
              </div>

              {/* Contact List */}
              <div className="scrollbar-hide flex-1 overflow-y-auto">
                {loading ? (
                  <SkeletonLedger rows={8} />
                ) : leads.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
                    <Users className="mb-1.5 h-5 w-5" />
                    <span className="text-[10px]">No contacts found</span>
                  </div>
                ) : viewMode === 'list' ? (
                  leads.map(c => {
                    const sc = statusMeta(c.status);
                    return (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedId(c.id); setEditingContact(false); }}
                        onDoubleClick={() => setFullScreenLead(c)}
                        className={cn(
                          'w-full border-b border-border/60 px-3 py-2.5 text-left transition-colors duration-150',
                          selectedId === c.id ? 'bg-foreground/[0.05]' : 'hover:bg-foreground/[0.025]',
                        )}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold', TONE_BG[sc.tone], TONE_TEXT[sc.tone])}>
                            {getInitials(c)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-[11px] font-medium text-foreground">{getDisplayName(c)}</span>
                              <span title={sc.label}><StatusDot tone={sc.tone} /></span>
                            </div>
                            {c.category && <span className="block truncate text-[9px] text-muted-foreground">{c.category}</span>}
                            <div className="mt-0.5 flex items-center gap-2">
                              {c.email && <Mail className="h-2.5 w-2.5 text-muted-foreground/70" aria-label="Has email" />}
                              {c.phone && <Phone className="h-2.5 w-2.5 text-muted-foreground/70" aria-label="Has phone" />}
                              {c.location_city && (
                                <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground">
                                  <MapPin className="h-2 w-2" />{c.location_city}
                                </span>
                              )}
                              <span className="ml-auto text-[8px] tabular-nums text-muted-foreground/70">
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
                  <div className="space-y-3 p-2">
                    {PIPELINE_ORDER.map(stage => {
                      const sc = STATUS_CONFIG[stage];
                      const items = kanbanData[stage] || [];
                      return (
                        <div key={stage}>
                          <div className="mb-1.5 flex items-center gap-1.5 px-1">
                            <StatusDot tone={sc.tone} />
                            <span className={cn('text-[10px] font-semibold', TONE_TEXT[sc.tone])}>{sc.label}</span>
                            <span className="ml-auto text-[9px] tabular-nums text-muted-foreground">{items.length}</span>
                          </div>
                          <div className="space-y-0.5">
                            {items.slice(0, 5).map(c => (
                              <button
                                key={c.id}
                                onClick={() => { setSelectedId(c.id); setEditingContact(false); }}
                                className={cn(
                                  'w-full rounded-md px-2 py-1.5 text-left text-[10px] transition-colors duration-150',
                                  selectedId === c.id ? 'bg-foreground/[0.06] text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground',
                                )}
                              >
                                {getDisplayName(c)}
                              </button>
                            ))}
                            {items.length > 5 && (
                              <span className="px-2 text-[9px] tabular-nums text-muted-foreground">+{items.length - 5} more</span>
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
                <div className="flex h-9 shrink-0 items-center justify-between border-t border-border/60 px-3">
                  <span className="font-mono text-[9px] tabular-nums text-muted-foreground">Pg {currentPage}/{totalPages}</span>
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} aria-label="First page" className="flex h-5 w-5 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06] disabled:opacity-30"><ChevronsLeft className="h-3 w-3 text-muted-foreground" /></button>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous page" className="flex h-5 w-5 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06] disabled:opacity-30"><ChevronLeft className="h-3 w-3 text-muted-foreground" /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next page" className="flex h-5 w-5 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06] disabled:opacity-30"><ChevronRight className="h-3 w-3 text-muted-foreground" /></button>
                    <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} aria-label="Last page" className="flex h-5 w-5 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06] disabled:opacity-30"><ChevronsRight className="h-3 w-3 text-muted-foreground" /></button>
                  </div>
                </div>
              )}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-border transition-colors duration-150 hover:bg-primary" />

          {/* ── Center: Contact Detail ── */}
          <ResizablePanel defaultSize={44}>
            <div className="scrollbar-hide h-full overflow-y-auto bg-background">
              {!selected ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <Target className="mb-3 h-10 w-10 text-muted-foreground/30" />
                  <span className="text-[13px] font-medium">Select a contact</span>
                  <span className="mt-1 text-[10px] text-muted-foreground/70">Choose from the list to view details</span>
                </div>
              ) : renderContactDetail()}
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-border transition-colors duration-150 hover:bg-primary" />

          {/* ── Right: Activity & Notes ── */}
          <ResizablePanel defaultSize={28} minSize={18} maxSize={35}>
            <div className="flex h-full flex-col bg-background">
              {selected ? renderActivityPanel() : (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <BarChart3 className="mb-2 h-8 w-8 text-muted-foreground/30" />
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
    </div>
  );
}
