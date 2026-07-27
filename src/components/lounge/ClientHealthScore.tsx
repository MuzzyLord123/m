import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock, CreditCard, Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthData {
  lastLogin: string | null;
  contentPending: number;
  contentDelivered: number;
  appProjects: number;
  activeProjects: number;
  messageCount: number;
  hasOverduePayments: boolean;
  websiteStatus: string | null;
}

interface ScoreDimension {
  label: string;
  score: number;
  icon: React.ElementType;
  color: string;
  description: string;
}

function calcEngagement(data: HealthData): number {
  let s = 40;
  if (data.contentDelivered > 0) s += 15;
  if (data.contentPending > 0) s += 10;
  if (data.appProjects > 0) s += 15;
  if (data.activeProjects > 0) s += 10;
  if (data.websiteStatus === 'live') s += 10;
  return Math.min(100, s);
}

function calcResponsiveness(data: HealthData): number {
  let s = 50;
  if (data.lastLogin) {
    const days = (Date.now() - new Date(data.lastLogin).getTime()) / 86400000;
    if (days < 1) s = 95;
    else if (days < 3) s = 80;
    else if (days < 7) s = 65;
    else if (days < 14) s = 45;
    else s = 25;
  }
  return s;
}

function calcPaymentHealth(data: HealthData): number {
  return data.hasOverduePayments ? 35 : 90;
}

function calcSatisfaction(data: HealthData): number {
  let s = 60;
  if (data.messageCount > 0) s += 10;
  if (data.contentDelivered > 0) s += 15;
  if (data.websiteStatus === 'live') s += 15;
  return Math.min(100, s);
}

function getScoreColor(score: number) {
  if (score >= 80) return '#34d399';
  if (score >= 60) return '#fbbf24';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Attention';
  return 'At Risk';
}

function getTrendIcon(score: number) {
  if (score >= 70) return TrendingUp;
  if (score >= 45) return Minus;
  return TrendingDown;
}

export default function ClientHealthScore({ data }: { data: HealthData }) {
  const dimensions: ScoreDimension[] = useMemo(() => [
    { label: 'Engagement', score: calcEngagement(data), icon: Activity, color: '#a78bfa', description: 'Project activity & content usage' },
    { label: 'Responsiveness', score: calcResponsiveness(data), icon: Clock, color: '#60a5fa', description: 'Login frequency & platform usage' },
    { label: 'Payments', score: calcPaymentHealth(data), icon: CreditCard, color: '#34d399', description: 'Payment status & billing health' },
    { label: 'Satisfaction', score: calcSatisfaction(data), icon: Heart, color: '#f472b6', description: 'Content delivery & project completion' },
  ], [data]);

  const overall = useMemo(() => Math.round(dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length), [dimensions]);
  const overallColor = getScoreColor(overall);
  const TrendIcon = getTrendIcon(overall);

  return (
    <div>
      {/* Overall Score Ring + Label */}
      <div className="flex items-center gap-5 mb-5">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.5" fill="none" stroke="#2a2a2a" strokeWidth="3" />
            <motion.circle
              cx="18" cy="18" r="15.5" fill="none"
              stroke={overallColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${overall * 0.974} 100`}
              initial={{ strokeDasharray: '0 100' }}
              animate={{ strokeDasharray: `${overall * 0.974} 100` }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              className="text-xl font-bold text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {overall}
            </motion.span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendIcon className="w-3.5 h-3.5" style={{ color: overallColor }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: overallColor }}>
              {getScoreLabel(overall)}
            </span>
          </div>
          <p className="text-[10px] text-[#777] leading-relaxed">
            Auto-calculated from engagement, responsiveness, payment history, and satisfaction signals.
          </p>
        </div>
      </div>

      {/* Dimension Bars */}
      <div className="space-y-3">
        {dimensions.map(d => (
          <div key={d.label} title={d.description}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <d.icon className="w-3 h-3" style={{ color: d.color }} />
                <span className="text-[10px] font-medium text-[#999]">{d.label}</span>
              </div>
              <span className="text-[10px] font-bold tabular-nums" style={{ color: getScoreColor(d.score) }}>
                {d.score}%
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#2a2a2a' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: getScoreColor(d.score) }}
                initial={{ width: 0 }}
                animate={{ width: `${d.score}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
