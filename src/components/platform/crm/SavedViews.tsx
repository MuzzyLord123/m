import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Saved views: named filter/sort presets. No endpoint exists for these
 * yet, so they persist per-device in localStorage and the bar says so —
 * the server-side upgrade is item 2 in CRM-ROADMAP.md. Filters are
 * opaque JSON to this layer; the screen owns their meaning.
 */
export interface SavedView<F = unknown> {
  id: string;
  name: string;
  filters: F;
  sort?: { key: string; dir: 'asc' | 'desc' };
}

export function useSavedViews<F = unknown>(storageKey: string) {
  const [views, setViews] = useState<SavedView<F>[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) setViews(arr);
    } catch {
      /* unreadable store — start empty */
    }
  }, [storageKey]);

  const persist = useCallback(
    (next: SavedView<F>[]) => {
      setViews(next);
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* storage full/unavailable — views live for the session only */
      }
    },
    [storageKey],
  );

  const saveView = useCallback(
    (name: string, filters: F, sort?: SavedView<F>['sort']) => {
      const id = `v-${Date.now().toString(36)}-${views.length}`;
      persist([...views, { id, name: name.trim() || 'Untitled view', filters, sort }]);
      return id;
    },
    [views, persist],
  );

  const deleteView = useCallback(
    (id: string) => persist(views.filter((v) => v.id !== id)),
    [views, persist],
  );

  return { views, saveView, deleteView };
}

export function SavedViewsBar<F>({
  views,
  activeId,
  onSelect,
  onSaveCurrent,
  onDelete,
  baseLabel = 'All leads',
  className,
}: {
  views: SavedView<F>[];
  /** null = the unsaved base view. */
  activeId: string | null;
  onSelect: (id: string | null) => void;
  /** Present when the current filters differ from the active view. */
  onSaveCurrent?: () => void;
  onDelete?: (id: string) => void;
  baseLabel?: string;
  className?: string;
}) {
  const chip = (on: boolean) =>
    cn(
      'flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors duration-150 max-sm:h-10',
      on
        ? 'border-border bg-foreground/[0.05] text-foreground'
        : 'border-border/60 text-muted-foreground hover:text-foreground',
    );

  return (
    <div className={cn('flex items-center gap-1.5 overflow-x-auto scrollbar-hide', className)}>
      <button type="button" className={chip(activeId === null)} onClick={() => onSelect(null)}>
        {baseLabel}
      </button>
      {views.map((v) => (
        <span key={v.id} className={chip(activeId === v.id)} role="group">
          <button type="button" onClick={() => onSelect(v.id)} className="max-w-[140px] truncate">
            {v.name}
          </button>
          {onDelete && activeId === v.id && (
            <button
              type="button"
              aria-label={`Delete view ${v.name}`}
              onClick={() => onDelete(v.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {onSaveCurrent && (
        <button
          type="button"
          onClick={onSaveCurrent}
          className="flex h-7 shrink-0 items-center rounded-lg border border-border/60 px-2.5 text-xs text-muted-foreground transition-colors hover:text-foreground max-sm:h-10"
        >
          + Save view
        </button>
      )}
      <span className="ml-1 shrink-0 font-mono text-[8.5px] uppercase tracking-[0.12em] text-muted-foreground/70">
        Saved on this device
      </span>
    </div>
  );
}
