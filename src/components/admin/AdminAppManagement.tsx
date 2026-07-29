import { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, Save,
  Clock, Code, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  PageHeader, Panel, DataTable, StatusBadge, ConfirmDialog, SkeletonTable,
  type Column, type Tone,
} from '@/components/platform';

interface AppProject {
  id: string;
  user_id: string;
  project_name: string;
  project_type: string;
  description: string | null;
  status: string;
  priority: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  start_date: string | null;
  target_completion_date: string | null;
  completed_at: string | null;
  features: unknown[];
  tech_stack: unknown[];
  milestones: unknown[];
  notes: string | null;
  admin_notes: string | null;
  preview_url: string | null;
  production_url: string | null;
  repository_url: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
}

const projectTypes = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'web_app', label: 'Web application' },
  { value: 'internal_tool', label: 'Internal tool' },
  { value: 'client_portal', label: 'Client portal' },
  { value: 'inventory_system', label: 'Inventory system' },
  { value: 'database', label: 'Database system' },
  { value: 'workflow', label: 'Workflow tool' },
  { value: 'mvp', label: 'MVP / prototype' },
  { value: 'other', label: 'Other' },
];

/* Project stages on the platform tone vocabulary — the nine-hue rainbow
   is gone. Accent marks the stages in motion. */
const statusOptions: { value: string; label: string; tone: Tone }[] = [
  { value: 'planning', label: 'Planning', tone: 'neutral' },
  { value: 'design', label: 'Design', tone: 'neutral' },
  { value: 'development', label: 'Development', tone: 'accent' },
  { value: 'testing', label: 'Testing', tone: 'accent' },
  { value: 'review', label: 'Client review', tone: 'attend' },
  { value: 'deployed', label: 'Deployed', tone: 'ok' },
  { value: 'maintenance', label: 'Maintenance', tone: 'ok' },
  { value: 'on_hold', label: 'On hold', tone: 'neutral' },
  { value: 'completed', label: 'Completed', tone: 'ok' },
];

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

export default function AdminAppManagement() {
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<AppProject | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    user_id: '',
    project_name: '',
    project_type: 'dashboard',
    description: '',
    status: 'planning',
    priority: 'normal',
    estimated_hours: '',
    start_date: '',
    target_completion_date: '',
    notes: '',
    admin_notes: '',
    preview_url: '',
    production_url: '',
    repository_url: '',
    assigned_to: '',
  });

  useEffect(() => {
    fetchProjects();
    fetchClients();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('app_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load app projects');
    } else {
      setProjects((data || []).map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
        tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack : [],
        milestones: Array.isArray(p.milestones) ? p.milestones : [],
      })));
    }
    setLoading(false);
  };

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, email, company')
      .order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching clients:', error);
    } else {
      setClients(data || []);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesType = typeFilter === 'all' || project.project_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const resetForm = () => {
    setFormData({
      user_id: '',
      project_name: '',
      project_type: 'dashboard',
      description: '',
      status: 'planning',
      priority: 'normal',
      estimated_hours: '',
      start_date: '',
      target_completion_date: '',
      notes: '',
      admin_notes: '',
      preview_url: '',
      production_url: '',
      repository_url: '',
      assigned_to: '',
    });
  };

  const handleCreate = async () => {
    if (!formData.user_id || !formData.project_name) {
      toast.error('Please select a client and enter a project name');
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('app_projects').insert({
      user_id: formData.user_id,
      project_name: formData.project_name,
      project_type: formData.project_type,
      description: formData.description || null,
      status: formData.status,
      priority: formData.priority,
      estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
      start_date: formData.start_date || null,
      target_completion_date: formData.target_completion_date || null,
      notes: formData.notes || null,
      admin_notes: formData.admin_notes || null,
      preview_url: formData.preview_url || null,
      production_url: formData.production_url || null,
      repository_url: formData.repository_url || null,
      assigned_to: formData.assigned_to || null,
    });

    if (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } else {
      toast.success('App project created');
      setShowCreateDialog(false);
      resetForm();
      fetchProjects();
    }
    setSaving(false);
  };

  const handleEdit = (project: AppProject) => {
    setSelectedProject(project);
    setFormData({
      user_id: project.user_id,
      project_name: project.project_name,
      project_type: project.project_type,
      description: project.description || '',
      status: project.status,
      priority: project.priority || 'normal',
      estimated_hours: project.estimated_hours?.toString() || '',
      start_date: project.start_date || '',
      target_completion_date: project.target_completion_date || '',
      notes: project.notes || '',
      admin_notes: project.admin_notes || '',
      preview_url: project.preview_url || '',
      production_url: project.production_url || '',
      repository_url: project.repository_url || '',
      assigned_to: project.assigned_to || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!selectedProject) return;

    setSaving(true);
    const { error } = await supabase
      .from('app_projects')
      .update({
        project_name: formData.project_name,
        project_type: formData.project_type,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null,
        start_date: formData.start_date || null,
        target_completion_date: formData.target_completion_date || null,
        notes: formData.notes || null,
        admin_notes: formData.admin_notes || null,
        preview_url: formData.preview_url || null,
        production_url: formData.production_url || null,
        repository_url: formData.repository_url || null,
        assigned_to: formData.assigned_to || null,
        completed_at: formData.status === 'completed' ? new Date().toISOString() : null,
      })
      .eq('id', selectedProject.id);

    if (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    } else {
      toast.success('Project updated');
      setShowEditDialog(false);
      setSelectedProject(null);
      resetForm();
      fetchProjects();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedProject) return;

    setSaving(true);
    const { error } = await supabase
      .from('app_projects')
      .delete()
      .eq('id', selectedProject.id);

    if (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } else {
      toast.success('Project deleted');
      setShowDeleteDialog(false);
      setSelectedProject(null);
      fetchProjects();
    }
    setSaving(false);
  };

  const getClientName = (userId: string) => {
    const client = clients.find(c => c.user_id === userId);
    return client?.full_name || client?.email || 'Unknown client';
  };

  const getClientCompany = (userId: string) => {
    const client = clients.find(c => c.user_id === userId);
    return client?.company;
  };

  const getTypeLabel = (type: string) => {
    return projectTypes.find(t => t.value === type)?.label || type;
  };

  const statusMeta = (status: string) =>
    statusOptions.find(s => s.value === status) || { label: status, tone: 'neutral' as Tone };

  const LABEL = 'font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground';

  const columns: Column<AppProject>[] = [
    {
      key: 'name',
      header: 'Project',
      sortValue: (p) => p.project_name.toLowerCase(),
      render: (project) => (
        <div className="min-w-0 py-1">
          <p className="truncate text-[13px] font-medium text-foreground">{project.project_name}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {getClientName(project.user_id)}
            {getClientCompany(project.user_id) && <> · {getClientCompany(project.user_id)}</>}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      hideBelowMd: true,
      sortValue: (p) => p.project_type,
      render: (project) => (
        <span className="flex items-center gap-1.5 text-[12px] text-ink-2">
          <Code className="h-3 w-3 text-muted-foreground" aria-hidden />
          {getTypeLabel(project.project_type)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortValue: (p) => p.status,
      render: (project) => {
        const sc = statusMeta(project.status);
        return <StatusBadge tone={sc.tone} label={sc.label} />;
      },
    },
    {
      key: 'hours',
      header: 'Est.',
      align: 'right',
      mono: true,
      hideBelowMd: true,
      sortValue: (p) => p.estimated_hours ?? -1,
      render: (project) => (
        <span className="text-muted-foreground">
          {project.estimated_hours ? `${project.estimated_hours}h` : '·'}
        </span>
      ),
    },
    {
      key: 'target',
      header: 'Target',
      mono: true,
      hideBelowMd: true,
      sortValue: (p) => p.target_completion_date || '',
      render: (project) => (
        <span className="text-muted-foreground">
          {project.target_completion_date
            ? format(new Date(project.target_completion_date), 'd MMM yyyy')
            : '·'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (project) => (
        <span onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Edit project"
            onClick={() => handleEdit(project)}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-risk hover:text-risk"
            aria-label="Delete project"
            onClick={() => {
              setSelectedProject(project);
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="space-y-4" aria-busy>
        <PageHeader kicker="Quooro office" title="App projects" description="Custom applications, dashboards and systems." />
        <Panel>
          <SkeletonTable cols={5} rows={6} />
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader
        kicker="Quooro office"
        title="App projects"
        description="Custom applications, dashboards and systems."
        actions={
          <Button className="h-8 rounded-lg px-3 text-xs" onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-3.5 w-3.5" />
            New project
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 pl-9 text-[13px]"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-8 w-full text-[13px] sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-8 w-full text-[13px] sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {projectTypes.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Table */}
      <Panel className="overflow-hidden">
        <DataTable
          rows={filteredProjects}
          columns={columns}
          rowKey={(p) => p.id}
          onRowClick={handleEdit}
          aria-label="App projects"
          defaultSort={{ key: 'target', dir: 'asc' }}
          empty={{
            title: 'No projects found',
            body: 'Create your first app project to get started.',
            action: { label: 'Create project', onClick: () => setShowCreateDialog(true) },
          }}
          mobileCard={(project) => {
            const sc = statusMeta(project.status);
            return (
              <button
                type="button"
                onClick={() => handleEdit(project)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors duration-150 active:bg-foreground/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-foreground">{project.project_name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{getClientName(project.user_id)}</p>
                  <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px] tabular-nums text-muted-foreground">
                    {project.estimated_hours && (
                      <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" aria-hidden />{project.estimated_hours}h</span>
                    )}
                    {project.target_completion_date && (
                      <span>{format(new Date(project.target_completion_date), 'd MMM yyyy')}</span>
                    )}
                  </p>
                </div>
                <StatusBadge tone={sc.tone} label={sc.label} className="shrink-0 text-[10.5px]" />
              </button>
            );
          }}
        />
      </Panel>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-xl border-border/60 bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Create app project</DialogTitle>
            <DialogDescription className="text-[13px]">Add a new custom application, dashboard or system for a client</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className={LABEL}>Client (required)</Label>
              <Select value={formData.user_id} onValueChange={(v) => setFormData({...formData, user_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.user_id} value={client.user_id}>
                      {client.full_name || client.email} {client.company && `(${client.company})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label className={LABEL}>Project name (required)</Label>
              <Input
                value={formData.project_name}
                onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                placeholder="e.g. Inventory management system"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className={LABEL}>Project type</Label>
                <Select value={formData.project_type} onValueChange={(v) => setFormData({...formData, project_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className={LABEL}>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className={LABEL}>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the project scope and objectives…"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label className={LABEL}>Estimated hours</Label>
                <Input
                  type="number"
                  className="tabular-nums"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                  placeholder="e.g. 40"
                />
              </div>
              <div className="grid gap-2">
                <Label className={LABEL}>Start date</Label>
                <Input
                  type="date"
                  className="tabular-nums"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label className={LABEL}>Target completion</Label>
                <Input
                  type="date"
                  className="tabular-nums"
                  value={formData.target_completion_date}
                  onChange={(e) => setFormData({...formData, target_completion_date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className={LABEL}>Client notes (visible to client)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Notes visible to the client…"
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label className={LABEL}>Admin notes (internal only)</Label>
              <Textarea
                value={formData.admin_notes}
                onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                placeholder="Internal notes for the team…"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className={LABEL}>Preview URL</Label>
                <Input
                  value={formData.preview_url}
                  onChange={(e) => setFormData({...formData, preview_url: e.target.value})}
                  placeholder="https://preview.example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label className={LABEL}>Assigned to</Label>
                <Input
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                  placeholder="Team member name"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button className="h-8 rounded-lg px-3 text-xs" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
              Create project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] w-[95vw] overflow-y-auto rounded-xl border-border/60 bg-card sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Edit app project</DialogTitle>
            <DialogDescription className="text-[13px]">Update project details and status</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className={LABEL}>Project name (required)</Label>
              <Input
                value={formData.project_name}
                onChange={(e) => setFormData({...formData, project_name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label className={LABEL}>Project type</Label>
                <Select value={formData.project_type} onValueChange={(v) => setFormData({...formData, project_type: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className={LABEL}>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className={LABEL}>Priority</Label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({...formData, priority: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className={LABEL}>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label className={LABEL}>Estimated hours</Label>
                <Input
                  type="number"
                  className="tabular-nums"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label className={LABEL}>Start date</Label>
                <Input
                  type="date"
                  className="tabular-nums"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label className={LABEL}>Target completion</Label>
                <Input
                  type="date"
                  className="tabular-nums"
                  value={formData.target_completion_date}
                  onChange={(e) => setFormData({...formData, target_completion_date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className={LABEL}>Client notes (visible to client)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label className={LABEL}>Admin notes (internal only)</Label>
              <Textarea
                value={formData.admin_notes}
                onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className={LABEL}>Preview URL</Label>
                <Input
                  value={formData.preview_url}
                  onChange={(e) => setFormData({...formData, preview_url: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label className={LABEL}>Production URL</Label>
                <Input
                  value={formData.production_url}
                  onChange={(e) => setFormData({...formData, production_url: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className={LABEL}>Repository URL</Label>
                <Input
                  value={formData.repository_url}
                  onChange={(e) => setFormData({...formData, repository_url: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label className={LABEL}>Assigned to</Label>
                <Input
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => { setShowEditDialog(false); setSelectedProject(null); resetForm(); }}>
              Cancel
            </Button>
            <Button className="h-8 rounded-lg px-3 text-xs" onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={(o) => { setShowDeleteDialog(o); if (!o) setSelectedProject(null); }}
        title="Delete this project?"
        consequence={`This permanently deletes "${selectedProject?.project_name || ''}" and its record for the client. It can't be undone.`}
        confirmLabel="Delete project"
        loading={saving}
        onConfirm={handleDelete}
      />
    </div>
  );
}
