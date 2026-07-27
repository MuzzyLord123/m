import { useState, useMemo } from 'react';
import { Plus, Search, Filter, LayoutGrid, List, Calendar, CheckCircle2, Circle, Clock, Pause, Eye, XCircle, AlertTriangle, ChevronDown, MoreHorizontal, Trash2, Edit3, ArrowRight, Flag, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { usePlannerTasks, TaskStatus, TaskPriority, CreateTaskInput, PlannerTask } from '@/hooks/usePlannerTasks';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: any; color: string; bg: string }> = {
  todo: { label: 'To Do', icon: Circle, color: 'text-muted-foreground', bg: 'bg-muted/30' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  paused: { label: 'Paused', icon: Pause, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  in_review: { label: 'In Review', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
};

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-red-600', bg: 'bg-red-500/10 border-red-500/20', dot: 'bg-red-500' },
  high: { label: 'High', color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-500' },
  medium: { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-500' },
  low: { label: 'Low', color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-500' },
};

const CATEGORIES = ['general', 'development', 'design', 'marketing', 'operations', 'finance', 'support', 'research'];

type ViewMode = 'board' | 'list';

interface TaskForm {
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: string;
  due_date: string | null;
  start_date: string | null;
  tags_str: string;
  estimated_hours: number | null;
}

const EMPTY_FORM: TaskForm = {
  title: '', description: '', priority: 'medium', status: 'todo', category: 'general',
  due_date: null, start_date: null, tags_str: '', estimated_hours: null,
};

interface PlannerBoardProps {
  title?: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export default function PlannerBoard({ title = 'Planner', showBackButton, onBack }: PlannerBoardProps) {
  const { tasks, loading, createTask, updateTask, deleteTask } = usePlannerTasks();
  const [view, setView] = useState<ViewMode>('board');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [form, setForm] = useState<TaskForm>(EMPTY_FORM);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      return true;
    });
  }, [tasks, search, filterPriority, filterCategory]);

  const columns: TaskStatus[] = ['todo', 'in_progress', 'paused', 'in_review', 'completed'];
  
  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    overdue: tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed' && t.status !== 'cancelled').length,
  }), [tasks]);

  const openNew = (status?: TaskStatus) => {
    setEditingTask(null);
    setForm({ ...EMPTY_FORM, status: status || 'todo' });
    setShowDialog(true);
  };

  const openEdit = (task: PlannerTask) => {
    setEditingTask(task);
    setForm({
      title: task.title, description: task.description, priority: task.priority,
      status: task.status, category: task.category,
      due_date: task.due_date ? task.due_date.split('T')[0] : null,
      start_date: task.start_date ? task.start_date.split('T')[0] : null,
      tags_str: task.tags.join(', '), estimated_hours: task.estimated_hours,
    });
    setShowDialog(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast('Title is required'); return; }
    const tags = form.tags_str.split(',').map(t => t.trim()).filter(Boolean);
    const payload: any = {
      title: form.title, description: form.description || '', priority: form.priority,
      status: form.status, category: form.category,
      due_date: form.due_date || null, start_date: form.start_date || null,
      tags, estimated_hours: form.estimated_hours || null,
    };
    if (editingTask) {
      await updateTask(editingTask.id, payload);
    } else {
      await createTask(payload);
    }
    setShowDialog(false);
  };

  const handleStatusChange = async (task: PlannerTask, newStatus: TaskStatus) => {
    await updateTask(task.id, { status: newStatus });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-5 pb-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {showBackButton && onBack && (
              <Button variant="ghost" size="sm" className="h-8 rounded-xl text-xs" onClick={onBack}>← Back</Button>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">{title}</h1>
              <p className="text-xs text-muted-foreground/60 mt-0.5">
                {stats.total} tasks · {stats.completed} done · {stats.inProgress} active
                {stats.overdue > 0 && <span className="text-red-500 ml-1">· {stats.overdue} overdue</span>}
              </p>
            </div>
          </div>
          <Button size="sm" className="h-9 gap-1.5 rounded-xl text-xs font-medium" onClick={() => openNew()}>
            <Plus className="h-3.5 w-3.5" /> New Task
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks…" className="h-8 pl-8 text-xs rounded-xl bg-muted/20 border-border/20" />
          </div>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-8 w-[110px] rounded-xl text-xs border-border/20"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="h-8 w-[110px] rounded-xl text-xs border-border/20"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-0.5 bg-muted/20 p-0.5 rounded-lg ml-auto">
            <button onClick={() => setView('board')} className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1", view === 'board' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
              <LayoutGrid className="h-3 w-3" /> Board
            </button>
            <button onClick={() => setView('list')} className={cn("px-2.5 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1", view === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
              <List className="h-3 w-3" /> List
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 sm:px-6 pb-4">
        {filteredTasks.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-7 w-7 text-primary/50" />
            </div>
            <h3 className="text-sm font-semibold text-foreground mb-1">No tasks yet</h3>
            <p className="text-xs text-muted-foreground/50 mb-3 max-w-[220px]">Create your first task to start planning</p>
            <Button size="sm" className="gap-1.5 rounded-xl text-xs" onClick={() => openNew()}>
              <Plus className="h-3.5 w-3.5" /> Create Task
            </Button>
          </div>
        ) : view === 'board' ? (
          <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2">
          <div className="flex gap-3 min-h-0" style={{minWidth:"max-content"}}>
            {columns.map(colStatus => {
              const colTasks = filteredTasks.filter(t => t.status === colStatus);
              const cfg = STATUS_CONFIG[colStatus];
              return (
                <div key={colStatus} className="flex flex-col min-h-0 w-[260px] shrink-0">
                  <div className={cn("flex items-center gap-2 mb-2.5 px-2 py-1.5 rounded-xl", cfg.bg)}>
                    <cfg.icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    <span className="text-[11px] font-semibold text-foreground">{cfg.label}</span>
                    <span className="text-[10px] text-muted-foreground/40 ml-auto">{colTasks.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-auto">
                    <AnimatePresence mode="popLayout">
                      {colTasks.map((task) => (
                        <TaskCard key={task.id} task={task} onEdit={openEdit} onStatusChange={handleStatusChange} onDelete={deleteTask} />
                      ))}
                    </AnimatePresence>
                    <button onClick={() => openNew(colStatus)} className="w-full p-2.5 rounded-xl border border-dashed border-border/20 hover:border-border/40 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-all flex items-center gap-1.5 justify-center">
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        ) : (
          <div className="max-w-4xl space-y-1.5">
            {filteredTasks.map((task) => (
              <TaskListRow key={task.id} task={task} onEdit={openEdit} onStatusChange={handleStatusChange} onDelete={deleteTask} />
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Title *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" className="rounded-xl" autoFocus />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Description</label>
              <Textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Add details…" className="rounded-xl min-h-[70px]" />
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as TaskStatus }))}>
                  <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}><span className="flex items-center gap-1.5"><v.icon className={cn("h-3 w-3", v.color)} />{v.label}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as TaskPriority }))}>
                  <SelectTrigger className="rounded-xl h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                      <SelectItem key={k} value={k}><span className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", v.dot)} />{v.label}</span></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Category</label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="rounded-xl h-8 text-xs capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Start Date</label>
                <Input type="date" value={form.start_date || ''} onChange={e => setForm(f => ({ ...f, start_date: e.target.value || null }))} className="rounded-xl h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Due Date</label>
                <Input type="date" value={form.due_date || ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value || null }))} className="rounded-xl h-8 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Est. Hours</label>
                <Input type="number" step="0.5" min="0" value={form.estimated_hours || ''} onChange={e => setForm(f => ({ ...f, estimated_hours: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="0" className="rounded-xl h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Tags (comma separated)</label>
                <Input value={form.tags_str} onChange={e => setForm(f => ({ ...f, tags_str: e.target.value }))} placeholder="e.g. urgent, client" className="rounded-xl h-8 text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingTask && (
              <Button variant="destructive" size="sm" className="rounded-xl mr-auto gap-1" onClick={() => { deleteTask(editingTask.id); setShowDialog(false); }}>
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            )}
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" className="rounded-xl gap-1" onClick={handleSave}>
              {editingTask ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- Task Card (Board View) ---
function TaskCard({ task, onEdit, onStatusChange, onDelete }: { task: PlannerTask; onEdit: (t: PlannerTask) => void; onStatusChange: (t: PlannerTask, s: TaskStatus) => void; onDelete: (id: string) => void }) {
  const p = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'cancelled';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "p-3 rounded-xl bg-card/60 border border-border/20 hover:border-border/40 hover:shadow-lg transition-all cursor-pointer group",
        isOverdue && "border-red-500/30",
        task.status === 'completed' && "opacity-70"
      )}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className={cn("h-2 w-2 rounded-full shrink-0", p.dot)} />
          <span className={cn("text-[11px] font-semibold text-foreground leading-snug truncate", task.status === 'completed' && "line-through text-muted-foreground")}>{task.title}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <button className="h-5 w-5 rounded-md flex items-center justify-center hover:bg-accent/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="h-3 w-3 text-muted-foreground/50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(task); }}><Edit3 className="h-3 w-3 mr-2" /> Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            {Object.entries(STATUS_CONFIG).filter(([k]) => k !== task.status && k !== 'cancelled').map(([k, v]) => (
              <DropdownMenuItem key={k} onClick={e => { e.stopPropagation(); onStatusChange(task, k as TaskStatus); }}>
                <v.icon className={cn("h-3 w-3 mr-2", v.color)} /> {v.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); onDelete(task.id); }}><Trash2 className="h-3 w-3 mr-2" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {task.description && <p className="text-[10px] text-muted-foreground/50 mb-2 line-clamp-2 pl-3.5">{task.description}</p>}
      <div className="flex items-center gap-1.5 flex-wrap pl-3.5">
        <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-medium capitalize border", p.bg, p.color)}>{task.priority}</span>
        <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted/40 text-muted-foreground/60 capitalize">{task.category}</span>
        {task.due_date && (
          <span className={cn("text-[8px] flex items-center gap-0.5", isOverdue ? "text-red-500" : "text-muted-foreground/50")}>
            <Calendar className="h-2.5 w-2.5" /> {format(new Date(task.due_date), 'MMM d')}
          </span>
        )}
        {task.tags.slice(0, 2).map(tag => (
          <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground/50">{tag}</span>
        ))}
      </div>
      {task.progress > 0 && task.status !== 'completed' && (
        <div className="mt-2 pl-3.5">
          <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
            <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${task.progress}%` }} />
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- Task Row (List View) ---
function TaskListRow({ task, onEdit, onStatusChange, onDelete }: { task: PlannerTask; onEdit: (t: PlannerTask) => void; onStatusChange: (t: PlannerTask, s: TaskStatus) => void; onDelete: (id: string) => void }) {
  const sCfg = STATUS_CONFIG[task.status];
  const p = PRIORITY_CONFIG[task.priority];
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && task.status !== 'cancelled';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-card/40 border border-border/15 hover:border-border/35 hover:shadow-md transition-all cursor-pointer group",
        isOverdue && "border-red-500/20"
      )}
      onClick={() => onEdit(task)}
    >
      {/* Quick status toggle */}
      <button
        onClick={e => {
          e.stopPropagation();
          const next: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
          onStatusChange(task, next);
        }}
        className="shrink-0"
      >
        <sCfg.icon className={cn("h-4 w-4 transition-colors", sCfg.color, task.status !== 'completed' && "hover:text-emerald-500")} />
      </button>

      <span className={cn("text-[12px] font-semibold text-foreground flex-1 truncate", task.status === 'completed' && "line-through text-muted-foreground")}>{task.title}</span>

      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize border shrink-0 hidden sm:inline", p.bg, p.color)}>{task.priority}</span>
      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground/50 capitalize shrink-0 hidden md:inline">{task.category}</span>

      {task.due_date && (
        <span className={cn("text-[10px] shrink-0 hidden sm:flex items-center gap-0.5", isOverdue ? "text-red-500" : "text-muted-foreground/40")}>
          <Calendar className="h-2.5 w-2.5" /> {format(new Date(task.due_date), 'MMM d')}
        </span>
      )}

      <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full shrink-0", sCfg.bg, sCfg.color)}>{sCfg.label}</span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
          <button className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-accent/50 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/40" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={e => { e.stopPropagation(); onEdit(task); }}><Edit3 className="h-3 w-3 mr-2" /> Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          {Object.entries(STATUS_CONFIG).filter(([k]) => k !== task.status && k !== 'cancelled').map(([k, v]) => (
            <DropdownMenuItem key={k} onClick={e => { e.stopPropagation(); onStatusChange(task, k as TaskStatus); }}>
              <v.icon className={cn("h-3 w-3 mr-2", v.color)} /> {v.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); onDelete(task.id); }}><Trash2 className="h-3 w-3 mr-2" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

// Need this for the toast import
import { toast } from 'sonner';
