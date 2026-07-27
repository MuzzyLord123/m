import { motion } from "framer-motion";

export function PageLoader() {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: 1, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        scaleX: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
        opacity: { duration: 0.2, delay: 0.3 }
      }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary via-primary to-cyan-glow origin-left z-[60]"
      style={{
        boxShadow: '0 0 10px hsl(var(--primary) / 0.5), 0 0 20px hsl(var(--primary) / 0.3)'
      }}
    />
  );
}