import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number; // 1-10, higher = more dramatic tilt
  disabled?: boolean;
}

export function Card3D({
  children,
  className = "",
  glowColor = "hsl(var(--primary))",
  intensity = 5,
  disabled = false,
}: Card3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position relative to card center
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animations
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [intensity, -intensity]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-intensity, intensity]), {
    stiffness: 150,
    damping: 20,
  });

  // Floating shadow position
  const shadowX = useSpring(useTransform(mouseX, [-0.5, 0.5], [20, -20]), {
    stiffness: 150,
    damping: 20,
  });
  const shadowY = useSpring(useTransform(mouseY, [-0.5, 0.5], [20, -20]), {
    stiffness: 150,
    damping: 20,
  });

  // Glow position
  const glowX = useTransform(mouseX, [-0.5, 0.5], ["20%", "80%"]);
  const glowY = useTransform(mouseY, [-0.5, 0.5], ["20%", "80%"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    mouseX.set((e.clientX - centerX) / rect.width);
    mouseY.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        perspective: 1000,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      {/* Floating shadow */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
        style={{
          x: shadowX,
          y: shadowY,
          background: `radial-gradient(ellipse at center, ${glowColor} / 0.15, transparent 70%)`,
          filter: "blur(30px)",
          opacity: isHovered ? 0.6 : 0,
        }}
        animate={{ opacity: isHovered ? 0.6 : 0 }}
        transition={{ duration: 0.3 }}
      />

      {/* Main card */}
      <motion.div
        className="relative w-full h-full"
        style={{
          rotateX: disabled ? 0 : rotateX,
          rotateY: disabled ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ z: 50 }}
        transition={{ duration: 0.3 }}
      >
        {/* Card content */}
        <div className="relative w-full h-full rounded-2xl overflow-hidden" style={{ zIndex: 1 }}>
          {children}

          {/* Hover glow effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: `radial-gradient(circle at ${glowX} ${glowY}, ${glowColor} / 0.15, transparent 50%)`,
              opacity: isHovered ? 1 : 0,
            }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Edge highlight */}
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              boxShadow: isHovered
                ? `inset 0 1px 0 0 rgba(255,255,255,0.1), 0 0 0 1px ${glowColor} / 0.2`
                : "inset 0 1px 0 0 rgba(255,255,255,0.05)",
            }}
            animate={{
              boxShadow: isHovered
                ? `inset 0 1px 0 0 rgba(255,255,255,0.1), 0 0 0 1px ${glowColor.replace(")", " / 0.3)")}`
                : "inset 0 1px 0 0 rgba(255,255,255,0.05)",
            }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* 3D depth layers (visible on hover) */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            transform: "translateZ(-20px)",
            background: "linear-gradient(180deg, transparent, hsl(var(--background)))",
            opacity: isHovered ? 0.5 : 0,
          }}
          animate={{ opacity: isHovered ? 0.5 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
    </motion.div>
  );
}

// Specialized version for pricing cards
export function PricingCard3D({
  children,
  isPopular = false,
  isEnterprise = false,
  className = "",
}: {
  children: React.ReactNode;
  isPopular?: boolean;
  isEnterprise?: boolean;
  className?: string;
}) {
  const glowColor = isPopular 
    ? "hsl(var(--primary))" 
    : isEnterprise 
      ? "hsl(var(--muted-foreground))" 
      : "hsl(var(--primary) / 0.5)";

  return (
    <Card3D
      className={className}
      glowColor={glowColor}
      intensity={isPopular ? 8 : 5}
    >
      <motion.div
        className={`h-full p-6 rounded-2xl border transition-colors overflow-hidden liquid-glass-card ${
          isPopular
            ? "border-primary shadow-xl shadow-primary/10"
            : isEnterprise
              ? "border-muted"
              : "border-border/50 hover:border-primary/30"
        }`}
        whileHover={{ 
          y: isPopular ? -12 : -8,
          transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        }}
      >
        {children}
      </motion.div>
    </Card3D>
  );
}