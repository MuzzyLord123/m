import { useMemo, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useTemperament } from './temperament';
import { EmptyState, ErrorState, SkeletonTable } from './states';

/**
 * The platform table: sticky header on a sunken tone, hairline rows,
 * honest sort indicators, right-aligned tabular numerics, optional
 * bulk-select with an action bar, designed empty/loading/error states,
 * and an explicit mobile transformation (card list via `mobileCard`, or
 * priority columns via `hideBelowMd` on secondary columns). Client-side
 * presentation only — data arrives exactly as the screen already
 * fetched it.
 */
export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  /** Value used for client-side sorting; omit to disable sorting. */
  sortValue?: (row: T) => string | number | null | undefined;
  align?: 'left' | 'right';
  /** Numeric/ID column: mono + tabular. */
  mono?: boolean;
  width?: string;
  /** Secondary column that gives way on phones (priority-columns pattern). */
  hideBelowMd?: boolean;
}

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  loading = false,
  error = false,
  onRetry,
  empty,
  onRowClick,
  selectable = false,
  selected,
  onSelectedChange,
  bulkActions,
  mobileCard,
  defaultSort,
  className,
  'aria-label': ariaLabel,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  empty?: { title: string; body?: string; action?: { label: string; onClick: () => void } };
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selected?: Set<string>;
  onSelectedChange?: (next: Set<string>) => void;
  /** Rendered in the action bar when rows are selected. */
  bulkActions?: (selected: Set<string>) => ReactNode;
  /** Phone rendering for this table; falls back to priority columns. */
  mobileCard?: (row: T) => ReactNode;
  defaultSort?: { key: string; dir: 'asc' | 'desc' };
  className?: string;
  'aria-label'?: string;
}) {
  const t = useTemperament();
  const rowH = t === 'office' ? 'h-10' : 'h-11';
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(
    defaultSort ?? null,
  );
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

  const toggleSort = (key: string) =>
    setSort((s) =>
      s?.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );

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

  if (loading) return <SkeletonTable cols={Math.min(columns.length, 5)} className={className} />;
  if (error) return <ErrorState compact onRetry={onRetry} className={className} />;
  if (sorted.length === 0)
    return (
      <EmptyState
        compact
        title={empty?.title ?? 'Nothing here yet'}
        body={empty?.body}
        action={empty?.action}
        className={className}
      />
    );

  return (
    <div className={cn('relative', className)}>
      {/* Bulk action bar */}
      {selectable && sel.size > 0 && (
        <div className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/60 bg-card px-3 py-2">
          <span className="font-mono text-[10.5px] tabular-nums text-ink-2">
            {sel.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">{bulkActions?.(sel)}</div>
        </div>
      )}

      {/* Phone: card list when provided */}
      {mobileCard && (
        <ul className="md:hidden">
          {sorted.map((row) => (
            <li key={rowKey(row)} className="border-b border-border/60 last:border-b-0">
              {mobileCard(row)}
            </li>
          ))}
        </ul>
      )}

      {/* Table (≥md when mobileCard exists, always otherwise) */}
      <div
        className={cn('overflow-x-auto', mobileCard && 'hidden md:block')}
      >
        <table className="w-full border-collapse text-[13px]" aria-label={ariaLabel}>
          <thead>
            <tr className="sticky top-0 z-10 bg-sunken">
              {selectable && (
                <th className="w-9 border-b border-border/60 px-3 py-0 text-left">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all rows"
                    className="translate-y-[1px]"
                  />
                </th>
              )}
              {columns.map((col) => {
                const active = sort?.key === col.key;
                const sortable = !!col.sortValue;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    style={col.width ? { width: col.width } : undefined}
                    aria-sort={active ? (sort!.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={cn(
                      'border-b border-border/60 px-3 py-2 font-mono text-[9.5px] font-medium uppercase tracking-[0.13em] text-muted-foreground',
                      col.align === 'right' ? 'text-right' : 'text-left',
                      col.hideBelowMd && 'hidden md:table-cell',
                    )}
                  >
                    {sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className={cn(
                          'inline-flex items-center gap-1 uppercase tracking-[0.13em] transition-colors hover:text-foreground',
                          active && 'text-foreground',
                        )}
                      >
                        {col.header}
                        {active &&
                          (sort!.dir === 'asc' ? (
                            <ArrowUp className="h-2.5 w-2.5" />
                          ) : (
                            <ArrowDown className="h-2.5 w-2.5" />
                          ))}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const id = rowKey(row);
              const isSel = sel.has(id);
              return (
                <tr
                  key={id}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    rowH,
                    'border-b border-border/60 transition-colors duration-150',
                    onRowClick && 'cursor-pointer hover:bg-foreground/[0.025]',
                    isSel && 'bg-primary/[0.05]',
                  )}
                >
                  {selectable && (
                    <td className="px-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSel}
                        onCheckedChange={() => toggleOne(id)}
                        aria-label="Select row"
                        className="translate-y-[1px]"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3',
                        col.align === 'right' && 'text-right',
                        col.mono && 'font-mono text-xs tabular-nums',
                        col.hideBelowMd && 'hidden md:table-cell',
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
