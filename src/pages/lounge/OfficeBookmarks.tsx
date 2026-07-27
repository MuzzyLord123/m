import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Plus, Trash2, ExternalLink, Search, Tag, Star, Grid3X3, List, Globe, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface BookmarkItem { id: string; title: string; url: string; category: string; favicon: string; isStarred: boolean; createdAt: Date; }

const CATEGORIES = ['All', 'Work', 'Development', 'Design', 'Research', 'Personal'];
const CATEGORY_COLORS: Record<string, string> = { Work: '#3b82f6', Development: '#10b981', Design: '#8b5cf6', Research: '#f59e0b', Personal: '#ec4899' };

export default function OfficeBookmarks() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([
    { id: '1', title: 'GitHub', url: 'https://github.com', category: 'Development', favicon: '🐙', isStarred: true, createdAt: new Date() },
    { id: '2', title: 'Figma', url: 'https://figma.com', category: 'Design', favicon: '🎨', isStarred: true, createdAt: new Date() },
    { id: '3', title: 'MDN Web Docs', url: 'https://developer.mozilla.org', category: 'Development', favicon: '📚', isStarred: false, createdAt: new Date() },
    { id: '4', title: 'Google Analytics', url: 'https://analytics.google.com', category: 'Work', favicon: '📊', isStarred: false, createdAt: new Date() },
    { id: '5', title: 'Stack Overflow', url: 'https://stackoverflow.com', category: 'Development', favicon: '💡', isStarred: true, createdAt: new Date() },
    { id: '6', title: 'Dribbble', url: 'https://dribbble.com', category: 'Design', favicon: '🏀', isStarred: false, createdAt: new Date() },
    { id: '7', title: 'Notion', url: 'https://notion.so', category: 'Work', favicon: '📝', isStarred: false, createdAt: new Date() },
    { id: '8', title: 'ArXiv Papers', url: 'https://arxiv.org', category: 'Research', favicon: '🔬', isStarred: false, createdAt: new Date() },
  ]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newCategory, setNewCategory] = useState('Work');

  const addBookmark = () => {
    if (!newTitle.trim() || !newUrl.trim()) { toast.error('Fill in title and URL'); return; }
    const bm: BookmarkItem = { id: Date.now().toString(), title: newTitle, url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`, category: newCategory, favicon: '🔗', isStarred: false, createdAt: new Date() };
    setBookmarks(prev => [bm, ...prev]);
    setNewTitle(''); setNewUrl(''); setShowAdd(false);
    toast.success('Bookmark added');
  };

  const toggleStar = (id: string) => setBookmarks(prev => prev.map(b => b.id === id ? { ...b, isStarred: !b.isStarred } : b));
  const deleteBm = (id: string) => { setBookmarks(prev => prev.filter(b => b.id !== id)); toast.success('Deleted'); };

  const filtered = bookmarks
    .filter(b => activeCategory === 'All' || b.category === activeCategory)
    .filter(b => b.title.toLowerCase().includes(search.toLowerCase()) || b.url.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <header className="h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3 shrink-0">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <Bookmark className="h-4 w-4 text-amber-500 shrink-0" />
        <span className="text-sm font-semibold tracking-tight">Bookmarks</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-xl shrink-0">
          <button onClick={() => setViewMode('grid')} className={cn("h-7 w-7 rounded-lg flex items-center justify-center", viewMode === 'grid' ? "bg-background shadow-sm" : "")}>
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => setViewMode('list')} className={cn("h-7 w-7 rounded-lg flex items-center justify-center", viewMode === 'list' ? "bg-background shadow-sm" : "")}>
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs shrink-0" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add</span><span className="sm:hidden">Add</span>
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight mb-1">Bookmarks</h1>
          <p className="text-sm text-muted-foreground/60 mb-5">Organize your important links in one place.</p>

          {/* Add form */}
          <AnimatePresence>
            {showAdd && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="mb-5 p-4 sm:p-5 rounded-2xl bg-card/50 border border-border/20 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" className="h-11 rounded-xl text-sm" />
                  <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL (e.g. example.com)" className="h-11 rounded-xl text-sm" />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {CATEGORIES.filter(c => c !== 'All').map(cat => (
                    <button key={cat} onClick={() => setNewCategory(cat)}
                      className={cn("px-3 py-2 rounded-lg text-[11px] font-medium border transition-all min-h-[36px]",
                        newCategory === cat ? "border-primary bg-primary/10 text-foreground" : "border-border/20 text-muted-foreground/60 hover:text-foreground")}>
                      {cat}
                    </button>
                  ))}
                  <div className="flex-1" />
                  <Button size="sm" className="h-9 rounded-xl text-xs gap-1" onClick={addBookmark}><Check className="h-3 w-3" /> Save</Button>
                  <Button variant="ghost" size="sm" className="h-9 rounded-xl text-xs" onClick={() => setShowAdd(false)}><X className="h-3 w-3" /></Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search — full width on mobile */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookmarks…" className="pl-9 h-9 rounded-xl bg-card/50 border-border/30 text-sm w-full" />
            </div>
          </div>

          {/* Category tabs — scrollable */}
          <div className="flex items-center gap-1.5 mb-5 overflow-x-auto scrollbar-none pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={cn("px-3 py-2 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all min-h-[34px]",
                  activeCategory === cat ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted/40 text-muted-foreground/60 hover:text-foreground")}>
                {cat} {cat !== 'All' && <span className="ml-1 opacity-50">({bookmarks.filter(b => b.category === cat).length})</span>}
              </button>
            ))}
          </div>

          {filtered.length === 0 && <p className="text-sm text-muted-foreground/40 py-12 text-center">No bookmarks found.</p>}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(bm => (
                <motion.div key={bm.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="group relative p-4 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => window.open(bm.url, '_blank')}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{bm.favicon}</span>
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-semibold text-foreground block truncate">{bm.title}</span>
                      <span className="text-[10px] text-muted-foreground/40 truncate block">{bm.url.replace(/^https?:\/\//, '')}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${CATEGORY_COLORS[bm.category] || '#666'}15`, color: CATEGORY_COLORS[bm.category] || '#666' }}>
                    {bm.category}
                  </span>
                  {/* Actions: always visible on mobile, hover-only on desktop */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); toggleStar(bm.id); }} className="h-7 w-7 rounded-md bg-background/80 flex items-center justify-center">
                      <Star className={cn("h-3 w-3", bm.isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteBm(bm.id); }} className="h-7 w-7 rounded-md bg-background/80 flex items-center justify-center hover:bg-destructive/20">
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map(bm => (
                <motion.div key={bm.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl bg-card/40 border border-border/15 hover:border-border/30 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => window.open(bm.url, '_blank')}>
                  <span className="text-lg shrink-0">{bm.favicon}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-semibold text-foreground block truncate">{bm.title}</span>
                    <span className="text-[10px] text-muted-foreground/40 truncate block">{bm.url.replace(/^https?:\/\//, '')}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 hidden sm:inline" style={{ background: `${CATEGORY_COLORS[bm.category] || '#666'}15`, color: CATEGORY_COLORS[bm.category] || '#666' }}>
                    {bm.category}
                  </span>
                  {/* Always show actions on mobile */}
                  <div className="flex gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); toggleStar(bm.id); }} className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center">
                      <Star className={cn("h-3.5 w-3.5", bm.isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteBm(bm.id); }} className="h-8 w-8 rounded-lg hover:bg-destructive/20 flex items-center justify-center">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/30 self-center hidden sm:block" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
