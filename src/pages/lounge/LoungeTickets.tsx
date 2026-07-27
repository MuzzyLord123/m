import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Search,
  Filter,
  X,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';

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

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  open: { label: 'Open', icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/20' },
  resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  closed: { label: 'Closed', icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted border-border' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-muted text-muted-foreground' },
  standard: { label: 'Standard', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400' },
  high: { label: 'High', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  urgent: { label: 'Urgent', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
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

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length,
  };

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
      toast.success('Ticket created successfully');
    } catch (err) {
      console.error('Create ticket error:', err);
      toast.error('Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Ticket className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-sm text-muted-foreground">Loading tickets...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      <LoungePageHeader
        title="Support Tickets"
        description="Track and manage your support requests"
        icon={Ticket}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Ticket</span>
          </Button>
        }
      />

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: 'Total', value: stats.total, icon: Ticket, color: 'text-foreground' },
          { label: 'Open', value: stats.open, icon: AlertCircle, color: 'text-amber-500' },
          { label: 'In Progress', value: stats.in_progress, icon: Clock, color: 'text-blue-500' },
          { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'text-emerald-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-2xl border border-border/50 bg-card p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </span>
              <stat.icon className={cn('w-4 h-4', stat.color)} />
            </div>
            <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Search & Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by reference ID, subject, or message..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl border-border/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44 h-11 rounded-xl border-border/50">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Ticket List */}
      {filteredTickets.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center justify-center py-20 text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <Ticket className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {tickets.length === 0 ? 'No support tickets yet' : 'No matching tickets'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {tickets.length === 0
                ? 'When you request support through Quooro AI, your tickets will appear here with unique reference IDs.'
                : 'Try adjusting your search or filter to find what you\'re looking for.'}
            </p>
          </div>
          {tickets.length === 0 && (
            <Button
              onClick={() => navigate('/lounge/ai')}
              className="gap-2 rounded-xl"
            >
              <Sparkles className="w-4 h-4" />
              Open Quooro AI
            </Button>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          {filteredTickets.map((ticket, i) => {
            const statusConf = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open;
            const priorityConf = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.standard;
            const StatusIcon = statusConf.icon;

            return (
              <motion.button
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => openDetail(ticket)}
                className="w-full text-left group"
              >
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-border/50 bg-card hover:border-primary/30 hover:bg-card/80 transition-all">
                  {/* Status Icon */}
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border', statusConf.bg)}>
                    <StatusIcon className={cn('w-5 h-5', statusConf.color)} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-primary">
                        {ticket.reference_id}
                      </span>
                      <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5 font-medium border', priorityConf.color)}>
                        {priorityConf.label}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{ticket.message}</p>
                  </div>

                  {/* Meta */}
                  <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                    <Badge variant="outline" className={cn('text-[10px] px-2 py-0.5 border', statusConf.bg, statusConf.color)}>
                      {statusConf.label}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm')}
                    </span>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      )}

      {/* Ticket Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          {selectedTicket && (() => {
            const statusConf = STATUS_CONFIG[selectedTicket.status] || STATUS_CONFIG.open;
            const priorityConf = PRIORITY_CONFIG[selectedTicket.priority] || PRIORITY_CONFIG.standard;
            const StatusIcon = statusConf.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border', statusConf.bg)}>
                      <StatusIcon className={cn('w-5 h-5', statusConf.color)} />
                    </div>
                    <div>
                      <DialogTitle className="text-lg">{selectedTicket.reference_id}</DialogTitle>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedTicket.created_at), 'dd MMMM yyyy, HH:mm')}
                      </p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-5 mt-2">
                  {/* Status & Priority */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn('border', statusConf.bg, statusConf.color)}>
                      {statusConf.label}
                    </Badge>
                    <Badge variant="outline" className={cn('border', priorityConf.color)}>
                      {priorityConf.label} Priority
                    </Badge>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Subject
                    </label>
                    <p className="text-sm font-medium">{selectedTicket.subject}</p>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Message Sent
                    </label>
                    <div className="rounded-xl bg-muted/50 border border-border/50 p-4">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    {selectedTicket.ai_conversation_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 rounded-xl flex-1"
                        onClick={() => {
                          setDetailOpen(false);
                          navigate('/lounge/ai');
                        }}
                      >
                        <Sparkles className="w-4 h-4" />
                        View AI Conversation
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 rounded-xl flex-1"
                      onClick={() => {
                        setDetailOpen(false);
                        navigate('/lounge/messages');
                      }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      View Messages
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-lg">Create Support Ticket</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-medium">Subject</Label>
              <Input
                placeholder="Brief description of your issue"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Message</Label>
              <Textarea
                placeholder="Describe your issue in detail..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                className="rounded-xl min-h-[120px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Priority</Label>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className="rounded-xl">
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
                className="flex-1 rounded-xl"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl gap-2"
                onClick={handleCreateTicket}
                disabled={!newSubject.trim() || !newMessage.trim() || creating}
              >
                {creating ? <Clock className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                Create Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
