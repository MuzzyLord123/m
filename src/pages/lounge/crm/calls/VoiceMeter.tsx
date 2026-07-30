import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Live voice activity from the device microphone: a bar meter driven by
 * a WebAudio analyser. On speakerphone it reacts to both sides of the
 * call, so you can see when the other person is speaking.
 *
 * Android hands the microphone to the phone app while a call is being
 * placed, so an acquisition failure here usually means "busy", not
 * "blocked". The meter tells them apart and keeps retrying, joining the
 * moment the OS frees the mic instead of wrongly reporting a permission
 * problem mid-call.
 */
export function VoiceMeter({ active, className }: { active: boolean; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState<'connecting' | 'live' | 'blocked' | 'busy'>('connecting');

  useEffect(() => {
    if (!active) return;
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let raf = 0;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let alive = true;
    let liveNow = false;
    let quietFrames = 0;

    const teardownAudio = () => {
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach(t => t.stop());
      stream = null;
      ctx?.close().catch(() => {});
      ctx = null;
      liveNow = false;
    };

    const acquire = async () => {
      if (!alive || liveNow) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (e: any) {
        if (!alive) return;
        setStatus(e?.name === 'NotAllowedError' || e?.name === 'SecurityError' ? 'blocked' : 'busy');
        retry = setTimeout(acquire, 2500);
        return;
      }
      if (!alive) { stream.getTracks().forEach(t => t.stop()); return; }
      liveNow = true;
      setStatus('live');
      // If the phone app pulls the mic back mid-call, drop into the
      // retry loop instead of dying.
      stream.getAudioTracks()[0]?.addEventListener('ended', () => {
        if (!alive) return;
        teardownAudio();
        setStatus('busy');
        retry = setTimeout(acquire, 1500);
      });
      ctx = new AudioContext();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.75;
      src.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const draw = () => {
        if (!alive || !liveNow) return;
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
    };

    acquire();
    const onVis = () => {
      if (document.visibilityState === 'visible' && !liveNow) {
        if (retry) clearTimeout(retry);
        acquire();
      }
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      alive = false;
      if (retry) clearTimeout(retry);
      document.removeEventListener('visibilitychange', onVis);
      teardownAudio();
    };
  }, [active]);

  if (!active) return null;
  if (status === 'blocked') {
    return (
      <p className={cn('text-[11px] leading-relaxed text-muted-foreground', className)}>
        Microphone blocked in this browser. Unblock it in site settings and the meter reconnects here on its own.
      </p>
    );
  }
  if (status === 'busy') {
    return (
      <p className={cn('text-[11px] leading-relaxed text-muted-foreground', className)}>
        Waiting for the microphone. The phone app holds it while the call screen is up; put the call on speakerphone and come back, the meter joins by itself.
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
        {status === 'connecting' ? 'Connecting' : speaking ? 'Voice detected' : 'Quiet'}
      </span>
    </div>
  );
}
