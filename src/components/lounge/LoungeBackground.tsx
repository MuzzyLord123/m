import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useUIPreferences, type ThemeBackground } from '@/hooks/useUIPreferences';

interface Orb {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  phase: number;
  speed: number;
}

export function LoungeBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const orbsRef = useRef<Orb[]>([]);
  const animRef = useRef<number>(0);
  const themeRef = useRef(isDark);
  const { preferences } = useUIPreferences();
  const bgTypeRef = useRef<ThemeBackground>(preferences.themeBackground);

  useEffect(() => {
    themeRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    bgTypeRef.current = preferences.themeBackground;
  }, [preferences.themeBackground]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Create orbs
    const w = window.innerWidth;
    const h = window.innerHeight;
    const orbCount = Math.min(6, Math.max(3, Math.floor(w / 300)));

    orbsRef.current = Array.from({ length: orbCount }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: 150 + Math.random() * 250,
      hue: 0,
      saturation: 0,
      lightness: 50,
      alpha: 0.03 + Math.random() * 0.02,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0003 + Math.random() * 0.0005,
    }));

    let time = 0;
    let lastFrameTime = 0;
    const FRAME_INTERVAL = 1000 / 30;

    const drawOrbs = (cw: number, ch: number, dark: boolean) => {
      for (const orb of orbsRef.current) {
        orb.x += orb.vx + Math.sin(time * orb.speed + orb.phase) * 0.15;
        orb.y += orb.vy + Math.cos(time * orb.speed * 0.7 + orb.phase) * 0.15;
        if (orb.x < -orb.radius) orb.x = cw + orb.radius;
        if (orb.x > cw + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = ch + orb.radius;
        if (orb.y > ch + orb.radius) orb.y = -orb.radius;
        const breathe = Math.sin(time * orb.speed * 2 + orb.phase) * 30;
        const r = orb.radius + breathe;
        const l = dark ? 10 + Math.sin(time * orb.speed + orb.phase) * 3 : 85 + Math.sin(time * orb.speed + orb.phase) * 5;
        const s = dark ? orb.saturation * 1.5 : orb.saturation * 2.5;
        const a = dark ? orb.alpha * 1 : orb.alpha * 1.5;
        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
        gradient.addColorStop(0, `hsla(${orb.hue}, ${s}%, ${l}%, ${a})`);
        gradient.addColorStop(0.5, `hsla(${orb.hue}, ${s * 0.6}%, ${l}%, ${a * 0.5})`);
        gradient.addColorStop(1, `hsla(${orb.hue}, ${s * 0.3}%, ${l}%, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(orb.x - r, orb.y - r, r * 2, r * 2);
      }
    };

    const drawGrid = (cw: number, ch: number, dark: boolean) => {
      const spacing = 40;
      const alpha = dark ? 0.06 : 0.08;
      ctx.strokeStyle = dark ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= cw; x += spacing) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ch);
      }
      for (let y = 0; y <= ch; y += spacing) {
        ctx.moveTo(0, y);
        ctx.lineTo(cw, y);
      }
      ctx.stroke();
    };

    const drawDots = (cw: number, ch: number, dark: boolean) => {
      const spacing = 28;
      const alpha = dark ? 0.12 : 0.15;
      ctx.fillStyle = dark ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
      for (let x = spacing; x < cw; x += spacing) {
        for (let y = spacing; y < ch; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const drawGradient = (cw: number, ch: number, dark: boolean) => {
      const t = time * 0.002;
      const x1 = cw * (0.3 + Math.sin(t) * 0.2);
      const y1 = ch * (0.3 + Math.cos(t * 0.7) * 0.2);
      const gradient = ctx.createRadialGradient(x1, y1, 0, x1, y1, Math.max(cw, ch) * 0.6);
      if (dark) {
        gradient.addColorStop(0, 'hsla(20, 20%, 12%, 0.15)');
        gradient.addColorStop(0.5, 'hsla(30, 12%, 9%, 0.08)');
        gradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
      } else {
        gradient.addColorStop(0, 'hsla(36, 30%, 90%, 0.25)');
        gradient.addColorStop(0.5, 'hsla(28, 22%, 87%, 0.12)');
        gradient.addColorStop(1, 'hsla(0, 0%, 100%, 0)');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cw, ch);
    };

    const drawNoise = (cw: number, ch: number, dark: boolean) => {
      const imageData = ctx.createImageData(Math.ceil(cw / 4), Math.ceil(ch / 4));
      const data = imageData.data;
      const base = dark ? 255 : 0;
      const alpha = dark ? 8 : 12;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = base;
        data[i + 1] = base;
        data[i + 2] = base;
        data[i + 3] = Math.random() * alpha;
      }
      ctx.putImageData(imageData, 0, 0);
    };

    const drawAurora = (cw: number, ch: number, dark: boolean) => {
      const t = time * 0.003;
      for (let i = 0; i < 3; i++) {
        const x = cw * (0.2 + i * 0.3 + Math.sin(t + i * 2) * 0.1);
        const y = ch * (0.3 + Math.cos(t * 0.5 + i) * 0.15);
        const r = 300 + Math.sin(t + i) * 100;
        // Night Shift family only: ember, flame, brass — no hue cycling
        const hue = [13, 22, 32][i];
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
        if (dark) {
          gradient.addColorStop(0, `hsla(${hue}, 40%, 20%, 0.06)`);
          gradient.addColorStop(0.5, `hsla(${hue}, 30%, 15%, 0.03)`);
          gradient.addColorStop(1, `hsla(${hue}, 20%, 10%, 0)`);
        } else {
          gradient.addColorStop(0, `hsla(${hue}, 50%, 70%, 0.1)`);
          gradient.addColorStop(0.5, `hsla(${hue}, 40%, 80%, 0.05)`);
          gradient.addColorStop(1, `hsla(${hue}, 30%, 90%, 0)`);
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, cw, ch);
      }
    };

    const animate = (timestamp: number) => {
      if (document.visibilityState === 'hidden') {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      const delta = timestamp - lastFrameTime;
      if (delta < FRAME_INTERVAL) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = timestamp - (delta % FRAME_INTERVAL);
      time++;

      const dark = themeRef.current;
      const cw = window.innerWidth;
      const ch = window.innerHeight;
      const bgType = bgTypeRef.current;

      ctx.clearRect(0, 0, cw, ch);

      if (bgType === 'none') {
        // No background effect
      } else if (bgType === 'orbs') {
        drawOrbs(cw, ch, dark);
      } else if (bgType === 'grid') {
        drawGrid(cw, ch, dark);
      } else if (bgType === 'dots') {
        drawDots(cw, ch, dark);
      } else if (bgType === 'gradient') {
        drawGradient(cw, ch, dark);
      } else if (bgType === 'noise') {
        drawNoise(cw, ch, dark);
      } else if (bgType === 'aurora') {
        drawAurora(cw, ch, dark);
      }

      // Static backgrounds: no need to keep animating
      if (bgType === 'grid' || bgType === 'dots' || bgType === 'noise' || bgType === 'none') {
        return; // Stop the loop for static backgrounds
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [preferences.themeBackground]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
