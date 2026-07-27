import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Youtube,
  Users,
  Calendar,
  Clock,
  FileText,
  Image,
  Video,
  Layers,
  Circle,
  Play,
  MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface SocialMediaAccount {
  id: string;
  platform: string;
  account_handle: string;
  account_name: string | null;
  profile_url: string | null;
  managed_by: string | null;
  posting_frequency: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface SocialMediaPost {
  id: string;
  account_id: string;
  title: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  scheduled_at: string | null;
  posted_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const platformConfig: Record<string, { label: string; icon: React.ElementType; color: string; bgColor: string }> = {
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
  facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-600', bgColor: 'bg-blue-600/10' },
  tiktok: { label: 'TikTok', icon: Play, color: 'text-foreground', bgColor: 'bg-foreground/10' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  twitter: { label: 'Twitter/X', icon: Twitter, color: 'text-foreground', bgColor: 'bg-foreground/10' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'text-red-500', bgColor: 'bg-red-500/10' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  disconnected: { label: 'Disconnected', variant: 'destructive' },
};

const postStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  draft: { label: 'Draft', variant: 'outline', icon: FileText },
  scheduled: { label: 'Scheduled', variant: 'secondary', icon: Clock },
  posted: { label: 'Posted', variant: 'default', icon: Circle },
  failed: { label: 'Failed', variant: 'destructive', icon: Circle },
};

const mediaTypeConfig: Record<string, { label: string; icon: React.ElementType }> = {
  image: { label: 'Image', icon: Image },
  video: { label: 'Video', icon: Video },
  carousel: { label: 'Carousel', icon: Layers },
  story: { label: 'Story', icon: Circle },
  reel: { label: 'Reel', icon: Play },
};

export default function LoungeSocialMedia() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<SocialMediaAccount | null>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [accountsRes, postsRes] = await Promise.all([
        supabase
          .from('social_media_accounts')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('social_media_posts')
          .select('*')
          .order('scheduled_at', { ascending: true })
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (postsRes.error) throw postsRes.error;

      setAccounts(accountsRes.data || []);
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Error fetching social media data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformInfo = (platform: string) => {
    return platformConfig[platform] || { label: platform, icon: Circle, color: 'text-muted-foreground', bgColor: 'bg-muted' };
  };

  const getStatusInfo = (status: string) => {
    return statusConfig[status] || { label: status, variant: 'outline' as const };
  };

  const getPostStatusInfo = (status: string) => {
    return postStatusConfig[status] || { label: status, variant: 'outline' as const, icon: Circle };
  };

  const getMediaTypeInfo = (type: string | null) => {
    return mediaTypeConfig[type || 'image'] || { label: 'Media', icon: Image };
  };

  const getPostsForAccount = (accountId: string) => {
    return posts.filter(post => post.account_id === accountId);
  };

  const getPostStats = () => {
    const draft = posts.filter(p => p.status === 'draft').length;
    const scheduled = posts.filter(p => p.status === 'scheduled').length;
    const posted = posts.filter(p => p.status === 'posted').length;
    return { draft, scheduled, posted, total: posts.length };
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  const postStats = getPostStats();

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <LoungePageHeader
        title="Social Media"
        description="View your connected social media accounts and content calendar"
        icon={Users}
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{accounts.length}</p>
                <p className="text-sm text-muted-foreground">Connected Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <FileText className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{postStats.draft}</p>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{postStats.scheduled}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Circle className="h-5 w-5 text-green-500 fill-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{postStats.posted}</p>
                <p className="text-sm text-muted-foreground">Posted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <div className="overflow-x-auto">
        <TabsList className="w-max">
          <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
          <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
        </TabsList>
        </div>

        {/* Connected Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          {accounts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Connected Accounts</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Your social media accounts will appear here once they're set up by our team.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {accounts.map((account, index) => {
                const platformInfo = getPlatformInfo(account.platform);
                const statusInfo = getStatusInfo(account.status);
                const PlatformIcon = platformInfo.icon;
                const accountPosts = getPostsForAccount(account.id);

                return (
                  <motion.div
                    key={account.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setSelectedAccount(selectedAccount?.id === account.id ? null : account)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${platformInfo.bgColor}`}>
                              <PlatformIcon className={`h-5 w-5 ${platformInfo.color}`} />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{platformInfo.label}</CardTitle>
                              <CardDescription className="font-medium">@{account.account_handle}</CardDescription>
                            </div>
                          </div>
                          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {account.account_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Account:</span>
                            <span className="font-medium">{account.account_name}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Managed by:</span>
                          <span className="font-medium">{account.managed_by || 'Quooro Team'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Posting Frequency:</span>
                          <span className="font-medium">{account.posting_frequency || 'Weekly'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{accountPosts.length} posts in calendar</span>
                        </div>
                        {account.notes && (
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">{account.notes}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Content Calendar Tab */}
        <TabsContent value="calendar" className="space-y-4">
          {posts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Scheduled Content</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Your content calendar will appear here once posts are scheduled by our team.
                </p>
              </CardContent>
            </Card>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-3 pr-4">
                {posts.map((post, index) => {
                  const postStatus = getPostStatusInfo(post.status);
                  const mediaType = getMediaTypeInfo(post.media_type);
                  const account = accounts.find(a => a.id === post.account_id);
                  const platformInfo = account ? getPlatformInfo(account.platform) : null;
                  const StatusIcon = postStatus.icon;
                  const MediaIcon = mediaType.icon;
                  const PlatformIcon = platformInfo?.icon;

                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card>
                        <CardContent className="pt-4">
                          <div className="flex gap-4">
                            {/* Media Preview */}
                            {post.media_url ? (
                              <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                                {post.media_type === 'video' ? (
                                  <video 
                                    src={post.media_url} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <img 
                                    src={post.media_url} 
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-muted flex items-center justify-center">
                                <MediaIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}

                            {/* Post Details */}
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium truncate">{post.title}</h4>
                                <Badge variant={postStatus.variant} className="flex-shrink-0">
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {postStatus.label}
                                </Badge>
                              </div>
                              
                              {post.content && (
                                <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                {platformInfo && PlatformIcon && (
                                  <div className="flex items-center gap-1">
                                    <PlatformIcon className={`h-3 w-3 ${platformInfo.color}`} />
                                    <span>@{account?.account_handle}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <MediaIcon className="h-3 w-3" />
                                  <span>{mediaType.label}</span>
                                </div>
                                {post.scheduled_at && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{format(new Date(post.scheduled_at), 'MMM d, yyyy h:mm a')}</span>
                                  </div>
                                )}
                                {post.posted_at && (
                                  <div className="flex items-center gap-1">
                                    <Circle className="h-3 w-3 fill-green-500 text-green-500" />
                                    <span>Posted {format(new Date(post.posted_at), 'MMM d, yyyy')}</span>
                                  </div>
                                )}
                              </div>

                              {post.notes && (
                                <div className="flex items-start gap-1 pt-1">
                                  <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">{post.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
