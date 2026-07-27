import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MobileClickToCall() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-background/95 backdrop-blur-xl border-t border-border/50 sm:hidden safe-area-inset-bottom">
      <Button
        variant="hero"
        size="lg"
        className="w-full"
        asChild
      >
        <a href="tel:+447000000000" aria-label="Call us now">
          <Phone className="w-5 h-5 mr-2" />
          Call Now
        </a>
      </Button>
    </div>
  );
}
