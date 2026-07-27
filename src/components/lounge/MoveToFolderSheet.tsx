import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FolderOpen, FolderMinus, FolderPlus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SidebarFolder, FOLDER_COLORS } from '@/hooks/useSidebarLayout';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MoveToFolderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemLabel: string;
  folders: SidebarFolder[];
  currentFolderId: string | null;
  onMoveToFolder: (folderId: string) => void;
  onRemoveFromFolder: () => void;
  onCreateFolder: (name: string, color: string) => string | void;
}

export function MoveToFolderSheet({
  open,
  onOpenChange,
  itemLabel,
  folders,
  currentFolderId,
  onMoveToFolder,
  onRemoveFromFolder,
  onCreateFolder,
}: MoveToFolderSheetProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(FOLDER_COLORS[4].value);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const id = onCreateFolder(name, newColor);
    if (typeof id === 'string') onMoveToFolder(id);
    setCreating(false);
    setNewName('');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5 pb-3 text-left">
          <SheetTitle className="text-base font-semibold">Move to folder</SheetTitle>
          <p className="text-[12px] text-muted-foreground truncate">{itemLabel}</p>
        </SheetHeader>

        <div className="px-3 pb-6 space-y-1">
          {currentFolderId && (
            <button
              onClick={() => { onRemoveFromFolder(); onOpenChange(false); }}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-accent/50 active:bg-accent text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                <FolderMinus className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-[13px] font-medium">Remove from folder</span>
            </button>
          )}

          {folders.length > 0 && (
            <div className="pt-1 pb-1 px-3 text-[10px] uppercase tracking-wider text-muted-foreground/60">
              Folders
            </div>
          )}

          {folders.map((f) => {
            const isCurrent = f.id === currentFolderId;
            return (
              <button
                key={f.id}
                onClick={() => { if (!isCurrent) onMoveToFolder(f.id); onOpenChange(false); }}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-left transition-colors",
                  isCurrent ? "bg-accent/40" : "hover:bg-accent/50 active:bg-accent"
                )}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${f.color}22`, border: `1px solid ${f.color}40` }}
                >
                  <FolderOpen className="w-4 h-4" style={{ color: f.color }} />
                </div>
                <span className="flex-1 text-[13px] font-medium truncate">{f.name}</span>
                {isCurrent && <Check className="w-4 h-4 text-primary" />}
              </button>
            );
          })}

          <div className="pt-2 pb-1 px-3 text-[10px] uppercase tracking-wider text-muted-foreground/60">
            New
          </div>

          {creating ? (
            <div className="px-3 py-3 space-y-3">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Folder name"
                autoFocus
                className="h-10 rounded-xl"
              />
              <div className="flex flex-wrap gap-2">
                {FOLDER_COLORS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setNewColor(c.value)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      newColor === c.value ? "ring-2 ring-offset-2 ring-offset-background ring-primary" : ""
                    )}
                    style={{ backgroundColor: c.value }}
                    aria-label={c.name}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setCreating(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="flex-1" onClick={handleCreate} disabled={!newName.trim()}>
                  Create & move
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-accent/50 active:bg-accent text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FolderPlus className="w-4 h-4 text-primary" />
              </div>
              <span className="flex-1 text-[13px] font-medium">Create new folder</span>
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
