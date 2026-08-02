import { useState, useEffect, useMemo, useCallback } from 'react';
import { decryptPiiFields } from '@/lib/piiDecrypt';
import {
  Mail, Building, Clock, Search, Phone, Globe,
  MessageSquare, AlertCircle, CheckCircle,
  Users, SlidersHorizontal, RefreshCw,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Maximize2, Calendar, Package, FileText, MapPin,
  PoundSterling, ExternalLink, Save, UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  DataTable, DetailDrawer, StatusDot, StatusBadge, RelativeTime,
  type Column, type Tone,
} from '@/components/platform';
import { EnquiryPipeline } from './EnquiryPipeline';
import { LayoutDashboard, Table2 } from 'lucide-react';

interface Enquiry {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  company: string | null;
  phone: string | null;
  interest: string | null;
  project_details: string | null;
  page_count: string | null;
  budget: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  business_type: string | null;
  business_address: string | null;
  website: string | null;
  employee_count: string | null;
  years_in_business: string | null;
  selected_package: string | null;
  timeline: string | null;
  has_existing_site: string | null;
  primary_goal: string | null;
  must_have_features: string[] | null;
  competitors: string | null;
  brand_colors: string | null;
  inspiration_sites: string | null;
  how_did_you_hear: string | null;
  social_media: string | null;
  additional_notes: string | null;
}

/* The enquiry pipeline on the platform's muted tone vocabulary — the old
   per-status hex map is gone. Attend marks the fresh arrivals. */
const statusConfig: Record<string, { label: string; tone: Tone }> = {
  new: { label: 'New', tone: 'attend' },
  contacted: { label: 'Contacted', tone: 'neutral' },
  'in-progress': { label: 'In progress', tone: 'accent' },
  completed: { label: 'Completed', tone: 'ok' },
  closed: { label: 'Closed', tone: 'neutral' },
};

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok', attend: 'text-attend', risk: 'text-risk',
  neutral: 'text-ink-2', accent: 'text-primary',
};

const statusMeta = (status: string) =>
  statusConfig[status] || { label: status, tone: 'neutral' as Tone };

const ITEMS_PER_PAGE = 50;

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [desk, setDesk] = useState<'list' | 'pipeline'>('list');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [notes, setNotes] = useState('');
  const [convertTarget, setConvertTarget] = useState<Enquiry | null>(null);
  const [convertPassword, setConvertPassword] = useState('');
  const [converting, setConverting] = useState(false);

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('enquiries').select('*', { count: 'exact' });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      toast.error('Failed to load enquiries');
    } else {
      const decrypted = await decryptPiiFields((data || []) as any[], ['phone']);
      setEnquiries(decrypted as any);
      if (count !== null) setTotalCount(count);
    }
    setLoading(false);
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);
  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchTerm]);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const showingTo = Math.min(currentPage * ITEMS_PER_PAGE, totalCount);

  const stats = useMemo(() => ({
    total: totalCount,
    new: enquiries.filter(e => e.status === 'new').length,
    inProgress: enquiries.filter(e => e.status === 'in-progress').length,
    completed: enquiries.filter(e => e.status === 'completed').length,
  }), [enquiries, totalCount]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from('enquiries').update({ status: newStatus }).eq('id', id);
    if (error) toast.error('Failed to update status');
    else { toast.success('Status updated'); fetchEnquiries(); }
  };

  const saveNotes = async () => {
    if (!selectedEnquiry) return;
    const { error } = await supabase.from('enquiries').update({ notes }).eq('id', selectedEnquiry.id);
    if (error) toast.error('Failed to save notes');
    else { toast.success('Notes saved'); fetchEnquiries(); }
  };

  const convertToLead = async (enquiry: Enquiry) => {
    try {
      // Check if a lead already exists with the same email
      if (enquiry.email) {
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('email', enquiry.email)
          .maybeSingle();
        if (existing) {
          toast.info('A lead with this email already exists in the CRM');
          return;
        }
      }

      const name = getName(enquiry);
      const { error: insertError } = await supabase.from('leads').insert({
        business_name: enquiry.company || null,
        personal_name: !enquiry.company ? name : null,
        contact_name: name,
        is_personal: !enquiry.company,
        phone: enquiry.phone || null,
        email: enquiry.email,
        website_url: enquiry.website || null,
        category: enquiry.business_type || enquiry.interest || null,
        source: 'manual',
        status: 'new',
        tags: ['from-enquiry'],
        enquiry_id: enquiry.id,
        enquiry_data: enquiry as any,
      });

      if (insertError) {
        console.error(insertError);
        toast.error('Failed to convert enquiry to lead');
        return;
      }

      // Mark enquiry as in-progress to indicate it's been converted
      await supabase.from('enquiries').update({ status: 'in-progress' }).eq('id', enquiry.id);
      toast.success('Enquiry converted to lead. View it in the CRM');
      setSelectedEnquiry(null);
      fetchEnquiries();
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert enquiry to lead');
    }
  };

  const convertToClient = async () => {
    if (!convertTarget) return;
    if (!convertTarget.email) {
      toast.error('Enquiry has no email, so a client account cannot be created');
      return;
    }
    if (convertPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setConverting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        setConverting(false);
        return;
      }
      const fullName = getName(convertTarget);
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: convertTarget.email,
          password: convertPassword,
          fullName,
          company: convertTarget.company || undefined,
          phone: convertTarget.phone || undefined,
          plan: convertTarget.selected_package || undefined,
          pageCount: convertTarget.page_count || undefined,
          notes: convertTarget.additional_notes || convertTarget.notes || undefined,
          websiteStatus: 'design',
          enquiryId: convertTarget.id,
          enquiryData: convertTarget,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.error || 'Failed to convert to client');
        return;
      }
      toast.success(`Client created. Customer ID: ${result.customerId}`);
      setConvertTarget(null);
      setConvertPassword('');
      setSelectedEnquiry(null);
      fetchEnquiries();
    } catch (err) {
      console.error(err);
      toast.error('Failed to convert enquiry to client');
    } finally {
      setConverting(false);
    }
  };


  const getName = (e: Enquiry) =>
    e.first_name && e.last_name ? `${e.first_name} ${e.last_name}` : e.name;

  const getInitials = (e: Enquiry) => {
    const name = getName(e);
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-2.5 border-b border-border/60 py-2 last:border-0">
        <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">{label}</p>
          <p className="mt-0.5 break-words text-[11px] font-medium text-ink-2">{value}</p>
        </div>
      </div>
    );
  };

  const statPills = [
    { label: 'Total', value: stats.total, tone: 'neutral' as Tone },
    { label: 'New', value: stats.new, tone: 'attend' as Tone },
    { label: 'In progress', value: stats.inProgress, tone: 'accent' as Tone },
    { label: 'Completed', value: stats.completed, tone: 'ok' as Tone },
  ];

  const statusSelect = (enquiry: Enquiry) => (
    <span onClick={e => e.stopPropagation()}>
      <select
        value={enquiry.status}
        onChange={e => updateStatus(enquiry.id, e.target.value)}
        aria-label="Change status"
        className={cn(
          'w-full max-w-[110px] cursor-pointer appearance-none truncate rounded border border-border/60 bg-transparent px-1.5 py-0.5 text-[10px] font-medium outline-none transition-colors duration-150 focus:border-primary/60',
          TONE_TEXT[statusMeta(enquiry.status).tone],
        )}
      >
        {Object.entries(statusConfig).map(([key, config]) => (
          <option key={key} value={key}>{config.label}</option>
        ))}
      </select>
    </span>
  );

  const convertButton = (enquiry: Enquiry) => (
    <span onClick={e => e.stopPropagation()} className="flex items-center justify-end gap-1">
      <button
        onClick={() => { setConvertTarget(enquiry); setConvertPassword(''); }}
        className="flex h-6 items-center gap-1 rounded border border-border/60 px-1.5 text-[9px] font-semibold text-ink-2 transition-colors duration-150 hover:bg-foreground/[0.04] hover:text-foreground"
        title="Convert to client account"
      >
        <UserPlus className="h-3 w-3" /> Client
      </button>
      <button
        onClick={() => { setSelectedEnquiry(enquiry); setNotes(enquiry.notes || ''); }}
        className="hidden h-6 w-6 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06] sm:flex"
        title="View details"
      >
        <Maximize2 className="h-3 w-3 text-muted-foreground" />
      </button>
    </span>
  );

  const columns: Column<Enquiry>[] = [
    {
      key: 'name',
      header: 'Name',
      sortValue: (e) => getName(e).toLowerCase(),
      render: (enquiry) => (
        <div className="flex min-w-0 items-center gap-2 py-1">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06] text-[10px] font-semibold text-ink-2">
            {getInitials(enquiry)}
          </div>
          <div className="min-w-0 flex-1">
            <span className="block truncate text-[11px] font-medium text-foreground">{getName(enquiry)}</span>
            <span className="block truncate text-[9px] text-muted-foreground">{enquiry.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'company',
      header: 'Company',
      hideBelowMd: true,
      sortValue: (e) => (e.company || '').toLowerCase(),
      render: (enquiry) => (
        <span className="text-[10px] text-ink-2">{enquiry.company || <span className="text-muted-foreground/50">·</span>}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (e) => e.status,
      render: statusSelect,
    },
    {
      key: 'package',
      header: 'Package',
      hideBelowMd: true,
      sortValue: (e) => e.selected_package || '',
      render: (enquiry) =>
        enquiry.selected_package ? (
          <span className="rounded-md border border-border/60 bg-sunken px-1.5 py-0.5 text-[10px] font-medium text-ink-2">
            {enquiry.selected_package}
          </span>
        ) : (
          <span className="text-[10px] text-muted-foreground/50">·</span>
        ),
    },
    {
      key: 'budget',
      header: 'Budget',
      hideBelowMd: true,
      sortValue: (e) => e.budget || '',
      render: (enquiry) => (
        <span className="text-[10px] tabular-nums text-ink-2">{enquiry.budget || <span className="text-muted-foreground/50">·</span>}</span>
      ),
    },
    {
      key: 'date',
      header: 'Received',
      hideBelowMd: true,
      mono: true,
      sortValue: (e) => e.created_at,
      render: (enquiry) => <RelativeTime date={enquiry.created_at} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: convertButton,
    },
  ];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-background text-[12px] text-foreground lg:rounded-[10px] lg:border lg:border-border/60">
      {/* ── Top Bar ── */}
      <div className="flex min-h-11 shrink-0 items-center justify-between gap-2 border-b border-border/60 bg-card px-2 py-1.5 sm:px-3 lg:rounded-t-[10px]">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex shrink-0 items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-semibold tracking-wide text-foreground">Enquiries</span>
          </div>
          <div className="mx-0.5 h-4 w-px shrink-0 bg-border" />
          <div className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto">
            {statPills.map(s => (
              <div key={s.label} className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-border/60 bg-sunken px-1.5 py-0.5">
                <StatusDot tone={s.tone} />
                <span className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-muted-foreground">{s.label}</span>
                <span className="text-[10px] font-semibold tabular-nums text-foreground">{s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="mr-1 flex items-center gap-0.5 rounded-[8px] border border-border/50 bg-sunken p-0.5">
            {([
              { id: 'list' as const, label: 'Enquiries', icon: Table2 },
              { id: 'pipeline' as const, label: 'Dashboard', icon: LayoutDashboard },
            ]).map(v => (
              <button
                key={v.id}
                onClick={() => setDesk(v.id)}
                aria-pressed={desk === v.id}
                className={cn(
                  'flex h-6 items-center gap-1.5 rounded-[6px] px-2 text-[11px] transition-colors duration-150',
                  desk === v.id ? 'bg-card font-medium text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <v.icon className="h-3 w-3" /> {v.label}
              </button>
            ))}
          </div>
          <button onClick={fetchEnquiries} title="Refresh" className="flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={cn(
              'flex h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium transition-colors duration-150',
              showFilters ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </button>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      {desk === 'list' && showFilters && (
        <div className="shrink-0 border-b border-border/60 bg-sunken">
          <div className="flex flex-wrap items-center gap-3 px-4 py-2">
            <div className="relative min-w-[200px] max-w-[300px] flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                placeholder="Search enquiries…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-foreground/[0.03] py-1.5 pl-8 pr-3 text-[11px] text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground/60 focus:border-primary/60"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="cursor-pointer rounded-lg border border-border/60 bg-foreground/[0.03] px-2.5 py-1.5 text-[10px] text-foreground outline-none"
            >
              <option value="all">All statuses</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* ── Pipeline desk ── */}
      {desk === 'pipeline' && (
        <div className="min-h-0 flex-1">
          <EnquiryPipeline enquiries={enquiries as any} totalCount={totalCount} />
        </div>
      )}

      {/* ── Table ── */}
      <div className={cn('flex-1 overflow-y-auto overscroll-contain', desk !== 'list' && 'hidden')} style={{ WebkitOverflowScrolling: 'touch' as any }}>
        <DataTable
          rows={enquiries}
          columns={columns}
          rowKey={(e) => e.id}
          loading={loading}
          empty={{ title: 'No enquiries found', body: 'Try adjusting your filters.' }}
          onRowClick={(enquiry) => { setSelectedEnquiry(enquiry); setNotes(enquiry.notes || ''); }}
          aria-label="Enquiries"
          mobileCard={(enquiry) => (
            <button
              type="button"
              onClick={() => { setSelectedEnquiry(enquiry); setNotes(enquiry.notes || ''); }}
              className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-150 active:bg-foreground/[0.04]"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.06] text-[10px] font-semibold text-ink-2">
                {getInitials(enquiry)}
              </div>
              <div className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-foreground">{getName(enquiry)}</span>
                <span className="block truncate text-[10px] text-muted-foreground">{enquiry.email}</span>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <StatusBadge tone={statusMeta(enquiry.status).tone} label={statusMeta(enquiry.status).label} className="text-[10px]" />
                <RelativeTime date={enquiry.created_at} />
              </div>
            </button>
          )}
        />
      </div>

      {/* ── Pagination ── */}
      {desk === 'list' && totalCount > 0 && (
        <div className="flex h-10 shrink-0 items-center justify-between border-t border-border/60 bg-card px-4 lg:rounded-b-[10px]">
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {showingFrom.toLocaleString()} to {showingTo.toLocaleString()} of {totalCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} aria-label="First page" className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06] disabled:opacity-30"><ChevronsLeft className="h-3.5 w-3.5 text-muted-foreground" /></button>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} aria-label="Previous page" className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06] disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" /></button>
            <span className="px-2 font-mono text-[10px] tabular-nums text-muted-foreground">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} aria-label="Next page" className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06] disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} aria-label="Last page" className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06] disabled:opacity-30"><ChevronsRight className="h-3.5 w-3.5 text-muted-foreground" /></button>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ── */}
      {selectedEnquiry && (
        <DetailDrawer
          open={!!selectedEnquiry}
          onOpenChange={() => setSelectedEnquiry(null)}
          wide
          kicker="Enquiry"
          title={getName(selectedEnquiry)}
          description={selectedEnquiry.email}
          footer={
            <>
              <StatusBadge
                tone={statusMeta(selectedEnquiry.status).tone}
                label={statusMeta(selectedEnquiry.status).label}
                className="mr-auto"
              />
              <select
                value={selectedEnquiry.status}
                onChange={e => { updateStatus(selectedEnquiry.id, e.target.value); setSelectedEnquiry({ ...selectedEnquiry, status: e.target.value }); }}
                aria-label="Change status"
                className="cursor-pointer rounded-md border border-border/60 bg-transparent px-2 py-1 text-[10px] font-medium text-foreground outline-none"
              >
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
              <button
                onClick={() => { setConvertTarget(selectedEnquiry); setConvertPassword(''); }}
                className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-2.5 text-[10px] font-semibold text-primary-foreground transition-[filter] duration-150 hover:brightness-105"
                title="Convert this enquiry into a client account"
              >
                <UserPlus className="h-3.5 w-3.5" /> Convert to client
              </button>
            </>
          }
        >
          <Tabs defaultValue="contact">
            <TabsList className="h-8 rounded-lg border border-border/60 bg-sunken p-0.5">
              <TabsTrigger value="contact" className="h-7 rounded-md px-3 text-[10px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground">Contact</TabsTrigger>
              <TabsTrigger value="project" className="h-7 rounded-md px-3 text-[10px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground">Project</TabsTrigger>
              <TabsTrigger value="business" className="h-7 rounded-md px-3 text-[10px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground">Business</TabsTrigger>
              <TabsTrigger value="notes" className="h-7 rounded-md px-3 text-[10px] text-muted-foreground data-[state=active]:bg-card data-[state=active]:text-foreground">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="contact" className="mt-3 space-y-0">
              <InfoRow icon={Mail} label="Email" value={selectedEnquiry.email} />
              <InfoRow icon={Phone} label="Phone" value={selectedEnquiry.phone} />
              <InfoRow icon={Building} label="Company" value={selectedEnquiry.company} />
              <InfoRow icon={Globe} label="Website" value={selectedEnquiry.website} />
              <InfoRow icon={MapPin} label="Address" value={selectedEnquiry.business_address} />
              <InfoRow icon={MessageSquare} label="How they heard" value={selectedEnquiry.how_did_you_hear} />
            </TabsContent>

            <TabsContent value="project" className="mt-3 space-y-0">
              <InfoRow icon={Package} label="Package" value={selectedEnquiry.selected_package} />
              <InfoRow icon={PoundSterling} label="Budget" value={selectedEnquiry.budget} />
              <InfoRow icon={FileText} label="Page count" value={selectedEnquiry.page_count} />
              <InfoRow icon={Clock} label="Timeline" value={selectedEnquiry.timeline} />
              <InfoRow icon={AlertCircle} label="Primary goal" value={selectedEnquiry.primary_goal} />
              <InfoRow icon={FileText} label="Project details" value={selectedEnquiry.project_details} />
              {selectedEnquiry.must_have_features && selectedEnquiry.must_have_features.length > 0 && (
                <div className="flex items-start gap-2.5 border-b border-border/60 py-2 last:border-0">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="flex-1">
                    <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">Must-have features</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedEnquiry.must_have_features.map((f, i) => (
                        <span key={i} className="rounded border border-border/60 bg-sunken px-1.5 py-0.5 text-[9px] text-ink-2">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <InfoRow icon={ExternalLink} label="Competitors" value={selectedEnquiry.competitors} />
              <InfoRow icon={ExternalLink} label="Inspiration sites" value={selectedEnquiry.inspiration_sites} />
            </TabsContent>

            <TabsContent value="business" className="mt-3 space-y-0">
              <InfoRow icon={Building} label="Business type" value={selectedEnquiry.business_type} />
              <InfoRow icon={Users} label="Employee count" value={selectedEnquiry.employee_count} />
              <InfoRow icon={Calendar} label="Years in business" value={selectedEnquiry.years_in_business} />
              <InfoRow icon={Globe} label="Existing site" value={selectedEnquiry.has_existing_site} />
              <InfoRow icon={ExternalLink} label="Social media" value={selectedEnquiry.social_media} />
              <InfoRow icon={FileText} label="Brand colours" value={selectedEnquiry.brand_colors} />
              <InfoRow icon={FileText} label="Additional notes" value={selectedEnquiry.additional_notes} />
            </TabsContent>

            <TabsContent value="notes" className="mt-3">
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add internal notes…"
                rows={8}
                className="w-full resize-none rounded-lg border border-border/60 bg-foreground/[0.02] p-3 text-[11px] text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground/60 focus:border-primary/60"
              />
              <button
                onClick={saveNotes}
                className="mt-2 flex h-8 items-center gap-1.5 rounded-md bg-primary px-4 text-[11px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105"
              >
                <Save className="h-3.5 w-3.5" /> Save notes
              </button>
            </TabsContent>
          </Tabs>
        </DetailDrawer>
      )}

      {/* Convert to Client modal */}
      <Dialog open={!!convertTarget} onOpenChange={(o) => { if (!o) { setConvertTarget(null); setConvertPassword(''); } }}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md overflow-hidden rounded-xl border border-border/60 bg-card p-0">
          <DialogHeader className="px-4 pb-2 pt-4 sm:px-5 sm:pt-5">
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <UserPlus className="h-4 w-4 text-primary" /> Convert to client
            </DialogTitle>
          </DialogHeader>
          {convertTarget && (
            <div className="space-y-3 px-4 pb-4 sm:px-5 sm:pb-5">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Creates a client account for <span className="font-medium text-foreground">{getName(convertTarget)}</span>
                {convertTarget.email && <> (<span className="text-foreground">{convertTarget.email}</span>)</>}. The full enquiry submission will be attached to their client record.
              </p>
              <div className="space-y-1.5">
                <label className="block font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Temporary password</label>
                <input
                  type="text"
                  autoFocus
                  value={convertPassword}
                  onChange={(e) => setConvertPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full rounded-lg border border-border/60 bg-foreground/[0.03] px-3 py-2 text-[12px] text-foreground outline-none transition-colors duration-150 placeholder:text-muted-foreground/60 focus:border-primary/60"
                />
                <p className="text-[10px] text-muted-foreground">Share this with the client so they can sign in and change it.</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setConvertTarget(null); setConvertPassword(''); }}
                  className="h-9 flex-1 rounded-md border border-border/60 text-[11px] font-medium text-ink-2 transition-colors duration-150 hover:bg-foreground/[0.04]"
                  disabled={converting}
                >
                  Cancel
                </button>
                <button
                  onClick={convertToClient}
                  disabled={converting || convertPassword.length < 6}
                  className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-md bg-primary text-[11px] font-semibold text-primary-foreground transition-[filter] duration-150 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  {converting ? 'Creating' : 'Create client'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
