import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

/* ── types ── */
interface ChartProps {
  contentByStatus: Record<string, number>;
  appsByStatus: Record<string, number>;
  weeklyActivity: { day: string; content: number; apps: number; messages: number }[];
}

const PIE_COLORS = ['#60a5fa', '#a78bfa', '#fbbf24', '#34d399', '#f472b6', '#f97316'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-[10px] shadow-lg">
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-muted-foreground">
          <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
          {p.name}: <span className="font-semibold text-foreground">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

export default function DashboardCharts({ contentByStatus, appsByStatus, weeklyActivity }: ChartProps) {
  /* project status donut data */
  const projectPie = useMemo(() => {
    const merged: Record<string, number> = {};
    Object.entries(appsByStatus).forEach(([k, v]) => (merged[k] = (merged[k] || 0) + v));
    return Object.entries(merged).map(([name, value]) => ({ name, value }));
  }, [appsByStatus]);

  /* content pipeline bar data */
  const contentBar = useMemo(
    () => Object.entries(contentByStatus).map(([name, value]) => ({ name, value })),
    [contentByStatus]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      {/* ─ Weekly Activity Area Chart ─ */}
      <div className="lg:col-span-2 rounded-lg bg-card border border-border">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <BarChart3 className="w-3.5 h-3.5 text-[#60a5fa]" />
          <span className="text-[11px] font-semibold text-foreground/80">Weekly Activity</span>
        </div>
        <div className="p-4 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyActivity}>
              <defs>
                <linearGradient id="gContent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gApps" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gMsgs" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="content" name="Content" stroke="#fbbf24" fill="url(#gContent)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="apps" name="Apps" stroke="#60a5fa" fill="url(#gApps)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="messages" name="Messages" stroke="#34d399" fill="url(#gMsgs)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─ Right column: Donut + Bar ─ */}
      <div className="flex flex-col gap-3">
        {/* Project Status Donut */}
        <div className="rounded-lg bg-card border border-border flex-1">
          <div className="px-4 py-2.5 border-b border-border">
            <span className="text-[11px] font-semibold text-foreground/80">Project Status</span>
          </div>
          <div className="h-[100px] flex items-center justify-center">
            {projectPie.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={projectPie} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {projectPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-[10px] text-muted-foreground">No projects yet</span>
            )}
          </div>
        </div>

        {/* Content Pipeline Bar */}
        <div className="rounded-lg bg-card border border-border flex-1">
          <div className="px-4 py-2.5 border-b border-border">
            <span className="text-[11px] font-semibold text-foreground/80">Content Pipeline</span>
          </div>
          <div className="h-[100px] p-2">
            {contentBar.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={contentBar} layout="vertical">
                  <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#a78bfa" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-[10px] text-muted-foreground">No content yet</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
