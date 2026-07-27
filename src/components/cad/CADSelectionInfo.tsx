import { useCAD } from './CADContext';

/**
 * Selection Info Bar — shows aggregate info when multiple entities are selected
 * Appears above the status bar with area/volume/length totals
 */
export function CADSelectionInfo() {
  const { state } = useCAD();
  const selected = state.entities.filter(e => state.selectedIds.includes(e.id));
  
  if (selected.length < 2) return null;

  // Calculate totals
  let totalLength = 0;
  let totalArea = 0;
  let totalVolume = 0;

  selected.forEach(e => {
    switch (e.type) {
      case 'line': {
        const dx = e.data.end.x - e.data.start.x, dy = e.data.end.y - e.data.start.y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
        break;
      }
      case 'line3d': {
        const dx = e.data.end.x - e.data.start.x, dy = e.data.end.y - e.data.start.y, dz = e.data.end.z - e.data.start.z;
        totalLength += Math.sqrt(dx * dx + dy * dy + dz * dz);
        break;
      }
      case 'circle':
        totalLength += 2 * Math.PI * e.data.radius;
        totalArea += Math.PI * e.data.radius ** 2;
        break;
      case 'rectangle':
        totalLength += 2 * (e.data.width + e.data.height);
        totalArea += e.data.width * e.data.height;
        if (e.data.extrude) totalVolume += e.data.width * e.data.height * e.data.extrude;
        break;
      case 'wall': case 'box3d':
        totalVolume += e.data.width * e.data.depth * e.data.height;
        totalArea += 2 * (e.data.width * e.data.depth + e.data.width * e.data.height + e.data.depth * e.data.height);
        break;
      case 'sphere':
        totalVolume += (4 / 3) * Math.PI * e.data.radius ** 3;
        totalArea += 4 * Math.PI * e.data.radius ** 2;
        break;
      case 'column': case 'cylinder':
        totalVolume += Math.PI * e.data.radius ** 2 * e.data.height;
        totalArea += 2 * Math.PI * e.data.radius * (e.data.radius + e.data.height);
        break;
      case 'slab':
        totalVolume += e.data.width * e.data.depth * e.data.thickness;
        break;
    }
  });

  const types = [...new Set(selected.map(e => e.type))];

  return (
    <div className="fixed bottom-[28px] left-[48px] right-0 h-5 bg-[#3B82F6]/[0.04] border-t border-[#3B82F6]/10 flex items-center px-3 gap-4 z-[999] text-[9px] font-mono select-none" style={{ bottom: '27px' }}>
      <span className="text-[#60A5FA] font-bold">{selected.length} selected</span>
      <span className="text-white/30">|</span>
      <span className="text-white/40">{types.join(', ')}</span>
      {totalLength > 0 && (
        <>
          <span className="text-white/30">|</span>
          <span className="text-emerald-400/60">Σ Length: {totalLength.toFixed(2)}</span>
        </>
      )}
      {totalArea > 0 && (
        <>
          <span className="text-white/30">|</span>
          <span className="text-amber-400/60">Σ Area: {totalArea.toFixed(2)}</span>
        </>
      )}
      {totalVolume > 0 && (
        <>
          <span className="text-white/30">|</span>
          <span className="text-purple-400/60">Σ Vol: {totalVolume.toFixed(2)}</span>
        </>
      )}
    </div>
  );
}
