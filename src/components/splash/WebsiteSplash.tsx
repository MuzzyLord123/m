import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * The website splash: the first two seconds a visitor spends with
 * Quooro, so it is drawn rather than decorated.
 *
 * One config, five motifs, all of them vector and type - no images to
 * download and nothing that can arrive late. Each motif resolves into
 * the same wordmark, so whichever is live the brand lands identically;
 * only the way it arrives changes.
 *
 * Anyone who has asked their system to reduce motion is shown the
 * resolved state immediately and the screen leaves early.
 */

export interface SplashConfig {
  motif: 'sweep' | 'typeset' | 'lattice' | 'ember' | 'aperture' | 'aurora' | 'console';
  bg: string;
  ink: string;
  accent: string;
  wordmark: string;
  line: string;
  durationMs: number;
  grain?: boolean;
  /** Names the surface beneath the wordmark: Lounge, Team. */
  sub?: string;
}

export const DEFAULT_SPLASH: SplashConfig = {
  motif: 'sweep',
  bg: '#0A0A0D',
  ink: '#EDEDEF',
  accent: '#C2410C',
  wordmark: 'Quooro',
  line: 'Built in Wales',
  durationMs: 2200,
  grain: true,
};

const EASE = [0.22, 1, 0.36, 1] as const;

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Fine film grain, drawn once, so flat colour never looks like plastic. */
function Grain({ opacity = 0.035 }: { opacity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const d = ctx.createImageData(c.width, c.height);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = 120 + Math.floor(Math.random() * 135);
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    ctx.putImageData(d, 0, 0);
  }, []);
  return (
    <canvas
      ref={ref}
      width={140}
      height={140}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full mix-blend-overlay"
      style={{ opacity, imageRendering: 'pixelated' }}
    />
  );
}

/** The mark: a target of arcs, drawn as it appears. */
function Mark({ accent, ink, size = 62, draw }: { accent: string; ink: string; size?: number; draw: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {[26, 18, 10].map((r, i) => (
        <motion.circle
          key={r}
          cx="32" cy="32" r={r}
          stroke={i === 0 ? accent : ink}
          strokeOpacity={i === 0 ? 1 : 0.28 + i * 0.12}
          strokeWidth={i === 0 ? 2 : 1.25}
          strokeLinecap="round"
          initial={draw ? { pathLength: 0, opacity: 0 } : false}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.08 * i, ease: EASE }}
          style={{ rotate: -90, transformOrigin: '32px 32px' }}
        />
      ))}
      <motion.circle
        cx="32" cy="32" r="3.4" fill={accent}
        initial={draw ? { scale: 0 } : false}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
        style={{ transformOrigin: '32px 32px' }}
      />
    </svg>
  );
}

function Wordmark({
  text, ink, accent, motif, still,
}: { text: string; ink: string; accent: string; motif: SplashConfig['motif']; still: boolean }) {
  const letters = useMemo(() => text.split(''), [text]);

  // Typeset sets itself letter by letter; the others arrive whole.
  if (motif === 'typeset' && !still) {
    return (
      <span className="flex" style={{ color: ink }}>
        {letters.map((ch, i) => (
          <motion.span
            key={`${ch}-${i}`}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.6, delay: 0.28 + i * 0.055, ease: EASE }}
            style={{ display: 'inline-block' }}
          >
            {ch}
          </motion.span>
        ))}
        <motion.span
          aria-hidden
          initial={{ opacity: 0, scaleY: 0 }}
          animate={{ opacity: 1, scaleY: 1 }}
          transition={{ duration: 0.4, delay: 0.28 + letters.length * 0.055, ease: EASE }}
          className="ml-1 inline-block w-[3px] self-stretch"
          style={{ background: accent, transformOrigin: 'bottom' }}
        />
      </span>
    );
  }

  return (
    <motion.span
      style={{ color: ink }}
      initial={still ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.35, ease: EASE }}
    >
      {text}
    </motion.span>
  );
}

export function WebsiteSplash({
  config = DEFAULT_SPLASH,
  onComplete,
  preview = false,
  scale = 1,
}: {
  config?: SplashConfig;
  onComplete?: () => void;
  /** Rendered inside a device frame rather than over the site. */
  preview?: boolean;
  scale?: number;
}) {
  const c = { ...DEFAULT_SPLASH, ...config };
  const still = !preview && prefersReducedMotion();
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (preview) return;
    const ms = still ? 600 : Math.max(900, c.durationMs);
    const t = setTimeout(() => { setGone(true); onComplete?.(); }, ms);
    return () => clearTimeout(t);
  }, [preview, still, c.durationMs, onComplete]);

  if (gone) return null;

  const draw = !still;

  return (
    <motion.div
      className={preview ? 'absolute inset-0 overflow-hidden' : 'fixed inset-0 z-[9999] overflow-hidden'}
      style={{ background: c.bg }}
      initial={false}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role={preview ? undefined : 'status'}
      aria-label={preview ? undefined : 'Loading Quooro'}
    >
      {/* Motif: the character of the arrival. */}
      {c.motif === 'sweep' && (
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 h-[150vmax] w-[150vmax] -translate-x-1/2 -translate-y-1/2"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${c.accent}22 18deg, transparent 46deg)`,
          }}
          initial={draw ? { rotate: -120, opacity: 0 } : false}
          animate={{ rotate: 240, opacity: 1 }}
          transition={{ duration: 2.6, ease: 'linear' }}
        />
      )}

      {c.motif === 'lattice' && (
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              `linear-gradient(${c.ink}0e 1px, transparent 1px), linear-gradient(90deg, ${c.ink}0e 1px, transparent 1px)`,
            backgroundSize: `${44 * scale}px ${44 * scale}px`,
            maskImage: 'radial-gradient(circle at 50% 50%, #000 20%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 50%, #000 20%, transparent 72%)',
          }}
          initial={draw ? { opacity: 0, scale: 1.12 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: EASE }}
        />
      )}

      {c.motif === 'ember' && (
        <motion.div
          aria-hidden
          className="absolute left-0 right-0 top-1/2 h-px origin-left"
          style={{ background: `linear-gradient(90deg, transparent, ${c.accent}, transparent)` }}
          initial={draw ? { scaleX: 0, opacity: 0 } : false}
          animate={{ scaleX: 1, opacity: [0, 1, 0.35] }}
          transition={{ duration: 1.5, ease: EASE }}
        />
      )}

      {/* Aurora: a warm horizon rising, for the Lounge - the customer's
          own room, so it should feel like a light coming on. */}
      {c.motif === 'aurora' && (
        <>
          <motion.div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[62%]"
            style={{
              background: `radial-gradient(120% 100% at 50% 100%, ${c.accent}3a 0%, ${c.accent}12 38%, transparent 70%)`,
            }}
            initial={draw ? { opacity: 0, y: '26%' } : false}
            animate={{ opacity: 1, y: '0%' }}
            transition={{ duration: 1.9, ease: EASE }}
          />
          <motion.div
            aria-hidden
            className="absolute inset-x-0 bottom-[38%] h-px"
            style={{ background: `linear-gradient(90deg, transparent, ${c.accent}cc, transparent)` }}
            initial={draw ? { scaleX: 0.2, opacity: 0 } : false}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 1.5, delay: 0.2, ease: EASE }}
          />
        </>
      )}

      {/* Console: instruments coming up, for the Team portal - the desk
          you work from, so it should read as equipment waking. */}
      {c.motif === 'console' && (
        <>
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, ${c.ink}0a 0px, ${c.ink}0a 1px, transparent 1px, transparent ${Math.round(4 * scale) || 4}px)`,
            }}
            initial={draw ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.1, ease: EASE }}
          />
          <div className="absolute inset-x-0 top-[18%] flex justify-center gap-[3px]">
            {Array.from({ length: 28 }).map((_, i) => (
              <motion.span
                key={i}
                aria-hidden
                className="block w-px"
                style={{ background: i % 7 === 0 ? c.accent : `${c.ink}55`, height: i % 7 === 0 ? 14 * scale : 7 * scale }}
                initial={draw ? { scaleY: 0, opacity: 0 } : false}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.022, ease: EASE }}
              />
            ))}
          </div>
          <motion.div
            aria-hidden
            className="absolute inset-x-[22%] bottom-[24%] h-px origin-left"
            style={{ background: `${c.accent}` }}
            initial={draw ? { scaleX: 0 } : false}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.4, ease: EASE }}
          />
        </>
      )}

      {c.motif === 'aperture' && (
        <>
          {[0, 1].map(i => (
            <motion.div
              key={i}
              aria-hidden
              className="absolute left-0 right-0 h-1/2"
              style={{ background: c.bg, [i ? 'bottom' : 'top']: 0, borderColor: `${c.accent}55` }}
              initial={draw ? { y: 0 } : false}
              animate={{ y: i ? '46%' : '-46%' }}
              transition={{ duration: 1.5, delay: 0.75, ease: EASE }}
            />
          ))}
          <motion.div
            aria-hidden
            className="absolute left-0 right-0 top-1/2 h-px"
            style={{ background: `${c.accent}` }}
            initial={draw ? { scaleX: 0.1, opacity: 0 } : false}
            animate={{ scaleX: 1, opacity: [0, 1, 0.2] }}
            transition={{ duration: 1.2, ease: EASE }}
          />
        </>
      )}

      {/* The resolved brand, identical whichever motif brought it here. */}
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-5">
        <Mark accent={c.accent} ink={c.ink} size={62 * scale} draw={draw} />
        <div
          className="font-display font-semibold tracking-[-0.03em]"
          style={{ fontSize: `${44 * scale}px`, lineHeight: 1 }}
        >
          <Wordmark text={c.wordmark} ink={c.ink} accent={c.accent} motif={c.motif} still={still} />
        </div>
        {c.sub && (
          <motion.p
            className="font-mono uppercase"
            style={{ color: c.accent, fontSize: `${10 * scale}px`, letterSpacing: '0.36em', marginTop: `${-10 * scale}px` }}
            initial={draw ? { opacity: 0, letterSpacing: '0.6em' } : false}
            animate={{ opacity: 1, letterSpacing: '0.36em' }}
            transition={{ duration: 0.8, delay: 0.6, ease: EASE }}
          >
            {c.sub}
          </motion.p>
        )}
        <motion.div
          className="flex items-center gap-2.5"
          initial={draw ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.85, ease: EASE }}
        >
          <span aria-hidden style={{ background: `${c.ink}33` }} className="h-px w-8" />
          <span
            className="font-mono uppercase"
            style={{ color: `${c.ink}99`, fontSize: `${9 * scale}px`, letterSpacing: '0.18em' }}
          >
            {c.line}
          </span>
          <span aria-hidden style={{ background: `${c.ink}33` }} className="h-px w-8" />
        </motion.div>

        {/* A hairline that fills for exactly as long as the screen lasts. */}
        <motion.div
          aria-hidden
          className="absolute bottom-[14%] h-px origin-left"
          style={{ background: c.accent, width: `${120 * scale}px` }}
          initial={draw ? { scaleX: 0 } : false}
          animate={{ scaleX: 1 }}
          transition={{ duration: (preview ? 2400 : c.durationMs) / 1000, ease: 'linear' }}
        />
      </div>

      {c.grain && <Grain />}
    </motion.div>
  );
}

export default WebsiteSplash;
