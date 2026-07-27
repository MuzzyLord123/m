import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileCheck, Download, Plus, Trash2, GripVertical, MoveUp, MoveDown, Eye, Edit3, Type, List, Table, Minus, Square, Columns, AlertCircle, BookOpen, ChevronDown, FolderInput, ImageIcon, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { PDFBlock, PDFTemplate, PDF_TEMPLATES } from '@/components/pdf/pdfTemplates';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SaveToFilesDialog } from '@/components/files/SaveToFilesDialog';
import { useSaveToFiles } from '@/components/files/useSaveToFiles';

let _uid = 0;
const uid = () => `blk-${Date.now()}-${++_uid}`;

const BLOCK_TYPES: { type: PDFBlock['type']; label: string; icon: any }[] = [
  { type: 'title', label: 'Title', icon: Type },
  { type: 'heading', label: 'Heading', icon: Type },
  { type: 'subtitle', label: 'Subtitle', icon: Type },
  { type: 'paragraph', label: 'Paragraph', icon: Type },
  { type: 'list', label: 'Bullet List', icon: List },
  { type: 'table', label: 'Table', icon: Table },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'menu-item', label: 'Menu Item', icon: Type },
  { type: 'menu-item-image', label: 'Menu Item + Photo', icon: UtensilsCrossed },
  { type: 'step', label: 'Step', icon: BookOpen },
  { type: 'callout', label: 'Callout Box', icon: AlertCircle },
  { type: 'two-column', label: 'Two Columns', icon: Columns },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'spacer', label: 'Spacer', icon: Square },
];

export default function OfficePDFCreator() {
  const navigate = useNavigate();
  const location = useLocation();
  const template = location.state?.template as PDFTemplate | undefined;
  const { openSaveDialog, saveDialogProps } = useSaveToFiles();

  const [docTitle, setDocTitle] = useState(template?.name || 'Untitled Document');
  const [blocks, setBlocks] = useState<PDFBlock[]>(() => {
    if (template) {
      return template.blocks.map(b => ({ ...b, id: uid() }));
    }
    return [
      { id: uid(), type: 'title', content: 'Document Title', style: { fontSize: 26 } },
      { id: uid(), type: 'paragraph', content: 'Start typing your content here...' },
    ];
  });
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const updateBlock = (id: string, updates: Partial<PDFBlock>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlock === id) setSelectedBlock(null);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  };

  const addBlock = (type: PDFBlock['type']) => {
    const newBlock: PDFBlock = { id: uid(), type, content: '' };
    if (type === 'list') newBlock.items = ['Item 1', 'Item 2', 'Item 3'];
    if (type === 'table') {
      newBlock.tableHeaders = ['Column 1', 'Column 2', 'Column 3'];
      newBlock.tableRows = [['Data 1', 'Data 2', 'Data 3']];
    }
    if (type === 'menu-item') { newBlock.content = 'Item Name'; newBlock.content2 = '$0.00'; newBlock.items = ['Description of the item']; }
    if (type === 'menu-item-image') { newBlock.content = 'Dish Name'; newBlock.content2 = '$0.00'; newBlock.content3 = ''; newBlock.items = ['Description of the dish']; }
    if (type === 'image') { newBlock.content = 'Image caption'; newBlock.imageUrl = ''; }
    if (type === 'step') { newBlock.content = 'Step Title'; newBlock.content2 = 'Step description goes here...'; }
    if (type === 'callout') { newBlock.content = 'Important note here'; newBlock.style = { bgColor: '#f0f9ff', borderColor: '#3b82f6' }; }
    if (type === 'two-column') { newBlock.content = 'Left column'; newBlock.content2 = 'Right column'; }
    if (type === 'title') newBlock.content = 'Title';
    if (type === 'heading') newBlock.content = 'Heading';
    if (type === 'subtitle') newBlock.content = 'Subtitle';
    if (type === 'paragraph') newBlock.content = 'Paragraph text...';
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlock(newBlock.id);
  };

  const addTableRow = (blockId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      const cols = b.tableHeaders?.length || 3;
      return { ...b, tableRows: [...(b.tableRows || []), Array(cols).fill('')] };
    }));
  };

  const updateTableCell = (blockId: string, rowIdx: number, colIdx: number, value: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      const rows = [...(b.tableRows || [])];
      rows[rowIdx] = [...(rows[rowIdx] || [])];
      rows[rowIdx][colIdx] = value;
      return { ...b, tableRows: rows };
    }));
  };

  const updateTableHeader = (blockId: string, colIdx: number, value: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      const headers = [...(b.tableHeaders || [])];
      headers[colIdx] = value;
      return { ...b, tableHeaders: headers };
    }));
  };

  const removeTableRow = (blockId: string, rowIdx: number) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return { ...b, tableRows: (b.tableRows || []).filter((_, i) => i !== rowIdx) };
    }));
  };

  const updateListItem = (blockId: string, idx: number, value: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      const items = [...(b.items || [])];
      items[idx] = value;
      return { ...b, items };
    }));
  };

  const addListItem = (blockId: string) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return { ...b, items: [...(b.items || []), ''] };
    }));
  };

  const removeListItem = (blockId: string, idx: number) => {
    setBlocks(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      return { ...b, items: (b.items || []).filter((_, i) => i !== idx) };
    }));
  };

  // ─── Image upload handler ───
  const handleImageUpload = (blockId: string, field: 'imageUrl' | 'content3') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        if (field === 'imageUrl') {
          updateBlock(blockId, { imageUrl: dataUrl });
        } else {
          updateBlock(blockId, { content3: dataUrl });
        }
        toast.success('Image added');
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  // ─── Export to PDF with jsPDF ───
  const exportPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const checkPageBreak = (needed: number) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    const drawText = (text: string, x: number, yPos: number, opts: { fontSize?: number; bold?: boolean; italic?: boolean; color?: string; align?: 'left' | 'center' | 'right'; maxWidth?: number }) => {
      const fs = opts.fontSize || 10;
      const style = opts.bold && opts.italic ? 'bolditalic' : opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal';
      doc.setFont('helvetica', style);
      doc.setFontSize(fs);
      if (opts.color) {
        const c = hexToRgb(opts.color);
        doc.setTextColor(c.r, c.g, c.b);
      } else {
        doc.setTextColor(30, 30, 30);
      }
      const maxW = opts.maxWidth || contentWidth;
      const lines = doc.splitTextToSize(text, maxW);
      const lineHeight = fs * 0.45;

      lines.forEach((line: string) => {
        checkPageBreak(lineHeight);
        let lx = x;
        if (opts.align === 'center') lx = pageWidth / 2;
        else if (opts.align === 'right') lx = pageWidth - margin;
        doc.text(line, lx, yPos, { align: opts.align || 'left' });
        yPos += lineHeight;
      });
      return yPos;
    };

    blocks.forEach(block => {
      const s = block.style || {};

      switch (block.type) {
        case 'title': {
          checkPageBreak(14);
          y = drawText(block.content, margin, y, { fontSize: s.fontSize || 24, bold: true, color: s.color, align: s.align }) + 2;
          break;
        }
        case 'heading': {
          checkPageBreak(10);
          y += 3;
          y = drawText(block.content, margin, y, { fontSize: s.fontSize || 14, bold: true, color: s.color || '#1e293b', align: s.align }) + 2;
          break;
        }
        case 'subtitle': {
          checkPageBreak(8);
          const lines = block.content.split('\n');
          lines.forEach(line => {
            y = drawText(line, margin, y, { fontSize: s.fontSize || 11, color: s.color || '#64748b', align: s.align, italic: true });
          });
          y += 1;
          break;
        }
        case 'paragraph': {
          const lines = block.content.split('\n');
          lines.forEach(line => {
            checkPageBreak(5);
            y = drawText(line, margin, y, { fontSize: s.fontSize || 10, color: s.color || '#374151', align: s.align, bold: s.bold });
          });
          y += 2;
          break;
        }
        case 'list': {
          (block.items || []).forEach(item => {
            checkPageBreak(5);
            y = drawText(`•  ${item}`, margin + 3, y, { fontSize: 10, color: s.color || '#374151' });
          });
          y += 2;
          break;
        }
        case 'menu-item': {
          checkPageBreak(10);
          // Name & price on same line
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(30, 30, 30);
          doc.text(block.content, margin, y);
          if (block.content2) {
            doc.text(block.content2, pageWidth - margin, y, { align: 'right' });
          }
          y += 4;
          // Description
          if (block.items?.[0]) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(9);
            doc.setTextColor(120, 120, 120);
            const descLines = doc.splitTextToSize(block.items[0], contentWidth);
            descLines.forEach((line: string) => {
              doc.text(line, margin, y);
              y += 3.5;
            });
          }
          y += 2;
          break;
        }
        case 'menu-item-image': {
          checkPageBreak(30);
          const imgSize = 22;
          // Draw image placeholder/actual image
          if (block.content3) {
            try { doc.addImage(block.content3, 'JPEG', margin, y - 2, imgSize, imgSize); } catch { /* fallback */ doc.setFillColor(240,240,240); doc.roundedRect(margin, y - 2, imgSize, imgSize, 2, 2, 'F'); }
          } else {
            doc.setFillColor(240, 240, 240);
            doc.roundedRect(margin, y - 2, imgSize, imgSize, 2, 2, 'F');
            doc.setFontSize(7); doc.setTextColor(180,180,180); doc.text('Photo', margin + imgSize/2, y + imgSize/2, { align: 'center' });
          }
          const textX = margin + imgSize + 4;
          const textW = contentWidth - imgSize - 4;
          doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(30, 30, 30);
          doc.text(block.content, textX, y + 2);
          if (block.content2) { doc.text(block.content2, pageWidth - margin, y + 2, { align: 'right' }); }
          if (block.items?.[0]) {
            doc.setFont('helvetica', 'italic'); doc.setFontSize(9); doc.setTextColor(120, 120, 120);
            const dl = doc.splitTextToSize(block.items[0], textW);
            dl.forEach((line: string, i: number) => { doc.text(line, textX, y + 7 + i * 3.5); });
          }
          y += imgSize + 4;
          break;
        }
        case 'image': {
          if (block.imageUrl) {
            checkPageBreak(60);
            try {
              doc.addImage(block.imageUrl, 'JPEG', margin, y, contentWidth, 50);
              y += 52;
            } catch { y += 4; }
          }
          if (block.content && block.content !== 'Image caption') {
            doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(130,130,130);
            doc.text(block.content, pageWidth / 2, y, { align: 'center' });
            y += 5;
          }
          y += 2;
          break;
        }
        case 'step': {
          checkPageBreak(12);
          // Step title
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          doc.setTextColor(30, 30, 30);
          doc.text(block.content, margin, y);
          y += 5;
          // Step description
          if (block.content2) {
            y = drawText(block.content2, margin + 2, y, { fontSize: 10, color: '#4b5563' }) + 2;
          }
          break;
        }
        case 'callout': {
          checkPageBreak(12);
          const bgColor = hexToRgb(s.bgColor || '#f0f9ff');
          const borderColor = hexToRgb(s.borderColor || '#3b82f6');
          const textLines = doc.splitTextToSize(block.content, contentWidth - 8);
          const boxHeight = Math.max(10, textLines.length * 4.5 + 6);
          doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
          doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
          doc.setLineWidth(0.5);
          doc.roundedRect(margin, y - 2, contentWidth, boxHeight, 1.5, 1.5, 'FD');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          textLines.forEach((line: string, i: number) => {
            doc.text(line, margin + 4, y + 2 + i * 4.5, { align: s.align || 'left' });
          });
          y += boxHeight + 3;
          break;
        }
        case 'two-column': {
          checkPageBreak(10);
          const colWidth = (contentWidth - 6) / 2;
          const leftLines = (block.content || '').split('\n');
          const rightLines = (block.content2 || '').split('\n');
          const maxLines = Math.max(leftLines.length, rightLines.length);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(50, 50, 50);
          for (let i = 0; i < maxLines; i++) {
            checkPageBreak(4);
            if (leftLines[i]) doc.text(leftLines[i], margin, y);
            if (rightLines[i]) doc.text(rightLines[i], margin + colWidth + 6, y);
            y += 4;
          }
          y += 2;
          break;
        }
        case 'table': {
          const headers = block.tableHeaders || [];
          const rows = block.tableRows || [];
          const colCount = headers.length || 3;
          const colWidth = contentWidth / colCount;
          checkPageBreak(8 + rows.length * 6);

          // Header
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, y - 2, contentWidth, 7, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(30, 30, 30);
          headers.forEach((h, i) => {
            doc.text(h, margin + i * colWidth + 2, y + 2);
          });
          y += 7;

          // Rows
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          rows.forEach((row, rIdx) => {
            checkPageBreak(6);
            if (rIdx % 2 === 1) {
              doc.setFillColor(248, 248, 248);
              doc.rect(margin, y - 2, contentWidth, 6, 'F');
            }
            row.forEach((cell, cIdx) => {
              doc.text(cell || '', margin + cIdx * colWidth + 2, y + 1.5);
            });
            y += 6;
          });
          y += 3;
          break;
        }
        case 'divider': {
          checkPageBreak(4);
          y += 2;
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.3);
          doc.line(margin, y, pageWidth - margin, y);
          y += 4;
          break;
        }
        case 'spacer': {
          y += 6;
          break;
        }
        case 'header': {
          y = drawText(block.content, margin, y, { fontSize: s.fontSize || 24, bold: true, color: s.color, align: s.align }) + 3;
          break;
        }
        case 'footer': {
          // Will be placed at bottom
          checkPageBreak(8);
          y += 4;
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.line(margin, y, pageWidth - margin, y);
          y += 4;
          y = drawText(block.content, margin, y, { fontSize: 8, color: s.color || '#94a3b8', align: s.align || 'center' });
          y += 3;
          break;
        }
        default: break;
      }
    });

    doc.save(`${docTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    toast.success('PDF exported successfully!');
  }, [blocks, docTitle]);

  // ─── Block Editor Component ───
  const renderBlockEditor = (block: PDFBlock) => {
    const isSelected = selectedBlock === block.id;

    return (
      <motion.div
        key={block.id}
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className={cn(
          "group relative border rounded-xl p-3 transition-all",
          isSelected
            ? "border-primary/40 bg-primary/5 shadow-sm"
            : "border-border/20 bg-card/30 hover:border-border/40"
        )}
        onClick={() => setSelectedBlock(block.id)}
      >
        {/* Controls */}
        <div className="absolute -left-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); moveBlock(block.id, -1); }} className="h-5 w-5 rounded bg-muted flex items-center justify-center hover:bg-accent"><MoveUp className="h-3 w-3" /></button>
          <button onClick={e => { e.stopPropagation(); moveBlock(block.id, 1); }} className="h-5 w-5 rounded bg-muted flex items-center justify-center hover:bg-accent"><MoveDown className="h-3 w-3" /></button>
        </div>
        <div className="absolute -right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); removeBlock(block.id); }} className="h-5 w-5 rounded bg-destructive/10 flex items-center justify-center hover:bg-destructive/20"><Trash2 className="h-3 w-3 text-destructive" /></button>
        </div>

        {/* Type badge */}
        <div className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-widest mb-1.5">{block.type.replace('-', ' ')}</div>

        {/* Content */}
        {(block.type === 'divider') && (
          <div className="border-t border-border/40 my-2" />
        )}
        {block.type === 'spacer' && (
          <div className="h-4 flex items-center justify-center text-[10px] text-muted-foreground/30">— spacer —</div>
        )}

        {['title', 'heading', 'subtitle', 'paragraph', 'header', 'footer'].includes(block.type) && (
          <Textarea
            value={block.content}
            onChange={e => updateBlock(block.id, { content: e.target.value })}
            className={cn(
              "w-full bg-transparent border-0 p-0 resize-none focus-visible:ring-0 text-foreground",
              block.type === 'title' && "text-xl font-bold",
              block.type === 'heading' && "text-base font-bold",
              block.type === 'subtitle' && "text-sm italic text-muted-foreground",
              block.type === 'paragraph' && "text-sm",
              block.type === 'header' && "text-xl font-bold",
              block.type === 'footer' && "text-xs text-muted-foreground",
            )}
            rows={block.content.split('\n').length}
            placeholder="Type here..."
          />
        )}

        {block.type === 'menu-item' && (
          <div className="space-y-1.5">
            <div className="flex gap-2">
              <Input value={block.content} onChange={e => updateBlock(block.id, { content: e.target.value })} className="flex-1 h-8 text-sm font-semibold bg-transparent border-border/20" placeholder="Item name" />
              <Input value={block.content2 || ''} onChange={e => updateBlock(block.id, { content2: e.target.value })} className="w-24 h-8 text-sm font-semibold text-right bg-transparent border-border/20" placeholder="$0.00" />
            </div>
            <Input value={block.items?.[0] || ''} onChange={e => {
              const items = [...(block.items || [''])];
              items[0] = e.target.value;
              updateBlock(block.id, { items });
            }} className="h-7 text-xs italic text-muted-foreground bg-transparent border-border/20" placeholder="Description..." />
          </div>
        )}

        {block.type === 'image' && (
          <div className="space-y-2">
            {block.imageUrl ? (
              <div className="relative group/img">
                <img src={block.imageUrl} alt="Uploaded" className="w-full max-h-48 object-cover rounded-lg border border-border/20" />
                <button onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { imageUrl: '' }); }} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                  <Trash2 className="h-3 w-3 text-white" />
                </button>
              </div>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); handleImageUpload(block.id, 'imageUrl'); }} className="w-full h-28 rounded-xl border-2 border-dashed border-border/30 flex flex-col items-center justify-center gap-1.5 hover:border-primary/40 hover:bg-primary/5 transition-all">
                <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                <span className="text-[10px] font-medium text-muted-foreground/50">Click to upload image</span>
              </button>
            )}
            <Input value={block.content} onChange={e => updateBlock(block.id, { content: e.target.value })} className="h-7 text-xs text-muted-foreground bg-transparent border-border/20" placeholder="Caption (optional)" />
          </div>
        )}

        {block.type === 'menu-item-image' && (
          <div className="flex gap-3">
            <div className="shrink-0">
              {block.content3 ? (
                <div className="relative group/img">
                  <img src={block.content3} alt="Food" className="w-20 h-20 object-cover rounded-lg border border-border/20" />
                  <button onClick={(e) => { e.stopPropagation(); updateBlock(block.id, { content3: '' }); }} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive/80 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <Trash2 className="h-2.5 w-2.5 text-white" />
                  </button>
                </div>
              ) : (
                <button onClick={(e) => { e.stopPropagation(); handleImageUpload(block.id, 'content3'); }} className="w-20 h-20 rounded-lg border-2 border-dashed border-border/30 flex flex-col items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 transition-all">
                  <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                  <span className="text-[8px] text-muted-foreground/40">Photo</span>
                </button>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex gap-2">
                <Input value={block.content} onChange={e => updateBlock(block.id, { content: e.target.value })} className="flex-1 h-8 text-sm font-semibold bg-transparent border-border/20" placeholder="Dish name" />
                <Input value={block.content2 || ''} onChange={e => updateBlock(block.id, { content2: e.target.value })} className="w-24 h-8 text-sm font-semibold text-right bg-transparent border-border/20" placeholder="$0.00" />
              </div>
              <Input value={block.items?.[0] || ''} onChange={e => {
                const items = [...(block.items || [''])];
                items[0] = e.target.value;
                updateBlock(block.id, { items });
              }} className="h-7 text-xs italic text-muted-foreground bg-transparent border-border/20" placeholder="Description..." />
            </div>
          </div>
        )}

        {block.type === 'step' && (
          <div className="space-y-1.5">
            <Input value={block.content} onChange={e => updateBlock(block.id, { content: e.target.value })} className="h-8 text-sm font-bold bg-transparent border-border/20" placeholder="Step title" />
            <Textarea value={block.content2 || ''} onChange={e => updateBlock(block.id, { content2: e.target.value })} className="text-xs bg-transparent border-border/20 resize-none" rows={2} placeholder="Step description..." />
          </div>
        )}

        {block.type === 'callout' && (
          <div className="rounded-lg p-2 border" style={{ background: block.style?.bgColor || '#f0f9ff', borderColor: block.style?.borderColor || '#3b82f6' }}>
            <Textarea value={block.content} onChange={e => updateBlock(block.id, { content: e.target.value })} className="w-full bg-transparent border-0 p-0 resize-none focus-visible:ring-0 text-sm" rows={2} placeholder="Callout text..." />
          </div>
        )}

        {block.type === 'two-column' && (
          <div className="grid grid-cols-2 gap-2">
            <Textarea value={block.content} onChange={e => updateBlock(block.id, { content: e.target.value })} className="text-xs bg-transparent border-border/20 resize-none" rows={3} placeholder="Left column..." />
            <Textarea value={block.content2 || ''} onChange={e => updateBlock(block.id, { content2: e.target.value })} className="text-xs bg-transparent border-border/20 resize-none" rows={3} placeholder="Right column..." />
          </div>
        )}

        {block.type === 'list' && (
          <div className="space-y-1">
            {(block.items || []).map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="text-muted-foreground/40 text-xs">•</span>
                <Input value={item} onChange={e => updateListItem(block.id, idx, e.target.value)} className="flex-1 h-7 text-xs bg-transparent border-border/20" />
                <button onClick={() => removeListItem(block.id, idx)} className="h-5 w-5 rounded hover:bg-destructive/10 flex items-center justify-center shrink-0"><Trash2 className="h-2.5 w-2.5 text-muted-foreground" /></button>
              </div>
            ))}
            <button onClick={() => addListItem(block.id)} className="text-[10px] text-primary hover:underline">+ Add item</button>
          </div>
        )}

        {block.type === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  {(block.tableHeaders || []).map((h, i) => (
                    <th key={i} className="p-1 border border-border/20 bg-muted/30">
                      <Input value={h} onChange={e => updateTableHeader(block.id, i, e.target.value)} className="h-6 text-[10px] font-semibold bg-transparent border-0 p-0 text-center focus-visible:ring-0" />
                    </th>
                  ))}
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody>
                {(block.tableRows || []).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-1 border border-border/20">
                        <Input value={cell} onChange={e => updateTableCell(block.id, rIdx, cIdx, e.target.value)} className="h-6 text-[10px] bg-transparent border-0 p-0 text-center focus-visible:ring-0" />
                      </td>
                    ))}
                    <td className="w-6 text-center">
                      <button onClick={() => removeTableRow(block.id, rIdx)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-2.5 w-2.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={() => addTableRow(block.id)} className="text-[10px] text-primary hover:underline mt-1">+ Add row</button>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="shrink-0 min-h-[52px] border-b border-border/30 bg-background/80 backdrop-blur-2xl flex flex-wrap items-center px-3 sm:px-5 gap-2 sm:gap-3 py-2">
        <Button variant="ghost" size="sm" className="h-8 gap-2 rounded-xl text-xs" onClick={() => navigate('/lounge/office/pdf-home', { state: { fromOfficeApp: true } })}>
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>
        <FileCheck className="h-4 w-4 text-red-500 hidden sm:block" />
        <Input
          value={docTitle}
          onChange={e => setDocTitle(e.target.value)}
          className="max-w-[140px] sm:max-w-[240px] h-8 text-sm font-semibold bg-transparent border-border/20 rounded-lg"
        />
        <div className="flex-1" />

        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="ghost" size="sm" className={cn("h-8 gap-1.5 rounded-xl text-xs", previewMode && "bg-primary/10 text-primary")} onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{previewMode ? 'Edit' : 'Preview'}</span>
          </Button>

          <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={() => openSaveDialog({
            fileName: docTitle,
            fileType: 'pdf',
            appSource: 'pdf-studio',
            sourceRoute: '/lounge/office/pdf-creator',
            description: `PDF document: ${docTitle}`,
            metadata: { blockCount: blocks.length },
            onSaveToDevice: exportPDF,
          })}>
            <FolderInput className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Save</span>
          </Button>

          <Button size="sm" className="h-8 gap-1.5 rounded-xl text-xs" onClick={exportPDF}>
            <Download className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Export PDF</span>
          </Button>
        </div>
      </header>

      <SaveToFilesDialog {...saveDialogProps} />

      {/* Main */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
          {previewMode ? (
            // ─── Preview Mode ───
            <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-10 min-h-[400px] sm:min-h-[800px] border border-border/10">
              {blocks.map(block => (
                <div key={block.id} className="mb-3">
                  {block.type === 'title' && <h1 className="text-2xl font-bold" style={{ textAlign: block.style?.align, color: block.style?.color }}>{block.content}</h1>}
                  {block.type === 'heading' && <h2 className="text-lg font-bold mt-4" style={{ textAlign: block.style?.align, color: block.style?.color }}>{block.content}</h2>}
                  {block.type === 'subtitle' && <p className="text-sm italic text-muted-foreground whitespace-pre-line" style={{ textAlign: block.style?.align, color: block.style?.color }}>{block.content}</p>}
                  {block.type === 'paragraph' && <p className="text-sm whitespace-pre-line" style={{ textAlign: block.style?.align, color: block.style?.color }}>{block.content}</p>}
                  {block.type === 'header' && <h1 className="text-2xl font-bold" style={{ textAlign: block.style?.align, color: block.style?.color }}>{block.content}</h1>}
                  {block.type === 'footer' && <><hr className="border-border/20 my-3" /><p className="text-[10px] text-muted-foreground" style={{ textAlign: block.style?.align }}>{block.content}</p></>}
                  {block.type === 'divider' && <hr className="border-border/30 my-3" />}
                  {block.type === 'spacer' && <div className="h-4" />}
                  {block.type === 'list' && <ul className="text-sm space-y-1 ml-4">{(block.items || []).map((item, i) => <li key={i} className="list-disc">{item}</li>)}</ul>}
                  {block.type === 'menu-item' && (
                    <div className="flex justify-between items-baseline border-b border-dotted border-border/20 pb-1">
                      <div><span className="text-sm font-semibold">{block.content}</span>{block.items?.[0] && <p className="text-[11px] italic text-muted-foreground">{block.items[0]}</p>}</div>
                      <span className="text-sm font-semibold shrink-0 ml-4">{block.content2}</span>
                    </div>
                  )}
                  {block.type === 'menu-item-image' && (
                    <div className="flex gap-3 border-b border-dotted border-border/20 pb-2">
                      {block.content3 ? (
                        <img src={block.content3} alt={block.content} className="w-16 h-16 object-cover rounded-lg shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                          <ImageIcon className="h-5 w-5 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 flex justify-between items-start">
                        <div>
                          <span className="text-sm font-semibold">{block.content}</span>
                          {block.items?.[0] && <p className="text-[11px] italic text-muted-foreground">{block.items[0]}</p>}
                        </div>
                        <span className="text-sm font-semibold shrink-0 ml-4">{block.content2}</span>
                      </div>
                    </div>
                  )}
                  {block.type === 'image' && (
                    <div className="text-center">
                      {block.imageUrl ? (
                        <img src={block.imageUrl} alt={block.content} className="w-full max-h-64 object-cover rounded-lg" />
                      ) : (
                        <div className="w-full h-32 rounded-lg bg-muted/30 flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground/20" />
                        </div>
                      )}
                      {block.content && block.content !== 'Image caption' && <p className="text-[10px] italic text-muted-foreground mt-1">{block.content}</p>}
                    </div>
                  )}
                  {block.type === 'step' && (
                    <div className="pl-4 border-l-2 border-primary/30 mb-2"><h3 className="text-sm font-bold">{block.content}</h3><p className="text-xs text-muted-foreground mt-0.5">{block.content2}</p></div>
                  )}
                  {block.type === 'callout' && (
                    <div className="rounded-lg p-3 border text-sm" style={{ background: block.style?.bgColor, borderColor: block.style?.borderColor }}>{block.content}</div>
                  )}
                  {block.type === 'two-column' && (
                    <div className="grid grid-cols-2 gap-4 text-sm"><div className="whitespace-pre-line">{block.content}</div><div className="whitespace-pre-line">{block.content2}</div></div>
                  )}
                  {block.type === 'table' && (
                    <table className="w-full text-xs border-collapse border border-border/20">
                      <thead><tr>{(block.tableHeaders || []).map((h, i) => <th key={i} className="p-1.5 bg-muted/30 border border-border/20 text-left font-semibold">{h}</th>)}</tr></thead>
                      <tbody>{(block.tableRows || []).map((row, ri) => <tr key={ri}>{row.map((cell, ci) => <td key={ci} className="p-1.5 border border-border/20">{cell}</td>)}</tr>)}</tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          ) : (
            // ─── Editor Mode ───
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {blocks.map(block => renderBlockEditor(block))}
              </AnimatePresence>

              {/* Add Block */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full h-10 rounded-xl border-dashed border-border/30 text-muted-foreground/50 hover:text-foreground hover:border-border/50 gap-2">
                    <Plus className="h-4 w-4" /> Add Block
                    <ChevronDown className="h-3 w-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56">
                  {BLOCK_TYPES.map(bt => (
                    <DropdownMenuItem key={bt.type} onClick={() => addBlock(bt.type)} className="gap-2 text-xs">
                      <bt.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {bt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16) || 0,
    g: parseInt(h.substring(2, 4), 16) || 0,
    b: parseInt(h.substring(4, 6), 16) || 0,
  };
}
