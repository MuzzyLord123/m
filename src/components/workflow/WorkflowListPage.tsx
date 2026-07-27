import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Power, PowerOff, GitBranch, Clock, Layers, Eye, Workflow } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  onOpenWorkflow: (id: string) => void;
  onNewWorkflow: () => void;
  onOpenHub?: () => void;
}

export function WorkflowListPage({ onOpenWorkflow, onNewWorkflow, onOpenHub }: Props) {
  const { user } = useAuth();
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWorkflows = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('workflows')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    setWorkflows(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchWorkflows(); }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from('workflows').delete().eq('id', id);
    toast.success('Workflow deleted');
    fetchWorkflows();
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Workflows</h1>
          <p className="text-sm text-muted-foreground mt-1">Build and manage your automation workflows</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {onOpenHub && (
            <Button variant="outline" onClick={onOpenHub} className="gap-2 shrink-0">
              <Layers className="h-4 w-4" /> Automation Hub
            </Button>
          )}
          <Button onClick={onNewWorkflow} className="gap-2 shrink-0">
            <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Workflow</span><span className="sm:hidden">New</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-20">
          <GitBranch className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
          <p className="text-sm text-muted-foreground mb-4">Create your first workflow or browse the Automation Hub</p>
          <div className="flex items-center gap-3 justify-center">
            {onOpenHub && (
              <Button variant="outline" onClick={onOpenHub} className="gap-2">
                <Layers className="h-4 w-4" /> Automation Hub
              </Button>
            )}
            <Button onClick={onNewWorkflow} className="gap-2">
              <Plus className="h-4 w-4" /> Create Workflow
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map(wf => {
            const nodeCount = Array.isArray(wf.nodes) ? wf.nodes.length : 0;
            const connCount = Array.isArray(wf.connections) ? wf.connections.length : 0;
            const isVisual = wf.workflow_type === 'visual';
            return (
              <div
                key={wf.id}
                onClick={() => onOpenWorkflow(wf.id)}
                className="group relative border border-border rounded-xl p-4 bg-card hover:bg-accent/30 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {isVisual ? (
                      <Eye className="h-4 w-4 text-amber-500" />
                    ) : wf.is_active ? (
                      <Power className="h-4 w-4 text-green-500" />
                    ) : (
                      <PowerOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <h3 className="font-semibold text-sm truncate">{wf.name}</h3>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(wf.id); }}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
                {wf.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{wf.description}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-[10px]">
                    {isVisual ? 'Visual' : 'Execute'}
                  </Badge>
                  {wf.run_count > 0 && (
                    <Badge variant="outline" className="text-[10px]">{wf.run_count} runs</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-2">
                  <span>{nodeCount} nodes</span>
                  <span>·</span>
                  <span>{connCount} connections</span>
                  <span className="ml-auto flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(wf.updated_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
