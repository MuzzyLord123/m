import { useState, useEffect } from 'react';
import {
  Ticket,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  User,
  MessageSquare,
  Sparkles,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SupportTicket {
  id: string;
  user_id: string;
  reference_id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  ai_conversation_id: string | null;
  message_id: string | null;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  customer_id: string | null;
  company: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  open: { label: 'Open', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Loader2 },
  resolved: { label: 'Resolved', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground border-border', icon: CheckCircle2 },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
  standard: { label: 'Standard', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
  urgent: { label: 'Urgent', color: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ status: '', priority: '', admin_notes: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ticketsRes, profilesRes] = await Promise.all([
        supabase.from('support_tickets').select('*').order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, full_name, email, customer_id, company'),
      ]);
      if (ticketsRes.error) throw ticketsRes.error;
      if (profilesRes.error) throw profilesRes.error;
      setTickets((ticketsRes.data as SupportTicket[]) || []);
      setProfiles(profilesRes.data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const getClientInfo = (userId: string) => profiles.find(p => p.user_id === userId);

  const getTicketsByStatus = (status: string) => tickets.filter(t => t.status === status);

  const handleOpenDialog = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setFormData({
      status: ticket.status,
      priority: ticket.priority,
      admin_notes: '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedTicket) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: formData.status,
          priority: formData.priority,
        })
        .eq('id', selectedTicket.id);
      if (error) throw error;
      toast.success('Ticket updated');
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating ticket:', error);
      toast.error('Failed to update ticket');
    } finally {
      setSaving(false);
    }
  };

  const filteredTickets = (status?: string) => {
    let filtered = status ? tickets.filter(t => t.status === status) : tickets;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.reference_id.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.message.toLowerCase().includes(q) ||
        getClientInfo(t.user_id)?.full_name?.toLowerCase().includes(q) ||
        getClientInfo(t.user_id)?.email?.toLowerCase().includes(q)
      );
    }
    return filtered;
  };

  const stats = {
    total: tickets.length,
    open: getTicketsByStatus('open').length,
    in_progress: getTicketsByStatus('in_progress').length,
    resolved: getTicketsByStatus('resolved').length + getTicketsByStatus('closed').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  const renderTable = (ticketList: SupportTicket[]) => (
    ticketList.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-16">
        <Ticket className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <h3 className="font-medium text-lg mb-1">No tickets found</h3>
        <p className="text-muted-foreground text-sm">Support tickets from the AI assistant will appear here.</p>
      </div>
    ) : (
      <ScrollArea className="h-[520px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Reference</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ticketList.map(ticket => {
              const client = getClientInfo(ticket.user_id);
              const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
              const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.standard;
              const StatusIcon = statusConf.icon;

              return (
                <TableRow key={ticket.id} className="cursor-pointer hover:bg-muted/30" onClick={() => handleOpenDialog(ticket)}>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">
                      {ticket.reference_id}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{client?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground truncate">{client?.customer_id || client?.email || '—'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm max-w-[220px] truncate">{ticket.subject}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('text-xs', priorityConf.color)}>{priorityConf.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('gap-1 text-xs', statusConf.color)}>
                      <StatusIcon className={cn('w-3 h-3', ticket.status === 'in_progress' && 'animate-spin')} />
                      {statusConf.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {ticket.ai_conversation_id ? (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <Sparkles className="w-3 h-3" />
                        AI
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-xs">
                        <MessageSquare className="w-3 h-3" />
                        Manual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); handleOpenDialog(ticket); }}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    )
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Ticket className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertCircle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.open}</p>
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Loader2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.resolved}</p>
                <p className="text-sm text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by reference, client, or subject..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="overflow-x-auto w-max">
          <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({stats.in_progress})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card><CardContent className="p-0">{renderTable(filteredTickets())}</CardContent></Card>
        </TabsContent>
        <TabsContent value="open">
          <Card><CardContent className="p-0">{renderTable(filteredTickets('open'))}</CardContent></Card>
        </TabsContent>
        <TabsContent value="in_progress">
          <Card><CardContent className="p-0">{renderTable(filteredTickets('in_progress'))}</CardContent></Card>
        </TabsContent>
        <TabsContent value="resolved">
          <Card><CardContent className="p-0">{renderTable(filteredTickets('resolved'))}</CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-primary" />
              Ticket {selectedTicket?.reference_id}
            </DialogTitle>
          </DialogHeader>
          {selectedTicket && (() => {
            const client = getClientInfo(selectedTicket.user_id);
            const statusConf = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.open;
            const priorityConf = PRIORITY_CONFIG[selectedTicket.priority] || PRIORITY_CONFIG.standard;
            return (
              <div className="space-y-6 pt-2">
                {/* Client & Meta */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <p className="text-xs text-muted-foreground mb-1">Client</p>
                      <p className="font-medium text-sm">{client?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{client?.email || '—'}</p>
                      {client?.company && <p className="text-xs text-muted-foreground">{client.company}</p>}
                      {client?.customer_id && (
                        <Badge variant="outline" className="mt-2 text-xs font-mono">{client.customer_id}</Badge>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4 space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Created</p>
                        <p className="text-sm">{format(new Date(selectedTicket.created_at), 'PPpp')}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={cn('text-xs', statusConf.color)}>{statusConf.label}</Badge>
                        <Badge className={cn('text-xs', priorityConf.color)}>{priorityConf.label}</Badge>
                      </div>
                      {selectedTicket.ai_conversation_id && (
                        <Badge variant="outline" className="gap-1 text-xs">
                          <Sparkles className="w-3 h-3" /> AI-Generated
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Subject & Message */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Subject</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm font-medium">{selectedTicket.subject}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Full Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{selectedTicket.message}</p>
                  </CardContent>
                </Card>

                {/* Update Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Status</Label>
                    <Select value={formData.status} onValueChange={v => setFormData(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Priority</Label>
                    <Select value={formData.priority} onValueChange={v => setFormData(f => ({ ...f, priority: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Update Ticket
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
