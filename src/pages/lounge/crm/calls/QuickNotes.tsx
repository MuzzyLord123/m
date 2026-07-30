import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { NOTE_PRESETS, NOTE_TIERS, applyPreset, type NotePreset } from './callNotePresets';

/**
 * The call note: eight one-tap presets across four tiers, then a box
 * that stays editable so anything worth spelling out can be added on
 * top. Used from the desk console, the phone companion and the call
 * ledgers, so a note reads the same wherever it was written.
 */

const TIER_CLASS: Record<string, string> = {
  good: 'border-ok/45 text-ok hover:bg-ok/[0.08]',
  decent: 'border-border/70 text-foreground/85 hover:bg-foreground/[0.05]',
  bad: 'border-attend/45 text-attend hover:bg-attend/[0.08]',
  very_bad: 'border-risk/45 text-risk hover:bg-risk/[0.08]',
};

export function QuickNotePresets({
  value,
  onChange,
  onOutcome,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  onOutcome?: (outcome: string) => void;
  className?: string;
}) {
  const apply = (p: NotePreset) => {
    onChange(applyPreset(value, p));
    if (p.outcome && onOutcome) onOutcome(p.outcome);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {NOTE_TIERS.map(tier => (
        <div key={tier.tier} className="flex items-center gap-2">
          <span className="w-[52px] shrink-0 font-mono text-[8.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {tier.label}
          </span>
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {NOTE_PRESETS.filter(p => p.tier === tier.tier).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => apply(p)}
                title={p.text}
                className={cn(
                  'h-7 rounded-lg border px-2.5 text-[11.5px] transition-colors',
                  TIER_CLASS[p.tier],
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CallNoteEditor({
  value,
  onChange,
  onOutcome,
  placeholder = 'What was agreed, next step',
  rows,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  onOutcome?: (outcome: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2.5', className)}>
      <QuickNotePresets value={value} onChange={onChange} onOutcome={onOutcome} />
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="min-h-[72px] text-[13px]"
      />
    </div>
  );
}
