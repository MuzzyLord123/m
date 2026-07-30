import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { FIELD_LABEL } from '../formStyles';

/**
 * Multi-condition filter builder — pure client-side. The screen declares
 * its filterable fields; conditions are applied to already-fetched rows
 * with `applyFilters`. Nothing here touches the network.
 */
export type FilterOp = 'is' | 'is_not' | 'contains' | 'gt' | 'lt' | 'empty' | 'not_empty';

export interface FilterFieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
}

export interface FilterCondition {
  id: string;
  field: string;
  op: FilterOp;
  value: string;
}

const OP_LABEL: Record<FilterOp, string> = {
  is: 'is', is_not: 'is not', contains: 'contains',
  gt: 'over', lt: 'under', empty: 'is empty', not_empty: 'is set',
};

const OPS_BY_TYPE: Record<FilterFieldDef['type'], FilterOp[]> = {
  text: ['contains', 'is', 'is_not', 'empty', 'not_empty'],
  number: ['gt', 'lt', 'is', 'empty', 'not_empty'],
  select: ['is', 'is_not', 'empty', 'not_empty'],
};

export function applyFilters<T extends Record<string, unknown>>(
  rows: T[],
  conditions: FilterCondition[],
): T[] {
  if (!conditions.length) return rows;
  return rows.filter((row) =>
    conditions.every((c) => {
      const raw = row[c.field];
      const cell = raw == null ? '' : String(raw);
      switch (c.op) {
        case 'is': return cell.toLowerCase() === c.value.toLowerCase();
        case 'is_not': return cell.toLowerCase() !== c.value.toLowerCase();
        case 'contains': return cell.toLowerCase().includes(c.value.toLowerCase());
        case 'gt': return parseFloat(cell) > parseFloat(c.value);
        case 'lt': return parseFloat(cell) < parseFloat(c.value);
        case 'empty': return cell === '';
        case 'not_empty': return cell !== '';
        default: return true;
      }
    }),
  );
}

export function FilterBuilder({
  fields,
  conditions,
  onChange,
  className,
}: {
  fields: FilterFieldDef[];
  conditions: FilterCondition[];
  onChange: (next: FilterCondition[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [draftField, setDraftField] = useState(fields[0]?.key ?? '');
  const [draftOp, setDraftOp] = useState<FilterOp>('contains');
  const [draftValue, setDraftValue] = useState('');

  const fieldDef = fields.find((f) => f.key === draftField) ?? fields[0];
  const needsValue = draftOp !== 'empty' && draftOp !== 'not_empty';

  const add = () => {
    if (needsValue && !draftValue.trim()) return;
    onChange([
      ...conditions,
      { id: `f-${Date.now().toString(36)}-${conditions.length}`, field: draftField, op: draftOp, value: draftValue.trim() },
    ]);
    setDraftValue('');
    setOpen(false);
  };

  const remove = (id: string) => onChange(conditions.filter((c) => c.id !== id));

  const select =
    'h-8 rounded-lg border border-border/60 bg-foreground/[0.03] px-2 text-xs text-foreground';

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {conditions.map((c) => {
        const f = fields.find((x) => x.key === c.field);
        return (
          <span
            key={c.id}
            className="flex h-7 items-center gap-1.5 rounded-lg border border-border bg-foreground/[0.04] px-2.5 text-[11.5px]"
          >
            <span className="text-muted-foreground">{f?.label ?? c.field}</span>
            <span>{OP_LABEL[c.op]}</span>
            {c.value && <span className="font-medium">{c.value}</span>}
            <button
              type="button"
              aria-label="Remove filter"
              onClick={() => remove(c.id)}
              className="ml-0.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <Plus className="h-3 w-3" /> Add filter
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 space-y-2.5 rounded-xl border-border/60 bg-popover p-3">
          <span className={FIELD_LABEL}>Filter</span>
          <select
            className={cn(select, 'w-full')}
            value={draftField}
            onChange={(e) => {
              setDraftField(e.target.value);
              const def = fields.find((f) => f.key === e.target.value);
              setDraftOp(OPS_BY_TYPE[def?.type ?? 'text'][0]);
            }}
          >
            {fields.map((f) => (
              <option key={f.key} value={f.key}>{f.label}</option>
            ))}
          </select>
          <select className={cn(select, 'w-full')} value={draftOp} onChange={(e) => setDraftOp(e.target.value as FilterOp)}>
            {OPS_BY_TYPE[fieldDef?.type ?? 'text'].map((op) => (
              <option key={op} value={op}>{OP_LABEL[op]}</option>
            ))}
          </select>
          {needsValue &&
            (fieldDef?.type === 'select' ? (
              <select className={cn(select, 'w-full')} value={draftValue} onChange={(e) => setDraftValue(e.target.value)}>
                <option value="">Choose</option>
                {fieldDef.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <input
                className={cn(select, 'w-full')}
                type={fieldDef?.type === 'number' ? 'number' : 'text'}
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && add()}
                placeholder={fieldDef?.type === 'number' ? '1000' : 'Value'}
              />
            ))}
          <button
            type="button"
            onClick={add}
            className="h-8 w-full rounded-lg bg-primary text-xs font-medium text-primary-foreground transition-[filter] hover:brightness-105"
          >
            Apply
          </button>
        </PopoverContent>
      </Popover>

      {conditions.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          className="h-7 px-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

/** Bulk-select action bar: count + the screen's existing actions. */
export function BulkBar({
  count,
  children,
  onClear,
  className,
}: {
  count: number;
  children: React.ReactNode;
  onClear: () => void;
  className?: string;
}) {
  if (count === 0) return null;
  return (
    <div
      className={cn(
        'sticky top-0 z-20 flex items-center gap-4 border-b border-border/60 bg-card px-4 py-2',
        className,
      )}
    >
      <span className="font-mono text-[11px] tabular-nums text-ink-2">{count} selected</span>
      <div className="flex items-center gap-3 text-xs">{children}</div>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Clear
      </button>
    </div>
  );
}
