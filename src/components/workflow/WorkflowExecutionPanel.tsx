import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WorkflowNode } from './types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Play, Loader2, CheckCircle2, XCircle, SkipForward, Clock, X, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface NodeResult {
  nodeId: string;
  nodeType: string;
  label: string;
  status: 'success' | 'error' | 'skipped';
  output: any;
  error?: string;
  durationMs: number;
  startedAt: string;
}

interface Props {
  workflowId: string | null;
  nodes: WorkflowNode[];
  onClose: () => void;
  onNodeHighlight?: (nodeId: string | null) => void;
}

export function WorkflowExecutionPanel({ workflowId, nodes, onClose, onNodeHighlight }: Props) {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<NodeResult[]>([]);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const executeWorkflow = async () => {
    if (!workflowId) {
      toast.error('Save the workflow first before executing');
      return;
    }
    if (nodes.length === 0) {
      toast.error('Add some nodes to the workflow first');
      return;
    }

    setRunning(true);
    setResults([]);
    setRunStatus('running');

    try {
      const { data, error } = await supabase.functions.invoke('execute-workflow', {
        body: { workflowId, triggerData: { executedAt: new Date().toISOString(), source: 'manual' } },
      });

      if (error) throw error;

      setResults(data.results || []);
      setRunStatus(data.status);
      setTotalDuration(data.duration_ms);
      // Auto-expand all results
      setExpandedNodes(new Set((data.results || []).map((r: NodeResult) => r.nodeId)));

      if (data.status === 'completed') {
        toast.success(`Workflow completed in ${data.duration_ms}ms`);
      } else if (data.status === 'completed_with_errors') {
        toast.warning('Workflow completed with errors');
      }
    } catch (err: any) {
      toast.error(err.message || 'Execution failed');
      setRunStatus('failed');
    } finally {
      setRunning(false);
    }
  };

  const toggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
      case 'error': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'skipped': return <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />;
      default: return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  return (
    <div className="w-80 border-l border-border bg-card/50 flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Execution</h3>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            className="h-7 gap-1.5 text-xs"
            onClick={executeWorkflow}
            disabled={running}
          >
            {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            {running ? 'Running...' : 'Run'}
          </Button>
          <button onClick={onClose} className="p-1 hover:bg-accent rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {runStatus && (
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={runStatus === 'completed' ? 'default' : runStatus === 'completed_with_errors' ? 'secondary' : 'destructive'} className="text-[10px]">
              {runStatus.replace(/_/g, ' ')}
            </Badge>
            {totalDuration > 0 && (
              <span className="text-[10px] text-muted-foreground">{totalDuration}ms</span>
            )}
          </div>
          {results.length > 0 && (
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="text-green-500">{successCount} passed</span>
              {errorCount > 0 && <span className="text-destructive">{errorCount} failed</span>}
              {skippedCount > 0 && <span>{skippedCount} skipped</span>}
            </div>
          )}
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {results.length === 0 && !running && (
            <div className="text-center py-10 text-muted-foreground">
              <Play className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-xs">Click Run to execute the workflow</p>
              <p className="text-[10px] mt-1 opacity-60">Nodes execute in order of connections</p>
            </div>
          )}

          {running && results.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin opacity-40" />
              <p className="text-xs">Executing workflow...</p>
            </div>
          )}

          {results.map((r) => (
            <div
              key={r.nodeId}
              className="rounded-lg border border-border/50 overflow-hidden"
              onMouseEnter={() => onNodeHighlight?.(r.nodeId)}
              onMouseLeave={() => onNodeHighlight?.(null)}
            >
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent/30 transition-colors"
                onClick={() => toggleExpand(r.nodeId)}
              >
                {statusIcon(r.status)}
                <span className="text-xs font-medium flex-1 truncate">{r.label}</span>
                <span className="text-[10px] text-muted-foreground">{r.durationMs}ms</span>
                {expandedNodes.has(r.nodeId) ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
              {expandedNodes.has(r.nodeId) && (
                <div className="px-3 pb-2 border-t border-border/30">
                  {r.error ? (
                    <pre className="text-[10px] text-destructive mt-1 whitespace-pre-wrap break-all font-mono bg-destructive/5 p-2 rounded">{r.error}</pre>
                  ) : r.output !== null ? (
                    <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap break-all font-mono bg-muted/30 p-2 rounded max-h-40 overflow-auto">
                      {JSON.stringify(r.output, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-1 italic">No output (skipped)</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
