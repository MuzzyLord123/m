import { useAIModelSettings, AI_MODELS, AIModelId } from '@/hooks/useAIModelSettings';
import { ChevronDown, Cpu, Zap, Crown, Bolt } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SPEED_COLORS: Record<string, string> = {
  Fastest: '#22c55e',
  Fast: '#3b82f6',
  Medium: '#f59e0b',
  Slow: '#ef4444',
};

const QUALITY_ICONS: Record<string, typeof Zap> = {
  Best: Crown,
  High: Zap,
  Good: Bolt,
  Basic: Cpu,
};

export function AIModelSelect() {
  const { activeModel, updateModel, loading } = useAIModelSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = AI_MODELS.find(m => m.id === activeModel);

  if (loading) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-all hover:bg-[#333]"
        style={{ border: '1px solid #333', color: '#999' }}
      >
        <Cpu className="w-3 h-3" style={{ color: SPEED_COLORS[current?.speed || 'Fast'] }} />
        <span className="max-w-[80px] truncate">{current?.label || 'Select Model'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 rounded-xl overflow-hidden z-50 w-[260px]"
            style={{ backgroundColor: '#1e1e1e', border: '1px solid #333', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
          >
            <div className="p-2 space-y-0.5">
              <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider" style={{ color: '#555' }}>
                AI Engine
              </div>

              {/* Group by provider */}
              {['Google', 'OpenAI'].map(provider => (
                <div key={provider}>
                  <div className="px-2 py-1 text-[8px] font-bold uppercase tracking-widest" style={{ color: '#444' }}>
                    {provider}
                  </div>
                  {AI_MODELS.filter(m => m.provider === provider).map(model => {
                    const QualityIcon = QUALITY_ICONS[model.quality] || Cpu;
                    const isActive = activeModel === model.id;
                    return (
                      <button
                        key={model.id}
                        onClick={() => { updateModel(model.id as AIModelId); setOpen(false); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-all"
                        style={{
                          backgroundColor: isActive ? 'rgba(0,115,230,0.1)' : 'transparent',
                          border: `1px solid ${isActive ? 'rgba(0,115,230,0.2)' : 'transparent'}`,
                        }}
                      >
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                          style={{ backgroundColor: isActive ? 'rgba(0,115,230,0.15)' : '#2a2a2a' }}
                        >
                          <QualityIcon className="w-3 h-3" style={{ color: isActive ? '#4da3ff' : '#888' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium" style={{ color: isActive ? '#4da3ff' : '#ccc' }}>
                            {model.label}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] flex items-center gap-0.5" style={{ color: SPEED_COLORS[model.speed] }}>
                              ● {model.speed}
                            </span>
                            <span className="text-[9px]" style={{ color: '#555' }}>
                              {model.quality} quality
                            </span>
                          </div>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#0073E6' }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
