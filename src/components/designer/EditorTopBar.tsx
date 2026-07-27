import { useState, useEffect } from 'react';
import { useEditor } from './EditorContext';
import { Monitor, Tablet, Smartphone, Eye, Download, Minus, Plus, Save, Command, Check, Loader2, AlertCircle, Search, Zap, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Breakpoint } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { SettingsMenu } from './SettingsMenu';
import { PlannerModeSwitcher, PlannerMode } from './planner/PlannerModeSwitcher';

interface EditorTopBarProps {
  siteName: string;
  siteId?: string;
  onExport: () => void;
  onPreview: () => void;
  onExportCode: () => void;
  onCSSPreview: () => void;
  onShortcuts?: () => void;
  onExit?: () => void;
  onSaveToFiles?: () => void;
  onSaveToDevice?: () => void;
  onPublish?: () => void;
  plannerMode?: PlannerMode;
  onPlannerModeChange?: (mode: PlannerMode) => void;
}

const BREAKPOINT_COLORS: Record<Breakpoint, string> = {
  desktop: '#0073E6',
  tablet: '#8b5cf6',
  mobile: '#22c55e',
};

export function EditorTopBar({ siteName, siteId, onExport, onPreview, onExportCode, onCSSPreview, onShortcuts, onExit, onSaveToFiles, onSaveToDevice, onPublish, plannerMode = 'editor', onPlannerModeChange }: EditorTopBarProps) {
  const { state, dispatch, saveToDatabase } = useEditor();
  const navigate = useNavigate();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [publishPulse, setPublishPulse] = useState(false);
  const [showZoomPresets, setShowZoomPresets] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);

  // Track when save completes
  useEffect(() => {
    if (state.saveStatus === 'saved') setLastSavedTime(new Date());
  }, [state.saveStatus]);

  const breakpoints: { key: Breakpoint; icon: React.ReactNode; label: string; width: string }[] = [
    { key: 'desktop', icon: <Monitor className="h-3.5 w-3.5" />, label: 'Desktop', width: '1280' },
    { key: 'tablet', icon: <Tablet className="h-3.5 w-3.5" />, label: 'Tablet', width: '768' },
    { key: 'mobile', icon: <Smartphone className="h-3.5 w-3.5" />, label: 'Mobile', width: '375' },
  ];

  // Pulse publish button when dirty
  useEffect(() => {
    if (state.isDirty) {
      setPublishPulse(true);
      const t = setTimeout(() => setPublishPulse(false), 2000);
      return () => clearTimeout(t);
    }
  }, [state.isDirty]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowShortcuts(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const activeColor = BREAKPOINT_COLORS[state.breakpoint];

  const elementCount = state.elements.length;
  const activeBreakpoint = breakpoints.find(b => b.key === state.breakpoint);

  return (
    <>
      <div
        className="h-12 flex items-center justify-between px-3 shrink-0 select-none gap-3"
        style={{ backgroundColor: '#141414', borderBottom: '1px solid #252525', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
      >
        {/* Left */}
        <div className="flex items-center gap-1.5 shrink-0">
          <SettingsMenu onExportCode={onExportCode} onCSSPreview={onCSSPreview} onExit={onExit} onSaveToFiles={onSaveToFiles} onSaveToDevice={onSaveToDevice} siteId={siteId} />
          <div className="w-[1px] h-4 bg-[#333]" />
          <div className="flex items-center gap-1.5">
            <motion.div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: state.isDirty ? '#f59e0b' : '#4ade80' }}
              animate={state.isDirty ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 1.5, repeat: state.isDirty ? Infinity : 0 }}
            />
            <span className="text-[11px] font-medium text-[#ccc] truncate max-w-[120px]">{siteName}</span>
          </div>
          <div className="w-[1px] h-4 bg-[#333]" />
          {/* Undo/Redo with count */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => dispatch({ type: 'UNDO' })}
              disabled={state.historyIndex <= 0}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors disabled:opacity-20"
              title="Undo (⌘Z)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
              </svg>
            </button>
            <button
              onClick={() => dispatch({ type: 'REDO' })}
              disabled={state.historyIndex >= state.history.length - 1}
              className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors disabled:opacity-20"
              title="Redo (⌘⇧Z)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13" />
              </svg>
            </button>
            {state.history.length > 1 && (
              <span className="text-[8px] font-mono tabular-nums px-1 rounded" style={{ color: '#444', backgroundColor: '#1a1a1a' }}>
                {state.historyIndex}/{state.history.length - 1}
              </span>
            )}
          </div>

          {/* Save status with animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={state.saveStatus}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-1 h-6 px-2 rounded-md"
              style={{
                backgroundColor: state.saveStatus === 'saving' ? 'rgba(59, 130, 246, 0.08)' : state.saveStatus === 'saved' ? 'rgba(74, 222, 128, 0.08)' : state.saveStatus === 'error' ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
              }}
            >
              {state.saveStatus === 'saving' ? (
                <Loader2 className="h-3 w-3 animate-spin" style={{ color: '#3b82f6' }} />
              ) : state.saveStatus === 'saved' ? (
                <Check className="h-3 w-3" style={{ color: '#4ade80' }} />
              ) : state.saveStatus === 'error' ? (
                <AlertCircle className="h-3 w-3" style={{ color: '#ef4444' }} />
              ) : (
                <Save className="h-3 w-3" style={{ color: '#555' }} />
              )}
              <span className={`text-[9px] font-medium ${state.saveStatus === 'error' ? 'text-red-400' : state.saveStatus === 'saved' ? 'text-green-400' : state.saveStatus === 'saving' ? 'text-blue-400' : 'text-[#666]'}`}>
                {state.saveStatus === 'saving' ? 'Saving…' : state.saveStatus === 'saved' ? 'Saved' : state.saveStatus === 'error' ? 'Error' : ''}
              </span>
              {lastSavedTime && state.saveStatus !== 'saving' && (
                <span className="text-[7px] font-mono ml-0.5" style={{ color: '#444' }}>
                  {lastSavedTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Element count badge */}
          <div className="h-5 px-1.5 rounded flex items-center gap-1" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: activeColor, opacity: 0.6 }} />
            <span className="text-[8px] font-mono tabular-nums" style={{ color: '#555' }}>{elementCount} el</span>
          </div>
        </div>

        {/* Center: Planner Mode Switcher + Breakpoints + Zoom */}
        <div className="flex items-center gap-1.5">
          {onPlannerModeChange && (
            <PlannerModeSwitcher mode={plannerMode} onModeChange={onPlannerModeChange} />
          )}
          <div className="w-px h-4 bg-[#333]" />

          {/* Breakpoints with colored active indicator */}
          <div className="flex items-center gap-0 rounded-lg p-0.5 relative" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
            {breakpoints.map(bp => {
              const isActive = state.breakpoint === bp.key;
              const color = BREAKPOINT_COLORS[bp.key];
              return (
                <button
                  key={bp.key}
                  onClick={() => dispatch({ type: 'SET_BREAKPOINT', payload: bp.key })}
                  className="relative h-7 px-3 flex items-center gap-1.5 rounded-md text-[10px] font-medium transition-all"
                  style={{
                    color: isActive ? '#fff' : '#666',
                    backgroundColor: isActive ? color : 'transparent',
                    boxShadow: isActive ? `0 2px 12px ${color}40, 0 0 0 1px ${color}30` : 'none',
                  }}
                  title={`${bp.label} (${bp.width}px)`}
                >
                  {bp.icon}
                  <span className="hidden sm:inline">{bp.label}</span>
                  {isActive && (
                    <span className="text-[8px] font-mono opacity-60">{bp.width}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Zoom with presets */}
          <div className="flex items-center gap-0 rounded-lg p-0.5" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
            <button
              onClick={() => dispatch({ type: 'SET_ZOOM', payload: Math.max(0.25, state.zoom - 0.1) })}
              className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors"
            >
              <Minus className="h-3 w-3 text-[#888]" />
            </button>
            <div className="relative">
              <button
                onClick={() => setShowZoomPresets(v => !v)}
                className="text-[10px] hover:text-white w-12 text-center tabular-nums transition-colors font-mono"
                style={{ color: Math.round(state.zoom * 100) !== 100 ? '#0073E6' : '#888' }}
                title="Zoom presets"
              >
                {Math.round(state.zoom * 100)}%
              </button>
              <AnimatePresence>
                {showZoomPresets && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.12 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-[400] rounded-xl overflow-hidden"
                    style={{ backgroundColor: 'rgba(18,18,18,0.98)', border: '1px solid #333', boxShadow: '0 12px 40px rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', minWidth: '90px' }}
                  >
                    <div className="px-3 py-1.5" style={{ borderBottom: '1px solid #222' }}>
                      <span className="text-[7px] font-bold uppercase tracking-[0.1em]" style={{ color: '#444' }}>Zoom</span>
                    </div>
                    {[25, 50, 75, 100, 125, 150, 200, 300].map(z => (
                      <button
                        key={z}
                        onClick={() => { dispatch({ type: 'SET_ZOOM', payload: z / 100 }); setShowZoomPresets(false); }}
                        className="w-full flex items-center justify-between h-7 px-3 text-[11px] font-mono transition-colors"
                        style={{
                          color: Math.round(state.zoom * 100) === z ? '#0073E6' : '#888',
                          backgroundColor: Math.round(state.zoom * 100) === z ? 'rgba(0,115,230,0.08)' : 'transparent',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = Math.round(state.zoom * 100) === z ? 'rgba(0,115,230,0.08)' : 'transparent'; }}
                      >
                        <span>{z}%</span>
                        {Math.round(state.zoom * 100) === z && <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#0073E6' }} />}
                      </button>
                    ))}
                    <div className="px-3 py-1.5" style={{ borderTop: '1px solid #222' }}>
                      <button
                        onClick={() => { dispatch({ type: 'SET_ZOOM', payload: 1 }); setShowZoomPresets(false); }}
                        className="text-[9px] font-medium w-full text-left"
                        style={{ color: '#555' }}
                      >
                        Reset to 100%
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_ZOOM', payload: Math.min(3, state.zoom + 0.1) })}
              className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors"
            >
              <Plus className="h-3 w-3 text-[#888]" />
            </button>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }); window.dispatchEvent(e); }}
            className="h-7 px-2.5 flex items-center gap-1.5 rounded-md hover:bg-[#333] transition-colors"
            title="Command palette (⌘K)"
          >
            <Search className="h-3 w-3 text-[#666]" />
            <span className="text-[9px] text-[#555] font-mono">⌘K</span>
          </button>
          <button
            onClick={() => { onShortcuts?.(); setShowShortcuts(false); }}
            className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors"
            title="Keyboard shortcuts (⌘/)"
          >
            <Command className="h-3.5 w-3.5 text-[#666]" />
          </button>
          <button
            onClick={onPreview}
            className="h-7 px-3.5 flex items-center gap-1.5 rounded-lg text-[11px] font-medium text-[#bbb] hover:bg-[#2a2a2a] hover:text-white transition-all duration-200 group"
          >
            <Eye className="h-3.5 w-3.5 transition-transform group-hover:scale-110" /> Preview
          </button>
          <button
            onClick={onExportCode}
            className="h-7 px-3.5 flex items-center gap-1.5 rounded-lg text-[11px] font-medium text-[#bbb] hover:bg-[#2a2a2a] hover:text-white transition-all duration-200 group"
          >
            <Download className="h-3.5 w-3.5 transition-transform group-hover:scale-110" /> Export
          </button>

          {/* Premium publish button */}
          <motion.button
            onClick={() => onPublish?.()}
            className="h-8 px-5 flex items-center gap-2 rounded-lg text-[11px] font-semibold text-white transition-all duration-200 hover:brightness-110 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #0073E6 0%, #005bb5 50%, #0073E6 100%)',
              backgroundSize: '200% 200%',
              boxShadow: publishPulse
                ? '0 2px 20px rgba(0,115,230,0.5), 0 0 40px rgba(0,115,230,0.15)'
                : '0 2px 12px rgba(0,115,230,0.35)',
            }}
            animate={publishPulse ? { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : {}}
            transition={{ duration: 2, ease: 'easeInOut' }}
          >
            <Rocket className="h-3.5 w-3.5" />
            Publish
          </motion.button>
        </div>
      </div>

      {/* Keyboard shortcuts overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 right-4 z-[300] rounded-xl overflow-hidden"
            style={{
              backgroundColor: 'rgba(22,22,22,0.98)',
              border: '1px solid #333',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(20px)',
              minWidth: '260px',
            }}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: '#888' }}>Keyboard Shortcuts</span>
              <kbd className="text-[8px] px-1.5 py-0.5 rounded font-mono" style={{ backgroundColor: '#252525', color: '#555', border: '1px solid #333' }}>⌘/</kbd>
            </div>
            <div className="p-3 space-y-0.5">
              {[
                { section: 'General', items: [['⌘ Z', 'Undo'], ['⌘ ⇧ Z', 'Redo'], ['⌘ S', 'Save'], ['⌘ K', 'Commands']] },
                { section: 'Edit', items: [['⌘ C', 'Copy'], ['⌘ V', 'Paste'], ['⌘ D', 'Duplicate'], ['⌘ G', 'Group/Wrap']] },
                { section: 'Style', items: [['⌘ ⌥ C', 'Copy Styles'], ['⌘ ⌥ V', 'Paste Styles']] },
                { section: 'Navigate', items: [['Delete', 'Remove'], ['Escape', 'Deselect/Parent'], ['Tab', 'Next Sibling'], ['Enter', 'First Child']] },
                { section: 'Layout', items: [['⌥ ↑/↓', 'Reorder'], ['↑↓←→', 'Nudge 1px'], ['⇧ ↑↓←→', 'Nudge 10px']] },
                { section: 'View', items: [['1/2/3', 'Breakpoints'], ['⌘ +/-', 'Zoom'], ['⌘ 0', 'Reset Zoom'], ['⌘ A', 'Select All'], ['Space+Drag', 'Pan Canvas']] },
              ].map(group => (
                <div key={group.section}>
                  <div className="text-[8px] font-bold uppercase tracking-widest py-1 mt-1" style={{ color: '#444' }}>{group.section}</div>
                  {group.items.map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between py-[3px]">
                      <span className="text-[11px]" style={{ color: '#999' }}>{label}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: '#222', color: '#666', border: '1px solid #2a2a2a' }}>{key}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
