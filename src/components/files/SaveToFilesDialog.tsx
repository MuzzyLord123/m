import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Folder, FolderPlus, ChevronRight, ChevronDown, HardDrive, ArrowLeft,
  FileText, Save, Download, X, Home
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export interface SaveToFilesOptions {
  /** Name of the file to save */
  fileName: string;
  /** Type of file: 'website', 'cad_project', 'pdf', 'document', etc. */
  fileType: string;
  /** Source app: 'workshop', 'cad-studio', 'pdf-studio', 'docs', etc. */
  appSource: string;
  /** Source ID in the original table */
  sourceId?: string;
  /** Route to open this in the source app */
  sourceRoute?: string;
  /** Optional description */
  description?: string;
  /** Optional metadata (word count, page count, etc.) */
  metadata?: Record<string, any>;
  /** Optional file size in bytes */
  fileSizeBytes?: number;
  /** Callback for "Save to Device" (export/download) */
  onSaveToDevice?: () => void;
}

interface SaveToFilesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  options: SaveToFilesOptions;
  onSaved?: (fileId: string) => void;
}

interface FolderNode {
  id: string;
  name: string;
  fullPath: string;
  parentPath: string;
  color?: string;
  children: FolderNode[];
  expanded?: boolean;
}

export function SaveToFilesDialog({ open, onOpenChange, options, onSaved }: SaveToFilesDialogProps) {
  const { user } = useAuth();
  const [fileName, setFileName] = useState(options.fileName);
  const [currentPath, setCurrentPath] = useState('/');
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFileName(options.fileName);
  }, [options.fileName]);

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from('platform_folders')
      .select('*')
      .eq('user_id', user.id)
      .order('folder_name');

    const tree = buildFolderTree(data || []);
    setFolders(tree);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (open) fetchFolders();
  }, [open, fetchFolders]);

  function buildFolderTree(flat: any[]): FolderNode[] {
    const map: Record<string, FolderNode> = {};
    flat.forEach(f => {
      map[f.full_path] = {
        id: f.id,
        name: f.folder_name,
        fullPath: f.full_path,
        parentPath: f.parent_path,
        color: f.color,
        children: [],
      };
    });
    const roots: FolderNode[] = [];
    Object.values(map).forEach(node => {
      if (node.parentPath === '/' && map[node.parentPath] === undefined) {
        roots.push(node);
      } else if (map[node.parentPath]) {
        map[node.parentPath].children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }

  const toggleExpand = (path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const createFolder = async () => {
    if (!newFolderName.trim() || !user?.id) return;
    setCreatingFolder(true);
    const sanitized = newFolderName.trim().replace(/[/\\]/g, '-');
    const fullPath = currentPath === '/' ? `/${sanitized}` : `${currentPath}/${sanitized}`;

    const { error } = await supabase.from('platform_folders').insert({
      user_id: user.id,
      folder_name: sanitized,
      parent_path: currentPath,
      full_path: fullPath,
    });

    if (error) {
      if (error.code === '23505') toast.error('Folder already exists');
      else toast.error('Failed to create folder');
    } else {
      setNewFolderName('');
      setExpandedPaths(prev => new Set([...prev, currentPath]));
      await fetchFolders();
      toast.success(`Folder "${sanitized}" created`);
    }
    setCreatingFolder(false);
  };

  const saveToFiles = async () => {
    if (!user?.id || !fileName.trim()) return;
    setSaving(true);

    const { data, error } = await supabase.from('platform_files').insert({
      user_id: user.id,
      file_name: fileName.trim(),
      file_type: options.fileType,
      app_source: options.appSource,
      source_id: options.sourceId || null,
      source_route: options.sourceRoute || null,
      folder_path: currentPath,
      description: options.description || null,
      metadata: options.metadata || {},
      file_size_bytes: options.fileSizeBytes || 0,
    }).select('id').single();

    if (error) {
      toast.error('Failed to save file');
      console.error(error);
    } else {
      toast.success(`"${fileName}" saved to Files`);
      onSaved?.(data.id);
      onOpenChange(false);
    }
    setSaving(false);
  };

  // Breadcrumb parts
  const pathParts = currentPath === '/' ? [] : currentPath.split('/').filter(Boolean);

  const renderFolder = (node: FolderNode, depth = 0) => {
    const isExpanded = expandedPaths.has(node.fullPath);
    const isSelected = currentPath === node.fullPath;
    return (
      <div key={node.fullPath}>
        <button
          onClick={() => {
            setCurrentPath(node.fullPath);
            if (node.children.length > 0) toggleExpand(node.fullPath);
          }}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-[12px]",
            isSelected
              ? "bg-primary/10 text-primary font-semibold"
              : "hover:bg-accent/40 text-foreground/80"
          )}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {node.children.length > 0 ? (
            isExpanded ? <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <span className="w-3 shrink-0" />
          )}
          <Folder className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-primary" : "text-amber-500")} />
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && node.children.length > 0 && (
          <div>
            {node.children.map(child => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden rounded-2xl border-border/30 bg-background">
        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-muted/30 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center shadow-sm">
              <Save className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Save to Files</h2>
              <p className="text-[10px] text-muted-foreground">Choose a location in Quooro Files</p>
            </div>
          </div>
        </div>

        {/* Breadcrumb */}
        <div className="px-5 py-2.5 flex items-center gap-1 bg-card/40 border-b border-border/10 overflow-x-auto">
          <button
            onClick={() => setCurrentPath('/')}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors shrink-0",
              currentPath === '/' ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
            )}
          >
            <Home className="h-3 w-3" /> Files
          </button>
          {pathParts.map((part, i) => {
            const pathUpTo = '/' + pathParts.slice(0, i + 1).join('/');
            return (
              <div key={pathUpTo} className="flex items-center gap-1 shrink-0">
                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                <button
                  onClick={() => setCurrentPath(pathUpTo)}
                  className={cn(
                    "px-2 py-1 rounded-md text-[11px] font-medium transition-colors",
                    currentPath === pathUpTo ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  )}
                >
                  {part}
                </button>
              </div>
            );
          })}
        </div>

        {/* Folder tree */}
        <div className="flex-1 min-h-[280px] max-h-[340px] overflow-auto px-3 py-2">
          {/* Root */}
          <button
            onClick={() => setCurrentPath('/')}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all text-[12px] mb-0.5",
              currentPath === '/' ? "bg-primary/10 text-primary font-semibold" : "hover:bg-accent/40 text-foreground/80"
            )}
          >
            <HardDrive className={cn("h-3.5 w-3.5 shrink-0", currentPath === '/' ? "text-primary" : "text-sky-500")} />
            <span>My Files (Root)</span>
          </button>

          {loading ? (
            <div className="space-y-1.5 px-2 pt-2">
              {[1, 2, 3].map(i => <div key={i} className="h-7 rounded-lg bg-muted/30 animate-pulse" />)}
            </div>
          ) : (
            <>
              {folders.map(f => renderFolder(f))}
              {folders.length === 0 && (
                <div className="text-center py-8 text-[11px] text-muted-foreground/50">
                  No folders yet. Create one below.
                </div>
              )}
            </>
          )}
        </div>

        {/* New folder */}
        <div className="px-5 py-2 border-t border-border/10 flex items-center gap-2">
          <FolderPlus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            placeholder="New folder name…"
            className="h-7 text-[11px] flex-1 bg-card/60 border-border/20 rounded-lg"
            onKeyDown={e => { if (e.key === 'Enter') createFolder(); }}
          />
          <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg px-3" onClick={createFolder} disabled={!newFolderName.trim() || creatingFolder}>
            Create
          </Button>
        </div>

        {/* File name & actions */}
        <div className="px-5 py-3.5 bg-muted/20 border-t border-border/20 space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-16">File name</label>
            <Input
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              className="h-8 text-[12px] flex-1 bg-card/60 border-border/20 rounded-lg font-medium"
            />
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground/60 px-2 py-0.5 rounded-md bg-muted/30 font-semibold uppercase">
                {options.appSource}
              </span>
              <span className="text-[9px] text-muted-foreground/40">
                Saving to: {currentPath === '/' ? 'Root' : currentPath}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {options.onSaveToDevice && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px] gap-1.5 rounded-xl font-medium"
                  onClick={() => { options.onSaveToDevice?.(); onOpenChange(false); }}
                >
                  <Download className="h-3.5 w-3.5" /> Save to Device
                </Button>
              )}
              <Button
                size="sm"
                className="h-8 text-[11px] gap-1.5 rounded-xl font-semibold bg-gradient-to-r from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white border-0 shadow-sm"
                onClick={saveToFiles}
                disabled={saving || !fileName.trim()}
              >
                <Save className="h-3.5 w-3.5" /> {saving ? 'Saving…' : 'Save to Files'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
