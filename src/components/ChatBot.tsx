import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Sparkles, DollarSign, Eye, Calendar, Zap, Terminal, Paperclip, FileText, Image, Download, File, FileDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useScrollIdle } from "@/hooks/useScrollIdle";
import { Input } from "@/components/ui/input";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { LazyMarkdown } from "@/components/LazyMarkdown";

interface Attachment {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string; // signed URL after upload
  storagePath?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: { name: string; type: string; url?: string; storagePath?: string }[];
}

interface QuickReply {
  label: string;
  message: string;
  icon: React.ComponentType<{ className?: string }>;
}

const quickReplies: QuickReply[] = [
  { label: "View Pricing", message: "What are your pricing packages and what's included in each one?", icon: DollarSign },
  { label: "Free Preview", message: "I'd like to get a free preview design for my website. How does that work?", icon: Eye },
  { label: "Book Consultation", message: "I want to book a consultation to discuss my project requirements.", icon: Calendar },
  { label: "Quick Quote", message: "Can you give me a quick quote for a professional business website?", icon: Zap },
];

const TYPE_SPEED_MS = 30;
const TYPE_CHARS_PER_TICK = 1;

interface ChatBotProps {
  isEmbedded?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf") || type.includes("document") || type.includes("text")) return FileText;
  return File;
}

export function ChatBot({ isEmbedded, isOpen: externalOpen, onToggle }: ChatBotProps = {}) {
  const location = useLocation();
  const { user } = useAuth();
  const isLounge = location.pathname.startsWith("/lounge");
  const isAIPage = location.pathname === "/lounge/ai";
  const [internalOpen, setInternalOpen] = useState(false);
  const [mobileTabExpanded, setMobileTabExpanded] = useState(false);
  const isScrollIdle = useScrollIdle();

  const isOpen = isEmbedded ? (externalOpen ?? false) : internalOpen;
  const toggleOpen = isEmbedded ? (onToggle ?? (() => {})) : () => setInternalOpen(prev => !prev);

  const getWelcomeMessage = () => isLounge
    ? "Quooro Customer Assistant online. How can I assist with your account today? You can also attach files for me to analyse."
    : "👋 Hi! I'm your Quooro Sales AI - available 24/7! I can help you find the perfect website package, answer questions about our services, or assist with any support needs. What brings you here today?";

  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: getWelcomeMessage() },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pendingTextRef = useRef<string>("");
  const typedSoFarRef = useRef<string>("");
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamFinishedRef = useRef(false);
  const activeAssistantIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus(); }, [isOpen]);

  useEffect(() => {
    const handleOpenChatbot = () => {
      if (isEmbedded && onToggle) onToggle();
      else setInternalOpen(true);
    };
    window.addEventListener('openChatbot', handleOpenChatbot);
    return () => window.removeEventListener('openChatbot', handleOpenChatbot);
  }, [isEmbedded, onToggle]);

  const stopTypingInterval = () => {
    if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; }
  };

  const startTypingInterval = () => {
    if (typingIntervalRef.current) return;
    typingIntervalRef.current = setInterval(() => {
      const pending = pendingTextRef.current;
      const currentAssistantId = activeAssistantIdRef.current;
      if (!currentAssistantId) return;
      if (!pending || pending.length === 0) { if (streamFinishedRef.current) stopTypingInterval(); return; }
      const take = pending.slice(0, TYPE_CHARS_PER_TICK);
      pendingTextRef.current = pending.slice(TYPE_CHARS_PER_TICK);
      typedSoFarRef.current += take;
      const nextText = typedSoFarRef.current;
      setMessages(prev => prev.map(m => m.id === currentAssistantId ? { ...m, content: nextText } : m));
    }, TYPE_SPEED_MS);
  };

  const waitForTypingToFinish = async () => {
    while (pendingTextRef.current.length > 0) await new Promise(r => setTimeout(r, TYPE_SPEED_MS));
  };

  // File handling
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files || !isLounge) return;
    const newAttachments: Attachment[] = [];
    for (let i = 0; i < Math.min(files.length, 5 - attachments.length); i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) continue; // 10MB max
      newAttachments.push({
        id: `${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
      });
    }
    setAttachments(prev => [...prev, ...newAttachments].slice(0, 5));
  }, [attachments.length, isLounge]);

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const uploadAttachments = async (atts: Attachment[]): Promise<Attachment[]> => {
    const uploaded: Attachment[] = [];
    for (const att of atts) {
      const ext = att.name.split('.').pop() || 'bin';
      const path = `chat-attachments/${user?.id || 'anon'}/${Date.now()}-${att.name}`;
      const { error } = await supabase.storage.from('customer-uploads').upload(path, att.file, {
        contentType: att.type,
      });
      if (!error) {
        uploaded.push({ ...att, storagePath: path });
      }
    }
    return uploaded;
  };

  // Drag and drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); if (isLounge) setIsDragOver(true); };
  const handleDragLeave = () => setIsDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleQuickReply = (message: string) => {
    setInput(message);
    setTimeout(() => { setInput(message); handleSendMessage(message); }, 100);
  };

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if ((!textToSend && attachments.length === 0) || isLoading) return;

    // Upload attachments first
    let uploadedAttachments: Attachment[] = [];
    if (attachments.length > 0) {
      uploadedAttachments = await uploadAttachments(attachments);
    }

    const attachmentInfo = uploadedAttachments.map(a => ({
      name: a.name, type: a.type, url: a.url, storagePath: a.storagePath,
    }));

    const displayContent = textToSend || `Attached ${uploadedAttachments.length} file(s)`;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: displayContent,
      attachments: attachmentInfo.length > 0 ? attachmentInfo : undefined,
    };

    const assistantId = `assistant-${Date.now() + 1}`;

    setMessages(prev => [...prev, userMessage, { id: assistantId, role: "assistant", content: "" }]);
    setActiveAssistantId(assistantId);
    activeAssistantIdRef.current = assistantId;
    setInput("");
    setAttachments([]);

    setIsLoading(true);
    pendingTextRef.current = "";
    typedSoFarRef.current = "";
    streamFinishedRef.current = false;
    stopTypingInterval();

    try {
      // Build content with file context
      let messageContent = textToSend || "";
      if (attachmentInfo.length > 0) {
        const fileDescriptions = attachmentInfo.map(a =>
          `[Attached file: "${a.name}" (${a.type}), stored at: ${a.storagePath}]`
        ).join("\n");
        messageContent = `${messageContent}\n\n${fileDescriptions}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quooro-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages.filter(m => m.id !== "welcome"), { role: "user", content: messageContent }].map(m => ({
              role: m.role, content: m.content,
            })),
            context: isLounge ? "lounge" : "public",
            ...(isLounge && user?.id ? { user_id: user.id } : {}),
            attachments: attachmentInfo.length > 0 ? attachmentInfo : undefined,
          }),
        }
      );

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      startTypingInterval();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const rawLine of lines) {
            const line = rawLine.trim();
            if (!line || line.startsWith(":")) continue;
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (typeof delta === "string" && delta.length > 0) {
                  pendingTextRef.current += delta;
                }
              } catch { /* partial JSON */ }
            }
          }
        }
      }

      streamFinishedRef.current = true;
      await waitForTypingToFinish();

      if (!typedSoFarRef.current.trim()) {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: "I apologize, I couldn't process that. Please try again." } : m));
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: "I'm having trouble connecting right now. Please try again in a moment." } : m));
    } finally {
      streamFinishedRef.current = true;
      stopTypingInterval();
      setIsLoading(false);
      setActiveAssistantId(null);
      activeAssistantIdRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  // Download handler for AI-generated export links
  const handleExportClick = async (storagePath: string, fileName: string) => {
    try {
      const { data } = await supabase.storage.from('customer-uploads').createSignedUrl(storagePath, 300);
      if (data?.signedUrl) {
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = fileName;
        a.click();
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  // Open invoice preview in new tab
  const handlePreviewClick = async (storagePath: string) => {
    try {
      const { data } = await supabase.storage.from('customer-uploads').createSignedUrl(storagePath, 600);
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err) {
      console.error('Preview error:', err);
    }
  };

  // State for inline previews
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  const loadPreviewUrl = useCallback(async (storagePath: string) => {
    if (previewUrls[storagePath]) return;
    try {
      const { data } = await supabase.storage.from('customer-uploads').createSignedUrl(storagePath, 3600);
      if (data?.signedUrl) {
        setPreviewUrls(prev => ({ ...prev, [storagePath]: data.signedUrl }));
      }
    } catch (err) {
      console.error('Preview URL error:', err);
    }
  }, [previewUrls]);

  // Render message content with markdown + export/preview link detection
  const renderMessageContent = (message: Message) => {
    const content = message.content;

    // Combined pattern for both EXPORT_FILE and INVOICE_PREVIEW
    const tagPattern = /\[(EXPORT_FILE|INVOICE_PREVIEW):([^\]]+):([^\]]+)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    const tempContent = content;
    while ((match = tagPattern.exec(tempContent)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <div key={`md-${lastIndex}`} className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1">
            <LazyMarkdown>{tempContent.slice(lastIndex, match.index)}</LazyMarkdown>
          </div>
        );
      }
      const tagType = match[1];
      const storagePath = match[2];
      const fileName = match[3];

      if (tagType === "INVOICE_PREVIEW") {
        // Load preview URL
        loadPreviewUrl(storagePath);
        const previewUrl = previewUrls[storagePath];

        parts.push(
          <div key={`preview-${match.index}`} className="my-2 rounded-xl overflow-hidden border border-border bg-card shadow-sm">
            {/* Inline preview */}
            {previewUrl ? (
              <iframe
                src={previewUrl}
                className="w-full bg-white rounded-t-xl"
                style={{ height: '360px', border: 'none' }}
                title={fileName}
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="h-[200px] flex items-center justify-center bg-muted/30 animate-pulse">
                <FileText className="w-8 h-8 text-muted-foreground/40" />
              </div>
            )}
            {/* Action bar */}
            <div className="flex items-center gap-2 p-2.5 bg-muted/30 border-t border-border">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-medium text-foreground truncate flex-1">{fileName}</span>
              <button
                onClick={() => handlePreviewClick(storagePath)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-medium transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </button>
              <button
                onClick={() => handleExportClick(storagePath, fileName)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-medium transition-colors"
              >
                <Download className="w-3 h-3" />
                Save
              </button>
            </div>
          </div>
        );
      } else {
        // Regular export file download button
        parts.push(
          <button
            key={`export-${match.index}`}
            onClick={() => handleExportClick(storagePath, fileName)}
            className="flex items-center gap-2 px-3 py-2 my-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors w-full"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="truncate">{fileName}</span>
          </button>
        );
      }
      lastIndex = match.index + match[0].length;
    }

    if (parts.length === 0) {
      if (message.role === "assistant") {
        return (
          <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1 [&>ol]:mb-1 [&>p:last-child]:mb-0">
            <LazyMarkdown>{content}</LazyMarkdown>
          </div>
        );
      }
      return <>{content}</>;
    }

    if (lastIndex < tempContent.length) {
      parts.push(
        <div key={`md-end`} className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>ul]:mb-1">
          <LazyMarkdown>{tempContent.slice(lastIndex)}</LazyMarkdown>
        </div>
      );
    }

    return <>{parts}</>;
  };

  // Render attachment chips on a user message
  const renderAttachments = (atts?: Message["attachments"]) => {
    if (!atts || atts.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        {atts.map((a, i) => {
          const Icon = getFileIcon(a.type);
          return (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-foreground/10 text-[10px]">
              <Icon className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{a.name}</span>
            </div>
          );
        })}
      </div>
    );
  };

  // Shared chat window content
  const renderChatWindow = (headerIcon: React.ReactNode, headerTitle: string, headerSub: string) => (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="fixed bottom-24 right-6 z-50 w-[420px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-8rem)] rounded-2xl overflow-hidden shadow-2xl border border-border flex flex-col bg-card"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm border-2 border-dashed border-primary rounded-2xl flex items-center justify-center"
          >
            <div className="text-center">
              <Paperclip className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-medium text-primary">Drop files here</p>
              <p className="text-xs text-muted-foreground">Max 10MB per file, up to 5 files</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-primary p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
          {headerIcon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-primary-foreground">{headerTitle}</h3>
          <p className="text-xs text-primary-foreground/70">{headerSub}</p>
        </div>
        <motion.div className="w-2 h-2 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.map((message) => {
          if (message.id === activeAssistantId && message.content === "") return null;
          return (
            <motion.div key={message.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${message.role === "user" ? "bg-muted text-foreground" : "bg-primary/10 text-primary"}`}>
                {message.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${message.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                {renderMessageContent(message)}
                {renderAttachments(message.attachments)}
                {message.id === activeAssistantId && isLoading && (
                  <motion.span className="inline-block w-1.5 h-4 bg-primary ml-0.5 rounded-sm align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />
                )}
              </div>
            </motion.div>
          );
        })}

        {isLoading && activeAssistantId && messages.find(m => m.id === activeAssistantId)?.content === "" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="w-4 h-4 text-primary" /></div>
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 0.1, 0.2].map(d => <motion.div key={d} className="w-2 h-2 bg-primary/50 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.5, repeat: Infinity, delay: d }} />)}
              </div>
            </div>
          </motion.div>
        )}

        {/* Quick replies for public site */}
        {messages.length === 1 && !isLoading && !isLounge && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
            <p className="text-xs text-muted-foreground text-center mb-3">Quick options:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickReplies.map((reply, index) => (
                <motion.button key={reply.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleQuickReply(reply.message)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors text-left">
                  <reply.icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{reply.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="px-4 py-2 border-t border-border bg-muted/50 flex gap-2 flex-wrap">
          {attachments.map(att => {
            const Icon = getFileIcon(att.type);
            return (
              <div key={att.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs group">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="truncate max-w-[80px]">{att.name}</span>
                <span className="text-muted-foreground">{formatFileSize(att.size)}</span>
                <button onClick={() => removeAttachment(att.id)} className="ml-1 text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          {isLounge && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                accept="*/*"
                onChange={e => { handleFileSelect(e.target.files); e.target.value = ''; }}
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || attachments.length >= 5}
                title="Attach files"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </>
          )}
          <Input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyPress}
            placeholder={isLounge ? "Message or drop files..." : "Ask about packages, pricing, or get support..."}
            className="flex-1 h-11 bg-muted border-0" disabled={isLoading} />
          <Button onClick={() => handleSendMessage()} disabled={(!input.trim() && attachments.length === 0) || isLoading} size="icon" className="h-11 w-11 shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {isLounge ? (
            <span>Files & CRUD • <a href="/lounge/ai" className="text-primary hover:underline">Open full AI</a></span>
          ) : "24/7 Sales & Support • Human agents 5PM-9PM"}
        </p>
      </div>
    </motion.div>
  );

  // Embedded lounge mode
  if (isEmbedded && isLounge) {
    return (
      <>
        <motion.button onClick={toggleOpen} className="w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="relative">
                <MessageCircle className="w-6 h-6" />
                <motion.div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-primary bg-emerald-500" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <AnimatePresence>
          {isOpen && renderChatWindow(
            <Terminal className="w-5 h-5 text-primary-foreground" />,
            "Customer Assistant",
            "CRUD • Files • AI Operations"
          )}
        </AnimatePresence>
      </>
    );
  }

  if (isLounge && !isEmbedded) return null;
  if (isAIPage) return null;

  return (
    <>
      {/* Desktop: floating round button (mirrors tour spacing from edge) */}
      <motion.button
        onClick={toggleOpen}
        className="hidden lg:flex fixed bottom-6 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg items-center justify-center group"
        style={{ pointerEvents: isOpen || isScrollIdle ? "auto" : "none" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          opacity: isOpen || isScrollIdle ? 1 : 0,
          scale: isOpen || isScrollIdle ? 1 : 0.8,
          boxShadow: isOpen ? "0 0 0 0 hsl(var(--primary) / 0)"
            : ["0 0 0 0 hsl(var(--primary) / 0.4)", "0 0 0 20px hsl(var(--primary) / 0)", "0 0 0 0 hsl(var(--primary) / 0.4)"],
        }}
        transition={{ boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" } }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="relative">
              <MessageCircle className="w-6 h-6" />
              <motion.div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-primary" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Mobile: mirrored edge handle, expands on tap — inline with tour tab */}
      {!isOpen && (
        <div className="lg:hidden fixed right-0 bottom-28 z-[99]">
          <motion.div
            initial={false}
            animate={{ width: mobileTabExpanded ? "auto" : 14 }}
            transition={{ type: "spring", damping: 26, stiffness: 280 }}
            className="relative h-10 overflow-hidden rounded-l-2xl bg-card/95 backdrop-blur-xl border border-r-0 border-border shadow-2xl"
          >
            {!mobileTabExpanded && (
              <button
                aria-label="Open Quooro Sales AI"
                onClick={() => setMobileTabExpanded(true)}
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="w-1 h-5 rounded-full bg-primary/70" />
              </button>
            )}
            <AnimatePresence>
              {mobileTabExpanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, delay: 0.12 }}
                  className="flex items-center gap-2 h-full pl-2 pr-1.5"
                >
                  <button
                    aria-label="Hide"
                    onClick={() => setMobileTabExpanded(false)}
                    className="mr-1 p-1 rounded-full hover:bg-muted/50"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button
                    aria-label="Open Quooro Sales AI"
                    onClick={() => { setMobileTabExpanded(false); toggleOpen(); }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="text-[11px] font-semibold text-foreground whitespace-nowrap">
                      Quooro AI
                    </span>
                    <span className="relative w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <MessageCircle className="w-3.5 h-3.5 text-primary-foreground" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border border-card" />
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {isOpen && renderChatWindow(
          isLounge ? <Terminal className="w-5 h-5 text-primary-foreground" /> : <Sparkles className="w-5 h-5 text-primary-foreground" />,
          isLounge ? "Customer Assistant" : "Quooro Sales AI",
          isLounge ? "Account Operations" : "24/7 Sales & Support"
        )}
      </AnimatePresence>
    </>
  );
}
