import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Building2, User, Target, Mail, Phone, Globe, MapPin, DollarSign, Clock, Sparkles, Loader2, ExternalLink, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
import { adminColor, type AdminUser } from './useAdmins';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NotesPanel } from './NotesPanel';

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

const REL_COLORS: Record<string, string> = {
  customer: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  lead: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  supplier: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  partner: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  investor: 'bg-pink-500/15 text-pink-400 border-pink-500/30',
};

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

  const Icon = entityType === 'company' ? Building2 : entityType === 'contact' ? User : Target;
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col h-full bg-card"
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 sm:p-5 border-b border-border">
        <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-foreground truncate">{title || 'Untitled'}</h2>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {(entity.relationship_type || []).map((r: string) => (
              <span key={r} className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${REL_COLORS[r] || 'bg-muted text-muted-foreground border-border'}`}>
                {r}
              </span>
            ))}
            {currentStage && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border border-border" style={{ backgroundColor: `${currentStage.color}15`, color: currentStage.color, borderColor: `${currentStage.color}40` }}>
                {currentStage.name}
              </span>
            )}
          </div>
        </div>
        {list && list.length > 1 && (
          <div className="flex items-center gap-0.5 mr-1 shrink-0">
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8"
              disabled={!prev}
              onClick={() => prev && onNavigate?.(prev)}
              title="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-[10px] text-muted-foreground tabular-nums px-1 min-w-[54px] text-center">
              {currentIndex + 1} / {list.length}
            </span>
            <Button
              variant="ghost" size="icon"
              className="h-8 w-8"
              disabled={!next}
              onClick={() => next && onNavigate?.(next)}
              title="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="mx-4 sm:mx-5 mt-3 grid grid-cols-3 h-9">
          <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">Timeline</TabsTrigger>
          <TabsTrigger value="financials" className="text-xs">Financials</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="overview" className="p-4 sm:p-5 space-y-4 mt-3">
            {/* Lifecycle stage selector */}
            <div>
              <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Lifecycle Stage</label>
              <Select value={entity.lifecycle_stage_id || ''} onValueChange={handleStageChange} disabled={updating}>
                <SelectTrigger className="mt-1.5 h-9">
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
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Assigned to</label>
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
              {entity.job_title && <Field icon={Target} label="Job Title" value={entity.job_title} />}
              {entity.value != null && <Field icon={DollarSign} label="Value" value={`${entity.currency || 'GBP'} ${Number(entity.value).toLocaleString()}`} />}
              {(entity.city || entity.country) && <Field icon={MapPin} label="Location" value={[entity.city, entity.country].filter(Boolean).join(', ')} />}
            </div>

            {entity.notes || entity.description ? (
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Notes</label>
                <p className="mt-1.5 text-sm text-foreground/80 whitespace-pre-wrap">{entity.notes || entity.description}</p>
              </div>
            ) : null}

            {(entity.tags?.length ?? 0) > 0 && (
              <div>
                <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Tags</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {entity.tags.map((t: string) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>
                  ))}
                </div>
              </div>
            )}

            <NotesPanel entityType={entityType} entityId={entity.id} orgId={entity.org_id ?? null} />

            <div className="pt-2 text-[11px] text-muted-foreground">
              Updated {formatDistanceToNow(new Date(entity.updated_at), { addSuffix: true })}
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="p-4 sm:p-5 mt-3">
            {loadingTab ? (
              <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
            ) : timeline.length === 0 ? (
              <EmptyState icon={Clock} label="No timeline events yet" hint="Communications and stage changes will appear here." />
            ) : (
              <ol className="relative border-l border-border ml-1.5 space-y-4">
                {timeline.map((ev, i) => (
                  <li key={i} className="ml-4 pl-1">
                    <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-background" />
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-medium uppercase tracking-wide text-primary">{ev.event_type || ev.kind}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {ev.occurred_at ? format(new Date(ev.occurred_at), 'd MMM yyyy · HH:mm') : ''}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{ev.subject || ev.title || ev.kind}</p>
                    {ev.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">{ev.body}</p>}
                  </li>
                ))}
              </ol>
            )}
          </TabsContent>

          <TabsContent value="financials" className="p-4 sm:p-5 mt-3 space-y-4">
            {loadingTab ? (
              <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
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
                  <div className="border border-border rounded-lg divide-y divide-border">
                    {financials.links.map(l => (
                      <div key={`${l.finance_type}-${l.finance_id}`} className="flex items-center gap-3 p-3">
                        <Sparkles className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{l.reference || l.finance_type}</p>
                          <p className="text-[10px] text-muted-foreground capitalize">{l.finance_type.replace('_', ' ')} · {l.status || 'no status'}</p>
                        </div>
                        <div className="text-xs font-medium text-foreground shrink-0">
                          {l.amount != null ? `${l.currency || 'GBP'} ${Number(l.amount).toLocaleString()}` : '—'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState icon={DollarSign} label="No financial records linked" hint="Invoices, proposals, and contracts linked to this record will appear here." />
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
    </motion.div>
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
  const color = tone === 'success' ? 'text-emerald-400' : tone === 'warn' ? 'text-amber-400' : 'text-foreground';
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`text-sm font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, label, hint }: any) {
  return (
    <div className="flex flex-col items-center text-center py-10">
      <Icon className="h-6 w-6 text-muted-foreground/40 mb-2" />
      <p className="text-sm text-muted-foreground">{label}</p>
      {hint && <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-xs">{hint}</p>}
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
        <button disabled={saving} className="mt-1.5 w-full h-9 px-3 rounded-md border border-input bg-background text-sm flex items-center gap-2 hover:bg-accent transition-colors">
          {current ? (
            <>
              <span className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white" style={{ backgroundColor: adminColor(current.user_id) }}>{current.initials}</span>
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
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wide">Assign to</DropdownMenuLabel>
        {admins.map(a => (
          <DropdownMenuItem key={a.user_id} onClick={() => set(a.user_id)}>
            <span className="h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white mr-2" style={{ backgroundColor: adminColor(a.user_id) }}>{a.initials}</span>
            {a.full_name || a.email}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => set(null)}>Unassign</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
