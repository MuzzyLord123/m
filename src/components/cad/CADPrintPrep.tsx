import { useState, useCallback } from 'react';
import { useCAD } from './CADContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  X, Printer, AlertTriangle, CheckCircle2, XCircle, Info, Loader2,
  Box, Layers, Ruler, Download, RotateCcw, Zap, Shield, Eye,
  ChevronDown, ChevronUp, Settings2, BarChart3, Cpu, Target,
  ArrowDown, ArrowUp, Maximize2, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { stateToProjectData, exportSTL } from './CADFileOperations';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface PrintIssue {
  type: 'thin_wall' | 'overhang' | 'unsupported' | 'non_manifold' | 'small_feature' | 'bridging' | 'sharp_angle';
  severity: 'error' | 'warning' | 'info';
  description: string;
  entityIds?: string[];
  suggestion: string;
  value?: number;
  threshold?: number;
}

interface PrintAnalysis {
  issues: PrintIssue[];
  score: number;
  volume_mm3: number;
  surface_area_mm2: number;
  bounding_box: { w: number; d: number; h: number };
  estimated_time: { hours: number; minutes: number };
  material_weight_g: number;
  material_cost: number;
  supports_needed: boolean;
  support_volume_percent: number;
  orientation_suggestion: string;
  layer_height_recommendation: number;
  infill_recommendation: number;
  print_speed_recommendation: number;
}

const PRINTER_PRESETS = [
  { id: 'fdm_standard', name: 'FDM Standard', tech: 'FDM', layer: 0.2, nozzle: 0.4, minWall: 0.8, minFeature: 0.4 },
  { id: 'fdm_fine', name: 'FDM Fine Detail', tech: 'FDM', layer: 0.1, nozzle: 0.4, minWall: 0.8, minFeature: 0.3 },
  { id: 'fdm_fast', name: 'FDM Fast Draft', tech: 'FDM', layer: 0.3, nozzle: 0.6, minWall: 1.2, minFeature: 0.6 },
  { id: 'sla_standard', name: 'SLA Resin', tech: 'SLA', layer: 0.05, nozzle: 0, minWall: 0.5, minFeature: 0.15 },
  { id: 'sls', name: 'SLS Nylon', tech: 'SLS', layer: 0.1, nozzle: 0, minWall: 0.7, minFeature: 0.3 },
];

const MATERIALS = [
  { id: 'pla', name: 'PLA', density: 1.24, cost: 25, temp: 200 },
  { id: 'abs', name: 'ABS', density: 1.05, cost: 22, temp: 240 },
  { id: 'petg', name: 'PETG', density: 1.27, cost: 28, temp: 230 },
  { id: 'nylon', name: 'Nylon', density: 1.14, cost: 45, temp: 260 },
  { id: 'tpu', name: 'TPU', density: 1.21, cost: 35, temp: 220 },
  { id: 'cf_pla', name: 'Carbon Fiber PLA', density: 1.3, cost: 55, temp: 210 },
  { id: 'resin', name: 'Standard Resin', density: 1.1, cost: 40, temp: 0 },
];

export function CADPrintPrep({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useCAD();
  const [loading, setLoading] = useState(false);
  const [printer, setPrinter] = useState('fdm_standard');
  const [material, setMaterial] = useState('pla');
  const [infill, setInfill] = useState(20);
  const [analysis, setAnalysis] = useState<PrintAnalysis | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('analysis');
  const [scale, setScale] = useState(100);

  const printerPreset = PRINTER_PRESETS.find(p => p.id === printer)!;
  const materialPreset = MATERIALS.find(m => m.id === material)!;

  const runAnalysis = async () => {
    const solids = state.entities.filter(e => ['box3d', 'wall', 'column', 'slab', 'sphere', 'cone', 'cylinder', 'torus', 'pyramid', 'rectangle', 'stairs', 'tube', 'window', 'door'].includes(e.type));
    if (solids.length === 0) {
      toast.error('No 3D geometry found for print analysis');
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/cad-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          action: '3d-print-analysis',
          data: {
            messages: [{
              role: 'user',
              content: `Analyze these ${solids.length} CAD entities for 3D printing readiness.

PRINTER: ${printerPreset.name} (${printerPreset.tech})
- Layer height: ${printerPreset.layer}mm
- Min wall: ${printerPreset.minWall}mm
- Min feature: ${printerPreset.minFeature}mm
${printerPreset.nozzle > 0 ? `- Nozzle: ${printerPreset.nozzle}mm` : ''}

MATERIAL: ${materialPreset.name} (density: ${materialPreset.density} g/cm³, $${materialPreset.cost}/kg)
INFILL: ${infill}%
SCALE: ${scale}%
UNITS: ${state.units}

ENTITIES: ${JSON.stringify(solids.slice(0, 80).map(e => ({ type: e.type, data: e.data })))}

Analyze for:
1. Wall thickness violations (< ${printerPreset.minWall}mm)
2. Overhang angles (> 45° from vertical without support)
3. Bridging distances (> 10mm for FDM)
4. Small features below minimum
5. Non-manifold geometry / gaps
6. Sharp internal angles (< 30°)
7. Unsupported floating geometry

Calculate precise:
- Total volume, surface area, bounding box
- Estimated print time (based on speed ~60mm/s for FDM)
- Material weight and cost
- Support volume estimate
- Optimal print orientation`
            }]
          }
        }),
      });

      if (!resp.ok) throw new Error('Analysis failed');
      const result = await resp.json();
      const parsed = parseJSON(result.content || '');
      if (parsed) {
        setAnalysis(parsed);
        const issues = parsed.issues || [];
        const errors = issues.filter((i: PrintIssue) => i.severity === 'error').length;
        toast.success(`Analysis complete: ${errors} errors, ${issues.length - errors} warnings`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const exportForPrint = () => {
    const data = stateToProjectData(state);
    const stlContent = exportSTL(data);
    const blob = new Blob([stlContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'print-ready.stl';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported STL for 3D printing');
  };

  const parseJSON = (text: string) => {
    try {
      const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
      return match ? JSON.parse(match[1]) : JSON.parse(text);
    } catch { return null; }
  };

  const severityIcon = (s: string) => s === 'error' ? <XCircle className="h-3.5 w-3.5 text-red-400" /> : s === 'warning' ? <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> : <Info className="h-3.5 w-3.5 text-blue-400" />;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 w-[620px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Printer className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-semibold text-white">3D Print Preparation</h2>
            <p className="text-[11px] text-white/40">Analyze, validate & export for manufacturing</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-5">
            {/* Printer & Material Config */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/30 mb-1.5 block">Printer Profile</label>
                <Select value={printer} onValueChange={setPrinter}>
                  <SelectTrigger className="h-9 text-[11px] bg-white/[0.04] border-white/[0.08]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/[0.08]">
                    {PRINTER_PRESETS.map(p => (
                      <SelectItem key={p.id} value={p.id} className="text-[11px]">
                        {p.name} <span className="text-white/30 ml-1">({p.tech})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[10px] text-white/30 mb-1.5 block">Material</label>
                <Select value={material} onValueChange={setMaterial}>
                  <SelectTrigger className="h-9 text-[11px] bg-white/[0.04] border-white/[0.08]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#111] border-white/[0.08]">
                    {MATERIALS.map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-[11px]">
                        {m.name} <span className="text-white/30 ml-1">(${m.cost}/kg)</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-white/30 mb-1.5 block">Infill: {infill}%</label>
                <Slider value={[infill]} onValueChange={([v]) => setInfill(v)} min={5} max={100} step={5} />
              </div>
              <div>
                <label className="text-[10px] text-white/30 mb-1.5 block">Scale: {scale}%</label>
                <Slider value={[scale]} onValueChange={([v]) => setScale(v)} min={10} max={500} step={10} />
              </div>
            </div>

            {/* Printer Specs */}
            <div className="flex gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              {[
                { label: 'Layer', value: `${printerPreset.layer}mm` },
                { label: 'Min Wall', value: `${printerPreset.minWall}mm` },
                { label: 'Min Feature', value: `${printerPreset.minFeature}mm` },
                { label: 'Density', value: `${materialPreset.density} g/cm³` },
              ].map(s => (
                <div key={s.label} className="flex-1 text-center">
                  <div className="text-[9px] text-white/20 uppercase">{s.label}</div>
                  <div className="text-[11px] font-mono text-white/60 mt-0.5">{s.value}</div>
                </div>
              ))}
            </div>

            <Button onClick={runAnalysis} disabled={loading} className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-[12px] h-10">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
              Analyze for 3D Printing
            </Button>

            {/* Analysis Results */}
            {analysis && (
              <>
                {/* Score */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-white/[0.02] to-white/[0.01] border border-white/[0.06]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-semibold text-white">Print Readiness Score</span>
                    <span className={cn("text-[20px] font-bold",
                      analysis.score >= 80 ? "text-emerald-400" : analysis.score >= 50 ? "text-amber-400" : "text-red-400"
                    )}>{analysis.score}/100</span>
                  </div>
                  <Progress value={analysis.score}
                    className={cn("h-2", analysis.score >= 80 ? "[&>div]:bg-emerald-500" : analysis.score >= 50 ? "[&>div]:bg-amber-500" : "[&>div]:bg-red-500")} />
                </div>

                {/* Print Stats */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Volume', value: `${((analysis.volume_mm3 || 0) / 1000).toFixed(1)}cm³`, icon: Box },
                    { label: 'Weight', value: `${(analysis.material_weight_g || 0).toFixed(0)}g`, icon: ArrowDown },
                    { label: 'Time', value: `${analysis.estimated_time?.hours || 0}h${analysis.estimated_time?.minutes || 0}m`, icon: Cpu },
                    { label: 'Cost', value: `$${(analysis.material_cost || 0).toFixed(2)}`, icon: BarChart3 },
                  ].map(s => (
                    <div key={s.label} className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center">
                      <s.icon className="h-3.5 w-3.5 mx-auto text-white/20 mb-1" />
                      <div className="text-[12px] font-mono text-white/80">{s.value}</div>
                      <div className="text-[8px] text-white/20 uppercase mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Bounding Box */}
                {analysis.bounding_box && (
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Maximize2 className="h-3.5 w-3.5 text-white/20" />
                      <span className="text-[10px] text-white/40">Bounding Box</span>
                    </div>
                    <span className="text-[11px] font-mono text-white/60">
                      {analysis.bounding_box.w.toFixed(1)} × {analysis.bounding_box.d.toFixed(1)} × {analysis.bounding_box.h.toFixed(1)} mm
                    </span>
                  </div>
                )}

                {/* Issues */}
                {analysis.issues?.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-2">
                      Issues ({analysis.issues.length})
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                      {analysis.issues.map((issue, i) => (
                        <div key={i} className={cn(
                          "p-3 rounded-xl border",
                          issue.severity === 'error' ? 'border-red-500/20 bg-red-500/5' :
                          issue.severity === 'warning' ? 'border-amber-500/20 bg-amber-500/5' :
                          'border-blue-500/20 bg-blue-500/5'
                        )}>
                          <div className="flex items-start gap-2">
                            {severityIcon(issue.severity)}
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] text-white/70 font-medium">{issue.description}</p>
                              <p className="text-[10px] text-white/40 mt-0.5">{issue.suggestion}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {analysis.orientation_suggestion && (
                  <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/15">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Target className="h-3.5 w-3.5 text-cyan-400" />
                      <span className="text-[11px] font-semibold text-cyan-300">Orientation Recommendation</span>
                    </div>
                    <p className="text-[10px] text-white/50">{analysis.orientation_suggestion}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-3">
          <div className="flex-1 text-[10px] text-white/20">
            {state.entities.filter(e => ['box3d', 'wall', 'sphere', 'cylinder', 'cone', 'slab', 'column', 'pyramid', 'torus', 'stairs', 'tube'].includes(e.type)).length} 3D objects
          </div>
          <Button onClick={exportForPrint} variant="outline" size="sm" className="text-[11px] border-white/[0.08]">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export STL
          </Button>
        </div>
      </div>
    </div>
  );
}
