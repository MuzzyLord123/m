import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import {
  Layout, Code, Calendar, Clock, Target, ExternalLink,
  CheckCircle, AlertCircle, ChevronRight,
  Shield, Server, History, Palette, Eye, Rocket, Wrench, Box,
  RefreshCw, Plus, FileCode, ArrowLeft, TestTube, FolderOpen, BarChart3
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SkeletonLoading } from '@/components/lounge/SkeletonLoading';

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
  web_app: { label: 'Web Application', icon: Code },
  internal_tool: { label: 'Internal Tool', icon: Wrench },
  client_portal: { label: 'Client Portal', icon: Shield },
  inventory_system: { label: 'Inventory System', icon: Box },
  database: { label: 'Database System', icon: Server },
  workflow: { label: 'Workflow Tool', icon: RefreshCw },
  mvp: { label: 'MVP / Prototype', icon: Rocket },
  other: { label: 'Custom Build', icon: FileCode },
};

const statusConfig: Record<string, { label: string; color: string; progress: number }> = {
  planning: { label: 'Planning', color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', progress: 10 },
  design: { label: 'Design', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', progress: 25 },
  development: { label: 'Development', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', progress: 50 },
  testing: { label: 'Testing', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', progress: 75 },
  review: { label: 'Under Review', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', progress: 85 },
  deployed: { label: 'Deployed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', progress: 95 },
  maintenance: { label: 'Maintenance', color: 'bg-teal-500/20 text-teal-400 border-teal-500/30', progress: 100 },
  on_hold: { label: 'On Hold', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', progress: 0 },
  completed: { label: 'Completed', color: 'bg-green-500/20 text-green-400 border-green-500/30', progress: 100 },
};

const statusSteps = [
  { key: 'planning', label: 'Planning', icon: Target, description: 'Defining project scope and requirements' },
  { key: 'design', label: 'Design', icon: Palette, description: 'Creating the user interface and experience' },
  { key: 'development', label: 'Development', icon: Code, description: 'Building the application with clean code' },
  { key: 'testing', label: 'Testing', icon: TestTube, description: 'Quality assurance and bug fixing' },
  { key: 'deployed', label: 'Deployed', icon: Rocket, description: 'Live and accessible in production' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

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

  const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.planning;
  };

  const getProjectTypeConfig = (type: string) => {
    return projectTypes[type] || projectTypes.other;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <SkeletonLoading variant="detail" />
      </div>
    );
  }

  // No projects state
  if (projects.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Layout className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">App Projects</h1>
              <p className="text-muted-foreground">Track your custom applications and systems</p>
            </div>
          </div>
          
          <Card className="p-12 text-center">
            <Layout className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-xl mb-2">No Active Projects</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You don't have any app projects yet. When you request a custom application, 
              dashboard, or system, it will appear here with real-time progress updates.
            </p>
          </Card>
        </div>
      </div>
    );
  }

  // Project detail view with tabs
  if (selectedProject) {
    const config = getStatusConfig(selectedProject.status);
    const typeConfig = getProjectTypeConfig(selectedProject.project_type);
    const TypeIcon = typeConfig.icon;
    const currentStepIndex = statusSteps.findIndex(s => s.key === selectedProject.status);

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 sm:space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2 -ml-2 mb-2"
                onClick={() => setSelectedProject(null)}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <TypeIcon className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{selectedProject.project_name}</h1>
                  <p className="text-muted-foreground">{typeConfig.label}</p>
                </div>
              </div>
            </div>
            
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Request Change
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Project Change</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Change Title *</Label>
                    <Input
                      placeholder="e.g., Add user export feature"
                      value={changeForm.title}
                      onChange={(e) => setChangeForm(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Describe the changes you'd like..."
                      value={changeForm.description}
                      onChange={(e) => setChangeForm(prev => ({ ...prev, description: e.target.value }))}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmitChangeRequest} disabled={submitting}>
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </motion.div>

          {/* Tabbed Interface */}
          <motion.div variants={itemVariants}>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview" className="gap-2">
                  <Eye className="w-4 h-4 hidden sm:block" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="files" className="gap-2">
                  <FolderOpen className="w-4 h-4 hidden sm:block" />
                  Files
                </TabsTrigger>
                <TabsTrigger value="timeline" className="gap-2">
                  <History className="w-4 h-4 hidden sm:block" />
                  Timeline
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <BarChart3 className="w-4 h-4 hidden sm:block" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Status Overview */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/10">
                          <Layout className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Status</p>
                          <Badge className={cn("mt-1", config.color)}>{config.label}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10">
                          <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Estimated Hours</p>
                          <p className="font-medium">{selectedProject.estimated_hours ? `${selectedProject.estimated_hours}h` : 'TBD'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/10">
                          <Calendar className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Target Date</p>
                          <p className="font-medium">
                            {selectedProject.target_completion_date 
                              ? format(new Date(selectedProject.target_completion_date), 'MMM d, yyyy')
                              : 'Not set'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">Started</p>
                          <p className="font-medium">
                            {selectedProject.start_date 
                              ? format(new Date(selectedProject.start_date), 'MMM d, yyyy')
                              : 'Not started'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Description & Notes */}
                {(selectedProject.description || selectedProject.notes) && (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {selectedProject.description && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-muted-foreground" />
                            Project Description
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{selectedProject.description}</p>
                        </CardContent>
                      </Card>
                    )}

                    {selectedProject.notes && (
                      <Card className="border-blue-500/20 bg-blue-500/5">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <History className="w-5 h-5 text-blue-500" />
                            Latest Update
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{selectedProject.notes}</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}

                {/* Features */}
                {selectedProject.features.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-muted-foreground" />
                        Features
                      </CardTitle>
                      <CardDescription>Planned features and their current status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2">
                        {selectedProject.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              feature.status === 'completed' ? 'bg-emerald-500' :
                              feature.status === 'in_progress' ? 'bg-blue-500' : 'bg-muted-foreground'
                            )} />
                            <span className={cn(
                              "flex-1",
                              feature.status === 'completed' && 'text-muted-foreground line-through'
                            )}>
                              {feature.name}
                            </span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {feature.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {selectedProject.preview_url && (
                    <Button variant="outline" className="gap-2" asChild>
                      <a href={selectedProject.preview_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4" />
                        View Preview
                      </a>
                    </Button>
                  )}
                  {selectedProject.production_url && (
                    <Button className="gap-2" asChild>
                      <a href={selectedProject.production_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                        View Live
                      </a>
                    </Button>
                  )}
                </div>
              </TabsContent>

              {/* Files Tab */}
              <TabsContent value="files" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="w-5 h-5 text-primary" />
                      Project Files
                    </CardTitle>
                    <CardDescription>
                      Access your project files and assets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FolderOpen className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      <h3 className="font-semibold text-lg mb-2">No Files Yet</h3>
                      <p className="text-muted-foreground max-w-md">
                        Project files will appear here as development progresses.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Timeline Tab */}
              <TabsContent value="timeline" className="space-y-6">
                {/* Project Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5 text-blue-500" />
                      Project Timeline
                    </CardTitle>
                    <CardDescription>
                      Your project is currently in the <strong className="text-foreground">{config.label}</strong> phase
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-0">
                      {statusSteps.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = step.key === selectedProject.status;
                        const isPending = index > currentStepIndex;
                        const StepIcon = step.icon;

                        return (
                          <motion.div
                            key={step.key}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative"
                          >
                            {index < statusSteps.length - 1 && (
                              <div className={`absolute left-5 top-12 w-0.5 h-16 ${isCompleted ? 'bg-blue-500' : 'bg-border'}`} />
                            )}
                            
                            <div className={`flex items-start gap-4 p-4 rounded-xl transition-all ${isCurrent ? 'bg-blue-500/5 border border-blue-500/20' : ''}`}>
                              <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                isCompleted 
                                  ? 'bg-blue-500 text-white' 
                                  : isCurrent 
                                    ? 'bg-blue-500 text-white ring-4 ring-blue-500/20'
                                    : 'bg-muted text-muted-foreground'
                              }`}>
                                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                              </div>

                              <div className="flex-1 min-w-0 pt-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className={`font-semibold ${isPending ? 'text-muted-foreground' : 'text-foreground'}`}>
                                    {step.label}
                                  </h3>
                                  {isCurrent && <Badge className="bg-blue-500/20 text-blue-400 border-0">Current</Badge>}
                                  {isCompleted && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Completed</Badge>}
                                </div>
                                <p className={`text-sm mt-1 ${isPending ? 'text-muted-foreground/60' : 'text-muted-foreground'}`}>
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Milestones */}
                {selectedProject.milestones.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-muted-foreground" />
                        Milestones
                      </CardTitle>
                      <CardDescription>Key project milestones</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedProject.milestones.map((milestone, index) => (
                          <div key={index} className={cn(
                            "flex items-start gap-3 p-3 rounded-lg",
                            milestone.status === 'current' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-muted/30'
                          )}>
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                              milestone.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                              milestone.status === 'current' ? 'bg-blue-500 text-white' : 'bg-muted text-muted-foreground'
                            )}>
                              {milestone.status === 'completed' ? <CheckCircle className="w-4 h-4" /> : index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{milestone.name}</span>
                                {milestone.status === 'current' && (
                                  <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs">Current</Badge>
                                )}
                              </div>
                              {milestone.description && (
                                <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                              )}
                              {milestone.date && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(milestone.date), 'MMM d, yyyy')}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-primary" />
                      Project Analytics
                    </CardTitle>
                    <CardDescription>
                      Performance metrics and usage insights
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
                      <h3 className="font-semibold text-lg mb-2">Analytics Coming Soon</h3>
                      <p className="text-muted-foreground max-w-md">
                        We're building detailed analytics to help you understand your application's performance.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Tech Stack */}
                {selectedProject.tech_stack && selectedProject.tech_stack.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Code className="w-5 h-5 text-muted-foreground" />
                        Technology Stack
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.tech_stack.map((tech, index) => (
                          <Badge key={index} variant="secondary" className="text-sm">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Projects list view
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <LoungePageHeader
          title="App Projects"
          description="Track your custom applications and systems"
          icon={Layout}
        />

        {/* Stats Overview */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-2xl font-bold">{projects.length}</div>
            <div className="text-sm text-muted-foreground">Total Projects</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-blue-500">
              {projects.filter(p => p.status === 'development').length}
            </div>
            <div className="text-sm text-muted-foreground">In Development</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-emerald-500">
              {projects.filter(p => ['deployed', 'completed'].includes(p.status)).length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </Card>
          <Card className="p-4">
            <div className="text-2xl font-bold text-amber-500">
              {projects.filter(p => p.status === 'testing').length}
            </div>
            <div className="text-sm text-muted-foreground">In Testing</div>
          </Card>
        </motion.div>

        {/* Projects List */}
        <motion.div variants={itemVariants} className="space-y-4">
          {projects.map((project, index) => {
            const config = getStatusConfig(project.status);
            const typeConfig = getProjectTypeConfig(project.project_type);
            const TypeIcon = typeConfig.icon;
            
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="cursor-pointer hover:border-blue-500/30 transition-colors group"
                  onClick={() => setSelectedProject(project)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="p-2.5 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                          <TypeIcon className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg truncate group-hover:text-blue-500 transition-colors">
                              {project.project_name}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {typeConfig.label}
                            {project.target_completion_date && (
                              <> • Target: {format(new Date(project.target_completion_date), 'MMM d, yyyy')}</>
                            )}
                          </p>
                          
                          {/* Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-medium">{config.progress}%</span>
                            </div>
                            <Progress value={config.progress} className="h-1.5" />
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={config.color}>{config.label}</Badge>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
