import { useCAD } from './CADContext';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatCoord } from './cadGeometry';
import { Settings2, Layers, Box, Ruler } from 'lucide-react';

export function CADPropertiesPanel() {
  const { state, dispatch } = useCAD();

  const selectedEntities = state.entities.filter(e => state.selectedIds.includes(e.id));
  const single = selectedEntities.length === 1 ? selectedEntities[0] : null;
  const activeLayer = state.layers.find(l => l.id === state.activeLayerId);

  return (
    <div className="w-56 bg-card border-l border-border flex flex-col flex-shrink-0">
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
          <Settings2 className="h-3 w-3" /> Properties
        </h3>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* No selection - show drawing settings */}
          {!single && (
            <>
              <Section title="Drawing Settings" icon={<Settings2 className="h-3 w-3" />}>
                <Field label="Units">
                  <Select value={state.units} onValueChange={v => dispatch({ type: 'SET_UNITS', payload: v })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">Millimeters</SelectItem>
                      <SelectItem value="cm">Centimeters</SelectItem>
                      <SelectItem value="m">Meters</SelectItem>
                      <SelectItem value="in">Inches</SelectItem>
                      <SelectItem value="ft">Feet</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Grid Size">
                  <Input
                    type="number"
                    className="h-7 text-xs"
                    value={state.gridSize}
                    onChange={e => dispatch({ type: 'SET_GRID_SIZE', payload: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Snap">
                  <Switch checked={state.snapEnabled} onCheckedChange={() => dispatch({ type: 'TOGGLE_SNAP' })} />
                </Field>
                <Field label="Grid">
                  <Switch checked={state.gridVisible} onCheckedChange={() => dispatch({ type: 'TOGGLE_GRID' })} />
                </Field>
                <Field label="Ortho">
                  <Switch checked={state.orthoMode} onCheckedChange={() => dispatch({ type: 'TOGGLE_ORTHO' })} />
                </Field>
                <Field label="Background">
                  <Select value={state.background} onValueChange={v => dispatch({ type: 'SET_BACKGROUND', payload: v })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="#1a1a1a">Dark</SelectItem>
                      <SelectItem value="#ffffff">White</SelectItem>
                      <SelectItem value="#1a2744">Blueprint</SelectItem>
                      <SelectItem value="#0a0a0a">Black</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </Section>

              <Section title="Active Layer" icon={<Layers className="h-3 w-3" />}>
                {activeLayer && (
                  <>
                    <Field label="Name">
                      <span className="text-xs text-foreground">{activeLayer.name}</span>
                    </Field>
                    <Field label="Color">
                      <div className="flex items-center gap-1.5">
                        <span className="h-4 w-4 rounded border border-border" style={{ backgroundColor: activeLayer.color }} />
                        <span className="text-xs text-muted-foreground">{activeLayer.color}</span>
                      </div>
                    </Field>
                    <Field label="Line Type">
                      <span className="text-xs text-foreground capitalize">{activeLayer.lineType}</span>
                    </Field>
                  </>
                )}
              </Section>

              <Section title="Statistics" icon={<Box className="h-3 w-3" />}>
                <Field label="Entities">
                  <span className="text-xs font-mono text-foreground">{state.entities.length}</span>
                </Field>
                <Field label="Layers">
                  <span className="text-xs font-mono text-foreground">{state.layers.length}</span>
                </Field>
                <Field label="Selected">
                  <span className="text-xs font-mono text-foreground">{state.selectedIds.length}</span>
                </Field>
              </Section>
            </>
          )}

          {/* Single selection */}
          {single && (
            <>
              <Section title={`${single.type.charAt(0).toUpperCase() + single.type.slice(1)} Properties`} icon={<Ruler className="h-3 w-3" />}>
                <Field label="Type">
                  <span className="text-xs font-mono text-foreground capitalize">{single.type}</span>
                </Field>
                <Field label="Layer">
                  <span className="text-xs text-foreground">{state.layers.find(l => l.id === single.layerId)?.name}</span>
                </Field>
                <Field label="ID">
                  <span className="text-[9px] font-mono text-muted-foreground truncate">{single.id}</span>
                </Field>

                {single.type === 'line' && (
                  <>
                    <Field label="Start X"><span className="text-xs font-mono">{formatCoord(single.data.start.x, state.precision)}</span></Field>
                    <Field label="Start Y"><span className="text-xs font-mono">{formatCoord(single.data.start.y, state.precision)}</span></Field>
                    <Field label="End X"><span className="text-xs font-mono">{formatCoord(single.data.end.x, state.precision)}</span></Field>
                    <Field label="End Y"><span className="text-xs font-mono">{formatCoord(single.data.end.y, state.precision)}</span></Field>
                    <Field label="Length">
                      <span className="text-xs font-mono text-primary">
                        {formatCoord(
                          Math.sqrt((single.data.end.x - single.data.start.x) ** 2 + (single.data.end.y - single.data.start.y) ** 2),
                          state.precision
                        )}
                      </span>
                    </Field>
                  </>
                )}

                {single.type === 'circle' && (
                  <>
                    <Field label="Center X"><span className="text-xs font-mono">{formatCoord(single.data.center.x, state.precision)}</span></Field>
                    <Field label="Center Y"><span className="text-xs font-mono">{formatCoord(single.data.center.y, state.precision)}</span></Field>
                    <Field label="Radius"><span className="text-xs font-mono text-primary">{formatCoord(single.data.radius, state.precision)}</span></Field>
                    <Field label="Diameter"><span className="text-xs font-mono">{formatCoord(single.data.radius * 2, state.precision)}</span></Field>
                    <Field label="Area"><span className="text-xs font-mono">{formatCoord(Math.PI * single.data.radius ** 2, state.precision)}</span></Field>
                  </>
                )}

                {single.type === 'rectangle' && (
                  <>
                    <Field label="Origin X"><span className="text-xs font-mono">{formatCoord(single.data.origin.x, state.precision)}</span></Field>
                    <Field label="Origin Y"><span className="text-xs font-mono">{formatCoord(single.data.origin.y, state.precision)}</span></Field>
                    <Field label="Width"><span className="text-xs font-mono text-primary">{formatCoord(single.data.width, state.precision)}</span></Field>
                    <Field label="Height"><span className="text-xs font-mono text-primary">{formatCoord(single.data.height, state.precision)}</span></Field>
                    <Field label="Area"><span className="text-xs font-mono">{formatCoord(single.data.width * single.data.height, state.precision)}</span></Field>
                  </>
                )}

                {single.type === 'text' && (
                  <>
                    <Field label="Content"><span className="text-xs font-mono truncate">{single.data.content}</span></Field>
                    <Field label="Font Size"><span className="text-xs font-mono">{single.data.fontSize}</span></Field>
                  </>
                )}
              </Section>
            </>
          )}

          {/* Multiple selection */}
          {selectedEntities.length > 1 && (
            <Section title="Multiple Selection" icon={<Box className="h-3 w-3" />}>
              <Field label="Count">
                <span className="text-xs font-mono text-primary">{selectedEntities.length} objects</span>
              </Field>
              <Field label="Types">
                <span className="text-xs text-muted-foreground">
                  {[...new Set(selectedEntities.map(e => e.type))].join(', ')}
                </span>
              </Field>
            </Section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{title}</span>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
