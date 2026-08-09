import * as THREE from 'three';

/*
 * The office kit: one palette, one set of materials, one set of geometry
 * helpers — everything the office is built from.
 *
 * It exists so the building, the furniture and the people cannot drift
 * apart. The reference photograph the office is modelled on is a bright,
 * high-key room: near-white concrete and plaster, warm oak desking, tan
 * leather in the lounge, charcoal task chairs, black server racks, and
 * colour arriving almost entirely through the people and the sticky
 * notes. Every material below is tuned to that, and nothing should add a
 * new colour without a reason you could say out loud.
 *
 * Textures are drawn on canvases rather than fetched: the office must
 * render identically with the network unplugged, and a blocked CDN must
 * never be able to turn the room grey.
 */

/* ── palette ──────────────────────────────────────────────────────── */
export const C = {
  concrete: 0xeceef2,      // polished floor
  slab: 0xe1e4ea,          // slab edge, seen in the cutaway
  plaster: 0xf7f8fa,       // walls
  column: 0xf1f2f6,
  oak: 0xd6b183,           // desk tops
  oakDark: 0xb98e5e,
  legWhite: 0xe8eaee,      // desk frames
  charcoal: 0x474d5a,      // task chairs
  mesh: 0x5b6270,
  leather: 0xa9714a,       // lounge sofas
  leatherDark: 0x8d5a37,
  rug: 0xe7e1d6,
  rack: 0x1b1e25,          // server racks
  steel: 0xb9bec8,
  chrome: 0xd7dbe2,
  glass: 0xdfe9f4,
  screen: 0x11141c,
  soil: 0x4a3a2c,
  leaf: 0x4f8a4a,
  pot: 0xf2f3f5,
  potTerracotta: 0xbf7f5a,
} as const;

/* ── material factory ─────────────────────────────────────────────── */
export function M(color: number, rough = .85, metal = 0, opts: {
  transparent?: boolean; opacity?: number; emissive?: number; emissiveIntensity?: number;
  map?: THREE.Texture | null; side?: THREE.Side; flatShading?: boolean;
} = {}) {
  return new THREE.MeshStandardMaterial({
    color, roughness: rough, metalness: metal,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    map: opts.map ?? null,
    side: opts.side ?? THREE.FrontSide,
    flatShading: opts.flatShading ?? false,
  });
}

/* ── rounded box: the shape language of the whole room ────────────── */
const boxCache = new Map<string, THREE.BufferGeometry>();
export function rbox(w: number, h: number, d: number, r = .02, seg = 2) {
  const key = `${w}|${h}|${d}|${r}|${seg}`;
  const hit = boxCache.get(key);
  if (hit) return hit;
  const rr = Math.min(r, w / 2, h / 2, d / 2);
  const s = new THREE.Shape();
  const hw = w / 2, hh = h / 2;
  s.moveTo(-hw + rr, -hh);
  s.lineTo(hw - rr, -hh); s.quadraticCurveTo(hw, -hh, hw, -hh + rr);
  s.lineTo(hw, hh - rr); s.quadraticCurveTo(hw, hh, hw - rr, hh);
  s.lineTo(-hw + rr, hh); s.quadraticCurveTo(-hw, hh, -hw, hh - rr);
  s.lineTo(-hw, -hh + rr); s.quadraticCurveTo(-hw, -hh, -hw + rr, -hh);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: d, bevelEnabled: rr > .012, bevelSize: rr * .5, bevelThickness: rr * .5,
    bevelSegments: seg, curveSegments: seg + 1,
  });
  g.translate(0, 0, -d / 2);
  g.computeVertexNormals();
  boxCache.set(key, g);
  return g;
}

/* ── placement helper ─────────────────────────────────────────────── */
export function add(
  parent: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material,
  x: number, y: number, z: number, ry = 0,
) {
  const mesh = new THREE.Mesh(g, m);
  mesh.position.set(x, y, z);
  if (ry) mesh.rotation.y = ry;
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

/* A soft contact shadow. Real shadow maps cannot hold a room this size
   at this resolution, so furniture carries its own grounding. */
let aoTex: THREE.Texture | null = null;
export function contactShadow(parent: THREE.Object3D, x: number, z: number, size: number, strength = .3) {
  if (!aoTex) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, 'rgba(30,38,60,.55)');
    grad.addColorStop(.45, 'rgba(30,38,60,.22)');
    grad.addColorStop(1, 'rgba(30,38,60,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    aoTex = new THREE.CanvasTexture(c);
  }
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, opacity: strength, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, .012, z);
  m.renderOrder = -1;
  parent.add(m);
  return m;
}

/* ── canvas textures ──────────────────────────────────────────────── */
export function ctex(
  w: number, h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
  rep?: [number, number],
) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
  t.userData = { ctx: c.getContext('2d'), canvas: c };
  return t;
}

/** Polished concrete: large pours, hairline joints, a faint speckle. */
export const floorTexture = () => ctex(512, 512, (g, w, h) => {
  g.fillStyle = '#edeef2'; g.fillRect(0, 0, w, h);
  const grad = g.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, 'rgba(255,255,255,.5)');
  grad.addColorStop(1, 'rgba(214,219,228,.35)');
  g.fillStyle = grad; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(196,202,214,.75)'; g.lineWidth = 1.6;
  g.strokeRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(126,136,160,${Math.random() * .045})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1.3, 1.3);
  }
}, [4, 3.2]);

/** European oak: warm, straight-grained, no orange. */
export const oakTexture = () => ctex(256, 256, (g, w, h) => {
  g.fillStyle = '#d9b688'; g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) {
    g.fillStyle = `rgba(150,105,58,${.03 + Math.random() * .05})`;
    g.fillRect(0, y, w, 1);
  }
  for (let i = 0; i < 6; i++) {
    g.strokeStyle = 'rgba(132,92,50,.2)'; g.lineWidth = 1.2 + Math.random();
    g.beginPath();
    const y = Math.random() * h;
    g.moveTo(0, y); g.bezierCurveTo(w * .3, y + 7, w * .65, y - 7, w, y + 3);
    g.stroke();
  }
});

/** A low, wide city: towers in haze, a treeline, sky gradient. Drawn
    rather than photographed so the room owns its own weather. */
export const skylineTexture = () => ctex(1024, 512, (g, w, h) => {
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#8fbce4');
  sky.addColorStop(.45, '#bcd8ee');
  sky.addColorStop(.78, '#dfeaf4');
  sky.addColorStop(1, '#eef3f7');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);

  for (let i = 0; i < 26; i++) {
    const cw = 26 + Math.random() * 74;
    const ch = 90 + Math.random() * 250;
    const x = Math.random() * (w + 120) - 60;
    const y = h * .74 - ch;
    const haze = .22 + (ch / 340) * .3;
    g.fillStyle = `rgba(126,152,184,${haze})`;
    g.fillRect(x, y, cw, ch);
    g.fillStyle = `rgba(255,255,255,${haze * .5})`;
    for (let r = 0; r < Math.floor(ch / 16); r++) {
      for (let c = 0; c < Math.floor(cw / 12); c++) {
        if (Math.random() > .55) g.fillRect(x + 4 + c * 12, y + 8 + r * 16, 5, 8);
      }
    }
  }
  g.fillStyle = '#cfe0ec'; g.fillRect(0, h * .72, w, h * .1);
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * w;
    const r = 16 + Math.random() * 30;
    const y = h * .80 + Math.random() * 26;
    g.fillStyle = `rgba(${86 + Math.random() * 26 | 0},${132 + Math.random() * 30 | 0},${74 + Math.random() * 26 | 0},.9)`;
    g.beginPath(); g.ellipse(x, y, r, r * .72, 0, 0, 7); g.fill();
  }
  g.fillStyle = '#dfe6ec'; g.fillRect(0, h * .93, w, h * .07);
});

/** A dashboard, for monitors and the video wall. */
export const dashTexture = () => ctex(384, 240, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f3f5f9'; g.fillRect(0, 0, w, 28); g.fillRect(0, 28, 58, h);
  g.fillStyle = '#141a28'; g.fillRect(12, 10, 46, 8);
  for (let i = 0; i < 5; i++) { g.fillStyle = '#dadfe9'; g.fillRect(12, 44 + i * 22, 34, 7); }
  const card = (x: number, y: number, cw: number, ch: number) => {
    g.fillStyle = '#fff'; g.strokeStyle = '#e6e9f1'; g.lineWidth = 1.4;
    g.fillRect(x, y, cw, ch); g.strokeRect(x, y, cw, ch);
  };
  card(72, 40, 138, 80); card(220, 40, 148, 80); card(72, 130, 296, 92);
  g.fillStyle = '#2563eb';
  [24, 38, 30, 48, 41, 56, 50].forEach((v, i) => g.fillRect(84 + i * 17, 112 - v, 10, v));
  g.strokeStyle = '#6d3fd4'; g.lineWidth = 2.4; g.beginPath();
  [58, 50, 56, 42, 38, 44, 32].forEach((v, i) => {
    const x = 232 + i * 19; i ? g.lineTo(x, 48 + v * .62) : g.moveTo(x, 48 + v * .62);
  }); g.stroke();
  g.strokeStyle = '#35c26b'; g.lineWidth = 2; g.beginPath();
  for (let i = 0; i < 16; i++) {
    const x = 86 + i * 18, y = 196 - Math.sin(i * .68) * 20 - Math.random() * 9;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  } g.stroke();
});

/** An editor, for the build desks. */
export const codeTexture = () => ctex(384, 240, (g, w, h) => {
  g.fillStyle = '#12151f'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1b2030'; g.fillRect(0, 0, w, 22);
  ['#e05252', '#e0b452', '#52c072'].forEach((c, i) => {
    g.fillStyle = c; g.beginPath(); g.arc(15 + i * 15, 11, 3.4, 0, 7); g.fill();
  });
  const cols = ['#7fd4ff', '#c792ea', '#c3e88d', '#ffcb6b', '#f78c6c', '#55658c'];
  for (let l = 0; l < 12; l++) {
    const y = 38 + l * 16;
    g.fillStyle = '#3a445c'; g.font = '10px monospace'; g.fillText(String(l + 1), 10, y + 8);
    let x = 30 + (l % 3) * 14;
    for (let s = 0; s < 2 + Math.floor(Math.random() * 3); s++) {
      const len = 22 + Math.random() * 78;
      g.fillStyle = cols[Math.floor(Math.random() * cols.length)];
      g.globalAlpha = .9; g.fillRect(x, y, len, 7); g.globalAlpha = 1;
      x += len + 10;
    }
  }
});

/** The kanban wall: a grid of small colourful notes on white board. */
export const kanbanTexture = () => ctex(512, 320, (g, w, h) => {
  g.fillStyle = '#fbfcfd'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#e4e7ee'; g.lineWidth = 2;
  const cols = 4;
  for (let i = 1; i < cols; i++) {
    g.beginPath(); g.moveTo(i * w / cols, 12); g.lineTo(i * w / cols, h - 12); g.stroke();
  }
  const notes = ['#ffd76e', '#ffb3c1', '#a7d8ff', '#b9f0c8', '#e2c9ff', '#ffd0a6'];
  for (let c = 0; c < cols; c++) {
    g.fillStyle = '#aab2c2'; g.fillRect(c * w / cols + 16, 18, 46, 7);
    const n = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const x = c * w / cols + 14 + (i % 2) * 56;
      const y = 40 + Math.floor(i / 2) * 58 + Math.random() * 6;
      g.save();
      g.translate(x + 24, y + 22); g.rotate((Math.random() - .5) * .12); g.translate(-24, -22);
      g.fillStyle = 'rgba(20,26,44,.10)'; g.fillRect(2, 3, 48, 44);
      g.fillStyle = notes[Math.floor(Math.random() * notes.length)];
      g.fillRect(0, 0, 48, 44);
      g.fillStyle = 'rgba(60,50,30,.42)';
      for (let l = 0; l < 3; l++) g.fillRect(6, 10 + l * 10, 36 - Math.random() * 14, 3);
      g.restore();
    }
  }
});

/** A whiteboard with a plan on it. */
export const whiteboardTexture = () => ctex(512, 288, (g, w, h) => {
  g.fillStyle = '#fdfdfe'; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#3f6bd8'; g.lineWidth = 3;
  const boxes: [number, number][] = [[70, 70], [230, 60], [230, 150], [390, 105]];
  boxes.forEach(([x, y]) => { g.strokeRect(x, y, 84, 52); });
  g.strokeStyle = '#8b93a6'; g.lineWidth = 2.4;
  const link = (a: number, b: number) => {
    g.beginPath();
    g.moveTo(boxes[a][0] + 84, boxes[a][1] + 26);
    g.lineTo(boxes[b][0], boxes[b][1] + 26);
    g.stroke();
  };
  link(0, 1); link(0, 2); link(1, 3); link(2, 3);
  g.fillStyle = 'rgba(70,80,100,.5)';
  boxes.forEach(([x, y]) => { for (let i = 0; i < 3; i++) g.fillRect(x + 10, y + 14 + i * 11, 60 - i * 12, 4); });
  g.strokeStyle = '#e0446b'; g.lineWidth = 3;
  g.beginPath(); g.ellipse(432, 200, 46, 26, -.2, 0, 7); g.stroke();
});

/** Server rack front: blanking panels, drive rows, a few status LEDs. */
export const rackTexture = () => ctex(128, 384, (g, w, h) => {
  g.fillStyle = '#171a21'; g.fillRect(0, 0, w, h);
  for (let u = 0; u < 22; u++) {
    const y = 8 + u * 17;
    const kind = Math.random();
    if (kind < .18) { g.fillStyle = '#1d212a'; g.fillRect(6, y, w - 12, 14); continue; }
    g.fillStyle = '#22262f'; g.fillRect(6, y, w - 12, 14);
    g.fillStyle = '#2c313c';
    for (let d = 0; d < 6; d++) g.fillRect(10 + d * 18, y + 3, 15, 8);
    if (Math.random() > .45) {
      g.fillStyle = Math.random() > .25 ? '#3ddc84' : '#4aa8ff';
      g.fillRect(w - 16, y + 5, 4, 4);
    }
  }
});

/** The floor-plate directory panel seen on the far wall. */
export const directoryTexture = () => ctex(384, 512, (g, w, h) => {
  g.fillStyle = '#fbfcfd'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#121826'; g.fillRect(0, 0, w, 74);
  g.fillStyle = '#fff'; g.font = 'bold 26px sans-serif'; g.fillText('QUOORO', 26, 46);
  const rows = ['Build Bay', 'QA Lab', 'Studio', 'Deploy Bay', 'Vault', 'Lounge'];
  rows.forEach((r, i) => {
    const y = 108 + i * 62;
    g.fillStyle = '#eef1f6'; g.fillRect(24, y, w - 48, 46);
    g.fillStyle = '#333a4b';
    g.font = '20px sans-serif'; g.fillText(r, 40, y + 30);
    g.fillStyle = '#98a1b4'; g.font = '15px monospace';
    g.fillText(String(i + 1).padStart(2, '0'), w - 66, y + 30);
  });
});
