import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { OrbitSplash } from "./OrbitSplash";

interface CADSplashProps {
  onComplete: () => void;
}

const TOTAL_MS = 3200;

/* ─────────────────── Tool Icons (SVG paths) ─────────────────── */
const TOOLS = [
  { label: "Select", icon: "M4 4l6 16 2.5-5.5L18 12z", hex: "#06b6d4" },
  { label: "Line", icon: "M4 20L20 4M4 20h0M20 4h0", hex: "#0ea5e9" },
  { label: "Rect", icon: "M3 6h18v12H3z", hex: "#14b8a6" },
  { label: "Circle", icon: "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0-18 0", hex: "#8b5cf6" },
  { label: "Push", icon: "M12 3l8 5v8l-8 5-8-5V8z", hex: "#a855f7" },
  { label: "Move", icon: "M12 2v20M2 12h20M12 2l3 3M12 2l-3 3M12 22l3-3M12 22l-3-3M2 12l3 3M2 12l3-3M22 12l-3 3M22 12l-3-3", hex: "#6366f1" },
  { label: "Rotate", icon: "M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15", hex: "#3b82f6" },
  { label: "Scale", icon: "M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7", hex: "#22d3ee" },
  { label: "Eraser", icon: "M20 20H7L3 16l10-10 8 8-4 4M6.5 13.5l5 5", hex: "#f43f5e" },
  { label: "Offset", icon: "M5 5h10v10H5zM2 2h10v10H2z", hex: "#10b981" },
  { label: "Tape", icon: "M4 20L20 4M9 15l-5 5M15 9l5-5M9 4v3M4 9h3", hex: "#f59e0b" },
  { label: "Bucket", icon: "M19 11V9a7 7 0 0 0-14 0v2a2 2 0 0 0 0 4h14a2 2 0 0 0 0-4zM12 19v2", hex: "#ec4899" },
];

/* ─────────────────── Orbiting Icon ─────────────────── */
function OrbitIcon({
  index,
  total,
  tool,
  elapsed,
}: {
  index: number;
  total: number;
  tool: typeof TOOLS[0];
  elapsed: number;
}) {
  const angle0 = (index / total) * Math.PI * 2;
  const radiusX = 220;
  const radiusY = 80;
  const speed = 0.6;

  const angle = angle0 + elapsed * speed;
  const x = Math.cos(angle) * radiusX;
  const y = Math.sin(angle) * radiusY;
  const z = Math.sin(angle);

  const stagger = index * 0.06;
  const entryP = Math.min(1, Math.max(0, (elapsed - stagger) / 0.5));
  const scale = entryP * (0.8 + Math.sin(elapsed * 2 + index) * 0.05);
  const opacity = entryP * (0.5 + (z + 1) * 0.25);

  return (
    <motion.div
      className="absolute flex items-center justify-center"
      style={{
        left: "50%",
        top: "50%",
        width: 36,
        height: 36,
        marginLeft: -18,
        marginTop: -18,
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        opacity,
        zIndex: z > 0 ? 10 : 1,
      }}
    >
      <div
        className="w-full h-full rounded-lg flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, #2a2a2a, #1a1a1a)`,
          border: `1px solid ${tool.hex}22`,
          boxShadow: `0 0 12px ${tool.hex}15`,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={tool.hex}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ opacity: 0.85 }}
        >
          <path d={tool.icon} />
        </svg>
      </div>
    </motion.div>
  );
}

/* ─────────────────── Main Component ─────────────────── */
export function CADSplash({ onComplete }: CADSplashProps) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const doneRef = useRef(false);

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
        setTimeout(onComplete, 200);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete]);

  const progress = Math.min(100, (elapsed / (TOTAL_MS / 1000)) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[300] overflow-hidden flex items-center justify-center"
      style={{ background: "#000000" }}
    >
      {/* Orbiting icons */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ transform: "scale(var(--orbit-scale, 1))" }}
      >
        <style>{`
          :root { --orbit-scale: 1; }
          @media (max-width: 430px) { :root { --orbit-scale: 0.6; } }
          @media (min-width: 431px) and (max-width: 640px) { :root { --orbit-scale: 0.75; } }
        `}</style>
        {TOOLS.map((tool, i) => (
          <OrbitIcon
            key={tool.label}
            index={i}
            total={TOOLS.length}
            tool={tool}
            elapsed={elapsed}
          />
        ))}
      </div>

      {/* Center logo */}
      <motion.div
        className="relative flex flex-col items-center justify-center pointer-events-none z-20"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
      >
        <h1
          className="text-4xl font-bold tracking-tight text-center"
          style={{
            background: "linear-gradient(135deg, #e0e0e0 0%, #06b6d4 50%, #8b5cf6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif",
            letterSpacing: "-0.03em",
            filter: "drop-shadow(0 2px 10px rgba(6,182,212,0.3))",
          }}
        >
          CAD STUDIO
        </h1>
        <motion.div
          className="mt-3 mx-auto rounded-full"
          style={{
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(6,182,212,0.4), transparent)",
          }}
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />
        <motion.p
          className="text-xs font-medium tracking-[0.2em] text-center mt-2"
          style={{ color: "rgba(6,182,212,0.35)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          DESIGN · MODEL · CREATE
        </motion.p>

        {/* Axis badges */}
        <motion.div
          className="flex items-center gap-4 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {[
            { axis: "X", color: "#ef4444" },
            { axis: "Y", color: "#22c55e" },
            { axis: "Z", color: "#3b82f6" },
          ].map((a) => (
            <div key={a.axis} className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: a.color }} />
              <span className="text-[9px] font-mono" style={{ color: a.color, opacity: 0.7 }}>{a.axis}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Progress */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 z-10">
        <div className="h-[1.5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #22d3ee40, #06b6d480, #8b5cf640)" }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
