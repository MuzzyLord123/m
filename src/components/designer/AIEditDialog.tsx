import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Loader2, X, Wand2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useEditor } from './EditorContext';
import { EditorElement } from './types';
import { toast } from 'sonner';

interface AIEditDialogProps {
  open: boolean;
  onClose: () => void;
  elementId: string;
}

export function AIEditDialog({ open, onClose, elementId }: AIEditDialogProps) {
  const { state, dispatch } = useEditor();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const element = state.elements.find(el => el.id === elementId) ||
    (function findEl(els: EditorElement[]): EditorElement | null {
      for (const el of els) {
        if (el.id === elementId) return el;
        const found = findEl(el.children);
        if (found) return found;
      }
      return null;
    })(state.elements);

  const handleSubmit = async () => {
    if (!prompt.trim() || loading || !element) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-website-builder', {
        body: {
          prompt: `Edit this ${element.type} element: ${prompt.trim()}`,
          mode: 'edit',
          context: {
            existingElement: {
              type: element.type,
              props: element.props,
              styles: element.styles,
              name: element.name,
            },
          },
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.updates) {
        const updates: Partial<EditorElement> = {};
        if (data.updates.props) updates.props = { ...element.props, ...data.updates.props };
        if (data.updates.styles) updates.styles = { ...element.styles, desktop: { ...element.styles.desktop, ...data.updates.styles.desktop } };
        if (data.updates.name) updates.name = data.updates.name;

        dispatch({ type: 'UPDATE_ELEMENT', payload: { id: elementId, updates } });
        toast.success('Element updated with AI');
        onClose();
      } else if (data?.elements && Array.isArray(data.elements)) {
        // Replace element entirely
        const newEl = data.elements[0];
        if (newEl) {
          dispatch({ type: 'UPDATE_ELEMENT', payload: { id: elementId, updates: { props: newEl.props, styles: newEl.styles, name: newEl.name } } });
          toast.success('Element updated with AI');
          onClose();
        }
      } else {
        throw new Error('Invalid AI response');
      }
    } catch (err: any) {
      toast.error(err.message || 'AI edit failed');
    } finally {
      setLoading(false);
    }
  };

  const quickEdits = [
    'Make it more modern',
    'Add more spacing',
    'Make text larger and bolder',
    'Use a dark color scheme',
    'Add a gradient background',
    'Make it minimal and clean',
    'Add rounded corners',
    'Make it look premium',
  ];

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[600] flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="rounded-2xl overflow-hidden"
          style={{
            width: '440px',
            maxWidth: '90vw',
            backgroundColor: 'hsl(var(--studio-panel))',
            border: '1px solid hsl(var(--studio-line))',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid hsl(var(--studio-line))' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, hsl(var(--studio-ink-3)), hsl(var(--studio-ink-3)))' }}>
                <Wand2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Edit</h3>
                <p className="text-[10px] text-[hsl(var(--studio-ink-3))]">
                  Editing: <span className="text-[hsl(var(--studio-ink-3))]">{element?.name || element?.type || 'element'}</span>
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[hsl(var(--studio-hover))] transition-colors">
              <X className="w-4 h-4 text-[hsl(var(--studio-ink-3))]" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {/* Input */}
            <div className="rounded-xl overflow-hidden" style={{ border: '1px solid hsl(var(--studio-line))' }}>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
                placeholder="Describe the changes you want..."
                rows={3}
                className="w-full bg-transparent text-[13px] text-white placeholder:text-[hsl(var(--studio-hover))] p-4 resize-none outline-none"
                style={{ backgroundColor: 'hsl(var(--studio-panel))' }}
                autoFocus
              />
            </div>

            {/* Quick edits */}
            <div className="space-y-2">
              <span className="text-[9px] text-[hsl(var(--studio-ink-3))] font-semibold uppercase tracking-wider">Quick Edits</span>
              <div className="flex flex-wrap gap-1.5">
                {quickEdits.map((qe, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(qe)}
                    className="px-3 py-1.5 rounded-lg text-[11px] text-[hsl(var(--studio-ink-3))] hover:text-[hsl(var(--studio-ink-2))] hover:bg-[hsl(var(--studio-raised))] transition-all"
                    style={{ border: '1px solid hsl(var(--studio-line))' }}
                  >
                    {qe}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!prompt.trim() || loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-semibold transition-all disabled:opacity-30"
              style={{ background: 'linear-gradient(135deg, hsl(var(--studio-ink-3)), hsl(var(--studio-ink-3)))', color: 'hsl(var(--studio-ink))' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Applying changes…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Apply AI Edit
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}