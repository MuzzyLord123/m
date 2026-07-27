import { motion } from "framer-motion";
import { useState } from "react";

// Placeholder client logos using company initials
const clientLogos = [
  { name: "TechForge", initials: "TF" },
  { name: "BlueSky Ventures", initials: "BV" },
  { name: "Apex Digital", initials: "AD" },
  { name: "Quantum Labs", initials: "QL" },
  { name: "Sterling & Co", initials: "SC" },
  { name: "Horizon Group", initials: "HG" },
  { name: "Nova Systems", initials: "NS" },
  { name: "Pinnacle UK", initials: "PU" },
];

export function ClientLogoMarquee() {
  const [isPaused, setIsPaused] = useState(false);

  // Double the logos for seamless loop
  const allLogos = [...clientLogos, ...clientLogos];

  return (
    <div 
      className="w-full overflow-hidden py-8 sm:py-12"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <p className="text-center text-xs sm:text-sm text-muted-foreground mb-6 sm:mb-8">
        Trusted by businesses across the UK and beyond
      </p>
      
      <div className="relative">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <motion.div
          className="flex gap-8 sm:gap-12"
          animate={{
            x: isPaused ? 0 : [0, -50 * clientLogos.length],
          }}
          transition={{
            x: {
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            },
          }}
          style={{
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {allLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex-shrink-0 flex items-center justify-center w-20 h-10 sm:w-24 sm:h-12 rounded-lg liquid-glass-subtle opacity-60 hover:opacity-100 transition-opacity duration-300 grayscale hover:grayscale-0"
            >
              <span className="font-display font-bold text-sm sm:text-base text-muted-foreground">
                {logo.initials}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
