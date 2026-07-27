import { motion, AnimatePresence } from 'framer-motion';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUT_GROUPS = [
  {
    label: 'General',
    shortcuts: [
      ['⌘ S', 'Save project'],
      ['⌘ Z', 'Undo'],
      ['⌘ ⇧ Z', 'Redo'],
      ['⌘ /', 'Toggle shortcuts'],
      ['Escape', 'Deselect all'],
    ],
  },
  {
    label: 'Elements',
    shortcuts: [
      ['⌘ C', 'Copy element'],
      ['⌘ V', 'Paste element'],
      ['⌘ D', 'Duplicate element'],
      ['Delete', 'Remove element'],
      ['⌘ G', 'Wrap in container'],
    ],
  },
  {
    label: 'Styles',
    shortcuts: [
      ['⌘ ⌥ C', 'Copy styles'],
      ['⌘ ⌥ V', 'Paste styles'],
    ],
  },
  {
    label: 'Navigation',
    shortcuts: [
      ['⌥ ↑', 'Move element up'],
      ['⌥ ↓', 'Move element down'],
      ['⌘ +', 'Zoom in'],
      ['⌘ −', 'Zoom out'],
      ['⌘ 0', 'Reset zoom'],
      ['1', 'Desktop breakpoint'],
      ['2', 'Tablet breakpoint'],
      ['3', 'Mobile breakpoint'],
      ['T', 'Open templates'],
    ],
  },
];

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[500] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative z-10 w-full max-w-lg rounded-2xl p-6"
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #2a2a2a',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0073E6, #005bb5)' }}>
                  <Command className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#e0e0e0]">Keyboard Shortcuts</h2>
                  <p className="text-[10px] text-[#666]">Speed up your workflow</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4 text-[#666]" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {SHORTCUT_GROUPS.map(group => (
                <div key={group.label}>
                  <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#555] mb-2.5">{group.label}</div>
                  <div className="space-y-1">
                    {group.shortcuts.map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between py-1">
                        <span className="text-[11px] text-[#999]">{label}</span>
                        <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#2a2a2a] text-[#777] border border-[#333] min-w-[28px] text-center">
                          {key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-[#2a2a2a] flex items-center justify-center">
              <span className="text-[10px] text-[#555]">Press <kbd className="text-[10px] font-mono px-1 py-0.5 rounded bg-[#2a2a2a] text-[#777] border border-[#333]">⌘ /</kbd> to toggle this panel</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
