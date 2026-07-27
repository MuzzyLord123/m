import { useRef, useEffect } from 'react';
import { useCAD } from './CADContext';

type SnapType = 'endpoint' | 'midpoint' | 'center' | 'intersection' | 'perpendicular' | 'nearest';

interface SnapResult {
  type: SnapType;
  x: number;
  y: number;
}

/**
 * Visual snap indicator overlay — renders AutoCAD-style markers
 * (diamond for endpoint, triangle for midpoint, circle for center, X for intersection)
 */
export function CADSnapIndicator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useCAD();
  const snapRef = useRef<SnapResult | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(0);
  const pulseRef = useRef(0);

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
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (!state.snapEnabled) return;

      const { x, y } = mouseRef.current;
      const dpr = window.devicePixelRatio;
      pulseRef.current = (pulseRef.current + 0.03) % (Math.PI * 2);
      const pulse = 0.6 + Math.sin(pulseRef.current) * 0.4;

      // Simulate snap detection based on cursor position (visual indicator)
      // In a real implementation, this would use the actual snap engine
      const snapSize = 8 * dpr;
      
      // Always show a subtle snap readiness indicator when snap is on
      if (state.activeTool !== 'select' && state.activeTool !== 'pan') {
        // Endpoint indicator (diamond)
        ctx.strokeStyle = `rgba(255, 200, 0, ${0.5 * pulse})`;
        ctx.lineWidth = 1.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(x, y - snapSize);
        ctx.lineTo(x + snapSize, y);
        ctx.lineTo(x, y + snapSize);
        ctx.lineTo(x - snapSize, y);
        ctx.closePath();
        ctx.stroke();

        // Subtle glow
        ctx.strokeStyle = `rgba(255, 200, 0, ${0.1 * pulse})`;
        ctx.lineWidth = 3 * dpr;
        ctx.beginPath();
        ctx.arc(x, y, snapSize * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
    };
  }, [state.snapEnabled, state.activeTool]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-11"
      style={{ width: '100%', height: '100%' }}
    />
  );
}