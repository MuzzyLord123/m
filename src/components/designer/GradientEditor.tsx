import { useState, useMemo } from 'react';
import { useEditor } from './EditorContext';
import { Palette, Plus, Trash2, RotateCw } from 'lucide-react';

interface GradientStop {
  color: string;
  position: number;
}

export function GradientEditor() {
  const { state, dispatch, selectedElement } = useEditor();
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [angle, setAngle] = useState(135);
  const [stops, setStops] = useState<GradientStop[]>([
    { color: '#8b5cf6', position: 0 },
    { color: '#3b82f6', position: 100 },
  ]);

  const gradientCSS = useMemo(() => {
    const sortedStops = [...stops].sort((a, b) => a.position - b.position);
    const stopsStr = sortedStops.map(s => `${s.color} ${s.position}%`).join(', ');
    return gradientType === 'linear'
      ? `linear-gradient(${angle}deg, ${stopsStr})`
      : `radial-gradient(circle, ${stopsStr})`;
  }, [gradientType, angle, stops]);

  const applyGradient = (prop: 'background' | 'color') => {
    if (!selectedElement) return;
    const bp = state.breakpoint;
    const newStyles = { ...selectedElement.styles };
    const bpStyles = bp === 'desktop' ? { ...newStyles.desktop } : { ...(newStyles[bp] ?? {}) };
    
    if (prop === 'background') {
      bpStyles.background = gradientCSS;
      delete bpStyles.backgroundColor;
    } else {
      bpStyles.background = gradientCSS;
      bpStyles.WebkitBackgroundClip = 'text';
      bpStyles.WebkitTextFillColor = 'transparent';
    }
    
    if (bp === 'desktop') newStyles.desktop = bpStyles;
    else newStyles[bp] = bpStyles;
    
    dispatch({ type: 'UPDATE_ELEMENT', payload: { id: selectedElement.id, updates: { styles: newStyles } } });
  };

  const addStop = () => {
    const mid = stops.length > 0 ? Math.round((stops[stops.length - 1].position + stops[0].position) / 2) : 50;
    setStops([...stops, { color: '#ffffff', position: mid }]);
  };

  const removeStop = (i: number) => {
    if (stops.length <= 2) return;
    setStops(stops.filter((_, idx) => idx !== i));
  };

  const updateStop = (i: number, updates: Partial<GradientStop>) => {
    setStops(stops.map((s, idx) => idx === i ? { ...s, ...updates } : s));
  };

  return (
    <div className="p-3 space-y-3" style={{ backgroundColor: '#1e1e1e' }}>
      <div className="flex items-center gap-2 mb-2">
        <Palette className="h-3.5 w-3.5" style={{ color: '#8b5cf6' }} />
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#999' }}>Gradient Editor</span>
      </div>

      {/* Preview */}
      <div
        className="rounded-lg"
        style={{ height: '48px', background: gradientCSS, border: '1px solid rgba(255,255,255,0.08)' }}
      />

      {/* Type toggle */}
      <div className="flex gap-1">
        {(['linear', 'radial'] as const).map(t => (
          <button
            key={t}
            onClick={() => setGradientType(t)}
            className="flex-1 py-1.5 rounded text-[10px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: gradientType === t ? '#0073E6' : '#2d2d2d',
              color: gradientType === t ? '#fff' : '#666',
              border: `1px solid ${gradientType === t ? '#0073E6' : '#333'}`,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Angle (linear only) */}
      {gradientType === 'linear' && (
        <div className="flex items-center gap-2">
          <RotateCw className="h-3 w-3" style={{ color: '#666' }} />
          <input
            type="range"
            min="0"
            max="360"
            value={angle}
            onChange={e => setAngle(Number(e.target.value))}
            className="flex-1"
            style={{ accentColor: '#0073E6' }}
          />
          <span className="text-[10px] font-mono" style={{ color: '#888', minWidth: '36px' }}>{angle}°</span>
        </div>
      )}

      {/* Stops */}
      <div className="space-y-2">
        {stops.map((stop, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="color"
              value={stop.color}
              onChange={e => updateStop(i, { color: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-none"
              style={{ backgroundColor: 'transparent' }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={stop.position}
              onChange={e => updateStop(i, { position: Number(e.target.value) })}
              className="flex-1"
              style={{ accentColor: stop.color }}
            />
            <span className="text-[10px] font-mono" style={{ color: '#888', minWidth: '28px' }}>{stop.position}%</span>
            {stops.length > 2 && (
              <button onClick={() => removeStop(i)} className="p-0.5 rounded hover:bg-red-500/20">
                <Trash2 className="h-3 w-3 text-red-400" />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={addStop}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-semibold"
        style={{ backgroundColor: '#2d2d2d', color: '#888', border: '1px solid #333' }}
      >
        <Plus className="h-3 w-3" /> Add Stop
      </button>

      {/* Apply buttons */}
      <div className="flex gap-1 pt-1">
        <button
          onClick={() => applyGradient('background')}
          className="flex-1 py-2 rounded text-[10px] font-semibold"
          style={{ backgroundColor: '#0073E6', color: '#fff' }}
          disabled={!selectedElement}
        >
          Apply as BG
        </button>
        <button
          onClick={() => applyGradient('color')}
          className="flex-1 py-2 rounded text-[10px] font-semibold"
          style={{ backgroundColor: '#2d2d2d', color: '#ddd', border: '1px solid #333' }}
          disabled={!selectedElement}
        >
          Apply as Text
        </button>
      </div>

      {/* CSS output */}
      <div
        className="p-2 rounded text-[10px] font-mono break-all cursor-pointer"
        style={{ backgroundColor: '#252525', color: '#888', border: '1px solid #333' }}
        onClick={() => navigator.clipboard.writeText(gradientCSS)}
        title="Click to copy"
      >
        {gradientCSS}
      </div>
    </div>
  );
}
