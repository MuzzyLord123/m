import { ArrowLeft, Save, PanelLeftClose, PanelLeft, RotateCcw, Power, Play, Eye, Workflow, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Props {
  name: string;
  onNameChange: (name: string) => void;
  isActive: boolean;
  onToggleActive: () => void;
  onSave: () => void;
  isSaving: boolean;
  onBack?: () => void;
  onResetView: () => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  nodeCount: number;
  connectionCount: number;
  workflowType?: 'execute' | 'visual';
  onToggleType?: () => void;
  showExecution?: boolean;
  onToggleExecution?: () => void;
}

export function WorkflowToolbar({
  name, onNameChange, isActive, onToggleActive,
  onSave, isSaving, onBack, onResetView,
  showSidebar, onToggleSidebar, nodeCount, connectionCount,
  workflowType = 'execute', onToggleType, showExecution, onToggleExecution
}: Props) {
  return (
    <div className="h-12 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-2 sm:px-3 gap-1.5 sm:gap-2 shrink-0">
      {onBack && (
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
      )}

      {/* Desktop sidebar toggle */}
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hidden sm:flex" onClick={onToggleSidebar}>
        {showSidebar ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
      </Button>

      <div className="h-5 w-px bg-border mx-0.5 hidden sm:block" />

      <Input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        className="h-8 w-32 sm:w-48 text-sm font-medium border-transparent hover:border-border focus:border-border bg-transparent min-w-0"
      />

      {/* Desktop mode toggle */}
      {onToggleType && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs hidden sm:flex"
          onClick={onToggleType}
        >
          {workflowType === 'execute' ? <Workflow className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {workflowType === 'execute' ? 'Execute' : 'Visual'}
        </Button>
      )}

      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
        {/* Desktop: full controls */}
        <Badge variant="secondary" className="text-[10px] font-mono hidden sm:inline-flex">
          {nodeCount} nodes · {connectionCount} connections
        </Badge>

        {workflowType === 'execute' && (
          <>
            <div className="items-center gap-1.5 hidden sm:flex">
              <Power className="h-3.5 w-3.5 text-muted-foreground" />
              <Switch checked={isActive} onCheckedChange={onToggleActive} className="scale-75" />
              <span className="text-xs text-muted-foreground">{isActive ? 'Active' : 'Inactive'}</span>
            </div>

            {onToggleExecution && (
              <Button
                variant={showExecution ? 'default' : 'outline'}
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={onToggleExecution}
              >
                <Play className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Execute</span>
              </Button>
            )}
          </>
        )}

        <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex" onClick={onResetView} title="Reset view">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>

        <Button size="sm" className="h-8 gap-1.5" onClick={onSave} disabled={isSaving}>
          <Save className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
        </Button>

        {/* Mobile overflow menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-xs gap-2" onClick={onResetView}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset View
            </DropdownMenuItem>
            {onToggleType && (
              <DropdownMenuItem className="text-xs gap-2" onClick={onToggleType}>
                {workflowType === 'execute' ? <Eye className="h-3.5 w-3.5" /> : <Workflow className="h-3.5 w-3.5" />}
                {workflowType === 'execute' ? 'Visual Mode' : 'Execute Mode'}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs gap-2" onClick={onToggleActive}>
              <Power className="h-3.5 w-3.5" />
              {isActive ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-[10px] text-muted-foreground">
              {nodeCount} nodes · {connectionCount} connections
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
