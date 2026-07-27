import { CADState, AnyCADEntity, CADLayer, BlockDefinition, CADGroup, DimensionStyle, UnitType } from './cadTypes';

/* ── Serializable project data ──────────────────── */
export interface CADProjectData {
  entities: AnyCADEntity[];
  layers: CADLayer[];
  activeLayerId: string;
  units: UnitType;
  precision: number;
  gridSize: number;
  blockDefinitions: BlockDefinition[];
  groups: CADGroup[];
  dimensionStyles: DimensionStyle[];
  activeDimStyleId: string;
  background: string;
}

export function stateToProjectData(state: CADState): CADProjectData {
  return {
    entities: state.entities,
    layers: state.layers,
    activeLayerId: state.activeLayerId,
    units: state.units,
    precision: state.precision,
    gridSize: state.gridSize,
    blockDefinitions: state.blockDefinitions || [],
    groups: state.groups || [],
    dimensionStyles: state.dimensionStyles || [],
    activeDimStyleId: state.activeDimStyleId,
    background: state.background,
  };
}

/* ── DXF Export ──────────────────────────────────── */
export function exportDXF(data: CADProjectData): string {
  const lines: string[] = [];
  const w = (s: string) => lines.push(s);

  // Header
  w('0'); w('SECTION'); w('2'); w('HEADER');
  w('9'); w('$INSUNITS'); w('70'); w(data.units === 'mm' ? '4' : data.units === 'cm' ? '5' : data.units === 'm' ? '6' : data.units === 'in' ? '1' : data.units === 'ft' ? '2' : '4');
  w('0'); w('ENDSEC');

  // Tables (layers)
  w('0'); w('SECTION'); w('2'); w('TABLES');
  w('0'); w('TABLE'); w('2'); w('LAYER');
  data.layers.forEach(layer => {
    w('0'); w('LAYER');
    w('2'); w(layer.name);
    w('70'); w(layer.frozen ? '1' : '0');
    w('62'); w(layer.visible ? '7' : '-7');
    w('6'); w(layer.lineType === 'solid' ? 'CONTINUOUS' : layer.lineType.toUpperCase());
  });
  w('0'); w('ENDTAB');
  w('0'); w('ENDSEC');

  // Entities
  w('0'); w('SECTION'); w('2'); w('ENTITIES');
  data.entities.forEach(ent => {
    const layerName = data.layers.find(l => l.id === ent.layerId)?.name || '0';
    if (ent.type === 'line') {
      w('0'); w('LINE'); w('8'); w(layerName);
      w('10'); w(String(ent.data.start.x)); w('20'); w(String(ent.data.start.y)); w('30'); w('0');
      w('11'); w(String(ent.data.end.x)); w('21'); w(String(ent.data.end.y)); w('31'); w('0');
    } else if (ent.type === 'line3d') {
      w('0'); w('LINE'); w('8'); w(layerName);
      w('10'); w(String(ent.data.start.x)); w('20'); w(String(ent.data.start.y)); w('30'); w(String(ent.data.start.z));
      w('11'); w(String(ent.data.end.x)); w('21'); w(String(ent.data.end.y)); w('31'); w(String(ent.data.end.z));
    } else if (ent.type === 'circle') {
      w('0'); w('CIRCLE'); w('8'); w(layerName);
      w('10'); w(String(ent.data.center.x)); w('20'); w(String(ent.data.center.y)); w('30'); w('0');
      w('40'); w(String(ent.data.radius));
    } else if (ent.type === 'arc') {
      w('0'); w('ARC'); w('8'); w(layerName);
      w('10'); w(String(ent.data.center.x)); w('20'); w(String(ent.data.center.y)); w('30'); w('0');
      w('40'); w(String(ent.data.radius));
      w('50'); w(String(ent.data.startAngle)); w('51'); w(String(ent.data.endAngle));
    } else if (ent.type === 'rectangle') {
      const { origin, width, height } = ent.data;
      w('0'); w('LWPOLYLINE'); w('8'); w(layerName); w('90'); w('4'); w('70'); w('1');
      w('10'); w(String(origin.x)); w('20'); w(String(origin.y));
      w('10'); w(String(origin.x + width)); w('20'); w(String(origin.y));
      w('10'); w(String(origin.x + width)); w('20'); w(String(origin.y + height));
      w('10'); w(String(origin.x)); w('20'); w(String(origin.y + height));
    } else if (ent.type === 'polyline') {
      w('0'); w('LWPOLYLINE'); w('8'); w(layerName);
      w('90'); w(String(ent.data.points.length)); w('70'); w(ent.data.closed ? '1' : '0');
      ent.data.points.forEach((p: any) => { w('10'); w(String(p.x)); w('20'); w(String(p.y)); });
    } else if (ent.type === 'text') {
      w('0'); w('TEXT'); w('8'); w(layerName);
      w('10'); w(String(ent.data.position.x)); w('20'); w(String(ent.data.position.y)); w('30'); w('0');
      w('40'); w(String(ent.data.fontSize)); w('1'); w(ent.data.content);
    }
  });
  w('0'); w('ENDSEC');
  w('0'); w('EOF');
  return lines.join('\n');
}

/* ── DXF Import ──────────────────────────────────── */
export function importDXF(content: string, activeLayerId: string): AnyCADEntity[] {
  const lines = content.split('\n').map(l => l.trim());
  const entities: AnyCADEntity[] = [];
  let i = 0;
  const next = () => (i < lines.length ? lines[i++] : '');

  while (i < lines.length) {
    const code = next();
    const value = next();
    if (code === '0' && value === 'LINE') {
      const ent: any = { id: crypto.randomUUID(), type: 'line', layerId: activeLayerId, data: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } } };
      let hasZ = false;
      while (i < lines.length) {
        const c = lines[i]; const v = lines[i + 1];
        if (c === '0') break;
        i += 2;
        if (c === '10') ent.data.start.x = parseFloat(v);
        if (c === '20') ent.data.start.y = parseFloat(v);
        if (c === '30' && parseFloat(v) !== 0) { hasZ = true; (ent.data.start as any).z = parseFloat(v); }
        if (c === '11') ent.data.end.x = parseFloat(v);
        if (c === '21') ent.data.end.y = parseFloat(v);
        if (c === '31' && parseFloat(v) !== 0) { hasZ = true; (ent.data.end as any).z = parseFloat(v); }
      }
      if (hasZ) {
        ent.type = 'line3d';
        ent.data.start.z = ent.data.start.z || 0;
        ent.data.end.z = ent.data.end.z || 0;
      }
      entities.push(ent);
    } else if (code === '0' && value === 'CIRCLE') {
      const ent: any = { id: crypto.randomUUID(), type: 'circle', layerId: activeLayerId, data: { center: { x: 0, y: 0 }, radius: 1 } };
      while (i < lines.length) {
        const c = lines[i]; const v = lines[i + 1];
        if (c === '0') break;
        i += 2;
        if (c === '10') ent.data.center.x = parseFloat(v);
        if (c === '20') ent.data.center.y = parseFloat(v);
        if (c === '40') ent.data.radius = parseFloat(v);
      }
      entities.push(ent);
    } else if (code === '0' && value === 'ARC') {
      const ent: any = { id: crypto.randomUUID(), type: 'arc', layerId: activeLayerId, data: { center: { x: 0, y: 0 }, radius: 1, startAngle: 0, endAngle: 360 } };
      while (i < lines.length) {
        const c = lines[i]; const v = lines[i + 1];
        if (c === '0') break;
        i += 2;
        if (c === '10') ent.data.center.x = parseFloat(v);
        if (c === '20') ent.data.center.y = parseFloat(v);
        if (c === '40') ent.data.radius = parseFloat(v);
        if (c === '50') ent.data.startAngle = parseFloat(v);
        if (c === '51') ent.data.endAngle = parseFloat(v);
      }
      entities.push(ent);
    } else if (code === '0' && value === 'TEXT') {
      const ent: any = { id: crypto.randomUUID(), type: 'text', layerId: activeLayerId, data: { position: { x: 0, y: 0 }, content: '', fontSize: 10, fontFamily: 'monospace' } };
      while (i < lines.length) {
        const c = lines[i]; const v = lines[i + 1];
        if (c === '0') break;
        i += 2;
        if (c === '10') ent.data.position.x = parseFloat(v);
        if (c === '20') ent.data.position.y = parseFloat(v);
        if (c === '40') ent.data.fontSize = parseFloat(v);
        if (c === '1') ent.data.content = v;
      }
      entities.push(ent);
    }
  }
  return entities;
}

/* ── SVG Export ──────────────────────────────────── */
export function exportSVG(data: CADProjectData, width = 1000, height = 800): string {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  data.entities.forEach(e => {
    if (e.type === 'line') { minX = Math.min(minX, e.data.start.x, e.data.end.x); maxX = Math.max(maxX, e.data.start.x, e.data.end.x); minY = Math.min(minY, e.data.start.y, e.data.end.y); maxY = Math.max(maxY, e.data.start.y, e.data.end.y); }
    if (e.type === 'circle') { minX = Math.min(minX, e.data.center.x - e.data.radius); maxX = Math.max(maxX, e.data.center.x + e.data.radius); minY = Math.min(minY, e.data.center.y - e.data.radius); maxY = Math.max(maxY, e.data.center.y + e.data.radius); }
    if (e.type === 'rectangle') { minX = Math.min(minX, e.data.origin.x); maxX = Math.max(maxX, e.data.origin.x + e.data.width); minY = Math.min(minY, e.data.origin.y); maxY = Math.max(maxY, e.data.origin.y + e.data.height); }
  });
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = width; maxY = height; }
  const pad = 20;
  const vb = `${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}`;

  const parts: string[] = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${width}" height="${height}">`];
  data.entities.forEach(ent => {
    const col = ent.color || data.layers.find(l => l.id === ent.layerId)?.color || '#fff';
    const sw = ent.lineWeight || 1;
    if (ent.type === 'line') parts.push(`<line x1="${ent.data.start.x}" y1="${ent.data.start.y}" x2="${ent.data.end.x}" y2="${ent.data.end.y}" stroke="${col}" stroke-width="${sw}" />`);
    else if (ent.type === 'circle') parts.push(`<circle cx="${ent.data.center.x}" cy="${ent.data.center.y}" r="${ent.data.radius}" stroke="${col}" fill="none" stroke-width="${sw}" />`);
    else if (ent.type === 'rectangle') parts.push(`<rect x="${ent.data.origin.x}" y="${ent.data.origin.y}" width="${ent.data.width}" height="${ent.data.height}" stroke="${col}" fill="none" stroke-width="${sw}" />`);
    else if (ent.type === 'arc') {
      const { center, radius, startAngle, endAngle } = ent.data;
      const sx = center.x + radius * Math.cos(startAngle * Math.PI / 180);
      const sy = center.y + radius * Math.sin(startAngle * Math.PI / 180);
      const ex = center.x + radius * Math.cos(endAngle * Math.PI / 180);
      const ey = center.y + radius * Math.sin(endAngle * Math.PI / 180);
      const large = (endAngle - startAngle + 360) % 360 > 180 ? 1 : 0;
      parts.push(`<path d="M ${sx} ${sy} A ${radius} ${radius} 0 ${large} 1 ${ex} ${ey}" stroke="${col}" fill="none" stroke-width="${sw}" />`);
    }
    else if (ent.type === 'text') parts.push(`<text x="${ent.data.position.x}" y="${ent.data.position.y}" font-size="${ent.data.fontSize}" fill="${col}" font-family="${ent.data.fontFamily || 'monospace'}">${ent.data.content}</text>`);
    else if (ent.type === 'polyline') {
      const pts = ent.data.points.map((p: any) => `${p.x},${p.y}`).join(' ');
      if (ent.data.closed) parts.push(`<polygon points="${pts}" stroke="${col}" fill="none" stroke-width="${sw}" />`);
      else parts.push(`<polyline points="${pts}" stroke="${col}" fill="none" stroke-width="${sw}" />`);
    }
    else if (ent.type === 'ellipse') parts.push(`<ellipse cx="${ent.data.center.x}" cy="${ent.data.center.y}" rx="${ent.data.radiusX}" ry="${ent.data.radiusY}" stroke="${col}" fill="none" stroke-width="${sw}" />`);
  });
  parts.push('</svg>');
  return parts.join('\n');
}

/* ── SVG Import ──────────────────────────────────── */
export function importSVG(content: string, activeLayerId: string): AnyCADEntity[] {
  const entities: AnyCADEntity[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'image/svg+xml');

  doc.querySelectorAll('line').forEach(el => {
    entities.push({ id: crypto.randomUUID(), type: 'line', layerId: activeLayerId, data: { start: { x: parseFloat(el.getAttribute('x1') || '0'), y: parseFloat(el.getAttribute('y1') || '0') }, end: { x: parseFloat(el.getAttribute('x2') || '0'), y: parseFloat(el.getAttribute('y2') || '0') } } });
  });
  doc.querySelectorAll('circle').forEach(el => {
    entities.push({ id: crypto.randomUUID(), type: 'circle', layerId: activeLayerId, data: { center: { x: parseFloat(el.getAttribute('cx') || '0'), y: parseFloat(el.getAttribute('cy') || '0') }, radius: parseFloat(el.getAttribute('r') || '10') } });
  });
  doc.querySelectorAll('rect').forEach(el => {
    entities.push({ id: crypto.randomUUID(), type: 'rectangle', layerId: activeLayerId, data: { origin: { x: parseFloat(el.getAttribute('x') || '0'), y: parseFloat(el.getAttribute('y') || '0') }, width: parseFloat(el.getAttribute('width') || '100'), height: parseFloat(el.getAttribute('height') || '100') } });
  });
  doc.querySelectorAll('ellipse').forEach(el => {
    entities.push({ id: crypto.randomUUID(), type: 'ellipse', layerId: activeLayerId, data: { center: { x: parseFloat(el.getAttribute('cx') || '0'), y: parseFloat(el.getAttribute('cy') || '0') }, radiusX: parseFloat(el.getAttribute('rx') || '10'), radiusY: parseFloat(el.getAttribute('ry') || '10') } });
  });
  return entities;
}

/* ── STL Export ──────────────────────────────────── */
export function exportSTL(data: CADProjectData): string {
  const lines: string[] = ['solid cadstudio'];
  data.entities.forEach(ent => {
    if (ent.type === 'box3d' || ent.type === 'wall') {
      const d = ent.data as any;
      const o = d.origin || d.base;
      const w = d.width; const dp = d.depth; const h = d.height;
      const verts = [
        [o.x, o.y, o.z], [o.x + w, o.y, o.z], [o.x + w, o.y + dp, o.z], [o.x, o.y + dp, o.z],
        [o.x, o.y, o.z + h], [o.x + w, o.y, o.z + h], [o.x + w, o.y + dp, o.z + h], [o.x, o.y + dp, o.z + h],
      ];
      const faces = [
        [0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[2,6,7],[2,7,3],[0,3,7],[0,7,4],[1,5,6],[1,6,2],
      ];
      faces.forEach(f => {
        const a = verts[f[0]], b = verts[f[1]], c = verts[f[2]];
        lines.push(`  facet normal 0 0 0`);
        lines.push(`    outer loop`);
        lines.push(`      vertex ${a[0]} ${a[1]} ${a[2]}`);
        lines.push(`      vertex ${b[0]} ${b[1]} ${b[2]}`);
        lines.push(`      vertex ${c[0]} ${c[1]} ${c[2]}`);
        lines.push(`    endloop`);
        lines.push(`  endfacet`);
      });
    } else if (ent.type === 'column') {
      const { base, radius, height } = ent.data;
      const segments = 16;
      for (let s = 0; s < segments; s++) {
        const a1 = (s / segments) * Math.PI * 2;
        const a2 = ((s + 1) / segments) * Math.PI * 2;
        const bx1 = base.x + radius * Math.cos(a1), by1 = base.y + radius * Math.sin(a1);
        const bx2 = base.x + radius * Math.cos(a2), by2 = base.y + radius * Math.sin(a2);
        // Side faces
        lines.push(`  facet normal 0 0 0\n    outer loop\n      vertex ${bx1} ${by1} ${base.z}\n      vertex ${bx2} ${by2} ${base.z}\n      vertex ${bx2} ${by2} ${base.z + height}\n    endloop\n  endfacet`);
        lines.push(`  facet normal 0 0 0\n    outer loop\n      vertex ${bx1} ${by1} ${base.z}\n      vertex ${bx2} ${by2} ${base.z + height}\n      vertex ${bx1} ${by1} ${base.z + height}\n    endloop\n  endfacet`);
      }
    }
  });
  lines.push('endsolid cadstudio');
  return lines.join('\n');
}

/* ── OBJ Export ──────────────────────────────────── */
export function exportOBJ(data: CADProjectData): string {
  const lines: string[] = ['# CAD Studio OBJ Export'];
  let vertIdx = 1;
  data.entities.forEach(ent => {
    if (ent.type === 'box3d' || ent.type === 'wall') {
      const d = ent.data as any;
      const o = d.origin || d.base;
      const w = d.width; const dp = d.depth; const h = d.height;
      lines.push(`v ${o.x} ${o.y} ${o.z}`);
      lines.push(`v ${o.x + w} ${o.y} ${o.z}`);
      lines.push(`v ${o.x + w} ${o.y + dp} ${o.z}`);
      lines.push(`v ${o.x} ${o.y + dp} ${o.z}`);
      lines.push(`v ${o.x} ${o.y} ${o.z + h}`);
      lines.push(`v ${o.x + w} ${o.y} ${o.z + h}`);
      lines.push(`v ${o.x + w} ${o.y + dp} ${o.z + h}`);
      lines.push(`v ${o.x} ${o.y + dp} ${o.z + h}`);
      const s = vertIdx;
      lines.push(`f ${s} ${s+1} ${s+2} ${s+3}`);
      lines.push(`f ${s+4} ${s+7} ${s+6} ${s+5}`);
      lines.push(`f ${s} ${s+4} ${s+5} ${s+1}`);
      lines.push(`f ${s+2} ${s+6} ${s+7} ${s+3}`);
      lines.push(`f ${s} ${s+3} ${s+7} ${s+4}`);
      lines.push(`f ${s+1} ${s+5} ${s+6} ${s+2}`);
      vertIdx += 8;
    }
  });
  return lines.join('\n');
}

/* ── JSON Project Export/Import ──────────────────── */
export function exportJSON(data: CADProjectData): string {
  return JSON.stringify(data, null, 2);
}

export function importJSON(content: string): CADProjectData | null {
  try {
    const data = JSON.parse(content);
    if (data.entities && data.layers) return data;
    return null;
  } catch { return null; }
}

/* ── File download helper ───────────────────────── */
export function downloadFile(content: string, filename: string, mime = 'text/plain') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
