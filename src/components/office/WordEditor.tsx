import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { ResizableImage } from './extensions/ResizableImage';
import Placeholder from '@tiptap/extension-placeholder';
import FontFamily from '@tiptap/extension-font-family';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import Typography from '@tiptap/extension-typography';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { common, createLowlight } from 'lowlight';
import { FontSize } from './extensions/FontSize';
import { LineHeight } from './extensions/LineHeight';
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { WordRibbon } from './WordRibbon';
import { WordStatusBar } from './WordStatusBar';
import { WordGoalTimer, WordGoalMini } from './WordGoalTimer';
import { VersionHistory, useVersionAutoSave } from './VersionHistory';
import { AIWritingAssistant } from './AIWritingAssistant';
import { DocumentComments } from './DocumentComments';
import { SlashCommandMenu } from './SlashCommandMenu';
import { TableOfContents } from './TableOfContents';
import { MarkdownImport } from './MarkdownImport';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, FileText, Loader2, Cloud, CloudOff, Share2, Clock,
  ChevronRight, ChevronDown, Keyboard, X, List as ListIcon,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Download, Printer, Target, History, MessageSquare, Sparkles,
  BookOpen, FileUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface WordEditorProps {
  documentId: string;
}

interface OutlineItem {
  level: number;
  text: string;
  pos: number;
}

const KEYBOARD_SHORTCUTS = [
  { keys: ['⌘', 'B'], action: 'Bold' },
  { keys: ['⌘', 'I'], action: 'Italic' },
  { keys: ['⌘', 'U'], action: 'Underline' },
  { keys: ['⌘', 'S'], action: 'Save' },
  { keys: ['⌘', 'Z'], action: 'Undo' },
  { keys: ['⌘', '⇧', 'Z'], action: 'Redo' },
  { keys: ['⌘', 'K'], action: 'Insert Link' },
  { keys: ['⌘', 'H'], action: 'Find & Replace' },
  { keys: ['⌘', '⇧', '7'], action: 'Ordered List' },
  { keys: ['⌘', '⇧', '8'], action: 'Bullet List' },
  { keys: ['⌘', '⇧', '9'], action: 'Block Quote' },
  { keys: ['⌘', 'E'], action: 'Code' },
  { keys: ['Esc'], action: 'Exit Focus/Reading Mode' },
];

export function WordEditor({ documentId }: WordEditorProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('Untitled Document');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [pageCount, setPageCount] = useState(1);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [showRuler, setShowRuler] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showOutline, setShowOutline] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [cursorLine, setCursorLine] = useState(1);
  const [cursorCol, setCursorCol] = useState(1);
  const [selectionLength, setSelectionLength] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const lastSavedContentRef = useRef<string>('');
  const saveCountRef = useRef(0);
  const [saveCount, setSaveCount] = useState(0);
  const [pageColor, setPageColor] = useState('#ffffff');
  const [documentTheme, setDocumentTheme] = useState('default');

  // New feature states
  const [showGoalTimer, setShowGoalTimer] = useState(false);
  const [wordGoal, setWordGoal] = useState(500);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [showMarkdownImport, setShowMarkdownImport] = useState(false);

  // Cached content for instant startup
  const cachedContentRef = useRef<any>(null);

  // Lowlight instance for syntax highlighting
  const lowlight = useMemo(() => createLowlight(common), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        HTMLAttributes: {
          class: 'not-prose rounded-lg bg-[hsl(var(--secondary))] border border-[hsl(var(--border))]/40 p-4 text-[13px] font-mono overflow-x-auto',
        },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
      FontFamily,
      Subscript,
      Superscript,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {},
      }),
      Placeholder.configure({ placeholder: 'Type / for commands, or start writing…' }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false, autolink: true, HTMLAttributes: { class: 'text-blue-500 underline cursor-pointer hover:text-blue-600' } }),
      CharacterCount,
      Typography,
      FontSize,
      LineHeight,
    ],
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none',
          'min-h-[600px] sm:min-h-[1056px] px-4 sm:px-[96px] py-8 sm:py-[72px]',
          '[&_*]:text-inherit',
          'prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline',
          'prose-blockquote:border-l-primary/30 prose-blockquote:text-muted-foreground prose-blockquote:italic',
          'prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px] prose-code:font-mono',
          'prose-pre:bg-secondary prose-pre:rounded-lg prose-pre:border prose-pre:border-border/40',
          'prose-table:border-collapse',
          'prose-th:bg-muted/60 prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold',
          'prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2 prose-td:text-sm',
          'prose-img:rounded-xl prose-img:shadow-lg prose-img:mx-auto',
          'prose-hr:border-border/40',
          'prose-li:marker:text-muted-foreground',
        ),
      },
      handleKeyDown: (view, event) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 's') {
          event.preventDefault();
          handleManualSave();
          return true;
        }
        if (event.key === 'Escape' && (focusMode || readingMode)) {
          setFocusMode(false);
          setReadingMode(false);
          return true;
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
          event.preventDefault();
          Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string') {
                  editor?.chain().focus().setResizableImage({ src: result }).run();
                }
              };
              reader.readAsDataURL(file);
            }
          });
          return true;
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const result = e.target?.result;
                  if (typeof result === 'string') {
                    editor?.chain().focus().setResizableImage({ src: result }).run();
                  }
                };
                reader.readAsDataURL(file);
              }
              return true;
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      debouncedSave(editor.getJSON());
      updatePageCount();
      updateOutline();
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      setSelectionLength(to - from);
      const resolved = editor.state.doc.resolve(from);
      setCursorLine(resolved.depth > 0 ? resolved.index(0) + 1 : 1);
      const parentOffset = from - resolved.start(resolved.depth);
      setCursorCol(parentOffset + 1);
    },
  });

  // Version auto-save hook
  useVersionAutoSave(documentId, editor, saveCount);

  const updatePageCount = useCallback(() => {
    const contentHeight = editorContainerRef.current?.querySelector('.ProseMirror')?.scrollHeight || 0;
    setPageCount(Math.max(1, Math.ceil(contentHeight / 1056)));
  }, []);

  const updateOutline = useCallback(() => {
    if (!editor) return;
    const items: OutlineItem[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        items.push({
          level: node.attrs.level,
          text: node.textContent || 'Untitled',
          pos,
        });
      }
    });
    setOutline(items);
  }, [editor]);

  // Load document with instant startup from cache
  useEffect(() => {
    if (!documentId || !user) return;

    // Try loading from sessionStorage cache for instant startup
    const cacheKey = `doc_cache_${documentId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached && editor) {
      try {
        const parsed = JSON.parse(cached);
        editor.commands.setContent(parsed.content);
        setTitle(parsed.title || 'Untitled Document');
        setIsLoading(false);
      } catch {}
    }

    const load = async () => {
      if (!cached) setIsLoading(true);
      const { data, error } = await supabase
        .from('office_documents')
        .select('*')
        .eq('id', documentId)
        .single();
      if (error) {
        toast.error('Failed to load document');
        setIsLoading(false);
        return;
      }
      if (data) {
        setTitle(data.title);
        if (data.content && typeof data.content === 'object' && Object.keys(data.content).length > 0) {
          editor?.commands.setContent(data.content);
          lastSavedContentRef.current = JSON.stringify(data.content);
          // Cache for instant startup next time
          sessionStorage.setItem(cacheKey, JSON.stringify({ content: data.content, title: data.title }));
        }
        setLastSavedAt(new Date(data.updated_at));
      }
      setIsLoading(false);
      setTimeout(() => updateOutline(), 100);
    };
    if (editor) load();
  }, [documentId, user, editor]);

  // Diff-based save - only saves if content actually changed
  const saveToDb = useCallback(async (content: any) => {
    if (!documentId || !user) return;
    const contentStr = JSON.stringify(content);
    if (contentStr === lastSavedContentRef.current) {
      setSaveStatus('saved');
      return;
    }
    setSaveStatus('saving');
    try {
      const text = editor?.state.doc.textContent || '';
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const { error } = await supabase
        .from('office_documents')
        .update({
          content,
          title,
          word_count: words,
          last_edited_by: user.id,
        })
        .eq('id', documentId);
      if (error) throw error;
      lastSavedContentRef.current = contentStr;
      setSaveStatus('saved');
      setLastSavedAt(new Date());
      saveCountRef.current += 1;
      setSaveCount(prev => prev + 1);
      // Update cache
      sessionStorage.setItem(`doc_cache_${documentId}`, JSON.stringify({ content, title }));
    } catch {
      setSaveStatus('error');
      toast.error('Failed to save — retrying…');
      setTimeout(() => saveToDb(content), 3000);
    }
  }, [documentId, user, title, editor]);

  // Reduced debounce for faster auto-save (500ms instead of 800ms)
  const debouncedSave = useCallback((content: any) => {
    setSaveStatus('idle');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveToDb(content), 500);
  }, [saveToDb]);

  const handleTitleBlur = async () => {
    setIsEditingTitle(false);
    if (!documentId) return;
    await supabase.from('office_documents').update({ title }).eq('id', documentId);
  };

  const handleManualSave = useCallback(() => {
    if (editor) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveToDb(editor.getJSON());
    }
  }, [editor, saveToDb]);

  const handlePrint = () => setShowPrintPreview(true);

  const executePrint = useCallback(() => {
    const printContent = editor?.getHTML() || '';
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print');
      return;
    }
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>
      body { font-family: 'Inter', -apple-system, sans-serif; padding: 48px 64px; color: #1a1a1a; line-height: 1.6; max-width: 800px; margin: 0 auto; }
      h1 { font-size: 24px; margin-bottom: 16px; } h2 { font-size: 20px; } h3 { font-size: 16px; }
      table { border-collapse: collapse; width: 100%; margin: 16px 0; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      img { max-width: 100%; height: auto; } blockquote { border-left: 3px solid #ccc; padding-left: 16px; color: #555; }
      @media print { body { padding: 0; } }
    </style></head><body>${printContent}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
    setShowPrintPreview(false);
  }, [editor, title]);

  const navigateToHeading = useCallback((pos: number) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos).run();
    const domAtPos = editor.view.domAtPos(pos);
    if (domAtPos.node instanceof HTMLElement) {
      domAtPos.node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (domAtPos.node.parentElement) {
      domAtPos.node.parentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [editor]);

  const handleExportPdf = useCallback(() => {
    if (!editor) return;
    const htmlContent = editor.getHTML();
    
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.cssText = `position: absolute; left: -9999px; top: 0; width: 500px; font-family: Helvetica, Arial, sans-serif; font-size: 11pt; line-height: 1.6; color: #000;`;
      document.body.appendChild(container);
      
      const margin = { top: 72, left: 72, right: 72, bottom: 72 };
      const pageWidth = 612 - margin.left - margin.right;
      const pageHeight = 792 - margin.top - margin.bottom;
      let y = margin.top;
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text(title, margin.left, y);
      y += 32;
      
      const processNode = (node: ChildNode) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (!text) return;
          const parent = node.parentElement;
          const style = parent ? window.getComputedStyle(parent) : null;
          const fontSize = style ? parseFloat(style.fontSize) * 0.75 : 11;
          const isBold = style?.fontWeight === 'bold' || parseInt(style?.fontWeight || '400') >= 700;
          const isItalic = style?.fontStyle === 'italic';
          const color = style?.color;
          doc.setFontSize(Math.min(fontSize, 24));
          doc.setFont('helvetica', isBold && isItalic ? 'bolditalic' : isBold ? 'bold' : isItalic ? 'italic' : 'normal');
          if (color) {
            const rgb = color.match(/\d+/g);
            if (rgb && rgb.length >= 3) doc.setTextColor(parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2]));
          } else doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(text, pageWidth);
          const lineHeight = fontSize * 1.4;
          for (const line of lines) {
            if (y + lineHeight > pageHeight + margin.top) { doc.addPage(); y = margin.top; }
            doc.text(line, margin.left, y);
            y += lineHeight;
          }
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (/^h[1-6]$/.test(tag)) {
          const level = parseInt(tag[1]);
          const hSize = [20, 17, 15, 13, 12, 11][level - 1];
          y += 8;
          if (y + hSize * 1.4 > pageHeight + margin.top) { doc.addPage(); y = margin.top; }
          doc.setFontSize(hSize); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(el.textContent || '', pageWidth);
          for (const line of lines) { doc.text(line, margin.left, y); y += hSize * 1.4; }
          y += 4; doc.setFontSize(11); doc.setFont('helvetica', 'normal');
          return;
        }
        if (tag === 'p') { el.childNodes.forEach(processNode); y += 8; return; }
        if (tag === 'li') {
          const listParent = el.parentElement?.tagName.toLowerCase();
          const bullet = listParent === 'ol' ? `${Array.from(el.parentElement!.children).indexOf(el) + 1}. ` : '• ';
          doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(bullet + (el.textContent || ''), pageWidth - 20);
          for (const line of lines) { if (y + 15.4 > pageHeight + margin.top) { doc.addPage(); y = margin.top; } doc.text(line, margin.left + 20, y); y += 15.4; }
          return;
        }
        if (tag === 'blockquote') {
          doc.setTextColor(100, 100, 100); doc.setFont('helvetica', 'italic');
          el.childNodes.forEach(child => {
            if (child.textContent?.trim()) {
              const lines = doc.splitTextToSize(child.textContent.trim(), pageWidth - 40);
              for (const line of lines) { if (y + 15.4 > pageHeight + margin.top) { doc.addPage(); y = margin.top; } doc.text(line, margin.left + 20, y); y += 15.4; }
            }
          });
          doc.setTextColor(0, 0, 0); doc.setFont('helvetica', 'normal'); y += 6;
          return;
        }
        if (tag === 'hr') { y += 10; doc.setDrawColor(200, 200, 200); doc.line(margin.left, y, margin.left + pageWidth, y); y += 10; return; }
        if (tag === 'table') {
          const rows: string[][] = [];
          el.querySelectorAll('tr').forEach(tr => {
            const cells: string[] = [];
            tr.querySelectorAll('th, td').forEach(cell => cells.push(cell.textContent?.trim() || ''));
            rows.push(cells);
          });
          if (rows.length > 0) {
            const colCount = Math.max(...rows.map(r => r.length));
            const colWidth = pageWidth / colCount;
            rows.forEach((row, ri) => {
              if (y + 18 > pageHeight + margin.top) { doc.addPage(); y = margin.top; }
              row.forEach((cell, ci) => {
                const x = margin.left + ci * colWidth;
                doc.setDrawColor(180, 180, 180); doc.rect(x, y - 12, colWidth, 18);
                if (ri === 0) { doc.setFillColor(240, 240, 240); doc.rect(x, y - 12, colWidth, 18, 'F'); doc.setFont('helvetica', 'bold'); } else doc.setFont('helvetica', 'normal');
                doc.setFontSize(9); doc.setTextColor(0, 0, 0); doc.text(cell, x + 4, y);
              });
              y += 18;
            });
            y += 8;
          }
          return;
        }
        el.childNodes.forEach(processNode);
      };
      
      container.childNodes.forEach(processNode);
      document.body.removeChild(container);
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i); doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 150, 150);
        doc.text(`${i} / ${totalPages}`, 306, 780, { align: 'center' });
      }
      doc.save(`${title}.pdf`);
      toast.success('PDF exported successfully');
    }).catch(() => toast.error('Failed to export PDF'));
  }, [editor, title]);

  const handleExportTxt = useCallback(() => {
    if (!editor) return;
    const text = editor.state.doc.textContent || '';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${title}.txt`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Text file exported successfully');
  }, [editor, title]);

  const handleExportHtml = useCallback(() => {
    if (!editor) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>
      body { font-family: 'Inter', -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1a1a1a; line-height: 1.6; }
      h1 { font-size: 28px; } h2 { font-size: 22px; } h3 { font-size: 18px; }
      table { border-collapse: collapse; width: 100%; margin: 16px 0; } th, td { border: 1px solid #ddd; padding: 8px; }
      th { background: #f5f5f5; font-weight: 600; } img { max-width: 100%; } blockquote { border-left: 3px solid #ccc; padding-left: 16px; color: #555; }
      code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    </style></head><body>${editor.getHTML()}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${title}.html`; a.click();
    URL.revokeObjectURL(url); toast.success('HTML file exported');
  }, [editor, title]);

  const handleExportMarkdown = useCallback(() => {
    if (!editor) return;
    const html = editor.getHTML();
    let md = html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<u[^>]*>(.*?)<\/u>/gi, '$1')
      .replace(/<s[^>]*>(.*?)<\/s>/gi, '~~$1~~')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, '> $1\n\n')
      .replace(/<hr\s*\/?>/gi, '---\n\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\n{3,}/g, '\n\n').trim();
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${title}.md`; a.click();
    URL.revokeObjectURL(url); toast.success('Markdown file exported');
  }, [editor, title]);

  const handleExportDocx = useCallback(async () => {
    if (!editor) return;
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
      const html = editor.getHTML();
      const container = document.createElement('div');
      container.innerHTML = html;
      
      const children: any[] = [];
      const processElement = (el: Element) => {
        const tag = el.tagName.toLowerCase();
        const text = el.textContent || '';
        if (/^h([1-6])$/.test(tag)) {
          const level = parseInt(tag[1]);
          const headingMap: Record<number, any> = {
            1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3,
          };
          children.push(new Paragraph({ heading: headingMap[level] || HeadingLevel.HEADING_1, children: [new TextRun({ text, bold: true })] }));
        } else if (tag === 'p') {
          const runs: any[] = [];
          el.childNodes.forEach(child => {
            if (child.nodeType === Node.TEXT_NODE) {
              runs.push(new TextRun(child.textContent || ''));
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const ce = child as Element;
              const ct = ce.tagName.toLowerCase();
              runs.push(new TextRun({
                text: ce.textContent || '',
                bold: ct === 'strong' || ct === 'b',
                italics: ct === 'em' || ct === 'i',
                underline: ct === 'u' ? {} : undefined,
                strike: ct === 's',
              }));
            }
          });
          children.push(new Paragraph({ children: runs.length > 0 ? runs : [new TextRun('')] }));
        } else if (tag === 'li') {
          children.push(new Paragraph({ children: [new TextRun(text)] }));
        } else if (tag === 'blockquote') {
          children.push(new Paragraph({ children: [new TextRun({ text, italics: true })] }));
        } else {
          el.querySelectorAll(':scope > *').forEach(processElement);
        }
      };
      container.querySelectorAll(':scope > *').forEach(processElement);
      if (children.length === 0) children.push(new Paragraph({ children: [new TextRun('')] }));
      
      const doc = new Document({ sections: [{ children }] });
      const buffer = await Packer.toBlob(doc);
      const url = URL.createObjectURL(buffer);
      const a = document.createElement('a'); a.href = url; a.download = `${title}.docx`; a.click();
      URL.revokeObjectURL(url);
      toast.success('Word document exported');
    } catch (err) {
      toast.error('Failed to export DOCX');
    }
  }, [editor, title]);

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;

  // Readability score (simplified Flesch-Kincaid)
  const readabilityGrade = useMemo(() => {
    if (!editor || wordCount < 30) return null;
    const text = editor.getText();
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;
    const words = wordCount || 1;
    const syllables = text.split(/\s+/).reduce((acc, word) => {
      const w = word.toLowerCase().replace(/[^a-z]/g, '');
      if (!w) return acc;
      let count = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g)?.length || 1;
      return acc + Math.max(1, count);
    }, 0);
    const grade = 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
    return Math.max(0, Math.min(18, Math.round(grade * 10) / 10));
  }, [editor, wordCount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showShortcuts) setShowShortcuts(false);
        else if (focusMode || readingMode) { setFocusMode(false); setReadingMode(false); }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') { e.preventDefault(); setShowShortcuts(prev => !prev); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusMode, readingMode, showShortcuts]);

  if (!editor) return null;

  const showTitleBar = !focusMode;
  const showRibbon = !focusMode && !readingMode;

  const headingIcons: Record<number, typeof Heading1> = {
    1: Heading1, 2: Heading2, 3: Heading3, 4: Heading4, 5: Heading5, 6: Heading6,
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-background"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading document…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title Bar */}
      {showTitleBar && (
        <div className="shrink-0">
          <div className="flex items-center gap-2 px-3 h-10 bg-card/80 backdrop-blur-sm border-b border-border/30 select-none">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-secondary/80" onClick={() => navigate('/lounge/office/word-home')}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="h-6 w-6 rounded-[7px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-sm">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            {isEditingTitle ? (
              <Input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()} autoFocus className="h-6 text-[12px] font-medium w-64 rounded-md bg-secondary/60 border-border/40" />
            ) : (
              <button onClick={() => setIsEditingTitle(true)} className="text-[12px] font-semibold text-foreground hover:bg-secondary/60 transition-colors truncate max-w-sm px-1.5 py-0.5 rounded-md">
                {title}
              </button>
            )}
            <div className="flex-1" />

            {/* Save status */}
            <div className={cn(
              "flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-all duration-300",
              saveStatus === 'saving' && "text-muted-foreground bg-muted/50",
              saveStatus === 'saved' && "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
              saveStatus === 'error' && "text-destructive bg-destructive/10",
              saveStatus === 'idle' && "text-transparent",
            )}>
              {saveStatus === 'saving' && <><Loader2 className="h-2.5 w-2.5 animate-spin" /> Saving…</>}
              {saveStatus === 'saved' && <><Cloud className="h-2.5 w-2.5" /> Saved</>}
              {saveStatus === 'error' && <><CloudOff className="h-2.5 w-2.5" /> Error</>}
            </div>

            {lastSavedAt && saveStatus !== 'saving' && (
              <span className="hidden sm:flex text-[9px] text-muted-foreground/60 items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {formatDistanceToNow(lastSavedAt, { addSuffix: true })}
              </span>
            )}

            {/* New feature buttons */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={() => setShowGoalTimer(true)}>
                  <Target className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Writing Goals</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={() => setShowVersionHistory(true)}>
                  <History className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Version History</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-6 w-6 rounded-lg", showComments && "bg-primary/10 text-primary")} onClick={() => setShowComments(!showComments)}>
                  <MessageSquare className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Comments</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className={cn("h-6 w-6 rounded-lg", showToc && "bg-primary/10 text-primary")} onClick={() => setShowToc(!showToc)}>
                  <BookOpen className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Table of Contents</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg" onClick={() => setShowOutline(prev => !prev)}>
                  <ListIcon className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Document Outline</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden sm:inline-flex h-6 w-6 rounded-lg" onClick={() => setShowShortcuts(prev => !prev)}>
                  <Keyboard className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-[10px]">Shortcuts ⌘/</TooltipContent>
            </Tooltip>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] rounded-lg px-2">
                  <Download className="h-3 w-3" /> Export
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-1 rounded-xl">
                <button onClick={handleExportPdf} className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors text-foreground">
                  <Download className="h-3.5 w-3.5 text-red-500" /> PDF (with formatting)
                </button>
                <button onClick={handleExportHtml} className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors text-foreground">
                  <FileText className="h-3.5 w-3.5 text-orange-500" /> HTML
                </button>
                <button onClick={handleExportMarkdown} className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors text-foreground">
                  <FileText className="h-3.5 w-3.5 text-blue-500" /> Markdown (.md)
                </button>
                <button onClick={handleExportDocx} className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors text-foreground">
                  <FileText className="h-3.5 w-3.5 text-indigo-500" /> Word (.docx)
                </button>
                <button onClick={handleExportTxt} className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors text-foreground">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Plain Text (.txt)
                </button>
                <div className="h-px bg-border/30 my-0.5" />
                <button onClick={() => setShowMarkdownImport(true)} className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors text-foreground">
                  <FileUp className="h-3.5 w-3.5 text-emerald-500" /> Import Markdown
                </button>
                <div className="h-px bg-border/30 my-0.5" />
                <button onClick={handlePrint} className="flex items-center gap-2 w-full px-3 py-2 text-xs rounded-lg hover:bg-muted transition-colors text-foreground">
                  <Printer className="h-3.5 w-3.5 text-muted-foreground" /> Print
                </button>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="sm" className="h-6 gap-1 text-[10px] rounded-lg px-2" onClick={handleManualSave}>
              <Cloud className="h-3 w-3" /> Save
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg">
              <Share2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Ribbon with AI button */}
      {showRibbon && (
        <div className="shrink-0">
          <WordRibbon
            editor={editor}
            onPrint={handlePrint}
            onExportPdf={handleExportPdf}
            onExportTxt={handleExportTxt}
            onExportHtml={handleExportHtml}
            onExportMarkdown={handleExportMarkdown}
            onImportMarkdown={() => setShowMarkdownImport(true)}
            focusMode={focusMode}
            onToggleFocusMode={() => setFocusMode(!focusMode)}
            readingMode={readingMode}
            onToggleReadingMode={() => setReadingMode(!readingMode)}
            showRuler={showRuler}
            onToggleRuler={() => setShowRuler(!showRuler)}
            pageColor={pageColor}
            onPageColorChange={setPageColor}
            documentTheme={documentTheme}
            onDocumentThemeChange={setDocumentTheme}
            aiButton={<AIWritingAssistant editor={editor} />}
          />
        </div>
      )}

      {/* Ruler */}
      {showRuler && !focusMode && !readingMode && (
        <div className="shrink-0 bg-card/50 border-b border-border/20" style={{ height: 20 }}>
          <div className="flex justify-center h-5">
            <div className="relative" style={{ width: `${816 * (zoom / 100)}px` }}>
              <div className="absolute inset-0 flex items-end">
                {Array.from({ length: 33 }).map((_, i) => {
                  const isMajor = i % 4 === 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className={cn("bg-border/60", isMajor ? "h-2 w-px" : "h-1 w-px")} />
                      {isMajor && <span className="text-[6px] text-muted-foreground/40 leading-none mt-0.5">{i / 4}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Focus mode escape hint */}
      {(focusMode || readingMode) && (
        <div className="absolute top-2 right-2 z-50">
          <Button variant="secondary" size="sm" className="h-6 text-[9px] rounded-lg shadow-lg bg-card/90 backdrop-blur-sm border border-border/40" onClick={() => { setFocusMode(false); setReadingMode(false); }}>
            Exit {focusMode ? 'Focus' : 'Reading'} Mode — Esc
          </Button>
        </div>
      )}

      {/* Main area with panels */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Document Outline Panel */}
        <AnimatePresence>
          {showOutline && !focusMode && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="shrink-0 border-r border-border/30 bg-card/50 overflow-hidden"
            >
              <div className="p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Outline</h3>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md" onClick={() => setShowOutline(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  {outline.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground/50 italic">Add headings to see outline</p>
                  ) : (
                    <div className="space-y-0.5">
                      {outline.map((item, i) => {
                        const Icon = headingIcons[item.level] || Heading1;
                        return (
                          <button
                            key={i}
                            onClick={() => navigateToHeading(item.pos)}
                            className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors group flex items-center gap-1.5"
                            style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
                          >
                            <Icon className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                            <span className={cn(
                              "truncate",
                              item.level === 1 && "text-[11px] font-semibold text-foreground",
                              item.level === 2 && "text-[10px] font-medium text-foreground/80",
                              item.level >= 3 && "text-[9px] text-muted-foreground",
                            )}>
                              {item.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Editor Canvas */}
        <div
          className={cn("flex-1 overflow-auto transition-colors duration-500 relative", focusMode ? "bg-background" : "bg-muted/20")}
          ref={editorContainerRef}
        >
          {/* Slash Command Menu */}
          {editor && <SlashCommandMenu editor={editor} />}

          <div className={cn("flex justify-start sm:justify-center pb-20", focusMode ? "py-12" : "py-6")}>
            <div
              className={cn(
                "transition-all duration-300",
                focusMode
                  ? "shadow-none border-none rounded-none"
                  : "shadow-[0_1px_4px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)] border border-border/20 rounded-sm hover:shadow-[0_1px_4px_rgba(0,0,0,0.06),0_12px_32px_rgba(0,0,0,0.06)]",
                readingMode && "pointer-events-none select-text"
              )}
              style={{
                width: `${816}px`,
                minHeight: `${1056}px`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                backgroundColor: pageColor || '#ffffff',
              }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Comments Panel */}
        {/* Comments Panel */}
        <AnimatePresence>
          {showComments && !focusMode && (
            <DocumentComments
              documentId={documentId}
              editor={editor}
              show={showComments}
              onClose={() => setShowComments(false)}
            />
          )}
        </AnimatePresence>

        {/* Table of Contents Panel */}
        {editor && !focusMode && (
          <TableOfContents
            editor={editor}
            show={showToc}
            onClose={() => setShowToc(false)}
          />
        )}
      </div>

      {/* Status Bar with word goal mini */}
      {!focusMode && (
        <div className="flex items-center justify-between px-3 h-6 bg-card/80 backdrop-blur-sm border-t border-border/30 text-[9px] text-muted-foreground/70 shrink-0 select-none font-medium">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1">
              <FileText className="h-2.5 w-2.5" />
              <span className="tabular-nums">Page {pageCount} of {pageCount}</span>
            </div>
            <div className="h-2.5 w-px bg-border/30" />
            <span className="tabular-nums">{wordCount.toLocaleString()} words</span>
            <div className="h-2.5 w-px bg-border/30" />
            <span className="tabular-nums">{charCount.toLocaleString()} chars</span>
            <div className="h-2.5 w-px bg-border/30" />
            <WordGoalMini wordCount={wordCount} goal={wordGoal} onClick={() => setShowGoalTimer(true)} />
            {readabilityGrade !== null && (
              <>
                <div className="h-2.5 w-px bg-border/30" />
                <div className="flex items-center gap-0.5" title={`Flesch-Kincaid Grade Level: ${readabilityGrade}`}>
                  <span className={cn(
                    "text-[8px] font-bold tabular-nums px-1 py-px rounded",
                    readabilityGrade <= 8 ? "text-emerald-500 bg-emerald-500/10" :
                    readabilityGrade <= 12 ? "text-amber-500 bg-amber-500/10" :
                    "text-red-400 bg-red-400/10"
                  )}>
                    Grade {readabilityGrade}
                  </span>
                </div>
              </>
            )}
            <div className="h-2.5 w-px bg-border/30" />
            <span className="tabular-nums">Ln {cursorLine}, Col {cursorCol}</span>
            {selectionLength > 0 && (
              <>
                <div className="h-2.5 w-px bg-border/30" />
                <div className="flex items-center gap-0.5 text-primary/70">
                  <span className="tabular-nums">{selectionLength} selected</span>
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-4 w-4 rounded-sm" onClick={() => setZoom(Math.max(25, zoom - 10))}>
              <span className="text-[8px]">−</span>
            </Button>
            <span className="min-w-[28px] text-center tabular-nums">{zoom}%</span>
            <Button variant="ghost" size="icon" className="h-4 w-4 rounded-sm" onClick={() => setZoom(Math.min(200, zoom + 10))}>
              <span className="text-[8px]">+</span>
            </Button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Panel */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-12 right-4 z-50 w-64 bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Keyboard Shortcuts</h3>
              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md" onClick={() => setShowShortcuts(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <ScrollArea className="max-h-72">
              <div className="p-2 space-y-0.5">
                {KEYBOARD_SHORTCUTS.map((s, i) => (
                  <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-accent/30">
                    <span className="text-[10px] text-foreground/80">{s.action}</span>
                    <div className="flex items-center gap-0.5">
                      {s.keys.map((key, ki) => (
                        <kbd key={ki} className="h-5 min-w-[20px] px-1 flex items-center justify-center rounded-md bg-secondary/80 border border-border/40 text-[9px] font-mono text-muted-foreground">
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onOpenChange={setShowPrintPreview}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Printer className="h-4 w-4 text-primary" />
              Print Preview — {title}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 max-h-[60vh] border border-border/30 rounded-lg bg-white dark:bg-white">
            <div className="p-12 prose prose-sm max-w-none text-black" dangerouslySetInnerHTML={{ __html: editor?.getHTML() || '' }} />
          </ScrollArea>
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setShowPrintPreview(false)} className="text-xs rounded-lg">Cancel</Button>
            <Button onClick={executePrint} className="text-xs rounded-lg gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Word Goal Timer Dialog */}
      <WordGoalTimer wordCount={wordCount} open={showGoalTimer} onOpenChange={setShowGoalTimer} />

      {/* Version History Dialog */}
      <VersionHistory documentId={documentId} editor={editor} open={showVersionHistory} onOpenChange={setShowVersionHistory} />

      {/* Markdown Import Dialog */}
      {editor && <MarkdownImport editor={editor} open={showMarkdownImport} onOpenChange={setShowMarkdownImport} />}
    </div>
  );
}
