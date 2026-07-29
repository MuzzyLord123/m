import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  PenTool, Plus, Search, MoreVertical, Trash2, Copy, Pencil,
  FolderOpen, Layers, Box, ArrowUpDown, Grid3X3, List,
  Download, Play, Filter, Ruler, Zap,
} from 'lucide-react';
import { SubscriptionPaywall } from '@/components/lounge/SubscriptionPaywall';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  PageHeader, Panel, RelativeTime, EmptyState, ConfirmDialog, DataTable,
  SkeletonBlock, FIELD, FIELD_LABEL,
  type Column,
} from '@/components/platform';

interface CADProject {
  id: string;
  name: string;
  description: string | null;
  tags: string[] | null;
  folder: string | null;
  units: string;
  drawing_data: any;
  version: number;
  entity_count: number;
  layer_count: number;
  created_at: string;
  updated_at: string;
  is_template: boolean;
  template_category: string | null;
  thumbnail_url: string | null;
}

type SortField = 'updated_at' | 'created_at' | 'name' | 'entity_count';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'updated_at', label: 'Last modified' },
  { value: 'created_at', label: 'Date created' },
  { value: 'name', label: 'Name' },
  { value: 'entity_count', label: 'Complexity' },
];

const UNIT_OPTIONS = [
  { value: 'mm', label: 'Millimetres (mm)' },
  { value: 'cm', label: 'Centimetres (cm)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'ft', label: 'Feet (ft)' },
  { value: 'm', label: 'Metres (m)' },
];

function LoungeCADStudioInner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<CADProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<CADProject | null>(null);
  const [newProject, setNewProject] = useState({ name: '', description: '', units: 'mm', folder: '' });
  const [renameValue, setRenameValue] = useState('');

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cad_projects')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_template', false)
        .order(sortField, { ascending: sortDir === 'asc' }) as any;
      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user, sortField, sortDir]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);


  const folders = [...new Set(projects.map(p => p.folder).filter(Boolean))] as string[];

  const filtered = projects.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesFolder = filterFolder === 'all' || p.folder === filterFolder;
    return matchesSearch && matchesFolder;
  });

  const totalEntities = projects.reduce((sum, p) => sum + p.entity_count, 0);
  const totalLayers = projects.reduce((sum, p) => sum + p.layer_count, 0);
  const recentProject = projects.length > 0 ? projects.reduce((a, b) => new Date(a.updated_at) > new Date(b.updated_at) ? a : b) : null;

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) { toast.error('Please enter a project name'); return; }
    try {
      const { data, error } = await (supabase.from('cad_projects') as any).insert({
        user_id: user?.id,
        name: newProject.name.trim(),
        description: newProject.description.trim() || null,
        units: newProject.units,
        folder: newProject.folder.trim() || null,
        drawing_data: { entities: [], layers: [{ name: '0', color: '#FFFFFF', visible: true, locked: false, frozen: false, linetype: 'solid', lineweight: 1 }] },
        entity_count: 0,
        layer_count: 1,
      }).select().single();
      if (error) throw error;
      toast.success('Project created');
      setNewDialogOpen(false);
      setNewProject({ name: '', description: '', units: 'mm', folder: '' });
      navigate(`/lounge/cad-studio/edit?project=${data.id}`);
    } catch (err: any) {
      toast.error('Failed to create project: ' + (err.message || ''));
    }
  };

  const handleOpenProject = (proj: CADProject) => {
    navigate(`/lounge/cad-studio/edit?project=${proj.id}`);
  };

  const handleDuplicate = async (proj: CADProject) => {
    try {
      const { error } = await (supabase.from('cad_projects') as any).insert({
        user_id: user?.id,
        name: proj.name + ' (Copy)',
        description: proj.description,
        drawing_data: proj.drawing_data,
        entity_count: proj.entity_count,
        layer_count: proj.layer_count,
        units: proj.units,
        folder: proj.folder,
        tags: proj.tags,
      });
      if (error) throw error;
      toast.success('Project duplicated');
      fetchProjects();
    } catch { toast.error('Duplication failed'); }
  };

  const handleDelete = async () => {
    if (!selectedProject) return;
    try {
      const { error } = await supabase.from('cad_projects').delete().eq('id', selectedProject.id) as any;
      if (error) throw error;
      toast.success('Project deleted');
      setDeleteDialogOpen(false);
      setSelectedProject(null);
      fetchProjects();
    } catch { toast.error('Delete failed'); }
  };

  const handleRename = async () => {
    if (!selectedProject || !renameValue.trim()) return;
    try {
      const { error } = await (supabase.from('cad_projects') as any).update({ name: renameValue.trim() }).eq('id', selectedProject.id);
      if (error) throw error;
      toast.success('Project renamed');
      setRenameDialogOpen(false);
      setSelectedProject(null);
      fetchProjects();
    } catch { toast.error('Rename failed'); }
  };

  const handleExportJSON = (proj: CADProject) => {
    const blob = new Blob([JSON.stringify(proj.drawing_data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${proj.name}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Project exported');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10" aria-hidden>
        <span className="block h-5 w-32 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-3.5 w-64 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-border/60 bg-border/60 lg:grid-cols-4">
          {[0, 1, 2, 3].map(i => (
            <span key={i} className="block h-[72px] bg-card" />
          ))}
        </div>
        <span className="mt-4 block h-10 w-full animate-pulse rounded-[10px] bg-foreground/[0.05]" />
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonBlock key={i} className="h-52 rounded-[10px]" />
          ))}
        </div>
      </div>
    );
  }

  const facts = [
    { label: 'Projects', value: projects.length.toLocaleString() },
    { label: 'Entities', value: totalEntities.toLocaleString() },
    { label: 'Layers', value: totalLayers.toLocaleString() },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="space-y-6">
        {/* Header */}
        <PageHeader
          kicker="Client portal"
          title="CAD studio"
          description="Professional 2D and 3D drafting for your builds and projects"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => navigate('/lounge/cad-studio/edit')}>
                <Zap className="h-3.5 w-3.5" />
                Quick start
              </Button>
              <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => setNewDialogOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                New project
              </Button>
            </div>
          }
        />

        {/* Fact ledger */}
        <Panel className="overflow-hidden">
          <div className="grid grid-cols-2 gap-px bg-border/60 lg:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="bg-card px-4 py-3">
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{f.label}</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">{f.value}</p>
              </div>
            ))}
            <div className="bg-card px-4 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Last active</p>
              <p className="mt-1.5 text-[13px] font-medium">
                {recentProject ? <RelativeTime date={recentProject.updated_at} className="font-sans text-[13px] text-foreground" /> : 'No activity yet'}
              </p>
            </div>
          </div>
        </Panel>

        {/* Toolbar */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects by name or description"
              className={cn(FIELD, 'pl-10')}
            />
          </div>
          <div className="flex items-center gap-2">
            {folders.length > 0 && (
              <Select value={filterFolder} onValueChange={setFilterFolder}>
                <SelectTrigger className={cn(FIELD, 'w-[140px]')}>
                  <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="All folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All folders</SelectItem>
                  {folders.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className={cn(FIELD, 'w-[150px]')}>
                <ArrowUpDown className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-lg border-border/60"
              aria-label="Toggle sort direction"
              onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className={cn("h-4 w-4 transition-transform", sortDir === 'asc' && "rotate-180")} />
            </Button>
            <div className="flex h-10 items-center overflow-hidden rounded-lg border border-border/60">
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex h-full w-10 items-center justify-center transition-colors duration-150',
                  viewMode === 'grid' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={cn(
                  'flex h-full w-10 items-center justify-center border-l border-border/60 transition-colors duration-150',
                  viewMode === 'list' ? 'bg-foreground/[0.05] text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects */}
        {filtered.length === 0 ? (
          <Panel>
            <EmptyState
              title={search ? 'No matching projects' : 'No CAD projects yet'}
              body={search ? 'Try a different search or clear the folder filter.' : 'Create your first project to start drafting.'}
              action={search ? undefined : { label: 'Create project', onClick: () => setNewDialogOpen(true) }}
            />
          </Panel>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(proj => (
              <ProjectCard
                key={proj.id}
                project={proj}
                onOpen={handleOpenProject}
                onDuplicate={handleDuplicate}
                onExport={handleExportJSON}
                onRename={(p) => { setSelectedProject(p); setRenameValue(p.name); setRenameDialogOpen(true); }}
                onDelete={(p) => { setSelectedProject(p); setDeleteDialogOpen(true); }}
              />
            ))}
          </div>
        ) : (
          <Panel className="overflow-hidden">
            <ProjectTable
              projects={filtered}
              onOpen={handleOpenProject}
              onDuplicate={handleDuplicate}
              onExport={handleExportJSON}
              onRename={(p) => { setSelectedProject(p); setRenameValue(p.name); setRenameDialogOpen(true); }}
              onDelete={(p) => { setSelectedProject(p); setDeleteDialogOpen(true); }}
            />
          </Panel>
        )}
      </div>

      {/* New project dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="rounded-xl border-border/60 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">New CAD project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className={FIELD_LABEL}>Project name</Label>
              <Input placeholder="e.g., Floor Plan - Building A" value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label className={FIELD_LABEL}>Description</Label>
              <Textarea placeholder="Brief description of this project..." value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} className="min-h-[80px] rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={FIELD_LABEL}>Units</Label>
                <Select value={newProject.units} onValueChange={v => setNewProject(p => ({ ...p, units: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={FIELD_LABEL}>Folder (optional)</Label>
                <Input placeholder="e.g., Architecture" value={newProject.folder} onChange={e => setNewProject(p => ({ ...p, folder: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)} className="h-8 rounded-lg px-3 text-xs">Cancel</Button>
            <Button onClick={handleCreateProject} className="h-8 rounded-lg px-3 text-xs">Create and open</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete project"
        consequence={`This permanently deletes "${selectedProject?.name}". It cannot be undone.`}
        confirmLabel="Delete project"
        onConfirm={handleDelete}
      />

      {/* Rename dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="rounded-xl border-border/60 bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Rename project</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <Label className={FIELD_LABEL}>New name</Label>
            <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} autoFocus className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} className="h-8 rounded-lg px-3 text-xs">Cancel</Button>
            <Button onClick={handleRename} className="h-8 rounded-lg px-3 text-xs">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Project actions menu (shared by card and table row) ─── */
function ProjectActions({ project, onOpen, onDuplicate, onExport, onRename, onDelete }: {
  project: CADProject;
  onOpen: (p: CADProject) => void;
  onDuplicate: (p: CADProject) => void;
  onExport: (p: CADProject) => void;
  onRename: (p: CADProject) => void;
  onDelete: (p: CADProject) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Project actions"
          className="h-7 w-7 rounded-lg text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-[10px] border-border/60">
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(project); }} className="gap-2 text-xs">
          <Play className="h-3.5 w-3.5" /> Open project
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(project); }} className="gap-2 text-xs">
          <Pencil className="h-3.5 w-3.5" /> Rename
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(project); }} className="gap-2 text-xs">
          <Copy className="h-3.5 w-3.5" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExport(project); }} className="gap-2 text-xs">
          <Download className="h-3.5 w-3.5" /> Export JSON
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(project); }} className="gap-2 text-xs text-destructive">
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Project card (grid view) ─── */
function ProjectCard({ project, onOpen, onDuplicate, onExport, onRename, onDelete }: {
  project: CADProject;
  onOpen: (p: CADProject) => void;
  onDuplicate: (p: CADProject) => void;
  onExport: (p: CADProject) => void;
  onRename: (p: CADProject) => void;
  onDelete: (p: CADProject) => void;
}) {
  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-[10px] border border-border/60 bg-card transition-colors duration-150 hover:bg-foreground/[0.025]"
      onClick={() => onOpen(project)}
    >
      {/* Drawing well */}
      <div className="relative flex h-36 items-center justify-center border-b border-border/60 bg-foreground/[0.02]">
        {/* Static drafting grid */}
        <div className="absolute inset-0 opacity-[0.05]" aria-hidden>
          <svg width="100%" height="100%">
            <defs>
              <pattern id={`grid-${project.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${project.id})`} />
          </svg>
        </div>

        <div className="relative flex flex-col items-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-foreground/[0.04]">
            <PenTool className="h-5 w-5 text-ink-2" />
          </div>
          <span className="font-mono text-[10px] tabular-nums tracking-[0.08em] text-muted-foreground">
            {project.entity_count} entities
          </span>
        </div>

        <span className="absolute right-2.5 top-2.5 font-mono text-[10px] tabular-nums text-muted-foreground">
          v{project.version}
        </span>
        {project.folder && (
          <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-md border border-border/60 bg-card px-1.5 py-0.5 text-[10px] text-muted-foreground">
            <FolderOpen className="h-2.5 w-2.5" />
            {project.folder}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[13px] font-medium text-foreground">{project.name}</h3>
            {project.description && (
              <p className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">{project.description}</p>
            )}
          </div>
          <ProjectActions
            project={project}
            onOpen={onOpen}
            onDuplicate={onDuplicate}
            onExport={onExport}
            onRename={onRename}
            onDelete={onDelete}
          />
        </div>

        <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 tabular-nums"><Layers className="h-3 w-3" />{project.layer_count}</span>
          <span className="flex items-center gap-1"><Ruler className="h-3 w-3" />{project.units}</span>
          <RelativeTime date={project.updated_at} className="ml-auto" />
        </div>
      </div>
    </div>
  );
}

/* ─── Project table (list view) ─── */
function ProjectTable({ projects, onOpen, onDuplicate, onExport, onRename, onDelete }: {
  projects: CADProject[];
  onOpen: (p: CADProject) => void;
  onDuplicate: (p: CADProject) => void;
  onExport: (p: CADProject) => void;
  onRename: (p: CADProject) => void;
  onDelete: (p: CADProject) => void;
}) {
  const columns: Column<CADProject>[] = [
    {
      key: 'name',
      header: 'Project',
      render: (p) => (
        <span className="block min-w-0 py-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-[13px] font-medium text-foreground">{p.name}</span>
            {p.folder && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <FolderOpen className="h-2.5 w-2.5" />
                {p.folder}
              </span>
            )}
          </span>
          {p.description && (
            <span className="block truncate text-[11.5px] text-muted-foreground">{p.description}</span>
          )}
        </span>
      ),
    },
    {
      key: 'entities',
      header: 'Entities',
      align: 'right',
      mono: true,
      hideBelowMd: true,
      render: (p) => (
        <span className="inline-flex items-center gap-1 text-muted-foreground"><Box className="h-3 w-3" />{p.entity_count}</span>
      ),
    },
    {
      key: 'layers',
      header: 'Layers',
      align: 'right',
      mono: true,
      hideBelowMd: true,
      render: (p) => (
        <span className="inline-flex items-center gap-1 text-muted-foreground"><Layers className="h-3 w-3" />{p.layer_count}</span>
      ),
    },
    {
      key: 'units',
      header: 'Units',
      mono: true,
      hideBelowMd: true,
      render: (p) => <span className="text-muted-foreground">{p.units}</span>,
    },
    {
      key: 'version',
      header: 'Version',
      mono: true,
      hideBelowMd: true,
      render: (p) => <span className="text-muted-foreground">v{p.version}</span>,
    },
    {
      key: 'updated',
      header: 'Updated',
      align: 'right',
      render: (p) => <RelativeTime date={p.updated_at} />,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '52px',
      render: (p) => (
        <ProjectActions
          project={p}
          onOpen={onOpen}
          onDuplicate={onDuplicate}
          onExport={onExport}
          onRename={onRename}
          onDelete={onDelete}
        />
      ),
    },
  ];

  return (
    <DataTable
      rows={projects}
      columns={columns}
      rowKey={(p) => p.id}
      onRowClick={onOpen}
      aria-label="CAD projects"
    />
  );
}

export default function LoungeCADStudio() {
  return (
    <SubscriptionPaywall
      featureKey="cad-studio"
      featureDescription="Professional 2D/3D drafting, floor plan generation, and engineering design tools for your business."
      icon={PenTool}
    >
      <LoungeCADStudioInner />
    </SubscriptionPaywall>
  );
}
