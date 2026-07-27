import { useEffect, useRef } from "react";

/**
 * Interactive canvas particle field for the hero section.
 * - ~120 subtle nardo-grey dots that drift slowly.
 * - Cursor creates a soft repulsion field; dots ease back to home position.
 * - Honors prefers-reduced-motion (static render).
 * - Pauses when tab is hidden.
 * - Pointer-events: none so it never blocks the screens / CTAs.
 */
export function HeroParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    type P = {
      hx: number; hy: number; // home
      x: number; y: number;
      vx: number; vy: number;
      r: number; alpha: number;
      phase: number; speed: number;
    };
    let particles: P[] = [];
    let width = 0;
    let height = 0;
    const mouse = { x: -9999, y: -9999, active: false };
    const REPEL_R = 140;
    const REPEL_R2 = REPEL_R * REPEL_R;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = Math.min(140, Math.floor((width * height) / 14000));
      particles = Array.from({ length: target }, () => {
        const hx = Math.random() * width;
        const hy = Math.random() * height;
        return {
          hx, hy,
          x: hx, y: hy,
          vx: 0, vy: 0,
          r: 0.9 + Math.random() * 1.8,
          alpha: 0.35 + Math.random() * 0.45,
          phase: Math.random() * Math.PI * 2,
          speed: 0.0004 + Math.random() * 0.0008,
        };
      });
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; };

    let raf = 0;
    let last = performance.now();
    const draw = (now: number) => {
      const dt = Math.min(40, now - last);
      last = now;
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        // gentle drift around home
        p.phase += p.speed * dt;
        const driftX = Math.cos(p.phase) * 6;
        const driftY = Math.sin(p.phase * 1.3) * 6;
        const homeX = p.hx + driftX;
        const homeY = p.hy + driftY;

        // repulsion
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < REPEL_R2 && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const force = (1 - d / REPEL_R) * 1.6;
            p.vx += (dx / d) * force;
            p.vy += (dy / d) * force;
          }
        }

        // spring back to home
        p.vx += (homeX - p.x) * 0.012;
        p.vy += (homeY - p.y) * 0.012;
        p.vx *= 0.86;
        p.vy *= 0.86;
        p.x += p.vx;
        p.y += p.vy;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(220, 8%, 65%, ${p.alpha})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    resize();

    if (reduceMotion) {
      // static render once
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(220, 6%, 50%, ${p.alpha})`;
        ctx.fill();
      }
      return;
    }

    raf = requestAnimationFrame(draw);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    const onVis = () => {
      if (document.hidden) cancelAnimationFrame(raf);
      else { last = performance.now(); raf = requestAnimationFrame(draw); }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 4 }}
    />
  );
}
