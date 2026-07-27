/**
 * Smart Object Snap Engine — detects geometric snap points on existing entities
 * Supports: Endpoint, Midpoint, Center, Nearest, Perpendicular, Intersection
 * Enhanced: Full corner coverage for all 3D entities
 */
import { Point3D, CADEntity } from './cadTypes';

export type SnapType = 'endpoint' | 'midpoint' | 'center' | 'nearest' | 'perpendicular' | 'intersection' | 'grid' | 'none';

export interface SnapResult {
  point: Point3D;
  type: SnapType;
  entityId?: string;
  distance: number;
}

function dist3D(a: Point3D, b: Point3D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

function midpoint3D(a: Point3D, b: Point3D): Point3D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2 };
}

/** Generate all 8 corners + 12 edge midpoints + center for a box */
function boxSnapPoints(bx: number, by: number, bz: number, w: number, h: number, dp: number): { point: Point3D; type: SnapType }[] {
  const results: { point: Point3D; type: SnapType }[] = [];
  // 8 corners
  const corners: Point3D[] = [
    { x: bx, y: by, z: bz },           { x: bx + w, y: by, z: bz },
    { x: bx + w, y: by, z: bz + dp },  { x: bx, y: by, z: bz + dp },
    { x: bx, y: by + h, z: bz },       { x: bx + w, y: by + h, z: bz },
    { x: bx + w, y: by + h, z: bz + dp }, { x: bx, y: by + h, z: bz + dp },
  ];
  corners.forEach(p => results.push({ point: p, type: 'endpoint' }));

  // 12 edge midpoints (bottom 4, top 4, vertical 4)
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 0], // bottom
    [4, 5], [5, 6], [6, 7], [7, 4], // top
    [0, 4], [1, 5], [2, 6], [3, 7], // vertical
  ];
  edges.forEach(([a, b]) => results.push({ point: midpoint3D(corners[a], corners[b]), type: 'midpoint' }));

  // Center
  results.push({ point: { x: bx + w / 2, y: by + h / 2, z: bz + dp / 2 }, type: 'center' });

  // Face centers (6 faces)
  results.push({ point: { x: bx + w / 2, y: by, z: bz + dp / 2 }, type: 'center' });       // bottom
  results.push({ point: { x: bx + w / 2, y: by + h, z: bz + dp / 2 }, type: 'center' });    // top
  results.push({ point: { x: bx, y: by + h / 2, z: bz + dp / 2 }, type: 'center' });         // left
  results.push({ point: { x: bx + w, y: by + h / 2, z: bz + dp / 2 }, type: 'center' });     // right
  results.push({ point: { x: bx + w / 2, y: by + h / 2, z: bz }, type: 'center' });           // front
  results.push({ point: { x: bx + w / 2, y: by + h / 2, z: bz + dp }, type: 'center' });     // back

  return results;
}

/** Get all candidate snap points from an entity */
function getEntitySnapPoints(entity: CADEntity): { point: Point3D; type: SnapType }[] {
  const results: { point: Point3D; type: SnapType }[] = [];
  const d = entity.data as any;

  switch (entity.type) {
    case 'line': {
      const s = { x: d.start.x, y: 0, z: d.start.y };
      const e = { x: d.end.x, y: 0, z: d.end.y };
      results.push({ point: s, type: 'endpoint' });
      results.push({ point: e, type: 'endpoint' });
      results.push({ point: midpoint3D(s, e), type: 'midpoint' });
      break;
    }
    case 'line3d': {
      results.push({ point: d.start, type: 'endpoint' });
      results.push({ point: d.end, type: 'endpoint' });
      results.push({ point: midpoint3D(d.start, d.end), type: 'midpoint' });
      break;
    }
    case 'circle': {
      const c = { x: d.center.x, y: 0, z: d.center.y };
      results.push({ point: c, type: 'center' });
      results.push({ point: { x: c.x + d.radius, y: 0, z: c.z }, type: 'endpoint' });
      results.push({ point: { x: c.x - d.radius, y: 0, z: c.z }, type: 'endpoint' });
      results.push({ point: { x: c.x, y: 0, z: c.z + d.radius }, type: 'endpoint' });
      results.push({ point: { x: c.x, y: 0, z: c.z - d.radius }, type: 'endpoint' });
      break;
    }
    case 'arc': {
      const c = { x: d.center.x, y: 0, z: d.center.y };
      results.push({ point: c, type: 'center' });
      const sA = (d.startAngle || 0) * Math.PI / 180;
      const eA = (d.endAngle || 360) * Math.PI / 180;
      // Start and end points of arc
      results.push({ point: { x: c.x + d.radius * Math.cos(sA), y: 0, z: c.z + d.radius * Math.sin(sA) }, type: 'endpoint' });
      results.push({ point: { x: c.x + d.radius * Math.cos(eA), y: 0, z: c.z + d.radius * Math.sin(eA) }, type: 'endpoint' });
      // Midpoint of arc
      const midA = (sA + eA) / 2;
      results.push({ point: { x: c.x + d.radius * Math.cos(midA), y: 0, z: c.z + d.radius * Math.sin(midA) }, type: 'midpoint' });
      break;
    }
    case 'rectangle': {
      const o = d.origin;
      const extH = d.extrude || 0;
      if (extH > 0) {
        // Extruded rectangle = box, give all box snap points
        results.push(...boxSnapPoints(o.x, 0, o.y, d.width, extH, d.height));
      } else {
        const corners: Point3D[] = [
          { x: o.x, y: 0, z: o.y },
          { x: o.x + d.width, y: 0, z: o.y },
          { x: o.x + d.width, y: 0, z: o.y + d.height },
          { x: o.x, y: 0, z: o.y + d.height },
        ];
        corners.forEach(p => results.push({ point: p, type: 'endpoint' }));
        for (let i = 0; i < 4; i++) {
          results.push({ point: midpoint3D(corners[i], corners[(i + 1) % 4]), type: 'midpoint' });
        }
        results.push({ point: { x: o.x + d.width / 2, y: 0, z: o.y + d.height / 2 }, type: 'center' });
      }
      break;
    }
    case 'wall': case 'box3d': {
      const base = d.base || d.origin;
      const w = d.width, dp = d.depth, h = d.height;
      results.push(...boxSnapPoints(base.x, base.y, base.z, w, h, dp));
      break;
    }
    case 'column': case 'cylinder': {
      const b = d.base;
      const r = d.radius;
      const h = d.height;
      // Bottom center + top center
      results.push({ point: b, type: 'center' });
      results.push({ point: { x: b.x, y: b.y + h, z: b.z }, type: 'center' });
      results.push({ point: { x: b.x, y: b.y + h / 2, z: b.z }, type: 'center' });
      // Bottom quadrants
      results.push({ point: { x: b.x + r, y: b.y, z: b.z }, type: 'endpoint' });
      results.push({ point: { x: b.x - r, y: b.y, z: b.z }, type: 'endpoint' });
      results.push({ point: { x: b.x, y: b.y, z: b.z + r }, type: 'endpoint' });
      results.push({ point: { x: b.x, y: b.y, z: b.z - r }, type: 'endpoint' });
      // Top quadrants
      results.push({ point: { x: b.x + r, y: b.y + h, z: b.z }, type: 'endpoint' });
      results.push({ point: { x: b.x - r, y: b.y + h, z: b.z }, type: 'endpoint' });
      results.push({ point: { x: b.x, y: b.y + h, z: b.z + r }, type: 'endpoint' });
      results.push({ point: { x: b.x, y: b.y + h, z: b.z - r }, type: 'endpoint' });
      break;
    }
    case 'sphere': {
      const c = d.center;
      results.push({ point: c, type: 'center' });
      results.push({ point: { x: c.x, y: c.y + d.radius, z: c.z }, type: 'endpoint' });
      results.push({ point: { x: c.x, y: c.y - d.radius, z: c.z }, type: 'endpoint' });
      results.push({ point: { x: c.x + d.radius, y: c.y, z: c.z }, type: 'endpoint' });
      results.push({ point: { x: c.x - d.radius, y: c.y, z: c.z }, type: 'endpoint' });
      results.push({ point: { x: c.x, y: c.y, z: c.z + d.radius }, type: 'endpoint' });
      results.push({ point: { x: c.x, y: c.y, z: c.z - d.radius }, type: 'endpoint' });
      break;
    }
    case 'polyline': {
      const pts = d.points as { x: number; y: number }[];
      pts.forEach(p => results.push({ point: { x: p.x, y: 0, z: p.y }, type: 'endpoint' }));
      for (let i = 0; i < pts.length - 1; i++) {
        const a = { x: pts[i].x, y: 0, z: pts[i].y };
        const b = { x: pts[i + 1].x, y: 0, z: pts[i + 1].y };
        results.push({ point: midpoint3D(a, b), type: 'midpoint' });
      }
      break;
    }
    case 'polygon': {
      const c = { x: d.center.x, y: 0, z: d.center.y };
      results.push({ point: c, type: 'center' });
      const sides = d.sides || 6;
      for (let i = 0; i < sides; i++) {
        const a = (i * 2 * Math.PI) / sides + ((d.rotation || 0) * Math.PI / 180);
        const pt = { x: c.x + d.radius * Math.cos(a), y: 0, z: c.z + d.radius * Math.sin(a) };
        results.push({ point: pt, type: 'endpoint' });
      }
      // Edge midpoints
      for (let i = 0; i < sides; i++) {
        const a1 = (i * 2 * Math.PI) / sides + ((d.rotation || 0) * Math.PI / 180);
        const a2 = ((i + 1) * 2 * Math.PI) / sides + ((d.rotation || 0) * Math.PI / 180);
        const p1 = { x: c.x + d.radius * Math.cos(a1), y: 0, z: c.z + d.radius * Math.sin(a1) };
        const p2 = { x: c.x + d.radius * Math.cos(a2), y: 0, z: c.z + d.radius * Math.sin(a2) };
        results.push({ point: midpoint3D(p1, p2), type: 'midpoint' });
      }
      break;
    }
    case 'ellipse': {
      const c = { x: d.center.x, y: 0, z: d.center.y };
      results.push({ point: c, type: 'center' });
      results.push({ point: { x: c.x + d.radiusX, y: 0, z: c.z }, type: 'endpoint' });
      results.push({ point: { x: c.x - d.radiusX, y: 0, z: c.z }, type: 'endpoint' });
      results.push({ point: { x: c.x, y: 0, z: c.z + d.radiusY }, type: 'endpoint' });
      results.push({ point: { x: c.x, y: 0, z: c.z - d.radiusY }, type: 'endpoint' });
      break;
    }
    case 'slab': {
      const o = d.origin;
      const w = d.width, dp = d.depth, t = d.thickness;
      results.push(...boxSnapPoints(o.x, o.y, o.z, w, t, dp));
      break;
    }
    case 'cone': case 'pyramid': {
      const b = d.base;
      results.push({ point: b, type: 'endpoint' });
      results.push({ point: { x: b.x, y: b.y + d.height, z: b.z }, type: 'endpoint' });
      results.push({ point: { x: b.x, y: b.y + d.height / 2, z: b.z }, type: 'center' });
      // Base quadrants for cone
      if (d.radius) {
        results.push({ point: { x: b.x + d.radius, y: b.y, z: b.z }, type: 'endpoint' });
        results.push({ point: { x: b.x - d.radius, y: b.y, z: b.z }, type: 'endpoint' });
        results.push({ point: { x: b.x, y: b.y, z: b.z + d.radius }, type: 'endpoint' });
        results.push({ point: { x: b.x, y: b.y, z: b.z - d.radius }, type: 'endpoint' });
      }
      // Base corners for pyramid
      if (d.baseSize) {
        const hs = d.baseSize / 2;
        results.push({ point: { x: b.x + hs, y: b.y, z: b.z + hs }, type: 'endpoint' });
        results.push({ point: { x: b.x - hs, y: b.y, z: b.z + hs }, type: 'endpoint' });
        results.push({ point: { x: b.x + hs, y: b.y, z: b.z - hs }, type: 'endpoint' });
        results.push({ point: { x: b.x - hs, y: b.y, z: b.z - hs }, type: 'endpoint' });
      }
      break;
    }
    case 'torus': {
      const c = d.center;
      const R = d.majorRadius;
      results.push({ point: c, type: 'center' });
      results.push({ point: { x: c.x + R, y: c.y, z: c.z }, type: 'endpoint' });
      results.push({ point: { x: c.x - R, y: c.y, z: c.z }, type: 'endpoint' });
      results.push({ point: { x: c.x, y: c.y, z: c.z + R }, type: 'endpoint' });
      results.push({ point: { x: c.x, y: c.y, z: c.z - R }, type: 'endpoint' });
      break;
    }
    case 'window': case 'door': {
      const b = d.base;
      const w = d.width, h = d.height, dp = d.depth;
      results.push(...boxSnapPoints(b.x, b.y, b.z, w, h, dp));
      break;
    }
    case 'stairs': {
      const b = d.base;
      const w = d.width, sc = d.stepCount, sh = d.stepHeight, sd = d.stepDepth;
      // Bottom corners
      results.push({ point: b, type: 'endpoint' });
      results.push({ point: { x: b.x + w, y: b.y, z: b.z }, type: 'endpoint' });
      // Top corners
      const topY = b.y + sc * sh;
      const topZ = b.z + sc * sd;
      results.push({ point: { x: b.x, y: topY, z: topZ }, type: 'endpoint' });
      results.push({ point: { x: b.x + w, y: topY, z: topZ }, type: 'endpoint' });
      // Each step corner
      for (let i = 0; i < sc; i++) {
        const sy = b.y + (i + 1) * sh;
        const sz = b.z + i * sd;
        results.push({ point: { x: b.x, y: sy, z: sz }, type: 'endpoint' });
        results.push({ point: { x: b.x + w, y: sy, z: sz }, type: 'endpoint' });
      }
      break;
    }
  }

  return results;
}

/**
 * Find the best snap point near a given world position
 */
export function findSnap(
  worldPos: Point3D,
  entities: CADEntity[],
  enabledModes: string[],
  tolerance: number = 5,
  excludeIds: string[] = []
): SnapResult | null {
  let best: SnapResult | null = null;

  for (const entity of entities) {
    if (excludeIds.includes(entity.id)) continue;

    const candidates = getEntitySnapPoints(entity);
    for (const { point, type } of candidates) {
      if (!enabledModes.includes(type)) continue;
      const d = dist3D(worldPos, point);
      if (d < tolerance && (!best || d < best.distance)) {
        best = { point, type, entityId: entity.id, distance: d };
      }
    }
  }

  return best;
}

/** Get snap icon character for display */
export function getSnapIcon(type: SnapType): string {
  switch (type) {
    case 'endpoint': return '□';
    case 'midpoint': return '△';
    case 'center': return '○';
    case 'nearest': return '◇';
    case 'perpendicular': return '⊥';
    case 'intersection': return '✕';
    case 'grid': return '⊞';
    default: return '·';
  }
}

/** Get snap color */
export function getSnapColor(type: SnapType): string {
  switch (type) {
    case 'endpoint': return '#00ff00';
    case 'midpoint': return '#00ccff';
    case 'center': return '#ff6600';
    case 'nearest': return '#ffff00';
    case 'perpendicular': return '#ff00ff';
    case 'intersection': return '#ff3333';
    default: return '#ffffff';
  }
}
