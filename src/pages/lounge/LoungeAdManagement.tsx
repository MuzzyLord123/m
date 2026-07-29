import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  CheckCircle,
  Clock,
  Target,
  Calendar,
  Image,
  Video,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import {
  PageHeader,
  Panel,
  StatusBadge,
  statusLabel,
  DetailDrawer,
  EmptyState,
  Money,
  RelativeTime,
  SkeletonLedger,
  type Tone,
} from '@/components/platform';

interface AdCampaign {
  id: string;
  platform: string;
  campaign_name: string;
  creative_url: string | null;
  creative_type: string;
  status: string;
  objective: string | null;
  start_date: string | null;
  monthly_budget: number | null;
  notes: string | null;
  last_updated_at: string;
  created_at: string;
}

const PLATFORM_LABEL: Record<string, string> = {
  meta: 'Meta',
  tiktok: 'TikTok',
  google: 'Google',
  linkedin: 'LinkedIn',
  twitter: 'X / Twitter',
};

const STATUS_META: Record<string, { tone: Tone; icon: typeof Play }> = {
  running: { tone: 'ok', icon: Play },
  paused: { tone: 'attend', icon: Pause },
  completed: { tone: 'neutral', icon: CheckCircle },
  scheduled: { tone: 'attend', icon: Clock },
};

export default function LoungeAdManagement() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<AdCampaign | null>(null);

  useEffect(() => {
    if (user) {
      fetchCampaigns();
    }
  }, [user]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    return STATUS_META[status] || STATUS_META.running;
  };

  const getPlatformLabel = (platform: string) => {
    return PLATFORM_LABEL[platform] || PLATFORM_LABEL.meta;
  };

  const runningCount = campaigns.filter(c => c.status === 'running').length;
  const pausedCount = campaigns.filter(c => c.status === 'paused').length;
  const completedCount = campaigns.filter(c => c.status === 'completed').length;

  if (loading) {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-6 w-44 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-4 w-72 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-7 rounded-[10px] border border-border/60">
          <SkeletonLedger rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Marketing"
        title="Ad management"
        description="Campaigns the studio runs for you, across every platform."
      />

      {/* Summary strip */}
      {campaigns.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b border-border/60 pb-4">
          <span className="font-mono text-[11px] tabular-nums text-ink-2">
            {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'}
          </span>
          <StatusBadge tone="ok" label={`${runningCount} running`} />
          <StatusBadge tone="attend" label={`${pausedCount} paused`} />
          <StatusBadge tone="neutral" label={`${completedCount} completed`} />
        </div>
      )}

      {/* Campaigns */}
      {campaigns.length === 0 ? (
        <Panel className="mt-5">
          <EmptyState
            title="No campaigns yet"
            body="Your advertising campaigns will appear here once your account manager sets them up."
          />
        </Panel>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map(campaign => {
            const statusInfo = getStatusInfo(campaign.status);
            const platformLabel = getPlatformLabel(campaign.platform);

            return (
              <button
                key={campaign.id}
                type="button"
                onClick={() => setSelectedCampaign(campaign)}
                className="group flex flex-col overflow-hidden rounded-[10px] border border-border/60 bg-card text-left transition-colors duration-150 hover:border-primary/40 focus-visible:border-primary/60"
              >
                {/* Creative preview */}
                {campaign.creative_url && (
                  <div className="relative aspect-video overflow-hidden bg-sunken">
                    {campaign.creative_type === 'video' ? (
                      <video
                        src={campaign.creative_url}
                        className="h-full w-full object-cover"
                        muted
                      />
                    ) : (
                      <img
                        src={campaign.creative_url}
                        alt={campaign.campaign_name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[9.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      {platformLabel}
                    </span>
                    <StatusBadge tone={statusInfo.tone} label={statusLabel(campaign.status)} />
                  </div>

                  <span className="line-clamp-1 text-[14px] font-medium text-foreground">
                    {campaign.campaign_name}
                  </span>

                  {campaign.objective && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Target className="h-3 w-3" />
                      {statusLabel(campaign.objective)}
                    </span>
                  )}

                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    {campaign.start_date && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(campaign.start_date), 'd MMM yyyy')}
                      </span>
                    )}
                    {campaign.monthly_budget && (
                      <span className="flex items-center gap-1">
                        <Money whole {...{ value: campaign.monthly_budget }} />
                        <span>/ month</span>
                      </span>
                    )}
                  </div>

                  {campaign.notes && (
                    <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {campaign.notes}
                    </p>
                  )}

                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-2.5">
                    <span className="text-[11px] text-muted-foreground">
                      Updated <RelativeTime date={campaign.last_updated_at} className="text-[11px]" />
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground transition-colors duration-150 group-hover:text-foreground">
                      View details
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Campaign detail */}
      <DetailDrawer
        open={!!selectedCampaign}
        onOpenChange={open => {
          if (!open) setSelectedCampaign(null);
        }}
        kicker={selectedCampaign ? getPlatformLabel(selectedCampaign.platform) : undefined}
        title={selectedCampaign?.campaign_name ?? ''}
        description={
          selectedCampaign ? (
            <StatusBadge
              tone={getStatusInfo(selectedCampaign.status).tone}
              label={statusLabel(selectedCampaign.status)}
            />
          ) : undefined
        }
        footer={
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg px-3 text-xs"
            onClick={() => setSelectedCampaign(null)}
          >
            Close
          </Button>
        }
      >
        {selectedCampaign && (
          <div className="space-y-4">
            {selectedCampaign.creative_url && (
              <div className="overflow-hidden rounded-[10px] border border-border/60 bg-sunken">
                {selectedCampaign.creative_type === 'video' ? (
                  <video
                    src={selectedCampaign.creative_url}
                    className="aspect-video w-full object-contain"
                    controls
                  />
                ) : (
                  <img
                    src={selectedCampaign.creative_url}
                    alt={selectedCampaign.campaign_name}
                    className="aspect-video w-full object-contain"
                  />
                )}
              </div>
            )}

            <dl className="grid gap-px overflow-hidden rounded-[10px] border border-border/60 bg-border/60 sm:grid-cols-2">
              {selectedCampaign.objective && (
                <div className="flex items-center gap-3 bg-card p-3">
                  <Target className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      Objective
                    </dt>
                    <dd className="text-[13px] font-medium text-foreground">
                      {statusLabel(selectedCampaign.objective)}
                    </dd>
                  </div>
                </div>
              )}
              {selectedCampaign.start_date && (
                <div className="flex items-center gap-3 bg-card p-3">
                  <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      Start date
                    </dt>
                    <dd className="text-[13px] font-medium tabular-nums text-foreground">
                      {format(new Date(selectedCampaign.start_date), 'd MMMM yyyy')}
                    </dd>
                  </div>
                </div>
              )}
              {selectedCampaign.monthly_budget && (
                <div className="flex items-center gap-3 bg-card p-3">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      Monthly budget
                    </dt>
                    <dd className="text-[13px] font-medium text-foreground">
                      <Money whole {...{ value: selectedCampaign.monthly_budget }} />
                    </dd>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 bg-card p-3">
                {selectedCampaign.creative_type === 'video' ? (
                  <Video className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <Image className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <div className="min-w-0">
                  <dt className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                    Creative type
                  </dt>
                  <dd className="text-[13px] font-medium text-foreground">
                    {statusLabel(selectedCampaign.creative_type)}
                  </dd>
                </div>
              </div>
            </dl>

            {selectedCampaign.notes && (
              <div className="rounded-[10px] border border-border/60 p-4">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
                  Notes from your team
                </p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {selectedCampaign.notes}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Last updated {format(new Date(selectedCampaign.last_updated_at), 'd MMMM yyyy, HH:mm')}
            </p>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
