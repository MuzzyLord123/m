import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEditor } from './EditorContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Type, AlignLeft, Hash } from 'lucide-react';

interface InlineTextEditorProps {
  elementId: string;
  initialText: string;
  onFinish: () => void;
  style?: React.CSSProperties;
}

export function InlineTextEditor({ elementId, initialText, onFinish, style }: InlineTextEditorProps) {
  const { dispatch } = useEditor();
  const ref = useRef<HTMLDivElement>(null);
  const [charCount, setCharCount] = useState(initialText.length);
  const [wordCount, setWordCount] = useState(initialText.trim().split(/\s+/).filter(Boolean).length);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerText = initialText;
    ref.current.focus();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, []);

  const updateCounts = useCallback(() => {
    const text = ref.current?.innerText ?? '';
    setCharCount(text.length);
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  }, []);

  const save = useCallback(() => {
    const text = ref.current?.innerText ?? initialText;
    dispatch({
      type: 'UPDATE_ELEMENT',
      payload: { id: elementId, updates: { props: { text } } },
    });
    onFinish();
  }, [elementId, dispatch, onFinish, initialText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onFinish();
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
    }
    e.stopPropagation();
  };

  return (
    <>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={save}
        onKeyDown={handleKeyDown}
        onInput={updateCounts}
        onClick={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
        style={{
          ...style,
          outline: '2px solid #0073E6',
          outlineOffset: '2px',
          boxShadow: '0 0 0 5px rgba(0, 115, 230, 0.12), 0 4px 16px rgba(0,0,0,0.2)',
          cursor: 'text',
          minWidth: '20px',
          whiteSpace: 'pre-wrap',
          margin: 0,
          borderRadius: '2px',
        }}
      />
      {/* Live stats bar */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          style={{
            position: 'absolute',
            bottom: -28,
            left: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '3px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(12, 12, 12, 0.95)',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            zIndex: 200,
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: '#0073E6' }}>
            <Hash style={{ width: 8, height: 8 }} />
            <span className="tabular-nums font-mono">{charCount}</span>
            <span style={{ color: '#444' }}>chars</span>
          </span>
          <span style={{ width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '9px', color: '#8b5cf6' }}>
            <AlignLeft style={{ width: 8, height: 8 }} />
            <span className="tabular-nums font-mono">{wordCount}</span>
            <span style={{ color: '#444' }}>words</span>
          </span>
          <span style={{ width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.06)' }} />
          <span style={{ fontSize: '8px', color: '#333' }}>
            Enter ↵ save · Esc cancel
          </span>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
