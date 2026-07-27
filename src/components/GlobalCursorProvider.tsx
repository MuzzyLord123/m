import { useEffect, useState } from "react";
import { useUIPreferences } from "@/hooks/useUIPreferences";
import { CustomCursor } from "@/components/CustomCursor";

/**
 * Applies cursor style globally to <html> so it works on every page,
 * including sign-in, landing, admin dashboard, etc.
 * Disabled on touch-only devices.
 */
export function GlobalCursorProvider() {
  const { preferences } = useUIPreferences();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const computeTouch = () => {
      const hasTouchPoints = navigator.maxTouchPoints > 0;
      const coarsePointer = window.matchMedia("(any-pointer: coarse)").matches;
      setIsTouchDevice(hasTouchPoints || coarsePointer);
    };

    computeTouch();
    const mq = window.matchMedia("(any-pointer: coarse)");
    mq.addEventListener?.("change", computeTouch);

    return () => {
      mq.removeEventListener?.("change", computeTouch);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("cursor-dot", "cursor-enterprise", "cursor-default-style");

    if (isTouchDevice) return;

    if (preferences.cursorStyle === "dot") {
      root.classList.add("cursor-dot");
    } else if (preferences.cursorStyle === "enterprise") {
      root.classList.add("cursor-enterprise");
    }
  }, [preferences.cursorStyle, isTouchDevice]);

  if (isTouchDevice) return null;

  return <CustomCursor />;
}
