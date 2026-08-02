import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  FileText, Plus, Search, Star, StarOff, Trash2, MoreHorizontal,
  Grid3X3, List, SortAsc, SortDesc, Pencil, Copy, ArrowLeft,
  FileSignature, FileBarChart, Mail, StickyNote, Users, Briefcase, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OfficeModuleBand } from '@/pages/lounge/office/ModuleShell';
import { PageHeader, EmptyState, RelativeTime, FIELD } from '@/components/platform';

interface OfficeDocument {
  id: string;
  title: string;
  document_type: string;
  word_count: number;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

const TEMPLATES = [
  { id: 'blank', label: 'Blank document', description: 'Start from nothing', icon: FileText },
  { id: 'report', label: 'Business report', description: 'Professional report layout', icon: FileBarChart },
  { id: 'proposal', label: 'Project proposal', description: 'Win new business', icon: Briefcase },
  { id: 'letter', label: 'Formal letter', description: 'Professional correspondence', icon: Mail },
  { id: 'memo', label: 'Internal memo', description: 'Team communications', icon: StickyNote },
  { id: 'meeting', label: 'Meeting notes', description: 'Capture key decisions', icon: Users },
  { id: 'contract', label: 'Contract draft', description: 'Legal document template', icon: FileSignature },
];

type SortBy = 'updated' | 'created' | 'title' | 'words';

export default function OfficeWordHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<OfficeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('updated');
  const [sortDir, setSortDir] = useState<'desc' | 'asc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchDocuments = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('office_documents')
      .select('id, title, document_type, word_count, is_starred, created_at, updated_at')
      .eq('user_id', user.id)
      .eq('document_type', 'word')
      .order('updated_at', { ascending: false });
    if (!error && data) setDocuments(data);
    setLoading(false);
  };

  useEffect(() => { fetchDocuments(); }, [user]);

  const createDocument = async (template?: string) => {
    if (!user) return;
    const titles: Record<string, string> = {
      blank: 'Untitled Document', report: 'Business Report', proposal: 'Project Proposal',
      letter: 'Formal Letter', memo: 'Internal Memo', meeting: 'Meeting Minutes', contract: 'Contract Draft',
    };
    const { data, error } = await supabase
      .from('office_documents')
      .insert({ user_id: user.id, title: titles[template || 'blank'] || 'Untitled Document', document_type: 'word' })
      .select('id').single();
    if (error) { toast.error('Failed to create document'); return; }
    navigate(`/lounge/office/word/${data.id}`);
  };

  const duplicateDocument = async (doc: OfficeDocument) => {
    if (!user) return;
    const { data: original } = await supabase.from('office_documents').select('content').eq('id', doc.id).single();
    const { data, error } = await supabase
      .from('office_documents')
      .insert({ user_id: user.id, title: `${doc.title} (Copy)`, document_type: 'word', content: original?.content || {} })
      .select('id').single();
    if (!error && data) { toast.success('Document duplicated'); fetchDocuments(); }
  };

  const toggleStar = async (id: string, current: boolean) => {
    await supabase.from('office_documents').update({ is_starred: !current }).eq('id', id);
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, is_starred: !current } : d));
  };

  const deleteDocument = async () => {
    if (!deleteId) return;
    await supabase.from('office_documents').delete().eq('id', deleteId);
    setDocuments(prev => prev.filter(d => d.id !== deleteId));
    setDeleteId(null);
    setSelectedIds(prev => { const next = new Set(prev); next.delete(deleteId); return next; });
    toast.success('Document deleted');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(d => d.id)));
  };

  const batchDelete = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase.from('office_documents').delete().eq('id', id);
    }
    setDocuments(prev => prev.filter(d => !selectedIds.has(d.id)));
    toast.success(`Deleted ${ids.length} document${ids.length > 1 ? 's' : ''}`);
    setSelectedIds(new Set());
  };

  const batchStar = async (star: boolean) => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await supabase.from('office_documents').update({ is_starred: star }).eq('id', id);
    }
    setDocuments(prev => prev.map(d => selectedIds.has(d.id) ? { ...d, is_starred: star } : d));
    toast.success(`${star ? 'Starred' : 'Unstarred'} ${ids.length} document${ids.length > 1 ? 's' : ''}`);
    setSelectedIds(new Set());
  };

  const filtered = documents
    .filter(d => d.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const dir = sortDir === 'desc' ? -1 : 1;
      switch (sortBy) {
        case 'title': return dir * a.title.localeCompare(b.title);
        case 'words': return dir * (a.word_count - b.word_count);
        case 'created': return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        default: return dir * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      }
    });

  const starred = filtered.filter(d => d.is_starred);
  const recent = filtered.filter(d => !d.is_starred);
  const totalWords = documents.reduce((sum, d) => sum + d.word_count, 0);

  return (
    <div className="h-full flex flex-col overflow-auto bg-background">
      <div className="sticky top-0 z-30 bg-background">
        <OfficeModuleBand appId="docs" icon={FileText} title="Docs" context={documents.length ? `${documents.length} documents` : undefined} />
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-8">
        {/* Header */}
        <div className="flex items-start gap-3 pt-5 sm:pt-7">
          <PageHeader
            className="min-w-0 flex-1"
            title="Documents"
            description="Write, edit and manage your documents"
            actions={
              <Button className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => createDocument('blank')}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New document</span>
              </Button>
            }
          />
        </div>

        {/* Fact line */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 font-mono text-[10px] uppercase tracking-[0.13em] text-muted-foreground">
          <span className="tabular-nums">{documents.length} documents</span>
          <span className="tabular-nums">{totalWords.toLocaleString()} words</span>
          <span className="tabular-nums">{starred.length} starred</span>
        </div>

        {/* Templates */}
        <section className="pb-6 pt-6">
          <div className="mb-3 flex items-center gap-2.5">
            <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Start from a template</h2>
            <div className="h-px flex-1 bg-border/60" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => createDocument(t.id)}
                  className="flex flex-col items-start gap-2.5 rounded-[10px] border border-border/60 bg-card p-3.5 text-left transition-colors duration-150 hover:bg-foreground/[0.025]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.04]">
                    <Icon className="h-4 w-4 text-ink-2" strokeWidth={1.7} />
                  </span>
                  <span>
                    <span className="block text-[11.5px] font-medium leading-tight text-foreground">{t.label}</span>
                    <span className="mt-0.5 block text-[10.5px] leading-tight text-muted-foreground">{t.description}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Batch action bar */}
        {selectedIds.size > 0 && (
          <div className="pb-2">
            <div className="flex items-center gap-1.5 overflow-x-auto rounded-[10px] border border-border/60 bg-card px-3 py-1.5">
              <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-ink-2">{selectedIds.size} selected</span>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" className="h-7 shrink-0 rounded-lg text-[11px]" onClick={selectAll}>
                {selectedIds.size === filtered.length ? 'Deselect all' : 'Select all'}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 shrink-0 gap-1 rounded-lg text-[11px]" onClick={() => batchStar(true)}>
                <Star className="h-3 w-3" /> Star
              </Button>
              <Button variant="ghost" size="sm" className="h-7 shrink-0 gap-1 rounded-lg text-[11px]" onClick={() => batchStar(false)}>
                <StarOff className="h-3 w-3" /> Unstar
              </Button>
              <Button variant="ghost" size="sm" className="h-7 shrink-0 gap-1 rounded-lg text-[11px] text-risk hover:text-risk" onClick={batchDelete}>
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
              <Button variant="ghost" size="sm" className="h-7 shrink-0 rounded-lg text-[11px]" onClick={() => setSelectedIds(new Set())}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Search and controls */}
        <div className="flex items-center gap-2 pb-4">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search documents"
              className={cn(FIELD, 'h-8 pl-9 text-xs')}
            />
          </div>
          <Select value={sortBy} onValueChange={v => setSortBy(v as SortBy)}>
            <SelectTrigger className="h-8 w-[130px] rounded-lg border-border/60 bg-card text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-[10px]">
              <SelectItem value="updated" className="text-xs">Last modified</SelectItem>
              <SelectItem value="created" className="text-xs">Date created</SelectItem>
              <SelectItem value="title" className="text-xs">Title</SelectItem>
              <SelectItem value="words" className="text-xs">Word count</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" aria-label="Reverse sort order" className="h-8 w-8 rounded-lg" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}>
            {sortDir === 'desc' ? <SortDesc className="h-3.5 w-3.5" /> : <SortAsc className="h-3.5 w-3.5" />}
          </Button>
          <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" aria-label="Grid view" className="h-7 w-7 rounded-md" onClick={() => setViewMode('grid')}>
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" aria-label="List view" className="h-7 w-7 rounded-md" onClick={() => setViewMode('list')}>
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Documents */}
        <div className="flex-1 pb-6 sm:pb-8">
          {loading ? (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-hidden>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
                  <div className="aspect-[3/4] animate-pulse bg-foreground/[0.04]" />
                  <div className="space-y-1.5 border-t border-border/60 p-3">
                    <div className="h-2.5 w-3/4 animate-pulse rounded bg-foreground/[0.06]" />
                    <div className="h-2 w-1/2 animate-pulse rounded bg-foreground/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              title={search.trim() ? 'No matching documents' : 'No documents yet'}
              body={search.trim() ? 'Try a different search.' : 'Create your first document to start writing.'}
              action={search.trim() ? undefined : { label: 'New document', onClick: () => createDocument('blank') }}
            />
          ) : (
            <div className="space-y-7">
              {starred.length > 0 && (
                <div>
                  <h2 className="mb-2.5 flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    <Star className="h-3 w-3 fill-gold text-gold" /> Starred
                  </h2>
                  <DocGrid docs={starred} viewMode={viewMode} onOpen={id => navigate(`/lounge/office/word/${id}`)} onStar={toggleStar} onDelete={setDeleteId} onDuplicate={duplicateDocument} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
                </div>
              )}
              <div>
                {starred.length > 0 && (
                  <h2 className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Recent
                  </h2>
                )}
                <DocGrid docs={recent} viewMode={viewMode} onOpen={id => navigate(`/lounge/office/word/${id}`)} onStar={toggleStar} onDelete={setDeleteId} onDuplicate={duplicateDocument} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="max-w-sm rounded-[10px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete this document?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">This cannot be undone. The document will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 rounded-lg text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteDocument} className="h-8 rounded-lg bg-destructive text-destructive-foreground text-xs">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DocGrid({ docs, viewMode, onOpen, onStar, onDelete, onDuplicate, selectedIds, onToggleSelect }: {
  docs: OfficeDocument[];
  viewMode: 'grid' | 'list';
  onOpen: (id: string) => void;
  onStar: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
  onDuplicate: (doc: OfficeDocument) => void;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  if (viewMode === 'list') {
    return (
      <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
        {docs.map((doc, i) => (
          <div
            key={doc.id}
            onClick={() => onOpen(doc.id)}
            className={cn(
              'group flex h-10 cursor-pointer items-center gap-3 px-3.5 transition-colors duration-150 hover:bg-foreground/[0.025]',
              i > 0 && 'border-t border-border/60',
              selectedIds.has(doc.id) && 'bg-primary/[0.05]',
            )}
          >
            <button
              type="button"
              aria-label="Select document"
              onClick={(e) => { e.stopPropagation(); onToggleSelect(doc.id); }}
              className={cn(
                'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors duration-150',
                selectedIds.has(doc.id) ? 'border-primary bg-primary' : 'border-border opacity-0 group-hover:opacity-100'
              )}
            >
              {selectedIds.has(doc.id) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </button>
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
              <FileText className="h-3.5 w-3.5 text-ink-2" />
            </span>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-[450] text-foreground">{doc.title}</span>
            </div>
            <span className="hidden shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground sm:inline">
              {doc.word_count.toLocaleString()} words
            </span>
            <RelativeTime date={doc.updated_at} className="shrink-0" />
            <div className="flex items-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onStar(doc.id, doc.is_starred)}>
                {doc.is_starred ? <Star className="h-3.5 w-3.5 fill-gold text-gold" /> : <StarOff className="h-3.5 w-3.5" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-[10px]">
                  <DropdownMenuItem onClick={() => onOpen(doc.id)} className="text-xs"><Pencil className="mr-2 h-3 w-3" /> Open</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(doc)} className="text-xs"><Copy className="mr-2 h-3 w-3" /> Duplicate</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(doc.id)} className="text-xs text-destructive focus:text-destructive"><Trash2 className="mr-2 h-3 w-3" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {docs.map((doc) => (
        <div
          key={doc.id}
          onClick={() => onOpen(doc.id)}
          className="group cursor-pointer overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:border-border"
        >
          {/* Page preview */}
          <div className="relative flex aspect-[3/4] flex-col bg-sunken/50 p-5">
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/3 rounded-sm bg-foreground/[0.08]" />
              <div className="mt-3 h-1.5 w-full rounded-sm bg-foreground/[0.05]" />
              <div className="h-1.5 w-full rounded-sm bg-foreground/[0.05]" />
              <div className="h-1.5 w-4/5 rounded-sm bg-foreground/[0.05]" />
              <div className="mt-3 h-1.5 w-full rounded-sm bg-foreground/[0.05]" />
              <div className="h-1.5 w-full rounded-sm bg-foreground/[0.05]" />
              <div className="h-1.5 w-3/4 rounded-sm bg-foreground/[0.05]" />
              <div className="mt-3 h-1.5 w-full rounded-sm bg-foreground/[0.05]" />
              <div className="h-1.5 w-5/6 rounded-sm bg-foreground/[0.05]" />
            </div>

            {/* Hover actions */}
            <div className="absolute right-2.5 top-2.5 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
              <Button variant="secondary" size="icon" className="h-7 w-7 rounded-lg border border-border/60 bg-card" onClick={() => onStar(doc.id, doc.is_starred)}>
                {doc.is_starred ? <Star className="h-3.5 w-3.5 fill-gold text-gold" /> : <StarOff className="h-3.5 w-3.5" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-7 w-7 rounded-lg border border-border/60 bg-card">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40 rounded-[10px]">
                  <DropdownMenuItem onClick={() => onOpen(doc.id)} className="text-xs"><Pencil className="mr-2 h-3 w-3" /> Open</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(doc)} className="text-xs"><Copy className="mr-2 h-3 w-3" /> Duplicate</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(doc.id)} className="text-xs text-destructive focus:text-destructive"><Trash2 className="mr-2 h-3 w-3" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Caption */}
          <div className="border-t border-border/60 p-3">
            <span className="block truncate text-[12px] font-medium leading-tight text-foreground">{doc.title}</span>
            <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] tabular-nums text-muted-foreground">
              <span>{doc.word_count.toLocaleString()} words</span>
              <span aria-hidden>·</span>
              <RelativeTime date={doc.updated_at} className="font-mono text-[10px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
