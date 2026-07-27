import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Users, Eye, TrendingUp, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar
} from 'recharts';

type Row = { path: string; referrer: string | null; session_id: string | null; created_at: string };

const RANGES = [
  { label: '24h', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export default function AdminSiteAnalytics() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data } = await (supabase as any)
      .from('marketing_page_views')
      .select('path, referrer, session_id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(50000);
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [days]);

  const stats = useMemo(() => {
    const total = rows.length;
    const sessions = new Set(rows.map(r => r.session_id).filter(Boolean)).size;
    const uniquePages = new Set(rows.map(r => r.path)).size;
    const last24 = rows.filter(r => new Date(r.created_at).getTime() > Date.now() - 86400000).length;
    return { total, sessions, uniquePages, last24 };
  }, [rows]);

  const timeSeries = useMemo(() => {
    const buckets = new Map<string, { date: string; views: number; sessions: Set<string> }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { date: key, views: 0, sessions: new Set() });
    }
    for (const r of rows) {
      const key = r.created_at.slice(0, 10);
      const b = buckets.get(key);
      if (b) {
        b.views += 1;
        if (r.session_id) b.sessions.add(r.session_id);
      }
    }
    return Array.from(buckets.values()).map(b => ({
      date: b.date.slice(5),
      views: b.views,
      visitors: b.sessions.size,
    }));
  }, [rows, days]);

  const topPages = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => map.set(r.path, (map.get(r.path) || 0) + 1));
    return Array.from(map.entries())
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [rows]);

  const topReferrers = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach(r => {
      let src = 'Direct';
      if (r.referrer) {
        try { src = new URL(r.referrer).hostname.replace(/^www\./, ''); }
        catch { src = r.referrer.slice(0, 40); }
      }
      map.set(src, (map.get(src) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([source, views]) => ({ source, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8);
  }, [rows]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-semibold">Site Analytics</h1>
          <p className="text-sm text-muted-foreground">Foot traffic to the public Quooro website.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {RANGES.map(r => (
            <Button key={r.days} size="sm" variant={days === r.days ? 'default' : 'outline'} onClick={() => setDays(r.days)}>
              {r.label}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={<Eye className="h-4 w-4" />} label="Total page views" value={stats.total} />
        <StatCard icon={<Users className="h-4 w-4" />} label="Unique visitors" value={stats.sessions} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Pages visited" value={stats.uniquePages} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Last 24h" value={stats.last24} />
      </div>

      {/* Traffic over time */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic over time</CardTitle>
          <CardDescription>Views and unique visitors per day</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeSeries} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gVisitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--brand, var(--primary)))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--brand, var(--primary)))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#gViews)" strokeWidth={2} />
              <Area type="monotone" dataKey="visitors" stroke="hsl(var(--brand, var(--primary)))" fill="url(#gVisitors)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top pages</CardTitle>
            <CardDescription>Most visited paths in this range</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPages} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="path" type="category" width={140} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top referrers</CardTitle>
            <CardDescription>Where visitors came from</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topReferrers} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                <YAxis dataKey="source" type="category" width={140} stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="views" fill="hsl(var(--brand, var(--primary)))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {!loading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">
          No page views recorded yet in this range. Visits will appear here as people browse the public site.
        </p>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-2">
          {icon}<span>{label}</span>
        </div>
        <div className="text-2xl font-semibold">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}
