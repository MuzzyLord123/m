import { useState, useEffect, useCallback, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import {
  Heading1, Heading2, Heading3, List, ListOrdered, CheckSquare,
  Quote, Code2, Minus, Table as TableIcon, ImageIcon,
  Calendar, Hash, SeparatorHorizontal, Pilcrow, AlertCircle,
  LayoutList, Clock, AlignLeft
} from 'lucide-react';

interface SlashCommandMenuProps {
  editor: Editor;
}

interface CommandItem {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  category: string;
  action: (editor: Editor) => void;
}

const COMMANDS: CommandItem[] = [
  { title: 'Paragraph', description: 'Plain text block', icon: Pilcrow, color: 'text-muted-foreground', category: 'Basic', action: (e) => e.chain().focus().setParagraph().run() },
  { title: 'Heading 1', description: 'Large section heading', icon: Heading1, color: 'text-blue-500', category: 'Basic', action: (e) => e.chain().focus().toggleHeading({ level: 1 }).run() },
  { title: 'Heading 2', description: 'Medium section heading', icon: Heading2, color: 'text-blue-400', category: 'Basic', action: (e) => e.chain().focus().toggleHeading({ level: 2 }).run() },
  { title: 'Heading 3', description: 'Small section heading', icon: Heading3, color: 'text-blue-300', category: 'Basic', action: (e) => e.chain().focus().toggleHeading({ level: 3 }).run() },
  { title: 'Bullet List', description: 'Unordered list', icon: List, color: 'text-orange-500', category: 'Lists', action: (e) => e.chain().focus().toggleBulletList().run() },
  { title: 'Numbered List', description: 'Ordered list', icon: ListOrdered, color: 'text-orange-400', category: 'Lists', action: (e) => e.chain().focus().toggleOrderedList().run() },
  { title: 'Task List', description: 'Checklist items', icon: CheckSquare, color: 'text-green-500', category: 'Lists', action: (e) => e.chain().focus().toggleTaskList().run() },
  { title: 'Block Quote', description: 'Indented quote block', icon: Quote, color: 'text-purple-500', category: 'Blocks', action: (e) => e.chain().focus().toggleBlockquote().run() },
  { title: 'Code Block', description: 'Code with syntax highlighting', icon: Code2, color: 'text-emerald-500', category: 'Blocks', action: (e) => e.chain().focus().toggleCodeBlock().run() },
  { title: 'Divider', description: 'Horizontal separator', icon: Minus, color: 'text-muted-foreground', category: 'Blocks', action: (e) => e.chain().focus().setHorizontalRule().run() },
  { title: 'Table', description: 'Insert a 3×3 table', icon: TableIcon, color: 'text-indigo-500', category: 'Blocks', action: (e) => e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { title: 'Callout', description: 'Info callout block', icon: AlertCircle, color: 'text-amber-500', category: 'Blocks', action: (e) => e.chain().focus().toggleBlockquote().run() },
  { title: 'Date', description: 'Insert current date', icon: Calendar, color: 'text-cyan-500', category: 'Inline', action: (e) => e.chain().focus().insertContent(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })).run() },
  { title: 'Time', description: 'Insert current time', icon: Clock, color: 'text-cyan-400', category: 'Inline', action: (e) => e.chain().focus().insertContent(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })).run() },
  { title: 'Lorem Ipsum', description: 'Insert placeholder text', icon: AlignLeft, color: 'text-muted-foreground', category: 'Inline', action: (e) => e.chain().focus().insertContent('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.').run() },
  { title: 'Page Break', description: 'Break to new page', icon: SeparatorHorizontal, color: 'text-muted-foreground', category: 'Blocks', action: (e) => e.chain().focus().setHorizontalRule().insertContent({ type: 'paragraph' }).run() },
];

const USAGE_KEY = 'slash_cmd_usage';

function getUsageCounts(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(USAGE_KEY) || '{}'); } catch { return {}; }
}

function trackUsage(title: string) {
  const counts = getUsageCounts();
  counts[title] = (counts[title] || 0) + 1;
  try { localStorage.setItem(USAGE_KEY, JSON.stringify(counts)); } catch {}
}

export function SlashCommandMenu({ editor }: SlashCommandMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const slashPosRef = useRef<number | null>(null);

  const usageCounts = getUsageCounts();

  const filteredCommands = COMMANDS.filter(cmd =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  // Show frequently used commands at top when no query
  const frequentCommands = !query
    ? [...filteredCommands].filter(c => (usageCounts[c.title] || 0) > 0).sort((a, b) => (usageCounts[b.title] || 0) - (usageCounts[a.title] || 0)).slice(0, 3)
    : [];

  const categories = [...new Set(filteredCommands.map(c => c.category))];

  const executeCommand = useCallback((cmd: CommandItem) => {
    if (slashPosRef.current !== null) {
      const from = slashPosRef.current;
      const to = editor.state.selection.from;
      editor.chain().focus().deleteRange({ from, to }).run();
    }
    cmd.action(editor);
    trackUsage(cmd.title);
    setIsOpen(false);
    setQuery('');
    slashPosRef.current = null;
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        if (filteredCommands[selectedIndex]) {
          executeCommand(filteredCommands[selectedIndex]);
        }
      } else if (event.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
        slashPosRef.current = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, selectedIndex, filteredCommands, executeCommand]);

  useEffect(() => {
    if (!editor) return;

    const handleTransaction = () => {
      const { state } = editor;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(Math.max(0, from - 50), from, '\n');
      
      // Check if there's a slash command pattern
      const slashMatch = textBefore.match(/\/([a-zA-Z0-9 ]*)$/);
      
      if (slashMatch) {
        const slashPos = from - slashMatch[0].length;
        // Only trigger at start of line or after whitespace
        const charBefore = slashPos > 0 ? state.doc.textBetween(slashPos - 1, slashPos) : '';
        if (slashPos === 0 || charBefore === '\n' || charBefore === '' || /\s/.test(charBefore)) {
          slashPosRef.current = slashPos;
          setQuery(slashMatch[1]);
          setSelectedIndex(0);
          
          // Get cursor position for menu placement
          const coords = editor.view.coordsAtPos(from);
          const editorRect = editor.view.dom.closest('.overflow-auto')?.getBoundingClientRect();
          if (editorRect) {
            setPosition({
              top: coords.bottom - editorRect.top + 4,
              left: coords.left - editorRect.left,
            });
          }
          setIsOpen(true);
          return;
        }
      }
      
      if (isOpen) {
        setIsOpen(false);
        setQuery('');
        slashPosRef.current = null;
      }
    };

    editor.on('transaction', handleTransaction);
    return () => { editor.off('transaction', handleTransaction); };
  }, [editor, isOpen]);

  if (!isOpen || filteredCommands.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-50 w-64 max-h-80 overflow-auto bg-popover border border-border/50 rounded-xl shadow-2xl backdrop-blur-xl"
      style={{ top: position.top, left: Math.max(8, position.left) }}
    >
      <div className="p-1.5">
        {frequentCommands.length > 0 && (
          <div>
            <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest px-2 pt-1.5 pb-0.5">Frequent</p>
            {frequentCommands.map((cmd) => {
              const globalIndex = filteredCommands.indexOf(cmd);
              const Icon = cmd.icon;
              return (
                <button
                  key={`freq-${cmd.title}`}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(globalIndex)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-left transition-colors",
                    globalIndex === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
                  )}
                >
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-primary/10 shrink-0">
                    <Icon className={cn("h-3.5 w-3.5", cmd.color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-medium truncate">{cmd.title}</div>
                    <div className="text-[9px] text-muted-foreground truncate">{cmd.description}</div>
                  </div>
                  <span className="text-[7px] text-muted-foreground/50 tabular-nums">{usageCounts[cmd.title]}×</span>
                </button>
              );
            })}
            <div className="h-px bg-border/20 my-1" />
          </div>
        )}
        {categories.map(cat => (
          <div key={cat}>
            <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest px-2 pt-1.5 pb-0.5">{cat}</p>
            {filteredCommands
              .filter(c => c.category === cat)
              .map((cmd, i) => {
                const globalIndex = filteredCommands.indexOf(cmd);
                const Icon = cmd.icon;
                return (
                  <button
                    key={cmd.title}
                    onClick={() => executeCommand(cmd)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-left transition-colors",
                      globalIndex === selectedIndex ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center bg-muted/60 shrink-0")}>
                      <Icon className={cn("h-3.5 w-3.5", cmd.color)} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[11px] font-medium truncate">{cmd.title}</div>
                      <div className="text-[9px] text-muted-foreground truncate">{cmd.description}</div>
                    </div>
                  </button>
                );
              })}
          </div>
        ))}
      </div>
    </div>
  );
}
