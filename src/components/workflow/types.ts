export interface WorkflowNodePort {
  id: string;
  label: string;
  type: 'input' | 'output';
}

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  icon: string;
  inputs: WorkflowNodePort[];
  outputs: WorkflowNodePort[];
  settings: Record<string, any>;
  description?: string;
}

export interface WorkflowConnection {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
}

export interface WorkflowViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  viewport: WorkflowViewport;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DragState {
  type: 'node' | 'port' | 'canvas' | null;
  nodeId?: string;
  portId?: string;
  portType?: 'input' | 'output';
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
}

export const NODE_TEMPLATES: Omit<WorkflowNode, 'id' | 'x' | 'y'>[] = [
  {
    type: 'trigger',
    label: 'Trigger',
    width: 200, height: 80,
    color: 'hsl(142, 71%, 45%)',
    icon: 'Zap',
    inputs: [],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { triggerType: 'manual' },
    description: 'Starts the workflow',
  },
  {
    type: 'webhook',
    label: 'Webhook',
    width: 200, height: 80,
    color: 'hsl(262, 83%, 58%)',
    icon: 'Globe',
    inputs: [],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { method: 'POST', path: '/webhook' },
    description: 'Receive HTTP requests',
  },
  {
    type: 'http-request',
    label: 'HTTP Request',
    width: 200, height: 80,
    color: 'hsl(25, 95%, 53%)',
    icon: 'Send',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { url: '', method: 'GET', headers: {}, body: '' },
    description: 'Make HTTP requests',
  },
  {
    type: 'code',
    label: 'Code',
    width: 200, height: 80,
    color: 'hsl(210, 40%, 50%)',
    icon: 'Code',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { language: 'javascript', code: '// Write your code here\nreturn items;' },
    description: 'Run custom code',
  },
  {
    type: 'if',
    label: 'IF',
    width: 200, height: 80,
    color: 'hsl(48, 96%, 53%)',
    icon: 'GitBranch',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [
      { id: 'out-true', label: 'True', type: 'output' },
      { id: 'out-false', label: 'False', type: 'output' },
    ],
    settings: { condition: '', operator: 'equals', value: '' },
    description: 'Conditional branching',
  },
  {
    type: 'switch',
    label: 'Switch',
    width: 200, height: 80,
    color: 'hsl(35, 90%, 50%)',
    icon: 'ToggleLeft',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [
      { id: 'out-1', label: 'Case 1', type: 'output' },
      { id: 'out-2', label: 'Case 2', type: 'output' },
      { id: 'out-3', label: 'Default', type: 'output' },
    ],
    settings: { field: '', cases: [] },
    description: 'Route based on value',
  },
  {
    type: 'merge',
    label: 'Merge',
    width: 200, height: 80,
    color: 'hsl(190, 80%, 45%)',
    icon: 'GitMerge',
    inputs: [
      { id: 'in-1', label: 'Input 1', type: 'input' },
      { id: 'in-2', label: 'Input 2', type: 'input' },
    ],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { mode: 'append' },
    description: 'Merge multiple inputs',
  },
  {
    type: 'set',
    label: 'Set',
    width: 200, height: 80,
    color: 'hsl(330, 80%, 55%)',
    icon: 'Edit3',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { values: {} },
    description: 'Set or modify values',
  },
  {
    type: 'wait',
    label: 'Wait',
    width: 200, height: 80,
    color: 'hsl(0, 0%, 50%)',
    icon: 'Clock',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { duration: 1000, unit: 'ms' },
    description: 'Delay execution',
  },
  {
    type: 'email',
    label: 'Send Email',
    width: 200, height: 80,
    color: 'hsl(200, 80%, 50%)',
    icon: 'Mail',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { to: '', subject: '', body: '' },
    description: 'Send an email',
  },
  {
    type: 'database',
    label: 'Database',
    width: 200, height: 80,
    color: 'hsl(280, 60%, 50%)',
    icon: 'Database',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { operation: 'read', table: '', query: '' },
    description: 'Database operations',
  },
  {
    type: 'ai',
    label: 'AI / LLM',
    width: 200, height: 80,
    color: 'hsl(170, 70%, 45%)',
    icon: 'Sparkles',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { model: 'google/gemini-3-flash-preview', prompt: '', temperature: 0.7 },
    description: 'AI model inference',
  },
  {
    type: 'transform',
    label: 'Transform',
    width: 200, height: 80,
    color: 'hsl(280, 70%, 55%)',
    icon: 'Shuffle',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { transformType: 'pick', field: '' },
    description: 'Transform data shape',
  },
  {
    type: 'filter',
    label: 'Filter',
    width: 200, height: 80,
    color: 'hsl(190, 80%, 45%)',
    icon: 'Filter',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [{ id: 'out-1', label: 'Output', type: 'output' }],
    settings: { field: '', operator: 'equals', value: '' },
    description: 'Filter array data',
  },
  {
    type: 'loop',
    label: 'Loop',
    width: 200, height: 80,
    color: 'hsl(45, 80%, 50%)',
    icon: 'Repeat',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [{ id: 'out-1', label: 'Each Item', type: 'output' }],
    settings: {},
    description: 'Iterate over items',
  },
  {
    type: 'respond',
    label: 'Respond',
    width: 200, height: 80,
    color: 'hsl(142, 60%, 50%)',
    icon: 'ArrowRight',
    inputs: [{ id: 'in-1', label: 'Input', type: 'input' }],
    outputs: [],
    settings: { statusCode: 200, responseBody: '' },
    description: 'Send response back',
  },
  {
    type: 'note',
    label: 'Note',
    width: 240, height: 100,
    color: 'hsl(50, 80%, 60%)',
    icon: 'StickyNote',
    inputs: [],
    outputs: [],
    settings: { text: 'Add your notes here...' },
    description: 'Visual note (no execution)',
  },
];
