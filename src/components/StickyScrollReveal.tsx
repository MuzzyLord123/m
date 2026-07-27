import { useRef, ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface RevealItem {
  title: string;
  description: string;
  icon?: ReactNode;
  highlight?: string;
}

interface StickyScrollRevealProps {
  items: RevealItem[];
  title?: ReactNode;
  subtitle?: string;
}

export function StickyScrollReveal({ items, title, subtitle }: StickyScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    // Map progress across the section's scroll distance so each step gets
    // a full, consistent portion of the scroll timeline.
    offset: ["start start", "end start"]
  });

  return (
    <section
      ref={containerRef}
      className="relative"
      // One viewport per step keeps the interaction predictable and prevents
      // "dead" scroll space where nothing changes.
      style={{ height: `${Math.max(1, items.length) * 100}vh` }}
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="container-tight w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left side - Sticky text */}
            <div className="space-y-6">
              {title && (
                <motion.h2 
                  className="heading-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  {title}
                </motion.h2>
              )}
              {subtitle && (
                <motion.p 
                  className="body-lg"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  {subtitle}
                </motion.p>
              )}
            </div>

            {/* Right side - Scrolling cards */}
            <div className="relative h-[400px] lg:h-[500px]">
              {items.map((item, index) => (
                <RevealCard 
                  key={item.title}
                  item={item}
                  index={index}
                  total={items.length}
                  scrollYProgress={scrollYProgress}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

interface RevealCardProps {
  item: RevealItem;
  index: number;
  total: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
}

function RevealCard({ item, index, total, scrollYProgress }: RevealCardProps) {
  // Calculate the scroll range for this card
  const cardStart = index / total;
  const cardEnd = (index + 1) / total;
  const cardMid = (cardStart + cardEnd) / 2;

  // Ensure the first card can appear immediately when entering the section.
  const fadeInStart = index === 0 ? 0 : Math.max(0, cardStart - 0.02);
  const fadeInEnd = cardStart + 0.05;

  // Opacity: fade in at start, stay visible, fade out at end (except last card)
  const opacity = useTransform(
    scrollYProgress,
    [
      fadeInStart,
      fadeInEnd,
      index === total - 1 ? 1 : cardEnd - 0.05,
      index === total - 1 ? 1 : cardEnd
    ],
    [0, 1, 1, 0]
  );

  // Y position: slide up as it appears
  const y = useTransform(
    scrollYProgress,
    [cardStart, cardStart + 0.1, cardEnd],
    [60, 0, -30]
  );

  // Scale: subtle scale effect
  const scale = useTransform(
    scrollYProgress,
    [cardStart, cardMid, cardEnd],
    [0.95, 1, 0.98]
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      style={{ opacity, y, scale }}
    >
      <div className="w-full p-8 lg:p-10 rounded-3xl liquid-glass-card">
        {item.icon && (
          <div className="w-14 h-14 rounded-2xl liquid-glass-pill flex items-center justify-center mb-6">
            {item.icon}
          </div>
        )}
        {item.highlight && (
          <span className="inline-block px-3 py-1 rounded-full liquid-glass-pill text-primary text-sm font-medium mb-4">
            {item.highlight}
          </span>
        )}
        <h3 className="font-display font-bold text-2xl lg:text-3xl mb-4">{item.title}</h3>
        <p className="text-muted-foreground text-lg leading-relaxed">{item.description}</p>
      </div>
    </motion.div>
  );
}

// Alternative: Horizontal scroll reveal
interface HorizontalRevealProps {
  children: ReactNode;
  className?: string;
}

export function HorizontalScrollReveal({ children, className = "" }: HorizontalRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-50%"]);

  return (
    <div ref={containerRef} className={`overflow-hidden ${className}`}>
      <motion.div 
        className="flex gap-6"
        style={{ x }}
      >
        {children}
      </motion.div>
    </div>
  );
}
