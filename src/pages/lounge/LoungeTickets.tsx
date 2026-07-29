import { useState, useEffect } from 'react';
import {
  Ticket,
  ChevronRight,
  MessageSquare,
  Search,
  X,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import {
  PageHeader, Panel, PanelHeader, StatusBadge, StatusDot, statusTone, SkeletonLedger,
  FIELD, FIELD_LABEL,
  type Tone,
} from '@/components/platform';

interface SupportTicket {
  id: string;
  reference_id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
  ai_conversation_id: string | null;
}

const PRIORITY_TONE: Record<string, { tone: Tone; label: string }> = {
  low: { tone: 'neutral', label: 'Low' },
  standard: { tone: 'neutral', label: 'Standard' },
  high: { tone: 'attend', label: 'High' },
  urgent: { tone: 'risk', label: 'Urgent' },
};

export default function LoungeTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [newPriority, setNewPriority] = useState('standard');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchTickets = async () => {
      const { data } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setTickets((data as SupportTicket[]) || []);
      setLoading(false);
    };
    fetchTickets();
  }, [user]);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch =
      !searchQuery ||
      t.reference_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;

  const openDetail = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setDetailOpen(true);
  };

  const handleCreateTicket = async () => {
    if (!user || !newSubject.trim() || !newMessage.trim()) return;
    setCreating(true);
    try {
      // Get admin for messaging
      const { data: adminId } = await supabase.rpc('get_primary_admin_id');

      // Send message to support
      if (adminId) {
        await supabase.from('messages').insert({
          sender_id: user.id,
          recipient_id: adminId,
          content: `[Ticket] ${newSubject}\n\n${newMessage}`,
        });
      }

      // Generate reference
      const { data: refId } = await supabase.rpc('generate_ticket_reference');

      const { data: ticket, error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        reference_id: refId || `REQ-${Date.now().toString().slice(-5)}`,
        subject: newSubject.trim(),
        message: newMessage.trim(),
        priority: newPriority,
        status: 'open',
      }).select().single();

      if (error) throw error;

      if (ticket) {
        setTickets(prev => [ticket as SupportTicket, ...prev]);
      }

      setNewSubject('');
      setNewMessage('');
      setNewPriority('standard');
      setCreateOpen(false);
      toast.success('Ticket created');
    } catch (err) {
      console.error('Create ticket error:', err);
      toast.error('Your ticket was not created. Try again.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-5 w-32 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-3.5 w-56 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-6 rounded-[10px] border border-border/60">
          <SkeletonLedger rows={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Client portal"
        title="Support tickets"
        description="Track your support requests and their progress"
        actions={
          <Button onClick={() => setCreateOpen(true)} className="h-8 gap-1.5 rounded-lg px-3 text-xs">
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New ticket</span>
          </Button>
        }
      />

      {/* Search and filter */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by reference, subject or message"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn(FIELD, 'pl-10')}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className={cn(FIELD, 'w-full sm:w-44')}>
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket list */}
      <div className="mt-5">
        {filteredTickets.length === 0 ? (
          <Panel>
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <span aria-hidden className="mb-4 block h-px w-8 bg-primary" />
              <p className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">
                {tickets.length === 0 ? 'No support tickets yet' : 'No matching tickets'}
              </p>
              <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                {tickets.length === 0
                  ? 'When you request support, your tickets appear here with unique reference IDs.'
                  : 'Adjust your search or filter to find the ticket you need.'}
              </p>
              {tickets.length === 0 && (
                <Button
                  size="sm"
                  className="mt-4 h-8 rounded-lg px-3 text-xs"
                  onClick={() => navigate('/lounge/ai')}
                >
                  Open Quooro AI
                </Button>
              )}
            </div>
          </Panel>
        ) : (
          <Panel>
            <PanelHeader label={`${filteredTickets.length} ${filteredTickets.length === 1 ? 'ticket' : 'tickets'} · ${openCount} open`} />
            <div>
              {filteredTickets.map((ticket) => {
                const priority = PRIORITY_TONE[ticket.priority] || PRIORITY_TONE.standard;
                return (
                  <button
                    type="button"
                    key={ticket.id}
                    onClick={() => openDetail(ticket)}
                    className="group flex w-full items-center gap-3 border-t border-border/60 px-4 py-2.5 text-left transition-colors duration-150 first:border-t-0 hover:bg-foreground/[0.025] focus-visible:bg-foreground/[0.03]"
                  >
                    <StatusDot tone={statusTone(ticket.status)} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2">
                        <span className="font-mono text-[10.5px] tabular-nums text-muted-foreground">{ticket.reference_id}</span>
                        {(ticket.priority === 'high' || ticket.priority === 'urgent') && (
                          <StatusBadge tone={priority.tone} label={priority.label} className="text-[10.5px]" />
                        )}
                      </span>
                      <span className="block truncate text-[13px] font-[450] text-foreground">{ticket.subject}</span>
                      <span className="block truncate text-[11.5px] text-muted-foreground">{ticket.message}</span>
                    </span>
                    <span className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                      <StatusBadge status={ticket.status} />
                      <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                        {format(new Date(ticket.created_at), 'd MMM yyyy, HH:mm')}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-colors duration-150 group-hover:text-foreground" />
                  </button>
                );
              })}
            </div>
          </Panel>
        )}
      </div>

      {/* Ticket detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          {selectedTicket && (() => {
            const priority = PRIORITY_TONE[selectedTicket.priority] || PRIORITY_TONE.standard;
            return (
              <>
                <DialogHeader>
                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {selectedTicket.reference_id}
                  </span>
                  <DialogTitle className="text-[15px]">{selectedTicket.subject}</DialogTitle>
                  <p className="font-mono text-[10.5px] tabular-nums text-muted-foreground">
                    {format(new Date(selectedTicket.created_at), 'd MMMM yyyy, HH:mm')}
                  </p>
                </DialogHeader>

                <div className="mt-2 space-y-5">
                  <div className="flex items-center gap-4">
                    <StatusBadge status={selectedTicket.status} />
                    <StatusBadge tone={priority.tone} label={`${priority.label} priority`} />
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                      Message sent
                    </span>
                    <div className="rounded-[10px] border border-border/60 bg-foreground/[0.02] p-4">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedTicket.message}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                    {selectedTicket.ai_conversation_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 flex-1 gap-1.5 rounded-lg text-xs"
                        onClick={() => {
                          setDetailOpen(false);
                          navigate('/lounge/ai');
                        }}
                      >
                        View AI conversation
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 flex-1 gap-1.5 rounded-lg text-xs"
                      onClick={() => {
                        setDetailOpen(false);
                        navigate('/lounge/messages');
                      }}
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      View messages
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Create ticket dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New support ticket</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Subject</Label>
              <Input
                placeholder="A short description of the issue"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                className={FIELD}
              />
            </div>
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Message</Label>
              <Textarea
                placeholder="Describe the issue in detail"
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="min-h-[120px] resize-none rounded-xl border-border/60 bg-foreground/[0.03] text-[14px] shadow-none focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Priority</Label>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className={FIELD}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="h-8 flex-1 rounded-lg text-xs"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="h-8 flex-1 gap-1.5 rounded-lg text-xs"
                onClick={handleCreateTicket}
                disabled={!newSubject.trim() || !newMessage.trim() || creating}
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ticket className="h-3.5 w-3.5" />}
                Create ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
