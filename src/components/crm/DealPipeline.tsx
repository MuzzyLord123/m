import { useState, useMemo, useEffect } from 'react';
import {
  Plus, Clock, CheckCircle2, XCircle, GripVertical, Building2,
} from 'lucide-react';
import { type CRMDeal, DEAL_STAGES } from '@/hooks/useCRMDeals';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Money, StatusDot, type Tone } from '@/components/platform';

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

/* ─── Pipeline Board ─── */
export function DealPipelineBoard({ deals, onUpdateDeal, onSelectDeal, onCreateDeal }: {
  deals: CRMDeal[];
  onUpdateDeal: (id: string, updates: Partial<CRMDeal>) => void;
  onSelectDeal: (deal: CRMDeal) => void;
  onCreateDeal: (stage?: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const activeStages = DEAL_STAGES.filter(s => s.key !== 'won' && s.key !== 'lost');
  const stageDeals = useMemo(() => {
    const map: Record<string, CRMDeal[]> = {};
    DEAL_STAGES.forEach(s => { map[s.key] = []; });
    deals.forEach(d => {
      if (map[d.stage]) map[d.stage].push(d);
      else map['qualification'].push(d);
    });
    return map;
  }, [deals]);

  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedId(dealId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverStage(stage);
  };

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    if (draggedId) {
      const stageConfig = DEAL_STAGES.find(s => s.key === stage);
      const updates: Partial<CRMDeal> = { stage };
      if (stageConfig) updates.probability = stageConfig.probability;
      if (stage === 'won') { updates.won = true; updates.actual_close_date = new Date().toISOString().split('T')[0]; }
      if (stage === 'lost') { updates.won = false; updates.actual_close_date = new Date().toISOString().split('T')[0]; }
      onUpdateDeal(draggedId, updates);
    }
    setDraggedId(null);
    setDragOverStage(null);
  };

  return (
    <div className={cn('flex-1 gap-2 p-3', isMobile ? 'flex flex-col overflow-y-auto' : 'flex overflow-x-auto')} style={{ minHeight: 0 }}>
      {activeStages.map(stage => {
        const sDeals = stageDeals[stage.key] || [];
        const total = sDeals.reduce((s, d) => s + Number(d.deal_value), 0);
        const isOver = dragOverStage === stage.key;
        const tone = STAGE_TONES[stage.key] ?? 'neutral';

        return (
          <div
            key={stage.key}
            className={cn(
              'flex flex-col rounded-[10px] border transition-colors duration-150',
              isMobile ? 'w-full' : 'w-[240px] flex-shrink-0',
              isOver ? 'border-primary/50 bg-primary/[0.04]' : 'border-border/60 bg-card',
            )}
            onDragOver={(e) => handleDragOver(e, stage.key)}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => handleDrop(e, stage.key)}
          >
            {/* Stage header */}
            <div className="border-b border-border/60 px-3 py-2.5">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <StatusDot tone={tone} />
                  <span className="text-[11px] font-medium text-foreground">{stage.label}</span>
                  <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{sDeals.length}</span>
                </div>
                <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{stage.probability}%</span>
              </div>
              <Money value={total} whole className="font-mono text-[10.5px] text-ink-2" />
            </div>

            {/* Cards */}
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2" style={{ maxHeight: isMobile ? 'none' : 'calc(100vh - 260px)' }}>
              {sDeals.map(deal => (
                <div
                  key={deal.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, deal.id)}
                  onDragEnd={() => setDraggedId(null)}
                  onClick={() => onSelectDeal(deal)}
                  className={cn(
                    'group cursor-pointer rounded-lg border border-border/60 bg-background p-2.5 transition-colors duration-150',
                    draggedId === deal.id ? 'opacity-40' : 'hover:border-primary/40',
                  )}
                >
                  <div className="mb-1.5 flex items-start justify-between">
                    <span className="flex-1 truncate text-[11px] font-medium text-foreground">{deal.deal_name}</span>
                    <GripVertical className="h-3 w-3 flex-shrink-0 cursor-grab text-muted-foreground/50 opacity-0 group-hover:opacity-100" />
                  </div>
                  {deal.company_name && (
                    <div className="mb-1 flex items-center gap-1">
                      <Building2 className="h-2.5 w-2.5 text-muted-foreground/70" />
                      <span className="truncate text-[9px] text-muted-foreground">{deal.company_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Money value={Number(deal.deal_value)} whole className="font-mono text-[10.5px] text-foreground" />
                    {deal.expected_close_date && (
                      <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {format(new Date(deal.expected_close_date), 'd MMM')}
                      </span>
                    )}
                  </div>
                  {/* Probability meter */}
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-foreground/[0.06]">
                    <div
                      className="h-full rounded-full bg-primary/50 transition-[width] duration-150"
                      style={{ width: `${deal.probability}%` }}
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={() => onCreateDeal(stage.key)}
                className="flex h-8 w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 text-[10px] text-muted-foreground transition-colors duration-150 hover:border-primary/40 hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> Add deal
              </button>
            </div>
          </div>
        );
      })}

      {/* Won / Lost columns (compact) */}
      {['won', 'lost'].map(key => {
        const stage = DEAL_STAGES.find(s => s.key === key)!;
        const sDeals = stageDeals[key] || [];
        const total = sDeals.reduce((s, d) => s + Number(d.deal_value), 0);
        const tone = STAGE_TONES[key] ?? 'neutral';
        return (
          <div
            key={key}
            className={cn(
              'flex flex-col rounded-[10px] border transition-colors duration-150',
              isMobile ? 'w-full' : 'w-[180px] flex-shrink-0',
              dragOverStage === key ? 'border-primary/50 bg-primary/[0.04]' : 'border-border/60 bg-sunken',
            )}
            onDragOver={(e) => handleDragOver(e, key)}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => handleDrop(e, key)}
          >
            <div className="border-b border-border/60 px-3 py-2">
              <div className="flex items-center gap-1.5">
                {key === 'won' ? <CheckCircle2 className="h-3 w-3 text-ok" /> : <XCircle className="h-3 w-3 text-risk" />}
                <span className={cn('text-[10px] font-medium', TONE_TEXT[tone])}>{stage.label}</span>
                <span className="font-mono text-[9px] tabular-nums text-muted-foreground">{sDeals.length}</span>
              </div>
              <Money value={total} whole className="mt-0.5 font-mono text-[10px] text-muted-foreground" />
            </div>
            <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-1.5" style={{ maxHeight: 200 }}>
              {sDeals.slice(0, 8).map(deal => (
                <div
                  key={deal.id}
                  onClick={() => onSelectDeal(deal)}
                  className="cursor-pointer rounded-md border border-border/60 bg-background px-2 py-1.5 transition-colors duration-150 hover:border-primary/40"
                >
                  <div className="truncate text-[10px] font-medium text-ink-2">{deal.deal_name}</div>
                  <Money value={Number(deal.deal_value)} whole className={cn('font-mono text-[9px]', TONE_TEXT[tone])} />
                </div>
              ))}
              {sDeals.length > 8 && <div className="text-center text-[9px] text-muted-foreground">+{sDeals.length - 8} more</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
