import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, ClipboardList, Eye, Trash2, GripVertical, Type, Hash, Mail, AlignLeft, CheckSquare, List, Calendar, ToggleLeft, ChevronDown, Save, ExternalLink, Copy, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type FieldType = 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'toggle';

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select
}

const FIELD_TYPES: { type: FieldType; icon: any; label: string }[] = [
  { type: 'text', icon: Type, label: 'Short Text' },
  { type: 'email', icon: Mail, label: 'Email' },
  { type: 'number', icon: Hash, label: 'Number' },
  { type: 'textarea', icon: AlignLeft, label: 'Long Text' },
  { type: 'select', icon: List, label: 'Dropdown' },
  { type: 'checkbox', icon: CheckSquare, label: 'Checkbox' },
  { type: 'date', icon: Calendar, label: 'Date' },
  { type: 'toggle', icon: ToggleLeft, label: 'Toggle' },
];

const TEMPLATES = [
  { name: 'Contact Form', fields: [
    { id: '1', type: 'text' as FieldType, label: 'Full Name', placeholder: 'Enter your name', required: true },
    { id: '2', type: 'email' as FieldType, label: 'Email Address', placeholder: 'you@example.com', required: true },
    { id: '3', type: 'text' as FieldType, label: 'Subject', placeholder: 'What is this about?', required: false },
    { id: '4', type: 'textarea' as FieldType, label: 'Message', placeholder: 'Your message...', required: true },
  ]},
  { name: 'Feedback Survey', fields: [
    { id: '1', type: 'text' as FieldType, label: 'Name', placeholder: 'Your name', required: false },
    { id: '2', type: 'email' as FieldType, label: 'Email', placeholder: 'your@email.com', required: true },
    { id: '3', type: 'select' as FieldType, label: 'Rating', required: true, options: ['Excellent', 'Good', 'Average', 'Poor'] },
    { id: '4', type: 'textarea' as FieldType, label: 'Comments', placeholder: 'Tell us more...', required: false },
    { id: '5', type: 'toggle' as FieldType, label: 'Would you recommend us?', required: false },
  ]},
  { name: 'Event Registration', fields: [
    { id: '1', type: 'text' as FieldType, label: 'Full Name', required: true },
    { id: '2', type: 'email' as FieldType, label: 'Email', required: true },
    { id: '3', type: 'text' as FieldType, label: 'Company', required: false },
    { id: '4', type: 'date' as FieldType, label: 'Preferred Date', required: true },
    { id: '5', type: 'select' as FieldType, label: 'Ticket Type', required: true, options: ['General', 'VIP', 'Student'] },
    { id: '6', type: 'checkbox' as FieldType, label: 'I agree to the terms', required: true },
  ]},
];

type View = 'list' | 'builder' | 'preview';

export default function OfficeForms() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('list');
  const [formName, setFormName] = useState('Untitled Form');
  const [fields, setFields] = useState<FormField[]>([]);
  const [showAddField, setShowAddField] = useState(false);

  const addField = (type: FieldType) => {
    const ft = FIELD_TYPES.find(f => f.type === type)!;
    setFields(prev => [...prev, {
      id: Date.now().toString(),
      type,
      label: ft.label,
      placeholder: '',
      required: false,
      options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
    }]);
    setShowAddField(false);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const loadTemplate = (template: typeof TEMPLATES[0]) => {
    setFormName(template.name);
    setFields(template.fields.map(f => ({ ...f, id: Date.now().toString() + Math.random() })));
    setView('builder');
  };

  const saveForm = () => {
    toast.success('Form saved successfully');
  };

  // ─── List View ───
  if (view === 'list') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3 shrink-0">
          <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Back to Office</span>
          </Button>
          <div className="h-4 w-px bg-border/40" />
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" style={{ color: '#eab308' }} />
            <span className="text-sm font-semibold tracking-tight">Forms</span>
          </div>
          <div className="flex-1" />
          <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => { setFields([]); setFormName('Untitled Form'); setView('builder'); }}>
            <Plus className="h-3.5 w-3.5" /> New Form
          </Button>
        </header>

        <div className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-6 sm:pt-8 pb-10">
            <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-[0.12em] mb-5">Start from a template</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
              {TEMPLATES.map((t, i) => (
                <motion.button key={t.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => loadTemplate(t)}
                  className="p-5 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all text-left group hover:-translate-y-1">
                  <div className="h-10 w-10 rounded-[12px] flex items-center justify-center mb-3" style={{ background: '#eab30815' }}>
                    <ClipboardList className="h-5 w-5" style={{ color: '#eab308' }} />
                  </div>
                  <span className="text-[13px] font-semibold text-foreground block">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground/50">{t.fields.length} fields</span>
                </motion.button>
              ))}
            </div>

            <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-[0.12em] mb-4">Or start blank</h2>
            <button onClick={() => { setFields([]); setFormName('Untitled Form'); setView('builder'); }}
              className="w-full p-6 rounded-2xl border-2 border-dashed border-border/30 hover:border-primary/30 bg-card/20 flex items-center justify-center gap-2 text-sm text-muted-foreground/50 hover:text-foreground transition-all">
              <Plus className="h-4 w-4" /> Create blank form
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Preview View ───
  if (view === 'preview') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <header className="h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3 shrink-0">
          <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => setView('builder')}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Editor
          </Button>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground/50">Preview Mode</span>
        </header>
        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="max-w-lg mx-auto px-4 sm:px-6 pt-8 pb-16">
            <h1 className="text-2xl font-bold text-foreground mb-2">{formName}</h1>
            <p className="text-sm text-muted-foreground/60 mb-8">Fill out the form below.</p>
            <div className="space-y-5">
              {fields.map(field => (
                <div key={field.id} className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500 text-xs">*</span>}
                  </label>
                  {field.type === 'text' || field.type === 'email' || field.type === 'number' ? (
                    <Input type={field.type} placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="h-10 rounded-xl" />
                  ) : field.type === 'textarea' ? (
                    <Textarea placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`} className="rounded-xl min-h-[80px]" />
                  ) : field.type === 'date' ? (
                    <Input type="date" className="h-10 rounded-xl" />
                  ) : field.type === 'select' ? (
                    <select className="w-full h-10 rounded-xl border border-border bg-background px-3 text-sm">
                      <option value="">Select...</option>
                      {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      {field.placeholder || field.label}
                    </label>
                  ) : field.type === 'toggle' ? (
                    <div className="flex items-center gap-2">
                      <Switch />
                      <span className="text-sm text-muted-foreground">{field.placeholder || 'Yes / No'}</span>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            <Button className="mt-8 w-full rounded-xl h-11">Submit</Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Builder View ───
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3 shrink-0">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => setView('list')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Forms</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <Input value={formName} onChange={e => setFormName(e.target.value)} className="h-8 w-24 sm:w-48 text-sm font-semibold border-none bg-transparent px-2 focus-visible:ring-0 min-w-0" />
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-8 w-8 sm:w-auto sm:gap-1.5 sm:px-3 rounded-xl text-xs" onClick={() => setView('preview')}>
          <Eye className="h-3.5 w-3.5" /><span className="hidden sm:inline">Preview</span>
        </Button>
        <Button size="sm" className="h-8 w-8 sm:w-auto sm:gap-1.5 sm:px-3 rounded-xl text-xs" onClick={saveForm}>
          <Save className="h-3.5 w-3.5" /><span className="hidden sm:inline">Save</span>
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-16">
          {/* Fields */}
          <AnimatePresence>
            {fields.map((field, i) => {
              const ft = FIELD_TYPES.find(f => f.type === field.type)!;
              const Icon = ft.icon;
              return (
                <motion.div key={field.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }}
                  className="mb-3 p-4 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 transition-all group">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground/20 cursor-grab" />
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: '#eab30812' }}>
                      <Icon className="h-3.5 w-3.5" style={{ color: '#eab308' }} />
                    </div>
                    <Input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} className="h-8 text-sm font-medium border-none bg-transparent px-1 flex-1 min-w-[100px] focus-visible:ring-0" />
                    <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 ml-auto sm:ml-0">
                      <span className="hidden sm:inline">Required</span>
                      <Switch checked={field.required} onCheckedChange={v => updateField(field.id, { required: v })} />
                    </label>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={() => removeField(field.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                  <Input value={field.placeholder || ''} onChange={e => updateField(field.id, { placeholder: e.target.value })} placeholder="Placeholder text…" className="h-8 text-xs border-border/20 rounded-lg bg-muted/20" />
                  {field.type === 'select' && (
                    <div className="mt-2 space-y-1">
                      {field.options?.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground/40 w-4">{oi + 1}.</span>
                          <Input value={opt} onChange={e => {
                            const newOpts = [...(field.options || [])];
                            newOpts[oi] = e.target.value;
                            updateField(field.id, { options: newOpts });
                          }} className="h-7 text-xs flex-1 border-border/20 rounded-lg" />
                          <button onClick={() => updateField(field.id, { options: field.options?.filter((_, j) => j !== oi) })} className="text-red-400 hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => updateField(field.id, { options: [...(field.options || []), `Option ${(field.options?.length || 0) + 1}`] })}
                        className="text-[10px] text-primary hover:underline mt-1">+ Add option</button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Add field button */}
          <div className="relative">
            <button onClick={() => setShowAddField(!showAddField)}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-border/25 hover:border-primary/30 text-sm text-muted-foreground/40 hover:text-foreground transition-all flex items-center gap-2 justify-center">
              <Plus className="h-4 w-4" /> Add Field
            </button>

            <AnimatePresence>
              {showAddField && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  className="absolute left-0 right-0 mt-2 p-3 rounded-2xl bg-card border border-border/30 shadow-xl grid grid-cols-4 gap-2 z-10 max-h-[60vh] overflow-y-auto">
                  {FIELD_TYPES.map(ft => (
                    <button key={ft.type} onClick={() => addField(ft.type)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-accent/40 active:bg-accent/60 transition-colors min-h-[44px] justify-center">
                      <ft.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-foreground">{ft.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
