/**
 * SketchUp-Style 3D Engine — Enterprise Grade
 * Push-pull, face detection, inference system, component instances
 * Enhanced: edge-relative inference, Shift-lock, construction guides
 */
import * as THREE from 'three';
import { AnyCADEntity, Point3D, CADMaterial, MATERIAL_PRESETS } from '../cadTypes';
import { generateId } from '../cadGeometry';

/* ── Face Detection ─────────────────────────────── */
export interface DetectedFace {
  entityId: string;
  faceIndex: number;
  normal: THREE.Vector3;
  center: THREE.Vector3;
  vertices: THREE.Vector3[];
  area: number;
}

export function detectFaceAtRaycast(
  raycaster: THREE.Raycaster,
  entitiesGroup: THREE.Group
): DetectedFace | null {
  const intersects = raycaster.intersectObjects(entitiesGroup.children, true);
  if (intersects.length === 0) return null;

  const hit = intersects[0];
  if (!hit.face) return null;

  let obj = hit.object;
  while (obj.parent && obj.parent !== entitiesGroup) obj = obj.parent as THREE.Object3D;
  const entityId = obj.userData.entityId;
  if (!entityId) return null;

  const normal = hit.face.normal.clone();
  if (hit.object instanceof THREE.Mesh) {
    normal.applyMatrix3(new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld));
  }
  normal.normalize();

  return {
    entityId,
    faceIndex: hit.faceIndex || 0,
    normal,
    center: hit.point.clone(),
    vertices: [],
    area: 0,
  };
}

/* ── Push-Pull Operation ─────────────────────────── */
export interface PushPullState {
  face: DetectedFace;
  startPoint: THREE.Vector3;
  originalEntity: AnyCADEntity;
  lastDistance: number;
}

export function executePushPull(
  entity: AnyCADEntity,
  face: DetectedFace,
  distance: number
): AnyCADEntity | null {
  const clone = JSON.parse(JSON.stringify(entity)) as AnyCADEntity;
  const d = clone.data as any;
  const normal = face.normal;

  const absX = Math.abs(normal.x);
  const absY = Math.abs(normal.y);
  const absZ = Math.abs(normal.z);
  const sign = normal.x + normal.y + normal.z > 0 ? 1 : -1;

  switch (entity.type) {
    case 'box3d': {
      if (absY > absX && absY > absZ) {
        if (normal.y > 0) d.height += distance;
        else { d.origin.y -= distance; d.height += distance; }
      } else if (absX > absZ) {
        if (normal.x > 0) d.width += distance;
        else { d.origin.x -= distance; d.width += distance; }
      } else {
        if (normal.z > 0) d.depth += distance;
        else { d.origin.z -= distance; d.depth += distance; }
      }
      d.width = Math.max(0.1, d.width);
      d.height = Math.max(0.1, d.height);
      d.depth = Math.max(0.1, d.depth);
      return clone;
    }
    case 'wall': {
      if (absY > absX && absY > absZ) {
        d.height += distance * sign;
        d.height = Math.max(0.1, d.height);
      } else if (absX > absZ) {
        d.width += distance * sign;
        d.width = Math.max(0.1, d.width);
      } else {
        d.depth += distance * sign;
        d.depth = Math.max(0.1, d.depth);
      }
      return clone;
    }
    case 'slab': {
      if (absY > absX && absY > absZ) {
        d.thickness += distance * sign;
        d.thickness = Math.max(0.1, d.thickness);
      } else if (absX > absZ) {
        d.width += distance * sign;
        d.width = Math.max(0.1, d.width);
      } else {
        d.depth += distance * sign;
        d.depth = Math.max(0.1, d.depth);
      }
      return clone;
    }
    case 'cylinder':
    case 'column': {
      if (absY > absX && absY > absZ) {
        d.height += distance * sign;
        d.height = Math.max(0.1, d.height);
      } else {
        d.radius += distance * 0.5;
        d.radius = Math.max(0.1, d.radius);
      }
      return clone;
    }
    case 'rectangle': {
      return {
        id: entity.id,
        type: 'box3d',
        layerId: entity.layerId,
        material: entity.material,
        data: {
          origin: { x: d.origin.x, y: 0, z: d.origin.y },
          width: d.width,
          depth: d.height,
          height: Math.abs(distance),
        },
      } as AnyCADEntity;
    }
    case 'circle': {
      return {
        id: entity.id,
        type: 'cylinder',
        layerId: entity.layerId,
        material: entity.material,
        data: {
          base: { x: d.center.x, y: 0, z: d.center.y },
          radius: d.radius,
          height: Math.abs(distance),
        },
      } as AnyCADEntity;
    }
    default:
      return null;
  }
}

/* ── Edge Extraction for Inference ─────────────────── */
export interface EntityEdge {
  start: Point3D;
  end: Point3D;
  entityId: string;
}

/** Extract all edges from an entity for inference computation */
export function extractEntityEdges(entity: AnyCADEntity): EntityEdge[] {
  const edges: EntityEdge[] = [];
  const d = entity.data as any;
  const id = entity.id;

  switch (entity.type) {
    case 'line3d': {
      edges.push({ start: d.start, end: d.end, entityId: id });
      break;
    }
    case 'line': {
      edges.push({ start: { x: d.start.x, y: 0, z: d.start.y }, end: { x: d.end.x, y: 0, z: d.end.y }, entityId: id });
      break;
    }
    case 'wall': case 'box3d': {
      const b = d.base || d.origin;
      const w = d.width, dp = d.depth, h = d.height;
      const corners = [
        { x: b.x, y: b.y, z: b.z }, { x: b.x + w, y: b.y, z: b.z },
        { x: b.x + w, y: b.y, z: b.z + dp }, { x: b.x, y: b.y, z: b.z + dp },
        { x: b.x, y: b.y + h, z: b.z }, { x: b.x + w, y: b.y + h, z: b.z },
        { x: b.x + w, y: b.y + h, z: b.z + dp }, { x: b.x, y: b.y + h, z: b.z + dp },
      ];
      const edgeIndices = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      edgeIndices.forEach(([a, b]) => edges.push({ start: corners[a], end: corners[b], entityId: id }));
      break;
    }
    case 'slab': {
      const o = d.origin;
      const w = d.width, dp = d.depth, t = d.thickness;
      const corners = [
        { x: o.x, y: o.y, z: o.z }, { x: o.x + w, y: o.y, z: o.z },
        { x: o.x + w, y: o.y, z: o.z + dp }, { x: o.x, y: o.y, z: o.z + dp },
        { x: o.x, y: o.y + t, z: o.z }, { x: o.x + w, y: o.y + t, z: o.z },
        { x: o.x + w, y: o.y + t, z: o.z + dp }, { x: o.x, y: o.y + t, z: o.z + dp },
      ];
      const edgeIndices = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      edgeIndices.forEach(([a, b]) => edges.push({ start: corners[a], end: corners[b], entityId: id }));
      break;
    }
    case 'rectangle': {
      const o = d.origin;
      const corners = [
        { x: o.x, y: 0, z: o.y }, { x: o.x + d.width, y: 0, z: o.y },
        { x: o.x + d.width, y: 0, z: o.y + d.height }, { x: o.x, y: 0, z: o.y + d.height },
      ];
      for (let i = 0; i < 4; i++) edges.push({ start: corners[i], end: corners[(i + 1) % 4], entityId: id });
      break;
    }
  }
  return edges;
}

/* ── Inference System (Enhanced) ─────────────────────────────── */
export interface InferenceGuide {
  type: 'axis' | 'parallel' | 'perpendicular' | 'onFace' | 'onEdge' | 'fromPoint' | 'locked';
  axis?: 'x' | 'y' | 'z';
  color: string;
  from: THREE.Vector3;
  to: THREE.Vector3;
  label?: string;
  strength?: number; // 0-1, used for rendering priority
}

export function computeInferences(
  cursorWorld: Point3D,
  referencePoint: Point3D | null,
  entities: AnyCADEntity[],
  lockedAxis?: 'x' | 'y' | 'z' | null
): InferenceGuide[] {
  const guides: InferenceGuide[] = [];
  if (!referencePoint) return guides;

  const dx = cursorWorld.x - referencePoint.x;
  const dy = cursorWorld.y - referencePoint.y;
  const dz = cursorWorld.z - referencePoint.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const threshold = Math.max(0.5, dist * 0.02);

  // Shift-locked axis guide (solid, bright)
  if (lockedAxis) {
    const axisColors: Record<string, string> = { x: '#ff4444', y: '#4444ff', z: '#44ff44' };
    guides.push({
      type: 'locked', axis: lockedAxis, color: axisColors[lockedAxis] || '#ffffff',
      from: new THREE.Vector3(referencePoint.x, referencePoint.y, referencePoint.z),
      to: new THREE.Vector3(cursorWorld.x, cursorWorld.y, cursorWorld.z),
      label: `Locked: ${lockedAxis.toUpperCase()} Axis`,
      strength: 1,
    });
    return guides; // When locked, only show the locked guide
  }

  // X-axis alignment (Red)
  if (Math.abs(dy) < threshold && Math.abs(dz) < threshold && Math.abs(dx) > 0.1) {
    guides.push({
      type: 'axis', axis: 'x', color: '#ff0000',
      from: new THREE.Vector3(referencePoint.x, referencePoint.y, referencePoint.z),
      to: new THREE.Vector3(cursorWorld.x, referencePoint.y, referencePoint.z),
      label: 'On Red Axis', strength: 0.8,
    });
  }
  // Y-axis alignment (Blue - up)
  if (Math.abs(dx) < threshold && Math.abs(dz) < threshold && Math.abs(dy) > 0.1) {
    guides.push({
      type: 'axis', axis: 'y', color: '#0000ff',
      from: new THREE.Vector3(referencePoint.x, referencePoint.y, referencePoint.z),
      to: new THREE.Vector3(referencePoint.x, cursorWorld.y, referencePoint.z),
      label: 'On Blue Axis', strength: 0.8,
    });
  }
  // Z-axis alignment (Green)
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold && Math.abs(dz) > 0.1) {
    guides.push({
      type: 'axis', axis: 'z', color: '#00ff00',
      from: new THREE.Vector3(referencePoint.x, referencePoint.y, referencePoint.z),
      to: new THREE.Vector3(referencePoint.x, referencePoint.y, cursorWorld.z),
      label: 'On Green Axis', strength: 0.8,
    });
  }

  // Extract ALL entity edges for parallel/perpendicular detection
  const allEdges: EntityEdge[] = [];
  for (const entity of entities) {
    allEdges.push(...extractEntityEdges(entity));
  }

  // Check parallel/perpendicular against all edges
  const curLen = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (curLen > 0.01) {
    const cNx = dx / curLen, cNy = dy / curLen, cNz = dz / curLen;
    
    for (const edge of allEdges) {
      const edgeDx = edge.end.x - edge.start.x;
      const edgeDy = edge.end.y - edge.start.y;
      const edgeDz = edge.end.z - edge.start.z;
      const edgeLen = Math.sqrt(edgeDx * edgeDx + edgeDy * edgeDy + edgeDz * edgeDz);
      if (edgeLen < 0.01) continue;
      
      const eNx = edgeDx / edgeLen, eNy = edgeDy / edgeLen, eNz = edgeDz / edgeLen;
      const dot = Math.abs(eNx * cNx + eNy * cNy + eNz * cNz);

      if (dot > 0.995) {
        guides.push({
          type: 'parallel', color: '#ff00ff',
          from: new THREE.Vector3(referencePoint.x, referencePoint.y, referencePoint.z),
          to: new THREE.Vector3(cursorWorld.x, cursorWorld.y, cursorWorld.z),
          label: 'Parallel to Edge', strength: 0.7,
        });
        break;
      }
      if (dot < 0.005) {
        guides.push({
          type: 'perpendicular', color: '#00ffff',
          from: new THREE.Vector3(referencePoint.x, referencePoint.y, referencePoint.z),
          to: new THREE.Vector3(cursorWorld.x, cursorWorld.y, cursorWorld.z),
          label: 'Perpendicular to Edge', strength: 0.7,
        });
        break;
      }
    }
  }

  // Snap to entity endpoints and midpoints (from-point inference)
  for (const entity of entities) {
    const snapPoints: { point: Point3D; label: string }[] = [];
    if (entity.type === 'line3d') {
      snapPoints.push({ point: entity.data.start as Point3D, label: 'Endpoint' });
      snapPoints.push({ point: entity.data.end as Point3D, label: 'Endpoint' });
      const s = entity.data.start as Point3D, e2 = entity.data.end as Point3D;
      snapPoints.push({ point: { x: (s.x + e2.x) / 2, y: (s.y + e2.y) / 2, z: (s.z + e2.z) / 2 }, label: 'Midpoint' });
    } else if (entity.type === 'box3d' || entity.type === 'wall') {
      const dd = entity.data as any;
      const b = dd.base || dd.origin;
      snapPoints.push({ point: { x: b.x + dd.width / 2, y: b.y + dd.height / 2, z: b.z + dd.depth / 2 }, label: 'Center' });
      // Corners
      snapPoints.push({ point: b, label: 'Corner' });
      snapPoints.push({ point: { x: b.x + dd.width, y: b.y, z: b.z }, label: 'Corner' });
      snapPoints.push({ point: { x: b.x + dd.width, y: b.y, z: b.z + dd.depth }, label: 'Corner' });
      snapPoints.push({ point: { x: b.x, y: b.y, z: b.z + dd.depth }, label: 'Corner' });
      snapPoints.push({ point: { x: b.x, y: b.y + dd.height, z: b.z }, label: 'Corner' });
      snapPoints.push({ point: { x: b.x + dd.width, y: b.y + dd.height, z: b.z }, label: 'Corner' });
      snapPoints.push({ point: { x: b.x + dd.width, y: b.y + dd.height, z: b.z + dd.depth }, label: 'Corner' });
      snapPoints.push({ point: { x: b.x, y: b.y + dd.height, z: b.z + dd.depth }, label: 'Corner' });
    }
    for (const sp of snapPoints) {
      const sd = Math.sqrt((cursorWorld.x - sp.point.x) ** 2 + (cursorWorld.y - sp.point.y) ** 2 + (cursorWorld.z - sp.point.z) ** 2);
      if (sd < 3) {
        guides.push({
          type: 'fromPoint', color: '#ffcc00',
          from: new THREE.Vector3(sp.point.x, sp.point.y, sp.point.z),
          to: new THREE.Vector3(cursorWorld.x, cursorWorld.y, cursorWorld.z),
          label: sp.label, strength: 0.6,
        });
      }
    }
  }

  return guides;
}

/* ── Section Plane ─────────────────────────────── */
export interface SectionPlane {
  id: string;
  position: Point3D;
  normal: Point3D;
  enabled: boolean;
  name: string;
  color: string;
}

export function createSectionPlane(position: Point3D, normal: Point3D, name?: string): SectionPlane {
  return {
    id: generateId(),
    position,
    normal,
    enabled: true,
    name: name || `Section ${Date.now() % 1000}`,
    color: '#ff8800',
  };
}

export function applySectionPlane(
  renderer: THREE.WebGLRenderer,
  plane: SectionPlane
): THREE.Plane {
  const clippingPlane = new THREE.Plane(
    new THREE.Vector3(plane.normal.x, plane.normal.y, plane.normal.z),
    -(plane.position.x * plane.normal.x + plane.position.y * plane.normal.y + plane.position.z * plane.normal.z)
  );
  renderer.clippingPlanes = [clippingPlane];
  renderer.localClippingEnabled = true;
  return clippingPlane;
}

/* ── Follow-Me Tool ─────────────────────────────── */
export function followMe(
  profilePoints: Point3D[],
  pathPoints: Point3D[],
  layerId: string,
  material?: CADMaterial
): AnyCADEntity | null {
  if (profilePoints.length < 3 || pathPoints.length < 2) return null;
  return {
    id: generateId(),
    type: 'tube',
    layerId,
    material: material || MATERIAL_PRESETS['default'],
    data: {
      path: pathPoints,
      radius: Math.max(
        ...profilePoints.map(p => Math.sqrt(p.x * p.x + p.z * p.z))
      ) || 1,
    },
  } as AnyCADEntity;
}

/* ── Tape Measure ─────────────────────────────── */
export interface TapeMeasurement {
  start: Point3D;
  end: Point3D;
  distance: number;
}

export function measureTape(start: Point3D, end: Point3D): TapeMeasurement {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  return { start, end, distance: Math.sqrt(dx * dx + dy * dy + dz * dz) };
}

/* ── Construction Guide ─────────────────────────── */
export interface ConstructionGuide {
  id: string;
  type: 'line' | 'point';
  start: Point3D;
  end: Point3D;
  label?: string;
}

export function createConstructionGuide(start: Point3D, end: Point3D, label?: string): ConstructionGuide {
  return { id: generateId(), type: 'line', start, end, label };
}

/* ── Component System ─────────────────────────────── */
export interface SketchUpComponent {
  id: string;
  name: string;
  category: 'architectural' | 'furniture' | 'landscape' | 'custom';
  description?: string;
  thumbnail?: string;
  entities: AnyCADEntity[];
  origin: Point3D;
  boundingBox: { width: number; height: number; depth: number };
  instanceCount: number;
  isLocked: boolean;
  tags: string[];
}

export interface ComponentInstance {
  id: string;
  componentId: string;
  position: Point3D;
  rotation: Point3D;
  scale: Point3D;
}

// Preset component library
export function getComponentLibrary(): SketchUpComponent[] {
  return [
    createPresetComponent('Simple Wall', 'architectural', [
      { id: generateId(), type: 'box3d', layerId: 'layer-0', data: { origin: { x: 0, y: 0, z: 0 }, width: 40, depth: 2, height: 30 } } as AnyCADEntity
    ], { width: 40, height: 30, depth: 2 }),
    createPresetComponent('Window Frame', 'architectural', [
      { id: generateId(), type: 'window', layerId: 'layer-0', material: MATERIAL_PRESETS['glass'], data: { base: { x: 0, y: 8, z: 0 }, width: 12, height: 15, depth: 2 } } as AnyCADEntity
    ], { width: 12, height: 15, depth: 2 }),
    createPresetComponent('Door Frame', 'architectural', [
      { id: generateId(), type: 'door', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-oak'], data: { base: { x: 0, y: 0, z: 0 }, width: 10, height: 24, depth: 2 } } as AnyCADEntity
    ], { width: 10, height: 24, depth: 2 }),
    createPresetComponent('Staircase', 'architectural', [
      { id: generateId(), type: 'stairs', layerId: 'layer-0', material: MATERIAL_PRESETS['concrete'], data: { base: { x: 0, y: 0, z: 0 }, width: 12, stepCount: 12, stepHeight: 1.8, stepDepth: 2.8 } } as AnyCADEntity
    ], { width: 12, height: 21.6, depth: 33.6 }),
    createPresetComponent('Flat Roof', 'architectural', [
      { id: generateId(), type: 'slab', layerId: 'layer-0', material: MATERIAL_PRESETS['concrete-smooth'], data: { origin: { x: 0, y: 30, z: 0 }, width: 50, depth: 40, thickness: 2 } } as AnyCADEntity
    ], { width: 50, height: 2, depth: 40 }),
    createPresetComponent('Column Pillar', 'architectural', [
      { id: generateId(), type: 'column', layerId: 'layer-0', material: MATERIAL_PRESETS['concrete-smooth'], data: { base: { x: 0, y: 0, z: 0 }, radius: 2.5, height: 30 } } as AnyCADEntity
    ], { width: 5, height: 30, depth: 5 }),
    createPresetComponent('Office Chair', 'furniture', createChairEntities(), { width: 6, height: 12, depth: 6 }),
    createPresetComponent('Desk', 'furniture', createDeskEntities(), { width: 16, height: 8, depth: 8 }),
    createPresetComponent('Table', 'furniture', createTableEntities(), { width: 12, height: 8, depth: 12 }),
    createPresetComponent('Bookshelf', 'furniture', createBookshelfEntities(), { width: 10, height: 20, depth: 3 }),
    createPresetComponent('Tree', 'landscape', createTreeEntities(), { width: 8, height: 20, depth: 8 }),
    createPresetComponent('Car', 'landscape', createCarEntities(), { width: 20, height: 6, depth: 8 }),
    createPresetComponent('Bench', 'landscape', createBenchEntities(), { width: 14, height: 5, depth: 5 }),
  ];
}

function createPresetComponent(name: string, category: SketchUpComponent['category'], entities: AnyCADEntity[], boundingBox: { width: number; height: number; depth: number }): SketchUpComponent {
  return { id: `comp_${name.toLowerCase().replace(/\s/g, '_')}_${Date.now() % 10000}`, name, category, entities, origin: { x: 0, y: 0, z: 0 }, boundingBox, instanceCount: 0, isLocked: false, tags: [category] };
}

function createChairEntities(): AnyCADEntity[] {
  const mat = MATERIAL_PRESETS['metal-steel'];
  return [
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-oak'], data: { origin: { x: -3, y: 5, z: -3 }, width: 6, depth: 6, height: 0.5 } } as AnyCADEntity,
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-oak'], data: { origin: { x: -3, y: 5.5, z: -3 }, width: 6, depth: 0.5, height: 7 } } as AnyCADEntity,
    { id: generateId(), type: 'cylinder', layerId: 'layer-0', material: mat, data: { base: { x: -2, y: 0, z: -2 }, radius: 0.3, height: 5 } } as AnyCADEntity,
    { id: generateId(), type: 'cylinder', layerId: 'layer-0', material: mat, data: { base: { x: 2, y: 0, z: -2 }, radius: 0.3, height: 5 } } as AnyCADEntity,
    { id: generateId(), type: 'cylinder', layerId: 'layer-0', material: mat, data: { base: { x: -2, y: 0, z: 2 }, radius: 0.3, height: 5 } } as AnyCADEntity,
    { id: generateId(), type: 'cylinder', layerId: 'layer-0', material: mat, data: { base: { x: 2, y: 0, z: 2 }, radius: 0.3, height: 5 } } as AnyCADEntity,
  ];
}

function createDeskEntities(): AnyCADEntity[] {
  return [
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-walnut'], data: { origin: { x: -8, y: 7.5, z: -4 }, width: 16, depth: 8, height: 0.5 } } as AnyCADEntity,
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['metal-steel'], data: { origin: { x: -7.5, y: 0, z: -3.5 }, width: 0.5, depth: 0.5, height: 7.5 } } as AnyCADEntity,
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['metal-steel'], data: { origin: { x: 7, y: 0, z: -3.5 }, width: 0.5, depth: 0.5, height: 7.5 } } as AnyCADEntity,
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['metal-steel'], data: { origin: { x: -7.5, y: 0, z: 3 }, width: 0.5, depth: 0.5, height: 7.5 } } as AnyCADEntity,
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['metal-steel'], data: { origin: { x: 7, y: 0, z: 3 }, width: 0.5, depth: 0.5, height: 7.5 } } as AnyCADEntity,
  ];
}

function createTableEntities(): AnyCADEntity[] {
  return [
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-pine'], data: { origin: { x: -6, y: 7, z: -6 }, width: 12, depth: 12, height: 1 } } as AnyCADEntity,
    { id: generateId(), type: 'cylinder', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-pine'], data: { base: { x: -4.5, y: 0, z: -4.5 }, radius: 0.4, height: 7 } } as AnyCADEntity,
    { id: generateId(), type: 'cylinder', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-pine'], data: { base: { x: 4.5, y: 0, z: -4.5 }, radius: 0.4, height: 7 } } as AnyCADEntity,
    { id: generateId(), type: 'cylinder', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-pine'], data: { base: { x: -4.5, y: 0, z: 4.5 }, radius: 0.4, height: 7 } } as AnyCADEntity,
    { id: generateId(), type: 'cylinder', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-pine'], data: { base: { x: 4.5, y: 0, z: 4.5 }, radius: 0.4, height: 7 } } as AnyCADEntity,
  ];
}

function createBookshelfEntities(): AnyCADEntity[] {
  const mat = MATERIAL_PRESETS['wood-oak'];
  const shelves: AnyCADEntity[] = [];
  shelves.push({ id: generateId(), type: 'box3d', layerId: 'layer-0', material: mat, data: { origin: { x: -5, y: 0, z: -1.5 }, width: 0.3, depth: 3, height: 20 } } as AnyCADEntity);
  shelves.push({ id: generateId(), type: 'box3d', layerId: 'layer-0', material: mat, data: { origin: { x: 4.7, y: 0, z: -1.5 }, width: 0.3, depth: 3, height: 20 } } as AnyCADEntity);
  for (let i = 0; i < 5; i++) {
    shelves.push({ id: generateId(), type: 'box3d', layerId: 'layer-0', material: mat, data: { origin: { x: -4.7, y: i * 4, z: -1.5 }, width: 9.4, depth: 3, height: 0.3 } } as AnyCADEntity);
  }
  return shelves;
}

function createTreeEntities(): AnyCADEntity[] {
  return [
    { id: generateId(), type: 'cylinder', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-walnut'], data: { base: { x: 0, y: 0, z: 0 }, radius: 0.8, height: 8 } } as AnyCADEntity,
    { id: generateId(), type: 'sphere', layerId: 'layer-0', material: { preset: 'paint-custom', color: '#2d5a27', opacity: 0.9, metalness: 0, roughness: 0.9 }, data: { center: { x: 0, y: 14, z: 0 }, radius: 6 } } as AnyCADEntity,
  ];
}

function createCarEntities(): AnyCADEntity[] {
  return [
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: { preset: 'paint-custom', color: '#333399', opacity: 1, metalness: 0.7, roughness: 0.3 }, data: { origin: { x: -10, y: 1, z: -4 }, width: 20, depth: 8, height: 3 } } as AnyCADEntity,
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['glass'], data: { origin: { x: -5, y: 4, z: -3.5 }, width: 10, depth: 7, height: 2.5 } } as AnyCADEntity,
    { id: generateId(), type: 'torus', layerId: 'layer-0', material: MATERIAL_PRESETS['metal-steel'], data: { center: { x: -6, y: 1, z: 4.5 }, majorRadius: 1.2, minorRadius: 0.4 } } as AnyCADEntity,
    { id: generateId(), type: 'torus', layerId: 'layer-0', material: MATERIAL_PRESETS['metal-steel'], data: { center: { x: 6, y: 1, z: 4.5 }, majorRadius: 1.2, minorRadius: 0.4 } } as AnyCADEntity,
  ];
}

function createBenchEntities(): AnyCADEntity[] {
  return [
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-pine'], data: { origin: { x: -7, y: 4, z: -2.5 }, width: 14, depth: 5, height: 0.5 } } as AnyCADEntity,
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['wood-pine'], data: { origin: { x: -7, y: 4.5, z: -2.5 }, width: 14, depth: 0.5, height: 4 } } as AnyCADEntity,
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['metal-steel'], data: { origin: { x: -6, y: 0, z: -2 }, width: 0.5, depth: 4, height: 4 } } as AnyCADEntity,
    { id: generateId(), type: 'box3d', layerId: 'layer-0', material: MATERIAL_PRESETS['metal-steel'], data: { origin: { x: 5.5, y: 0, z: -2 }, width: 0.5, depth: 4, height: 4 } } as AnyCADEntity,
  ];
}

/* ── Render Style Modes ─────────────────────────── */
export type RenderStyle = 'shaded' | 'wireframe' | 'hidden-line' | 'textured' | 'xray';

export function applyRenderStyle(entitiesGroup: THREE.Group, style: RenderStyle) {
  entitiesGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const mat = child.material as THREE.MeshStandardMaterial;
      if (!mat) return;
      switch (style) {
        case 'wireframe': mat.wireframe = true; mat.transparent = false; mat.opacity = 1; break;
        case 'xray': mat.wireframe = false; mat.transparent = true; mat.opacity = 0.3; break;
        case 'hidden-line': mat.wireframe = false; mat.transparent = false; mat.opacity = 1; mat.flatShading = true; break;
        default: mat.wireframe = false; mat.transparent = mat.opacity < 1; mat.flatShading = false; break;
      }
      mat.needsUpdate = true;
    }
  });
}

/* ── Walkthrough (First-Person) Camera ─────────── */
export interface WalkthroughState {
  active: boolean;
  position: THREE.Vector3;
  direction: THREE.Vector3;
  speed: number;
  eyeHeight: number;
  velocity: THREE.Vector3;
}

export function createWalkthroughState(): WalkthroughState {
  return { active: false, position: new THREE.Vector3(0, 17, 50), direction: new THREE.Vector3(0, 0, -1), speed: 2, eyeHeight: 17, velocity: new THREE.Vector3() };
}

export function updateWalkthrough(state: WalkthroughState, camera: THREE.PerspectiveCamera, keys: Set<string>, delta: number): void {
  if (!state.active) return;
  const moveSpeed = state.speed * delta * 60;
  const forward = state.direction.clone().normalize(); forward.y = 0; forward.normalize();
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
  if (keys.has('w') || keys.has('arrowup')) state.position.add(forward.clone().multiplyScalar(moveSpeed));
  if (keys.has('s') || keys.has('arrowdown')) state.position.add(forward.clone().multiplyScalar(-moveSpeed));
  if (keys.has('a') || keys.has('arrowleft')) state.position.add(right.clone().multiplyScalar(-moveSpeed));
  if (keys.has('d') || keys.has('arrowright')) state.position.add(right.clone().multiplyScalar(moveSpeed));
  state.position.y = state.eyeHeight;
  camera.position.copy(state.position);
  camera.lookAt(state.position.clone().add(state.direction));
}

/* ── 3D Export Helpers ─────────────────────────────── */
export function exportGLTF(scene: THREE.Scene): Promise<Blob> {
  return new Promise((resolve) => {
    const data = JSON.stringify({ format: 'gltf-placeholder', objectCount: scene.children.length });
    resolve(new Blob([data], { type: 'model/gltf+json' }));
  });
}
