import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { AUTOMATION_TEMPLATES, AUTOMATION_CATEGORIES, AutomationTemplate } from './automationTemplates';
import { WorkflowNode, WorkflowConnection } from './types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Search, ArrowLeft, Star, Database, Mail, Sparkles, Activity, Briefcase,
  Megaphone, Terminal, Filter, Send, Globe, Code, Clock, GitBranch,
  Edit3, ToggleLeft, GitMerge, Users, Layers, Plus, Eye, Zap
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Star, Database, Mail, Sparkles, Activity, Briefcase, Megaphone, Terminal,
  Filter, Send, Globe, Code, Clock, GitBranch, Edit3, ToggleLeft, GitMerge,
  Users, Layers, Zap,
};

interface Props {
  onBack: () => void;
  onUseTemplate: (workflowId: string) => void;
}

export function AutomationHub({ onBack, onUseTemplate }: Props) {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('popular');
  const [previewTemplate, setPreviewTemplate] = useState<AutomationTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = AUTOMATION_TEMPLATES.filter(t => {
    const matchesSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === 'popular'
      ? t.category === 'popular' || !search
      : t.category === activeCategory;
    return matchesSearch && (search ? true : matchesCategory);
  });

  const useTemplate = async (template: AutomationTemplate) => {
    if (!user) return;
    setCreating(true);
    try {
      // Generate IDs for nodes
      const nodeIds = template.nodes.map(() => `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
      const nodes: WorkflowNode[] = template.nodes.map((n, i) => ({
        ...n,
        id: nodeIds[i],
        inputs: n.inputs.map(p => ({ ...p, id: `${p.id}-${Date.now()}-${i}` })),
        outputs: n.outputs.map(p => ({ ...p, id: `${p.id}-${Date.now()}-${i}` })),
      }));

      const connections: WorkflowConnection[] = template.connections.map((c, i) => ({
        id: `conn-${Date.now()}-${i}`,
        sourceNodeId: nodeIds[c.sourceIndex],
        sourcePortId: nodes[c.sourceIndex].outputs.find(p => p.id.startsWith(c.sourcePort))?.id || nodes[c.sourceIndex].outputs[0]?.id || '',
        targetNodeId: nodeIds[c.targetIndex],
        targetPortId: nodes[c.targetIndex].inputs.find(p => p.id.startsWith(c.targetPort))?.id || nodes[c.targetIndex].inputs[0]?.id || '',
      }));

      const { data, error } = await supabase.from('workflows').insert({
        name: template.name,
        description: template.description,
        nodes: nodes as any,
        connections: connections as any,
        viewport: { x: 200, y: 200, zoom: 1 } as any,
        is_active: false,
        user_id: user.id,
        workflow_type: 'execute',
        template_id: template.id,
      }).select('id').single();

      if (error) throw error;
      toast.success(`Created "${template.name}" workflow`);
      if (data) onUseTemplate(data.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create workflow');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Automation Hub</h1>
            <p className="text-sm text-muted-foreground">{AUTOMATION_TEMPLATES.length} ready-to-use workflow templates</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Categories */}
        <div className="w-48 border-r border-border p-3 hidden md:block">
          <ScrollArea className="h-full">
            <div className="space-y-1">
              {AUTOMATION_CATEGORIES.map(cat => {
                const Icon = iconMap[cat.icon] || Zap;
                const count = AUTOMATION_TEMPLATES.filter(t =>
                  cat.id === 'popular' ? t.category === 'popular' : t.category === cat.id
                ).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      activeCategory === cat.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent/50'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="flex-1 text-left">{cat.label}</span>
                    <span className="text-[10px] opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Templates grid */}
        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6">
            {/* Mobile categories */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 md:hidden">
              {AUTOMATION_CATEGORIES.map(cat => (
                <Badge
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
                >
                  {cat.label}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(template => {
                const Icon = iconMap[template.icon] || Zap;
                return (
                  <div
                    key={template.id}
                    className="group border border-border rounded-xl p-4 bg-card hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold truncate">{template.name}</h3>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                      {template.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                      ))}
                      <span className="text-[10px] text-muted-foreground ml-auto">{template.nodes.length} nodes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs gap-1"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="h-3 w-3" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-7 text-xs gap-1"
                        onClick={() => useTemplate(template)}
                        disabled={creating}
                      >
                        <Plus className="h-3 w-3" />
                        Use Template
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm font-medium">No automations found</p>
                <p className="text-xs text-muted-foreground mt-1">Try a different search or category</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Preview panel */}
        {previewTemplate && (
          <div className="w-80 border-l border-border bg-card/50 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-border">
              <h3 className="text-sm font-semibold">Preview</h3>
              <button onClick={() => setPreviewTemplate(null)} className="p-1 hover:bg-accent rounded">
                <ArrowLeft className="h-4 w-4" />
              </button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                <div>
                  <h2 className="text-base font-bold">{previewTemplate.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{previewTemplate.description}</p>
                </div>

                <div>
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Nodes ({previewTemplate.nodes.length})</h4>
                  <div className="space-y-1.5">
                    {previewTemplate.nodes.map((node, i) => {
                      const NIcon = iconMap[node.icon] || Zap;
                      return (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: `${node.color}20` }}>
                            <NIcon className="h-3 w-3" style={{ color: node.color }} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-medium">{node.label}</span>
                            <span className="text-[10px] text-muted-foreground block truncate">{node.type}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Connections ({previewTemplate.connections.length})</h4>
                  <div className="space-y-1">
                    {previewTemplate.connections.map((c, i) => (
                      <div key={i} className="text-[10px] text-muted-foreground">
                        {previewTemplate.nodes[c.sourceIndex]?.label} → {previewTemplate.nodes[c.targetIndex]?.label}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full gap-2"
                  onClick={() => {
                    useTemplate(previewTemplate);
                    setPreviewTemplate(null);
                  }}
                  disabled={creating}
                >
                  <Plus className="h-4 w-4" />
                  Use This Template
                </Button>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
