import { motion } from "framer-motion";
import { Shield, Heart, Clock, Award } from "lucide-react";

const badges = [
  {
    icon: Shield,
    text: "100% Ownership Guaranteed",
    description: "Full code & IP rights"
  },
  {
    icon: Heart,
    text: "UK-Based Support",
    description: "Real humans, real help"
  },
  {
    icon: Clock,
    text: "30-Day Warranty",
    description: "Post-launch peace of mind"
  },
  {
    icon: Award,
    text: "Satisfaction Guarantee",
    description: "Love it or we fix it"
  },
];

export function TrustBadgesRow() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="py-8 border-y border-border/30 bg-muted/20"
    >
      <div className="container-tight">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.text}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center p-4 rounded-xl bg-background/50 border border-border/30"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-sm">{badge.text}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
