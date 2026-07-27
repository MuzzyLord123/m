import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Editor } from '@tiptap/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, X, Send, Check, Trash2, Plus, Reply
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function InlineReply({ commentId, onReply }: { commentId: string; onReply: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 mt-1.5 text-[8px] text-muted-foreground hover:text-primary transition-colors"
      >
        <Reply className="h-2.5 w-2.5" /> Reply
      </button>
    );
  }
  return (
    <div className="flex gap-1 mt-1.5">
      <Input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Reply…"
        className="h-5 text-[9px] rounded-md flex-1"
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter' && text.trim()) { onReply(text.trim()); setText(''); setOpen(false); }
          if (e.key === 'Escape') setOpen(false);
        }}
      />
      <Button size="icon" className="h-5 w-5 rounded-md shrink-0" onClick={() => { if (text.trim()) { onReply(text.trim()); setText(''); setOpen(false); } }}>
        <Send className="h-2 w-2" />
      </Button>
    </div>
  );
}

interface Comment {
  id: string;
  content: string;
  selected_text: string | null;
  selection_from: number | null;
  selection_to: number | null;
  is_resolved: boolean;
  created_at: string;
}

interface CommentsProps {
  documentId: string;
  editor: Editor;
  show: boolean;
  onClose: () => void;
}

export function DocumentComments({ documentId, editor, show, onClose }: CommentsProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const loadComments = useCallback(async () => {
    if (!documentId) return;
    const { data } = await supabase
      .from('document_comments')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false });
    setComments((data as Comment[]) || []);
  }, [documentId]);

  useEffect(() => {
    if (show) loadComments();
  }, [show, loadComments]);

  const addComment = async () => {
    if (!newComment.trim() || !user) return;
    setLoading(true);

    const { from, to } = editor.state.selection;
    const selectedText = from !== to ? editor.state.doc.textBetween(from, to) : null;

    const { error } = await supabase.from('document_comments').insert({
      document_id: documentId,
      user_id: user.id,
      content: newComment.trim(),
      selected_text: selectedText,
      selection_from: from !== to ? from : null,
      selection_to: from !== to ? to : null,
    });

    if (error) {
      toast.error('Failed to add comment');
    } else {
      setNewComment('');
      loadComments();
    }
    setLoading(false);
  };

  const toggleResolved = async (id: string, currentState: boolean) => {
    await supabase.from('document_comments').update({ is_resolved: !currentState }).eq('id', id);
    loadComments();
  };

  const deleteComment = async (id: string) => {
    await supabase.from('document_comments').delete().eq('id', id);
    loadComments();
  };

  const jumpToSelection = (from: number | null, to: number | null) => {
    if (from !== null && to !== null) {
      try {
        editor.chain().focus().setTextSelection({ from, to }).run();
      } catch {
        // Selection may be invalid if content changed
      }
    }
  };

  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');
  const unresolvedCount = comments.filter(c => !c.is_resolved).length;
  const resolvedCount = comments.filter(c => c.is_resolved).length;
  const filteredComments = (() => {
    let list = filter === 'all' ? comments : filter === 'open' ? comments.filter(c => !c.is_resolved) : comments.filter(c => c.is_resolved);
    if (sortBy === 'oldest') list = [...list].reverse();
    return list;
  })();

  if (!show) return null;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 280, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="shrink-0 border-l border-border/30 bg-card/50 overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Comments</h3>
          {unresolvedCount > 0 && (
            <span className="h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px] font-bold">
              {unresolvedCount}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/20">
        {([
          { key: 'all' as const, label: 'All', count: comments.length },
          { key: 'open' as const, label: 'Open', count: unresolvedCount },
          { key: 'resolved' as const, label: 'Resolved', count: resolvedCount },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-medium transition-colors",
              filter === tab.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
            <span className={cn(
              "text-[7px] tabular-nums px-1 py-px rounded-full font-bold",
              filter === tab.key ? "bg-primary/20" : "bg-muted"
            )}>
              {tab.count}
            </span>
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={() => setSortBy(s => s === 'newest' ? 'oldest' : 'newest')}
            className="text-[8px] text-muted-foreground hover:text-primary transition-colors px-1.5 py-0.5 rounded-md hover:bg-muted/50"
          >
            {sortBy === 'newest' ? '↓ Newest' : '↑ Oldest'}
          </button>
        </div>
      </div>

      {/* New comment input */}
      <div className="p-2 border-b border-border/20">
        <div className="flex gap-1.5">
          <Input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment…"
            className="h-7 text-[10px] rounded-lg flex-1"
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && addComment()}
          />
          <Button size="icon" className="h-7 w-7 rounded-lg shrink-0" onClick={addComment} disabled={!newComment.trim() || loading}>
            <Send className="h-3 w-3" />
          </Button>
        </div>
        {editor.state.selection.from !== editor.state.selection.to && (
          <p className="text-[8px] text-primary/70 mt-1 px-1">
            💡 Comment will be linked to selected text
          </p>
        )}
      </div>

      {/* Comments list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1.5">
          {filteredComments.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-[10px] text-muted-foreground/60">
                {filter === 'all' ? 'No comments yet' : filter === 'open' ? 'No open comments' : 'No resolved comments'}
              </p>
            </div>
          )}
          {filteredComments.map(c => (
            <div
              key={c.id}
              className={cn(
                "rounded-xl p-2.5 border transition-all",
                c.is_resolved
                  ? "border-border/10 bg-muted/20 opacity-50"
                  : "border-border/30 bg-card hover:border-primary/20"
              )}
            >
              {c.selected_text && (
                <button
                  onClick={() => jumpToSelection(c.selection_from, c.selection_to)}
                  className="w-full text-left mb-1.5 px-2 py-1 bg-primary/5 rounded-md border-l-2 border-primary/30"
                >
                  <p className="text-[9px] text-primary/70 italic truncate">"{c.selected_text}"</p>
                </button>
              )}
              <p className="text-[11px] text-foreground/90 leading-relaxed">{c.content}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[8px] text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
                <div className="flex gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-md"
                    onClick={() => toggleResolved(c.id, c.is_resolved)}
                    title={c.is_resolved ? 'Reopen' : 'Resolve'}
                  >
                    <Check className={cn("h-2.5 w-2.5", c.is_resolved && "text-emerald-500")} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 rounded-md text-destructive/60 hover:text-destructive"
                    onClick={() => deleteComment(c.id)}
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </div>
              {/* Inline reply */}
              <InlineReply commentId={c.id} onReply={(text) => {
                // Add reply as a new comment referencing the parent
                const replyContent = `↳ ${text}`;
                setNewComment('');
                (async () => {
                  if (!user) return;
                  await supabase.from('document_comments').insert({
                    document_id: documentId,
                    user_id: user.id,
                    content: replyContent,
                    is_resolved: false,
                  } as any);
                  loadComments();
                })();
              }} />
            </div>
          ))}
        </div>
      </ScrollArea>
    </motion.div>
  );
}
