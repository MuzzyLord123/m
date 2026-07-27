import { useEffect, useRef } from 'react';
import { useCAD } from './CADContext';

/**
 * Full-screen crosshair cursor overlay — AutoCAD-grade.
 * Renders axis-colored lines (X=Red, Z=Blue) through cursor position
 * with a gap around the cursor for the snap indicator.
 */
export function CADCrosshair() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);
  const { state } = useCAD();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth * window.devicePixelRatio;
      canvas.height = canvas.clientHeight * window.devicePixelRatio;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: (e.clientX - rect.left) * window.devicePixelRatio,
        y: (e.clientY - rect.top) * window.devicePixelRatio,
      };
    };
    window.addEventListener('mousemove', onMove);

    const draw = () => {
      frameRef.current = requestAnimationFrame(draw);
      const { x, y } = mouseRef.current;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (state.activeTool === 'select' || state.activeTool === 'pan') return;

      const gap = 14 * window.devicePixelRatio;
      const dpr = window.devicePixelRatio;

      // Horizontal line (X axis — red tint)
      ctx.strokeStyle = 'rgba(255, 80, 80, 0.25)';
      ctx.lineWidth = dpr;
      ctx.setLineDash([6 * dpr, 3 * dpr]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(x - gap, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + gap, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      // Vertical line (Z axis — blue tint)
      ctx.strokeStyle = 'rgba(80, 130, 255, 0.25)';
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, y - gap);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y + gap);
      ctx.lineTo(x, h);
      ctx.stroke();

      // Center gap glow
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = dpr;
      ctx.beginPath();
      ctx.arc(x, y, gap * 0.6, 0, Math.PI * 2);
      ctx.stroke();

      // Axis constraint indicator
      if (state.axisConstraint === 'x') {
        ctx.strokeStyle = 'rgba(255, 50, 50, 0.6)';
        ctx.lineWidth = 2 * dpr;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      } else if (state.axisConstraint === 'z') {
        ctx.strokeStyle = 'rgba(50, 100, 255, 0.6)';
        ctx.lineWidth = 2 * dpr;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      } else if (state.axisConstraint === 'y') {
        // Y axis is vertical in world but shows as a diagonal indicator
        ctx.strokeStyle = 'rgba(50, 255, 100, 0.4)';
        ctx.lineWidth = 2 * dpr;
        ctx.setLineDash([8 * dpr, 4 * dpr]);
        ctx.beginPath();
        ctx.moveTo(x - 60 * dpr, y + 60 * dpr);
        ctx.lineTo(x + 60 * dpr, y - 60 * dpr);
        ctx.stroke();
      }
    };
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [state.activeTool, state.axisConstraint]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
}