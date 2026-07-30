import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Upload, Download, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LineDraw, DrawPath, DrawPoint } from '@/components/motion/LineDraw';

/**
 * The import showpiece SHELL. The engine (parsing, dedupe, inserts,
 * progress values) is PROTECTED and lives elsewhere — these components
 * only present the engine's real numbers. Nothing here invents a value.
 */

/** Full-surface drop zone with the orbital motif drawn quietly in. */
export function ImportDropzone({
  onFile,
  accept,
  headline = 'Drop your file',
  detail = 'CSV, Excel, JSON or an HTML table. We read them all.',
  busy = false,
  className,
}: {
  onFile: (file: File) => void;
  accept: string;
  headline?: string;
  detail?: string;
  busy?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Choose a file to import"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={cn(
        'relative flex min-h-[260px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed px-6 py-10 text-center transition-colors duration-150',
        over ? 'border-primary/60 bg-primary/[0.04]' : 'border-border/60 hover:border-primary/40 hover:bg-foreground/[0.02]',
        busy && 'pointer-events-none opacity-60',
        className,
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-4 opacity-70">
        <LineDraw viewBox="0 0 600 200" className="mx-auto h-auto w-full max-w-[520px]">
          <DrawPath d="M -20 150 Q 300 30 620 130" stroke="hsl(var(--foreground))" opacity={0.1} duration={1.4} />
          <DrawPath d="M 330 74 Q 440 46 560 86" stroke="hsl(var(--primary))" strokeWidth={1.2} opacity={0.7} at={0.6} duration={0.8} />
          <DrawPoint cx={330} cy={74} r={2.5} fill="hsl(var(--primary))" ring at={0.55} />
        </LineDraw>
      </div>
      <span className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-card">
        <Upload className="h-[18px] w-[18px] text-ink-2" />
      </span>
      <p className="relative mt-4 font-display text-lg font-semibold tracking-[-0.02em]">{headline}</p>
      <p className="relative mt-1 max-w-xs text-[12.5px] text-muted-foreground">{detail}</p>
      <span className="relative mt-4 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground">
        Browse files
      </span>
    </div>
  );
}

/** Smooth count toward a genuine value — never past it, never invented. */
export function useCountUp(target: number, durationMs = 400): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    if (from === target) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / durationMs);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (k < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return display;
}

/** Live progress on the engine's real numbers. */
export function ImportProgress({
  fileName,
  rowsDetected,
  processed,
  total,
  startedAt,
  className,
}: {
  fileName: string;
  rowsDetected: number;
  processed: number;
  total: number;
  startedAt: number;
  className?: string;
}) {
  const shown = useCountUp(processed);
  const [, force] = useState(0);
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 100);
    return () => clearInterval(id);
  }, []);
  const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
  const pct = total > 0 ? Math.round((processed / total) * 100) : 0;

  return (
    <div className={cn('rounded-xl border border-border/60 bg-card', className)}>
      <div className="flex items-baseline justify-between border-b border-border/60 px-4 py-2.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Reading {fileName}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {rowsDetected} rows detected
        </span>
      </div>
      <div className="px-4 py-5 text-center">
        <p className="font-mono text-3xl tabular-nums">
          {shown}
          <span className="text-muted-foreground"> / {total}</span>
        </p>
        <p className="mt-1 font-mono text-[10.5px] tabular-nums text-muted-foreground">
          {total - processed} remaining · {elapsed}s elapsed
        </p>
        <div className="mx-auto mt-4 h-px max-w-sm overflow-hidden bg-border">
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** The receipt — a document worth screenshotting. Real numbers only. */
export function ImportReceipt({
  fileName,
  imported,
  duplicates,
  failures,
  failureReasons = [],
  rowsDetected,
  durationMs,
  bookSize,
  matchedOn = 'email · phone · name',
  stamp,
  onDone,
  onCopy,
  className,
}: {
  fileName: string;
  imported: number;
  duplicates: number;
  failures: number;
  failureReasons?: string[];
  rowsDetected: number;
  durationMs: number;
  bookSize?: number | null;
  matchedOn?: string;
  stamp: string;
  onDone: () => void;
  onCopy?: () => void;
  className?: string;
}) {
  const row = 'flex items-center justify-between border-b border-border/50 py-2 text-xs last:border-b-0';
  const k = 'text-muted-foreground';
  const v = 'font-mono text-[11px] tabular-nums';

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-baseline justify-between border-b border-border pb-3">
        <span className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-primary">
          Import receipt
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{stamp}</span>
      </div>

      <div className="mt-3.5 overflow-hidden rounded-xl border border-border/60 bg-card">
        <div aria-hidden className="h-0.5 bg-primary" />
        <div className="grid grid-cols-3 px-2 pb-3.5 pt-4 text-center">
          <div>
            <p className="font-mono text-[26px] font-medium tabular-nums text-ok">{imported}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Imported</p>
          </div>
          <div>
            <p className="font-mono text-[26px] font-medium tabular-nums text-attend">{duplicates}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Duplicates skipped</p>
          </div>
          <div>
            <p className={cn('font-mono text-[26px] font-medium tabular-nums', failures > 0 && 'text-risk')}>
              {failures}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Failures</p>
          </div>
        </div>
        <div className="border-t border-border/60 px-4 pb-1.5 pt-1">
          <div className={row}><span className={k}>File</span><span className={v}>{fileName}</span></div>
          <div className={row}><span className={k}>Rows detected</span><span className={v}>{rowsDetected}</span></div>
          <div className={row}><span className={k}>Matched on</span><span className={v}>{matchedOn}</span></div>
          <div className={row}><span className={k}>Total time</span><span className={v}>{(durationMs / 1000).toFixed(1)}s</span></div>
          {bookSize != null && (
            <div className={row}><span className={k}>Your book now</span><span className={v}>{bookSize.toLocaleString('en-GB')} leads</span></div>
          )}
        </div>
        {failures > 0 && failureReasons.length > 0 && (
          <div className="border-t border-border/60 px-4 py-2.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.13em] text-risk">Why rows failed</span>
            <ul className="mt-1 space-y-0.5">
              {failureReasons.slice(0, 4).map((r, i) => (
                <li key={i} className="text-[11.5px] text-muted-foreground">{r}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="border-t border-border/60 px-4 py-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
          {duplicates > 0
            ? "Not one duplicate entered your book. Every skipped row matched an existing lead's email, phone or name."
            : 'Every row was new. Duplicates are matched on email, phone and name, and never imported twice.'}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex h-11 items-center justify-center gap-2 rounded-[11px] bg-primary text-[13px] font-medium text-primary-foreground transition-[filter] hover:brightness-105"
        >
          <Check className="h-4 w-4" /> Done
        </button>
        {onCopy && (
          <button
            type="button"
            onClick={onCopy}
            className="flex h-10 items-center justify-center gap-2 rounded-[11px] border border-border/60 text-[12.5px] text-ink-2 transition-colors hover:text-foreground"
          >
            <Download className="h-[15px] w-[15px]" /> Copy summary
          </button>
        )}
      </div>
    </div>
  );
}

/** Plain-text summary for the copy action — same numbers, no invention. */
export function receiptSummaryText(p: {
  fileName: string; imported: number; duplicates: number; failures: number;
  rowsDetected: number; durationMs: number; stamp: string;
}): string {
  return [
    `Quooro import receipt · ${p.stamp}`,
    `File: ${p.fileName}`,
    `${p.rowsDetected} rows detected · ${p.imported} imported · ${p.duplicates} duplicates skipped · ${p.failures} failures · ${(p.durationMs / 1000).toFixed(1)}s`,
  ].join('\n');
}
