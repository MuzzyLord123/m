import { useState } from 'react';
import { useCAD } from './CADContext';
import { generateId } from './cadGeometry';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  X, Sparkles, Loader2, Zap, Target, TrendingUp, Award, BarChart3,
  ChevronDown, ChevronUp, Plus, Eye, FlaskConical, Atom, Box, Hexagon,
  Triangle, Circle, Cpu, ArrowRight, CheckCircle2, Shield, Layers,
  Weight, Gauge, Activity, Network
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnyCADEntity } from './cadTypes';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface DesignVariant {
  name: string;
  approach: string;
  description: string;
  commands?: any[];
  metrics: {
    weight_kg: number;
    volume_mm3: number;
    estimated_cost: number;
    safety_factor: number;
    max_stress_mpa: number;
    max_deflection_mm: number;
    material_utilization_percent: number;
  };
  pros: string[];
  cons: string[];
  manufacturing_notes: string;
}

const LOAD_TYPES = [
  { id: 'tension', name: 'Tension (Pull)' },
  { id: 'compression', name: 'Compression (Push)' },
  { id: 'bending', name: 'Bending (Beam)' },
  { id: 'torsion', name: 'Torsion (Twist)' },
  { id: 'combined', name: 'Combined Loading' },
];

const DESIGN_GOALS = [
  { id: 'min_weight', name: 'Minimize Weight', icon: Weight, desc: 'Lightest possible structure' },
  { id: 'min_cost', name: 'Minimize Cost', icon: TrendingUp, desc: 'Most cost-effective design' },
  { id: 'max_strength', name: 'Maximize Strength', icon: Shield, desc: 'Highest safety factor' },
  { id: 'min_deflection', name: 'Minimize Deflection', icon: Target, desc: 'Maximum stiffness' },
];

const MANUFACTURING_METHODS = [
  { id: 'fdm', name: 'FDM 3D Print', constraints: 'Min wall 0.8mm, overhang <45°' },
  { id: 'sla', name: 'SLA Resin Print', constraints: 'Min wall 0.5mm, support needed' },
  { id: 'cnc', name: 'CNC Milling', constraints: 'Tool access required, min radius 1mm' },
  { id: 'laser', name: 'Laser Cut + Weld', constraints: '2D profiles, max 25mm thick' },
  { id: 'casting', name: 'Casting', constraints: 'Draft angles, min wall 3mm' },
  { id: 'sheet_metal', name: 'Sheet Metal', constraints: 'Bend radius ≥ thickness, flat pattern' },
];

export function CADGenerativeDesign({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useCAD();
  const [loading, setLoading] = useState(false);
  const [designs, setDesigns] = useState<DesignVariant[]>([]);
  const [expandedDesign, setExpandedDesign] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState('');

  const [form, setForm] = useState({
    loadType: 'compression',
    loadValue: 1000,
    material: 'steel',
    method: 'fdm',
    goal: 'min_weight',
    maxWidth: 200,
    maxDepth: 200,
    maxHeight: 100,
    costTarget: 50,
    safetyFactor: 2.0,
    constraints: '',
  });

  const updateForm = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const generate = async () => {
    setLoading(true);
    setDesigns([]);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/cad-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          action: 'generative-design',
          data: {
            messages: [{
              role: 'user',
              content: `Generate 4-5 optimal structural design variants:

LOADING:
- Type: ${form.loadType}
- Force: ${form.loadValue}N
- Safety Factor Target: ≥${form.safetyFactor}

MATERIAL: ${form.material}
MANUFACTURING: ${MANUFACTURING_METHODS.find(m => m.id === form.method)?.name} (${MANUFACTURING_METHODS.find(m => m.id === form.method)?.constraints})
OPTIMIZATION GOAL: ${DESIGN_GOALS.find(g => g.id === form.goal)?.name}

ENVELOPE: ${form.maxWidth} × ${form.maxDepth} × ${form.maxHeight} mm
COST TARGET: $${form.costTarget}
${form.constraints ? `ADDITIONAL: ${form.constraints}` : ''}
UNITS: ${state.units}

Generate DIVERSE approaches (topology-optimized, traditional, biomimetic, lattice, hybrid).
Each must include actual CAD geometry commands and realistic engineering analysis.`
            }]
          }
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) throw new Error('Rate limited — try again shortly.');
        if (resp.status === 402) throw new Error('AI credits exhausted.');
        throw new Error('Generation failed');
      }

      const result = await resp.json();
      const parsed = parseJSON(result.content || '');
      if (parsed?.designs?.length > 0) {
        setDesigns(parsed.designs);
        setRecommendation(parsed.recommendation || '');
        toast.success(`Generated ${parsed.designs.length} design variants`);
      } else {
        toast.error('No designs generated');
      }
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const applyDesign = (design: DesignVariant) => {
    if (!design.commands?.length) {
      toast.error('No geometry data in this variant');
      return;
    }
    const entities: AnyCADEntity[] = [];
    design.commands.forEach((cmd: any) => {
      let entity: AnyCADEntity | null = null;
      const layerId = state.activeLayerId;
      switch (cmd.tool) {
        case 'box3d': entity = { id: generateId(), type: 'box3d', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'cylinder': entity = { id: generateId(), type: 'cylinder', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'sphere': entity = { id: generateId(), type: 'sphere', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'cone': entity = { id: generateId(), type: 'cone', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'rectangle': entity = { id: generateId(), type: 'rectangle', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'polyline': entity = { id: generateId(), type: 'polyline', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'line': entity = { id: generateId(), type: 'line', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'circle': entity = { id: generateId(), type: 'circle', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'polygon': entity = { id: generateId(), type: 'polygon', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'torus': entity = { id: generateId(), type: 'torus', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'pyramid': entity = { id: generateId(), type: 'pyramid', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'tube': entity = { id: generateId(), type: 'tube', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'wall': entity = { id: generateId(), type: 'wall', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'slab': entity = { id: generateId(), type: 'slab', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'column': entity = { id: generateId(), type: 'column', layerId, data: cmd.params } as AnyCADEntity; break;
      }
      if (entity) entities.push(entity);
    });

    if (entities.length > 0) {
      dispatch({ type: 'ADD_ENTITIES', payload: entities });
      toast.success(`Applied "${design.name}" — ${entities.length} entities`, { icon: <Sparkles className="h-4 w-4" /> });
    }
  };

  const parseJSON = (text: string) => {
    try {
      const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
      return match ? JSON.parse(match[1]) : JSON.parse(text);
    } catch { return null; }
  };

  const approachIcon = (a: string) => {
    switch (a) {
      case 'topology': return <Network className="h-4 w-4 text-purple-400" />;
      case 'biomimetic': return <Atom className="h-4 w-4 text-emerald-400" />;
      case 'lattice': return <Hexagon className="h-4 w-4 text-cyan-400" />;
      case 'traditional': return <Box className="h-4 w-4 text-amber-400" />;
      case 'hybrid': return <Layers className="h-4 w-4 text-pink-400" />;
      default: return <FlaskConical className="h-4 w-4 text-white/40" />;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 w-[720px] max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-semibold text-white">Generative Design Studio</h2>
            <p className="text-[11px] text-white/40">AI topology optimization & multi-variant generation</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-5">
            {/* Design Goals */}
            <div>
              <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-2">Optimization Goal</div>
              <div className="grid grid-cols-4 gap-2">
                {DESIGN_GOALS.map(g => (
                  <button key={g.id} onClick={() => updateForm('goal', g.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
                      form.goal === g.id
                        ? "border-violet-500/40 bg-violet-500/10"
                        : "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1]"
                    )}>
                    <g.icon className={cn("h-5 w-5", form.goal === g.id ? "text-violet-400" : "text-white/30")} />
                    <span className={cn("text-[10px] font-medium", form.goal === g.id ? "text-violet-300" : "text-white/40")}>{g.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Load Configuration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] text-white/30 mb-1.5 block">Load Type</label>
                <Select value={form.loadType} onValueChange={(v) => updateForm('loadType', v)}>
                  <SelectTrigger className="h-9 text-[11px] bg-white/[0.04] border-white/[0.08]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/[0.08]">
                    {LOAD_TYPES.map(l => <SelectItem key={l.id} value={l.id} className="text-[11px]">{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-white/30 mb-1.5 block">Force (N)</label>
                <input type="number" value={form.loadValue} onChange={e => updateForm('loadValue', parseInt(e.target.value) || 0)}
                  className="h-9 w-full rounded-md bg-white/[0.04] border border-white/[0.08] px-3 text-[11px] text-white/80 outline-none focus:border-violet-500/40" />
              </div>
              <div>
                <label className="text-[10px] text-white/30 mb-1.5 block">Material</label>
                <Select value={form.material} onValueChange={(v) => updateForm('material', v)}>
                  <SelectTrigger className="h-9 text-[11px] bg-white/[0.04] border-white/[0.08]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/[0.08]">
                    {['steel', 'aluminum', 'titanium', 'pla', 'abs', 'nylon', 'carbon_fiber', 'wood', 'concrete'].map(m => (
                      <SelectItem key={m} value={m} className="text-[11px] capitalize">{m.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Manufacturing & Envelope */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/30 mb-1.5 block">Manufacturing Method</label>
                <Select value={form.method} onValueChange={(v) => updateForm('method', v)}>
                  <SelectTrigger className="h-9 text-[11px] bg-white/[0.04] border-white/[0.08]"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/[0.08]">
                    {MANUFACTURING_METHODS.map(m => <SelectItem key={m.id} value={m.id} className="text-[11px]">{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-white/30 mb-1.5 block">Safety Factor: {form.safetyFactor}×</label>
                <Slider value={[form.safetyFactor]} onValueChange={([v]) => updateForm('safetyFactor', v)}
                  min={1.0} max={5.0} step={0.5} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {['maxWidth', 'maxDepth', 'maxHeight'].map(key => (
                <div key={key}>
                  <label className="text-[10px] text-white/30 mb-1 block">{key.replace('max', 'Max ')} (mm)</label>
                  <input type="number" value={(form as any)[key]} onChange={e => updateForm(key, parseInt(e.target.value) || 0)}
                    className="h-8 w-full rounded-md bg-white/[0.04] border border-white/[0.08] px-3 text-[11px] text-white/80 outline-none focus:border-violet-500/40" />
                </div>
              ))}
            </div>

            <Button onClick={generate} disabled={loading} className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-[12px] h-10">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate Design Variants
            </Button>

            {/* Results */}
            {designs.length > 0 && (
              <div className="space-y-3">
                <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest">
                  {designs.length} Design Variants Generated
                </div>

                {designs.map((design, i) => (
                  <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                    <button onClick={() => setExpandedDesign(expandedDesign === i ? null : i)}
                      className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition-all">
                      {approachIcon(design.approach)}
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] font-semibold text-white/80">{design.name}</div>
                        <div className="text-[10px] text-white/30 truncate">{design.description}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {design.metrics && (
                          <>
                            <div className="text-center">
                              <div className="text-[10px] font-mono text-white/60">{design.metrics.weight_kg?.toFixed(2)}kg</div>
                              <div className="text-[8px] text-white/20">Weight</div>
                            </div>
                            <div className="text-center">
                              <div className={cn("text-[10px] font-mono",
                                design.metrics.safety_factor >= form.safetyFactor ? "text-emerald-400" : "text-red-400"
                              )}>{design.metrics.safety_factor?.toFixed(1)}×</div>
                              <div className="text-[8px] text-white/20">Safety</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[10px] font-mono text-white/60">${design.metrics.estimated_cost?.toFixed(0)}</div>
                              <div className="text-[8px] text-white/20">Cost</div>
                            </div>
                          </>
                        )}
                        {expandedDesign === i ? <ChevronUp className="h-3.5 w-3.5 text-white/20" /> : <ChevronDown className="h-3.5 w-3.5 text-white/20" />}
                      </div>
                    </button>

                    {expandedDesign === i && (
                      <div className="px-4 pb-4 border-t border-white/[0.04] pt-3 space-y-3">
                        {/* Metrics bar */}
                        {design.metrics && (
                          <div className="grid grid-cols-4 gap-2">
                            <div className="p-2 rounded-lg bg-white/[0.03] text-center">
                              <div className="text-[10px] font-mono text-white/60">{design.metrics.max_stress_mpa?.toFixed(0)} MPa</div>
                              <div className="text-[8px] text-white/20">Max Stress</div>
                            </div>
                            <div className="p-2 rounded-lg bg-white/[0.03] text-center">
                              <div className="text-[10px] font-mono text-white/60">{design.metrics.max_deflection_mm?.toFixed(2)}mm</div>
                              <div className="text-[8px] text-white/20">Deflection</div>
                            </div>
                            <div className="p-2 rounded-lg bg-white/[0.03] text-center">
                              <div className="text-[10px] font-mono text-white/60">{((design.metrics.volume_mm3 || 0) / 1000).toFixed(1)}cm³</div>
                              <div className="text-[8px] text-white/20">Volume</div>
                            </div>
                            <div className="p-2 rounded-lg bg-white/[0.03] text-center">
                              <div className="text-[10px] font-mono text-white/60">{design.metrics.material_utilization_percent?.toFixed(0)}%</div>
                              <div className="text-[8px] text-white/20">Utilization</div>
                            </div>
                          </div>
                        )}

                        {/* Pros/Cons */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="text-[9px] text-emerald-400/60 uppercase mb-1 font-bold">Advantages</div>
                            {design.pros?.map((p, j) => (
                              <div key={j} className="flex items-start gap-1.5 text-[10px] text-white/40 mb-0.5">
                                <CheckCircle2 className="h-3 w-3 text-emerald-400/50 mt-0.5 shrink-0" />
                                {p}
                              </div>
                            ))}
                          </div>
                          <div>
                            <div className="text-[9px] text-red-400/60 uppercase mb-1 font-bold">Trade-offs</div>
                            {design.cons?.map((c, j) => (
                              <div key={j} className="flex items-start gap-1.5 text-[10px] text-white/40 mb-0.5">
                                <X className="h-3 w-3 text-red-400/50 mt-0.5 shrink-0" />
                                {c}
                              </div>
                            ))}
                          </div>
                        </div>

                        {design.manufacturing_notes && (
                          <p className="text-[10px] text-white/30 italic">{design.manufacturing_notes}</p>
                        )}

                        <Button onClick={() => applyDesign(design)} size="sm"
                          className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-[11px]">
                          <Plus className="h-3.5 w-3.5 mr-1.5" /> Apply This Design
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {recommendation && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/8 to-purple-500/8 border border-violet-500/15">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-4 w-4 text-violet-400" />
                      <span className="text-[12px] font-semibold text-violet-300">AI Recommendation</span>
                    </div>
                    <p className="text-[11px] text-white/50 leading-relaxed">{recommendation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
