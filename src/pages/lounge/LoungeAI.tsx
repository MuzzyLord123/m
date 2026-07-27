import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Send,
  Trash2,
  Archive,
  ArchiveRestore,
  Bot,
  User,
  Sparkles,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  MoreHorizontal,
  Loader2,
  ArrowRight,
  Ticket,
  Zap,
  Shield,
  ChevronLeft,
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
const LOAD_DURATION_MS = 3000;

const LOADING_MESSAGES = [
  'Preparing your operational intelligence layer.',
  'Connecting to your account infrastructure.',
  'Calibrating personalised insights engine.',
  'Synchronising your project data securely.',
  'Initialising enterprise-grade assistant.',
  'Loading your digital operations context.',
  'Establishing secure session protocols.',
  'Mapping your account topology.',
  'Activating intelligent response framework.',
  'Configuring bespoke assistant parameters.',
];

const getRandomLoadingMessage = () =>
  LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];

const SUGGESTED_PROMPTS = [
  { label: 'Business summary', prompt: 'Give me a full summary of my business — leads, deals, invoices, projects, and upcoming events.', icon: Zap },
  { label: 'Add a lead', prompt: 'Add a new lead to my CRM', icon: Shield },
  { label: 'Create invoice', prompt: 'Create a new invoice', icon: MessageSquare },
  { label: 'Schedule event', prompt: 'Schedule a meeting for me', icon: Sparkles },
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
  const [pageReady, setPageReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Streaming refs
  const pendingTextRef = useRef('');
  const typedSoFarRef = useRef('');
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamFinishedRef = useRef(false);
  const activeAssistantIdRef = useRef<string | null>(null);

  // Loading animation - 3 second premium delay
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadingMessage] = useState(() => getRandomLoadingMessage());

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / LOAD_DURATION_MS, 1);
      // Ease-out cubic for natural deceleration feel
      const eased = 1 - Math.pow(1 - progress, 3);
      setLoadProgress(eased);
      if (progress >= 1) {
        clearInterval(interval);
        setPageReady(true);
      }
    }, 16);
    return () => clearInterval(interval);
  }, []);

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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quooro-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: historyForApi, context: 'lounge', user_id: user.id }),
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

  // Premium loading screen
  if (!pageReady) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] bg-background overflow-hidden">
        <motion.div
          className="flex flex-col items-center gap-10 w-full max-w-xs"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Animated icon cluster */}
          <div className="relative w-24 h-24">
            {/* Outer ring - slow pulse */}
            <motion.div
              className="absolute inset-0 rounded-full border border-primary/10"
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            {/* Middle ring - counter rotate */}
            <motion.div
              className="absolute inset-2 rounded-full border border-primary/15"
              animate={{ rotate: -360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            {/* Inner ring - rotate */}
            <motion.div
              className="absolute inset-4 rounded-full border border-dashed border-primary/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            {/* Core icon */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.7, type: 'spring', stiffness: 200, damping: 20 }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-primary/5">
                <motion.div
                  animate={{ rotateY: [0, 180, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Sparkles className="w-7 h-7 text-primary" />
                </motion.div>
              </div>
            </motion.div>
            {/* Floating particles */}
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-primary/30"
                style={{ top: '50%', left: '50%' }}
                animate={{
                  x: [0, Math.cos((i * 2 * Math.PI) / 3) * 44, 0],
                  y: [0, Math.sin((i * 2 * Math.PI) / 3) * 44, 0],
                  opacity: [0, 0.8, 0],
                  scale: [0, 1.2, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: i * 0.6,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Text */}
          <motion.div
            className="text-center space-y-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <h2 className="text-xl font-semibold tracking-tight">Digital Intelligence</h2>
            <motion.p
              className="text-sm text-muted-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              {loadingMessage}
            </motion.p>
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="w-full space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                style={{ width: `${loadProgress * 100}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                Initialising
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {Math.round(loadProgress * 100)}%
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl lg:rounded-3xl border border-border/30 bg-card/40 backdrop-blur-sm mx-1 mb-1 lg:mx-3 lg:mb-3 shadow-lg relative"
    >
      {/* Sidebar - Conversation History */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: isMobile ? '100%' : 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
              "border-r border-border/30 flex flex-col overflow-hidden shrink-0 rounded-l-2xl lg:rounded-l-3xl",
              isMobile ? "absolute inset-0 z-20 rounded-2xl border-r-0 bg-background" : "bg-background/60 backdrop-blur-xl"
            )}
          >
            {/* Sidebar Header */}
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">History</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-lg"
                  onClick={() => setSidebarOpen(false)}
                >
                  <PanelLeftClose className="w-3.5 h-3.5" />
                </Button>
              </div>
              <Button
                onClick={() => { setActiveConversationId(null); setMessages([]); if (isMobile) setSidebarOpen(false); }}
                className="w-full gap-2 h-9 rounded-xl text-xs font-medium"
                variant="outline"
              >
                <Plus className="w-3.5 h-3.5" />
                New Conversation
              </Button>
              <div className="flex gap-1 p-0.5 rounded-lg bg-muted/50">
                <button
                  className={cn(
                    'flex-1 text-[10px] font-medium py-1.5 rounded-md transition-all',
                    !showArchived ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setShowArchived(false)}
                >
                  Active
                </button>
                <button
                  className={cn(
                    'flex-1 text-[10px] font-medium py-1.5 rounded-md transition-all',
                    showArchived ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setShowArchived(true)}
                >
                  Archived
                </button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="px-2 pb-2 space-y-0.5">
                {loadingConversations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <p className="text-xs text-muted-foreground">
                      {showArchived ? 'No archived conversations' : 'Start a new conversation'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map(conv => (
                    <motion.div
                      key={conv.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        'group flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all',
                        activeConversationId === conv.id
                          ? 'bg-primary/8 text-foreground shadow-sm'
                          : 'hover:bg-muted/40 text-muted-foreground'
                      )}
                      onClick={() => {
                        setActiveConversationId(conv.id);
                        if (isMobile) setSidebarOpen(false);
                      }}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                        activeConversationId === conv.id ? 'bg-primary/10' : 'bg-muted/50'
                      )}>
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{conv.title}</p>
                        <p className="text-[9px] text-muted-foreground mt-0.5">{formatDate(conv.updated_at)}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            onClick={e => e.stopPropagation()}
                          >
                            <MoreHorizontal className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => toggleArchive(conv)} className="text-xs">
                            {conv.is_archived ? <ArchiveRestore className="w-3.5 h-3.5 mr-2" /> : <Archive className="w-3.5 h-3.5 mr-2" />}
                            {conv.is_archived ? 'Restore' : 'Archive'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => deleteConversation(conv.id)}
                            className="text-xs text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground rounded-xl h-9"
                onClick={() => navigate('/lounge/tickets')}
              >
                <Ticket className="w-3.5 h-3.5" />
                Support Tickets
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Premium Top Bar */}
        <div className="h-14 border-b border-border/30 flex items-center px-4 gap-3 shrink-0 bg-background/40 backdrop-blur-xl">
          <AnimatePresence mode="wait">
            {!sidebarOpen && !isMobile && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setSidebarOpen(true)}>
                  <PanelLeft className="w-4 h-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Mobile History button - always visible on mobile when sidebar is closed */}
          {!sidebarOpen && isMobile && (
            <Button 
              variant="outline" 
              size="sm" 
              className="lg:hidden h-8 gap-1.5 rounded-lg text-xs"
              onClick={() => setSidebarOpen(true)}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              History
            </Button>
          )}
          <div className="flex-1 flex items-center justify-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <motion.div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <h3 className="text-sm font-semibold tracking-tight">Digital Intelligence</h3>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] gap-1.5 text-muted-foreground hover:text-foreground rounded-lg h-8 px-2.5"
              onClick={() => navigate('/lounge/messages')}
            >
              <MessageSquare className="w-3 h-3" />
              <span className="hidden sm:inline">Messages</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] gap-1.5 text-muted-foreground hover:text-foreground rounded-lg h-8 px-2.5"
              onClick={() => navigate('/lounge/tickets')}
            >
              <Ticket className="w-3 h-3" />
              <span className="hidden sm:inline">Tickets</span>
            </Button>
          </div>
        </div>

        {/* Messages or Empty State */}
        <ScrollArea className="flex-1">
          {!activeConversationId && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-center max-w-md space-y-10"
              >
                {/* Animated icon */}
                <motion.div
                  className="relative mx-auto w-20 h-20"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5, type: 'spring', stiffness: 200 }}
                >
                  <motion.div
                    className="absolute inset-0 rounded-3xl bg-primary/5"
                    animate={{ rotate: [0, 3, -3, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
                    <Sparkles className="w-9 h-9 text-primary" />
                  </div>
                </motion.div>

                <div className="space-y-3">
                  <motion.h1
                    className="text-3xl font-bold tracking-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    How can I help?
                  </motion.h1>
                  <motion.p
                    className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.35 }}
                  >
                    Your enterprise operations assistant. Manage projects, billing, support requests — or take action directly.
                  </motion.p>
                </div>

                {/* Prompt Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {SUGGESTED_PROMPTS.map((item, i) => (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.08, type: 'spring', stiffness: 300, damping: 30 }}
                      onClick={() => handleSend(item.prompt)}
                      className="group text-left p-3.5 rounded-2xl border border-border/40 bg-background/50 hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-md hover:shadow-primary/5 transition-all duration-300"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/8 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                          <item.icon className="w-3.5 h-3.5 text-primary" />
                        </div>
                      </div>
                      <p className="text-xs font-medium leading-tight">{item.label}</p>
                      <ArrowRight className="w-3 h-3 text-primary mt-2 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5" />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto py-8 px-4 space-y-5">
              {messages.map((message, idx) => {
                const isStreaming = message.id === activeAssistantIdRef.current;
                if (isStreaming && !message.content) return null;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx < 3 ? idx * 0.05 : 0 }}
                    className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : '')}
                  >
                    <motion.div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                        message.role === 'user'
                          ? 'bg-primary/10'
                          : 'bg-gradient-to-br from-primary/15 to-primary/5'
                      )}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      {message.role === 'user'
                        ? <User className="w-3.5 h-3.5 text-primary" />
                        : <Bot className="w-3.5 h-3.5 text-primary" />
                      }
                    </motion.div>
                    <div className={cn(
                      'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-lg'
                        : 'bg-muted/60 border border-border/30 rounded-tl-lg'
                    )}>
                      {message.role === 'assistant' ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:mb-2 [&>ol]:mb-2 [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      {isStreaming && isLoading && (
                        <motion.span
                          className="inline-block w-1 h-4 bg-primary ml-0.5 rounded-full align-middle"
                          animate={{ opacity: [1, 0.3] }}
                          transition={{ duration: 0.4, repeat: Infinity }}
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}

              {/* Typing indicator */}
              {isLoading && activeAssistantIdRef.current &&
                messages.find(m => m.id === activeAssistantIdRef.current)?.content === '' && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-muted/60 border border-border/30 rounded-2xl rounded-tl-lg px-5 py-3.5">
                    <div className="flex gap-1">
                      {[0, 0.15, 0.3].map((delay, i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 bg-primary/50 rounded-full"
                          animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        {/* Premium Input Area */}
        <div className="p-3 lg:p-4 bg-background/40 backdrop-blur-xl border-t border-border/20">
          <div className="max-w-2xl mx-auto">
            <motion.div
              className={cn(
                'relative flex items-end gap-2 rounded-2xl border bg-background/80 p-2 transition-all duration-300',
                input.trim() ? 'border-primary/30 shadow-md shadow-primary/5' : 'border-border/40'
              )}
              layout
            >
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Quooro AI..."
                className="flex-1 min-h-[44px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/60"
                rows={1}
                disabled={isLoading}
              />
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-9 w-9 rounded-xl shrink-0 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </motion.div>
            </motion.div>
            <p className="text-[9px] text-muted-foreground/60 text-center mt-2.5 tracking-wide">
              Quooro AI may produce inaccurate responses. Verify critical information independently.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
