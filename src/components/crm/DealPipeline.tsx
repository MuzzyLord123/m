import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, DollarSign, Calendar, TrendingUp, ChevronDown, X,
  ArrowRight, Edit3, Trash2, BarChart3, Target, Clock,
  CheckCircle2, XCircle, GripVertical, Building2, User,
} from 'lucide-react';
import { type CRMDeal, DEAL_STAGES, useCRMDeals } from '@/hooks/useCRMDeals';
import { format, differenceInDays } from 'date-fns';

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

  const formatValue = (v: number) => {
    if (v >= 1000000) return `£${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `£${(v / 1000).toFixed(1)}K`;
    return `£${v.toFixed(0)}`;
  };

  return (
    <div className={`flex-1 ${isMobile ? 'flex flex-col overflow-y-auto' : 'flex overflow-x-auto'} gap-2 p-3`} style={{ minHeight: 0 }}>
      {activeStages.map(stage => {
        const sDeals = stageDeals[stage.key] || [];
        const total = sDeals.reduce((s, d) => s + Number(d.deal_value), 0);
        const isOver = dragOverStage === stage.key;

        return (
          <div
            key={stage.key}
            className={`flex flex-col rounded-xl ${isMobile ? 'w-full' : 'flex-shrink-0'} transition-all`}
            style={{
              width: isMobile ? '100%' : 240,
              backgroundColor: isOver ? `${stage.color}08` : '#181818',
              border: `1px solid ${isOver ? stage.color + '40' : '#2a2a2a'}`,
            }}
            onDragOver={(e) => handleDragOver(e, stage.key)}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => handleDrop(e, stage.key)}
          >
            {/* Stage header */}
            <div className="px-3 py-2.5 border-b border-[#2a2a2a]">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-[11px] font-semibold" style={{ color: stage.color }}>
                    {stage.label}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{ backgroundColor: `${stage.color}15`, color: stage.color }}>
                    {sDeals.length}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-[#666]">{stage.probability}%</span>
              </div>
              <div className="text-[10px] text-[#888] font-medium">{formatValue(total)}</div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 min-h-0" style={{ maxHeight: isMobile ? 'none' : 'calc(100vh - 260px)' }}>
              {sDeals.map(deal => (
                <motion.div
                  key={deal.id}
                  layout
                  draggable
                  onDragStart={(e: any) => handleDragStart(e, deal.id)}
                  onDragEnd={() => setDraggedId(null)}
                  onClick={() => onSelectDeal(deal)}
                  className={`rounded-lg p-2.5 cursor-pointer transition-all group ${
                    draggedId === deal.id ? 'opacity-40' : 'hover:border-[#444]'
                  }`}
                  style={{
                    backgroundColor: '#222',
                    border: '1px solid #2a2a2a',
                  }}
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-[#ddd] truncate flex-1">{deal.deal_name}</span>
                    <GripVertical className="h-3 w-3 text-[#444] opacity-0 group-hover:opacity-100 flex-shrink-0 cursor-grab" />
                  </div>
                  {deal.company_name && (
                    <div className="flex items-center gap-1 mb-1">
                      <Building2 className="h-2.5 w-2.5 text-[#555]" />
                      <span className="text-[9px] text-[#777] truncate">{deal.company_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#22c55e]">{formatValue(Number(deal.deal_value))}</span>
                    {deal.expected_close_date && (
                      <span className="text-[9px] text-[#666] flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {format(new Date(deal.expected_close_date), 'MMM d')}
                      </span>
                    )}
                  </div>
                  {/* Probability bar */}
                  <div className="mt-1.5 h-1 rounded-full bg-[#333] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${deal.probability}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </motion.div>
              ))}

              <button
                onClick={() => onCreateDeal(stage.key)}
                className="w-full h-8 rounded-lg border border-dashed border-[#333] text-[10px] text-[#555] hover:text-[#888] hover:border-[#555] flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="h-3 w-3" /> Add Deal
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
        return (
          <div
            key={key}
            className="flex flex-col rounded-xl flex-shrink-0"
            style={{
              width: 180,
              backgroundColor: dragOverStage === key ? `${stage.color}08` : '#151515',
              border: `1px solid ${dragOverStage === key ? stage.color + '40' : '#252525'}`,
              opacity: 0.85,
            }}
            onDragOver={(e) => handleDragOver(e, key)}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => handleDrop(e, key)}
          >
            <div className="px-3 py-2 border-b border-[#252525]">
              <div className="flex items-center gap-1.5">
                {key === 'won' ? <CheckCircle2 className="h-3 w-3 text-[#22c55e]" /> : <XCircle className="h-3 w-3 text-[#ef4444]" />}
                <span className="text-[10px] font-semibold" style={{ color: stage.color }}>{stage.label}</span>
                <span className="text-[9px] text-[#666]">{sDeals.length}</span>
              </div>
              <div className="text-[10px] text-[#666] mt-0.5">{formatValue(total)}</div>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1 min-h-0" style={{ maxHeight: 200 }}>
              {sDeals.slice(0, 8).map(deal => (
                <div
                  key={deal.id}
                  onClick={() => onSelectDeal(deal)}
                  className="rounded-md px-2 py-1.5 cursor-pointer hover:bg-[#222] transition-colors"
                  style={{ backgroundColor: '#1a1a1a' }}
                >
                  <div className="text-[10px] font-medium text-[#bbb] truncate">{deal.deal_name}</div>
                  <div className="text-[9px] font-bold" style={{ color: stage.color }}>{formatValue(Number(deal.deal_value))}</div>
                </div>
              ))}
              {sDeals.length > 8 && <div className="text-[9px] text-[#555] text-center">+{sDeals.length - 8} more</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
