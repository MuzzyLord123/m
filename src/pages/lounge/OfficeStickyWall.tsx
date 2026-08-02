import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, StickyNote, Plus, Trash2, Palette, GripVertical, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { OfficeModuleBand } from '@/pages/lounge/office/ModuleShell';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSaveToFiles } from '@/components/files/useSaveToFiles';
import { SaveToFilesDialog } from '@/components/files/SaveToFilesDialog';

interface Note { id: string; content: string; color: string; x: number; y: number; width: number; height: number; zIndex: number; }

const NOTE_COLORS = [
  { name: 'Yellow', bg: '#fef3c7', border: '#fbbf24', text: '#92400e' },
  { name: 'Pink', bg: '#fce7f3', border: '#f472b6', text: '#9d174d' },
  { name: 'Green', bg: '#d1fae5', border: '#34d399', text: '#065f46' },
  { name: 'Blue', bg: '#dbeafe', border: '#60a5fa', text: '#1e40af' },
  { name: 'Purple', bg: '#ede9fe', border: '#a78bfa', text: '#5b21b6' },
  { name: 'Orange', bg: '#ffedd5', border: '#fb923c', text: '#9a3412' },
];

export default function OfficeStickyWall() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const wallId = searchParams.get('id');
  const { user } = useAuth();
  const { openSaveDialog, saveDialogProps } = useSaveToFiles();

  const [dbWallId, setDbWallId] = useState<string | null>(wallId);
  const [wallName, setWallName] = useState('Untitled Wall');
  const [editingName, setEditingName] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [maxZ, setMaxZ] = useState(5);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [editId, setEditId] = useState<string | null>(null);
  const [colorPickerId, setColorPickerId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load wall from DB
  useEffect(() => {
    if (!user?.id) return;
    if (!wallId) {
      // New wall — start with defaults
      setNotes([]);
      setWallName('Untitled Wall');
      setLoaded(true);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('sticky_walls')
        .select('*')
        .eq('id', wallId)
        .eq('user_id', user.id)
        .single();
      if (error || !data) {
        toast.error('Wall not found');
        navigate('/lounge/office/sticky-wall-home', { state: { fromOfficeApp: true } });
        return;
      }
      setWallName(data.name);
      setNotes((data.notes as any as Note[]) || []);
      const maxExisting = (data.notes as any as Note[])?.reduce((m: number, n: Note) => Math.max(m, n.zIndex || 0), 0) || 0;
      setMaxZ(maxExisting + 1);
      setLoaded(true);
    })();
  }, [wallId, user?.id]);

  // Auto-save debounce
  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveWall(false), 2000);
  }, [dbWallId, wallName, notes, user?.id]);

  useEffect(() => {
    if (!loaded) return;
    triggerAutoSave();
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [notes, wallName, loaded]);

  const saveWall = async (showToast = true) => {
    if (!user?.id) return;
    setSaving(true);
    try {
      if (dbWallId) {
        await supabase
          .from('sticky_walls')
          .update({ name: wallName, notes: notes as any })
          .eq('id', dbWallId);
      } else {
        const { data, error } = await supabase
          .from('sticky_walls')
          .insert({ user_id: user.id, name: wallName, notes: notes as any })
          .select('id')
          .single();
        if (!error && data) {
          setDbWallId(data.id);
          // Update URL without full navigation
          window.history.replaceState(null, '', `/lounge/office/sticky-wall?id=${data.id}`);
        }
      }
      if (showToast) toast.success('Wall saved');
    } catch {
      if (showToast) toast.error('Failed to save');
    }
    setSaving(false);
  };

  const handleSaveToFiles = async () => {
    // Ensure saved to DB first
    await saveWall(false);
    openSaveDialog({
      fileName: wallName,
      fileType: 'sticky_wall',
      appSource: 'sticky-wall',
      sourceId: dbWallId || undefined,
      sourceRoute: dbWallId ? `/lounge/office/sticky-wall?id=${dbWallId}` : undefined,
      description: `Sticky wall with ${notes.length} notes`,
      metadata: { noteCount: notes.length },
    });
  };

  const addNote = () => {
    const newZ = maxZ + 1;
    setMaxZ(newZ);
    const isMobile = window.innerWidth < 640;
    const noteW = isMobile ? 160 : 220;
    const noteH = isMobile ? 140 : 180;
    const note: Note = {
      id: Date.now().toString(),
      content: 'New note…',
      color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)].bg,
      x: 20 + Math.random() * (window.innerWidth - noteW - 40),
      y: 20 + Math.random() * Math.min(300, window.innerHeight * 0.4),
      width: noteW, height: noteH, zIndex: newZ,
    };
    setNotes(prev => [...prev, note]);
  };

  const deleteNote = (id: string) => { setNotes(prev => prev.filter(n => n.id !== id)); toast.success('Note deleted'); };

  const bringToFront = (id: string) => {
    const newZ = maxZ + 1;
    setMaxZ(newZ);
    setNotes(prev => prev.map(n => n.id === id ? { ...n, zIndex: newZ } : n));
  };

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      const t = e.touches[0] || e.changedTouches[0];
      return { x: t.clientX, y: t.clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent, id: string) => {
    if (editId === id) return;
    const note = notes.find(n => n.id === id);
    if (!note) return;
    bringToFront(id);
    const pos = getPointerPos(e);
    setDragId(id);
    setDragOffset({ x: pos.x - note.x, y: pos.y - note.y });
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragId) return;
    if ('touches' in e) e.preventDefault();
    const pos = getPointerPos(e);
    setNotes(prev => prev.map(n => n.id === dragId ? { ...n, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y } : n));
  };

  const handlePointerUp = () => setDragId(null);

  const updateContent = (id: string, content: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
  };

  const changeColor = (id: string, color: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, color } : n));
    setColorPickerId(null);
  };

  const getNoteStyle = (color: string) => {
    const nc = NOTE_COLORS.find(c => c.bg === color);
    return nc || { bg: color, border: '#d4d4d4', text: '#171717' };
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col touch-none" onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}>
      <OfficeModuleBand appId="sticky" icon={StickyNote} title="Sticky wall">
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground hidden sm:inline">{notes.length} notes</span>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs" onClick={() => saveWall(true)} disabled={saving}>
          <Save className="h-3.5 w-3.5" /> <span className="hidden sm:inline">{saving ? 'Saving' : 'Save'}</span>
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-lg text-xs hidden sm:flex" onClick={handleSaveToFiles}>
          Save to Files
        </Button>
        <Button size="sm" className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={addNote}>
          <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add note</span>
        </Button>
      </OfficeModuleBand>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-sunken" style={{ backgroundImage: 'radial-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
        {notes.map(note => {
          const style = getNoteStyle(note.color);
          return (
            <div
              key={note.id}
              className="absolute group select-none"
              style={{ left: note.x, top: note.y, width: note.width, zIndex: note.zIndex, cursor: editId === note.id ? 'text' : 'grab' }}
              onMouseDown={e => handlePointerDown(e, note.id)}
              onTouchStart={e => handlePointerDown(e, note.id)}
            >
              <div className="rounded-[10px] shadow-sm overflow-hidden" style={{ background: style.bg, borderLeft: `3px solid ${style.border}` }}>
                {/* Header */}
                <div className="flex items-center justify-between px-3 pt-2 pb-1">
                  <GripVertical className="h-3.5 w-3.5 opacity-30 cursor-grab" style={{ color: style.text }} />
                  <div className="flex gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); setColorPickerId(colorPickerId === note.id ? null : note.id); }} className="h-8 w-8 rounded-md hover:bg-black/5 flex items-center justify-center">
                      <Palette className="h-3 w-3" style={{ color: style.text }} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteNote(note.id); }} className="h-8 w-8 rounded-md hover:bg-black/5 flex items-center justify-center">
                      <Trash2 className="h-3 w-3" style={{ color: style.text }} />
                    </button>
                  </div>
                </div>

                {/* Color picker */}
                {colorPickerId === note.id && (
                  <div className="flex gap-1 px-3 pb-2" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
                    {NOTE_COLORS.map(c => (
                      <button key={c.bg} onClick={() => changeColor(note.id, c.bg)}
                        className={cn("h-7 w-7 rounded-full transition-shadow duration-150", note.color === c.bg ? "ring-2 ring-foreground/60 ring-offset-1" : "")}
                        style={{ background: c.bg }} />
                    ))}
                  </div>
                )}

                {/* Content */}
                <div className="px-3 pb-3" style={{ minHeight: note.height - 50 }}
                  onClick={e => { e.stopPropagation(); bringToFront(note.id); setEditId(note.id); }}
                  onMouseDown={e => { if (editId === note.id) e.stopPropagation(); }}>
                  {editId === note.id ? (
                    <textarea
                      autoFocus
                      value={note.content}
                      onChange={e => updateContent(note.id, e.target.value)}
                      onBlur={() => setEditId(null)}
                      onMouseDown={e => e.stopPropagation()}
                      className="w-full bg-transparent resize-none outline-none text-[13px] font-medium leading-relaxed"
                      style={{ color: style.text, minHeight: note.height - 60 }}
                    />
                  ) : (
                    <p className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap" style={{ color: style.text }}>
                      {note.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <SaveToFilesDialog {...saveDialogProps} />
    </div>
  );
}
