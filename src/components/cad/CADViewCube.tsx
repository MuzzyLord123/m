import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useCAD } from './CADContext';
import { Maximize2, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 6 faces + 12 edges + 8 corners = 26-point navigation
const faces = [
  { label: 'TOP', view: 'top', transform: 'rotateX(90deg) translateZ(28px)' },
  { label: 'BOTTOM', view: 'bottom', transform: 'rotateX(-90deg) translateZ(28px)' },
  { label: 'FRONT', view: 'front', transform: 'translateZ(28px)' },
  { label: 'BACK', view: 'back', transform: 'rotateY(180deg) translateZ(28px)' },
  { label: 'RIGHT', view: 'side', transform: 'rotateY(90deg) translateZ(28px)' },
  { label: 'LEFT', view: 'left', transform: 'rotateY(-90deg) translateZ(28px)' },
];

// Edge hotspots positioned between two faces
const edges = [
  { id: 'top-front', label: '', views: ['top', 'front'], style: { top: '-2px', left: '14px', width: '28px', height: '6px', transform: 'rotateX(45deg)', cursor: 'pointer' } },
  { id: 'top-right', label: '', views: ['top', 'side'], style: { top: '14px', right: '-2px', width: '6px', height: '28px', transform: 'rotateY(45deg)', cursor: 'pointer' } },
  { id: 'top-back', label: '', views: ['top', 'back'], style: { bottom: '-2px', left: '14px', width: '28px', height: '6px', cursor: 'pointer' } },
  { id: 'top-left', label: '', views: ['top', 'left'], style: { top: '14px', left: '-2px', width: '6px', height: '28px', cursor: 'pointer' } },
];

// Corner hotspots at cube vertices
const corners = [
  { id: 'top-front-right', style: { top: '-3px', right: '-3px', width: '8px', height: '8px' } },
  { id: 'top-front-left', style: { top: '-3px', left: '-3px', width: '8px', height: '8px' } },
  { id: 'top-back-right', style: { bottom: '-3px', right: '-3px', width: '8px', height: '8px' } },
  { id: 'top-back-left', style: { bottom: '-3px', left: '-3px', width: '8px', height: '8px' } },
];

export function CADViewCube() {
  const { state } = useCAD();
  const [hovered, setHovered] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [hoveredCorner, setHoveredCorner] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = useCallback((view: string) => {
    const setView = (window as any).__cadSetView;
    if (setView) setView(view);
  }, []);

  const handleZoomExtents = () => {
    const zoom = (window as any).__cadZoomExtents;
    if (zoom) zoom();
  };

  const handleResetView = () => {
    const reset = (window as any).__cadResetView;
    if (reset) reset();
  };

  const aiPanelOpen = (window as any).__cadAIPanelOpen;

  // Compute cube rotation from current view
  const getCubeRotation = () => {
    switch (state.currentView) {
      case 'top': return 'rotateX(-90deg) rotateZ(0deg)';
      case 'front': return 'rotateX(-20deg) rotateY(0deg)';
      case 'side': return 'rotateX(-20deg) rotateY(-90deg)';
      case 'perspective': return 'rotateX(-25deg) rotateY(-35deg)';
      default: return 'rotateX(-30deg) rotateY(-45deg)';
    }
  };

  return (
    <div
      className="fixed z-[999] select-none flex flex-col items-end gap-2.5 transition-all duration-300"
      style={{ top: '84px', right: state.propertiesPanelOpen ? '316px' : aiPanelOpen ? '416px' : '16px' }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* 3D View Cube — premium glass style with animated rotation */}
      <div className="w-[72px] h-[72px] relative cursor-pointer group" style={{ perspective: '280px' }}>
        {/* Compass ring with animated glow */}
        <div className={cn(
          "absolute inset-[-8px] rounded-full border transition-all duration-500",
          isExpanded ? "border-[#3B82F6]/20 shadow-[0_0_20px_rgba(59,130,246,0.08)]" : "border-white/[0.06]"
        )} />
        
        {/* Cardinal directions */}
        <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 text-[7px] text-red-400/60 font-bold tracking-wider">N</div>
        <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 text-[7px] text-white/15">S</div>
        <div className="absolute top-1/2 -translate-y-1/2 -right-[12px] text-[7px] text-white/15">E</div>
        <div className="absolute top-1/2 -translate-y-1/2 -left-[10px] text-[7px] text-white/15">W</div>

        {/* Animated cube */}
        <div
          className="w-full h-full relative"
          style={{
            transformStyle: 'preserve-3d',
            transform: getCubeRotation(),
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {faces.map(face => (
            <button
              key={face.label}
              onClick={() => handleClick(face.view)}
              onMouseEnter={() => setHovered(face.label)}
              onMouseLeave={() => setHovered(null)}
              className={cn(
                "absolute w-14 h-14 flex items-center justify-center text-[7px] font-bold tracking-[0.15em] border transition-all duration-200",
                "backdrop-blur-sm",
                hovered === face.label
                  ? "bg-[#3B82F6]/25 text-white border-[#3B82F6]/50 shadow-[0_0_12px_rgba(59,130,246,0.2)]"
                  : state.currentView === face.view
                    ? "bg-[#3B82F6]/12 text-[#60A5FA] border-[#3B82F6]/25"
                    : "bg-[#111111]/80 text-white/30 border-white/[0.06] hover:border-white/[0.12]"
              )}
              style={{ transform: face.transform, backfaceVisibility: 'hidden', left: '4px', top: '4px' }}
            >
              {face.label}
              
              {/* Edge hotspots on each face */}
              {edges.map(edge => (
                <div
                  key={edge.id}
                  className={cn(
                    "absolute rounded-sm transition-all duration-150",
                    hoveredEdge === `${face.label}-${edge.id}`
                      ? "bg-[#60A5FA]/40"
                      : "bg-transparent hover:bg-[#60A5FA]/20"
                  )}
                  style={{
                    ...(edge.style as any),
                    position: 'absolute',
                  }}
                  onMouseEnter={(e) => { e.stopPropagation(); setHoveredEdge(`${face.label}-${edge.id}`); }}
                  onMouseLeave={() => setHoveredEdge(null)}
                />
              ))}

              {/* Corner hotspots */}
              {corners.map(corner => (
                <div
                  key={corner.id}
                  className={cn(
                    "absolute rounded-full transition-all duration-150",
                    hoveredCorner === `${face.label}-${corner.id}`
                      ? "bg-[#F59E0B]/50 ring-1 ring-[#F59E0B]/30"
                      : "bg-transparent hover:bg-[#F59E0B]/25"
                  )}
                  style={{
                    ...(corner.style as any),
                    position: 'absolute',
                  }}
                  onMouseEnter={(e) => { e.stopPropagation(); setHoveredCorner(`${face.label}-${corner.id}`); }}
                  onMouseLeave={() => setHoveredCorner(null)}
                />
              ))}
            </button>
          ))}
        </div>
      </div>

      {/* Quick view buttons — glass morphism with active indicators */}
      <div className="flex flex-col gap-0.5 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.05] rounded-lg p-1">
        {[
          { key: 'top', label: 'T', full: 'Top (Ctrl+1)' },
          { key: 'front', label: 'F', full: 'Front (Ctrl+2)' },
          { key: 'side', label: 'R', full: 'Right (Ctrl+3)' },
          { key: 'isometric', label: 'I', full: 'ISO (Ctrl+4)' },
        ].map(v => (
          <motion.button
            key={v.key}
            onClick={() => handleClick(v.key)}
            title={v.full}
            className={cn(
              "text-[9px] font-bold uppercase tracking-widest w-8 h-7 rounded-md transition-all duration-150 flex items-center justify-center relative overflow-hidden",
              state.currentView === v.key
                ? "bg-[#3B82F6]/15 text-[#60A5FA] shadow-[inset_0_0_8px_rgba(59,130,246,0.1)]"
                : "text-white/25 hover:text-white/60 hover:bg-white/[0.04]"
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {state.currentView === v.key && (
              <motion.div
                className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full bg-[#3B82F6]"
                layoutId="viewIndicator"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            {v.label}
          </motion.button>
        ))}
        <div className="h-px bg-white/[0.04] my-0.5" />
        <motion.button
          onClick={handleZoomExtents}
          title="Zoom Extents"
          className="text-[9px] w-8 h-7 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.04] flex items-center justify-center transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Maximize2 className="h-3 w-3" />
        </motion.button>
        <motion.button
          onClick={handleResetView}
          title="Reset View"
          className="text-[9px] w-8 h-7 rounded-md text-white/25 hover:text-white/60 hover:bg-white/[0.04] flex items-center justify-center transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="h-3 w-3" />
        </motion.button>
      </div>

      {/* Expanded panel — coordinate readout on hover */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.05] rounded-lg p-2 text-[8px] font-mono space-y-1"
          >
            <div className="text-white/20 uppercase tracking-widest text-[7px] font-bold mb-1">Camera</div>
            <div className="flex items-center gap-2">
              <span className="text-red-400/60 w-3">X</span>
              <span className="text-white/40 tabular-nums">{(state.worldPos?.x || 0).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400/60 w-3">Y</span>
              <span className="text-white/40 tabular-nums">{(state.worldPos?.y || 0).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-400/60 w-3">Z</span>
              <span className="text-white/40 tabular-nums">{(state.worldPos?.z || 0).toFixed(1)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}