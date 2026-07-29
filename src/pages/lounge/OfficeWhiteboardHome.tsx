import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PenLine, Plus, Star, Trash2, Layers, Lightbulb, Users, GitBranch, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PageHeader, EmptyState, FIELD } from '@/components/platform';

interface WhiteboardItem {
  id: string;
  title: string;
  preview: string;
  createdAt: Date;
  isStarred: boolean;
}

const TEMPLATES = [
  { id: 'blank', label: 'Blank canvas', desc: 'Start fresh', icon: PenLine },
  { id: 'brainstorm', label: 'Brainstorm', desc: 'Mind mapping', icon: Lightbulb },
  { id: 'flowchart', label: 'Flowchart', desc: 'Process diagrams', icon: GitBranch },
  { id: 'wireframe', label: 'Wireframe', desc: 'UI layouts', icon: Layers },
  { id: 'retrospective', label: 'Retrospective', desc: 'Team review', icon: Users },
  { id: 'kanban', label: 'Kanban board', desc: 'Visual workflow', icon: BarChart3 },
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
      <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-border/60 bg-card px-5">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-lg text-xs" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/60" />
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground/[0.04]">
          <PenLine className="h-3.5 w-3.5 text-ink-2" strokeWidth={1.7} />
        </span>
        <span className="text-sm font-semibold tracking-tight">Whiteboard</span>
        <div className="flex-1" />
        <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => createBoard('blank')}>
          <Plus className="h-3.5 w-3.5" /> New board
        </Button>
      </header>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 sm:px-10">
          <PageHeader
            className="pb-5 pt-7"
            kicker="Quooro Office · Whiteboard"
            title="Whiteboards"
            description="Sketch, brainstorm and collaborate visually"
          />

          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search whiteboards" className={cn(FIELD, 'mb-6 h-9 max-w-md text-sm')} />

          {/* Templates */}
          <section className="mb-8">
            <div className="mb-3.5 flex items-center gap-2.5">
              <h2 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Templates</h2>
              <div className="h-px flex-1 bg-border/60" />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {TEMPLATES.map((tpl) => (
                <button key={tpl.id}
                  onClick={() => createBoard(tpl.id)}
                  className="flex flex-col items-start gap-2.5 rounded-[10px] border border-border/60 bg-card p-3.5 text-left transition-colors duration-150 hover:bg-foreground/[0.025]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.04]">
                    <tpl.icon className="h-4 w-4 text-ink-2" strokeWidth={1.7} />
                  </span>
                  <span>
                    <span className="block text-[11.5px] font-medium leading-tight text-foreground">{tpl.label}</span>
                    <span className="mt-0.5 block text-[10.5px] leading-tight text-muted-foreground">{tpl.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Starred */}
          {starred.length > 0 && (
            <section className="mb-6">
              <h2 className="mb-2.5 flex items-center gap-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <Star className="h-3 w-3 fill-gold text-gold" /> Starred
              </h2>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
                {starred.map(b => (
                  <BoardCard key={b.id} board={b} onOpen={() => navigate('/lounge/office/whiteboard', { state: { fromOfficeApp: true } })} onStar={() => toggleStar(b.id)} onDelete={() => deleteBoard(b.id)} />
                ))}
              </div>
            </section>
          )}

          {/* Recent */}
          <section className="pb-10">
            <h2 className="mb-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Recent</h2>
            {recent.length === 0 && (
              <EmptyState
                compact
                title="No whiteboards yet"
                body="Start from a blank canvas or pick a template."
                action={{ label: 'New board', onClick: () => createBoard('blank') }}
              />
            )}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
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
    <div
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:border-border"
      onClick={onOpen}>
      <div className="flex h-28 items-center justify-center bg-sunken/50">
        <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-foreground/[0.04]">
          <PenLine className="h-[18px] w-[18px] text-ink-2" strokeWidth={1.7} />
        </span>
      </div>
      <div className="border-t border-border/60 p-3">
        <span className="block truncate text-[12px] font-medium text-foreground">{board.title}</span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{board.createdAt.toLocaleDateString()}</span>
      </div>
      <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100">
        <button aria-label={board.isStarred ? 'Unstar' : 'Star'} onClick={e => { e.stopPropagation(); onStar(); }} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-card transition-colors duration-150 hover:bg-foreground/[0.04]">
          <Star className={cn('h-3.5 w-3.5', board.isStarred ? 'fill-gold text-gold' : 'text-muted-foreground')} />
        </button>
        <button aria-label="Delete" onClick={e => { e.stopPropagation(); onDelete(); }} className="flex h-7 w-7 items-center justify-center rounded-lg border border-border/60 bg-card transition-colors duration-150 hover:bg-destructive/20">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
