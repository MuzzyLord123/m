import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layout, Plus, CheckCircle2, Circle, Clock, MoreHorizontal, Calendar, List, Columns3, X, Trash2, Edit3, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Priority = 'high' | 'medium' | 'low';
type Status = 'todo' | 'in_progress' | 'done';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  due?: string;
  tags: string[];
}

const PRIORITY_STYLES: Record<Priority, { color: string; bg: string }> = {
  high: { color: 'text-red-500', bg: 'bg-red-500/10' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10' },
  low: { color: 'text-blue-500', bg: 'bg-blue-500/10' },
};

const COLUMNS: { id: Status; label: string; icon: any; color: string }[] = [
  { id: 'todo', label: 'To Do', icon: Circle, color: 'text-muted-foreground' },
  { id: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-amber-500' },
  { id: 'done', label: 'Done', icon: CheckCircle2, color: 'text-emerald-500' },
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
      <header className="h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex items-center px-3 sm:px-5 gap-2 sm:gap-3 shrink-0">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs shrink-0" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Back to Office</span>
        </Button>
        <div className="h-4 w-px bg-border/40 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Layout className="h-4 w-4 text-emerald-500" />
          <span className="text-xs sm:text-sm font-semibold tracking-tight">Tasks</span>
        </div>
        <div className="flex-1" />

        <div className="flex gap-0.5 bg-muted/30 p-0.5 rounded-lg">
          <button onClick={() => setView('board')} className={cn("px-2 sm:px-2.5 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1", view === 'board' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
            <Columns3 className="h-3 w-3" /> <span className="hidden sm:inline">Board</span>
          </button>
          <button onClick={() => setView('list')} className={cn("px-2 sm:px-2.5 py-1 rounded-md text-[10px] font-medium transition-all flex items-center gap-1", view === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
            <List className="h-3 w-3" /> <span className="hidden sm:inline">List</span>
          </button>
        </div>

        <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => openNew()}>
          <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add Task</span>
        </Button>
      </header>

      <div className="flex-1 overflow-auto p-3 sm:p-5">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <Layout className="h-8 w-8 text-emerald-500/60" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">No tasks yet</h2>
            <p className="text-sm text-muted-foreground/60 mb-4 max-w-xs">Create your first task to start organizing your work</p>
            <Button className="gap-2 rounded-xl" onClick={() => openNew()}>
              <Plus className="h-4 w-4" /> Create Task
            </Button>
          </div>
        ) : view === 'board' ? (
          <div className="flex flex-col h-full min-h-0">
            <div className="flex sm:hidden gap-1 mb-3 bg-muted/30 p-0.5 rounded-xl shrink-0">
              {COLUMNS.map(col => (
                <button key={col.id} onClick={() => setMobileCol(col.id)}
                  className={cn("flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                    mobileCol === col.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground")}>
                  <col.icon className={cn("h-3 w-3", col.color)} />
                  {col.label}
                  <span className="ml-0.5 text-[9px] text-muted-foreground/50">{tasks.filter(t => t.status === col.id).length}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 flex-1 min-h-0">
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              return (
                <div key={col.id} className={cn("flex flex-col min-h-0", col.id !== mobileCol && "hidden sm:flex")}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <col.icon className={cn("h-4 w-4", col.color)} />
                    <span className="text-xs font-semibold text-foreground">{col.label}</span>
                    <span className="text-[10px] text-muted-foreground/40 ml-1">{colTasks.length}</span>
                  </div>
                  <div className="flex-1 space-y-2 overflow-auto">
                    {colTasks.map((task, i) => {
                      const p = PRIORITY_STYLES[task.priority];
                      return (
                        <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                          className="p-3.5 rounded-2xl bg-card/60 border border-border/20 hover:border-border/40 hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => openEdit(task)}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-[12px] font-semibold text-foreground leading-snug">{task.title}</span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                <button className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-accent/50 shrink-0">
                                  <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/40" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem onClick={e => { e.stopPropagation(); openEdit(task); }}><Edit3 className="h-3 w-3 mr-2" /> Edit</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {COLUMNS.filter(c => c.id !== task.status).map(c => (
                                  <DropdownMenuItem key={c.id} onClick={e => { e.stopPropagation(); moveTask(task.id, c.id); }}>
                                    <c.icon className={cn("h-3 w-3 mr-2", c.color)} /> Move to {c.label}
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); deleteTask(task.id); }}><Trash2 className="h-3 w-3 mr-2" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {task.description && <p className="text-[10px] text-muted-foreground/50 mb-2 line-clamp-2">{task.description}</p>}
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize", p.bg, p.color)}>{task.priority}</span>
                            {task.due && (
                              <span className="text-[9px] text-muted-foreground/50 flex items-center gap-0.5">
                                <Calendar className="h-2.5 w-2.5" /> {task.due}
                              </span>
                            )}
                            {task.tags.map(tag => (
                              <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted/50 text-muted-foreground/60">{tag}</span>
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                    <button onClick={() => openNew(col.id)} className="w-full p-3 rounded-2xl border border-dashed border-border/20 hover:border-border/40 text-[11px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-all flex items-center gap-2 justify-center">
                      <Plus className="h-3 w-3" /> Add task
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-2">
            {tasks.map((task, i) => {
              const p = PRIORITY_STYLES[task.priority];
              const statusCol = COLUMNS.find(c => c.id === task.status)!;
              return (
                <motion.div key={task.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 sm:gap-3.5 p-3 sm:p-3.5 rounded-2xl bg-card/50 border border-border/20 hover:border-border/40 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => openEdit(task)}>
                  <statusCol.icon className={cn("h-4 w-4 shrink-0", statusCol.color)} />
                  <span className={cn("text-[12px] font-semibold text-foreground flex-1 truncate", task.status === 'done' && "line-through text-muted-foreground")}>{task.title}</span>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full font-medium capitalize shrink-0", p.bg, p.color)}>{task.priority}</span>
                  {task.due && <span className="text-[10px] text-muted-foreground/40 hidden sm:block shrink-0">{task.due}</span>}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                      <button className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-accent/50 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground/40" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={e => { e.stopPropagation(); openEdit(task); }}><Edit3 className="h-3 w-3 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {COLUMNS.filter(c => c.id !== task.status).map(c => (
                        <DropdownMenuItem key={c.id} onClick={e => { e.stopPropagation(); moveTask(task.id, c.id); }}>
                          <c.icon className={cn("h-3 w-3 mr-2", c.color)} /> {c.label}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive" onClick={e => { e.stopPropagation(); deleteTask(task.id); }}><Trash2 className="h-3 w-3 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{editingTask ? 'Edit Task' : 'New Task'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Title</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" className="rounded-xl" autoFocus />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Add details…" className="rounded-xl min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Priority</label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v as Priority }))}>
                  <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">🔴 High</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="low">🔵 Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Status</label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as Status }))}>
                  <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Due Date</label>
              <Input type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} className="rounded-xl h-9 text-xs" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tags (comma separated)</label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. Finance, Client" className="rounded-xl h-9 text-xs" />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editingTask && (
              <Button variant="destructive" size="sm" className="rounded-xl mr-auto" onClick={() => { deleteTask(editingTask.id); setShowDialog(false); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
              </Button>
            )}
            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button size="sm" className="rounded-xl gap-1.5" onClick={saveTask}>
              <Save className="h-3.5 w-3.5" /> {editingTask ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
