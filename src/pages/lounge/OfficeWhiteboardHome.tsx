import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenLine, Plus, Grid3X3, Clock, Star, Trash2, MoreHorizontal, Layers, Lightbulb, Users, GitBranch, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface WhiteboardItem {
  id: string;
  title: string;
  preview: string;
  createdAt: Date;
  isStarred: boolean;
}

const TEMPLATES = [
  { id: 'blank', label: 'Blank Canvas', desc: 'Start fresh', icon: PenLine, color: '#ec4899' },
  { id: 'brainstorm', label: 'Brainstorm', desc: 'Mind mapping', icon: Lightbulb, color: '#f59e0b' },
  { id: 'flowchart', label: 'Flowchart', desc: 'Process diagrams', icon: GitBranch, color: '#3b82f6' },
  { id: 'wireframe', label: 'Wireframe', desc: 'UI layouts', icon: Layers, color: '#8b5cf6' },
  { id: 'retrospective', label: 'Retrospective', desc: 'Team review', icon: Users, color: '#10b981' },
  { id: 'kanban', label: 'Kanban Board', desc: 'Visual workflow', icon: BarChart3, color: '#06b6d4' },
];

export default function OfficeWhiteboardHome() {
  const navigate = useNavigate();
  const [boards, setBoards] = useState<WhiteboardItem[]>([
    { id: '1', title: 'Product Roadmap Q1', preview: '🗺️', createdAt: new Date(Date.now() - 3600000), isStarred: true },
    { id: '2', title: 'Sprint Planning', preview: '📋', createdAt: new Date(Date.now() - 86400000), isStarred: false },
    { id: '3', title: 'User Flow Diagram', preview: '🔄', createdAt: new Date(Date.now() - 172800000), isStarred: true },
  ]);
  const [search, setSearch] = useState('');

  const createBoard = (template: string) => {
    const tpl = TEMPLATES.find(t => t.id === template);
    const newBoard: WhiteboardItem = {
      id: Date.now().toString(),
      title: tpl?.label || 'Untitled Whiteboard',
      preview: '✏️',
      createdAt: new Date(),
      isStarred: false,
    };
    setBoards(prev => [newBoard, ...prev]);
    toast.success('Whiteboard created');
    navigate('/lounge/office/whiteboard', { state: { fromOfficeApp: true } });
  };

  const toggleStar = (id: string) => setBoards(prev => prev.map(b => b.id === id ? { ...b, isStarred: !b.isStarred } : b));
  const deleteBoard = (id: string) => { setBoards(prev => prev.filter(b => b.id !== id)); toast.success('Deleted'); };

  const filtered = boards.filter(b => b.title.toLowerCase().includes(search.toLowerCase()));
  const starred = filtered.filter(b => b.isStarred);
  const recent = filtered.filter(b => !b.isStarred);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <header className="shrink-0 h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-5 gap-3">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40" />
        <PenLine className="h-4 w-4 text-pink-500" />
        <span className="text-sm font-semibold tracking-tight">Whiteboard</span>
        <div className="flex-1" />
        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => createBoard('blank')}>
          <Plus className="h-3.5 w-3.5" /> New Board
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-6 sm:px-10">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="pt-8 pb-6">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Whiteboards</h1>
            <p className="text-sm text-muted-foreground/60 mt-1">Sketch, brainstorm, and collaborate visually.</p>
          </motion.div>

          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search whiteboards…" className="max-w-md h-10 rounded-xl bg-card/50 border-border/30 mb-6 text-sm" />

          {/* Templates */}
          <section className="mb-8">
            <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-4">Templates</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {TEMPLATES.map((tpl, i) => (
                <motion.button key={tpl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => createBoard(tpl.id)}
                  className="group flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all duration-300">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: `${tpl.color}15` }}>
                    <tpl.icon className="h-5 w-5" style={{ color: tpl.color }} />
                  </div>
                  <div className="text-center">
                    <span className="text-[12px] font-semibold text-foreground block">{tpl.label}</span>
                    <span className="text-[10px] text-muted-foreground/50">{tpl.desc}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </section>

          {/* Starred */}
          {starred.length > 0 && (
            <section className="mb-6">
              <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Star className="h-3 w-3" /> Starred</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {starred.map(b => (
                  <BoardCard key={b.id} board={b} onOpen={() => navigate('/lounge/office/whiteboard', { state: { fromOfficeApp: true } })} onStar={() => toggleStar(b.id)} onDelete={() => deleteBoard(b.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Recent */}
          <section className="pb-10">
            <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Recent</h2>
            {recent.length === 0 && <p className="text-sm text-muted-foreground/40 py-8 text-center">No whiteboards yet. Create one above!</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {recent.map(b => (
                <BoardCard key={b.id} board={b} onOpen={() => navigate('/lounge/office/whiteboard', { state: { fromOfficeApp: true } })} onStar={() => toggleStar(b.id)} onDelete={() => deleteBoard(b.id)} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function BoardCard({ board, onOpen, onStar, onDelete }: { board: WhiteboardItem; onOpen: () => void; onStar: () => void; onDelete: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="group relative flex flex-col rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
      onClick={onOpen}>
      <div className="h-28 bg-muted/30 flex items-center justify-center text-4xl">{board.preview}</div>
      <div className="p-3.5">
        <span className="text-[12px] font-semibold text-foreground block truncate">{board.title}</span>
        <span className="text-[10px] text-muted-foreground/45">{board.createdAt.toLocaleDateString()}</span>
      </div>
      <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button onClick={e => { e.stopPropagation(); onStar(); }} className="h-7 w-7 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center hover:bg-accent">
          <Star className={cn("h-3.5 w-3.5", board.isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="h-7 w-7 rounded-lg bg-background/80 backdrop-blur flex items-center justify-center hover:bg-destructive/20">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </motion.div>
  );
}
