import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ClipboardList, Plus, Trash2, Search, CheckCircle2, Send, Eye, BarChart3, Star, FileText, ListChecks, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type FieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'rating' | 'number';

interface FormField {
  id: string; label: string; type: FieldType; required: boolean; options?: string[];
}

interface Form {
  id: string; title: string; description: string; fields: FormField[]; responses: number;
  status: 'draft' | 'published' | 'closed'; createdAt: Date; isStarred: boolean;
}

export default function OfficeForms() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [forms, setForms] = useState<Form[]>([
    { id: '1', title: 'Client Satisfaction Survey', description: 'Quarterly feedback from clients', fields: [
      { id: 'f1', label: 'Overall satisfaction', type: 'rating', required: true },
      { id: 'f2', label: 'Communication quality', type: 'select', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor'] },
      { id: 'f3', label: 'Additional comments', type: 'textarea', required: false },
    ], responses: 24, status: 'published', createdAt: new Date(Date.now() - 86400000 * 7), isStarred: true },
    { id: '2', title: 'Employee Feedback Form', description: 'Anonymous team pulse check', fields: [
      { id: 'f1', label: 'How would you rate your work-life balance?', type: 'rating', required: true },
      { id: 'f2', label: 'What could improve?', type: 'textarea', required: false },
    ], responses: 12, status: 'published', createdAt: new Date(Date.now() - 86400000 * 14), isStarred: false },
    { id: '3', title: 'Event Registration', description: 'Team building event signup', fields: [
      { id: 'f1', label: 'Full name', type: 'text', required: true },
      { id: 'f2', label: 'Dietary requirements', type: 'select', required: false, options: ['None', 'Vegetarian', 'Vegan', 'Gluten-free'] },
      { id: 'f3', label: 'Bringing a guest?', type: 'checkbox', required: false },
    ], responses: 8, status: 'draft', createdAt: new Date(Date.now() - 86400000 * 2), isStarred: false },
    { id: '4', title: 'Project Brief Template', description: 'Standard project intake form', fields: [
      { id: 'f1', label: 'Project name', type: 'text', required: true },
      { id: 'f2', label: 'Budget range', type: 'number', required: true },
      { id: 'f3', label: 'Project description', type: 'textarea', required: true },
      { id: 'f4', label: 'Timeline preference', type: 'select', required: true, options: ['ASAP', '1-2 weeks', '1 month', '2-3 months'] },
    ], responses: 31, status: 'published', createdAt: new Date(Date.now() - 86400000 * 30), isStarred: true },
  ]);

  const filtered = forms.filter(f => f.title.toLowerCase().includes(search.toLowerCase()));
  const deleteForm = (id: string) => { setForms(p => p.filter(f => f.id !== id)); toast.success('Deleted'); };
  const toggleStar = (id: string) => setForms(p => p.map(f => f.id === id ? { ...f, isStarred: !f.isStarred } : f));

  const totalResponses = forms.reduce((s, f) => s + f.responses, 0);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <ClipboardList className="h-4 w-4 text-teal-500" />
        <span className="text-sm font-semibold tracking-tight">Forms & Surveys</span>
        <div className="flex-1" />
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Forms & Surveys</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Build forms, collect responses, and analyze results.</p>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: 'Total Forms', value: forms.length, icon: ClipboardList, color: '#14b8a6' },
              { label: 'Published', value: forms.filter(f => f.status === 'published').length, icon: Send, color: '#10b981' },
              { label: 'Total Responses', value: totalResponses, icon: CheckCircle2, color: '#3b82f6' },
              { label: 'Avg / Form', value: forms.length > 0 ? Math.round(totalResponses / forms.length) : 0, icon: BarChart3, color: '#8b5cf6' },
            ].map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="p-4 rounded-2xl bg-card/50 border border-border/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <s.icon className="h-4 w-4" style={{ color: s.color }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">{s.label}</span>
                </div>
                <span className="text-xl font-bold text-foreground">{s.value}</span>
              </motion.div>
            ))}
          </div>

          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search forms…" className="max-w-xs h-9 rounded-xl bg-card/50 border-border/30 text-sm mb-5" />

          {/* Starred */}
          {filtered.filter(f => f.isStarred).length > 0 && (
            <section className="mb-6">
              <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Star className="h-3 w-3" /> Starred</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filtered.filter(f => f.isStarred).map(form => <FormCard key={form.id} form={form} onDelete={deleteForm} onStar={toggleStar} />)}
              </div>
            </section>
          )}

          {/* All forms */}
          <section className="pb-10">
            <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-3">All Forms</h2>
            <div className="space-y-2">
              {filtered.filter(f => !f.isStarred).map(form => <FormCard key={form.id} form={form} onDelete={deleteForm} onStar={toggleStar} />)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FormCard({ form, onDelete, onStar }: { form: Form; onDelete: (id: string) => void; onStar: (id: string) => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="group p-5 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">{form.title}</h3>
          <span className="text-[10px] text-muted-foreground/50">{form.description}</span>
        </div>
        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button onClick={() => onStar(form.id)} className="h-7 w-7 rounded-lg hover:bg-accent flex items-center justify-center">
            <Star className={cn("h-3.5 w-3.5", form.isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
          </button>
          <button onClick={() => onDelete(form.id)} className="h-7 w-7 rounded-lg hover:bg-destructive/20 flex items-center justify-center">
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-muted-foreground/45">
        <span className={cn("px-2 py-0.5 rounded-full font-medium",
          form.status === 'published' ? "bg-green-500/10 text-green-500" : form.status === 'draft' ? "bg-muted text-muted-foreground/50" : "bg-red-500/10 text-red-500")}>
          {form.status}
        </span>
        <span className="flex items-center gap-1"><ListChecks className="h-3 w-3" />{form.fields.length} fields</span>
        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{form.responses} responses</span>
      </div>
    </motion.div>
  );
}
