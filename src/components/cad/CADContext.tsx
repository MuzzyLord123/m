import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { CADState, CADAction, AnyCADEntity, CADTool, CADLayer, Point2D, Point3D, CADViewMode, CADView, DrawingPlane, AxisConstraint, SnapMode, UnitType, TransformOp, MATERIAL_PRESETS, BlockDefinition, CADGroup, DimensionStyle, CADScene, ConstructionGuide } from './cadTypes';
import { CADProjectData } from './CADFileOperations';
import { generateId } from './cadGeometry';
import { moveEntity, copyEntity, rotateEntity, scaleEntity, mirrorEntity, extrudeEntity, offsetEntity } from './cadTransforms';

const defaultLayer: CADLayer = {
  id: 'layer-0',
  name: '0',
  color: '#ffffff',
  lineType: 'solid',
  lineWeight: 1,
  visible: true,
  locked: false,
  frozen: false,
  transparency: 0,
};

const defaultDimStyle: DimensionStyle = {
  id: 'dim-standard',
  name: 'Standard',
  textHeight: 2.5,
  textColor: '#00ff00',
  arrowStyle: 'closed',
  arrowSize: 2,
  lineColor: '#00ff00',
  precision: 2,
  units: 'mm',
  showTolerance: false,
  tolerancePlus: 0,
  toleranceMinus: 0,
  fontFamily: 'monospace',
};

const initialState: CADState = {
  entities: [],
  layers: [
    defaultLayer,
    { ...defaultLayer, id: 'layer-dims', name: 'Dimensions', color: '#00ff00' },
    { ...defaultLayer, id: 'layer-text', name: 'Text', color: '#ffff00' },
    { ...defaultLayer, id: 'layer-construction', name: 'Construction', color: '#808080', lineType: 'dashed' },
  ],
  activeLayerId: 'layer-0',
  activeTool: 'select',
  viewMode: '3d',
  currentView: 'isometric',
  drawingPlane: 'free',
  axisConstraint: 'none',
  zoom: 1,
  panOffset: { x: 0, y: 0 },
  gridSize: 10,
  gridVisible: true,
  floorGridVisible: true,
  verticalGridVisible: false,
  snapEnabled: true,
  snapModes: ['endpoint', 'midpoint', 'center', 'intersection', 'perpendicular', 'vertex'],
  orthoMode: false,
  polarTracking: false,
  polarAngle: 45,
  units: 'mm',
  precision: 2,
  selectedIds: [],
  undoStack: [],
  redoStack: [],
  drawingInProgress: [],
  drawingInProgress3D: [],
  commandHistory: [],
  background: '#1a1a1a',
  propertiesPanelOpen: true,
  blockDefinitions: [],
  groups: [],
  dimensionStyles: [defaultDimStyle],
  activeDimStyleId: 'dim-standard',
  layerManagerOpen: false,
  blockLibraryOpen: false,
  hiddenEntityIds: [],
  scenes: [],
  constructionGuides: [],
  copyMode: false,
  sceneManagerOpen: false,
};

function cadReducer(state: CADState, action: CADAction): CADState {
  switch (action.type) {
    case 'SET_TOOL': {
      const tool = action.payload as CADTool;
      const isModifyTool = ['move', 'copy', 'rotate', 'scale', 'mirror', 'offset', 'extrude', 'array'].includes(tool);
      let transformOp: TransformOp | undefined;
      if (isModifyTool && state.selectedIds.length > 0) {
        transformOp = { type: tool as TransformOp['type'], phase: 'awaiting-base', entityIds: [...state.selectedIds] };
      } else if (isModifyTool) {
        transformOp = { type: tool as TransformOp['type'], phase: 'idle', entityIds: [] };
      }
      return { ...state, activeTool: tool, drawingInProgress: [], drawingInProgress3D: [], transformOp };
    }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload as CADViewMode };
    case 'SET_VIEW':
      return { ...state, currentView: action.payload as CADView };
    case 'SET_DRAWING_PLANE':
      return { ...state, drawingPlane: action.payload as DrawingPlane };
    case 'CYCLE_DRAWING_PLANE': {
      const planes: DrawingPlane[] = ['xy', 'xz', 'yz', 'free'];
      const idx = planes.indexOf(state.drawingPlane);
      return { ...state, drawingPlane: planes[(idx + 1) % planes.length] };
    }
    case 'SET_AXIS_CONSTRAINT':
      return { ...state, axisConstraint: action.payload as AxisConstraint };
    case 'SET_ZOOM':
      return { ...state, zoom: Math.max(0.1, Math.min(50, action.payload)) };
    case 'SET_PAN':
      return { ...state, panOffset: action.payload as Point2D };
    case 'TOGGLE_GRID':
      return { ...state, gridVisible: !state.gridVisible };
    case 'TOGGLE_FLOOR_GRID':
      return { ...state, floorGridVisible: !state.floorGridVisible };
    case 'TOGGLE_VERTICAL_GRID':
      return { ...state, verticalGridVisible: !state.verticalGridVisible };
    case 'SET_GRID_SIZE':
      return { ...state, gridSize: action.payload };
    case 'TOGGLE_SNAP':
      return { ...state, snapEnabled: !state.snapEnabled };
    case 'TOGGLE_ORTHO':
      return { ...state, orthoMode: !state.orthoMode };
    case 'TOGGLE_POLAR':
      return { ...state, polarTracking: !state.polarTracking };
    case 'SET_UNITS':
      return { ...state, units: action.payload as UnitType };
    case 'SET_PRECISION':
      return { ...state, precision: action.payload };
    case 'SET_PROPERTIES_PANEL':
      return { ...state, propertiesPanelOpen: action.payload as boolean };
    case 'SET_BACKGROUND':
      return { ...state, background: action.payload };
    case 'ADD_ENTITY': {
      const entity = action.payload as AnyCADEntity;
      return {
        ...state,
        entities: [...state.entities, entity],
        undoStack: [...state.undoStack, state.entities],
        redoStack: [],
        drawingInProgress: [],
        drawingInProgress3D: [],
      };
    }
    case 'UPDATE_ENTITY': {
      const { id, changes } = action.payload;
      return {
        ...state,
        entities: state.entities.map(e => e.id === id ? { ...e, ...changes } : e),
      };
    }
    case 'REPLACE_ENTITIES': {
      const replacements = action.payload as AnyCADEntity[];
      const replMap = new Map(replacements.map(r => [r.id, r]));
      return {
        ...state,
        entities: state.entities.map(e => replMap.get(e.id) || e),
        undoStack: [...state.undoStack, state.entities],
        redoStack: [],
        transformOp: undefined,
      };
    }
    case 'ADD_ENTITIES': {
      const newEnts = action.payload as AnyCADEntity[];
      return {
        ...state,
        entities: [...state.entities, ...newEnts],
        undoStack: [...state.undoStack, state.entities],
        redoStack: [],
        transformOp: undefined,
      };
    }
    case 'DELETE_SELECTED': {
      return {
        ...state,
        entities: state.entities.filter(e => !state.selectedIds.includes(e.id)),
        selectedIds: [],
        undoStack: [...state.undoStack, state.entities],
        redoStack: [],
        transformOp: undefined,
      };
    }
    case 'SELECT': {
      return { ...state, selectedIds: action.payload };
    }
    case 'TOGGLE_SELECT': {
      const id = action.payload as string;
      const has = state.selectedIds.includes(id);
      return { ...state, selectedIds: has ? state.selectedIds.filter(s => s !== id) : [...state.selectedIds, id] };
    }
    case 'SELECT_ALL': {
      return { ...state, selectedIds: state.entities.map(e => e.id) };
    }
    case 'DESELECT_ALL': {
      return { ...state, selectedIds: [], selectionBox: undefined };
    }
    case 'SET_SELECTION_BOX': {
      return { ...state, selectionBox: action.payload };
    }
    case 'FINISH_SELECTION_BOX': {
      const ids = action.payload as string[];
      return { ...state, selectedIds: ids, selectionBox: undefined };
    }

    /* ── Transform operations ──────────────────────────── */
    case 'SET_TRANSFORM_OP':
      return { ...state, transformOp: action.payload };
    case 'TRANSFORM_SET_BASE': {
      if (!state.transformOp) return state;
      return { ...state, transformOp: { ...state.transformOp, basePoint: action.payload as Point3D, phase: 'awaiting-target' } };
    }
    case 'TRANSFORM_EXECUTE': {
      if (!state.transformOp || !state.transformOp.basePoint) return state;
      const op = state.transformOp;
      const target = action.payload as Point3D;
      const affected = state.entities.filter(e => op.entityIds.includes(e.id));
      if (affected.length === 0) return { ...state, transformOp: undefined };

      const dx = target.x - op.basePoint.x;
      const dy = target.y - op.basePoint.y;
      const dz = target.z - op.basePoint.z;

      switch (op.type) {
        case 'move': {
          // If copy mode is active, copy instead of move
          if (state.copyMode) {
            const copies = affected.map(e => copyEntity(e, dx, dy, dz));
            return {
              ...state,
              entities: [...state.entities, ...copies],
              undoStack: [...state.undoStack, state.entities],
              redoStack: [],
              selectedIds: copies.map(c => c.id),
              transformOp: undefined,
              copyMode: false,
            };
          }
          const moved = affected.map(e => moveEntity(e, dx, dy, dz));
          const replMap = new Map(moved.map(m => [m.id, m]));
          return {
            ...state,
            entities: state.entities.map(e => replMap.get(e.id) || e),
            undoStack: [...state.undoStack, state.entities],
            redoStack: [],
            transformOp: undefined,
          };
        }
        case 'copy': {
          const copies = affected.map(e => copyEntity(e, dx, dy, dz));
          return {
            ...state,
            entities: [...state.entities, ...copies],
            undoStack: [...state.undoStack, state.entities],
            redoStack: [],
            selectedIds: copies.map(c => c.id),
            transformOp: undefined,
          };
        }
        case 'rotate': {
          const angle = Math.atan2(dz, dx) * 180 / Math.PI;
          const rotated = affected.map(e => rotateEntity(e, op.basePoint!, angle));
          const replMap = new Map(rotated.map(m => [m.id, m]));
          return {
            ...state,
            entities: state.entities.map(e => replMap.get(e.id) || e),
            undoStack: [...state.undoStack, state.entities],
            redoStack: [],
            transformOp: undefined,
          };
        }
        case 'scale': {
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const baseDist = Math.max(1, Math.sqrt(op.basePoint.x ** 2 + op.basePoint.y ** 2 + op.basePoint.z ** 2));
          const factor = Math.max(0.01, dist / Math.max(baseDist, 10));
          const scaled = affected.map(e => scaleEntity(e, op.basePoint!, factor));
          const replMap = new Map(scaled.map(m => [m.id, m]));
          return {
            ...state,
            entities: state.entities.map(e => replMap.get(e.id) || e),
            undoStack: [...state.undoStack, state.entities],
            redoStack: [],
            transformOp: undefined,
          };
        }
        case 'mirror': {
          const mirrored = affected.map(e => mirrorEntity(e, op.basePoint!, target));
          return {
            ...state,
            entities: [...state.entities, ...mirrored],
            undoStack: [...state.undoStack, state.entities],
            redoStack: [],
            selectedIds: mirrored.map(m => m.id),
            transformOp: undefined,
          };
        }
        case 'extrude': {
          const height = dy || dz || 10;
          const extruded: AnyCADEntity[] = [];
          affected.forEach(e => {
            const ext = extrudeEntity(e, height);
            if (ext) { extruded.push(ext); }
          });
          if (extruded.length === 0) return { ...state, transformOp: undefined };
          const replMap = new Map(extruded.map(e => [e.id, e]));
          return {
            ...state,
            entities: state.entities.map(e => replMap.get(e.id) || e),
            undoStack: [...state.undoStack, state.entities],
            redoStack: [],
            transformOp: undefined,
          };
        }
        case 'offset': {
          const dist = Math.sqrt(dx * dx + dz * dz) * Math.sign(dx || dz || 1);
          const offsets = affected.map(e => offsetEntity(e, dist)).filter(Boolean) as AnyCADEntity[];
          if (offsets.length === 0) return { ...state, transformOp: undefined };
          return {
            ...state,
            entities: [...state.entities, ...offsets],
            undoStack: [...state.undoStack, state.entities],
            redoStack: [],
            selectedIds: offsets.map(o => o.id),
            transformOp: undefined,
          };
        }
        default:
          return { ...state, transformOp: undefined };
      }
    }
    case 'TRANSFORM_CANCEL':
      return { ...state, transformOp: undefined, drawingInProgress3D: [] };

    case 'UNDO': {
      if (state.undoStack.length === 0) return state;
      const prev = state.undoStack[state.undoStack.length - 1];
      return {
        ...state,
        entities: prev,
        undoStack: state.undoStack.slice(0, -1),
        redoStack: [...state.redoStack, state.entities],
        selectedIds: [],
        transformOp: undefined,
      };
    }
    case 'REDO': {
      if (state.redoStack.length === 0) return state;
      const next = state.redoStack[state.redoStack.length - 1];
      return {
        ...state,
        entities: next,
        redoStack: state.redoStack.slice(0, -1),
        undoStack: [...state.undoStack, state.entities],
        selectedIds: [],
        transformOp: undefined,
      };
    }
    case 'ADD_DRAWING_POINT':
      return { ...state, drawingInProgress: [...state.drawingInProgress, action.payload] };
    case 'ADD_DRAWING_POINT_3D':
      return { ...state, drawingInProgress3D: [...state.drawingInProgress3D, action.payload] };
    case 'CLEAR_DRAWING':
      return { ...state, drawingInProgress: [], drawingInProgress3D: [], transformOp: undefined };
    case 'ADD_ENTITY_CONTINUE': {
      const contEntity = action.payload as AnyCADEntity;
      return {
        ...state,
        entities: [...state.entities, contEntity],
        undoStack: [...state.undoStack, state.entities],
        redoStack: [],
      };
    }
    case 'SET_DRAWING_3D':
      return { ...state, drawingInProgress3D: action.payload as Point3D[] };
    case 'SET_DRAWING_2D':
      return { ...state, drawingInProgress: action.payload as Point2D[] };
    case 'ADD_COMMAND':
      return { ...state, commandHistory: [...state.commandHistory.slice(-99), action.payload] };
    case 'ADD_LAYER': {
      const layer = action.payload as CADLayer;
      return { ...state, layers: [...state.layers, layer] };
    }
    case 'UPDATE_LAYER': {
      const { id, changes } = action.payload;
      return { ...state, layers: state.layers.map(l => l.id === id ? { ...l, ...changes } : l) };
    }
    case 'DELETE_LAYER': {
      if (state.layers.length <= 1) return state;
      return {
        ...state,
        layers: state.layers.filter(l => l.id !== action.payload),
        activeLayerId: state.activeLayerId === action.payload ? state.layers[0].id : state.activeLayerId,
      };
    }
    case 'SET_ACTIVE_LAYER':
      return { ...state, activeLayerId: action.payload };
    case 'SET_WORLD_POS':
      return { ...state, worldPos: action.payload };

    /* ── Layer Manager ──────────────────────────── */
    case 'TOGGLE_LAYER_MANAGER':
      return { ...state, layerManagerOpen: !state.layerManagerOpen };
    case 'SET_LAYER_MANAGER':
      return { ...state, layerManagerOpen: action.payload as boolean };

    /* ── Block system ──────────────────────────── */
    case 'ADD_BLOCK_DEFINITION': {
      const blockDef = action.payload as BlockDefinition;
      return { ...state, blockDefinitions: [...state.blockDefinitions, blockDef] };
    }
    case 'UPDATE_BLOCK_DEFINITION': {
      const { id, changes } = action.payload;
      return { ...state, blockDefinitions: state.blockDefinitions.map(b => b.id === id ? { ...b, ...changes } : b) };
    }
    case 'DELETE_BLOCK_DEFINITION': {
      return {
        ...state,
        blockDefinitions: state.blockDefinitions.filter(b => b.id !== action.payload),
        entities: state.entities.filter(e => !(e.type === 'block-ref' && e.data.blockId === action.payload)),
      };
    }
    case 'SET_BLOCK_EDITING':
      return { ...state, blockEditingId: action.payload || undefined };
    case 'TOGGLE_BLOCK_LIBRARY':
      return { ...state, blockLibraryOpen: !state.blockLibraryOpen };
    case 'SET_BLOCK_LIBRARY':
      return { ...state, blockLibraryOpen: action.payload as boolean };

    /* ── Groups ──────────────────────────── */
    case 'CREATE_GROUP': {
      const { name, entityIds } = action.payload as { name: string; entityIds: string[] };
      const groupId = generateId();
      return {
        ...state,
        groups: [...state.groups, { id: groupId, name, entityIds }],
        entities: state.entities.map(e => entityIds.includes(e.id) ? { ...e, groupId } : e),
      };
    }
    case 'DELETE_GROUP': {
      const gid = action.payload as string;
      return {
        ...state,
        groups: state.groups.filter(g => g.id !== gid),
        entities: state.entities.map(e => e.groupId === gid ? { ...e, groupId: undefined } : e),
      };
    }

    /* ── Hide / Isolate ──────────────────────────── */
    case 'HIDE_SELECTED':
      return { ...state, hiddenEntityIds: [...state.hiddenEntityIds, ...state.selectedIds], selectedIds: [] };
    case 'ISOLATE_SELECTED':
      return { ...state, isolatedEntityIds: [...state.selectedIds] };
    case 'SHOW_ALL':
      return { ...state, hiddenEntityIds: [], isolatedEntityIds: undefined };

    /* ── Scenes ──────────────────────────── */
    case 'ADD_SCENE': {
      const scene = action.payload as CADScene;
      return { ...state, scenes: [...state.scenes, scene] };
    }
    case 'UPDATE_SCENE': {
      const { id, changes } = action.payload;
      return { ...state, scenes: state.scenes.map(s => s.id === id ? { ...s, ...changes } : s) };
    }
    case 'DELETE_SCENE':
      return { ...state, scenes: state.scenes.filter(s => s.id !== action.payload) };
    case 'SET_SCENES':
      return { ...state, scenes: action.payload as CADScene[] };
    case 'TOGGLE_SCENE_MANAGER':
      return { ...state, sceneManagerOpen: !state.sceneManagerOpen };

    /* ── Construction guides ──────────────────────────── */
    case 'ADD_GUIDE': {
      const guide = action.payload as ConstructionGuide;
      return { ...state, constructionGuides: [...state.constructionGuides, guide] };
    }
    case 'CLEAR_GUIDES':
      return { ...state, constructionGuides: [] };

    /* ── Copy mode / Inference lock / Context menu ──────────────────────────── */
    case 'TOGGLE_COPY_MODE':
      return { ...state, copyMode: !state.copyMode };
    case 'SET_COPY_MODE':
      return { ...state, copyMode: action.payload as boolean };
    case 'SET_INFERENCE_LOCK':
      return { ...state, inferenceLockedAxis: action.payload };
    case 'SET_CONTEXT_MENU':
      return { ...state, contextMenu: action.payload };
    case 'CLOSE_CONTEXT_MENU':
      return { ...state, contextMenu: undefined };
    case 'ADD_DIM_STYLE': {
      const ds = action.payload as DimensionStyle;
      return { ...state, dimensionStyles: [...state.dimensionStyles, ds] };
    }
    case 'UPDATE_DIM_STYLE': {
      const { id, changes } = action.payload;
      return { ...state, dimensionStyles: state.dimensionStyles.map(ds => ds.id === id ? { ...ds, ...changes } : ds) };
    }
    case 'SET_ACTIVE_DIM_STYLE':
      return { ...state, activeDimStyleId: action.payload as string };

    case 'LOAD_PROJECT': {
      const projData = action.payload as CADProjectData;
      return {
        ...initialState,
        entities: projData.entities || [],
        layers: projData.layers || initialState.layers,
        activeLayerId: projData.activeLayerId || initialState.activeLayerId,
        units: projData.units || initialState.units,
        precision: projData.precision ?? initialState.precision,
        gridSize: projData.gridSize ?? initialState.gridSize,
        blockDefinitions: projData.blockDefinitions || [],
        groups: projData.groups || [],
        dimensionStyles: projData.dimensionStyles || initialState.dimensionStyles,
        activeDimStyleId: projData.activeDimStyleId || initialState.activeDimStyleId,
        background: projData.background || initialState.background,
      };
    }

    case 'CLEAR_ALL':
      return { ...initialState };
    default:
      return state;
  }
}

interface CADContextValue {
  state: CADState;
  dispatch: React.Dispatch<CADAction>;
  addEntity: (entity: AnyCADEntity) => void;
  executeCommand: (cmd: string) => void;
}

const CADCtx = createContext<CADContextValue | null>(null);

export function CADProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cadReducer, initialState);

  const addEntity = useCallback((entity: AnyCADEntity) => {
    dispatch({ type: 'ADD_ENTITY', payload: entity });
  }, []);

  const executeCommand = useCallback((cmd: string) => {
    const upper = cmd.trim().toUpperCase();
    dispatch({ type: 'ADD_COMMAND', payload: cmd });

    const toolMap: Record<string, CADTool> = {
      LINE: 'line', L: 'line',
      LINE3D: 'line3d', L3: 'line3d',
      POLYLINE: 'polyline', PL: 'polyline',
      CIRCLE: 'circle', C: 'circle',
      ARC: 'arc', A: 'arc',
      RECTANGLE: 'rectangle', REC: 'rectangle', RECT: 'rectangle',
      POLYGON: 'polygon', POL: 'polygon',
      ELLIPSE: 'ellipse', EL: 'ellipse',
      TEXT: 'text', T: 'text',
      DIMENSION: 'dimension', DIM: 'dimension',
      DIMLINEAR: 'dim-linear', DIMALIGNED: 'dim-aligned', DIMANGULAR: 'dim-angular',
      DIMRADIUS: 'dim-radial', DIMDIAMETER: 'dim-diameter', DIMORDINATE: 'dim-ordinate',
      LEADER: 'leader',
      WALL: 'wall', W: 'wall',
      WINDOW: 'window', WIN: 'window',
      DOOR: 'door', DR: 'door',
      SLAB: 'slab', SLB: 'slab',
      COLUMN: 'column', COL: 'column',
      BOX3D: 'box3d', BOX: 'box3d', B: 'box3d',
      SPHERE: 'sphere', SPH: 'sphere',
      CONE: 'cone',
      CYLINDER: 'cylinder', CYL: 'cylinder',
      TORUS: 'torus', TOR: 'torus',
      PYRAMID: 'pyramid', PYR: 'pyramid',
      STAIRS: 'stairs',
      MOVE: 'move', M: 'move',
      COPY: 'copy', CO: 'copy',
      ROTATE: 'rotate', RO: 'rotate',
      SCALE: 'scale', SC: 'scale',
      MIRROR: 'mirror', MI: 'mirror',
      OFFSET: 'offset', O: 'offset',
      TRIM: 'trim', TR: 'trim',
      EXTEND: 'extend', EX: 'extend',
      FILLET: 'fillet', F: 'fillet',
      CHAMFER: 'chamfer', CHA: 'chamfer',
      ARRAY: 'array', AR: 'array',
      EXPLODE: 'explode', X: 'explode',
      EXTRUDE: 'extrude', EXT: 'extrude',
      PUSHPULL: 'push-pull', PP: 'push-pull',
      REVOLVE: 'revolve',
      SELECT: 'select',
      PAN: 'pan',
      DIST: 'measure-distance',
      AREA: 'measure-area',
      BLOCK: 'block-create',
      INSERT: 'block-insert',
      GROUP: 'group', G: 'group',
      UNGROUP: 'ungroup', UG: 'ungroup',
      MATCHPROP: 'matchprop', MA: 'matchprop',
      ISOLATE: 'isolate',
      HIDEOBJ: 'hide-object',
      SHOWALL: 'show-all',
    };

    if (upper === 'UNDO' || upper === 'U') { dispatch({ type: 'UNDO' }); return; }
    if (upper === 'REDO') { dispatch({ type: 'REDO' }); return; }
    if (upper === 'ERASE' || upper === 'DELETE' || upper === 'DEL') { dispatch({ type: 'DELETE_SELECTED' }); return; }
    if (upper === 'GRID') { dispatch({ type: 'TOGGLE_GRID' }); return; }
    if (upper === 'SNAP') { dispatch({ type: 'TOGGLE_SNAP' }); return; }
    if (upper === 'ORTHO') { dispatch({ type: 'TOGGLE_ORTHO' }); return; }
    if (upper === 'POLAR') { dispatch({ type: 'TOGGLE_POLAR' }); return; }
    if (upper === 'LAYER' || upper === 'LA') { dispatch({ type: 'TOGGLE_LAYER_MANAGER' }); return; }
    if (upper === 'BLOCKLIBRARY' || upper === 'BL') { dispatch({ type: 'TOGGLE_BLOCK_LIBRARY' }); return; }
    if (upper === 'HIDEOBJ' || upper === 'HI') { dispatch({ type: 'HIDE_SELECTED' }); return; }
    if (upper === 'ISOLATE' || upper === 'ISO') { dispatch({ type: 'ISOLATE_SELECTED' }); return; }
    if (upper === 'SHOWALL' || upper === 'SA') { dispatch({ type: 'SHOW_ALL' }); return; }

    // Group creation shortcut
    if (upper === 'GROUP' || upper === 'G') {
      if (state.selectedIds.length > 1) {
        dispatch({ type: 'CREATE_GROUP', payload: { name: `Group ${state.groups.length + 1}`, entityIds: [...state.selectedIds] } });
        dispatch({ type: 'ADD_COMMAND', payload: `Group created with ${state.selectedIds.length} entities` });
        return;
      }
    }
    if (upper === 'UNGROUP' || upper === 'UG') {
      const groupIds = [...new Set(state.entities.filter(e => state.selectedIds.includes(e.id) && e.groupId).map(e => e.groupId!))];
      groupIds.forEach(gid => dispatch({ type: 'DELETE_GROUP', payload: gid }));
      return;
    }

    // Drawing plane commands
    if (upper === 'XY' || upper === 'FLOOR') { dispatch({ type: 'SET_DRAWING_PLANE', payload: 'xy' }); return; }
    if (upper === 'XZ' || upper === 'WALL') { dispatch({ type: 'SET_DRAWING_PLANE', payload: 'xz' }); return; }
    if (upper === 'YZ' || upper === 'SIDE') { dispatch({ type: 'SET_DRAWING_PLANE', payload: 'yz' }); return; }
    if (upper === 'FREE' || upper === '3D') { dispatch({ type: 'SET_DRAWING_PLANE', payload: 'free' }); return; }

    // 3D coordinate input: "10,20,30"
    const coordMatch = cmd.trim().match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const p: Point3D = { x: parseFloat(coordMatch[1]), y: parseFloat(coordMatch[2]), z: parseFloat(coordMatch[3]) };
      if (state.transformOp?.phase === 'awaiting-base') {
        dispatch({ type: 'TRANSFORM_SET_BASE', payload: p });
        return;
      }
      if (state.transformOp?.phase === 'awaiting-target') {
        dispatch({ type: 'TRANSFORM_EXECUTE', payload: p });
        return;
      }
      dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: p });
      return;
    }

    // Relative coordinate input: "@0,0,50"
    const relMatch = cmd.trim().match(/^@(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
    if (relMatch) {
      const rdx = parseFloat(relMatch[1]);
      const rdy = parseFloat(relMatch[2]);
      const rdz = parseFloat(relMatch[3]);
      if (state.transformOp?.phase === 'awaiting-target' && state.transformOp.basePoint) {
        const bp = state.transformOp.basePoint;
        dispatch({ type: 'TRANSFORM_EXECUTE', payload: { x: bp.x + rdx, y: bp.y + rdy, z: bp.z + rdz } });
        return;
      }
      const last = state.drawingInProgress3D.length > 0
        ? state.drawingInProgress3D[state.drawingInProgress3D.length - 1]
        : (state.worldPos || { x: 0, y: 0, z: 0 });
      dispatch({ type: 'ADD_DRAWING_POINT_3D', payload: { x: last.x + rdx, y: last.y + rdy, z: last.z + rdz } });
      return;
    }

    // Numeric input for scale/extrude/rotate value
    const numMatch = cmd.trim().match(/^(-?\d+\.?\d*)$/);
    if (numMatch && state.transformOp?.phase === 'awaiting-target' && state.transformOp.basePoint) {
      const val = parseFloat(numMatch[1]);
      const bp = state.transformOp.basePoint;
      if (state.transformOp.type === 'scale') {
        const affected = state.entities.filter(e => state.transformOp!.entityIds.includes(e.id));
        const scaled = affected.map(e => scaleEntity(e, bp, val));
        dispatch({ type: 'REPLACE_ENTITIES', payload: scaled });
        dispatch({ type: 'ADD_COMMAND', payload: `Scale factor: ${val}` });
        return;
      }
      if (state.transformOp.type === 'extrude') {
        const affected = state.entities.filter(e => state.transformOp!.entityIds.includes(e.id));
        const extruded = affected.map(e => extrudeEntity(e, val)).filter(Boolean) as AnyCADEntity[];
        if (extruded.length > 0) dispatch({ type: 'REPLACE_ENTITIES', payload: extruded });
        dispatch({ type: 'ADD_COMMAND', payload: `Extruded: ${val}` });
        return;
      }
      if (state.transformOp.type === 'rotate') {
        const affected = state.entities.filter(e => state.transformOp!.entityIds.includes(e.id));
        const rotated = affected.map(e => rotateEntity(e, bp, val));
        dispatch({ type: 'REPLACE_ENTITIES', payload: rotated });
        dispatch({ type: 'ADD_COMMAND', payload: `Rotate: ${val}°` });
        return;
      }
    }

    if (toolMap[upper]) {
      dispatch({ type: 'SET_TOOL', payload: toolMap[upper] });
    }
  }, [state.drawingInProgress3D, state.worldPos, state.transformOp, state.entities, state.selectedIds, state.groups]);

  return (
    <CADCtx.Provider value={{ state, dispatch, addEntity, executeCommand }}>
      {children}
    </CADCtx.Provider>
  );
}

export function useCAD() {
  const ctx = useContext(CADCtx);
  if (!ctx) throw new Error('useCAD must be used within CADProvider');
  return ctx;
}
