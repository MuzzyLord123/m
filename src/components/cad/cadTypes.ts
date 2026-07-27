export type CADTool = 
  | 'select' | 'pan' | 'zoom'
  | 'line' | 'line3d' | 'polyline' | 'circle' | 'arc' | 'rectangle' | 'polygon' | 'ellipse' | 'spline' | 'text' | 'hatch' | 'dimension'
  | 'dim-linear' | 'dim-aligned' | 'dim-angular' | 'dim-radial' | 'dim-diameter' | 'dim-ordinate' | 'leader'
  | 'wall' | 'column' | 'box3d' | 'window' | 'door' | 'slab' | 'roof'
  | 'sphere' | 'cone' | 'torus' | 'cylinder' | 'pyramid' | 'tube' | 'stairs'
  | 'move' | 'copy' | 'rotate' | 'scale' | 'mirror' | 'offset' | 'trim' | 'extend' | 'fillet' | 'chamfer' | 'array' | 'explode'
  | 'measure-distance' | 'measure-area' | 'measure-volume'
  | 'extrude' | 'push-pull' | 'revolve' | 'loft' | 'sweep' | 'boolean-union' | 'boolean-subtract' | 'boolean-intersect'
  | 'block-create' | 'block-insert' | 'group' | 'ungroup' | 'matchprop' | 'isolate' | 'hide-object' | 'show-all';

export type CADViewMode = '2d' | '3d';
export type CADView = 'top' | 'front' | 'side' | 'isometric' | 'perspective';
export type DrawingPlane = 'xy' | 'xz' | 'yz' | 'free';
export type AxisConstraint = 'none' | 'x' | 'y' | 'z';
export type SnapMode = 'endpoint' | 'midpoint' | 'center' | 'node' | 'quadrant' | 'intersection' | 'perpendicular' | 'tangent' | 'nearest' | 'vertex';
export type UnitType = 'mm' | 'cm' | 'm' | 'in' | 'ft' | 'arch';
export type LineType = 'solid' | 'dashed' | 'dotted' | 'centerline' | 'hidden' | 'phantom';
export type DimensionType = 'linear' | 'aligned' | 'angular' | 'radial' | 'diameter' | 'ordinate' | 'leader';

export type MaterialPreset = 
  | 'default' | 'brick-red' | 'brick-brown' | 'brick-white'
  | 'concrete' | 'concrete-smooth' | 'concrete-rough'
  | 'glass' | 'glass-tinted' | 'glass-frosted'
  | 'wood-oak' | 'wood-walnut' | 'wood-pine' | 'wood-cherry'
  | 'metal-steel' | 'metal-copper' | 'metal-gold' | 'metal-aluminium'
  | 'marble-white' | 'marble-black' | 'marble-carrara'
  | 'stone-grey' | 'stone-sandstone' | 'stone-slate'
  | 'tile-ceramic' | 'tile-terracotta'
  | 'plaster-white' | 'plaster-cream'
  | 'paint-white' | 'paint-custom';

export interface CADMaterial {
  preset: MaterialPreset;
  color: string;
  opacity: number;
  metalness: number;
  roughness: number;
  emissive?: string;
  emissiveIntensity?: number;
}

export const MATERIAL_PRESETS: Record<MaterialPreset, CADMaterial> = {
  'default': { preset: 'default', color: '#cccccc', opacity: 1, metalness: 0.1, roughness: 0.6 },
  'brick-red': { preset: 'brick-red', color: '#8B4513', opacity: 1, metalness: 0, roughness: 0.95 },
  'brick-brown': { preset: 'brick-brown', color: '#6B3410', opacity: 1, metalness: 0, roughness: 0.95 },
  'brick-white': { preset: 'brick-white', color: '#E8DCC8', opacity: 1, metalness: 0, roughness: 0.9 },
  'concrete': { preset: 'concrete', color: '#808080', opacity: 1, metalness: 0, roughness: 0.85 },
  'concrete-smooth': { preset: 'concrete-smooth', color: '#A0A0A0', opacity: 1, metalness: 0.05, roughness: 0.5 },
  'concrete-rough': { preset: 'concrete-rough', color: '#696969', opacity: 1, metalness: 0, roughness: 1.0 },
  'glass': { preset: 'glass', color: '#88CCEE', opacity: 0.3, metalness: 0.9, roughness: 0.05, emissive: '#88CCEE', emissiveIntensity: 0.1 },
  'glass-tinted': { preset: 'glass-tinted', color: '#336688', opacity: 0.4, metalness: 0.9, roughness: 0.05, emissive: '#224466', emissiveIntensity: 0.08 },
  'glass-frosted': { preset: 'glass-frosted', color: '#DDEEFF', opacity: 0.5, metalness: 0.5, roughness: 0.4 },
  'wood-oak': { preset: 'wood-oak', color: '#C19A6B', opacity: 1, metalness: 0, roughness: 0.7 },
  'wood-walnut': { preset: 'wood-walnut', color: '#5C4033', opacity: 1, metalness: 0, roughness: 0.65 },
  'wood-pine': { preset: 'wood-pine', color: '#DEB887', opacity: 1, metalness: 0, roughness: 0.75 },
  'wood-cherry': { preset: 'wood-cherry', color: '#9B111E', opacity: 1, metalness: 0.05, roughness: 0.6 },
  'metal-steel': { preset: 'metal-steel', color: '#B0B0B0', opacity: 1, metalness: 0.95, roughness: 0.15 },
  'metal-copper': { preset: 'metal-copper', color: '#B87333', opacity: 1, metalness: 0.9, roughness: 0.2 },
  'metal-gold': { preset: 'metal-gold', color: '#FFD700', opacity: 1, metalness: 0.95, roughness: 0.1 },
  'metal-aluminium': { preset: 'metal-aluminium', color: '#D4D4D4', opacity: 1, metalness: 0.85, roughness: 0.25 },
  'marble-white': { preset: 'marble-white', color: '#F5F5F0', opacity: 1, metalness: 0.1, roughness: 0.3 },
  'marble-black': { preset: 'marble-black', color: '#1A1A1A', opacity: 1, metalness: 0.15, roughness: 0.25 },
  'marble-carrara': { preset: 'marble-carrara', color: '#EDEAE0', opacity: 1, metalness: 0.1, roughness: 0.28 },
  'stone-grey': { preset: 'stone-grey', color: '#7A7A7A', opacity: 1, metalness: 0, roughness: 0.9 },
  'stone-sandstone': { preset: 'stone-sandstone', color: '#D2B48C', opacity: 1, metalness: 0, roughness: 0.88 },
  'stone-slate': { preset: 'stone-slate', color: '#4A5568', opacity: 1, metalness: 0.05, roughness: 0.82 },
  'tile-ceramic': { preset: 'tile-ceramic', color: '#F0EAD6', opacity: 1, metalness: 0.2, roughness: 0.3 },
  'tile-terracotta': { preset: 'tile-terracotta', color: '#CB6D51', opacity: 1, metalness: 0, roughness: 0.8 },
  'plaster-white': { preset: 'plaster-white', color: '#F8F8F8', opacity: 1, metalness: 0, roughness: 0.9 },
  'plaster-cream': { preset: 'plaster-cream', color: '#FFFDD0', opacity: 1, metalness: 0, roughness: 0.85 },
  'paint-white': { preset: 'paint-white', color: '#FFFFFF', opacity: 1, metalness: 0.05, roughness: 0.4 },
  'paint-custom': { preset: 'paint-custom', color: '#4A90D9', opacity: 1, metalness: 0.05, roughness: 0.4 },
};

export interface Point2D { x: number; y: number; }
export interface Point3D { x: number; y: number; z: number; }

export interface CADLayer {
  id: string;
  name: string;
  color: string;
  lineType: LineType;
  lineWeight: number;
  visible: boolean;
  locked: boolean;
  frozen: boolean;
  transparency: number;
}

export interface CADEntity {
  id: string;
  type: string;
  layerId: string;
  color?: string;
  lineType?: LineType;
  lineWeight?: number;
  selected?: boolean;
  locked?: boolean;
  material?: CADMaterial;
  groupId?: string;
  hidden?: boolean;
  drawPlane?: 'xz' | 'xy' | 'yz';
  data: Record<string, any>;
}

export interface LineEntity extends CADEntity {
  type: 'line';
  data: { start: Point2D; end: Point2D; };
}

export interface Line3DEntity extends CADEntity {
  type: 'line3d';
  data: { start: Point3D; end: Point3D; };
}

export interface CircleEntity extends CADEntity {
  type: 'circle';
  data: { center: Point2D; radius: number; };
}

export interface RectEntity extends CADEntity {
  type: 'rectangle';
  data: { origin: Point2D; width: number; height: number; rotation?: number; extrude?: number; };
}

export interface ArcEntity extends CADEntity {
  type: 'arc';
  data: { center: Point2D; radius: number; startAngle: number; endAngle: number; };
}

export interface PolylineEntity extends CADEntity {
  type: 'polyline';
  data: { points: Point2D[]; closed: boolean; filled?: boolean; };
}

export interface PolygonEntity extends CADEntity {
  type: 'polygon';
  data: { center: Point2D; radius: number; sides: number; inscribed: boolean; rotation?: number; };
}

export interface EllipseEntity extends CADEntity {
  type: 'ellipse';
  data: { center: Point2D; radiusX: number; radiusY: number; rotation?: number; };
}

export interface TextEntity extends CADEntity {
  type: 'text';
  data: { position: Point2D; content: string; fontSize: number; fontFamily: string; rotation?: number; bold?: boolean; italic?: boolean; };
}

export interface DimensionEntity extends CADEntity {
  type: 'dimension';
  data: {
    start: Point2D; end: Point2D; offset: number; text?: string;
    dimType: DimensionType;
    // Angular: third point or reference lines
    thirdPoint?: Point2D;
    // Radial/Diameter: center + radius
    center?: Point2D; radius?: number;
    // Ordinate: measured point + base
    measurePoint?: Point2D; basePoint?: Point2D; axis?: 'x' | 'y';
    // Leader: vertices + note
    leaderPoints?: Point2D[]; note?: string;
    // Style
    arrowSize?: number; textHeight?: number; precision?: number;
    showTolerance?: boolean; tolerancePlus?: number; toleranceMinus?: number;
  };
}

export interface BlockRefEntity extends CADEntity {
  type: 'block-ref';
  data: { blockId: string; insertPoint: Point3D; scaleX: number; scaleY: number; scaleZ: number; rotation: number; attributes?: Record<string, string>; };
}

export interface WallEntity extends CADEntity {
  type: 'wall';
  data: { base: Point3D; width: number; depth: number; height: number; };
}

export interface Box3DEntity extends CADEntity {
  type: 'box3d';
  data: { origin: Point3D; width: number; depth: number; height: number; };
}

export interface ColumnEntity extends CADEntity {
  type: 'column';
  data: { base: Point3D; radius: number; height: number; };
}

export interface WindowEntity extends CADEntity {
  type: 'window';
  data: { base: Point3D; width: number; height: number; depth: number; };
}

export interface DoorEntity extends CADEntity {
  type: 'door';
  data: { base: Point3D; width: number; height: number; depth: number; };
}

export interface SlabEntity extends CADEntity {
  type: 'slab';
  data: { origin: Point3D; width: number; depth: number; thickness: number; };
}

export interface SphereEntity extends CADEntity {
  type: 'sphere';
  data: { center: Point3D; radius: number; };
}

export interface ConeEntity extends CADEntity {
  type: 'cone';
  data: { base: Point3D; radius: number; height: number; topRadius?: number; };
}

export interface TorusEntity extends CADEntity {
  type: 'torus';
  data: { center: Point3D; majorRadius: number; minorRadius: number; };
}

export interface CylinderEntity extends CADEntity {
  type: 'cylinder';
  data: { base: Point3D; radius: number; height: number; };
}

export interface PyramidEntity extends CADEntity {
  type: 'pyramid';
  data: { base: Point3D; baseSize: number; height: number; sides: number; };
}

export interface TubeEntity extends CADEntity {
  type: 'tube';
  data: { path: Point3D[]; radius: number; };
}

export interface StairsEntity extends CADEntity {
  type: 'stairs';
  data: { base: Point3D; width: number; stepCount: number; stepHeight: number; stepDepth: number; };
}

export type AnyCADEntity = LineEntity | Line3DEntity | CircleEntity | RectEntity | ArcEntity | PolylineEntity | PolygonEntity | EllipseEntity | TextEntity | DimensionEntity | BlockRefEntity | WallEntity | Box3DEntity | ColumnEntity | WindowEntity | DoorEntity | SlabEntity | SphereEntity | ConeEntity | TorusEntity | CylinderEntity | PyramidEntity | TubeEntity | StairsEntity;

/* ── Block definitions ─────────────────────────── */
export interface BlockDefinition {
  id: string;
  name: string;
  description?: string;
  basePoint: Point3D;
  entities: AnyCADEntity[];
  createdAt: number;
}

/* ── Group definitions ─────────────────────────── */
export interface CADGroup {
  id: string;
  name: string;
  entityIds: string[];
}

/* ── Dimension style ─────────────────────────── */
export interface DimensionStyle {
  id: string;
  name: string;
  textHeight: number;
  textColor: string;
  arrowStyle: 'closed' | 'open' | 'dot' | 'tick';
  arrowSize: number;
  lineColor: string;
  precision: number;
  units: UnitType;
  showTolerance: boolean;
  tolerancePlus: number;
  toleranceMinus: number;
  fontFamily: string;
}

/* ── Transform operation state ─────────────────────────── */
export type TransformPhase = 'idle' | 'awaiting-base' | 'awaiting-target' | 'awaiting-value';
export interface TransformOp {
  type: 'move' | 'copy' | 'rotate' | 'scale' | 'mirror' | 'offset' | 'extrude' | 'array';
  phase: TransformPhase;
  basePoint?: Point3D;
  entityIds: string[];
  value?: number;
  mirrorAxis?: 'x' | 'y' | 'z';
  arrayConfig?: { type: 'rectangular' | 'polar'; rows: number; cols: number; levels: number; spacingX: number; spacingY: number; spacingZ: number; centerAngle?: number; };
}

export interface CADState {
  entities: AnyCADEntity[];
  layers: CADLayer[];
  activeLayerId: string;
  activeTool: CADTool;
  viewMode: CADViewMode;
  currentView: CADView;
  drawingPlane: DrawingPlane;
  axisConstraint: AxisConstraint;
  zoom: number;
  panOffset: Point2D;
  gridSize: number;
  gridVisible: boolean;
  floorGridVisible: boolean;
  verticalGridVisible: boolean;
  snapEnabled: boolean;
  snapModes: SnapMode[];
  orthoMode: boolean;
  polarTracking: boolean;
  polarAngle: number;
  units: UnitType;
  precision: number;
  selectedIds: string[];
  undoStack: AnyCADEntity[][];
  redoStack: AnyCADEntity[][];
  drawingInProgress: Point2D[];
  drawingInProgress3D: Point3D[];
  commandHistory: string[];
  background: string;
  worldPos?: Point3D;
  transformOp?: TransformOp;
  selectionBox?: { startScreen: Point2D; endScreen: Point2D; mode: 'window' | 'crossing'; };
  propertiesPanelOpen: boolean;
  // Blocks
  blockDefinitions: BlockDefinition[];
  blockEditingId?: string; // non-null = in block edit mode
  // Groups
  groups: CADGroup[];
  // Dimension style
  dimensionStyles: DimensionStyle[];
  activeDimStyleId: string;
  // Layer manager modal
  layerManagerOpen: boolean;
  // Block library panel
  blockLibraryOpen: boolean;
  // Isolate state
  isolatedEntityIds?: string[];
  hiddenEntityIds: string[];
  // Scenes (saved views)
  scenes: CADScene[];
  // Construction guides
  constructionGuides: ConstructionGuide[];
  // Copy mode toggle (Ctrl during move)
  copyMode: boolean;
  // Inference lock
  inferenceLockedAxis?: 'x' | 'y' | 'z';
  // Scene manager panel
  sceneManagerOpen: boolean;
  // Context menu
  contextMenu?: { x: number; y: number; entityId?: string };
}

/* ── Scene (saved view) ─────────────────────────── */
export interface CADScene {
  id: string;
  name: string;
  cameraRadius: number;
  cameraPhi: number;
  cameraTheta: number;
  cameraTarget: Point3D;
  layerVisibility: Record<string, boolean>;
  timestamp: number;
}

/* ── Construction guide ─────────────────────────── */
export interface ConstructionGuide {
  id: string;
  type: 'line' | 'point';
  start: Point3D;
  end: Point3D;
  label?: string;
}

export interface CADAction {
  type: string;
  payload?: any;
}

export type { };
