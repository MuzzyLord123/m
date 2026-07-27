import { useState, useRef, useEffect } from 'react';
import { useEditor } from './EditorContext';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Settings, Undo2, Redo2, Code2, Keyboard, 
  FileCode, Eye, ChevronRight, X, FolderInput, Download
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface SettingsMenuProps {
  onExportCode: () => void;
  onCSSPreview: () => void;
  onExit?: () => void;
  onSaveToFiles?: () => void;
  onSaveToDevice?: () => void;
  siteId?: string;
}

export function SettingsMenu({ onExportCode, onCSSPreview, onExit, onSaveToFiles, onSaveToDevice, siteId }: SettingsMenuProps) {
  const { state, dispatch } = useEditor();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const items = [
    { section: 'Navigation' },
    { icon: LayoutDashboard, label: 'Dashboard', shortcut: '', action: () => { setOpen(false); if (onExit) onExit(); else navigate('/lounge/website-designer'); } },
    { icon: Settings, label: 'Site Settings', shortcut: '', action: () => { setOpen(false); if (siteId) navigate(`/lounge/site-settings/${siteId}`); } },
    { divider: true },
    { section: 'Edit' },
    { icon: Undo2, label: 'Undo', shortcut: '⌘Z', action: () => { dispatch({ type: 'UNDO' }); setOpen(false); }, disabled: state.historyIndex <= 0 },
    { icon: Redo2, label: 'Redo', shortcut: '⌘⇧Z', action: () => { dispatch({ type: 'REDO' }); setOpen(false); }, disabled: state.historyIndex >= state.history.length - 1 },
    { divider: true },
    { section: 'Save' },
    { icon: FolderInput, label: 'Save to Files', shortcut: '⌘⇧S', action: () => { onSaveToFiles?.(); setOpen(false); } },
    { icon: Download, label: 'Save to Device', shortcut: '', action: () => { onSaveToDevice?.(); setOpen(false); } },
    { divider: true },
    { section: 'Tools' },
    { icon: Code2, label: 'Export code', shortcut: '⇧E', action: () => { onExportCode(); setOpen(false); } },
    { icon: Keyboard, label: 'Keyboard shortcuts', shortcut: '⌘/', action: () => setOpen(false) },
    { icon: FileCode, label: 'CSS preview', shortcut: '', action: () => { onCSSPreview(); setOpen(false); } },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors"
        title="Settings"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect y="1" width="14" height="1.5" rx="0.75" fill="#999" />
          <rect y="6" width="14" height="1.5" rx="0.75" fill="#999" />
          <rect y="11" width="14" height="1.5" rx="0.75" fill="#999" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1 z-[500] rounded-lg py-1 min-w-[220px]"
            style={{
              backgroundColor: '#2d2d2d',
              border: '1px solid #3a3a3a',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {items.map((item, i) => {
              if ('divider' in item && item.divider) {
                return <div key={i} className="h-[1px] my-1 mx-2" style={{ backgroundColor: '#3a3a3a' }} />;
              }
              if ('section' in item && item.section) {
                return (
                  <div key={i} className="px-3 pt-2 pb-1">
                    <span className="text-[8px] font-bold uppercase tracking-[0.1em]" style={{ color: '#555' }}>{item.section}</span>
                  </div>
                );
              }
              const Icon = (item as any).icon;
              return (
                <button
                  key={i}
                  onClick={(item as any).action}
                  disabled={(item as any).disabled}
                  className="w-full flex items-center gap-2.5 h-8 px-3 text-[12px] text-[#ccc] hover:bg-[#3a3a3a] transition-colors disabled:opacity-30 group"
                >
                  <Icon className="h-3.5 w-3.5 text-[#888] group-hover:text-[#bbb] transition-colors" />
                  <span className="flex-1 text-left">{(item as any).label}</span>
                  {(item as any).shortcut && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: '#252525', color: '#666', border: '1px solid #333' }}>{(item as any).shortcut}</span>
                  )}
                </button>
              );
            })}
            {/* Version footer */}
            <div className="mt-1 px-3 py-2" style={{ borderTop: '1px solid #3a3a3a' }}>
              <span className="text-[8px] font-mono" style={{ color: '#444' }}>Workshop v3.2 • Quooro</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
