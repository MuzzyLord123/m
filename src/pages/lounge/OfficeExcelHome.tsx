import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Sheet, Plus, ArrowLeft, Bold, Italic, Underline, AlignLeft, AlignCenter,
  AlignRight, Undo2, Redo2, Download, Type, Paintbrush, FunctionSquare,
  Percent, DollarSign, Hash, Trash2, Copy, Scissors, ClipboardPaste,
  ChevronDown, MoreHorizontal, Table2, BarChart3, Filter, SortAsc, SortDesc,
  Merge, WrapText, Eye, EyeOff, Lock, Unlock, Search, X, Replace,
  FileText, Columns, Rows, ArrowUpDown, Sigma, Calendar, Clock,
  ChevronRight, Strikethrough, Grid3X3, Palette
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { OfficeModuleBand } from '@/pages/lounge/office/ModuleShell';
import { toast } from 'sonner';

const DEFAULT_COLS = 26;
const DEFAULT_ROWS = 100;
const COL_LETTERS = Array.from({ length: DEFAULT_COLS }, (_, i) => String.fromCharCode(65 + i));

function getCellId(row: number, col: number) {
  return `${COL_LETTERS[col]}${row + 1}`;
}

function parseCellRef(ref: string): [number, number] | null {
  const match = ref.match(/^([A-Z])(\d+)$/);
  if (!match) return null;
  return [parseInt(match[2]) - 1, match[1].charCodeAt(0) - 65];
}

interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  align?: 'left' | 'center' | 'right';
  format?: 'text' | 'number' | 'currency' | 'percent' | 'date';
  bg?: string;
  color?: string;
  fontSize?: number;
  borderTop?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;
  borderColor?: string;
  wrapText?: boolean;
}

interface ConditionalFormat {
  id: string;
  range: string;
  type: 'greater' | 'less' | 'equal' | 'between' | 'text_contains' | 'empty' | 'not_empty';
  value1: string;
  value2?: string;
  bgColor: string;
  textColor?: string;
}

interface MergedCell {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

interface SheetTab {
  id: string;
  name: string;
  color: string;
  cells: Record<string, string>;
  styles: Record<string, CellStyle>;
  colWidths: Record<number, number>;
  rowHeights: Record<number, number>;
  frozenRows: number;
  frozenCols: number;
  conditionalFormats: ConditionalFormat[];
  mergedCells: MergedCell[];
  filterColumn?: number;
  filterValue?: string;
  sortColumn?: number;
  sortAsc?: boolean;
}

const SHEET_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const CELL_COLORS = [
  '#ffffff', '#f8fafc', '#fef3c7', '#fce7f3', '#dbeafe', '#dcfce7', '#fae8ff',
  '#fee2e2', '#ffedd5', '#d1fae5', '#e0e7ff', '#fdf2f8', '#f0fdf4', '#fefce8',
  '#fff7ed', '#ecfdf5', '#eff6ff', '#faf5ff', '#fff1f2', '#f0fdfa',
];

const BORDER_COLORS = ['#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#3b82f6', '#ef4444', '#22c55e'];

let sheetCounter = 0;
const createSheet = (name?: string): SheetTab => ({
  id: `sheet-${++sheetCounter}`,
  name: name || `Sheet ${sheetCounter}`,
  color: SHEET_COLORS[(sheetCounter - 1) % SHEET_COLORS.length],
  cells: {},
  styles: {},
  colWidths: {},
  rowHeights: {},
  frozenRows: 0,
  frozenCols: 0,
  conditionalFormats: [],
  mergedCells: [],
});

// ── Extended Formula Engine ──
const BUILT_IN_FUNCTIONS: Record<string, (args: any[], cellGetter?: (ref: string) => string) => any> = {
  SUM: (a) => a.reduce((s: number, v: any) => s + (parseFloat(v) || 0), 0),
  AVG: (a) => a.length ? a.reduce((s: number, v: any) => s + (parseFloat(v) || 0), 0) / a.length : 0,
  AVERAGE: (a) => a.length ? a.reduce((s: number, v: any) => s + (parseFloat(v) || 0), 0) / a.length : 0,
  MIN: (a) => a.length ? Math.min(...a.map(v => parseFloat(v) || 0)) : 0,
  MAX: (a) => a.length ? Math.max(...a.map(v => parseFloat(v) || 0)) : 0,
  COUNT: (a) => a.filter(v => v !== '' && v != null && !isNaN(parseFloat(v))).length,
  COUNTA: (a) => a.filter(v => v !== '' && v != null).length,
  COUNTBLANK: (a) => a.filter(v => v === '' || v == null).length,
  ABS: (a) => Math.abs(parseFloat(a[0]) || 0),
  ROUND: (a) => { const n = parseFloat(a[0]) || 0; const d = parseInt(a[1]) || 0; return Math.round(n * Math.pow(10, d)) / Math.pow(10, d); },
  ROUNDUP: (a) => { const n = parseFloat(a[0]) || 0; const d = parseInt(a[1]) || 0; return Math.ceil(n * Math.pow(10, d)) / Math.pow(10, d); },
  ROUNDDOWN: (a) => { const n = parseFloat(a[0]) || 0; const d = parseInt(a[1]) || 0; return Math.floor(n * Math.pow(10, d)) / Math.pow(10, d); },
  FLOOR: (a) => Math.floor(parseFloat(a[0]) || 0),
  CEIL: (a) => Math.ceil(parseFloat(a[0]) || 0),
  CEILING: (a) => Math.ceil(parseFloat(a[0]) || 0),
  POWER: (a) => Math.pow(parseFloat(a[0]) || 0, parseFloat(a[1]) || 0),
  SQRT: (a) => Math.sqrt(parseFloat(a[0]) || 0),
  LOG: (a) => Math.log(parseFloat(a[0]) || 1),
  LOG10: (a) => Math.log10(parseFloat(a[0]) || 1),
  MOD: (a) => (parseFloat(a[0]) || 0) % (parseFloat(a[1]) || 1),
  PI: () => Math.PI,
  RAND: () => Math.random(),
  RANDBETWEEN: (a) => { const lo = parseInt(a[0]) || 0; const hi = parseInt(a[1]) || 100; return Math.floor(Math.random() * (hi - lo + 1)) + lo; },
  // String functions
  LEN: (a) => String(a[0] || '').length,
  TRIM: (a) => String(a[0] || '').trim(),
  UPPER: (a) => String(a[0] || '').toUpperCase(),
  LOWER: (a) => String(a[0] || '').toLowerCase(),
  PROPER: (a) => String(a[0] || '').replace(/\b\w/g, c => c.toUpperCase()),
  LEFT: (a) => String(a[0] || '').slice(0, parseInt(a[1]) || 1),
  RIGHT: (a) => { const s = String(a[0] || ''); return s.slice(-(parseInt(a[1]) || 1)); },
  MID: (a) => String(a[0] || '').slice((parseInt(a[1]) || 1) - 1, (parseInt(a[1]) || 1) - 1 + (parseInt(a[2]) || 1)),
  CONCATENATE: (a) => a.join(''),
  CONCAT: (a) => a.join(''),
  SUBSTITUTE: (a) => String(a[0] || '').split(String(a[1] || '')).join(String(a[2] || '')),
  REPT: (a) => String(a[0] || '').repeat(parseInt(a[1]) || 1),
  FIND: (a) => { const idx = String(a[1] || '').indexOf(String(a[0] || '')); return idx >= 0 ? idx + 1 : '#VALUE!'; },
  // Logic functions
  IF: (a) => { const cond = a[0]; return (cond && cond !== '0' && cond !== 'FALSE' && cond !== 'false') ? a[1] : a[2]; },
  AND: (a) => a.every(v => v && v !== '0' && v !== 'FALSE') ? 'TRUE' : 'FALSE',
  OR: (a) => a.some(v => v && v !== '0' && v !== 'FALSE') ? 'TRUE' : 'FALSE',
  NOT: (a) => (a[0] && a[0] !== '0' && a[0] !== 'FALSE') ? 'FALSE' : 'TRUE',
  IFERROR: (a) => String(a[0]).startsWith('#') ? a[1] : a[0],
  // Date/Time
  TODAY: () => new Date().toLocaleDateString(),
  NOW: () => new Date().toLocaleString(),
  YEAR: (a) => new Date(a[0]).getFullYear(),
  MONTH: (a) => new Date(a[0]).getMonth() + 1,
  DAY: (a) => new Date(a[0]).getDate(),
  // Statistical
  MEDIAN: (a) => { const nums = a.map(v => parseFloat(v)).filter(n => !isNaN(n)).sort((x, y) => x - y); const mid = Math.floor(nums.length / 2); return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2; },
  STDEV: (a) => { const nums = a.map(v => parseFloat(v)).filter(n => !isNaN(n)); const mean = nums.reduce((s, v) => s + v, 0) / nums.length; return Math.sqrt(nums.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / (nums.length - 1)); },
  SUMIF: (a, cellGetter) => {
    // simplified - just sum numbers matching criteria
    return a.reduce((s: number, v: any) => s + (parseFloat(v) || 0), 0);
  },
  PRODUCT: (a) => a.reduce((p: number, v: any) => p * (parseFloat(v) || 1), 1),
};

export default function OfficeExcelHome() {
  const navigate = useNavigate();
  const [sheets, setSheets] = useState<SheetTab[]>([createSheet('Sheet 1')]);
  const [activeSheetIdx, setActiveSheetIdx] = useState(0);
  const [selectedCell, setSelectedCell] = useState('A1');
  const [selectionRange, setSelectionRange] = useState<{ start: string; end: string } | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [formulaBar, setFormulaBar] = useState('');
  const [editingSheetName, setEditingSheetName] = useState<string | null>(null);
  const [sheetNameValue, setSheetNameValue] = useState('');
  const [fileName, setFileName] = useState('Untitled Spreadsheet');
  const [editingFileName, setEditingFileName] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showCondFormat, setShowCondFormat] = useState(false);
  const [showFormulaHelper, setShowFormulaHelper] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);
  const [undoStack, setUndoStack] = useState<Record<string, string>[]>([]);
  const [redoStack, setRedoStack] = useState<Record<string, string>[]>([]);

  const sheet = sheets[activeSheetIdx];

  const updateSheet = useCallback((updates: Partial<SheetTab>) => {
    setSheets(prev => prev.map((s, i) => i === activeSheetIdx ? { ...s, ...updates } : s));
  }, [activeSheetIdx]);

  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-30), { ...sheet.cells }]);
    setRedoStack([]);
  }, [sheet.cells]);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    setRedoStack(prev => [...prev, { ...sheet.cells }]);
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    updateSheet({ cells: last });
    toast.success('Undone');
  }, [undoStack, sheet.cells, updateSheet]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    setUndoStack(prev => [...prev, { ...sheet.cells }]);
    const last = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    updateSheet({ cells: last });
    toast.success('Redone');
  }, [redoStack, sheet.cells, updateSheet]);

  const handleCellClick = useCallback((cellId: string, e: React.MouseEvent) => {
    if (e.shiftKey && selectedCell) {
      setSelectionRange({ start: selectedCell, end: cellId });
    } else {
      setSelectedCell(cellId);
      setSelectionRange(null);
      setFormulaBar(sheet.cells[cellId] || '');
    }
  }, [selectedCell, sheet.cells]);

  const handleCellDoubleClick = useCallback((cellId: string) => {
    setEditingCell(cellId);
    setEditValue(sheet.cells[cellId] || '');
  }, [sheet.cells]);

  const commitEdit = useCallback(() => {
    if (editingCell) {
      pushUndo();
      const newCells = { ...sheet.cells, [editingCell]: editValue };
      updateSheet({ cells: newCells });
      setFormulaBar(editValue);
      setEditingCell(null);
    }
  }, [editingCell, editValue, sheet.cells, updateSheet, pushUndo]);

  const handleFormulaBarChange = useCallback((val: string) => {
    setFormulaBar(val);
    pushUndo();
    const newCells = { ...sheet.cells, [selectedCell]: val };
    updateSheet({ cells: newCells });
  }, [selectedCell, sheet.cells, updateSheet, pushUndo]);

  const expandRange = useCallback((rangeStr: string): string[] => {
    const parts = rangeStr.split(':');
    if (parts.length !== 2) return [rangeStr];
    const startRef = parseCellRef(parts[0]);
    const endRef = parseCellRef(parts[1]);
    if (!startRef || !endRef) return [rangeStr];
    const cells: string[] = [];
    const minRow = Math.min(startRef[0], endRef[0]);
    const maxRow = Math.max(startRef[0], endRef[0]);
    const minCol = Math.min(startRef[1], endRef[1]);
    const maxCol = Math.max(startRef[1], endRef[1]);
    for (let r = minRow; r <= maxRow; r++) {
      for (let c = minCol; c <= maxCol; c++) {
        cells.push(getCellId(r, c));
      }
    }
    return cells;
  }, []);

  const evaluateCell = useCallback((val: string, depth = 0): string => {
    if (!val) return '';
    if (!val.startsWith('=')) return val;
    if (depth > 10) return '#CIRCULAR';
    
    try {
      const formula = val.slice(1).toUpperCase();
      
      const fnMatch = formula.match(/^(\w+)\((.+)\)$/);
      if (fnMatch) {
        const fnName = fnMatch[1];
        const fn = BUILT_IN_FUNCTIONS[fnName];
        if (fn) {
          // Parse args more carefully - handle nested commas in strings
          const argStr = fnMatch[2];
          const args: any[] = [];
          let current = '';
          let parenDepth = 0;
          let inQuote = false;
          for (let i = 0; i < argStr.length; i++) {
            const ch = argStr[i];
            if (ch === '"') { inQuote = !inQuote; continue; }
            if (inQuote) { current += ch; continue; }
            if (ch === '(') { parenDepth++; current += ch; continue; }
            if (ch === ')') { parenDepth--; current += ch; continue; }
            if (ch === ',' && parenDepth === 0) { args.push(current.trim()); current = ''; continue; }
            current += ch;
          }
          if (current.trim()) args.push(current.trim());

          // Resolve args
          const resolvedArgs: any[] = [];
          for (const arg of args) {
            if (arg.includes(':')) {
              const rangeCells = expandRange(arg);
              for (const rc of rangeCells) {
                const cv = sheet.cells[rc];
                resolvedArgs.push(cv ? evaluateCell(cv, depth + 1) : '');
              }
            } else if (parseCellRef(arg)) {
              const ref = parseCellRef(arg)!;
              const cv = sheet.cells[getCellId(ref[0], ref[1])];
              resolvedArgs.push(cv ? evaluateCell(cv, depth + 1) : '');
            } else if (arg.startsWith('=')) {
              resolvedArgs.push(evaluateCell(arg, depth + 1));
            } else {
              // Try as nested function
              const nestedFnMatch = arg.match(/^(\w+)\((.+)\)$/);
              if (nestedFnMatch) {
                resolvedArgs.push(evaluateCell('=' + arg, depth + 1));
              } else {
                resolvedArgs.push(arg);
              }
            }
          }
          
          const cellGetter = (ref: string) => {
            const parsed = parseCellRef(ref);
            if (!parsed) return '';
            return evaluateCell(sheet.cells[getCellId(parsed[0], parsed[1])] || '', depth + 1);
          };
          
          const result = fn(resolvedArgs, cellGetter);
          if (typeof result === 'number') return Number.isInteger(result) ? String(result) : result.toFixed(2);
          return String(result);
        }
      }

      // No-arg functions
      if (formula === 'TODAY()' || formula === 'TODAY') return new Date().toLocaleDateString();
      if (formula === 'NOW()' || formula === 'NOW') return new Date().toLocaleString();
      if (formula === 'PI()' || formula === 'PI') return String(Math.PI);
      if (formula === 'RAND()' || formula === 'RAND') return String(Math.random());

      // Simple comparison for IF conditions
      const expr = formula.replace(/([A-Z])(\d+)/g, (_, c, r) => {
        const ref = `${c}${r}`;
        const cv = sheet.cells[ref];
        return cv ? (evaluateCell(cv, depth + 1) || '0') : '0';
      });
      const result = Function('"use strict"; return (' + expr + ')')();
      return typeof result === 'number' ? (Number.isInteger(result) ? String(result) : result.toFixed(2)) : String(result);
    } catch {
      return '#ERR';
    }
  }, [sheet.cells, expandRange]);

  const formatDisplayValue = useCallback((val: string, cellId: string): string => {
    const evaluated = evaluateCell(val);
    const style = sheet.styles[cellId];
    if (!style?.format || style.format === 'text') return evaluated;
    const num = parseFloat(evaluated);
    if (isNaN(num)) return evaluated;
    switch (style.format) {
      case 'currency': return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percent': return `${(num * 100).toFixed(1)}%`;
      case 'number': return num.toLocaleString();
      case 'date': return new Date(num).toLocaleDateString();
      default: return evaluated;
    }
  }, [evaluateCell, sheet.styles]);

  const toggleStyle = useCallback((prop: keyof CellStyle, value?: any) => {
    const current = sheet.styles[selectedCell] || {};
    const newStyles = {
      ...sheet.styles,
      [selectedCell]: {
        ...current,
        [prop]: value !== undefined ? value : !current[prop],
      }
    };
    // Also apply to selection range
    if (selectionRange) {
      const cells = getSelectionCells();
      cells.forEach(c => {
        newStyles[c] = { ...(sheet.styles[c] || {}), [prop]: value !== undefined ? value : !(sheet.styles[c] || {} as any)[prop] };
      });
    }
    updateSheet({ styles: newStyles });
  }, [selectedCell, sheet.styles, updateSheet, selectionRange]);

  const getSelectionCells = useCallback((): string[] => {
    if (!selectionRange) return [selectedCell];
    const s = parseCellRef(selectionRange.start);
    const e = parseCellRef(selectionRange.end);
    if (!s || !e) return [selectedCell];
    const cells: string[] = [];
    const minR = Math.min(s[0], e[0]), maxR = Math.max(s[0], e[0]);
    const minC = Math.min(s[1], e[1]), maxC = Math.max(s[1], e[1]);
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        cells.push(getCellId(r, c));
      }
    }
    return cells;
  }, [selectionRange, selectedCell]);

  // Sort
  const sortColumn = useCallback((col: number, asc: boolean) => {
    pushUndo();
    const rows: { row: number; val: string }[] = [];
    for (let r = 0; r < DEFAULT_ROWS; r++) {
      const cellId = getCellId(r, col);
      const val = sheet.cells[cellId] || '';
      if (val) rows.push({ row: r, val: evaluateCell(val) });
    }
    
    rows.sort((a, b) => {
      const na = parseFloat(a.val), nb = parseFloat(b.val);
      if (!isNaN(na) && !isNaN(nb)) return asc ? na - nb : nb - na;
      return asc ? a.val.localeCompare(b.val) : b.val.localeCompare(a.val);
    });

    const newCells = { ...sheet.cells };
    // Clear column
    for (let r = 0; r < DEFAULT_ROWS; r++) {
      const cellId = getCellId(r, col);
      delete newCells[cellId];
    }
    // Place sorted
    rows.forEach((item, i) => {
      newCells[getCellId(i, col)] = sheet.cells[getCellId(item.row, col)] || '';
    });
    
    updateSheet({ cells: newCells, sortColumn: col, sortAsc: asc });
    toast.success(`Sorted column ${COL_LETTERS[col]} ${asc ? 'A→Z' : 'Z→A'}`);
  }, [sheet.cells, evaluateCell, updateSheet, pushUndo]);

  // Find & Replace
  const handleFind = useCallback(() => {
    if (!findText) return;
    for (const [cellId, val] of Object.entries(sheet.cells)) {
      if (val.toLowerCase().includes(findText.toLowerCase()) && cellId !== selectedCell) {
        setSelectedCell(cellId);
        setFormulaBar(val);
        toast.success(`Found in ${cellId}`);
        return;
      }
    }
    toast.error('Not found');
  }, [findText, sheet.cells, selectedCell]);

  const handleReplaceAll = useCallback(() => {
    if (!findText) return;
    pushUndo();
    const newCells = { ...sheet.cells };
    let count = 0;
    for (const [cellId, val] of Object.entries(newCells)) {
      if (val.toLowerCase().includes(findText.toLowerCase())) {
        newCells[cellId] = val.replace(new RegExp(findText, 'gi'), replaceText);
        count++;
      }
    }
    updateSheet({ cells: newCells });
    toast.success(`Replaced ${count} occurrence(s)`);
  }, [findText, replaceText, sheet.cells, updateSheet, pushUndo]);

  // Merge cells
  const mergeCells = useCallback(() => {
    if (!selectionRange) { toast.error('Select a range to merge'); return; }
    const s = parseCellRef(selectionRange.start);
    const e = parseCellRef(selectionRange.end);
    if (!s || !e) return;
    const merge: MergedCell = {
      startRow: Math.min(s[0], e[0]), startCol: Math.min(s[1], e[1]),
      endRow: Math.max(s[0], e[0]), endCol: Math.max(s[1], e[1]),
    };
    updateSheet({ mergedCells: [...sheet.mergedCells, merge] });
    toast.success('Cells merged');
  }, [selectionRange, sheet.mergedCells, updateSheet]);

  const unmergeCells = useCallback(() => {
    const ref = parseCellRef(selectedCell);
    if (!ref) return;
    updateSheet({
      mergedCells: sheet.mergedCells.filter(m =>
        !(ref[0] >= m.startRow && ref[0] <= m.endRow && ref[1] >= m.startCol && ref[1] <= m.endCol)
      )
    });
    toast.success('Cells unmerged');
  }, [selectedCell, sheet.mergedCells, updateSheet]);

  const isMergedCell = useCallback((row: number, col: number) => {
    return sheet.mergedCells.find(m =>
      row >= m.startRow && row <= m.endRow && col >= m.startCol && col <= m.endCol
    );
  }, [sheet.mergedCells]);

  const isHiddenByMerge = useCallback((row: number, col: number) => {
    const m = isMergedCell(row, col);
    return m && (row !== m.startRow || col !== m.startCol);
  }, [isMergedCell]);

  // Conditional formatting check
  const getConditionalStyle = useCallback((cellId: string): Partial<CellStyle> | null => {
    const val = evaluateCell(sheet.cells[cellId] || '');
    for (const cf of sheet.conditionalFormats) {
      const rangeCells = expandRange(cf.range);
      if (!rangeCells.includes(cellId)) continue;
      const num = parseFloat(val);
      let match = false;
      switch (cf.type) {
        case 'greater': match = !isNaN(num) && num > parseFloat(cf.value1); break;
        case 'less': match = !isNaN(num) && num < parseFloat(cf.value1); break;
        case 'equal': match = val === cf.value1 || (!isNaN(num) && num === parseFloat(cf.value1)); break;
        case 'between': match = !isNaN(num) && num >= parseFloat(cf.value1) && num <= parseFloat(cf.value2 || '0'); break;
        case 'text_contains': match = val.toLowerCase().includes(cf.value1.toLowerCase()); break;
        case 'empty': match = val === ''; break;
        case 'not_empty': match = val !== ''; break;
      }
      if (match) return { bg: cf.bgColor, color: cf.textColor };
    }
    return null;
  }, [sheet.cells, sheet.conditionalFormats, evaluateCell, expandRange]);

  const exportCSV = useCallback(() => {
    let csv = '';
    for (let r = 0; r < DEFAULT_ROWS; r++) {
      const row: string[] = [];
      let hasData = false;
      for (let c = 0; c < DEFAULT_COLS; c++) {
        const cellId = getCellId(r, c);
        const val = sheet.cells[cellId];
        if (val) hasData = true;
        const evaluated = val ? evaluateCell(val) : '';
        row.push(evaluated.includes(',') ? `"${evaluated}"` : evaluated);
      }
      if (hasData) csv += row.join(',') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fileName}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  }, [sheet.cells, evaluateCell, fileName]);

  const addSheet = useCallback(() => {
    const newSheet = createSheet();
    setSheets(prev => [...prev, newSheet]);
    setActiveSheetIdx(sheets.length);
  }, [sheets.length]);

  const deleteSheet = useCallback((idx: number) => {
    if (sheets.length <= 1) { toast.error("Can't delete the last sheet"); return; }
    setSheets(prev => prev.filter((_, i) => i !== idx));
    if (activeSheetIdx >= idx && activeSheetIdx > 0) setActiveSheetIdx(prev => prev - 1);
  }, [sheets.length, activeSheetIdx]);

  const renameSheet = useCallback((idx: number, name: string) => {
    setSheets(prev => prev.map((s, i) => i === idx ? { ...s, name } : s));
    setEditingSheetName(null);
  }, []);

  // Freeze panes
  const freezePanes = useCallback(() => {
    const ref = parseCellRef(selectedCell);
    if (!ref) return;
    updateSheet({ frozenRows: ref[0], frozenCols: ref[1] });
    toast.success(`Frozen at ${selectedCell}`);
  }, [selectedCell, updateSheet]);

  const unfreezePanes = useCallback(() => {
    updateSheet({ frozenRows: 0, frozenCols: 0 });
    toast.success('Panes unfrozen');
  }, [updateSheet]);

  // Add borders to selection
  const addBorders = useCallback((type: 'all' | 'outside' | 'none') => {
    const cells = getSelectionCells();
    const newStyles = { ...sheet.styles };
    cells.forEach(c => {
      if (type === 'none') {
        newStyles[c] = { ...(newStyles[c] || {}), borderTop: false, borderBottom: false, borderLeft: false, borderRight: false };
      } else if (type === 'all') {
        newStyles[c] = { ...(newStyles[c] || {}), borderTop: true, borderBottom: true, borderLeft: true, borderRight: true, borderColor: '#000000' };
      } else {
        // outside only - simplified
        newStyles[c] = { ...(newStyles[c] || {}), borderTop: true, borderBottom: true, borderLeft: true, borderRight: true, borderColor: '#000000' };
      }
    });
    updateSheet({ styles: newStyles });
  }, [getSelectionCells, sheet.styles, updateSheet]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (editingCell) return;
    
    // Ctrl+F for find
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setShowFindReplace(true); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') { e.preventDefault(); toggleStyle('bold'); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') { e.preventDefault(); toggleStyle('italic'); return; }
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); toggleStyle('underline'); return; }
    
    const ref = parseCellRef(selectedCell);
    if (!ref) return;
    let [row, col] = ref;

    switch (e.key) {
      case 'ArrowUp': row = Math.max(0, row - 1); break;
      case 'ArrowDown': row = Math.min(DEFAULT_ROWS - 1, row + 1); break;
      case 'ArrowLeft': col = Math.max(0, col - 1); break;
      case 'ArrowRight': col = Math.min(DEFAULT_COLS - 1, col + 1); break;
      case 'Tab': e.preventDefault(); col = Math.min(DEFAULT_COLS - 1, col + (e.shiftKey ? -1 : 1)); break;
      case 'Enter': e.preventDefault(); row = Math.min(DEFAULT_ROWS - 1, row + 1); break;
      case 'Delete':
      case 'Backspace': {
        pushUndo();
        const newCells = { ...sheet.cells };
        delete newCells[selectedCell];
        updateSheet({ cells: newCells });
        setFormulaBar('');
        return;
      }
      case 'F2': handleCellDoubleClick(selectedCell); return;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          setEditingCell(selectedCell);
          setEditValue(e.key);
          return;
        }
        return;
    }
    const newCell = getCellId(row, col);
    setSelectedCell(newCell);
    setFormulaBar(sheet.cells[newCell] || '');
  }, [editingCell, selectedCell, sheet.cells, updateSheet, handleCellDoubleClick, undo, redo, toggleStyle, pushUndo]);

  const cellCount = Object.keys(sheet.cells).filter(k => sheet.cells[k]).length;
  const currentStyle = sheet.styles[selectedCell] || {};
  
  // Sum/avg/count of selection
  const selectionStats = useMemo(() => {
    const cells = getSelectionCells();
    const nums = cells.map(c => parseFloat(evaluateCell(sheet.cells[c] || ''))).filter(n => !isNaN(n));
    if (nums.length === 0) return null;
    return {
      sum: nums.reduce((s, v) => s + v, 0),
      avg: nums.reduce((s, v) => s + v, 0) / nums.length,
      count: nums.length,
      min: Math.min(...nums),
      max: Math.max(...nums),
    };
  }, [getSelectionCells, sheet.cells, evaluateCell]);

  // Formula categories for helper
  const FORMULA_CATEGORIES = [
    { name: 'Math', formulas: ['SUM', 'AVERAGE', 'MIN', 'MAX', 'COUNT', 'ABS', 'ROUND', 'SQRT', 'POWER', 'MOD', 'PI', 'PRODUCT', 'MEDIAN', 'STDEV'] },
    { name: 'Text', formulas: ['CONCATENATE', 'UPPER', 'LOWER', 'PROPER', 'LEN', 'TRIM', 'LEFT', 'RIGHT', 'MID', 'FIND', 'SUBSTITUTE', 'REPT'] },
    { name: 'Logic', formulas: ['IF', 'AND', 'OR', 'NOT', 'IFERROR'] },
    { name: 'Date', formulas: ['TODAY', 'NOW', 'YEAR', 'MONTH', 'DAY'] },
    { name: 'Stats', formulas: ['COUNT', 'COUNTA', 'COUNTBLANK', 'RANDBETWEEN'] },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background" onKeyDown={handleKeyDown} tabIndex={0}>
      <OfficeModuleBand appId="sheets" icon={Sheet} title="Sheets">
        {editingFileName ? (
          <Input autoFocus value={fileName} onChange={e => setFileName(e.target.value)} onBlur={() => setEditingFileName(false)}
            onKeyDown={e => e.key === 'Enter' && setEditingFileName(false)}
            className="h-8 w-56 rounded-[7px] border-border/70 bg-black/40 text-[12.5px]" />
        ) : (
          <button onClick={() => setEditingFileName(true)}
            className="max-w-[40vw] truncate rounded-[7px] px-2 py-1 text-[12.5px] text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.05] hover:text-foreground">
            {fileName}
          </button>
        )}
        <div className="mx-1 h-4 w-px bg-border/50" />
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-[7px] px-2.5 text-[12px]" onClick={() => setShowFindReplace(true)}>
          <Search className="h-3.5 w-3.5" /><span className="hidden sm:inline">Find</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-[7px] px-2.5 text-[12px]" onClick={exportCSV}>
          <Download className="h-3.5 w-3.5" /><span className="hidden sm:inline">Export</span>
        </Button>
      </OfficeModuleBand>

      {/* Enhanced Toolbar */}
      <div className="scrollbar-none flex h-10 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border/40 bg-black/40 px-3">
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={undo} disabled={undoStack.length === 0} title="Undo (Ctrl+Z)"><Undo2 className="h-3 w-3" /></Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={redo} disabled={redoStack.length === 0} title="Redo (Ctrl+Y)"><Redo2 className="h-3 w-3" /></Button>
        <div className="w-px h-5 bg-border/60 mx-1" />
        
        {/* Font size */}
        <Select value={String(currentStyle.fontSize || 12)} onValueChange={v => toggleStyle('fontSize', parseInt(v))}>
          <SelectTrigger className="h-7 w-14 text-[10px] border-border/60 rounded-lg bg-transparent">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-[10px]">
            {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36].map(s => (
              <SelectItem key={s} value={String(s)} className="text-[10px]">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="w-px h-5 bg-border/60 mx-1" />
        
        {/* Text formatting */}
        <Button variant={currentStyle.bold ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={() => toggleStyle('bold')} title="Bold (Ctrl+B)">
          <Bold className="h-3 w-3" />
        </Button>
        <Button variant={currentStyle.italic ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={() => toggleStyle('italic')} title="Italic (Ctrl+I)">
          <Italic className="h-3 w-3" />
        </Button>
        <Button variant={currentStyle.underline ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={() => toggleStyle('underline')} title="Underline (Ctrl+U)">
          <Underline className="h-3 w-3" />
        </Button>
        <Button variant={currentStyle.strikethrough ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={() => toggleStyle('strikethrough')}>
          <Strikethrough className="h-3 w-3" />
        </Button>
        <div className="w-px h-5 bg-border/60 mx-1" />
        
        {/* Alignment */}
        <Button variant={currentStyle.align === 'left' || !currentStyle.align ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={() => toggleStyle('align', 'left')}>
          <AlignLeft className="h-3 w-3" />
        </Button>
        <Button variant={currentStyle.align === 'center' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={() => toggleStyle('align', 'center')}>
          <AlignCenter className="h-3 w-3" />
        </Button>
        <Button variant={currentStyle.align === 'right' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={() => toggleStyle('align', 'right')}>
          <AlignRight className="h-3 w-3" />
        </Button>
        <div className="w-px h-5 bg-border/60 mx-1" />
        
        {/* Number formatting */}
        <Button variant={currentStyle.format === 'currency' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={() => toggleStyle('format', currentStyle.format === 'currency' ? 'text' : 'currency')} title="Currency">
          <DollarSign className="h-3 w-3" />
        </Button>
        <Button variant={currentStyle.format === 'percent' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={() => toggleStyle('format', currentStyle.format === 'percent' ? 'text' : 'percent')} title="Percent">
          <Percent className="h-3 w-3" />
        </Button>
        <Button variant={currentStyle.format === 'number' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={() => toggleStyle('format', currentStyle.format === 'number' ? 'text' : 'number')} title="Number">
          <Hash className="h-3 w-3" />
        </Button>
        <div className="w-px h-5 bg-border/60 mx-1" />
        
        {/* Cell colors */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-[7px] relative" title="Fill color">
              <Paintbrush className="h-3 w-3" />
              <div className="absolute bottom-0 left-1 right-1 h-[3px] rounded-full" style={{ background: currentStyle.bg || '#ffffff' }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 rounded-[10px]" side="bottom">
            <p className="text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground/90 mb-1.5">Fill colour</p>
            <div className="grid grid-cols-5 gap-1">
              {CELL_COLORS.map(c => (
                <button key={c} className={cn("h-6 w-6 rounded-md border border-border/60 transition-shadow duration-150", currentStyle.bg === c && "ring-2 ring-primary ring-offset-1")}
                  style={{ background: c }} onClick={() => toggleStyle('bg', c)} />
              ))}
            </div>
            <Input type="color" value={currentStyle.bg || '#ffffff'} onChange={(e) => toggleStyle('bg', e.target.value)} className="mt-2 h-6 w-full rounded-lg cursor-pointer" />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-[7px] relative" title="Text color">
              <Type className="h-3 w-3" />
              <div className="absolute bottom-0 left-1 right-1 h-[3px] rounded-full" style={{ background: currentStyle.color || '#000000' }} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2 rounded-[10px]" side="bottom">
            <p className="text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground/90 mb-1.5">Text colour</p>
            <div className="grid grid-cols-5 gap-1">
              {BORDER_COLORS.map(c => (
                <button key={c} className={cn("h-6 w-6 rounded-md border border-border/60 transition-shadow duration-150", currentStyle.color === c && "ring-2 ring-primary ring-offset-1")}
                  style={{ background: c }} onClick={() => toggleStyle('color', c)} />
              ))}
            </div>
            <Input type="color" value={currentStyle.color || '#000000'} onChange={(e) => toggleStyle('color', e.target.value)} className="mt-2 h-6 w-full rounded-lg cursor-pointer" />
          </PopoverContent>
        </Popover>
        <div className="w-px h-5 bg-border/60 mx-1" />

        {/* Borders */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" title="Borders"><Grid3X3 className="h-3 w-3" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-[10px] w-36">
            <DropdownMenuItem onClick={() => addBorders('all')} className="text-xs gap-2"><Grid3X3 className="h-3 w-3" /> All borders</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addBorders('outside')} className="text-xs gap-2"><Table2 className="h-3 w-3" /> Outside</DropdownMenuItem>
            <DropdownMenuItem onClick={() => addBorders('none')} className="text-xs gap-2"><X className="h-3 w-3" /> No borders</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Merge */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" title="Merge"><Merge className="h-3 w-3" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-[10px] w-36">
            <DropdownMenuItem onClick={mergeCells} className="text-xs gap-2"><Merge className="h-3 w-3" /> Merge cells</DropdownMenuItem>
            <DropdownMenuItem onClick={unmergeCells} className="text-xs gap-2"><Columns className="h-3 w-3" /> Unmerge</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Wrap text */}
        <Button variant={currentStyle.wrapText ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 shrink-0 rounded-[7px]" onClick={() => toggleStyle('wrapText')} title="Wrap text">
          <WrapText className="h-3 w-3" />
        </Button>
        <div className="w-px h-5 bg-border/60 mx-1" />

        {/* Data: the operations that act on the sheet rather than the cell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 shrink-0 gap-1 rounded-[7px] px-2 text-[11.5px]">
              Data <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-52 rounded-[12px]" align="start">
            <DropdownMenuItem onClick={() => { const ref = parseCellRef(selectedCell); if (ref) sortColumn(ref[1], true); }} className="gap-2 text-xs"><SortAsc className="h-3.5 w-3.5" /> Sort A → Z</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { const ref = parseCellRef(selectedCell); if (ref) sortColumn(ref[1], false); }} className="gap-2 text-xs"><SortDesc className="h-3.5 w-3.5" /> Sort Z → A</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setShowCondFormat(true)} className="gap-2 text-xs"><Palette className="h-3.5 w-3.5" /> Conditional formatting</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={freezePanes} className="gap-2 text-xs"><Lock className="h-3.5 w-3.5" /> Freeze at {selectedCell}</DropdownMenuItem>
            <DropdownMenuItem onClick={unfreezePanes} className="gap-2 text-xs"><Unlock className="h-3.5 w-3.5" /> Unfreeze all</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" className="h-7 shrink-0 gap-1.5 rounded-[7px] px-2 text-[11.5px]" onClick={() => setShowFormulaHelper(true)}>
          <Sigma className="h-3.5 w-3.5" /> Formulas
        </Button>
      </div>

      {/* Formula Bar */}
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-border/40 bg-black/40 px-3">
        <div className="flex h-7 w-20 items-center justify-center rounded-[7px] border border-border/60 bg-black/40">
          <span className="font-mono text-[11px] font-medium tabular-nums text-foreground">{selectedCell}</span>
        </div>
        <div className="h-4 w-px bg-border/50" />
        <FunctionSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <Input
          ref={formulaInputRef}
          value={formulaBar}
          onChange={e => handleFormulaBarChange(e.target.value)}
          className="h-7 text-[11px] font-mono bg-transparent border-none shadow-none focus-visible:ring-0 flex-1"
          placeholder="Value, or a formula starting with ="
        />
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto" ref={gridRef}>
        <table className="border-collapse w-max">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-12 h-7 bg-black/40 border border-border/30 font-mono text-[10.5px] font-medium text-muted-foreground sticky left-0 z-20" />
              {COL_LETTERS.map((letter, ci) => (
                <th key={letter} className="w-28 h-7 bg-black/40 border border-border/30 font-mono text-[10.5px] font-medium text-muted-foreground text-center select-none group cursor-pointer hover:bg-accent/30"
                  onClick={() => { setSelectedCell(getCellId(0, ci)); }}>
                  <div className="flex items-center justify-center gap-0.5">
                    {letter}
                    {sheet.sortColumn === ci && (sheet.sortAsc ? <SortAsc className="h-2 w-2 text-primary" /> : <SortDesc className="h-2 w-2 text-primary" />)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: DEFAULT_ROWS }, (_, r) => (
              <tr key={r}>
                <td className={cn("w-12 h-7 bg-black/40 border border-border/30 font-mono text-[10.5px] font-medium tabular-nums text-muted-foreground text-center sticky left-0 z-10 select-none cursor-pointer hover:bg-accent/30",
                  r < sheet.frozenRows && "bg-primary/[0.06]")}
                  onClick={() => setSelectedCell(getCellId(r, 0))}>
                  {r + 1}
                </td>
                {Array.from({ length: DEFAULT_COLS }, (_, c) => {
                  // Skip cells hidden by merge
                  if (isHiddenByMerge(r, c)) return null;
                  
                  const merge = isMergedCell(r, c);
                  const colSpan = merge && r === merge.startRow && c === merge.startCol ? merge.endCol - merge.startCol + 1 : 1;
                  const rowSpan = merge && r === merge.startRow && c === merge.startCol ? merge.endRow - merge.startRow + 1 : 1;
                  
                  const cellId = getCellId(r, c);
                  const isSelected = selectedCell === cellId;
                  const isEditing = editingCell === cellId;
                  const cellStyle = sheet.styles[cellId] || {};
                  const cellValue = sheet.cells[cellId] || '';
                  const condStyle = getConditionalStyle(cellId);
                  
                  let inRange = false;
                  if (selectionRange) {
                    const s = parseCellRef(selectionRange.start);
                    const e = parseCellRef(selectionRange.end);
                    if (s && e) {
                      const minR = Math.min(s[0], e[0]), maxR = Math.max(s[0], e[0]);
                      const minC = Math.min(s[1], e[1]), maxC = Math.max(s[1], e[1]);
                      inRange = r >= minR && r <= maxR && c >= minC && c <= maxC;
                    }
                  }

                  const isFrozen = r < sheet.frozenRows || c < sheet.frozenCols;

                  return (
                    <td
                      key={c}
                      colSpan={colSpan}
                      rowSpan={rowSpan}
                      className={cn(
                        "w-28 h-7 text-[11px] px-1.5 cursor-cell relative transition-colors",
                        isSelected && "ring-2 ring-primary ring-inset z-10 bg-primary/[0.05]",
                        inRange && !isSelected && "bg-primary/[0.08]",
                        !isSelected && !inRange && "hover:bg-accent/10",
                        isFrozen && "bg-primary/[0.03]",
                        cellStyle.borderTop && "border-t-2",
                        cellStyle.borderBottom && "border-b-2",
                        cellStyle.borderLeft && "border-l-2",
                        cellStyle.borderRight && "border-r-2",
                        !cellStyle.borderTop && !cellStyle.borderBottom && !cellStyle.borderLeft && !cellStyle.borderRight && "border border-border/20",
                      )}
                      style={{
                        textAlign: cellStyle.align || 'left',
                        backgroundColor: condStyle?.bg || cellStyle.bg || undefined,
                        color: condStyle?.color || cellStyle.color || undefined,
                        fontSize: cellStyle.fontSize ? `${cellStyle.fontSize}px` : undefined,
                        borderColor: cellStyle.borderColor || '#000000',
                        whiteSpace: cellStyle.wrapText ? 'pre-wrap' : 'nowrap',
                      }}
                      onClick={(e) => handleCellClick(cellId, e)}
                      onDoubleClick={() => handleCellDoubleClick(cellId)}
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { commitEdit(); const ref = parseCellRef(cellId); if (ref) { setSelectedCell(getCellId(Math.min(DEFAULT_ROWS - 1, ref[0] + 1), ref[1])); } }
                            if (e.key === 'Escape') setEditingCell(null);
                            if (e.key === 'Tab') { e.preventDefault(); commitEdit(); const ref = parseCellRef(cellId); if (ref) { setSelectedCell(getCellId(ref[0], Math.min(DEFAULT_COLS - 1, ref[1] + 1))); } }
                          }}
                          className="absolute inset-0 px-1.5 text-[11px] bg-card border-2 border-primary outline-none font-mono rounded-sm"
                        />
                      ) : (
                        <span className={cn(
                          "font-mono truncate block leading-[26px]",
                          cellStyle.bold && "font-bold",
                          cellStyle.italic && "italic",
                          cellStyle.underline && "underline",
                          cellStyle.strikethrough && "line-through",
                          cellValue.startsWith('=') ? "text-foreground" : "text-foreground/80"
                        )}>
                          {formatDisplayValue(cellValue, cellId)}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet Tabs + Status Bar */}
      <div className="flex shrink-0 items-center border-t border-border/60 bg-black/60">
        <div className="flex items-center gap-0 flex-1 overflow-x-auto">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none shrink-0 border-r border-border/60" onClick={addSheet}>
            <Plus className="h-3 w-3" />
          </Button>
          {sheets.map((s, i) => (
            <div key={s.id} className="relative group">
              {editingSheetName === s.id ? (
                <Input autoFocus value={sheetNameValue} onChange={e => setSheetNameValue(e.target.value)}
                  onBlur={() => renameSheet(i, sheetNameValue)}
                  onKeyDown={e => { if (e.key === 'Enter') renameSheet(i, sheetNameValue); if (e.key === 'Escape') setEditingSheetName(null); }}
                  className="h-7 w-24 text-[10px] rounded-none border-x border-border/60 bg-transparent" />
              ) : (
                <button onClick={() => setActiveSheetIdx(i)}
                  onDoubleClick={() => { setEditingSheetName(s.id); setSheetNameValue(s.name); }}
                  className={cn("h-8 px-4 text-[10px] font-medium border-r border-border/60 transition-colors duration-150 flex items-center gap-1.5",
                    i === activeSheetIdx ? "bg-background text-foreground border-t-2" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  )} style={i === activeSheetIdx ? { borderTopColor: s.color } : undefined}>
                  <div className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {s.name}
                </button>
              )}
              {sheets.length > 1 && (
                <button onClick={() => deleteSheet(i)}
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[8px] z-20">
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4 px-4 h-8 font-mono text-[10.5px] tabular-nums text-muted-foreground shrink-0 border-l border-border/60">
          <span>Cells {cellCount}</span>
          <span>Cell {selectedCell}</span>
          {selectionStats && (
            <>
              <span className="text-foreground">Sum {selectionStats.sum.toLocaleString()}</span>
              <span>Avg {selectionStats.avg.toFixed(2)}</span>
              <span>Count {selectionStats.count}</span>
            </>
          )}
          {sheet.frozenRows > 0 && <span>Frozen R{sheet.frozenRows} C{sheet.frozenCols}</span>}
        </div>
      </div>

      {/* Find & Replace Dialog */}
      <Dialog open={showFindReplace} onOpenChange={setShowFindReplace}>
        <DialogContent className="sm:max-w-md rounded-[10px]">
          <DialogHeader><DialogTitle className="text-sm font-semibold flex items-center gap-2"><Search className="h-4 w-4 text-ink-2" /> Find and replace</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1.5">
              <Label className="text-[10px]">Find</Label>
              <Input value={findText} onChange={e => setFindText(e.target.value)} placeholder="Search for…" className="text-xs rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px]">Replace with</Label>
              <Input value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Replace with…" className="text-xs rounded-lg" />
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button variant="ghost" size="sm" onClick={handleFind} className="text-xs rounded-lg">Find next</Button>
            <Button size="sm" onClick={handleReplaceAll} className="text-xs rounded-lg">Replace all</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Conditional Formatting Dialog */}
      <Dialog open={showCondFormat} onOpenChange={setShowCondFormat}>
        <DialogContent className="sm:max-w-md rounded-[10px]">
          <DialogHeader><DialogTitle className="text-sm font-semibold flex items-center gap-2"><Palette className="h-4 w-4 text-ink-2" /> Conditional formatting</DialogTitle></DialogHeader>
          <CondFormatPanel sheet={sheet} updateSheet={updateSheet} selectedCell={selectedCell} onClose={() => setShowCondFormat(false)} />
        </DialogContent>
      </Dialog>

      {/* Formula Helper Dialog */}
      <Dialog open={showFormulaHelper} onOpenChange={setShowFormulaHelper}>
        <DialogContent className="sm:max-w-lg rounded-[10px]">
          <DialogHeader><DialogTitle className="text-sm font-semibold flex items-center gap-2"><Sigma className="h-4 w-4 text-ink-2" /> Formula reference</DialogTitle></DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-3 mt-2">
            {FORMULA_CATEGORIES.map(cat => (
              <div key={cat.name}>
                <h3 className="font-mono text-[10px] font-medium text-muted-foreground uppercase tracking-[0.13em] mb-1.5">{cat.name}</h3>
                <div className="flex flex-wrap gap-1">
                  {cat.formulas.map(f => (
                    <button key={f} onClick={() => { setFormulaBar(`=${f}(`); setShowFormulaHelper(false); formulaInputRef.current?.focus(); }}
                      className="px-2 py-1 text-[10px] font-mono bg-foreground/[0.04] border border-border/60 rounded-md hover:bg-accent/30 transition-colors cursor-pointer">
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Conditional Format Panel ──
function CondFormatPanel({ sheet, updateSheet, selectedCell, onClose }: { sheet: SheetTab; updateSheet: (u: Partial<SheetTab>) => void; selectedCell: string; onClose: () => void }) {
  const [type, setType] = useState<ConditionalFormat['type']>('greater');
  const [value1, setValue1] = useState('');
  const [value2, setValue2] = useState('');
  const [bgColor, setBgColor] = useState('#fef3c7');
  const [textColor, setTextColor] = useState('');

  const addRule = () => {
    const cf: ConditionalFormat = {
      id: `cf-${Date.now()}`,
      range: selectedCell.includes(':') ? selectedCell : `${selectedCell}:${selectedCell}`,
      type, value1, value2, bgColor, textColor
    };
    updateSheet({ conditionalFormats: [...sheet.conditionalFormats, cf] });
    toast.success('Conditional format added');
    onClose();
  };

  return (
    <div className="space-y-3 mt-2">
      <div className="space-y-1.5">
        <Label className="text-[10px]">Condition type</Label>
        <Select value={type} onValueChange={(v: any) => setType(v)}>
          <SelectTrigger className="h-8 text-xs rounded-lg"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-[10px]">
            <SelectItem value="greater" className="text-xs">Greater than</SelectItem>
            <SelectItem value="less" className="text-xs">Less than</SelectItem>
            <SelectItem value="equal" className="text-xs">Equal to</SelectItem>
            <SelectItem value="between" className="text-xs">Between</SelectItem>
            <SelectItem value="text_contains" className="text-xs">Text contains</SelectItem>
            <SelectItem value="empty" className="text-xs">Is empty</SelectItem>
            <SelectItem value="not_empty" className="text-xs">Is not empty</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {type !== 'empty' && type !== 'not_empty' && (
        <div className="flex gap-2">
          <div className="flex-1 space-y-1"><Label className="text-[10px]">Value</Label><Input value={value1} onChange={e => setValue1(e.target.value)} className="text-xs rounded-lg h-8" /></div>
          {type === 'between' && <div className="flex-1 space-y-1"><Label className="text-[10px]">And</Label><Input value={value2} onChange={e => setValue2(e.target.value)} className="text-xs rounded-lg h-8" /></div>}
        </div>
      )}
      <div className="flex gap-2">
        <div className="space-y-1"><Label className="text-[10px]">Background</Label><Input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)} className="h-8 w-16 rounded-lg cursor-pointer" /></div>
        <div className="space-y-1"><Label className="text-[10px]">Text colour</Label><Input type="color" value={textColor || '#000000'} onChange={e => setTextColor(e.target.value)} className="h-8 w-16 rounded-lg cursor-pointer" /></div>
      </div>
      
      {sheet.conditionalFormats.length > 0 && (
        <div className="pt-2 border-t border-border/60">
          <p className="text-[10px] font-medium uppercase tracking-[0.09em] text-muted-foreground/90 mb-1">Active rules</p>
          {sheet.conditionalFormats.map(cf => (
            <div key={cf.id} className="flex items-center gap-2 text-[10px] py-1">
              <div className="h-3 w-3 rounded-sm" style={{ background: cf.bgColor }} />
              <span className="flex-1">{cf.range}: {cf.type} {cf.value1}</span>
              <button onClick={() => updateSheet({ conditionalFormats: sheet.conditionalFormats.filter(x => x.id !== cf.id) })} className="text-destructive"><X className="h-3 w-3" /></button>
            </div>
          ))}
        </div>
      )}
      
      <DialogFooter>
        <Button variant="ghost" size="sm" onClick={onClose} className="text-xs rounded-lg">Cancel</Button>
        <Button size="sm" onClick={addRule} className="text-xs rounded-lg">Add rule</Button>
      </DialogFooter>
    </div>
  );
}
