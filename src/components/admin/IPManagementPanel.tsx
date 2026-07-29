import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, ShieldOff, ShieldCheck, Plus, Trash2, RefreshCw, Clock, User, AlertTriangle, CheckCircle, Globe, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useIPGeolocation, getFlagEmoji } from '@/hooks/useIPGeolocation';
import { SkeletonTable } from '@/components/platform';

interface BlockedIP {
  id: string;
  ip_address: string;
  blocked_by: string | null;
  blockedByEmail: string;
  blockedByName: string;
  reason: string | null;
  is_auto_blocked: boolean;
  failed_attempts: number;
  blocked_at: string;
  expires_at: string | null;
}

interface WhitelistedIP {
  id: string;
  ip_address: string;
  added_by: string | null;
  addedByEmail: string;
  addedByName: string;
  notes: string | null;
  created_at: string;
}

export default function IPManagementPanel() {
  const { session } = useAuth();
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [whitelistedIPs, setWhitelistedIPs] = useState<WhitelistedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // IP Geolocation
  const { lookupMultipleIPs, getGeoData } = useIPGeolocation();
  
  // Block IP dialog state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [ipToBlock, setIpToBlock] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockDuration, setBlockDuration] = useState<string>('permanent');
  
  // Whitelist IP dialog state
  const [whitelistDialogOpen, setWhitelistDialogOpen] = useState(false);
  const [ipToWhitelist, setIpToWhitelist] = useState('');
  const [whitelistNotes, setWhitelistNotes] = useState('');

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    
    setLoading(true);
    try {
      const [blockedRes, whitelistedRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'get-blocked-ips' }),
        }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: 'get-whitelisted-ips' }),
        })
      ]);

      let blockedData: BlockedIP[] = [];
      let whitelistedData: WhitelistedIP[] = [];

      if (blockedRes.ok) {
        const data = await blockedRes.json();
        blockedData = data.blockedIPs || [];
        setBlockedIPs(blockedData);
      }

      if (whitelistedRes.ok) {
        const data = await whitelistedRes.json();
        whitelistedData = data.whitelistedIPs || [];
        setWhitelistedIPs(whitelistedData);
      }

      // Fetch geolocation for all IPs
      const allIPs = [
        ...blockedData.map(b => b.ip_address),
        ...whitelistedData.map(w => w.ip_address)
      ];
      if (allIPs.length > 0) {
        lookupMultipleIPs(allIPs);
      }
    } catch (error) {
      console.error('Failed to fetch IP data:', error);
      toast.error('Failed to load IP management data');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, lookupMultipleIPs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBlockIP = async () => {
    if (!session?.access_token || !ipToBlock.trim()) return;

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ipToBlock.trim())) {
      toast.error('Please enter a valid IP address');
      return;
    }

    setActionLoading(true);
    try {
      const expiresIn = blockDuration === 'permanent' ? null : parseInt(blockDuration);
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          action: 'block-ip',
          ipToBlock: ipToBlock.trim(),
          reason: blockReason.trim() || 'Manually blocked by admin',
          expiresIn
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`IP ${ipToBlock} has been blocked`);
        setBlockDialogOpen(false);
        setIpToBlock('');
        setBlockReason('');
        setBlockDuration('permanent');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to block IP');
      }
    } catch (error) {
      toast.error('Failed to block IP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockIP = async (ip: string) => {
    if (!session?.access_token) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'unblock-ip', ipToUnblock: ip }),
      });

      if (response.ok) {
        toast.success(`IP ${ip} has been unblocked`);
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to unblock IP');
      }
    } catch (error) {
      toast.error('Failed to unblock IP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWhitelistIP = async () => {
    if (!session?.access_token || !ipToWhitelist.trim()) return;

    // Validate IP format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(ipToWhitelist.trim())) {
      toast.error('Please enter a valid IP address');
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ 
          action: 'whitelist-ip',
          ipToWhitelist: ipToWhitelist.trim(),
          notes: whitelistNotes.trim() || 'Whitelisted by admin'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`IP ${ipToWhitelist} has been whitelisted`);
        setWhitelistDialogOpen(false);
        setIpToWhitelist('');
        setWhitelistNotes('');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to whitelist IP');
      }
    } catch (error) {
      toast.error('Failed to whitelist IP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFromWhitelist = async (ip: string) => {
    if (!session?.access_token) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/two-factor-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'remove-whitelist-ip', ipToRemove: ip }),
      });

      if (response.ok) {
        toast.success(`IP ${ip} removed from whitelist`);
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove from whitelist');
      }
    } catch (error) {
      toast.error('Failed to remove from whitelist');
    } finally {
      setActionLoading(false);
    }
  };

  const activeBlocks = blockedIPs.filter(b => !b.expires_at || new Date(b.expires_at) > new Date());
  const autoBlocks = blockedIPs.filter(b => b.is_auto_blocked);
  const manualBlocks = blockedIPs.filter(b => !b.is_auto_blocked);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked IPs</CardTitle>
            <ShieldOff className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBlocks.length}</div>
            <p className="text-xs text-muted-foreground">Active blocks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Blocked</CardTitle>
            <AlertTriangle className="h-4 w-4 text-attend" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autoBlocks.length}</div>
            <p className="text-xs text-muted-foreground">From failed attempts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manual Blocks</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{manualBlocks.length}</div>
            <p className="text-xs text-muted-foreground">By team members</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Whitelisted</CardTitle>
            <ShieldCheck className="h-4 w-4 text-ok" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{whitelistedIPs.length}</div>
            <p className="text-xs text-muted-foreground">Trusted IPs</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="blocked" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="blocked" className="flex items-center gap-2">
              <ShieldOff className="h-4 w-4" />
              Blocked IPs ({activeBlocks.length})
            </TabsTrigger>
            <TabsTrigger value="whitelisted" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Whitelisted IPs ({whitelistedIPs.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        <TabsContent value="blocked" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Blocked IP Addresses</CardTitle>
                  <CardDescription>
                    IPs that are blocked from accessing the team portal. All team members can see and manage this list.
                  </CardDescription>
                </div>
                <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Block IP
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Block IP Address</DialogTitle>
                      <DialogDescription>
                        Add an IP address to the blocklist. This will prevent access from this IP for all team members.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="ip">IP Address</Label>
                        <Input
                          id="ip"
                          placeholder="e.g. 192.168.1.1"
                          value={ipToBlock}
                          onChange={(e) => setIpToBlock(e.target.value)}
                          maxLength={15}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="reason">Reason (optional)</Label>
                        <Textarea
                          id="reason"
                          placeholder="Why is this IP being blocked?"
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          maxLength={500}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="duration">Block Duration</Label>
                        <Select value={blockDuration} onValueChange={setBlockDuration}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hour</SelectItem>
                            <SelectItem value="24">24 hours</SelectItem>
                            <SelectItem value="168">1 week</SelectItem>
                            <SelectItem value="720">30 days</SelectItem>
                            <SelectItem value="permanent">Permanent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleBlockIP} disabled={actionLoading || !ipToBlock.trim()}>
                        {actionLoading ? 'Blocking...' : 'Block IP'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable cols={4} rows={4} />
              ) : blockedIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No blocked IPs</p>
                  <p className="text-sm">IPs will appear here when blocked manually or after too many failed attempts</p>
                </div>
              ) : (
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Blocked By</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blockedIPs.map((block) => {
                        const isExpired = block.expires_at && new Date(block.expires_at) < new Date();
                        const geo = getGeoData(block.ip_address);
                        return (
                          <TableRow key={block.id} className={isExpired ? 'opacity-50' : ''}>
                            <TableCell className="font-mono font-medium">{block.ip_address}</TableCell>
                            <TableCell>
                              {geo ? (
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
                                    <div className="space-y-1">
                                      <p className="font-medium">{geo.country}</p>
                                      <p className="text-xs">Region: {geo.region}</p>
                                      <p className="text-xs">City: {geo.city}</p>
                                      <p className="text-xs">ISP: {geo.isp}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Globe className="h-4 w-4 animate-pulse" />
                                  <span className="text-sm">Loading...</span>
                                </div>
                              )}
                            </TableCell>
                          <TableCell>
                            {block.is_auto_blocked ? (
                              <Badge variant="outline" className="border-attend/20 bg-attend/10 text-attend">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Auto ({block.failed_attempts} fails)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-border/60 bg-foreground/[0.06] text-ink-2">
                                <User className="h-3 w-3 mr-1" />
                                Manual
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate" title={block.reason || 'No reason provided'}>
                            {block.reason || 'No reason provided'}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{block.blockedByName}</span>
                              <span className="text-xs text-muted-foreground">{block.blockedByEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {block.expires_at ? (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span className={isExpired ? 'text-muted-foreground line-through' : ''}>
                                  {formatDistanceToNow(new Date(block.expires_at), { addSuffix: true })}
                                </span>
                              </div>
                            ) : (
                              <Badge variant="destructive">Permanent</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Unblock
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Unblock IP Address?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove <span className="font-mono font-bold">{block.ip_address}</span> from the blocklist, 
                                    allowing access from this IP again.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleUnblockIP(block.ip_address)}>
                                    Unblock
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TooltipProvider>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelisted" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Whitelisted IP Addresses</CardTitle>
                  <CardDescription>
                    Trusted IPs that will never be auto-blocked. All team members can see and manage this list.
                  </CardDescription>
                </div>
                <Dialog open={whitelistDialogOpen} onOpenChange={setWhitelistDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Whitelist IP
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Whitelist IP Address</DialogTitle>
                      <DialogDescription>
                        Add an IP address to the whitelist. This IP will never be auto-blocked and will be removed from any existing blocks.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="whitelist-ip">IP Address</Label>
                        <Input
                          id="whitelist-ip"
                          placeholder="e.g. 192.168.1.1"
                          value={ipToWhitelist}
                          onChange={(e) => setIpToWhitelist(e.target.value)}
                          maxLength={15}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="e.g. Office IP, VPN endpoint"
                          value={whitelistNotes}
                          onChange={(e) => setWhitelistNotes(e.target.value)}
                          maxLength={500}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setWhitelistDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleWhitelistIP} disabled={actionLoading || !ipToWhitelist.trim()}>
                        {actionLoading ? 'Adding...' : 'Whitelist IP'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonTable cols={4} rows={4} />
              ) : whitelistedIPs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No whitelisted IPs</p>
                  <p className="text-sm">Add trusted IPs to prevent them from being auto-blocked</p>
                </div>
              ) : (
                <TooltipProvider>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Added By</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {whitelistedIPs.map((whitelist) => {
                        const geo = getGeoData(whitelist.ip_address);
                        return (
                          <TableRow key={whitelist.id}>
                            <TableCell className="font-mono font-medium">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                {whitelist.ip_address}
                              </div>
                            </TableCell>
                            <TableCell>
                              {geo ? (
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
                                    <div className="space-y-1">
                                      <p className="font-medium">{geo.country}</p>
                                      <p className="text-xs">Region: {geo.region}</p>
                                      <p className="text-xs">City: {geo.city}</p>
                                      <p className="text-xs">ISP: {geo.isp}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Globe className="h-4 w-4 animate-pulse" />
                                  <span className="text-sm">Loading...</span>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={whitelist.notes || 'No notes'}>
                              {whitelist.notes || 'No notes'}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{whitelist.addedByName}</span>
                                <span className="text-xs text-muted-foreground">{whitelist.addedByEmail}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDistanceToNow(new Date(whitelist.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Remove from Whitelist?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will remove <span className="font-mono font-bold">{whitelist.ip_address}</span> from the whitelist. 
                                  This IP may be auto-blocked if there are too many failed login attempts.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleRemoveFromWhitelist(whitelist.ip_address)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
