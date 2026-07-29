import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Search, Grid3X3, List, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DesignStudioShell from '@/components/design-studio/DesignStudioShell';

const PROJECTS = [
  { id: '1', title: 'Marketing Deck', type: 'Presentation', time: '2 hours ago', starred: true },
  { id: '2', title: 'Brand Guidelines', type: 'Doc', time: '1 day ago', starred: false },
  { id: '3', title: 'Social Campaign', type: 'Instagram post', time: '3 days ago', starred: true },
  { id: '4', title: 'Product Launch', type: 'Poster', time: '5 days ago', starred: false },
  { id: '5', title: 'Team Update', type: 'Presentation', time: '1 week ago', starred: false },
  { id: '6', title: 'Newsletter', type: 'Email', time: '1 week ago', starred: false },
  { id: '7', title: 'Event Flyer', type: 'Flyer', time: '2 weeks ago', starred: true },
  { id: '8', title: 'Annual Report', type: 'Doc', time: '2 weeks ago', starred: false },
  { id: '9', title: 'Instagram Reel Cover', type: 'Video', time: '3 weeks ago', starred: false },
  { id: '10', title: 'LinkedIn Banner', type: 'Banner', time: '1 month ago', starred: false },
];

const FOLDERS = [
  { name: 'Marketing', count: 12 },
  { name: 'Brand Assets', count: 8 },
  { name: 'Social Media', count: 24 },
  { name: 'Presentations', count: 6 },
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
          <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">Projects</h1>
          <Button onClick={() => navigate('/lounge/office/design-studio/editor')} className="gap-2 h-9 rounded-lg text-[13px]">
            <Plus className="h-4 w-4" /> New design
          </Button>
        </div>

        {/* Folders */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {FOLDERS.map(folder => (
            <button key={folder.name} className="flex items-center gap-3 p-3 rounded-[10px] border border-border/60 bg-card hover:bg-foreground/[0.02] hover:border-border transition-colors duration-150 text-left">
              <div className="h-9 w-9 rounded-[8px] border border-border/60 bg-sunken flex items-center justify-center text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-medium text-foreground">{folder.name}</p>
                <p className="font-mono text-[10px] tabular-nums text-muted-foreground">{folder.count} designs</p>
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
          <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5">
            {([
              { id: 'all' as const, label: 'All' },
              { id: 'starred' as const, label: 'Starred' },
            ]).map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  filter === f.id ? "bg-foreground/[0.05] text-foreground" : "text-muted-foreground hover:text-foreground"
                )}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-0.5 ml-auto">
            <Button variant="ghost" size="icon" className={cn("h-8 w-8", view === 'grid' && "bg-foreground/[0.05]")} onClick={() => setView('grid')}><Grid3X3 className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className={cn("h-8 w-8", view === 'list' && "bg-foreground/[0.05]")} onClick={() => setView('list')}><List className="h-4 w-4" /></Button>
          </div>
        </div>

        {/* Projects grid */}
        {view === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map((p) => (
              <button key={p.id}
                onClick={() => navigate('/lounge/office/design-studio/editor')}
                className="group text-left"
              >
                <div className="aspect-[4/3] rounded-[10px] border border-border/60 bg-sunken mb-2 relative overflow-hidden transition-colors duration-150 group-hover:border-border">
                  <div className="h-full w-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  {p.starred && <Star className="absolute top-2 right-2 h-3.5 w-3.5 text-gold fill-[hsl(var(--gold))]" />}
                </div>
                <p className="text-xs font-medium text-foreground truncate">{p.title}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-muted-foreground">{p.type}</span>
                  <span className="text-[10px] text-muted-foreground/40">·</span>
                  <span className="text-[10px] text-muted-foreground/60">{p.time}</span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[10px] border border-border/60 bg-card divide-y divide-border/60 overflow-hidden">
            {filtered.map(p => (
              <button key={p.id} onClick={() => navigate('/lounge/office/design-studio/editor')}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-foreground/[0.025] transition-colors duration-150 text-left">
                <div className="h-9 w-12 rounded-[6px] border border-border/60 bg-sunken flex items-center justify-center">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground/50" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{p.title}</p>
                  <p className="text-[11px] text-muted-foreground">{p.type}</p>
                </div>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{p.time}</span>
                {p.starred && <Star className="h-3.5 w-3.5 text-gold fill-[hsl(var(--gold))]" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </DesignStudioShell>
  );
}
