import { useState, useEffect, useCallback, useMemo } from 'react';
import { CRMSplash } from '@/components/splash/CRMSplash';
import { ExitSplash } from '@/components/splash/ExitSplash';
import { useNavigate } from 'react-router-dom';
import { usePortalHome } from '@/hooks/usePortalHome';
import {
  Search, Plus, ArrowLeft, Phone, Mail, Globe, Building2,
  Star, Clock, MessageSquare, FileText,
  TrendingUp, Users, Target, MapPin,
  ChevronRight, Edit3, Trash2, Send,
  BarChart3, X, Check, RefreshCw, Download, Upload,
  UserPlus, List, KanbanSquare, SlidersHorizontal,
  Handshake, LineChart, Maximize2,
  Map as MapIcon, Smartphone, PenLine, FileJson, FileCode,
  type LucideIcon,
} from 'lucide-react';
import { FullScreenLeadView } from '@/components/crm/FullScreenLeadView';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { useCRMDeals, type CRMDeal } from '@/hooks/useCRMDeals';
import { DealPipelineBoard } from '@/components/crm/DealPipeline';
import { DealForecast } from '@/components/crm/DealForecast';
import { DealDialog } from '@/components/crm/DealDialog';
import { useProposals, type Proposal } from '@/hooks/useProposals';
import { ProposalList } from '@/components/crm/ProposalList';
import { ProposalEditor } from '@/components/crm/ProposalEditor';
import { StatusBadge, StatusDot, SkeletonLedger, type Tone } from '@/components/platform';
import { cn } from '@/lib/utils';


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

/* Sources: lucide icons for JSX; `icon` stays a string for the native
   <option> rows, now empty instead of an emoji. */
const SOURCE_CONFIG: Record<string, { label: string; icon: string }> = {
  google_maps: { label: 'Google Maps', icon: '' },
  referral: { label: 'Referral', icon: '' },
  website: { label: 'Website', icon: '' },
  cold_outreach: { label: 'Cold outreach', icon: '' },
  social_media: { label: 'Social media', icon: '' },
  manual: { label: 'Manual', icon: '' },
  csv_import: { label: 'CSV import', icon: '' },
  html_import: { label: 'HTML import', icon: '' },
  json_import: { label: 'JSON import', icon: '' },
};

const SOURCE_ICONS: Record<string, LucideIcon> = {
  google_maps: MapIcon,
  referral: Users,
  website: Globe,
  cold_outreach: Mail,
  social_media: Smartphone,
  manual: PenLine,
  csv_import: BarChart3,
  html_import: FileCode,
  json_import: FileJson,
};

const PIPELINE_ORDER = ['new', 'contacted', 'engaged', 'live_preview_wanted', 'converted', 'lost', 'do_not_contact'];

const statusMeta = (status: string | null | undefined) =>
  STATUS_CONFIG[status || 'new'] || STATUS_CONFIG.new;

/* Compact field recipe for the instrument surface */
const FIELD_SM =
  'w-full rounded-md border border-border/60 bg-foreground/[0.03] px-2.5 py-1.5 text-[11px] text-foreground outline-none transition-colors duration-150 focus:border-primary/60 placeholder:text-muted-foreground/60';
const LABEL_SM =
  'font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground block mb-1';

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
      <span className="text-[10px] font-semibold tabular-nums text-foreground">{s.value}</span>
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

  /* ─────────── Render ─────────── */
  if (showExitSplash) {
    return <ExitSplash moduleName="CRM" onComplete={() => navigate(portalHome, { state: { skipSplash: true } })} />;
  }

  if (showSplash) {
    return <CRMSplash onComplete={handleSplashComplete} />;
  }

  return (
    <div className="flex h-[100dvh] w-screen flex-col overflow-hidden bg-background text-[12px] text-foreground">
      {/* ─── Top Bar ─── */}
      <div className="shrink-0 select-none border-b border-border/60 bg-card">
        {/* Row 1: Back + Title + View toggle */}
        <div className="flex h-11 items-center justify-between px-3">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setShowExitSplash(true)}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]"
              title="Back to Lounge"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <div className="h-4 w-px bg-border" />
            <div className="flex shrink-0 items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold tracking-wide text-foreground">CRM</span>
            </div>
            {/* Stats pills - desktop only */}
            <div className="ml-1 hidden items-center gap-1.5 lg:flex">
              <div className="h-4 w-px bg-border" />
              {statPills.map(statPill)}
            </div>
          </div>

          {/* Center: View toggle */}
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/60 bg-sunken p-0.5">
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
                className={cn(
                  'flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium transition-colors duration-150 sm:px-2.5',
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

          {/* Right */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={exportCSV}
              className="hidden h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06] hover:text-foreground sm:flex"
              title="Export CSV"
            >
              <Download className="h-3.5 w-3.5" /> <span className="hidden md:inline">Export</span>
            </button>
            <button
              onClick={() => { setModalMode('import'); setImportFile(null); setImportPreview([]); }}
              className="hidden h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06] hover:text-foreground sm:flex"
              title="Import CSV"
            >
              <Upload className="h-3.5 w-3.5" /> <span className="hidden md:inline">Import</span>
            </button>
            <button
              onClick={() => { setModalMode('add'); setNewContactForm({ ...EMPTY_CONTACT }); }}
              className="flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105"
            >
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add contact</span>
            </button>
            <div className="hidden h-4 w-px bg-border sm:block" />
            <button
              onClick={fetchContacts}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={cn(
                'flex h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium transition-colors duration-150',
                showFilters ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground',
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        {/* Row 2: Stats pills on mobile/tablet */}
        <div className="scrollbar-hide flex items-center gap-1.5 overflow-x-auto px-3 pb-2 lg:hidden">
          {statPills.map(statPill)}
        </div>
      </div>

      {/* ─── Filter Bar (collapsible) ─── */}
      {showFilters && (
        <div className="shrink-0 border-b border-border/60 bg-sunken">
          <div className="flex flex-wrap items-center gap-3 px-4 py-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Status</span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setStatusFilter(null)}
                className={cn(
                  'rounded px-2 py-0.5 text-[10px] font-medium transition-colors duration-150',
                  !statusFilter ? 'bg-foreground/[0.08] text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                )}
              >All</button>
              {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-medium transition-colors duration-150',
                    statusFilter === key
                      ? cn(TONE_BG[cfg.tone], TONE_TEXT[cfg.tone], 'border-border/60')
                      : 'border-transparent text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                  )}
                ><StatusDot tone={cfg.tone} />{cfg.label}</button>
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Source</span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setSourceFilter(null)}
                className={cn(
                  'rounded px-2 py-0.5 text-[10px] font-medium transition-colors duration-150',
                  !sourceFilter ? 'bg-foreground/[0.08] text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                )}
              >All</button>
              {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => {
                const Icon = SOURCE_ICONS[key] || FileText;
                return (
                  <button
                    key={key}
                    onClick={() => setSourceFilter(sourceFilter === key ? null : key)}
                    className={cn(
                      'flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium transition-colors duration-150',
                      sourceFilter === key ? 'bg-foreground/[0.08] text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                    )}
                  ><Icon className="h-2.5 w-2.5" aria-hidden /> {cfg.label}</button>
                );
              })}
            </div>
            {(statusFilter || sourceFilter) && (
              <button onClick={() => { setStatusFilter(null); setSourceFilter(null); }} className="ml-auto text-[10px] text-risk transition-colors duration-150 hover:text-risk/80">
                Clear all
              </button>
            )}
          </div>
        </div>
      )}

      {/* ─── Main Content ─── */}
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
      ) : (
      isMobile ? (
        /* ── Mobile: Single-view with back navigation ── */
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {selectedId && selected ? (
            <>
              <div className="flex shrink-0 items-center gap-2 border-b border-border/60 bg-card px-3 py-2">
                <button onClick={() => setSelectedId(null)} aria-label="Back to contacts" className="flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
                  <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <span className="flex-1 truncate text-[12px] font-semibold text-foreground">{getDisplayName(selected)}</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => { setEditingContact(true); setEditForm(selected); }} aria-label="Edit contact" className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
                    <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  <button onClick={() => deleteContact(selected.id)} aria-label="Delete contact" className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
                    <Trash2 className="h-3.5 w-3.5 text-risk" />
                  </button>
                </div>
              </div>
              <div className="flex shrink-0 items-center border-b border-border/60 bg-sunken">
                {(['details', 'activity'] as const).map(tab => (
                  <button key={tab} onClick={() => setMobileTab(tab)}
                    className={cn(
                      'h-9 flex-1 text-[11px] font-semibold transition-colors duration-150',
                      mobileTab === tab ? 'border-b-2 border-primary text-foreground' : 'text-muted-foreground',
                    )}
                  >{tab === 'details' ? 'Details' : 'Activity'}</button>
                ))}
              </div>
              <div
                className="flex-1 overflow-y-auto overscroll-contain bg-background"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {mobileTab === 'details' ? (
                  <div className="space-y-4 p-4">
                    {/* Pipeline Stage */}
                    <div className="rounded-[10px] border border-border/60 bg-card p-3">
                      <span className="mb-2 block font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Pipeline stage</span>
                      <div className="flex flex-wrap gap-1.5">
                        {PIPELINE_ORDER.map((stage, i) => {
                          const sc = STATUS_CONFIG[stage];
                          const isActive = selected.status === stage;
                          const isPast = PIPELINE_ORDER.indexOf(selected.status || 'new') > i;
                          return (
                            <button key={stage} onClick={() => updateStatus(selected.id, stage)}
                              className={cn(
                                'flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-[10px] font-medium transition-colors duration-150',
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
                    {/* Contact Info Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', value: selected.email, field: 'email' },
                        { icon: <Phone className="h-3.5 w-3.5" />, label: 'Phone', value: selected.phone, field: 'phone' },
                        { icon: <Globe className="h-3.5 w-3.5" />, label: 'Website', value: selected.website_url, field: 'website_url' },
                        { icon: <Building2 className="h-3.5 w-3.5" />, label: 'Category', value: selected.category, field: 'category' },
                        { icon: <MapPin className="h-3.5 w-3.5" />, label: 'Location', value: [selected.location_city, selected.location_postcode].filter(Boolean).join(', '), field: 'location_city' },
                        { icon: <Star className="h-3.5 w-3.5" />, label: 'Rating', value: selected.google_rating ? `${selected.google_rating} of 5 (${selected.review_count || 0})` : null, field: null },
                      ].map(item => (
                        <div key={item.label} className="rounded-lg border border-border/60 bg-card p-2.5">
                          <div className="mb-1 flex items-center gap-1.5">
                            <span className="text-muted-foreground/70">{item.icon}</span>
                            <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{item.label}</span>
                          </div>
                          <span className="block truncate text-[11px] text-ink-2">{item.value || <span className="text-muted-foreground/50">Not set</span>}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <span className="flex items-center gap-1 font-mono text-[9px] tabular-nums text-muted-foreground/70"><Clock className="h-2.5 w-2.5" /> Created {format(new Date(selected.created_at), 'dd MMM yyyy')}</span>
                      <span className="flex items-center gap-1 font-mono text-[9px] tabular-nums text-muted-foreground/70"><RefreshCw className="h-2.5 w-2.5" /> Updated {formatDistanceToNow(new Date(selected.updated_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col">
                    <div className="shrink-0 border-b border-border/60 p-3">
                      <div className="overflow-hidden rounded-lg border border-border/60 bg-foreground/[0.02] [&>textarea]:!text-foreground [&>textarea::placeholder]:!text-muted-foreground">
                        <textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a note…" rows={2} className="w-full bg-transparent text-[11px] text-[#ccc] placeholder:text-[#555] outline-none p-2.5 resize-none" />
                        <div className="flex items-center justify-end p-1.5 pt-0">
                          <button onClick={addNote} disabled={!newNote.trim() || savingNote} className="flex h-6 items-center gap-1 rounded-md bg-primary px-3 text-[10px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105 disabled:opacity-30">
                            <Send className="h-3 w-3" /> {savingNote ? 'Adding' : 'Add note'}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-3 overflow-y-auto p-3">
                      {notes.map(note => (
                        <div key={note.id} className="rounded-lg border border-border/60 bg-card p-3">
                          <div className="mb-1.5 flex items-center gap-1.5">
                            <FileText className="h-3 w-3 text-primary" />
                            <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Note</span>
                            <span className="ml-auto text-[8px] tabular-nums text-muted-foreground/70">{formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}</span>
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
                            <span className="text-[10px] text-muted-foreground">Status to <StatusBadge tone={statusMeta(h.new_status).tone} label={statusMeta(h.new_status).label} className="text-[10px]" /></span>
                            <span className="mt-0.5 block text-[8px] tabular-nums text-muted-foreground/70">{formatDistanceToNow(new Date(h.changed_at), { addSuffix: true })}</span>
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
                )}
              </div>
            </>
          ) : (
            /* Mobile contact list */
            <div className="flex min-h-0 flex-1 flex-col bg-background">
              <div className="shrink-0 border-b border-border/60 p-2">
                <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.03] px-2 py-2 [&>input]:!text-foreground [&>input::placeholder]:!text-muted-foreground">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input type="text" placeholder="Search contacts…" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="bg-transparent text-[12px] text-[#ccc] placeholder:text-[#555] outline-none flex-1" />
                  {searchQuery && <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
              <div
                className="scrollbar-hide flex-1 overflow-y-auto overscroll-contain"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                {loading ? (
                  <SkeletonLedger rows={6} />
                ) : filtered.length === 0 ? (
                  <div className="flex h-32 flex-col items-center justify-center text-muted-foreground"><Users className="mb-1.5 h-5 w-5" /><span className="text-[10px]">No contacts found</span></div>
                ) : filtered.map(c => {
                  const sc = statusMeta(c.status);
                  return (
                    <button key={c.id} onClick={() => { setSelectedId(c.id); setEditingContact(false); setMobileTab('details'); }}
                      className="w-full border-b border-border/60 px-3 py-3 text-left transition-colors duration-150 active:bg-foreground/[0.04]">
                      <div className="flex items-center gap-3">
                        <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-semibold', TONE_BG[sc.tone], TONE_TEXT[sc.tone])}>{getInitials(c)}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[12px] font-medium text-foreground">{getDisplayName(c)}</span>
                            <StatusDot tone={sc.tone} />
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            {c.category && <span className="truncate text-[10px] text-muted-foreground">{c.category}</span>}
                            <span className="ml-auto text-[9px] tabular-nums text-muted-foreground/70">{formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
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
          <div className="flex h-full flex-col bg-background">
            {/* Search */}
            <div className="shrink-0 border-b border-border/60 p-2">
              <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.03] px-2 py-1.5">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search contacts…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[11px] text-foreground outline-none placeholder:text-muted-foreground/60"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} aria-label="Clear search" className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between px-1">
                <span className="text-[9px] font-medium tabular-nums text-muted-foreground">{filtered.length} contacts</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as SortOption)}
                  className="cursor-pointer bg-transparent text-[9px] text-muted-foreground outline-none"
                >
                  <option value="updated">Last Updated</option>
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
              ) : filtered.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
                  <Users className="mb-1.5 h-5 w-5" />
                  <span className="text-[10px]">No contacts found</span>
                </div>
              ) : viewMode === 'list' ? (
                filtered.map(c => {
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
                          {c.category && (
                            <span className="block truncate text-[9px] text-muted-foreground">{c.category}</span>
                          )}
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
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-px bg-border transition-colors duration-150 hover:bg-primary" />

        {/* ── Center: Contact Detail ── */}
        <ResizablePanel defaultSize={44}>
          <div className="scrollbar-hide h-full overflow-y-auto bg-background">
            {!selected ? (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <Target className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <span className="text-[13px] font-medium">Select a contact</span>
                <span className="mt-1 text-[10px] text-muted-foreground/70">Choose from the list to view details</span>
              </div>
            ) : (
              <div className="space-y-5 p-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-[10px] text-sm font-semibold', TONE_BG[statusMeta(selected.status).tone], TONE_TEXT[statusMeta(selected.status).tone])}>
                      {getInitials(selected)}
                    </div>
                    <div>
                      {editingContact ? (
                        <input
                          value={editForm.business_name || editForm.personal_name || ''}
                          onChange={e => setEditForm(f => ({ ...f, business_name: e.target.value }))}
                          className="rounded border border-border/60 bg-foreground/[0.03] px-2 py-1 text-[14px] font-semibold text-foreground outline-none transition-colors duration-150 focus:border-primary/60"
                        />
                      ) : (
                        <h2 className="text-[16px] font-semibold text-foreground">{getDisplayName(selected)}</h2>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge tone={statusMeta(selected.status).tone} label={statusMeta(selected.status).label} className="text-[10px]" />
                        {selected.source && sourceLine(selected.source)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
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
                        <button
                          onClick={() => setFullScreenLead(selected)}
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]"
                          title="Open full screen"
                        >
                          <Maximize2 className="h-3.5 w-3.5 text-primary" />
                        </button>
                        <button
                          onClick={() => { setEditingContact(true); setEditForm(selected); }}
                          aria-label="Edit contact"
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]"
                        >
                          <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => deleteContact(selected.id)}
                          aria-label="Delete contact"
                          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-risk" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Pipeline Stage Selector */}
                <div className="rounded-[10px] border border-border/60 bg-card p-3">
                  <span className="mb-2 block font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Pipeline stage</span>
                  <div className="flex flex-wrap gap-1.5">
                    {PIPELINE_ORDER.map((stage, i) => {
                      const sc = STATUS_CONFIG[stage];
                      const isActive = selected.status === stage;
                      const isPast = PIPELINE_ORDER.indexOf(selected.status || 'new') > i;
                      return (
                        <button
                          key={stage}
                          onClick={() => updateStatus(selected.id, stage)}
                          className={cn(
                            'flex h-7 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2.5 text-[10px] font-medium transition-colors duration-150',
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

                {/* Contact Info Grid */}
                <div className="grid grid-cols-2 gap-3">
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
                <div className="flex items-center gap-4 pt-2">
                  <span className="flex items-center gap-1 font-mono text-[9px] tabular-nums text-muted-foreground/70">
                    <Clock className="h-2.5 w-2.5" />
                    Created {format(new Date(selected.created_at), 'dd MMM yyyy')}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-[9px] tabular-nums text-muted-foreground/70">
                    <RefreshCw className="h-2.5 w-2.5" />
                    Updated {formatDistanceToNow(new Date(selected.updated_at), { addSuffix: true })}
                  </span>
                  {selected.last_contacted_at && (
                    <span className="flex items-center gap-1 font-mono text-[9px] tabular-nums text-muted-foreground/70">
                      <MessageSquare className="h-2.5 w-2.5" />
                      Contacted {formatDistanceToNow(new Date(selected.last_contacted_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-px bg-border transition-colors duration-150 hover:bg-primary" />

        {/* ── Right: Activity & Notes ── */}
        <ResizablePanel defaultSize={28} minSize={18} maxSize={35}>
          <div className="flex h-full flex-col bg-background">
            {selected ? (
              <>
                {/* Tabs header */}
                <div className="flex shrink-0 items-center gap-0 border-b border-border/60 px-3 pt-2">
                  <span className="border-b-2 border-primary px-2 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-foreground">Activity</span>
                </div>

                {/* Notes input */}
                <div className="shrink-0 border-b border-border/60 p-3">
                  <div className="overflow-hidden rounded-lg border border-border/60 bg-foreground/[0.02]">
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
                        {savingNote ? 'Adding' : 'Add note'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div className="scrollbar-hide flex-1 space-y-3 overflow-y-auto p-3">
                  {/* Notes */}
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

                  {/* Status Changes */}
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
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <BarChart3 className="mb-2 h-8 w-8 text-muted-foreground/40" />
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
      {modalMode === 'add' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setModalMode(null)}
        >
          <div
            className="max-h-[80vh] w-[520px] overflow-y-auto rounded-xl border border-border/60 bg-card p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-primary" />
                <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-foreground">Add a contact</h3>
              </div>
              <button onClick={() => setModalMode(null)} aria-label="Close" className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Toggle: Business vs Personal */}
            <div className="mb-4 flex items-center gap-2">
              {[{ val: false, label: 'Business' }, { val: true, label: 'Personal' }].map(opt => (
                <button
                  key={String(opt.val)}
                  onClick={() => setNewContactForm(f => ({ ...f, is_personal: opt.val }))}
                  className={cn(
                    'h-7 rounded-md border px-3 text-[11px] font-medium transition-colors duration-150',
                    newContactForm.is_personal === opt.val
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border/60 bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground',
                  )}
                >{opt.label}</button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(newContactForm.is_personal ? [
                { key: 'personal_name', label: 'Full name', required: true },
              ] : [
                { key: 'business_name', label: 'Business name', required: true },
                { key: 'contact_name', label: 'Contact person' },
              ]).map(f => (
                <div key={f.key} className={f.key === 'business_name' || f.key === 'personal_name' ? 'col-span-2' : ''}>
                  <label className={LABEL_SM}>
                    {f.label} {f.required && <span className="text-risk">(required)</span>}
                  </label>
                  <input
                    value={(newContactForm as any)[f.key]}
                    onChange={e => setNewContactForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className={FIELD_SM}
                  />
                </div>
              ))}
              {[
                { key: 'email', label: 'Email' },
                { key: 'phone', label: 'Phone' },
                { key: 'website_url', label: 'Website' },
                { key: 'category', label: 'Category / industry' },
                { key: 'location_city', label: 'City' },
                { key: 'location_postcode', label: 'Postcode' },
              ].map(f => (
                <div key={f.key}>
                  <label className={LABEL_SM}>{f.label}</label>
                  <input
                    value={(newContactForm as any)[f.key]}
                    onChange={e => setNewContactForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className={FIELD_SM}
                  />
                </div>
              ))}
              <div>
                <label className={LABEL_SM}>Status</label>
                <select
                  value={newContactForm.status}
                  onChange={e => setNewContactForm(f => ({ ...f, status: e.target.value }))}
                  className={FIELD_SM}
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL_SM}>Source</label>
                <select
                  value={newContactForm.source}
                  onChange={e => setNewContactForm(f => ({ ...f, source: e.target.value }))}
                  className={FIELD_SM}
                >
                  {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.icon} {v.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/60 pt-4">
              <button onClick={() => setModalMode(null)} className="h-8 rounded-md px-4 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06]">
                Cancel
              </button>
              <button
                onClick={addContact}
                disabled={savingContact}
                className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-5 text-[11px] font-semibold text-primary-foreground transition-[filter] duration-150 hover:brightness-105 disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                {savingContact ? 'Adding' : 'Add contact'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Import Modal ─── */}
      {modalMode === 'import' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          onClick={() => setModalMode(null)}
        >
          <div
            className="max-h-[85vh] w-[640px] overflow-y-auto rounded-xl border border-border/60 bg-card p-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-foreground">Import contacts from CSV</h3>
              </div>
              <button onClick={() => setModalMode(null)} aria-label="Close" className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {!importFile ? (
              <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-[10px] border border-dashed border-border transition-colors duration-150 hover:border-primary/50">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <span className="text-[12px] font-medium text-muted-foreground">Click to select a CSV file</span>
                <span className="mt-1 text-[10px] text-muted-foreground/70">Supports .csv files with headers</span>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={e => { if (e.target.files?.[0]) handleImportFile(e.target.files[0]); }}
                />
              </label>
            ) : (
              <>
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-border/60 bg-sunken p-2.5">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="flex-1 truncate text-[11px] font-medium text-foreground">{importFile.name}</span>
                  <span className="text-[10px] tabular-nums text-muted-foreground">{importPreview.length} rows</span>
                  <button onClick={() => { setImportFile(null); setImportPreview([]); }} aria-label="Remove file" className="text-muted-foreground transition-colors duration-150 hover:text-risk">
                    <X className="h-3 w-3" />
                  </button>
                </div>

                {/* Column mapping */}
                <div className="mb-3">
                  <span className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Column mapping</span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(importPreview[0] || {}).map(csvCol => (
                      <div key={csvCol} className="flex items-center gap-2 rounded-lg border border-border/60 bg-sunken p-2">
                        <span className="flex-1 truncate text-[10px] font-medium text-ink-2">{csvCol}</span>
                        <span className="text-[9px] text-muted-foreground" aria-hidden>&gt;</span>
                        <select
                          value={importMapping[csvCol] || ''}
                          onChange={e => setImportMapping(m => ({ ...m, [csvCol]: e.target.value }))}
                          className="w-32 rounded border border-border/60 bg-card px-1.5 py-0.5 text-[10px] text-foreground outline-none"
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
                  <span className="mb-2 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Preview (first 5 rows)</span>
                  <div className="overflow-hidden rounded-lg border border-border/60">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="bg-sunken">
                            {Object.keys(importPreview[0] || {}).filter(col => importMapping[col]).map(col => (
                              <th key={col} className="whitespace-nowrap px-2 py-1.5 text-left font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                                {importMapping[col]?.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t border-border/60">
                              {Object.entries(row).filter(([col]) => importMapping[col]).map(([col, val]) => (
                                <td key={col} className="max-w-[120px] truncate whitespace-nowrap px-2 py-1.5 text-ink-2">{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/60 pt-4">
                  <span className="text-[10px] tabular-nums text-muted-foreground">
                    {importPreview.length} rows will be imported
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setModalMode(null)} className="h-8 rounded-md px-4 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06]">
                      Cancel
                    </button>
                    <button
                      onClick={runImport}
                      disabled={importing || !Object.values(importMapping).some(Boolean)}
                      className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-5 text-[11px] font-semibold text-primary-foreground transition-[filter] duration-150 hover:brightness-105 disabled:opacity-50"
                    >
                      <Upload className="h-3 w-3" />
                      {importing ? 'Importing' : `Import ${importPreview.length} contacts`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Full-screen Lead View */}
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
    </div>
  );
}
