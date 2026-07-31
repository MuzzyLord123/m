import { useState, useEffect } from 'react';
import { 
  Shield, 
  AlertTriangle,
  LogIn,
  ShieldX,
  RefreshCw,
  Loader2,
  Filter,
  Search,
  MapPin,
  Clock,
  User,
  Monitor,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { Json } from '@/integrations/supabase/types';
import { useIPGeolocation, getFlagEmoji } from '@/hooks/useIPGeolocation';
import { SkeletonTable } from '@/components/platform';

interface SecurityLog {
  id: string;
  user_id: string | null;
  event_type: string;
  portal_attempted: string | null;
  actual_role: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Json | null;
  created_at: string;
  // Joined from profiles
  user_email?: string;
  user_name?: string;
}

const eventTypeConfig: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'destructive' | 'secondary' | 'outline' }> = {
  team_login_success: { label: 'Team Login', icon: <LogIn className="w-3 h-3" />, variant: 'default' },
  team_login_failed: { label: 'Team Login Failed', icon: <ShieldX className="w-3 h-3" />, variant: 'destructive' },
  team_login_no_role: { label: 'No Role Found', icon: <AlertTriangle className="w-3 h-3" />, variant: 'destructive' },
  unauthorized_team_portal_login: { label: 'Unauthorized Team Access', icon: <ShieldX className="w-3 h-3" />, variant: 'destructive' },
  unauthorized_team_portal_access: { label: 'Team Portal Blocked', icon: <ShieldX className="w-3 h-3" />, variant: 'destructive' },
  customer_login_success: { label: 'Customer Login', icon: <LogIn className="w-3 h-3" />, variant: 'secondary' },
  customer_login_failed: { label: 'Customer Login Failed', icon: <ShieldX className="w-3 h-3" />, variant: 'destructive' },
  admin_used_customer_login: { label: 'Admin → Customer Portal', icon: <AlertTriangle className="w-3 h-3" />, variant: 'outline' },
  admin_accessed_customer_portal: { label: 'Admin Redirected', icon: <AlertTriangle className="w-3 h-3" />, variant: 'outline' },
  unauthorized_customer_portal_access: { label: 'Customer Portal Blocked', icon: <ShieldX className="w-3 h-3" />, variant: 'destructive' },
};

/* Portal and role chips on the platform tokens — no hue map. */
const portalColors: Record<string, string> = {
  team: 'bg-primary/10 text-primary border-primary/20',
  customer: 'bg-foreground/[0.06] text-ink-2 border-border/60',
};

const roleColors: Record<string, string> = {
  admin: 'bg-attend/10 text-attend border-attend/20',
  user: 'bg-ok/10 text-ok border-ok/20',
  unknown: 'bg-muted text-muted-foreground border-border',
  none: 'bg-risk/10 text-risk border-risk/20',
};

export default function SecurityLogsPanel() {
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [portalFilter, setPortalFilter] = useState('all');
  const [displayCount, setDisplayCount] = useState(5);

  // IP Geolocation
  const { lookupMultipleIPs, getGeoData } = useIPGeolocation();

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Fetch security logs with user info
      const { data: logsData, error: logsError } = await supabase
        .from('security_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (logsError) throw logsError;

      // Get unique user IDs to fetch their profiles
      const userIds = [...new Set(logsData?.filter(l => l.user_id).map(l => l.user_id) || [])];
      
      let profilesMap: Record<string, { email: string; full_name: string }> = {};
      
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, email, full_name')
          .in('user_id', userIds);
        
        profilesData?.forEach(p => {
          profilesMap[p.user_id] = { email: p.email || '', full_name: p.full_name || '' };
        });
      }

      // Merge logs with profile info
      const enrichedLogs = logsData?.map(log => ({
        ...log,
        user_email: log.user_id ? profilesMap[log.user_id]?.email : (log.details as any)?.email || null,
        user_name: log.user_id ? profilesMap[log.user_id]?.full_name : null,
      })) || [];

      setLogs(enrichedLogs);

      // Fetch geolocation for all unique IPs
      const uniqueIPs = [...new Set(enrichedLogs.filter(l => l.ip_address).map(l => l.ip_address!))] as string[];
      if (uniqueIPs.length > 0) {
        lookupMultipleIPs(uniqueIPs);
      }
    } catch (error) {
      console.error('Error fetching security logs:', error);
      toast.error('Failed to load security logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm) ||
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEvent = eventFilter === 'all' || log.event_type === eventFilter;
    const matchesPortal = portalFilter === 'all' || log.portal_attempted === portalFilter;
    
    return matchesSearch && matchesEvent && matchesPortal;
  });

  // Paginated logs - show only displayCount
  const displayedLogs = filteredLogs.slice(0, displayCount);
  const hasMore = filteredLogs.length > displayCount;
  const remainingCount = filteredLogs.length - displayCount;

  // Stats
  const stats = {
    total: logs.length,
    violations: logs.filter(l => l.event_type.includes('unauthorized') || l.event_type.includes('failed')).length,
    teamLogins: logs.filter(l => l.event_type === 'team_login_success').length,
    customerLogins: logs.filter(l => l.event_type === 'customer_login_success').length,
  };

  const getDeviceInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Mobile')) return 'Mobile';
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    return 'Desktop';
  };

  const getBrowserInfo = (userAgent: string | null) => {
    if (!userAgent) return 'Unknown';
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('OPR') || userAgent.includes('Opera')) return 'Opera';
    return 'Other';
  };

  // Get unique event types for filter
  const uniqueEventTypes = [...new Set(logs.map(l => l.event_type))];

  return (
    <div>
      {/* The figures live on the desk above; this is the record itself. */}
      <div className="flex flex-col gap-3 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          {[
            ['Events', stats.total, ''],
            ['Violations', stats.violations, stats.violations > 0 ? 'text-risk' : ''],
            ['Team sign-ins', stats.teamLogins, ''],
            ['Customer sign-ins', stats.customerLogins, ''],
          ].map(([label, value, tone]) => (
            <div key={String(label)} className="min-w-0">
              <p className="font-mono text-[8.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <p className={`mt-0.5 font-mono text-[15px] font-semibold tabular-nums ${tone}`}>{value as number}</p>
            </div>
          ))}
        </div>
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
          <div className="relative sm:w-[210px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search email, name or IP"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9 rounded-[10px] pl-8 text-[12.5px]"
            />
          </div>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="h-9 rounded-[10px] text-[12.5px] sm:w-[165px]">
              <Filter className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              {uniqueEventTypes.map(type => (
                <SelectItem key={type} value={type}>{eventTypeConfig[type]?.label || type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={portalFilter} onValueChange={setPortalFilter}>
            <SelectTrigger className="h-9 rounded-[10px] text-[12.5px] sm:w-[135px]">
              <SelectValue placeholder="Portal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All portals</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline" size="sm"
            className="h-9 gap-1.5 rounded-[10px] text-xs"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      <div>

          <TooltipProvider>
            {loading ? (
              <SkeletonTable cols={5} rows={6} />
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Portal / Role</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Device</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          {searchTerm || eventFilter !== 'all' || portalFilter !== 'all' 
                            ? 'No matching events found'
                            : 'No security events logged yet'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedLogs.map((log) => {
                        const config = eventTypeConfig[log.event_type] || { 
                          label: log.event_type, 
                          icon: <Shield className="w-3 h-3" />, 
                          variant: 'secondary' as const 
                        };
                        const geo = log.ip_address ? getGeoData(log.ip_address) : undefined;
                        
                        return (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge variant={config.variant} className="gap-1">
                                {config.icon}
                                {config.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium text-sm">
                                    {log.user_name || log.user_email || 'Unknown'}
                                  </p>
                                  {log.user_name && log.user_email && (
                                    <p className="text-xs text-muted-foreground">{log.user_email}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {log.portal_attempted && (
                                  <Badge variant="outline" className={`text-xs w-fit ${portalColors[log.portal_attempted] || ''}`}>
                                    {log.portal_attempted === 'team' ? 'Team' : 'Customer'}
                                  </Badge>
                                )}
                                {log.actual_role && (
                                  <Badge variant="outline" className={`text-xs w-fit ${roleColors[log.actual_role] || roleColors.unknown}`}>
                                    {log.actual_role === 'admin' ? 'Admin' : log.actual_role === 'user' ? 'Customer' : log.actual_role}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {geo && !geo.loading && !geo.error ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-help">
                                      <span className="text-lg">{getFlagEmoji(geo.countryCode)}</span>
                                      <div className="flex flex-col">
                                        <span className="text-sm">{geo.country}</span>
                                        {geo.city && geo.city !== 'Unknown' && (
                                          <span className="text-xs text-muted-foreground">{geo.city}</span>
                                        )}
                                      </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs">
                                    <div className="space-y-1 text-sm">
                                      <div className="flex items-center gap-2">
                                        <Globe className="h-3 w-3" />
                                        <span className="font-medium">{geo.country}</span>
                                      </div>
                                      <div className="text-muted-foreground">
                                        <p>{geo.region}, {geo.city}</p>
                                        <p className="text-xs">ISP: {geo.isp}</p>
                                        <p className="text-xs font-mono mt-1">{log.ip_address}</p>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : geo?.loading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Globe className="h-4 w-4 animate-pulse" />
                                  <span className="text-sm">Loading</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <MapPin className="h-3 w-3" />
                                  <span className="font-mono text-xs">{log.ip_address || 'Unknown'}</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Monitor className="h-3 w-3" />
                                <span className="text-xs">
                                  {getBrowserInfo(log.user_agent)} / {getDeviceInfo(log.user_agent)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span className="text-xs">
                                  {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
                
                {/* Show More/Less Buttons */}
                {filteredLogs.length > 5 && (
                  <div className="flex justify-center gap-3 py-3 border-t">
                    {displayCount > 5 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDisplayCount(5)}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <ChevronUp className="h-4 w-4" />
                        Show Less
                      </Button>
                    )}
                    {hasMore && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDisplayCount(prev => Math.min(prev + 10, filteredLogs.length))}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                      >
                        <ChevronDown className="h-4 w-4" />
                        Show More ({remainingCount} remaining)
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </TooltipProvider>
      </div>
    </div>
  );
}
