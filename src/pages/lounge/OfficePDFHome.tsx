import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileCheck, Plus, Upload, Clock, Star, Trash2, File, FileText, Search, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { PDF_TEMPLATES, PDF_TEMPLATE_CATEGORIES, PDFTemplate } from '@/components/pdf/pdfTemplates';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface PDFItem {
  id: string;
  title: string;
  size: string;
  pages: number;
  createdAt: Date;
  isStarred: boolean;
  sourceRoute?: string;
  metadata?: any;
  appSource?: string;
}

export default function OfficePDFHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState<PDFItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load saved PDFs from platform_files
  useEffect(() => {
    const fetchPDFs = async () => {
      if (!user?.id) { setLoading(false); return; }
      const { data } = await supabase
        .from('platform_files')
        .select('*')
        .eq('user_id', user.id)
        .eq('app_source', 'pdf-studio')
        .eq('is_trashed', false)
        .order('updated_at', { ascending: false });

      if (data) {
        setFiles(data.map((f: any) => ({
          id: f.id,
          title: f.file_name,
          size: f.file_size_bytes ? `${Math.round(f.file_size_bytes / 1024)} KB` : '—',
          pages: (f.metadata as any)?.blockCount || 1,
          createdAt: new Date(f.created_at),
          isStarred: f.is_starred,
          sourceRoute: f.source_route,
          metadata: f.metadata,
          appSource: f.app_source,
        })));
      }
      setLoading(false);
    };
    fetchPDFs();
  }, [user?.id]);

  const openEditor = () => navigate('/lounge/office/pdf', { state: { fromOfficeApp: true } });
  const openCreator = (template?: PDFTemplate) => navigate('/lounge/office/pdf-creator', { state: { fromOfficeApp: true, template } });

  const toggleStar = async (id: string) => {
    const file = files.find(f => f.id === id);
    if (!file) return;
    const newVal = !file.isStarred;
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isStarred: newVal } : f));
    await supabase.from('platform_files').update({ is_starred: newVal }).eq('id', id);
  };

  const deleteFile = async (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    await supabase.from('platform_files').update({ is_trashed: true, trashed_at: new Date().toISOString() }).eq('id', id);
    toast.success('Moved to trash');
  };

  const filtered = files.filter(f => f.title.toLowerCase().includes(search.toLowerCase()));
  const starred = filtered.filter(f => f.isStarred);
  const recent = filtered.filter(f => !f.isStarred);

  const filteredTemplates = activeCategory
    ? PDF_TEMPLATES.filter(t => t.category === activeCategory)
    : PDF_TEMPLATES;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <FileCheck className="h-4 w-4 text-red-500" />
        <span className="text-sm font-semibold tracking-tight">PDF Studio</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={openEditor}>
          <Upload className="h-3.5 w-3.5" /> Open PDF
        </Button>
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => openCreator()}>
          <Plus className="h-3.5 w-3.5" /> Create PDF
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">PDF Studio</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Create, edit, annotate, and export professional PDF documents.</p>
          </motion.div>

          <div className="flex items-center gap-3 mb-6">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PDFs…" className="max-w-md h-10 rounded-xl bg-card/50 border-border/30 text-sm" />
          </div>

          {/* Quick Actions */}
          <section className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { label: 'Create New PDF', desc: 'Start from a template', icon: Plus, color: '#10b981', action: () => openCreator() },
                { label: 'Upload & Edit PDF', desc: 'Open any PDF for annotation', icon: Upload, color: '#ef4444', action: openEditor },
                { label: 'Merge PDFs', desc: 'Combine multiple documents', icon: File, color: '#f59e0b', action: openEditor },
                { label: 'PDF to Text', desc: 'Extract text content', icon: FileText, color: '#3b82f6', action: openEditor },
              ].map((action, i) => (
                <motion.button key={action.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={action.action}
                  className="group flex items-center gap-4 p-5 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${action.color}15` }}>
                    <action.icon className="h-5 w-5" style={{ color: action.color }} />
                  </div>
                  <div className="text-left">
                    <span className="text-[12px] font-semibold text-foreground block">{action.label}</span>
                    <span className="text-[10px] text-muted-foreground/50">{action.desc}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Template Gallery */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center">
                  <LayoutTemplate className="h-4 w-4 text-primary/70" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-foreground tracking-tight">Templates</h2>
                  <p className="text-[10px] text-muted-foreground/50">Start from a professionally designed layout</p>
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground/40 font-medium">{filteredTemplates.length} templates</span>
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn("px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-all",
                  !activeCategory
                    ? "bg-foreground text-background shadow-md"
                    : "bg-card/60 text-muted-foreground/60 hover:bg-card hover:text-foreground border border-border/20"
                )}
              >All</button>
              {PDF_TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={cn("px-3.5 py-2 rounded-xl text-[11px] font-semibold transition-all",
                    activeCategory === cat.id
                      ? "bg-foreground text-background shadow-md"
                      : "bg-card/60 text-muted-foreground/60 hover:bg-card hover:text-foreground border border-border/20"
                  )}
                >{cat.icon} {cat.name}</button>
              ))}
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredTemplates.map((tmpl, i) => (
                <motion.button
                  key={tmpl.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => openCreator(tmpl)}
                  className="group relative rounded-2xl bg-card/50 border border-border/15 hover:border-border/40 hover:shadow-xl transition-all text-left overflow-hidden"
                >
                  {/* Document preview mock */}
                  <div className="relative h-28 sm:h-32 bg-gradient-to-br from-muted/20 to-muted/5 border-b border-border/10 p-4 overflow-hidden">
                    {/* Mini page lines */}
                    <div className="space-y-1.5 opacity-60">
                      <div className="h-2 w-2/3 rounded-sm" style={{ backgroundColor: `${tmpl.color}30` }} />
                      <div className="h-1 w-1/2 rounded-sm bg-foreground/6" />
                      <div className="h-1 w-4/5 rounded-sm bg-foreground/5 mt-2" />
                      <div className="h-1 w-3/5 rounded-sm bg-foreground/5" />
                      <div className="h-1 w-2/3 rounded-sm bg-foreground/4" />
                      <div className="h-1 w-1/2 rounded-sm bg-foreground/4" />
                    </div>
                    {/* Category color accent */}
                    <div className="absolute top-0 right-0 w-16 h-16 rounded-bl-[2rem] opacity-[0.07]" style={{ backgroundColor: tmpl.color }} />
                    {/* Icon overlay */}
                    <div className="absolute bottom-3 right-3 text-2xl opacity-30 group-hover:opacity-50 transition-opacity">{tmpl.icon}</div>
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-center justify-center">
                      <span className="text-[10px] font-semibold text-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
                        Use Template →
                      </span>
                    </div>
                  </div>
                  {/* Card info */}
                  <div className="px-4 py-3">
                    <h3 className="text-[12px] font-semibold text-foreground truncate leading-tight">{tmpl.name}</h3>
                    <p className="text-[10px] text-muted-foreground/45 mt-1 line-clamp-1">{tmpl.description}</p>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tmpl.color }} />
                      <span className="text-[9px] text-muted-foreground/40 font-medium">
                        {PDF_TEMPLATE_CATEGORIES.find(c => c.id === tmpl.category)?.name}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Starred */}
          {starred.length > 0 && (
            <section className="mb-8">
              <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Star className="h-3 w-3" /> Starred</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {starred.map(f => <PDFPreviewCard key={f.id} file={f} onOpen={() => f.sourceRoute ? navigate(f.sourceRoute) : openEditor()} onStar={() => toggleStar(f.id)} onDelete={() => deleteFile(f.id)} />)}
              </div>
            </section>
          )}

          {/* Recent */}
          <section className="pb-10">
            <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-4 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Recent</h2>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <div key={i} className="h-52 rounded-2xl bg-muted/20 animate-pulse" />)}
              </div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted-foreground/40 py-8 text-center">No PDFs yet. Create one from a template or upload an existing PDF!</p>
            ) : null}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recent.map(f => <PDFPreviewCard key={f.id} file={f} onOpen={() => f.sourceRoute ? navigate(f.sourceRoute) : openEditor()} onStar={() => toggleStar(f.id)} onDelete={() => deleteFile(f.id)} />)}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function PDFPreviewCard({ file, onOpen, onStar, onDelete }: { file: PDFItem; onOpen: () => void; onStar: () => void; onDelete: () => void }) {
  const isInvoice = file.sourceRoute?.includes('invoice') || file.title?.toLowerCase().includes('invoice');
  const isPdfCreator = file.sourceRoute?.includes('pdf-creator') || file.appSource === 'pdf-studio';

  // Generate mock preview lines based on metadata
  const previewLines = file.metadata?.blocks
    ? (file.metadata.blocks as any[]).slice(0, 5).map((b: any) => b.content || b.type || '')
    : file.metadata?.lineItems
    ? (file.metadata.lineItems as any[]).slice(0, 4).map((li: any) => `${li.description || li.name} — ${li.amount || ''}`)
    : null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="group rounded-2xl bg-card/60 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
      onClick={onOpen}>
      {/* Document Preview Area */}
      <div className="relative aspect-[4/3] bg-muted/10 border-b border-border/10 p-4 flex flex-col overflow-hidden">
        {/* Mini document simulation */}
        <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
          {/* Title bar */}
          <div className="h-3 w-3/4 rounded-sm bg-foreground/10" />
          <div className="h-2 w-1/2 rounded-sm bg-foreground/6 mt-1" />

          {isInvoice ? (
            /* Invoice preview */
            <div className="mt-3 space-y-2 flex-1">
              <div className="flex items-center justify-between">
                <div className="h-2 w-16 rounded-sm bg-primary/15" />
                <div className="h-2 w-12 rounded-sm bg-primary/15" />
              </div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="h-1.5 rounded-sm bg-foreground/6" style={{ width: `${40 + Math.random() * 30}%` }} />
                  <div className="h-1.5 w-10 rounded-sm bg-foreground/8" />
                </div>
              ))}
              <div className="border-t border-border/20 pt-2 mt-auto flex justify-end">
                <div className="h-2.5 w-20 rounded-sm bg-primary/20" />
              </div>
            </div>
          ) : (
            /* PDF/Document preview */
            <div className="mt-3 space-y-1.5 flex-1">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-1.5 rounded-sm bg-foreground/6" style={{ width: `${50 + Math.random() * 45}%` }} />
              ))}
              <div className="h-1.5 w-1/3 rounded-sm bg-foreground/6 mt-3" />
              {[1, 2, 3].map(i => (
                <div key={i} className="h-1.5 rounded-sm bg-foreground/5" style={{ width: `${40 + Math.random() * 50}%` }} />
              ))}
            </div>
          )}
        </div>

        {/* Type badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
            isInvoice ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
          )}>
            {isInvoice ? 'Invoice' : 'PDF'}
          </span>
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
          <Button size="sm" className="h-8 rounded-xl text-xs gap-1.5 shadow-lg">
            <FileText className="h-3.5 w-3.5" /> Open
          </Button>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-[13px] font-semibold text-foreground truncate">{file.title}</h3>
            <p className="text-[10px] text-muted-foreground/50 mt-0.5">
              {file.pages} page{file.pages !== 1 ? 's' : ''} · {file.size} · {formatDistanceToNow(file.createdAt, { addSuffix: true })}
            </p>
          </div>
          <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={e => { e.stopPropagation(); onStar(); }} className="h-7 w-7 rounded-lg hover:bg-accent flex items-center justify-center">
              <Star className={cn("h-3.5 w-3.5", file.isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
            </button>
            <button onClick={e => { e.stopPropagation(); onDelete(); }} className="h-7 w-7 rounded-lg hover:bg-destructive/20 flex items-center justify-center">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}