import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

const proofMessages = [
  { business: "Manchester Pub", package: "Business Site", time: "2 hours ago" },
  { business: "London Electrician", package: "Starter Site", time: "5 hours ago" },
  { business: "Bristol Dental Practice", package: "Growth Site", time: "1 day ago" },
  { business: "Edinburgh Café", package: "E-Commerce Store", time: "2 days ago" },
  { business: "Cardiff Fitness Studio", package: "Booking System", time: "3 days ago" },
  { business: "Liverpool Accountants", package: "Client CRM", time: "4 days ago" },
];

export function SocialProofRotator() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % proofMessages.length);
    }, 6000); // Rotate every 6 seconds

    return () => clearInterval(interval);
  }, []);

  const current = proofMessages[currentIndex];

  return (
    <div className="py-6 bg-primary/5 border-y border-primary/10">
      <div className="container-tight">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center gap-3 text-sm"
          >
            <span className="flex items-center gap-1.5 text-primary">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">Just booked:</span>
            </span>
            <span className="text-foreground">
              <span className="font-medium">{current.package}</span>
              {" for "}
              <span className="text-primary">{current.business}</span>
            </span>
            <span className="text-muted-foreground text-xs">• {current.time}</span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
