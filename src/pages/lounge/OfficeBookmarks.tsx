import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bookmark, Plus, Trash2, ExternalLink, Search, Star, Grid3X3, List, Globe, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EmptyState, FIELD } from '@/components/platform';

interface BookmarkItem { id: string; title: string; url: string; category: string; favicon: string; isStarred: boolean; createdAt: Date; }

const CATEGORIES = ['All', 'Work', 'Development', 'Design', 'Research', 'Personal'];

/** Neutral initial mark: first letter of the title in a tonal well. */
function InitialMark({ title, size = 'md' }: { title: string; size?: 'sm' | 'md' }) {
  const letter = (title || '').trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04] font-medium text-ink-2',
        size === 'md' ? 'h-9 w-9 text-[13px]' : 'h-8 w-8 text-[12px]',
      )}
    >
      {letter || <Globe className="h-3.5 w-3.5" />}
    </span>
  );
}

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
      <header className="flex h-[52px] shrink-0 items-center gap-2 border-b border-border/60 bg-card px-3 sm:gap-3 sm:px-5">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-lg text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/60" />
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
          <Bookmark className="h-3.5 w-3.5 text-ink-2" strokeWidth={1.7} />
        </span>
        <span className="text-sm font-semibold tracking-tight">Bookmarks</span>
        <div className="flex-1" />
        <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-border/60 bg-card p-0.5">
          <button aria-label="Grid view" onClick={() => setViewMode('grid')} className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150', viewMode === 'grid' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground')}>
            <Grid3X3 className="h-3.5 w-3.5" />
          </button>
          <button aria-label="List view" onClick={() => setViewMode('list')} className={cn('flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150', viewMode === 'list' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground')}>
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
        <Button size="sm" className="h-8 shrink-0 gap-1.5 rounded-lg px-3 text-xs" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <span className="mb-1 block font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Quooro Office · Bookmarks</span>
          <h1 className="mb-0.5 text-[17px] font-semibold tracking-[-0.015em] text-foreground">Bookmarks</h1>
          <p className="mb-5 text-[13px] text-muted-foreground">Organise your important links in one place.</p>

          {/* Add form */}
          {showAdd && (
            <div className="mb-5 space-y-3 rounded-[10px] border border-border/60 bg-card p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" className="h-10 rounded-lg border-border/60 text-sm" />
                <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="URL (e.g. example.com)" className="h-10 rounded-lg border-border/60 text-sm" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {CATEGORIES.filter(c => c !== 'All').map(cat => (
                  <button key={cat} onClick={() => setNewCategory(cat)}
                    className={cn('min-h-[36px] rounded-lg border px-3 py-2 text-[11px] font-medium transition-colors duration-150',
                      newCategory === cat ? 'border-primary bg-primary/10 text-foreground' : 'border-border/60 text-muted-foreground hover:text-foreground')}>
                    {cat}
                  </button>
                ))}
                <div className="flex-1" />
                <Button size="sm" className="h-9 gap-1 rounded-lg text-xs" onClick={addBookmark}><Check className="h-3 w-3" /> Save</Button>
                <Button variant="ghost" size="sm" aria-label="Cancel" className="h-9 rounded-lg text-xs" onClick={() => setShowAdd(false)}><X className="h-3 w-3" /></Button>
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-5 flex items-center gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search bookmarks" className={cn(FIELD, 'h-9 w-full pl-9 text-sm')} />
            </div>
          </div>

          {/* Category tabs */}
          <div className="scrollbar-none mb-5 flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={cn('min-h-[34px] whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-medium transition-colors duration-150',
                  activeCategory === cat ? 'bg-foreground text-background' : 'border border-border/60 bg-card text-muted-foreground hover:text-foreground')}>
                {cat} {cat !== 'All' && <span className="ml-1 font-mono text-[10px] tabular-nums opacity-60">{bookmarks.filter(b => b.category === cat).length}</span>}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <EmptyState
              compact
              title="No bookmarks found"
              body="Add a link or adjust your search."
              action={{ label: 'Add bookmark', onClick: () => setShowAdd(true) }}
            />
          )}

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map(bm => (
                <div key={bm.id}
                  className="group relative cursor-pointer rounded-[10px] border border-border/60 bg-card p-4 transition-colors duration-150 hover:border-border"
                  onClick={() => window.open(bm.url, '_blank')}>
                  <div className="mb-3 flex items-center gap-3">
                    <InitialMark title={bm.title} />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] font-medium text-foreground">{bm.title}</span>
                      <span className="block truncate font-mono text-[10px] text-muted-foreground">{bm.url.replace(/^https?:\/\//, '')}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
                    {bm.category}
                  </span>
                  {/* Actions: always visible on mobile, hover-only on desktop */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100">
                    <button aria-label={bm.isStarred ? 'Unstar' : 'Star'} onClick={e => { e.stopPropagation(); toggleStar(bm.id); }} className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card transition-colors duration-150 hover:bg-foreground/[0.04]">
                      <Star className={cn('h-3 w-3', bm.isStarred ? 'fill-gold text-gold' : 'text-muted-foreground')} />
                    </button>
                    <button aria-label="Delete" onClick={e => { e.stopPropagation(); deleteBm(bm.id); }} className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card transition-colors duration-150 hover:bg-destructive/20">
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-[10px] border border-border/60 bg-card">
              {filtered.map((bm, i) => (
                <div key={bm.id}
                  className={cn(
                    'group flex h-11 cursor-pointer items-center gap-3 px-3 transition-colors duration-150 hover:bg-foreground/[0.025] sm:gap-4 sm:px-4',
                    i > 0 && 'border-t border-border/60',
                  )}
                  onClick={() => window.open(bm.url, '_blank')}>
                  <InitialMark title={bm.title} size="sm" />
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-[450] text-foreground">{bm.title}</span>
                    <span className="block truncate font-mono text-[10px] text-muted-foreground">{bm.url.replace(/^https?:\/\//, '')}</span>
                  </div>
                  <span className="hidden shrink-0 font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-muted-foreground sm:inline">
                    {bm.category}
                  </span>
                  {/* Always show actions on mobile */}
                  <div className="flex shrink-0 gap-1 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100">
                    <button aria-label={bm.isStarred ? 'Unstar' : 'Star'} onClick={e => { e.stopPropagation(); toggleStar(bm.id); }} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-foreground/[0.04]">
                      <Star className={cn('h-3.5 w-3.5', bm.isStarred ? 'fill-gold text-gold' : 'text-muted-foreground')} />
                    </button>
                    <button aria-label="Delete" onClick={e => { e.stopPropagation(); deleteBm(bm.id); }} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-destructive/20">
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <ExternalLink className="hidden h-3.5 w-3.5 self-center text-muted-foreground/40 sm:block" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
