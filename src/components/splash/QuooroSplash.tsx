import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface QuooroSplashProps {
  onComplete: () => void;
}

/* ─── App icon definitions matching sidebar ─── */
const APP_ICONS = [
  { letter: "Q", label: "Quooro AI", color: "#8B5CF6" },
  { letter: "W", label: "Website", color: "#3B82F6" },
  { letter: "D", label: "Designer", color: "#EC4899" },
  { letter: "C", label: "CRM", color: "#EF4444" },
  { letter: "P", label: "Products", color: "#F59E0B" },
  { letter: "A", label: "Apps", color: "#10B981" },
  { letter: "F", label: "Workflows", color: "#6366F1" },
  { letter: "M", label: "Mail", color: "#06B6D4" },
  { letter: "S", label: "CAD Studio", color: "#14B8A6" },
  { letter: "O", label: "Office", color: "#F97316" },
  { letter: "I", label: "Inventory", color: "#84CC16" },
  { letter: "V", label: "Vault", color: "#A855F7" },
];

const TOTAL_DURATION = 4200; // ms

/* ─── Canvas texture generator ─── */
function makeIconTexture(letter: string, hex: string): THREE.CanvasTexture {
  const s = 256;
  const canvas = document.createElement("canvas");
  canvas.width = s;
  canvas.height = s;
  const ctx = canvas.getContext("2d")!;

  const c = new THREE.Color(hex);
  const lighter = c.clone().lerp(new THREE.Color("#ffffff"), 0.2);
  const darker = c.clone().lerp(new THREE.Color("#000000"), 0.15);
  const grad = ctx.createLinearGradient(0, 0, 0, s);
  grad.addColorStop(0, `#${lighter.getHexString()}`);
  grad.addColorStop(1, `#${darker.getHexString()}`);

  const r = 52;
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(s - r, 0); ctx.quadraticCurveTo(s, 0, s, r);
  ctx.lineTo(s, s - r); ctx.quadraticCurveTo(s, s, s - r, s);
  ctx.lineTo(r, s); ctx.quadraticCurveTo(0, s, 0, s - r);
  ctx.lineTo(0, r); ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Gloss
  const gloss = ctx.createLinearGradient(0, 0, 0, s * 0.45);
  gloss.addColorStop(0, "rgba(255,255,255,0.22)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fill();

  // Letter
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.font = `bold 120px -apple-system, 'SF Pro Display', 'Segoe UI', sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(letter, s / 2, s / 2 + 4);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/* ─── Star field ─── */
function Stars({ count = 250 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const [positions, baseSizes] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 2000;
      p[i * 3 + 1] = (Math.random() - 0.5) * 1200;
      p[i * 3 + 2] = (Math.random() - 0.5) * 600 - 300;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [p, sz];
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const attr = ref.current.geometry.getAttribute("size") as THREE.BufferAttribute;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      attr.array[i] = baseSizes[i] * (0.5 + 0.5 * Math.sin(t * 1.5 + i * 0.7));
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={baseSizes} count={count} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={1.5} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/* ─── Single orbiting icon ─── */
function AppIcon({
  index,
  total,
  elapsed,
  texture,
  iconColor,
}: {
  index: number;
  total: number;
  elapsed: number;
  texture: THREE.CanvasTexture;
  iconColor: THREE.Color;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const trailRef = useRef<THREE.Mesh>(null);
  const angle0 = (index / total) * Math.PI * 2;
  // Stagger layers for depth
  const orbitTilt = 0.3 + (index % 3) * 0.15;
  const orbitRadius = 3.5 + (index % 3) * 0.6;

  useFrame(() => {
    const m = meshRef.current;
    if (!m) return;
    const t = elapsed;

    if (t < 0.4) {
      m.visible = false;
      if (trailRef.current) trailRef.current.visible = false;
      return;
    }

    m.visible = true;

    // Phase: deploy + orbit (0.4 - 2.2s)
    if (t < 2.2) {
      const p = Math.min(1, (t - 0.4) / 0.6); // entry progress
      const entryScale = p * p * (3 - 2 * p); // smoothstep
      const speed = Math.PI * 0.8;
      const angle = angle0 + (t - 0.4) * speed;

      m.position.x = Math.cos(angle) * orbitRadius;
      m.position.y = Math.sin(angle) * orbitRadius * Math.sin(orbitTilt) + Math.sin(t * 2.5 + index) * 0.1;
      m.position.z = Math.sin(angle) * orbitRadius * Math.cos(orbitTilt) * 0.5;
      m.scale.setScalar(entryScale * 0.85);
      m.rotation.y = Math.sin(t + index) * 0.1;

      if (trailRef.current) {
        trailRef.current.visible = t > 0.6;
        trailRef.current.position.copy(m.position);
        trailRef.current.position.x -= Math.cos(angle + 0.2) * 0.3;
        trailRef.current.scale.setScalar(entryScale * 0.7);
        (trailRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 * entryScale;
      }
    }
    // Phase: converge (2.2 - 3.2s)
    else if (t < 3.2) {
      const p = (t - 2.2) / 1.0;
      const eased = p * p * (3 - 2 * p);
      const radius = orbitRadius * (1 - eased);
      const spinSpeed = Math.PI * (0.8 + p * 3);
      const angle = angle0 + (t - 0.4) * Math.PI * 0.8 + (t - 2.2) * spinSpeed;

      m.position.x = Math.cos(angle) * radius;
      m.position.y = Math.sin(angle) * radius * 0.5 * (1 - eased);
      m.position.z = Math.sin(angle) * radius * 0.3 * (1 - eased);
      m.scale.setScalar(0.85 * (1 - eased * 0.6));
      m.rotation.y = p * Math.PI * 3;

      if (trailRef.current) {
        trailRef.current.visible = p < 0.8;
        trailRef.current.position.copy(m.position);
        (trailRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 * (1 - p);
      }
    }
    // Phase: merged — hide
    else {
      m.visible = false;
      if (trailRef.current) trailRef.current.visible = false;
    }
  });

  return (
    <>
      <mesh ref={trailRef} visible={false}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial map={texture} transparent opacity={0.15} color={iconColor} />
      </mesh>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.1, 1.1, 0.12]} />
        <meshPhysicalMaterial
          map={texture}
          clearcoat={0.8}
          clearcoatRoughness={0.15}
          metalness={0.05}
          roughness={0.3}
          emissive={iconColor}
          emissiveIntensity={0.12}
        />
      </mesh>
    </>
  );
}

/* ─── Flash ─── */
function Flash({ elapsed }: { elapsed: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    if (elapsed >= 3.1 && elapsed <= 3.45) {
      ref.current.visible = true;
      const p = (elapsed - 3.1) / 0.35;
      (ref.current.material as THREE.MeshBasicMaterial).opacity =
        (p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7) * 0.85;
    } else {
      ref.current.visible = false;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, 4]} visible={false}>
      <planeGeometry args={[40, 40]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} />
    </mesh>
  );
}

/* ─── Particle burst ─── */
function Burst({ elapsed }: { elapsed: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 80;
  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = pos[i * 3 + 1] = pos[i * 3 + 2] = 0;
      const a = Math.random() * Math.PI * 2;
      const e = (Math.random() - 0.5) * Math.PI;
      const s = 3 + Math.random() * 6;
      vel[i * 3] = Math.cos(a) * Math.cos(e) * s;
      vel[i * 3 + 1] = Math.sin(e) * s;
      vel[i * 3 + 2] = Math.sin(a) * Math.cos(e) * s;
      const c = new THREE.Color(APP_ICONS[i % APP_ICONS.length].color);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    return [pos, vel, col];
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    if (elapsed < 3.15 || elapsed > 4.0) { ref.current.visible = false; return; }
    ref.current.visible = true;
    const p = elapsed - 3.15;
    const attr = ref.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      attr.array[i * 3] = velocities[i * 3] * p;
      attr.array[i * 3 + 1] = velocities[i * 3 + 1] * p - 2.5 * p * p;
      attr.array[i * 3 + 2] = velocities[i * 3 + 2] * p;
    }
    attr.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - p / 0.8);
  });

  return (
    <points ref={ref} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={2.5} transparent opacity={1} vertexColors sizeAttenuation />
    </points>
  );
}

/* ─── Merged logo mark ─── */
function LogoMark({ elapsed }: { elapsed: number }) {
  const ref = useRef<THREE.Group>(null);
  // Show a ring of small colored cubes forming the "Q" shape
  const segments = useMemo(() => {
    return APP_ICONS.slice(0, 8).map((app, i) => {
      const angle = (i / 8) * Math.PI * 2;
      return {
        color: new THREE.Color(app.color),
        x: Math.cos(angle) * 1.2,
        y: Math.sin(angle) * 1.2,
      };
    });
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    if (elapsed < 3.2) { ref.current.visible = false; return; }
    ref.current.visible = true;
    const p = Math.min(1, (elapsed - 3.2) / 0.7);
    const e = 1 - Math.pow(1 - p, 3);
    ref.current.scale.setScalar(e);
    ref.current.rotation.y = (1 - e) * Math.PI * 2;
    if (elapsed > 3.9) {
      ref.current.scale.setScalar(1 + Math.sin((elapsed - 3.9) * 1.5) * 0.012);
    }
  });

  return (
    <group ref={ref} visible={false}>
      {segments.map((seg, i) => (
        <mesh key={i} position={[seg.x, seg.y, 0]}>
          <boxGeometry args={[0.45, 0.45, 0.1]} />
          <meshPhysicalMaterial
            color={seg.color}
            clearcoat={1}
            clearcoatRoughness={0.1}
            metalness={0.1}
            roughness={0.2}
            emissive={seg.color}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Scene ─── */
function Scene({ elapsed }: { elapsed: number }) {
  const textures = useMemo(
    () => APP_ICONS.map((d) => makeIconTexture(d.letter, d.color)),
    []
  );

  return (
    <>
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 6]} intensity={1.5} />
      <spotLight position={[0, 10, 5]} intensity={0.5} color="#7dd3fc" angle={0.6} penumbra={0.5} />
      <fog attach="fog" args={["#050510", 10, 30]} />
      <Stars />
      {APP_ICONS.map((def, i) => (
        <AppIcon
          key={def.letter + i}
          index={i}
          total={APP_ICONS.length}
          elapsed={elapsed}
          texture={textures[i]}
          iconColor={new THREE.Color(def.color)}
        />
      ))}
      <Flash elapsed={elapsed} />
      <Burst elapsed={elapsed} />
      <LogoMark elapsed={elapsed} />
    </>
  );
}

/* ─── Main export ─── */
export function QuooroSplash({ onComplete }: QuooroSplashProps) {
  const [elapsed, setElapsed] = useState(0);
  const [skipped, setSkipped] = useState(false);
  const startRef = useRef(Date.now());
  const doneRef = useRef(false);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const ms = Date.now() - startRef.current;
      setElapsed(ms / 1000);
      if (ms < TOTAL_DURATION && !skipped) {
        raf = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        setTimeout(onComplete, 250);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete, skipped]);




  const progress = Math.min(100, (elapsed / (TOTAL_DURATION / 1000)) * 100);
  const showLogo = elapsed >= 3.2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: Math.min(1, elapsed / 0.3) }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[300] overflow-hidden"
      style={{ background: "linear-gradient(135deg, #050510 0%, #0a0a20 40%, #080818 100%)" }}
    >
      <Canvas
        camera={{ fov: 50, position: [0, 0, 10], near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
        dpr={[1, 2]}
        className="max-sm:scale-[0.65] max-md:scale-[0.8] origin-center"
      >
        <Scene elapsed={elapsed} />
      </Canvas>

      {/* Initial glow */}
      {elapsed < 0.5 && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.6) 0%, transparent 70%)" }}
          initial={{ width: 2, height: 2, opacity: 0 }}
          animate={{ width: 100, height: 100, opacity: elapsed < 0.25 ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* Logo text — absolutely centered on viewport */}
      <motion.div
        className="pointer-events-none"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 310,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: showLogo ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <motion.div
          className="flex flex-col items-center"
          initial={{ opacity: 0, y: 24, scale: 0.8 }}
          animate={showLogo ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.7, type: "spring", stiffness: 180, damping: 16 }}
        >
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight text-center"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #EC4899, #3B82F6, #10B981)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif",
              letterSpacing: "-0.03em",
              filter: "drop-shadow(0 2px 12px rgba(139,92,246,0.3))",
            }}
          >
            QUOORO
          </h1>
          <p
            className="text-sm sm:text-base font-semibold tracking-[0.3em] text-center mt-1.5"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            BUSINESS SUITE
          </p>
        </motion.div>
      </motion.div>

      {/* Progress */}
      <div className="absolute bottom-14 left-1/2 -translate-x-1/2 w-60 z-10">
        <div className="h-[2px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #8B5CF6, #EC4899, #3B82F6, #10B981, #F59E0B)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: elapsed > 0.5 ? 0.35 : 0 }}
          className="text-[10px] text-center mt-2 font-medium"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {elapsed < 1.2 ? "Initializing platform…" : elapsed < 2.5 ? "Loading modules…" : elapsed < 3.5 ? "Preparing workspace…" : "Welcome"}
        </motion.p>
      </div>



    </motion.div>
  );
}
