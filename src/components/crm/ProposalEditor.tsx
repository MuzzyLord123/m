import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Save, Send, Eye, Trash2, Check, X, Plus, GripVertical,
  FileText, DollarSign, Clock, User, Mail, Building2, Phone,
  ChevronDown, ChevronUp, Edit3,
} from 'lucide-react';
import { format } from 'date-fns';
import { type Proposal, type ScopeItem, type PricingItem } from '@/hooks/useProposals';

interface ProposalEditorProps {
  proposal: Proposal;
  onUpdate: (id: string, updates: Partial<Proposal>) => void;
  onSend: (id: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

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
    { key: 'details', label: 'Client Details', icon: <User className="h-3 w-3" /> },
    { key: 'scope', label: 'Scope', icon: <FileText className="h-3 w-3" /> },
    { key: 'pricing', label: 'Pricing', icon: <DollarSign className="h-3 w-3" /> },
    { key: 'terms', label: 'Terms', icon: <Clock className="h-3 w-3" /> },
  ];

  if (showPreview) {
    return <ProposalPreview proposal={form} onClose={() => setShowPreview(false)} />;
  }

  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: '#111' }}>
      {/* Top bar */}
      <div className="h-11 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: '1px solid #2a2a2a', backgroundColor: '#1a1a1a' }}>
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333]">
            <ArrowLeft className="h-3.5 w-3.5 text-[#999]" />
          </button>
          <span className="text-[11px] font-mono text-[#666]">{form.proposal_number}</span>
          <span className="text-[10px] text-[#555]">•</span>
          <span className="text-[11px] text-[#ccc] font-medium truncate max-w-[200px]">{form.title}</span>
          {isAccepted && (
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 flex items-center gap-1">
              <Check className="h-2.5 w-2.5" /> Accepted
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {hasChanges && (
            <button onClick={save} className="h-7 px-2.5 flex items-center gap-1 rounded-md text-[11px] font-medium bg-[#22c55e] text-white hover:bg-[#16a34a] transition-colors">
              <Save className="h-3 w-3" /> Save
            </button>
          )}
          <button onClick={() => setShowPreview(true)} className="h-7 px-2.5 flex items-center gap-1 rounded-md text-[11px] font-medium text-[#888] hover:text-[#ccc] hover:bg-[#333]">
            <Eye className="h-3 w-3" /> Preview
          </button>
          {form.status === 'draft' && (
            <button onClick={() => onSend(form.id)} className="h-7 px-2.5 flex items-center gap-1 rounded-md text-[11px] font-medium text-[#60a5fa] hover:bg-blue-500/10">
              <Send className="h-3 w-3" /> Send
            </button>
          )}
          <button onClick={() => onDelete(form.id)} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333]">
            <Trash2 className="h-3.5 w-3.5 text-[#ef4444]" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Section nav */}
        <div className="w-40 shrink-0 border-r border-[#2a2a2a] py-2" style={{ backgroundColor: '#141414' }}>
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 text-[11px] transition-colors ${
                activeSection === s.key ? 'bg-[#1e1e1e] text-[#0073E6] font-medium' : 'text-[#888] hover:bg-[#1a1a1a]'
              }`}
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        {/* Form area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeSection === 'details' && (
            <div className="space-y-3">
              <SectionTitle>Proposal Details</SectionTitle>
              <Field label="Title">
                <input value={form.title} onChange={e => update({ title: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-2 text-[11px] text-[#ccc] outline-none focus:border-[#0073E6]" />
              </Field>
              <Field label="Introduction">
                <textarea value={form.introduction || ''} onChange={e => update({ introduction: e.target.value })} rows={4} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-2 text-[11px] text-[#ccc] outline-none focus:border-[#0073E6] resize-none" />
              </Field>
              <SectionTitle>Client Information</SectionTitle>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Client Name"><input value={form.client_name || ''} onChange={e => update({ client_name: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-2 text-[11px] text-[#ccc] outline-none focus:border-[#0073E6]" /></Field>
                <Field label="Company"><input value={form.client_company || ''} onChange={e => update({ client_company: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-2 text-[11px] text-[#ccc] outline-none focus:border-[#0073E6]" /></Field>
                <Field label="Email"><input value={form.client_email || ''} onChange={e => update({ client_email: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-2 text-[11px] text-[#ccc] outline-none focus:border-[#0073E6]" /></Field>
                <Field label="Phone"><input value={form.client_phone || ''} onChange={e => update({ client_phone: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-2 text-[11px] text-[#ccc] outline-none focus:border-[#0073E6]" /></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valid Until"><input type="date" value={form.valid_until || ''} onChange={e => update({ valid_until: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-2 text-[11px] text-[#ccc] outline-none focus:border-[#0073E6]" /></Field>
                <Field label="Currency">
                  <select value={form.currency} onChange={e => update({ currency: e.target.value })} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-2 text-[11px] text-[#ccc] outline-none">
                    <option value="GBP">GBP (£)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </Field>
              </div>
              {isAccepted && (
                <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="h-4 w-4 text-green-400" />
                    <span className="text-[12px] font-medium text-green-400">Accepted</span>
                  </div>
                  <div className="text-[10px] text-[#888] space-y-0.5">
                    <div>By: {proposal.accepted_by_name} ({proposal.accepted_by_email})</div>
                    <div>Date: {proposal.accepted_at ? format(new Date(proposal.accepted_at), 'dd MMM yyyy HH:mm') : '—'}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'scope' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionTitle>Scope of Work</SectionTitle>
                <button onClick={addScopeItem} className="h-7 px-2.5 flex items-center gap-1 rounded-md text-[11px] font-medium text-[#0073E6] hover:bg-blue-500/10">
                  <Plus className="h-3 w-3" /> Add Item
                </button>
              </div>
              <div className="space-y-2">
                {form.scope_items.map(item => (
                  <div key={item.id} className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                    <button onClick={() => toggleScope(item.id)} className={`mt-0.5 h-5 w-5 rounded flex items-center justify-center shrink-0 transition-colors ${item.included ? 'bg-[#0073E6] text-white' : 'bg-[#252525] border border-[#333] text-transparent'}`}>
                      <Check className="h-3 w-3" />
                    </button>
                    <div className="flex-1 space-y-1.5">
                      <input value={item.title} onChange={e => updateScopeItem(item.id, { title: e.target.value })} placeholder="Item title" className="w-full bg-transparent text-[11px] text-[#ccc] font-medium outline-none placeholder:text-[#555]" />
                      <input value={item.description} onChange={e => updateScopeItem(item.id, { description: e.target.value })} placeholder="Description" className="w-full bg-transparent text-[10px] text-[#888] outline-none placeholder:text-[#555]" />
                    </div>
                    <button onClick={() => removeScopeItem(item.id)} className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#333] shrink-0">
                      <X className="h-3 w-3 text-[#555]" />
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
                <button onClick={addPricingItem} className="h-7 px-2.5 flex items-center gap-1 rounded-md text-[11px] font-medium text-[#0073E6] hover:bg-blue-500/10">
                  <Plus className="h-3 w-3" /> Add Line
                </button>
              </div>
              <div className="space-y-2">
                {form.pricing_items.map(item => (
                  <div key={item.id} className="p-3 rounded-lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input value={item.name} onChange={e => updatePricingItem(item.id, { name: e.target.value })} placeholder="Line item name" className="bg-[#252525] border border-[#333] rounded-md px-2.5 py-1.5 text-[11px] text-[#ccc] outline-none focus:border-[#0073E6]" />
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-[#666]">£</span>
                            <input type="number" value={item.amount} onChange={e => updatePricingItem(item.id, { amount: Number(e.target.value) })} className="flex-1 bg-[#252525] border border-[#333] rounded-md px-2.5 py-1.5 text-[11px] text-[#ccc] outline-none focus:border-[#0073E6]" />
                          </div>
                        </div>
                        <input value={item.description} onChange={e => updatePricingItem(item.id, { description: e.target.value })} placeholder="Description" className="w-full bg-[#252525] border border-[#333] rounded-md px-2.5 py-1.5 text-[10px] text-[#888] outline-none focus:border-[#0073E6]" />
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={item.is_recurring} onChange={e => updatePricingItem(item.id, { is_recurring: e.target.checked })} className="rounded" />
                          <span className="text-[10px] text-[#888]">Recurring</span>
                          {item.is_recurring && (
                            <select value={item.frequency || 'monthly'} onChange={e => updatePricingItem(item.id, { frequency: e.target.value })} className="bg-[#252525] border border-[#333] rounded px-2 py-0.5 text-[10px] text-[#888] outline-none">
                              <option value="monthly">Monthly</option>
                              <option value="quarterly">Quarterly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          )}
                        </label>
                      </div>
                      <button onClick={() => removePricingItem(item.id)} className="h-5 w-5 flex items-center justify-center rounded hover:bg-[#333] shrink-0">
                        <X className="h-3 w-3 text-[#555]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Totals */}
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] text-[#888]">One-time Total</span>
                  <span className="text-[13px] font-bold text-[#ccc]">£{oneTimeTotal.toLocaleString()}</span>
                </div>
                {recurringTotal > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[#888]">Recurring Total</span>
                    <span className="text-[12px] font-medium text-[#60a5fa]">£{recurringTotal.toLocaleString()}/mo</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'terms' && (
            <div className="space-y-3">
              <SectionTitle>Terms & Conditions</SectionTitle>
              <Field label="Terms">
                <textarea value={form.terms || ''} onChange={e => update({ terms: e.target.value })} rows={8} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-2 text-[11px] text-[#ccc] outline-none focus:border-[#0073E6] resize-none" />
              </Field>
              <Field label="Internal Notes">
                <textarea value={form.notes || ''} onChange={e => update({ notes: e.target.value })} rows={4} className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-md px-3 py-2 text-[11px] text-[#ccc] outline-none focus:border-[#0073E6] resize-none" placeholder="Notes (not shown to client)" />
              </Field>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[12px] font-semibold text-[#ccc] tracking-wide">{children}</h3>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-medium text-[#666] mb-1 block">{label}</label>
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
    <div className="h-full flex flex-col" style={{ backgroundColor: '#0e0e0e' }}>
      <div className="h-11 flex items-center justify-between px-3 shrink-0" style={{ borderBottom: '1px solid #2a2a2a', backgroundColor: '#1a1a1a' }}>
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333]">
            <ArrowLeft className="h-3.5 w-3.5 text-[#999]" />
          </button>
          <span className="text-[11px] text-[#888]">Proposal Preview</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex justify-center py-6">
        <div className="w-full max-w-[700px] px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-[22px] font-bold text-white mb-2">{proposal.title}</h1>
            <div className="flex items-center gap-4 text-[11px] text-[#888]">
              <span className="font-mono">{proposal.proposal_number}</span>
              <span>•</span>
              <span>{format(new Date(proposal.created_at), 'dd MMMM yyyy')}</span>
              {proposal.valid_until && (<><span>•</span><span>Valid until {format(new Date(proposal.valid_until), 'dd MMMM yyyy')}</span></>)}
            </div>
          </div>

          {/* Client */}
          {(proposal.client_name || proposal.client_company) && (
            <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
              <span className="text-[9px] font-medium text-[#666] uppercase tracking-wider">Prepared For</span>
              <div className="text-[13px] font-medium text-[#ddd] mt-1">{proposal.client_name}</div>
              {proposal.client_company && <div className="text-[11px] text-[#888]">{proposal.client_company}</div>}
              {proposal.client_email && <div className="text-[11px] text-[#666] mt-0.5">{proposal.client_email}</div>}
            </div>
          )}

          {/* Introduction */}
          {proposal.introduction && (
            <div className="mb-6">
              <p className="text-[12px] text-[#bbb] leading-relaxed">{proposal.introduction}</p>
            </div>
          )}

          {/* Scope */}
          <div className="mb-6">
            <h2 className="text-[14px] font-semibold text-[#ddd] mb-3">Scope of Work</h2>
            <div className="space-y-2">
              {proposal.scope_items.filter(s => s.included).map(item => (
                <div key={item.id} className="flex items-start gap-2 p-3 rounded-lg" style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                  <Check className="h-4 w-4 text-[#0073E6] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-[11px] font-medium text-[#ccc]">{item.title}</div>
                    <div className="text-[10px] text-[#888]">{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="mb-6">
            <h2 className="text-[14px] font-semibold text-[#ddd] mb-3">Investment</h2>
            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
              {oneTime.map(item => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#1a1a1a', borderBottom: '1px solid #222' }}>
                  <div>
                    <div className="text-[11px] font-medium text-[#ccc]">{item.name}</div>
                    <div className="text-[9px] text-[#888]">{item.description}</div>
                  </div>
                  <span className="text-[12px] font-bold text-[#ccc]">{symbol}{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: '#252525' }}>
                <span className="text-[12px] font-semibold text-white">Total</span>
                <span className="text-[14px] font-bold text-white">{symbol}{total.toLocaleString()}</span>
              </div>
            </div>
            {recurring.length > 0 && (
              <div className="mt-3 rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
                <div className="px-4 py-2" style={{ backgroundColor: '#1a1a1a' }}>
                  <span className="text-[10px] font-medium text-[#666] uppercase tracking-wider">Recurring</span>
                </div>
                {recurring.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-2.5" style={{ backgroundColor: '#1a1a1a', borderTop: '1px solid #222' }}>
                    <div>
                      <div className="text-[11px] text-[#ccc]">{item.name}</div>
                      <div className="text-[9px] text-[#888]">{item.description}</div>
                    </div>
                    <span className="text-[11px] font-medium text-[#60a5fa]">{symbol}{item.amount.toLocaleString()}/{item.frequency || 'mo'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Terms */}
          {proposal.terms && (
            <div className="mb-8">
              <h2 className="text-[14px] font-semibold text-[#ddd] mb-2">Terms & Conditions</h2>
              <p className="text-[11px] text-[#888] leading-relaxed whitespace-pre-wrap">{proposal.terms}</p>
            </div>
          )}

          {/* Acceptance box */}
          {proposal.status === 'accepted' ? (
            <div className="p-4 rounded-lg mb-8" style={{ backgroundColor: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Check className="h-5 w-5 text-green-400" />
                <span className="text-[13px] font-semibold text-green-400">Proposal Accepted</span>
              </div>
              <div className="text-[10px] text-[#888]">
                Accepted by {proposal.accepted_by_name} on {proposal.accepted_at ? format(new Date(proposal.accepted_at), 'dd MMMM yyyy') : '—'}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg mb-8" style={{ backgroundColor: '#1a1a1a', border: '1px dashed #333' }}>
              <div className="text-[11px] text-[#666] text-center">
                Digital acceptance area — Client will see an "Accept & Sign" button here
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
