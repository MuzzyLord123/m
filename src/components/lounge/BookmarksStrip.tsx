import { useState } from 'react';
import { Bookmark, Plus, X, ExternalLink } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  favicon: string;
}

const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  { id: '1', title: 'GitHub', url: 'https://github.com', favicon: '🐙' },
  { id: '2', title: 'Figma', url: 'https://figma.com', favicon: '🎨' },
  { id: '3', title: 'Google Analytics', url: 'https://analytics.google.com', favicon: '📊' },
  { id: '4', title: 'Notion', url: 'https://notion.so', favicon: '📝' },
  { id: '5', title: 'Stack Overflow', url: 'https://stackoverflow.com', favicon: '💡' },
  { id: '6', title: 'Dribbble', url: 'https://dribbble.com', favicon: '🏀' },
];

export function BookmarksStrip() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    const saved = localStorage.getItem('lounge-bookmarks-strip');
    return saved ? JSON.parse(saved) : DEFAULT_BOOKMARKS;
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const save = (bms: BookmarkItem[]) => {
    setBookmarks(bms);
    localStorage.setItem('lounge-bookmarks-strip', JSON.stringify(bms));
  };

  const addBookmark = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    const bm: BookmarkItem = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`,
      favicon: '🔗',
    };
    save([...bookmarks, bm]);
    setNewTitle('');
    setNewUrl('');
    setShowAdd(false);
    toast.success('Bookmark added');
  };

  const remove = (id: string) => {
    save(bookmarks.filter(b => b.id !== id));
  };

  return (
    <div className="flex items-center gap-1 px-4 lg:px-6 py-1.5 border-b border-border/20 bg-background/60 backdrop-blur-sm overflow-x-auto scrollbar-none">
      <Bookmark className="h-3 w-3 text-amber-500/60 shrink-0 mr-1" />
      
      {bookmarks.map(bm => (
        <Tooltip key={bm.id}>
          <TooltipTrigger asChild>
            <button
              onClick={() => window.open(bm.url, '_blank')}
              className="group relative h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent/50 transition-colors shrink-0"
            >
              <span className="text-sm">{bm.favicon}</span>
              <button
                onClick={(e) => { e.stopPropagation(); remove(bm.id); }}
                className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-destructive text-destructive-foreground items-center justify-center text-[8px] hidden group-hover:flex"
              >
                <X className="h-2 w-2" />
              </button>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[11px]">
            <p className="font-medium">{bm.title}</p>
            <p className="text-muted-foreground text-[10px]">{bm.url}</p>
          </TooltipContent>
        </Tooltip>
      ))}

      <div className="h-4 w-px bg-border/30 mx-1 shrink-0" />

      <AnimatePresence>
        {showAdd ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex items-center gap-1.5 overflow-hidden shrink-0"
          >
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Title"
              className="h-6 w-20 text-[10px] rounded-md px-1.5 border-border/30 bg-card/50"
            />
            <Input
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="URL"
              onKeyDown={e => e.key === 'Enter' && addBookmark()}
              className="h-6 w-28 text-[10px] rounded-md px-1.5 border-border/30 bg-card/50"
            />
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={addBookmark}>
              <ExternalLink className="h-3 w-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setShowAdd(false)}>
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowAdd(true)}
                className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-accent/50 transition-colors shrink-0 text-muted-foreground/40 hover:text-muted-foreground"
              >
                <Plus className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-[11px]">Add bookmark</TooltipContent>
          </Tooltip>
        )}
      </AnimatePresence>
    </div>
  );
}
