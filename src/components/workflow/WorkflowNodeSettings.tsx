import { WorkflowNode } from './types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Plus, Trash2 } from 'lucide-react';

interface Props {
  node: WorkflowNode;
  onUpdate: (updates: Partial<WorkflowNode>) => void;
  onClose: () => void;
}

export function WorkflowNodeSettings({ node, onUpdate, onClose }: Props) {
  const updateSetting = (key: string, value: any) => {
    onUpdate({ settings: { ...node.settings, [key]: value } });
  };

  const addPort = (type: 'input' | 'output') => {
    const ports = type === 'input' ? [...node.inputs] : [...node.outputs];
    ports.push({
      id: `${type === 'input' ? 'in' : 'out'}-${Date.now()}`,
      label: `${type === 'input' ? 'Input' : 'Output'} ${ports.length + 1}`,
      type,
    });
    onUpdate(type === 'input' ? { inputs: ports } : { outputs: ports });
  };

  const removePort = (type: 'input' | 'output', portId: string) => {
    const ports = type === 'input' ? node.inputs.filter(p => p.id !== portId) : node.outputs.filter(p => p.id !== portId);
    onUpdate(type === 'input' ? { inputs: ports } : { outputs: ports });
  };

  return (
    <div className="w-72 border-l border-border bg-card/50 flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold">Node Settings</h3>
        <button onClick={onClose} className="p-1 hover:bg-accent rounded">
          <X className="h-4 w-4" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Basic */}
          <div className="space-y-2">
            <Label className="text-xs">Name</Label>
            <Input
              value={node.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Description</Label>
            <Input
              value={node.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Color</Label>
            <Input
              type="color"
              value={node.color.startsWith('hsl') ? '#888888' : node.color}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="h-8 w-full"
            />
          </div>

          {/* Ports */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Inputs</Label>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => addPort('input')}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {node.inputs.map(port => (
              <div key={port.id} className="flex items-center gap-2">
                <Input
                  value={port.label}
                  onChange={(e) => {
                    const ports = node.inputs.map(p => p.id === port.id ? { ...p, label: e.target.value } : p);
                    onUpdate({ inputs: ports });
                  }}
                  className="h-7 text-xs flex-1"
                />
                <button onClick={() => removePort('input', port.id)} className="p-1 hover:bg-destructive/10 rounded">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Outputs</Label>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => addPort('output')}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {node.outputs.map(port => (
              <div key={port.id} className="flex items-center gap-2">
                <Input
                  value={port.label}
                  onChange={(e) => {
                    const ports = node.outputs.map(p => p.id === port.id ? { ...p, label: e.target.value } : p);
                    onUpdate({ outputs: ports });
                  }}
                  className="h-7 text-xs flex-1"
                />
                <button onClick={() => removePort('output', port.id)} className="p-1 hover:bg-destructive/10 rounded">
                  <Trash2 className="h-3 w-3 text-destructive" />
                </button>
              </div>
            ))}
          </div>

          {/* Type-specific settings */}
          {node.type === 'http-request' && (
            <div className="space-y-2">
              <Label className="text-xs">URL</Label>
              <Input value={node.settings.url || ''} onChange={(e) => updateSetting('url', e.target.value)} className="h-8 text-sm" />
              <Label className="text-xs">Method</Label>
              <Select value={node.settings.method || 'GET'} onValueChange={(v) => updateSetting('method', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="text-xs">Body</Label>
              <Textarea value={node.settings.body || ''} onChange={(e) => updateSetting('body', e.target.value)} className="text-sm min-h-[80px] font-mono text-xs" />
            </div>
          )}

          {node.type === 'code' && (
            <div className="space-y-2">
              <Label className="text-xs">Code</Label>
              <Textarea value={node.settings.code || ''} onChange={(e) => updateSetting('code', e.target.value)} className="min-h-[120px] font-mono text-xs" />
            </div>
          )}

          {node.type === 'if' && (
            <div className="space-y-2">
              <Label className="text-xs">Condition Field</Label>
              <Input value={node.settings.condition || ''} onChange={(e) => updateSetting('condition', e.target.value)} className="h-8 text-sm" />
              <Label className="text-xs">Value</Label>
              <Input value={node.settings.value || ''} onChange={(e) => updateSetting('value', e.target.value)} className="h-8 text-sm" />
            </div>
          )}

          {node.type === 'email' && (
            <div className="space-y-2">
              <Label className="text-xs">To</Label>
              <Input value={node.settings.to || ''} onChange={(e) => updateSetting('to', e.target.value)} className="h-8 text-sm" />
              <Label className="text-xs">Subject</Label>
              <Input value={node.settings.subject || ''} onChange={(e) => updateSetting('subject', e.target.value)} className="h-8 text-sm" />
              <Label className="text-xs">Body</Label>
              <Textarea value={node.settings.body || ''} onChange={(e) => updateSetting('body', e.target.value)} className="text-sm min-h-[80px]" />
            </div>
          )}

          {node.type === 'wait' && (
            <div className="space-y-2">
              <Label className="text-xs">Duration</Label>
              <Input type="number" value={node.settings.duration || 1000} onChange={(e) => updateSetting('duration', Number(e.target.value))} className="h-8 text-sm" />
              <Label className="text-xs">Unit</Label>
              <Select value={node.settings.unit || 'ms'} onValueChange={(v) => updateSetting('unit', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ms">Milliseconds</SelectItem>
                  <SelectItem value="s">Seconds</SelectItem>
                  <SelectItem value="m">Minutes</SelectItem>
                  <SelectItem value="h">Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {node.type === 'ai' && (
            <div className="space-y-2">
              <Label className="text-xs">Model</Label>
              <Input value={node.settings.model || ''} onChange={(e) => updateSetting('model', e.target.value)} className="h-8 text-sm" />
              <Label className="text-xs">Prompt</Label>
              <Textarea value={node.settings.prompt || ''} onChange={(e) => updateSetting('prompt', e.target.value)} className="text-sm min-h-[80px]" />
              <Label className="text-xs">Temperature</Label>
              <Input type="number" step="0.1" min="0" max="2" value={node.settings.temperature || 0.7} onChange={(e) => updateSetting('temperature', Number(e.target.value))} className="h-8 text-sm" />
            </div>
          )}

          {node.type === 'database' && (
            <div className="space-y-2">
              <Label className="text-xs">Operation</Label>
              <Select value={node.settings.operation || 'read'} onValueChange={(v) => updateSetting('operation', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="insert">Insert</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
              <Label className="text-xs">Table</Label>
              <Input value={node.settings.table || ''} onChange={(e) => updateSetting('table', e.target.value)} className="h-8 text-sm" />
            </div>
          )}

          {node.type === 'trigger' && (
            <div className="space-y-2">
              <Label className="text-xs">Trigger Type</Label>
              <Select value={node.settings.triggerType || 'manual'} onValueChange={(v) => updateSetting('triggerType', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="schedule">Schedule</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {node.type === 'webhook' && (
            <div className="space-y-2">
              <Label className="text-xs">Method</Label>
              <Select value={node.settings.method || 'POST'} onValueChange={(v) => updateSetting('method', v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['GET', 'POST', 'PUT', 'DELETE'].map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="text-xs">Path</Label>
              <Input value={node.settings.path || ''} onChange={(e) => updateSetting('path', e.target.value)} className="h-8 text-sm" />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
