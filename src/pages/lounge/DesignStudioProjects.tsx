import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Grid3X3, List, Clock, Star, Trash2, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import DesignStudioShell from '@/components/design-studio/DesignStudioShell';

const PROJECTS = [
  { id: '1', title: 'Marketing Deck', type: 'Presentation', color: 'bg-gradient-to-br from-orange-400 to-pink-500', time: '2 hours ago', starred: true },
  { id: '2', title: 'Brand Guidelines', type: 'Doc', color: 'bg-gradient-to-br from-blue-400 to-indigo-500', time: '1 day ago', starred: false },
  { id: '3', title: 'Social Campaign', type: 'Instagram Post', color: 'bg-gradient-to-br from-purple-400 to-pink-500', time: '3 days ago', starred: true },
  { id: '4', title: 'Product Launch', type: 'Poster', color: 'bg-gradient-to-br from-teal-400 to-cyan-500', time: '5 days ago', starred: false },
  { id: '5', title: 'Team Update', type: 'Presentation', color: 'bg-gradient-to-br from-amber-400 to-orange-500', time: '1 week ago', starred: false },
  { id: '6', title: 'Newsletter', type: 'Email', color: 'bg-gradient-to-br from-green-400 to-emerald-500', time: '1 week ago', starred: false },
  { id: '7', title: 'Event Flyer', type: 'Flyer', color: 'bg-gradient-to-br from-violet-400 to-purple-600', time: '2 weeks ago', starred: true },
  { id: '8', title: 'Annual Report', type: 'Doc', color: 'bg-gradient-to-br from-slate-400 to-gray-600', time: '2 weeks ago', starred: false },
  { id: '9', title: 'Instagram Reel Cover', type: 'Video', color: 'bg-gradient-to-br from-pink-400 to-rose-500', time: '3 weeks ago', starred: false },
  { id: '10', title: 'LinkedIn Banner', type: 'Banner', color: 'bg-gradient-to-br from-sky-400 to-blue-500', time: '1 month ago', starred: false },
];

const FOLDERS = [
  { name: 'Marketing', count: 12, color: 'bg-orange-500' },
  { name: 'Brand Assets', count: 8, color: 'bg-blue-500' },
  { name: 'Social Media', count: 24, color: 'bg-pink-500' },
  { name: 'Presentations', count: 6, color: 'bg-violet-500' },
];

export default function DesignStudioProjects() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'starred' | 'trash'>('all');

  const filtered = PROJECTS.filter(p => {
    if (filter === 'starred') return p.starred;
    if (search) return p.title.toLowerCase().includes(search.toLowerCase());
    return true;
  });

  return (
    <DesignStudioShell activeNav="designs">
      <div className="px-8 py-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <Button onClick={() => navigate('/lounge/office/design-studio/editor')} className="gap-2">
            <Plus className="h-4 w-4" /> New Design
          </Button>
        </div>

        {/* Folders */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {FOLDERS.map(folder => (
            <button key={folder.name} className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/50 transition-colors text-left">
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-white", folder.color)}>
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{folder.name}</p>
                <p className="text-xs text-muted-foreground">{folder.count} designs</p>
              </div>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="pl-9 h-9" />
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            {([
              { id: 'all' as const, label: 'All' },
              { id: 'starred' as const, label: 'Starred' },
            ]).map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  filter === f.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 ml-auto">
            <Button variant="ghost" size="icon" className={cn("h-8 w-8", view === 'grid' && "bg-muted")} onClick={() => setView('grid')}><Grid3X3 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className={cn("h-8 w-8", view === 'list' && "bg-muted")} onClick={() => setView('list')}><List className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Projects Grid */}
        {view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((p, i) => (
              <motion.button key={p.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                onClick={() => navigate('/lounge/office/design-studio/editor')}
                className="group text-left"
              >
                <div className={cn("aspect-[4/3] rounded-xl mb-2 relative overflow-hidden transition-all group-hover:shadow-lg group-hover:scale-[1.02]", p.color)}>
                  <div className="h-full w-full flex items-center justify-center opacity-30">
                    <FileText className="h-8 w-8 text-white" />
                  </div>
                  {p.starred && <Star className="absolute top-2 right-2 h-4 w-4 text-yellow-300 fill-yellow-300" />}
                </div>
                <p className="text-xs font-semibold text-foreground truncate">{p.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{p.type}</span>
                  <span className="text-[10px] text-muted-foreground/40">·</span>
                  <span className="text-[10px] text-muted-foreground/60">{p.time}</span>
                </div>
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(p => (
              <button key={p.id} onClick={() => navigate('/lounge/office/design-studio/editor')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-left">
                <div className={cn("h-10 w-14 rounded-lg flex items-center justify-center", p.color)}>
                  <FileText className="h-4 w-4 text-white opacity-40" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{p.type}</p>
                </div>
                <span className="text-xs text-muted-foreground">{p.time}</span>
                {p.starred && <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </DesignStudioShell>
  );
}
