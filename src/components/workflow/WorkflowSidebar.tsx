import { useState } from 'react';
import { NODE_TEMPLATES } from './types';
import {
  Zap, Globe, Send, Code, GitBranch, GitMerge, Edit3, Clock,
  Mail, Database, Sparkles, ToggleLeft, Shuffle, Filter, Repeat,
  ArrowRight, StickyNote, Search, Plus, X, ChevronDown
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Globe, Send, Code, GitBranch, GitMerge, Edit3, Clock,
  Mail, Database, Sparkles, ToggleLeft, Shuffle, Filter, Repeat,
  ArrowRight, StickyNote,
};

interface Props {
  onDragStart: (templateIndex: number) => void;
  onAddNode: (templateIndex: number) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

const categories = [
  { label: 'Triggers', types: ['trigger', 'webhook'] },
  { label: 'Logic', types: ['if', 'switch', 'merge', 'loop', 'wait'] },
  { label: 'Data', types: ['transform', 'filter', 'set'] },
  { label: 'Actions', types: ['http-request', 'code', 'email', 'database', 'respond'] },
  { label: 'AI', types: ['ai'] },
  { label: 'Utility', types: ['note'] },
];

function NodeList({ search, onDragStart, onAddNode, onClose, isMobile }: {
  search: string;
  onDragStart: (idx: number) => void;
  onAddNode: (idx: number) => void;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const filtered = NODE_TEMPLATES.filter(t =>
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-3 space-y-4">
      {categories.map(cat => {
        const catNodes = filtered.filter(t => cat.types.includes(t.type));
        if (catNodes.length === 0) return null;
        return (
          <div key={cat.label}>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              {cat.label}
            </h3>
            <div className={isMobile ? "grid grid-cols-2 gap-1.5" : "space-y-1"}>
              {catNodes.map((template) => {
                const idx = NODE_TEMPLATES.indexOf(template);
                const Icon = iconMap[template.icon] || Zap;
                return (
                  <div
                    key={template.type}
                    draggable={!isMobile}
                    onDragStart={() => onDragStart(idx)}
                    onClick={() => { onAddNode(idx); if (isMobile) onClose?.(); }}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg border border-border/50 bg-card hover:bg-accent/50 cursor-pointer active:scale-[0.97] transition-all group"
                  >
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${template.color}20` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: template.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-foreground">{template.label}</div>
                      {!isMobile && (
                        <div className="text-[10px] text-muted-foreground truncate">{template.description}</div>
                      )}
                    </div>
                    <Plus className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function WorkflowSidebar({ onDragStart, onAddNode, isMobile, onClose }: Props) {
  const [search, setSearch] = useState('');

  // Mobile: bottom sheet overlay
  if (isMobile) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />

          {/* Sheet */}
          <motion.div
            className="relative bg-card border-t border-border rounded-t-2xl flex flex-col"
            style={{ maxHeight: '70vh' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Handle + header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-1 rounded-full bg-muted-foreground/30 mx-auto absolute left-1/2 -translate-x-1/2 top-1.5" />
                <h3 className="text-sm font-semibold">Add Node</h3>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Search */}
            <div className="px-3 py-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search nodes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>

            {/* Scrollable nodes */}
            <ScrollArea className="flex-1 overflow-auto">
              <NodeList
                search={search}
                onDragStart={onDragStart}
                onAddNode={onAddNode}
                onClose={onClose}
                isMobile
              />
            </ScrollArea>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Desktop: sidebar
  return (
    <div className="w-64 border-r border-border bg-card/50 flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <NodeList search={search} onDragStart={onDragStart} onAddNode={onAddNode} />
      </ScrollArea>
    </div>
  );
}
