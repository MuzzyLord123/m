import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Check, CheckCheck, Mail, Phone, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { TypingIndicator } from '@/components/ui/TypingIndicator';
import { PageHeader, Panel, AvatarID, EmptyState } from '@/components/platform';

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const TEAM_NAME = 'Quooro Team';

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
      toast.error('Your message did not send. Try again.');
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
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-5 w-32 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-3.5 w-56 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-6 rounded-[10px] border border-border/60 bg-card p-4">
          <div className="flex items-center gap-3 border-b border-border/60 pb-4">
            <span className="block h-9 w-9 animate-pulse rounded-full bg-foreground/[0.06]" />
            <span className="block h-3.5 w-28 animate-pulse rounded bg-foreground/[0.06]" />
          </div>
          <div className="space-y-3 py-6">
            <span className="block h-9 w-1/2 animate-pulse rounded-xl bg-foreground/[0.05]" />
            <span className="ml-auto block h-9 w-2/5 animate-pulse rounded-xl bg-foreground/[0.06]" />
            <span className="block h-9 w-2/5 animate-pulse rounded-xl bg-foreground/[0.05]" />
          </div>
        </div>
      </div>
    );
  }

  // If no admin exists yet, still show chat UI with contact form
  if (!adminId) {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
        <PageHeader
          kicker="Client portal"
          title="Messages"
          description="Chat directly with the studio"
        />

        <div className="mt-6">
          <Panel className="overflow-hidden">
            <div className="flex h-[500px] flex-col">
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-border/60 bg-sunken p-4">
                <AvatarID name={TEAM_NAME} size="lg" />
                <div>
                  <h3 className="text-[13.5px] font-[550]">Quooro team</h3>
                  <p className="text-[12px] text-muted-foreground">Development support</p>
                </div>
              </div>

              {/* Empty state */}
              <ScrollArea className="flex-1 p-4">
                <EmptyState
                  title="Start a conversation"
                  body="Have a question or need help with your project? Send a message and the team will get back to you shortly."
                />
              </ScrollArea>

              {/* Contact options */}
              <div className="space-y-3 border-t border-border/60 p-4">
                <p className="text-center text-sm text-muted-foreground">
                  Send us a message to start chatting
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a
                    href="mailto:support@quooro.com"
                    className="flex items-center justify-center gap-2 rounded-lg border border-border/60 p-3 transition-colors duration-150 hover:border-primary/40 hover:bg-foreground/[0.02]"
                  >
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">support@quooro.com</span>
                  </a>
                  <a
                    href="tel:+44"
                    className="flex items-center justify-center gap-2 rounded-lg border border-border/60 p-3 transition-colors duration-150 hover:border-primary/40 hover:bg-foreground/[0.02]"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Call us</span>
                  </a>
                </div>
              </div>
            </div>
          </Panel>

          {/* Alternative contact */}
          <div className="mt-4 rounded-[10px] border border-border/60 bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Need something urgently? Email <a href="mailto:support@quooro.com" className="text-foreground underline decoration-border underline-offset-2 transition-colors duration-150 hover:decoration-foreground">support@quooro.com</a> and we'll prioritise it.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Client portal"
        title="Messages"
        description="Chat directly with the studio"
      />

      <div className="mt-6">
        <Panel className="overflow-hidden">
          <div className="flex h-[500px] flex-col">
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-border/60 bg-sunken p-4">
              <AvatarID name={TEAM_NAME} size="lg" />
              <div>
                <h3 className="text-[13.5px] font-[550]">Quooro team</h3>
                <div className="flex items-center gap-2">
                  {adminIsTyping ? (
                    <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                      <span>typing</span>
                      <TypingIndicator />
                    </div>
                  ) : (
                    <p className="text-[12px] text-muted-foreground">Development support</p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <EmptyState
                    compact
                    title="No messages yet"
                    body="Start a conversation with the studio using the box below."
                    action={{ label: 'Write a message', onClick: () => document.getElementById('message-input')?.focus() }}
                  />
                ) : (
                  messages.map((message) => {
                    const isMe = message.sender_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className="group/msg relative">
                          <div
                            className={`max-w-full px-4 py-2.5 ${
                              isMe
                                ? 'rounded-xl rounded-br-md bg-primary text-primary-foreground'
                                : 'rounded-xl rounded-bl-md border border-border/60 bg-foreground/[0.03]'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm">
                              {message.content}
                            </p>
                            <div className={`mt-1 flex items-center gap-1 ${isMe ? 'justify-end' : ''}`}>
                              <span className={`font-mono text-[10px] tabular-nums ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {formatTime(message.created_at)}
                              </span>
                              {isMe && (
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
                            className="absolute -bottom-3 right-1 flex h-6 w-6 items-center justify-center rounded-md border border-border bg-card opacity-0 transition-opacity duration-150 hover:bg-foreground/[0.04] group-hover/msg:opacity-100"
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

            {/* Message input */}
            <div className="border-t border-border/60 p-4">
              <div className="flex gap-2">
                <Textarea
                  id="message-input"
                  placeholder="Type a message"
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyPress}
                  className="max-h-32 min-h-[44px] resize-none rounded-xl border-border/60 bg-foreground/[0.03] text-[14px] shadow-none focus-visible:border-primary/60 focus-visible:ring-1 focus-visible:ring-primary/30 dark:bg-foreground/[0.05]"
                  rows={1}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sending}
                  size="icon"
                  aria-label="Send message"
                  className="shrink-0 rounded-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Panel>

        {/* Alternative contact */}
        <div className="mt-4 rounded-[10px] border border-border/60 bg-card p-4">
          <p className="text-sm text-muted-foreground">
            Need something urgently? Email <a href="mailto:support@quooro.com" className="text-foreground underline decoration-border underline-offset-2 transition-colors duration-150 hover:decoration-foreground">support@quooro.com</a> and we'll prioritise it.
          </p>
        </div>
      </div>
    </div>
  );
}
