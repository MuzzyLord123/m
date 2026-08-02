import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layout, Plus, CheckCircle2, Circle, Clock, MoreHorizontal, Calendar, List, Columns3, Trash2, Edit3, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OfficeModuleBand } from '@/pages/lounge/office/ModuleShell';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState, StatusBadge, type Tone } from '@/components/platform';

type Priority = 'high' | 'medium' | 'low';
type Status = 'todo' | 'in_progress' | 'done';

const PRIORITY_TONE: Record<Priority, Tone> = {
  high: 'risk',
  medium: 'attend',
  low: 'neutral',
};

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  due?: string;
  tags: string[];
}

const COLUMNS: { id: Status; label: string; icon: any; color: string }[] = [
  { id: 'todo', label: 'To do', icon: Circle, color: 'text-muted-foreground' },
  { id: 'in_progress', label: 'In progress', icon: Clock, color: 'text-primary' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: 'text-ok' },
];

export default function OfficeTasks() {
  const navigate = useNavigate();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [mobileCol, setMobileCol] = useState<Status>('todo');
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('office-tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [showDialog, setShowDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' as Priority, status: 'todo' as Status, due: '', tags: '' });

  const save = (updated: Task[]) => {
    setTasks(updated);
    localStorage.setItem('office-tasks', JSON.stringify(updated));
  };

  const openNew = (status?: Status) => {
    setEditingTask(null);
    setForm({ title: '', description: '', priority: 'medium', status: status || 'todo', due: '', tags: '' });
    setShowDialog(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setForm({ title: task.title, description: task.description, priority: task.priority, status: task.status, due: task.due || '', tags: task.tags.join(', ') });
    setShowDialog(true);
  };

  const saveTask = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    if (editingTask) {
      save(tasks.map(t => t.id === editingTask.id ? { ...t, title: form.title, description: form.description, priority: form.priority, status: form.status, due: form.due || undefined, tags } : t));
      toast.success('Task updated');
    } else {
      const newTask: Task = { id: Date.now().toString(), title: form.title, description: form.description, priority: form.priority, status: form.status, due: form.due || undefined, tags };
      save([...tasks, newTask]);
      toast.success('Task created');
    }
    setShowDialog(false);
  };

  const deleteTask = (id: string) => {
    save(tasks.filter(t => t.id !== id));
    toast.success('Task deleted');
  };

  const moveTask = (id: string, status: Status) => {
    save(tasks.map(t => t.id === id ? { ...t, status } : t));
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <OfficeModuleBand appId="tasks" icon={Layout} title="Tasks">

        <div className="flex gap-0.5 rounded-lg border border-border/60 bg-card p-0.5">
          <button onClick={() => setView('board')} className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors duration-150 sm:px-2.5', view === 'board' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground')}>
            <Columns3 className="h-3 w-3" /> <span className="hidden sm:inline">Board</span>
          </button>
          <button onClick={() => setView('list')} className={cn('flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors duration-150 sm:px-2.5', view === 'list' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground')}>
            <List className="h-3 w-3" /> <span className="hidden sm:inline">List</span>
          </button>
        </div>

        <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => openNew()}>
          <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add task</span>
        </Button>
      </OfficeModuleBand>

      <div className="flex-1 overflow-auto p-3 sm:p-5">
        {tasks.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              title="No tasks yet"
              body="Create your first task to start organising your work."
              action={{ label: 'Add task', onClick: () => openNew() }}
            />
          </div>
        ) : view === 'board' ? (
          <div className="flex h-full min-h-0 flex-col">
            <div className="mb-3 flex shrink-0 gap-1 rounded-lg border border-border/60 bg-card p-0.5 sm:hidden">
              {COLUMNS.map(col => (
                <button key={col.id} onClick={() => setMobileCol(col.id)}
                  className={cn('flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[10px] font-medium transition-colors duration-150',
                    mobileCol === col.id ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground')}>
                  <col.icon className={cn('h-3 w-3', col.color)} />
                  {col.label}
                  <span className="ml-0.5 font-mono text-[9px] tabular-nums text-muted-foreground/60">{tasks.filter(t => t.status === col.id).length}</span>
                </button>
              ))}
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              return (
                <div key={col.id} className={cn('flex min-h-0 flex-col', col.id !== mobileCol && 'hidden sm:flex')}>
                  <div className="mb-2.5 flex items-center gap-2 px-1">
                    <col.icon className={cn('h-3.5 w-3.5', col.color)} />
                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{col.label}</span>
                    <span className="ml-1 font-mono text-[10px] tabular-nums text-muted-foreground/60">{colTasks.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-auto">
                    {colTasks.map((task) => {
                      return (
                        <div key={task.id}
                          className="group cursor-pointer rounded-[10px] border border-border/60 bg-card p-3 transition-colors duration-150 hover:border-border"
                          onClick={() => openEdit(task)}>
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <span className="text-[12.5px] font-medium leading-snug text-foreground">{task.title}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                <button aria-label="Task actions" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-foreground/[0.04]">
                                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/40" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36 rounded-[10px]">
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); openEdit(task); }}><Edit3 className="mr-2 h-3 w-3" /> Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {COLUMNS.filter(c => c.id !== task.status).map(c => (
                                  <DropdownMenuItem key={c.id} onClick={e => { e.stopPropagation(); moveTask(task.id, c.id); }}>
                                    <c.icon className={cn('mr-2 h-3 w-3', c.color)} /> Move to {c.label.toLowerCase()}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); deleteTask(task.id); }}><Trash2 className="mr-2 h-3 w-3" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {task.description && <p className="mb-2 line-clamp-2 text-[10.5px] text-muted-foreground">{task.description}</p>}
                          <div className="flex flex-wrap items-center gap-2.5">
                            <StatusBadge tone={PRIORITY_TONE[task.priority]} label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} className="text-[10px]" />
                            {task.due && (
                              <span className="flex items-center gap-1 font-mono text-[9.5px] tabular-nums text-muted-foreground">
                                <Calendar className="h-2.5 w-2.5" /> {task.due}
                              </span>
                            )}
                            {task.tags.map(tag => (
                              <span key={tag} className="rounded bg-foreground/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    <button onClick={() => openNew(col.id)} className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-dashed border-border/60 p-3 text-[11px] text-muted-foreground transition-colors duration-150 hover:border-border hover:text-foreground">
                      <Plus className="h-3 w-3" /> Add task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl overflow-hidden rounded-[10px] border border-border/60 bg-card">
            {tasks.map((task, i) => {
              const statusCol = COLUMNS.find(c => c.id === task.status)!;
              return (
                <div key={task.id}
                  className={cn(
                    'group flex h-10 cursor-pointer items-center gap-3 px-3.5 transition-colors duration-150 hover:bg-foreground/[0.025]',
                    i > 0 && 'border-t border-border/60',
                  )}
                  onClick={() => openEdit(task)}>
                  <statusCol.icon className={cn('h-4 w-4 shrink-0', statusCol.color)} />
                  <span className={cn('flex-1 truncate text-[13px] font-[450] text-foreground', task.status === 'done' && 'text-muted-foreground line-through')}>{task.title}</span>
                  <StatusBadge tone={PRIORITY_TONE[task.priority]} label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} className="shrink-0 text-[10px]" />
                  {task.due && <span className="hidden shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground sm:block">{task.due}</span>}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <button aria-label="Task actions" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg opacity-100 transition-opacity duration-150 hover:bg-foreground/[0.04] md:opacity-0 md:group-hover:opacity-100">
                        <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36 rounded-[10px]">
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); openEdit(task); }}><Edit3 className="mr-2 h-3 w-3" /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {COLUMNS.filter(c => c.id !== task.status).map(c => (
                        <DropdownMenuItem key={c.id} onClick={e => { e.stopPropagation(); moveTask(task.id, c.id); }}>
                          <c.icon className={cn('mr-2 h-3 w-3', c.color)} /> {c.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); deleteTask(task.id); }}><Trash2 className="mr-2 h-3 w-3" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-[10px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{editingTask ? 'Edit task' : 'New task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs doing" className="rounded-lg" autoFocus />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Description</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Add details" className="min-h-[80px] rounded-lg" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger className="h-9 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-[10px]">
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Status }))}>
                  <SelectTrigger className="h-9 rounded-lg text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-[10px]">
                    <SelectItem value="todo">To do</SelectItem>
                    <SelectItem value="in_progress">In progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Due date</label>
              <Input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} className="h-9 rounded-lg text-xs" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Tags (comma separated)</label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. Finance, Client" className="h-9 rounded-lg text-xs" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingTask && (
              <Button variant="destructive" size="sm" className="mr-auto rounded-lg" onClick={() => { deleteTask(editingTask.id); setShowDialog(false); }}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
              </Button>
            )}
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" className="gap-1.5 rounded-lg" onClick={saveTask}>
              <Save className="h-3.5 w-3.5" /> {editingTask ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
