import { useState } from 'react';
import { useCAD } from './CADContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronRight, ChevronLeft, ChevronDown, Settings2, Layers, BarChart3, Keyboard, Palette, Package, Group, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DrawingPlane } from './cadTypes';

const planeLabels: Record<DrawingPlane, string> = { xy: 'XY Floor', xz: 'XZ Wall', yz: 'YZ Side', free: 'Free 3D' };

export function CADPropertiesSlideout() {
  const { state, dispatch } = useCAD();
  const open = state.propertiesPanelOpen;
  const setOpen = (v: boolean) => dispatch({ type: 'SET_PROPERTIES_PANEL', payload: v });

  const selectedEntities = (state.entities || []).filter(e => (state.selectedIds || []).includes(e.id));
  const single = selectedEntities.length === 1 ? selectedEntities[0] : null;
  const activeLayer = (state.layers || []).find(l => l.id === state.activeLayerId);
  const groups = state.groups || [];
  const hiddenEntityIds = state.hiddenEntityIds || [];
  const isolatedEntityIds = state.isolatedEntityIds;
  const blockDefinitions = state.blockDefinitions || [];

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed z-[999] h-16 w-5 flex items-center justify-center transition-all",
          "bg-[#141414] border border-white/[0.06] hover:bg-white/10",
          open ? "right-[300px] rounded-l-md border-r-0" : "right-0 rounded-l-md"
        )}
        style={{ top: 'calc(68px + 50%)' , transform: 'translateY(-50%)' }}
      >
        {open ? <ChevronRight className="h-3 w-3 text-white/50" /> : <ChevronLeft className="h-3 w-3 text-white/50" />}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 z-[998] w-[300px] bg-[#111111] border-l border-white/[0.06] flex flex-col transition-transform duration-200",
          !open && "translate-x-full"
        )}
        style={{ top: '68px', bottom: '28px' }}
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5 text-white/40" />
          <span className="text-[11px] font-semibold text-white/70 uppercase tracking-wider">Properties</span>
          {selectedEntities.length > 0 && (
            <span className="text-[10px] text-[#3B82F6] ml-auto">{selectedEntities.length} selected</span>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1">
            {/* Drawing Settings */}
            <Section title="Drawing Settings" icon={Settings2} defaultOpen>
              <Field label="Units">
                <Select value={state.units} onValueChange={v => dispatch({ type: 'SET_UNITS', payload: v })}>
                  <SelectTrigger className="h-6 text-[11px] w-28 bg-[#1a1a1a] border-white/10 text-white/80"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1e1e1e] border-white/10">
                    <SelectItem value="mm">Millimeters</SelectItem>
                    <SelectItem value="cm">Centimeters</SelectItem>
                    <SelectItem value="m">Meters</SelectItem>
                    <SelectItem value="in">Inches</SelectItem>
                    <SelectItem value="ft">Feet</SelectItem>
                    <SelectItem value="arch">Architectural</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Precision">
                <Select value={String(state.precision)} onValueChange={v => dispatch({ type: 'SET_PRECISION', payload: parseInt(v) })}>
                  <SelectTrigger className="h-6 text-[11px] w-28 bg-[#1a1a1a] border-white/10 text-white/80"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#1e1e1e] border-white/10">
                    {[0, 1, 2, 3, 4, 6].map(p => (
                      <SelectItem key={p} value={String(p)}>{p === 0 ? '0' : `0.${'0'.repeat(p)}`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Grid Size">
                <Input type="number" className="h-6 text-[11px] w-20 bg-[#1a1a1a] border-white/10 text-white/80" value={state.gridSize}
                  min={1} max={1000}
                  onChange={e => dispatch({ type: 'SET_GRID_SIZE', payload: Math.max(1, Math.min(1000, Number(e.target.value))) })} />
              </Field>
              <Field label="Snap"><Switch checked={state.snapEnabled} onCheckedChange={() => dispatch({ type: 'TOGGLE_SNAP' })} className="scale-75" /></Field>
              <Field label="Grid"><Switch checked={state.gridVisible} onCheckedChange={() => dispatch({ type: 'TOGGLE_GRID' })} className="scale-75" /></Field>
              <Field label="Ortho"><Switch checked={state.orthoMode} onCheckedChange={() => dispatch({ type: 'TOGGLE_ORTHO' })} className="scale-75" /></Field>
              <Field label="Polar Tracking"><Switch checked={state.polarTracking} onCheckedChange={() => dispatch({ type: 'TOGGLE_POLAR' })} className="scale-75" /></Field>
            </Section>

            {/* Active Object Properties */}
            {single && (
              <Section title={`${single.type.charAt(0).toUpperCase() + single.type.slice(1)} Properties`} icon={Palette} defaultOpen>
                {single.type === 'line' && (
                  <>
                    <CoordField label="Start X" value={single.data.start.x} />
                    <CoordField label="Start Y" value={single.data.start.y} />
                    <CoordField label="End X" value={single.data.end.x} />
                    <CoordField label="End Y" value={single.data.end.y} />
                    <ReadonlyField label="Length" value={Math.sqrt((single.data.end.x - single.data.start.x) ** 2 + (single.data.end.y - single.data.start.y) ** 2).toFixed(state.precision)} />
                    <ReadonlyField label="Angle" value={`${(Math.atan2(single.data.end.y - single.data.start.y, single.data.end.x - single.data.start.x) * 180 / Math.PI).toFixed(1)}°`} />
                  </>
                )}
                {single.type === 'line3d' && (
                  <>
                    <CoordField label="Start" value={`${single.data.start.x.toFixed(2)}, ${single.data.start.y.toFixed(2)}, ${single.data.start.z.toFixed(2)}`} />
                    <CoordField label="End" value={`${single.data.end.x.toFixed(2)}, ${single.data.end.y.toFixed(2)}, ${single.data.end.z.toFixed(2)}`} />
                    <ReadonlyField label="Length" value={Math.sqrt((single.data.end.x - single.data.start.x) ** 2 + (single.data.end.y - single.data.start.y) ** 2 + (single.data.end.z - single.data.start.z) ** 2).toFixed(state.precision)} />
                  </>
                )}
                {single.type === 'circle' && (
                  <>
                    <CoordField label="Center X" value={single.data.center.x} />
                    <CoordField label="Center Y" value={single.data.center.y} />
                    <CoordField label="Radius" value={single.data.radius} />
                    <ReadonlyField label="Diameter" value={(single.data.radius * 2).toFixed(state.precision)} />
                    <ReadonlyField label="Area" value={(Math.PI * single.data.radius ** 2).toFixed(state.precision)} />
                    <ReadonlyField label="Circumference" value={(2 * Math.PI * single.data.radius).toFixed(state.precision)} />
                  </>
                )}
                {single.type === 'rectangle' && (
                  <>
                    <CoordField label="Width" value={single.data.width} />
                    <CoordField label="Height" value={single.data.height} />
                    <ReadonlyField label="Area" value={(single.data.width * single.data.height).toFixed(state.precision)} />
                    {single.data.extrude && <CoordField label="Extrude" value={single.data.extrude} />}
                  </>
                )}
                {single.type === 'wall' && (
                  <>
                    <CoordField label="Base" value={`${single.data.base.x.toFixed(1)}, ${single.data.base.y.toFixed(1)}, ${single.data.base.z.toFixed(1)}`} />
                    <CoordField label="Width" value={single.data.width} />
                    <CoordField label="Height" value={single.data.height} />
                    <CoordField label="Depth" value={single.data.depth} />
                    <ReadonlyField label="Volume" value={(single.data.width * single.data.height * single.data.depth).toFixed(state.precision)} />
                  </>
                )}
                {single.type === 'box3d' && (
                  <>
                    <CoordField label="Position" value={`${single.data.origin.x.toFixed(1)}, ${single.data.origin.y.toFixed(1)}, ${single.data.origin.z.toFixed(1)}`} />
                    <CoordField label="Width" value={single.data.width} />
                    <CoordField label="Depth" value={single.data.depth} />
                    <CoordField label="Height" value={single.data.height} />
                    <ReadonlyField label="Volume" value={(single.data.width * single.data.depth * single.data.height).toFixed(state.precision)} />
                  </>
                )}
                {single.type === 'column' && (
                  <>
                    <CoordField label="Base" value={`${single.data.base.x.toFixed(1)}, ${single.data.base.y.toFixed(1)}, ${single.data.base.z.toFixed(1)}`} />
                    <CoordField label="Radius" value={single.data.radius} />
                    <CoordField label="Height" value={single.data.height} />
                    <ReadonlyField label="Volume" value={(Math.PI * single.data.radius ** 2 * single.data.height).toFixed(state.precision)} />
                  </>
                )}

                <Field label="Layer">
                  <Select value={single.layerId} onValueChange={v => dispatch({ type: 'UPDATE_ENTITY', payload: { id: single.id, changes: { layerId: v } } })}>
                    <SelectTrigger className="h-6 text-[11px] w-24 bg-[#1a1a1a] border-white/10 text-white/80"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1e1e1e] border-white/10">
                      {state.layers.map(l => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Color">
                  <input
                    type="color"
                    value={single.color || state.layers.find(l => l.id === single.layerId)?.color || '#ffffff'}
                    onChange={e => dispatch({ type: 'UPDATE_ENTITY', payload: { id: single.id, changes: { color: e.target.value } } })}
                    className="h-5 w-8 rounded cursor-pointer border border-white/10 bg-transparent p-0"
                  />
                </Field>
                <Field label="Linetype">
                  <Select value={single.lineType || 'solid'} onValueChange={v => dispatch({ type: 'UPDATE_ENTITY', payload: { id: single.id, changes: { lineType: v } } })}>
                    <SelectTrigger className="h-6 text-[11px] w-24 bg-[#1a1a1a] border-white/10 text-white/80"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#1e1e1e] border-white/10">
                      {['solid', 'dashed', 'dotted', 'centerline', 'hidden'].map(lt => (
                        <SelectItem key={lt} value={lt}>{lt.charAt(0).toUpperCase() + lt.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </Section>
            )}

            {/* Multiple selection info */}
            {selectedEntities.length > 1 && (
              <Section title="Selection" icon={Palette} defaultOpen>
                <Field label="Count"><span className="text-[11px] font-mono text-white/80">{selectedEntities.length}</span></Field>
                <Field label="Types">
                  <span className="text-[10px] text-white/60">{[...new Set(selectedEntities.map(e => e.type))].join(', ')}</span>
                </Field>
              </Section>
            )}

            {/* Block ref properties */}
            {single?.type === 'block-ref' && (
              <Section title="Block Reference" icon={Package} defaultOpen>
                <ReadonlyField label="Block" value={blockDefinitions.find(b => b.id === single.data.blockId)?.name || 'Unknown'} />
                <CoordField label="Insert" value={`${single.data.insertPoint.x.toFixed(1)}, ${single.data.insertPoint.y.toFixed(1)}, ${single.data.insertPoint.z.toFixed(1)}`} />
                <CoordField label="Scale" value={`${single.data.scaleX}, ${single.data.scaleY}, ${single.data.scaleZ}`} />
                <CoordField label="Rotation" value={`${single.data.rotation}°`} />
              </Section>
            )}

            {/* Groups */}
            {groups.length > 0 && (
              <Section title="Groups" icon={Group}>
                {groups.map(g => (
                  <div key={g.id} className="flex items-center justify-between">
                    <span className="text-[10px] text-white/60">{g.name}</span>
                    <span className="text-[9px] text-white/30">{g.entityIds.length} obj</span>
                  </div>
                ))}
              </Section>
            )}

            {/* Visibility controls */}
            {(hiddenEntityIds.length > 0 || isolatedEntityIds) && (
              <Section title="Visibility" icon={Eye} defaultOpen>
                {hiddenEntityIds.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40">{hiddenEntityIds.length} hidden</span>
                    <button onClick={() => dispatch({ type: 'SHOW_ALL' })} className="text-[9px] text-[#3B82F6] hover:underline">Show All</button>
                  </div>
                )}
                {isolatedEntityIds && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-white/40">{isolatedEntityIds.length} isolated</span>
                    <button onClick={() => dispatch({ type: 'SHOW_ALL' })} className="text-[9px] text-[#3B82F6] hover:underline">Exit Isolate</button>
                  </div>
                )}
              </Section>
            )}

            {/* Layer Manager */}
            <Section title="Layer Manager" icon={Layers}>
              {activeLayer && (
                <>
                  <Field label="Current">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded border border-white/20" style={{ backgroundColor: activeLayer.color }} />
                      <span className="text-[11px] text-white/80">{activeLayer.name}</span>
                    </div>
                  </Field>
                </>
              )}
              <button onClick={() => dispatch({ type: 'TOGGLE_LAYER_MANAGER' })}
                className="w-full mt-1 py-1 rounded text-[9px] text-[#3B82F6] bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 transition-all">
                Open Layer Manager
              </button>
              <div className="mt-1 space-y-0.5">
                {state.layers.map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => dispatch({ type: 'SET_ACTIVE_LAYER', payload: layer.id })}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1 rounded text-[10px] transition-all",
                      layer.id === state.activeLayerId ? "bg-white/10 text-white" : "text-white/50 hover:bg-white/[0.04]"
                    )}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layer.color }} />
                    {layer.name}
                    {!layer.visible && <EyeOff className="h-2.5 w-2.5 ml-auto text-white/20" />}
                  </button>
                ))}
              </div>
            </Section>

            {/* Statistics */}
            <Section title="Statistics" icon={BarChart3}>
              <Field label="Entities"><span className="text-[11px] font-mono text-white/80">{(state.entities || []).length}</span></Field>
              <Field label="Layers"><span className="text-[11px] font-mono text-white/80">{(state.layers || []).length}</span></Field>
              <Field label="Selected"><span className="text-[11px] font-mono text-[#3B82F6]">{(state.selectedIds || []).length}</span></Field>
              <Field label="3D Solids"><span className="text-[11px] font-mono text-white/80">{(state.entities || []).filter(e => ['wall', 'box3d', 'column', 'slab'].includes(e.type)).length}</span></Field>
              <Field label="2D Objects"><span className="text-[11px] font-mono text-white/80">{(state.entities || []).filter(e => ['line', 'circle', 'rectangle', 'polyline', 'polygon', 'ellipse', 'arc'].includes(e.type)).length}</span></Field>
            </Section>

            {/* Shortcuts */}
            <Section title="Shortcuts" icon={Keyboard}>
              <div className="text-[9px] text-white/40 space-y-1">
                {[
                  ['Tab', 'Cycle drawing plane'],
                  ['X/Y/Z', 'Toggle axis lock'],
                  ['Shift', 'Vertical constraint'],
                  ['Ctrl', 'Horizontal constraint'],
                  ['Space', 'Toggle free/plane'],
                  ['@x,y,z', 'Relative coords'],
                  ['/ or `', 'Focus command line'],
                  ['F3', 'Toggle Snap'],
                  ['F7', 'Toggle Grid'],
                  ['F8', 'Toggle Ortho'],
                ].map(([key, desc]) => (
                  <div key={key} className="flex items-center gap-2">
                    <kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[8px] text-white/50 font-mono min-w-[40px] text-center">{key}</kbd>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

/* ── Helper components ──────────────────────────── */
function Section({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon?: any; children: React.ReactNode; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center gap-1.5 w-full py-1.5 px-1 rounded hover:bg-white/[0.04] transition-colors">
        <ChevronDown className={cn("h-3 w-3 text-white/30 transition-transform", !isOpen && "-rotate-90")} />
        {Icon && <Icon className="h-3 w-3 text-white/30" />}
        <span className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">{title}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pl-2 pr-1 pb-2 space-y-1.5">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-white/40">{label}</span>
      {children}
    </div>
  );
}

function CoordField({ label, value }: { label: string; value: string | number }) {
  return (
    <Field label={label}>
      <span className="text-[11px] font-mono text-white/80">{typeof value === 'number' ? value.toFixed(2) : value}</span>
    </Field>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <Field label={label}>
      <span className="text-[11px] font-mono text-[#3B82F6]">{value}</span>
    </Field>
  );
}
