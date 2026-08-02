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
  Maximize2, Lock as LockIcon, Unlock as UnlockIcon, Folder, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OfficeModuleBand } from '@/pages/lounge/office/ModuleShell';
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
  { name: 'Daily Journal', content: '# Journal — \n\n## Morning\n**Mood:** \n**Top 3 priorities:**\n1. \n2. \n3. \n\n## Notes\n\n\n## Evening Reflection\n**What went well:**\n- \n\n**What to improve:**\n- \n\n**Grateful for:**\n- ' },
  { name: 'Research Notes', content: '# Research: \n\n## Summary\n\n\n## Key Findings\n1. \n2. \n3. \n\n## Sources\n- [Source 1]()\n- [Source 2]()\n\n## Quotes\n> \n\n## Open Questions\n- [ ] \n- [ ] \n\n## Next Steps\n- ' },
  { name: 'Weekly Review', content: '# Weekly Review — Week of \n\n## ✅ Accomplished\n- \n- \n\n## Metrics\n| Metric | Target | Actual |\n|--------|--------|--------|\n| | | |\n\n## In Progress\n- \n\n## Next Week\n1. \n2. \n3. \n\n## Ideas & Insights\n- ' },
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

  const noteDate = (d: Date) => {
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const y = new Date(now); y.setDate(now.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };
  const snippet = (p: Page) => p.content.split('\n').find(l => l && !l.startsWith('#'))?.slice(0, 90) || 'No additional text';

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

  const LABEL = 'text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground/90';

  /* The condensed toolbar: every capability, few buttons. */
  const InlineTools = ({ size = 'h-7 w-7' }: { size?: string }) => (
    <>
      <Button variant="ghost" size="icon" className={cn(size, 'rounded-[7px]')} onClick={undo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)"><Undo2 className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className={cn(size, 'rounded-[7px]')} onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)"><Redo2 className="h-3.5 w-3.5" /></Button>
      <div className="mx-1 h-4 w-px bg-border/50" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-[7px] px-2 text-[12px] font-semibold" title="Text style">
            Aa <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40 rounded-[12px]" align="start">
          <DropdownMenuItem onClick={() => insertAtCursor('# ')} className="gap-2 text-sm"><Heading1 className="h-3.5 w-3.5" /> Title</DropdownMenuItem>
          <DropdownMenuItem onClick={() => insertAtCursor('## ')} className="gap-2 text-sm"><Heading2 className="h-3.5 w-3.5" /> Heading</DropdownMenuItem>
          <DropdownMenuItem onClick={() => insertAtCursor('### ')} className="gap-2 text-sm"><Heading3 className="h-3.5 w-3.5" /> Subheading</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => insertAtCursor('~~', '~~')} className="gap-2 text-sm"><Strikethrough className="h-3.5 w-3.5" /> Strikethrough</DropdownMenuItem>
          <DropdownMenuItem onClick={() => insertAtCursor('`', '`')} className="gap-2 text-sm"><Code className="h-3.5 w-3.5" /> Monospaced</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" size="icon" className={cn(size, 'rounded-[7px]')} onClick={() => insertAtCursor('**', '**')} title="Bold (Ctrl+B)"><Bold className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className={cn(size, 'rounded-[7px]')} onClick={() => insertAtCursor('*', '*')} title="Italic (Ctrl+I)"><Italic className="h-3.5 w-3.5" /></Button>
      <div className="mx-1 h-4 w-px bg-border/50" />
      <Button variant="ghost" size="icon" className={cn(size, 'rounded-[7px]')} onClick={() => insertMarkdown('- ')} title="Bulleted list"><List className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className={cn(size, 'rounded-[7px]')} onClick={() => insertMarkdown('1. ')} title="Numbered list"><ListOrdered className="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" className={cn(size, 'rounded-[7px]')} onClick={() => insertMarkdown('- [ ] ')} title="Checklist"><CheckSquare className="h-3.5 w-3.5" /></Button>
      <div className="mx-1 h-4 w-px bg-border/50" />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 gap-1 rounded-[7px] px-2 text-[11.5px]" title="Insert">
            Insert <ChevronDown className="h-3 w-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-44 rounded-[12px]" align="start">
          <DropdownMenuItem onClick={() => insertMarkdown('> ')} className="gap-2 text-sm"><Quote className="h-3.5 w-3.5" /> Quote</DropdownMenuItem>
          <DropdownMenuItem onClick={() => insertMarkdown('```\n', '\n```')} className="gap-2 text-sm"><Code className="h-3.5 w-3.5" /> Code block</DropdownMenuItem>
          <DropdownMenuItem onClick={() => insertMarkdown('---')} className="gap-2 text-sm"><Minus className="h-3.5 w-3.5" /> Divider</DropdownMenuItem>
          <DropdownMenuItem onClick={() => insertMarkdown('[text](url)')} className="gap-2 text-sm"><Link2 className="h-3.5 w-3.5" /> Link</DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowImageDialog(true)} className="gap-2 text-sm"><Image className="h-3.5 w-3.5" /> Image</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => insertTable(3, 3)} className="gap-2 text-sm"><Table2 className="h-3.5 w-3.5" /> Table 3 × 3</DropdownMenuItem>
          <DropdownMenuItem onClick={() => insertTable(5, 4)} className="gap-2 text-sm"><Table2 className="h-3.5 w-3.5" /> Table 5 × 4</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );

  const PageMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Note actions" className="h-7 w-7 rounded-[7px]"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44 rounded-[12px]" align="end">
        <DropdownMenuItem onClick={saveNote} className="gap-2 text-sm"><Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save now'}</DropdownMenuItem>
        <DropdownMenuItem onClick={duplicatePage} className="gap-2 text-sm"><Copy className="h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setShowExport(true)} className="gap-2 text-sm"><Download className="h-3.5 w-3.5" /> Export</DropdownMenuItem>
        <DropdownMenuItem onClick={() => page && updatePage({ locked: !page.locked })} className="gap-2 text-sm">
          {page?.locked ? <><UnlockIcon className="h-3.5 w-3.5" /> Unlock</> : <><LockIcon className="h-3.5 w-3.5" /> Lock</>}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { deletePage(); if (isMobile) setMobileView('pages'); }} className="gap-2 text-sm text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className={cn('h-full flex flex-col overflow-hidden bg-background', fullscreen && 'fixed inset-0 z-50')}>
      {/* ─── MOBILE ─── */}
      {isMobile ? (
        <>
          {/* Folders */}
          {mobileView === 'sections' && (
            <div className="flex h-full flex-col">
              <OfficeModuleBand appId="notes" icon={BookOpen} title="Notes">
                <Button variant="ghost" size="icon" aria-label="New folder" className="h-8 w-8 rounded-full" onClick={addSection}>
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </OfficeModuleBand>

              <div className="flex-1 overflow-y-auto bg-card/45">
                <div className="px-4 pb-10 pt-5">
                  <h1 className="font-display text-[27px] font-semibold leading-none tracking-[-0.025em]">Notes</h1>
                  <p className="mt-1.5 text-[12.5px] text-muted-foreground">
                    {totalPages} {totalPages === 1 ? 'note' : 'notes'} in {sections.length} {sections.length === 1 ? 'folder' : 'folders'}
                  </p>

                  <div className="relative mt-4">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all notes"
                      className="h-10 rounded-full border-border/50 bg-foreground/[0.035] pl-10 text-[14px]" />
                    {search && <button aria-label="Clear search" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}
                  </div>

                  {search && (
                    <div className="mt-4">
                      <p className={cn(LABEL, 'pb-1.5')}>{searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}</p>
                      <div className="overflow-hidden rounded-[14px] border border-border/40 bg-card">
                        {searchResults.length === 0 ? (
                          <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">Nothing matches that.</p>
                        ) : searchResults.map((r, i) => (
                          <button key={i} onClick={() => { setActiveSection(r.sectionIdx); setActivePage(r.pageIdx); setSearch(''); setMobileView('editor'); }}
                            className="flex w-full items-center gap-3 border-b border-border/30 px-4 py-3 text-left last:border-b-0">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: r.section.color }} />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[14.5px] font-medium">{r.page.title}</span>
                              <span className="block text-[12px] text-muted-foreground">{r.section.name}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {!search && (
                    <div className="mt-5 overflow-hidden rounded-[14px] border border-border/40 bg-card">
                      {sections.map((s, i) => (
                        <button key={s.id} onClick={() => { setActiveSection(i); setActivePage(0); setMobileView('pages'); }}
                          className="flex w-full items-center gap-3 border-b border-border/30 px-4 py-3 text-left transition-colors last:border-b-0 active:bg-foreground/[0.04]">
                          <Folder className="h-[19px] w-[19px] shrink-0" strokeWidth={1.7} style={{ color: s.color }} />
                          <span className="min-w-0 flex-1 truncate text-[15px]">{s.name}</span>
                          <span className="shrink-0 text-[13px] tabular-nums text-muted-foreground">{s.pages.length}</span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes in a folder */}
          {mobileView === 'pages' && section && (
            <div className="flex h-full flex-col">
              <header className="relative flex h-12 shrink-0 items-center gap-1.5 border-b border-border/60 bg-black/60 px-1.5">
                <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-primary/60" />
                <Button variant="ghost" size="sm" className="h-8 gap-0.5 rounded-full px-2 text-[13.5px] text-primary" onClick={() => setMobileView('sections')}>
                  <ArrowLeft className="h-4 w-4" /> Folders
                </Button>
                <div className="min-w-0 flex-1" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Folder actions" className="h-8 w-8 rounded-full"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-44 rounded-[12px]" align="end">
                    <DropdownMenuItem onClick={() => { setEditingSectionId(section.id); setSectionNameValue(section.name); }} className="gap-2 text-sm"><Edit3 className="h-3.5 w-3.5" /> Rename</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setShowColorPicker(section.id)} className="gap-2 text-sm"><Palette className="h-3.5 w-3.5" /> Colour</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { deleteSection(activeSection); setMobileView('sections'); }} className="gap-2 text-sm text-destructive"><Trash2 className="h-3.5 w-3.5" /> Delete folder</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </header>

              {showColorPicker === section.id && (
                <div className="border-b border-border/40 bg-card px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    {SECTION_COLORS.map(c => (
                      <button key={c.value} aria-label={c.name} onClick={() => changeSectionColor(activeSection, c.value)}
                        className={cn('h-7 w-7 rounded-full', section.color === c.value && 'ring-2 ring-foreground ring-offset-2 ring-offset-background')}
                        style={{ background: c.value }} />
                    ))}
                  </div>
                </div>
              )}
              {editingSectionId === section.id && (
                <div className="border-b border-border/40 bg-card px-4 py-2.5">
                  <Input autoFocus value={sectionNameValue} onChange={e => setSectionNameValue(e.target.value)}
                    onBlur={() => renameSection(activeSection, sectionNameValue)}
                    onKeyDown={e => { if (e.key === 'Enter') renameSection(activeSection, sectionNameValue); }}
                    className="h-10 rounded-[10px] border-border/50 text-[14px]" placeholder="Folder name" />
                </div>
              )}

              <div className="flex-1 overflow-y-auto bg-card/45">
                <div className="px-4 pb-24 pt-5">
                  <div className="flex items-baseline gap-2.5">
                    <h1 className="min-w-0 truncate font-display text-[27px] font-semibold leading-none tracking-[-0.025em]">{section.name}</h1>
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: section.color }} />
                  </div>
                  <p className="mt-1.5 text-[12.5px] text-muted-foreground">{section.pages.length} {section.pages.length === 1 ? 'note' : 'notes'}</p>

                  {section.pages.length === 0 ? (
                    <div className="mt-6 rounded-[14px] bg-foreground/[0.025] px-6 py-14 text-center">
                      <p className="text-[14px] font-medium">No notes here yet</p>
                      <p className="mx-auto mt-1.5 max-w-sm text-[12.5px] leading-relaxed text-muted-foreground">Write the first one - it saves to your workspace as you type.</p>
                    </div>
                  ) : (
                    <div className="mt-5 overflow-hidden rounded-[14px] border border-border/40 bg-card">
                      {section.pages.map((p, i) => (
                        <button key={p.id} onClick={() => { setActivePage(i); setMobileView('editor'); }}
                          className="w-full border-b border-border/30 px-4 py-3 text-left transition-colors last:border-b-0 active:bg-foreground/[0.04]">
                          <span className="flex items-center gap-1.5">
                            <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{p.title}</span>
                            {p.starred && <Star className="h-3.5 w-3.5 shrink-0 fill-attend text-attend" />}
                            {p.locked && <LockIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />}
                          </span>
                          <span className="mt-0.5 flex items-baseline gap-2">
                            <span className="shrink-0 text-[12.5px] tabular-nums text-muted-foreground">{noteDate(p.updatedAt)}</span>
                            <span className="min-w-0 truncate text-[12.5px] text-muted-foreground/80">{snippet(p)}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button onClick={() => { addPage(); setMobileView('editor'); }} aria-label="New note" size="icon"
                className="fixed bottom-6 right-4 z-40 h-12 w-12 rounded-[14px] shadow-[inset_0_1px_0_hsl(0_0%_100%/0.18),0_8px_20px_-8px_hsl(17_88%_40%/0.5)]">
                <PenLine className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Editor */}
          {mobileView === 'editor' && page && (
            <div className="flex h-full flex-col">
              <header className="relative flex h-12 shrink-0 items-center gap-1.5 border-b border-border/60 bg-black/60 px-1.5">
                <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-primary/60" />
                <Button variant="ghost" size="sm" className="h-8 gap-0.5 rounded-full px-2 text-[13.5px] text-primary" onClick={() => setMobileView('pages')}>
                  <ArrowLeft className="h-4 w-4" /> {section?.name || 'Notes'}
                </Button>
                <div className="min-w-0 flex-1" />
                <Button variant="ghost" size="icon" aria-label={page.starred ? 'Unstar' : 'Star'} className="h-8 w-8 rounded-full" onClick={() => updatePage({ starred: !page.starred })}>
                  {page.starred ? <Star className="h-4 w-4 fill-attend text-attend" /> : <Star className="h-4 w-4 text-muted-foreground" />}
                </Button>
                <Button variant="ghost" size="icon" aria-label="Toggle preview" className="h-8 w-8 rounded-full" onClick={() => setPreviewMode(v => !v)}>
                  {previewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <PageMenu />
              </header>

              {!previewMode && !page.locked && (
                <div className="scrollbar-none flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border/40 bg-black/40 px-2 py-1">
                  <InlineTools size="h-9 w-9" />
                </div>
              )}

              <div className="flex-1 overflow-auto bg-card/45">
                <div className="px-5 py-5">
                  <Input value={page.title} onChange={e => updatePage({ title: e.target.value })}
                    className="h-auto border-none bg-transparent p-0 font-display text-[23px] font-semibold tracking-[-0.02em] shadow-none focus-visible:ring-0"
                    placeholder="Title" disabled={page.locked} />
                  <p className="mb-4 mt-1 text-[11.5px] tabular-nums text-muted-foreground">
                    {noteDate(page.updatedAt)} · {wordCount} {wordCount === 1 ? 'word' : 'words'}
                  </p>

                  {previewMode ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{page.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <Textarea ref={textareaRef} value={page.content}
                      onChange={e => { pushUndo(); updatePage({ content: e.target.value }); }}
                      onKeyDown={handleKeyDown}
                      className="min-h-[60vh] resize-none border-none bg-transparent p-0 text-[16px] leading-[1.7] text-foreground/90 shadow-none focus-visible:ring-0"
                      placeholder="Start writing" disabled={page.locked} />
                  )}
                </div>
              </div>
            </div>
          )}

          {mobileView === 'editor' && !page && (
            <div className="flex h-full flex-col">
              <header className="relative flex h-12 shrink-0 items-center gap-1.5 border-b border-border/60 bg-black/60 px-1.5">
                <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-primary/60" />
                <Button variant="ghost" size="sm" className="h-8 gap-0.5 rounded-full px-2 text-[13.5px] text-primary" onClick={() => setMobileView('pages')}>
                  <ArrowLeft className="h-4 w-4" /> Back
                </Button>
              </header>
              <div className="flex flex-1 items-center justify-center bg-card/45 px-8">
                <div className="w-full rounded-[14px] bg-foreground/[0.025] px-6 py-14 text-center">
                  <p className="text-[14px] font-medium">No note selected</p>
                  <Button variant="outline" size="sm" className="mt-4 h-10 gap-2 rounded-[10px] text-sm" onClick={() => { addPage(); }}>
                    <PenLine className="h-4 w-4" /> New note
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* ─── DESKTOP: three quiet panes under the band ─── */
        <>
          <OfficeModuleBand appId="notes" icon={BookOpen} title="Notes" context={`${totalPages} ${totalPages === 1 ? 'note' : 'notes'} · ${starredPages} starred`}>
            <div className="relative w-56">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes"
                className="h-8 rounded-[7px] border-border/70 bg-black/40 pl-9 text-[12.5px]" />
              {search && <button aria-label="Clear search" onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
            </div>
            <div className="mx-1 h-4 w-px bg-border/50" />
            <Button variant="ghost" size="sm" className={cn('h-8 gap-1.5 rounded-[7px] px-2.5 text-[12px]', splitView && 'bg-foreground/[0.06] text-primary')} onClick={() => { setSplitView(v => !v); setPreviewMode(false); }}>
              <Columns className="h-3.5 w-3.5" /> Split
            </Button>
            <Button variant="ghost" size="sm" className={cn('h-8 gap-1.5 rounded-[7px] px-2.5 text-[12px]', previewMode && 'bg-foreground/[0.06] text-primary')} onClick={() => { setPreviewMode(v => !v); setSplitView(false); }}>
              <Eye className="h-3.5 w-3.5" /> Preview
            </Button>
            <Button variant="ghost" size="icon" aria-label="Focus mode" className="h-8 w-8 rounded-[7px]" onClick={() => setFullscreen(v => !v)}>
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </OfficeModuleBand>

          <div className="flex flex-1 overflow-hidden">
            {/* Folders */}
            <div className="flex w-[216px] shrink-0 flex-col border-r border-border/60 bg-black/60">
              <div className="flex items-center justify-between px-3.5 pb-1 pt-3">
                <span className={LABEL}>Folders</span>
                <Button variant="ghost" size="icon" aria-label="New folder" className="h-6 w-6 rounded-[6px]" onClick={addSection}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex-1 space-y-px overflow-y-auto px-2 pb-3">
                {sections.map((s, i) => (
                  <div key={s.id} className="group relative">
                    {editingSectionId === s.id ? (
                      <div className="px-1 py-1">
                        <Input autoFocus value={sectionNameValue} onChange={e => setSectionNameValue(e.target.value)}
                          onBlur={() => renameSection(i, sectionNameValue)}
                          onKeyDown={e => { if (e.key === 'Enter') renameSection(i, sectionNameValue); if (e.key === 'Escape') setEditingSectionId(null); }}
                          className="h-7 rounded-[7px] border-border/50 text-[12px]" />
                      </div>
                    ) : (
                      <button onClick={() => { setActiveSection(i); setActivePage(0); }}
                        className={cn('flex h-8 w-full items-center gap-2.5 rounded-[8px] px-2.5 text-left transition-colors duration-150',
                          i === activeSection ? 'bg-foreground/[0.07] text-foreground' : 'text-muted-foreground hover:bg-foreground/[0.03] hover:text-foreground')}>
                        <Folder className="h-4 w-4 shrink-0" strokeWidth={1.7} style={{ color: s.color }} />
                        <span className="min-w-0 flex-1 truncate text-[12.5px]">{s.name}</span>
                        <span className="text-[11px] tabular-nums text-muted-foreground/80">{s.pages.length}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <span role="button" tabIndex={0} aria-label="Folder actions"
                              className="flex h-5 w-5 items-center justify-center rounded-[5px] opacity-0 transition-opacity duration-150 hover:bg-foreground/[0.06] group-hover:opacity-100"
                              onClick={e => e.stopPropagation()}>
                              <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                            </span>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-40 rounded-[12px]" align="end">
                            <DropdownMenuItem onClick={() => { setEditingSectionId(s.id); setSectionNameValue(s.name); }} className="gap-2 text-xs"><Edit3 className="h-3 w-3" /> Rename</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setShowColorPicker(s.id)} className="gap-2 text-xs"><Palette className="h-3 w-3" /> Colour</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => deleteSection(i)} className="gap-2 text-xs text-destructive"><Trash2 className="h-3 w-3" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </button>
                    )}
                    {showColorPicker === s.id && (
                      <div className="absolute left-2 top-full z-30 mt-1 rounded-[12px] border border-border/50 bg-popover p-2 shadow-xl">
                        <div className="grid grid-cols-4 gap-1.5">
                          {SECTION_COLORS.map(c => (
                            <button key={c.value} aria-label={c.name} onClick={() => changeSectionColor(i, c.value)}
                              className={cn('h-6 w-6 rounded-full', s.color === c.value && 'ring-2 ring-foreground ring-offset-1 ring-offset-popover')}
                              style={{ background: c.value }} title={c.name} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Notes list */}
            <div className="flex w-[264px] shrink-0 flex-col border-r border-border/60 bg-card/70">
              <div className="flex items-center justify-between px-3.5 pb-1 pt-3">
                <span className="flex min-w-0 items-center gap-1.5">
                  {section && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: section.color }} />}
                  <span className={cn(LABEL, 'truncate normal-case text-[11.5px] tracking-normal text-foreground')}>{section?.name || 'Notes'}</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" aria-label="New from template" className="h-6 w-6 rounded-[6px]" onClick={() => setShowTemplates(true)} title="New from template">
                    <LayoutGrid className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="New note" className="h-6 w-6 rounded-[6px]" onClick={() => addPage()} title="New note">
                    <PenLine className="h-3 w-3" />
                  </Button>
                </span>
              </div>
              <div className="flex-1 space-y-px overflow-y-auto px-2 pb-3">
                {search && (
                  <p className={cn(LABEL, 'px-1.5 pb-1 pt-1')}>{searchResults.length} {searchResults.length === 1 ? 'result' : 'results'}</p>
                )}
                {search ? (
                  searchResults.map((r, i) => (
                    <button key={i} onClick={() => { setActiveSection(r.sectionIdx); setActivePage(r.pageIdx); setSearch(''); }}
                      className="w-full rounded-[8px] px-2.5 py-2 text-left transition-colors duration-150 hover:bg-foreground/[0.04]">
                      <span className="flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: r.section.color }} />
                        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{r.page.title}</span>
                      </span>
                      <span className="block truncate pl-3 text-[11px] text-muted-foreground">{r.section.name}</span>
                    </button>
                  ))
                ) : section?.pages.map((p, i) => (
                  <button key={p.id} onClick={() => setActivePage(i)}
                    className={cn('w-full rounded-[8px] px-2.5 py-2 text-left transition-colors duration-150',
                      i === activePage ? 'bg-foreground/[0.07]' : 'hover:bg-foreground/[0.03]')}>
                    <span className="flex items-center gap-1.5">
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{p.title}</span>
                      {p.starred && <Star className="h-3 w-3 shrink-0 fill-attend text-attend" />}
                      {p.locked && <LockIcon className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
                    </span>
                    <span className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{noteDate(p.updatedAt)}</span>
                      <span className="min-w-0 truncate text-[11px] text-muted-foreground/70">{snippet(p)}</span>
                    </span>
                  </button>
                ))}
                {!search && (!section || section.pages.length === 0) && (
                  <div className="px-2 pt-6 text-center">
                    <p className="text-[12.5px] font-medium">No notes here yet</p>
                    <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">Notes save to your workspace as you type.</p>
                    <Button variant="outline" size="sm" className="mt-3 h-8 gap-1.5 rounded-[8px] text-xs" onClick={() => addPage()}>
                      <PenLine className="h-3 w-3" /> New note
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Editor */}
            <div className="flex flex-1 flex-col overflow-hidden bg-card/45">
              {page ? (
                <>
                  <div className="scrollbar-none flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border/40 px-3 py-1.5">
                    <InlineTools />
                    <div className="flex-1" />
                    <span className="mr-1 hidden text-[10.5px] text-muted-foreground lg:block">{saving ? 'Saving…' : 'Saved to workspace'}</span>
                    <Button variant="ghost" size="icon" aria-label={page.starred ? 'Unstar' : 'Star'} className="h-7 w-7 rounded-[7px]" onClick={() => updatePage({ starred: !page.starred })}>
                      {page.starred ? <Star className="h-3.5 w-3.5 fill-attend text-attend" /> : <Star className="h-3.5 w-3.5 text-muted-foreground" />}
                    </Button>
                    <PageMenu />
                  </div>

                  <div className="flex-1 overflow-auto">
                    <div className={cn('mx-auto px-10 py-8', splitView ? 'flex max-w-full gap-6' : 'max-w-[720px]')}>
                      {!splitView && (
                        <>
                          <Input value={page.title} onChange={e => updatePage({ title: e.target.value })}
                            className="h-auto border-none bg-transparent p-0 font-display text-[26px] font-semibold tracking-[-0.02em] shadow-none focus-visible:ring-0"
                            placeholder="Title" disabled={page.locked} />
                          <p className="mb-6 mt-1.5 text-[11.5px] tabular-nums text-muted-foreground">
                            {page.updatedAt.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} · {wordCount} {wordCount === 1 ? 'word' : 'words'} · {readingTime} min read
                          </p>
                        </>
                      )}

                      {previewMode ? (
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>{page.content}</ReactMarkdown>
                        </div>
                      ) : splitView ? (
                        <>
                          <div className="min-w-0 flex-1">
                            <Input value={page.title} onChange={e => updatePage({ title: e.target.value })}
                              className="mb-3 h-auto border-none bg-transparent p-0 font-display text-[20px] font-semibold tracking-[-0.02em] shadow-none focus-visible:ring-0"
                              placeholder="Title" disabled={page.locked} />
                            <Textarea ref={textareaRef} value={page.content}
                              onChange={e => { pushUndo(); updatePage({ content: e.target.value }); }}
                              onKeyDown={handleKeyDown}
                              className="min-h-[600px] resize-none rounded-[12px] border border-border/40 bg-background/40 p-4 font-mono text-[13px] leading-relaxed text-foreground/90 shadow-none focus-visible:ring-1 focus-visible:ring-primary/40"
                              placeholder="Write in markdown" disabled={page.locked} />
                          </div>
                          <div className="min-w-0 flex-1 overflow-auto rounded-[12px] border border-border/40 bg-card p-5">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <ReactMarkdown>{page.content}</ReactMarkdown>
                            </div>
                          </div>
                        </>
                      ) : (
                        <Textarea ref={textareaRef} value={page.content}
                          onChange={e => { pushUndo(); updatePage({ content: e.target.value }); }}
                          onKeyDown={handleKeyDown}
                          className="min-h-[600px] resize-none border-none bg-transparent p-0 text-[15px] leading-[1.75] text-foreground/90 shadow-none focus-visible:ring-0"
                          placeholder="Start writing" disabled={page.locked} />
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <span aria-hidden className="mx-auto mb-4 block h-px w-8 bg-primary" />
                    <p className="mb-1 font-display text-[15px] font-semibold tracking-[-0.02em]">Choose a note, or start one</p>
                    <p className="mb-4 text-[12px] text-muted-foreground">Everything here saves to your workspace as you type.</p>
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-[8px] text-xs" onClick={() => addPage()}>
                        <PenLine className="h-3 w-3" /> New note
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-[8px] text-xs" onClick={() => setShowTemplates(true)}>
                        <LayoutGrid className="h-3 w-3" /> From template
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Templates */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="rounded-[14px] sm:max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-sm font-semibold"><LayoutGrid className="h-4 w-4 text-muted-foreground" /> Start from a template</DialogTitle></DialogHeader>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {PAGE_TEMPLATES.map(tmpl => (
              <button key={tmpl.name} onClick={() => { addPage(tmpl.name); if (isMobile) setMobileView('editor'); }}
                className="rounded-[12px] border border-border/40 bg-card p-4 text-left transition-colors duration-150 hover:bg-foreground/[0.03]">
                <FileText className="mb-2 h-5 w-5 text-muted-foreground" strokeWidth={1.7} />
                <p className="text-[13px] font-medium">{tmpl.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{tmpl.content.split('\n')[0].replace(/^#+\s*/, '') || 'A clean page'}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Insert image */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="rounded-[14px] sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-sm font-semibold"><Image className="h-4 w-4 text-muted-foreground" /> Insert image</DialogTitle></DialogHeader>
          <Tabs defaultValue="upload" className="mt-1">
            <TabsList className="grid h-8 w-full grid-cols-2 rounded-[8px]">
              <TabsTrigger value="upload" className="gap-1.5 rounded-[6px] text-[11px]"><Upload className="h-3 w-3" /> From computer</TabsTrigger>
              <TabsTrigger value="url" className="gap-1.5 rounded-[6px] text-[11px]"><Link2 className="h-3 w-3" /> From URL</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-3">
              <div onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-[12px] bg-foreground/[0.025] p-8 text-center transition-colors duration-150 hover:bg-foreground/[0.04]">
                <FileUp className="mx-auto mb-2 h-7 w-7 text-muted-foreground" strokeWidth={1.6} />
                <p className="text-xs font-medium">Choose an image</p>
                <p className="mt-1 text-[10.5px] text-muted-foreground">PNG, JPG, GIF, WebP, SVG</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
            </TabsContent>
            <TabsContent value="url" className="mt-3 space-y-3">
              <Input placeholder="https://example.com/image.png" className="rounded-[8px] text-xs"
                onKeyDown={e => { if (e.key === 'Enter') { insertMarkdown(`![image](${(e.target as HTMLInputElement).value})`); setShowImageDialog(false); } }} />
              <p className="text-[10.5px] text-muted-foreground">Press Enter to insert</p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Export */}
      <Dialog open={showExport} onOpenChange={setShowExport}>
        <DialogContent className="rounded-[14px] sm:max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-sm font-semibold"><Download className="h-4 w-4 text-muted-foreground" /> Export note</DialogTitle></DialogHeader>
          <div className="mt-2 space-y-2">
            <Button variant="outline" className="h-10 w-full justify-start gap-2 rounded-[10px] text-xs" onClick={() => exportPage('md')}>
              <FileText className="h-4 w-4 text-muted-foreground" /> Markdown (.md)
            </Button>
            <Button variant="outline" className="h-10 w-full justify-start gap-2 rounded-[10px] text-xs" onClick={() => exportPage('txt')}>
              <Type className="h-4 w-4 text-muted-foreground" /> Plain text (.txt)
            </Button>
            <Button variant="outline" className="h-10 w-full justify-start gap-2 rounded-[10px] text-xs" onClick={() => exportPage('html')}>
              <Code className="h-4 w-4 text-muted-foreground" /> HTML (.html)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
