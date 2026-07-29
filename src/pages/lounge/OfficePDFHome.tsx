import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileCheck, Plus, Upload, Star, Trash2, File, FileText, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PDF_TEMPLATES, PDF_TEMPLATE_CATEGORIES, PDFTemplate } from '@/components/pdf/pdfTemplates';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, EmptyState, RelativeTime, FIELD } from '@/components/platform';

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
          size: f.file_size_bytes ? `${Math.round(f.file_size_bytes / 1024)} KB` : '–',
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
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border/60 bg-card px-5">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-lg text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/60" />
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/[0.04]">
          <FileCheck className="h-3.5 w-3.5 text-ink-2" strokeWidth={1.7} />
        </span>
        <span className="text-sm font-semibold tracking-tight">PDF Studio</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={openEditor}>
          <Upload className="h-3.5 w-3.5" /> Open PDF
        </Button>
        <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => openCreator()}>
          <Plus className="h-3.5 w-3.5" /> Create PDF
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <PageHeader
            className="pb-5 pt-7"
            kicker="Quooro Office · PDF"
            title="PDF Studio"
            description="Create, edit, annotate and export PDF documents"
          />

          <div className="mb-6 flex items-center gap-3">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PDFs" className={cn(FIELD, 'h-9 max-w-md text-sm')} />
          </div>

          {/* Quick actions */}
          <section className="mb-8">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
              {[
                { label: 'Create new PDF', desc: 'Start from a template', icon: Plus, action: () => openCreator() },
                { label: 'Upload and edit', desc: 'Open any PDF for annotation', icon: Upload, action: openEditor },
                { label: 'Merge PDFs', desc: 'Combine multiple documents', icon: File, action: openEditor },
                { label: 'PDF to text', desc: 'Extract text content', icon: FileText, action: openEditor },
              ].map((action) => (
                <button key={action.label}
                  onClick={action.action}
                  className="flex items-center gap-3.5 rounded-[10px] border border-border/60 bg-card p-4 text-left transition-colors duration-150 hover:bg-foreground/[0.025]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-foreground/[0.04]">
                    <action.icon className="h-4 w-4 text-ink-2" strokeWidth={1.7} />
                  </span>
                  <span>
                    <span className="block text-[12px] font-medium text-foreground">{action.label}</span>
                    <span className="text-[10.5px] text-muted-foreground">{action.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Template gallery */}
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2.5">
              <h2 className="flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <LayoutTemplate className="h-3.5 w-3.5" /> Templates
              </h2>
              <div className="h-px flex-1 bg-border/60" />
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground/70">{filteredTemplates.length}</span>
            </div>

            {/* Category filters */}
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn('rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors duration-150',
                  !activeCategory
                    ? 'bg-foreground text-background'
                    : 'border border-border/60 bg-card text-muted-foreground hover:bg-foreground/[0.025] hover:text-foreground'
                )}
              >All</button>
              {PDF_TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)}
                  className={cn('rounded-lg px-3 py-1.5 text-[11px] font-medium transition-colors duration-150',
                    activeCategory === cat.id
                      ? 'bg-foreground text-background'
                      : 'border border-border/60 bg-card text-muted-foreground hover:bg-foreground/[0.025] hover:text-foreground'
                  )}
                >{cat.name}</button>
              ))}
            </div>

            {/* Template grid */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTemplates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  onClick={() => openCreator(tmpl)}
                  className="group overflow-hidden rounded-[10px] border border-border/60 bg-card text-left transition-colors duration-150 hover:border-border"
                >
                  {/* Document preview mock */}
                  <div className="relative h-28 overflow-hidden border-b border-border/60 bg-sunken/50 p-4 sm:h-32">
                    <div className="space-y-1.5">
                      <div className="h-2 w-2/3 rounded-sm bg-foreground/[0.10]" />
                      <div className="h-1 w-1/2 rounded-sm bg-foreground/[0.06]" />
                      <div className="mt-2 h-1 w-4/5 rounded-sm bg-foreground/[0.05]" />
                      <div className="h-1 w-3/5 rounded-sm bg-foreground/[0.05]" />
                      <div className="h-1 w-2/3 rounded-sm bg-foreground/[0.04]" />
                      <div className="h-1 w-1/2 rounded-sm bg-foreground/[0.04]" />
                    </div>
                  </div>
                  {/* Card info */}
                  <div className="px-4 py-3">
                    <h3 className="truncate text-[12px] font-medium leading-tight text-foreground">{tmpl.name}</h3>
                    <p className="mt-1 line-clamp-1 text-[10.5px] text-muted-foreground">{tmpl.description}</p>
                    <span className="mt-1.5 block font-mono text-[9px] uppercase tracking-[0.13em] text-muted-foreground/70">
                      {PDF_TEMPLATE_CATEGORIES.find(c => c.id === tmpl.category)?.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Starred */}
          {starred.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <Star className="h-3 w-3 fill-gold text-gold" /> Starred
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {starred.map(f => <PDFPreviewCard key={f.id} file={f} onOpen={() => f.sourceRoute ? navigate(f.sourceRoute) : openEditor()} onStar={() => toggleStar(f.id)} onDelete={() => deleteFile(f.id)} />)}
              </div>
            </section>
          )}

          {/* Recent */}
          <section className="pb-10">
            <h2 className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Recent</h2>
            {loading ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
                {[1, 2, 3].map(i => (
                  <div key={i} className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
                    <div className="aspect-[4/3] animate-pulse bg-foreground/[0.04]" />
                    <div className="space-y-1.5 border-t border-border/60 p-3">
                      <div className="h-2.5 w-3/4 animate-pulse rounded bg-foreground/[0.06]" />
                      <div className="h-2 w-1/2 animate-pulse rounded bg-foreground/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recent.length === 0 ? (
              <EmptyState
                compact
                title="No PDFs yet"
                body="Create one from a template or open an existing PDF."
                action={{ label: 'Create PDF', onClick: () => openCreator() }}
              />
            ) : null}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
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
    <div
      className="group cursor-pointer overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:border-border"
      onClick={onOpen}>
      {/* Document preview area */}
      <div className="relative flex aspect-[4/3] flex-col overflow-hidden border-b border-border/60 bg-sunken/50 p-4">
        {/* Mini document simulation */}
        <div className="flex flex-1 flex-col gap-1.5 overflow-hidden">
          {/* Title bar */}
          <div className="h-3 w-3/4 rounded-sm bg-foreground/[0.10]" />
          <div className="mt-1 h-2 w-1/2 rounded-sm bg-foreground/[0.06]" />

          {isInvoice ? (
            /* Invoice preview */
            <div className="mt-3 flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-2 w-16 rounded-sm bg-foreground/[0.08]" />
                <div className="h-2 w-12 rounded-sm bg-foreground/[0.08]" />
              </div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <div className="h-1.5 rounded-sm bg-foreground/[0.06]" style={{ width: `${40 + Math.random() * 30}%` }} />
                  <div className="h-1.5 w-10 rounded-sm bg-foreground/[0.08]" />
                </div>
              ))}
              <div className="mt-auto flex justify-end border-t border-border/60 pt-2">
                <div className="h-2.5 w-20 rounded-sm bg-foreground/[0.10]" />
              </div>
            </div>
          ) : (
            /* PDF/Document preview */
            <div className="mt-3 flex-1 space-y-1.5">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-1.5 rounded-sm bg-foreground/[0.06]" style={{ width: `${50 + Math.random() * 45}%` }} />
              ))}
              <div className="mt-3 h-1.5 w-1/3 rounded-sm bg-foreground/[0.06]" />
              {[1, 2, 3].map(i => (
                <div key={i} className="h-1.5 rounded-sm bg-foreground/[0.05]" style={{ width: `${40 + Math.random() * 50}%` }} />
              ))}
            </div>
          )}
        </div>

        {/* Type label */}
        <div className="absolute right-2.5 top-2.5">
          <span className="font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
            {isInvoice ? 'Invoice' : 'PDF'}
          </span>
        </div>
      </div>

      {/* Card footer */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-medium text-foreground">{file.title}</h3>
            <p className="mt-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
              {file.pages} page{file.pages !== 1 ? 's' : ''} · {file.size} · <RelativeTime date={file.createdAt} className="text-[10px]" />
            </p>
          </div>
          <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <button aria-label={file.isStarred ? 'Unstar' : 'Star'} onClick={e => { e.stopPropagation(); onStar(); }} className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-foreground/[0.04]">
              <Star className={cn('h-3.5 w-3.5', file.isStarred ? 'fill-gold text-gold' : 'text-muted-foreground')} />
            </button>
            <button aria-label="Delete" onClick={e => { e.stopPropagation(); onDelete(); }} className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-destructive/20">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
