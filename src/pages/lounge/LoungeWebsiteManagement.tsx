import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  CheckCircle,
  ExternalLink,
  Download,
  History,
  RefreshCw,
  Plus,
  Palette,
  Code,
  Eye,
  Rocket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  PageHeader, Panel, PanelHeader, StatusBadge, EmptyState, SkeletonLedger,
  FIELD, FIELD_LABEL,
} from '@/components/platform';

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

const statusSteps = [
  { key: 'design', label: 'Design', icon: Palette, description: 'Shaping the visual design and user experience' },
  { key: 'development', label: 'Development', icon: Code, description: 'Building your website' },
  { key: 'review', label: 'Review', icon: Eye, description: 'Ready for your feedback and approval' },
  { key: 'live', label: 'Live', icon: Rocket, description: 'Your website is live and accessible' },
];

type Tab = 'overview' | 'files' | 'timeline' | 'analytics';

function LoungeWebsiteManagementInner() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [changeForm, setChangeForm] = useState({ title: '', description: '' });
  const [tab, setTab] = useState<Tab>('overview');

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
      toast.error('Your website details did not load. Refresh to try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitChangeRequest = async () => {
    if (!changeForm.title.trim()) {
      toast.error('Add a title so the studio knows what to change');
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

      toast.success('Change request sent to the studio');
      setDialogOpen(false);
      setChangeForm({ title: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Error submitting change request:', error);
      toast.error('Your request did not send. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadFiles = async () => {
    if (!profile?.site_files_url) {
      toast.error('Site files are not available yet');
      return;
    }

    setDownloading(true);
    try {
      window.open(profile.site_files_url, '_blank');
      toast.success('Download started');
    } catch (error) {
      console.error('Error downloading files:', error);
      toast.error('The download did not start. Try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-5 w-40 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-3.5 w-64 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[10px] border border-border/60"><SkeletonLedger rows={4} /></div>
          <div className="rounded-[10px] border border-border/60"><SkeletonLedger rows={4} /></div>
        </div>
      </div>
    );
  }

  const versionHistory = (profile?.version_history as VersionEntry[]) || [];
  const currentStepIndex = statusSteps.findIndex(s => s.key === (profile?.website_status || 'design'));

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'files', label: 'Files' },
    { key: 'timeline', label: 'Timeline' },
    { key: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Client portal"
        title="Website"
        description="Your website's status, domain and files"
        actions={
          <Button className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => setDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Request a change
          </Button>
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a website change</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Title</Label>
              <Input
                className={FIELD}
                placeholder="e.g. Update the homepage hero section"
                value={changeForm.title}
                onChange={(e) => setChangeForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Description</Label>
              <Textarea
                placeholder="Describe the changes you'd like"
                value={changeForm.description}
                onChange={(e) => setChangeForm(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[100px] rounded-xl border-border/60 bg-foreground/[0.03] text-[14px] shadow-none focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button className="h-8 rounded-lg px-3 text-xs" onClick={handleSubmitChangeRequest} disabled={submitting}>
                {submitting ? (
                  <>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Sending
                  </>
                ) : (
                  'Send request'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tab row */}
      <div className="mt-5 flex items-center gap-1 border-b border-border/60">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'relative -mb-px border-b-2 px-3 py-2 text-[13px] transition-colors duration-150',
              tab === t.key
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4 pt-5">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Site facts */}
            <Panel>
              <PanelHeader label="Your site" />
              <dl>
                <div className="flex items-center justify-between gap-4 px-4 py-2.5">
                  <dt className="text-[13px] text-muted-foreground">Status</dt>
                  <dd><StatusBadge status={profile?.website_status || 'not_published'} /></dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-2.5">
                  <dt className="text-[13px] text-muted-foreground">SSL certificate</dt>
                  <dd><StatusBadge status={profile?.ssl_status || 'pending'} /></dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-2.5">
                  <dt className="text-[13px] text-muted-foreground">Hosting</dt>
                  <dd className="truncate text-[13px] text-foreground">{profile?.hosting_provider || 'Quooro Cloud'}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-2.5">
                  <dt className="text-[13px] text-muted-foreground">Last updated</dt>
                  <dd className="font-mono text-xs tabular-nums text-foreground">
                    {profile?.last_updated_at
                      ? format(new Date(profile.last_updated_at), 'd MMM yyyy')
                      : 'Not available'}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-2.5">
                  <dt className="text-[13px] text-muted-foreground">Domain</dt>
                  <dd className="truncate font-mono text-xs text-foreground">
                    {profile?.domain_name || 'No custom domain yet'}
                  </dd>
                </div>
                {profile?.preview_url && (
                  <div className="flex items-center justify-between gap-4 border-t border-border/60 px-4 py-2.5">
                    <dt className="text-[13px] text-muted-foreground">Preview</dt>
                    <dd className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-mono text-xs text-foreground">{profile.preview_url}</span>
                      <button
                        type="button"
                        aria-label="Open preview"
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.04] hover:text-foreground"
                        onClick={() => {
                          let url = profile.preview_url!;
                          if (!url.startsWith('http://') && !url.startsWith('https://')) {
                            url = 'https://' + url;
                          }
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </dd>
                  </div>
                )}
              </dl>
            </Panel>

            {/* Recent change requests */}
            <Panel>
              <PanelHeader label="Recent change requests" />
              {changeRequests.length > 0 ? (
                <div>
                  {changeRequests.map((request) => (
                    <div key={request.id} className="flex items-center gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-[450] text-foreground">{request.title}</span>
                        <span className="block font-mono text-[10.5px] tabular-nums text-muted-foreground">
                          {format(new Date(request.created_at), 'd MMM yyyy')}
                        </span>
                      </span>
                      <StatusBadge status={request.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  compact
                  title="No change requests yet"
                  body="When you ask for a change, it appears here with its progress."
                  action={{ label: 'Request a change', onClick: () => setDialogOpen(true) }}
                />
              )}
            </Panel>
          </div>
        </div>
      )}

      {tab === 'files' && (
        <div className="space-y-4 pt-5">
          <Panel>
            <PanelHeader label="Export site files" />
            <div className="space-y-4 p-4">
              <p className="text-[13px] text-muted-foreground">
                Download your website's source files: HTML, CSS, JavaScript, images and assets.
              </p>
              <Button
                className="h-8 gap-1.5 rounded-lg px-3 text-xs"
                onClick={handleDownloadFiles}
                disabled={!profile?.site_files_url || downloading}
              >
                {downloading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Preparing download
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    Download site files
                  </>
                )}
              </Button>
              {!profile?.site_files_url && (
                <p className="text-xs text-muted-foreground">
                  Site files are not available yet. Message the studio if you need them sooner.
                </p>
              )}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'timeline' && (
        <div className="space-y-4 pt-5">
          <Panel>
            <PanelHeader label="Project timeline" />
            <div className="p-4">
              <div className="space-y-0">
                {statusSteps.map((step, index) => {
                  const isCompleted = index < currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.key} className="relative">
                      {index < statusSteps.length - 1 && (
                        <span aria-hidden className="absolute left-[13px] top-9 h-8 w-px bg-border" />
                      )}
                      <div className="flex items-start gap-3 py-2">
                        <span
                          className={cn(
                            'z-10 flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full border',
                            isCompleted && 'border-transparent bg-foreground/[0.08] text-foreground',
                            isCurrent && 'border-transparent bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]',
                            !isCompleted && !isCurrent && 'border-border bg-background text-muted-foreground',
                          )}
                        >
                          {isCompleted ? <CheckCircle className="h-3.5 w-3.5" /> : <StepIcon className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0 pt-0.5">
                          <span className="flex items-center gap-2">
                            <span className={cn('text-[13px] font-[550]', isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground')}>
                              {step.label}
                            </span>
                            {isCurrent && <StatusBadge tone="accent" label="Now" />}
                            {isCompleted && <StatusBadge tone="ok" label="Done" />}
                          </span>
                          <span className="block text-xs text-muted-foreground">{step.description}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>

          <Panel>
            <PanelHeader label="Version history" />
            {versionHistory.length > 0 ? (
              <div>
                {versionHistory.map((entry, index) => (
                  <div key={index} className="flex items-start gap-3 border-t border-border/60 px-4 py-2.5 first:border-t-0">
                    <History className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] text-foreground">{entry.changes}</span>
                      <span className="block font-mono text-[10.5px] tabular-nums text-muted-foreground">{entry.version}</span>
                    </span>
                    <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                      {format(new Date(entry.date), 'd MMM yyyy')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                title="No versions yet"
                body="Each site update is recorded here once it ships."
              />
            )}
          </Panel>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="pt-5">
          <Panel>
            <PanelHeader label="Website analytics" />
            <EmptyState
              title="Analytics are on the way"
              body="We're building visitor insights, page views and performance metrics. They'll appear here once ready."
            />
          </Panel>
        </div>
      )}
    </div>
  );
}

export default function LoungeWebsiteManagement() {
  // No paywall — this is a read-only view of the client's website status & live preview.
  return <LoungeWebsiteManagementInner />;
}
