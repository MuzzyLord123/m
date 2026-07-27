import { AnyCADEntity, Point3D } from './cadTypes';
import { generateId } from './cadGeometry';

/* ── Helpers to get/set the "anchor" point of any entity ── */
function getEntityOrigin(entity: AnyCADEntity): Point3D {
  const d = entity.data as any;
  if (d.base) return { ...d.base };
  if (d.origin) return typeof d.origin.z === 'number' ? { ...d.origin } : { x: d.origin.x, y: 0, z: d.origin.y };
  if (d.start && typeof d.start.z === 'number') return { ...d.start };
  if (d.start) return { x: d.start.x, y: 0, z: d.start.y };
  if (d.center) return { x: d.center.x, y: 0, z: d.center.y };
  if (d.position) return { x: d.position.x, y: 0, z: d.position.y };
  return { x: 0, y: 0, z: 0 };
}

/* Move all coordinate fields of an entity by a delta vector */
export function moveEntity(entity: AnyCADEntity, dx: number, dy: number, dz: number): AnyCADEntity {
  const clone = JSON.parse(JSON.stringify(entity)) as AnyCADEntity;
  const d = clone.data as any;

  const shift2D = (p: { x: number; y: number }) => { p.x += dx; p.y += dz; };
  const shift3D = (p: { x: number; y: number; z: number }) => { p.x += dx; p.y += dy; p.z += dz; };

  switch (clone.type) {
    case 'line': shift2D(d.start); shift2D(d.end); break;
    case 'line3d': shift3D(d.start); shift3D(d.end); break;
    case 'circle': case 'polygon': case 'ellipse': shift2D(d.center); break;
    case 'rectangle': shift2D(d.origin); break;
    case 'polyline': d.points.forEach(shift2D); break;
    case 'text': shift2D(d.position); break;
    case 'dimension': shift2D(d.start); shift2D(d.end); break;
    case 'wall': case 'column': case 'window': case 'door': shift3D(d.base); break;
    case 'box3d': case 'slab': shift3D(d.origin); break;
  }
  return clone;
}

/* Duplicate entity with new id and optional move */
export function copyEntity(entity: AnyCADEntity, dx: number, dy: number, dz: number): AnyCADEntity {
  const moved = moveEntity(entity, dx, dy, dz);
  moved.id = generateId();
  return moved;
}

/* Rotate entity around a base point by angleDeg (Y axis rotation — top-down) */
export function rotateEntity(entity: AnyCADEntity, base: Point3D, angleDeg: number): AnyCADEntity {
  const clone = JSON.parse(JSON.stringify(entity)) as AnyCADEntity;
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);

  const rot2D = (p: { x: number; y: number }) => {
    const rx = p.x - base.x, ry = p.y - base.z;
    p.x = base.x + rx * cos - ry * sin;
    p.y = base.z + rx * sin + ry * cos;
  };
  const rot3D = (p: { x: number; y: number; z: number }) => {
    const rx = p.x - base.x, rz = p.z - base.z;
    p.x = base.x + rx * cos - rz * sin;
    p.z = base.z + rx * sin + rz * cos;
  };

  const d = clone.data as any;
  switch (clone.type) {
    case 'line': rot2D(d.start); rot2D(d.end); break;
    case 'line3d': rot3D(d.start); rot3D(d.end); break;
    case 'circle': case 'polygon': case 'ellipse': rot2D(d.center); break;
    case 'rectangle': rot2D(d.origin); d.rotation = (d.rotation || 0) + angleDeg; break;
    case 'polyline': d.points.forEach(rot2D); break;
    case 'text': rot2D(d.position); d.rotation = (d.rotation || 0) + angleDeg; break;
    case 'dimension': rot2D(d.start); rot2D(d.end); break;
    case 'wall': case 'column': case 'window': case 'door': rot3D(d.base); break;
    case 'box3d': case 'slab': rot3D(d.origin); break;
  }
  return clone;
}

/* Scale entity from a base point */
export function scaleEntity(entity: AnyCADEntity, base: Point3D, factor: number): AnyCADEntity {
  const clone = JSON.parse(JSON.stringify(entity)) as AnyCADEntity;

  const sc2D = (p: { x: number; y: number }) => {
    p.x = base.x + (p.x - base.x) * factor;
    p.y = base.z + (p.y - base.z) * factor;
  };
  const sc3D = (p: { x: number; y: number; z: number }) => {
    p.x = base.x + (p.x - base.x) * factor;
    p.y = base.y + (p.y - base.y) * factor;
    p.z = base.z + (p.z - base.z) * factor;
  };

  const d = clone.data as any;
  switch (clone.type) {
    case 'line': sc2D(d.start); sc2D(d.end); break;
    case 'line3d': sc3D(d.start); sc3D(d.end); break;
    case 'circle': sc2D(d.center); d.radius *= factor; break;
    case 'polygon': sc2D(d.center); d.radius *= factor; break;
    case 'ellipse': sc2D(d.center); d.radiusX *= factor; d.radiusY *= factor; break;
    case 'rectangle': sc2D(d.origin); d.width *= factor; d.height *= factor; if (d.extrude) d.extrude *= factor; break;
    case 'polyline': d.points.forEach(sc2D); break;
    case 'text': sc2D(d.position); d.fontSize *= factor; break;
    case 'dimension': sc2D(d.start); sc2D(d.end); d.offset *= factor; break;
    case 'wall': sc3D(d.base); d.width *= factor; d.depth *= factor; d.height *= factor; break;
    case 'box3d': sc3D(d.origin); d.width *= factor; d.depth *= factor; d.height *= factor; break;
    case 'column': sc3D(d.base); d.radius *= factor; d.height *= factor; break;
    case 'window': case 'door': sc3D(d.base); d.width *= factor; d.height *= factor; d.depth *= factor; break;
    case 'slab': sc3D(d.origin); d.width *= factor; d.depth *= factor; d.thickness *= factor; break;
  }
  return clone;
}

/* Mirror entity across a plane defined by two 3D points (vertical plane through those points) */
export function mirrorEntity(entity: AnyCADEntity, p1: Point3D, p2: Point3D): AnyCADEntity {
  const clone = JSON.parse(JSON.stringify(entity)) as AnyCADEntity;
  const dx = p2.x - p1.x, dz = p2.z - p1.z;
  const len2 = dx * dx + dz * dz;
  if (len2 < 0.0001) return clone;

  const mirror2D = (p: { x: number; y: number }) => {
    const ax = p.x - p1.x, az = p.y - p1.z;
    const dot = (ax * dx + az * dz) / len2;
    p.x = 2 * (p1.x + dot * dx) - p.x;
    p.y = 2 * (p1.z + dot * dz) - p.y;
  };
  const mirror3D = (p: { x: number; y: number; z: number }) => {
    const ax = p.x - p1.x, az = p.z - p1.z;
    const dot = (ax * dx + az * dz) / len2;
    p.x = 2 * (p1.x + dot * dx) - p.x;
    p.z = 2 * (p1.z + dot * dz) - p.z;
  };

  const d = clone.data as any;
  switch (clone.type) {
    case 'line': mirror2D(d.start); mirror2D(d.end); break;
    case 'line3d': mirror3D(d.start); mirror3D(d.end); break;
    case 'circle': case 'polygon': case 'ellipse': mirror2D(d.center); break;
    case 'rectangle': mirror2D(d.origin); break;
    case 'polyline': d.points.forEach(mirror2D); break;
    case 'text': mirror2D(d.position); break;
    case 'dimension': mirror2D(d.start); mirror2D(d.end); break;
    case 'wall': case 'column': case 'window': case 'door': mirror3D(d.base); break;
    case 'box3d': case 'slab': mirror3D(d.origin); break;
  }
  clone.id = generateId();
  return clone;
}

/* Extrude a 2D entity (circle, rectangle, polygon) into a 3D solid */
export function extrudeEntity(entity: AnyCADEntity, height: number): AnyCADEntity | null {
  if (entity.type === 'rectangle') {
    const d = entity.data as any;
    return {
      id: entity.id,
      type: 'box3d',
      layerId: entity.layerId,
      material: entity.material,
      data: {
        origin: { x: d.origin.x, y: 0, z: d.origin.y },
        width: d.width,
        depth: d.height,
        height: Math.abs(height),
      },
    } as AnyCADEntity;
  }
  if (entity.type === 'circle') {
    const d = entity.data as any;
    return {
      id: entity.id,
      type: 'column',
      layerId: entity.layerId,
      material: entity.material,
      data: {
        base: { x: d.center.x, y: 0, z: d.center.y },
        radius: d.radius,
        height: Math.abs(height),
      },
    } as AnyCADEntity;
  }
  // For rectangles with existing extrude, just update height
  if (entity.type === 'box3d') {
    const clone = JSON.parse(JSON.stringify(entity)) as AnyCADEntity;
    (clone.data as any).height += height;
    return clone;
  }
  return null;
}

/* Get the bounding box center of an entity (used for transform base point defaults) */
export function getEntityCenter(entity: AnyCADEntity): Point3D {
  return getEntityOrigin(entity);
}

/* Array copy: create N copies along a vector or distribute evenly */
export function arrayCopy(entity: AnyCADEntity, dx: number, dy: number, dz: number, count: number, mode: 'multiply' | 'divide' = 'multiply'): AnyCADEntity[] {
  const results: AnyCADEntity[] = [];
  if (mode === 'divide') {
    // Distribute copies evenly between base and target
    for (let i = 1; i <= count; i++) {
      const frac = i / (count + 1);
      results.push(copyEntity(entity, dx * frac, dy * frac, dz * frac));
    }
  } else {
    // Space copies at the same interval
    for (let i = 1; i <= count; i++) {
      results.push(copyEntity(entity, dx * i, dy * i, dz * i));
    }
  }
  return results;
}

/* Offset a 2D shape inward or outward */
export function offsetEntity(entity: AnyCADEntity, distance: number): AnyCADEntity | null {
  const clone = JSON.parse(JSON.stringify(entity)) as AnyCADEntity;
  clone.id = generateId();
  const d = clone.data as any;

  if (clone.type === 'circle') {
    d.radius = Math.max(0.1, d.radius + distance);
    return clone;
  }
  if (clone.type === 'rectangle') {
    d.origin.x -= distance;
    d.origin.y -= distance;
    d.width = Math.max(0.1, d.width + distance * 2);
    d.height = Math.max(0.1, d.height + distance * 2);
    return clone;
  }
  if (clone.type === 'polygon') {
    d.radius = Math.max(0.1, d.radius + distance);
    return clone;
  }
  return null;
}
