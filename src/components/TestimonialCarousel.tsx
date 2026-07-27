import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote, Star, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  industry: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Mark T.",
    role: "Director",
    company: "Local Services Company",
    content: "We needed a website that actually represented what we do. Quooro delivered something clean, fast, and easy to manage — exactly what we asked for.",
    rating: 5,
    industry: "Services",
  },
  {
    id: 2,
    name: "Priya S.",
    role: "Founder",
    company: "E-Commerce Startup",
    content: "The dashboard changed how we work. Having everything in one place — files, messages, project updates — saved us hours every week.",
    rating: 5,
    industry: "E-Commerce",
  },
  {
    id: 3,
    name: "David R.",
    role: "Operations Manager",
    company: "Property Management Firm",
    content: "We'd been through two agencies before. Quooro was the first to actually listen, deliver on time, and stick around after launch to make sure it all worked.",
    rating: 5,
    industry: "Property",
  },
  {
    id: 4,
    name: "Sarah K.",
    role: "Marketing Lead",
    company: "Healthcare Group",
    content: "The level of polish and attention to detail was impressive. Our website now reflects the quality of service we provide to our patients.",
    rating: 5,
    industry: "Healthcare",
  },
  {
    id: 5,
    name: "James W.",
    role: "CEO",
    company: "Fintech Startup",
    content: "From concept to launch in weeks, not months. The Quooro Office tools meant we could manage everything without juggling five different platforms.",
    rating: 5,
    industry: "Finance",
  },
];

const INDUSTRY_COLORS: Record<string, string> = {
  Services: "from-blue-500 to-indigo-500",
  "E-Commerce": "from-purple-500 to-pink-500",
  Property: "from-teal-500 to-emerald-500",
  Healthcare: "from-rose-500 to-red-500",
  Finance: "from-amber-500 to-orange-500",
};

interface TestimonialCarouselProps {
  autoPlayInterval?: number;
}

export function TestimonialCarousel({ autoPlayInterval = 5000 }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, []);

  const prevSlide = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, []);

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, nextSlide]);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.92,
      rotateY: direction > 0 ? 12 : -12,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.92,
      rotateY: direction < 0 ? 12 : -12,
      transition: { duration: 0.4 },
    }),
  };

  const currentTestimonial = testimonials[currentIndex];
  const gradientColor = INDUSTRY_COLORS[currentTestimonial.industry] || "from-primary to-primary/60";

  return (
    <section className="py-12 sm:py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 liquid-glass" />
      
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <span className="text-primary text-xs sm:text-sm font-semibold tracking-wider uppercase mb-3 sm:mb-4 block">
            Client Feedback
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 sm:mb-4">
            What Our Clients <span className="text-gradient">Say</span>
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Real feedback from businesses we've worked with
          </p>
        </motion.div>

        <div 
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="perspective-1000">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="relative"
                style={{ transformStyle: "preserve-3d" }}
              >
                <motion.div
                  className="relative liquid-glass-card p-4 sm:p-6 md:p-8 lg:p-12"
                  whileHover={{ scale: 1.01, boxShadow: "0 30px 60px -15px rgba(0,0,0,0.2)" }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Top gradient accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientColor} rounded-t-3xl`} />

                  <div className="absolute top-4 sm:top-6 left-4 sm:left-6 z-20">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-lg`}>
                      <Quote className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

                  <div className="relative z-10 pt-2 sm:pt-4">
                    <div className="flex items-center gap-3 mb-4 sm:mb-6 pl-12 sm:pl-16">
                      <div className="flex gap-0.5">
                        {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                          <motion.div key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-primary text-primary" />
                          </motion.div>
                        ))}
                      </div>
                      <span className="text-[10px] sm:text-xs text-muted-foreground/60 font-medium uppercase tracking-wider flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {currentTestimonial.industry}
                      </span>
                    </div>

                    <blockquote className="text-base sm:text-lg md:text-xl lg:text-2xl text-foreground font-medium leading-relaxed mb-6 sm:mb-8">
                      "{currentTestimonial.content}"
                    </blockquote>

                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg`}>
                        {currentTestimonial.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground text-sm sm:text-base md:text-lg">
                          {currentTestimonial.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {currentTestimonial.role}, {currentTestimonial.company}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ border: '1px solid hsl(var(--border) / 0.15)' }} />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 md:-translate-x-16 w-10 h-10 sm:w-12 sm:h-12 rounded-full liquid-glass-subtle shadow-lg hover:scale-110 transition-all z-20"
            style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }}
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 md:translate-x-16 w-10 h-10 sm:w-12 sm:h-12 rounded-full liquid-glass-subtle shadow-lg hover:scale-110 transition-all z-20"
            style={{ borderColor: 'hsl(var(--foreground) / 0.1)' }}
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>

          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((t, index) => {
              const color = INDUSTRY_COLORS[t.industry] || "from-primary to-primary";
              return (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="relative w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: index === currentIndex ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.25)',
                    transform: index === currentIndex ? 'scale(1.4)' : 'scale(1)',
                  }}
                >
                  {index === currentIndex && (
                    <motion.div
                      layoutId="activeTestimonialDot"
                      className="absolute inset-[-2px] rounded-full"
                      style={{ border: '2px solid hsl(var(--primary) / 0.4)' }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="mt-4 max-w-xs mx-auto h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: 'hsl(var(--muted))' }}>
            <motion.div
              key={currentIndex}
              initial={{ width: "0%" }}
              animate={{ width: isAutoPlaying ? "100%" : "0%" }}
              transition={{ duration: autoPlayInterval / 1000, ease: "linear" }}
              className="h-full rounded-full"
              style={{ backgroundColor: 'hsl(var(--primary))' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
