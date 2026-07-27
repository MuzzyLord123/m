import { motion } from "framer-motion";
import { Rocket, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function UrgencyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-3 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border-y border-primary/20"
    >
      <div className="container-tight">
        <div className="flex items-center justify-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-2 text-primary">
            <Rocket className="w-4 h-4" />
            <span className="font-semibold">Free Preview Available</span>
          </div>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <span className="text-foreground">
            See your website designed before you commit — <span className="font-bold text-primary">no payment required</span>
          </span>
          <span className="text-muted-foreground hidden sm:inline">•</span>
          <Link to="/get-started" className="flex items-center gap-1.5 text-primary hover:underline text-xs font-medium">
            Request yours <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
