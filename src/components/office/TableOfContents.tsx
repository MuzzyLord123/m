import { useState, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, ChevronRight, ChevronDown, X, Copy, FileText, Search, ListOrdered, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface TocItem {
  level: number;
  text: string;
  pos: number;
  id: string;
  number?: string;
}

interface TableOfContentsProps {
  editor: Editor;
  show: boolean;
  onClose: () => void;
}

function computeNumbering(items: TocItem[]): TocItem[] {
  const counters = [0, 0, 0, 0, 0, 0];
  return items.map(item => {
    const idx = item.level - 1;
    counters[idx]++;
    // Reset deeper levels
    for (let i = idx + 1; i < 6; i++) counters[i] = 0;
    const parts = counters.slice(0, idx + 1).filter((_, i) => i === 0 || counters[i] > 0 || i <= idx);
    return { ...item, number: parts.join('.') };
  });
}

export function TableOfContents({ editor, show, onClose }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNumbers, setShowNumbers] = useState(true);
  const [collapsedLevels, setCollapsedLevels] = useState<Set<number>>(new Set());

  const buildToc = useCallback(() => {
    if (!editor) return;
    const tocItems: TocItem[] = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        tocItems.push({
          level: node.attrs.level,
          text: node.textContent || 'Untitled',
          pos,
          id: `toc-${pos}`,
        });
      }
    });
    setItems(computeNumbering(tocItems));
  }, [editor]);

  useEffect(() => {
    buildToc();
    if (!editor) return;
    editor.on('update', buildToc);
    return () => { editor.off('update', buildToc); };
  }, [editor, buildToc]);

  const navigateTo = (pos: number, id: string) => {
    editor.chain().focus().setTextSelection(pos).run();
    setActiveId(id);
    const domAtPos = editor.view.domAtPos(pos);
    const el = domAtPos.node instanceof HTMLElement ? domAtPos.node : domAtPos.node.parentElement;
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const insertTocInDoc = () => {
    if (items.length === 0) {
      toast.error('No headings found to generate TOC');
      return;
    }
    const tocHtml = items.map(item => {
      const indent = '&nbsp;&nbsp;'.repeat((item.level - 1) * 2);
      const num = showNumbers ? `${item.number}. ` : '';
      return `<p>${indent}${item.level === 1 ? '<strong>' : ''}${num}${item.text}${item.level === 1 ? '</strong>' : ''}</p>`;
    }).join('');
    
    const fullToc = `<h2>Table of Contents</h2>${tocHtml}<hr>`;
    editor.chain().focus().setTextSelection(0).insertContent(fullToc).run();
    toast.success('Table of Contents inserted');
  };

  const copyTocText = () => {
    const text = items.map(item => {
      const indent = '  '.repeat(item.level - 1);
      const num = showNumbers ? `${item.number}. ` : '';
      return `${indent}${num}${item.text}`;
    }).join('\n');
    navigator.clipboard.writeText(text);
    toast.success('TOC copied to clipboard');
  };

  const toggleLevel = (level: number) => {
    setCollapsedLevels(prev => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    let list = items;
    if (searchQuery) {
      list = list.filter(i => i.text.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    // Filter collapsed children
    if (collapsedLevels.size > 0 && !searchQuery) {
      const result: TocItem[] = [];
      let skipBelow = Infinity;
      for (const item of list) {
        if (item.level <= skipBelow) {
          skipBelow = Infinity;
          result.push(item);
          if (collapsedLevels.has(item.level)) {
            skipBelow = item.level;
          }
        }
      }
      return result;
    }
    return list;
  }, [items, searchQuery, collapsedLevels]);

  const usedLevels = useMemo(() => {
    const levels = new Set(items.map(i => i.level));
    return Array.from(levels).sort();
  }, [items]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 240, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 border-l border-border/30 bg-card/50 overflow-hidden"
        >
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <BookOpen className="h-3 w-3" /> Table of Contents
              </h3>
              <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md" onClick={onClose}>
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex gap-1 mb-2">
              <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-md flex-1 gap-1" onClick={insertTocInDoc} disabled={items.length === 0}>
                <FileText className="h-2.5 w-2.5" /> Insert
              </Button>
              <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-md flex-1 gap-1" onClick={copyTocText} disabled={items.length === 0}>
                <Copy className="h-2.5 w-2.5" /> Copy
              </Button>
              <Button
                variant={showNumbers ? "default" : "outline"}
                size="sm"
                className="h-6 text-[9px] rounded-md gap-1 px-2"
                onClick={() => setShowNumbers(!showNumbers)}
                title="Toggle numbering"
              >
                <Hash className="h-2.5 w-2.5" />
              </Button>
            </div>

            {/* Level filters */}
            {usedLevels.length > 1 && (
              <div className="flex gap-1 mb-2">
                {usedLevels.map(level => (
                  <button
                    key={level}
                    onClick={() => toggleLevel(level)}
                    className={cn(
                      "px-1.5 py-0.5 text-[8px] rounded-md font-bold transition-colors",
                      collapsedLevels.has(level)
                        ? "bg-muted text-muted-foreground/50 line-through"
                        : "bg-primary/10 text-primary"
                    )}
                  >
                    H{level}
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground/40" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Filter headings…"
                className="h-6 text-[9px] pl-6 rounded-md"
              />
            </div>

            <ScrollArea className="h-[calc(100vh-300px)]">
              {filteredItems.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-[10px] text-muted-foreground/50 italic">
                    {searchQuery ? 'No matching headings' : 'Add headings to generate TOC'}
                  </p>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const hasChildren = items.some(i => i.level > item.level && items.indexOf(i) > items.indexOf(item));
                    const isCollapsed = collapsedLevels.has(item.level);
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateTo(item.pos, item.id)}
                        className={cn(
                          "w-full text-left py-1.5 rounded-lg hover:bg-accent/50 transition-colors flex items-center gap-1 group",
                          activeId === item.id && "bg-primary/10 text-primary"
                        )}
                        style={{ paddingLeft: `${(item.level - 1) * 14 + 8}px`, paddingRight: 8 }}
                      >
                        {hasChildren ? (
                          <span
                            onClick={(e) => { e.stopPropagation(); toggleLevel(item.level); }}
                            className="shrink-0"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/50" />
                            ) : (
                              <ChevronDown className="h-2.5 w-2.5 text-muted-foreground/50" />
                            )}
                          </span>
                        ) : (
                          <ChevronRight className={cn(
                            "h-2.5 w-2.5 shrink-0 transition-transform",
                            activeId === item.id ? "text-primary rotate-90" : "text-muted-foreground/30 group-hover:text-muted-foreground"
                          )} />
                        )}
                        {showNumbers && item.number && (
                          <span className="text-[8px] font-mono text-muted-foreground/50 shrink-0 tabular-nums">{item.number}</span>
                        )}
                        <span className={cn(
                          "truncate",
                          item.level === 1 && "text-[11px] font-semibold",
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

            {items.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/20 space-y-1.5">
                {/* Heading level distribution */}
                {(() => {
                  const levels = [1, 2, 3, 4, 5, 6];
                  const counts = levels.map(l => items.filter(i => i.level === l).length);
                  const max = Math.max(...counts, 1);
                  const activeLevels = levels.filter((_, i) => counts[i] > 0);
                  return (
                    <div className="flex items-end gap-px h-5">
                      {activeLevels.map(l => {
                        const count = counts[l - 1];
                        const colors = ['', 'hsl(var(--primary))', 'hsl(var(--primary) / 0.7)', 'hsl(var(--primary) / 0.5)', 'hsl(var(--primary) / 0.35)', 'hsl(var(--primary) / 0.25)', 'hsl(var(--primary) / 0.15)'];
                        return (
                          <div key={l} className="flex-1 flex flex-col items-center gap-0.5" title={`H${l}: ${count}`}>
                            <div
                              className="w-full rounded-sm transition-all"
                              style={{
                                height: `${Math.max(2, (count / max) * 16)}px`,
                                backgroundColor: colors[l],
                              }}
                            />
                            <span className="text-[6px] font-bold text-muted-foreground/40">H{l}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                <p className="text-[8px] text-muted-foreground/40 text-center">
                  {items.length} heading{items.length !== 1 ? 's' : ''} • {items.filter(i => i.level === 1).length} sections
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
