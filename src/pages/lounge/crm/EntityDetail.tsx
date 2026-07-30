import { useEffect, useMemo, useState } from 'react';
import { X, Target, Mail, Phone, Globe, MapPin, PoundSterling, FileText, ExternalLink, Tag, ChevronLeft, ChevronRight, Building2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { fetchTimeline, fetchFinancials, setLifecycleStage, type EntityType, type LifecycleStage } from './useCRMData';
import { type AdminUser } from './useAdmins';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NotesPanel } from './NotesPanel';
import { AvatarID, SkeletonLedger, statusTone, statusLabel } from '@/components/platform';
import { RecordHeader, RecordTimeline, TagChips, type TimelineEvent } from '@/components/platform/crm';
import { InvoiceStudio } from '@/components/invoicing/InvoiceStudio';
import { ConvertLeadDialog } from './ConvertLeadDialog';
import { CallConsole } from './calls/CallConsole';
import { useUserRole } from '@/hooks/useUserRole';

interface Props {
  entityType: EntityType;
  entity: any;
  stages: LifecycleStage[];
  list?: any[];
  admins?: AdminUser[];
  /** The already-fetched books, for client-side relationship links. */
  related?: { companies: any[]; contacts: any[]; opportunities: any[] };
  onOpenRelated?: (type: EntityType, entity: any) => void;
  onNavigate?: (entity: any) => void;
  onClose: () => void;
  onChanged: () => void;
}

export function EntityDetail({ entityType, entity, stages, list, admins, related, onOpenRelated, onNavigate, onClose, onChanged }: Props) {
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [financials, setFinancials] = useState<{ links: any[]; ltv: any } | null>(null);
  const [finLoading, setFinLoading] = useState(true);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  // Bumped after a stage change so the activity list and timeline reload
  // without remounting the whole record.
  const [activityToken, setActivityToken] = useState(0);
  const [loadingTab, setLoadingTab] = useState(false);
  const [tab, setTab] = useState('overview');
  const [updating, setUpdating] = useState(false);
  const [callTarget, setCallTarget] = useState<{ label: string; number: string } | null>(null);

  const { currentIndex, prev, next } = useMemo(() => {
    if (!list || !list.length) return { currentIndex: -1, prev: null as any, next: null as any };
    const i = list.findIndex(r => r.id === entity.id);
    return {
      currentIndex: i,
      prev: i > 0 ? list[i - 1] : null,
      next: i >= 0 && i < list.length - 1 ? list[i + 1] : null,
    };
  }, [list, entity.id]);

  const title =
    entityType === 'company' ? entity.name :
    entityType === 'contact' ? (entity.full_name || `${entity.first_name || ''} ${entity.last_name || ''}`.trim() || entity.email) :
    entity.title;

  const currentStage = stages.find(s => s.id === entity.lifecycle_stage_id);

  // Account standing loads with the record, not behind the tab: the same
  // crm_entity_financials + crm_entity_lifetime_value rpcs the Financials
  // tab has always called, fired once on open so the relationship's
  // financial position is visible immediately.
  useEffect(() => {
    let cancelled = false;
    setFinLoading(true);
    fetchFinancials(entityType, entity.id).then(f => {
      if (!cancelled) { setFinancials(f); setFinLoading(false); }
    });
    return () => { cancelled = true; };
  }, [entityType, entity.id]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (tab !== 'timeline') return;
      setLoadingTab(true);
      const t = await fetchTimeline(entityType, entity.id);
      if (!cancelled) { setTimeline(t); setLoadingTab(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [tab, entityType, entity.id, activityToken]);

  async function handleStageChange(newStageId: string) {
    setUpdating(true);
    const { error } = await setLifecycleStage(entityType, entity.id, newStageId);
    setUpdating(false);
    if (error) {
      toast({ title: 'Failed to move stage', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Stage updated', description: 'Logged to the timeline and activity for this lead.' });
      setActivityToken(t => t + 1);
      onChanged();
    }
  }

  // Presentation-only lines for the record header.
  const companyLine =
    entityType === 'company' ? (entity.industry || null) :
    entityType === 'contact' ? (entity.job_title || null) :
    null;
  const metaLine =
    entityType === 'company' ? ([entity.city, entity.country].filter(Boolean).join(', ') || null) :
    entityType === 'opportunity' ? (entity.expected_close_date ? `Expected close ${format(new Date(entity.expected_close_date), 'd MMM yyyy')}` : null) :
    null;

  // The timeline rpc already merges notes, stage history and imports for
  // this record - this maps the fetched rows only; no extra requests.
  const timelineEvents: TimelineEvent[] = timeline.map((ev, i) => ({
    id: `ev-${i}`,
    text: (
      <>
        <span className="font-medium">{ev.subject || ev.title || statusLabel(ev.event_type || ev.kind) || 'Event'}</span>
        {ev.body ? <span className="text-muted-foreground"> · {ev.body}</span> : null}
      </>
    ),
    when: ev.occurred_at ? format(new Date(ev.occurred_at), 'd MMM yyyy · HH:mm') : '',
    tone: String(ev.event_type || ev.kind || '').includes('stage') ? 'accent' : 'neutral',
  }));

  return (
    <div className="flex flex-col h-full bg-card border-l border-border/60">
      {/* Chrome bar: type kicker, pager, close */}
      <div className="flex items-center gap-0.5 px-2 pt-2 sm:px-3">
        <span className="ml-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{entityType}</span>
        <div className="flex-1" />
        {list && list.length > 1 && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              variant="ghost" size="icon"
              className="h-11 w-11 sm:h-8 sm:w-8"
              disabled={!prev}
              onClick={() => prev && onNavigate?.(prev)}
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-mono text-[10px] text-muted-foreground tabular-nums px-1 min-w-[54px] text-center">
              {currentIndex + 1} / {list.length}
            </span>
            <Button
              variant="ghost" size="icon"
              className="h-11 w-11 sm:h-8 sm:w-8"
              disabled={!next}
              onClick={() => next && onNavigate?.(next)}
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={onClose} className="h-11 w-11 sm:h-8 sm:w-8 shrink-0" aria-label="Close record">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Record header: identity, stage, value, and real tel:/mailto:/site links */}
      <RecordHeader
        name={title || 'Untitled'}
        company={companyLine}
        meta={metaLine}
        stage={currentStage?.name ?? null}
        stageTone={currentStage ? statusTone(currentStage.slug) : undefined}
        stageLabel={currentStage?.name}
        value={entityType === 'opportunity' ? Number(entity.value || 0) : null}
        phone={entity.phone || entity.mobile || null}
        email={entity.email || null}
        website={entity.website || null}
      />
      {/* Account standing: the relationship's financial position from the
          existing per-entity rpcs, always visible with the record. */}
      {!finLoading && financials?.ltv && (
        <div className="grid grid-cols-3 divide-x divide-border/60 border-b border-border/60 bg-sunken/50">
          <StandingCell label="Invoiced" currency={financials.ltv.currency} amount={financials.ltv.invoiced} />
          <StandingCell label="Paid" currency={financials.ltv.currency} amount={financials.ltv.paid} tone="ok" />
          <StandingCell
            label="Outstanding"
            currency={financials.ltv.currency}
            amount={financials.ltv.outstanding}
            tone={Number(financials.ltv.outstanding) > 0 ? 'attend' : undefined}
          />
        </div>
      )}
      {(entity.relationship_type?.length ?? 0) > 0 && (
        <div className="border-b border-border/60 px-4 py-2.5">
          {/* relationship_type display only - no update endpoint exists, so the chips are read-only */}
          <TagChips tags={entity.relationship_type} />
        </div>
      )}

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 sm:mx-5 mt-3 grid grid-cols-3 h-11 sm:h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
          <TabsTrigger value="financials" className="text-xs">Financials</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="overview" className="p-4 sm:p-5 space-y-4 mt-3">
            {/* Leads live as companies until they are worth converting. */}
            {entityType === 'company' && (
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border/60 bg-sunken/50 px-3.5 py-2.5">
                <p className="min-w-0 text-[11.5px] leading-relaxed text-muted-foreground">
                  Agreed to a preview or a website? Turn them into a contact{isAdmin ? ' and a client account' : ''} in one step.
                </p>
                <Button size="sm" className="h-8 shrink-0 gap-1.5 rounded-lg px-3 text-xs" onClick={() => setConvertOpen(true)}>
                  <UserPlus className="h-3.5 w-3.5" /> Convert
                </Button>
              </div>
            )}

            {/* Lifecycle stage selector */}
            <div>
              <label className="font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em]">Lifecycle stage</label>
              <Select value={entity.lifecycle_stage_id || ''} onValueChange={handleStageChange} disabled={updating}>
                <SelectTrigger className="mt-1.5 h-11 sm:h-9">
                  <SelectValue placeholder="Set stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="inline-flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Owner / assignment picker */}
            {admins && admins.length > 0 && (
              <div>
                <label className="font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em]">Assigned to</label>
                <OwnerPicker entity={entity} entityType={entityType} admins={admins} onChanged={onChanged} />
              </div>
            )}

            {/* Fields */}
            <div className="space-y-2.5">
              {entity.email && <Field icon={Mail} label="Email" value={entity.email} href={`mailto:${entity.email}`} />}
              {entity.phone && <Field icon={Phone} label="Phone" value={entity.phone} onClick={() => setCallTarget({ label: title || 'this contact', number: entity.phone })} />}
              {entity.mobile && <Field icon={Phone} label="Mobile" value={entity.mobile} onClick={() => setCallTarget({ label: title || 'this contact', number: entity.mobile })} />}
              {entity.website && <Field icon={Globe} label="Website" value={entity.website} href={entity.website} external />}
              {entity.industry && <Field icon={Tag} label="Industry" value={entity.industry} />}
              {entity.job_title && <Field icon={Target} label="Job title" value={entity.job_title} />}
              {entity.value != null && <Field icon={PoundSterling} label="Value" value={`${entity.currency || 'GBP'} ${Number(entity.value).toLocaleString()}`} />}
              {(entity.city || entity.country) && <Field icon={MapPin} label="Location" value={[entity.city, entity.country].filter(Boolean).join(', ')} />}
            </div>

            {entity.notes || entity.description ? (
              <div>
                <label className="font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em]">Notes</label>
                <p className="mt-1.5 text-sm text-ink-2 whitespace-pre-wrap">{entity.notes || entity.description}</p>
              </div>
            ) : null}

            {(entity.tags?.length ?? 0) > 0 && (
              <div>
                <label className="font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em]">Tags</label>
                <TagChips tags={entity.tags} className="mt-1.5" />
              </div>
            )}

            {related && (
              <RelatedRecords
                entityType={entityType}
                entity={entity}
                related={related}
                stages={stages}
                onOpen={onOpenRelated}
              />
            )}

            <NotesPanel
              key={`notes-${entity.id}-${activityToken}`}
              entityType={entityType}
              entityId={entity.id}
              orgId={entity.org_id ?? null}
              stages={stages}
            />

            <div className="pt-2 font-mono text-[10px] tabular-nums text-muted-foreground">
              Updated {formatDistanceToNow(new Date(entity.updated_at), { addSuffix: true })}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="mt-3 pb-4">
            {loadingTab ? (
              <SkeletonLedger rows={3} className="px-4 sm:px-5" />
            ) : (
              <RecordTimeline
                events={timelineEvents}
                empty="No timeline events yet. Notes and stage changes appear here as they happen."
              />
            )}
          </TabsContent>

          <TabsContent value="financials" className="p-4 sm:p-5 mt-3 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                Won deals raise a draft invoice automatically. Build and send any invoice from here.
              </p>
              <Button size="sm" className="h-8 shrink-0 gap-1.5 rounded-lg px-3 text-xs" onClick={() => setInvoiceOpen(true)}>
                <FileText className="h-3.5 w-3.5" /> Generate invoice
              </Button>
            </div>
            {finLoading ? (
              <SkeletonLedger rows={3} />
            ) : (
              <>
                {financials?.ltv && (
                  <div className="grid grid-cols-3 gap-2">
                    <Stat label="Invoiced" value={`${financials.ltv.currency || 'GBP'} ${Number(financials.ltv.invoiced || 0).toLocaleString()}`} />
                    <Stat label="Paid" value={`${financials.ltv.currency || 'GBP'} ${Number(financials.ltv.paid || 0).toLocaleString()}`} tone="success" />
                    <Stat label="Outstanding" value={`${financials.ltv.currency || 'GBP'} ${Number(financials.ltv.outstanding || 0).toLocaleString()}`} tone={Number(financials.ltv.outstanding) > 0 ? 'warn' : 'muted'} />
                  </div>
                )}
                {financials?.links?.length ? (
                  <div className="border border-border/60 rounded-[10px] divide-y divide-border/60">
                    {financials.links.map(l => (
                      <div key={`${l.finance_type}-${l.finance_id}`} className="flex items-center gap-3 p-3">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{l.reference || l.finance_type}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{l.finance_type.replace('_', ' ')} · {l.status || 'no status'}</p>
                        </div>
                        <div className="font-mono text-xs font-medium tabular-nums text-foreground shrink-0">
                          {l.amount != null ? `${l.currency || 'GBP'} ${Number(l.amount).toLocaleString()}` : '–'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={PoundSterling} label="No financial records linked" hint="Invoices, proposals and contracts linked to this record will appear here." />
                )}
              </>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {entityType === 'company' && (
        <ConvertLeadDialog
          open={convertOpen}
          onOpenChange={setConvertOpen}
          company={entity}
          stages={stages}
          isAdmin={isAdmin}
          onConverted={() => { setActivityToken(t => t + 1); onChanged(); }}
        />
      )}

      <InvoiceStudio
        open={invoiceOpen}
        onOpenChange={setInvoiceOpen}
        entityType={entityType}
        entityId={entity.id}
        billToName={title || 'Untitled'}
        billToEmail={entity.email || null}
        currency={entity.currency || 'GBP'}
        defaultLines={entityType === 'opportunity' && entity.value != null
          ? [{ description: entity.title || 'Services', quantity: 1, unit_price: Number(entity.value), tax_rate: 0.2 }]
          : undefined}
        onGenerated={async () => {
          setFinLoading(true);
          const f = await fetchFinancials(entityType, entity.id);
          setFinancials(f);
          setFinLoading(false);
        }}
      />

      <CallConsole
        open={!!callTarget}
        onOpenChange={(v) => { if (!v) setCallTarget(null); }}
        number={callTarget?.number ?? ''}
        entityType={entityType}
        entityId={entity.id}
        entityName={title || 'Untitled'}
        orgId={entity.org_id ?? null}
        onLogged={() => setActivityToken(t => t + 1)}
      />
    </div>
  );
}

function Field({ icon: Icon, label, value, href, external, onClick }: any) {
  const content = (
    <div className="flex items-center gap-2.5 text-sm">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground text-xs w-16 shrink-0">{label}</span>
      <span className="truncate text-foreground">{value}</span>
      {external && <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />}
    </div>
  );
  if (onClick) return <button type="button" onClick={onClick} className="w-full text-left block hover:bg-accent/40 -mx-1.5 px-1.5 py-1 rounded transition-colors">{content}</button>;
  if (href) return <a href={href} target={external ? '_blank' : undefined} rel="noreferrer" className="block hover:bg-accent/40 -mx-1.5 px-1.5 py-1 rounded transition-colors">{content}</a>;
  return <div className="px-1.5 py-1">{content}</div>;
}

function StandingCell({ label, currency, amount, tone }: { label: string; currency?: string | null; amount: any; tone?: 'ok' | 'attend' }) {
  const color = tone === 'ok' ? 'text-ok' : tone === 'attend' ? 'text-attend' : 'text-foreground';
  return (
    <div className="px-4 py-2">
      <p className="font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 font-mono text-[12.5px] font-medium tabular-nums ${color}`}>
        {currency || 'GBP'} {Number(amount || 0).toLocaleString()}
      </p>
    </div>
  );
}

/**
 * The rest of the business relationship: linked company, people and deals,
 * joined client-side over the books the shell already fetched. Tapping a
 * row opens that record in place - no extra requests.
 */
function RelatedRecords({ entityType, entity, related, stages, onOpen }: {
  entityType: EntityType;
  entity: any;
  related: { companies: any[]; contacts: any[]; opportunities: any[] };
  stages: LifecycleStage[];
  onOpen?: (type: EntityType, entity: any) => void;
}) {
  const stageName = (id: string | null) => stages.find(s => s.id === id)?.name ?? null;
  const money = (o: any) => (o.value != null ? `${o.currency || 'GBP'} ${Number(o.value).toLocaleString()}` : null);

  type Item = { type: EntityType; rec: any; label: string; sub: string | null; amount: string | null };
  const items: Item[] = [];
  let overflow = 0;

  if (entityType === 'contact') {
    const comp = entity.company_id ? related.companies.find(c => c.id === entity.company_id) : null;
    if (comp) items.push({ type: 'company', rec: comp, label: comp.name || 'Untitled', sub: comp.industry || 'Company', amount: null });
    related.opportunities
      .filter(o => o.contact_id === entity.id)
      .forEach(o => items.push({ type: 'opportunity', rec: o, label: o.title || 'Untitled', sub: stageName(o.lifecycle_stage_id) || 'Deal', amount: money(o) }));
  } else if (entityType === 'company') {
    const people = related.contacts.filter(c => c.company_id === entity.id);
    overflow = Math.max(0, people.length - 6);
    people.slice(0, 6).forEach(c =>
      items.push({ type: 'contact', rec: c, label: c.full_name || c.email || 'Unnamed', sub: c.job_title || c.email || null, amount: null }));
    related.opportunities
      .filter(o => o.company_id === entity.id)
      .forEach(o => items.push({ type: 'opportunity', rec: o, label: o.title || 'Untitled', sub: stageName(o.lifecycle_stage_id) || 'Deal', amount: money(o) }));
  } else {
    const comp = entity.company_id ? related.companies.find(c => c.id === entity.company_id) : null;
    if (comp) items.push({ type: 'company', rec: comp, label: comp.name || 'Untitled', sub: comp.industry || 'Company', amount: null });
    const person = entity.contact_id ? related.contacts.find(c => c.id === entity.contact_id) : null;
    if (person) items.push({ type: 'contact', rec: person, label: person.full_name || person.email || 'Unnamed', sub: person.job_title || person.email || null, amount: null });
  }

  if (items.length === 0) return null;

  const ICON: Record<EntityType, any> = { company: Building2, contact: User, opportunity: Target };

  return (
    <div>
      <label className="font-mono text-[9.5px] font-medium text-muted-foreground uppercase tracking-[0.14em]">Relationships</label>
      <div className="mt-1.5 divide-y divide-border/60 rounded-[10px] border border-border/60">
        {items.map((it) => {
          const Icon = ICON[it.type];
          return (
            <button
              key={`${it.type}-${it.rec.id}`}
              type="button"
              disabled={!onOpen}
              onClick={onOpen ? () => onOpen(it.type, it.rec) : undefined}
              className="flex min-h-[44px] w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-foreground/[0.025] disabled:pointer-events-none"
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-medium">{it.label}</span>
                {it.sub && <span className="block truncate text-[10.5px] text-muted-foreground">{it.sub}</span>}
              </span>
              {it.amount && <span className="shrink-0 font-mono text-[11px] tabular-nums">{it.amount}</span>}
              {onOpen && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />}
            </button>
          );
        })}
        {overflow > 0 && (
          <p className="px-3 py-2 text-[10.5px] text-muted-foreground">
            {overflow} more {overflow === 1 ? 'person' : 'people'} at this company in the contacts list.
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'warn' | 'muted' }) {
  const color = tone === 'success' ? 'text-ok' : tone === 'warn' ? 'text-attend' : 'text-foreground';
  return (
    <div className="rounded-[10px] border border-border/60 p-3">
      <p className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold tabular-nums mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, label, hint }: any) {
  return (
    <div className="flex flex-col items-center text-center py-10">
      <Icon className="h-5 w-5 text-muted-foreground/50 mb-2.5" />
      <p className="text-[13px] font-medium text-foreground">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-1 max-w-xs">{hint}</p>}
    </div>
  );
}

const TABLE_FOR: Record<EntityType, 'crm_companies' | 'crm_contacts' | 'crm_opportunities'> = {
  company: 'crm_companies', contact: 'crm_contacts', opportunity: 'crm_opportunities',
};

function OwnerPicker({ entity, entityType, admins, onChanged }: { entity: any; entityType: EntityType; admins: AdminUser[]; onChanged: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const current = admins.find(a => a.user_id === entity.owner_id);

  async function set(userId: string | null) {
    setSaving(true);
    const { error } = await supabase.from(TABLE_FOR[entityType]).update({ owner_id: userId } as any).eq('id', entity.id);
    setSaving(false);
    if (error) { toast({ title: 'Failed to assign', description: error.message, variant: 'destructive' }); return; }
    toast({ title: userId ? 'Assigned' : 'Unassigned' });
    onChanged();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button disabled={saving} className="mt-1.5 w-full h-11 sm:h-9 px-3 rounded-md border border-border/60 bg-background text-sm flex items-center gap-2 hover:bg-foreground/[0.025] transition-colors">
          {current ? (
            <>
              <AvatarID name={current.full_name} email={current.email} size="sm" />
              <span className="truncate">{current.full_name || current.email}</span>
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Unassigned</span>
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">Assign to</DropdownMenuLabel>
        {admins.map(a => (
          <DropdownMenuItem key={a.user_id} onClick={() => set(a.user_id)}>
            <AvatarID name={a.full_name} email={a.email} size="sm" className="mr-2" />
            {a.full_name || a.email}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => set(null)}>Unassign</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
