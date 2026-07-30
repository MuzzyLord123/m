import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { EmptyState } from '../states';

/**
 * The desktop power table: a virtualised sibling of the kit DataTable
 * for lists that can reach the 50,000-row fetch cap. Same philosophy —
 * sticky sunken header, hairline rows, honest sort, right-aligned
 * tabular numerics, bulk select — but rows render through
 * @tanstack/react-virtual so the table stays instant at any book size.
 * Client-side presentation only; data arrives exactly as the screen
 * already fetched it.
 */
export interface VirtualColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Value used for client-side sorting; omit to disable sorting. */
  sortValue?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'right';
  /** Numeric/ID column: mono + tabular. */
  mono?: boolean;
  /** CSS grid track, e.g. '150px' or 'minmax(220px,1.4fr)'. */
  track: string;
}

export function VirtualTable<T>({
  rows,
  columns,
  rowKey,
  onRowClick,
  activeId,
  selectable = false,
  selected,
  onSelectedChange,
  defaultSort,
  rowHeight = 56,
  minWidth = 880,
  empty,
  className,
  'aria-label': ariaLabel,
}: {
  rows: T[];
  columns: VirtualColumn<T>[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  /** Row rendered as current (open record). */
  activeId?: string | null;
  selectable?: boolean;
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  rowHeight?: number;
  minWidth?: number;
  empty?: { title: string; body?: string };
  className?: string;
  'aria-label'?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(defaultSort ?? null);
  const sel = selected ?? new Set<string>();

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
  }, [rows, sort, columns]);

  const virtualizer = useVirtualizer({
    count: sorted.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
  });

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));

  const allSelected = sorted.length > 0 && sorted.every((r) => sel.has(rowKey(r)));
  const toggleAll = () => {
    if (!onSelectedChange) return;
    onSelectedChange(allSelected ? new Set() : new Set(sorted.map(rowKey)));
  };
  const toggleOne = (id: string) => {
    if (!onSelectedChange) return;
    const next = new Set(sel);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedChange(next);
  };

  const template = `${selectable ? '40px ' : ''}${columns.map((c) => c.track).join(' ')}`;

  if (sorted.length === 0) {
    return (
      <div className={cn('flex flex-1 flex-col justify-center', className)}>
        <EmptyState compact title={empty?.title ?? 'No records'} body={empty?.body} />
      </div>
    );
  }

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-x-auto', className)} role="table" aria-label={ariaLabel}>
      <div style={{ minWidth }} className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div
          role="row"
          className="grid shrink-0 items-center border-b border-border/60 bg-sunken"
          style={{ gridTemplateColumns: template }}
        >
          {selectable && (
            <div className="px-3 py-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all rows"
                className="translate-y-[1px]"
              />
            </div>
          )}
          {columns.map((col) => {
            const active = sort?.key === col.key;
            return (
              <div
                key={col.key}
                role="columnheader"
                aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                className={cn(
                  'px-3 py-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground',
                  col.align === 'right' && 'text-right',
                )}
              >
                {col.sortValue ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className={cn(
                      'inline-flex items-center gap-1 uppercase tracking-[0.13em] transition-colors hover:text-foreground',
                      active && 'text-foreground',
                    )}
                  >
                    {col.header}
                    {active && (sort!.dir === 'asc' ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />)}
                  </button>
                ) : (
                  col.header
                )}
              </div>
            );
          })}
        </div>

        {/* Virtualised body */}
        <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto">
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
            {virtualizer.getVirtualItems().map((vi) => {
              const row = sorted[vi.index];
              const id = rowKey(row);
              const isSel = sel.has(id);
              return (
                <div
                  key={id}
                  role="row"
                  data-vt-row
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: rowHeight,
                    transform: `translateY(${vi.start}px)`,
                    gridTemplateColumns: template,
                  }}
                  className={cn(
                    'grid items-center border-b border-border/60 transition-colors duration-150',
                    onRowClick && 'cursor-pointer hover:bg-foreground/[0.025]',
                    (isSel || activeId === id) && 'bg-primary/[0.05]',
                  )}
                >
                  {selectable && (
                    <div className="px-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSel}
                        onCheckedChange={() => toggleOne(id)}
                        aria-label="Select row"
                        className="translate-y-[1px]"
                      />
                    </div>
                  )}
                  {columns.map((col) => (
                    <div
                      key={col.key}
                      role="cell"
                      className={cn(
                        'min-w-0 px-3',
                        col.align === 'right' && 'text-right',
                        col.mono && 'font-mono text-xs tabular-nums',
                      )}
                    >
                      {col.render(row)}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
