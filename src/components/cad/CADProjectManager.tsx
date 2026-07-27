import { useState, useEffect, useCallback } from 'react';
import { useCAD } from './CADContext';
import { stateToProjectData, importJSON, CADProjectData } from './CADFileOperations';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Search, FolderPlus, FilePlus, Trash2, Copy, Pencil, Clock, MoreVertical,
  FileText, ArrowUpDown, Grid3X3, List, Download, Upload, History
} from 'lucide-react';
import { format } from 'date-fns';

interface CADProject {
  id: string;
  name: string;
  description: string | null;
  tags: string[];
  folder: string;
  units: string;
  drawing_data: any;
  version: number;
  entity_count: number;
  layer_count: number;
  created_at: string;
  updated_at: string;
  is_template: boolean;
}

type SortBy = 'name' | 'updated_at' | 'created_at' | 'entity_count';

export function CADProjectManager({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, dispatch } = useCAD();
  const [projects, setProjects] = useState<CADProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('updated_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error } = await supabase.from('cad_projects').select('*').eq('user_id', user.id).order(sortBy, { ascending: sortDir === 'asc' }) as any;
      if (error) throw error;
      setProjects(data || []);
    } catch (err: any) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortDir]);

  useEffect(() => { if (open) fetchProjects(); }, [open, fetchProjects]);

  const saveProject = async (name?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('Please sign in to save projects'); return; }
      const projData = stateToProjectData(state);
      const projectName = name || 'Untitled Drawing';

      if (activeProjectId) {
        // Update existing
        const { data: existing } = await supabase.from('cad_projects').select('version').eq('id', activeProjectId).maybeSingle() as any;
        const newVersion = (existing?.version || 0) + 1;
        // Save version snapshot
        await (supabase.from('cad_project_versions') as any).insert({
          project_id: activeProjectId,
          version_number: newVersion,
          drawing_data: projData,
          entity_count: state.entities.length,
        });
        const { error } = await (supabase.from('cad_projects') as any).update({
          drawing_data: projData,
          entity_count: state.entities.length,
          layer_count: state.layers.length,
          units: state.units,
          version: newVersion,
        }).eq('id', activeProjectId);
        if (error) throw error;
        toast.success(`Saved v${newVersion}`);
      } else {
        // Create new
        const { data: created, error } = await (supabase.from('cad_projects') as any).insert({
          user_id: user.id,
          name: projectName,
          drawing_data: projData,
          entity_count: state.entities.length,
          layer_count: state.layers.length,
          units: state.units,
        }).select().single();
        if (error) throw error;
        setActiveProjectId(created.id);
        toast.success('Project saved');
      }
      fetchProjects();
    } catch (err: any) {
      toast.error('Save failed: ' + (err.message || ''));
    }
  };

  const openProject = async (proj: CADProject) => {
    try {
      const projData = proj.drawing_data as CADProjectData;
      if (!projData?.entities || !projData?.layers) { toast.error('Invalid project data'); return; }
      dispatch({ type: 'LOAD_PROJECT', payload: projData });
      setActiveProjectId(proj.id);
      toast.success(`Opened "${proj.name}"`);
      onOpenChange(false);
    } catch {
      toast.error('Failed to open project');
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from('cad_projects').delete().eq('id', id) as any;
      if (error) throw error;
      if (activeProjectId === id) setActiveProjectId(null);
      toast.success('Project deleted');
      fetchProjects();
    } catch { toast.error('Delete failed'); }
  };

  const duplicateProject = async (proj: CADProject) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await (supabase.from('cad_projects') as any).insert({
        user_id: user.id,
        name: proj.name + ' (Copy)',
        drawing_data: proj.drawing_data,
        entity_count: proj.entity_count,
        layer_count: proj.layer_count,
        units: proj.units,
      });
      if (error) throw error;
      toast.success('Duplicated');
      fetchProjects();
    } catch { toast.error('Duplicate failed'); }
  };

  const renameProject = async (id: string, newName: string) => {
    try {
      const { error } = await (supabase.from('cad_projects') as any).update({ name: newName }).eq('id', id);
      if (error) throw error;
      setRenamingId(null);
      fetchProjects();
    } catch { toast.error('Rename failed'); }
  };

  const exportLocalBackup = () => {
    const projData = stateToProjectData(state);
    const blob = new Blob([JSON.stringify(projData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'cad-backup.json'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup downloaded');
  };

  const importLocalBackup = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const projData = importJSON(text);
      if (projData) {
        dispatch({ type: 'LOAD_PROJECT', payload: projData });
        toast.success('Imported from backup');
        onOpenChange(false);
      } else {
        toast.error('Invalid backup file');
      }
    };
    input.click();
  };

  const filtered = projects.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#111] border-white/10 text-white p-0 gap-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/[0.06]">
          <DialogTitle className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#3B82F6]" /> Project Manager
          </DialogTitle>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..."
              className="h-7 pl-7 text-[11px] bg-[#1a1a1a] border-white/10 text-white/80" />
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-white/50" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
            <ArrowUpDown className="h-3 w-3 mr-1" /> {sortBy === 'updated_at' ? 'Modified' : sortBy === 'name' ? 'Name' : 'Created'}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/40" onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-3.5 w-3.5" /> : <Grid3X3 className="h-3.5 w-3.5" />}
          </Button>
          <div className="h-4 w-px bg-white/10" />
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-white/60" onClick={() => { onOpenChange(false); saveProject('Untitled Drawing'); }}>
            <FilePlus className="h-3 w-3 mr-1" /> Save Current
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-white/60" onClick={importLocalBackup}>
            <Upload className="h-3 w-3 mr-1" /> Import
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] text-white/60" onClick={exportLocalBackup}>
            <Download className="h-3 w-3 mr-1" /> Backup
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-white/30 text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <FileText className="h-8 w-8 text-white/15" />
              <p className="text-white/30 text-xs">{search ? 'No matching projects' : 'No saved projects yet'}</p>
              <Button variant="ghost" size="sm" className="text-[10px] text-[#3B82F6]" onClick={() => { onOpenChange(false); saveProject('Untitled Drawing'); }}>
                Save Current Drawing
              </Button>
            </div>
          ) : (
            <div className={cn(viewMode === 'grid' ? 'grid grid-cols-3 gap-2 p-3' : 'flex flex-col p-1')}>
              {filtered.map(proj => (
                <div key={proj.id} className={cn(
                  "group cursor-pointer transition-all rounded border border-transparent",
                  viewMode === 'grid' ? 'p-3 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10' : 'flex items-center gap-3 px-4 py-2 hover:bg-white/[0.04]',
                  activeProjectId === proj.id && 'border-[#3B82F6]/30 bg-[#3B82F6]/5'
                )} onDoubleClick={() => openProject(proj)}>
                  {/* Icon */}
                  <div className={cn("flex items-center justify-center rounded bg-white/[0.04]", viewMode === 'grid' ? 'h-20 w-full mb-2' : 'h-8 w-8 flex-shrink-0')}>
                    <FileText className={cn("text-white/20", viewMode === 'grid' ? 'h-8 w-8' : 'h-4 w-4')} />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {renamingId === proj.id ? (
                      <Input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => renameProject(proj.id, renameValue)}
                        onKeyDown={e => e.key === 'Enter' && renameProject(proj.id, renameValue)}
                        className="h-5 text-[11px] bg-transparent border-[#3B82F6] text-white p-0 px-1" autoFocus />
                    ) : (
                      <p className="text-[11px] text-white/80 truncate font-medium">{proj.name}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-white/30">{proj.entity_count} entities</span>
                      <span className="text-[9px] text-white/30">v{proj.version}</span>
                      <span className="text-[9px] text-white/20">{format(new Date(proj.updated_at), 'MMM d, HH:mm')}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/40 hover:text-white" onClick={(e) => { e.stopPropagation(); openProject(proj); }}>
                      <FileText className="h-3 w-3" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-white/40 hover:text-white">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1e1e1e] border-white/10 text-white/80 min-w-[150px]">
                        <DropdownMenuItem onClick={() => openProject(proj)} className="text-[11px] gap-2">
                          <FileText className="h-3 w-3" /> Open
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setRenamingId(proj.id); setRenameValue(proj.name); }} className="text-[11px] gap-2">
                          <Pencil className="h-3 w-3" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateProject(proj)} className="text-[11px] gap-2">
                          <Copy className="h-3 w-3" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => deleteProject(proj.id)} className="text-[11px] gap-2 text-red-400">
                          <Trash2 className="h-3 w-3" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-white/[0.06] flex items-center justify-between text-[9px] text-white/25">
          <span>{filtered.length} project{filtered.length !== 1 ? 's' : ''}</span>
          {activeProjectId && <span className="text-[#3B82F6]">Active: {projects.find(p => p.id === activeProjectId)?.name}</span>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Autosave hook ─────────────────────────────── */
export function useCADAutosave() {
  const { state } = useCAD();

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || state.entities.length === 0) return;
        const projData = stateToProjectData(state);
        // Keep only latest autosave per user
        await (supabase.from('cad_autosaves') as any).delete().eq('user_id', user.id);
        await (supabase.from('cad_autosaves') as any).insert({ user_id: user.id, drawing_data: projData });
      } catch { }
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [state.entities.length]);

  // Check for recovery on mount
  useEffect(() => {
    const checkRecovery = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await (supabase.from('cad_autosaves') as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
        if (data && data.length > 0 && data[0].drawing_data?.entities?.length > 0) {
          // Store in sessionStorage so we can offer recovery
          sessionStorage.setItem('cad_recovery', JSON.stringify(data[0].drawing_data));
        }
      } catch { }
    };
    checkRecovery();
  }, []);
}
