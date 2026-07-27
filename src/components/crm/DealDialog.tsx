import { useState } from 'react';
import { X, DollarSign, Calendar, Percent, Building2, User, FileText, Tag } from 'lucide-react';
import { type CRMDeal, DEAL_STAGES } from '@/hooks/useCRMDeals';
import { AnimatePresence, motion } from 'framer-motion';

interface DealDialogProps {
  open: boolean;
  onClose: () => void;
  deal?: CRMDeal | null;
  defaultStage?: string;
  onSave: (data: Partial<CRMDeal>) => void;
  onDelete?: (id: string) => void;
}

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

  const inputStyle = {
    backgroundColor: '#222',
    border: '1px solid #333',
    borderRadius: 8,
    color: '#ddd',
    fontSize: 12,
    padding: '8px 12px',
    width: '100%',
    outline: 'none',
  } as const;

  const labelStyle = {
    fontSize: 10,
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2a2a2a]">
            <h3 className="text-[13px] font-bold text-[#eee]">{deal ? 'Edit Deal' : 'New Deal'}</h3>
            <button onClick={onClose} className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-[#333] transition-colors">
              <X className="h-3.5 w-3.5 text-[#666]" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4">
            {/* Deal Name */}
            <div>
              <div style={labelStyle}><FileText className="h-3 w-3" />Deal Name</div>
              <input
                style={inputStyle}
                value={form.deal_name || ''}
                onChange={e => setForm(prev => ({ ...prev, deal_name: e.target.value }))}
                placeholder="e.g. Website Redesign for Acme Corp"
              />
            </div>

            {/* Stage */}
            <div>
              <div style={labelStyle}><Tag className="h-3 w-3" />Stage</div>
              <div className="flex flex-wrap gap-1">
                {DEAL_STAGES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => handleStageChange(s.key)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all"
                    style={{
                      backgroundColor: form.stage === s.key ? `${s.color}20` : '#252525',
                      color: form.stage === s.key ? s.color : '#777',
                      border: `1px solid ${form.stage === s.key ? s.color + '40' : '#333'}`,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Value */}
              <div>
                <div style={labelStyle}><DollarSign className="h-3 w-3" />Deal Value (£)</div>
                <input
                  style={inputStyle}
                  type="number"
                  value={form.deal_value || ''}
                  onChange={e => setForm(prev => ({ ...prev, deal_value: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              {/* Probability */}
              <div>
                <div style={labelStyle}><Percent className="h-3 w-3" />Probability (%)</div>
                <input
                  style={inputStyle}
                  type="number"
                  min={0}
                  max={100}
                  value={form.probability ?? ''}
                  onChange={e => setForm(prev => ({ ...prev, probability: parseInt(e.target.value) || 0 }))}
                />
              </div>

              {/* Expected close */}
              <div>
                <div style={labelStyle}><Calendar className="h-3 w-3" />Expected Close</div>
                <input
                  style={inputStyle}
                  type="date"
                  value={form.expected_close_date || ''}
                  onChange={e => setForm(prev => ({ ...prev, expected_close_date: e.target.value || null }))}
                />
              </div>

              {/* Company */}
              <div>
                <div style={labelStyle}><Building2 className="h-3 w-3" />Company</div>
                <input
                  style={inputStyle}
                  value={form.company_name || ''}
                  onChange={e => setForm(prev => ({ ...prev, company_name: e.target.value || null }))}
                  placeholder="Company name"
                />
              </div>
            </div>

            {/* Contact */}
            <div>
              <div style={labelStyle}><User className="h-3 w-3" />Contact Name</div>
              <input
                style={inputStyle}
                value={form.contact_name || ''}
                onChange={e => setForm(prev => ({ ...prev, contact_name: e.target.value || null }))}
                placeholder="Contact person"
              />
            </div>

            {/* Description */}
            <div>
              <div style={labelStyle}>Description</div>
              <textarea
                style={{ ...inputStyle, minHeight: 60, resize: 'vertical' as any }}
                value={form.description || ''}
                onChange={e => setForm(prev => ({ ...prev, description: e.target.value || null }))}
                placeholder="Deal details..."
              />
            </div>

            {/* Lost reason (if lost) */}
            {form.stage === 'lost' && (
              <div>
                <div style={labelStyle}>Lost Reason</div>
                <input
                  style={inputStyle}
                  value={form.lost_reason || ''}
                  onChange={e => setForm(prev => ({ ...prev, lost_reason: e.target.value || null }))}
                  placeholder="Why was this deal lost?"
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-[#2a2a2a]">
            <div>
              {deal && onDelete && (
                <button
                  onClick={() => { onDelete(deal.id); onClose(); }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
                >
                  Delete Deal
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#888] hover:bg-[#333] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.deal_name?.trim()}
                className="px-4 py-1.5 rounded-lg text-[11px] font-semibold bg-[#0073E6] text-white hover:bg-[#005bb5] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : deal ? 'Update Deal' : 'Create Deal'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
