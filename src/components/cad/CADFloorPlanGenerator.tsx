import { useState, useCallback } from 'react';
import { useCAD } from './CADContext';
import { generateId } from './cadGeometry';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  X, Home, Building2, BedDouble, Bath, UtensilsCrossed, Sofa, Car, TreePine,
  DoorOpen, PanelTop, Layers, Sparkles, Loader2, SquareDashedBottom,
  ArrowRight, Ruler, LayoutGrid, ChevronDown, ChevronUp, Zap,
  Plus, Download, Eye, RotateCcw, Building, Warehouse, School
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnyCADEntity, Point3D } from './cadTypes';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface RoomTemplate {
  id: string;
  name: string;
  icon: any;
  defaultSize: { w: number; d: number };
  color: string;
  wallHeight: number;
  features: string[];
}

const ROOM_TEMPLATES: RoomTemplate[] = [
  { id: 'living', name: 'Living Room', icon: Sofa, defaultSize: { w: 50, d: 40 }, color: '#60A5FA', wallHeight: 28, features: ['windows', 'fireplace'] },
  { id: 'bedroom', name: 'Bedroom', icon: BedDouble, defaultSize: { w: 40, d: 35 }, color: '#A78BFA', wallHeight: 28, features: ['window', 'closet'] },
  { id: 'kitchen', name: 'Kitchen', icon: UtensilsCrossed, defaultSize: { w: 40, d: 30 }, color: '#34D399', wallHeight: 28, features: ['counter', 'sink'] },
  { id: 'bathroom', name: 'Bathroom', icon: Bath, defaultSize: { w: 25, d: 20 }, color: '#22D3EE', wallHeight: 28, features: ['shower', 'toilet'] },
  { id: 'garage', name: 'Garage', icon: Car, defaultSize: { w: 60, d: 50 }, color: '#FB923C', wallHeight: 30, features: ['garage_door'] },
  { id: 'office', name: 'Office', icon: Building2, defaultSize: { w: 35, d: 30 }, color: '#F59E0B', wallHeight: 28, features: ['window', 'desk_area'] },
];

const BUILDING_TYPES = [
  { id: 'residential', name: 'Residential House', icon: Home, desc: 'Single family home' },
  { id: 'apartment', name: 'Apartment Unit', icon: Building, desc: 'Multi-unit flat' },
  { id: 'office_building', name: 'Office Space', icon: Building2, desc: 'Commercial workspace' },
  { id: 'warehouse', name: 'Warehouse', icon: Warehouse, desc: 'Industrial storage' },
  { id: 'school', name: 'Education', icon: School, desc: 'Classrooms & halls' },
];

interface FloorPlanConfig {
  buildingType: string;
  totalArea: number;
  floors: number;
  wallThickness: number;
  wallHeight: number;
  rooms: { templateId: string; count: number; customSize?: { w: number; d: number } }[];
  includeWindows: boolean;
  includeDoors: boolean;
  includeDimensions: boolean;
  includeFurniture: boolean;
  style: 'modern' | 'traditional' | 'minimalist' | 'open_plan';
}

export function CADFloorPlanGenerator({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, dispatch } = useCAD();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'type' | 'rooms' | 'config' | 'generate'>('type');
  const [config, setConfig] = useState<FloorPlanConfig>({
    buildingType: 'residential',
    totalArea: 150,
    floors: 1,
    wallThickness: 2,
    wallHeight: 28,
    rooms: [
      { templateId: 'living', count: 1 },
      { templateId: 'bedroom', count: 2 },
      { templateId: 'kitchen', count: 1 },
      { templateId: 'bathroom', count: 1 },
    ],
    includeWindows: true,
    includeDoors: true,
    includeDimensions: true,
    includeFurniture: false,
    style: 'modern',
  });
  const [previewData, setPreviewData] = useState<any>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('rooms');

  const addRoom = (templateId: string) => {
    const existing = config.rooms.find(r => r.templateId === templateId);
    if (existing) {
      setConfig(prev => ({
        ...prev,
        rooms: prev.rooms.map(r => r.templateId === templateId ? { ...r, count: r.count + 1 } : r)
      }));
    } else {
      setConfig(prev => ({ ...prev, rooms: [...prev.rooms, { templateId, count: 1 }] }));
    }
  };

  const removeRoom = (templateId: string) => {
    setConfig(prev => ({
      ...prev,
      rooms: prev.rooms.map(r => r.templateId === templateId ? { ...r, count: Math.max(0, r.count - 1) } : r).filter(r => r.count > 0)
    }));
  };

  const generateFloorPlan = async () => {
    setLoading(true);
    try {
      const roomDesc = config.rooms.map(r => {
        const tmpl = ROOM_TEMPLATES.find(t => t.id === r.templateId);
        return `${r.count}× ${tmpl?.name} (default ${tmpl?.defaultSize.w}×${tmpl?.defaultSize.d} ${state.units})`;
      }).join(', ');

      const prompt = `Generate a complete architectural floor plan with these specifications:

BUILDING: ${config.buildingType} | Style: ${config.style}
AREA: ~${config.totalArea}m² total | Floors: ${config.floors}
WALL: ${config.wallThickness} ${state.units} thick, ${config.wallHeight} ${state.units} tall
ROOMS: ${roomDesc}

REQUIREMENTS:
${config.includeWindows ? '- Include windows on exterior walls (1200×1500mm typical)' : ''}
${config.includeDoors ? '- Include interior doors (900×2100mm) and entry door (1200×2100mm)' : ''}
${config.includeDimensions ? '- Add linear dimensions for all walls and key features' : ''}
${config.includeFurniture ? '- Add basic furniture layout as rectangles (beds, tables, counters, sofas)' : ''}

LAYOUT RULES:
- Start at origin (0,0,0)
- Rooms must share walls (no gaps)
- Hallway/corridor connecting rooms (min 1200mm wide)
- Kitchen and bathrooms should share a plumbing wall
- Living areas near entry, bedrooms away from noise
- Windows on exterior walls only
- Proper door swing clearance
- Comply with building codes (min room sizes, egress)

Generate ALL walls, doors, windows, slabs, and dimensions as CAD commands.`;

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/cad-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          action: 'floor-plan',
          data: { messages: [{ role: 'user', content: prompt }] },
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) throw new Error('Rate limited — try again shortly.');
        if (resp.status === 402) throw new Error('AI credits exhausted.');
        throw new Error('Generation failed');
      }

      const result = await resp.json();
      const content = result.content || '';
      const parsed = parseJSON(content);

      if (parsed?.commands?.length > 0) {
        setPreviewData(parsed);
        setStep('generate');
        toast.success(`Generated ${parsed.commands.length} entities`);
      } else {
        toast.error('No geometry generated — try adjusting parameters');
      }
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const applyFloorPlan = () => {
    if (!previewData?.commands) return;
    const entities: AnyCADEntity[] = [];
    const layerId = state.activeLayerId;

    previewData.commands.forEach((cmd: any) => {
      let entity: AnyCADEntity | null = null;
      switch (cmd.tool) {
        case 'wall': entity = { id: generateId(), type: 'wall', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'door': entity = { id: generateId(), type: 'door', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'window': entity = { id: generateId(), type: 'window', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'slab': entity = { id: generateId(), type: 'slab', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'rectangle': entity = { id: generateId(), type: 'rectangle', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'line': entity = { id: generateId(), type: 'line', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'text': entity = { id: generateId(), type: 'text', layerId: 'layer-text', data: { ...cmd.params, fontSize: cmd.params.fontSize || 3, fontFamily: 'monospace' } } as AnyCADEntity; break;
        case 'dim-linear': case 'dimension':
          entity = { id: generateId(), type: 'dimension', layerId: 'layer-dims', data: { ...cmd.params, dimType: cmd.params.type || 'linear' } } as AnyCADEntity; break;
        case 'column': entity = { id: generateId(), type: 'column', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'stairs': entity = { id: generateId(), type: 'stairs', layerId, data: cmd.params } as AnyCADEntity; break;
        case 'box3d': entity = { id: generateId(), type: 'box3d', layerId, data: cmd.params } as AnyCADEntity; break;
      }
      if (entity) entities.push(entity);
    });

    if (entities.length > 0) {
      dispatch({ type: 'ADD_ENTITIES', payload: entities });
      toast.success(`Applied floor plan — ${entities.length} entities created`, { icon: <Home className="h-4 w-4" /> });
      onClose();
    }
  };

  const parseJSON = (text: string) => {
    try {
      const match = text.match(/```json\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
      return match ? JSON.parse(match[1]) : JSON.parse(text);
    } catch { return null; }
  };

  const quickFloorPlan = async (type: string) => {
    setLoading(true);
    try {
      const prompts: Record<string, string> = {
        studio: 'Generate a 35m² studio apartment floor plan: open living+kitchen area, bathroom, sleeping nook. Modern style. Include all walls, doors, windows, slab, and dimensions.',
        '2bed': 'Generate a 75m² 2-bedroom apartment: living room, kitchen, 2 bedrooms, 1 bathroom, hallway. Include all walls, doors, windows, slab, and dimensions.',
        '3bed': 'Generate a 120m² 3-bedroom house: living room, dining, kitchen, 3 bedrooms, 2 bathrooms, hallway, entry porch. Include all walls, doors, windows, slab, and dimensions.',
        office: 'Generate a 200m² office floor plan: reception, 4 private offices, open workspace, meeting room, kitchen, 2 bathrooms. Include all walls, doors, windows, slab, and dimensions.',
        warehouse: 'Generate a 500m² warehouse: main storage area, loading dock, small office, bathroom. Include all walls, doors (large roller door), windows, slab, and dimensions.',
      };

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/cad-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          action: 'floor-plan',
          data: { messages: [{ role: 'user', content: prompts[type] || prompts.studio }] },
        }),
      });

      if (!resp.ok) throw new Error('Generation failed');
      const result = await resp.json();
      const parsed = parseJSON(result.content || '');

      if (parsed?.commands?.length > 0) {
        setPreviewData(parsed);
        setStep('generate');
        toast.success(`Quick plan generated — ${parsed.commands.length} entities`);
      } else {
        toast.error('Generation failed');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const totalRooms = config.rooms.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60 w-[680px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/[0.06]">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Home className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-[15px] font-semibold text-white">Architectural Floor Plan Generator</h2>
            <p className="text-[11px] text-white/40">AI-powered building layout with code compliance</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-5">

            {/* Quick Templates */}
            <div>
              <div className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-3">Quick Templates</div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { id: 'studio', label: 'Studio', area: '35m²', icon: Home },
                  { id: '2bed', label: '2-Bed Apt', area: '75m²', icon: Building },
                  { id: '3bed', label: '3-Bed House', area: '120m²', icon: Home },
                  { id: 'office', label: 'Office', area: '200m²', icon: Building2 },
                  { id: 'warehouse', label: 'Warehouse', area: '500m²', icon: Warehouse },
                ].map(t => (
                  <button key={t.id} onClick={() => quickFloorPlan(t.id)} disabled={loading}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-amber-500/30 hover:bg-amber-500/5 transition-all disabled:opacity-30 group">
                    <t.icon className="h-5 w-5 text-white/30 group-hover:text-amber-400 transition-colors" />
                    <span className="text-[10px] font-medium text-white/50 group-hover:text-white/80">{t.label}</span>
                    <span className="text-[9px] text-white/20">{t.area}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/[0.04]" />

            {/* Room Configuration */}
            <div>
              <button onClick={() => setExpandedSection(expandedSection === 'rooms' ? null : 'rooms')}
                className="flex items-center gap-2 w-full text-left mb-3">
                <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Custom Room Layout</span>
                {expandedSection === 'rooms' ? <ChevronUp className="h-3 w-3 text-white/20" /> : <ChevronDown className="h-3 w-3 text-white/20" />}
              </button>
              {expandedSection === 'rooms' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    {ROOM_TEMPLATES.map(tmpl => {
                      const room = config.rooms.find(r => r.templateId === tmpl.id);
                      const count = room?.count || 0;
                      return (
                        <div key={tmpl.id} className={cn(
                          "flex items-center gap-2 p-2.5 rounded-xl border transition-all",
                          count > 0 ? "border-white/[0.1] bg-white/[0.04]" : "border-white/[0.04] bg-white/[0.01]"
                        )}>
                          <tmpl.icon className="h-4 w-4 shrink-0" style={{ color: tmpl.color + '80' }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-medium text-white/60 truncate">{tmpl.name}</div>
                            <div className="text-[8px] text-white/20">{tmpl.defaultSize.w}×{tmpl.defaultSize.d}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => removeRoom(tmpl.id)} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 text-[10px]">−</button>
                            <span className="text-[11px] font-mono text-white/60 w-3 text-center">{count}</span>
                            <button onClick={() => addRoom(tmpl.id)} className="h-5 w-5 rounded flex items-center justify-center text-white/20 hover:text-white hover:bg-white/10 text-[10px]">+</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-white/30 px-1">
                    <span>{totalRooms} rooms configured</span>
                  </div>
                </div>
              )}
            </div>

            {/* Build Settings */}
            <div>
              <button onClick={() => setExpandedSection(expandedSection === 'settings' ? null : 'settings')}
                className="flex items-center gap-2 w-full text-left mb-3">
                <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Build Settings</span>
                {expandedSection === 'settings' ? <ChevronUp className="h-3 w-3 text-white/20" /> : <ChevronDown className="h-3 w-3 text-white/20" />}
              </button>
              {expandedSection === 'settings' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] text-white/30 mb-1 block">Style</label>
                      <Select value={config.style} onValueChange={(v: any) => setConfig(p => ({ ...p, style: v }))}>
                        <SelectTrigger className="h-8 text-[11px] bg-white/[0.04] border-white/[0.08]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-white/[0.08]">
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="traditional">Traditional</SelectItem>
                          <SelectItem value="minimalist">Minimalist</SelectItem>
                          <SelectItem value="open_plan">Open Plan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/30 mb-1 block">Floors</label>
                      <Select value={String(config.floors)} onValueChange={(v) => setConfig(p => ({ ...p, floors: parseInt(v) }))}>
                        <SelectTrigger className="h-8 text-[11px] bg-white/[0.04] border-white/[0.08]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-white/[0.08]">
                          {[1, 2, 3].map(n => <SelectItem key={n} value={String(n)}>{n} Floor{n > 1 ? 's' : ''}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-white/30 mb-1.5 block">Wall Thickness: {config.wallThickness} {state.units}</label>
                    <Slider value={[config.wallThickness]} onValueChange={([v]) => setConfig(p => ({ ...p, wallThickness: v }))}
                      min={1} max={5} step={0.5} className="w-full" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'includeWindows', label: 'Windows', icon: PanelTop },
                      { key: 'includeDoors', label: 'Doors', icon: DoorOpen },
                      { key: 'includeDimensions', label: 'Dimensions', icon: Ruler },
                      { key: 'includeFurniture', label: 'Furniture', icon: Sofa },
                    ].map(opt => (
                      <button key={opt.key}
                        onClick={() => setConfig(p => ({ ...p, [opt.key]: !(p as any)[opt.key] }))}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg border transition-all text-[10px]",
                          (config as any)[opt.key]
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                            : "border-white/[0.06] bg-white/[0.02] text-white/30 hover:text-white/50"
                        )}>
                        <opt.icon className="h-3.5 w-3.5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Preview */}
            {previewData && step === 'generate' && (
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-4 w-4 text-emerald-400" />
                  <span className="text-[12px] font-semibold text-emerald-300">Floor Plan Ready</span>
                  <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400 ml-auto">
                    {previewData.commands?.length || 0} entities
                  </Badge>
                </div>
                {previewData.explanation && (
                  <p className="text-[11px] text-white/50 mb-3 leading-relaxed">{previewData.explanation}</p>
                )}
                <div className="flex gap-2">
                  <Button onClick={applyFloorPlan} size="sm"
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-[11px] flex-1">
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Apply to Drawing
                  </Button>
                  <Button onClick={() => { setPreviewData(null); setStep('type'); }} size="sm" variant="outline"
                    className="text-[11px] border-white/[0.08]">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center gap-3">
          <div className="flex-1 text-[10px] text-white/20">
            {totalRooms} rooms · {config.style} · {config.floors}F
          </div>
          <Button onClick={onClose} variant="outline" size="sm" className="text-[11px] border-white/[0.08]">Cancel</Button>
          <Button onClick={generateFloorPlan} disabled={loading || totalRooms === 0} size="sm"
            className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-[11px]">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            Generate Floor Plan
          </Button>
        </div>
      </div>
    </div>
  );
}
