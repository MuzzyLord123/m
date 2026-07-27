import { Point2D } from './cadTypes';

export function distance(a: Point2D, b: Point2D): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

export function midpoint(a: Point2D, b: Point2D): Point2D {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

export function angle(a: Point2D, b: Point2D): number {
  return Math.atan2(b.y - a.y, b.x - a.x) * (180 / Math.PI);
}

export function snapToGrid(p: Point2D, gridSize: number): Point2D {
  return {
    x: Math.round(p.x / gridSize) * gridSize,
    y: Math.round(p.y / gridSize) * gridSize,
  };
}

export function snapToAngle(origin: Point2D, point: Point2D, angleIncrement: number): Point2D {
  const dx = point.x - origin.x;
  const dy = point.y - origin.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const ang = Math.atan2(dy, dx);
  const snapAngle = Math.round(ang / (angleIncrement * Math.PI / 180)) * (angleIncrement * Math.PI / 180);
  return {
    x: origin.x + dist * Math.cos(snapAngle),
    y: origin.y + dist * Math.sin(snapAngle),
  };
}

export function constrainOrtho(origin: Point2D, point: Point2D): Point2D {
  const dx = Math.abs(point.x - origin.x);
  const dy = Math.abs(point.y - origin.y);
  return dx > dy
    ? { x: point.x, y: origin.y }
    : { x: origin.x, y: point.y };
}

export function pointInRect(p: Point2D, rx: number, ry: number, rw: number, rh: number): boolean {
  return p.x >= rx && p.x <= rx + rw && p.y >= ry && p.y <= ry + rh;
}

export function pointNearLine(p: Point2D, a: Point2D, b: Point2D, tolerance: number): boolean {
  const d = distPointToSegment(p, a, b);
  return d <= tolerance;
}

function distPointToSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return distance(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return distance(p, { x: a.x + t * dx, y: a.y + t * dy });
}

export function pointNearCircle(p: Point2D, center: Point2D, radius: number, tolerance: number): boolean {
  const d = Math.abs(distance(p, center) - radius);
  return d <= tolerance;
}

export function generateId(): string {
  return `cad_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function formatCoord(value: number, precision: number): string {
  return value.toFixed(precision);
}

export function degreesToRadians(deg: number): number {
  return deg * (Math.PI / 180);
}

export function radiansToDegrees(rad: number): number {
  return rad * (180 / Math.PI);
}
