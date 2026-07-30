import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { StatusDot, statusLabel, statusTone, type Tone } from '../StatusDot';
import { Money } from '../RelativeTime';

/**
 * The kanban pipeline over the EXISTING stage field. Desktop: HTML5
 * drag between columns, 150ms settles, visible drop targets. Mobile:
 * horizontal snap paging plus tap-to-move (the existing edit flow) —
 * drag is not the phone pattern. `onStageChange` is the screen's
 * existing stage-update handler; without it the board is read-only.
 */
export interface PipelineItem {
  id: string;
  title: string;
  subtitle?: string | null;
  value?: number | null;
  stage: string;
}

export interface PipelineStage {
  key: string;
  label?: string;
  tone?: Tone;
}

export function PipelineBoard({
  stages,
  items,
  onOpen,
  onStageChange,
  className,
}: {
  stages: PipelineStage[];
  items: PipelineItem[];
  onOpen?: (item: PipelineItem) => void;
  onStageChange?: (item: PipelineItem, nextStage: string) => void;
  className?: string;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);

  const byStage = (key: string) => items.filter((i) => i.stage === key);
  const valueOf = (key: string) =>
    byStage(key).reduce((sum, i) => sum + (i.value ?? 0), 0);

  return (
    <div
      className={cn(
        'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2',
        className,
      )}
    >
      {stages.map((stage) => {
        const rows = byStage(stage.key);
        const total = valueOf(stage.key);
        const isOver = overStage === stage.key && dragId != null;
        return (
          <section
            key={stage.key}
            aria-label={stage.label ?? statusLabel(stage.key)}
            className={cn(
              'flex w-[268px] shrink-0 snap-start flex-col rounded-[10px] border bg-card transition-colors duration-150 max-sm:w-[82vw]',
              isOver ? 'border-primary/50 bg-primary/[0.04]' : 'border-border/60',
            )}
            onDragOver={
              onStageChange
                ? (e) => {
                    e.preventDefault();
                    setOverStage(stage.key);
                  }
                : undefined
            }
            onDragLeave={onStageChange ? () => setOverStage(null) : undefined}
            onDrop={
              onStageChange
                ? (e) => {
                    e.preventDefault();
                    const item = items.find((i) => i.id === dragId);
                    setOverStage(null);
                    setDragId(null);
                    if (item && item.stage !== stage.key) onStageChange(item, stage.key);
                  }
                : undefined
            }
          >
            <header className="flex items-baseline gap-2 border-b border-border/60 px-3 py-2.5">
              <StatusDot tone={stage.tone ?? statusTone(stage.key)} />
              <span className="text-xs font-medium">{stage.label ?? statusLabel(stage.key)}</span>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                {rows.length}
              </span>
              {total > 0 && (
                <Money value={total} whole className="ml-auto font-mono text-[10.5px] text-ink-2" />
              )}
            </header>
            <div className="min-h-[64px] flex-1 space-y-1.5 overflow-y-auto p-1.5">
              {rows.map((item) => (
                <article
                  key={item.id}
                  draggable={!!onStageChange}
                  onDragStart={onStageChange ? () => setDragId(item.id) : undefined}
                  onDragEnd={onStageChange ? () => { setDragId(null); setOverStage(null); } : undefined}
                  className={cn(
                    'rounded-lg border border-border/60 bg-background transition-[transform,opacity] duration-150',
                    dragId === item.id && 'opacity-40',
                    onStageChange && 'cursor-grab active:cursor-grabbing',
                  )}
                >
                  <button
                    type="button"
                    onClick={onOpen ? () => onOpen(item) : undefined}
                    className="w-full px-3 py-2.5 text-left"
                  >
                    <span className="block truncate text-[12.5px] font-medium">{item.title}</span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] text-muted-foreground">
                        {item.subtitle}
                      </span>
                      {item.value != null && item.value > 0 && (
                        <Money value={item.value} whole className="font-mono text-[10.5px]" />
                      )}
                    </span>
                  </button>
                </article>
              ))}
              {rows.length === 0 && (
                <p className="px-3 py-4 text-center text-[11px] text-muted-foreground">
                  {isOver ? 'Drop to move here' : 'No leads at this stage'}
                </p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/** Report tiles: honest client-side aggregates as quiet fact tiles. */
export function ReportTiles({
  tiles,
  className,
}: {
  tiles: { label: string; value: ReactNode; meta?: string }[];
  className?: string;
}) {
  return (
    <div className={cn('grid grid-cols-2 gap-2 sm:grid-cols-4', className)}>
      {tiles.map((t) => (
        <div key={t.label} className="rounded-[10px] border border-border/60 bg-card px-3 py-2.5">
          <span className="block font-mono text-[9px] font-medium uppercase tracking-[0.13em] text-muted-foreground">
            {t.label}
          </span>
          <span className="mt-1 block font-mono text-lg tabular-nums">{t.value}</span>
          {t.meta && <span className="text-[10.5px] text-muted-foreground">{t.meta}</span>}
        </div>
      ))}
    </div>
  );
}
