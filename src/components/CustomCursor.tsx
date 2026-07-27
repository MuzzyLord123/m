import { useEffect, useRef } from "react";
import { useUIPreferences } from "@/hooks/useUIPreferences";

export function CustomCursor() {
  const { preferences } = useUIPreferences();
  const dotRef = useRef<HTMLDivElement>(null);
  const clickingRef = useRef(false);
  const visibleRef = useRef(false);

  useEffect(() => {
    if (preferences.cursorStyle !== "dot") return;

    const dot = dotRef.current;
    if (!dot) return;

    const onMove = (e: MouseEvent) => {
      dot.style.transform = `translate3d(${e.clientX - 6}px, ${e.clientY - 6}px, 0)`;
      if (!visibleRef.current) {
        visibleRef.current = true;
        dot.style.opacity = "1";
      }
    };
    const onDown = () => {
      clickingRef.current = true;
      dot.style.transform = dot.style.transform; // keep position
      (dot.firstElementChild as HTMLElement).style.transform = "scale(0.7)";
    };
    const onUp = () => {
      clickingRef.current = false;
      (dot.firstElementChild as HTMLElement).style.transform = "scale(1)";
    };
    const onLeave = () => {
      visibleRef.current = false;
      dot.style.opacity = "0";
    };
    const onEnter = () => {
      visibleRef.current = true;
      dot.style.opacity = "1";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
    };
  }, [preferences.cursorStyle]);

  if (preferences.cursorStyle !== "dot") return null;

  return (
    <div
      ref={dotRef}
      className="custom-cursor-dot fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{ opacity: 0, willChange: "transform" }}
    >
      <div
        className="rounded-full"
        style={{
          width: 12,
          height: 12,
          background: "rgba(160,160,160,0.85)",
          boxShadow: "0 0 8px rgba(160,160,160,0.3)",
          mixBlendMode: "difference",
          transition: "transform 0.15s ease",
        }}
      />
    </div>
  );
}
