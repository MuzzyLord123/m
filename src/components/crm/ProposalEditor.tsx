import { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Save, Send, Eye, Trash2, Check, X, Plus,
  FileText, PoundSterling, Clock, User,
} from 'lucide-react';
import { format } from 'date-fns';
import { type Proposal, type ScopeItem, type PricingItem } from '@/hooks/useProposals';
import { cn } from '@/lib/utils';
import { Money, StatusBadge } from '@/components/platform';

interface ProposalEditorProps {
  proposal: Proposal;
  onUpdate: (id: string, updates: Partial<Proposal>) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

/* Compact field recipe for the instrument surface */
const FIELD_SM =
  'w-full rounded-md border border-border/60 bg-foreground/[0.03] px-3 py-2 text-[11px] text-foreground outline-none transition-colors duration-150 focus:border-primary/60 placeholder:text-muted-foreground/60';
const FIELD_INLINE =
  'rounded-md border border-border/60 bg-foreground/[0.03] px-2.5 py-1.5 text-[11px] text-foreground outline-none transition-colors duration-150 focus:border-primary/60 placeholder:text-muted-foreground/60';

const iconBtn =
  'flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]';

export function ProposalEditor({ proposal, onUpdate, onSend, onDelete, onBack }: ProposalEditorProps) {
  const [form, setForm] = useState<Proposal>(proposal);
  const [activeSection, setActiveSection] = useState<string>('details');
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => { setForm(proposal); setHasChanges(false); }, [proposal]);

  const update = (updates: Partial<Proposal>) => {
    setForm(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const save = () => {
    const total = form.pricing_items
      .filter(p => !p.is_recurring)
      .reduce((s, p) => s + p.amount, 0);
    onUpdate(form.id, { ...form, total_amount: total });
    setHasChanges(false);
  };

  const toggleScope = (id: string) => {
    update({
      scope_items: form.scope_items.map(s =>
        s.id === id ? { ...s, included: !s.included } : s
      ),
    });
  };

  const addScopeItem = () => {
    update({
      scope_items: [...form.scope_items, { id: crypto.randomUUID(), title: '', description: '', included: true }],
    });
  };

  const removeScopeItem = (id: string) => {
    update({ scope_items: form.scope_items.filter(s => s.id !== id) });
  };

  const updateScopeItem = (id: string, updates: Partial<ScopeItem>) => {
    update({ scope_items: form.scope_items.map(s => s.id === id ? { ...s, ...updates } : s) });
  };

  const addPricingItem = () => {
    update({
      pricing_items: [...form.pricing_items, { id: crypto.randomUUID(), name: '', description: '', amount: 0, is_recurring: false }],
    });
  };

  const removePricingItem = (id: string) => {
    update({ pricing_items: form.pricing_items.filter(p => p.id !== id) });
  };

  const updatePricingItem = (id: string, updates: Partial<PricingItem>) => {
    update({ pricing_items: form.pricing_items.map(p => p.id === id ? { ...p, ...updates } : p) });
  };

  const oneTimeTotal = useMemo(() =>
    form.pricing_items.filter(p => !p.is_recurring).reduce((s, p) => s + p.amount, 0), [form.pricing_items]);
  const recurringTotal = useMemo(() =>
    form.pricing_items.filter(p => p.is_recurring).reduce((s, p) => s + p.amount, 0), [form.pricing_items]);

  const isAccepted = proposal.status === 'accepted';

  const sections = [
    { key: 'details', label: 'Client details', icon: <User className="h-3 w-3" /> },
    { key: 'scope', label: 'Scope', icon: <FileText className="h-3 w-3" /> },
    { key: 'pricing', label: 'Pricing', icon: <PoundSterling className="h-3 w-3" /> },
    { key: 'terms', label: 'Terms', icon: <Clock className="h-3 w-3" /> },
  ];

  if (showPreview) {
    return <ProposalPreview proposal={form} onClose={() => setShowPreview(false)} />;
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Top bar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border/60 bg-card px-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="Back" className={iconBtn}>
            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <span className="font-mono text-[11px] text-muted-foreground">{form.proposal_number}</span>
          <span aria-hidden className="text-[10px] text-muted-foreground/50">·</span>
          <span className="max-w-[200px] truncate text-[11px] font-medium text-foreground">{form.title}</span>
          {isAccepted && <StatusBadge tone="ok" label="Accepted" className="text-[10px]" />}
        </div>
        <div className="flex items-center gap-1.5">
          {hasChanges && (
            <button onClick={save} className="flex h-7 items-center gap-1 rounded-md bg-primary px-2.5 text-[11px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105">
              <Save className="h-3 w-3" /> Save
            </button>
          )}
          <button onClick={() => setShowPreview(true)} className="flex h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06] hover:text-foreground">
            <Eye className="h-3 w-3" /> Preview
          </button>
          {form.status === 'draft' && (
            <button onClick={() => onSend(form.id)} className="flex h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium text-primary transition-colors duration-150 hover:bg-primary/10">
              <Send className="h-3 w-3" /> Send
            </button>
          )}
          <button onClick={() => onDelete(form.id)} aria-label="Delete proposal" className={iconBtn}>
            <Trash2 className="h-3.5 w-3.5 text-risk" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Section nav */}
        <div className="w-40 shrink-0 border-r border-border/60 bg-sunken py-2">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] transition-colors duration-150',
                activeSection === s.key
                  ? 'bg-foreground/[0.04] font-medium text-primary'
                  : 'text-muted-foreground hover:bg-foreground/[0.025] hover:text-foreground',
              )}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Form area */}
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {activeSection === 'details' && (
            <div className="space-y-3">
              <SectionTitle>Proposal details</SectionTitle>
              <Field label="Title">
                <input value={form.title} onChange={e => update({ title: e.target.value })} className={FIELD_SM} />
              </Field>
              <Field label="Introduction">
                <textarea value={form.introduction || ''} onChange={e => update({ introduction: e.target.value })} rows={4} className={cn(FIELD_SM, 'resize-none')} />
              </Field>
              <SectionTitle>Client information</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Client name"><input value={form.client_name || ''} onChange={e => update({ client_name: e.target.value })} className={FIELD_SM} /></Field>
                <Field label="Company"><input value={form.client_company || ''} onChange={e => update({ client_company: e.target.value })} className={FIELD_SM} /></Field>
                <Field label="Email"><input value={form.client_email || ''} onChange={e => update({ client_email: e.target.value })} className={FIELD_SM} /></Field>
                <Field label="Phone"><input value={form.client_phone || ''} onChange={e => update({ client_phone: e.target.value })} className={FIELD_SM} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valid until"><input type="date" value={form.valid_until || ''} onChange={e => update({ valid_until: e.target.value })} className={FIELD_SM} /></Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={e => update({ currency: e.target.value })} className={FIELD_SM}>
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </Field>
              </div>
              {isAccepted && (
                <div className="rounded-lg border border-ok/30 bg-ok/[0.06] p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Check className="h-4 w-4 text-ok" />
                    <span className="text-[12px] font-medium text-ok">Accepted</span>
                  </div>
                  <div className="space-y-0.5 text-[10px] text-muted-foreground">
                    <div>By: {proposal.accepted_by_name} ({proposal.accepted_by_email})</div>
                    <div>Date: {proposal.accepted_at ? format(new Date(proposal.accepted_at), 'd MMM yyyy HH:mm') : 'not recorded'}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'scope' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle>Scope of work</SectionTitle>
                <button onClick={addScopeItem} className="flex h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium text-primary transition-colors duration-150 hover:bg-primary/10">
                  <Plus className="h-3 w-3" /> Add item
                </button>
              </div>
              <div className="space-y-2">
                {form.scope_items.map(item => (
                  <div key={item.id} className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-3">
                    <button
                      onClick={() => toggleScope(item.id)}
                      aria-label={item.included ? 'Exclude from scope' : 'Include in scope'}
                      className={cn(
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors duration-150',
                        item.included
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border/60 bg-foreground/[0.03] text-transparent',
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <div className="flex-1 space-y-1.5">
                      <input value={item.title} onChange={e => updateScopeItem(item.id, { title: e.target.value })} placeholder="Item title" className="w-full bg-transparent text-[11px] font-medium text-foreground outline-none placeholder:text-muted-foreground/50" />
                      <input value={item.description} onChange={e => updateScopeItem(item.id, { description: e.target.value })} placeholder="Description" className="w-full bg-transparent text-[10px] text-muted-foreground outline-none placeholder:text-muted-foreground/50" />
                    </div>
                    <button onClick={() => removeScopeItem(item.id)} aria-label="Remove item" className="flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06]">
                      <X className="h-3 w-3 text-muted-foreground/70" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'pricing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle>Pricing</SectionTitle>
                <button onClick={addPricingItem} className="flex h-7 items-center gap-1 rounded-md px-2.5 text-[11px] font-medium text-primary transition-colors duration-150 hover:bg-primary/10">
                  <Plus className="h-3 w-3" /> Add line
                </button>
              </div>
              <div className="space-y-2">
                {form.pricing_items.map(item => (
                  <div key={item.id} className="rounded-lg border border-border/60 bg-card p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={item.name} onChange={e => updatePricingItem(item.id, { name: e.target.value })} placeholder="Line item name" className={FIELD_INLINE} />
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-muted-foreground">£</span>
                            <input type="number" value={item.amount} onChange={e => updatePricingItem(item.id, { amount: Number(e.target.value) })} className={cn(FIELD_INLINE, 'flex-1')} />
                          </div>
                        </div>
                        <input value={item.description} onChange={e => updatePricingItem(item.id, { description: e.target.value })} placeholder="Description" className={cn(FIELD_INLINE, 'w-full text-[10px]')} />
                        <label className="flex cursor-pointer items-center gap-2">
                          <input type="checkbox" checked={item.is_recurring} onChange={e => updatePricingItem(item.id, { is_recurring: e.target.checked })} className="rounded" />
                          <span className="text-[10px] text-muted-foreground">Recurring</span>
                          {item.is_recurring && (
                            <select value={item.frequency || 'monthly'} onChange={e => updatePricingItem(item.id, { frequency: e.target.value })} className={cn(FIELD_INLINE, 'px-2 py-0.5 text-[10px]')}>
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          )}
                        </label>
                      </div>
                      <button onClick={() => removePricingItem(item.id)} aria-label="Remove line" className="flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors duration-150 hover:bg-foreground/[0.06]">
                        <X className="h-3 w-3 text-muted-foreground/70" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Totals */}
              <div className="rounded-lg border border-border/60 bg-card p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">One-time total</span>
                  <Money value={oneTimeTotal} whole className="font-mono text-[13px] font-medium text-foreground" />
                </div>
                {recurringTotal > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Recurring total</span>
                    <span className="font-mono text-[12px] text-ink-2">
                      <Money value={recurringTotal} whole />/mo
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'terms' && (
            <div className="space-y-3">
              <SectionTitle>Terms and conditions</SectionTitle>
              <Field label="Terms">
                <textarea value={form.terms || ''} onChange={e => update({ terms: e.target.value })} rows={8} className={cn(FIELD_SM, 'resize-none')} />
              </Field>
              <Field label="Internal notes">
                <textarea value={form.notes || ''} onChange={e => update({ notes: e.target.value })} rows={4} className={cn(FIELD_SM, 'resize-none')} placeholder="Notes (not shown to client)" />
              </Field>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h3>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

/* ─── Preview ─── */
function ProposalPreview({ proposal, onClose }: { proposal: Proposal; onClose: () => void }) {
  const symbol = proposal.currency === 'USD' ? '$' : proposal.currency === 'EUR' ? '€' : '£';
  const oneTime = proposal.pricing_items.filter(p => !p.is_recurring);
  const recurring = proposal.pricing_items.filter(p => p.is_recurring);
  const total = oneTime.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border/60 bg-card px-3">
        <div className="flex items-center gap-2">
          <button onClick={onClose} aria-label="Close preview" className={iconBtn}>
            <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <span className="text-[11px] text-muted-foreground">Proposal preview</span>
        </div>
      </div>

      <div className="flex flex-1 justify-center overflow-y-auto py-6">
        <div className="w-full max-w-[700px] px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="mb-2 font-display text-[22px] font-semibold tracking-[-0.02em] text-foreground">{proposal.title}</h1>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="font-mono">{proposal.proposal_number}</span>
              <span aria-hidden>·</span>
              <span>{format(new Date(proposal.created_at), 'd MMMM yyyy')}</span>
              {proposal.valid_until && (<><span aria-hidden>·</span><span>Valid until {format(new Date(proposal.valid_until), 'd MMMM yyyy')}</span></>)}
            </div>
          </div>

          {/* Client */}
          {(proposal.client_name || proposal.client_company) && (
            <div className="mb-6 rounded-lg border border-border/60 bg-card p-4">
              <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Prepared for</span>
              <div className="mt-1 text-[13px] font-medium text-foreground">{proposal.client_name}</div>
              {proposal.client_company && <div className="text-[11px] text-muted-foreground">{proposal.client_company}</div>}
              {proposal.client_email && <div className="mt-0.5 text-[11px] text-muted-foreground">{proposal.client_email}</div>}
            </div>
          )}

          {/* Introduction */}
          {proposal.introduction && (
            <div className="mb-6">
              <p className="text-[12px] leading-relaxed text-ink-2">{proposal.introduction}</p>
            </div>
          )}

          {/* Scope */}
          <div className="mb-6">
            <h2 className="mb-3 text-[14px] font-semibold text-foreground">Scope of work</h2>
            <div className="space-y-2">
              {proposal.scope_items.filter(s => s.included).map(item => (
                <div key={item.id} className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <div className="text-[11px] font-medium text-foreground">{item.title}</div>
                    <div className="text-[10px] text-muted-foreground">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-6">
            <h2 className="mb-3 text-[14px] font-semibold text-foreground">Investment</h2>
            <div className="overflow-hidden rounded-lg border border-border/60">
              {oneTime.map(item => (
                <div key={item.id} className="flex items-center justify-between border-b border-border/60 bg-card px-4 py-3">
                  <div>
                    <div className="text-[11px] font-medium text-foreground">{item.name}</div>
                    <div className="text-[9px] text-muted-foreground">{item.description}</div>
                  </div>
                  <span className="font-mono text-[12px] font-medium tabular-nums text-foreground">{symbol}{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-sunken px-4 py-3">
                <span className="text-[12px] font-semibold text-foreground">Total</span>
                <span className="font-mono text-[14px] font-semibold tabular-nums text-foreground">{symbol}{total.toLocaleString()}</span>
              </div>
            </div>
            {recurring.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-lg border border-border/60">
                <div className="bg-sunken px-4 py-2">
                  <span className="font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Recurring</span>
                </div>
                {recurring.map(item => (
                  <div key={item.id} className="flex items-center justify-between border-t border-border/60 bg-card px-4 py-2.5">
                    <div>
                      <div className="text-[11px] text-foreground">{item.name}</div>
                      <div className="text-[9px] text-muted-foreground">{item.description}</div>
                    </div>
                    <span className="font-mono text-[11px] tabular-nums text-ink-2">{symbol}{item.amount.toLocaleString()}/{item.frequency || 'mo'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terms */}
          {proposal.terms && (
            <div className="mb-8">
              <h2 className="mb-2 text-[14px] font-semibold text-foreground">Terms and conditions</h2>
              <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">{proposal.terms}</p>
            </div>
          )}

          {/* Acceptance box */}
          {proposal.status === 'accepted' ? (
            <div className="mb-8 rounded-lg border border-ok/30 bg-ok/[0.06] p-4">
              <div className="mb-1 flex items-center gap-2">
                <Check className="h-5 w-5 text-ok" />
                <span className="text-[13px] font-semibold text-ok">Proposal accepted</span>
              </div>
              <div className="text-[10px] text-muted-foreground">
                Accepted by {proposal.accepted_by_name} on {proposal.accepted_at ? format(new Date(proposal.accepted_at), 'd MMMM yyyy') : 'a date not recorded'}
              </div>
            </div>
          ) : (
            <div className="mb-8 rounded-lg border border-dashed border-border bg-card p-4">
              <div className="text-center text-[11px] text-muted-foreground">
                Digital acceptance area. The client will see an accept and sign button here.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
