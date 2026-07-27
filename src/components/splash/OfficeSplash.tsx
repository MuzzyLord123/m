import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ─────────────────── Types ─────────────────── */
interface OfficeSplashProps {
  onComplete: () => void;
}

type Phase = "void" | "orbital" | "converge" | "merge" | "reveal";

const PHASE_TIMES: Record<Phase, number> = {
  void: 500,
  orbital: 1500,
  converge: 1000,
  merge: 500,
  reveal: 500,
};

const TOTAL_MS = Object.values(PHASE_TIMES).reduce((a, b) => a + b, 0);

/* ─────────────────── Brand Colors ─────────────────── */
const WORD_COLOR = new THREE.Color("#2B579A");
const EXCEL_COLOR = new THREE.Color("#217346");
const PPT_COLOR = new THREE.Color("#D24726");
const NOTES_COLOR = new THREE.Color("#7C3AED");

const CLOUD_COLOR = new THREE.Color("#0284C7");
const DESIGN_COLOR = new THREE.Color("#00C4CC");

const ICON_DEFS = [
  { color: WORD_COLOR, hex: "#2B579A", icon: "docs", label: "Docs" },
  { color: EXCEL_COLOR, hex: "#217346", icon: "sheets", label: "Sheets" },
  { color: PPT_COLOR, hex: "#D24726", icon: "slides", label: "Slides" },
  { color: NOTES_COLOR, hex: "#7C3AED", icon: "notes", label: "Notes" },
  { color: CLOUD_COLOR, hex: "#0284C7", icon: "files", label: "Files" },
  { color: DESIGN_COLOR, hex: "#00C4CC", icon: "design", label: "Design" },
];

/* ─────────────────── Draw Icon Shape ─────────────────── */
function drawIconShape(ctx: CanvasRenderingContext2D, icon: string, cx: number, cy: number, s: number) {
  ctx.strokeStyle = "rgba(255,255,255,0.95)";
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.lineWidth = s * 0.08;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  switch (icon) {
    case "docs": {
      // Document with folded corner and lines
      const w = s * 0.5, h = s * 0.65, fold = s * 0.15;
      const lx = cx - w / 2, ty = cy - h / 2;
      ctx.beginPath();
      ctx.moveTo(lx, ty);
      ctx.lineTo(lx + w - fold, ty);
      ctx.lineTo(lx + w, ty + fold);
      ctx.lineTo(lx + w, ty + h);
      ctx.lineTo(lx, ty + h);
      ctx.closePath();
      ctx.stroke();
      // Fold
      ctx.beginPath();
      ctx.moveTo(lx + w - fold, ty);
      ctx.lineTo(lx + w - fold, ty + fold);
      ctx.lineTo(lx + w, ty + fold);
      ctx.stroke();
      // Lines
      for (let i = 0; i < 3; i++) {
        const ly = ty + h * 0.35 + i * s * 0.13;
        ctx.beginPath();
        ctx.moveTo(lx + s * 0.1, ly);
        ctx.lineTo(lx + w - s * 0.1, ly);
        ctx.stroke();
      }
      break;
    }
    case "sheets": {
      // Grid/table
      const w = s * 0.55, h = s * 0.55;
      const lx = cx - w / 2, ty = cy - h / 2;
      ctx.strokeRect(lx, ty, w, h);
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(lx, ty + h / 3); ctx.lineTo(lx + w, ty + h / 3);
      ctx.moveTo(lx, ty + (h * 2) / 3); ctx.lineTo(lx + w, ty + (h * 2) / 3);
      // Vertical lines
      ctx.moveTo(lx + w / 3, ty); ctx.lineTo(lx + w / 3, ty + h);
      ctx.moveTo(lx + (w * 2) / 3, ty); ctx.lineTo(lx + (w * 2) / 3, ty + h);
      ctx.stroke();
      break;
    }
    case "slides": {
      // Presentation screen
      const w = s * 0.6, h = s * 0.42;
      const lx = cx - w / 2, ty = cy - h / 2 - s * 0.05;
      const r = s * 0.04;
      ctx.beginPath();
      ctx.moveTo(lx + r, ty);
      ctx.lineTo(lx + w - r, ty);
      ctx.quadraticCurveTo(lx + w, ty, lx + w, ty + r);
      ctx.lineTo(lx + w, ty + h - r);
      ctx.quadraticCurveTo(lx + w, ty + h, lx + w - r, ty + h);
      ctx.lineTo(lx + r, ty + h);
      ctx.quadraticCurveTo(lx, ty + h, lx, ty + h - r);
      ctx.lineTo(lx, ty + r);
      ctx.quadraticCurveTo(lx, ty, lx + r, ty);
      ctx.closePath();
      ctx.stroke();
      // Stand
      ctx.beginPath();
      ctx.moveTo(cx, ty + h);
      ctx.lineTo(cx, ty + h + s * 0.12);
      ctx.moveTo(cx - s * 0.12, ty + h + s * 0.12);
      ctx.lineTo(cx + s * 0.12, ty + h + s * 0.12);
      ctx.stroke();
      // Play triangle
      const triS = s * 0.1;
      ctx.beginPath();
      ctx.moveTo(cx - triS * 0.5, cy - triS - s * 0.05);
      ctx.lineTo(cx - triS * 0.5, cy + triS * 0.6 - s * 0.05);
      ctx.lineTo(cx + triS * 0.7, cy - triS * 0.2 - s * 0.05);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "notes": {
      // Open book
      const w = s * 0.28, h = s * 0.5;
      // Left page
      ctx.beginPath();
      ctx.moveTo(cx, cy - h / 2);
      ctx.quadraticCurveTo(cx - w * 0.3, cy - h / 2, cx - w, cy - h / 2 + s * 0.05);
      ctx.lineTo(cx - w, cy + h / 2);
      ctx.quadraticCurveTo(cx - w * 0.5, cy + h / 2 - s * 0.03, cx, cy + h / 2);
      ctx.stroke();
      // Right page
      ctx.beginPath();
      ctx.moveTo(cx, cy - h / 2);
      ctx.quadraticCurveTo(cx + w * 0.3, cy - h / 2, cx + w, cy - h / 2 + s * 0.05);
      ctx.lineTo(cx + w, cy + h / 2);
      ctx.quadraticCurveTo(cx + w * 0.5, cy + h / 2 - s * 0.03, cx, cy + h / 2);
      ctx.stroke();
      // Spine
      ctx.beginPath();
      ctx.moveTo(cx, cy - h / 2);
      ctx.lineTo(cx, cy + h / 2);
      ctx.stroke();
      break;
    }
    case "files": {
      // Cloud shape
      const cw = s * 0.55, ch = s * 0.35;
      ctx.beginPath();
      ctx.arc(cx - cw * 0.15, cy + ch * 0.1, ch * 0.45, Math.PI, Math.PI * 1.5);
      ctx.arc(cx, cy - ch * 0.3, ch * 0.55, Math.PI * 1.2, Math.PI * 1.85);
      ctx.arc(cx + cw * 0.2, cy - ch * 0.05, ch * 0.4, Math.PI * 1.4, Math.PI * 0.3);
      ctx.arc(cx + cw * 0.15, cy + ch * 0.25, ch * 0.3, 0, Math.PI * 0.5);
      ctx.lineTo(cx - cw * 0.35, cy + ch * 0.4);
      ctx.arc(cx - cw * 0.3, cy + ch * 0.15, ch * 0.35, Math.PI * 0.5, Math.PI);
      ctx.stroke();
      break;
    }
    case "design": {
      // Palette / pen tool circle
      const radius = s * 0.28;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      // Inner dots for palette spots
      const dotR = s * 0.045;
      const spots = [
        [cx - s * 0.1, cy - s * 0.12],
        [cx + s * 0.08, cy - s * 0.1],
        [cx - s * 0.12, cy + s * 0.06],
        [cx + s * 0.1, cy + s * 0.08],
      ];
      spots.forEach(([sx, sy]) => {
        ctx.beginPath();
        ctx.arc(sx, sy, dotR, 0, Math.PI * 2);
        ctx.fill();
      });
      break;
    }
  }
}

/* ─────────────────── Canvas Texture ─────────────────── */
function makeIconTexture(icon: string, hexColor: string): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, size, size);
  const c = new THREE.Color(hexColor);
  const lighter = c.clone().lerp(new THREE.Color("#ffffff"), 0.2);
  const darker = c.clone().lerp(new THREE.Color("#000000"), 0.25);
  grad.addColorStop(0, `#${lighter.getHexString()}`);
  grad.addColorStop(1, `#${darker.getHexString()}`);

  // Rounded rect
  const r = 48;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Glossy overlay
  const gloss = ctx.createLinearGradient(0, 0, 0, size * 0.5);
  gloss.addColorStop(0, "rgba(255,255,255,0.2)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fill();

  // Draw the icon shape
  drawIconShape(ctx, icon, size / 2, size / 2, size * 0.7);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/* ─────────────────── Star Field ─────────────────── */
function StarField({ count = 200 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1600;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 1000;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 800 - 200;
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sz];
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const szAttr = geo.getAttribute("size") as THREE.BufferAttribute;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      szAttr.array[i] = sizes[i] * (0.6 + 0.4 * Math.sin(t * 2 + i));
    }
    szAttr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={sizes} count={count} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial color="#ffffff" size={1.5} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

/* ─────────────────── Icon Mesh ─────────────────── */
function IconMesh({
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

  useFrame(() => {
    if (!meshRef.current) return;
    const t = elapsed;
    const mesh = meshRef.current;

    if (t < 0.5) {
      // Phase: void — hidden
      mesh.scale.setScalar(0);
      mesh.visible = false;
      if (trailRef.current) trailRef.current.visible = false;
      return;
    }

    mesh.visible = true;
    if (trailRef.current) trailRef.current.visible = t > 0.5 && t < 3.0;

    if (t < 2.0) {
      // Phase: orbital
      const p = (t - 0.5) / 1.5;
      const entryScale = Math.min(1, p * 2);
      const radius = 3.0;
      const speed = Math.PI; // 180deg/s
      const angle = angle0 + (t - 0.5) * speed;
      const tilt = 0.41; // ~23.5deg

      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = Math.sin(angle) * radius * Math.sin(tilt) + Math.sin(t * 3) * 0.15;
      mesh.position.z = Math.sin(angle) * radius * Math.cos(tilt);
      mesh.scale.setScalar(entryScale);
      mesh.rotation.y = 0;
      mesh.rotation.z = Math.sin(t * 2 + index) * 0.05;

      // Trail
      if (trailRef.current) {
        trailRef.current.position.copy(mesh.position);
        trailRef.current.position.x -= Math.cos(angle + 0.3) * 0.5;
        trailRef.current.position.y -= Math.sin(angle + 0.3) * 0.3;
        trailRef.current.scale.setScalar(entryScale * 0.85);
        (trailRef.current.material as THREE.MeshBasicMaterial).opacity = 0.2;
      }
    } else if (t < 3.0) {
      // Phase: converge — spiral inward
      const p = (t - 2.0) / 1.0;
      const eased = p * p * (3 - 2 * p); // smoothstep
      const radius = 3.0 * (1 - eased);
      const spinSpeed = Math.PI * (1 + p * 4);
      const angle = angle0 + (t - 0.5) * Math.PI + (t - 2.0) * spinSpeed;

      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = Math.sin(angle) * radius * 0.6;
      mesh.position.z = Math.sin(angle) * radius * 0.3 * (1 - eased);
      mesh.scale.setScalar(1 - eased * 0.5);
      mesh.rotation.y = p * Math.PI * 4;

      if (trailRef.current) {
        trailRef.current.position.copy(mesh.position);
        (trailRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 * (1 - p);
        trailRef.current.scale.setScalar((1 - eased * 0.5) * 0.9);
      }
    } else {
      // Phase: merge + reveal — converged to center
      mesh.position.set(0, 0, 0);
      mesh.scale.setScalar(0);
      mesh.visible = false;
    }
  });

  return (
    <>
      {/* Trail ghost */}
      <mesh ref={trailRef} visible={false}>
        <planeGeometry args={[1.4, 1.4]} />
        <meshBasicMaterial map={texture} transparent opacity={0.2} color={iconColor} />
      </mesh>
      {/* Main icon */}
      <mesh ref={meshRef}>
        <boxGeometry args={[1.4, 1.4, 0.15]} />
        <meshPhysicalMaterial
          map={texture}
          clearcoat={0.8}
          clearcoatRoughness={0.15}
          metalness={0.05}
          roughness={0.3}
          emissive={iconColor}
          emissiveIntensity={0.15}
        />
      </mesh>
    </>
  );
}

/* ─────────────────── Flash Effect ─────────────────── */
function FlashPlane({ elapsed }: { elapsed: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!ref.current) return;
    const t = elapsed;
    if (t >= 2.95 && t <= 3.3) {
      ref.current.visible = true;
      const p = (t - 2.95) / 0.35;
      const intensity = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
      (ref.current.material as THREE.MeshBasicMaterial).opacity = intensity * 0.9;
    } else {
      ref.current.visible = false;
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, 3]} visible={false}>
      <planeGeometry args={[30, 30]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} />
    </mesh>
  );
}

/* ─────────────────── Particle Burst ─────────────────── */
function ParticleBurst({ elapsed }: { elapsed: number }) {
  const ref = useRef<THREE.Points>(null);
  const count = 60;

  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const brandColors = [WORD_COLOR, EXCEL_COLOR, PPT_COLOR, NOTES_COLOR, CLOUD_COLOR, DESIGN_COLOR];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      const angle = Math.random() * Math.PI * 2;
      const elev = (Math.random() - 0.5) * Math.PI;
      const speed = 3 + Math.random() * 5;
      vel[i * 3] = Math.cos(angle) * Math.cos(elev) * speed;
      vel[i * 3 + 1] = Math.sin(elev) * speed;
      vel[i * 3 + 2] = Math.sin(angle) * Math.cos(elev) * speed;
      const c = brandColors[i % 4];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, vel, col];
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const t = elapsed;
    if (t < 3.0 || t > 3.8) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    const p = t - 3.0;
    const posAttr = ref.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      posAttr.array[i * 3] = velocities[i * 3] * p;
      posAttr.array[i * 3 + 1] = velocities[i * 3 + 1] * p - 2 * p * p;
      posAttr.array[i * 3 + 2] = velocities[i * 3 + 2] * p;
    }
    posAttr.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = Math.max(0, 1 - p / 0.8);
  });

  return (
    <points ref={ref} visible={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={3} transparent opacity={1} vertexColors sizeAttenuation />
    </points>
  );
}

/* ─────────────────── Merged Logo Bar (3D) ─────────────────── */
function LogoBar3D({ elapsed }: { elapsed: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();
  const segments = [
    { color: WORD_COLOR, x: -2.0 },
    { color: EXCEL_COLOR, x: -1.2 },
    { color: PPT_COLOR, x: -0.4 },
    { color: NOTES_COLOR, x: 0.4 },
    { color: CLOUD_COLOR, x: 1.2 },
    { color: DESIGN_COLOR, x: 2.0 },
  ];

  // Scale the bar to fit within the viewport with margin
  const barWidth = 4.7; // total span of segments
  const maxAllowed = viewport.width * 0.78;
  const fitScale = Math.min(1, maxAllowed / barWidth);

  useFrame(() => {
    if (!groupRef.current) return;
    const t = elapsed;
    if (t < 3.0) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;
    const p = Math.min(1, (t - 3.0) / 0.8);
    const eased = 1 - Math.pow(1 - p, 3);
    groupRef.current.scale.setScalar(eased * fitScale);
    groupRef.current.rotation.y = (1 - eased) * Math.PI * 2;

    if (t > 3.8) {
      const breath = 1 + Math.sin((t - 3.8) * 1.5) * 0.015;
      groupRef.current.scale.setScalar(breath * fitScale);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {segments.map((seg, i) => (
        <mesh key={i} position={[seg.x, 0, 0]}>
          <boxGeometry args={[0.7, 0.7, 0.15]} />
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

/* ─────────────────── Scene Controller ─────────────────── */
function SceneContent({ elapsed }: { elapsed: number }) {
  const textures = useMemo(
    () => ICON_DEFS.map((d) => makeIconTexture(d.icon, d.hex)),
    []
  );

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 0, 5]} intensity={1.5} color="#ffffff" />
      <spotLight
        position={[0, 8, 4]}
        intensity={0.6}
        color="#7dd3fc"
        angle={0.6}
        penumbra={0.5}
      />
      <fog attach="fog" args={["#0a0a0f", 8, 25]} />

      <StarField />

      {ICON_DEFS.map((def, i) => (
        <IconMesh
          key={def.icon}
          index={i}
          total={ICON_DEFS.length}
          elapsed={elapsed}
          texture={textures[i]}
          iconColor={def.color}
        />
      ))}

      <FlashPlane elapsed={elapsed} />
      <ParticleBurst elapsed={elapsed} />
      <LogoBar3D elapsed={elapsed} />
    </>
  );
}

/* ─────────────────── Main Component ─────────────────── */
export function OfficeSplash({ onComplete }: OfficeSplashProps) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const doneRef = useRef(false);

  // Animation loop via rAF
  useEffect(() => {
    let raf: number;
    const tick = () => {
      const ms = Date.now() - startRef.current;
      const sec = ms / 1000;
      setElapsed(sec);
      if (ms < TOTAL_MS) {
        raf = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        setTimeout(onComplete, 300);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);




  const progress = Math.min(100, (elapsed / (TOTAL_MS / 1000)) * 100);
  const showRevealUI = elapsed >= 3.0;
  const voidOpacity = Math.min(1, elapsed / 0.3);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: voidOpacity }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[200] overflow-hidden"
      style={{ background: "#000000" }}
    >
      {/* 3D Canvas */}
      <Canvas
        camera={{ fov: 50, position: [0, 0, 8], near: 0.1, far: 100 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        style={{ position: "absolute", inset: 0 }}
        dpr={[1, 2]}
      >
        <SceneContent elapsed={elapsed} />
      </Canvas>

      {/* Void pixel glow — Phase 1 */}
      {elapsed < 0.6 && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 70%)",
          }}
          initial={{ width: 2, height: 2, opacity: 0 }}
          animate={{ width: 80, height: 80, opacity: elapsed < 0.3 ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
      )}

      {/* Logo text overlay — Phase 5 */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: showRevealUI ? 1 : 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.div
          className="mt-8 sm:mt-16"
          initial={{ opacity: 0, y: 20, scale: 0.85 }}
          animate={showRevealUI ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 18 }}
        >
          <h1
            className="text-4xl font-bold tracking-tight text-center"
            style={{
              color: "#ffffff",
              textShadow: "0 2px 8px rgba(0,0,0,0.4)",
              fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif",
              letterSpacing: "-0.02em",
            }}
          >
            QUOORO
          </h1>
          <p
            className="text-lg font-semibold tracking-widest text-center mt-1"
            style={{
              color: "rgba(255,255,255,0.6)",
              fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif",
            }}
          >
            OFFICE
          </p>
        </motion.div>
      </motion.div>

      {/* Progress bar */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-56 z-10">
        <div
          className="h-[2px] rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, #2B579A, #217346, #D24726, #7C3AED)`,
            }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: elapsed > 0.5 ? 0.4 : 0 }}
          className="text-[10px] text-center mt-2 font-medium"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          {elapsed < 1.5 ? "Initializing…" : elapsed < 2.5 ? "Loading modules…" : elapsed < 3.5 ? "Preparing workspace…" : "Ready"}
        </motion.p>
      </div>



    </motion.div>
  );
}
