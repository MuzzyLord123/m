import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Sparkles, Wand2, Expand, Scissors, CheckCircle, Languages,
  ArrowRight, Loader2, Type, MessageCircle, Send
} from 'lucide-react';

interface AIWritingAssistantProps {
  editor: Editor;
}

const AI_ACTIONS = [
  { id: 'rewrite', label: 'Rewrite', icon: Wand2, desc: 'Improve clarity & flow', color: 'text-violet-500' },
  { id: 'expand', label: 'Expand', icon: Expand, desc: 'Add more detail', color: 'text-blue-500' },
  { id: 'shorten', label: 'Shorten', icon: Scissors, desc: 'Make concise', color: 'text-amber-500' },
  { id: 'fix_grammar', label: 'Fix Grammar', icon: CheckCircle, desc: 'Correct errors', color: 'text-emerald-500' },
  { id: 'summarize', label: 'Summarize', icon: Type, desc: '2-3 sentence summary', color: 'text-cyan-500' },
  { id: 'continue', label: 'Continue Writing', icon: ArrowRight, desc: 'Continue from cursor', color: 'text-pink-500' },
  { id: 'formal', label: 'Make Formal', icon: MessageCircle, desc: 'Professional tone', color: 'text-indigo-500' },
  { id: 'casual', label: 'Make Casual', icon: MessageCircle, desc: 'Conversational tone', color: 'text-orange-500' },
];

const TRANSLATE_ACTIONS = [
  { id: 'translate_es', label: '🇪🇸 Spanish' },
  { id: 'translate_fr', label: '🇫🇷 French' },
  { id: 'translate_de', label: '🇩🇪 German' },
  { id: 'translate_zh', label: '🇨🇳 Chinese' },
  { id: 'translate_ja', label: '🇯🇵 Japanese' },
  { id: 'translate_pt', label: '🇧🇷 Portuguese' },
  { id: 'translate_ko', label: '🇰🇷 Korean' },
  { id: 'translate_ar', label: '🇸🇦 Arabic' },
];

export function AIWritingAssistant({ editor }: AIWritingAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [lastUsedId, setLastUsedId] = useState<string | null>(() => {
    try { return localStorage.getItem('ai-last-action'); } catch { return null; }
  });

  const getSelectedText = useCallback(() => {
    const { from, to } = editor.state.selection;
    if (from === to) {
      // No selection - use current paragraph
      const resolved = editor.state.doc.resolve(from);
      const parent = resolved.parent;
      return parent.textContent || '';
    }
    return editor.state.doc.textBetween(from, to, '\n');
  }, [editor]);

  const executeAction = useCallback(async (actionId: string) => {
    const text = getSelectedText();
    if (!text.trim()) {
      toast.error('Select some text or place your cursor in a paragraph');
      return;
    }

    setLoading(true);
    setActiveAction(actionId);
    setLastUsedId(actionId);
    try { localStorage.setItem('ai-last-action', actionId); } catch {}

    try {
      const { data, error } = await supabase.functions.invoke('doc-ai', {
        body: { text, action: actionId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result = data.result;
      if (!result) throw new Error('No result from AI');

      const { from, to } = editor.state.selection;
      if (actionId === 'continue') {
        // Insert after current position
        editor.chain().focus().insertContentAt(to, ' ' + result).run();
      } else if (from === to) {
        // Replace current paragraph content
        const resolved = editor.state.doc.resolve(from);
        const parentFrom = resolved.start(resolved.depth);
        const parentTo = resolved.end(resolved.depth);
        editor.chain().focus().deleteRange({ from: parentFrom, to: parentTo }).insertContentAt(parentFrom, result).run();
      } else {
        // Replace selection
        editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result).run();
      }
      
      toast.success(`${AI_ACTIONS.find(a => a.id === actionId)?.label || 'AI'} applied`);
    } catch (err: any) {
      toast.error(err.message || 'AI request failed');
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }, [editor, getSelectedText]);

  return (
    <Popover>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-[28px] w-[28px] rounded-[6px] relative",
                loading && "animate-pulse"
              )}
            >
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-[6px]">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                </div>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px] px-2 py-1 rounded-md">AI Assistant</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-64 p-1.5 rounded-xl shadow-xl border-border/50" align="start">
        {/* Custom prompt */}
        <div className="flex gap-1 mb-1.5 px-1">
          <Input
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder="Custom instruction…"
            className="h-7 text-[10px] rounded-lg flex-1"
            disabled={loading}
            onKeyDown={e => {
              if (e.key === 'Enter' && customPrompt.trim()) {
                executeAction(`custom:${customPrompt.trim()}`);
                setCustomPrompt('');
              }
            }}
          />
          <Button
            size="icon"
            className="h-7 w-7 rounded-lg shrink-0"
            disabled={!customPrompt.trim() || loading}
            onClick={() => { executeAction(`custom:${customPrompt.trim()}`); setCustomPrompt(''); }}
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
        <div className="h-px bg-border/30 mb-1" />

        {/* Quick repeat last action */}
        {lastUsedId && (() => {
          const last = AI_ACTIONS.find(a => a.id === lastUsedId);
          if (!last) return null;
          const Icon = last.icon;
          return (
            <>
              <button
                onClick={() => executeAction(last.id)}
                disabled={loading}
                className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-left bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-colors disabled:opacity-40 mb-1"
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", last.color)} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold">Repeat: {last.label}</div>
                  <div className="text-[8px] text-muted-foreground">Last used action</div>
                </div>
                {activeAction === last.id && <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />}
              </button>
              <div className="h-px bg-border/30 mb-1" />
            </>
          );
        })()}
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1.5">AI Actions</p>
        <div className="space-y-0.5">
          {AI_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => executeAction(action.id)}
                disabled={loading}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-left hover:bg-muted/60 transition-colors disabled:opacity-40"
              >
                <Icon className={cn("h-3.5 w-3.5 shrink-0", action.color)} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium">{action.label}</div>
                  <div className="text-[9px] text-muted-foreground">{action.desc}</div>
                </div>
                {activeAction === action.id && <Loader2 className="h-3 w-3 animate-spin text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="h-px bg-border/30 my-1" />
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider px-2 py-1">
          <Languages className="h-3 w-3 inline mr-1" />Translate
        </p>
        <div className="grid grid-cols-2 gap-0.5">
          {TRANSLATE_ACTIONS.map((action) => (
            <button
              key={action.id}
              onClick={() => executeAction(action.id)}
              disabled={loading}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] hover:bg-muted/60 transition-colors disabled:opacity-40"
            >
              {action.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
