import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

/*
 * The Brain room.
 *
 * A black room with one thing in it. The brain is a point cloud - a few
 * thousand particles held in a brain-shaped field, drifting, with
 * synapses firing along real connections.
 *
 * What makes it alive rather than decorative: every firing is a real row.
 * A memory node written anywhere in the office lights the lobe belonging
 * to the agent that wrote it, and the pulse travels. Idle is idle: with
 * nothing happening the brain breathes and little else. It is never
 * animated to look busy - if the office is quiet, so is the brain.
 *
 * Click a lobe to open that agent's own memory.
 */

type Mem = {
  id: string; ts: string; kind: string; model: string | null;
  title: string; summary: string; ok: boolean | null; task: string | null; depth: number;
};

const rpc = (fn: string, args: Record<string, unknown>) =>
  (supabase.rpc as unknown as (f: string, a: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>)(fn, args);

/* A deterministic seat on the brain for each agent, so a lobe always
   means the same agent between visits. */
function seatFor(key: string, i: number, total: number): THREE.Vector3 {
  let h = 0;
  for (let c = 0; c < key.length; c++) h = (h * 31 + key.charCodeAt(c)) >>> 0;
  const ang = (i / Math.max(total, 1)) * Math.PI * 2;
  const side = (h & 1) ? 1 : -1;
  return new THREE.Vector3(
    Math.cos(ang) * 1.35 + side * .45,
    Math.sin(ang) * .78 + ((h >> 3) % 100) / 400 - .12,
    Math.sin(ang * 1.7) * .55,
  );
}

export function BrainRoom({ open, onClose, agents }: {
  open: boolean; onClose: () => void; agents: { role_key: string; name: string; avatar_colour: string }[];
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const fireRef = useRef<(key: string) => void>(() => {});
  const [active, setActive] = useState<string | null>(null);
  const [memory, setMemory] = useState<Mem[]>([]);
  const [pulse, setPulse] = useState<{ agent: string; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const openAgent = useCallback(async (key: string) => {
    setActive(key); setLoading(true);
    const { data } = await rpc('memory_agent', { p_agent: key, p_limit: 60 });
    setMemory((data as Mem[] | null) ?? []);
    setLoading(false);
  }, []);

  /* ── the brain ── */
  useEffect(() => {
    if (!open || !hostRef.current) return;
    const host = hostRef.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
    catch { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, .17);
    const camera = new THREE.PerspectiveCamera(42, host.clientWidth / Math.max(host.clientHeight, 1), .1, 100);
    camera.position.set(0, .25, 5.6);

    /* the room: a black box you can just about feel the corners of */
    const room = new THREE.Mesh(
      new THREE.BoxGeometry(26, 16, 26),
      new THREE.MeshBasicMaterial({ color: 0x05070d, side: THREE.BackSide }),
    );
    scene.add(room);
    const grid = new THREE.GridHelper(26, 26, 0x0d2b3f, 0x081a26);
    grid.position.y = -3.2; scene.add(grid);

    /* the brain: particles inside a lobed field */
    const COUNT = reduced ? 6000 : 20000;
    const pos = new Float32Array(COUNT * 3);
    const base = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);
    const c1 = new THREE.Color(0x9fe8ff), c2 = new THREE.Color(0xc4a8ff);
    for (let i = 0; i < COUNT; i++) {
      /* two hemispheres, folded: a sphere pushed into lobes with a
         sulcus down the middle and ridged noise on the surface */
      const u = Math.random(), v = Math.random();
      const th = Math.acos(2 * u - 1), ph = 2 * Math.PI * v;
      let x = Math.sin(th) * Math.cos(ph), y = Math.sin(th) * Math.sin(ph), z = Math.cos(th);
      const fold = .12 * Math.sin(y * 9 + x * 5) + .09 * Math.sin(z * 11 - y * 6);
      const shell = i % 3 !== 0;                     // two thirds surface, one third interior
      const r = shell
        ? 1.55 + fold + Math.random() * .04
        : (1.5 + fold) * (.35 + Math.pow(Math.random(), .6) * .6);
      x *= r * 1.28; y *= r * .92; z *= r;
      x += Math.sign(x) * .16;                       // split the hemispheres
      y -= Math.max(0, -z) * .12;                     // brainstem tuck
      const idx = i * 3;
      base[idx] = pos[idx] = x; base[idx + 1] = pos[idx + 1] = y; base[idx + 2] = pos[idx + 2] = z;
      const mix = (y + 1.6) / 3.2;
      const c = c1.clone().lerp(c2, Math.max(0, Math.min(1, mix)) * .85 + Math.random() * .15);
      col[idx] = c.r; col[idx + 1] = c.g; col[idx + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const cloud = new THREE.Points(geo, new THREE.PointsMaterial({
      size: .030, vertexColors: true, transparent: true, opacity: .95,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    scene.add(cloud);


    /* one lobe per agent: a seat, a light, and a hit target */
    const lobes = agents.map((a, i) => {
      const p = seatFor(a.role_key, i, agents.length);
      const colour = new THREE.Color(a.avatar_colour || '#63d8ff');
      const g = new THREE.Group(); g.position.copy(p);
      const core = new THREE.Mesh(
        new THREE.SphereGeometry(.085, 18, 14),
        new THREE.MeshBasicMaterial({ color: colour }),
      );
      const halo = new THREE.Mesh(
        new THREE.SphereGeometry(.26, 18, 14),
        new THREE.MeshBasicMaterial({ color: colour, transparent: true, opacity: .12, blending: THREE.AdditiveBlending }),
      );
      g.add(core, halo);
      g.userData = { key: a.role_key, name: a.name, core, halo, charge: 0, colour };
      scene.add(g);
      return g;
    });

    /* synapses: real firings only. each is a bead running a lobe→lobe arc. */
    type Spark = { from: THREE.Vector3; to: THREE.Vector3; t: number; mesh: THREE.Mesh };
    const sparks: Spark[] = [];
    const sparkGeo = new THREE.SphereGeometry(.045, 10, 8);
    const fire = (key: string) => {
      const lobe = lobes.find(l => (l.userData as { key: string }).key === key) ?? lobes[0];
      if (!lobe) return;
      (lobe.userData as { charge: number }).charge = 1;
      const other = lobes[Math.floor(Math.random() * lobes.length)];
      if (!other || other === lobe) return;
      const m = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({
        color: (lobe.userData as { colour: THREE.Color }).colour,
        transparent: true, blending: THREE.AdditiveBlending,
      }));
      scene.add(m);
      sparks.push({ from: lobe.position.clone(), to: other.position.clone(), t: 0, mesh: m });
    };
    fireRef.current = fire;

    /* pointer: click a lobe, open that agent's memory */
    const ray = new THREE.Raycaster(); const ptr = new THREE.Vector2();
    let hovering: string | null = null;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      ptr.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      ptr.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ptr, camera);
      const hit = ray.intersectObjects(lobes, true)[0];
      let root: THREE.Object3D | null = hit ? hit.object : null;
      while (root && !(root.userData as { key?: string }).key) root = root.parent;
      hovering = root ? (root.userData as { key: string }).key : null;
      host.style.cursor = hovering ? 'pointer' : 'default';
    };
    const onClick = () => { if (hovering) void openAgent(hovering); };
    host.addEventListener('pointermove', onMove);
    host.addEventListener('click', onClick);

    const clock = new THREE.Clock();
    let raf = 0, dead = false;
    const tick = () => {
      if (dead) return;
      raf = requestAnimationFrame(tick);
      const t = clock.getElapsedTime(), dt = Math.min(clock.getDelta(), .05);

      /* breathing: the whole mass rises and settles, slowly */
      if (!reduced) {
        const breath = 1 + Math.sin(t * .55) * .012;
        cloud.scale.setScalar(breath);
        cloud.rotation.y = Math.sin(t * .08) * .28;
        const p = geo.attributes.position.array as Float32Array;
        for (let i = 0; i < COUNT; i += 7) {           // a moving subset: drift, cheaply
          const j = i * 3;
          p[j] = base[j] + Math.sin(t * .8 + base[j + 1] * 3) * .012;
          p[j + 1] = base[j + 1] + Math.cos(t * .7 + base[j] * 3) * .012;
        }
        geo.attributes.position.needsUpdate = true;
      }

      lobes.forEach((l, i) => {
        const u = l.userData as { charge: number; core: THREE.Mesh; halo: THREE.Mesh };
        u.charge = Math.max(0, u.charge - dt * .55);
        const idle = .10 + Math.sin(t * 1.6 + i) * .03;
        (u.halo.material as THREE.MeshBasicMaterial).opacity = idle + u.charge * .55;
        u.halo.scale.setScalar(1 + u.charge * 1.5);
        u.core.scale.setScalar(1 + u.charge * .9);
      });

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.t += dt * 1.5;
        if (s.t >= 1) { scene.remove(s.mesh); s.mesh.geometry.dispose(); sparks.splice(i, 1); continue; }
        const arc = Math.sin(s.t * Math.PI) * .7;
        s.mesh.position.lerpVectors(s.from, s.to, s.t).add(new THREE.Vector3(0, arc, 0));
        (s.mesh.material as THREE.MeshBasicMaterial).opacity = Math.sin(s.t * Math.PI);
      }

      camera.position.x = Math.sin(t * .09) * .5;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(() => {
      renderer.setSize(host.clientWidth, host.clientHeight);
      camera.aspect = host.clientWidth / Math.max(host.clientHeight, 1);
      camera.updateProjectionMatrix();
    });
    ro.observe(host);

    return () => {
      dead = true; cancelAnimationFrame(raf); ro.disconnect();
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('click', onClick);
      renderer.dispose(); geo.dispose(); sparkGeo.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, [open, agents, openAgent]);

  /* Real events, not a timer: a memory node written anywhere fires the
     lobe of the agent that wrote it. Quiet office, quiet brain. */
  useEffect(() => {
    if (!open) return;
    const ch = supabase.channel('brain-memory')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'memory_nodes' },
        payload => {
          const n = payload.new as unknown as { agent: string | null; summary: string };
          if (!n.agent) return;
          fireRef.current(n.agent);
          setPulse({ agent: n.agent, text: n.summary });
          setTimeout(() => setPulse(p => (p && p.text === n.summary ? null : p)), 4200);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open]);

  const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const activeAgent = agents.find(a => a.role_key === active);

  if (!open) return null;
  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-black text-slate-200" role="dialog" aria-label="Brain memory">
      <div className="flex h-[54px] shrink-0 items-center gap-3 border-b border-cyan-300/10 px-4">
        <span className="text-[14px] font-bold tracking-tight text-cyan-50">
          QUOORO <span className="font-medium text-cyan-200/40">/ BRAIN</span>
        </span>
        <span className="hidden font-mono text-[8px] uppercase tracking-[0.18em] text-cyan-200/40 sm:block">
          every pulse is a real memory being written · quiet office, quiet brain
        </span>
        <button onClick={onClose} aria-label="Back to the office"
          className="ml-auto flex h-8 items-center gap-1.5 rounded-[8px] border border-cyan-300/20 px-3 text-[12px] font-semibold text-cyan-100 hover:bg-cyan-300/10">
          <X className="h-3.5 w-3.5" /> Office
        </button>
      </div>

      <div className="relative min-h-0 flex-1">
        <div ref={hostRef} className="absolute inset-0" />

        {/* live firing line */}
        {pulse && (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-cyan-300/20 bg-black/70 px-3.5 py-1.5 backdrop-blur">
            <p className="font-mono text-[10px] tracking-[0.05em] text-cyan-200">
              <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan-300 align-middle" />
              {pulse.agent}: {pulse.text.slice(0, 90)}
            </p>
          </div>
        )}

        {/* the lobe index, so a lobe is nameable without hunting */}
        <div className="pointer-events-none absolute bottom-4 left-4 hidden max-w-[240px] flex-wrap gap-1.5 sm:flex">
          {agents.map(a => (
            <span key={a.role_key}
              className={cn('rounded-full border px-2 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.08em]',
                active === a.role_key ? 'border-cyan-300/50 text-cyan-100' : 'border-white/10 text-slate-500')}>
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ background: a.avatar_colour || '#63d8ff' }} />
              {a.role_key}
            </span>
          ))}
        </div>

        {!active && (
          <p className="pointer-events-none absolute bottom-5 right-5 max-w-[230px] text-right text-[11px] leading-relaxed text-slate-500">
            Click a lobe to open that agent&apos;s own memory.
          </p>
        )}

        {/* one agent's memory */}
        {active && (
          <div className="absolute right-3 top-3 bottom-3 flex w-[330px] max-w-[80vw] flex-col rounded-[10px] border border-cyan-300/15 bg-[#040a12]/92 p-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: activeAgent?.avatar_colour || '#63d8ff' }} />
              <p className="text-[13px] font-semibold text-cyan-50">{activeAgent?.name ?? active}</p>
              <button onClick={() => { setActive(null); setMemory([]); }} aria-label="Close agent memory"
                className="ml-auto text-slate-500 hover:text-cyan-200"><X className="h-3.5 w-3.5" /></button>
            </div>
            <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.14em] text-cyan-200/40">
              {loading ? 'reading…' : `${memory.length} remembered step${memory.length === 1 ? '' : 's'}`}
            </p>
            <div className="mt-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto">
              {!loading && memory.length === 0 && (
                <p className="text-[11.5px] leading-relaxed text-slate-500">
                  This agent has done nothing yet. Nothing is invented to fill the space.
                </p>
              )}
              {memory.map(m => (
                <div key={m.id} className="rounded-[7px] border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
                  <p className="text-[11.5px] leading-snug text-slate-200">
                    {m.summary}
                    {m.ok === false && <span className="ml-1.5 font-mono text-[8px] text-rose-300">FAILED</span>}
                  </p>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-slate-500">
                    {m.kind}{m.model ? ` · ${m.model}` : ''} · {hhmm(m.ts)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
