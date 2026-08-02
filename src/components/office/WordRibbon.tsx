import { Editor } from '@tiptap/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { EmojiPicker } from './EmojiPicker';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, Subscript, Superscript,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, CheckSquare, Indent, Outdent,
  Heading1, Heading2, Heading3, Heading4,
  Image as ImageIcon, Table as TableIcon, Minus, Quote, Link as LinkIcon, Unlink,
  Undo2, Redo2, Type, Highlighter, Eraser,
  PlusCircle, Trash2, RowsIcon, ColumnsIcon,
  MergeIcon, SplitIcon, Search, Replace, Download, Printer,
  Copy, Scissors, ClipboardPaste,
  Code2, Pilcrow, WrapText,
  ChevronDown, Maximize2, BookOpen,
  SpellCheck, MessageSquare, Languages, FileCheck, Eye, EyeOff,
  Palette, LayoutTemplate, Upload, Link2, ImagePlus, FileUp,
  Calendar, Clock, Hash, Smile, SeparatorHorizontal,
  Ruler, ZoomIn, ZoomOut, Grid3X3, BarChart3,
  FileText, ArrowDownUp, CaseSensitive, WholeWord,
  LetterText, Space
} from 'lucide-react';

interface WordRibbonProps {
  editor: Editor;
  onExportPdf?: () => void;
  onExportTxt?: () => void;
  onExportHtml?: () => void;
  onExportMarkdown?: () => void;
  onPrint?: () => void;
  onImportMarkdown?: () => void;
  focusMode?: boolean;
  onToggleFocusMode?: () => void;
  readingMode?: boolean;
  onToggleReadingMode?: () => void;
  showRuler?: boolean;
  onToggleRuler?: () => void;
  pageColor?: string;
  onPageColorChange?: (color: string) => void;
  documentTheme?: string;
  onDocumentThemeChange?: (theme: string) => void;
  aiButton?: React.ReactNode;
}

const FONT_FAMILIES = [
  'Inter', 'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Garamond',
  'Palatino Linotype', 'Book Antiqua', 'Courier New', 'Lucida Console',
  'Verdana', 'Tahoma', 'Trebuchet MS', 'Calibri', 'Cambria', 'monospace',
  'Segoe UI', 'Roboto', 'Open Sans', 'Lato', 'Merriweather', 'Playfair Display',
  'Source Sans Pro', 'Nunito', 'Poppins', 'Raleway', 'Montserrat', 'Oswald',
];

const FONT_SIZES = ['8', '9', '10', '10.5', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '32', '36', '48', '72', '96'];

const COLORS = [
  '#000000', '#262626', '#434343', '#666666', '#808080', '#999999', '#b3b3b3', '#cccccc', '#d9d9d9', '#ffffff',
  '#c0392b', '#e74c3c', '#e67e22', '#f39c12', '#f1c40f', '#2ecc71', '#27ae60', '#3498db', '#2980b9', '#8e44ad',
  '#fadbd8', '#f5b7b1', '#fdebd0', '#fad7a0', '#fcf3cf', '#d5f5e3', '#abebc6', '#d6eaf8', '#aed6f1', '#e8daef',
  '#ff0000', '#ff4500', '#ff8c00', '#ffd700', '#00ff00', '#008000', '#00bfff', '#0000ff', '#4b0082', '#ee82ee',
];

const PAGE_COLORS = [
  { label: 'White', value: '#ffffff' },
  { label: 'Cream', value: '#fef9ef' },
  { label: 'Sepia', value: '#f5e6d0' },
  { label: 'Light Blue', value: '#f0f4f8' },
  { label: 'Lavender', value: '#f5f0ff' },
  { label: 'Rose', value: '#fdf2f8' },
  { label: 'Mint', value: '#f0fdf4' },
  { label: 'Slate', value: '#f1f5f9' },
  { label: 'Warm Gray', value: '#f5f5f4' },
  { label: 'Cool Gray', value: '#f9fafb' },
  { label: 'Parchment', value: '#faf5e4' },
  { label: 'Sky', value: '#e0f2fe' },
];

const DOCUMENT_THEMES = [
  { id: 'default', label: 'Default', headingFont: 'Inter', bodyFont: 'Inter', primaryColor: '#2563eb', colors: ['#2563eb', '#1e40af', '#3b82f6', '#60a5fa'] },
  { id: 'professional', label: 'Professional', headingFont: 'Georgia', bodyFont: 'Calibri', primaryColor: '#1e3a5f', colors: ['#1e3a5f', '#2d5986', '#4a7fb5', '#7ca8d4'] },
  { id: 'modern', label: 'Modern', headingFont: 'Helvetica', bodyFont: 'Arial', primaryColor: '#18181b', colors: ['#18181b', '#3f3f46', '#71717a', '#a1a1aa'] },
  { id: 'creative', label: 'Creative', headingFont: 'Playfair Display', bodyFont: 'Lato', primaryColor: '#7c3aed', colors: ['#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'] },
  { id: 'elegant', label: 'Elegant', headingFont: 'Merriweather', bodyFont: 'Open Sans', primaryColor: '#92400e', colors: ['#92400e', '#b45309', '#d97706', '#f59e0b'] },
  { id: 'corporate', label: 'Corporate', headingFont: 'Segoe UI', bodyFont: 'Segoe UI', primaryColor: '#0f766e', colors: ['#0f766e', '#14b8a6', '#2dd4bf', '#5eead4'] },
];

const LINE_SPACINGS = [
  { label: '1.0', value: '1' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: '2.0', value: '2' },
  { label: '2.5', value: '2.5' },
  { label: '3.0', value: '3' },
];

const STYLE_PRESETS = [
  { label: 'Title', level: 1, fontSize: '28px', fontWeight: 'bold' },
  { label: 'Subtitle', level: 2, fontSize: '20px', fontWeight: '600' },
  { label: 'Heading 1', level: 1, fontSize: '24px', fontWeight: 'bold' },
  { label: 'Heading 2', level: 2, fontSize: '18px', fontWeight: '600' },
  { label: 'Heading 3', level: 3, fontSize: '16px', fontWeight: '600' },
  { label: 'Body', level: 0, fontSize: '12px', fontWeight: 'normal' },
];

const SPECIAL_CHARACTERS = [
  { cat: 'Common', chars: ['©', '®', '™', '°', '±', '×', '÷', '•', '…', '—', '–', '¶', '§', '†', '‡', '¿', '¡'] },
  { cat: 'Currency', chars: ['$', '€', '£', '¥', '₹', '₩', '₽', '₿', '¢', '₪', '₱', '₫', '₮', '₴', '₸'] },
  { cat: 'Math', chars: ['∞', '∑', '∏', '√', '∫', '∂', 'Δ', 'π', 'θ', 'λ', 'μ', 'Ω', '≠', '≤', '≥', '≈', '∝'] },
  { cat: 'Arrows', chars: ['→', '←', '↑', '↓', '↔', '↕', '⇒', '⇐', '⇑', '⇓', '⇔', '➤', '➜', '➝', '➞'] },
  { cat: 'Greek', chars: ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'ι', 'κ', 'λ', 'μ', 'ν', 'ξ', 'ο', 'π', 'ρ', 'σ', 'τ', 'υ', 'φ', 'χ', 'ψ', 'ω'] },
  { cat: 'Emoji', chars: ['✓', '✗', '★', '☆', '♠', '♣', '♥', '♦', '♪', '♫', '☀', '☁', '☂', '⚡', '❤', '✦', '✧'] },
];

const TABS = ['Home', 'Insert', 'Format', 'Table', 'Review', 'View'] as const;

function ToolBtn({ active, onClick, children, tooltip, disabled, className: cls }: {
  active?: boolean; onClick?: () => void; children: React.ReactNode; tooltip?: string; disabled?: boolean; className?: string;
}) {
  const btn = (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-[28px] w-[28px] rounded-[6px] transition-all duration-150",
        active && "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]",
        disabled && "opacity-30 pointer-events-none",
        cls
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
  if (!tooltip) return btn;
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>{btn}</TooltipTrigger>
      <TooltipContent side="bottom" className="text-[10px] px-2 py-1 rounded-md font-medium">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-[2px] px-0.5">{children}</div>
      <span className="text-[8px] text-muted-foreground/50 font-medium uppercase tracking-widest select-none">{label}</span>
    </div>
  );
}

function ColorPicker({ colors, value, onChange, icon: Icon, tooltip }: {
  colors: string[]; value?: string; onChange: (c: string) => void; icon: React.ComponentType<any>; tooltip: string;
}) {
  const [customColor, setCustomColor] = useState('');
  return (
    <Popover>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-[28px] w-[28px] rounded-[6px] relative">
              <Icon className="h-3.5 w-3.5" />
              <div className="absolute bottom-[2px] left-[5px] right-[5px] h-[2.5px] rounded-full" style={{ backgroundColor: value || '#000' }} />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[10px] px-2 py-1 rounded-md">{tooltip}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-3 rounded-xl shadow-xl border-border/50" align="start">
        <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{tooltip}</p>
        <div className="grid grid-cols-10 gap-[3px]">
          {colors.map((c) => (
            <button
              key={c}
              className={cn(
                "h-[18px] w-[18px] rounded-[3px] border border-border/20 hover:scale-[1.3] transition-all duration-150",
                value === c && "ring-[1.5px] ring-primary ring-offset-1 ring-offset-background"
              )}
              style={{ backgroundColor: c }}
              onClick={() => onChange(c)}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <input
            type="color"
            value={customColor || value || '#000000'}
            onChange={(e) => { setCustomColor(e.target.value); onChange(e.target.value); }}
            className="h-5 w-5 rounded cursor-pointer border-0 p-0"
          />
          <span className="text-[9px] text-muted-foreground">Custom</span>
          <div className="flex-1" />
          <button
            onClick={() => onChange('')}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Eraser className="h-2.5 w-2.5" /> Remove
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TableGridPicker({ onSelect }: { onSelect: (rows: number, cols: number) => void }) {
  const [hoverR, setHoverR] = useState(0);
  const [hoverC, setHoverC] = useState(0);
  const maxR = 8, maxC = 10;
  return (
    <div className="p-3">
      <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
        {hoverR > 0 ? `${hoverR} × ${hoverC} Table` : 'Insert Table'}
      </p>
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `repeat(${maxC}, 1fr)` }}>
        {Array.from({ length: maxR * maxC }).map((_, i) => {
          const r = Math.floor(i / maxC) + 1;
          const c = (i % maxC) + 1;
          const isActive = r <= hoverR && c <= hoverC;
          return (
            <button
              key={i}
              className={cn(
                "h-[14px] w-[14px] rounded-[2px] border transition-all duration-75",
                isActive ? "bg-primary/30 border-primary/50" : "bg-secondary/50 border-border/30 hover:bg-secondary"
              )}
              onMouseEnter={() => { setHoverR(r); setHoverC(c); }}
              onMouseLeave={() => { setHoverR(0); setHoverC(0); }}
              onClick={() => onSelect(r, c)}
            />
          );
        })}
      </div>
    </div>
  );
}

// --- Image Insert Dialog ---
function ImageInsertDialog({ open, onOpenChange, onInsert }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInsert: (src: string, alt?: string) => void;
}) {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleInsert = () => {
    const src = preview || url;
    if (src) {
      onInsert(src, alt || undefined);
      setUrl('');
      setAlt('');
      setPreview(null);
      onOpenChange(false);
    }
  };

  const reset = () => { setUrl(''); setAlt(''); setPreview(null); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-primary" />
            Insert Image
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload" className="mt-1">
          <TabsList className="grid w-full grid-cols-2 h-8 rounded-lg">
            <TabsTrigger value="upload" className="text-[11px] rounded-md gap-1.5">
              <Upload className="h-3 w-3" /> From Computer
            </TabsTrigger>
            <TabsTrigger value="url" className="text-[11px] rounded-md gap-1.5">
              <Link2 className="h-3 w-3" /> From URL
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="mt-3">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200",
                dragOver ? "border-primary bg-primary/5 scale-[1.01]" : "border-border/40 hover:border-primary/40 hover:bg-muted/30",
                preview && "border-primary/30 bg-primary/5"
              )}
            >
              {preview ? (
                <div className="space-y-3">
                  <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg shadow-md" />
                  <p className="text-[10px] text-muted-foreground">Click or drag to replace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                    <FileUp className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-foreground">Drop an image here or click to browse</p>
                  <p className="text-[10px] text-muted-foreground">PNG, JPG, GIF, WebP, SVG up to 10MB</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
          </TabsContent>
          <TabsContent value="url" className="mt-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium">Image URL</Label>
              <Input
                value={url}
                onChange={(e) => { setUrl(e.target.value); setPreview(null); }}
                placeholder="https://example.com/image.png"
                className="text-xs rounded-lg"
              />
            </div>
            {url && (
              <div className="rounded-lg overflow-hidden border border-border/30 bg-muted/20 p-2">
                <img src={url} alt="Preview" className="max-h-32 mx-auto rounded-md" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
          </TabsContent>
        </Tabs>
        <div className="space-y-1.5 mt-2">
          <Label className="text-[10px] font-medium">Alt Text (optional)</Label>
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Describe the image for accessibility" className="text-xs rounded-lg" />
        </div>
        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={() => { reset(); onOpenChange(false); }} className="rounded-lg text-xs">Cancel</Button>
          <Button onClick={handleInsert} disabled={!preview && !url} className="rounded-lg text-xs gap-1.5">
            <ImageIcon className="h-3 w-3" /> Insert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Word Count Dialog ---
function WordCountDialog({ open, onOpenChange, editor }: { open: boolean; onOpenChange: (v: boolean) => void; editor: Editor }) {
  const text = editor.state.doc.textContent || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const paragraphs = editor.state.doc.content.childCount;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  const speakTime = Math.max(1, Math.ceil(words / 130));

  const stats = [
    { label: 'Words', value: words.toLocaleString(), bar: words },
    { label: 'Characters (with spaces)', value: chars.toLocaleString(), bar: chars },
    { label: 'Characters (no spaces)', value: charsNoSpaces.toLocaleString(), bar: charsNoSpaces },
    { label: 'Sentences', value: sentences.toLocaleString(), bar: sentences },
    { label: 'Paragraphs', value: paragraphs.toLocaleString(), bar: paragraphs },
    { label: 'Reading Time', value: `~${readTime} min`, bar: 0 },
    { label: 'Speaking Time', value: `~${speakTime} min`, bar: 0 },
    { label: 'Avg. Words/Sentence', value: sentences > 0 ? (words / sentences).toFixed(1) : '0', bar: 0 },
    { label: 'Avg. Word Length', value: words > 0 ? (charsNoSpaces / words).toFixed(1) + ' chars' : '0', bar: 0 },
  ];

  const maxBar = Math.max(...stats.map(s => s.bar), 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Document Statistics
          </DialogTitle>
          <DialogDescription className="text-[10px]">Detailed word count and readability metrics</DialogDescription>
        </DialogHeader>

        {/* Visual breakdown */}
        <div className="flex items-end gap-1 h-12 px-3 mt-1">
          {[
            { label: 'Words', val: words, color: 'hsl(var(--primary))' },
            { label: 'Sentences', val: sentences, color: 'hsl(var(--primary) / 0.7)' },
            { label: 'Paragraphs', val: paragraphs, color: 'hsl(var(--primary) / 0.4)' },
          ].map(b => (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-bold tabular-nums">{b.val}</span>
              <div
                className="w-full rounded-t-sm transition-all"
                style={{ height: `${Math.max(4, (b.val / maxBar) * 32)}px`, backgroundColor: b.color }}
              />
              <span className="text-[7px] text-muted-foreground">{b.label}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 mt-2">
          {stats.map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/40 transition-colors">
              <span className="text-[11px] text-muted-foreground">{label}</span>
              <span className="text-[11px] font-semibold tabular-nums">{value}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- Special Characters Dialog ---
function SpecialCharsDialog({ open, onOpenChange, onInsert }: { open: boolean; onOpenChange: (v: boolean) => void; onInsert: (char: string) => void }) {
  const [activeCategory, setActiveCategory] = useState(SPECIAL_CHARACTERS[0].cat);
  const [search, setSearch] = useState('');
  const [recentChars, setRecentChars] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('recent_special_chars') || '[]'); } catch { return []; }
  });

  const handleInsert = (char: string) => {
    onInsert(char);
    const updated = [char, ...recentChars.filter(c => c !== char)].slice(0, 12);
    setRecentChars(updated);
    try { localStorage.setItem('recent_special_chars', JSON.stringify(updated)); } catch {}
  };

  const filteredChars = search
    ? SPECIAL_CHARACTERS.flatMap(c => c.chars).filter(c => c.includes(search))
    : SPECIAL_CHARACTERS.find(c => c.cat === activeCategory)?.chars || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            Special Characters
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search characters…"
            className="text-xs rounded-lg h-8"
          />
          {!search && (
            <div className="flex gap-1 flex-wrap">
              {SPECIAL_CHARACTERS.map(c => (
                <button
                  key={c.cat}
                  onClick={() => setActiveCategory(c.cat)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] rounded-md font-medium transition-colors",
                    activeCategory === c.cat ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60"
                  )}
                >
                  {c.cat}
                </button>
              ))}
            </div>
          )}
          {recentChars.length > 0 && !search && (
            <div>
              <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Recently Used</p>
              <div className="flex gap-1 flex-wrap mb-2">
                {recentChars.map((char, i) => (
                  <button
                    key={`recent-${i}`}
                    onClick={() => handleInsert(char)}
                    className="h-7 w-7 flex items-center justify-center rounded-md text-sm hover:bg-primary/10 hover:text-primary transition-all border border-border/20 font-medium"
                  >
                    {char}
                  </button>
                ))}
              </div>
              <div className="h-px bg-border/20 mb-2" />
            </div>
          )}
          <div className="grid grid-cols-10 gap-1">
            {filteredChars.map((char, i) => (
              <button
                key={`${char}-${i}`}
                onClick={() => handleInsert(char)}
                className="h-8 w-8 flex items-center justify-center rounded-md text-sm hover:bg-primary/10 hover:text-primary transition-all border border-transparent hover:border-primary/20 font-medium"
                title={`U+${char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}`}
              >
                {char}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FindReplaceBar({ editor, findText, setFindText, replaceText, setReplaceText, onClose }: {
  editor: Editor; findText: string; setFindText: (v: string) => void; replaceText: string; setReplaceText: (v: string) => void; onClose: () => void;
}) {
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);

  const findMatches = useCallback(() => {
    if (!findText.trim()) { setMatchCount(0); setCurrentMatch(0); return []; }
    const text = editor.state.doc.textContent;
    let pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) pattern = `\\b${pattern}\\b`;
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);
    const matches: { from: number; to: number }[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      matches.push({ from: match.index, to: match.index + match[0].length });
    }
    setMatchCount(matches.length);
    return matches;
  }, [findText, editor, caseSensitive, wholeWord]);

  useEffect(() => { findMatches(); }, [findMatches]);

  const navigateMatch = (direction: 1 | -1) => {
    const matches = findMatches();
    if (matches.length === 0) return;
    const next = (currentMatch + direction + matches.length) % matches.length;
    setCurrentMatch(next);
    let offset = 0;
    let found = false;
    editor.state.doc.descendants((node, pos) => {
      if (found) return false;
      if (node.isText) {
        const nodeEnd = offset + node.text!.length;
        if (matches[next].from >= offset && matches[next].from < nodeEnd) {
          const startInDoc = pos + (matches[next].from - offset);
          const endInDoc = pos + (matches[next].to - offset);
          editor.chain().focus().setTextSelection({ from: startInDoc, to: Math.min(endInDoc, startInDoc + findText.length) }).run();
          found = true;
          return false;
        }
        offset = nodeEnd;
      }
    });
  };

  const replaceCurrent = () => {
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to);
    const isMatch = caseSensitive ? selected === findText : selected.toLowerCase() === findText.toLowerCase();
    if (isMatch) {
      editor.chain().focus().deleteSelection().insertContent(replaceText).run();
      navigateMatch(1);
    } else {
      navigateMatch(1);
    }
  };

  const replaceAll = () => {
    if (!findText.trim()) return;
    const { doc, tr } = editor.state;
    let pattern = findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) pattern = `\\b${pattern}\\b`;
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);
    let offset = 0;
    let count = 0;
    doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        let match;
        regex.lastIndex = 0;
        while ((match = regex.exec(node.text)) !== null) {
          const from = pos + match.index + offset;
          const to = from + match[0].length;
          tr.replaceWith(from, to, editor.state.schema.text(replaceText));
          offset += replaceText.length - match[0].length;
          count++;
        }
      }
    });
    if (count > 0) editor.view.dispatch(tr);
    setMatchCount(0);
    setCurrentMatch(0);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-t border-border/30 flex-wrap">
      <Search className="h-3 w-3 text-muted-foreground shrink-0" />
      <Input
        value={findText}
        onChange={(e) => setFindText(e.target.value)}
        placeholder="Find…"
        className="h-6 text-[10px] w-44 bg-background/80 rounded-md border-border/40"
        onKeyDown={(e) => e.key === 'Enter' && navigateMatch(1)}
        autoFocus
      />
      {findText && (
        <span className="text-[9px] text-muted-foreground tabular-nums min-w-[50px]">
          {matchCount > 0 ? `${currentMatch + 1} of ${matchCount}` : 'No results'}
        </span>
      )}
      <ToolBtn tooltip="Case Sensitive" active={caseSensitive} onClick={() => setCaseSensitive(!caseSensitive)} className="h-5 w-5">
        <CaseSensitive className="h-3 w-3" />
      </ToolBtn>
      <ToolBtn tooltip="Whole Word" active={wholeWord} onClick={() => setWholeWord(!wholeWord)} className="h-5 w-5">
        <WholeWord className="h-3 w-3" />
      </ToolBtn>
      <Button variant="ghost" size="sm" className="h-6 text-[9px] rounded-md px-1.5" onClick={() => navigateMatch(-1)} disabled={matchCount === 0}>↑</Button>
      <Button variant="ghost" size="sm" className="h-6 text-[9px] rounded-md px-1.5" onClick={() => navigateMatch(1)} disabled={matchCount === 0}>↓</Button>
      <div className="h-3 w-px bg-border/40" />
      <Replace className="h-3 w-3 text-muted-foreground shrink-0" />
      <Input
        value={replaceText}
        onChange={(e) => setReplaceText(e.target.value)}
        placeholder="Replace…"
        className="h-6 text-[10px] w-44 bg-background/80 rounded-md border-border/40"
        onKeyDown={(e) => e.key === 'Enter' && replaceCurrent()}
      />
      <Button variant="ghost" size="sm" className="h-6 text-[9px] rounded-md px-2" onClick={replaceCurrent} disabled={matchCount === 0}>Replace</Button>
      <Button variant="ghost" size="sm" className="h-6 text-[9px] rounded-md px-2" onClick={replaceAll} disabled={matchCount === 0}>All</Button>
      <div className="flex-1" />
      <Button variant="ghost" size="sm" className="h-6 text-[9px] rounded-md px-2" onClick={onClose}>Close</Button>
    </div>
  );
}

export function WordRibbon({ editor, onExportPdf, onExportTxt, onExportHtml, onExportMarkdown, onPrint, onImportMarkdown, focusMode, onToggleFocusMode, readingMode, onToggleReadingMode, showRuler, onToggleRuler, pageColor, onPageColorChange, documentTheme, onDocumentThemeChange, aiButton }: WordRibbonProps) {
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('Home');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showWordCount, setShowWordCount] = useState(false);
  const [showSpecialChars, setShowSpecialChars] = useState(false);

  const getCurrentFontSize = (): string => {
    const attrs = editor.getAttributes('textStyle');
    if (attrs.fontSize) return attrs.fontSize.replace('px', '');
    if (editor.isActive('heading', { level: 1 })) return '24';
    if (editor.isActive('heading', { level: 2 })) return '20';
    if (editor.isActive('heading', { level: 3 })) return '16';
    return '12';
  };

  const insertImage = (src: string, alt?: string) => {
    editor.chain().focus().setResizableImage({ src, alt: alt || '' }).run();
  };

  const insertTable = (rows = 3, cols = 3) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
  };

  const setLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl, target: '_blank' }).run();
    }
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  };

  const clearFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  };

  const applyStylePreset = (preset: typeof STYLE_PRESETS[0]) => {
    if (preset.level > 0) {
      editor.chain().focus().toggleHeading({ level: preset.level as 1 | 2 | 3 | 4 | 5 | 6 }).run();
    } else {
      editor.chain().focus().setParagraph().run();
    }
  };

  const insertDateTime = (format: 'date' | 'time' | 'both') => {
    const now = new Date();
    let text = '';
    if (format === 'date' || format === 'both') text += now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    if (format === 'both') text += ' ';
    if (format === 'time' || format === 'both') text += now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    editor.chain().focus().insertContent(text).run();
  };

  const insertPageBreak = () => {
    editor.chain().focus().setHorizontalRule().insertContent({ type: 'paragraph' }).run();
  };

  const insertSpecialChar = (char: string) => {
    editor.chain().focus().insertContent(char).run();
  };

  const sep = <Separator orientation="vertical" className="h-5 mx-1.5 bg-border/40" />;

  return (
    <TooltipProvider>
      <div className="bg-card border-b border-border/40 shrink-0">
        {/* Tab row */}
        <div className="flex items-center px-1 bg-muted/30 overflow-x-auto scrollbar-none flex-nowrap">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-3.5 py-[5px] text-[10.5px] font-semibold transition-all relative",
                activeTab === tab
                  ? "text-primary after:absolute after:bottom-0 after:left-1 after:right-1 after:h-[2px] after:bg-primary after:rounded-full"
                  : "text-muted-foreground hover:text-foreground/80"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Ribbon content */}
        <div className="flex items-start gap-1.5 px-2 py-1.5 min-h-[50px] overflow-x-auto flex-nowrap scrollbar-none">
          {activeTab === 'Home' && (
            <>
              <RibbonGroup label="Clipboard">
                <ToolBtn tooltip="Cut ⌘X" onClick={() => document.execCommand('cut')}>
                  <Scissors className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip="Copy ⌘C" onClick={() => document.execCommand('copy')}>
                  <Copy className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip="Paste ⌘V" onClick={() => document.execCommand('paste')}>
                  <ClipboardPaste className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="History">
                <ToolBtn tooltip="Undo ⌘Z" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
                  <Undo2 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip="Redo ⌘⇧Z" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
                  <Redo2 className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Font">
                <Select
                  value={editor.getAttributes('textStyle').fontFamily || 'Inter'}
                  onValueChange={(v) => {
                    editor.chain().focus().setFontFamily(v).run();
                    try {
                      const recent = JSON.parse(localStorage.getItem('recent_fonts') || '[]') as string[];
                      const updated = [v, ...recent.filter((f: string) => f !== v)].slice(0, 4);
                      localStorage.setItem('recent_fonts', JSON.stringify(updated));
                    } catch {}
                  }}
                >
                  <SelectTrigger className="h-[26px] w-[130px] text-[10px] border-border/40 rounded-[6px] bg-background/60 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg max-h-[280px]">
                    {(() => {
                      const recentFontsRaw = (() => { try { return JSON.parse(localStorage.getItem('recent_fonts') || '[]'); } catch { return []; } })() as string[];
                      const recentFonts = recentFontsRaw.filter((f: string) => FONT_FAMILIES.includes(f)).slice(0, 4);
                      const rest = FONT_FAMILIES.filter(f => !recentFonts.includes(f));
                      return (
                        <>
                          {recentFonts.length > 0 && (
                            <>
                              <div className="px-2 py-1 text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest">Recent</div>
                              {recentFonts.map((f: string) => (
                                <SelectItem key={`recent-${f}`} value={f} className="text-[10px]" style={{ fontFamily: f }}>{f}</SelectItem>
                              ))}
                              <div className="h-px bg-border/20 my-1" />
                              <div className="px-2 py-1 text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest">All Fonts</div>
                            </>
                          )}
                          {rest.map((f) => (
                            <SelectItem key={f} value={f} className="text-[10px]" style={{ fontFamily: f }}>{f}</SelectItem>
                          ))}
                        </>
                      );
                    })()}
                  </SelectContent>
                </Select>
                <Select value={getCurrentFontSize()} onValueChange={(v) => editor.chain().focus().setFontSize(`${v}px`).run()}>
                  <SelectTrigger className="h-[26px] w-[54px] text-[10px] border-border/40 rounded-[6px] bg-background/60 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg max-h-[280px]">
                    {FONT_SIZES.map((s) => (
                      <SelectItem key={s} value={s} className="text-[10px]">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <ToolBtn tooltip="Increase Font" onClick={() => {
                  const cur = parseFloat(getCurrentFontSize());
                  const idx = FONT_SIZES.findIndex(s => parseFloat(s) >= cur);
                  const next = FONT_SIZES[Math.min(idx + 1, FONT_SIZES.length - 1)];
                  editor.chain().focus().setFontSize(`${next}px`).run();
                }}>
                  <ZoomIn className="h-3 w-3" />
                </ToolBtn>
                <ToolBtn tooltip="Decrease Font" onClick={() => {
                  const cur = parseFloat(getCurrentFontSize());
                  const idx = FONT_SIZES.findIndex(s => parseFloat(s) >= cur);
                  const prev = FONT_SIZES[Math.max(idx - 1, 0)];
                  editor.chain().focus().setFontSize(`${prev}px`).run();
                }}>
                  <ZoomOut className="h-3 w-3" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} tooltip="Bold ⌘B">
                  <Bold className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} tooltip="Italic ⌘I">
                  <Italic className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} tooltip="Underline ⌘U">
                  <UnderlineIcon className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} tooltip="Strikethrough">
                  <Strikethrough className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('subscript')} onClick={() => editor.chain().focus().toggleSubscript().run()} tooltip="Subscript">
                  <Subscript className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('superscript')} onClick={() => editor.chain().focus().toggleSuperscript().run()} tooltip="Superscript">
                  <Superscript className="h-3.5 w-3.5" />
                </ToolBtn>
                <ColorPicker colors={COLORS} value={editor.getAttributes('textStyle').color} onChange={(c) => c ? editor.chain().focus().setColor(c).run() : editor.chain().focus().unsetColor().run()} icon={Type} tooltip="Text Color" />
                <ColorPicker colors={COLORS} value={editor.getAttributes('highlight').color} onChange={(c) => c ? editor.chain().focus().toggleHighlight({ color: c }).run() : editor.chain().focus().unsetHighlight().run()} icon={Highlighter} tooltip="Highlight" />
                <ToolBtn tooltip="Clear Formatting" onClick={clearFormatting}>
                  <Eraser className="h-3.5 w-3.5" />
                </ToolBtn>
                {aiButton}
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Paragraph">
                <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} tooltip="Heading 1">
                  <Heading1 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} tooltip="Heading 2">
                  <Heading2 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} tooltip="Heading 3">
                  <Heading3 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} tooltip="Align Left">
                  <AlignLeft className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} tooltip="Center">
                  <AlignCenter className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} tooltip="Right">
                  <AlignRight className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()} tooltip="Justify">
                  <AlignJustify className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Lists">
                <ToolBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} tooltip="Bullets">
                  <List className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} tooltip="Numbered">
                  <ListOrdered className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} tooltip="Checklist">
                  <CheckSquare className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip="Outdent" onClick={() => editor.chain().focus().liftListItem('listItem').run()} disabled={!editor.can().liftListItem('listItem')}>
                  <Outdent className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip="Indent" onClick={() => editor.chain().focus().sinkListItem('listItem').run()} disabled={!editor.can().sinkListItem('listItem')}>
                  <Indent className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Find">
                <ToolBtn tooltip="Find & Replace ⌘H" onClick={() => setShowFindReplace(!showFindReplace)}>
                  <Search className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
            </>
          )}

          {activeTab === 'Insert' && (
            <>
              <RibbonGroup label="Table">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-[28px] px-2.5 text-[10px] rounded-[6px] gap-1.5 font-medium">
                      <TableIcon className="h-3.5 w-3.5" /> Table <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-xl shadow-xl" align="start">
                    <TableGridPicker onSelect={(r, c) => insertTable(r, c)} />
                  </PopoverContent>
                </Popover>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Media">
                <ToolBtn onClick={() => setShowImageDialog(true)} tooltip="Insert Image">
                  <ImageIcon className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Links">
                <ToolBtn onClick={() => { setLinkUrl(editor.getAttributes('link').href || ''); setShowLinkDialog(true); }} tooltip="Insert Link ⌘K">
                  <LinkIcon className="h-3.5 w-3.5" />
                </ToolBtn>
                {editor.isActive('link') && (
                  <ToolBtn onClick={() => editor.chain().focus().unsetLink().run()} tooltip="Remove Link">
                    <Unlink className="h-3.5 w-3.5" />
                  </ToolBtn>
                )}
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Blocks">
                <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} tooltip="Horizontal Rule">
                  <Minus className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} tooltip="Block Quote">
                  <Quote className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} tooltip="Code Block">
                  <Code2 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={insertPageBreak} tooltip="Page Break">
                  <SeparatorHorizontal className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Date & Time">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-[28px] px-2 text-[10px] rounded-[6px] gap-1 font-medium">
                      <Calendar className="h-3 w-3" /> Date/Time <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-1.5 rounded-xl shadow-xl" align="start">
                    <button className="block w-full text-left px-3 py-2 text-[11px] hover:bg-accent rounded-md transition-colors font-medium flex items-center gap-2" onClick={() => insertDateTime('date')}>
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </button>
                    <button className="block w-full text-left px-3 py-2 text-[11px] hover:bg-accent rounded-md transition-colors font-medium flex items-center gap-2" onClick={() => insertDateTime('time')}>
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </button>
                    <button className="block w-full text-left px-3 py-2 text-[11px] hover:bg-accent rounded-md transition-colors font-medium flex items-center gap-2" onClick={() => insertDateTime('both')}>
                      <FileText className="h-3 w-3 text-muted-foreground" />
                      {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  </PopoverContent>
                </Popover>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Symbols">
                <ToolBtn onClick={() => setShowSpecialChars(true)} tooltip="Special Characters">
                  <Hash className="h-3.5 w-3.5" />
                </ToolBtn>
                <EmojiPicker editor={editor} />
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Import">
                <ToolBtn onClick={onImportMarkdown} tooltip="Import Markdown">
                  <FileText className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
            </>
          )}

          {activeTab === 'Format' && (
            <>
              <RibbonGroup label="Styles">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-[28px] px-2.5 text-[10px] rounded-[6px] gap-1.5 font-medium">
                      <LayoutTemplate className="h-3.5 w-3.5" /> Styles <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 rounded-xl shadow-xl" align="start">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider px-1">Quick Styles</p>
                    {STYLE_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => applyStylePreset(preset)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent/50 transition-colors flex items-center gap-2"
                      >
                        <span className="text-muted-foreground text-[9px] w-4">{preset.level > 0 ? `H${preset.level}` : 'P'}</span>
                        <span style={{ fontSize: `${Math.min(parseInt(preset.fontSize), 16)}px`, fontWeight: preset.fontWeight }}>{preset.label}</span>
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
                <ToolBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} tooltip="Title">
                  <Heading1 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} tooltip="Subtitle">
                  <Heading2 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} tooltip="Heading">
                  <Heading3 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn active={editor.isActive('heading', { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} tooltip="Subheading">
                  <Heading4 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().setParagraph().run()} tooltip="Body Text" active={!editor.isActive('heading')}>
                  <Pilcrow className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Spacing">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-[28px] px-2 text-[10px] rounded-[6px] gap-1 font-medium">
                      <ArrowDownUp className="h-3 w-3" /> Line Height <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-1 rounded-xl shadow-xl" align="start">
                    {LINE_SPACINGS.map(({ label, value }) => (
                      <button key={value} className="block w-full text-left px-3 py-1.5 text-[10px] hover:bg-accent rounded-md transition-colors font-medium" onClick={() => editor.chain().focus().setLineHeight(value).run()}>
                        {label}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Page">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-[28px] px-2 text-[10px] rounded-[6px] gap-1 font-medium">
                      <Palette className="h-3 w-3" /> Page Color <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3 rounded-xl shadow-xl" align="start">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Page Background</p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {PAGE_COLORS.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => onPageColorChange?.(c.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-1.5 rounded-lg hover:bg-accent/50 transition-all",
                            pageColor === c.value && "ring-1.5 ring-primary bg-primary/5"
                          )}
                        >
                          <div className="h-6 w-10 rounded-md border border-border/30 shadow-sm" style={{ backgroundColor: c.value }} />
                          <span className="text-[8px] text-muted-foreground">{c.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <input
                        type="color"
                        value={pageColor || '#ffffff'}
                        onChange={(e) => onPageColorChange?.(e.target.value)}
                        className="h-5 w-5 rounded cursor-pointer border-0 p-0"
                      />
                      <span className="text-[9px] text-muted-foreground">Custom Color</span>
                    </div>
                  </PopoverContent>
                </Popover>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Theme">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-[28px] px-2 text-[10px] rounded-[6px] gap-1 font-medium">
                      <LayoutTemplate className="h-3 w-3" /> Themes <ChevronDown className="h-2.5 w-2.5 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-3 rounded-xl shadow-xl" align="start">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Document Themes</p>
                    <div className="grid grid-cols-2 gap-2">
                      {DOCUMENT_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          onClick={() => onDocumentThemeChange?.(theme.id)}
                          className={cn(
                            "p-2.5 rounded-lg border transition-all text-left hover:shadow-md",
                            documentTheme === theme.id ? "border-primary bg-primary/5 shadow-sm" : "border-border/30 hover:border-primary/30"
                          )}
                        >
                          <div className="flex gap-0.5 mb-1.5">
                            {theme.colors.map((c, i) => (
                              <div key={i} className="h-2.5 flex-1 rounded-sm" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                          <p className="text-[10px] font-semibold" style={{ fontFamily: theme.headingFont }}>{theme.label}</p>
                          <p className="text-[8px] text-muted-foreground" style={{ fontFamily: theme.bodyFont }}>
                            {theme.headingFont} / {theme.bodyFont}
                          </p>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Clear">
                <ToolBtn tooltip="Clear All Formatting" onClick={clearFormatting}>
                  <Eraser className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
            </>
          )}

          {activeTab === 'Table' && (
            <>
              <RibbonGroup label="Insert">
                <ToolBtn onClick={() => insertTable()} tooltip="New Table">
                  <PlusCircle className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Rows & Columns">
                <ToolBtn onClick={() => editor.chain().focus().addColumnBefore().run()} tooltip="Column Before" disabled={!editor.can().addColumnBefore()}>
                  <ColumnsIcon className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().addColumnAfter().run()} tooltip="Column After" disabled={!editor.can().addColumnAfter()}>
                  <ColumnsIcon className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().addRowBefore().run()} tooltip="Row Above" disabled={!editor.can().addRowBefore()}>
                  <RowsIcon className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().addRowAfter().run()} tooltip="Row Below" disabled={!editor.can().addRowAfter()}>
                  <RowsIcon className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Merge">
                <ToolBtn onClick={() => editor.chain().focus().mergeCells().run()} tooltip="Merge Cells" disabled={!editor.can().mergeCells()}>
                  <MergeIcon className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().splitCell().run()} tooltip="Split Cell" disabled={!editor.can().splitCell()}>
                  <SplitIcon className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().toggleHeaderRow().run()} tooltip="Header Row" disabled={!editor.can().toggleHeaderRow()}>
                  <RowsIcon className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Delete">
                <ToolBtn onClick={() => editor.chain().focus().deleteColumn().run()} tooltip="Delete Column" disabled={!editor.can().deleteColumn()}>
                  <ColumnsIcon className="h-3.5 w-3.5 text-destructive" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().deleteRow().run()} tooltip="Delete Row" disabled={!editor.can().deleteRow()}>
                  <RowsIcon className="h-3.5 w-3.5 text-destructive" />
                </ToolBtn>
                <ToolBtn onClick={() => editor.chain().focus().deleteTable().run()} tooltip="Delete Table" disabled={!editor.can().deleteTable()}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </ToolBtn>
              </RibbonGroup>
            </>
          )}

          {activeTab === 'Review' && (
            <>
              <RibbonGroup label="Proofing">
                <ToolBtn tooltip="Spell Check">
                  <SpellCheck className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip="Word Count" onClick={() => setShowWordCount(true)}>
                  <BarChart3 className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Comments">
                <ToolBtn tooltip="New Comment">
                  <MessageSquare className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Language">
                <ToolBtn tooltip="Translate">
                  <Languages className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
            </>
          )}

          {activeTab === 'View' && (
            <>
              <RibbonGroup label="Layout">
                <ToolBtn tooltip="Focus Mode" active={focusMode} onClick={onToggleFocusMode}>
                  <Maximize2 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip="Reading View" active={readingMode} onClick={onToggleReadingMode}>
                  <BookOpen className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip={showRuler ? 'Hide Ruler' : 'Show Ruler'} active={showRuler} onClick={onToggleRuler}>
                  {showRuler ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Grid">
                <ToolBtn tooltip="Show Grid">
                  <Grid3X3 className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
              {sep}
              <RibbonGroup label="Export">
                <ToolBtn tooltip="Print ⌘P" onClick={onPrint}>
                  <Printer className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip="Export PDF" onClick={onExportPdf}>
                  <Download className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip="Export HTML" onClick={onExportHtml}>
                  <Code2 className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip="Export Markdown" onClick={onExportMarkdown}>
                  <FileText className="h-3.5 w-3.5" />
                </ToolBtn>
                <ToolBtn tooltip="Export .txt" onClick={onExportTxt}>
                  <FileText className="h-3.5 w-3.5" />
                </ToolBtn>
              </RibbonGroup>
            </>
          )}
        </div>

        {/* Find & Replace Bar */}
        {showFindReplace && (
          <FindReplaceBar
            editor={editor}
            findText={findText}
            setFindText={setFindText}
            replaceText={replaceText}
            setReplaceText={setReplaceText}
            onClose={() => setShowFindReplace(false)}
          />
        )}
      </div>

      {/* Image Insert Dialog */}
      <ImageInsertDialog open={showImageDialog} onOpenChange={setShowImageDialog} onInsert={insertImage} />

      {/* Word Count Dialog */}
      <WordCountDialog open={showWordCount} onOpenChange={setShowWordCount} editor={editor} />

      {/* Special Characters Dialog */}
      <SpecialCharsDialog open={showSpecialChars} onOpenChange={setShowSpecialChars} onInsert={insertSpecialChar} />

      {/* Link Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-md rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-primary" />
              Insert Link
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-medium">URL</Label>
              <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://example.com" className="text-xs rounded-lg" onKeyDown={(e) => e.key === 'Enter' && setLink()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowLinkDialog(false)} className="rounded-lg text-xs">Cancel</Button>
            <Button onClick={setLink} className="rounded-lg text-xs">Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
