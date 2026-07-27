import { WorkflowNode } from './types';
import {
  Zap, Globe, Send, Code, GitBranch, GitMerge, Edit3, Clock,
  Mail, Database, Sparkles, ToggleLeft, Shuffle, Filter, Repeat,
  ArrowRight, StickyNote, X
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Zap, Globe, Send, Code, GitBranch, GitMerge, Edit3, Clock,
  Mail, Database, Sparkles, ToggleLeft, Shuffle, Filter, Repeat,
  ArrowRight, StickyNote,
};

interface Props {
  node: WorkflowNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onPortMouseDown: (nodeId: string, portId: string, portType: 'input' | 'output', e: React.MouseEvent) => void;
  onPortMouseUp: (nodeId: string, portId: string, portType: 'input' | 'output') => void;
  onDelete: () => void;
}

export function WorkflowNodeComponent({ node, isSelected, onMouseDown, onPortMouseDown, onPortMouseUp, onDelete }: Props) {
  const Icon = iconMap[node.icon] || Zap;

  return (
    <div
      className="absolute group"
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
      }}
      onMouseDown={onMouseDown}
    >
      <div
        className={`
          relative w-full h-full rounded-xl border-2 transition-shadow cursor-pointer
          bg-card shadow-lg hover:shadow-xl
          ${isSelected ? 'ring-2 ring-primary shadow-xl' : ''}
        `}
        style={{ borderColor: node.color }}
      >
        {/* Delete button */}
        <button
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <X className="h-3 w-3" />
        </button>

        {/* Header stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-[10px]"
          style={{ backgroundColor: node.color }}
        />

        {/* Content */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2 h-full">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${node.color}20` }}
          >
            <Icon className="h-4 w-4" style={{ color: node.color }} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">{node.label}</div>
            {node.description && (
              <div className="text-[10px] text-muted-foreground truncate">{node.description}</div>
            )}
          </div>
        </div>

        {/* Input ports */}
        {node.inputs.map((port, i) => {
          const spacing = node.height / (node.inputs.length + 1);
          return (
            <div
              key={port.id}
              className="absolute -left-[7px] w-3.5 h-3.5 rounded-full border-2 border-background bg-muted-foreground hover:bg-primary hover:scale-125 transition-all cursor-crosshair z-10"
              style={{ top: spacing * (i + 1) - 7 }}
              onMouseDown={(e) => onPortMouseDown(node.id, port.id, 'input', e)}
              onMouseUp={() => onPortMouseUp(node.id, port.id, 'input')}
              title={port.label}
            />
          );
        })}

        {/* Output ports */}
        {node.outputs.map((port, i) => {
          const spacing = node.height / (node.outputs.length + 1);
          return (
            <div
              key={port.id}
              className="absolute -right-[7px] w-3.5 h-3.5 rounded-full border-2 border-background bg-muted-foreground hover:bg-primary hover:scale-125 transition-all cursor-crosshair z-10"
              style={{ top: spacing * (i + 1) - 7 }}
              onMouseDown={(e) => onPortMouseDown(node.id, port.id, 'output', e)}
              onMouseUp={() => onPortMouseUp(node.id, port.id, 'output')}
              title={port.label}
            />
          );
        })}
      </div>
    </div>
  );
}
