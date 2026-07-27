import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, Legend,
  LineChart, Line,
} from 'recharts';
import {
  DollarSign, TrendingUp, Target, BarChart3, PieChart as PieIcon,
  Calendar, Percent, Trophy, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import { type CRMDeal, DEAL_STAGES } from '@/hooks/useCRMDeals';

const formatCurrency = (v: number) => {
  if (v >= 1000000) return `£${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `£${(v / 1000).toFixed(1)}K`;
  return `£${v.toFixed(0)}`;
};

interface ForecastProps {
  analytics: {
    totalPipeline: number;
    weightedPipeline: number;
    totalWon: number;
    totalLost: number;
    winRate: number;
    avgDealSize: number;
    activeCount: number;
    wonCount: number;
    lostCount: number;
    forecast: { month: string; projected: number; weighted: number }[];
    stageDistribution: { stage: string; key: string; color: string; count: number; value: number }[];
    winLossHistory: { month: string; won: number; lost: number; wonValue: number; lostValue: number }[];
  };
  deals: CRMDeal[];
}

export function DealForecast({ analytics, deals }: ForecastProps) {
  // Cashflow calendar (deals with expected close dates in next 90 days)
  const cashflowDeals = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + 90);
    return deals
      .filter(d => d.expected_close_date && d.stage !== 'lost' && d.stage !== 'won')
      .filter(d => {
        const close = new Date(d.expected_close_date!);
        return close >= now && close <= end;
      })
      .sort((a, b) => new Date(a.expected_close_date!).getTime() - new Date(b.expected_close_date!).getTime());
  }, [deals]);

  const metrics = [
    { label: 'Pipeline Value', value: formatCurrency(analytics.totalPipeline), sub: `${analytics.activeCount} active deals`, icon: DollarSign, color: '#60a5fa', bg: 'rgba(96,165,250,0.08)' },
    { label: 'Weighted Forecast', value: formatCurrency(analytics.weightedPipeline), sub: 'Probability-adjusted', icon: Target, color: '#a78bfa', bg: 'rgba(167,139,250,0.08)' },
    { label: 'Won Revenue', value: formatCurrency(analytics.totalWon), sub: `${analytics.wonCount} deals closed`, icon: Trophy, color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    { label: 'Win Rate', value: `${analytics.winRate.toFixed(0)}%`, sub: `${analytics.wonCount}W / ${analytics.lostCount}L`, icon: Percent, color: '#fbbf24', bg: 'rgba(251,191,36,0.08)' },
    { label: 'Avg Deal Size', value: formatCurrency(analytics.avgDealSize), sub: 'From won deals', icon: BarChart3, color: '#f97316', bg: 'rgba(249,115,22,0.08)' },
    { label: 'Lost Revenue', value: formatCurrency(analytics.totalLost), sub: `${analytics.lostCount} deals lost`, icon: ArrowDownRight, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ backgroundColor: '#222', border: '1px solid #333', borderRadius: 8, padding: '8px 12px' }}>
        <p className="text-[10px] font-semibold text-[#ccc] mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} className="text-[10px]" style={{ color: p.color }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ minHeight: 0 }}>
      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {metrics.map(m => (
          <div
            key={m.label}
            className="rounded-xl p-3"
            style={{ backgroundColor: m.bg, border: `1px solid ${m.color}15` }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <m.icon className="h-3 w-3" style={{ color: m.color }} />
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: m.color }}>{m.label}</span>
            </div>
            <div className="text-lg font-bold text-[#eee]">{m.value}</div>
            <div className="text-[9px] text-[#666] mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Revenue Forecast Chart */}
        <div className="rounded-xl p-4" style={{ backgroundColor: '#181818', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <TrendingUp className="h-3.5 w-3.5 text-[#a78bfa]" />
            <span className="text-[11px] font-semibold text-[#ccc]">Revenue Forecast (6 Months)</span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.forecast}>
                <defs>
                  <linearGradient id="projGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="wgtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="projected" name="Projected" stroke="#60a5fa" fill="url(#projGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="weighted" name="Weighted" stroke="#22c55e" fill="url(#wgtGrad)" strokeWidth={2} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#888' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Win/Loss Analytics */}
        <div className="rounded-xl p-4" style={{ backgroundColor: '#181818', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 className="h-3.5 w-3.5 text-[#fbbf24]" />
            <span className="text-[11px] font-semibold text-[#ccc]">Win/Loss Analytics (6 Months)</span>
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.winLossHistory} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="wonValue" name="Won" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="lostValue" name="Lost" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#888' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stage Distribution */}
        <div className="rounded-xl p-4" style={{ backgroundColor: '#181818', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <PieIcon className="h-3.5 w-3.5 text-[#60a5fa]" />
            <span className="text-[11px] font-semibold text-[#ccc]">Pipeline by Stage</span>
          </div>
          <div className="flex items-center gap-4">
            <div style={{ width: 140, height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.stageDistribution.filter(s => s.value > 0)}
                    dataKey="value"
                    nameKey="stage"
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    strokeWidth={0}
                  >
                    {analytics.stageDistribution.filter(s => s.value > 0).map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5">
              {analytics.stageDistribution.map(s => (
                <div key={s.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[10px] text-[#999]">{s.stage}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-[#666]">{s.count} deals</span>
                    <span className="text-[10px] font-semibold text-[#ccc]">{formatCurrency(s.value)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expected Cashflow Calendar */}
        <div className="rounded-xl p-4" style={{ backgroundColor: '#181818', border: '1px solid #2a2a2a' }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Calendar className="h-3.5 w-3.5 text-[#34d399]" />
            <span className="text-[11px] font-semibold text-[#ccc]">Expected Cashflow (90 Days)</span>
          </div>
          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
            {cashflowDeals.length === 0 && (
              <div className="text-center py-6 text-[10px] text-[#555]">No deals with expected close dates in the next 90 days</div>
            )}
            {cashflowDeals.map(deal => {
              const close = new Date(deal.expected_close_date!);
              const daysUntil = Math.ceil((close.getTime() - Date.now()) / 86400000);
              const stageConfig = DEAL_STAGES.find(s => s.key === deal.stage);
              return (
                <div
                  key={deal.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2"
                  style={{ backgroundColor: '#222', border: '1px solid #2a2a2a' }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-1.5 h-8 rounded-full" style={{ backgroundColor: stageConfig?.color || '#666' }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-semibold text-[#ccc] truncate">{deal.deal_name}</div>
                      <div className="text-[9px] text-[#666]">{deal.company_name || 'No company'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-[#22c55e]">{formatCurrency(Number(deal.deal_value))}</div>
                      <div className="text-[9px] text-[#888]">{deal.probability}% likely</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-medium text-[#ddd]">
                        {close.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className={`text-[9px] font-medium ${daysUntil <= 7 ? 'text-[#ef4444]' : daysUntil <= 30 ? 'text-[#fbbf24]' : 'text-[#666]'}`}>
                        {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil}d away`}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
