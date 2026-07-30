import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Building2, User, Target, LayoutDashboard, Workflow, Search, Plus,
  Radar, Menu, Shield, UserPlus, ChevronDown, SlidersHorizontal, ArrowRightLeft, Download,
} from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { usePortalHome } from '@/hooks/usePortalHome';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useIsMobile, useMediaQuery } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useCRMData, fetchTimeline, setLifecycleStage, type EntityType, type LifecycleStage } from './useCRMData';
import { EntityDetail } from './EntityDetail';
import { ImportExportMenu } from './ImportExportMenu';
import { exportEntities } from './csvIO';
import { useAdmins, type AdminUser } from './useAdmins';
import { NewEntityDialog } from './NewEntityDialog';
import CRMLeadImportDialog from './CRMLeadImportDialog';
import {
  AvatarID, EmptyState, Panel, PanelHeader, SkeletonLedger,
  CommandPalette, ShortcutOverlay, usePlatformKeys,
  StatusDot, statusTone, statusLabel, RelativeTime, Money,
} from '@/components/platform';
import {
  LeadCard, type LeadCardData,
  SavedViewsBar, useSavedViews,
  FilterBuilder, applyFilters, BulkBar,
  type FilterCondition, type FilterFieldDef,
  RecordHeader, RecordTimeline, type TimelineEvent,
  PipelineBoard, ReportTiles, type PipelineItem, type PipelineStage,
  BottomSheet,
  VirtualTable, type VirtualColumn,
} from '@/components/platform/crm';

type Section = 'dashboard' | 'companies' | 'contacts' | 'opportunities' | 'workflows';
type OwnerFilter = 'all' | 'mine' | 'unassigned' | string; // string = specific user id

const NAV: { key: Section; label: string; icon: any; entity?: EntityType }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'companies', label: 'Companies', icon: Building2, entity: 'company' },
  { key: 'contacts', label: 'Contacts', icon: User, entity: 'contact' },
  { key: 'opportunities', label: 'Opportunities', icon: Target, entity: 'opportunity' },
  { key: 'workflows', label: 'Workflows', icon: Workflow },
];

/** English plurals for the entity nouns shown in counts. */
function pluralise(entity: EntityType, n: number): string {
  if (n === 1) return entity;
  return entity === 'company' ? 'companies' : entity === 'opportunity' ? 'opportunities' : 'contacts';
}

const TABLE_FOR: Record<EntityType, 'crm_companies' | 'crm_contacts' | 'crm_opportunities'> = {
  company: 'crm_companies',
  contact: 'crm_contacts',
  opportunity: 'crm_opportunities',
};

/** Client-side filterable fields per entity - applied over the fetched set only. */
const FILTER_FIELDS: Record<EntityType, FilterFieldDef[]> = {
  company: [
    { key: 'name', label: 'Name', type: 'text' },
    { key: 'industry', label: 'Industry', type: 'text' },
    { key: 'city', label: 'City', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'relationship_type', label: 'Relationship', type: 'text' },
  ],
  contact: [
    { key: 'full_name', label: 'Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'job_title', label: 'Job title', type: 'text' },
    { key: 'relationship_type', label: 'Relationship', type: 'text' },
  ],
  opportunity: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'value', label: 'Value', type: 'number' },
    { key: 'currency', label: 'Currency', type: 'text' },
    { key: 'description', label: 'Description', type: 'text' },
  ],
};

/** Map a fetched row to the kit's LeadCard shape - presentation only. */
function toLeadCard(entity: EntityType, r: any, stages: LifecycleStage[]): LeadCardData {
  const stage = stages.find(s => s.id === r.lifecycle_stage_id);
  return {
    id: r.id,
    name:
      entity === 'company' ? (r.name || 'Untitled') :
      entity === 'contact' ? (r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email || 'Unnamed') :
      (r.title || 'Untitled'),
    company:
      entity === 'company' ? (r.industry || r.city || null) :
      entity === 'contact' ? (r.job_title || r.email || null) :
      null,
    stage: stage?.name ?? null,
    stageTone: stage ? statusTone(stage.slug) : undefined,
    value: entity === 'opportunity' ? Number(r.value || 0) : null,
    lastActivity: r.updated_at,
    email: r.email ?? null,
    phone: r.phone ?? null,
  };
}

/** Key facts for the mobile record preview sheet - display only. */
function factsFor(entity: EntityType, r: any): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const push = (label: string, value: any) => { if (value) out.push({ label, value: String(value) }); };
  if (entity === 'company') {
    push('Industry', r.industry);
    push('Location', [r.city, r.country].filter(Boolean).join(', '));
    push('Email', r.email);
    push('Phone', r.phone);
  } else if (entity === 'contact') {
    push('Job title', r.job_title);
    push('Email', r.email);
    push('Phone', r.phone);
    push('Mobile', r.mobile);
  } else {
    push('Value', r.value != null ? `${r.currency || 'GBP'} ${Number(r.value).toLocaleString()}` : null);
    push('Probability', r.probability != null ? `${r.probability}%` : null);
    push('Expected close', r.expected_close_date ? format(new Date(r.expected_close_date), 'd MMM yyyy') : null);
  }
  return out;
}

/**
 * Desktop power-table columns per entity. Every cell renders a field the
 * row already carries (or a lookup over the already-fetched companies and
 * admins) - nothing is invented, absent values show a quiet dash.
 */
function buildTableColumns(
  entity: EntityType,
  stages: LifecycleStage[],
  companyById: Map<string, any>,
  adminById: Map<string, AdminUser>,
): VirtualColumn<any>[] {
  const stageById = new Map(stages.map(s => [s.id, s]));
  const dash = <span className="text-xs text-muted-foreground">–</span>;

  const nameCol: VirtualColumn<any> = {
    key: 'name',
    header: 'Name',
    track: 'minmax(220px,1.4fr)',
    sortValue: (r) => (
      entity === 'company' ? (r.name || '') :
      entity === 'contact' ? (r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email || '') :
      (r.title || '')
    ).toLowerCase(),
    render: (r) => {
      const primary =
        entity === 'company' ? (r.name || 'Untitled') :
        entity === 'contact' ? (r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email || 'Unnamed') :
        (r.title || 'Untitled');
      const secondary = entity === 'opportunity' ? null : (r.email || r.domain || null);
      return (
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium leading-tight">{primary}</p>
          {secondary && <p className="mt-0.5 truncate font-mono text-[10.5px] leading-tight text-muted-foreground">{secondary}</p>}
        </div>
      );
    },
  };

  const stageCol: VirtualColumn<any> = {
    key: 'stage',
    header: 'Stage',
    track: '148px',
    sortValue: (r) => stageById.get(r.lifecycle_stage_id)?.order_index ?? 999,
    render: (r) => {
      const s = stageById.get(r.lifecycle_stage_id);
      return s ? (
        <span className="inline-flex items-center gap-1.5 text-xs">
          <StatusDot tone={statusTone(s.slug)} />
          <span className="truncate">{s.name}</span>
        </span>
      ) : <span className="text-xs text-muted-foreground">No stage</span>;
    },
  };

  const ownerCol: VirtualColumn<any> = {
    key: 'owner',
    header: 'Owner',
    track: '148px',
    sortValue: (r) => {
      const a = r.owner_id ? adminById.get(r.owner_id) : null;
      return a ? (a.full_name || a.email || '').toLowerCase() : 'zzzz';
    },
    render: (r) => {
      const a = r.owner_id ? adminById.get(r.owner_id) : null;
      if (a) {
        return (
          <span className="flex min-w-0 items-center gap-2">
            <AvatarID name={a.full_name} email={a.email} size="sm" />
            <span className="truncate text-xs">{(a.full_name || a.email || '').split(' ')[0]}</span>
          </span>
        );
      }
      if (r.owner_id) return <span className="text-xs text-muted-foreground">Teammate</span>;
      return (
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          <span aria-hidden className="h-6 w-6 shrink-0 rounded-full border border-dashed border-border/60" />
          Unassigned
        </span>
      );
    },
  };

  const updatedCol: VirtualColumn<any> = {
    key: 'updated',
    header: 'Last activity',
    track: '130px',
    align: 'right',
    sortValue: (r) => (r.updated_at ? new Date(r.updated_at).getTime() : 0),
    render: (r) => <RelativeTime date={r.updated_at} />,
  };

  const companyCol: VirtualColumn<any> = {
    key: 'company',
    header: 'Company',
    track: 'minmax(150px,1fr)',
    sortValue: (r) => (companyById.get(r.company_id)?.name || '').toLowerCase(),
    render: (r) => {
      const c = r.company_id ? companyById.get(r.company_id) : null;
      return c ? <span className="block truncate text-xs">{c.name}</span> : dash;
    },
  };

  if (entity === 'company') {
    return [
      nameCol,
      {
        key: 'industry',
        header: 'Industry',
        track: 'minmax(130px,0.9fr)',
        sortValue: (r) => (r.industry || '').toLowerCase(),
        render: (r) => (r.industry ? <span className="block truncate text-xs">{r.industry}</span> : dash),
      },
      {
        key: 'location',
        header: 'Location',
        track: 'minmax(120px,0.8fr)',
        render: (r) => {
          const loc = [r.city, r.country].filter(Boolean).join(', ');
          return loc ? <span className="block truncate text-xs">{loc}</span> : dash;
        },
      },
      stageCol, ownerCol, updatedCol,
    ];
  }
  if (entity === 'contact') {
    return [nameCol, companyCol, stageCol, ownerCol, updatedCol];
  }
  return [
    nameCol,
    companyCol,
    stageCol,
    {
      key: 'value',
      header: 'Value',
      track: '110px',
      align: 'right',
      mono: true,
      sortValue: (r) => Number(r.value || 0),
      render: (r) => (r.value != null ? <Money value={Number(r.value)} whole /> : dash),
    },
    ownerCol,
    updatedCol,
  ];
}

function timelineEvents(rows: any[]): TimelineEvent[] {
  return rows.map((ev, i) => ({
    id: `t-${i}`,
    text: ev.subject || ev.title || statusLabel(ev.event_type || ev.kind) || 'Event',
    when: ev.occurred_at ? format(new Date(ev.occurred_at), 'd MMM yyyy, HH:mm') : '',
    tone: String(ev.event_type || ev.kind || '').includes('stage') ? ('accent' as const) : ('neutral' as const),
  }));
}

export default function CRMShell() {
  const navigate = useNavigate();
  const portalHome = usePortalHome();
  const isMobile = useIsMobile();
  // Below lg the entity nav collapses into the left side drawer.
  const isNarrowNav = useMediaQuery('(max-width: 1023px)');
  const { user } = useAuth();
  const { role, isAdmin } = useUserRole();
  const { toast } = useToast();
  const { companies, contacts, opportunities, stages, loading, refresh } = useCRMData();
  const { admins } = useAdmins();
  const [section, setSection] = useState<Section>('dashboard');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [selected, setSelected] = useState<{ type: EntityType; entity: any } | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  // Presentation state (Phase 3): filters, saved views, board toggle, mobile sheets, keys.
  const [conditions, setConditions] = useState<FilterCondition[]>([]);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');
  const [preview, setPreview] = useState<{ type: EntityType; entity: any } | null>(null);
  const [previewEvents, setPreviewEvents] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [leadImportOpen, setLeadImportOpen] = useState(false);
  // Leads can be imported into companies (where they start) or contacts.
  const [leadImportTarget, setLeadImportTarget] = useState<'contact' | 'company'>('contact');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const leadImportPending = useRef(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const orgId = useMemo(() => {
    const src: any = companies[0] || contacts[0] || opportunities[0];
    return src?.org_id ?? null;
  }, [companies, contacts, opportunities]);

  const currentEntity: EntityType | undefined = NAV.find(n => n.key === section)?.entity;

  // Saved views persist per-device per-entity (no endpoint exists - CRM-ROADMAP.md item 2).
  const { views, saveView, deleteView } = useSavedViews<FilterCondition[]>(`crm:views:${currentEntity ?? 'none'}`);

  // Clear selection when section changes
  useEffect(() => {
    setSelectedIds(new Set()); setSelected(null);
    setConditions([]); setActiveViewId(null); setPreview(null); setViewMode('list');
  }, [section]);

  const rows = useMemo(() => {
    const q = deferredQuery.toLowerCase().trim();
    const src = section === 'companies' ? companies : section === 'contacts' ? contacts : section === 'opportunities' ? opportunities : [];
    const getName = (r: any) =>
      section === 'companies' ? (r.name || '') :
      section === 'contacts' ? (r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email || '') :
      section === 'opportunities' ? (r.title || '') : '';
    return src.filter((r: any) => {
      if (ownerFilter === 'mine' && r.owner_id !== user?.id) return false;
      if (ownerFilter === 'unassigned' && r.owner_id) return false;
      if (ownerFilter !== 'all' && ownerFilter !== 'mine' && ownerFilter !== 'unassigned' && r.owner_id !== ownerFilter) return false;
      if (q && !getName(r).toLowerCase().includes(q)) return false;
      return true;
    });
  }, [section, companies, contacts, opportunities, deferredQuery, ownerFilter, user?.id]);

  // Filter conditions apply client-side over the already-fetched rows only:
  // useCRMData.fetchAll pages 1,000 rows per request with a hard stop at
  // 50,000 rows per table - search, filters and saved views never see
  // anything beyond that fetched set.
  const filtered = useMemo(() => applyFilters(rows as any[], conditions), [rows, conditions]);

  async function assignTo(userId: string | null, ids?: string[]) {
    if (!currentEntity) return;
    const targetIds = ids || Array.from(selectedIds);
    if (!targetIds.length) return;
    const { error } = await supabase.from(TABLE_FOR[currentEntity]).update({ owner_id: userId } as any).in('id', targetIds);
    if (error) { toast({ title: 'Assignment failed', description: error.message, variant: 'destructive' }); return; }
    toast({ title: userId ? 'Assigned' : 'Unassigned', description: `${targetIds.length} record${targetIds.length === 1 ? '' : 's'} updated.` });
    setSelectedIds(new Set());
    refresh();
  }

  // Board stage move - the exact call shape EntityDetail.handleStageChange uses
  // (rpc crm_set_lifecycle_stage via setLifecycleStage); request is byte-identical.
  async function handleBoardStageChange(item: PipelineItem, nextStageId: string) {
    if (!nextStageId) return;
    const { error } = await setLifecycleStage('opportunity', item.id, nextStageId);
    if (error) {
      toast({ title: 'Failed to move stage', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Stage updated', description: 'Workflows may have fired automatically.' });
      refresh();
    }
  }

  // My leads counters (contact-based)
  const myLeadCount = useMemo(() => contacts.filter(c => c.owner_id === user?.id).length, [contacts, user?.id]);
  const unassignedCount = useMemo(() => contacts.filter(c => !c.owner_id).length, [contacts]);

  const companyById = useMemo(() => {
    const m = new Map<string, any>();
    companies.forEach(c => m.set(c.id, c));
    return m;
  }, [companies]);

  const adminById = useMemo(() => {
    const m = new Map<string, AdminUser>();
    admins.forEach(a => m.set(a.user_id, a));
    return m;
  }, [admins]);

  const desktopColumns = useMemo(
    () => (currentEntity ? buildTableColumns(currentEntity, stages, companyById, adminById) : []),
    [currentEntity, stages, companyById, adminById],
  );

  // Bulk stage move: the same crm_set_lifecycle_stage rpc EntityDetail
  // fires per record, called once per selected id - no new endpoint.
  async function bulkSetStage(stageId: string) {
    if (!currentEntity) return;
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    const results = await Promise.all(ids.map(id => setLifecycleStage(currentEntity, id, stageId)));
    const failed = results.filter(r => r.error).length;
    if (failed) {
      toast({ title: 'Some stage moves failed', description: `${failed} of ${ids.length} records were not updated.`, variant: 'destructive' });
    } else {
      toast({ title: 'Stage updated', description: `${ids.length} record${ids.length === 1 ? '' : 's'} moved. Workflows may have fired automatically.` });
    }
    setSelectedIds(new Set());
    refresh();
  }

  // Export the checked subset through the same client-side CSV writer the
  // Data menu uses (exportEntities); nothing leaves the browser.
  function exportSelection() {
    if (!currentEntity) return;
    const subset = filtered.filter((r: any) => selectedIds.has(r.id));
    if (!subset.length) return;
    exportEntities(currentEntity, subset);
    toast({ title: 'Exported', description: `${subset.length} ${currentEntity}${subset.length === 1 ? '' : 's'} exported as CSV.` });
  }

  const boardStages = useMemo<PipelineStage[]>(() => {
    const cols: PipelineStage[] = stages.map(s => ({ key: s.id, label: s.name, tone: statusTone(s.slug) }));
    if (section === 'opportunities' && filtered.some((o: any) => !o.lifecycle_stage_id)) {
      cols.unshift({ key: '', label: 'No stage', tone: 'neutral' });
    }
    return cols;
  }, [stages, filtered, section]);

  const boardItems = useMemo<PipelineItem[]>(() => {
    if (section !== 'opportunities') return [];
    return filtered.map((o: any) => ({
      id: o.id,
      title: o.title || 'Untitled',
      subtitle: o.company_id ? (companyById.get(o.company_id)?.name ?? null) : null,
      value: Number(o.value || 0),
      stage: o.lifecycle_stage_id || '',
    }));
  }, [filtered, section, companyById]);

  // Mobile preview: first timeline items via the existing crm_timeline rpc
  // (same fetchTimeline call EntityDetail's timeline tab uses).
  useEffect(() => {
    let cancelled = false;
    if (!preview) { setPreviewEvents([]); return; }
    setPreviewLoading(true);
    fetchTimeline(preview.type, preview.entity.id).then(t => {
      if (!cancelled) { setPreviewEvents(t); setPreviewLoading(false); }
    });
    return () => { cancelled = true; };
  }, [preview]);

  function openRecord(r: any) {
    if (!currentEntity) return;
    if (isMobile) setPreview({ type: currentEntity, entity: r });
    else setSelected({ type: currentEntity, entity: r });
  }

  function handleConditionsChange(next: FilterCondition[]) {
    setConditions(next);
    setActiveViewId(null);
  }

  // Keyboard: n = new record, / = focus search (never while typing).
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if (typing) return;
      if (e.key === 'n' && currentEntity && orgId) { e.preventDefault(); setNewDialogOpen(true); }
      else if (e.key === '/' && currentEntity) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [currentEntity, orgId]);

  // Platform keys: cmd/ctrl+K palette, ? shortcut overlay.
  usePlatformKeys({ onPalette: () => setPaletteOpen(true), onShortcuts: () => setShortcutsOpen(true) });

  const filterFields = currentEntity ? FILTER_FIELDS[currentEntity] : [];

  const nav = (
    <nav className="flex flex-col gap-0.5 p-2">
      {NAV.map(item => {
        const Icon = item.icon;
        const active = section === item.key;
        return (
          <button
            key={item.key}
            onClick={() => { setSection(item.key); setSelected(null); setNavOpen(false); }}
            className={`relative flex items-center gap-3 px-3 py-2 min-h-[44px] rounded-lg text-sm transition-colors ${
              active ? 'bg-foreground/[0.04] text-foreground font-medium' : 'text-foreground/70 hover:bg-accent hover:text-foreground'
            }`}
          >
            {active && (
              <span aria-hidden className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
            )}
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
            {item.entity && (
              <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
                {item.entity === 'company' ? companies.length : item.entity === 'contact' ? contacts.length : opportunities.length}
              </span>
            )}
          </button>
        );
      })}
      {isAdmin && (
        <button
          onClick={() => navigate('/admin/team')}
          className="flex items-center gap-3 px-3 py-2 min-h-[44px] rounded-lg text-sm text-foreground/70 hover:bg-accent hover:text-foreground mt-2 border-t border-border pt-3"
        >
          <Shield className="h-4 w-4 shrink-0" />
          <span>Manage admins</span>
        </button>
      )}
    </nav>
  );

  const savedViewsBar = currentEntity && (
    <SavedViewsBar
      views={views}
      activeId={activeViewId}
      onSelect={(id) => {
        setActiveViewId(id);
        if (!id) { setConditions([]); return; }
        const v = views.find(x => x.id === id);
        if (v) setConditions(v.filters);
      }}
      onSaveCurrent={conditions.length > 0 ? () => {
        const name = window.prompt('Name this view');
        if (name === null) return;
        const id = saveView(name, conditions);
        setActiveViewId(id);
      } : undefined}
      onDelete={(id) => {
        deleteView(id);
        if (activeViewId === id) { setActiveViewId(null); setConditions([]); }
      }}
      baseLabel={`All ${section}`}
      className="min-w-0 flex-1"
    />
  );

  const previewCard = preview ? toLeadCard(preview.type, preview.entity, stages) : null;
  const previewFacts = preview ? factsFor(preview.type, preview.entity) : [];

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground">
      <header className="h-12 border-b border-border/60 flex items-center gap-2 px-3 sm:px-4 shrink-0">
        {isNarrowNav && (
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11" aria-label="Open navigation"><Menu className="h-4 w-4" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="h-12 flex items-center gap-2 px-4 border-b border-border/60">
                <Radar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold">CRM</span>
              </div>
              <button
                onClick={() => { setNavOpen(false); navigate(portalHome); }}
                className="flex w-full min-h-[44px] items-center gap-2 border-b border-border/60 px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5 shrink-0" />
                Exit to {portalHome === '/dashboard' ? 'Team' : 'Lounge'}
              </button>
              {nav}
            </SheetContent>
          </Sheet>
        )}
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => navigate(portalHome)} title={`Exit to ${portalHome === '/dashboard' ? 'Quooro Team' : 'Lounge'}`}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Exit to {portalHome === '/dashboard' ? 'Team' : 'Lounge'}</span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-[8px] border border-border/60 bg-card flex items-center justify-center">
            <Radar className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm hidden sm:inline">Business relationships</span>
        </div>
        <div className="flex-1" />
        {!isMobile && section !== 'dashboard' && section !== 'workflows' && (
          <div className="relative w-40 sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${section}...`} className="h-9 pl-8 text-sm" />
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        {!isNarrowNav && (
          <aside className="w-60 border-r border-border/60 shrink-0 bg-card/40">
            <ScrollArea className="h-full">{nav}</ScrollArea>
          </aside>
        )}

        <main className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 overflow-hidden p-4 sm:p-6">
              <SkeletonLedger rows={8} className="max-w-6xl rounded-[10px] border border-border/60 bg-card" />
            </div>
          ) : section === 'dashboard' ? (
            <Dashboard
              companies={companies} contacts={contacts} opportunities={opportunities} stages={stages}
              admins={admins} userId={user?.id} isAdmin={isAdmin}
              myLeadCount={myLeadCount} unassignedCount={unassignedCount}
              onOpen={(t, e) => { const target = NAV.find(n => n.entity === t)?.key; if (target) setSection(target); setSelected({ type: t, entity: e }); }}
            />
          ) : section === 'workflows' ? (
            <WorkflowsView />
          ) : (
            <>
              <div className={`${selected && isMobile ? 'hidden' : 'flex'} flex-1 min-w-0 flex-col overflow-hidden bg-background`}>
                {/* Mobile: sticky search row (44px targets) */}
                {isMobile && (
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60">
                    <div className="relative flex-1">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${section}...`} className="h-11 pl-8 text-sm" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFiltersOpen(true)}
                      className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border/60 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters{conditions.length > 0 ? ` (${conditions.length})` : ''}
                    </button>
                    <button
                      type="button"
                      aria-label={`New ${currentEntity}`}
                      onClick={() => setNewDialogOpen(true)}
                      disabled={!orgId}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-[filter] hover:brightness-105 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Scope pills (owner filter) + board toggle */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border/60 overflow-x-auto">
                  {section === 'opportunities' && (
                    <ViewToggle mode={viewMode} onChange={setViewMode} tall={isMobile} />
                  )}
                  <FilterChip active={ownerFilter === 'all'} onClick={() => setOwnerFilter('all')} label={`All ${filtered.length}`} tall={isMobile} />
                  <FilterChip active={ownerFilter === 'mine'} onClick={() => setOwnerFilter('mine')} label="Mine" tall={isMobile} />
                  <FilterChip active={ownerFilter === 'unassigned'} onClick={() => setOwnerFilter('unassigned')} label="Unassigned" tall={isMobile} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`shrink-0 inline-flex items-center gap-1 text-[11px] px-2.5 rounded-full border transition-colors ${isMobile ? 'min-h-[44px] px-3.5' : 'py-1'} ${
                        ownerFilter !== 'all' && ownerFilter !== 'mine' && ownerFilter !== 'unassigned'
                          ? 'bg-primary/15 text-primary border-primary/30' : 'border-border/60 text-muted-foreground hover:text-foreground'
                      }`}>Teammate <ChevronDown className="h-3 w-3" /></button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {admins.map(a => (
                        <DropdownMenuItem key={a.user_id} onClick={() => setOwnerFilter(a.user_id)}>
                          <AvatarID name={a.full_name} email={a.email} size="sm" className="mr-2" />
                          {a.full_name || a.email}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Saved views (persist on this device) + mobile data menu */}
                <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border/60">
                  {savedViewsBar}
                  {isMobile && currentEntity && (
                    <ImportExportMenu
                      entity={currentEntity}
                      rows={filtered}
                      onImported={refresh}
                      onOpenLeadImport={() => {
                        setLeadImportTarget(currentEntity === 'company' ? 'company' : 'contact');
                        setLeadImportOpen(true);
                      }}
                    />
                  )}
                </div>

                {/* Desktop: inline filter builder + count/actions row */}
                {!isMobile && (
                  <>
                    <div className="px-3 py-1.5 border-b border-border/60">
                      <FilterBuilder fields={filterFields} conditions={conditions} onChange={handleConditionsChange} />
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
                      <span className="font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
                        {`${filtered.length} ${pluralise(currentEntity!, filtered.length)}`}
                      </span>
                      <div className="flex items-center gap-1">
                        {currentEntity && (
                          <ImportExportMenu
                            entity={currentEntity}
                            rows={filtered}
                            onImported={refresh}
                            onOpenLeadImport={() => {
                        setLeadImportTarget(currentEntity === 'company' ? 'company' : 'contact');
                        setLeadImportOpen(true);
                      }}
                          />
                        )}
                        <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => setNewDialogOpen(true)} disabled={!orgId}>
                          <Plus className="h-3 w-3" /> New {currentEntity}
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Bulk actions over the existing bulk-assign handler (desktop list) */}
                {!isMobile && viewMode === 'list' && (
                  <BulkBar count={selectedIds.size} onClear={() => setSelectedIds(new Set())}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs"><UserPlus className="h-3 w-3" /> Assign</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">Assign to</DropdownMenuLabel>
                        {admins.map(a => (
                          <DropdownMenuItem key={a.user_id} onClick={() => assignTo(a.user_id)}>
                            <AvatarID name={a.full_name} email={a.email} size="sm" className="mr-2" />
                            {a.full_name || a.email}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => assignTo(null)}>Unassign</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs"><ArrowRightLeft className="h-3 w-3" /> Change stage</Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuLabel className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">Move to stage</DropdownMenuLabel>
                        {stages.map(s => (
                          <DropdownMenuItem key={s.id} onClick={() => bulkSetStage(s.id)}>
                            <span className="mr-2 inline-flex"><StatusDot tone={statusTone(s.slug)} /></span>
                            {s.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={exportSelection}>
                      <Download className="h-3 w-3" /> Export selection
                    </Button>
                  </BulkBar>
                )}

                {section === 'opportunities' && viewMode === 'board' ? (
                  <div className="flex-1 overflow-y-auto p-3">
                    <PipelineBoard
                      stages={boardStages}
                      items={boardItems}
                      onOpen={(item) => {
                        const r = filtered.find((x: any) => x.id === item.id);
                        if (r) openRecord(r);
                      }}
                      onStageChange={handleBoardStageChange}
                    />
                  </div>
                ) : isMobile ? (
                  <VirtualList
                    rows={filtered}
                    stages={stages}
                    currentEntity={currentEntity!}
                    selectedId={selected?.entity?.id}
                    selectedIds={selectedIds}
                    showSelect={false}
                    onToggle={(id) => setSelectedIds(prev => {
                      const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
                    })}
                    onOpen={openRecord}
                  />
                ) : (
                  <>
                    {/* The desktop power table: every column is a field the row
                        already carries; row click opens the full relationship. */}
                    <VirtualTable
                      key={section}
                      rows={filtered}
                      columns={desktopColumns}
                      rowKey={(r: any) => r.id}
                      onRowClick={openRecord}
                      activeId={selected?.entity?.id ?? null}
                      selectable
                      selected={selectedIds}
                      onSelectedChange={setSelectedIds}
                      defaultSort={currentEntity === 'opportunity' ? { key: 'value', dir: 'desc' } : { key: 'updated', dir: 'desc' }}
                      aria-label={`${section} table`}
                      empty={{ title: 'No records', body: 'Nothing matches the current filters.' }}
                    />
                    <div className="flex shrink-0 items-center justify-between border-t border-border/60 px-4 py-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                        {filtered.length.toLocaleString('en-GB')} {pluralise(currentEntity!, filtered.length)} · filtered from {rows.length.toLocaleString('en-GB')} · virtualised
                      </span>
                      <span className="hidden font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground/70 lg:block">
                        ⌘K jump · N new · / search · ? keys
                      </span>
                    </div>
                  </>
                )}
              </div>

              {selected && (
                <>
                  {/* Desktop: the record opens OVER the table as the full
                      business relationship - scrim click or Esc-style X closes
                      and the table is exactly where it was. */}
                  {!isMobile && (
                    <div
                      aria-hidden
                      className="fixed inset-0 z-40 bg-black/40"
                      onClick={() => setSelected(null)}
                    />
                  )}
                  <div className={`${isMobile ? 'fixed inset-0 z-40 bg-background' : 'fixed inset-y-0 right-0 z-50 w-[min(760px,calc(100vw-56px))] border-l border-border/60 bg-card shadow-2xl'} min-w-0 flex flex-col`}>
                    <EntityDetail
                      key={selected.entity.id}
                      entityType={selected.type}
                      entity={selected.entity}
                      stages={stages}
                      list={selected.type === currentEntity ? filtered : undefined}
                      admins={admins}
                      related={{ companies, contacts, opportunities }}
                      onOpenRelated={(t, e) => setSelected({ type: t, entity: e })}
                      onNavigate={(e) => setSelected({ type: selected.type, entity: e })}
                      onClose={() => setSelected(null)}
                      onChanged={refresh}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {currentEntity && (
        <NewEntityDialog
          open={newDialogOpen}
          onOpenChange={setNewDialogOpen}
          entityType={currentEntity}
          companies={companies}
          contacts={contacts}
          orgId={orgId}
          onCreated={refresh}
        />
      )}

      {/* Lead import lives at the shell root, OUTSIDE the loading-conditional
          toolbar subtree, so a refresh can never unmount an open dialog and
          swallow the receipt (IMPORT-CONTRACT.md defect 1). The engine still
          calls onImportComplete exactly as before; the shell defers the actual
          refresh until the dialog closes (Done, Esc or backdrop). */}
      <CRMLeadImportDialog
        target={leadImportTarget}
        open={leadImportOpen}
        onOpenChange={(v) => {
          setLeadImportOpen(v);
          if (!v && leadImportPending.current) {
            leadImportPending.current = false;
            refresh();
          }
        }}
        onImportComplete={() => { leadImportPending.current = true; }}
      />

      {/* Mobile record preview: header + facts + first timeline items */}
      <BottomSheet
        open={!!preview}
        onOpenChange={(v) => { if (!v) setPreview(null); }}
        kicker={preview?.type ?? ''}
        title={previewCard?.name ?? ''}
        tall
        footer={preview ? (
          <button
            type="button"
            onClick={() => { setSelected(preview); setPreview(null); }}
            className="flex h-11 w-full items-center justify-center rounded-[11px] bg-primary text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-105"
          >
            Open full record
          </button>
        ) : undefined}
      >
        {preview && previewCard && (
          <div className="space-y-4">
            <div className="-mx-5 -mt-4">
              <RecordHeader
                name={previewCard.name}
                company={previewCard.company}
                stage={previewCard.stage}
                stageTone={previewCard.stageTone}
                value={previewCard.value}
                phone={preview.entity.phone || preview.entity.mobile || null}
                email={preview.entity.email || null}
                website={preview.entity.website || null}
              />
            </div>
            {previewFacts.length > 0 && (
              <dl>
                {previewFacts.map(f => (
                  <div key={f.label} className="flex items-baseline justify-between gap-4 border-b border-border/50 py-2 text-xs last:border-b-0">
                    <dt className="shrink-0 text-muted-foreground">{f.label}</dt>
                    <dd className="min-w-0 truncate text-right text-foreground">{f.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            <div>
              <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Latest activity</span>
              {previewLoading ? (
                <SkeletonLedger rows={2} className="mt-1.5" />
              ) : (
                <RecordTimeline
                  events={timelineEvents(previewEvents.slice(0, 3))}
                  className="-mx-4"
                />
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Mobile filters, collapsed behind the Filters button */}
      <BottomSheet
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        kicker="Refine"
        title="Filters"
        footer={
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="flex h-11 w-full items-center justify-center rounded-[11px] bg-primary text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-105"
          >
            Show {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </button>
        }
      >
        <FilterBuilder fields={filterFields} conditions={conditions} onChange={handleConditionsChange} />
      </BottomSheet>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        role={role}
        extraActions={[
          ...(currentEntity && orgId ? [{ id: 'crm-new', label: `New ${currentEntity}`, run: () => setNewDialogOpen(true), keywords: 'create add record' }] : []),
          ...(section === 'contacts' || section === 'companies' ? [{
            id: 'crm-import',
            label: section === 'companies' ? 'Import leads into companies' : 'Import leads into contacts',
            run: () => {
              setLeadImportTarget(section === 'companies' ? 'company' : 'contact');
              setLeadImportOpen(true);
            },
            keywords: 'upload csv excel json html import',
          }] : []),
          ...(currentEntity && filtered.length ? [{ id: 'crm-export', label: `Export ${filtered.length} to CSV`, run: () => { exportEntities(currentEntity, filtered); }, keywords: 'download csv data' }] : []),
          ...(section === 'opportunities' ? [{
            id: 'crm-view',
            label: viewMode === 'list' ? 'Switch to board view' : 'Switch to list view',
            run: () => setViewMode(m => (m === 'list' ? 'board' : 'list')),
            keywords: 'pipeline kanban table toggle',
          }] : []),
          ...NAV.filter(n => n.key !== section).map(n => ({
            id: `crm-go-${n.key}`,
            label: `Go to ${n.label}`,
            run: () => setSection(n.key),
            keywords: 'crm section open',
          })),
        ]}
      />
      <ShortcutOverlay open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}

function FilterChip({ active, onClick, label, tall }: { active: boolean; onClick: () => void; label: string; tall?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-[11px] px-2.5 rounded-full border transition-colors ${tall ? 'min-h-[44px] px-3.5' : 'py-1'} ${
        active ? 'bg-primary/15 text-primary border-primary/30' : 'border-border/60 text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function ViewToggle({ mode, onChange, tall }: { mode: 'list' | 'board'; onChange: (m: 'list' | 'board') => void; tall?: boolean }) {
  const seg = (on: boolean) =>
    `px-3 text-xs transition-colors ${tall ? 'h-11' : 'h-[26px]'} ${on ? 'bg-foreground/[0.06] text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`;
  return (
    <div className="flex shrink-0 items-center overflow-hidden rounded-full border border-border/60">
      <button type="button" className={seg(mode === 'list')} onClick={() => onChange('list')}>List</button>
      <button type="button" className={seg(mode === 'board')} onClick={() => onChange('board')}>Board</button>
    </div>
  );
}

function VirtualList({ rows, stages, currentEntity, selectedId, selectedIds, showSelect, onToggle, onOpen }: {
  rows: any[]; stages: LifecycleStage[];
  currentEntity: EntityType; selectedId?: string;
  selectedIds: Set<string>; showSelect: boolean;
  onToggle: (id: string) => void; onOpen: (r: any) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 84,
    overscan: 8,
  });

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex flex-col justify-center">
        <EmptyState compact title="No records" body="Nothing matches the current filters." />
      </div>
    );
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto overflow-x-hidden">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map(vi => {
          const r = rows[vi.index];
          const card = toLeadCard(currentEntity, r, stages);
          const isChecked = selectedIds.has(r.id);
          return (
            <div
              key={r.id}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
            >
              <div className="flex items-stretch">
                {showSelect && (
                  <div className="flex items-center border-b border-border/60 pl-3" onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={isChecked} onCheckedChange={() => onToggle(r.id)} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <LeadCard lead={card} selected={selectedId === r.id || isChecked} onOpen={() => onOpen(r)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard({ companies, contacts, opportunities, stages, admins, userId, isAdmin, myLeadCount, unassignedCount, onOpen }: any) {
  const pipeline = opportunities.reduce((s: number, o: any) => s + Number(o.value || 0), 0);
  const customersCount = companies.filter((c: any) => (c.relationship_type || []).includes('customer')).length;
  const leadsCount = contacts.filter((c: any) => (c.relationship_type || []).includes('lead')).length;

  // Leads per admin
  const leadsByAdmin = useMemo(() => {
    const m = new Map<string, number>();
    contacts.forEach((c: any) => {
      if (!c.owner_id) return;
      m.set(c.owner_id, (m.get(c.owner_id) || 0) + 1);
    });
    return m;
  }, [contacts]);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 sm:p-6 max-w-6xl space-y-5">
        <div>
          <h1 className="text-[17px] font-semibold tracking-[-0.01em]">Business overview</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Every company, person and deal in one connected view.</p>
        </div>

        {/* Position strip */}
        <ReportTiles
          className="grid-cols-3"
          tiles={[
            { label: 'My leads', value: myLeadCount, meta: 'Assigned to you' },
            {
              label: 'Unassigned',
              value: <span className={unassignedCount > 0 ? 'text-attend' : undefined}>{unassignedCount}</span>,
              meta: 'Awaiting assignment',
            },
            { label: 'Team total', value: contacts.length, meta: 'All leads & contacts' },
          ]}
        />

        {/* Book strip */}
        <ReportTiles
          tiles={[
            { label: 'Companies', value: companies.length, meta: `${customersCount} customers · ${leadsCount} leads` },
            { label: 'Contacts', value: contacts.length, meta: 'People across all orgs' },
            { label: 'Opportunities', value: opportunities.length, meta: 'Open deals' },
            { label: 'Pipeline', value: <Money value={pipeline} whole />, meta: 'Not yet weighted' },
          ]}
        />

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Team assignment - gated on the same admin condition as "Manage admins" */}
          {isAdmin && (
            <Panel>
              <PanelHeader label="Leads assigned per admin" />
              <div className="space-y-2.5 p-4">
                {admins.map((a: AdminUser) => {
                  const n = leadsByAdmin.get(a.user_id) || 0;
                  const pct = contacts.length ? (n / contacts.length) * 100 : 0;
                  const isMe = a.user_id === userId;
                  return (
                    <div key={a.user_id} className="flex items-center gap-3 text-xs">
                      <AvatarID name={a.full_name} email={a.email} size="sm" />
                      <span className="w-32 truncate text-ink-2">{a.full_name || a.email}{isMe && <span className="text-primary"> (you)</span>}</span>
                      <div className="relative flex-1 h-1.5" aria-hidden>
                        <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-foreground/45" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{n}</span>
                    </div>
                  );
                })}
                {unassignedCount > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="h-6 w-6 rounded-full border border-dashed border-border/60 shrink-0" />
                    <span className="w-32 truncate text-muted-foreground">Unassigned</span>
                    <div className="relative flex-1 h-1.5" aria-hidden>
                      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-attend/70" style={{ width: `${(unassignedCount / contacts.length) * 100}%` }} />
                    </div>
                    <span className="w-10 text-right font-mono text-[11px] tabular-nums text-attend">{unassignedCount}</span>
                  </div>
                )}
              </div>
            </Panel>
          )}

          <Panel>
            <PanelHeader label="Lifecycle stages" />
            <div className="space-y-2 p-4">
              {stages.map((s: any) => {
                // Dedupe: contacts and companies share the same lead - take the max, then add opportunities
                const cCount = contacts.filter((c: any) => c.lifecycle_stage_id === s.id).length;
                const compCount = companies.filter((c: any) => c.lifecycle_stage_id === s.id).length;
                const oppCount = opportunities.filter((o: any) => o.lifecycle_stage_id === s.id).length;
                const count = Math.max(cCount, compCount) + oppCount;
                const totalContacts = Math.max(contacts.length, companies.length) + opportunities.length || 1;
                const pct = (count / totalContacts) * 100;
                return (
                  <div key={s.id} className="flex items-center gap-3 text-xs">
                    <StatusDot tone={statusTone(s.slug)} />
                    <span className="w-28 text-ink-2 truncate">{s.name}</span>
                    <div className="relative flex-1 h-1.5" aria-hidden>
                      <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-foreground/45" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-10 text-right font-mono text-[11px] tabular-nums text-muted-foreground">{count}</span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <Panel>
          <PanelHeader label="Recently updated" />
          <ul className="divide-y divide-border/60">
            {[...companies.slice(0, 3).map((c: any) => ({ ...c, _t: 'company' as EntityType, _name: c.name })),
              ...contacts.slice(0, 3).map((c: any) => ({ ...c, _t: 'contact' as EntityType, _name: c.full_name || c.email })),
              ...opportunities.slice(0, 3).map((c: any) => ({ ...c, _t: 'opportunity' as EntityType, _name: c.title }))]
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
              .slice(0, 6)
              .map((r: any) => {
                const Icon = r._t === 'company' ? Building2 : r._t === 'contact' ? User : Target;
                return (
                  <li key={`${r._t}-${r.id}`}>
                    <button onClick={() => onOpen(r._t, r)} className="w-full flex items-center gap-3 px-4 py-2 min-h-[44px] hover:bg-foreground/[0.025] transition-colors duration-150">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-border/60 bg-sunken">
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                      <span className="text-[13px] truncate flex-1 text-left">{r._name || 'Untitled'}</span>
                      <RelativeTime date={r.updated_at} className="shrink-0" />
                    </button>
                  </li>
                );
              })}
          </ul>
        </Panel>
      </div>
    </ScrollArea>
  );
}

function WorkflowsView() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [wRes, rRes] = await Promise.all([
        supabase.from('crm_workflows' as any).select('*').order('priority'),
        supabase.from('crm_workflow_runs' as any).select('*').order('created_at', { ascending: false }).limit(20),
      ]);
      setWorkflows((wRes.data as any[]) || []);
      setRuns((rRes.data as any[]) || []);
      setLoading(false);
    })();
  }, []);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 sm:p-6 max-w-5xl space-y-5">
        <div>
          <h1 className="text-[17px] font-semibold tracking-[-0.01em]">Workflows</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Automations that fire when relationships change stage.</p>
        </div>
        {loading ? (
          <SkeletonLedger rows={4} className="rounded-[10px] border border-border/60 bg-card" />
        ) : (
          <Panel className="divide-y divide-border/60">
            {workflows.length === 0 ? (
              <EmptyState compact title="No workflows configured" body="Workflows appear here once automations are set up for stage changes." />
            ) : workflows.map(w => (
              <div key={w.id} className="p-4">
                <p className="text-[13px] font-medium">{w.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{w.description || 'No description'}</p>
              </div>
            ))}
          </Panel>
        )}
      </div>
    </ScrollArea>
  );
}
