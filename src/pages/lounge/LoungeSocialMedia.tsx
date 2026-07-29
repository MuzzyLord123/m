import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Instagram,
  Facebook,
  Linkedin,
  Twitter,
  Youtube,
  Calendar,
  Clock,
  FileText,
  Image,
  Video,
  Layers,
  Circle,
  Play,
  MessageSquare,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  PageHeader,
  Panel,
  PanelHeader,
  StatusBadge,
  statusLabel,
  EmptyState,
  SkeletonLedger,
  type Tone,
} from '@/components/platform';

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

const platformConfig: Record<string, { label: string; icon: React.ElementType }> = {
  instagram: { label: 'Instagram', icon: Instagram },
  facebook: { label: 'Facebook', icon: Facebook },
  tiktok: { label: 'TikTok', icon: Play },
  linkedin: { label: 'LinkedIn', icon: Linkedin },
  twitter: { label: 'Twitter/X', icon: Twitter },
  youtube: { label: 'YouTube', icon: Youtube },
};

const accountStatusTone: Record<string, Tone> = {
  active: 'ok',
  paused: 'attend',
  disconnected: 'risk',
};

const postStatusTone: Record<string, Tone> = {
  draft: 'neutral',
  scheduled: 'attend',
  posted: 'ok',
  failed: 'risk',
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
    return platformConfig[platform] || { label: platform, icon: Circle };
  };

  const getAccountTone = (status: string): Tone => accountStatusTone[status] || 'neutral';

  const getPostTone = (status: string): Tone => postStatusTone[status] || 'neutral';

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
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-6 w-44 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-4 w-72 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-7 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[10px] border border-border/60">
            <SkeletonLedger rows={3} />
          </div>
          <div className="rounded-[10px] border border-border/60">
            <SkeletonLedger rows={3} />
          </div>
        </div>
      </div>
    );
  }

  const postStats = getPostStats();

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Marketing"
        title="Social media"
        description="Your connected accounts and the content calendar the studio runs for you."
      />

      {/* Summary strip */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-b border-border/60 pb-4">
        <span className="font-mono text-[11px] tabular-nums text-ink-2">
          {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
        </span>
        <StatusBadge tone="neutral" label={`${postStats.draft} drafts`} />
        <StatusBadge tone="attend" label={`${postStats.scheduled} scheduled`} />
        <StatusBadge tone="ok" label={`${postStats.posted} posted`} />
      </div>

      <Tabs defaultValue="accounts" className="mt-5 space-y-4">
        <div className="overflow-x-auto">
        <TabsList className="w-max">
          <TabsTrigger value="accounts">Connected accounts</TabsTrigger>
          <TabsTrigger value="calendar">Content calendar</TabsTrigger>
        </TabsList>
        </div>

        {/* Connected accounts tab */}
        <TabsContent value="accounts" className="space-y-4">
          {accounts.length === 0 ? (
            <Panel>
              <EmptyState
                title="No connected accounts"
                body="Your social media accounts will appear here once our team sets them up."
              />
            </Panel>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {accounts.map(account => {
                const platformInfo = getPlatformInfo(account.platform);
                const PlatformIcon = platformInfo.icon;
                const accountPosts = getPostsForAccount(account.id);

                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedAccount(selectedAccount?.id === account.id ? null : account)}
                    className="rounded-[10px] border border-border/60 bg-card text-left transition-colors duration-150 hover:border-primary/40 focus-visible:border-primary/60"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-border/60 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04]">
                          <PlatformIcon className="h-4 w-4 text-ink-2" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[14px] font-medium text-foreground">
                            {platformInfo.label}
                          </span>
                          <span className="block truncate font-mono text-[11px] text-muted-foreground">
                            @{account.account_handle}
                          </span>
                        </span>
                      </div>
                      <StatusBadge tone={getAccountTone(account.status)} label={statusLabel(account.status)} />
                    </div>
                    <dl className="space-y-2 px-4 py-3 text-[12.5px]">
                      {account.account_name && (
                        <div className="flex items-baseline justify-between gap-3">
                          <dt className="text-muted-foreground">Account</dt>
                          <dd className="truncate font-medium text-foreground">{account.account_name}</dd>
                        </div>
                      )}
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">Managed by</dt>
                        <dd className="truncate font-medium text-foreground">{account.managed_by || 'Quooro team'}</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">Posting frequency</dt>
                        <dd className="font-medium text-foreground">{account.posting_frequency || 'Weekly'}</dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-muted-foreground">In the calendar</dt>
                        <dd className="font-mono text-[12px] tabular-nums text-foreground">
                          {accountPosts.length} {accountPosts.length === 1 ? 'post' : 'posts'}
                        </dd>
                      </div>
                      {account.notes && (
                        <p className="border-t border-border/60 pt-2 text-xs leading-relaxed text-muted-foreground">
                          {account.notes}
                        </p>
                      )}
                    </dl>
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Content calendar tab */}
        <TabsContent value="calendar" className="space-y-4">
          {posts.length === 0 ? (
            <Panel>
              <EmptyState
                title="No scheduled content"
                body="Your content calendar will appear here once our team schedules posts."
              />
            </Panel>
          ) : (
            <Panel>
              <PanelHeader label="Content calendar">
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                  {postStats.total} {postStats.total === 1 ? 'post' : 'posts'}
                </span>
              </PanelHeader>
              <ScrollArea className="h-[600px]">
                <div>
                  {posts.map(post => {
                    const mediaType = getMediaTypeInfo(post.media_type);
                    const account = accounts.find(a => a.id === post.account_id);
                    const platformInfo = account ? getPlatformInfo(account.platform) : null;
                    const MediaIcon = mediaType.icon;
                    const PlatformIcon = platformInfo?.icon;

                    return (
                      <div
                        key={post.id}
                        className="flex gap-4 border-t border-border/60 px-4 py-3 first:border-t-0"
                      >
                        {/* Media preview */}
                        {post.media_url ? (
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border/60 bg-sunken">
                            {post.media_type === 'video' ? (
                              <video
                                src={post.media_url}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <img
                                src={post.media_url}
                                alt={post.title}
                                className="h-full w-full object-cover"
                              />
                            )}
                          </div>
                        ) : (
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-sunken">
                            <MediaIcon className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}

                        {/* Post details */}
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="truncate text-[13px] font-medium text-foreground">{post.title}</h4>
                            <StatusBadge
                              tone={getPostTone(post.status)}
                              label={statusLabel(post.status)}
                              className="shrink-0"
                            />
                          </div>

                          {post.content && (
                            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {post.content}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            {platformInfo && PlatformIcon && (
                              <span className="flex items-center gap-1">
                                <PlatformIcon className="h-3 w-3" />
                                <span className="font-mono">@{account?.account_handle}</span>
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <MediaIcon className="h-3 w-3" />
                              <span>{mediaType.label}</span>
                            </span>
                            {post.scheduled_at && (
                              <span className="flex items-center gap-1 tabular-nums">
                                <Clock className="h-3 w-3" />
                                <span>{format(new Date(post.scheduled_at), 'd MMM yyyy, HH:mm')}</span>
                              </span>
                            )}
                            {post.posted_at && (
                              <span className="flex items-center gap-1 tabular-nums text-ok">
                                <Circle className="h-2 w-2 fill-current" />
                                <span>Posted {format(new Date(post.posted_at), 'd MMM yyyy')}</span>
                              </span>
                            )}
                          </div>

                          {post.notes && (
                            <p className="flex items-start gap-1.5 pt-0.5 text-[11px] text-muted-foreground">
                              <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                              {post.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </Panel>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
