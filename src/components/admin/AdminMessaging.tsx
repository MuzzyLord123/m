import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare, Send, Search, User,
  Check, CheckCheck, ArrowLeft, X,
  CheckCircle2, Settings, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import TeamInboxSettings from './TeamInboxSettings';
import { AvatarID, StatusBadge, SkeletonLedger, EmptyState } from '@/components/platform';
import { cn } from '@/lib/utils';

interface ClientProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  customer_id: string | null;
  company: string | null;
}

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  customer_id: string;
  assigned_admin_id: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

interface ConversationPreview {
  client: ClientProfile;
  lastMessage: Message | null;
  unreadCount: number;
  conversation: Conversation | null;
}

export default function AdminMessaging() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'waiting' | 'closed'>('all');
  const [activeTab, setActiveTab] = useState<'messages' | 'settings'>('messages');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { handleTyping, stopTyping, isUserTyping } = useTypingIndicator(user?.id, selectedClient?.user_id || null);
  const clientIsTyping = selectedClient ? isUserTyping(selectedClient.user_id) : false;

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient && user) {
      fetchMessages(selectedClient.user_id);
      markMessagesAsRead(selectedClient.user_id);
    }
  }, [selectedClient?.user_id, user?.id]);

  // Update selected conversation when conversations change
  useEffect(() => {
    if (selectedClient) {
      const conv = conversations.find(c => c.client.user_id === selectedClient.user_id);
      setSelectedConversation(conv?.conversation || null);
    }
  }, [conversations, selectedClient?.user_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          // Check if this message is relevant to the currently selected client
          if (selectedClient &&
              (newMsg.sender_id === selectedClient.user_id || newMsg.recipient_id === selectedClient.user_id)) {
            // Add new message to the list, avoiding duplicates
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            // Mark as read if it's from the client
            if (newMsg.sender_id === selectedClient.user_id && user) {
              markMessagesAsRead(selectedClient.user_id);
            }
          }
          // Refresh conversation list without setting loading state
          refreshConversations();
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => {
          // Refresh when messages are marked as read
          refreshConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClient?.user_id, user?.id]);

  const fetchClientsData = async () => {
    const { data: clientsData, error: clientsError } = await supabase
      .from('profiles')
      .select('id, user_id, email, full_name, customer_id, company')
      .order('full_name');

    if (clientsError) throw clientsError;

    const { data: messagesData, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (messagesError) throw messagesError;

    const { data: conversationsData, error: conversationsError } = await supabase
      .from('conversations')
      .select('*');

    if (conversationsError) throw conversationsError;

    const allClients = clientsData || [];
    const allMessages = messagesData || [];
    const allConversations = conversationsData || [];

    // Only show clients who have messages
    const clientsWithMessages = allClients.filter(client =>
      allMessages.some(m => m.sender_id === client.user_id || m.recipient_id === client.user_id)
    );

    const convPreviews: ConversationPreview[] = clientsWithMessages.map(client => {
      const clientMessages = allMessages.filter(
        m => m.sender_id === client.user_id || m.recipient_id === client.user_id
      );
      const lastMessage = clientMessages[0] || null;
      const unreadCount = clientMessages.filter(
        m => m.sender_id === client.user_id && !m.is_read
      ).length;
      const conversation = allConversations.find(c => c.customer_id === client.user_id) || null;

      return { client, lastMessage, unreadCount, conversation };
    });

    convPreviews.sort((a, b) => {
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return 0;
    });

    return convPreviews;
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const convPreviews = await fetchClientsData();
      setConversations(convPreviews);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh without loading spinner
  const refreshConversations = async () => {
    try {
      const convPreviews = await fetchClientsData();
      setConversations(convPreviews);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  };

  const fetchMessages = async (clientUserId: string) => {
    if (!user) return;

    // Get ALL messages where the client is either sender or recipient
    // This ensures we see all messages even if sent to/from different admins
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${clientUserId},recipient_id.eq.${clientUserId}`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } else {
      setMessages(data || []);
    }
  };

  const markMessagesAsRead = async (clientUserId: string) => {
    if (!user) return;

    // Mark all unread messages from this client to any admin as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', clientUserId)
      .eq('is_read', false);

    refreshConversations();
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedClient || !user) return;

    setSending(true);
    stopTyping();
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedClient.user_id,
          content: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    handleTyping();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateConversationStatus = async (status: 'open' | 'waiting' | 'closed') => {
    if (!selectedClient || !user) return;

    try {
      if (selectedConversation) {
        const { error } = await supabase
          .from('conversations')
          .update({
            status,
            closed_at: status === 'closed' ? new Date().toISOString() : null,
            assigned_admin_id: user.id
          })
          .eq('id', selectedConversation.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('conversations')
          .insert({
            customer_id: selectedClient.user_id,
            assigned_admin_id: user.id,
            status,
            closed_at: status === 'closed' ? new Date().toISOString() : null,
          });

        if (error) throw error;
      }

      toast.success(`Conversation marked as ${status}`);
      refreshConversations();
    } catch (error) {
      console.error('Error updating conversation status:', error);
      toast.error('Failed to update conversation status');
    }
  };

  /* Conversation status on the platform tone vocabulary — no hue map. */
  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'open':
        return <StatusBadge tone="ok" label="Open" className="text-[10.5px]" />;
      case 'waiting':
        return <StatusBadge tone="attend" label="Waiting" className="text-[10.5px]" />;
      case 'closed':
        return <StatusBadge tone="neutral" label="Closed" className="text-[10.5px]" />;
      default:
        return <StatusBadge tone="neutral" label="New" className="text-[10.5px]" />;
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (
        conv.client.full_name?.toLowerCase().includes(term) ||
        conv.client.email?.toLowerCase().includes(term) ||
        conv.client.company?.toLowerCase().includes(term) ||
        conv.client.customer_id?.toLowerCase().includes(term)
      );
      if (!matchesSearch) return false;
    }

    if (statusFilter !== 'all') {
      const convStatus = conv.conversation?.status || 'open';
      if (convStatus !== statusFilter) return false;
    }

    return true;
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-GB', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'messages' | 'settings')} className="space-y-4">
      <TabsList className="grid h-9 w-full max-w-md grid-cols-2 rounded-lg border border-border/60 bg-sunken p-0.5">
        <TabsTrigger value="messages" className="h-8 gap-2 rounded-md text-xs data-[state=active]:bg-card">
          <MessageSquare className="h-3.5 w-3.5" />
          Messages
        </TabsTrigger>
        <TabsTrigger value="settings" className="h-8 gap-2 rounded-md text-xs data-[state=active]:bg-card">
          <Settings className="h-3.5 w-3.5" />
          Team settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <TeamInboxSettings />
      </TabsContent>

      <TabsContent value="messages">
        <div className="flex h-[calc(100vh-280px)] min-h-[500px] overflow-hidden rounded-[10px] border border-border/60 bg-background">
          {/* Conversations List */}
          <div className={cn('w-full flex-col border-r border-border/60 md:w-80 lg:w-96', selectedClient ? 'hidden md:flex' : 'flex')}>
            <div className="border-b border-border/60 p-3">
              <h2 className="mb-2.5 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Client messages
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search clients…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-9 text-[13px]"
                />
              </div>

              <div className="mt-2.5 flex gap-1">
                {(['all', 'open', 'waiting', 'closed'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'h-6 flex-1 rounded-md text-[11px] font-medium capitalize transition-colors duration-150',
                      statusFilter === status
                        ? 'bg-foreground/[0.08] text-foreground'
                        : 'text-muted-foreground hover:bg-foreground/[0.04] hover:text-foreground',
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <SkeletonLedger rows={6} />
              ) : filteredConversations.length === 0 ? (
                <EmptyState compact title="No clients found" body="Conversations appear when clients message the studio." />
              ) : (
                <div className="divide-y divide-border/60">
                  {filteredConversations.map((conv) => (
                    <button
                      key={conv.client.id}
                      onClick={() => setSelectedClient(conv.client)}
                      className={cn(
                        'w-full px-3 py-2.5 text-left transition-colors duration-150 hover:bg-foreground/[0.025]',
                        selectedClient?.id === conv.client.id && 'bg-foreground/[0.05]',
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <AvatarID
                          name={conv.client.full_name}
                          email={conv.client.email}
                          size="lg"
                          className="shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-[13px] font-medium text-foreground">
                              {conv.client.full_name || conv.client.email}
                            </span>
                            {conv.lastMessage && (
                              <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted-foreground">
                                {formatTime(conv.lastMessage.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2">
                            {getStatusBadge(conv.conversation?.status)}
                          </div>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="truncate text-[11.5px] text-muted-foreground">
                              {conv.lastMessage?.content || 'No messages yet'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[10px] tabular-nums text-primary-foreground">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={cn('flex-1 flex-col', selectedClient ? 'flex' : 'hidden md:flex')}>
            {selectedClient ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b border-border/60 p-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 md:hidden"
                    aria-label="Back to conversations"
                    onClick={() => setSelectedClient(null)}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <AvatarID
                    name={selectedClient.full_name}
                    email={selectedClient.email}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-[13px] font-medium text-foreground">
                        {selectedClient.full_name || selectedClient.email}
                      </h3>
                      {getStatusBadge(selectedConversation?.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {clientIsTyping ? (
                        <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                          <span>typing</span>
                          <TypingIndicator />
                        </div>
                      ) : (
                        <p className="truncate text-[11.5px] text-muted-foreground">
                          <span className="font-mono tabular-nums">{selectedClient.customer_id}</span> · {selectedClient.company || 'No company'}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedConversation?.status !== 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateConversationStatus('closed')}
                        className="h-7 gap-1 rounded-md border-border/60 px-2.5 text-xs"
                      >
                        <X className="h-3 w-3" />
                        Close
                      </Button>
                    )}
                    {selectedConversation?.status === 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateConversationStatus('open')}
                        className="h-7 gap-1 rounded-md border-border/60 px-2.5 text-xs"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.length === 0 ? (
                      <EmptyState
                        compact
                        title="No messages yet"
                        body="Send a message to start the conversation."
                      />
                    ) : (
                      messages.map((message) => {
                        const isAdmin = message.sender_id === user?.id;
                        return (
                          <div
                            key={message.id}
                            className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}
                          >
                            <div className="group/msg relative">
                              <div
                                className={cn(
                                  'max-w-full rounded-lg px-3 py-2',
                                  isAdmin
                                    ? 'rounded-br-sm bg-primary text-primary-foreground'
                                    : 'rounded-bl-sm border border-border/60 bg-sunken text-foreground',
                                )}
                              >
                                <p className="whitespace-pre-wrap break-words text-[13px]">
                                  {message.content}
                                </p>
                                <div className={cn('mt-1 flex items-center gap-1', isAdmin && 'justify-end')}>
                                  <span className={cn('font-mono text-[9.5px] tabular-nums', isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                                    {formatTime(message.created_at)}
                                  </span>
                                  {isAdmin && (
                                    message.is_read ? (
                                      <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                                    ) : (
                                      <Check className="h-3 w-3 text-primary-foreground/70" />
                                    )
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => { navigator.clipboard.writeText(message.content); toast.success('Copied to clipboard'); }}
                                className="absolute -bottom-3 right-1 flex h-6 w-6 items-center justify-center rounded-md border border-border/60 bg-card opacity-0 transition-opacity duration-150 hover:bg-foreground/[0.04] group-hover/msg:opacity-100"
                                title="Copy text"
                              >
                                <Copy className="h-3 w-3 text-muted-foreground" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="border-t border-border/60 p-3">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message…"
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      className="max-h-32 min-h-[40px] resize-none text-[13px]"
                      rows={1}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <User className="mx-auto mb-3 h-8 w-8 opacity-30" />
                  <h3 className="mb-1 text-[15px] font-medium text-foreground">Select a conversation</h3>
                  <p className="text-[13px]">Choose a client from the list to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
