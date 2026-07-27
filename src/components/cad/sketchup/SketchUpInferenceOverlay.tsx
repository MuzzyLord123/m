import { useEffect, useRef } from 'react';
import { useCAD } from '../CADContext';
import { computeInferences, InferenceGuide } from './SketchUpEngine';

/**
 * Renders SketchUp-style inference guides (red/green/blue axis alignment)
 * as a canvas overlay — Enhanced with Shift-lock, edge inference, stronger visuals
 */
export function SketchUpInferenceOverlay() {
  const { state } = useCAD();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener('resize', resize);

    const wp = state.worldPos;
    ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    if (!wp) return;

    const refPt = state.drawingInProgress3D.length > 0
      ? state.drawingInProgress3D[state.drawingInProgress3D.length - 1]
      : state.transformOp?.basePoint || null;

    if (!refPt) return;

    // Check for Shift-lock
    const lockedAxis = (window as any).__cadLockedAxis as 'x' | 'y' | 'z' | null;
    const guides = computeInferences(wp, refPt, state.entities, lockedAxis);
    if (guides.length === 0) return;

    const screenPos = (window as any).__cadCursorScreen;
    if (!screenPos) return;

    guides.forEach(guide => {
      ctx.save();
      ctx.strokeStyle = guide.color;
      ctx.globalAlpha = guide.type === 'locked' ? 0.9 : guide.type === 'fromPoint' ? 0.9 : 0.6;

      if (guide.type === 'locked') {
        // Solid bright line for locked axis
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
      } else if (guide.type === 'axis') {
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
      } else if (guide.type === 'fromPoint') {
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
      } else {
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
      }

      const len = guide.type === 'fromPoint' ? 50 : guide.type === 'locked' ? 500 : 300;
      let dx = 0, dy = 0;
      if (guide.axis === 'x') { dx = 1; dy = 0; }
      else if (guide.axis === 'y') { dx = 0; dy = -1; }
      else if (guide.axis === 'z') { dx = 0; dy = 0; }

      if (guide.type === 'axis' || guide.type === 'locked') {
        ctx.beginPath();
        ctx.moveTo(screenPos.x - dx * len, screenPos.y - dy * len);
        ctx.lineTo(screenPos.x + dx * len, screenPos.y + dy * len);
        ctx.stroke();
      } else if (guide.type === 'parallel' || guide.type === 'perpendicular') {
        ctx.beginPath();
        ctx.moveTo(screenPos.x - 100, screenPos.y);
        ctx.lineTo(screenPos.x + 100, screenPos.y);
        ctx.stroke();
      } else if (guide.type === 'fromPoint') {
        const size = 5;
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenPos.x, screenPos.y - size);
        ctx.lineTo(screenPos.x + size, screenPos.y);
        ctx.lineTo(screenPos.x, screenPos.y + size);
        ctx.lineTo(screenPos.x - size, screenPos.y);
        ctx.closePath();
        ctx.stroke();
      }

      // Label tooltip
      if (guide.label) {
        ctx.setLineDash([]);
        ctx.font = '10px -apple-system, sans-serif';
        ctx.globalAlpha = 0.9;
        
        const metrics = ctx.measureText(guide.label);
        const lx = screenPos.x + 18;
        const ly = screenPos.y - 12;
        
        // Background
        ctx.fillStyle = '#0a0a0add';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(lx - 4, ly - 12, metrics.width + 8, 16);
        
        // Border for locked
        if (guide.type === 'locked') {
          ctx.strokeStyle = guide.color;
          ctx.lineWidth = 1;
          ctx.strokeRect(lx - 4, ly - 12, metrics.width + 8, 16);
        }
        
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = guide.color;
        ctx.fillText(guide.label, lx, ly);
      }

      ctx.restore();
    });

    return () => window.removeEventListener('resize', resize);
  }, [state.worldPos, state.drawingInProgress3D, state.transformOp, state.entities]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[995] pointer-events-none"
    />
  );
}
