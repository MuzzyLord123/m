import { Shield, Heart, Clock, Award } from "lucide-react";
import { RevealGroup, RevealItem } from "@/components/motion/Reveal";

const badges = [
  {
    icon: Shield,
    text: "100% ownership guaranteed",
    description: "Full code & IP rights"
  },
  {
    icon: Heart,
    text: "UK-based support",
    description: "Real humans, real help"
  },
  {
    icon: Clock,
    text: "30-day warranty",
    description: "Post-launch peace of mind"
  },
  {
    icon: Award,
    text: "Satisfaction guarantee",
    description: "Love it or we fix it"
  },
];

/**
 * Restyled from floating rounded chips to a flush hairline strip — four cells
 * sharing borders, mono ledger voice. These are commitments the studio makes,
 * not borrowed credibility, so they stay.
 */
export function TrustBadgesRow() {
  return (
    <div className="border-y border-border/60">
      <div className="container-tight">
        <RevealGroup className="grid grid-cols-2 lg:grid-cols-4">
          {badges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <RevealItem
                key={badge.text}
                className={`flex items-start gap-3.5 border-border/60 px-2 py-6 sm:px-4 ${index > 0 ? "lg:border-l" : ""} ${index % 2 === 1 ? "border-l lg:border-l" : ""}`}
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium tracking-tight">{badge.text}</p>
                  <p className="mt-0.5 text-xs font-light text-muted-foreground">{badge.description}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </div>
    </div>
  );
}
