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
  FileSignature, FileBarChart, Mail, StickyNote, Users, Briefcase,
  Clock, LetterText, Sparkles, FolderOpen, Check
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

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
  { id: 'blank', label: 'Blank Document', description: 'Start with a clean slate', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20', gradient: 'from-blue-500/8 to-blue-600/3' },
  { id: 'report', label: 'Business Report', description: 'Professional report layout', icon: FileBarChart, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', gradient: 'from-emerald-500/8 to-emerald-600/3' },
  { id: 'proposal', label: 'Project Proposal', description: 'Win new business', icon: Briefcase, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20', gradient: 'from-violet-500/8 to-violet-600/3' },
  { id: 'letter', label: 'Formal Letter', description: 'Professional correspondence', icon: Mail, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', gradient: 'from-amber-500/8 to-amber-600/3' },
  { id: 'memo', label: 'Internal Memo', description: 'Team communications', icon: StickyNote, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', gradient: 'from-rose-500/8 to-rose-600/3' },
  { id: 'meeting', label: 'Meeting Notes', description: 'Capture key decisions', icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', gradient: 'from-cyan-500/8 to-cyan-600/3' },
  { id: 'contract', label: 'Contract Draft', description: 'Legal document template', icon: FileSignature, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20', gradient: 'from-orange-500/8 to-orange-600/3' },
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
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/8 via-indigo-500/5 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
        
        <div className="relative px-4 sm:px-8 pt-5 sm:pt-7 pb-4 sm:pb-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3.5">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-card/80" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="h-11 w-11 rounded-[14px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-600/25">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Documents</h1>
                  <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Create, edit, and manage your documents</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={() => createDocument('blank')} className="gap-2 h-9 rounded-xl text-xs shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all">
                  <Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline"> New Document</span>
                </Button>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex flex-wrap items-center gap-2">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card/70 backdrop-blur-sm border border-border/30">
                <FolderOpen className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[11px] font-semibold text-foreground">{documents.length}</span>
                <span className="text-[10px] text-muted-foreground">documents</span>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card/70 backdrop-blur-sm border border-border/30">
                <LetterText className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] font-semibold text-foreground">{totalWords.toLocaleString()}</span>
                <span className="text-[10px] text-muted-foreground">total words</span>
              </motion.div>
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card/70 backdrop-blur-sm border border-border/30">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[11px] font-semibold text-foreground">{starred.length}</span>
                <span className="text-[10px] text-muted-foreground">starred</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Templates Section */}
      <div className="px-4 sm:px-8 pb-4 sm:pb-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-primary/60" />
          <h2 className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.14em]">Start from template</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {TEMPLATES.map((t, i) => {
            const Icon = t.icon;
            return (
              <motion.button 
                key={t.id} 
                initial={{ opacity: 0, y: 6 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.035 }}
                onClick={() => createDocument(t.id)}
                className={cn(
                  "flex flex-col items-center gap-2.5 p-4 rounded-xl border bg-gradient-to-b hover:shadow-lg transition-all duration-250 hover:-translate-y-1 group cursor-pointer",
                  t.border, t.gradient
                )}
              >
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110", t.bg)}>
                  <Icon className={cn("h-5 w-5", t.color)} />
                </div>
                <div className="text-center">
                  <span className="text-[10px] font-semibold text-foreground block leading-tight">{t.label}</span>
                  <span className="text-[8px] text-muted-foreground/60 leading-tight mt-0.5 block">{t.description}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Batch Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="px-4 sm:px-8 pb-2"
          >
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/5 border border-primary/20 overflow-x-auto">
              <span className="text-[11px] font-semibold text-primary">{selectedIds.size} selected</span>
              <div className="flex-1" />
              <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg gap-1" onClick={selectAll}>
                {selectedIds.size === filtered.length ? 'Deselect All' : 'Select All'}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg gap-1" onClick={() => batchStar(true)}>
                <Star className="h-3 w-3" /> Star
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg gap-1" onClick={() => batchStar(false)}>
                <StarOff className="h-3 w-3" /> Unstar
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg gap-1 text-destructive hover:text-destructive" onClick={batchDelete}>
                <Trash2 className="h-3 w-3" /> Delete
              </Button>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg" onClick={() => setSelectedIds(new Set())}>
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search & Controls */}
      <div className="px-4 sm:px-8 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
            <Input 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              placeholder="Search documents…" 
              className="pl-9 h-8 text-xs bg-card/60 border-border/40 rounded-xl focus:ring-blue-500/20" 
            />
          </div>
          <Select value={sortBy} onValueChange={v => setSortBy(v as SortBy)}>
            <SelectTrigger className="h-8 w-[130px] text-[10px] border-border/40 rounded-xl bg-card/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="updated" className="text-[10px]">Last modified</SelectItem>
              <SelectItem value="created" className="text-[10px]">Date created</SelectItem>
              <SelectItem value="title" className="text-[10px]">Title</SelectItem>
              <SelectItem value="words" className="text-[10px]">Word count</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setSortDir(d => d === 'desc' ? 'asc' : 'desc')}>
            {sortDir === 'desc' ? <SortDesc className="h-3.5 w-3.5" /> : <SortAsc className="h-3.5 w-3.5" />}
          </Button>
          <div className="flex items-center gap-0.5 border border-border/40 rounded-xl p-0.5 bg-card/40">
            <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg" onClick={() => setViewMode('grid')}>
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg" onClick={() => setViewMode('list')}>
              <List className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="px-4 sm:px-8 pb-6 sm:pb-8 flex-1">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="rounded-xl overflow-hidden">
                <div className="aspect-[3/4] bg-secondary/20 animate-pulse rounded-xl" />
                <div className="pt-2.5 space-y-1.5">
                  <div className="h-3 w-3/4 bg-secondary/20 rounded animate-pulse" />
                  <div className="h-2 w-1/2 bg-secondary/15 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 flex items-center justify-center mb-5 border border-blue-500/10">
              <FileText className="h-10 w-10 text-blue-500/30" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1.5">No documents yet</h3>
            <p className="text-xs text-muted-foreground mb-5 max-w-xs">Create your first document to get started with writing, reports, and more</p>
            <Button onClick={() => createDocument('blank')} className="gap-2 rounded-xl h-9 text-xs shadow-md">
              <Plus className="h-3.5 w-3.5" /> Create Document
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {starred.length > 0 && (
              <div>
                <h2 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Starred
                </h2>
                <DocGrid docs={starred} viewMode={viewMode} onOpen={id => navigate(`/lounge/office/word/${id}`)} onStar={toggleStar} onDelete={setDeleteId} onDuplicate={duplicateDocument} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
              </div>
            )}
            <div>
              {starred.length > 0 && (
                <h2 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground/50" /> Recent
                </h2>
              )}
              <DocGrid docs={recent} viewMode={viewMode} onOpen={id => navigate(`/lounge/office/word/${id}`)} onStar={toggleStar} onDelete={setDeleteId} onDuplicate={duplicateDocument} selectedIds={selectedIds} onToggleSelect={toggleSelect} />
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Delete this document?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">This action cannot be undone. The document will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl h-8 text-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteDocument} className="bg-destructive text-destructive-foreground rounded-xl h-8 text-xs">Delete</AlertDialogAction>
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
      <div className="rounded-xl border border-border/40 overflow-hidden bg-card/50 backdrop-blur-sm">
        {docs.map((doc, i) => (
          <motion.div 
            key={doc.id} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: i * 0.02 }}
            onClick={() => onOpen(doc.id)} 
            className={cn(
              "flex items-center gap-3.5 px-4 py-3 hover:bg-accent/40 cursor-pointer group transition-all duration-150",
              i > 0 && "border-t border-border/20",
              selectedIds.has(doc.id) && "bg-primary/5"
            )}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onToggleSelect(doc.id); }}
              className={cn(
                "h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center transition-all",
                selectedIds.has(doc.id) ? "bg-primary border-primary" : "border-border/40 opacity-0 group-hover:opacity-100"
              )}
            >
              {selectedIds.has(doc.id) && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
            </button>
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 flex items-center justify-center shrink-0 border border-blue-500/10">
              <FileText className="h-4 w-4 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold truncate text-foreground block">{doc.title}</span>
              <span className="text-[9px] text-muted-foreground/60">
                {doc.word_count.toLocaleString()} words · Edited {formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}
              </span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onStar(doc.id, doc.is_starred)}>
                {doc.is_starred ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : <StarOff className="h-3.5 w-3.5" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl w-40">
                  <DropdownMenuItem onClick={() => onOpen(doc.id)} className="text-xs"><Pencil className="h-3 w-3 mr-2" /> Open</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(doc)} className="text-xs"><Copy className="h-3 w-3 mr-2" /> Duplicate</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(doc.id)} className="text-xs text-destructive focus:text-destructive"><Trash2 className="h-3 w-3 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {docs.map((doc, i) => (
        <motion.div 
          key={doc.id} 
          initial={{ opacity: 0, y: 6 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: i * 0.03 }}
          onClick={() => onOpen(doc.id)} 
          className="group cursor-pointer rounded-xl border border-border/40 bg-card/60 overflow-hidden hover:shadow-xl hover:border-border/60 hover:-translate-y-1 transition-all duration-250"
        >
          {/* Document Preview */}
          <div className="aspect-[3/4] bg-gradient-to-b from-card via-card to-secondary/15 relative p-5 flex flex-col">
            {/* Mock content lines */}
            <div className="space-y-2 flex-1">
              <div className="h-3 w-2/3 rounded-sm bg-foreground/8" />
              <div className="h-1.5 w-full rounded-sm bg-foreground/5 mt-3" />
              <div className="h-1.5 w-full rounded-sm bg-foreground/5" />
              <div className="h-1.5 w-4/5 rounded-sm bg-foreground/5" />
              <div className="h-1.5 w-full rounded-sm bg-foreground/5 mt-3" />
              <div className="h-1.5 w-full rounded-sm bg-foreground/5" />
              <div className="h-1.5 w-3/4 rounded-sm bg-foreground/5" />
              <div className="h-1.5 w-full rounded-sm bg-foreground/5 mt-3" />
              <div className="h-1.5 w-5/6 rounded-sm bg-foreground/5" />
            </div>
            
            {/* Hover actions */}
            <div className="absolute top-2.5 right-2.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200" onClick={e => e.stopPropagation()}>
              <Button variant="secondary" size="icon" className="h-7 w-7 rounded-lg bg-card/95 shadow-md border border-border/40 backdrop-blur-sm" onClick={() => onStar(doc.id, doc.is_starred)}>
                {doc.is_starred ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : <StarOff className="h-3.5 w-3.5" />}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="h-7 w-7 rounded-lg bg-card/95 shadow-md border border-border/40 backdrop-blur-sm">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl w-40">
                  <DropdownMenuItem onClick={() => onOpen(doc.id)} className="text-xs"><Pencil className="h-3 w-3 mr-2" /> Open</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(doc)} className="text-xs"><Copy className="h-3 w-3 mr-2" /> Duplicate</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(doc.id)} className="text-xs text-destructive focus:text-destructive"><Trash2 className="h-3 w-3 mr-2" /> Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Blue accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500/0 via-blue-500/40 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          
          {/* Doc Info */}
          <div className="p-3 border-t border-border/20">
            <span className="text-[11px] font-semibold text-foreground block truncate leading-tight">{doc.title}</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] text-muted-foreground/50">{doc.word_count.toLocaleString()} words</span>
              <span className="text-[9px] text-muted-foreground/30">·</span>
              <span className="text-[9px] text-muted-foreground/50">{formatDistanceToNow(new Date(doc.updated_at), { addSuffix: true })}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
