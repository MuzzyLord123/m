import { useState } from 'react';
import { useCAD } from './CADContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Layers, Plus, Trash2, Eye, EyeOff, Lock, Unlock } from 'lucide-react';
import { generateId } from './cadGeometry';
import { cn } from '@/lib/utils';

export function CADLayerManager() {
  const { state, dispatch } = useCAD();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#ff8800');

  const handleAdd = () => {
    if (!newName.trim()) return;
    dispatch({
      type: 'ADD_LAYER',
      payload: {
        id: generateId(),
        name: newName.trim(),
        color: newColor,
        lineType: 'solid',
        lineWeight: 1,
        visible: true,
        locked: false,
        frozen: false,
        transparency: 0,
      },
    });
    setNewName('');
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
          <Layers className="h-3 w-3" /> Layers
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" /> Layer Manager
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-3">
          <Input
            placeholder="Layer name..."
            className="h-8 text-xs"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <input
            type="color"
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            className="h-8 w-8 rounded border border-border cursor-pointer"
          />
          <Button size="sm" className="h-8" onClick={handleAdd}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>

        <ScrollArea className="max-h-64">
          <div className="space-y-1">
            {state.layers.map(layer => (
              <div
                key={layer.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors cursor-pointer",
                  layer.id === state.activeLayerId ? "bg-accent" : "hover:bg-accent/50"
                )}
                onClick={() => dispatch({ type: 'SET_ACTIVE_LAYER', payload: layer.id })}
              >
                <span className="h-3 w-3 rounded-full border border-border flex-shrink-0" style={{ backgroundColor: layer.color }} />
                <span className="flex-1 font-medium truncate">{layer.name}</span>
                <span className="text-[9px] text-muted-foreground capitalize">{layer.lineType}</span>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={e => { e.stopPropagation(); dispatch({ type: 'UPDATE_LAYER', payload: { id: layer.id, changes: { visible: !layer.visible } } }); }}
                >
                  {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={e => { e.stopPropagation(); dispatch({ type: 'UPDATE_LAYER', payload: { id: layer.id, changes: { locked: !layer.locked } } }); }}
                >
                  {layer.locked ? <Lock className="h-3 w-3 text-destructive" /> : <Unlock className="h-3 w-3" />}
                </Button>

                {state.layers.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    onClick={e => { e.stopPropagation(); dispatch({ type: 'DELETE_LAYER', payload: layer.id }); }}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
