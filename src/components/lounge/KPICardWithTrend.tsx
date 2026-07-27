import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface KPIProps {
  label: string;
  value: number;
  sub: string;
  color: string;
  trend: 'up' | 'down' | 'flat';
  trendValue?: string;
  sparkline?: number[];
  onClick?: () => void;
  pulse?: boolean;
}

export default function KPICardWithTrend({ label, value, sub, color, trend, trendValue, sparkline, onClick, pulse }: KPIProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#34d399' : trend === 'down' ? '#ef4444' : 'hsl(var(--muted-foreground))';

  const sparkData = (sparkline || []).map((v, i) => ({ i, v }));

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className={`group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 bg-card border border-border/40 hover:border-foreground/[0.08] hover:shadow-premium-sm ${
        pulse ? 'ring-1 ring-destructive/40 animate-pulse' : ''
      }`}
    >
      {/* Subtle ambient corner glow */}
      <div className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-[0.06] pointer-events-none" style={{ backgroundColor: color }} />

      <div className="flex items-center justify-between mb-3">
        <div className="h-6 w-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        </div>
        <div className="flex items-center gap-1">
          <TrendIcon className="w-3 h-3" style={{ color: trendColor }} />
          {trendValue && (
            <span className="text-[9px] font-semibold" style={{ color: trendColor }}>
              {trendValue}
            </span>
          )}
          <ArrowUpRight className="w-3 h-3 text-muted-foreground/20 group-hover:text-muted-foreground/60 transition-colors ml-0.5" />
        </div>
      </div>

      <p className="text-2xl font-display font-bold text-foreground tabular-nums tracking-tight">{value}</p>
      <p className="text-[11px] font-semibold text-foreground/70 mt-1">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>

      {/* Sparkline */}
      {sparkData.length > 1 && (
        <div className="mt-3 h-[28px] opacity-50 group-hover:opacity-80 transition-opacity">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.button>
  );
}
