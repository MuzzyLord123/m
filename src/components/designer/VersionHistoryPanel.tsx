import { useState, useEffect, useCallback, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditor } from './EditorContext';
import { EditorElement } from './types';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  History, RotateCcw, Clock, Star, StarOff, Trash2, Plus,
  GitBranch, ChevronRight, Layers, Shield, AlertTriangle,
  ArrowDownToLine, ArrowUpFromLine, Diff,
} from 'lucide-react';

interface Snapshot {
  id: string;
  name: string;
  elements: EditorElement[];
  timestamp: string;
  elementCount: number;
  isStarred: boolean;
  tags?: string[];
}

const TAG_COLORS: Record<string, string> = {
  milestone: '#f59e0b',
  backup: '#3b82f6',
  experiment: '#8b5cf6',
  release: '#22c55e',
  wip: '#f97316',
};

const AUTO_SAVE_INTERVAL = 120; // seconds

export function VersionHistoryPanel() {
  const { state, dispatch } = useEditor();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [filterStarred, setFilterStarred] = useState(false);
  const [autoSaveCountdown, setAutoSaveCountdown] = useState(AUTO_SAVE_INTERVAL);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('designer-snapshots');
    if (stored) {
      try { setSnapshots(JSON.parse(stored)); } catch { }
    }
  }, []);

  const persist = useCallback((snaps: Snapshot[]) => {
    const trimmed = snaps.slice(0, 30);
    setSnapshots(trimmed);
    localStorage.setItem('designer-snapshots', JSON.stringify(trimmed));
  }, []);

  // Auto-save countdown timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setAutoSaveCountdown(prev => {
        if (prev <= 1) return AUTO_SAVE_INTERVAL;
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  // Auto-save trigger when countdown resets
  useEffect(() => {
    if (autoSaveCountdown === AUTO_SAVE_INTERVAL && state.elements.length > 0 && state.isDirty) {
      const name = `Auto-save ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
      const countEls = (els: EditorElement[]): number => els.reduce((a, el) => a + 1 + countEls(el.children), 0);
      const snap: Snapshot = {
        id: crypto.randomUUID(), name,
        elements: JSON.parse(JSON.stringify(state.elements)),
        timestamp: new Date().toISOString(),
        elementCount: countEls(state.elements),
        isStarred: false, tags: ['backup'],
      };
      persist([snap, ...snapshots]);
      setLastSavedAt(new Date().toISOString());
    }
  }, [autoSaveCountdown]);

  const countElements = (els: EditorElement[]): number => {
    return els.reduce((acc, el) => acc + 1 + countElements(el.children), 0);
  };

  const saveSnapshot = () => {
    if (state.elements.length === 0) { toast.error('Nothing to save'); return; }
    const name = newName.trim() || `Snapshot ${snapshots.length + 1}`;
    const snap: Snapshot = {
      id: crypto.randomUUID(), name,
      elements: JSON.parse(JSON.stringify(state.elements)),
      timestamp: new Date().toISOString(),
      elementCount: countElements(state.elements),
      isStarred: false, tags: [],
    };
    persist([snap, ...snapshots]);
    setNaming(false); setNewName('');
    toast.success(`Saved "${name}"`);
  };

  const restoreSnapshot = (snap: Snapshot) => {
    dispatch({ type: 'SET_ELEMENTS', payload: JSON.parse(JSON.stringify(snap.elements)) });
    setShowConfirm(null);
    toast.success(`Restored "${snap.name}"`);
  };

  const deleteSnapshot = (id: string) => persist(snapshots.filter(s => s.id !== id));
  const toggleStar = (id: string) => persist(snapshots.map(s => s.id === id ? { ...s, isStarred: !s.isStarred } : s));
  const addTag = (id: string, tag: string) => persist(snapshots.map(s => s.id === id ? { ...s, tags: [...new Set([...(s.tags || []), tag])] } : s));
  const removeTag = (id: string, tag: string) => persist(snapshots.map(s => s.id === id ? { ...s, tags: (s.tags || []).filter(t => t !== tag) } : s));

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const sorted = [...snapshots]
    .filter(s => !filterStarred || s.isStarred)
    .filter(s => !selectedTag || s.tags?.includes(selectedTag))
    .sort((a, b) => {
      if (a.isStarred && !b.isStarred) return -1;
      if (!a.isStarred && b.isStarred) return 1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

  const currentCount = countElements(state.elements);
  const compareSnap = compareId ? snapshots.find(s => s.id === compareId) : null;
  const compareCount = compareSnap ? compareSnap.elementCount : null;

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,115,230,0.1), rgba(99,102,241,0.08))', border: '1px solid rgba(0,115,230,0.15)' }}>
              <History className="h-3 w-3" style={{ color: '#0073E6' }} />
            </div>
            <span className="text-[11px] font-semibold" style={{ color: '#ccc' }}>Version History</span>
          </div>
          <span className="text-[9px] tabular-nums px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(0,115,230,0.08)', color: '#0073E6', border: '1px solid rgba(0,115,230,0.12)' }}>
            {snapshots.length}/30
          </span>
        </div>

        {/* Save button */}
        <AnimatePresence mode="wait">
          {naming ? (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex gap-1.5">
                <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveSnapshot()}
                  placeholder="Version name…" autoFocus
                  className="flex-1 h-7 px-3 rounded-lg text-[10px] outline-none"
                  style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ddd' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#0073E6'; }} onBlur={e => { e.currentTarget.style.borderColor = '#2a2a2a'; }}
                />
                <button onClick={saveSnapshot} className="h-7 px-3 rounded-lg text-[10px] font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, #0073E6, #005bb5)' }}>Save</button>
                <button onClick={() => setNaming(false)} className="h-7 px-2 rounded-lg text-[10px]" style={{ color: '#666' }}>✕</button>
              </div>
            </motion.div>
          ) : (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setNaming(true)}
              className="w-full h-8 flex items-center justify-center gap-2 rounded-xl text-[10px] font-semibold transition-all hover:brightness-110"
              style={{ background: 'linear-gradient(135deg, #0073E6, #005bb5)', color: '#fff', boxShadow: '0 2px 12px rgba(0,115,230,0.2)' }}>
              <Plus className="w-3 h-3" /> Save Snapshot
            </motion.button>
          )}
        </AnimatePresence>

        {/* Current State Card */}
        <div className="rounded-lg p-2.5" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Shield className="h-3 w-3" style={{ color: state.isDirty ? '#f59e0b' : '#22c55e' }} />
              <span className="text-[10px] font-medium" style={{ color: '#aaa' }}>Current State</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] tabular-nums px-1.5 py-0.5 rounded-md" style={{ backgroundColor: 'rgba(139,92,246,0.08)', color: '#8b5cf6' }}>
                <Layers className="h-2 w-2 inline mr-0.5" />{currentCount} els
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${state.isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-[9px]" style={{ color: '#666' }}>
              {state.isDirty ? 'Unsaved changes' : 'All changes saved'}
            </span>
          </div>
          {/* Auto-save countdown */}
          <div className="flex items-center justify-between mt-2 pt-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-1.5">
              <Clock className="h-2.5 w-2.5" style={{ color: autoSaveCountdown <= 10 ? '#f59e0b' : '#444' }} />
              <span className="text-[8px] tabular-nums font-mono" style={{ color: autoSaveCountdown <= 10 ? '#f59e0b' : '#555' }}>
                Auto-save in {Math.floor(autoSaveCountdown / 60)}:{String(autoSaveCountdown % 60).padStart(2, '0')}
              </span>
            </div>
            {lastSavedAt && (
              <span className="text-[7px]" style={{ color: '#333' }}>
                Last: {formatTime(lastSavedAt)}
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-1.5 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: '#222' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: autoSaveCountdown <= 10 ? '#f59e0b' : '#0073E6' }}
              animate={{ width: `${((AUTO_SAVE_INTERVAL - autoSaveCountdown) / AUTO_SAVE_INTERVAL) * 100}%` }}
              transition={{ duration: 0.5, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Undo/Redo Stats */}
        <div className="flex gap-1.5">
          <div className="flex-1 rounded-lg p-2 text-center" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <div className="text-[14px] font-bold tabular-nums" style={{ color: '#0073E6' }}>{state.historyIndex}</div>
            <div className="text-[7px] uppercase tracking-wider font-bold" style={{ color: '#444' }}>Undos</div>
          </div>
          <div className="flex-1 rounded-lg p-2 text-center" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <div className="text-[14px] font-bold tabular-nums" style={{ color: '#8b5cf6' }}>{state.history.length - 1 - state.historyIndex}</div>
            <div className="text-[7px] uppercase tracking-wider font-bold" style={{ color: '#444' }}>Redos</div>
          </div>
          <div className="flex-1 rounded-lg p-2 text-center" style={{ backgroundColor: '#1a1a1a', border: '1px solid #222' }}>
            <div className="text-[14px] font-bold tabular-nums" style={{ color: '#22c55e' }}>{snapshots.filter(s => s.isStarred).length}</div>
            <div className="text-[7px] uppercase tracking-wider font-bold" style={{ color: '#444' }}>Starred</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 flex-wrap">
          <button onClick={() => setFilterStarred(!filterStarred)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[8px] font-semibold transition-all"
            style={{ backgroundColor: filterStarred ? 'rgba(245,158,11,0.12)' : 'transparent', color: filterStarred ? '#f59e0b' : '#555', border: `1px solid ${filterStarred ? 'rgba(245,158,11,0.2)' : 'transparent'}` }}>
            <Star className="h-2 w-2" /> Starred
          </button>
          {Object.keys(TAG_COLORS).map(tag => (
            <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className="px-2 py-0.5 rounded-md text-[7px] font-bold uppercase tracking-wider transition-all"
              style={{
                backgroundColor: selectedTag === tag ? `${TAG_COLORS[tag]}15` : 'transparent',
                color: selectedTag === tag ? TAG_COLORS[tag] : '#444',
                border: `1px solid ${selectedTag === tag ? `${TAG_COLORS[tag]}30` : 'transparent'}`,
              }}>
              {tag}
            </button>
          ))}
        </div>

        {/* Compare bar */}
        {compareSnap && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="rounded-lg p-2.5" style={{ backgroundColor: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Diff className="h-3 w-3" style={{ color: '#8b5cf6' }} />
                <span className="text-[9px] font-semibold" style={{ color: '#8b5cf6' }}>Comparing with "{compareSnap.name}"</span>
              </div>
              <button onClick={() => setCompareId(null)} className="text-[8px] px-1.5 py-0.5 rounded" style={{ color: '#8b5cf6' }}>✕</button>
            </div>
            {/* Diff summary bars */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono w-14" style={{ color: '#888' }}>Current</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#222' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (currentCount / Math.max(currentCount, compareCount || 1)) * 100)}%`, backgroundColor: '#0073E6' }} />
                </div>
                <span className="text-[8px] tabular-nums font-mono w-8 text-right" style={{ color: '#0073E6' }}>{currentCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono w-14" style={{ color: '#888' }}>Snapshot</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#222' }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, ((compareCount || 0) / Math.max(currentCount, compareCount || 1)) * 100)}%`, backgroundColor: '#8b5cf6' }} />
                </div>
                <span className="text-[8px] tabular-nums font-mono w-8 text-right" style={{ color: '#8b5cf6' }}>{compareCount}</span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-1.5" style={{ borderTop: '1px solid rgba(139,92,246,0.1)' }}>
              <span className="text-[8px]" style={{ color: '#888' }}>Difference</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold tabular-nums px-1.5 py-0.5 rounded" style={{
                  color: (currentCount - (compareCount || 0)) >= 0 ? '#22c55e' : '#ef4444',
                  backgroundColor: (currentCount - (compareCount || 0)) >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                }}>
                  {(currentCount - (compareCount || 0)) >= 0 ? '+' : ''}{currentCount - (compareCount || 0)} elements
                </span>
                <span className="text-[7px] font-mono" style={{ color: '#555' }}>
                  {compareCount && compareCount > 0 ? `${Math.round(((currentCount - compareCount) / compareCount) * 100)}%` : '—'}
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Snapshot list */}
        {sorted.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,115,230,0.06), rgba(0,115,230,0.02))', border: '1px solid rgba(0,115,230,0.08)' }}>
              <Clock className="w-6 h-6" style={{ color: 'rgba(0,115,230,0.3)' }} />
            </div>
            <p className="text-[11px] font-medium" style={{ color: '#555' }}>No snapshots yet</p>
            <p className="text-[9px] mt-1" style={{ color: '#444' }}>Save versions to track your progress</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sorted.map((snap, idx) => {
              const isActive = showConfirm === snap.id;
              const elDiff = snap.elementCount - currentCount;
              return (
                <motion.div key={snap.id} layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg p-2.5 group transition-all"
                  style={{ backgroundColor: isActive ? 'rgba(0,115,230,0.04)' : '#1a1a1a', border: `1px solid ${isActive ? 'rgba(0,115,230,0.15)' : '#222'}` }}>

                  {/* Header row */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {snap.isStarred && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
                      {idx === 0 && !filterStarred && !selectedTag && (
                        <span className="text-[7px] font-bold px-1 py-0.5 rounded-md shrink-0" style={{ backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.15)' }}>LATEST</span>
                      )}
                      <span className="text-[10px] font-medium truncate" style={{ color: '#ddd' }}>{snap.name}</span>
                    </div>
                    <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => setCompareId(compareId === snap.id ? null : snap.id)}
                        className="h-5 w-5 flex items-center justify-center rounded hover:bg-white/5" title="Compare">
                        <Diff className="w-2.5 h-2.5" style={{ color: compareId === snap.id ? '#8b5cf6' : '#555' }} />
                      </button>
                      <button onClick={() => toggleStar(snap.id)} className="h-5 w-5 flex items-center justify-center rounded hover:bg-white/5">
                        {snap.isStarred ? <StarOff className="w-2.5 h-2.5 text-amber-400" /> : <Star className="w-2.5 h-2.5" style={{ color: '#555' }} />}
                      </button>
                      <button onClick={() => deleteSnapshot(snap.id)} className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-500/10">
                        <Trash2 className="w-2.5 h-2.5" style={{ color: '#555' }} />
                      </button>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1 flex-wrap mb-1">
                    {snap.tags?.map(tag => (
                      <span key={tag} className="text-[7px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-md cursor-pointer"
                        style={{ backgroundColor: `${TAG_COLORS[tag] || '#555'}12`, color: TAG_COLORS[tag] || '#555', border: `1px solid ${TAG_COLORS[tag] || '#555'}20` }}
                        onClick={() => removeTag(snap.id, tag)}>
                        {tag} ✕
                      </span>
                    ))}
                    <div className="relative group/tag">
                      <button className="text-[7px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity" style={{ color: '#555' }}>+ tag</button>
                      <div className="absolute left-0 top-full mt-0.5 hidden group-hover/tag:flex gap-0.5 z-10 p-0.5 rounded-md" style={{ backgroundColor: '#1e1e1e', border: '1px solid #2a2a2a' }}>
                        {Object.keys(TAG_COLORS).filter(t => !snap.tags?.includes(t)).map(tag => (
                          <button key={tag} onClick={() => addTag(snap.id, tag)}
                            className="text-[7px] font-bold uppercase px-1.5 py-0.5 rounded-md whitespace-nowrap"
                            style={{ backgroundColor: `${TAG_COLORS[tag]}12`, color: TAG_COLORS[tag] }}>
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] flex items-center gap-0.5" style={{ color: '#555' }}>
                        <Clock className="h-2 w-2" /> {formatTime(snap.timestamp)}
                      </span>
                      <span className="text-[8px] tabular-nums px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(139,92,246,0.06)', color: '#8b5cf6' }}>
                        {snap.elementCount} els
                      </span>
                      {elDiff !== 0 && (
                        <span className="text-[7px] font-bold tabular-nums" style={{ color: elDiff > 0 ? '#22c55e' : '#ef4444' }}>
                          {elDiff > 0 ? `+${elDiff}` : elDiff}
                        </span>
                      )}
                    </div>
                    {showConfirm === snap.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => restoreSnapshot(snap)} className="h-5 px-2 rounded text-[8px] font-semibold text-white"
                          style={{ backgroundColor: '#0073E6' }}>
                          <RotateCcw className="h-2 w-2 inline mr-0.5" /> Confirm
                        </button>
                        <button onClick={() => setShowConfirm(null)} className="h-5 px-2 rounded text-[8px]" style={{ color: '#888' }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowConfirm(snap.id)}
                        className="flex items-center gap-1 h-5 px-2 rounded text-[8px] font-medium opacity-0 group-hover:opacity-100 transition-all"
                        style={{ color: '#0073E6', backgroundColor: 'rgba(0,115,230,0.06)', border: '1px solid rgba(0,115,230,0.12)' }}>
                        <RotateCcw className="w-2 h-2" /> Restore
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
