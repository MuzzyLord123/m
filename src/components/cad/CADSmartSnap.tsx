import { useEffect, useRef } from 'react';
import { useCAD } from './CADContext';
import { findSnap, getSnapColor, getSnapIcon, SnapResult } from './CADSnapEngine';

/**
 * Smart Snap Overlay — canvas overlay that renders snap markers
 * when cursor is near entity snap points (endpoint, midpoint, center, etc.)
 */
export function CADSmartSnap() {
  const { state } = useCAD();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapRef = useRef<SnapResult | null>(null);

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

    // Detect snap on world position changes
    const wp = state.worldPos;
    if (!wp || !state.snapEnabled) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      snapRef.current = null;
      return;
    }

    // Scale tolerance based on zoom
    const zoomTolerance = Math.max(2, 8 / Math.max(state.zoom, 0.1));
    const snap = findSnap(wp, state.entities, state.snapModes, zoomTolerance);
    snapRef.current = snap;

    ctx.clearRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);

    if (!snap) return;

    // We need screen coordinates — use the cursor screen position from window global
    const screenPos = (window as any).__cadCursorScreen;
    if (!screenPos) return;

    const x = screenPos.x;
    const y = screenPos.y;
    const color = getSnapColor(snap.type);
    const icon = getSnapIcon(snap.type);

    // Draw snap marker
    ctx.save();

    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;

    // Draw the snap symbol
    const size = 8;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    switch (snap.type) {
      case 'endpoint': {
        // Square
        ctx.strokeRect(x - size, y - size, size * 2, size * 2);
        break;
      }
      case 'midpoint': {
        // Triangle
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x - size, y + size);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'center': {
        // Circle with cross
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x - size * 0.7, y);
        ctx.lineTo(x + size * 0.7, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.7);
        ctx.lineTo(x, y + size * 0.7);
        ctx.stroke();
        break;
      }
      case 'nearest': {
        // Diamond
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.stroke();
        break;
      }
      case 'intersection': {
        // X mark
        ctx.beginPath();
        ctx.moveTo(x - size, y - size);
        ctx.lineTo(x + size, y + size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + size, y - size);
        ctx.lineTo(x - size, y + size);
        ctx.stroke();
        break;
      }
      case 'perpendicular': {
        // Right angle symbol
        ctx.beginPath();
        ctx.moveTo(x - size, y + size);
        ctx.lineTo(x - size, y - size);
        ctx.lineTo(x + size, y - size);
        ctx.stroke();
        break;
      }
      default: {
        // Dot
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    }

    // Label
    ctx.shadowBlur = 0;
    ctx.font = '9px monospace';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(snap.type.toUpperCase(), x + size + 6, y + 4);

    // Distance readout
    if (snap.distance > 0.01) {
      ctx.fillStyle = color + '80';
      ctx.font = '8px monospace';
      ctx.fillText(`d: ${snap.distance.toFixed(2)}`, x + size + 6, y + 14);
    }

    ctx.restore();

    return () => window.removeEventListener('resize', resize);
  }, [state.worldPos, state.entities, state.snapEnabled, state.snapModes, state.zoom]);

  if (!state.snapEnabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[996] pointer-events-none"
      style={{ top: 0, left: 0 }}
    />
  );
}
