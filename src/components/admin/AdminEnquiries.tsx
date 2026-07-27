import { useState, useEffect, useMemo, useCallback } from 'react';
import { decryptPiiFields } from '@/lib/piiDecrypt';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, Building, Clock, Search, Phone, Globe,
  MessageSquare, Filter, AlertCircle, CheckCircle,
  Users, SlidersHorizontal, RefreshCw, Loader2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  X, Maximize2, Calendar, Package, FileText, MapPin,
  DollarSign, ExternalLink, Save, UserPlus
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: 'New', color: '#60a5fa' },
  contacted: { label: 'Contacted', color: '#facc15' },
  'in-progress': { label: 'In Progress', color: '#a78bfa' },
  completed: { label: 'Completed', color: '#22c55e' },
  closed: { label: 'Closed', color: '#888' },
};

const ITEMS_PER_PAGE = 50;

export default function AdminEnquiries() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
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
      toast.success('Enquiry converted to lead — view it in the CRM');
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
      toast.error('Enquiry has no email — cannot create a client account');
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
      toast.success(`Client created — Customer ID: ${result.customerId}`);
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
      <div className="flex items-start gap-2.5 py-2 border-b last:border-0" style={{ borderColor: '#2a2a2a' }}>
        <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#0073E6' }} />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] uppercase tracking-wider" style={{ color: '#666' }}>{label}</p>
          <p className="text-[11px] font-medium mt-0.5 break-words" style={{ color: '#ddd' }}>{value}</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden lg:rounded-xl lg:border lg:border-[#2a2a2a]"
      style={{ backgroundColor: '#111', color: '#e0e0e0', fontFamily: "'Inter', sans-serif", fontSize: '12px' }}
    >
      {/* ── Top Bar ── */}
      <div className="min-h-11 flex items-center justify-between gap-2 px-2 sm:px-3 py-1.5 shrink-0 lg:rounded-t-xl" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <MessageSquare className="h-3.5 w-3.5 text-[#0073E6]" />
            <span className="text-[11px] font-semibold text-[#ccc] tracking-wide">Enquiries</span>
          </div>
          <div className="w-[1px] h-4 bg-[#333] mx-0.5 shrink-0" />
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar min-w-0">
            {[
              { label: 'Total', value: stats.total, color: '#888' },
              { label: 'New', value: stats.new, color: '#60a5fa' },
              { label: 'In Progress', value: stats.inProgress, color: '#a78bfa' },
              { label: 'Completed', value: stats.completed, color: '#22c55e' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0" style={{ backgroundColor: '#252525', border: '1px solid #2a2a2a' }}>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[9px] font-medium" style={{ color: '#888' }}>{s.label}</span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: s.color }}>{s.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={fetchEnquiries} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors">
            <RefreshCw className="h-3.5 w-3.5 text-[#666]" />
          </button>
          <button
            onClick={() => setShowFilters(f => !f)}
            className={cn(
              "h-7 px-2.5 flex items-center gap-1 rounded-md text-[11px] font-medium transition-colors",
              showFilters ? 'bg-[#0073E6]/20 text-[#60a5fa]' : 'text-[#888] hover:text-[#ccc] hover:bg-[#333]'
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
          </button>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden shrink-0"
            style={{ backgroundColor: '#161616', borderBottom: '1px solid #2a2a2a' }}
          >
            <div className="flex items-center gap-3 px-4 py-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]" />
                <input
                  placeholder="Search enquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-[#ccc] placeholder:text-[#555] outline-none focus:border-[#0073E6]"
                />
              </div>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-2.5 py-1.5 text-[10px] text-[#ccc] outline-none">
                <option value="all">All Status</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Table ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' as any }}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-[#555]" />
          </div>
        ) : enquiries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-[#555]">
            <MessageSquare className="h-10 w-10 mb-3 text-[#333]" />
            <span className="text-[13px] font-medium">No enquiries found</span>
            <span className="text-[10px] text-[#444] mt-1">Try adjusting your filters</span>
          </div>
        ) : (
          <table className="w-full text-[11px] table-fixed">
            <thead>
              <tr style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #2a2a2a' }}>
                <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#888] uppercase tracking-wider">Name</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#888] uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#888] uppercase tracking-wider">Status</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#888] uppercase tracking-wider hidden lg:table-cell">Package</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#888] uppercase tracking-wider hidden sm:table-cell">Budget</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-medium text-[#888] uppercase tracking-wider hidden lg:table-cell">Date</th>
                <th className="w-10 px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((enquiry) => {
                const sc = statusConfig[enquiry.status] || { label: enquiry.status, color: '#888' };
                return (
                  <tr
                    key={enquiry.id}
                    onClick={() => { setSelectedEnquiry(enquiry); setNotes(enquiry.notes || ''); }}
                    className="cursor-pointer transition-colors hover:bg-[#1a1a1a]"
                    style={{ borderBottom: '1px solid #1e1e1e' }}
                  >
                    <td className="px-2 sm:px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}
                        >
                          {getInitials(enquiry)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-medium text-[#ddd] truncate block">{getName(enquiry)}</span>
                          <div className="flex items-center gap-2 text-[9px] text-[#666] min-w-0">
                            <span className="flex items-center gap-0.5 truncate min-w-0"><Mail className="h-2.5 w-2.5 shrink-0" /><span className="truncate">{enquiry.email}</span></span>
                            {enquiry.phone && <span className="flex items-center gap-0.5 hidden sm:flex"><Phone className="h-2.5 w-2.5" />{enquiry.phone}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <span className="text-[10px] text-[#999]">{enquiry.company || '—'}</span>
                    </td>
                    <td className="px-1 sm:px-3 py-2.5 w-[62px] sm:w-auto" onClick={e => e.stopPropagation()}>
                      <select
                        value={enquiry.status}
                        onChange={e => updateStatus(enquiry.id, e.target.value)}
                        className="w-full max-w-[58px] sm:max-w-none appearance-none rounded px-1 py-0.5 text-[9px] sm:text-[10px] font-medium outline-none border border-transparent truncate"
                        style={{ backgroundColor: `${sc.color}20`, color: sc.color }}
                      >
                        {Object.entries(statusConfig).map(([key, config]) => (
                          <option key={key} value={key}>{config.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      {enquiry.selected_package ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium" style={{ backgroundColor: '#0073E612', color: '#60a5fa' }}>
                          {enquiry.selected_package}
                        </span>
                      ) : (
                        <span className="text-[#444] text-[10px]">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 hidden sm:table-cell">
                      <span className="text-[10px] text-[#999]">{enquiry.budget || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span className="text-[10px] text-[#666]">
                        {format(new Date(enquiry.created_at), 'MMM d, yyyy')}
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2.5 w-[78px] sm:w-auto" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setConvertTarget(enquiry); setConvertPassword(''); }}
                          className="h-6 px-1.5 flex items-center gap-1 rounded text-[9px] font-semibold bg-[#0073E6]/15 text-[#60a5fa] hover:bg-[#0073E6]/30 transition-colors"
                          title="Convert to client account"
                        >
                          <UserPlus className="h-3 w-3" /> Client
                        </button>
                        <button
                          onClick={() => { setSelectedEnquiry(enquiry); setNotes(enquiry.notes || ''); }}
                          className="h-6 w-6 hidden sm:flex items-center justify-center rounded hover:bg-[#333] transition-colors"
                          title="View details"
                        >
                          <Maximize2 className="h-3 w-3 text-[#666]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalCount > 0 && (
        <div className="h-10 flex items-center justify-between px-4 shrink-0 rounded-b-xl" style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid #2a2a2a' }}>
          <span className="text-[10px] text-[#666]">
            {showingFrom.toLocaleString()} – {showingTo.toLocaleString()} of {totalCount.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#333] disabled:opacity-30"><ChevronsLeft className="h-3.5 w-3.5 text-[#999]" /></button>
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#333] disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5 text-[#999]" /></button>
            <span className="text-[10px] text-[#888] px-2 tabular-nums">Page {currentPage} of {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#333] disabled:opacity-30"><ChevronRight className="h-3.5 w-3.5 text-[#999]" /></button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#333] disabled:opacity-30"><ChevronsRight className="h-3.5 w-3.5 text-[#999]" /></button>
          </div>
        </div>
      )}

      {/* ── Detail Dialog ── */}
      {selectedEnquiry && (
        <Dialog open={!!selectedEnquiry} onOpenChange={() => setSelectedEnquiry(null)}>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-0 border-0" style={{ backgroundColor: '#161616', color: '#e0e0e0' }}>
            <div className="px-5 py-4" style={{ borderBottom: '1px solid #2a2a2a' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(96,165,250,0.12)', color: '#60a5fa' }}>
                  {getInitials(selectedEnquiry)}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#eee]">{getName(selectedEnquiry)}</h2>
                  <p className="text-[10px] text-[#888]">{selectedEnquiry.email}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => { setConvertTarget(selectedEnquiry); setConvertPassword(''); }}
                    className="h-7 px-2.5 flex items-center gap-1.5 rounded-md text-[10px] font-semibold bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors"
                    title="Convert this enquiry into a client account"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Convert to Client
                  </button>
                  <select
                    value={selectedEnquiry.status}
                    onChange={e => { updateStatus(selectedEnquiry.id, e.target.value); setSelectedEnquiry({ ...selectedEnquiry, status: e.target.value }); }}
                    className="rounded-md px-2 py-1 text-[10px] font-medium outline-none border border-transparent"
                    style={{ backgroundColor: `${(statusConfig[selectedEnquiry.status]?.color || '#888')}20`, color: statusConfig[selectedEnquiry.status]?.color || '#888' }}
                  >
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <option key={key} value={key}>{config.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <Tabs defaultValue="contact" className="px-5 py-3">
              <TabsList className="h-8 p-0.5 rounded-lg" style={{ backgroundColor: '#1e1e1e' }}>
                <TabsTrigger value="contact" className="text-[10px] h-7 px-3 rounded-md data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-[#eee] text-[#888]">Contact</TabsTrigger>
                <TabsTrigger value="project" className="text-[10px] h-7 px-3 rounded-md data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-[#eee] text-[#888]">Project</TabsTrigger>
                <TabsTrigger value="business" className="text-[10px] h-7 px-3 rounded-md data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-[#eee] text-[#888]">Business</TabsTrigger>
                <TabsTrigger value="notes" className="text-[10px] h-7 px-3 rounded-md data-[state=active]:bg-[#2a2a2a] data-[state=active]:text-[#eee] text-[#888]">Notes</TabsTrigger>
              </TabsList>

              <TabsContent value="contact" className="mt-3 space-y-0">
                <InfoRow icon={Mail} label="Email" value={selectedEnquiry.email} />
                <InfoRow icon={Phone} label="Phone" value={selectedEnquiry.phone} />
                <InfoRow icon={Building} label="Company" value={selectedEnquiry.company} />
                <InfoRow icon={Globe} label="Website" value={selectedEnquiry.website} />
                <InfoRow icon={MapPin} label="Address" value={selectedEnquiry.business_address} />
                <InfoRow icon={MessageSquare} label="How They Heard" value={selectedEnquiry.how_did_you_hear} />
              </TabsContent>

              <TabsContent value="project" className="mt-3 space-y-0">
                <InfoRow icon={Package} label="Package" value={selectedEnquiry.selected_package} />
                <InfoRow icon={DollarSign} label="Budget" value={selectedEnquiry.budget} />
                <InfoRow icon={FileText} label="Page Count" value={selectedEnquiry.page_count} />
                <InfoRow icon={Clock} label="Timeline" value={selectedEnquiry.timeline} />
                <InfoRow icon={AlertCircle} label="Primary Goal" value={selectedEnquiry.primary_goal} />
                <InfoRow icon={FileText} label="Project Details" value={selectedEnquiry.project_details} />
                {selectedEnquiry.must_have_features && selectedEnquiry.must_have_features.length > 0 && (
                  <div className="flex items-start gap-2.5 py-2 border-b last:border-0" style={{ borderColor: '#2a2a2a' }}>
                    <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: '#0073E6' }} />
                    <div className="flex-1">
                      <p className="text-[9px] uppercase tracking-wider" style={{ color: '#666' }}>Must-Have Features</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedEnquiry.must_have_features.map((f, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#252525', color: '#aaa', border: '1px solid #2a2a2a' }}>{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <InfoRow icon={ExternalLink} label="Competitors" value={selectedEnquiry.competitors} />
                <InfoRow icon={ExternalLink} label="Inspiration Sites" value={selectedEnquiry.inspiration_sites} />
              </TabsContent>

              <TabsContent value="business" className="mt-3 space-y-0">
                <InfoRow icon={Building} label="Business Type" value={selectedEnquiry.business_type} />
                <InfoRow icon={Users} label="Employee Count" value={selectedEnquiry.employee_count} />
                <InfoRow icon={Calendar} label="Years in Business" value={selectedEnquiry.years_in_business} />
                <InfoRow icon={Globe} label="Existing Site" value={selectedEnquiry.has_existing_site} />
                <InfoRow icon={ExternalLink} label="Social Media" value={selectedEnquiry.social_media} />
                <InfoRow icon={FileText} label="Brand Colors" value={selectedEnquiry.brand_colors} />
                <InfoRow icon={FileText} label="Additional Notes" value={selectedEnquiry.additional_notes} />
              </TabsContent>

              <TabsContent value="notes" className="mt-3">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Add internal notes..."
                  rows={8}
                  className="w-full rounded-lg p-3 text-[11px] outline-none resize-none"
                  style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a', color: '#ddd' }}
                />
                <button
                  onClick={saveNotes}
                  className="mt-2 h-8 px-4 flex items-center gap-1.5 rounded-md text-[11px] font-medium bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors"
                >
                  <Save className="h-3.5 w-3.5" /> Save Notes
                </button>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Convert to Client modal */}
      <Dialog open={!!convertTarget} onOpenChange={(o) => { if (!o) { setConvertTarget(null); setConvertPassword(''); } }}>
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-md p-0 overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111]">
          <DialogHeader className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2">
            <DialogTitle className="text-sm font-semibold text-[#eee] flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#60a5fa]" /> Convert to Client
            </DialogTitle>
          </DialogHeader>
          {convertTarget && (
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-3">
              <p className="text-[11px] text-[#888] leading-relaxed">
                Creates a client account for <span className="text-[#ddd] font-medium">{getName(convertTarget)}</span>
                {convertTarget.email && <> (<span className="text-[#ddd]">{convertTarget.email}</span>)</>}. The full enquiry submission will be attached to their client record.
              </p>
              <div className="space-y-1.5">
                <label className="block text-[10px] uppercase tracking-wider text-[#777]">Temporary password</label>
                <input
                  type="text"
                  autoFocus
                  value={convertPassword}
                  onChange={(e) => setConvertPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-3 py-2 text-[12px] text-[#eee] placeholder:text-[#555] outline-none focus:border-[#0073E6]"
                />
                <p className="text-[10px] text-[#666]">Share this with the client so they can sign in and change it.</p>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setConvertTarget(null); setConvertPassword(''); }}
                  className="flex-1 h-9 rounded-md text-[11px] font-medium border border-[#2a2a2a] text-[#bbb] hover:bg-[#1a1a1a]"
                  disabled={converting}
                >
                  Cancel
                </button>
                <button
                  onClick={convertToClient}
                  disabled={converting || convertPassword.length < 6}
                  className="flex-1 h-9 rounded-md text-[11px] font-semibold bg-[#0073E6] text-white hover:bg-[#005bb5] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {converting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  {converting ? 'Creating…' : 'Create Client'}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
