import { useMemo } from 'react';
import { useEditor } from './EditorContext';
import { buildCSS } from './utils/cssCompiler';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface CSSPreviewDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CSSPreviewDialog({ open, onClose }: CSSPreviewDialogProps) {
  const { state } = useEditor();
  const css = useMemo(() => open ? buildCSS(state.elements) : '', [state.elements, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[600] flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="w-[600px] max-h-[70vh] rounded-xl flex flex-col overflow-hidden"
            style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 h-10 shrink-0" style={{ borderBottom: '1px solid #2a2a2a' }}>
              <span className="text-[12px] font-semibold text-white">CSS Preview</span>
              <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded hover:bg-[#333]">
                <X className="h-3.5 w-3.5 text-[#888]" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-[11px] font-mono leading-5 text-[#ccc] whitespace-pre-wrap">{css || '/* No styles generated yet */'}</pre>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
