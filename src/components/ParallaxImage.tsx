import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, MotionValue } from "framer-motion";

function ShineEffect({ mouseX, mouseY, enabled }: { mouseX: MotionValue<number>; mouseY: MotionValue<number>; enabled: boolean }) {
  const angle = useTransform(mouseX, [-0.5, 0.5], [135, 225]);
  const opacity = useTransform(
    [mouseX, mouseY],
    ([x, y]: number[]) => Math.sqrt(x * x + y * y) * 0.5
  );

  if (!enabled) return null;

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `linear-gradient(${angle}deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)`,
        opacity,
      }}
    />
  );
}

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  parallaxSpeed?: number; // 0.1 = slow, 0.5 = fast
  enableHover3D?: boolean;
  overlayGradient?: string;
  children?: React.ReactNode;
}

export function ParallaxImage({
  src,
  alt,
  className = "",
  imgClassName = "object-cover",
  parallaxSpeed = 0.2,
  enableHover3D = true,
  overlayGradient,
  children,
}: ParallaxImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Smooth parallax movement
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const smoothY = useSpring(y, { stiffness: 100, damping: 30 });
  
  // Scale effect based on scroll
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.1, 1, 1.1]);
  const smoothScale = useSpring(scale, { stiffness: 100, damping: 30 });

  // 3D hover effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);
  
  const smoothRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const smoothRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableHover3D || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    mouseX.set((e.clientX - centerX) / rect.width);
    mouseY.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        perspective: enableHover3D ? 1000 : undefined,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX: enableHover3D ? smoothRotateX : 0,
          rotateY: enableHover3D ? smoothRotateY : 0,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full"
      >
        <motion.div
          style={{
            y: smoothY,
            scale: smoothScale,
          }}
          className="absolute inset-0 -inset-y-[20%]"
        >
          <img
            src={src}
            alt={alt}
            className={`w-full h-full ${imgClassName}`}
            loading="lazy"
            decoding="async"
          />
        </motion.div>
        
        {overlayGradient && (
          <div className={`absolute inset-0 ${overlayGradient}`} />
        )}
        
        {children && (
          <motion.div 
            className="absolute inset-0"
            style={{
              translateZ: enableHover3D ? 50 : 0,
            }}
          >
            {children}
          </motion.div>
        )}
      </motion.div>
      
      {/* Shine effect on hover */}
      <ShineEffect mouseX={mouseX} mouseY={mouseY} enabled={enableHover3D} />
    </motion.div>
  );
}

// Simpler version for hero backgrounds
export function ParallaxBackground({
  src,
  alt,
  className = "",
  parallaxSpeed = 0.3,
  overlayClassName = "",
}: {
  src: string;
  alt: string;
  className?: string;
  parallaxSpeed?: number;
  overlayClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${parallaxSpeed * 100}%`]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.5]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      <motion.img
        src={src}
        alt={alt}
        className="w-full h-[120%] object-cover"
        style={{ y, opacity, scale }}
      />
      {overlayClassName && <div className={`absolute inset-0 ${overlayClassName}`} />}
    </div>
  );
}