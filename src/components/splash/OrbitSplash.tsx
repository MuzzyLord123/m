import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface OrbitTool {
  icon: LucideIcon;
  label: string;
  hex: string;
}

export interface OrbitSplashConfig {
  title: string;
  subtitle: string;
  tools: OrbitTool[];
  /** Primary accent color for gradient/glow (default: #06b6d4) */
  accentPrimary?: string;
  /** Secondary accent color for gradient (default: #8b5cf6) */
  accentSecondary?: string;
  /** Duration in ms (default: 3200) */
  duration?: number;
  /** Optional extra content below subtitle */
  extra?: React.ReactNode;
}

interface OrbitSplashProps {
  config: OrbitSplashConfig;
  onComplete: () => void;
}

/* ─── Orbiting Icon ─── */
function OrbitIcon({
  index,
  total,
  tool,
  elapsed,
}: {
  index: number;
  total: number;
  tool: OrbitTool;
  elapsed: number;
}) {
  const Icon = tool.icon;
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
        <Icon
          size={18}
          style={{ color: tool.hex, opacity: 0.85 }}
          strokeWidth={1.8}
        />
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─── */
export function OrbitSplash({ config, onComplete }: OrbitSplashProps) {
  const {
    title,
    subtitle,
    tools,
    accentPrimary = "#06b6d4",
    accentSecondary = "#8b5cf6",
    duration = 3200,
    extra,
  } = config;

  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());
  const doneRef = useRef(false);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      const ms = Date.now() - startRef.current;
      const sec = ms / 1000;
      setElapsed(sec);
      if (ms < duration) {
        raf = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        setTimeout(onComplete, 200);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete, duration]);

  const progress = Math.min(100, (elapsed / (duration / 1000)) * 100);

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
        {tools.map((tool, i) => (
          <OrbitIcon
            key={tool.label}
            index={i}
            total={tools.length}
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
            background: `linear-gradient(135deg, #e0e0e0 0%, ${accentPrimary} 50%, ${accentSecondary} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontFamily: "-apple-system, 'SF Pro Display', 'Segoe UI', sans-serif",
            letterSpacing: "-0.03em",
            filter: `drop-shadow(0 2px 10px ${accentPrimary}4d)`,
          }}
        >
          {title}
        </h1>
        <motion.div
          className="mt-3 mx-auto rounded-full"
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentPrimary}66, transparent)`,
          }}
          initial={{ width: 0 }}
          animate={{ width: 120 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />
        <motion.p
          className="text-xs font-medium tracking-[0.2em] text-center mt-2"
          style={{ color: `${accentPrimary}59` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {subtitle}
        </motion.p>
        {extra && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {extra}
          </motion.div>
        )}
      </motion.div>

      {/* Progress */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 z-10">
        <div className="h-[1.5px] rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${accentPrimary}40, ${accentPrimary}80, ${accentSecondary}40)` }}
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
