import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { SubscriptionPaywall } from '@/components/lounge/SubscriptionPaywall';
import {
  Globe,
  CheckCircle,
  Clock,
  Shield,
  Server,
  ExternalLink,
  Calendar,
  Download,
  History,
  AlertCircle,
  FileCode,
  RefreshCw,
  Plus,
  Palette,
  Code,
  Eye,
  Rocket,
  FolderOpen,
  BarChart3
} from 'lucide-react';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SkeletonLoading } from '@/components/lounge/SkeletonLoading';

interface UserProfile {
  full_name: string | null;
  company: string | null;
  plan: string | null;
  page_count: string | null;
  website_status: string | null;
  preview_url: string | null;
  customer_id: string | null;
  created_at: string;
  site_published_at: string | null;
  domain_name: string | null;
  ssl_status: string | null;
  hosting_provider: string | null;
  last_updated_at: string | null;
  site_files_url: string | null;
  version_history: VersionEntry[] | null;
}

interface VersionEntry {
  version: string;
  date: string;
  changes: string;
}

interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const SSL_STATUS_CONFIG = {
  active: { label: 'Active', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle },
  pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  expired: { label: 'Expired', color: 'bg-destructive/10 text-destructive border-destructive/20', icon: AlertCircle },
};

const WEBSITE_STATUS_CONFIG = {
  live: { label: 'Live', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  design: { label: 'In Design', color: 'bg-purple-500/10 text-purple-600 border-purple-500/20' },
  development: { label: 'In Development', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  review: { label: 'In Review', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
  not_published: { label: 'Not Published', color: 'bg-muted text-muted-foreground border-border' },
};

const statusSteps = [
  { key: 'design', label: 'Design', icon: Palette, description: 'Creating the visual design and user experience' },
  { key: 'development', label: 'Development', icon: Code, description: 'Building your website with clean code' },
  { key: 'review', label: 'Review', icon: Eye, description: 'Ready for your feedback and approval' },
  { key: 'live', label: 'Live', icon: Rocket, description: 'Your website is live and accessible' },
];

function LoungeWebsiteManagementInner() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [changeForm, setChangeForm] = useState({ title: '', description: '' });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [profileRes, requestsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, company, plan, page_count, website_status, preview_url, customer_id, created_at, site_published_at, domain_name, ssl_status, hosting_provider, last_updated_at, site_files_url, version_history')
          .eq('user_id', user?.id)
          .maybeSingle(),
        supabase
          .from('content_requests')
          .select('id, title, description, status, created_at')
          .eq('user_id', user?.id)
          .eq('request_type', 'website_section')
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      if (profileRes.error) throw profileRes.error;
      
      const rawProfile = profileRes.data;
      let profileData: UserProfile | null = null;
      
      if (rawProfile) {
        let versionHistory: VersionEntry[] | null = null;
        if (typeof rawProfile.version_history === 'string') {
          versionHistory = JSON.parse(rawProfile.version_history);
        } else if (Array.isArray(rawProfile.version_history)) {
          versionHistory = rawProfile.version_history as unknown as VersionEntry[];
        }
        
        profileData = {
          ...rawProfile,
          version_history: versionHistory,
        } as UserProfile;
      }
      
      setProfile(profileData);
      setChangeRequests((requestsRes.data as ChangeRequest[]) || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load website information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitChangeRequest = async () => {
    if (!changeForm.title.trim()) {
      toast.error('Please enter a title for your request');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('content_requests').insert({
        user_id: user?.id,
        request_type: 'website_section',
        title: changeForm.title.trim(),
        description: changeForm.description.trim() || null,
      });

      if (error) throw error;

      toast.success('Change request submitted successfully');
      setDialogOpen(false);
      setChangeForm({ title: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error submitting change request:', error);
      toast.error('Failed to submit change request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadFiles = async () => {
    if (!profile?.site_files_url) {
      toast.error('No site files available for download');
      return;
    }

    setDownloading(true);
    try {
      window.open(profile.site_files_url, '_blank');
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading files:', error);
      toast.error('Failed to download files');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <SkeletonLoading variant="detail" />
      </div>
    );
  }

  const sslStatusKey = profile?.ssl_status as keyof typeof SSL_STATUS_CONFIG;
  const sslConfig = SSL_STATUS_CONFIG[sslStatusKey] ?? SSL_STATUS_CONFIG.pending;
  const SslIcon = sslConfig.icon;
  
  const websiteStatusKey = profile?.website_status as keyof typeof WEBSITE_STATUS_CONFIG;
  const statusConfig = WEBSITE_STATUS_CONFIG[websiteStatusKey] ?? WEBSITE_STATUS_CONFIG.not_published;
  const versionHistory = (profile?.version_history as VersionEntry[]) || [];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 sm:space-y-8"
      >
        <LoungePageHeader
          title="Website Management"
          description="View your website details, status, and request changes"
          icon={Globe}
          actions={
            <Button className="gap-2" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4" />
              Request Change
            </Button>
          }
        />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Website Change</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Change Title *</Label>
                  <Input
                    placeholder="e.g., Update homepage hero section"
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
              {/* Status Overview Cards */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Globe className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Status</p>
                        <Badge className={cn("mt-1", statusConfig.color)}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10">
                        <Shield className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">SSL Certificate</p>
                        <Badge className={cn("mt-1 gap-1", sslConfig.color)}>
                          <SslIcon className="w-3 h-3" />
                          {sslConfig.label}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Server className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Hosting</p>
                        <p className="font-medium truncate">{profile?.hosting_provider || 'Lovable Cloud'}</p>
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
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium">
                          {profile?.last_updated_at 
                            ? format(new Date(profile.last_updated_at), 'MMM d, yyyy')
                            : 'Not available'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Domain & Preview */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-primary" />
                      Domain Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Domain Name</p>
                      <p className="font-mono text-sm bg-muted px-3 py-2 rounded-lg">
                        {profile?.domain_name || 'No custom domain configured'}
                      </p>
                    </div>
                    {profile?.preview_url && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Preview URL</p>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm bg-muted px-3 py-2 rounded-lg flex-1 truncate">
                            {profile.preview_url}
                          </p>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => {
                              let url = profile.preview_url!;
                              if (!url.startsWith('http://') && !url.startsWith('https://')) {
                                url = 'https://' + url;
                              }
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Change Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-primary" />
                      Recent Change Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {changeRequests.length > 0 ? (
                      <ScrollArea className="h-[200px]">
                        <div className="space-y-3 pr-4">
                          {changeRequests.map((request) => (
                            <div key={request.id} className="p-3 rounded-lg border bg-muted/30">
                              <div className="flex items-center justify-between mb-1">
                                <p className="font-medium text-sm truncate flex-1">{request.title}</p>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "ml-2",
                                    request.status === 'delivered' && 'bg-emerald-500/10 text-emerald-600',
                                    request.status === 'in_progress' && 'bg-blue-500/10 text-blue-600',
                                    request.status === 'pending' && 'bg-amber-500/10 text-amber-600'
                                  )}
                                >
                                  {request.status === 'in_progress' ? 'In Progress' : 
                                   request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(request.created_at), 'MMM d, yyyy')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <RefreshCw className="w-10 h-10 text-muted-foreground/50 mb-3" />
                        <p className="text-sm text-muted-foreground">No change requests yet</p>
                        <Button variant="link" size="sm" onClick={() => setDialogOpen(true)}>
                          Submit your first request
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Files Tab */}
            <TabsContent value="files" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-primary" />
                    Export Site Files
                  </CardTitle>
                  <CardDescription>
                    Download your website's source files including HTML, CSS, JS, and assets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                      <p className="text-sm font-medium">Included in export:</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• HTML source files</li>
                        <li>• CSS stylesheets</li>
                        <li>• JavaScript files</li>
                        <li>• Images and assets</li>
                      </ul>
                    </div>
                    <Button 
                      className="w-full gap-2" 
                      onClick={handleDownloadFiles}
                      disabled={!profile?.site_files_url || downloading}
                    >
                      {downloading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Preparing Download...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Site Files
                        </>
                      )}
                    </Button>
                    {!profile?.site_files_url && (
                      <p className="text-xs text-muted-foreground text-center">
                        Site files are not yet available. Contact support for assistance.
                      </p>
                    )}
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
                    <Globe className="w-5 h-5 text-primary" />
                    Project Timeline
                  </CardTitle>
                  <CardDescription>
                    Your website is currently in the <strong className="text-foreground">{statusSteps[statusSteps.findIndex(s => s.key === (profile?.website_status || 'design'))]?.label}</strong> phase
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-0">
                    {statusSteps.map((step, index) => {
                      const currentStepIndex = statusSteps.findIndex(s => s.key === (profile?.website_status || 'design'));
                      const isCompleted = index < currentStepIndex;
                      const isCurrent = index === currentStepIndex;
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
                            <div className={`absolute left-5 top-12 w-0.5 h-16 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
                          )}
                          
                          <div className={`flex items-start gap-4 p-4 rounded-xl transition-all ${isCurrent ? 'bg-primary/5 border border-primary/20' : ''}`}>
                            <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              isCompleted 
                                ? 'bg-primary text-primary-foreground' 
                                : isCurrent 
                                  ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                                  : 'bg-muted text-muted-foreground'
                            }`}>
                              {isCompleted ? <CheckCircle className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                            </div>

                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className={`font-semibold ${isPending ? 'text-muted-foreground' : 'text-foreground'}`}>
                                  {step.label}
                                </h3>
                                {isCurrent && <Badge className="bg-primary/20 text-primary border-0">Current</Badge>}
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

              {/* Version History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" />
                    Version History
                  </CardTitle>
                  <CardDescription>
                    Track changes and updates to your website
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {versionHistory.length > 0 ? (
                    <ScrollArea className="h-[250px]">
                      <div className="space-y-3 pr-4">
                        {versionHistory.map((entry, index) => (
                          <div key={index} className="p-3 rounded-lg border bg-muted/30">
                            <div className="flex items-center justify-between mb-1">
                              <Badge variant="outline">{entry.version}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(entry.date), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <p className="text-sm">{entry.changes}</p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <History className="w-10 h-10 text-muted-foreground/50 mb-3" />
                      <p className="text-sm text-muted-foreground">No version history yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Website Analytics
                  </CardTitle>
                  <CardDescription>
                    Performance metrics and visitor insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Analytics Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md">
                      We're building detailed analytics to help you understand your website's performance. 
                      Check back soon for visitor insights, page views, and more.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoungeWebsiteManagement() {
  // No paywall — this is a read-only view of the client's website status & live preview.
  return <LoungeWebsiteManagementInner />;
}
