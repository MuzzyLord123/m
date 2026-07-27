import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { WorkflowNode, WorkflowConnection, WorkflowViewport, NODE_TEMPLATES } from './types';
import { WorkflowCanvas } from './WorkflowCanvas';
import { WorkflowSidebar } from './WorkflowSidebar';
import { WorkflowNodeSettings } from './WorkflowNodeSettings';
import { WorkflowToolbar } from './WorkflowToolbar';
import { WorkflowExecutionPanel } from './WorkflowExecutionPanel';
import { WorkflowSplash } from '@/components/splash/WorkflowSplash';
import { ExitSplash } from '@/components/splash/ExitSplash';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  workflowId?: string;
  onBack?: () => void;
  onExit?: () => void;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isMobile;
}

export function WorkflowBuilder({ workflowId, onBack, onExit }: Props) {
  const [showSplash, setShowSplash] = useState(true);
  const [showExitSplash, setShowExitSplash] = useState(false);
  const { user } = useAuth();
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);
  const [viewport, setViewport] = useState<WorkflowViewport>({ x: 200, y: 200, zoom: 1 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(workflowId || null);
  const dragTemplateRef = useRef<number | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showMobileNodes, setShowMobileNodes] = useState(false);
  const [showExecution, setShowExecution] = useState(false);
  const [workflowType, setWorkflowType] = useState<'execute' | 'visual'>('execute');
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!currentId || !user) return;
    const load = async () => {
      const { data, error } = await supabase
        .from('workflows')
        .select('*')
        .eq('id', currentId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (error || !data) return;
      setWorkflowName(data.name);
      setWorkflowDescription(data.description || '');
      setIsActive(data.is_active);
      setNodes((data.nodes as any) || []);
      setConnections((data.connections as any) || []);
      setViewport((data.viewport as any) || { x: 200, y: 200, zoom: 1 });
      setWorkflowType((data as any).workflow_type === 'visual' ? 'visual' : 'execute');
    };
    load();
  }, [currentId, user]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const payload = {
        name: workflowName,
        description: workflowDescription,
        nodes: nodes as any,
        connections: connections as any,
        viewport: viewport as any,
        is_active: isActive,
        user_id: user.id,
        workflow_type: workflowType,
      };
      if (currentId) {
        await supabase.from('workflows').update(payload).eq('id', currentId);
      } else {
        const { data } = await supabase.from('workflows').insert(payload).select('id').single();
        if (data) setCurrentId(data.id);
      }
      toast.success('Workflow saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [user, currentId, workflowName, workflowDescription, nodes, connections, viewport, isActive, workflowType]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const addNode = (templateIndex: number, x?: number, y?: number) => {
    const template = NODE_TEMPLATES[templateIndex];
    const newNode: WorkflowNode = {
      ...template,
      id: `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      x: x ?? 300 + Math.random() * 200,
      y: y ?? 200 + Math.random() * 200,
      inputs: template.inputs.map(p => ({ ...p, id: `${p.id}-${Date.now()}` })),
      outputs: template.outputs.map(p => ({ ...p, id: `${p.id}-${Date.now()}` })),
      settings: { ...template.settings },
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const updateNode = (id: string, updates: Partial<WorkflowNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.sourceNodeId !== id && c.targetNodeId !== id));
    if (selectedNodeId === id) setSelectedNodeId(null);
  };

  const addConnection = (conn: Omit<WorkflowConnection, 'id'>) => {
    setConnections(prev => [...prev, { ...conn, id: `conn-${Date.now()}` }]);
  };

  const deleteConnection = (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
  };

  const handleDropNode = (x: number, y: number) => {
    if (dragTemplateRef.current !== null) {
      addNode(dragTemplateRef.current, x, y);
      dragTemplateRef.current = null;
    }
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);
  const resetView = () => setViewport({ x: 200, y: 200, zoom: 1 });

  if (showExitSplash) {
    return <ExitSplash moduleName="Workflow Builder" onComplete={() => {
      if (onExit) onExit();
      else onBack?.();
    }} />;
  }

  if (showSplash) {
    return <WorkflowSplash onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-background">
      <WorkflowToolbar
        name={workflowName}
        onNameChange={setWorkflowName}
        isActive={isActive}
        onToggleActive={() => setIsActive(!isActive)}
        onSave={handleSave}
        isSaving={isSaving}
        onBack={() => setShowExitSplash(true)}
        onResetView={resetView}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        nodeCount={nodes.length}
        connectionCount={connections.length}
        workflowType={workflowType}
        onToggleType={() => setWorkflowType(t => t === 'execute' ? 'visual' : 'execute')}
        showExecution={showExecution}
        onToggleExecution={() => setShowExecution(!showExecution)}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop sidebar */}
        {!isMobile && showSidebar && (
          <WorkflowSidebar
            onDragStart={(idx) => { dragTemplateRef.current = idx; }}
            onAddNode={addNode}
          />
        )}

        <div className="flex-1 relative">
          <WorkflowCanvas
            nodes={nodes}
            connections={connections}
            viewport={viewport}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onUpdateNode={updateNode}
            onDeleteNode={deleteNode}
            onAddConnection={addConnection}
            onDeleteConnection={deleteConnection}
            onViewportChange={setViewport}
            onDropNode={handleDropNode}
          />
          {workflowType === 'visual' && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs font-medium px-3 py-1.5 rounded-full border border-amber-500/20 pointer-events-none whitespace-nowrap">
              Visual Planning Mode
            </div>
          )}
        </div>

        {selectedNode && (
          <WorkflowNodeSettings
            node={selectedNode}
            onUpdate={(updates) => updateNode(selectedNode.id, updates)}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
        {showExecution && workflowType === 'execute' && (
          <WorkflowExecutionPanel
            workflowId={currentId}
            nodes={nodes}
            onClose={() => setShowExecution(false)}
          />
        )}

        {/* Mobile FAB to open node panel */}
        {isMobile && (
          <Button
            size="icon"
            className="fixed bottom-20 right-4 z-40 h-12 w-12 rounded-full shadow-lg"
            onClick={() => setShowMobileNodes(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        )}

        {/* Mobile node sheet */}
        {isMobile && showMobileNodes && (
          <WorkflowSidebar
            isMobile
            onDragStart={(idx) => { dragTemplateRef.current = idx; }}
            onAddNode={addNode}
            onClose={() => setShowMobileNodes(false)}
          />
        )}
      </div>
    </div>
  );
}
