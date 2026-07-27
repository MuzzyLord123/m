import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Search, User, 
  Check, CheckCheck, ArrowLeft, X, Clock,
  CheckCircle2, AlertCircle, Settings, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import TeamInboxSettings from './TeamInboxSettings';

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

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'open':
        return <Badge variant="default" className="gap-1 bg-green-500/20 text-green-600 border-green-500/30"><CheckCircle2 className="w-3 h-3" />Open</Badge>;
      case 'waiting':
        return <Badge variant="secondary" className="gap-1 bg-yellow-500/20 text-yellow-600 border-yellow-500/30"><Clock className="w-3 h-3" />Waiting</Badge>;
      case 'closed':
        return <Badge variant="outline" className="gap-1 bg-muted text-muted-foreground"><X className="w-3 h-3" />Closed</Badge>;
      default:
        return <Badge variant="outline" className="gap-1"><AlertCircle className="w-3 h-3" />New</Badge>;
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

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || 'CL';
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'messages' | 'settings')} className="space-y-4">
      <TabsList className="grid w-full max-w-md grid-cols-2">
        <TabsTrigger value="messages" className="gap-2">
          <MessageSquare className="w-4 h-4" />
          Messages
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <Settings className="w-4 h-4" />
          Team Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings">
        <TeamInboxSettings />
      </TabsContent>

      <TabsContent value="messages">
        <div className="h-[calc(100vh-280px)] min-h-[500px] flex rounded-2xl border border-border overflow-hidden bg-background">
          {/* Conversations List */}
          <div className={`${selectedClient ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-border`}>
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Client Messages
              </h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <div className="flex gap-1 mt-3">
                {(['all', 'open', 'waiting', 'closed'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={statusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setStatusFilter(status)}
                    className="flex-1 text-xs capitalize"
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground mt-2">Loading...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No clients found</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredConversations.map((conv) => (
                    <motion.button
                      key={conv.client.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setSelectedClient(conv.client)}
                      className={`w-full p-4 text-left hover:bg-muted/50 transition-colors ${
                        selectedClient?.id === conv.client.id ? 'bg-muted' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(conv.client.full_name, conv.client.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium truncate">
                              {conv.client.full_name || conv.client.email}
                            </span>
                            {conv.lastMessage && (
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatTime(conv.lastMessage.created_at)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {getStatusBadge(conv.conversation?.status)}
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-1">
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage?.content || 'No messages yet'}
                            </p>
                            {conv.unreadCount > 0 && (
                              <Badge className="bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center text-xs">
                                {conv.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className={`${selectedClient ? 'flex' : 'hidden md:flex'} flex-col flex-1`}>
            {selectedClient ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden shrink-0"
                    onClick={() => setSelectedClient(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(selectedClient.full_name, selectedClient.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">
                        {selectedClient.full_name || selectedClient.email}
                      </h3>
                      {getStatusBadge(selectedConversation?.status)}
                    </div>
                    <div className="flex items-center gap-2">
                      {clientIsTyping ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <span>typing</span>
                          <TypingIndicator />
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground truncate">
                          {selectedClient.customer_id} • {selectedClient.company || 'No company'}
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
                        className="gap-1"
                      >
                        <X className="w-3 h-3" />
                        Close
                      </Button>
                    )}
                    {selectedConversation?.status === 'closed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateConversationStatus('open')}
                        className="gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm">Send a message to start the conversation</p>
                      </div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {messages.map((message) => {
                          const isAdmin = message.sender_id === user?.id;
                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className="group/msg relative">
                                <div
                                  className={`max-w-full rounded-2xl px-4 py-2.5 ${
                                    isAdmin
                                      ? 'bg-primary text-primary-foreground rounded-br-md'
                                      : 'bg-muted rounded-bl-md'
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.content}
                                  </p>
                                  <div className={`flex items-center gap-1 mt-1 ${isAdmin ? 'justify-end' : ''}`}>
                                    <span className={`text-[10px] ${isAdmin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                      {formatTime(message.created_at)}
                                    </span>
                                    {isAdmin && (
                                      message.is_read ? (
                                        <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                                      ) : (
                                        <Check className="w-3 h-3 text-primary-foreground/70" />
                                      )
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => { navigator.clipboard.writeText(message.content); toast.success('Copied to clipboard'); }}
                                  className="absolute -bottom-3 right-1 opacity-0 group-hover/msg:opacity-100 transition-opacity h-6 w-6 rounded-md bg-card border border-border flex items-center justify-center shadow-sm hover:bg-muted"
                                  title="Copy text"
                                >
                                  <Copy className="w-3 h-3 text-muted-foreground" />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      className="min-h-[44px] max-h-32 resize-none"
                      rows={1}
                    />
                    <Button 
                      onClick={sendMessage} 
                      disabled={!newMessage.trim() || sending}
                      size="icon"
                      className="shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <h3 className="font-medium text-lg mb-1">Select a conversation</h3>
                  <p className="text-sm">Choose a client from the list to view messages</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
