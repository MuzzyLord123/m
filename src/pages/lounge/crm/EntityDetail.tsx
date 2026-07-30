import { useEffect, useMemo, useState } from 'react';
import { X, Target, Mail, Phone, Globe, MapPin, PoundSterling, FileText, ExternalLink, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

interface Props {
  entityType: EntityType;
  entity: any;
  stages: LifecycleStage[];
  list?: any[];
  admins?: AdminUser[];
  onNavigate?: (entity: any) => void;
  onClose: () => void;
  onChanged: () => void;
}

export function EntityDetail({ entityType, entity, stages, list, admins, onNavigate, onClose, onChanged }: Props) {
  const { toast } = useToast();
  const [timeline, setTimeline] = useState<any[]>([]);
  const [financials, setFinancials] = useState<{ links: any[]; ltv: any } | null>(null);
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingTab(true);
      if (tab === 'timeline') {
        const t = await fetchTimeline(entityType, entity.id);
        if (!cancelled) setTimeline(t);
      } else if (tab === 'financials') {
        const f = await fetchFinancials(entityType, entity.id);
        if (!cancelled) setFinancials(f);
      }
      if (!cancelled) setLoadingTab(false);
    }
    load();
    return () => { cancelled = true; };
  }, [tab, entityType, entity.id]);

  async function handleStageChange(newStageId: string) {
    setUpdating(true);
    const { error } = await setLifecycleStage(entityType, entity.id, newStageId);
    setUpdating(false);
    if (error) {
      toast({ title: 'Failed to move stage', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Stage updated', description: 'Workflows may have fired automatically.' });
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

            <NotesPanel entityType={entityType} entityId={entity.id} orgId={entity.org_id ?? null} />

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
            {loadingTab ? (
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

      <AlertDialog open={!!callTarget} onOpenChange={(open) => !open && setCallTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Would you like to call {callTarget?.label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tap Call to open your phone dialler for <span className="font-medium text-foreground">{callTarget?.number}</span>.
              You'll then choose how to place the call.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (callTarget) window.location.href = `tel:${callTarget.number.replace(/\s+/g, '')}`;
                setCallTarget(null);
              }}
            >
              <Phone className="h-4 w-4 mr-2" /> Call
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
