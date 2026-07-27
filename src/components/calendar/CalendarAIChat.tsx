import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Check, X, Loader2, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import type { CreateEventData } from '@/hooks/useCalendarEvents';

interface ParsedEvent {
  title: string;
  start_time: string;
  end_time: string;
  location?: string;
  is_all_day?: boolean;
  attendees?: string[];
  recurrence?: string;
  reminder_minutes?: number;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'event-card';
  content: string;
  parsedEvent?: ParsedEvent;
}

interface CalendarAIChatProps {
  onCreateEvent: (data: CreateEventData) => Promise<any>;
}

export function CalendarAIChat({ onCreateEvent }: CalendarAIChatProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const parseAIResponse = async (userMessage: string) => {
    setIsProcessing(true);
    try {
      const response = await supabase.functions.invoke('calendar-ai', {
        body: { message: userMessage },
      });
      if (response.error) throw response.error;
      return response.data as ParsedEvent;
    } catch (err) {
      console.error('AI parsing error:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMsg = input.trim();
    setInput('');
    setExpanded(true);

    if (userMsg.startsWith('/')) {
      const cmd = userMsg.toLowerCase();
      if (cmd === '/free') {
        setMessages(prev => [
          ...prev,
          { id: Date.now().toString(), type: 'user', content: userMsg },
          { id: (Date.now() + 1).toString(), type: 'assistant', content: 'Looking for your next free slot... Check your calendar for available times.' },
        ]);
        return;
      }
    }

    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), type: 'user', content: userMsg },
    ]);

    const parsed = await parseAIResponse(userMsg);

    if (parsed && parsed.title) {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), type: 'event-card', content: '', parsedEvent: parsed },
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), type: 'assistant', content: "I couldn't parse that. Try: \"Meeting with Stacy tomorrow 10-12pm at Starbucks\"" },
      ]);
    }
  };

  const handleConfirmEvent = async (parsed: ParsedEvent) => {
    const eventData: CreateEventData = {
      title: parsed.title,
      start_time: parsed.start_time,
      end_time: parsed.end_time,
      location: parsed.location,
      is_all_day: parsed.is_all_day,
    };

    const result = await onCreateEvent(eventData);
    if (result) {
      const start = new Date(parsed.start_time);
      const end = new Date(parsed.end_time);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'assistant',
          content: `✅ Created: **${parsed.title}**, ${format(start, 'EEE MMM d')} ${
            parsed.is_all_day ? '(All day)' : `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`
          }${parsed.location ? ` at ${parsed.location}` : ''}`,
        },
      ]);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm">
      {/* Chat messages */}
      <AnimatePresence>
        {expanded && messages.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="max-h-60 overflow-y-auto"
          >
            <div className="p-3 space-y-2.5">
              {messages.map(msg => (
                <div key={msg.id}>
                  {msg.type === 'user' && (
                    <div className="flex justify-end">
                      <div className="bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-2xl rounded-br-md max-w-[80%]">
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {msg.type === 'assistant' && (
                    <div className="flex justify-start">
                      <div className="bg-muted/60 text-xs px-3 py-1.5 rounded-2xl rounded-bl-md max-w-[80%] text-foreground">
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {msg.type === 'event-card' && msg.parsedEvent && (
                    <EventConfirmCard event={msg.parsedEvent} onConfirm={() => handleConfirmEvent(msg.parsedEvent!)} />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5">
        <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder='Schedule with AI... "Team standup every Monday at 9am"'
          className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 outline-none"
          disabled={isProcessing}
        />
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : input.trim() ? (
          <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-primary/10">
            <Send className="h-3.5 w-3.5 text-primary" />
          </Button>
        ) : null}
        {expanded && messages.length > 0 && (
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 rounded-full"
            onClick={() => { setExpanded(false); setMessages([]); }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </form>
    </div>
  );
}

function EventConfirmCard({ event, onConfirm }: { event: ParsedEvent; onConfirm: () => void }) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-card border border-border/60 p-3 space-y-2 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Event Preview</span>
        <Sparkles className="h-3 w-3 text-primary" />
      </div>
      <div className="text-sm font-semibold text-foreground">{event.title}</div>
      <div className="text-[11px] text-muted-foreground space-y-0.5">
        <div>📅 {format(start, 'EEEE, MMMM d, yyyy')}</div>
        <div>🕐 {event.is_all_day ? 'All day' : `${format(start, 'h:mm a')} – ${format(end, 'h:mm a')}`}</div>
        {event.location && <div>📍 {event.location}</div>}
        {event.recurrence && <div>🔁 {event.recurrence}</div>}
      </div>
      <Button size="sm" className="h-7 text-[11px] gap-1 shadow-sm" onClick={onConfirm}>
        <Check className="h-3 w-3" /> Confirm & Create
      </Button>
    </motion.div>
  );
}
