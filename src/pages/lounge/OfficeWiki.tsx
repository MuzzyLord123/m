import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Plus, Trash2, Search, ChevronRight, FileText, Star, Clock, Tag, Edit2, Check, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface WikiPage {
  id: string; title: string; content: string; category: string; tags: string[]; isStarred: boolean;
  lastEditedBy: string; updatedAt: Date; createdAt: Date; status: 'published' | 'draft';
}

const CATEGORIES = ['All', 'Processes', 'Engineering', 'Design', 'Marketing', 'Onboarding', 'Policies'];
const CAT_COLORS: Record<string, string> = { Processes: '#3b82f6', Engineering: '#10b981', Design: '#8b5cf6', Marketing: '#ec4899', Onboarding: '#f59e0b', Policies: '#06b6d4' };

export default function OfficeWiki() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [pages, setPages] = useState<WikiPage[]>([]);
  const [editContent, setEditContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Processes');

  const fetchPages = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from('wiki_pages').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
    if (data) {
      setPages(data.map((p: any) => ({
        id: p.id, title: p.title, content: p.content || '', category: p.category,
        tags: p.tags || [], isStarred: p.is_starred || false, lastEditedBy: p.last_edited_by || 'You',
        updatedAt: new Date(p.updated_at), createdAt: new Date(p.created_at), status: p.status as 'published' | 'draft',
      })));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const createPage = async () => {
    if (!user || !newTitle.trim()) { toast.error('Enter a title'); return; }
    const { data, error } = await supabase.from('wiki_pages').insert({
      user_id: user.id, title: newTitle, category: newCategory, content: `# ${newTitle}\n\nStart writing here...`,
      last_edited_by: 'You', status: 'published',
    } as any).select().single();
    if (error) { toast.error('Failed to create page'); return; }
    const page: WikiPage = {
      id: data.id, title: newTitle, content: `# ${newTitle}\n\nStart writing here...`, category: newCategory,
      tags: [], isStarred: false, lastEditedBy: 'You', updatedAt: new Date(), createdAt: new Date(), status: 'published',
    };
    setPages(p => [page, ...p]);
    setNewTitle(''); setShowCreate(false);
    setSelectedPage(data.id); setEditing(true); setEditContent(page.content);
    toast.success('Page created');
  };

  const toggleStar = async (id: string) => {
    const page = pages.find(p => p.id === id);
    if (!page) return;
    await supabase.from('wiki_pages').update({ is_starred: !page.isStarred } as any).eq('id', id);
    setPages(p => p.map(pg => pg.id === id ? { ...pg, isStarred: !pg.isStarred } : pg));
  };

  const startEdit = () => { const p = pages.find(pg => pg.id === selectedPage); if (p) { setEditContent(p.content); setEditing(true); } };

  const saveEdit = async () => {
    if (!selectedPage) return;
    const { error } = await supabase.from('wiki_pages').update({ content: editContent, updated_at: new Date().toISOString() } as any).eq('id', selectedPage);
    if (error) { toast.error('Failed to save'); return; }
    setPages(p => p.map(pg => pg.id === selectedPage ? { ...pg, content: editContent, updatedAt: new Date() } : pg));
    setEditing(false);
    toast.success('Saved');
  };

  const deletePage = async (id: string) => {
    await supabase.from('wiki_pages').delete().eq('id', id);
    setPages(p => p.filter(pg => pg.id !== id));
    if (selectedPage === id) { setSelectedPage(null); setEditing(false); }
    toast.success('Page deleted');
  };

  const filtered = pages
    .filter(p => activeCategory === 'All' || p.category === activeCategory)
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  const currentPage = pages.find(p => p.id === selectedPage);

  if (selectedPage && currentPage) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
        <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3">
          <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => { setSelectedPage(null); setEditing(false); }}>
            <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Back</span>
          </Button>
          <div className="h-4 w-px bg-border/40" />
          <span className="text-sm font-semibold tracking-tight truncate">{currentPage.title}</span>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive" onClick={() => deletePage(currentPage.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          {editing ? (
            <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={saveEdit}><Check className="h-3 w-3" /> Save</Button>
          ) : (
            <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={startEdit}><Edit2 className="h-3 w-3" /> Edit</Button>
          )}
        </header>
        <div className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-6 sm:px-10 py-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${CAT_COLORS[currentPage.category] || '#666'}15`, color: CAT_COLORS[currentPage.category] || '#666' }}>
                {currentPage.category}
              </span>
              {currentPage.tags.map(tag => <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground/50">{tag}</span>)}
              <span className="text-[10px] text-muted-foreground/40 ml-auto">Edited by {currentPage.lastEditedBy}</span>
            </div>
            {editing ? (
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)}
                className="w-full min-h-[500px] bg-card/30 border border-border/20 rounded-2xl p-6 text-sm font-mono text-foreground resize-none outline-none focus:border-border/40" />
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {currentPage.content.split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-foreground mb-4">{line.slice(2)}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold text-foreground mt-6 mb-3">{line.slice(3)}</h2>;
                  if (line.startsWith('- [ ] ')) return <div key={i} className="flex items-center gap-2 py-1"><span className="h-4 w-4 rounded border border-border/40" /><span className="text-sm text-foreground">{line.slice(6)}</span></div>;
                  if (line.startsWith('- ')) return <div key={i} className="flex items-start gap-2 py-0.5 pl-2"><span className="text-muted-foreground/40 mt-1.5">•</span><span className="text-sm text-foreground">{line.slice(2)}</span></div>;
                  if (line.match(/^\d+\./)) return <div key={i} className="text-sm text-foreground py-0.5 pl-2">{line}</div>;
                  if (line.trim() === '') return <div key={i} className="h-3" />;
                  return <p key={i} className="text-sm text-foreground py-0.5">{line}</p>;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" /><span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <BookOpen className="h-4 w-4 text-violet-500" />
        <span className="text-sm font-semibold tracking-tight">Knowledge Base</span>
        <div className="flex-1" />
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5" /> New Page
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-4">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Knowledge Base</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Internal documentation, SOPs, and team wiki.</p>
          </motion.div>

          <div className="flex items-center gap-3 mb-4">
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search articles…" className="w-full sm:max-w-xs h-9 rounded-xl bg-card/50 border-border/30 text-sm" />
          </div>

          <div className="flex items-center gap-1.5 mb-6 overflow-x-auto scrollbar-none">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={cn("px-3 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all",
                  activeCategory === cat ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/40 text-muted-foreground/60 hover:text-foreground")}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-16 text-center text-muted-foreground/40 text-sm">Loading…</div>
          ) : (
            <>
              {/* Starred */}
              {filtered.filter(p => p.isStarred).length > 0 && (
                <section className="mb-6">
                  <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Star className="h-3 w-3" /> Pinned</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filtered.filter(p => p.isStarred).map(page => (
                      <motion.button key={page.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setSelectedPage(page.id)}
                        className="group p-5 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all text-left">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4" style={{ color: CAT_COLORS[page.category] || '#666' }} />
                          <span className="text-[12px] font-semibold text-foreground truncate">{page.title}</span>
                          <button onClick={e => { e.stopPropagation(); toggleStar(page.id); }} className="ml-auto">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                          </button>
                        </div>
                        <span className="text-[10px] text-muted-foreground/40 line-clamp-2">{page.content.slice(0, 100)}…</span>
                      </motion.button>
                    ))}
                  </div>
                </section>
              )}

              {/* All articles */}
              <section className="pb-10">
                <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-3">All Articles</h2>
                {filtered.length === 0 ? (
                  <div className="py-16 text-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/15 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground/40">No wiki pages yet</p>
                    <p className="text-xs text-muted-foreground/30 mt-1">Click "New Page" to create your first article</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map(page => (
                      <motion.button key={page.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setSelectedPage(page.id)}
                        className="w-full group flex items-center gap-4 p-4 rounded-xl bg-card/40 border border-border/15 hover:border-border/30 hover:shadow-md transition-all text-left">
                        <FileText className="h-5 w-5 shrink-0" style={{ color: CAT_COLORS[page.category] || '#666' }} />
                        <div className="flex-1 min-w-0">
                          <span className="text-[12px] font-semibold text-foreground block truncate">{page.title}</span>
                          <span className="text-[10px] text-muted-foreground/45">{page.category} · Updated {page.updatedAt.toLocaleDateString()}</span>
                        </div>
                        <button onClick={e => { e.stopPropagation(); toggleStar(page.id); }} className="shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <Star className={cn("h-3.5 w-3.5", page.isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30")} />
                        </button>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-muted-foreground/40 shrink-0" />
                      </motion.button>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>

      {/* Create page modal */}
      <AnimatePresence>
        {showCreate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[61] flex items-center justify-center p-4">
              <div className="bg-background rounded-2xl border border-border/30 shadow-2xl max-w-md w-full p-6 space-y-4">
                <h2 className="text-lg font-bold text-foreground">New Wiki Page</h2>
                <Input placeholder="Page title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="h-10 rounded-xl" />
                <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm">
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex gap-2">
                  <Button className="flex-1 h-10 rounded-xl" onClick={createPage}>Create</Button>
                  <Button variant="ghost" className="h-10 rounded-xl" onClick={() => setShowCreate(false)}>Cancel</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
