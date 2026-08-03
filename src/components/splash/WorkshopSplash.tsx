import { useEffect, useRef, useState } from 'react';

/**
 * The Workshop splash.
 *
 * What was here before: twelve icons orbiting a centre, each in a different
 * hue — purple, cyan, pink, teal, amber, rose — one of them labelled "AI
 * Magic", under the tagline DESIGN · BUILD · PUBLISH, for 3200ms. Every
 * time. That is 3.2 seconds of somebody else's stock animation between a
 * person and their work, and it is a large part of why opening the editor
 * felt slow.
 *
 * This is derived from the tool's own surface instead of decorating it: the
 * artboard arrives. A measure rule sweeps, the canvas grid resolves, the
 * frame sets, and the name of the site you are opening appears on it. Same
 * grid as `.studio-canvas-plane`, same rust as every other action in the
 * product, no second hue anywhere.
 *
 * 620ms, and it holds nothing back — the editor is already mounting behind
 * it. Under prefers-reduced-motion it does not run at all.
 */

interface WorkshopSplashProps {
  onComplete: () => void;
  /** The site being opened. Shown on the artboard, because it is the truth
   *  of what is about to appear rather than a slogan. */
  siteName?: string;
}

const DURATION = 620;

export function WorkshopSplash({ onComplete, siteName }: WorkshopSplashProps) {
  const [leaving, setLeaving] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    const finish = () => {
      if (done.current) return;
      done.current = true;
      onComplete();
    };

    // Somebody who has asked for less motion has asked for less motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }

    const out = window.setTimeout(() => setLeaving(true), DURATION - 140);
    const end = window.setTimeout(finish, DURATION);
    return () => { window.clearTimeout(out); window.clearTimeout(end); };
  }, [onComplete]);

  return (
    <div
      className="studio fixed inset-0 z-[9999] grid place-items-center overflow-hidden"
      style={{
        background: 'hsl(var(--studio-bg))',
        opacity: leaving ? 0 : 1,
        transition: 'opacity 140ms linear',
      }}
      role="status"
      aria-label={siteName ? `Opening ${siteName}` : 'Opening the Workshop'}
    >
      {/* The canvas plane, resolving. Identical grid to the real artboard,
          so the splash is the first frame of the tool rather than a poster
          for it. */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(hsl(var(--studio-line)) 1px, transparent 1px),' +
            'linear-gradient(90deg, hsl(var(--studio-line)) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: 'radial-gradient(60% 60% at 50% 50%, #000 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(60% 60% at 50% 50%, #000 30%, transparent 100%)',
          animation: 'wk-grid 620ms cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      />

      {/* The artboard itself. */}
      <div
        className="relative flex h-[132px] w-[236px] flex-col justify-between rounded-[10px] p-3"
        style={{
          background: 'hsl(var(--studio-panel))',
          boxShadow: '0 1px 0 hsl(0 0% 100% / 0.05) inset, 0 24px 60px hsl(0 0% 0% / 0.55)',
          animation: 'wk-board 620ms cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        {/* The measure rule, sweeping once across the top edge. */}
        <span
          className="absolute left-0 right-0 top-0 h-px overflow-hidden rounded-t-[10px]"
          style={{ background: 'hsl(var(--studio-line-strong))' }}
        >
          <span
            className="absolute inset-y-0 w-1/3"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(var(--studio-accent)), transparent)',
              animation: 'wk-sweep 620ms cubic-bezier(0.4, 0, 0.2, 1) both',
            }}
          />
        </span>

        {/* Blocks settling into a layout — a heading, a line of copy, an
            action. The shape of every page anyone builds here. */}
        <div className="space-y-1.5 pt-1">
          <span className="block h-2 w-[62%] rounded-[2px]"
            style={{ background: 'hsl(var(--studio-ink) / 0.85)', animation: 'wk-block 620ms 60ms cubic-bezier(0.22,1,0.36,1) both' }} />
          <span className="block h-1.5 w-[86%] rounded-[2px]"
            style={{ background: 'hsl(var(--studio-ink-3))', animation: 'wk-block 620ms 110ms cubic-bezier(0.22,1,0.36,1) both' }} />
          <span className="block h-1.5 w-[74%] rounded-[2px]"
            style={{ background: 'hsl(var(--studio-ink-3))', animation: 'wk-block 620ms 150ms cubic-bezier(0.22,1,0.36,1) both' }} />
        </div>

        <span className="block h-4 w-[42%] rounded-[3px]"
          style={{ background: 'hsl(var(--studio-accent))', animation: 'wk-block 620ms 210ms cubic-bezier(0.22,1,0.36,1) both' }} />
      </div>

      {/* What is opening. No tagline. */}
      <p
        className="absolute left-1/2 top-[calc(50%+104px)] -translate-x-1/2 whitespace-nowrap text-[11px] font-medium tracking-[0.14em]"
        style={{
          color: 'hsl(var(--studio-ink-3))',
          textTransform: 'uppercase',
          animation: 'wk-name 620ms 260ms cubic-bezier(0.22,1,0.36,1) both',
        }}
      >
        {siteName || 'Workshop'}
      </p>

      <style>{`
        @keyframes wk-grid  { from { opacity: 0 } to { opacity: 0.55 } }
        @keyframes wk-board {
          from { opacity: 0; transform: translateY(6px) scale(0.985) }
          to   { opacity: 1; transform: none }
        }
        @keyframes wk-sweep { from { transform: translateX(-100%) } to { transform: translateX(400%) } }
        @keyframes wk-block { from { opacity: 0; transform: translateX(-4px) } to { opacity: 1; transform: none } }
        @keyframes wk-name  { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  );
}

export default WorkshopSplash;
