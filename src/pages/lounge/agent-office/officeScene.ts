import * as THREE from 'three';
import {
  floorTexture, oakTexture, skylineTexture, kanbanTexture, rackTexture, whiteboardTexture,
} from './officeKit';

/*
 * The isometric office, rebuilt 1:1 against the approved reference
 * render: a bright two-storey cutaway with a double-height curtain wall
 * and city skyline on the left, a tan-leather lounge in the front
 * corner, three oak benching clusters on grey carpet in the Build Bay,
 * a server row and Deploy Bay on the right, and a mezzanine carrying
 * the Studio, QA Lab, Strategy Wall, Kanban Wall, the glass Vault and
 * two overlook balconies behind a glass balustrade.
 *
 * What this module is - and is not. It is the ANIMATION LAYER: a local,
 * client-side simulation loop that walks characters around, sits them at
 * desks and lets them fetch coffee. It has zero connection to model
 * invocation; it would run identically with the network unplugged, and
 * an idle agent costs nothing. Not one token. If you are looking for the
 * thing that spawns Claude, it is the bridge daemon - nothing in this
 * file, or this app, ever calls a model.
 *
 * Real state comes IN through the returned handle (bridge status, agent
 * run states, token counts); intentions go OUT through opts callbacks
 * (new task, open console). Numbers are never invented: a figure the
 * database has not supplied renders as an em dash.
 */

export type OfficeAgentState = 'idle' | 'assigned' | 'working' | 'blocked' | 'failed' | 'throttled' | 'offline';

/* The mesh, as the office wears it: which brain sits at each desk, what
   it costs, and whether it is currently allowed to think. */
export interface AgentMeshInfo {
  model: string | null;          // the model this agent actually resolves to
  costClass: string | null;      // free | local | subscription | script
  pin: string | null;            // explicit registry pin, if any
  strict: boolean;
  chain: string[];               // fallback chain, in order
  throttledUntil: string | null; // ISO when its model's cooldown/park lifts
  offline: boolean;              // its lane is down (bridge/provider)
}
export interface FleetWallRow {
  id: string; costClass: string; health: number | null;
  calls: number | null; cap: number | null; parked: boolean; cooling: boolean;
}
export interface RegistryOption {
  id: string; costClass: string; healthy: boolean; remaining: number | null;
}

export interface OfficeSceneHandle {
  dispose(): void;
  setBridgeLine(text: string): void;
  setAgentState(roleKey: string, state: OfficeAgentState | null): void;
  setAgentTokens(map: Record<string, number>): void;
  setAgentMesh(roleKey: string, info: AgentMeshInfo): void;
  setRegistry(rows: RegistryOption[]): void;
  setTeams(teams: { name: string; members: string[] }[]): void;
  setFleetWall(rows: FleetWallRow[]): void;
  setMeters(m: { fiveHourPct: number | null; weeklyPct: number | null }): void;
  setTranslucent(on: boolean): void;
  feed(line: string): void;
  assignMoment(roleKeys: string[]): void;
  cascade(line: string, toKey?: string | null): void;
}

export interface OfficeSceneOpts {
  onNewTask(preselect: string | null): void;
  onOpenConsole(): void;
  onSetModel?(roleKey: string, patch: { pin: string | null; strict: boolean; chain: string[] }): void;
  onSetGroupModel?(teamName: string, pin: string | null): void;
  userInitial: string;
}

/* Cost-class colours - the office's one visual vocabulary for money:
   green runs free, teal runs on the operator's own metal, violet spends
   the subscription seat, grey is a script that never thinks at all. */
export const COST_COLOURS: Record<string, string> = {
  free: '#35c26b', local: '#0d9488', subscription: '#6d3fd4', script: '#98a1b4',
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
.qao{--ink:#0f1524;--ink2:#59637a;--ink3:#97a0b5;--hair:#e3e7ef;--bg:#f6f7fb;
  --disp:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;
  --mono:'JetBrains Mono',ui-monospace,Menlo,monospace;
  display:flex;height:100%;width:100%;font-family:var(--disp);color:var(--ink);
  background:radial-gradient(1500px 950px at 40% -20%,#fff 0%,#f3f4f9 50%,#e8eaf1 100%)}
.qao *{box-sizing:border-box;margin:0;padding:0}
.qao .scene{position:relative;overflow:hidden;touch-action:none;flex:1}
.qao canvas{display:block;position:absolute;inset:0}
.qao .labels{position:absolute;inset:0;pointer-events:none;z-index:5}
.qao .chip{position:absolute;transform:translate(-50%,-100%);background:#fff;border:1px solid #e7eaf1;
  border-radius:11px;padding:5px 10px 6px;white-space:nowrap;transition:opacity .35s;
  box-shadow:0 14px 34px -14px rgba(16,22,44,.45),0 1px 2px rgba(16,22,44,.05)}
.qao .chip:after{content:"";position:absolute;left:50%;top:100%;width:1px;height:var(--stem,24px);
  background:linear-gradient(#dbe0ea,#dbe0ea00)}
.qao .chip b{display:block;font-size:10.5px;font-weight:600;letter-spacing:-.01em;line-height:1.25}
.qao .chip i{display:block;font-style:normal;font-family:var(--mono);font-size:8px;color:var(--ink3);
  letter-spacing:.07em;text-transform:uppercase;margin-top:2px}
.qao .chip .d{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px;vertical-align:1px}
.qao .chip.agent{padding:4px 8px 5px;border-radius:8px}
.qao .chip.agent b{font-family:var(--mono);font-size:8.5px;font-weight:500;letter-spacing:.05em}
.qao .chip.agent:after{--stem:12px}
.qao .chip.bub{padding:3px 8px;border-radius:10px}
.qao .chip.bub b{font-size:10px;letter-spacing:2px;color:var(--ink3)}
.qao .top{position:absolute;top:0;left:0;right:0;height:58px;z-index:20;display:flex;align-items:center;
  gap:11px;padding:0 20px;background:linear-gradient(#f7f8fce8,#f7f8fc00);backdrop-filter:blur(9px)}
.qao .brand{font-weight:700;font-size:15px;letter-spacing:-.02em}
.qao .brand span{color:var(--ink3);font-weight:500}
.qao .badge{font-family:var(--mono);font-size:7.5px;letter-spacing:.14em;color:var(--ink3);
  border:1px solid var(--hair);border-radius:5px;padding:4px 7px;background:#ffffffc9}
.qao .pres{display:flex;align-items:center;margin-left:auto}
.qao .pav{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:10px;
  font-weight:700;color:#fff;border:2px solid #f8f9fc;margin-left:-6px;background:#2563eb}
.qao .btn{font-family:var(--disp);font-size:12px;font-weight:600;border:1px solid var(--hair);background:#fff;
  color:var(--ink);padding:8px 13px;border-radius:9px;cursor:pointer;transition:.15s}
.qao .btn:hover{border-color:#a9b3c7;transform:translateY(-1px)}
.qao .btn.p{background:var(--ink);color:#fff;border-color:var(--ink)}
.qao .btn:focus-visible{outline:2px solid #2563eb;outline-offset:2px}
.qao .floors{position:absolute;left:18px;top:50%;transform:translateY(-50%);z-index:20;display:flex;
  flex-direction:column;gap:6px}
.qao .fl{width:54px;height:40px;border:1px solid var(--hair);background:#ffffffdd;border-radius:10px;
  cursor:pointer;display:grid;place-items:center;font-family:var(--mono);font-size:10px;
  color:var(--ink3);transition:.16s}
.qao .fl:hover{border-color:#a9b3c7}
.qao .fl.on{background:var(--ink);color:#fff;border-color:var(--ink)}
.qao .fl small{display:block;font-size:7px;opacity:.6;letter-spacing:.1em}
.qao .railtab{position:absolute;right:14px;top:70px;z-index:25;display:none}
.qao.norail .railtab{display:block}
.qao .rail{width:236px;background:#fff;border-left:1px solid var(--hair);z-index:10;display:flex;
  flex-direction:column;overflow:hidden;transition:width .32s cubic-bezier(.4,0,.2,1)}
.qao.norail .rail{width:0;border-left:none}
.qao .rwrap{padding:16px 15px;overflow-y:auto;overflow-x:hidden;flex:1;min-width:236px}
.qao .rtop{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.qao .rh{font-family:var(--mono);font-size:8.5px;letter-spacing:.15em;color:var(--ink3);
  text-transform:uppercase;margin:18px 0 9px}
.qao .rh:first-child{margin-top:0}
.qao .hidebtn{font-family:var(--mono);font-size:8.5px;letter-spacing:.08em;color:var(--ink3);
  border:1px solid var(--hair);background:#fff;border-radius:6px;padding:4px 8px;cursor:pointer}
.qao .hidebtn:hover{color:var(--ink);border-color:#a9b3c7}
.qao .big{font-size:16px;font-weight:600;letter-spacing:-.02em}
.qao .sub{font-size:10.5px;color:var(--ink3);margin-top:2px}
.qao .arow{display:flex;align-items:center;gap:8px;padding:6px 5px;margin:0 -5px;border-radius:7px;
  cursor:pointer;transition:.14s}
.qao .arow:hover{background:#f4f6fa}
.qao .arow.on{background:#eef2f9}
.qao .arow .sw{width:8px;height:8px;border-radius:3px;flex:none}
.qao .arow .nm{font-size:11px;font-weight:500;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qao .arow .fl2{font-family:var(--mono);font-size:8px;color:var(--ink3);margin-right:2px}
.qao .arow .st{font-family:var(--mono);font-size:7.5px;letter-spacing:.05em;text-transform:uppercase}
.qao .mtr{margin:8px 0 4px}
.qao .mtr .l{display:flex;justify-content:space-between;font-family:var(--mono);font-size:8.5px;
  color:var(--ink3);letter-spacing:.05em;margin-bottom:4px}
.qao .mtr .b{height:4px;border-radius:3px;background:#eef0f5;overflow:hidden}
.qao .mtr .f{height:100%;border-radius:3px;transition:width .9s cubic-bezier(.2,.7,.2,1)}
.qao .assign{width:100%;margin-top:14px;background:var(--ink);color:#fff;border:none;border-radius:9px;
  padding:11px;font-family:var(--disp);font-size:11.5px;font-weight:600;cursor:pointer}
.qao .note{font-size:9.5px;line-height:1.55;color:var(--ink3);margin-top:12px}
.qao .insp{display:none}
.qao .insp.on{display:block}
.qao .ov.off{display:none}
.qao .iback{font-family:var(--mono);font-size:8.5px;letter-spacing:.12em;color:var(--ink3);cursor:pointer;
  margin-bottom:12px;display:inline-block}
.qao .iback:hover{color:var(--ink)}
.qao .ihead{display:flex;align-items:center;gap:10px;margin-bottom:4px}
.qao .iav{width:34px;height:34px;border-radius:10px;flex:none;box-shadow:inset 0 -9px 16px rgba(0,0,0,.18)}
.qao .iname{font-size:14px;font-weight:600;letter-spacing:-.01em}
.qao .irole{font-size:10.5px;color:var(--ink3)}
.qao .tags{display:flex;flex-wrap:wrap;gap:4px;margin:11px 0 2px}
.qao .tag{font-family:var(--mono);font-size:8px;letter-spacing:.05em;border:1px solid var(--hair);
  border-radius:5px;padding:3px 6px;color:var(--ink2);background:#fafbfd}
.qao .tag.g{border-color:#f2d9a8;background:#fdf7ec;color:#946a12}
.qao .kv{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f3f8;font-size:11px}
.qao .kv b{font-family:var(--mono);font-weight:500;font-size:10px}
.qao .ibtns{display:flex;gap:7px;margin-top:14px}
.qao .ibtns .btn{flex:1;text-align:center;font-size:11px;padding:8px 6px}
.qao .err{position:absolute;inset:0;display:none;place-items:center;text-align:center;padding:40px;
  font-size:13px;color:var(--ink2);z-index:80}
.qao .msel,.qao .mtxt{width:100%;margin-top:6px;font-family:var(--mono);font-size:10px;color:var(--ink);
  border:1px solid var(--hair);border-radius:7px;padding:7px 8px;background:#fff}
.qao .msel:focus,.qao .mtxt:focus{outline:none;border-color:#a9b3c7}
.qao .mchk{display:flex;align-items:center;gap:6px;margin-top:8px;font-family:var(--mono);
  font-size:9px;letter-spacing:.04em;color:var(--ink2);cursor:pointer}
.qao .mchk input{accent-color:#0f1524}
.qao .chip.agent i .cd{color:#b45309}
.qao .chip.owner{border-color:#e6d3a0;background:linear-gradient(#fffdf6,#fff)}
.qao .chip.owner b{color:#4d3a08}
.qao .chip.owner .own{display:inline-block;font-family:var(--mono);font-size:6.5px;font-weight:500;
  letter-spacing:.16em;background:#c3992e;color:#fff;border-radius:3px;padding:1px 4px 1px 5px;
  margin-left:6px;vertical-align:1px}
.qao .btn.m.on{background:#c3992e;border-color:#c3992e;color:#fff}
.qao .arow .ow{font-family:var(--mono);font-size:7px;letter-spacing:.12em;color:#c3992e}
`;

const HTML = `
<div class="scene">
  <div class="labels"></div>
  <div class="err">This view needs WebGL. Try another browser or enable hardware acceleration.</div>
  <div class="top">
    <button class="btn" data-act="back" aria-label="Back to Office">←</button>
    <div class="brand">Quooro <span>/ Agent Office</span></div>
    <span class="badge">OFFICE SIM · QUEUE IS LIVE · IDLE COSTS NOTHING</span>
    <div class="pres">
      <div class="pav" data-el="pav">Q</div>
    </div>
    <button class="btn m" data-act="meet">Meeting</button>
    <button class="btn" data-act="newtask">New task</button>
    <button class="btn p" data-act="console">Console</button>
  </div>
  <div class="floors">
    <button class="fl on" data-f="all">⌂<small>ALL</small></button>
    <button class="fl" data-f="3">03<small>EXEC</small></button>
    <button class="fl" data-f="2">02<small>OPS</small></button>
    <button class="fl" data-f="1">01<small>BUILD</small></button>
  </div>
  <div class="railtab"><button class="btn" data-act="showrail">☰ Overview</button></div>
</div>
<aside class="rail"><div class="rwrap">
  <div class="ov" data-el="ov">
    <div class="rtop"><span class="rh" style="margin:0">System overview</span>
      <button class="hidebtn" data-act="hiderail">HIDE →</button></div>
    <div class="big" data-el="nact">— Agents</div>
    <div class="sub" data-el="nsub">No bridge connected</div>
    <div class="rh">Roster · <span data-el="rfl">All floors</span></div>
    <div data-el="roster"></div>
    <div class="rh">Allowance</div>
    <div class="mtr"><div class="l"><span>5-HOUR</span><span data-el="m1v">—</span></div>
      <div class="b"><div class="f" data-el="m1" style="width:0%;background:#2563eb"></div></div></div>
    <div class="mtr"><div class="l"><span>WEEKLY · HEAVY</span><span data-el="m2v">—</span></div>
      <div class="b"><div class="f" data-el="m2" style="width:0%;background:#6d3fd4"></div></div></div>
    <button class="assign" data-act="newtask2">Assign task</button>
    <div class="rh">Set model for group</div>
    <select class="msel" data-el="gteam" style="margin-top:0"></select>
    <select class="msel" data-el="gmodel"></select>
    <button class="btn" data-act="applygroup" style="width:100%;margin-top:7px;font-size:11px">Apply to group · next task</button>
    <p class="note">Idle motion is a local animation loop — zero allowance. A model process
      spawns only when a bridge claims a dispatched task, and exits on completion.</p>
  </div>
  <div class="insp" data-el="insp"></div>
</div></aside>
`;

export function mountOfficeScene(host: HTMLElement, opts: OfficeSceneOpts): OfficeSceneHandle {
  const root = document.createElement('div');
  root.className = 'qao';
  const style = document.createElement('style');
  style.textContent = CSS;
  root.appendChild(style);
  const inner = document.createElement('div');
  inner.style.cssText = 'display:flex;width:100%;height:100%';
  inner.innerHTML = HTML;
  root.appendChild(inner);
  host.appendChild(root);

  const el = (k: string) => root.querySelector(`[data-el="${k}"]`) as HTMLElement;
  el('pav').textContent = opts.userInitial;
  const sceneHost = root.querySelector('.scene') as HTMLElement;
  const labelsEl = root.querySelector('.labels') as HTMLElement;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

  const disposers: Array<() => void> = [];

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    (root.querySelector('.err') as HTMLElement).style.display = 'grid';
    return {
      dispose: () => { host.removeChild(root); },
      setBridgeLine() {}, setAgentState() {}, setAgentTokens() {}, setMeters() {},
      setAgentMesh() {}, setRegistry() {}, setTeams() {}, setFleetWall() {},
      setTranslucent() {}, feed() {}, assignMoment() {}, cascade() {},
    };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  /* The light rig was tuned under the pre-r155 model; keep it while the
     renderer still offers it, so the reference look survives the upgrade. */
  if ('useLegacyLights' in renderer) (renderer as unknown as { useLegacyLights: boolean }).useLegacyLights = true;
  sceneHost.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  try {
    const pm = new THREE.PMREMGenerator(renderer), env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.SphereGeometry(50, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xdfe6f2, side: THREE.BackSide })));
    const top = new THREE.Mesh(new THREE.CircleGeometry(18, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    top.position.y = 28; top.rotation.x = Math.PI / 2; env.add(top);
    scene.environment = pm.fromScene(env, .35).texture; pm.dispose();
  } catch { /* environment is a nicety, not a requirement */ }

  /* camera: single ortho, params animated */
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 300);
  let F = 33, FT = 33, camY = 4.2, camYT = 4.2, yaw = 0, tYaw = 0, aspect = 1;
  function applyCam() {
    camera.left = -F * aspect; camera.right = F * aspect;
    camera.top = F; camera.bottom = -F; camera.updateProjectionMatrix();
  }

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd3d9e6, .74));
  const key = new THREE.DirectionalLight(0xfff6ea, 1.0);
  key.position.set(18, 30, 15); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6.5; key.shadow.bias = -.00085;
  /* the frustum has to reach a three-storey building on a doubled plate */
  Object.assign(key.shadow.camera, { left: -42, right: 42, top: 48, bottom: -36, near: 1, far: 150 });
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe6eeff, .32); fill.position.set(-14, 14, -10); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, .15); rim.position.set(-7, 8, 16); scene.add(rim);
  const warm = new THREE.PointLight(0xffd9a8, .5, 9, 2); warm.position.set(-7.6, 2.4, 6.4); scene.add(warm);

  /* canvas textures — screens the kit does not carry */
  function ctex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, rep?: [number, number]) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d')!, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); }
    t.userData = { g: c.getContext('2d') };
    return t;
  }
  const codeTex = () => ctex(340, 220, (g, w, h) => {
    g.fillStyle = '#12151f'; g.fillRect(0, 0, w, h); g.fillStyle = '#1b2030'; g.fillRect(0, 0, w, 20);
    ['#e05252', '#e0b452', '#52c072'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(14 + i * 14, 10, 3.4, 0, 7); g.fill(); });
    const cols = ['#7fd4ff', '#c792ea', '#c3e88d', '#ffcb6b', '#f78c6c', '#546a90'];
    for (let l = 0; l < 11; l++) {
      const y = 36 + l * 16;
      g.fillStyle = '#3a445c'; g.font = '10px monospace'; g.fillText(String(l + 1), 10, y + 8);
      let x = 30 + (l % 3) * 14;
      for (let s = 0; s < 2 + Math.floor(Math.random() * 3); s++) {
        const len = 20 + Math.random() * 70;
        g.fillStyle = cols[Math.floor(Math.random() * cols.length)];
        g.globalAlpha = .9; g.fillRect(x, y, len, 7); g.globalAlpha = 1; x += len + 10;
      }
    }
    g.fillStyle = '#7fd4ff'; g.fillRect(30, 36 + 176, 8, 10);
  });
  const dashTex = () => ctex(340, 220, (g, w, h) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f2f4f9'; g.fillRect(0, 0, w, 26); g.fillRect(0, 26, 56, h);
    g.fillStyle = '#101524'; g.fillRect(12, 9, 44, 8);
    for (let i = 0; i < 4; i++) { g.fillStyle = '#d8dde8'; g.fillRect(12, 42 + i * 22, 32, 7); }
    const card = (x: number, y: number, cw: number, ch: number) => {
      g.fillStyle = '#fff'; g.strokeStyle = '#e5e8f0'; g.lineWidth = 1.5;
      g.fillRect(x, y, cw, ch); g.strokeRect(x, y, cw, ch);
    };
    card(68, 38, 120, 74); card(198, 38, 120, 74); card(68, 122, 250, 80);
    g.fillStyle = '#2563eb'; [22, 34, 28, 44, 38, 52, 47].forEach((v, i) => g.fillRect(78 + i * 15, 104 - v, 9, v));
    g.strokeStyle = '#6d3fd4'; g.lineWidth = 2.4; g.beginPath();
    [60, 52, 58, 44, 40, 46, 34].forEach((v, i) => { const x = 208 + i * 15; i ? g.lineTo(x, 44 + v * .6) : g.moveTo(x, 44 + v * .6); }); g.stroke();
    g.strokeStyle = '#35c26b'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i < 14; i++) { const x = 80 + i * 17, y = 178 - Math.sin(i * .7) * 16 - Math.random() * 8; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
  });
  /* Dark ops dashboard, for the video wall - deep navy cards like the reference. */
  const darkDashTex = () => ctex(340, 220, (g, w, h) => {
    g.fillStyle = '#0d1322'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#141c30'; g.fillRect(0, 0, w, 24);
    g.fillStyle = '#3a4a70'; g.fillRect(12, 9, 56, 7);
    const card = (x: number, y: number, cw: number, ch: number) => {
      g.fillStyle = '#111a2e'; g.strokeStyle = '#22declare2e44'; g.strokeStyle = '#222e48'; g.lineWidth = 1.4;
      g.fillRect(x, y, cw, ch); g.strokeRect(x, y, cw, ch);
    };
    card(12, 36, 152, 82); card(176, 36, 152, 82); card(12, 128, 316, 78);
    g.fillStyle = '#3d6ff2';
    [20, 32, 26, 40, 36, 48, 43].forEach((v, i) => g.fillRect(24 + i * 19, 108 - v, 11, v));
    g.strokeStyle = '#37c78f'; g.lineWidth = 2.2; g.beginPath();
    [52, 44, 50, 38, 34, 40, 28].forEach((v, i) => { const x = 190 + i * 19; i ? g.lineTo(x, 46 + v * .68) : g.moveTo(x, 46 + v * .68); }); g.stroke();
    g.strokeStyle = '#e0446b'; g.lineWidth = 1.8; g.beginPath();
    for (let i = 0; i < 15; i++) { const x = 26 + i * 20, y = 182 - Math.abs(Math.sin(i * .84)) * 26; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    for (let r = 0; r < 3; r++) { g.fillStyle = '#26314e'; g.fillRect(24, 140 + r * 18, 120 - r * 22, 6); }
  });
  const termTex = ctex(340, 220, g => { g.fillStyle = '#0d1017'; g.fillRect(0, 0, 340, 220); });
  const termLines: string[] = ['office sim · zero tokens', 'a model runs only on a claimed task'];
  function pushTerm(s: string) {
    termLines.push(s); if (termLines.length > 12) termLines.shift();
    const g = (termTex.userData as { g: CanvasRenderingContext2D }).g;
    g.fillStyle = '#0d1017'; g.fillRect(0, 0, 340, 220); g.font = '10px monospace';
    termLines.forEach((l, i) => {
      g.fillStyle = l[0] === '✓' ? '#4ade80' : l[0] === '›' ? '#7fd4ff' : '#8b98b8';
      g.fillText(l.slice(0, 52), 12, 20 + i * 16);
    });
    g.fillStyle = '#7fd4ff'; g.fillRect(12, 20 + termLines.length * 16 - 9, 7, 10); termTex.needsUpdate = true;
  }
  pushTerm('$ tail -f agent_events');
  const floorTex = floorTexture();
  const oakTex = oakTexture();
  const skyTex = skylineTexture();
  const wbTex = whiteboardTexture();
  const kanbanTex = kanbanTexture();
  const rackTex = rackTexture();

  /* The Fleet wall: a live board by the server row showing the top
     models' real health - drawn from database rows pushed in through
     the handle, redrawn only when they change. An empty fleet says so;
     nothing on this board is ever invented. */
  const fleetCanvas = document.createElement('canvas');
  fleetCanvas.width = 512; fleetCanvas.height = 320;
  const fleetTex = new THREE.CanvasTexture(fleetCanvas);
  fleetTex.colorSpace = THREE.SRGBColorSpace;
  function drawFleetWall(rows: FleetWallRow[]) {
    const g = fleetCanvas.getContext('2d')!;
    g.fillStyle = '#141821'; g.fillRect(0, 0, 512, 320);
    g.fillStyle = '#9aa7c4'; g.font = '600 15px monospace';
    g.fillText('FLEET', 22, 34);
    g.font = '10px monospace'; g.fillStyle = '#5b657e';
    g.fillText('health · calls vs cap · live from the ledger', 92, 34);
    if (!rows.length) {
      g.fillStyle = '#6b7590'; g.font = '12px monospace';
      g.fillText('no models enabled yet — add keys in Fleet Models', 22, 70);
    }
    rows.slice(0, 8).forEach((r, i) => {
      const y = 62 + i * 32;
      g.fillStyle = COST_COLOURS[r.costClass] || '#98a1b4';
      g.beginPath(); g.arc(28, y - 4, 4, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#cdd6ea'; g.font = '11px monospace';
      g.fillText(r.id.length > 34 ? r.id.slice(0, 33) + '…' : r.id, 42, y);
      /* health bar: 1 - error rate; grey when it has never been called */
      g.fillStyle = '#232a3a'; g.fillRect(330, y - 11, 100, 8);
      if (r.health !== null) {
        g.fillStyle = r.health > .7 ? '#35c26b' : r.health > .4 ? '#f5c518' : '#e0446b';
        g.fillRect(330, y - 11, Math.max(4, r.health * 100), 8);
      }
      g.fillStyle = r.parked || r.cooling ? '#f5c518' : '#6b7590'; g.font = '10px monospace';
      const badge = r.parked ? 'PARKED' : r.cooling ? 'COOLING' : '';
      g.fillText(badge || (r.calls === null ? '—' : `${r.calls}${r.cap ? '/' + r.cap : ''}`), 442, y);
    });
    fleetTex.needsUpdate = true;
  }
  drawFleetWall([]);
  const aoTex = ctex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(64, 64, 6, 64, 64, 62);
    gr.addColorStop(0, 'rgba(20,26,48,.34)'); gr.addColorStop(1, 'rgba(20,26,48,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });

  /* geometry & materials */
  function rbox(w: number, h: number, d: number, r?: number, bev?: number) {
    r = Math.max(.002, Math.min(r === undefined ? .09 : r, Math.min(w, d) / 2 - .003));
    bev = bev === undefined ? Math.min(.032, h / 3.4) : bev;
    const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
    s.lineTo(x + w, y + d - r); s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2, false);
    s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
    const g = new THREE.ExtrudeGeometry(s, {
      depth: Math.max(h - bev * 2, .003), bevelEnabled: true,
      bevelThickness: bev, bevelSize: bev, bevelSegments: 2, curveSegments: 8,
    });
    g.rotateX(-Math.PI / 2); g.center(); g.computeVertexNormals(); return g;
  }
  const M = (c: number, ro?: number, me?: number, ei?: number) => new THREE.MeshStandardMaterial({
    color: c, roughness: ro === undefined ? .9 : ro, metalness: me || 0, envMapIntensity: ei === undefined ? .5 : ei,
  });
  const MAT = {
    floor: new THREE.MeshStandardMaterial({ map: floorTex, roughness: .94, envMapIntensity: .35 }),
    slab: M(0xd9dce6, .95), wall: M(0xfbfcff, .97, 0, .3), wall2: M(0xf3f5fa, .97, 0, .3),
    wood: new THREE.MeshStandardMaterial({ map: oakTex, roughness: .58, envMapIntensity: .6 }),
    leg: M(0xe6e8ee, .55, .2, .8), dark: M(0x2e3444, .65), grey: M(0xccd2de, .88),
    soft: M(0xf3f4f8, .96), carpet: M(0x848a95, .98, 0, .2), chair: M(0x3e4450, .82),
    leather: M(0xa9714a, .72, 0, .5), leatherDk: M(0x8d5a37, .74, 0, .45),
    leatherBlk: M(0x2b2e35, .68, 0, .5),
    vault: M(0xe8eaef, .55, .2, .8), vaultTrim: M(0x9aa3b4, .35, .6, 1.1),
    metal: M(0xaeb6c4, .3, .7, 1.2), chrome: M(0xd5dae4, .18, .9, 1.4),
    rack: M(0x1b1e25, .62, .25, .7),
    plant: M(0x5fa578, .92), plant2: M(0x4c9066, .92), pot: M(0xe7e3da, .9),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0xc5dcef, transparent: true, opacity: .2,
      roughness: .05, metalness: 0, envMapIntensity: 1.6, side: THREE.DoubleSide,
    }),
    panel: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xe9f0fb, emissiveIntensity: .26, roughness: .7 }),
    lampWarm: new THREE.MeshStandardMaterial({ color: 0xffe9c4, emissive: 0xffc978, emissiveIntensity: .9, roughness: .5 }),
    ledOn: new THREE.MeshStandardMaterial({ color: 0x9fd9ff, emissive: 0x53b4f2, emissiveIntensity: 1, roughness: .4 }),
    col: M(0xeef0f5, .9),
    sky: new THREE.MeshBasicMaterial({ map: skyTex }),
  };
  function add(p: THREE.Object3D, g: THREE.BufferGeometry, m: THREE.Material, x: number, y: number, z: number, ry?: number) {
    const o = new THREE.Mesh(g, m); o.position.set(x, y, z);
    if (ry) o.rotation.y = ry; o.castShadow = true; o.receiveShadow = true; p.add(o); return o;
  }
  function ao(p: THREE.Object3D, x: number, z: number, s: number) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s),
      new THREE.MeshBasicMaterial({ map: aoTex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, .012, z); p.add(m);
  }
  const screenMat = (t: THREE.Texture) => new THREE.MeshBasicMaterial({ map: t });

  /* props */
  function monitor(p: THREE.Object3D, x: number, z: number, tex: THREE.Texture, ry?: number, wide?: boolean) {
    const m = new THREE.Group(); m.position.set(x, 0, z); m.rotation.y = ry || 0;
    add(m, rbox(.34, .05, .5, .04), MAT.dark, 0, .02, .06);
    add(m, rbox(.08, .34, .08, .03), MAT.leg, 0, .2, .06);
    const w = wide ? 2.1 : 1.55;
    add(m, rbox(w, .94, .06, .045), MAT.dark, 0, .86, 0);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w - .12, .8), screenMat(tex));
    s.position.set(0, .86, .036); m.add(s); p.add(m);
  }
  function laptop(p: THREE.Object3D, x: number, z: number, tex: THREE.Texture, ry?: number, lift?: number) {
    const l = new THREE.Group(); l.position.set(x, lift || 0, z); l.rotation.y = ry || 0;
    add(l, rbox(1.06, .05, .72, .05), M(0xb9c0cc, .35, .6, 1.1), 0, .026, 0);
    add(l, rbox(.86, .012, .42, .03), M(0x2b3140, .5), 0, .055, .02);
    const lid = new THREE.Group(); lid.position.set(0, .05, -.35); lid.rotation.x = -1.16;
    add(lid, rbox(1.06, .035, .7, .05), M(0xb9c0cc, .35, .6, 1.1), 0, 0, .35);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(.94, .58), screenMat(tex));
    sc.position.set(0, .024, .35); sc.rotation.x = -Math.PI / 2; lid.add(sc);
    l.add(lid); p.add(l);
  }
  function desk(p: THREE.Object3D, x: number, z: number, ry?: number, o?: { dual?: number; wide?: number; laptop?: number; t1?: THREE.Texture; t2?: THREE.Texture }) {
    o = o || {}; const d = new THREE.Group(); d.position.set(x, 0, z); d.rotation.y = ry || 0;
    add(d, rbox(3.5, .14, 1.65, .09), MAT.wood, 0, .79, 0);
    [-1.55, 1.55].forEach(s => add(d, rbox(.1, .76, 1.45, .05), MAT.leg, s, .38, 0));
    add(d, rbox(3.1, .06, .12, .03), MAT.leg, 0, .2, 0);
    add(d, rbox(1.5, .02, .9, .06), M(0x394358, .9), .15, .87, .28);
    if (o.dual) { monitor(d, -.72, -.32, o.t1 || codeTex(), 0); monitor(d, .74, -.32, o.t2 || dashTex(), 0); }
    else if (o.wide) monitor(d, 0, -.32, o.t1 || dashTex(), 0, true);
    else monitor(d, 0, -.32, o.t1 || codeTex(), 0);
    if (o.laptop) laptop(d, -1.15, .32, termTex, -.4);
    add(d, rbox(1, .045, .36, .03), M(0xe8eaf0, .6), .15, .885, .3);
    add(d, rbox(.2, .045, .3, .09), MAT.soft, .92, .885, .34);
    add(d, rbox(.22, .28, .22, .1), M(0xf0ede6, .85), -1.42, 1, .42);
    add(d, new THREE.CylinderGeometry(.02, .02, .16, 8), MAT.dark, -1.42, 1.2, .42);
    ao(p, x, z, 5.4); p.add(d);
  }
  /* The reference's benching cluster: one long oak top, a low privacy
     spine, four workstations back to back, four chairs. */
  function bench(p: THREE.Object3D, x: number, z: number, ry?: number) {
    const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = ry || 0;
    add(b, rbox(4.9, .14, 2.4, .08), MAT.wood, 0, .79, 0);
    [-2.2, 0, 2.2].forEach(s => add(b, rbox(.12, .76, 2.1, .05), MAT.leg, s, .38, 0));
    add(b, rbox(4.5, .3, .07, .03), M(0xd8dbe2, .8), 0, 1.0, 0);
    [[-1.1, -.62], [1.1, -.62], [-1.1, .62], [1.1, .62]].forEach(([mx, mz], i) => {
      monitor(b, mx, mz + (mz < 0 ? -.02 : .02), i % 2 ? dashTex() : codeTex(), mz < 0 ? 0 : Math.PI);
      add(b, rbox(.86, .04, .3, .03), M(0xe8eaf0, .6), mx, .885, mz + (mz < 0 ? .5 : -.5));
    });
    add(b, rbox(.2, .045, .3, .09), MAT.soft, 2.05, .885, .7);
    add(b, rbox(.22, .26, .22, .1), M(0xf0ede6, .85), -2.15, .99, -.8);
    ao(p, x, z, 7);
    p.add(b);
    const cy = ry || 0;
    const cs = Math.cos(cy), sn = Math.sin(cy);
    const seat = (lx: number, lz: number, cr: number) =>
      chair(p, x + lx * cs + lz * sn, z - lx * sn + lz * cs, cr + cy);
    seat(-1.1, 2.05, Math.PI); seat(1.1, 2.05, Math.PI);
    seat(-1.1, -2.05, 0); seat(1.1, -2.05, 0);
  }
  function chair(p: THREE.Object3D, x: number, z: number, ry?: number) {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry || 0;
    add(c, rbox(.84, .14, .8, .2), MAT.chair, 0, .52, 0);
    add(c, rbox(.78, .96, .13, .16), MAT.chair, 0, 1.06, -.36);
    add(c, rbox(.7, .1, .1, .05), MAT.chair, 0, .72, .3);
    add(c, new THREE.CylinderGeometry(.05, .05, .4, 10), MAT.chrome, 0, .3, 0);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      add(c, rbox(.44, .05, .09, .04), MAT.chrome, Math.sin(a) * .24, .06, Math.cos(a) * .24, a);
    }
    ao(p, x, z, 2); p.add(c);
  }
  function plant(p: THREE.Object3D, x: number, z: number, s?: number) {
    s = s || 1; const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
    add(g, new THREE.CylinderGeometry(.3, .24, .55, 14), MAT.pot, 0, .28, 0);
    add(g, new THREE.CylinderGeometry(.04, .06, .7, 8), M(0x7a5c3a, .9), 0, .85, 0);
    add(g, new THREE.SphereGeometry(.5, 16, 13), MAT.plant, 0, 1.4, 0);
    add(g, new THREE.SphereGeometry(.32, 14, 11), MAT.plant2, .3, 1.7, .14);
    add(g, new THREE.SphereGeometry(.27, 14, 11), MAT.plant2, -.28, 1.6, -.18);
    ao(p, x, z, 1.6 * s); p.add(g);
  }
  function glassPanel(p: THREE.Object3D, x: number, z: number, w: number, h: number, ry?: number) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0;
    const m = new THREE.Mesh(rbox(w, h, .06, .04), MAT.glass); m.position.y = h / 2; g.add(m);
    add(g, rbox(w + .08, .08, .15, .05), MAT.metal, 0, .045, 0);
    add(g, rbox(.05, h, .08, .03), MAT.metal, -w / 2, h / 2, 0);
    add(g, rbox(.05, h, .08, .03), MAT.metal, w / 2, h / 2, 0);
    add(g, rbox(w - .3, .05, .07, .03), MAT.chrome, 0, h * .62, 0); p.add(g);
  }
  /* The video wall from the reference: a 3×2 array of dark ops panels in
     a slim black frame, mounted on the mezzanine's back wall. */
  function videoWall(p: THREE.Object3D, x: number, y: number, z: number) {
    const vw = new THREE.Group(); vw.position.set(x, y, z);
    add(vw, rbox(7.9, 4.3, .14, .06), M(0x1d212c, .55, .2, .8), 0, 0, 0);
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(2.44, 1.95), screenMat(darkDashTex()));
      s.position.set(-2.56 + c * 2.56, .99 - r * 2.02, .085); vw.add(s);
    }
    p.add(vw);
  }
  /* The kanban wall: sticky-note queue on a white board, freestanding. */
  function kanbanWall(p: THREE.Object3D, x: number, z: number, ry?: number) {
    const k = new THREE.Group(); k.position.set(x, 0, z); k.rotation.y = ry || 0;
    [-1.55, 1.55].forEach(s => {
      add(k, rbox(.4, .08, .5, .05), MAT.leg, s, .05, 0);
      add(k, rbox(.06, 1, .06, .02), MAT.leg, s, .55, 0);
    });
    add(k, rbox(3.9, 2.3, .1, .08), M(0xffffff, .85), 0, 2.2, 0);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(3.66, 2.06), screenMat(kanbanTex));
    s.position.set(0, 2.2, .06); k.add(s);
    ao(p, x, z, 3); p.add(k);
  }
  /* The Fleet wall: kanban-wall treatment, but the sticky notes are the
     model fleet's live health rows. Sits by the server racks. */
  function fleetWallBoard(p: THREE.Object3D, x: number, z: number, ry?: number) {
    const k = new THREE.Group(); k.position.set(x, 0, z); k.rotation.y = ry || 0;
    [-1.95, 1.95].forEach(s => {
      add(k, rbox(.4, .08, .5, .05), MAT.leg, s, .05, 0);
      add(k, rbox(.06, 1, .06, .02), MAT.leg, s, .55, 0);
    });
    add(k, rbox(4.7, 2.5, .1, .08), M(0x232733, .7), 0, 2.3, 0);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(4.46, 2.26), screenMat(fleetTex));
    s.position.set(0, 2.3, .06); k.add(s);
    ao(p, x, z, 3); p.add(k);
  }
  /* The vault: a glass-walled corner room with a round steel door. */
  function vault(p: THREE.Object3D, x: number, z: number) {
    const v = new THREE.Group(); v.position.set(x, 0, z);
    add(v, rbox(3.1, 3.5, 2.3, .18), MAT.vault, 0, 1.75, 0);
    add(v, rbox(2.55, 2.95, .18, .15), MAT.vaultTrim, 0, 1.76, 1.15);
    add(v, rbox(2.3, 2.7, .05, .12), M(0xc9ced9, .45, .4, .9), 0, 1.76, 1.24);
    [-1, 1].forEach(sy => [-.95, .95].forEach(sx =>
      add(v, new THREE.SphereGeometry(.045, 10, 8), MAT.chrome, sx, 1.76 + sy * 1.15, 1.27)));
    const wl = new THREE.Group(); wl.position.set(0, 1.76, 1.3);
    wl.add(new THREE.Mesh(new THREE.TorusGeometry(.42, .07, 14, 36), MAT.chrome));
    for (let i = 0; i < 4; i++) {
      const sp = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .8, 8), MAT.chrome);
      sp.rotation.z = i * Math.PI / 2; wl.add(sp);
    }
    wl.add(new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), MAT.chrome));
    v.add(wl);
    add(v, rbox(.12, .7, .1, .04), MAT.chrome, .85, 1.76, 1.3);
    add(v, rbox(.55, .26, .08, .06), MAT.panel, -.02, 3.05, 1.18);
    add(v, rbox(.4, .05, .05, .02), MAT.ledOn, -.02, 3.02, 1.23);
    ao(p, x, z, 5.6); p.add(v);
  }
  function board(p: THREE.Object3D, x: number, z: number, w: number, h: number) {
    const b = new THREE.Group(); b.position.set(x, 0, z);
    [-1, 1].forEach(s => {
      add(b, rbox(.4, .08, .5, .05), MAT.leg, s * (w / 2 - .3), .05, 0);
      add(b, rbox(.06, 1, .06, .02), MAT.leg, s * (w / 2 - .3), .55, 0);
    });
    add(b, rbox(w, h, .1, .08), M(0xffffff, .85), 0, h / 2 + 1, 0);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w - .24, h - .24), screenMat(wbTex));
    s.position.set(0, h / 2 + 1, .06); b.add(s);
    ao(p, x, z, 3); p.add(b);
  }
  /* Leather sofa - the lounge's tan chesterfields and the black two-seat. */
  function sofa(p: THREE.Object3D, x: number, z: number, ry?: number, tone: 'tan' | 'black' = 'tan') {
    const body = tone === 'tan' ? MAT.leather : MAT.leatherBlk;
    const cushion = tone === 'tan' ? MAT.leatherDk : M(0x363a42, .7, 0, .45);
    const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry || 0;
    add(s, rbox(2.6, .24, 1.2, .12), body, 0, .22, 0);
    add(s, rbox(1.16, .16, 1.02, .14), cushion, -.62, .42, .02);
    add(s, rbox(1.16, .16, 1.02, .14), cushion, .62, .42, .02);
    add(s, rbox(2.6, .86, .32, .16), body, 0, .82, -.46);
    add(s, rbox(1.1, .5, .24, .12), cushion, -.64, .9, -.4);
    add(s, rbox(1.1, .5, .24, .12), cushion, .64, .9, -.4);
    add(s, rbox(.32, .62, 1.14, .15), body, -1.16, .6, 0);
    add(s, rbox(.32, .62, 1.14, .15), body, 1.16, .6, 0);
    [-1, 1].forEach(a => [-.42, .42].forEach(b2 =>
      add(s, new THREE.CylinderGeometry(.035, .045, .16, 8), MAT.dark, a, .08, b2)));
    ao(p, x, z, 4.4); p.add(s);
  }
  function coffeeTable(p: THREE.Object3D, x: number, z: number) {
    const t = new THREE.Group(); t.position.set(x, 0, z);
    add(t, rbox(1.7, .09, .95, .1), MAT.wood, 0, .42, 0);
    [[-.7, -.35], [.7, -.35], [-.7, .35], [.7, .35]].forEach(([lx, lz]) =>
      add(t, new THREE.CylinderGeometry(.03, .035, .4, 8), MAT.dark, lx, .2, lz));
    add(t, rbox(.5, .04, .34, .03), M(0xd9dde6, .7), -.3, .49, .1);
    add(t, rbox(.34, .06, .26, .03), M(0xba4a3e, .8), .35, .5, -.14);
    ao(p, x, z, 2.6); p.add(t);
  }
  function rug(p: THREE.Object3D, x: number, z: number, w: number, d: number, base = 0xe6e1d6, inner = 0xefe9de) {
    const r = new THREE.Group(); r.position.set(x, .015, z);
    add(r, rbox(w, .03, d, .35), M(base, .98, 0, .2), 0, 0, 0).castShadow = false;
    add(r, rbox(w - .5, .032, d - .5, .3), M(inner, .98, 0, .2), 0, .004, 0).castShadow = false;
    p.add(r);
  }
  /* Carpet tile zone under the benching, per the reference. */
  function carpet(p: THREE.Object3D, x: number, z: number, w: number, d: number) {
    const m = add(p, rbox(w, .028, d, .18), M(0x9297a2, .98, 0, .18), x, .014, z);
    m.castShadow = false;
  }
  function floorLamp(p: THREE.Object3D, x: number, z: number) {
    const l = new THREE.Group(); l.position.set(x, 0, z);
    add(l, new THREE.CylinderGeometry(.2, .24, .05, 14), MAT.dark, 0, .03, 0);
    add(l, new THREE.CylinderGeometry(.025, .025, 2, 8), MAT.chrome, 0, 1.03, 0);
    add(l, new THREE.CylinderGeometry(.3, .38, .42, 16, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xf2ede2, roughness: .9, side: THREE.DoubleSide }), 0, 2.14, 0);
    add(l, new THREE.SphereGeometry(.11, 10, 8), MAT.lampWarm, 0, 2.06, 0);
    ao(p, x, z, 1.4); p.add(l);
  }
  /* Server rack: black cabinet, drawn front of blanking panels and LEDs. */
  function rack(p: THREE.Object3D, x: number, z: number, ry?: number) {
    const r = new THREE.Group(); r.position.set(x, 0, z); r.rotation.y = ry || 0;
    add(r, rbox(1.25, 3.55, 1.45, .07), MAT.rack, 0, 1.78, 0);
    add(r, rbox(1.28, .06, 1.48, .03), M(0x30343d, .5, .3), 0, 3.58, 0);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 3.3), screenMat(rackTex));
    face.position.set(0, 1.78, .74); r.add(face);
    const led = add(r, rbox(.07, .07, .03, .015), MAT.ledOn.clone(), .48, 3.3, .76);
    r.userData.leds = [led];
    ao(p, x, z, 2.4); p.add(r); return r;
  }
  /* The curtain wall: full-height mullioned glazing with the skyline
     behind it. One backdrop plane serves both floors. */
  function curtainWall(p: THREE.Object3D, height: number, z0 = -15.9, z1 = 17.05) {
    const span = z1 - z0, n = Math.max(2, Math.round(span / 2.62) + 1), step = span / (n - 1);
    for (let i = 0; i < n; i++)
      add(p, rbox(.14, height, .14, .04), MAT.metal, -22.58, height / 2, z0 + i * step);
    const cz = (z0 + z1) / 2, len = span + .7;
    add(p, rbox(.16, .16, len, .05), MAT.metal, -22.58, height - .1, cz);
    add(p, rbox(.16, .2, len, .05), MAT.metal, -22.58, .1, cz);
    const gl = new THREE.Mesh(rbox(.05, height - .3, len - .3, .02), MAT.glass);
    gl.position.set(-22.6, height / 2, cz); p.add(gl);
  }

  /* Stairs, in world space. Flight A climbs the east side from the build
     floor to the mezzanine; flight B climbs the west side from the
     mezzanine up through a void cut in the executive slab. Two flights,
     so "up both sets of stairs" is a route an agent actually walks
     rather than a teleport with an animation over it. */
  const F2Y = 7.6, F3Y = 15.2;
  const SX = 14.5, SBOT = 8.9, STOP = 2.2;            // flight A
  const S2X = -15.6, S2BOT = -1.2, S2TOP = -11.0;     // flight B
  function buildStairs(p: THREE.Object3D, x: number, y0: number, y1: number, zBot: number, zTop: number, railSide: number) {
    const n = 14, rise = (y1 - y0) / n, run = (zBot - zTop) / n;
    for (let i = 0; i < n; i++)
      add(p, rbox(1.8, rise * .92, run * 1.06, .04), i % 2 ? MAT.soft : M(0xe9ebf1, .9),
        x, y0 + rise * i + rise / 2, zBot - run * i - run / 2);
    const L = Math.hypot(zBot - zTop, y1 - y0), ang = Math.atan2(y1 - y0, zBot - zTop);
    const railG = new THREE.Group();
    railG.position.set(x + 1.02 * railSide, y0 + (y1 - y0) / 2 + .62, (zBot + zTop) / 2);
    railG.rotation.x = ang;
    railG.add(new THREE.Mesh(rbox(.05, 1.15, L, .04), MAT.glass));
    const hr = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, L, 10), MAT.chrome);
    hr.rotation.x = Math.PI / 2; hr.position.y = .62; hr.castShadow = true; railG.add(hr);
    p.add(railG);
    if (y0 === 0) ao(p, x, zBot - 1, 3);   // the contact shadow belongs on the ground plate only
  }

  /* the skyline backdrop, shared by every window */
  (function backdrop() {
    /* The sky stands OUTSIDE the shell. It used to stand at x=-13.6 and
       z=-10.4 — inside the plates — so a third of every floor was drawn
       behind an opaque sky plane and simply vanished into haze. That is
       why the office read smaller than its own plate numbers. Above the
       skyline plate sits a flat plate in the texture's own top colour,
       so the sky carries on past the executive floor with no seam. */
    const upper = new THREE.MeshBasicMaterial({ color: 0x8fbce4 });
    const left = new THREE.Mesh(new THREE.PlaneGeometry(44, 17), MAT.sky);
    left.rotation.y = Math.PI / 2; left.position.set(-24.6, 7.4, 0); scene.add(left);
    const leftHi = new THREE.Mesh(new THREE.PlaneGeometry(44, 24), upper);
    leftHi.rotation.y = Math.PI / 2; leftHi.position.set(-24.6, 27.9, 0); scene.add(leftHi);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(56, 17), MAT.sky);
    back.position.set(0, 7.4, -18.6); scene.add(back);
    const backHi = new THREE.Mesh(new THREE.PlaneGeometry(56, 24), upper);
    backHi.position.set(0, 27.9, -18.6); scene.add(backHi);
  })();

  /* window band for a back wall: framed openings onto the skyline,
     mounted on the face of the actual wall at z=-16.6 — they used to
     float four units into the room because the wall behind them was
     hidden by the old indoor sky plane */
  function windows(p: THREE.Object3D, xs: number[], y: number, w = 4.6, h = 3.6) {
    xs.forEach(x => {
      add(p, rbox(w, h, .18, .08), M(0x9aa3b4, .5, .4), x, y, -16.3);
      const hole = new THREE.Mesh(new THREE.PlaneGeometry(w - .4, h - .4),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: true, colorWrite: false }));
      hole.position.set(x, y, -16.22); p.add(hole);
      add(p, rbox(.07, h - .3, .06, .02), MAT.metal, x, y, -16.26);
      add(p, rbox(w - .3, .07, .06, .02), MAT.metal, x, y, -16.26);
    });
  }

  /* Ceiling light: strips of soft emissive panel, plus a cool bounce
     from below. A doubled plate went dim because the original lighting
     was sized for a room half this size. */
  function ceilingLight(p: THREE.Object3D, y: number, xs: number[], zFrom: number, zTo: number) {
    const mat = new THREE.MeshBasicMaterial({ color: 0xf4f9ff, transparent: true, opacity: .92 });
    xs.forEach(x => {
      const strip = new THREE.Mesh(rbox(.42, .07, zTo - zFrom, .03), mat);
      strip.position.set(x, y, (zFrom + zTo) / 2); p.add(strip);
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, zTo - zFrom),
        new THREE.MeshBasicMaterial({ color: 0xdcecff, transparent: true, opacity: .085,
          blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      glow.rotation.x = -Math.PI / 2; glow.position.set(x, y - .06, (zFrom + zTo) / 2); p.add(glow);
    });
  }

  /* floor builds */
  function buildFloor1(g: THREE.Group) {
    ceilingLight(g, F2Y - 1.15, [-15.7, -7.9, 0, 7.9, 15.7], -15.1, 15.6);
    add(g, rbox(46, .6, 34, .5), MAT.floor, 0, -.3, 0).castShadow = false;
    add(g, rbox(46.3, .18, 34.3, .6), MAT.slab, 0, -.68, 0).castShadow = false;
    /* back wall pierced by windows; left side is all curtain wall */
    add(g, rbox(46, 6.9, .42, .12), MAT.wall, 0, 3.45, -16.6);
    windows(g, [-17, -8.5, 0, 8.5, 17], 3.7);
    add(g, rbox(45, .09, .7, .05), MAT.wall2, 0, .05, -16.15).castShadow = false;
    curtainWall(g, 7.4);
    [-17, -8.5, 0, 8.5, 17].forEach(x => add(g, new THREE.CylinderGeometry(.16, .18, F2Y - .6, 14), MAT.col, x, (F2Y - .6) / 2, 3.6));

    /* wall displays, ground level, left of the windows */
    (function displays() {
      const dg = new THREE.Group(); dg.position.set(-13.9, 3.1, -16.3);
      add(dg, rbox(2.4, 1.5, .1, .05), M(0x1d212c, .55, .2, .8), 0, .9, 0);
      const s1 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), screenMat(darkDashTex()));
      s1.position.set(0, .9, .07); dg.add(s1);
      add(dg, rbox(2.4, 1.5, .1, .05), M(0x1d212c, .55, .2, .8), 0, -.85, 0);
      const s2 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), screenMat(darkDashTex()));
      s2.position.set(0, -.85, .07); dg.add(s2);
      g.add(dg);
    })();

    /* the lounge: tan chesterfields facing over a coffee table, a black
       two-seat closing the group, warm lamps, cream rug */
    rug(g, -16.2, 8.1, 11.4, 8);
    sofa(g, -19.1, 8.1, Math.PI / 2, 'tan');
    sofa(g, -13.4, 8.1, -Math.PI / 2, 'tan');
    sofa(g, -16.2, 11.5, Math.PI, 'black');
    coffeeTable(g, -16.2, 8.1);
    laptop(g, -15.8, 7.9, termTex, .5, .47);
    floorLamp(g, -13.9, 10); floorLamp(g, -19.4, 10.3);
    plant(g, -14.4, 4, 1.1); plant(g, -5.6, 4.2, .9);

    /* Build Bay: four benching clusters on carpet */
    carpet(g, -2.9, 6.6, 21.5, 12.9);
    bench(g, -8.4, 3); bench(g, 1.8, 4.3); bench(g, -4.2, 9.6); bench(g, 3.4, 10.3);

    /* the Architect's planning desk against the back wall */
    desk(g, 6.8, -11.6, Math.PI, { dual: 1 });
    chair(g, 6.8, -13.1, 0);

    /* Deploy Bay + server row */
    desk(g, 14.7, .5, 0, { wide: 1, t1: dashTex() });
    chair(g, 14.7, 2.2, Math.PI);
    [4.5, 7.7, 11, 14.3].forEach(x => rack(g, x, 14));
    [4.6, 8.1].forEach(z => rack(g, 19.1, z, Math.PI / 2));
    fleetWallBoard(g, 17.6, 13.2, .5);
    plant(g, 13.9, -1.3, .9); plant(g, 3.1, -10, 1);

    /* East wing: a second build bay, so the room has depth of team */
    carpet(g, 12.6, 7.6, 14, 10.6);
    bench(g, 10, 4.5); bench(g, 9.4, 9.9);
    desk(g, 19.1, 1.4, -Math.PI / 2, { dual: 1 }); chair(g, 17.7, 1.4, Math.PI / 2);
    desk(g, 19.1, 10.3, -Math.PI / 2); chair(g, 17.7, 10.3, Math.PI / 2);

    /* South: reception and a waiting lounge - the first thing a client
       would see, and the reason the plate needed to be bigger */
    add(g, rbox(5.6, 1.06, 1.5, .12), MAT.wood, -2.9, .53, 13.7);
    add(g, rbox(5.2, .1, 1.2, .06), M(0xe8eaf0, .5), -2.9, 1.09, 13.7);
    chair(g, -2.9, 14.9, Math.PI);
    add(g, rbox(3.4, 1.9, .12, .05), M(0xf3f4f8, .9), -2.9, 2.5, 15.2);
    rug(g, 6, 14.1, 9, 6.2);
    sofa(g, 6, 12.1, 0, 'tan'); sofa(g, 6, 16.1, Math.PI, 'tan');
    coffeeTable(g, 6, 14.1);
    plant(g, 11.5, 15.9, 1.2); plant(g, -8.4, 15.4, 1.05); plant(g, 20.2, 14.9, 1.1);
    floorLamp(g, 1.4, 16.5); floorLamp(g, 11, 11.9);

    /* West: quiet booths along the glass */
    [-8.1, -2.8, 2.5].forEach((z, i) => {
      add(g, rbox(2.6, 1.5, .1, .05), M(0xeceef4, .92), -20.2, .75, z);
      desk(g, -18.6, z, Math.PI / 2, { t1: i % 2 ? undefined : termTex });
      chair(g, -17.3, z, -Math.PI / 2);
    });
    plant(g, -20.7, 7.1, 1.15); plant(g, -20.4, -11.8, 1); plant(g, -20.5, 14.3, 1.05);
  }
  function buildFloor2(g: THREE.Group) {
    ceilingLight(g, 5.6, [-14.4, -5.2, 3.9, 13.1], -15.5, 3.4);
    add(g, rbox(46, .6, 21, .5), MAT.floor, 0, -.3, -6.25).castShadow = false;
    add(g, rbox(46.3, .24, 21.3, .6), MAT.slab, 0, -.72, -6.25);
    add(g, rbox(46, .42, .3, .1), M(0xe2e5ee, .9), 0, -.72, 4.1);
    add(g, rbox(46, 6.4, .42, .12), MAT.wall, 0, 3.2, -16.6);
    windows(g, [-18.7, -6.6, 5.2, 17.8], 3.4, 4.2, 3.2);
    curtainWall(g, 6.4, -15.9, 3.9);
    /* balustrade along the mezzanine edge */
    (function () {
      const w = 27.8, cx = -2.2;
      const m = new THREE.Mesh(rbox(w, 1.05, .05, .04), MAT.glass); m.position.set(cx, .62, 3.9); g.add(m);
      add(g, rbox(w, .05, .07, .02), MAT.chrome, cx, 1.18, 3.9);
      for (let i = 0; i < 8; i++) add(g, rbox(.05, 1.02, .05, .02), MAT.metal, cx - w / 2 + i * (w / 7), .6, 3.9);
    })();

    videoWall(g, -3.4, 3.15, -16.3);
    board(g, -9, -6.6, 4.6, 2.4);

    /* QA Lab: one benching cluster mid-floor */
    carpet(g, .8, -3.4, 9.2, 8.2);
    bench(g, .8, -3.5);

    /* the Studio: design + copy desks along the right */
    desk(g, 8.4, -6.25, 0, { dual: 1 }); chair(g, 8.4, -4.55, Math.PI);
    desk(g, 8.4, -1, 0, { wide: 1, t1: dashTex() }); chair(g, 8.4, .7, Math.PI);

    /* Ops desks on the left for the Registrar and Auditor */
    desk(g, -13, -6.1, Math.PI / 2, { t1: termTex }); chair(g, -11.6, -6.1, -Math.PI / 2);
    desk(g, -13, -2.2, Math.PI / 2, { t1: dashTex() }); chair(g, -11.6, -2.2, -Math.PI / 2);

    /* lounge overlook: a desk pair set back from the rail. The south
       strip at z≈2 is the walking lane between the two stair flights,
       and furniture an agent walks through is worse than furniture
       somewhere else. */
    desk(g, -7.7, -.2, Math.PI); chair(g, -7.7, -1.7, 0);

    /* the Vault: glass corner room, steel door */
    vault(g, 13.5, -7.2);
    glassPanel(g, 11.75, -6.9, 3.6, 3.4, Math.PI / 2);
    glassPanel(g, 13.6, -5.05, 3.4, 3.4, 0);

    kanbanWall(g, 11.4, .7);
    plant(g, -9.7, -8.8, 1); plant(g, 4.2, -8.8, 1); plant(g, 6.8, 2.2, .85);

    /* Mezzanine east: a boardroom behind glass, and an ops row */
    glassPanel(g, 13.4, -9.4, 7.4, 3.1, 0);
    glassPanel(g, 18.2, -6.9, 5, 3.1, Math.PI / 2);
    add(g, rbox(4.6, .16, 1.9, .12), MAT.wood, 15.2, .82, -9.1);
    [-1.6, 0, 1.6].forEach(dx => { chair(g, 15.2 + dx, -10.3, 0); chair(g, 15.2 + dx, -7.9, Math.PI); });
    add(g, rbox(2.8, 1.6, .08, .04), M(0x1d212c, .55, .2, .8), 18.5, 2.2, -11.6);
    desk(g, 11, -.4, Math.PI, { dual: 1 }); chair(g, 11, -1.9, 0);
    desk(g, 16, -.4, Math.PI); chair(g, 16, -1.9, 0);
    plant(g, 19.9, -1.9, 1.05); plant(g, 8.4, -10.6, .95);
    /* the extra depth the mezzanine gained: a quiet reading pair by the rail */
    sofa(g, -16.8, -8.6, Math.PI / 2, 'black');
    plant(g, -16.4, -12.2, 1);
  }

  /* ── Floor 03, the executive floor ──────────────────────────────────
     Its slab is deliberately not the full plate. It stops short on the
     south so the balcony overlooks the mezzanine strip and, past the
     mezzanine's own edge, the build floor two storeys down; and it is
     cut by a stairwell void on the west so flight B arrives through the
     floor instead of ending in mid-air. Everything sits south of
     z = -10.4, which is where the skyline backdrop stands. */
  const F3S = -3.75, F3N = -16.75;         // slab, south and north edges
  const F3W = -17.3, F3E = 23;             // slab, west and east edges
  const VE = -12.8, VN = -11.2;            // stairwell void: east edge, north edge
  function railRun(g: THREE.Group, x: number, z: number, len: number, along: 'x' | 'z') {
    const w = along === 'x' ? len : .05, d = along === 'x' ? .05 : len;
    const m = new THREE.Mesh(rbox(w, 1.05, d, .04), MAT.glass); m.position.set(x, .62, z); g.add(m);
    add(g, rbox(along === 'x' ? len : .07, .05, along === 'x' ? .07 : len, .02), MAT.chrome, x, 1.18, z);
    const n = Math.max(2, Math.round(len / 3.6));
    for (let i = 0; i <= n; i++) {
      const f = -len / 2 + (i * len) / n;
      add(g, rbox(.05, 1.02, .05, .02), MAT.metal, x + (along === 'x' ? f : 0), .6, z + (along === 'x' ? 0 : f));
    }
  }
  function pendant(p: THREE.Object3D, x: number, z: number) {
    add(p, new THREE.CylinderGeometry(.012, .012, 1.5, 6), MAT.chrome, x, 4.4, z);
    add(p, new THREE.CylinderGeometry(.34, .3, .16, 18), M(0x2c3140, .5, .3, .8), x, 3.6, z);
    add(p, new THREE.SphereGeometry(.2, 12, 10), MAT.lampWarm, x, 3.55, z);
  }
  function buildFloor3(g: THREE.Group) {
    ceilingLight(g, 5.6, [-10.5, -2.6, 5.2, 13.1, 20.2], -15.7, -4.2);
    /* the slab, in two pieces so the stairwell void is a real hole */
    const mainW = F3E - VE, mainCx = (F3E + VE) / 2, depth = F3S - F3N, cz = (F3S + F3N) / 2;
    const stripW = VE - F3W, stripCx = (VE + F3W) / 2, stripD = VN - F3N, stripCz = (VN + F3N) / 2;
    add(g, rbox(mainW, .6, depth, .5), MAT.floor, mainCx, -.3, cz).castShadow = false;
    add(g, rbox(mainW + .3, .22, depth + .3, .6), MAT.slab, mainCx, -.7, cz);
    add(g, rbox(stripW, .6, stripD, .5), MAT.floor, stripCx, -.3, stripCz).castShadow = false;
    add(g, rbox(stripW + .3, .22, stripD + .3, .6), MAT.slab, stripCx, -.7, stripCz);
    /* back wall + the same framed glazing the floors below use — the
       wall is genuinely visible now that the sky stands outside it */
    add(g, rbox(F3E - F3W, 6.4, .42, .12), MAT.wall, (F3E + F3W) / 2, 3.2, -16.6);
    windows(g, [-8.4, 3.1, 14.7], 3.4, 4.6, 3.4);

    /* balustrades: the south balcony, and the lip around the stairwell */
    railRun(g, (F3E + VE) / 2, F3S - .05, F3E - VE - .2, 'x');
    railRun(g, VE + .05, (F3S + VN) / 2, F3S - VN - .2, 'z');
    railRun(g, -13.5, VN + .05, 1.2, 'x');
    railRun(g, F3W + .05, (VN + F3N + .6) / 2, VN - F3N - .8, 'z');

    /* ── the main office: a glass boardroom around one long table ── */
    const BW = -4.7, BE = 12.1, BS = -7.3, BN = -13.6, TX = 3.7, TZ = -10.5;
    glassPanel(g, -.9, BS, 7.6, 3.1, 0);                      // south wall, west of the door
    glassPanel(g, 8.3, BS, 7.6, 3.1, 0);                      // south wall, east of the door
    glassPanel(g, BW, (BS + BN) / 2, BS - BN, 3.1, Math.PI / 2);
    glassPanel(g, BE, (BS + BN) / 2, BS - BN, 3.1, Math.PI / 2);
    rug(g, TX, TZ, 15.4, 6.2, 0xdfdbd1, 0xe9e5db);
    /* the long table: one oak top on two blade legs, a cable spine, and
       a run of pendants overhead */
    add(g, rbox(12.4, .16, 2.4, .1), MAT.wood, TX, .84, TZ);
    [-4.4, 4.4].forEach(s => add(g, rbox(.16, .8, 1.9, .06), MAT.leg, TX + s, .4, TZ));
    add(g, rbox(11.4, .07, .16, .03), MAT.leg, TX, .28, TZ);
    add(g, rbox(2.6, .05, .34, .04), M(0x2f3542, .5, .3, .8), TX, .93, TZ);
    [-4, 0, 4].forEach(s => pendant(g, TX + s, TZ));
    const SEATX = [-1.5, .3, 2.1, 3.9, 5.7, 7.5, 9.3];
    SEATX.forEach(x => { chair(g, x, TZ - 1.9, 0); chair(g, x, TZ + 1.9, Math.PI); });
    chair(g, TX - 7.1, TZ, Math.PI / 2); chair(g, TX + 7.1, TZ, -Math.PI / 2);
    /* presentation screen on the boardroom's north face */
    add(g, rbox(5.6, 2.9, .12, .05), M(0x1d212c, .55, .2, .8), TX, 2.5, -13.3);
    const bs = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 2.62), screenMat(darkDashTex()));
    bs.position.set(TX, 2.5, -13.22); g.add(bs);
    plant(g, BE - .9, BN + 1.1, 1.05); plant(g, BW + .9, BS - 1.1, .95);

    /* ── two private offices along the east glass ── */
    glassPanel(g, 16, -11.4, 4.4, 3.1, Math.PI / 2);
    glassPanel(g, 16, -6.4, 4.6, 3.1, Math.PI / 2);
    glassPanel(g, 19.35, -8.95, 6.7, 3.1, 0);
    glassPanel(g, 19.35, -4.1, 6.7, 3.1, 0);
    desk(g, 18.9, -12.3, 0, { dual: 1, t1: dashTex() }); chair(g, 18.9, -10.8, Math.PI);
    desk(g, 18.9, -7.2, 0, { wide: 1, t1: dashTex() }); chair(g, 18.9, -5.7, Math.PI);
    plant(g, 15.3, -12.7, .95); plant(g, 21.6, -5.5, 1);
    add(g, rbox(1.9, 1.15, .12, .05), M(0xf3f4f8, .9), 21.9, 1.7, -10.9);

    /* ── open-floor workstations, west of the boardroom ── */
    carpet(g, -9, -9.7, 8.1, 9);
    bench(g, -9, -10.9);
    desk(g, -11.4, -6.4, Math.PI / 2, { t1: termTex }); chair(g, -10, -6.4, -Math.PI / 2);
    plant(g, -12.1, -13.9, 1);

    /* ── the balcony: seating that looks down over both floors ── */
    rug(g, 11, -5.5, 6.4, 3);
    sofa(g, 11, -6.2, 0, 'tan');
    coffeeTable(g, 11, -4.8);
    floorLamp(g, 14.6, -6.4);
    sofa(g, 0, -5.8, 0, 'black');
    coffeeTable(g, 0, -4.6);
    plant(g, -3.4, -4.4, 1.05); plant(g, 6.8, -4.5, .95);
  }

  /* assemble — each stair flight in its own group so the cutaway can
     hide flight B along with the floor it serves */
  const f1 = new THREE.Group(), f2 = new THREE.Group(), f3 = new THREE.Group();
  buildFloor1(f1); buildFloor2(f2); buildFloor3(f3);
  f2.position.y = F2Y; f3.position.y = F3Y; scene.add(f1, f2, f3);
  const stairsA = new THREE.Group(), stairsB = new THREE.Group();
  buildStairs(stairsA, SX, 0, F2Y, SBOT, STOP, -1);
  buildStairs(stairsB, S2X, F2Y, F3Y, S2BOT, S2TOP, 1);
  scene.add(stairsA, stairsB);

  /* agents — same roster the database seeds, same colours, new desks */
  interface Agent {
    id: string; n: string; role: string; model: string; c: number; floor: number;
    seat: [number, number]; idle: [number, number][]; tools: string[]; det?: number; sit?: number;
    owner?: 1; arriveRy?: number; arriveState?: string; mvs?: number;
    mesh?: THREE.Group; curFloor?: number; pos?: THREE.Vector2; tgt?: THREE.Vector2 | null;
    wp?: number; state?: string; ph?: number; act?: { type: string; until: number } | null;
    nextAct?: number; tokensReal?: number | null; el?: HTMLElement; bub?: HTMLElement;
    traveling?: boolean; path?: THREE.Vector3[]; pi?: number; dest?: number;
    travelCb?: (() => void) | null; pendAct?: { type: string; ry: number; dur: number } | null;
    chatEnd?: number; mate?: Agent | null; task?: string | null; real?: OfficeAgentState | null;
    mesh_info?: AgentMeshInfo | null;
  }
  const AC = { cobalt: 0x2563eb, orange: 0xf97316, green: 0x35c26b, violet: 0x6d3fd4, amber: 0xf5c518,
    rose: 0xe0446b, teal: 0x0d9488, slate: 0x76809a, indigo: 0x4f46e5, cyan: 0x0fb8d4, lime: 0x84cc16 };
  const AGENTS: Agent[] = [
    { id: 'quooro', n: 'Quooro', role: 'Orchestrator', model: 'Sonnet', c: AC.cyan, floor: 2, seat: [-.3, -1.45], sit: 1,
      idle: [[-.3, -1.45], [-5.2, .2], [4.5, -.4], [-9, -4.3]], tools: ['read', 'dispatch', 'report'] },
    { id: 'architect', n: 'Architect', role: 'Planning', model: 'Opus', c: AC.violet, floor: 1, seat: [6.8, -13.1],
      idle: [[1.6, -3.3], [4.2, 1.3], [-2.4, -4.8], [-6.6, .5]], tools: ['read', 'plan.write'] },
    { id: 'builder1', n: 'Builder-01', role: 'Scaffolding', model: 'Sonnet', c: AC.cobalt, floor: 1, seat: [-5.3, 7.55], sit: 1,
      idle: [[-5.3, 7.55], [-1.3, 1.3], [-3.1, 10.6]], tools: ['read', 'scratch.write'] },
    { id: 'builder2', n: 'Builder-02', role: 'Components', model: 'Sonnet', c: AC.lime, floor: 1, seat: [-3.1, 7.55],
      idle: [[-3.1, 7.55], [1.8, 9.6], [-1.7, 1], [4.7, 8.6]], tools: ['read', 'scratch.write'] },
    { id: 'inspector', n: 'Inspector', role: 'QA', model: 'free tooling', c: AC.green, floor: 2, seat: [1.9, -1.45], det: 1,
      idle: [[1.9, -1.45], [-3.1, .8], [5.2, -6.4], [-6, -6.7]], tools: ['read', 'test.run'] },
    { id: 'fixer', n: 'Fixer', role: 'Patching', model: 'Sonnet → Opus', c: AC.orange, floor: 1, seat: [.7, 6.35],
      idle: [[.7, 6.35], [6.3, 5], [-.5, 1.3]], tools: ['read', 'scratch.write'] },
    { id: 'deployer', n: 'Deployer', role: 'Vercel', model: 'script · no model', c: AC.amber, floor: 1, det: 1, seat: [14.7, 2.2],
      idle: [[9.7, 3.7], [11.3, 8.3], [7.3, .5]], tools: ['vercel.deploy', 'domain.map'] },
    { id: 'designer', n: 'Designer', role: 'Art direction', model: 'Opus → Sonnet', c: AC.rose, floor: 2, seat: [8.4, -4.55],
      idle: [[8.4, -4.55], [11.3, -.7], [5.8, .8]], tools: ['read', 'tokens.write'] },
    { id: 'scribe', n: 'Scribe', role: 'Copy', model: 'Sonnet', c: AC.teal, floor: 2, seat: [8.4, .7],
      idle: [[8.4, .7], [4.2, 1.9], [10.2, -1.9]], tools: ['read', 'copy.write'] },
    { id: 'registrar', n: 'Registrar', role: 'CRM writeback', model: 'script · no model', c: AC.slate, floor: 2, det: 1,
      seat: [-11.6, -6.1], idle: [[-11.6, -6.1], [-8.4, -3.4], [-13.6, .2]], tools: ['crm.write', 'undo'] },
    { id: 'auditor', n: 'Auditor', role: 'Guidelines review', model: 'Sonnet · on demand', c: AC.indigo, floor: 2,
      seat: [-11.6, -2.2], idle: [[-11.6, -2.2], [-7.9, 1.1], [-13.9, -4.6]], tools: ['read', 'audit.report', 'guarded:client.email'] },
  ];
  /* `k` marks a zone worth naming when the whole building is in frame.
     Three storeys of hotspots at once is a wall of chips, so the rest
     appear only when that floor is the one being looked at. */
  const HOTS: Record<number, { p: [number, number, number]; t: string; s: string; d?: string; stem?: number; k?: 1 }[]> = {
    1: [{ p: [-16.2, 2.3, 8.1], t: 'Lounge', s: 'overlook · idle', stem: 34 },
      { p: [-2.9, 3.1, 6.6], t: 'Build Bay', s: '4 benches · builders', d: '#2563eb', stem: 30, k: 1 },
      { p: [14.7, 2.9, .5], t: 'Deploy Bay', s: 'vercel · previews', d: '#f59e0b', stem: 24, k: 1 },
      { p: [9.3, 4.4, 14], t: 'Server Row', s: 'racks', stem: 20 },
      { p: [17.6, 3.6, 13.2], t: 'Fleet Wall', s: 'model health · live', d: '#0fb8d4', stem: 26 },
      { p: [6.8, 3.2, -11.6], t: 'Planning', s: 'architect', d: '#6d3fd4', stem: 26 },
      { p: [-2.9, 2.4, 14.4], t: 'Reception', s: 'clients arrive here', stem: 30, k: 1 },
      { p: [-18.6, 2.4, -2.8], t: 'Focus booths', s: 'quiet work', d: '#98a1b4', stem: 26 }],
    2: [{ p: [-7.7, 2.5, 1.6], t: 'Lounge', s: 'overlook', stem: 26 },
      { p: [-9, 4.1, -6.6], t: 'Strategy Wall', s: 'roadmap', stem: 24 },
      { p: [.8, 3, -3.5], t: 'QA Lab', s: 'free tooling', d: '#35c26b', stem: 28, k: 1 },
      { p: [8.4, 2.9, -3.6], t: 'Studio', s: 'design · copy', d: '#e0446b', stem: 28, k: 1 },
      { p: [13.5, 4.1, -7.2], t: 'Vault', s: 'secrets · locked', d: '#10b981', stem: 28, k: 1 },
      { p: [11.4, 3.6, .6], t: 'Kanban Wall', s: 'queue', d: '#2563eb', stem: 24 },
      { p: [-16.8, 2.2, -8.6], t: 'Reading nook', s: 'under the stairs', d: '#98a1b4', stem: 28 }],
    3: [{ p: [3.7, 3.6, -10.5], t: 'Boardroom', s: 'main office · long table', d: '#c3992e', stem: 32, k: 1 },
      { p: [18.9, 3.4, -8.9], t: 'Executive offices', s: 'owners', d: '#c3992e', stem: 28, k: 1 },
      { p: [-9, 3, -9.7], t: 'Workstations', s: 'open floor', d: '#2563eb', stem: 28, k: 1 },
      { p: [7, 2.4, -5.4], t: 'Balcony', s: 'over floors 02 · 01', stem: 32 }],
  };
  const stairHot = { p: [SX, 4.4, 5.6] as [number, number, number], t: 'Stairs A', s: 'build → mezzanine', stem: 24 };
  const stairHot2 = { p: [S2X, F2Y + 4.4, (S2BOT + S2TOP) / 2] as [number, number, number],
    t: 'Stairs B', s: 'mezzanine → exec', stem: 24 };

  function character(col: number, owner?: boolean) {
    const g = new THREE.Group();
    const skin = M(col, .6, 0, .7), dk = M(new THREE.Color(col).multiplyScalar(.7).getHex(), .65);
    const torso = add(g, new THREE.CylinderGeometry(.26, .32, .74, 16), skin, 0, 1.06, 0);
    add(g, new THREE.SphereGeometry(.265, 14, 10), skin, 0, 1.43, 0).scale.set(1, .6, 1);
    add(g, new THREE.SphereGeometry(.31, 14, 10), skin, 0, .72, 0).scale.set(1, .5, 1);
    const head = add(g, new THREE.SphereGeometry(.27, 20, 16), skin, 0, 1.72, 0);
    /* own material, never the cache: per-agent ghosting must not fade
       every character's glasses at once */
    add(g, rbox(.32, .15, .07, .06), new THREE.MeshStandardMaterial({
      color: 0x262c3c, roughness: .35, metalness: .2, envMapIntensity: 1,
    }), 0, 1.74, .22);
    const mk = (x: number, y: number, len: number, rad: number, mat: THREE.Material) => {
      const piv = new THREE.Group(); piv.position.set(x, y, 0);
      add(piv, new THREE.CylinderGeometry(rad, rad * .85, len, 10), mat, 0, -len / 2, 0);
      g.add(piv); return piv;
    };
    const hipL = mk(-.14, .72, .6, .095, dk), hipR = mk(.14, .72, .6, .095, dk);
    add(hipL, new THREE.SphereGeometry(.1, 10, 8), dk, 0, -.6, .04);
    add(hipR, new THREE.SphereGeometry(.1, 10, 8), dk, 0, -.6, .04);
    const shL = mk(-.33, 1.34, .56, .075, skin), shR = mk(.33, 1.34, .56, .075, skin);
    add(shL, new THREE.SphereGeometry(.085, 10, 8), skin, 0, -.56, 0);
    add(shR, new THREE.SphereGeometry(.085, 10, 8), skin, 0, -.56, 0);
    let ring: THREE.Object3D | null = null;
    if (owner) {
      /* An owner reads as a person, not another agent in another colour:
         a suit jacket over the torso, a shirt line, and a gold ring that
         turns above the head — the Owner icon, in the room itself. */
      add(g, new THREE.CylinderGeometry(.3, .37, .52, 16), M(0x242835, .72, .05, .5), 0, 1.13, 0);
      add(g, rbox(.11, .36, .06, .03), M(0xf7f8fb, .8), 0, 1.21, .275);
      add(g, rbox(.09, .2, .05, .02), M(0x8a2f3c, .7), 0, 1.15, .3);
      ring = add(g, new THREE.TorusGeometry(.21, .028, 8, 24),
        new THREE.MeshStandardMaterial({ color: 0xd9ae43, roughness: .28, metalness: .85,
          emissive: 0x6b4f10, emissiveIntensity: .35, envMapIntensity: 1.5 }), 0, 2.18, 0);
      ring.rotation.x = Math.PI / 2;
    }
    g.userData = { torso, head, hipL, hipR, shL, shR, ring };
    g.traverse(o => { o.userData.agentRoot = g; });
    return g;
  }

  /* ── the owners ──────────────────────────────────────────────────
     Two people, not agents. They are never dispatched, never resolve to
     a model, never appear in the agent count and never carry a token
     figure — the office would be lying if they did. They live on the
     executive floor and take the two head seats when a meeting is
     called. "You" is a placeholder for a name the office does not have;
     it is one string on the line below. */
  const OWNERS: Agent[] = [
    { id: 'owner-you', n: 'You', role: 'Owner', model: '—', c: 0xc3992e, floor: 3, owner: 1,
      seat: [18.9, -10.8], idle: [[18.9, -10.8], [12.8, -5.6], [3.7, -5.9], [-6, -5.6]], tools: ['owner'] },
    { id: 'owner-zak', n: 'Zak', role: 'Owner', model: '—', c: 0x9a7b28, floor: 3, owner: 1,
      seat: [18.9, -5.7], idle: [[18.9, -5.7], [14.7, -4.8], [5.2, -5.2], [-9.2, -7.6]], tools: ['owner'] },
  ];
  const CAST: Agent[] = [...AGENTS, ...OWNERS];
  const FLOOR_GROUP: Record<number, THREE.Group> = { 1: f1, 2: f2, 3: f3 };
  const FLOOR_Y: Record<number, number> = { 1: 0, 2: F2Y, 3: F3Y };

  const chars: Record<string, Agent> = {};
  CAST.forEach(a => {
    const m = character(a.c, !!a.owner); FLOOR_GROUP[a.floor].add(m);
    a.mesh = m; a.curFloor = a.floor;
    a.pos = new THREE.Vector2(a.idle[0][0], a.idle[0][1]);
    a.tgt = null; a.wp = 0; a.state = 'idle'; a.ph = Math.random() * 9; a.act = null; a.nextAct = Math.random() * 6;
    a.tokensReal = null; a.real = null; a.task = null;
    m.position.set(a.pos.x, 0, a.pos.y);
    chars[a.id] = a;
  });

  /* labels */
  let labelPool: { el: HTMLElement; f: number; v: THREE.Vector3; off: number; k: boolean }[] = [];
  (function makeLabels() {
    labelsEl.innerHTML = ''; labelPool = [];
    const mk = (h: { p: [number, number, number]; t: string; s: string; d?: string; stem?: number; k?: 1 }, f: number) => {
      const chip = document.createElement('div'); chip.className = 'chip';
      chip.style.setProperty('--stem', (h.stem || 24) + 'px');
      chip.innerHTML = '<b>' + (h.d ? '<span class="d" style="background:' + h.d + '"></span>' : '') + h.t + '</b><i>' + h.s + '</i>';
      labelsEl.appendChild(chip);
      labelPool.push({ el: chip, f, v: new THREE.Vector3(h.p[0], h.p[1], h.p[2]), off: (h.stem || 24) + 8, k: !!h.k });
    };
    HOTS[1].forEach(h => mk(h, 1)); HOTS[2].forEach(h => mk(h, 2)); HOTS[3].forEach(h => mk(h, 3));
    mk(stairHot, 0); mk(stairHot2, 0);
    CAST.forEach(a => {
      const chip = document.createElement('div'); chip.className = 'chip agent' + (a.owner ? ' owner' : '');
      chip.innerHTML = '<b>' + a.n.toLowerCase() + '</b>'; chip.style.opacity = '0'; labelsEl.appendChild(chip); a.el = chip;
      const bub = document.createElement('div'); bub.className = 'chip bub';
      bub.innerHTML = '<b>· · ·</b>'; bub.style.opacity = '0'; labelsEl.appendChild(bub); a.bub = bub;
    });
  })();

  /* The nameplate: name + the model this agent ACTUALLY resolves to, in
     its cost-class colour. No database row, no model line - an em dash
     is honest; a guessed model name is not. */
  function drawChip(a: Agent) {
    if (a.owner) {
      a.el!.innerHTML = '<b>' + a.n.toLowerCase() + '<span class="own">OWNER</span></b>';
      return;
    }
    const info = a.mesh_info;
    const model = info?.model ?? null;
    const dot = COST_COLOURS[info?.costClass ?? ''] || '#98a1b4';
    a.el!.innerHTML = '<b><span class="d" style="background:' + dot + '"></span>' + a.n.toLowerCase() + '</b>' +
      '<i data-m>' + (model ? model.replace(/^[^/]+\//, '') : a.det ? 'script · no model' : '—') + '</i>';
  }
  CAST.forEach(drawChip);

  /* view modes */
  let viewMode: 'all' | 1 | 2 | 3 = 'all';
  function setView(m: 'all' | 1 | 2 | 3) {
    viewMode = m;
    root.querySelectorAll('.fl').forEach(x => x.classList.toggle('on', (x as HTMLElement).dataset.f === String(m)));
    /* The cutaway. Picking a floor removes everything stacked above it —
       otherwise floor 3's slab hides most of floor 2 and the mezzanine
       hides half of floor 1, and a floor button that cannot show you the
       floor is not a floor button. */
    f2.visible = m !== 1;
    f3.visible = m === 'all' || m === 3;
    stairsB.visible = f3.visible;
    /* three storeys need a wider frame than two, or the top of the
       building leaves the viewport */
    if (m === 'all') { FT = 29; camYT = 7; }
    else if (m === 1) { FT = 19; camYT = 0; }
    else if (m === 2) { FT = 18; camYT = F2Y; }
    else { FT = 17; camYT = F3Y; }
    el('rfl').textContent = m === 'all' ? 'All floors' : 'Floor 0' + m;
    roster();
  }
  root.querySelectorAll('.fl').forEach(b => (b as HTMLElement).onclick = () =>
    setView((b as HTMLElement).dataset.f === 'all' ? 'all' : Number((b as HTMLElement).dataset.f) as 1 | 2 | 3));

  /* chrome buttons */
  const on = (act: string, fn: () => void) => {
    const b = root.querySelector(`[data-act="${act}"]`) as HTMLElement | null;
    if (b) b.onclick = fn;
  };
  on('hiderail', () => root.classList.add('norail'));
  on('showrail', () => root.classList.remove('norail'));
  on('newtask', () => opts.onNewTask(null));
  on('newtask2', () => opts.onNewTask(null));
  on('console', () => opts.onOpenConsole());
  on('back', () => history.back());

  /* roster / inspector — real numbers or an em dash, never an invention */
  const LBL: Record<string, [string, string]> = {
    idle: ['#98a1b4', 'IDLE'], working: ['#2563eb', 'WORKING'], moving: ['#2563eb', 'MOVING'],
    chat: ['#98a1b4', 'IDLE'], travel: ['#2563eb', 'STAIRS'], assigned: ['#b45309', 'ASSIGNED'],
    blocked: ['#b45309', 'BLOCKED'], failed: ['#be123c', 'FAILED'], meeting: ['#c3992e', 'MEETING'],
    throttled: ['#f59e0b', 'THROTTLED'], offline: ['#98a1b4', 'OFFLINE'],
  };
  let selected: Agent | null = null;

  /* The registry, as the pickers see it: grouped by cost class, health
     and remaining budget beside each entry. Pushed in from the database;
     an empty list renders an honest placeholder, never invented models. */
  let registryOpts: RegistryOption[] = [];
  let teamsList: { name: string; members: string[] }[] = [];
  function modelOptionsHtml(current: string | null): string {
    const groups = new Map<string, RegistryOption[]>();
    registryOpts.forEach(r => {
      const g = groups.get(r.costClass) || []; g.push(r); groups.set(r.costClass, g);
    });
    let html = '<option value=""' + (current ? '' : ' selected') + '>auto — router picks by capability</option>';
    groups.forEach((rows, cls) => {
      html += '<optgroup label="' + cls.toUpperCase() + '">';
      rows.forEach(r => {
        const meta = [
          r.remaining === null ? null : r.remaining + ' left',
          r.healthy ? null : 'unhealthy',
        ].filter(Boolean).join(' · ');
        html += '<option value="' + r.id + '"' + (current === r.id ? ' selected' : '') + '>' +
          r.id + (meta ? '  ·  ' + meta : '') + '</option>';
      });
      html += '</optgroup>';
    });
    return html;
  }
  function refreshGroupPickers() {
    const gt = el('gteam'), gm = el('gmodel');
    if (!gt || !gm) return;
    gt.innerHTML = teamsList.length
      ? teamsList.map(t => '<option value="' + t.name + '">' + t.name + ' · ' + t.members.length + ' agents</option>').join('')
      : '<option value="">no teams yet</option>';
    gm.innerHTML = modelOptionsHtml(null);
  }
  function roster() {
    const r = el('roster'); r.innerHTML = '';
    AGENTS.filter(a => viewMode === 'all' || a.curFloor === viewMode).forEach(a => {
      const L = LBL[a.state!] || LBL.idle, d = document.createElement('div');
      d.className = 'arow' + (selected === a ? ' on' : '');
      d.innerHTML = '<span class="sw" style="background:#' + a.c.toString(16).padStart(6, '0') + '"></span>' +
        '<span class="nm">' + a.n + (a.det ? ' <span style="color:#98a1b4;font-size:9px">·s</span>' : '') + '</span>' +
        '<span class="fl2">0' + a.curFloor + '</span>' +
        '<span class="st" style="color:' + L[0] + '">' + L[1] + '</span>';
      d.onclick = () => selectAgent(a);
      d.onmouseenter = () => { a.el!.style.opacity = '1'; };
      d.onmouseleave = () => { if (selected !== a) a.el!.style.opacity = '0'; };
      r.appendChild(d);
    });
    OWNERS.filter(a => viewMode === 'all' || a.curFloor === viewMode).forEach(a => {
      const d = document.createElement('div');
      d.className = 'arow' + (selected === a ? ' on' : '');
      d.innerHTML = '<span class="sw" style="background:#' + a.c.toString(16).padStart(6, '0') + '"></span>' +
        '<span class="nm">' + a.n + '</span><span class="fl2">0' + a.curFloor + '</span>' +
        '<span class="ow">OWNER</span>';
      d.onclick = () => selectAgent(a);
      d.onmouseenter = () => { a.el!.style.opacity = '1'; };
      d.onmouseleave = () => { if (selected !== a) a.el!.style.opacity = '0'; };
      r.appendChild(d);
    });
    /* owners are people, not fleet — they never enter this count */
    const n = AGENTS.filter(a => a.state === 'working' || a.state === 'assigned' || a.state === 'moving').length;
    el('nact').textContent = n ? n + ' Agents on task' : AGENTS.length + ' Agents · idle';
  }
  function selectAgent(a: Agent) {
    selected = a;
    CAST.forEach(x => { x.el!.style.opacity = x === a ? '1' : '0'; });
    root.classList.remove('norail');
    el('ov').classList.add('off');
    const i = el('insp'); i.classList.add('on');
    const L = LBL[a.state!] || LBL.idle;
    const tok = a.tokensReal === null || a.tokensReal === undefined ? '—' : a.tokensReal.toLocaleString();
    const info = a.mesh_info;
    const modelNow = info?.model ?? (a.det ? 'script · no model' : '—');
    const costDot = COST_COLOURS[info?.costClass ?? ''] || '#98a1b4';
    i.innerHTML = '<span class="iback">← OVERVIEW</span>' +
      '<div class="ihead"><div class="iav" style="background:#' + a.c.toString(16).padStart(6, '0') + '"></div>' +
      '<div><div class="iname">' + a.n + '</div><div class="irole">' + a.role + ' · Floor 0' + a.curFloor + '</div></div></div>' +
      '<div class="tags">' + a.tools.map(t => '<span class="tag' + (t.indexOf('guarded') === 0 ? ' g' : '') + '">' + t + '</span>').join('') + '</div>' +
      '<div class="kv"><span>State</span><b style="color:' + L[0] + '">' + L[1] +
        (a.state === 'throttled' && info?.throttledUntil ? ' · resets ' + new Date(info.throttledUntil).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '') + '</b></div>' +
      '<div class="kv"><span>Model</span><b><span class="d" style="background:' + costDot + ';display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px"></span>' + modelNow + '</b></div>' +
      '<div class="kv"><span>Tokens today</span><b>' + tok + '</b></div>' +
      (a.owner
        ? '<p class="note">An owner, not an agent. Never dispatched, never billed, and never counted ' +
          'in the fleet — the head seat at the boardroom table is the only thing this seat books.</p>'
        : a.det
        ? '<p class="note">Deterministic — zero model tokens. Still gets a desk.</p>'
        : '<div class="rh" style="margin-top:14px">Model — takes effect next task, never mid-run</div>' +
          '<select class="msel" data-i="mpin" style="margin-top:0">' + modelOptionsHtml(info?.pin ?? null) + '</select>' +
          '<label class="mchk"><input type="checkbox" data-i="mstrict"' + (info?.strict ? ' checked' : '') + '/> strict — wait for this model, never substitute</label>' +
          '<input class="mtxt" data-i="mchain" placeholder="fallback chain — model ids, comma separated" value="' + (info?.chain ?? []).join(', ').replace(/"/g, '&quot;') + '"/>' +
          '<button class="btn" data-i="applym" style="width:100%;margin-top:8px;font-size:11px">Apply model settings</button>') +
      '<div class="ibtns">' + (a.owner ? '' : '<button class="btn p" data-i="assign">Assign task</button>') +
      '<button class="btn" data-i="log">Console</button></div>';
    (i.querySelector('.iback') as HTMLElement).onclick = () => {
      selected = null;
      i.classList.remove('on'); el('ov').classList.remove('off');
      CAST.forEach(x => { x.el!.style.opacity = '0'; }); roster();
    };
    const assignBtn = i.querySelector('[data-i="assign"]') as HTMLElement | null;
    if (assignBtn) assignBtn.onclick = () => opts.onNewTask(a.id);
    (i.querySelector('[data-i="log"]') as HTMLElement).onclick = () => opts.onOpenConsole();
    const applyBtn = i.querySelector('[data-i="applym"]') as HTMLElement | null;
    if (applyBtn) applyBtn.onclick = () => {
      const pin = (i.querySelector('[data-i="mpin"]') as HTMLSelectElement).value || null;
      const strict = (i.querySelector('[data-i="mstrict"]') as HTMLInputElement).checked;
      const chain = (i.querySelector('[data-i="mchain"]') as HTMLInputElement).value
        .split(',').map(s => s.trim()).filter(Boolean);
      opts.onSetModel?.(a.id, { pin, strict, chain });
    };
    roster();
  }
  on('applygroup', () => {
    const team = (el('gteam') as unknown as HTMLSelectElement)?.value;
    const pin = (el('gmodel') as unknown as HTMLSelectElement)?.value || null;
    if (team) opts.onSetGroupModel?.(team, pin);
  });

  /* pick */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let downAt = 0, downX = 0;
  sceneHost.addEventListener('pointerdown', e => { downAt = Date.now(); downX = (e as PointerEvent).clientX; });
  sceneHost.addEventListener('pointerup', e => {
    const pe = e as PointerEvent;
    if (Date.now() - downAt > 230 || Math.abs(pe.clientX - downX) > 6) return;
    const r = sceneHost.getBoundingClientRect();
    ptr.x = ((pe.clientX - r.left) / r.width) * 2 - 1; ptr.y = -((pe.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    const hits = ray.intersectObjects(scene.children, true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o) {
        if (o.userData && o.userData.agentRoot) {
          const a = CAST.find(x => x.mesh === o!.userData.agentRoot);
          if (a) { selectAgent(a); return; }
        }
        o = o.parent;
      }
    }
  });

  /* ── stair travel ────────────────────────────────────────────────
     Two flights. Leg 1 climbs the east side from the build floor to the
     mezzanine; leg 2 climbs the west side from the mezzanine through the
     stairwell void into the executive floor. A trip from 01 to 03 is
     therefore a real climb, a walk across the mezzanine, and a second
     climb — no teleport, and both sets of stairs get used. */
  const LEG: Record<number, THREE.Vector3[]> = {
    1: [V3(SX - 1.3, 0, SBOT + .8), V3(SX, 0, SBOT + .1), V3(SX, F2Y, STOP), V3(SX - 1.5, F2Y, STOP - .7)],
    2: [V3(S2X + 1.9, F2Y, S2BOT + .4), V3(S2X, F2Y, S2BOT - .1), V3(S2X, F3Y, S2TOP), V3(S2X + 1.9, F3Y, S2TOP - 1)],
  };
  /* the mezzanine link, hugging the balustrade so the walk between the
     two flights does not cut through the studio desks */
  const MEZZ = [V3(9.2, F2Y, 1.8), V3(-9.9, F2Y, 2.2)];
  function stairPath(from: number, to: number): THREE.Vector3[] {
    const p: THREE.Vector3[] = [];
    if (to > from) for (let f = from; f < to; f++) { if (p.length) p.push(...MEZZ); p.push(...LEG[f]); }
    else for (let f = from - 1; f >= to; f--) {
      if (p.length) p.push(...MEZZ.slice().reverse());
      p.push(...LEG[f].slice().reverse());
    }
    return p;
  }
  let travelers = 0;
  function startTravel(a: Agent, dest: number, cb: (() => void) | null, force?: boolean) {
    if (a.traveling || (!force && travelers >= 2)) { cb && cb(); return; }
    travelers++; a.traveling = true; a.state = 'travel'; a.tgt = null; a.act = null; a.bub!.style.opacity = '0';
    scene.attach(a.mesh!);
    const path = stairPath(a.curFloor!, dest);
    path.unshift(V3(a.mesh!.position.x, FLOOR_Y[a.curFloor!], a.mesh!.position.z));
    a.path = path; a.pi = 1; a.dest = dest; a.travelCb = cb || null;
    roster();
  }
  function endTravel(a: Agent) {
    const g = FLOOR_GROUP[a.dest!]; g.attach(a.mesh!);
    a.mesh!.position.y = 0; a.curFloor = a.dest;
    a.pos!.set(a.mesh!.position.x, a.mesh!.position.z);
    a.traveling = false; travelers--; a.state = 'idle'; a.nextAct = clock.elapsedTime + 2;
    const cb = a.travelCb; a.travelCb = null; roster(); cb && cb();
  }

  /* ── ambient routine: boards, coffee, chats, floor trips ── */
  let meeting = false;
  const SPOTS: Record<number, { board: { x: number; z: number; ry: number }[]; coffee: { x: number; z: number; ry: number }[] }> = {
    1: { board: [{ x: -13.9, z: -15.2, ry: Math.PI }, { x: 4.5, z: -5.5, ry: Math.PI }],
      coffee: [{ x: -8.6, z: 6, ry: 2.2 }, { x: -11.3, z: 8.3, ry: -.6 }] },
    2: { board: [{ x: -9, z: -5.5, ry: Math.PI }, { x: 11.4, z: -.4, ry: 0 }],
      coffee: [{ x: -11, z: .3, ry: .4 }, { x: -9.7, z: 1.2, ry: -.5 }] },
    3: { board: [{ x: 3.7, z: -12.8, ry: Math.PI }, { x: -9, z: -7.9, ry: 0 }],
      coffee: [{ x: 11, z: -4.5, ry: 0 }, { x: 1.6, z: -4.2, ry: .3 }] },
  };
  function chooseAct(a: Agent, t: number) {
    const r = Math.random();
    /* owners keep to the executive floor; agents drift between all three */
    if (r < .14 && travelers < 2 && !a.sit && !a.owner && !meeting) {
      const other = [1, 2, 3].filter(f => f !== a.curFloor);
      startTravel(a, other[Math.floor(Math.random() * other.length)], null); return;
    }
    const S = SPOTS[a.curFloor!];
    if (r < .38) {
      const s = S.board[Math.floor(Math.random() * S.board.length)];
      a.tgt = new THREE.Vector2(s.x, s.z); a.pendAct = { type: 'board', ry: s.ry, dur: 4 + Math.random() * 3 };
    } else if (r < .56) {
      const s = S.coffee[Math.floor(Math.random() * S.coffee.length)];
      a.tgt = new THREE.Vector2(s.x, s.z); a.pendAct = { type: 'coffee', ry: s.ry, dur: 3.5 + Math.random() * 2.5 };
    } else if (r < .62) { a.pendAct = null; a.act = { type: 'pause', until: t + 1.6 + Math.random() * 1.4 }; }
    else { const w = a.idle[a.wp!++ % a.idle.length]; a.tgt = new THREE.Vector2(w[0], w[1]); a.pendAct = null; }
  }
  let chatT = 0;
  function tryChat(t: number) {
    if (REDUCED || t - chatT < 7 || meeting) return;
    ([1, 2, 3] as const).forEach(fl => {
      const pool = CAST.filter(a => a.curFloor === fl && a.state === 'idle' && !a.act && !a.tgt);
      if (pool.length < 2 || Math.random() < .5) return;
      chatT = t;
      const A = pool[0], B = pool[1];
      const mid = new THREE.Vector2((A.pos!.x + B.pos!.x) / 2, (A.pos!.y + B.pos!.y) / 2);
      A.tgt = mid.clone().add(new THREE.Vector2(-.45, 0));
      B.tgt = mid.clone().add(new THREE.Vector2(.45, 0));
      A.state = B.state = 'chat'; A.chatEnd = B.chatEnd = t + 6; A.mate = B; B.mate = A;
    });
  }

  /* ── real state in ── */
  function goToSeat(a: Agent, thenState: string) {
    a.act = null; a.pendAct = null; a.bub!.style.opacity = '0';
    const go = () => {
      a.state = 'moving'; a.tgt = new THREE.Vector2(a.seat[0], a.seat[1]);
      (a as Agent & { arriveState?: string }).arriveState = thenState;
      roster();
    };
    if (a.curFloor !== a.floor) startTravel(a, a.floor, go);
    else if (!a.traveling) go();
    else a.travelCb = go;
  }

  function applyReal(a: Agent) {
    const s = a.real;
    const wasOffline = a.state === 'offline';
    /* A meeting is a human instruction, and it outranks the sim's own
       idea of where an agent should stand. The real state is still
       recorded and still ghosts an offline lane — it is simply not
       allowed to drag anyone out of the boardroom mid-meeting, and it
       is re-applied in full the moment the meeting ends. */
    if (meeting) { applyAgentOpacity(a); roster(); return; }
    if (s === null) {
      if (a.state === 'working' || a.state === 'assigned' || a.state === 'blocked' ||
          a.state === 'failed' || a.state === 'throttled' || a.state === 'offline') {
        a.state = 'idle'; a.nextAct = clock.elapsedTime + 1 + Math.random() * 3;
      }
      if (wasOffline) applyAgentOpacity(a);
      roster(); return;
    }
    if (s === 'working' || s === 'assigned') goToSeat(a, s);
    else if (s === 'throttled') goToSeat(a, 'throttled');   // waits at its desk, amber, counting down
    else { a.tgt = null; a.state = s; }
    if (wasOffline !== (s === 'offline')) applyAgentOpacity(a);
    roster();
  }

  const feedFn = (line: string) => { pushTerm('› ' + line.replace(/<[^>]+>/g, '')); };

  /* translucent = the bridge is down. However bad it looks, an office
     that lies about what it is doing is worse than no office. A single
     agent whose own lane is down goes translucent alone. */
  let translucent = false;
  function applyAgentOpacity(a: Agent) {
    const ghost = translucent || a.state === 'offline' || a.real === 'offline';
    a.mesh!.traverse(o => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(m => {
        const std = m as THREE.MeshStandardMaterial;
        std.transparent = ghost || std.userData?.wasTransparent === true;
        std.opacity = ghost ? .3 : (std.userData?.baseOpacity ?? 1);
      });
    });
  }
  function applyTranslucency() { CAST.forEach(applyAgentOpacity); }

  /* ── the meeting ─────────────────────────────────────────────────
     A human presses the button. Every agent walks to the boardroom by
     the stairs — both flights, from whichever floor it is on — and takes
     a seat at the long table; both owners take the head seats. No model
     is invoked at any point: this is choreography over the same walk
     cycle the room already runs, so calling a meeting costs nothing. */
  const MSEATS = ([] as { x: number; z: number; ry: number }[]).concat(
    [-1.5, .3, 2.1, 3.9, 5.7, 7.5].map(x => ({ x, z: -12.4, ry: 0 })),
    [-1.5, .3, 2.1, 3.9, 5.7, 7.5].map(x => ({ x, z: -8.6, ry: Math.PI })),
  );
  const HEADS = [{ x: -3.4, z: -10.5, ry: Math.PI / 2 }, { x: 10.8, z: -10.5, ry: -Math.PI / 2 }];
  /* Every call to setMeeting stamps a new sequence number. A walk that
     was already in flight when the meeting ended carries the old stamp
     and quietly gives up, instead of arriving three storeys up and
     sitting down at a table nobody is at any more. */
  let meetSeq = 0;
  function sendSeat(a: Agent, floor: number, s: { x: number; z: number; ry: number }, st: string, seq: number) {
    a.act = null; a.pendAct = null; a.bub!.style.opacity = '0';
    if (a.mate) { a.mate.mate = null; a.mate = null; }
    /* self-correcting: whichever floor the walk actually lands on, it
       re-dispatches until the agent is on the right one */
    const go = () => {
      if (seq !== meetSeq) return;
      /* a walk already in flight has to land before anything else is
         true about where this agent is - curFloor still says the floor
         it left */
      if (a.traveling) { a.travelCb = go; return; }
      if (a.curFloor === floor) {
        a.state = 'moving'; a.tgt = new THREE.Vector2(s.x, s.z);
        a.arriveState = st; a.arriveRy = s.ry; roster(); return;
      }
      startTravel(a, floor, go, true);
    };
    go();
  }
  function setMeeting(nowOn: boolean) {
    meeting = nowOn;
    const seq = ++meetSeq;
    const b = root.querySelector('[data-act="meet"]') as HTMLElement | null;
    if (b) { b.classList.toggle('on', nowOn); b.textContent = nowOn ? 'End meeting' : 'Meeting'; }
    if (nowOn) {
      OWNERS.forEach((o, i) => sendSeat(o, 3, HEADS[i], 'meeting', seq));
      AGENTS.forEach((a, i) => sendSeat(a, 3, MSEATS[i % MSEATS.length], 'meeting', seq));
      feedFn('meeting called · everyone to the boardroom, floor 03');
    } else {
      OWNERS.forEach(o => sendSeat(o, 3, { x: o.seat[0], z: o.seat[1], ry: Math.PI }, 'idle', seq));
      const home = (a: Agent) => {
        if (seq !== meetSeq) return;
        if (a.traveling) { a.travelCb = () => home(a); return; }
        if (a.curFloor === a.floor) { a.state = 'idle'; a.nextAct = clock.elapsedTime + Math.random() * 5; return; }
        startTravel(a, a.floor, () => home(a), true);
      };
      AGENTS.forEach(a => {
        a.arriveState = undefined; a.arriveRy = undefined;
        a.act = null; a.pendAct = null; a.tgt = null; a.state = 'idle';
        home(a);
      });
      /* whatever the fleet is actually doing is authoritative again */
      AGENTS.forEach(applyReal);
      feedFn('meeting ended · agents back to their floors');
    }
    roster();
  }
  on('meet', () => setMeeting(!meeting));

  CAST.forEach(a => a.mesh!.traverse(o => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    mats.forEach(m => { m.userData = { wasTransparent: m.transparent, baseOpacity: (m as THREE.MeshStandardMaterial).opacity }; });
  }));

  /* Software GL (CI, remote desktops) is detected up front - the room
     stays honest and interactive instead of beautiful and frozen. A CPU
     rasteriser spends over a second per draw, so shadows and full-res
     rasterisation go too, and draws are throttled in the tick below.
     Real GPUs never take this branch. */
  let softGL = false, lastDraw = 0;
  try {
    const gl = renderer.getContext();
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const gpu = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    if (/swiftshader|llvmpipe|software/i.test(gpu)) {
      softGL = true;
      renderer.shadowMap.enabled = false;
      renderer.setPixelRatio(.5);
    }
  } catch { /* assume a real GPU */ }

  /* ── main loop ── */
  const clock = new THREE.Clock(), tmp = new THREE.Vector3(), wpos = new THREE.Vector3();
  let drag = false, px = 0, raf = 0, disposed = false;
  const onDown = (e: PointerEvent) => { drag = true; px = e.clientX; };
  const onUp = () => { drag = false; };
  const onMove = (e: PointerEvent) => {
    if (!drag) return;
    tYaw = Math.max(-.32, Math.min(.32, tYaw + (e.clientX - px) * .003)); px = e.clientX;
  };
  const onWheel = (e: WheelEvent) => { e.preventDefault(); FT = Math.max(10, Math.min(34, FT + e.deltaY * .012)); };
  sceneHost.addEventListener('pointerdown', onDown);
  addEventListener('pointerup', onUp);
  addEventListener('pointermove', onMove);
  sceneHost.addEventListener('wheel', onWheel, { passive: false });
  disposers.push(() => {
    removeEventListener('pointerup', onUp);
    removeEventListener('pointermove', onMove);
  });

  function tick() {
    if (disposed) return;
    raf = requestAnimationFrame(tick);
    if (document.hidden) return;   // paused when the tab is hidden
    const dt = Math.min(clock.getDelta(), .05), t = clock.elapsedTime;
    camY += (camYT - camY) * (REDUCED ? 1 : .07);
    if (Math.abs(F - FT) > .005) { F += (FT - F) * (REDUCED ? 1 : .08); applyCam(); }
    yaw += (tYaw - yaw) * .06;
    camera.position.set(Math.sin(.785 + yaw) * 40, camY + 26, Math.cos(.785 + yaw) * 40);
    camera.lookAt(0, camY + 2.2, 0);

    CAST.forEach(a => {
      const u = a.mesh!.userData as { torso: THREE.Object3D; head: THREE.Object3D; hipL: THREE.Object3D; hipR: THREE.Object3D; shL: THREE.Object3D; shR: THREE.Object3D; ring: THREE.Object3D | null };
      a.ph! += dt; let mv = false;
      if (u.ring) { u.ring.rotation.z += dt * .85; u.ring.position.y = 2.18 + Math.sin(a.ph! * 1.3) * .035; }

      /* Called to a meeting, people walk faster - and a route that spans
         three storeys and two flights is a long way to watch at a stroll. */
      const SPD = meeting ? 5.2 : 2.9;
      a.mvs = SPD;
      if (a.traveling) {
        const target = a.path![a.pi!], p3 = a.mesh!.position;
        const d = tmp.copy(target).sub(p3), L = d.length();
        if (L < .12) { a.pi!++; if (a.pi! >= a.path!.length) endTravel(a); }
        else {
          d.divideScalar(L).multiplyScalar(SPD * dt); p3.add(d); mv = true;
          if (Math.abs(d.x) + Math.abs(d.z) > .0001) a.mesh!.rotation.y = Math.atan2(d.x, d.z);
        }
      } else {
        const pinned = a.real !== null;   // real state overrides the sim
        if (!pinned && a.state === 'idle' && !a.tgt && !a.act && !REDUCED && t > a.nextAct!) {
          chooseAct(a, t); a.nextAct = t + 1.8 + Math.random() * 3.4;
        }
        if (a.act && t > a.act.until) { a.act = null; a.nextAct = t + 1 + Math.random() * 3; }
        if (a.state === 'chat' && t > a.chatEnd!) {
          a.state = 'idle'; a.bub!.style.opacity = '0';
          if (a.mate) { a.mate.state = 'idle'; a.mate.bub!.style.opacity = '0'; } roster();
        }
        if (a.tgt) {
          const d = a.tgt.clone().sub(a.pos!), L = d.length();
          if (L < .07) {
            a.pos!.copy(a.tgt); a.tgt = null;
            const arrive = a.arriveState;
            if (a.state === 'moving') {
              a.state = arrive || 'working'; a.arriveState = undefined;
              if (a.arriveRy !== undefined) { a.mesh!.rotation.y = a.arriveRy; a.arriveRy = undefined; }
              roster();
            } else if (a.state === 'chat' && a.mate) {
              a.mesh!.rotation.y = Math.atan2(a.mate.pos!.x - a.pos!.x, a.mate.pos!.y - a.pos!.y);
              a.bub!.style.opacity = '1';
            } else if (a.pendAct) {
              a.act = { type: a.pendAct.type, until: t + a.pendAct.dur };
              a.mesh!.rotation.y = a.pendAct.ry; a.pendAct = null;
            }
          } else {
            const w = meeting ? 4.1 : 2.5;
            a.mvs = w;
            d.divideScalar(L).multiplyScalar(w * dt); a.pos!.add(d); mv = true;
            a.mesh!.rotation.y = Math.atan2(d.x, d.y);
          }
        }
        a.mesh!.position.x = a.pos!.x; a.mesh!.position.z = a.pos!.y;
        const sit = a.state === 'working' || a.state === 'meeting';
        a.mesh!.position.y += ((sit ? -.06 : 0) - a.mesh!.position.y) * .15;
      }

      /* limbs */
      const lerp = (o: THREE.Object3D, v: number) => { o.rotation.x += (v - o.rotation.x) * .18; };
      const meet = a.state === 'meeting' && !a.traveling;
      const sit = (a.state === 'working' || meet) && !a.traveling;
      if (mv && !REDUCED) {
        /* per-agent gait, so a room of thirteen does not march in step -
           and scaled by the actual speed, or a hurried walk turns into a
           moon-walk with the feet sliding under a slow cadence */
        const gait = (7.4 + (a.id.charCodeAt(0) % 7) * .42) * ((a.mvs || 2.5) / 2.5);
        const s = Math.sin(a.ph! * gait);
        lerp(u.hipL, s * .68); lerp(u.hipR, -s * .68);
        lerp(u.shL, -s * .52); lerp(u.shR, s * .52);      // arms oppose the legs
        u.torso.position.y = 1.06 + Math.abs(Math.cos(a.ph! * gait)) * .03;
        u.torso.rotation.z = Math.sin(a.ph! * gait) * .035;   // shoulder roll
        u.torso.rotation.x = .07;                             // lean into the walk
        u.head.rotation.z = -Math.sin(a.ph! * gait) * .028;   // head steadies itself
        u.head.position.y = 1.72 + Math.abs(Math.sin(a.ph! * gait)) * .012;
      } else if (sit) {
        lerp(u.hipL, -1.35); lerp(u.hipR, -1.35);
        if (meet) {
          /* round the table: hands resting, not typing, and a head that
             tracks whoever is speaking */
          const s = REDUCED ? 0 : Math.sin(a.ph! * .9);
          lerp(u.shL, -.72 + s * .05); lerp(u.shR, -.72 - s * .05);
          u.head.rotation.y = REDUCED ? 0 : Math.sin(a.ph! * .55) * .3;
          u.torso.rotation.z = REDUCED ? 0 : Math.sin(a.ph! * .7) * .02;
          u.head.position.y = 1.72 + (REDUCED ? 0 : Math.sin(a.ph! * 1.1) * .01);
        } else {
          const s = REDUCED ? 0 : Math.sin(a.ph! * 6.5);
          lerp(u.shL, -.95 + s * .09); lerp(u.shR, -.95 - s * .09);
          u.head.position.y = 1.72 + (REDUCED ? 0 : Math.sin(a.ph! * 1.5) * .012);
        }
      } else {
        lerp(u.hipL, 0); lerp(u.hipR, 0);
        const cof = a.act && a.act.type === 'coffee';
        lerp(u.shL, cof ? -1.3 : .06); lerp(u.shR, -.06);
        u.head.position.y = 1.72 + (REDUCED ? 0 : Math.sin(a.ph! * 1.1) * .02);
        if (a.act && a.act.type === 'board' && !REDUCED) u.head.rotation.y = Math.sin(a.ph! * 1.4) * .22;
        else u.head.rotation.y *= .9;
        if (a.state === 'chat' && !REDUCED) u.head.rotation.x = Math.sin(a.ph! * 3) * .07;
      }
    });
    tryChat(t);
    /* On a CPU rasteriser a single draw costs over a second, so painting
       every rAF tick - GL or the moving label chips, either one - would
       peg the frame pipeline and swallow every click. Ticks between draws
       must leave the page visually untouched so they stay cheap; the
       simulation state above still advances on every one of them. */
    /* The gap must exceed the software rasteriser's per-frame stall
       (~1.3s measured), or backpressure delays every rAF tick past the
       deadline and each one redraws - no free window ever opens. */
    const willDraw = !softGL || performance.now() - lastDraw >= 2800;
    if (!willDraw) return;   // the next frame is already scheduled above
    [f1, f2, f3].forEach(fg => fg.children.forEach(o => {
      if (o.userData && o.userData.leds) (o.userData.leds as THREE.Mesh[]).forEach((l, i) =>
        ((l.material as THREE.MeshStandardMaterial).emissiveIntensity = .35 + Math.abs(Math.sin(t * 1.7 + i * 1.3)) * .85));
    }));

    /* labels */
    const rc = sceneHost.getBoundingClientRect();
    const proj = (v: THREE.Vector3, elx: HTMLElement, off: number) => {
      tmp.copy(v).project(camera);
      elx.style.left = ((tmp.x * .5 + .5) * rc.width) + 'px';
      elx.style.top = (((-tmp.y * .5 + .5) * rc.height) - off) + 'px';
    };
    labelPool.forEach(h => {
      const show = h.f === 0 ? viewMode === 'all' : viewMode === 'all' ? h.k : h.f === viewMode;
      h.el.style.opacity = show ? '1' : '0'; if (!show) return;
      tmp.copy(h.v); tmp.y += FLOOR_Y[h.f] || 0;
      proj(tmp, h.el, h.off);
    });
    CAST.forEach(a => {
      a.mesh!.getWorldPosition(wpos);
      const show = viewMode === 'all' || Math.abs(wpos.y - FLOOR_Y[viewMode as number]) < 4;
      if (!show) { a.el!.style.opacity = '0'; a.bub!.style.opacity = '0'; return; }
      /* a real state is worth a nameplate without waiting for a hover -
         the model doing the work is the point of the room */
      if (a.real !== null) a.el!.style.opacity = '1';
      a.el!.style.borderColor = a.state === 'throttled' ? '#f5c518' : '';
      if (a.state === 'throttled' && a.mesh_info?.throttledUntil) {
        const mEl = a.el!.querySelector('[data-m]');
        if (mEl) {
          const ms = new Date(a.mesh_info.throttledUntil).getTime() - Date.now();
          const model = a.mesh_info.model ? a.mesh_info.model.replace(/^[^/]+\//, '') : '—';
          mEl.innerHTML = ms > 0
            ? model + ' <span class="cd">· resets ' + Math.floor(ms / 60000) + 'm' + String(Math.floor(ms / 1000) % 60).padStart(2, '0') + 's</span>'
            : model + ' <span class="cd">· reset due</span>';
        }
      }
      proj(tmp.set(wpos.x, wpos.y + 2.35, wpos.z), a.el!, 16);
      const cascading = (a as Agent & { cascadeUntil?: number }).cascadeUntil;
      if (cascading && Date.now() >= cascading) {
        (a as Agent & { cascadeUntil?: number }).cascadeUntil = undefined;
        a.bub!.style.opacity = '0'; a.bub!.innerHTML = '<b>· · ·</b>';
      }
      if (a.state === 'chat' || (cascading && Date.now() < cascading)) {
        proj(tmp.set(wpos.x, wpos.y + 2.5, wpos.z), a.bub!, 28);
      }
    });
    renderer.render(scene, camera);
    /* Stamp AFTER the draw: on a CPU rasteriser it can take over a
       second, and the free window must be measured from its end. */
    if (softGL) lastDraw = performance.now();
  }

  function resize() {
    aspect = sceneHost.clientWidth / Math.max(sceneHost.clientHeight, 1);
    renderer.setSize(sceneHost.clientWidth, sceneHost.clientHeight); applyCam();
  }
  const ro = new ResizeObserver(resize); ro.observe(sceneHost);
  disposers.push(() => ro.disconnect());
  setView('all'); roster(); resize(); tick();

  return {
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      disposers.forEach(d => d());
      renderer.dispose();
      host.removeChild(root);
    },
    setBridgeLine(text) { el('nsub').textContent = text; },
    setAgentState(roleKey, state) {
      const a = chars[roleKey]; if (!a) return;
      a.real = state; applyReal(a);
    },
    setAgentTokens(map) {
      AGENTS.forEach(a => { a.tokensReal = map[a.id] ?? null; });
      if (selected) selectAgent(selected);
    },
    setAgentMesh(roleKey, info) {
      const a = chars[roleKey]; if (!a) return;
      const before = JSON.stringify(a.mesh_info ?? null);
      a.mesh_info = info;
      if (JSON.stringify(info) !== before) {
        drawChip(a);
        if (selected === a) selectAgent(a);
      }
    },
    setRegistry(rows) {
      registryOpts = rows;
      refreshGroupPickers();
      if (selected) selectAgent(selected);
    },
    setTeams(teams) { teamsList = teams; refreshGroupPickers(); },
    setFleetWall(rows) { drawFleetWall(rows); },
    cascade(line, toKey) {
      feedFn(line);
      const a = toKey ? chars[toKey] : null;
      if (a) {
        (a as Agent & { cascadeUntil?: number }).cascadeUntil = Date.now() + 4000;
        a.bub!.innerHTML = '<b>↷ FALLBACK</b>';
        a.bub!.style.opacity = '1';
        if (a.real === null) { a.real = 'assigned'; applyReal(a); }
      }
    },
    setMeters(m) {
      const set = (bar: string, val: string, pct: number | null, colour: string) => {
        el(val).textContent = pct === null ? '—' : Math.round(pct) + '%';
        const b = el(bar); b.style.width = (pct ?? 0) + '%'; b.style.background = colour;
      };
      set('m1', 'm1v', m.fiveHourPct, '#2563eb');
      set('m2', 'm2v', m.weeklyPct, '#6d3fd4');
    },
    setTranslucent(v) { if (v !== translucent) { translucent = v; applyTranslucency(); } },
    feed: feedFn,
    assignMoment(roleKeys) {
      roleKeys.forEach((k, i) => {
        const a = chars[k]; if (!a) return;
        setTimeout(() => { if (!disposed && a.real === null) { a.real = 'assigned'; applyReal(a); } }, i * 420);
      });
    },
  };
}
