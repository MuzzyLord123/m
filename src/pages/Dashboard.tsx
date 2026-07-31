import { useEffect, useState, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Mail, Building, Clock, 
  CheckCircle, AlertCircle, MessageSquare, Filter,
  Search, Phone, Globe, MapPin, Calendar,
  Target, Palette, Instagram, DollarSign, Package,
  FileText, X, ExternalLink, Briefcase, Star,
  Plus, Eye, EyeOff, Image, Trash2, UserPlus, Download,
  CreditCard, Hash, Edit2, Save, Upload, Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { quickSignOut } from '@/hooks/useAuthSync';
import { supabase } from '@/integrations/supabase/client';
import { decryptPiiFields } from '@/lib/piiDecrypt';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminMessaging from '@/components/admin/AdminMessaging';
import AdminAdManagement from '@/components/admin/AdminAdManagement';
import AdminSocialMedia from '@/components/admin/AdminSocialMedia';
import AdminContentRequests from '@/components/admin/AdminContentRequests';
import AdminMarketingCalendar from '@/components/admin/AdminMarketingCalendar';
import AdminWebsiteManagement from '@/components/admin/AdminWebsiteManagement';
import AdminBilling from '@/components/admin/AdminBilling';
import AdminSecurityDashboard from '@/components/admin/AdminSecurityDashboard';
import AdminSiteAnalytics from '@/components/admin/AdminSiteAnalytics';
import AdminLeadManagement from '@/components/admin/AdminLeadManagement';
import SecureImage from '@/components/SecureImage';
import { getSignedUrl } from '@/hooks/useSignedUrl';
import TeamLayout from '@/components/layout/TeamLayout';
import AdminClientAccounts from '@/components/admin/AdminClientAccounts';
import AdminGreetingMessages from '@/components/admin/AdminGreetingMessages';
import AdminInvoices from '@/components/admin/AdminInvoices';
import AdminAppManagement from '@/components/admin/AdminAppManagement';
import AdminAssetManagement from '@/components/admin/AdminAssetManagement';
import AdminSupportTickets from '@/components/admin/AdminSupportTickets';
import AdminAnnouncements from '@/components/admin/AdminAnnouncements';
import AdminEnquiries from '@/components/admin/AdminEnquiries';
import { WorkflowListPage } from '@/components/workflow/WorkflowListPage';
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder';
import { EmptyState, SkeletonBlock, SkeletonLedger } from '@/components/platform';

import AdminCommandCenter from '@/components/admin/AdminCommandCenter';
import AccountCreation from '@/pages/admin/AccountCreation';
import AdminLiveSessions from '@/components/admin/AdminLiveSessions';
import AdminSettings from '@/components/admin/AdminSettings';
import AdminKnowledgeBase from '@/components/admin/AdminKnowledgeBase';
import AdminAutomationRules from '@/components/admin/AdminAutomationRules';
import TeamComms from '@/components/comms/TeamComms';
import AdminRoleManagement from '@/components/admin/AdminRoleManagement';


const LoungeWebsiteDesigner = lazy(() => import("@/pages/lounge/LoungeWebsiteDesigner"));
const LoungeOffice = lazy(() => import("@/pages/lounge/LoungeOffice"));
const OfficeEcommerce = lazy(() => import("@/pages/lounge/OfficeEcommerce"));
const LoungeProducts = lazy(() => import("@/pages/lounge/LoungeProducts"));
const EcommerceShell = lazy(() => import("@/pages/lounge/ecommerce/EcommerceShell"));
function AdminWorkflowsTab() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  if (activeId || isNew) {
    return (
      <div className="h-[calc(100vh-8rem)]">
        <WorkflowBuilder workflowId={activeId || undefined} onBack={() => { setActiveId(null); setIsNew(false); }} />
      </div>
    );
  }
  return <WorkflowListPage onOpenWorkflow={setActiveId} onNewWorkflow={() => setIsNew(true)} />;
}

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

interface ClientProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  customer_id: string | null;
  plan: string | null;
  page_count: string | null;
  status: string | null;
  company: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  website_status: string | null;
  preview_url: string | null;
  enquiry_id?: string | null;
  enquiry_data?: any;
}

interface CustomerUpload {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  image_url: string | null;
  status: string | null;
  created_at: string;
}

const uploadStatusColors: Record<string, string> = {
  pending: 'bg-attend/10 text-attend border-attend/25',
  reviewed: 'bg-muted text-muted-foreground border-border',
  implemented: 'bg-ok/10 text-ok border-ok/25',
  'needs-clarification': 'bg-risk/10 text-risk border-risk/25',
};

const uploadStatusLabels: Record<string, string> = {
  pending: 'Pending',
  reviewed: 'Reviewed',
  implemented: 'Implemented',
  'needs-clarification': 'Needs clarification',
};

const statusColors: Record<string, string> = {
  new: 'bg-primary/10 text-primary border-primary/25',
  contacted: 'bg-muted text-muted-foreground border-border',
  'in-progress': 'bg-attend/10 text-attend border-attend/25',
  completed: 'bg-ok/10 text-ok border-ok/25',
  closed: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  'in-progress': 'In progress',
  completed: 'Completed',
  closed: 'Closed',
};

const clientStatusColors: Record<string, string> = {
  active: 'bg-ok/10 text-ok border-ok/25',
  pending: 'bg-attend/10 text-attend border-attend/25',
  inactive: 'bg-muted text-muted-foreground border-border',
  preview: 'bg-primary/10 text-primary border-primary/25',
};

const websiteStatusOptions = [
  { value: 'design', label: 'Design', color: 'bg-muted-foreground' },
  { value: 'development', label: 'Development', color: 'bg-primary' },
  { value: 'review', label: 'Review', color: 'bg-attend' },
  { value: 'live', label: 'Live', color: 'bg-ok' },
  { value: 'not_published', label: 'Not published', color: 'bg-muted' },
];

const planOptions = [
  'Starter',
  'Growth',
  'Professional',
  'Enterprise',
  'Custom Elite',
  'Preview Only'
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Main tab state - check URL params for security tab
  const urlTabParam = searchParams.get('tab') || '';
  const initialTab = urlTabParam || 'command-center';
  const [mainTab, setMainTab] = useState<'command-center' | 'enquiries' | 'leads' | 'clients' | 'client-accounts' | 'account-creation' | 'greeting-messages' | 'apps' | 'ads' | 'social' | 'content' | 'calendar' | 'websites' | 'website-designer' | 'cad-studio' | 'office' | 'ecommerce' | 'subscription-sites' | 'hosted-sites' | 'invoices' | 'billing' | 'messages' | 'security' | 'site-analytics' | 'assets' | 'tickets' | 'announcements' | 'workflows' | 'live-sessions' | 'settings' | 'knowledge-base' | 'automation-rules' | 'team-comms' | 'roles-permissions'>(initialTab as any);

  // Sync mainTab with URL ?tab= so exiting a full-screen app (like Office) via
  // navigate('/dashboard') actually returns to the command center instead of
  // leaving the previous tab mounted (blank screen on mobile).
  useEffect(() => {
    const urlTab = searchParams.get('tab');
    const next = (urlTab && urlTab.length > 0 ? urlTab : 'command-center') as typeof mainTab;
    if (next !== mainTab) setMainTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);
  
  // Enquiry state
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState<Enquiry[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState('contact');
  
  // Client state
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientProfile[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientStatusFilter, setClientStatusFilter] = useState('all');
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clientUploads, setClientUploads] = useState<CustomerUpload[]>([]);
  const [filteredClientUploads, setFilteredClientUploads] = useState<CustomerUpload[]>([]);
  const [uploadStatusFilter, setUploadStatusFilter] = useState('all');
  const [loadingUploads, setLoadingUploads] = useState(false);
  
  // Create client dialog state
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPassword, setNewClientPassword] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientPlan, setNewClientPlan] = useState('');
  const [newClientPageCount, setNewClientPageCount] = useState('');
  const [newClientWebsiteStatus, setNewClientWebsiteStatus] = useState('design');
  const [newClientPreviewUrl, setNewClientPreviewUrl] = useState('');
  const [newClientType, setNewClientType] = useState<'paid' | 'preview'>('paid');
  const [showPassword, setShowPassword] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  
  // Edit client state
  const [editingClient, setEditingClient] = useState(false);
  const [editClientNotes, setEditClientNotes] = useState('');
  const [previewUrlError, setPreviewUrlError] = useState('');
  
  // Delete client state
  const [showDeleteClient, setShowDeleteClient] = useState(false);
  const [deleteConfirmWord, setDeleteConfirmWord] = useState('');
  const [deleteInputWord, setDeleteInputWord] = useState('');
  const [deletingClient, setDeletingClient] = useState(false);

  // Reset password state
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // URL validation helper
  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Empty is valid (optional field)
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
    return urlPattern.test(url);
  };

  const handlePreviewUrlChange = (value: string) => {
    if (selectedClient) {
      setSelectedClient({...selectedClient, preview_url: value});
      if (value && !validateUrl(value)) {
        setPreviewUrlError('Please enter a valid URL (e.g., example.com or https://example.com)');
      } else {
        setPreviewUrlError('');
      }
    }
  };

  useEffect(() => {
    fetchEnquiries();
    fetchClients();
  }, []);

  useEffect(() => {
    filterEnquiries();
  }, [enquiries, searchTerm, statusFilter]);

  useEffect(() => {
    filterClients();
  }, [clients, clientSearchTerm, clientStatusFilter]);

  const fetchEnquiries = async () => {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load enquiries');
    } else {
      const decrypted = await decryptPiiFields(data || [], ['phone']);
      setEnquiries(decrypted);
    }
    setLoadingEnquiries(false);
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } else {
      const decrypted = await decryptPiiFields(data || [], ['phone']);
      setClients(decrypted);
    }
    setLoadingClients(false);
  };

  const fetchClientUploads = async (userId: string) => {
    setLoadingUploads(true);
    setUploadStatusFilter('all');
    const { data, error } = await supabase
      .from('customer_uploads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching uploads:', error);
      toast.error('Failed to load client uploads');
    } else {
      setClientUploads(data || []);
      setFilteredClientUploads(data || []);
    }
    setLoadingUploads(false);
  };

  // Filter uploads by status
  useEffect(() => {
    if (uploadStatusFilter === 'all') {
      setFilteredClientUploads(clientUploads);
    } else {
      setFilteredClientUploads(clientUploads.filter(u => (u.status || 'pending') === uploadStatusFilter));
    }
  }, [uploadStatusFilter, clientUploads]);

  const filterEnquiries = () => {
    let filtered = enquiries;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.name.toLowerCase().includes(term) ||
          e.email.toLowerCase().includes(term) ||
          e.company?.toLowerCase().includes(term) ||
          e.first_name?.toLowerCase().includes(term) ||
          e.last_name?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((e) => e.status === statusFilter);
    }

    setFilteredEnquiries(filtered);
  };

  const filterClients = () => {
    let filtered = clients;

    if (clientSearchTerm) {
      const term = clientSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.full_name?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.company?.toLowerCase().includes(term) ||
          c.customer_id?.toLowerCase().includes(term)
      );
    }

    if (clientStatusFilter !== 'all') {
      filtered = filtered.filter((c) => c.status === clientStatusFilter);
    }

    setFilteredClients(filtered);
  };

  const updateEnquiryStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('enquiries')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success('Status updated');
      fetchEnquiries();
    }
  };

  const saveEnquiryNotes = async () => {
    if (!selectedEnquiry) return;

    const { error } = await supabase
      .from('enquiries')
      .update({ notes })
      .eq('id', selectedEnquiry.id);

    if (error) {
      toast.error('Failed to save notes');
    } else {
      toast.success('Notes saved');
      fetchEnquiries();
    }
  };

  const createClientAccount = async () => {
    if (!newClientEmail || !newClientPassword || !newClientName) {
      toast.error('Please fill in required fields');
      return;
    }

    if (newClientPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreatingClient(true);
    try {
      // Get the current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in to create clients');
        return;
      }

      // Call edge function to create client (uses admin API so won't affect our session)
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: newClientEmail,
          password: newClientPassword,
          fullName: newClientName,
          company: newClientCompany || undefined,
          phone: newClientPhone || undefined,
          plan: newClientType === 'preview' ? 'Preview Only' : (newClientPlan || undefined),
          pageCount: newClientPageCount || undefined,
          websiteStatus: newClientWebsiteStatus || 'design',
          previewUrl: newClientPreviewUrl || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to create client account');
        return;
      }

      toast.success(`Client account created! Customer ID: ${result.customerId}`);
      setShowCreateClient(false);
      resetCreateClientForm();
      fetchClients();
    } catch (err) {
      console.error('Error creating client:', err);
      toast.error('Failed to create client account');
    } finally {
      setCreatingClient(false);
    }
  };

  const resetCreateClientForm = () => {
    setNewClientEmail('');
    setNewClientPassword('');
    setNewClientName('');
    setNewClientCompany('');
    setNewClientPhone('');
    setNewClientPlan('');
    setNewClientPageCount('');
    setNewClientWebsiteStatus('design');
    setNewClientPreviewUrl('');
    setNewClientType('paid');
    setShowPassword(false);
  };

  const updateClient = async () => {
    if (!selectedClient) return;

    // Validate URL before saving
    if (selectedClient.preview_url && !validateUrl(selectedClient.preview_url)) {
      toast.error('Please enter a valid preview URL');
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        plan: selectedClient.plan,
        page_count: selectedClient.page_count,
        status: selectedClient.status,
        company: selectedClient.company,
        phone: selectedClient.phone,
        notes: editClientNotes,
        website_status: selectedClient.website_status,
        preview_url: selectedClient.preview_url
      })
      .eq('id', selectedClient.id);

    if (error) {
      toast.error('Failed to update client');
    } else {
      toast.success('Client updated');
      setEditingClient(false);
      fetchClients();
    }
  };

  const updateUploadStatus = async (uploadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('customer_uploads')
        .update({ status: newStatus })
        .eq('id', uploadId);

      if (error) throw error;

      toast.success(`Status updated to ${uploadStatusLabels[newStatus]}`);
      if (selectedClient) {
        fetchClientUploads(selectedClient.user_id);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteClientUpload = async (uploadId: string, imageUrl: string | null) => {
    try {
      const { error } = await supabase
        .from('customer_uploads')
        .delete()
        .eq('id', uploadId);

      if (error) throw error;

      if (imageUrl) {
        // imageUrl is now a file path, not a full URL
        const path = imageUrl.includes('/customer-uploads/') 
          ? imageUrl.split('/customer-uploads/')[1] 
          : imageUrl;
        if (path) {
          await supabase.storage.from('customer-uploads').remove([path]);
        }
      }

      toast.success('Upload deleted');
      if (selectedClient) {
        fetchClientUploads(selectedClient.user_id);
      }
    } catch (error) {
      console.error('Error deleting upload:', error);
      toast.error('Failed to delete upload');
    }
  };

  const generateRandomWord = () => {
    const words = ['CONFIRM', 'DELETE', 'REMOVE', 'ERASE', 'CLEAR', 'PURGE', 'WIPE'];
    return words[Math.floor(Math.random() * words.length)] + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
  };

  const initiateDeleteClient = () => {
    const word = generateRandomWord();
    setDeleteConfirmWord(word);
    setDeleteInputWord('');
    setShowDeleteClient(true);
  };

  const initiateResetPassword = () => {
    setNewPassword('');
    setShowNewPassword(false);
    setShowResetPassword(true);
  };

  const resetClientPassword = async () => {
    if (!selectedClient || !newPassword) {
      toast.error('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setResettingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error('You must be logged in to reset passwords');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-client-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId: selectedClient.user_id,
          newPassword: newPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error(result.error || 'Failed to reset password');
        return;
      }

      toast.success('Password reset successfully');
      setShowResetPassword(false);
      setNewPassword('');
    } catch (err) {
      console.error('Error resetting password:', err);
      toast.error('Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
  };

  const deleteClient = async () => {
    if (!selectedClient || deleteInputWord !== deleteConfirmWord) {
      toast.error('Please type the confirmation word exactly');
      return;
    }

    setDeletingClient(true);
    try {
      // Call the delete-client Edge Function which handles full deletion including auth
      const { data, error } = await supabase.functions.invoke('delete-client', {
        body: { user_id: selectedClient.user_id }
      });

      if (error) {
        console.error('Error deleting client:', error);
        toast.error(error.message || 'Failed to delete client account');
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      toast.success('Client account fully deleted');
      setShowDeleteClient(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client account');
    } finally {
      setDeletingClient(false);
    }
  };

  const downloadImage = async (imagePath: string, fileName: string) => {
    try {
      // Get a signed URL for the image
      const signedUrl = await getSignedUrl(imagePath, 'customer-uploads');
      if (!signedUrl) {
        toast.error('Failed to get download URL');
        return;
      }
      
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const handleLogout = async () => {
    await quickSignOut('team');
    navigate('/sign-in', { replace: true });
  };

  const enquiryStats = {
    total: enquiries.length,
    new: enquiries.filter((e) => e.status === 'new').length,
    inProgress: enquiries.filter((e) => e.status === 'in-progress').length,
    completed: enquiries.filter((e) => e.status === 'completed').length,
  };

  const clientStats = {
    total: clients.length,
    active: clients.filter((c) => c.status === 'active').length,
    pending: clients.filter((c) => c.status === 'pending').length,
    withPlan: clients.filter((c) => c.plan).length,
  };

  const InfoRow = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | null | undefined }) => {
    if (!value) return null;
    return (
      <div className="flex items-start gap-3 py-2 border-b border-border/60 last:border-0">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <p className="text-[13px] text-foreground mt-0.5 break-words">{value}</p>
        </div>
      </div>
    );
  };

  return (
    <TeamLayout activeTab={mainTab} onTabChange={(tab) => setMainTab(tab as typeof mainTab)}>
      <div className="workshop-ui container mx-auto px-4 sm:px-5 lg:px-6 py-4 space-y-4">

          {/* Command Center Tab */}
          {mainTab === 'command-center' && <AdminCommandCenter />}

          {/* Leads Tab → new full-screen CRM */}
          {mainTab === 'leads' && <Navigate to="/lounge/crm" replace />}

          {/* Client Accounts Tab */}
          {mainTab === 'client-accounts' && <AdminClientAccounts />}

          {/* Account Creation Tab */}
          {mainTab === 'account-creation' && <AccountCreation />}

          {/* Greeting Messages Tab */}
          {mainTab === 'greeting-messages' && <AdminGreetingMessages />}

          {/* App Projects Tab */}
          {mainTab === 'apps' && <AdminAppManagement />}

          {/* Enquiries Tab */}
          {mainTab === 'enquiries' && (
            <div className="h-[calc(100dvh-8rem)] sm:h-[calc(100dvh-9rem)] lg:h-[calc(100vh-10rem)] min-h-[500px]">
              <AdminEnquiries />
            </div>
          )}

          {/* Clients Tab */}
          {mainTab === 'clients' && (
            <div className="space-y-4">
            {/* Client facts */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-px overflow-hidden rounded-[10px] border border-border/60 bg-border/60">
              {[
                { label: 'Total clients', value: clientStats.total },
                { label: 'Active', value: clientStats.active },
                { label: 'Pending', value: clientStats.pending },
                { label: 'With plan', value: clientStats.withPlan },
              ].map((stat) => (
                <div key={stat.label} className="bg-card p-3">
                  <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 font-mono text-lg font-medium tabular-nums text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Client filters and create action */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="pl-9 h-9 text-[13px]"
                />
              </div>
              <Select value={clientStatusFilter} onValueChange={setClientStatusFilter}>
                <SelectTrigger className="w-full sm:w-44 h-9 text-[13px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setShowCreateClient(true)} className="h-9 gap-2 w-full sm:w-auto">
                <UserPlus className="w-4 h-4" />
                <span className="sm:inline">Create client</span>
              </Button>
            </div>

            {/* Clients list */}
            <div className="space-y-2">
              {loadingClients ? (
                <div className="rounded-[10px] border border-border/60 bg-card" aria-hidden>
                  <SkeletonLedger rows={6} />
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="rounded-[10px] border border-border/60 bg-card">
                  <EmptyState
                    title="No clients found"
                    body="Create your first client account to get started."
                    action={{ label: 'Create client', onClick: () => setShowCreateClient(true) }}
                  />
                </div>
              ) : (
                filteredClients.map((client, index) => (
                  <div
                    key={client.id}
                    className="rounded-[10px] border border-border/60 bg-card p-3 sm:p-4 hover:bg-foreground/[0.025] transition-colors duration-150 cursor-pointer group"
                    onClick={() => {
                      setSelectedClient(client);
                      setEditClientNotes(client.notes || '');
                      setEditingClient(false);
                      fetchClientUploads(client.user_id);
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[13.5px] font-[550] text-foreground">
                            {client.full_name || 'No name'}
                          </h3>
                          {client.customer_id && (
                            <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">
                              <Hash className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                              {client.customer_id}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {client.status && (
                            <Badge 
                              variant="outline" 
                              className={`${clientStatusColors[client.status] || clientStatusColors.pending} border text-[10px] sm:text-xs`}
                            >
                              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                            </Badge>
                          )}
                          {client.plan && (
                            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px] sm:text-xs">
                              <CreditCard className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                              {client.plan}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1.5 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1.5 truncate">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">{client.email}</span>
                          </span>
                          {client.company && (
                            <span className="flex items-center gap-1.5 truncate hidden sm:flex">
                              <Building className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{client.company}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 font-mono tabular-nums">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            {new Date(client.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClient(client);
                            setEditClientNotes(client.notes || '');
                            setEditingClient(false);
                            fetchClientUploads(client.user_id);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            </div>
          )}

          {/* Ads Tab */}
          {mainTab === 'ads' && <AdminAdManagement />}

          {/* Social Media Tab */}
          {mainTab === 'social' && <AdminSocialMedia />}

          {/* Content Requests Tab */}
          {mainTab === 'content' && <AdminContentRequests />}

          {/* Calendar Tab */}
          {mainTab === 'calendar' && <AdminMarketingCalendar />}

          {/* Websites Tab */}
          {mainTab === 'websites' && <AdminWebsiteManagement />}

          {/* Invoices Tab */}
          {mainTab === 'invoices' && <AdminInvoices />}

          {/* Billing Tab */}
          {mainTab === 'billing' && <AdminBilling />}

          {/* Messages Tab */}
          {mainTab === 'messages' && <AdminMessaging />}

          {/* Team Comms Tab */}
          {mainTab === 'team-comms' && <TeamComms />}

          {/* Roles & Permissions Tab */}
          {mainTab === 'roles-permissions' && <AdminRoleManagement />}

          {/* Security Tab */}
          {mainTab === 'security' && <AdminSecurityDashboard />}

          {/* Site Analytics Tab */}
          {mainTab === 'site-analytics' && <AdminSiteAnalytics />}


          {/* Asset Management Tab */}
          {mainTab === 'assets' && <AdminAssetManagement />}

          {/* Support Tickets Tab */}
          {mainTab === 'tickets' && <AdminSupportTickets />}

          {/* Announcements Tab */}
          {mainTab === 'announcements' && <AdminAnnouncements />}

          {/* Workflows Tab */}
          {mainTab === 'workflows' && <AdminWorkflowsTab />}



          {/* Live Sessions Tab */}
          {mainTab === 'live-sessions' && <AdminLiveSessions />}

          {/* Settings Tab */}
          {mainTab === 'settings' && <AdminSettings />}

          {/* Knowledge Base Tab */}
          {mainTab === 'knowledge-base' && <AdminKnowledgeBase />}

          {/* Automation Rules Tab */}
          {mainTab === 'automation-rules' && <AdminAutomationRules />}

          {/* Website Designer Tab */}
          {mainTab === 'website-designer' && (
            <Suspense fallback={<div className="rounded-[10px] border border-border/60 bg-card" aria-hidden><SkeletonLedger rows={6} /></div>}>
              <LoungeWebsiteDesigner />
            </Suspense>
          )}

          {/* Quooro Office Tab */}
          {mainTab === 'office' && (
            <Suspense fallback={<div className="rounded-[10px] border border-border/60 bg-card" aria-hidden><SkeletonLedger rows={6} /></div>}>
              <LoungeOffice />
            </Suspense>
          )}

          {/* E-commerce: product catalogue manager */}
          {mainTab === 'ecommerce' && (
            <Suspense fallback={<div className="rounded-[10px] border border-border/60 bg-card" aria-hidden><SkeletonLedger rows={6} /></div>}>
              <EcommerceShell />
            </Suspense>
          )}

          {/* Subscription Websites (running subscriptions) */}
          {mainTab === 'subscription-sites' && (
            <Suspense fallback={<div className="rounded-[10px] border border-border/60 bg-card" aria-hidden><SkeletonLedger rows={6} /></div>}>
              <OfficeEcommerce initialTab="running" />
            </Suspense>
          )}

          {/* Hosted Websites (paid, hosted-only) */}
          {mainTab === 'hosted-sites' && (
            <Suspense fallback={<div className="rounded-[10px] border border-border/60 bg-card" aria-hidden><SkeletonLedger rows={6} /></div>}>
              <OfficeEcommerce initialTab="hosted" />
            </Suspense>
          )}
      </div>

      {/* Enquiry Detail Dialog - Mobile Optimized */}
      <Dialog open={!!selectedEnquiry} onOpenChange={() => setSelectedEnquiry(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] w-[calc(100vw-2rem)] sm:w-full overflow-hidden flex flex-col p-0 rounded-xl">
          <DialogHeader className="p-4 sm:p-6 pb-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-[17px] font-semibold tracking-[-0.015em] truncate">
                  {selectedEnquiry?.first_name && selectedEnquiry?.last_name
                    ? `${selectedEnquiry.first_name} ${selectedEnquiry.last_name}`
                    : selectedEnquiry?.name
                  }
                </DialogTitle>
                <p className="text-muted-foreground mt-1 text-sm truncate">{selectedEnquiry?.email}</p>
              </div>
              {selectedEnquiry && (
                <Badge 
                  variant="outline" 
                  className={`${statusColors[selectedEnquiry.status]} border text-xs sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 shrink-0`}
                >
                  {statusLabels[selectedEnquiry.status] || selectedEnquiry.status}
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          {selectedEnquiry && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <div className="px-4 sm:px-6 overflow-x-auto">
                  <TabsList className="w-full grid grid-cols-5 h-9 min-w-[300px]">
                    <TabsTrigger value="contact" className="text-[10px] sm:text-sm px-1 sm:px-3">Contact</TabsTrigger>
                    <TabsTrigger value="business" className="text-[10px] sm:text-sm px-1 sm:px-3">Business</TabsTrigger>
                    <TabsTrigger value="project" className="text-[10px] sm:text-sm px-1 sm:px-3">Project</TabsTrigger>
                    <TabsTrigger value="goals" className="text-[10px] sm:text-sm px-1 sm:px-3">Goals</TabsTrigger>
                    <TabsTrigger value="notes" className="text-[10px] sm:text-sm px-1 sm:px-3">Notes</TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto p-6 pt-4">
                  <TabsContent value="contact" className="mt-0 space-y-0">
                    <div className="rounded-[10px] border border-border/60 bg-card p-3">
                      <h4 className="text-[13px] font-[550] mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        Contact Information
                      </h4>
                      <InfoRow icon={Mail} label="Email" value={selectedEnquiry.email} />
                      <InfoRow icon={Phone} label="Phone" value={selectedEnquiry.phone} />
                      <InfoRow icon={Instagram} label="Social Media" value={selectedEnquiry.social_media} />
                      <InfoRow icon={MessageSquare} label="How They Found Us" value={selectedEnquiry.how_did_you_hear} />
                      <InfoRow icon={Calendar} label="Submitted" value={new Date(selectedEnquiry.created_at).toLocaleString('en-GB')} />
                    </div>
                  </TabsContent>

                  <TabsContent value="business" className="mt-0 space-y-0">
                    <div className="rounded-[10px] border border-border/60 bg-card p-3">
                      <h4 className="text-[13px] font-[550] mb-2 flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        Business Details
                      </h4>
                      <InfoRow icon={Building} label="Business Name" value={selectedEnquiry.company} />
                      <InfoRow icon={Briefcase} label="Business Type" value={selectedEnquiry.business_type} />
                      <InfoRow icon={MapPin} label="Address" value={selectedEnquiry.business_address} />
                      <InfoRow icon={Globe} label="Current Website" value={selectedEnquiry.website} />
                      <InfoRow icon={Users} label="Employees" value={selectedEnquiry.employee_count} />
                      <InfoRow icon={Calendar} label="Years in Business" value={selectedEnquiry.years_in_business} />
                    </div>
                  </TabsContent>

                  <TabsContent value="project" className="mt-0 space-y-4">
                    <div className="rounded-[10px] border border-border/60 bg-card p-3">
                      <h4 className="text-[13px] font-[550] mb-2 flex items-center gap-2">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        Project Requirements
                      </h4>
                      <InfoRow icon={Star} label="Selected Package" value={selectedEnquiry.selected_package || selectedEnquiry.interest} />
                      <InfoRow icon={DollarSign} label="Budget" value={selectedEnquiry.budget} />
                      <InfoRow icon={Clock} label="Timeline" value={selectedEnquiry.timeline} />
                      <InfoRow icon={FileText} label="Page Count" value={selectedEnquiry.page_count} />
                      <InfoRow icon={Globe} label="Existing Site" value={selectedEnquiry.has_existing_site} />
                    </div>
                    
                    {selectedEnquiry.project_details && (
                      <div className="rounded-[10px] border border-border/60 bg-card p-3">
                        <h4 className="text-[13px] font-[550] mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          Project Description
                        </h4>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedEnquiry.project_details}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="goals" className="mt-0 space-y-4">
                    <div className="rounded-[10px] border border-border/60 bg-card p-3">
                      <h4 className="text-[13px] font-[550] mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        Goals & Vision
                      </h4>
                      <InfoRow icon={Target} label="Primary Goal" value={selectedEnquiry.primary_goal} />
                      <InfoRow icon={Palette} label="Brand Colors" value={selectedEnquiry.brand_colors} />
                      <InfoRow icon={Globe} label="Competitors" value={selectedEnquiry.competitors} />
                      <InfoRow icon={ExternalLink} label="Inspiration Sites" value={selectedEnquiry.inspiration_sites} />
                    </div>

                    {selectedEnquiry.must_have_features && selectedEnquiry.must_have_features.length > 0 && (
                      <div className="rounded-[10px] border border-border/60 bg-card p-3">
                        <h4 className="text-[13px] font-[550] mb-2">Must-have features</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedEnquiry.must_have_features.map((feature, i) => (
                            <Badge key={i} variant="secondary" className="bg-primary/10 text-primary">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedEnquiry.additional_notes && (
                      <div className="rounded-[10px] border border-border/60 bg-card p-3">
                        <h4 className="text-[13px] font-[550] mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          Additional Notes from Client
                        </h4>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedEnquiry.additional_notes}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="notes" className="mt-0 space-y-4">
                    <div className="rounded-[10px] border border-border/60 bg-card p-3">
                      <h4 className="text-[13px] font-[550] mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        Internal Notes
                      </h4>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add internal notes about this enquiry..."
                        rows={6}
                        className="resize-none"
                      />
                      <div className="flex justify-end mt-4">
                        <Button onClick={saveEnquiryNotes} size="sm">
                          Save notes
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Client Dialog */}
      <Dialog open={showCreateClient} onOpenChange={setShowCreateClient}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.015em]">
              <UserPlus className="w-4 h-4 text-muted-foreground" />
              Create client account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Client Type Toggle */}
            <div className="space-y-2">
              <Label>Client Type</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={newClientType === 'paid' ? 'default' : 'outline'}
                  onClick={() => setNewClientType('paid')}
                  className="w-full"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Paid Client
                </Button>
                <Button
                  type="button"
                  variant={newClientType === 'preview' ? 'default' : 'outline'}
                  onClick={() => setNewClientType('preview')}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Only
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {newClientType === 'preview' 
                  ? 'Client will only have access to view their live preview.' 
                  : 'Full client access with plan and all features.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="client-email">Email *</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="client@example.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="client-password">Password *</Label>
                <div className="relative">
                  <Input
                    id="client-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newClientPassword}
                    onChange={(e) => setNewClientPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="client-name">Full Name *</Label>
                <Input
                  id="client-name"
                  placeholder="John Smith"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-company">Company</Label>
                <Input
                  id="client-company"
                  placeholder="Acme Ltd"
                  value={newClientCompany}
                  onChange={(e) => setNewClientCompany(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">Phone</Label>
                <Input
                  id="client-phone"
                  placeholder="+44 7123 456789"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
              </div>
              
              {newClientType === 'paid' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="client-plan">Plan</Label>
                    <Select value={newClientPlan} onValueChange={setNewClientPlan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        {planOptions.filter(p => p !== 'Preview Only').map((plan) => (
                          <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client-pages">Page Count</Label>
                    <Input
                      id="client-pages"
                      placeholder="e.g., 5-10"
                      value={newClientPageCount}
                      onChange={(e) => setNewClientPageCount(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Website Status */}
              <div className="col-span-2 space-y-2">
                <Label>Website Status</Label>
                <Select value={newClientWebsiteStatus} onValueChange={setNewClientWebsiteStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {websiteStatusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <span className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${status.color}`} />
                          {status.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview URL */}
              <div className="col-span-2 space-y-2">
                <Label htmlFor="client-preview-url">Preview URL</Label>
                <Input
                  id="client-preview-url"
                  type="url"
                  placeholder="https://preview.example.com"
                  value={newClientPreviewUrl}
                  onChange={(e) => setNewClientPreviewUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The live preview link for the client to view their website.
                </p>
              </div>
            </div>
            <Button 
              onClick={createClientAccount} 
              className="w-full"
              disabled={creatingClient}
            >
              {creatingClient ? (
                'Creating account...'
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create account
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              A unique Customer ID will be automatically generated for this client.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Client Detail Dialog - Mobile Optimized */}
      <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-[calc(100vw-2rem)] sm:w-full overflow-hidden flex flex-col p-0 rounded-xl">
          <DialogHeader className="p-4 sm:p-6 pb-0">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex items-start justify-between gap-2 pr-8">
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-[17px] font-semibold tracking-[-0.015em] flex items-center gap-2 flex-wrap">
                    <span className="truncate">{selectedClient?.full_name || 'Client'}</span>
                    {selectedClient?.customer_id && (
                      <Badge variant="outline" className="font-mono text-[10px] sm:text-xs shrink-0">
                        <Hash className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                        {selectedClient.customer_id}
                      </Badge>
                    )}
                  </DialogTitle>
                  <p className="text-muted-foreground mt-1 text-sm truncate">{selectedClient?.email}</p>
                </div>
                {selectedClient?.status && (
                  <Badge 
                    variant="outline" 
                    className={`${clientStatusColors[selectedClient.status] || clientStatusColors.pending} border text-[10px] sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1 shrink-0`}
                  >
                    {selectedClient.status.charAt(0).toUpperCase() + selectedClient.status.slice(1)}
                  </Badge>
                )}
              </div>
              {/* Action buttons - stacked on mobile */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingClient(!editingClient)}
                  className="h-8 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  {editingClient ? (
                    <>
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={initiateResetPassword}
                  className="h-8 text-xs sm:text-sm flex-1 sm:flex-none"
                >
                  <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Reset password</span>
                  <span className="sm:hidden">Password</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={initiateDeleteClient}
                  className="h-8 text-xs sm:text-sm"
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {selectedClient && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 pt-4 space-y-4 sm:space-y-6">
              {/* Client Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <Card className="rounded-[12px] border-border/60 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      Client Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow icon={Mail} label="Email" value={selectedClient.email} />
                    {editingClient ? (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Company</Label>
                          <Input
                            value={selectedClient.company || ''}
                            onChange={(e) => setSelectedClient({...selectedClient, company: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Phone</Label>
                          <Input
                            value={selectedClient.phone || ''}
                            onChange={(e) => setSelectedClient({...selectedClient, phone: e.target.value})}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <InfoRow icon={Building} label="Company" value={selectedClient.company} />
                        <InfoRow icon={Phone} label="Phone" value={selectedClient.phone} />
                      </>
                    )}
                    <InfoRow icon={Calendar} label="Joined" value={new Date(selectedClient.created_at).toLocaleDateString('en-GB')} />
                  </CardContent>
                </Card>

                <Card className="rounded-[12px] border-border/60 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      Plan Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {editingClient ? (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Plan</Label>
                          <Select 
                            value={selectedClient.plan || ''} 
                            onValueChange={(v) => setSelectedClient({...selectedClient, plan: v})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan" />
                            </SelectTrigger>
                            <SelectContent>
                              {planOptions.map((plan) => (
                                <SelectItem key={plan} value={plan}>{plan}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Page Count</Label>
                          <Input
                            value={selectedClient.page_count || ''}
                            onChange={(e) => setSelectedClient({...selectedClient, page_count: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Status</Label>
                          <Select 
                            value={selectedClient.status || 'active'} 
                            onValueChange={(v) => setSelectedClient({...selectedClient, status: v})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="preview">Preview Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <>
                        <InfoRow icon={CreditCard} label="Plan" value={selectedClient.plan} />
                        <InfoRow icon={FileText} label="Page Count" value={selectedClient.page_count} />
                        <InfoRow icon={CheckCircle} label="Status" value={selectedClient.status?.charAt(0).toUpperCase() + (selectedClient.status?.slice(1) || '')} />
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Original Enquiry Submission */}
              {selectedClient.enquiry_data && typeof selectedClient.enquiry_data === 'object' && (
                <Card className="rounded-[12px] border-border/60 shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Original Enquiry Submission
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-3">
                      All information submitted by this customer when they first enquired.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {Object.entries(selectedClient.enquiry_data as Record<string, any>)
                        .filter(([k, v]) => {
                          if (v === null || v === undefined || v === '') return false;
                          if (['id', 'status', 'notes', 'created_at', 'updated_at'].includes(k)) return false;
                          if (Array.isArray(v) && v.length === 0) return false;
                          return true;
                        })
                        .map(([k, v]) => {
                          const label = k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                          const displayValue = Array.isArray(v)
                            ? v.join(', ')
                            : typeof v === 'object'
                            ? JSON.stringify(v, null, 2)
                            : String(v);
                          const isLong = displayValue.length > 60;
                          return (
                            <div
                              key={k}
                              className={`rounded-lg border border-border/40 bg-muted/30 p-2.5 sm:p-3 ${isLong ? 'sm:col-span-2' : ''}`}
                            >
                              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                                {label}
                              </div>
                              <div className="text-xs sm:text-sm text-foreground whitespace-pre-wrap break-words">
                                {displayValue}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Website Status Section */}
              <Card className="border-border/60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground" />
                    Website Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editingClient ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Website Status</Label>
                        <Select 
                          value={selectedClient.website_status || 'design'} 
                          onValueChange={(v) => setSelectedClient({...selectedClient, website_status: v})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {websiteStatusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                <span className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                  {status.label}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Preview URL</Label>
                        <Input
                          placeholder="example.com or https://example.com"
                          value={selectedClient.preview_url || ''}
                          onChange={(e) => handlePreviewUrlChange(e.target.value)}
                          className={previewUrlError ? 'border-destructive focus-visible:ring-destructive' : ''}
                        />
                        {previewUrlError && (
                          <p className="text-xs text-destructive">{previewUrlError}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Current Status</span>
                        <Badge
                          variant="outline"
                          className={`${
                            selectedClient.website_status === 'live' ? 'bg-ok/10 text-ok border-ok/25' :
                            selectedClient.website_status === 'development' ? 'bg-primary/10 text-primary border-primary/25' :
                            selectedClient.website_status === 'review' ? 'bg-attend/10 text-attend border-attend/25' :
                            selectedClient.website_status === 'not_published' ? 'bg-muted text-muted-foreground border-border' :
                            'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {websiteStatusOptions.find(s => s.value === selectedClient.website_status)?.label || 'Design'}
                        </Badge>
                      </div>
                      {selectedClient.preview_url && (
                        <div className="pt-2 border-t border-border">
                          <Label className="text-xs text-muted-foreground mb-2 block">Preview URL</Label>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="w-full justify-start gap-2 text-primary"
                            onClick={() => {
                              let url = selectedClient.preview_url!;
                              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                url = 'https://' + url;
                              }
                              window.open(url, '_blank');
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="truncate">{selectedClient.preview_url}</span>
                          </Button>
                        </div>
                      )}
                      {!selectedClient.preview_url && (
                        <p className="text-xs text-muted-foreground italic">No preview URL set. Click Edit to add one.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Notes Section */}
              <Card className="rounded-[12px] border-border/60 shadow-none">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    Internal Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editClientNotes}
                    onChange={(e) => setEditClientNotes(e.target.value)}
                    placeholder="Add notes about this client..."
                    rows={3}
                    className="resize-none"
                  />
                </CardContent>
              </Card>

              {editingClient && (
                <div className="flex justify-end">
                  <Button onClick={updateClient} className="gap-2">
                    <Save className="w-4 h-4" />
                    Save changes
                  </Button>
                </div>
              )}

              {/* Client Uploads */}
              <Card className="rounded-[12px] border-border/60 shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Upload className="w-4 h-4 text-muted-foreground" />
                        Client Uploads
                        <Badge variant="secondary" className="ml-2">{filteredClientUploads.length}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Images and notes uploaded by the client for development
                      </CardDescription>
                    </div>
                    <Select value={uploadStatusFilter} onValueChange={setUploadStatusFilter}>
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <Filter className="w-3 h-3 mr-2" />
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-attend" />
                            Pending
                          </span>
                        </SelectItem>
                        <SelectItem value="reviewed">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                            Reviewed
                          </span>
                        </SelectItem>
                        <SelectItem value="implemented">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-ok" />
                            Implemented
                          </span>
                        </SelectItem>
                        <SelectItem value="needs-clarification">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-risk" />
                            Needs Clarification
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingUploads ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-hidden>
                      <SkeletonBlock className="h-32 rounded-[10px]" />
                      <SkeletonBlock className="h-32 rounded-[10px]" />
                    </div>
                  ) : filteredClientUploads.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border/60 rounded-[10px]">
                      <p className="text-[13px] text-muted-foreground">
                        {uploadStatusFilter === 'all' ? 'No uploads from this client yet' : `No ${uploadStatusLabels[uploadStatusFilter]?.toLowerCase()} uploads`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredClientUploads.map((upload) => (
                        <div key={upload.id} className="border border-border/60 rounded-[10px] overflow-hidden group">
                          {upload.image_url && (
                            <div className="relative h-40 overflow-hidden">
                              <SecureImage
                                src={upload.image_url}
                                alt={upload.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => downloadImage(upload.image_url!, `${upload.title || 'upload'}-${upload.id.slice(0, 8)}.jpg`)}
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => deleteClientUpload(upload.id, upload.image_url)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          <div className="p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-[13px] truncate">{upload.title}</h4>
                                <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                                  {new Date(upload.created_at).toLocaleDateString('en-GB', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              {!upload.image_url && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => deleteClientUpload(upload.id, upload.image_url)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            {upload.notes && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{upload.notes}</p>
                            )}
                            {/* Status Selector */}
                            <div className="mt-3 pt-3 border-t border-border">
                              <Label className="text-xs text-muted-foreground mb-1.5 block">Status</Label>
                              <Select
                                value={upload.status || 'pending'}
                                onValueChange={(value) => updateUploadStatus(upload.id, value)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-attend" />
                                      Pending
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="reviewed">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-muted-foreground" />
                                      Reviewed
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="implemented">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-ok" />
                                      Implemented
                                    </span>
                                  </SelectItem>
                                  <SelectItem value="needs-clarification">
                                    <span className="flex items-center gap-2">
                                      <span className="w-2 h-2 rounded-full bg-risk" />
                                      Needs Clarification
                                    </span>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Client Confirmation Dialog */}
      <Dialog open={showDeleteClient} onOpenChange={setShowDeleteClient}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.015em] text-destructive">
              <Trash2 className="w-4 h-4" />
              Delete client account
            </DialogTitle>
            <DialogDescription className="pt-2">
              This action is <strong>permanent</strong> and cannot be undone. All client data, uploads, and account information will be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm text-foreground">
                You are about to delete the account for:
              </p>
              <p className="font-semibold mt-1">{selectedClient?.full_name} ({selectedClient?.email})</p>
              {selectedClient?.customer_id && (
                <p className="text-xs text-muted-foreground mt-1">Customer ID: {selectedClient.customer_id}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm">
                To confirm, type <span className="font-mono font-bold text-destructive">{deleteConfirmWord}</span> below:
              </Label>
              <Input
                value={deleteInputWord}
                onChange={(e) => setDeleteInputWord(e.target.value)}
                placeholder="Type the confirmation word"
                className={deleteInputWord && deleteInputWord !== deleteConfirmWord ? 'border-destructive' : ''}
              />
              {deleteInputWord && deleteInputWord !== deleteConfirmWord && (
                <p className="text-xs text-destructive">Word does not match</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteClient(false)}
              disabled={deletingClient}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteClient}
              disabled={deleteInputWord !== deleteConfirmWord || deletingClient}
            >
              {deletingClient ? (
                'Deleting...'
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPassword} onOpenChange={setShowResetPassword}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[17px] font-semibold tracking-[-0.015em]">
              <Key className="w-4 h-4 text-muted-foreground" />
              Reset client password
            </DialogTitle>
            <DialogDescription className="pt-2">
              Set a new password for this client's account. They will need to use this password to log in.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-muted/50 border border-border rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Resetting password for:
              </p>
              <p className="font-semibold mt-1">{selectedClient?.full_name}</p>
              <p className="text-sm text-muted-foreground">{selectedClient?.email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password (min. 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {newPassword && newPassword.length < 6 && (
                <p className="text-xs text-destructive">Password must be at least 6 characters</p>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowResetPassword(false)}
              disabled={resettingPassword}
            >
              Cancel
            </Button>
            <Button
              onClick={resetClientPassword}
              disabled={!newPassword || newPassword.length < 6 || resettingPassword}
            >
              {resettingPassword ? (
                'Resetting...'
              ) : (
                <>
                  <Key className="w-4 h-4 mr-2" />
                  Reset password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </TeamLayout>
  );
}
