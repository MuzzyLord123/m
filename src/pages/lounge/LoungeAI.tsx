import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Plus,
  Send,
  Trash2,
  Archive,
  ArchiveRestore,
  Sparkles,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { SkeletonLedger } from '@/components/platform';

interface Conversation {
  id: string;
  title: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

interface AIMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const TYPE_SPEED_MS = 18;

const SUGGESTED_PROMPTS = [
  { label: 'Business summary', prompt: 'Give me a full summary of my business — leads, deals, invoices, projects, and upcoming events.' },
  { label: 'Add a lead', prompt: 'Add a new lead to my CRM' },
  { label: 'Create invoice', prompt: 'Create a new invoice' },
  { label: 'Schedule event', prompt: 'Schedule a meeting for me' },
];

export default function LoungeAI() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
  const [showArchived, setShowArchived] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Streaming refs
  const pendingTextRef = useRef('');
  const typedSoFarRef = useRef('');
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamFinishedRef = useRef(false);
  const activeAssistantIdRef = useRef<string | null>(null);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      setConversations(data || []);
      setLoadingConversations(false);
    };
    fetchConversations();
  }, [user]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', activeConversationId)
        .order('created_at', { ascending: true });
      setMessages((data as AIMessage[]) || []);
    };
    fetchMessages();
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const stopTypingInterval = () => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
  };

  const startTypingInterval = () => {
    if (typingIntervalRef.current) return;
    typingIntervalRef.current = setInterval(() => {
      const pending = pendingTextRef.current;
      const currentId = activeAssistantIdRef.current;
      if (!currentId) return;
      if (!pending || pending.length === 0) {
        if (streamFinishedRef.current) stopTypingInterval();
        return;
      }
      const take = pending.slice(0, 2);
      pendingTextRef.current = pending.slice(2);
      typedSoFarRef.current += take;
      const nextText = typedSoFarRef.current;
      setMessages(prev => prev.map(m => m.id === currentId ? { ...m, content: nextText } : m));
    }, TYPE_SPEED_MS);
  };

  const waitForTypingToFinish = async () => {
    while (pendingTextRef.current.length > 0) {
      await new Promise(r => setTimeout(r, TYPE_SPEED_MS));
    }
  };

  const createConversation = async (): Promise<string | null> => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, title: 'New conversation' })
      .select()
      .single();
    if (error || !data) {
      toast.error('Failed to create conversation');
      return null;
    }
    setConversations(prev => [data, ...prev]);
    setActiveConversationId(data.id);
    return data.id;
  };

  const generateTitle = async (conversationId: string, firstMessage: string) => {
    const title = firstMessage.length > 50 ? firstMessage.slice(0, 47) + '...' : firstMessage;
    await supabase
      .from('ai_conversations')
      .update({ title })
      .eq('id', conversationId);
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, title } : c));
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading || !user) return;

    let convId = activeConversationId;
    const isFirstMessage = !convId;

    if (!convId) {
      convId = await createConversation();
      if (!convId) return;
    }

    // Save user message to DB
    const { data: userMsg } = await supabase
      .from('ai_messages')
      .insert({ conversation_id: convId, role: 'user', content: textToSend })
      .select()
      .single();

    if (!userMsg) return;

    const tempAssistantId = `temp-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      userMsg as AIMessage,
      { id: tempAssistantId, conversation_id: convId!, role: 'assistant', content: '', created_at: new Date().toISOString() },
    ]);

    activeAssistantIdRef.current = tempAssistantId;
    setInput('');
    setIsLoading(true);
    pendingTextRef.current = '';
    typedSoFarRef.current = '';
    streamFinishedRef.current = false;
    stopTypingInterval();

    // Generate title from first message
    if (isFirstMessage) {
      generateTitle(convId, textToSend);
    }

    // Build message history for context
    const historyForApi = messages
      .filter(m => m.content)
      .map(m => ({ role: m.role, content: m.content }));
    historyForApi.push({ role: 'user', content: textToSend });

    try {
      // C1 fix: the lounge assistant reads and writes this user's CRM data, so
      // it must authenticate as the user. Send the session JWT (not the anon
      // key) as the bearer token; the edge function derives identity from it
      // and ignores any body-supplied user_id.
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) throw new Error('Your session has expired. Please sign in again.');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quooro-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ messages: historyForApi, context: 'lounge' }),
        }
      );

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      startTypingInterval();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith(':')) continue;
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (typeof delta === 'string' && delta.length > 0) {
                  pendingTextRef.current += delta;
                }
              } catch {}
            }
          }
        }
      }

      streamFinishedRef.current = true;
      await waitForTypingToFinish();

      const finalContent = typedSoFarRef.current || 'I couldn\'t process that. Please try again.';

      // Check for [SEND_TO_SUPPORT] tags and auto-send
      const supportMatch = finalContent.match(/\[SEND_TO_SUPPORT\]([\s\S]*?)\[\/SEND_TO_SUPPORT\]/);
      if (supportMatch && supportMatch[1]) {
        const msgContent = supportMatch[1].trim();
        await sendToSupport(msgContent);
      }

      // Save assistant message to DB
      const { data: savedAssistant } = await supabase
        .from('ai_messages')
        .insert({ conversation_id: convId, role: 'assistant', content: finalContent })
        .select()
        .single();

      if (savedAssistant) {
        setMessages(prev => prev.map(m => m.id === tempAssistantId ? (savedAssistant as AIMessage) : m));
      }
    } catch (error) {
      console.error('AI error:', error);
      setMessages(prev => prev.map(m =>
        m.id === tempAssistantId ? { ...m, content: 'Connection error. Please try again.' } : m
      ));
    } finally {
      streamFinishedRef.current = true;
      stopTypingInterval();
      setIsLoading(false);
      activeAssistantIdRef.current = null;
    }
  };

  const toggleArchive = async (conv: Conversation) => {
    const newState = !conv.is_archived;
    await supabase.from('ai_conversations').update({ is_archived: newState }).eq('id', conv.id);
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, is_archived: newState } : c));
    if (activeConversationId === conv.id && newState) {
      setActiveConversationId(null);
    }
    toast.success(newState ? 'Chat archived' : 'Chat restored');
  };

  const deleteConversation = async (convId: string) => {
    await supabase.from('ai_conversations').delete().eq('id', convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversationId === convId) {
      setActiveConversationId(null);
      setMessages([]);
    }
    toast.success('Chat deleted');
  };

  const sendToSupport = useCallback(async (content: string) => {
    if (!user) return;
    try {
      const { data: adminId } = await supabase.rpc('get_primary_admin_id');
      if (!adminId) {
        toast.error('No support agent available');
        return;
      }
      const { data: msgData, error: msgError } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: adminId,
        content,
      }).select().single();
      if (msgError) {
        console.error('Message send error:', msgError);
        toast.error('Failed to send message');
        return;
      }
      toast.success('Message sent to support');

      // Generate a unique reference and log the ticket
      const { data: refId } = await supabase.rpc('generate_ticket_reference');
      const subject = content.length > 80 ? content.slice(0, 77) + '...' : content;
      const { error: ticketError } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        reference_id: refId || `REQ-${Date.now().toString().slice(-5)}`,
        subject,
        message: content,
        priority: 'standard',
        status: 'open',
        ai_conversation_id: activeConversationId,
        message_id: msgData?.id || null,
      });
      if (ticketError) {
        console.error('Ticket creation error:', ticketError);
        toast.error('Message sent but ticket logging failed');
      } else {
        toast.success('Support ticket created');
      }
    } catch (err) {
      console.error('sendToSupport error:', err);
      toast.error('Failed to process support request');
    }
  }, [user, activeConversationId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredConversations = conversations.filter(c => c.is_archived === showArchived);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return d.toLocaleDateString('en-GB', { weekday: 'short' });
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative mx-1 mb-1 flex h-[calc(100vh-8rem)] overflow-hidden rounded-[10px] border border-border/60 bg-card lg:mx-3 lg:mb-3">
      {/* Sidebar - conversation history */}
      {sidebarOpen && (
        <aside
          className={cn(
            'flex shrink-0 flex-col overflow-hidden border-r border-border/60',
            isMobile ? 'absolute inset-0 z-20 border-r-0 bg-background' : 'w-[280px] bg-background',
          )}
        >
          {/* Sidebar header */}
          <div className="space-y-3 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                History
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-lg"
                aria-label="Hide history"
                onClick={() => setSidebarOpen(false)}
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button
              onClick={() => { setActiveConversationId(null); setMessages([]); if (isMobile) setSidebarOpen(false); }}
              className="h-8 w-full gap-1.5 rounded-lg text-xs font-medium"
              variant="outline"
            >
              <Plus className="h-3.5 w-3.5" />
              New conversation
            </Button>
            <div className="flex gap-1 rounded-lg bg-sunken p-0.5">
              <button
                className={cn(
                  'flex-1 rounded-md py-1.5 text-[10px] font-medium transition-colors duration-150',
                  !showArchived ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setShowArchived(false)}
              >
                Active
              </button>
              <button
                className={cn(
                  'flex-1 rounded-md py-1.5 text-[10px] font-medium transition-colors duration-150',
                  showArchived ? 'bg-card text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
                onClick={() => setShowArchived(true)}
              >
                Archived
              </button>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-0.5 px-2 pb-2">
              {loadingConversations ? (
                <SkeletonLedger rows={4} />
              ) : filteredConversations.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  <p className="text-xs text-muted-foreground">
                    {showArchived ? 'No archived conversations' : 'Start a new conversation'}
                  </p>
                </div>
              ) : (
                filteredConversations.map(conv => (
                  <div
                    key={conv.id}
                    className={cn(
                      'group flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition-colors duration-150',
                      activeConversationId === conv.id
                        ? 'bg-foreground/[0.05] text-foreground'
                        : 'text-muted-foreground hover:bg-foreground/[0.025]',
                    )}
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      if (isMobile) setSidebarOpen(false);
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{conv.title}</p>
                      <p className="mt-0.5 font-mono text-[9.5px] tabular-nums text-muted-foreground">
                        {formatDate(conv.updated_at)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 rounded-md opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                          aria-label="Conversation actions"
                          onClick={e => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => toggleArchive(conv)} className="text-xs">
                          {conv.is_archived ? <ArchiveRestore className="mr-2 h-3.5 w-3.5" /> : <Archive className="mr-2 h-3.5 w-3.5" />}
                          {conv.is_archived ? 'Restore' : 'Archive'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteConversation(conv.id)}
                          className="text-xs text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Sidebar footer */}
          <div className="border-t border-border/60 p-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start gap-2 rounded-lg text-xs text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/lounge/tickets')}
            >
              <Ticket className="h-3.5 w-3.5" />
              Support tickets
            </Button>
          </div>
        </aside>
      )}

      {/* Main chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-b border-border/60 px-4">
          {!sidebarOpen && !isMobile && (
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" aria-label="Show history" onClick={() => setSidebarOpen(true)}>
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          {/* Mobile history button - visible on mobile when sidebar is closed */}
          {!sidebarOpen && isMobile && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 rounded-lg text-xs lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              History
            </Button>
          )}
          <div className="flex items-center gap-2">
            {/* The small Quooro AI glyph — the one place Sparkles identifies the product */}
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            <h3 className="text-[13px] font-semibold tracking-[-0.01em]">Quooro AI</h3>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-lg px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/lounge/messages')}
            >
              <MessageSquare className="h-3 w-3" />
              <span className="hidden sm:inline">Messages</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 rounded-lg px-2.5 text-[11px] text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/lounge/tickets')}
            >
              <Ticket className="h-3 w-3" />
              <span className="hidden sm:inline">Tickets</span>
            </Button>
          </div>
        </div>

        {/* Messages or empty state */}
        <ScrollArea className="flex-1">
          {!activeConversationId && messages.length === 0 ? (
            <div className="flex h-full min-h-[60vh] flex-col items-center justify-center px-4">
              <div className="w-full max-w-md text-center">
                <span aria-hidden className="mx-auto mb-5 block h-px w-8 bg-primary" />
                <h1 className="font-display text-[23px] font-semibold tracking-[-0.02em]">
                  How can I help?
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                  Ask about your projects, billing or support requests, or take action directly.
                </p>

                {/* Suggested prompts */}
                <div className="mt-8 grid grid-cols-2 gap-2">
                  {SUGGESTED_PROMPTS.map(item => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => handleSend(item.prompt)}
                      className="rounded-lg border border-border/60 px-3.5 py-3 text-left text-xs font-medium text-ink-2 transition-colors duration-150 hover:border-primary/40 hover:text-foreground"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
              {messages.map((message) => {
                const isStreaming = message.id === activeAssistantIdRef.current;
                if (isStreaming && !message.content) return null;

                return (
                  <div key={message.id} className={cn('flex flex-col', message.role === 'user' && 'items-end')}>
                    {message.role === 'user' ? (
                      <div className="max-w-[85%] rounded-lg bg-foreground/[0.05] px-3.5 py-2.5 text-sm leading-relaxed">
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                    ) : (
                      <div className="max-w-[95%] border-l border-border pl-4 text-sm leading-relaxed">
                        <div className="prose prose-sm max-w-none dark:prose-invert [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm [&>ol]:mb-2 [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                        {isStreaming && isLoading && (
                          <span
                            aria-hidden
                            className="ml-0.5 inline-block h-4 w-0.5 animate-pulse rounded-full bg-primary align-middle"
                          />
                        )}
                      </div>
                    )}
                    <span className={cn('mt-1 font-mono text-[9.5px] tabular-nums text-muted-foreground', message.role === 'assistant' && 'pl-4')}>
                      {formatTime(message.created_at)}
                    </span>
                  </div>
                );
              })}

              {/* Waiting indicator */}
              {isLoading && activeAssistantIdRef.current &&
                messages.find(m => m.id === activeAssistantIdRef.current)?.content === '' && (
                <div className="border-l border-border pl-4">
                  <span className="animate-pulse text-xs text-muted-foreground">Thinking</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border/60 p-3 lg:p-4">
          <div className="mx-auto max-w-2xl">
            <div
              className={cn(
                'flex items-end gap-2 rounded-[10px] border bg-foreground/[0.02] p-2 transition-colors duration-150',
                input.trim() ? 'border-primary/40' : 'border-border/60',
              )}
            >
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Quooro AI"
                className="max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent text-sm placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0"
                rows={1}
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-9 w-9 shrink-0 rounded-lg"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground/70">
              Quooro AI can be wrong. Verify important information independently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
