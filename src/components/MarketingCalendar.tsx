import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Share2,
  FileText,
  Clock,
  Play,
  Pause,
  CheckCircle,
  Circle,
  Image,
  Video,
  ExternalLink,
  Filter,
  List,
  Grid3X3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, parseISO } from 'date-fns';

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

interface ContentRequest {
  id: string;
  request_type: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  scheduled_date: string | null;
  priority: string | null;
}

interface CalendarEvent {
  id: string;
  type: 'ad' | 'social' | 'content';
  title: string;
  date: Date;
  status: string;
  platform?: string;
  mediaUrl?: string;
  mediaType?: string;
  priority?: string;
}

interface MarketingCalendarProps {
  adCampaigns: AdCampaign[];
  socialPosts: SocialMediaPost[];
  contentRequests: ContentRequest[];
  loading?: boolean;
}

const platformConfig: Record<string, { label: string; color: string }> = {
  meta: { label: 'Meta', color: 'bg-blue-500' },
  tiktok: { label: 'TikTok', color: 'bg-pink-500' },
  google: { label: 'Google', color: 'bg-red-500' },
  linkedin: { label: 'LinkedIn', color: 'bg-sky-600' },
  twitter: { label: 'X', color: 'bg-foreground' },
  instagram: { label: 'Instagram', color: 'bg-pink-500' },
  facebook: { label: 'Facebook', color: 'bg-blue-600' },
  youtube: { label: 'YouTube', color: 'bg-red-600' },
};

const statusConfig: Record<string, { label: string; icon: typeof Play; color: string }> = {
  running: { label: 'Running', icon: Play, color: 'text-emerald-600' },
  paused: { label: 'Paused', icon: Pause, color: 'text-amber-600' },
  completed: { label: 'Completed', icon: CheckCircle, color: 'text-blue-600' },
  scheduled: { label: 'Scheduled', icon: Clock, color: 'text-purple-600' },
  draft: { label: 'Draft', icon: FileText, color: 'text-muted-foreground' },
  posted: { label: 'Posted', icon: Circle, color: 'text-emerald-600' },
  pending: { label: 'Pending', icon: Clock, color: 'text-amber-600' },
  in_progress: { label: 'In Progress', icon: Play, color: 'text-blue-600' },
  delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-emerald-600' },
};

const typeConfig: Record<string, { label: string; icon: typeof Megaphone; color: string; bgColor: string }> = {
  ad: { label: 'Ad Campaign', icon: Megaphone, color: 'text-orange-600', bgColor: 'bg-orange-500/10 border-orange-500/30' },
  social: { label: 'Social Post', icon: Share2, color: 'text-purple-600', bgColor: 'bg-purple-500/10 border-purple-500/30' },
  content: { label: 'Content Request', icon: FileText, color: 'text-primary', bgColor: 'bg-primary/10 border-primary/30' },
};

const contentTypeLabels: Record<string, string> = {
  blog: 'Blog Post',
  social_post: 'Social Post',
  ad_copy: 'Ad Copy',
  website_section: 'Website Section',
};

export default function MarketingCalendar({ 
  adCampaigns, 
  socialPosts, 
  contentRequests,
  loading 
}: MarketingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [filterType, setFilterType] = useState<'all' | 'ad' | 'social' | 'content'>('all');

  // Convert all data to calendar events
  const allEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    // Add ad campaigns (use start_date or created_at)
    adCampaigns.forEach(campaign => {
      const date = campaign.start_date ? parseISO(campaign.start_date) : parseISO(campaign.created_at);
      events.push({
        id: campaign.id,
        type: 'ad',
        title: campaign.campaign_name,
        date,
        status: campaign.status,
        platform: campaign.platform,
        mediaUrl: campaign.creative_url || undefined,
        mediaType: campaign.creative_type,
      });
    });

    // Add social posts (use scheduled_at, posted_at, or created_at)
    socialPosts.forEach(post => {
      const dateStr = post.scheduled_at || post.posted_at || post.created_at;
      const date = parseISO(dateStr);
      events.push({
        id: post.id,
        type: 'social',
        title: post.title,
        date,
        status: post.status,
        mediaUrl: post.media_url || undefined,
        mediaType: post.media_type || 'image',
      });
    });

    // Add content requests (use scheduled_date if available, otherwise created_at)
    contentRequests.forEach(request => {
      const dateStr = request.scheduled_date || request.created_at;
      const date = parseISO(dateStr);
      events.push({
        id: request.id,
        type: 'content',
        title: request.title,
        date,
        status: request.status,
        platform: request.request_type,
        priority: request.priority || undefined,
      });
    });

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [adCampaigns, socialPosts, contentRequests]);

  // Filter events
  const filteredEvents = useMemo(() => {
    if (filterType === 'all') return allEvents;
    return allEvents.filter(event => event.type === filterType);
  }, [allEvents, filterType]);

  // Get days in current month view
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return filteredEvents.filter(event => isSameDay(event.date, date));
  };

  // Get selected date events
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // Get upcoming events for list view
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return filteredEvents.filter(event => event.date >= today).slice(0, 20);
  }, [filteredEvents]);

  // Stats
  const stats = useMemo(() => {
    return {
      ads: adCampaigns.length,
      social: socialPosts.length,
      content: contentRequests.length,
      total: allEvents.length,
    };
  }, [adCampaigns, socialPosts, contentRequests, allEvents]);

  const renderEventBadge = (event: CalendarEvent, compact = false) => {
    const typeInfo = typeConfig[event.type];
    const statusInfo = statusConfig[event.status] || statusConfig.pending;
    const TypeIcon = typeInfo.icon;

    if (compact) {
      return (
        <div
          key={event.id}
          className={cn(
            "w-2 h-2 rounded-full",
            event.type === 'ad' ? 'bg-orange-500' : event.type === 'social' ? 'bg-purple-500' : 'bg-primary'
          )}
        />
      );
    }

    return (
      <motion.div
        key={event.id}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md",
          typeInfo.bgColor
        )}
      >
        <div className="flex items-start gap-3">
          {event.mediaUrl && (
            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-muted">
              {event.mediaType === 'video' ? (
                <video src={event.mediaUrl} className="w-full h-full object-cover" muted />
              ) : (
                <img src={event.mediaUrl} alt={event.title} className="w-full h-full object-cover" />
              )}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <TypeIcon className={cn("w-3.5 h-3.5", typeInfo.color)} />
              <span className={cn("text-xs font-medium", typeInfo.color)}>{typeInfo.label}</span>
            </div>
            <p className="font-medium text-sm truncate">{event.title}</p>
            <div className="flex items-center gap-2 mt-1">
              {event.platform && (
                <Badge variant="outline" className="text-xs h-5">
                  {platformConfig[event.platform]?.label || contentTypeLabels[event.platform] || event.platform}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs h-5">
                <statusInfo.icon className="w-3 h-3 mr-1" />
                {statusInfo.label}
              </Badge>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-7 gap-2">
          {[...Array(35)].map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Megaphone className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.ads}</p>
                <p className="text-sm text-muted-foreground">Ad Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Share2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.social}</p>
                <p className="text-sm text-muted-foreground">Social Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.content}</p>
                <p className="text-sm text-muted-foreground">Content Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CalendarIcon className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold min-w-[160px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentMonth(new Date())}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <Tabs value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
            <TabsList className="h-9">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="ad" className="text-xs">Ads</TabsTrigger>
              <TabsTrigger value="social" className="text-xs">Social</TabsTrigger>
              <TabsTrigger value="content" className="text-xs">Content</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* View Mode */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setViewMode('calendar')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
          {/* Calendar Grid */}
          <Card>
            <CardContent className="pt-6">
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar days */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before first of month */}
                {Array.from({ length: monthDays[0].getDay() }).map((_, i) => (
                  <div key={`empty-start-${i}`} className="min-h-[80px] p-1" />
                ))}

                {monthDays.map(day => {
                  const dayEvents = getEventsForDate(day);
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const hasEvents = dayEvents.length > 0;

                  return (
                    <motion.div
                      key={day.toISOString()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={cn(
                        "min-h-[80px] p-1 rounded-lg border cursor-pointer transition-all",
                        isSelected ? "border-primary bg-primary/5" : "border-transparent hover:border-border hover:bg-muted/50",
                        isToday(day) && "bg-accent/50",
                        !isSameMonth(day, currentMonth) && "opacity-50"
                      )}
                    >
                      <div className={cn(
                        "text-sm font-medium mb-1",
                        isToday(day) && "text-primary"
                      )}>
                        {format(day, 'd')}
                      </div>
                      {hasEvents && (
                        <div className="flex flex-wrap gap-1">
                          {dayEvents.slice(0, 3).map(event => renderEventBadge(event, true))}
                          {dayEvents.length > 3 && (
                            <span className="text-[10px] text-muted-foreground">
                              +{dayEvents.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Date Events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {selectedDate ? (
                  selectedDateEvents.length > 0 ? (
                    <div className="space-y-3 pr-4">
                      {selectedDateEvents.map(event => renderEventBadge(event))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <CalendarIcon className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No events on this date</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Click a date to view events</p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3 pr-4">
                  {upcomingEvents.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 text-center min-w-[60px]">
                          <div className="text-2xl font-bold">{format(event.date, 'd')}</div>
                          <div className="text-xs text-muted-foreground">{format(event.date, 'MMM')}</div>
                        </div>
                        <div className="flex-1">
                          {renderEventBadge(event)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mb-4 opacity-50" />
                  <p>No upcoming events</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
        <span className="font-medium">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Ad Campaign</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>Social Post</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Content Request</span>
        </div>
      </div>
    </div>
  );
}
