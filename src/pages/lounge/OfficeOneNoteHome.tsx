import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BookOpen, Plus, ArrowLeft, Trash2, Search, Star, StarOff,
  ChevronRight, Notebook, StickyNote, PenLine, MoreHorizontal,
  Edit3, Palette, Copy, FolderPlus, Bold, Italic, Underline,
  List, ListOrdered, CheckSquare, Link2, Image, Code, Quote,
  Heading1, Heading2, Heading3, AlignLeft, AlignCenter, Hash,
  Clock, FileText, Sparkles, GripVertical, X, Eye, EyeOff,
  Download, Upload, Table2, Minus, Type, Columns, LayoutGrid, Save,
  Tag, FileUp, Link, Printer, Undo2, Redo2, Strikethrough,
  Maximize2, Lock as LockIcon, Unlock as UnlockIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Section {
  id: string;
  name: string;
  color: string;
  pages: Page[];
  collapsed?: boolean;
}

interface Page {
  id: string;
  title: string;
  content: string;
  updatedAt: Date;
  starred: boolean;
  tags?: string[];
  locked?: boolean;
}

const SECTION_COLORS = [
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#059669' },
  { name: 'Amber', value: '#d97706' },
  { name: 'Red', value: '#dc2626' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Slate', value: '#475569' },
];

const PAGE_TEMPLATES = [
  { name: 'Blank', content: '' },
  { name: 'Meeting Notes', content: '# Meeting Notes\n\n**Date:** \n**Attendees:** \n\n## Agenda\n1. \n2. \n3. \n\n## Discussion\n\n\n## Action Items\n- [ ] \n- [ ] \n\n## Key Decisions\n- \n\n---\n*Next meeting:*' },
  { name: 'Project Plan', content: '# Project: \n\n## Overview\n\n\n## Goals\n1. \n2. \n3. \n\n## Timeline\n| Phase | Start | End | Status |\n|-------|-------|-----|--------|\n| Planning | | | ⏳ |\n| Development | | | |\n| Testing | | | |\n| Launch | | | |\n\n## Resources\n- \n\n## Risks & Mitigations\n- **Risk:** \n  - Mitigation: ' },
  { name: 'Daily Journal', content: '# Journal — \n\n## 🌅 Morning\n**Mood:** \n**Top 3 priorities:**\n1. \n2. \n3. \n\n## 📝 Notes\n\n\n## 🌙 Evening Reflection\n**What went well:**\n- \n\n**What to improve:**\n- \n\n**Grateful for:**\n- ' },
  { name: 'Research Notes', content: '# Research: \n\n## Summary\n\n\n## Key Findings\n1. \n2. \n3. \n\n## Sources\n- [Source 1]()\n- [Source 2]()\n\n## Quotes\n> \n\n## Open Questions\n- [ ] \n- [ ] \n\n## Next Steps\n- ' },
  { name: 'Weekly Review', content: '# Weekly Review — Week of \n\n## ✅ Accomplished\n- \n- \n\n## 📊 Metrics\n| Metric | Target | Actual |\n|--------|--------|--------|\n| | | |\n\n## 🚧 In Progress\n- \n\n## 🔜 Next Week\n1. \n2. \n3. \n\n## 💡 Ideas & Insights\n- ' },
];

let nextId = 1;
const uid = () => `item-${nextId++}`;

const DEFAULT_SECTIONS: Section[] = [
  {
    id: uid(), name: 'My Notes', color: '#7c3aed',
    pages: [],
  },
];

export default function OfficeOneNoteHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [sections, setSections] = useState<Section[]>(DEFAULT_SECTIONS);
  const [activeSection, setActiveSection] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const [search, setSearch] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionNameValue, setSectionNameValue] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [splitView, setSplitView] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);
  const [mobileView, setMobileView] = useState<'sections' | 'pages' | 'editor'>('sections');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load notes from database on mount
  useEffect(() => {
    if (!user) return;
    const loadNotes = async () => {
      try {
        const { data } = await supabase
          .from('platform_files')
          .select('metadata')
          .eq('user_id', user.id)
          .eq('app_source', 'notes')
          .eq('source_id', 'notebook-root')
          .maybeSingle();
        
        if (data?.metadata && (data.metadata as any).sections) {
          const savedSections = (data.metadata as any).sections as Section[];
          // Restore Date objects
          const restored = savedSections.map(s => ({
            ...s,
            pages: s.pages.map(p => ({ ...p, updatedAt: new Date(p.updatedAt) }))
          }));
          setSections(restored);
        }
      } catch (err) {
        console.error('Failed to load notes:', err);
      } finally {
        setLoaded(true);
      }
    };
    loadNotes();
  }, [user]);

  // Auto-save notes to database when sections change (debounced)
  useEffect(() => {
    if (!user || !loaded) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const payload = {
          user_id: user.id,
          file_name: 'Notebook',
          file_type: 'document',
          app_source: 'notes',
          source_id: 'notebook-root',
          source_route: '/lounge/office/notes',
          description: `${sections.reduce((s, sec) => s + sec.pages.length, 0)} pages across ${sections.length} sections`,
          metadata: JSON.parse(JSON.stringify({ sections })),
        };

        const { data: existing } = await supabase
          .from('platform_files')
          .select('id')
          .eq('user_id', user.id)
          .eq('app_source', 'notes')
          .eq('source_id', 'notebook-root')
          .maybeSingle();

        if (existing) {
          await supabase.from('platform_files').update(payload).eq('id', existing.id);
        } else {
          await supabase.from('platform_files').insert(payload);
        }
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, 1500);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [sections, user, loaded]);

  const section = sections[activeSection];
  const page = section?.pages[activePage];

  const totalPages = sections.reduce((s, sec) => s + sec.pages.length, 0);
  const starredPages = sections.flatMap(s => s.pages).filter(p => p.starred).length;

  const pushUndo = useCallback(() => {
    if (page) setUndoStack(prev => [...prev.slice(-30), page.content]);
    setRedoStack([]);
  }, [page]);

  const undo = useCallback(() => {
    if (undoStack.length === 0 || !page) return;
    setRedoStack(prev => [...prev, page.content]);
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    updatePage({ content: last });
  }, [undoStack, page]);

  const redo = useCallback(() => {
    if (redoStack.length === 0 || !page) return;
    setUndoStack(prev => [...prev, page.content]);
    const last = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    updatePage({ content: last });
  }, [redoStack, page]);

  const addSection = useCallback(() => {
    const color = SECTION_COLORS[sections.length % SECTION_COLORS.length].value;
    setSections(prev => [...prev, { id: uid(), name: 'New Section', color, pages: [] }]);
    setActiveSection(sections.length);
    setActivePage(0);
    toast.success('Section created');
  }, [sections.length]);

  const deleteSection = useCallback((idx: number) => {
    if (sections.length <= 1) { toast.error("Can't delete the last section"); return; }
    setSections(prev => prev.filter((_, i) => i !== idx));
    if (activeSection >= idx && activeSection > 0) setActiveSection(prev => prev - 1);
    setActivePage(0);
    toast.success('Section deleted');
  }, [sections.length, activeSection]);

  const renameSection = useCallback((idx: number, name: string) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, name } : s));
    setEditingSectionId(null);
  }, []);

  const changeSectionColor = useCallback((idx: number, color: string) => {
    setSections(prev => prev.map((s, i) => i === idx ? { ...s, color } : s));
    setShowColorPicker(null);
  }, []);

  const addPage = useCallback((template?: string) => {
    if (!section) return;
    const tmpl = PAGE_TEMPLATES.find(t => t.name === template);
    const newPage: Page = { id: uid(), title: template || 'Untitled Page', content: tmpl?.content || '', updatedAt: new Date(), starred: false, tags: [] };
    const ns = [...sections];
    ns[activeSection] = { ...section, pages: [...section.pages, newPage] };
    setSections(ns);
    setActivePage(section.pages.length);
    setShowTemplates(false);
  }, [section, sections, activeSection]);

  const updatePage = useCallback((updates: Partial<Page>) => {
    if (!section || !page) return;
    const ns = [...sections];
    ns[activeSection] = {
      ...section,
      pages: section.pages.map((p, i) => i === activePage ? { ...p, ...updates, updatedAt: new Date() } : p)
    };
    setSections(ns);
  }, [section, page, sections, activeSection, activePage]);

  const duplicatePage = useCallback(() => {
    if (!section || !page) return;
    const dup: Page = { ...page, id: uid(), title: `${page.title} (Copy)`, updatedAt: new Date() };
    const ns = [...sections];
    ns[activeSection] = { ...section, pages: [...section.pages, dup] };
    setSections(ns);
    setActivePage(section.pages.length);
    toast.success('Page duplicated');
  }, [section, page, sections, activeSection]);

  const deletePage = useCallback(() => {
    if (!section || section.pages.length === 0) return;
    const ns = [...sections];
    ns[activeSection] = { ...section, pages: section.pages.filter((_, i) => i !== activePage) };
    setSections(ns);
    setActivePage(Math.max(0, activePage - 1));
    toast.success('Page deleted');
  }, [section, sections, activeSection, activePage]);

  const searchResults = search ? sections.flatMap((s, si) =>
    s.pages.filter(p => 
      p.title.toLowerCase().includes(search.toLowerCase()) || 
      p.content.toLowerCase().includes(search.toLowerCase())
    ).map((p) => ({ sectionIdx: si, pageIdx: s.pages.indexOf(p), page: p, section: s }))
  ) : [];

  const wordCount = page ? page.content.split(/\s+/).filter(Boolean).length : 0;
  const charCount = page ? page.content.length : 0;
  const lineCount = page ? page.content.split('\n').length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const insertAtCursor = useCallback((before: string, after?: string) => {
    if (!page || !textareaRef.current) return;
    pushUndo();
    const ta = textareaRef.current;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = page.content.slice(start, end);
    const newContent = page.content.slice(0, start) + before + selected + (after || '') + page.content.slice(end);
    updatePage({ content: newContent });
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  }, [page, updatePage, pushUndo]);

  const insertMarkdown = useCallback((prefix: string, suffix?: string) => {
    if (!page) return;
    pushUndo();
    const content = page.content;
    updatePage({ content: content + `\n${prefix}${suffix || ''}` });
  }, [page, updatePage, pushUndo]);

  const insertTable = useCallback((rows: number, cols: number) => {
    const header = '| ' + Array.from({ length: cols }, (_, i) => `Column ${i + 1}`).join(' | ') + ' |';
    const separator = '| ' + Array.from({ length: cols }, () => '---').join(' | ') + ' |';
    const body = Array.from({ length: rows }, () => '| ' + Array.from({ length: cols }, () => ' ').join(' | ') + ' |').join('\n');
    insertMarkdown(`${header}\n${separator}\n${body}`);
  }, [insertMarkdown]);

  const handleImageFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      insertMarkdown(`![${file.name}](${result})`);
      setShowImageDialog(false);
    };
    reader.readAsDataURL(file);
  }, [insertMarkdown]);

  const exportPage = useCallback((format: 'md' | 'txt' | 'html') => {
    if (!page) return;
    let content = page.content;
    let type = 'text/plain';
    let ext = 'txt';
    if (format === 'md') { type = 'text/markdown'; ext = 'md'; }
    if (format === 'html') {
      // Simple markdown to HTML
      content = `<!DOCTYPE html><html><head><title>${page.title}</title><style>body{font-family:system-ui;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;}h1,h2,h3{margin-top:24px;}pre{background:#f5f5f5;padding:16px;border-radius:8px;overflow-x:auto;}blockquote{border-left:3px solid #ddd;margin:0;padding-left:16px;color:#666;}table{border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px 12px;text-align:left;}th{background:#f5f5f5;}</style></head><body>${page.content}</body></html>`;
      type = 'text/html'; ext = 'html';
    }
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${page.title}.${ext}`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${ext.toUpperCase()}`);
    setShowExport(false);
  }, [page]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); insertAtCursor('**', '**'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); insertAtCursor('*', '*'); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') { e.preventDefault(); setPreviewMode(p => !p); }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveNote(); }
  }, [insertAtCursor, undo, redo]);

  const saveNote = useCallback(async () => {
    if (!user || !page) return;
    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        file_name: 'Notebook',
        file_type: 'document' as const,
        app_source: 'notes',
        source_id: 'notebook-root',
        source_route: '/lounge/office/notes',
        description: `${sections.reduce((s, sec) => s + sec.pages.length, 0)} pages across ${sections.length} sections`,
        metadata: JSON.parse(JSON.stringify({ sections })),
      };

      const { data: existing } = await supabase
        .from('platform_files')
        .select('id')
        .eq('user_id', user.id)
        .eq('app_source', 'notes')
        .eq('source_id', 'notebook-root')
        .maybeSingle();

      if (existing) {
        await supabase.from('platform_files').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('platform_files').insert(payload);
      }
      toast.success('Note saved');
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [user, page, sections]);

  return (
    <div className={cn("h-full flex flex-col overflow-hidden bg-background", fullscreen && "fixed inset-0 z-50")}>
      {/* ─── MOBILE LAYOUT ─── */}
      {isMobile ? (
        <>
          {/* Mobile: Sections list (like Apple Notes folders) */}
          {mobileView === 'sections' && (
            <div className="flex flex-col h-full">
              {/* Mobile header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-card/90 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => navigate('/lounge/office', { state: { fromOfficeApp: true } })}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-md shadow-violet-600/25">
                  <BookOpen className="h-4.5 w-4.5 text-white" />
                </div>
                <span className="text-base font-bold text-foreground">Notes</span>
                <div className="flex-1" />
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={addSection}>
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>

              {/* Search */}
              <div className="px-4 py-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all notes…" className="pl-10 h-10 text-sm bg-accent/50 border-0 rounded-xl" />
                  {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}
                </div>
              </div>

              {/* Search results */}
              {search && searchResults.length > 0 && (
                <div className="px-4 pb-2 space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground">{searchResults.length} results</span>
                  {searchResults.map((r, i) => (
                    <button key={i} onClick={() => { setActiveSection(r.sectionIdx); setActivePage(r.pageIdx); setSearch(''); setMobileView('editor'); }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-card hover:bg-accent/50 text-left transition-colors">
                      <div className="h-4 w-4 rounded-md shrink-0" style={{ background: r.section.color }} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-semibold text-foreground block truncate">{r.page.title}</span>
                        <span className="text-xs text-muted-foreground">{r.section.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Sections list */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                {sections.map((s, i) => (
                  <button key={s.id} onClick={() => { setActiveSection(i); setActivePage(0); setMobileView('pages'); }}
                    className={cn("w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]",
                      i === activeSection ? "bg-accent/70 shadow-sm" : "hover:bg-accent/30")}>
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color }}>
                      <Notebook className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-foreground block truncate">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.pages.length} note{s.pages.length !== 1 ? 's' : ''}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile: Pages list */}
          {mobileView === 'pages' && section && (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-card/90 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setMobileView('sections')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: section.color }}>
                  <Notebook className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-base font-bold text-foreground truncate flex-1">{section.name}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-xl w-44" align="end">
                    <DropdownMenuItem onClick={() => { setEditingSectionId(section.id); setSectionNameValue(section.name); }} className="text-sm gap-2"><Edit3 className="h-3.5 w-3.5" /> Rename</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowColorPicker(section.id)} className="text-sm gap-2"><Palette className="h-3.5 w-3.5" /> Change Color</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { deleteSection(activeSection); setMobileView('sections'); }} className="text-sm gap-2 text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Color picker inline */}
              {showColorPicker === section.id && (
                <div className="px-4 py-2 border-b border-border/20 bg-card/60">
                  <div className="flex items-center gap-2">
                    {SECTION_COLORS.map(c => (
                      <button key={c.value} onClick={() => changeSectionColor(activeSection, c.value)}
                        className={cn("h-8 w-8 rounded-full transition-transform active:scale-90", section.color === c.value && "ring-2 ring-foreground ring-offset-2 ring-offset-background")}
                        style={{ background: c.value }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Rename inline */}
              {editingSectionId === section.id && (
                <div className="px-4 py-2 border-b border-border/20 bg-card/60">
                  <Input autoFocus value={sectionNameValue} onChange={e => setSectionNameValue(e.target.value)}
                    onBlur={() => renameSection(activeSection, sectionNameValue)}
                    onKeyDown={e => { if (e.key === 'Enter') renameSection(activeSection, sectionNameValue); }}
                    className="h-10 text-sm rounded-xl" placeholder="Section name" />
                </div>
              )}

              {/* Pages */}
              <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                <AnimatePresence>
                  {section.pages.map((p, i) => (
                    <motion.button key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      onClick={() => { setActivePage(i); setMobileView('editor'); }}
                      className={cn("w-full flex flex-col gap-1 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.98]",
                        i === activePage ? "bg-accent/70 shadow-sm" : "hover:bg-accent/30")}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate flex-1">{p.title}</span>
                        {p.starred && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />}
                        {p.locked && <LockIcon className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />}
                      </div>
                      <span className="text-xs text-muted-foreground truncate">{p.content.split('\n').find(l => l && !l.startsWith('#'))?.slice(0, 100) || 'Empty page'}</span>
                      <span className="text-[10px] text-muted-foreground/50">{p.updatedAt.toLocaleDateString()}</span>
                    </motion.button>
                  ))}
                </AnimatePresence>

                {section.pages.length === 0 && (
                  <div className="text-center py-16">
                    <Notebook className="h-12 w-12 text-muted-foreground/15 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground/50 mb-3">No pages yet</p>
                    <Button variant="outline" size="sm" className="h-10 text-sm rounded-xl gap-2" onClick={() => addPage()}>
                      <Plus className="h-4 w-4" /> Add page
                    </Button>
                  </div>
                )}
              </div>

              {/* Mobile FAB to add page */}
              <Button
                onClick={() => { addPage(); setMobileView('editor'); }}
                className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg"
                size="icon"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Mobile: Editor */}
          {mobileView === 'editor' && page && (
            <div className="flex flex-col h-full">
              {/* Editor header */}
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30 bg-card/90 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setMobileView('pages')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold text-foreground truncate flex-1">{page.title}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => updatePage({ starred: !page.starred })}>
                  {page.starred ? <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> : <StarOff className="h-4 w-4 text-muted-foreground/40" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setPreviewMode(v => !v)}>
                  {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="rounded-xl w-44" align="end">
                    <DropdownMenuItem onClick={saveNote} className="text-sm gap-2"><Save className="h-3.5 w-3.5" /> Save</DropdownMenuItem>
                    <DropdownMenuItem onClick={duplicatePage} className="text-sm gap-2"><Copy className="h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowExport(true)} className="text-sm gap-2"><Download className="h-3.5 w-3.5" /> Export</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => updatePage({ locked: !page.locked })} className="text-sm gap-2">
                      {page.locked ? <><UnlockIcon className="h-3.5 w-3.5" /> Unlock</> : <><LockIcon className="h-3.5 w-3.5" /> Lock</>}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { deletePage(); setMobileView('pages'); }} className="text-sm gap-2 text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile formatting toolbar */}
              {!previewMode && !page.locked && (
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/20 bg-card/40 shrink-0 overflow-x-auto scrollbar-hide">
                  {[
                    { icon: Bold, action: () => insertAtCursor('**', '**') },
                    { icon: Italic, action: () => insertAtCursor('*', '*') },
                    { icon: Strikethrough, action: () => insertAtCursor('~~', '~~') },
                    { icon: Heading1, action: () => insertAtCursor('# ') },
                    { icon: Heading2, action: () => insertAtCursor('## ') },
                    { icon: List, action: () => insertMarkdown('- ') },
                    { icon: ListOrdered, action: () => insertMarkdown('1. ') },
                    { icon: CheckSquare, action: () => insertMarkdown('- [ ] ') },
                    { icon: Quote, action: () => insertMarkdown('> ') },
                    { icon: Code, action: () => insertAtCursor('`', '`') },
                    { icon: Link2, action: () => insertMarkdown('[text](url)') },
                    { icon: Image, action: () => setShowImageDialog(true) },
                  ].map(({ icon: Icon, action }, i) => (
                    <Button key={i} variant="ghost" size="icon" className="h-9 w-9 rounded-lg shrink-0" onClick={action}>
                      <Icon className="h-4 w-4" />
                    </Button>
                  ))}
                </div>
              )}

              {/* Title + content */}
              <div className="flex-1 overflow-auto">
                <div className="px-4 py-4">
                  <Input value={page.title} onChange={e => updatePage({ title: e.target.value })}
                    className="text-xl font-bold bg-transparent border-none shadow-none focus-visible:ring-0 p-0 h-auto text-foreground mb-2"
                    placeholder="Page title" disabled={page.locked} />
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[11px] text-muted-foreground/50">{page.updatedAt.toLocaleString()}</span>
                    <span className="text-[11px] text-muted-foreground/30">·</span>
                    <span className="text-[11px] text-muted-foreground/50">{wordCount} words</span>
                  </div>

                  {previewMode ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{page.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <Textarea ref={textareaRef} value={page.content}
                      onChange={e => { pushUndo(); updatePage({ content: e.target.value }); }}
                      onKeyDown={handleKeyDown}
                      className="min-h-[60vh] bg-transparent border-none shadow-none focus-visible:ring-0 p-0 text-sm text-foreground/80 leading-relaxed resize-none"
                      placeholder="Start writing…" disabled={page.locked} />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Mobile: No page selected edge case */}
          {mobileView === 'editor' && !page && (
            <div className="flex flex-col h-full">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/30 bg-card/90 shrink-0">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setMobileView('pages')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-semibold text-foreground">Notes</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center px-8">
                  <PenLine className="h-12 w-12 text-muted-foreground/15 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-muted-foreground/60 mb-2">No page selected</p>
                  <Button variant="outline" size="sm" className="h-10 text-sm rounded-xl gap-2" onClick={() => { addPage(); }}>
                    <Plus className="h-4 w-4" /> New Page
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ─── DESKTOP LAYOUT (unchanged) ─── */
        <>
          {/* Title Bar */}
          <div className="flex items-center gap-2 px-3 h-11 bg-card/90 backdrop-blur-xl border-b border-border/30 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => { if (fullscreen) { setFullscreen(false); } else { navigate('/lounge/office', { state: { fromOfficeApp: true } }); } }}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-md shadow-violet-600/25">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-semibold text-foreground">Notes</span>
            
            <div className="hidden md:flex items-center gap-2 ml-4">
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/40 border border-border/20">
                <Notebook className="h-2.5 w-2.5 text-violet-500" />
                <span className="text-[9px] font-semibold">{sections.length}</span>
                <span className="text-[9px] text-muted-foreground">notebooks</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/40 border border-border/20">
                <FileText className="h-2.5 w-2.5 text-blue-500" />
                <span className="text-[9px] font-semibold">{totalPages}</span>
                <span className="text-[9px] text-muted-foreground">pages</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/40 border border-border/20">
                <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                <span className="text-[9px] font-semibold">{starredPages}</span>
                <span className="text-[9px] text-muted-foreground">starred</span>
              </div>
            </div>

            <div className="flex-1" />
            
            {/* View toggles */}
            <Button variant={splitView ? 'secondary' : 'ghost'} size="sm" className="h-7 text-[10px] gap-1 rounded-lg" onClick={() => { setSplitView(v => !v); setPreviewMode(false); }}>
              <Columns className="h-3 w-3" /> Split
            </Button>
            <Button variant={previewMode ? 'secondary' : 'ghost'} size="sm" className="h-7 text-[10px] gap-1 rounded-lg" onClick={() => { setPreviewMode(v => !v); setSplitView(false); }}>
              <Eye className="h-3 w-3" /> Preview
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setFullscreen(v => !v)} title="Focus mode">
              <Maximize2 className="h-3 w-3" />
            </Button>
            
            <div className="relative w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all notes…" className="pl-8 h-8 text-[10px] bg-secondary/40 border-border/30 rounded-xl" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>}
            </div>
          </div>

          {/* Search Results */}
          {search && searchResults.length > 0 && (
            <div className="px-3 py-2 bg-card/60 border-b border-border/20 max-h-48 overflow-y-auto">
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider mb-1 block">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</span>
              {searchResults.map((r, i) => (
                <button key={i} onClick={() => { setActiveSection(r.sectionIdx); setActivePage(r.pageIdx); setSearch(''); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-accent/30 text-left">
                  <div className="h-3 w-3 rounded-sm shrink-0" style={{ background: r.section.color }} />
                  <span className="text-[10px] font-semibold text-foreground truncate">{r.page.title}</span>
                  <span className="text-[9px] text-muted-foreground/50 ml-auto">{r.section.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Main area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sections sidebar */}
            <div className="w-52 border-r border-border/30 bg-card/30 shrink-0 flex flex-col">
              <div className="p-2.5 flex items-center justify-between border-b border-border/20">
                <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">Notebooks</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={addSection}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                {sections.map((s, i) => (
                  <div key={s.id} className="group relative">
                    {editingSectionId === s.id ? (
                      <div className="flex items-center gap-1 px-2 py-1.5">
                        <div className="h-3.5 w-3.5 rounded-sm shrink-0" style={{ background: s.color }} />
                        <Input autoFocus value={sectionNameValue} onChange={e => setSectionNameValue(e.target.value)}
                          onBlur={() => renameSection(i, sectionNameValue)}
                          onKeyDown={e => { if (e.key === 'Enter') renameSection(i, sectionNameValue); if (e.key === 'Escape') setEditingSectionId(null); }}
                          className="h-6 text-[10px] bg-transparent border-border/40 rounded-md flex-1" />
                      </div>
                    ) : (
                      <button onClick={() => { setActiveSection(i); setActivePage(0); }}
                        className={cn("w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-left transition-all",
                          i === activeSection ? "bg-accent/70 shadow-sm" : "hover:bg-accent/30")}>
                        <div className="h-4 w-4 rounded-md shrink-0 flex items-center justify-center" style={{ background: s.color }}>
                          <Notebook className="h-2.5 w-2.5 text-white" />
                        </div>
                        <span className="text-[11px] font-semibold text-foreground truncate flex-1">{s.name}</span>
                        <span className="text-[9px] text-muted-foreground/50 tabular-nums">{s.pages.length}</span>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="h-5 w-5 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-accent/50 transition-all" onClick={e => e.stopPropagation()}>
                              <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="rounded-xl w-40" align="end">
                            <DropdownMenuItem onClick={() => { setEditingSectionId(s.id); setSectionNameValue(s.name); }} className="text-xs gap-2"><Edit3 className="h-3 w-3" /> Rename</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowColorPicker(s.id)} className="text-xs gap-2"><Palette className="h-3 w-3" /> Change Color</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteSection(i)} className="text-xs gap-2 text-destructive"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </button>
                    )}

                    {showColorPicker === s.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                        className="absolute left-2 top-full mt-1 z-30 bg-card border border-border/40 rounded-xl p-2 shadow-xl">
                        <div className="grid grid-cols-4 gap-1.5">
                          {SECTION_COLORS.map(c => (
                            <button key={c.value} onClick={() => changeSectionColor(i, c.value)}
                              className={cn("h-6 w-6 rounded-lg transition-transform hover:scale-110", s.color === c.value && "ring-2 ring-foreground ring-offset-1")}
                              style={{ background: c.value }} title={c.name} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pages list */}
            <div className="w-60 border-r border-border/30 bg-card/15 shrink-0 flex flex-col">
              <div className="p-2.5 flex items-center justify-between border-b border-border/20">
                <div className="flex items-center gap-1.5">
                  {section && <div className="h-2.5 w-2.5 rounded-sm" style={{ background: section.color }} />}
                  <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider">{section?.name || 'Pages'}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={() => setShowTemplates(true)} title="New from template">
                    <LayoutGrid className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={() => addPage()}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
                <AnimatePresence>
                  {section?.pages.map((p, i) => (
                    <motion.button key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      onClick={() => setActivePage(i)}
                      className={cn("w-full flex flex-col gap-1 px-3 py-2.5 rounded-xl text-left transition-all",
                        i === activePage ? "bg-accent/70 shadow-sm" : "hover:bg-accent/30")}>
                      <div className="flex items-center gap-1.5">
                        <StickyNote className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                        <span className="text-[11px] font-semibold text-foreground truncate flex-1">{p.title}</span>
                        {p.starred && <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 shrink-0" />}
                        {p.locked && <LockIcon className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />}
                      </div>
                      <span className="text-[9px] text-muted-foreground/50 pl-[18px] truncate line-clamp-2">{p.content.split('\n').find(l => l && !l.startsWith('#'))?.slice(0, 80) || 'Empty page'}</span>
                      <div className="flex items-center gap-2 pl-[18px] mt-0.5">
                        <Clock className="h-2 w-2 text-muted-foreground/30" />
                        <span className="text-[8px] text-muted-foreground/40">{p.updatedAt.toLocaleDateString()}</span>
                        {p.tags?.map(t => (
                          <span key={t} className="text-[7px] px-1 py-0.5 rounded bg-secondary/50 text-muted-foreground/60">{t}</span>
                        ))}
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
                {(!section || section.pages.length === 0) && (
                  <div className="text-center py-12">
                    <Notebook className="h-10 w-10 text-muted-foreground/15 mx-auto mb-3" />
                    <p className="text-[10px] text-muted-foreground/40 mb-2">No pages yet</p>
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-xl" onClick={() => addPage()}>
                      <Plus className="h-3 w-3 mr-1" /> Add page
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Page editor */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {page ? (
                <>
                  {/* Enhanced Editor toolbar */}
                  <div className="flex items-center gap-0.5 px-4 h-10 border-b border-border/20 bg-card/40 shrink-0 overflow-x-auto">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={undo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)"><Undo2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)"><Redo2 className="h-3.5 w-3.5" /></Button>
                    <div className="w-px h-5 bg-border/30 mx-1" />
                    
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertAtCursor('# ')} title="Heading 1"><Heading1 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertAtCursor('## ')} title="Heading 2"><Heading2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertAtCursor('### ')} title="Heading 3"><Heading3 className="h-3.5 w-3.5" /></Button>
                    <div className="w-px h-5 bg-border/30 mx-1" />
                    
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertAtCursor('**', '**')} title="Bold (Ctrl+B)"><Bold className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertAtCursor('*', '*')} title="Italic (Ctrl+I)"><Italic className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertAtCursor('~~', '~~')} title="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertAtCursor('`', '`')} title="Inline code"><Code className="h-3.5 w-3.5" /></Button>
                    <div className="w-px h-5 bg-border/30 mx-1" />
                    
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertMarkdown('- ')} title="Bullet list"><List className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertMarkdown('1. ')} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertMarkdown('- [ ] ')} title="Checklist"><CheckSquare className="h-3.5 w-3.5" /></Button>
                    <div className="w-px h-5 bg-border/30 mx-1" />
                    
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertMarkdown('> ')} title="Quote"><Quote className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertMarkdown('```\n', '\n```')} title="Code block"><Code className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertMarkdown('---')} title="Horizontal rule"><Minus className="h-3.5 w-3.5" /></Button>
                    <div className="w-px h-5 bg-border/30 mx-1" />
                    
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => insertMarkdown('[text](url)')} title="Link"><Link2 className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setShowImageDialog(true)} title="Insert image"><Image className="h-3.5 w-3.5" /></Button>
                    
                    {/* Insert table */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" title="Insert table"><Table2 className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-xl w-32">
                        <DropdownMenuItem onClick={() => insertTable(3, 3)} className="text-xs gap-2">3 × 3 Table</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => insertTable(5, 4)} className="text-xs gap-2">5 × 4 Table</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => insertTable(10, 5)} className="text-xs gap-2">10 × 5 Table</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <div className="flex-1" />
                    
                    {/* Save */}
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 rounded-lg" onClick={saveNote} disabled={saving}>
                      <Save className="h-3 w-3" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                    {/* Export */}
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 rounded-lg" onClick={() => setShowExport(true)}>
                      <Download className="h-3 w-3" /> Export
                    </Button>

                    {/* Page actions */}
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => updatePage({ starred: !page.starred })}>
                      {page.starred ? <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> : <StarOff className="h-3.5 w-3.5 text-muted-foreground/40" />}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-xl w-40" align="end">
                        <DropdownMenuItem onClick={duplicatePage} className="text-xs gap-2"><Copy className="h-3 w-3" /> Duplicate</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => updatePage({ locked: !page.locked })} className="text-xs gap-2">{page.locked ? <><UnlockIcon className="h-3 w-3" /> Unlock</> : <><LockIcon className="h-3 w-3" /> Lock</>}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={deletePage} className="text-xs gap-2 text-destructive"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Page title & content */}
                  <div className="flex-1 overflow-auto">
                    <div className={cn("mx-auto px-8 py-6", splitView ? "max-w-full flex gap-4" : "max-w-3xl")}>
                      {!splitView && (
                        <>
                          <Input value={page.title} onChange={e => updatePage({ title: e.target.value })}
                            className="text-2xl font-bold bg-transparent border-none shadow-none focus-visible:ring-0 p-0 h-auto text-foreground mb-1"
                            placeholder="Page title" disabled={page.locked} />
                          <div className="flex items-center gap-3 mb-4">
                            <span className="text-[9px] text-muted-foreground/50 flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> {page.updatedAt.toLocaleString()}</span>
                            <span className="text-[9px] text-muted-foreground/30">·</span>
                            <span className="text-[9px] text-muted-foreground/50">{wordCount} words</span>
                            <span className="text-[9px] text-muted-foreground/30">·</span>
                            <span className="text-[9px] text-muted-foreground/50">{charCount} chars</span>
                            <span className="text-[9px] text-muted-foreground/30">·</span>
                            <span className="text-[9px] text-muted-foreground/50">{lineCount} lines</span>
                            <span className="text-[9px] text-muted-foreground/30">·</span>
                            <span className="text-[9px] text-muted-foreground/50">{readingTime} min read</span>
                          </div>
                        </>
                      )}
                      
                      {previewMode ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{page.content}</ReactMarkdown>
                        </div>
                      ) : splitView ? (
                        <>
                          <div className="flex-1">
                            <Input value={page.title} onChange={e => updatePage({ title: e.target.value })}
                              className="text-xl font-bold bg-transparent border-none shadow-none focus-visible:ring-0 p-0 h-auto text-foreground mb-2"
                              placeholder="Page title" disabled={page.locked} />
                            <Textarea ref={textareaRef} value={page.content}
                              onChange={e => { pushUndo(); updatePage({ content: e.target.value }); }}
                              onKeyDown={handleKeyDown}
                              className="min-h-[600px] bg-transparent border border-border/20 rounded-lg shadow-none focus-visible:ring-1 focus-visible:ring-violet-500/30 p-4 text-sm text-foreground/80 leading-relaxed resize-none font-mono"
                              placeholder="Start writing… Supports markdown." disabled={page.locked} />
                          </div>
                          <div className="flex-1 border border-border/20 rounded-lg p-4 overflow-auto bg-card/30">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown>{page.content}</ReactMarkdown>
                            </div>
                          </div>
                        </>
                      ) : (
                        <Textarea ref={textareaRef} value={page.content}
                          onChange={e => { pushUndo(); updatePage({ content: e.target.value }); }}
                          onKeyDown={handleKeyDown}
                          className="min-h-[600px] bg-transparent border-none shadow-none focus-visible:ring-0 p-0 text-sm text-foreground/80 leading-relaxed resize-none font-mono"
                          placeholder="Start writing… Supports markdown for rich formatting." disabled={page.locked} />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                      <PenLine className="h-8 w-8 text-violet-500/30" />
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">Select or create a page</p>
                    <p className="text-xs text-muted-foreground/50 mb-4">Choose a page from the sidebar or create a new one</p>
                    <div className="flex items-center gap-2 justify-center">
                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1.5" onClick={() => addPage()}>
                        <Plus className="h-3 w-3" /> Blank Page
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1.5" onClick={() => setShowTemplates(true)}>
                        <LayoutGrid className="h-3 w-3" /> From Template
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="sm:max-w-lg rounded-xl">
          <DialogHeader><DialogTitle className="text-sm font-semibold flex items-center gap-2"><LayoutGrid className="h-4 w-4 text-violet-500" /> Page Templates</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {PAGE_TEMPLATES.map(tmpl => (
              <button key={tmpl.name} onClick={() => { addPage(tmpl.name); if (isMobile) setMobileView('editor'); }}
                className="p-4 rounded-xl border border-border/30 hover:border-violet-500/40 hover:bg-violet-500/5 transition-all text-left group">
                <FileText className="h-5 w-5 text-violet-500/50 mb-2 group-hover:text-violet-500 transition-colors" />
                <p className="text-xs font-semibold text-foreground">{tmpl.name}</p>
                <p className="text-[9px] text-muted-foreground/60 mt-0.5 line-clamp-2">{tmpl.content.split('\n')[0].replace(/^#+\s*/, '') || 'Empty page'}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader><DialogTitle className="text-sm font-semibold flex items-center gap-2"><Image className="h-4 w-4 text-violet-500" /> Insert Image</DialogTitle></DialogHeader>
          <Tabs defaultValue="upload" className="mt-1">
            <TabsList className="grid w-full grid-cols-2 h-8 rounded-lg">
              <TabsTrigger value="upload" className="text-[11px] rounded-md gap-1.5"><Upload className="h-3 w-3" /> From Computer</TabsTrigger>
              <TabsTrigger value="url" className="text-[11px] rounded-md gap-1.5"><Link2 className="h-3 w-3" /> From URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-3">
              <div onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/40 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-all">
                <FileUp className="h-8 w-8 text-violet-500/40 mx-auto mb-2" />
                <p className="text-xs font-medium">Click to upload an image</p>
                <p className="text-[10px] text-muted-foreground mt-1">PNG, JPG, GIF, WebP, SVG</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
            </TabsContent>
            <TabsContent value="url" className="mt-3 space-y-3">
              <Input placeholder="https://example.com/image.png" className="text-xs rounded-lg"
                onKeyDown={e => { if (e.key === 'Enter') { insertMarkdown(`![image](${(e.target as HTMLInputElement).value})`); setShowImageDialog(false); } }} />
              <p className="text-[10px] text-muted-foreground">Press Enter to insert</p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="sm:max-w-sm rounded-xl">
          <DialogHeader><DialogTitle className="text-sm font-semibold flex items-center gap-2"><Download className="h-4 w-4 text-violet-500" /> Export Page</DialogTitle></DialogHeader>
          <div className="space-y-2 mt-2">
            <Button variant="outline" className="w-full justify-start text-xs gap-2 rounded-lg h-10" onClick={() => exportPage('md')}>
              <FileText className="h-4 w-4 text-blue-500" /> Markdown (.md)
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs gap-2 rounded-lg h-10" onClick={() => exportPage('txt')}>
              <Type className="h-4 w-4 text-gray-500" /> Plain Text (.txt)
            </Button>
            <Button variant="outline" className="w-full justify-start text-xs gap-2 rounded-lg h-10" onClick={() => exportPage('html')}>
              <Code className="h-4 w-4 text-orange-500" /> HTML (.html)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
