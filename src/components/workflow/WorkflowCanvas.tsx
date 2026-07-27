import { useRef, useState, useCallback, useEffect } from 'react';
import { WorkflowNode, WorkflowConnection, WorkflowViewport, DragState } from './types';
import { WorkflowNodeComponent } from './WorkflowNodeComponent';
import { WorkflowConnectionLine } from './WorkflowConnectionLine';

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  viewport: WorkflowViewport;
  selectedNodeId: string | null;
  onSelectNode: (id: string | null) => void;
  onUpdateNode: (id: string, updates: Partial<WorkflowNode>) => void;
  onDeleteNode: (id: string) => void;
  onAddConnection: (conn: Omit<WorkflowConnection, 'id'>) => void;
  onDeleteConnection: (id: string) => void;
  onViewportChange: (viewport: WorkflowViewport) => void;
  onDropNode: (x: number, y: number) => void;
}

export function WorkflowCanvas({
  nodes,
  connections,
  viewport,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onDeleteNode,
  onAddConnection,
  onDeleteConnection,
  onViewportChange,
  onDropNode,
}: WorkflowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({ type: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  const [pendingConnection, setPendingConnection] = useState<{
    sourceNodeId: string;
    sourcePortId: string;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (screenX - rect.left - viewport.x) / viewport.zoom,
      y: (screenY - rect.top - viewport.y) / viewport.zoom,
    };
  }, [viewport]);

  // Canvas panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas-grid')) {
      onSelectNode(null);
      if (e.button === 0 || e.button === 1) {
        setDragState({
          type: 'canvas',
          startX: e.clientX - viewport.x,
          startY: e.clientY - viewport.y,
          offsetX: 0,
          offsetY: 0,
        });
      }
    }
  };

  // Node dragging
  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    onSelectNode(nodeId);
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDragState({
      type: 'node',
      nodeId,
      startX: canvasPos.x,
      startY: canvasPos.y,
      offsetX: canvasPos.x - node.x,
      offsetY: canvasPos.y - node.y,
    });
  };

  // Port connection start
  const handlePortMouseDown = (nodeId: string, portId: string, portType: 'input' | 'output', e: React.MouseEvent) => {
    e.stopPropagation();
    if (portType === 'output') {
      setPendingConnection({
        sourceNodeId: nodeId,
        sourcePortId: portId,
        mouseX: e.clientX,
        mouseY: e.clientY,
      });
    }
  };

  // Port connection end
  const handlePortMouseUp = (nodeId: string, portId: string, portType: 'input' | 'output') => {
    if (pendingConnection && portType === 'input' && pendingConnection.sourceNodeId !== nodeId) {
      const exists = connections.some(
        c => c.sourceNodeId === pendingConnection.sourceNodeId &&
             c.sourcePortId === pendingConnection.sourcePortId &&
             c.targetNodeId === nodeId &&
             c.targetPortId === portId
      );
      if (!exists) {
        onAddConnection({
          sourceNodeId: pendingConnection.sourceNodeId,
          sourcePortId: pendingConnection.sourcePortId,
          targetNodeId: nodeId,
          targetPortId: portId,
        });
      }
    }
    setPendingConnection(null);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.type === 'canvas') {
        onViewportChange({
          ...viewport,
          x: e.clientX - dragState.startX,
          y: e.clientY - dragState.startY,
        });
      } else if (dragState.type === 'node' && dragState.nodeId) {
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        onUpdateNode(dragState.nodeId, {
          x: Math.round((canvasPos.x - dragState.offsetX) / 20) * 20,
          y: Math.round((canvasPos.y - dragState.offsetY) / 20) * 20,
        });
      }
      if (pendingConnection) {
        setPendingConnection(prev => prev ? { ...prev, mouseX: e.clientX, mouseY: e.clientY } : null);
      }
    };

    const handleMouseUp = () => {
      setDragState({ type: null, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
      setPendingConnection(null);
    };

    if (dragState.type || pendingConnection) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, pendingConnection, viewport, screenToCanvas, onViewportChange, onUpdateNode]);

  // Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(Math.max(viewport.zoom * delta, 0.1), 3);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    onViewportChange({
      x: mx - (mx - viewport.x) * (newZoom / viewport.zoom),
      y: my - (my - viewport.y) * (newZoom / viewport.zoom),
      zoom: newZoom,
    });
  };

  // Drop handler
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const pos = screenToCanvas(e.clientX, e.clientY);
    onDropNode(pos.x, pos.y);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Get port position for connection lines
  const getPortPosition = (nodeId: string, portId: string, portType: 'input' | 'output') => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    const ports = portType === 'input' ? node.inputs : node.outputs;
    const portIndex = ports.findIndex(p => p.id === portId);
    const totalPorts = ports.length;
    const spacing = node.height / (totalPorts + 1);
    return {
      x: portType === 'input' ? node.x : node.x + node.width,
      y: node.y + spacing * (portIndex + 1),
    };
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-background cursor-grab active:cursor-grabbing select-none"
      onMouseDown={handleCanvasMouseDown}
      onWheel={handleWheel}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <pattern
            id="grid-small"
            width={20 * viewport.zoom}
            height={20 * viewport.zoom}
            patternUnits="userSpaceOnUse"
            x={viewport.x % (20 * viewport.zoom)}
            y={viewport.y % (20 * viewport.zoom)}
          >
            <circle cx={1} cy={1} r={0.5} fill="hsl(var(--muted-foreground) / 0.15)" />
          </pattern>
          <pattern
            id="grid-large"
            width={100 * viewport.zoom}
            height={100 * viewport.zoom}
            patternUnits="userSpaceOnUse"
            x={viewport.x % (100 * viewport.zoom)}
            y={viewport.y % (100 * viewport.zoom)}
          >
            <circle cx={1} cy={1} r={1} fill="hsl(var(--muted-foreground) / 0.25)" />
          </pattern>
        </defs>
        <rect className="canvas-grid" width="100%" height="100%" fill="url(#grid-small)" />
        <rect className="canvas-grid" width="100%" height="100%" fill="url(#grid-large)" />
      </svg>

      {/* Transform layer */}
      <div
        className="absolute origin-top-left"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          willChange: 'transform',
        }}
      >
        {/* Connections SVG */}
        <svg className="absolute top-0 left-0 pointer-events-none" style={{ width: 10000, height: 10000, overflow: 'visible' }}>
          {connections.map(conn => {
            const start = getPortPosition(conn.sourceNodeId, conn.sourcePortId, 'output');
            const end = getPortPosition(conn.targetNodeId, conn.targetPortId, 'input');
            return (
              <WorkflowConnectionLine
                key={conn.id}
                id={conn.id}
                startX={start.x}
                startY={start.y}
                endX={end.x}
                endY={end.y}
                onDelete={onDeleteConnection}
              />
            );
          })}
          {/* Pending connection */}
          {pendingConnection && (() => {
            const start = getPortPosition(pendingConnection.sourceNodeId, pendingConnection.sourcePortId, 'output');
            const mouseCanvas = screenToCanvas(pendingConnection.mouseX, pendingConnection.mouseY);
            return (
              <WorkflowConnectionLine
                startX={start.x}
                startY={start.y}
                endX={mouseCanvas.x}
                endY={mouseCanvas.y}
                isPending
              />
            );
          })()}
        </svg>

        {/* Nodes */}
        {nodes.map(node => (
          <WorkflowNodeComponent
            key={node.id}
            node={node}
            isSelected={selectedNodeId === node.id}
            onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
            onPortMouseDown={handlePortMouseDown}
            onPortMouseUp={handlePortMouseUp}
            onDelete={() => onDeleteNode(node.id)}
          />
        ))}
      </div>

      {/* Zoom indicator */}
      <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground font-mono">
        {Math.round(viewport.zoom * 100)}%
      </div>
    </div>
  );
}
