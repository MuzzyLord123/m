import { useRef, useEffect, useState } from 'react';
import { useCAD } from './CADContext';
import { cn } from '@/lib/utils';
import { Map, Minimize2, Maximize2 } from 'lucide-react';

/**
 * Minimap navigator showing a bird's-eye overview of all entities
 * with viewport frustum indicator. Click to pan the main view.
 */
export function CADMinimap() {
  const { state } = useCAD();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [minimized, setMinimized] = useState(false);
  const [hovered, setHovered] = useState(false);
  const boundsRef = useRef<{ minX: number; maxX: number; minZ: number; maxZ: number; scale: number; cx: number; cy: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || minimized) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio;
    const W = 180, H = 130;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    // Clear with gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#0c0c0c');
    bg.addColorStop(1, '#080808');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (state.entities.length === 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Empty scene', W / 2, H / 2);
      boundsRef.current = null;
      return;
    }

    // Calculate bounds
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    state.entities.forEach(e => {
      const pts = getEntityPoints(e);
      pts.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.z < minZ) minZ = p.z;
        if (p.z > maxZ) maxZ = p.z;
      });
    });

    const pad = 25;
    const rangeX = (maxX - minX) || 100;
    const rangeZ = (maxZ - minZ) || 100;
    const scale = Math.min((W - pad * 2) / rangeX, (H - pad * 2) / rangeZ);
    const cx = W / 2, cy = H / 2;
    boundsRef.current = { minX, maxX, minZ, maxZ, scale, cx, cy };

    const toScreen = (wx: number, wz: number) => ({
      x: cx + (wx - (minX + maxX) / 2) * scale,
      y: cy + (wz - (minZ + maxZ) / 2) * scale,
    });

    // Draw grid background
    ctx.strokeStyle = 'rgba(255,255,255,0.025)';
    ctx.lineWidth = 0.5;
    const gridStep = Math.max(10, Math.ceil(rangeX / 8));
    for (let gx = Math.floor(minX / gridStep) * gridStep; gx <= maxX; gx += gridStep) {
      const s = toScreen(gx, minZ);
      const e = toScreen(gx, maxZ);
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke();
    }
    for (let gz = Math.floor(minZ / gridStep) * gridStep; gz <= maxZ; gz += gridStep) {
      const s = toScreen(minX, gz);
      const e = toScreen(maxX, gz);
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke();
    }

    // Draw entities with glow effect for selected
    state.entities.forEach(e => {
      const isSelected = state.selectedIds.includes(e.id);
      const layer = state.layers.find(l => l.id === e.layerId);
      ctx.strokeStyle = isSelected ? '#00aaff' : (layer?.color || '#ffffff') + '60';
      ctx.fillStyle = isSelected ? 'rgba(0,170,255,0.2)' : 'rgba(255,255,255,0.04)';
      ctx.lineWidth = isSelected ? 2 : 0.8;

      if (isSelected) {
        ctx.shadowColor = '#00aaff';
        ctx.shadowBlur = 6;
      } else {
        ctx.shadowBlur = 0;
      }

      const pts = getEntityPoints(e);
      if (pts.length === 0) return;

      if (e.type === 'circle') {
        const c = toScreen(e.data.center.x, e.data.center.y);
        const r = e.data.radius * scale;
        ctx.beginPath(); ctx.arc(c.x, c.y, Math.max(r, 1.5), 0, Math.PI * 2); ctx.stroke();
      } else if (['rectangle', 'box3d', 'wall', 'slab'].includes(e.type)) {
        if (pts.length >= 2) {
          const s1 = toScreen(pts[0].x, pts[0].z);
          const s2 = toScreen(pts[1].x, pts[1].z);
          ctx.fillRect(s1.x, s1.y, s2.x - s1.x, s2.y - s1.y);
          ctx.strokeRect(s1.x, s1.y, s2.x - s1.x, s2.y - s1.y);
        }
      } else if (['sphere', 'column', 'cylinder', 'cone', 'torus', 'pyramid'].includes(e.type)) {
        const p = toScreen(pts[0].x, pts[0].z);
        const r = Math.max(3, ((e.data as any).radius || (e.data as any).baseSize / 2 || 5) * scale);
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke();
      } else {
        ctx.beginPath();
        pts.forEach((p, i) => {
          const s = toScreen(p.x, p.z);
          if (i === 0) ctx.moveTo(s.x, s.y);
          else ctx.lineTo(s.x, s.y);
        });
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    });

    // Origin marker
    const origin = toScreen(0, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(origin.x - 4, origin.y); ctx.lineTo(origin.x + 4, origin.y); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(origin.x, origin.y - 4); ctx.lineTo(origin.x, origin.y + 4); ctx.stroke();

    // Viewport frustum indicator (approximate)
    ctx.strokeStyle = 'rgba(59,130,246,0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    const wp = state.worldPos;
    if (wp) {
      const viewCenter = toScreen(wp.x, wp.z);
      const viewSize = 30 / Math.max(state.zoom, 0.1);
      ctx.strokeRect(viewCenter.x - viewSize / 2, viewCenter.y - viewSize / 2, viewSize, viewSize);
    }
    ctx.setLineDash([]);

    // Entity count + coordinate
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${state.entities.length} obj`, W - 5, H - 5);
  }, [state.entities, state.selectedIds, state.layers, minimized, state.worldPos, state.zoom]);

  // Click-to-navigate
  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    const bounds = boundsRef.current;
    if (!canvas || !bounds) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Convert screen to world
    const wx = (x - bounds.cx) / bounds.scale + (bounds.minX + bounds.maxX) / 2;
    const wz = (y - bounds.cy) / bounds.scale + (bounds.minZ + bounds.maxZ) / 2;
    // Pan the view to this position
    const fn = (window as any).__cadPanTo;
    if (fn) fn(wx, wz);
  };

  const aiPanelOpen = (window as any).__cadAIPanelOpen;

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed z-[998] w-7 h-7 rounded-lg bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center text-white/25 hover:text-white/60 transition-all"
        style={{
          bottom: '136px',
          right: state.propertiesPanelOpen ? '316px' : aiPanelOpen ? '416px' : '16px',
        }}
      >
        <Map className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-[998] rounded-xl overflow-hidden transition-all duration-300",
        "bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/[0.06]",
        hovered && "border-white/[0.12] shadow-xl shadow-black/60"
      )}
      style={{
        width: 180,
        height: 130,
        bottom: '136px',
        right: state.propertiesPanelOpen ? '316px' : aiPanelOpen ? '416px' : '16px',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-5 flex items-center justify-between px-2 z-10 bg-gradient-to-b from-black/50 to-transparent">
        <span className="text-[7px] font-mono text-white/20 uppercase tracking-wider">Navigator</span>
        <button onClick={() => setMinimized(true)} className="text-white/20 hover:text-white/50 transition-all">
          <Minimize2 className="h-2.5 w-2.5" />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        style={{ width: 180, height: 130, cursor: 'crosshair' }}
        onClick={handleClick}
      />
    </div>
  );
}

function getEntityPoints(e: any): { x: number; y: number; z: number }[] {
  const d = e.data;
  switch (e.type) {
    case 'line': return [{ x: d.start.x, y: 0, z: d.start.y }, { x: d.end.x, y: 0, z: d.end.y }];
    case 'line3d': return [d.start, d.end];
    case 'circle': return [{ x: d.center.x, y: 0, z: d.center.y }];
    case 'rectangle': return [
      { x: d.origin.x, y: 0, z: d.origin.y },
      { x: d.origin.x + d.width, y: 0, z: d.origin.y + d.height },
    ];
    case 'wall': return [d.base, { x: d.base.x + d.width, y: d.base.y, z: d.base.z + d.depth }];
    case 'box3d': return [d.origin, { x: d.origin.x + d.width, y: d.origin.y, z: d.origin.z + d.depth }];
    case 'slab': return [d.origin, { x: d.origin.x + d.width, y: d.origin.y, z: d.origin.z + d.depth }];
    case 'sphere': return [d.center];
    case 'cone': case 'cylinder': case 'column': case 'pyramid': case 'stairs': return [d.base];
    case 'torus': return [d.center];
    case 'polyline': return d.points.map((p: any) => ({ x: p.x, y: 0, z: p.y }));
    case 'polygon': return [{ x: d.center.x, y: 0, z: d.center.y }];
    case 'ellipse': return [{ x: d.center.x, y: 0, z: d.center.y }];
    case 'window': case 'door': return [d.base];
    default: return [];
  }
}