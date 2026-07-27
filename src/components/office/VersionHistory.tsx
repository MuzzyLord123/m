import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { History, Clock, RotateCcw, FileText, ChevronRight, Eye } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import { Editor } from '@tiptap/react';

interface Version {
  id: string;
  version_number: number;
  title: string;
  word_count: number;
  content: any;
  created_at: string;
}

interface VersionHistoryProps {
  documentId: string;
  editor: Editor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VersionHistory({ documentId, editor, open, onOpenChange }: VersionHistoryProps) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const loadVersions = useCallback(async () => {
    if (!documentId || !user) return;
    setLoading(true);
    const { data } = await supabase
      .from('document_versions')
      .select('*')
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .limit(50);
    setVersions((data as Version[]) || []);
    setLoading(false);
  }, [documentId, user]);

  useEffect(() => {
    if (open) loadVersions();
  }, [open, loadVersions]);

  const restoreVersion = async (version: Version) => {
    if (!editor || !version.content) return;
    // Save current as a version first
    await saveCurrentAsVersion();
    editor.commands.setContent(version.content);
    toast.success(`Restored to version ${version.version_number}`);
    onOpenChange(false);
  };

  const saveCurrentAsVersion = async () => {
    if (!editor || !user) return;
    const latestNum = versions.length > 0 ? versions[0].version_number : 0;
    await supabase.from('document_versions').insert({
      document_id: documentId,
      user_id: user.id,
      content: editor.getJSON(),
      title: 'Auto-save before restore',
      word_count: editor.storage.characterCount?.words() || 0,
      version_number: latestNum + 1,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Version History
            <span className="text-[10px] text-muted-foreground font-normal ml-1">
              {versions.length} version{versions.length !== 1 ? 's' : ''}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Word count sparkline */}
        {versions.length > 1 && (
          <div className="px-4 py-2 border-t border-border/30">
            <p className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-widest mb-1">Word Count Over Time</p>
            <div className="flex items-end gap-px h-8">
              {[...versions].reverse().slice(-20).map((v, i, arr) => {
                const max = Math.max(...arr.map(a => a.word_count || 1), 1);
                return (
                  <div
                    key={v.id}
                    className="flex-1 rounded-t-sm transition-all hover:opacity-80"
                    style={{
                      height: `${Math.max(2, ((v.word_count || 0) / max) * 28)}px`,
                      backgroundColor: i === arr.length - 1 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)',
                    }}
                    title={`v${v.version_number}: ${v.word_count || 0} words`}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-1 min-h-0">
          {/* Version list */}
          <ScrollArea className="w-full border-t border-border/30">
            <div className="p-2 space-y-1">
              {loading && (
                <div className="text-center py-8 text-xs text-muted-foreground">Loading versions…</div>
              )}
              {!loading && versions.length === 0 && (
                <div className="text-center py-8">
                  <History className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No versions saved yet</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Versions are auto-saved every 10 saves</p>
                </div>
              )}
              {versions.map((v, idx) => {
                const prevVersion = versions[idx + 1];
                const wordDiff = prevVersion ? (v.word_count || 0) - (prevVersion.word_count || 0) : null;
                return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVersion(v)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl transition-all group",
                    selectedVersion?.id === v.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50 border border-transparent"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold">Version {v.version_number}</div>
                        <div className="text-[9px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {wordDiff !== null && wordDiff !== 0 && (
                        <span className={cn(
                          "text-[8px] font-bold tabular-nums px-1 py-0.5 rounded",
                          wordDiff > 0 ? "text-emerald-500 bg-emerald-500/10" : "text-red-400 bg-red-400/10"
                        )}>
                          {wordDiff > 0 ? '+' : ''}{wordDiff}
                        </span>
                      )}
                      <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{v.word_count || 0}w</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {selectedVersion && (
          <div className="p-3 border-t border-border/30 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] text-muted-foreground">
                  <span className="font-medium text-foreground">Version {selectedVersion.version_number}</span>
                  {' · '}{format(new Date(selectedVersion.created_at), 'MMM d, yyyy h:mm a')}
                  {' · '}{selectedVersion.word_count || 0} words
                </div>
                <div className="text-[9px] text-muted-foreground/60 italic mt-0.5">
                  {selectedVersion.title}
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button variant="ghost" size="sm" className="h-7 text-[10px] rounded-lg gap-1" onClick={() => setPreviewMode(!previewMode)}>
                  <Eye className="h-3 w-3" /> Preview
                </Button>
                <Button size="sm" className="h-7 text-[10px] rounded-lg gap-1" onClick={() => restoreVersion(selectedVersion)}>
                  <RotateCcw className="h-3 w-3" /> Restore
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Hook to auto-save versions periodically
export function useVersionAutoSave(documentId: string, editor: Editor | null, saveCount: number) {
  const { user } = useAuth();
  const lastVersionSaveRef = useCallback(() => {}, []);

  useEffect(() => {
    // Save a version every 10 saves
    if (saveCount > 0 && saveCount % 10 === 0 && editor && user) {
      const saveVersion = async () => {
        const { data: latest } = await supabase
          .from('document_versions')
          .select('version_number')
          .eq('document_id', documentId)
          .order('version_number', { ascending: false })
          .limit(1)
          .single();

        const nextVersion = (latest?.version_number || 0) + 1;

        await supabase.from('document_versions').insert({
          document_id: documentId,
          user_id: user.id,
          content: editor.getJSON(),
          title: `Auto-save v${nextVersion}`,
          word_count: editor.storage.characterCount?.words() || 0,
          version_number: nextVersion,
        });
      };
      saveVersion();
    }
  }, [saveCount, documentId, editor, user]);
}
