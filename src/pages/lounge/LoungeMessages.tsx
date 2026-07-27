import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import { MessageSquare, Send, Check, CheckCheck, Mail, Phone, ArrowRight, Plus, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { TypingIndicator } from '@/components/ui/TypingIndicator';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function LoungeMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [adminId, setAdminId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { handleTyping, stopTyping, isUserTyping } = useTypingIndicator(user?.id, adminId);
  const adminIsTyping = adminId ? isUserTyping(adminId) : false;

  useEffect(() => {
    fetchAdminId();
  }, []);

  useEffect(() => {
    if (user && adminId) {
      fetchMessages();
      markMessagesAsRead();
    }
  }, [user, adminId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('client-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          // If this message involves us, add it
          if (newMsg.sender_id === user.id || newMsg.recipient_id === user.id) {
            setMessages(prev => [...prev, newMsg]);
            // Mark as read if it's from admin
            if (newMsg.sender_id !== user.id) {
              markMessagesAsRead();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchAdminId = async () => {
    // Use a SECURITY DEFINER function so clients can discover the team inbox
    const { data, error } = await supabase.rpc('get_primary_admin_id');

    if (error) {
      console.error('Error fetching admin:', error);
    } else if (data) {
      setAdminId(data);
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    if (!user || !adminId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${adminId}),and(sender_id.eq.${adminId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages(data || []);
    }
  };

  const markMessagesAsRead = async () => {
    if (!user || !adminId) return;

    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', adminId)
      .eq('recipient_id', user.id)
      .eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !adminId) return;

    setSending(true);
    stopTyping();
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          recipient_id: adminId,
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  // If no admin exists yet, still show chat UI with contact form
  if (!adminId) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          <LoungePageHeader
            title="Messages"
            description="Chat directly with your development team."
            icon={MessageSquare}
          />

          {/* Chat Container */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden">
              <div className="h-[500px] flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/30">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      QT
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">Quooro Team</h3>
                    <p className="text-sm text-muted-foreground">Development Support</p>
                  </div>
                </div>

                {/* Empty State with Start Chat CTA */}
                <ScrollArea className="flex-1 p-4">
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <MessageSquare className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Start a Conversation</h3>
                    <p className="text-muted-foreground max-w-md mb-6">
                      Have a question or need help with your project? Send us a message below and our team will get back to you shortly.
                    </p>
                  </div>
                </ScrollArea>

                {/* Contact Form */}
                <div className="p-4 border-t border-border space-y-3">
                  <p className="text-sm text-muted-foreground text-center">
                    Send us a message to start chatting
                  </p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <a 
                      href="mailto:support@quooro.com" 
                      className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">support@quooro.com</span>
                    </a>
                    <a 
                      href="tel:+44" 
                      className="flex items-center justify-center gap-2 p-3 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/50 transition-colors"
                    >
                      <Phone className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Call Us</span>
                    </a>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Alternative Contact */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10"
          >
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
            <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-lg sm:text-xl font-semibold">Need immediate assistance?</h3>
                <p className="text-sm text-muted-foreground">
                  Email us at support@quooro.com for urgent requests.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        <LoungePageHeader
          title="Messages"
          description="Chat directly with your development team."
          icon={MessageSquare}
        />

        {/* Chat Container */}
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden">
            <div className="h-[500px] flex flex-col">
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/30">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    QT
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">Quooro Team</h3>
                  <div className="flex items-center gap-2">
                    {adminIsTyping ? (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <span>typing</span>
                        <TypingIndicator />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Development Support</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">No messages yet</p>
                      <p className="text-sm mb-4">Start a conversation with our development team</p>
                      <Button onClick={() => document.getElementById('message-input')?.focus()} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Start Chat
                      </Button>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {messages.map((message) => {
                        const isMe = message.sender_id === user?.id;
                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className="group/msg relative">
                              <div
                                className={`max-w-full rounded-2xl px-4 py-2.5 ${
                                  isMe
                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                    : 'bg-muted rounded-bl-md'
                                }`}
                              >
                                <p className="text-sm whitespace-pre-wrap break-words">
                                  {message.content}
                                </p>
                                <div className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                                  <span className={`text-[10px] ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                    {formatTime(message.created_at)}
                                  </span>
                                  {isMe && (
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

              {/* Message Input - Always visible */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Textarea
                    id="message-input"
                    placeholder="Type a message to start chatting..."
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
            </div>
          </Card>
        </motion.div>

        {/* Alternative Contact */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10"
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
          <div className="relative p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold">Need immediate assistance?</h3>
              <p className="text-sm text-muted-foreground">
                Email us at support@quooro.com for urgent requests.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
