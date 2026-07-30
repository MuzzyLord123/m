import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Live voice activity from the device microphone: a bar meter driven by
 * a WebAudio analyser. On speakerphone it reacts to both sides of the
 * call, so you can see when the other person is speaking. Purely a
 * visualisation of real microphone level - nothing synthetic.
 */
export function VoiceMeter({ active, className }: { active: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speaking, setSpeaking] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let alive = true;
    let quietFrames = 0;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        if (alive) setDenied(true);
        return;
      }
      if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
      ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        if (!alive) return;
        analyser.getByteFrequencyData(data);
        const canvas = canvasRef.current;
        if (canvas) {
          const c = canvas.getContext('2d');
          if (c) {
            const w = canvas.width;
            const h = canvas.height;
            c.clearRect(0, 0, w, h);
            const bars = 28;
            const step = Math.floor(data.length / bars);
            const gap = 3;
            const bw = (w - gap * (bars - 1)) / bars;
            let level = 0;
            for (let i = 0; i < bars; i++) {
              const v = data[i * step] / 255;
              level = Math.max(level, v);
              const bh = Math.max(2, v * h);
              c.fillStyle = v > 0.45 ? '#C2410C' : 'rgba(140,140,148,0.55)';
              c.fillRect(i * (bw + gap), (h - bh) / 2, bw, bh);
            }
            if (level > 0.32) { quietFrames = 0; setSpeaking(true); }
            else if (++quietFrames > 24) setSpeaking(false);
          }
        }
        raf = requestAnimationFrame(draw);
      };
      draw();
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach(t => t.stop());
      ctx?.close().catch(() => {});
    };
  }, [active]);

  if (!active) return null;
  if (denied) {
    return (
      <p className={cn('text-[11px] text-muted-foreground', className)}>
        Microphone access was blocked, so the meter and transcript cannot run.
      </p>
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <canvas ref={canvasRef} width={220} height={28} className="h-7 w-[220px]" aria-hidden />
      <span
        className={cn(
          'shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors',
          speaking ? 'text-primary' : 'text-muted-foreground/60',
        )}
      >
        {speaking ? 'Voice detected' : 'Quiet'}
      </span>
    </div>
  );
}
