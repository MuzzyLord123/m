import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Building2, User, Target, LayoutDashboard, Workflow, Search, Plus,
  Loader2, TrendingUp, Users as UsersIcon, DollarSign, Sparkles, Menu, Shield, UserPlus, Check,
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
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { useCRMData, type EntityType } from './useCRMData';
import { EntityDetail } from './EntityDetail';
import { ImportExportMenu } from './ImportExportMenu';
import { useAdmins, adminColor, type AdminUser } from './useAdmins';
import { NewEntityDialog } from './NewEntityDialog';

type Section = 'dashboard' | 'companies' | 'contacts' | 'opportunities' | 'workflows';
type OwnerFilter = 'all' | 'mine' | 'unassigned' | string; // string = specific user id

const NAV: { key: Section; label: string; icon: any; entity?: EntityType }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'companies', label: 'Companies', icon: Building2, entity: 'company' },
  { key: 'contacts', label: 'Contacts', icon: User, entity: 'contact' },
  { key: 'opportunities', label: 'Opportunities', icon: Target, entity: 'opportunity' },
  { key: 'workflows', label: 'Workflows', icon: Workflow },
];

const REL_COLORS: Record<string, string> = {
  customer: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  lead: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  supplier: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  partner: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  investor: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
};

const TABLE_FOR: Record<EntityType, 'crm_companies' | 'crm_contacts' | 'crm_opportunities'> = {
  company: 'crm_companies',
  contact: 'crm_contacts',
  opportunity: 'crm_opportunities',
};

export default function CRMShell() {
  const navigate = useNavigate();
  const portalHome = usePortalHome();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
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

  const orgId = useMemo(() => {
    const src: any = companies[0] || contacts[0] || opportunities[0];
    return src?.org_id ?? null;
  }, [companies, contacts, opportunities]);

  const currentEntity: EntityType | undefined = NAV.find(n => n.key === section)?.entity;

  // Clear selection when section changes
  useEffect(() => { setSelectedIds(new Set()); setSelected(null); }, [section]);

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

  const adminById = useMemo(() => {
    const m = new Map<string, AdminUser>();
    admins.forEach(a => m.set(a.user_id, a));
    return m;
  }, [admins]);

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

  // My leads counters (contact-based)
  const myLeadCount = useMemo(() => contacts.filter(c => c.owner_id === user?.id).length, [contacts, user?.id]);
  const unassignedCount = useMemo(() => contacts.filter(c => !c.owner_id).length, [contacts]);

  const nav = (
    <nav className="flex flex-col gap-0.5 p-2">
      {NAV.map(item => {
        const Icon = item.icon;
        const active = section === item.key;
        return (
          <button
            key={item.key}
            onClick={() => { setSection(item.key); setSelected(null); setNavOpen(false); }}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              active ? 'bg-primary/15 text-primary font-medium' : 'text-foreground/70 hover:bg-accent hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
            {item.entity && (
              <span className="ml-auto text-[10px] text-muted-foreground">
                {item.entity === 'company' ? companies.length : item.entity === 'contact' ? contacts.length : opportunities.length}
              </span>
            )}
          </button>
        );
      })}
      {isAdmin && (
        <button
          onClick={() => navigate('/admin/team')}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground/70 hover:bg-accent hover:text-foreground mt-2 border-t border-border pt-3"
        >
          <Shield className="h-4 w-4 shrink-0" />
          <span>Manage admins</span>
        </button>
      )}
    </nav>
  );

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-foreground">
      <header className="h-14 border-b border-border flex items-center gap-2 px-3 sm:px-4 shrink-0">
        {isMobile && (
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9"><Menu className="h-4 w-4" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-semibold">CRM</span>
              </div>
              {nav}
            </SheetContent>
          </Sheet>
        )}
        <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => navigate(portalHome)} title={`Exit to ${portalHome === '/dashboard' ? 'Quooro Team' : 'Lounge'}`}>
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Exit to {portalHome === '/dashboard' ? 'Team' : 'Lounge'}</span>
        </Button>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-primary/15 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm hidden sm:inline">Business Relationships</span>
        </div>
        <div className="flex-1" />
        {section !== 'dashboard' && section !== 'workflows' && (
          <div className="relative w-40 sm:w-72">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder={`Search ${section}...`} className="h-9 pl-8 text-sm" />
          </div>
        )}
      </header>

      <div className="flex-1 flex overflow-hidden">
        {!isMobile && (
          <aside className="w-60 border-r border-border shrink-0 bg-card/40">
            <ScrollArea className="h-full">{nav}</ScrollArea>
          </aside>
        )}

        <main className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : section === 'dashboard' ? (
            <Dashboard
              companies={companies} contacts={contacts} opportunities={opportunities} stages={stages}
              admins={admins} userId={user?.id}
              myLeadCount={myLeadCount} unassignedCount={unassignedCount}
              onOpen={(t, e) => { const target = NAV.find(n => n.entity === t)?.key; if (target) setSection(target); setSelected({ type: t, entity: e }); }}
            />
          ) : section === 'workflows' ? (
            <WorkflowsView />
          ) : (
            <>
              <div className={`${selected && isMobile ? 'hidden' : 'flex'} ${selected && !isMobile ? 'w-[380px] border-r border-border' : 'flex-1'} flex-col overflow-hidden bg-background`}>
                {/* Filter + toolbar */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-border overflow-x-auto">
                  <FilterChip active={ownerFilter === 'all'} onClick={() => setOwnerFilter('all')} label={`All ${rows.length}`} />
                  <FilterChip active={ownerFilter === 'mine'} onClick={() => setOwnerFilter('mine')} label="Mine" />
                  <FilterChip active={ownerFilter === 'unassigned'} onClick={() => setOwnerFilter('unassigned')} label="Unassigned" />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                        ownerFilter !== 'all' && ownerFilter !== 'mine' && ownerFilter !== 'unassigned'
                          ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground hover:text-foreground'
                      }`}>Teammate ▾</button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      {admins.map(a => (
                        <DropdownMenuItem key={a.user_id} onClick={() => setOwnerFilter(a.user_id)}>
                          <span className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white mr-2" style={{ backgroundColor: adminColor(a.user_id) }}>{a.initials}</span>
                          {a.full_name || a.email}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                  <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${rows.length} ${currentEntity}${rows.length === 1 ? '' : 's'}`}
                  </span>
                  <div className="flex items-center gap-1">
                    {selectedIds.size > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs"><UserPlus className="h-3 w-3" /> Assign</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuLabel className="text-[10px] uppercase tracking-wide">Assign to</DropdownMenuLabel>
                          {admins.map(a => (
                            <DropdownMenuItem key={a.user_id} onClick={() => assignTo(a.user_id)}>
                              <span className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white mr-2" style={{ backgroundColor: adminColor(a.user_id) }}>{a.initials}</span>
                              {a.full_name || a.email}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => assignTo(null)}>Unassign</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSelectedIds(new Set())}>Clear selection</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {currentEntity && <ImportExportMenu entity={currentEntity} rows={rows} onImported={refresh} />}
                    <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setNewDialogOpen(true)} disabled={!orgId}>
                      <Plus className="h-3 w-3" /> New
                    </Button>
                  </div>
                </div>

                <VirtualList
                  rows={rows}
                  stages={stages}
                  adminById={adminById}
                  currentEntity={currentEntity!}
                  selectedId={selected?.entity?.id}
                  selectedIds={selectedIds}
                  onToggle={(id) => setSelectedIds(prev => {
                    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
                  })}
                  onOpen={(r) => setSelected({ type: currentEntity!, entity: r })}
                />
              </div>

              <AnimatePresence mode="wait">
                {selected && (
                  <div className={`${isMobile ? 'fixed inset-0 z-40 bg-background' : 'flex-1'} flex flex-col`}>
                    <EntityDetail
                      key={selected.entity.id}
                      entityType={selected.type}
                      entity={selected.entity}
                      stages={stages}
                      list={rows}
                      admins={admins}
                      onNavigate={(e) => setSelected({ type: selected.type, entity: e })}
                      onClose={() => setSelected(null)}
                      onChanged={refresh}
                    />
                  </div>
                )}
              </AnimatePresence>
              {!selected && !isMobile && (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
                  <Sparkles className="h-8 w-8 mb-3 opacity-40" />
                  <p className="text-sm">Select a record to view details, timeline, and financials</p>
                </div>
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
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
        active ? 'bg-primary/15 text-primary border-primary/30' : 'border-border text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function VirtualList({ rows, stages, adminById, currentEntity, selectedId, selectedIds, onToggle, onOpen }: {
  rows: any[]; stages: any[]; adminById: Map<string, AdminUser>;
  currentEntity: EntityType; selectedId?: string;
  selectedIds: Set<string>; onToggle: (id: string) => void; onOpen: (r: any) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 84,
    overscan: 8,
  });

  if (rows.length === 0) {
    return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">No records</div>;
  }

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto overflow-x-hidden">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map(vi => {
          const r = rows[vi.index];
          const stage = stages.find(s => s.id === r.lifecycle_stage_id);
          const isSel = selectedId === r.id;
          const isChecked = selectedIds.has(r.id);
          const assignee = r.owner_id ? adminById.get(r.owner_id) : null;
          return (
            <div
              key={r.id}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
              className="border-b border-border"
            >
              <div className={`flex items-start gap-2 px-3 py-3 hover:bg-accent/40 ${isSel ? 'bg-accent' : ''} ${isChecked ? 'bg-primary/5' : ''}`}>
                <div className="pt-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={isChecked} onCheckedChange={() => onToggle(r.id)} />
                </div>
                <button onClick={() => onOpen(r)} className="text-left flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {currentEntity === 'company' ? r.name :
                          currentEntity === 'contact' ? (r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.email) :
                          r.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {currentEntity === 'company' ? (r.industry || r.email || r.city || 'No details') :
                          currentEntity === 'contact' ? (r.job_title || r.email || 'No title') :
                          `${r.currency || 'GBP'} ${Number(r.value || 0).toLocaleString()}`}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {(r.relationship_type || []).slice(0, 2).map((rel: string) => (
                          <span key={rel} className={`text-[9px] font-medium px-1.5 py-0.5 rounded border capitalize ${REL_COLORS[rel] || 'bg-muted text-muted-foreground border-border'}`}>
                            {rel}
                          </span>
                        ))}
                        {stage && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded border" style={{ backgroundColor: `${stage.color}15`, color: stage.color, borderColor: `${stage.color}40` }}>
                            {stage.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {assignee ? (
                        <span
                          className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white"
                          style={{ backgroundColor: adminColor(assignee.user_id) }}
                          title={`Assigned to ${assignee.full_name || assignee.email}`}
                        >
                          {assignee.initials}
                        </span>
                      ) : (
                        <span className="h-6 w-6 rounded-full border border-dashed border-border" title="Unassigned" />
                      )}
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(r.updated_at), { addSuffix: false })}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard({ companies, contacts, opportunities, stages, admins, userId, myLeadCount, unassignedCount, onOpen }: any) {
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
          <h1 className="text-xl sm:text-2xl font-semibold">Business Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Every company, person, and deal in one connected view.</p>
        </div>

        {/* My workload */}
        <div className="grid grid-cols-3 gap-3">
          <KPI icon={User} label="My leads" value={myLeadCount} sub="Assigned to you" tone="primary" />
          <KPI icon={UsersIcon} label="Unassigned" value={unassignedCount} sub="Awaiting assignment" tone={unassignedCount > 0 ? 'warn' : undefined} />
          <KPI icon={Target} label="Team total" value={contacts.length} sub="All leads & contacts" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI icon={Building2} label="Companies" value={companies.length} sub={`${customersCount} customers · ${leadsCount} leads`} />
          <KPI icon={UsersIcon} label="Contacts" value={contacts.length} sub="People across all orgs" />
          <KPI icon={Target} label="Opportunities" value={opportunities.length} sub="Open deals" />
          <KPI icon={DollarSign} label="Pipeline" value={`£${(pipeline / 1000).toFixed(1)}k`} sub="Weighted TBD" />
        </div>

        {/* Team assignment */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">Leads assigned per admin</h2>
          <div className="space-y-2">
            {admins.map((a: AdminUser) => {
              const n = leadsByAdmin.get(a.user_id) || 0;
              const pct = contacts.length ? (n / contacts.length) * 100 : 0;
              const isMe = a.user_id === userId;
              return (
                <div key={a.user_id} className="flex items-center gap-3 text-xs">
                  <span className="h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0" style={{ backgroundColor: adminColor(a.user_id) }}>{a.initials}</span>
                  <span className="w-32 truncate text-foreground/80">{a.full_name || a.email}{isMe && <span className="text-primary"> (you)</span>}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 text-right tabular-nums text-muted-foreground">{n}</span>
                </div>
              );
            })}
            {unassignedCount > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="h-6 w-6 rounded-full border border-dashed border-border shrink-0" />
                <span className="w-32 truncate text-muted-foreground">Unassigned</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400" style={{ width: `${(unassignedCount / contacts.length) * 100}%` }} />
                </div>
                <span className="w-10 text-right tabular-nums text-amber-400">{unassignedCount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold">Lifecycle stages</h2>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            {stages.map((s: any) => {
              // Dedupe: contacts and companies share the same lead — take the max, then add opportunities
              const cCount = contacts.filter((c: any) => c.lifecycle_stage_id === s.id).length;
              const compCount = companies.filter((c: any) => c.lifecycle_stage_id === s.id).length;
              const oppCount = opportunities.filter((o: any) => o.lifecycle_stage_id === s.id).length;
              const count = Math.max(cCount, compCount) + oppCount;
              const totalContacts = Math.max(contacts.length, companies.length) + opportunities.length || 1;
              const pct = (count / totalContacts) * 100;
              return (
                <div key={s.id} className="flex items-center gap-3 text-xs">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="w-28 text-foreground/80 truncate">{s.name}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                  </div>
                  <span className="w-10 text-right tabular-nums text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold mb-3">Recently updated</h2>
          <ul className="divide-y divide-border -mx-4">
            {[...companies.slice(0, 3).map((c: any) => ({ ...c, _t: 'company' as EntityType, _name: c.name })),
              ...contacts.slice(0, 3).map((c: any) => ({ ...c, _t: 'contact' as EntityType, _name: c.full_name || c.email })),
              ...opportunities.slice(0, 3).map((c: any) => ({ ...c, _t: 'opportunity' as EntityType, _name: c.title }))]
              .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
              .slice(0, 6)
              .map((r: any) => {
                const Icon = r._t === 'company' ? Building2 : r._t === 'contact' ? User : Target;
                return (
                  <li key={`${r._t}-${r.id}`}>
                    <button onClick={() => onOpen(r._t, r)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent/40 transition-colors">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate flex-1 text-left">{r._name || 'Untitled'}</span>
                      <span className="text-[10px] text-muted-foreground">{formatDistanceToNow(new Date(r.updated_at), { addSuffix: true })}</span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    </ScrollArea>
  );
}

function KPI({ icon: Icon, label, value, sub, tone }: any) {
  const toneClass = tone === 'primary' ? 'text-primary' : tone === 'warn' ? 'text-amber-400' : 'text-foreground';
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <p className={`text-2xl font-semibold mt-2 ${toneClass}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</p>
    </div>
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
          <h1 className="text-xl sm:text-2xl font-semibold">Workflows</h1>
          <p className="text-sm text-muted-foreground mt-1">Automations that fire when relationships change stage.</p>
        </div>
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {workflows.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No workflows configured</div>
            ) : workflows.map(w => (
              <div key={w.id} className="p-4">
                <p className="text-sm font-medium">{w.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{w.description || 'No description'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
