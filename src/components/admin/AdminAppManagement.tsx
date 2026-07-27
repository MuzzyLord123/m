import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout, Plus, Search, Filter, Edit2, Trash2, Save, X,
  Calendar, Clock, Target, Code, ExternalLink, GitBranch,
  CheckCircle, AlertCircle, Loader2, Users, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  { value: 'web_app', label: 'Web Application' },
  { value: 'internal_tool', label: 'Internal Tool' },
  { value: 'client_portal', label: 'Client Portal' },
  { value: 'inventory_system', label: 'Inventory System' },
  { value: 'database', label: 'Database System' },
  { value: 'workflow', label: 'Workflow Tool' },
  { value: 'mvp', label: 'MVP / Prototype' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'planning', label: 'Planning', color: 'bg-slate-500' },
  { value: 'design', label: 'Design', color: 'bg-purple-500' },
  { value: 'development', label: 'Development', color: 'bg-blue-500' },
  { value: 'testing', label: 'Testing', color: 'bg-amber-500' },
  { value: 'review', label: 'Client Review', color: 'bg-orange-500' },
  { value: 'deployed', label: 'Deployed', color: 'bg-emerald-500' },
  { value: 'maintenance', label: 'Maintenance', color: 'bg-teal-500' },
  { value: 'on_hold', label: 'On Hold', color: 'bg-gray-500' },
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
];

const priorityOptions = [
  { value: 'low', label: 'Low', color: 'text-slate-500' },
  { value: 'normal', label: 'Normal', color: 'text-blue-500' },
  { value: 'high', label: 'High', color: 'text-orange-500' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-500' },
];

const statusColors: Record<string, string> = {
  planning: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  design: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  development: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  testing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  review: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  deployed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  maintenance: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  on_hold: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
};

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
    return client?.full_name || client?.email || 'Unknown Client';
  };

  const getClientCompany = (userId: string) => {
    const client = clients.find(c => c.user_id === userId);
    return client?.company;
  };

  const getTypeLabel = (type: string) => {
    return projectTypes.find(t => t.value === type)?.label || type;
  };

  const getStatusLabel = (status: string) => {
    return statusOptions.find(s => s.value === status)?.label || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">App Projects</h2>
          <p className="text-muted-foreground">Manage custom applications, dashboards, and systems</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {projectTypes.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="p-12 text-center">
          <Layout className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">No projects found</h3>
          <p className="text-muted-foreground mb-4">Create your first app project to get started</p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="h-full hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{project.project_name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3" />
                        {getClientName(project.user_id)}
                        {getClientCompany(project.user_id) && (
                          <span className="text-xs">• {getClientCompany(project.user_id)}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[project.status] || 'bg-muted'}>
                      {getStatusLabel(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Code className="w-4 h-4" />
                    <span>{getTypeLabel(project.project_type)}</span>
                  </div>
                  
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {project.estimated_hours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {project.estimated_hours}h est.
                      </span>
                    )}
                    {project.target_completion_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(project.target_completion_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(project)}
                    >
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProject(project);
                        setShowDeleteDialog(true);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create App Project</DialogTitle>
            <DialogDescription>Add a new custom application, dashboard, or system for a client</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Client *</Label>
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
              <Label>Project Name *</Label>
              <Input
                value={formData.project_name}
                onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                placeholder="e.g., Inventory Management System"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Project Type</Label>
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
                <Label>Priority</Label>
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
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe the project scope and objectives..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                  placeholder="e.g., 40"
                />
              </div>
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Target Completion</Label>
                <Input
                  type="date"
                  value={formData.target_completion_date}
                  onChange={(e) => setFormData({...formData, target_completion_date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Client Notes (visible to client)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Notes visible to the client..."
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Admin Notes (internal only)</Label>
              <Textarea
                value={formData.admin_notes}
                onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                placeholder="Internal notes for the team..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Preview URL</Label>
                <Input
                  value={formData.preview_url}
                  onChange={(e) => setFormData({...formData, preview_url: e.target.value})}
                  placeholder="https://preview.example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label>Assigned To</Label>
                <Input
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                  placeholder="Team member name"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit App Project</DialogTitle>
            <DialogDescription>Update project details and status</DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Project Name *</Label>
              <Input
                value={formData.project_name}
                onChange={(e) => setFormData({...formData, project_name: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Project Type</Label>
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
                <Label>Status</Label>
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
                <Label>Priority</Label>
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
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({...formData, estimated_hours: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Target Completion</Label>
                <Input
                  type="date"
                  value={formData.target_completion_date}
                  onChange={(e) => setFormData({...formData, target_completion_date: e.target.value})}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Client Notes (visible to client)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={2}
              />
            </div>

            <div className="grid gap-2">
              <Label>Admin Notes (internal only)</Label>
              <Textarea
                value={formData.admin_notes}
                onChange={(e) => setFormData({...formData, admin_notes: e.target.value})}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Preview URL</Label>
                <Input
                  value={formData.preview_url}
                  onChange={(e) => setFormData({...formData, preview_url: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Production URL</Label>
                <Input
                  value={formData.production_url}
                  onChange={(e) => setFormData({...formData, production_url: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Repository URL</Label>
                <Input
                  value={formData.repository_url}
                  onChange={(e) => setFormData({...formData, repository_url: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label>Assigned To</Label>
                <Input
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEditDialog(false); setSelectedProject(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedProject?.project_name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDeleteDialog(false); setSelectedProject(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
