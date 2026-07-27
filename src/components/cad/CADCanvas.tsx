import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useCAD } from './CADContext';
import { AnyCADEntity, Point2D } from './cadTypes';
import { snapToGrid, constrainOrtho, snapToAngle, generateId, distance, formatCoord } from './cadGeometry';

export function CADCanvas() {
  const { state, dispatch, addEntity } = useCAD();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<Point2D>({ x: 0, y: 0 });
  const [worldPos, setWorldPos] = useState<Point2D>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const animRef = useRef<number>(0);

  const screenToWorld = useCallback((sx: number, sy: number): Point2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    return {
      x: (sx - cx - state.panOffset.x) / state.zoom,
      y: -(sy - cy - state.panOffset.y) / state.zoom,
    };
  }, [state.zoom, state.panOffset]);

  const worldToScreen = useCallback((wx: number, wy: number): Point2D => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    return {
      x: wx * state.zoom + cx + state.panOffset.x,
      y: -wy * state.zoom + cy + state.panOffset.y,
    };
  }, [state.zoom, state.panOffset]);

  // Resize canvas
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (!canvas || !wrapper) return;
      canvas.width = wrapper.clientWidth;
      canvas.height = wrapper.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Main render loop
  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;

      // Background
      ctx.fillStyle = state.background;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(w / 2 + state.panOffset.x, h / 2 + state.panOffset.y);
      ctx.scale(state.zoom, state.zoom);

      // Grid
      if (state.gridVisible) {
        drawGrid(ctx, w, h);
      }

      // Origin axes
      drawAxes(ctx, w, h);

      // Entities
      state.entities.forEach(entity => {
        const layer = state.layers.find(l => l.id === entity.layerId);
        if (layer && !layer.visible) return;
        if (layer && layer.frozen) return;
        drawEntity(ctx, entity, layer);
      });

      // Drawing in progress
      if (state.drawingInProgress.length > 0) {
        drawInProgress(ctx);
      }

      // Snap cursor
      if (state.snapEnabled) {
        drawSnapCursor(ctx);
      }

      ctx.restore();

      // Crosshair cursor
      drawCrosshair(ctx, w, h);

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [state, worldPos]);

  const drawGrid = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const gs = state.gridSize;
    const extent = Math.max(w, h) / state.zoom + 200;
    const minorAlpha = state.zoom > 0.5 ? 0.15 : 0.05;
    const majorAlpha = 0.25;

    // Minor grid
    ctx.strokeStyle = `rgba(255,255,255,${minorAlpha})`;
    ctx.lineWidth = 0.5 / state.zoom;
    ctx.beginPath();
    for (let x = -extent; x <= extent; x += gs) {
      ctx.moveTo(x, -extent);
      ctx.lineTo(x, extent);
    }
    for (let y = -extent; y <= extent; y += gs) {
      ctx.moveTo(-extent, y);
      ctx.lineTo(extent, y);
    }
    ctx.stroke();

    // Major grid (every 5)
    ctx.strokeStyle = `rgba(255,255,255,${majorAlpha})`;
    ctx.lineWidth = 1 / state.zoom;
    ctx.beginPath();
    const majorGs = gs * 5;
    for (let x = -extent; x <= extent; x += majorGs) {
      ctx.moveTo(x, -extent);
      ctx.lineTo(x, extent);
    }
    for (let y = -extent; y <= extent; y += majorGs) {
      ctx.moveTo(-extent, y);
      ctx.lineTo(extent, y);
    }
    ctx.stroke();
  };

  const drawAxes = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    const extent = Math.max(w, h) / state.zoom + 500;
    // X axis (red)
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 1.5 / state.zoom;
    ctx.beginPath();
    ctx.moveTo(-extent, 0);
    ctx.lineTo(extent, 0);
    ctx.stroke();
    // Y axis (green)
    ctx.strokeStyle = '#44ff44';
    ctx.beginPath();
    ctx.moveTo(0, -extent);
    ctx.lineTo(0, extent);
    ctx.stroke();
    // Origin
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 3 / state.zoom, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawEntity = (ctx: CanvasRenderingContext2D, entity: AnyCADEntity, layer?: any) => {
    const color = entity.color || layer?.color || '#ffffff';
    const lw = (entity.lineWeight || layer?.lineWeight || 1) / state.zoom;
    const isSelected = state.selectedIds.includes(entity.id);

    ctx.strokeStyle = isSelected ? '#00aaff' : color;
    ctx.fillStyle = isSelected ? 'rgba(0,170,255,0.1)' : 'transparent';
    ctx.lineWidth = isSelected ? lw * 1.5 : lw;

    // Apply linetype
    const lt = entity.lineType || layer?.lineType || 'solid';
    if (lt === 'dashed') ctx.setLineDash([8 / state.zoom, 4 / state.zoom]);
    else if (lt === 'dotted') ctx.setLineDash([2 / state.zoom, 3 / state.zoom]);
    else if (lt === 'centerline') ctx.setLineDash([12 / state.zoom, 3 / state.zoom, 3 / state.zoom, 3 / state.zoom]);
    else ctx.setLineDash([]);

    switch (entity.type) {
      case 'line': {
        const { start, end } = entity.data;
        ctx.beginPath();
        ctx.moveTo(start.x, -start.y);
        ctx.lineTo(end.x, -end.y);
        ctx.stroke();
        if (isSelected) {
          drawHandle(ctx, start.x, -start.y);
          drawHandle(ctx, end.x, -end.y);
        }
        break;
      }
      case 'circle': {
        const { center, radius } = entity.data;
        ctx.beginPath();
        ctx.arc(center.x, -center.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (isSelected) drawHandle(ctx, center.x, -center.y);
        break;
      }
      case 'rectangle': {
        const { origin, width, height } = entity.data;
        ctx.beginPath();
        ctx.rect(origin.x, -origin.y - height, width, height);
        ctx.stroke();
        if (isSelected) {
          drawHandle(ctx, origin.x, -origin.y);
          drawHandle(ctx, origin.x + width, -origin.y - height);
        }
        break;
      }
      case 'arc': {
        const { center, radius, startAngle, endAngle } = entity.data;
        ctx.beginPath();
        ctx.arc(center.x, -center.y, radius, -endAngle * Math.PI / 180, -startAngle * Math.PI / 180);
        ctx.stroke();
        break;
      }
      case 'polyline': {
        const { points, closed, filled } = entity.data;
        if (points.length < 2) break;
        ctx.beginPath();
        ctx.moveTo(points[0].x, -points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, -points[i].y);
        }
        if (closed) ctx.closePath();
        if (closed && filled) {
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = color;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.stroke();
        if (isSelected) points.forEach((p: Point2D) => drawHandle(ctx, p.x, -p.y));
        break;
      }
      case 'polygon': {
        const { center, radius, sides, rotation = 0 } = entity.data;
        ctx.beginPath();
        for (let i = 0; i <= sides; i++) {
          const a = (i * 2 * Math.PI) / sides + (rotation * Math.PI / 180);
          const px = center.x + radius * Math.cos(a);
          const py = -center.y + radius * Math.sin(a);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'ellipse': {
        const { center, radiusX, radiusY, rotation = 0 } = entity.data;
        ctx.beginPath();
        ctx.ellipse(center.x, -center.y, radiusX, radiusY, rotation * Math.PI / 180, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }
      case 'text': {
        const { position, content, fontSize, fontFamily } = entity.data;
        ctx.font = `${fontSize}px ${fontFamily || 'monospace'}`;
        ctx.fillStyle = isSelected ? '#00aaff' : color;
        ctx.fillText(content, position.x, -position.y);
        break;
      }
      case 'dimension': {
        const { start, end, offset, dimType } = entity.data;
        const dist = distance(start, end);
        const mx = (start.x + end.x) / 2;
        const my = -(start.y + end.y) / 2 - offset;
        // Extension lines
        ctx.strokeStyle = isSelected ? '#00aaff' : '#00ff00';
        ctx.lineWidth = 0.5 / state.zoom;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(start.x, -start.y);
        ctx.lineTo(start.x, my);
        ctx.moveTo(end.x, -end.y);
        ctx.lineTo(end.x, my);
        // Dimension line
        ctx.moveTo(start.x, my);
        ctx.lineTo(end.x, my);
        ctx.stroke();
        // Text
        ctx.font = `${12 / state.zoom}px monospace`;
        ctx.fillStyle = '#00ff00';
        ctx.textAlign = 'center';
        ctx.fillText(formatCoord(dist, state.precision), mx, my - 4 / state.zoom);
        ctx.textAlign = 'start';
        break;
      }
    }

    ctx.setLineDash([]);
  };

  const drawHandle = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const s = 4 / state.zoom;
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(x - s, y - s, s * 2, s * 2);
  };

  const drawInProgress = (ctx: CanvasRenderingContext2D) => {
    const pts = state.drawingInProgress;
    ctx.strokeStyle = '#00ccff';
    ctx.lineWidth = 1 / state.zoom;
    ctx.setLineDash([4 / state.zoom, 4 / state.zoom]);

    if (state.activeTool === 'line' && pts.length === 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, -pts[0].y);
      ctx.lineTo(worldPos.x, -worldPos.y);
      ctx.stroke();
    } else if (state.activeTool === 'rectangle' && pts.length === 1) {
      const w = worldPos.x - pts[0].x;
      const h = worldPos.y - pts[0].y;
      ctx.beginPath();
      ctx.rect(pts[0].x, -pts[0].y - h, w, h);
      ctx.stroke();
    } else if (state.activeTool === 'circle' && pts.length === 1) {
      const r = distance(pts[0], worldPos);
      ctx.beginPath();
      ctx.arc(pts[0].x, -pts[0].y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (state.activeTool === 'polyline' && pts.length > 0) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, -pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, -pts[i].y);
      }
      ctx.lineTo(worldPos.x, -worldPos.y);
      ctx.stroke();
    } else if (state.activeTool === 'ellipse' && pts.length === 1) {
      const rx = Math.abs(worldPos.x - pts[0].x);
      const ry = Math.abs(worldPos.y - pts[0].y);
      ctx.beginPath();
      ctx.ellipse(pts[0].x, -pts[0].y, rx, ry, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (state.activeTool === 'arc' && pts.length >= 1) {
      if (pts.length === 1) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, -pts[0].y);
        ctx.lineTo(worldPos.x, -worldPos.y);
        ctx.stroke();
      }
    } else if (state.activeTool === 'polygon' && pts.length === 1) {
      const r = distance(pts[0], worldPos);
      const sides = 6;
      ctx.beginPath();
      for (let i = 0; i <= sides; i++) {
        const a = (i * 2 * Math.PI) / sides;
        const px = pts[0].x + r * Math.cos(a);
        const py = -pts[0].y + r * Math.sin(a);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    } else if (state.activeTool === 'dimension' && pts.length === 1) {
      ctx.beginPath();
      ctx.moveTo(pts[0].x, -pts[0].y);
      ctx.lineTo(worldPos.x, -worldPos.y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  };

  const drawSnapCursor = (ctx: CanvasRenderingContext2D) => {
    const s = 6 / state.zoom;
    ctx.strokeStyle = '#ffaa00';
    ctx.lineWidth = 1 / state.zoom;
    ctx.beginPath();
    ctx.moveTo(worldPos.x - s, -worldPos.y);
    ctx.lineTo(worldPos.x + s, -worldPos.y);
    ctx.moveTo(worldPos.x, -worldPos.y - s);
    ctx.lineTo(worldPos.x, -worldPos.y + s);
    ctx.stroke();
  };

  const drawCrosshair = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(mousePos.x, 0);
    ctx.lineTo(mousePos.x, h);
    ctx.moveTo(0, mousePos.y);
    ctx.lineTo(w, mousePos.y);
    ctx.stroke();
  };

  const getSnappedWorldPos = (rawWorld: Point2D): Point2D => {
    let p = rawWorld;
    if (state.snapEnabled && state.gridVisible) {
      p = snapToGrid(p, state.gridSize);
    }
    if (state.orthoMode && state.drawingInProgress.length > 0) {
      p = constrainOrtho(state.drawingInProgress[state.drawingInProgress.length - 1], p);
    }
    if (state.polarTracking && state.drawingInProgress.length > 0) {
      p = snapToAngle(state.drawingInProgress[state.drawingInProgress.length - 1], p, state.polarAngle);
    }
    return p;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    setMousePos({ x: sx, y: sy });

    const raw = screenToWorld(sx, sy);
    setWorldPos(getSnappedWorldPos(raw));

    if (isPanning) {
      dispatch({
        type: 'SET_PAN',
        payload: {
          x: panStartRef.current.panX + (e.clientX - panStartRef.current.x),
          y: panStartRef.current.panY + (e.clientY - panStartRef.current.y),
        },
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && state.activeTool === 'pan')) {
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX: state.panOffset.x, panY: state.panOffset.y };
      return;
    }
    if (e.button !== 0) return;

    const tool = state.activeTool;

    if (tool === 'select') {
      handleSelect();
      return;
    }

    // Drawing tools
    if (['line', 'rectangle', 'circle', 'polyline', 'polygon', 'ellipse', 'arc', 'dimension'].includes(tool)) {
      handleDrawClick();
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (e.button === 1 || isPanning) {
      setIsPanning(false);
    }
  };

  const handleSelect = () => {
    const tolerance = 8 / state.zoom;
    const found: string[] = [];
    for (const entity of state.entities) {
      const layer = state.layers.find(l => l.id === entity.layerId);
      if (layer && (!layer.visible || layer.locked || layer.frozen)) continue;
      if (hitTest(entity, worldPos, tolerance)) {
        found.push(entity.id);
        break;
      }
    }
    dispatch({ type: 'SELECT', payload: found });
  };

  const hitTest = (entity: AnyCADEntity, p: Point2D, tol: number): boolean => {
    switch (entity.type) {
      case 'line': {
        const { start, end } = entity.data;
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) return distance(p, start) <= tol;
        let t = ((p.x - start.x) * dx + (p.y - start.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const closest = { x: start.x + t * dx, y: start.y + t * dy };
        return distance(p, closest) <= tol;
      }
      case 'circle':
        return Math.abs(distance(p, entity.data.center) - entity.data.radius) <= tol;
      case 'rectangle': {
        const { origin, width, height } = entity.data;
        const edges: [Point2D, Point2D][] = [
          [origin, { x: origin.x + width, y: origin.y }],
          [{ x: origin.x + width, y: origin.y }, { x: origin.x + width, y: origin.y + height }],
          [{ x: origin.x + width, y: origin.y + height }, { x: origin.x, y: origin.y + height }],
          [{ x: origin.x, y: origin.y + height }, origin],
        ];
        return edges.some(([a, b]) => {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const lenSq = dx * dx + dy * dy;
          if (lenSq === 0) return distance(p, a) <= tol;
          let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
          t = Math.max(0, Math.min(1, t));
          return distance(p, { x: a.x + t * dx, y: a.y + t * dy }) <= tol;
        });
      }
      case 'text': {
        const { position, fontSize } = entity.data;
        return distance(p, position) <= fontSize * 2;
      }
      default:
        return distance(p, worldPos) <= tol * 3;
    }
  };

  const handleDrawClick = () => {
    const tool = state.activeTool;
    const pts = state.drawingInProgress;

    if (tool === 'line') {
      if (pts.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT', payload: worldPos });
      } else {
        addEntity({
          id: generateId(), type: 'line', layerId: state.activeLayerId,
          data: { start: pts[0], end: worldPos },
        });
      }
    } else if (tool === 'rectangle') {
      if (pts.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT', payload: worldPos });
      } else {
        const w = worldPos.x - pts[0].x;
        const h = worldPos.y - pts[0].y;
        addEntity({
          id: generateId(), type: 'rectangle', layerId: state.activeLayerId,
          data: { origin: { x: Math.min(pts[0].x, worldPos.x), y: Math.min(pts[0].y, worldPos.y) }, width: Math.abs(w), height: Math.abs(h) },
        });
      }
    } else if (tool === 'circle') {
      if (pts.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT', payload: worldPos });
      } else {
        addEntity({
          id: generateId(), type: 'circle', layerId: state.activeLayerId,
          data: { center: pts[0], radius: distance(pts[0], worldPos) },
        });
      }
    } else if (tool === 'ellipse') {
      if (pts.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT', payload: worldPos });
      } else {
        addEntity({
          id: generateId(), type: 'ellipse', layerId: state.activeLayerId,
          data: { center: pts[0], radiusX: Math.abs(worldPos.x - pts[0].x), radiusY: Math.abs(worldPos.y - pts[0].y) },
        });
      }
    } else if (tool === 'polygon') {
      if (pts.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT', payload: worldPos });
      } else {
        addEntity({
          id: generateId(), type: 'polygon', layerId: state.activeLayerId,
          data: { center: pts[0], radius: distance(pts[0], worldPos), sides: 6, inscribed: true },
        });
      }
    } else if (tool === 'polyline') {
      dispatch({ type: 'ADD_DRAWING_POINT', payload: worldPos });
    } else if (tool === 'arc') {
      if (pts.length < 2) {
        dispatch({ type: 'ADD_DRAWING_POINT', payload: worldPos });
      } else {
        // 3-point arc simplified
        const center = { x: (pts[0].x + pts[1].x + worldPos.x) / 3, y: (pts[0].y + pts[1].y + worldPos.y) / 3 };
        const radius = distance(center, pts[0]);
        addEntity({
          id: generateId(), type: 'arc', layerId: state.activeLayerId,
          data: { center, radius, startAngle: 0, endAngle: 180 },
        });
      }
    } else if (tool === 'dimension') {
      if (pts.length === 0) {
        dispatch({ type: 'ADD_DRAWING_POINT', payload: worldPos });
      } else {
        addEntity({
          id: generateId(), type: 'dimension', layerId: state.activeLayerId,
          data: { start: pts[0], end: worldPos, offset: 20, dimType: 'linear' },
        });
      }
    }
  };

  const handleDoubleClick = () => {
    if (state.activeTool === 'polyline' && state.drawingInProgress.length >= 2) {
      addEntity({
        id: generateId(), type: 'polyline', layerId: state.activeLayerId,
        data: { points: [...state.drawingInProgress], closed: false },
      });
    }
  };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.1, Math.min(50, state.zoom * (1 + delta)));
    dispatch({ type: 'SET_ZOOM', payload: newZoom });
  }, [state.zoom, dispatch]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_TOOL', payload: 'select' });
        dispatch({ type: 'DESELECT_ALL' });
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        dispatch({ type: 'DELETE_SELECTED' });
      }
      if (e.ctrlKey && e.key === 'z') { e.preventDefault(); dispatch({ type: 'UNDO' }); }
      if (e.ctrlKey && e.key === 'y') { e.preventDefault(); dispatch({ type: 'REDO' }); }
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); dispatch({ type: 'SELECT_ALL' }); }
      if (e.key === 'F8') { e.preventDefault(); dispatch({ type: 'TOGGLE_ORTHO' }); }
      if (e.key === 'F3') { e.preventDefault(); dispatch({ type: 'TOGGLE_SNAP' }); }
      if (e.key === 'F7') { e.preventDefault(); dispatch({ type: 'TOGGLE_GRID' }); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch]);

  return (
    <div ref={wrapperRef} className="flex-1 relative overflow-hidden" style={{ cursor: isPanning ? 'grabbing' : state.activeTool === 'pan' ? 'grab' : 'crosshair' }}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="block w-full h-full"
      />

      {/* Dynamic input near cursor */}
      {state.drawingInProgress.length > 0 && (
        <div
          className="absolute pointer-events-none text-[10px] font-mono text-cyan-400 bg-black/80 px-1.5 py-0.5 rounded border border-cyan-500/30"
          style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
        >
          {formatCoord(distance(state.drawingInProgress[state.drawingInProgress.length - 1], worldPos), state.precision)}
          {' @ '}
          {formatCoord(
            Math.atan2(worldPos.y - state.drawingInProgress[state.drawingInProgress.length - 1].y, worldPos.x - state.drawingInProgress[state.drawingInProgress.length - 1].x) * 180 / Math.PI,
            1
          )}°
        </div>
      )}

      {/* Coordinate display */}
      <div className="absolute bottom-2 right-2 bg-black/80 text-[10px] font-mono text-muted-foreground px-2 py-1 rounded border border-border/30 flex gap-3">
        <span className="text-red-400">X: {formatCoord(worldPos.x, state.precision)}</span>
        <span className="text-green-400">Y: {formatCoord(worldPos.y, state.precision)}</span>
        <span className="text-muted-foreground">Zoom: {Math.round(state.zoom * 100)}%</span>
      </div>
    </div>
  );
}
