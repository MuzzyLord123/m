import { useState, useEffect, useCallback, useMemo } from 'react';
import { CRMSplash } from '@/components/splash/CRMSplash';
import { ExitSplash } from '@/components/splash/ExitSplash';
import { useNavigate } from 'react-router-dom';
import { usePortalHome } from '@/hooks/usePortalHome';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Filter, ArrowLeft, Phone, Mail, Globe, Building2,
  MoreHorizontal, Star, StarOff, Clock, MessageSquare, FileText,
  TrendingUp, Users, Target, DollarSign, Calendar, Tag, MapPin,
  ChevronRight, ChevronDown, Edit3, Trash2, Archive, Send,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Loader2,
  X, Check, AlertCircle, Eye, RefreshCw, Download, Upload,
  Briefcase, Hash, ExternalLink, Copy, UserPlus, Zap,
  Layers, Grid3X3, List, KanbanSquare, SlidersHorizontal,
  Handshake, LineChart, Maximize2,
} from 'lucide-react';
import { FullScreenLeadView } from '@/components/crm/FullScreenLeadView';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { useCRMDeals, type CRMDeal } from '@/hooks/useCRMDeals';
import { DealPipelineBoard } from '@/components/crm/DealPipeline';
import { DealForecast } from '@/components/crm/DealForecast';
import { DealDialog } from '@/components/crm/DealDialog';
import { useProposals, type Proposal, type TemplateType } from '@/hooks/useProposals';
import { ProposalList } from '@/components/crm/ProposalList';
import { ProposalEditor } from '@/components/crm/ProposalEditor';


/* ─────────── Types ─────────── */
interface Contact {
  id: string;
  business_name: string | null;
  personal_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  website_url: string | null;
  category: string | null;
  status: string | null;
  source: string | null;
  location_city: string | null;
  location_postcode: string | null;
  google_rating: number | null;
  review_count: number | null;
  tags: any;
  is_personal: boolean | null;
  last_contacted_at: string | null;
  assigned_to: string | null;
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
  updated_at: string;
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
type ModalMode = null | 'add' | 'import';

interface NewContactForm {
  business_name: string;
  personal_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website_url: string;
  category: string;
  location_city: string;
  location_postcode: string;
  status: string;
  source: string;
  is_personal: boolean;
}

const EMPTY_CONTACT: NewContactForm = {
  business_name: '', personal_name: '', contact_name: '', email: '', phone: '',
  website_url: '', category: '', location_city: '', location_postcode: '',
  status: 'new', source: 'manual', is_personal: false,
};

/* ─────────── Constants ─────────── */
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
  referral: { label: 'Referral', icon: '🤝' },
  website: { label: 'Website', icon: '🌐' },
  cold_outreach: { label: 'Cold Outreach', icon: '📧' },
  social_media: { label: 'Social Media', icon: '📱' },
  manual: { label: 'Manual', icon: '✏️' },
  csv_import: { label: 'CSV Import', icon: '📊' },
  html_import: { label: 'HTML Import', icon: '📄' },
  json_import: { label: 'JSON Import', icon: '📋' },
};

const PIPELINE_ORDER = ['new', 'contacted', 'engaged', 'live_preview_wanted', 'converted', 'lost', 'do_not_contact'];

/* ─────────── Component ─────────── */
export default function LoungeCRM() {
  const navigate = useNavigate();
  const portalHome = usePortalHome();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [showSplash, setShowSplash] = useState(true);
  const [showExitSplash, setShowExitSplash] = useState(false);
  const handleSplashComplete = useCallback(() => setShowSplash(false), []);

  // Deals system
  const { deals, loading: dealsLoading, createDeal, updateDeal, deleteDeal: deleteDealFn, analytics: dealAnalytics } = useCRMDeals();
  const [dealDialogOpen, setDealDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<CRMDeal | null>(null);
  const [defaultDealStage, setDefaultDealStage] = useState<string | undefined>();

  // Proposals system
  const { proposals, loading: proposalsLoading, createFromTemplate, updateProposal, deleteProposal, sendProposal } = useProposals();
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);

  // Data
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [newContactForm, setNewContactForm] = useState<NewContactForm>({ ...EMPTY_CONTACT });
  const [savingContact, setSavingContact] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMapping, setImportMapping] = useState<Record<string, string>>({});
  const [fullScreenLead, setFullScreenLead] = useState<Contact | null>(null);
  const [mobileTab, setMobileTab] = useState<'details' | 'activity'>('details');
  // Fetch contacts
  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(10000);

    if (!error && data) setContacts(data as Contact[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  // Fetch notes & history for selected contact
  useEffect(() => {
    if (!selectedId) { setNotes([]); setStatusHistory([]); return; }
    const fetchDetails = async () => {
      const [notesRes, historyRes] = await Promise.all([
        supabase.from('lead_notes').select('*').eq('lead_id', selectedId).order('created_at', { ascending: false }),
        supabase.from('lead_status_history').select('*').eq('lead_id', selectedId).order('changed_at', { ascending: false }),
      ]);
      if (notesRes.data) setNotes(notesRes.data as Note[]);
      if (historyRes.data) setStatusHistory(historyRes.data as StatusHistory[]);
    };
    fetchDetails();
  }, [selectedId]);

  // Selected contact
  const selected = useMemo(() => contacts.find(c => c.id === selectedId) || null, [contacts, selectedId]);

  // Filtering & sorting
  const filtered = useMemo(() => {
    let result = [...contacts];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        (c.business_name || '').toLowerCase().includes(q) ||
        (c.personal_name || '').toLowerCase().includes(q) ||
        (c.contact_name || '').toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) result = result.filter(c => c.status === statusFilter);
    if (sourceFilter) result = result.filter(c => c.source === sourceFilter);
    result.sort((a, b) => {
      if (sortBy === 'name') return (a.business_name || a.personal_name || '').localeCompare(b.business_name || b.personal_name || '');
      if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
      if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return result;
  }, [contacts, searchQuery, statusFilter, sourceFilter, sortBy]);

  // Stats
  const stats = useMemo(() => ({
    total: contacts.length,
    new: contacts.filter(c => c.status === 'new').length,
    engaged: contacts.filter(c => c.status === 'engaged').length,
    converted: contacts.filter(c => c.status === 'converted').length,
    lost: contacts.filter(c => c.status === 'lost').length,
  }), [contacts]);

  // Kanban data
  const kanbanData = useMemo(() => {
    const map: Record<string, Contact[]> = {};
    PIPELINE_ORDER.forEach(s => { map[s] = []; });
    filtered.forEach(c => {
      const s = c.status || 'new';
      if (map[s]) map[s].push(c);
      else if (map['new']) map['new'].push(c);
    });
    return map;
  }, [filtered]);

  // Actions
  const updateStatus = async (id: string, newStatus: string) => {
    const contact = contacts.find(c => c.id === id);
    if (!contact || !user) return;
    await supabase.from('leads').update({ status: newStatus as any }).eq('id', id);
    await supabase.from('lead_status_history').insert({
      lead_id: id,
      old_status: contact.status as any,
      new_status: newStatus as any,
      changed_by: user.id,
    });
    setContacts(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    if (selectedId === id) {
      const { data } = await supabase.from('lead_status_history').select('*').eq('lead_id', id).order('changed_at', { ascending: false });
      if (data) setStatusHistory(data as StatusHistory[]);
    }
  };

  const addNote = async () => {
    if (!newNote.trim() || !selectedId || !user) return;
    setSavingNote(true);
    const { error } = await supabase.from('lead_notes').insert({
      lead_id: selectedId,
      content: newNote.trim(),
      author_id: user.id,
    });
    if (!error) {
      setNewNote('');
      const { data } = await supabase.from('lead_notes').select('*').eq('lead_id', selectedId).order('created_at', { ascending: false });
      if (data) setNotes(data as Note[]);
      toast({ title: 'Note added' });
    }
    setSavingNote(false);
  };

  const deleteContact = async (id: string) => {
    await supabase.from('leads').delete().eq('id', id);
    setContacts(prev => prev.filter(c => c.id !== id));
    if (selectedId === id) setSelectedId(null);
    toast({ title: 'Contact deleted' });
  };

  const saveEdit = async () => {
    if (!selectedId) return;
    const { error } = await supabase.from('leads').update({
      business_name: editForm.business_name,
      contact_name: editForm.contact_name,
      email: editForm.email,
      phone: editForm.phone,
      website_url: editForm.website_url,
      category: editForm.category,
      location_city: editForm.location_city,
    } as any).eq('id', selectedId);
    if (!error) {
      setContacts(prev => prev.map(c => c.id === selectedId ? { ...c, ...editForm } : c));
      setEditingContact(false);
      toast({ title: 'Contact updated' });
    }
  };

  const getDisplayName = (c: Contact) => c.business_name || c.personal_name || c.contact_name || 'Unnamed';
  const getInitials = (c: Contact) => {
    const name = getDisplayName(c);
    return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  // ─── Add Contact ───
  const addContact = async () => {
    if (!user) return;
    const name = newContactForm.business_name || newContactForm.personal_name || newContactForm.contact_name;
    if (!name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSavingContact(true);
    const { error } = await supabase.from('leads').insert({
      business_name: newContactForm.business_name || null,
      personal_name: newContactForm.personal_name || null,
      contact_name: newContactForm.contact_name || null,
      email: newContactForm.email || null,
      phone: newContactForm.phone || null,
      website_url: newContactForm.website_url || null,
      category: newContactForm.category || null,
      location_city: newContactForm.location_city || null,
      location_postcode: newContactForm.location_postcode || null,
      status: newContactForm.status as any,
      source: newContactForm.source as any,
      is_personal: newContactForm.is_personal,
      assigned_to: user.id,
    } as any);
    setSavingContact(false);
    if (error) { toast({ title: 'Failed to add contact', description: error.message, variant: 'destructive' }); return; }
    setNewContactForm({ ...EMPTY_CONTACT });
    setModalMode(null);
    toast({ title: 'Contact added' });
    fetchContacts();
  };

  // ─── CSV Parse ───
  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const vals = line.match(/(".*?"|[^,]+)/g) || [];
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = (vals[i] || '').trim().replace(/^"|"$/g, ''); });
      return row;
    });
  };

  const handleImportFile = (file: File) => {
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const rows = parseCSV(e.target?.result as string);
      setImportPreview(rows);
      // Auto-map columns
      const csvHeaders = rows.length > 0 ? Object.keys(rows[0]) : [];
      const dbFields = ['business_name', 'personal_name', 'contact_name', 'email', 'phone', 'website_url', 'category', 'location_city', 'location_postcode', 'status', 'source'];
      const mapping: Record<string, string> = {};
      csvHeaders.forEach(h => {
        const lower = h.toLowerCase().replace(/[\s_-]/g, '');
        const match = dbFields.find(f => f.replace(/_/g, '') === lower || lower.includes(f.replace(/_/g, '')));
        if (match) mapping[h] = match;
        else if (lower.includes('name') && !mapping['business_name']) mapping[h] = 'business_name';
        else if (lower.includes('email') || lower.includes('mail')) mapping[h] = 'email';
        else if (lower.includes('phone') || lower.includes('tel')) mapping[h] = 'phone';
        else if (lower.includes('web') || lower.includes('url') || lower.includes('site')) mapping[h] = 'website_url';
        else if (lower.includes('city') || lower.includes('location')) mapping[h] = 'location_city';
        else if (lower.includes('post') || lower.includes('zip')) mapping[h] = 'location_postcode';
        else if (lower.includes('categ') || lower.includes('industry') || lower.includes('type')) mapping[h] = 'category';
      });
      setImportMapping(mapping);
    };
    reader.readAsText(file);
  };

  const runImport = async () => {
    if (!importPreview.length) return;
    setImporting(true);
    const mapped = importPreview.map(row => {
      const obj: any = {};
      Object.entries(importMapping).forEach(([csvCol, dbCol]) => {
        if (row[csvCol]) obj[dbCol] = row[csvCol];
      });
      if (!obj.status) obj.status = 'new';
      if (!obj.source) obj.source = 'csv_import';
      if (!obj.assigned_to && user) obj.assigned_to = user.id;
      return obj;
    }).filter(obj => obj.business_name || obj.personal_name || obj.contact_name || obj.email);

    if (!mapped.length) { toast({ title: 'No valid rows to import', variant: 'destructive' }); setImporting(false); return; }

    // Batch insert in chunks of 50
    let added = 0;
    for (let i = 0; i < mapped.length; i += 50) {
      const chunk = mapped.slice(i, i + 50);
      const { error } = await supabase.from('leads').insert(chunk);
      if (!error) added += chunk.length;
    }

    setImporting(false);
    setModalMode(null);
    setImportFile(null);
    setImportPreview([]);
    toast({ title: `Imported ${added} contacts` });
    fetchContacts();
  };

  // ─── CSV Export ───
  const exportCSV = () => {
    const headers = ['business_name', 'personal_name', 'contact_name', 'email', 'phone', 'website_url', 'category', 'location_city', 'location_postcode', 'status', 'source', 'google_rating', 'review_count', 'created_at', 'updated_at'];
    const rows = filtered.map(c => headers.map(h => {
      const val = (c as any)[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `crm-contacts-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: `Exported ${filtered.length} contacts` });
  };

  /* ─────────── Render ─────────── */
  if (showExitSplash) {
    return <ExitSplash moduleName="CRM" onComplete={() => navigate(portalHome, { state: { skipSplash: true } })} />;
  }

  if (showSplash) {
    return <CRMSplash onComplete={handleSplashComplete} />;
  }

  return (
    <div
      className="h-[100dvh] w-screen flex flex-col overflow-hidden"
      style={{
        backgroundColor: '#111',
        color: '#e0e0e0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        fontSize: '12px',
      }}
    >
      {/* ─── Top Bar ─── */}
      <div className="shrink-0 select-none" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        {/* Row 1: Back + Title + View toggle */}
        <div className="h-11 flex items-center justify-between px-3">
          {/* Left */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setShowExitSplash(true)}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors shrink-0"
              title="Back to Lounge"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-[#999]" />
            </button>
            <div className="w-[1px] h-4 bg-[#333]" />
            <div className="flex items-center gap-1.5 shrink-0">
              <Target className="h-3.5 w-3.5 text-[#0073E6]" />
              <span className="text-[11px] font-semibold text-[#ccc] tracking-wide">CRM</span>
            </div>
            {/* Stats pills - desktop only */}
            <div className="hidden lg:flex items-center gap-1.5 ml-1">
              <div className="w-[1px] h-4 bg-[#333]" />
              {[
                { label: 'Total', value: stats.total, color: '#888' },
                { label: 'New', value: stats.new, color: '#60a5fa' },
                { label: 'Engaged', value: stats.engaged, color: '#34d399' },
                { label: 'Converted', value: stats.converted, color: '#22c55e' },
              ].map(s => (
                <div
                  key={s.label}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md"
                  style={{ backgroundColor: '#252525', border: '1px solid #2a2a2a' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[9px] font-medium" style={{ color: '#888' }}>{s.label}</span>
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center: View toggle */}
          <div className="flex items-center gap-1 rounded-lg p-0.5 shrink-0" style={{ backgroundColor: '#252525', border: '1px solid #2a2a2a' }}>
            {[
              { key: 'list' as ViewMode, icon: <List className="h-3 w-3" />, label: 'Contacts' },
              { key: 'kanban' as ViewMode, icon: <KanbanSquare className="h-3 w-3" />, label: 'Pipeline' },
              { key: 'deals' as ViewMode, icon: <Handshake className="h-3 w-3" />, label: 'Deals' },
              { key: 'forecast' as ViewMode, icon: <LineChart className="h-3 w-3" />, label: 'Forecast' },
              { key: 'proposals' as ViewMode, icon: <FileText className="h-3 w-3" />, label: 'Proposals' },
            ].map(v => (
              <button
                key={v.key}
                onClick={() => setViewMode(v.key)}
                className={`h-6 px-2 sm:px-2.5 flex items-center gap-1 rounded-md text-[10px] font-medium transition-all ${
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

          {/* Right */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={exportCSV}
              className="hidden sm:flex h-7 px-2.5 items-center gap-1 rounded-md text-[11px] font-medium text-[#888] hover:text-[#ccc] hover:bg-[#333] transition-colors"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5" /> <span className="hidden md:inline">Export</span>
            </button>
            <button
              onClick={() => { setModalMode('import'); setImportFile(null); setImportPreview([]); }}
              className="hidden sm:flex h-7 px-2.5 items-center gap-1 rounded-md text-[11px] font-medium text-[#888] hover:text-[#ccc] hover:bg-[#333] transition-colors"
              title="Import CSV"
            >
              <Upload className="h-3.5 w-3.5" /> <span className="hidden md:inline">Import</span>
            </button>
            <button
              onClick={() => { setModalMode('add'); setNewContactForm({ ...EMPTY_CONTACT }); }}
              className="h-7 px-2.5 flex items-center gap-1 rounded-md text-[11px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add Contact</span>
            </button>
            <div className="hidden sm:block w-[1px] h-4 bg-[#333]" />
            <button
              onClick={fetchContacts}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#666]" />
            </button>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`h-7 px-2.5 flex items-center gap-1 rounded-md text-[11px] font-medium transition-colors ${
                showFilters ? 'bg-[#0073E6]/20 text-[#60a5fa]' : 'text-[#888] hover:text-[#ccc] hover:bg-[#333]'
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Row 2: Stats pills on mobile/tablet */}
        <div className="lg:hidden flex items-center gap-1.5 px-3 pb-2 overflow-x-auto scrollbar-hide">
          {[
            { label: 'Total', value: stats.total, color: '#888' },
            { label: 'New', value: stats.new, color: '#60a5fa' },
            { label: 'Engaged', value: stats.engaged, color: '#34d399' },
            { label: 'Converted', value: stats.converted, color: '#22c55e' },
          ].map(s => (
            <div
              key={s.label}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md shrink-0"
              style={{ backgroundColor: '#252525', border: '1px solid #2a2a2a' }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[9px] font-medium" style={{ color: '#888' }}>{s.label}</span>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Filter Bar (collapsible) ─── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden shrink-0"
            style={{ backgroundColor: '#161616', borderBottom: '1px solid #2a2a2a' }}
          >
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="text-[10px] font-medium text-[#666] uppercase tracking-wider">Status:</span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setStatusFilter(null)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    !statusFilter ? 'bg-[#333] text-white' : 'text-[#777] hover:text-white hover:bg-[#2a2a2a]'
                  }`}
                >All</button>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                    className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                    style={{
                      backgroundColor: statusFilter === key ? cfg.bg : 'transparent',
                      color: statusFilter === key ? cfg.color : '#777',
                      border: statusFilter === key ? `1px solid ${cfg.color}30` : '1px solid transparent',
                    }}
                  >{cfg.label}</button>
                ))}
              </div>
              <div className="w-[1px] h-4 bg-[#333]" />
              <span className="text-[10px] font-medium text-[#666] uppercase tracking-wider">Source:</span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setSourceFilter(null)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    !sourceFilter ? 'bg-[#333] text-white' : 'text-[#777] hover:text-white hover:bg-[#2a2a2a]'
                  }`}
                >All</button>
                {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setSourceFilter(sourceFilter === key ? null : key)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      sourceFilter === key ? 'bg-[#333] text-white' : 'text-[#777] hover:text-white hover:bg-[#2a2a2a]'
                    }`}
                  >{cfg.icon} {cfg.label}</button>
                ))}
              </div>
              {(statusFilter || sourceFilter) && (
                <button onClick={() => { setStatusFilter(null); setSourceFilter(null); }} className="ml-auto text-[10px] text-[#ef4444] hover:text-[#f87171]">
                  Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
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
      ) : (
      isMobile ? (
        /* ── Mobile: Single-view with back navigation ── */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {selectedId && selected ? (
            <>
              <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
                <button onClick={() => setSelectedId(null)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-[#333]">
                  <ArrowLeft className="h-4 w-4 text-[#999]" />
                </button>
                <span className="text-[12px] font-semibold text-[#ddd] truncate flex-1">{getDisplayName(selected)}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingContact(true); setEditForm(selected); }} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333]">
                    <Edit3 className="h-3.5 w-3.5 text-[#888]" />
                  </button>
                  <button onClick={() => deleteContact(selected.id)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333]">
                    <Trash2 className="h-3.5 w-3.5 text-[#ef4444]" />
                  </button>
                </div>
              </div>
              <div className="flex items-center shrink-0" style={{ backgroundColor: '#161616', borderBottom: '1px solid #2a2a2a' }}>
                {(['details', 'activity'] as const).map(tab => (
                  <button key={tab} onClick={() => setMobileTab(tab)}
                    className={`flex-1 h-9 text-[11px] font-semibold transition-colors ${mobileTab === tab ? 'text-white border-b-2 border-[#0073E6]' : 'text-[#666]'}`}
                  >{tab === 'details' ? 'Details' : 'Activity'}</button>
                ))}
              </div>
              <div
                className="flex-1 overflow-y-auto overscroll-contain"
                style={{ backgroundColor: '#111', WebkitOverflowScrolling: 'touch' }}
              >
                {mobileTab === 'details' ? (
                  <div className="p-4 space-y-4">
                    {/* Pipeline Stage */}
                    <div className="rounded-xl p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                      <span className="text-[9px] font-medium text-[#666] uppercase tracking-wider block mb-2">Pipeline Stage</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PIPELINE_ORDER.map((stage, i) => {
                          const sc = STATUS_CONFIG[stage];
                          const isActive = selected.status === stage;
                          const isPast = PIPELINE_ORDER.indexOf(selected.status || 'new') > i;
                          return (
                            <button key={stage} onClick={() => updateStatus(selected.id, stage)}
                              className="h-7 px-2.5 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                              style={{ backgroundColor: isActive ? sc.bg : isPast ? `${sc.color}08` : '#222', color: isActive ? sc.color : isPast ? `${sc.color}80` : '#555', border: isActive ? `1px solid ${sc.color}40` : '1px solid transparent' }}
                            >
                              {isActive && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.color }} />}
                              {sc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Contact Info Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', value: selected.email, field: 'email' },
                        { icon: <Phone className="h-3.5 w-3.5" />, label: 'Phone', value: selected.phone, field: 'phone' },
                        { icon: <Globe className="h-3.5 w-3.5" />, label: 'Website', value: selected.website_url, field: 'website_url' },
                        { icon: <Building2 className="h-3.5 w-3.5" />, label: 'Category', value: selected.category, field: 'category' },
                        { icon: <MapPin className="h-3.5 w-3.5" />, label: 'Location', value: [selected.location_city, selected.location_postcode].filter(Boolean).join(', '), field: 'location_city' },
                        { icon: <Star className="h-3.5 w-3.5" />, label: 'Rating', value: selected.google_rating ? `${selected.google_rating} ★ (${selected.review_count || 0})` : null, field: null },
                      ].map(item => (
                        <div key={item.label} className="rounded-lg p-2.5" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[#555]">{item.icon}</span>
                            <span className="text-[9px] text-[#666] font-medium uppercase tracking-wider">{item.label}</span>
                          </div>
                          <span className="text-[11px] text-[#ccc] block truncate">{item.value || <span className="text-[#444] italic">Not set</span>}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-2 flex-wrap">
                      <span className="text-[9px] text-[#444] flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Created {format(new Date(selected.created_at), 'dd MMM yyyy')}</span>
                      <span className="text-[9px] text-[#444] flex items-center gap-1"><RefreshCw className="h-2.5 w-2.5" /> Updated {formatDistanceToNow(new Date(selected.updated_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="p-3 shrink-0" style={{ borderBottom: '1px solid #222' }}>
                      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                        <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note…" rows={2} className="w-full bg-transparent text-[11px] text-[#ccc] placeholder:text-[#555] outline-none p-2.5 resize-none" />
                        <div className="flex items-center justify-end p-1.5 pt-0">
                          <button onClick={addNote} disabled={!newNote.trim() || savingNote} className="h-6 px-3 rounded-md text-[10px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors disabled:opacity-30 flex items-center gap-1">
                            {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />} Add Note
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {notes.map(note => (
                        <div key={note.id} className="rounded-lg p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <FileText className="h-3 w-3 text-[#0073E6]" />
                            <span className="text-[9px] text-[#666] font-medium">Note</span>
                            <span className="text-[8px] text-[#444] ml-auto">{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
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
                            <span className="text-[10px] text-[#888]">Status → <span style={{ color: (STATUS_CONFIG[h.new_status] || STATUS_CONFIG.new).color }}>{(STATUS_CONFIG[h.new_status] || STATUS_CONFIG.new).label}</span></span>
                            <span className="text-[8px] text-[#444] block mt-0.5">{formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}</span>
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
                )}
              </div>
            </>
          ) : (
            /* Mobile contact list */
            <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: '#141414' }}>
              <div className="p-2 shrink-0" style={{ borderBottom: '1px solid #222' }}>
                <div className="flex items-center gap-1.5 px-2 py-2 rounded-lg" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                  <Search className="h-4 w-4 text-[#555]" />
                  <input type="text" placeholder="Search contacts…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent text-[12px] text-[#ccc] placeholder:text-[#555] outline-none flex-1" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} className="text-[#555]"><X className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
              <div
                className="flex-1 overflow-y-auto scrollbar-hide overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center h-32"><Loader2 className="h-4 w-4 animate-spin text-[#555]" /></div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-[#555]"><Users className="h-5 w-5 mb-1.5" /><span className="text-[10px]">No contacts found</span></div>
                ) : filtered.map(c => {
                  const sc = STATUS_CONFIG[c.status || 'new'] || STATUS_CONFIG.new;
                  return (
                    <button key={c.id} onClick={() => { setSelectedId(c.id); setEditingContact(false); setMobileTab('details'); }}
                      className="w-full text-left px-3 py-3 transition-colors border-b border-[#1a1a1a] active:bg-[#222]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0" style={{ backgroundColor: sc.bg, color: sc.color }}>{getInitials(c)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-[#ddd] truncate">{getDisplayName(c)}</span>
                            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sc.color }} />
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {c.category && <span className="text-[10px] text-[#666] truncate">{c.category}</span>}
                            <span className="text-[9px] text-[#444] ml-auto">{formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[#444] shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
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
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent text-[11px] text-[#ccc] placeholder:text-[#555] outline-none flex-1"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="hover:text-white text-[#555]">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between mt-1.5 px-1">
                <span className="text-[9px] text-[#555] font-medium">{filtered.length} contacts</span>
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
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-[#555]">
                  <Users className="h-5 w-5 mb-1.5" />
                  <span className="text-[10px]">No contacts found</span>
                </div>
              ) : viewMode === 'list' ? (
                filtered.map(c => {
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
                            <div
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: sc.color }}
                              title={sc.label}
                            />
                          </div>
                          {c.category && (
                            <span className="text-[9px] text-[#666] truncate block">{c.category}</span>
                          )}
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
            ) : (
              <div className="p-5 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: (STATUS_CONFIG[selected.status || 'new'] || STATUS_CONFIG.new).bg,
                        color: (STATUS_CONFIG[selected.status || 'new'] || STATUS_CONFIG.new).color,
                      }}
                    >
                      {getInitials(selected)}
                    </div>
                    <div>
                      {editingContact ? (
                        <input
                          value={editForm.business_name || editForm.personal_name || ''}
                          onChange={e => setEditForm(f => ({ ...f, business_name: e.target.value }))}
                          className="bg-[#1e1e1e] border border-[#333] rounded px-2 py-1 text-[14px] font-semibold text-white outline-none focus:border-[#0073E6]"
                        />
                      ) : (
                        <h2 className="text-[16px] font-semibold text-white">{getDisplayName(selected)}</h2>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          className="text-[9px] font-medium border px-1.5 py-0"
                          style={{
                            backgroundColor: (STATUS_CONFIG[selected.status || 'new'] || STATUS_CONFIG.new).bg,
                            color: (STATUS_CONFIG[selected.status || 'new'] || STATUS_CONFIG.new).color,
                            borderColor: `${(STATUS_CONFIG[selected.status || 'new'] || STATUS_CONFIG.new).color}30`,
                          }}
                        >
                          {(STATUS_CONFIG[selected.status || 'new'] || STATUS_CONFIG.new).label}
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
                  <div className="flex items-center gap-1">
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
                        <button
                          onClick={() => setFullScreenLead(selected)}
                          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors"
                          title="Open full screen"
                        >
                          <Maximize2 className="h-3.5 w-3.5 text-[#0073E6]" />
                        </button>
                        <button
                          onClick={() => { setEditingContact(true); setEditForm(selected); }}
                          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-[#888]" />
                        </button>
                        <button
                          onClick={() => deleteContact(selected.id)}
                          className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-[#ef4444]" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Pipeline Stage Selector */}
                <div className="rounded-xl p-3" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                  <span className="text-[9px] font-medium text-[#666] uppercase tracking-wider block mb-2">Pipeline Stage</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PIPELINE_ORDER.map((stage, i) => {
                      const sc = STATUS_CONFIG[stage];
                      const isActive = selected.status === stage;
                      const isPast = PIPELINE_ORDER.indexOf(selected.status || 'new') > i;
                      return (
                        <button
                          key={stage}
                          onClick={() => updateStatus(selected.id, stage)}
                          className="h-7 px-2.5 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                          style={{
                            backgroundColor: isActive ? sc.bg : isPast ? `${sc.color}08` : '#222',
                            color: isActive ? sc.color : isPast ? `${sc.color}80` : '#888',
                            border: isActive ? `1px solid ${sc.color}40` : '1px solid transparent',
                          }}
                        >
                          {isActive && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.color }} />}
                          {sc.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Contact Info Grid */}
                <div className="grid grid-cols-2 gap-3">
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
                <div className="flex items-center gap-4 pt-2">
                  <span className="text-[9px] text-[#444] flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    Created {format(new Date(selected.created_at), 'dd MMM yyyy')}
                  </span>
                  <span className="text-[9px] text-[#444] flex items-center gap-1">
                    <RefreshCw className="h-2.5 w-2.5" />
                    Updated {formatDistanceToNow(new Date(selected.updated_at), { addSuffix: true })}
                  </span>
                  {selected.last_contacted_at && (
                    <span className="text-[9px] text-[#444] flex items-center gap-1">
                      <MessageSquare className="h-2.5 w-2.5" />
                      Contacted {formatDistanceToNow(new Date(selected.last_contacted_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-[1px] bg-[#2a2a2a] hover:bg-[#0073E6] transition-colors" />

        {/* ── Right: Activity & Notes ── */}
        <ResizablePanel defaultSize={28} minSize={18} maxSize={35}>
          <div className="h-full flex flex-col" style={{ backgroundColor: '#141414' }}>
            {selected ? (
              <>
                {/* Tabs header */}
                <div className="flex items-center gap-0 px-3 pt-2 shrink-0" style={{ borderBottom: '1px solid #222' }}>
                  <span className="text-[10px] font-semibold text-white pb-2 border-b-2 border-[#0073E6] px-2">Activity</span>
                </div>

                {/* Notes input */}
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

                {/* Activity Timeline */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-3">
                  {/* Notes */}
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

                  {/* Status Changes */}
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
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#555]">
                <BarChart3 className="h-8 w-8 mb-2 text-[#333]" />
                <span className="text-[10px]">Select a contact to view activity</span>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      )
      )
      }

      {/* Deal Dialog */}
      <DealDialog
        open={dealDialogOpen}
        onClose={() => { setDealDialogOpen(false); setSelectedDeal(null); setDefaultDealStage(undefined); }}
        deal={selectedDeal}
        defaultStage={defaultDealStage}
        onSave={async (data) => {
          if (selectedDeal) {
            await updateDeal(selectedDeal.id, data);
          } else {
            await createDeal(data);
          }
        }}
        onDelete={deleteDealFn}
      />

      {/* ─── Add Contact Modal ─── */}
      <AnimatePresence>
        {modalMode === 'add' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => setModalMode(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-[520px] max-h-[80vh] overflow-y-auto rounded-xl p-5"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-[#0073E6]" />
                  <h3 className="text-[14px] font-semibold text-white">Add New Contact</h3>
                </div>
                <button onClick={() => setModalMode(null)} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[#333]">
                  <X className="h-3.5 w-3.5 text-[#888]" />
                </button>
              </div>

              {/* Toggle: Business vs Personal */}
              <div className="flex items-center gap-2 mb-4">
                {[{ val: false, label: 'Business' }, { val: true, label: 'Personal' }].map(opt => (
                  <button
                    key={String(opt.val)}
                    onClick={() => setNewContactForm(f => ({ ...f, is_personal: opt.val }))}
                    className={`h-7 px-3 rounded-md text-[11px] font-medium transition-colors ${
                      newContactForm.is_personal === opt.val
                        ? 'bg-[#0073E6] text-white'
                        : 'bg-[#252525] text-[#888] hover:text-white'
                    }`}
                  >{opt.label}</button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(newContactForm.is_personal ? [
                  { key: 'personal_name', label: 'Full Name', required: true },
                ] : [
                  { key: 'business_name', label: 'Business Name', required: true },
                  { key: 'contact_name', label: 'Contact Person' },
                ]).map(f => (
                  <div key={f.key} className={f.key === 'business_name' || f.key === 'personal_name' ? 'col-span-2' : ''}>
                    <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">
                      {f.label} {f.required && <span className="text-[#ef4444]">*</span>}
                    </label>
                    <input
                      value={(newContactForm as any)[f.key]}
                      onChange={e => setNewContactForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full bg-[#252525] border border-[#333] rounded-md px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#0073E6]"
                    />
                  </div>
                ))}
                {[
                  { key: 'email', label: 'Email' },
                  { key: 'phone', label: 'Phone' },
                  { key: 'website_url', label: 'Website' },
                  { key: 'category', label: 'Category / Industry' },
                  { key: 'location_city', label: 'City' },
                  { key: 'location_postcode', label: 'Postcode' },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">{f.label}</label>
                    <input
                      value={(newContactForm as any)[f.key]}
                      onChange={e => setNewContactForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full bg-[#252525] border border-[#333] rounded-md px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#0073E6]"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Status</label>
                  <select
                    value={newContactForm.status}
                    onChange={e => setNewContactForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full bg-[#252525] border border-[#333] rounded-md px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#0073E6]"
                  >
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-[#666] font-medium uppercase tracking-wider block mb-1">Source</label>
                  <select
                    value={newContactForm.source}
                    onChange={e => setNewContactForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full bg-[#252525] border border-[#333] rounded-md px-2.5 py-1.5 text-[11px] text-white outline-none focus:border-[#0073E6]"
                  >
                    {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-5 pt-4" style={{ borderTop: '1px solid #2a2a2a' }}>
                <button onClick={() => setModalMode(null)} className="h-8 px-4 rounded-md text-[11px] font-medium text-[#888] hover:bg-[#333] transition-colors">
                  Cancel
                </button>
                <button
                  onClick={addContact}
                  disabled={savingContact}
                  className="h-8 px-5 rounded-md text-[11px] font-semibold bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingContact ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                  Add Contact
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Import Modal ─── */}
      <AnimatePresence>
        {modalMode === 'import' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
            onClick={() => setModalMode(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-[640px] max-h-[85vh] overflow-y-auto rounded-xl p-5"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-[#0073E6]" />
                  <h3 className="text-[14px] font-semibold text-white">Import Contacts from CSV</h3>
                </div>
                <button onClick={() => setModalMode(null)} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[#333]">
                  <X className="h-3.5 w-3.5 text-[#888]" />
                </button>
              </div>

              {!importFile ? (
                <label className="flex flex-col items-center justify-center h-40 rounded-xl cursor-pointer border-2 border-dashed border-[#333] hover:border-[#0073E6]/50 transition-colors">
                  <Upload className="h-8 w-8 text-[#555] mb-2" />
                  <span className="text-[12px] text-[#888] font-medium">Click to select CSV file</span>
                  <span className="text-[10px] text-[#555] mt-1">Supports .csv files with headers</span>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleImportFile(e.target.files[0]); }}
                  />
                </label>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg" style={{ backgroundColor: '#252525', border: '1px solid #333' }}>
                    <FileText className="h-4 w-4 text-[#0073E6]" />
                    <span className="text-[11px] text-[#ccc] font-medium flex-1">{importFile.name}</span>
                    <span className="text-[10px] text-[#666]">{importPreview.length} rows</span>
                    <button onClick={() => { setImportFile(null); setImportPreview([]); }} className="text-[#888] hover:text-[#ef4444]">
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {/* Column mapping */}
                  <div className="mb-3">
                    <span className="text-[10px] text-[#666] font-medium uppercase tracking-wider block mb-2">Column Mapping</span>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(importPreview[0] || {}).map(csvCol => (
                        <div key={csvCol} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: '#222', border: '1px solid #2a2a2a' }}>
                          <span className="text-[10px] text-[#aaa] font-medium truncate flex-1">{csvCol}</span>
                          <span className="text-[9px] text-[#555]">→</span>
                          <select
                            value={importMapping[csvCol] || ''}
                            onChange={e => setImportMapping(m => ({ ...m, [csvCol]: e.target.value }))}
                            className="bg-[#1a1a1a] border border-[#333] rounded px-1.5 py-0.5 text-[10px] text-[#ccc] outline-none w-32"
                          >
                            <option value="">Skip</option>
                            {['business_name', 'personal_name', 'contact_name', 'email', 'phone', 'website_url', 'category', 'location_city', 'location_postcode'].map(f => (
                              <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="mb-3">
                    <span className="text-[10px] text-[#666] font-medium uppercase tracking-wider block mb-2">Preview (first 5 rows)</span>
                    <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr style={{ backgroundColor: '#222' }}>
                              {Object.keys(importPreview[0] || {}).filter(col => importMapping[col]).map(col => (
                                <th key={col} className="px-2 py-1.5 text-left text-[#888] font-medium whitespace-nowrap">
                                  {importMapping[col]?.replace(/_/g, ' ')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.slice(0, 5).map((row, i) => (
                              <tr key={i} style={{ borderTop: '1px solid #2a2a2a' }}>
                                {Object.entries(row).filter(([col]) => importMapping[col]).map(([col, val]) => (
                                  <td key={col} className="px-2 py-1.5 text-[#ccc] whitespace-nowrap max-w-[120px] truncate">{val}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #2a2a2a' }}>
                    <span className="text-[10px] text-[#666]">
                      {importPreview.length} rows will be imported
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setModalMode(null)} className="h-8 px-4 rounded-md text-[11px] font-medium text-[#888] hover:bg-[#333] transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={runImport}
                        disabled={importing || !Object.values(importMapping).some(Boolean)}
                        className="h-8 px-5 rounded-md text-[11px] font-semibold bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {importing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                        Import {importPreview.length} Contacts
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full-screen Lead View */}
      <AnimatePresence>
        {fullScreenLead && (
          <FullScreenLeadView
            lead={fullScreenLead as any}
            leads={filtered as any}
            onBack={() => setFullScreenLead(null)}
            onLeadChange={(l) => setFullScreenLead(l as any)}
            onUpdate={() => { fetchContacts(); }}
            onDelete={(id) => { setContacts(prev => prev.filter(c => c.id !== id)); setFullScreenLead(null); setSelectedId(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
