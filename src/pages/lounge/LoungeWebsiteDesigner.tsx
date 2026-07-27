import { useState, useEffect, useCallback } from 'react';
import { DesignerSplash } from '@/components/splash/DesignerSplash';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Paintbrush, Globe, Loader2, ExternalLink, Trash2, Download,
  MoreHorizontal, Crown, Clock, Layout, Pencil, Search,
  FolderOpen, LayoutGrid, List, ArrowUpDown, Eye, Sparkles,
  ChevronRight, X, Layers, Palette, Store, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TEMPLATES } from '@/components/designer/constants/templates';
import { useUserRole } from '@/hooks/useUserRole';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { TemplatePreviewModal } from '@/components/designer/TemplatePreviewModal';
import { TemplateThumbnail } from '@/components/designer/TemplateThumbnail';

const DESIGNER_PRODUCT_ID = 'prod_TylFkDdlGGffHp';
const DESIGNER_PRICE_ID = 'price_1T0nj5RsdRM0b4FvfJtuGFXU';

interface DesignerSite {
  id: string;
  site_name: string;
  description: string | null;
  template_id: string | null;
  status: string;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

/* ─────────────── helpers ─────────────── */
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const statusColors: Record<string, string> = {
  draft: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  published: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  archived: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
};

type SortOption = 'updated' | 'created' | 'name';
type ViewMode = 'grid' | 'list';
type DashTab = 'sites' | 'marketplace';

/* ─── template categories for marketplace ─── */
const TEMPLATE_CATEGORIES = ['All', ...Array.from(new Set(TEMPLATES.map(t => t.category)))];

/* ─── thumbnail placeholders for templates ─── */
const CATEGORY_IMAGES: Record<string, string> = {
  Starter: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=400&fit=crop',
  Business: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',
  'Real Estate': 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop',
  Portfolio: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  'E-commerce': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
  Agency: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop',
  Restaurant: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop',
  Healthcare: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
  Education: 'https://images.unsplash.com/photo-1523050854058-8df90110c476?w=600&h=400&fit=crop',
  Fitness: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',
  Technology: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
  Blog: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop',
  Events: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop',
  Travel: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=600&h=400&fit=crop',
  Music: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=400&fit=crop',
  'Non-Profit': 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=600&h=400&fit=crop',
  Fashion: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&h=400&fit=crop',
  Photography: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&h=400&fit=crop',
  Legal: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop',
  Wedding: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=400&fit=crop',
  Creative: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
  Hospitality: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
  Nonprofit: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=600&h=400&fit=crop',
  Professional: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&h=400&fit=crop',
  Lifestyle: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=400&fit=crop',
  Entertainment: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=400&fit=crop',
};

/* ─────────────── component ─────────────── */
export default function LoungeWebsiteDesigner() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subscribed, setSubscribed] = useState<boolean | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const [sites, setSites] = useState<DesignerSite[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);
  const [pendingEditorUrl, setPendingEditorUrl] = useState<string | null>(null);

  const openWithSplash = useCallback((siteId: string) => {
    setPendingEditorUrl(`/lounge/editor/${siteId}`);
  }, []);
  const [showNewSiteDialog, setShowNewSiteDialog] = useState(false);
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteDesc, setNewSiteDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('updated');
  const [activeTab, setActiveTab] = useState<DashTab>('sites');

  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // Marketplace state
  const [marketplaceCategory, setMarketplaceCategory] = useState('All');
  const [marketplaceSearch, setMarketplaceSearch] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [templateSiteName, setTemplateSiteName] = useState('');
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<typeof TEMPLATES[0] | null>(null);

  const { isAdmin, loading: roleLoading } = useUserRole();

  /* ── subscription ── */
  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-designer-subscription');
      if (error) throw error;
      setSubscribed(data.subscribed);
      setSubscriptionEnd(data.subscription_end ?? null);
    } catch {
      setSubscribed(false);
    } finally {
      setCheckingSubscription(false);
    }
  }, []);

  useEffect(() => {
    if (roleLoading) return;
    if (isAdmin) {
      setSubscribed(true);
      setCheckingSubscription(false);
      return;
    }
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [checkSubscription, isAdmin, roleLoading]);

  /* ── sites ── */
  useEffect(() => {
    if (!subscribed) return;
    const loadSites = async () => {
      setLoadingSites(true);
      const { data, error } = await supabase
        .from('designer_sites')
        .select('*')
        .order('updated_at', { ascending: false });
      if (!error && data) setSites(data as unknown as DesignerSite[]);
      setLoadingSites(false);
    };
    loadSites();
  }, [subscribed]);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-designer-checkout');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch {
      toast({ title: 'Error', description: 'Could not start checkout. Please try again.', variant: 'destructive' });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('designer-customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch {
      toast({ title: 'Error', description: 'Could not open subscription management.', variant: 'destructive' });
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCreateSite = async (templateId?: string) => {
    const name = templateId ? templateSiteName.trim() : newSiteName.trim();
    if (!name) return;
    templateId ? setCreatingFromTemplate(true) : setCreating(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const template = templateId ? TEMPLATES.find(t => t.id === templateId) : null;

      const { data, error } = await supabase
        .from('designer_sites')
        .insert({
          site_name: name,
          description: templateId ? (template?.description || null) : (newSiteDesc.trim() || null),
          user_id: userData.user.id,
          template_id: templateId || null,
        })
        .select()
        .single();
      if (error) throw error;

      const siteId = (data as unknown as DesignerSite).id;

      // Create all template pages (or just Home for blank sites)
      if (template?.pages && template.pages.length > 0) {
        const pageInserts = template.pages.map((page, i) => ({
          site_id: siteId,
          user_id: userData.user.id,
          page_name: page.name,
          slug: page.slug,
          is_homepage: i === 0,
          sort_order: i,
          elements: page.elements as any,
        }));
        await supabase.from('designer_pages').insert(pageInserts);
      } else {
        await supabase.from('designer_pages').insert([{
          site_id: siteId,
          user_id: userData.user.id,
          page_name: 'Home',
          slug: '/',
          is_homepage: true,
          elements: (template ? template.elements : null) as any,
        }]);
      }

      setSites(prev => [(data as unknown as DesignerSite), ...prev]);

      if (templateId) {
        setSelectedTemplate(null);
        setTemplateSiteName('');
        toast({ title: 'Site created from template', description: `"${name}" is ready to design.` });
        navigate(`/lounge/editor/${siteId}`);
      } else {
        setShowNewSiteDialog(false);
        setNewSiteName('');
        setNewSiteDesc('');
        toast({ title: 'Site created', description: `"${name}" is ready to design.` });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to create site.', variant: 'destructive' });
    } finally {
      setCreating(false);
      setCreatingFromTemplate(false);
    }
  };

  const handleDeleteSite = async (site: DesignerSite) => {
    const { error } = await supabase.from('designer_sites').delete().eq('id', site.id);
    if (!error) {
      setSites(prev => prev.filter(s => s.id !== site.id));
      toast({ title: 'Site deleted' });
    }
  };

  const handleDeleteAll = async () => {
    setDeletingAll(true);
    try {
      const ids = sites.map(s => s.id);
      const { error } = await supabase.from('designer_sites').delete().in('id', ids);
      if (error) throw error;
      setSites([]);
      toast({ title: 'All sites deleted' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete all sites.', variant: 'destructive' });
    } finally {
      setDeletingAll(false);
      setShowDeleteAllDialog(false);
    }
  };

  /* ── sorting & filtering ── */
  const sorted = [...sites].sort((a, b) => {
    if (sortBy === 'name') return a.site_name.localeCompare(b.site_name);
    if (sortBy === 'created') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  const filtered = sorted.filter(s =>
    s.site_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  /* ── marketplace filtering ── */
  const filteredTemplates = TEMPLATES.filter(t => {
    const matchCat = marketplaceCategory === 'All' || t.category === marketplaceCategory;
    const matchSearch = !marketplaceSearch || t.name.toLowerCase().includes(marketplaceSearch.toLowerCase()) || t.description.toLowerCase().includes(marketplaceSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  /* ── loading ── */
  if (checkingSubscription) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-border/30 border-t-foreground/70 rounded-full animate-spin" />
          <span className="text-muted-foreground text-xs tracking-wide">Loading…</span>
        </div>
      </div>
    );
  }

  /* ── paywall ── */
  if (!subscribed) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-8">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
            <Paintbrush className="w-7 h-7 text-white/60" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-white tracking-tight">Website Dashboard</h1>
            <p className="text-[#999] text-sm max-w-sm mx-auto leading-relaxed">
              Build stunning websites with our drag-and-drop editor. Templates, pages, SEO — all in one place.
            </p>
          </div>
          <div className="bg-[#161616] border border-[#2a2a2a] rounded-2xl p-6 space-y-5 text-left">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Pro Plan</p>
                <p className="text-[#777] text-xs mt-0.5">Full access to all features</p>
              </div>
              <Badge className="bg-white/10 text-white/80 border-white/10 text-[10px] font-medium tracking-wider uppercase">
                <Crown className="w-3 h-3 mr-1" /> Pro
              </Badge>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-white">£49.99</span>
              <span className="text-[#666] text-sm">/month</span>
            </div>
            <ul className="text-xs space-y-2.5 text-[#aaa]">
              <li className="flex items-center gap-2.5"><Layout className="w-3.5 h-3.5 text-white/40" /> 50+ starter templates across 20+ niches</li>
              <li className="flex items-center gap-2.5"><Store className="w-3.5 h-3.5 text-white/40" /> Full template marketplace with preview</li>
              <li className="flex items-center gap-2.5"><Globe className="w-3.5 h-3.5 text-white/40" /> Unlimited websites & pages</li>
              <li className="flex items-center gap-2.5"><Paintbrush className="w-3.5 h-3.5 text-white/40" /> Drag-and-drop visual editor (Workshop)</li>
              <li className="flex items-center gap-2.5"><Sparkles className="w-3.5 h-3.5 text-[#a78bfa]" /> AI-powered website generation</li>
              <li className="flex items-center gap-2.5"><Layers className="w-3.5 h-3.5 text-white/40" /> 70+ section blocks & component library</li>
              <li className="flex items-center gap-2.5"><Palette className="w-3.5 h-3.5 text-white/40" /> Global design system & style tokens</li>
              <li className="flex items-center gap-2.5"><Eye className="w-3.5 h-3.5 text-white/40" /> Live preview & responsive testing</li>
            </ul>
            <Button onClick={handleCheckout} disabled={checkoutLoading} className="w-full bg-white text-black hover:bg-white/90 font-medium h-10">
              {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Subscribe Now
            </Button>
            <button onClick={checkSubscription} className="w-full text-center text-[10px] text-[#666] hover:text-[#999] transition-colors pt-1">
              Already subscribed? Refresh status
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── dashboard (subscribed) ── */
  return (
    <>
    {pendingEditorUrl && (
      <DesignerSplash onComplete={() => {
        navigate(pendingEditorUrl);
        setPendingEditorUrl(null);
      }} />
    )}
    <div className="min-h-[80vh] p-4 md:p-6 lg:p-8 space-y-6">
      <LoungePageHeader
        title="Website Dashboard"
        description={subscriptionEnd
          ? `Renews ${new Date(subscriptionEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
          : 'Subscription active'}
        icon={Globe}
        badge="Pro"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="text-muted-foreground hover:text-foreground text-xs h-8 px-3"
            >
              {portalLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <ExternalLink className="w-3 h-3 mr-1.5" />}
              Manage Plan
            </Button>
            <Button
              onClick={() => setShowNewSiteDialog(true)}
              size="sm"
              className="text-xs h-8 px-4"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" /> New Site
            </Button>
          </div>
        }
      />

      {/* ─── Tabs: Sites / Marketplace ─── */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('sites')}
            className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
              activeTab === 'sites'
                ? 'bg-muted text-foreground border-border'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <Layers className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            My Sites
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
              activeTab === 'marketplace'
                ? 'bg-muted text-foreground border-border'
                : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground'
            }`}
          >
            <Store className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Template Marketplace
          </button>
          <button
            onClick={() => navigate('/lounge/workshop-studio')}
            className="px-4 py-2 text-xs font-medium rounded-lg border transition-colors bg-transparent text-muted-foreground border-transparent hover:bg-muted/50 hover:text-foreground"
          >
            <Paintbrush className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Workshop Studio
          </button>
          <button
            onClick={() => {
              const data = localStorage.getItem('figma-export');
              if (!data) { toast({ title: 'No designs to import', description: 'Export from Workshop Studio first.' }); return; }
              try {
                const imported = JSON.parse(data);
                toast({ title: 'Import successful', description: `Imported ${imported.length} elements from Workshop Studio` });
              } catch { toast({ title: 'Import failed', description: 'Failed to parse Studio export' }); }
            }}
            className="px-4 py-2 text-xs font-medium rounded-lg border transition-colors bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
          >
            <Download className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
            Import from Studio
          </button>
        </div>

        {activeTab === 'sites' && sites.length > 0 && (
          <div className="flex items-center gap-2 -mb-px pb-2">
            {/* View toggle */}
            <div className="flex items-center bg-[#1a1a1a] border border-[#2a2a2a] rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-[#555] hover:text-[#888]'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-[#555] hover:text-[#888]'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] text-[#777] hover:text-white bg-[#1a1a1a] border border-[#2a2a2a] rounded-md transition-colors">
                  <ArrowUpDown className="w-3 h-3" />
                  {sortBy === 'updated' ? 'Last edited' : sortBy === 'created' ? 'Date created' : 'Name'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] min-w-[140px]">
                <DropdownMenuItem onClick={() => setSortBy('updated')} className="text-white/80 text-xs focus:bg-white/5 focus:text-white">Last edited</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('created')} className="text-white/80 text-xs focus:bg-white/5 focus:text-white">Date created</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')} className="text-white/80 text-xs focus:bg-white/5 focus:text-white">Name</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* ─── Sites Tab ─── */}
      {activeTab === 'sites' && (
        <>
          {/* Search bar + Delete All */}
          {sites.length > 0 && (
            <div className="flex items-center gap-3 mb-6">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]" />
                <input
                  type="text"
                  placeholder="Search sites…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder:text-[#555] focus:outline-none focus:border-[#444] transition-colors"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteAllDialog(true)}
                className="text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive text-xs h-8 px-3"
              >
                <Trash2 className="w-3 h-3 mr-1.5" /> Delete All
              </Button>
            </div>
          )}

          {/* Grid / List */}
          {loadingSites ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-[#333] border-t-white/70 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 && sites.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#161616] border border-[#2a2a2a] flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-[#555]" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-white/80 text-sm font-medium">No sites yet</p>
                <p className="text-[#666] text-xs">Create your first site or browse the marketplace</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setShowNewSiteDialog(true)} className="bg-white text-black hover:bg-white/90 font-medium text-xs h-8 px-4">
                  <Plus className="w-3.5 h-3.5 mr-1" /> Create Site
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('marketplace')} className="border-[#333] text-[#aaa] hover:text-white hover:bg-white/5 text-xs h-8 px-4">
                  <Store className="w-3.5 h-3.5 mr-1" /> Browse Templates
                </Button>
              </div>
            </motion.div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[#666] text-xs">No sites match "{searchQuery}"</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
                {filtered.map((site, i) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    index={i}
                    onOpen={() => openWithSplash(site.id)}
                    onDelete={() => handleDeleteSite(site)}
                  />
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-1">
              <AnimatePresence mode="popLayout">
                {filtered.map((site, i) => (
                  <SiteListItem
                    key={site.id}
                    site={site}
                    index={i}
                    onOpen={() => openWithSplash(site.id)}
                    onDelete={() => handleDeleteSite(site)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}

      {/* ─── Marketplace Tab ─── */}
      {activeTab === 'marketplace' && (
        <div>
          {/* Marketplace header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">Template Marketplace</h2>
              <p className="text-muted-foreground text-xs">{TEMPLATES.length} professionally designed templates across {TEMPLATE_CATEGORIES.length - 1} industries</p>
            </div>
            <div className="relative max-w-[240px] w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search templates…"
                value={marketplaceSearch}
                onChange={e => setMarketplaceSearch(e.target.value)}
                className="w-full bg-muted border border-border rounded-lg pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring transition-colors"
              />
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {TEMPLATE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setMarketplaceCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
                  marketplaceCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-ring'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Template grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-xs">No templates match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTemplates.map((template, i) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  index={i}
                  onSelect={() => {
                    setSelectedTemplate(template);
                    setTemplateSiteName(template.name);
                  }}
                  onPreview={() => setPreviewTemplate(template)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── New Site Dialog ─── */}
      <Dialog open={showNewSiteDialog} onOpenChange={setShowNewSiteDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-base">New Site</DialogTitle>
            <DialogDescription className="text-[#888] text-xs">Give your site a name to get started.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-[#aaa] text-xs">Site Name</Label>
              <Input
                value={newSiteName}
                onChange={e => setNewSiteName(e.target.value)}
                placeholder="My Awesome Website"
                autoFocus
                className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-[#555] text-sm h-9 focus:border-[#444]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[#aaa] text-xs">Description <span className="text-[#555]">(optional)</span></Label>
              <Textarea
                value={newSiteDesc}
                onChange={e => setNewSiteDesc(e.target.value)}
                placeholder="What is this site for?"
                rows={2}
                className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-[#555] text-sm resize-none focus:border-[#444]"
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setShowNewSiteDialog(false)} className="text-[#888] hover:text-white hover:bg-white/5 text-xs">Cancel</Button>
            <Button onClick={() => handleCreateSite()} disabled={creating || !newSiteName.trim()} className="bg-white text-black hover:bg-white/90 font-medium text-xs h-9 px-5">
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Plus className="w-3.5 h-3.5 mr-1" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete All Confirmation Dialog ─── */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white text-base">Delete All Sites</DialogTitle>
            <DialogDescription className="text-[#888] text-xs">
              Are you sure you want to delete all {sites.length} site{sites.length !== 1 ? 's' : ''}? This action cannot be undone and all pages, assets, and settings will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setShowDeleteAllDialog(false)} className="text-[#888] hover:text-white hover:bg-white/5 text-xs">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deletingAll}
              className="text-xs h-9 px-5"
            >
              {deletingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
              Delete All Sites
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Template Use Dialog ─── */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-white text-base">Use Template</DialogTitle>
            <DialogDescription className="text-[#888] text-xs">
              Create a new site using the "{selectedTemplate?.name}" template.
            </DialogDescription>
          </DialogHeader>

          {/* Template preview */}
          {selectedTemplate && (
            <div className="rounded-lg overflow-hidden border border-[#2a2a2a] aspect-[16/10] bg-[#0a0a0a] mb-2 relative">
              <TemplateThumbnail template={selectedTemplate} />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] text-[#888] border-[#333] px-2 py-0 h-5 font-normal">
                {selectedTemplate?.category}
              </Badge>
              <span className="text-[#555] text-[11px]">{selectedTemplate?.elements.length} sections</span>
            </div>
            <p className="text-[#aaa] text-xs leading-relaxed">{selectedTemplate?.description}</p>

            <div className="space-y-1.5 pt-2">
              <Label className="text-[#aaa] text-xs">Site Name</Label>
              <Input
                value={templateSiteName}
                onChange={e => setTemplateSiteName(e.target.value)}
                placeholder="My Website"
                autoFocus
                className="bg-[#111] border-[#2a2a2a] text-white placeholder:text-[#555] text-sm h-9 focus:border-[#444]"
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setSelectedTemplate(null)} className="text-[#888] hover:text-white hover:bg-white/5 text-xs">Cancel</Button>
            <Button
              onClick={() => selectedTemplate && handleCreateSite(selectedTemplate.id)}
              disabled={creatingFromTemplate || !templateSiteName.trim()}
              className="bg-white text-black hover:bg-white/90 font-medium text-xs h-9 px-5"
            >
              {creatingFromTemplate ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
              Use Template & Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ─── Template Preview Modal ─── */}
      <TemplatePreviewModal
        open={!!previewTemplate}
        onOpenChange={(open) => { if (!open) setPreviewTemplate(null); }}
        template={previewTemplate}
      />
    </div>
    </>
  );
}

/* ─────────────── site card (grid) ─────────────── */
function SiteCard({
  site, index, onOpen, onDelete,
}: {
  site: DesignerSite; index: number; onOpen: () => void; onDelete: () => void;
}) {
  const statusClass = statusColors[site.status] || statusColors.draft;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <div className="group relative bg-[#141414] border border-[#222] rounded-xl overflow-hidden hover:border-[#3a3a3a] transition-all duration-200">
        {/* Thumbnail */}
        <div className="relative aspect-[16/10] bg-[#0e0e0e] overflow-hidden">
          {site.thumbnail_url ? (
            <img src={site.thumbnail_url} alt={site.site_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111] to-[#0a0a0a]">
              <div className="flex flex-col items-center gap-3">
                <div className="grid grid-cols-3 gap-1 opacity-20">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className={`${i < 3 ? 'w-8 h-5' : 'w-8 h-4'} bg-white/30 rounded-sm`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2">
            <Button
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
              className="bg-white text-black hover:bg-white/90 font-medium text-xs h-8 px-4 shadow-xl"
            >
              <Pencil className="w-3 h-3 mr-1.5" />
              Open Workshop
            </Button>
          </div>

          {/* More menu */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <button className="w-7 h-7 rounded-md bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/70 transition-colors">
                  <MoreHorizontal className="w-3.5 h-3.5 text-white/70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] min-w-[140px]">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onOpen(); }} className="text-white/80 text-xs focus:bg-white/5 focus:text-white">
                  <Pencil className="w-3 h-3 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 text-xs focus:bg-red-500/10 focus:text-red-400">
                  <Trash2 className="w-3 h-3 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-white text-[13px] font-medium truncate leading-tight">{site.site_name}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <button className="shrink-0 text-[#555] hover:text-[#999] transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[#2a2a2a] min-w-[140px]">
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onOpen(); }} className="text-white/80 text-xs focus:bg-white/5 focus:text-white">
                  <Pencil className="w-3 h-3 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#2a2a2a]" />
                <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }} className="text-red-400 text-xs focus:bg-red-500/10 focus:text-red-400">
                  <Trash2 className="w-3 h-3 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-[10px] capitalize shrink-0 border px-1.5 py-0 h-5 font-normal ${statusClass}`}>
              {site.status}
            </Badge>
            <span className="text-[#444] text-[11px]">·</span>
            <span className="text-[#555] text-[11px] flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(site.updated_at)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── site list item ─────────────── */
function SiteListItem({
  site, index, onOpen, onDelete,
}: {
  site: DesignerSite; index: number; onOpen: () => void; onDelete: () => void;
}) {
  const statusClass = statusColors[site.status] || statusColors.draft;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: index * 0.02 }}
    >
      <div
        onClick={onOpen}
        className="group flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-white/[0.03] border border-transparent hover:border-[#2a2a2a] cursor-pointer transition-all"
      >
        {/* Mini thumbnail */}
        <div className="w-16 h-10 rounded-md bg-[#111] border border-[#222] overflow-hidden shrink-0">
          {site.thumbnail_url ? (
            <img src={site.thumbnail_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Layout className="w-3.5 h-3.5 text-[#333]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-[13px] font-medium truncate">{site.site_name}</p>
          <p className="text-[#555] text-[11px]">Edited {timeAgo(site.updated_at)}</p>
        </div>

        <Badge variant="outline" className={`text-[10px] capitalize border px-1.5 py-0 h-5 font-normal ${statusClass}`}>
          {site.status}
        </Badge>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onOpen(); }} className="h-7 px-2 text-[#888] hover:text-white hover:bg-white/5">
            <Pencil className="w-3 h-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-7 px-2 text-red-400/60 hover:text-red-400 hover:bg-red-500/10">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────── template card (marketplace) ─────────────── */
function TemplateCard({
  template, index, onSelect, onPreview,
}: {
  template: typeof TEMPLATES[0]; index: number; onSelect: () => void; onPreview: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, duration: 0.2 }}
    >
      <div className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-ring transition-all duration-200">
        {/* Live Preview Thumbnail */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <TemplateThumbnail template={template} />
          {/* Hover overlay with buttons */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2">
            <Button
              onClick={onPreview}
              variant="outline"
              className="bg-transparent border-white/30 text-white hover:bg-white/10 font-medium text-xs h-8 px-3 shadow-xl"
            >
              <Eye className="w-3 h-3 mr-1.5" />
              Preview
            </Button>
            <Button
              onClick={onSelect}
              className="bg-white text-black hover:bg-white/90 font-medium text-xs h-8 px-3 shadow-xl"
            >
              <Sparkles className="w-3 h-3 mr-1.5" />
              Use
            </Button>
          </div>
          {/* Category badge */}
          <div className="absolute top-2.5 left-2.5 z-10">
            <Badge className="bg-black/50 backdrop-blur-sm text-white/70 border-white/10 text-[10px] font-normal px-2 py-0 h-5">
              {template.category}
            </Badge>
          </div>
          {/* Page count badge */}
          {template.pages && template.pages.length > 1 && (
            <div className="absolute top-2.5 right-2.5 z-10">
              <Badge className="bg-black/50 backdrop-blur-sm text-white/70 border-white/10 text-[10px] font-normal px-2 py-0 h-5">
                {template.pages.length} pages
              </Badge>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3.5 space-y-1">
          <p className="text-foreground text-[13px] font-medium truncate">{template.name}</p>
          <p className="text-muted-foreground text-[11px] line-clamp-1">{template.description}</p>
        </div>
      </div>
    </motion.div>
  );
}
