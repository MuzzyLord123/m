import { useCAD } from '../CADContext';
import { MATERIAL_PRESETS, MaterialPreset, AnyCADEntity } from '../cadTypes';
import { cn } from '@/lib/utils';
import { X, Box, Ruler, Paintbrush, Info } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

function getEntityDimensions(entity: AnyCADEntity): Record<string, string> {
  const d = entity.data as any;
  const dims: Record<string, string> = {};
  
  switch (entity.type) {
    case 'box3d': case 'wall':
      dims['Width'] = `${d.width?.toFixed(2)}`;
      dims['Height'] = `${d.height?.toFixed(2)}`;
      dims['Depth'] = `${d.depth?.toFixed(2)}`;
      dims['Volume'] = `${(d.width * d.height * d.depth).toFixed(2)}`;
      dims['Surface'] = `${(2 * (d.width * d.height + d.width * d.depth + d.height * d.depth)).toFixed(2)}`;
      break;
    case 'sphere':
      dims['Radius'] = `${d.radius?.toFixed(2)}`;
      dims['Volume'] = `${(4/3 * Math.PI * d.radius ** 3).toFixed(2)}`;
      dims['Surface'] = `${(4 * Math.PI * d.radius ** 2).toFixed(2)}`;
      break;
    case 'cylinder': case 'column':
      dims['Radius'] = `${d.radius?.toFixed(2)}`;
      dims['Height'] = `${d.height?.toFixed(2)}`;
      dims['Volume'] = `${(Math.PI * d.radius ** 2 * d.height).toFixed(2)}`;
      break;
    case 'rectangle':
      dims['Width'] = `${d.width?.toFixed(2)}`;
      dims['Height'] = `${d.height?.toFixed(2)}`;
      dims['Area'] = `${(d.width * d.height).toFixed(2)}`;
      if (d.extrude) dims['Extrude'] = `${d.extrude.toFixed(2)}`;
      break;
    case 'circle':
      dims['Radius'] = `${d.radius?.toFixed(2)}`;
      dims['Area'] = `${(Math.PI * d.radius ** 2).toFixed(2)}`;
      dims['Circumference'] = `${(2 * Math.PI * d.radius).toFixed(2)}`;
      break;
    case 'slab':
      dims['Width'] = `${d.width?.toFixed(2)}`;
      dims['Depth'] = `${d.depth?.toFixed(2)}`;
      dims['Thickness'] = `${d.thickness?.toFixed(2)}`;
      break;
    case 'line3d':
      const dx = d.end.x - d.start.x, dy = d.end.y - d.start.y, dz = d.end.z - d.start.z;
      dims['Length'] = `${Math.sqrt(dx*dx + dy*dy + dz*dz).toFixed(2)}`;
      break;
    case 'line':
      const ldx = d.end.x - d.start.x, ldy = d.end.y - d.start.y;
      dims['Length'] = `${Math.sqrt(ldx*ldx + ldy*ldy).toFixed(2)}`;
      break;
  }
  return dims;
}

function getEntityPosition(entity: AnyCADEntity): string {
  const d = entity.data as any;
  if (d.origin) return `${d.origin.x?.toFixed(1)}, ${d.origin.y?.toFixed(1)}, ${d.origin.z?.toFixed(1)}`;
  if (d.base) return `${d.base.x?.toFixed(1)}, ${d.base.y?.toFixed(1)}, ${d.base.z?.toFixed(1)}`;
  if (d.center) return `${d.center.x?.toFixed(1)}, ${(d.center.y || 0)?.toFixed(1)}, ${(d.center.z || d.center.y || 0)?.toFixed(1)}`;
  if (d.start) return `${d.start.x?.toFixed(1)}, ${(d.start.y || 0)?.toFixed(1)}, ${(d.start.z || d.start.y || 0)?.toFixed(1)}`;
  return '0, 0, 0';
}

export function SketchUpEntityInfo({ open, onClose }: Props) {
  const { state, dispatch } = useCAD();

  if (!open) return null;

  const selectedEntities = state.entities.filter(e => state.selectedIds.includes(e.id));

  const materialPresets = Object.keys(MATERIAL_PRESETS) as MaterialPreset[];

  const handleMaterialChange = (preset: MaterialPreset) => {
    state.selectedIds.forEach(id => {
      dispatch({ type: 'UPDATE_ENTITY', payload: { id, changes: { material: MATERIAL_PRESETS[preset] } } });
    });
  };

  return (
    <div className="fixed z-[998] bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/[0.04] flex flex-col"
      style={{ top: '68px', right: 0, bottom: '28px', width: '240px' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-1.5">
          <Info className="h-3 w-3 text-blue-400" />
          <span className="text-[11px] font-semibold text-white/70">Entity Info</span>
        </div>
        <button onClick={onClose} className="h-5 w-5 flex items-center justify-center rounded text-white/30 hover:text-white/70 transition-all">
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#1a1a1a transparent' }}>
        {selectedEntities.length === 0 ? (
          <div className="text-center py-8 text-white/20 text-[10px]">Select an entity to view info</div>
        ) : selectedEntities.length === 1 ? (
          <>
            {/* Entity type */}
            <div className="space-y-1.5">
              <div className="text-[8px] text-white/30 uppercase tracking-wider font-bold">Type</div>
              <div className="text-[11px] text-white/70 capitalize font-medium">{selectedEntities[0].type.replace(/[-_]/g, ' ')}</div>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <div className="text-[8px] text-white/30 uppercase tracking-wider font-bold">Position</div>
              <div className="text-[10px] text-white/50 font-mono">{getEntityPosition(selectedEntities[0])}</div>
            </div>

            {/* Dimensions */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Ruler className="h-2.5 w-2.5 text-white/20" />
                <div className="text-[8px] text-white/30 uppercase tracking-wider font-bold">Dimensions</div>
              </div>
              {Object.entries(getEntityDimensions(selectedEntities[0])).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between px-2 py-1 rounded bg-white/[0.02]">
                  <span className="text-[9px] text-white/40">{key}</span>
                  <span className="text-[9px] text-white/70 font-mono">{val}</span>
                </div>
              ))}
            </div>

            {/* Layer */}
            <div className="space-y-1.5">
              <div className="text-[8px] text-white/30 uppercase tracking-wider font-bold">Layer</div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: state.layers.find(l => l.id === selectedEntities[0].layerId)?.color }} />
                <span className="text-[10px] text-white/50">
                  {state.layers.find(l => l.id === selectedEntities[0].layerId)?.name}
                </span>
              </div>
            </div>

            {/* Material paint bucket */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1">
                <Paintbrush className="h-2.5 w-2.5 text-white/20" />
                <div className="text-[8px] text-white/30 uppercase tracking-wider font-bold">Material</div>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {materialPresets.slice(0, 24).map(preset => (
                  <button key={preset}
                    onClick={() => handleMaterialChange(preset)}
                    className={cn(
                      "h-6 w-6 rounded border transition-all",
                      selectedEntities[0].material?.preset === preset
                        ? "border-[#3B82F6] ring-1 ring-[#3B82F6]/30"
                        : "border-white/[0.08] hover:border-white/20"
                    )}
                    style={{ backgroundColor: MATERIAL_PRESETS[preset].color }}
                    title={preset.replace(/-/g, ' ')}
                  />
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div className="text-[10px] text-white/50">{selectedEntities.length} entities selected</div>
            <div className="space-y-1.5">
              <div className="text-[8px] text-white/30 uppercase tracking-wider font-bold">Apply Material</div>
              <div className="grid grid-cols-6 gap-1">
                {materialPresets.slice(0, 18).map(preset => (
                  <button key={preset}
                    onClick={() => handleMaterialChange(preset)}
                    className="h-6 w-6 rounded border border-white/[0.08] hover:border-white/20 transition-all"
                    style={{ backgroundColor: MATERIAL_PRESETS[preset].color }}
                    title={preset.replace(/-/g, ' ')}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
