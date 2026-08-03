import React, { useState, useCallback } from 'react';
import { useEditor } from './EditorContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, Columns, Rows, Grid3X3, AlignLeft, AlignCenter, AlignRight, AlignHorizontalJustifyCenter, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Maximize2, StretchHorizontal, StretchVertical, Eye, Minus } from 'lucide-react';

/* ── Shared UI ── */
function Section({ label, open, onClick, badge }: { label: string; open: boolean; onClick: () => void; badge?: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between h-8 px-0 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: 'hsl(var(--studio-ink-2))' }}>
      <span className="flex items-center gap-2">{label}
        {badge && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-semibold" style={{ backgroundColor: 'hsl(var(--studio-accent) / 0.15)', color: 'hsl(var(--studio-accent))' }}>{badge}</span>}
      </span>
      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? '' : '-rotate-90'}`} style={{ color: 'hsl(var(--studio-ink-3))' }} />
    </button>
  );
}

function MiniInput({ value, onChange, suffix, placeholder }: { value: string; onChange: (v: string) => void; suffix?: string; placeholder?: string }) {
  return (
    <div className="relative flex-1">
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full h-6 px-2 rounded text-[11px] outline-none"
        style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))', paddingRight: suffix ? '22px' : '8px' }}
        onFocus={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-accent))'; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'hsl(var(--studio-line))'; }}
      />
      {suffix && <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px]" style={{ color: 'hsl(var(--studio-ink-3))' }}>{suffix}</span>}
    </div>
  );
}

function IconBtn({ active, onClick, children, title }: { active?: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button title={title} onClick={onClick}
      className="h-7 w-7 flex items-center justify-center rounded-md transition-all"
      style={{
        backgroundColor: active ? '#0073E620' : 'hsl(var(--studio-raised))',
        border: `1px solid ${active ? '#0073E640' : 'hsl(var(--studio-line))'}`,
        color: active ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-2))',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'hsl(var(--studio-line))'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'hsl(var(--studio-raised))'; }}
    >{children}</button>
  );
}

function SliderRow({ label, value, onChange, min = 0, max = 100, suffix = '' }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string }) {
  return (
    <div className="flex items-center gap-2 h-7">
      <span className="text-[10px] w-14 shrink-0 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-1 rounded-full appearance-none cursor-pointer"
        style={{ background: `linear-gradient(to right, hsl(var(--studio-accent)) 0%, hsl(var(--studio-accent)) ${((value - min) / (max - min)) * 100}%, hsl(var(--studio-line)) ${((value - min) / (max - min)) * 100}%, hsl(var(--studio-line)) 100%)` }}
      />
      <span className="text-[10px] w-10 text-right tabular-nums" style={{ color: 'hsl(var(--studio-ink-2))' }}>{value}{suffix}</span>
    </div>
  );
}

/* ── Spacing Visualizer ── */
function SpacingVisualizer({ margin, padding, onChange }: {
  margin: { top: string; right: string; bottom: string; left: string };
  padding: { top: string; right: string; bottom: string; left: string };
  onChange: (type: 'margin' | 'padding', side: string, value: string) => void;
}) {
  const SpaceInput = ({ type, side, value }: { type: 'margin' | 'padding'; side: string; value: string }) => (
    <input value={value} onChange={e => onChange(type, side, e.target.value)} placeholder="–"
      className="w-7 h-5 text-center text-[9px] rounded outline-none"
      style={{ backgroundColor: 'transparent', border: 'none', color: type === 'margin' ? 'hsl(var(--studio-warn))' : 'hsl(var(--studio-ok))' }}
      onFocus={e => e.currentTarget.style.backgroundColor = 'hsl(var(--studio-raised))'}
      onBlur={e => e.currentTarget.style.backgroundColor = 'transparent'}
    />
  );

  return (
    <div className="flex items-center justify-center py-2">
      <div className="relative" style={{ width: 180, height: 130 }}>
        {/* Margin box */}
        <div className="absolute inset-0 rounded-lg flex flex-col items-center justify-between py-1" style={{ border: '1px dashed #f59e0b40', backgroundColor: '#f59e0b08' }}>
          <SpaceInput type="margin" side="top" value={margin.top} />
          <div className="flex items-center justify-between w-full px-1">
            <SpaceInput type="margin" side="left" value={margin.left} />
            {/* Padding box */}
            <div className="relative rounded-md flex flex-col items-center justify-between py-1" style={{ width: 110, height: 70, border: '1px dashed #10b98140', backgroundColor: '#10b98108' }}>
              <SpaceInput type="padding" side="top" value={padding.top} />
              <div className="flex items-center justify-between w-full px-1">
                <SpaceInput type="padding" side="left" value={padding.left} />
                <div className="w-8 h-4 rounded" style={{ backgroundColor: '#0073E620', border: '1px solid #0073E640' }} />
                <SpaceInput type="padding" side="right" value={padding.right} />
              </div>
              <SpaceInput type="padding" side="bottom" value={padding.bottom} />
            </div>
            <SpaceInput type="margin" side="right" value={margin.right} />
          </div>
          <SpaceInput type="margin" side="bottom" value={margin.bottom} />
        </div>
        {/* Labels */}
        <span className="absolute top-0.5 left-1.5 text-[7px] uppercase tracking-wider" style={{ color: '#f59e0b80' }}>margin</span>
        <span className="absolute text-[7px] uppercase tracking-wider" style={{ color: '#10b98180', top: 22, left: 40 }}>padding</span>
      </div>
    </div>
  );
}

/* ── Main Panel ── */
export function AdvancedStylePanel() {
  const { state } = useEditor();
  const [layoutOpen, setLayoutOpen] = useState(true);
  const [spacingOpen, setSpacingOpen] = useState(true);
  const [transformOpen, setTransformOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [borderOpen, setBorderOpen] = useState(false);
  const [effectsOpen, setEffectsOpen] = useState(false);

  // Layout state
  const [displayMode, setDisplayMode] = useState<'block' | 'flex' | 'grid' | 'inline-block' | 'none'>('block');
  const [flexDirection, setFlexDirection] = useState<'row' | 'column'>('row');
  const [justifyContent, setJustifyContent] = useState('flex-start');
  const [alignItems, setAlignItems] = useState('stretch');
  const [flexWrap, setFlexWrap] = useState(false);
  const [gap, setGap] = useState('0');
  const [gridCols, setGridCols] = useState('2');
  const [gridRows, setGridRows] = useState('auto');

  // Spacing
  const [margin, setMargin] = useState({ top: '0', right: '0', bottom: '0', left: '0' });
  const [padding, setPadding] = useState({ top: '0', right: '0', bottom: '0', left: '0' });

  // Transform
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [scaleVal, setScaleVal] = useState(100);
  const [rotateVal, setRotateVal] = useState(0);
  const [skewX, setSkewX] = useState(0);
  const [skewY, setSkewY] = useState(0);
  const [perspective, setPerspective] = useState(1000);

  // Filters
  const [blur, setBlur] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [hueRotate, setHueRotate] = useState(0);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);
  const [invert, setInvert] = useState(0);

  // Typography
  const [fontSize, setFontSize] = useState('16');
  const [fontWeight, setFontWeight] = useState('400');
  const [lineHeight, setLineHeight] = useState('1.5');
  const [letterSpacing, setLetterSpacing] = useState('0');
  const [textTransform, setTextTransform] = useState('none');
  const [textDecoration, setTextDecoration] = useState('none');

  // Border
  const [borderWidth, setBorderWidth] = useState('0');
  const [borderStyle, setBorderStyle] = useState('solid');
  const [borderColor, setBorderColor] = useState('#333333');
  const [borderRadius, setBorderRadius] = useState('0');

  // Effects
  const [boxShadow, setBoxShadow] = useState('none');
  const [backdropBlur, setBackdropBlur] = useState(0);
  const [mixBlendMode, setMixBlendMode] = useState('normal');
  const [cursor, setCursor] = useState('auto');
  const [overflow, setOverflow] = useState('visible');
  const [opacity, setOpacity] = useState(100);

  const handleSpacingChange = useCallback((type: 'margin' | 'padding', side: string, value: string) => {
    if (type === 'margin') setMargin(p => ({ ...p, [side]: value }));
    else setPadding(p => ({ ...p, [side]: value }));
  }, []);

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-1">
        <h3 className="text-[11px] font-semibold mb-2" style={{ color: 'hsl(var(--studio-ink))' }}>Advanced Styles</h3>

        {/* Layout / Display */}
        <Section label="Layout" open={layoutOpen} onClick={() => setLayoutOpen(!layoutOpen)} badge={displayMode} />
        {layoutOpen && (
          <div className="space-y-2 mb-2">
            <div className="text-[9px] mb-1" style={{ color: 'hsl(var(--studio-ink-3))' }}>Display</div>
            <div className="flex gap-1">
              {(['block', 'flex', 'grid', 'inline-block', 'none'] as const).map(d => (
                <button key={d} onClick={() => setDisplayMode(d)}
                  className="flex-1 text-[9px] py-1.5 rounded-md transition-all capitalize"
                  style={{
                    backgroundColor: displayMode === d ? '#0073E620' : 'hsl(var(--studio-raised))',
                    border: `1px solid ${displayMode === d ? '#0073E640' : 'hsl(var(--studio-line))'}`,
                    color: displayMode === d ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-2))',
                  }}>{d === 'inline-block' ? 'Inline' : d}</button>
              ))}
            </div>

            {displayMode === 'flex' && (
              <div className="space-y-2 rounded-md p-2" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
                <div className="text-[9px]" style={{ color: 'hsl(var(--studio-ink-3))' }}>Direction</div>
                <div className="flex gap-1">
                  <IconBtn active={flexDirection === 'row'} onClick={() => setFlexDirection('row')} title="Row"><Columns className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn active={flexDirection === 'column'} onClick={() => setFlexDirection('column')} title="Column"><Rows className="h-3.5 w-3.5" /></IconBtn>
                  <div className="w-px" style={{ backgroundColor: 'hsl(var(--studio-hover))' }} />
                  <IconBtn active={flexWrap} onClick={() => setFlexWrap(!flexWrap)} title="Wrap"><StretchHorizontal className="h-3.5 w-3.5" /></IconBtn>
                </div>

                <div className="text-[9px] mt-1" style={{ color: 'hsl(var(--studio-ink-3))' }}>Justify</div>
                <div className="flex gap-1">
                  {[{ v: 'flex-start', i: AlignLeft }, { v: 'center', i: AlignCenter }, { v: 'flex-end', i: AlignRight }, { v: 'space-between', i: AlignHorizontalJustifyCenter }].map(j => (
                    <IconBtn key={j.v} active={justifyContent === j.v} onClick={() => setJustifyContent(j.v)} title={j.v}><j.i className="h-3.5 w-3.5" /></IconBtn>
                  ))}
                </div>

                <div className="text-[9px] mt-1" style={{ color: 'hsl(var(--studio-ink-3))' }}>Align</div>
                <div className="flex gap-1">
                  {[{ v: 'flex-start', i: ArrowUp }, { v: 'center', i: Minus }, { v: 'flex-end', i: ArrowDown }, { v: 'stretch', i: StretchVertical }].map(a => (
                    <IconBtn key={a.v} active={alignItems === a.v} onClick={() => setAlignItems(a.v)} title={a.v}><a.i className="h-3.5 w-3.5" /></IconBtn>
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px]" style={{ color: 'hsl(var(--studio-ink-3))' }}>Gap</span>
                  <MiniInput value={gap} onChange={setGap} suffix="px" />
                </div>
              </div>
            )}

            {displayMode === 'grid' && (
              <div className="space-y-2 rounded-md p-2" style={{ backgroundColor: 'hsl(var(--studio-panel))', border: '1px solid hsl(var(--studio-line))' }}>
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-3.5 w-3.5" style={{ color: 'hsl(var(--studio-accent))' }} />
                  <span className="text-[9px]" style={{ color: 'hsl(var(--studio-ink-3))' }}>CSS Grid</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] w-10" style={{ color: 'hsl(var(--studio-ink-3))' }}>Cols</span>
                  <MiniInput value={gridCols} onChange={setGridCols} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] w-10" style={{ color: 'hsl(var(--studio-ink-3))' }}>Rows</span>
                  <MiniInput value={gridRows} onChange={setGridRows} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] w-10" style={{ color: 'hsl(var(--studio-ink-3))' }}>Gap</span>
                  <MiniInput value={gap} onChange={setGap} suffix="px" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Spacing */}
        <Section label="Spacing" open={spacingOpen} onClick={() => setSpacingOpen(!spacingOpen)} />
        {spacingOpen && <SpacingVisualizer margin={margin} padding={padding} onChange={handleSpacingChange} />}

        {/* Transform */}
        <Section label="Transform" open={transformOpen} onClick={() => setTransformOpen(!transformOpen)} />
        {transformOpen && (
          <div className="space-y-1 mb-2">
            <SliderRow label="Move X" value={translateX} onChange={setTranslateX} min={-200} max={200} suffix="px" />
            <SliderRow label="Move Y" value={translateY} onChange={setTranslateY} min={-200} max={200} suffix="px" />
            <SliderRow label="Scale" value={scaleVal} onChange={setScaleVal} min={0} max={200} suffix="%" />
            <SliderRow label="Rotate" value={rotateVal} onChange={setRotateVal} min={-360} max={360} suffix="°" />
            <SliderRow label="Skew X" value={skewX} onChange={setSkewX} min={-45} max={45} suffix="°" />
            <SliderRow label="Skew Y" value={skewY} onChange={setSkewY} min={-45} max={45} suffix="°" />
            <SliderRow label="Persp." value={perspective} onChange={setPerspective} min={100} max={2000} suffix="px" />
          </div>
        )}

        {/* Filters */}
        <Section label="Filters" open={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)} />
        {filtersOpen && (
          <div className="space-y-1 mb-2">
            <SliderRow label="Blur" value={blur} onChange={setBlur} min={0} max={50} suffix="px" />
            <SliderRow label="Bright" value={brightness} onChange={setBrightness} min={0} max={200} suffix="%" />
            <SliderRow label="Contrast" value={contrast} onChange={setContrast} min={0} max={200} suffix="%" />
            <SliderRow label="Saturate" value={saturate} onChange={setSaturate} min={0} max={200} suffix="%" />
            <SliderRow label="Hue" value={hueRotate} onChange={setHueRotate} min={0} max={360} suffix="°" />
            <SliderRow label="Gray" value={grayscale} onChange={setGrayscale} min={0} max={100} suffix="%" />
            <SliderRow label="Sepia" value={sepia} onChange={setSepia} min={0} max={100} suffix="%" />
            <SliderRow label="Invert" value={invert} onChange={setInvert} min={0} max={100} suffix="%" />
          </div>
        )}

        {/* Typography */}
        <Section label="Typography" open={typographyOpen} onClick={() => setTypographyOpen(!typographyOpen)} />
        {typographyOpen && (
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] w-14 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Size</span>
              <MiniInput value={fontSize} onChange={setFontSize} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] w-14 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Weight</span>
              <select value={fontWeight} onChange={e => setFontWeight(e.target.value)}
                className="flex-1 h-6 px-1.5 rounded text-[10px] outline-none cursor-pointer"
                style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}>
                {['100','200','300','400','500','600','700','800','900'].map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] w-14 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Line H</span>
              <MiniInput value={lineHeight} onChange={setLineHeight} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] w-14 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Spacing</span>
              <MiniInput value={letterSpacing} onChange={setLetterSpacing} suffix="px" />
            </div>
            <div className="flex gap-1">
              {(['none','uppercase','lowercase','capitalize'] as const).map(t => (
                <button key={t} onClick={() => setTextTransform(t)}
                  className="flex-1 text-[8px] py-1 rounded-md capitalize"
                  style={{
                    backgroundColor: textTransform === t ? '#0073E620' : 'hsl(var(--studio-raised))',
                    border: `1px solid ${textTransform === t ? '#0073E640' : 'hsl(var(--studio-line))'}`,
                    color: textTransform === t ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-2))',
                  }}>{t === 'none' ? 'Aa' : t.slice(0, 3)}</button>
              ))}
            </div>
            <div className="flex gap-1">
              {(['none','underline','line-through','overline'] as const).map(d => (
                <button key={d} onClick={() => setTextDecoration(d)}
                  className="flex-1 text-[8px] py-1 rounded-md capitalize"
                  style={{
                    backgroundColor: textDecoration === d ? '#0073E620' : 'hsl(var(--studio-raised))',
                    border: `1px solid ${textDecoration === d ? '#0073E640' : 'hsl(var(--studio-line))'}`,
                    color: textDecoration === d ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-2))',
                  }}>{d === 'none' ? '—' : d === 'line-through' ? 'S' : d.slice(0, 3)}</button>
              ))}
            </div>
          </div>
        )}

        {/* Border */}
        <Section label="Border" open={borderOpen} onClick={() => setBorderOpen(!borderOpen)} />
        {borderOpen && (
          <div className="space-y-1.5 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] w-14 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Width</span>
              <MiniInput value={borderWidth} onChange={setBorderWidth} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] w-14 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Style</span>
              <select value={borderStyle} onChange={e => setBorderStyle(e.target.value)}
                className="flex-1 h-6 px-1.5 rounded text-[10px] outline-none cursor-pointer"
                style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}>
                {['solid','dashed','dotted','double','groove','ridge','inset','outset','none'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] w-14 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Color</span>
              <div className="flex items-center gap-1 flex-1">
                <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                <MiniInput value={borderColor} onChange={setBorderColor} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] w-14 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Radius</span>
              <MiniInput value={borderRadius} onChange={setBorderRadius} suffix="px" />
            </div>
          </div>
        )}

        {/* Effects */}
        <Section label="Effects" open={effectsOpen} onClick={() => setEffectsOpen(!effectsOpen)} />
        {effectsOpen && (
          <div className="space-y-1.5 mb-2">
            <SliderRow label="Opacity" value={opacity} onChange={setOpacity} min={0} max={100} suffix="%" />
            <SliderRow label="Bg Blur" value={backdropBlur} onChange={setBackdropBlur} min={0} max={50} suffix="px" />
            <div className="flex items-center gap-2">
              <span className="text-[9px] w-14 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Blend</span>
              <select value={mixBlendMode} onChange={e => setMixBlendMode(e.target.value)}
                className="flex-1 h-6 px-1.5 rounded text-[10px] outline-none cursor-pointer"
                style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}>
                {['normal','multiply','screen','overlay','darken','lighten','color-dodge','color-burn','hard-light','soft-light','difference','exclusion','hue','saturation','color','luminosity'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] w-14 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Cursor</span>
              <select value={cursor} onChange={e => setCursor(e.target.value)}
                className="flex-1 h-6 px-1.5 rounded text-[10px] outline-none cursor-pointer"
                style={{ backgroundColor: 'hsl(var(--studio-raised))', border: '1px solid hsl(var(--studio-line))', color: 'hsl(var(--studio-ink-2))' }}>
                {['auto','pointer','crosshair','move','grab','grabbing','text','not-allowed','wait','zoom-in','zoom-out','none'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] w-14 text-right" style={{ color: 'hsl(var(--studio-ink-3))' }}>Overflow</span>
              <div className="flex gap-1 flex-1">
                {['visible','hidden','scroll','auto'].map(o => (
                  <button key={o} onClick={() => setOverflow(o)}
                    className="flex-1 text-[8px] py-1 rounded-md capitalize"
                    style={{
                      backgroundColor: overflow === o ? '#0073E620' : 'hsl(var(--studio-raised))',
                      border: `1px solid ${overflow === o ? '#0073E640' : 'hsl(var(--studio-line))'}`,
                      color: overflow === o ? 'hsl(var(--studio-accent))' : 'hsl(var(--studio-ink-2))',
                    }}>{o.slice(0, 4)}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
