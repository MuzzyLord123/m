import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import {
  Plus, Type, Square, Circle, Triangle, Diamond, Image, Trash2,
  Play, Grid3X3, StickyNote, Undo2, Redo2, Copy,
  AlignLeft, AlignCenter, AlignRight,
  Bold, Italic, Underline, ChevronDown, Palette,
  MoveUp, MoveDown, Star, Hexagon, ArrowRight,
  Lock, Unlock, Eye, EyeOff, RotateCcw, Minus, PlusIcon,
  Pipette, Maximize2, ZoomIn, Download, Upload, Sparkles
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { THEMES, SlideElement, SLIDE_LAYOUTS, FONT_FAMILIES, FONT_SIZES, type SlideTheme } from './types';

interface SlideToolbarProps {
  onAddSlide: (layoutId?: string) => void;
  onAddElement: (type: 'text' | 'shape' | 'image', shape?: string) => void;
  onDeleteSlide: () => void;
  onPresent: () => void;
  onToggleGrid: () => void;
  onToggleNotes: () => void;
  showGrid: boolean;
  showNotes: boolean;
  slideCount: number;
  currentSlide: number;
  selectedElement: SlideElement | null;
  onUpdateElement: (updates: Partial<SlideElement>) => void;
  onDeleteElement: () => void;
  onDuplicateElement: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onApplyTheme: (theme: SlideTheme) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onDuplicateSlide: () => void;
  onToggleGuides: () => void;
  showGuides: boolean;
  zoom: number;
  onZoomChange: (z: number) => void;
}

const COLORS = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#64748b',
  '#1e293b', '#991b1b', '#9a3412', '#854d0e', '#166534', '#1d4ed8',
  '#6d28d9', '#be185d', '#0e7490', '#115e59', '#334155',
];

export function SlideToolbar({
  onAddSlide, onAddElement, onDeleteSlide, onPresent, onToggleGrid, onToggleNotes,
  showGrid, showNotes, slideCount, currentSlide, selectedElement,
  onUpdateElement, onDeleteElement, onDuplicateElement, onBringForward, onSendBackward,
  onApplyTheme, canUndo, canRedo, onUndo, onRedo, onDuplicateSlide,
  onToggleGuides, showGuides, zoom, onZoomChange,
}: SlideToolbarProps) {
  const el = selectedElement;

  const themesByCategory = THEMES.reduce((acc, t) => {
    const cat = t.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {} as Record<string, SlideTheme[]>);

  return (
    <div className="flex items-center gap-0.5 px-2 h-11 bg-card/90 backdrop-blur-xl border-b border-border/20 shrink-0 select-none">
      {/* New Slide */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 rounded-lg font-semibold">
            <Plus className="h-3.5 w-3.5" /> Slide <ChevronDown className="h-2.5 w-2.5 opacity-40" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-xl w-52">
          {SLIDE_LAYOUTS.map(layout => (
            <DropdownMenuItem key={layout.id} onClick={() => onAddSlide(layout.id)} className="text-xs gap-2">
              <span className="w-5 text-center">{layout.icon}</span> {layout.name}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDuplicateSlide} className="text-xs gap-2">
            <Copy className="h-3 w-3" /> Duplicate Current
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Separator orientation="vertical" className="h-5 mx-0.5" />

      {/* Undo/Redo */}
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        <Undo2 className="h-3.5 w-3.5" />
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        <Redo2 className="h-3.5 w-3.5" />
      </Button>

      <Separator orientation="vertical" className="h-5 mx-0.5" />

      {/* Insert */}
      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onAddElement('text')} title="Add Text (T)">
        <Type className="h-3.5 w-3.5" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 rounded-lg">
            <Square className="h-3.5 w-3.5" /> <ChevronDown className="h-2.5 w-2.5 opacity-40" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-xl w-40">
          <DropdownMenuItem onClick={() => onAddElement('shape', 'rect')} className="text-xs gap-2"><Square className="h-3 w-3" /> Rectangle</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddElement('shape', 'rounded')} className="text-xs gap-2"><Square className="h-3 w-3 rounded" /> Rounded</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddElement('shape', 'circle')} className="text-xs gap-2"><Circle className="h-3 w-3" /> Circle</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddElement('shape', 'triangle')} className="text-xs gap-2"><Triangle className="h-3 w-3" /> Triangle</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddElement('shape', 'diamond')} className="text-xs gap-2"><Diamond className="h-3 w-3" /> Diamond</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddElement('shape', 'star')} className="text-xs gap-2"><Star className="h-3 w-3" /> Star</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddElement('shape', 'hexagon')} className="text-xs gap-2"><Hexagon className="h-3 w-3" /> Hexagon</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddElement('shape', 'arrow')} className="text-xs gap-2"><ArrowRight className="h-3 w-3" /> Arrow</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onAddElement('image')} title="Add Image">
        <Image className="h-3.5 w-3.5" />
      </Button>

      <Separator orientation="vertical" className="h-5 mx-0.5" />

      {/* Theme */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 rounded-lg">
            <Palette className="h-3.5 w-3.5" /> Theme <ChevronDown className="h-2.5 w-2.5 opacity-40" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-xl w-52 max-h-80 overflow-y-auto">
          {Object.entries(themesByCategory).map(([cat, themes]) => (
            <div key={cat}>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">{cat}</DropdownMenuLabel>
              {themes.map(theme => (
                <DropdownMenuItem key={theme.id} onClick={() => onApplyTheme(theme)} className="text-xs gap-2">
                  <div className="h-4 w-4 rounded-md border border-border/40 shrink-0" style={{ background: theme.bgGradient || theme.bg }} />
                  {theme.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </div>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ──── Element formatting ──── */}
      {el && el.type === 'text' && (
        <>
          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Font family */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-0.5 rounded-lg max-w-24 truncate">
                {el.fontFamily?.split(',')[0] || 'Inter'} <ChevronDown className="h-2.5 w-2.5 opacity-40 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl w-44 max-h-64 overflow-y-auto">
              {FONT_FAMILIES.map(f => (
                <DropdownMenuItem key={f} onClick={() => onUpdateElement({ fontFamily: f })} className="text-xs" style={{ fontFamily: f }}>
                  {f}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Font size */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-0.5 rounded-lg w-12 justify-center tabular-nums">
                {el.fontSize || 24} <ChevronDown className="h-2.5 w-2.5 opacity-40" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-xl w-20 max-h-64 overflow-y-auto">
              {FONT_SIZES.map(s => (
                <DropdownMenuItem key={s} onClick={() => onUpdateElement({ fontSize: s })} className="text-xs justify-center tabular-nums">
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant={el.fontWeight === 'bold' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg"
            onClick={() => onUpdateElement({ fontWeight: el.fontWeight === 'bold' ? 'normal' : 'bold' })}><Bold className="h-3.5 w-3.5" /></Button>
          <Button variant={el.fontStyle === 'italic' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg"
            onClick={() => onUpdateElement({ fontStyle: el.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic className="h-3.5 w-3.5" /></Button>
          <Button variant={el.textDecoration === 'underline' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg"
            onClick={() => onUpdateElement({ textDecoration: el.textDecoration === 'underline' ? 'none' : 'underline' })}><Underline className="h-3.5 w-3.5" /></Button>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          <Button variant={el.textAlign === 'left' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg"
            onClick={() => onUpdateElement({ textAlign: 'left' })}><AlignLeft className="h-3.5 w-3.5" /></Button>
          <Button variant={el.textAlign === 'center' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg"
            onClick={() => onUpdateElement({ textAlign: 'center' })}><AlignCenter className="h-3.5 w-3.5" /></Button>
          <Button variant={el.textAlign === 'right' ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg"
            onClick={() => onUpdateElement({ textAlign: 'right' })}><AlignRight className="h-3.5 w-3.5" /></Button>

          {/* Text color */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg relative">
                <Type className="h-3.5 w-3.5" />
                <div className="absolute bottom-0.5 left-1 right-1 h-[3px] rounded-full" style={{ background: el.color || '#000' }} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-3 rounded-xl" side="bottom">
              <div className="grid grid-cols-6 gap-1.5">
                {COLORS.map(c => (
                  <button key={c} className={cn("h-6 w-6 rounded-md border border-border/30 transition-transform hover:scale-110", el.color === c && "ring-2 ring-primary ring-offset-1")}
                    style={{ background: c }} onClick={() => onUpdateElement({ color: c })} />
                ))}
              </div>
              <Input type="color" value={el.color || '#000000'} onChange={(e) => onUpdateElement({ color: e.target.value })}
                className="mt-2 h-7 w-full rounded-lg cursor-pointer" />
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Shape fill color */}
      {el && el.type === 'shape' && (
        <>
          <Separator orientation="vertical" className="h-5 mx-0.5" />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1.5 rounded-lg">
                <div className="h-3.5 w-3.5 rounded-sm border border-border/40" style={{ background: el.fill || '#3b82f6' }} />
                Fill
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-52 p-3 rounded-xl" side="bottom">
              <div className="grid grid-cols-6 gap-1.5">
                {COLORS.map(c => (
                  <button key={c} className={cn("h-6 w-6 rounded-md border border-border/30 transition-transform hover:scale-110", el.fill === c && "ring-2 ring-primary ring-offset-1")}
                    style={{ background: c }} onClick={() => onUpdateElement({ fill: c })} />
                ))}
              </div>
              <Input type="color" value={el.fill || '#3b82f6'} onChange={(e) => onUpdateElement({ fill: e.target.value })}
                className="mt-2 h-7 w-full rounded-lg cursor-pointer" />
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Element controls */}
      {el && (
        <>
          <Separator orientation="vertical" className="h-5 mx-0.5" />

          {/* Opacity */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 rounded-lg tabular-nums">
                <Eye className="h-3 w-3" /> {Math.round((el.opacity ?? 1) * 100)}%
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3 rounded-xl" side="bottom">
              <div className="text-[10px] font-semibold text-muted-foreground mb-2">Opacity</div>
              <Slider value={[Math.round((el.opacity ?? 1) * 100)]} min={0} max={100} step={1}
                onValueChange={([v]) => onUpdateElement({ opacity: v / 100 })} />
            </PopoverContent>
          </Popover>

          {/* Rotation */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" title="Rotate">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3 rounded-xl" side="bottom">
              <div className="text-[10px] font-semibold text-muted-foreground mb-2">Rotation</div>
              <Slider value={[el.rotation || 0]} min={0} max={360} step={1}
                onValueChange={([v]) => onUpdateElement({ rotation: v })} />
              <div className="flex gap-1 mt-2">
                {[0, 45, 90, 180, 270].map(r => (
                  <Button key={r} variant="outline" size="sm" className="h-6 text-[9px] flex-1 rounded-md"
                    onClick={() => onUpdateElement({ rotation: r })}>{r}°</Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Lock */}
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onUpdateElement({ locked: !el.locked })} title={el.locked ? 'Unlock' : 'Lock'}>
            {el.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
          </Button>

          {/* Visibility */}
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => onUpdateElement({ hidden: !el.hidden })} title={el.hidden ? 'Show' : 'Hide'}>
            {el.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>

          {/* Shadow */}
          <Button variant={el.shadow ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg" onClick={() => onUpdateElement({ shadow: !el.shadow })} title="Shadow">
            <Sparkles className="h-3.5 w-3.5" />
          </Button>

          <Separator orientation="vertical" className="h-5 mx-0.5" />

          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onDuplicateElement} title="Duplicate (Ctrl+D)">
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onBringForward} title="Bring forward">
            <MoveUp className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={onSendBackward} title="Send backward">
            <MoveDown className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive" onClick={onDeleteElement} title="Delete (Del)">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </>
      )}

      <div className="flex-1" />

      {/* Right side */}
      <Button variant={showGuides ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg" onClick={onToggleGuides} title="Smart Guides">
        <Maximize2 className="h-3.5 w-3.5" />
      </Button>
      <Button variant={showNotes ? 'secondary' : 'ghost'} size="sm" className="h-7 text-[10px] gap-1 rounded-lg" onClick={onToggleNotes}>
        <StickyNote className="h-3.5 w-3.5" /> Notes
      </Button>
      <Button variant={showGrid ? 'secondary' : 'ghost'} size="icon" className="h-7 w-7 rounded-lg" onClick={onToggleGrid} title="Grid view (G)">
        <Grid3X3 className="h-3.5 w-3.5" />
      </Button>

      <Separator orientation="vertical" className="h-5 mx-0.5" />

      {/* Zoom */}
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => onZoomChange(Math.max(25, zoom - 25))}>
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-[10px] tabular-nums font-medium text-muted-foreground w-8 text-center">{zoom}%</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => onZoomChange(Math.min(200, zoom + 25))}>
          <PlusIcon className="h-3 w-3" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-5 mx-0.5" />

      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-destructive" onClick={onDeleteSlide} title="Delete slide">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      <Button size="sm" className="h-7 text-[10px] gap-1.5 rounded-lg shadow-sm font-semibold ml-1 bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white border-0" onClick={onPresent}>
        <Play className="h-3 w-3" /> Present
      </Button>
    </div>
  );
}
