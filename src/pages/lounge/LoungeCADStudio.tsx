import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PenTool, Plus, Search, MoreVertical, Trash2, Copy, Pencil,
  FolderOpen, Clock, Layers, Box, ArrowUpDown, Grid3X3, List,
  Download, Play, Filter, Ruler, ArrowRight, Zap, Activity
} from 'lucide-react';
import { SubscriptionPaywall } from '@/components/lounge/SubscriptionPaywall';
import { CADSplash } from '@/components/splash/CADSplash';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { SkeletonLoading } from '@/components/lounge/SkeletonLoading';
import { EmptyState } from '@/components/lounge/EmptyState';

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
  { value: 'updated_at', label: 'Last Modified' },
  { value: 'created_at', label: 'Date Created' },
  { value: 'name', label: 'Name' },
  { value: 'entity_count', label: 'Complexity' },
];

const UNIT_OPTIONS = [
  { value: 'mm', label: 'Millimeters (mm)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'ft', label: 'Feet (ft)' },
  { value: 'm', label: 'Meters (m)' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <SkeletonLoading variant="detail" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Projects', value: projects.length, icon: FolderOpen, accent: 'text-primary' },
    { label: 'Total Entities', value: totalEntities.toLocaleString(), icon: Box, accent: 'text-emerald-400' },
    { label: 'Total Layers', value: totalLayers, icon: Layers, accent: 'text-blue-400' },
    { label: 'Last Active', value: recentProject ? formatDistanceToNow(new Date(recentProject.updated_at), { addSuffix: true }) : 'Never', icon: Activity, accent: 'text-amber-400', isText: true },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
        {/* Header */}
        <LoungePageHeader
          title="CAD Studio"
          description="Professional 2D/3D drafting — manage your builds and projects"
          icon={PenTool}
          badge="PRO"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => navigate('/lounge/cad-studio/edit')}>
                <Zap className="w-4 h-4" />
                Quick Start
              </Button>
              <Button size="sm" className="gap-2 rounded-xl" onClick={() => setNewDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                New Project
              </Button>
            </div>
          }
        />

        {/* Stats Row — enterprise glass cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="relative overflow-hidden rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 group hover:border-border transition-all">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center shrink-0">
                  <s.icon className={cn("w-5 h-5", s.accent)} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                  <p className={cn("font-semibold truncate mt-0.5", s.isText ? 'text-sm' : 'text-xl')}>{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Toolbar — CRM-grade filter bar */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search projects by name or description..."
              className="pl-10 h-10 rounded-xl bg-card/60 border-border/60 focus:border-primary/40"
            />
          </div>
          <div className="flex items-center gap-2">
            {folders.length > 0 && (
              <Select value={filterFolder} onValueChange={setFilterFolder}>
                <SelectTrigger className="w-[140px] h-10 rounded-xl bg-card/60 border-border/60">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground/60" />
                  <SelectValue placeholder="All Folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  {folders.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
              <SelectTrigger className="w-[150px] h-10 rounded-xl bg-card/60 border-border/60">
                <ArrowUpDown className="w-3.5 h-3.5 mr-1.5 text-muted-foreground/60" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-border/60" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
              <ArrowUpDown className={cn("h-4 w-4 transition-transform", sortDir === 'asc' && "rotate-180")} />
            </Button>
            <div className="h-6 w-px bg-border/40" />
            <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="icon" className="h-10 w-10 rounded-xl border-border/60" onClick={() => setViewMode('grid')}>
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="icon" className="h-10 w-10 rounded-xl border-border/60" onClick={() => setViewMode('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Projects */}
        <motion.div variants={itemVariants}>
          {filtered.length === 0 ? (
            <EmptyState
              icon={PenTool}
              title={search ? 'No matching projects' : 'No CAD projects yet'}
              description={search ? 'Try adjusting your search query.' : 'Create your first project to start drafting in the immersive 3D CAD environment.'}
              actionLabel={search ? undefined : 'Create First Project'}
              onAction={search ? undefined : () => setNewDialogOpen(true)}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            <div className="rounded-xl border border-border/60 overflow-hidden bg-card/40">
              {filtered.map((proj, i) => (
                <ProjectRow
                  key={proj.id}
                  project={proj}
                  isLast={i === filtered.length - 1}
                  onOpen={handleOpenProject}
                  onDuplicate={handleDuplicate}
                  onExport={handleExportJSON}
                  onRename={(p) => { setSelectedProject(p); setRenameValue(p.name); setRenameDialogOpen(true); }}
                  onDelete={(p) => { setSelectedProject(p); setDeleteDialogOpen(true); }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* FAB — New Project */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-2xl shadow-2xl shadow-primary/20"
          onClick={() => setNewDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* New Project Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenTool className="w-5 h-5 text-primary" />
              New CAD Project
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input placeholder="e.g., Floor Plan - Building A" value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Brief description of this project..." value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} className="min-h-[80px] rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Units</Label>
                <Select value={newProject.units} onValueChange={v => setNewProject(p => ({ ...p, units: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Folder (optional)</Label>
                <Input placeholder="e.g., Architecture" value={newProject.folder} onChange={e => setNewProject(p => ({ ...p, folder: e.target.value }))} className="rounded-xl" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleCreateProject} className="rounded-xl">Create & Open</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">"{selectedProject?.name}"</span>? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="rounded-xl">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <Label>New Name</Label>
            <Input value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRename()} autoFocus className="rounded-xl" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button onClick={handleRename} className="rounded-xl">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── Project Card (Grid View) — Enterprise with hover overlay ─── */
function ProjectCard({ project, onOpen, onDuplicate, onExport, onRename, onDelete }: {
  project: CADProject;
  onOpen: (p: CADProject) => void;
  onDuplicate: (p: CADProject) => void;
  onExport: (p: CADProject) => void;
  onRename: (p: CADProject) => void;
  onDelete: (p: CADProject) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <div
        className="group relative cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
        onClick={() => onOpen(project)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Thumbnail area */}
        <div className="relative h-40 bg-gradient-to-br from-muted/30 via-muted/20 to-background flex items-center justify-center overflow-hidden">
          {/* Animated grid pattern */}
          <div className="absolute inset-0 opacity-[0.06]">
            <svg width="100%" height="100%">
              <defs>
                <pattern id={`grid-${project.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill={`url(#grid-${project.id})`} />
            </svg>
          </div>

          {/* Center icon + entity count */}
          <div className="relative flex flex-col items-center gap-2 transition-all duration-300 group-hover:scale-95 group-hover:opacity-40">
            <div className="h-12 w-12 rounded-2xl bg-muted/40 flex items-center justify-center">
              <PenTool className="w-6 h-6 text-muted-foreground/30" />
            </div>
            <span className="text-[10px] text-muted-foreground/40 font-mono tracking-wider">{project.entity_count} entities</span>
          </div>

          {/* Hover overlay — "Enter CAD Studio" */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] flex items-center justify-center"
              >
                <motion.div
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 8, opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium text-sm shadow-xl shadow-primary/30"
                >
                  Enter CAD Studio
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Version badge */}
          <Badge variant="secondary" className="absolute top-2.5 right-2.5 text-[10px] h-5 rounded-lg bg-background/60 backdrop-blur-sm border-border/40">
            v{project.version}
          </Badge>
          {project.folder && (
            <Badge variant="outline" className="absolute top-2.5 left-2.5 text-[10px] h-5 gap-1 rounded-lg bg-background/60 backdrop-blur-sm border-border/40">
              <FolderOpen className="w-2.5 h-2.5" />
              {project.folder}
            </Badge>
          )}
        </div>

        {/* Info area */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[13px] truncate">{project.name}</h3>
              {project.description && (
                <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-1">{project.description}</p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(project); }} className="gap-2 rounded-lg">
                  <Play className="h-3.5 w-3.5" /> Enter CAD Studio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(project); }} className="gap-2 rounded-lg">
                  <Pencil className="h-3.5 w-3.5" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(project); }} className="gap-2 rounded-lg">
                  <Copy className="h-3.5 w-3.5" /> Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExport(project); }} className="gap-2 rounded-lg">
                  <Download className="h-3.5 w-3.5" /> Export JSON
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(project); }} className="gap-2 text-destructive rounded-lg">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground/60">
            <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{project.layer_count}</span>
            <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{project.units}</span>
            <span className="ml-auto text-muted-foreground/40">{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Project Row (List View) — Enterprise with hover CTA ─── */
function ProjectRow({ project, isLast, onOpen, onDuplicate, onExport, onRename, onDelete }: {
  project: CADProject;
  isLast: boolean;
  onOpen: (p: CADProject) => void;
  onDuplicate: (p: CADProject) => void;
  onExport: (p: CADProject) => void;
  onRename: (p: CADProject) => void;
  onDelete: (p: CADProject) => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-4 px-5 py-4 hover:bg-muted/20 cursor-pointer transition-all",
        !isLast && "border-b border-border/40"
      )}
      onClick={() => onOpen(project)}
    >
      <div className="h-11 w-11 rounded-xl bg-muted/40 flex items-center justify-center flex-shrink-0">
        <PenTool className="w-4.5 h-4.5 text-muted-foreground/50" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-medium truncate">{project.name}</h3>
          {project.folder && (
            <Badge variant="outline" className="text-[10px] h-4 gap-0.5 flex-shrink-0 rounded-md border-border/40">
              <FolderOpen className="w-2.5 h-2.5" />
              {project.folder}
            </Badge>
          )}
        </div>
        {project.description && (
          <p className="text-xs text-muted-foreground/50 truncate mt-0.5">{project.description}</p>
        )}
      </div>

      {/* Hover CTA */}
      <span className="hidden group-hover:flex items-center gap-1.5 text-xs text-primary font-medium flex-shrink-0 transition-all">
        Enter CAD Studio <ArrowRight className="w-3.5 h-3.5" />
      </span>

      <div className="hidden md:flex group-hover:hidden items-center gap-4 text-xs text-muted-foreground/50 flex-shrink-0">
        <span className="flex items-center gap-1"><Box className="w-3 h-3" />{project.entity_count}</span>
        <span className="flex items-center gap-1"><Layers className="w-3 h-3" />{project.layer_count}</span>
        <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{project.units}</span>
        <Badge variant="secondary" className="text-[10px] h-5 rounded-md">v{project.version}</Badge>
      </div>

      <span className="hidden lg:block group-hover:hidden text-xs text-muted-foreground/40 flex-shrink-0 w-28 text-right">
        {format(new Date(project.updated_at), 'MMM d, yyyy')}
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-xl">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpen(project); }} className="gap-2 rounded-lg">
            <Play className="h-3.5 w-3.5" /> Enter CAD Studio
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(project); }} className="gap-2 rounded-lg">
            <Pencil className="h-3.5 w-3.5" /> Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate(project); }} className="gap-2 rounded-lg">
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onExport(project); }} className="gap-2 rounded-lg">
            <Download className="h-3.5 w-3.5" /> Export JSON
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(project); }} className="gap-2 text-destructive rounded-lg">
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
