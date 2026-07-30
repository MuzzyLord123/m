import { useState } from 'react';
import { X, PoundSterling, Calendar, Percent, Building2, User, FileText, Tag } from 'lucide-react';
import { type CRMDeal, DEAL_STAGES } from '@/hooks/useCRMDeals';
import { cn } from '@/lib/utils';
import { StatusDot, type Tone } from '@/components/platform';

interface DealDialogProps {
  open: boolean;
  onClose: () => void;
  deal?: CRMDeal | null;
  defaultStage?: string;
  onSave: (data: Partial<CRMDeal>) => void;
  onDelete?: (id: string) => void;
}

/* Deal stages resolve to the platform tone vocabulary at the render site —
   the DEAL_STAGES hex rainbow in the hook is no longer read for colour. */
const STAGE_TONES: Record<string, Tone> = {
  qualification: 'neutral',
  discovery: 'neutral',
  proposal: 'attend',
  negotiation: 'attend',
  closing: 'accent',
  won: 'ok',
  lost: 'risk',
};

const TONE_TEXT: Record<Tone, string> = {
  ok: 'text-ok', attend: 'text-attend', risk: 'text-risk',
  neutral: 'text-ink-2', accent: 'text-primary',
};
const TONE_BG: Record<Tone, string> = {
  ok: 'bg-ok/10', attend: 'bg-attend/10', risk: 'bg-risk/10',
  neutral: 'bg-foreground/[0.06]', accent: 'bg-primary/12',
};

/* Compact field recipe for the instrument surface */
const FIELD_SM =
  'w-full rounded-lg border border-border/60 bg-foreground/[0.03] px-3 py-2 text-[12px] text-foreground outline-none transition-colors duration-150 focus:border-primary/60 placeholder:text-muted-foreground/60';
const LABEL_SM =
  'mb-1 flex items-center gap-1 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground';

export function DealDialog({ open, onClose, deal, defaultStage, onSave, onDelete }: DealDialogProps) {
  const [form, setForm] = useState<Partial<CRMDeal>>(() => deal ? { ...deal } : {
    deal_name: '',
    stage: defaultStage || 'qualification',
    probability: DEAL_STAGES.find(s => s.key === (defaultStage || 'qualification'))?.probability ?? 20,
    deal_value: 0,
    currency: 'GBP',
    expected_close_date: null,
    contact_name: null,
    company_name: null,
    description: null,
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    if (!form.deal_name?.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  const handleStageChange = (stage: string) => {
    const stageConfig = DEAL_STAGES.find(s => s.key === stage);
    setForm(prev => ({ ...prev, stage, probability: stageConfig?.probability ?? prev.probability }));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={deal ? 'Edit deal' : 'New deal'}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border/60 bg-card"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h3 className="text-[13px] font-semibold text-foreground">{deal ? 'Edit deal' : 'New deal'}</h3>
          <button onClick={onClose} aria-label="Close" className="flex h-6 w-6 items-center justify-center rounded-md transition-colors duration-150 hover:bg-foreground/[0.06]">
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Deal name */}
          <div>
            <div className={LABEL_SM}><FileText className="h-3 w-3" />Deal name</div>
            <input
              className={FIELD_SM}
              value={form.deal_name || ''}
              onChange={e => setForm(prev => ({ ...prev, deal_name: e.target.value }))}
              placeholder="e.g. Website redesign for Acme Corp"
            />
          </div>

          {/* Stage */}
          <div>
            <div className={LABEL_SM}><Tag className="h-3 w-3" />Stage</div>
            <div className="flex flex-wrap gap-1.5">
              {DEAL_STAGES.map(s => {
                const tone = STAGE_TONES[s.key] ?? 'neutral';
                const isActive = form.stage === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => handleStageChange(s.key)}
                    className={cn(
                      'flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[10px] font-medium transition-colors duration-150',
                      isActive
                        ? cn(TONE_BG[tone], TONE_TEXT[tone], 'border-border/60')
                        : 'border-transparent bg-sunken text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {isActive && <StatusDot tone={tone} />}
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Value */}
            <div>
              <div className={LABEL_SM}><PoundSterling className="h-3 w-3" />Deal value (£)</div>
              <input
                className={FIELD_SM}
                type="number"
                value={form.deal_value || ''}
                onChange={e => setForm(prev => ({ ...prev, deal_value: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>

            {/* Probability */}
            <div>
              <div className={LABEL_SM}><Percent className="h-3 w-3" />Probability (%)</div>
              <input
                className={FIELD_SM}
                type="number"
                min={0}
                max={100}
                value={form.probability ?? ''}
                onChange={e => setForm(prev => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
              />
            </div>

            {/* Expected close */}
            <div>
              <div className={LABEL_SM}><Calendar className="h-3 w-3" />Expected close</div>
              <input
                className={FIELD_SM}
                type="date"
                value={form.expected_close_date || ''}
                onChange={e => setForm(prev => ({ ...prev, expected_close_date: e.target.value || null }))}
              />
            </div>

            {/* Company */}
            <div>
              <div className={LABEL_SM}><Building2 className="h-3 w-3" />Company</div>
              <input
                className={FIELD_SM}
                value={form.company_name || ''}
                onChange={e => setForm(prev => ({ ...prev, company_name: e.target.value || null }))}
                placeholder="Company name"
              />
            </div>
          </div>

          {/* Contact */}
          <div>
            <div className={LABEL_SM}><User className="h-3 w-3" />Contact name</div>
            <input
              className={FIELD_SM}
              value={form.contact_name || ''}
              onChange={e => setForm(prev => ({ ...prev, contact_name: e.target.value || null }))}
              placeholder="Contact person"
            />
          </div>

          {/* Description */}
          <div>
            <div className={LABEL_SM}>Description</div>
            <textarea
              className={cn(FIELD_SM, 'min-h-[60px] resize-y')}
              value={form.description || ''}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value || null }))}
              placeholder="Deal details…"
            />
          </div>

          {/* Lost reason (if lost) */}
          {form.stage === 'lost' && (
            <div>
              <div className={LABEL_SM}>Lost reason</div>
              <input
                className={FIELD_SM}
                value={form.lost_reason || ''}
                onChange={e => setForm(prev => ({ ...prev, lost_reason: e.target.value || null }))}
                placeholder="Why was this deal lost?"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
          <div>
            {deal && onDelete && (
              <button
                onClick={() => { onDelete(deal.id); onClose(); }}
                className="h-8 rounded-lg px-3 text-[11px] font-medium text-risk transition-colors duration-150 hover:bg-risk/10"
              >
                Delete deal
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-8 rounded-lg px-3 text-[11px] font-medium text-muted-foreground transition-colors duration-150 hover:bg-foreground/[0.06]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.deal_name?.trim()}
              className="h-8 rounded-lg bg-primary px-4 text-[11px] font-medium text-primary-foreground transition-[filter] duration-150 hover:brightness-105 disabled:opacity-50"
            >
              {saving ? 'Saving…' : deal ? 'Update deal' : 'Create deal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
