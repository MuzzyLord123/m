import React, { useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, ChevronDown, ChevronRight, GripVertical, Eye, EyeOff, Copy,
  Type, Mail, Phone, Hash, Calendar, CheckSquare, ToggleLeft,
  List, Upload, AlignLeft, Star, Globe, Lock, FileText, Palette,
  Sparkles, Settings, Layers, Zap
} from 'lucide-react';
import { toast } from 'sonner';

/* ── Types ── */
interface FormField {
  id: string; type: string; label: string; placeholder: string;
  required: boolean; visible: boolean; width: '100%' | '50%' | '33%';
  validation?: { min?: number; max?: number; pattern?: string; message?: string };
  options?: string[]; conditionalField?: string; conditionalValue?: string;
}

interface FormConfig {
  id: string; name: string; submitText: string; successMessage: string;
  redirectUrl: string; method: 'email' | 'webhook' | 'database'; recipient: string;
  fields: FormField[];
  styles: { layout: 'stacked' | 'inline'; spacing: 'compact' | 'normal' | 'relaxed'; rounded: string; accentColor: string };
}

/* ── Field types with colors ── */
const FIELD_TYPES = [
  { type: 'text', label: 'Text', icon: Type, color: 'hsl(var(--studio-accent))' },
  { type: 'email', label: 'Email', icon: Mail, color: 'hsl(var(--studio-accent))' },
  { type: 'phone', label: 'Phone', icon: Phone, color: 'hsl(var(--studio-ok))' },
  { type: 'number', label: 'Number', icon: Hash, color: 'hsl(var(--studio-warn))' },
  { type: 'textarea', label: 'Paragraph', icon: AlignLeft, color: 'hsl(var(--studio-ink-3))' },
  { type: 'select', label: 'Dropdown', icon: List, color: 'hsl(var(--studio-ink-3))' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, color: 'hsl(var(--studio-ok))' },
  { type: 'toggle', label: 'Toggle', icon: ToggleLeft, color: 'hsl(var(--studio-ink-3))' },
  { type: 'date', label: 'Date', icon: Calendar, color: 'hsl(var(--studio-ink-3))' },
  { type: 'file', label: 'File Upload', icon: Upload, color: 'hsl(var(--studio-ink-3))' },
  { type: 'url', label: 'URL', icon: Globe, color: 'hsl(var(--studio-accent))' },
  { type: 'password', label: 'Password', icon: Lock, color: 'hsl(var(--studio-ink-3))' },
  { type: 'rating', label: 'Rating', icon: Star, color: 'hsl(var(--studio-warn))' },
  { type: 'color', label: 'Color', icon: Palette, color: 'hsl(var(--studio-ink-3))' },
  { type: 'hidden', label: 'Hidden', icon: EyeOff, color: 'hsl(var(--studio-ink-3))' },
];

const PRESET_COLORS: Record<string, string> = {
  'Contact Form': 'hsl(var(--studio-accent))', Newsletter: 'hsl(var(--studio-ok))', Feedback: 'hsl(var(--studio-warn))',
  Registration: 'hsl(var(--studio-ink-3))', 'Booking Request': 'hsl(var(--studio-ink-3))',
};

const FORM_PRESETS: { name: string; fields: Omit<FormField, 'id'>[] }[] = [
  { name: 'Contact Form', fields: [
    { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true, visible: true, width: '100%' },
    { type: 'email', label: 'Email', placeholder: 'john@example.com', required: true, visible: true, width: '50%' },
    { type: 'phone', label: 'Phone', placeholder: '+1 (555) 000-0000', required: false, visible: true, width: '50%' },
    { type: 'textarea', label: 'Message', placeholder: 'How can we help?', required: true, visible: true, width: '100%' },
  ]},
  { name: 'Newsletter', fields: [
    { type: 'email', label: 'Email Address', placeholder: 'your@email.com', required: true, visible: true, width: '100%' },
    { type: 'text', label: 'First Name', placeholder: 'First name', required: false, visible: true, width: '50%' },
  ]},
  { name: 'Feedback', fields: [
    { type: 'rating', label: 'How would you rate us?', placeholder: '', required: true, visible: true, width: '100%' },
    { type: 'select', label: 'Category', placeholder: 'Select...', required: true, visible: true, width: '100%', options: ['Bug Report', 'Feature Request', 'General Feedback', 'Other'] },
    { type: 'textarea', label: 'Details', placeholder: 'Tell us more...', required: true, visible: true, width: '100%' },
    { type: 'email', label: 'Email (optional)', placeholder: 'your@email.com', required: false, visible: true, width: '100%' },
  ]},
  { name: 'Registration', fields: [
    { type: 'text', label: 'First Name', placeholder: 'First', required: true, visible: true, width: '50%' },
    { type: 'text', label: 'Last Name', placeholder: 'Last', required: true, visible: true, width: '50%' },
    { type: 'email', label: 'Email', placeholder: 'email@example.com', required: true, visible: true, width: '100%' },
    { type: 'password', label: 'Password', placeholder: '••••••••', required: true, visible: true, width: '50%' },
    { type: 'password', label: 'Confirm Password', placeholder: '••••••••', required: true, visible: true, width: '50%' },
    { type: 'checkbox', label: 'I agree to the Terms & Conditions', placeholder: '', required: true, visible: true, width: '100%' },
  ]},
  { name: 'Booking Request', fields: [
    { type: 'text', label: 'Name', placeholder: 'Your name', required: true, visible: true, width: '50%' },
    { type: 'email', label: 'Email', placeholder: 'email@example.com', required: true, visible: true, width: '50%' },
    { type: 'date', label: 'Preferred Date', placeholder: '', required: true, visible: true, width: '50%' },
    { type: 'select', label: 'Time Slot', placeholder: 'Select a time', required: true, visible: true, width: '50%', options: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'] },
    { type: 'textarea', label: 'Notes', placeholder: 'Any special requests?', required: false, visible: true, width: '100%' },
  ]},
];

const uid = () => Math.random().toString(36).slice(2, 10);

const METHOD_CONFIG = {
  database: { color: 'hsl(var(--studio-ok))', icon: Layers, label: 'Database' },
  email: { color: 'hsl(var(--studio-accent))', icon: Mail, label: 'Email' },
  webhook: { color: 'hsl(var(--studio-warn))', icon: Zap, label: 'Webhook' },
};

/* ── Section Header ── */
function Section({ label, open, onClick, count, color, icon }: { label: string; open: boolean; onClick: () => void; count?: number; color?: string; icon?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between h-9 px-0 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors group" style={{ color: 'hsl(var(--studio-ink-2))' }}>
      <div className="flex items-center gap-2">
        <ChevronRight className={`h-2.5 w-2.5 transition-transform duration-200 ${open ? 'rotate-90' : ''}`} style={{ color: 'hsl(var(--studio-hover))' }} />
        {icon && <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color || 'hsl(var(--studio-ink-3))'}10`, border: `1px solid ${color || 'hsl(var(--studio-ink-3))'}15` }}>{icon}</div>}
        {label}
        {count !== undefined && (
          <span className="text-[8px] px-1.5 py-0.5 rounded-full tabular-nums" style={{ backgroundColor: `${color || 'hsl(var(--studio-accent))'}12`, color: color || 'hsl(var(--studio-accent))' }}>{count}</span>
        )}
      </div>
    </button>
  );
}

/* ── Field Editor ── */
function FieldEditor({ field, onUpdate, onDelete, allFields }: { field: FormField; onUpdate: (f: FormField) => void; onDelete: () => void; allFields: FormField[] }) {
  const [expanded, setExpanded] = useState(false);
  const fieldConfig = FIELD_TYPES.find(f => f.type === field.type);
  const Icon = fieldConfig?.icon || Type;
  const fieldColor = fieldConfig?.color || 'hsl(var(--studio-ink-3))';

  return (
    <motion.div layout className="rounded-lg mb-1 overflow-hidden" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: `1px solid ${expanded ? `${fieldColor}25` : 'hsl(var(--studio-raised))'}`, transition: 'border-color 0.2s' }}>
      <div className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer group" onClick={() => setExpanded(!expanded)}>
        <GripVertical className="h-2.5 w-2.5 cursor-grab opacity-0 group-hover:opacity-50 transition-opacity" style={{ color: 'hsl(var(--studio-ink-3))' }} />
        <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: `${fieldColor}12`, border: `1px solid ${fieldColor}20` }}>
          <Icon className="h-2.5 w-2.5" style={{ color: fieldColor }} />
        </div>
        <span className="text-[10px] flex-1 truncate font-medium" style={{ color: 'hsl(var(--studio-ink-2))' }}>{field.label}</span>
        {field.required && <span className="text-[7px] px-1 py-0.5 rounded-md font-bold" style={{ backgroundColor: '#ef444412', color: 'hsl(var(--studio-risk))', border: '1px solid #ef444420' }}>REQ</span>}
        <span className="text-[7px] px-1 py-0.5 rounded-md font-mono" style={{ backgroundColor: `${fieldColor}08`, color: fieldColor }}>{field.width}</span>
        <ChevronRight className={`h-2.5 w-2.5 transition-transform ${expanded ? 'rotate-90' : ''}`} style={{ color: 'hsl(var(--studio-hover))' }} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
            <div className="px-2 pb-2 space-y-1.5" style={{ borderTop: `1px solid ${fieldColor}12` }}>
              <div className="pt-1.5">
                <div className="text-[8px] mb-0.5 font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Label</div>
                <input value={field.label} onChange={e => onUpdate({ ...field, label: e.target.value })}
                  className="w-full h-6 px-2 rounded-md text-[10px] outline-none" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}
                  onFocus={e => { e.currentTarget.style.borderColor = fieldColor; }} onBlur={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-raised))'; }} />
              </div>
              <div>
                <div className="text-[8px] mb-0.5 font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Placeholder</div>
                <input value={field.placeholder} onChange={e => onUpdate({ ...field, placeholder: e.target.value })}
                  className="w-full h-6 px-2 rounded-md text-[10px] outline-none" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}
                  onFocus={e => { e.currentTarget.style.borderColor = fieldColor; }} onBlur={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-raised))'; }} />
              </div>

              {field.type === 'select' && (
                <div>
                  <div className="text-[8px] mb-0.5 font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Options (one per line)</div>
                  <textarea value={field.options?.join('\n') || ''} onChange={e => onUpdate({ ...field, options: e.target.value.split('\n') })}
                    className="w-full h-16 px-2 py-1 rounded-md text-[10px] outline-none resize-none" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }} />
                </div>
              )}

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={field.required} onChange={e => onUpdate({ ...field, required: e.target.checked })} style={{ accentColor: fieldColor }} className="w-3 h-3" />
                  <span className="text-[9px]" style={{ color: 'hsl(var(--studio-ink-2))' }}>Required</span>
                </label>
                <select value={field.width} onChange={e => onUpdate({ ...field, width: e.target.value as FormField['width'] })}
                  className="h-5 px-1 rounded text-[9px]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}>
                  <option value="100%">Full</option><option value="50%">Half</option><option value="33%">Third</option>
                </select>
              </div>

              {/* Conditional Logic */}
              <div className="rounded-md p-1.5" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
                <div className="text-[8px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1" style={{ color: 'hsl(var(--studio-ink-3))' }}>
                  <Zap className="h-2.5 w-2.5" style={{ color: 'hsl(var(--studio-warn))' }} /> Condition
                </div>
                <div className="flex items-center gap-1">
                  <select value={field.conditionalField || ''} onChange={e => onUpdate({ ...field, conditionalField: e.target.value })}
                    className="flex-1 h-5 px-1 rounded text-[9px]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}>
                    <option value="">Always visible</option>
                    {allFields.filter(f => f.id !== field.id).map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                  </select>
                  {field.conditionalField && (
                    <>
                      <span className="text-[8px]" style={{ color: 'hsl(var(--studio-ink-3))' }}>=</span>
                      <input value={field.conditionalValue || ''} onChange={e => onUpdate({ ...field, conditionalValue: e.target.value })}
                        className="w-16 h-5 px-1 rounded text-[9px]" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }} placeholder="value" />
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-1 pt-1">
                <button onClick={() => { const dup = { ...field, id: uid(), label: field.label + ' Copy' }; const form = allFields; onUpdate(dup); }}
                  className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-md transition-all"
                  style={{ backgroundColor: `${fieldColor}08`, color: fieldColor, border: `1px solid ${fieldColor}20` }}>
                  <Copy className="h-2.5 w-2.5" /> Duplicate
                </button>
                <button onClick={onDelete} className="flex items-center gap-1 text-[9px] px-2 py-1 rounded-md transition-all"
                  style={{ backgroundColor: '#ef444408', color: 'hsl(var(--studio-risk))', border: '1px solid #ef444420' }}>
                  <Trash2 className="h-2.5 w-2.5" /> Remove
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Main Panel ── */
export function FormsBuilder() {
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);
  const [presetsOpen, setPresetsOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [fieldTypesOpen, setFieldTypesOpen] = useState(false);

  const selectedForm = forms.find(f => f.id === selectedFormId);

  const createForm = useCallback((preset?: typeof FORM_PRESETS[0]) => {
    const form: FormConfig = {
      id: uid(), name: preset?.name || 'New Form', submitText: 'Submit',
      successMessage: 'Thank you! Your form has been submitted.', redirectUrl: '',
      method: 'database', recipient: '',
      fields: preset?.fields.map(f => ({ ...f, id: uid() })) || [],
      styles: { layout: 'stacked', spacing: 'normal', rounded: '8px', accentColor: 'hsl(var(--studio-accent))' },
    };
    setForms(p => [...p, form]);
    setSelectedFormId(form.id);
    toast.success(`Created: ${form.name}`);
  }, []);

  const updateForm = useCallback((id: string, updates: Partial<FormConfig>) => {
    setForms(p => p.map(f => f.id === id ? { ...f, ...updates } : f));
  }, []);

  const addField = useCallback((type: string) => {
    if (!selectedFormId) return;
    const field: FormField = { id: uid(), type, label: FIELD_TYPES.find(f => f.type === type)?.label || 'Field', placeholder: '', required: false, visible: true, width: '100%' };
    const form = forms.find(f => f.id === selectedFormId);
    if (form) updateForm(selectedFormId, { fields: [...form.fields, field] });
  }, [selectedFormId, forms, updateForm]);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-accent) / 0.1), rgba(99,102,241,0.08))', border: '1px solid hsl(var(--studio-accent) / 0.15)' }}>
              <FileText className="h-3 w-3" style={{ color: 'hsl(var(--studio-accent))' }} />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: 'hsl(var(--studio-ink-2))' }}>Forms</span>
          </div>
          <button onClick={() => createForm()} className="flex items-center gap-1 text-[8px] font-semibold px-2 py-1 rounded-lg transition-all"
            style={{ background: 'linear-gradient(135deg, hsl(var(--studio-accent)), hsl(var(--studio-ink-3)))', color: 'hsl(var(--studio-ink))', border: 'none' }}>
            <Plus className="h-3 w-3" /> New
          </button>
        </div>

        {/* Presets */}
        <Section label="Templates" open={presetsOpen} onClick={() => setPresetsOpen(!presetsOpen)} count={FORM_PRESETS.length} color="hsl(var(--studio-ink-3))" icon={<Sparkles className="h-3 w-3" style={{ color: 'hsl(var(--studio-ink-3))' }} />} />
        <AnimatePresence>
          {presetsOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
              <div className="grid grid-cols-2 gap-1">
                {FORM_PRESETS.map(p => {
                  const presetColor = PRESET_COLORS[p.name] || 'hsl(var(--studio-ink-3))';
                  return (
                    <button key={p.name} onClick={() => createForm(p)} className="text-left p-2 rounded-lg transition-all group"
                      style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = `${presetColor}40`; e.currentTarget.style.backgroundColor = `${presetColor}05`; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-raised))'; e.currentTarget.style.backgroundColor = 'hsl(var(--studio-panel))'; }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-1 h-1 rounded-full" style={{ backgroundColor: presetColor }} />
                        <div className="text-[9px] font-semibold" style={{ color: 'hsl(var(--studio-ink-2))' }}>{p.name}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] tabular-nums" style={{ color: 'hsl(var(--studio-ink-3))' }}>{p.fields.length} fields</span>
                        <div className="flex -space-x-1">
                          {p.fields.slice(0, 3).map((f, i) => {
                            const fc = FIELD_TYPES.find(ft => ft.type === f.type);
                            return <div key={i} className="w-3 h-3 rounded-sm flex items-center justify-center" style={{ backgroundColor: `${fc?.color || 'hsl(var(--studio-ink-3))'}15`, border: `1px solid ${fc?.color || 'hsl(var(--studio-ink-3))'}20` }}>
                              {fc && <fc.icon className="h-1.5 w-1.5" style={{ color: fc.color }} />}
                            </div>;
                          })}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form list */}
        {forms.length > 0 && (
          <div className="space-y-1">
            <div className="text-[8px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-hover))' }}>Your Forms</div>
            {forms.map(f => {
              const isActive = selectedFormId === f.id;
              return (
                <button key={f.id} onClick={() => setSelectedFormId(f.id)} className="w-full text-left p-2 rounded-lg transition-all group"
                  style={{ backgroundColor: isActive ? 'hsl(var(--studio-accent) / 0.06)' : 'hsl(var(--studio-panel))', border: `1px solid ${isActive ? 'hsl(var(--studio-accent) / 0.2)' : 'hsl(var(--studio-raised))'}` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isActive && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'hsl(var(--studio-accent))' }} />}
                      <span className="text-[10px] font-medium" style={{ color: isActive ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-2))' }}>{f.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[8px] tabular-nums" style={{ color: 'hsl(var(--studio-ink-3))' }}>{f.fields.length} fields</span>
                      <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: `${METHOD_CONFIG[f.method].color}10` }}>
                        {React.createElement(METHOD_CONFIG[f.method].icon, { className: 'h-2.5 w-2.5', style: { color: METHOD_CONFIG[f.method].color } })}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Form Editor */}
        {selectedForm && (
          <div className="space-y-2">
            {/* Settings */}
            <Section label="Settings" open={settingsOpen} onClick={() => setSettingsOpen(!settingsOpen)} color="hsl(var(--studio-warn))" icon={<Settings className="h-3 w-3" style={{ color: 'hsl(var(--studio-warn))' }} />} />
            <AnimatePresence>
              {settingsOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
                  <div className="space-y-1.5 rounded-lg p-2.5" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
                    {[
                      { label: 'Form Name', value: selectedForm.name, key: 'name' },
                      { label: 'Button Text', value: selectedForm.submitText, key: 'submitText' },
                      { label: 'Success Message', value: selectedForm.successMessage, key: 'successMessage' },
                    ].map(f => (
                      <div key={f.key}>
                        <div className="text-[8px] mb-0.5 font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>{f.label}</div>
                        <input value={f.value} onChange={e => updateForm(selectedForm.id, { [f.key]: e.target.value })}
                          className="w-full h-6 px-2 rounded-md text-[10px] outline-none" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }} />
                      </div>
                    ))}
                    <div>
                      <div className="text-[8px] mb-1 font-semibold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Submit Method</div>
                      <div className="flex gap-1">
                        {(['database', 'email', 'webhook'] as const).map(m => {
                          const mc = METHOD_CONFIG[m];
                          const Icon = mc.icon;
                          return (
                            <button key={m} onClick={() => updateForm(selectedForm.id, { method: m })}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[8px] font-semibold capitalize transition-all"
                              style={{
                                backgroundColor: selectedForm.method === m ? `${mc.color}12` : 'hsl(var(--studio-raised))',
                                border: `1px solid ${selectedForm.method === m ? `${mc.color}30` : 'hsl(var(--studio-raised))'}`,
                                color: selectedForm.method === m ? mc.color: 'hsl(var(--studio-ink-2))',
                              }}>
                              <Icon className="h-3 w-3" /> {mc.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Add Field */}
            <Section label="Add Field" open={fieldTypesOpen} onClick={() => setFieldTypesOpen(!fieldTypesOpen)} count={FIELD_TYPES.length} color="hsl(var(--studio-accent))" icon={<Plus className="h-3 w-3" style={{ color: 'hsl(var(--studio-accent))' }} />} />
            <AnimatePresence>
              {fieldTypesOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} style={{ overflow: 'hidden' }}>
                  <div className="grid grid-cols-3 gap-1">
                    {FIELD_TYPES.map(f => {
                      const Icon = f.icon;
                      return (
                        <button key={f.type} onClick={() => addField(f.type)}
                          className="flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all"
                          style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = `${f.color}40`; e.currentTarget.style.backgroundColor = `${f.color}05`; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-raised))'; e.currentTarget.style.backgroundColor = 'hsl(var(--studio-panel))'; }}>
                          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: `${f.color}12`, border: `1px solid ${f.color}20` }}>
                            <Icon className="h-2.5 w-2.5" style={{ color: f.color }} />
                          </div>
                          <span className="text-[7px] font-medium" style={{ color: 'hsl(var(--studio-ink-2))' }}>{f.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fields List */}
            {selectedForm.fields.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Layers className="h-3 w-3" style={{ color: 'hsl(var(--studio-hover))' }} />
                    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Fields</span>
                  </div>
                  <span className="text-[8px] tabular-nums px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.08)', color: 'hsl(var(--studio-accent))' }}>{selectedForm.fields.length}</span>
                </div>
                {selectedForm.fields.map(f => (
                  <FieldEditor
                    key={f.id} field={f} allFields={selectedForm.fields}
                    onUpdate={updated => updateForm(selectedForm.id, { fields: selectedForm.fields.map(ff => ff.id === updated.id ? updated : ff) })}
                    onDelete={() => updateForm(selectedForm.id, { fields: selectedForm.fields.filter(ff => ff.id !== f.id) })}
                  />
                ))}
              </div>
            )}

            {/* Live preview */}
            {selectedForm.fields.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Eye className="h-3 w-3" style={{ color: 'hsl(var(--studio-hover))' }} />
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'hsl(var(--studio-ink-3))' }}>Preview</span>
                </div>
                <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
                  {selectedForm.fields.filter(f => f.visible).map(f => {
                    const fc = FIELD_TYPES.find(ft => ft.type === f.type);
                    return (
                      <div key={f.id} style={{ width: f.width === '100%' ? '100%' : f.width === '50%' ? 'calc(50% - 4px)' : 'calc(33% - 4px)', display: 'inline-block', verticalAlign: 'top', paddingRight: f.width !== '100%' ? '8px' : '0' }}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="text-[9px] font-medium" style={{ color: 'hsl(var(--studio-ink-2))' }}>{f.label}</span>
                          {f.required && <span className="text-[7px]" style={{ color: 'hsl(var(--studio-risk))' }}>*</span>}
                        </div>
                        <div className="h-6 rounded-md flex items-center px-2" style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))' }}>
                          <span className="text-[9px]" style={{ color: 'hsl(var(--studio-hover))' }}>{f.placeholder || f.type}</span>
                        </div>
                      </div>
                    );
                  })}
                  <button className="w-full h-7 rounded-lg text-[10px] font-semibold mt-2" style={{ backgroundColor: selectedForm.styles.accentColor, color: 'hsl(var(--studio-ink))', borderRadius: selectedForm.styles.rounded }}>
                    {selectedForm.submitText}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {forms.length === 0 && !presetsOpen && (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-accent) / 0.08), hsl(var(--studio-accent) / 0.02))', border: '1px solid hsl(var(--studio-accent) / 0.1)' }}>
              <FileText className="h-6 w-6" style={{ color: 'hsl(var(--studio-accent) / 0.4)' }} />
            </div>
            <span className="text-[11px] font-medium" style={{ color: 'hsl(var(--studio-ink-2))' }}>No forms yet</span>
            <span className="text-[9px]" style={{ color: 'hsl(var(--studio-hover))' }}>Create one from a template above</span>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
