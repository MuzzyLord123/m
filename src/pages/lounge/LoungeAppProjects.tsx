import { useState, useEffect } from 'react';
import {
  Layout, Code, Clock, Calendar, Target, ExternalLink,
  ChevronRight, Shield, Server, History, Palette, Eye, Rocket, Wrench, Box,
  RefreshCw, Plus, FileCode, ArrowLeft, TestTube, FolderOpen, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  PageHeader, Panel, PanelHeader, StatusBadge, StatusDot, statusTone, statusLabel,
  EmptyState, SkeletonLedger, FIELD, FIELD_LABEL,
} from '@/components/platform';

interface Milestone {
  name: string;
  status: 'completed' | 'current' | 'pending';
  date?: string;
  description?: string;
}

interface Feature {
  name: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface AppProject {
  id: string;
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
  features: Feature[];
  milestones: Milestone[];
  notes: string | null;
  preview_url: string | null;
  production_url: string | null;
  created_at: string;
  updated_at: string;
  tech_stack: string[] | null;
}

const projectTypes: Record<string, { label: string; icon: typeof Layout }> = {
  dashboard: { label: 'Dashboard', icon: Layout },
  web_app: { label: 'Web application', icon: Code },
  internal_tool: { label: 'Internal tool', icon: Wrench },
  client_portal: { label: 'Client portal', icon: Shield },
  inventory_system: { label: 'Inventory system', icon: Box },
  database: { label: 'Database system', icon: Server },
  workflow: { label: 'Workflow tool', icon: RefreshCw },
  mvp: { label: 'MVP / prototype', icon: Rocket },
  other: { label: 'Custom build', icon: FileCode },
};

/** How far through the build each status sits (presentation only). */
const statusProgress: Record<string, number> = {
  planning: 10,
  design: 25,
  development: 50,
  testing: 75,
  review: 85,
  deployed: 95,
  maintenance: 100,
  on_hold: 0,
  completed: 100,
};

const statusSteps = [
  { key: 'planning', label: 'Planning', icon: Target, description: 'Defining project scope and requirements' },
  { key: 'design', label: 'Design', icon: Palette, description: 'Creating the user interface and experience' },
  { key: 'development', label: 'Development', icon: Code, description: 'Building the application with clean code' },
  { key: 'testing', label: 'Testing', icon: TestTube, description: 'Quality assurance and bug fixing' },
  { key: 'deployed', label: 'Deployed', icon: Rocket, description: 'Live and accessible in production' },
];

const TAB_TRIGGER =
  'relative -mb-px gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] text-muted-foreground shadow-none transition-colors duration-150 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none';

export default function LoungeAppProjects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<AppProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<AppProject | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changeForm, setChangeForm] = useState({ title: '', description: '' });

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('app_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } else {
      setProjects((data || []).map(p => ({
        ...p,
        features: Array.isArray(p.features) ? p.features as unknown as Feature[] : [],
        milestones: Array.isArray(p.milestones) ? p.milestones as unknown as Milestone[] : [],
        tech_stack: Array.isArray(p.tech_stack) ? p.tech_stack as string[] : null,
      })));
    }
    setLoading(false);
  };

  const handleSubmitChangeRequest = async () => {
    if (!changeForm.title.trim() || !selectedProject) {
      toast.error('Please enter a title for your request');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('content_requests').insert({
        user_id: user?.id,
        request_type: 'app_change',
        title: `[${selectedProject.project_name}] ${changeForm.title.trim()}`,
        description: changeForm.description.trim() || null,
      });

      if (error) throw error;

      toast.success('Change request submitted successfully');
      setDialogOpen(false);
      setChangeForm({ title: '', description: '' });
    } catch (error) {
      console.error('Error submitting change request:', error);
      toast.error('Failed to submit change request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusConfig = (status: string) => ({
    progress: statusProgress[status] ?? statusProgress.planning,
  });

  const getProjectTypeConfig = (type: string) => {
    return projectTypes[type] || projectTypes.other;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-6 w-48 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-4 w-72 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-6 rounded-[10px] border border-border/60">
          <SkeletonLedger rows={4} />
        </div>
      </div>
    );
  }

  // No projects state
  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
        <PageHeader
          kicker="Projects"
          title="App projects"
          description="Track your custom applications and systems"
        />
        <Panel className="mt-6">
          <EmptyState
            title="No app projects yet"
            body="When you commission a custom application, dashboard or system, it appears here with live progress updates."
          />
        </Panel>
      </div>
    );
  }

  // Project detail view with tabs
  if (selectedProject) {
    const typeConfig = getProjectTypeConfig(selectedProject.project_type);
    const currentStepIndex = statusSteps.findIndex(s => s.key === selectedProject.status);

    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
        <div className="space-y-5">
          {/* Header */}
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 mb-3 h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedProject(null)}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to projects
            </Button>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <PageHeader
                kicker={typeConfig.label}
                title={selectedProject.project_name}
                className="min-w-0 flex-1"
              />
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs">
                    <Plus className="h-3.5 w-3.5" />
                    Request change
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">
                      Request a change
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label className={FIELD_LABEL}>Change title</Label>
                      <Input
                        placeholder="e.g. Add user export feature"
                        value={changeForm.title}
                        onChange={(e) => setChangeForm(prev => ({ ...prev, title: e.target.value }))}
                        className={FIELD}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={FIELD_LABEL}>Description</Label>
                      <Textarea
                        placeholder="Describe the change you need"
                        value={changeForm.description}
                        onChange={(e) => setChangeForm(prev => ({ ...prev, description: e.target.value }))}
                        className={cn(FIELD, 'min-h-[100px] py-2')}
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={() => setDialogOpen(false)}>Cancel</Button>
                      <Button size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={handleSubmitChangeRequest} disabled={submitting}>
                        {submitting ? 'Submitting' : 'Submit request'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Tabbed interface */}
          <Tabs defaultValue="overview" className="w-full">
            <div className="mb-5 flex items-center gap-1 border-b border-border/60">
              <TabsList className="h-auto gap-1 rounded-none border-0 bg-transparent p-0">
                <TabsTrigger value="overview" className={TAB_TRIGGER}>
                  <Eye className="hidden h-3.5 w-3.5 sm:block" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="files" className={TAB_TRIGGER}>
                  <FolderOpen className="hidden h-3.5 w-3.5 sm:block" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="timeline" className={TAB_TRIGGER}>
                  <History className="hidden h-3.5 w-3.5 sm:block" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="analytics" className={TAB_TRIGGER}>
                  <BarChart3 className="hidden h-3.5 w-3.5 sm:block" />
                  Analytics
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-4">
              {/* Status strip */}
              <Panel as="div">
                <div className="grid grid-cols-2 divide-x divide-border/60 lg:grid-cols-4">
                  <div className="px-4 py-3">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Status</p>
                    <StatusBadge status={selectedProject.status} className="mt-1.5" />
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Estimated hours</p>
                    <p className="mt-1 text-[13px] font-medium tabular-nums text-foreground">
                      {selectedProject.estimated_hours ? `${selectedProject.estimated_hours}h` : 'To be confirmed'}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Target date</p>
                    <p className="mt-1 text-[13px] font-medium tabular-nums text-foreground">
                      {selectedProject.target_completion_date
                        ? format(new Date(selectedProject.target_completion_date), 'd MMM yyyy')
                        : 'Not set'}
                    </p>
                  </div>
                  <div className="px-4 py-3">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Started</p>
                    <p className="mt-1 text-[13px] font-medium tabular-nums text-foreground">
                      {selectedProject.start_date
                        ? format(new Date(selectedProject.start_date), 'd MMM yyyy')
                        : 'Not started'}
                    </p>
                  </div>
                </div>
              </Panel>

              {/* Description & notes */}
              {(selectedProject.description || selectedProject.notes) && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {selectedProject.description && (
                    <Panel as="div">
                      <PanelHeader label="Project description" />
                      <p className="px-4 py-3.5 text-[13px] leading-relaxed text-ink-2">
                        {selectedProject.description}
                      </p>
                    </Panel>
                  )}

                  {selectedProject.notes && (
                    <Panel as="div">
                      <PanelHeader label="Latest update" />
                      <div className="border-l-2 border-primary px-4 py-3.5">
                        <p className="text-[13px] leading-relaxed text-ink-2">{selectedProject.notes}</p>
                      </div>
                    </Panel>
                  )}
                </div>
              )}

              {/* Features */}
              {selectedProject.features.length > 0 && (
                <Panel as="div">
                  <PanelHeader label="Features" />
                  {selectedProject.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
                      <StatusDot tone={statusTone(feature.status)} />
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate text-[13px]',
                          feature.status === 'completed' ? 'text-muted-foreground' : 'text-foreground',
                        )}
                      >
                        {feature.name}
                      </span>
                      <StatusBadge status={feature.status} />
                    </div>
                  ))}
                </Panel>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {selectedProject.preview_url && (
                  <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs" asChild>
                    <a href={selectedProject.preview_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-3.5 w-3.5" />
                      View preview
                    </a>
                  </Button>
                )}
                {selectedProject.production_url && (
                  <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs" asChild>
                    <a href={selectedProject.production_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View live
                    </a>
                  </Button>
                )}
              </div>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="mt-0">
              <Panel as="div">
                <PanelHeader label="Project files" />
                <EmptyState
                  compact
                  title="No files yet"
                  body="Project files and assets appear here as development progresses."
                />
              </Panel>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="mt-0 space-y-4">
              {/* Project timeline */}
              <Panel as="div">
                <PanelHeader label="Project timeline" />
                <div className="px-4 py-4">
                  <p className="mb-4 text-[13px] text-ink-2">
                    Your project is currently in the {statusLabel(selectedProject.status).toLowerCase()} phase
                  </p>
                  <div>
                    {statusSteps.map((step, index) => {
                      const isCompleted = index < currentStepIndex;
                      const isCurrent = step.key === selectedProject.status;
                      const isPending = index > currentStepIndex;

                      return (
                        <div key={step.key} className="relative pb-6 last:pb-0">
                          {index < statusSteps.length - 1 && (
                            <span
                              aria-hidden
                              className={cn(
                                'absolute left-[5px] top-4 h-full w-px',
                                isCompleted ? 'bg-foreground/30' : 'bg-border',
                              )}
                            />
                          )}
                          <div className="flex items-start gap-3.5">
                            <span
                              className={cn(
                                'relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-[1.5px]',
                                isCompleted && 'border-transparent bg-foreground/45',
                                isCurrent && 'border-transparent bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.18)]',
                                isPending && 'border-border bg-background',
                              )}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3
                                  className={cn(
                                    'text-[13px]',
                                    isCurrent ? 'font-medium text-foreground' : isCompleted ? 'text-ink-2' : 'text-muted-foreground',
                                  )}
                                >
                                  {step.label}
                                </h3>
                                {isCurrent && (
                                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
                                    In progress
                                  </span>
                                )}
                              </div>
                              <p className={cn('mt-0.5 text-xs', isPending ? 'text-muted-foreground/60' : 'text-muted-foreground')}>
                                {step.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>

              {/* Milestones */}
              {selectedProject.milestones.length > 0 && (
                <Panel as="div">
                  <PanelHeader label="Milestones" />
                  {selectedProject.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-start gap-3 border-t border-border/60 px-4 py-3 first:border-t-0">
                      <span
                        className={cn(
                          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[10px] tabular-nums',
                          milestone.status === 'completed' && 'bg-foreground/[0.08] text-ink-2',
                          milestone.status === 'current' && 'bg-primary/12 text-primary',
                          milestone.status === 'pending' && 'bg-sunken text-muted-foreground',
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-foreground">{milestone.name}</span>
                          {milestone.status === 'current' && (
                            <StatusBadge tone="accent" label="Current" />
                          )}
                          {milestone.status === 'completed' && (
                            <StatusBadge tone="ok" label="Completed" />
                          )}
                        </div>
                        {milestone.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">{milestone.description}</p>
                        )}
                        {milestone.date && (
                          <p className="mt-0.5 font-mono text-[10.5px] tabular-nums text-muted-foreground">
                            {format(new Date(milestone.date), 'd MMM yyyy')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </Panel>
              )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-0 space-y-4">
              <Panel as="div">
                <PanelHeader label="Project analytics" />
                <EmptyState
                  compact
                  title="No analytics yet"
                  body="Detailed performance metrics for your application are on the way."
                />
              </Panel>

              {/* Tech stack */}
              {selectedProject.tech_stack && selectedProject.tech_stack.length > 0 && (
                <Panel as="div">
                  <PanelHeader label="Technology stack" />
                  <div className="flex flex-wrap gap-2 px-4 py-3.5">
                    {selectedProject.tech_stack.map((tech, index) => (
                      <span
                        key={index}
                        className="rounded-full border border-border/60 px-2.5 py-0.5 font-mono text-[11px] text-ink-2"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </Panel>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  // Projects list view
  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <div className="space-y-5">
        <PageHeader
          kicker="Projects"
          title="App projects"
          description="Track your custom applications and systems"
        />

        {/* Quiet stat strip */}
        <Panel as="div">
          <div className="grid grid-cols-2 divide-x divide-border/60 md:grid-cols-4">
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Total</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{projects.length}</p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">In development</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {projects.filter(p => p.status === 'development').length}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Completed</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {projects.filter(p => ['deployed', 'completed'].includes(p.status)).length}
              </p>
            </div>
            <div className="px-4 py-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">In testing</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                {projects.filter(p => p.status === 'testing').length}
              </p>
            </div>
          </div>
        </Panel>

        {/* Projects ledger */}
        <Panel as="div">
          <PanelHeader label="All projects" />
          {projects.map((project) => {
            const config = getStatusConfig(project.status);
            const typeConfig = getProjectTypeConfig(project.project_type);
            const TypeIcon = typeConfig.icon;

            return (
              <button
                key={project.id}
                type="button"
                onClick={() => setSelectedProject(project)}
                className="flex w-full items-center gap-4 border-t border-border/60 px-4 py-3 text-left transition-colors duration-150 first:border-t-0 hover:bg-foreground/[0.025] focus-visible:bg-foreground/[0.03]"
              >
                <TypeIcon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-[450] text-foreground">{project.project_name}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                    {typeConfig.label}
                    {project.target_completion_date && (
                      <> · Target {format(new Date(project.target_completion_date), 'd MMM yyyy')}</>
                    )}
                  </p>
                </div>
                <div className="hidden w-32 shrink-0 sm:block">
                  <div className="mb-1 flex justify-between font-mono text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
                    <span>Progress</span>
                    <span className="tabular-nums">{config.progress}%</span>
                  </div>
                  <Progress value={config.progress} className="h-1.5" />
                </div>
                <StatusBadge status={project.status} className="w-24 shrink-0 justify-end sm:justify-start" />
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            );
          })}
        </Panel>
      </div>
    </div>
  );
}
