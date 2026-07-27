import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { 
  Megaphone, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock,
  Target,
  Calendar,
  DollarSign,
  ExternalLink,
  Image,
  Video,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

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

const platformConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  meta: { label: 'Meta', color: 'text-blue-600', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  tiktok: { label: 'TikTok', color: 'text-pink-600', bgColor: 'bg-pink-500/10 border-pink-500/20' },
  google: { label: 'Google', color: 'text-red-600', bgColor: 'bg-red-500/10 border-red-500/20' },
  linkedin: { label: 'LinkedIn', color: 'text-sky-600', bgColor: 'bg-sky-500/10 border-sky-500/20' },
  twitter: { label: 'X / Twitter', color: 'text-foreground', bgColor: 'bg-muted border-border' },
};

const statusConfig: Record<string, { label: string; icon: typeof Play; color: string; bgColor: string }> = {
  running: { label: 'Running', icon: Play, color: 'text-emerald-600', bgColor: 'bg-emerald-500/10 border-emerald-500/30' },
  paused: { label: 'Paused', icon: Pause, color: 'text-amber-600', bgColor: 'bg-amber-500/10 border-amber-500/30' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  scheduled: { label: 'Scheduled', icon: Clock, color: 'text-purple-600', bgColor: 'bg-purple-500/10 border-purple-500/30' },
};

const objectiveConfig: Record<string, { label: string; color: string }> = {
  leads: { label: 'Leads', color: 'bg-green-500/20 text-green-600 border-green-500/30' },
  traffic: { label: 'Traffic', color: 'bg-blue-500/20 text-blue-600 border-blue-500/30' },
  sales: { label: 'Sales', color: 'bg-purple-500/20 text-purple-600 border-purple-500/30' },
  awareness: { label: 'Awareness', color: 'bg-amber-500/20 text-amber-600 border-amber-500/30' },
  engagement: { label: 'Engagement', color: 'bg-pink-500/20 text-pink-600 border-pink-500/30' },
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
    return statusConfig[status] || statusConfig.running;
  };

  const getPlatformInfo = (platform: string) => {
    return platformConfig[platform] || platformConfig.meta;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <LoungePageHeader
        title="Ad Management"
        description="View and track your advertising campaigns across platforms"
        icon={Megaphone}
      />

      {/* Stats Overview */}
      {campaigns.length > 0 && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Play className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'running').length}</p>
                  <p className="text-xs text-muted-foreground">Running</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Pause className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'paused').length}</p>
                  <p className="text-xs text-muted-foreground">Paused</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{campaigns.filter(c => c.status === 'completed').length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Megaphone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{campaigns.length}</p>
                  <p className="text-xs text-muted-foreground">Total Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Megaphone className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Active Campaigns</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Your advertising campaigns will appear here once they're set up by your account manager.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign, index) => {
            const statusInfo = getStatusInfo(campaign.status);
            const platformInfo = getPlatformInfo(campaign.platform);
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className="group cursor-pointer transition-all hover:shadow-lg hover:border-primary/30"
                  onClick={() => setSelectedCampaign(campaign)}
                >
                  {/* Creative Preview */}
                  {campaign.creative_url && (
                    <div className="relative aspect-video bg-muted overflow-hidden rounded-t-lg">
                      {campaign.creative_type === 'video' ? (
                        <video 
                          src={campaign.creative_url} 
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img 
                          src={campaign.creative_url} 
                          alt={campaign.campaign_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute top-2 left-2">
                        <Badge className={cn("border", platformInfo.bgColor, platformInfo.color)}>
                          {platformInfo.label}
                        </Badge>
                      </div>
                      <div className="absolute top-2 right-2">
                        <Badge className={cn("border flex items-center gap-1", statusInfo.bgColor, statusInfo.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  )}

                  <CardHeader className={cn(!campaign.creative_url && "pb-2")}>
                    {!campaign.creative_url && (
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn("border", platformInfo.bgColor, platformInfo.color)}>
                          {platformInfo.label}
                        </Badge>
                        <Badge className={cn("border flex items-center gap-1", statusInfo.bgColor, statusInfo.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    )}
                    <CardTitle className="text-lg line-clamp-1">{campaign.campaign_name}</CardTitle>
                    {campaign.objective && (
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-muted-foreground" />
                        <Badge variant="outline" className={cn("text-xs", objectiveConfig[campaign.objective]?.color)}>
                          {objectiveConfig[campaign.objective]?.label || campaign.objective}
                        </Badge>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      {campaign.start_date && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(campaign.start_date), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                      {campaign.monthly_budget && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>£{campaign.monthly_budget.toLocaleString()}/mo</span>
                        </div>
                      )}
                    </div>

                    {campaign.notes && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-muted-foreground line-clamp-2">{campaign.notes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground">
                        Updated {format(new Date(campaign.last_updated_at), 'MMM d, yyyy')}
                      </span>
                      <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        View Details
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div 
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedCampaign(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {selectedCampaign.creative_url && (
              <div className="relative aspect-video bg-muted">
                {selectedCampaign.creative_type === 'video' ? (
                  <video 
                    src={selectedCampaign.creative_url} 
                    className="w-full h-full object-contain"
                    controls
                  />
                ) : (
                  <img 
                    src={selectedCampaign.creative_url} 
                    alt={selectedCampaign.campaign_name}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            )}
            
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">{selectedCampaign.campaign_name}</h2>
                  <div className="flex items-center gap-2">
                    <Badge className={cn("border", getPlatformInfo(selectedCampaign.platform).bgColor, getPlatformInfo(selectedCampaign.platform).color)}>
                      {getPlatformInfo(selectedCampaign.platform).label}
                    </Badge>
                    <Badge className={cn("border flex items-center gap-1", getStatusInfo(selectedCampaign.status).bgColor, getStatusInfo(selectedCampaign.status).color)}>
                      {(() => {
                        const StatusIcon = getStatusInfo(selectedCampaign.status).icon;
                        return <StatusIcon className="w-3 h-3" />;
                      })()}
                      {getStatusInfo(selectedCampaign.status).label}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedCampaign(null)}>
                  ×
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {selectedCampaign.objective && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Target className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Objective</p>
                      <p className="font-medium capitalize">{selectedCampaign.objective}</p>
                    </div>
                  </div>
                )}
                {selectedCampaign.start_date && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="font-medium">{format(new Date(selectedCampaign.start_date), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                )}
                {selectedCampaign.monthly_budget && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Budget</p>
                      <p className="font-medium">£{selectedCampaign.monthly_budget.toLocaleString()}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {selectedCampaign.creative_type === 'video' ? (
                    <Video className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Image className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Creative Type</p>
                    <p className="font-medium capitalize">{selectedCampaign.creative_type}</p>
                  </div>
                </div>
              </div>

              {selectedCampaign.notes && (
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="w-4 h-4" />
                    Notes from your team
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedCampaign.notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs text-muted-foreground">
                <span>Last updated: {format(new Date(selectedCampaign.last_updated_at), 'MMMM d, yyyy \'at\' h:mm a')}</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
