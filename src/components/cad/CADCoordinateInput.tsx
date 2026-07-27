import { useState, useRef, useEffect } from 'react';
import { useCAD } from './CADContext';
import { cn } from '@/lib/utils';
import { Target, Hash } from 'lucide-react';

/**
 * Precise coordinate input overlay — appears when drawing
 * Allows typing exact X,Y,Z values or relative coordinates (@dx,dy,dz)
 */
export function CADCoordinateInput() {
  const { state, dispatch } = useCAD();
  const [visible, setVisible] = useState(false);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'absolute' | 'relative' | 'polar'>('absolute');
  const inputRef = useRef<HTMLInputElement>(null);

  const isDrawing = state.drawingInProgress3D.length > 0 || state.drawingInProgress.length > 0;
  const isTransforming = state.transformOp?.phase === 'awaiting-target' || state.transformOp?.phase === 'awaiting-base';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      
      // @ for relative coordinates
      if (e.key === '@' && (isDrawing || isTransforming)) {
        e.preventDefault();
        setVisible(true);
        setMode('relative');
        setInput('@');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      // # for absolute coordinates
      if (e.key === '#' && (isDrawing || isTransforming)) {
        e.preventDefault();
        setVisible(true);
        setMode('absolute');
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      // < for polar coordinates
      if (e.key === '<' && (isDrawing || isTransforming)) {
        e.preventDefault();
        setVisible(true);
        setMode('polar');
        setInput('');
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDrawing, isTransforming]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = input.replace('@', '').trim();
    
    if (mode === 'polar') {
      // Format: distance<angle
      const parts = raw.split('<').map(s => parseFloat(s.trim()));
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        const dist = parts[0];
        const angle = parts[1] * Math.PI / 180;
        const lastPt = state.drawingInProgress3D.length > 0 
          ? state.drawingInProgress3D[state.drawingInProgress3D.length - 1]
          : state.transformOp?.basePoint;
        if (lastPt) {
          const x = lastPt.x + dist * Math.cos(angle);
          const z = lastPt.z + dist * Math.sin(angle);
          dispatch({ type: 'SET_WORLD_POS', payload: { x, y: lastPt.y, z } });
          dispatch({ type: 'ADD_COMMAND', payload: `Polar: D=${dist.toFixed(2)} A=${parts[1].toFixed(1)}°` });
        }
      }
    } else {
      const coords = raw.split(',').map(s => parseFloat(s.trim()));
      if (coords.length >= 2 && coords.every(c => !isNaN(c))) {
        const x = coords[0], y = coords.length > 2 ? coords[1] : 0, z = coords.length > 2 ? coords[2] : coords[1];
        
        if (mode === 'relative') {
          const lastPt = state.drawingInProgress3D.length > 0 
            ? state.drawingInProgress3D[state.drawingInProgress3D.length - 1]
            : state.transformOp?.basePoint;
          if (lastPt) {
            dispatch({ type: 'SET_WORLD_POS', payload: { x: lastPt.x + x, y: lastPt.y + y, z: lastPt.z + z } });
            dispatch({ type: 'ADD_COMMAND', payload: `Relative: @${x},${y},${z}` });
          }
        } else {
          dispatch({ type: 'SET_WORLD_POS', payload: { x, y, z } });
          dispatch({ type: 'ADD_COMMAND', payload: `Absolute: ${x},${y},${z}` });
        }
      }
    }
    
    setVisible(false);
    setInput('');
  };

  if (!visible) return null;

  return (
    <div className="fixed z-[1100] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
      <form onSubmit={handleSubmit} className="bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/[0.1] rounded-xl shadow-2xl shadow-black/70 p-4 min-w-[280px]">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-[#3B82F6]" />
          <span className="text-[11px] font-bold text-white/80 uppercase tracking-wider">Coordinate Input</span>
        </div>

        {/* Mode selector */}
        <div className="flex gap-1 mb-3">
          {(['absolute', 'relative', 'polar'] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setInput(m === 'relative' ? '@' : ''); inputRef.current?.focus(); }}
              className={cn(
                "px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider transition-all",
                mode === m 
                  ? "bg-[#3B82F6]/20 text-[#60A5FA] border border-[#3B82F6]/30" 
                  : "text-white/30 hover:text-white/60 border border-transparent"
              )}
            >
              {m === 'absolute' ? '# ABS' : m === 'relative' ? '@ REL' : '< POL'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') { setVisible(false); setInput(''); } }}
            className="flex-1 bg-[#111]/80 border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] font-mono text-[#60A5FA] outline-none focus:border-[#3B82F6]/40 placeholder:text-white/15 caret-[#3B82F6]"
            placeholder={mode === 'polar' ? 'distance<angle' : mode === 'relative' ? '@x,y,z' : 'x,y,z'}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className="px-3 py-2 bg-[#3B82F6]/20 text-[#60A5FA] rounded-lg text-[11px] font-bold hover:bg-[#3B82F6]/30 transition-all border border-[#3B82F6]/20">
            GO
          </button>
        </div>

        <div className="mt-2 text-[8px] text-white/20 font-mono">
          {mode === 'absolute' && 'Enter X,Y,Z absolute coordinates'}
          {mode === 'relative' && 'Enter @dX,dY,dZ from last point'}
          {mode === 'polar' && 'Enter distance<angle from last point'}
        </div>
      </form>
    </div>
  );
}