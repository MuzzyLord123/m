import { useState, useEffect, useCallback, useMemo } from 'react';
import { DesignerSplash } from '@/components/splash/DesignerSplash';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Paintbrush, Globe, Loader2, ExternalLink, Trash2, Download,
  MoreHorizontal, Layout, Pencil, Search, LayoutGrid, List, ArrowUpDown,
  Eye, Wand2, Layers, Palette, Store, Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import type { DesignerTemplate } from '@/components/designer/types';

/* The template catalogue is ~200KB of definitions - a third of everything
   the Workshop downloads. Parsing it before the dashboard could paint is
   what made opening the Workshop feel slow, so it is fetched only when
   the marketplace is actually opened (warmed on hover, so the click still
   feels instant) and cached for the rest of the session. */
let TEMPLATE_CACHE: DesignerTemplate[] | null = null;
let TEMPLATE_INFLIGHT: Promise<DesignerTemplate[]> | null = null;
const loadTemplates = () => {
  if (TEMPLATE_CACHE) return Promise.resolve(TEMPLATE_CACHE);
  TEMPLATE_INFLIGHT ??= import('@/components/designer/constants/templates')
    .then(mod => (TEMPLATE_CACHE = mod.TEMPLATES as DesignerTemplate[]));
  return TEMPLATE_INFLIGHT;
};
import { useUserRole } from '@/hooks/useUserRole';
import { TemplatePreviewModal } from '@/components/designer/TemplatePreviewModal';
import { SiteSubmissionsInbox } from '@/components/designer/SiteSubmissionsInbox';
import { TemplateThumbnail } from '@/components/designer/TemplateThumbnail';
import { cn } from '@/lib/utils';
import {
  PageHeader, Panel, StatusBadge, RelativeTime, EmptyState, ConfirmDialog,
  DataTable, SkeletonBlock, FIELD, FIELD_LABEL, CHIP_ON, CHIP_OFF,
  type Column,
} from '@/components/platform';

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

type SortOption = 'updated' | 'created' | 'name';
type ViewMode = 'grid' | 'list';
type DashTab = 'sites' | 'marketplace' | 'submissions';

/* ─── template categories for marketplace ─── */


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
  const [selectedTemplate, setSelectedTemplate] = useState<DesignerTemplate | null>(null);
  const [templateSiteName, setTemplateSiteName] = useState('');
  const [creatingFromTemplate, setCreatingFromTemplate] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<DesignerTemplate | null>(null);
  const [templates, setTemplates] = useState<DesignerTemplate[]>(() => TEMPLATE_CACHE || []);
  // Starts pending so the marketplace can never flash "0 templates" in the
  // frame between the tab opening and the catalogue arriving.
  const [templatesLoading, setTemplatesLoading] = useState(!TEMPLATE_CACHE);

  /* One place decides when the catalogue lands in state, so a background
     prefetch and an opened tab can never disagree about what is loaded. */
  const adoptTemplates = useCallback(() => {
    if (TEMPLATE_CACHE) { setTemplates(TEMPLATE_CACHE); setTemplatesLoading(false); return; }
    setTemplatesLoading(true);
    loadTemplates().then(t => { setTemplates(t); setTemplatesLoading(false); });
  }, []);

  // Opening the marketplace is the moment the catalogue is definitely needed.
  useEffect(() => {
    if (activeTab !== 'marketplace') return;
    adoptTemplates();
  }, [activeTab, adoptTemplates]);

  /* An enquiry nobody notices is the same as an enquiry that was never
     received, so the count rides on the tab rather than waiting to be found. */
  const [unreadSubmissions, setUnreadSubmissions] = useState(0);
  useEffect(() => {
    if (sites.length === 0) { setUnreadSubmissions(0); return; }
    let alive = true;
    // A GET with limit(1) rather than a HEAD: the count rides in the same
    // content-range either way, and one row costs nothing, but a HEAD
    // response loses that header to any proxy that strips it.
    supabase
      .from('site_form_submissions' as never)
      .select('id', { count: 'exact' })
      .in('site_id', sites.map(s => s.id))
      .eq('is_read', false)
      .eq('is_spam', false)
      .limit(1)
      .then(({ count }) => { if (alive) setUnreadSubmissions(count || 0); });
    return () => { alive = false; };
  }, [sites, activeTab]);

  /* Once the dashboard is up and the browser has nothing better to do,
     fetch the catalogue in the background. The dashboard never waits on
     it, and the marketplace is already there by the time it is opened. */
  useEffect(() => {
    if (!subscribed || TEMPLATE_CACHE) return;
    const idle = (window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    });
    if (idle.requestIdleCallback) {
      const h = idle.requestIdleCallback(() => { void loadTemplates(); }, { timeout: 4000 });
      return () => idle.cancelIdleCallback?.(h);
    }
    const t = window.setTimeout(() => { void loadTemplates(); }, 1500);
    return () => window.clearTimeout(t);
  }, [subscribed]);

  const TEMPLATE_CATEGORIES = useMemo(
    () => ['All', ...Array.from(new Set(templates.map(t => t.category)))],
    [templates],
  );

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

      const template = templateId ? (await loadTemplates()).find(t => t.id === templateId) : null;

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
  const filteredTemplates = templates.filter(t => {
    const matchCat = marketplaceCategory === 'All' || t.category === marketplaceCategory;
    const matchSearch = !marketplaceSearch || t.name.toLowerCase().includes(marketplaceSearch.toLowerCase()) || t.description.toLowerCase().includes(marketplaceSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  /* ── loading ── */
  if (checkingSubscription) {
    return (
      <div className="min-h-[80vh] p-4 md:p-6 lg:p-8" aria-hidden>
        <span className="block h-5 w-40 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-3.5 w-64 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonBlock key={i} className="h-56 rounded-[10px]" />
          ))}
        </div>
      </div>
    );
  }

  /* ── paywall ── */
  if (!subscribed) {
    return (
      <div className="mx-auto max-w-md px-4 py-20">
        <div className="space-y-6">
          <div>
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Client portal
            </span>
            <h1 className="mt-1 flex items-center gap-2 text-[17px] font-semibold tracking-[-0.015em] text-foreground">
              <Paintbrush className="h-4 w-4 text-primary" aria-hidden />
              Website designer
            </h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Build websites with the drag-and-drop editor. Templates, pages and SEO in one place.
            </p>
          </div>
          <Panel className="space-y-5 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-medium text-foreground">Pro plan</p>
                <p className="mt-0.5 text-[11.5px] text-muted-foreground">Full access to all features</p>
              </div>
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Pro</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-semibold tabular-nums text-foreground">£49.99</span>
              <span className="text-[13px] text-muted-foreground">/month</span>
            </div>
            <ul className="space-y-2.5 text-xs text-ink-2">
              <li className="flex items-center gap-2.5"><Layout className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> 50+ starter templates across 20+ niches</li>
              <li className="flex items-center gap-2.5"><Store className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> Full template marketplace with preview</li>
              <li className="flex items-center gap-2.5"><Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> Unlimited websites and pages</li>
              <li className="flex items-center gap-2.5"><Paintbrush className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> Drag-and-drop visual editor (Workshop)</li>
              <li className="flex items-center gap-2.5"><Wand2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> AI-powered website generation</li>
              <li className="flex items-center gap-2.5"><Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> 70+ section blocks and component library</li>
              <li className="flex items-center gap-2.5"><Palette className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> Global design system and style tokens</li>
              <li className="flex items-center gap-2.5"><Eye className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> Live preview and responsive testing</li>
            </ul>
            <Button onClick={handleCheckout} disabled={checkoutLoading} className="h-9 w-full rounded-lg text-xs">
              {checkoutLoading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : null}
              Subscribe now
            </Button>
            <button
              onClick={checkSubscription}
              className="w-full pt-1 text-center text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              Already subscribed? Refresh status
            </button>
          </Panel>
        </div>
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
    <div className="min-h-[80vh] space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        kicker="Client portal"
        title="Website designer"
        description={subscriptionEnd
          ? `Renews ${new Date(subscriptionEnd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
          : 'Subscription active'}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="h-8 rounded-lg px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              {portalLoading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <ExternalLink className="mr-1.5 h-3 w-3" />}
              Manage plan
            </Button>
            <Button
              onClick={() => setShowNewSiteDialog(true)}
              size="sm"
              className="h-8 rounded-lg px-3 text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> New site
            </Button>
          </div>
        }
      />

      {/* ─── Tabs: sites / marketplace ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('sites')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150',
              activeTab === 'sites'
                ? 'bg-foreground/[0.05] text-foreground'
                : 'text-muted-foreground hover:bg-foreground/[0.025] hover:text-foreground',
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            My sites
          </button>
          <button
            onClick={() => setActiveTab('marketplace')}
            /* Warm the catalogue on approach so the tab opens instantly. */
            onMouseEnter={() => { void loadTemplates(); }}
            onFocus={() => { void loadTemplates(); }}
            onTouchStart={() => { void loadTemplates(); }}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150',
              activeTab === 'marketplace'
                ? 'bg-foreground/[0.05] text-foreground'
                : 'text-muted-foreground hover:bg-foreground/[0.025] hover:text-foreground',
            )}
          >
            <Store className="h-3.5 w-3.5" />
            Template marketplace
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={cn(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150',
              activeTab === 'submissions'
                ? 'bg-foreground/[0.05] text-foreground'
                : 'text-muted-foreground hover:bg-foreground/[0.025] hover:text-foreground',
            )}
          >
            <Inbox className="h-3.5 w-3.5" />
            Form submissions
            {unreadSubmissions > 0 && (
              <span className="ml-0.5 rounded-full bg-primary px-1.5 py-px text-[10px] font-semibold tabular-nums leading-[1.4] text-primary-foreground">
                {unreadSubmissions > 99 ? '99+' : unreadSubmissions}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/lounge/workshop-studio')}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.025] hover:text-foreground"
          >
            <Paintbrush className="h-3.5 w-3.5" />
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
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.025] hover:text-foreground"
          >
            <Download className="h-3.5 w-3.5" />
            Import from Studio
          </button>
        </div>

        {activeTab === 'sites' && sites.length > 0 && (
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex h-8 items-center overflow-hidden rounded-lg border border-border/60">
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex h-full w-8 items-center justify-center transition-colors duration-150',
                  viewMode === 'grid' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex h-full w-8 items-center justify-center border-l border-border/60 transition-colors duration-150',
                  viewMode === 'list' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-border/60 px-2.5 text-[11px] text-muted-foreground transition-colors duration-150 hover:text-foreground"
                >
                  <ArrowUpDown className="h-3 w-3" />
                  {sortBy === 'updated' ? 'Last edited' : sortBy === 'created' ? 'Date created' : 'Name'}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[140px] rounded-[10px] border-border/60">
                <DropdownMenuItem onClick={() => setSortBy('updated')} className="text-xs">Last edited</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('created')} className="text-xs">Date created</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')} className="text-xs">Name</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* ─── Sites tab ─── */}
      {activeTab === 'sites' && (
        <>
          {/* Search bar + delete all */}
          {sites.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search sites"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className={cn(FIELD, 'pl-9')}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteAllDialog(true)}
                className="h-8 rounded-lg border-destructive/30 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-3 w-3" /> Delete all
              </Button>
            </div>
          )}

          {/* Grid / list */}
          {loadingSites ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden>
              {Array.from({ length: 4 }, (_, i) => (
                <SkeletonBlock key={i} className="h-56 rounded-[10px]" />
              ))}
            </div>
          ) : filtered.length === 0 && sites.length === 0 ? (
            <Panel>
              <EmptyState
                title="No sites yet"
                body="Create your first site, or browse the template marketplace to start from a design."
                action={{ label: 'Create site', onClick: () => setShowNewSiteDialog(true) }}
              />
            </Panel>
          ) : filtered.length === 0 ? (
            <Panel>
              <EmptyState compact title="No matching sites" body={`Nothing matches "${searchQuery}".`} />
            </Panel>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((site) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  onOpen={() => openWithSplash(site.id)}
                  onDelete={() => handleDeleteSite(site)}
                />
              ))}
            </div>
          ) : (
            <Panel className="overflow-hidden">
              <SiteTable
                sites={filtered}
                onOpen={openWithSplash}
                onDelete={handleDeleteSite}
              />
            </Panel>
          )}
        </>
      )}

      {/* ─── Form submissions tab ─── */}
      {activeTab === 'submissions' && (
        <SiteSubmissionsInbox sites={sites.map(s => ({ id: s.id, site_name: s.site_name }))} />
      )}

      {/* ─── Marketplace tab ─── */}
      {activeTab === 'marketplace' && (
        <div className="space-y-5">
          {/* Marketplace header */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[13.5px] font-[550] tracking-[-0.01em] text-foreground">Template marketplace</h2>
              <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                {templatesLoading
                  ? 'Opening the catalogue…'
                  : `${templates.length} professionally designed templates across ${Math.max(0, TEMPLATE_CATEGORIES.length - 1)} industries`}
              </p>
            </div>
            <div className="relative w-full max-w-[240px]">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search templates"
                value={marketplaceSearch}
                onChange={e => setMarketplaceSearch(e.target.value)}
                className={cn(FIELD, 'h-9 pl-9')}
              />
            </div>
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setMarketplaceCategory(cat)}
                aria-pressed={marketplaceCategory === cat}
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-medium transition-colors duration-150',
                  marketplaceCategory === cat ? CHIP_ON : CHIP_OFF,
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Template grid */}
          {templatesLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonBlock key={i} className="h-[236px] rounded-xl" />
              ))}
            </div>
          ) : filteredTemplates.length === 0 ? (
            <Panel>
              <EmptyState compact title="No matching templates" body="Try a different search or category." />
            </Panel>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
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

      {/* ─── New site dialog ─── */}
      <Dialog open={showNewSiteDialog} onOpenChange={setShowNewSiteDialog}>
        <DialogContent className="rounded-xl border-border/60 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">New site</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              Give your site a name to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Site name</Label>
              <Input
                value={newSiteName}
                onChange={e => setNewSiteName(e.target.value)}
                placeholder="My new website"
                autoFocus
                className={FIELD}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Description (optional)</Label>
              <Textarea
                value={newSiteDesc}
                onChange={e => setNewSiteDesc(e.target.value)}
                placeholder="What is this site for?"
                rows={2}
                className={cn(FIELD, 'h-auto min-h-[64px] resize-none')}
              />
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setShowNewSiteDialog(false)} className="h-8 rounded-lg px-3 text-xs">
              Cancel
            </Button>
            <Button onClick={() => handleCreateSite()} disabled={creating || !newSiteName.trim()} className="h-8 rounded-lg px-3 text-xs">
              {creating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete all confirmation ─── */}
      <ConfirmDialog
        open={showDeleteAllDialog}
        onOpenChange={setShowDeleteAllDialog}
        title="Delete all sites"
        consequence={`This permanently deletes all ${sites.length} site${sites.length !== 1 ? 's' : ''}, including pages, assets and settings. It cannot be undone.`}
        confirmLabel="Delete all sites"
        onConfirm={handleDeleteAll}
        loading={deletingAll}
      />

      {/* ─── Template use dialog ─── */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="rounded-xl border-border/60 bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Use template</DialogTitle>
            <DialogDescription className="text-[13px] text-muted-foreground">
              Create a new site using the "{selectedTemplate?.name}" template.
            </DialogDescription>
          </DialogHeader>

          {/* Template preview */}
          {selectedTemplate && (
            <div className="relative mb-2 aspect-[16/10] overflow-hidden rounded-[10px] border border-border/60 bg-foreground/[0.02]">
              <TemplateThumbnail template={selectedTemplate} />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                {selectedTemplate?.category}
              </span>
              <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                {selectedTemplate?.elements.length} sections
              </span>
            </div>
            <p className="text-xs leading-relaxed text-ink-2">{selectedTemplate?.description}</p>

            <div className="space-y-1.5 pt-2">
              <Label className={FIELD_LABEL}>Site name</Label>
              <Input
                value={templateSiteName}
                onChange={e => setTemplateSiteName(e.target.value)}
                placeholder="My website"
                autoFocus
                className={FIELD}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="ghost" onClick={() => setSelectedTemplate(null)} className="h-8 rounded-lg px-3 text-xs">
              Cancel
            </Button>
            <Button
              onClick={() => selectedTemplate && handleCreateSite(selectedTemplate.id)}
              disabled={creatingFromTemplate || !templateSiteName.trim()}
              className="h-8 rounded-lg px-3 text-xs"
            >
              {creatingFromTemplate ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1 h-3.5 w-3.5" />}
              Use template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* ─── Template preview modal ─── */}
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
  site, onOpen, onDelete,
}: {
  site: DesignerSite; onOpen: () => void; onDelete: () => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:bg-foreground/[0.025]">
      {/* Thumbnail */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${site.site_name} in the Workshop`}
        className="block w-full text-left"
      >
        <div className="relative flex aspect-[16/10] items-center justify-center border-b border-border/60 bg-foreground/[0.02]">
          {site.thumbnail_url ? (
            <img src={site.thumbnail_url} alt={site.site_name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid grid-cols-3 gap-1 opacity-40" aria-hidden>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`${i < 3 ? 'h-5 w-8' : 'h-4 w-8'} rounded-sm bg-foreground/15`} />
              ))}
            </div>
          )}
        </div>
      </button>

      {/* Info */}
      <div className="flex items-start justify-between gap-2 p-3.5">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium leading-tight text-foreground">{site.site_name}</p>
          <div className="mt-1 flex items-center gap-2.5">
            <StatusBadge status={site.status} className="text-[11px]" />
            <RelativeTime date={site.updated_at} />
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Site actions"
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px] rounded-[10px] border-border/60">
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onOpen(); }} className="text-xs">
              <Pencil className="mr-2 h-3 w-3" /> Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onDelete(); }} className="text-xs text-destructive">
              <Trash2 className="mr-2 h-3 w-3" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ─────────────── site table (list view) ─────────────── */
function SiteTable({
  sites, onOpen, onDelete,
}: {
  sites: DesignerSite[];
  onOpen: (siteId: string) => void;
  onDelete: (site: DesignerSite) => void;
}) {
  const columns: Column<DesignerSite>[] = [
    {
      key: 'site',
      header: 'Site',
      render: (s) => (
        <span className="flex min-w-0 items-center gap-3 py-1">
          <span className="flex h-9 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-foreground/[0.02]">
            {s.thumbnail_url ? (
              <img src={s.thumbnail_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Layout className="h-3.5 w-3.5 text-muted-foreground/50" />
            )}
          </span>
          <span className="truncate text-[13px] font-medium text-foreground">{s.site_name}</span>
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      hideBelowMd: true,
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'updated',
      header: 'Edited',
      align: 'right',
      render: (s) => <RelativeTime date={s.updated_at} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '84px',
      render: (s) => (
        <span className="inline-flex items-center justify-end gap-1">
          <button
            type="button"
            aria-label={`Edit ${s.site_name}`}
            onClick={(e) => { e.stopPropagation(); onOpen(s.id); }}
            className="rounded-md p-1.5 text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            type="button"
            aria-label={`Delete ${s.site_name}`}
            onClick={(e) => { e.stopPropagation(); onDelete(s); }}
            className="rounded-md p-1.5 text-muted-foreground transition-colors duration-150 hover:text-risk"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </span>
      ),
    },
  ];

  return (
    <DataTable
      rows={sites}
      columns={columns}
      rowKey={(s) => s.id}
      onRowClick={(s) => onOpen(s.id)}
      aria-label="Designer sites"
    />
  );
}

/* ─────────────── template card (marketplace) ─────────────── */
function TemplateCard({
  template, onSelect, onPreview,
}: {
  template: DesignerTemplate; onSelect: () => void; onPreview: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
      {/* Live preview thumbnail */}
      <div className="relative aspect-[16/10] overflow-hidden border-b border-border/60 bg-foreground/[0.02]">
        <TemplateThumbnail template={template} />
      </div>

      {/* Info */}
      <div className="p-3.5">
        <p className="truncate text-[13px] font-medium text-foreground">{template.name}</p>
        <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
          {template.category}
          {template.pages && template.pages.length > 1 ? ` · ${template.pages.length} pages` : ''}
        </p>
        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPreview}
            className="h-7 flex-1 rounded-lg text-[11px] text-muted-foreground hover:text-foreground"
          >
            <Eye className="mr-1.5 h-3 w-3" />
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSelect}
            className="h-7 flex-1 rounded-lg text-[11px]"
          >
            Use template
          </Button>
        </div>
      </div>
    </div>
  );
}
